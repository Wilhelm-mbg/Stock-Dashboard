# Log — Änderungen an diesem Wiki

*Nur was sich am Wiki ändert. Die Projekt-Chronologie steht im Archiv `PROJEKTSTAND.md`.*

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
