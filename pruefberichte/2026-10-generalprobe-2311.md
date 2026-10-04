# Generalprobe der ersten Umschichtung des Momentum-Buchs (Mo 23.11.2026) – Stand main 61dca2c

**Kurzfassung** (Kunstdaten, feste Uhr; Diff 450daed..61dca2c in mfhandel.js, mfdepot.js, kurse.js)
1. **A – Split mit Ex-Tag = Ausführungstag** (M-02, D-02, H-c2): Eröffnung schon nachsplit, Stückzahl noch vorsplit → Verkauf bringt 1/Faktor (4:1: 2.495 statt 9.980 $), Depotwert zu niedrig, Käufe zu klein. `mfdepot.js:384/422`, `mfhandel.js:118`.
2. **A – Fehlt die Eröffnung einer gehaltenen Position, zählt sie im Platzwert 0** (D-04, D-05, H-b2): Käufe 5 % und mehr zu klein, Bargeld bleibt liegen (b2: 14.164 $, Soll 0). Fehlt sie für alles außer SPY, kauft das Nachfassen mit dem ganzen Bargeld einen Wert (84.661 $, 89 % des Buchs). `mfhandel.js:123-130,748,777`.
3. **A – SPY ist der letzte der 194 Abrufe** (D-06): scheitert er, trägt die alte Marktreihe den neuen Stand → 61 statt 62 Balken, am 23.11. keine Umschichtung, Tagespunkt mit falschem Datum. `mittelfrist.js:215,249-251`.
4. **A (bedingt) – Stichtag-Prüfung zählt tote Reihen im Nenner** (D-07): ab 10 dauerhaft verschwundenen Werten (5 % von 193) nie wieder eine Umschichtung. Im echten Bestand per Feldabfrage `weg` in `mf_tagesdaten_index` prüfen (ich hatte keine Daten).
5. **A klein – Ausschüttung mit Ex-Tag = Ausführungstag geht für zur Eröffnung verkaufte Positionen verloren** (M-01, D-01, H-c1); REGEL C.3 zählt sie. `mfhandel.js:607`.
6. **B** – Reihenende erst nach 5 Handelstagen (bewusst, M-03/H-d): am Umschichtungstag fehlt der Wert im Platzwert (20 statt 19 Positionen); Netzfehler = „keine Eröffnung", Quartal verloren (D-08); Tagespunkt nach 16:15 mit Buch vor Umschichtung (D-03); Uhrsprung +90 min speichert laufenden Balken (H-g); Takt braucht `drift_markt` (D-09).
7. **C** – Knopf stumm/zweite Umschichtung (D-10, D-11), `floor` statt `round` im Nachfassen (M-04), Kleinst-Zählung im Text (M-05).
8. **Bestanden:** a (normal: genau eine Umschichtung 09:35, 18 Trades zur Eröffnung, Stichtag 20.11., Ziel 19 von 190 = Soll), b1 (Abruf ganz weg), e (Start 15:50), f (Feiertag Montag → Dienstag 09:35, Stichtag Freitag), g1b (Uhr −30 min); Fälligkeit 23.11. = 63. Handelstag (kein off-by-one); NY-Zeit ohne Abweichung in 10.212 + 5.840 Rasterpunkten an den Zeitwechseln; keine Doppelausführung, kein negatives Bargeld, keine verlorene Position, Neustart mitten in `offen` sicher; Ereignis-/Balkenstempel in Winter- und Sommerzeit gleich.

Prüfen: `node pruefberichte/generalprobe-2311.test.js` (39 Prüfungen, ca. 11 s; je Fund „ZEIGT ABWEICHUNG" / „kein Unterschied"). Szenarien: `node pruefberichte/generalprobe-2311/harness.js alle` (ca. 7 min). App-Code unverändert. Simulation mit virtuellem Kapital, keine Anlageberatung.

---

## 1. Szenarien (je eigener Lauf, Takt alle 5 Minuten, Fr 20.11. 00:00 – Di 24.11. 23:55 New York)

Protokolle: `pruefberichte/generalprobe-2311/szenario-<kennung>.md/.json`. Der Harness fährt den echten Lader (`kurse.js`, `mittelfrist.js`) hinter einer zeitrichtigen Yahoo-Attrappe (laufender Balken bis 16:00, Ereignisse mit Stempel des Ex-Tags) und `mfdepot.js` mit einer gemeinsamen Uhr. Das Soll wird dreifach gerechnet (von Hand, mit `momentumZiel/planeUmschichtung/fuehreAus`, Ausführung von Hand) und gegen Journal, Trades, Kurse, Endbuch, Tagespunkte, Erhaltung verglichen.

| Szenario | Ergebnis | Befund |
|---|---|---|
| a normal | genau eine Umschichtung 09:35, 18 Trades zur Eröffnung 23.11., Stichtag 20.11., Zielzahl 19 / 190 zulässig | stimmt mit REGEL §1.2–1.3 |
| b1/b1w Abruf Mo 08–12 ganz weg | kein Handel vor 12:00, dann einmal zur Eröffnung | stimmt |
| b2/b3 45 Werte leer bis 11:00 / bis Di | Nachfassen kauft zur Eröffnung, aber Budget falsch: 14.163,63 $ (b3 13.809,90 $) Bargeld, Soll 0; b3: drei Verkäufe liegen 63 Handelstage | **A** (Fund 2) |
| c1 Split Fr, Ausschüttung Mo | Freitags-Split richtig gebucht; Ausschüttung auf bleibendem Wert ok, auf verkauftem Wert verloren (29,33 $) | **A klein** (Fund 5) |
| c2 + Split Ex-Tag Mo | 3.086,49 $ unter Soll (2,7 % des Buchs), Verkauf 3.064,58 statt 6.129,16 $ | **A** (Fund 1) |
| d/d2 Reihe endet Mi 18.11. | App bucht nach 5 Handelstagen aus, REGEL nach 1; 20 statt 19 Positionen bzw. 2.489 statt 5.723 $ Bargeld | **B** (im Code als Abweichung vermerkt, Wirkung am Umschichtungstag nicht) |
| e Start Mo 15:50 | Nachladen, dann Umschichtung 15:55 zur Eröffnung (nicht zum Kurs von 15:55); echter 30-min-Takt: 16:20, ebenfalls Eröffnungskurs | stimmt |
| f Montag Feiertag | Montag kein Handel/Journal/Punkt; Di 09:35 eine Umschichtung zur Eröffnung des Dienstags, Stichtag Freitag | stimmt |
| g Uhr −30 min 09:50, +2 h 13:00 | Handel richtig; Montagspunkt +106,79 $, Dienstagspunkt +115,33 $ über Soll (laufender Balken als Schluss) | **B** |
| g1b Uhr −30 min vor Umschichtung | keine Doppelausführung | stimmt |
| g-dst Sommer-/Winterzeit | 0 Abweichungen in 10.212 Rasterpunkten (08.03.2026, 01.11.2026, 14.03.2027; 07.03.2027 ist kein Wechsel) | stimmt |

Tagespunkt im Normalfall: Freitagspunkt mit dem Buch vor der Umschichtung, Montagspunkt am Dienstag mit dem neuen Buch zu den Montagsschlüssen – stimmt mit REGEL §1.3 (Periode = Wert zum Schluss des Stichtags).

## 2. Funde (zusammengeführt; Doppelfunde der drei Prüfer unter einer Nummer)

| Nr. | Klasse | Kennungen | Ort | Auslöser | beobachtet → erwartet |
|---|---|---|---|---|---|
| 1 | A | M-02, D-02, H-c2 | `mfhandel.js:118,159`, `mfdepot.js:263,278-300,384,413-423` | Split mit Ex-Tag = Ausführungstag in einem gehaltenen Wert; `bucheMassnahmen` kennt nur gespeicherte Balken (bis Freitag), die Eröffnung (`bereinigt:false`) ist schon nachsplit | 100 Stück bringen 5.022 statt 10.044 $; 4:1: 2.495 statt 9.980 $, Depotwert 12.500 statt 20.000 $ → Messung (bereinigte Kurse) rechnet voll |
| 2 | A | D-04, D-05, H-b2 | `mfhandel.js:123-130,748,777`, `mfdepot.js:422-428` | Eröffnung einer gehaltenen Position fehlt um 09:35 (Teilausfall, späte Eröffnung) | Wert zählt im Platzwert 0 → Budget 4.737 statt 5.000 $; Kleinstaufbau Depotwert 1.000 statt 2.000, Kauf 5 statt 10 Stück. Fehlen alle außer SPY: Budget 0 → Nachfassen kauft mit dem ganzen Bargeld (84.661 $) |
| 3 | A | D-06 | `mittelfrist.js:215,249-251` | SPY-Abruf (194., letzter) scheitert im Freitagslauf | Marktreihe 1 Tag alt, aber „frischer Stand" → Mo 61 statt 62 Balken, keine Umschichtung; Punkt 19.11. statt 20.11. |
| 4 | A (bedingt) | D-07 | `mfhandel.js:360-366`, `mittelfrist.js:243-248` | `stichtagPruefen` zählt behaltene tote Reihen im Nenner (≥ 5 % tot) | ab 10 toten Reihen von 193 nie wieder Umschichtung, Nachladen hilft nicht. Bekannt tot: BK, MMC, HES, FI – Länge von `weg` im echten Bestand abfragen |
| 5 | A klein | M-01, D-01, H-c1 | `mfhandel.js:607-611`, `mfdepot.js:384` | Ex-Tag = Ausführungstag, Position wird zur Eröffnung verkauft; Takt bucht vor dem Verkauf nichts (Montagsbalken fehlt), danach ist die Position weg | 0 statt 50 $ bzw. 150 $ im Kunstfall; REGEL C.3: zählt noch (auch im echten Depot, T+1: der Zweifel liegt bei der App, nicht bei der REGEL) |
| 6 | B | M-03, H-d | `mfhandel.js:426-447` (`REIHENENDE_TAGE = 5`) | Reihe endet in den 5 Handelstagen vor der Umschichtung | Position „ohne Kurs gehalten", fehlt im Platzwert: 20.000 statt 40.000 $, Neukauf 0 statt 399,2 Stück (REGEL §1.4: erster Tag ohne Zeile) |
| 7 | B | D-08 | `mfdepot.js:278-306,440-449` | Netzfehler = „keine Eröffnung"; antwortet bis 16:00 nur SPY | gilt als ausgeführt (`letzteAusfuehrungTag`, `liquideSeit`), Quartal verloren – braucht Wilhelms Entscheid zu Nr. 94 |
| 8 | B | D-03 | `mfdepot.js:244,398` | erster Takt des Ausführungstags nach 16:15 | Punkt mit Buch vor Umschichtung: 100.827 statt 102.758 $ |
| 9 | B | H-g | `mfhandel.js:297-303`, `mittelfrist.js:81` | Systemuhr springt vor 16:15 vor | laufender Balken als Schluss gespeichert, Punkt +106,79 $; die Quelle (`meta.currentTradingPeriod`) wird nicht gefragt |
| 10 | B | D-09 | `mfdepot.js:346-363` | `drift_markt` fehlt im Bestand | Momentum-Buch handelt nicht, Meldung „Keine Tagesdaten" falsch (Buch hat seit Nr. 93 `mf_bezug`) |
| 11 | C | D-10, D-11 | `mfdepot.js:341,414,447` | Knopf während Takt / nach automatischer Umschichtung | stumm bzw. zweite Umschichtung „0 Orders", `korbVerlauf` 1→2 |
| 12 | C | M-04 | `mfhandel.js:777` | `floor` im Nachfassen, `round` in Plan/Messung | 1.666,6666 statt 1.666,6667 Stück |
| 13 | C | M-05 | `mfhandel.js:118` | `plan.kleinst` zählt ohnehin zu verkaufende kleine Bestände | Journal „Kleinstbestand aufgelöst" zu hoch |
| 14 | C | H-lib-require | `generalprobe-2311/lib.js` | `fs/path` ohne `require` (von mir behoben, Test jetzt „kein Unterschied") | – |

Ausführliche Herleitungen: `funde-mfhandel.md`, `funde-mfdepot.md`, `szenario-*.md` im Ordner `pruefberichte/generalprobe-2311/`. Einzeltests: `funde/*.js` (Kennungen M-, D-, H-, `ok`-Gegenproben).

## 3. Entlastet (geprüft, kein Fund)
LAEUFT-Sperre (keine überlappenden Takte), `fuehreAus`→`speichern()` ohne `await` (Handel, `letzteAusfuehrungTag`, `offen`, Journal in einem Schreibvorgang), Neustart um 10:00 (keine zweite Umschichtung, `offen` läuft weiter, 16:00 „Nachfassen beendet"), Nachfassen bei fehlenden Zielen (Gewichte, Rang, Bargeld), `bucheMassnahmen`-Grenzen (Ex-Tag = Kauftag, Split + Dividende im Takt, Leerverkauf, Doppelbuchung, Sperre 30 Tage, umgekehrter Split), 3.000 Zufallsläufe `nachfassen`/Regel K ohne Doppelkauf/negatives Bargeld, `kurse.js` (`bars`/`roh` gleichlaufend, `ereignisseAus/Ab`), Fälligkeit, NY-Zeit.

## 4. Offen / Vermutung (nicht nachgewiesen, nicht als Fund geführt)
- Regel K ist in der Messung aus (`rueckblick.js:198/200`), in der App seit Nr. 87 an (0,05) – abgenommen, kein Fehler, aber Live ≠ Messung dort, wo sie greift.
- Reihe mit Lücke: App bucht nach 5 Tagen aus, Messung nicht. Fehlgeschlagener Abruf einer lebenden Position könnte als Reihenende gelten.
- Ladezeit kurz vor 16:15 kann als „frisch" gelten, ohne dass alle Werte den Balken haben; fehlendes `kursT` bei Positionen vom 25.08. (Ausschüttungen Ex 25.08.); Verlauf nach mehreren Tagen Pause nur ein Punkt; ob Yahoo um 09:35 schon den Tagesbalken mit Eröffnung führt (ohne Netz nicht prüfbar).
- Grenzen der Attrappe: Schluss gilt ab 16:00 als endgültig; die Beträge bestätigen Rechenwege, keine Marktzahlen. `geprueft` im Korb: App 192, Soll 193 (Reihe mit 252 Balken wird vom Lader verworfen; kein Einfluss auf Ziel).
