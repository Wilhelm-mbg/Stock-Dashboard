# Oberflächen-Texte an den Belegstand angeglichen (04.10.2026, Zweig `fix/oberflaeche-texte`, Basis main `61dca2c`)

## Kurzfassung
- Alle **121 Stellen** der Inventur (53 veraltet, 68 ohne Beleg) sind bearbeitet: **90 berichtigt**, **31 gestrichen** (Zahl steht nirgends im Belegkorpus).
- Inventur-Test: **294 Einträge, 0 Abweichungen** (a 231 · b 32 · gestrichen 31; 15 Zusatzeinträge, wo ein Satz Zahlen aus zwei Belegzeilen trägt).
- Der Test ist nur um die Klasse „gestrichen“ erweitert: Der alte Wortlaut darf nicht mehr stehen, und jeder Eintrag braucht eine Begründung.
- „Kante“ steht nur noch, wo es um null belegte Kanten geht; sonst heißt es „Regel“.
- Urteile wie im Belegstand: RSI(2) im Seitwärtskanal nicht entscheidbar (+0,021 Pp je Signal); News-Sentiment und Stunden-Strategie widerlegt; Ergebnis-Drift, Momentum und Winkel-Detektor nicht entscheidbar; Kapitulation zurückgewiesen.
- Keine Rechenlogik geändert: Konstanten wie `ALP_ANNAHME_PCT = 0.06` bleiben, nur der Text nennt sie als alte Annahme.
- **test-v6:** Rot sind genau die 7, die auf main in diesem Container auch rot sind (kein Datenordner, root). 11 Textmarken stehen auf dem neuen Wortlaut, jede begründet (Tabelle unten).
- **eslint:** 0 Fehler (1 Warnung wie auf main). **test-channel:** grün.
- **live-gegen-messung Test 11** nennt weiter 9 Zahlen: „Rückschlag 52 %“, „8/14 von 22 Jahren“, „+5,4 Pp“, „+20,3 % p. a.“, „−0,1 % gegen +7,4 %“, „93 von 96“. Alle stehen unter einem Überholt-Kopf (Klasse b); Test 11 kennt den Kopf nicht.
- **Offen** (nicht in der Inventur, nicht angefasst): depot.js:6861/6893 zur Laufzeit („angenommen 0,06/0,10 % … die Annahme der Studien trägt“); drift.js `stand` „Neumessung offen“; berichte.js Überschrift „## Empfehlungen“; Code-Kommentare mit alten Zahlen; Journal-Einträge alter Migrationen.
- Keine Anlageberatung. Simulation mit virtuellem Kapital.

## test-v6: umgestellte Textmarken
| Prüfung | alte Marke | neue Marke | Grund |
|---|---|---|---|
| Regelkopf RSI(2) | `+0,065 Pp Überschuss` | `Überschuss +0,021 Pp je Signal`, +0,065 und +0,114 ausgeschlossen | +0,065 steht nicht im Belegstand |
| Winkel-Detektor (2×) | `0,074 Pp, t = 1,22` | `alle 10 Punktschätzer negativ …` | Zahl unbelegt, das t gehört zu einer anderen Zelle |
| Explorer-Erklärtexte | `Roh ein Münzwurf` | `Roh ohne belegten Vorsprung` | +0,017 unbelegt |
| Bücher-Karte | `t = 1,62`, `8,44 statt 14,07` | `t = 0,74 nach Korrektur`, `16 von 200 Zufallsbüchern` | alte Zahlen stammen von vor der Korrektur bzw. sind unbelegt |
| F9 Umzug | `−0,028 / +0,166 / +0,230 %` | `sobald man nur die Abtastdichte ändert` | Zahlen gestrichen (unbelegt), der Satz bleibt |
| F10 | `Gemessene Intraday-Kanten` | `Gemessene Intraday-Regeln` | null belegte Kanten |
| Trendfinder-Titel | `Detektor widerlegt` | `Detektor nicht entscheidbar (Long-Seite in der Größe ausgeschlossen)` | Belegstand: „Nicht entscheidbar“ |
| Live=Messung, 100.4 | `ihre eigene Messung steht aus (Neumessung offen)` | `nach der Zeitzonen-Korrektur nicht entscheidbar` | Belegstand: t 1,7–2,0 |
| 97.9 | `nach Steuern für den breiten Markt nicht gerechnet` | `… nach Steuern, ohne Regel K: −2,20 Pp pro Jahr hinter dem Indexfonds` | in Nr. 82 gerechnet |

## Alle Stellen: alt → neu
Kl. = alte Klasse → neue (a = Zahl steht in der Belegzeile, b = als überholt gekennzeichnet). Die Prüfung je Stelle steht in `pruefberichte/oberflaeche-inventur/*.json`: Feld `alt` = alter Stand, `wortlaut`/`beleg` = neuer Stand.

### g1-index (36 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| index.html:1614 | d | „im Schnitt 0,74 Pp schlechter … (20 Handelstage“ | „lief der Kurs schlechter als seine übliche Drift (t = −11,6 aus einem Gedächtnisprotokoll; Größe und Zahl der Signale stehen in keinem Protokoll …)“ | belegstand.md, Widerlegt: Stunden-Strategie t = −11,6 |
| index.html:1616 | d | „24.727 Signalen“ | gestrichen | – (nicht im Korpus) |
| index.html:1625 | d | „Messung vom 21.08.2026 (24.727 Signale, 189 Werte, 8 Jahre)“ | „Messung vom 21.08.2026 (Gedächtnisprotokoll, Umfang nicht im Belegstand)“ | belegstand.md, Widerlegt: Stunden-Strategie (Fundstelle Gedächtnisprotokoll) |
| index.html:1626 | d | „−0,74 Pp schlechter … (20 Handelstage“ | „lief der Kurs schlechter als die übliche Drift (t=−11,6)“ + Hinweis, dass Größe/Aufteilung in keinem Protokoll steht | belegstand.md, Widerlegt: Stunden-Strategie |
| index.html:1627 | d | „nur 32 von 189 Werten positiv“ | gestrichen | – |
| index.html:1628 | d | „Mit Elliott-Beimischung −1,0 Pp.“ | gestrichen | – |
| index.html:1628 | c | „Das News-Sentiment war nie messbar.“ | „seit dem 01.09.2026 gemessen und widerlegt (siehe unten)“ | belegstand.md, Widerlegt: News-Sentiment (Übernacht, Großwerte), 01.09.2026 |
| index.html:1633 | c | „35 Beobachtungen an 10 Zeitpunkten, nötig … 2.600“ | „Messung vom 01.09.2026 hat es widerlegt: über Nacht auf Großwerten b = +0,0070 Pp je Score-Punkt, t = 0,31. Auf Tagesbasis (Nachrichten-Stimmung, 03.10.2026) nicht belegt.“ | belegstand.md, Widerlegt: News-Sentiment; Abschnitt „Nachrichten-Stimmung, Tagesdesign (03.10.2026)“ |
| index.html:1634 | c | „Unbelegt ist nicht widerlegt“ | gestrichen aus dem Satz; bleibt „Score, Ereignistypen … werden weiter berechnet und angezeigt“ | belegstand.md, Widerlegt: News-Sentiment |
| index.html:1671 | d | „Stellt alles auf die gemessenen Ergebnisse um“ | „Stellt alles auf die Voreinstellungen der Messungen um – belegt ist davon keine (Belegstand)“ | belegstand.md, Kopf „Belegte handelbare Kanten: NULL.“ |
| index.html:1689 | d | „im Trend ein Münzwurf und im Seitwärtsband messbar“ | gestrichen (Satz beschreibt nur die Regel) | – |
| index.html:1689 | c | „162 Werte: +0,147 Pp auf 8 Handelsstunden …“ | „Gemessen (Protokoll vom 26.08.2026): Überschuss +0,021 Pp je Signal, Tagesmittel +0,054 – nicht entscheidbar“ | belegstand.md, Nicht entscheidbar: rsi2seit |
| index.html:1691 | d | „Zeithälften positiv“ | gestrichen | – |
| index.html:1700 | c | „Vorsprung liegt über der Aktien-Kostenhürde“ | „Vorsprung (+0,021 Pp je Signal, nicht entscheidbar) liegt unter der gemessenen Aktien-Kostenhürde jeder Umsatzklasse“ | belegstand.md, Nicht entscheidbar: rsi2seit |
| index.html:1701 | d | „(0,10 %) … Optionsschein-Hürde (0,21 %)“ | „(0,0449 bis 0,1569 Pp je Umlauf, wiki/kosten.md) und erst recht unter der Hürde eines Hebelscheins“ | kosten.md, Zeile Kassa-Aktie „GEMESSEN 03.09.2026“ |
| index.html:1702 | d | „mit Schein … im Backtest bei −96 %“ | gestrichen | – |
| index.html:1703 | d | „streng bis Handelsschluss … −0,08 % je Trade …“ | gestrichen (ganzer Satz) | – |
| index.html:1702 | c | „+0,23 %. Deshalb steigen beide Kanten über die“ | „Beide Einstiege steigen über die Zeit aus“ | belegstand.md, „Belegte handelbare Kanten: NULL.“ |
| index.html:1747 | c | „volatile Drittel … besser ab (+0,235 statt +0,147)“ | gestrichen; neu „eine Messung je Pool führt der Belegstand nicht“ | – |
| index.html:1747 | d | „Die Vorgabe sind die 99 Werte, auf denen gemessen wurde“ | gestrichen; neu „Die Vorgabe ist der Standard-Pool.“ | – |
| index.html:1748 | d | „Standard (99 gemessene Werte)“ | gestrichen; Option heißt „Standard“ | – |
| index.html:1749 | c | „gemessen +0,235 statt +0,147 Pp“ | gestrichen; „Volatiles Drittel (33 Werte)“ | – |
| index.html:1788 | c | „Die Intraday-Kante … rund −0,04 Pp (Messmaschine 23.08.2026)“ | „RSI(2) im Seitwärtskanal liefert je Signal rund +0,021 Pp Überschuss (Protokoll vom 26.08.2026, nicht entscheidbar)“ | belegstand.md, Nicht entscheidbar: rsi2seit |
| index.html:1791 | d | „mit Schein … im Backtest bei −96 %“ | gestrichen | – |
| index.html:2142 | d | „wendet doppelt bestätigte, robuste Ergebnisse morgens an“ | „übernimmt morgens nur Einstellungen, die zweimal hintereinander die eigenen Prüfregeln bestehen – ein Beleg ist das nicht …“ | belegstand.md, „Belegte handelbare Kanten: NULL.“ |
| index.html:2246 | d | „Zehn Prozent schnitten durchweg besser ab als zwanzig.“ | „Die stärksten 10 % sind der Anteil der gemessenen Konfiguration (Studie 02.09.2026).“ | belegstand.md, Momentum-Buch („stärkste 10 %“) |
| index.html:2295 | c | „ihre eigene Messung steht aus (Neumessung offen)“ | „nach der Zeitzonen-Korrektur nicht entscheidbar (Stand im Kasten unten)“ | belegstand.md, Nicht entscheidbar: Ergebnis-Drift-Buch |
| index.html:2297 | c | „Auf 20 Tagen … seit 2015 tot (t = 0,77) – erst ab 60 Tagen trägt er“ | „Messung vom 04.10.2026 (andere Buchregel): auf 60 Handelstagen nicht entscheidbar (Kaufseite nach Kosten +1,39 Pp, t 1,97); 20 Handelstage entscheiden nichts.“ | belegstand.md, Ergebnis-Drift tagesgenau (04.10.2026), Stufe 1 und Zeile 20 Handelstage |
| index.html:2303 | d | „60 Tage (geprüft)“ | gestrichen → „60 Tage“ | – |
| index.html:2310 | d | „20 % (geprüft)“ | gestrichen → „20 %“ | – |
| index.html:2317 | d | „120 Tage (geprüft)“ | gestrichen → „120 Tage“ | – |
| index.html:2321 | d | „Bei 10 Basispunkten sinkt … um rund 1,8 Pp im Jahr.“ | gestrichen | – |
| index.html:2347 | c→b | „+10,44 % p. a. bei t = 3,04“ | bleibt wörtlich unter „Überholt (vor der Zeitzonen-Korrektur)“; dahinter „Heute: t 1,7–2,0, nicht entscheidbar; als Buch (04.10.2026, andere Regel) +0,38 Pp p. a. gegen den S&P 500 – im Bereich des Zufalls, kein Vorwärtstest.“ | belegstand.md, Ergebnis-Drift-Buch t 1,7–2,0; Ergebnis-Drift tagesgenau (04.10.2026) |
| index.html:2350 | c | „schwache Hälfte der Werte: +1,72 % bei t = 0,58“ | gestrichen | – (überholte Messung) |
| index.html:2654 | c | „Trendfinder — Detektor widerlegt“ | „Trendfinder — Detektor nicht entscheidbar (Long-Seite in der Größe ausgeschlossen)“ | belegstand.md, Nicht entscheidbar: Trendwende-/Winkel-Detektor |
| index.html:2672 | d | „In der Studie war 1,0 die beste 1-Minuten-Zelle.“ | „Gemessen in der Maschine (zwei Varianten, je 5 Schwellen): alle 10 Punktschätzer negativ – auch die Studien-Zelle 1,0 hat keinen Vorsprung.“ | belegstand.md, Nicht entscheidbar: Trendwende-/Winkel-Detektor (02.09.) |

### g2-appshell-notizen (22 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| app-shell.js:820 | c | Jede Kante wurde in genau einem Regime gemessen … | Jede Regel wurde in genau einem Regime gemessen …; belegt ist keine davon (Belegstand 04.10.2026). | belegstand.md Kopf „Belegte handelbare Kanten: NULL“; Vermerk 04.10. zu R-TREND |
| app-shell.js:868 | c | die Aktienhürde (0,06 Prozentpunkte je Umlauf) | … (geprüft wird gegen die alte Annahme 0,06 Pp – überholt 03.09.2026: gemessen je Umsatzklasse 0,0449 bis 0,1569 Pp) | belegstand.md Größen-Ausschlüsse, Zeile „~~0,06 Pp~~ … überholt 03.09.“; kosten.md Kassa-Hürde |
| app-shell.js:1054 | c | Gemessene Intraday-Kanten: … | Gemessene Intraday-Regeln (belegt ist keine: RSI(2) im Seitwärtskanal nicht entscheidbar, Kapitulations-Dip in der behaupteten Größe zurückgewiesen): … | belegstand.md „Nicht entscheidbar“, Zeilen `rsi2seit` und `kapitulation` (Überholt 03.10.2026) |
| app-shell.js:1095 | c | Momentum t = 1,62 | Momentum: t = 0,74 nach Korrektur (liquide Fassung t 2,02, In-Sample und am Rand) | belegstand.md „Nicht entscheidbar“, Zeile Momentum-Buch |
| app-shell.js:1095 | c | Ergebnis-Drift … 8,44 statt 14,07 % p.a. | Ergebnis-Drift, gemessen am 04.10.2026: Buch 13,01 % p. a. gegen S&P 500 12,63 % p. a., 16 von 200 Zufallsbüchern darüber | belegstand.md „Ergebnis-Drift tagesgenau (04.10.2026)“, Tabelle |
| app-shell.js:1095 | c | beide halten über die volle Historie, aber nicht … ab 2005 | Belegt ist keine von beiden – beide sind nach heutigem Stand nicht entscheidbar | belegstand.md Kopf NULL |
| app-shell.js:1232 | c | … ist jede weitere ein Out-of-Sample-Beleg. | … ist jede weitere Out-of-Sample – ein Beleg ist das nicht: Über Monate prüft das die Umsetzung …, nicht den Vorsprung. | belegstand.md Nachtrag 04.10.2026 (23:06), Punkt (3) |
| app-shell.js:1252 | d | Der Drift liefert nur ein Viertel bis ein Achtel der Schein-Kostenhürde. | gestrichen | – (Zahl nirgends im Korpus) |
| app-shell.js:1253 | c | Nach einer Quartalsmeldung läuft der Kurs noch Wochen … weiter. | Die These: … Gemessen am 04.10.2026: nicht entscheidbar. | belegstand.md „Ergebnis-Drift tagesgenau (04.10.2026)“ Überschrift |
| app-shell.js:1254 | d | Deshalb bleibt … messbar etwas übrig (0,41, +6,90 % p. a., t = 2,20) | Ob deshalb neben dem Momentum etwas übrig bleibt, ist nach heutigem Stand nicht belegt. | belegstand.md Ergebnis-Drift, Lesart (1) „kein Beleg“ |
| app-shell.js:1255 | d | müsste 5,5 bis 11 % laufen … rund 1,3 % je Position. Faktor 4 bis 8 | Ein Schein verliert über die Haltedauer von 60 Handelstagen Zeitwert und Spanne; eine belegte Drift-Größe, die das trägt, gibt es nicht. | belegstand.md Ergebnis-Drift, Tabelle (60 Handelstage) |
| app-shell.js:1256 | c | ab 2015 +10,44 % p. a. bei t = 3,04, 67 % positive Monate … | 14.184 Meldungen … Nur die Kaufseite, 60 Handelstage, nach Kosten: Buch +13,01 % gegen S&P 500 +12,63 % p. a. (+0,38 Pp) – nicht entscheidbar, kein Vorwärtstest. Überholt: frühere Messung (20.356 Ergebnistermine …) ersetzt; danach t 1,7–2,0. | belegstand.md Ergebnis-Drift (Nr. 88) Messung + Tabelle; „Nicht entscheidbar“ Zeile Ergebnis-Drift-Buch |
| app-shell.js:1256 | c | Zufällige Zuordnung ergibt −1,74 % (t = −0,88) | Zufallsbücher (Zufallszahl statt Überraschung): Mitte +56,6 %, 16 von 200 über dem Buch | belegstand.md Ergebnis-Drift, Zeile Zufallsbereich |
| app-shell.js:1257 | c | schwache Hälfte +1,72 % (t = 0,58), starke +8,61 % | Ein Fenster, eine Regel, ein Lauf; Überraschung aus dem später eingereichten Bericht, kein Analysten-Konsens. | belegstand.md Ergebnis-Drift, „Grenzen“ |
| app-shell.js:1257 | d | es braucht beide Beine – long allein ist überwiegend Marktbeta | Über 60 Handelstage …: Kaufseite nach Kosten +1,39 Pp (t 1,97), oberstes gegen unterstes Zehntel +2,09 Pp (t 1,67) – beides nicht entscheidbar. Die Regel dieses Buchs … ist so nicht gemessen. | belegstand.md Ergebnis-Drift, Zeile „Stufe 1, 60 Handelstage“ |
| app-shell.js:1285 | d | … mit Schein im Backtest bei −96 %. | … liegt der gemessene Überschuss (+0,021 Pp je Signal, nicht entscheidbar) weit unter der Schein-Kostenhürde. | belegstand.md „Nicht entscheidbar“, Zeile `rsi2seit` |
| app-shell.js:1305 | d | Streng bis Handelsschluss … Intraday-Kante −0,08 % …, +0,23 %. | gestrichen | – (Zahlen nirgends im Korpus) |
| app-shell.js:1326 | c | … war der einzige Teilüberlebende der Trendwende-Studie … | … ist nachgemessen: netto unentscheidbar, alle 10 Varianten mit negativem Punktschätzer, Long-Seite in der Größe ausgeschlossen | belegstand.md „Nicht entscheidbar“, Zeile Trendwende-/Winkel-Detektor (ergänzt 02.09.) |
| app-shell.js:1326 | c | in 4–6 Wochen wird sauber nachgemessen | gestrichen (samt „seit 8.23.25“) | dieselbe Zeile: Nachmessung ist gelaufen |
| app-shell.js:1339 | d | (−0,028 / +0,166 / +0,230 % bei gleicher Fallzahl) | gestrichen | – (Zahlen nirgends im Korpus) |
| release-notizen/2026-10-04-massstab-rueckblick.md:3 | d | von +0,7 % auf +1,1 % | etwas (bisher zeigte die App +0,7 %; aus dem Minutenarchiv seit dem Kaufzeitpunkt nachgerechnet +0,88 % mit Ausschüttung) | belegstand.md Nachtrag Nr. 81 (04.10.2026) |
| release-notizen/2026-10-04-texte-pruefgang.md:3 | c | beim Korb 187, dass rund 2 % der Reihen … doppelt standen | gestrichen | belegstand.md Nachtrag Nr. 96 (Panel v2.3); Notiz rueckblick-v23 |

### g3-strategien (26 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| strategien.js:26 | d→a | „mit Schein stirbt die Kante (−96 %)“ | „mit Hebelschein liegt der gemessene Überschuss unter den Kosten“ | kosten.md, Tabelle „Je Gefäß“, Hebelschein 0,23 Pp; belegstand.md „Nicht entscheidbar“, rsi2seit +0,021 Pp |
| strategien.js:35 | c→a | „Überschuss von +0,024 Pp bei MDE 0,182 Pp – nicht entscheidbar“ | „im Tagesmittel +0,054 Pp (se 0,065, Band −0,073 bis +0,182) – nicht entscheidbar“ (Protokoll 26.08.2026) | belegstand.md „Nicht entscheidbar“, Zeile rsi2seit (Ergänzt 02.09.) |
| strategien.js:35 | c→a | „Je Signal gerechnet sind es −0,045 Pp.“ | „bleibt ein Überschuss von +0,021 Pp je Signal“ | belegstand.md „Nicht entscheidbar“, Zeile rsi2seit |
| strategien.js:35 | d | „Rund 62 % des früher gemessenen Rohvorteils waren schlichtes Halten.“ | gestrichen | – (nicht im Belegkorpus) |
| strategien.js:65 | d | „−0,74 Prozentpunkte auf 20 Handelstage“ | gestrichen (t = −11,6 bleibt, „Haltedauer je Signal rund 20 Handelstage“) | belegstand.md „Widerlegt“, Stunden-Strategie t = −11,6 (Gedächtnisprotokoll) |
| strategien.js:65 | d | „aus 24.727 Signalen über 189 Werte und 8 Jahre“ | gestrichen → „aus dem Gedächtnisprotokoll (Belegstand, Abschnitt „Widerlegt“)“ | belegstand.md „Widerlegt“ |
| strategien.js:66 | d | „nur 32 von 189 Werten positiv, beide Zeithälften negativ“ | gestrichen (ganzer Satz „Kein Randfall …“) | – (nicht im Belegkorpus) |
| strategien.js:66 | c→a | „Das News-Sentiment … war nie messbar“ | „… ist seit 01.09.2026 gemessen und über Nacht auf Großwerten widerlegt (t = 0,31). Für Nebenwerte und andere Zeitfenster sagt diese Messung nichts.“ | belegstand.md „Widerlegt“, News-Sentiment (Übernacht, Großwerte), 01.09.2026 |
| strategien.js:80 | c→a | stand „gemessen – hält die volle Historie, nicht die zurückgehaltenen Jahre“ | „gemessen – nicht entscheidbar; liquide Fassung „lebt“ (In-Sample, am Rand)“ | belegstand.md „Nicht entscheidbar“, Momentum-Buch H=63 (02.09.) |
| strategien.js:88 | c→b | „Über die volle Historie +2,42 Pp je Umschichtung (t = 3,84)“ | Wortlaut bleibt; Beleg beginnt jetzt mit „KONTROLLMESSUNG 23.08.2026 – überholt (Universum ohne die verschwundenen Werte; …)“ | belegstand.md „Nicht entscheidbar“, Momentum-Buch: t 4,74 → 0,74 |
| strategien.js:88 | c→b | „ab 2005 allein +1,51 Pp bei MDE 1,86 (t = 1,62): nicht entscheidbar“ | Wortlaut bleibt, unter dem Überholt-Vermerk | wie oben |
| strategien.js:88 | d→b | „Rund die Hälfte des Vorsprungs hängt an 30 von 189 Werten“ | Wortlaut bleibt, unter dem Überholt-Vermerk | wie oben |
| strategien.js:88 | d→b | „64,8 % des Ertrags je Schritt sind schlichtes Halten“ | Wortlaut bleibt, unter dem Überholt-Vermerk | wie oben |
| strategien.js:88 (Zusatz) | neu a | – | „heute laut Belegstand für das Momentum-Buch nach Korrektur t 0,74 – nicht entscheidbar“ | belegstand.md „Nicht entscheidbar“, Momentum-Buch |
| strategien.js:111 | d→a | „59,8 % aller Termine (Datum ohne Uhrzeit)“ | „behandelte alle Termine ohne Uhrzeit als „vor Börsenschluss gemeldet"“ | belegstand.md „Nicht entscheidbar“, Ergebnis-Drift-Buch (Zeitzonen-Korrektur) |
| strategien.js:111 | d→a | „Meldesprung von 1,97 % am ersten Tag“ | „verbuchte dadurch den Meldesprung am ersten Tag als Strategieertrag (Zeitzonen-Fehler)“ | wie oben |
| strategien.js:111 | d | „Korrigiert fällt der Rohlauf von 14,07 auf 8,44 % p. a.“ | gestrichen | – (nicht im Belegkorpus) |
| strategien.js:111 | d | „über die volle Historie 12 Pp p. a. (t = 5,5)“ | gestrichen | – (nicht im Belegkorpus) |
| strategien.js:111 | d | „im zurückgehaltenen Zeitraum 5–7 Pp bei MDE 5,6–6,7“ | gestrichen → „ist der Rest nach der Korrektur zu schwach (t = 1,7–2,0): nicht entscheidbar“ (Zusatz, a) | belegstand.md, Ergebnis-Drift-Buch t 1,7–2,0 |
| strategien.js:111 (Zusatz) | neu a | – | „Die tagesgenaue Messung vom 04.10.2026 (Nr. 88, nur die Kaufseite als Buch) ist ebenfalls nicht entscheidbar“ | belegstand.md „Ergebnis-Drift tagesgenau (04.10.2026)“ |
| studienurteile.js:54 | d→a | „Erster Backtest zuvor: −39 % bei Gegenprobe p = 0,86.“ | „Trendkanal auf Tagesbasis (09.09.2026): Kauf an der unteren Linie t −3,4 bis −4,3 gegen den Topf – als Einstieg in jeder Umsatzklasse zu.“ | belegstand.md Kopf „Neu am 09.09.“ / Abschnitt „Trendkanal auf Tagesbasis“ |
| studienurteile.js:159 | c→a | grenzen „vor Steuern (nach Steuern für den breiten Markt nicht gerechnet)“ | „vor Steuern (im Rechenmodell nach Steuern, ohne Regel K: −2,20 Pp pro Jahr hinter dem Indexfonds)“ | belegstand.md, Nachtrag 04.10.2026 Nr. 82, Zeile breiter Markt 2021–2026 nach Steuern |
| strategiechart.js:229 | c→a | „fand auf anderen Zeitrahmen keine tragfaehige Kante“ | „fand unter 51 Detektoren keinen tragfähigen“ | belegstand.md „Widerlegt“, Große Signalstudie 0 von 51 |
| strategiechart.js:229 (Zusatz) | neu a | – | „die Minutenstudie (1m/5m/15m) unter 234 Konfigurationen ebenso keinen“ | belegstand.md „Signalstudie Minuten“, Gesamtbericht 11.09.2026 |
| strategiechart.js:230 (Zusatz) | neu a | – | „Auch auf 60m ist keine Regel belegt: RSI(2) … nicht entscheidbar, der Kapitulations-Dip in der behaupteten Größe zurückgewiesen“ | belegstand.md „Nicht entscheidbar“, Zeilen rsi2seit und kapitulation (03.10.2026) |
| strategiechart.js:278 | d→a | „Put-Seite gemeldet – trägt nicht, wird nicht gehandelt“ | „Put-Seite gemeldet – wird nicht gehandelt (die Regel handelt nur Long)“ | belegstand.md rsi2seit (Urteil ohne Zahl; Satz trägt kein Messurteil mehr) |

### g4-bestand-drift-markt (13 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| driftui.js:171 | c→a | „überzufällig (t ≥ 2)“ / „nicht überzufällig – das ist kein Beleg“ | „auffällig (t ≥ 2), aber kein Beleg – die Messung vom 04.10.2026 ist nicht entscheidbar“ / „unauffällig – kein Beleg“ | belegstand.md, Ergebnis-Drift tagesgenau (Nr. 88, 04.10.2026), Zeile Stufe 1 |
| wendeui.js:258 | d→a | „widerlegt (0,074 Pp, t = 1,22).“ | „… +0,25 Pp sind dort widerlegt (Studie #33).“ (0,074 und t gestrichen) | studien/33-winkel-detektor/README.md, „Ergebnis in einem Satz“ |
| wendeui.js:259 | c→a | „Das ist die belastbare Aussage zu diesem Detektor.“ | „Neuerer Stand (02.09.2026, Belegstand): netto nicht entscheidbar; alle 10 Punktschätzer negativ, 9 von 10 obere Grenzen unter 0,1247 Pp – Long-Seite als Größe ausgeschlossen.“ | belegstand.md, Nicht entscheidbar → Trendwende-/Winkel-Detektor (ergänzt 02.09.) |
| berichte.js:70 | d→a | „news-Gewicht senken: nur x % Treffer“ | „src: nur x % Treffer (r/n) – wenige Treffer, aber eine Trefferquote ist kein Beleg gegen die Quelle.“ | belegstand.md Kopf („Belegte handelbare Kanten: NULL“) |
| berichte.js:71 | d→a | „…-Gewicht erhöhen: x % Treffer“ | „src: x % Treffer (r/n) – viele Treffer, aber eine Trefferquote ist kein Beleg für die Quelle.“ | belegstand.md Kopf; News-Sentiment unter „Widerlegt“ |
| berichte.js:75 | c→a | „größeren Zeitrahmen (5/15 Min) oder höhere Bestätigung testen“ | „größerer Minuten-Zeitrahmen hilft nach dem Belegstand nicht: … auf 1m/5m/15m … keine belegte Konfiguration (0 von 234, Stand 11.09.2026)“ | belegstand.md, Signalstudie Minuten, Nachtrag 11.09.2026 (Gesamtbericht) |
| berichte.js:350 | d→a | „Hürde für ein belastbares Urteil: N Out-of-Sample-Trades auf T Tagen“ | „Mindestmenge, bevor die App überhaupt rechnet: … – ein Urteil ist das noch nicht; dafür braucht es t über Tage, ausreichende Auflösung und Netto nach Kosten.“ | belegstand.md, Querschnitt 15.09., „ZURÜCKGENOMMEN“ (Auflösung) |
| berichte.js:354 | d→a | „Stichprobe onvista … Befund: Spanne ist fester Cent-Betrag … 1 ct bei 0,1, 2 ct bei 1,0“ | „Cent-Modell … Stichprobe bei onvista vom 20.08.2026, nicht als Messung abgelegt – Annahme, kein Beleg. Gemessen ist für Hebelscheine nur … 0,23 Pp je 3 Stunden (wiki/kosten.md).“ | kosten.md, „Je Gefäß“ → Hebelschein |
| berichte.js:354 | d | „Ein 8-Euro-Schein zahlt damit 0,13 % je Seite, ein 9-Cent-Schein 11,5 %.“ | gestrichen | – (Zahlen nicht im Belegkorpus) |
| berichte.js:356 | d→a | „also ein Fünftel des relativen Spreads bei identischem Hebel“ | „zahlt relativ weniger Spanne bei gleichem Hebel … – eine Folgerung aus der Modellannahme, nicht gemessen“ | kosten.md, „Je Gefäß“ → Hebelschein |
| berichte.js:473 | d→a | „spart Geld“ / „kostet Geld – Kandidat zum Lockern“ / „neutral“ | „mit Filter besser (ohne Signifikanzprüfung)“ / „mit Filter schlechter (ohne Signifikanzprüfung)“ / „kein Unterschied sichtbar“ | belegstand.md, Querschnitt 15.09., „ZURÜCKGENOMMEN“ |
| berichte.js:489 | d→a | „rettet Geld“ / „verhindert eher Gewinne“ / „unentschieden“ | „bisher eher Verluste vermieden“ / „bisher eher Gewinne verhindert“ / „kein Muster“ | belegstand.md, Querschnitt 15.09., „ZURÜCKGENOMMEN“ |
| berichte.js:526 | d→a | Spalte „belastbar“ | Spalte „Mindestmenge erreicht“ | belegstand.md, Querschnitt 15.09., „ZURÜCKGENOMMEN“ |

### g5-explorer-quant (8 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| explorer.js:203 | d→a | „Roh ein Münzwurf (+0,017 Prozentpunkte).“ | „Roh ohne belegten Vorsprung (Signalstudie: 0 von 51 Detektoren bestätigt).“ | belegstand.md, Widerlegt → Große Signalstudie |
| explorer.js:203 | c→a | „Trägt erst mit der Erlaubnis … seit dem 23.08.2026 nicht entscheidbar.“ | „Mit der Erlaubnis … ist es die Hauptstrategie (rsi2seit) – gemessen nicht entscheidbar: +0,021 Pp je Signal, unter jeder Beweisschwelle.“ | belegstand.md, Nicht entscheidbar → rsi2seit |
| explorer.js:236 | d→a | „Gemessen an 191 Werten über 55 Jahre hat dieses Signal KEINEN Vorsprung“ | „Im Belegstand hat dieses Signal KEINEN Vorsprung, gemessen ist es dort nicht“ | belegstand.md Kopf („Belegte handelbare Kanten: NULL“) |
| explorer.js:238 | c→a | „die einzige gemessen tragende Kanal-Nutzung – es steuert den Intraday-Einstieg“ | „steuert den Intraday-Einstieg (RSI2 im Seitwärtskanal) – gemessen nicht entscheidbar (+0,021 Pp je Signal). Als Einstieg … Anzeige ja, Einstieg nein.“ | belegstand.md, rsi2seit; Trendkanal 09.09.2026 (Lesart) |
| scheinfinder.js:323 | d→a | „aus dem an echten Emittentenkursen geeichten Cent-Modell“ | „aus dem Cent-Modell (Modellannahme aus einer Stichprobe bei onvista, im Belegstand nicht gemessen)“ | kosten.md, „Je Gefäß“ → Hebelschein (einzige gemessene Schein-Hürde) |
| scheinfinder.js:424 | d→a | „aus dem an echten Kursen geeichten Cent-Modell“ | „aus dem Cent-Modell (Modellannahme, im Belegstand nicht gemessen)“ | kosten.md, „Je Gefäß“ → Hebelschein |
| kosten.js:43 | c→b | `var ALP_ANNAHME_PCT = 0.06;` // „die Aktien-Kostenannahme, die hier ersetzt werden soll“ | Wert unverändert; Kommentar „alte Aktien-Kostenannahme …, überholt 03.09.2026: Kassa-Hürde je Umsatzklasse gemessen, 0,0449 bis 0,1569 Pp (wiki/kosten.md)“ | belegstand.md, Größen-Ausschlüsse (überholt 03.09.); kosten.md Kassa-Hürde |
| kosten.js:245 | c→a | `annahmePct: 0.10, seit: sp.seit` | Wert unverändert; Kommentar „0,10 Pp = CFD-Runde ohne Nacht (Capital.com-Spannen), keine Kassa-Hürde – die ist seit 03.09.2026 je Umsatzklasse gemessen“ | belegstand.md, Größen-Ausschlüsse „0,10 Pp (CFD-Runde ohne Nacht)“ |

### g6-depot (12 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| depot.js:635 | c | „zwei Drittel des Rohertrags Kontrolle (+0,065 Überschuss auf +0,170 roh) … nennt sie Kante“ | „(RSI(2) im Seitwärtskanal) bleibt … ein Überschuss von +0,021 Pp je Signal – nicht entscheidbar (Messprotokoll 26.08.2026, Belegstand). Ohne diese Spalte misst man Marktdrift und hält sie für einen Vorsprung der Regel.“ | wiki/belegstand.md, „Nicht entscheidbar“, Zeile `rsi2seit` |
| depot.js:664 | c | Regelkopf: „+0,065 Pp Überschuss gegen eine Kontrolle …“ | „Überschuss +0,021 Pp je Signal gegen eine Kontrolle aus echten Kerzen …“ | belegstand.md, „Nicht entscheidbar“, `rsi2seit` (Protokoll rsi2seit-2026-08-26) |
| depot.js:665 | c | „(6.509 Trades, 675 Tage). Die Rohkante von +0,170 Pp besteht … Zeit im Markt“ | „Tagesmittel +0,054 Pp (Messprotokoll 26.08.2026) – nicht entscheidbar, unter jeder Beweisschwelle (Belegstand)“ | belegstand.md, „Nicht entscheidbar“, `rsi2seit` (Ergänzung 02.09.) |
| depot.js:1493 | d | „setzt keine Kante mehr automatisch aus“ | „setzt keine Regel mehr automatisch aus“ | belegstand.md Kopf: „Belegte handelbare Kanten: NULL“ |
| depot.js:1507 | d | „dieser Kanten / dieser Kante“ | „dieser Regeln / dieser Regel“ | belegstand.md Kopf: „Belegte handelbare Kanten: NULL“ |
| depot.js:3106 | c | „RSI(2) … pausiert (verliert dort −0,17 Pp)“ | „… pausiert (alte Regime-Studie 21.08.2026: −0,169 Pp unter der Linie – nicht nachgemessen, weder bestätigt noch widerlegt)“ | belegstand.md, „Validierte BEDINGUNGEN“, Vermerk 04.10.2026 zu R-TREND |
| depot.js:5814 | c | „Backtest vor der Kontrollmessung: +0,147 Pp auf 8 Handelsstunden …“ | „Kein Messprotokoll im Datenordner. Stand laut Belegstand: Überschuss +0,021 Pp je Signal gegen die Kontrolle (Messprotokoll 26.08.2026) – nicht entscheidbar.“ | belegstand.md, „Nicht entscheidbar“, `rsi2seit` |
| depot.js:5825 | d | „mit Schein war dieselbe Strategie im Backtest bei −96 %“ | „der gemessene Überschuss je Signal liegt weit UNTER der Kostenhürde des Scheins“ (−96 % entfällt) | belegstand.md, „Größen-Ausschlüsse“ (0,23 Pp Standard-Schein); kosten.md „Je Gefäß“ |
| depot.js:5843 | d | „das ist die Phase dieser Kante, sie darf handeln“ | „in dieser Phase darf die Regel handeln (die Zuteilung selbst ist ohne Beleg)“ | belegstand.md, Vermerk 04.10.2026: t = 3,2 kein Beleg der Zuteilung mehr |
| depot.js:5844 | d | „das ist NICHT die Phase dieser Kante, sie pausiert“ | „in dieser Phase pausiert die Regel (die Zuteilung selbst ist ohne Beleg)“ | wie oben |
| depot.js:5886 | d | „übernimmt nur doppelt bestätigte, robuste Ergebnisse“ | „übernimmt nur Ergebnisse, die in zwei Nachtläufen mit neuen Handelstagen bestehen (das ist kein Beleg im Sinne des Belegstands)“ | belegstand.md Kopf: „Belegte handelbare Kanten: NULL“ |
| depot.js:6215 | d | Wächter-Urteil „im Rahmen der Studie“ (t ≥ 1,5) | „positiv (t ≥ 1,5) – eine Beobachtung im Archiv, kein Beleg“ (Schwelle 1.5 unverändert) | belegstand.md Kopf: „Belegte handelbare Kanten: NULL“ |

### g7-module (9 Zeilen)

| Datei:Zeile | Kl. | alt (gekürzt) | neu (gekürzt, oder „gestrichen“) | Beleg |
|---|---|---|---|---|
| scoreboard.js:454 | c | „(gemessen an 15 US-Großwerten 2026: Aktie 0,04 · Schein am Geld 0,05 · CFD 0,10 · Standard-Schein 0,23 Pp je Umlauf)“ | „(Belegstand: Aktie je Umsatzklasse 0,0449 bis 0,1569 Pp, gemessen 03.09.2026, siehe wiki/kosten.md · CFD 0,10 · Standard-Schein 0,23 Pp je Umlauf; für den Schein am Geld liegt keine Messung im Belegstand vor)“ | belegstand.md, „Wiedervorlage an der gemessenen Kassa-Hürde (03.09.2026)“ und „Größen-Ausschlüsse“; kosten.md „Je Gefäß“ |
| scoreboard.js:454 (Zusatz) | c | „Schein am Geld 0,05“ | „für den Schein am Geld liegt keine Messung im Belegstand vor“ | belegstand.md „Größen-Ausschlüsse“ (kein Schein-am-Geld-Wert) |
| mfdepot.js:178 | c | „jede weitere ein Out-of-Sample-Beleg“ | „jede weitere eine Out-of-Sample-Beobachtung – für sich kein Beleg“ | belegstand.md, „Nicht entscheidbar“, Momentum-Buch („ab hier Out-of-Sample“, 02.09.2026) |
| mittelfrist.js:344 | d | „Prüfzeitraum ab 2005 – die Parameter wurden auf den Jahren davor ausgesucht …“ | „Rückrechnung ab 2005 auf heute gelisteten Großwerten (nur Überlebende) – kein Prüfzeitraum im Sinne einer Bestätigung. Belegstand zum Monats-Momentum: nicht entscheidbar.“ | belegstand.md, „Nicht entscheidbar“, Momentum-Buch |
| depotmigration.js:128 | d | „vermessen (24.727 Signale, 189 Werte, 8 Jahre)“ | „vermessen und ist widerlegt: Ihr Technik-Score ist ein …“ | belegstand.md, „Widerlegt“, Stunden-Strategie (t = −11,6) |
| depotmigration.js:129 | d | „Kontraindikator (−0,74 Pp auf 20 Tage, t=−11,6)“ | „Kontraindikator (Belegstand, t=−11,6)“ | belegstand.md, „Widerlegt“, Stunden-Strategie |
| depotmigration.js:152 | c | „Die gemessene Kante war auf …“ | „Die gemessene Regel war auf …“ | belegstand.md Kopf: „Belegte handelbare Kanten: NULL“ |
| depotmigration.js:268 | c | „35 Beobachtungen an 10 Zeitpunkten, nötig wären rund …“ | „gemessen und widerlegt (Übernacht, Großwerte, Scorer der App: b = +0,0070 Pp je Score-Punkt, t = 0,31 – mitten im Placebo-Band; Messung vom 01.09.2026, Belegstand)“ | belegstand.md, „Widerlegt“, News-Sentiment; studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md |
| depotmigration.js:269 | c | „2.600. Es fehlt der Faktor 75. Unbelegt ist nicht widerlegt“ | gestrichen (überholt durch die Vollmessung 01.09.2026, Urteil steht im Satz davor) | wie oben |
