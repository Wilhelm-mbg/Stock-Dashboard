# Log — Änderungen an diesem Wiki

*Nur was sich am Wiki ändert. Die Projekt-Chronologie steht im Archiv `PROJEKTSTAND.md`.*

- 03.09.2026 Release v8.38.2 (Wache): Kursarchiv zeigt sich jetzt als Grafik (Balken je
  Auflösung, Kästchen je Tag) statt als Tabelle; Mittelfrist-Analyse & Bücher-Steuerung von
  den Einstellungen in Werkzeuge → Betrieb gezogen.
- 03.09.2026 Oberfläche Stufe 4b (Bau): [oberflaeche.md](oberflaeche.md) §3 Zielbild — Regeln
  ohne Mittelfrist, Betrieb mit zwölfter Klappe „Mittelfrist-Analyse & Bücher steuern"; §4 Stufe 4b
  als geliefert mit Fundstellen der Abhängigkeitsprüfung (`mfdepot.js:143`, `:184`, `:192`);
  [offene-auftraege.md](offene-auftraege.md) Zeile angelegt und gestrichen. Beleg:
  `uebergabe/oberflaeche-stufe4b-2026-09-03.md`, Commits `e64a458`, `4d2cae9`.
- 03.09.2026 Nachtrag zur Spannen-Studie (Berechnungen): [kosten.md](kosten.md) bekommt die
  Schluss-Hürde je Klasse und Regime mit Cluster-Bootstrap-Band (ab 2021: 0,1025 / 0,0540 /
  0,0409 / 0,0329 Pp) und die Gegenüberstellung Zusatz A gegen die Buch-Hürde (0,40 Pp je
  Umlauf, Faktor 9,1 über dem gemessenen Median, 41 von 41 darunter); [belegstand.md](belegstand.md)
  hält die 12 Übernacht-Zeilen gegen `schluss` (mitte-Urteil durchgestrichen; Summe aller 31
  von 2 / 14 / 15 auf 3 / 11 / 17 offen / zu / unentschieden); [offene-auftraege.md](offene-auftraege.md)
  zwei Punkte gestrichen, Zusatz C bleibt offen. Beleg:
  `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS-NACHTRAG.md`,
  `uebergabe/spannen-nachtrag-2026-09-03.md`.
- 03.09.2026 Spannen-Studie ausgewertet (Berechnungen): [kosten.md](kosten.md) Abschnitt
  „Kassa-Hürde je Umsatzklasse und Jahr" trägt die gemessene Tabelle (K je Klasse × Jahr ×
  Fenster mit Cluster-Bootstrap-Band, Median-Kurs und Cent-Boden-Anteil daneben), die
  Kassa-Zeile in „Je Gefäß" ist durchgestrichen und durch **vier** Zahlen ersetzt, die
  Kostenformel führt K je Klasse und F = 0; [belegstand.md](belegstand.md) bekommt den
  Abschnitt „Wiedervorlage an der gemessenen Kassa-Hürde" (31 Varianten: 2 offen, 14 zu,
  15 unentschieden mangels belegter Klasse) und zwei überholte Annahme-Hinweise gestrichen;
  [offene-auftraege.md](offene-auftraege.md) Spannen-Studie gestrichen, drei kleine offene
  Punkte angelegt (Zusatz C, Übernacht gegen Schlussfenster, Zusatz A ohne Gegenüberstellung).
  Belege: `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md`,
  `uebergabe/spannen-auswertung-2026-09-03.md`.
- 03.09.2026 Release v8.38.1 (Wache): Erklärtexte stehen jetzt hinter dem i-Knopf neben der
  Überschrift statt als Dauertext auf jeder Seite, der Simulations-Hinweis läuft einmal in der
  Kopfzeile statt als eigener Kasten mit, und die widerlegte Stunden-Strategie ist aus der
  aktiven Bilanz ins Strategie-Archiv gezogen.
- 03.09.2026 Release v8.38.0 (Wache): Oberfläche auf drei Bildschirme umgebaut (Heute, Regeln,
  Werkzeuge), „Heute" zeigt oben die drei Bücher mit Wert, Ergebnis und letzter Handlung, die
  Kopfzeile spricht jetzt Deutsch, und drei im Depot-Store liegengebliebene Kostenrunden zählen
  wieder in der CFD-Kostenmessung mit.
- 03.09.2026 Oberfläche Stufe 2 geliefert (Bau): [oberflaeche.md](oberflaeche.md) §4 Stufe 2 auf
  „geliefert“, §1 Cockpit-Nachtrag; [offene-auftraege.md](offene-auftraege.md) Zeile angelegt und
  gestrichen. Heute zeigt oben drei Buch-Karten, „Zuletzt getan“ und einen Verlauf über alle
  Bücher; die Kopfzeile spricht Deutsch; jede Betrieb-Klappe trägt eine Statuszeile aus einer
  benannten Quelle. Belege: `uebergabe/oberflaeche-stufe2-2026-09-03.md`.
- 02.09.2026 Release v8.37.3 (Wache): Fehlerbehebung — die Alpaca-Statuszeile in den
  Einstellungen wird jetzt auch dann aufgefrischt, wenn die Capital.com-Anbindung (CFD)
  nicht aktiv ist.
- 02.09.2026 Release v8.37.2 (Wache): Momentum-Buch handelt nur noch liquide Werte (≥100 Mio $
  Median-Tagesumsatz), exakt wie gemessen; zweites Kosten-Gefäß misst echte US-Aktien auf einem
  Alpaca-Paper-Konto neben dem Capital.com-Demo.

## 02.09.2026 — Momentum-Buch handelt die gemessene liquide Konfiguration (Buch = Messung)

**Geändert:** `belegstand.md` (Momentum-Zeile: „Buch seit 02.09.2026 auf liquidem Korb — ab hier
Out-of-Sample", Sperrklinke und bekannte Abweichung Universum), `offene-auftraege.md` (Auftrag
abgehakt).

**Was im Code passiert ist (Wilhelms Entscheid 02.09.):** neues Wurzelmodul `liquide.js` mit
der Korbregel der Studie (Median über 20 Balken von Schluss × Stück ≥ 100 Mio $, nominal);
`mfhandel.js` liest Fenster und Korbregel aus `momentum.js` + `liquide.js` statt eigener Zahlen;
`mittelfrist.js` speichert Stückzahlen mit und lädt Bestände ohne Stückzahl einmalig neu;
`mfdepot.js` schreibt die Umstellung als Handlung ins Journal, datiert die erste Umschichtung
auf dem Korb und weist die Korbgröße je Umschichtung aus; `studienurteile.js` trägt das
Vorwärtstest-Etikett („lebt", In-Sample, am Rand), jede Zahl per Test an `lauf-*.json` gebunden.
Die Studiendateien blieben unangetastet. **Kein Urteil wurde umformuliert.**

## 02.09.2026 (nachts, später) — Momentum liquide gemessen: „LEBT" nach Regel, In-Sample und am Rand

**Geändert:** `belegstand.md` (Momentum-Zeile um die liquide Fassung ergänzt), `offene-auftraege.md`
(liquide Fassung abgehakt), `kosten.md` (**„Der Effekt lebt, wo er nicht handelbar ist" von
„allgemeine Lehre" auf die Übernacht-Familie eingegrenzt** — Momentum ist das Gegenbeispiel;
„allgemeine" durchgestrichen, nicht gelöscht).

**Befund:** Korb nur ≥ 100 Mio $ Median-Tagesumsatz (40 von 400 statt 165 von 1.650): brutto
+1,835 Pp je Umlauf, se 0,911, t 2,02, 79 Perioden, Band [+0,050, +3,620]; gepaart gegen breit
+0,29 (t 0,69). Registrierte Regel „LEBT" erfüllt — mit 0,05 Pp Abstand zur unteren Grenze,
unter der Familienschwelle 2,638, in 18 von 63 Rasterlagen. Die registrierte Erwartung
(„stirbt oder nicht entscheidbar") traf nicht ein und steht so im Ergebnis. W0 (Filter aus)
reproduzierte das Vorbild exakt. `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md`

## 02.09.2026 (nachts) — Monats-Momentum gemessen: „nicht entscheidbar" am CFD, Obergrenze netto +0,6 Pp

**Geändert:** `belegstand.md` (Momentum-Zeile: „vertagt" durchgestrichen, Messung eingetragen),
`offene-auftraege.md` (Momentum-Messung erledigt; **„rechnerisch ein Nein" korrigiert** — das
Urteil lautet wörtlich „nicht entscheidbar", der Punkt liegt unter der Hürde, die Obergrenze
darüber; offen bleibt die liquide Fassung), `aufloesungswand.md` (zweiter Fall der zu
konservativen Planformel; Momentum als Beispiel der Haltedauer-Falle),
`ueberlebensverzerrung.md` (**Weg-3-Wert dreht mit dem Horizont** — nie über Horizonte
übertragen), `kosten.md` (Monatshaltedauer ausgefüllt: F·H 2,26 Pp übersteigt die Kante;
Liquiditätsprofil des Korbs), `entscheide.md` (Notiz: CFD-Messung per Auftrag vorgezogen).

**Erste Messung von Momentum überhaupt** (bisher nur Eichung): brutto +1,541 Pp je Umlauf,
se 0,732, t 2,10, 79 unabhängige Perioden; CFD netto −0,829, Obergrenze netto +0,605; Kassa
(Annahme) netto +1,481, t 2,02 — kein Urteil. Placebo, Positivkontrolle, W0 grün.
`studien/vorregistrierung-2026-09-02-momentum-messung/`

**Zwei Lehren fürs Wiki:** (1) Die konservative Machbarkeitsformel hätte die CFD-Frage
für blind erklärt, die geeichte traf auf drei Stellen. (2) **Ein registriertes
Placebo-Kriterium war falsch gebaut** — es setzte für einen Zufallskorb dieselbe Streuung
voraus wie für einen Faktor-Korb (Nachtrag 1, vor dem Urteilslauf; das gefallene Kriterium
bleibt im Ergebnis sichtbar, beide Lesarten stehen nebeneinander).

## 02.09.2026 — Obergrenzen fertiggestellt (31 von 52 gegen CFD geschlossen), Depot-Kandidatenliste: NEIN

**Geändert:** `belegstand.md` (neuer Abschnitt „Größen-Ausschlüsse" mit Kandidatenliste; Zeilen
glockendruck, Übernacht-Familie, rsi2seit, Momentum, Winkel um Obergrenzen ergänzt — Urteile
unverändert, nur die Größenaussage dazu; neue Zeile `kapitulation`), `offene-auftraege.md`
(Wiedervorlage gestrichen, Anforderung an die Paper-Konto-Spiegelung ergänzt).

**Keine neue Messung.** Grundlage: die vorhandenen Protokolle, gelesen mit
`tools/obergrenzen-bericht.js`, dessen Hürden auf `kosten.md` gezogen wurden (0,06 Annahme /
0,10 / 0,1247 / 0,23 statt 0,04 / 0,05 / 0,10 / 0,23). Bericht:
`studien/wiedervorlage-2026-09-02/BERICHT.md`.

**Lint-Fund nebenbei:** `belegstand.md` nannte für `rsi2seit` „+0,021 Pp je Signal" — richtig,
aber dieselbe Variante hat ein Tagesmittel von +0,054 im selben Protokoll. Beide Skalen stehen
jetzt nebeneinander, mit Fundstelle im Repo statt „im Datenordner" (die Ordner sind identisch).

## 02.09.2026 — Momentum-Buch wird auf den liquiden Korb umgestellt

`entscheide.md`, `offene-auftraege.md`: Wilhelms Entscheid per Formular; Radar-Routine bleibt.

## 02.09.2026 (Lint durch den PM) — nominale Schwelle als Fehlerform

Die liquide Momentum-Sitzung hat vier Seiten korrekt aktualisiert; nachgetragen in
`fehlerformen.md`: die Drift eines nominalen Dollar-Filters über 20 Jahre.

## 02.09.2026 — Release-Wache auf das Wiki umgestellt

Rollenanweisung `release-wache/SKILL.md` aktualisiert: liest `wiki/betrieb.md` statt der Tafel,
trägt nach jedem Release den Stand hier ein (Schritt 7), kennt den zweiten Absturz-am-Schluss
(Netz-Gegenprobe, 31.08.) und den Kürzel-Wechsel nach Brücken-Neustart.

## 02.09.2026 — liquide Momentum-Fassung beauftragt

`entscheide.md`, `offene-auftraege.md`: Wilhelms Entscheid per Formular.

## 02.09.2026 (Lint durch den PM) — zwei Formen aus der Momentum-Messung

Die messende Sitzung hat sieben Seiten korrekt aktualisiert. Nachgetragen in `fehlerformen.md`:
**„Kontrollkriterium falsch gebaut"** (auch Kontrollen brauchen eine Positivkontrolle) und die
gelungene Gegenprobe zur zu konservativen Planformel (geplant 2,05 = gemessen 2,051).

## 01.09.2026 (abends) — News-Sentiment gemessen: NEIN. Und die Wand war nicht das Fenster

**Geändert:** `belegstand.md` (News-Sentiment von „messbar, Messung steht aus" nach
**Widerlegt** — beide Vorgänger-Fassungen durchgestrichen stehen geblieben),
`datenquellen.md` (neuer Kasten „Die Wand ist nicht das Fenster"), `aufloesungswand.md`
(Faktor-75-Zeile als überholt markiert; dritte Falle und der Abschnitt zur Konservativität
der Planformel ergänzt).

**Urteil:** b = +0,0070 Pp/Score-Punkt, t = 0,31, mitten im Placebo-Band; selbst die
Obergrenze des 90-%-Bandes liegt Faktor 8,5 unter der CFD-Hürde.
*Fundstelle: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`*

**Zwei Korrekturen an Aussagen von heute Nachmittag, beide aus dem eigenen Lauf:**
1. Die „**2.367 Zeitpunkte**" in `belegstand.md` waren Handelstage, nicht Tage mit
   Nachrichten. Nutzbar sind **1.338** — vor Mai 2021 liegt die Abdeckung unter 10 %.
   Die Lücke war in `GRATIS-PRUEFUNG.md` §2 ausdrücklich als ungezählt markiert; jetzt gezählt.
2. Die konservative Planformel für geclusterte Standardfehler war um **Faktor 4,2** zu
   pessimistisch. Als Regel in `aufloesungswand.md` festgehalten — samt der Pflicht, so einen
   Zugewinn als Zugewinn zu kennzeichnen und nicht als das, was vorregistriert war.

## 01.09.2026 (abends) — Reihenfolge umgestellt, ein Auftrag gestrichen

`offene-auftraege.md` und `entscheide.md`: Paper-Konto wird Voraussetzung, Momentum vertagt,
Konservativitäts-Audit gestrichen (Begründung dort). **Der PM hatte zwei Prompts mit ~1M Token
vorgeschlagen und beim Nachrechnen selbst gefunden, dass einer ein absehbares Nein und der andere
zur Hälfte am Problem vorbei war.** Wilhelm fragte „ist das wirklich sinnvoll?" — die Antwort war
nein, und sie steht jetzt hier statt nur im Chat.

## 01.09.2026 (Lint durch den PM) — zwei Fehlerformen nachgetragen

Die Sentiment-Sitzung hat vier Seiten korrekt aktualisiert, aber ihre beiden **verallgemeinerbaren**
Befunde standen nur im Ergebnisbericht: **„Die Wand ist nicht das Fenster"** und **„Planformel um
Faktor 4,2 zu konservativ"**. Beide sind Fehler*formen*, keine Einzelbefunde — sie gehören nach
`fehlerformen.md`, sonst findet sie niemand, der nicht ohnehin diese eine Studie liest.

**Das ist die Lint-Aufgabe:** nicht Widersprüche glätten, sondern prüfen, ob ein Befund auf der
Seite steht, auf der ihn jemand sucht.

## 01.09.2026 (später) — erste Aktualisierung, und sie widerlegt eine Wiki-Aussage von vorhin

**Geändert:** `datenquellen.md` (Gratisstufe kann viel mehr als ihre Doku; Dichte gezählt statt
geschätzt), `belegstand.md` (News-Sentiment von „nicht messbar" auf **messbar, Messung steht
aus** — altes Urteil als überholt markiert, **nicht gelöscht**), `entscheide.md` und
`offene-auftraege.md`.

**Der Vorgang ist selbst ein Beleg fürs Muster:** Die Tarif-Empfehlung von Vormittag nannte die
Nachrichten-Historie als Hauptkaufgrund. Die empirische Prüfung am Nachmittag fand sie **bereits
in der Gratisstufe**. Im alten Log hätten beide Aussagen nebeneinander gestanden, die falsche
zuerst. **Hier steht nur die geprüfte — mit der überholten sichtbar durchgestrichen daneben.**

## 01.09.2026 — angelegt

Elf Seiten plus Index, vom PM erstellt auf Wilhelms Auftrag. **Anlass:** `PROJEKTSTAND.md` war
auf 638 KB / 9.959 Zeilen angewachsen — grob 160.000 Token und damit als Nachschlagewerk
unbrauchbar. Jeder Auftrags-Prompt enthielt deshalb die Anweisung, die Tafel *nicht* zu lesen.

**Muster:** angelehnt an Karpathys „LLM Wiki" — Rohdaten unveränderlich, abgeleitete Wiki-Ebene
darüber, Index und Log daneben. **Ergänzt um die Zitierpflicht**, weil sich in diesem Projekt
bereits zweimal eine Aussage ohne Fundstelle wochenlang weitergetragen hat.

**Was NICHT passiert ist:** Kein Urteil wurde umformuliert, nichts gelöscht. `PROJEKTSTAND.md`
bleibt vollständig als Archiv; oben steht jetzt ein Verweis hierher.

**Bekannte Schwäche dieser ersten Fassung:** Ein Teil der älteren Urteile (Stunden-Strategie,
Abschnittskanäle, Krypto-Dips, Monatswende, Bullenflagge) ist als **„Gedächtnisprotokoll, keine
Fundstelle im Repo"** markiert — die zugehörigen Studienberichte liegen außerhalb des heutigen
`studien/`-Bestands. **Wer sie findet, trägt die Fundstelle nach.**

- 02.09.2026 (PM) — Broker-Recherche für die Aktien-Kostenmessung; Entscheid Wilhelm: **Alpaca-Paper**. Neu: Abschnitt „Broker-Schnittstellen" in datenquellen.md, Zeile in entscheide.md, Auftragszeile in offene-auftraege.md umgeschrieben (war: Paper-Konto beim Aktienbroker, offen).
- 02.09.2026 (Chat, abends) — Alpaca-Paper als zweites Kosten-Gefäß **gebaut** (`alpaca.js`, `kosten.js`, `depot.js`, `main.js`, UI, Sperrklinken a–e). Neu: Abschnitt „Aktien-Gefäß Alpaca, Messung läuft seit 02.09.2026" in kosten.md, Kassa-Zeile dort als „Annahme, wird gemessen" markiert; Auftragszeile in offene-auftraege.md gestrichen (offen bleibt Wilhelms Verbindungstest). Fundstelle `uebergabe/alpaca-kostenmessung-2026-09-02.md`.
- 02.09.2026 (PM, abends) — Historische Spannen-Studie aus der Alpaca-Kurstafel beauftragt (Wilhelms Einwand: Paper-Runden = unvollständiger Datensatz). Zeilen in offene-auftraege.md und entscheide.md.
- 02.09.2026 (Chat, spät) — **Historische Spannen-Studie: Schritt 0 bestanden, Lauf gestartet.** Die Alpaca-Gratisstufe führt die NBBO-Tafel (`feed=sip`) zurück bis mindestens Anfang 2016 — neuer Abschnitt „Alpaca als KURSQUELLE" in [datenquellen.md](datenquellen.md) mit Kasten zur **`iex`-Falle** (Anfrage 2018, Antwort 2020, HTTP 200, keine Warnung). Neuer Abschnitt „Kassa-Hürde je Umsatzklasse und Jahr" in [kosten.md](kosten.md) mit dem **Cent-Boden**: für liquide Werte ist die Spanne in Pp eine Preis-, keine Liquiditätsaussage (64–68 % der Quotes am 1-Cent-Boden). Die Kassa-Annahme 0,06 ist **nicht** durchgestrichen — der Lauf ist noch nicht durch. Vier neue Werkzeug-Fallen in [fehlerformen.md](fehlerformen.md) (Zeitstempel als Zeichenkette, Alias an der Sperrklinke vorbei, Schnittstelle antwortet lieber irgendetwas, Trockenlauf sieht aus wie Befund). [offene-auftraege.md](offene-auftraege.md) auf „läuft". Fundstellen: Registrierung `4f22b14`, Übergabe `uebergabe/spannen-historisch-2026-09-02.md`.
- 02.09.2026 (PM, spät) — Spannen-Studie abgenommen: Werkzeug, Registrierung, Testlauf, Zusatz-A-Kontrolle liegen committet; **Vollauf noch nicht gestartet** (kein Prozess, kein Fortschritt) — Auftragszeile in [offene-auftraege.md](offene-auftraege.md) entsprechend präzisiert, Start ist Wilhelms Handlung im eigenen Terminal.
- 02.09.2026 (PM, spät) — **Oberfläche:** Abnahme aller 15 Seiten in isolierter Instanz (v8.37.3) + Code-Karte; Wilhelms Entscheid „schneiden auf drei Bildschirme". Neue Seite [oberflaeche.md](oberflaeche.md) (Ist, Befund, Zielbild, Stufen 1–4, Klinken K1–K26, Aufnahme-Rezept); Zeile in [entscheide.md](entscheide.md); Auftrag Stufe 1 in [offene-auftraege.md](offene-auftraege.md); Index ergänzt.
- 02.09.2026 (Chat, spät) — **Oberfläche Stufe 1 geliefert: drei Bildschirme.** 5 → 3 Reiter (Heute · Regeln · Werkzeuge), 14 → 9 Pillen; Bestand (Bücher + Depot + Protokoll) ganz oben unter Heute, neue Pille **Werkzeuge → Betrieb** mit elf geschlossenen `<details>`-Klappen. Kein Block gelöscht, keiner neu gebaut, kein Text geändert (maschinell belegt: Kennungen 390/393, keine doppelt; sichtbarer Text vollständig). 36 Sperrklinken umgeschrieben oder neu, **37 Gegenproben, 37-mal rot** — eine fand eine echte Lücke: `/data-tab="[a-z]+"/` übersieht einen Reiter mit Großbuchstaben, den der Umschalter danach still ignoriert ([fehlerformen.md](fehlerformen.md), „Prüfung prüft etwas anderes"). Neues Werkzeug `tools/ui-aufnahmen.js` (Rezept [oberflaeche.md](oberflaeche.md) §6). [oberflaeche.md](oberflaeche.md) §4 auf „geliefert", §1/§5 als Vorzustand markiert; Auftragszeile in [offene-auftraege.md](offene-auftraege.md) gestrichen. Offen aus dem Zielbild: die Statuszeile im `<summary>` (Gestaltung, Stufe 2). Fundstelle `uebergabe/oberflaeche-stufe1-2026-09-02.md`, Release durch die Wache.
- 02.09.2026 (PM, nachts) — Oberfläche Stufe 1 **abgenommen**: eigener Lauf test-v6 grün, ui-probe grün (3 Reiter, 9 Pillen), Nachher-Aufnahmen gesichtet. Stufe 2 beauftragt, Statuszeilen der Betrieb-Klappen dort eingereiht ([oberflaeche.md](oberflaeche.md) §4).
- 03.09.2026 (PM, früh) — Oberfläche Stufe 2 **abgenommen**: eigener Lauf test-v6 grün, ui-probe grün (Intraday-Bereich hidden bei Strategie aus, 3 Karten), Kunstdaten-Aufnahmen gesichtet. Stufe 3 beauftragt; Nacharbeiten-Auftrag für Leck-Test (probe.js) und Kachel-Handbau (renderer.js, backtestui.js). **Release fällig:** drei Notizen in release-notizen/, Wache 00:22 brach wegen schmutzigem Baum ab, Baum ist seit 96b7c2f sauber.
- 03.09.2026 (Chat, früh) — **Nacharbeiten aus Oberfläche Stufe 2** (Befund 1 und 3). Der Leck-Test der Spannen-Studie **reicht die Ausgabe jetzt durch**, statt sie zu schlucken; die Zwischenlösung (eine Klinke auf die *Reihenfolge* der Abschnitte) ist durch zwei Zusicherungen auf die Sache ersetzt — Textmarke **und** Verhalten. Gegenprobe: mit dem alten Haken zeigt die Suite **2.872 statt 2.902** Zusicherungen und eine ganze Abschnittsüberschrift gar nicht. Zwei gleichzeitige Leck-Tests würden sich verschachteln (der zweite bindet den Haken des ersten) — Block 35 wartet deshalb jetzt. `renderer.js` und `backtestui.js` bauen die **Kachel nicht mehr von Hand** (neues `U.kachel`-Feld `opt.extra` für die Sparkline); Aussehen identisch, belegt über Markup-Gegenprobe gegen das echte `U` (7 Fälle) **und** Vorher/Nachher-Aufnahmen. Die Klinke liest jetzt **alle 58 `.js` der Wurzel ohne Ausnahmeliste** und ist umgedreht: statt „diese Dateien dürfen nicht" heißt sie „genau `app-shell.js` darf" — ein Rückfall wird beim Namen genannt. Die B2-Klinke (`kachel-sub` statt `sub`) ist **mit umgezogen statt abgeschwächt**; in `renderer.js` allein wäre sie stumm geworden. Fundstelle `uebergabe/nacharbeiten-2026-09-03.md`, Commits `b0a67eb`, `ab973e9`. Keine Release-Notiz: für den Anwender ändert sich nichts.
- 03.09.2026 (Chat, nachts) — **Oberfläche Stufe 3 geliefert: Schnitt.** 36 Sätze aus elf Blöcken stehen **wörtlich** im Erklaerregister, im Panel je ein Satz plus i-Knopf (32 Einträge, keiner leer, keiner verwaist, jedes Panel mit Knopf). Gekürzt wurde nichts — belegt durch eine Prüfung aller 36 Sätze gegen das Register und eine Tabelle Panel → Eintrag in der Übergabe. **Dauertext je Panel −17 %** (39.542 → 33.005 Zeichen `innerText` in isolierter Instanz), Maschinenraum −22 %; `tools/ui-aufnahmen.js` schreibt die Zahlen jetzt als `textmenge.json` neben die Bilder — Beleg, kein Kriterium. „Alles hier ist Simulation …" steht **einmal** in der Kopfzeile statt als Kasten am Fuß eines Reiters; die Fußzeile stand schon einmal (nichts zu verschieben, Abweichung 1). Die fünf Trefferquoten-Balken der widerlegten Stunden-Strategie sind aus der Bilanz der **laufenden** Regel ins Archiv gezogen, der Backtest ist nicht mehr auf sie voreingestellt. **Live = Messung:** die neun Mittelfrist-Felder sind gesperrt und werden aus `D.mfBuch.konfig` / `Drift.STANDARD` gefüllt — Ausnahme `#mfKosten` (die Zahl lebt im Handelscode; eine Klinke hält Anzeige und Ausführung gegeneinander). Neuer Abschnitt `65) Schnitt` (65 Zusicherungen) mit einer **Dauertext-Klinke**: außerhalb von Klappen, versteckten Bereichen und einer begründeten Weißliste kein Erklärabsatz über 240 Zeichen — die elf Betrieb-Klappen zählen mit, sonst wäre der Maschinenraum ausgenommen. **12 Gegenproben, 10 sofort rot**; die zwei anderen sind der Ertrag: ein Eingriff war mit 228 Zeichen zu kurz (die Klinke hatte recht), und „jedes Panel hat einen Erklärknopf" las bei fehlender Endmarke die Knöpfe der **Nachbarpanels** mit — Fehlerform „die Prüfung, die etwas anderes prüft". Dazu die Testmarken-Falle: der Kommentar, der den Umzug erklärt, nennt die verschobenen Überschriften selbst und machte die Klinke rot ([fehlerformen.md](fehlerformen.md)); gelesen wird jetzt der kommentarfreie Quelltext. `npm test` (3.043), ui-probe, a11y-Sonde grün; neue Info-Probe klickt drei i-Knöpfe in einer isolierten Instanz wirklich an. [oberflaeche.md](oberflaeche.md) §4 auf „geliefert", Auftragszeile in [offene-auftraege.md](offene-auftraege.md) gestrichen. Fundstelle `uebergabe/oberflaeche-stufe3-2026-09-03.md`, Commits `2b59253`, `f75ad0e`, `1a5c0cf`, `ba395f7`; Release durch die Wache.
- 03.09.2026 (PM, früh) — Oberfläche Stufe 3 **abgenommen** (eigener Lauf test-v6 grün, ui-probe grün; Kunstdaten-Aufnahmen gesichtet: −17 % Dauertext, Mittelfrist-Felder gesperrt, Trendfinder eine Zeile). Nacharbeiten (Leck-Test, Kachel) abgenommen. Platzhalter `GEGENPROBEN_ZEILE` in offene-auftraege.md ersetzt. Stufe 4 beauftragt, erweitert um die zweizeilige Kopfzeile (Abweichung 5).
- 03.09.2026 (PM) — Spannen-Auswertung **abgenommen**: die vier Klassen-Mediane (mitte, ab 2021) aus den Rohdaten auf E: unabhängig nachgerechnet, identisch auf vier Stellen; Kontrollen mit Zahl in `uebergabe/spannen-auswertung-2026-09-03.md`. Drei kleine offene Punkte stehen in [offene-auftraege.md](offene-auftraege.md) (Zusatz C, Übernacht gegen Schlussfenster, Zusatz A ohne Gegenüberstellung).
- 03.09.2026 (PM) — Spannen-Nachtrag **abgenommen** (`9ca3001`): Schluss-Mediane ab 2021 unabhängig nachgerechnet (0,1025 / 0,0540 / 0,0409 / 0,0329), identisch. Übernacht-Familie jetzt gegen das Schlussfenster: alle 31 Varianten 3 offen / 11 zu / 17 unentschieden (vorher 2/14/15). Momentum-Buch unterstellt 0,40 Pp je Umlauf, gemessen 0,0439 — 41 von 41 Umschichtungen darunter.
- 03.09.2026 (Chat, vormittags) — **Oberfläche Stufe 4 geliefert: Archiv-Grafik und Kopfzeile.** ✅ **geliefert 03.09.** (`uebergabe/oberflaeche-stufe4-2026-09-03.md`) — **Das Kursarchiv ist eine Grafik**: je Auflösung ein Balken über die letzten 60 Handelstage, **eine Zelle je Tag** (gesammelt / lückenhaft / nichts da) — eine Kerbe mittendrin bleibt sichtbar, in einer Prozentzahl verschwindet sie. Daneben Werte, angesehene Reihen, Alter der jüngsten Kerze; ein Alarm **nur wenn etwas schiefsteht**. Die fünf „Jetzt holen"-Knöpfe stehen unter der Grafik und bleiben verdrahtet, die Live-Zeile „So ist es eingestellt" bleibt. **Keine Zahl im Markup:** neue Leseauskunft `archiv-abdeckung` (main.js) auf **reinen, in Node prüfbaren** Funktionen in `archiv.js` (`tageVon`, `tagesBild`, `abdeckungBild`); die erwarteten Handelstage kommen aus `boerse.js` — ohne Feiertagskalender wären Thanksgiving und der 4. Juli Kerben, an denen niemand etwas versäumt hat. Sie schreibt nichts und hängt **nicht** an `sammlerStand()` (der wird während eines Laufs alle zehn Werte gefunkt). Reines SVG, kein neuer Zeichner. Die zwei Autopilot-Balken „1-Min: x/60 Tage" entfallen als **Anzeige**, die Rechnung bleibt im Analyse-Export. **Kopfzeile einzeilig:** Marke „Simulation" mit i-Knopf statt des ganzen Satzes, der wörtlich in `heute.simulation` steht — **gemessen** bei 1280 **und** 1024 px (gemeinsames waagerechtes Band, `tools/ui-aufnahmen.js --breite`), Kopfhöhe 67 → 33 px. Bei 1024 war der Anstoß der **leere** Fehlerplatz `#err` mit 8 px Außenabstand (981 von 984 Punkten belegt) — behoben mit `.err:empty` und einer Medienregel. Marktlage-Absatz wörtlich nach `regeln.intraday`, Statuszeilen unangetastet; tote Regel `.buecher-zusicherung` weg (Abweichungen 5 und 9 der Stufe-3-Übergabe erledigt). Neuer Abschnitt `66)` mit **45 Zusicherungen**, vier Altklinken umgeschrieben. **48 Gegenproben, 47 sofort rot** — der Ertrag sind die zwei, die **grün blieben, weil sie nichts fanden**: beide verglichen zwei `indexOf`-Ergebnisse, und ein fehlender Treffer ist −1, der vor allem sortiert; genau am Fall, gegen den sie gebaut waren, waren sie blind (geschärft, `60188db`). Ein 48. Eingriff macht nicht rot, sondern **bringt die Suite um** (fehlender `isFinite`-Wächter) — ausgewiesen. `npm test` (3.089 allein, 3.137 mit Stufe 4b), ui-probe und a11y-Sonde vorher/nachher grün. Aufnahmen in `uebergabe/aufnahmen-stufe4/` (leer/Kunstdaten × 1280/1024, je mit `textmenge.json` samt Kopfzeilen-Messung); Kunst-Archiv in `tools/kunstdepot.js` mit absichtlichem Loch und teilgefüllten Tagen. **Zwei Befunde:** (1) es gibt **zwei** Archive namens Kursarchiv — der Datenordner (den die Grafik zeigt) und der Renderer-Store `bars_*` (den die Autopilot-Balken zeigten), **ohne Spiegelung**; (2) der Dauertext-Abtaster aus Stufe 3 liest nur `index.html` und ist für jeden vom Renderer geschriebenen Absatz blind — die neue Laufzeit-Messung findet 13 Läufe über 240 Zeichen, zwölf davon Live-Daten oder Messaussagen, **einer** echter Erklärtext (`depot.js:1614`). **Nebenbei ein Vorfall, der in die Fehlerformen gehört:** der erste Gegenproben-Lauf lief im **geteilten Arbeitsbaum** — er patcht eine Datei, lässt die Suite laufen und schreibt sie aus dem Speicher zurück; in dasselbe Fenster (09:02–09:14) fiel der Arbeitsbeginn der Sitzung „Oberfläche 4b". Gestoppt, eigener Rest-Patch zurückgenommen, Wiederholung in einer isolierten `git archive`-Kopie. Ob eine fremde Schreiboperation überschrieben wurde, ist von hier nicht feststellbar — steht als Punkt 1 in der Übergabe. **Regel: Gegenproben gehören in eine eigene Kopie, nie in den geteilten Baum.** [oberflaeche.md](oberflaeche.md) §4 auf „geliefert", Auftragszeile in [offene-auftraege.md](offene-auftraege.md) angelegt und gestrichen. Fundstelle `uebergabe/oberflaeche-stufe4-2026-09-03.md`, Commits `b95dce3`, `d803653`, `37e72f2`, `60188db`; Release durch die Wache.
- 03.09.2026 (PM) — Oberfläche **Stufe 4 und 4b abgenommen** (eigener Lauf test-v6 grün, ui-probe grün; Aufnahmen: Archiv-Grafik mit Kerben, Kopfzeile einzeilig mit Marke SIMULATION, Regeln → Einstellungen nur noch Intraday/Risiko/Watchlist, Mittelfrist-Analyse als zwölfte Betrieb-Klappe). Vier kleine Baustellen aus den Übergaben in [offene-auftraege.md](offene-auftraege.md) eingetragen. Der UI-Plan aus [oberflaeche.md](oberflaeche.md) ist damit bis auf die Politur von Explorer/Schein-Finder (auf Wilhelms Zuruf) abgearbeitet.
