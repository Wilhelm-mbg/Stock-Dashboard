# Auditor — 26.08.2026, dritter Lauf (~17:00)

**Geprüfter Stand:** `d964891` · **Vorlauf:** `9652f97`

**Arbeitsbaum:** beim Start und während aller Messungen **sauber**. Gegen Ende des Laufs,
nach dem letzten Messvorgang, sind `test-v6.js` und `tools/archiv-wachhund.js` als geändert
aufgetaucht — eine parallele Sitzung arbeitet daran. Beide sind **nicht** Oberflächen-Dateien
und keiner der Funde berührt sie. Alle Funde sind damit **endgültig**, keiner vorläufig.
Angefasst oder committet wurden sie nicht.

**Änderungsmenge:** 49 Commits, 61 Dateien. Oberflächen-Dateien darin: `index.html`,
`depot.js`, `bestandui.js`. Daraus der Schwerpunkt; Rotationsblock war **messung**.

---

## Was gelaufen ist

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **grün** (eslint, test-channel, test-v6) |
| `tools/ui-probe.js` | **grün**, Exit 0, 5 Reiter / 16 Pillen, 0 unbehandelte Fehler |
| `tools/a11y-probe.js --hell` | **grün**, 0 Kontraststellen unter der Schwelle |
| `tools/a11y-probe.js` (dunkel) | **grün**, 0 Kontraststellen unter der Schwelle |
| eigene Probe `probe.js` | Exit 0, 0 Seitenfehler, 0 Konsolenfehler |
| eigene Probe `probe-protokolle.js` | Exit 0, 0 Konsolenfehler |

Bildschirmfotos: 34 Stück in zwei Fenstergrößen (1280×800 und 1000×700), einzeln
angesehen. Nur die drei, die zu einem Fund gehören, liegen unter `bilder/`.

### Versuchsaufbau

Zwei Läufe, beide vollständig isoliert (frisches `userData` und frischer Datenordner
unter `%TEMP%`; Speicher, Depot und Downloads des Anwenders unberührt):

1. **`probe.js`** — gesätes Profil: vier Papiere mit Stückzahl (für die Bestandstabelle)
   und ein Depotverlauf mit 15 Punkten, Hoch und echtem Rücksetzer (für den umgezogenen
   Verlaufskopf). Der Verlauf wird **nicht von Hand zusammengebaut**: `depot.js` liest den
   Speicher ohne Verschmelzung mit den Vorgabewerten, ein selbst getipptes Teilobjekt
   hätte fehlende Felder und erfundene Fehler erzeugt. Genommen wird der Stand, den die
   App selbst geschrieben hat, ergänzt um genau ein Feld.
2. **`probe-protokolle.js`** — zusätzlich die 38 Messprotokolle aus dem Repo im
   isolierten Datenordner. **Ohne sie läuft der Kern dieser Änderungsmenge ins Leere:**
   die neue Variantenwahl nach Protokoll-Urteil (8fc2c8a) und der neue Hinweissatz bei
   „nicht bestätigt" hängen beide an einem vorhandenen Protokoll. Der Auslöser wurde über
   den **Speicher** gesetzt, nicht über die Bedienelemente — ein Klick auf die
   Auslöser-Auswahl hätte die Konfiguration umgestellt, und das ist gesperrt.

Geklickt wurde ausschließlich Navigation (Reiter und Pillen). Kein Knopf der Sperrliste.

---

## A — funktional kaputt

### A1 · Der Beleg im Regelkopf ignoriert die Messprotokolle (Issue #100)

**Reiter Regeln → Regelbuch, Karte „Die Regel, die handelt", Zeile BELEG.**
Beide Fenstergrößen, beide geprüften Auslöser.

Mit 38 Protokollen im Datenordner steht dort:

> **nicht entscheidbar** – … *Kein Messprotokoll im Datenordner – dieser Stand steht fest
> im Code und kann veralten.*

Das Protokoll für `kapitulation` vom 2026-08-26 sagt **nicht bestätigt**. Das Scoreboard
zeigt es zwei Reiter weiter auch so an (`bilder/A1-scoreboard-sagt-nicht-bestaetigt.png`).
Die Kostenhürde-Karte auf **derselben Seite**, im **selben Messmoment**, sagt ebenfalls:

> Messung vom 2026-08-26: Überschuss je Signal +1,071 Pp … (die Variante mit dem Urteil
> des Protokolls, von 3) … Urteil der Messmaschine: **nicht-bestaetigt**.

Zwei Aussagen über dieselbe Regel, gleichzeitig, sechs Zeilen auseinander — und die eine
behauptet, es gäbe kein Protokoll.

**Ursache, im Code nachgewiesen.** `kantenAusProtokollen()` füllt `PROTOKOLL_KANTE`
asynchron und ruft danach in `depot.js:793` **nur** `huerdeAnzeigen()` auf — nicht
`regelKopfAnzeigen()`. Der Regelkopf wird sonst nur an zwei Stellen gezeichnet:

* `depot.js:5780`, in `renderPilot()` — läuft beim Start **einmal**, vor dem Eintreffen
  der Protokolle. Der 5-Sekunden-Takt in `depot.js:6602` greift nur `if (pilotRunning)`,
  und der Autopilot ist ab Werk aus.
* `depot.js:6447`, in `idSave()` — also erst, wenn jemand eine Einstellung ändert.

Auf einem normalen Start bleibt die Zeile damit **dauerhaft** falsch. An beiden Stellen
steht seit jeher der Kommentar *„dieselbe Quelle, derselbe Takt wie die Hürde"* — genau in
dem Augenblick, auf den es ankommt, stimmt er nicht.

**Zwei Folgen, die über die falsche Zeile hinausgehen:**

1. Der **neue Hinweissatz bei „nicht bestätigt"** aus dieser Änderungsmenge (Wilhelms
   Entscheid 2b, `depot.js:684`) hängt an `belegAusProtokoll` und kann deshalb **nie
   erscheinen**. Gemessen: `hatWarnhinweis = false` auch bei `kapitulation`, dessen
   Protokoll genau auf diesem Urteil steht. Ausgeliefert in **v8.33.4**, in der Anzeige tot.
2. Die **neue Variantenwahl nach Protokoll-Urteil** (8fc2c8a) erreicht die Hürde, aber
   nicht den Beleg.

**Regression?** Nein. Der fehlende Aufruf steht wortgleich schon in `9652f97`
(dort Zeile 750). Die Änderungsmenge hat den Fehler nicht gebaut — sie hat zwei neue
Arbeiten in genau den Pfad gelegt, der nie läuft.

Beleg: `bilder/A1-regelkopf-kein-protokoll.png`, `rohbefund-protokolle.json` (`laeufe[].beleg`,
`laeufe[].huerde`).

---

## B — optisch entstellt

### B1 · „Max. Rücksetzer" trägt `class="down"`, aber keine Farbe (Issue #101)

**Reiter Vermögen → Depot, Karte „Depotverlauf".** Beide Fenstergrößen.

Der größte Rücksetzer steht als `<b class="down">-7,2 %</b>` da. Gemessen wurde die
wirklich gerenderte Farbe:

| | Wert |
|---|---|
| gerendert | `rgb(11, 11, 11)` |
| `var(--down)` (Soll) | `rgb(208, 59, 59)` |
| `var(--ink)` (normale Tinte) | `rgb(11, 11, 11)` |

`.down` ist in `index.html:345` **nur unter `#cockpit`** definiert
(`#cockpit .up { … } #cockpit .down { … }`). `#eqKopf` liegt in `#sub-depot`, nicht im
Cockpit — die Klasse tut also nichts. Ein Verlust steht in normaler Tinte, während zwei
Karten weiter auf derselben Seite Verluste rot stehen (`.neg`, gemessen
`rgb(208, 59, 59)`). Das ist die Hausregel grün/rot, die hier still ausfällt.

**Regression?** Nein — die Zeile trug die wirkungslose Klasse schon vorher, im alten
`#eqPanel`, das ebenfalls außerhalb von `#cockpit` lag. Sie ist beim Umzug (10ae955)
unverändert mitgewandert. Der Fund liegt aber in genau der Karte, die diese
Änderungsmenge neu gebaut hat.

Beleg: `bilder/B1-ruecksetzer-nicht-rot.png`, `rohbefund-protokolle.json` (`laeufe[].down`).

### B2 · Roher Urteils-Schlüssel in der Kostenhürde (Issue #102)

**Reiter Regeln, Karte Kostenhürde (`#kostenHuerde`).**

Dort steht wörtlich:

> Urteil der Messmaschine: **nicht-bestaetigt**.

Mit Bindestrich und ohne Umlaut — der interne Schlüssel, nicht der Text. Zwei Reiter
weiter schreibt dieselbe App **„nicht bestätigt"**. Gemessen auf dem Reiter Messung:
die Urteilswörter dort sind ausschließlich „nicht bestätigt", „nicht entscheidbar",
„nicht messbar" — sauber.

`scoreboard.js:40` hält dafür eine Karte `URTEIL` mit `label()` bereit, und der Kommentar
darüber beschreibt genau diesen Fehler als schon einmal aufgetreten:
*„Dieselbe Messung hieß im Scoreboard … und in der Strategien-Liste darunter roh, als
Schlüssel."* `label()` wird aber nicht exportiert — `window.Scoreboard` gibt nur
`{ laden, strategien }` heraus. `depot.js` kann sie deshalb heute gar nicht benutzen und
gibt an **drei** Stellen den Rohwert aus: `depot.js:696` (Beleg), `depot.js:861` (Hürde),
`depot.js:5042` (Klartext-Satz).

**Regression?** Nein, älter als die Änderungsmenge.

Beleg: `rohbefund-protokolle.json` (`laeufe[1].huerde.text`).

### B3 · Reststrich und Großbuchstaben im Regelkopf seit dem `<th>`-Umbau (Issue #103)

**Reiter Regeln → Regelbuch, Karte „Die Regel, die handelt".** Regression aus **779c02c**.

Der Umbau der linken Spalte von `<td>` auf `<th scope="row">` ist als reine
Barrierefreiheits-Änderung gemeint — die Inline-Angabe setzt `text-align:left` und
`font-weight:400` ausdrücklich zurück, um das Aussehen zu erhalten. Drei Eigenschaften aus
`table.tbl th` (`index.html:570`) schlagen aber weiter durch. Gemessen, erste Zelle gegen
zweite:

| | linke Spalte (neu `<th>`) | rechte Spalte (`<td>`) |
|---|---|---|
| `text-transform` | **uppercase** | none |
| `letter-spacing` | **0,48 px** | normal |
| `font-size` | **12 px** | 13 px |
| `border-bottom`, letzte Zeile | **1px solid** | 0px none |

Zwei sichtbare Folgen:

1. Aus „Auslöser", „Positionsgröße", „Not-Stop" wurden **AUSLÖSER, POSITIONSGRÖSSE,
   NOT-STOP** in kleinerer, gesperrter Schrift.
2. `table.tbl tr:last-child td { border-bottom: none; }` greift nur auf `td`. Unter der
   letzten Zeile („BELEG") bleibt deshalb ein **130 px langer Reststrich** stehen, während
   der Rest der Zeile keinen hat — ein Strichfragment, das im Bild deutlich zu sehen ist.

Beide haben dieselbe Wurzel und dieselbe Reparatur (eine Regel für `#regelKopf th`),
deshalb ein Issue statt zwei. Punkt 1 allein wäre C — es sieht nicht kaputt aus, nur
anders als beabsichtigt; Punkt 2 ist der sichtbare Fehler.

Beleg: `bilder/A1-regelkopf-kein-protokoll.png` (unterer Rand der Tabelle),
`rohbefund-probe.json` (`regelkopf.zeilen[].stilErste` / `stilZweite`).

---

## C — Schönheitsfehler (kein Issue)

1. **Spalte „Heute" in Meine Papiere mischt Einheiten.** Die Zeilen tragen Prozent
   (`+1,11 %`, `-0,80 %`), die Summenzeile darunter Dollar (`-11,99 $`). Wer die Spalte
   von oben nach unten liest, wechselt in der letzten Zeile die Größe. Älter als die
   Änderungsmenge (vorher `Math.round(sumHeute) + ' $'`).
2. **Spalte „Kurzfrist" bricht bei 1000 px auf drei bis vier Zeilen um**
   („Kursreihe zu kurz (155 < 261 Kerzen) – Signal wäre nicht das gemessene") und macht
   jede Tabellenzeile dreimal so hoch. Inhaltlich richtig, nur raumgreifend.
3. **`.eq-panel`-Regeln sind restlos entfernt** — gegengeprüft, 0 verwaiste Regeln im
   Stylesheet. Kein Fehler, sondern die Bestätigung eines sauberen Umzugs.

---

## Gegenproben zu eigenen Funden der letzten Nacht — beide **erledigt**

* **#93** (Zahl und Einheit brachen bei 1000 px auf zwei Zeilen). Nachgemessen mit einem
  `Range` über jeden Zellinhalt: **alle** Zahlzellen der Bestandstabelle stehen bei 1000 px
  auf **genau einer** Zeile. Die einzige zweizeilige Zelle ist die Kopfzelle
  „SEIT JAHRESBEGINN" — eine Überschrift, die umbrechen darf und soll.
* **#94** (englisches Zahlenformat, graue statt roter Verluste). Nachgemessen:
  `313,33 $`, `3.759,90 $`, `+15,6 %` — deutsche Schreibweise durchgehend. Verluste tragen
  `neg` und rendern `rgb(208, 59, 59)`, Gewinne `pos` und `rgb(0, 99, 0)`.

Beide Funde stammten aus v8.33.3 und sind in **v8.33.4** behoben.

## Weitere Gegenproben (kein Fund)

* **Depotverlauf-Umzug** (10ae955): `#eqPanel` ist weg, `#eqKopf` steht als `flex` in der
  Karte des ausführlichen Bildes, drei Kennzahlen, deutsche Schreibweise, passt in beiden
  Fenstergrößen in die Karte (1200 px in 1230 px bzw. 920 px in 950 px). Das ausführliche
  Bild zeichnet (2 Pfade, Achsenbeschriftung). Einziger Fund dort ist B1.
* **Kontrast, Stufe F (3)** (779c02c): beide Themen mit `tools/a11y-probe.js` nachgemessen,
  **0** Stellen unter der Schwelle. Die geänderten Farben (`--muted`, `--series`,
  `--series2`, `--up`) tragen.
* **Leerzustände**: Scoreboard ohne Protokolle zeigt einen erklärenden Leerzustand
  („Noch kein Protokoll. Unten eine Strategie ablegen und auf *Jetzt messen* drücken.") —
  richtig, kein Fund.

---

## Was ich bewusst NICHT geprüft habe

* **Alle Knöpfe der Sperrliste** — nicht angefasst (`#kostenRundeBtn`, `#depotResetBtn`,
  `#pilotOn`/`#pilotBtn`, `#stratEmpfohlenBtn`, `#btRunBtn`, `#quelleTestBtn`, `#aiBtn`,
  `#setUpdInstallBtn`, alles mit kaufen/verkaufen/Order/zurücksetzen/löschen/festschreiben).
* **Tastaturreihenfolge und Fokus in den Dialogen** — gehört zum Rotationspunkt
  Barrierefreiheit, nicht zu dieser Nacht. `tools/a11y-probe.js` hält dazu bereits Material
  bereit; die Tafel führt „Fokus in Dialogen" als offen.
* **Der Null-Pfad `jeSignalPp == null`** (neu in dieser Änderungsmenge, `depot.js:707`,
  `depot.js:5043`). Nachgezählt: bei allen zwölf Protokollen vom 26.08. gibt es zu jedem
  `bestesUrteil` mindestens eine Variante mit brauchbarer Zahl je Signal — der Zweig ist mit
  den heutigen Daten **nicht erreichbar** und blieb damit ungeprüft. Er ist sauber
  geschrieben; die dritte Stelle (`depot.js:847`) hat den Schutz ebenfalls.
* **Live-Netzdaten.** Kurse kamen im Testprofil an; wo Karten leer blieben, wurde das nach
  Abschnitt 5 als *leer*, nicht als *kaputt* gewertet.

## Grenzen dieses Laufs, ehrlich

* Die Textprüfung auf unfertige Werte meldete **drei Fehlalarme**: das deutsche Wort
  „null" im Fließtext („einmalig auf null gesetzt") und ein `null` in der
  Code-Vorschau des Strategie-Baukastens. Kein Fund, aber die Regel ist zu grob.
* Drei Laufband-Links auf „Heute" wurden als „außerhalb des Fensters" gemeldet
  (`left=1675…2696`). Das Laufband ist seit der Reparatur von #90 waagerecht schiebbar —
  die Links sind erreichbar. **Fehlalarm**, kein Rückfall von #90.
* Im gesäten Profil widersprechen sich Depotkacheln (`100.000,00 $`, `0,00 % seit Start`)
  und Verlaufskopf (`+7,3 %`). Das ist **mein Versuchsaufbau**: der Verlauf ist künstlich
  gesetzt, der Kassenstand nicht. Kein Fund.

---

## Nachtrag: der Arbeitsbaum ist während des Laufs gewandert

Gemessen wurde durchgehend auf `d964891`. Beim Commit stand der geteilte Arbeitsbaum
bereits auf `f3896c7` (v8.33.5) — eine Parallelsitzung hat zwischendurch gepusht, und der
Baum ist mitgezogen. Das ist der bekannte Fall „mehrere Sitzungen, ein Arbeitsbaum".

**Gegengeprüft, ob das die Funde entwertet:** `git diff --name-only d964891..f3896c7`
berührt **keine** Oberflächen-Datei — nur `PROJEKTSTAND.md`, `package.json` (Versionsschub
auf 8.33.5), drei Release-Notizen und Studienordner von Analytiker und Tüftler.

**Alle vier Funde gelten damit unverändert für den heutigen Stand.** Der tote Hinweissatz
aus A1 ist mit v8.33.4 ausgeliefert worden und steht auch in **v8.33.5** noch so da.

Gepusht wurde ausschließlich der eigene Commit (`git log f3896c7..2c4d984` = eine Zeile);
die fremden Änderungen an `test-v6.js` und `tools/archiv-wachhund.js` blieben unberührt
im Arbeitsbaum liegen.
