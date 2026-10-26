# Familie: Sektor-/Branchen-Momentum (große US-ETFs, long only, Halten >= 1 Monat)

Stand: 04.10.2026. Recherche per Web; nichts gerechnet. Kennzeichnung: **[Q]** = in der genannten Quelle gelesen,
**[Q-indirekt]** = aus einer Sekundärquelle, die die Originalregel beschreibt, **[G]** = Gedächtniswissen, ungeprüft.
Keine Anlageberatung; Simulation.

## 1. Regel und Parameter

**Original: Moskowitz & Grinblatt (1999), "Do Industries Explain Momentum?", Journal of Finance 54(4), S. 1249-1290.**
Der Volltext war nicht abrufbar; nur Abstract gelesen. [Q] Abstract: Industrie-Momentum "highly profitable", auch
nach Kontrolle für Größe, B/M, Einzelaktien-Momentum; stärkste Vorhersagekraft beim 1-Monats-Horizont, wirkt bis ca. 1 Jahr.
- [Q-indirekt] Arnott/Clements/Kalesnik/Linnainmaa (2018 SSRN 3116974, RFS 2023), Abschn. 3.2: 20 MG-Branchen,
  Wert-gewichtete Branchenrenditen, Long Top 3 / Short Bottom 3 (gleichgewichtet), Formation/Halten 1 oder 6 Monate,
  bei 6 Monaten Jegadeesh-Titman-Überlappung. Das ist Long-Short auf Einzelaktien-Branchen, **nicht** Long-only-ETF.
- [G] MG nutzen 1963-1995 und eine Überspringzeit von ca. einer Woche; Seitenzahlen/Tabellen nicht belegt.
- **Direkt auf ETFs übertragbare Regeln (long only):**
  - Faber (2010), "Relative Strength Strategies for Investing", SSRN 1585517 (Entwurf, kein Journal): 10 Fama-French-Branchen,
    Rangfolge nach Gesamtrendite 1-12 Monate (auch Kombination), monatlich. [Q-indirekt: Quantpedia/CXO] Beispiel: 12 Monate
    Rückblick, Top 3, gleichgewichtet, monatlich, ohne Überspringen. Zeitraum 1926/28-2009, vor Kosten.
  - CXO Advisory, "Simple Sector ETF Momentum Strategy Robustness/Sensitivity Tests": 9 SPDR-Sektoren (XLB, XLE, XLF, XLI, XLK, XLP, XLU,
    XLV, XLY), monatlich Rang nach 1-12 Monaten (+ 12:7-1), Halten 1 Monat, **nur 1 Sektor**, 0,25 % Reibung je Wechsel,
    Dez 1998-Dez 2015. [Q]

Für diese Familie wäre eine vorregistrierbare Fassung: 11 SPDR-Sektoren, 12-1 oder 6-1 Rückblick, Top 3, gleichgewichtet,
monatlich. Das ist **meine Ableitung, keine Quellenregel** (Faber nutzt 3 aus 10 ohne Skip).

## 2. Berichtete Größe, Kosten, Zeitraum, was nach Publikation blieb

| Quelle | Universum / Zeitraum | Ergebnis |
|---|---|---|
| Faber 2010 (via Quantpedia) [Q-indirekt] | 10 US-Branchen, 1928-2009, Top 3 aus 10, 12 M | 13,94 % p.a., Vol 18,38 %, MaxDD -46,29 %, Sharpe 0,54; ca. +4 pp/Jahr ggü. Buy&Hold; **brutto** |
| Arnott et al. 2018/2023 [Q] Tab. 3 | 20 MG-Branchen, 1963-2016, Long-Short Top3/Bottom3 | 1/1: 9,61 % p.a., t=4,76; 6/6: 3,78 % p.a., t=1,92. Branchen-Momentum "stops working" um das Jahr 2000. Fünf-Faktor-Alpha 1/1: 10,2 % (t=4,85); 6/6 nicht mehr signifikant im Sechs-Faktor-Modell |
| Andreu/Swinkels/Tjong-A-Tjoe 2013, Fin. Markets & Portfolio Mgmt 27(2), 127-148 [Q-Abstract] | Branchen- und Länder-ETFs, ETF-Handelszeit | ca. 5 % p.a. Überschuss; Spreads weit unter Break-even. Long-Short |
| Ein früherer Entwurf desselben Gedankens [Q, CXO-Zusammenfassung; Autoren nicht ermittelt] | iShares- und Select-Sector-SPDR, Jul 2000-Nov 2007, 6/6, Long-Short | 0,37 % bzw. 0,59 % pro Monat abnormal, **nach Spreads, Provision, Leihkosten "verschwinden" sie fast überall** |
| Du/Denning/Zhao 2014, J. Asset Management (Aug 2014) [Q-Abstract] | Sektor-ETFs nach 2000 | "no momentum in sector ETFs", unabhängig von Marktzuständen; "clean out-of-sample test" |
| CXO-Robustheit [Q] | 9 SPDR, 1998-2015, 1 Sektor, 0,25 % | Bestes Fenster (10-1) schlägt gleichgewichtetes Sektor-Portfolio "nur knapp" und mit mehr Vol.; drei Rückblicke verlieren Geld; Datenschürfen, nur ca. 17 unabhängige 12-Monats-Intervalle |

Nach Publikation (McLean-Pontiff-artig): Es gibt **keine** direkte McLean-Pontiff-Zahl für diese Regel, die ich belegen konnte. Das Gesamtbild aus [Q]:
Der Branchen-Effekt ist nach ca. 2000 deutlich schwächer (Arnott et al.), im ETF-Zeitraum 2000-2007 nach Kosten weg, und der einzige
ETF-Nachbau mit positiver Aussage (Andreu et al.) ist long-short, hat 5 % brutto-Überschuss und überlappt die Publikationszeit.
Allgemeiner Zerfall nach Veröffentlichung: Sharpe etwa halbiert (arXiv 2105.01380, 72 Strategien) [Q-Suchtreffer-Zusammenfassung, nicht im Detail geprüft].

## 3. Einschätzung: schlägt Top-3-Sektor-Momentum SPY (mit Ausschüttungen) 2017-2026 nach 20 Bp je Seite?

Nicht gerechnet; nur Begründung.
- Kosten: 3 aus 11, monatlich, Umschlag grob 25-40 % je Monat des Depots [G, Schätzung] ergibt ca. 0,3-0,8 Pp/Jahr bei 20 Bp je Seite. Das frisst
  einen großen Teil eines erwarteten Vorsprungs von 0-3 Pp.
- Erwarteter Überschuss ggü. SPY netto: **Spanne etwa -4 bis +3 Pp p.a., Mitte um -0,5 bis -1 Pp** [G, Urteil]. Begründung: (a) der Effekt ist nach 2000
  schwach belegt, (b) SPY 2017-2026 war tech-dominiert; Momentum-Top-3 hält zeitweise XLK (Vorteil) aber wechselt in 2018, 2020, 2022 in
  Defensive/Energie (Nachteil, Whipsaw), (c) ein Konzentrationsrisiko ohne Mehrertrag.
- Wahrscheinlichkeit, SPY netto in 2017-2026 zu schlagen: **ca. 30-40 %** [G, subjektiv]. Wegen der Tech-Dominanz in SPY (XLK groß) ist
  die Kontrolle (Sektor-Gleichgewicht oder "immer XLK") wichtiger als SPY allein; Mühle-Regel: Überschuss gegen eine als Erwartung gebaute Kontrolle.
- Auflösung: Ein Monatstakt über 10 Jahre sind 120 Beobachtungen; bei Sektor-Überschuss-Streuung von etwa 2-3 Pp/Monat ist die MDE
  vermutlich weit über 0,5 Pp/Monat [G, Rechnung nötig]. Voraussichtlich: **"nicht entscheidbar"** bei Tor 1/Tor 2, nicht "kein Effekt".
  Das wäre nach Projektregeln ein Ausschlussgrund (unter 1.000 Bestätigungs-Signaltagen), sofern nicht mit Tagen gemessen wird.
- Hauptrisiken: Beta schwankt je nach Auswahl (Energie/Versorger/Basiskonsum unter 1, XLK/XLY über 1); Konzentration auf 3 Sektoren;
  Drawdown Faber-Version -46 % (1928-2009) [Q-indirekt], also nicht besser als der Markt; Momentum-Crashs nach Marktwenden (2009, 2020-Rotation) [G];
  Jahresend- bzw. Januar-Effekte im Branchen-Momentum (Quelle: Suchtreffer-Zusammenfassung zu Grobys/Kolari, nicht im Detail geprüft).

## 4. Nicht belegt / offene Punkte

- Exakte MG-Regel (Überspringen, Tabellen, Seitenzahlen) und deren Zahlen: Volltext nicht abrufbar.
- Keine Studie gefunden, die Long-only-Top-3-aus-11-SPDR **nach Kosten 2010-2026** mit eigener Stichprobe misst. Die verwendbare Literatur endet 2015/2016.
- Fabers Kostenwirkung (Entwurf nennt Bruttorenditen), Grobys/Kolari (2019, J. Financial Research 43(1), 95-119, DOI 10.1111/jfir.12205)
  Ergebnisse nach 2000: PDF nicht lesbar ausgewertet, nicht verwertet.
- Der Wert "ca. 30-40 %" und die Spanne sind Urteil, nicht gemessen. Umschlagsschätzung ungeprüft.
- Quantpedia/CXO sind Sekundärquellen; Zahlen von dort sind nicht aus dem Original verifiziert.
- Empfehlung an die Mühle: erst MDE über Monate/Tage ausrechnen (Tor 1), dann entscheiden, ob die Familie überhaupt in die Mühle gehört.
