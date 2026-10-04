# REGEL — Drei klassische Trendfilter gegen den S&P 500 nach Kosten (Faber 10 Monate, Antonacci GEM, 200 Tage)

Kennung `trendfilter-messung-2026-10/v1`. Geschrieben am 05.10.2026 um 00:31 (Uhr aus `date`), **bevor ein einziger Kurs
geladen wurde**, und als erstes allein committet (Siegel). Nach dem Siegel wird an dieser Datei nichts geändert; was nicht geht,
wird in `ERGEBNIS.md` unter „Korrekturen“ gemeldet, nicht hier angepasst. Beschreibende Messung nach einer vorher festgelegten
Entscheidregel. Simulation mit virtuellem Kapital, **keine Anlageberatung**, vor Steuern.

Maßstab des Projekts (Wilhelm, 04.10.2026): echtes Geld nur für etwas, das **nach Kosten den S&P 500 schlägt**. Die drei Regeln
unten brauchen nur eine Handvoll ETFs und versprechen vor allem **Schutz** vor großen Rückschlägen; das wird fair mitberichtet
(§8), das Urteil fällt aber allein nach §5.

## §1 Die drei Regeln — Quellen und Parameter (genau wie im Original, nichts optimiert)

| | Regel | Quelle | Parameter aus der Quelle |
|---|---|---|---|
| **R1** | **Faber 10 Monate** | Mebane T. Faber, „A Quantitative Approach to Tactical Asset Allocation“, *The Journal of Wealth Management*, Frühjahr 2007 (Arbeitspapier SSRN 962461, Mai 2006) | Monatsschluss über dem 10-Monats-Durchschnitt der Monatsschlüsse → Aktien halten, darunter → Geld. Nur am letzten Tag des Monats geprüft. Reihen als **Gesamtertrag** (mit Ausschüttungen). Geld im Original: 90-Tage-Geldmarktpapiere. Ein- und Ausstieg im Original zum Schluss des Signaltags, ohne Kosten und Steuern. |
| **R2** | **Antonacci „Global Equities Momentum“ (GEM)** | Gary Antonacci, *Dual Momentum Investing: An Innovative Strategy for Higher Returns with Lower Risk*, McGraw-Hill 2014, Abschnitt „Global Equities Momentum“ | Monatlich; Rückblick **12 Monate Gesamtertrag**. Absolutes Momentum: S&P 500 gegen US-Schatzwechsel. Liegt der S&P 500 vorn: der stärkere aus S&P 500 und Nicht-US-Aktien (MSCI ACWI ex US); sonst US-Anleihen (Barclays US Aggregate). |
| **R3** | **200-Tage-Durchschnitt** | Jeremy J. Siegel, *Stocks for the Long Run*, 5. Aufl., McGraw-Hill 2014, Kapitel zur technischen Analyse („Investing with the Trend“; Dow Jones 1886–2012) | Täglich geprüft am Schlusskurs des **Kursindex** gegen seinen 200-Tage-Durchschnitt; Kauf, wenn der Schluss **mindestens 1 % über** dem Durchschnitt liegt, Verkauf, wenn er **mindestens 1 % darunter** liegt (Band gegen Hin-und-her); außerhalb des Marktes Schatzwechsel. |

**Was nachgesehen ist und was nicht (05.10.2026, vor dem Siegel):** R1 — der Regeltext des Papiers (Kauf über / Verkauf unter dem
10-Monats-Durchschnitt, Ein- und Ausstieg zum Schluss des Signaltags, Gesamtertragsreihen, Geld = 90-Tage-Geldmarktpapiere, ohne
Kosten) ist über die Dokumentation von `quantstrat::stratFaber` gelesen, die das Papier wörtlich zitiert. R3 — das 1-%-Band und der
Zeitraum 1886–2012 sind über Zusammenfassungen des Buchs gelesen; „außerhalb Schatzwechsel“ ist aus dem Gedächtnis des Modells.
R2 — das Buch selbst ist **nicht** nachgesehen; die Regel folgt dem Wortlaut des Auftrags, der mit dem Ablaufbild des Buchs
übereinstimmt, soweit es das Modell erinnert. Zusammenfassungen im Netz sind uneins, ob das absolute Momentum auf den S&P 500 oder
auf den Gewinner des Vergleichs angewandt wird; die zweite Lesart läuft deshalb nachrichtlich mit (§7, N5) und entscheidet nichts.

**Umsetzung mit ETFs (die Abweichungen vom Original, bewusst und für alle gleich):**

| Rolle | Hauptlesart (entscheidet) | Ersatzreihe (Zusatz 2003–2026 und nachrichtlich N2) | Original |
|---|---|---|---|
| Aktien USA, Maßstab | **SPY** | SPY | S&P 500 (R1, R2), Dow Jones (R3) |
| Geld in der Pause / Schatzwechsel | **BIL** (1–3-Monats-Schatzwechsel, seit 2007) | **SHY** (1–3-jährige Staatsanleihen, seit 2002) | Geldmarktpapiere bzw. Schatzwechsel |
| Nicht-US-Aktien (R2) | **ACWX** (MSCI ACWI ex US, seit 2008) | **EFA** (MSCI EAFE, seit 2001) | MSCI ACWI ex US |
| US-Anleihen (R2) | **AGG** | AGG | Barclays US Aggregate |

Weitere Abweichungen: **Handel zur Eröffnung des nächsten Handelstags** statt zum Schluss des Signaltags (ein Schlusskurs ist erst
bekannt, wenn er feststeht; das Original zum Schluss läuft nachrichtlich mit, §7 N1); **20 Basispunkte je Seite** auf jedes
gehandelte Volumen (Originale ohne Kosten; ohne Kosten nachrichtlich, N4); R3 auf SPY statt auf dem Dow Jones.

## §2 Daten

1. **Quelle:** die öffentliche Chart-Schnittstelle von Yahoo, je Kürzel ein Abruf
   `https://query1.finance.yahoo.com/v8/finance/chart/<KÜRZEL>?period1=0&period2=<jetzt>&interval=1d&events=div%2Csplits&includeAdjustedClose=true`
   (bei Fehler derselbe Abruf über `query2`). Kürzel: **SPY, BIL, SHY, ACWX, EFA, AGG**. Ladeskript `laden.js`.
2. **Rohdaten werden nicht committet** (Daten Dritter, öffentliches Repo). Sie liegen in `daten/` (in `.gitignore`) oder einem mit
   `--daten` genannten Ordner. Committet werden `laden.js`, `pruefsummen.json` (SHA-256 jeder Rohantwort und eines kanonischen
   Auszugs bis 15.09.2026, Zeilenzahl, erster und letzter Tag), Skripte und Ergebnisse.
3. **Benutzte Felder:** `timestamp`, `indicators.quote[0].open` und `.close` (bei Yahoo um Splits bereinigt, **nicht** um
   Ausschüttungen), `events.dividends` (Betrag, `date` = Ex-Tag), `events.splits`. `adjclose` dient **nur der Datenprüfung**, nie
   dem Rechner. Handelstag = Kalenderdatum des Zeitstempels in New York (`America/New_York`). Alles nach dem **15.09.2026** wird
   abgeschnitten (Kurse und Ex-Tage).
4. **Kalender** = die Handelstage von SPY (Zeilen mit Schlusskurs). **Monatsende** = letzter SPY-Handelstag eines Kalendermonats.
5. **Gesamtertragsindex** (nur für Signale): `TR(t) = TR(t−1) × (C(t) + D(t)) / C(t−1)`, `TR` = 1 an der ersten Zeile der Reihe,
   `C` Schlusskurs, `D(t)` Summe der Ausschüttungen mit Ex-Tag t. Ein Ex-Tag ohne Zeile der Reihe wird am nächsten Tag mit Zeile
   gebucht (gezählt, Erwartung 0).
6. **Datenprüfung vor dem Lauf** (eigener Prüfer, `datenpruefung.js`): Lücken gegen den SPY-Kalender, doppelte und
   Wochenend-Tage, fehlende oder nicht positive Kurse, Sprünge, Splits, Ausschüttungen je Jahr, Gesamtertrag aus Schluss +
   Ausschüttung gegen `adjclose`, Abgleich mit einer zweiten Quelle wo vorhanden (Alpaca-Minutenarchiv und Alpaca-Maßnahmen auf
   `E:` ab 2016, nur lesen). **Die Prüfung ändert keine Kurse.** Findet sie einen Fehler, der eine Zahl des Urteils berühren kann,
   wird er in `ERGEBNIS.md` genannt und seine Wirkung nachrichtlich gerechnet (mit dem Wert der zweiten Quelle an der Stelle);
   das Urteil bleibt auf den Yahoo-Daten.

## §3 Rechenregeln (für alle drei Regeln gleich)

1. **Buch:** Startkapital **100.000 $**, immer **genau eine** Reihe gehalten, Stückzahl ungerundet (Gleitkomma), Bewertung täglich
   zum Schluss.
2. **Erstkauf** zur **Eröffnung des Starttags** s in die Reihe, die die Regel für diesen Tag vorschreibt (§4.4):
   `Stück = 100.000 / (O × 1,002)`.
3. **Wechsel** zur **Eröffnung des Ausführungstags** (erster SPY-Handelstag nach dem Signal): Verkauf `Erlös = Stück_alt × O_alt × 0,998`,
   Kauf `Stück_neu = Erlös / (O_neu × 1,002)`. **Kosten = 20 Basispunkte je Seite** = 0,002 × gehandeltes Volumen. Ein Wechsel ist
   jede Änderung der gehaltenen Reihe (ein Verkauf + ein Kauf); der Erstkauf zählt nicht als Wechsel.
4. **Ausschüttungen:** Anspruch nach der Stückzahl zum **Schluss des Vortags** des Ex-Tags (ein Verkauf zur Eröffnung des Ex-Tags
   zählt noch, ein Kauf zur Eröffnung des Ex-Tags nicht). Betrag = Stück × Ausschüttung; gutgeschrieben am **Schluss des Ex-Tags** und
   sofort **ohne Kosten** zum Schlusskurs in die dann gehaltene Reihe angelegt. Reihenfolge an jedem Tag: (1) Wechsel zur Eröffnung,
   (2) Ausschüttungen des Tages, (3) Bewertung zum Schluss.
5. **Fehlende Kurse:** fehlt an einem Handelstag der Eröffnungskurs einer zu handelnden Reihe (keine Zeile, `null`, ≤ 0), wird zum
   Schlusskurs desselben Tages gehandelt; fehlt auch der, am nächsten Tag mit Kurs. Fehlt einer gehaltenen Reihe der Schlusskurs,
   gilt ihr letzter Schlusskurs. Jeder Fall wird gezählt; Erwartung in den Fenstern A und B: **0**.
6. **Maßstab:** SPY, Kauf zur Eröffnung desselben Starttags **ohne Kosten** (`Stück = 100.000 / O`), Ausschüttungen wie Nr. 4 (wieder
   in SPY zum Schluss des Ex-Tags), Bewertung zum Schluss (wie im amtlichen Rückblick Nr. 74: Maßstab ohne Kosten).
7. **Ende:** Wert zum Schluss des letzten Fenstertags, **ohne** Verkaufskosten auf beiden Seiten.
8. **„Vorn“** heißt strikt: Endwert der Regel > Endwert SPY (ungerundet). **p. a.** = `(Endwert / 100.000)^(365,25 / Tage) − 1`,
   Tage = Kalendertage vom Starttag bis zum Endtag; **Abstand** = p. a. der Regel − p. a. von SPY, in Prozentpunkten (Pp).
9. **Median** über eine gerade Zahl von Werten = Mittel der beiden mittleren.

## §4 Die Regeln im Einzelnen

1. **R1 Faber.** An jedem Monatsende M: `P = TR_SPY(M)`, `SMA10 = Mittel von TR_SPY` an den **zehn** Monatsenden M, M−1, …, M−9
   (M eingeschlossen). `P > SMA10` → **SPY**, sonst → **Geld** (BIL). Ausführung zur Eröffnung des ersten Handelstags nach M.
2. **R2 GEM.** An jedem Monatsende M für X ∈ {SPY, Geld, Nicht-US}: `r_X = TR_X(M) / TR_X(M₋₁₂) − 1`, M₋₁₂ = Monatsende zwölf
   Kalendermonate vor M. Wenn `r_SPY > r_Geld`: **SPY**, falls `r_SPY ≥ r_Nicht-US`, sonst **Nicht-US** (ACWX); andernfalls **AGG**.
   Ausführung zur Eröffnung des ersten Handelstags nach M. Fehlt einer Reihe der Wert an M₋₁₂, ist die Regel an M nicht
   berechenbar (in A und B Erwartung: nie).
3. **R3 200 Tage.** An jedem Handelstag d zum Schluss: `SMA200(d)` = Mittel der SPY-**Schlusskurse** (Kurs, nicht Gesamtertrag, wie
   der Kursindex im Original) der 200 Handelstage bis einschließlich d. Zustand „investiert“: wird verlassen, wenn
   `C(d) ≤ 0,99 × SMA200(d)`; Zustand „draußen“: wird verlassen, wenn `C(d) ≥ 1,01 × SMA200(d)`. Investiert → **SPY**, draußen →
   **Geld** (BIL). Ausführung zur Eröffnung von d+1. **Anfangszustand:** am ersten Tag mit 200 SPY-Schlusskursen „investiert“, wenn
   `C > SMA200`, sonst „draußen“; ab da läuft der Zustand ununterbrochen fort (er hängt nur an der Geschichte, nicht am Starttag).
4. **Starttag mitten in der Regel:** die Regel hält am Starttag s die Reihe, die das **letzte Signal vor s** vorschreibt (R1, R2:
   das letzte Monatsende vor s; R3: der Zustand nach dem Schluss von s−1). Diese Reihe wird zur Eröffnung von s gekauft (§3.2).

## §5 Fenster, Starttage und die Entscheidregel

1. **Fenster A:** erster Starttag **04.01.2017**, Ende Schluss **15.09.2021**. **Fenster B:** erster Starttag **16.09.2021**, Ende
   Schluss **15.09.2026**.
2. **Verschobene Starttage (alle eines Monats):** jeder SPY-Handelstag d mit 04.01.2017 ≤ d < 04.02.2017 (A) bzw. 16.09.2021 ≤ d <
   16.10.2021 (B); Ende für alle gleich. Erwartung je 22 Starttage (am Kalender zu prüfen, gemeldet wird die Zahl). Der erste heißt k = 0.
3. **Entscheidregel „schlägt SPY“ (vom Auftraggeber vorgegeben, wörtlich angewandt):** eine Regel **schlägt SPY**, wenn in
   **beiden** Fenstern A und B alle drei Bedingungen gelten:
   - (a) beim Start am ersten Tag (k = 0) **vorn**;
   - (b) in **mindestens 70 %** der Starttage vorn (Anzahl vorn / Zahl der Starttage ≥ 0,70; k = 0 zählt mit);
   - (c) **Median** des Abstands (Pp p. a.) über alle Starttage **> 0**.

   Sonst: **„schlägt SPY nicht“**, mit Nennung jeder verfehlten Bedingung. Es entscheidet nur die Hauptlesart (BIL, ACWX, AGG,
   Handel zur nächsten Eröffnung, 20 Basispunkte, R3 mit 1-%-Band). Zusatz, Placebo und alle nachrichtlichen Lesarten entscheiden
   nichts.

## §6 Placebo: gleiche Zahl Wechsel zu zufälligen Zeitpunkten

Je Regel und Fenster (A, B) beim Start am ersten Tag: **1.000 Zufallsläufe**. Jeder Lauf hält **dieselbe Folge von Reihen** wie die
Regel (Startreihe a₀, nach dem j-ten Wechsel aⱼ) mit **derselben Zahl W von Wechseln**, aber zu **zufälligen Tagen**: W verschiedene
Tage, gleichverteilt ohne Zurücklegen gezogen aus den Tagen, an denen die Regel überhaupt wechseln kann (R1, R2: erster Handelstag
jedes Monats nach s bis zum Ende; R3: jeder Handelstag nach s bis zum Ende), aufsteigend sortiert. Kosten, Ausschüttungen, Bewertung
wie §3. Zufallsgenerator: `mulberry32`, Saat = FNV-1a-32 der Zeichenkette `trendfilter-2026-10|<R1|R2|R3>|<A|B>`, **einmal** je
Regel und Fenster angelegt (außerhalb der Schleife über die Läufe). Berichtet: Median und 5-/95-%-Punkt des Abstands zu SPY, Anteil
der Läufe vor SPY, **Zahl der Läufe mit höherem Endwert als die Regel**. Ist W = 0, ist das Placebo die Regel selbst; das wird
gesagt. Das Placebo steht in derselben Tabelle wie die Regel.

## §7 Zusatz und nachrichtliche Lesarten (entscheiden nichts)

1. **Zusatz 2003–2026, alle rollierenden 5-Jahres-Fenster:** Starttag s = jeder SPY-Handelstag vom **ersten möglichen Tag** bis
   16.09.2021; Ende e(s) = letzter SPY-Handelstag ≤ (gleiches Datum fünf Jahre später − 1 Kalendertag; JavaScript-`Date.UTC`-Rechnung,
   ein 29.02. wird zum 01.03. und dann zum 28.02.). Reihen: **Ersatzreihen** (Geld = SHY, Nicht-US = EFA) durchgehend, weil BIL und
   ACWX erst 2007/2008 beginnen; sonst alles wie §3/§4. **Erster möglicher Tag** = erster SPY-Handelstag nach dem ersten Monatsende,
   an dem alle drei Regeln mit diesen Reihen ein Signal haben **und** AGG einen Schlusskurs hat (Erwartung: 01.10.2003; AGG handelt
   seit Ende September 2003). Berichtet: Zahl der Fenster, Anteil vorn, Median / Minimum / Maximum / 10-%- und 90-%-Punkt des
   Abstands, größter Rückschlag (Median über die Fenster, Regel und SPY, und der schlechteste), Anteil der Fenster mit flacherem
   Rückschlag als SPY, dasselbe je Startjahr. Dazu **ein Gesamtlauf** vom ersten möglichen Tag bis 15.09.2026 mit allen Kennzahlen
   aus §8. Die Fenster überlappen fast vollständig und sind **kein** unabhängiger Nachweis.
2. **Nachrichtlich in A und B** (k = 0 im Einzelnen, über alle Starttage zusammengefasst):
   - **N1** Ausführung wie im Original **zum Schluss des Signaltags** (Erstkauf weiter zur Eröffnung von s; Wechsel am Schluss des
     Endtags entfallen; Anspruch auf Ausschüttungen nach der Stückzahl zum Schluss des Vortags nach einem Wechsel zum Schluss);
   - **N2** Ersatzreihen SHY statt BIL und EFA statt ACWX;
   - **N3** (nur R3) ohne Band: `C(d) > SMA200(d)` → SPY, sonst Geld, ohne Gedächtnis;
   - **N4** ohne Kosten;
   - **N5** (nur R2) absolutes Momentum auf den Gewinner angewandt: Gewinner G = SPY, falls `r_SPY ≥ r_Nicht-US`, sonst Nicht-US;
     `r_G > r_Geld` → G, sonst AGG.

## §8 Berichtsgrößen

Je Regel und Fenster beim Start am ersten Tag, Regel und SPY nebeneinander: Endwert, p. a., Abstand; **größter Rückschlag** auf
Tagesschlüssen (Spitze beginnt mit dem Startkapital); **längste Zeit unter Wasser** = längste Strecke in Kalendertagen vom Tag eines
Höchststands (der Starttag zählt als Höchststand des Startkapitals) bis zum ersten Tag, an dem der Wert ihn wieder erreicht
(≥); wird er bis zum Ende nicht erreicht, endet die Strecke am Endtag und heißt „nicht erholt“; dazu der **Anteil der Handelstage
unter Wasser**. **Wechsel** gesamt und **je Jahr** (Wechsel / (Tage / 365,25)) — nach deutscher Abgeltungsteuer ist jeder Wechsel ein
Verkauf, also ein Steuerereignis (hier nicht modelliert) —, die Liste aller Wechsel (Ausführungstag, von, nach), gezahlte Kosten,
Anteil der Tage je gehaltener Reihe, Kalenderjahre (Regel / SPY; erstes Jahr gegen das Startkapital, letztes bis zum Endtag). Über
die Starttage: Minimum, Median, Maximum des Abstands, Zahl und Anteil vorn, Spanne des größten Rückschlags.

## §9 Zweiter Rechner und Ablauf

1. **Zweiter, unabhängiger Rechner** für den Start am ersten Tag in A und B, alle drei Regeln, Hauptlesart: liest nur diese Datei und
   die Rohantworten (eigener Leser, eigener Gesamtertragsindex, eigene Signale, eigenes Buch; den Code der Regel-Rechner liest er
   nicht). Abnahme: **Endwerte von Regel und SPY auf den Cent gleich**, Zahl und Tage der Wechsel gleich. Weicht etwas ab, wird die
   Ursache bis zur Stelle gesucht, benannt, behoben, der Lauf wiederholt und unter `korrekturen` in `ergebnis.json` vermerkt.
2. **Ablauf:** dieses Siegel → `laden.js` (Abruf, Prüfsummen) → Datenprüfung → Rechner, Tests (`test.js`), zweiter Rechner → **ein
   Lauf** → `ERGEBNIS.md` (Kurzfassung oben, höchstens 15 Zeilen), `ergebnis.json`. Kein anderes Fenster, keine andere Länge, kein
   anderes Band, keine weitere Reihe. Ein Ergebnis, das nicht gefällt, ist kein Fehler.

## §10 Erwartung (Vermutung des Modells, aus dem Gedächtnis, nicht nachgeschlagen — steht hier, damit sie später nicht passend gemacht wird)

Trendfilter bleiben in langen Aufwärtsphasen hinter Kaufen-und-Halten zurück (Kosten, verspäteter Wiedereinstieg) und gewinnen in
langen Abschwüngen (2000–2002, 2008). 2017–2026 hatte zwei schnelle Einbrüche (Ende 2018, Frühjahr 2020) und einen langen (2022).
Vermutung: alle drei **„schlägt SPY nicht“**, mit flacherem Rückschlag vor allem in den Zusatzfenstern, die 2008 enthalten.
