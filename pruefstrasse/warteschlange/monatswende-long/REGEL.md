# Monatswende (Turn of the Month), long (Bau-Agent Nr. 117, PM-Auftrag, 12.10.2026)

Aktienkurse steigen im Mittel vom **letzten Handelstag eines Monats (−1) bis zum dritten Handelstag des Folgemonats (+3)** stärker als an
den übrigen Tagen; McConnell & Xu (2008) zeigen für CRSP 1926–2005, dass die gesamte Überrendite des US-Markts über den risikolosen
Zins in diesem Vier-Tage-Fenster anfällt. Etula, Rinne, Suominen & Vaittinen (2020) führen das Muster auf den **monatlichen Zahlungszyklus
der Institutionen** zurück (Liquiditätsbedarf zum Monatsende, danach Rückfluss). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Regel (Prosa)

1. **Fenster:** letzter Handelstag des Monats (−1) bis dritter Handelstag des Folgemonats (+3). Fundstelle: McConnell & Xu (2008), Abstract
   und Abschnitt „The Turn-of-the-Month Interval" („the last trading day of the month and the first three trading days of the following
   month"); so auch Lakonishok & Smidt (1988), auf die sie aufbauen.
2. **Einstieg:** Eröffnung des letzten Handelstags (−1). Die Tag-Form steigt zur Eröffnung des Tages **nach** dem Signal ein, also steht das
   Signal am **vorletzten Handelstag (−2)**.
3. **Signal am Tag i (long):** `sicht.datum(i)` ist der **vorletzte Werktag (Mo–Fr) seines Monats** — der nächste Werktag liegt noch im Monat,
   der übernächste nicht mehr. Gerechnet allein aus dem Datum (Wochentag), ohne einen Handelstag der Tafel hinter i zu lesen (FORM.md §3,
   Blick-nach-vorn-Regel: `istLetzterHandelstagImMonat(i)` ist am Tag i selbst `null`; die Monatsfunktion kann den Folgetag nicht ankündigen).
4. **Ausstieg:** Eröffnung des ersten Handelstags ≥ Einstieg + 4 (**H4**, ≈ Schluss von +3, das Fenster der Quelle) und + 3 (**H3**, ≈ Schluss
   von +2). Zwei Konfigurationen, vorab festgelegt.
5. **Umsatzklassen 1–3** (ab 50 Mio $ Tagesumsatz; Klasse 0 entfällt wie bei `hochvolumen-praemie`: Kassa-Hürde 0,157 Pp je Umlauf). Richtung
   long; eine Short-Seite nennt die Quelle nicht.

**Feiertage.** Die Regel kennt keinen Börsenfeiertag (die Sicht gibt keinen Kalender nach vorn heraus). Ist der letzte Werktag des Monats ein
Feiertag (Karfreitag 30.03.2018, Memorial Day 31.05.2021), fällt das Signal auf den tatsächlich letzten Handelstag und der Einstieg rutscht
auf +1 (Fenster +1…+4 statt −1…+3). Ist der **vorletzte** Werktag ein Feiertag (Memorial Day 30.05.2016 und 30.05.2022, Thanksgiving
28.11.2019), hat die Reihe dort keine Zeile und der Monat fällt aus. Zählung auf dem Panel 2016–2022 (unten): 77 von 79 Signalmonaten
mit Einstieg exakt am letzten Handelstag, 2 verschoben, 3 Monatsenden ohne Signal. Eine Feiertagsliste als Parameter wäre erfunden.

## Parameter (alle aus der Quelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Fenster | −1 … +3 Handelstage um die Monatswende | McConnell & Xu (2008), Abstract; Lakonishok & Smidt (1988) |
| Signaltag | −2 (vorletzter Werktag des Monats, aus dem Datum) | Bauregel der Tag-Form: Einstieg = Eröffnung des Folgetags = −1 |
| Haltedauer | 4 Handelstage (H4 = Fenster der Quelle), 3 (H3) | McConnell & Xu (2008): vier Tage −1…+3 |
| Klassen | 1–3 (≥ 50 Mio $ Tagesumsatz) | Auftragsregel 2 des Ideen-Agenten (Hürde Klasse 0) |
| Richtung | long | Quelle (positive Überrendite im Fenster) |

`params` ist leer: die Regel braucht nur `sicht.datum(i)` (`brauchtDatum: true`, Nr. 117).

## Beleg

- **Regel und Größe:** McConnell, J. J. & Xu, W., „Equity Returns at the Turn of the Month", *Financial Analysts Journal* 64(2) (2008) 49–64.
  Abstract (CFA Institute): https://rpc.cfainstitute.org/research/financial-analysts-journal/2008/equity-returns-at-the-turn-of-the-month ;
  RePEc: https://ideas.repec.org/a/taf/ufajxx/v64y2008i2p49-64.html ; Arbeitspapier (Purdue CIBER 2006): https://docs.lib.purdue.edu/ciberwp/43 ;
  Zahlen des Arbeitspapiers in der Zusammenfassung https://www.cxoadvisory.com/calendar-effects/the-turn-of-the-month-effect/ — alle abgerufen
  2026-10-12. Befund: CRSP 1926–2005, Fenster −1…+3; **1987–2005 wertgewichtet +0,14 Pp je Fenstertag gegen −0,01 Pp an den übrigen 16 Tagen**
  (gleichgewichtet +0,24 gegen +0,04); außerhalb des Fensters im Mittel keine Entlohnung für Marktrisiko; nicht auf Klein- oder Billigwerte
  beschränkt; in 31 von 35 Ländern; nicht durch Umsatz, Fondszuflüsse oder höhere Schwankung erklärt. Je Fenster also rund **+0,56 Pp
  (wertgewichtet) bzw. +0,96 Pp (gleichgewichtet)** — Summe der Tageswerte, eigene Rechnung, kein Wert der Quelle. Der Volltext ist nicht
  frei lesbar; Zahlen aus Abstract und Arbeitspapier-Zusammenfassung.
- **Mechanismus und Fortbestand nach 2010:** Etula, E., Rinne, K., Suominen, M. & Vaittinen, L., „Dash for Cash: Monthly Market Impact of
  Institutional Liquidity Needs", *Review of Financial Studies* 33(1) (2020) 75–111, https://ideas.repec.org/a/oup/rfinst/v33y2020i1p75-111..html
  (abgerufen 2026-10-12). Abstract: „temporary increases in the costs of debt and equity capital that coincide with key dates associated with
  month-end cash needs", Rolle der Institutionen, Grenzen der Arbitrage. **Vorbehalt:** Tagesfenster und Größen stehen im Volltext (nicht frei
  lesbar); hier Beleg für Mechanismus und Fortbestand, nicht für eine Größe nach 2010 in liquiden US-Werten. Ein Suchergebnis nennt zudem
  Kayaçetin (2026, *J. Int. Financial Markets, Institutions & Money*, 30 Länder 1994–2023; Erklärung „seltenes Rebalancing") — nicht geprüft.
- Brutto-Beleg nach Auftragsregel 2: Dreifaches der Kassa-Hürde je Umlauf ist 0,135 / 0,195 / 0,256 Pp (Klassen ab1000 / 250-1000 / 50-250);
  die Quellgröße je Fenster (+0,56 wertgewichtet) liegt darüber. Die Kosten rechnet die Prüfstraße selbst.

## Wogegen geprüft (Regel 1)

- `pruefstrasse/register.json`: nur `donchian20-ausbruch-long` (H5/H10/H20 nein). `warteschlange/`: `donchian20-ausbruch-long`, `hochvolumen-praemie`.
  `erledigt/`: `donchian20-ausbruch-long`. `ideen-verworfen.md`: Trendfaktor, Kurzfrist-Momentum-Umschlag — keine Kalenderregel.
- `wiki/belegstand.md`: **„Monatswende | war Marktzeitgeschäft, nicht Saisonalität | Gedächtnisprotokoll"** (Tabelle der Verworfenen) und in den
  Größen-Ausschlüssen (02.09.2026) „monatswende, monatsende: **ungemessen**, nicht ‚vielversprechend'" (Punkt über der Hürde, Band bis unter
  null). `wiki/aufloesungswand.md`: „Monatswende: hätte 79.500 Tage gebraucht → strukturell unmöglich" — gerechnet für eine **einzelne Index-
  Zeitreihe am CFD-Gefäß**. Nichts davon ist eine Messung in der Tag-Form auf dem Panel; die Regel hier (Fenster, Signaltag, Haltedauer) ist
  die der Quelle und wurde so noch nicht gemessen. Verwandt, aber verschieden: Monats-Momentum (H = 63), Querschnitt-Prüfstand (Rangfunktionen).

## Machbarkeit vor der Auflösungswand (Regel 3) — und was das Messgerät hier misst

- **Signaltage / Trades (gezählt 12.10.2026, Panel 2016–2022, nur Zählung, keine Renditen; Skript `kalender-zaehlung.js` im Kratzordner des
  PM-Chats):** 84 Monatsenden, **79 Signaltage** (Januar/Februar 2016 ohne Umsatzklasse; Mai 2016, Nov 2019, Mai 2022 Feiertag am vorletzten
  Werktag), **64.400 Signale, 815 je Tag, 1.660 Reihen**; 62.566 Einstiege exakt am letzten Handelstag, 1.834 um einen Tag verschoben
  (02.04.2018, 01.06.2021), 17 ohne Folgezeile. Erster Signaltag 30.03.2016, letzter 29.12.2022.
- **Messgerät (FORM.md §3): Überschuss gegen den Topf derselben Zelle** (Einstiegstag, Dauer, Klasse, lebend). Das Signal feuert an einem
  Monatsende für **praktisch jede zulässige Reihe der Klasse** — der Topf ist dieselbe Menge. Der Überschuss `u = r − Topf` ist deshalb **per
  Bau ≈ 0** (bis auf Reihen mit Lücke am Signaltag und Cooldown), unabhängig davon, ob der Kalendereffekt existiert; `uNetto = −Hürde`, die
  Tagesreihe hat fast keine Streuung, das Urteil wird **„nein"** sein. So prüft `pruefstrasse/test.js` den Adapter ausdrücklich („Markttag-
  Effekt steckt im Topf: roh positiv, Überschuss gegen den Topf ~ null"). **Die Tag-Form misst Querschnittsregeln (welche Aktie), nicht
  Marktzeit-Regeln (welcher Tag).** Den Kalendereffekt selbst trägt nur die Rohreihe (`entdeckung.roh`: mittlere Rohrendite je Signaltag), die
  der Läufer ausweist, aber nicht beurteilt. Diese Grenze ist dem PM in der Übergabe gemeldet; ein Kalender-Kandidat braucht eine Bewertung
  gegen die Nicht-Fenster-Tage oder gegen `markt` — das wäre eine Änderung am Läufer, nicht an diesem Ordner.
- **Auflösung der Rohreihe (nachrichtlich):** 79 Signaltage sind 79 Cluster — die 815 Reihen je Tag bewegen sich gemeinsam, der Querschnitt
  liefert für einen Markteffekt keine zusätzliche Unabhängigkeit. Streuung einer 4-Tage-Rendite liquider Aktien (2016–2022, mit 2020) grob
  2,5–3 Pp → se ≈ 0,3 Pp → **MDE₈₀ ≈ 0,8–0,95 Pp je Fenster (H4)**, H3 etwas kleiner. **Behauptung:** +0,56 (wertgewichtet) bis +0,96 Pp
  (gleichgewichtet). **Kriterium MDE₈₀ ≤ 2 × Behauptung:** 0,95 ≤ 1,12 ✓ — die Rohreihe könnte die Quellgröße bestätigen oder ausschließen; das
  Topf-Urteil kann es nicht.
- Tor 1 (4 × Bestätigungs-MDE) ist für den Überschuss gegenstandslos (≈ 0), für die Rohreihe unerreichbar (≈ 3 Pp).

## Erwartung (vorab)

Richtung positiv. **Roh** in liquiden Werten 2016–2022: +0,2 bis +0,5 Pp je Fenster (H4), unter der Quelle (Publikationsabnutzung,
wertgewichtete Großwerte). **Überschuss gegen den Topf:** ≈ 0 brutto, netto −Hürde — erwartetes Urteil des Läufers **„nein"**, das aber nur
„kein Querschnittseffekt" bedeutet und über den Kalendereffekt nichts sagt. Placebo (anderer Wert, gleicher Tag) sieht denselben Markttag:
Placebo-Überschuss ebenfalls ≈ 0, kein Verstoß. Verschobenes Signal (+20 Handelstage) trifft den Monatsanfang +20 ≈ Monatsende −2: auch dort ≈ 0.

## Abweichungen von den Quellen (begründet)

1. Signal am vorletzten **Werktag** statt am vorletzten **Handelstag**: die Sicht kennt den Folgetag nicht (Blick-nach-vorn-Regel). Wirkung
   2016–2022: 2 von 79 Einstiege um einen Tag verschoben, 3 von 84 Monatsenden ohne Signal (oben gezählt).
2. Ausstieg zur Eröffnung von +4 statt zum Schluss von +3 (Konvention der Tag-Form, Trendkanal §5); H3 als zweite, kürzere Konfiguration.
3. Einstieg zur Eröffnung von −1 statt zum Schluss von −2 (die Quelle rechnet Tagesrenditen Schluss-zu-Schluss): die Übernacht-Rendite
   −2 → −1 fehlt; die Gegenprobe „Einstieg einen Tag später" zeigt den Beitrag des Tages −1.
4. Universum: liquide US-Aktien des Panels (Klassen 1–3) statt CRSP gesamt; Zeitraum 2016–2022 statt 1926–2005.
