# Log — Änderungen an diesem Wiki

*Nur was sich am Wiki ändert. Die Projekt-Chronologie steht im Archiv `PROJEKTSTAND.md`.*

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
