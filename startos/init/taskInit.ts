import { walletRpcConfFile } from '../fileModels/monero-wallet-rpc.conf'
import { moneroConfFile } from '../fileModels/monero.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const taskInit = sdk.setupOnInit(async (effects) => {
  await Promise.all([
    moneroConfFile.merge(effects, {}),
    walletRpcConfFile.merge(effects, {
      'disable-rpc-login': 1,
    }),
    storeJson.merge(effects, {}),
    // The ban list file is seeded by the seed-ban-list oneshot in main.ts,
    // which copies the upstream-bundled list from /home/monero/ban_list.txt
    // when the volume's file is empty or missing.
  ])
})
