import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_18_4_6_2 = VersionInfo.of({
  version: '0.18.4.6:2',
  releaseNotes: {
    en_US:
      'Drop the 0.3.x → 0.4 migration. Users on legacy 0.3.x monerod should install this package fresh and resync — the platform-side 0.3 → 0.4 upgrade renames the legacy package to `monerod-legacy`.',
    es_ES:
      'Se elimina la migración 0.3.x → 0.4. Los usuarios del antiguo monerod 0.3.x deben instalar este paquete desde cero y resincronizar — la actualización 0.3 → 0.4 de la plataforma renombra el paquete antiguo a `monerod-legacy`.',
    de_DE:
      'Die Migration 0.3.x → 0.4 wurde entfernt. Nutzer des alten 0.3.x-monerod sollten dieses Paket frisch installieren und neu synchronisieren — das Plattform-Upgrade 0.3 → 0.4 benennt das Altpaket in `monerod-legacy` um.',
    pl_PL:
      'Usunięto migrację 0.3.x → 0.4. Użytkownicy starszego monerod 0.3.x powinni zainstalować ten pakiet od nowa i ponownie zsynchronizować — aktualizacja platformy 0.3 → 0.4 zmienia nazwę starego pakietu na `monerod-legacy`.',
    fr_FR:
      'Suppression de la migration 0.3.x → 0.4. Les utilisateurs de l’ancien monerod 0.3.x doivent installer ce paquet à neuf et resynchroniser — la mise à jour 0.3 → 0.4 de la plateforme renomme l’ancien paquet en `monerod-legacy`.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
