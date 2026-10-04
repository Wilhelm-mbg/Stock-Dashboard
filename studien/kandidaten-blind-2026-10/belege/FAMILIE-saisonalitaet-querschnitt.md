# Familie: Saisonalität im Querschnitt (Same-Calendar-Month)

Stand der Recherche: 04.10.2026. Simulation, keine Anlageberatung. Kennzeichnung: [Q] = in einer
abgerufenen Quelle gelesen, [G] = Gedächtniswissen (nicht geprüft), [S] = nur aus Suchtreffer-Zusammenfassung.

## 1. Exakte Regel mit Fundstelle

**Heston & Sadka (2008), JFE 87(2), 418-445** (Arbeitspapier-Text von der Sadka-Seminarseite gelesen [Q],
https://w4.stern.nyu.edu/finance/docs/pdfs/Seminars/063f-sadka.pdf):
- Universum: NYSE/AMEX (CRSP), Jan 1965 - Dez 2002; Renditen ab 1945 für bis zu 20 Jahre Rückblick. [Q]
- Regel: Im Monat t kaufe Aktien, deren Rendite in den *gleichen Kalendermonaten* früherer Jahre im oberen Zehntel
  lag (Beispiel im Text: April -> frühere Aprile), Halten 1 Monat. Gleichgewichtete Dezile. [Q]
- Rückblick-Intervalle getrennt: Jahr 1 (Lag 12), Jahre 2-5 (Lag 24/36/48/60), 6-10, 11-15, 16-20. [Q]
- Lag 12 allein: Dezil-Spread 115 Bp/Monat (alle Monate des Jahres 1: 146 Bp). Lags 24-60: 67 Bp; 6-10: 68 Bp;
  11-15: 66 Bp; 16-20: 52 Bp; "im Mittel über 50 Bp/Monat". Nicht-jährliche Monate: durchweg negativ. [Q]
- Die Regressions-Variante (Fama-MacBeth auf Lag k) nutzt Lags 12...240. [Q]

**Keloharju, Linnainmaa & Nyberg (2016), JF 71(4), 1557-1590** (NBER-Fassung w20815 gelesen [Q]):
- NYSE/AMEX/Nasdaq, Jan 1963 - Dez 2011 (Handel ab 1964). Sortierung nach dem **Durchschnitt der Rendite im
  gleichen Kalendermonat der letzten 20 Jahre** (Beispiel: März 1964 nach Mittel der Märze 1944-63);
  Long Top-Dezil / Short Flop-Dezil. [Q]
- Ergebnis: 1,19 % pro Monat Long-Short (t = 6,27), "13 % pro Jahr"; Andere-Monate-Strategie -0,96 %. [Q]
- Nach Kontrolle von Portfolio-Seasonalitäten (Größe, Branche u. a.) bleibt ein Alpha von 0,60-0,74 %/Monat. [Q]
- Branchen-/Merkmalsportfolios (17 Branchen, Top-2/Flop-2; Wertgewichtet): Branchenseasonalität Long-Short
  0,70 %/Monat (t = 3,79); Portfolios nach Größe 1,35 %/Monat. [Q]

**Bouman & Jacobsen (2002), AER 92(5)** "Halloween-Indikator": Marktzeitregel, Aktien Nov-Apr, sonst Zinsen.
Nur aus [G] bekannt; hier nicht nachgeprüft, und kein Querschnitts-Signal (Marktzeit, im Projekt ohnehin Klasse
"Marktzeitgeschäft").

## 2. Berichtete Größen

| Größe | Wert | Q |
|---|---|---|
| HS 2008 Dezil-Spread Lag 12 / 24-60 | 115 / 67 Bp je Monat, vor Kosten, gleichgewichtet, 1965-2002 | [Q] |
| KLN 2016 Dezil-Spread, 20-Jahres-Mittel | 119 Bp je Monat, 1963-2011 | [Q] |
| Umschlag | "nahezu 100 % je Monat" (HS), "fast 100 %" (KLN) | [Q] |
| Kostenhürde laut HS | Bei Umlaufkosten > 70 Bp lohnt es nicht; ihre eigene Einschätzung: "may not be generally profitable" | [Q] |
| KLN zu Kosten | Tages-Variante "infeasible wegen Handelskosten"; Monats-Variante "potenziell machbar", Kapazität höher als bei Short-Term-Reversal, "auch bei Large Caps"; Abmilderung nur durch Verzögern von Trades | [Q] |
| Long-only-Seite | In keiner gelesenen Quelle gesondert ausgewiesen (nur Long-Short-Spread) | nicht belegt |
| Large-Cap-Spread | Nicht als Zahl gelesen. KLN erwähnen nur "gilt auch für große Aktien" (Zahl nicht extrahiert) | nicht belegt |
| Nach Veröffentlichung (ab 2008) | Keine eigene Zahl für Saisonalität gefunden | nicht belegt |

Allgemeiner Rahmen (Chen & Velikov, JFQA 2023, Fed-Papier gelesen [Q], https://www.federalreserve.gov/econres/feds/files/2020039pap.pdf;
Suchtext [S]): Return Seasonality (Heston-Sadka 2008) steht in ihrer Liste von 204 Anomalien
(Monatsdaten-Klasse "M"). Über alle Anomalien: Rendite im Mittel 66 Bp/Monat brutto im Stichprobenzeitraum,
erwartet nach Kosten und Veröffentlichung etwa -3 Bp/Monat; nach Veröffentlichung/moderne Handelstechnik noch
etwa 30 Bp/Monat brutto, "Handelskosten fressen den Rest". Hochumschlags-Anomalien sind am stärksten betroffen.
Eine Einzelzahl für Seasonality habe ich dort nicht herausgelesen.
McLean & Pontiff (2016): im Mittel -35 % Rendite nach Veröffentlichung [S]; stärker bei leicht handelbaren Aktien.

International (Heston & Sadka 2010, JFQA 45; Li/Zhang/Zheng 2018, J. Empirical Finance) [S]: Effekt vor
allem in entwickelten Märkten, in Schwellenländern nicht bedeutsam; Zahlen nicht geprüft.

## 3. Ehrliche Einschätzung (eigene Schätzung, kein Messwert)

Aufgabe: SPY (mit Ausschüttungen) 2017-2026 nach 20 Bp je Seite mit höchstens 30 Positionen schlagen.

- Kostenrechnung: ~100 % Umschlag je Monat, 20 Bp je Seite = ca. 40 Bp je Monat = rund 4,8 % pro Jahr Abzug
  (eigene Rechnung). Das liegt unter der HS-Schwelle 70 Bp, aber die Netto-Kante bleibt dünn.
- Long-only halbiert grob die Spanne (nur die Gewinnerseite); bei 30 Large-Cap-Titeln ist das Dezil statt
  ~10 % nur ein sehr rauschiges Auswahlfenster. Die 20-Jahres-Rückschau verlangt zudem 20 Jahre Historie je Titel
  (HS: unter 30 % der Firmen haben sie).
- Der Wirkungsstand nach 2008 ist ungeklärt; die Gesamtliteratur (McLean-Pontiff, Chen-Velikov) spricht für starken
  Rückgang bei hochumschlägigen Large-Cap-Anomalien. Die Mühle (MDE, Tor 2) dürfte das Large-Cap-Long-only-Signal
  ohnehin als strukturell blind einstufen, wenn wenige Signaltage/Titel vorliegen.
- **Wahrscheinlichkeit, SPY zu schlagen: etwa 5 %, Spanne 2-12 %.** Hauptrisiko: der Netto-Effekt (unter 0,3 Pp/Monat
  nach Kosten, falls überhaupt vorhanden) liegt unter der Auflösung der Mühle, und das Marktbeta der Gewinnerseite
  (Januar/Dezember-Klumpung, Größenneigung) wird als "Saisonalität" fehlgedeutet. Zweites Risiko: SPY 2017-2026 war
  durch wenige Megacaps getrieben; ein 30-Titel-Equal-Weight-Korb liegt dagegen oft hinten.

## 4. Nicht belegt

- Long-only-Dezil-Rendite getrennt vom Short-Bein (weder HS noch KLN gelesen mit dieser Zahl).
- Spread nur für Large Caps (NYSE-Median/Top-Terzil) und Nettorendite nach Kosten in den Originalarbeiten.
- Saisonalität nach 2008 in den USA: keine unabhängige Nachbildung mit Zahlen für 2010-2026 gefunden
  (Suchen zu Chen-Zimmermann/Jensen-Kelly-Pedersen-Faktorlisten lieferten keine Einzelzahlen).
- Zahlen zu Halloween/Sell in May nach 2002 (nur Gedächtnis).
- Das AQR-Hosting der KLN-Fassung und der Li/Zhang/Zheng-Text waren nicht abrufbar bzw. 404; der Journal-Text
  von HS 2008 war paywall (gelesen wurde die Arbeitspapierfassung, Zahlen können in der Endfassung abweichen).
- Die Zahl "85 % Rückgang für Large Caps nach 2005" aus einem Suchtreffer (arXiv 2607.06502) wurde nicht
  geprüft und gilt nicht als Beleg.

## Quellen

- Heston & Sadka 2008: https://www.ssrn.com/abstract=687022 ; Text: https://w4.stern.nyu.edu/finance/docs/pdfs/Seminars/063f-sadka.pdf
- Keloharju, Linnainmaa, Nyberg 2016: https://www.nber.org/papers/w20815.pdf
- Chen & Velikov 2023: https://www.federalreserve.gov/econres/feds/files/2020039pap.pdf
- Heston & Sadka 2010: https://resolve.cambridge.org/core/journals/journal-of-financial-and-quantitative-analysis/article/seasonality-in-the-cross-section-of-stock-returns-the-international-evidence/449422A711AB698236AD46F6BA7414D6
