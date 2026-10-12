# Vor-FOMC-Drift, long (Bau-Agent Nr. 117, PM-Auftrag, 12.10.2026)

Der S&P 500 stieg 1994–2011 in den **24 Stunden vor planmäßigen FOMC-Bekanntgaben** im Mittel um **49 Basispunkte** (14:00 des Vortags bis
14:00 des Bekanntgabetags), unabhängig von der Richtung des Zinsentscheids — Lucca & Moench (2015), „pre-FOMC announcement drift". Nach
2011 blieb die Drift zunächst nur an Sitzungen mit Pressekonferenz (NY Fed 2018) und ist nach 2015 „essentially disappeared" (Kurov, Wolfe &
Gilbert 2021). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Regel (Prosa)

1. **Termine:** die planmäßigen FOMC-Sitzungen 2016–2026 von federalreserve.gov; **Bekanntgabetag A = zweiter Sitzungstag** (Statement 14:00).
   Außerplanmäßige Sitzungen (04.10.2019, 02.03.2020, 15.03.2020), die abgesagte Sitzung 17./18.03.2020 und Notation Votes (2020, 22.08.2025)
   stehen **nicht** in der Liste — wie bei Lucca & Moench nur „scheduled" Bekanntgaben. Liste: `params.fomcTage` (87 Tage, 84 Mittwoche,
   3 Donnerstage in Wahlwochen: 08.11.2018, 05.11.2020, 07.11.2024).
2. **Einstieg:** Eröffnung des Vortags der Bekanntgabe (A−1). Die Tag-Form steigt zur Eröffnung des Tages **nach** dem Signal ein, also steht
   das Signal am Tag **A−2**.
3. **Signal am Tag i (long):** der **übernächste Werktag (Mo–Fr) nach `sicht.datum(i)` ist ein Listentag**. Gerechnet aus dem Datum und der
   Liste, die in der Wirklichkeit ein Jahr im Voraus feststeht (FORM.md §3: Terminlisten gehören als `params` in `kandidat.json`) — kein
   Handelstag der Tafel hinter i wird gelesen (Blick-nach-vorn-Regel). Sitzungen am Donnerstag oder Dienstag folgen derselben Rechnung.
4. **Ausstieg:** Eröffnung des ersten Handelstags ≥ Einstieg + 1 (**H1**: Eröffnung A−1 bis Eröffnung A — das Lucca-Moench-Fenster ohne die
   letzten Stunden vor 14:00, dafür mit dem Vormittag von A−1) und + 2 (**H2**: bis Eröffnung A+1, enthält die Bekanntgabe und die
   Pressekonferenz). Zwei Konfigurationen, vorab festgelegt.
5. **Umsatzklassen 1–3**, long (die Quelle misst den Index; eine Short-Seite gibt es nicht).

**Feiertage.** Läge auf A−1 ein Börsenfeiertag, rutschte der Einstieg auf A. Zählung 2016–2022: alle 54 Signaltage mit Einstieg exakt am
Vortag der Bekanntgabe (unten); 2016–2026 liegt keine Sitzung neben einem Feiertag.

## Parameter (alle aus den Quellen, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Fenster | Vortag der Bekanntgabe bis Bekanntgabe (24 h, 14:00–14:00) | Lucca & Moench (2015), Abstract; VoxEU-Spalte der Autoren |
| Termine | 87 planmäßige Bekanntgabetage 2016–2026 (`params.fomcTage`) | federalreserve.gov: FOMC calendars (2021–2027), historical materials 2016–2020 |
| Signaltag | A−2 (übernächster Werktag nach dem Datum = A) | Bauregel der Tag-Form: Einstieg = Eröffnung des Folgetags = A−1 |
| Haltedauer | 1 Handelstag (H1 ≈ Quelle), 2 (H2 mit Bekanntgabe) | Lucca & Moench (2015): 24-Stunden-Fenster |
| Klassen | 1–3 (≥ 50 Mio $ Tagesumsatz) | Auftragsregel 2 des Ideen-Agenten |
| Richtung | long | Quelle (+49 Bp) |

## Beleg

- **Regel und Größe:** Lucca, D. O. & Moench, E., „The Pre-FOMC Announcement Drift", *Journal of Finance* 70(1) (2015) 329–371, DOI
  10.1111/jofi.12196; Staff Report 512 der NY Fed: https://econpapers.repec.org/RePEc:fip:fednsr:512 ; VoxEU-Spalte der Autoren:
  https://cepr.org/voxeu/columns/predictable-movements-asset-prices-around-fomc-meetings (beide abgerufen 2026-10-12). Befund: **S&P 500
  +49 Bp im Mittel in den 24 Stunden (14:00–14:00) vor planmäßigen FOMC-Bekanntgaben, September 1994 – März 2011**, in beide Zinsrichtungen;
  nicht bei Staatsanleihen, nicht vor anderen Makro-Terminen; in anderen großen Aktienindizes ähnlich.
- **Fortdauer / Abschwächung nach 2015 (Pflichtquelle des Auftrags):**
  - Kurov, A., Wolfe, M. H. & Gilbert, T., „The disappearing pre-FOMC announcement drift", *Finance Research Letters* 40 (2021) 101781,
    https://ideas.repec.org/a/eee/finlet/v40y2021ics1544612320315956.html (abgerufen 2026-10-12). Abstract: Stichprobe bis Dezember 2019
    verlängert; „after first appearing before FOMC announcements accompanied by the Fed Chair press conferences, the pre-FOMC drift
    **essentially disappeared after 2015** in both announcements accompanied by press conferences and announcements not accompanied by
    press conferences"; mögliche Erklärung: geringere Unsicherheit.
  - Liberty Street Economics (NY Fed, 2018), „The Pre-FOMC Announcement Drift: More Recent Evidence",
    https://libertystreeteconomics.newyorkfed.org/2018/11/the-pre-fomc-announcement-drift-more-recent-evidence.html (abgerufen 2026-10-12):
    April 2011 – Juni 2018 **„about 40 basis points"** nur an Tagen **mit Pressekonferenz** (Eröffnung A−1 bis Mittag A), ohne Pressekonferenz
    „no longer any evidence of excess returns ahead of the release". Seit 2019 hat jede Sitzung eine Pressekonferenz.
  - Ein BIS-Arbeitspapier (Suchergebnis, nicht gelesen) meldet nach 2011 eine Verschiebung auf den Tag A−2 bei 22 Bp — nachrichtlich.
- Brutto-Beleg nach Auftragsregel 2: +0,49 Pp je Umlauf liegt über dem Dreifachen der Kassa-Hürde (0,135 / 0,195 / 0,256 Pp); für die Zeit
  nach 2015 gibt es **keinen** Beleg einer Größe — die Erwartung trägt das.

## Wogegen geprüft (Regel 1)

- `pruefstrasse/register.json` (nur Donchian-20), `warteschlange/` (Donchian-20, HVRP), `erledigt/` (Donchian-20), `ideen-verworfen.md`
  (Trendfaktor, Kurzfrist-Momentum-Umschlag): keine FOMC- oder Terminregel.
- `wiki/belegstand.md`: kein Eintrag zu FOMC, Zinsentscheiden oder Makro-Terminen (gesucht: fomc, Kalender, Saison). Nächstverwandt sind die
  Übernacht-Familie (vier NEIN, gedeckelt — aber jede Nacht, nicht der FOMC-Vortag) und Nachrichten-Stimmung (GDELT-Ton, nicht belegt).
  `wiki/aufloesungswand.md`: Übernacht-Klasse „~735–872 nötige Tage" — hier sind es 54 Termine; die Wand steht (unten).

## Machbarkeit vor der Auflösungswand (Regel 3) — und was das Messgerät hier misst

- **Signaltage / Trades (gezählt 12.10.2026, Panel 2016–2022, nur Zählung, keine Renditen; Skript `kalender-zaehlung.js` im Kratzordner des
  PM-Chats):** 55 planmäßige Bekanntgaben in der Entdeckung, **54 Signaltage** (27.01.2016 ohne Umsatzklasse am Panelanfang), **43.949 Signale,
  814 je Tag, 1.648 Reihen**; **alle 43.949 Einstiege exakt am Vortag der Bekanntgabe**, 5 ohne Folgezeile. Erster Signaltag 14.03.2016,
  letzter 12.12.2022.
- **Messgerät (FORM.md §3): Überschuss gegen den Topf derselben Zelle.** Das Signal feuert am Tag A−2 für **praktisch jede zulässige Reihe der
  Klasse** — der Topf (gleicher Einstiegstag, gleiche Dauer, Klasse, lebend) ist dieselbe Menge, der Überschuss `u = r − Topf` ist **per Bau
  ≈ 0**, `uNetto = −Hürde`, das Urteil wird **„nein"** sein — gleichgültig, ob die Drift existiert (so prüft `pruefstrasse/test.js` den Adapter:
  „Markttag-Effekt steckt im Topf"). **Die Tag-Form misst Querschnittsregeln, nicht Marktzeit-Regeln.** Die Drift selbst steht nur in der
  Rohreihe (`entdeckung.roh`), die der Läufer ausweist, aber nicht beurteilt. Dem PM in der Übergabe gemeldet; ein Kalender-Kandidat braucht
  eine Bewertung gegen Nicht-Termin-Tage oder gegen `markt` (Läufer-Änderung, nicht dieser Ordner).
- **Auflösung der Rohreihe (nachrichtlich):** 54 Termine = 54 Cluster (der Querschnitt bewegt sich am FOMC-Vortag gemeinsam). Streuung einer
  Tagesrendite liquider Aktien 2016–2022 grob 1,3–1,6 Pp → se ≈ 0,18–0,22 Pp → **MDE₈₀ ≈ 0,5–0,6 Pp je Termin (H1)**, H2 ≈ 0,7–0,85.
  **Behauptung:** +0,49 Pp (1994–2011), nach 2015 ≈ 0. **Kriterium MDE₈₀ ≤ 2 × Behauptung:** 0,6 ≤ 0,98 ✓ — die Rohreihe könnte die alte
  Größe ausschließen (erwartet) oder bestätigen; das Topf-Urteil kann beides nicht.
- Tor 1 (4 × Bestätigungs-MDE) ist für den Überschuss gegenstandslos (≈ 0), für die Rohreihe unerreichbar (≈ 2 Pp).

## Erwartung (vorab)

Richtung positiv (behauptet). **Roh** in liquiden Werten 2016–2022, H1 (Eröffnung A−1 bis Eröffnung A): **0 bis +0,3 Pp je Termin** — Kurov et
al. sprechen für ≈ 0, die NY Fed für ~+0,4 an Pressekonferenz-Tagen (2016–2018 jede zweite Sitzung, ab 2019 jede); H2 enthält die Bekanntgabe
und ist unsicherer. **Überschuss gegen den Topf:** ≈ 0 brutto, netto −Hürde — erwartetes Urteil des Läufers **„nein"**, das nur „kein
Querschnittseffekt" bedeutet. Placebo (anderer Wert, gleicher Tag) sieht denselben Tag: ≈ 0. Verschobenes Signal (+20 Handelstage) landet
mitten im Sitzungsintervall: ebenfalls ≈ 0.

## Abweichungen von den Quellen (begründet)

1. Fenster Eröffnung A−1 bis Eröffnung A (H1) statt 14:00 A−1 bis 14:00 A: die Tag-Form kennt nur Eröffnungen; es fehlen die Stunden
   Eröffnung–14:00 des Tages A, hinzu kommt der Vormittag von A−1. Die Gegenprobe „Einstieg einen Tag später" (Eröffnung A) zeigt, ob der
   Rest des Fensters trägt. H2 schließt die Bekanntgabe ein — das ist **nicht** das Fenster der Quelle, sondern die zweite Konfiguration.
2. Signal am Tag A−2 über den **Werktag** statt den **Handelstag**: ein Feiertag auf A−1 verschöbe den Einstieg; 2016–2026 kommt das nicht vor.
3. Universum: liquide US-Aktien des Panels (Klassen 1–3), gleichgewichtet je Reihe, statt S&P 500 (wertgewichtet); Zeitraum 2016–2022.
4. Die Liste enthält nur planmäßige Sitzungen; die Notfallsitzungen vom März 2020 (02.03., 15.03.) fehlen, wie bei Lucca & Moench.
