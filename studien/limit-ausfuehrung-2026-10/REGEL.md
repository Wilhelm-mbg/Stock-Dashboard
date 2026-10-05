# Regel: Limit statt Marktorder — die Minutensignale mit passiver Ausführung (05.10.2026)

**Geschrieben und als eigener Commit versiegelt, BEVOR ein Lauf auf echten Daten stattfand.** Auftrag Nr. 106
(= Nr. 29), `Markt-Dashboard-Daten/uebergabe/auftrag-limit-ausfuehrung-2026-10-05.md` (PM, 05.10.2026); Wilhelm
05.10.2026: „Ja, auf jeden Fall Limit Orders." Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

Gesehen vor dieser Regel: die Berichte der Minutenstudie (`studien/vorregistrierung-2026-09-06-signale-minuten/`,
234 Konfigurationen, Urteil NEIN — Marktorder, volle Kassa-Hürde) und die Laufzeiten ihrer Läufe. **Keine
Limit-Rechnung, keine Füllquote, keine Rendite mit Limit-Einstieg** auf echten Daten.

---

## 1. Die Frage

> Tragen die Minutensignale, wenn man **mit einer Limit-Order zum Schluss der Signalkerze** einsteigt, die Spanne
> beim Einstieg also nicht zahlt — gemessen gegen ein Placebo mit derselben Limit-Mechanik, das die
> **Gegenauslese** (Limits werden bevorzugt gefüllt, wenn der Kurs gegen einen läuft) abzieht?

## 2. Signale — unverändert aus der Minutenstudie

Dieselben **13 Detektoren × 3 Zeitrahmen (1m, 5m, 15m) × long/short × 3 Haltedauern (1 h, 3 h, bis Schluss) = 234
Konfigurationen**, mit allem, was die Minutenstudie festlegt (Vorregistrierung §1–§3, §8, Nachträge 1–3, Kennung
`signale-minuten-2026-09-06/v4`): Parameter je Zeitrahmen (`konfig.js PARAM_JE_ZR`), 80-%-Regel je Zeitrahmen,
reguläre Sitzung, Datenfenster 2016-01-01 … 2026-08-31, zulässige Signalkerze (≥ 30 min Rest, Folgekerze), Cooldown
60 min je (Reihe, Detektor, Zeitrahmen), Umsatzklasse des Wert-Tages aus 20 Balkentagen, Ausschluss ± 10 Handelstage
um Kapitalmaßnahmen, nur CS/ADRC, lebend-Flag, Aufruf-Fensterung (`vwap-abstand`) und Vorfilter (`kanaltrend`).
**Keine neuen Signale, keine neuen Parameter.** `konfig.js`, `lesen.js`, `messen.js` der Minutenstudie werden
per `require` benutzt und **nicht geändert**. Ein Signal, das nicht gefüllt wird, bleibt ein Signal (der Cooldown
läuft wie in der Minutenstudie ab dem Signal, nicht ab der Füllung) — die Signalmenge ist Bit für Bit dieselbe.

## 3. Einstieg per Limit

**Limitpreis** L = Schluss der Signalkerze i (`bars[i][1]`, in den Einheiten der gelesenen Datei — bereinigt, wo es
eine Kopie gibt). Long: Kauf-Limit; Short: Verkaufs-Limit. Die Order wird zu Beginn der Kerze nach der Signalkerze
aufgegeben (das Signal steht erst mit dem Schluss von i fest).

**Gültigkeit k (vorab, nicht nach Ergebnis):** die Order lebt **k Kerzen-Takte** nach der Signalkerze, also für die
Kerzen j derselben Sitzung mit `t_i + Z ≤ t_j < t_i + (1 + k) · Z` (Z = Kerzenlänge). Fehlende Kerzen in diesem
Fenster sind Minuten ohne Handel und können nicht füllen; gezählt wird in Uhrzeit, wie die Haltedauern der
Minutenstudie.

| Zeitrahmen | k | Gültigkeit |
|---|---|---|
| 1m | **15** | 15 Minuten |
| 5m | **3** | 15 Minuten |
| 15m | **1** | 15 Minuten |

Begründung: (a) **gleiche Uhrzeit für alle Zeitrahmen**, damit Füllquote und Gegenauslese zwischen den Zeitrahmen
vergleichbar sind und das Warten auf die Füllung überall gleich viel Kurs kostet; (b) **höchstens ein Viertel der
kürzesten Haltedauer** (1 h) — der Ausstieg bleibt an seinem Platz (§4), die tatsächliche Haltedauer schrumpft also
um höchstens 15 min; (c) **höchstens die Hälfte der 30-Minuten-Restregel**, damit das ganze Fenster jeder zulässigen
Signalkerze in der Sitzung liegt; (d) auf 15m ist es genau eine Kerze — kürzer geht dort nicht. Keine andere k wird
gerechnet.

**Zwei Füllregeln** (Long; Short spiegelbildlich mit dem Hoch). Gefüllt wird in der **ersten** Kerze j des Fensters,
die die Bedingung erfüllt:

- **großzügig:** `Tief_j ≤ L` (der Kurs hat den Limitpreis berührt);
- **streng:** `Tief_j ≤ L − Tick`, Tick = **0,01 $ im damals gehandelten Kurs**. Bei bereinigten Dateien ist der Tick
  in Datei-Einheiten `0,01 / f(t_j)` mit `f` = Rückrechnungsfaktor auf den Rohkurs (`lesen.js rohFaktorFunktion`,
  Nachtrag 3 der Minutenstudie); bei Rohdateien f = 1. Verglichen wird in Rohdollar mit einer Toleranz von
  1·10⁻⁶ $ (Gleitkomma): streng `(L − Tief_j) · f ≥ 0,01 − 10⁻⁶`, großzügig `(L − Tief_j) · f ≥ −10⁻⁶`.
  Ist der Kurs einen Tick unter dem Limit gehandelt worden, sind alle Kauf-Orders zum Limitpreis ausgeführt —
  das ist die Füllung, auf die man sich verlassen kann.
- **Füllpreis = L, immer** — auch wenn die Kerze mit einer Lücke unter dem Limit eröffnet. Eine Preisverbesserung
  wird nicht gutgeschrieben (vorsichtig; innerhalb der Sitzung handelt der Kurs auf dem Weg nach unten
  normalerweise durch L).
- Tief/Hoch fehlen in einer 1m-Kerze ⇒ der Schluss zählt dafür (dieselbe Regel wie `verdichtenMinuten` für 5m/15m);
  die Fälle werden gezählt.
- **Ungefüllt** ⇒ kein Handel. Das Signal zählt als „nicht gefüllt"; der Anteil steht je Konfiguration im Bericht
  (Füllquote = gefüllte / Signale mit Einstieg).

Für die Füllentscheidung in Kerze j werden nur Kerzen bis einschließlich j gelesen; nach der Füllung nur noch der
Ausstiegskurs.

## 4. Ausstieg — wie in der Minutenstudie

Marktorder zur **Eröffnung der ersten Kerze mit `t ≥ t_{i+1} + H`** (H = 60 / 180 min), bzw. für „bis Schluss" der
**Schluss der letzten regulären Kerze** des Tages. Der Ausstieg ist **derselbe Kurs wie in der Marktorder-Rechnung**
(Anker `t_{i+1}`, nicht die Füllkerze), damit nur der Einstieg wechselt. Gibt es den Ausstieg nicht, hat der
Horizont keine Beobachtung (wie bisher). Die Füllkerze liegt immer vor der Ausstiegskerze (15 min < 60 min); bei
„bis Schluss" darf sie die letzte Kerze selbst sein.

**Ertrag je Handel:** `r = dir · (Ausstieg − L) / L · 100` (Pp).

## 5. Kosten (vom PM festgelegt)

Die Kassa-Hürde K je Umsatzklasse (`wiki/kosten.md`: **0,1569 / 0,0854 / 0,0647 / 0,0449 Pp** je Umlauf, Fenster
`mitte`, ab 2021) ist die **volle Spanne je Umlauf ohne Provision** (Alpaca berechnet keine).

- **Limit-Einstieg:** ein Umlauf kostet **K/2** (nur der Ausstieg per Marktorder zahlt die halbe Spanne); der
  Einstieg zum Limitpreis wird ohne Spanne gerechnet. `netto = r − K/2`.
- **Marktorder-Kontrolle:** wie bisher **K**. `netto = r − K`.

Die Einstiegsfenster-Hürde der Minutenstudie (Nachtrag 1.12) wird hier nicht gerechnet (der Limit-Einstieg zahlt
keine Spanne; das Fenster des Ausstiegs ist nicht modelliert) — ausgewiesen, keine Nebengröße.

## 6. Kontrollen (Pflicht)

**(1) Placebo mit derselben Limit-Mechanik — misst die Gegenauslese.** Je (Reihe, Tag, Detektor, Zeitrahmen) mit m
Signalen werden **min(m, Zahl der zulässigen Kerzen)** zufällige zulässige Kerzen **desselben Tages und desselben
Wertes** gezogen (ohne Zurücklegen, ohne Kursblick — die Ziehung hängt nur an den Stempeln der zulässigen Kerzen und
an der Saat). Saat deterministisch aus `Reihe|Tag|Detektor|Zeitrahmen|limit` (FNV-1a → mulberry32, wie in der
Minutenstudie). Die p-te Ziehung bekommt die **Richtung des p-ten Signals** dieses Tages (in Zeitfolge) — Kauf-Limits
werden mit Kauf-Limits verglichen. Limitpreis = Schluss der gezogenen Kerze, dieselbe k, dieselben zwei Füllregeln,
derselbe Ausstieg, dieselben Kosten (K/2). Zusätzlich wird für jede Ziehung der **Marktorder-Ertrag** (Eröffnung der
Folgekerze) mitgeschrieben.

**(2) Dieselben Signale mit Marktorder — die alte Rechnung als Abgleich.** Sie muss die Zahlen der Minutenstudie
wiederholen: Zellen (n, Σr, Σr²) je (Detektor, Zeitrahmen, Richtung, Haltedauer, Tag, Klasse, lebend) **bitgleich**
mit den Kandidatenzellen der Minutenstudie (`messen.js`, Zeilenart 0). Im Pilot gegen deren Pilotzellen
(`pilot-0` … `pilot-3`), im Vollauf gegen die gesicherten Zellen unter
`E:/Markt-Dashboard-Archiv/studien-zellen/signale-minuten-*`. Ist das Archiv seit September an einzelnen Dateien
verändert worden, steht jede Abweichung mit Datei und Grund im Bericht; als „wiederholt" gilt der Abgleich, wenn
alle Abweichungen erklärt sind und die Netto-Tagesmittel der Bestätigung je Konfiguration auf 4 Nachkommastellen
übereinstimmen. Zusätzlich prüft `test.js` die Gleichheit mit `messen.messeDatei` an Kunstdaten und an einer echten
Datei, unabhängig vom Archivstand.

**Gespeichert** werden je Zeile Summen (n, Σr, Σr²) je (Detektor, Zeitrahmen, Richtung, Haltedauer, ET-Tag,
Umsatzklasse, lebend) für **sechs Zeilenarten**: Signal-Markt, Signal-streng, Signal-großzügig, Placebo-Markt,
Placebo-streng, Placebo-großzügig. Zähler: Signale, Signale mit Einstieg, gefüllt streng/großzügig je
(Detektor, Zeitrahmen, Richtung), Füllkerzen-Abstand, Lückenfüllungen, Kerzen ohne Tief/Hoch.

## 7. Entscheidregel — die der Minutenstudie, angewandt auf Signal minus Placebo (streng)

**Endpunkt D (strenge Füllregel):** je Konfiguration und ET-Tag
`D_t = Tagesmittel netto(Signal-streng) − Tagesmittel netto(Placebo-streng)`, netto = r − K/2 je Handel (die
Klassenmischung beider Seiten wird so mitgerechnet). Signaltag = Tag, an dem **beide** Seiten mindestens einen
gefüllten Handel mit Beobachtung haben; Tage nur einer Seite werden gezählt und ausgewiesen. **Bündelung über
Handelstage:** Mittel, `se = sd(D_t)/√nTage`, `t = Mittel/se`.

**Holdout unverändert:** Entdeckung 2016-01-04 … 2023-02-06, Bestätigung 2023-02-07 … 2026-08-31, geurteilt allein
über Bestätigungstage ≥ 2021-01-01; die Bestätigung wird genau einmal angefasst, mit der vorher feststehenden
Kandidatenliste (alle 234; Auswahl nur über Tor 1 auf der Entdeckung).

1. **MDE vor dem Urteil:** `MDE_B = 2 · se_B` aus der Streuung der Bestätigungs-Tagesreihe von D (nicht aus ihrem
   Mittel), für jede Konfiguration ausgewiesen, bevor ein Wort fällt.
2. **Tor 1:** Entdeckungs-Tagesmittel von D > 0 **und** ≥ 4 × MDE_B. k₁ = Zahl der Konfigurationen, die bestehen.
3. **Tor 2:** `delta80 = (z_Bonf(k₁) + 0,8416) · se_B` **< K_Kand / 2**, K_Kand = signalgewichtetes Mittel der
   Klassenhürden über die streng gefüllten Signale der Bestätigung (Zählung, keine Rendite). Sonst „nicht
   entscheidbar". k₂ = Zahl der Konfigurationen, die beide Tore bestehen.
4. **Bonferroni über k₂:** `z_Bonf(k) = Φ⁻¹(1 − 0,025/k)` (k = 1 ⇒ 1,96; 5 ⇒ 2,58; 10 ⇒ 2,81).
5. **„Signal schlägt Placebo" (belegt):** beide Tore; ≥ 30 Bestätigungs-Signaltage; D-Tagesmittel_B > 0 und
   `t_B ≥ z_Bonf(k₂)`; Vorzeichen wie in der Entdeckung.
6. **„trägt" — zusätzlich nach Kosten über null:** Netto-Tagesmittel von **Signal-streng** (r − K/2) in der
   Bestätigung > 0 **und** sein `t ≥ z_Bonf(k₂)`. Nur das heißt „trägt".
7. **handelbar:** trägt, **long** (Short nie: Leihe ungemessen, PM-Regel der Minutenstudie) und `delta80 ≤ K_Kand/2`.
8. **Größenaussage (für alle mit ≥ 30 Bestätigungstagen, kein Test):** obere 95-%-Grenze des Brutto-Tagesmittels
   von Signal-streng in der Bestätigung `< K_Kand/2` ⇒ „mit Limit in seiner Klasse zu"; `< 0,0449/2` ⇒ „mit Limit
   in jeder Klasse zu"; sonst „offen".
9. Die **großzügige** Füllregel wird nur beschreibend berichtet (Füllquote, Brutto, Placebo, D, netto) — sie erzeugt
   kein Urteil.

Nachrichtlich, ohne Urteil: Gegenauslese = Placebo-streng minus Placebo-Markt (tagweise gepaart, brutto); Signal-
Markt netto (r − K) neben Signal-streng netto (r − K/2); Sicht „nur lebende Reihen"; Jahresscheiben von D je
Kalenderjahr und letzte 250 Handelstage (Pflichttabelle seit 09.09.).

## 8. Umfang, Reihenfolge, Laufzeit

1. **Kunstdaten-Tests** (`test.js`) — vor und nach diesem Siegel erlaubt.
2. **Pilot 5m/15m** auf den 20 Pilotreihen der Minutenstudie (AAPL MSFT NVDA AMZN JPM XOM PG HD COST UNH COKE NEU
   CRVL WINA DJCO AATC ABVE AC ADAP ACCD), in vier Teilen wie dort (`--teil k/4`). Zweck: Laufzeit, Abgleich mit
   deren Pilotzellen, Füllquoten. **Der Pilotbericht heißt `PILOT.md`, nie `ERGEBNIS.md`, und zeigt Renditen nur
   aus der Entdeckung** (Tage < 2023-02-07) — die Bestätigungstage der Pilotreihen gehören zum Holdout des Vollaufs
   und werden im Pilot nur gezählt.
3. **Hochrechnung** der Vollaufzeit aus dem Pilot (Rechenzeit je Zeitrahmen gegen die des Minuten-Piloten und des
   Minuten-Vollaufs). **Braucht der Vollauf mehr als 6 Stunden, endet die Arbeit dieses Chats nach dem Pilot** mit
   einem Laufplan in der Übergabe; über Nachtläufe entscheidet der PM. Keine geplanten Aufgaben.
4. Vollauf: erst **5m/15m**, dann **1m**, geteilt nur nach Zeitrahmen und `--teil k/n`, nie nach Umsatzklasse
   (Nachtrag 2 der Minutenstudie). Danach `auswerten` ⇒ `ERGEBNIS.md` + `ergebnis.json`.

## 9. Auflösung, vorab überschlagen

Die Minutenstudie realisierte für die dichteste Konfiguration se_B ≈ 0,006 Pp, Median-delta80 0,022–0,060 Pp. D ist
die Differenz zweier Tagesmittel aus nur den gefüllten Handeln: bei einer Füllquote f rund `√2/√f`-mal so streuend —
bei f ≈ 0,5 etwa doppelt. Erwartet: delta80 von D ≈ 0,03 (dicht) bis 0,12 Pp (dünn), gegen K/2 = **0,078 / 0,043 /
0,032 / 0,022 Pp**. Die Studie ist damit für dichte Detektoren in den illiquiden Klassen entscheidbar und für dünne
Detektoren in den liquiden Klassen voraussichtlich **nicht** — dort heißt der Befund „nicht entscheidbar", kein Nein.
Planzahl, kein Urteil; der Bericht stellt die realisierten se_B daneben.

## 10. Was diese Studie nicht sagt

Nichts über andere k, andere Limitpreise (Mitte, Abschlag), Teilfüllungen, Warteschlangenplatz bei Berührung (die
großzügige Regel ist deshalb nur beschreibend), Preisverbesserung bei Lücken, Short-Leihe, neue Detektoren, 60m,
Übernacht, CFD. Die notierte Spanne bleibt eine Untergrenze der Ausstiegskosten.

---

*Jede Abweichung von dieser Regel steht als datierter Nachtrag unter dieser Linie, nie darüber.*
