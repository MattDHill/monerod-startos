import type { Store } from '../../fileModels/store.json'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

// monerod requires --tx-proxy whenever --anonymous-inbound is set on the Tor
// zone, so torInbound implicitly forces torOutbound. Surface that coupling
// both ways: any Tor-inbound state read or written has torOutbound forced on.
function normalizeTor<T extends Partial<Store>>(s: T): T {
  return s.torInbound ? { ...s, torOutbound: true } : s
}

const { InputSpec, Value } = sdk

const anonymitySpec = InputSpec.of({
  outboundProxy: Value.select({
    name: i18n('Route all outbound traffic via'),
    description: i18n(
      'Force the public (clearnet) zone to dial out through a SOCKS proxy. Maps to monerod --proxy. Only one proxy is allowed; forcing all traffic through Tor exits can be slow and has privacy trade-offs.',
    ),
    default: 'none',
    values: {
      none: i18n('Disabled'),
      tor: 'Tor',
    },
  }),
  torOutbound: Value.toggle({
    name: i18n('Send local transactions through Tor proxy'),
    description: i18n(
      'Use a Tor SOCKS proxy when broadcasting locally-originated transactions, so the originating IP is concealed from the rest of the network. Monerod creates a Tor zone, bootstraps it against six hardcoded onion seeds, builds a Tor-zone peerlist via gossip, and broadcasts only locally-originated transactions through those peers. Clearnet block sync, gossip, and forwarded transactions continue over clearnet. For maximum privacy also enable Pad transactions. Maps to monerod --tx-proxy tor,<tor-ip>:9050.',
    ),
    default: false,
  }),
  torInbound: Value.toggle({
    name: i18n('Accept inbound connections over Tor'),
    description: i18n(
      'Advertise this node as a Tor hidden service and accept inbound peer connections over it. Requires a .onion address on the Peer interface — add one via Interfaces → Peer → Add Tor address. Implicitly enables Send local transactions through Tor proxy, since monerod requires both for the Tor zone. Maps to monerod --anonymous-inbound <onion>:18080,...',
    ),
    default: false,
  }),
  torMaxOutboundConns: Value.number({
    name: i18n('Max Tor Outbound Connections'),
    description: i18n(
      "Maximum number of simultaneous outbound connections monerod opens to Tor's SOCKS proxy.",
    ),
    required: false,
    default: null,
    integer: true,
    min: 1,
    max: 256,
    footnote: `${i18n('Default')}: 16`,
  }),
  torMaxInboundConns: Value.number({
    name: i18n('Max Tor Inbound Connections'),
    description: i18n(
      "Maximum number of simultaneous inbound connections allowed on Monero's .onion listener.",
    ),
    required: false,
    default: null,
    integer: true,
    min: 1,
    max: 256,
    footnote: `${i18n('Default')}: 16`,
  }),
  torDandelionNoise: Value.triState({
    name: i18n('Dandelion++ noise'),
    description: i18n(
      'Enables white-noise and Dandelion++ sender-node obfuscation on the Tor tx-broadcast zone.',
    ),
    default: null,
    footnote: `${i18n('Default')}: ${i18n('Enabled')}`,
  }),
  padTransactions: Value.toggle({
    name: i18n('Pad transactions'),
    description: i18n(
      'Pad transaction size to reduce traffic-analysis correlation. Recommended when routing any transaction traffic over Tor.',
    ),
    default: false,
  }),
})

export const anonymityConfig = sdk.Action.withInput(
  'anonymity-config',

  async () => ({
    name: i18n('Anonymity Networks'),
    description: i18n(
      'Configure how Monero uses anonymity networks like Tor for outbound traffic, transaction broadcast, and inbound connections.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  anonymitySpec,

  async () => {
    const s = await storeJson.read().once()
    return s ? normalizeTor(s) : null
  },

  ({ effects, input }) => storeJson.merge(effects, normalizeTor(input)),
)
