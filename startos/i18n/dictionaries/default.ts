export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Monero!': 0,
  'Monero Daemon': 1,
  'Monero RPC is ready and accepting requests': 2,
  'Monero RPC is unreachable': 3,
  'Wallet RPC': 4,
  'Wallet RPC is ready': 5,
  'Wallet RPC is unreachable': 6,
  'Blockchain Sync Progress': 7,
  'Unexpected RPC response': 8,
  'Monero is fully synced': 9,
  'Syncing blocks...${percentage}%': 10,
  'Syncing blocks...': 11,
  'Monero is starting…': 12,
  'No Tor intents enabled': 13,
  'Tor is not installed': 14,
  'Tor is not running': 15,
  'Inbound and outbound connections': 16,
  'Outbound only': 17,
  Clearnet: 18,
  'Excluded by outbound proxy': 19,
  'Outbound only. Publish an IP address to enable inbound.': 128,
  'Inbound enabled but no .onion address on the Peer interface — add a Tor address to the Peer interface, then restart.': 129,

  // interfaces.ts
  'Peer Interface': 20,
  'The peer-to-peer interface for exchanging blocks and transactions': 21,
  'RPC Interface': 22,
  'The restricted RPC interface for wallet connections': 23,
  'Wallet RPC Interface': 24,
  'The wallet RPC interface for server-side wallet management': 25,
  'ZeroMQ Interface': 26,
  'The ZeroMQ interface for block and transaction notifications': 27,
  'ZeroMQ Pub-Sub Interface': 28,
  'The ZeroMQ publish-subscribe interface': 29,

  // actions/dbSalvage.ts
  'DB Salvage': 30,
  'Attempt to salvage a corrupted blockchain database. Monerod will run with --db-salvage on next start, then restart normally.': 31,
  'Only use this if monerod is failing to start due to database corruption. The service will restart if currently running.': 32,
  Maintenance: 33,
  Success: 34,
  'Restarting monerod with --db-salvage. It will restart normally after salvage completes.': 35,
  'The next time monerod starts, it will run --db-salvage before starting normally.': 36,

  // actions/resyncBlockchain.ts
  'Resync Blockchain': 37,
  'Delete the blockchain database and re-download it from the network. This is the only way to fully rebuild the database from scratch.': 38,
  'This will delete all blockchain data and re-sync from the network. For pruned nodes, this means downloading the entire blockchain again, which could take days or weeks depending on hardware and network speed.': 39,
  'Restarting monerod. The blockchain database will be deleted and re-synced from the network.': 40,
  'The next time monerod starts, the blockchain database will be deleted and re-synced from the network.': 41,

  // actions/config/other.ts
  'Other Settings': 42,
  'Configure mempool, ZMQ, pruning, and block-notify command': 43,
  Configuration: 44,

  // actions/config/peers.ts
  'Peer Settings': 45,
  'Configure peer and rate limit settings': 46,

  // actions/config/banList.ts
  Entries: 47,
  'One IP address or IPv4 CIDR subnet per entry. Examples: 192.0.2.1, 192.0.2.0/24': 48,
  'Edit Ban List': 49,
  'View, add, or remove peers that monerod bans at startup.': 50,

  // actions/config/rpc.ts
  'Daemon RPC Settings': 51,
  'Configure Monero daemon RPC credentials': 52,

  // actions/config/walletRpc.ts
  'Wallet RPC Settings': 53,
  'Configure Monero wallet RPC credentials': 54,

  // actions/config/anonymity.ts
  'Route all outbound traffic via': 55,
  'Force the public (clearnet) zone to dial out through a SOCKS proxy. Maps to monerod --proxy. Only one proxy is allowed; forcing all traffic through Tor exits can be slow and has privacy trade-offs.': 56,
  Disabled: 57,
  'Send local transactions through Tor proxy': 58,
  'Use a Tor SOCKS proxy when broadcasting locally-originated transactions, so the originating IP is concealed from the rest of the network. Monerod creates a Tor zone, bootstraps it against six hardcoded onion seeds, builds a Tor-zone peerlist via gossip, and broadcasts only locally-originated transactions through those peers. Clearnet block sync, gossip, and forwarded transactions continue over clearnet. For maximum privacy also enable Pad transactions. Maps to monerod --tx-proxy tor,<tor-ip>:9050.': 59,
  'Accept inbound connections over Tor': 60,
  'Advertise this node as a Tor hidden service and accept inbound peer connections over it. Requires a .onion address on the Peer interface — add one via Interfaces → Peer → Add Tor address. Implicitly enables Send local transactions through Tor proxy, since monerod requires both for the Tor zone. Maps to monerod --anonymous-inbound <onion>:18080,...': 61,
  'Max Tor Outbound Connections': 62,
  "Maximum number of simultaneous outbound connections monerod opens to Tor's SOCKS proxy.": 63,
  Default: 64,
  'Max Tor Inbound Connections': 65,
  "Maximum number of simultaneous inbound connections allowed on Monero's .onion listener.": 66,
  'Dandelion++ noise': 67,
  'Enables white-noise and Dandelion++ sender-node obfuscation on the Tor tx-broadcast zone.': 68,
  Enabled: 69,
  'Pad transactions': 70,
  'Pad transaction size to reduce traffic-analysis correlation. Recommended when routing any transaction traffic over Tor.': 71,
  'Anonymity Networks': 72,
  'Configure how Monero uses anonymity networks like Tor for outbound traffic, transaction broadcast, and inbound connections.': 73,

  // fileModels/monero.conf.ts
  'Must be alphanumeric and/or can contain an underscore': 74,
  Hostname: 75,
  'Domain name, onion or IP address of Monero peer.': 76,
  Port: 77,
  'TCP Port that peer is listening on for inbound p2p connections.': 78,
  'Priority Node': 79,
  'Attempt to stay perpetually connected to this peer': 80,
  'Maximum TX Pool Size': 81,
  'Keep the unconfirmed transaction memory pool at or below this many megabytes. You may wish to decrease this if you are low on RAM, or increase if you are mining.': 82,
  MiB: 83,
  'Written to monero.conf as bytes.': 84,
  'ZMQ Interface': 85,
  'Enable the ZeroMQ interface for real-time block and transaction notifications. Required by some services such as block explorers and mining software.': 86,
  Pruning: 87,
  'Blockchain pruning prunes proof data from transactions after verification but before storage. Saves roughly 2/3 of disk space.': 88,
  'Block Notify Command': 89,
  'Shell command monerod runs on every new block. The token `%s` is replaced by the block hash. Leave empty to disable. Example: /usr/bin/curl -so /dev/null https://example.com/notify/%s': 90,
  'Max Peers Incoming': 91,
  'Maximum number of simultaneous peers connecting inbound to the Monero daemon.': 92,
  Unlimited: 93,
  'Max Peers Outgoing': 94,
  'Maximum number of simultaneous peers for the Monero daemon to connect outbound to.': 95,
  'Hide My Port': 96,
  'Tell connected peers not to gossip your p2p port to the rest of the network. Enabling this makes your node more private but results in fewer inbound connections. Maps directly to monerod --hide-my-port.': 97,
  'Advertise RPC Remote Node': 98,
  'Advertise on the P2P network that your restricted RPC port offers Remote Node services. Caution: this could significantly increase resource use.': 99,
  'Specific Nodes Only': 100,
  'Only connect to the peers specified below and no other peers.': 101,
  'Add Peers': 102,
  'Optionally add addresses of specific p2p nodes that your Monero node should connect to': 103,
  'Disable RPC Ban': 104,
  'Disable monerod banning RPC clients that generate errors. Enabling this may help prevent monerod from banning traffic originating from the Tor daemon. Maps directly to monerod --disable-rpc-ban.': 105,
  'Download Speed Limit': 106,
  "Keep the Monero p2p node's incoming bandwidth rate limited at or under this many kilobytes per second.": 107,
  'kB/s': 108,
  'Upload Speed Limit': 109,
  "Keep the Monero p2p node's outgoing bandwidth rate limited at or under this many kilobytes per second.": 110,
  'RPC Credentials': 111,
  'Enable or disable a username and password to access the Monero RPC.': 112,
  'RPC Username': 113,
  "The username for connecting to Monero's unrestricted RPC interface": 114,
  'Changing this value will necessitate a restart of all services that depend on Monero.': 115,
  'RPC Password': 116,
  "The password for connecting to Monero's unrestricted RPC interface": 117,

  // fileModels/monero-wallet-rpc.conf.ts
  'Wallet RPC Credentials': 118,
  'Enable or disable a username and password to access the Monero wallet RPC.': 119,
  'Wallet RPC Username': 120,
  "The username for connecting to Monero's wallet RPC interface": 121,
  "Changing this value will necessitate a restart of all services that depend on Monero's wallet RPC.": 122,
  'Wallet RPC Password': 123,
  "The password for connecting to Monero's wallet RPC interface": 124,

  // actions/config/autoconfig.ts
  'Auto-Configure': 125,
  'Automatically configure monero.conf for the needs of another service': 126,
  'These fields were provided by a task and cannot be edited': 127,
} as const

export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
