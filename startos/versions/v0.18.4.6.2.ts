import { IMPOSSIBLE, VersionInfo, YAML } from '@start9labs/start-sdk'
import { existsSync } from 'fs'
import { chown, readdir, readFile, rename, rm } from 'fs/promises'
import { join } from 'path'
import { walletRpcConfFile } from '../fileModels/monero-wallet-rpc.conf'
import { moneroConfFile } from '../fileModels/monero.conf'
import { storeJson } from '../fileModels/store.json'
import { zmqPort, zmqPubsubPort } from '../utils'

// Chown the path BEFORE recursing so we gain traversal access to dirs
// whose mode would otherwise lock us out. Silent on failure — best-effort.
async function chownRecursive(path: string, uid: number, gid: number) {
  try {
    await chown(path, uid, gid)
  } catch {
    return
  }
  let entries
  try {
    entries = await readdir(path, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) {
      await chownRecursive(full, uid, gid)
    } else {
      await chown(full, uid, gid).catch(() => {})
    }
  }
}

interface OldCredentials {
  enabled: 'enabled' | 'disabled'
  username: string
  password: string
}

interface OldPeer {
  hostname: string
  port: number
  prioritynode: boolean
}

interface OldConfigYaml {
  rpc?: {
    'rpc-credentials'?: OldCredentials
    'wallet-rpc-credentials'?: OldCredentials
  }
  advanced?: {
    zmq?: boolean
    pruning?: boolean
    p2p?: {
      maxnumoutpeers?: number
      maxnuminpeers?: number
      letneighborsgossip?: boolean
      publicrpc?: boolean
      strictnodes?: boolean
      peer?: OldPeer[]
    }
    tor?: {
      rpcban?: boolean
      toronly?: boolean
      maxsocksconns?: number
      maxonionconns?: number
      dandelion?: boolean
    }
  }
  ratelimit?: {
    kbpsup?: number
    kbpsdown?: number
  }
  txpool?: {
    maxbytes?: number
  }
}

export const v_0_18_4_6_2 = VersionInfo.of({
  version: '0.18.4.6:2',
  releaseNotes: {
    en_US:
      'Fix 0.3.x → 0.4 migration: normalize legacy `main` volume ownership so the migration can read and write inside it.',
    es_ES:
      'Corrección de la migración 0.3.x → 0.4: normaliza la propiedad del volumen `main` heredado para que la migración pueda leer y escribir en él.',
    de_DE:
      'Fix für die Migration 0.3.x → 0.4: Eigentum des Legacy-`main`-Volumes wird normalisiert, damit die Migration darin lesen und schreiben kann.',
    pl_PL:
      'Poprawka migracji 0.3.x → 0.4: normalizuje uprawnienia starszego woluminu `main`, aby migracja mogła w nim odczytywać i zapisywać.',
    fr_FR:
      'Correctif de migration 0.3.x → 0.4 : normalise la propriété du volume `main` hérité afin que la migration puisse y lire et écrire.',
  },
  migrations: {
    up: async ({ effects }) => {
      // 0.3.x monerod ran the container as UID 30234 / GID 302340 (the
      // legacy Dockerfile rewrote /etc/passwd) with `main` mounted in.
      // GID 302340 is outside the 0.4 idmap window (host 100000..165535),
      // so the migration sandbox sees `main` and `main/start9` as
      // overflow-owned and non-traversable. Normalize to sandbox-uid 0 —
      // which equals host 100000, also = container-root in the new
      // monerod/wallet containers (same idmap) — before any other host
      // fs op. main.ts's chown oneshots re-chown to monero:monero on
      // first start.
      await chownRecursive('/media/startos/volumes/main', 0, 0)

      // Read old config.yaml if it exists
      const configYaml: OldConfigYaml | undefined = await readFile(
        '/media/startos/volumes/main/start9/config.yaml',
        'utf-8',
      ).then(YAML.parse, () => undefined)

      if (configYaml) {
        const { rpc, advanced, ratelimit, txpool } = configYaml
        const p2p = advanced?.p2p
        const tor = advanced?.tor
        const rpcCreds = rpc?.['rpc-credentials']
        const walletCreds = rpc?.['wallet-rpc-credentials']
        const peerAddr = (p: OldPeer) => `${p.hostname}:${p.port}`

        const gossipEnabled = p2p?.letneighborsgossip !== false

        // Migrate Tor intents into store.json. Tor-related monerod keys
        // (proxy / tx-proxy / anonymous-inbound / pad-transactions) are NOT
        // written to monero.conf — main.ts synthesises those CLI args at
        // runtime from the intents plus the live Tor container IP.
        if (tor) {
          const toronlyActive = tor.toronly === true
          await storeJson.merge(effects, {
            outboundProxy: toronlyActive ? 'tor' : 'none',
            padTransactions: false,
            torOutbound: toronlyActive,
            torInbound: toronlyActive,
            // null on these three = use monerod's upstream default (16, 16,
            // noise enabled). Only carry over explicit user values.
            torMaxOutboundConns: tor.maxsocksconns ?? null,
            torMaxInboundConns: tor.maxonionconns ?? null,
            torDandelionNoise: tor.dandelion === false ? false : null,
          })
        }

        // Build monero.conf from old config — zod .catch() fills missing defaults
        const confSettings: Record<string, any> = {}

        if (p2p?.maxnumoutpeers != null) {
          confSettings['out-peers'] = p2p.maxnumoutpeers
        }
        if (p2p?.maxnuminpeers != null) {
          confSettings['in-peers'] = p2p.maxnuminpeers
        }
        if (ratelimit?.kbpsup != null) {
          confSettings['limit-rate-up'] = ratelimit.kbpsup
        }
        if (ratelimit?.kbpsdown != null) {
          confSettings['limit-rate-down'] = ratelimit.kbpsdown
        }
        if (txpool?.maxbytes != null) {
          confSettings['max-txpool-weight'] = txpool.maxbytes * 1000000
        }

        if (rpcCreds?.enabled === 'enabled') {
          confSettings['rpc-login'] =
            `${rpcCreds.username}:${rpcCreds.password}`
        }

        if (advanced?.zmq) {
          confSettings['no-zmq'] = undefined
          confSettings['zmq-rpc-bind-ip'] = '0.0.0.0'
          confSettings['zmq-rpc-bind-port'] = zmqPort
          confSettings['zmq-pub'] = `tcp://0.0.0.0:${zmqPubsubPort}`
        }

        if (tor?.rpcban) {
          confSettings['disable-rpc-ban'] = undefined
        }

        if (!gossipEnabled) {
          confSettings['hide-my-port'] = 1
        }
        confSettings['igd'] = !gossipEnabled ? 'disabled' : undefined

        if (p2p?.publicrpc) {
          confSettings['public-node'] = 1
        }

        if (advanced?.pruning) {
          confSettings['prune-blockchain'] = 1
        }

        // `ban-list` path is enforced via zod literal in monero.conf; the
        // list contents are now managed via the Ban List action.
        //
        // `block-notify` is a free-text field managed via the Other Settings
        // action. It is not auto-configured here — dependent services that
        // want block notifications should set it via their own mechanisms.

        // Peers
        const peers = p2p?.peer
        if (peers && peers.length > 0) {
          if (p2p?.strictnodes) {
            confSettings['add-exclusive-node'] = peers.map(peerAddr)
          } else {
            const regular = peers.filter((p) => !p.prioritynode)
            const priority = peers.filter((p) => p.prioritynode)
            if (regular.length > 0) {
              confSettings['add-peer'] = regular.map(peerAddr)
            }
            if (priority.length > 0) {
              confSettings['add-priority-node'] = priority.map(peerAddr)
            }
          }
        }

        await moneroConfFile.merge(effects, confSettings)

        // Build wallet-rpc conf — zod .catch() fills missing defaults
        const walletSettings: Record<string, any> = {}
        if (walletCreds?.enabled === 'enabled') {
          walletSettings['rpc-login'] =
            `${walletCreds.username}:${walletCreds.password}`
          walletSettings['disable-rpc-login'] = undefined
        }
        if (rpcCreds?.enabled === 'enabled') {
          walletSettings['daemon-login'] =
            `${rpcCreds.username}:${rpcCreds.password}`
        }
        await walletRpcConfFile.merge(effects, walletSettings)
      } else {
        // No 0.3.x config to migrate. `merge` is a no-op when the file
        // already exists (preserves any customizations the user made on
        // a clean :1 install) and seeds defaults if it doesn't.
        await moneroConfFile.merge(effects, {})
        await walletRpcConfFile.merge(effects, {})
      }

      // Remove old files
      await rm('/media/startos/volumes/main/start9/config.yaml', {
        force: true,
      }).catch(console.error)
      await rm('/media/startos/volumes/main/start9/stats.yaml', {
        force: true,
      }).catch(console.error)

      // Move blockchain data from main volume to monerod volume
      for (const item of ['lmdb', 'p2pstate.bin', 'logs']) {
        const src = `/media/startos/volumes/main/${item}`
        if (existsSync(src)) {
          await rename(src, `/media/startos/volumes/monerod/${item}`).catch(
            console.error,
          )
        }
      }

      // Move wallet files from main volume to wallet volume root
      const walletSrc = '/media/startos/volumes/main/wallets'
      if (existsSync(walletSrc)) {
        const items = await readdir(walletSrc)
        for (const item of items) {
          await rename(
            `${walletSrc}/${item}`,
            `/media/startos/volumes/wallet/${item}`,
          ).catch(console.error)
        }
        await rm(walletSrc, { recursive: true, force: true }).catch(
          console.error,
        )
      }
    },
    down: IMPOSSIBLE,
  },
})
