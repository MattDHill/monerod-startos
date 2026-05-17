# CLAUDE.md

See [CONTRIBUTING.md](CONTRIBUTING.md) for the doc map and contribution workflow.

## Operating rules

- **Third-party images, not official Monero builds.** Both daemons are pulled from `ghcr.io/sethforprivacy/*`, not from the upstream Monero project. Track new releases against sethforprivacy's repo as well as the official Monero release tags.
- **Two images coupled by version.** `ghcr.io/sethforprivacy/simple-monerod` and `ghcr.io/sethforprivacy/simple-monero-wallet-rpc` ship the same Monero release and must be bumped together.
