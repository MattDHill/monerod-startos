<p align="center">
  <img src="icon.svg" alt="Monero Logo" width="21%">
</p>

# Monero on StartOS

> **Upstream docs:** <https://docs.getmonero.org>
>
> Everything not listed in this document should behave the same as upstream
> Monero. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

[Monero](https://github.com/monero-project/monero) is a private, decentralized cryptocurrency. This package runs two daemons — `monerod` (the full node) and `monero-wallet-rpc` (server-side wallet management) — and exposes configuration through StartOS actions.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Configuration Model](#configuration-model)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Wallet Integrations](#wallet-integrations)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property         | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| monerod image    | `ghcr.io/sethforprivacy/simple-monerod` (unmodified)           |
| wallet-rpc image | `ghcr.io/sethforprivacy/simple-monero-wallet-rpc` (unmodified) |
| Architectures    | x86_64, aarch64                                                |
| Entrypoint       | Bypassed — StartOS calls the binaries directly via config file |

Both images are pulled directly from upstream with no modifications. The upstream entrypoint scripts (which use `fixuid`) are not used; instead, a `chown` oneshot runs before each daemon to set volume ownership.

Both daemons run as the `monero` user (not root).

## Volume and Data Layout

| Volume    | Mount Point                | Purpose                                                |
| --------- | -------------------------- | ------------------------------------------------------ |
| `monerod` | `/home/monero/.bitmonero`  | Blockchain (lmdb), monero.conf, ban_list.txt, logs     |
| `wallet`  | `/home/monero/wallet`      | Wallet files, monero-wallet-rpc.conf, logs             |
| `main`    | _(not mounted at runtime)_ | Hosts `store.json`; vestigial for pre-0.18.4.6 volumes |

All persistent configuration lives in files managed by StartOS file models:

- `monero.conf` (INI) — on the `monerod` volume
- `monero-wallet-rpc.conf` (INI) — on the `wallet` volume
- `ban_list.txt` (plain text) — on the `monerod` volume
- `store.json` — on the `main` volume; holds StartOS-managed intent flags (`dbSalvage`, `resync`, and the Anonymity Networks fields)

## Configuration Model

Settings in the StartOS UI fall into three tiers:

### 1. Enforced (hidden)

Values the package pins via the file model's zod shape. They are not exposed in any action and cannot be changed through the UI.

| Key (monero.conf)            | Value                                        | Reason                         |
| ---------------------------- | -------------------------------------------- | ------------------------------ |
| `data-dir`                   | `/home/monero/.bitmonero`                    | Matches volume mount           |
| `log-file`                   | `/home/monero/.bitmonero/logs/monerod.log`   | Fixed log location             |
| `log-level`                  | `0,blockchain:INFO`                          | Quiet base with blockchain info |
| `max-log-file-size`          | `10000000`                                   | Bounded rotation               |
| `max-log-files`              | `2`                                          | Bounded rotation               |
| `p2p-bind-ip` / `port`       | `0.0.0.0` / `18080`                          | Container networking           |
| `rpc-bind-ip` / `port`       | `0.0.0.0` / `18081`                          | Container networking           |
| `rpc-restricted-bind-*`      | `0.0.0.0` / `18089`                          | Container networking           |
| `confirm-external-bind`      | `1`                                          | Required for `0.0.0.0` binding |
| `rpc-access-control-origins` | `*`                                          | Services connect internally    |
| `db-sync-mode`               | `safe:sync`                                  | Data integrity                 |
| `enforce-dns-checkpointing`  | `0`                                          | DNS blocked in Tor-only        |
| `disable-dns-checkpoints`    | `1`                                          | DNS blocked in Tor-only        |
| `check-updates`              | `disabled`                                   | StartOS manages updates        |
| `igd`                        | `disabled`                                   | No UPnP port mapping           |
| `ban-list`                   | `/home/monero/.bitmonero/ban_list.txt`       | Managed via Ban List action    |
| `tx-proxy` / `proxy` / `anonymous-inbound` / `pad-transactions` | _forced undefined_ | Resolved at daemon launch as CLI args from `store.json` + live Tor container IP (see Anonymity Networks) |

| Key (monero-wallet-rpc.conf) | Value                    | Reason                         |
| ---------------------------- | ------------------------ | ------------------------------ |
| `wallet-dir`                 | `/home/monero/wallet`    | Matches volume mount           |
| `log-file` / rotation        | fixed paths / `10MB` × 2 | Fixed log location             |
| `trusted-daemon`             | `1`                      | Daemon is in the same package  |
| `daemon-port`                | `18089`                  | Restricted RPC (internal)      |
| `rpc-bind-ip` / `port`       | `0.0.0.0` / `28088`      | Container networking           |
| `confirm-external-bind`      | `1`                      | Required for `0.0.0.0` binding |

### 2. User-configurable, no package default

All numeric and toggle inputs in the actions are optional. The file model writes a line only when the user enters a value; leaving a field blank (or setting a triState toggle to the neutral state) omits the key and monerod applies its own default. Each field's footnote shows the upstream default.

### 3. User-configurable, with a package default

The few settings where the package takes an opinion. The default is pre-filled in the form and seeded into the file on first install.

| Setting           | Package default | Upstream default      | Rationale                                                                                                                                                                                                  |
| ----------------- | --------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet-RPC login  | disabled        | n/a (one is required) | `monero-wallet-rpc` refuses to start without either `--rpc-login` or `--disable-rpc-login`. The Wallet RPC Settings action toggles `rpc-login`; `main.ts` adds `--disable-rpc-login` when it isn't set     |

No Tor intents are enabled by default — Monero ships in clearnet mode. Enable Tor outbound / inbound / outbound-proxy in the Anonymity Networks action.

## Installation and First-Run Flow

On fresh install, StartOS writes the config files before the daemons start:

- **`monero.conf`** — enforced keys only. Every user-facing setting is absent, meaning monerod applies its own default.
- **`monero-wallet-rpc.conf`** — enforced keys only. `disable-rpc-login` is not stored here; it's added as a CLI flag at daemon launch when no `rpc-login` is set (see below).
- **`ban_list.txt`** — seeded from the upstream simple-monerod image's bundled list at `/home/monero/ban_list.txt` on first start. The seed runs again whenever the volume's file is empty (so a wiped volume re-seeds), but is skipped once the file is non-empty so user edits via the Edit Ban List action are preserved.
- **`store.json`** — default intents (`outboundProxy=none`, everything else off / null).

No setup wizard is required. The node begins syncing immediately after install, on clearnet.

## Network Access and Interfaces

| Interface      | Internal Port | External Port (LAN) | External Port (Tor) | Protocol | Purpose                           |
| -------------- | ------------- | ------------------- | ------------------- | -------- | --------------------------------- |
| Peer (P2P)     | 18080         | 18080               | 18080               | TCP      | Block/transaction exchange        |
| Restricted RPC | 18089         | 443 (SSL)           | 18089               | HTTP     | Wallet connections, read-only API |
| Wallet RPC     | 28088         | 28088 (SSL)         | 28088               | HTTP     | Server-side wallet management     |
| ZMQ\*          | 18082         | 18082               | 18082               | TCP      | Block/tx notifications            |
| ZMQ Pub-Sub\*  | 18083         | 18083               | 18083               | TCP      | Publish-subscribe                 |

_\*ZMQ interfaces only appear when ZMQ is enabled in Other Settings. They are not created by default._

The full (unrestricted) RPC on port 18081 is **not exposed** as a StartOS interface. It is accessible only from within the container network. External wallet connections use the restricted RPC on port 18089.

The Peer interface's `.onion` URL (provisioned by StartOS when Tor is installed) is what monerod advertises as its `--anonymous-inbound` address when inbound Tor is enabled.

## Actions (StartOS UI)

All action inputs are optional unless noted. Numeric inputs show the monerod upstream default in their footnote. Toggle inputs are tri-state where applicable: `on`, `off`, or `default` (neutral — omits the key so monerod's own default applies).

### Peer Settings

Peer, rate-limit, and P2P privacy settings. Form field names mirror the monerod INI keys so hand-edits of `monero.conf` line up.

| Input               | Writes to                        | Form default | Notes                                 |
| ------------------- | -------------------------------- | ------------ | ------------------------------------- |
| Max peers incoming  | `in-peers`                       | neutral      | Upstream: unlimited                   |
| Max peers outgoing  | `out-peers`                      | neutral      | Upstream: 12                          |
| Download speed limit| `limit-rate-down`                | neutral      | Upstream: 8192 kB/s                   |
| Upload speed limit  | `limit-rate-up`                  | neutral      | Upstream: 2048 kB/s                   |
| Hide my port        | `hide-my-port`                   | neutral      | Disables p2p port gossip              |
| Public node         | `public-node`                    | neutral      | Advertises restricted RPC on P2P      |
| Strict nodes        | `add-exclusive-node`             | neutral      | Replaces peer list behavior           |
| Peer list           | `add-peer` / `add-priority-node` | empty        | Optional curated peers                |
| Disable RPC ban     | `disable-rpc-ban`                | neutral      | Stops monerod banning misbehaving RPC |

### Anonymity Networks

Tor-related intents. Stored in `store.json`; `main.ts` resolves the Tor container IP and the Peer interface's own onion URL at runtime and builds the matching monerod CLI args. The corresponding raw INI keys (`tx-proxy`, `proxy`, `anonymous-inbound`, `pad-transactions`) are enforced undefined in `monero.conf`, so hand-edits to those keys get stripped.

| Input                                     | Maps to CLI arg                              | Default |
| ----------------------------------------- | -------------------------------------------- | ------- |
| Route all outbound traffic via            | `--proxy <torIp>:9050`                       | none    |
| Send local transactions through Tor proxy | `--tx-proxy tor,<torIp>:9050,N`              | off     |
| Accept inbound connections over Tor       | `--anonymous-inbound <onion>:<p2p>,...,N`    | off     |
| Max Tor outbound conns                    | third field of `--tx-proxy`                  | 16      |
| Max Tor inbound conns                     | third field of `--anonymous-inbound`         | 16      |
| Dandelion++ noise                         | inverts `disable_noise` flag on `--tx-proxy` | neutral |
| Pad transactions                          | `--pad-transactions`                         | off     |

When **Send local transactions through Tor proxy** is on, monerod creates the Tor zone and bootstraps it against six hardcoded onion seeds compiled into the binary. Locally-originated transactions are then broadcast *only* over Tor (never duplicated to clearnet). Block sync, peer gossip, and forwarding of transactions received from clearnet peers continue over clearnet — set **Route all outbound traffic via** to `tor` if you also want clearnet-zone outbound to go through the Tor SOCKS proxy.

**Accept inbound connections over Tor** requires a `.onion` address on the Peer interface (Interfaces → Peer → Add Tor address). When inbound is on but no peer onion is provisioned, monerod is started without `--anonymous-inbound` and the Tor health check reports the misconfiguration. Inbound also implicitly enables `--tx-proxy tor,...`, since monerod requires a tx-proxy for any zone with an anonymous-inbound configured.

### Edit Ban List

Manage the list of IP addresses and IPv4 CIDR subnets that monerod bans at startup (`--ban-list`). One entry per line. The ban-list path is enforced in `monero.conf`; this action owns the file contents.

### Daemon RPC Settings

Configure authentication for the monerod restricted RPC.

- **Input:** RPC credentials (disabled | enabled → username + password)
- **Side effect:** When enabled, the wallet RPC's `daemon-login` is automatically synced to match

### Wallet RPC Settings

Configure authentication for `monero-wallet-rpc`.

- **Input:** Wallet RPC credentials (disabled | enabled → username + password)

### Other Settings

Mempool, ZMQ, pruning, and block-notify command.

| Input            | Writes to                             | Form default | Notes                                                   |
| ---------------- | ------------------------------------- | ------------ | ------------------------------------------------------- |
| Max TX pool size | `max-txpool-weight`                   | neutral      | MiB in the form, written to monero.conf as bytes        |
| ZMQ              | `no-zmq`, `zmq-rpc-bind-*`, `zmq-pub` | neutral      | When on, enables ZMQ interfaces                         |
| Pruning          | `prune-blockchain`                    | neutral      | One-way — cannot be un-pruned without re-sync           |
| Block Notify     | `block-notify`                        | empty        | Free-text shell command. `%s` is replaced by block hash |

### DB Salvage

Runs monerod with `--db-salvage` once on next start, then restarts normally. Use only if monerod is failing to start due to database corruption.

### Resync Blockchain

Deletes the blockchain database (`lmdb/`) and re-downloads it from the network. For pruned nodes this is a full re-download.

### Auto-Configure (hidden)

A hidden action (`visibility: 'hidden'`) exposed for dependent services to write `monero.conf` settings on behalf of Monero. Invoked programmatically — not shown in the UI. Fields supplied in the prefill are locked in the form with the note "These fields were provided by a task and cannot be edited"; remaining fields stay editable and are merged into `monero.conf` on submit.

## Backups and Restore

| Volume    | Included | Exclusions                                                                                                |
| --------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `wallet`  | Full     | None                                                                                                      |
| `monerod` | Partial  | `lmdb/`, `logs/`, `p2pstate.bin`, `p2pstate_stripped.bin`, `net_stat.bin`, `dns_checkpoints.dat` |

Only regeneratable state is excluded from the `monerod` volume: the blockchain database (re-syncs from the network), logs, transient p2p / network caches, and the DNS checkpoint cache. Config files (`monero.conf`, `monero-wallet-rpc.conf`) **are** backed up.

**Restore behavior:** Restoring overwrites current wallet data. You will lose any transactions recorded in watch-only wallets and any funds received to the hot wallet since the last backup.

## Health Checks

| Check                        | Method                                | Grace Period | Notes                                                                                      |
| ---------------------------- | ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| **Monero Daemon**            | Port listening on 18089               | 30 seconds   | Restricted RPC reachability                                                                |
| **Wallet RPC**               | Port listening on 28088               | Default      | monero-wallet-rpc reachability                                                             |
| **Blockchain Sync Progress** | JSON-RPC `get_info` on restricted RPC | Default      | Uses HTTP Digest auth when Daemon RPC credentials are enabled. Starting → loading (`Syncing blocks...XX.XX%`) → success (`Monero is fully synced`) |
| **Tor**                      | Reads store + Tor package status      | n/a          | Disabled when no Tor intent is set, Tor isn't installed, or Tor isn't running. Failure when inbound is enabled but the Peer interface has no `.onion` address. Otherwise success — reports inbound/outbound state. |
| **Clearnet**                 | Reads `outboundProxy` intent          | n/a          | Disabled when **Route all outbound traffic via** is set to Tor; otherwise success           |

## Dependencies

| Dependency | Required | Version Constraint | Purpose                                 |
| ---------- | -------- | ------------------ | --------------------------------------- |
| Tor        | Optional | >= 0.4.9.5         | SOCKS proxy for Tor outbound / inbound  |

Tor becomes a **runtime-required** dependency when any Tor intent is enabled in the Anonymity Networks action (outbound proxy, send local transactions through Tor proxy, or accept inbound over Tor). When all intents are off, Tor is not required. No volumes are mounted from Tor; monerod connects to the Tor SOCKS proxy at `<tor-container-ip>:9050`, resolved at daemon launch.

## Limitations and Differences

1. **No mining support** — `--start-mining`, `--mining-threads`, `--bg-mining-enable` are not exposed.
2. **No I2P support** — only Tor is available as an anonymity network today. (Infrastructure is in place to add I2P once an I2P StartOS package is available.)
3. **No bootstrap daemon** — `--bootstrap-daemon-address` is not exposed; the node does a full sync.
4. **Unrestricted RPC is internal only** — port 18081 is not exposed. Wallets connect via the restricted RPC on 18089.
5. **Pruning is one-way** — once enabled, the blockchain cannot be un-pruned without a full re-sync.
6. **DNS features disabled** — DNS checkpointing and DNS blocklist are disabled; irrelevant in clearnet mode, and DNS leaks privacy in Tor-only mode.
7. **UPnP disabled** — `igd=disabled` is enforced. StartOS handles port mapping.
8. **No hand-editing of Tor / pad-transactions keys in `monero.conf`** — `tx-proxy`, `proxy`, `anonymous-inbound`, and `pad-transactions` are forced undefined by the file model. Configure these via the Anonymity Networks action (which writes to `store.json`); `main.ts` synthesises the matching CLI args at daemon launch.
9. **Initial sync over Tor is slow** — full-blockchain sync through Tor can take significantly longer than clearnet. Consider syncing on clearnet first and enabling Tor afterward if sync-time privacy is not a concern.

## What Is Unchanged from Upstream

- Full blockchain validation (no light/SPV mode)
- All standard RPC methods available on the restricted endpoint
- Wallet RPC functionality (create wallets, send/receive, view balance)
- Transaction relay and mempool behavior
- P2P protocol and block propagation
- Pruning implementation and storage savings
- Dandelion++ privacy protocol
- All cryptographic operations

## Wallet Integrations

See [docs/wallet-integrations.md](docs/wallet-integrations.md) for step-by-step guides connecting wallets to your Monero node:

- Anonero (Android)
- Cake Wallet (Android / iOS)
- Feather Wallet (Linux / Mac / Windows)
- Monero GUI (Linux / Mac / Windows)
- Monerujo (Android)
- Haveno RetoSwap (Linux / Mac / Windows)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: monerod
upstream_version: see manifest dockerTags
images:
  monerod: ghcr.io/sethforprivacy/simple-monerod
  wallet-rpc: ghcr.io/sethforprivacy/simple-monero-wallet-rpc
architectures: [x86_64, aarch64]
volumes:
  monerod: /home/monero/.bitmonero
  wallet: /home/monero/wallet
  main: not mounted (hosts store.json)
ports:
  peer: 18080
  rpc-restricted: 18089
  rpc-wallet: 28088
  rpc-unrestricted: 18081 (internal only)
  zmq: 18082 (conditional)
  zmq-pubsub: 18083 (conditional)
dependencies:
  - tor (optional, required when any Tor intent is enabled)
config_files:
  - monero.conf (monerod volume)
  - monero-wallet-rpc.conf (wallet volume)
  - ban_list.txt (monerod volume)
  - store.json (main volume; anonymity intents + maintenance flags)
config_model:
  enforced: pinned via zod literals, hidden from UI
  enforced_undefined:
    - tx-proxy, proxy, anonymous-inbound, pad-transactions (resolved to CLI args in main.ts)
  optional: tri-state toggles + nullable numbers; blank means "use upstream default"
  package_preferences:
    - wallet-rpc login disabled by default
actions:
  - peers-config
  - anonymity-config
  - ban-list-config
  - rpc-config
  - wallet-rpc-config
  - other-config
  - autoconfig (hidden; for dependent services to seed monero.conf)
  - db-salvage
  - resync-blockchain
health_checks:
  - monerod: port_listening 18089 (30s grace)
  - wallet-rpc: port_listening 28088
  - sync-progress: json-rpc get_info
  - tor: intent + tor container status
  - clearnet: disabled iff outboundProxy = tor
backup_volumes:
  - wallet (full)
  - monerod (excluding lmdb/, logs/, p2pstate*, net_stat.bin, dns_checkpoints.dat)
```
