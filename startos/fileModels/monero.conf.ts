import { FileHelper, T, z } from '@start9labs/start-sdk'
import { banListPath } from './banList'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  p2pPort,
  rpcPort,
  rpcRestrictedPort,
  zmqPort,
  zmqPubsubPort,
} from '../utils'

// ── INI coercion helpers ────────────────────────────────────────────

const _iniString = z.union([
  z.array(z.string()).transform((a) => a.at(-1)!),
  z.string(),
])
const _iniNumber = z.union([
  z.array(z.string()).transform((a) => Number(a.at(-1))),
  z.string().transform(Number),
  z.number(),
])

const iniString = _iniString.optional().catch(undefined)
const iniNumber = _iniNumber.optional().catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

// ── INI shape (raw file keys) ───────────────────────────────────────

export const shape = z.object({
  // Enforced
  'data-dir': z
    .literal('/home/monero/.bitmonero')
    .catch('/home/monero/.bitmonero'),
  'log-level': z.literal('0,blockchain:INFO').catch('0,blockchain:INFO'),
  'log-file': z
    .literal('/home/monero/.bitmonero/logs/monerod.log')
    .catch('/home/monero/.bitmonero/logs/monerod.log'),
  'max-log-file-size': z.literal(10000000).catch(10000000),
  'max-log-files': z.literal(2).catch(2),
  'p2p-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'p2p-bind-port': z.literal(p2pPort).catch(p2pPort),
  'rpc-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'rpc-bind-port': z.literal(rpcPort).catch(rpcPort),
  'confirm-external-bind': z.literal(1).catch(1),
  'rpc-access-control-origins': z.literal('*').catch('*'),
  'rpc-restricted-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'rpc-restricted-bind-port': z
    .literal(rpcRestrictedPort)
    .catch(rpcRestrictedPort),
  'db-sync-mode': z.literal('safe:sync').catch('safe:sync'),
  'enforce-dns-checkpointing': z.literal(0).catch(0),
  'disable-dns-checkpoints': z.literal(1).catch(1),
  'check-updates': z.literal('disabled').catch('disabled'),
  igd: z.literal('disabled').catch('disabled'),

  // Configurable
  'out-peers': iniNumber,
  'in-peers': iniNumber,
  'limit-rate-up': iniNumber,
  'limit-rate-down': iniNumber,
  'max-txpool-weight': iniNumber,
  'rpc-login': iniString,
  'no-zmq': iniNumber,
  'zmq-rpc-bind-ip': iniString,
  'zmq-rpc-bind-port': iniNumber,
  'zmq-pub': iniString,
  'disable-rpc-ban': iniNumber,
  'hide-my-port': iniNumber,
  'public-node': iniNumber,
  'prune-blockchain': iniNumber,
  'block-notify': iniString,
  'add-peer': iniStringArray,
  'add-priority-node': iniStringArray,
  'add-exclusive-node': iniStringArray,

  // Enforced path — the ban-list file itself is managed by the Ban List
  // action via the banListFile file model at this path.
  'ban-list': z.literal(banListPath).catch(banListPath),

  // Enforced undefined — these are managed as CLI args in main.ts
  // (driven by store.json anonymity intents + live Tor container IP).
  // Hand-edits to monero.conf for these keys will be stripped on next read.
  'pad-transactions': z.undefined().catch(undefined),
  'tx-proxy': z.undefined().catch(undefined),
  proxy: z.undefined().catch(undefined),
  'anonymous-inbound': z.undefined().catch(undefined),
})

export type MoneroConf = z.infer<typeof shape>

// ── Master InputSpec (all user-facing config fields) ────────────────

const { InputSpec, Value, Variants, List } = sdk

const alphanumUnderscore = [
  {
    regex: '^[a-zA-Z0-9_]+$',
    description: i18n('Must be alphanumeric and/or can contain an underscore'),
  },
]

const peerSpec = InputSpec.of({
  hostname: Value.text({
    name: i18n('Hostname'),
    description: i18n('Domain name, onion or IP address of Monero peer.'),
    required: true,
    default: null,
    patterns: [
      {
        regex:
          '(^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$)|((^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)|(^[a-z2-7]{16}\\.onion$)|(^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$)',
        description: i18n('Hostname'),
      },
    ],
  }),
  port: Value.number({
    name: i18n('Port'),
    description: i18n(
      'TCP Port that peer is listening on for inbound p2p connections.',
    ),
    required: false,
    default: p2pPort,
    integer: true,
    min: 0,
    max: 65535,
  }),
  priority: Value.toggle({
    name: i18n('Priority Node'),
    description: i18n('Attempt to stay perpetually connected to this peer'),
    default: false,
  }),
})

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Other ──
  'max-txpool-weight': Value.number({
    name: i18n('Maximum TX Pool Size'),
    description: i18n(
      'Keep the unconfirmed transaction memory pool at or below this many megabytes. You may wish to decrease this if you are low on RAM, or increase if you are mining.',
    ),
    required: false,
    default: null,
    integer: true,
    min: 1,
    units: i18n('MiB'),
    footnote: `${i18n('Default')}: 648 MiB. ${i18n('Written to monero.conf as bytes.')}`,
  }),
  zmq: Value.triState({
    name: i18n('ZMQ Interface'),
    description: i18n(
      'Enable the ZeroMQ interface for real-time block and transaction notifications. Required by some services such as block explorers and mining software.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  pruning: Value.triState({
    name: i18n('Pruning'),
    description: i18n(
      'Blockchain pruning prunes proof data from transactions after verification but before storage. Saves roughly 2/3 of disk space.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  'block-notify': Value.text({
    name: i18n('Block Notify Command'),
    description: i18n(
      'Shell command monerod runs on every new block. The token `%s` is replaced by the block hash. Leave empty to disable. Example: /usr/bin/curl -so /dev/null https://example.com/notify/%s',
    ),
    required: false,
    default: null,
    placeholder: '/usr/bin/curl -so /dev/null https://example.com/notify/%s',
  }),

  // ── Networking ──
  'in-peers': Value.number({
    name: i18n('Max Peers Incoming'),
    description: i18n(
      'Maximum number of simultaneous peers connecting inbound to the Monero daemon.',
    ),
    required: false,
    default: null,
    integer: true,
    min: 0,
    max: 9999,
    footnote: `${i18n('Default')}: ${i18n('Unlimited')}`,
  }),
  'out-peers': Value.number({
    name: i18n('Max Peers Outgoing'),
    description: i18n(
      'Maximum number of simultaneous peers for the Monero daemon to connect outbound to.',
    ),
    required: false,
    default: null,
    integer: true,
    min: 0,
    max: 9999,
    footnote: `${i18n('Default')}: 12`,
  }),
  'hide-my-port': Value.triState({
    name: i18n('Hide My Port'),
    description: i18n(
      'Tell connected peers not to gossip your p2p port to the rest of the network. Enabling this makes your node more private but results in fewer inbound connections. Maps directly to monerod --hide-my-port.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  'public-node': Value.triState({
    name: i18n('Advertise RPC Remote Node'),
    description: i18n(
      'Advertise on the P2P network that your restricted RPC port offers Remote Node services. Caution: this could significantly increase resource use.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  'strict-nodes': Value.triState({
    name: i18n('Specific Nodes Only'),
    description: i18n(
      'Only connect to the peers specified below and no other peers.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  peer: Value.list(
    List.obj(
      {
        name: i18n('Add Peers'),
        description: i18n(
          'Optionally add addresses of specific p2p nodes that your Monero node should connect to',
        ),
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        spec: peerSpec,
        displayAs: '{{hostname}}:{{port}}',
        uniqueBy: 'hostname',
      },
    ),
  ),
  'disable-rpc-ban': Value.triState({
    name: i18n('Disable RPC Ban'),
    description: i18n(
      'Disable monerod banning RPC clients that generate errors. Enabling this may help prevent monerod from banning traffic originating from the Tor daemon. Maps directly to monerod --disable-rpc-ban.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Disabled')}`,
  }),
  'limit-rate-down': Value.number({
    name: i18n('Download Speed Limit'),
    description: i18n(
      "Keep the Monero p2p node's incoming bandwidth rate limited at or under this many kilobytes per second.",
    ),
    required: false,
    default: null,
    integer: true,
    min: 1,
    units: i18n('kB/s'),
    footnote: `${i18n('Default')}: 8192 kB/s`,
  }),
  'limit-rate-up': Value.number({
    name: i18n('Upload Speed Limit'),
    description: i18n(
      "Keep the Monero p2p node's outgoing bandwidth rate limited at or under this many kilobytes per second.",
    ),
    required: false,
    default: null,
    integer: true,
    min: 1,
    units: i18n('kB/s'),
    footnote: `${i18n('Default')}: 2048 kB/s`,
  }),

  // ── RPC ──
  'rpc-credentials': Value.union({
    name: i18n('RPC Credentials'),
    description: i18n(
      'Enable or disable a username and password to access the Monero RPC.',
    ),
    default: 'disabled',
    variants: Variants.of({
      disabled: {
        name: i18n('Disabled'),
        spec: InputSpec.of({}),
      },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          username: Value.text({
            name: i18n('RPC Username'),
            description: i18n(
              "The username for connecting to Monero's unrestricted RPC interface",
            ),
            warning: i18n(
              'Changing this value will necessitate a restart of all services that depend on Monero.',
            ),
            required: true,
            default: 'monero',
            patterns: alphanumUnderscore,
          }),
          password: Value.text({
            name: i18n('RPC Password'),
            description: i18n(
              "The password for connecting to Monero's unrestricted RPC interface",
            ),
            warning: i18n(
              'Changing this value will necessitate a restart of all services that depend on Monero.',
            ),
            required: true,
            default: { charset: 'a-z,A-Z,0-9', len: 22 },
            patterns: alphanumUnderscore,
            masked: true,
            generate: { charset: 'a-z,A-Z,0-9', len: 22 },
          }),
        }),
      },
    }),
  }),
})

// ── INI → Form (onRead) ────────────────────────────────────────────

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function parsePeerString(s: string): { hostname: string; port: number } | null {
  const [hostname, portStr] = s.split(':')
  if (!hostname) return null
  return { hostname, port: Number(portStr) || p2pPort }
}

function parseRpcLogin(login: string | undefined) {
  if (login) {
    const colonIdx = login.indexOf(':')
    if (colonIdx > 0) {
      return {
        selection: 'enabled' as const,
        value: {
          username: login.substring(0, colonIdx),
          password: login.substring(colonIdx + 1),
        },
      }
    }
  }
  return { selection: 'disabled' as const, value: {} }
}

function fileToForm(
  conf: MoneroConf,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const strictNodes = conf['add-exclusive-node'] !== undefined
  const hasRegularPeer =
    conf['add-peer'] !== undefined || conf['add-priority-node'] !== undefined

  const peer: Array<{
    hostname: string
    port: number | null
    priority: boolean
  }> = []
  if (strictNodes) {
    for (const node of toArray(conf['add-exclusive-node'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: false })
    }
  } else {
    for (const node of toArray(conf['add-peer'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: false })
    }
    for (const node of toArray(conf['add-priority-node'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: true })
    }
  }

  return {
    raw: conf,

    // Other
    'max-txpool-weight':
      conf['max-txpool-weight'] !== undefined
        ? Math.round(conf['max-txpool-weight'] / 1000000)
        : null,
    zmq:
      conf['no-zmq'] === 1
        ? false
        : conf['zmq-rpc-bind-port'] !== undefined
          ? true
          : null,
    pruning:
      conf['prune-blockchain'] === undefined
        ? null
        : conf['prune-blockchain'] !== 0,
    'block-notify': conf['block-notify'] ?? null,

    // Networking
    'in-peers': conf['in-peers'] ?? null,
    'out-peers': conf['out-peers'] ?? null,
    'hide-my-port':
      conf['hide-my-port'] === undefined ? null : conf['hide-my-port'] === 1,
    'public-node':
      conf['public-node'] === undefined ? null : conf['public-node'] !== 0,
    'strict-nodes': strictNodes ? true : hasRegularPeer ? false : null,
    peer,
    'disable-rpc-ban':
      conf['disable-rpc-ban'] === undefined
        ? null
        : conf['disable-rpc-ban'] === 1,
    'limit-rate-down': conf['limit-rate-down'] ?? null,
    'limit-rate-up': conf['limit-rate-up'] ?? null,

    // RPC
    'rpc-credentials': parseRpcLogin(conf['rpc-login']),
  }
}

// ── Form → INI (onWrite) ───────────────────────────────────────────

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): MoneroConf {
  const {
    raw: rawInput,
    'max-txpool-weight': maxTxpoolMiB,
    zmq,
    pruning,
    'block-notify': blockNotify,
    'hide-my-port': hideMyPort,
    'disable-rpc-ban': disableRpcBan,
    peer,
    'rpc-credentials': rpcCredentials,
    ...rest
  } = input

  // The shape's z.literal(X).catch(X) entries are the single source of truth
  // for enforced values. But FileHelper.ini validates through the InputSpec's
  // partialValidator — which permits `raw` to be undefined — so on the first
  // install seed (moneroConfFile.merge(effects, {})) `rawInput` arrives
  // undefined and `...raw` spreads nothing. Parsing through `shape` here
  // triggers each .catch() default exactly once, without duplicating any
  // literal. Idempotent on subsequent writes where `rawInput` is already
  // a fully-populated conf from onRead.
  const raw = shape.parse(rawInput ?? {})

  const peerAddr = (p: { hostname?: string; port?: number | null }) =>
    p.port != null ? `${p.hostname}:${p.port}` : (p.hostname ?? '')
  const peers = (peer ?? []).filter((p): p is NonNullable<typeof p> => !!p)
  const regular = peers.filter((p) => !p.priority)
  const priority = peers.filter((p) => p.priority)
  const strictMode = rest['strict-nodes'] === true

  const rpcLogin =
    rpcCredentials?.selection === 'enabled'
      ? `${rpcCredentials.value?.username}:${rpcCredentials.value?.password}`
      : undefined

  return {
    ...raw,

    // Other
    'max-txpool-weight':
      maxTxpoolMiB != null ? maxTxpoolMiB * 1000000 : undefined,
    'prune-blockchain': pruning == null ? undefined : pruning ? 1 : 0,
    'block-notify': blockNotify ? blockNotify : undefined,
    'no-zmq': zmq == null ? undefined : zmq ? 0 : 1,
    'zmq-rpc-bind-ip': zmq === true ? '0.0.0.0' : undefined,
    'zmq-rpc-bind-port': zmq === true ? zmqPort : undefined,
    'zmq-pub': zmq === true ? `tcp://0.0.0.0:${zmqPubsubPort}` : undefined,

    // Networking
    'out-peers': rest['out-peers'] ?? undefined,
    'in-peers': rest['in-peers'] ?? undefined,
    'limit-rate-up': rest['limit-rate-up'] ?? undefined,
    'limit-rate-down': rest['limit-rate-down'] ?? undefined,
    'disable-rpc-ban':
      disableRpcBan == null ? undefined : disableRpcBan ? 1 : 0,
    'public-node':
      rest['public-node'] == null ? undefined : rest['public-node'] ? 1 : 0,
    'hide-my-port': hideMyPort == null ? undefined : hideMyPort ? 1 : 0,
    'add-peer':
      !strictMode && regular.length > 0 ? regular.map(peerAddr) : undefined,
    'add-priority-node':
      !strictMode && priority.length > 0 ? priority.map(peerAddr) : undefined,
    'add-exclusive-node':
      strictMode && peers.length > 0 ? peers.map(peerAddr) : undefined,

    // RPC
    'rpc-login': rpcLogin,
  } as MoneroConf
}

// ── Stringify primitives for INI output ─────────────────────────────

function stringifyPrimitives(a: unknown): any {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) return a.map(stringifyPrimitives)
    return Object.fromEntries(
      Object.entries(a).map(([k, v]) => [k, stringifyPrimitives(v)]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

// ── File helper ─────────────────────────────────────────────────────

export const moneroConfFile = FileHelper.ini(
  {
    base: sdk.volumes.monerod,
    subpath: 'monero.conf',
  },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => {
      const base = shape.parse(a)
      return fileToForm(base)
    },
    onWrite: (a) => {
      return stringifyPrimitives(formToFile(a))
    },
  },
)
