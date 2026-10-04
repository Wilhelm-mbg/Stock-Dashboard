# REGEL — Aktionärsrendite (Netto-Ausschüttungsrendite), Long-only, höchstens 30 Titel, gegen den S&P 500 nach Kosten

Kennung `kandidaten-blind-2026-10/aktionaersrendite/v1`. Blind festgelegt am 04.10.2026: **es wurde keine Kursdatei geöffnet und nichts gerechnet.** Gemessen wird später lokal auf dem
Archiv. Alle Zahlen in dieser Datei stammen aus der Belegdatei (`belege/FAMILIE-aktionaersrendite.md`), aus dem Primärtext von Boudoukh et al. (am 04.10.2026 erneut gelesen, siehe
Teil B) oder aus dem Code der App; **keine einzige stammt aus unseren Daten.** Alles Simulation mit virtuellem Kapital, keine Anlageberatung. Nach dem Siegel wird an Teil A, B, C nichts mehr geändert.

Aufbau wie die bestehenden `REGEL.md`: Teil A Regel, Teil B Konstanten mit Fundstelle, Teil C Lesarten, Teil D Prüfungen. Code: `ziel.js` (`zielfunktion`, `placeboZiel`, `KONFIG`), Tests: `test.js`.

## Teil A — die Regel

### A.1 Der Satz

Am Stichtag werden alle liquiden, nichtfinanziellen US-Aktien mit vollständigen Bilanzdaten nach der **Netto-Ausschüttungsrendite** absteigend gereiht — (Dividenden + Aktienrückkäufe − Neuemissionen der
letzten vier Quartale) geteilt durch die Marktkapitalisierung am Stichtag —; gehalten werden die obersten **min(30, max(5, round(0,1 × Zahl der zulässigen)))** Titel mit Rendite > 0, gleich gewichtet, alle 63 Handelstage
neu sortiert.

### A.2 Universum und Zulässigkeit (je Stichtag, in dieser Reihenfolge; der erste Ausschluss gilt und wird mit Grund festgehalten)

1. **Aktienreihen des Panels** (Referenzreihen wie SPY gehören nicht in `roh`; steht eine dennoch darin, hat sie keine Bilanzdaten und fällt hinaus). Fehlt ein Kürzel in `roh`, ist es nicht zulässig (auch wenn `fundamental` es kennt).
2. **Kursreihe:** mindestens 20 Zeilen bis zum Stichtag (so viele, wie das Umsatzfenster braucht; Lücken mitten in der Reihe sind erlaubt, solange 20 Zeilen bleiben), letzte Zeile höchstens 7 Kalendertage vor dem Stichtag (wie `momentumZiel`), Schluss > 0.
3. **Liquidität:** Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken (`liquide.js`, dieselbe Funktion `Li.zulaessig` wie das Buch), **mindestens 100 zulässige Werte**, sonst `zuWenig` (nicht handeln, nächster Handelstag).
4. **Bilanzdaten sichtbar:** mindestens eine Meldung mit Einreichungsdatum + 1 Kalendertag ≤ Stichtag.
5. **Finanzwerte (SIC 6000–6999) sind nicht zulässig.** Begründung: (a) Boudoukh et al. bauen auf „nonfinancial firms" (Primärtext, Abschnitt A *Data Description*, folgen Fama/French 1992/93) — die Regel folgt der Quelle; (b) Cooper et al. und Fama/French schließen Finanzwerte
   beim Vermögenswachstum aus (Belegdatei §4); (c) Banken und Versicherer schütten nach Kapitalvorschriften aus, REITs und BDCs wegen der Ausschüttungspflicht — sie würden die obersten 30 Plätze füllen, ohne das zu messen, was die Literatur misst. Fehlt `sic` ganz, ist der Wert zulässig und wird nicht gezählt (die Datenaufbereitung muss `sic` liefern, Teil C.4).
6. **Zahlungsströme berechenbar** (Teil C.1): Pflicht-Tag `NetCashProvidedByUsedInFinancingActivities` vorhanden (Beleg, dass der Cashflow-Ausweis da ist — **fehlend heißt nie 0**), Vier-Quartale-Summen berechenbar, jüngster Berichtszeitraum höchstens 460 Tage alt.
7. **Aktienzahl** > 0 vorhanden; **Marktkapitalisierung ≥ 100 Mio $**; **|Netto-Rendite| ≤ 100 %** (Einheiten- und Vorzeichenfehler-Regel, Teil C.2).

`korb.zulaessig` zählt, was alle sieben Stufen besteht (einschließlich Werten mit Rendite ≤ 0). `korb.geprueft` zählt alle Schlüssel von `roh`.

### A.3 Signal

- **Netto-Ausschüttung** = Dividenden + Rückkäufe − Emissionen, je als Vier-Quartale-Summe (TTM) aus dem Cashflow-Ausweis (Boudoukh et al.: Dividenden + Rückkäufe − Emissionen).
- **Netto-Ausschüttungsrendite** = Netto-Ausschüttung / Marktkapitalisierung; **Marktkapitalisierung = Schlusskurs am Stichtag × Aktienzahl** (Boudoukh: „Marktkapitalisierung zum Jahresende" — hier der Stichtag, der Panel-Handelstag vor dem Ausführungstag; gibt es an diesem Tag keine Zeile, die letzte Zeile davon höchstens 7 Tage zurück — **Rückfall vorab**, danach „veraltet").
- **Rang:** Rendite absteigend; **Gleichstand: Kürzel aufsteigend**; nur Rendite **> 0** ist wählbar (Nullzahler und Netto-Emittenten werden nie gekauft — Beleg §3: die negative Seite lässt sich long-only nicht ausspielen).
- **Zielzahl:** `min(30, max(5, round(0,1 × zulässig)))`. Begründung: Boudoukh et al. sortieren in Dezile (Belegdatei §1; die HML-Portfolios sind die oberen/unteren 30 % — Primärtext, Abbildung); das Dezil (0,1) ist dieselbe Zahl, die das Buch der App für Momentum benutzt (`mfhandel.js`
  Z. 92); die 30 ist der Rahmen des Auftrags. Bei den zu erwartenden 300 bis 700 zulässigen Werten ist das Ergebnis praktisch immer **30** (ab 295 zulässigen), das sind dann **rund 4 bis 10 % des Universums** — also eine engere Auswahl als das Dezil der Literatur; das ist ein **Schritt über den Beleg hinaus** (Teil C.8).
  Sind weniger als 5 Werte mit Rendite > 0 da, oder weniger als 100 zulässige: `zuWenig`.

### A.4 Takt und Mechanik

- **Takt: alle 63 Handelstage (vierteljährlich).** Gewählt aus drei Möglichkeiten, die die Belege nennen: Boudoukh et al. sortieren **einmal jährlich Ende Juni** (Belegdatei §1), Cooper et al. wirken ab Januar nach dem Messjahr, der einzige Nachbau der Praxis (Cambria SYLD) sortiert **vierteljährlich**
  (Belegdatei §2). Gründe für 63: (1) es ist die Taktzahl des Simulators — **keine Änderung am Simulator nötig**; (2) 20 Perioden je Fenster gegen 5 bei jährlichem Takt (bei 5 Perioden wäre die Auflösung hoffnungslos); (3) die Vier-Quartale-Summe wird mit jeder Quartalsmeldung frischer — ein Jahrestakt würde mit der Hälfte alter Daten handeln.
  **Nicht gerechnet:** der Jahrestakt mit Juni-Neusortierung. Dafür wäre zu ändern: in `korb.js` die Zählung `naechste = o + halten …` (Z. 262) und `halten = MH.buchKonfig().halten` (Z. 180) auf eine **Kalenderregel** „erster Panel-Handelstag nach dem 30.06." (nicht bloß `halten = 252`, das ergäbe einen Januar-Takt), im Buch der App `Mo.STANDARD.halten` (momentum.js) und `rebalanceFaellig` (`mfhandel.js` Z. 176). Dieser Weg steht hier ausdrücklich nur als Auskunft.
- **Gewichtung/Mechanik: „Gleichgewicht" wie in `korb.js`** (`gleichgewicht`, Auftrag §1.5 von Nr. 78): an jedem Ausführungstag alle Zielwerte auf Depotwert / Zielzahl, Übergewichtete teilverkaufen, Untergewichtete aufstocken, Nicht-mehr-Ziele ganz verkaufen, Verkäufe vor Käufen, 20 Bp auf jedes gehandelte Volumen. Gründe:
  (1) die Literatur sortiert **gleichgewichtet** (Boudoukh et al.: „monthly equal-weighted return", Primärtext; Cooper et al.: gleichgewichtet 8,4 → 19,5 % — Belegdatei §1; SYLD gleichgewichtet, §2); (2) die Mechanik der App (`planeUmschichtung`/`fuehreAus`) stutzt Gewinner nie zurück und gibt jedem Neukauf `Depotwert / Zielzahl` — Wiedervorlage Nr. 85: Plätze bleiben leer, Kleinstpositionen (siehe C.9);
  bei einem Wechsel von bis zu 30 Titeln je Quartal würde das den Abstand verfälschen. **Nicht gerechnet:** die Mechanik der App; kapitalgewichtet (PKW-Art).
- **Kosten:** 20 Basispunkte je Seite (`mfdepot.js` Z. 158, `R.KOSTEN_BP`). Startkapital 100.000. Maßstab SPY mit Ausschüttungen, ohne Kosten (Grundregel).

### A.5 Zeitablauf, Fenster, Startphasen

Wie in der Grundregel (`studien/massstab-rueckblick-2026-10-04/REGEL.md` Teil A und C, `studien/momentum-korb-2026-10-04/REGEL.md` Teil A): **Stichtag = Panel-Handelstag vor dem Ausführungstag**, Zielliste aus den Schlusskursen des Stichtags und den bis dahin sichtbaren Meldungen, Handel zur **Eröffnung des Ausführungstags**, nächster Ausführungstag der **63. Panel-Handelstag danach**;
`zuWenig` ⇒ nicht umschichten, am nächsten Handelstag neu versuchen (solche Tage zählen); Ausschüttungen als Gesamtertrag auf beiden Seiten nach den Lesarten C.3/C.4 der Grundregel (Anspruch nach der Stückzahl über die Nacht vor dem Ex-Tag, Gutschrift nach dem Handel des Tages); Reihenende nach der Hauptregel des Prüfstands
(Totalverlust bei `insolvenz`, `zwangs-delisting`); Ende am Schluss des letzten Tages des Fensters.

- **Fenster A:** erster Ausführungstag **04.01.2017** (Stichtag 03.01.2017) bis Schluss **15.09.2021** (1.183 Handelstage, 18 volle Perioden und eine angebrochene). **Fenster B:** **16.09.2021 bis 15.09.2026** (1.254 Handelstage, 20 Perioden).
- **63 verschobene Starttage** je Fenster: erster Ausführungstag k Panel-Handelstage nach dem ersten Fenstertag, k = 0 … 62, Ende gleich, p. a. über die eigene Dauer. **Die Hauptzahl ist k = 0.**
- **Bilanzdaten-Vorlauf:** für den Stichtag 03.01.2017 braucht die Vier-Quartale-Summe die 10-Q des 3. Quartals 2016 samt Vorjahresquartal 2015 und den 10-K 2015 — die Datenaufbereitung muss also **ab Geschäftsjahr 2015** liefern, nicht erst ab 2016.
- **Einbindung in `korb.js`** (nichts daran geändert): Aufruf `MH.momentumZiel(roh, { nowMs })` in `zielAm` (Z. 107) und `korbZiel` (Z. 95) wird durch `zielfunktion(roh, { nowMs, fundamental })` ersetzt; **ohne Korb 187** (`def.korb = null`) — das Universum bestimmt die Regel selbst, die Korbauswahl nach Umsatz entfällt. Rückgabeform ist dieselbe (`ziel`, `rangfolge[i].umsatz`/`.staerke`, `korb.zulaessig`/`.geprueft`, `zuWenig`).
  `rohMapAm` liefert die Zeilen bis zum Stichtag, Zeilen danach werden in `ziel.js` zusätzlich abgeschnitten. Die Mechanik `'gleich'` ist in `korb.js` bereits vorhanden.

### A.6 Entscheidregel (vorab)

**„Schlägt SPY"** nur, wenn **in beiden Fenstern** gilt: (a) beim Start am ersten Tag (k = 0) Buch > SPY (strikt, Endwerte; Gleichstand = nicht vorn), **und** (b) in **mindestens 45 von 63** Starttagen Buch > SPY, **und** (c) der **Median des Abstands** (Buch − SPY, Pp p. a.) über die 63 Starttage > 0.
Erfüllt das nur ein Fenster: **„gemischt (nur A)" bzw. „gemischt (nur B)"**. Erfüllt keines: **„schlägt nicht"**. Zwischenurteile werden je Fenster mit den drei Zahlen genannt (k = 0 vorn ja/nein, Zahl der Phasen vorn von 63, Median-Abstand).
Die 63 Starttage teilen sich dieselben Jahre; sie sind **kein zweiter Nachweis**, nur Streuung durch die Wahl des Starttags (Wiedervorlage der Grundregel).

### A.7 Placebo-Kontrolle (vorab)

`placeboZiel(roh, opts)` in `ziel.js`: **dieselbe Mechanik** (Gleichgewicht, 63 Tage, 20 Bp), **dasselbe Universum** (alle Werte, die die sieben Zulässigkeitsstufen bestehen, auch mit Rendite ≤ 0), **dieselbe Zielzahl** (Länge der echten Zielliste an diesem Stichtag), Auswahl **zufällig**: Kürzel aufsteigend sortiert, partieller Fisher-Yates-Austausch mit
`mulberry32`, Seed = FNV-1a 32 Bit über `"aktionaersrendite-placebo-v1|JJJJ-MM-TT"` (Stichtag in UTC). Meldet die echte Regel `zuWenig`, meldet das Placebo es auch. Eine Ziehung je Stichtag, **ein** Seed, keine Wiederholung mit anderen Seeds (nicht optimieren).

**Lesart vorab:** Das Placebo misst, was **Mechanik + Universum + Zeitraum** allein ergeben (Gleichgewicht schüttelt Prämien aus der Umschichtung — das „Rebalancing-Bonus"-Problem; 30 gleichgewichtete Titel gegen kapitalgewichteten SPY — ein Größen-/Streuungs-Tilt). Es ist **eine** Ziehung und damit selbst verrauscht; es ist keine Kante, sondern eine Messlatte.
Die Entscheidregel A.6 wird auf das Placebo genauso angewandt. Daraus folgt:
- Regel „schlägt SPY", Placebo „schlägt nicht": der Vorsprung gehört der **Auswahl**, soweit das eine einzelne Ziehung sagen kann.
- Regel „schlägt SPY" **und** Placebo „schlägt SPY": der Vorsprung gehört **Mechanik/Universum/Zeitraum**, nicht der Regel — **kein Befund für die Aktionärsrendite.**
- Regel „schlägt nicht", Placebo irgendwas: keine Aussage über die Regel jenseits der Auflösung (Erwartung unten).
Zusätzlich wird der **Median-Abstand Regel − Placebo** je Fenster berichtet (beschreibend).

### A.8 Erwartung vorab — ehrlich

**Was die Literatur hergibt (nur aus der Belegdatei und dem Primärtext; keine eigenen Daten):**
- Boudoukh et al. (Juli 1984–Dez 2003, **gleichgewichtet, vor Kosten**, nicht Large-Cap): mittlere Monatsrendite der Netto-Ausschüttungs-Gruppen niedrig/mittel/hoch 1,24 / 1,36 / 1,57 % ⇒ **oben gegen unten +0,33 % je Monat, rund 4 % im Jahr** — roh, mit dem von der Studie selbst genannten **Value-/Niedrig-Beta-Anteil**, vor Veröffentlichung (2007). Die Gewichtung dieser Tabelle ist nicht geprüft (Belegdatei §1).
- Nach der Veröffentlichung: McLean/Pontiff 58 % weniger Rendite (Mittel über 97 Merkmale, **nicht für dieses Merkmal belegt**); Großwerte: Fama/French — kein Effekt beim Vermögenswachstum, Cooper et al.: kapitalgewichtet 8,4 statt 19,5 % (rund 43 %). **Reines Rechenbeispiel, keine Messung:** 4 % × 0,42 × 0,43 ≈ 0,7 Pp — und das ist die Spanne **oben gegen unten**, nicht oben gegen den Markt; long-only gegen SPY bleibt davon höchstens ein Teil.
- **Realwelt, hinter dem Index:** Cambria SYLD (100 Titel, Marktkap. > 200 Mio $, gleichgewichtet, vierteljährlich, Gebühr 0,59 %): 10 Jahre bis 31.03.2026 **12,47 % p. a. gegen 14,16 %** beim S&P 500 (**−1,69 Pp p. a.**), seit Auflage 11,93 gegen 13,37 %. Invesco PKW (Rückkauf ≥ 5 %, kapitalgewichtet, Gebühr 0,62 %): 10-J.-CAGR **10,35 % gegen 10,93 %** (−0,58 Pp, Stichtag unbekannt).
  Vor Gebühren liegt SYLD ungefähr gleichauf bis −1,1 Pp, PKW bei etwa 0 — das ist ein [G]-Schluss aus der Differenz (Belegdatei §2/§3), kein Messwert. **SYLD ist kein Large-Cap-Test** (Mid-/Small-Value-Tilt, Energie), PKW ist kapitalgewichtet mit breiterem Universum. Jahreswerte 2017–2026 gegen SPY: **nicht ermittelbar**.
  Der Backtest „S&P 500 Buyback Index 1994–2014: 15,1 gegen 9,1 %" ist nicht handelbar und liegt vor der Veröffentlichung.
- **Was das für die Erwartung heißt:** Der Realwelt-Beleg liegt **hinter** dem Index, nicht davor. Die Belegdatei schätzt die Wahrscheinlichkeit, dass eine solche Long-only-Regel mit ≤ 30 Titeln SPY 2017–2026 nach Kosten schlägt, auf **etwa 20 % (Spanne 10–30 %)** — eigene Schätzung, kein Messwert.

**Erwartete Größe nach Kosten (Spanne, ehrlich): −2 bis +1 Pp p. a. gegen SPY, Mitte etwa −1 Pp** (aus den Realwelt-Zahlen und der Schrumpfung oben; die Kosten dieses Buchs — 20 Bp je Seite auf den Quartalsumschlag — kommen noch dazu, ihre Höhe ist **ungemessen**; die Rangliste ist träge, aber 30 Titel wechseln nicht nur die Ränge, sondern auch die Gewichte zurück auf Gleichstand).

**Sichtbarkeit (die Wand ist die Auflösung):** Der Auftrag nennt für den Abstand je Periode einen Standardfehler von **ca. 3 bis 5 Pp** bei 20 Perioden. Ein Abstand von −1 Pp p. a. sind rund −0,25 Pp je Quartalsperiode, selbst +1 Pp p. a. nur +0,25 — **das ist weniger als ein Zehntel des Standardfehlers.**
Die Frage liegt damit **weit unter der Auflösung**; die ehrliche Antwort auf fast jedes Ergebnis lautet „nicht entscheidbar", nicht „kein Effekt" (CLAUDE.md, MDE vor dem Urteil). Ob die Entscheidregel A.6 beim wahren Effekt 0 bis −1 Pp **zufällig** erfüllt wird, ist **nicht gerechnet**; die Größenordnung (zwei Fenster, im Fenster stark zusammenhängende Starttage) ist eher einige Prozent bis gut ein Zehntel — **eine Schätzung, kein Ergebnis.**
Bei einem Satz „schlägt SPY" ist deshalb der Zufall die nächstliegende Erklärung, nicht die Regel.

**Was als Fehlschlag gilt:** (1) die Entscheidregel A.6 ist nicht erfüllt („schlägt nicht" oder „gemischt") **oder** (2) sie ist erfüllt, das Placebo erfüllt sie auch. Beides ist **kein Beleg gegen die Aktionärsrendite**, sondern „nicht belegt". Der erwartete Ausgang (Mitte −1 Pp, weit unter der Auflösung) ist (1).
Ein **Treffer** wäre nur: Regel erfüllt A.6, Placebo nicht, Median-Abstand in beiden Fenstern deutlich über null — und dann immer noch nur ein **Hinweis**.

**Hauptrisiko:** der **Value-/Niedrig-Beta-Tilt** gegen das Mega-Cap-Wachstum, das den SPY 2017–2026 trug (Belegdatei §3: hohe Ausschüttung korreliert mit niedrigem Beta und hohem Buch/Kurs; Zusatz: Energie/Zyklik wie bei SYLD). Dazu zwei **Datenrisiken** mit eigener Wirkung: (a) die Qualität der SEC-Cashflow-Tags (Belegdatei §4: unvollständig, uneinheitlich benannt, im Projekt **nicht geprüft**) — fehlende Tags werden als 0 behandelt, sobald der Pflicht-Tag da ist, das bevorzugt Firmen mit
lückenhaftem Ausweis nach unten; (b) die Aktienzahl-Basis (C.3).

**Was ein Ergebnis NICHT sagen würde:** nicht, ob die Aktionärsrendite als Anomalie existiert (Long-Short, kapitalgewichtet, Dezile, andere Zeiten); nicht, dass SYLD/PKW „schlecht" sind (anderes Universum, Gebühren); nicht, dass ein Vorsprung handelbar oder **belegt** wäre — „validierte Kante" gehört nur in einen Satz, wenn ein Protokoll der Mühle `bestaetigt` trägt und das Placebo besteht (CLAUDE.md, D2);
kein Urteil über die Tore 1 und 2 der Mühle (Entdeckung ≥ 4 × Bestätigungs-MDE, `delta80` unter der Produkthürde) — diese Studie ist ein Buch-gegen-SPY-Vergleich, **keine Mühle-Messung**, und die Tore würden hier mit hoher Wahrscheinlichkeit reißen (Belegdatei §4). Zwei Fenster, **ein** Parametersatz, ein Zeitraum.

### A.9 Abgrenzung zu verworfenen Familien

**Investition (Mehrfaktor-Lauf, Feld 7):** dort ist „Investition" das **Vermögenswachstum** −100 · (Assets / Assets_Vorjahr − 1) (Cooper/Gulen/Schill) — eine Größe der **Aktivseite** der Bilanz, als eines von sieben Feldern in der Rangkombination, gemessen als Dezil-Spread in Monatsrenditen (netto +0,13 Pp bei MDE 0,73), kein Long-only-Buch gegen SPY.
Die Aktionärsrendite ist ein **Zahlungsstrom der Finanzierungsseite** (Cashflow-Ausweis: Dividenden, Rückkäufe, Emissionen), mit dem **Marktpreis im Nenner**, und wird **allein** gereiht, nicht kombiniert. **Ehrlich:** beide hängen zusammen — Firmen mit hoher Netto-Emission wachsen meist auch bilanziell (Fama/French: Netto-Emission wirkt auch in Großwerten, Vermögenswachstum dort nicht, Belegdatei §1), und der Kauf-Seite-Teil (hohe Rendite) ist ein Wertbild; die Familie ist also **nicht unabhängig** von Investition und Bewertung, nur nicht dieselbe Messung.
**Ergebnis-Drift:** ein **Ereignis** um die Gewinnmeldung (Überraschung SUE, 8-K Punkt 2.02), Haltedauer 60 Handelstage, Eintritt am Meldetag. Hier gibt es **kein Ereignis**: ein langsam laufender Querschnittsrang auf einer Vier-Quartale-Summe, Neusortierung alle 63 Tage, Gewinne und Überraschungen gehen nicht ein. Die einzige Schnittstelle ist die SEC-Datenquelle.
Ausgeschlossen bleiben außerdem Momentum, Gewinn-Momentum und die Mehrfaktor-Rangkombination — hier fließt keine Kursstärke in die Rangfolge ein (nur die Marktkapitalisierung im Nenner).

## Teil B — Konstanten und Fundstellen

| Größe | Wert | Fundstelle / Status |
|---|---|---|
| Netto-Ausschüttung | Dividenden + Rückkäufe − Emissionen, geteilt durch die Marktkapitalisierung zum Jahresende | Boudoukh/Michaely/Richardson/Roberts, J. Finance 62(2), 2007, **Primärtext (NBER w10651) gelesen** — Belegdatei §1 [Q], am 04.10.2026 im Abschnitt *Data Description* erneut bestätigt |
| Universum der Quelle | nichtfinanzielle Firmen (Fama/French 1992/93), Buchwert des Eigenkapitals > 0 | Primärtext, Abschnitt A. **Buchwert > 0 ist NICHT umgesetzt** (kein Tag dafür gewählt) — Abweichung, in C.7 genannt |
| Gewichtung der Quelle | gleichgewichtet („monthly equal-weighted return") | Primärtext, Abbildungsunterschrift; Gewichtung der Dezil-Tabelle in der Belegdatei „nicht geprüft", die Abbildung belegt es für die HML-Portfolios |
| Takt der Quelle | einmal jährlich, Juli t bis Juni t+1, Kennzahl Jahresende t−1 | Belegdatei §1 [Q]; **hier nicht übernommen** (63 Tage, A.4) |
| Dividenden der Quelle | „declared" (Compustat Item 21) — hier **gezahlt** (Cashflow) | Primärtext; Abweichung, in C.7 |
| Rückkäufe der Quelle | Ausgaben für Kauf von Stamm- und Vorzugsaktien (Item 115) (+ Vorzugsaktien-Veränderung); zweite Messung über Treasury-Bestand | Primärtext; hier **nur Cashflow-Tag Stammaktien** (Kette C.1) |
| Emissionen der Quelle | Verkauf von Stammaktien (Cashflow) | Primärtext/Belegdatei §1 |
| Dezil / Anteil | 0,1 | Boudoukh (Dezile) und `mfhandel.js` Z. 92 (`anteil`) |
| Höchstens 30 Positionen | 30 | Auftrag Phase 3 (Rahmen) |
| Mindestzahl Ziel | 5 | `mfhandel.js` Z. 92 (`max(5, …)`) |
| Korbregel | Median-Tagesumsatz ≥ 100.000.000 $ über 20 Balken; mindestens 100 zulässige Werte; Median `sortiert[n >> 1]` | `liquide.js` Z. 32–43 |
| Veraltete Reihe | letzte Zeile > 7 Kalendertage vor `nowMs` | `mfhandel.js` Z. 52, 68 |
| Takt | 63 Handelstage | `MH.buchKonfig().halten` (`mfhandel.js` Z. 29–33) |
| Kosten | 20 Bp je Seite | `mfdepot.js` Z. 158 |
| Mechanik | Gleichgewicht | `korb.js` `gleichgewicht` (Z. 126–163), Auftrag Nr. 78 §1.5 |
| Karenz der Meldung | 1 Kalendertag (Meldung vom Tag d ab Stichtag d+1) | **Festlegung**, nicht aus der Literatur (die Einreichung kann nach Handelsschluss liegen); Belegdatei §4: „filed"-Datum nehmen, nicht Periodenende |
| Höchstalter der Bilanz | 460 Tage Periodenende bis Stichtag | **Festlegung** (Jahr + Meldefrist), keine Literaturzahl |
| Ankerversuche | 2 (jüngster Berichtszeitraum, sonst der davor) | **Festlegung** |
| Toleranz Periodenenden | ±15 Tage | **Festlegung** (52/53-Wochen-Jahre) |
| Mindest-Marktkapitalisierung | 1e8 $ | **Festlegung** (Einheitenfehler-Regel) |
| Höchstbetrag der Rendite | 100 % | **Festlegung** (Einheiten-/Vorzeichenfehler) |
| Mindestlänge der Kursreihe | 20 Zeilen | **Festlegung** (Umsatzfenster) |
| Finanzwerte | SIC 6000–6999 ausgeschlossen | Primärtext (nichtfinanziell) und Belegdatei §4; die genaue SIC-Spanne ist die übliche Fama/French-Abgrenzung **aus dem Gedächtnis — unverifiziert** |
| Fenster / Startphasen | A 04.01.2017–15.09.2021, B 16.09.2021–15.09.2026, 63 Starttage | Auftrag Phase 3, Grundregel |
| Zahl für „vorn" in den Starttagen | ≥ 45 von 63, Median > 0, je Fenster; k = 0 vorn in beiden | Auftrag Phase 3 |
| Placebo | Seed „aktionaersrendite-placebo-v1\|Stichtag", FNV-1a 32 + mulberry32 | **Festlegung**; FNV-1a-Testvektor in `test.js` |

**Unverifiziert / nur aus dem Gedächtnis oder nicht erreicht** (nicht als gesichert ausgeben): Parameter von Pontiff/Woodgate (Belegdatei §1: „nicht gelesen"); Fama/French-NSI-Definition und Spreadzahlen; Daniel/Titman, Titman/Wei/Xie, Ikenberry; Nachbauten Dritter mit Kosten für Large-Cap-Long-only (keiner gefunden); Jahreswerte SYLD/PKW 2017–2026; Stichtag der PKW-Zahl; ob SYLD vor Gebühr gleichauf liegt; die Zahlen aus der Suchzusammenfassung bei SYLD/PKW/McLean–Pontiff
(Belegdatei kennzeichnet sie als Suchzusammenfassung, nicht Primärtext); die Qualität der SEC-Tags im Projekt. Die Netto-Ausschüttungsdefinition, der Takt der Quelle, nichtfinanziell, gleichgewichtet sind aus dem Primärtext gesichert.

## Teil C — Lesarten, Form von `opts.fundamental`, bekannte Mängel

**C.0 Form von `opts.fundamental` (verbindlich; auch im Kopf von `ziel.js`):**

```
fundamental = { KÜRZEL: [ {
    filed:      'JJJJ-MM-TT',          Einreichungsdatum bei der SEC (sub.filed) — NICHT das Periodenende
    periodEnde: 'JJJJ-MM-TT',          Ende der Berichtsperiode (sub.period)
    form:       '10-Q' | '10-K' | '10-Q/A' | '10-K/A',   andere Formen werden ignoriert
    dauer:      1 | 2 | 3 | 4,         Quartale, die die FLUSS-Werte dieser Meldung abdecken (num.qtrs)
    sic:        ganze Zahl, optional   (sub.sic)
    werte:      { SEC-Tag-Name: Zahl } Tag-Namen exakt, ohne Präfix; Dollar bzw. Stück in VOLLEN Einheiten (nicht Tausend, nicht Million)
  }, … ] }
```

- `dauer` ist die Zahl der Quartale, die die **Fluss**-Werte der Meldung abdecken. **In 10-Q stehen Cashflow-Werte kumuliert seit Geschäftsjahresbeginn** (Q1 = 1, Halbjahr = 2, neun Monate = 3; in der Spalte `qtrs` der Financial Statement Data Sets). 10-K: 4. Fehlt `dauer`, gilt 10-K = 4; bei 10-Q wird **nicht geraten** — die Meldung taugt nicht für Flüsse (sie taugt weiter für Aktienzahl und `sic`).
- Die Datenaufbereitung liefert **eine Meldung je (Einreichung, Periodenende)** mit den Werten **der Berichtsperiode selbst**, nicht die Vergleichswerte des Vorjahres darin; Vorjahreswerte kommen aus den **Meldungen des Vorjahres** (die als eigene Einträge in der Liste stehen). Korrigierte Vorjahreswerte aus späteren Meldungen gehen so nicht ein — gewollt, weil sie am Stichtag noch nicht vorlagen.
- **Aktienzahl** `EntityCommonStockSharesOutstanding`: Deckblatt; bei mehreren Aktiengattungen **von der Aufbereitung über alle Gattungen summiert** (sonst fehlt die Hälfte der Marktkapitalisierung, z. B. bei Alphabet). Rückfall: `CommonStockSharesOutstanding`, dann `WeightedAverageNumberOfSharesOutstandingBasic`.
- **Sichtbarkeit:** Eine Meldung gilt am Stichtag nur, wenn `filed` + 1 Kalendertag ≤ `nowMs`. **Duplikate/Korrekturen:** je (Periodenende, Dauer, Tag) gilt die jüngste Einreichung ≤ Stichtag, **die den Tag trägt** (eine 10-K/A ohne den Tag ersetzt nichts).
- **Fehlt ein Kürzel in `fundamental`, oder ist es nicht im Panel:** nicht zulässig. Ohne `opts.fundamental` ist nichts zulässig ⇒ `zuWenig`. ETFs und Referenzreihen (SPY) haben keine Bilanzdaten und sind deshalb nie im Ziel; ein Kürzel nur in `fundamental` ist unsichtbar.

**C.1 Vier-Quartale-Summe und Rückfallketten (vorab).**
- **Anker:** der jüngste sichtbare Berichtszeitraum, der den Pflicht-Tag trägt (bei gleichem Periodenende die längste `dauer`); älter als 460 Tage ⇒ „Bilanz veraltet". Es werden höchstens **zwei Anker** versucht (jüngster, dann der davor).
- **Summe der letzten vier Quartale** (Dauer 4, 10-K): der Wert selbst. **Sonst** (kumulierter 10-Q-Wert der Dauer d): `TTM = Wert(Anker) + Jahreswert des letzten Geschäftsjahres − kumulierter Wert gleicher Dauer im Vorjahr`; der Jahreswert muss ein Periodenende d × 91,25 Tage vor dem Anker haben, der Vorjahreswert 365 Tage davor (je ±15 Tage). Fehlt ein Teil: nicht berechenbar ⇒ nächster Tag der Kette, dann nächster Anker. Das ist die Zeitreihen-Schreibweise von „Summe der letzten vier Quartale" für kumulierte Werte.
- **Ketten (der erste Tag mit berechenbarer Summe zählt, nie addiert):** Dividenden `PaymentsOfDividendsCommonStock` → `PaymentsOfDividends` → `PaymentsOfOrdinaryDividends`; Rückkäufe `PaymentsForRepurchaseOfCommonStock` → `PaymentsForRepurchaseOfEquity`;
  Emissionen `ProceedsFromIssuanceOfCommonStock` → `ProceedsFromIssuanceOrSaleOfEquity` → `StockIssuedDuringPeriodValueNewIssues`. Ist **kein** Tag der Kette im Anker ausgewiesen: Wert **0** (Nicht-Zahler tragen den Tag nicht) — aber nur, weil der Pflicht-Tag den Cashflow-Ausweis bezeugt. Ist ein Tag ausgewiesen, aber die Summe nicht berechenbar, und kein anderer Tag springt ein: der Anker scheitert.
- **Nicht gerechnet:** Optionsausübungen und Mitarbeiteraktien (`ProceedsFromStockOptionsExercised` u. ä.) als Emission — die Quelle zählt „Verkauf von Stammaktien", die Verwässerung durch Aktienvergütung ist damit **unterschätzt** (bei Technologiewerten erheblich; sie lässt deren Netto-Rendite zu hoch erscheinen); Rückkäufe über den Treasury-Bestand (zweite Messung der Quelle).

**C.2 Vorzeichen- und Einheitenfehler (vorab).** *Vorzeichen:* Die Tags sind Zahlungen/Erlöse, positiv. Ein **negativer** Wert (Tag-Vorzeichenfehler oder Rückbuchung) und eine **negative Vier-Quartale-Summe** werden **auf 0 gesetzt** (nicht der Betrag genommen — sonst bekäme ein Fehler den ersten Platz) und in `korb.vorzeichenKorrigiert` gezählt.
*Einheiten:* Marktkapitalisierung < 100 Mio $ ⇒ raus (Verdacht: Aktienzahl in Tausend); |Netto-Rendite| > 100 % ⇒ raus (Verdacht: Zahlen in Tausend/Million, falsche Aktienbasis). Beide mit Grund in `verworfen`, gezählt in `korb.einheitenverdacht`.

**C.3 Aktienbasis (Split-Falle) — offener Punkt der Datenaufbereitung.** `roh` trägt den **bereinigten** Schluss (`bSchluss`); die SEC-Aktienzahl steht **unbereinigt zum Meldetag**. Ein Aktiensplit zwischen Meldetag und Stichtag verfälscht Kurs × Aktienzahl um den Splitfaktor (und bei einem Split **nach** dem Stichtag
trägt `bSchluss` des Panels ihn schon — ein Blick voraus in der Basis, nicht in der Rendite). Die Aufbereitung muss die Aktienzahl auf die Basis des Kurses bringen: Aktienzahl × (`rohSchluss` / `bSchluss`) am Meldetag. Ob `bSchluss` im Panel nur splitbereinigt ist (dann geht es auf), ist **nicht geprüft**.
`ziel.js` fängt nur die groben Fälle ab (Marktkap. < 100 Mio $, |Rendite| > 100 %), **nicht** einen Faktor 2 bis 5. Das ist das größte technische Risiko dieser Regel.

**C.4 `sic`:** Branche aus der jüngsten sichtbaren Meldung, die eine hat. Die Aufbereitung muss sie liefern; fehlt sie, bleibt ein Finanzwert im Universum (nicht gezählt).

**C.5 Tag der Marktkapitalisierung:** Stichtag = Panel-Handelstag vor dem Ausführungstag; Kurs = letzte Zeile ≤ Stichtag (Rückfall bis 7 Tage, sonst „veraltet"), Aktienzahl der jüngsten sichtbaren Meldung. Kein Jahresende wie bei Boudoukh — der Stichtag verschiebt sich je Quartal.
Die Bilanzdaten sind je nach Stichtag 1 bis 6 Monate alt (Meldefristen); am Stichtag Anfang Januar liegt der 10-K noch nicht vor, es zählt der 3. Quartals-Anker.

**C.6 Gleichstand und Randfälle:** Gleiche Rendite ⇒ Kürzel aufsteigend (bei Rendite 0 ohne Wirkung, weil nie gewählt). Die Rangfolge enthält alle Zulässigen, auch Rendite ≤ 0 (Vergleichbarkeit mit `momentumZiel`). Zeilen nach dem Stichtag werden ignoriert. Nicht endliche oder negative Kurse ⇒ raus.

**C.7 Abweichungen von der Quelle (alle benannt):** (1) Takt 63 Tage statt jährlich Juni; (2) Vier-Quartale-Summe statt Geschäftsjahr; (3) Stichtag statt Jahresende; (4) gezahlte statt erklärte Dividenden; (5) Rückkäufe nur aus dem Cashflow-Tag der Stammaktien; (6) Buchwert-des-Eigenkapitals-Bedingung fehlt; (7) Marktkapitalisierung aus Kurs × SEC-Aktienzahl (Quelle: CRSP);
(8) **Dezil gedeckelt auf 30** und **nur obere Seite, Long-only**, nicht gegen die unteren 30 % (Quelle: Long-Short, NYSE-Haltepunkte, Dezile); (9) keine Stutzung der Ränder (Quelle stutzt 2,5 %; hier schließt die Obergrenze 100 % nur grobe Fehler aus).
Das Ergebnis ist deshalb **ein Nachbau im Geist der Quelle**, nicht ihre Nachrechnung.

**C.8 Konzentration:** 30 gleichgewichtete Titel sind rund 4 bis 10 % des Universums; die Quelle zeigt Dezile oder obere 30 %. Je enger der Rang, desto größer der Anteil Rauschen (Ausreißer in der Netto-Rendite, Einmaleffekte wie Sonderausschüttungen, beschleunigte Rückkäufe aus Anleihefinanzierung). Keine Stutzung, keine Glättung über mehrere Quartale: **nicht optimiert**.

**C.9 Bekannte Mechanik-Mängel (Wiedervorlage Nr. 85, `wiki/belegstand.md`):** Die **App-Mechanik** lässt Plätze leer und erzeugt Kleinstpositionen (`planeUmschichtung` hält eine Position von 0,0001 Stück für eine volle, stockt nie auf; bei Momentum im Lauf A-187 in 1.070 von 1.183 Umschichtungen zu wenig Bargeld). Diese Studie nimmt **Gleichgewicht** (A.4), das Gewinner zurückstutzt und Untergewichtete aufstockt —
das **behebt** das Leerlaufen der Plätze; **nicht behoben:** (a) ein Ziel ohne Eröffnungskurs bleibt Bargeld (Anteil geht als Bargeld durch die Periode); (b) Reihenende/Insolvenz-Regel der Grundregel; (c) ein Wert, der **nicht mehr** im Ziel ist, wird in einem Zug ganz verkauft, auch wenn er nur knapp aus dem Rang fällt (Umschlag); (d) das Buch der **App** hat diese Mechanik **nicht** — ein Ergebnis hier sagt nichts über das Buch der App.
Die Zahl der Teilverkäufe/Aufstockungen und die Kosten je Umschichtung stehen im Protokoll von `korb.js`.

**C.10 `zuWenig`-Tage:** werden gezählt und berichtet (Erwartung: einzelne Tage im Januar 2017, solange der Bilanzvorlauf dünn ist — sie sind **kein Fehler**, sondern die Regel, nicht zu handeln). Eine Vorab-Prüfung der Abdeckung (Zahl der Werte mit Bilanzdaten je Stichtag) gehört in den ersten Lauf, **bevor** etwas bewertet wird, und wird mit ihren Zahlen veröffentlicht.

## Teil D — Prüfungen (`test.js`, 163 Prüfungen, grün)

`node studien/kandidaten-blind-2026-10/aktionaersrendite/test.js` — nur Kunstdaten, Sollwerte von Hand gerechnet (Rechenweg im Kommentar). Abgedeckt, je mit Gegenprobe über `opts`-Überschreibung, wo es die Regel zulässt: Konstanten (30, 0,1, Korbregel, Karenz, SIC); **Vier-Quartale-Summe von Hand** (Dauer 1, 2, 3 und 4; 52/53-Wochen-Jahre;
Vorjahr außerhalb der Toleranz); **Rückfallkette** der drei Flüsse und der Aktienzahl, keine Doppelzählung, erster Tag nicht berechenbar ⇒ nächster; Nicht-Zahler = 0; Vorzeichen (negativ ⇒ 0, gezählt); **Rückfall auf den zweiten Anker**; 10-Q ohne `dauer` wird nicht geraten; Pflicht-Tag; veraltete Bilanz; Aktienzahl fehlt/≤ 0; jüngste Aktienzahl;
**kein Blick voraus** (Karenz mit Vortag/Stichtag/nach Stichtag, Gegenprobe `karenzTage: 0` und späterer Stichtag; Korrekturen vor und nach dem Stichtag, Korrektur ohne den Tag; Zeile nach dem Stichtag in der Kursreihe); Marktkapitalisierung mit Rückfall (3 Tage), 7 Tage genau, 8 Tage veraltet, Kurs ≤ 0, Reihe mit 19/20 Zeilen, Lücken in der Reihe;
Umsatzgrenze (genau 100 Mio, knapp darunter); **Finanzwerte** (SIC 5999/6000/6999/7000/fehlend, Gegenprobe); Einheiten (Marktkap. 1e7, Rendite 150 %, 100 % noch erlaubt, Gegenproben); **Universum von 27 Reihen** mit allen Ausschlussgründen einzeln und dem Gesamtbild (Rang, Gleichstand Z1/Z2, Zähler, Reihenfolge der Eingabe egal, ohne `fundamental` ⇒ `zuWenig`, SPY und nur-in-fundamental-Kürzel);
`zuWenig` (zu wenig Zulässige, zu wenig Positive); **Gleichstand an der Zielgrenze** gegen die Eingabereihenfolge; Standardschwelle 99/100; Zielzahl 29/30/30 bei 294/295/400, **Obergrenze 30**, Gegenprobe `maxZiel`; **Placebo** (Form, Zielzahl, nur Zulässige, deterministisch, unabhängig von der Eingabereihenfolge, nicht die Regel-Auswahl, Seed hängt am Stichtag und am Wort, zieht auch Nullzahler und Emittenten,
FNV-1a-Testvektor, eingefrorener `mulberry32`-Wert, bei `zuWenig` ebenfalls `zuWenig`, 30 im großen Universum).
Gegen Ausbau geprüft (Probe am 04.10.2026): Karenz entfernt, Emission nicht abgezogen, Betrag statt Null, Gleichstand nach Eingabereihenfolge, TTM ohne Vorjahr/Jahr, Zeilen nach dem Stichtag nicht abgeschnitten, Placebo nur aus Positiven, Obergrenze 40, Ketten addiert, nur ein Ankerversuch — jede dieser Änderungen färbt mindestens eine Prüfung rot.
**Nicht geprüft (kein Test kann es):** ob die echten SEC-Tags so vorliegen wie in C.0 beschrieben, die Aktienbasis (C.3), die Abdeckung im Archiv. Der Linter des Projekts (`npm test`) war in dieser Sitzung nicht lauffähig (Paket `globals` fehlt); `ziel.js` und `test.js` laufen unter Node 22 ohne Fehler.
