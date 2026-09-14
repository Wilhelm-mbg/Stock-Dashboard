# Vorregistrierung — Querschnitts-Prüfstand, Teil 1 (13.09.2026)

**Auftrag:** `Markt-Dashboard-Daten/uebergabe/auftrag-querschnitt-pruefstand-teil1-2026-09-13.md`.
**Rolle:** Studien-Chat (Berechnungen). **Ordner:** `studien/querschnitt-pruefstand-2026-09-13/`.
**Diese Datei ist der erste Commit. Sie steht vor jeder Zahl.**

Teil 1 baut **keine Strategie**. Er baut (a) die tägliche Querschnitts-Datentafel, (b) den Prüfrahmen und
(c) drei Kontrollen. Kandidatensignale außer den drei Kontrollen gibt es nicht, Optimierung gibt es nicht,
Parametersuche gibt es nicht. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.

---

## 0. Was schon gemessen ist und hier nicht neu erfunden wird

Übernommen **unverändert per `require`** aus `studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js`
(über `studien/vorregistrierung-2026-09-09-trendwende-ii/konfig.js`):

| Größe | Wert | Herkunft |
|---|---|---|
| Umsatzklassen | 5–50 / 50–250 / 250–1000 / ab 1000 (Mio $) | `kosten.js UMSATZ_KLASSEN` |
| Kassa-Hürde je Umlauf (Pp) | 0,1569 / 0,0854 / **0,0647** / **0,0449** | Spannen-Studie 03.09., `wiki/kosten.md` |
| Cent-Boden | 0,005 $ je Umlauf, in Pp `100·0,005/Kurs` | Nachtrag 3 der Minutenstudie |
| Wertpapierart | nur `CS` und `ADRC` sind Aktien | `studien/messmaschine/strategien/wertpapierart.js` |
| Kalender | `alpaca1m/_kalender.json`, ET-Handelstage mit Halbtagen | Quelle Alpaca |
| Maßnahmenfenster | ±10 Handelstage um den Ex-Tag | Minutenstudie §8 |

Neu und nur hier: Datenfenster, Panelformat, Umschichtung, Portfoliobildung, se-Regel, die drei Kontrollen,
die Ausbuchungsregeln und die Empfindlichkeitsrechnung.

---

## 1. Die Datentafel (`paneldaten.js` → `panel/<jahr>.bin`, `panel/_stand.json`)

### 1.1 Fenster und Grundmenge

- **ET-Handelstage 2016-01-01 bis zum letzten vollständigen Handelstag im Archiv** (aus `_kalender.json`
  geschnitten auf den letzten Tag, an dem das Archiv Balken führt; der Stand steht in `panel/_stand.json`).
- Quelle: **ausschließlich** `E:/Markt-Dashboard-Archiv/alpaca1m/` (1-Minuten-SIP-Balken) bzw. die
  bereinigte Kopie `alpaca1m-bereinigt/`, wo es sie gibt. **Nur lesen, keine Sperre, kein Netz.**
- Reihen: die **7.299** Reihen mit Balken und Wertpapierart CS/ADRC aus `lesen.js reihen()` der
  Minutenstudie (694 ETFs, 7 ETNs, 35 ETVs, 16 Fonds, 4 ETS, 1 Unit, 1 Testkürzel, 1 ohne Art fallen weg).
  Wiederverwendete Kürzel führen die `~2`-Reihe eigenständig.
- **Referenzreihen** (nie im Universum, nur für Regime und Prüfungen): `SPY`. Sie wird als ETF vom
  Wertpapierart-Filter ausgeschlossen und deshalb ausdrücklich zusätzlich gesammelt.

### 1.2 Felder je Zeile (Handelstag × Reihe)

| Feld | Bedeutung |
|---|---|
| `sym`, `tag` | Index in die Symbol- bzw. Kalendertabelle des Panelkopfs |
| `roh_schluss` | **roher** Schlusskurs in $ (§1.3) |
| `roh_eroeffnung` | **roher** Eröffnungskurs in $ = Eröffnung der ersten regulären Kerze des Tages |
| `faktor` | Rückrechnungsfaktor roh→bereinigt: `bereinigt = roh / faktor` (§1.4) |
| `rendite` | bereinigte Tagesrendite Schluss→Schluss in **Pp** (§1.4) |
| `umsatz_reg` | Σ (Kurs × Stück) der **regulären** Kerzen, roh, in $ |
| `umsatz_auktion` | Σ (Kurs × Stück) der **Schlussauktionskerze**, roh, in $ |
| `klasse` | Umsatzklasse 0–3 aus dem Median der 60 Handelstage **vor** dem Tag (−1 = unbestimmt) |
| `kerzen` | Zahl regulärer Minutenkerzen des Tages |
| `marken` | Bitfeld (§1.6) |

`dollar_umsatz` des Auftrags = `umsatz_reg + umsatz_auktion`. Beide Teile stehen **getrennt** in der Tafel,
damit die Frage „mit oder ohne Schlussauktion?" später ohne einen zweiten Lauf über 114 GB beantwortbar ist
(Fehlerform *„Das Ergebnisprotokoll trägt nicht, was die Rückfrage braucht"*, 12.09.).

`lebt`, `ende_grund`, `ende_datum` stehen **je Reihe** im Panelkopf, nicht je Zeile: sie hängen nicht vom Tag
ab. Eine Zeile existiert genau dann, wenn die Reihe an diesem Tag reguläre Kerzen hatte; `lebt` je Tag ist
damit `tag ≤ letzter_tag` und in jeder vorhandenen Zeile wahr. Die Marke `LETZTER_TAG` kennzeichnet den
letzten Archivtag der Reihe — an ihm greift die Ausbuchungsregel (§3.6).

### 1.3 Tagesschluss = Eröffnung der Schlussauktionskerze — und die Ersatzregel

**Gemessen am Archiv (13.09.2026, Sondierung):** Die reguläre Sitzung im Archiv endet mit der
**15:59-Kerze** (Sitzungsbereich 09:30–15:59 ET). Die Kerze mit dem Stempel **16:00 ET** liegt im
Sitzungseimer `nach`. Ihre **Eröffnung** ist der Druck der Schlussauktion (AAPL 2024: Umsatz 8,0–11,8 Mio
Stück in dieser einen Minute). Sie ist deshalb der Tagesschluss.

- **Regel:** `roh_schluss` = Eröffnung der Kerze, deren ET-Stempel **exakt dem Kalenderschluss des Tages
  entspricht** (16:00, an Halbtagen 13:00) — unabhängig vom Sitzungseimer.
- **Ersatzregel, wenn diese Kerze fehlt:** `roh_schluss` = **Schluss der letzten regulären Kerze des Tages**.
  Zweite Ersatzstufe gibt es nicht; ein Tag ohne reguläre Kerze erzeugt keine Zeile.
- Die Zeile bekommt dann die Marke `SCHLUSS_ERSATZ`. **Die Trefferzahl wird je Jahr ausgewiesen**, absolut
  und als Anteil, und zusätzlich getrennt für das Universum (§2.1) — dort ist sie die, auf die es ankommt.
- Vorabbefund aus der Sondierung (5 Reihen × 4 Jahre): AAPL/MNST/SPY/PLTR 0–1 Fehltage je Jahr, F
  (Ford, niedriger Kurs) 5–28 von 252. `|O_16:00 − C_15:59|` Median 0,006–0,07 Pp, P95 bis 0,26 Pp — die
  Ersatzregel ist also **nicht** wirkungsgleich, ihre Häufigkeit muss berichtet werden.

`roh_eroeffnung` = Eröffnung der ersten regulären Kerze des Tages. Liegt ihr Stempel nicht auf der
Kalendereröffnung (09:30 bzw. Halbtag), bekommt die Zeile die Marke `EROEFFNUNG_ERSATZ`; auch diese Zahl
wird je Jahr ausgewiesen.

### 1.4 Roh gegen bereinigt — und die Ausschüttungen

- Gelesen wird nach der Leseregel des Archivs (`alpaca1m-bereinigt/_regel.json`): die bereinigte Kopie, wo
  es sie gibt (1.439 Ordner), sonst die Rohdatei — dann **ist** die Rohdatei die bereinigte.
- `faktor(t)` = Produkt der Maßnahmenfaktoren im Dateikopf mit **Ex-Tag nach t** (Funktion
  `rohFaktorFunktion` aus `lesen.js`, unverändert übernommen). Damit: `roh = bereinigt · faktor`,
  `bereinigt = roh / faktor`.
- **Renditen bereinigt, jede Preis- und Umsatzaussage roh.** Der Cent-Boden gilt am rohen Kurs.
- **Dollarumsatz ist gegen die Bereinigung invariant**: die Kopie teilt Kurse durch den Faktor und
  multipliziert Stück damit — das Produkt bleibt. Das wird in `test.js` nachgerechnet, nicht behauptet.
- `rendite(t)` in Pp = `100 · (bereinigt_schluss(t) / bereinigt_schluss(t−1) − 1)`, wobei t−1 der
  **vorherige Tag derselben Reihe im Panel** ist. Fehlt der Vortag (Lücke, erster Tag), ist `rendite` NaN
  und die Zeile trägt `KEINE_RENDITE`. Über Jahresgrenzen hinweg wird durchgerechnet: der Panelbau läuft je
  Reihe über **alle** Jahre in einem Zug.

> **Ausschüttungen: `rendite` enthält sie NICHT.** Das Archiv ist `adjustment=raw`; die bereinigte Kopie
> wendet **Splits und gemessene Abspaltungen** an, ausdrücklich **keine Dividenden**
> (`alpaca1m-bereinigt/_regel.json`, Feld `nichtAngewandt`). Es fehlt damit die **Dividendenrendite**, im
> US-Querschnitt rund 1,5–2 % im Jahr, also rund **0,006–0,008 Pp je Handelstag**.
> **Folge für diese Studie, vorab festgelegt:** Die Hauptgröße ist **Long-Dezil minus gleichgewichtetes
> Universum**. Eine über beide Seiten gleich große Ausschüttung kürzt sich darin heraus; übrig bleibt die
> **Differenz der Dividendenrendite** zwischen Dezil und Universum. Diese Differenz ist **nicht gemessen**
> und wird als offene Verzerrung berichtet. Für eine Rangfunktion, die nach Dividendenhöhe sortiert (Wert,
> Ausschüttung), wäre die Tafel **untauglich** — das steht hier, bevor jemand es versucht.
> Die Long-Short-Diagnose ist von derselben Lücke betroffen.

### 1.5 Umsatzklasse — strikt vorwärtsfrei

`klasse(t)` = `klasseIndex( Median{ umsatz_reg + umsatz_auktion } über die letzten 60 Handelstage der Reihe
**vor** t )`. Kein Fenster über den ganzen Zeitraum, kein „war irgendwann liquide". Liegen weniger als
**40** der 60 Vortage vor, ist `klasse = −1` (unbestimmt) und die Reihe fällt an diesem Tag aus dem
Universum. 60 statt der 20 der Minutenstudie, weil hier **wöchentlich und monatlich** umgeschichtet wird
und die Klasse über die ganze Halteperiode tragen muss; die Zahl ist vorab festgelegt und wird nicht variiert.

### 1.6 Marken (Bitfeld `marken`)

| Bit | Name | Bedeutung |
|---|---|---|
| 0 | `QUELLE_REIN` | alle Kerzen der Datei stammen aus einer Alpaca-SIP-Quelle (`quellen`-Bereiche) |
| 1 | `SCHLUSS_ERSATZ` | Schlussauktionskerze fehlte, Ersatzregel griff |
| 2 | `DICHTE_OK` | ≥ 80 % der Soll-Minuten des Tages als reguläre Kerzen vorhanden |
| 3 | `MASSNAHME_NAH` | ±10 Handelstage um eine Maßnahme, deren Bereinigung **nicht** angewandt ist |
| 4 | `LETZTER_TAG` | letzter Archivtag dieser Reihe |
| 5 | `STEMPEL_TAG` | Stempelkerzen-Form (§1.7) |
| 6 | `EROEFFNUNG_ERSATZ` | erste reguläre Kerze nicht auf der Kalendereröffnung |
| 7 | `KEINE_RENDITE` | kein Vortag im Panel |

### 1.7 Stempelkerzen — Form, nicht Umsatz

Die bekannte Falle: *„Umsatz ist der falsche Unterscheider"* — umsatzlose Kerzen wegzuwerfen kostet
siebenmal mehr echte Extreme, als es Stempel vermeidet. Deshalb die **Form-Regel**:

> Eine Kerze ist eine **Stempelkerze**, wenn `Eröffnung = Hoch = Tief = Schluss` **und** `Umsatz = 0`.
> Ein **Tag** trägt `STEMPEL_TAG`, wenn **alle** seine regulären Kerzen Stempelkerzen sind.

Nur `STEMPEL_TAG`-Zeilen fallen aus dem Universum, einzelne Stempelkerzen nicht. **Ausgewiesen wird je
Jahr: Zahl der Stempelkerzen, Zahl der Stempeltage — und die Zahl der geprüften Kerzen/Tage**, damit
„0 gefunden" von „nichts zu durchsuchen" unterscheidbar bleibt. Erwartung vorab: im Alpaca-SIP-Archiv
**nahe null**, weil die bekannte Stempelform aus dem Yahoo-Quote-Pfad stammt. Wird die Erwartung bestätigt,
ist das ein Nullbefund **mit** ausgewiesener Grundgesamtheit, keine stille Null.

### 1.8 Nur SIP

Das Manifest führt für **alle 52.312 Dateien** `quelle: "alpaca"`. Geprüft wird trotzdem je Datei über die
`quellen`-Bereiche des Kopfes: trägt eine Datei einen Bereich mit anderer Quelle, verlieren **alle Tage
dieser Symbol-Jahr-Datei** die Marke `QUELLE_REIN` und fallen aus dem Universum. Die Zahl wird
ausgewiesen. Grund: in einer Reihe lagen schon einmal zwei Quellen mit Umsatzfaktor ~500 nebeneinander.

### 1.9 Tote Reihen bleiben drin

Jede Reihe wird bis zu ihrem letzten Balken geführt. Was danach gebucht wird, steht in §3.6.

---

## 2. Der Prüfrahmen (`pruefstand.js`)

Der Rahmen nimmt eine **Rangfunktion** `rang(sicht, tagIdx) → Map(symIdx → Zahl)` und liefert immer
dieselbe Bewertung. Höherer Rangwert = weiter oben.

### 2.1 Universum je Umschichtungstag t (Punkt-in-Zeit)

Alle Reihen mit einer Panelzeile am Tag t, die **alle** erfüllen:

1. `klasse(t) ∈ {2 (250–1000), 3 (ab1000)}`
2. `QUELLE_REIN`
3. **Kurs über dem Cent-Boden:** `100 · 0,005 / roh_schluss(t) ≤ Hürde(klasse(t))`
   → Mindestkurs **7,73 $** (Klasse 250–1000) bzw. **11,14 $** (ab 1000)
4. mindestens **250** Panelzeilen der Reihe an Tagen **vor** t
5. nicht `STEMPEL_TAG`, nicht `MASSNAHME_NAH`, `DICHTE_OK`
6. `roh_eroeffnung(t+1)` vorhanden — ohne Ausführungskurs keine Position

Punkt 3 ist ein harter Schnitt. Er wird deshalb **als vorab registrierte Empfindlichkeit** zusätzlich ohne
Punkt 3 gerechnet und berichtet (Variante `ohneCentBoden`). Das ist keine Parametersuche: beide Zahlen
werden immer berichtet, die Hauptzahl ist die **mit** Punkt 3.

Punkt 5 schneidet auf **Datenqualität**, nie auf die Zielgröße. Ein Ausschluss nach der Höhe der Rendite
findet an keiner Stelle statt (Fehlerform *„Ausschluss auf Zielgröße"*).

### 2.2 Portfolios

- **Oberstes und unterstes Dezil** der Rangwerte des Universums, gleichgewichtet. Dezilgrenze:
  `k = max(1, floor(N/10))` Papiere; bei Rangwert-Gleichstand an der Grenze entscheidet der Symbolindex
  (deterministisch, nicht zufällig).
- **Hauptgröße:** `Long-Dezil − gleichgewichtetes Universum`. Marktneutral ohne Leihe.
- **Diagnose daneben:** `Long − Short` (**verlangt Wertpapierleihe; als Aktie ist Short im Projekt
  gesperrt**), sowie beide Dezile und das Universum je für sich.
- Mindestbesetzung: eine Periode zählt nur mit `N_Universum ≥ 100` (also ≥ 10 Papiere je Dezil).
  Perioden darunter werden gezählt und ausgewiesen, nicht stillschweigend gemittelt.

### 2.3 Umschichtung

Zwei Werte, kein Raster:

- **wöchentlich:** Signaltag = letzter Handelstag jeder Kalenderwoche; Ausführung zur Eröffnung des
  folgenden Handelstags.
- **monatlich:** Signaltag = letzter Handelstag jedes Kalendermonats; Ausführung zur Eröffnung des
  folgenden Handelstags.

**Handel:** Signal aus Daten **bis Schluss Tag t**, Ausführung zur **Eröffnung t+1**. Nie derselbe Balken.

### 2.4 Renditerechnung der Portfolios

Die Zeitreihe ist das **Portfolio**, nicht die Aktie. Für jede Halteperiode von Ausführungstag a bis zum
nächsten Ausführungstag a' gilt je Papier:

- Tag a: `Eröffnung(a) → Schluss(a)`
- Tage a+1 … a'−1: `Schluss(d−1) → Schluss(d)`
- Tag a': `Schluss(a'−1) → Eröffnung(a')`

Alle bereinigt. Gewichte driften **nicht** innerhalb der Periode (Gleichgewichtung wird täglich
wiederhergestellt — das ist die konservative Wahl: sie erzeugt keinen stillen Momentum-Effekt aus der
Gewichtsdrift, und der tägliche Umschlag daraus wird **nicht** berechnet, weil er in der Praxis nicht
gehandelt würde; die Abweichung zur Buy-and-Hold-Variante wird als Diagnose einmal ausgewiesen).

Ergebnis: eine **tägliche Portfolio-Renditereihe** je Portfolio und Umschichtungsfrequenz.

### 2.5 Kosten — gemessen, nicht angenommen

Am Ausführungstag a mit Gewichten `w_alt` (vor) und `w_neu` (nach):

> `Kosten(a) = ½ · Σ_i |w_neu,i − w_alt,i| · Hürde(Klasse_i(t))` in Pp.

Die Hürde ist **je Umlauf** (Kauf + Verkauf). Jede Seite trägt die Hälfte zum Zeitpunkt ihres eigenen
Handels; über einen vollen Umlauf summiert sich das auf genau eine Hürde. `Umschlag(a) := ½ · Σ_i |Δw_i|`.
Die Hürde ist die **mittlere** Hürde der Klasse (0,0647 / 0,0449 Pp), nicht die Eröffnungs- oder
Schlussfenster-Hürde — Ausführung zur Eröffnung trägt nach der Spannen-Studie einen Faktor 1,81–2,07;
diese **Eröffnungsvariante** wird als zweite Nettogröße nachrichtlich mitgeführt.

Kosten fallen **auf beiden Seiten** an: das Long-Dezil und das gleichgewichtete Universum werden je für
sich netto gerechnet; die Hauptgröße ist `Long_netto − Universum_netto`. Brutto **und** netto werden
ausgewiesen.

### 2.6 Standardfehler

- Haltedauer = Umschichtungsfrequenz ⇒ die **täglichen** Portfoliorenditen überlappen **nicht**.
  Hauptmaß: `se` **naiv** auf der Reihe der **Perioden**-Überschüsse (je Umschichtungsperiode ein Wert,
  nicht überlappend).
- **Daneben** (immer, nicht wahlweise): `se` auf der täglichen Reihe, naiv **und** Hansen-Hodrick
  (Rechteck bis Lag L−1) **und** Newey-West (Bartlett bis Lag L) mit L = Länge der Periode in Handelstagen
  (5 bzw. 21). Weichen sie um mehr als Faktor 1,5 voneinander ab, steht das als Marke in der Zeile.
- Die Funktion `momente(paare, L)` ist die **wortgleiche** aus
  `studien/vorregistrierung-2026-09-08-trendkanal-tage/auswerten.js` (dort abgenommen); `test.js` rechnet
  sie an einem Satz mit bekannter Autokorrelation gegen eine unabhängige Rechnung nach.
- t- und se-Rechnung **niemals** über Aktien-Tage.

### 2.7 Pflichttabellen

Für jede Kontrolle und jede Umschichtungsfrequenz:

- **Jahresscheiben** 2016…2026 (Jahre mit < 10 Perioden: „zu dünn", ohne t). Die Jahresscheiben müssen
  sich zum Gesamtzeitraum addieren — das prüft `test.js`.
- **Letzte 250 Handelstage** (Aktualitätsfenster).
- **Regimeschnitt** `SPY über / unter EMA200` (n = 200 auf der bereinigten SPY-Tagesreihe aus demselben
  Archiv, Stand am Signaltag t). Vorab festgelegt, **nachrichtlich** — kein Tor.

### 2.8 Die Leck-Sperrklinke

Die Rangfunktion bekommt **keinen** Zugriff auf das Panel, sondern eine **Sicht** `sicht(t)`. Jeder
Zugriff auf eine Zeile mit `tag > t` wird gezählt und **gemeldet**; die Sicht liefert dann `undefined`.
Ein Lauf mit ≥ 1 Verstoß wird als **UNGÜLTIG** markiert und das Ergebnis nicht berichtet.

Ausnahme mit Schlüssel: `sicht = zukunftSicht(t, { orakel: true })` hebt die Sperre auf und setzt in jeder
Ergebniszeile die Marke `ORAKEL`. Nur die Orakel-Kontrolle darf ihn setzen.

**Positivkontrolle (die Leck-Probe):** eine Rangfunktion `leckProbe`, die absichtlich `zeile(sym, t+1)`
liest. Erwartung, vorab: die Klinke meldet **> 0 Verstöße** und der Lauf ist UNGÜLTIG. Meldet sie null,
ist die Klinke kaputt und das ganze Teil-1-Ergebnis wertlos.

---

## 3. Die drei Kontrollen (`kontrollen.js`)

### 3.1 Orakel — Blick in die Zukunft

- **Rangfunktion:** die bereinigte Rendite des **Ausführungstags t+1**, `Eröffnung(t+1) → Schluss(t+1)`
  („Rendite von morgen"). Sie ist zugleich der erste Tag, an dem das Portfolio wirklich hält — damit prüft
  die Kontrolle genau die Verrohrung: Zuordnung Datum→Kurs, Ausführungsversatz, Gewichtung, Kostenabzug.
- **Zweite Fassung als Kreuzprobe:** Rang = bereinigte Rendite über die **ganze** Halteperiode
  (Eröffnung t+1 → Eröffnung des nächsten Umschichtungstags).
- **Erwartete Größenordnung, vorab hingeschrieben:** Die Querschnitts-Standardabweichung der Tagesrendite
  liquider US-Aktien liegt bei ~2,0–2,5 Pp. Das oberste Dezil einer Normalverteilung hat den Mittelwert
  `≈ 1,755 σ`. Also **Long − Universum ≈ +3,5 bis +4,4 Pp am Ausführungstag**, und bei wöchentlicher
  Umschichtung fast dasselbe je Periode (die restlichen vier Tage sind Rauschen).
  **Schranke (Tor):** Fassung 1 muss `Long − Universum ≥ +2,0 Pp je Periode` **brutto und netto**
  liefern, wöchentlich **und** monatlich, mit `t ≥ 20`. Fassung 2 muss bei wöchentlicher Umschichtung
  `≥ +5,0 Pp je Periode` liefern.
  **Wird diese Schranke verfehlt, ist die Maschine kaputt. Dann wird gemeldet, nicht repariert und
  weitergelaufen.**

### 3.2 Zufall — muss null sein

- **Rangfunktion:** `mulberry32(fnv('querschnitt-2026-09-13|' + symbol + '|' + tagIndex))` — fester,
  reproduzierbarer Generator, gleiches Universum, kein Bezug zu Kursen.
- **Schranke in der Einheit der Sache** (Lehre vom 13.09.: *„Die Kontrollschranke skaliert nicht mit der
  Stichprobe"* — ein t-Kriterium misst bei großen Stichproben nur noch, **dass** eine Abweichung
  existiert, nicht **ob** sie stört):

  > **Brutto:** `|Mittel je Periode| < 0,10 Pp` (wöchentlich) bzw. `< 0,25 Pp` (monatlich).
  > **Netto:** `|Mittel je Periode + Kosten je Periode| < ` dieselbe Schranke.
  > `|t|` steht **daneben** und entscheidet **nicht**; ein `|t| ≥ 3` bei eingehaltener Pp-Schranke ist eine
  > Marke, kein Durchfallen.

  Begründung der Schranke: die Kostenhürde je Woche liegt bei rund 0,02–0,05 Pp; eine Verzerrung unter
  0,10 Pp je Woche kann ein Ergebnis in der gesuchten Größenordnung (0,1–0,5 Pp je Woche) nicht erzeugen,
  eine darüber schon. Die erwartete naive se liegt bei ~0,036 Pp je Periode (σ_quer 2,2 Pp, 5 Tage,
  ~50 Papiere je Dezil, ~560 Wochen), die Schranke also bei rund 3 se.
- **Zwölf Ziehungen** mit zwölf verschiedenen Startwerten; berichtet werden alle zwölf **und** ihr
  Mittel. Eine einzelne Ziehung, die die Schranke verfehlt, ist bei zwölf Ziehungen erwartbar; **die
  Kontrolle fällt, wenn das Mittel der zwölf sie verfehlt oder mehr als drei einzelne sie verfehlen.**

### 3.3 Momentum 12-1 — Erwartung positiv, **kein Tor**

- **Rangfunktion:** bereinigte Rendite der letzten **12 Monate ohne den letzten Monat**, gerechnet als
  `bereinigt_schluss(t − 21) / bereinigt_schluss(t − 252) − 1`, beides Panelzeilen der Reihe **vor** t.
  Fehlt eine der beiden, fällt die Reihe an diesem Tag aus dem Universum.
- Nur **monatlich** (so ist der Effekt dokumentiert). Wöchentlich wird nachrichtlich mitgerechnet.
- **Erwartung:** positiv, aber schwach — in liquiden US-Werten seit 2009 dokumentiert schwach, mit einem
  Einbruch 2020/21. **Ein schwaches oder negatives Momentum ist kein Beleg für eine kaputte Maschine;
  das entscheidet allein das Orakel.** Ergebnis mit Jahresscheiben.

### 3.4 Kostenvorprüfung — Pflichtabschnitt, vor der Messung

| Kontrolle | erwarteter Effekt je Periode | Umschlag × Hürde je Periode | Faktor | Urteil |
|---|---|---|---|---|
| Orakel (Tag t+1), wöchentlich | ≈ +3,5 … +4,4 Pp | ~0,9 × 0,05 = 0,045 Pp | ≈ 80 | messen |
| Zufall, wöchentlich | 0 (Kontrolle) | ~0,9 × 0,05 = 0,045 Pp | — | messen (kein Kandidat) |
| Momentum 12-1, monatlich | ≈ +0,08 … +0,17 Pp | ~0,3 × 0,05 = 0,015 Pp | ≈ 5–11 | messen |

Die Regel *„unter Faktor 4 wird gar nicht erst gemessen"* ist damit für alle drei erfüllt bzw. nicht
anwendbar (Zufall ist eine Kontrolle, kein Kandidat). Der Umschlag ist hier **geschätzt**; der
**gemessene** Umschlag steht im Ergebnis und wird gegen diese Schätzung gehalten.

### 3.5 Was aus Teil 1 **nicht** folgt

Aus Teil 1 folgt **keine** Aussage über eine Kante. Momentum 12-1 ist eine Verrohrungskontrolle mit
Vorzeichenwartung, kein Kandidat — es gibt für sie keine Vorregistrierung als Strategie, keine
Bonferroni-Rechnung und kein Urteil „belegt".

### 3.6 Was bei einer verschwundenen Reihe gebucht wird

Quelle der Gründe: `studien/verschwundene-gruende-2026-09-12/verschwundene-gruende.json` (4.996 Reihen).
Am **letzten Archivtag** einer gehaltenen Reihe (`LETZTER_TAG`) endet die Position. Was danach bis zum
Ende der Halteperiode gebucht wird, ist **vorab je Grund festgelegt**:

| Grund (n) | Buchung | Begründung |
|---|---|---|
| `uebernahme` (1.653) | **letzter Kurs**, danach Bargeld (Rendite 0) | Barübernahme: der letzte Kurs ist der Barpreis |
| `fusion-aktientausch` (310) | **letzter Kurs**, danach Bargeld | Der Nachfolger ist in der Tafel **nicht** verlässlich verknüpft (die Grunddatei führt CIK und Firma, keinen Nachfolge-Ticker). Der Tauschkurs setzt den Wert am letzten Tag ≈ Deal-Wert; der verbleibende Fehler ist die Kursentwicklung des **Käufers** nach dem Vollzug, und die hat mit unserer Rangfunktion nichts zu tun. **Entscheidung und ihre Grenze werden so berichtet.** |
| `umbenennung-ticker` (1.330) | **letzter Kurs**, danach Bargeld | Wirtschaftlich neutral; die Reihe läuft unter neuem Kürzel als neue Reihe weiter und kann nach 250 Vortagen wieder ins Universum. Die Buchung ist unverzerrt. |
| `spac-ende` (276) | **letzter Kurs** | Rückgabe zum Treuhandwert ≈ letzter Kurs |
| `freiwillig` (311) | **letzter Kurs** | Rückzug von der Börse, danach außerbörslich |
| `insolvenz` (357) | **Totalverlust der Restposition** (−100 %) | Der Restwert einer Aktie im Insolvenzverfahren ist im Regelfall null; „letzter Kurs" wäre die Überlebensverzerrung in Reinform |
| `zwangs-delisting` (547) | **Totalverlust der Restposition** (−100 %) | dito |
| `unbekannt` (212) | **letzter Kurs** in der Hauptzahl | die vorsichtigere Annahme steht in der Empfindlichkeit |
| keine Reihe in der Grunddatei | **letzter Kurs** | Zahl wird ausgewiesen |

**Empfindlichkeitsrechnung, Pflicht:** dasselbe Ergebnis **zweimal** — einmal wie oben, einmal mit
**Totalverlust auch für `unbekannt`, `freiwillig` und `zwangs-delisting`**, und einmal mit **letztem Kurs
für alle** (also ohne jeden Totalverlust). Steht die Differenz in der Größenordnung des Effekts, ist das
Ergebnis von dieser Annahme abhängig und wird so berichtet.

Zusätzlich ausgewiesen: **wie oft** eine Reihe im gehaltenen Dezil überhaupt stirbt (absolut und je
Periode). Ist die Zahl klein, ist die ganze Annahme folgenlos — auch das ist ein Befund.

---

## 4. Prüfungen (`test.js`)

Mindestens, jede mit ihrer eigenen Positivkontrolle, wo eine Null auch aus Untätigkeit entstehen könnte:

1. Panel-Zeilenzahl gegen die Zahl der Archivdateien und deren `tage`-Feld im Manifest.
2. Stichprobe von **20 Reihen**: Schluss, Eröffnung, Rendite, Umsatz von Hand aus den Minutendateien
   nachgerechnet (unabhängiger zweiter Leseweg, nicht `lesen-panel.js`).
3. Splitfaktoren an bekannten Fällen: **COKE 2016 roh 180,40 $, nicht 18,04**; MNST-Split 2026 Faktor 2,0.
4. Dollarumsatz-Invarianz roh↔bereinigt an Reihen mit Maßnahme.
5. Universum an **drei Stichtagen** punkt-in-Zeit gegen eine unabhängige Rechnung (eigener Code, der das
   Panel roh liest).
6. Gleichgewichtetes Universum gegen **SPY aus demselben Archiv** — Toleranz und ihre Begründung: ein
   gleichgewichteter Korb aus 300–900 liquiden Aktien ist **nicht** SPY (kapitalgewichtet, 500 Werte);
   erwartet wird eine **Korrelation der Tagesrenditen ≥ 0,90**, nicht Gleichheit der Mittel. Diese
   Korrelation ist der Test — sie fällt sofort, wenn Datum und Kurs verrutscht sind.
7. Umschlag von Hand an **einer** Umschichtung (Gewichte vorher/nachher ausgeschrieben).
8. Kostenabzug von Hand an derselben Umschichtung.
9. `se` der Portfolioreihe gegen eine unabhängige Rechnung; dazu ein Kunstsatz mit **bekannter**
   Autokorrelation, an dem HH und naiv nachweislich verschieden ausfallen (sonst prüft der Test nichts).
10. Die drei Kontrollen gegen ihre Schranken.
11. Die **Leck-Probe** (muss melden) und ihre Umkehrung: eine saubere Rangfunktion darf **null** Verstöße
    erzeugen.
12. Jahresscheiben addieren sich zum Gesamtzeitraum (Perioden- und Tageszahlen).
13. Die Sperrklinke gegen den Ausschluss auf die Zielgröße: kein Universumskriterium liest `rendite`.

---

## 5. Regeln des Laufs

Nur dieser Ordner und die Übergabedatei werden geschrieben. Andere Studienordner nur lesen. `wiki/` gar
nicht. Das Archiv auf `E:` nur lesen, keine Sperre. Kein Netz, keine Schlüssel. Kein Push, keine
Versionsänderung, kein Wiki-Eintrag. Lange Läufe im Hintergrund ohne Fenster. Ergebnisse sofort auf die
Platte.

**Nachträge** stehen unter dieser Zeile, mit Datum und Grund, und werden **vor** dem Lauf committet, auf
den sie sich beziehen.

---

## Nachträge

### Nachtrag 1 (13.09.2026, vor dem Vollauf): „letzter vollständiger Handelstag"

§1.1 sagt „bis zum letzten vollständigen Handelstag im Archiv", ohne die Regel zu nennen. Sie lautet:

> Der **letzte vollständige Handelstag** ist der letzte Tag, dessen Zeilenzahl im Panel mindestens **80 %**
> des Medians der **fünf** vorhergehenden Handelstage erreicht. Alle Tage danach fallen aus dem Panel und
> werden in `panel/_stand.json` (`unvollstaendigeTage`) mit Zeilenzahl und Vergleichsmedian aufgeführt.

Grund: der Live-Sammler der App schreibt während der Sitzung in dasselbe Archiv; der laufende Tag hat je
Reihe unterschiedlich viele Kerzen und **keine** Schlussauktionskerze. Eine feste Uhrzeitregel wäre eine
Behauptung über die Uhr des Rechners, die Zeilenzahl ist eine Messung am Bestand.

### Nachtrag 2 (13.09.2026, vor dem Vollauf): zwei Rendite-Spalten statt einer

Die Tafel führt **zwei** bereinigte Renditen je Zeile, beide in Pp:
`rendite` = Schluss(t−1) → Schluss(t) und `renditeOC` = Eröffnung(t) → Schluss(t).
Grund: §2.4 braucht am Ausführungstag `Eröffnung → Schluss` und am letzten Tag der Periode
`Schluss → Eröffnung`; letzteres ist aus beiden Spalten exakt rekonstruierbar
(`(1+rendite/100)/(1+renditeOC/100) − 1`), ohne dass eine Preisrechnung an der Nutzungsstelle nötig wird.

### Nachtrag 3 (13.09.2026, **Fund im Piloten, vor jeder Ergebniszahl**): roh ≠ Dateikurs

Der Pilot über 6 Reihen zeigte `COKE 2016-01-04` Eröffnung **18,04 $** statt der bekannten **180,40 $** —
Prüfung 3 der Vorregistrierung, an ihrem ersten Lauf rot. Ursache: der Rückrechnungsfaktor aus dem
Dateikopf wurde gespeichert, aber nie angewandt; zugleich wurde die **Rendite** durch denselben Faktor
geteilt, was am Ex-Tag einen Kurssprung erzeugt hätte, den die Bereinigung gerade entfernt.

**Festgeschrieben, damit es nicht wiederkommt:** die Kurse **in der Datei** sind die **bereinigte** Reihe
(jede Jahresdatei ist auf die heutige Skala bereinigt, die Reihe ist über Jahresgrenzen stetig).
`roh = Dateikurs · faktor`, `bereinigt = Dateikurs`. Renditen rechnen mit `Dateikurs`, jede Preisaussage
mit `Dateikurs · faktor`. Der Dollarumsatz ist gegen die Bereinigung invariant und trägt keinen Faktor.

Nach dem Fix: `COKE 2016-01-04` roh **180,40 $**, `AAPL 2016-01-04` roh **105,35 $** (= der Wert in der
Rohdatei), `MNST` über den Split 2026-08-11 roh 91,43 → 45,53 $ bei einer Rendite von **−0,40 Pp**
(nicht −50 %).

### Nachtrag 4 (13.09.2026, **am Kunstsatz gefunden, vor dem echten Panel**): zwei Kontrollschranken lagen im Rauschen

Der Prüfrahmen wurde zuerst auf einem **Kunstpanel** mit bekannter Antwort gefahren (300 Reihen, 11 Jahre,
eingepflanzte Kante, zwölf sterbende Reihen mit allen Ausbuchungsgründen). Der Rahmen selbst arbeitet:
die Leck-Klinke meldete **83.224** Verstöße bei der Leck-Probe und **0** bei der sauberen Probe, das
Orakel fand +3,18 Pp je Woche (t = 65) und +8,16 Pp je Woche in der Perioden-Fassung.

**Zwei registrierte Schranken fielen — und beide zu Unrecht:**

1. **Orakel, `t ≥ 20` für *jede* Frequenz.** Monatlich gibt es nur ~113 Perioden statt ~495; derselbe
   Effekt liefert dort t = 14,3 statt 65. Die Schranke war ohne Rücksicht auf n gesetzt.
   **Korrektur, skalenfrei formuliert:** der Orakel-Effekt muss **mindestens eine Perioden-Standard­abweichung**
   groß sein, `|Mittel| / sd ≥ 1,0`, mit einem absoluten Boden von `t ≥ 8`. Das gemessene t steht daneben.
   Gemessen am Kunstsatz: Mittel/sd = 2,93 (wöchentlich) und 1,35 (monatlich) — beide über 1,0.
   Die Pp-Schranken (≥ 2,0 Pp je Periode brutto und netto; ≥ 5,0 Pp Perioden-Fassung wöchentlich)
   bleiben **unverändert**; sie sind die Schranke in der Einheit der Sache.

2. **Zufall, `|Mittel je Periode| < 0,25 Pp` als Kriterium für die *einzelne* Ziehung (monatlich).**
   Gemessen liegt die se einer einzelnen monatlichen Ziehung bei **0,21 Pp** — die Schranke sitzt damit bei
   **1,2 se**, also im Rauschen. Ein **sauberer** Placebo verfehlte sie in **4 von 12** Ziehungen, alle mit
   |t| ≤ 1,73. Das ist die bekannte Fehlerform *„Absolute Schranke aus einer anderen Skala übernommen" /
   „ein Kriterium, das einen sauberen Placebo durchfallen lässt, ist selbst der Fehler"*.
   **Korrektur:** die Pp-Schranken (0,10 / 0,25 Pp) gelten wie in §3.2 geschrieben für das **Mittel der
   zwölf Ziehungen** — dort sind sie 7,0 se bzw. 4,1 se und damit außerhalb des Rauschens. Für die
   **einzelne** Ziehung gilt das skalenfreie `|t| < 3`; mehr als drei Ziehungen mit `|t| ≥ 3` lassen die
   Kontrolle fallen.

**Die gefallenen Kriterien bleiben ausgewiesen** (Regel aus `wiki/fehlerformen.md`). Die Korrektur wird
vor dem Lauf auf dem echten Panel committet; am Kunstsatz bestehen danach alle drei Kontrollen.

Gemessene se je Ziehung am Kunstsatz, als Beleg für die Herleitung:
wöchentlich 0,047–0,052 Pp (n = 495), monatlich 0,192–0,240 Pp (n = 113).

### Nachtrag 5 (15.09.2026, **nach der Abnahme von Teil 1, vor der ersten Zahl von Teil 2**): das gefallene Orakel-Kriterium und der Geltungsbereich der Verhältnis-Schranken

Teil 1 meldete **ORAKEL GEFALLEN** (`orakelTag/monat`, `Mittel/sd = 0,82 < 1,0`). **Dieser Befund bleibt
als gefallen im Protokoll stehen.** Er wird nicht umdatiert und nicht nachträglich bestanden gerechnet.

**Korrektur für die Zukunft, ausdrücklich nachträglich beschlossen** (PM-Entscheid bei der Abnahme):
die **Verhältnis- und t-Kriterien** (`|Mittel|/sd ≥ 1,0`, `t ≥ 8`, und das in Nachtrag 4 bereits
gefallene `t ≥ 20`) gelten **nur für die Orakel-Fassung, deren Sichtweite der Haltedauer entspricht**.
Bei `orakelTag/monat` sieht die Rangfunktion **einen** Tag, gehalten wird **21** — die restlichen 20 Tage
blähen die Perioden-Streuung `sd` auf, ohne den Effekt zu vergrößern; das Verhältnis misst dort die
Verdünnung der Sichtweite, nicht die Verrohrung. **Die Pp-Schranke gilt für alle Fassungen und bleibt das
Hauptkriterium.** Beleg aus denselben Zahlen: `orakelPeriode/monat` — Sichtweite = Haltedauer — liefert
+19,635 Pp bei t = 26,6.

Die vollständige Vorregistrierung von Teil 2 (Außen-Prüfstein gegen Kenneth Frenchs `Mom`, vier
vorregistrierte Rangfunktionen, Tore, Kostenvorprüfung) steht in **`VORREGISTRIERUNG-TEIL2.md`**.
