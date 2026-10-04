# Ergebnis-Drift tagesgenau — Machbarkeit (Auftrag Nr. 80, 04.10.2026)

**Gemessen wurde nichts.** Geholt wurden die Meldezeiten, gezählt wurde blind, bestimmt wurde die Auflösung. Kein Ertrag wurde nach
Vorzeichen, Größe oder Zehntel der Überraschung gebildet oder angesehen; M6 bekommt die Überraschung nicht als Eingabe (`aufloesung.js`
wirft bei jedem Feld außer `tag`, `quartal`, `abn`; `test.js`). Alle Zahlen stammen aus `zaehlung-m1.json`, `zaehlungen.json`,
`aufloesung.json`, `tore.json`, `handprobe.json`, `deckung.json` (Ansicht: `node zeige.js m1|z|m6`). Simulation, keine Anlageberatung.

## Der eine Satz

**Eine Messung könnte einen Effekt ab 1,1 Pp über 20 Tage bzw. 2,5 Pp über 60 Tage auflösen (Abstand oberstes gegen unterstes Zehntel
der Überraschung); für die Seite, die Wilhelm handeln könnte — oberstes Zehntel gegen das Mittel der Klasse — ab 0,8 Pp über 20 Tage
bzw. 1,6 Pp über 60 Tage; die Kosten liegen bei 0,08 bis 0,21 Pp je Umlauf (Eröffnungs-Spanne je Klasse, über die Ereignisse gemittelt 0,19 Pp).**

Das gilt für die Klassen 50-250, 250-1000 und ab1000 zusammen, 25.298 Meldungen an 1.876 Einstiegstagen (2017 bis 15.09.2026), mit dem
Schätzer „erst je Einstiegstag, dann über die Tage" und 80 % Macht. Die Kosten sind also nicht das Hindernis — die Frage ist allein, ob
der Effekt heute noch die Größe hat, die sich auflösen lässt (§6, §7).

## 1. M1 — Meldezeiten (SEC, Einreichungslisten je Firma)

| | |
|---|---|
| Firmen (CIK) der Bilanz-Tafel v1.1 | 5.904 — **alle mit Antwort**, 0 ohne Liste (404), 0 offen |
| gesehene Einreichungen / Zusatzdateien geholt | 5.962.311 / 1.221 |
| 8-K-Formen 2016–2026 | 447.118 Zeilen bei 5.149 Firmen |
| **davon mit Punkt 2.02** | **126.907** (Form 8-K 125.796, 8-K/A 1.111) bei **4.341 Firmen** (1.966 lebend, 2.375 verschwunden) |
| mit Annahmezeit | 126.907 von 126.907 (100 %) |
| Punkt 2.02 allein / nur mit 9.01 / mit 7.01 / mit weiteren Punkten | 2.109 / 88.931 / 21.520 / 14.347 |
| dieselbe Akzession bei mehr als einer Firma (Mit-Registranten) | 122 |

Je Jahr (alle Formen / Form 8-K): 2016 12.092 / 11.985 · 2017 12.081 / 11.983 · 2018 11.997 / 11.877 · 2019 11.645 / 11.541 · 2020 11.982 / 11.872 ·
2021 12.427 / 12.312 · 2022 12.691 / 12.573 · 2023 12.230 / 12.116 · 2024 11.568 / 11.465 · 2025 10.696 / 10.613 · 2026 (bis 02.10.) 7.498 / 7.459.

**Probe an 20 Firmen** (`probe-20.json`): Felder bei allen 20 vorhanden, auch bei den zehn verschwundenen (JONE, HARP, TWTR, ATVI, CELG, XLNX … mit
2.02-Meldungen bis zum Abgang). Drei Befunde zur Identität, die für die Tafel gelten, nicht für den Abruf: **XOM** zeigt auf eine CIK, die erst seit
Juli 2026 einreicht (Holding-Umbau; die Vorgeschichte liegt unter der alten CIK); **AAC** zeigt auf einen Fonds-Trust (keine 8-K); **BBBY** und **CAPA** zeigen
auf die Firma, die das Kürzel **heute** trägt. Über alle Firmen: bei **203 CIKs** beginnt die Einreichungsliste mehr als 90 Tage nach der ersten Kerze
der Reihe — dort fehlt die Vorgeschichte unter der Vorgänger-CIK (Meldungen **und** Bilanzzeilen).

**Abruf:** eine Spur, 250 ms Takt (gemessen 3,9 Anfragen/s), 7.037 Anfragen in 1.818 s (30 min), dazu 88 (Probe), 10 (Zeitprüfung), 30 (Handprobe);
0 Fehler, 0 Sperren (kein 429/403). Cache: `E:/Markt-Dashboard-Archiv/edgar-submissions/cik/` (je CIK alle 8-K-Zeilen ab 2016), rohe Antworten nur der
20 Probe-Firmen (`roh-probe/`), Einreichungsköpfe (`kopf/`). Auszug im Repo: `meldungen-202.tsv` (11,6 MB).

## 2. M2 — Zeit

**Zeitprüfung (§5.2): 10 von 10.** `acceptanceDateTime` ist echte Weltzeit; nach New York umgerechnet (Intl, `America/New_York`) stimmt sie in allen
zehn mit `<ACCEPTANCE-DATETIME>` im Kopf der Einreichung überein — 5 Sommer, 5 Winter, drei davon wenige Tage um eine Zeitumstellung, 8 ab 16:00,
2 vor 09:30. Die Lesart „die Ziffern sind schon Ortszeit" stimmt in 0 von 10 (`zeitpruefung.json`).

Tageszeit aller 125.796 Meldungen (Form 8-K): **vor Handelsbeginn 48.136 (38,3 %) · im Handel 7.288 (5,8 %) · ab Handelsschluss 70.326 (55,9 %)** ·
an handelsfreien Tagen 46. Der Anteil „im Handel" fällt von 1.303 (2016) auf 287 (2025). Knapp vor Beginn (09:00–09:29:59): 3.422 (2,7 %) — nach der
Regel „Einstieg zur Eröffnung desselben Tags", praktisch kaum zu schaffen. **Einstiegstag:** vor 09:30:00 an einem Handelstag derselbe Tag, sonst der
nächste Handelstag des Panel-Kalenders (verkürzte Tage: Schluss 13:00).

**Handprobe an 30 Meldungen** (`handprobe.json`, Zufall mit festem Startwert aus den Ereignissen der Hauptklassen; geprüft, was die Einreichung selbst hergibt):

| | |
|---|---|
| Anhang 99.1 vorhanden | 30 von 30, alle die reguläre Quartalsmitteilung |
| Datum der Mitteilung gegen Annahmedatum | **gleicher Tag 28 · Vortag 1** (AVB: Mitteilung am Abend, 8-K am nächsten Morgen 06:56 — derselbe Einstiegstag) · kein Datum im Anfang 1 (WMT) |
| Uhrzeit der Mitteilung im Text | **0 von 30** |
| Punkt 2.02 nur mit 9.01 / mit 7.01 / mit 8.01 / mit 5.02 | 23 / 5 / 2 / 1 (ETSY trägt 5.02 und 7.01) |
| vorläufige Zahlen (Vorabmeldung) | 0 von 30 (ein Texttreffer „preliminary, unaudited" ist die übliche Formel der regulären Mitteilung) |
| Tageszeit | 11 vor Beginn (06:18–07:46), 19 nach Schluss (16:01–19:24), 0 im Handel |

**Die Grenze:** die Uhrzeit der Pressemitteilung ist aus der Einreichung nicht zu haben. Die Annahmezeit liegt nach der Mitteilung — Minuten bis, wie
bei AVB, eine Nacht. In der Stichprobe ändert das den Einstiegstag in keinem der 30 Fälle. Gefährdet sind die 5,8 % „im Handel" (unter den Ereignissen 3,4 %):
dort kann die Mitteilung vor der Eröffnung gelegen haben, und die Messung stiege einen Tag zu spät ein — vorsichtig, nicht geschönt.

## 3. M3 — Zuordnung zum Quartal

Regel (`zuordnung.js`, am Kunstfall geprüft): nur Form 8-K gegen Erstberichte 10-K/10-Q (keine /A); die Meldung liegt nach dem Stichtag und vor oder am
`filed` der Zeile, höchstens 150 Tage nach dem Stichtag; die Zeile mit dem nächstliegenden `filed` gewinnt; je Zeile ist die **späteste** Meldung vor dem
Bericht die Hauptmeldung (eine frühere ist meist eine Vorabmeldung, zu der das Quartalsergebnis noch nicht stand — die Regel steigt im Zweifel zu spät ein).

| von 125.796 Meldungen (Form 8-K) | | |
|---|---:|---:|
| zugeordnet (vor oder am Tag des Berichts) | 116.792 | 92,8 % |
| — davon **Hauptmeldung** ihrer Zeile | **108.784** | |
| — davon weitere Meldung derselben Zeile (mehrdeutig: Vorabmeldung, Nachtrag) | 8.008 | |
| Bericht lag schon vor (Meldung 1–5 Tage nach dem 10-Q/10-K) — nicht benutzt | 3.041 | 2,4 % |
| ohne Partner | 5.963 | 4,7 % |
| zwei Zeilen mit demselben `filed` (die jüngere Periode genommen) | 67 | |

Von 130.635 Erstberichten der Tafel (filed ab 2016) haben 108.784 (83,3 %) eine Hauptmeldung. 818 der 5.904 Firmen haben gar keine Tafelzeile.
**Abstand Hauptmeldung → `filed`:** am selben Tag **50.281 (46,2 %)** · 1–5 Tage 29.355 (27,0 %) · 6–30 Tage 26.393 (24,3 %) · mehr als 30 Tage 2.755 (2,5 %);
Median 1 Tag, 90 % bis 16 Tage, 99 % bis 41 Tage. Am selben Tag wurde der Bericht in 7.772 Fällen **vor** der 8-K angenommen. Meldung nach dem Stichtag: Median 35 Tage.

## 4. M4 — Überraschung

Größe des Felds `sue`: `(netto D0 − netto D4) / sd(netto D0…D7)` aus `quartale.netto` der zugeordneten Zeile (Rechenzeilen aus `feld.js`, im Test an sechs
Kunstfällen gegen das Feld gehalten). **108.784 Hauptmeldungen, 104.013 mit Überraschung (95,6 %)**; 4.771 ohne (ein Quartal fehlt), 0 mit sd = 0; 1.482 mit einem
Quartal über den Weg „Jahr − YTD3". Je Jahr 9.455 bis 10.628 (2026 bis September: 4.443). Die Größe liegt per Bau zwischen −3,74 und +3,74.

**Ehrlich benannt:** die Zahl stammt aus dem 10-Q/10-K, die Meldung aus der Pressemitteilung. In 46 % kam der Bericht am selben Tag, in 54 % später
(27 % innerhalb von 5 Tagen, 2,5 % nach mehr als 30). Für eine Messung heißt das: (a) wurde zwischen Mitteilung und Bericht eine Zahl geändert, trägt die
Tafel die spätere — ein kleiner Blick in die Zukunft, nicht bezifferbar ohne die Mitteilungen selbst zu lesen; (b) D1…D7 kommen aus dem Stand dieses
Berichts, nicht aus den früheren Mitteilungen; (c) es ist eine Zeitreihen-Überraschung ohne Analysten-Konsens — in der Literatur die schwächere der beiden
Fassungen. Das ist die Annahme der Studie (§5.4 des Auftrags), kein Befund.

## 5. M5 — Blinde Zählung

Von 108.784 Hauptmeldungen bleiben **45.785 Ereignisse** (Einstiegstag, Panel-Zeile, Universum am Stichtag = Handelstag vor dem Einstieg, Überraschung):

| Abgang | Meldungen |
|---|---:|
| keine Panel-Zeile am Einstiegstag: nach dem Abgang / vor dem ersten Balken / Lücke | 4.741 / 1.311 / 415 |
| mehrdeutig — Reihe mit getrenntem `~`-Abschnitt (wiederverwendetes Kürzel, Notierung unterbrochen); ausgelassen, nicht geraten | 861 |
| nicht im Universum: Umsatz unter 5 Mio $ (keine Klasse) | 29.919 |
| nicht im Universum: Minutendichte unter 80 % (davon Klasse 5-50: 15.855) | 17.708 |
| nicht im Universum: weniger als 250 Vortage (**das ganze Jahr 2016**, dazu junge Börsengänge) | 5.804 |
| nicht im Universum: Cent-Boden / keine Zeile am Stichtag / Maßnahme nah | 923 / 258 / 16 |
| im Universum, aber ohne Überraschung | 1.043 |

Mehrere Linien einer Firma am selben Tag (Aktiengattungen): 586 — die umsatzstärkste genommen, nicht doppelt gezählt.

| Jahr | 5-50 | 50-250 | 250-1000 | ab1000 | vor / im / nach |
|---|---:|---:|---:|---:|---|
| 2017 | 2.240 | 1.640 | 357 | 43 | 1.896 / 261 / 2.123 |
| 2018 | 2.306 | 1.762 | 408 | 66 | 2.020 / 233 / 2.289 |
| 2019 | 2.362 | 1.760 | 435 | 68 | 2.044 / 233 / 2.347 |
| 2020 | 2.265 | 1.819 | 551 | 104 | 2.048 / 160 / 2.531 |
| 2021 | 1.702 | 1.933 | 687 | 137 | 1.947 / 142 / 2.370 |
| 2022 | 2.091 | 1.980 | 785 | 138 | 2.113 / 137 / 2.744 |
| 2023 | 2.372 | 1.962 | 634 | 87 | 2.193 / 133 / 2.729 |
| 2024 | 2.323 | 1.970 | 720 | 113 | 2.240 / 121 / 2.765 |
| 2025 | 1.989 | 2.122 | 968 | 184 | 2.348 / 99 / 2.816 |
| 2026 (bis 15.09.) | 837 | 1.145 | 576 | 144 | 1.194 / 45 / 1.463 |
| **Summe** | **20.487** | **18.093** | **6.121** | **1.084** | 20.043 / 1.564 / 24.177 |

**Hauptklassen (50-250, 250-1000, ab1000): 25.298 Ereignisse von 1.418 Firmen.** Die Klasse ab1000 ist klein, weil sie klein ist (18 bis 78 Mitglieder je
Stichtag), nicht weil Meldungen fehlen: an vier Stichtagen haben 16 von 18, 43 von 49, 30 von 32 und 74 von 78 Mitgliedern eine Meldung im Jahr; über die
Hauptklassen 86 % (2024). Es fehlen die ausländischen Hinterlegungsscheine (BABA, TSM, ASML … — sie reichen kein 8-K ein) und die Firmen mit CIK-Wechsel (§1).
**Verschwundene Firmen:** 1.985 der 25.298 Ereignisse (7,8 %); über alle vier Klassen 6.536 von 45.785 (14,3 %); unter den 4.341 Firmen mit Meldungen 2.375 (54,7 %).
**Ballung:** 1.876 Einstiegstage von 2.690 Handelstagen; je Tag Median 5, oberes Viertel ab 18, Zehntel ab 40, Maximum 114; **42,7 % der Ereignisse liegen in den
vollsten 10 % der Tage.** Je Monat: Feb 4.171 · Mai 3.474 · Apr 3.034 · Okt 2.926 · Aug 2.815 · Jul 2.804 · Nov 2.467 · Jan 1.817 · Mär 673 · Jun 414 · Dez 409 · Sep 294.

## 6. M6 — Auflösung, blind

Ertrag Eröffnung des Einstiegstags → Eröffnung H Handelstage später (Konvention und Abgangsbuchung wie `halte` im Prüfstand; Gegenprobe `pruefe-ertrag.js`:
2.200 Vergleiche, davon 212 mit Reihenende im Haltefenster, 0 Abweichungen), abzüglich des Mittels aller Universumswerte derselben Klasse am selben Tag.
Streuung über **alle** Ereignisse; Standardfehler aus 200 Zufalls-Zuteilungen (fester Startwert; Zufallszahl an Stelle der Überraschung, Zehntel je
Kalenderquartal) und zusätzlich aus der Tagesreihe (Newey-West, Lag H−1); Mindest-Effektgröße = 2,8 × Fehler. **Hauptklassen, 2017–2026, in Pp:**

| H | n | Streuung s | naiv s·√(2/(n/10)) | Fehler Abstand (Zufall / Tagesreihe) | **MDE Abstand** | Fehler oben (Zufall / Tagesreihe) | **MDE oben gegen Klassenmittel** |
|---:|---:|---:|---:|---|---:|---|---:|
| 1 | 25.298 | 4,34 | 0,122 | 0,142 / 0,158 | **0,44** | 0,106 / 0,112 | **0,31** |
| 5 | 25.298 | 6,40 | 0,180 | 0,243 / 0,245 | **0,69** | 0,160 / 0,172 | **0,48** |
| 20 | 25.298 | 10,51 | 0,295 | 0,364 / 0,398 | **1,11** | 0,273 / 0,280 | **0,78** |
| 60 | 25.291 | 19,94 | 0,561 | 0,874 / 0,830 | **2,45** | 0,581 / 0,551 | **1,63** |

(MDE aus dem jeweils größeren der beiden Fehler.) **Kunstfall:** ein eingepflanzter Abstand in Höhe der MDE erreicht t ≥ 2 in 76 / 75 / 77 / 82 % der 200 Läufe (Soll rund 80 %).

**Der Schätzer entscheidet bei 60 Tagen.** „Erst je Tag, dann über die Tage" gibt einem Tag mit einer Meldung dasselbe Gewicht wie einem mit hundert; einzelne
Ausreißer an dünnen Tagen treiben den Fehler. Dieselbe Rechnung, jede Meldung gleich gewichtet (Ereignis-Mittel): MDE Abstand **0,33 / 0,53 / 0,86 / 1,54**, oben
**0,23 / 0,33 / 0,59 / 1,07**. An den Rändern bei 1 % gestutzt (Tagesmittel): Abstand 0,37 / 0,61 / 0,91 / 1,57, oben 0,29 / 0,44 / 0,72 / 1,21. Welcher Schätzer gilt,
gehört in die Registrierung — die Wahl ist blind zu treffen, hier ist sie vorbereitet.

**Grenze (§5.7 c) — Ballung echter Überraschungen.** Korrelation der bereinigten Erträge am selben Einstiegstag: **0,013 / 0,021 / 0,014 / 0,046** (H = 1 / 5 / 20 / 60),
bei im Mittel 13,5 Meldungen je Tag (aus Sicht einer Meldung 37). Lägen alle Meldungen eines Tages im selben Zehntel, wüchse der Fehler um den Faktor
1,20 / 1,33 / 1,23 / 1,63; die härteste Probe — die Zufallszahl hängt am Tag statt an der Meldung — gibt MDE Abstand 0,65 / 0,95 / 1,58 / 3,05 und oben 0,45 / 0,64 / 1,02 / 2,13.
Die Wahrheit liegt dazwischen, näher am unteren Wert (Überraschungen ballen sich nach Branche und Quartal, nicht nach Kalendertag); einen Zuschlag von rund einem
Viertel sollte man einrechnen. Bei der einseitigen Größe fängt der Zufallsfehler den allen Meldern eines Tages gemeinsamen Anteil nicht ein; deshalb steht
daneben der Fehler der Tagesreihe, und der größere gilt.

| Teilmenge (2017–2026) | n | MDE Abstand H 20 / 60 | MDE oben H 20 / 60 | Kosten je Umlauf: Eröffnung (Mitte) |
|---|---:|---|---|---|
| Klasse 50-250 | 18.093 | 1,21 / 2,92 | 0,85 / 1,81 | 0,210 (0,085) |
| Klasse 250-1000 | 6.121 | 1,96 / 3,33 | 1,38 / 2,23 | 0,134 (0,065) |
| Klasse ab1000 | 1.084 | 4,23 / 8,38 | 2,74 / 5,41 | 0,081 (0,045) |
| nachrichtlich Klasse 5-50 | 20.487 | 1,60 / 2,71 | 1,12 / 1,91 | 0,420 (0,157) |
| Hauptklassen 2017–2020 | 9.013 | 1,52 / 4,94 | 1,06 / 3,40 | |
| Hauptklassen 2021–2026 | 16.285 | 1,52 / 2,62 | 1,06 / 1,85 | |

Reihenende im Haltefenster: 6 / 19 / 78 / 325 Ereignisse (H = 1 / 5 / 20 / 60), davon Totalverlust 0 / 1 / 1 / 6.

**Kosten** (`wiki/kosten.md`, gemessen 03.09.2026, Kassa ab 2021): je Umlauf im Mittagsfenster 0,085 / 0,065 / 0,045 Pp (50-250 / 250-1000 / ab1000), zur Eröffnung
das 2,46- / 2,07- / 1,81-Fache = 0,210 / 0,134 / 0,081 Pp. Ein Einstieg zur Eröffnung zahlt die Eröffnungs-Spanne; über die Ereignisse gemittelt 0,19 Pp.

**Erwartung aus der Literatur — kein Ergebnis, aus dem Gedächtnis des Modells, nicht nachgeschlagen (Netz nur zur SEC):** Bernard/Thomas (1989) fanden rund 4 Pp
Abstand zwischen den äußeren Zehnteln über 60 Handelstage, etwa die Hälfte auf der Kaufseite, stärker bei kleinen Firmen. Spätere Arbeiten finden den Effekt mit
Zeitreihen-Überraschung schwächer als mit Analysten-Überraschung (Livnat/Mendenhall 2006) und in liquiden Werten seit den 2000ern stark geschrumpft bis nicht mehr
nachweisbar (Chordia u. a. 2009; Martineau 2022). **Folge:** die alte Größe (4 Pp Abstand, 2 Pp Kaufseite über 60 Tage) läge über der MDE; die halbe Größe
(2 / 1 Pp) liegt darunter — außer mit dem Ereignis-Mittel (1,54 / 1,07).

## 7. Die Tore am Kunstfall (`tore.js`, nur aus den blinden Fehlern gerechnet)

Zweiteilung Entdeckung 2017–2020 / Bestätigung 2021–2026, je t ≥ 2 in erwarteter Richtung, Tagesmittel, H = 60:

| Fall | Abstand: Entdeckung / Bestätigung / beide | Kaufseite: Entdeckung / Bestätigung / beide |
|---|---|---|
| Nullfall | 2,3 % / 2,3 % / 0,05 % | 2,3 % / 2,3 % / 0,05 % |
| eingepflanzt 4 Pp Abstand (2 Pp Kaufseite) | 60,5 % / 98,8 % / **59,8 %** | 36,1 % / 84,9 % / **30,7 %** |
| eingepflanzt 2 Pp (1 Pp) | 19,3 % / 55,4 % / 10,7 % | 12,0 % / 31,4 % / 3,8 % |

**Die Projektregel „Entdeckung ≥ 4 × Bestätigungs-MDE" verlangt hier 10,5 Pp Abstand bzw. 7,4 Pp auf der Kaufseite über 60 Tage (6,1 / 4,3 Pp über 20 Tage) — sie ist
für keinen erwarteten Effekt passierbar (Wahrscheinlichkeit 0,01 % selbst bei 4 Pp).** Dieselbe Form wie am 22.09., 23.09. und 03.10. („Das Tor wurde nie am
erwarteten Fall geprüft"). Die Zweiteilung selbst kostet die meiste Macht: das Entdeckungsfenster ist das dünne (2016 fehlt, 9.013 Ereignisse). Der Entwurf schlägt
deshalb zwei Fassungen vor und lässt die Wahl offen (`VORREGISTRIERUNG-ENTWURF.md` §8).

## 8. Was nicht geht

- **2016 fehlt ganz** (250 Vortage des Prüfstand-Universums bei Panelbeginn 04.01.2016). Eine Messung könnte die Vortage-Regel für diese Studie lockern — das wäre vorab festzulegen.
- **Uhrzeit der Pressemitteilung:** nicht zu haben; die Annahmezeit ist eine obere Schranke. Vorbörslicher und nachbörslicher Handel liegen vor dem Einstieg zur Eröffnung — die erste Reaktion ist nie Teil des Ertrags.
- **Kein Analysten-Konsens.** Die Überraschung ist eine Zeitreihen-Größe aus dem später eingereichten Bericht.
- **Ausländische Werte ohne 8-K** und **203 Firmen mit CIK-Wechsel** fehlen ganz oder teilweise; 861 Meldungen an getrennten Reihen sind ausgelassen.
- **Nur die Kaufseite ist für Wilhelm handelbar.** Der Abstand der Zehntel ist die Diagnose, nicht das Buch.
- **„Schlägt den S&P 500 nach Kosten" beantwortet diese Größe nicht.** Sie misst gegen das Klassenmittel desselben Tages; der Vergleich mit dem Index braucht ein Buch mit Kapitalbindung (Entwurf §11).
- **Minuten- und Stundenbereich bleiben zu.** Der Einstieg ist die Eröffnung; mehr gibt die Annahmezeit nicht her.
