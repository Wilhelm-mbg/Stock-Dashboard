# Die Form eines Kandidaten (Prüfstraße, Auftrag Nr. 110, 11.10.2026)

Eine Handelsidee ist für die Prüfstraße **ein Ordner** `pruefstrasse/warteschlange/<kennung>/` mit genau vier Dateien.
Der Läufer (`node pruefstrasse/laeufer.js`) macht daraus Siegel, Entdeckung, Gegenproben, Placebo, Tore, Holdout-Sperre,
Urteil und Belegstand-Eintrag — ohne weiteren Auftrag. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

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
  "erwartung": { "groesse": "0,1 bis 0,3 Pp je Trade brutto", "richtung": "positiv" },
  "konfigurationen": [ { "key": "H5", "richtung": "long", "haltedauer": 5 }, { "key": "H10", "richtung": "long", "haltedauer": 10 } ],
  "params": { "N": 20, "confirmBps": 15 },
  "autor": "…", "datum": "2026-10-11"
}
```

Pflichtfelder: `kennung` (= Ordnername, `[a-z0-9-]+`), `form` (`tag` | `korb` | `minute`), `titel`, `quelle`, `erwartung`
(`groesse` und `richtung` **vorab**), `konfigurationen` (nicht leer; **die Zahl steht fest, bevor gemessen wird** — der Läufer
misst genau diese Liste und trägt ihre Länge ins Register ein), `autor`, `datum`. `params` ist frei und wird der Regel durchgereicht.

Konfiguration je Form:
- **tag:** `key`, `richtung` (`long` | `short`), `haltedauer` (Handelstage, 1–60; Ausstieg zur Eröffnung des ersten Handelstags
  ≥ Einstiegstag + Haltedauer, wie Trendkanal §5). Optional `klassen` (Umsatzklassen 0–3, Vorgabe alle). Auf Kandidatenebene optional
  `bewertung` (`topf` | `zeit`, Vorgabe `topf`; jeder andere Wert macht den Kandidaten ungültig — Absatz „Bewertung" in §3) und optional
  `versatzTage` (ganze Zahl 5–60, Vorgabe 20: Handelstage der Verschiebungs-Gegenprobe; gesetzt nur mit Begründung in `REGEL.md` unter einer
  Überschrift „Versatz", sonst ungültig — §5 Gegenproben).
- **korb:** `key`, optional `anzahl` (Zielzahl; sonst entscheidet die Zielfunktion), `korb` (Zahl der umsatzstärksten Werte als
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
Sicht bis dorthin gefragt wird — die Form des „bestätigten Ausbruchs" der Trendkanal-Studie). Cooldown 5 Handelstage je Richtung.
**Bewertung `topf` | `zeit`** (`kandidat.json` `bewertung`, Nr. 118). **`topf`** (Vorgabe): Überschuss gegen den **Topf derselben Zelle**
(Einstiegstag, Dauer, Klasse, lebend), Kassa-Hürde je Umsatzklasse, Standardfehler Hansen-Hodrick über die Tagesreihe (Lag = Haltedauer),
Tor 1 (Entdeckung ≥ 4 × projizierte Bestätigungs-MDE), Tor 2 (delta80 unter der Hürde) — wie die Trendkanal-Studie
(`studien/vorregistrierung-2026-09-08-trendkanal-tage/`); Placebo = anderer Wert gleicher Klasse am selben Tag. **`zeit`:** für Regeln, die an
einem Tag **alle oder fast alle** Reihen treffen (Kalender- und Terminregeln: Monatswende, Vor-FOMC, Vorfeiertag) — dort **ist** die Signalmenge
der Topf der Zelle, der Überschuss ist per Bau null und ein „nein" sagt nichts (Fehlerform „Tagestopf löscht marktweite Effekte"). Im Modus
`zeit` ist der Topf eines Trades seit Nr. 121-1 der **lokale Topf seines Signals** (`adapter/tag.js` `lokalerTopf`). Alle Indizes sind
Tafelindizes (Handelstage der Tafel, nicht Zeilen der Reihe); `H` ist die Haltedauer der **Konfiguration**; Topf-Fenster rechnen wie der Trade
(Eröffnung → Eröffnung, Ausstieg am ersten Handelstag ≥ Start + H). (1) Zulässige Topf-Starttage einer Reihe: Klasse in `klassen` der
Konfiguration, kein Maßnahmentag, **kein** Fenster, das sich mit irgendeinem Signalfenster der Reihe überschneidet (Starttag näher als H an
einem Einstiegstag), nicht rechtszensiert, nicht kurslos; Abgänge zählen mit ihrem letzten Schluss wie im Tagestopf. (2) **Jeder Topf-Starttag
gehört genau einem Signal**: dem nächstgelegenen Einstiegstag derselben Reihe (Gleichstand → der frühere), und nur bis zum Abstand
`R` = `topfRadius` (`kandidat.json`, Handelstage, für jede Konfiguration 2 H … 12 H, **Vorgabe 4 H**; gesetzt nur mit Begründung in `REGEL.md`
unter einer Überschrift „Topfradius", `--pruefen` prüft Bereich und Abschnitt) — die Töpfe benachbarter Signale sind disjunkt. (3) Topf = Mittel
der zugeordneten Fenster, **mindestens 2** (`konfig.js` `TOPF_N_MIN`, eine Setzung), sonst entfällt der Trade und wird als `topfFehlt` gezählt.
(4) Zuordnung je Zeitraum (Entdeckung bzw. Prüfung — ein Entdeckungs-Topf enthält keinen Prüfzeit-Start); Fenster dürfen über das Zeitraumende
hinauslaufen wie der Trade selbst. **Warum lokal:** der lokale Topf vergleicht das Signalfenster mit **seiner eigenen Periode** — gerade gegen
ungerade FOMC-Wochen, Monatswende gegen Monatsmitte —, wie die Quellen selbst messen; ein Regime (2020) trifft Signal und Topf gleich; eine
Terminlücke verschiebt nichts mehr. Der frühere Topf „über alle zulässigen Starttage desselben Zeitraums" (Nr. 118) war bei unregelmäßigem
Signalplan zeitlich verzerrt (Audit Nr. 120: fomc Topf +0,90 Pp je 5 Tage gegen +0,30 aller Fenster, 2020 trägt 0,55) und seine Streuung fehlte
im se; er bleibt als `zeitTopfGlobal` nur nachrichtlich („Überschuss gegen den globalen Topf ohne Ausschluss") und für den Rot-vor-Grün-Test.
**Standardfehler:** die Streuung des lokalen Topfs steckt im Überschuss jedes Trades und damit in der Tagesreihe; weil die Töpfe disjunkt sind,
bleibt der Hansen-Hodrick-Lag = H wie im Modus `topf` (Beweis: Kunsttest D-i in `test.js`, 100 Seeds unter der Null mit unregelmäßigem Plan
und Regime-Block). Nachrichtlich im Protokoll: Topf-n je Trade (Median, Min), Histogramm der Topf-Starttage relativ zum Signal, Topf-Mittel,
Überschuss gegen den globalen Topf, Sensitivität für R = 2 H und 8 H (kein Urteil). Kassa-Hürde, Tagesreihe (Mittel
je Einstiegstag), Hansen-Hodrick, Tor 1 und MDE80 = 2,8016 × se bleiben; bei einer marktweiten Regel ist jeder Signaltag **ein** Cluster,
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

- **Entdeckung** bis 30.12.2022 über **alle** Konfigurationen; **Prüfung** ab 01.01.2023 nur für Kandidaten, Daten erst nach
  Siegel 2 lesbar (Sperre aus Nr. 109: ohne Commit von `KANDIDATEN.json` öffnet der Adapter die Prüfzeit nicht).
- **Siegel 1:** der Kandidatenordner liegt in mindestens einem Commit und hat nichts Ungesichertes. **Siegel 2:** der Läufer
  committet `erledigt/<kennung>/KANDIDATEN.json`.
- **Kandidat** (je Konfiguration, Entdeckung): netto > 0, t ≥ 2, Tor 1, kein Placebo-Verstoß (|Placebo| > 2 se **und** > ¼ Hürde; im
  Modus `zeit` gegenstandslos, dort wirkt dieselbe Regel auf das verschobene Signal, siehe Gegenproben). „t ≥ 2" ist das Kandidaten-Kriterium; **MDE80 = 2,8016 × se** (`konfig.js` des
  Prüfstands) ist die Auflösung — zwei Zahlen, zwei Namen.
- **Urteile:** `belegt-Vorschlag` (Prüfung: Holm über alle Konfigurationen des Kandidaten, einseitig 5 %, gleiche Richtung wie in
  der Entdeckung, netto > 0; nachrichtlich, ob der Treffer Holm über **alle** Konfigurationen des Registers überstünde) ·
  `nicht entscheidbar` (nichts belegt, aber auch nicht ausgeschlossen; MDE80 steht daneben) · `nein` (jede Konfiguration in der
  behaupteten Richtung ausgeschlossen: obere 95-%-Grenze netto < 0, oder Prüfung negativ) · `Messgerät-Fehler` (Verstoß gegen „kein
  Blick nach vorn", oder eine Gegenprobe fällt gegen die Regel: das verschobene Signal zeigt einen Ausschlag, zweiseitig — siehe Gegenproben).
- **Gegenproben (Pflicht, tag):** Einstieg einen Tag später bei festem Ausstieg; Signal um 20 Handelstage verschoben; Placebo mit
  zufälligen Signalen gleicher Tagesverteilung (anderer Wert, gleicher Tag, gleiche Klasse, gleiche Richtung); „alle gegen lebend";
  Abgänge (Übernahme, Insolvenz, sonstige) getrennt gezählt. **Im Modus `zeit`** (§3) entfällt das Placebo „anderer Wert gleicher Klasse"
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
- **Register:** `pruefstrasse/register.json` zählt jede je gemessene Konfiguration; jedes ERGEBNIS nennt die Gesamtzahl und die
  erwarteten Zufallstreffer (2,28 % je Konfiguration bei t ≥ 2 einseitig).
- **Ausgabe:** `erledigt/<kennung>/` mit `LAUF.log`, `KANDIDATEN.json`, `ergebnis.json`, `ERGEBNIS.md`, `belegstand-eintrag.md`;
  der Absatz wird unter `## Prüfstraße (automatisch gemessen)` an `wiki/belegstand.md` angehängt und mit einer Zeile in `wiki/log.md`
  committet (kein Push). Der Kopf des Belegstands bleibt unberührt; `belegt-Vorschlag` landet zusätzlich in `pruefstrasse/VORSCHLAEGE.md`.

## 6. Datenorte

Alle Pfade kommen aus `pruefstrasse/konfig.json`; `PRUEFSTRASSE_DATEN` ersetzt die Wurzel `<daten>` (Windows: `E:/Markt-Dashboard-Archiv`,
Server: der Spiegel). Kein Adapter rechnet mit einer fehlenden oder leeren Quelle weiter — er zählt Dateien und bricht laut ab.
