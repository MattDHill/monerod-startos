import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_18_4_6_4 = VersionInfo.of({
  version: '0.18.4.6:4',
  releaseNotes: {
    en_US: `**Fixes**

- Wallet RPC daemon no longer crashes after enabling Wallet RPC credentials: the conflicting \`disable-rpc-login=1\` is gone from \`monero-wallet-rpc.conf\` and added as a CLI flag only when no \`rpc-login\` is configured. Existing broken installs self-heal on next start.
- Blockchain Sync Progress health check works when Daemon RPC credentials are enabled: it now performs HTTP Digest authentication against monerod's restricted RPC instead of receiving 401s.
- Peer Settings → Add Peers shows input fields again: the hostname validation regex was invalid JavaScript (unterminated group), so the form silently failed to render. Replaced with a permissive valid pattern.
- Anonymity Networks form no longer lies about \`Send local transactions through Tor proxy\` when only \`Accept inbound connections over Tor\` is enabled: the implicit coupling is now reflected in the form on both display and save.`,
    es_ES: `**Correcciones**

- El demonio Wallet RPC ya no se bloquea tras habilitar las credenciales de Wallet RPC: el conflictivo \`disable-rpc-login=1\` ya no aparece en \`monero-wallet-rpc.conf\` y se añade como argumento de línea de comandos solo cuando no hay \`rpc-login\` configurado. Las instalaciones rotas se autocorrigen en el siguiente arranque.
- La verificación de Progreso de sincronización de la cadena de bloques funciona con credenciales RPC del demonio habilitadas: ahora realiza autenticación HTTP Digest contra el RPC restringido de monerod en lugar de recibir 401.
- Ajustes de pares → Agregar pares vuelve a mostrar los campos de entrada: la regex de validación del nombre de host era JavaScript inválido (grupo no terminado), por lo que el formulario fallaba silenciosamente. Reemplazada por un patrón permisivo válido.
- El formulario de Redes de anonimato ya no miente sobre «Enviar transacciones locales a través del proxy Tor» cuando solo está habilitado «Aceptar conexiones entrantes mediante Tor»: el acoplamiento implícito ahora se refleja en el formulario tanto al mostrar como al guardar.`,
    de_DE: `**Behebungen**

- Der Wallet-RPC-Daemon stürzt nach Aktivierung der Wallet-RPC-Anmeldedaten nicht mehr ab: Das widersprüchliche \`disable-rpc-login=1\` ist aus \`monero-wallet-rpc.conf\` entfernt und wird nur dann als CLI-Flag gesetzt, wenn kein \`rpc-login\` konfiguriert ist. Bestehende defekte Installationen reparieren sich beim nächsten Start selbst.
- Der Blockchain-Sync-Health-Check funktioniert, wenn Daemon-RPC-Anmeldedaten aktiviert sind: Er führt nun HTTP-Digest-Authentifizierung gegen monerods restricted RPC durch, statt 401-Antworten zu erhalten.
- Peer-Einstellungen → Peers hinzufügen zeigt wieder Eingabefelder: Die Hostname-Validierungs-Regex war ungültiges JavaScript (nicht abgeschlossene Gruppe), wodurch das Formular stillschweigend nicht gerendert wurde. Durch ein gültiges, freizügiges Muster ersetzt.
- Das Anonymitäts-Netzwerke-Formular lügt nicht mehr über „Lokale Transaktionen über Tor-Proxy senden", wenn nur „Eingehende Verbindungen über Tor akzeptieren" aktiviert ist: Die implizite Kopplung wird nun im Formular beim Anzeigen und Speichern dargestellt.`,
    pl_PL: `**Poprawki**

- Demon Wallet RPC nie ulega już awarii po włączeniu poświadczeń Wallet RPC: konfliktowy \`disable-rpc-login=1\` zniknął z \`monero-wallet-rpc.conf\` i jest dodawany jako flaga CLI tylko wtedy, gdy nie skonfigurowano \`rpc-login\`. Istniejące uszkodzone instalacje samonaprawiają się przy następnym uruchomieniu.
- Sprawdzanie kondycji „Postęp synchronizacji łańcucha bloków" działa, gdy włączone są poświadczenia RPC demona: teraz wykonuje uwierzytelnianie HTTP Digest względem restricted RPC monerod, zamiast otrzymywać błędy 401.
- Ustawienia peerów → Dodaj peerów ponownie pokazuje pola wejściowe: regex walidacji nazwy hosta był nieprawidłowym JavaScript (niezakończona grupa), więc formularz po cichu się nie renderował. Zastąpiono permisywnym poprawnym wzorcem.
- Formularz Sieci anonimowe nie kłamie już o „Wysyłaj lokalne transakcje przez proxy Tor", gdy włączone jest tylko „Akceptuj połączenia przychodzące przez Tor": niejawne sprzężenie jest teraz odzwierciedlone w formularzu zarówno przy wyświetlaniu, jak i zapisie.`,
    fr_FR: `**Corrections**

- Le démon Wallet RPC ne plante plus après l'activation des identifiants Wallet RPC : le \`disable-rpc-login=1\` conflictuel a disparu de \`monero-wallet-rpc.conf\` et n'est ajouté comme option en ligne de commande que lorsqu'aucun \`rpc-login\` n'est configuré. Les installations cassées existantes se réparent automatiquement au prochain démarrage.
- Le health check Progression de la synchronisation de la blockchain fonctionne avec les identifiants RPC du démon activés : il effectue désormais une authentification HTTP Digest auprès du restricted RPC de monerod au lieu de recevoir des 401.
- Paramètres des pairs → Ajouter des pairs affiche à nouveau les champs : la regex de validation du nom d'hôte était du JavaScript invalide (groupe non terminé), donc le formulaire échouait silencieusement. Remplacée par un motif permissif valide.
- Le formulaire Réseaux d'anonymat ne ment plus sur « Envoyer les transactions locales via le proxy Tor » lorsque seul « Accepter les connexions entrantes via Tor » est activé : le couplage implicite est désormais reflété dans le formulaire à l'affichage comme à la sauvegarde.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
