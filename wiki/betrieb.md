# Betrieb

## Orte

| Was | Wo |
|---|---|
| Quellcode | `C:/Users/Wilhe/Downloads/Stock-Dashboard` |
| Datenordner | `C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten` |
| Kursarchiv | `E:/Markt-Dashboard-Archiv` (Pfad in `archiv1d-pfad.txt`, `archiv60m-pfad.txt`) |
| App-Store | `AppData/Roaming/markt-dashboard/store` — **nicht** im Datenordner |
| Installierte App | eigenes Verzeichnis; **Quellcode, Installation und Daten liegen auseinander** |

## Versionen und Release

- **Nur die Release-Wache vergibt Versionen und baut.** Sitzungen committen und legen eine
  Notiz in `release-notizen/` ab — mehr nicht.
- Werkzeug: `tools/release.js` (`--pruefen`, `--bauen --minor --wache`, `--hoch`).
- **Versionsreferenz ist git** (HEAD/Tag/`package.json`), **nie die installierte App**.
- Aktueller Stand: **v8.37.3**.
- Bei roten Tests wird **nicht** ausgeliefert und die Weigerung **nicht umgangen**.
- **Nach jedem Release trägt die Wache die Version hier ein** (Zeile „Aktueller Stand") und
  setzt eine Zeile in `log.md` — ihr einziger Schreibzugriff im Repo (Rolle aktualisiert 02.09.2026).

## Arbeitsbaum

**Parallelsitzungen teilen EINEN Arbeitsbaum.** Ein fremder Push nimmt eigene Commits mit,
HEAD springt. Deshalb: `git status` vor jedem Schreiben, Inhaltsanker statt Zeilennummern,
niemals `git add -A`.

## Token-Sparbetrieb (seit 31.08.2026)

Die drei Kostentreiber, gemessen: **(1) elf Sitzungen gleichzeitig** — mehrere über 18 Stunden,
fünf davon nicht einmal im Register; **(2) PM-Weckruf alle 5 Minuten** — jeder Tick las den
ganzen Kontext neu; **(3) zu lange Nachrichten** — jede zählt doppelt.

**Regeln seither:**
- **Wenige Chats, selbsttragende Einzelaufträge.** Der Prompt enthält alle Pfade, Zahlen und
  Entscheide — die Sitzung liest **nicht** die Tafel und stellt keine Rückfragen.
- **Ein Auftrag, ein Ende:** Ziel + Abbruchbedingung + „committen, Kurznotiz nach
  `uebergabe/`, anhalten". Kein Dauerlauf, kein Weckruf, keine Sitzungsnachrichten.
- **Koordination über Dateien**, nicht über Nachrichten: `uebergabe/`, Commits, dieses Wiki.
- **Chat danach schließen.**

## Messläufe

**Lange Rechnungen gehören nicht an ein Chat-Leben gebunden** — der Weg-3-Lauf starb zweimal
mit seinem Chat und lief erst im dritten Anlauf abgekoppelt durch. Entweder im Hintergrund
einer bestehenden Sitzung oder auf einer Dauerläufer-Maschine.

## Archiv-Pflege

Das Archiv **veraltet, sobald der PC aus ist** — zwischen 27.08. und 01.09. hing es fünf Tage
zurück und blockierte zweimal eine fertige Messung. Nachziehen:
`node tools/archiv-nachladen.js` (setzt selbst eine Sperre, ~bis 3 h).

## Adressierung von Sitzungen

**Nach einem Brücken-Neustart zeigen Kürzel auf ANDERE Sitzungen.** Vor jedem `SendMessage`
`ListAgents`. Eine Nachricht an eine `Remote Control · offline`-Zeile meldet `success` und
kommt nirgends an. **Versendet ist nicht zugestellt.**
