# DATENBAU — GDELT-Datenbau Nr. 47 (Zähler + schlanker Rohauszug 2017-01-01 … 2026-08-31)

Bau-Protokoll des Datenbaus zur registrierten Studie `nachrichten-stimmung-tage-2026-09-19/v1` (§2/§3/§9 der
VORREGISTRIERUNG.md, Nachträge 1–3). Abgeschlossen mit Auftrag Nr. 63 am 23.09.2026. **Alle Zahlen stammen aus Dateien:**
`abschluss-pruefung.json` (erzeugt von `abschluss-pruefung.js` am 2026-09-23T20:48:59Z über die Ablage auf dem Rechenknecht),
`vergleich-126.txt`, den Belegen `roh/<UTC-Tag>.json`, den Stück-Belegen, den Logs `log-<k>.txt` und den Fortschrittsdateien.
Nichts ist aus Chats abgetippt. Keine Messung, keine Auswertung der Stimmung — das ist Nr. 45.

## 1. Was gebaut wurde

| | |
|---|---|
| Zeitraum | ET-Kalendertage **2017-01-01 … 2026-08-31 = 3.530** (Kalender gerechnet: `kalender.etTage`) |
| Werkzeug | `gkg-tage.js`, Kennung `nachrichten-stimmung-tage-2026-09-19/gdelt/v1`; Rohauszug `…/gdelt-roh/v1`; Namenskarte `…/namenskarte/v2` (661 Symbole, nur Stufe „voll") — alle 3.530 Tagesdateien tragen genau diese Kennungen (`tagesdateien.kennungen`) |
| Werkzeugstand | Repo-Commit `ead68a7` (Stand des Checkouts auf dem Rechenknecht während Vollauf und Nacharbeit; `test.js` dort 91 Prüfungen grün, siehe Übergabe 22.09.) |
| Quelle | GDELT GKG 2.1, `http://data.gdeltproject.org/gdeltv2/<YYYYMMDDHHMMSS>.gkg.csv.zip`, 15-min-Dateien |
| Lauf | 20 systemd-Einheiten `gdelt-datenbau-1 … 20` (`vollauf.sh start 20`), Tag *i* an Teil *(i mod 20)+1*; 177 bzw. 176 ET-Tage je Teil |
| Start / Ende | **2026-09-22 12:15:37 UTC** (erster START-Eintrag) … **2026-09-22 21:56:31 UTC** (letzter ENDE-Eintrag) = 9 h 41 min; je Teil 34.155–34.854 s (`lauf.teile`) |
| Nacharbeit | 15 ET-Tage am 2026-09-23 20:32–20:45 UTC (§4) |
| Ablage (Server) | `/archiv/markt-dashboard/studien-zellen/gdelt-2017-2026/` — `tage/`, `roh/`, `kontrolle/`, dazu `log-*.txt`, `lauf-20-*.out`, `_fortschritt-*.json`, `tage-vor-umbau/`, `nacharbeit/`, `pruefung/`, `probe-roh/` |

### Datenmenge

| Größe | Wert | Quelle |
|---|---|---|
| Quelldateien Soll / gefunden / fehlend (404) | **338.876 / 331.749 / 7.127** (2,10 %) | `tagesdateien.summen` |
| Download (Zip, aus `bytesZip` aller Tagesdateien) | **2.184.286.121.254 Byte = 2,18 TB** | `groesse.downloadZipBytes` |
| entpackt (CSV) | 6.830.484.570.255 Byte = 6,83 TB | `groesse.downloadCsvBytes` |
| GKG-Zeilen gelesen | 547.275.171 (davon 2.822 mit falscher Feldzahl übersprungen) | `summen.zeilen`, `summen.falscheFeldzahl` |
| Zeilen mit Organisationsspalte (`mitOrganisation`) | **398.550.733** | `summen.mitOrganisation` |
| Rohauszug | **3.529 UTC-Tage, 54,09 GB (50,37 GiB), 398.449.271 Zeilen**, unkomprimiert 149,4 GB; plus 2 Randstücke mit 101.462 Zeilen — **398.449.271 + 101.462 = 398.550.733 = Summe `mitOrganisation`** (Auszug und Zähler decken sich zeilengenau) | `groesse`, `rohauszug.stuecke` |
| Auszug am Download | 2,48 % | `groesse.anteilAuszugAmDownload` |
| Treffer der Namenskarte | 37.775.208 = Σ n (26.396.207) + Σ nSpaet (11.379.001) — die Identität gilt (`nPlusNSpaetGleichTreffer: true`); 599 der 661 Symbole kommen vor; 1.129.037 Symbol-Tage | `tagesdateien` |
| Klinken | `fremderTag` 0, `stempelAusDatei` 0, `stempelUngleichDatei` 0, `trefferUebersetzt` 0 | `summen` |

Rohauszug je Jahr (`groesse.jeJahr`; fehlend = 404-Dateien laut Belegen):

| Jahr | UTC-Tage | GB | Zeilen | fehlend |
|---|---|---|---|---|
| 2017 | 364 | 9,08 | 67.008.105 | 985 |
| 2018 | 365 | 8,18 | 59.955.377 | 992 |
| 2019 | 365 | 6,68 | 49.468.194 | 11 |
| 2020 | 366 | 5,35 | 39.036.806 | 2.585 |
| 2021 | 365 | 4,52 | 32.976.564 | 610 |
| 2022 | 365 | 3,85 | 28.558.601 | 87 |
| 2023 | 365 | 5,16 | 37.500.045 | 172 |
| 2024 | 366 | 4,85 | 35.551.834 | 2 |
| 2025 | 365 | 4,00 | 29.983.154 | 1.681 |
| 2026 | 243 | 2,43 | 18.410.591 | 2 |

(2017 hat 364 fertige UTC-Tage, weil der 2017-01-01 ein Randstück ist; Summe 3.529.)

## 2. Tagesdateien `tage/` (§1.1)

- **3.530 von 3.530** vorhanden, alle gültiges JSON im Format aus `gkg-tage.js` (`kennung, karte, tag, soll, dateien, fehlend,
  dauerS, zaehler, symbole, stichprobe`), **0 unvollständig** (überall `gefunden + fehlend = soll`).
- **Summe `fehler` = 0.** Kein Tag mit `fehler > 0` (die Liste `tagesdateien.fehlerTage` ist leer). Die 15 Netzfehler des
  Vollaufs wurden durch die Nacharbeit (§4) ersetzt; die Tagesdateien dieser Tage sind die vom 23.09.
- `offeneTage` in den 20 Fortschrittsdateien: 15 Einträge (je einer in den Teilen 1–5, 7–10, 12, 14–17, 19) — laut Tagesdatei
  **0 davon noch offen**. Die Fortschrittsdatei eines Teils wird von einem Einzeltag-Lauf nicht nachgetragen; die Tagesdatei ist
  die Wahrheit (so ist das Werkzeug gebaut: erledigt = vollständige Tagesdatei, egal welcher Teil sie schrieb).
- Fehlende Quelldateien (404) je Jahr: 2017 985, 2018 992, 2019 11, 2020 2.585, 2021 610, 2022 87, 2023 172, 2024 2, 2025 1.681,
  2026 2. Nach UTC-Stunde häufen sie sich nachts (00–06 UTC je 375–426, 08–12 UTC je 177–188).
- Blockausfälle (Tage mit ≥ 8 fehlenden Dateien, `tagesdateien.blockAusfaelle`): Nov–Dez 2017 und Jan–Apr 2018 (8–15 je Tag);
  2018-07-15 (29); **2020-09-24 … 2020-11-17** (15–88 je Tag, Schwerpunkt 15.10.–16.11.); 2021-07-29 … 2021-08-18 (13–53);
  2022-11-10/11 (28, 55); 2023-03-21 … 23 (8, 94, 43); **2025-06-14 … 2025-07-01** (40, 16 × 96, 89). 16 Tage ganz ohne
  Datei: 2025-06-15 … 2025-06-30.

## 3. Positivkontrolle (§1.2) und Plausibilität (§1.3)

**`vergleich-126.js`** (Tagesdateien des neuen Laufs gegen `tage-vor-umbau/tage/`, die 126 Tage des ersten Laufs vor dem
Rohauszug-Umbau; Vergleich ohne das Laufzeitfeld `dauerS`): **bytegleich 126, ungleich 0, noch nicht neu gezählt 0**
(`pruefung/vergleich-126.txt`, Rückgabewert 0). Die Zählung ist damit über 126 Tage deterministisch wiederholt — Stichprobe
(fnv1a-Reservoir) eingeschlossen.

Firmennennungen je Tag = `zaehler.treffer` (Σ n + nSpaet über die Kartensymbole), je Jahr (`plausibilitaet`):

| Jahr | Tage | Median | P5 | P95 | Ausreißer < 10 % des Jahresmedians |
|---|---|---|---|---|---|
| 2017 | 365 | 16.590 | 6.174 | 24.380 | 0 |
| 2018 | 365 | 16.167 | 6.152 | 22.279 | 0 |
| 2019 | 365 | 13.692 | 4.544 | 18.622 | 0 |
| 2020 | 366 | 10.997 | 3.005 | 17.413 | 5: 2020-11-07 (542, 13 Dateien), 11-08 (705, 22), 11-13 (971, 8), 11-14 (727, 9), 11-15 (675, 14) |
| 2021 | 365 | 11.657 | 3.810 | 17.939 | 0 |
| 2022 | 365 | 7.917 | 2.506 | 11.251 | 0 |
| 2023 | 365 | 10.354 | 3.345 | 15.452 | 1: 2023-03-22 (422, 2 Dateien) |
| 2024 | 366 | 11.083 | 4.737 | 15.029 | 0 |
| 2025 | 365 | 8.601 | 2.544 | 13.271 | **17: 2025-06-15 … 2025-06-30 (je 0, 0 Dateien), 2025-07-01 (143, 7 Dateien)** |
| 2026 | 243 | 7.889 | 2.926 | 10.659 | 0 |

Der bekannte GDELT-Ausfall 15.06.–01.07.2025 ist sichtbar und **kein** Fehler des Baus (die Quelle liefert 404). Alle 23
Ausreißertage fallen mit Blockausfällen der Quelle zusammen (§2); es gibt keinen Ausreißer mit vollständiger Datei-Menge.
Zum Vergleich `mitOrganisation` je Tag (Median): 2017 192.118 → 2022 87.982 → 2026 85.399 — GDELT ist seit 2017 etwa halb so
breit.

## 4. Rohauszug `roh/` (§2): Stücke, Loch im Lauf, Nacharbeit

**Erwartete UTC-Dateitage:** Der ET-Tag 2017-01-01 beginnt 05:00 UTC am 2017-01-01, der ET-Tag 2026-08-31 endet 03:59:59 UTC
am 2026-09-01; die 3.530 ET-Tage berühren also die UTC-Dateitage **2017-01-01 … 2026-09-01 = 3.531** (Kalender gerechnet,
`kalender.utcTage`). Davon sind zwei **Randtage**, die nur zur Hälfte im Lauf liegen: UTC 2017-01-01 (frühe Stunden gehören zum
ET-Tag 2016-12-31) und UTC 2026-09-01 (Rest gehört zum ET-Tag 2026-09-01). Beide liegen laut Bauart als Stück in `roh/_teile/`
und **bleiben es** — die fehlenden Hälften lägen außerhalb des registrierten Zeitraums, und die Roh-Klinke verlangt 96 Stempel
je fertigem UTC-Tag. Soll fertiger UTC-Tage also **3.529**.

**Stück-Logik** (aus `gkg-tage.js` `rohAblegen`/`rohVereine`/`rohNachlauf`, von `vollauf.sh start` über `--rohNachlauf`
benutzt), in zwei Sätzen: Jeder ET-Tag D legt nach *vollständiger* Zählung und *vor* seiner Tagesdatei zwei Stücke atomar
(`.tmp` → Umbenennen, die `.json` zuletzt = Stück fertig) nach `roh/_teile/` — `<D>_<D>` (Rest des UTC-Tags D ab 04:00/05:00 UTC,
80/76 Dateien) und `<D+1>_<D>` (frühe Stunden des UTC-Tags D+1 bis 03:45/04:45 UTC, 16/20 Dateien); Name = `<UTC-Tag>_<ET-Tag>`.
Wer das zweite Stück eines UTC-Tags U liefert, nimmt die mkdir-Sperre `U.sperre`, prüft `soll₁ + soll₂ = 96`, hängt die
gzip-Glieder in der Reihenfolge `U_(U−1)`, `U_U` (chronologisch) aneinander, schreibt erst `roh/U.json`, dann `roh/U.tsv.gz`
atomar, löscht dann die Stücke und gibt die Sperre frei — ein halber UTC-Tag liegt nie als `roh/U.tsv.gz`.

**Stand nach dem Vollauf (23.09. 20:27 UTC, vor jeder Änderung):** 3.506 fertige UTC-Tage, **25 fehlend**, **18 Stücke**, keine
`.tmp`, keine Sperre. Die 18 Stücke:

| Stück (`UTC_ET`) | Rolle | soll/dateien | Partner-Stück | Befund |
|---|---|---|---|---|
| 2017-01-01_2017-01-01 | Rest | 76/76 | ET 2016-12-31 (außerhalb) | Randtag, bleibt |
| 2026-09-01_2026-08-31 | früh | 16/16 | ET 2026-09-01 (außerhalb) | Randtag, bleibt |
| 2017-03-05_2017-03-04 | früh | 20/20 | `2017-03-05_2017-03-05` fehlt | ET-Tag 03-05 offen |
| 2017-03-07_2017-03-07 | Rest | 76/76 | `2017-03-07_2017-03-06` fehlt | ET-Tag 03-06 offen |
| 2017-03-08_2017-03-07 | früh | 20/20 | `2017-03-08_2017-03-08` fehlt | ET-Tag 03-08 offen |
| 2017-03-10_2017-03-10 | Rest | 76/76 | `2017-03-10_2017-03-09` fehlt | ET-Tag 03-09 offen |
| 2017-03-13_2017-03-12 | früh | 16/15 | `2017-03-13_2017-03-13` fehlt | ET-Tag 03-13 offen |
| 2017-03-14_2017-03-14 | Rest | 80/80 | `2017-03-14_2017-03-13` fehlt | ET-Tag 03-13 offen |
| 2017-03-15_2017-03-14 | früh | 16/16 | `2017-03-15_2017-03-15` fehlt | ET-Tag 03-15 offen |
| 2017-03-16_2017-03-16 | Rest | 80/80 | `2017-03-16_2017-03-15` fehlt | ET-Tag 03-15 offen |
| 2017-03-20_2017-03-19 | früh | 16/13 | `2017-03-20_2017-03-20` fehlt | ET-Tag 03-20 offen |
| 2017-03-21_2017-03-21 | Rest | 80/79 | `2017-03-21_2017-03-20` fehlt | ET-Tag 03-20 offen |
| 2017-03-22_2017-03-21 | früh | 16/13 | `2017-03-22_2017-03-22` fehlt | ET-Tag 03-22 offen |
| 2017-03-25_2017-03-25 | Rest | 80/80 | `2017-03-25_2017-03-24` fehlt | ET-Tag 03-24 offen |
| 2017-03-30_2017-03-29 | früh | 16/16 | `2017-03-30_2017-03-30` fehlt | ET-Tag 03-30 offen |
| 2017-04-01_2017-04-01 | Rest | 80/78 | `2017-04-01_2017-03-31` fehlt | ET-Tag 03-31 offen |
| 2017-04-05_2017-04-04 | früh | 16/14 | `2017-04-05_2017-04-05` fehlt | ET-Tag 04-05 offen |
| 2017-04-08_2017-04-08 | Rest | 80/80 | `2017-04-08_2017-04-07` fehlt | ET-Tag 04-07 offen |

**Das Loch im Lauf:** 15 ET-Tage blieben im Vollauf **offen** (`offeneTage` je Teil; Logzeile `fehler=1(<Stempel>:fehler Zeit)`):
2017-03-05 (Teil 4), 03-06 (5), 03-08 (7), 03-09 (8), 03-13 (12), 03-15 (14), 03-20 (19), 03-22 (1), 03-23 (2), 03-24 (3),
03-30 (9), 03-31 (10), 04-05 (15), 04-06 (16), 04-07 (17). Ursache: je Tag **eine** Quelldatei mit Zeitüberschreitung (120 s in
`hole()`, nach den Wiederholungen); die 15 Tage endeten laut Log zwischen 12:39 und 12:45 UTC am 22.09. — die erste halbe
Stunde nach dem Neustart, als 20 Ströme gleichzeitig die schweren März-Tage 2017 (1,1–1,3 GB je Tag) zogen. Ein Tag mit `gefunden + fehlend ≠ soll` legt laut Bauart **keine**
Stücke und gilt nicht als erledigt; er wäre beim nächsten `vollauf.sh start` wiederholt worden. Die 16 Nicht-Rand-Stücke sind
genau die fertigen Hälften der vollständigen Nachbartage dieser 15 offenen Tage, die 23 fehlenden UTC-Tage genau ihre
Berührungsmenge (jeder offene ET-Tag D berührt UTC D und D+1). Kein Reihenfolgeproblem, kein verlorenes Stück.

**Nacharbeit (23.09.2026, 20:32:56–20:45:04 UTC):** genau diese 15 ET-Tage, je Tag ein Aufruf
`/opt/node-v24.18.0/bin/node --max-old-space-size=2048 gkg-tage.js --von <D> --bis <D> --aus <Ablage>` im Vordergrund per SSH,
in drei Gruppen zu fünf parallelen Läufen (unter der Leitungsgrenze), Ausgabe in dieselben Ordner; Protokolle `nacharbeit/<D>.out`
und angehängt an `log-1.txt` (Einzeltag-Läufe sind Teil 1/1). Jeder Tag 105–184 s, alle 15 mit `fehler=0` und vollständiger
Datei-Menge; die Vereinigung geschah im Lauf selbst (`roh=…:vereint`). Ein Befund dabei: der Lauf für **2017-03-31** endete mit
`ABBRUCH ENOENT rename _fortschritt-1-1.json.tmp` — fünf parallele Einzeltag-Läufe teilen sich `_fortschritt-1-1.json`, zwei
benannten dieselbe `.tmp` um. Das Schreiben des Fortschritts liegt **nach** Stücken, Vereinigung und Tagesdatei; geprüft:
`tage/2017-03-31.json` von 20:45:04 mit 95 + 1 fehlend = 96, `fehler=[]`, `roh/2017-03-31.json` (95 Dateien, 243.916 Zeilen,
Stücke ET 03-30 16/16 + ET 03-31 80/79) und `roh/2017-04-01.json` (94 Dateien, Stücke ET 03-31 16/16 + ET 04-01 80/78) liegen
vor. Lehre: Einzeltag-Nacharbeit nacheinander oder je Lauf eigene Ablage des Fortschritts — nicht geändert (§6 des Auftrags).

**Bestätigung mit demselben Verfahren wie `vollauf.sh start`:** `gkg-tage.js --rohNachlauf` danach:
`ROH-NACHLAUF sperren=0 tmp=0 vereint=0 wartet=2 (2017-01-01 2026-09-01)` — nichts mehr zu vereinen, nur die zwei Randtage.
**Endstand:** 3.529 fertige UTC-Tage von 3.531 erwarteten, fehlend genau die zwei Randtage, jede `.tsv.gz` mit Beleg, Stückordner
= die zwei Randstücke (+ ihre Belege), keine Reste (`rohauszug`).

## 5. Vollständigkeitsprobe je UTC-Tag (§2.3)

Deterministische Stichprobe: jeder 88. UTC-Tag des Kalenders 2017-01-01 … 2026-09-01 (Positionen 88, 176, … 3.520 = **40 Tage**,
2017-03-29 … 2026-08-21, `stichprobe.positionen`). Je Tag `zcat roh/<U>.tsv.gz | awk` über Spalte 2 (V2.1DATE) und die Feldzahl,
dann zehn Gleichungen (`stichprobe.tage[].nichtBestanden`):

1. Zahl der verschiedenen Stempel = 96 − fehlend laut Beleg; 2. fehlende Stempel laut Beleg = `fehlendStempel` der zwei
berührten Tagesdateien (auf den UTC-Tag eingeschränkt); 3. Zeilen gesamt = `zeilen` des Belegs; 4./5. Zeilen bis `bis` des
ersten Stücks = `zeilen` Stück früh, Rest = Stück Rest; 6. ET-Tage der Stücke = U−1 und U; 7. jede Zeile hat genau 6 Felder;
8./9. `mitOrganisation` der Tagesdatei des ET-Tags U (und U−1) = Summe der zwei Stücke dieses ET-Tags über die Belege der
UTC-Tage U und U+1 (bzw. U−1 und U); 10. kein Stempel außerhalb des UTC-Tags.

**Ergebnis: 40 von 40 bestanden, 0 Abweichungen.** Über die Stichprobe: 4.448.628 Zeilen, 113 fehlende Quelldateien (alle
gegen `tage/` bestätigt), 1–4.361 Zeilen je Stempel. Beispiel Position 88, UTC 2017-03-29: 95 Stempel = 96 − 1, 267.488 Zeilen =
Beleg, Stück früh 39.100 (ET 03-28) + Rest 228.388 (ET 03-29), `mitOrganisation` ET 03-29 268.265 = 228.388 + 39.877 (Stück
früh aus `roh/2017-03-30.json`). Das Muster des PM vom 22.09. (Zeilen = Zähler) hält damit über 40 Tage und alle Jahre.
Dazu die Gesamtidentität aus §1: Zeilen aller Auszüge + Randstücke = Σ `mitOrganisation` über alle 3.530 Tagesdateien.

## 6. Übertrag nach E: (§3) — der PC zieht

- Ziel `E:/Markt-Dashboard-Archiv/studien-zellen/gdelt-2017-2026/` neu angelegt (23.09. 22:39 MESZ, vorher nicht vorhanden);
  frei auf E: vorher 1,5 TB, nachher 1,4 TB. Server-Listen: `sha256-server.sh` (GNU `sha256sum`, relative Pfade ab der Ablage,
  je Etappe eine Liste, `.tmp` → Umbenennen). Übertrag: `uebertrag-e.sh` — je Etappe ein tar-Strom über SSH (`ssh … tar -cf - <Muster>
  | /usr/bin/tar -xf -`, GNU tar 1.35, sha256sum 8.32, find/xargs 4.10 unter `/usr/bin`, namentlich geprüft), sofort danach
  `/usr/bin/sha256sum` am PC, Listen beidseits normalisiert (`sed 's/ \*/  /'`, `tr -d '\r'`, `sort -k2`) und per `diff` verglichen;
  Marke `pruefung/<etappe>.ok` nur bei 0 Zeilen Unterschied; eine abgebrochene Etappe räumt nur ihre eigenen Zielpfade und zieht neu.
- **14 Etappen, alle bytegleich beim ersten Versuch** (keine Wiederholung nötig):

| Etappe | Dateien | Strom s | sha256 PC s | Etappe | Dateien | Strom s | sha256 PC s |
|---|---|---|---|---|---|---|---|
| kontrolle | 16 | 1 | 0 | roh-2022 | 730 | 196 | 37 |
| roh-2026 | 486 | 59 | 16 | roh-2019 | 730 | 160 | 38 |
| roh-2017 | 728 | 452 | 743 | roh-2020 | 732 | 124 | 31 |
| roh-2018 | 730 | 426 | 716 | roh-2023 | 730 | 128 | 31 |
| roh-2021 | 730 | 197 | 28 | roh-2024 | 732 | 119 | 31 |
| roh-2025 | 730 | 95 | 26 | roh-rest | 5 | 2 | 1 |
| tage | 3.530 | 7 | 41 | lauf | 289 | 2 | 4 |

- Wandzeit 22:42–23:28 MESZ (46 min) für 54,3 GB; Leitung Knecht → PC **≈ 42 MB/s** je Strom, zwei parallele Ströme teilen sich
  dieselben ≈ 40 MB/s; die sha256-Phasen von 2017 und 2018 liefen gleichzeitig und bremsten sich auf E: gegenseitig (743/716 s statt
  ≈ 90 s) — deshalb der Rest sequenziell.
- **Endvergleich:** `sha256-server.txt` (10.609 Einträge: 7.063 roh, 3.530 tage, 16 kontrolle) gegen `sha256-pc.txt` (10.609):
  normalisiert **0 Zeilen `diff`** (`pruefung/diff-alle.txt` leer); unabhängige Gegenprobe `find tage roh kontrolle -type f` auf E:
  ergibt genau die 10.609 Pfade der Serverliste. `lauf/`: 289/289 bytegleich (`lauf/sha256-lauf-server.txt`, `pruefung/sha256-pc-lauf.txt`).
- Beide Listen liegen auf E: neben den Ordnern und als Kopie im Repo unter `datenbau/sha256/` (dazu die zwei `lauf`-Listen).

## 7. Ablageorte

- **Original: `E:/Markt-Dashboard-Archiv/studien-zellen/gdelt-2017-2026/`** — `tage/` (3.530), `roh/` (3.529 `.tsv.gz` + Belege,
  `_schema.json`, `_teile/` mit den zwei Randstücken), `kontrolle/` (Positivkontrolle Baustein 3), `lauf/` (Logs, Fortschritt,
  `tage-vor-umbau/`, `nacharbeit/`, Prüfbelege), `sha256-server.txt`, `sha256-pc.txt`, `pruefung/` (Etappenlisten, Marken).
- Kopie: Rechenknecht `/archiv/markt-dashboard/studien-zellen/gdelt-2017-2026/` (identischer Inhalt laut Hashlisten; zusätzlich
  `probe-roh/`, 67 MB Probe vom 22.09., nicht übertragen). Der Server schreibt nie nach E:.
- Repo: `datenbau/abschluss-pruefung.json` + `.log` (Prüfergebnis), `datenbau/sha256/` (beide Hashlisten und die `lauf`-Listen),
  Skripte `abschluss-pruefung.js`, `sha256-server.sh`, `uebertrag-e.sh`.

## 8. Bekannte Lücken und Grenzen

- **GDELT-Ausfall 15.06.–01.07.2025:** 16 Tage ohne jede Datei (2025-06-15 … 06-30), 2025-06-14 mit 40 und 2025-07-01 mit 89
  fehlenden Dateien. Quelle, nicht Bau. In der Messung (Nr. 45) sind das Tage ohne Signal.
- Weitere 404-Blöcke der Quelle: Okt/Nov 2020 (bis zu 88 von 96 Dateien je Tag), Aug 2021, Nov–Dez 2017/Jan–Apr 2018 (8–15 je
  Tag), 2023-03-22 (94), 2022-11-10/11. Insgesamt 7.127 von 338.876 Dateien (2,10 %); nachts (UTC) doppelt so häufig wie tags.
- Zwei Randtage (UTC 2017-01-01, 2026-09-01) liegen nur als Hälften vor (Stücke), weil ihre anderen Hälften zu ET-Tagen
  außerhalb des Zeitraums gehören.
- **Kurzformen unbrauchbar:** Die Namenskarte zählt nur Stufe „voll" (`ABDECKUNG.md` §f der Nr. 44: Kurzformen treffen fremde
  Organisationen); 62 der 661 Kartensymbole kommen in zehn Jahren nie vor.
- 2.822 GKG-Zeilen (von 547 Mio.) hatten nicht 27 Felder und wurden übersprungen; `ohneTon` 0.
- Der Auszug trägt je Zeile nur die Spalten 1, 2, 4, 5, 15, 16 (Kennung, Stempel, Quelle, Link, Organisationen mit Offsets, Ton);
  alles andere (Themen, Personen, Orte, GCAM) ist nicht gespeichert — dafür wäre ein neuer Lauf nötig (2,18 TB Download, ~10 h).
