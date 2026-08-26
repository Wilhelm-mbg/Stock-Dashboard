<!-- PM-STAND
letzter-bericht: 2026-08-26 11:40
gesehener-tag: v8.33.3
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 26.08.2026, 11:15

Ausgeliefert ist **v8.33.3** (Tag auf `b0a3020`, 09:04). Der Quellstand ist **drei
Commits weiter**, **zwei Release-Notizen** warten auf die Wache. Arbeitsbaum sauber,
nichts ungepusht, `npm test` **grün** (PM selbst gelaufen, 11:10).

**Die Neumessung ist fertig — und das ist die Nachricht des Tages.** Zwölf Protokolle
liegen, alle auf Maschine **1.2.0** und demselben `codeStand 6a7d9e29db6f` (PM hat alle
zwölf Dateien selbst gelesen, nicht den Bericht übernommen). Ergebnis:

| | Zahl |
|---|---|
| bestätigt | **0** |
| nicht bestätigt (gemessen, trägt nicht) | 2 — `kapitulation`, `winkelbestaetigt` |
| nicht entscheidbar (Lineal zu grob) | 9 |
| nicht messbar | 1 — `monatsende-kauf` |

**Die Auflösungswand über alle zwölf**, vom PM aus den Protokollen gezogen (die Tafel
zeigte bis 09:30 nur fünf Zeilen). Gelesen wird `bestesUrteil` und die **kleinste**
Aussicht über alle Varianten — sie ist die planungsrelevante:

| Strategie | Urteil | kleinste Aussicht (Handelstage) | alle Varianten |
|---|---|---|---|
| monatsende-kauf | nicht messbar | **187** | 187 |
| kapitulation | **nicht bestätigt** | **224** | 1.551 · 2.330 · **224** |
| rsi2seit-mcp | nicht entscheidbar | 1.070 | 1.437 · 1.476 · 1.156 · **1.070** · 1.079 |
| monatswende-breit | nicht entscheidbar | 3.803 | 3.942 · 3.803 |
| rsi2seit | nicht entscheidbar | 4.116 | 4.116 |
| t3-stundendrift | nicht entscheidbar | 12.655 | 294.710 · 12.655 |
| quartalsschub-betrag | nicht entscheidbar | 13.257 | 13.257 · 19.416 |
| t2-umsatzschock | nicht entscheidbar | 17.317 | 51.183 · 17.317 |
| momentum | nicht entscheidbar | 33.683 | 52.578 · 157.689 · 33.683 · 562.398 |
| t1-zwangsglattstellung | nicht entscheidbar | 34.691 | 34.691 |
| winkelbestaetigt | **nicht bestätigt** | — | (keine Aussicht ausgewiesen) |
| winkelgrad | nicht entscheidbar | — | (keine Aussicht ausgewiesen) |

**Sieben der zwölf liegen jenseits von 12.000 Handelstagen** — mehr als fünfzig Jahre
Börse. Sie sind mit diesem Datenbestand nicht entscheidbar, egal wie lange gewartet wird.
Nur drei liegen unter 1.500 Tagen, und die kürzeste von allen trägt das Urteil
*nicht messbar*.

**Vorsicht bei der kurzen Zahl:** eine kleine Aussicht heißt *entscheidbar*, nicht
*lohnend*. `kapitulation` steht mit 224 Tagen ganz vorn und ist zugleich eine der beiden,
die **gemessen wurden und nicht getragen haben**.

Der Zeitraum aller zwölf ist **26.09.2023 bis 24.08.2026** — nicht bis heute. Grund ist
der Archiv-Stillstand weiter unten; er macht die Messungen nicht falsch, gehört aber so
zitiert.

**(1a) und (2b) sind fertig** (`0b7f767`): Depot und Scoreboard zeigen jetzt dasselbe
Urteil, und vor `kapitulation` steht der Warnhinweis. Vom PM in `depot.js:767`
nachgesehen — dort steht `bestesUrteil`, nicht mehr das stärkste t.

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A–E, E-Rest | Politur, Navigation, Reiter, Bausteinkasten, `depot.js` zerlegen | fertig |
| F (1) | Theme ohne Dunkel-Blitz | **fertig** (26.08.) |
| F (2) | Ein einziger Chart-Renderer | **entschieden 26.08.: NEIN** — nur die Doppelung (B2) raeumen |
| F (3) | Barrierefreiheit | **frei** (die Sperre dahinter ist mit F (2) weggefallen) |

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

### ~~SOFORT — rote Tests~~ **Erledigt 26.08. 08:20** (`d689e62`)

Zwei Lanczos-Konstanten standen in Literatur-Schreibweise; JS speichert die letzte
Ziffer anders. Bitgleich ersetzt, **keine eslint-Ausnahme** für die Datei — die Regel
fängt echte Tippfehler, und dort stehen sechs lange Konstanten nebeneinander. Warum die
Zahlen jetzt anders aussehen als im Lehrbuch, steht als Kommentar daneben.
PM-Gegenprobe 08:40: `npm test` grün.

### ~~SOFORT — #91~~ **Erledigt 26.08. 08:25** (`e3998b1`)

`aussicht.tage80` rechnet jetzt gegen die Bonferroni-Schwelle. Gegenprobe: zwei Läufe
auf demselben Archiv, tests 1 → 7, tage80 **11 → 17**.
**Zwei Zahlen meiner Zuteilung waren falsch und sind korrigiert:** es sind **17** von 21
Protokollen mit mehr als einem Test (nicht 16), und in der Tabelle fehlte die Zeile für
5 Tests (49 %).
**Maschinenversion steht auf 1.2.0, nicht 1.1.0** — der Master ist bewusst von meiner
Zuteilung abgewichen und hat recht: bei gleichen Daten meldete 1.1.0 vor und nach dieser
Zeile bis zu 59 % andere `tage80`; genau diese Frage soll die Version beantworten. Die
Sperrklinke beim allerersten Anlass durchzuwinken wäre ihr erster Ausfall gewesen.
**Der PM übernimmt das.** Wilhelm kann es mit einer Zeile zurückdrehen, wenn er es
anders sieht; die Gegenmeinung steht im Code.

### ~~SOFORT — #90~~ **Erledigt 26.08. 08:27** (`4276380`)

Das News-Laufband ist bei reduzierter Bewegung jetzt schiebbar statt tot: **6 von 6**
Schlagzeilen erreichbar statt dauerhaft 3. Zusätzlich zur Auditor-Sonde gemessen, denn
`overflow: auto` heißt nur, dass ein Rollbalken erlaubt ist — nicht, dass er etwas
freigibt. Die Sonde des Auditors blieb unangetastet, sie ist der Beleg des Funds.

### ~~JETZT DRAN — Neumessung aller zwölf Strategien~~ **ERLEDIGT 26.08. 09:50** (`49a6278`)

**Zwölf Protokolle, null Bestätigungen.** Die Zahlen stehen oben unter „Stand". Der
Auftragstext bleibt als Beleg stehen, was beauftragt war.

**Vollständig unblockiert.** Alle fünf Vorstufen sind repariert (#85–#88, #91), die
Maschine steht auf **1.2.0** mit `codeStand`. Das ist **ein langer Rechenlauf, kein
Umbau**. Danach tragen die Protokolle einen echten Stand statt „unbekannt" (26 alte
Protokolle stehen heute ohne Kennung da). **Erst danach neue Untersuchungen.**
Zugeteilt an **App-Codebase Master**.

**Korrektur 26.08. (Master, vom PM nachgeprueft): „alle zwoelf" stimmte zufaellig,
die Zusammensetzung nicht.** Im Repo liegen 14 Dateien, davon sind **elf** Strategien —
`tageshilfen.js`, `test-tageshilfen.js` und `wertpapierart.js` sind Hilfen.
`wertpapierart.js` ist der Universumsfilter; die Maschine hat sie **von sich aus
verweigert** (Exit 3, kein Protokoll geschrieben) — die Sperrklinke gegen „Strategie ohne
Begruendung" hat im Feld gehalten, der Lauf ist unberuehrt.
**Die zwoelfte liegt gar nicht im Repo:** `monatsende-kauf.js` steht unter
`<Downloads>/Markt-Dashboard-Daten/strategien/` — das ist, was der Baukasten IN der App
schreibt. `main.js:708-709` kennt beide Orte ausdruecklich und sagt sogar, welcher welcher
ist; der Laeufer kannte nur einen. **Es sind also elf aus dem Repo + eine aus dem
Datenordner.** Ohne den Fund waeren es elf gewesen und niemandem aufgefallen, weil die
Zahl gestimmt haette. Vom Master selbst gefunden, vom PM in beiden Ordnern nachgesehen.

**Zwischenstand 09:15, vom PM aus den Dateien nachgezählt (nicht übernommen):**
5 von 12 geschrieben, ~5 Min. je Strategie. Alle fünf tragen **dieselbe** Maschine
(1.2.0) und **denselben `codeStand` `6a7d9e29db6f`** — die Sperre auf `messmaschine.js`
hält also nachweislich. Der Master prüft das am Ende über alle zwölf noch einmal selbst.

**Die erste Fassung dieser Tabelle war falsch und ist am 26.08. 09:30 ersetzt worden.**
Sie las je Protokoll die **erste Variante** statt `bestesUrteil` und zeigte nur deren
`tage80`. Der Master hat es bemerkt, der PM hat es in den Dateien nachgeprüft und
übernimmt seinen Vorschlag: **`bestesUrteil` und die kleinste Aussicht über alle
Varianten** — die kleinste ist die planungsrelevante.

| Strategie | `bestesUrteil` | kleinste Aussicht | alle Varianten (Tage) |
|---|---|---|---|
| kapitulation | **nicht-bestaetigt** | **224** | 1.551 · 2.330 · **224** |
| monatswende-breit | nicht-entscheidbar | 3.803 | 3.942 · 3.803 |
| rsi2seit | nicht-entscheidbar | 4.116 | 4.116 |
| quartalsschub-betrag | nicht-entscheidbar | 13.257 | 13.257 · 19.416 |
| momentum | nicht-entscheidbar | 33.683 | 52.578 · 157.689 · 33.683 · 562.398 |

Das ist die **Auflösungswand erstmals in Zahlen** — genau die Spalte, die bis gestern in
jedem Protokoll auf `null` stand (#86).

**Die eine Zahl, die heraussticht: 224 Tage** (kapitulation, dritte Variante). Knapp ein
Handelsjahr — die einzige Aussicht des bisherigen Laufs, die überhaupt in Reichweite
liegt. Am anderen Ende steht momentums vierte Variante mit **562.398 Tagen**, gut
zweitausend Jahre. Beides verschwindet, wenn man je Protokoll nur eine Variante zeigt.

**Sprachregelung, weil dieses Projekt genau daran schon einmal Geld verloren hat:**
„nicht entscheidbar" (*das Lineal ist zu grob*) ist **nicht** dasselbe wie
„nicht bestätigt" (*gemessen und nicht getragen*). In Berichten die Formulierung des
Protokolls verwenden — und `bestesUrteil` lesen, nicht die erste Variante.

**Für die Sitzung, die den `ausstieg`-Schalter baut:** der Name `ausstieg` ist im
Protokoll bereits belegt — er beschreibt dort, *wie* ausgestiegen wurde
(`{art: 'Zeit', mittlereKerzen: 26}`). Der neue Konfigurationsschalter darf damit nicht
kollidieren.

### ✅ Beide Archive stehen (Master, 26.08. 15:06 — PM gegengeprüft)

Rückstand **0 Handelstage**, jüngste Kerze **25.08.** Vom PM über je 400 zufällige
Reihen nachgezählt, nicht übernommen: `archiv60m` 399/400 auf dem 25.08., `archiv1d`
398/400. 60m umfasst 2.913 Reihen mit 14,78 Mio Kerzen. `npm test` Exit 0.

### ⚠ Richtigstellung des PM: **`rsi2seit-mcp` V4 ist NICHT „wieder messbar"**

Das habe ich um 11:15 selbst geschrieben und es war die Begründung für das SOFORT. Es
stimmt so nicht, und es ist besser, das hier zu korrigieren, als es sich festsetzen zu
lassen. Die Vorregistrierung
(`studien/vorregistrierung-2026-08-25-einstiegskonvention/ERGEBNIS-N.md`) sagt
ausdrücklich, was V4 braucht:

1. eine **eigene Vorregistrierung** mit `testfamilie`, die `rsi2seit` mitzählt — **gibt
   es nicht**,
2. eine **Werkzeugprobe**, die Stop-Strategien wirklich abdeckt — **gibt es nicht**,
3. **frische Bestätigungstage** — dazugekommen ist **genau einer** (der 25.08.).

„Die einzige unverbrauchte Hälfte ist die Zukunft" heißt: ein einzelner Handelstag ist
keine Bestätigungsmessung. **Wer V4 jetzt misst, verbraucht den Kandidaten, statt ihn zu
prüfen.** Dazu die Warnung aus derselben Datei: sein Intervall reicht von +0,018 bis
+0,117 Pp, die Kostenhürde liegt bei 0,10 — selbst im günstigsten Fall wäre die Kante
knapp.

**Was vom SOFORT bleibt, bleibt trotzdem richtig:** das Archiv stand zwei Tage still,
ohne dass es jemand gemerkt hätte, und die Stille ist repariert. Nur die Begründung „V4
wartet darauf" war meine, nicht die der Vorregistrierung.

### Nachträge zu #96, jetzt mit vollem Archiv (Master, PM übernimmt)

Die flache 20:00-Kerze ist **kein Einzelfall, sondern die Regel**: 147 von 152 Reihen
enden darauf, alle 147 flach mit Umsatz 0. Die übrigen fünf haben für den 25.08. keine
Daten. **Das Tagesarchiv ist nicht betroffen** — die Tageskerze zum 25.08. ist echt
(AAPL 25,8 Mio Umsatz gegen 34,7 Mio am Vortag). Eine Regel gehört deshalb
**ausschließlich** in den Stundenpfad.

*Korrektur an eigener Sache: der PM hatte die echten Nullumsatz-Kerzen mit „zusammen 43"
angegeben; 18+7+8+18+10 sind **61**. Die Einzelzahlen und der Schluss daraus stimmen.*

### #96 — die achte Stundenkerze am 25.08. (Master gemeldet, PM nachgemessen, **kein Auftrag**)

Der zuletzt geholte Handelstag bekommt eine **achte** Stundenkerze um 20:00 UTC mit
Umsatz 0 — Yahoos Platzhalter für den Sitzungsschluss, keine gehandelte Stunde.
**Vom PM in den Dateien nachgezählt**, nicht übernommen: AAPL und KO zeigen beide
`{4 Kerzen: 7 Tage, 7 Kerzen: 723 Tage, 8 Kerzen: 1 Tag}` — die Acht trifft **genau den
25.08.** Die Kerze ist flach: Hoch = Tief = Eröffnung = Schluss = der Schlusskurs von
19:30, Umsatz 0.

**Der Master hat den Filter NICHT angefasst und den Lauf nicht abgebrochen. Beides
richtig.** Seine Begründung hält der Nachprüfung stand: eine Regel „Umsatz 0 wegwerfen"
wäre zu weit. Allein bei AAPL gibt es **19** Kerzen mit Umsatz 0, und 18 davon sind
echte Handelsstunden mit richtiger Kursspanne.

**Ein Befund des PM beim Nachmessen, der zur Regel gehört** (Beitrag zu #96, *keine*
Anweisung, wie sie zu lauten hat):

| Bedingung | AAPL | KO | XOM | MSFT | SPY |
|---|---|---|---|---|---|
| Umsatz 0 **und** Hoch=Tief=Eröffnung=Schluss | 1 | 1 | 1 | 1 | 1 |
| Umsatz 0, aber mit Kursspanne (echte Stunde) | 18 | 7 | 8 | 18 | 10 |

Die flache Kerze ist über alle fünf Werte **immer genau `2026-08-25T20:00`**. Die
Zusatzbedingung *völlig flach* trennt den Platzhalter also sauber von 43 echten Kerzen,
die eine reine Umsatzregel mitgelöscht hätte. **Ob und wie gefiltert wird, bleibt eine
Entscheidung über die Archivregel** — sie gehört in eine Sitzung mit Begründung oder zum
Analytiker, nicht nebenbei erledigt.

**Warum es niemand größer machen soll:** die Kerze ist die letzte des Archivs; ein
Einstieg kann dort wegen der Haltedauer gar nicht liegen. Die zwölf Protokolle von heute
rechnen bis zum 24.08. und sind unberührt. Der nächste volle Lauf räumt sie weg — der
24.08. hat schon wieder sieben.

**Richtigstellung des Masters, damit sie sich nicht festsetzt:** SPY schien
zwischenzeitlich ganz zu fehlen. Er liegt im Unterordner `etf/` („Maßstab, nicht
Messobjekt"). Vom PM bestätigt — dort gefunden und aktuell.

### ⚠ AUFGEKLÄRT 26.08. 12:00 — das Archiv stand still, weil **niemand** es holt

**Die Diagnose des PM war in der Ursache falsch und ist hiermit richtiggestellt.** Ich
hatte geschrieben, „die Spiegelung lief und schrieb ohne neuen Inhalt". Der Master hat
nachgesehen, der PM hat es unabhängig geprüft:

**Es gibt keine gestörte Spiegelung — es gibt gar keine.** Kein npm-Skript, keine
Windows-Aufgabe (`schtasks` durchsucht: nichts), kein Aufrufer im Repo außer Doku und
Tests, keine Claude-Aufgabe. `tools/yahoo-60m-holen.js` ist ein **Handaufruf** und war es
immer.

**Der Lauf am 25.08. um 22:49 UTC war der Master selbst** — die Teilkerzen-Bereinigung
aus #85, drei Minuten vor Commit `4e36674`. Deshalb 2.887 frisch geschriebene Dateien mit
Inhalt vom 24.08.: geschrieben, aber nichts geholt. Die letzte echte Datenholung war am
**24.08. 17:27 UTC**, und genau dort endet das Archiv.

**Die Falle dahinter — Punkt 3 des Auftrags, wörtlich eingetreten:**

```
schon geholt: 2916 | ohne Daten: 347
dieser Lauf: 0, geschaetzt 0 Minuten
Nichts zu tun.
```

Das Werkzeug überspringt jeden Wert, den es schon hat; neue Kerzen holt nur
`--aktualisieren`. **Ein Lauf, der nichts dazulernt, ging mit Erfolg aus und schwieg.**

**Gebaut ist deshalb nicht der Lauf, sondern das Ende der Stille** (`ad4e6a8`,
`tools/archiv-wachhund.js`): beide Ausgänge melden jetzt das Alter der **jüngsten Kerze**
— nicht das Änderungsdatum der Datei, denn genau das war die Falle. Steht das Archiv
hinterher, nennt der Lauf den Befehl dagegen. Exit 1 bei Alarm, damit eine Aufgabe ihn
auswerten kann.

**Eine Entwurfsentscheidung, die hier festgehalten gehört:** maßgeblich ist der
**häufigste** jüngste Tag, nicht der späteste. Während der Reparatur waren 69 von 2.916
Werten aktuell — wer den spätesten nimmt, meldet „frisch", während 97 % stillstehen.
Ausgeführt geprüft mit 97 alten gegen 3 frische Reihen.

**Feiertage kennt er nicht und behauptet es auch nicht:** ein Tag Rückstand ist Warnung
mit Feiertagsvorbehalt, ab zwei Tagen Alarm. Ein Kalender wäre eine eigene Entscheidung.

**Punkt 4 des Auftrags ist beantwortet:** keine historisch falschen Kurse. Es fehlen
Tage, es stehen keine falschen drin. Messungen sind nicht umzuwerfen.

**Offen und Wilhelms Sache:** ob die Datenholung künftig **regelmäßig** läuft. Der Master
hat an Wilhelms Maschine nichts eingerichtet — richtig so. Siehe Frage (4) unten.

### ⚠ SOFORT — der Kursarchiv-Stillstand — **ZUGETEILT an App-Codebase Master, 26.08. 11:40**

*Der Master hat es von sich aus vorgeschlagen, der PM hat zugeteilt. Grenzen: reine
Datenbeschaffung, keine Handelslogik, keine Version. Liegt die Ursache ausserhalb des
Repos (Windows-Aufgabe, App-Funktion), wird gemeldet statt gebastelt. Kernstueck ist der
Waechter, nicht die Reparatur.*

**Steht seit 09:30 als Beobachtung auf der Tafel und hat sich seither nicht bewegt.**
Der PM hat es 11:10 in den Dateien nachgemessen, nicht aus der Tafel übernommen:

- `archiv1d`: `stand` = **24.08. 17:27 UTC**, letzte Tageskerze **24.08.** — seit über
  zwei Tagen unverändert.
- `archiv60m`: die Spiegelung **lief** am 25.08. 22:49 UTC und schrieb alle Dateien —
  letzte Kerze trotzdem **24.08. 16:30 UTC** (AAPL, MSFT, NVDA einzeln nachgesehen).

**Neu und wichtig:** unter den Claude-Aufgaben (`list_scheduled_tasks`) gibt es
**gar keine Spiegelungs-Aufgabe**. Der 22:49-Lauf kam von woanders her — von Hand, aus
der App oder aus einer Windows-Aufgabe. **Der PM weiß nicht, woher; er rät nicht.**
Das erklärt aber, warum niemandem etwas auffiel: es gibt keine Stelle, die es meldet.

**Was daran hängt:** die zwölf frischen Protokolle enden am 24.08. · `rsi2seit-mcp` V4
wartet auf frische Handelstage, die nicht kommen · jede weitere Messung misst dieselben
Daten wie gestern.

**Auftrag:** Ursache finden und beheben. Anfangen bei der Spiegelung, nicht am Archiv —
die Dateien wurden ja geschrieben, nur ohne neuen Inhalt. **Ein Lauf, der nichts
dazulernt und trotzdem alles neu schreibt, sieht von außen aus wie ein gesunder Lauf.**
Dazu gehört ein Wächter, der genau das meldet: schreibt der Lauf Dateien, deren jüngste
Kerze älter ist als der letzte abgeschlossene Handelstag, muss das laut werden.
**Reine Datenbeschaffung — Handelslogik wird nicht berührt.** Belegt keine Datei, an der
der Master sitzt.

### ~~FREI — #93 und #94~~ **ERLEDIGT 26.08. 11:35** (`a5641d3`, Master) — Bestandstabelle unter *Vermögen → Meine Papiere*

*Beides waren seine eigenen Regressionen aus `79a505b`. Vom PM gegengeprueft: Commit auf
origin, Baum sauber, npm test Exit 0. Der Nebenbefund steht weiter unten.*

Zwei Funde des Auditors aus dem 2. Lauf, **beide stecken in der ausgelieferten v8.33.3**:

- **#93** — Zahl und Einheit brechen bei 1000 px Fensterbreite auf zwei Zeilen
  (`309.90` und `$` untereinander). Regression aus dem Wachstum von sieben auf zehn
  Spalten.
- **#94** — englisches Zahlenformat statt deutschem, und Verluste stehen grau statt rot,
  während dieselben Werte auf *Heute* deutsch und rot erscheinen. Die Hausmittel
  `U.money` / `U.nf2` / `U.signCls` sind an dieser Stelle ungenutzt.

**Reine Anzeige, Reiter Vermögen.** #94 ist der unangenehmere von beiden: dieselbe Zahl
sieht an zwei Stellen der App verschieden aus. **Achtung:** das ist `depot.js` — dieselbe
Datei, in der der Master sitzt. Vorher mit ihm abstimmen oder er nimmt es mit.

### FREI — `ausstieg`-Schalter in der Messmaschine (Wilhelm 26.08. 09:00, Antwort 2a)

Auftragsvorschlag A des Tüftlers, **freigegeben**. Spiegelbild des vorhandenen
`einstieg`-Schalters: `ausstieg: 'schluss' | 'folgeEroeffnung'`. Ohne ihn ist vom
Kandidaten `glockendruck-nacht` nur das Tagbein messbar, nicht das Nachtbein.

**Zwei Bedingungen, beide hart:**

1. **Nicht auf `main` und nicht in der laufenden Datei.** Solange die Neumessung läuft
   (Sperre oben), wird auf einem eigenen Zweig entwickelt und **erst danach**
   zusammengeführt. Anfangen geht sofort — Wilhelms „jetzt" ist damit erfüllt, ohne den
   Rechenlauf zu vergiften.
2. **An allen drei Stellen zugleich** greifen: Signal, Kontrolltopf, Placebo. Nur den
   Signalpfad umzustellen heißt, zwei verschiedene Ausführungen zu vergleichen und den
   Unterschied Effekt zu nennen — der **C7**-Fehler, der hier schon aus t 5,96 ein
   t −0,75 gemacht hat. Testfall nach dem Muster von C6/C7.

Dazu: `eroeffnungKurs()` fällt heute beim Fehlen der Eröffnung still auf `bars[k−1][1]`
zurück. Für einen **Ausstieg** ist dieser Rückfall unzulässig — er setzt die Rendite
mechanisch auf die Schluss-Fassung und verdünnt jeden Unterschied gegen null. Das Signal
muss dann **ausgeworfen** werden.

### FREI — Auktionskosten am Demo-Konto messen (Wilhelm 26.08. 09:00, Antwort 3a)

Auftragsvorschlag B des Tüftlers, **freigegeben**. Die Kostentabelle (Aktie 0,04 · CFD
0,10 · Schein 0,23 Pp je Umlauf) beschreibt die **notierte Spanne**. Ein Übernacht-Handel
füllt aber in der **Schluss- und der Eröffnungsauktion**, und was eine Auktionsfüllung
wirklich kostet, ist hier nie gemessen worden. Die laufende Kostenmessung des Demo-Kontos
(seit 8.23.32) wird um Auktionsorders erweitert.

**Demo-Konto, kein echtes Geld** — Wilhelm hat das ausdrücklich freigegeben. Trotzdem
gilt die Klick-Sperrliste weiter: keine Order außerhalb der Kostenmessung.
Unabhängig von der Neumessung, kann sofort und parallel laufen.

### Neu freigegeben (Wilhelm 26.08., Abruf-Bericht — Antworten 1a / 2b / 3a)

**(1a) NACH DEM RECHENLAUF, VOR DER AUSLIEFERUNG — die Oberflaeche waehlt die falsche
Messvariante.** `kantenAusProtokollen()` in `depot.js` (rund Zeile 733) sucht unter mehreren
Varianten eines Protokolls die mit dem **staerksten Bestaetigungs-t** und zeigt deren
Urteil. Das Protokoll faellt sein Urteil aber selbst, in `bestesUrteil`. Bei
**Das erste Beispiel des PM (`kapitulation`) war falsch** — der Master hat es
nachgerechnet, der PM hat es unabhaengig ueber alle 26 Protokolle nachgeprueft und
bestaetigt. Bei `kapitulation-2026-08-26` (t = 1,51 / 1,19 / 2,14) IST die staerkste
Variante die, die `bestesUrteil` traegt; Anzeige und Protokoll sagen dasselbe.

**Betroffen ist genau ein Protokoll von 26 — und in der strengeren Richtung:**
`winkelbestaetigt-2026-08-25`, t = −0,96 / −1,34 / −1,54 / −1,58 / −2,11. Alle t sind
negativ, „staerkstes t“ heisst dort „am wenigsten negativ“, und das kippt die Auswahl:
die **Anzeige sagt „nicht entscheidbar“, wo das Protokoll „nicht bestaetigt“ sagt** —
sie behauptet Unwissen, wo gemessen wurde. Kein einziges der zwoelf frischen Protokolle
ist betroffen.

**Der tragende Grund ist deshalb ein anderer als der zuerst genannte** (Fund des
Masters, vom PM in `scoreboard.js` nachgesehen): `scoreboard.js` waehlt bereits ueber
`bestesUrteil` + `bestesErgebnis()`, `depot.js` ueber das staerkste t. **Zwei Stellen
derselben App zeigen fuer dasselbe Protokoll verschiedene Urteile** — unabhaengig davon,
welche Auswahl guenstiger aussieht.
**Regel: `bestesUrteil` gewinnt.** Wird ausserdem eine Zahl je Signal gezeigt, muss sie zu
der Variante gehoeren, die das Urteil traegt — nicht zur bestaussehenden.
Reine Anzeige — der Master hat die vier Lesestellen von `PROTOKOLL_KANTE` einzeln
nachgesehen, keine gatet etwas.
**Zur Reihenfolge — ENTSCHIEDEN 26.08.: erst ausliefern, dann (1a). Beides ist bereits
geschehen bzw. freigegeben:** `v8.33.3` ist draussen, (1a) und (2b) sind ab sofort dran.
Die urspruengliche Begruendung des PM war falsch (die zwoelf frischen Protokolle sind gar nicht betroffen, und
der Fehler steckt seit je in `v8.33.2` und steckt jetzt auch in `v8.33.3`). Der Vorschlag
kam vom Master, Wilhelm hat ihn angenommen.

**(2b) ~~FREI~~ ERLEDIGT 26.08. 09:50 (`0b7f767`) — Warnhinweis vor `kapitulation`.** Die Regel steht seit heute auf
**nicht bestaetigt** (gemessen, traegt nicht) — schaerfer als alles, was hier bisher an
einer laufenden Regel stand. Wilhelm laesst sie waehlbar, will aber einen Warnhinweis
davor, nach dem Muster der ungeeichten Kanal-Guete (#80).
**Grenze, hart: nur Hinweis, kein Eingriff.** Die Auswahl bleibt, es wird nichts gesperrt
und nichts umgeschaltet. `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`
und die `window.confirm`-Gatter bleiben unberuehrt. Text aus dem Protokoll, nie aus Prosa.
Sinnvollerweise zusammen mit (1a) — dieselbe Stelle, und der Hinweis soll das richtige
Urteil zeigen.

**(3a) ~~ZUGETEILT an Desingner~~ ERLEDIGT 26.08. 09:10 (`5084da0`) — Liste der
betroffenen Darstellungen fuer Stufe F (2).**
Liegt unter `studien/chart-darstellungen-2026-08-26/LISTE.md`. **Wilhelm ist am Zug.**
**Die Vorab-Zaehlung des PM war falsch, in beide Richtungen** — der Desingner hat durch
Lesen erhoben statt per Textsuche und es korrigiert, der PM hat die Korrekturen im Code
nachgeprueft und bestaetigt: `backtestui.js drawEquity` ist **kein** eigener Zeichner
(ein Einzeiler auf `Chart.drawLines`), dafuer fehlten `renderer.js sparkSVG` und
`depot.js renderEquity`. Sie tragen nicht das Namensmuster `draw*`/`zeichne*`, nach dem
der PM gesucht hatte. **Es sind sechs Zeichenwerke an zehn Stellen, nicht sieben.**
(Alte Fassung des Auftragstextes unten steht nur noch als Beleg, was beauftragt war.) Wilhelm entscheidet
ueber die Zusammenlegung der Chart-Renderer erst, wenn er sieht, **was wegfaellt**.
Auftrag ist die **Liste, kein Umbau**: je Darstellung eine Zeile in Anwendersprache — wo
sie vorkommt, was sie kann, was bei einer Zusammenlegung davon verloren ginge, und ob es
einen Ersatz gibt. Als Dokument unter `studien/`. Stufe F (2) und (3) bleiben bis zu
seinem Entscheid gesperrt.
**Der Bestand, vom PM vorab gezaehlt** (damit niemand bei null anfaengt): gezeichnet wird
ueberall in SVG, in sieben Funktionen — `chart.js drawLines`, `explorer.js drawBig` und
`drawAktuell`, `strategiechart.js drawStrategieChart` und `drawStrategieIndikator`,
`wendeui.js zeichneWendeChart`, `backtestui.js drawEquity`. Der Struktur-Plan nennt als
Kern `explorer.js drawBig` gegen `chart.js`; die anderen fuenf gehoeren in die Liste,
damit der Entscheid nicht spaeter an einer uebersehenen Darstellung haengt.
**Kein Code, keine Empfehlung fuer eine Variante** — nur die Aufstellung, damit Wilhelm
sieht, was ein Zusammenlegen kostet. Kollidiert mit niemandem: der Master sitzt in
`depot.js` und auf dem Rechenlauf.

### FREI — die doppelte Depotkurve raeumen (Wilhelm 26.08., Antwort b zu Stufe F (2))

**Stufe F (2) ist entschieden: NICHT zusammenlegen.** Die vier Spezial-Zeichner bleiben,
wie sie sind — namentlich der Explorer-Chart, dessen Verlustliste die laengste war.
Freigegeben ist **nur Befund B2** aus `studien/chart-darstellungen-2026-08-26/LISTE.md`.

**Was zu tun ist:** Auf *Vermoegen → Depot* stehen zwei Bilder **derselben Daten**
untereinander. Beide zeichnen `D.equityHist` — vom PM nachgesehen: `depot.js:3589`
(`renderEquity`, schlichte Flaeche mit drei Kopfzahlen) und `depot.js:3249`
(`drawEquity` → `Chart.drawLines`, mit Achsen, Startkapital-Linie und Maus-Hinweis).
**Das reichere Bild bleibt** (Nr. 7); die drei Kopfzahlen — Verlauf, Hoch, groesster
Ruecksetzer — **ziehen dorthin um**; die schlichte Flaeche faellt weg.

**Zwei Fallen, beide vom Desingner beim Lesen gefunden:**
1. Die Kopfzahlen rechnen ueber die **gesamte** Historie, die schlichte Flaeche zeigte nur
   die letzten 800 Punkte. Wer die Zahlen beim Umzug aus dem neu gezeichneten Bild
   herleitet statt aus `D.equityHist`, **aendert sie stillschweigend**. Sie muessen weiter
   ueber alles rechnen.
2. `renderEquity` blendet sich unter 5 Punkten ganz aus. Diese Regel gehoert mit umgezogen,
   sonst stehen bei frischem Depot drei Kennzahlen ohne Aussage da.

**Reine Anzeige, Reiter Vermoegen.** Handelslogik wird nicht beruehrt.
**Achtung Kollision:** das ist `depot.js`, dieselbe Datei, in der der Master (1a)+(2b)
macht. **Empfehlung des PM: der Master nimmt es hinterher gleich mit** — eine Sitzung,
eine Datei. Wer sonst zugreift, stimmt sich vorher mit ihm ab.

### Wartet auf Wilhelm (nicht anfangen)

- *(nichts offen — Stufe F (2) ist am 26.08. entschieden, siehe „Neu freigegeben" oben.)*

### ~~An die Release-Wache~~ **Erledigt 26.08. — `v8.33.3` ist ausgeliefert**

Wilhelm hat die Wache selbst gestartet. Tag `v8.33.3` auf `b0a3020`, `package.json` auf
8.33.3, **alle neun Notizen verbraucht** — `release-notizen/` ist leer. Vom PM in Git
nachgesehen, nicht bei der App erfragt.

**Eine Annahme dieses Abschnitts war falsch und gehoert richtiggestellt:** hier stand,
mit dem Release gingen „die zwoelf frischen Protokolle gleich mit raus". Das stimmt
nicht — Protokolle sind **gar nicht Teil des Pakets**. Die App liest sie zur Laufzeit aus
`<Downloads>/Markt-Dashboard-Daten/protokolle/` (`main.js:592`). Folgenlos, weil der Lauf
sie genau dorthin schreibt (26 Dateien, davon 7 von heute) — sie sind also in der App,
ohne dass ein Release noetig waere. Aber die Begruendung war Zufall, nicht Sachkenntnis.

Ebenfalls beobachtet: der Baum war beim Bauen **nicht** sauber (die Protokolle lagen als
unverfolgte Dateien da), und `tools/release.js` hat trotzdem gebaut. Seine Weigerung
zaehlt unverfolgte Dateien offenbar nicht mit. Diesmal harmlos; als Eigenschaft des
Werkzeugs sollte es jemand wissen, der sich auf die Weigerung verlaesst.

### Danach — schon freigegeben, Reihenfolge fest

- **#92 — Nachzuegler zu (1a), gefunden vom Analytiker im 4. Lauf.** (1a) macht
  `bestesUrteil` zur massgeblichen Anzeige — aber dessen eigene **Rangfolge** in
  `messmaschine.js:1214` kann ein `widerlegt` hinter einem freundlicheren Etikett
  verstecken, und `bestaetigt-aber-nullpunkt-verschoben` kommt darin gar nicht vor.
  **Heute latent:** ueber alle 32 Protokolle (76 Variantenurteile) tritt kein Fall auf,
  (1a) ist also nicht falsch und muss nicht warten. Aber der erste `widerlegt`-Lauf einer
  Mehrvarianten-Strategie verschwaende still. **Nicht waehrend der Neumessung anfassen**
  (Sperre auf `messmaschine.js`). Die Rangfolge selbst ist eine Entscheidung, keine
  Reparatur — sie gehoert Wilhelm oder einer Bausitzung mit Begruendung, nicht nebenbei.
- **`messen.js` Zeile 95 — Nachzügler zu #91.** Die Konsolenzeile sagt weiter
  *„bis t=2 mit 80 %"*, während die Rechnung längst gegen die Bonferroni-Schwelle geht.
  **Nur die Anzeige, nicht die Daten** — der PM hat es nachgesehen: die Protokolle
  tragen den richtigen Text („Tage bis zum URTEIL, nicht bis t=2"). Die zwölf Läufe
  müssen deshalb **nicht** wiederholt werden. Der Master zieht es nach seinem Lauf nach
  (mittendrin nicht, sonst haben die ersten fünf eine andere Konsolenausgabe als die
  letzten sieben). Gefunden vom Master selbst am eigenen Werk.
- **Großer Archiv-Ausbau:** Backfill 60m und täglich auf E:, Universum nach
  Wertpapierart verbreitern. Ausdrücklich NACH der Neumessung.
- **Stufe F (2) und (3)** — stehen jetzt oben unter „Wartet auf Wilhelm", nicht mehr hier.
- **Nachbilden-Dialog:** Belegstatus sichtbar im Dialog „Trade nachbilden" —
  Belegtexte aus den Protokollen (`DepotAPI.protokollKante`), nie aus Prosa.
- **Handel raus aus dem Renderer — NUR PLAN:** Umbauplan als Dokument unter `studien/`,
  kein Code. Gebaut wird erst nach Wilhelms zweitem Ja.
- **#80 Kanal-Güte neu eichen** (Studien-Strang). Bis dahin Warnhinweis „ungeeicht"
  an der Güte-Zahl.
- **rsi2seit-mcp V4: Bestätigungsmessung** — **NICHT anfangen.** Die Archive stehen zwar
  wieder (25.08.), aber es fehlen zwei von drei Voraussetzungen: eigene Vorregistrierung
  mit `testfamilie` und Werkzeugprobe für Stop-Strategien. Dazugekommen ist **ein**
  Handelstag. Siehe Richtigstellung oben.
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit) und bei
  Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Kleine Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-Filter
  Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.

### ⚠ Beobachtung des PM 26.08. — das Kursarchiv hat den 25.08. nicht (kein Auftrag, ungeklaerte Ursache)

Aufgefallen beim Abschluss-Durchgang, **nicht gemeldet worden**. Zwei harte Befunde:

- **`archiv60m`:** die Spiegelung **lief** am 25.08. um 22:49 UTC und schrieb alle 2.887
  Dateien — aber die **letzte Kerze ist vom 24.08.**, 16:30 UTC. Stichprobe ueber 40
  Dateien: **40 von 40 ohne den 25.08.** Der 25.08. war ein Handelstag (Dienstag), die
  US-Sitzung war um 20:00 UTC geschlossen, also fast drei Stunden vor dem Lauf.
- **`archiv1d`:** `stand` steht auf **24.08. 17:27 UTC** — seit ueber zwei Tagen nicht
  mehr angefasst. Letzte Tageskerze 24.08.

**Die Ursache kenne ich nicht** und rate nicht. Denkbar ist ein Lag der Quelle, eine
Regel „nur abgeschlossene Tage" oder ein stiller Abbruch — `teilkerzenEntfernt: 1` steht
in den Dateien, aber das erklaert das Fehlen eines **ganzen** Handelstags nicht.

**Was daran haengt, damit niemand ins Leere plant:**
1. **`rsi2seit-mcp` V4** steht auf der Liste unten und wartet auf frische Handelstage.
   Sie kommen derzeit nicht. Wer die Messung ansetzt, misst dieselben Daten wie beim
   letzten Mal.
2. Die **zwoelf Neumessungen von heute** laufen auf einem Archiv, das am 24.08. endet.
   Das macht sie **nicht falsch** — sie messen Geschichte — aber ihr `bis` ist 24.08.,
   nicht 26.08., und so gehoert es zitiert.

Wer das aufklaert, faengt bei der Spiegelung an, nicht am Archiv: die Dateien wurden ja
geschrieben, nur ohne neuen Inhalt. **Ein Lauf, der nichts dazulernt und trotzdem alles
neu schreibt, sieht von aussen aus wie ein gesunder Lauf** — das ist der Grund, warum es
zwei Tage niemandem auffiel.

### Hinweis an alle — „grün aus dem falschen Grund" (Master, 26.08., vom PM übernommen)

Zwei Muster aus einem einzigen Arbeitstag, beide betreffen **Prüfungen, nicht Code**:

1. **Textprüfungen werden vom eigenen Kommentar rot.** Viermal an einem Tag
   (`<style>`, `storeGet()`, `.eq-panel`, `toFixed`): die Prüfung verbietet einen
   Bezeichner, und der erklärende Kommentar daneben nennt ihn. Die Prüfungen rechnen
   Kommentare jetzt heraus. **Nie die Prüfung abschwächen** — auf Verwendung richten.

2. **Die gefährlichere Richtung: grün, obwohl abgestürzt.** Ein zu enger Grep ließ einen
   Absturz wie „bestanden" aussehen. Seither wird der **Exit-Code** geprüft, und die
   Eindeutigkeit der Endmarke ist selbst eine Zusicherung.

Das gehört zusammen mit dem Archiv-Fund von heute: **ein Lauf, der nichts dazulernt und
trotzdem alles neu schreibt, sieht von außen aus wie ein gesunder Lauf.** Dreimal
dieselbe Sorte Fehler — der Erfolgsnachweis prüft etwas anderes als das, was gelten soll.

### Nebenbefund zu #94, der über den Fehler hinausgeht

Die Klassen `up`/`muted` hießen in der entfallenen Signalliste *Signal / kein Signal* und
wurden beim Umzug in die Bestandstabelle **still zu *Gewinn / Verlust* umgedeutet**.
Umfärben hätte deshalb nicht gereicht — es sind zwei Bedeutungen, also zwei Klassen. Beim
Reparieren fielen **drei** Fälle auf, die vorher alle gleich grau waren: Verlust (jetzt
rot), genau null (jetzt neutral) und keine Angabe (bleibt grau — und heißt jetzt wirklich
nur das).

Ebenfalls festgehalten: die beiden Depotverlauf-Bilder hatten **keine einzige
Zusicherung**. Das erklärt, wie zwei Ansichten derselben Zahlen nebeneinander stehen
konnten, ohne dass der Widerspruch auffiel.

### Hinweise des Tüftlers an alle (keine Aufträge)

- Das Feld `quelle` der **1d**-Archivdateien trägt ein falsches Etikett
  (`"yahoo v8 chart, range=730d interval=60m"`) — drin sind Tageskerzen ab 1986.
- Neuer Entwurfsfehler für `FEHLERTYPEN.md`: *Ein Querschnittsmerkmal, dessen Auswahl
  von Tag zu Tag beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss
  zeigen. Beharrlichkeit gegen die Zufallserwartung gehört vor die Vorregistrierung.*

---

## Offene Fragen an Wilhelm (Stand 26.08. 11:15)

*Antworten genügen als Ziffernfolge, z. B. „1b 2a 3a".*

**(4) NEU und dringender als die anderen drei — soll das Kursarchiv künftig von selbst
nachladen?**
Heute um 12:00 hat sich herausgestellt: **niemand holt die Kurse.** Es gibt keine
gestörte Aufgabe — es gibt gar keine. Seit dem 24.08. ist das Archiv nur deshalb
stehengeblieben, weil das Holen ein Handaufruf ist und ihn zwei Tage lang niemand
gemacht hat. Der Master zieht gerade von Hand nach; ohne Entscheidung passiert dasselbe
in ein paar Tagen wieder.
- **(a)** Eine tägliche Aufgabe, die nach US-Schluss beide Archive nachlädt und den
  Wachhund auswertet. Einrichten musst du sie selbst — sie läuft auf deiner Maschine.
- **(b)** Nur der Wachhund läuft täglich und **meldet**, nachgeladen wird von Hand.
- **(c)** Alles von Hand lassen; du denkst selbst daran.
*Empfehlung: **a**.* (b) klingt vorsichtig, verlegt aber nur den Handgriff — und der ist
schon zweimal zwei Tage lang ausgeblieben. (c) ist genau der Zustand, der uns die zwei
Tage gekostet hat. Der Wachhund macht (a) sicher: er beendet sich bei Alarm mit einem
Fehler, die Aufgabe kann das auswerten.
**Nicht zu verwechseln mit dem Ausliefern** — das bleibt bei der Release-Wache und bei
dir. Hier geht es nur um Kursdaten.

**(1) Zwölf laufende Strategien, null Belege — was soll die App damit machen?**
Sieben von zwölf brauchen mehr als 12.000 weitere Handelstage, bis sich ihre Frage
überhaupt entscheiden lässt. Das ist keine Geduldsfrage mehr, das ist unerreichbar.
Trotzdem stehen sie alle gleichberechtigt zur Auswahl.
- **(a)** Alles lassen, wie es ist — nur die Aussicht als Zahl daneben anzeigen.
- **(b)** Aussicht anzeigen **und** die aussichtslosen sichtbar abtrennen: wer mehr als
  ~2.500 Handelstage (zehn Jahre) braucht, wandert in einen eigenen Abschnitt
  „nicht entscheidbar mit diesen Daten". Wählbar bleibt alles.
- **(c)** Aussichtslose ganz aus der Auswahl nehmen.
- **(d)** Umgekehrt herangehen: nicht die Anzeige ändern, sondern nur noch Kandidaten
  entwerfen, deren Aussicht **vor** der Messung unter 1.000 Tagen liegt — die Wand als
  Eintrittskarte statt als Nachbemerkung.
*Empfehlung: **b**, und **d** gleich dazu.* (b) kostet wenig und ist ehrlich, ohne dir
etwas wegzunehmen. (d) ist die eigentliche Lehre: der Tüftler prüft die Wand längst vorab
— dass sie auch für die zwölf Altbestände gilt, ist heute zum ersten Mal in Zahlen zu
sehen. **(c)** empfehle ich ausdrücklich nicht: „nicht entscheidbar" heißt nicht
„schlecht", sondern „wir wissen es nicht" — das wegzusperren wäre dieselbe Verwechslung,
die dieses Projekt schon einmal Geld gekostet hat.

**(2) #92 — die Rangfolge der Urteile. Sie gehört dir, nicht einer Bausitzung.**
Seit heute entscheidet `bestesUrteil`, was die App anzeigt (das war (1a)). Diese Zahl
wird aus mehreren Varianten gewählt — und in der jetzigen Rangfolge kann ein
**`widerlegt`** hinter einem freundlicher klingenden Urteil verschwinden. Ein
Variantenurteil (`bestaetigt-aber-nullpunkt-verschoben`) kommt in der Rangfolge gar nicht
vor. **Heute tritt der Fall in keinem der 32 Protokolle auf** — es ist Vorsorge, kein
Brand.
- **(a)** Das schärfste Urteil gewinnt immer: `widerlegt` schlägt alles andere.
- **(b)** Wie (a), aber zusätzlich sichtbar machen, dass die Varianten uneins sind.
- **(c)** Später entscheiden, wenn der Fall zum ersten Mal wirklich auftritt.
*Empfehlung: **a**.* Es ist die vorsichtige Richtung, und sie ist billig, solange kein
echter Fall existiert. (b) ist gut gemeint, aber eine neue Anzeige für einen Fall, den es
noch nie gab.

**(3) ~~Zwei Release-Notizen warten. Jetzt ausliefern oder sammeln?~~ ERLEDIGT 26.08. 11:56** — Wilhelm hat `package.json` selbst auf 8.33.4 gesetzt (`e323c8f`) und damit (a) gewählt; #93/#94 sind inzwischen ohnehin drin, es ist also faktisch (b) geworden. **Achtung: es gibt noch keinen Tag `v8.33.4` und fünf Notizen liegen unverbraucht** — der Release-Lauf ist entweder gerade unterwegs oder steckengeblieben. Frage nicht mehr beantworten.

*(alter Wortlaut:)*
Fertig und ungeliefert: das gemeinsame Urteil in Depot und Scoreboard, der Warnhinweis
vor `kapitulation`, die zwölf Neumessungen. In v8.33.3 stecken außerdem zwei frische
Anzeigefehler (#93/#94), die noch niemand repariert hat.
- **(a)** Jetzt ausliefern — du startest die Wache selbst.
- **(b)** Warten, bis #93/#94 mit drin sind (Aufwand: eine kurze Sitzung).
*Empfehlung: **b**.* Anders als heute früh drängt nichts: die zwölf Protokolle liegen
schon in deinem Datenordner und sind in der App sichtbar, **ganz ohne Release** — die
App liest sie zur Laufzeit. Was ein Release brächte, ist die Anzeige-Korrektur; die wäre
mit #93/#94 zusammen runder.

---

## Tüftler

*Eine Zeile, vom Strategie-Tüftler selbst gepflegt. Übergabe läuft über
`studien/tueftler/WARTESCHLANGE.md`, nicht über diese Tafel.*

- **26.08.2026, 08:48 — Nacht-Typ A (Entwurf).** Warteschlange bei Beginn 1 offener
  Entwurf, kein Stau. Entstanden: zweiter vorregistrierter Kandidat **`nachtstoss-umkehr`**
  (`studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/`), zwei selbst verworfene
  Fassungen, zwei Zählwerkzeuge — **und ein Konstruktionsfund an der eigenen
  Schwesterstudie**: `glockendruck-nacht` teilt den Kurs `Schluss(i)` mit seiner Zielgröße,
  die Spannen-Umkehr zeigt in die behauptete Richtung. Gezählt: 6,4 % der ausgewählten Tage
  schließen exakt auf dem Tagestief. Folge — dortige **JA-Seite hält, NEIN-Seite nicht**
  (0,0005 Pp Marge zur Aktienhürde). Vorregistrierung unverändert, datierter Nachtrag
  daneben. Der neue Kandidat hat **disjunkte Kurse und keinen C8-Vorgriff** bei gleicher
  Auflösung (`delta80` 0,0396 gegen 0,0397 Pp), Überschneidung der Auswahlen 0,190 bei
  0,198 Zufallserwartung → unabhängiger zweiter Schuss. **Kein neuer Auftragsvorschlag**:
  gleiche Vorbedingung (`ausstieg`-Schalter) wie Entwurf 1. Familien-Testzahl offen
  ausgewiesen (4 Tests → `delta80` 0,0429, über der Aktienhürde; NEIN gilt studienweise).
  0 von 5 Firecrawl-Suchen verbraucht — das Dossier vom selben Tag deckt die Frage ab.
  **Warteschlange jetzt: 2 offene Entwürfe** (Stau ab 3).
- *(26.08.2026, 23:25/02:36 — Nacht-Typ A: `glockendruck-nacht` vorregistriert, erster
  Kandidat selbst verworfen, Literatur-Dossier.)*

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

- **App-Codebase Master** — **Kursarchiv erledigt.** Beide Archive stehen auf dem
  25.08., Rückstand **0 Handelstage, 100 % der Reihen** (Wachhund Exit 0). 60m: 2.913
  Reihen, 14,78 Mio Kerzen, 3 ohne Daten. Tagesarchiv danach, 15:06 fertig.
  **Befund: es gab nie eine Spiegelung** — kein Skript, keine Windows-Aufgabe, kein
  Aufrufer im Repo. Der Lauf, der alle 2.887 Dateien schrieb, war meine #85-Bereinigung.
  Die Falle war die Stille: ohne den Aktualisieren-Schalter meldet das Werkzeug
  „Nichts zu tun" und geht mit Erfolg aus. Repariert ist die Stille (ad4e6a8), nicht
  der Lauf.
  **Offen als ENTSCHEIDUNG, nicht als Reparatur: #96** — Yahoo hängt jeder Stundenreihe
  eine flache 20:00-Kerze mit Umsatz 0 an (147 von 147 in der Stichprobe). Das
  Tagesarchiv ist nicht betroffen (echte Umsätze). Filterregel bewusst NICHT gebaut:
  61 echte Nullumsatz-Stunden liegen am Schluss verkürzter Sitzungen und würden von
  einer zu weiten Regel gelöscht.
  Frei für den nächsten Auftrag.

*(Die zweite Master-Zeile zur Neumessung ist am 26.08. 11:40 entfallen — der Lauf ist
fertig, siehe „Stand" oben.)*

> ### ✅ SPERRE AUFGEHOBEN — die Neumessung ist fertig (PM, 26.08. 11:15)
> Die Sperre auf `studien/messmaschine/messmaschine.js` galt nur, solange gemessen wurde.
> Alle zwölf Protokolle liegen; der PM hat in jeder Datei nachgesehen, dass sie **denselben**
> `codeStand 6a7d9e29db6f` und dieselbe Version **1.2.0** trägt — die Sperre hat belegbar
> gehalten. **Damit ist der `ausstieg`-Schalter frei** (Wilhelm hatte ihn 09:00 mit 2a
> freigegeben, er hing nur an dieser Sperre). Die zweite Bedingung bleibt bestehen: an allen
> drei Stellen zugleich — Signal, Kontrolltopf, Placebo. Ebenso frei: **#92** und die
> Konsolenzeile `messen.js:95`.

---

## Analytiker

- **26.08. (4. Lauf, ~09:00, außerplanmäßig)** — bewusst leicht während der Neumessung (Maschine nicht aufgerufen): die 6 vorliegenden 1.2.0-Protokolle unabhängig nachgerechnet — 17/17 Variantenurteile, delta80 und tage80 exakt bestätigt (#91 wirkt im Feld, alte Formel hätte z. B. 168 statt 224 gesagt), `codeStand 6a7d9e29db6f` einheitlich, alle 6 Protokoll-Placebos |t| ≤ 1,25; C und E unverändert bestanden; **1 Fund gemeldet (#92: `bestesUrteil`-Rangfolge kann `widerlegt` verdecken, `bestaetigt-aber-nullpunkt-verschoben` unrepräsentierbar — latent, aber (1a) macht die Zahl zur maßgeblichen Anzeige)**, Details in `studien/analytiker/2026-08-26-vierter-lauf/BEFUND.md`; nächste Nacht D über die vollständigen 12 frischen Protokolle, sonst F-Rotation Punkt 3 (Clusterung über Tage).

---

## Auditor

*Die Qualitätssicherung der **Oberfläche**: startet die App isoliert, klickt jeden Reiter
und jede Pille, sieht sich die Bildschirmfotos an und meldet, was funktional kaputt (A)
oder optisch entstellt (B) ist. Schwerpunkt sind die Flächen aus der Änderungsmenge seit
dem letzten Lauf, dazu ein Rotationsblock. Repariert wird nichts — das tut eine Bausitzung.*

- **26.08. (2. Lauf, ~09:00)** — geprüft `a502c99..9652f97` (29 Commits; Schwerpunkt: die von sieben auf zehn Spalten gewachsene Bestandstabelle unter Vermögen → Meine Papiere, #83/#89), Rotationsblock `depot`. `npm test` **grün**, `ui-probe` **grün**, 0 unbehandelte Fehler. Erstmals mit **gesätem Testprofil** — der erste Lauf sah genau diese Tabelle nur leer. **0 A**, **2 B** (**#93** Zahl und Einheit brechen bei 1000 px auf zwei Zeilen, `309.90` und `$` untereinander — Regression aus dem Spaltenwachstum; **#94** englisches Zahlenformat statt deutschem und graue statt rote Verluste, während dieselben Werte auf *Heute* deutsch und rot stehen — `U.money`/`U.nf2`/`U.signCls` ungenutzt), **3 C** im Befund. Zwei eigene Funde gegengeprüft und **erledigt**: #90 (Laufband jetzt schiebbar, alle 6 Links erreichbar) und der Dunkel-Blitz (Stufe F Punkt 1, `thema.js` greift). Beide B-Funde stecken in der ausgelieferten **v8.33.3**. Details in `studien/auditor/2026-08-26-lauf2/BEFUND.md`. Nächster Rotationspunkt: **messung**.
---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **26.08.2026 (Abruf-Bericht, von Wilhelm von Hand gestartet) — „1a 2b 3a“**
  (1) *Die Oberflaeche zeigt unter mehreren Messvarianten die bestaussehende statt das
  Urteil des Protokolls — wann reparieren?* → **(a) kleiner Auftrag direkt nach dem
  Rechenlauf, vor der Auslieferung.** So empfohlen; die Alternative waere gewesen, ihn
  parallel auf eigenem Zweig zu bauen (b) oder hinten anzustellen (c).
  (2) *`kapitulation` steht jetzt auf „nicht bestaetigt“ und ist im Autopilot weiter
  waehlbar — was tun?* → **(b) waehlbar lassen, aber Warnhinweis davor.** Nicht (c) aus
  der Auswahl nehmen, nicht (a) unveraendert lassen. Der PM hatte (b) empfohlen.
  (3) *Stufe F (2), ein einziger Chart-Renderer — wie entscheiden?* → **(a) erst eine
  Liste der betroffenen Darstellungen, dann der Entscheid.** Nicht (b) folgenfrei
  zusammenlegen, nicht (c) streichen. **Der Entscheid selbst steht damit weiter aus**;
  Stufe F (2) und (3) bleiben gesperrt.
  Umsetzung aller drei siehe „Neu freigegeben“ oben.
  **Nachtrag, gleiche Sitzung:** (3a) geht an den **Desingner** — Wilhelms Vorschlag, vom
  PM uebernommen: die Frage „was ginge verloren“ ist eine Gestaltungsfrage, und die
  Sitzung kollidiert mit niemandem.
  **Nachtrag 3, Stufe F (2) — der Entscheid selbst, nach Vorlage der Liste:**
  *Ein einziger Chart-Zeichner — zusammenlegen oder nicht?* → **(b) nur die Doppelung
  raeumen.** Nicht (a) alles lassen, nicht (c) zusaetzlich die Mini-Kurven einschmelzen,
  **nicht (d) voll zusammenlegen.** Der PM hatte (b) empfohlen, mit (c) als naechstem
  Schritt und einer ausdruecklichen Warnung vor (d): der Explorer-Chart ist Wilhelms
  bestes Werkzeug, und (d) haette ihn fuer Pflegeleichtigkeit riskiert, die einem
  Auftraggeber nichts einbringt.
  **Folge, vom PM abgeleitet und hiermit vorgelegt:** damit ist **Stufe F (3)
  (Barrierefreiheit) nicht mehr gesperrt** — sie hing nur hinter F (2). Sie steht jetzt
  als frei in der Stufentabelle. Wilhelm kann das mit einer Zeile zurueckdrehen.
  Umsetzung siehe „FREI — die doppelte Depotkurve raeumen" oben.

  **Nachtrag 2, Reihenfolge:** *(1a) vor oder nach der Auslieferung?* → **(b) erst
  ausliefern, dann (1a).** Wilhelm: „b, es ist bereits geschehen" — die Wache war zu dem
  Zeitpunkt schon gelaufen, `v8.33.3` ist draussen. Der PM hatte (b) empfohlen, nachdem
  seine eigene Begruendung fuer (a) sich als falsch erwiesen hatte; der Vorschlag kam
  urspruenglich vom Master.
  **Ebenfalls Nachtrag:** das erste Beispiel des PM zu (1a) war falsch (`kapitulation` ist
  nicht betroffen). Vom Master gefunden, vom PM ueber alle 26 Protokolle nachgeprueft.
  Der Fehler bleibt echt, betrifft aber genau `winkelbestaetigt-2026-08-25`. **Damit steht
  Wilhelms Reihenfolge „vor der Auslieferung“ auf einer hinfaelligen Begruendung und
  wurde ihm erneut vorgelegt.**

- **26.08.2026, 09:00 (drei Antworten auf den 08:10-Bericht) — „1a 2a 3a los!"**
  (1) *Release jetzt oder nach den Reparaturen bündeln?* → **(a) sofort ausliefern.**
  Der PM hatte (b) empfohlen (eine Stunde warten, alles zusammen); Wilhelm will es jetzt.
  Umsetzung siehe „An die Release-Wache" oben — der Rechenlauf hält den Arbeitsbaum
  gerade schmutzig, deshalb ist der Startschuss der erste saubere Baum danach.
  Die Wache startet **Wilhelm selbst** („nur von Hand"), keine Sitzung und nicht der PM.
  (2) *`ausstieg`-Schalter jetzt bauen?* → **(a) ja, jetzt, parallel.** Auf eigenem
  Zweig, weil die Neumessung dieselbe Datei liest.
  (3) *Auktionskosten am Demo-Konto messen?* → **(a) ja.**

- **26.08.2026, 01:40 — Release jetzt.** → **(a) Jetzt ausliefern.**
  Nicht ausgeführt, weil die Wache nur von Hand läuft. Am 26.08. 09:00 bestätigt und
  erneuert (siehe oben).

- **26.08.2026, ~01:45 — die Issue-Wache ist zurück, aber als TRIAGE.** Sie war
  unbemerkt aus der Aufgabenliste verschwunden (mindestens zum zweiten Mal); #83 und #89
  lagen deshalb über vier Stunden unbeachtet. Wilhelm wollte sie in der Cloud neu anlegen
  und an „neues Issue" binden. **Das ist nicht baubar:** die Schnittstelle verlangt eine
  Cloud-Umgebung (`ccr.environment_id`), die an das Repo gebunden ist; auf diesem Rechner
  ist keine hinterlegt, und einrichten kann sie nur Wilhelm selbst. Er hat entschieden,
  **das vorerst zu lassen**. Stattdessen läuft sie wieder **lokal alle 30 Minuten**.
  Sie **baut nichts und liefert nichts aus**: sie sichtet, ordnet ein, antwortet
  freundlich auf Deutsch und lässt Issues offen; schließen darf sie nur nachweislich
  Erledigtes und exakte Doppel. Sie schreibt auch **nicht** auf diese Tafel.
- **26.08.2026, ~01:45** — Neue Aufgabe **`projekt-manager-abruf`**, „nur von Hand".
  Damit kann Wilhelm einen Projektstand abrufen, wann er will. Sie berichtet nur und
  schreibt die Tafel nicht neu — Ausnahme: trifft Wilhelm dabei eine Entscheidung,
  trägt sie diese unter „Entschieden" ein und gibt sie weiter.
- **26.08.2026, ~01:15** — *#83 und #89 widersprachen sich: bleibt unter „Heute" etwas von
  „Meine Papiere" stehen?* → **(b) Unter „Heute" verschwindet der Abschnitt ganz.** Damit
  gilt #89 vor #83. Der PM hatte (a) empfohlen; Wilhelm hat anders entschieden.
  **Folge, mitentschieden:** das überschreibt Felix' Wunsch #71 („Signalstand prominent
  auf Heute") — der Signalstand zog deshalb in die Vermögen-Tabelle um.
- **26.08.2026, 00:45 (drei Antworten)** —
  (1) *Wohin mit #83/#89?* → **sofort erledigen**, nicht hinter die Neumessung stellen.
  (2) *Die „belegt"-Formel in 21 Quellcode-Kommentaren?* → **alle 21 umschreiben.** Der
  PM hatte „stehen lassen" empfohlen; Wilhelm hat anders entschieden.
  (3) *Neumessung: alle vier Vorstufen abwarten oder früher starten?* → **alle vier
  (#85–#88) zuerst.** Erst wenn die Instrumente stimmen, wird gemessen.
- **25.08.2026 (spät)** — Geheimnis `TELEMETRIE_JSON` angelegt; #76 vollständig erledigt.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026 (spät)** — Messmaschine wird versioniert, alle zwölf Strategien werden auf
  dem aktuellen Stand neu gemessen; erst danach neue Untersuchungen.
- **25.08.2026 (spät)** — Neue Rolle **Strategie-Tüftler**: jede Nacht 04:30; bei
  ≥3 wartenden Entwürfen arbeitet er stattdessen am Datenbestand. Misst NIE selbst.
  Übergabe über `studien/tueftler/WARTESCHLANGE.md`.
- **25.08.2026 (spät)** — Neue Rolle **Analytiker**: jede Nacht 03:15, prüft alles,
  meldet per Issue nur bei Fund, sonst eine Zeile hier auf der Tafel.
- **25.08.2026 (abends, 9 Antworten)** — E-Rest: ja. Stufe F: alle drei, Reihenfolge
  Theme → Chart → Barrierefreiheit. Nachbilden-Dialog: Belegstatus rein.
  Handel-aus-Renderer: erst Plan, Bau nur mit zweitem Ja. #80: neu eichen, solange
  Warnhinweis. V4: vorregistrieren. Browser-Zweig: prüfen und einbauen.
  #71/#78/#81: geschlossen. Wünsche: #69 → #82 → #70 → #33.
- **25.08.2026** — Der Projekt-Manager darf Unstrittiges selbst zuteilen; alles, was die
  Handelslogik berührt, neu ist oder Geld kostet, wird vorgelegt.
