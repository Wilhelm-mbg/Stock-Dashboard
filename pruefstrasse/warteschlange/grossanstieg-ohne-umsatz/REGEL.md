# Großer Tagesanstieg ohne Umsatz, long (Ideen-Agent, 12.10.2026)

Steigt eine Aktie an einem Tag um mehr als 8 %, **ohne dass der Umsatz auffällig zunimmt** (abnormaler Umsatz im untersten
Quintil der Quelle), läuft der Kurs in den folgenden fünf bis zwanzig Handelstagen weiter (Drift). Mit hohem Umsatz kehrt
derselbe Anstieg dagegen um. Die Erklärung des Autors: Der Umsatz misst, wie stark der Markt sofort auf eine firmeneigene
Nachricht reagiert. Wenig Umsatz bedeutet Unterreaktion, und die holt der Kurs danach nach. Alles Simulation mit virtuellem
Kapital, keine Anlageberatung.

## Regel (Prosa)

1. **Ereignis:** Die log-Tagesrendite `ln(c_i / c_{i−1})` ist **größer als 0,08**. Das ist Proxy A der Quelle, die Schwelle 8 %
   (Kudryavtsev 2019 §4, „Proxy A … exceeding 8% … The 8% threshold allows substantially expanding the working sample"). Die
   Quelle rechnet durchgehend mit log-Renditen (Fn. 3). Die Kurse sind bereinigt, ein Split erzeugt also kein Scheinereignis.
2. **Kappe:** Der Betrag der Rendite übersteigt 50 % nicht (Quelle §4, Filter iii). Weil die Quelle mit log-Renditen rechnet,
   wird die Kappe hier ebenfalls als log-Rendite ≤ 0,5 gelesen.
3. **Abnormaler Umsatz** `ATV0 = (Vol_i − Mittel(Vol_{i−250…i−1})) / Stdabw(Vol_{i−250…i−1})`, berechnet aus Stück
   (bereinigt) über die **250 Handelstage vor dem Ereignis** (Quelle Gl. 3). Die Stichproben-Stdabw. hat den Nenner 249.
   Fehlt im Fenster ein Wert, gibt es kein Ereignis (Quelle §4, Filter i: „at least 250 trading days before").
4. **Signal long**, wenn **ATV0 ≤ 1,52**. Das ist die Grenze des untersten ATV0-Quintils, wie sie die Quelle in Tabelle 2 nennt
   („1st quintile 1.52"). Die Quelle teilt nach Quintilen der **ganzen** Stichprobe. Würde man das als Regel nachbauen, schaute sie
   in die Zukunft. Deshalb wird die von der Quelle **veröffentlichte** Grenze als feste Schwelle übernommen. Sie ist nicht erfunden
   und nicht an unseren Daten geschätzt.
5. **Einstieg** zur Eröffnung des Folgetags (Form `tag`, ohne `bestaetigt`). Die Quelle misst ab dem Schluss des Ereignistags
   (AR Tag 1 = +0,25 Pp). Was davon in der Übernachtlücke liegt, kann dieser Einstieg nicht mitnehmen. Die Prüfstraße weist das in
   der Gegenprobe „Einstieg einen Tag später" aus. Den Cooldown von 5 Tagen setzt der Adapter.
6. **Ausstieg** zur Eröffnung des ersten Handelstags ≥ Einstieg + 5 bzw. + 20. Das sind die Fenster „1 to 5" und „1 to 20" aus
   Tabelle 4A. Die Fenster „1" und „2" entfallen, weil sie fast ganz in der Lücke vor dem Einstieg liegen.
7. **Umsatzklassen 1–3** (ab 50 Mio $ Tagesumsatz). Die Quelle untersucht S&P-500-Werte, also Großwerte. Klasse 0 ist ihr fremd.

Die Quelle prüft auch die Gegenseite (Anstieg mit hohem ATV, Sturz mit niedrigem ATV → short; Sturz mit hohem ATV → long-Umkehr).
Dieser Kandidat nimmt **nur** den Fall „Anstieg mit niedrigem ATV → long". Die Konfigurationen der Tag-Form unterscheiden sich nur
in Richtung, Haltedauer und Klassen, deshalb hat ein Kandidat genau eine Signaldefinition. Die Sturz-Seite (+1,57 Pp bei 20 Tagen)
überschneidet sich mit `hochvolumen-praemie` und der Kapitulation. Sie wäre ein eigener, späterer Kandidat und bleibt hier außen vor.

## Parameter (alle aus der Quelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Ereignisschwelle | log-Tagesrendite > 0,08 | Kudryavtsev 2019 §4, Proxy A (8 %), Fn. 3 (log) |
| Kappe | log-Rendite ≤ 0,5 | §4, Filter iii |
| Umsatzfenster | 250 Handelstage vor dem Ereignis | §4, Gl. 3 |
| ATV-Schwelle | ≤ 1,52 (Grenze unterstes Quintil) | Tabelle 2 |
| Haltedauern | 5 und 20 Handelstage | Tabelle 4A, Fenster 1–5 und 1–20 |
| Richtung | long | Tabelle 4A Panel A, „Low ATV0" |

## Beleg

Kudryavtsev, A. (2019), „The Effect of Trading Volumes on Stock Returns Following Large Price Moves", *Economic Annals* 64(220),
85–116, doi 10.2298/EKA1920085K. Zusammenfassung: https://ea.ekof.bg.ac.rs/index.php/economicannals/article/view/279. Volltext:
http://www.ekof.bg.ac.rs/wp-content/uploads/2014/04/5451.pdf. Beide abgerufen am 2026-10-12. Stichprobe: alle Werte im
S&P 500 von 1993 bis 2017, Tagesdaten von Yahoo, Marktmodell gegen den S&P 500 (Schätzfenster 250 Tage). Ergebnisse waren
„qualitativ gleich" unter marktbereinigten Renditen und Fama-French + Momentum (Fn. 5), ohne überlappende Ereignisse, ohne
Kurse unter 10 $ (Fn. 7), mit Dezil- statt Quintilgrenzen (Fn. 6) und in Überlebens-Gegenproben (Fn. 2).

Tabelle 4A, Panel A (Anstiege, Proxy A, |SR0| > 8 %; 2.841 Anstiege insgesamt, davon rund ein Fünftel im unteren Quintil):

| Fenster | Low ATV0 | High ATV0 | Differenz |
|---|---:|---:|---:|
| Tag 1 | +0,24 (p 6,5 %) | −0,51 | +0,75 |
| 1 bis 5 | **+0,77** (p 1,3 %) | −0,94 | +1,71 |
| 1 bis 20 | **+1,08** (p 0,2 %) | −1,42 | +2,50 |

Der Beleg ist **brutto** (CAR, Marktmodell). Nach der Auftragsregel reicht er, weil er je Umlauf mindestens das Dreifache der
Kassa-Hürde erreicht. Für Klasse 50–250 sind das 3 × 0,085 = 0,256, für 250–1000 3 × 0,065 = 0,195 und für ab1000
3 × 0,045 = 0,135. Das schaffen H5 mit 0,77 und H20 mit 1,08 in allen drei Klassen. Zieht man den Tag-1-Anteil (+0,24) ab, der
größtenteils vor dem Einstieg liegt, bleiben H5 ≈ 0,5 und H20 ≈ 0,8. Auch das ist noch mindestens das Doppelte des Dreifachen der
höchsten Hürde. Die Kosten rechnet die Prüfstraße selbst.

**Vorbehalte:** (a) Die Quelle ist eine Einzelstudie in einer kleineren Zeitschrift, und einen Nachbau gibt es nicht.
(b) Die ATV-Grenze stammt aus der Verteilung der Quelle (S&P 500, Aktien-Stückumsatz 1993–2017). Im Panel 2016–2022 mit
breiterem Universum kann das untere Quintil anders liegen. Dann trifft die feste Schwelle 1,52 mehr oder weniger als ein Fünftel
der Ereignisse. Die Regel bleibt trotzdem die der Quelle.

## Wogegen geprüft (Regel 1)

- `pruefstrasse/register.json`: nur `donchian20-ausbruch-long` (H5/H10/H20, nein). `erledigt/`: dasselbe.
- `warteschlange/`: `donchian20-ausbruch-long` und `hochvolumen-praemie`. Die HVRP ist richtungslos und wählt **hohen** Umsatz
  (Rang ≥ 46/50) ohne Kursbedingung. Dieser Kandidat verlangt einen Kurssprung von über 8 % bei **unauffälligem** Umsatz. Die
  Mengen überschneiden sich wenig: ein Tag mit ATV ≤ 1,52 (gemessen am 250-Tage-Fenster) liegt nur in ruhigen Phasen unter den obersten
  10 % des 50-Tage-Fensters.
- Zweig `pruefstrasse-ergebnisse`: existiert auf origin nicht. Zweig `pruefstrasse-ideen` und `ideen-verworfen.md`: Trendfaktor,
  Kurzfrist-Momentum mit Umschlag, Sprung-Fortsetzung (Jiang & Zhu 2017, verworfen mangels Nettobeleg), Umkehr nach
  Großbewegung (Kudryavtsev 2021, Vor-CAR-Bedingung, verworfen wegen Form und Auflösung), Gutierrez 3-Tage-Verlierer, IBS,
  Plastun, Splits.
  - **Kudryavtsev 2021 ist ein anderes Papier mit einer anderen Bedingung.** Dort hängt das Signal an der kumulierten Vor-CAR
    über 5/10 Tage (Dezile der ganzen Stichprobe, ohne veröffentlichte Grenzen) und an S&P-500-Werten. Hier hängt es am Umsatz
    des Ereignistags mit einer veröffentlichten festen Grenze. Die unbedingte Umkehr, die beide Papiere als „nicht signifikant"
    führen (hier Tabelle 3: Anstiege −0,18 bis −0,22 Pp, p ≥ 24 %), ist **nicht** der Kandidat.
  - **Jiang & Zhu** (Sprung-Fortsetzung) ist dieselbe Familie „Unterreaktion auf Information", hat aber ein anderes Signal: Sprünge
    gegen die eigene Schwankung, ohne Umsatzbedingung.
- `wiki/belegstand.md`:
  - **K4 „Umsatzschock mit Richtung"** (Querschnitt 15.09.): hoher Umsatz an Aufwärtstagen, Top-Dezil, Woche −0,17 Pp (t −2,36).
    Das ist die **Gegenseite** dieser Quelle („High ATV0 → Umkehr", Tabelle 4A −0,94 / −1,42). Das gemessene Vorzeichen passt zur
    Quelle. Die Low-Volume-Seite ist nirgends gemessen.
  - **Kapitulation V2**: Kurssturz mit Volumen, 60m, long. Andere Seite (Sturz) und anderer Takt.
  - Signalstudie, Dip-Familie, Kurzfrist-Umkehr 5 Tage, Momentum, Trendkanal, Nachzügler (Ereignis bei A, Rendite bei B), Ergebnis-
    Drift (Quartalszahlen-Datum, nicht Kurssprung): alle mit anderer Regel.

## Machbarkeit vor der Auflösungswand (Regel 3)

- **Signale je Tag:** Die Panel-Klassen 1–3 haben ≈ 809 Reihen je Tag (Zählung PM, 1.403.463 Zeilen an 1.735 Tagen). In der
  Quelle kommen auf einen S&P-500-Wert rund 0,51 Ereignisse mit |r| > 8 % je Jahr (6.412 in 25 Jahren bei ~500 Werten). Das
  breitere und schwankungsreichere Panel liefert 2016–2022 grob 1–2 je Wert und Jahr, also 0,4–0,8 % der Wert-Tage. Davon sind
  ~45 % Anstiege und davon ~20 % mit ATV ≤ 1,52. Trefferquote je Wert-Tag also ≈ 0,04–0,07 %, mal 809 Reihen ergibt **≈ 0,3–0,6
  Signale je Tag**. Das Fenster braucht 250 Vortage, die Signale beginnen also Ende Dezember 2016. Die Entdeckung 2017–2022
  (≈ 1.500 Handelstage) bringt **≈ 450–900 Ereignisse an ≈ 400–750 Signaltagen**. Die Ereignisse sind dünn gestreut, Häufung an
  einem Tag ist selten.
- **Streuung:** Nach einem Sprung von 8 % ist die Schwankung erhöht. Die Quelle nennt für ihre Werte eine historische
  Tagesstreuung von ≈ 1,9–2,0 %, im Panel liegt sie nach dem Ereignis eher bei 3–3,5 %. Gegen den Topf derselben Zelle ergibt das
  σ(H5) ≈ 7 Pp und σ(H20) ≈ 14 Pp je Ereignis.
- **Standardfehler** bei ≈ 600 Ereignissen, mit Aufschlag 1,1 (H5) bzw. 1,2 (H20) für Hansen-Hodrick und Überlappung: se(H5) ≈
  7/√600 × 1,1 ≈ 0,31 Pp, se(H20) ≈ 14/√600 × 1,2 ≈ 0,69 Pp.
- **MDE80 = 2,8016 × se:** **H5 ≈ 0,88 Pp** (bei 450–900 Ereignissen 0,72–1,0), **H20 ≈ 1,9 Pp** (1,6–2,2).
- **Behauptete Größe:** H5 +0,77, H20 +1,08 Pp (ab Schluss; ab Folgeeröffnung ≈ +0,5 / +0,8).
- **Kriterium (MDE80 ≤ 2 × Behauptung):** H5: 0,88 ≤ 1,54 ✓ (auch am ungünstigen Rand 1,0 ✓). H20: 1,9 ≤ 2,16 ✓. Am ungünstigen
  Rand (450 Ereignisse) liegt 2,2 knapp darüber. → **Ein informatives Urteil ist möglich, vor allem bei H5.** Die Messung kann die
  Quellgröße bestätigen oder ausschließen. Tor 1 (4 × Bestätigungs-MDE, Bestätigung 2023–2026 mit ≈ 300–500 Ereignissen: H5 ≈
  4 × 1,1 ≈ 4,5 Pp) erreicht die Quellgröße **nicht**. Ein „belegt" ist damit praktisch ausgeschlossen, ein Größen-Ausschluss nicht.

## Erwartung (vorab)

Richtung positiv. Größe gegen den Topf laut Quelle +0,77 (H5) und +1,08 Pp (H20) brutto ab dem Schluss. Eigene Erwartung ab
Folgeeröffnung, nach Publikationsabnutzung und im breiteren Universum: **H5 0 bis +0,5 Pp, H20 0 bis +0,8 Pp**, netto um die Hürde
(0,05–0,09 Pp) kleiner. Erwartetes Urteil: **nicht entscheidbar**, die obere Grenze dabei nahe an der Quellgröße oder darunter. Ein
„nein" (obere Grenze netto < 0) ist bei H5 möglich.
