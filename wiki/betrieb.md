---
tags: [steuerung]
---
# Betrieb

## Orte

| Was | Wo |
|---|---|
| Quellcode | `C:/Users/Wilhe/Downloads/Stock-Dashboard` |
| Datenordner | `C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten` (Übergaben und Aufträge in `uebergabe/`) |
| Kursarchiv | `E:/Markt-Dashboard-Archiv` (Pfad in `archiv1d-pfad.txt`, `archiv60m-pfad.txt`); Alpaca-Minutenarchiv `alpaca1m/`, `alpaca1m-bereinigt/`, `alpaca-massnahmen/` |
| App-Store | `AppData/Roaming/markt-dashboard/store` — **nicht** im Datenordner |
| Installierte App | eigenes Verzeichnis; **Quellcode, Installation und Daten liegen auseinander** |
| Zugänge | Alpaca-Schlüssel im **Benutzerprofil** (`setx`, 03.09.2026); nie in Code, Log, Commit, URL oder Chat. Repo-Skripte lesen sie nur über `schluessel.js` der Spannen-Studie (Klinke Block 35) |

## Rollen

- **PM** (diese Sitzung): schreibt Aufträge als Datei nach `uebergabe/auftrag-*.md`, nimmt Lieferungen mit eigenem Testlauf ab, pflegt dieses Wiki, committet Studienergebnisse und Logs. Schreibt im Repo sonst nichts.
- **Bau-Chats**: ein Auftrag, ein Ende. Committen lokal, legen Übergabe und Release-Notiz ab, pushen nicht, vergeben keine Version. Wilhelm startet sie mit einem Dreizeiler, der auf die Auftragsdatei verweist.
- **Release-Wache** (Wilhelm startet sie von Hand): vergibt Versionen, baut, liefert aus, trägt die Version hier ein.
- **Nächtliche Rollen** (Auditor 01:00, Analytiker 03:15, Strategie-Tüftler 04:30, Issue-Wache alle 30 Min, Spekulations-Radar 3× täglich): prüfen und melden, bauen nicht.

## Aufträge und Budgets (Stand 04.09.2026)

- **Jeder Auftrag ist eine Datei** mit allen Pfaden, Regeln, Zahlen und Entscheiden — der Chat liest weder Tafel noch Wiki und stellt keine Rückfragen.
- **Budgets knapp, Nachschlag erlaubt** (Wilhelm 04.09.): Faustzahlen am Sitzungs-Zählerstand (nach drei Messpunkten 04.09.: 395k/300k, 180k/60k, 265k/120k): Kleinstauftrag ohne Gegenproben ~80k; alles mit „Gegenprobe je Klinke" ≥ 150k (+~7k je Gegenprobe); QS mit eigenen Sonden ~250k; Oberflächen-Stufe ~300k. **Werkzeugbau und Anwendung im selben Auftrag brauchen mehr als 150k oder gehören getrennt**; **QS-Bereich mit eigenen Sonden ~330k**; **N parallele Agenten = N × Klassenwert**, nie ein Gesamtdeckel (04.09.: 600k angesetzt, 1,89 Mio gebraucht); Oberflächen-Stufe mit neuem Modul + Leseauskunft + QS-Funden ~450k oder teilen; **Umbau mit Klinken + Sammel-Kleinkram aus einer QS + eigene Belegaufnahmen ~350k oder teilen** (Lehre 04.09., sieben Chats). Messpunkte 04.09. abends: 350k/200k, 285k/250k, 370k/200k, 210k/250k — der einzige nicht überzogene Auftrag war der mit EINEM Gewerk (Schein-Finder). Kostentreiber sind Electron-Läufe (2–6 min je Instanz) und volle Suite-Läufe (> 3 min), nicht das Lesen. Der Auftrag erlaubt Überziehen mit Begründung, aber nie ohne Übergabe. **Tatsächlicher Verbrauch ist Pflichtzeile der Übergabe**; nach einigen Übergaben werden die Faustzahlen nachgezogen.
- **Zwei Chats parallel nur auf disjunkten Dateien.** `test-v6.js` teilen sich fast alle → in der Regel nacheinander. **Die Reihenfolge steht IM Dreizeiler** („Starte erst, wenn Chat X seine Übergabe abgelegt hat"), sonst wird sie überlesen (04.09.: drei Chats gleichzeitig, je ein Drittel Mehrverbrauch, Sammel-Commit durch den PM).
- **Oberflächen-Aufträge erneuern `wiki/aufnahmen/`** (Wilhelm 04.09.): Aufnahmen der isolierten Kunstdaten-Instanz je Reiter einsortieren und `aufnahmen/struktur.md` neu erzeugen — steht als Pflicht in jedem UI-Auftrag.
- **Entscheide kommen als Formular**, nie als Fließtext, und werden doppelt verteilt: in [entscheide.md](entscheide.md) und auf die betroffene Seite.

## Versionen und Release

- **Nur die Release-Wache vergibt Versionen und baut.** Werkzeug: `tools/release.js` (`--pruefen`, `--bauen --minor --wache`, `--hoch`).
- **Versionsreferenz ist git** (HEAD/Tag/`package.json`), **nie die installierte App**.
- Aktueller Stand: **v8.41.0** (04.09.2026).
- Bei roten Tests wird **nicht** ausgeliefert und die Weigerung **nicht umgangen**.
- **Nach jedem Release trägt die Wache die Version hier ein** und setzt eine Zeile in [log.md](log.md) — ihr einziger Schreibzugriff im Repo.

## Arbeitsbaum

**Parallelsitzungen teilen EINEN Arbeitsbaum.** Ein fremder Push nimmt eigene Commits mit, HEAD springt. Deshalb: `git status` vor jedem Schreiben, Inhaltsanker statt Zeilennummern, niemals `git add -A`. Fremde Zweige sieht nur `git ls-remote --heads` (Fetch-Refspec ist auf main verengt).

## Lange Läufe (Stand 04.09.2026)

**Nur über die Windows-Aufgabenplanung starten, nie aus dem Prozessbaum einer Claude-Sitzung.** Der Vollsammlungs-Nachtlauf starb am 04.09. um 04:38 ohne Fehlerzeile, als die Sitzung neu verband — auch „losgelöste" Kinder hängen am Job-Objekt. Muster:

```
schtasks /Create /TN "Markt-Dashboard <Name>" /TR "\"<wrapper.cmd>\"" /SC ONCE /ST HH:MM /F
schtasks /Run /TN "Markt-Dashboard <Name>"
```

Der Wrapper macht `cd /d <Repo>` und leitet die Ausgabe in eine Logdatei; kein `&&` in `/TR`. Schlüssel aus dem Benutzerprofil sieht die Aufgabe von selbst. Prüfen: `schtasks /Query /TN … /FO LIST`, `Get-Process node`, Fortschrittsdatei des Werkzeugs. **Der PM fährt Läufe selbst** (Wilhelm 03.09.: „starte du doch bitte einfach die cmd") — Migration, Nachholer, Prüfungen, Nachtlauf, Tagesarchiv-Nachlauf.

Ein PM-Weckruf im **Hintergrund** (Cron in der Sitzung) ist erlaubt, wenn er auf einen Lauf wartet; ein Weckruf, der alle fünf Minuten den Kontext neu liest, nicht (Token-Sparbetrieb).

## Token-Sparbetrieb (seit 31.08.2026)

Die drei Kostentreiber, gemessen: **(1) elf Sitzungen gleichzeitig**; **(2) PM-Weckruf alle 5 Minuten**; **(3) zu lange Nachrichten**. Regeln seither: wenige Chats, selbsttragende Einzelaufträge, Koordination über Dateien (`uebergabe/`, Commits, dieses Wiki), Chat danach schließen.

## Archiv-Pflege

- Das Yahoo-Archiv **veraltet, sobald der PC aus ist**. Nachziehen: `node tools/archiv-nachladen.js` (setzt selbst eine Sperre, bis ~3 h) — als Aufgabe, siehe oben. Die App sammelt seit 27.08. auch 60m und 1d selbst (gedeckelt 300 je Lauf); **bis zum Fix von Auftrag Nr. 1 verhungert dieser Sammler am Kopf der Schlange** ([offene-auftraege.md](offene-auftraege.md)).
- **1m-Sammlung der App ruht** (`sammler.json`, seit 27.08.); Minutenkerzen kommen aus dem Alpaca-Archiv.
- Klick-Sperrliste für UI-Tests: nie `#kostenRundeBtn`, `#mfdRebalanceBtn`, `#mfdDriftBtn`, `#mfdTaktBtn`, `#massenBtn`, `#massen1mBtn`, `#runJobBtn`, `#btRunBtn`, `#drLadeBtn`, `#drLadeAlleBtn`, kein „Jetzt holen"; **dazu (QS 04.09.)** `#pilotBtn`, `#quelleTestBtn`, `#regimeBtn`, `#filterBtn`, „Laden & rechnen" im Schein-Finder, „Zeichnen" im Strategie-Chart (lösen Mess- oder Netzläufe aus), `#diagJa`; nie die laufende App oder ihren Store anfassen; nur isolierte Instanzen (`tools/ui-probe.js`, `tools/ui-aufnahmen.js --kunstdaten`).

## Adressierung von Sitzungen

**Nach einem Brücken-Neustart zeigen Kürzel auf ANDERE Sitzungen.** Vor jedem `SendMessage` `ListAgents`. Eine Nachricht an eine `Remote Control · offline`-Zeile meldet `success` und kommt nirgends an. **Versendet ist nicht zugestellt.**
