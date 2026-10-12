# Umkehr nach einer Serie von Minustagen, long (Ideen-Agent, 13.10.2026)

Kandidat aus dem Ideen-Vorrat, Eintrag 2 (`pruefstrasse/ideen-vorrat.md`). Das Vorab-Urteil dort lautete „einstellbar, sobald der
Volltext die Größe und n liefert“. Der Volltext ist frei (CC-BY), wurde heute gelesen und liefert beides. Alles Simulation mit
virtuellem Kapital, keine Anlageberatung.

## Regel (Prosa)

Fällt eine Aktie an **fünf oder mehr Handelstagen in Folge**, kauft die Regel sie zur Eröffnung des nächsten Handelstags und verkauft
sie zur Eröffnung des darauffolgenden Tags (H1).

- **Folge:** Gezählt wird rückwärts ab dem Signaltag i, solange die Tagesrendite c(j)/c(j−1) − 1 ≤ 0 ist. Ein Plustag beendet die
  Folge, ebenso ein fehlender Wert oder der Reihenanfang.
- **Nulltage** verlängern eine laufende Folge, eröffnen aber keine. Die Quelle sagt in §5.1: „I append the zero-return days to the
  sequences“. Nulltage am Anfang der Folge zählen deshalb nicht mit. Gezählt wird bis einschließlich des frühesten echten Minustags.
- **Signal:** Länge ≥ 5 → long. Die Folge wird auf den Renditen der Aktie selbst gebildet, nicht marktbereinigt. Die Quelle sagt
  dazu in §5.1: „when defining the sequences … I consider the raw daily stock returns“. „Raw“ heißt hier ohne Marktbereinigung. Die
  Kurse sind bereinigte Yahoo-Kurse (§4), also passt `c` der Sicht. `roh` und `markt` werden nicht gebraucht.
- **Einstieg und Ausstieg** folgen der Tag-Form: Einstieg zur Eröffnung von i+1, Ausstieg zur Eröffnung von i+2. Der Cooldown von
  5 Tagen gilt wie im Adapter. Läuft eine Folge weiter, feuert sie frühestens nach 5 Tagen wieder; das entspricht Spalte „7 days or
  more“ der Quelle.

**Abweichung von der Quelle, mit Absicht.** Die Quelle misst die abnormale Rendite am Folgetag von Schluss zu Schluss, also
c(i) → c(i+1). Die Tag-Form steigt erst zur Eröffnung von i+1 ein. Der Anteil, der über Nacht zwischen c(i) und o(i+1) anfällt, ist
damit nicht handelbar. Gemessen wird die Frage: Was bleibt für einen Einstieg zur Eröffnung übrig? Genau das ist die Frage des
Anlegers.

**Nur die Long-Seite.** Die Quelle belegt auch die Umkehr nach Plus-Folgen. Short ist für den Privatanleger mit Kassa-Aktien nicht
der Maßstab. Deshalb ist die Short-Seite nicht Teil des Kandidaten.

## Parameter (alle aus der Quelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Folgenlänge `folgeMin` | 5 | Tabelle 1 Panel B, Spalte „5 days“ (+0,343 %, p < 5 %). Die Quelle führt die Längen 3, 4, 5, 6 und 7+. Gewählt wurde **vor jeder Messung** nach Auflösung, nicht nach Größe (Abschnitt Machbarkeit): Bei 3 und 4 ist die Quelle nur auf dem 10-%-Niveau signifikant. 7+ ist die Handelsstrategie der Quelle, hat aber nur rund 2.600 Signale, damit läge die MDE80 auf der Höhe des Doppelten der Behauptung. 5 ist die kürzeste Länge mit p < 5 % in allen Größengruppen außer „High“. |
| Nulltage | verlängern, eröffnen nicht | §5.1 |
| Renditen der Folge | Aktie selbst, bereinigte Schlüsse | §4, §5.1 |
| Haltedauer | 1 Tag | Tabelle 1 misst den Folgetag. Auch die Strategie der Quelle (§5.1) schichtet täglich um. |
| Klassen | 1, 2, 3 | Die Quelle nutzt S&P-500-Werte. Die Klasse 0 (5–50 Mio $) liegt außerhalb ihres Universums. |

**Eine einzige Konfiguration** (H1). Längere Haltedauern hat die Quelle nicht gemessen, deshalb gibt es sie hier nicht.

## Beleg

**Quelle:** Andrey Kudryavtsev, „The Effect of Preceding Sequences on Stock Returns“, *European Financial and Accounting Journal*
12(4) (2017) 83–96, DOI 10.18267/j.efaj.202. Volltext: https://efaj.actavia.vse.cz/pdfs/efa/2017/04/06.pdf, Abstract:
https://ideas.repec.org/a/prg/jnlefa/v2017y2017i4id202p83-96.html, beide abgerufen 2026-10-12 (UTC). Das PDF wurde mit `pdftotext`
gelesen.

- **Stichprobe:** Werte des S&P 500 zum Stand 31.12.2016, Tagesdaten 1990–2016 von Yahoo, 2.425.650 Aktientage. Die abnormale
  Rendite ist die eines Marktmodells gegen den S&P 500, Schätzfenster 250 Tage. Laut Fn. 1 sind die Ergebnisse mit
  marktbereinigten Renditen und mit FF3+Momentum qualitativ gleich.
- **Größe, brutto, Folgetag nach Minus-Folgen (Tabelle 1 Panel B):** 3 Tage +0,234 % (142.839 Fälle), 4 Tage +0,285 % (62.178),
  **5 Tage +0,343 %** (26.469), 6 Tage +0,409 % (11.093), 7+ Tage +0,485 % (4.452).
- **Nach Größe (Tabelle 2 Panel B, 5 Tage):** klein +0,397, mittel +0,344, **groß +0,288**.
- **Regression mit Kontrollen** (Tabelle 5; kontrolliert für Börsenwert, Beta, Vorjahresrendite, Volatilität, Vortagesrendite
  und Markttag): **NEG5 +0,277 (t 2,84)**, NEG7plus +0,384 (t 4,13).
- **Kosten:** Die Strategie 7+ long/short mit 0,05 % je Seite bringt laut Quelle 16,68 % p. a. gegen 7,01 % für den S&P 500
  (§5.1). Ein Nettobeleg je Umlauf liegt nicht vor.
- **Regel 2, Brutto-Weg:** +0,343 Pp (große Werte +0,288) je Umlauf. Das Dreifache der Kassa-Hürde für die Klassen 1, 2 und 3 ist
  0,255 / 0,195 / 0,135 Pp. Die Zahl liegt in allen drei Klassen darüber. Das gilt für die Quelle, also von Schluss zu Schluss.

**Warnungen zur Quelle, im Protokoll mitzulesen:**

1. **Die Statistik ist in sich widersprüchlich.** Tabelle 1 nennt eine Standardabweichung von 1,09 % bei 26.469 Fällen. Das ergäbe
   für +0,343 % ein t von rund 50, die Tabelle meldet aber nur p < 5 %. Tabelle 4 nennt eine Standardabweichung der Tagesrendite von
   0,876 %, das ist für S&P-500-Einzelwerte unplausibel klein (eher 1,5–2,5 %). Ein R² von 0,235 für Tagesrenditen ist ebenfalls
   ungewöhnlich hoch. Die Richtung ist mit der Literatur zur Kurzfrist-Umkehr vereinbar, die Zahlen sind es nicht verlässlich.
2. **Überlebensverzerrung:** Die Stichprobe besteht aus den Mitgliedern von Ende 2016, rückwirkend bis 1990.
3. **Kein Nachbau nach 2010 gefunden.** Die Stichprobe der Quelle reicht bis 2016, sie überdeckt die Entdeckungszeit 2016–2022 nur
   ein Jahr lang.

Gerade deshalb lohnt die Messung: Die Prüfstraße kann die behauptete Größe bestätigen oder **ausschließen**.

## Wogegen geprüft (Regel 1)

- **`pruefstrasse/register.json`:** nur `donchian20-ausbruch-long` (H5/H10/H20, nein), also nicht verwandt.
- **`erledigt/`:** nur `donchian20-ausbruch-long`.
- **`warteschlange/`:** `donchian20-ausbruch-long`, `grossanstieg-ohne-umsatz` (Ereignis ist ein Tagesanstieg über 8 % bei
  geringem Umsatz, also eine Drift nach einem Einzeltag, nicht nach einer Vorzeichenfolge), `hochvolumen-praemie` (Rang des Umsatzes),
  `monatswende-long` und `vor-fomc-long` (Kalender, Bewertung `zeit`).
- **`vorrat/`:** leer (nur LIESMICH.md).
- **origin/pruefstrasse-ideen:** zuletzt `grossanstieg-ohne-umsatz`. Einen Zweig `origin/pruefstrasse-ergebnisse` gibt es nicht.
- **`ideen-verworfen.md`:** Trendfaktor, Kurzfrist-Momentum × Umschlag, Sprung-Fortsetzung, Umkehr nach Großbewegung mit
  Vor-CAR-Dezil (Kudryavtsev 2021), Gutierrez 3-Tage-Verlierer, IBS, Plastun et al.
  - **Gutierrez (2016)** wurde dort als Abwandlung der Kurzfrist-Umkehr verworfen. Der Grund war die *Rangfolge* der drei
    schlechtesten Werte aus 200, also eine Querschnittsregel.
  - **Hier gibt es keinen Rang und keine Renditehöhe.** Das Ereignis ist allein die Zahl der Vorzeichen in Folge. Eine Folge von
    fünf Tagen mit je −0,1 % feuert, ein einzelner Tag mit −8 % nicht.
- **Belegstand:**
  - **Kurzfrist-Umkehr 5 Tage** (Querschnitt 15.09., +0,151 Pp je Woche, t 1,19) sortiert nach der 5-Tage-*Rendite* im Querschnitt
    und schichtet wöchentlich um. Hier zählt das *Vorzeichen*, das Ereignis gehört zu einer einzelnen Reihe und wird 1 Tag gehalten.
    Die Familie ist dieselbe (Umkehr), das Signal ein anderes. So unterscheidet es auch der Vorrat in seiner Zeile „Verwandt, nicht
    gleich“.
  - **Dip-Familie der Minutenstudie** (nein) und **`rsi2seit`**: anderer Zeitrahmen und anderes Signal (RSI auf Minutenkerzen).
  - **Kapitulation** (Sturz mit Volumen, 60m): nicht verwandt.
- **Vorrat, „Geprüft und bewusst nicht aufgenommen“:** kein Treffer.

## Machbarkeit vor der Auflösungswand (Regel 3)

- **Signalzahl:** In der Quelle haben 26.469 Fälle von 2.425.650 Aktientagen eine Folge, die den fünften Tag erreicht, also 1,09 %.
  Folgen ab 7 Tagen kommen nach dem Cooldown wieder hinzu, rund 0,18 %. Das Panel hat in den Klassen 1–3 rund 1,40 Mio. Zeilen an
  1.735 Entdeckungstagen (Zählung des PM zur `hochvolumen-praemie`), also rund **800 Reihen je Tag**. Daraus folgen
  **≈ 15.000–17.000 Signale**, das sind **≈ 9–10 je Tag**, und praktisch jeder Entdeckungstag ist ein Signaltag. Der Signalanteil
  am Tag liegt bei ≈ 1,1 %, also ist die Bewertung `topf` richtig: Die Regel wählt Aktien, nicht den Tag.
- **MDE80 der Entdeckung** nach der Faustregel des Vorrats, MDE80(N, H) ≈ 0,23 × √(100.692 / N) × √(H / 5), mit N = 15.300 und
  H = 1: 0,23 × 2,57 × 0,447 ≈ **0,26 Pp**. Mit dem Faktor 1,5 aus dem Donchian-Lauf (`erledigt/donchian20-ausbruch-long/ERGEBNIS.md`,
  se_HH 0,1235 statt 0,082) ergibt sich **≈ 0,40 Pp**.
- **Kriterium:** behauptete Größe 0,343 Pp (bzw. 0,277 nach Kontrollen, große Werte 0,288).
  - Die MDE80 von 0,26–0,40 liegt **unter dem Doppelten** der Behauptung (0,55–0,69).
  - Nach der Faustregel erreicht die Behauptung die MDE80 sogar selbst.
  - Damit ist das Urteil **informativ**: Die Messung kann die Größe der Quelle bestätigen oder ausschließen. **Einstellbar.**
- **Vergleich der Varianten, vor jeder Messung:**

  | Variante | MDE80 | Behauptung | MDE80 im Verhältnis zur Behauptung |
  |---|---|---|---|
  | 7+ (≈ 2.600 Signale) | 0,64–0,96 Pp | 0,485 | 1,3–2,0 |
  | 3 (≈ 80.000 Signale) | 0,11–0,17 Pp | 0,234 | fein, aber nur p < 10 % in der Quelle |
  | **5** | **0,26–0,40 Pp** | **0,343** | **0,8–1,2** |

  Gewählt ist 5: die kürzeste Länge mit p < 5 % in der Quelle, und damit die informativste.

## Erwartung (vorab)

Die Quelle meldet +0,343 Pp brutto, von Schluss zu Schluss, gegen das Marktmodell, 1990–2016. **Eigene Erwartung** für den
Einstieg zur Eröffnung und gegen den Topf derselben Zelle: **H1 0 bis +0,15 Pp brutto, positiv.** Drei Gründe:

- Ein Teil der Umkehr fällt über Nacht an und ist nicht handelbar.
- Die Kurzfrist-Umkehr ist in liquiden US-Werten nach 2010 schwächer geworden. Der eigene Querschnitt vom 15.09. fand +0,151 Pp je
  Woche bei t 1,19.
- Die Zahlen der Quelle sind in sich widersprüchlich (Abschnitt Beleg).

Netto nach der Kassa-Hürde (0,045–0,085 Pp) bleibt **eher null**. Das wahrscheinlichste informative Ergebnis ist ein
**Größen-Ausschluss** der +0,343 Pp. Das ist kein Nein zur Richtung.
