# ERGEBNIS — Nachrichten-Stimmung aus GDELT, Tagesdesign (Studie Nr. 45, Auftrag Nr. 66)

Kennung `nachrichten-stimmung-tage-2026-09-19/v1`, Messung `nachrichten-stimmung-tage-2026-09-19/messung/v1`, Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (Stand 2026-09-18T12:56:18.397Z), Datenbau `nachrichten-stimmung-tage-2026-09-19/gdelt/v1 · nachrichten-stimmung-tage-2026-09-19/namenskarte/v2` (3530 Tagesdateien). Stand 2026-10-03T19:09:52.232Z.
Alle Zahlen dieser Datei stammen aus `protokoll.json` (von `messen.js` geschrieben); Pp je Halteperiode. Simulation mit virtuellem Kapital, keine Anlageberatung.

Läufe: Nr. 1 Start 2026-10-03T19:00:16.980Z (der eine registrierte Lauf auf den echten Tagesdateien) — fertig. Maschine: Commit `bbc3000`, Node v24.18.0.

## 1. Urteilstafel der 12 Tests (Klassen 2+3 gepoolt, Urteil wörtlich nach §6)

| Test | n | MDE₈₀ | MDE₈₀ (t ≥ 3) | Δ̄ brutto | Kosten | Δ̄ netto | se_HH | t_HH | Entdeckung netto | 4 × MDE₈₀ Best. | Tor 1 | Bestätigung netto | letzte 250 netto | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni | 2396 | 0,032 | 0,044 | -0,016 | 0,110 | -0,126 | 0,011 | -11,01 | -0,118 | 0,201 | gesperrt | nicht gerechnet | -0,192 | **nicht belegt: nichts oberhalb von 0,032 Pp je Periode** |
| G1 rangTon · H 1 · L-S | 2396 | 0,060 | 0,082 | 0,011 | 0,179 | -0,168 | 0,021 | -7,86 | -0,160 | 0,392 | gesperrt | nicht gerechnet | -0,262 | **nicht belegt: nichts oberhalb von 0,060 Pp je Periode** |
| G1 rangTon · H 3 · Long-Uni | 2396 | 0,066 | 0,090 | -0,036 | 0,116 | -0,152 | 0,023 | -6,46 | -0,146 | 0,396 | gesperrt | nicht gerechnet | -0,331 | **nicht belegt: nichts oberhalb von 0,066 Pp je Periode** |
| G1 rangTon · H 3 · L-S | 2396 | 0,136 | 0,187 | 0,001 | 0,191 | -0,190 | 0,049 | -3,90 | -0,236 | 0,891 | gesperrt | nicht gerechnet | -0,442 | **nicht belegt: nichts oberhalb von 0,136 Pp je Periode** |
| G1 rangTon · H 5 · Long-Uni | 2396 | 0,102 | 0,140 | -0,033 | 0,117 | -0,150 | 0,036 | -4,12 | -0,166 | 0,606 | gesperrt | nicht gerechnet | -0,387 | **nicht belegt: nichts oberhalb von 0,102 Pp je Periode** |
| G1 rangTon · H 5 · L-S | 2396 | 0,221 | 0,303 | -0,014 | 0,193 | -0,207 | 0,079 | -2,62 | -0,269 | 1,466 | gesperrt | nicht gerechnet | -0,479 | **nicht belegt: nichts oberhalb von 0,221 Pp je Periode** |
| G2 rangAend · H 1 · Long-Uni | 2386 | 0,037 | 0,050 | -0,002 | 0,125 | -0,127 | 0,013 | -9,70 | -0,116 | 0,235 | gesperrt | nicht gerechnet | -0,204 | **nicht belegt: nichts oberhalb von 0,037 Pp je Periode** |
| G2 rangAend · H 1 · L-S | 2386 | 0,056 | 0,077 | 0,010 | 0,207 | -0,196 | 0,020 | -9,77 | -0,163 | 0,360 | gesperrt | nicht gerechnet | -0,305 | **nicht belegt: nichts oberhalb von 0,056 Pp je Periode** |
| G2 rangAend · H 3 · Long-Uni | 2386 | 0,068 | 0,093 | -0,002 | 0,132 | -0,135 | 0,024 | -5,55 | -0,137 | 0,434 | gesperrt | nicht gerechnet | -0,272 | **nicht belegt: nichts oberhalb von 0,068 Pp je Periode** |
| G2 rangAend · H 3 · L-S | 2386 | 0,108 | 0,148 | 0,031 | 0,220 | -0,188 | 0,039 | -4,87 | -0,197 | 0,691 | gesperrt | nicht gerechnet | -0,400 | **nicht belegt: nichts oberhalb von 0,108 Pp je Periode** |
| G2 rangAend · H 5 · Long-Uni | 2386 | 0,085 | 0,117 | 0,003 | 0,134 | -0,131 | 0,030 | -4,30 | -0,147 | 0,526 | gesperrt | nicht gerechnet | -0,257 | **nicht belegt: nichts oberhalb von 0,085 Pp je Periode** |
| G2 rangAend · H 5 · L-S | 2386 | 0,145 | 0,199 | 0,045 | 0,222 | -0,177 | 0,052 | -3,42 | -0,176 | 0,915 | gesperrt | nicht gerechnet | -0,362 | **nicht belegt: nichts oberhalb von 0,145 Pp je Periode** |

MDE₈₀ = 2,8016 × se_HH und MDE₈₀ an der Schwelle = 3,8416 × se_HH stehen im Protokoll in Stufe A und wurden vor jedem Mittel gerechnet und geschrieben. Entdeckung = ungerade Jahre des Signaltags, Bestätigung = gerade Jahre.
Gefallene Kontrollen und Tore (Kennzeichnung aller zwölf Zeilen): **placebo1, abdeckungstor** — die Zahlen stehen trotzdem da; das Urteil `belegt` ist damit ausgeschlossen (§7).

| Test | se_HH brutto | t_HH brutto | Umschlag je Periode | Kosten (registrierte Formel) | Obergrenze laut §5 (ein Umlauf je Seite) | Bedingung 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni | 0,011 | -1,38 | 0,721 | 0,110 | 0,063 | nein | nein | nein | nein | nein |
| G1 rangTon · H 1 · L-S | 0,021 | 0,51 | 0,722 | 0,179 | 0,124 | nein | nein | nein | nein | nein |
| G1 rangTon · H 3 · Long-Uni | 0,023 | -1,52 | 0,749 | 0,116 | 0,063 | nein | nein | nein | nein | nein |
| G1 rangTon · H 3 · L-S | 0,049 | 0,03 | 0,768 | 0,191 | 0,124 | nein | nein | nein | nein | nein |
| G1 rangTon · H 5 · Long-Uni | 0,036 | -0,91 | 0,750 | 0,117 | 0,063 | nein | nein | nein | nein | nein |
| G1 rangTon · H 5 · L-S | 0,079 | -0,18 | 0,775 | 0,193 | 0,124 | nein | nein | nein | nein | nein |
| G2 rangAend · H 1 · Long-Uni | 0,013 | -0,13 | 0,845 | 0,125 | 0,062 | nein | nein | nein | nein | nein |
| G2 rangAend · H 1 · L-S | 0,020 | 0,52 | 0,831 | 0,207 | 0,124 | nein | nein | nein | nein | nein |
| G2 rangAend · H 3 · Long-Uni | 0,024 | -0,10 | 0,878 | 0,132 | 0,062 | nein | nein | nein | nein | nein |
| G2 rangAend · H 3 · L-S | 0,039 | 0,81 | 0,881 | 0,220 | 0,124 | nein | nein | nein | nein | nein |
| G2 rangAend · H 5 · Long-Uni | 0,030 | 0,09 | 0,886 | 0,134 | 0,062 | nein | nein | nein | nein | nein |
| G2 rangAend · H 5 · L-S | 0,052 | 0,87 | 0,891 | 0,222 | 0,124 | nein | nein | nein | nein | nein |

t_HH in der Urteilstafel ist das t der Netto-Reihe (das Urteil fällt netto); se_HH brutto und t_HH brutto stehen hier daneben. In 12 von 12 Tests liegt schon Δ̄ brutto unter MDE₈₀ (größtes Δ̄ brutto 0,045 Pp); mit halben Kosten (1 × umschlagKosten je Seite, die Obergrenze-Lesart von §5) wäre Δ̄ netto in 12 von 12 Tests negativ — beides aus den Protokollzahlen gerechnet, kein weiterer Lauf.

## 2. Kontrollen (§7) — Schranke und Befund

| Kontrolle | Schranke | Befund | bestanden |
|---|---|---|---|
| Placebo 1 (Zukunft, t + 21) | \|Mittel brutto\| < 0.02 Pp und \|t_HH\| < 3 | 12 Zellen: größtes \|Mittel\| 0,169 Pp, größtes \|t_HH\| 3,25; gefallen 6 von 12, davon allein über die Pp-Schranke (bei \|t_HH\| < 3) 5 | nein |
| Placebo 2 (Permutation, 12 Ziehungen) | \|Mittel über 12\| < 0.02 Pp; höchstens 3 mit \|t_HH\| >= 3 | 12 Zellen: größtes \|Mittel über 12\| 0,014 Pp, höchste Zahl mit \|t\| ≥ 3: 1; gefallen 0 von 12 | ja |
| Orakel | Δ brutto >= 2.5 / 4 / 5 Pp (H 1/3/5), t_HH >= 8 | H 1: 2,69 Pp, t 106,5; H 3: 4,78 Pp, t 62,2; H 5: 6,22 Pp, t 53,1 | ja |
| Nullpunkt (Zufallsdezil) | \|Mittel\| / se < 3 in jeder Zelle | 36 Zellen: größtes \|Mittel\|/se 1,64 | ja |
| Kursloses Signal | \|Mittel\| / se < 3 | 6 Zellen: größtes \|t_HH\| 1,76 | ja |
| Leck-Klinken | Sicht ohne Schlüssel: 0 Verstöße im Hauptlauf; tagesSignal: kein Wurf im Hauptlauf; Positivkontrolle beider Klinken > 0 | Sicht ohne Schlüssel: 0 Verstöße; Positivkontrolle am 2017-01-03: Tagesdatei t + 1 1 gezählt, Panel t + 1 1 gezählt, tagesSignal mit Stempel t + 1 wirft; deklarierte Placebo-Zugriffe mit Schlüssel: 2417 | ja |

### Kontrollen je Zelle

| Zelle | Placebo 1: Mittel brutto | se_HH | t_HH | Placebo 2: Mittel über 12 | Zahl \|t\| ≥ 3 |
|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni | 0,0091 | 0,0120 | 0,76 | 0,0022 | 0 |
| G1 rangTon · H 1 · L-S | 0,0607 ⚑ | 0,0210 | 2,89 | 0,0045 | 0 |
| G1 rangTon · H 3 · Long-Uni | 0,0197 | 0,0250 | 0,79 | -0,0009 | 0 |
| G1 rangTon · H 3 · L-S | 0,1050 ⚑ | 0,0490 | 2,14 | 0,0039 | 0 |
| G1 rangTon · H 5 · Long-Uni | 0,0030 | 0,0354 | 0,09 | -0,0027 | 0 |
| G1 rangTon · H 5 · L-S | 0,1695 ⚑ | 0,0717 | 2,36 | 0,0060 | 0 |
| G2 rangAend · H 1 · Long-Uni | -0,0162 | 0,0136 | -1,20 | 0,0031 | 0 |
| G2 rangAend · H 1 · L-S | 0,0290 ⚑ | 0,0197 | 1,48 | 0,0073 | 1 |
| G2 rangAend · H 3 · Long-Uni | -0,0502 ⚑ | 0,0259 | -1,94 | 0,0032 | 0 |
| G2 rangAend · H 3 · L-S | 0,0071 | 0,0382 | 0,18 | 0,0095 | 0 |
| G2 rangAend · H 5 · Long-Uni | -0,1116 ⚑ | 0,0343 | -3,25 | 0,0060 | 0 |
| G2 rangAend · H 5 · L-S | -0,0149 | 0,0478 | -0,31 | 0,0141 | 0 |

⚑ = Schranke der Zelle verfehlt.

## 3. Tore (§6)

- **Maschinentore:** Orakel ja, Placebo 1 nein, Placebo 2 ja, Leck-Klinken samt Positivkontrolle ja; weitere Kontrollen: Nullpunkt ja, kursloses Signal ja. **Mindestens ein Maschinentor ist gefallen: nach §6 gilt der Lauf damit als ungültig; die Zahlen stehen gekennzeichnet da (§7), das Urteil `belegt` ist ausgeschlossen.**
- **Vorprüfungstor:** bestanden — Paar-sd des Zufallsdezils im Lauf / Paar-sd der Vorprüfung innerhalb [1/1.5; 1.5], gepoolt, beide Fassungen.

| Fassung · Haltedauer · Portfolio | Paar-sd im Lauf | Paar-sd Vorprüfung | Verhältnis | innerhalb |
|---|---|---|---|---|
| voll · H 1 · Long-Uni | 0,458 | 0,470 | 0,97 | ja |
| voll · H 1 · L-S | 0,691 | 0,706 | 0,98 | ja |
| voll · H 3 · Long-Uni | 0,802 | 0,800 | 1,00 | ja |
| voll · H 3 · L-S | 1,224 | 1,208 | 1,01 | ja |
| voll · H 5 · Long-Uni | 1,044 | 1,034 | 1,01 | ja |
| voll · H 5 · L-S | 1,579 | 1,530 | 1,03 | ja |
| definiert · H 1 · Long-Uni | 0,595 | 0,470 | 1,26 | ja |
| definiert · H 1 · L-S | 0,904 | 0,706 | 1,28 | ja |
| definiert · H 3 · Long-Uni | 1,007 | 0,800 | 1,26 | ja |
| definiert · H 3 · L-S | 1,523 | 1,208 | 1,26 | ja |
| definiert · H 5 · Long-Uni | 1,284 | 1,034 | 1,24 | ja |
| definiert · H 5 · L-S | 1,959 | 1,530 | 1,28 | ja |

- **Abdeckungstor:** **gefallen** — nicht messbar: 2017 Klasse 2, 2019 Klasse 3, 2022 Klasse 2. Regel: >= 80 % der Klassenmitglieder mit >= 5 Artikeln je Monat, Median über die Monate des Jahres. Fundstelle der Rechnung: `studien/gdelt-abdeckung-2026-09-19/auswerten.js` (Abschnitte (a) und (f), Funktionen `quantil`/`median`) und `ABDECKUNG.md` §e/§f; Mitglieder = Universum am ersten Handelstag des Jahres, Artikel = n + nSpaet.

| Jahr | Klasse | Mitglieder | Monate | Anteil ≥ 5 Artikel (Median) | kleinster Monat | nur Artikel bis 16:00 ET (Median, nachrichtlich) | bestanden |
|---|---|---|---|---|---|---|---|
| 2017 | 2 | 116 | 12 | 79,7 % | 77,6 % | 79,3 % | nein |
| 2017 | 3 | 8 | 12 | 100,0 % | 87,5 % | 100,0 % | ja |
| 2018 | 2 | 98 | 12 | 86,7 % | 84,7 % | 84,7 % | ja |
| 2018 | 3 | 13 | 12 | 92,3 % | 92,3 % | 92,3 % | ja |
| 2019 | 2 | 138 | 12 | 84,4 % | 81,2 % | 83,0 % | ja |
| 2019 | 3 | 22 | 12 | 77,3 % | 72,7 % | 77,3 % | nein |
| 2020 | 2 | 111 | 12 | 80,2 % | 78,4 % | 79,3 % | ja |
| 2020 | 3 | 12 | 12 | 95,8 % | 91,7 % | 91,7 % | ja |
| 2021 | 2 | 168 | 12 | 80,4 % | 78,6 % | 78,6 % | ja |
| 2021 | 3 | 30 | 12 | 83,3 % | 80,0 % | 81,7 % | ja |
| 2022 | 2 | 196 | 12 | 76,8 % | 74,0 % | 74,7 % | nein |
| 2022 | 3 | 42 | 12 | 88,1 % | 85,7 % | 86,9 % | ja |
| 2023 | 2 | 190 | 12 | 82,9 % | 81,6 % | 81,8 % | ja |
| 2023 | 3 | 24 | 12 | 91,7 % | 87,5 % | 87,5 % | ja |
| 2024 | 2 | 179 | 12 | 83,0 % | 81,0 % | 81,3 % | ja |
| 2024 | 3 | 21 | 12 | 95,2 % | 90,5 % | 90,5 % | ja |
| 2025 | 2 | 204 | 12 | 80,9 % | 73,0 % | 78,2 % | ja |
| 2025 | 3 | 38 | 12 | 90,8 % | 81,6 % | 89,5 % | ja |
| 2026 | 2 | 296 | 8 | 80,1 % | 75,7 % | 77,4 % | ja |
| 2026 | 3 | 65 | 8 | 89,2 % | 87,7 % | 87,7 % | ja |

## 4. Zähler

- Signaltage (Handelstage im Fenster 2017-01-01 … 2026-08-31): **2428**; Tagesdateien gesamt 3530, davon an Panel-Handelstagen 2428; Handelstage ohne Datei 0; Handelstage undefiniert **32** (dateien<48: 21, block-ausfall: 11).
- Tageszeilen an Handelstagen 782867 mit 22079041 Artikeln bis 16:00 ET; Zeilen mit Stempel außerhalb des Signals 0; Ton-Abweichung Ablage gegen `tagesSignal` 0.
- Tage unter 20 definierten Symbolen (fallen für die Größe weg; die undefinierten Handelstage sind darin enthalten): G1|3: 1302, G2|23: 42, G2|2: 42, G2|3: 1302, G1|23: 32, G1|2: 32. Signaltage ohne Periodenende: H 21: 11.
- Renditen Schluss → Schluss: Tote 761 (davon Totalverlust 0), Lücken 1333 (gezählt über das 21-Tage-Fenster je Mitglied und Signaltag).

| Größe · Gruppe | Tage | definierte Symbole je Tag: Mittel | Minimum | P5 | Median | Maximum |
|---|---|---|---|---|---|---|
| G1 · Gruppe 23 | 2428 | 105,4 | 0 | 77,0 | 106,0 | 182 |
| G1 · Gruppe 2 | 2428 | 84,3 | 0 | 66,0 | 84,0 | 139 |
| G1 · Gruppe 3 | 2428 | 21,1 | 0 | 6,0 | 18,0 | 58 |
| G2 · Gruppe 23 | 2428 | 104,9 | 0 | 76,0 | 106,0 | 182 |
| G2 · Gruppe 2 | 2428 | 83,8 | 0 | 66,0 | 84,0 | 139 |
| G2 · Gruppe 3 | 2428 | 21,1 | 0 | 6,0 | 18,0 | 58 |

| Jahr | Signaltage | Mitglieder je Tag | definiert je Tag | Anteil definiert | Anteil mit Artikel | Ton-Niveau | Artikel bis 16:00 je Mitglied-Tag | Anteil spät |
|---|---|---|---|---|---|---|---|---|
| 2017 | 251 | 113,5 | 81,6 | 71,9 % | 79,4 % | 0,14 | 72,93 | 32,3 % |
| 2018 | 251 | 134,5 | 91,2 | 67,8 % | 78,0 % | 0,22 | 61,73 | 31,6 % |
| 2019 | 252 | 132,8 | 86,2 | 64,9 % | 77,6 % | 0,34 | 51,68 | 31,2 % |
| 2020 | 253 | 182,8 | 92,9 | 50,8 % | 69,9 % | 0,06 | 33,96 | 31,0 % |
| 2021 | 252 | 233,6 | 107,4 | 46,0 % | 63,8 % | 0,44 | 29,73 | 32,7 % |
| 2022 | 251 | 251,2 | 113,5 | 45,2 % | 65,9 % | 0,33 | 17,63 | 30,2 % |
| 2023 | 250 | 194,9 | 107,9 | 55,4 % | 72,6 % | 0,66 | 31,25 | 29,1 % |
| 2024 | 252 | 219,3 | 116,9 | 53,3 % | 71,9 % | 0,92 | 29,26 | 29,4 % |
| 2025 | 250 | 310,2 | 129,6 | 41,8 % | 64,6 % | 0,85 | 18,83 | 27,0 % |
| 2026 | 166 | 401,6 | 137,9 | 34,3 % | 61,1 % | 0,68 | 13,32 | 29,2 % |

## 5. Nachrichtliche Zeilen (tragen kein Urteil)

### Jahresscheiben (Δ̄ netto je Kalenderjahr des Signaltags; in Klammern MDE₈₀)

| Test | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni | -0,130 (0,075) | -0,057 (0,077) | -0,096 (0,078) | -0,125 (0,137) | -0,091 (0,100) | -0,183 (0,102) | -0,144 (0,082) | -0,109 (0,088) | -0,130 (0,115) | -0,229 (0,167) |
| G1 rangTon · H 1 · L-S | -0,129 (0,132) | -0,149 (0,134) | -0,106 (0,122) | 0,018 (0,319) | -0,155 (0,187) | -0,363 (0,216) | -0,193 (0,146) | -0,112 (0,154) | -0,217 (0,203) | -0,320 (0,230) |
| G1 rangTon · H 3 · Long-Uni | -0,116 (0,154) | -0,016 (0,177) | -0,066 (0,181) | -0,107 (0,231) | -0,231 (0,229) | -0,215 (0,184) | -0,158 (0,151) | -0,120 (0,160) | -0,161 (0,244) | -0,416 (0,365) |
| G1 rangTon · H 3 · L-S | -0,107 (0,314) | -0,057 (0,251) | -0,176 (0,298) | 0,207 (0,767) | -0,409 (0,456) | -0,399 (0,461) | -0,204 (0,330) | -0,021 (0,347) | -0,285 (0,375) | -0,547 (0,457) |
| G1 rangTon · H 5 · Long-Uni | -0,087 (0,251) | 0,029 (0,292) | -0,120 (0,295) | -0,010 (0,339) | -0,303 (0,394) | -0,221 (0,277) | -0,145 (0,184) | -0,064 (0,270) | -0,177 (0,356) | -0,516 (0,500) |
| G1 rangTon · H 5 · L-S | -0,038 (0,548) | -0,017 (0,357) | -0,238 (0,473) | 0,305 (1,275) | -0,629 (0,731) | -0,522 (0,729) | -0,183 (0,511) | 0,039 (0,581) | -0,254 (0,515) | -0,650 (0,789) |
| G2 rangAend · H 1 · Long-Uni | -0,110 (0,085) | -0,096 (0,087) | -0,119 (0,082) | -0,041 (0,185) | -0,100 (0,114) | -0,185 (0,123) | -0,099 (0,098) | -0,157 (0,103) | -0,155 (0,119) | -0,245 (0,145) |
| G2 rangAend · H 1 · L-S | -0,096 (0,125) | -0,204 (0,137) | -0,162 (0,131) | -0,104 (0,255) | -0,139 (0,182) | -0,320 (0,214) | -0,198 (0,145) | -0,201 (0,171) | -0,223 (0,180) | -0,367 (0,213) |
| G2 rangAend · H 3 · Long-Uni | -0,096 (0,148) | -0,087 (0,167) | -0,101 (0,144) | 0,043 (0,328) | -0,199 (0,232) | -0,137 (0,216) | -0,141 (0,160) | -0,180 (0,166) | -0,146 (0,225) | -0,368 (0,311) |
| G2 rangAend · H 3 · L-S | -0,055 (0,250) | -0,113 (0,244) | -0,208 (0,241) | 0,146 (0,525) | -0,215 (0,340) | -0,360 (0,390) | -0,237 (0,288) | -0,163 (0,277) | -0,265 (0,344) | -0,490 (0,403) |
| G2 rangAend · H 5 · Long-Uni | -0,046 (0,223) | -0,101 (0,243) | -0,167 (0,158) | 0,104 (0,273) | -0,256 (0,287) | -0,140 (0,273) | -0,091 (0,252) | -0,107 (0,208) | -0,172 (0,277) | -0,408 (0,471) |
| G2 rangAend · H 5 · L-S | -0,004 (0,345) | -0,129 (0,292) | -0,261 (0,294) | 0,171 (0,543) | -0,290 (0,437) | -0,500 (0,548) | -0,147 (0,419) | 0,009 (0,426) | -0,169 (0,498) | -0,543 (0,660) |

### Klassen getrennt

| Zelle | n | MDE₈₀ | Δ̄ brutto | Kosten | Δ̄ netto | t_HH |
|---|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni · Klasse 2 | 2396 | 0,035 | -0,014 | 0,118 | -0,132 | -10,64 |
| G1 rangTon · H 1 · L-S · Klasse 2 | 2396 | 0,063 | 0,022 | 0,189 | -0,167 | -7,40 |
| G1 rangTon · H 3 · Long-Uni · Klasse 2 | 2396 | 0,072 | -0,028 | 0,125 | -0,153 | -5,91 |
| G1 rangTon · H 3 · L-S · Klasse 2 | 2396 | 0,148 | 0,020 | 0,201 | -0,181 | -3,43 |
| G1 rangTon · H 5 · Long-Uni · Klasse 2 | 2396 | 0,112 | -0,032 | 0,126 | -0,158 | -3,94 |
| G1 rangTon · H 5 · L-S · Klasse 2 | 2396 | 0,231 | 0,004 | 0,203 | -0,199 | -2,41 |
| G2 rangAend · H 1 · Long-Uni · Klasse 2 | 2386 | 0,040 | 0,005 | 0,135 | -0,130 | -9,13 |
| G2 rangAend · H 1 · L-S · Klasse 2 | 2386 | 0,061 | 0,028 | 0,217 | -0,189 | -8,68 |
| G2 rangAend · H 3 · Long-Uni · Klasse 2 | 2386 | 0,072 | 0,018 | 0,142 | -0,124 | -4,83 |
| G2 rangAend · H 3 · L-S · Klasse 2 | 2386 | 0,113 | 0,060 | 0,230 | -0,170 | -4,20 |
| G2 rangAend · H 5 · Long-Uni · Klasse 2 | 2386 | 0,090 | 0,018 | 0,144 | -0,126 | -3,91 |
| G2 rangAend · H 5 · L-S · Klasse 2 | 2386 | 0,147 | 0,064 | 0,232 | -0,168 | -3,20 |
| G1 rangTon · H 1 · Long-Uni · Klasse 3 | 1126 | 0,102 | -0,062 | 0,076 | -0,138 | -3,80 |
| G1 rangTon · H 1 · L-S · Klasse 3 | 1126 | 0,182 | -0,126 | 0,125 | -0,251 | -3,86 |
| G1 rangTon · H 3 · Long-Uni · Klasse 3 | 1126 | 0,218 | -0,170 | 0,080 | -0,249 | -3,20 |
| G1 rangTon · H 3 · L-S · Klasse 3 | 1126 | 0,369 | -0,328 | 0,131 | -0,459 | -3,49 |
| G1 rangTon · H 5 · Long-Uni · Klasse 3 | 1126 | 0,307 | -0,209 | 0,081 | -0,290 | -2,65 |
| G1 rangTon · H 5 · L-S · Klasse 3 | 1126 | 0,551 | -0,407 | 0,134 | -0,540 | -2,75 |
| G2 rangAend · H 1 · Long-Uni · Klasse 3 | 1126 | 0,113 | -0,085 | 0,084 | -0,168 | -4,17 |
| G2 rangAend · H 1 · L-S · Klasse 3 | 1126 | 0,188 | -0,176 | 0,142 | -0,318 | -4,74 |
| G2 rangAend · H 3 · Long-Uni · Klasse 3 | 1126 | 0,217 | -0,135 | 0,088 | -0,223 | -2,87 |
| G2 rangAend · H 3 · L-S · Klasse 3 | 1126 | 0,344 | -0,339 | 0,149 | -0,488 | -3,98 |
| G2 rangAend · H 5 · Long-Uni · Klasse 3 | 1126 | 0,305 | -0,135 | 0,090 | -0,225 | -2,07 |
| G2 rangAend · H 5 · L-S · Klasse 3 | 1126 | 0,488 | -0,449 | 0,152 | -0,601 | -3,45 |

### Haltedauer 21 Handelstage (Brücke zur Machbarkeit)

| Zelle | n | MDE₈₀ | Δ̄ brutto | Kosten | Δ̄ netto | t_HH |
|---|---|---|---|---|---|---|
| G1 rangTon · H 21 · Long-Uni | 2385 | 0,338 | -0,116 | 0,125 | -0,241 | -2,00 |
| G1 rangTon · H 21 · L-S | 2385 | 0,651 | -0,044 | 0,200 | -0,244 | -1,05 |
| G2 rangAend · H 21 · Long-Uni | 2375 | 0,261 | -0,160 | 0,142 | -0,302 | -3,24 |
| G2 rangAend · H 21 · L-S | 2375 | 0,318 | -0,028 | 0,228 | -0,256 | -2,26 |

### Einstieg zur Eröffnung t + 1 (Haltekonvention der Maschine, `halte`: Eröffnung → Eröffnung)

| Zelle | n | Δ̄ brutto | Differenz zur Hauptzeile (brutto) | Δ̄ netto | t_HH |
|---|---|---|---|---|---|
| G1 rangTon · H 1 · Long-Uni | 2396 | -0,002 | 0,014 | -0,112 | -9,46 |
| G1 rangTon · H 1 · L-S | 2396 | 0,026 | 0,015 | -0,153 | -6,88 |
| G1 rangTon · H 3 · Long-Uni | 2396 | -0,028 | 0,008 | -0,144 | -5,95 |
| G1 rangTon · H 3 · L-S | 2396 | 0,000 | -0,001 | -0,191 | -3,83 |
| G1 rangTon · H 5 · Long-Uni | 2396 | -0,030 | 0,002 | -0,147 | -4,04 |
| G1 rangTon · H 5 · L-S | 2396 | -0,029 | -0,015 | -0,222 | -2,86 |
| G2 rangAend · H 1 · Long-Uni | 2386 | 0,005 | 0,007 | -0,120 | -9,00 |
| G2 rangAend · H 1 · L-S | 2386 | 0,028 | 0,018 | -0,179 | -8,69 |
| G2 rangAend · H 3 · Long-Uni | 2386 | 0,001 | 0,003 | -0,131 | -5,79 |
| G2 rangAend · H 3 · L-S | 2386 | 0,038 | 0,007 | -0,181 | -4,84 |
| G2 rangAend · H 5 · Long-Uni | 2386 | -0,005 | -0,008 | -0,139 | -4,72 |
| G2 rangAend · H 5 · L-S | 2386 | 0,038 | -0,007 | -0,184 | -3,56 |

## 6. Lesarten (vor dem Lauf festgelegt, im Protokoll Feld `lesarten`)

1. Tagesdatei -> Signal: je Symbol n Artikel mit Stempel = letzterStempel und Ton = ton der Tageszeile an tagesSignal (Leck-Klinke und 3-Artikel-Schwelle wirken dort); der Ton des Signals ist der von tagesSignal zurückgegebene.
2. Universum = universum(T, t, {klassen: [2, 3]}) ohne die 25 Kürzel der Medienliste (§2: sie fallen aus dem Universum); gelesen aus datenbau/namenskarte-v2.json.
3. G2: die 20 letzten definierten Tages-Töne des Symbols sind Handelstage < t mit definiertem Ton, unabhängig von der Universumszugehörigkeit an jenen Tagen; Nicht-Handelstage gehen in kein Signal ein.
4. Dezil = max(2, ceil(m/10)) nach dem Text von §4 (vorpruefung.js rundete kaufmännisch).
5. Kosten = registrierte Formel 2 × umschlagKosten(T, w_{t-H}, w_t, t) je Portfolio-Seite (Long-Uni: Dezil + Universum; L-S: oben + unten); fehlt die Tranche t-H, gilt der Aufbau aus dem Leeren. Die Formel liegt bei Umschlag über 50 % über der im selben Absatz genannten Obergrenze (ein Umlauf je Seite); die Obergrenze steht je Test als `obergrenze` daneben, geurteilt wird mit der registrierten Formel.
6. Urteil: Bedingungen 1 und 2 von §6 auf der ganzen Zelle UND (Urteil aus der Bestätigung) auf der Bestätigungshälfte; Entdeckung = Mittel netto der ungeraden Jahre (Jahr des Signaltags).
7. Placebo 1: die Größe des Tages t + 21 Handelstage, dem Tag t zugeordnet, gelesen über Sicht mit Orakelschlüssel. Placebo 2: die Werte der Größe je Tag unter den definierten Symbolen permutiert, je Ziehung k ein Strom mulberry32(fnv(Saat#k)) in fester Reihenfolge (Tage aufsteigend, G1 vor G2).
8. Orakel: Größe = Vorzeichen der künftigen H-Tage-Rendite (Sicht mit Schlüssel) auf dem definierten Universum von G1, durch dieselbe Rang- und Dezil-Strecke; Δ = oberstes minus unterstes Dezil.
9. Nullpunkt: Zufallsdezil gegen Universum und oben gegen unten, 5 Ziehungen, Saat der Vorprüfung, in zwei Fassungen: `voll` (ganzes Universum) und `definiert` (Symbole mit definiertem Ton); Schranke |Mittel|/se < 3 in jeder Zelle. Kursloses Signal: Zufallsgröße auf dem ganzen Universum durch die Rang-Strecke.
10. Vorprüfungstor: Paar-sd des Zufallsdezils (gepoolt, 3 Haltedauern × 2 Portfolios) im Verhältnis zu vorpruefung.json innerhalb [1/1,5; 1,5] — in BEIDEN Fassungen; Klassen getrennt nachrichtlich.
11. Abdeckungstor: Rechnung wie Nr. 44 (studien/gdelt-abdeckung-2026-09-19/auswerten.js, Abschnitte (a) und (f); ABDECKUNG.md §e/§f): je Monat der Anteil der Klassenmitglieder mit >= 5 Artikeln (n + nSpaet, alle Kalendertage des Monats), je Jahr der Median über die Monate (lineares Quantil, eine Nachkommastelle), bestanden ab 80 %. Mitglieder = Universum am ersten Handelstag des Jahres (Stichtagsregel von Nr. 44), ohne Medienliste.

## 7. Was die Tafel nicht weiß

Wie §11 der Vorregistrierung (Dividenden fehlen, Nebenerwähnungen, Sammelmeldungen, Crawl-Zeit ≥ Veröffentlichung). Dazu: das Mittel einer gesperrten Bestätigung ist nicht gerechnet, ließe sich aber aus dem Gesamtmittel, dem Entdeckungsmittel und den Jahresscheiben ableiten — die registrierte Tafel weist beides aus.

---

*Geschrieben von `messen.js` aus `protokoll.json`. Simulation mit virtuellem Kapital, keine Anlageberatung. Quelle der Stimmungsdaten: GDELT Project, https://www.gdeltproject.org/.*
