# Updating the upstream version

Monero ships as two coordinated third-party images (`simple-monerod` and `simple-monero-wallet-rpc`, both by sethforprivacy). Both are tagged from the same Monero release and must be bumped together. See `CLAUDE.md` for the third-party-image note.

## Determining the upstream version

- **Monero** ([monero-project/monero](https://github.com/monero-project/monero)) — latest release tag drives the bump:
  ```
  gh release view -R monero-project/monero --json tagName -q .tagName
  ```
  Strip the leading `v` (e.g. `v0.18.4.6` → `0.18.4.6`). The current pin is in the `dockerTag` values in `startos/manifest/index.ts`.

- **simple-monerod image** ([sethforprivacy/simple-monerod-docker](https://github.com/sethforprivacy/simple-monerod-docker)) — confirm the matching image tag exists before bumping:
  ```
  curl -fsSL "https://ghcr.io/v2/sethforprivacy/simple-monerod/tags/list" | jq -r '.tags[]' | grep -E '^v[0-9]' | sort -V | tail -5
  ```

- **simple-monero-wallet-rpc image** ([sethforprivacy/simple-monero-wallet-rpc-docker](https://github.com/sethforprivacy/simple-monero-wallet-rpc-docker)) — confirm the matching image tag exists before bumping:
  ```
  curl -fsSL "https://ghcr.io/v2/sethforprivacy/simple-monero-wallet-rpc/tags/list" | jq -r '.tags[]' | grep -E '^v[0-9]' | sort -V | tail -5
  ```

Only bump once both images have published the new `v<version>` tag — the package needs them in lockstep.

## Applying the bump

- `startos/manifest/index.ts` — update both `dockerTag` values to the new version:
  - `images.monerod.source.dockerTag` → `ghcr.io/sethforprivacy/simple-monerod:v<new version>`
  - `images['wallet-rpc'].source.dockerTag` → `ghcr.io/sethforprivacy/simple-monero-wallet-rpc:v<new version>`
