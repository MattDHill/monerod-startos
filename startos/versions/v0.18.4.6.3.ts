import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_0_18_4_6_3 = VersionInfo.of({
  version: '0.18.4.6:3',
  releaseNotes: {
    en_US: `**Fixes**

- Avoid monerod crash when "Accept inbound connections over Tor" was enabled without "Send local transactions through Tor proxy" — monerod requires a Tor tx-proxy whenever an anonymous-inbound is configured for the Tor zone. Outbound tx-proxy is now implicitly enabled when Tor inbound is on.
- Surface "Tor inbound needs a .onion on the Peer interface" via the Tor health check, instead of silently ignoring the toggle.
- Seed the bundled ban list from the upstream simple-monerod image on first start, instead of creating an empty file.

**Internal**

- Renamed "Make outbound connections over Tor" → "Send local transactions through Tor proxy" to more accurately describe what the toggle does.
- Added \`displayAs\` and \`uniqueBy\` to the peer list in Peer Settings.`,
    es_ES: `**Correcciones**

- Evita que monerod se bloquee cuando se activaba «Aceptar conexiones entrantes mediante Tor» sin «Enviar transacciones locales a través del proxy Tor» — monerod requiere un tx-proxy Tor siempre que haya un anonymous-inbound configurado para la zona Tor. El tx-proxy saliente ahora se habilita implícitamente cuando Tor entrante está activado.
- Muestra «Tor entrante necesita un .onion en la interfaz de Pares» mediante la verificación de salud Tor, en lugar de ignorar silenciosamente el interruptor.
- Siembra la lista de baneos incluida por la imagen simple-monerod upstream en el primer arranque, en lugar de crear un archivo vacío.

**Interno**

- Renombrado «Realizar conexiones salientes mediante Tor» → «Enviar transacciones locales a través del proxy Tor» para describir mejor lo que hace el interruptor.
- Añadidos \`displayAs\` y \`uniqueBy\` a la lista de pares en Ajustes de pares.`,
    de_DE: `**Behebungen**

- Vermeidet monerod-Absturz, wenn „Eingehende Verbindungen über Tor akzeptieren" ohne „Lokale Transaktionen über Tor-Proxy senden" aktiviert war — monerod erfordert einen Tor tx-proxy, sobald ein anonymous-inbound für die Tor-Zone konfiguriert ist. Der ausgehende tx-proxy wird nun implizit aktiviert, wenn Tor eingehend an ist.
- Zeigt „Tor eingehend benötigt eine .onion-Adresse auf der Peer-Schnittstelle" über den Tor-Health-Check an, statt den Schalter stillschweigend zu ignorieren.
- Sät die im Upstream simple-monerod-Image enthaltene Bannliste beim ersten Start ein, statt eine leere Datei anzulegen.

**Intern**

- Umbenannt: „Ausgehende Verbindungen über Tor herstellen" → „Lokale Transaktionen über Tor-Proxy senden", um besser zu beschreiben, was der Schalter tut.
- \`displayAs\` und \`uniqueBy\` zur Peer-Liste in Peer-Einstellungen hinzugefügt.`,
    pl_PL: `**Poprawki**

- Unika awarii monerod, gdy „Akceptuj połączenia przychodzące przez Tor" było włączone bez „Wysyłaj lokalne transakcje przez proxy Tor" — monerod wymaga tx-proxy Tor zawsze, gdy skonfigurowano anonymous-inbound dla strefy Tor. Wychodzący tx-proxy jest teraz niejawnie włączany, gdy Tor przychodzący jest włączony.
- Pokazuje „Tor przychodzący wymaga adresu .onion na interfejsie Peerów" w sprawdzeniu kondycji Tor, zamiast po cichu ignorować przełącznik.
- Sieje listę zbanowanych dołączoną w obrazie simple-monerod upstream przy pierwszym uruchomieniu, zamiast tworzyć pusty plik.

**Wewnętrzne**

- Zmieniono nazwę „Nawiązuj połączenia wychodzące przez Tor" → „Wysyłaj lokalne transakcje przez proxy Tor", aby lepiej opisywała działanie przełącznika.
- Dodano \`displayAs\` i \`uniqueBy\` do listy peerów w Ustawieniach peerów.`,
    fr_FR: `**Corrections**

- Évite le crash de monerod lorsque « Accepter les connexions entrantes via Tor » était activé sans « Envoyer les transactions locales via le proxy Tor » — monerod requiert un tx-proxy Tor dès qu'un anonymous-inbound est configuré pour la zone Tor. Le tx-proxy sortant est désormais activé implicitement quand Tor entrant est activé.
- Remonte « Tor entrant nécessite une .onion sur l'interface Pair » via le health check Tor, au lieu d'ignorer silencieusement le toggle.
- Initialise la liste de bannissement fournie par l'image simple-monerod upstream au premier démarrage, au lieu de créer un fichier vide.

**Interne**

- Renommé « Effectuer les connexions sortantes via Tor » → « Envoyer les transactions locales via le proxy Tor » pour mieux décrire ce que fait le toggle.
- Ajout de \`displayAs\` et \`uniqueBy\` à la liste de pairs dans Paramètres des pairs.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
