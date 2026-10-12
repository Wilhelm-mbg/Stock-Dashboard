# Vor-FOMC-Drift, long (Bau-Agent Nr. 117, PM-Auftrag, 12.10.2026 — Bewertung `zeit`, seit Nr. 118 in der Warteschlange)

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
| Bewertung | `zeit` (Topf aller Tage derselben Reihe, Cluster je Kalendertag) | PM-Entscheid 12.10.2026, Auftrag Nr. 118 — Abschnitt „Bewertung" |

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

- `pruefstrasse/register.json` (nur Donchian-20), `warteschlange/` (Donchian-20, HVRP; später am Tag `grossanstieg-ohne-umsatz` — Kursregel),
  `erledigt/` (Donchian-20), `ideen-verworfen.md` (Trendfaktor, Kurzfrist-Momentum-Umschlag): keine FOMC- oder Terminregel.
- `wiki/belegstand.md`: kein Eintrag zu FOMC, Zinsentscheiden oder Makro-Terminen (gesucht: fomc, Kalender, Saison). Nächstverwandt sind die
  Übernacht-Familie (vier NEIN, gedeckelt — aber jede Nacht, nicht der FOMC-Vortag) und Nachrichten-Stimmung (GDELT-Ton, nicht belegt).
  `wiki/aufloesungswand.md`: Übernacht-Klasse „~735–872 nötige Tage" — hier sind es 55 Termine; die Wand steht (unten).

## Machbarkeit vor der Auflösungswand (Regel 3)

- **Signaltage / Trades (gezählt 12.10.2026, Panel 2016–2022, nur Zählung, keine Renditen; Skript `kalender-zaehlung.js` im Kratzordner des
  PM-Chats):** 55 planmäßige Bekanntgaben in der Entdeckung, **54 Signaltage** (27.01.2016 ohne Umsatzklasse am Panelanfang), **43.949 Signale,
  814 je Tag, 1.648 Reihen**; **alle 43.949 Einstiege exakt am Vortag der Bekanntgabe**, 5 ohne Folgezeile. Erster Signaltag 14.03.2016,
  letzter 12.12.2022. Cooldown greift nicht (ein Signal je Sitzung).
- Die Auflösung hängt an der **Bewertung** (nächster Abschnitt): mit dem Tagestopf der Form `tag` ist sie null, mit der Zeitbewertung
  MDE₈₀ ≈ 0,4–0,55 Pp je Termin (H1) gegen eine Behauptung von +0,49 Pp — Kriterium MDE₈₀ ≤ 2 × Behauptung erfüllt.

## Bewertung (`bewertung: "zeit"`, Auftrag Nr. 118) — warum der Tagestopf hier null ergibt

Der Tag-Adapter bewertet jeden Trade gegen den **Topf derselben Zelle**: alle zulässigen Reihen derselben Umsatzklasse mit demselben
Einstiegstag, derselben Dauer und demselben Lebend-Status (FORM.md §3). Die FOMC-Regel signalisiert am Tag A−2 **alle** Reihen der Klasse —
die Signalmenge **ist** der Topf. Der Überschuss `u = r − Topf` ist dann exakt null (bis auf Reihen ohne Zeile am Signaltag, Cooldown und
Maßnahmenfenster), gleichgültig, ob die Drift existiert; `uNetto = −Hürde`, keine Streuung, der Läufer spräche „nein" und trüge zwei
Registerzeilen ein, die nichts über die Drift sagen. So prüft `pruefstrasse/test.js` den Adapter („Markttag-Effekt steckt im Topf"). Die
Form `tag` misst *welche Aktie*, nicht *welcher Tag*.

**Zeitbewertung (Nr. 118):** Überschuss gegen den **Topf aller Tage derselben Reihe** — die mittlere H-Tage-Rendite der Reihe über alle ihre
Einstiegstage (der FOMC-Vortag gegen den eigenen Durchschnittstag, wie Lucca & Moench den Vortag gegen alle übrigen Tage stellen) —, **Cluster
je Kalendertag** (ein Signaltag = eine Sitzung = ein Cluster; Hansen-Hodrick über die Tagesreihe wie bisher). *Nachtrag Nr. 118 (12.10.2026,
FORM.md §3):* der zeitliche Topf schließt die Signalfenster der Reihe und alle sich überschneidenden Fenster aus und wird je Zeitraum
(Entdeckung / Prüfung) gerechnet — die hier angenommene Verdünnung ≈ 3 % entfällt ganz. Nicht gewählt wurde der Überschuss gegen null (der
reine Fensterertrag, wie Lucca & Moench ihn ausweisen): er rechnete die unbedingte Drift der Reihe der Regel zu; der rohe Fensterertrag steht
als `roh` im Protokoll daneben.

**Auflösung, vorgerechnet.** Cluster 2016–2022: **55 planmäßige Bekanntgaben** (56 Sitzungen abzüglich der abgesagten vom 17./18.03.2020;
54 mit Signal und Umsatzklasse). σ_Fenster = Streuung des Cluster-Mittels (gleichgewichtete H-Tage-Rendite der ≈ 814 liquiden Reihen abzüglich
Topf) über die Termine; der Querschnitt bewegt sich am FOMC-Vortag gemeinsam und bringt keine Unabhängigkeit. Tagesstreuung des
gleichgewichteten liquiden US-Markts 2016–2022 ≈ 1,0 Pp (ohne 2020) bis 1,4 Pp (mit 2020) → H1: σ ≈ 1,0–1,4 Pp → se = σ/√55 ≈ 0,13–0,19 Pp →
**MDE₈₀ = 2,8016 × se ≈ 0,38–0,53 Pp je Termin (H1)**; H2: σ ≈ 1,4–2,0 (× √2) → **MDE₈₀ ≈ 0,53–0,76 Pp**. Behauptung +0,49 Pp (1994–2011):
**MDE₈₀ ≤ 2 × Behauptung erfüllt** (0,53 ≤ 0,98), die alte Größe läge etwa an der MDE₈₀ — ihre Bestätigung bei 80 % Macht ist grenzwertig,
ihr Ausschluss (obere Grenze unter 0,49), wenn die Drift wie bei Kurov et al. fehlt, möglich. Tor 1 (4 × projizierte Bestätigungs-MDE;
Bestätigung 2023–2026 ≈ 29 Termine → MDE_B ≈ 2 × se × √(1735/886) ≈ 0,36–0,53 → Tor 1 ≈ 1,5–2,1 Pp) bleibt unerreichbar.

## Versatz

Vorgabe 20 Handelstage **beibehalten** (kein `versatzTage`-Feld; geprüft 12.10.2026, Nachlieferung Nr. 118, gegen den Handelskalender des
Panels 2016–2022, Skript `fomc-versatz.js` im Kratzordner des Bau-Agenten): die Abstände aufeinanderfolgender Einstiegstage (A−1) betragen
27 bis 63 Handelstage; ein um 20 Handelstage verschobener Einstieg trifft **kein** anderes Fenster (H1: 0 Treffer, H2: 0 Treffer von 55
Bekanntgaben), ebenso 5–25; erst ein Versatz von 30 träfe 5 (H1) bzw. 24 (H2) Fenster.

## Erwartung (vorab)

Richtung positiv (behauptet). Überschuss (Zeitbewertung) in liquiden Werten 2016–2022, H1 (Eröffnung A−1 bis Eröffnung A): **0 bis +0,3 Pp
je Termin brutto** — Kurov et al. sprechen für ≈ 0, die NY Fed für ~+0,4 an Pressekonferenz-Tagen (2016–2018 jede zweite Sitzung, ab 2019
jede); H2 enthält die Bekanntgabe und ist unsicherer. Erwartetes Urteil: **„nicht entscheidbar"** (erwartete Größe unter der MDE₈₀); ein
Ausschluss der Lucca-Moench-Größe ist möglich. Placebo (anderer Wert, gleicher Tag) sieht denselben Tag und zeigt in der Zeitbewertung
denselben Überschuss — bei einer Marktzeit-Regel kein Verstoß, sondern die Regel selbst; *Nr. 118:* dieses Placebo **entfällt** im Modus
`zeit` und steht im Protokoll als „entfällt (zeit)", Placebo ist das verschobene Signal. Verschobenes Signal (+20 Handelstage) landet mitten
im Sitzungsintervall (≈ 31 Handelstage): dort ≈ 0 erwartet, die Gegenprobe trägt (das Protokoll weist den Anteil überschneidender verschobener
Fenster aus; hier erwartet ≈ 0).

## Abweichungen von den Quellen (begründet)

1. Fenster Eröffnung A−1 bis Eröffnung A (H1) statt 14:00 A−1 bis 14:00 A: die Tag-Form kennt nur Eröffnungen; es fehlen die Stunden
   Eröffnung–14:00 des Tages A, hinzu kommt der Vormittag von A−1. Die Gegenprobe „Einstieg einen Tag später" (Eröffnung A) zeigt, ob der
   Rest des Fensters trägt. H2 schließt die Bekanntgabe ein — das ist **nicht** das Fenster der Quelle, sondern die zweite Konfiguration.
2. Signal am Tag A−2 über den **Werktag** statt den **Handelstag**: ein Feiertag auf A−1 verschöbe den Einstieg; 2016–2026 kommt das nicht vor.
3. Universum: liquide US-Aktien des Panels (Klassen 1–3), gleichgewichtet je Reihe, statt S&P 500 (wertgewichtet); Zeitraum 2016–2022.
4. Die Liste enthält nur planmäßige Sitzungen; die Notfallsitzungen vom März 2020 (02.03., 15.03.) fehlen, wie bei Lucca & Moench.
5. Bewertung gegen den zeitlichen Topf derselben Reihe statt gegen den Tagestopf der Form `tag` (oben begründet; `bewertung: "zeit"`, Nr. 118).
   Bis Nr. 118 lag der Kandidat im `pruefstrasse/vorrat/`; seit dem 12.10.2026 steht er wieder in der Warteschlange.
