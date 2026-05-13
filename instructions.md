# Monero

## Documentation

- [Monero documentation](https://docs.getmonero.org) — the upstream guide to running `monerod` and `monero-wallet-rpc`, including the full configuration reference.

## What you get on StartOS

- A full Monero node (`monerod`) that validates the entire blockchain.
- A **Wallet RPC Interface** running `monero-wallet-rpc` for server-side wallet management — create wallets, send and receive, query balances.
- A **Peer Interface** for P2P block and transaction exchange.
- An **RPC Interface** exposing the restricted RPC endpoint that external wallets connect to.
- Optional **ZeroMQ Interface** and **ZeroMQ Pub-Sub Interface** for real-time block and transaction notifications (off by default).
- Optional Tor outbound proxy, transaction broadcast over Tor, and inbound `.onion` peering — all driven from a single action.

The node starts on clearnet immediately after install; there is no setup wizard.

## Getting set up

1. Start the service. The blockchain begins syncing from the network — expect several days for a full sync on first install, depending on your hardware and connection.
2. Watch the **Blockchain Sync Progress** health check on the Dashboard. It transitions from `Syncing blocks...XX.XX%` to `Monero is fully synced` when caught up.
3. If you want Tor — for outbound proxying, transaction broadcast over Tor, or accepting inbound `.onion` peers — install Tor first (it is listed as an optional dependency), then run the **Anonymity Networks** action and enable the intents you want.
4. By default the restricted RPC is open to wallet connections without credentials. If you want to require a username and password, run the **Daemon RPC Settings** action and enable RPC credentials. The Wallet RPC's daemon login is updated automatically to match.

## Using Monero

### Connecting wallets

External wallets (Anonero, Cake, Feather, Monero GUI, Monerujo, etc.) connect to the **RPC Interface** — this is the restricted RPC endpoint on port `18089`. Use the LAN or `.onion` address shown on the interface panel. The full unrestricted RPC is not exposed externally.

The **Wallet RPC Interface** runs `monero-wallet-rpc` for programmatic server-side wallet operations and is typically consumed by other services rather than browsed directly.

### Actions

Configuration is split across several actions so each one is small enough to fit on screen. Every numeric or toggle input is optional — leave it blank or in the neutral state to fall back to the upstream Monero default shown in the field's footnote.

- **Peer Settings** — peer counts, bandwidth caps, RPC ban behavior, port-gossip hiding, advertising as a public remote node, and a list of curated peers (optionally exclusive).
- **Anonymity Networks** — route outbound traffic via Tor, broadcast locally-originated transactions over Tor, advertise an inbound `.onion` listener, tune Dandelion++ noise, and pad transactions. Requires Tor to be installed when any intent is on.
- **Edit Ban List** — manage the list of IP addresses and IPv4 CIDR subnets that `monerod` bans at startup. One entry per line.
- **Daemon RPC Settings** — enable or disable username/password authentication on the restricted RPC. When enabled, the Wallet RPC's daemon login is kept in sync automatically.
- **Wallet RPC Settings** — enable or disable username/password authentication on `monero-wallet-rpc`.
- **Other Settings** — mempool size cap, toggle the ZeroMQ interfaces, enable blockchain pruning, and a free-text block-notify command (use `%s` as the block-hash placeholder).
- **DB Salvage** (Maintenance) — schedules `monerod --db-salvage` on next start and restarts. Run only if `monerod` is failing to start due to database corruption.
- **Resync Blockchain** (Maintenance) — deletes the blockchain database and re-downloads it from the network. For pruned nodes this is a full re-download from genesis.

## Limitations

- **Pruning is one-way.** Once enabled in Other Settings, the blockchain cannot be un-pruned without running Resync Blockchain (a full re-download).
- **No mining controls.** `--start-mining`, mining threads, and background mining are not exposed.
- **No I2P.** Tor is the only anonymity network available today.
- **No bootstrap daemon.** The node always performs a full sync; there is no `--bootstrap-daemon-address` shortcut.
- **Initial sync over Tor is slow.** Routing all outbound traffic through Tor before the chain is caught up can take significantly longer than a clearnet sync. Consider syncing on clearnet first, then turning Tor on.
