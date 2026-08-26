<!-- PM-STAND
letzter-bericht: 2026-08-26 09:30
gesehener-tag: v8.33.2
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 26.08.2026, 09:00 (Wilhelms Antworten eingetragen)

Ausgeliefert ist **v8.33.2** — unverändert seit gestern Abend. Der Quellstand ist
siebzehn Commits weiter; **neun Release-Notizen warten** auf die Wache. Nichts Ungepusht.

**Die Tests sind wieder grün** (PM geprüft 08:40: `eslint` + `test-channel` + `test-v6`
alle bestanden). Alle drei SOFORT-Aufträge des 08:10-Laufs sind in 17 Minuten erledigt
worden.

Die **Neumessung aller zwölf Strategien** läuft — 5 von 12 Protokollen geschrieben
(Stand 09:00). Sie hält den Arbeitsbaum schmutzig; das ist normal und der Grund, warum
das Release erst danach anlaufen kann.

**Wilhelm hat 09:00 geantwortet: 1a / 2a / 3a.** Alles Weitere unter „Aufträge" und
„Entschieden".

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A–E, E-Rest | Politur, Navigation, Reiter, Bausteinkasten, `depot.js` zerlegen | fertig |
| F (1) | Theme ohne Dunkel-Blitz | **fertig** (26.08.) |
| F (2) | Ein einziger Chart-Renderer | offen, GESPERRT (Entscheid Wilhelm) |
| F (3) | Barrierefreiheit | offen, hinter (2) |

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

### JETZT DRAN — Neumessung aller zwölf Strategien (PM zugeteilt 26.08. 08:40)

**Vollständig unblockiert.** Alle fünf Vorstufen sind repariert (#85–#88, #91), die
Maschine steht auf **1.2.0** mit `codeStand`. Das ist **ein langer Rechenlauf, kein
Umbau**. Danach tragen die Protokolle einen echten Stand statt „unbekannt" (26 alte
Protokolle stehen heute ohne Kennung da). **Erst danach neue Untersuchungen.**
Zugeteilt an **App-Codebase Master**.

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

**(2b) FREI — Warnhinweis vor `kapitulation`.** Die Regel steht seit heute auf
**nicht bestaetigt** (gemessen, traegt nicht) — schaerfer als alles, was hier bisher an
einer laufenden Regel stand. Wilhelm laesst sie waehlbar, will aber einen Warnhinweis
davor, nach dem Muster der ungeeichten Kanal-Guete (#80).
**Grenze, hart: nur Hinweis, kein Eingriff.** Die Auswahl bleibt, es wird nichts gesperrt
und nichts umgeschaltet. `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`
und die `window.confirm`-Gatter bleiben unberuehrt. Text aus dem Protokoll, nie aus Prosa.
Sinnvollerweise zusammen mit (1a) — dieselbe Stelle, und der Hinweis soll das richtige
Urteil zeigen.

**(3a) ZUGETEILT an Desingner (Wilhelm 26.08., Abruf) — Liste der betroffenen
Darstellungen fuer Stufe F (2).** Wilhelm entscheidet
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

### Wartet auf Wilhelm (nicht anfangen)

- **Stufe F (2), ein einziger Chart-Renderer** — neu hinzugekommen 26.08. 08:40. Der
  Master hat beim Ansehen festgestellt, dass die Zusammenlegung **nicht folgenfrei** ist:
  es braucht einen Entscheid, **welche Darstellungen wegfallen dürfen**. Das ist Wilhelms
  Entscheidung, nicht die einer Sitzung. Bis dahin **gesperrt**, auch Stufe F (3) dahinter.
  **26.08. (Abruf, Antwort 3a): Wilhelm entscheidet nach einer Liste.** Die Liste ist
  freigegeben und steht oben unter „Neu freigegeben“ (3a); der Entscheid selbst steht weiter aus.

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
- **rsi2seit-mcp V4: Bestätigungsmessung** — vorregistriert, wartet auf frische
  Handelstage (beide Archive enden am 24.08.).
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit) und bei
  Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Kleine Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-Filter
  Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.

### Hinweise des Tüftlers an alle (keine Aufträge)

- Das Feld `quelle` der **1d**-Archivdateien trägt ein falsches Etikett
  (`"yahoo v8 chart, range=730d interval=60m"`) — drin sind Tageskerzen ab 1986.
- Neuer Entwurfsfehler für `FEHLERTYPEN.md`: *Ein Querschnittsmerkmal, dessen Auswahl
  von Tag zu Tag beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss
  zeigen. Beharrlichkeit gegen die Zufallserwartung gehört vor die Vorregistrierung.*

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

- **App-Codebase Master** — hat die **Neumessung aller zwölf Strategien** genommen
  (26.08., vom PM zugeteilt). Langer Rechenlauf, KEIN Umbau — es wird kein Quelltext
  angefasst. Gemessen wird auf den bezeichneten Archiven (E:, 2.887 Werte 60m / 2.966
  täglich, zuletzt geschrieben heute 00:50) mit Maschine **1.2.0**.
  Neun Strategien laufen auf 60m, drei auf 1d. Die Protokolle bekommen das heutige
  Datum im Namen, **überschreiben also nichts** — die 26 alten bleiben als Archiv liegen.
  Zwischenstände melde ich hier.

  *(Zuletzt fertig davor, 26.08.: rote CI `d689e62`, #91 `e3998b1`, #90 `4276380`;
  davor #76, #84, #85, #83/#89, #86/#87/#88, Messmaschine versionieren, Stufe F (1).
  PM hat die doppelte Zeile 09:00 zusammengefasst.)*

> ### ⚠ SPERRE, solange die Neumessung läuft (PM, 26.08. 09:00)
> **Niemand fasst `studien/messmaschine/messmaschine.js` an, bis die zwölf Protokolle
> geschrieben sind.** Der Lauf lädt die Maschine je Strategie neu; eine Änderung
> mittendrin heißt, die ersten Strategien sind mit einem anderen `codeStand` gemessen
> als die letzten — genau der Vergleichbarkeitsfehler, den die Versionierung von gestern
> Nacht sichtbar machen soll. Das betrifft ausdrücklich den `ausstieg`-Schalter unten.

---

## Analytiker

- **26.08. (4. Lauf, ~09:00, außerplanmäßig)** — bewusst leicht während der Neumessung (Maschine nicht aufgerufen): die 6 vorliegenden 1.2.0-Protokolle unabhängig nachgerechnet — 17/17 Variantenurteile, delta80 und tage80 exakt bestätigt (#91 wirkt im Feld, alte Formel hätte z. B. 168 statt 224 gesagt), `codeStand 6a7d9e29db6f` einheitlich, alle 6 Protokoll-Placebos |t| ≤ 1,25; C und E unverändert bestanden; **1 Fund gemeldet (#92: `bestesUrteil`-Rangfolge kann `widerlegt` verdecken, `bestaetigt-aber-nullpunkt-verschoben` unrepräsentierbar — latent, aber (1a) macht die Zahl zur maßgeblichen Anzeige)**, Details in `studien/analytiker/2026-08-26-vierter-lauf/BEFUND.md`; nächste Nacht D über die vollständigen 12 frischen Protokolle, sonst F-Rotation Punkt 3 (Clusterung über Tage).

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
