# REGEL — Trägt die Momentum-Auswahl oder nur der Korb? Momentum-Buch gegen Zufallsbücher aus demselben Korb (Auftrag Nr. 100)

Kennung `momentum-zufall-2026-10/v1`. Diese Datei ist **vor jedem Lauf** geschrieben und allein committet (Siegel). Teil A ist §1 des
Auftrags `uebergabe/auftrag-momentum-zufall-2026-10-05.md`, **wörtlich**. Teil B nennt die Fundstellen. Teil C legt fest, wie Code und
Bericht die Stellen lesen, die Teil A offen lässt — vor der ersten Zahl. Teil D nennt die Prüfungen. Nach dem Siegel wird an A, B und C
nichts mehr geändert; ein Fehler im Code wird benannt, behoben, der Lauf wiederholt und in `ergebnis.json` unter `korrekturen` vermerkt.

Beschreibende Zahlen nach vorher festgelegter Regel. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel, wörtlich (Auftrag §1)

- **Zufallsbuch:** an jedem Umschichtungstag dieselbe Zielzahl wie das Momentum-Buch an diesem Tag, gezogen **ohne Zurücklegen und
  gleich wahrscheinlich** aus den **zulässigen Werten desselben Korbs** (die 187 umsatzstärksten am Stichtag, nach den Zulässigkeitsregeln
  von `momentumZiel`, also auch Mindestlänge und Frische); sonst **alles gleich**: Mechanik der App (`planeUmschichtung`/`fuehreAus` mit
  Regel K), Kosten 20 Bp je Seite, Takt 63 Handelstage, Ausschüttungen, Reihenenden, Startkapital, Fenster A und B, Panel v2.3.
  Der Zufall ist geseedet (Startwert je Buch festgeschrieben), damit jeder Lauf wiederholbar ist.
- **Umfang (vom PM festgelegt, gilt unabhängig vom Budget):** 200 Zufallsbücher je Fenster mit Start am ersten Tag (Pflicht, trägt das
  Urteil); dazu für die **Bücher 1–50** (dieselben Startwerte) alle 63 Starttage (beschreibend, kein Urteil).
- **Zweite Kontrolle:** der **ganze Korb gleich gewichtet** (Zielzahl = alle zulässigen des Korbs, gleiche Mechanik), A und B.
- **Selbstprüfung:** das Momentum-Buch wird im selben Lauf mitgerechnet und muss die Endwerte von Nr. 96 auf den Cent treffen.
- **Entscheidregel (vorab):** „**die Auswahl trägt**" nur, wenn das Momentum-Buch in **beiden** Fenstern beim Start am ersten Tag über dem
  **95. Perzentil** der Zufallsbücher liegt; „**der Korb trägt**", wenn das Momentum-Buch in mindestens einem Fenster nicht über dem
  95. Perzentil liegt **und** der Median der Zufallsbücher in **beiden** Fenstern vor SPY endet; in jedem anderen Fall „nicht
  entscheidbar". Dazu je Fenster: Rang des Momentum-Buchs unter den 200,
  Median/5./95. Perzentil der Zufallsbücher, Anteil der Zufallsbücher vor SPY, gleichgewichteter Korb gegen SPY.

## Teil B — Fundstellen (Stand HEAD `75f2a40`, gelesen 05.10.2026)

| Was | Wo | Wert |
|---|---|---|
| Korb je Stichtag | `studien/momentum-korb-2026-10-04/korb.js` `korbZiel` Z. 89–102, `korbWaehlen` Z. 84–87 | die 187 mit dem höchsten Umsatz aus `rangfolge` von `momentumZiel` (= nur zulässige Werte); Klinke: `momentumZiel` auf dem Korb allein meldet genau 187 zulässig von 187 geprüft |
| Zielfunktion | `korb.js` `zielAm` Z. 105–119, Aufruf in `simuliere` Z. 227 | liest zuerst `Q.korbCache[s].koerbe[n]` |
| Zulässigkeit | `mfhandel.js` `momentumZiel` Z. 53–103 | Mindestlänge 253 Zeilen (Z. 73), Frische ≤ 7 Tage (Z. 76), Stärke berechenbar (Z. 85), Umsatz ≥ 100 Mio $ Median über 20 Tage (Z. 89); Zielzahl `max(5, round(zulässig × 0,1))` (Z. 100) = 19 beim Korb 187 |
| Mechanik | `mfhandel.js` `planeUmschichtung` Z. 118, `fuehreAus` Z. 159; Regel K über die Hülle `kleinst.js` Z. 33–112 | `kleinstAnteil` 0,05 (`kleinst.js` Z. 17, `buchKonfig` Z. 40); Takt `halten` 63 (`buchKonfig`) |
| Kosten, Start, Phasen, Maßstab | `studien/massstab-rueckblick-2026-10-04/rueckblick.js` Z. 26–31 | 20 Bp je Seite, 100.000 $, 63 Startphasen, SPY |
| Panel | `rueckblick.js` Z. 21–24 (`RUECKBLICK_PANEL=v2.3` → `voll-v23c`), wie `studien/momentum-korb-v23-2026-10-04/lauf.js` Z. 11 | `querschnitt-pruefstand-2026-09-13/panel/v2.3` Bau 2c |
| Fenster | `korb.js` Z. 24–27 | A 04.01.2017–15.09.2021 (Stichtag 03.01.2017, 1.183 Handelstage); B 16.09.2021–15.09.2026 (Stichtag 15.09.2021, 1.254) |
| Sollwerte Selbstprüfung | `studien/momentum-korb-v23-2026-10-04/ergebnis.json` → `laeufe[A-187/B-187].mit.k0` | A-187 259.238,74 $ gegen SPY 215.535,73 $; B-187 250.123,14 $ gegen SPY 181.193,87 $; Median der 63 Abstände +7,27 / +8,25 Pp p. a. |
| Vorbild | `wiki/belegstand.md` Abschnitt Ergebnis-Drift | 200 Zufallsbücher, „16 von 200 über dem Buch" |

## Teil C — Lesart (vor der ersten Zahl festgelegt)

1. **Rechner unverändert.** Gerechnet wird mit `kleinst.js` (Hülle, Regel K) → `korb.js` (`simuliere`, `startphasen`) → `mfhandel.js`,
   alle nur per `require`, auf dem Panel v2.3 (Variable `RUECKBLICK_PANEL=v2.3`, gesetzt im Laufskript vor dem Laden). Keine gemeinsame
   Datei wird geändert.
2. **Wie die Zufallsauswahl an die Stelle von `zielAm` kommt.** `zielAm(T, Q, s, 187)` liest zuerst den Zwischenspeicher
   `Q.korbCache[s]`. Jedes Zufallsbuch (und der ganze Korb) rechnet mit einem eigenen Objekt `Qz = Object.create(Q)`, das alles vom echten
   `Q` erbt; nur sein eigener `korbCache` liefert am Stichtag `s` die eigene Zielliste. Die liefert die eigene Zielfunktion: sie holt zuerst
   den echten Eintrag des Momentum-Buchs `e = zielAm(T, Q, s, 187)` (derselbe Aufruf, dasselbe Ergebnis wie beim Momentum-Buch) und ersetzt
   nur dessen `ziel`. Meldet `e` „zu wenig" (`zuWenig`), bleibt der Eintrag unverändert — dann schichtet auch das Zufallsbuch an dem Tag
   nicht um (wie das Momentum-Buch).
3. **Die Ziehung (Zufallsbuch b, b = 1 … 200, Startwert b).** Liste `L` = die 187 Werte des Korbs am Stichtag (`e.korb`), aufsteigend nach
   Zeichencode sortiert; `m = 187`; Zielzahl `z = e.ziel.length` (die des Momentum-Buchs am selben Tag). Für `j = 0 … z−1`:
   `h_j = SHA-256` des Texts `momentum-zufall-2026-10|<b>|<Stichtag JJJJ-MM-TT>|<j>` (UTF-8, Hex), `u_j` = die ersten 12 Hex-Ziffern als
   Zahl / 2^48, `i = j + floor(u_j × (m − j))`, dann `L[j]` und `L[i]` tauschen (Fisher–Yates, nur die ersten z Schritte). Zielliste =
   `L[0 … z−1]` in dieser Reihenfolge (die Reihenfolge entscheidet wie beim Momentum-Buch nur, welcher Kauf bei knappem Bargeld zuletzt
   kommt). Die Ziehung hängt nur an Buch und Stichtag: dasselbe Buch zieht an demselben Stichtag immer dieselbe Liste, in jeder Startphase.
   Fenster A und B benutzen dieselben Startwerte (die Stichtage der Fenster überschneiden sich nicht).
4. **Ganzer Korb gleich gewichtet.** Zielliste = alle 187 Werte des Korbs am Stichtag, aufsteigend nach Zeichencode; Mechanik der App mit
   Regel K (gehaltene Ziele werden also nicht nachgewichtet — „gleich gewichtet" heißt: gleiches Budget je Kauf, wie beim Momentum-Buch).
   k = 0 in A und B; dazu beschreibend seine 63 Startphasen.
5. **Größen.** Verglichen werden die **Endwerte** in $ am 15.09.2021 (A) bzw. 15.09.2026 (B) bei Start am ersten Tag (k = 0); daneben
   der Abstand zu SPY in Pp p. a. (`kennzahlen` aus `rueckblick.js`). **95. und 5. Perzentil:** lineare Interpolation über die sortierten
   200 Endwerte `x_0 ≤ … ≤ x_199`: `h = 199 × p`, `P = x_⌊h⌋ + (h − ⌊h⌋) × (x_⌊h⌋+1 − x_⌊h⌋)` (wie Excel `QUANTIL.INKL`). **Median** =
   `R.median` (Mittel der Plätze 100 und 101). „**Über dem 95. Perzentil**" heißt strikt `Momentum-Endwert > P95`. „**Vor SPY**" heißt strikt
   `Endwert > SPY-Endwert`. **Rang** des Momentum-Buchs = 1 + Zahl der Zufallsbücher mit größerem Endwert (Rang 1 = vor allen 200).
6. **Entscheidung, mechanisch:** `ueber95(A) und ueber95(B)` → „die Auswahl trägt"; sonst `medianVorSpy(A) und medianVorSpy(B)` → „der Korb
   trägt"; sonst „nicht entscheidbar". Der gleichgewichtete Korb, die Startphasen der Bücher 1–50 und alle übrigen Zahlen ändern das
   Urteil nicht.
7. **Beschreibend (Bücher 1–50, 63 Startphasen, je Fenster):** je Buch der Median seiner 63 Abstände (Pp p. a.); wie viele der 50 Mediane
   über dem Median des Momentum-Buchs liegen; je Startphase, wie viele der 50 Bücher vor dem Momentum-Buch enden; Anteil der 3.150
   Buch-Phasen vor SPY; Minimum/Median/Maximum aller 3.150 Abstände. Das Momentum-Buch rechnet seine 63 Phasen im selben Lauf neu.
8. **Ablage.** `ergebnis.json` (alle Endwerte, alle 200 Bücher je Fenster, Zähler, Kennzahlen), `ziehungen.json` (die gezogenen Listen aller
   200 Bücher für k = 0 je Stichtag — zum Nachrechnen mit einem eigenen Rechner), `ERGEBNIS.md` (eine Seite).

## Teil D — Prüfungen

- **Selbstprüfung (Pflicht, sonst kein Lauf):** Momentum-Buch mit Regel K, k = 0, im selben Prozess: A-187 259.238,74 $ / SPY 215.535,73 $,
  B-187 250.123,14 $ / SPY 181.193,87 $, auf den Cent. Seine 63 Startphasen müssen die 63 Abstände von Nr. 96 treffen.
- **Durchreich-Probe (Pflicht, sonst kein Lauf):** derselbe Weg über `Qz` mit einer Zielfunktion, die den echten Eintrag unverändert
  durchreicht, ergibt für k = 0 in A und B das Momentum-Buch auf das Bit — der Einsatzweg selbst ändert nichts.
- **Klinken je Ziehung:** genau z Werte, keiner doppelt, alle aus dem Korb des Tages, keine Referenzreihe (`klinkeReferenz`), und
  `momentumZiel` auf den gezogenen Werten allein meldet alle als zulässig (Stichprobe in `test.js`); jede Ziehung zweimal gleich.
- **`test.js`:** Ziehung an Handfällen (richtige Zahl, nur zulässige Werte, wiederholbar, verschiedene Bücher verschieden, gleich
  verteilt im Groben), Einsatzweg über `zielAm` am Handfall, Perzentil und Entscheidregel an gesetzten Zahlen, am echten Panel die
  Selbstprüfung und die Durchreich-Probe.
