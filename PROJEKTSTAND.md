<!-- PM-STAND
letzter-bericht: 2026-08-26 18:05
gesehener-tag: v8.33.5
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
| monatsende-kauf | nicht messbar | **187** ⚠ | 187 — **entwertet, siehe Warnkanal unten** |
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

**FÜNF der zwölf liegen jenseits von 12.000 Handelstagen (zwei weitere haben GAR KEINE Aussicht — sie zeigen in die Gegenrichtung)** — mehr als fünfzig Jahre
Börse. Sie sind mit diesem Datenbestand nicht entscheidbar, egal wie lange gewartet wird.
Nur drei liegen unter 1.500 Tagen, und die kürzeste von allen trägt das Urteil
*nicht messbar*.

**Vorsicht bei der kurzen Zahl:** eine kleine Aussicht heißt *entscheidbar*, nicht
*lohnend*. `kapitulation` steht mit 224 Tagen ganz vorn und ist zugleich eine der beiden,
die **gemessen wurden und nicht getragen haben**.

Der Zeitraum ist **für neun der zwölf 26.09.2023 bis 24.08.2026** (60m-Archiv) — nicht
bis heute; Grund ist der Archiv-Stillstand weiter unten. **Die drei Tagesarchiv-Protokolle
(momentum, monatswende-breit, quartalsschub-betrag) laufen dagegen ab 25.08.1986 über
10.076 Handelstage** — Faktor 14 im Datenbestand. *(Richtigstellung 26.08. abends nach
QS-Prüfung: hier stand „aller zwölf", das war für die drei falsch; der große Plan hat
immer richtig gerechnet.)*

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

### 🔄 Neuer Arbeitsablauf ab 26.08.2026 — jede Rolle übergibt, keine schaltet sich stumm ab

**Wilhelms Anordnung, 26.08.:** *„alle tasks so anpassen, dass sie einen report geben,
sobald sie fertig sind … dann 10 Min auf Bereitschaft bleiben … damit nichts mehr liegen
bleibt oder wer auf seine Anweisungen warten muss."* Umgesetzt vom PM in allen neun
Rollen.

**Was jede Rolle jetzt am Ende tut:**

1. **Übergabe schreiben** nach
   `<Downloads>/Markt-Dashboard-Daten/uebergabe/<rolle>-<datum-uhrzeit>.md` — mit dem Kopf
   `ERREICHBAR-BIS: <HH:MM>` und fünf Punkten. **Punkt 4 ist der tragende: „Was jemand
   anders übernehmen müsste", mit Datei und Zeile.**
2. **Zehn Minuten Bereitschaft** über ein Hintergrundkommando (`sleep 600`). Die Sitzung
   endet nicht sofort und kann in dieser Zeit angesprochen werden — Rückfrage oder
   gleich der nächste Auftrag. Ein Auftrag, der länger dauert, wird trotzdem zu Ende
   gebracht; zehn Minuten sind ein Mindestmaß, keine Obergrenze.

**Was der PM jetzt zuerst tut:** den Übergabe-Ordner lesen, verteilen, das Bleibende auf
diese Tafel übertragen, die Datei wegräumen. **Fehlt die Übergabe einer Rolle, die laut
Zeitplan gelaufen ist, gilt das selbst als Warnsignal** — eine Rolle, die schweigt, ist
der Zustand, den dieses Projekt am teuersten bezahlt hat.

**Warum Datei und nicht einfach eine Nachricht — gemessen, nicht vermutet:**
Sitzungsnamen werden **zufällig** vergeben (`markt-dashboard-xy`) und kommen mehrfach
vor; in der Liste standen heute 58 Einträge, elf Namen doppelt. Es gibt also keine feste
Adresse, unter der der PM erreichbar wäre — und er läuft selbst nur sechsmal täglich,
**nachts nie**. Eine Nachricht an ihn bliebe liegen, bis er das nächste Mal etwas tut.
**Die Datei trägt immer, die Bereitschaft ist die Abkürzung für den Fall, dass er wach
ist.** Dass ein Hintergrundkommando die Sitzung wirklich offenhält, hat der PM an sich
selbst geprüft, nicht angenommen.

**Nachtrag 26.08. 17:20 — der Weg über sprechende Namen ist geprüft und zu.**
Wilhelm fragte, ob die Rollen einander nicht an den Namen aus seiner Seitenleiste
erkennen können. **Es gibt zwei getrennte Listen, und sie hängen nicht zusammen:**

| Liste | zeigt | taugt zum Senden? |
|---|---|---|
| `ListAgents` (Adressen für `SendMessage`) | 59 Einträge, fast alle `markt-dashboard-xy` | **ja**, auch aus Aufgaben heraus |
| CCD-Sitzungsverwaltung (`list_sessions`) | dieselben Sitzungen **mit Titeln** — „Auditor", „Issue wache", „Archiv nachladen" — samt „läuft gerade" | **nein**: `ccd send_message` ist für geplante Aufgaben ausdrücklich gesperrt, in beide Richtungen |

**Getestet, nicht vermutet:** Der PM hat sich per `set_session_title` in „Projekt-Manager"
umbenannt; der Master hat danach in `ListAgents` nachgesehen — **unverändert
`markt-dashboard-ea`**. Ein Titel im laufenden Betrieb schlägt nicht durch.
*Zwei Einschränkungen, vom Master selbst benannt:* geschaut wurde wenige Minuten danach,
ein Durchschlagen erst beim nächsten Start ist damit nicht ausgeschlossen. Und es gibt
einen unerklärten Gegenbeleg — `Desingner` und `App-Codebase Master` stehen sprechend in
der Liste, **ohne** je `set_session_title` gerufen zu haben. Es gibt also einen Weg,
sprechende Namen dorthin zu bekommen; das Umbenennen zur Laufzeit ist es nicht.

**Was daraus gebaut wurde, statt zu raten:** Der Übergabe-Kopf trägt jetzt drei Zeilen —
`ROLLE`, `GESTARTET`, `ERREICHBAR-BIS`. `ListAgents` nennt zwar keine Namen, aber **wie
lange jede Sitzung schon läuft**. Der PM vergleicht das mit `GESTARTET` und weiß, welcher
Eintrag die Rolle ist. Passt keine Laufzeit eindeutig, **lässt er es** — eine Nachricht an
die falsche Sitzung ist schlimmer als keine. (Elf Namen kommen ohnehin doppelt vor; auch
sprechende Namen lösten das nicht, sobald zwei Läufe derselben Rolle gleichzeitig liefen.)

**Die ehrliche Lücke, damit niemand mehr erwartet als drinsteckt:** Die vier nächtlichen
Rollen (Auditor 01:00, Analytiker 03:15, Tüftler 04:30, Archiv-Nachladen bis ~01:35)
enden zu Zeiten, zu denen **kein PM läuft**. Ihre Bereitschaft läuft dort ins Leere; es
trägt allein die Übergabe-Datei, die der PM um 08:00 liest. **Das ist kein Fehler des
Aufbaus, sondern eine Frage des Zeitplans** — siehe Frage (5) an Wilhelm.

**Nachtrag 26.08. 19:45 — der PM ist jetzt ein fester Chat, und Chat-Sitzungen gehen in
Dauerbereitschaft (Wilhelms Anordnung).** Zwei Änderungen:

1. **Der PM steht in `ListAgents` als „Projekt-Manager"** — von außen gemessen, nicht
   angenommen. Übergaben gehen zusätzlich per `SendMessage` dorthin, auch nachts; die
   Datei bleibt Pflicht (ein Chat kann geschlossen sein). Die sieben Rollen-Anweisungen
   sind entsprechend nachgezogen. Damit ist die Nachtlücke oben praktisch geschlossen,
   solange der PM-Chat offen ist; die alte PM-Routine bleibt als ausgeschalteter
   Notstart bestehen.
2. **Chat-Sitzungen (Master, Berechnungen, Desingner, QS/Audit …) enden nach ihrer
   Aufgabe nicht mehr**, sondern gehen in eine Schleife: Übergabe ablegen, dann
   `sleep 600` als **Hintergrundkommando**; beim Aufwachen Nachrichten und neue
   Aufträge abarbeiten, sonst wieder schlafen — eine Zeile, keine Tools, kein Bericht.
   Ende der Schleife: Wilhelm schließt den Chat oder der PM entlässt ausdrücklich.
   **Die Routinen behalten die einmalige 10-Minuten-Bereitschaft** — eine Endlosschleife
   dort wäre die Prozesslast, die heute um 19:05 die CPU auf 97 % getrieben hat.

---

### ⚠ Richtigstellung 26.08. 16:50 — **v8.33.4 IST ausgeliefert.** Der PM hat es falsch gemeldet

Ich habe seit 11:15 mehrfach geschrieben, die Version „hänge auf 8.33.4 ohne Tag" und die
Release-Wache sei „nicht zurückgekommen". **Das war falsch.** In Git nachgesehen:

| | |
|---|---|
| Tag `v8.33.4` | **existiert**, auf `69c27ed` (26.08. 12:07) |
| `package.json` | 8.33.4 |
| Notizen für 8.33.4 | alle verbraucht |

Die Wache hat um 12:07 sauber abgeschlossen: 19 Commits seit `v8.33.3`, Updater sieht
8.33.4, sha512-Gegenprobe stimmt, alle 43 Skripte im Paket, Release nicht als Entwurf,
Arbeitsbaum sauber, HEAD auf dem Tag.

**Wie der Fehler entstand — er gehört zur selben Familie wie der Rest des Tages:** Ich
hatte um 11:08 geprüft, **vor** dem Release, und danach nie wieder `git fetch --tags`
gemacht. Meine Zwischenstände liefen auf einem Stand, der bei jedem Blick älter wurde,
**ohne dass sich der Blick änderte**. Genau das Muster, das ich heute dreimal an anderen
gemeldet habe: *ein Lauf, der nichts dazulernt, sieht von außen aus wie ein gesunder Lauf.*

**Regel für den PM, ab sofort:** Jede Aussage über Version oder Auslieferung wird
unmittelbar vor dem Aussprechen mit `git fetch -q --tags` frisch geholt. Ein Stand von
vor zwei Stunden ist kein Stand.

**Es warten schon wieder drei Notizen** auf die nächste Auslieferung:
`archiv-nachladen`, `ausstieg-schalter`, `lesbarkeit-nachgemessen`.

---

### ✅ Der neue Ablauf trägt — erster Beleg noch am selben Tag

**Drei Übergaben lagen beim ersten Blick in den Briefkasten** (zwei Issue-Wache, eine vom
Master). Der Umbau ist damit nicht nur geschrieben, sondern **gelaufen**.

**Und er hat sofort geleistet, wofür er gebaut wurde.** Der Master meldet Stufe F (3) als
erledigt — **aber unter Punkt 3 steht: die Fokusreihenfolge in den Dialogen ist NICHT
gemessen.** Einer von vier Auftragspunkten, offen und benannt statt stillschweigend
mitgemeldet. Ohne den Pflichtpunkt „was ich nicht geschafft habe" wäre F (3) als fertig
in die Bücher gegangen und dieser Teil hätte auf niemandes Liste gestanden.

### Stufe F (3), Barrierefreiheit — gemessen, nicht behauptet (`779c02c`)

Neue Sonde `tools/a11y-probe.js`: startet die App isoliert, schaltet alle fünf Reiter und
achtzehn Pillen durch, misst Kontrast gegen den **wirklich gerenderten** Untergrund.

**Befunde: hell 23, dunkel 8 → danach beide null** — bei *mehr* geprüften Textstellen als
vorher (1.757 gegen 1.681). Das Grün kommt also nicht vom Wegsehen. Sechs Farbmarken
lagen unter der Schwelle 4,5 und liegen jetzt darüber.

Dazu ein echter Fund: der Regelkopf unter *Strategien* war die einzige Tabelle ohne
Kopfzelle — eine Vorlesesoftware las „60m", „8 Stunden", „nicht bestätigt" als Folge
zusammenhangloser Werte.

**Zwei der vier Planpunkte bestätigen sich NICHT und sollen nicht „repariert" werden:**
kein `aria-live`-Bereich ist zu breit, kein positiver `tabindex`, kein anspringbares
Element ohne Namen. Wer hier eingreift, ändert etwas Funktionierendes.

**Offen (a):** Fokusreihenfolge in Dialogen — `tools/a11y-probe.js`, Messcode ab ~95,
Ablauf ab ~250. Klein und gut abgegrenzt.
**Beobachtung (b), gehört Wilhelm:** alle sechs Kontrastbefunde traten gegen `--panel-2`
auf (`index.html:51` hell, `:137` dunkel). Der Master hat die **Schriftfarben** nachgezogen;
den **Untergrund** aufzuhellen hätte alle sechs auf einmal erledigt — das ist eine
Gestaltungsentscheidung, keine Reparatur.
**(c)** Rückgängig zu machen mit je einer Zeile: `index.html` 28/34/41 und 121/130/137,
alte Werte stehen im Kommentar daneben.

**Ein methodischer Satz, der über den Auftrag hinausgeht:** Der erste Sondenlauf meldete
„keine Befunde" — auf einem frischen Profil wird fast nichts gezeichnet. **Eine grüne
Prüfung ohne Inhalt sagt nur, dass sie nichts zu sehen bekam.** Die Sonde sät jetzt selbst
ein Depot, drei Papiere und vier Protokolle. Fünfte Verkleidung derselben Stille an
einem Tag.

### Aus der Issue-Wache: was auf Wilhelm wartet, nicht auf Arbeitskraft

Ihr Lauf war leer (alle acht Issues gesichtet, letzter Beitrag jeweils ihr eigener). Sie
trennt aber sauber, **was blockiert**:

**Wartet auf eine Entscheidung von Wilhelm:**
- **#96** — ob die 20:00-Platzhalterkerze verworfen wird (147 von 152 Reihen betroffen,
  Tagesarchiv sauber).
- **#80** — welcher der drei Wege für die Kanal-Güte. Betrifft `explorer.js:628/656/664/669`,
  `depot.js:1251/2040`, Sortierung `depot.js:1998`.
- **#72 Punkt 3** — Richtung zur Kostenhürde (längere Haltedauer / Basiswert / engere Spannen).

**Baubereit und unstrittig, sobald jemand Zeit hat:** #92 (Rangfolge,
`messmaschine.js:1214–1215`), #69 (Backup/Restore, Anforderung vollständig), #82
(Herkunftsland — das Feld fehlt im Programm noch ganz), #95 (Felix' fehlende
`stammdaten.json`, Gegenprobe steht aus).

**Vorschlag der Wache in eigener Sache:** Seit sie alle 30 Minuten nur noch sichtet, ist
der Leerlauf der Normalfall — ein längerer Takt täte es auch. Sie ändert ihre eigene
Aufgabe ausdrücklich nicht; das ist Wilhelms Entscheid.

---

### 📋 DER GROSSE PLAN — `studien/grosser-plan-2026-08-26/PLAN.md` (26.08., PM)

**Wilhelm hat einen Gesamtplan bestellt. Er liegt vor und ist ein Vorschlag, keine
Festlegung.** Jede Sitzung liest ihn, bevor sie sich etwas nimmt — er sagt, **warum**
etwas dran ist, nicht nur was.

**Die Lage in einem Satz:** Neun von zwölf Strategien sind nicht am Markt gescheitert,
sondern am Messgerät — eine Kante in Größe der Kostenhürde bräuchte 35 Jahre Daten.

**Die drei Hebel, alle bereits vermessen:** Messanordnung (Faktor 1,5, **geeicht**) ·
Haltedauer (Faktor 15) · Kostenhürde (Faktor bis 5,75). **Nicht mehr Detektoren** — der
Suchraum ist nicht das Problem, das Auflösungsvermögen ist es.

**Die Stränge:**
- **A** — `momentum` nicht überlappend messen. Der einzige Ort, an dem eine große Kante
  noch möglich ist, gerade weil er schlecht gemessen ist. Anordnung geeicht, Messung offen.
- **B** — Übernacht-Familie: zwei Kandidaten vorregistriert, seit heute technisch messbar.
- **C** — Kostenhürde angreifen: Auktionskosten am Demo-Konto (freigegeben, **nicht
  angefangen**) und Basiswert statt Schein.
- **D** — die App sagt die Wahrheit über sich selbst (Wand sichtbar machen, #92, #80, #96).
- **E** — Betrieb, läuft bereits.

**Teil IV nimmt ernst, dass hier nichts zu finden sein könnte**, und schlägt ein
Abbruchkriterium vor. **Die Engstelle ist nicht Arbeitskraft, sondern Entscheidung.**

---

### ⚠ 26.08. 18:30 — Überlebenslücke vermessen, drei Datenfunde zugeteilt

**Der Tüftler hat die Lücke des großen Archivs beziffert: mindestens 12,7 % des
Querschnitts fehlen, ausschließlich Nicht-Überlebende**, steigend auf 20 % (2023). Mit
den vorhandenen Quellen nicht zu schließen. **Das trifft den großen Plan an der Wurzel** —
Strang A und B rechnen beide darauf, und jede positive Rohrendite ist dadurch nach oben
verzerrt, in genau der Richtung, in der wir etwas finden wollen. Ausführlich im Plan.

**Zugeteilt an den Master (Datenqualität, unstrittig):**
1. Falsche Delistings in `massive/verschwundene.json` — **Vorrang.**
   **Korrigiert 18:45: belegt falsch sind DREI, nicht fünf** — AVB, EQR, WBS. Der Tüftler
   hat gefragt, was die *Quelle* im Fenster 17.–26.08. führt, und damit „Quelle hat nichts"
   von „Archiv holt es nicht" getrennt; im Rückstand sehen beide gleich aus. Er hat
   LBRDA/LBRDK selbst aus seiner Gruppe genommen — dort fehlen die Kerzen auch bei der
   Quelle, der Delisting-Vermerk könnte also stimmen (Liberty Broadband).
   *Der PM hatte die Fünf ungeprüft weitergereicht — seine Ungenauigkeit, nicht dessen.*

   **Die zehn Rückstände zerfallen in drei Gruppen:** AVB, EQR, WBS, TWO = **reines
   Nachladen** (8 Kerzen liegen bei der Quelle bereit) · LBRDA, LBRDK, WHLR = echte
   Datenlücke · BSCO, IBDP, IBTE = **ETFs**, gehören womöglich gar nicht in die Prüfmenge.
2. `tools/massive-tagesdaten.js:29` — holt neun Monate weniger als es glaubt.
3. **Der Wachhund rundet 99,66 % auf 100 %** und verschluckt damit zehn zurückhängende
   Reihen. Sechste Verkleidung derselben Sache an einem Tag, diesmal in der Sicherung,
   die dagegen gebaut wurde.

**Offen für Wilhelm: Vorschlag C** — wie mit der Lücke umgehen. PM und Tüftler empfehlen
denselben Weg: erst auf den 1.164 schon beschafften Verschwundenen die **Richtung** der
Verzerrung messen, bevor irgendwer Daten kauft.

---

### 🔴 26.08. 17:35 — fünf Übergaben, ein A-Fund: **Wilhelms Entscheid 2b ist tot ausgeliefert**

*Erste volle Runde des PM im Dauerlauf. Fünf Rollen hatten abgelegt — Auditor, Analytiker,
Release-Wache, Tüftler, Issue-Wache. **Der Briefkasten trägt.***

**#100 (A, Auditor) — hat Vorrang vor allem, auch vor den Datenfunden.**
`kantenAusProtokollen()` ruft nach dem Füllen von `PROTOKOLL_KANTE` nur
`huerdeAnzeigen()`, **nicht** `regelKopfAnzeigen()` (`depot.js:793`). Der Regelkopf
behauptet dauerhaft „Kein Messprotokoll im Datenordner", während die Kostenhürde **sechs
Zeilen tiefer** dasselbe Protokoll mit einem **anderen** Urteil zeigt. Zwei Wahrheiten
gleichzeitig auf einer Seite.

**Die Folge, die zählt:** Wilhelms Entscheid **2b** (Warnhinweis vor `kapitulation`) ist
in v8.33.4 ausgeliefert und **in der Anzeige tot** — er hängt an `belegAusProtokoll`, das
nie gefüllt wird. Gemessen: `hatWarnhinweis = false` ausgerechnet bei `kapitulation`.
Dasselbe trifft die Variantenwahl aus `8fc2c8a`. **Zwei frisch ausgelieferte Arbeiten
wirkungslos, eine davon eine Entscheidung Wilhelms.** Keine Regression — älter als die
Änderungsmenge.

**#98 (Analytiker) — der B10-Überlappungs-Wächter ist toter Code.** `block()` reicht
`ueberlappungsFaktor` nicht weiter; **0 von 38 Protokollen** trägt den Eintrag, die
Warnung ab Faktor 3 kann **nie** feuern. Die Korrektur selbst wirkt.
`messmaschine.js` Z. 1010–1016. **Vorbedingung für Strang A:** Momentum ist genau der
Fall, für den dieser Wächter gebaut wurde — und er ist blind.

**Drei B-Funde:** #101 (Max. Rücksetzer steht schwarz statt rot — `.down` ist nur unter
`#cockpit` definiert), #102 (roher Schlüssel `nicht-bestaetigt` in der Anzeige;
`scoreboard.js` hat `label()`, exportiert sie aber nicht), #103 (Regression aus
`779c02c`: der `<th scope="row">`-Umbau zieht Großbuchstaben und einen 130-px-Reststrich mit).

**#99 (Analytiker) — gute Nachricht mit Nachspiel:** Der Depot-Reset vom 25.08. löschte
**37 von 38 Kostenrunden**. Die geretteten sagen **0,0855 %** gegen die Annahme von
0,10 % — **die Kostenannahme ist konservativ, sie hält.** Zu tun: die 38 Runden aus
`depot_vor_reset.json` zurückspielen und `kostenMessung` vom Depot-Store trennen
(`kosten.js` Z. 30–38, Reset-Dialog `depot.js` Z. 6723). Passt zum freigegebenen
Auktionskosten-Auftrag.

### ⚠ Die vorhergesagte Kollision ist bereits eingetreten

**Der Analytiker konnte seine Blöcke B und D nicht fahren — „weil das 60m-Archiv während
des gesamten Laufs beschrieben wurde".** Genau der Fall, wegen dem die Sperrdatei gebaut
wurde. Sie kam heute Nachmittag; der Lauf war vorher. **Ab heute Nacht greift sie** — und
der Analytiker fragt ab sofort den Wachhund, statt auf die Uhr zu sehen.
Die Kanten-Neuberechnung über die zwölf frischen Protokolle steht damit **noch aus**.

### ✅ v8.33.5 ist sauber draußen (Release-Wache, 17:17)

Alle Prüfungen bestanden: Updater meldet 8.33.5, Prüfsumme stimmt, **43 Skripte im Paket,
keines fehlt** — die Prüfung, an der hier schon einmal ein ganzes Modul hängenblieb.
*Hinweis der Wache für die Zukunft:* Das Bauen lief in den 10-Minuten-Deckel des
Vordergrund-Befehls (13 Min). Kein Schaden, aber `--bauen` gehört gleich als
Hintergrundkommando gestartet.

---

### ⚠ Richtigstellung 26.08. 17:50 — der PM hat Prozentpunkte mit Handelstagen verglichen

Ich hatte dem Tüftler geschrieben, seine beiden Kandidaten seien von der neuen
1.000-Tage-Regel „nicht betroffen — sie liegen mit `delta80` 0,0396 bzw. 0,0397 klar
darunter". **Das vergleicht zwei verschiedene Einheiten:** `delta80` ist eine Effektgröße
in **Prozentpunkten**, die Schwelle zählt **Handelstage**. Der Tüftler hat es
nachgerechnet (nötige Signaltage skalieren mit 1/d²):

| | vorhanden | für 0,10 Pp (CFD) | für 0,04 Pp (Aktie) |
|---|---|---|---|
| `glockendruck-nacht` | 4.665 | **735 — besteht** | 4.595 — **reißt** |
| `nachtstoss-umkehr` | 4.736 | **743 — besteht** | 4.642 — **reißt** |
| familienweit (4 Tests) | 4.736 | **872 — besteht** | 5.448 — **reißt** |

**Die Schlussfolgerung stimmt, aber aus einem anderen Grund als dem genannten — und sie
ist genauer, als ich sie hatte:** Die Schwelle trifft nicht die Entwürfe, sondern **eine
ihrer beiden vorregistrierten Antworten.** Die **JA-Seite besteht komfortabel**, auch
familienweit. Die **NEIN-Seite an der Aktienhürde reißt klar** und ist deshalb auf die
CFD-Hürde (0,10 Pp) gestellt. Datierte Nachträge liegen in beiden
Vorregistrierungs-Ordnern; die Vorregistrierungen selbst sind unverändert.

Bei `glockendruck-nacht` ist das der **zweite, unabhängige** Grund gegen dieselbe
Aussage — der Spannen-Rückprall hatte sie schon verworfen (Marge 0,0005 Pp). Zwei Wege,
dasselbe Ergebnis. Bei `nachtstoss-umkehr` ist es neu; der hat den Rückprall nicht.

**Zweiter eigener Fehler, ebenfalls vom Tüftler gefunden und vom PM repariert:** Beim
Einbau der neuen Regel in seine Rollendatei traf der Einfügepunkt eine `##`-Erwähnung
**im Fließtext** statt einer echten Überschrift — der Startabsatz, den jede künftige
Sitzung **zuerst** liest, war mitten im Satz zerrissen. Behoben; der Block steht jetzt als
eigener Abschnitt. *Er hat die Datei bewusst nicht selbst repariert — Konfiguration ändert
er nicht auf Zuruf, auch nicht zur Reparatur. Richtig so.*

**Hinweis des Tüftlers zur beauftragten Verzerrungs-Messung, der die Vorregistrierung
erheblich verkleinert:** Die Frage „ab welchem Wert ändert das die Urteile der zwölf
Protokolle?" hat eine natürliche Verankerung — **bei sieben der zwölf liegt die Aussicht
jenseits von 12.000 Handelstagen; deren Urteil kann keine Verzerrungskorrektur drehen.**
Entscheidbar ist die Frage nur für die **drei unter 1.500**.

---

### ✅ 26.08. 18:05 — #100 ist zu: **Wilhelms Entscheid 2b wirkt jetzt** (`5be41dd`)

Vom PM gegengeprüft: Commit auf origin, `npm test` Exit 0, `depot.js:792` ruft jetzt
beides, `app-shell.js:36` hält die Urteils-Übersetzung an **einer** Stelle.
**Der Master hat es in der laufenden App mit `kapitulation` reproduziert**, statt der
Meldung zu glauben:

| | vorher | jetzt |
|---|---|---|
| Regelkopf kennt das Protokoll | nein | **ja** |
| Warnhinweis (Wilhelms 2b) | nein | **ja** |

**Ein Muster, das über den Tag hinaus gilt:** Die #100-Reparatur hat **#102 erst sichtbar
gemacht** — „Beleg nicht-bestaetigt" stand erst da, als der Kopf das Protokoll überhaupt
zu sehen bekam. *Hinter einer toten Anzeige verstecken sich die Fehler der Anzeige selbst.
Wer eine reaktiviert, sollte mit dem nächsten Fund darunter rechnen.*

**Der Wachhund nennt die Ausreißer jetzt beim Namen** (`590aca6`): 99,6 % statt gerundeter
100 %, dazu jede zurückhängende Reihe mit Datum und Abstand in Handelstagen — **sieben
unter zehn Tagen, drei seit 438**. Damit ist aus der Ausgabe selbst ablesbar, was der
Tüftler getrennt erarbeitet hatte. **Die Einordnung bleibt bewusst draußen:** ob ein
Papier ins Aktienuniversum gehört, entscheidet der Universumsfilter, nicht der
Archivwächter. Er meldet den Stand, nicht die Bedeutung.

**Zwei Reste, an den Master zurück:**
- ~~**#103 unvollständig**~~ **ERLEDIGT** (QS 26.08. abends nachgesehen: `index.html:583`
  trägt `font-size: inherit`, mit Kommentar, der die Issue-Wache als Finderin nennt —
  die Tafel führte es fälschlich noch als offen).
- **#101 unangetastet**, Befund bestätigt: `.down` steht vier Mal in `index.html`
  (261, 294, 345, 367), jedes Mal kontextgebunden. Für den Rücksetzer im Depotverlauf
  greift keine davon.

**Reihenfolge unverändert:** #98 (toter Überlappungswächter, Vorbedingung für Strang A),
danach die Datenfunde.

---

### ⚠ 26.08. 20:15 — der Warnkanal der Protokolle kam auf dieser Tafel nie an (QS-Fund)

**Vier der zwölf Protokolle tragen Warnungen. Keine einzige stand hier.** Der PM hat
Urteil und Aussicht übertragen und das Feld `warnungen` schlicht nie gelesen. Vom PM in
allen zwölf Dateien nachgezählt:

| Strategie | Kennung | Kern |
|---|---|---|
| **monatsende-kauf** | **A7** | keine Lesefenster-Angabe → Kontrolle **nicht** bereinigt, Nullpunktverschiebung 0,02–0,04 Pp je Signal möglich |
| **monatsende-kauf** | **F4** | 6,2 % der Signale **ohne Kontrolle**, und der Verlust trifft **nicht zufällig** die Randpositionen der Sitzung |
| t1-zwangsglattstellung | B2 | Var 2: Tagesmittel +0,0272 Pp, Erwartung je Signal **−0,5555** Pp — dünne Tage tragen das Ergebnis |
| t2-umsatzschock | B2 ×2 | Var 0 und 1: dasselbe Vorzeichenproblem |
| t3-stundendrift | B2 | Var 0: dasselbe |

**Regel ab sofort:** Wer Urteil oder Aussicht auf diese Tafel überträgt, überträgt die
**Warnungen mit**. Eine Zahl ohne ihre Warnung ist genau die Sorte Halbwahrheit, die
dieses Projekt am teuersten bezahlt.

### 🔴 Die kleinste Aussicht der Tabelle ist die schwächste Messung im Bestand

`monatsende-kauf` steht mit **187 Handelstagen ganz oben** — und wäre damit die Strategie,
die die 1.000-Tage-Eintrittskarte am mühelosesten passiert. Was wirklich dahintersteht:

- **17 Bestätigungstage.** Die Aussicht extrapoliert Effekt *und* Streuung daraus, und der
  Effekt steht quadriert im Nenner.
- **Keine A7-Bereinigung.** Gemessener Überschuss 0,110 Pp je Signal, mögliche
  Nullpunktverschiebung 0,02–0,04 Pp — **18 bis 36 % des ganzen Effekts, Vorzeichen offen.**
- **6,2 % der Signale ohne Kontrolle**, nicht zufällig verteilt.

**Der Maschinenfehler dahinter, vom PM in `messmaschine.js` nachgesehen:** Zeile **1226**
wirft bei `u.tage < 30` sofort auf `nicht-messbar`. Zeile **1266** berechnet die Aussicht
trotzdem — die Schranke dort lautet `u.tage > 0`, **nicht** `>= 30`. **Ein Lauf, den die
Maschine selbst für nicht messbar erklärt, gibt eine Zahl aus, die aussieht wie eine
Planungsgröße.** Über alle 38 Protokolle tritt der Fall **genau einmal** auf — bei genau
dieser Strategie. Auf 1.4.0 nachgemessen: unverändert, Aussicht 187 → 180.

**Fehlerfamilie #86/#91: eine Bedingung, die fast richtig ist.**

### ✅ Block B (Placebo) bestanden — Stufe 1 des Abbruchkriteriums ist für diesen Pfad belegt

Fünf Saaten, Signal ohne jeden Kursbezug, bewusst **eine** Variante (Schwelle 1,96 statt
2,39 — der schärfste Fall, weil der Bonferroni-Puffer fehlt). Alle fünf:
**nicht-entscheidbar**, |t| ≤ 0,34. **Die Maschine sieht nichts, wo nichts ist.**

**Beobachtung, ausdrücklich kein Fund:** alle fünf Punktschätzer sind **positiv**, Mittel
rund **+0,011 Pp** — ein Viertel der Aktienhürde. Für ein Projekt, das per Hebel 2 genau
in dieser Größenordnung sucht, keine Nebensache. **Mit neuen Saaten nicht zu klären** (sie
teilen die Kurse und damit die Tagesschwankung); dafür bräuchte es disjunkte Zeitfenster.
Möglicher Grund aus dem Code: das maschineneigene Placebo schichtet nach
**Sitzungsposition** und bildet die Verteilung des echten Signals nach — das der QS streut
gleichmäßig. Steckt Tageszeit-Struktur in der Kontrolle, sieht das eine sie und das andere
nicht. **Für den Analytiker, nicht für eine Bausitzung.**

### Zwei Selbstmeldungen der QS, beide in der Hausform des Tages

- Sie hat einen a11y-Lauf durch `tail -50` geschickt und daraufhin geglaubt, die Sonde
  prüfe nur 355 statt 1.757 Stellen. **Eine abgeschnittene Ausgabe sieht aus wie eine
  unvollständige Prüfung.** Sie war eine Minute davor, einen selbst erzeugten Fund zu melden.
- Ihr erster Nachrechen-Treiber maß alle neun in **einem** Prozess; nach zwei Strategien
  stand der Heap bei 4,18 GB und der Lauf drehte im Dauer-GC. Neu: **ein Prozess je
  Messung** — `monatsende-kauf` läuft jetzt in 64 s statt gar nicht.

**Beide Oberflächen-Sonden grün**, und die Abdeckungs-Behauptung dieser Tafel stimmt
genau: 1.757 Textstellen, 16 Pillen — deckungsgleich. *(Nur dunkles Thema; hell steht aus.)*

**Nachrechnung Block D: 3 von 9, alle drei reproduzieren** — rsi2seit (t 0,83 → 0,79),
kapitulation (3 von 3 Varianten), monatsende-kauf (Urteil stabil).

---

### ✅ #96 — das trennscharfe Kriterium ist gefunden: **marktweite Gleichzeitigkeit** (QS, gezählt)

**Zwei Regeln sind vorher gescheitert, beide an einer Annahme über den *Ort* der Kerze:**

| Regel | Urheber | Ergebnis |
|---|---|---|
| flach + Umsatz 0 | **PM**, aus 5 Stichproben | 3.409 Treffer statt 2.885 — **570 echte leere Stunden** mitgelöscht |
| zusätzlich „letzte Kerze der Reihe" | **QS**, als Hypothese | **2 von 2.839** Platzhaltern getroffen, **85 echte** gelöscht |

*Grund für das zweite Scheitern, banal: das Archiv ist seit dem 25.08. weitergelaufen, der
Platzhalter steht längst mitten in der Reihe.* **Die QS hat ihre eigene Hypothese
widerlegt, bevor jemand darauf gebaut hat.**

**Was stattdessen trägt — über alle 2.885 Reihen gezählt:**

```
2026-08-25T20:00  ->  2.839 von 2.885 Reihen   (98,4 %)   <- Platzhalter
2025-10-10T13:30  ->     27 Reihen             ( 0,9 %)   <- illiquide Stunde
2023-11-24T17:30  ->     15 Reihen
```

**98,4 % gegen 0,9 %, und dazwischen liegt nichts.** Eine völlig flache Nullumsatz-Kerze,
die zur selben Sekunde in fast allen Papieren steht, kann kein Marktereignis sein. Eine,
die in 27 von 2.885 steht, ist eine wirklich nicht gehandelte Stunde.

**Warum dieses Kriterium hält, wo die beiden anderen scheiterten:** Es kommt **ohne jede
Annahme über Uhrzeit, Position oder Sitzungsende** aus — die Auflagen 2 und 3 zweifelten zu
Recht genau daran. Es sagt nicht, *wo* der Platzhalter steht, sondern *was er ist*. Und die
Trennung ist keine Schwelle, die kalibriert werden muss, sondern ein Abgrund.

**Die flachen Kerzen zerfallen damit in drei Gruppen:**

| Gruppe | Zahl | was damit geschehen soll |
|---|---|---|
| `2026-08-25T20:00` | 2.839 | **löschen** — der Platzhalter |
| krumme Zeitstempel | 151 | **löschen** — Quote-Stempel, keine Kerzen (siehe unten) |
| Rest auf gültigem Raster | 419 | **behalten** — nicht gehandelte Stunden |

### 🔴 Die Stempel-Kerzen sind zurück — und zwar an genau den Nachladetagen

Der Fehler, den das Gedächtnis als **„Stempel-Kerzen der Quelle"** führt und der seit
8.23.13 als behoben galt:

| | |
|---|---|
| Kerzen weder auf `:30` noch `:00` | **151** |
| betroffene Reihen | 150 von 2.885 |
| Tage | **nur zwei: 24.08. (75) und 26.08. (76)** — die beiden Nachladetage |
| Umsatz | alle null, alle völlig flach |

Beispiele: `AAON 2026-08-26T15:12`, `AGL 2026-08-24T17:51`, `ACMR 2026-08-24T17:50`.

**Entwarnung für die Sammelfunktion, vom PM nachgesehen:** Das **Minutenarchiv ist
sauber** — 300 Reihen Stichprobe, **null** krumme Zeitstempel, bei inzwischen 1.369
gesammelten Reihen. Der Fehler sitzt im 60m-Pfad, nicht in dem, was gerade frisch
entsteht. **Punkt 1 des Intraday-Auftrags („Format identisch, dieselbe Teilkerzen-Regel")
bleibt trotzdem der wichtigste** — er ist der Grund, warum es hier nicht durchgeschlagen ist.

### Nachrechnung Block D: **5 von 9, kein einziges Urteil gekippt**

rsi2seit · kapitulation (3/3 Varianten) · monatsende-kauf · t2-umsatzschock (2/2) ·
t1-zwangsglattstellung (Placebo t 0,031). Offen: t3, rsi2seit-mcp, winkelbestaetigt,
winkelgrad.

**Block B komplett: sieben Saaten, alle bestanden**, Mittel +0,0068 Pp, mittleres t +0,12,
eine Saat negativ. *Selbstkorrektur der QS: Nach vier Saaten hatte sie „alle positiv,
+0,014 Pp" als beobachtenswert gemeldet — mit allen sieben halbiert sich der Wert und eine
ist negativ. **Vier Würfe waren kein Muster.*** Beide Oberflächen-Sonden grün, jetzt in
**beiden** Themen, 1.757 Textstellen — die Abdeckungs-Behauptung dieser Tafel stimmt genau.

**Die Aussichts-Beobachtung verdichtet sich: 6 von 7 Varianten sind durch zwei frische
Handelstage schlechter geworden**, nicht besser (t2 Var0 51.183 → 57.345, Var1 17.317 →
18.237). Das trifft die Annahme des großen Plans, mehr Tage machten die Frage
entscheidbar.

---

### 🛑 BAUSTOPP für (1b) — an den Desingner (PM, 26.08. 20:40)

**Der PM kann den Desingner gerade nicht per Nachricht erreichen** (Namenskonflikt, siehe
unten). **Deshalb steht es hier — Desingner, lies das, bevor du die Aussicht anzeigst.**

**1. `monatsende-kauf` (187 Tage, erste Zeile) darf nicht angezeigt werden, wie es dasteht.**
Die Zahl stammt aus **17 Bestätigungstagen** bei einem Lauf, dem die Maschine selbst das
Urteil **„nicht messbar"** gegeben hat, plus zwei Warnungen (A7: Kontrolle nicht bereinigt,
Verschiebung 0,02–0,04 Pp gegen einen Effekt von 0,110 Pp · F4: 6,2 % der Signale ohne
Kontrolle). **Ursache ist ein Maschinenfehler** (`messmaschine.js` 1226 gegen 1266: die
Aussicht wird unter `tage > 0` berechnet statt `>= 30`). **Würde die Oberfläche das
anzeigen, trüge sie einen Maschinenfehler nach außen und gäbe ihm das Gewicht einer
Anzeige** — das Gegenteil dessen, wofür Strang D da ist.
**Reihenfolge: erst die Schranke reparieren, dann anzeigen.**

**2. Zwei Strategien haben gar keine Aussicht.** `winkelbestaetigt` und `winkelgrad` — in
**allen zehn Varianten**, weil ihr Überschuss durchweg negativ ist (−0,038 bis −0,128 Pp).
Sie fallen **weder über noch unter** die 2.500-Grenze; „kleinste Aussicht über alle
Varianten" ist für sie undefiniert. Ohne Vorwissen baut man dort einen Absturz oder eine
leere Zelle, die aussieht wie *„noch nicht gemessen"*.
**Vorschlag der QS, inhaltlich richtig: ein dritter Abschnitt „gemessen, zeigt in die
Gegenrichtung".** Das ist etwas anderes als „zu wenig Daten" — diese beiden brauchen keine
Daten, sie zeigen in die falsche Richtung.

**Was weitergebaut werden kann:** Struktur, Gestaltung, der Ton bei „nicht entscheidbar".
Nur die Zahlen warten.

### ⚠ Richtigstellung: es sind **fünf**, nicht sieben

Der PM hat auf dieser Tafel und im großen Plan mehrfach geschrieben, **„sieben von zwölf
liegen jenseits von 12.000 Handelstagen"**. **Falsch.** Fünf haben eine Aussicht über
12.000 (t3, quartalsschub, t2, momentum, t1). Die beiden Winkel-Strategien wurden
mitgezählt, obwohl sie **überhaupt keine Aussicht haben** — sie sind nicht unerreichbar
weit weg, sie zeigen in die Gegenrichtung. **Zwei verschiedene Sachverhalte, von mir in
eine Zahl geworfen.** Gilt auch für `studien/grosser-plan-2026-08-26/PLAN.md`.

### ⚠ Zwei Sitzungen sind für den PM nicht mehr erreichbar

`SendMessage` an **Desingner** und **App-Codebase Master** scheitert mit dem Hinweis, eine
Sitzung **auf diesem Rechner** beanspruche deren Identität, während die echten von einem
anderen Rechner schreiben. Beide antworten weiterhin — der PM kann sie nur nicht mehr von
sich aus ansprechen. **Aufträge an die beiden laufen bis auf Weiteres über diese Tafel.**

### Eingrenzung der Quote-Stempel: die App ist sauber, die Messbasis nicht

Die QS hat den App-Store nachgezählt: **6.108.828 Kerzen über 1m/5m/15m/60m, null krumme
Stempel.** Dazu die 300 Minutenreihen des PM auf `E:`, ebenfalls null. **Der Fehler sitzt
allein im Mess-Archiv auf `E:`, geschrieben von `tools/yahoo-60m-holen.js`** — 151 Kerzen
an den beiden Nachladetagen. Die laufende App schreibt sauber.

**Nachrechnung: 6 von 9, weiterhin kein einziges gekipptes Urteil** (neu: t3-stundendrift,
Placebo t 0,385). `archiv1d` ist seit 2 Stunden gesperrt — **die drei Tagesarchiv-Protokolle,
darunter `momentum` und damit Strang A, bleiben ungeprüft.**

---

### 🔴 Die Teilkerzen-Sperre feuert seit Monaten nie — und der Sammler schreibt gerade hinein

**`fertigeKerze()` verwirft eine Kerze, wenn `getUTCSeconds() !== 0`.** Das war die Messung
zu Issue 85: *„Yahoo stempelt die laufende Kerze mit der Quote-Uhrzeit (16:57:27 statt
16:30)."* **Diese Prämisse gilt nicht mehr.** Yahoo stempelt inzwischen auf **volle
Minuten** — `17:51:00`, `15:12:00`. Über rund **7 Millionen Kerzen in vier Archiven**:

| | |
|---|---|
| Kerzen mit Sekunde ≠ 0 | **0** |
| krumme Kerzen im 60m-Archiv | 151 — **davon Sekunde = 0: alle 151** |

**Die Sperre sieht gesund aus und feuert nie.** Achte Verkleidung desselben Musters, und
diesmal an einer Sperrklinke, die eigens gegen diese Fehlerform gebaut wurde.

**Richtigstellung des PM: meine Entwarnung fürs Minutenarchiv war nach dem falschen
Merkmal geprüft.** Ich hatte auf Sekunde ≠ 0 getestet — dasselbe Merkmal, das die kaputte
Sperre benutzt. **Am Inhalt gemessen sieht es anders aus** (PM selbst nachgezählt, 20:50):

| Archiv | Reihen | letzte Kerze flach **und** Umsatz 0 |
|---|---|---|
| **archiv1m** | 1.647 | **7** (0,4 %) |
| archiv5m | 491 | **16** (3,3 %) |
| archiv15m | 232 | **8** (3,4 %) |
| archiv60m | 2.885 | **87** (3,0 %) |

Beispiele von heute: `BCO 17:43`, `LAD 17:22`, `DPST 17:10`, `A 16:51`, `EQIX 16:57` —
**laufende Kerzen, mitten in der Sitzung eingefroren.**

**Warum es im Minutenarchiv am gefährlichsten ist:** Bei Minutenkerzen ist `17:43:00` ein
**völlig gültiger Rasterplatz**. Kein Zeitstempel-Test kann eine Teilkerze dort je finden.
**Je feiner das Raster, desto unsichtbarer der Fehler** — und 1m ist genau das Archiv, das
täglich gesammelt wird und **nie nachgeholt werden kann**.

**Entscheidung des PM: der laufende Abruf wird NICHT gestoppt.** 0,4 % betroffen, alle
eindeutig identifizierbar und nachträglich entfernbar — die Kerzen selbst verfallen nach
sieben Tagen unwiederbringlich. **Ein Archiv mit einem benannten Makel ist mehr wert als
keines.** Der Makel steht hiermit benannt.

### #96 sortiert sich damit in DREI Populationen, nicht zwei

| Gruppe | Zahl (60m) | Merkmal | Umgang |
|---|---|---|---|
| **Platzhalter** | 2.870 | alle am **selben** Zeitstempel, 98,4 % aller Reihen | löschen |
| **Teilkerzen** | ~87 | **letzte** Kerze, flach, Umsatz 0, **heutiges** Datum | löschen **und beim Schreiben verhindern** |
| **echte leere Stunden** | ~410 | **mitten** in der Reihe, illiquide Papiere, verstreut | **behalten** |

**Jede Gruppe braucht ihr eigenes Merkmal.** Die Verwechslung von 1 und 3 war der
ursprüngliche Fehler (PM), die von 2 und 3 der zweite (QS) — *sie hat ihn selbst
zurückgenommen: die vermeintlichen 85 „echten" Kerzen waren laufende Teilkerzen von heute.
Ihre Schlussfolgerung stand, die Begründung war falsch.*

### Was daraus folgt — **an den Master, über diese Tafel, weil nicht erreichbar**

**Die Teilkerzen-Prüfung darf nicht am Zeitstempel hängen.** Das tragfähige Merkmal steht
in den Daten: **letzte Kerze der Reihe, Umsatz 0, Hoch = Tief = Eröffnung = Schluss.** Das
wirkt auf allen vier Auflösungen gleich, auch dort, wo das Raster nichts hergibt. Ein
Zusatzmerkmal hat `reiheHolen()` schon zur Hand: die Quelle liefert
`currentTradingPeriod.regular` — ob die Sitzung überhaupt zu ist.

**Betroffen sind beide Stellen in `kerzenquelle.js`:** `fertigeKerze()` (~Z. 150)
verhindert neue, `zusammenfuehren()` (~Z. 195) räumt vorhandene weg. **Nur eine zu ändern
reicht nicht.**

**Und das ist Punkt 1 des Intraday-Auftrags in seiner schärfsten Form:** Würde die neue
Sammelfunktion die bestehende Sperre übernehmen, übernähme sie eine, die nachweislich nie
feuert — und schriebe Teilkerzen in genau die Archive, die nie nachgeholt werden können.

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

### 🔍 NEU — Sitzung „QS/Audit" (Wilhelm 26.08. 19:30 angelegt)

Prüft **im Fluss**, während die nächtlichen Rollen weiter im Takt prüfen. Drei Aufträge:

1. **Die heute ausgefallene Nachrechnung.** Der Analytiker konnte Block **D**
   (Kanten-Neuberechnung über die zwölf frischen Protokolle) und **B** (eigener
   Placebo-Lauf) nicht fahren — das Archiv wurde während seines ganzen Laufs beschrieben.
   **D ist die Prüfung, die bestätigen soll, dass die heutige Neumessung stimmt** — und
   der ganze Plan baut darauf auf. Auflage: vor jeder Messung den Wachhund fragen,
   **Exit 2 = nicht auf den Archiven messen.**
2. **Die letzten Stunden gegenprüfen.** 114 Änderungen heute, der Auditor kommt erst
   01:00 und nimmt sie am Stück.
3. **Die Tafel gegen die Wirklichkeit prüfen — ausdrücklich auch die Behauptungen des PM.**

**Zu Punkt 3, und er steht hier, weil er sonst niemandem auffällt:** Der PM hat sich heute
**fünfmal** geirrt, und **jedes Mal hat es jemand anders gefunden**, nicht er selbst —
„v8.33.4 hängt ohne Tag" (war ausgeliefert, nur nie neu nachgesehen) · fünf falsche
Delistings statt drei (ungeprüft weitergereicht) · Prozentpunkte mit Handelstagen
verglichen · beim Bearbeiten einer Rollendatei einen Satz zerrissen · die Chart-Zeichner
in beide Richtungen falsch gezählt.

**Auf dieser Tafel stehen Behauptungen, auf die sich alle verlassen.** Dass der Code mehr
behauptet als sein Protokoll, ist der teuerste Fehler dieses Projekts — **eine Tafel, die
mehr behauptet als die Wirklichkeit, ist derselbe Fehler eine Ebene höher.** Bisher prüft
ihn niemand.

**Grenzen:** prüft und meldet, baut nicht. Keine Handelslogik, keine Version, kein Release.


### ✅ FREIGABE an die Mess-Sitzung „Berechnungen" (PM, 26.08. 19:15)

**Deine Reihenfolge ist bestätigt, fang an — genau so, wie du sie vorgeschlagen hast.**

1. **Richtung der Überlebensverzerrung messen.** Vorregistrierung zuerst, vor dem ersten
   Rechenschritt. **Hinweis des Tüftlers, der sie erheblich verkleinert:** Von den zwölf
   Protokollen sind nur die **drei mit einer Aussicht unter 1.500 Handelstagen** überhaupt
   drehbar — bei sieben liegt sie jenseits von 12.000, deren Urteil kann keine
   Verzerrungskorrektur bewegen. Die Frage „ab welchem Wert kippt es" braucht also nur für
   drei beantwortet zu werden.
2. **Strang A** danach.
3. **#92** zuletzt — und deine Vorsicht ist richtig: **fass `messmaschine.js` nicht an,
   solange der Master dort arbeitet.** Er hatte um 18:15 unfertige Änderungen im Baum;
   die Release-Wache ist daran abgebrochen. Warte, bis er committet hat.

**Trag dich unter „Läuft gerade" ein.** Und melde dich beim PM, wenn die Vorregistrierung
steht — nicht erst nach dem Lauf.


### ⭐ #96 — Platzhalterkerze verwerfen (Wilhelm 26.08. 18:55) — an den Master

**Die trennscharfe Bedingung, vom PM über fünf Werte gemessen:**

| Bedingung | AAPL | KO | XOM | MSFT | SPY |
|---|---|---|---|---|---|
| Umsatz 0 **und** Hoch=Tief=Eröffnung=Schluss | 1 | 1 | 1 | 1 | 1 |
| Umsatz 0, aber mit Kursspanne (**echte** Stunde) | 18 | 7 | 8 | 18 | 10 |

Die flache Kerze ist über alle fünf **immer exakt `2026-08-25T20:00`**. Die Zusatzbedingung
*völlig flach* trennt sie von **61 echten Stunden**, die eine reine Umsatzregel mitgelöscht
hätte.

**Fünf Auflagen, alle hart:**

1. **Nur der Stundenpfad.** Die Tageskerze zum 25.08. ist echt (AAPL 25,8 Mio Umsatz gegen
   34,7 am Vortag). Im Tagesarchiv wäre die Regel Risiko ohne Nutzen.
2. **Nicht an der Uhrzeit festmachen.** Die echten Nullumsatz-Kerzen liegen am Schluss
   **verkürzter** Sitzungen (24.11.2023 und 29.11.2024 um 18:00, 03.07.2024 und 03.07.2025
   um 17:00). Eine 20:00-Regel verfehlt sie, eine „letzte Kerze des Tages"-Regel löscht sie.
3. **Dorthin, wo `fertigeKerze` wohnt** — nicht als zweite Stelle daneben, sonst gibt es
   zwei Wahrheiten darüber, was eine gültige Kerze ist.
4. **Zählen, bevor gelöscht wird.** Über das ganze Stundenarchiv erheben, wie viele Kerzen
   die Regel trifft. **Erwartung: genau eine je Reihe.** Trifft sie mehr — anhalten und
   melden, nicht anwenden.
5. **Beim Holen greifen, nicht nur nachträglich** — sonst kommt der Platzhalter mit dem
   nächsten Lauf zurück. **Die neue Intraday-Sammelfunktion muss dieselbe Regel benutzen**,
   sonst schreibt sie Platzhalter in die Minutenarchive.


### 🔴 VORRANG — die App sammelt Intraday-Kerzen selbst (Wilhelm 26.08. 18:20)

**Wilhelms Worte:** *„ich will das die app das sammelt und ablegt über die api"*.
Zugeteilt an den **App-Codebase Master**, vor die Datenfunde gesetzt.

**Warum es keinen Tag warten darf:** Die Quelle liefert Intraday nur in einem
**rollierenden Fenster** — 1-Minuten-Kerzen **7 Tage**, 5m/15m **60 Tage**. Was nicht
geholt wird, ist danach **für immer weg**. Bei Tageskursen kann man Jahre später
nachladen, hier nicht. **Bisher sammelt niemand.** Die Ordner `archiv1m/5m/15m` waren im
Ladewerkzeug vorgesehen, aber nie angelegt.

*Der PM hat 18:15 von Hand einen Erstlauf angestoßen (1m/5m/15m, top500) — er sichert die
aktuellen Fenster. **Das ist eine Momentaufnahme, keine Lösung.***

**Warum die App und nicht eine geplante Aufgabe:** Sie läuft ohnehin. Dann hängt das
Sammeln an nichts weiter — keine Claude-Sitzung, kein Zeitplan, keine Kette, die reißt.

**Sieben Punkte, die den Auftrag ausmachen:**

1. **Format identisch zu `tools/yahoo-60m-holen.js`** — dieselben Felder, dieselbe
   Kerzen-Definition, dieselbe Teilkerzen-Regel. Zwei Schreiber mit zwei Formaten im
   selben Archiv wären der „zwei Quellen in einer Reihe"-Fehler, der hier schon einmal 66
   Reihen unbrauchbar gemacht hat. **Gemeinsamer Code statt Nachbau.**
2. **Die App ist nicht immer an.** Beim Start prüfen, wie alt das Archiv ist, und
   nachholen, was das Fenster hergibt. War sie acht Tage aus, sind die Minutenkerzen
   verloren — **dann muss sie das sagen**, nicht stillschweigend weitermachen.
3. **Schonend und nicht blockierend** — 1,2 s Abstand, wachsende Pause bei
   Ratenbegrenzung, Fortschritt nach jedem Wert auf die Platte.
4. **Sperrdatei setzen** wie das Abrufwerkzeug, sonst misst der Analytiker hinein.
5. **Sichtbar machen, dass gesammelt wird — und ob es klappt.** Wann zuletzt gesammelt,
   wie alt die jüngste Kerze, wie viele Werte. **Eine stille Sammelfunktion, die eines
   Tages aufhört, ist der Fehler dieses Tages in seiner siebten Verkleidung.**
6. **Nur sammeln, nicht messen.** `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`,
   `modeParams` und die `window.confirm`-Gatter bleiben unberührt.
7. **Vorgabe, offen gelegt und drehbar:** 500 liquideste Werte, 1m täglich, 5m/15m
   wöchentlich. Platz ist reichlich (1,65 TB frei); 2.900 Werte kosten rund 97 statt 17
   Minuten je Auflösung.

**Belegte Dateien: noch offen** — der Master trägt sie ein, wenn er anfängt.

### Warum Intraday überhaupt interessant ist (PM, aus der Signalstudie gezogen)

Die große Signalstudie hat auf allen vier Zeitrahmen gemessen — und dort steht eine Zahl,
die gegen die Intuition läuft:

| Zeitrahmen | Bestätigungstage | nachweisbar ab |
|---|---|---|
| **1m** | 22 | **0,179 Pp** |
| 5m | 22 | 0,270 Pp |
| 15m | 22 | 0,374 Pp |
| 60m | 242 | **0,540 Pp** |

**Die Minutenkerzen hatten mit nur 22 Tagen die schärfste Auflösung von allen** — dreimal
besser als die Stundenkerzen mit 242 Tagen. Je kürzer der Zeitraum, desto weniger streut
die Rendite. **Das ist Hebel 2 des großen Plans (Haltedauer) in anderer Verkleidung.**
Ein Jahr Sammeln ergäbe 252 statt 22 Tage bei dieser Auflösung.

**Der Haken, und er ist groß:** Je öfter gehandelt wird, desto öfter fällt die Kostenhürde
an. Genau daran ist die Intraday-Idee hier schon einmal gescheitert. **Ob eine Kante mit
der Auflösung schneller schrumpft als die Kosten wachsen, ist eine Rechnung, keine
Meinung — und sie ist nicht gemacht.** Das Sammeln vorzuziehen ist trotzdem richtig: die
Rechnung lässt sich nachholen, die Kerzen nicht.


### ~~⭐ Richtung der Überlebensverzerrung messen~~ **ÜBERNOMMEN 26.08. 19:47 von „Berechnungen"** (Wilhelm 26.08. 17:40, Antwort c; PM-Freigabe 19:15)

*Auftragstext bleibt als Beleg stehen; Stand siehe „Läuft gerade".*

**Vorbedingung für Strang A und B** — solange sie offen ist, bedeutet eine positive
Rohrendite aus beiden Strängen nichts.

**Auftrag:** Auf den **1.164 bereits beschafften Verschwundenen** messen, **wie stark und
in welche Richtung** die Lücke verzerrt. Nicht: die Lücke schließen. Nicht: Daten kaufen.

Der Tüftler hat die Lücke beziffert (mindestens 12,7 %, ausschließlich Nicht-Überlebende,
steigend auf 20 % in 2023) und die Daten liegen. **Er misst nie selbst** — das gehört in
eine Bausitzung oder die Messkette.

**Braucht eine Vorregistrierung**, wie jede Messung: Was heißt „stark"? Ab welchem Wert
ändert das die Urteile der zwölf Protokolle? Vorher festlegen, nicht nachher.

### ⭐ (1b) Die Auflösungswand sichtbar machen (Wilhelm 26.08. 17:40)

Die Aussicht je Strategie steht in jedem Protokoll (`aussicht.tage80`), aber nirgends in
der Oberfläche. **Zu bauen:** Zahl anzeigen, und wer mehr als rund **2.500 Handelstage**
braucht, wandert in einen eigenen Abschnitt „nicht entscheidbar mit diesen Daten".

**Grenze, hart: Hinweis, kein Eingriff.** Wählbar bleibt alles. `intradayScan`,
Autopilot- und Edge-Ring, `SETUPS`, `modeParams` und die `window.confirm`-Gatter
bleiben unberührt. Text aus dem Protokoll, nie aus Prosa.

**Lies `bestesUrteil` und die kleinste Aussicht über alle Varianten** — die kleinste ist
die planungsrelevante. Die Zahlen stehen oben unter „Stand".
**Achtung:** hängt an **#100** (der Regelkopf sieht die Protokolle nie). Erst #100, sonst
baust du auf einer Anzeige, die ihre Daten gar nicht bekommt.

### ⭐ (2a) #92 — das schärfste Urteil gewinnt (Wilhelm 26.08. 17:40)

Die Rangfolge steht in `messmaschine.js` bei der Zeile, die mit
`bestesUrteil: ['bestaetigt', …` beginnt — **derzeit Zeile 1305, nicht 1214** (QS
nachgesehen; Zeilennummern wandern im geteilten Baum, darum der Inhaltsanker).
`widerlegt` schlägt künftig alles andere, und `bestaetigt-aber-nullpunkt-verschoben`
wird aufgenommen (fehlt bisher ganz). Heute tritt der Fall in keinem der 38 Protokolle
auf (QS: 94 Variantenurteile, kein einziges Vorkommen) — **es ist Vorsorge, kein
Brand.** Nicht während eines laufenden Rechenlaufs anfassen.
**Dazugehörig, gleiche Datei, aus dem QS-Fund zu `monatsende-kauf`:** die Aussicht wird
unter `if (u.tagesmittel > 0 …)` (~Z. 1266) auch für Läufe berechnet, die die Maschine
selbst `nicht-messbar` nennt (`tage < 30`) — daher die Planungszahl „187" aus 17
Messtagen. **Schranke auf `u.tage >= 30` ziehen, im selben Eingriff.** Achtung: beides
ändert die Maschine → Versionsnummer hochziehen, Protokolle sind danach formal ein
neuer Stand.


### ⭐ STRANG A — `momentum` nicht überlappend messen (Wilhelm 26.08. 18:35, freigegeben)

**Die größte offene Frage des Projekts.** Der einzige Ort im ganzen Korpus, an dem eine
große Kante noch möglich ist — und zwar gerade weil er so schlecht gemessen ist.

**Vorbedingung, hart: erst die Datenqualität.** Die drei Funde vom 26.08. und die
Überlebenslücke sind keine Nebenarbeit mehr, sondern Vorbedingung. Ein Momentum-Ergebnis
auf einem Universum, dem 12,7 % ausschließlich Nicht-Überlebende fehlen und dessen
Ausschlussliste handelnde Werte auswirft, kassiert Stufe 2 des Abbruchkriteriums ohnehin
wieder ein.

**Was schon da ist:**
- Die **Eichung ist bestanden** (25.08.): Newey-West war für lange Haltedauern 54 % zu
  konservativ, Verhältnis 1,543, über alle 63 Rasterlagen Minimum 1,342.
- Die **Anordnung existiert bereits** als virtuelles Buch in `mfdepot.js`
  („MOMENTUM stärkstes Zehntel, Rebalancing alle 63 Handelstage") — sie ist nie durch die
  Mühle gegangen.
- In dieser Anordnung geht `momentum` von t = 1,03 auf **t = 2,10**.

**Was fehlt: eine eigene Vorregistrierung.** Vor dem ersten Rechenschritt, nicht danach.
Sie muss ausweisen: Testfamilie · Schwellen für JA und NEIN vorab · Bestätigungshälfte ·
Placebo · Kontrolltopf · und **die Überlebenslücke als benannte Einschränkung**.

**Ausdrücklich:** Das sucht nichts Neues. Es misst das Einzige richtig, was noch offen ist.
Wer dabei einen neuen Detektor einbaut, hat den Auftrag missverstanden.

### ⭐ STRANG C (2) — Basiswert statt Schein als Regelfall (Wilhelm 26.08. 18:35, freigegeben)

Die Kostenhürde je Umlauf: Aktie **0,04** · CFD 0,10 · Standard-Schein **0,23 Pp**. Jede
Kante wird gegen diese Zahl gemessen. **Der Wechsel wirkt stärker als jede Detektor-Idee,
die hier je gemessen wurde** — Faktor bis 5,75.

**Achtung, das berührt Handelslogik.** Die Produkt-Vorgabe stand hier schon einmal an drei
Stellen, zwei davon falsch (Hürde 0,26 statt 0,07 Pp). **Zuerst erheben, wo die
Produktannahme überall steckt, und die Liste vorlegen** — dann ändern, an allen Stellen
zugleich. Nicht nebenbei.

Dazu gehört die zweite Hälfte von Strang C: **Auktionskosten am Demo-Konto messen**
(Wilhelm 09:00 freigegeben, immer noch **nicht angefangen**). Übernacht-Handel füllt in
der Schluss- und der Eröffnungsauktion, und was das wirklich kostet, ist nie gemessen
worden — die Tabelle beschreibt die notierte Spanne. Kein echtes Geld.


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

### ✅ `ausstiegsZeitpunkt` fertig (Master, 26.08. `8fc2c8a`) — Maschine jetzt **1.3.0**

Vom PM in `messmaschine.js:810` nachgesehen. **Er heißt `ausstiegsZeitpunkt`, nicht
`ausstieg`** — der Namenshinweis von der Tafel ist aufgenommen, und wer die alte
Schreibweise benutzt, bekommt eine **Verweigerung** statt eines stillen Nichtstuns
(Zeile 807).

**„Alle drei Stellen zugleich" ist belegt, nicht zugesichert:**

| Probe | Ergebnis |
|---|---|
| Rohrendite | −0,1020 → −0,4000 Pp (der Schalter greift überhaupt) |
| Überschuss, alles zusammen umgestellt | Unterschied **0,0000 Pp** |
| nur Signalpfad umgestellt | Überschuss wandert 0,2980 **und** Placebo −0,2980 |
| nur Placebo zurückgedreht | Nullpunkt +0,2980 gegen MDE 0,0049 — **60-fach** |

Die letzte Zeile ist der eigentliche Beleg: hätte der Schalter nur halb gegriffen, wäre
das der C7-Fehler gewesen, der hier aus t 5,96 schon einmal t −0,75 gemacht hat.

**Merken für später:** die zwölf Protokolle von heute tragen **1.2.0**. Wer sie mit
künftigen Läufen vergleicht, vergleicht zwei Maschinen — genau dafür gibt es die
Versionsnummer.

### Zu (4): die Dauer ist Bauart, nicht Nachlässigkeit — und zwei Entscheidungen des PM

**Gemessen und vom PM im Quelltext bestätigt:** ein Aktualisierungslauf ist **kein**
Nachholen eines Tages, sondern ein vollständiger Neuabruf. `range` steht je Intervall
fest verdrahtet (`730d` für 60m, `40y` für 1d — `yahoo-60m-holen.js:59-60`); einen
inkrementellen Modus **gibt es nicht**. Deshalb 97 Minuten je Archiv, auch wenn nur ein
Tag fehlt. Zusammen rund **3 Stunden 20**.

**Entscheidung 1 des PM — die Sperrdatei wird gebaut.** Start 22:15, Ende gegen 01:35,
Analytiker 03:15: 1 Stunde 40 Puffer. Das ist als **einzige** Sicherung zu wenig, und der
Schadensfall ist der unangenehme — ein **gemischtes** Archiv (halb aktuell, halb einen
Tag alt) sieht von außen gesund aus. Das Abrufwerkzeug legt künftig während des Laufs
eine Sperrdatei an; der Wachhund meldet sie mit **Exit 2** („nicht prüfbar, es wird
gerade geschrieben"). Damit fragt man den Zustand, statt auf die Uhr zu vertrauen — die
Lehre, die heute schon zweimal getragen hat.
**Auflage des PM:** die Sperrdatei muss einen Absturz überleben können. Bleibt sie nach
einem harten Abbruch liegen, sagt der Wachhund für immer „wird gerade geschrieben" —
das wäre die Stille von heute in ihrer dritten Verkleidung. Zeitstempel hinein, nach
großzügiger Frist als verwaist melden.
**Der Analytiker gehört nicht dem Master.** Er baut Sperre und Exit 2; dass die
Nacht-Rolle vor ihrer Messung fragt, **trägt der PM nach**.

**Entscheidung 2 des PM — der Alarm wird eine datierte Datei im Datenordner.** Nicht
Issue, nicht App-Anzeige. Der PM läuft sechsmal täglich und liest ohnehin den Stand; er
nimmt die Alarmdatei in seinen Durchgang auf und meldet sie Wilhelm im Klartext. So
entsteht kein neues System und keine Issue-Flut, und der Weg endet bei einem Menschen
statt in einer Liste.
**Das hat der PM entschieden, nicht Wilhelm — er kann es mit einer Zeile drehen.**

> **Für den PM selbst, bei jedem Lauf zu prüfen:** liegt im Datenordner eine
> Wachhund-Alarmdatei? Wenn ja, gehört sie in den nächsten Bericht.

### ✅ (4) IST FERTIG — die Aufgabe `archiv-nachladen` läuft ab heute Nacht

**Angelegt vom PM am 26.08. um 16:20**, nachdem der Master gemeldet hatte und der PM
gegengeprüft hat. Der Prüflauf ist vom PM selbst gefahren worden
(`node tools/archiv-nachladen.js --nurpruefen`): beide Archive 100 % auf Stand,
**Exit 0**, keine Meldedatei.

| | |
|---|---|
| Aufgabe | `archiv-nachladen`, täglich **22:15** |
| Befehl | `node tools/archiv-nachladen.js` |
| Dauer | ~3 h 20, Ende gegen 01:35 |
| Alarm | datierte Datei `archiv-alarm-JJJJ-MM-TT.txt` im Datenordner |

Die Aufgabe ist bewusst **eng geschrieben**: ein Befehl, ein Bericht, keine
Reparaturversuche, kein Quelltext, kein Commit, keine Version. Ein halb repariertes
Archiv wäre schlimmer als ein erkennbar veraltetes.

**Der Analytiker ist an der Leine** (PM hat seine Rolle ergänzt, 26.08.): Er fragt vor
jeder Messung `node tools/archiv-wachhund.js` statt auf die Uhr zu sehen. **Exit 2 heißt:
nicht auf den Archiven messen** — dann bleiben ihm die Blöcke A, C und F, die keine
Archivdaten brauchen. Bei Exit 1 misst er, schreibt aber den Rückstand in den Befund,
weil sein `bis` dann nicht das heutige Datum ist.

**Der Absturz-Einwand war nicht theoretisch.** Beim Erproben ist dem Master genau das
passiert: ein hart abgebrochener Lauf hat seinen Aufräum-Handler **nicht** ausgeführt und
die Sperre liegengelassen — unter Windows ist auf diese Handler kein Verlass. **Damit ist
die Verwaisungsfrist (6 h) nicht der Notnagel, sondern die eigentliche Sicherung.** Eine
unlesbare Sperrdatei gilt ebenfalls als verwaist; ein Schreibfehler darf die Messung
nicht auf Dauer stilllegen.

**Vierte Verkleidung derselben Stille, vom Master beim Erproben gefunden und
geschlossen:** verwaiste Sperre **und** frisches Archiv ergab Rückstand null, Exit 0 —
und **keine Datei**. Der abgestürzte Lauf stand nur auf einer Konsole, die nachts niemand
liest. Jetzt wird auch dort geschrieben, mit der Überschrift **HINWEIS** statt ALARM,
Rückgabewert bleibt 0 (er beantwortet „ist das Archiv benutzbar" — und das ist es).

**Für den PM, Unterscheidung im Durchgang:** `ARCHIV-ALARM` = *die Daten sind nicht in
Ordnung*. `ARCHIV-HINWEIS` = *die Daten sind in Ordnung, aber ein Lauf ist gestorben*.

*Nebenbei berichtigt (Master): `anteilAufStand` meldete 0 %, wenn das Archiv dem Solltag
**voraus** ist. „Auf Stand" heißt jetzt „nicht dahinter".*

### ~~⚙ VORRANG — tägliche Nachladung~~ **ERLEDIGT, siehe oben.** *(Auftragstext bleibt als Beleg stehen, was beauftragt war.)*



**Wilhelm hat dies vor die Fragen (1) und (2) gestellt.** Zugeteilt an den
**App-Codebase Master** — er kennt das Werkzeug seit heute.

**Was gebraucht wird:** ein Kommando, das beide Archive nachlädt und danach den Wachhund
auswertet. Die Bausteine liegen alle schon da:

```
MD_INTERVALL=60m node tools/yahoo-60m-holen.js alle --aktualisieren
MD_INTERVALL=1d  node tools/yahoo-60m-holen.js alle --aktualisieren
node tools/archiv-wachhund.js          # Exit 1 bei Rueckstand ab zwei Tagen
```

**Drei Punkte, die vor dem Einrichten geklärt sein müssen — sie sind der eigentliche
Auftrag, nicht das Kommando:**

1. **Dauer.** Gemessen wurden heute 2,0 s je Wert bei 2.913 Reihen — rund 97 Minuten je
   Archiv, also **über drei Stunden für beide**. Das ist tragbar, aber es muss bekannt
   sein, bevor eine Uhrzeit gewählt wird.
2. **Kollision mit dem Analytiker (03:15).** Er rechnet auf genau diesen Archiven. Läuft
   die Nachladung um 03:15 noch, **misst er auf einem halb geschriebenen Archiv** — das
   ist dieselbe Klasse Fehler wie die, die heute repariert wurde, nur andersherum.
   Entweder früh genug starten (US-Schluss ist 22:00 unserer Zeit) oder eine Sperre, die
   beide Seiten kennen.
3. **Was bei Alarm passiert.** Der Wachhund endet mit Exit 1. Was die Aufgabe damit tut,
   gehört festgelegt — schweigen wäre der Fehler von heute in neuer Form.

**Der Master baut und erprobt; die Aufgabe selbst legt der PM an**, sobald er
„erprobt" meldet. Kein Blindstart.

**Zum laufenden `ausstieg`-Schalter:** nicht halbfertig liegen lassen. Er muss an allen
drei Stellen zugleich greifen; ein Abbruch mittendrin hinterlässt genau den C7-Zustand,
vor dem der Auftrag warnt. Einschieben, sobald ein sauberer Punkt erreicht ist.

### ~~⚙ ZUGETEILT — `ausstieg`-Schalter~~ **ERLEDIGT 26.08.** (`8fc2c8a`, heißt jetzt `ausstiegsZeitpunkt`)

*Wilhelm 26.08. 09:00, Antwort 2a. Der wertvollste freie Auftrag: er blockiert **zwei**
vorregistrierte Tüftler-Kandidaten (`glockendruck-nacht`, `nachtstoss-umkehr`) — von
beiden ist ohne ihn nur das Tagbein messbar. **Bedingung 1 (eigener Zweig) ist hinfällig**,
sie galt nur für die Dauer des Rechenlaufs; **Bedingung 2 (alle drei Stellen zugleich)
bleibt hart.***

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

**(4) ~~NEU und dringender als die anderen drei — soll das Kursarchiv künftig von selbst nachladen?~~ BEANTWORTET 26.08. 15:30: (a), mit Vorrang.**
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

**(5) NEU — soll der Projekt-Manager auch nachts einmal laufen?**
Der neue Ablauf steht, aber er hat eine Lücke, die nur du schließen kannst. Die vier
nächtlichen Rollen enden zwischen 01:35 und 05:00 — **zu dieser Zeit läuft kein
Projekt-Manager** (er läuft 08, 11, 14, 17, 19, 21 Uhr). Ihre zehn Minuten Bereitschaft
laufen dort ins Leere, und ihre Übergaben liegen bis 08:00. Nichts geht verloren, aber
die Nacht bleibt sechs bis sieben Stunden unverteilt.
- **(a)** Ein zusätzlicher Durchgang um **05:30**, direkt nachdem die letzte Nachtrolle
  fertig ist. Er sammelt die Nacht ein, verteilt sofort und legt dir um 08:00 einen
  Bericht vor, der schon Antworten enthält statt nur Meldungen.
- **(b)** So lassen — die Übergaben warten bis 08:00, das reicht.
- **(c)** Statt eines festen Durchgangs die Nachtrollen später legen, damit sie in
  Reichweite eines bestehenden Durchgangs enden.
*Empfehlung: **a**.* Es kostet einen Durchgang und schließt genau die Lücke, wegen der du
den Umbau bestellt hast. **(c)** empfehle ich nicht: die Nachtzeiten sind nicht beliebig,
der Analytiker misst nach dem Archiv-Nachladen, und Verschieben würde diese Kette
durcheinanderbringen.
**Das ist eine Änderung an meinem eigenen Zeitplan — deshalb frage ich, statt es zu tun.**

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

- **26.08.2026, 18:20 — Nacht-Typ B (Datenbestand).** Warteschlange bei Beginn 2, formal
  kein Stau — **bewusst kein dritter Entwurf**: beide offenen messen dasselbe Fenster
  (Familien-Testzahl schon 4) und warten auf dieselbe ungebaute Vorbedingung.
  Stattdessen die **Überlebenslücke des großen Archivs vermessen**
  (`studien/tueftler/2026-08-26-nacht3-ueberlebensluecke.md`, zwei Werkzeuge, zwei
  Ablagen). **Über 2008–2026 fehlen mindestens 12,7 % des Querschnitts**, steigend von
  ~8 % (2008) auf ~20 % (2023), ausschließlich Nicht-Überlebende; vor dem 29.06.2004
  nicht einmal diagnostizierbar. **Und sie ist mit den vorhandenen Mitteln nicht zu
  schließen:** Yahoo liefert 1 von 46 (und in **7 von 46 einen Fonds unter demselben
  Kürzel** — `MUTUALFUND`/`YHD`/Währung null, die stille Falle), die zweite Quelle
  deckelt auf den Tag genau bei zwei Jahren (2024-08-25 → 403, 2024-08-27 → 200, mit
  Positivprobe abgesichert). **Zwei Funde, die andere angehen:**
  `tools/massive-tagesdaten.js:29` fragt ab 2023-11-13 an und bekommt stillschweigend
  abgeschnittene Daten ab 2024-08-23 — neun Monate kürzer, ohne Warnung; und
  `verschwundene.json` führt **AVB, EQR, LBRDA, LBRDK, WBS** als delistet, obwohl alle
  fünf heute an ihrer Heimatbörse handeln (≥ 15 % des jüngsten Rands falsch).
  **Neuer Auftragsvorschlag C** — eine Entscheidung für Wilhelm, kein Bauauftrag; der
  Tüftler rät, erst auf den schon beschafften 1.164 die *Richtung* der Verzerrung zu
  messen, bevor über eine bezahlte Stufe entschieden wird. Drei eigene Fehler im Lauf
  gefunden und korrigiert (Einträge statt Kürzel gezählt, Urteilsregel zu grob,
  Windows-Pfad im Heredoc verloren). 0 von 5 Firecrawl-Suchen verbraucht.
  **Warteschlange jetzt: 2 offene Entwürfe, 1 Auftragsvorschlag.**
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

- **Berechnungen** (seit 26.08. 19:47) — **Richtung der Überlebensverzerrung messen**
  (PM-Freigabe 19:15, Reihenfolge bestätigt: Verzerrung → Strang A → #92). Erster
  Schritt: Vorregistrierung nach `studien/vorregistrierung-2026-08-26/`, Meldung an den
  PM, **bevor** gerechnet wird. Belegt nur neue Dateien unter `studien/`; fasst
  `messmaschine.js` nicht an. Hinweis des Tüftlers ist eingearbeitet: nur die drei
  Protokolle mit Aussicht unter 1.500 Handelstagen sind überhaupt drehbar.

- **App-Codebase Master** — **Stufe F (3) erledigt** (`779c02c`), Übergabe liegt im
  Briefkasten. Erst gemessen (neue Sonde `tools/a11y-probe.js`), dann repariert:
  **hell 23 Befunde, dunkel 8 → beide null**, bei MEHR geprüften Textstellen als vorher
  (1.757 gegen 1.681) — das Grün kommt nicht vom Wegsehen. Sechs Farbmarken lagen unter
  der Lesbarkeitsschwelle 4,5, schlechtester Fall 3,41. Eine Tabelle hatte keine
  Kopfzelle (Regelkopf unter Strategien).
  **Zwei der vier Punkte im Plan bestätigen sich NICHT** — kein aria-live-Bereich ist zu
  breit, kein positiver tabindex, kein namenloses anspringbares Element. Bitte nicht
  „reparieren", das wäre ein Eingriff in Funktionierendes.
  **Offen und in der Übergabe benannt (Punkt 4): die Fokusreihenfolge IN DIALOGEN ist
  nicht gemessen** — die Sonde öffnet keine. Einer der vier Punkte steht also aus.
  Nichts belegt, frei für den nächsten Auftrag.

- **App-Codebase Master** — war seit **15:15 am `ausstieg`-Schalter** (PM zugeteilt,
  belegt `studien/messmaschine/messmaschine.js`). **V4 wurde ausdrücklich NICHT zugeteilt** —
  Begründung unter „Richtigstellung" oben.

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

- **26.08. (5. Lauf, ~15:00, nachmittags)** — archiv60m war gesperrt (Nachzieh-Lauf seit 14:13 UTC), deshalb nur A/C/E/F ohne Archive; B/D entfallen, ersatzweise alle 12 Protokoll-Placebos geprüft (|t| ≤ 1,25). A und C bestanden (Kanten-Anzeige unabhängig nachgebaut, ZTHR-Nachbildung geprüft); **2 Funde: #98 (B10-Überlappungs-Wächter toter Code, 0/38 Protokolle, Gattung #86) und #99 (Depot-Reset 25.08. löschte 37/38 Kostenrunden; die 38 Runden sagen 0,0855 % gegen 0,10 % Annahme — konservativ)**; F-Rotation Punkt 3 (Clusterung über Tage) vertieft: Methode trägt, Lag-Einheiten-Wortlaut falsch, aber synthetisch entlastet (Fehlalarme 6,6 % statt 9,1 %), Details `studien/analytiker/2026-08-26-fuenfter-lauf/`; Richtigstellung zum 4. Lauf: „seit fünf Tagen keine Kostenrunde" war falsch. Nächste Nacht: D vollständig über die 12 frischen Protokolle (Sonntags-Regel vorziehen, sobald Archive frei), sonst F-Punkt 4 (Überlebensverzerrung).
- **26.08. (4. Lauf, ~09:00, außerplanmäßig)** — bewusst leicht während der Neumessung (Maschine nicht aufgerufen): die 6 vorliegenden 1.2.0-Protokolle unabhängig nachgerechnet — 17/17 Variantenurteile, delta80 und tage80 exakt bestätigt (#91 wirkt im Feld, alte Formel hätte z. B. 168 statt 224 gesagt), `codeStand 6a7d9e29db6f` einheitlich, alle 6 Protokoll-Placebos |t| ≤ 1,25; C und E unverändert bestanden; **1 Fund gemeldet (#92: `bestesUrteil`-Rangfolge kann `widerlegt` verdecken, `bestaetigt-aber-nullpunkt-verschoben` unrepräsentierbar — latent, aber (1a) macht die Zahl zur maßgeblichen Anzeige)**, Details in `studien/analytiker/2026-08-26-vierter-lauf/BEFUND.md`; nächste Nacht D über die vollständigen 12 frischen Protokolle, sonst F-Rotation Punkt 3 (Clusterung über Tage).

---

## Auditor

*Die Qualitätssicherung der **Oberfläche**: startet die App isoliert, klickt jeden Reiter
und jede Pille, sieht sich die Bildschirmfotos an und meldet, was funktional kaputt (A)
oder optisch entstellt (B) ist. Schwerpunkt sind die Flächen aus der Änderungsmenge seit
dem letzten Lauf, dazu ein Rotationsblock. Repariert wird nichts — das tut eine Bausitzung.*

- **26.08. (2. Lauf, ~09:00)** — geprüft `a502c99..9652f97` (29 Commits; Schwerpunkt: die von sieben auf zehn Spalten gewachsene Bestandstabelle unter Vermögen → Meine Papiere, #83/#89), Rotationsblock `depot`. `npm test` **grün**, `ui-probe` **grün**, 0 unbehandelte Fehler. Erstmals mit **gesätem Testprofil** — der erste Lauf sah genau diese Tabelle nur leer. **0 A**, **2 B** (**#93** Zahl und Einheit brechen bei 1000 px auf zwei Zeilen, `309.90` und `$` untereinander — Regression aus dem Spaltenwachstum; **#94** englisches Zahlenformat statt deutschem und graue statt rote Verluste, während dieselben Werte auf *Heute* deutsch und rot stehen — `U.money`/`U.nf2`/`U.signCls` ungenutzt), **3 C** im Befund. Zwei eigene Funde gegengeprüft und **erledigt**: #90 (Laufband jetzt schiebbar, alle 6 Links erreichbar) und der Dunkel-Blitz (Stufe F Punkt 1, `thema.js` greift). Beide B-Funde stecken in der ausgelieferten **v8.33.3**. Details in `studien/auditor/2026-08-26-lauf2/BEFUND.md`. Nächster Rotationspunkt: **messung**.
- **26.08. (3. Lauf, ~17:00)** — geprüft `9652f97..d964891` (49 Commits; Oberflächen-Dateien: `index.html`, `depot.js`, `bestandui.js`; Schwerpunkt: der umgezogene Depotverlauf-Kopf `#eqPanel`→`#eqKopf`, der `<th scope="row">`-Umbau im Regelkopf und die neue Urteilswahl nach Protokoll), Rotationsblock `messung`. `npm test` **grün**, `ui-probe` **grün**, `a11y-probe` in **beiden** Themen grün (Stufe F (3) trägt), 0 Seiten- und 0 Konsolenfehler. Erstmals mit **gesätem Datenordner** — ohne Messprotokolle läuft der Kern dieser Änderungsmenge ins Leere. **1 A**, **3 B**, **2 C**. **#100 (A)**: der Beleg im Regelkopf sieht die Protokolle nie — `kantenAusProtokollen()` ruft danach nur `huerdeAnzeigen()`, nicht `regelKopfAnzeigen()`; die Zeile behauptet „Kein Messprotokoll im Datenordner", während die Hürde sechs Zeilen tiefer das Protokoll vom 26.08. zeigt. **Damit ist Wilhelms Entscheid 2b (Hinweis bei „nicht bestätigt") in v8.33.4 ausgeliefert, aber in der Anzeige tot** — Ursache älter als die Änderungsmenge, nicht deren Regression. **#101 (B)** „Max. Rücksetzer" trägt `class="down"`, aber `.down` ist nur unter `#cockpit` definiert — Verlust steht schwarz (gemessen `rgb(11,11,11)` statt `rgb(208,59,59)`). **#102 (B)** roher Schlüssel `nicht-bestaetigt` in der Kostenhürde, während das Scoreboard „nicht bestätigt" schreibt; `scoreboard.js` hat `label()` dafür, exportiert sie aber nicht. **#103 (B)** Regression aus 779c02c: der `<th>`-Umbau zieht `text-transform`/`letter-spacing`/`font-size` aus `table.tbl th` mit — Zeilenköpfe in Großbuchstaben, und unter der letzten Zeile bleibt ein 130 px langer Reststrich. Eigene Funde der Vornacht gegengeprüft und **erledigt**: **#93** (alle Zahlzellen bei 1000 px einzeilig) und **#94** (deutsche Schreibweise, Verluste rot). Details in `studien/auditor/2026-08-26-lauf3/BEFUND.md`. Nächster Rotationspunkt: **strategien**.
---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **26.08.2026, abends (PM-Chat) — die QS/Audit legt ihre Funde selbst als GitHub-Issues
  an und benachrichtigt den PM.** Wilhelm: „beides bitte als issue und dich
  benachrichtigen" — auf die zwei A-Funde des Abends (#96-Regel gestoppt,
  Kostenannahme-Beleg zu 58 % Krypto). Gilt ab jetzt allgemein für A- und B-Funde der
  QS; ihre übrigen Grenzen (prüfen und melden, nicht bauen, keine Version) bleiben.

- **26.08.2026, abends (PM-Chat) — Routinen aufgeräumt, Chats in Dauerbereitschaft.**
  Wilhelms Anordnung an den neuen PM-Chat: `literatur-recherche-uebernacht` und
  `projekt-manager-abruf` gelöscht (redundant), PM-Routine als Notstart umgeschrieben,
  Release-Wache baut künftig im Hintergrundkommando; Chat-Sitzungen halten sich nach
  Abschluss mit `sleep 600` wach (Details im Nachtrag 19:45 oben).

- **26.08.2026, 19:05 — die Issue-Wache läuft nur noch 8, 13 und 15 Uhr.**
  Vorher alle 30 Minuten, also 48 Läufe am Tag. Wilhelms Anweisung, nachdem die CPU auf
  97 % stand.
  **Der gemessene Grund:** 85 Claude-Prozesse liefen, **genau eine Sitzung arbeitete
  wirklich.** Jeder abgeschlossene Routine-Lauf lässt seinen Prozess stehen — rund 5 % CPU
  und 370 MB, dauerhaft. 85 × 5 % ÷ 16 Kerne = **96 %**, exakt die gemessene Last. Neun der
  Leichen waren von der Issue-Wache, dreizehn von der Release-Wache.
  **Sie hatte den längeren Takt selbst vorgeschlagen** (Übergabe 17:32): seit sie nur noch
  sichtet, ist Leerlauf der Normalfall.
  **Folge für alle Rollen:** Ein abgeschlossener Lauf ist nicht kostenlos. Wer einen Takt
  entwirft, rechnet die Prozesse mit, die er hinterlässt.

- **26.08.2026, 18:55 — #96: die Platzhalterkerze wird verworfen.**
  Wilhelm: *„müssen wir beheben wir brauchen alle kerzen keine platzhalter"*.
  Sein Satz sagt beides: **Platzhalter raus, alle echten Kerzen bleiben.** Nicht (b)
  stehen lassen, nicht (c) auf einen Feiertagskalender warten.
  **Die Gefahr liegt in der Bedingung, nicht im Auftrag** — eine Regel, die Kerzen
  wegwirft, löscht bei falschem Zuschnitt echte Daten, und zwar unwiederbringlich.
  Auftrag mit fünf Auflagen siehe oben.

- **26.08.2026, 17:40 — drei Entscheidungen: „c (schau mal was das kosten würde), b und d, a"**

  **(C) Überlebenslücke → (c): erst die Richtung der Verzerrung messen.** Nicht Daten
  kaufen, nicht die Lücke bloß ausweisen. Gemessen wird auf den **1.164 bereits
  beschafften Verschwundenen**: wie stark und in welche Richtung verzerrt die Lücke?
  *Wilhelm will zusätzlich die Kosten einer bezahlten Quelle wissen — als Information für
  später, nicht als Kaufauftrag.* Kostenschätzung siehe unten.

  **(1) → (b) UND (d).**
  **(b)** Die Aussicht je Strategie wird angezeigt, und wer mehr als rund 2.500
  Handelstage braucht, wandert in einen eigenen Abschnitt „nicht entscheidbar mit diesen
  Daten". **Wählbar bleibt alles** — Hinweis, kein Eingriff.
  **(d)** Künftig werden **nur noch Kandidaten entworfen, deren Aussicht vorab unter
  1.000 Handelstagen liegt.** Das ist eine Regel für den Strategie-Tüftler und gilt ab
  sofort — die Wand wird zur Eintrittskarte statt zur Nachbemerkung.

  **(2) → (a): das schärfste Urteil gewinnt immer.** `widerlegt` schlägt alles andere;
  `bestaetigt-aber-nullpunkt-verschoben` gehört in die Rangfolge aufgenommen. Kein
  zusätzlicher Uneinigkeits-Hinweis (das wäre (b) gewesen), kein Vertagen (c).
  Das ist **#92**, `messmaschine.js:1214–1215`.

- **26.08.2026, 18:35 — der große Plan ist angenommen, das Abbruchkriterium verschärft.**
  Wilhelm zu allen drei Vorlagen: **„ja, ja, ja"** —
  (1) **Strang A** (`momentum` nicht überlappend messen) wird angefangen.
  (2) **Basiswert statt Schein** als Regelfall — der stärkste Einzelhebel.
  (3) Das **Abbruchkriterium** gilt, **aber nicht so, wie der PM es vorgeschlagen hatte.**
  Wörtlich: *„nach messverfahrensprüfung und gegenprobe mit ideenfindung warum es nicht
  geklappt haben könnte, wenn dann immernoch nichts bei rumkommt ist das wohl das
  abbruchkriterium, ich will zu 100 % sicher sein nicht zu 99,9"*.
  **Vor jedem Abbruch drei Stufen:** Messverfahren prüfen (Placebo, Nullpunkt,
  Kontrolltopf, Live-gleich-Messung) → Gegenprobe mit Ideenfindung, *warum die Messung
  eine vorhandene Kante übersehen haben könnte* (Wand, Überlebenslücke, geteilte Kurse,
  Haltedauer, Kosten, Produkt, Zeitzonen, Universum, Testfamilie, Regime) → erst dann Ende.
  **Der Vorschlag des PM war zu billig** und hätte einen Abbruch erlaubt, dessen wahrer
  Grund ein kaputtes Messgerät ist. Ausführlich in `studien/grosser-plan-2026-08-26/PLAN.md`,
  Teil IV-a.
  **Abgeleitete Reihenfolge, vom PM vorgelegt:** Datenqualität → Strang A → Strang B.
  Strang A auf einem Universum zu messen, dem 12,7 % Nicht-Überlebende fehlen, erzeugt ein
  Ergebnis, das Stufe 2 ohnehin wieder einkassiert.

- **26.08.2026, 15:30 — Frage (4): das Kursarchiv lädt künftig von selbst nach.**
  Wilhelm: *„Dann lass uns doch erst 4 vervollständigen oder?"* → **(a) tägliche
  Aufgabe**, und sie hat **Vorrang vor den offenen Fragen (1) und (2)**. Nicht (b) nur
  melden, nicht (c) von Hand.
  Der PM hatte (a) empfohlen: (b) verlegt nur den Handgriff, und der ist zweimal zwei
  Tage lang ausgeblieben; (c) ist genau der Zustand, der die zwei Tage gekostet hat.
  **Umsetzung siehe Auftrag „tägliche Nachladung" oben.** Die Aufgabe selbst legt der PM
  an, sobald der Master das Kommando erprobt gemeldet hat — nicht vorher, denn eine
  falsch eingerichtete tägliche Aufgabe erzeugt genau wieder die Stille, die gerade
  repariert wurde.

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
