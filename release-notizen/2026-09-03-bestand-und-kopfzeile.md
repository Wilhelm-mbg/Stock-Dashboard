# Heute zeigt oben die Bücher

*Sitzung „Bau", 03.09.2026. Oberfläche Stufe 2. Nicht gepusht, keine Version, kein
Build — das macht die Release-Wache.*

## Für die Freigabe-Notiz

**Heute zeigt oben die Bücher: Wert, Ergebnis, letzte Handlung. Die Kopfzeile spricht
jetzt Deutsch.**

Der Bildschirm **Heute** beginnt mit drei Karten nebeneinander — **Momentum-Buch**,
**Ergebnis-Drift-Buch** und **Intraday-Depot**. Jede sagt in vier Zeilen, was los ist:
wie viel das Buch wert ist, was es seit dem Start gebracht hat (in Dollar und Prozent),
wie viele Positionen es hält, ob es selbst handelt oder nur rechnet, wann der nächste
Takt fällig ist und was es zuletzt getan hat. Darunter stehen die **fünf jüngsten
Handlungen aller Bücher** und **ein Verlaufsbild für alle drei** — jedes gegen sein
eigenes Startkapital, damit man sie vergleichen kann.

Die Positionstabellen sind nicht weg, sie stehen unter jeder Karte hinter
**„Positionen im Detail"**. Wer die Kacheln, den Messband-Text und das Protokoll des
Intraday-Depots sucht: die stehen weiter darunter — aber nur, wenn die
Intraday-Strategie eingeschaltet ist. Ist sie aus, sagt die Karte das in einer Zeile
und nennt den Weg zum Schalter.

**Die Kopfzeile** sagt statt „BÜCHER M – · D –" jetzt „BÜCHER Momentum +1,2 % · Drift
−0,4 %" — und wenn ein Buch aus ist oder noch keinen Stand hat, steht genau das da.
Statt „SCAN –" steht „letzter Scan 14:32", „kein Scan heute" oder „Intraday aus". Der
Depotwert ganz links heißt jetzt **Intraday-Depot** statt „Simulation" — dass alles
Simulation ist, steht unverändert darunter im Bestand.

**Im Maschinenraum** (Werkzeuge → Betrieb) trägt jede der elf Klappen rechts eine
Statuszeile: Autopilot und letzte Nachtmessung, gemessene Kostenrunden, aktive Regel
mit ihrem Urteil, Zahl der Messprotokolle. So sieht man den Stand, ohne aufzuklappen.
Wo es nichts zu melden gibt, bleibt die Zeile leer — sie erfindet nichts.

**Keine Zahl in diesem Block ist neu gerechnet.** Alles kommt aus den Daten, die das
Depot ohnehin führt; wo eine Quelle fehlt, steht ein Strich mit dem Grund.

## Technisch

- Neu: `DepotAPI.handlungen(n)`, `DepotAPI.protokollKennungen()`,
  `DepotAPI.antwort().letzterScan`, `Scoreboard.registerStand()`,
  `MFDepot.karten()`, `U.pz1` (umgezogen aus `depot.js`).
- Neue Kennungen im Markup: `buecherZeile`, `buchMomentum`, `buchDrift`,
  `buchIntraday`, `buchMomentumKopf`, `buchDriftKopf`, `buchIntradayKopf`,
  `zuletztGetan`, `buecherChart`, `buecherLegende`, `intradayBereich`,
  elf `kstand-*`.
- Neues Werkzeug: `tools/kunstdepot.js` und `tools/ui-aufnahmen.js --kunstdaten`
  (erfundener Store-Zustand für Aufnahmen in isolierten Instanzen).
- `tools/ui-probe.js` prüft jetzt zusätzlich das Verhalten des Intraday-Behälters.
- `npm test`, `tools/ui-probe.js` und `tools/a11y-probe.js` vorher und nachher grün.
- Übergabe mit allen Belegen:
  `Markt-Dashboard-Daten/uebergabe/oberflaeche-stufe2-2026-09-03.md`.

## Drei Befunde nebenbei (eigene Aufträge, nicht in dieser Auslieferung behoben)

1. Der Leck-Test der Spannen-Studie hängt `process.stdout.write` um und gibt es erst
   nach einem `await` zurück — dazwischen verschwindet die Ausgabe jedes weiteren
   Prüfabschnitts. Zwischenlösung im Repo, echte Behebung beauftragt.
2. Die Übernahme alter Kostenrunden aus dem Depot-Store feuert nie (`D` ist zum
   Zeitpunkt des Verkabelns noch leer).
3. `renderer.js` und `backtestui.js` bauen die Depot-Kachel noch von Hand statt über
   `U.kachel()`.
