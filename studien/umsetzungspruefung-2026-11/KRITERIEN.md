# KRITERIEN — Umsetzungsprüfung des Momentum-Buchs (Auftrag Nr. 97, 04.10.2026)

Kennung `umsetzungspruefung-2026-11/v1`. **Gesiegelt:** diese Datei wird vor jedem Lauf von `pruefe.js` in einem eigenen
Commit festgeschrieben. Danach wird am Wortlaut nichts geändert; was sich als nicht messbar zeigt, kommt als **Nachtrag**
mit eigenem Commit ans Ende, der alte Wortlaut bleibt stehen.

**Wozu.** Ein Vorwärtstest über Monate kann den Vorsprung aus dem Rückblick nicht belegen (+7 Pp p. a. trennt sich erst
nach Jahrzehnten vom Zufall). Er kann aber scharf prüfen, ob das Buch **so handelt wie gemessen**
(`studien/massstab-rueckblick-2026-10-04/REGEL.md`) — nach jeder Umschichtung, erstmals am Montag 23.11.2026. Bestanden
heißt nur: die Umsetzung stimmt. Über eine Kante sagt es nichts (`wiki/belegstand.md`: belegte Kanten null).

Grundlage: Vorschlag P1–P7 der Cloud (`origin/pruefung/vorwaertstest-plan`, `pruefberichte/2026-10-vorwaertstest-plan.md`,
Abschnitt 2 und 3.2, Stand `450daed`). Seitdem erledigt: Ausschüttungen werden gebucht (Nr. 87), Buch und Markt tragen
denselben Stempel (Nr. 91/93) — beides wird hier nicht mehr gefordert, sondern **nachgeprüft**.

## Allgemeines

- **Umschichtung** = alle Käufe und Verkäufe des Momentum-Buchs (`mfBuch.trades`, Arten `kauf`/`verkauf`) an einem
  New-Yorker Kalendertag; Nachfassen nach Nr. 94 gehört zum selben Tag. `reihenende`-Buchungen zählen nicht dazu.
  **Ausführungstag** = dieser Tag, **Stichtag** = der letzte Handelstag davor.
- **Handelstag** = ein Tag, an dem SPY im Minutenarchiv `E:/Markt-Dashboard-Archiv/alpaca1m/SPY/` eine reguläre Sitzung hat
  (unabhängig vom Store; die App zählt an ihrer eigenen SPY-Reihe).
- **Der Store ist immer das Prüfobjekt, nie die zweite Quelle.** Gelesen wird eine Kopie bzw. die Datei
  `%APPDATA%\markt-dashboard\store\depot.json` nur lesend in den Speicher. Zweite Quellen: das Kursarchiv auf E:
  (nur lesen), der Code der App im Repo (Universum, Regel), die Setzungen dieser Datei.
- **Drei Urteile je Kriterium:** `bestanden`, `verfehlt`, `nicht prüfbar`. Fehlen Daten für einen Fall und ist kein
  anderer Fall verfehlt, lautet das Urteil **nicht prüfbar — nie bestanden**. Ein nachgewiesener Verstoß bleibt `verfehlt`,
  auch wenn andere Fälle nicht prüfbar sind.
- Schwellen sind **Setzungen**, keine Messungen; jede hat einen Satz Begründung.

## P1 Auswahl

- **Gemessen:** Zielliste des Buchs nach der Umschichtung (gehaltene Ziele + Käufe des Tages; die Kaufreihenfolge ist die
  Rangfolge, weil `planeUmschichtung` die Käufe in Zielreihenfolge plant) gegen eine **Neuberechnung** am Stichtag.
- **Zweite Quelle:** Tagesreihen `E:/Markt-Dashboard-Archiv/archiv1d/bars_1d_<SYM>.json` (Schluss split-bereinigt, nicht um
  Ausschüttungen — dieselbe Kursart wie der Lader der App, `mittelfrist.js` Z. 54); Universum = `UNIVERSUM` aus
  `mittelfrist.js` (Code, nicht Store); Regel = `momentumZiel` aus `mfhandel.js` auf `[t, Schluss, Stück]` bis einschließlich
  Stichtag, `nowMs` = Stempel des Stichtagsbalkens (wie `ausfuehrungVorbereiten`). Hinweis: das Archiv stammt vom selben
  Anbieter (Yahoo) wie der Lader, ist aber eine eigene Ladung; P1 prüft damit Lader, Store, Stichtag und Rangbildung des
  Buchs, nicht den Anbieter.
- **Zahl:** Namen im Buch, die nicht in der Neuberechnung stehen (bei gleicher Zielzahl = halbe symmetrische Differenz);
  dazu Zielzahl beider Seiten und die Reihenfolge der oberen 5 der Neuberechnung, soweit sie am Tag gekauft wurden.
- **Schwelle:** höchstens **2** Namen verschieden **und** die am Tag gekauften der oberen 5 in derselben Reihenfolge.
  Begründung: zwei Namen sind die Rangkante (die Rückblick-Rechner stimmten an allen 19 Tagen überein; ein zweiter Ladestand
  derselben Kurse verschiebt höchstens Nachbarn an der Grenze), ein Tausch in der Spitze ist dagegen kein Kantenrauschen.
- **Nicht prüfbar:** Archiv reicht nicht bis zum Stichtag; ein Name des Buchs fehlt im Archiv und ohne ihn läge die
  Differenz innerhalb der Schwelle.
- **Bei Verfehlen:** Befund an den PM (Ursache: Ladestand, Stichtag, Universum, Regel). Zweimal hintereinander → U-Regel.

## P2 Preis

- **Gemessen:** Ausführungskurs je Kauf und Verkauf (`trades[].kurs`) gegen die **Eröffnung des Ausführungstags**.
- **Zweite Quelle:** `E:/Markt-Dashboard-Archiv/alpaca1m/<SYM>/<Jahr>.json` (SIP, roh), Feld `eroeffnung` der ersten
  Minute ab 09:30 New York dieses Tages. **Split-Faktor:** der Store schreibt den Kurs zur Ausführung und bereinigt ihn nie
  nach; das Minutenarchiv ist roh — beide stehen in der Stückelung des Ausführungstags. Liegt das Verhältnis Kurs/Eröffnung
  innerhalb 1 % eines Split-Verhältnisses aus `alpaca-massnahmen*/<SYM>.json` (`forward_splits`, `reverse_splits`,
  `unit_splits`), wird der Fall mit dem Faktor gerechnet und als „Split-Verdacht" ausgewiesen.
- **Zahl:** Abweichung |Kurs / Eröffnung − 1| in Basispunkten je Fall; **Median** und **Maximum**. Dazu die nachteilige,
  vorzeichenbehaftete Abweichung (Kauf teurer, Verkauf billiger) für die Hochrechnung.
- **Schwelle:** Median **≤ 10 Bp**, kein Fall **> 50 Bp**. Begründung: die Messung nimmt die Eröffnung an; 10 Bp mehr je Seite
  kosten bei 40–45 % Umsatz je Seite und vier Umschichtungen im Jahr rund 0,2–0,4 Pp p. a.; 50 Bp in einem Wert ist kein
  Unterschied zwischen Eröffnungsauktion und erster Minute mehr, sondern ein anderer Kurs.
- **Nicht prüfbar:** keine Minute ab 09:30 des Tages im Archiv für einen Wert.
- **Bei Verfehlen:** Befund an den PM. Zweimal hintereinander → U-Regel.

## P3 Kosten

- **Gemessen:** gebuchte Kosten je Seite. Kauf: `einstand / kurs − 1` (Position oder Gegenbuchung); Verkauf:
  `1 − (pnl + stueck × einstand) / (stueck × kurs)` mit dem Einstand des zugehörigen Kaufs (Splits aus `mfBuch.massnahmen`
  berücksichtigt).
- **Bezug:** 20 Bp je Seite (`mfdepot.js`: `fuehreAus(…, 20, …)`, REGEL §1.2).
- **Schwelle:** virtuelles Buch: jeder Fall **20 Bp ± 0,5 Bp** (Rundung von `pnl` auf Cent). Mit echtem Geld: tatsächlich
  gezahlte Kosten ≤ 30 Bp je Seite (erst prüfbar, wenn es eine Abrechnung gibt). Begründung: das Buch rechnet die Kosten
  selbst — jede Abweichung ist ein Rechenfehler, kein Markt.
- **Hochrechnung P2 + P3:** wertgewichtete nachteilige Abweichung aus P2 plus (Kosten − 20 Bp) aus P3, mal Umsatz dieser
  Umschichtung (beide Seiten / Depotwert vor der Umschichtung), mal 4 Umschichtungen im Jahr, in Pp p. a.
  **Schwelle ≤ 1 Pp p. a.** — etwa ein Siebtel des behaupteten Vorsprungs.
- **Bei Verfehlen:** Einzelfall → Befund (Rechenfehler der App). Hochrechnung > 1 Pp p. a. → U-Regel sofort.

## P4 Ausschüttungen

- **Gemessen:** jede Barausschüttung eines gehaltenen Werts zwischen zwei Umschichtungen ist in `mfBuch.massnahmen`
  (Art `div`) gebucht. Anspruch hat, wer über die Nacht vor dem Ex-Tag hielt (REGEL Teil C.3). Geprüft werden Ex-Tage bis
  zum jüngsten Tagespunkt des Stores (`mfVerlauf`) bzw. bis zum nächsten Ausführungstag.
- **Zweite Quelle:** `E:/Markt-Dashboard-Archiv/alpaca-massnahmen/<SYM>.json` und `alpaca-massnahmen-nachtrag-*/<SYM>.json`,
  Sätze `_art: 'cash_dividends'` mit `rate > 0`.
- **Zahl:** Fälle in der Quelle, davon gebucht; Betrag je Fall gebucht gegen `Stück × rate` in %; Buchungen ohne Satz in der
  Quelle.
- **Schwelle:** **null** ungebuchte Fälle, **null** Buchungen ohne Satz, Betrag je Fall **≤ 1 %** daneben. Begründung: der
  Lader bucht aus Yahoo-Ereignissen (split-bereinigt), die Quelle ist Alpaca — Rundungen bleiben weit unter 1 %, ein
  vergessener Split nicht.
- **Nicht prüfbar:** keine Maßnahmen-Datei für einen gehaltenen Wert.
- **Bei Verfehlen:** Befund an den PM, vor der nächsten Umschichtung beheben. Kein Halt.

## P5 Reihenenden / Splits

- **Gemessen:** für jeden gehaltenen Wert in der Haltezeit (a) jeder Split (`forward_splits`, `reverse_splits`,
  `unit_splits`) ist in `mfBuch.massnahmen` (Art `split`) gebucht; (b) jede andere Maßnahme, die die Reihe beendet oder den
  Bestand ändert (`cash_mergers`, `stock_mergers`, `stock_and_cash_mergers`, `name_changes`, `spin_offs`,
  `worthless_removals`, `redemptions`, `stock_dividends`, `rights_distributions`), hat eine Buchung (`reihenende`-Trade oder
  Maßnahme); (c) endet die Tagesreihe im Archiv mindestens 5 Handelstage vor dem jüngsten Archivtag, ist die Position
  ausgebucht.
- **Zweite Quelle:** `alpaca-massnahmen*/<SYM>.json`, `archiv1d/bars_1d_<SYM>.json`, Handelstage aus `alpaca1m/SPY`.
- **Schwelle:** **null** ungebuchte Fälle. Begründung: ein einziger ungebuchter Split erzeugt einen Scheinverlust in voller
  Höhe (Nr. 81); hier gibt es keine Streuung, nur richtig oder falsch.
- **Bei Verfehlen:** U-Regel sofort.

## P6 Platzbelegung (Regel K)

- **Gemessen:** nach der Umschichtung (Ende des Ausführungstags) je Position Wert zum Ausführungskurs gegen den Platzwert
  (Depotwert vor der Umschichtung zu Ausführungskursen / Zielzahl); leere Plätze = Zielzahl − Zahl der Positionen.
  Zielzahl aus `mfBuch.korbVerlauf` des Tages, sonst aus der Neuberechnung P1.
- **Schwelle:** **null** Positionen unter 5 % des Platzwerts; höchstens **1** leerer Platz. Begründung: Regel K (Nr. 85/87)
  schließt Kleinstbestände durch Bau aus — einer ist ein Fehler der Umsetzung; ein leerer Platz kann entstehen, wenn K1 den
  letzten Kauf mangels Bargeld verweigert, zwei oder mehr heißen, dass Kurse fehlten — das hatte die Messung nicht.
- **Bei Verfehlen:** Befund an den PM. Kein Halt.

## P7 Marktstand

- **Gemessen:** (a) jeder Tagespunkt in `mfVerlauf` seit der Umschichtung trägt `buchT` und `spyT`, und `buchT = spyT`
  (Buch und Maßstab aus derselben Ladung, Nr. 91/93); (b) **Abweichung des Anfangsstands:** der SPY-Wert des ersten
  Tagespunkts ab der Umschichtung (an ihm setzt die Marktlinie an, `massstab.js` Z. 209–224) gegen die SPY-Eröffnung des
  Ausführungstags aus `alpaca1m/SPY` (dort kauft der Maßstab nach REGEL §1.6), in Pp.
- **Schwelle:** (a) **null** Punkte mit `buchT ≠ spyT`; (b) **≤ 0,05 Pp**. Begründung: (a) ist eine Invariante seit Nr. 93;
  (b) 0,05 Pp ist ein Drittel der bekannten Anfangsabweichung von 0,14 Pp (Nr. 81) und weit unter jeder Rundung der Anzeige.
- **Nicht prüfbar:** Punkte ohne `buchT`/`spyT` (vor Nr. 93 geschrieben); keine SPY-Minute ab 09:30.
- **Bei Verfehlen:** Befund an den PM. Kein Halt.

## Zeitpunkt

- **Gemessen:** (a) Ausführungstag = erster Handelstag, an dem die Umschichtung fällig ist: der 63. Handelstag nach dem
  vorigen Ausführungstag (so zählen `faelligkeit` und der Rückblick); (b) jede Order des Tages zwischen **09:35** und
  **16:00** New York (`HANDEL_AB`; Nachfassen nach Nr. 94 nur am selben Tag bis 16:00).
- **Schwelle:** Verspätung **0** Handelstage; **null** Orders außerhalb des Fensters. Begründung: ein verspäteter Tag
  verschiebt Stichtag und Haltezeit gegen die Messung; die Messung kennt nur die Eröffnung.
- **Nicht prüfbar:** (a) bei der ersten Umschichtung (kein voriger Ausführungstag).
- **Bei Verfehlen:** Befund. Zweimal hintereinander → U-Regel (strenger als der Vorschlag, der den Zeitpunkt nicht nennt).

## U-Regel (Umsetzung) — wann „Halt"

**Halt** heißt: keine neuen Käufe, kein weiteres echtes Geld, bis der Fehler behoben und die Umschichtung nachgerechnet ist.
Ausgelöst durch:
1. **P5 verfehlt** (ein ungebuchter Fall) — sofort.
2. **P1 oder P2** in **zwei Umschichtungen hintereinander** verfehlt (auch gemischt: P1 in der einen, P2 in der nächsten).
3. **Hochrechnung P2 + P3 > 1 Pp p. a.** — sofort.
4. **Zeitpunkt** in zwei Umschichtungen hintereinander verfehlt.

`nicht prüfbar` löst keinen Halt aus, zählt aber nie als bestanden; zweimal hintereinander nicht prüfbar in P1, P2 oder P5
ist ein Befund an den PM (die Prüfung wäre sonst eine, die niemand ansieht).

Die Grenzen für **echtes Geld** (V1–V3 des Vorschlags: Rückschlag, Rückstand gegen den S&P 500) gehören nicht hierher. Sie
werden Wilhelm **vor jedem echten Betrag gesondert** vorgelegt.

## Probelauf

Erster Lauf nach dem Siegel gegen den heutigen Store: Kauf vom 25.08.2026, ausgeführt vor Nr. 93 (Rangfolge und Kurse des
laufenden Tages, keine `buchT`/`spyT`). Abweichungen dort sind **erwartbar** und werden nur berichtet, nicht repariert.
