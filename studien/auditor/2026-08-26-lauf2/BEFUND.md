# Auditor — 26.08.2026, zweiter Lauf

**Geprüfter Stand:** `9652f97` (während des Laufs zog `main` auf `3740aac` weiter — siehe Nachtrag)
**Änderungsmenge:** `a502c99..9652f97`, 29 Commits
**Ausgeliefert:** die geprüfte Fläche steckt in **v8.33.3** (Tag während des Laufs gesetzt)
**Rotationspunkt dieser Nacht:** `depot`
**Dauer:** rund 45 Minuten

---

## Was geprüft wurde

**Schwerpunkt** aus der Änderungsmenge — die angefassten Oberflächen-Dateien waren
`bestandui.js` (208 Zeilen), `index.html`, `renderer.js`, `scoreboard.js`, `main.js`,
`preload.js` und das neue `thema.js`:

1. **Vermögen → Meine Papiere** (`#bestandTabelle`) — die Tabelle ist mit #83/#89 von sieben
   auf zehn Spalten gewachsen, hat eine Summenzeile bekommen und trägt jetzt den Signalstand,
   der vorher als eigene Liste auf *Heute* stand.
2. **Heute → Überblick** — dort ist die Signalliste (`#bestandListe`) ersatzlos entfallen.
3. **Das Laufband** — Gegenprobe zum eigenen B-Fund der Vornacht (#90).
4. **Das Farbthema beim Start** — Stufe F Punkt 1, kein Dunkel-Blitz mehr.

**Rotationsblock:** `depot` — alle vier Pillen (Depot, Bücher, Meine Papiere, Protokoll).

**Vollständig durchgeschaltet** wurden trotzdem alle 5 Reiter und 16 Pillen in zwei
Fenstergrößen (1280×800, 1000×700), mit 29 Bildschirmfotos.

### Der Unterschied zur Vornacht: ein gesätes Profil

Der erste Lauf sah die neue Bestandstabelle nur als **Leerzustand** — ein frisches Profil hat
keine Papiere, und damit zeigt genau die Fläche nichts, um die es geht. Diese Probe legt
deshalb vor dem Start vier Papiere in den Speicher des **Testprofils** (`%TEMP%`, dieselbe
Datei, die `storeSet()` schreiben würde). Der Speicher des Anwenders wird weder gelesen noch
angefasst. Ohne diesen Schritt wären beide Funde unsichtbar geblieben.

---

## Grundlinie

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **grün** (`eslint .`, `test-channel.js`, `test-v6.js` — „ALLE TESTS BESTANDEN") |
| `tools/ui-probe.js` | **grün**, Exit 0 — 5 Reiter, 16 Pillen geschaltet |
| unbehandelte Fehler in der Seite | **0** über den ganzen Lauf |
| `console.error` aus der Seite | **0** |

Der Arbeitsbaum war schmutzig (fremde Tüftler-Dateien unter `studien/`, keine
Oberflächen-Datei darunter). `npm test` war trotzdem grün — kein Vorbehalt nötig.

---

## A — funktional kaputt

**Keine.**

Ausdrücklich mitgeprüft und in Ordnung:

- **Struktur der neuen Tabelle:** Kopfzeile und alle vier Datenzeilen **und** die neue
  Summenzeile haben je **10 Zellen**. Die Summenzeile füllt die vier Spalten rechts von
  „seit Jahresbeginn" korrekt mit leeren Zellen — keine verrutschte Spaltenlogik.
- **Ehrliche Summe:** Ein Papier ohne Kurs (erster Durchlauf, BRK-B lieferte keinen)
  unterdrückt die Summenzeile vollständig und schaltet den erklärenden Satz frei, statt
  stillschweigend zu wenig zu zeigen. Das ist der `alleKurse`-Zweig, und er greift.
- **Der Absprung in den Explorer** hing an der entfallenen Signalliste. Er ist an
  `#bestandTabelle` nachgezogen worden; die Symbol-Knöpfe sind in der Tabelle vorhanden und
  tragen `data-bsym`. (Geklickt wurde nicht — Klicks bleiben bei Navigation.)
- **`#bestandListe` ist restlos weg** — kein toter Container, keine Lücke auf *Heute*.
  Die Seite schließt dort sauber (Beleg: `bilder/heute-1280-dieselben-zahlen-deutsch.png`).
- **Leerzustand der leeren Tabelle:** vorhanden, ohne Selbstverweis.

### Gegenprobe zum eigenen Fund #90 — die Reparatur trägt

Der B-Fund der Vornacht war: bei „Bewegung reduzieren" stand das Laufband still **und** war
nicht schiebbar, drei von sechs Schlagzeilen dauerhaft unerreichbar. Nachgemessen:

```
ruhig=true  animation=none  overflowX=auto  schiebbar=true
spurBreite=3022  rahmen=1228  links=6
titel="… das Band läuft nicht, weil auf diesem Rechner ,Bewegung reduzieren' …"
```

Alle **sechs** Links erreichbar, Rollbalken sichtbar, der Inhalt nicht mehr verdoppelt, und
der `title` behauptet nicht länger, das Band halte unter dem Mauszeiger an. **Erledigt.**

Nebenbei bestätigt: `prefers-reduced-motion: reduce` ist auf diesem Rechner **ohne jede
Emulation aktiv** (`ruhig: true`). Der Fund war also der Normalfall, kein Sonderfall.

### Gegenprobe zum Dunkel-Blitz (Stufe F Punkt 1) — trägt ebenfalls

Testprofil auf `theme = "light"` gesetzt, dann gestartet:

```
THEMA={"start":"light","gesetzt":"light"}
```

Das Startargument kommt an, `thema.js` setzt `data-theme` im `<head>`. **Erledigt.**

---

## B — optisch entstellt

### B-1 · Zahl und Einheit brechen auf zwei Zeilen → **Issue #93**

Bei 1000×700 bricht in den Zahlenspalten die Einheit um: `309.90` / `$`, `+0.90` / `%` — und
in der Summenzeile der Gesamtwert als `15483` / `$`. Die Tabelle ist von sieben auf zehn
Spalten gewachsen; die beiden neuen Signalspalten tragen langen Fließtext und ziehen die
Breite ab. **Regression aus dieser Änderungsmenge.** Bei 1280×800 nicht sichtbar.

Beleg: `bilder/papiere-1000-umbruch.png`

### B-2 · Englisches Zahlenformat und graue statt rote Verluste → **Issue #94**

Zwei Befunde, ein Issue: dieselbe Ursache (`zeichnenTabelle()` baut Zahlen und Farben von
Hand statt mit `U.money`/`U.nf2`/`U.signCls` aus `app-shell.js`), dieselbe Fundstelle.
Getrennt aufgeschrieben, damit die Issue-Wache sie trennen kann, wenn sie will.

**Zahlenformat:** `309.90 $`, `-0.14 %`, `15483 $`. Dieselben Werte stehen zwei Klicks
entfernt auf *Heute* als `309,90 $` und `-0,14 %`, die Kopfzeile derselben Seite zeigt
`100.000,00 $`, und die Nachbar-Pille *Depot* benutzt `U.nf2` 33-mal. `bestandui.js` benutzt
keines der Hausmittel. Dazu fehlt die Tausendertrennung (`15483 $` statt `15.483 $`).
*Neu* sind die Spalte „seit Jahresbeginn" und die **gesamte Summenzeile** — also die
auffälligste Zahl; `Kurs`/`Wert`/`Heute` waren schon vorher so.

**Farblogik:** `pct >= 0 ? 'up' : 'muted'` — Gewinn grün, **alles andere** grau: der Verlust,
das fehlende Datum und in den Nachbarspalten auch „noch nicht geprüft". `-0,39 %` trägt damit
exakt dieselbe Farbe wie *„hier liegt nichts vor"*. Im Marktbild auf *Heute* sind dieselben
Werte rot; `--down` ist definiert und ungenutzt. *Neu:* vorher trug die Heute-Zelle gar keine
Klasse.

Belege: `bilder/papiere-1280-format-und-farbe.png` gegen
`bilder/heute-1280-dieselben-zahlen-deutsch.png`

---

## C — Schönheitsfehler (kein Issue)

1. **Zwei Spalten heißen „Wert".** Spalte 1 ist das Wertpapier, Spalte 4 der Geldwert der
   Position. In der Kopfzeile stehen sie als `WERT … WERT`. *Vorbestehend*, durch die
   gewachsene Tabelle aber auffälliger geworden.
2. **Uneinheitliche Nachkommastellen:** `Heute` zeigt zwei (`+2,19 %`), `seit Jahresbeginn`
   eine (`+14,3 %`). Beides sind Prozentangaben derselben Spaltengruppe. *Neu.*
3. **Der Rotationsblock `depot` gab nichts her.** Depot, Bücher und Protokoll sind in beiden
   Größen sauber, deutsch formatiert und haben erklärende Leerzustände („Die Kurve entsteht,
   sobald das Depot eine Weile läuft", „Noch keine Trades …"). Kein Fund — hier notiert, damit
   das geprüft und nicht übersprungen aussieht.

### Ein „unklar", ausdrücklich als solches

Die neue Spalte „seit Jahresbeginn" vergleicht den **unbereinigten** Live-Kurs
(`DepotAPI.letzterKurs`) gegen den **bereinigten** Vorjahresschluss (`bereinigt: true`).
Für Splits ist das genau richtig und ausdrücklich so gewollt — der Kommentar im Code sagt
warum. Für **Dividenden** liegt der bereinigte Vorjahresschluss aber unter dem tatsächlichen,
und die angezeigte Jahresrendite fiele dann um ungefähr die Dividendenrendite zu hoch aus.
Ob das gewollt ist (Gesamtrendite) oder nicht (Kursrendite), **kann ich nicht entscheiden** —
und Rechenwege sind nicht mein Ressort. Hier notiert für den Analytiker, kein Issue.

---

## Was ich bewusst nicht geprüft habe

- **Die Sperrliste.** Geklickt wurde ausschließlich Navigation — Reiter und Pillen. Kein
  `#kostenRundeBtn`, kein `#depotResetBtn`, kein Autopilot, kein `#stratEmpfohlenBtn`, kein
  Backtest-Lauf. Der Explorer-Absprung aus der Bestandstabelle wurde **gelesen, nicht
  ausgelöst**.
- **Das dunkle Thema** auf der Bestandstabelle. Geprüft wurde hell (das Saatgut setzt
  `theme = "light"`, um den Dunkel-Blitz-Fix zu belegen). `up`/`muted` sind in beiden Themen
  definiert, der B-2-Befund sollte also im dunklen genauso stehen — nachgemessen ist er nicht.
- **Tastaturreihenfolge und Kontrastwerte.** Gehören zum Rotationspunkt Barrierefreiheit.
  Die Teilprüfung „zugänglicher Name" lief mit: **0 Knöpfe ohne Namen** über alle Reiter.
- **Die Einwilligungsfrage** beim Erststart wurde mit einem echten Escape-Tastendruck
  weggeklickt, nicht beantwortet.

---

## Falschmeldungen, die die Probe erzeugt hat

Beides ausgeschlossen, bevor irgendetwas gemeldet wurde:

1. **Drei „unsichtbar bedienbare" Links im Laufband** (`left=1868…2605`). Das Band ist seit
   #90 `overflow-x: auto`; Links jenseits des Rahmens sind durch Schieben erreichbar. Der
   Prüfschritt kennt keine rollbaren Behälter — **Fehler meiner Probe, kein Fund.**
2. **Drei „unfertige Werte"** — das Wort *null* im Fließtext („Einmalig auf null gesetzt")
   und in einer Code-Vorschau. **Kein Fund.**

Und zwei, die es fast in den Befund geschafft hätten: Im ersten Durchlauf fehlte in jedem
Zellentext der Buchstabe **s** („Kur", „Micro oft", „Berk hire"). Das sah nach kaputter
Zeichenkodierung aus und war meine eigene Messung: `/\s+/` verlor beim Zusammenbau der
Zeichenkette eine Ebene Maskierung und wurde im Fenster zu `/s+/`. Ebenso lief der erste
Durchlauf ins Leere, weil der Reiter intern `depot` heißt und nicht `vermoegen` — die
Tabelle wurde ungezeigt gemessen (`breite=0`). Beides korrigiert, dann neu gemessen.

---

## Dateien

- `probe.js` — vertiefte Probe (gesätes Profil, 7 Messungen, Tabellenauszählung Zelle für
  Zelle, Laufband-Gegenprobe, Themenprüfung, 29 Bildschirmfotos in zwei Größen)
- `rohbefund-probe.json` — Rohausgabe
- `bilder/papiere-1000-umbruch.png` — Beleg zu B-1 (#93)
- `bilder/papiere-1280-format-und-farbe.png` — Beleg zu B-2 (#94)
- `bilder/heute-1280-dieselben-zahlen-deutsch.png` — Gegenbeleg zu B-2 (#94)

Die übrigen 26 Bildschirmfotos bleiben im Temp und verschwinden.

---

## Nachtrag: `main` ist während des Laufs weitergezogen

Bei Beginn stand `HEAD` auf `9652f97`, am Ende auf `3740aac` (neun fremde Commits, darunter
das Release **v8.33.3** und der vierte Lauf des Analytikers). Geprüft habe ich `9652f97`.

`git diff --name-only 9652f97..3740aac` berührt **keine** Oberflächen-Datei — weder
`bestandui.js` noch `index.html`. Die beiden Funde stehen also unverändert, und sie stecken
in der ausgelieferten v8.33.3.

**`ZULETZT.txt` steht auf `9652f97`**, nicht auf dem neueren `HEAD`: die neun Commits gehören
in die Änderungsmenge der nächsten Nacht, gesehen habe ich sie nicht.

## Nächster Rotationspunkt

Heute war **depot** dran. Als Nächstes ist **messung**.
