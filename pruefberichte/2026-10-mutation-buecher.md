# Mutationstest Momentum-Buch (04.10.2026, Stand 61dca2c)

**Kurzfassung**
- 462 Mutanten in `mfhandel.js`, `mfdepot.js`, `kurse.js`, `liquide.js`, `momentum.js` (A 60, B 102, C 98, D 202); jeder gegen `test-v6.js`, `test-channel.js` und die Kleinsttests 1-15.
- Getötet von den vorhandenen Tests: 315. Überlebt: 147.
- Von den 147 sind 24 äquivalent (aendern im erreichbaren Ablauf nichts) und 123 echte Lücken.
- Echte Lücken nach Schwere: HOCH 26, MITTEL 44, NIEDRIG 53.
- Alle 123 Lücken töten die neuen Kleinsttests `pruefberichte/mutation-buecher.test.js` (281 Zusicherungen, auf 61dca2c grün, unter 5 s). Nur die 24 äquivalenten überleben auch sie.
- Schwerpunkt der HOCH-Lücken: Fälligkeit der Umschichtung (Handelstag zu früh/spät, UTC statt New York, laufender Balken zählt mit), Altersgrenze 7 Tage, Doppelbuchung von Ausschüttung/Teilung, `buchInit` (Startkapital/-bargeld) ungetestet, Stichtag, Wochenende, Drift-Buch-Reihenende.
- Kein App-Code geändert. Referenz: `test-v6.js` zeigt hier 17 rote Zeilen, die nur von fehlenden `node_modules`/Daten kommen; verglichen wurde gegen diese Menge.

## Aufteilung

| Gruppe | Funktionen | Mutanten | getötet | überlebt | äquivalent | Lücken H/M/N | Bericht |
|---|---|---|---|---|---|---|---|
| A | momentumZiel, buchKonfig, rebalanceFaellig, liquide.js, momentum.js | 60 | 40 | 20 | 0 | 6/6/8 | `mutation-buecher/A-bericht.md` |
| B | planeUmschichtung, fuehreAus, bewerte, faelligkeit, Nachfassen | 102 | 83 | 19 | 7 | 3/4/5 | `B-bericht.md` |
| C | bucheMassnahmen, stempleKursT, balkenNach, rohBis, Stichtag, Reihenende, Zeit-Hilfen | 98 | 65 | 33 | 4 | 8/10/11 | `C-bericht.md` |
| D | mfdepot.js-Ablauf (buchInit, Eröffnung, Nachfassen, takt, Buchungen), kurse.js | 202 | 127 | 75 | 13 | 9/24/29 | `D-bericht.md` |

Je Mutant (Kennung, Änderung, Urteil, Begründung, Schwere, tötender Test) stehen die Tabellen in den Gruppenberichten; Mutantenlisten `*-mutanten.json`, Läufe `*-ergebnis-*.json` (`-neu` = mit den neuen Tests), Harness `harness.js` im selben Ordner. Wiederholen: `node pruefberichte/mutation-buecher/harness.js <liste.json> <aus.json> /tmp/mut-x` (mit `NUR_NEUE_TESTS=1` nur die neuen Tests).

## Schwere (Maßstab)
HOCH: verändert Kauf/Verkauf, Kosten, Bargeld, Ziel, Zeitpunkt der Umschichtung oder gebuchte Ausschüttung/Teilung im echten Ablauf. MITTEL: Randfall oder nur Anzeige von Geldzahlen. NIEDRIG: Journal/Text/unwahrscheinlicher Rand, teils live nicht erreichbar.

## Auffälligkeiten ohne Mutant (nur berichtet, nicht behoben)
- `rebalanceFaellig` hat im App-Pfad keinen Aufrufer und zählt einen Handelstag später als `faelligkeit` (A, B).
- `letztesRebalanceT`/`letzteAusfuehrungTag` werden in `mfdepot.js` gesetzt, nicht in `mfhandel.js` (Gruppe D deckt das ab).
- `opts.anteil`/`opts.minWerte` = 0 fallen still auf den Standard, `umsatzMin` = 0 nicht; `STANDARD.minWerte` (25) und `KORB.mindestWerte` (100) stehen doppelt (A).
- `Kurse.url()` baut bei fehlendem `range` und einer Grenze `?range=undefined`; kein heutiger Aufrufer erreicht das (D).
- 90-ms-Pause zwischen Eröffnungs-Abrufen nur für `ausfuehrungVorbereiten` geprüft, nicht für `offenNachfassen` (D).
- Die Tests in D erreichen innere Funktionen von `mfdepot.js` über einen im Test angehängten Export in der vm-Sandbox; die Datei bleibt unverändert.

Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
