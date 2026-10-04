# Familie: Residual-Momentum und Momentum mit Volatilitätsskalierung (Literaturbeleg, Stand 04.10.2026)

Simulation, keine Anlageberatung. Recherche per Websuche; Volltexte der Originale waren großteils nicht abrufbar (403 / nur Abstract).
Kennzeichnung: [Q] = in einer abgerufenen Quelle gesehen, [G] = Gedächtniswissen, nicht geprüft.

## 1. Exakte Regel (Blitz–Huij–Martens 2011, J. Empirical Finance 18(3), 506–521)
- Residuen: monatlich je Aktie Regression der Gesamtrenditen auf die drei Fama-French-Faktoren (Mkt, SMB, HML), Fenster 36 Monate, Aktien ohne 36 Monate Historie ausgeschlossen [Q: CXO Advisory, Quantpedia].
- Rang: Summe der Residualrenditen über 12 Monate ohne den letzten Monat (Überspringmonat), geteilt durch die Standardabweichung der Residuen (Quantpedia nennt 36 Monate, CXO nennt 12 Monate; Widerspruch, im Original nicht geprüft) [Q].
- Portfolio: Dezile, Top minus Bottom, gleichgewichtet, Halten 1 Monat, monatlich neu [Q]. Quantpedia: Universum Top-10 % US-Aktien nach Marktkapitalisierung, Preis > 1 USD, Stichprobe 1926–2009 [Q].
- Verwandt: Gutierrez–Prinsky 2007 (J. Financial Markets; im Auftrag „Pirinen" – der Name ist Prinsky): Momentum aus firmenspezifischer Überrendite setzt sich Jahre fort (+0,20 %/Monat in Monaten 13–60), relatives Momentum kehrt um (−0,40 %) [Q: Alpha-Architect-Zusammenfassung]. Grundy–Martin 2001: Momentum hat zeitvariable Faktorrisiken, Abhilfe über Faktor-Neutralisierung [Q, sekundär]. Parameter von Grundy–Martin im Detail: nicht belegt.
- Ein-Faktor (nur Markt-Beta) oder Beta-neutral: Das Original nutzt FF3. Eine reine SPY-Beta-Variante ist in meinen Quellen NICHT als eigene Regel belegt. Nahe liegt Grundy–Martin (Residuen gegen Markt und Größe, [G]) und Gutierrez–Prinsky (Marktmodell-/Abnormalrendite, [G]); Blitz–Hanauer–Vidojevic 2020 prüfen mehrere Faktormodelle [G]. Ein Nachbau mit SPY-Beta wäre eine ungeprüfte Abwandlung, kein Literaturfall.

## 2. Berichtete Größen
- Original, 1926–2009, Long-Short-Dezile, Gesamtmarkt, brutto [Q: CXO]: Residual 11,2 % p.a., Vol. 12,5 %, Sharpe 0,90; Gesamtrenditen-Momentum 10,3 %, Vol. 22,7 %, Sharpe 0,45. FF3-Alpha 10,8 % vs. 8,0 %. 2000–2009: +4,7 % vs. −8,5 %. Großwerte-Sharpe 0,60 vs. 0,36.
- Quantpedia-Nachbau (Top-10 %-Universum, Long-Short, 1926–2009): 9,18 % p.a., Vol. 15,27 %, Sharpe 0,34, maximaler Rückschlag −59,7 % [Q]. Das ist weit unter dem Original-Sharpe, Abgrenzung der Zahlen unklar.
- Nach Veröffentlichung, unabhängig: Blitz–Hanauer–Vidojevic 2020 (Int. Review of Economics & Finance 69, 932–957) berichten, dass der Effekt in globalen Universen und in Stichproben nach der Erstveröffentlichung bestehen bleibe und nicht durch Crash-Risiko erklärt werde [Q: Abstract + Sekundärzusammenfassung]. Die Autoren sind teils dieselben wie im Original, also nicht unabhängig. Zahlen und Kosten dort: nicht abgerufen; Sekundärquelle vermerkt „Ergebnisse brutto", Kosten und Leihkosten der Short-Seite würden den Gewinn mindern [Q].
- Unabhängiger Befund (Hrčak-Aufsatz, US 1968–2022, FF5-Residuen): Sharpe 0,71 vs. 0,15 für konventionelles Momentum, Max-Rückschlag −35,9 % vs. −93,0 % [Q]. Long-Short, brutto, nur Quelldatenzeitraum bis 2022; Nachveröffentlichungs-Teilstück nicht getrennt ausgewiesen.
- Long-only, Large Cap, nach Kosten: KEINE Zahl gefunden. Die Literatur misst fast durchgängig Top-minus-Bottom. Kostenhinweis nur indirekt: Residual-Momentum ist kaum in Kleinwerten konzentriert (Original) und daher kostengünstiger als Gesamtrenditen-Momentum [Q]; allgemeines Long-only-Momentum in US-Large-Cap: etwa 1–1,5 % p.a. brutto über Benchmark, Handelskosten etwa 12 Bp p.a. [Q: Alpha Architect, sekundär; Aussage zu Gesamtmomentum, nicht Residual].
- Large-Cap-Momentum 2006–2024 (SSRN 5367656, Sathish Kumar): Long-Seite 7,9 % p.a., Short −9,1 %; Alpha nach UMD-Kontrolle −4,0 % p.a.; nach Kosten und Crash-Risiko kein Rest-Alpha [Q, Sekundärangabe, nicht im Volltext geprüft].

## 3. Volatilitätsskalierung
- Barroso–Santa-Clara 2015 (J. Financial Economics): Momentum-Risiko ist über die eigene realisierte Varianz vorhersagbar; konstantes Vol-Targeting (12 % p.a.) beseitigt Crashes weitgehend und fast verdoppelt die Sharpe [Q: Alpha Architect/CXO]. Schätzfenster 126 Tage, Sharpe 0,97 [G, Suchbegriff, nicht bestätigt]. Dies ist ein Long-Short-WML-Portfolio, Hebel nötig, nicht Long-only.
- Daniel–Moskowitz 2016 (JFE): dynamische Gewichtung nach prognostiziertem Mittelwert und Varianz übertrifft die konstante Skalierung [Q]. Optionsähnliche Verlustphase des Verlierer-Portfolios nach Marktrückgängen: Die Crashs stammen aus der Short-Seite [G].
- Gegenbefund: Cederburg et al. 2020 (JFE 138): Volatilitätsgesteuerte Faktoren schlagen die ungesteuerten in 72 von 103 Strategien nicht (Sharpe/CE, brutto, außerhalb der Stichprobe) [Q]. Momentum-spezifische Zahl dort: nicht abgerufen.
- Für eine Long-only-Aktienauswahl gilt: Skalierung hilft vor allem gegen Short-Crashs; die Long-Seite hat andere Risiken (Marktbeta, Konzentration 2024/25). Kein Beleg gefunden, dass sie dort die Rendite nach Kosten hebt.

## 4. Einschätzung (meine Schätzung, kein Messwert)
- Frage: schlägt eine Residual-Momentum-Long-only-Regel mit ≤ 30 Positionen SPY (Gesamtrendite) 2017–2026 nach 20 Bp je Seite? Wahrscheinlichkeit etwa 25 %, Spanne 12–40 %.
- Gründe: (a) Die Literaturvorteile (Sharpe, Crash) stecken in Long-Short und in der Short-Seite bzw. der Faktor-Neutralisierung, die eine Long-only-Seite nicht mitnimmt. (b) 2017–2026 wurde SPY von wenigen Mega-Caps getragen; ein Korb mit ≤ 30 Titeln, der auf Residuen statt Gesamtrendite ranked, meidet gerade Beta-Gewinner und kann deshalb schlechter als 11-1 abschneiden. (c) Kosten: 40 Bp Umlauf bei hohem Umschlag (monatlich) sind bei kleinem Vorsprung entscheidend. (d) Die 2026-Messung des Projekts selbst (11-1: breit schlägt SPY nicht) spricht für Vorsicht. Obere Spanne nur, wenn die Auswahl zufällig 2024/25-Gewinner trifft – dann ist es wie bei 11-1 Pfadabhängigkeit.
- Unabhängigkeit von 11-1: gering. Rangkorrelation der Signale in Aktien: hoch, Größenordnung 0,6–0,8 [G, nicht belegt]. Der Vorteil liegt nach der Literatur in anderem Faktor-Risikoprofil, nicht in neuen Gewinnern. Für die Mühle zählt die Variante deshalb als Abwandlung von 11-1, nicht als eigener Beleg; die Testzahl (Bonferroni) ist mit 11-1 zu teilen.
- Nebenbemerkung zur Mühle: Residuen aus nur 15–30 Aktien plus SPY sind statistisch dünn; Beta-Schätzung über 36 Monate nur mit SPY ist das kleinste vertretbare Modell, aber wie oben nicht als Literaturregel belegt.

## 5. Nicht belegt
- Volltexte von Blitz–Huij–Martens, Blitz–Hanauer–Vidojevic, Grundy–Martin, Barroso–Santa-Clara, Daniel–Moskowitz nicht eingesehen; Parameter nach Sekundärquellen, mit dem erwähnten Widerspruch beim Standardisierungsfenster.
- Keine Long-only-, Large-Cap-, Netto-Zahl für Residual-Momentum; keine Zahl 2017–2026.
- Keine unabhängige Veröffentlichung nach 2010 gefunden, die Residual-Momentum nach Kosten in Large-Cap-Aktien bestätigt; Hrčak-Befund ist brutto und Long-Short.
- Ein-Faktor-Variante (SPY-Beta) und Beta-neutrale Long-only-Variante: nicht als Literaturregel belegt.
- Korrelation zu 11-1 und die Wahrscheinlichkeit unter 4 sind Schätzungen.
- Ken-French-Faktordaten wären nötig für FF3; nicht geprüft, ob sie im Projekt per Offline-Datei beschaffbar sind.

Quellen: repub.eur.nl/pub/22252, ideas.repec.org/a/eee/empfin/v18y2011i3p506-521.html, cxoadvisory.com (stripping-risks-from-a-stock-momentum-strategy), quantpedia.com/strategies/residual-momentum-factor, ideas.repec.org/a/eee/reveco/v69y2020icp932-957.html, hrcak.srce.hr/332953, alphaarchitect.com (Swedroe-Spotlight, Momentum-Kosten), papers.ssrn.com abstract 5367656, Cederburg et al. via sufe.edu.cn / cxoadvisory.
