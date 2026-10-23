# Die Form eines Kandidaten (Prüfstraße, Auftrag Nr. 110, 11.10.2026)

Eine Handelsidee ist für die Prüfstraße **ein Ordner** `pruefstrasse/warteschlange/<kennung>/` mit genau vier Dateien.
Der Läufer (`node pruefstrasse/laeufer.js`) macht daraus Siegel, Machbarkeitstor, Entdeckung, Gegenproben, Placebo, Kandidatenliste,
Vorwärtsbestätigung, Urteil und Belegstand-Eintrag — ohne weiteren Auftrag (Stand Nr. 121-2a, 23.10.2026). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Die vier Dateien

| Datei | Inhalt |
|---|---|
| `kandidat.json` | Steckbrief und die **vollständige** Liste der Konfigurationen (siehe 2.) |
| `REGEL.md` | Prosa der Regel; **jeder Parameter mit Fundstelle** (Literatur, Praxis); nichts „optimiert" |
| `regel.js` | die Regel in genau **einer** der drei Schnittstellen (siehe 3.) |
| `test.js` | Kunstdaten je Regelzeile, Randfälle, und die Gegenprobe „kein Blick nach vorn" (siehe 4.) |

Gültig ist ein Kandidat erst, wenn `node pruefstrasse/laeufer.js --pruefen <kennung>` grün ist (Form, Pflichtfelder,
Schnittstelle, `test.js` grün, Siegel 1 möglich). Ein ungültiger Kandidat wird vom Läufer übersprungen, nicht gemessen.

## 2. `kandidat.json`

```json
{
  "kennung": "donchian20-ausbruch-long",
  "form": "tag",
  "titel": "Donchian-20-Ausbruch, long, bestätigt",
  "quelle": "Donchian (1960) über Turtle-Regeln; App-Parameter confirmBps 15 (quant.js)",
  "erwartung": { "groesse": "0,1 bis 0,3 Pp je Trade brutto", "richtung": "positiv", "nettoPp": 0.12, "bruttoPp": 0.2, "fensterWieQuelle": true },
  "konfigurationen": [ { "key": "H5", "richtung": "long", "haltedauer": 5 }, { "key": "H10", "richtung": "long", "haltedauer": 10 } ],
  "params": { "N": 20, "confirmBps": 15 },
  "autor": "…", "datum": "2026-10-11"
}
```

Pflichtfelder: `kennung` (= Ordnername, `[a-z0-9-]+`), `form` (`tag` | `korb` | `minute`), `titel`, `quelle`, `erwartung`
(`groesse` und `richtung` **vorab**; Form tag seit Nr. 121-2a zusätzlich **`nettoPp`** = behauptete Kante je Trade **nach Kosten** in Pp, Zahl oder
`{ "<key>": Zahl }` je Konfiguration — sie trägt das Machbarkeitstor; optional `bruttoPp` (fehlt es, gilt netto + Kassa-Hürde der Klasse 1 = 0,0854 Pp
als brutto; trägt die Größenaussage) und `fensterWieQuelle` (`true` nur, wenn die Quelle **dasselbe** Fenster misst — sonst steht jede Größenaussage
„im gemessenen Fenster"). Die sieben vor dem 23.10.2026 gemessenen Kandidaten tragen das Feld nicht; der Läufer liest ihre Zahl aus
`pruefstrasse/erwartungen-alt.json` (Quelle je Zeile), ihre Ordner bleiben unverändert), `konfigurationen` (nicht leer; **die Zahl steht fest, bevor gemessen wird** — der Läufer
misst genau diese Liste und trägt ihre Länge ins Register ein), `autor`, `datum`. `params` ist frei und wird der Regel durchgereicht.

Konfiguration je Form:
- **tag:** `key`, `richtung` (`long` | `short`), `haltedauer` (Handelstage, 1–60; Ausstieg zur Eröffnung des ersten Handelstags
  ≥ Einstiegstag + Haltedauer, wie Trendkanal §5). Optional `klassen` (Umsatzklassen 0–3, Vorgabe alle). Auf Kandidatenebene optional
  `bewertung` (`topf` | `zeit`, Vorgabe `topf`; jeder andere Wert macht den Kandidaten ungültig — Absatz „Bewertung" in §3) und optional
  `versatzTage` (ganze Zahl 5–60, Vorgabe 20: Handelstage der Verschiebungs-Gegenprobe; gesetzt nur mit Begründung in `REGEL.md` unter einer
  Überschrift „Versatz", sonst ungültig — §5 Gegenproben) und, nur mit `bewertung` `zeit`, optional `topfRadius` (ganze Zahl in Handelstagen,
  für jede Konfiguration 2 H … 12 H, Vorgabe 4 H: Radius des lokalen Topfs, §3; gesetzt nur mit Begründung unter einer Überschrift
  „Topfradius", sonst ungültig).
- **korb:** **genau eine** Konfiguration (der Adapter misst `konfigurationen[0]`; `--pruefen` lehnt jede andere Zahl ab, Nr. 121-1):
  `key`, optional `anzahl` (Zielzahl; sonst entscheidet die Zielfunktion), `korb` (Zahl der umsatzstärksten Werte als
  Universum, Vorgabe: alle zulässigen). Fenster, Takt (63 Starttage), Kosten (20 Bp je Seite) und Regel K setzt der Adapter.
- **minute:** `key`, optional `params` (eine Parametervariante der Messmaschine). Zeitrahmen, Haltedauer, Richtung, Universum
  stehen im Modul (`regel.js`), wie `strategien/rsi2seit.js`.

## 3. `regel.js` — die drei Schnittstellen

**tag** — `signal(sicht, i, params) → { dir: 1 } | { dir: -1 } | null`, optional `bestaetigt(sicht, i1, params, signal) → bool`.
Die Regel sieht eine Reihe (Tageskerzen einer Aktie) durch `sicht`; **lesbar sind nur Zeilen ≤ i**, jeder Zugriff auf j > i zählt
als Verstoß, liefert NaN und macht das Urteil zu „Messgerät-Fehler" — der Adapter kapselt das, die Regel kann es nicht umgehen.
`sicht.n`, `sicht.tag(j)` (Kalenderindex), `sicht.o(j)`, `sicht.h(j)`, `sicht.l(j)`, `sicht.c(j)`, `sicht.v(j)` (Stück),
`sicht.klasse(j)` (Umsatzklasse 0–3, −1 ohne), `sicht.zulaessig(j)` (Klasse da, kein Maßnahmenfenster), `sicht.lebend`
(Reihe lebt am Archivende), `sicht.quelle` (`panel` | `trendkanal-tage`), `sicht.roh(j)` (roher Schluss, unbereinigt; nur Quelle
`panel`, sonst NaN), `sicht.markt(j)` (bereinigter SPY-Schluss am Kalendertag von Zeile j; NaN, wenn SPY dort fehlt), `sicht.hatRoh`,
`sicht.hatMarkt`. `o/h/l/c` sind **bereinigt**: Preisfilter der Literatur (Mindestkurs) gehören auf den **rohen** Kurs `roh` (Fehlerform
„Bereinigte Kurse messen den Cent-Boden falsch"), Marktmodelle (marktbereinigte Rendite) auf `markt`. Auf der Panel-Quelle sind Hoch und
Tief **nicht** vorhanden (NaN) — eine Regel, die sie braucht, meldet das und läuft nur auf `trendkanal-tage`. Bedarf meldet die Regel mit
den Flags `brauchtHochTief`, `brauchtRoh`, `brauchtMarkt`, `brauchtDatum` (Boolean auf `module.exports`); fehlt die Spalte der Quelle, bricht
der Lauf mit `MESSGERAET:` ab, statt mit NaN zu rechnen.
Kalender (Nr. 117): `sicht.datum(j)` ist das Kalenderdatum der Zeile j als `JJJJ-MM-TT`, hinter derselben Schranke wie `c(j)`; dazu
`sicht.istLetzterHandelstagImMonat(j)` und `sicht.istErsterHandelstagImMonat(j)` (`true | false | null`), berechnet aus dem Kalender der
Tafel **nur bis zur Schranke**, und `sicht.hatDatum`. **Blick-nach-vorn-Regel:** „letzter Handelstag im Monat" darf erst entschieden werden,
wenn der nächste Kalendertag der Tafel bekannt ist, also für j < i; für j = i liefert die Funktion `null` (unbekannt). „Erster Handelstag im
Monat" braucht nur den Vortag und ist für jedes j ≤ i entschieden (am Kalenderanfang `null`). Einen Kalender nach vorn (`sicht.tage`) gibt es
nicht; Terminlisten, die in der Wirklichkeit vorab feststehen (FOMC-Sitzungen), gehören als `params` in `kandidat.json` und werden gegen
`datum(j)` verglichen — die Regel darf aus dem Datum rechnen (Wochentag), aber keinen Handelstag der Tafel hinter i lesen.
Einstieg: Eröffnung des Tages nach dem Signal (ohne `bestaetigt`) bzw. zwei Tage danach (mit `bestaetigt`, das am Folgetag mit
Sicht bis dorthin gefragt wird — die Form des „bestätigten Ausbruchs" der Trendkanal-Studie). Cooldown 5 Handelstage je Richtung, vor dem
Klassenfilter der Konfiguration wie in der Referenz (`trendkanal-tage/messen.js`: Cooldown je Linie/Richtung, kein Klassenfilter); das Protokoll
zählt die Signale, die ein nicht gebuchtes Signal (Klasse ohne Konfiguration) sperrte (`cooldownDurchOhneKlasse`).
**Bewertung `topf` | `zeit`** (`kandidat.json` `bewertung`, Nr. 118). **`topf`** (Vorgabe): Überschuss gegen den **Topf derselben Zelle**
(Einstiegstag, Dauer, Klasse, lebend), Kassa-Hürde je Umsatzklasse, Standardfehler Hansen-Hodrick über die Tagesreihe (Lag = Haltedauer),
Tor 1 — **seit Nr. 121-2a (23.10.2026) kein Kriterium mehr**, nur nachrichtlich zum Vergleich mit Messungen davor (Entdeckung ≥ 4 × projizierte
Bestätigungs-„MDE" = 4 × 2 × se_E × √(TE/TB), TB = ½ TE, also netto ≥ 11,31 × se; an seine Stelle tritt das Machbarkeitstor **vor** dem Lauf, §5), **Tor 2 (delta80 unter der Hürde):
für die Form tag nicht gebaut — Entscheid Stufe 2** — wie die Trendkanal-Studie
(`studien/vorregistrierung-2026-09-08-trendkanal-tage/`); Placebo = anderer Wert gleicher Klasse am selben Tag. **`zeit`:** für Regeln, die an
einem Tag **alle oder fast alle** Reihen treffen (Kalender- und Terminregeln: Monatswende, Vor-FOMC, Vorfeiertag) — dort **ist** die Signalmenge
der Topf der Zelle, der Überschuss ist per Bau null und ein „nein" sagt nichts (Fehlerform „Tagestopf löscht marktweite Effekte"). Im Modus
`zeit` ist der Topf eines Trades seit Nr. 121-1 der **lokale Topf seines Signals** (`adapter/tag.js` `lokalerTopf`). Alle Indizes sind
Tafelindizes (Handelstage der Tafel, nicht Zeilen der Reihe); `H` ist die Haltedauer der **Konfiguration**; Topf-Fenster rechnen wie der Trade
(Eröffnung → Eröffnung, Ausstieg am ersten Handelstag ≥ Start + H). (1) Zulässige Topf-Starttage einer Reihe: **Klasse vorhanden (≥ 0), aber
nicht die Klasse der Konfiguration** (Nachbesserung 5, 23.10.2026: ganz ohne Klassenfilter kamen illiquide Fenster ohne Klasse — Umsatz unter 5 Mio $ oder
Anlaufzeit — in den Topf und verzerrten ihn, Eichung Dichte 1/10: Nullpunkt −0,582 statt −0,166 Pp; Nachbesserung 4, 23.10.2026; A6 „klassengleich" aus Nr. 121-1 zurückgenommen — die Klasse am Topf-Start hängt am Umsatz der 20 Vortage bis zum Topf-Start,
also an Information **nach** dem Signal; bei einem einzigen Kandidatenfenster je Signal wurde der Topf damit **auf Zukunft ausgewählt** — gewertet wurde genau
dann, wenn das Folgefenster nach einer umsatzstarken Phase begann; Fehlerform „Auswahl auf Zukunft"; die Klasse des **Trades** entscheidet die Hürde, nicht
den Topf), kein Maßnahmentag (ausgeschlossen, aber gezählt: `topfMassnahme`), **kein** Fenster, das sich mit irgendeinem Signalfenster der Reihe überschneidet (Starttag näher als H an
einem Einstiegstag), nicht rechtszensiert, nicht kurslos; Abgänge zählen mit ihrem letzten Schluss wie im Tagestopf. (2) **Jeder Topf-Starttag
gehört genau einem Signal**: dem nächstgelegenen Einstiegstag derselben Reihe (Gleichstand → der frühere), und nur bis zum Abstand
`R` = `topfRadius` (`kandidat.json`, Handelstage, für jede Konfiguration 2 H … 12 H, **Vorgabe 4 H**; gesetzt nur mit Begründung in `REGEL.md`
unter einer Überschrift „Topfradius", `--pruefen` prüft Bereich und Abschnitt) — die Töpfe benachbarter Signale sind disjunkt. (3) Topf = Mittel
der zugeordneten Fenster, **mindestens 1** (`konfig.js` `TOPF_N_MIN`; Entscheid PM 21.10.2026), sonst entfällt der Trade und wird als `topfFehlt`
gezählt. Ein einzelnes Vergleichsfenster ist ein **gepaarter Vergleich** (Signalwoche gegen die folgende ungerade Woche — genau der Vergleich der
Quelle); seine Streuung steht über den Überschuss je Trade in der Tagesreihe, also im se. Die frühere Schwelle 2 wählte dagegen eine verzerrte
Teilmenge (Zyklusenden, Lücken — die Gewichtung, die der lokale Topf beseitigen soll; fomc-gerade: 79 % der Trades fielen weg). Das Protokoll
weist die Verteilung von Topf-n aus (Median, Min, Anteil n = 1), damit ein Leser sieht, wie dünn der Topf ist.
(4) Zuordnung je Zeitraum (Entdeckung bzw. Prüfung — ein Entdeckungs-Topf enthält keinen Prüfzeit-Start); Fenster dürfen über das Zeitraumende
hinauslaufen wie der Trade selbst. **Warum lokal:** der lokale Topf vergleicht das Signalfenster mit **seiner eigenen Periode** — gerade gegen
ungerade FOMC-Wochen, Monatswende gegen Monatsmitte —, wie die Quellen selbst messen; ein Regime (2020) trifft Signal und Topf gleich; eine
Terminlücke verschiebt nichts mehr. Der frühere Topf „über alle zulässigen Starttage desselben Zeitraums" (Nr. 118) war bei unregelmäßigem
Signalplan zeitlich verzerrt (Audit Nr. 120: fomc Topf +0,90 Pp je 5 Tage gegen +0,30 aller Fenster, 2020 trägt 0,55) und seine Streuung fehlte
im se; er bleibt als `zeitTopfGlobal` nur nachrichtlich („Überschuss gegen den globalen Topf ohne Ausschluss") und für den Rot-vor-Grün-Test.
**Standardfehler:** die Streuung des lokalen Topfs steckt im Überschuss jedes Trades und damit in der Tagesreihe; weil die Töpfe disjunkt sind,
bleibt der Hansen-Hodrick-Lag = H wie im Modus `topf` (Beweis: Kunsttest D-i in `test.js`, 300 Seeds unter der Null mit unregelmäßigem Plan
und Regime-Block). Nachrichtlich im Protokoll: Topf-n je Trade (Median, Min, Anteil n = 1), Histogramm der Topf-Starttage relativ zum Signal, Topf-Mittel,
Überschuss gegen den globalen Topf, Sensitivität für R = 2 H und 8 H (kein Urteil). **Randregel (Nachbesserung QS 23.10.):** ein Signal zählt nur, wenn
seine Reihe beidseitig mindestens R Tafeltage um den Einstieg hat (Anfang/Ende der Reihe in der Tafel, nicht des Zeitraums); sonst `randFehlt` (Zähler im
Protokoll), der Trade entfällt mit allen Gegenproben — am Rand läge der lokale Topf nur auf einer Seite, und Anfang/Ende von Reihen tragen systematisch andere
Renditen (Eichung Dichte 1/10: Nullpunkt −0,137 ± 0,051, randlose gegen randbehaftete Reihen gepaart +0,215, t 3,2). Kassa-Hürde, Tagesreihe (Mittel
je Einstiegstag), Hansen-Hodrick und MDE80 = 2,8016 × se bleiben (Tor 1 nur nachrichtlich); bei einer marktweiten Regel ist jeder Signaltag **ein** Cluster,
die Auflösung hängt an der Zahl der Ereignisfenster (Monatswende ≈ 84 in 2016–2022), nicht an der Zahl der Trades — das Protokoll nennt
Signaltage, Trades und Trades je Signaltag und sagt das in einem Satz. **Nicht gewählt:** Überschuss gegen null (reiner Fensterertrag, wie
Lucca & Moench ihn ausweisen) — er rechnete die unbedingte Drift der Reihe der Regel zu; der rohe Fensterertrag steht als `roh` im Protokoll
daneben. **Wann welcher:** die Regel wählt **Aktien** (Querschnittsregel) → `topf`; die Regel wählt den **Tag** → `zeit`. Kennzahl in beiden
Modi: der **Anteil der zulässigen Reihen mit Signal am Signaltag** (`signalAnteil`, Mittel über die Signaltage der Entdeckung). Grenzfall:
Anteil > 50 % im Modus `topf` → der Läufer schreibt eine Warnung ins Protokoll („Bewertung zeit erwägen"); Anteil ≤ 50 % im Modus `zeit` →
Warnung („gehört in die Bewertung topf"). `ergebnis.json` trägt `bewertung` und `bewertungDetail` (die Rechenvorschrift in einem Satz);
Register (`register.json`) und Belegstand-Zeile nennen den Modus. Sperrklinke: der Modus `topf` liefert bitgleiche Zahlen (Kalibrierung §6
des Tests; Kunst-Eichung in `test.js`).

**korb** — `zielfunktion(roh, opts)` und `placeboZiel(roh, opts)` **genau in der Form von `momentumZiel`** (`mfhandel.js`) bzw.
der blind gesiegelten `studien/kandidaten-blind-2026-10/sektor-momentum/ziel.js`: `roh = { KUERZEL: [[zeitMs, schlussBereinigt,
umsatzStueck], …] }`, `opts.nowMs` = Stichtag; Rückgabe `{ ziel, rangfolge, korb, zuWenig, uebersprungen, verworfen }`. Zeilen nach
`nowMs` dürfen nicht gelesen werden (der Adapter prüft es am Kunstfall). `placeboZiel` zieht dieselbe Zahl Werte zufällig und
deterministisch (`opts.placeboWort`) aus denselben zulässigen — das sind die 200 Zufallsbücher (Nr. 100).
Bewertung: Rückblick gegen SPY (Gesamtertrag beide Seiten, 20 Bp je Seite, Regel K 5 %, Hauptregel der Reihenenden), 63 Starttage,
Median der 63 Abstände p. a., Rang gegen 200 Zufallsbücher — der Rechner von Nr. 78/85/96 (`kleinst.js` → `korb.js` → `mfhandel.js`).

**minute** — ein Modul in der Form von `studien/messmaschine/strategien/rsi2seit.js`: `key`, `grund` (≥ 20 Zeichen), `zeitrahmen`,
`haltedauerKerzen`, `richtung`, `universum`, `kosten`, `params`, `leseFensterKerzen`, `signal(bars, i, params) → { dir } | null`.
Bewertung: Messmaschine (`messmaschine.js`, Kontrolle A7, Tagesclusterung, Placebo, Bonferroni), Kassa-Hürde je Klasse.

## 4. `test.js`

Läuft mit `node pruefstrasse/warteschlange/<kennung>/test.js`, Rückgabewert 0 = grün. Pflicht: (a) Kunstdaten, in denen die Regel
**feuert** (ein Test, der nie ein Signal sieht, prüft nichts — „Nullbefund vom toten Werkzeug"), (b) Randfälle (zu kurze Reihe,
fehlende Werte), (c) die Gegenprobe „kein Blick nach vorn": Zeilen nach i verändern → Signal unverändert (tag/minute) bzw.
Zeilen nach `nowMs` verändern → Ziel unverändert (korb). Für `tag`-Kandidaten liefert `pruefstrasse/adapter/tag.js` dafür
`kunstSicht(spalten, i)` (Spalten `roh`, `markt`, `datum` optional; ohne `datum` ein Werktagskalender ab 2020-01-02, `kunstKalender(n)`).

## 5. Zeiträume, Siegel, Urteile (gilt für alle Formen)

- **Zeiträume (Nr. 121-2a).** Die Prüfzeit 2023–2026 gilt als gelesen (PM-Annahme aus Wilhelms Satz „Zeitraum ab 2023 gilt als verbraucht"):
  **Entdeckung bis zum letzten Panel-Tag** (`konfig.json` `entdeckungBis` = `"panelende"`; Panel v2.3 endet am 15.09.2026), Bestätigung **nur vorwärts**
  (unten). Die frühere Lesesperre bleibt als **Eichfenster** 2016-01-04 … 2022-12-30 (`konfig.json` `eichung`) — die Grenze der Kalibrierung, der
  Kunsttests und der Eichung; ohne Siegel und ohne `bisPanelende` öffnet die Tafel nur das Eichfenster. Zwei Konstanten, zwei Namen (`EICHUNG`,
  `ENTDECKUNG_BIS`). Korb und Minute behalten Entdeckung/Prüfung wie bisher (Eichfenster bzw. `minute.sperreAb`); **Korb: Vorwärts noch nicht gebaut.**
- **Machbarkeitstor (vor dem Lauf, Form tag, Audit B V1).** Trockenzählung **ohne Renditen** (`adapter/tag.js` `zaehle`: Signaltage n_T, Trades,
  Trades je Signaltag d, Anteil der Reihen mit Signal, H) → geschätzter Standardfehler se_g(H, n_T, d, Modus) aus `pruefstrasse/streuung.json`
  (einmal gefittet aus **versiegelten** Messungen: 13 Konfigurationen der Prüfstraße + 39 der Trendkanal-Studie mit Teilzeiträumen; Modell
  se = a_H · n_T^−0,5 · d^δ, Fit und Residuen in `streuung-fit.js`/`streuung.json`; nie aus dem Kandidaten selbst). Bedingung je Konfiguration:
  **(t_krit + 0,8416) · 1,4 · se_g ≤ nettoPp** und mindestens 30 Signaltage (`STREUUNG_FAKTOR` 1,4 = P90 des Faktors se_ist / se_g über die 179 Stützstellen,
  1,41; die Tabelle ist nicht konservativ — leave-one-rule-out-Median der 13 Konfigurationen 1,14, 8 von 13 unterschätzt, QS 23.10.), t_krit = Kandidatenschwelle unten mit df = n_T/H − 1 und m = Register +
  alle Konfigurationen des Kandidaten. Sonst **„nicht messbar mit diesen Daten"**: kein Entdeckungslauf für diese Konfiguration (keine messbar → kein
  Lauf, kein Siegel 2), Protokoll mit „bräuchte n Signaltage (≈ Jahre)", Register-Eintrag mit Urteil `nicht messbar` und Gewicht 0 (**zählt nicht** als Test).
- **Siegel 1:** der Kandidatenordner liegt in mindestens einem Commit und hat nichts Ungesichertes. **Siegel 2:** der Läufer
  committet `erledigt/<kennung>/KANDIDATEN.json`.
- **Kandidat** (je Konfiguration, Entdeckung, Nr. 121-2a): netto > 0 **und** einseitiges p_E ≤ min(P(T_df ≥ 3), 0,05 / m) in der t-Verteilung mit
  df = n_eff − 1 (n_eff = Signaltage / H) — gleichbedeutend mit t ≥ t_krit = max(3, t_(1−0,05/m; df)); m = Summe der Register-Gewichte vor dem Lauf
  (ohne die eigene Kennung) + Zahl der gemessenen Konfigurationen (+ `REGISTER_M_EXTERN`, Vorgabe 0); dazu ≥ 30 Signaltage und kein Placebo-Verstoß
  (|Placebo| > 2 se **und** > ¼ Hürde; im Modus `zeit` gegenstandslos, dort wirkt dieselbe Regel auf das verschobene Signal). Beispiele: df 9 / m 14 →
  t ≥ 3,46 (Korrektur greift), df 53 / m 14 → t ≥ 3; nachrichtlich mit den ~3.400 Tests der Signalstudie 2026-08 (m_gesamt) df 9 → t ≥ 7,7. Das Protokoll
  nennt df, m, beide p-Schwellen und die wirksame t-Schwelle. **MDE80 = 2,8016 × se** ist die Auflösung, kein Kriterium.
- **Größenaussage (Audit B V2):** liegt die obere 95-%-Grenze brutto der Entdeckung unter `bruttoPp`, steht in Urteil, Protokoll, Belegstand-Absatz und
  Register „Literaturgröße ausgeschlossen" — mit dem Zusatz **„(im gemessenen Fenster)"**, wenn die Quelle ein anderes Fenster misst
  (`fensterWieQuelle` nicht `true`; Umkehr, Vor-FOMC, Großanstieg).
- **Vorwärtsbestätigung (ein vorregistrierter Blick, Form tag).** Ein Kandidat erhält Status `vorgemerkt` (`register.json` je Konfiguration: `status`,
  `siegel2Datum`, `stichtag`, `nBedarf`, `nStand`). **Stichtag** = erster Handelstag des Panel-Kalenders **nach** dem Commit-Tag (Committer-Zeit nach UTC) von `KANDIDATEN.json` — nie die Systemuhr; ohne lesbare Commit-Zeit bricht der Lauf ab;
  **nBedarf** = Signaltage, bei denen MDE80_vorwärts = (t_(0,95; df) + 0,8416) · se(n) ≤ nettoPp (mindestens 30), se(n) = **gemessene** se der Entdeckung
  × √(n_E / n) (nicht die Tabelle), mit geschätztem Datum im Protokoll. Die Richtung für `belegt-Vorschlag` kommt aus der versiegelten Kandidatenliste
  (`KANDIDATEN.json`, Siegel 2), nie aus einer Neurechnung mit Daten vor dem Stichtag.
  `laeufer.js --vorwaerts` (nachtlauftauglich, idempotent — schreibt `erledigt/<k>/vorwaerts.json`, `VORWAERTS.md`, Register nur bei geändertem Inhalt und
  committet nur dann) zählt je vorgemerkter Konfiguration die Signaltage ab dem Stichtag **ohne Renditen** (nur Einstiege, deren Fenster ganz in der Tafel
  liegt); erst bei nStand ≥ nBedarf misst er **einmal** (Topf nur aus Vorwärtsdaten: Tageszelle bzw. lokaler Topf ab dem Stichtag; `topfFehlt`
  verringert die gemessenen Signaltage), Holm **p-basiert** über alle an diesem Tag fälligen Konfigurationen (einseitig 5 %, t-Verteilung). Urteil
  `belegt-Vorschlag` (netto > 0, Holm bestanden, gleiche Richtung) | `nein` (obere Grenze netto < 0) | `nicht entscheidbar`; **unter 30 Signaltagen kein
  Bestätigungsurteil** (Audit B V9). Status → `bestaetigt | abgelehnt | offen`, Belegstand-Absatz nur bei diesem Wechsel. Danach **kein zweiter Blick**.
  Rückweg wie bei der Nachmessung: Marke `pruefstrasse/VORWAERTS-LAEUFT.json`, bei Abbruch alles auf den Stand davor, Index nur für die eigenen Pfade,
  Marke mit `fehler` bleibt, der nächste Lauf lehnt ab. Bis zur Panel-Fortschreibung (Auftrag Nr. 123) ist die Vorwärtsmessung leer — das Protokoll sagt es.
- **Kalender-Hausregel (CLAUDE.md):** Konfigurationen mit Bewertung `zeit` und nBedarf oder Bestätigungs-Signaltagen unter 1.000 tragen in Register
  und Protokoll die Marke `nicht muehlenfaehig (Hausregel CLAUDE.md)`; sie können `belegt-Vorschlag` werden, gehen aber nicht in die Mühle.
- **Wiedervorlage (Audit B V4):** jede nicht entscheidbare, nicht vorgemerkte Konfiguration erhält im Protokoll (und Register `wiedervorlage`) das Datum,
  an dem die Nachmessung das eigene Tor bestünde: (t_krit + 0,8416) · se(n) ≤ nettoPp mit derselben Schwelle wie das Machbarkeitstor (nicht MDE80 = 2,80 · se)
  und se(n) aus der gemessenen se der Entdeckung (Datenzuwachs = Signaltage der Entdeckung je 252 Handelstage). Einziger Weg dorthin:
  `laeufer.js --nachmessen <kennung> --grund-daten "<Text>"` (Kandidatenordner unverändert, kein Messgerät-Fehler nötig); die Kennung zählt danach im
  Register **doppelt** (Gewicht alte Zahl + 1, bewusst konservativ).
- **Eichung (Nr. 121-2a D, nur PM, vor jeder Freigabe):** `laeufer.js --eichung` — Zufallsregel in zwei Dichten auf dem Panel im Eichfenster, H = 5:
  marktweit (ein Signaltag je ~10 Handelstage für alle Reihen, Modus zeit; Entscheid PM 23.10.) und Querschnitt (~1 % der Reihen je Tag, Modus topf); Einsaat
  +0,30 Pp brutto **nur** auf die Signalfenster (nicht Placebo-, Verschiebungs-, Topf-Fenster), 30 Seeds Einsaat + 30 Seeds Zufall je Dichte. Kriterien:
  Beide Dichten (Nachbesserung QS 23.10.): **Nullpool** = 100 Zufall-Seeds + die 30 Einsaat-Seeds minus 0,30 (die Einsaat ist exakt additiv) — |Mittel| ≤
  2 · se_Mittel und Anteil |t| > 2 ≤ 15 %; **Einsaat** — Mittel innerhalb ± 2 · se_Mittel um 0,30 und zwischen 0,20 und 0,40. Auf dem festen Marktpfad sind die
  Zufallspläne unabhängige Ziehungen; für ein fehlerfreies Gerät ist der Erwartungswert über Pläne null, se_Mittel ist der Maßstab für einen Geräteversatz.
  `--eichung-bewerten` bewertet die gespeicherten Läufe von `eichung.json` neu, ohne neuen Lauf. Schreibt
  ausschließlich `EICHUNG.md` und `eichung.json` (der Code prüft es); `test.js` prüft Form und Alter (> 60 Tage: Warnung).
- **Urteile:** `nicht messbar` (Machbarkeitstor, oben) · `belegt-Vorschlag` (Form tag: Vorwärtsmessung, oben; korb/minute: Prüfung: Holm über alle Konfigurationen des Kandidaten, einseitig 5 %, gleiche Richtung wie in
  der Entdeckung, netto > 0; p einseitig aus der t-Verteilung mit df = n_eff − 1, n_eff = Signaltage / H, Nr. 121-1; nachrichtlich, ob der
  Treffer Holm über **alle** Konfigurationen des Registers überstünde) ·
  `nicht entscheidbar` (nichts belegt, aber auch nicht ausgeschlossen; MDE80 steht daneben) · `nein` (jede Konfiguration in der
  behaupteten Richtung ausgeschlossen: obere 95-%-Grenze netto < 0 in der Entdeckung (≥ 30 Signaltage) **oder** in der Prüfung — ein
  Maßstab je Konfiguration und gesamt; „netto ≤ 0" allein ist **nicht** „nein", Nr. 121-1) · `Messgerät-Fehler` (Verstoß gegen „kein
  Blick nach vorn", oder eine Gegenprobe fällt gegen die Regel: das verschobene Signal zeigt einen Ausschlag, zweiseitig — siehe Gegenproben).
- **Gegenproben (Pflicht, tag):** Einstieg einen Tag später **und** Ausstieg einen Tag später (gleiche Haltedauer; Nr. 121-1 — bis dahin
  „bei festem Ausstieg", bei H1 leer); Signal um 20 Handelstage verschoben; Placebo mit
  zufälligen Signalen gleicher Tagesverteilung (anderer Wert, gleicher Tag, gleiche Klasse, gleiche Richtung); „alle gegen lebend";
  Abgänge (Übernahme, Insolvenz, sonstige) getrennt gezählt, dazu **„zensiert"**: eine Reihe der gesperrten Tafel, deren letzte Zeile der
  letzte Tag vor der Sperre ist, ist nicht abgegangen, nur die Sperre schneidet sie ab (Nr. 121-1; nur Zählung und Spalte — Ertrag, `lebend`
  und Zelle bleiben). **Im Modus `zeit`** (§3) entfällt das Placebo „anderer Wert gleicher Klasse"
  — es träfe dieselbe Zelle, also denselben Markttag — und steht im Protokoll als „entfällt (zeit)", nicht stillschweigend weg; Placebo ist
  dort das verschobene Signal (mit eigenem lokalem Topf derselben Bauart). **Sperrklinke auf das verschobene Signal (Nr. 121-1, beide Modi,
  zweiseitig):** `Messgerät-Fehler`, wenn |u brutto verschoben| > 2 se **und** > ¼ der mittleren Hürde der Signaltrades — dieselbe Regel wie
  der Placebo „anderer Wert", in welche Richtung auch immer und unabhängig vom Signal selbst. **Verschobene Fenster, die sich mit einem
  Signalfenster derselben Reihe überschneiden** (Starttag näher als H an einem Einstiegstag), werden **nicht gewertet, aber gezählt**: eine echte
  Kante darf nicht als Messgerät-Fehler gelesen werden, nur weil ihr Placebo in ihr eigenes nächstes Signal fällt (Hochvolumen H20: 91 % der
  verschobenen Fenster). Das Protokoll nennt je Konfiguration diesen **Anteil**: eine Regel mit Periode nahe dem Versatz
  (Monatswende: +20 landet um das nächste Monatsende) trifft verschoben ihr eigenes nächstes Fenster — gezählt, nicht gewertet; bleibt zu wenig
  übrig, ist der Versatz zu ändern. Deshalb darf die Verschiebung bei Kalenderregeln **nicht auf das nächste Ereignisfenster fallen**: `kandidat.json`
  `versatzTage` (5–60, Vorgabe 20) setzt den Versatz; das Feld verlangt eine Begründung in `REGEL.md` unter einer Überschrift „Versatz"
  (`--pruefen` prüft Bereich und Abschnitt), der Adapter benutzt den Wert für die Gegenprobe, und das Protokoll weist ihn mit Grund aus
  („Versatz 10 Handelstage, Grund: …"). Vor dem Setzen die Terminliste gegen den Handelskalender prüfen (Vor-FOMC: +20 trifft 2016–2022 kein
  anderes Fenster, Abstände 27–63 Handelstage — Vorgabe bleibt).
- **Register:** `pruefstrasse/register.json` führt jede je geprüfte Konfiguration mit Urteil, df und Gewicht (`zaehlt`: `nicht messbar` 0, Vorgabe 1,
  `--grund-daten` 2); dazu `m` (Summe der Gewichte), die Zahl der Regeln und **zwei Zahlen** (Nr. 121-2a, Audit B V7): erwartete Kandidaten unter der Null
  = Σ min(P(T_df ≥ 3), 0,05/m) mit df je Eintrag und `belegt-Vorschlag` unter der Null = dieselbe Summe × 0,05 (Vorwärts-Holm auf unabhängigen Daten);
  `zufallErwartet` (2,28 % je Konfiguration bei t ≥ 2) bleibt nachrichtlich. Korb: Zufallsbücher B = max(200, 20 · m + 1) mit m = Konfigurationen
  im Register + 1 (`konfig.js` `korbBuecher`; kleinster p = 1/(B + 1) ≤ α/m), das Protokoll nennt B und den p-Boden.
- **Nachmessung (Nr. 121-1, nur PM, nie der Nachtlauf):** `node pruefstrasse/laeufer.js --nachmessen <kennung> --grund "<Text>" --korrektur <commit>`
  ersetzt ein Urteil, wenn das **Messgerät** einen belegten Fehler hatte und korrigiert ist (Commit der Korrektur: Vorfahr von HEAD, **Nachfahre des
  Ergebnis-Commits der Vormessung** und ändert eine Datei unter `pruefstrasse/` außerhalb `erledigt/` und `warteschlange/`); die
  **Regel** wird nie nachgemessen: der Kandidatenordner muss derselbe Baum sein wie im Commit von Siegel 1 der Vormessung. Die alte Ausgabe
  wandert nach `erledigt/<kennung>/v<n>-<datum>/`, der Lauf geht wie `--kandidat` (Siegel 2 neu, Prüfung nur für Kandidaten); ERGEBNIS.md
  trägt oben den Absatz „Nachmessung n" (Grund, was ersetzt wird, was sich geändert hat, alt → neu je Konfiguration); das Register **ersetzt**
  die Zeilen der Kennung (Felder `nachmessung`, `ersetzt`), der alte Belegstand-Absatz bleibt unverändert stehen, der neue sagt, wen er
  ersetzt. Hat die Vormessung die Prüfzeit gelesen, steht „n. Blick auf die Prüfzeit" in Kopf und Belegstand-Absatz, und ein
  `belegt-Vorschlag` aus einer Nachmessung verlangt einen zweiten unabhängigen Lauf durch den PM (α-Teilung: Stufe 2). `--naechster`
  überspringt erledigte Kandidaten wie bisher. **Rückweg:** vor dem Verschieben liegt die Marke `erledigt/<kennung>/NACHMESSUNG-LAEUFT.json`
  (Grund, Korrektur, Zielordner, Zeit); scheitert ein Schritt, stellt der Läufer die alte Ausgabe zurück, setzt den Index nur für die eigenen
  Pfade zurück und lässt die Marke mit `fehler` liegen. Solange die Marke oder ein `v*-*/ergebnis.json` liegt, messen `--naechster` und
  `--kandidat` den Kandidaten nicht als frischen (`--pruefen` meldet es).
- **Ausgabe:** `erledigt/<kennung>/` mit `LAUF.log`, `KANDIDATEN.json`, `ergebnis.json`, `ERGEBNIS.md`, `belegstand-eintrag.md`;
  der Absatz wird unter `## Prüfstraße (automatisch gemessen)` an `wiki/belegstand.md` angehängt und mit einer Zeile in `wiki/log.md`
  committet (kein Push). Der Kopf des Belegstands bleibt unberührt; `belegt-Vorschlag` landet zusätzlich in `pruefstrasse/VORSCHLAEGE.md`.

## 6. Datenorte

Alle Pfade kommen aus `pruefstrasse/konfig.json`; `PRUEFSTRASSE_DATEN` ersetzt die Wurzel `<daten>` (Windows: `E:/Markt-Dashboard-Archiv`,
Server: der Spiegel). Kein Adapter rechnet mit einer fehlenden oder leeren Quelle weiter — er zählt Dateien und bricht laut ab.
