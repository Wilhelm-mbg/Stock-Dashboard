# Literatur zum Vorwärtstest-Plan (Stand 2026-10-04, laufend ergänzt)

Lesestatus je Quelle: **GELESEN** = Volltext (PDF/Seite) selbst abgerufen und die genannte Stelle im Text gesehen; **ABSTRACT** = nur Abstract/Suchtreffer-Zusammenfassung gesehen; **WISSEN** = aus eigenem Gedächtnis, in dieser Sitzung nicht geprüft (kein Beleg, Rechner-Agent soll es numerisch gegenprüfen).
Hinweis: Die Formeln in den PDFs von Bailey/López de Prado liegen als Bilder vor; der Text drumherum wurde gelesen, die Formeln selbst stammen aus einer zweiten Quelle (portfoliooptimizer.io / Risk.net-Abstract) und sind unten so gekennzeichnet.

## A. Dauer von Vorwärtstests / Trennung von null

**A1. Bailey & López de Prado (2014), „The Deflated Sharpe Ratio", J. Portfolio Mgmt.** — GELESEN (Text; Formeln als Bild).
Aussage: Wer das Beste aus N Versuchen nimmt, bekommt auch bei wahrem SR = 0 ein erwartetes Maximum > 0; die DSR ist eine PSR mit auf N Versuche angehobener Schwelle und berücksichtigt Schiefe/Wölbung/Länge.
Zahl: Beispiel im Text: SR 2,5 (annualisiert) über 5 Jahre täglich (T = 1250) ist bei vielen Versuchen nur zu ~90 % „wahrer SR > 0"; mit N = 46 unabhängigen Versuchen wäre DSR = 0,9505 gewesen, mit Normalverteilung (Schiefe 0, Kurtosis 3) erst bei N = 88 unter 95 %. (Die genauen Eingaben des Beispiels sind im PDF-Text nicht lesbar, nur diese Ergebnisse.)
Link: https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf

**A2. Bailey & López de Prado (2012/13), „The Sharpe Ratio Efficient Frontier", J. Risk 15(2) — Minimum Track Record Length** — ABSTRACT (Risk.net) + Formel aus Sekundärquelle GELESEN.
Aussage: Länge der Aufzeichnung, die nötig ist, um „SR ≤ c" mit Konfidenz 1−α zu verwerfen; wächst bei negativer Schiefe und hoher Kurtosis.
Zahl/Formel: siehe Abschnitt E1 (nichtnormale Varianzformel nach Lo/Mertens).
Links: https://www.risk.net/journal-risk/2223785/sharpe-ratio-efficient-frontier ; https://portfoliooptimizer.io/blog/the-probabilistic-sharpe-ratio-bias-adjustment-confidence-intervals-hypothesis-testing-and-minimum-track-record-length/

**A3. Lo (2002), „The Statistics of Sharpe Ratios", Financial Analysts Journal 58(4)** — ABSTRACT.
Aussage: Monats-SR darf nur unter Sonderfällen mit √12 annualisiert werden; bei Autokorrelation ist der korrekte Faktor ein anderer.
Zahl: der annualisierte SR eines Hedgefonds kann durch Autokorrelation um bis zu 65 % überschätzt sein. Asymptotische Varianz bei iid-Normal: Var(SR̂) ≈ (1 + SR²/2)/T (WISSEN; deckt sich mit der Formel in E1 bei Schiefe 0 und Kurtosis 3).
Link: https://traders.studentorg.berkeley.edu/papers/The-Statistics-of-Sharpe-Ratios.pdf (nicht selbst geöffnet)

**A4. Harvey & Liu (2015), „Backtesting", J. Portfolio Mgmt.** — GELESEN (Text, PDF von Duke; Zahlen aus dem Text per Suchtreffer bestätigt).
Aussage: Die übliche 50-%-Abschlagsregel für Backtest-Sharpe ist nur eine Faustregel; der Abschlag durch Mehrfachtests ist nichtlinear.
Zahl: Ist der annualisierte Brutto-SR < 0,4, liegt der Abschlag fast immer über 50 %; bei SR > 1,0 höchstens 25 % (laut Zusammenfassung der Suchtreffer, im Text Beispieltabellen mit SR 0,43–0,78 für sechs Strategien gesehen).
Link: https://people.duke.edu/~charvey/Research/Published_Papers/P120_Backtesting.PDF

**A5. McLean & Pontiff (2016), „Does Academic Research Destroy Stock Return Predictability?", J. Finance** — GELESEN (Volltext).
Aussage: 97 Prädiktoren verlieren nach Stichprobenende und nach Veröffentlichung Rendite.
Zahl (KORREKTUR zur Auftragsformulierung): −26 % außerhalb der Stichprobe (Obergrenze des Data-Mining-Effekts), −58 % nach Veröffentlichung; die **−32 % sind die Differenz** (58 − 26) = unterer Schätzwert des reinen Veröffentlichungseffekts, kein eigener Prior-Wert für „Out-of-Sample". Mittel in der Stichprobe 58,2 Bp/Monat; Koeffizienten −15,0 Bp (nach Stichprobe) und −33,7 Bp (nach Veröffentlichung). Verlauf: im ersten Jahr nach Stichprobenende praktisch kein Rückgang, danach >20 Bp niedriger; Jahre 3–5 nach Veröffentlichung −40,8 / −43,3 / −20,5 Bp, danach im Mittel −33,9 Bp.
Link: https://Www.Gwern.net/doc/economics/2016-mclean.pdf

**A6. Jegadeesh & Titman (1993), JF 48(1)** — GELESEN (Schlusskapitel im PDF).
Aussage: Wer Aktien nach den letzten 3–12 Monaten sortiert, gewinnt in den folgenden 3–12 Monaten (Daten 1965–1989).
Zahl: 6/6-Strategie: 12,01 % p.a. kumulierte Überrendite im Mittel; ca. 1,31 %/Monat ohne Verzögerung, 1,49 %/Monat mit 1 Woche Pause. Stichprobe 24 Jahre — mit Streuung wie in Abschnitt E1 ist das nur im Mittel über viele Aktien trennbar, nicht über einzelne Jahre.
Link: https://floridapsc.com/library/filings/2013/07457-2013/Support/Gulf's%20response%20to%20OPC's%201st%20POD,%20No.%2057/Jegadeesh%20and%20Titman%201993%20(140-167).pdf

**A7. Daniel & Moskowitz (2016), „Momentum crashes", JFE** — GELESEN (Arbeitspapier NBER w20439, Einleitung/Stichprobe; nicht die Methodik).
Aussage: Momentum bricht in „Panik"-Zuständen (nach Marktverlusten, hohe Vola, Markterholung) über Monate ein; dynamische Gewichtung hebt den SR stark an.
Zahl: US 1927–2013: WML-Sharpe 0,71 (Markt 0,40), Beta −0,58, CAPM-Alpha 22,3 % p.a. (t = 8,5); dynamisch über alle Märkte/Klassen SR 1,18, „viermal" so hoch wie statisches US-Momentum. Schlechteste Monate Juli/Aug 1932 (letzteres aus Abstract/Suchtreffer).
Link: https://www.nber.org/system/files/working_papers/w20439/w20439.pdf

**A8. Barroso & Santa-Clara (2015), „Momentum has its moments", JFE** — ABSTRACT.
Aussage: Das Risiko der Momentum-Strategie ist zeitvariabel und vorhersagbar; Vola-Skalierung beseitigt die Crashs fast und verdoppelt nahezu den SR. Zahl: Stichprobe 1927–2011, statisches WML 14,5 % p.a. (Sekundärquelle). Die Werte „SR 0,53 → 0,97" stammen aus dem Gedächtnis = WISSEN, nicht bestätigt, bitte nicht zitieren.
Link: https://ciencia.ucp.pt/en/publications/momentum-has-its-moments/

**A9. Bailey, Borwein, López de Prado & Zhu (2014), „Pseudo-Mathematics and Financial Charlatanism", Notices AMS — Minimum Backtest Length** — GELESEN (Satz 3.1 im PDF).
Aussage: Wer N unabhängige Konfigurationen probiert, bekommt bei wahrem OOS-SR 0 einen Backtest-SR von E[max_N]; die dafür nötige Länge wächst mit ln N.
Zahl: MinBTL (Jahre) < 2·ln(N) / E[max_N]²; „bei nur 5 Jahren Daten höchstens 45 unabhängige Konfigurationen, sonst erwartet man einen IS-SR von 1 bei OOS-SR 0".
Link: https://carmamaths.org/jon/backtest.pdf

**A10. Harvey, Liu & Zhu (2016), „…and the Cross-Section of Expected Returns", RFS** — ABSTRACT.
Aussage: 316 Faktoren; neue Faktoren sollten t > 3,0 haben (p < 0,0027).
Link: https://www.nber.org/papers/w20592

**A11. Chen (2021/22), „Most claimed statistical findings in cross-sectional return predictability are likely true"** — GELESEN (Abschnitt 4.4 im PDF) — **Gegenstimme zu McLean/Pontiff als Prior**.
Aussage: Nahe am Originaltest liegende OOS-Zerfälle sind durchgehend < 36 %; das passt zu einem FDR ≤ 25 % unter den veröffentlichten Befunden.
Zahl: OOS-Zerfall 20 % (Chen/Zimmermann 2020), 26 % (McLean/Pontiff 2016), 36 % (Jacobs/Müller 2020); in Fernzeiträumen 0 % bis 60 % (Linnainmaa/Roberts 2018); Abstract: mindestens 75 % (engste Schranke 91 %) der Befunde sind wahr. WICHTIG: das gilt für **veröffentlichte, über viele Jahrzehnte und viele Aktien gemessene Querschnittsprädiktoren**, nicht für eine selbst durchsuchte Intraday-/Kalenderregel mit N Varianten — für Letztere gilt A1/A9.
Link: https://arxiv.org/pdf/2206.15365

**A12. Bessembinder (2018), „Do stocks outperform Treasury bills?", JFE** — ABSTRACT/Pressetext.
Aussage: Die Aktienrendite ist extrem schief; 4,3 % der Aktien (1.092 von ~26.000) schaffen den gesamten Mehrwert über T-Bills 1926–2016, die übrigen 96 % entsprechen zusammen T-Bills.
Folgerung: Pro Aktie/Signal ist die Verteilung stark rechtsschief, Median ≪ Mittel; Stichproben kleiner Größe sehen das Mittel fast nie (t-Test auf Mittel hat dort wenig Aussagekraft, Kurtosis-Term in E1 wird groß).
Link: https://wpcarey.asu.edu/sites/default/files/2021-10/do-stocks-outperform-treasury-bills.pdf (nicht geöffnet)

**A13. Asness, Moskowitz & Pedersen (2013), „Value and Momentum Everywhere", JF 68(3)** — ABSTRACT.
Aussage: Value- und Momentumprämien gibt es in 8 Märkten/Klassen, stark gemeinsame Faktorstruktur, Value und Momentum sind negativ korreliert. Folgerung: Signale desselben Tages/derselben Klasse sind nicht unabhängig → Tage clustern (deckt sich mit CLAUDE.md-Regel).
Link: https://pages.stern.nyu.edu/~lpederse/papers/ValMomEverywhere.pdf (nicht geöffnet)

**A14. Ellis, „Winning the Loser's Game"** — ABSTRACT/Rezensionen (Buch selbst nicht gelesen).
Aussage: Aktives Investieren ist ein „Spiel der Verlierer" (der Sieger macht weniger Fehler); typische Fehler: Übertrading, Performance-Jagd, unkompensierte Risiken. Keine für den Rechner nutzbare Zahl; Hinweis für die Entscheidungsregel: Standard ist „nicht handeln", die Beweislast liegt bei der Strategie.
Link: https://www.morningstar.com/markets/if-active-investing-is-losers-game-whats-winners-game

## B. Abbruchregeln und sequentielle Tests

**B1. Wald SPRT (1945/48)** — Wikipedia GELESEN (Schwellen), Originalarbeit nicht gelesen; Simulation selbst gerechnet (siehe unten).
Aussage: Optimal (Wald/Wolfowitz) unter allen Tests mit gleichen α, β bezüglich erwarteter Stichprobengröße; Schwellen A = (1−β)/α, B = β/(1−α) auf dem Likelihood-Verhältnis (Wikipedia führt sie in log-Form mit vertauschten Namen auf).
Eigene Simulation (4.000 Läufe je Fall, Gauß, Tages-SR d1 = 0,1, α = 0,05, β = 0,2): unter H0 Fehlalarm 5,0 %, mittlere Länge 272; unter H1 Treffer 82,0 %, mittlere Länge 390; Festprobe für gleiche α/β: 619. → SPRT spart ~37 % unter H1, spart ~56 % unter H0. Aber: SPRT braucht eine **feste** Alternative d1 und ist nur gültig, wenn die Alternative stimmt; bei kleinerem wahrem Effekt läuft sie lange.
Link: https://en.wikipedia.org/wiki/Sequential_probability_ratio_test

**B2. mSPRT / „always valid" p-Werte — Johari, Pekelis & Walsh (2015/2021, Operations Research)** — GELESEN (Text teilweise; die Gauß-Formel (12) war im PDF-Text nicht lesbar und wurde per numerischer Integration selbst nachgerechnet, Abweichung < 1e-12).
Aussage: Man darf jederzeit nachsehen, wenn man das mit einer Normal-Prior gemischte Likelihood-Verhältnis gegen 1/α hält; Typ-I-Fehler bleibt ≤ α über alle Zeiten.
Zahl (eigene Simulation, σ = 1, τ = 0,1): Fehlalarm in 20.000 Schritten 4,85 %; bei wahrem Tages-SR 0,10 Stopp im Mittel nach 857 Beobachtungen (Power 100 % bis 20.000); bei 0,05 nach ~3.490. Vgl. SPRT 390 und Festprobe 619 bei 80 % Power — der Preis der Gültigkeit „jederzeit" ist etwa der Faktor 1,4–2.
Link: https://arxiv.org/pdf/1512.04922

**B3. Howard, Ramdas, McAuliffe & Sekhon (2021, Ann. Statist. 49(2)), Zeit-gleichmäßige Konfidenzfolgen** — GELESEN (Formeln (14), (21) im PDF; Zahlen nachgerechnet).
Aussage: Eine Konfidenzfolge hält Überdeckung 1−α gleichzeitig für alle n; Breite schrumpft mit O(√(log n / n)).
Zahl: für α = 0,05 und optimal auf Zeit m abgestimmt gilt u(m)/√m ≈ 3,0 und u(100m)/√(100m) ≈ 3,6 (Paper; eigene Rechnung: 3,035 / 3,566 — stimmt). Radius für den Mittelwert bei σ = 1, m = 250: n = 100: 0,312 · n = 250: 0,192 · n = 500: 0,137 · n = 1000: 0,099 · n = 2500: 0,065 · n = 5000: 0,047; Vergleich Festproben-Intervall 1,96/√n: 0,196 / 0,124 / 0,088 / 0,062 / 0,039 / 0,028 → Konfidenzfolge ist bei n = 250 ≈ 1,55-mal so breit.
Link: https://arxiv.org/pdf/1810.08240

**B4. CUSUM (Page 1954, Biometrika 41)** — nur Zitation/Suchtreffer; Formel WISSEN (Standard, siehe E4). Keine Zahlen aus dem Original gelesen.
Link: https://en.wikipedia.org/wiki/CUSUM (nicht geöffnet)

**B5. Kaminski & Lo (2014), „When do stop-loss rules stop losses?", J. Financial Markets 18** — ABSTRACT (RePEc, MIT-Handle; PDF war nicht abrufbar).
Aussage: Unter Random Walk senken einfache 0/1-Stopp-Regeln immer die Erwartungsrendite; bei Momentum (Autokorrelation) können sie Wert schaffen; bei längeren Messabständen können bestimmte Regeln die Rendite heben und die Vola stark senken.
Zahl: Suchtreffer (Arbeitspapier-Fassung): 50–100 Bp/Monat Zugewinn in Stopp-Phasen bei US-Aktien/Staatsanleihen 1950–2004; RePEc-Abstract nennt dagegen Tages-Futures — Fassungen uneinheitlich, nicht als Beleg verwenden.
Folgerung: Ein Drawdown-Stopp ist **kein** statistischer Test; er ist eine Risikoregel, die bei fehlender Autokorrelation Rendite kostet. Als Abbruchkriterium für „Edge nicht da" taugt er nur kombiniert mit B2/B3.
Link: https://ideas.repec.org/a/eee/finmar/v18y2014icp234-254.html

## C. Umsetzungsprüfung

**C1. Perold (1988), „The Implementation Shortfall: Paper versus Reality", JPM 14(3)** — ABSTRACT/Sekundärtexte.
Aussage: Shortfall = Papierportfolio-Ergebnis minus Ergebnis des real gehandelten Portfolios, inklusive Opportunitätskosten verspäteter/unterbliebener Ausführung.
Zahl: keine. Formel (WISSEN, Standard): IS_i = Seite_i·(P_real,i − P_Entscheidung,i)/P_Entscheidung,i + Gebühren (+ Opportunitätskosten nicht ausgeführter Mengen).
Link: https://www.proquest.com/docview/195579087 ; https://quantitativebrokers.com/blog/a-brief-history-of-implementation-shortfall

**C2. Frazzini, Israel & Moskowitz (2018/2012), „Trading Costs of Asset Pricing Anomalies"** — ABSTRACT.
Aussage: Reale Handelskosten institutioneller Live-Orders (19 Märkte, 1998–2011) sind weniger als ein Zehntel früherer Schätzungen. Gilt für institutionelle Algorithmen mit großen Mengen, **nicht** für Retail-Scheine/CFDs mit Spread — die Hürden in CLAUDE.md (0,04 bis 0,23 Pp) bleiben eigene Messung.
Link: https://papers.ssrn.com/abstract=3229719

## D. Kleine Stichproben: Schrumpfung und Entscheid unter Unschärfe

**D1. Prior aus der Literatur** (Zusammenfassung A1, A4, A5, A9, A11): Faktor c = (Live-Erwartung)/(Rückblick) in den Studien: 0,74 (McLean/Pontiff nach Stichprobenende), 0,42 (nach Veröffentlichung), 0,64–0,80 (Chen: Zerfall 20–36 %). Das sind **Mittel über 97 veröffentlichte Querschnittsprädiktoren**, die schon als gut galten (mittlerer t im Sample hoch; Zerfall wächst mit In-Sample-Rendite und -t, McLean/Pontiff). Für eine selbst aus N Varianten ausgewählte Intraday-Regel ist c zusätzlich um den Selektionsabschlag nach A1/A9 zu senken: E[max_N] aus Abschnitt E3. Harvey/Liu (A4): bei Brutto-SR < 0,4 Abschlag meist > 50 %.
**D2. Bayessche Schrumpfung** — Standard (Normal-Normal), Formel in E5; Pastor/Stambaugh- bzw. Wachter/Warusawitharana-„skeptischer Prior" ist die Idee dahinter (ABSTRACT per Suchtreffer, nicht gelesen). Der Prior-Streuungswert τ ist eine **Annahme**, nicht aus einer Quelle.
**D3. Entscheid unter Unschärfe** — Maximin (Gilboa/Schmeidler 1989; WISSEN, nicht geprüft): handeln erst, wenn die **untere** Grenze der Konfidenzfolge (B3) über der Kostenhürde liegt; sonst „nicht entscheidbar" (deckt sich mit dem MDE-Grundsatz in CLAUDE.md).

## E. Formeln für den Rechner-Agent (node)

Konventionen: Beobachtung = Tagesüberschuss x_t gegen die Kontrolle, n Tage (Cluster = Signaltag), x̄ Mittel, s Stichproben-Std, σ angenommene Std. SR̂ = x̄/s je Beobachtung (nicht annualisiert; Annualisierung nur mit √q, wenn keine Autokorrelation, sonst Lo 2002). Φ = Standardnormal-CDF, z_p = Φ⁻¹(p). Alle Formeln bis auf die mit „WISSEN" markierten sind oben gegen eine gelesene Quelle oder numerisch geprüft.

**E1. PSR und MinTRL (Bailey/López de Prado nach Lo/Mertens; Quelle portfoliooptimizer.io, Formelbild im Original nicht lesbar)** — Kurtosis γ = **nicht** Exzess (Normal = 3), Schiefe κ.
```js
V   = 1 - kappa*SR + (gamma-1)/4 * SR*SR;        // Varianzfaktor, Normal: 1 + SR^2/2
SE  = Math.sqrt(V / n);                           // Standardfehler von SR-Dach
PSR = Phi((SR - c) / SE);                         // P(wahrer SR > c); c = Referenz-SR je Beobachtung
MinTRL = V * Math.pow(z(1-alpha) / (SR - c), 2);  // Beobachtungen, Voraussetzung SR > c
```
Hinweis: Bailey/López de Prado schreiben MinTRL = 1 + [...]·(z/(SR−c))² (mit „+1"); Differenz ≤ 1 Beobachtung und der Faktor [1 + SR²/2 − SR·κ + SR²(γ−3)/4] ist algebraisch identisch zu V. Beispiele (Normal, einseitig 95 %, c = 0): annualisierter SR 0,5 → 2.729 Tage (10,8 J.); SR 1 → 683 Tage (2,7 J.); SR 1,5 → 304 Tage; SR 2 → 172 Tage; Monatsdaten SR 0,5 → 131 Monate, SR 1 → 34 Monate (eigene Rechnung).
Auflösung (Mindestgröße, 80 % Power, einseitig 5 %): n = ((z_{0,95} + z_{0,80}) / SR_wahr)² = (2,486/SR)²; zweiseitig 5 %: (2,802/SR)².

**E2. Mindest-Stichprobe in Pp (MDE), für die Kostenhürden aus CLAUDE.md** (σ = 2,8 Pp Tagesstreuung als dort genannt; einseitig 5 %, Power 80 %):
```js
n80 = Math.ceil(Math.pow((1.6448536 + 0.8416212) * sigma / hurdle, 2));
MDE80 = 2.486 * sigma / Math.sqrt(n);   // kleinster wahre Effekt mit 80 % Power
```
Ergebnis (eigene Rechnung): Hürde 0,23 Pp → 917 Tage (≈ 3,7 J. bei 250/Jahr); 0,10 → 4.848; 0,05 → 19.389; 0,04 → 30.295. MDE80 bei n = 60 / 120 / 250 / 500 / 1.000 Tagen: 0,90 / 0,64 / 0,44 / 0,31 / 0,22 Pp. Mit Konfidenzfolge (E4) etwa ×2,4 (=1,55²) mehr Tage für gleiche Trennschärfe.

**E3. Erwartetes Maximum aus N Versuchen und DSR (Bailey/López de Prado, Gl. (1)–(2); Formel im PDF-Bild, Struktur aus Text; Näherung unten nach der bekannten Fassung = WISSEN, gegen exakte N-Normal-Maxima grob geprüft: N = 2: 0,52 statt 0,56; N = 10: 1,575 (exakt ≈ 1,54))**
```js
g = 0.5772156649;                                   // Euler-Mascheroni
Emax = sqrt(V_SR) * ((1-g)*zinv(1-1/N) + g*zinv(1-1/(N*Math.E)));  // V_SR = Varianz der SR-Schätzungen über die Versuche
SR0  = Emax;                                         // Schwelle statt 0
DSR  = Phi( (SR - SR0) * Math.sqrt(n-1) / Math.sqrt(1 - kappa*SR + (gamma-1)/4*SR*SR) );
```
(Das Original verwendet T−1.) Tabelle E[max] in Einheiten der Std der Versuchs-SR: N = 5: 1,19; 10: 1,58; 38: 2,17; 100: 2,53; 1000: 3,26. MinBTL < 2·ln N / E[max]² (A9). Bei korrelierten Varianten N durch Hauptkomponenten ersetzen (Bailey/LdP).
Der Rechner kann statt Näherung den exakten Wert per Monte-Carlo (N Normale, Maximum) bilden.

**E4. SPRT, mSPRT, Konfidenzfolge**

SPRT (Gauß, bekannte σ, H0: μ=0, H1: μ=μ1; σ = 1 auf Einheiten skalieren):
```js
L += (mu1*x - mu1*mu1/2) / (sigma*sigma);   // log-Likelihood-Verhältnis, je Beobachtung
upper = Math.log((1-beta)/alpha);           // >= : H1 annehmen
lower = Math.log(beta/(1-alpha));           // <= : H0 annehmen
```
α = 0,05, β = 0,2: oben +2,773, unten −1,558. Gültig nur für die feste Alternative μ1; Abbruch dann bindend (nicht fortsetzen).

mSPRT (Normal-Mischung, Prior τ² auf μ, jederzeit gültig; Johari et al. – Formel von mir hergeleitet, numerisch gegen Integration bestätigt):
```js
// xbar = Mittel nach n Beobachtungen, sigma bekannt (oder s), tau = Prior-Std der Wirkung
Lambda = Math.sqrt(sigma*sigma/(sigma*sigma + n*tau*tau))
       * Math.exp( n*n*tau*tau*xbar*xbar / (2*sigma*sigma*(sigma*sigma + n*tau*tau)) );
// Ablehnen von H0 sobald Lambda >= 1/alpha;  always-valid p = min(1, min_{k<=n} 1/Lambda_k)
```
Empfehlung: tau = erwarteter wahrer Effekt (z. B. Hürde oder Prior aus D1); σ aus Entdeckungshälfte (fest), nicht mitschätzen, sonst gilt die Garantie nicht exakt (Annahme).

Konfidenzfolge (Howard et al., zweiseitige Normal-Mischung, 1-sub-Gaussian-Beobachtungen; für andere σ: Beobachtungen durch σ teilen oder v = n·σ²):
```js
// v = n*sigma^2 (intrinsische Zeit), alpha = Gesamtfehler zweiseitig
rho = m / (-lambertWm1(-alpha*alpha/Math.E) - 1);        // m = Zeitpunkt, bei dem die Folge am engsten sein soll (z. B. 250)
u   = Math.sqrt((v + rho) * Math.log((v + rho) / (alpha*alpha*rho)));
radius = u / n;                                           // CS fuer den Mittelwert: xbar ± radius
```
(l0 = 1 gesetzt; im Paper (14) steht ein Parameter l0 für die Aufteilung der Fehlerwahrscheinlichkeit.) W₋₁ per Newton: w ← w − (w·eʷ − x)/(eʷ(w+1)), Start w = ln(−x) − ln(−ln(−x)); das Rechenbeispiel im Skript (m/ρ = 8,212 bei α = 0,05) stimmt mit dem Paper-Wert u(m)/√m ≈ 3,0 überein. Einseitig: nahezu gleich mit 2α (Paper). Radien siehe B3.

CUSUM (Page; **WISSEN**, nicht aus gelesener Quelle; für „Edge ist weg"-Alarm bei bekannter Soll-Wirkung μ1 und σ):
```js
S = Math.max(0, S + (mu1/2 - x));   // Abwärts-CUSUM: Alarm wenn S > h ; Referenzwert k = mu1/2
```
h so wählen, dass die mittlere Lauflänge unter Wirkung = μ1 (Fehlalarm) hoch genug ist; Kalibrierung per Monte-Carlo im Skript, keine Quelle für Zahlen gelesen.

**E5. Bayessche Schrumpfung (Normal-Normal; Standard, eigene Herleitung; Formel exakt, Eingaben sind Annahmen)**
```js
// Rückblick: Wirkung xbt (Pp/Tag), SE_bt.  Prior fuer die wahre Live-Wirkung: Mittel mu0 = c * xbt, Std tau.
// c aus D1: 0.42..0.74 (McLean/Pontiff), bei N getesteten Varianten zusaetzlich Selektionsabschlag
// Live: xbar_live ueber n Tage, SE_live = sigma/sqrt(n)
prec  = 1/(tau*tau) + 1/(SE_live*SE_live);
mu_p  = (mu0/(tau*tau) + xbar_live/(SE_live*SE_live)) / prec;
sd_p  = Math.sqrt(1/prec);
P_ueber_huerde = 1 - Phi((hurdle - mu_p)/sd_p);
```
Reines Rückblick-Schrumpfen (ohne Live-Daten): mu_p = k·xbt mit k = τ²/(τ² + SE_bt²) bei Prior-Mittel 0. Zahlenbeispiel (rein illustrativ, Annahmen: xbt = 0,30 Pp, c = 0,5, τ = 0,15, n = 250, xbar_live = 0,10, σ = 2,8): mu0 = 0,15; SE_live = 0,177; Posterior ≈ 0,129 ± 0,114 Pp — liegt damit unter jeder Kostenhürde ≥ 0,23 mit hoher Wahrscheinlichkeit.

**E6. Tracking-Abweichung Papier vs. Live (WISSEN, Standardverfahren; keine Quelle gelesen):** je Trade d_i = Live-Nettorendite_i − Papierrendite_i (gleiches Signal, gleicher Zeitpunkt); Test: t = mean(d)/ (sd(d)/√n_Cluster) gegen 0; Alarm, wenn mean(d) < −(Rest-Spielraum bis zur Hürde). Perold-Zerlegung in Verzögerung (Entscheidung→Auftrag), Marktauswirkung/Spread, Gebühren, Nichtausführung wäre zu protokollieren.

## F. Folgerungen für Fragen 1–4

Frage-Nummern aus dem Auftrag sind mir nicht bekannt; ich ordne nach Thema (1 Dauer, 2 Abbruch/Sequenz, 3 Umsetzung, 4 kleine Stichprobe/Prior) und bitte den Aufrufer, das ggf. umzubenennen.

1. **Dauer.** Mit σ ≈ 2,8 Pp/Tag (CLAUDE.md-Wert, nicht von mir geprüft) braucht man für 80 % Power gegen die Hürden: 0,23 Pp → ~920 Signaltage; 0,10 → ~4.850; 0,05 → ~19.400; 0,04 → ~30.300 (E2). Das stützt die bestehende Regel „< 1.000 Signaltage nicht bestätigbar". Mit nur 60 / 250 Tagen sieht man nur Effekte ≥ 0,90 / 0,44 Pp — darunter ist die Antwort „nicht entscheidbar", nicht „kein Effekt". MinTRL: wahrer SR 1 (annualisiert) braucht ~2,7 Jahre Tagesdaten, SR 0,5 ~10,8 Jahre (E1); Schiefe/Kurtosis verlängern das (Bessembinder: stark schief).
2. **Mehrfachtests.** Jede getestete Variante erhöht die Schwelle: erwartetes Max der Null bei N = 38 Varianten ≈ 2,2 Std der Versuchs-SR, bei N = 100 ≈ 2,5 (E3); MinBTL < 2 ln N / E[max]² (bei 5 Jahren höchstens ~45 Varianten, Bailey et al.). Harvey/Liu/Zhu: t > 3,0 statt 2,0 für neue Befunde; Abschlag bei Brutto-SR < 0,4 meist > 50 %.
3. **Abbruch.** (a) Wer zwischendurch nachsehen will: mSPRT oder Howard-Konfidenzfolge (jederzeit gültig); Preis ≈ 1,4–2 × so viele Beobachtungen wie Festprobe, Intervall bei n = 250 ≈ 1,55 × so breit (B2, B3, eigene Simulation). (b) SPRT spart ~37 % Beobachtungen unter der Alternative und ~56 % unter H0, braucht aber eine vorab festgelegte Alternative (B1). (c) Drawdown-Stopp ist keine statistische Entscheidung; unter Random Walk kostet er Rendite (Kaminski/Lo, nur Abstract gelesen) — als reine Risikobremse führen, nicht als „Edge widerlegt".
4. **Prior/Zerfall.** Für den Live-Erwartungswert aus einem Backtest ansetzen: 26–36 % Zerfall bei gut replizierten, über Jahrzehnte gemessenen Prädiktoren (McLean/Pontiff 26 %, Chen 20–36 %), 58 % nach Veröffentlichung; **−32 % ist die Differenz, kein eigener Abschlag**. Für eine selbst aus vielen Varianten gewählte kurzfristige Regel ist ein Abschlag > 50 % realistischer (Harvey/Liu, Bailey/LdP) — das ist eine Einschätzung, keine Messung. Bayes-Update (E5) bei kleiner Live-Stichprobe: Posterior bleibt nahe am Prior; Entscheid per Maximin: handeln erst, wenn die untere Konfidenzfolgen-Grenze über der Kostenhürde liegt.
5. **Umsetzung.** Es gibt keine mir bekannte Quelle mit einer Zahl für Retail-Schein-/CFD-Slippage; die institutionellen Kosten von Frazzini/Israel/Moskowitz (< 1/10 früherer Schätzungen) sind darauf nicht übertragbar. Papier-vs-Live-Abweichung deshalb selbst über n Trades messen (E6) und die Hürden aus CLAUDE.md nur als vorläufig behandeln.

Nicht belegt / offen: Kaminski/Lo-Zahlen; Barroso/Santa-Clara-Sharpezahlen; CUSUM-Kalibrierung; Ellis hat keine Zahl; Originalarbeiten von Wald und Page nicht gelesen; Lo (2002) Autokorrelations-Annualisierungsformel nicht übernommen (nur Abstract-Zahl 65 %).
