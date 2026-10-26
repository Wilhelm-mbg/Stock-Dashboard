# Familie 52-Wochen-Hoch-Nähe — Literaturbeleg (Stand 04.10.2026)

Kennzeichnung: **[G]** = im Volltext der Quelle gelesen, **[S]** = nur Abstract/Suchtreffer-Auszug, **[M]** = Gedächtniswissen, nicht belegt in dieser Sitzung.
Projektmessung zum Vergleich: Querschnittsprüfstand 2017–2026, Dezil, ~220 Werte, monatlich: netto −0,242 Pp/Monat, t −0,75, nicht entscheidbar (MDE ~1–1,8 Pp).

## 1. Exakte Regel (Originalquelle)

George & Hwang (2004), *J. Finance* 59(5), S. 2145 ff. [G] (Volltext: bauer.uh.edu/tgeorge/papers/gh4-paper.pdf)
- **Nähe:** P(i,t−1) / high(i,t−1); P = Schlusskurs am Ende von Monat t−1, high = Höchstkurs der 12 Monate bis zum letzten Tag von t−1 (S. 2149).
- **Rangbildung:** Winner = obere **30 %**, Loser = untere 30 % (kein Dezil), gleichgewichtet. Universum: **alle CRSP-Aktien**, Juli 1963–Dez. 2001 (kein Größenfilter im Basistest).
- **Haltedauer:** (6,6)-Strategie, d. h. 6 Monate halten, überlappende Teilportfolios (je 1/6 pro Monat). Robustheit (6,12), (12,6), (12,12).
- **Überspringmonat:** In den beschreibenden Tabellen I–IV **kein** Skip; in den Regressionstests (Fama-MacBeth) **ein Monat Skip** gegen Bid-Ask-Bounce (Fn. 3).
- Variante Li & Yu (2012, *JFE*): Nähe des **Dow** zum 52-Wochen-Hoch bzw. historischen Hoch als Marktzeit-Signal, nicht Einzelwert-Rang [S].
- Variante Bhootra & Hur (2013, *JBF* 37): **Zeitpunkt** des 52-Wochen-Hochs (Aktien mit jüngstem Hoch, oberes vs. unteres Dezil: 0,70 %/Monat) [S]. Bedingt auf Recency etwa doppelt so hohe Nähe-Erträge [S].
- Hinweis: Der Quantpedia-Eintrag „52-weeks high effect" ist eine **Branchen**-Variante (Top-6 von 20 Branchen, 3 Monate halten, 0,60 %/Monat Long-Short, 1963–2009, „Alpha im Out-of-Sample verfallend, leicht negativ") [S, quantpedia.com] — nicht die Einzelwertregel.

## 2. Berichtete Größe

- Original [G]: Tab. I, Winner 1,51 %, Loser 1,06 %, **Long-Short 0,45 %/Monat (t 2,00)**; JT-Momentum 0,48 % (t 2,35). Ohne Januar: 52wH **1,23 % (t 7,06)** vs. JT 1,07 %. Nur Januar: −8,27 % (t −5,49). Die Kante liegt also komplett außerhalb des Januars; die Short-Seite (Loser) trägt viel.
- Gewinnerportfolio allein: 1,51 % vs. 1,53 % (JT) — die Long-Seite unterscheidet sich vom Momentum kaum [G]. Kein Marktvergleich/Excess-Wert der Long-Only-Seite im Paper gelesen.
- Dominanz: In Fama-MacBeth-Regressionen mit JT-, MG- und 52wH-Dummies bleibt der 52wH-Dummy signifikant, JT wird verdrängt; Gewinne kehren langfristig nicht um [G/S]. Das ist eine Aussage über Erklärungskraft **innerhalb von Momentum**, nicht über Unabhängigkeit davon.
- **Nach Kosten / nach Veröffentlichung:**
  - Australien 1996–2008: Strategie unter Kosten, Leerverkaufsbeschränkung und Illiquidität „not of practical use" (Bettman, Sault, von Reibnitz 2010, *Austr. J. Management* 35(3)) [S]. Bei den liquiden Titeln positive Rohrenditen, bei illiquiden negative [S].
  - Internationale Märkte: Nach Transaktionskosten sind GH-Gewinne in den meisten Märkten nicht mehr signifikant (Suchtreffer-Zusammenfassung zu „The 52-week high momentum strategy in international stock markets", *J. Int. Money & Finance*, vermutlich Du/Hu bzw. Liu/Liu/Ma 2011) [S, nicht im Volltext geprüft].
  - Eine Suchzusammenfassung nannte für die USA „1980–2000 signifikant positiv, 2001–2014 signifikant negativ": **Quelle nicht eindeutig zuzuordnen, nicht verifiziert** — nur als Hinweis, nicht als Beleg zu behandeln.
  - McLean & Pontiff (2016, *J. Finance*): bei 97 Anomalien im Mittel −26 % außerhalb der Stichprobe, −58 % nach Veröffentlichung [S]; **nicht spezifisch** für 52wH.
- Large Cap: Keine Teilstichprobe Large Cap mit Kosten im Original gefunden. Alpha-Architect-Seite (52wH q-Faktor, GHL 2018) war per Abruf gesperrt (403).

## 3. Ehrliche Einschätzung (teils Gedächtnis/Urteil, markiert)

- **Eigenständigkeit:** Die Literatur nach 2004 zeigt 52wH als *Verfeinerung/Erklärung* von Momentum (Anker-Bias), nicht als davon getrennte Kante. Jeon & Byun (2023, *Financial Analysts Journal* 79(2)) behandeln 52wH als Bestandteil von Momentum-Crashes: ein 52wH-neutralisiertes Momentum dämpft Crashes [G-Abstract]. Eine belegte, **nach Veröffentlichung noch vorhandene, kostenfeste Large-Cap-Kante gefunden: nein.**
- **Korrelation zu 11-1-Momentum [M, Urteil]:** Long-Short-Renditen beider Strategien sind in US-Stichproben typischerweise sehr hoch korreliert (Größenordnung 0,7–0,9, nicht in dieser Sitzung belegt); Winner-Portfolios überlappen stark (Hoch-Nähe ≈ jüngst gestiegen). Als Ersatz für 11-1 oder als Zusatz ohne unabhängigen Beleg zählt sie nicht.
- **Wahrscheinlichkeit, SPY (mit Ausschüttungen) 2017–2026 nach 20 Bp je Seite mit ≤ 30 Positionen zu schlagen [Urteil, keine Messung]:** etwa 30–40 %, allenfalls um 40 % wegen langer Phase, in der Qualitäts-/Wachstums-Winner im Index führten; ≤ 30 Positionen bringen hohe Einzeltitelstreuung, Tracking-Error und Index-Konzentrationsrisiko. Der projekteigene Wert (−0,242 Pp/Monat) liegt im selben Sinn: Vorzeichen leicht negativ, nicht entscheidbar.
- **Erwartete Größe netto, Long-only vs. Marktbenchmark [Urteil]:** Spanne etwa −0,3 bis +0,2 Pp/Monat; Mittelpunkt nahe 0. Die Originalzahl 0,45 Pp/Monat ist Long-Short, voller CRSP-Raum (inkl. Kleinwerte) und vor Kosten; nach Veröffentlichung und bei Large Cap ist ein Bruchteil wahrscheinlicher (McLean-Pontiff-Größenordnung −58 % wäre ≈ 0,19 Pp/Monat, **weit unter** der projektüblichen MDE).
- Das Dow-Signal von Li & Yu (Marktzeitpunkt, nicht Auswahl) ist eine andere Regel und im Projektkontext (Einzeltitel-Dezil) nicht verwertbar.

## 4. Nicht belegt / offen

- Large-Cap-Teilstichprobe und Long-only-Überschuss gegen Markt mit Kosten für 2010–2026: **keine Quelle gefunden**.
- Genaue Korrelationszahl 52wH vs. 11-1: nur Gedächtnis.
- Herkunft der Aussage „2001–2014 negativ" (USA) nicht geklärt.
- Li & Yu 2012, Bhootra & Hur 2013, Internationalstudie, Bettman et al.: nur Abstract/Auszug, nicht im Volltext. ScienceDirect, Alpha Architect, Marquette-PDF lieferten 403/429.
- George/Hwang/Li 2018 (52wH q-Faktor), Hong–Lim–Stein-Nachbauten: nicht gelesen. Firecrawl-Guthaben fast leer.
- Keine eigene Messung; keine Zahlen aus dem Repo geprüft.

## Quellen
- George & Hwang 2004: https://www.bauer.uh.edu/tgeorge/papers/gh4-paper.pdf
- Li & Yu 2012: https://academicnewsletter.sufe.edu.cn/info/356820
- Bhootra & Hur 2013: https://ideas.repec.org/a/eee/jbfina/v37y2013i10p3773-3782.html
- Bettman et al. 2010: https://researchportalplus.anu.edu.au/en/publications/the-impact-of-liquidity-and-transaction-costs-on-the-52-week-high/
- Jeon & Byun 2023: https://epublications.marquette.edu/fin_fac/164
- Quantpedia (Branchenvariante): https://quantpedia.com/strategies/52-weeks-high-effect-in-stocks
- Internationale Studie: https://www.sciencedirect.com/science/article/abs/pii/S0261560610001099
