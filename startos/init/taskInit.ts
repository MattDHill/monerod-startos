import { walletRpcConfFile } from '../fileModels/monero-wallet-rpc.conf'
import { moneroConfFile } from '../fileModels/monero.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const taskInit = sdk.setupOnInit(async (effects) => {
  // Normalize a legacy store where torInbound was on without torOutbound —
  // monerod requires both on the Tor zone, so the anonymity form forces them
  // together now. Older installs may have the desync on disk; one merge
  // brings the stored state in line with the effective state.
  const store = await storeJson.read().once()
  const storeFix =
    store?.torInbound && !store.torOutbound ? { torOutbound: true } : {}

  await Promise.all([
    moneroConfFile.merge(effects, {}),
    // Empty merge — ensures the file exists with the enforced literals and
    // strips any legacy disable-rpc-login key. The --disable-rpc-login CLI
    // flag is added by main.ts when rpc-login is unset, so the conf file is
    // never the source of truth for that toggle.
    walletRpcConfFile.merge(effects, {}),
    storeJson.merge(effects, storeFix),
    // The ban list file is seeded by the seed-ban-list oneshot in main.ts,
    // which copies the upstream-bundled list from /home/monero/ban_list.txt
    // when the volume's file is empty or missing.
  ])
})
