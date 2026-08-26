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

3. **Jede Rolle meldet sich beim PM, wenn sie fertig ist — per Nachricht, nicht nur per
   Datei.** Wilhelm: *„stell auch bitte sicher das sich alle Teammitglieder bei dir
   melden wenn sie fertig sind! per message"*. Vier Angaben genügen: wer du bist, was
   fertig ist, der wichtigste Fund in einem Satz (oder ausdrücklich „nichts gefunden"),
   was du als Nächstes brauchst. **Die Übergabe-Datei bleibt Pflicht** — sie geht nie
   verloren, erreicht den PM aber erst beim nächsten Durchgang; die Nachricht erreicht
   ihn sofort und macht die Bereitschaft erst nutzbar. In allen sieben Routinen-Rollen
   eingetragen, an die laufenden Chats verteilt.

4. **Fragen an Wilhelm gehen als Formular, nicht als Fließtext** (`AskUserQuestion`):
   Kopfzeile, zwei bis vier Optionen, empfohlene zuerst, Begründung in der Option.
   Sein Wortlaut: *„nicht solche walls of text pleeassee"*. Steht in
   `studien/rolle-projekt-manager.md` Punkt 6.

### 🔴 26.08. 21:45 — **„Versendet" heißt nicht „zugestellt".** Zehnte Verkleidung, diesmal beim PM

**Wilhelm meldete, dass die Nachrichten des PM bei den Sitzungen nicht ankommen** —
obwohl `SendMessage` **jedes Mal Erfolg meldete**. Nachgemessen: Die Erfolgsmeldung
bedeutet nur *in die Warteschlange gelegt*. Zugestellt wird erst beim **nächsten
Arbeitsschritt der Empfänger-Sitzung**.

**Eine Chat-Sitzung, die ihren Zug beendet hat und auf Wilhelms Eingabe wartet, arbeitet
nicht — sie holt die Warteschlange nie ab.** Die Nachricht liegt unsichtbar da, für
beide Seiten.

**Der Fehler des PM war die Deutung:** Er hat das Schweigen von vier Sitzungen zwei
Stunden lang als „arbeitet gerade" gelesen. Genau dasselbe Muster, das er an diesem Tag
neunmal bei anderen gemeldet hatte — *der Erfolgsnachweis prüft etwas anderes als das,
worauf es ankommt.* Hier prüft er das Absenden, nicht das Ankommen.

**Regeln ab sofort, für alle:**

- **Eine Nachricht gilt erst als zugestellt, wenn geantwortet wurde.** Schweigen ist kein
  Beleg für Arbeit — es ist gar kein Beleg.
- Bei wichtigen Aufträgen `notify_when_idle: true` mitgeben. Das meldet, wenn die
  Gegenstelle ihren nächsten Zug beendet, und ist der einzige belastbare Hinweis, dass
  dort jemand zuhört.
- **Die Wach-Schleife ist keine Kür, sondern die Voraussetzung dafür, dass Punkt 2 oben
  überhaupt funktioniert.** Wer sie nicht fährt, ist nach seinem letzten Satz taub.
- **Die Übergabe-Datei bleibt der einzige Kanal, der ohne wache Gegenstelle trägt.**
  Deshalb bleibt sie Pflicht, auch wenn die Nachricht bequemer ist.
- Ist eine Sitzung taub, hilft nur ein Anstoß durch Wilhelm in ihrem Fenster.

### 🔴 26.08. 23:25 — die Ursache ist gefunden, **und der PM-Chat bleibt trotzdem taub**

**Wilhelm hat die Ursache gefunden, nicht der PM:** Der alte Projekt-Manager hatte sich
per `set_session_title` ebenfalls **„Projekt-Manager"** genannt. Es gab also **zwei
Sitzungen mit identischem Namen**, und jede Nachricht an diesen Namen ging an ihn — in
beide Richtungen. Deshalb blieb es beidseitig still, während beide Seiten „Erfolg"
gemeldet bekamen.

**Belegt an der Erfolgsmeldung selbst** (Beobachtung des Desingners): Vor dem Löschen
trug sie den Zusatz *„a Remote Control or cloud session also named 'Projekt-Manager' is
registered to a session on this machine"*. **Nach dem Löschen ist dieser Zusatz weg** und
die Ref `[39e5a9]` wird ohne Rückfrage angenommen. Die Adressierung ist damit sauber.

**Eine Testnachricht des Desingners kam um 23:25 trotzdem nicht an.** Der PM schloss
daraus, sein Empfang sei defekt, und schrieb das hier hin.

### ✅ 26.08. 23:39 — **das war falsch. Der Kanal trägt.** (Richtigstellung, gemessen)

**Wilhelm ließ den Prozess nachstellen:** eine einmalige Routine `pm-zustellprobe-einmalig`
mit ausdrücklich unverwechselbarem Namen. **Ihre Nachricht kam um 23:39 beim PM-Chat an**,
die Antwort ging zurück. **Der Empfang ist nicht defekt** — die vorige Diagnose ist
hiermit zurückgezogen.

**Damit war die Namenskollision sehr wahrscheinlich die alleinige Ursache**, und ihre
Beseitigung hat gewirkt. Warum die Probe des Desingners um 23:25 dennoch nicht ankam,
**bleibt offen** — vermutlich lag sie zeitlich zu dicht am Löschen des Doppelgängers.
*Offene Frage, nicht geklärt.*

**Der Fehler des PM daran, und er ist der lehrreichste des Abends:** Aus **einer**
ausgebliebenen Nachricht wurde ein Systembefund („Empfang defekt") — ohne
Positivkontrolle, also ohne zu prüfen, ob überhaupt jemand sendet, der gerade senden
kann. Genau die Hausregel, die die QS am selben Abend aufgestellt hatte: **jeder
Nullbefund braucht eine Positivkontrolle.** Ein Nullbefund ohne sie ist keine Diagnose,
sondern eine Vermutung mit Zahlen daneben. Wilhelm hat die Positivkontrolle angeordnet,
nicht der PM.

**Was daraus folgt — für morgen früh, damit niemand wieder zwei Stunden sucht:**

1. **Der Kanal ist benutzbar.** Nachrichten an `Projekt-Manager` (Bindestrich,
   `interactive`) kommen an. Bleibt eine Antwort aus, ist die Gegenstelle vermutlich
   **schlafend**, nicht defekt — Anstoß oder Wach-Schleife, nicht Fehlersuche.
2. **Eine Routine wäre der falsche Schluss.** Der Chat ist die richtige Bauart — die
   Routine lief nur sechsmal täglich, nachts nie, und hieß in der Agentenliste
   `markt-dashboard-54`. Der Empfangsdefekt ist ein separater Fehler, kein Argument gegen
   den Chat.
3. **Nie zwei Sitzungen mit demselben Namen.** Wer sich umbenennt, prüft vorher, ob der
   Name schon vergeben ist. Ein Doppelgänger ist schlimmer als ein kryptischer Name: Beim
   kryptischen weiß man, dass man ihn nicht findet — beim Doppelgänger glaubt man, man
   habe ihn gefunden.
4. **Der Dateiweg hat den ganzen Abend getragen und alles Wichtige transportiert.** Die
   Verzerrungsmessung, #80, #96 und der Strang-A-Entwurf sind **ohne eine einzige
   zugestellte Nachricht** entstanden — über Übergabe-Dateien und diese Tafel.

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

### 🔴 Ein Urteil ist gekippt — und der eigentliche Fund ist, dass die Grenze Rauschen ist

**`rsi2seit-mcp`: nicht entscheidbar → nicht bestätigt.** Zwei von fünf Varianten wechseln,
damit das `bestesUrteil` der ganzen Strategie.

**Woran es hängt:**

| | Überschuss | MDE | Abstand |
|---|---|---|---|
| Var 3 **alt** | 0,0552 | 0,0554 | **−0,0002 Pp** |
| Var 3 **neu** | 0,0554 | 0,0553 | **+0,0001 Pp** |
| Var 4 alt | 0,0593 | 0,0597 | −0,0004 Pp |
| Var 4 neu | 0,0600 | 0,0596 | +0,0005 Pp |

**Das Urteil der Variante 3 hängt an 0,0001 Prozentpunkten** — einem Zehntausendstel, einem
Viertelprozent der Aktienhürde. An der Strategie hat sich nichts geändert; es sind zwei
Handelstage dazugekommen.

**Und es ist heute das zweite Mal.** Vom PM in `studien/neumessung-2026-08-26/AUSGABE.md`
Zeile 44–45 nachgesehen — heute früh kippte **dieselbe Variante** in die **andere**
Richtung: *„nicht-bestaetigt → nicht-entscheidbar, Überschuss 0.0556 → 0.0552 gegen MDE
0.0554 (Abstand −0,0002 Pp)."*

**Zweimal an einem Tag, in beide Richtungen, auf Margen von 0,0002 und 0,0001 Pp.**

**Der Fund ist deshalb nicht „rsi2seit-mcp ist jetzt nicht bestätigt".** Er ist:

> **Die Grenze zwischen „nicht entscheidbar" und „nicht bestätigt" ist bei dieser Strategie
> keine Eigenschaft des Marktes, sondern Rauschen.**

Und auf genau diesen Etiketten steht die Kopfzeile dieser Tafel — *„2 nicht bestätigt, 9
nicht entscheidbar, 1 nicht messbar"*. **Die 2 war heute schon 3 und wieder 2.**

*Einordnung, damit es nicht größer klingt als es ist:* **„bestätigt" war nie in Reichweite.**
Die Bonferroni-Schwelle liegt bei fünf Tests auf 2,576, t steht bei 2,00. Es wechselt nur
die **Art des Nein**, nicht das Nein selbst.

### Die Folge für den Plan: die Eintrittskarte hat keinen Kandidaten mehr

`rsi2seit-mcp` war eine der **drei** Strategien unter 1.500 Handelstagen. Steht sie auf
„nicht bestätigt", sind **alle drei erledigt**:

| Strategie | Aussicht | Urteil |
|---|---|---|
| monatsende-kauf | 187 | nicht messbar (17 Tage, A7-Warnung — Zahl entwertet) |
| kapitulation | 224 | **nicht bestätigt** |
| rsi2seit-mcp | 1.070 | **nicht bestätigt** |

**Aus dem laufenden Korpus kommt nichts mehr nach, was die 1.000-Tage-Eintrittskarte
durchließe und noch offen wäre.** Neues muss aus **Strang A** (momentum, nicht
überlappend) oder **Strang B** (Übernacht-Familie) kommen. Das ist keine Katastrophe —
aber es gehört neben das Abbruchkriterium, weil es dessen Voraussetzungen ändert.

*Zur Sorgfalt der QS:* Der abgeschossene erste Lauf hatte `rsi2seit-mcp` **fertig
gemessen** und das Protokoll um 19:45 geschrieben; verloren ging nur die Bildschirmausgabe,
weil Node beim harten Abschuss den Puffer nicht leert. **Ein unabhängiger Zweitlauf misst
gerade nach.**

**Stand Block D: 7 von 9 — sechs stabil, eines gekippt.** Es fehlen `winkelbestaetigt` und
`winkelgrad`. Die drei Tagesarchiv-Protokolle bleiben gesperrt (`archiv1d`, über 2 h) —
darunter `momentum`, also Strang A.

**Alle Skripte und Rohergebnisse liegen dauerhaft** unter
`Markt-Dashboard-Daten/qs-audit-2026-08-26/` — Werkzeuge, Block-D-Protokolle,
Block-B-Placebos, beide a11y-Läufe. Nicht im Scratch, der mit der Sitzung verschwindet.

---

### 🛑 Der Minutenkerzen-Abruf ist gestoppt (PM, 26.08. 21:10) — mit Begründung

**Ich hatte vor zwanzig Minuten entschieden, ihn weiterlaufen zu lassen. Das war falsch,
und der Grund ist erst durch die exakte Auszählung der QS sichtbar geworden.**

**Zwei Befunde, beide vom PM selbst nachgesehen:**

**1. Der Lauf begräbt nichts — er erzeugt.** Ohne `--aktualisieren` überspringt das
Werkzeug vorhandene Reihen (`yahoo-60m-holen.js:170`). Die bereits vorhandenen Teilkerzen
sind also unberührt. **Aber jede frisch geholte Reihe bekommt eine neue**, weil die
US-Sitzung noch läuft: **in zwanzig Minuten von 7 auf 9 gewachsen** (neu: MSA, VONV, TECS,
SPXC).

**2. Deshalb ist nicht das Sammeln der Fehler, sondern der Zeitpunkt.** Wer **während der
Sitzung** sammelt, holt zwangsläufig die laufende Kerze mit. Der nächtliche Lauf um 22:15
liegt nach Börsenschluss — **derselbe Befehl wäre dort sauber.**

**Warum das schwerer wiegt als bei 60m:** Eine Teilkerze hört auf, die letzte zu sein,
sobald der nächste Lauf läuft. Im 60m-Bestand verrät sie sich danach noch am krummen
Raster (75 von 75). **Bei Minutenkerzen gibt es dieses Raster nicht** — `17:43:00` ist ein
gültiger Platz. **Eine begrabene 1m-Teilkerze ist dauerhaft nicht mehr von einer echten zu
unterscheiden.** Und Yahoo liefert sie nicht noch einmal.

**Vorher gesichert:** die neun betroffenen Reihen stehen mit Symbol, Zeitstempel und Kurs
in `Markt-Dashboard-Daten/teilkerzen-1m-2026-08-26.json` — **damit sie auffindbar bleiben,
auch wenn ein späterer Lauf sie begräbt.** Billige Versicherung, einmal geschrieben.

**Stand des Minutenarchivs:** 1.647+ Reihen statt der 490 vom Nachmittag. Der größte Teil
der Erweiterung ist also drin; es fehlt der Rest der rund 2.900.

**Was daraus als Regel folgt — sie fehlte bisher überall:**

> **Intraday-Archive werden nur nach Börsenschluss gesammelt.** Ein Lauf während der
> Sitzung schreibt in jede frisch geholte Reihe eine eingefrorene Teilkerze.

Das gehört in die Sammelfunktion des Masters, in die nächtliche Aufgabe und in jede
Rolle, die ein Intraday-Archiv anfasst. **Der Auftrag „App sammelt selbst" muss diese
Bedingung tragen** — eine App, die tagsüber offen ist und nebenbei sammelt, produziert
genau das, was hier gerade aufgefallen ist.

---

### ⚖ Die QS lässt ihre eigenen Funde widerlegen — acht unabhängige Skeptiker

**Alle heutigen QS-Funde stehen ab sofort als *gemeldet*, nicht als *bestätigt*.** Die QS
hat es selbst angestoßen, und der PM zieht die Kennzeichnung auf dieser Tafel nach — er
hatte mehrere davon bereits als Befund eingetragen.

**Ihre Begründung, und sie ist zwingend:** Ihre Funde **stoppen gerade Bauarbeiten** —
der Master hat #96 liegengelassen, dem Desingner wurde (1b) in Frage gestellt, und sie
empfiehlt Eingriffe in `kerzenquelle.js`. Dazu musste sie sich **heute dreimal selbst
korrigieren**: abgeschnittene Ausgabe, falsches Stundenraster, „85 echte Kerzen", die
keine waren.

**Jeder dieser drei Fehler hatte dieselbe Form: eine unvollständige Sicht sieht aus wie
ein Befund über die Sache.** Genau die Form, die dieses Projekt heute achtmal bezahlt hat.
*„Ich habe keinen Grund anzunehmen, dass ich sie ein viertes Mal nicht produziere."*

**Geprüft werden acht Funde, je ein Agent, Auftrag: widerlegen statt bestätigen, Zahlen
unabhängig neu herleiten statt ihre Skripte benutzen.**

1. die #96-Zählung (3.409 Treffer, 264 Reihen mehrfach)
2. das Gleichzeitigkeits-Kriterium (98,4 % gegen 0,9 %) — **einschließlich der Frage, ob
   „löschen" für die 2.839 überhaupt richtig ist**
3. die wirkungslose Teilkerzen-Sperre und die 160 Teilkerzen
4. die Krypto-Beimischung in der Kostenmessung
5. die Aussicht trotz „nicht messbar"
6. die drei Zählfehler auf Tafel und Plan
7. die zwei veralteten Auftragsangaben
8. „der App-Store ist sauber, der Defekt sitzt nur im Mess-Archiv"

**Punkt 2 ist der, den niemand gestellt hatte** — auch der PM nicht, obwohl Wilhelms
Entscheidung „Platzhalter raus" darauf beruht. *Ist Löschen überhaupt der richtige Umgang,
oder trägt die Kerze eine Information, die dann fehlt?*

**Was sich dadurch NICHT ändert:** Bei #96 und `kerzenquelle.js` bleibt es bei
**„nicht anwenden, bis geklärt"** — diese Empfehlung ist in beide Richtungen sicher.

### ✅ Der Urteilswechsel ist unabhängig bestätigt

Die Zahlen zu `rsi2seit-mcp` stammten aus einem Lauf, den die QS selbst abgeschossen hatte.
**Ein frischer Einzelprozess hat die Messung wiederholt und liefert jede Zahl identisch**
(Var3 0,0554/0,0553 · Var4 0,0600/0,0596 · Placebo t 0,998 · B10-Faktor 0,98).
**Kein Artefakt des Abbruchs** — beide Urteilswechsel stehen.

**Block D: 8 von 9 durch**, sieben stabil, eines gekippt. `winkelgrad` läuft.

---

### ⚠ #96: „Löschen" ist womöglich nicht der richtige Umgang — zwei offene Fragen

Aus einer beiläufigen Bemerkung des PM („eine Kerze ohne Umsatz trägt vermutlich keine
Information") hat die QS zwei Punkte entwickelt, **die vorher niemand bedacht hatte** und
die **Wilhelms Entscheidung berühren**:

**1. Eine gelöschte Kerze ist etwas anderes als eine flache Kerze.**
Wer sie entfernt, **ändert die Kerzenzahl je Reihe** — und damit jeden Vorlauf, der in
**Kerzen** zählt statt in Tagen: `leseFensterKerzen: 261` bei rsi2seit, **430** bei t3.
Eine Reihe, aus der eine Kerze verschwindet, hat ab diesem Punkt eine um eins verschobene
Indizierung. **Ob das die Messungen bewegt, ist offen. Dass es sie bewegen kann, ist neu.**

**2. „Flach" ist nicht dasselbe wie „erfunden".**
Bei den ~410 echten leeren Stunden ist die flache Kerze der **ehrliche Zustand des
Marktes**. Behält die Regel sie, führt das Archiv künftig **zwei Sorten flacher Kerzen** —
und die nächste Sitzung, die eine davon sieht, kann sie nicht mehr auseinanderhalten.

**Denkbare Alternative zum Löschen, noch von niemandem geprüft:** die Kerze **markieren**
statt entfernen. Dann bleibt die Indizierung unberührt, und jede spätere Auswertung kann
selbst entscheiden, ob sie sie einbezieht. Kostet ein Feld je Kerze.

**Das geht als offene Frage in die Übergabe, unabhängig vom Urteil der Skeptiker.**
An Wilhelms Entscheidung („Platzhalter raus, echte Kerzen bleiben") ändert es nichts —
**aber am Wie**, und das war bisher stillschweigend als „löschen" angenommen. Vom PM.

*Nebenbei, weil es zur Sorgfalt gehört:* Der PM hatte vor der Last der acht Skeptiker
gewarnt. Die QS hat **nachgesehen statt geschätzt**: 68 % CPU auf 16 Kernen, 18,7 GB frei,
**zwei** Node-Prozesse (einer davon ihr Block-D-Lauf). Die Skeptiker lesen Quelltext und
rechnen kurze Zählungen — schwere Messungen sind ihnen ausdrücklich untersagt
(`keine Läufe über 3 Minuten`, `niemals messen.js`, `niemals archiv1d`). Sie staffelt
deshalb **nicht**. **Und sie schreibt die Uhrzeit ihrer Messung dazu — mit ausdrücklichem
Verweis auf den Versionsstands-Fehler des PM von heute Mittag.**

---

### ✅ #96: die Verschiebungs-Sorge ist entkräftet — gemessen statt vermutet

Die QS hat die eigene Warnung nachgemessen. **Sie trägt nicht**, und der Grund ist eine
Zahl statt einer Überlegung.

Die Maschine läuft über **Array-Positionen** (`for (var i = vorlauf; i < b.length - H; i++)`),
und `leseFensterKerzen` zählt **Kerzen** (261, bei t3 430) — eine entfernte Kerze verschiebt
also alles danach. Die Frage war deshalb berechtigt. **Entscheidend ist, wo die Kandidaten
sitzen** (Abstand vom Reihenende, über alle 2.885 Reihen, Reihenlänge im Median 5.099):

| | n | Median | max |
|---|---|---|---|
| **Platzhalter 25.08.** | 2.839 | **2** | **4** |
| echte leere Stunden | 410 | 4.112 | 5.097 |

**Die Platzhalter sitzen ausnahmslos in den letzten vier Kerzen.** Sie zu entfernen
verschiebt nichts, was vor ihnen liegt — und sie liegen ohnehin **hinter** dem
Messzeitraum aller zwölf Protokolle, der am 24.08. endet. Die 410 echten Leerstunden
liegen umgekehrt tief in der Geschichte (387 von 410 weiter als 430 Kerzen vom Ende) und
sind seit jeher Teil der gemessenen Daten.

**Was von der Frage offen bleibt:** Behält die Regel die 410 — und das soll sie —, führt
das Archiv **zwei Sorten flacher Kerzen**, ohne Merkmal zum Auseinanderhalten. Das ist kein
Argument gegen das Löschen, sondern eines dafür, **im Datensatz zu vermerken, dass gelöscht
wurde.**

**Eine Selbsteinschränkung der QS, die hierher gehört:** Ihre Block-D-Läufe gehen bis zum
**26.08.** und enthalten damit die Platzhalter *und* die heutigen Teilkerzen; die
Morgenprotokolle (bis 24.08.) enthalten beides nicht. Ein flacher Balken unter 5.099 und
~87 Teilkerzen über 2.885 Reihen seien vernachlässigbar — *„aber ‚vernachlässigbar' ist
bei mir geschätzt, nicht gemessen."* **Sie sagt den Satz über die eigene Arbeit, den sie
heute an anderen beanstandet hat.**

**Block D: `winkelbestaetigt` reproduziert** (nicht bestätigt, alle fünf Varianten, alle
ohne Aussicht wegen negativem Überschuss) — **damit ist der Tafel-Fund (a) im frischen Lauf
auf Maschine 1.4.0 bestätigt: es sind fünf, nicht sieben.** `winkelgrad` ist der letzte.

---

### 🔴 Die Aussicht ist keine belastbare Zahl — und die Eintrittskarte misst an ihr

**Zuerst eine Richtigstellung, die den Plan betrifft.** Die QS hatte gemeldet, die Aussicht
werde durch frische Handelstage **durchweg schlechter**; der PM hat das als Teil IV-b in
den großen Plan übernommen. **Über zwei Tage stimmte es. Über die ganze Messhistorie
nicht:**

```
Uebergaenge mit MEHR Bestaetigungstagen:
  Aussicht GEFALLEN (Warten half) : 14
  Aussicht GESTIEGEN              : 12
```

**Praktisch ein Münzwurf.** Die Aussage war eine Zwei-Tage-Momentaufnahme und ist aus dem
Plan gestrichen. *Sie hat es selbst nachgerechnet, weil sie ihre eigene Behauptung prüfen
wollte.*

**Dabei fiel das Eigentliche auf: `tage80` skaliert mit 1/Effekt²** — ein kleiner,
verrauschter Punktschätzer im Nenner, quadriert. Halbiert sich der geschätzte Effekt,
**vervierfacht** sich die Aussicht.

**Spannweite derselben Variante über die Messhistorie des Projekts:**

| Variante | von | bis | Faktor |
|---|---|---|---|
| monatsende-kauf V0 | 180 | 16.185 | **89,9** |
| **rsi2seit-mcp V3** | **1.056** | **75.988** | **72,0** |
| rsi2seit-mcp V4 | 1.050 | 29.867 | 28,4 |
| rsi2seit V0 | 1.197 | 30.354 | 25,4 |
| t3-stundendrift V1 | 9.680 | 131.888 | 13,6 |

~~Median über alle 23 Varianten: Faktor 2,4.~~ **ZURÜCKGEZOGEN — konfundiert mit dem Universumswechsel.** Die Hälfte davon passiert bei **identischer
Tageszahl** — ohne einen einzigen neuen Handelstag.

*Ehrliche Einschränkung der QS:* Gleiche Tageszahl und trotzdem andere Zahl heißt, dass
sich **Maschine oder Konfiguration** geändert hat, nicht die Daten (bei monatsende-kauf
nachweislich ein anderes Universum, bei momentum ein älterer Maschinenstand). **Es ist
also nicht reines Schätzrauschen — aber es heißt, dass die Zahl über die eigene
Messhistorie des Projekts nicht reproduzierbar ist.**

### Warum das eine Entscheidung berührt, nicht nur eine Methode

**Wilhelms Eintrittskarte lautet „unter 1.000 nötigen Handelstagen".** `rsi2seit-mcp` V3
steht auf dieser Tafel mit **1.070** — dieselbe Variante hat in der eigenen Historie
zwischen **1.056 und 75.988** gestanden.

> **Eine Schranke bei 1.000 ist feiner als die Reproduzierbarkeit der Zahl, an der sie
> misst.** Ob ein Kandidat durchkommt, entscheidet damit teils, auf welchem Maschinenstand
> er gemessen wurde.

**Dasselbe trifft (1b):** Der Auftrag will die Zahl anzeigen und bei 2.500 trennen. Bei
einem Median-Faktor von 2,4 wandern Strategien über diese Grenze, ohne dass sich am Markt
etwas geändert hat.

**Empfehlung der QS, ungebaut:**
1. Die Aussicht **nie ohne ihren Effekt und ihre Tageszahl** zitieren — sie ist eine
   Ableitung aus beiden, keine eigenständige Größe.
2. Für die Eintrittskarte **nicht die Aussicht** als Schranke nehmen, sondern **`delta80`
   gegen die Kostenhürde**: Effektgröße gegen Effektgröße, dieselben Einheiten, **ohne
   Quadrierung im Nenner**.
3. Wird die Aussicht angezeigt, dann **als Bereich, nicht als Zahl**.

*Ihr Hinweis dazu, und er sitzt:* Genau diese Verwechslung ist dem PM heute Mittag
unterlaufen — nur andersherum, er hatte `delta80` als Tageszahl gelesen. **„Die Lehre
daraus ist nicht ‚nimm Tage statt Pp', sondern ‚nimm die Größe, die nicht durch einen
Schätzer geteilt wird'."**

**Status: gemeldet, nicht bestätigt.** Dieser Fund ist **nicht** unter den acht Skeptikern
— er ist neu und ungeprüft. Rechenwege liegen unter
`Markt-Dashboard-Daten/qs-audit-2026-08-26/werkzeuge/` (`aussicht-verlauf.js`,
`aussicht-streuung.js`, beide nur lesend).

---

### ⚠ ZURÜCKGEZOGEN: „~~Median-Faktor 2,4, im Extrem 72~~ (ZURÜCKGEZOGEN, siehe oben)" — die Zahlen sind konfundiert

**Diese beiden Zahlen stehen in `8e0ef59` und in der Begründung zu Wilhelms Entscheidung
in `ae80caa`. Die QS hat sie selbst zurückgezogen.** Sie hatte nach Maschinenversion
gruppiert, **aber nicht nach Universum** — und zwischen dem 23. und 24.08. kam das große
Archiv dazu:

```
rsi2seit-2026-08-23    191 Werte
rsi2seit-2026-08-24  2.885 Werte
```

**Ein Universumswechsel um Faktor 15, verbucht als „acht zusätzliche Handelstage".** Sauber
nachgerechnet — gleiche Strategie, gleiche Variante, gleiche Maschine, **gleiches
Universum** — ergibt: **null vergleichbare Gruppen.** Es gibt in der gesamten
Protokollhistorie keinen einzigen sauberen Vergleich.

**Wilhelms Entscheidung hält trotzdem — auf anderem Fundament:**

| trägt weiter | trägt nicht mehr |
|---|---|
| `tage80` skaliert mit **1/Effekt²** — Arithmetik, keine Messung | ~~Median-Faktor 2,4~~ |
| `delta80` ist **Effektgröße gegen Effektgröße**, kein Schätzer im Nenner | ~~im Extrem 72~~ |
| einzige saubere Beobachtung: **ein** Handelstag bewegte die Aussicht um bis zu **59 %** (kapitulation V1, 2.330 → 3.704) | ~~„feiner als die Reproduzierbarkeit"~~ — jetzt **unbelegt, nicht widerlegt** |

**„delta80 ist die robustere Größe, weil sie nicht durch einen verrauschten Schätzer
geteilt wird" ist strukturell und braucht keine Messung.** Die Entscheidung steht.

**Regel für alle, aus diesem Vorfall:** *Eine Kennzahl über die Zeit zu vergleichen setzt
voraus, dass sich dazwischen **nur die Zeit** geändert hat.* Hier haben sich Universum
(191 → 2.874), Maschine (1.0.0 → 1.4.0) und Rechenvorschrift (#86, #91) geändert — **drei
Wechsel in drei Tagen. Der Protokollbestand ist als Zeitreihe über sich selbst nicht
auswertbar.**

---

### 🔴 A-FUND: `tage80` zählt SIGNALTAGE — die Eintrittskarte vergleicht HANDELSTAGE

**Ein Einheitenfehler mitten in Wilhelms Entscheidung — dieselbe Familie wie der
delta80-Fehler des PM vom Mittag.**

Bei `monatsende-kauf` stehen **17 Signaltage** in **365 Bestätigungs-Handelstagen** — rund
21,5 Handelstage je Signaltag. **Die ausgewiesenen 187 Signaltage sind ≈ 4.016
Handelstage ≈ 16 Jahre.**

Gegen die alte Eintrittskarte („unter 1.000 **Handelstagen**") liest sich die rohe 187 als
bequemes Ja. **Richtig umgerechnet ist es ein Nein um Faktor vier.**

**Damit war Wilhelms Umstellung auf `delta80` richtiger, als irgendwer wusste** — sie
umgeht das Einheitenproblem vollständig, weil sie Effektgrößen vergleicht statt Zeiten.

Dazu: `scoreboard.js:196` markiert nur bei `bestesUrteil === 'nicht-entscheidbar'` als
„hinter der Wand" — ein `nicht-messbar`-Protokoll zeigt die 187 **unkommentiert in der
oberen Tabelle**. Die Schranke `>= 30` verhindert die Zahl bei nicht-messbaren Läufen;
**die Einheit stimmt auch bei den anderen elf nicht.**

### 🔴 A-FUND: ein sechstes Urteil erzeugt ein FALSCHES Etikett

`messmaschine.js:1235` vergibt `bestaetigt-aber-nullpunkt-verschoben`. Das Array in `:1305`
kennt nur fünf Werte. Ein Lauf, dessen einzige Variante so ausfällt, läuft über
`|| 'nicht-messbar'`. **Eine bestätigte Kante würde als „nicht messbar" gemeldet.**

Schärfer als #92: dort wird ein Urteil **verdeckt**, hier ein **falsches erzeugt**.
Einzeiler, derzeit 0 Vorkommen — **#92 ist ohnehin offen, gehört zusammen erledigt.**

*Nebenbei: Die Rangfolge ist keine konsistente Ordnung. `winkelbestaetigt-2026-08-25` hat
4× nicht-entscheidbar + 1× nicht-bestätigt und meldet das **härtere** — während `widerlegt`
hinten steht und dort das mildere gewänne.*

### 🔴 DATENFUND A: der 25.08. ist womöglich ganz neu zu holen

In 2.839 von 2.885 Reihen steht `2026-08-25T20:00Z`, Umsatz 0, Kurs = Schluss der
19:30-Kerze. **Live gegengeprüft: die Quelle liefert für den 25.08. keine 20:00-Kerze
mehr.** Da `zusammenfuehren()` nur nach Zeitstempel vereinigt und **nie löscht**, bleibt
sie für immer stehen.

**Und schwerer:** Die archivierte **19:30**-Kerze von AAPL trägt v = 2.851.594 /
c = 309,8999 — die Quelle heute v = 2.846.819 / c = 309,8299. **Auch die 19:30 wurde
unfertig eingefroren.** Gilt das allgemein, ist nicht eine Kerze zu löschen, sondern
**der ganze 25.08. neu zu holen.** *Ungeprüft — ein Abrufvergleich über 20 Symbole klärt es.*

### 🔴 DATENFUND B: Phantom-Dochte an sieben US-Halbtagen

`AAPL 2025-07-03, 17:00, Umsatz 0, Tief 201,25` — gegen ein Sitzungstief von **211,81**.
**Ein Docht von −5,8 % ohne einen einzigen gehandelten Anteil**, live reproduziert.

Betroffen: 2023-11-24 · 2024-07-03 · 2024-11-29 · 2024-12-24 · 2025-07-03 · 2025-11-28 ·
2025-12-24.

**Jede Messung, die Hoch/Tief benutzt — Ausbrüche, ATR, Stopps, Kanäle, ORB — bekommt an
diesen Tagen im ganzen Querschnitt falsche Extremwerte.** Die Sekunden-Sperre kann das
nicht abfangen.

---

### Was die acht Skeptiker an den QS-Funden korrigiert haben

| Fund | Korrektur |
|---|---|
| „#96 trifft 3.409" | **3.440** archivweit. Und: die **implementierte** Regel trifft **0** — richtig ist „das **vorgeschlagene** Prädikat trifft 3.440" |
| „Die Sperre greift ins Leere" | **„Sie leckt zu ~2,6 %."** 0 von 21,3 Mio mit Sekunde ≠ 0 ist genau das, was ein **arbeitender** Filter hinterlässt. *„Abwesenheit als Beleg gegen den Mechanismus, der die Abwesenheit erzeugt."* |
| **„Der App-Store ist sauber"** | **Falsch — Werkzeugfehler.** Store-Zeilen haben **5** Felder, Archiv-Zeilen 6; der Test prüfte `k[5]` → immer `undefined` → **konnte nie feuern.** Richtig: **1.170 Stempel im Store** |
| „7 von 1.603" (1m) | **Auf wanderndem Grund erhoben** — `_laeuft.json` war aktiv |
| Gleichzeitigkeits-Kriterium | **hinreichend, nicht notwendig** — ließe die 151 krummen Stempel durch. Bessere Regel: (i) krumme Minute, (ii) Zeitstempel, den es an **keinem anderen Handelstag** gibt |
| „etf-Ordner still ausgeschlossen" | **kein Fund** — `kapitulation.js:80` liest ihn gezielt, „ETFs sind Maßstab, nicht Messobjekt" |
| „5 von 25 ist veraltet" | **war nie ein gültiger Stand** — Zähler aus dem 35er-Satz, Nenner aus einem gedachten 25er |

**Unverändert bestätigt:** Krypto-Beimischung (jede Zahl exakt reproduziert) · Aussicht
trotz nicht-messbar · zwei veraltete Tafelangaben · drei Zählfehler.

**Drei Verschärfungen dazu:**
- **Die 16 Aktien-Kostenrunden sind EIN Marktmoment** — 13:31:52 bis 13:32:26 UTC,
  **34 Sekunden**, zwei Minuten nach Eröffnung, quer über 15 Megacaps. Keine 16 Ziehungen
  über „Handelskosten"; der SE misst Querschnittsstreuung. **Ohne die eine ARM-Runde sind
  es 0,0959 % — unter der Annahme.**
- **`diagnose.js` Z. 149–160 aggregiert ohne Krypto-Filter**, während `kosten.js:363`
  filtert. Zwei Stellen, die sich widersprechen.
- **„sieben" steht noch an drei weiteren Stellen**, die falsche `:1214` ebenfalls.

### Das Muster — und das Gegenmittel

**„Der Test misst nicht, was er zu messen scheint."** Vier Typen: Prädikat aus dem falschen
Datenformat · Grundmenge ≠ Grundmenge des Werkzeugs · Abwesenheit als Beleg gegen den
Mechanismus, der sie erzeugt · Zeilennummern als Referenz.

**Der Kern: die Prüfwerkzeuge waren selbst nicht gegengeprüft.** Wörtlich der Befund aus
*„Gegenprüfung rettete ein Studien-Nein"* — dort fand die Werkzeugprüfung vier Fehler
**vor** der Meldung, hier kam sie danach.

> **Neue Hausregel: Jeder Nullbefund braucht eine Positivkontrolle — den Test einmal dort
> laufen lassen, wo er feuern MUSS.** Ein Lauf des Store-Prüfers gegen das Archiv hätte den
> Formatfehler in einer Sekunde gezeigt.

**Alles liegt** unter `Markt-Dashboard-Daten/qs-audit-2026-08-26/gegenpruefung/` — Synthese,
acht Urteile, 42 Skripte.

---

### ✅ Die App sammelt selbst (`b9512ab`, `a180e1d`) — und drei Funde, die schwerer wiegen

**Werkzeuge › Kursarchiv:** je Auflösung Werte, Alter der jüngsten Kerze, zuletzt
gesammelt, offene Werte — Begründung im Klartext, Knopf je Auflösung, Anhalten. **Gesammelt
wird durch `kerzenquelle.js`, nicht nachgebaut** — dieselbe Stelle wie das Abrufwerkzeug,
nachgewiesen mit einer isolierten Probe (eigener Datenordner, danach dieselben Dateien in
denselben Unterordnern mit demselben `stand.json`). 2.306 Zusicherungen grün.

### ⚠ Die drei toten Sperren von 20:00 — zwei davon gehören dem abgebenden PM

Der Master fand drei Sperren, deren Prozesse längst tot waren; der Wachhund hätte bis 23:26
„wird gerade geschrieben" gemeldet und über den Stand **gar nichts** gesagt. **Behoben in
`300e9a9`: die Sperre fragt jetzt zuerst die Prozessnummer und erst dann die Uhr.**

**Herkunft, vom PM aufgeklärt:**

| Sperre | Stand | Ursache |
|---|---|---|
| **15m** | 233/432 | Teil des PM-Erstlaufs von 18:21 — **beim Neustart gegen die CPU-Last gestorben** |
| **1m** | 1.834/2.732 | **vom PM absichtlich gestoppt** (21:10), weil er mitten in der Sitzung Teilkerzen schrieb — **die Sperre nicht aufgeräumt, das war sein Fehler** |
| 1d | – | **nicht vom PM.** Lief schon um 19:30 und blockierte der QS den ganzen Abend die drei Tagesarchiv-Protokolle, darunter `momentum` |

### 🔴 SPY fehlt in den Intraday-Archiven — der Anker des Regime-Tors

31 von 531 offenen Werten sind **die ETFs**: Die Werkzeugläufe gingen über `alle`, und die
ETF-Liste ist aus dem Universum herausgefiltert. **Die App holt sie ab jetzt immer mit; für
60m/1d muss jemand `node tools/yahoo-60m-holen.js etf` nachziehen.**

*Dieselbe Lücke von der anderen Seite hat den PM heute Nachmittag erwischt:* Er stellte
SPY-Zahlen aus `etf/` neben vier Zahlen aus dem Hauptbestand und gab sie als fünfte
Stichprobe aus. **Der `etf/`-Ordner ist in beide Richtungen eine Falle.**

### 🔴 Yahoo korrigiert FERTIGE Kerzen noch ~18 Minuten rückwirkend

Gemessen: 6 Runden über 3 Werte, **17,1 bis 18,0 Minuten — und nicht nur den Umsatz, auch
die Kurse.** Wer während der Sitzung misst oder sammelt, **rechnet auf vorläufigen Zahlen.**

**Das erklärt rückwirkend einen Befund der QS**, den wir für einen reinen Teilkerzen-Fall
hielten: dass die archivierte 19:30-Kerze von AAPL andere Werte trägt als die Quelle heute
(v 2.851.594 gegen 2.846.819). **Kein Einfrieren — die Nachkorrektur.**

### 🔴 Der Eimer-Fund (`cc2848f`): die Erklärung, die den ganzen Abend gefehlt hat

Die Regel aus Issue 85 warf die Quote-Kerze am Reihenende hinaus — **aber darunter lag der
gerade laufende Eimer mit glattem Gitterstempel.** Um 18:51 UTC endete XOM 15m auf 18:45,
mitten im Eimer 18:45–19:00; **zwei Abrufe drei Minuten auseinander schrieben verschiedene
Werte in dieselbe Kerze.** Betroffen war **jedes** Intraday-Intervall, **60m eingeschlossen**.

Gefragt wird jetzt, **wann der Eimer zu ist** — Stempel plus Dauer, gedeckelt auf den
Handelsschluss (sonst verwürfe es die kurze Schlusskerze 19:30–20:00 jeden Abend).

**Was das für den Bestand heißt:** *Im vorhandenen 60m-Archiv steht bei jeder Reihe, die
während einer Sitzung geholt wurde, eine unfertige letzte Stunde.* Sie wird beim nächsten
Lauf überschrieben — **wer heute darauf misst, sollte es wissen.**

*Einordnung des PM:* Die QS und er haben heute Abend **drei** Regeln durchprobiert, um die
flachen Kerzen zu trennen, und alle drei scheiterten an derselben Stelle — **sie haben am
Zeitstempel gemessen, statt zu fragen, ob der Eimer überhaupt zu ist.** Dass es jedes
Intervall betrifft, macht diesen Fund größer als #96.

### #96 bleibt angehalten — mit einer besseren Hypothese

**Nichts eingebaut, nichts gelöscht.** Der Master schlägt vor: der Platzhalter liegt bei
20:00 UTC, und das ist **das Sitzungsende** — ein Eimer, der genau dort beginnt, liegt
außerhalb der Sitzung. **Strukturell prüfbar statt statistisch**, und er würde FSECs und
PAAAs echte leere Stunden mitten im Tag nicht anfassen.

**Zählen muss es trotzdem jemand, bevor daraus eine Regel wird** — der Master schreibt es
selbst dazu. *Heute Abend sind drei plausible Ideen an der Wirklichkeit gescheitert, zwei
davon vom PM.*


---

### 🔴 Phantom-Dochte bestätigt — und sie führen über den Stop direkt ins Urteil

**Gemessen über das ganze 60m-Archiv** (Nullumsatz-Kerzen, deren Hoch oder Tief die Spanne
der **übrigen** Kerzen desselben Tages verlässt):

| | |
|---|---|
| geprüfte Nullumsatz-Kerzen mit Tagesvergleich | 69.826 |
| Docht außerhalb der Tagesspanne | **34.363 (49,2 %)** |
| betroffene Reihen | **2.857** von 2.885 |
| verschiedene Tage | **705** |

Die sieben Halbtage führen die Liste an (24.12.2024: 1.564 · 29.11.2024: 1.504 · …), aber
**es ist nicht auf sie beschränkt.**

**Der Kronzeuge reproduziert exakt:**

```
AAPL 2025-07-03
  13:30  Umsatz 11.914.855   H 213,86  T 211,81
  15:30  Umsatz  5.268.462   H 214,65  T 213,67
  17:00  Umsatz          0   H 214,14  T 201,25   <-- 5,0 % unter dem Tagestief
```

**Die ehrliche Einordnung der QS, die der Skeptiker nicht gegeben hatte:** Von den 34.363
überschreiten nur **3.171 die Marke von 1 %** und **90 die von 5 %**. Die große Mehrheit ist
trivial. Die Extremwerte gehören überwiegend **ZVZZT — dem NASDAQ-Testsymbol** (sechs der
zwölf größten) sowie illiquiden ETFs. **„34.363" ist die falsche Zahl zum Zitieren; die
tragende ist 3.171.**

**Warum es trotzdem zählt — der Weg von der Kerze ins Urteil ist kurz:**
`messmaschine.js:526` — `if (stop != null && p.tief <= stop)`. **Der Stop liest das Tief.**

**Drei der zwölf Strategien setzen einen Stop:** `kapitulation`, `rsi2seit-mcp`,
`t1-zwangsglattstellung`. Das sind ausgerechnet **die Strategie, deren Urteil heute gekippt
ist**, und **eine der drei unter der Eintrittskarte**. Ein Phantom-Tief löst dort einen
Stop aus, den es nie gab.

**Die entscheidende Frage ist offen — und sie ist messbar, nicht diskutierbar:** Hebt es
sich im Überschuss auf? Signal und Kontrolle benutzen dieselbe `fuehreAus`, und die
A7-Kontrolle ist „derselbe Wert, dieselbe Stunde" — es **könnte** beide Seiten gleich
treffen und sich herauskürzen. **Gemessen ist das nicht.**

**→ AUFTRAG an die Mess-Sitzung: die drei Stop-Strategien einmal mit ausgeschlossenen
Nullumsatz-Kerzen laufen lassen** und mit dem Bestand vergleichen. Das ist eine Messung,
keine Meinung. Vorregistrierung wie üblich: Was gilt als „bewegt sich"? Vorher festlegen.

*Dazu: Die Maschine hat **keinen Liquiditätsfilter** — `universum: „Archiv-Store, Auswahl
zum Messzeitpunkt"`. **ZVZZT und die illiquiden ETFs sind mitgemessen worden.***

### ✅ Block D vollständig — die 1d-Sperre war verwaist, nicht aktiv

`archiv1d` ist frei, und **der Wachhund hat es selbst gemeldet:** *„VERWAISTE SPERRE: ein
Nachladelauf hat sie vor 3,9 h gesetzt und nie aufgeräumt (Prozess 52300 läuft nicht mehr).
Der Stand oben gilt trotzdem."* PID 52300 existiert nicht mehr; das Archiv ist vollständig
(2.965/2.965, Rückstand 0). **Der Lauf, der die QS den ganzen Abend blockiert hat, war
schon tot.**

| | Urteil | |
|---|---|---|
| quartalsschub-betrag | nicht-entscheidbar → **stabil** | Placebo t 0,626 |
| monatswende-breit | nicht-entscheidbar → **stabil** | Placebo t 0,265 |
| **momentum** | *rechnet gerade* | **Strang A hängt daran** |

**Block D: 11 von 12 — zehn stabil, eines gekippt.**

**⚠ Vom PM behoben:** Die **Rollendatei des Analytikers kannte die neue Wachhund-Meldung
nicht** — dort stand nur die Sechs-Stunden-Frist. **Bei 3,9 h hätte er nach seiner eigenen
Anweisung weiter gewartet**, obwohl das Archiv benutzbar war. Ergänzt: er liest jetzt den
Satz „der Stand oben gilt trotzdem" und behandelt die Sperre dann als aufgehoben.
*Die Verbesserung am Wachhund ist von heute Abend; die Rolle wurde nachmittags geschrieben.
**Wer ein Werkzeug verbessert, muss die Rollen nachziehen, die es benutzen.***


---

### ✅ NACHRECHNUNG VOLLSTÄNDIG — zwölf von zwölf, elf stabil, eines gekippt

**Die Neumessung von heute früh hält** — auf einer **zwei Versionen neueren** Maschine
(1.4.0 statt 1.2.0) und mit frischen Handelstagen.

| Strategie | Archiv | Urteil | Placebo t | B10 |
|---|---|---|---|---|
| rsi2seit | 60m | **stabil** | −0,156 | 1,09 |
| kapitulation | 60m | **stabil** | −0,559 | – |
| monatsende-kauf | 60m | **stabil** | 0,071 | 0,61 |
| t2-umsatzschock | 60m | **stabil** | −0,138 | – |
| t1-zwangsglattstellung | 60m | **stabil** | 0,031 | – |
| t3-stundendrift | 60m | **stabil** | 0,385 | 1,00 |
| **rsi2seit-mcp** | 60m | **gekippt** → nicht bestätigt | 0,998 | 0,98 |
| winkelbestaetigt | 60m | **stabil** | 0,088 | 1,39 |
| winkelgrad | 60m | **stabil** | −0,015 | 1,14 |
| quartalsschub-betrag | 1d | **stabil** | 0,626 | 1,22 |
| monatswende-breit | 1d | **stabil** | 0,265 | 0,87 |
| **momentum** | 1d | **stabil** | 0,120 | **6,33** ⚠ |

**Kein einziges Urteil geht Richtung „bestätigt". Der Bestand bleibt bei null belegten
Kanten** — jetzt unabhängig nachgerechnet statt einmal gemessen.

### 🔴 Der B10-Wächter feuert zum ersten Mal — und zwar auf `momentum`

```
B10-Ueberlappung: {"faktorGroesster": 6.33}
[B10] Der Standardfehler waechst um Faktor 6.33 durch ueberlappende
      Halteperioden. Ein Urteil, das ohne diese Korrektur zustande kaeme,
      waere wertlos.
```

**Mehr als das Doppelte der Warnschwelle.** Über die anderen elf liegt der Faktor zwischen
0,61 und 1,39 — `momentum` ist ein Ausreißer um Größenordnungen, weil es **63 Handelstage
hält und jeden Tag neu eröffnet.**

**Auf dieser Tafel stand zu #98:** *„Vorbedingung für Strang A: Momentum ist genau der
Fall, für den dieser Wächter gebaut wurde — und er ist blind."* **Er ist es nicht mehr, und
beim allerersten Blick schreit er.** Der ganze Sinn von Strang A ist, `momentum` nicht
überlappend zu messen; der Wächter beziffert jetzt zum ersten Mal, **was die Überlappung
kostet.**

**⚠ Vorsicht bei der Deutung — Warnung der QS, und sie gehört ernst genommen:**
Der Faktor sagt **nicht**, dass eine nicht überlappende Messung sechsmal schärfer wäre. Die
Newey-West-Korrektur ist bereits angewandt, **das Urteil ist korrekt.** Er sagt, **wie viel
Auflösung die überlappende Anordnung kostet.**

> **→ VOR Strang A zu klären: Wie verhält sich der B10-Faktor (6,33) zum
> Eichungsverhältnis vom 25.08. (1,543)?** Die beiden messen **verschiedene Größen**. Wird
> das nicht vorher geklärt, **wird eine Verbesserung nachher dem falschen Effekt
> zugeschrieben** — und Strang A ist die größte offene Frage des Projekts.

*`momentum` selbst ist unauffällig stabil:* alle vier Varianten nicht entscheidbar,
Überschuss +1,1600 → +1,1599 Pp, t 1,03 → 1,03, Aussicht 52.578 → 52.579. **Ein Tag ändert
dort nichts — sie hat 4.976 Bestätigungstage.**

*Rollendatei des Analytikers: bereits vom PM behoben (siehe oben) — die QS hat es
unabhängig ein zweites Mal gemeldet.*


---

### ✅ #96 AUFGELÖST — **die „Platzhalterkerze" ist keine. Sie trägt den Tagesschluss.**

Befund und Zählskript: `studien/platzhalterkerze-2026-08-26/BEFUND.md` (`6d44354`).
**Nichts gelöscht, nichts eingebaut.**

**Die Gegenprobe, die es entscheidet** — für den 25.08. bei 395 Werten die 20:00-Kerze des
Stundenarchivs gegen den Schlusskurs aus dem **Tagesarchiv** gehalten, also zwei getrennte
Reihen:

| | Werte |
|---|---|
| **20:00-Kerze näher am Tagesschluss** | **309** (auf 0,000 % genau) |
| 19:30-Kerze näher | **0** |
| beide gleich weit | 86 |

**In keinem einzigen Fall ist die letzte reguläre Stunde näher.** Es ist die
**Schlussauktion** — Yahoo meldet dafür keinen Umsatz, deshalb sieht sie flach aus.

### Alle drei Regeln hätten Schaden angerichtet

| Regel | trifft | davon mit Umsatz |
|---|---|---|
| Umsatz 0 **und** völlig flach — **Vorgabe des PM** | 3.440 | 0 — aber **429 echte Leerstunden** mitten in der Sitzung (FSEC 50, PAAA 42, BILZ 33) |
| nach dem letzten Eimer des Tages — **Idee des Masters** | 23.325 | **1.171** — echte Schlussauktionen an Halbtagen |
| beides zusammen | 2.924 | 0 — aber **76,3 % tragen einen ANDEREN Kurs als die Vorkerze** |

**Die letzte Zeile war der Wendepunkt.** Ein Platzhalter würde den Schluss der Vorkerze
wiederholen — das tun nur **23,7 %**. 302 weichen um mehr als 0,1 % ab, die größte um
**2,93 %**. *Auch die Hypothese der QS ist damit widerlegt: „letzte Kerze der Reihe" trifft
auf 2,5 % zu, „Schlusskurs der Vorkerze" auf 21,6 %.*

**Zwei eigene Fehlversuche stehen im Befund**, weil sie zum Ergebnis gehören: Der
Sitzungsschluss lässt sich aus dem Gitter **nicht als Uhrzeit** ableiten — der letzte Eimer
des Tages ist *kürzer* als das Gitter (19:30–20:00). Die erste Rechnung ergab 19:30, die
zweite 20:30, und die zweite hätte **1.858 Kerzen mit Umsatz** getroffen. Erst die dritte
Fassung vergleicht nur Positionen.

### Was das für Wilhelms Entscheidung heißt

Sein Satz lautete: **„wir brauchen alle kerzen keine platzhalter"**. Nach dieser Messung
spricht er **fürs Behalten** — **es ist keine Platzhalterkerze, es ist der Tagesschluss.**
Die Entscheidung wird nicht zurückgenommen, sie wird auf den gemessenen Sachverhalt
angewandt: *echte Kerzen bleiben.*

**Was tatsächlich stört, ist die Form, nicht die Existenz:** Eine Auswertung, die Stunden
zählt oder nach Umsatz filtert, sieht eine **leere Stunde**, wo der **Tagesschluss** steht.
Wer sie mitzählt, bekommt **acht statt sieben Stunden je Handelstag.**

> **→ Das ist eine Frage der Auswertung, nicht der Ablage — und damit eine Frage an die
> Mess-Sitzung.** Nicht an eine Bausitzung, und nicht durch Löschen zu lösen.

**Offener Nebenbefund:** 2.870 der 2.924 Treffer liegen auf **einem** Tag (25.08.), je
Reihe genau einer; über die anderen 731 Handelstage verteilen sich nur 54. **Warum die
Kerze nur für den jeweils letzten abgeschlossenen Tag auftaucht und nicht kumuliert, ist
ungeklärt.**

### Die Kette, die hier endet

**Vier Regeln, vier Widerlegungen, an einem Abend:**
1. PM: „flach + Umsatz 0" — hätte 429 echte Leerstunden gelöscht
2. QS: „+ letzte Kerze der Reihe" — hätte 2 von 2.839 getroffen und 85 Teilkerzen erwischt
3. QS: „marktweite Gleichzeitigkeit" — hinreichend, aber nicht notwendig
4. Master: „nach dem letzten Eimer" — hätte 1.171 echte Schlussauktionen gelöscht

**Erst die fünfte Frage war die richtige, und sie war keine Regel, sondern eine Messung:**
*Wo liegt der offizielle Tagesschluss?* — beantwortet mit einer **zweiten, unabhängigen
Datenreihe** statt mit einem Muster in derselben.


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

### 🔴 VORRANG — die Schranke reparieren, dann Release (Wilhelm 26.08. 20:25, Formular)

**Wilhelms Entscheid: erst reparieren, dann ausliefern.** Das Release (26 Commits,
4 Notizen) wartet darauf; die Wache startet er selbst, sobald das hier steht.

**Zu tun, `studien/messmaschine/messmaschine.js`:**
1. **Zeile 1266** — die Aussicht wird unter `if (u.tagesmittel > 0 && u.se > 0 &&
   u.tage > 0)` auch für Läufe berechnet, die die Maschine in Zeile 1226 selbst
   `nicht-messbar` nennt (`u.tage < 30`). **Schranke auf `u.tage >= 30` ziehen.**
   Folge: `monatsende-kauf` verliert seine 187-Tage-Zahl aus 17 Messtagen — die Zahl,
   die derzeit die Aussichts-Tabelle anführt und mit der neuen Anzeige ausgeliefert
   würde.
2. **Im selben Eingriff #92** (Rangfolge, Inhaltsanker `bestesUrteil: ['bestaetigt', …`,
   derzeit Z. 1305) — Wilhelms Entscheid vom 17:40 liegt seit Stunden.
3. **Maschinenversion hochziehen** (1.4.0 → 1.5.0) und im Commit ausweisen, was sich an
   den Zahlen ändert. Ohne das sind spätere Protokolle nicht einzuordnen.

**Auflagen:** Nur die Urteils-/Aussichtslogik, keine Handelslogik. Vorher prüfen, ob
`archiv1d` gesperrt ist. Fertigmeldung per Nachricht an den PM.

### ⭐ NEU (Wilhelm 26.08. 20:30, Formular) — die Schranke misst künftig `delta80`, nicht Handelstage

**Der Fund:** `tage80` skaliert mit 1/Effekt² und schwankt über die eigene Messhistorie
um **~~Median-Faktor 2,4, im Extrem 72~~ (ZURÜCKGEZOGEN, siehe oben)**. Dieselbe Strategie kann heute 224 und morgen 500
sagen. **Wilhelms 1.000-Tage-Eintrittskarte war damit feiner als die Reproduzierbarkeit
der Zahl, an der sie misst.**

**Entschieden: auf `delta80` gegen die Kostenhürde umstellen** — Effektgröße gegen
Effektgröße, ohne Schätzer im Nenner. Betrifft **zwei** Stellen:
- **Die Tüftler-Regel** („nur Kandidaten unter 1.000 Handelstagen") in
  `studien/rolle-strategie-tueftler.md` bzw. seiner Aufgabe — neu formuliert gegen
  `delta80` und die Hürde des gewählten Produkts.
- **Die neue Anzeige** (1b, `scoreboard.js`, Schwelle `WAND_TAGE = 2500`) — dieselbe
  Frage, dieselbe Antwort. Die Handelstage dürfen **daneben** stehen bleiben, sie sind
  anschaulich; entschieden wird an `delta80`.

**Achtung, Einheiten:** `delta80` ist eine Effektgröße in **Prozentpunkten**, die alte
Schranke zählte **Handelstage**. Genau diese Verwechslung ist am 26.08. 17:50 schon
einmal passiert — die neue Regel muss die Einheit im Text nennen.

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

- *(nichts offen — die drei Richtungsentscheide vom 26.08. 21:15 sind gefallen, siehe
  „Entschieden" und die drei Aufträge unten.)*

### 🔴 SOFORT, vor allem anderen — die zwei Datenfunde beheben (Wilhelm 26.08. 21:15)

**Wilhelms Entscheid: sofort beheben, vor dem Release und vor Strang A.** Begründung, die
er mitträgt: erfundene Kurse verzerren jede Messung, die diese Tage berührt — und niemand
würde es später am Ergebnis erkennen.

1. **Phantom-Dochte an sieben US-Halbtagen.** Tiefstkurse ohne jeden Umsatz; belegt bei
   AAPL **Tief 201,25 gegen echte 211,81** — rund 5 % erfundene Spanne. Erst **erheben**,
   wie viele Reihen und Tage betroffen sind, dann beheben. Auflage wie bei #96: **zählen
   vor dem Ändern**, und die Regel darf keine echten Kerzen treffen.
2. **Der 25.08. ist womöglich ganz neu zu holen** — auch die 19:30-Kerze wurde unfertig
   eingefroren. Prüfen, ob Neuholen des Tages sauberer ist als Nachbessern.

**Danach erst** ist das Release dran (das ohnehin auf der Schranken-Reparatur wartet).

### ⭐ #80 — die Güte wird ein Perzentil (Wilhelm 26.08. 21:15, Formular)

**Entschieden: Weg 2.** Statt „Güte 82/100" künftig **„enger als 91 % des Zufalls"** — eine
Zahl mit echtem Nullpunkt: 50 % heißt „wie Zufall", erst hohe Werte heißen etwas.
Vorlage mit allen Einzelheiten: `studien/kanal-guete-2026-08-26/VORLAGE.md`.

**Wilhelm hat damit den teuersten der drei Wege gewählt — bewusst.** Was daran hängt,
und es ist die eigentliche Arbeit:

1. **Die Zufallsverteilung muss je Fensterlänge geeicht** und als feste Tabelle abgelegt
   werden. Präzedenz im eigenen Code: die Seitwärts-Enge rechnet bereits gegen eine
   ausgemessene Zufallserwartung (3.000 Läufe je Fensterlänge) — dieselbe Technik.
2. **Die versteckten Schwellen müssen mit umgeeicht werden** — der 50er-Filter, die
   Blass-Zeichnung, die Bester-Kanal-Auswahl (`quant.js` ~2517/2543/2578). **Ohne das
   ändert sich still, welche Kanäle überhaupt erscheinen** — der Weg wäre dann eine
   Verschlimmbesserung.
3. **Befund B1 des Desingners mitentscheiden:** „Güte" sind in der App **zwei
   verschiedene Zahlen** — Explorer/Strategie-Chart zeigen die `kanaele`-Güte, der
   Live-Signal-Monitor den strenger gebauten `trendChannel.score` (`quant.js` ~1529).
   **Für den zweiten ist der Rauschen-Median nie gemessen worden.** Wer baut, muss sagen,
   ob die Umstellung auch ihn betrifft — sonst stehen zwei Skalen unter einem Wort.
4. Alte Bildschirmfotos und das eigene Gedächtnis brechen (ein gewohntes „82" wird
   vielleicht „68 %"). Das ist der Preis, den Wilhelm ausdrücklich in Kauf nimmt.

**Grenze:** Die Güte löst nirgendwo einen Handel aus — gemessen und mit Absicht so. Es
geht um Ehrlichkeit der Anzeige, nicht um Handelsregeln.

### ⭐ STRANG C (2) — erst die Bestandsaufnahme, dann umstellen (Wilhelm 26.08. 21:15)

**Entschieden: erst erheben, wo die Produktannahme überall im Code steckt, Liste
vorlegen — dann an allen Stellen zugleich ändern.** Nicht sofort umstellen.

Seine Begründung ist die Projektgeschichte: die Produkt-Vorgabe stand hier schon einmal an
drei Stellen, **zwei davon falsch** (Hürde 0,26 statt 0,07 Pp). **Auftrag ist die Liste,
kein Umbau.** Danach kommt der Entscheid über die Umstellung selbst.

Die Zahlen zur Erinnerung: Aktie **0,04** · CFD 0,10 · Standard-Schein **0,23 Pp** je
Umlauf — Faktor 5,75, der stärkste bekannte Einzelhebel.

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

- **markt-dashboard-6c (Werkzeuge/Oberfläche)** — **belegt ** ab 26.08. ~23:0x:
  die offene Hälfte von Wilhelms 20:30-Entscheid — die Wand trennt noch bei
   **Signaltagen** statt an . Der Maschinen-Teil desselben
  Auftrags ist schon erledigt (), das Release hängt also nicht mehr daran.
  **Desingner: falls du diese Anzeige noch hältst, sag es — dann lasse ich sie los.**
  Vorher gemessen:  liegt in **69 Varianten** unter
   als **Bruch** (×100 = Pp); 
  ist in **0 von 69** Protokollen gesetzt. Median 0,219 Pp, Spanne 0,035 bis 4,390.
  Die Kostenhürden stehen an vier Stellen je einmal ausgeschrieben und in **keiner
  ausgelieferten Datei** — ich lege sie an einer Stelle ab statt einer fünften Kopie.

- **Desingner** — **#80 Perzentil ist GELIEFERT** (Baustopp 1b davor in `e11d7e9`).
  Eichung: 32.722 Zufallskanäle aus derselben Such-Pipeline (deterministisch,
  `studien/kanal-guete-2026-08-26/eichung.js` + `eichtabelle.json`) — **der
  Rauschen-Median liegt je Fensterlänge bei 75–94, der #80-Befund (75) war also
  noch geschmeichelt.** Anzeige überall „besser als X % des Zufalls" (Explorer
  beide Kanalarten inkl. Bild-Labels und Deckkraft, Strategie-Chart-Kontext,
  Info-Text); interne Auswahl unverändert in Roh-Güte (beweisbar gleiche
  Kanäle); Monitor-Score heißt jetzt „Pendel" (B1 — nicht umgestellt, Rauschen
  dafür nie gemessen). test-channel Nr. 19 prüft den Nullpunkt (Zufall → Median
  43 %, sauberer Trend → 100 %). npm test grün, ui-probe grün, Funktionstest am
  echten AAPL-Chart (10 Tooltips Perzentil, 0 Alt-Güte).

- **Berechnungen** — **Verzerrungsrichtung FERTIG gemessen (26.08. ~22:2x):**
  erstes belegtes Richtungsurteil — **das Überlebenden-Archiv beschönigt die
  Dip-Familie** (Dip-Rutsch-Zwilling c = −3,78 Pp, t = −6,19, 450 Paartage; Sockel
  nur −0,15). **Für rsi2seit-mcp materiell** (ΔB −0,48 Pp ≥ 6× dessen delta80, unter
  Ü1-Vorbehalt); kapitulation/monatsende im Fenster unerheblich; Monatsende ohne
  messbare Richtung. Wächter alle grün (Positivkontrolle 0,903). Gilt fürs Fenster
  2024-08→2026-08, NICHT für 2008/09. Vollständig: `studien/verzerrungsrichtung-
  2026-08-26/ERGEBNIS.md` + Vorregistrierung mit Nachträgen 9–12. Kohortenlauf auf
  Wilhelms »weiter«, nachdem der PM-Chat zwei Anfragen nicht beantwortete (Warnsignal:
  pm-lebt.txt steht seit 18:06). **Nächster Auftrag laut Freigabe-Reihenfolge:
  Strang A (momentum), eigene Vorregistrierung folgt.** Belegt nur `studien/`-Dateien.

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

- **26.08.2026, 21:15 (PM-Chat, Formular) — drei Richtungsentscheide:**

  **(1) #80 Kanal-Güte → Weg 2, das Perzentil.** „Enger als 91 % des Zufalls" statt
  „Güte 82/100". **Der teuerste der drei Wege, bewusst gewählt** — nicht der kleine
  Zusatz (Weg 1), nicht die Rangfolge (Weg 3). Was dranhängt: die versteckten Schwellen
  müssen mit umgeeicht werden, sonst ändert sich still, welche Kanäle erscheinen.
  Auftrag steht oben.

  **(2) Strang C → erst Bestandsaufnahme.** Erheben, wo die Produktannahme im Code
  steckt, Liste vorlegen; erst danach umstellen. Nicht sofort, nicht später.

  **(3) Die zwei Datenfunde → sofort beheben, vor allem anderen.** Phantom-Dochte und
  der unfertig eingefrorene 25.08. gehen vor das Release. Nicht nur ausweisen, nicht
  vertagen.

- **26.08.2026, 20:25/20:30 (PM-Chat, Formular) — drei Entscheidungen:**
  **(a) Minutenkerzen:** der PM holt sie nach Börsenschluss selbst nach. Der Stopp um
  20:09 war richtig (laufende US-Sitzung erzeugt Teilkerzen), die Begründung „der
  22:15-Lauf holt sie dann" war **falsch** — `tools/archiv-nachladen.js:68-69` holt nur
  60m und 1d, keine Intraday-Intervalle.
  **(b) Release wartet auf die Schranken-Reparatur**, nicht jetzt ausliefern.
  **(c) Die Eintrittskarte misst künftig `delta80` gegen die Kostenhürde** statt
  Handelstage. *Nachträglich bestätigt durch den A-Fund von 21:05: `tage80` zählt
  **Signaltage**, die Schranke verglich **Handelstage** — 187 Signaltage sind rund 4.016
  Handelstage. Die Entscheidung war richtiger, als zum Zeitpunkt bekannt war.*

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
