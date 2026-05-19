import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_18_4_6_5 = VersionInfo.of({
  version: '0.18.4.6:5',
  releaseNotes: {
    en_US: `**Fixes**

- Peer Settings → Add Peers: Hostname field no longer accepts \`host:port\` strings — entering one used to write \`add-peer=host:port:port\` to \`monero.conf\` and crash monerod at startup. The regex now rejects colons outside square brackets, and the Port field is required so the peer's port is always explicit (no silent assumption of 18080).`,
    es_ES: `**Correcciones**

- Ajustes de pares → Agregar pares: el campo Nombre de host ya no acepta cadenas \`host:puerto\` — al introducir una se escribía \`add-peer=host:puerto:puerto\` en \`monero.conf\` y monerod se bloqueaba al arrancar. La regex ahora rechaza dos puntos fuera de corchetes y el campo Puerto es obligatorio, de modo que el puerto del par siempre es explícito (sin suponer en silencio 18080).`,
    de_DE: `**Behebungen**

- Peer-Einstellungen → Peers hinzufügen: Das Hostname-Feld akzeptiert keine \`host:port\`-Zeichenketten mehr — bisher wurde \`add-peer=host:port:port\` in \`monero.conf\` geschrieben und monerod stürzte beim Start ab. Die Regex lehnt Doppelpunkte außerhalb eckiger Klammern jetzt ab, und das Port-Feld ist erforderlich, damit der Port des Peers immer explizit ist (keine stillschweigende Annahme von 18080).`,
    pl_PL: `**Poprawki**

- Ustawienia peerów → Dodaj peerów: pole Nazwa hosta nie akceptuje już ciągów \`host:port\` — wprowadzenie takiego wpisu zapisywało \`add-peer=host:port:port\` do \`monero.conf\` i powodowało awarię monerod przy starcie. Regex odrzuca teraz dwukropki poza nawiasami kwadratowymi, a pole Port jest wymagane, więc port peera jest zawsze jawny (bez milczącego założenia 18080).`,
    fr_FR: `**Corrections**

- Paramètres des pairs → Ajouter des pairs : le champ Nom d'hôte n'accepte plus les chaînes \`host:port\` — en saisir une écrivait \`add-peer=host:port:port\` dans \`monero.conf\` et monerod plantait au démarrage. La regex rejette désormais les deux-points hors crochets et le champ Port est obligatoire, donc le port du pair est toujours explicite (sans supposer silencieusement 18080).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
