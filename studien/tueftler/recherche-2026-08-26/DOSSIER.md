# Literatur-Dossier: Übernacht-Renditen und Schlussauktions-Effekte

**Erstellt am 26.08.2026 (nächtliche Literatur-Recherche), Bezug: Vorregistrierung
`glockendruck-nacht` (Schlussdruck `S = (Schluss−Tief)/(Hoch−Tief)`, unterstes Quintil,
long über Nacht).** Werkzeuge: Firecrawl-Papiersuche (arXiv-Index) und Websuche;
18 von 25 erlaubten Abfragen verbraucht. Reine Literatur — hier wurde nichts gemessen.

Quellenangaben nennen Autoren, Jahr und wo der Beleg gefunden wurde (Journal-Seite,
SSRN, arXiv-Volltext, Sekundärzitat). Wo eine Behauptung nur aus einer Abstract- oder
Snippet-Ebene stammt, steht das dabei. Zwei Suchen liefen leer — auch das steht unten.

---

## (a) Mehrfach unabhängig belegt

### 1. Die US-Aktienprämie entsteht (fast) vollständig über Nacht

Der am breitesten replizierte Befund des Themenfelds, seit ~2008 bekannt:

- **Cooper, Cliff & Gulen (2008)**, „Return Differences between Trading and Non-Trading
  Hours: Like Night and Day" (SSRN 1004081, Abstract gelesen): S&P-500-Daten 1993–2003,
  die Prämie liegt vollständig im Nachtfenster (Schluss→Eröffnung); Tagesrenditen nahe
  null bis negativ. Gilt laut Abstract für Einzelaktien, Indizes und Futures.
- **Kelly & Clark (2011)**, Journal of Asset Management: dasselbe 1999–2006 auf
  Index-ETFs (zitiert im Volltext von Glasserman et al. 2025).
- **Lou, Polk & Skouras (2019)**, Journal of Financial Economics 134: „roughly 60 % of
  the equity premium is earned overnight"; bei den größten Aktien im Wesentlichen die
  gesamte Prämie (Volltext-Auszüge der Arbeitsfassung, fmg.ac.uk/LSE).
- **Glasserman, Krstovski, Laliberte & Mamaysky (2025)**, arXiv:2507.04481 (Volltext
  gelesen): S&P-500-Werte seit 2000, Differenz Übernacht minus Innertags im Mittel
  **2,75 Bp pro Tag ≈ 7,2 % p. a.** Dividenden werden dem Nachtbein zugerechnet.
- **Knuteson (2020)**, arXiv:2010.01727 (Volltext gelesen): dasselbe Muster in 21
  Indizes weltweit über drei Jahrzehnte, robust gegen Datenanbieter und gegen die Wahl
  „Preis kurz nach der Eröffnung statt offizieller Eröffnungskurs". Ausnahme: China.
- Weitere unabhängige Replikationen laut Knutesons Referenzliste: Lachance (2015, 2020,
  Journal of Financial Markets), Qiao & Dam (2020, Journal of Financial Markets),
  Branch & Ma (2012).

**Ist es nach Publikation verschwunden? Teilweise, und genau im relevanten Markt.**
Knuteson (2020, Fußnote 17, Volltext): in den beiden US-Indizes (S&P 500, NASDAQ)
stoppte die Divergenz **um 2008** — kurz nach der ersten Publikation; international
lief sie weiter. Quantpedia (Websuche, „Lunch Effect"-Seite): Nacht- und Tagessitzung
sind in den letzten Jahren konvergiert, der Abstand „not statistically significant
anymore". Die Financial Times führte 2024 einen Artikel „Dissecting the death of
overnight drift" (nur Titel/Anriss gesehen, Paywall). Achtung: Glasserman et al. (2025)
messen auf S&P-500-**Einzelwerten** weiterhin 2,75 Bp/Tag seit 2000 — Index- und
Einzelwert-Befund gehen hier auseinander; auf Indexebene tot, im Querschnitt nicht klar.

### 2. Preisabweichungen der Schlussauktion kehren über Nacht um

**Bogousslavsky & Muravyev (2023)**, „Who trades at the close?", Journal of Financial
Markets (Abstract + lange Arbeitspapier-Auszüge, sciencedirect/aeaweb/squarespace):

- Schlussauktionsvolumen wuchs von **3,1 % (2010) auf 7,5 % (2018)** des Tagesvolumens,
  getrieben von Indexierung/ETFs.
- Der Auktionspreis weicht fast immer vom 16:00-Mittelkurs ab, im Mittel aber nur
  **8,1 Bp** (|Abweichung|) — kaum mehr als die halbe Spanne (7,6 Bp); in 1 % der Fälle
  > 63 Bp.
- **Die Abweichung kehrt über Nacht praktisch vollständig um** (85–110 % je nach
  Größenklasse), etwa zur Hälfte sofort nach der Auktion — konsistent mit uninformiertem
  Preisdruck und unvollkommener Liquiditätsbereitstellung; der Rest „could compensate
  liquidity providers for bearing overnight risk". Zum Vergleich: von der Bewegung der
  letzten fünf Handelsminuten kehren nur 19 % um — der 16:00-Mittelkurs ist weitgehend
  effizient, die Auktion nicht.
- Paradebeispiel für die Artefakt-Falle: dass Put-Call-Paritätsverletzungen den
  Folgetag „prognostizieren", erklären die Autoren **vollständig** durch die
  Desynchronisation von Optionsschluss (16:00) und Auktionspreis plus deren
  Übernacht-Umkehr.

Flankierend: „Vestigial Tails? Floor Brokers at the Close" (Management Science, Abstract):
Auktions-Preisänderungen kehren an der NYSE häufiger um als an der Nasdaq — die Umkehr
ist mechanismus-, nicht firmenspezifisch.

### 3. „Tug of War": Fortsetzung im eigenen Fenster, Umkehr zwischen den Fenstern

**Lou, Polk & Skouras (2019, JFE)**: Aktien mit hohen Übernachtrenditen des letzten
Monats haben im Folgemonat hohe Übernacht- **und niedrige Innertags**renditen
(Übernacht-Alpha 3,47 %/Monat, t = 16,8; Innertags-Alpha −3,02 %, t = −9,7), spiegelbildlich
für Innertags-Gewinner; die Muster halten bis zu 60 Monate. Momentum-, Industrie-Momentum-
und SUE-Prämien entstehen **über Nacht**, Size/Value/Profitabilität/Beta/IVOL usw.
**innertags**. Glasserman et al. (2025) finden dieselbe Struktur auf Jahresebene
(Korrelationen ±0,26–0,29, Tabelle 1) und erklären sie zu großen Teilen über
News-Exposures.

**Direkt einschlägig für Zweig N/T:** Lou/Polk/Skouras zerlegen auch die
Kurzfrist-Umkehr (STR): das Umkehr-Alpha sitzt im **Nachtbein** (Übernacht +0,93 %/Monat,
t = 4,28; innertags **−1,05 %**, t = −3,25). Ein Signal „gestern gedrängt verkauft →
long" sollte der Literatur zufolge also genau dort zahlen, wo Zweig N misst — und im
Tagbein eher verlieren.

### 4. Hohe Übernachtrenditen können ein Artefakt der überhöhten Eröffnung sein

**Berkman, Koch, Tuttle & Zhang (2012)**, JFQA 47 (Abstract, ideas.repec + Cambridge):
starke positive Übernachtrenditen mit anschließender Tagesumkehr, **getrieben von einer
Eröffnung, die relativ zu den Innertagskursen zu hoch ist**; konzentriert bei Aktien mit
frischer Retail-Aufmerksamkeit, schwer bewertbaren und arbitragekostspieligen Titeln.
Die impliziten Zusatzkosten für Käufer nahe der Eröffnung übersteigen dort regelmäßig
die halbe effektive Spanne. Bestätigt von **Aboody, Even-Tov, Lehavy & Trueman (2018)**,
JFQA 53 (zitiert bei Glasserman et al.). Klassischer Unterbau: **Amihud & Mendelson
(1987)** und **Stoll & Whaley (1990)** — Eröffnungskurse sind volatiler/lauter als
Schlusskurse, mit anschließenden kleinen Umkehrbewegungen (Sekundärzitate, u. a.
Chelley-Steeley 2005, Schwert FAJ 1990).

## (b) Was einzelne Studien behaupten

- **Boyarchenko, Larsen & Whelan (2023)**, „The Overnight Drift", Review of Financial
  Studies 36 (Abstract/SSRN + Semantic-Scholar-Snippet): In S&P-500-Futures konzentriert
  sich die Prämie in einem Ein-Stunden-Fenster **2–3 Uhr ET** (europäische Öffnung).
  Erklärung: Inventar-Management der Intermediäre — nach Verkaufstagen halten Händler
  Lager über Nacht und werden dafür entlohnt. **Asymmetrie: Markt-Ausverkäufe erzeugen
  robuste positive Übernacht-Umkehr, nach Kauftagen nicht.** Das ist die dem
  Kandidaten-Mechanismus nächste publizierte These (referiertes Top-Journal, aber eine
  Studie, Futures-Ebene, nicht Einzelaktien-Querschnitt).
- **Bondarenko & Muravyev (2023)**, JFQA 58, „Market return around the clock": erklärt
  die hohen US-Nachtrenditen als Auflösung von Unsicherheit bei der europäischen
  Markteröffnung (zitiert im Volltext von Glasserman et al.).
- **Bogousslavsky (2021)**, JFE 141: kapitalbeschränkte Arbitrageure halten ungern über
  Nacht → Fehlbewertungen am Tagesschluss (zitiert bei Glasserman et al.). Stützt die
  Idee einer Prämie für Übernacht-Lagerhaltung.
- **Akbas, Boehmer, Jiang & Koch (2022)**, JFE 145: Aktien mit häufigen
  Nacht→Tag-Umkehrungen haben höhere künftige Renditen; Deutung: Tages-Arbitrageure
  gleichen den nächtlichen Einfluss optimistischer Noise-Trader aus (zitiert bei
  Glasserman et al.).
- **Glasserman et al. (2025)**, arXiv (Volltext): Nachrichtenfluss (2,4 Mio Artikel)
  erklärt einen Großteil der Über/Intra-Differenz; entfernt man die news-selektierten
  Aktien, ist der Rest insignifikant. Wörtlich zur Handelbarkeit: „Because of the
  extreme turnover required to trade the over-intra effect, our findings fall short of
  being a viable trading strategy."
- **Knuteson (2020, 2022)**, arXiv: hält alle harmlosen Erklärungen für widerlegt und
  führt das Muster auf systematische tägliche Portfolio-Expansion/-Kontraktion großer
  marktneutraler Quant-Firmen zurück (Manipulationsthese). Nicht referiert, Autor
  vertritt die These allein; als Warnung wertvoll: **der Effekt hat keinen konsentierten
  Grund.**
- **Pagonidis (2013/2014)**, „The IBS Effect: (Daily) Mean Reversion in Equity (Index)
  ETFs" (NAAIM-Working-Paper, via ResearchGate/Kinlay/QuantSeeker): **Internal Bar
  Strength, IBS = (Schluss−Tief)/(Hoch−Tief) — exakt das Schlussdruck-Maß des
  Kandidaten** — prognostiziert bei US-Index-ETFs die Folgetagsrendite: niedriges IBS →
  hohe Folgerendite, seit den frühen 1990ern konsistent (Kinlay 2019 bestätigt
  qualitativ: „a powerful mean-reversion indicator for equity products traded at daily
  frequencies"). Einschränkungen: Working-Paper/Praktiker-Ebene, **Index-ETFs statt
  Einzelaktien-Querschnitt**, Ziel ist die Close-zu-Close-Folgerendite, **nicht das
  isolierte Nachtbein**, und Kostenangaben sind dünn. Eine arXiv-Anwendung auf
  Länder-ETFs existiert (arXiv:2306.12434, Abstract). Praktiker-Seiten (Quantified
  Strategies, Alvarez) berichten übereinstimmend: als Alleinsignal auf Einzelaktien
  schwach, als Filter nützlich, am besten in volatilen Phasen — anekdotisch, ohne
  saubere Inferenz.

**Leer gelaufene Suchen:** (1) Eine gezielte Suche nach referierter Querschnittsliteratur
zu „close location value / closing range als Prädiktor" lieferte nur
Technische-Analyse-Material (Chaikins CLV-Indikator) und keine akademische Studie;
(2) die erste IBS-Suche (Formulierung „mean reversion equity ETF close relative to
daily range") gab null Treffer zurück. **Ein publizierter, referierter
Einzelaktien-Querschnittstest des Schlussdruck-Maßes mit Nachtbein-Zerlegung wurde
nicht gefunden — die Kandidaten-Messung wäre nach dieser Recherche tatsächlich
unbesetztes Terrain.**

## (c) Was der Literatur zufolge gegen den Kandidaten spricht

1. **Die Bounce-Falle sitzt genau auf dem Signal.** Ein Schluss am Tagestief ist
   überproportional oft ein Schluss auf der Geldseite (Bogousslavsky/Muravyev: der
   Auktionspreis trifft in 68,5 % der Fälle Bid oder Ask des Vorschlussmarkts). Wenn die
   nächste Eröffnung im Mittel wieder in Spannenmitte liegt, entsteht eine mechanische
   „Übernachtrendite" von etwa einer halben Spanne **ohne jede handelbare Kante**. Die
   halbe Spanne (~7,6 Bp im Mittel, Bogousslavsky/Muravyev) ist **größer als delta80
   (0,0397 Pp) und größer als die JA-Schwelle (0,10 Pp) minus Kostenhürde** — der
   Effekt, den die Studie sucht, hat dieselbe Größenordnung wie das Artefakt, das ihre
   Selektion systematisch einsammelt.
2. **Die dokumentierte Auktions-Umkehr ist im Mittel zu klein, um nach Kosten zu
   tragen.** Bogousslavsky/Muravyev: mittlere Abweichung 8,1 Bp, Umkehr vollständig —
   aber „even when adjusted for the half spread" bleibt nach Abzug der halben Spanne
   wenig; die großen Abweichungen (>63 Bp) sind das 1-%-Quantil. Der Fluss existiert,
   die Prämie im Durchschnittsfall ist Mikrostruktur-Größenordnung.
3. **Beide Ausführungspreise des Kandidaten sind Auktionspreise, und beide sind
   problematisch.** Der Einstieg braucht den Schlussauktionspreis, der zur Signalzeit
   nicht bekannt ist (in der Vorregistrierung als C8/Gatter 3 bereits benannt — die
   Literatur bestätigt die Schwere: MOC-Orders müssen vor der Imbalance-Veröffentlichung
   liegen). Der Ausstieg füllt in der Eröffnungsauktion, die laut Amihud/Mendelson (1987),
   Stoll/Whaley (1990) und Berkman et al. (2012) systematisch laut bzw. bei
   Aufmerksamkeits-Aktien systematisch **überhöht** ist. Eine im Rücktest gemessene
   Nacht-Kante kann zu erheblichen Teilen „Verkauf in eine dünne, überhöhte Eröffnung"
   sein — messbar, aber nicht in Breite ausführbar (Berkman et al.: die impliziten
   Kosten der Gegenseite übersteigen die halbe Spanne; CXO-Advisory-Notiz zu
   Overnight-Strategien: MOO/MOC-Orders tragen bei kleinen Werten keine Größe).
4. **Verfall nach Publikation im relevanten Zeitraum.** Die Bestätigungshälfte der
   Studie beginnt 2008 — exakt dort, wo laut Knuteson die US-Index-Divergenz endete, und
   Quantpedia die Konvergenz datiert. Die A7-Kontrolle zieht den unbedingten
   Nachtdurchschnitt zwar ab (die Studie misst nur den bedingten Überschuss), aber wenn
   die Übernacht-Liquiditätsprämie insgesamt geschrumpft ist, schrumpft plausibel auch
   ihr bedingter Teil. Gegenläufig: das MOC-Volumen (der vermutete Druckspender) wuchs
   im selben Zeitraum 3,1 % → 7,5 %.
5. **Konkurrierende Erklärung mit umgekehrtem Vorzeichen des Mechanismus.** Berkman
   et al. und Aboody et al. erklären hohe Übernachtrenditen nicht mit einer Prämie an
   Lagerhalter, sondern mit **Retail-Kaufdruck an der Eröffnung**. Dann wäre die Kante
   des Kandidaten keine Risikoprämie (dauerhaft), sondern ein Sentiment-Artefakt
   (fragil, klientelabhängig, und bei Aufmerksamkeits-Aktien konzentriert). Die
   Vorregistrierung nennt nur die Prämien-Deutung.
6. **Kosten der Übernacht-Haltung bei Hebelprodukten kommen zur Spanne hinzu.**
   CFD-Übernachtfinanzierung = Referenzzins + Aufschlag, z. B. CMC Markets:
   Interbank-Satz + 0,0082 %/Tag Marge (Anbieterseite, Websuche); bei ~4–5 % Zinsniveau
   sind das grob **2–3 Bp je Nacht zusätzlich zur Handelskostenhürde** — rund ein
   Viertel der JA-Schwelle von 0,10 Pp, jede Nacht, und in der 0,10-Pp-Hürde der
   Signalstudie (Spannenmaß) nicht enthalten. Auf dem Basiswert entfällt das, dort
   bleibt aber die Auktions-Ausführungsfrage (Gatter 7 der Vorregistrierung).
7. **Überlebensverzerrung wirkt hier in Signalrichtung.** Aktien, die am Tagestief
   schließen und später delistet werden, fehlen in einem Überlebenden-Archiv; der
   bedingte Nacht-Ertrag der Signalgruppe wird dadurch nach oben verzerrt. (Allgemeiner
   Befund der Reversal-Literatur; von der Vorregistrierung in Gatter 5 erkannt, die
   delisteten Reihen decken aber nur 2024–2026.)

**Was für den Kandidaten spricht:** Der Mechanismus „Prämie für Übernacht-Lagerhaltung
nach Verkaufsdruck" ist publiziert und top-referiert (Boyarchenko et al. RFS 2023 —
inklusive der Asymmetrie: nur nach Ausverkäufen; Bogousslavsky JFE 2021;
Grossman/Miller-Deutung bei Bogousslavsky/Muravyev). Und die Kurzfrist-Umkehrprämie
sitzt laut Lou/Polk/Skouras im Nachtbein und ist im Tagbein negativ — genau die
Signatur, die die Entscheidungsregel (Zweig N zahlt, Zweig T nicht) verlangt.

## (d) Prüfideen für die Mess-Kette

1. **Spannen-Regression als Bounce-Test (wichtigste Idee).** Den je-Tag-Überschuss der
   Signalgruppe gegen eine aus Hoch/Tief geschätzte relative Spanne regressieren
   (Corwin-Schultz-artiger Schätzer, aus dem Tagesarchiv berechenbar). Skaliert der
   Überschuss ~1:1 mit der halben geschätzten Spanne, ist er Bid-Ask-Bounce, keine
   Kante. Alternativ grob: Signalgruppe in Spannen-Terzile schichten — eine echte
   Lagerhaltungs-Prämie sollte nicht monoton mit der Spanne skalieren.
2. **Versetztes Nachtbein als Artefakt-Kontrolle.** Zusatzauswertung (protokolliert,
   nicht als dritter Test gewertet): Einstieg Eröffnung(i+1), Ausstieg Eröffnung(i+2).
   Überlebt vom Effekt nichts, sobald der verseuchte Schlusskurs nicht mehr der
   Einstieg ist, war es Bounce/Auktionsartefakt. (Zweig T deckt das nur teilweise, weil
   er zusätzlich das andere Fenster misst.)
3. **Boyarchenko-Asymmetrie nachstellen.** Kante getrennt für Tage mit negativer vs.
   positiver Gesamtmarktrendite ausweisen. Die Inventar-These erwartet die Prämie
   überwiegend nach Markt-Ausverkäufen; ein gleichverteilter Effekt spräche eher für
   Bounce oder Berkman-Sentiment.
4. **Berkman-Konzentrations-Check.** Kante geschichtet nach Aufmerksamkeits-Proxys
   (Umsatzschock, |Vortagesrendite|). Konzentriert sie sich dort, trägt vermutlich die
   überhöhte dünne Eröffnung — dann gilt der Skalierbarkeits-Vorbehalt des Ausstiegs
   verschärft, und die „Kante" ist die Gegenseite von Retail-Käufen am Open.
5. **Zeitschnitte mit Vorhersage.** Beschreibend ausweisen: vor/nach 2008 (Ende der
   US-Index-Divergenz) und vor/nach ~2015 (Auktionswachstum). Die MOC-Druck-These
   macht eine testbare Vorhersage: die Kante sollte mit dem Auktionsvolumen-Anteil
   **wachsen**; die Verfalls-These sagt das Gegenteil. Beide Thesen stehen vorab fest —
   das schützt vor nachträglichem Geschichtenerzählen.
6. **Finanzierungskosten als zweite Kostenkomponente.** Für das CFD-Urteil ~2–3 Bp je
   Nacht (Referenzzins + Anbieteraufschlag) zusätzlich zur 0,10-Pp-Spannenhürde
   ansetzen bzw. die gemessenen echten Handelskosten des Demo-Kontos um die
   Übernacht-Position erweitern. Die JA-Schwelle von 0,10 Pp deckt nach dieser
   Recherche die CFD-Gesamtkosten einer Übernacht-Haltung **nicht** ab.
7. **Ex-Tag-Gatter bestätigt.** Glasserman et al. rechnen Dividenden explizit dem
   Nachtbein zu — Gatter 1 der Vorregistrierung (gleiche Bereinigung von Eröffnung und
   Schluss) ist auch literaturseitig die erste Fehlerquelle der Nachtmessung.

---

## Fazit

Die Literatur stützt die **Bausteine** des Kandidaten einzeln — es gibt eine
publizierte Übernacht-Prämie, einen belegten MOC-Preisdruck mit fast vollständiger
Übernacht-Umkehr, und die Kurzfrist-Umkehrprämie sitzt nachweislich im Nachtbein —,
aber sie ist **stumm zur konkreten These**, dass das Schlussdruck-Quintil im
Einzelaktien-Querschnitt eine Netto-Kante über der Kostenhürde zahlt: das nächste
verwandte Resultat (IBS/Pagonidis) ist ein Working Paper auf Index-ETFs ohne
Nachtbein-Zerlegung. Zugleich benennt die Literatur zwei ernste Gegenspieler, die die
Messung von einer echten Kante unterscheiden muss: den Bid-Ask-Bounce, der bei
Tief-Schlüssen mechanisch eine halbe Spanne „Nachtrendite" erzeugt (Größenordnung der
gesuchten Kante), und die nicht handelbare bzw. überhöhte Eröffnungsauktion als
Ausstiegspreis. Ohne die Bounce-Kontrollen aus (d) wäre selbst ein sauberes JA der
Maschine kein Beleg für eine handelbare Prämie.
