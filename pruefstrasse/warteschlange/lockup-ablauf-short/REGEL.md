# Ablauf der Lock-up-Frist, short (Ideen-Agent, 21.10.2026)

Beim Börsengang verpflichten sich Altaktionäre (Gründer, Wagniskapital, Mitarbeiter), ihre Aktien eine Zeit lang nicht zu verkaufen. Diese
Lock-up-Frist dauert in den USA fast immer **180 Tage ab dem Prospekt**. Ihr Ende steht also vom ersten Handelstag an fest. Trotzdem fällt
der Kurs in den Tagen davor und am Ablauftag. Das Angebot an Aktien steigt (der Umsatz bleibt danach rund 40 % höher), und Leerverkäufe sind
für junge Werte knapp und teuer, deshalb wird die bekannte Last nicht vorab eingepreist. Alles Simulation mit virtuellem Kapital, keine
Anlageberatung.

## Regel (Prosa)

1. **Börsengang:** Den Tag der ersten Notierung liefert die Sicht nicht. Ersatz ist das Datum der **ersten Zeile der Reihe**, `datum(0)`.
   Reihen, deren erste Zeile vor dem **01.02.2016** liegt, notierten schon am Panelanfang (04.01.2016) und sind keine Neuemissionen.
   `datum(0)` liegt hinter der Schranke (0 ≤ i), die Regel blickt also nicht nach vorn.
2. **Ablauftag E** = Preisfeststellung + 180 Kalendertage. Die Preisfeststellung liegt in den USA am Abend vor der ersten Notierung, also
   gilt E = `datum(0)` − 1 + 180. Tag 0 der Quelle ist der erste Handelstag ≥ E.
3. **Signal short** am ersten Handelstag der Reihe mit `datum(i)` ≥ E − 14 Kalendertage und `datum(i)` < E. Vierzehn Kalendertage sind zehn
   Werktage, der Signaltag ist also Tag −10 der Quelle (Kunsttest: Ablauf 03.07.2021, Feiertag 05.07., Signal 21.06. = Tag −10). Je Reihe
   gibt es höchstens ein Signal.
4. **Einstieg** zur Eröffnung des Folgetags (≈ Tag −9). Die Quelle geht zum Schluss von Tag −10 short; die eine Übernacht dazwischen kann
   die Tag-Form nicht mitnehmen. **Ausstieg** nach **11 Handelstagen** zur Eröffnung von ≈ Tag +2. Das entspricht dem Deckungszeitpunkt der
   Quelle (Schluss Tag +1).
5. **Alle Umsatzklassen 0–3** (Vorgabe der Form). Die Quelle verlangt nur 1 Mio $ Tagesumsatz und 1 $ Kurs; unsere Klasse 0 beginnt bei
   5 Mio $ und ist damit strenger. Im liquidesten Quintil der Quelle ist der Effekt am größten (−3,23 %).

## Parameter (alle aus den Quellen, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Sperrfrist | 180 Kalendertage ab Preisfeststellung | Quelle 1 („IPO pricing date + 180 calendar days, mapped to the next trading day"); Field & Hanka (2001): Mehrzahl der Verträge 180 Tage |
| Preisfeststellung | Vortag der ersten Notierung (`preisVorNotierung` 1) | US-Brauch (Preis am Abend, Handel am Folgetag); die Sicht kennt nur die erste Notierung |
| Fenster | Schluss Tag −10 bis Schluss Tag +1 | Quelle 1, vorregistriertes Hauptfenster (−10, +1) |
| Vorlauf | 14 Kalendertage = 10 Werktage | Umrechnung von Tag −10 ohne Blick in den Kalender nach vorn |
| Haltedauer | 11 Handelstage | Eröffnung Tag −9 bis Eröffnung Tag +2 ≈ Schluss −10 bis Schluss +1 |
| Richtung | short | Quelle 1 (CAR −1,97 %), Field & Hanka (−1,5 % in drei Tagen) |
| `ersteZeileAb` | 2016-02-01 | **Datenregel, kein Handelsparameter:** schließt Reihen aus, die am Panelanfang (04.01.2016) schon notieren oder dort erst nach Datenlücken einsetzen; ein Monat Puffer. Er verwirft nur Signale, er wählt keine aus. |

## Beleg

- **Quelle 1 (unabhängiger Nachbau nach 2010, vorregistriert):** „US IPO lockup expirations, 2007–2025, built from the point-in-time IPO
  calendar", What Works in Trading, https://whatworksintrading.substack.com/p/us-ipo-lockup-expirations-20072025 (abgerufen 2026-10-21).
  1.123 handelbare US-Abläufe 2007–2025, Kalender der Börsengänge zum jeweiligen Zeitpunkt. Marktbereinigt gegen SPY, t aus dem Alpha
  eines Kalenderzeit-Portfolios, Annahmeschwelle t ≤ −3 vorab festgelegt. Ergebnisse:
  - Fenster (−10, +1): **CAR −1,97 %, t −4,47**, 58 % der Fälle negativ.
  - Teilzeiträume: 2007–2012 −0,53 % (n 115, t −0,60); **2013–2018 −2,68 % (t −3,48); 2019–2025 −1,92 % (t −3,24)**. Unsere Entdeckung
    2016–2022 liegt ganz in den beiden starken Abschnitten.
  - Liquidestes Quintil −3,23 % (t −2,85), teuerstes Quintil −3,68 % (t −3,16).
  - Placebo bei Börsengang + 540 Tage: −0,66 % (t −1,59). Versatzreihe: Plateau von Tag 90 bis 240 (Tag 150 −2,88 %), nach 365 Tagen weg.
  - **Kosten:** netto nach institutionellen Kosten ohne Leihgebühr +1,37 % je Ereignis; die Leihgebühr frisst den Rest ab etwa 10 % p. a.
    (Gewinnschwelle). Die Information Ratio gegen SPY ist in jeder Kostenzeile negativ, weil das Kapital nur zu 21 % arbeitet.
- **Klassiker:** Field, L. C. & Hanka, G., „The Expiration of IPO Share Lockups", *Journal of Finance* 56(2) (2001) 471–500 (1988–1997):
  dreitägige Überrendite **−1,5 %**, Umsatz danach dauerhaft +40 %. Brau, Carter, Christophe & Key (2004, *Managerial Finance*):
  signifikant negativ um den Ablauf.
- **Mechanismus nach 2010:** Gibbs & Hao, „Short Selling Around the Expiration of IPO Share Lockups" (SWFA 2014,
  https://mediacast.blob.core.windows.net/production/Faculty/StoweConf/submissions/swfa2014_submission_184.pdf, abgerufen 2026-10-21):
  Leerverkäufe steigen Wochen vor dem Ablauf, gipfeln am Vortag, und mehr Leerverkauf geht mit schlechterer Rendite am Ablauftag einher.
- **Gegenstimmen (Abschlussarbeiten, nur Suchergebnis):** Aalto (US 2004–2023) −0,7 % in drei Tagen; Erasmus (2000–2020) am Ablauftag
  nichts, aber **−0,94 % in den fünf Tagen davor** — beide kleiner, beide auf kürzeren Fenstern, die das Fenster (−10, +1) nur teilweise
  abdecken.
- **Regel 2:** Brutto-Beleg −1,97 Pp je Umlauf. Das Dreifache der Kassa-Hürde ist 0,47 / 0,26 / 0,20 / 0,14 Pp für die Klassen 0–3; die
  Quelle liegt in jeder Klasse darüber. Die Kosten rechnet die Prüfstraße selbst. **Nicht** gerechnet wird die Leihgebühr eines
  Leerverkaufs; für 16 Kalendertage bei 10 % p. a. wären das rund 0,44 Pp, bei schwer leihbaren Werten ein Vielfaches. Ein „belegt"
  wäre deshalb erst nach einer Leihkosten-Prüfung handelbar (in der Simulation ersatzweise über einen Put oder CFD, beides teurer).

## Abweichungen von der Quelle

1. **Börsengangstag aus der ersten Panelzeile.** Neben Börsengängen beginnen Reihen auch mit Abspaltungen, Hochstufungen vom
   Freiverkehr, Direktnotierungen, SPAC-Hüllen und mit den 141 neuen Abschnitten nach Datenlücken über 90 Tage (Panel v2.2, `PANEL-V22.md`).
   Diese Fälle haben keine Lock-up-Frist und verdünnen den Effekt zur Null hin. Umbenennungen erzeugen **keine** Scheinereignisse: Alpaca
   liefert unter dem neuen Kürzel die Geschichte des alten mit (`wiki/datenquellen.md`, Zwillinge). SPAC-Hüllen handeln meist unter 5 Mio $
   und fallen aus den Klassen. Geschätzte Verdünnung 20–30 %.
2. **Vergleich gegen den Tagestopf** derselben Klasse statt gegen SPY. Junge Werte schneiden im Mittel schlechter ab (Placebo der Quelle
   bei 540 Tagen −0,66 %); der Tagestopf aller Werte nimmt diese allgemeine Schwäche nicht heraus. Das ist eine Ungenauigkeit gegen die
   Regel nicht für sie — die Quelle misst ebenfalls gegen den Markt.
3. **Einstieg eine Übernacht später** (Eröffnung Tag −9 statt Schluss Tag −10). Die Gegenprobe „Einstieg und Ausstieg einen Tag später"
   zeigt, wie viel davon abhängt.

## Bewertung

`topf` (Vorgabe). Die Regel wählt **Aktien**, nicht Tage: an einem Signaltag trifft sie im Mittel ein bis zwei von rund 800 Reihen der
Klassen 0–3 (unten), der Signalanteil liegt bei etwa 0,2 %, weit unter der 50-%-Grenze der Form.

## Versatz

`versatzTage` 60 statt der Vorgabe 20. Die Quelle findet ein **Plateau** des Effekts von Tag 90 bis Tag 240 nach dem Börsengang und kein
Signal mehr nach 365 Tagen. Um 20 Handelstage (≈ 29 Kalendertage) verschoben läge das Placebo-Fenster bei Tag ≈ 195–210, also noch im
Plateau, und ein echter Effekt würde die zweiseitige Verschiebungs-Sperrklinke als Messgerät-Fehler auslösen. 60 Handelstage (≈ 87
Kalendertage) verschieben das Fenster auf Tag ≈ 253–269, hinter das Plateau. Ein Signal je Reihe, also überschneidet sich das verschobene
Fenster mit keinem anderen Signalfenster derselben Reihe.

## Wogegen geprüft (Regel 1)

- `pruefstrasse/register.json` (13 Konfigurationen) und `erledigt/`: donchian20-ausbruch-long, fomc-gerade-wochen-long,
  grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie, vor-fomc-long. Die Warteschlange enthält
  dieselben sieben Ordner, `vorrat/` nur LIESMICH. Keine Regel über Börsengänge, Reihenalter oder Sperrfristen.
- `pruefstrasse/ideen-verworfen.md` (Läufe 11.–20.10.) und `ideen-vorrat.md` Nr. 1–17 samt „bewusst nicht aufgenommen": Splits, Reverse-
  Splits, Index-Aufnahme, Ex-Tage und Ereignisse mit Umsatz stehen dort, Börsengänge und Lock-up-Fristen nicht (Suche nach „lock", „IPO",
  „Börsengang", „Neuemission": kein Treffer in `pruefstrasse/`, `wiki/belegstand.md`, `wiki/aufloesungswand.md`).
- `wiki/belegstand.md` ganz: keine Neuemissions- oder Angebotsregel. Nächstverwandt ist die Umsatzfamilie (Hochvolumen-Prämie: nein), doch
  diese Regel liest weder Umsatz noch Kurs, nur das Alter der Reihe. Sie ist ein Kalenderereignis **je Aktie**, keine Abwandlung eines
  gemessenen Signals.
- `origin/pruefstrasse-ergebnisse` fehlt; `origin/pruefstrasse-ideen` trug zuletzt nur `ideen-verworfen.md`.

## Machbarkeit vor der Auflösungswand (Regel 3)

**Signalzahl (Schätzung, keine Kursdaten hier).** US-Börsengänge operativer Firmen nach Ritter (gerundet): 2016 ≈ 75, 2017 ≈ 105,
2018 ≈ 135, 2019 ≈ 110, 2020 ≈ 165, 2021 ≈ 310, erstes Halbjahr 2022 ≈ 30. Signale bis 30.12.2022 kommen von Erstnotierungen bis etwa
Mitte Juni 2022, also **≈ 900 Börsengänge**. Davon haben am Signaltag geschätzt zwei Drittel eine Umsatzklasse (≥ 5 Mio $) → **≈ 600**.
Dazu kommen ≈ 150–250 Reihenanfänge ohne Lock-up (Abweichung 1). Zusammen **≈ 750–850 Trades an ≈ 650–750 Signaltagen**, also gut
einer je Signaltag und **≈ 0,4 je Handelstag** bei rund 800 Reihen je Tag in den Klassen 1–3 (der Läufer zählt nach).

**MDE80.** Die Faustregel des Vorrats (0,23 Pp × √(100.692/N) × √(H/5)) gilt für dicht besetzte Tage und überschätzt hier. Ich rechne
direkt: Die Quelle nennt eine mittlere Schwankung junger Werte von 49 % p. a. (≈ 3,1 % am Tag). Der Überschuss über 11 Tage streut damit
um ≈ 10–13 %. Bei ≈ 700 Signaltagen mit gut einem Trade ist se ≈ 12 / √700 ≈ 0,45 Pp. Ein Zuschlag von 20–30 % für Hansen-Hodrick und
gemeinsame Bewegungen junger Technologiewerte (2020/21) ergibt **se ≈ 0,55 Pp, MDE80 ≈ 2,80 × 0,55 ≈ 1,5 Pp (Spanne 1,2–2,2)**.
Gegenprobe am gemessenen Ereignisfall `grossanstieg-ohne-umsatz`: H5 MDE80 1,09 Pp bei 661 Signaltagen, auf H11 skaliert ≈ 1,6 Pp.

**Urteil der Machbarkeit.** Behauptete Größe 1,97 Pp (Quelle), liquides Quintil 3,23 Pp. MDE80 ≈ 1,5 Pp liegt **unter** der behaupteten
Größe; beide Kriterien sind erfüllt. Nach Verdünnung und späterem Einstieg erwarte ich 0,8–1,6 Pp, also etwa auf der Auflösung:
wahrscheinlich „nicht entscheidbar", ein „nein" (obere Grenze unter null) ist bei ≈ 700 Signaltagen möglich, ein Kandidat ebenso.
Tor 1 (netto ≥ 11,31 × se ≈ 6 Pp) wird die Regel nach heutigem Bau nicht passieren; das gilt für jede Regel der Prüfstraße (Audit Nr. 120).
