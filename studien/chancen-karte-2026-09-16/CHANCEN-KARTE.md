# Chancen-Karte: Sektoren, die gedrückt sind, während das Kapital woanders im Hype steckt

**Stand:** 16.09.2026, Momentaufnahme (Kurse Bigdata.com „As of September 15, 2026", Nachrichten bis 15.09. 22 Uhr UTC). **Rolle:** Analyse-Chat, Recherche — keine Messung, keine Anlageberatung.
**Quelle aller Zahlen:** [Bigdata.com](https://bigdata.com), abgerufen 16.09.2026; Werkzeug in eckigen Klammern: [MT] market_tearsheet (roh/01), [S04]…[S15] bigdata_search (roh/04–15), [SC] screen_companies (roh/10, 17), [WK] Wirtschaftskalender (roh/16), [UK] Unternehmenskalender, [PT] portfolio_tearsheet (roh/18). Nachrichtenquellen sind über Bigdata.com indexierte öffentliche Medien (Yahoo Finance, Nasdaq, Benzinga, MSN, Ifeng u. a.) mit Dokument-ID in den Rohdateien.

## 1. Kopf

| | |
|---|---|
| Guthaben vorher / nachher | 950,61 → 885,49 Einheiten |
| Verbrauch | **65,12 von 120** (Deckel eingehalten); Kostenbuch: `kostenbuch.md` |
| Anfragen | 21 kostenpflichtige (1 Markt-Tearsheet 16,66; 2 Smart-Suchen 20,31, eine davon leer; 11 Schnell-Suchen 24,17; 3 Screens 0; 2 Kalender ≈ 2,3; 1 find_securities + 1 Portfolio-Grid ≈ 1,4) + 9 kostenlose Guthabenabfragen |
| Preisregel (gemessen) | Kosten hängen an gelieferten Token je Quellklasse: Web-Nachrichten 0,8 je 1.000, Premium-Nachrichten/Podcasts ≈ 8 je 1.000; Tearsheet pauschal ≈ 16,7; Screens 0; Kalender ≈ 1 |
| **Nicht erreichbar** | (a) **Sektor-KGV gegen die eigene Geschichte** — kein Broker-Research im Abo (Zugriffsliste ohne research-Eintrag), keine Punkt-in-Zeit-Bewertungshistorie; nur Einzelzahlen aus Nachrichten. (b) Fondsbestände je Sektor (13F) nicht abgefragt; Flüsse nur aus dem State-Street-Monatsbericht, der Kommunikation, Immobilien, Basiskonsum nicht einzeln nennt. (c) Sentiment nur je Firma (Score −1…+1), kein Sektor-Tearsheet. (d) EPS-Ist/Schätzung kamen im Portfolio-Grid als null; nur die Überraschung ist belegt. (e) Alphabet-Berichtstermin (ID erst spät aufgelöst), Werbemarkt-Wachstum, Konsumkredit-Ausfallraten: keine Treffer. |

**Makro-Lage, in der die Karte steht [S02, S04, S12, S14, WK]:** Seit 28.02.2026 „US-Iran-Krieg", Straße von Hormus nahezu geschlossen; WTI 105,41 $ (+82,8 % YTD), Heizöl +134 % YTD [MT]. 10J-Treasury 5,00 % (höchster Stand seit 2007), 30J 5,36 % [MT, S04]. August-CPI 3,4 %, Kern-PPI 4,6 % [WK, S14]. Fed-Entscheid 16.09. mit Konsens 4,00 % nach 3,75 % — die erste Erhöhung seit 2023, Wahrscheinlichkeit 87–92,5 % [WK, S02, S05]. S&P 500 7.585 (+10,8 % YTD), Forward-KGV ≈ 19,6 (5J-Schnitt 19,9, 10J 19,0–19,5) [S02]. Q2-2026-Gewinne +52 % (FactSet), +34 % ohne Einmaleffekte bei Amazon/Alphabet; nur ~50 % der Firmen mit Gewinnwachstum y/y [S09]. Value schlägt Growth um 19 Pp über 12 Monate [MT]. Aktienrisikoprämie erstmals seit > 20 Jahren negativ (NBC, 01.09.) [S02].

## 2. Die Elfertafel (Phase 1)

Kurs = Select-Sector-SPDR [MT]; Gewinn Q2 2026 = Oppenheimer/FactSet via Nachrichten [S09]; Bewertung = was der Korpus hergab; Stimmung = Nachrichtenton + Sentiment-Score (nur für 18 Werte, [PT]); Flüsse = State Street / FactSet, August 2026 [S11].

| Sektor (ETF) | Kurs YTD / 1J / 1M | Gewinn Q2 y/y | Bewertung (Beleg) | Stimmung | Flüsse Aug. | **Einstufung** |
|---|---|---|---|---|---|---|
| Technologie (XLK) | +27,6 / +34,5 / −3,3 % | zweistellig, Haupttreiber Umsatz; IT-EPS +40 % für 12 M erwartet [S02] | Tech-Multiple ~21 nach 33 im Okt. 2025 [S02]; „S&P 50 % AI-bezogen" | AI-Capex-Zweifel, „AI-Bremsen"-These 14.09. (XLK −2 % am Tag) [S09, S12] | **−6,1 Mrd $** nach Rekord +19 Mrd Juli | **Hype, abkühlend** (Bewertung gedehnt, Flüsse drehen) |
| Gesundheit (XLV) | +8,3 / +22,4 / +0,2 % | **−6,5 %** (einziger Rückgang) | keine Daten | Biotech/AI-Wirkstoff-Erzählung positiv | **+2,2 Mrd $** (55 % Biotech) | **neutral** — Kurs läuft den Gewinnen voraus, nicht gedrückt |
| Finanzen (XLF) | +3,8 / +5,9 / −2,3 % | **+19,4 %**, Marge drittbeste [S07] | ~30 % Abschlag zum Markt (State Street, 03.08.) [S07] | BofA warnt 14.09.: Handel flach, IB-Gebühren −10 %; FY27-EPS-Revision USA nur +3 % [S07] | **−5 Mrd $** (Gewinnmitnahmen) | **neutral** — „hinterher, nicht gedrückt" (KBW-Bankindex +16 % YTD) |
| Zyklischer Konsum (XLY) | **−7,1 / −7,9 / −6,2 %** | zweistellig, aber von Amazon-Einmaleffekt getragen; Einzelhandel gespalten [S04, S09] | Amazon KGV 21 (früher > 50) [S04]; keine Sektorzahl | negativ: Score-Mittel −0,16 (6 Werte) [PT]; Verbraucherstimmung 47,8 [S14] | **Zufluss** | **gedrückt** — zyklisch (Öl, Zinsen, Zölle); Ertragslage gespalten |
| Kommunikation (XLC) | **−3,1 / −4,2 / +1,0 %** | +113 % (Alphabet-Einmaleffekt); operativ Alphabet +24 %, Meta +28 % Umsatz [S06] | 8 von 10 größten Werten Fwd-KGV < 21, Alphabet 17,2 (12.08.) [S06] | negativ: Score-Mittel −0,19, Meta −0,49 [PT]; 81 % der Mitglieder hinter dem S&P [S06] | nicht genannt (Lücke) | **gedrückt** — Bewertung unter Markt bei starken Gewinnen; Capex-Zweifel |
| Industrie (XLI) | +8,9 / +10,9 / **−9,5 %** | zweistellig (Caterpillar +13 % am 04.08.) [S09] | keine Daten | keine eigenen Treffer | Zufluss | **neutral** — jüngste Korrektur ohne Beleg für Ertragsbruch |
| Basiskonsum (XLP) | +7,8 / +5,5 / −2,7 % | zweistellig (9 von 11 Sektoren) [S09] | keine Daten | keine Treffer | nicht genannt | **neutral** (dünne Datenlage) |
| Energie (XLE) | **+47,5 / +49,3 / +6,5 %** | **+147 %** [S09] | keine Zahl; Gewinne folgen dem Ölpreis | „zweite Rally nicht verpassen" (Tortoise, 18.08.); Intraday-Umkehr bei jedem Deal-Hinweis (14.09.) [S12] | **Abfluss** | **Hype** — rohstoffgetrieben, gewinnunterlegt, geopolitisch binär |
| Versorger (XLU) | **−3,2 / −3,6 / −6,8 %**; 6M −12,6 % | +14 % Sektor; 5 von 6 Schwergewichten mit Beat [S13, PT] | Dominion Fwd-KGV 18,0; Avista 14× [S13]; keine Sektorzahl | „Kanarienvogel" (Ned Davis), nur 26 % über 200-Tage-Linie [S05]; Score-Mittel +0,17 [PT] | **Zufluss** | **gedrückt** — zinsgetrieben, Ertragslage intakt |
| Immobilien (XLRE) | +6,7 / +1,8 / −4,9 % | einstellig (einziger Sektor) [S09] | Realty Income 13× AFFO [S08] | zinsempfindlich, sonst nur Einzelwerte | nicht genannt | **neutral** — Zinsopfer, Kurs YTD aber positiv |
| Grundstoffe (XLB) | +11,9 / +11,6 / −3,4 % | zweistellig | keine Daten | „Commodity super cycle", Kupfer +37 % 1J [S12, MT] | Zufluss | **neutral bis leicht Hype** (Rohstoffzyklus) |

Lesart: Die drei gedrückten Sektoren teilen den Zinskanal (10J 5 %) — Versorger als Anleihe-Ersatz, Konsum über Kredit- und Benzinkosten, Kommunikation über die lange Duration der Cashflows [S05, S04, S06]. Das Kapital steckt in Energie (Ölschock) und Technologie/AI-Hardware (18 Einzelaktien-ETFs auf Halbleiter allein im August [S11]).

## 3. Tiefenbohrung (Phase 2)

### 3.1 Versorger — zinsgetrieben gedrückt, Ertragslage intakt, Wachstumsstory angekratzt

**Vermutung:** Der Sektor wird als Anleihe-Ersatz verkauft, obwohl Prognosen und Investitionspläne stehen; die Abwertung ist zyklisch (Zins), nicht strukturell.

**Belege (datiert):**
- XLU −3,2 % YTD gegen S&P +10,8 %; 6M −12,6 % [MT, 15.09.]. Sektor bis Ende Februar > +11 %, seither „fast verschwunden", zweitletzter von 11 [S05, 04.09.]. Verkauf ausgelöst durch heißen PPI/CPI und Zinserhöhungserwartung; „Händler bestrafen den Versorgersektor" [S05, 15.09.; S13 Morningstar 10.09.].
- Ertragslage: PSEG Non-GAAP +10,7 %, Prognose 2026 und 6–8 % Langfristwachstum bestätigt (04.08.); Exelon Umsatz 5,97 Mrd $ > 5,66 Schätzung, 41-Mrd-$-Plan bis 2029 und Jahresprognose bestätigt (30.07.); PPL 23 Mrd $ Capex 2026–29, Rate-Base +10,3 % p. a. [S05, S13]. Gewinnüberraschungen Q2: NEE +5,5 %, SO +11,9 %, CEG +11,4 %, DUK +10,0 % [PT].
- Stimmung/Flüsse: Sentiment-Scores gemischt bis positiv (NEE +0,39, CEG +0,42, EXC +0,33; DUK −0,25) [PT]; **Nettozuflüsse** in Versorger-ETFs im August — Rotation in Defensive [S11]. Konsens-Kursziele 13–54 % über Kurs [PT].

**Gegenbelege:**
- **Gewinnwachstum flacht ab:** Konsens S&P-500-Versorger Q2 +14 % → Q3 +5,9 % → Q4 +12 % → einstellig in Q1–Q3 2027; Firmen senken Rechenzentrums-Pipelines (Exelon 43 → 36 GW) und vereinbaren niedrigere Eigenkapitalrenditen [S13 Ifeng/CFRA 04.09.; S05].
- **Finanzierung teurer:** Bloomberg Intelligence (14.09.): historisch hohes Capex schuldenfinanziert, Kreditkennzahlen geschwächt, 5 % Zinsen verschärfen es; Gasturbinen +195 % seit 2019; Kosten wandern in die Stromrechnung → politischer Widerstand [S13].
- Vistra Q2-Überraschung −52,8 % [PT]; Ned Davis: Versorger-Top ging 21 von 30 Bullenmarkt-Tops seit 1930 voraus, danach im Schnitt −29 % — die Schwäche kann Warnsignal statt Chance sein [S05].

**Was die Vermutung widerlegt:** (1) Rechenzentrums-Verträge werden storniert oder Pipelines weiter gekürzt (nächste Prüfung: NEE 27.10., SO 29.10., EXC 03.11., VST 05.11., DUK/CEG 06.11. [UK]); (2) Regulierer senken ROE breit; (3) 30J-Rendite über 5,5 % (NBC-Schwelle) — dann ist der Zinskanal kein Zyklus, sondern Regime.

**Katalysatoren mit Datum [WK, UK]:** Fed 16.09. (Konsens 4,00 %) mit Projektionen und Pressekonferenz; Kern-PCE 30.09.; Payrolls 02.10.; FOMC-Protokoll 07.10.; CPI 14.10.; Kern-PPI 15.10.; Fed 28.10.; Zwischenwahlen 03.11. (aus Nachrichten); Berichte NEE 27.10., SO 29.10., EXC 03.11., VST 05.11., DUK/CEG 06.11.

**Tragende liquide Werte [SC, Tagesumsatz Kurs×Volumen, alle ≥ 175 Mio $]:** NEE (2CB4C9, ≈ 930 Mio $), CEG (HTA3J9, ≈ 760), VST (D64EDF, ≈ 680), DUK (DB5CA5, ≈ 525), XEL (1151F4, ≈ 490), SO (147C38, ≈ 440), PCG (652E62, ≈ 415), AEP (D9B1C9, ≈ 385), WEC (343996, ≈ 325), D (977A1E, ≈ 285), SRE (B642E8, ≈ 260), PEG (B560AF, ≈ 250), ETR (6E7060, ≈ 230), EXC (B303A6, ≈ 230), ED (97AAF6, ≈ 175). Zwei Gruppen: regulierte (Beta 0,26–0,64) und Erzeuger CEG/VST (Beta 1,1–1,4).

**Anschlussfrage für die Maschine:** Relativrendite eines kapitalgewichteten Versorger-Korbs gegen das Universum in Fenstern nach *Zinsschocks* (10J-Rendite +50 Bp in 3 Monaten) über 60/120/250 Handelstage, 2016–2026 in Jahresscheiben, getrennt reguliert vs. Erzeuger; MDE vorab ausweisen; Placebo: Korb mit zufällig gewählten Low-Beta-Werten anderer Sektoren.

### 3.2 Zyklischer Konsum — Ölschock und Zinsen drücken, Ertragslage gespalten

**Vermutung:** Der schlechteste Sektor 2026 leidet zyklisch (Benzin, Kreditkosten, Zölle); die Kapitalisierung wird von Amazon/Tesla dominiert, der Sektor ist zweigeteilt — Plattformen stark, stationärer Einzelhandel und Freizeit schwach.

**Belege:**
- XLY −7,1 % YTD, −7,9 % 1J, schlechtester Sektor [MT]. Ursache benannt: Ölpreis durch Iran-Krieg, Zölle; Konsumenten kürzen zuerst Diskretionäres; Sektor im Juli/August −5 % [S04, 25.08.]. Zacks (15.09.): drei Zinskanäle — Kreditkarten/Hypotheken, Unternehmensfinanzierung (HD, TSLA), Bewertungskompression bei 10J 5,025 % [S04].
- Verbraucher: Uni Michigan 47,8 (zweitniedrigster Wert je), 1J-Inflationserwartung 4,6 % (Februar 3,4 %), Benzin > 4 $ Rekord für September [S14, 11.09.]. Circana: August-Umsatz +0,8 % nominal, Stück −1,7 % [S14].
- Ertragslage: 5 von 6 Schwergewichten mit Beat (HD +4,0 %, BKNG +4,5 %, TJX +2,5 %, MCD +1,8 %; Amazon +216 % durch Einmaleffekt); Tesla −34 % [PT]. Amazon Q2 Umsatz +20 %, AWS +37 %, KGV auf 21 gefallen [S04]. Bank of America: Haushaltsfinanzen solide, mehr Karten voll getilgt, kein Sparabbau [S14].
- Stimmung negativ (Score-Mittel −0,16; MCD −0,33 DOWN) [PT]; Kursziele 20–40 % über Kurs [PT]; **Zuflüsse** im August [S11].

**Gegenbelege:**
- Foot-Locker-Mutter senkt Ausblick, Deckers −34 % vom Hoch bei Margendruck durch Zölle [S04]; Walmart-CFO: 4-$-Benzin wirkt psychologisch, Wachstum nur noch volumen- statt preisgetrieben [S14]. Conference-Board-Erwartungen 68,2 — unter der Rezessionsschwelle [S14].
- Der Sektorgewinn ist eine Amazon-Zahl: ohne Einmaleffekt ist die Breite unklar; nur ~50 % aller S&P-Firmen wuchsen im Q2 y/y [S09]. Wenn der Konsument bricht, ist „zyklisch" die falsche Diagnose.
- Widersprüchliche Datenquelle: RTTNews meldet 55,4 statt 47,8 für die Michigan-Stimmung [S14] — Datierung fraglich, ausgewiesen.

**Was die Vermutung widerlegt:** Einzelhandelsumsatz August (16.09., vor der Fed) negativ real; Prognosesenkungen bei HD (17.11.), TJX (18.11.), MCD (04.11.); Kreditausfallraten steigend (im Korpus nicht gefunden — Lücke); Öl bleibt > 100 $ bis in die Weihnachtssaison.

**Katalysatoren [WK, UK, S14]:** 16.09. Einzelhandelsumsatz August + Fed; 30.09. Kern-PCE; 02.10. Payrolls; 14.10. CPI; 21.10. TSLA; 27.10. BKNG; 28.10. Fed; 29.10. AMZN; 03.11. Zwischenwahlen; 04.11. MCD; 17.11. HD; 18.11. TJX; laufend: Hormus-Verhandlungen (Oman-Treffen verschoben, 14.09. [S12]).

**Tragende liquide Werte [SC]:** AMZN (0157B1, ≈ 8.890 Mio $), TSLA (DD3BB1, ≈ 10.770), HD (ACDF88, ≈ 1.370), BKNG (034B61, ≈ 1.370), TJX (40B903, ≈ 1.350), MCD (954E30, ≈ 1.200), LOW (76E80F, ≈ 795), SBUX (3CBA2A, ≈ 650), GM (1BC12C, ≈ 535), CVNA (A72AEF, ≈ 530), ORLY (6E1E61, ≈ 530), MAR (385DD4, ≈ 525), ABNB (09E31A, ≈ 410), ROST (8C6C1B, ≈ 400), HLT (66E04A, ≈ 395).

**Anschlussfrage für die Maschine:** (a) Gleichgewichteter vs. kapitalgewichteter Sektorkorb 2016–2026 — wie viel der Sektorbewegung ist Amazon/Tesla? (b) Rendite des gleichgewichteten Korbs über 250 Tage nach Tiefs der Michigan-Stimmung (< 55; Fenster Juni 2022) und in Ölschock-Fenstern (H1 2022) gegen das Universum; Placebo mit kursloser Bedingung; MDE vorab.

### 3.3 Kommunikation — billig bei starken Gewinnen, weil der Markt die AI-Capex-Rendite bezweifelt

**Vermutung:** Der Sektor ist relativ zum Markt unterbewertet (Fwd-KGV < 21 bei 8 der 10 größten Werte, Alphabet 17,2) bei operativem Wachstum von 24–28 %; der Abschlag ist ein Capex-Abschlag (zyklisch/verhaltensgetrieben), kein Bruch des Werbemodells.

**Belege:**
- XLC −3,1 % YTD, −4,2 % 1J [MT]; 81 % der Mitglieder hinter dem S&P; Alphabet vier Verlustmonate in Folge trotz Q2-Umsatz +24 % [S06, 06.09.]. Meta YTD flach gegen Nasdaq 100 +15 %, vier Fehlausbrüche [S15].
- Bewertung: 8 von 10 größten Positionen des Vanguard-Kommunikations-ETF mit Fwd-KGV < 21 (S&P 20,6), Alphabet 17,2 [S06, 12.08.]. Analysten-Kursziele implizieren 24 % Potenzial — höchster Wert aller Sektoren [S04, 17.08.].
- Ertragslage: Meta Umsatz +28 % (60,8 Mrd $), Alphabet Umsatz +24 % (119,8 Mrd $), Netflix +13 %; Q2-Beats bei NFLX, TMUS (+15,4 %), DIS (+10,8 %), CMCSA (+7,2 %), VZ [S06, PT].
- Überhänge kleiner: Meta 18-Mrd-$-Vergleich (26.08.) statt bis zu 1,4 Bio $ Risiko; Alphabet-Kartellurteil ohne Chrome-Abspaltung; JPMorgan-Hochstufung Meta (15.09.), Morgan Stanley: neue Produkte > 10 $ EPS [S15].

**Gegenbelege:**
- **Capex frisst den Cashflow:** Alphabet Prognose 195–205 Mrd $ (Juli angehoben), Q2-FCF −5,86 Mrd $, Schulden 46,5 → 98,2 Mrd $, Rückkauf ausgesetzt; Meta 130–145 Mrd $ (2025: 72,2), EPS-Miss −14 % durch Infrastruktur/Recht; die vier Hyperscaler ≈ 760 Mrd $ (+80 %) [S15, S06, PT].
- Sentiment am negativsten aller 18 Werte: Meta −0,49 DOWN; Sektormittel −0,19 [PT]. Netflix: Wachstum verlangsamt (Q3-Prognose +11,7 %), FCF 1,5 nach 2,3 Mrd $ [S06].
- Langfristrisiko: AI-Agenten könnten das Werbemodell umgehen (JPMorgan) [S15]. Der Sektorgewinn +113 % ist Einmaleffekt (98 Mrd $ Beteiligungsgewinne bei Alphabet) [S06, S09].
- Zinsdauer: der Sektor ist ein „No-Hike"-Gewinner — bei weiteren Erhöhungen bleibt der Abschlag [S06].

**Was die Vermutung widerlegt:** Werbeumsatzwachstum unter 15 % bei gleichzeitig steigendem Capex (META 28.10., Alphabet-Termin nicht erhoben); weitere Capex-Anhebungen ohne Backlog-Wachstum (Alphabet Cloud-Backlog 460 Mrd $ als Messlatte); Multiple-Kompression trotz Beats über zwei weitere Quartale.

**Katalysatoren [WK, UK]:** Fed 16.09./28.10.; NFLX 20.10.; VZ 20.10.; TMUS/CMCSA 22.10.; META 28.10.; DIS 11.11.; Alphabet Q3 (Termin nicht erhoben — Lücke).

**Tragende liquide Werte [SC, find_securities]:** Alphabet (4A6F00; bei Bigdata.com als „Technology" geführt), META (12E454, ≈ 12.470 Mio $), NFLX (ECD263, ≈ 2.145), T (251988, ≈ 975), VZ (8A8E41, ≈ 960), DIS (6CGTFN, ≈ 900), RDDT (A905D3, ≈ 755), TMUS (57DDB9, ≈ 650), CMCSA (C83B88, ≈ 640), DASH (CF4517, ≈ 625), WBD (ADF092, ≈ 470), ASTS (D82E83, ≈ 420), FOXA (7BFF81, ≈ 310), LYV (9C25FF, ≈ 305), FWONK (B803B1, ≈ 180). Achtung Klassifikation: Bigdata.com-Screen ≠ GICS (Alphabet fehlt, DoorDash/Reddit enthalten).

**Anschlussfrage für die Maschine:** Bedingung „Sektor-Relativstärke 12 Monate < −10 Pp gegen S&P bei gleichzeitig positiver Gewinnrevision" — Rendite über 120/250 Tage 2016–2026 je Sektor (nicht nur Kommunikation), Jahresscheiben, MDE vorab; ergänzend Capex/Umsatz-Quartil als Bedingung auf Einzelwert-Ebene (Panel), Placebo mit kursloser Bedingung.

## 4. Was gegen die ganze Idee spricht

1. **Sektor-Rotation als Strategie ist schwach belegt.** Unsere eigene Maschine hat 2026 bei 3.372 Signal-Tests keinen Einstieg bestätigt und Sektorbedingungen nie als tragende Kante gefunden; die Auflösungswand (nötige Handelstage) gilt auch für Sektorkörbe. Was hier steht, sind Nachrichten und Konsenszahlen — genau die Quellen, die im Kurs schon stecken.
2. **„Unterbewertet" bleibt oft jahrelang unterbewertet.** Der Finanzsektor handelt laut State Street mit 30 % Abschlag *und* hat trotzdem Abflüsse [S07, S11]; Kommunikation war schon im August „billig" und ist seither weiter gefallen. Ein Abschlag ist kein Datum.
3. **Die Momentaufnahme hat keinen Rückblick.** Bigdata.com liefert keine Punkt-in-Zeit-Historie der Sektorbewertungen; „gegen die eigene Geschichte" konnte in dieser Karte nur über verstreute Einzelzahlen (Amazon KGV 21 statt > 50, Tech 21 statt 33) belegt werden. Die Elfertafel misst Kurs, Gewinn Q2 und einen Monat Flüsse — nicht Bewertungsniveaus.
4. **Der Zinskanal ist kein Zyklus, wenn er Regime ist.** Alle drei gedrückten Sektoren hängen an der 10J-Rendite; steigt sie weiter (Warsh hebt, Kern-PPI 4,6 %), sind sie zu Recht gedrückt. Der Ned-Davis-Befund (Versorger-Top vor Markt-Top in 21 von 30 Fällen) liest dieselben Daten als Warnung [S05].
5. **Die Gewinnzahlen sind verzerrt.** +52 % Indexgewinn, davon ein großer Teil Beteiligungs-Aufwertungen (Alphabet 98 Mrd $, SpaceX-Marks) [S09]; nur ~50 % der Firmen wuchsen; CAPE auf einem Niveau, das nur 1929 und 2000 erreicht wurde [S09]. „Ertragslage intakt" ist eine Aussage über Prognosen, nicht über Cashflows.
6. **Stichprobe und Quelle.** 18 Sentiment-Scores, ein Fluss-Monat, elf Schnell-Suchen über öffentliche Nachrichten; Broker-Research fehlt im Abo, 7 der 11 Finanz-Treffer betrafen chinesische Banken. Eine zweite Momentaufnahme in vier Wochen könnte anders aussehen.

## 5. Für den Wiki-Leser

Das ist eine Recherche-Karte mit Stand vom 16.09.2026 — kein Handelssignal, keine Beratung, keine Empfehlung. Sie sagt, *wo* das Kapital im September 2026 steckte (Energie, AI-Hardware) und *welche* drei Sektoren mit intakten Prognosen gedrückt waren (Versorger, Zyklischer Konsum, Kommunikation), *warum* die Nachrichten das so erklären (Zinsen, Öl, Capex) und *was* es widerlegen würde. Handelbar wird daraus nur, was die Maschine danach misst: die Anschlussfragen in Abschnitt 3 sind so formuliert, dass sie am Querschnitts-Prüfstand (Tagestafel 2016–2026, Jahresscheiben, MDE, Placebo) geprüft werden können. Bis dahin ist jede Zahl hier eine datierte Behauptung Dritter, abgelegt mit Dokument-ID unter `roh/`.
