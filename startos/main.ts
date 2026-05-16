import { createHash, randomBytes } from 'node:crypto'
import { rm } from 'fs/promises'
import { moneroConfFile } from './fileModels/monero.conf'
import { walletRpcConfFile } from './fileModels/monero-wallet-rpc.conf'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  p2pLocalBindPort,
  p2pPort,
  rpcRestrictedPort,
  torSocksPort,
  walletRpcPort,
} from './utils'

type RpcCreds = { username: string; password: string }

/**
 * monerod's RPC servers use HTTP Digest authentication when --rpc-login is
 * set. Both the unrestricted and restricted RPC ports share the same auth
 * config, so the in-container sync-progress health check needs to speak
 * Digest too. This is a minimal RFC 7616 client: one initial request, parse
 * the 401 challenge, then a second request with the computed response.
 */
async function digestFetch(
  url: string,
  method: string,
  body: string,
  contentType: string,
  creds: RpcCreds | null,
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': contentType }
  const res = await fetch(url, { method, headers, body })
  if (res.status !== 401 || !creds) return res

  const challenge = parseDigestChallenge(res.headers.get('www-authenticate'))
  if (!challenge?.realm || !challenge.nonce) return res

  const uri = new URL(url).pathname || '/'
  const qop = challenge.qop?.split(',')[0]?.trim() || 'auth'
  const nc = '00000001'
  const cnonce = randomBytes(8).toString('hex')
  const md5 = (s: string) => createHash('md5').update(s).digest('hex')
  const ha1 = md5(`${creds.username}:${challenge.realm}:${creds.password}`)
  const ha2 = md5(`${method}:${uri}`)
  const response = md5(
    `${ha1}:${challenge.nonce}:${nc}:${cnonce}:${qop}:${ha2}`,
  )

  const parts = [
    `username="${creds.username}"`,
    `realm="${challenge.realm}"`,
    `nonce="${challenge.nonce}"`,
    `uri="${uri}"`,
    `qop=${qop}`,
    `nc=${nc}`,
    `cnonce="${cnonce}"`,
    `response="${response}"`,
  ]
  if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`)
  if (challenge.algorithm) parts.push(`algorithm=${challenge.algorithm}`)

  return fetch(url, {
    method,
    headers: { ...headers, Authorization: `Digest ${parts.join(', ')}` },
    body,
  })
}

function parseDigestChallenge(
  header: string | null,
): Record<string, string> | null {
  if (!header) return null
  const m = header.match(/^\s*Digest\s+(.+)$/i)
  if (!m) return null
  const out: Record<string, string> = {}
  // key=value, with values either quoted or token form
  for (const [, k, q, t] of m[1].matchAll(
    /(\w+)\s*=\s*(?:"([^"]*)"|([^,\s]+))/g,
  )) {
    out[k] = q ?? t
  }
  return out
}

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Monero!'))

  // Watch monero.conf / wallet conf so the daemons restart when either
  // changes. The form-shape values pulled out here drive auth and CLI args
  // below; restarts are automatic because const() tracks them as deps.
  const monConf = await moneroConfFile.read().const(effects)
  const walletConf = await walletRpcConfFile.read().const(effects)

  // Daemon RPC credentials — used to talk to monerod from the in-container
  // sync-progress health check via HTTP Digest. Null when creds are off.
  const rpcCreds: RpcCreds | null = (() => {
    const c = monConf?.['rpc-credentials']
    if (c?.selection !== 'enabled') return null
    const username = c.value?.username
    const password = c.value?.password
    if (!username || !password) return null
    return { username, password }
  })()

  // wallet-rpc daemon refuses to start without either --rpc-login or
  // --disable-rpc-login. The user's choice lives in monero-wallet-rpc.conf's
  // rpc-login key; presence/absence here decides which CLI flag to add.
  const walletDisableRpcLogin = !walletConf?.['rpc-login']

  // Anonymity intents live in store.json and drive the Tor CLI args below.
  // init seeds store.json, so the read is guaranteed non-null here.
  const store = (await storeJson.read().const(effects))!
  const anyTorUse =
    store.outboundProxy === 'tor' || store.torOutbound || store.torInbound

  // Tor container IP — restarts monerod if it changes
  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()

  // Peer interface reachability — restarts monerod if either value changes.
  //   onionHost: own onion hostname (from the Tor plugin), needed for
  //     --anonymous-inbound
  //   hasPublicIpv4: whether a public IPv4 is published, gating clearnet
  //     inbound (without one, monerod can only make outbound clearnet conns)
  const { onionHost: peerOnionHost, hasPublicIpv4 } =
    await sdk.serviceInterface
      .getOwn(effects, 'peer', (iface) => {
        const pub = iface?.addressInfo?.public
        return {
          onionHost:
            pub?.filter({ pluginId: 'tor' }).hostnames[0]?.hostname ?? '',
          hasPublicIpv4:
            (pub?.filter({ kind: 'ipv4' }).hostnames.length ?? 0) > 0,
        }
      })
      .const()

  // Track Tor running status for health check display (no restart)
  let torRunning = false
  if (torIp) {
    sdk.getStatus(effects, { packageId: 'tor' }).onChange((status) => {
      torRunning = status?.desired.main === 'running'
      return { cancel: false }
    })
  }

  // monerod requires --tx-proxy for the tor zone whenever --anonymous-inbound
  // is configured for tor (otherwise the daemon errors at startup), so any
  // active inbound implies tx-proxy must be set too.
  const inboundReady = !!(torIp && store.torInbound && peerOnionHost)
  const txProxyActive = !!(torIp && (store.torOutbound || inboundReady))

  const anonymityArgs: string[] = []
  if (torIp && store.outboundProxy === 'tor') {
    anonymityArgs.push('--proxy', `${torIp}:${torSocksPort}`)
  }
  if (txProxyActive) {
    const txProxy =
      `tor,${torIp}:${torSocksPort},${store.torMaxOutboundConns ?? 16}` +
      (store.torDandelionNoise === false ? ',disable_noise' : '')
    anonymityArgs.push('--tx-proxy', txProxy)
  }
  if (inboundReady) {
    anonymityArgs.push(
      '--anonymous-inbound',
      `${peerOnionHost}:${p2pPort},127.0.0.1:${p2pLocalBindPort},${store.torMaxInboundConns ?? 16}`,
    )
  }
  if (store.padTransactions) {
    anonymityArgs.push('--pad-transactions')
  }

  /**
   * ======================== Subcontainers ========================
   */
  const monerodSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'monerod' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'monerod',
      subpath: null,
      mountpoint: '/home/monero/.bitmonero',
      readonly: false,
    }),
    'monerod',
  )

  const walletRpcSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'wallet-rpc' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'wallet',
      subpath: null,
      mountpoint: '/home/monero/wallet',
      readonly: false,
    }),
    'wallet-rpc',
  )

  /**
   * ======================== Maintenance flags ========================
   */
  const { dbSalvage, resync } = (await storeJson.read().once()) || {
    dbSalvage: false,
    resync: false,
  }

  if (dbSalvage) {
    await monerodSub.exec(
      [
        'monerod',
        '--non-interactive',
        '--db-salvage',
        '--data-dir',
        '/home/monero/.bitmonero',
      ],
      { user: 'root' },
    )
    await storeJson.merge(effects, { dbSalvage: false })
  }

  if (resync) {
    await rm(`${monerodSub.rootfs}/home/monero/.bitmonero/lmdb`, {
      force: true,
      recursive: true,
    })
    await storeJson.merge(effects, { resync: false })
  }

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects)
    .addOneshot('seed-ban-list', {
      // The simple-monerod image bundles a community-maintained ban list at
      // /home/monero/ban_list.txt. Seed it into the volume on first start (or
      // when the volume's file is empty) so monerod actually picks it up;
      // user edits via the Edit Ban List action are preserved on subsequent
      // starts because the file is then non-empty.
      subcontainer: monerodSub,
      exec: {
        command: [
          'sh',
          '-c',
          'if [ ! -s /home/monero/.bitmonero/ban_list.txt ]; then if [ -f /home/monero/ban_list.txt ]; then cp /home/monero/ban_list.txt /home/monero/.bitmonero/ban_list.txt; else touch /home/monero/.bitmonero/ban_list.txt; fi; fi',
        ],
        user: 'root',
      },
      requires: [],
    })
    .addOneshot('chown-monerod', {
      subcontainer: monerodSub,
      exec: {
        command: ['chown', '-R', 'monero:monero', '/home/monero/.bitmonero'],
        user: 'root',
      },
      requires: ['seed-ban-list'],
    })
    .addOneshot('chown-wallet', {
      subcontainer: walletRpcSub,
      exec: {
        command: ['chown', '-R', 'monero:monero', '/home/monero/wallet'],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('monerod', {
      subcontainer: monerodSub,
      exec: {
        command: [
          'monerod',
          '--non-interactive',
          '--config-file',
          '/home/monero/.bitmonero/monero.conf',
          ...anonymityArgs,
        ],
      },
      ready: {
        display: i18n('Monero Daemon'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, rpcRestrictedPort, {
            successMessage: i18n('Monero RPC is ready and accepting requests'),
            errorMessage: i18n('Monero RPC is unreachable'),
          }),
      },
      requires: ['chown-monerod'],
    })
    .addDaemon('wallet-rpc', {
      subcontainer: walletRpcSub,
      exec: {
        command: [
          'monero-wallet-rpc',
          '--non-interactive',
          '--config-file',
          '/home/monero/wallet/monero-wallet-rpc.conf',
          ...(walletDisableRpcLogin ? ['--disable-rpc-login'] : []),
        ],
      },
      ready: {
        display: i18n('Wallet RPC'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, walletRpcPort, {
            successMessage: i18n('Wallet RPC is ready'),
            errorMessage: i18n('Wallet RPC is unreachable'),
          }),
      },
      requires: ['monerod', 'chown-wallet'],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: i18n('Blockchain Sync Progress'),
        fn: async () => {
          try {
            const res = await digestFetch(
              `http://127.0.0.1:${rpcRestrictedPort}/json_rpc`,
              'POST',
              JSON.stringify({
                jsonrpc: '2.0',
                id: '0',
                method: 'get_info',
              }),
              'application/json',
              rpcCreds,
            )

            if (!res.ok) {
              return {
                message: `${i18n('Unexpected RPC response')}: ${res.status}`,
                result: 'failure',
              }
            }

            const info = ((await res.json()) as any)?.result
            if (info?.synchronized) {
              return {
                message: i18n('Monero is fully synced'),
                result: 'success',
              }
            }

            const height = info?.height ?? 0
            const target = info?.target_height ?? 0
            if (target > 0 && target > height) {
              const percentage = ((height * 100) / target).toFixed(2)
              return {
                message: i18n('Syncing blocks...${percentage}%', {
                  percentage,
                }),
                result: 'loading',
              }
            }

            return {
              message: i18n('Syncing blocks...'),
              result: 'loading',
            }
          } catch {
            return {
              message: i18n('Monero is starting…'),
              result: 'starting',
            }
          }
        },
      },
      requires: ['monerod'],
    })
    .addHealthCheck('tor', {
      ready: {
        display: 'Tor',
        fn: () => {
          if (!anyTorUse) {
            return {
              result: 'disabled',
              message: i18n('No Tor intents enabled'),
            }
          }
          if (!torIp) {
            return {
              result: 'disabled',
              message: i18n('Tor is not installed'),
            }
          }
          if (!torRunning) {
            return {
              result: 'disabled',
              message: i18n('Tor is not running'),
            }
          }
          if (store.torInbound && !peerOnionHost) {
            return {
              result: 'failure',
              message: i18n(
                'Inbound enabled but no .onion address on the Peer interface — add a Tor address to the Peer interface, then restart.',
              ),
            }
          }
          return {
            result: 'success',
            message: inboundReady
              ? i18n('Inbound and outbound connections')
              : i18n('Outbound only'),
          }
        },
      },
      requires: [],
    })
    .addHealthCheck('clearnet', {
      ready: {
        display: i18n('Clearnet'),
        fn: () => {
          if (store.outboundProxy !== 'none') {
            return {
              result: 'disabled',
              message: i18n('Excluded by outbound proxy'),
            }
          }
          return {
            result: 'success',
            message: hasPublicIpv4
              ? i18n('Inbound and outbound connections')
              : i18n(
                  'Outbound only. Publish an IP address to enable inbound.',
                ),
          }
        },
      },
      requires: [],
    })
})
