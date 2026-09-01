# Strategie-Landkarte — 01.09.2026

**Zweck:** Wilhelm soll entscheiden können, welche Strategieklassen in den Untersuchungs-Scope
kommen — statt dass es der Zufall der nächsten Idee tut. **Das ist eine Kartierung, keine
Messung:** kein Ertrag wurde angesehen, keine Reihe neu abgerufen. Jede Machbarkeitsaussage
rechnet sich aus **Streuung und Signalzahl**, jedes Urteil ist **wörtlich zitiert** mit
Fundstelle. Empfehlungen am Ende sind **Vorlage für Wilhelms Entscheid, kein Entscheid**.

---

## 0. Der Maßstab, mit dem hier gerechnet wird

### 0.1 Auflösungswand (Machbarkeit)

Nötige Signaltage für eine Kante der Größe `d`: **N(d) ≈ N_vorhanden · (delta80/d)²** —
quadratisch in (Streuung/Kante). **Eintrittskarte (Wilhelm, 26.08.): unter 1.000 nötigen
Handelstagen**, gerechnet VOR jeder Vorregistrierung. Einheitenfalle: `delta80` ist eine
Effektgröße in **Prozentpunkten**, die Schwelle zählt **Handelstage** — nie vergleichen.

Die Streuung des Querschnittsmittels hängt an der **Haltedauer**, nicht an den Daten
(Tüftler-Zählung 26.08., 400er-Stichprobe archiv1d):

| Fenster | Tagesstreuung | delta80 (täglich feuernd, archiv1d) |
|---|---|---|
| über Nacht (H = 1) | **0,880 Pp** | **0,0397 Pp** (4.665 Bestätigungstage) |
| voller Tag | 1,474 Pp | — |
| mehrtägig (Eichung der Wand) | 2,8 Pp | Korpus-Median 0,605 Pp |

Bei Haltedauer H sinkt die Zahl unabhängiger Beobachtungen um Faktor H, die Streuung je
Runde wächst mit √H — **längere Horizonte sind statistisch teurer, nicht billiger.** Die
bekannte Abhilfe gegen die Überlappungsstrafe (B10) ist eine **nicht überlappende
Messanordnung**, geeicht am 25.08.: „Newey-West über 62 Verzögerungen war rund 54 % zu
konservativ" (studien/momentum-nichtueberlappend/ERGEBNIS.md).

Anker aus der PM-Tabelle vom 26.08. (PROJEKTSTAND.md ~Z. 4764 ff., nötige Handelstage):
rsi2seit-mcp **1.073** · rsi2seit 4.127 · t3-stundendrift 12.655 · momentum 34.110 ·
quartalsschub-betrag 55.750 · monatswende-breit **79.500**.

### 0.2 Kostenmodelle — klassenspezifisch, nie pauschal

Dokumentiert in studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/NACHTRAG (01.09.):

| Ausführung | Kosten je Runde | Skaliert mit |
|---|---|---|
| CFD gehebelt | **K + 0,0247·H Pp** (Finanzierung je Nacht, capital.com: 4 % p. a. + SOFR) | Haltedauer |
| CFD ungehebelt (1:1) | K (laut Quelle keine Übernachtfinanzierung) | — |
| Kassa-Aktie (Referenz 10.000 $) | **≈ 0,06 Pp konstant** (0,04 Spanne + Kommission); nachrichtlich | — |
| Standard-Schein | **0,23 Pp je 3 h** — tötete alles Intraday | Haltezeit |

**K = 0,110 Pp** ist die vorregistrierte Rundenkosten-Schwelle, Etikett „**vorläufig —
Freigabeschwelle unerfüllt**" (20 Runden, 16 aus EINER Minute, eine Marktlage). Belegt nur
für Mega-Caps; Messbasis beginnt bei 1,6 Mrd $ Tagesumsatz, darunter „unbelegt und
mutmaßlich höher". **Krypto-Kosten: ungemessen** (die alte 0,10-%-Bestätigung war zu 58 %
krypto-verdünnt und wurde deshalb verworfen, PROJEKTSTAND ~Z. 4726).

### 0.3 Datenbestand (gegeben)

archiv1d 2.965 Werte bis 1986 **mit Eröffnung** (Kernbestand, 9.329 Handelstage) ·
archiv60m 2.886 Werte, **rollierendes 730-Tage-Fenster** · 1m ~7 Tage (Sammlung RUHT) ·
5m/15m ~60-Tage-Fenster seit 26.08. · Verschwundene: 1.164 Reihen + eingefrorenes
Punkt-in-Zeit-Universum (Stichtag 2024-09-02) — **decken nur den Messzeitraum ab**;
gemessene Richtung: das Archiv **untertreibt über Nacht** (+0,046 Pp/Tag, t 21,4;
PROJEKTSTAND 01.09.) · News-Titel max 400/Symbol, sammelt erst seit 31.08. wieder ·
EDGAR frei (Form 4, 8-K, DEF 14C bewährt) · Fundamentaldaten: nur stammdaten.json
(Aktienzahl, Gewinn/Aktie, **ein** Stand Juli 2026) · Optionen/Orderbuch/Tick: keine.

---

## 1. Übersichtstabelle

| Klasse | (1) Messbar? | (2) Gemessen? | (3) Kostenlage | (4) Fehlt für den Scope |
|---|---|---|---|---|
| Übernacht-Anomalien | **JA** — einzige Klasse klar unter der Wand | 3 Bauformen: 2× NEIN, 1× real unter Kostenhürde | K je Runde; ungehebelt ohne F | Kosten unter die Kante (läuft) |
| Mehrtages-Swing 2–10 T | An der Grenze (≈ Eintrittskarte) | rsi2seit „nicht entscheidbar" (ruht) | K + 0,0247·H (CFD) bzw. K / 0,06 | Vorab-delta80 je Entwurf; Verschwundenen-Deckung |
| Wochen-/Monats-Momentum | Nur GROSSE Kanten; nicht überlappend nötig | Momentum/Drift „nicht entscheidbar" | Fast nichts (Aktie, selten umgeschichtet) | mfdepot-Buch durch die Mühle |
| Earnings-Drift | Bedingt — Terminarchiv fehlt | Nicht gemessen | Übernacht-Teil billig, Drift-Teil F·H | EDGAR-Terminarchiv bauen |
| M&A / Spin-offs | Nur im Verschwundenen-Fenster | Nicht gemessen | Aktie, wenige Runden | Ereignisliste EDGAR; Zielwerte = Delisting-Falle |
| Index-Aufnahmen | **NEIN** — Quelle fehlt | Nicht gemessen | — | Ankündigungsquelle (nicht EDGAR) + Signalzahl winzig |
| Insider-Käufe (Form 4) | JA mit Beschaffungsarbeit | Nicht gemessen (nur Anzeige-Karte) | Wie Swing/Übernacht je Bauform | Historisches Form-4-Archiv, Punkt-in-Zeit |
| Saisonalität | **NEIN** (Kalender-Signalzahl) | Monatswende: Marktzeitgeschäft | — | Nichts Beschaffbares hilft — zu wenige Zeitpunkte |
| Faktor Value/Quality | **NEIN** — Fundamentaldaten fehlen | Nicht gemessen | — | Historische Punkt-in-Zeit-Fundamentaldaten (groß) |
| Faktor LowVol (preisbasiert) | Wie Monats-Momentum (teuer) | Nicht gemessen | Fast nichts | Nicht überlappende Anordnung, wie Momentum |
| Paare/Spreads | Bedingt — Kosten doppelt | Nicht gemessen | 2×K je Runde (~0,22 CFD) | Punkt-in-Zeit-Paaruniversum; nur große Spreads |
| Volatilität/Optionen | **NEIN** — keine Optionsdaten | Nicht gemessen | Unbekannt | Komplette Dateninfrastruktur |
| Intraday (alle Auflösungen) | **NEIN** (Fenster + Produkt) | 0/51; Stunden-Str. widerlegt; Dichte = Kostenhürde | 0,23 Pp/3 h (Schein); Spread mehrfach täglich | Jahre 5m/15m-Sammlung UND Produkt < 0,04 |
| Krypto | Schlecht (Streuung ~3–5×) | Dip-Modi: verlieren | **Ungemessen** | Krypto-Kostenmessung; Streuungszählung |
| Markt-Timing/Allokation | Als Overlay ja; als Strategie kaum | Bedingungen validiert (EMA200, R-TREND) | Minimal (seltene Umschichtung) | Nichts — ist eingebaut; eigenständig: n zu klein |
| Dividendentermine | **NEIN** im Bestand | Nicht gemessen | Aktie nötig (CFD-Div-Abschlag) | Terminarchiv + unadjustierte Kurse |
| Formationen/Chart-Muster | Ja (gleiche Mechanik wie Signalstudie) | Weitgehend abgesucht: nichts über Kosten | Wie Trägerklasse | Nur neue Bauform mit Vorab-Rechnung |
| News/Sentiment | **NEIN** — „es fehlt Faktor 75" | „NICHT MESSBAR" (wörtl.) | — | Monate Archivlauf (läuft seit 31.08.) |

---

## 2. Die Klassen im Einzelnen

### 2.1 Übernacht-Anomalien (weitere Bauformen jenseits der drei gemessenen)

**(1) Messbar:** **JA — die einzige Klasse deutlich unter der Wand.** H = 1 auf archiv1d:
Streuung 0,880 Pp, 4.665 Bestätigungstage, delta80 0,0397 Pp. JA-Seite an der CFD-Hürde
(0,10 Pp): ~735–872 nötige Signaltage → **besteht die Eintrittskarte**. NEIN-Seite an der
Aktienhürde (0,04): ~4.600 Tage → reißt; NEIN-Seiten deshalb auf die CFD-Hürde stellen.
Überlebensverzerrung ist hier **gemessen und konservativ**: „ein JA auf Überlebenden-Daten
ist konservativ gemessen; ein NEIN muss die Verzerrungsrichtung mitbedenken"
(PROJEKTSTAND 01.09., Weg 3: c_gew +0,0462 Pp/Tag, t = 21,39).

**(2) Gemessen (01.09., PROJEKTSTAND ~Z. 36–53, wörtlich):**
- „**glockendruck-nacht: NEIN an der CFD-Hürde — aber der Nacht-Überschuss ist REAL** (+0,044 Pp, t 3,71 …)"
- „**nachtstoss-umkehr: NEIN beidseitig, gepaart NEIN an der Aktienhürde** (Gegenrichtung, −0,028, t −7,66 …)"
- „**abgabedruck-nacht: NEIN** (Zweig N tot, t 0,33 …)"
- „**Der wichtigste Satz: glockendruck scheitert nicht am Markt, sondern an den KOSTEN.**"

**(3) Kosten:** je Runde K (~0,11 vorläufig); CFD ungehebelt laut Quelle **ohne**
Übernachtfinanzierung; gehebelt frisst F = 0,0247 Pp/Nacht „gut die Hälfte jeder
Zusatznacht". Kassa-Aktie ≈ 0,06 Pp.

**(4) Fehlt:** Nichts an Daten — der Engpass sind die **Kosten** (Wilhelms Entscheid 01.09.:
„KOSTEN ANGREIFEN"; glockendruck-haltedauer H = 2/3/5 + Liquiditäts-Schnitt ist
vorregistriert und läuft, Protokolle ungelesen). Für **neue** Bauformen gilt die Lehre vom
26.08.: **Beharrlichkeits-Zählung vor der Vorregistrierung** (ein beharrendes
Querschnittsmerkmal kann gegen A7 per Konstruktion nichts zeigen) und die
Rückprall-Prüfung (geteilter Kurs, C8).

### 2.2 Mehrtages-Swing (2–10 Tage)

**(1) Messbar:** **an der Grenze der Eintrittskarte.** Anker: rsi2seit-mcp (H ≈ Tage)
brauchte **1.073** nötige Handelstage — knapp über der 1.000er-Schwelle; rsi2seit 4.127.
Grobrechnung für H = 3, täglich feuernd, nicht überlappend: σ ≈ 1,474·√3 ≈ 2,6 Pp,
~4.665/3 Blöcke → Kanten unter ~0,2 Pp je Runde sind unerreichbar, Kanten ≥ 0,3 Pp
erreichbar. **Je Entwurf vorab rechnen, nicht als Klasse pauschal bejahen.**
Überlebensverzerrung: für die Dip-Familie **gemessen materiell und beschönigend**
(−3,78 Pp, t = −6,19; für rsi2seit-mcp −0,48 Pp ≈ 6× dessen delta80, PROJEKTSTAND ~Z. 4640)
— ein JA in dieser Klasse braucht die Verschwundenen-Gegenprobe.

**(2) Gemessen:** rsi2seit „nicht entscheidbar" (+0,021 Pp; Bedingungsstudie, ruht — nicht
tot). Obergrenzen-Befund 25.08. dazu wörtlich: rsi2seit-mcp obere Grenzen 0,083–0,097 Pp —
„Diese fünf müssen nie wieder durchsucht werden. Selbst der optimistischste mit den Daten
verträgliche Wert trägt die Kosten nicht" (studien/OBERGRENZEN-BEFUND.md). Supertrend-
Regelwerk: „Felix' Regelwerk hat den vorregistrierten Test nicht bestanden — und die drei
Filter, die das Regelwerk ausmachen, tragen nichts bei" (studien/63-supertrend/BERICHT.md).
Trendwende-Detektor: „Die +0,25 Pp von damals sind widerlegt (OOS +0,074); ein kleiner
echter Effekt ist wahrscheinlich (marktneutral 0,103 Pp, t über Tage 1,69), aber nicht
belegt; ob er über die Kosten kommt, ist mit diesem Aufbau nicht entscheidbar"
(studien/33-winkel-detektor/README.md).

**(3) Kosten:** CFD gehebelt K + 0,0247·H (bei H = 5: ~0,23 Pp); ungehebelt K;
Kassa-Aktie ≈ 0,06 konstant — **die Klasse gehört auf ungehebelt/Aktie gerechnet**.

**(4) Fehlt:** kein Datenhindernis; fehlt sind Entwürfe, die die Vorab-Rechnung bestehen
(delta80 und nötige Signaltage VOR der Vorregistrierung), plus Verschwundenen-Gegenprobe.

### 2.3 Wochen-/Monats-Momentum & -Reversal

**(1) Messbar:** **nur für große Kanten, und nur nicht überlappend.** Überlappend gemessen
brauchte momentum 34.110 Handelstage (PM-Tabelle) — strukturell blind. Die geeichte
Abhilfe: festes Kalender-Rebalancing alle 63 Handelstage → „vier echt unabhängige
Beobachtungen im Jahr, über 20 Jahre achtzig — wenig, aber ehrlich"
(studien/OBERGRENZEN-BEFUND.md). 80 Beobachtungen entscheiden nur Kanten in
Prozentpunkt-Größe je Umlauf — genau dort liegen laut Obergrenzen-Befund die einzigen
offenen großen Grenzen des Korpus (momentum obere Grenzen 2,0–4,26 Pp). archiv1d bis 1986
reicht dafür; Überlebensverzerrung über Jahrzehnte ist aber **nicht gedeckt**
(Verschwundene nur im Messzeitraum) — Richtung je Bauform unklar, ausweisen.

**(2) Gemessen:** Momentum-Buch und Drift-Buch „nicht entscheidbar" (Neumessung 25.08.,
„NULL belegte Kanten"; die Formel „zwei validierte Kanten" war eine überholte
Selbstfortschreibung — Gedächtnisprotokoll ergebnis-drift-belegt). Eichung der Anordnung:
JA (g = 1,543; studien/momentum-nichtueberlappend/ERGEBNIS.md: „Urteil über Momentum:
unverändert unbelegt. Dieser Lauf darf dazu nichts sagen, und sagt es auch nicht.")

**(3) Kosten:** die günstigste Klasse — wenige Umläufe im Jahr, beim echten Broker
≈ 0,06 Pp je Umlauf; CFD-Finanzierung wäre bei H = 63 ruinös (0,0247·63 ≈ 1,6 Pp) —
**diese Klasse ist nur als Aktie sinnvoll**.

**(4) Fehlt:** die Messung selbst: das mfdepot-Buch („MOMENTUM stärkstes Zehntel,
Rebalancing alle 63 Handelstage") „ist nie durch die Mühle gegangen. Das ist die nächste
Messung" (OBERGRENZEN-BEFUND). Kein Datenkauf, nur Arbeit.

### 2.4 Ereignisgetrieben

**2.4a Earnings-Drift.** (1) Bedingt messbar: Termine sind NICHT im Bestand; EDGAR (8-K
Item 2.02, 10-Q-Einreichungsdaten) kann sie rückwirkend liefern — Beschaffungsarbeit,
Punkt-in-Zeit sauber möglich. Ereigniszahl grob: 2.965 Werte × 4/Jahr ≈ 12.000
Ereignisse/Jahr — Signalzahl reicht. Kurze Halteformen (Ankündigungs-Übernacht) erben die
gute H=1-Machbarkeit; klassische 60-Tage-Drift erbt die Momentum-Strafe. (2) Nicht
gemessen. (3) Übernacht-Teil: K; Drift-Teil: Aktie ≈ 0,06, CFD-Finanzierung skaliert.
(4) Fehlt: das **Terminarchiv** (EDGAR-Bulk, mehrere Sitzungen Arbeit) + Zeitzonen-Regel
(Meldung vor/nach Schluss).

**2.4b M&A / Spin-offs.** (1) Nur eingeschränkt: EDGAR-Quellen bewährt (8-K, DEFM14A;
Aggregator-Datum ist kein Beleg — Gegenprobe ist EDGAR). **Aber:** Übernahmeziele
verschwinden per Definition — das Überlebenden-Archiv ist hier systematisch blind, die
1.164 Verschwundenen decken nur den Messzeitraum. Messbar also nur im kurzen Fenster ab
~2024. Ereigniszahl klein → nötige Jahre hoch. (2) Nicht gemessen. (3) Aktie, wenige
Runden — günstig. (4) Fehlt: Ereignisliste aus EDGAR UND ein um Jahre längeres
Verschwundenen-Archiv, das es nicht rückwirkend gibt — **struktureller Deckel**.

**2.4c Index-Aufnahmen.** (1) **Nicht messbar:** Aufnahme-Ankündigungen (S&P/Nasdaq-
Pressemitteilungen) stehen nicht in EDGAR und nicht im Bestand; historische Listen wären
neu zu beschaffen. Signalzahl (~ Dutzende/Jahr, ein Zeitpunkt je Ereignis) läge zudem weit
unter jeder Bestätigungsschwelle — Querschnitt misst den Tag, nicht die Fälle.
(2) Nicht gemessen. (3) —. (4) Quelle + Jahrzehnte Historie; auch dann Signalzahl-Deckel.

**2.4d Insider-Käufe (Form 4).** (1) **JA mit Beschaffungsarbeit:** EDGAR-Form-4-Strecke
ist im Haus bewährt (Insider-Karte; ~10 relevante Käufe/Tag ≈ 2.500 Signaltage/Jahr —
laufend, aber die Karte sammelt erst seit Kurzem). EDGAR bietet Bulk-Daten rückwirkend →
ein historisches Signalarchiv ist baubar, Punkt-in-Zeit-sauber (Einreichungszeitstempel).
Bei kurzer Haltedauer erbt die Klasse die H=1-Machbarkeit; ~10 Signale/Tag über z. B.
15 Jahre ergeben Zehntausende Signaltage — über der Eintrittskarte. 13D lohnt nicht
(„bringt bei liquiden Werten fast nichts", Gedächtnisprotokoll insider-karte-edgar).
(2) Nicht gemessen — die Karte ist reine Anzeige. (3) je Bauform: Übernacht/Swing-Kosten
wie oben; Insider-Signale sitzen oft in kleineren Werten → **K unterhalb 1 Mrd $
Tagesumsatz unbelegt und mutmaßlich höher** — Liquiditäts-Schnitt einplanen.
(4) Fehlt: Bulk-Backfill Form 4 (Größenordnung: einige Sitzungen + Speicher), Abgleich
mit dem Punkt-in-Zeit-Universum, Liquiditätsfilter.

### 2.5 Saisonalität jenseits Monatswende

**(1) Nicht messbar** mit realistischen Kantengrößen: Kalendersignale liefern wenige
**Zeitpunkte** (der Querschnitt misst den Tag — 2,3 zerfiel auf 0,94 über 2,09 Mio
Reihen-Tage), und „Kalendersignale mit unter 1.000 Bestätigungs-Signaltagen sind
strukturell nicht bestätigbar". monatswende-breit hätte **79.500** nötige Handelstage
gebraucht. Ein Feiertagseffekt mit ~10 Terminen/Jahr hat nach 40 Jahren ~400 Zeitpunkte.
**(2) Gemessen:** „monatswende-breit ist ein **Marktzeitgeschäft, keine Auswahl** …
Überschuss gegen den Querschnitt +0,019 Pp" (25.08.). **(3)** —. **(4)** Kein
beschaffbarer Datensatz ändert die Zeitpunktzahl — die Klasse scheitert an der Arithmetik,
nicht an den Daten. Allenfalls als beschreibendes Overlay einer anderen Klasse.

### 2.6 Faktor-Ansätze (Value / Quality / LowVol)

**Value/Quality: (1) nicht messbar.** Es gibt genau EINEN Fundamentaldaten-Stand
(stammdaten.json, Juli 2026) — jede Rückrechnung damit wäre Look-ahead per Konstruktion.
Historische Punkt-in-Zeit-Fundamentaldaten sind ein großer, meist kostenpflichtiger
Beschaffungsblock (EDGAR-XBRL wäre der freie Weg — Größenordnung: Wochen Arbeit).
**LowVol: (1) bedingt** — rein preisbasiert auf archiv1d rechenbar, erbt aber die
Monats-Momentum-Strafe (lange Haltedauer, wenige unabhängige Beobachtungen) und eine
Überlebensfalle: die Verliererseite der Sortierung landet systematisch bei den
Verschwundenen. **(2)** Nicht gemessen. **(3)** wie Monats-Momentum: nur Aktie sinnvoll.
**(4)** Value/Quality: Datenbeschaffung XBRL (groß). LowVol: nichts außer der nicht
überlappenden Anordnung — könnte als zweites Buch neben Momentum durch dieselbe Mühle.

### 2.7 Paare/Spreads

**(1) Bedingt:** Preise reichen (archiv1d, gemeinsame Historie bis 1986). Zwei Fallen:
die Paar-Auswahl auf gemeinsamer Historie ist eine **Überlebens-Auswahl** (wer bis heute
kointegriert, hat überlebt), und marktneutrale Spreads haben kleinere Streuung, aber auch
kleinere Kanten — delta80 je Entwurf rechnen, nicht pauschal. **(2)** Nicht gemessen;
nächster Verwandter: Trendwende „marktneutral 0,103 Pp … nicht belegt" (s. 2.2).
**(3) Kosten doppelt:** zwei Beine je Runde ≈ 2×K ≈ 0,22 Pp (CFD) bzw. ~0,12 (Aktie);
Short-Bein beim CFD zahlt Finanzierung. **(4)** Punkt-in-Zeit-Paaruniversum,
Kostenmodell fürs Short-Bein (ungemessen), Vorab-Streuungszählung der Spreads.

### 2.8 Volatilitäts-/Optionsstrategien

**(1) Nicht messbar: keine Optionsdaten, keine impliziten Volatilitäten, kein Orderbuch** —
und der Broker-Bestand bildet Optionsausführung nicht ab. Realisierte-Vol-Sortierungen
sind KEINE Optionsstrategien — die stehen unter 2.6 (LowVol). **(2)** Nicht gemessen.
**(3)** Unbekannt (Options-Spreads wären eigene Messung). **(4)** Komplette
Dateninfrastruktur (historische Optionsketten sind teuer und groß) — der weiteste Weg
aller Klassen.

### 2.9 Intraday (alle Auflösungen)

**(1) Nicht messbar, doppelt gedeckelt:** (a) Fensterlage — 1m ruht (~7 Tage), 5m/15m
sammeln erst seit 26.08. (~60-Tage-Fenster), 60m rolliert 730 Tage: „Der 60m-Teil hatte
keine Auflösung für Kanten realistischer Größe" (delta80 0,434 Pp;
studien/signalstudie-2026-08/BERICHT.md). (b) Produkt — „Sie finden nur zu wenig: Die
Effekte liegen bei 0,1 Pp, die Kostenhürde bei 0,04–0,23 Pp" (ebd.). **(2) Gemessen,
mehrfach:** 0 von 51 Kandidaten der Signalstudie bestätigt („in keiner Marktlage
überzufällig", studienurteile.js/BERICHT.md); Stunden-Strategie **widerlegt, t = −11,6**
(PROJEKTSTAND Z. 100); Dichte-Studie: Cluster-Detektor findet echte Momente, aber der
Durchschnittstrade liegt exakt auf der Kostenhürde; Abschnittskanäle „als
Handelsbedingung schädlich (−0,17 Pp, t = −4,1)" (studienurteile.js). **(3)** Standard-
Schein 0,23 Pp je 3 h; Spread fällt mehrfach täglich an — die härteste Kostenlage im
Haus. **(4)** Jahre eigener 5m/15m-Sammlung UND ein Ausführungsweg unter ~0,04 Pp je
Runde. Beides zusammen macht die Klasse auf absehbare Zeit zum schlechtesten Einsatz von
Messkapazität.

### 2.10 Krypto

**(1) Schlecht:** Historie wäre da (Yahoo, 24/7, lange 1d-Reihen), aber die Streuung
liegt ein Mehrfaches über Aktien → nötige Signaltage ~10× und mehr (quadratisch); das
„Übernacht"-Fenster existiert als Struktur nicht (kein Schluss). **(2) Gemessen:**
Dip-Modi verlieren auf Krypto (Studie vor dem aktuellen PROJEKTSTAND-Fenster;
Gedächtnisprotokoll krypto-und-intervall-nein — Konsequenz eingebaut: Pool volatil +
kapiZusatz). **(3) Ungemessen** — die alte Kostenbestätigung wurde gerade WEGEN
Krypto-Verdünnung verworfen; Krypto-CFD-Finanzierung fällt täglich an (kein
Wochenend-Aussetzen). **(4)** Eigene Kostenmessung + Streuungszählung — und ein Grund,
warum es dort besser laufen sollte als auf Aktien. Ohne den: draußen lassen.

### 2.11 Markt-Timing / Allokation (Regime-basiert)

**(1) Als eigenständige Strategie kaum messbar:** unabhängige Beobachtungen sind
Regime-Wechsel (wenige pro Jahr) — nach 40 Jahren zweistellig, entscheidbar nur für sehr
große Kanten. **Als Bedingung/Overlay bereits validiert und eingebaut.** **(2) Gemessen
(wörtlich):** SPY>EMA200-Gate re-validiert (+0,098 Pp, t 2,6); Regime-Zuteilung: „R-TREND …
eigener Validierung (t = 3,2)" (PROJEKTSTAND ~Z. 1300); Kanten komplementär (rsi2seit
über, Kapitulation unter EMA200). Dazu der Regimeschnitt 2021: die Übernacht-Kompression
gehört VOR jede Messung dieser Familie. **(3)** Minimal — seltene Umschichtungen.
**(4)** Nichts Neues; der Platz der Klasse ist **im** Messgeschirr (Regime-Achsen), nicht
als eigener Kandidat.

### 2.12 Dividendenbezogene Termine

**(1) Nicht messbar im Bestand:** kein Dividenden-Terminarchiv; die Kursreihen sind
adjustiert — Ex-Tag-Effekte sind in adjustierten Reihen teils wegdefiniert, und die
Sprungpaar-Befunde zeigen, dass Anpassungsfehler real vorkommen. Capture-Bauformen
brauchen unadjustierte Kurse + Termine. **(2)** Nicht gemessen. **(3)** CFD zahlt
Dividenden-Abschläge eigen (ungemessen) — Klasse gehört auf Aktie gerechnet.
**(4)** Terminarchiv (Yahoo-Events oder EDGAR-nahe Quellen, Beschaffungsarbeit) +
Klärung Adjustierung; Signalzahl wäre ordentlich (viele Zahler × 4/Jahr).

### 2.13 Formationen / Chart-Muster *(ergänzt — bereits bearbeitete Klasse)*

**(2) Gemessen:** SKS-Top „real aber unhandelbar" (+0,01 %); Bullenflagge widerlegt;
Doppelboden nicht robust (Formationen-Studie, vor dem aktuellen PROJEKTSTAND-Fenster;
Gedächtnisprotokoll formationen-studie-befund). Dazu decken die 0/51 der Signalstudie
viele Muster-Detektoren ab. **(1)** Messbar wie die jeweilige Trägerklasse, aber die
Klasse ist weitgehend abgesucht. **(4)** Nur neue Bauformen mit bestandener
Vorab-Rechnung — keine Priorität.

### 2.14 News-/Sentiment-getrieben *(ergänzt — laufender Sonderfall)*

**(1)/(2) Gemessen (wörtlich):** „**NICHT MESSBAR — es fehlt Faktor 75.** 35 Beobachtungen
an 10 Zeitpunkten, nötig wären ~2.600 unabhängige Symbol-Tage … Kein Nein — eine
Blindheitsfeststellung mit sauberen Kontrollen" (PROJEKTSTAND 31.08.). Gewicht auf 0
gesetzt („Was nie gemessen wurde, steuert nichts"). **(4)** Nur Zeit: das reparierte
Archiv sammelt seit 31.08.; bei ~17 beobachteten Symbolen dauern 2.600 unabhängige
Symbol-Tage **Monate bis über ein Jahr** — Wiedervorlage, kein Scope-Kandidat jetzt.

---

## 3. Was diese Karte NICHT abdeckt

- **Datenquellen, die wir nicht haben:** Optionsketten/implizite Vol, Orderbuch/Tick,
  historische Punkt-in-Zeit-Fundamentaldaten, Leihe-/Short-Interest-Daten,
  Index-Ankündigungslisten, Dividenden-/Termin-Kalender, intraday-Historie über die
  rollierenden Fenster hinaus, Verschwundenen-Kurse VOR dem Messzeitraum. Jede Klasse,
  die daran hängt, ist oben entsprechend markiert — aber es gibt Klassen, die hier gar
  nicht erst auftauchen, weil ihnen die Infrastruktur fehlt (Beispiele: Orderfluss-/
  Mikrostruktur-Strategien, Wertpapierleihe/Short-Squeeze-Ansätze, Anleihen-/FX-Carry,
  Rohstoff-Terminkurven, Delisting-Arbitrage und Small-Cap-Reversal in Pleitenähe — die
  Letzteren zusätzlich prinzipiell, weil ihre Auswahl systematisch bei Verschwundenen
  landet, deren Reihen nur den Messzeitraum abdecken; die ≥12,7-%-Lücke ist mit
  vorhandenen Quellen nicht zu schließen).
- **Kein Blick in Erträge:** wo oben „aussichtsreich" steht, ist das eine Aussage über
  Messbarkeit und Kostenlage, nie über gemessene Renditen künftiger Kandidaten.
- **Kostenlage unterhalb 1,6 Mrd $ Tagesumsatz** ist für ALLE Klassen unbelegt; K = 0,110
  trägt das Etikett „vorläufig".
- **Die Karte friert den Stand 01.09.2026 ein** — laufende Läufe (glockendruck-haltedauer,
  Kostenmessung, News-Archiv) verändern einzelne Zellen in Wochen.

---

## 4. Empfehlung — die 3 aussichtsreichsten Klassen für den Scope
*(Vorlage für Wilhelms Entscheid, kein Entscheid.)*

**1. Übernacht-Anomalien, weitere Bauformen (2.1).**
*Warum:* die einzige Klasse klar unter der Auflösungswand (JA-Seite ~735–872 nötige Tage
bei 4.665 vorhandenen), Überlebensverzerrung gemessen konservativ, ein realer Effekt
(glockendruck +0,044, t 3,71) liegt bereits vor — nur die Kosten stehen davor, und genau
daran wird per Entscheid vom 01.09. schon gearbeitet. *Kosten (Daten/Arbeit):* keine
Beschaffung; je Bauform eine Vorregistrierung + Mühlenlauf. *Wahrscheinlichster Killer:*
die Kostenmessung bleibt unter der Freigabeschwelle bzw. K bleibt ≥ Kante — dann ist die
Klasse messbar, aber unhandelbar; zweitens die Beharrlichkeits-/Rückprall-Falle bei
schlampig gebauten neuen Merkmalen.

**2. Wochen-/Monats-Momentum, nicht überlappend gemessen (2.3).**
*Warum:* der Obergrenzen-Befund nennt es die einzige Stelle im Korpus, an der noch eine
große Kante möglich ist; die Messanordnung ist geeicht (g = 1,543), das Buch läuft schon
in mfdepot.js, die Kostenlage (Aktie, seltene Umschichtung) ist die beste aller Klassen.
*Kosten:* nur Arbeit — Vorregistrierung + ein Mühlenlauf; kein Datenkauf. *Killer:*
n ≈ 80 unabhängige Beobachtungen entscheiden nur Pp-große Kanten — gut möglich, dass das
Urteil „nicht entscheidbar, aber Obergrenze jetzt eng" lautet; dazu die ungedeckte
Überlebensverzerrung über Jahrzehnte.

**3. Insider-Käufe aus Form 4 (2.4d).**
*Warum:* einzige ereignisgetriebene Klasse mit bewährter freier Quelle, ausreichender
Signalzahl (~2.500/Jahr) und Punkt-in-Zeit-sauberen Zeitstempeln; kurze Halteformen erben
die Übernacht-Machbarkeit. *Kosten:* der größte Arbeitsblock der drei — historischer
Form-4-Bulk-Backfill (einige Sitzungen, Speicher), Symbol-Zuordnung, Liquiditätsfilter.
*Killer:* die Kostenlage — Insider-Signale häufen sich in Werten unter der 1,6-Mrd-$-
Messbasis, wo K unbelegt und mutmaßlich höher ist; der Liquiditäts-Schnitt kann die
Signalzahl so weit ausdünnen, dass die Klasse zurück an die Wand rutscht.

*Knapper Vierter:* Mehrtages-Swing (2.2) — kein Datenhindernis, aber jeder Entwurf steht
einzeln an der 1.000-Tage-Kante; eher Fortsetzung des Bestehenden als neue Scope-Klasse.

---

*Erstellt 01.09.2026, Sitzung „Landkarte". Reine Kartierung; kein Ertrag angesehen, keine
Messung gestartet. Simulation mit virtuellem Kapital; keine Anlageberatung.*
