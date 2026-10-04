# Fix der Generalprobe 23.11.2026 und der Lader-Störungen (Zweig fix/generalprobe-2311)

**Kurzfassung** (Soll: `studien/massstab-rueckblick-2026-10-04/REGEL.md`; gemessene Funktionen `buchKonfig`, `momentumZiel`, `planeUmschichtung`, `fuehreAus`, `bewerte` byte-gleich zu 61dca2c)
1. **Fund 1 A** Split am Ausführungstag (M-02, D-02, H-c2): **behoben**, `640ec0b`
2. **Fund 2 A** Platzwert ohne Eröffnung gehaltener Werte (D-04, D-05, H-b2): **behoben**, `5ed89a9`
3. **Fund 3 A** alter SPY unter neuem Stand (D-06): **behoben**, `234c03e` (mittelfrist.js)
4. **Fund 4 A** tote Reihen im Nenner der Stichtag-Prüfung (D-07): **behoben**, `76301c6`
5. **Fund 5 A** Ausschüttung einer zur Eröffnung verkauften Position (M-01, D-01, H-c1): **behoben**, `93dd22f`
6. **Fund 6 B** Reihenende erst nach 5 Tagen (M-03, H-d): **offen**, braucht einen Entscheid (bewusste Abweichung Nr. 93 A2; live ist Ende und Lücke nicht unterscheidbar, REGEL C.5)
7. **Fund 7 B** nur SPY antwortet (D-08): **behoben**, `e681ae9` + `aceda32` (Nachweis D-08b)
8. **Fund 8 B** Tagespunkt nach 16:15 mit Buch vor dem Handel (D-03): **behoben**, `af31e6d`
9. **Fund 9 B** Uhrsprung, laufender Balken (H-g): **kein Fehler** gegen REGEL (Betriebsstörung, gehandelt wird richtig)
10. **Fund 10 B** drift_markt als Bedingung (D-09): **behoben**, `9112a38`
11. **Lader KU-2, KU-5, KU-6, KU-9, KU-13, KU-14 (A):** **behoben**, `65e9077` (kurse.js). **KU-8, KU-10 (A): offen** (andere Prüfung, nicht in kurse.js allein). KU-7 B, KU-11 C: offen.
12. **Klasse C** (D-10, D-11, M-04, M-05): nicht Gegenstand. **Dauerhafte Tests:** test-v6 Abschnitte 101 (`6741751`) und 102 (`7f0ac2a`).
13. **Prüfläufe:** test-v6 5.484 ✅ / 0 ❌ (vorher 5.440), test-channel grün, eslint 0 Fehler, live-gegen-messung [1]–[10] und [12]–[15] ohne Unterschied, [11] gewollt. Generalprobe 7/40 rot (nur Fund 6, Fund 9, Klasse C). Lader 49/83 rot (vorher 55), 0 kaputt.

Simulation mit virtuellem Kapital, keine Anlageberatung.

---

## Vorgehen

- Der Zweig ist von main 61dca2c abgezweigt. Die vier Prüfer-Commits von `pruefung/generalprobe-2311` sind vorgespult (bis 0b0e522), `pruefung/lader-stoerungen` (deb0ef5) ist zusammengeführt (`584e4ef`). Damit liegen Nachweise, Harness und Einzeltests unverändert im Zweig.
- **Vier Fundgruppen** liefen parallel, jede in einem eigenen Klon, keiner mit Remote:
  - Gruppe 1 „Ereignisse am Ausführungstag“: Funde 1 und 5
  - Gruppe 2 „Platzwert und Netz“: Funde 2 und 7
  - Gruppe 3 „Bestand“: Funde 3 und 4
  - Gruppe 4 „Takt-Rand“: Funde 8 und 10, Urteile zu 6 und 9
- In den Zweig geschrieben hat nur eine Stelle, in fester Reihenfolge: Gruppe 3, dann 4, dann 2, dann 1 (Cherry-pick je Fund-Commit). Der einzige Konflikt war die return-Zeile von `ausfuehrungVorbereiten` (Gruppen 1 und 2), von Hand zusammengeführt. kurse.js und test-v6.js hatten je einen Schreiber.
- Jeder Nachweis wurde vor der Änderung rot und danach grün gefahren. Ein Nachweis wurde nur angepasst, wenn seine Attrappe die Behebung nicht abbilden konnte oder ein Teil gegen REGEL verlangte. Jede Anpassung hat einen Kopfkommentar „Angepasst (Fix Generalprobe)“ und wurde erneut rot gegen den alten Code gefahren.

## Je Fund

| Nr. | Urteil gegen REGEL | Änderung | Nachweis (vorher → nachher) |
|---|---|---|---|
| 1 | Fehler. Die Messung rechnet bereinigt, Stück × Kurs bleibt über den Split gleich. | `eroeffnung()` holt die Ereignisse des Tages mit (`ereignisse: true`). Vor Plan und Nachfassen bucht `MH.splitsAmAusfuehrungstag` nur Splits mit Ex-Tag heute. Die Kennung `split:t` verhindert eine zweite Buchung am Abend. Ausschüttungen erst nach dem Handel (C.3). | M-02*, D-02*, H-c2 rot → grün |
| 2 | Fehler, live. Die Messung hat die Eröffnung, die App plante vorher. `planeUmschichtung` bleibt (REGEL §1.3: „wie planeUmschichtung es tut“). | `MH.eroeffnungAbwarten`: Fehlt einer gehaltenen Position mit Balken am Stichtag die Eröffnung, wartet die Umschichtung bis 16:00 New York (gehandelt wird ohnehin zur Eröffnung des Tages). Danach gilt, was da ist. `nachfassen` kauft nie mit Budget ≤ 0. | D-04, D-05, H-b2* rot → grün |
| 3 | Fehler. Stichtag, Fälligkeit und Periode verschieben sich um einen Tag (§1.3). | mittelfrist.js: Ohne SPY-Antwort bleibt `mf_bezug` mit altem Stand liegen. Der Bestand gilt dann nicht als frisch, der Takt lädt nach und handelt nicht falsch. | D-06* rot → grün |
| 4 | Fehler. Verschwundene Reihen bremsen in der Messung nie (§1.2). | `stichtagPruefen` zählt Reihen nicht, die `momentumZiel` am Stichtag als veraltet verwirft (gleicher Vergleich, > 7 Tage). | D-07 rot → grün |
| 5 | Fehler. C.3: Ein Verkauf zur Eröffnung des Ex-Tags zählt noch. | `MH.anspruecheVormerken` nach Umschichtung und Nachfassen. `bucheMassnahmen` Regel 7 bucht den Anspruch einmal, sobald der Bestand den Verkaufstag hat (spätestens 30 Tage). | M-01*, D-01, H-c1 rot → grün |
| 6 | Abweichung von §1.4, aber bewusst (Nr. 93 A2). Live kann am Umschichtungstag Ende und Lücke (C.5) nicht unterscheiden. Ändern heißt, ein Risiko gegen ein anderes zu tauschen. | keine | M-03, H-d bleiben rot – **Entscheid Wilhelm** |
| 7 | Fehler. Ein Ausführungstag hat im Panel Zeilen. Gilt „nur SPY“ als ausgeführt, verliert das Buch ein Quartal. | Hat außer SPY kein Wert eine Eröffnung, gilt die Umschichtung nicht als ausgeführt; neuer Versuch wie bei `zuWenig`. Der Text „verspätet“ nennt jetzt beide Gründe. | D-08 grün schon mit Fund 2, darum neu **D-08b** (nur SPY bis 16:05): rot (auch mit Fund 2) → grün |
| 8 | Fehler. Handel zur Eröffnung, Bewertung zum Schluss (§1.3/§1.8). | Ist der Punkt-Tag heute und wird heute umgeschichtet, wird der Punkt erst nach dem Handel geschrieben. | D-03 rot → grün, D-ok-05 grün |
| 9 | Kein Fehler. Die REGEL setzt die richtige Zeit voraus. Gehandelt wird richtig, falsch ist nur der Tagespunkt bei falscher Systemuhr. | keine | H-g bleibt rot |
| 10 | Fehler. Die Messung kennt drift_markt nicht. | Ohne drift_markt setzt nur das Drift-Buch aus. | D-09 rot → grün |
| KU-2/5/6/9/14 | Fehler. Eine Zeile je Handelstag (§1.3), Handel zur Eröffnung, Reihenende (§1.4). | `zerlege` bei `interval '1d'`: sortieren, je Stempel den letzten behalten, flache Umsatz-0-Kerze neben einem Balken desselben New-Yorker Tags oder am Ende streichen (nicht, wenn schon der Balken davor flach ist). Zähler `umsortiert`/`doppelt`/`stempelKerzen`. | rot → grün |
| KU-13 | Fehler. Fremde Daten unter fremdem Namen. | `hole()` verwirft eine Antwort mit fremdem `meta.symbol` (BRK.B = BRK-B). | rot → grün |
| KU-8, KU-10 | Fehler (A), aber nicht mit derselben Prüfung behebbar. KU-8: adjclose teilweise null. KU-10: Kürzel neu vergeben, Abgleich mit dem Bestand in mittelfrist.js. | keine | **offen** |

\* angepasster Nachweis. D-02: Die Attrappe meldet den Split, wenn die Ereignisse verlangt werden. D-06: Das Nachladen am Montag lädt wirklich. H-b2: Teil 1 (reine `planeUmschichtung`) ist entfernt, weil er gegen REGEL §1.3 verlangt. M-01/M-02: Sie stellen den behobenen Takt mit den neuen Hilfen nach.

## Offen, Hinweise

- **Anzeige am Split-Tag:** Eine im Ziel bleibende Split-Position zeigt bis zum Laden am Abend Stück (nachsplit) × Freitagsschluss (vorsplit) und erscheint zu hoch. Handel, Geld und Tagespunkte stimmen. Neukäufe am Ex-Tag zeigten das schon vorher.
- **Unbelegt ohne Netz:**
  - Ob Yahoo um 09:35 die Ereignisse des Tages schon liefert, ist unbelegt. Fehlt das Ereignis, bleibt es beim alten Verhalten (Fund 1).
  - Wie oft Stempel-Kerzen bei Tagesbalken vorkommen, ist ebenfalls unbelegt.
- **Text:** Nach einer Umschichtung ab 16:00 sagt die Journalzeile noch „fasst heute bis 16:00 nach“ (C).
- **SPY:** Scheitert SPY dauerhaft, lädt der Takt stündlich nach und handelt nicht.
  - Zusätzlich SPY als ersten Abruf zu holen wäre sinnvoll. Dafür muss test-v6 98.1 geändert werden (heute `hole[130]`).
- **Vor dem 23.11.:** Die installierte App muss neu gebaut und installiert werden; `app.asar` war am 04.10. vom 12.09.
- **Vorfall:** Am 04.10. um 23:59 stellte ein fremder Agent (Testläufer) den Arbeitsklon kurz auf `werkzeug/testlaeufer` und dann zurück.
  - Das geschah auf 61dca2c, vor dem ersten eigenen Commit.
  - Geprüft wurden reflog, status, Zweige und remote: keine fremden Commits, Dateien oder Zweige, remote zeigt auf GitHub. Nichts war wiederherzustellen.

## Prüfläufe (Endstand)

| Lauf | Ergebnis |
|---|---|
| `node test-v6.js` | 5.484 ✅, 0 ❌, „ALLE TESTS BESTANDEN“ (vorher 5.440; neu Abschnitt 101 mit 33, Abschnitt 102 mit 11) |
| `node test-channel.js` | ALLE TESTS BESTANDEN |
| `npx eslint .` | 0 Fehler (1 bekannte Warnung test-v6.js:16549) |
| `node pruefberichte/live-gegen-messung-momentum.test.js` | [1]–[10], [12]–[15] kein Unterschied, [11] gewollt |
| `node pruefberichte/generalprobe-2311.test.js` | 7 rot / 33 grün (vorher 21/18 bei 39; neu D-08b). Rot sind nur H-d, M-03 (Fund 6), H-g (Fund 9), D-10, D-11, M-04, M-05 (Klasse C). |
| `node pruefberichte/lader-stoerungen.test.js` | 49 Abweichungen / 34 kein Unterschied / 0 kaputt (vorher 55/28). Neu ohne Unterschied: KU-2, KU-5, KU-6, KU-9, KU-13, KU-14; keine neue Abweichung. |
