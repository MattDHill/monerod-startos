import {
  walletRpcConfFile,
  walletRpcConfigSpec,
  readWalletRpcForForm,
} from '../../fileModels/monero-wallet-rpc.conf'
import { sdk } from '../../sdk'
import { i18n } from '../../i18n'

export const walletRpcConfig = sdk.Action.withInput(
  'wallet-rpc-config',

  async ({ effects }) => ({
    name: i18n('Wallet RPC Settings'),
    description: i18n('Configure Monero wallet RPC credentials'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  walletRpcConfigSpec,

  ({ effects }) => readWalletRpcForForm(effects),

  async ({ effects, input }) => {
    const walletCreds = input['wallet-rpc-credentials']

    const walletRpcLogin =
      walletCreds.selection === 'enabled'
        ? `${walletCreds.value.username}:${walletCreds.value.password}`
        : undefined

    await walletRpcConfFile.merge(effects, {
      'rpc-login': walletRpcLogin,
    })
  },
)
