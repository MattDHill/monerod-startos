import { setupManifest } from '@start9labs/start-sdk'
import {
  short,
  long,
  alertUninstall,
  alertRestore,
  torDescription,
} from './i18n'

export const manifest = setupManifest({
  id: 'monerod',
  title: 'Monero',
  license: 'bsd-3-clause',
  packageRepo: 'https://github.com/Start9-Community/monerod-startos',
  upstreamRepo: 'https://github.com/monero-project/monero',
  marketingUrl: 'https://getmonero.org',
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'monerod', 'wallet'],
  images: {
    monerod: {
      source: {
        dockerTag: 'ghcr.io/sethforprivacy/simple-monerod:v0.18.4.6',
      },
      arch: ['x86_64', 'aarch64'],
    },
    'wallet-rpc': {
      source: {
        dockerTag:
          'ghcr.io/sethforprivacy/simple-monero-wallet-rpc:v0.18.4.6',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: alertUninstall,
    restore: alertRestore,
    start: null,
    stop: null,
  },
  dependencies: {
    tor: {
      description: torDescription,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
