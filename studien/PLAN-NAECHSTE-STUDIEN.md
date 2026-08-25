# Plan: die nächsten Studien

Stand 25.08.2026. Grundlage: acht Studienvorschläge aus fünf Blickwinkeln, jeder von einem
eigenen Skeptiker angegriffen. **Kein einziger Vorschlag hat in der eingereichten Form
standgehalten** — alle acht Urteile lauten `haelt_stand: false`. Vier davon haben trotzdem
einen tragfähigen Kern, drei sind es wert, gemessen zu werden.

Dieses Dokument entscheidet drei Dinge:

1. Was **heute** ohne eine einzige Messung korrigiert gehört (Abschnitt 1).
2. Welche drei Studien **gemessen** werden und in welcher Reihenfolge (Abschnitte 2–4).
3. Was **nicht** gemessen wird, und warum das genauso wichtig ist (Abschnitt 5).

Abschnitt 6 nimmt ernst, dass hier gar nichts mehr zu finden sein könnte.

---

## 0. Der Befund, der über allem steht: die Auflösungswand

Bevor irgendeine Studie sortiert wird, hier die Zahl, aus der alles Weitere folgt.

Aus dem eigenen Protokollarchiv, 38 Varianten aus 21 Protokollen:

| Größe | Wert |
|---|---|
| Median-Standardfehler der Bestätigungshälfte | **0,148 Pp** |
| Median-MDE (Hausmaß, `mdeFaktor = 2`) | **0,297 Pp** |
| Median-delta80 (Schwelle + 0,8416 × se) | **0,605 Pp** |
| Kostenhürde CFD/Basiswert je Umlauf | 0,10 Pp |
| Größte je sauber gemessene Nettokante | 0,047 Pp |

Rückgerechnet aus `monatswende-breit-2026-08-25.json` (se 0,1812 Pp auf 241 Signaltagen)
liegt die **Tagesstreuung eines breiten Signals bei rund 2,8 Pp**. Daraus folgt, was mit
diesen Daten überhaupt entscheidbar ist:

| Ziel (delta80, Schwelle 2,50) | nötige Bestätigungs-Signaltage | in Jahren |
|---|---|---|
| 0,60 Pp | 244 | 1 |
| 0,20 Pp | 2.190 | 8,7 |
| **0,10 Pp (= Kostenhürde)** | **8.770** | **35** |
| 0,05 Pp | 35.000 | 139 |

`archiv1d` hat 10.076 Handelstage, davon 5.038 in der Bestätigung. **Eine Kante in der
Größe der eigenen Kostenhürde ist mit diesem Archiv nicht bestätigbar** — nicht mit einer
besseren Methode, nicht mit einem besseren Detektor, nie. Und das gilt nur für ein Signal,
das jeden Tag feuert. Ein Monatswende-Signal hat 241 statt 5.038 Tage und liegt bei
delta80 ≈ 0,50 Pp — das Fünffache der Hürde.

Damit steht die Rangfolge fest, bevor sie begründet wird: **die einzige Studie, die diese
Wand verschieben kann, ist die wichtigste.** Alles andere misst hinter der Wand.

Zweiter Befund derselben Klasse, ebenfalls schon in den Daten: von den 38
Bestätigungs-Varianten erreichen **2** ein |t| über 2, das Maximum ist 2,14, der Median
liegt bei 0,69. Unter reinem Rauschen wären 1,73 über 2 zu erwarten und der Median bei
0,674. Der gesamte Bestätigungskorpus des Projekts ist **von reinem Rauschen bisher nicht
unterscheidbar**. Dazu Abschnitt 6.

---

## 1. Stufe 0 — der Schreibtisch. Heute, null Messungen, null Tests

Das Wertvollste in diesem ganzen Stapel kostet keine Rechenzeit. Neun Punkte, alle aus den
Skeptiker-Urteilen belegt, keiner braucht eine Vorregistrierung, weil kein Urteil über die
Welt gefällt wird, sondern eine Rechenzeile oder ein Buchungsfehler berichtigt.

**S1 — Belegstand korrigieren: das Projekt hat NULL belegte Kanten.**
Momentum ist am 24.08. an B10 gestorben (`studien/messmaschine/ERGEBNIS-2026-08-24-momentum.md`:
t 4,74 → 0,74, se um Faktor 6,42 zu klein, 0 von 63 Rasterlagen über der Schwelle,
Urteil „nicht entscheidbar, alle vier Varianten"). Die Ergebnis-Drift ist am 23.08. in
`studien/kontrolle-2026-08/BEFUND.md` und im ausgelieferten App-Text
`strategien.js:83` selbst als „im zurückgehaltenen Zeitraum … t = 1,7–2,0: nicht
entscheidbar" ausgewiesen. Trotzdem steht einen Tag später:

- `studien/vorregistrierung-2026-08-25/ERGEBNIS-monatswende-breit.md:101` — „zwei validierten Kanten (Momentum, Ergebnis-Drift)"
- `studien/vorregistrierung-2026-08-25/ERGEBNIS-quartalsschub-betrag.md:96` — dasselbe
- `mfdepot.js:4` — „die zwei belegten Mittelfrist-Strategien"
- Speichernotizen `ergebnis-drift-belegt.md` (führt +10,44 % p. a. — eine Zahl, die Commit 259d723 kassiert hat) und `mittelfrist-depot-handelt.md`

Das Hauptbuch widerspricht sich selbst. **Nicht widerlegt, aber unbelegt** ist die richtige
Formel für beide. Der Widerspruch darf keinen Tag länger stehen; er ist der Grund, warum
Vorschläge gebaut werden, die eine nicht existierende Kante voraussetzen.

**S2 — `delta80` in jedes Urteil.** Eine Zeile in `messmaschine.js` neben `u.mde`:
`delta80 = (schwelle + VERFAHREN.zPower80) * u.se`. Rückwirkend für die 38 vorhandenen
Varianten aus `se` nachtragen. Damit steht in jedem Protokoll schwarz auf weiß, welche
Kante der Lauf hätte sehen können — Median 0,605 Pp. Das ist der komplette Ertrag, den
`kanten-wiederfindung` als Studie verkaufen wollte, für Minuten statt für sieben
Spiegelarchive à 1,3 GB.

**S3 — die Kostenhürden-Arithmetik prüfen, aber die Hürde NICHT senken.**
`capital.js:227` definiert `spreadPct = (offer − bid)/mid`, also bereits den vollen Umlauf.
`depot.js:3054` meldet `notiertPct = spreadPct * 200`, `spannenBilanz` (`depot.js:2920ff`)
stellt dasselbe Feld mit `*100` gegen 0,10. Beides kann nicht stimmen, und die als
„gemessen 0,104 %" geführte Zahl ist rechnerisch 2 × 0,0522. Das ist ein C5-Fall.
**Aber:** daraus folgt ausdrücklich *nicht*, dass die Hürde halbiert wird. Für das
tatsächliche Archivuniversum zeigen die eigenen Ablehnungen in die Gegenrichtung
(`leerbuch-tageskerzen`: Roll ~0,93 Pp je Umlauf; `innertags-abgabedruck`: 3,97 Pp
Mindest-Tick). Richtig ist die Produkt-Kostentabelle aus `studien/signalstudie-2026-08/BERICHT.md`
(Aktie 0,04 / Schein ATM 0,05 / CFD 0,10 / Standard-Schein 0,23) plus die Ansage, dass sie
für 15 US-Großwerte im Jahr 2026 gilt und für sonst nichts.

**S4 — Vorab-Tor in `CLAUDE.md`, kostet nichts, hätte beide 25.08.-Kandidaten gespart.**
Die Bestätigungs-MDE steht **vor** dem Bestätigungslauf fest, sie hängt nur an Signaltagen
und Streuung. Also: *Entdeckungsüberschuss ≥ 4 × Bestätigungs-MDE, sonst wird die
Bestätigungshälfte gar nicht erst angefasst.* Probe: monatswende 0,695 gegen 4 × 0,363 =
1,45 → abgelehnt. quartalsschub 1,289 gegen 4 × 0,398 = 1,59 → abgelehnt. Beide Fälle vom
25.08. wären ohne eine einzige Messung gefallen.

**S5 — zweites Vorab-Tor: Mindestzahl an Bestätigungs-Signaltagen.** Aus Abschnitt 0: ein
Kandidat, dessen `delta80` über der Produkthürde seiner Handelsklasse liegt, wird nicht
vorregistriert. Bei 2,8 Pp Tagesstreuung heißt das faktisch: **Kalendersignale mit unter
1.000 Bestätigungs-Signaltagen sind strukturell nicht bestätigbar** und gehören nicht in
die Mühle. Das schließt die gesamte Monatswende-/Quartals-Familie aus.

**S6 — die Abnutzungsfrage gratis abhaken.** Die 38 vorhandenen Halbierungspaare in
`studien/messmaschine/protokolle/` nach „auf der Entdeckungshälfte ausgesucht: ja/nein"
auszählen. Ausgewertet liegt das schon vor: ausgesuchte Strategien (monatswende,
quartalsschub, momentum) fallen in 8 von 8 Läufen, Mittel(E−B) = +0,97 Pp; nicht
ausgesuchte (kapitulation, monatsende-kauf, rsi2seit, t1, t2, t3) fallen in 7 von 30,
Mittel = **−0,33 Pp** — die jüngere Hälfte ist dort im Schnitt *besser*. Eine
Kalenderabnutzung müsste auch in der zweiten Gruppe auftauchen. Sie zeigt das umgekehrte
Vorzeichen. Das ist die Signatur von Auswahl, und damit ist die Frage erledigt, ohne dass
ein Raster gelaufen wäre.

**S7 — `placeboLauf()` Zeile 444 (`if (hf !== 'bestaetigung') continue`).** Solange die
Zeile steht, gibt es für die Entdeckungshälfte **keinen Nullpunkt**. Entweder Placebo je
Hälfte, oder schriftlich festschreiben: auf Entdeckungshälften-Zahlen fällt kein förmliches
Urteil. Beides ist in Ordnung, der jetzige Zustand nicht.

**S8 — `MESSMASCHINE_PROTOKOLLE` für jeden Studienlauf setzen.** `messen.js` legt sonst
eine Kopie in `~/Downloads/Markt-Dashboard-Daten/protokolle/`, `depot.js:704-710` wählt
daraus die Variante mit dem größten Bestätigungs-t und zeigt sie als Kante,
`scoreboard.js:107/118` sortiert nach `bestesUrteil`. Ein Mehrvarianten-Lauf veröffentlicht
also von selbst das Maximum als gemessene Kante. Die Sperre gehört in die Umgebung, nicht
in einen Vorsatz.

**S9 — zwei Pflicht-Protokollzeilen.** Anteil der Signale je Sitzungsposition (steht als
`positionen` schon im Ergebnis) und das mittlere zentrierte L (Lücke Eröffnung[i+1] gegen
Schluss[i]). Damit ist die Einstiegslücke ab sofort bei jeder Messung eine gemessene Zahl
statt einer stillen Null — auch bei den Strategien, die Studie 3 nicht misst.

---

## 2. Rangfolge

Kriterium ist ausschließlich: **was ändert sich am Projekt, wenn die Antwort da ist —
und zwar bei BEIDEN möglichen Antworten?** Eine Studie, deren Ja und deren Nein beide
folgenlos sind, steht nicht im Plan.

### Rang 1 — Querschnitts-Kontrolle: kauft sie Auflösung?
*(gerettet aus `nachbar-kontrolle`, komplett umgebaut)*

Die einzige Studie im Stapel, die die Wand aus Abschnitt 0 verschieben kann. Der
Kontrolltopf der Maschine ist Symbol × Sitzungsposition × Hälfte (`messmaschine.js` Z. 205–286);
der gemeinsame Marktzug des Ereignistags bleibt vollständig drin. Er ist der Grund, warum
die Tagesstreuung bei 2,8 Pp liegt und warum mehr Signale je Tag nachweislich **nichts**
bringen (154 → 1.000 Signale/Tag ändert die MDE von 0,02475 auf 0,02453 Pp). Der Pilot des
Vorschlags misst se-Gewinne von 1,3× bis 21,6×.

- **JA (Faktor ≥ 1,5):** die Querschnitts-Kontrolle wird Pflichtangabe. Bei Faktor 3 fällt
  die effektive Tagesstreuung von 2,8 auf ~0,93 Pp, und `delta80` eines täglich feuernden
  1d-Signals über 5.038 Bestätigungstage sinkt von 0,132 auf **0,044 Pp — unter die
  Kostenhürde.** Zum ersten Mal in der Projektgeschichte wäre eine handelbare Kante
  überhaupt bestätigbar. Läufe, die als „nicht entscheidbar" abgelegt sind, werden
  wiederholbar.
- **NEIN (Faktor < 1,5):** die Wand ist hart. Dann ist bewiesen, dass Methode nichts mehr
  bringt und nur noch Daten (mehr unabhängige Tage) helfen — und das Projekt hört auf,
  Detektoren zu suchen, deren Größe es nie sehen könnte. Auch das ändert alles.

Die Verzerrungsfrage („misst A7 den Markt?") wird **mitgemessen, aber getrennt** und nur
auf der Teilmenge, auf der sie überhaupt Sinn ergibt — dazu unten.

### Rang 2 — Überlebensverzerrung beziffern
*(gerettet aus `ueberlebensverzerrung-messen`, Endpunkt und Hälftung geändert)*

`studien/kontrolle-2026-08/BEFUND.md` §7 sagt wörtlich, die Verzerrung lasse sich mit
diesen Daten nicht messen; die Notiz „Überlebensverzerrung ist der Killer" hängt seither an
jeder Zahl des Projekts. Seit dem 24.08. liegen 1.037 delistete Kursreihen (271.619 Kerzen,
500 gemeinsame Handelstage) auf der Platte, und **kein Messcode liest den Ordner.** Die
Vorprobe des Skeptikers findet je totem Wert im stärksten Fünftel **−0,81 Pp** — das
17-fache der größten je sauber gemessenen Nettokante.

- **JA:** keine Zahl aus dem Überlebenden-Archiv gilt mehr ohne Korrekturband; Momentum,
  200er-Gate und R-TREND bekommen den gemessenen Versatz als Vermerk; die Anschaffung einer
  höheren Datenstufe ist begründet statt vermutet.
- **NEIN:** der gepaarte A7-Überschuss ist nachweislich robust, der „Killer"-Zweifel ist
  beziffert weg, das 40-Jahre-Archiv ist freigegeben und niemand muss Daten kaufen.

Beide Antworten ändern etwas Großes. Dazu kommt: **das Zeitfenster ist endlich.** Von 6.921
delisteten CS/ADRC-Tickern haben nur diese 1.037 zu diesem Preis überhaupt Kurse.

Rang 2 und nicht Rang 1, weil die Studie eine harte Vorbedingung hat, die selbst schiefgehen
kann (siehe Gatter A7-Abbruch unten), und weil ihr Ergebnis die Auflösungswand nicht
verschiebt, sondern nur die Richtigkeit der Zahlen dahinter betrifft.

### Rang 3 — Einstiegskonvention: Vorgriff auf die eigene Auslösekerze
*(Verschmelzung von `eroeffnungsluecke` und `einstiegskurs-praemie`, radikal gekürzt)*

`messmaschine.js:630` steigt zum **Schluss derselben Kerze** ein, aus der das Signal
gebildet wird. Der Fehlerkatalog deckt den Ausstieg ab (C6, C7), den Einstieg keine Zeile.
Wie teuer diese Klasse ist, hat das Projekt einmal gemessen: bei C7 fiel dieselbe Strategie
von t 5,96 auf t −0,75, allein durch ehrliche Füllung.

Der Skeptiker hat die Frage bereits halb beantwortet, und das Ergebnis ist scharf: auf 60m
**innerhalb der Sitzung ist L exakt null** (−0,0011 Pp, t −0,93, 81.180 Fälle) — die
gesamte Lücke sitzt auf der letzten Kerze des Tages (+0,2034 Pp, 7.031 Fälle). Es ist kein
Einstiegsproblem, es ist ein **Sitzungsgrenzen-Problem**. Und genau dort sitzen die live
laufenden Regeln: `t1` zu 99,9 %, `rsi2seit` zu 36,4 %, `t3` zu 20,2 %.

- **JA (Position 6 trägt, Rest nicht):** `rsi2seit`, `t1` und `t3` dürfen auf der
  Schlusskerze nicht weiter zum Schluss gefüllt werden; die Maschine bekommt einen
  Einstiegs-Schalter mit Testfall, der Katalog einen C8-Eintrag, und der 67-%-Befund bei
  `schlussdruck-gegentag` ist als Sitzungsgrenzen-Effekt erklärt statt als Einzelfall.
- **NEIN:** die Schluss-Konvention ist für den Innertages-Teil freigesprochen, und die
  pauschale Ablehnungsbegründung „die Eröffnungsauktion zahlt den Schlussdruck zurück" darf
  nicht mehr ohne eigene Messung benutzt werden.

Rang 3, weil kein bestehendes Urteil kippt (die betroffenen Strategien stehen ohnehin auf
„nicht entscheidbar"), die Studie aber das **Lineal** repariert, an dem alles Künftige
gemessen wird — und weil sie mit Abstand die sicherste Auflösung hat (Faktor 8–10 über der
Nachweisgrenze).

### Rang 4 — Wiederfindung als Differenz-Design (Gatter, keine eigenständige Studie)
*(gerettet aus `kanten-wiederfindung`, Macht-Hälfte gestrichen)*

Der einzige Nachweis „eine echte Kante wird in der richtigen Größe erkannt" steht in
`test-messmaschine.js` Z. 189–215 auf einem Kunstarchiv aus 40 Werten. Auf `archiv1d` oder
`archiv60m` ist er nie gelaufen. Das Projekt hat zweimal daran gelitten, dass die Maschine
die Größe verfehlt hat (A9 kostete 44 %, B10 machte aus t 4,74 ein t 0,74) — beides gefunden
durch Nachdenken, nie durch eine Eichung.

Nicht als Niveau-Vergleich (74 % Fehlalarmquote bei einer völlig korrekten Maschine),
sondern als **Steigung**: zwei Spiegel mit δ₁ und δ₂, geschätzt wird
c = [Ü(δ₂) − Ü(δ₁)] / (δ₂ − δ₁). Weil beide Spiegel dasselbe Marktrauschen und denselben
Hash tragen, fällt Ü(0) **exakt** heraus; c ist rauschfrei messbar, Toleranz ±2 % statt
±25 %. Zwei Läufe, ein Test, keine Fehlalarmquote.

Das läuft **vor** Rang 1 und 2, weil beide auf einem Punktschätzer aufbauen, dessen Skala
nie geprüft wurde. Kosten: unter einer Stunde.

---

## 3. Vorregistrierungs-Skizzen (Top 3)

Alle drei enthalten dieselben Pflichtteile: MDE vor dem Urteil, Placebo, gezählte Tests,
kein nachträglicher Ausschluss.

### Studie 1 — Querschnitts-Kontrolle

**Frage.** Um welchen Faktor sinkt der Standardfehler des tagesgeclusterten Überschusses,
wenn die Erwartung nicht das Langfristmittel desselben Werts ist (A7), sondern das Mittel
aller anderen Werte zur selben Kerzenzeit — und verschiebt sich dabei der Punktschätzer auf
der Teilmenge der Querschnitts-Strategien?

**Datenbasis.** `E:/Markt-Dashboard-Archiv/archiv1d` (2.965 Reihen) und `archiv60m`
(2.885 Reihen). Bestehender Korpus: 38 Varianten aus 21 Protokollen, 10 Strategien, jede
einmal mit beiden Kontrollen. Die zweite Erwartung kommt **in** `messmaschine.js` neben
`baueKontrolle`, nicht als Nachbau (D1) — mit derselben Stutzung, derselben A5-Trennung je
Hälfte, demselben Ausstieg.

**Vorab-Einteilung, aus den Quelldateien, nicht aus den Ergebnissen.**
*TIMING* = Strategie liest zur Signalbildung keinen Kurs ODER kauft mehr als 20 % des
zulässigen Universums am Ereignistag. *AUSWAHL* = Querschnittsrang. `monatswende-breit`
kauft 1.653 von 2.213 Werten (75 %) und ist damit TIMING — bei ihm hat die
Querschnitts-Kontrolle per Konstruktion null Macht, das steht **vorher** fest und wird
nicht als Beleg gewertet. Die Verzerrungsaussage fällt ausschließlich auf der
AUSWAHL-Teilmenge.

**Endpunkte.**
- Primär (kein Nulltest): f = se(A7) / se(Querschnitt), Median über die 38 Varianten,
  Unsicherheit per Block-Bootstrap über Kalenderjahre. Ausgewiesen wird zusätzlich, wie
  viele Varianten dadurch ein `delta80` unter 0,10 Pp erreichen (heute: 4 von 38).
- Sekundär (ein gezählter Test): D = Überschuss(A7) − Überschuss(Querschnitt), **gepaart
  über dieselben Signale**, tagesgeclustert, nur auf der AUSWAHL-Teilmenge gepoolt.
  Nullwert exakt 0.

**Fallzahl und MDE.** Korpus-Median-se 0,148 Pp je Variante; weil D gepaart über dieselben
Signale gebildet wird, fällt die gemeinsame Marktvarianz heraus — se(D) ist damit eine
**gemessene**, nicht geschätzte Größe, erwartet 0,05–0,15 Pp, obere Schranke 2 × 0,148 =
0,296 Pp. Für f gibt es keine MDE; f ist ein Verhältnis zweier gemessener Standardfehler
und wird mit Bootstrap-KI berichtet.

**Entscheidungsregel, vorab.**
- **JA (Pflichtkontrolle):** Median f ≥ 1,5 **und** unteres Bootstrap-Ende von f > 1,2.
- **NEIN:** oberes Bootstrap-Ende von f < 1,3. Dann ist die Wand hart und wird als solche
  in `CLAUDE.md` eingetragen.
- Verzerrung: |D| über der eigenen MDE auf der AUSWAHL-Teilmenge → Katalogeintrag, aber
  **nicht** als „A7 ist falsch", sondern als: *wer einen großen Teil des Universums
  gleichzeitig kauft, misst Markt-Timing; beide Kontrollen ausweisen und benennen, welche
  Frage die Strategie stellt.*
- Ungültig, wenn der Placebo anschlägt. Der Placebo wird **auch in der Zeit gewürfelt**,
  nicht nur im Querschnitt — sonst erbt er den Monatswende-Effekt und seine wahre Antwort
  ist nicht null.

**Testzahl: 1.** Schwelle |t| ≥ 1,96. (f ist eine Kennzahl ohne Nullhypothese; die
38 Einzelwerte je Variante sind beschreibend und werden ausdrücklich nicht einzeln beurteilt.)

**Offenzulegen:** der Pilot ist bereits gelaufen, auf demselben Archiv. Die Schwellen 1,5 /
1,2 / 1,3 wurden nach diesem Blick gesetzt. Das steht in der Vorregistrierung, und die
Studie wird deshalb als **Eichung** geführt, nicht als Kandidatenprüfung.

---

### Studie 2 — Überlebensverzerrung

**Frage.** Verschiebt sich der A7-Überschuss messbar, wenn dem Messuniversum die Werte
hinzugefügt werden, die im Messfenster wirklich von der Börse verschwunden sind — und zwar
sowohl im Rohertrag als auch im Überschuss?

**Datenbasis.** Überlebende: `E:/Markt-Dashboard-Archiv/archiv1d`. Verschwundene:
`~/Downloads/Markt-Dashboard-Daten/massive/tagesdaten/*.json` — 1.037 Reihen, 271.619
Kerzen, 500 gemeinsame Handelstage (2024-08-23 bis 2026-08-21), 986 CS + 51 ADRC, 5-elementig
ohne Eröffnungskurs (deshalb `stopNiveau` aus). `reiheKaputt()` wirft 128 (12,3 %), es
bleiben 909, nach Vorlauf 60 rund 860. Zwei Sonden über `baueQuerschnitt`, beide feuern
täglich: **G** = stärkstes Fünftel nach 60-Tage-Ertrag, **V** = schwächstes Fünftel,
H = 5, Vorlauf 60 (identisch für beide Universen, vorregistriert).

**Endpunkt geändert gegenüber dem Vorschlag.** Nicht das verdünnte Δ, sondern
d = Überschuss(tote Werte im Fünftel) − Überschuss(lebende Werte im selben Fünftel),
tagesgeclustert, Newey-West mit H−1 = 4 Lags. Das Gewicht w ist exakt bekannt (14,8 % über
alle Tage, 8,5 % auf der Bestätigungshälfte) und wird hinterher multipliziert.

> **Ehrliche Einschränkung, die in die Vorregistrierung gehört:** d statt Δ zu berichten
> kauft **keine** t-Macht — t ist invariant gegen Multiplikation mit einem bekannten
> Faktor. Es kauft eine stabile, deutbare Größe und eine Schwelle, die nicht mit der
> schrumpfenden Totenpopulation wandert. Die echte Machtsteigerung kommt aus dem Verzicht
> auf die B5-Hälftung (unten) und aus dem Roh-Endpunkt.

**Fallzahl und MDE.** Vorprobe des Skeptikers (585 lebende Reihen hochgerechnet, 909 saubere
Tote): Sonde G Δ = −0,072 Pp, se 0,033, t −2,18 auf 217 Bestätigungstagen; d ≈ −0,81 Pp.
Ohne Hälftung, über alle 434 Tage: se(Δ) = 0,023 Pp → **MDE(Δ) = 0,047 Pp**, entsprechend
**MDE(d) = 0,32 Pp** bei w = 0,148. Erwarteter Punktwert 0,8 Pp → t ≈ 5. Entscheidbar.
Mit Hälftung wäre MDE(Δ) = 0,066 Pp und der NEIN-Zweig („|Δ| < 0,05 **und** MDE ≤ 0,05")
**strukturell unerreichbar** — der Grund für den Verzicht.

**Verzicht auf die B5-Hälftung, vorregistriert und begründet.** Sonde, Merkmal, Haltedauer
und Schwelle stehen vorher fest; es gibt nichts zu überanpassen. Eichungsendpunkte
verbrauchen keine Bestätigungshälfte. Wer die Hälftung behalten will, muss die Schwelle
vorab auf 0,10 Pp setzen statt auf 0,05.

**Vier Gatter, jedes einzeln bindend, alle vorab:**
1. **A7-Abbruch-Vorlauf (neu, härtestes Gatter).** Dieselbe Sonde auf **lebende** Reihen
   fahren, die künstlich am selben Datumsmuster abgeschnitten werden wie die Toten. Kommt
   dort ebenfalls ein Minus, misst die Kontrolle den Abbruch und nicht den Tod, und das
   Urteil entfällt. Das gehört als neuer Fehlertyp in `FEHLERTYPEN.md`, egal wie es ausgeht.
2. **Liquidität symmetrisch.** Zwei Läufe: alle Toten (beschreibend) und nur die 231 mit
   Median-Tagesumsatz über 5 Mio $ (primär) — derselbe Schnitt auf beiden Universen. Nur
   der geschnittene Lauf darf etwas über die App aussagen. Median-Tagesumsatz der Toten
   liegt bei 235.919 $, p10 bei 10.005 $; ohne diesen Schnitt misst man einen
   Größeneffekt und nennt ihn Tod.
3. **Quelle.** Yahoo gegen Massive, aber als **Schwanzmaß**: Anteil Tage mit
   |Diff| > 50 Bp, nicht Median unter 5 Bp (ein Median, der strukturell 0 ist, kann nicht
   reißen).
4. **Restverzerrung ausweisen.** Im Fenster starben 1.221 CS/ADRC, Kurse gibt es für 988
   (81 %), nach Filter und Vorlauf bleiben ~860 (70 %). Die fehlenden 30 % sind
   systematisch die härtesten Fälle; jede Lücke drückt |d| gegen null. Das steht im
   Bericht, sonst wird ein Nullbefund als „robust" fehlgelesen.

**Entscheidungsregel.** Je Endpunkt: |d| ≥ 0,40 Pp **und** |t| ≥ 2,50 → JA.
|d| < 0,40 Pp **und** MDE(d) ≤ 0,40 Pp → NEIN. Sonst nicht entscheidbar, mit Angabe, wie
viele Tage für 0,40 Pp nötig wären.

**Testzahl: 4** (Sonde G × {roh, Überschuss}, Sonde V × {roh, Überschuss}).
Schwelle |t| ≥ **2,50**. Die Richtungsdeutung („G betroffen → Momentum betroffen") ist
**keine** eigene Aussage, sondern nur Kommentar; das steht ausdrücklich in der
Vorregistrierung, damit sie nicht als fünfter Test nachwächst.

**Δ wird nicht von Hand nebenher gerechnet.** `block()` gibt nur Aggregate zurück; ein
gepaarter Newey-West-t über Tagesdifferenzen braucht die Tagesreihe. Die Maschine wird
darum erweitert, mit Testfall in `test-messmaschine.js`. An handgebauten Nebenrechnungen
hat dieses Projekt schon dreimal geblutet (A6, Gruppe F, die vier Werkzeugfehler der
Gegenprüfung).

---

### Studie 3 — Einstiegskonvention

**Frage.** Wie groß ist L = Überschuss(Einstieg Schluss[i]) − Überschuss(Einstieg
Eröffnung[i+1]) für die sechs 60m-Strategien, **getrennt nach Sitzungsposition 6 und
Rest** — und liegt der Rest-Wert unter der halben Kostenhürde?

**Vorbedingung, die keine Messung ist (folgt aus der Logik des Vorgriffs, nicht aus einer
Zahl):** Jede Strategiedatei erklärt künftig `signalNutztSchlussKerzeI: true|false`. Bei
`false` ist der Schluss-Fill zulässig (MOC/LOC ist real und hochliquide), bei `true` darf
die Maschine nicht zum Schluss von i füllen. Betroffen sind sechs der neun Dateien (alle
60m), null von drei 1d. Neuer C-Eintrag in `FEHLERTYPEN.md`: *Vorgriff auf die eigene
Auslösekerze.*

**Werkzeug.** Ein Schalter `einstieg: 'schluss' | 'eroeffnungFolgekerze'` in
`messmaschine.js`, der s0 an **allen drei Stellen zugleich** setzt (Z. 215 Kontrolltopf,
Z. 440 Placebo, Z. 630 Signal), plus Testfall nach dem Muster von C6/C7. Kein separater
Prüfstand, keine zweite Fassung der Kontrolle (D1). `eroeffnungKurs()` muss beim Fehlen der
Eröffnung das Signal **auswerfen** statt still auf `bars[k−1][1]` zurückzufallen — sonst
wird L mechanisch null gesetzt.

**Datenbasis.** `E:/Markt-Dashboard-Archiv/archiv60m`, 2.885 Reihen, 730 Kalendertage,
rund 500 Handelstage. Eröffnungskurs-Abdeckung nachgemessen **100,00 %** in beiden Archiven
(60 Dateien je Archiv, 609.000 Kerzen) — das C7-Gatter greift nicht.

**Fallzahl und MDE.** Vorgemessen auf 300 Symbolen: innerhalb der Sitzung 81.180 Fälle,
L = −0,0011 Pp (t −0,93); Position 6: 7.031 Fälle, L = +0,2034 Pp. se für ein breites
Signal 0,0060 Pp über 730 Tage. Nachweisgrenze bei Schwelle 2,24 und 80 % Macht:
delta80 = 3,08 × se = **0,019 Pp**. Gesucht wird die halbe Kostenhürde (0,05 Pp) — Faktor
2,6 Luft; der Positions-6-Wert liegt Faktor 10 darüber. **Beide Zweige sind entscheidbar**,
das ist bei keiner anderen Studie im Stapel der Fall.

**Kein Halbierungsschnitt**, vorregistriert und begründet: L ist eine mechanische
Eigenschaft des Archivs, keine durchsuchte Hypothese; es gibt nichts, wogegen die
Bestätigungshälfte schützen würde. (Nebenbei ist die Bestätigungshälfte von `rsi2seit` am
23., 24. und 25.08. ohnehin verbraucht.)

**Placebo.** Nicht „kursfreies Signal derselben Feuerdichte" — das hat per Konstruktion eine
gleichverteilte Sitzungsposition und besteht immer. Der Placebo muss die
**Sitzungspositions-Verteilung der geprüften Strategie nachbilden**; nur dann prüft er
etwas.

**Pflichtfelder im Protokoll.** Anteil „Eröffnung[i+1] == Schluss[i] bitgenau" (gemessen
17,03 % auf 60m, 11,09 % auf 1d — in jedem sechsten Fall ist L mechanisch null und verdünnt
den Schätzer gegen null) und Anteil Signale ohne echten Eröffnungskurs.

**Entscheidungsregel.** JA: L(Position 6) ≥ 0,05 Pp bei |t| ≥ 2,24 **und** |L(Rest)| unter
seiner eigenen MDE. NEIN: beide Werte unter 0,05 Pp bei MDE ≤ 0,05 Pp. Sonst nicht
entscheidbar.

**Testzahl: 2.** Schwelle |t| ≥ **2,24**.

**Was die Daten nicht hergeben, und was deshalb so berichtet wird:** der wirklich relevante
Füllkurs eines schlussgebildeten Signals ist nicht die Folge-Eröffnung, sondern der
Schlussauktionsdruck der letzten Minuten. Weder das 1d- noch das 60m-Archiv enthält ihn.
Die Folge-Eröffnung ist eine **obere Schranke** der Füllkosten, keine Messung davon.

---

## 4. Testzahl-Konsequenz — explizit

Die acht eingereichten Vorschläge deklarieren zusammen **78 Tests**; die Skeptiker haben
gezeigt, dass die ehrlichen Zahlen höher liegen (z. B. 15 statt 2 bei
`einstiegskurs-praemie`, 25 statt 9 bei `eroeffnungsluecke`, 204 statt 99 Rastervarianten
bei `muehle-symmetrieprobe`). Würde man den Stapel als eine Familie fahren:

| Familie | Tests | Bonferroni-Schwelle |z| | MDE bei Median-se 0,148 Pp |
|---|---|---|---|
| alle acht Vorschläge, wie deklariert | 78 | **3,41** | 0,505 Pp |
| dieser Plan, als eine Familie | 8 | 2,73 | 0,404 Pp |
| Studie 2 allein | 4 | 2,50 | 0,370 Pp |
| Studie 3 allein | 2 | 2,24 | 0,332 Pp |
| Studie 1 allein | 1 | 1,96 | 0,290 Pp |

**Der ganze Stapel wäre selbstzerstörerisch:** bei 78 Tests liegt die Nachweisgrenze bei
0,5 Pp — dem Fünffachen der Kostenhürde. Man hätte acht Studien gefahren und keine einzige
davon hätte eine handelbare Kante sehen können.

**Festlegung für diesen Plan:** Jede der drei Studien ist eine **eigene Vorregistrierung
und damit eine eigene Familie** — so hat das Projekt es immer gehalten, und die drei Fragen
teilen weder Daten noch Hypothese. Aber:

- In jedes Protokoll kommt **zusätzlich** die kampagnenweite Schwelle (8 Tests, |z| ≥ 2,73)
  und das Urteil bei dieser Schwelle. Niemand soll später sagen können, es sei nicht
  gezählt worden.
- Der Preis wird benannt: bei vier getrennten Familien à α = 0,05 liegt die Wahrscheinlichkeit
  mindestens eines falschen JA über die Kampagne bei **1 − 0,95⁴ = 18,5 %.**
- Nachrechnung bei kampagnenweiter Schwelle: Studie 2 überlebt (erwartetes t ≈ 5),
  Studie 3 überlebt (Faktor 10 über der Grenze), Studie 1 ist davon kaum betroffen, weil
  ihre Primärgröße f keine Nullhypothese hat. **Der Plan hält also auch in der strengsten
  Zählung.** Genau deshalb sind es drei Studien und nicht acht.
- Das Gatter (Rang 4, Wiederfindung) zählt als 1 Test und ist in den 8 enthalten.

Was **nicht** in die Testzahl fällt: alle neun Punkte aus Stufe 0. Dort wird kein Urteil
über die Welt gefällt, sondern eine Rechenzeile berichtigt.

---

## 5. Was wir nicht messen sollten

Fünf Vorschläge werden nicht gemessen. Je ein Satz, warum — und wo der brauchbare Rest
hingeht.

**`suchhaelfte-eichung` (77 Kalenderregeln, Abnutzung gegen Auswahlverzerrung).**
Nicht identifiziert (die Entdeckungshälfte ist *immer* die ältere, und der Vorschlag
schließt die einzige Auflösung — Schnitt umkehren — ausdrücklich aus), zwei der 77 Regeln
*sind* buchstäblich `monatswende-breit` V0/V1 mit bekannten t-Werten, und die Frage ist
über die 38 vorhandenen Protokollpaare gratis beantwortet → **S6**.

**`muehle-symmetrieprobe` (Δ_A − Δ_B über drei Raster).**
Dieselbe Frage, teurer: die Symmetriekonstruktion kostet Auflösung, um eine Größe zu
neutralisieren, die man gar nicht braucht, kann nur „alles" von „nichts" trennen und
erzeugt mit ihrer eigenen Angleichungsmaßnahme (nur Symbole mit Kerzen vor 2006) exakt die
Überlebensverzerrung, die das Projekt als seinen Killer führt.

**`umlaufkosten-faktor` (Faktor 1 oder 2 am Demo-Konto).**
Die Kennzahl Q ist eine algebraische Identität — landen die Fills auf Brief und Geld, ist
Q exakt 1, ohne dass irgendetwas gemessen wurde; der wertvolle Teil ist ein **Fehlerbericht,
kein Studienvorschlag** → **S3**.

**`kostenhuerde-je-aera` (Spanne 1986–2001 gegen heute).**
Der Skeptiker hat sie bereits gefahren: Corwin-Schultz V = 1,48, Roll V = 1,56 — beide unter
der eigenen 2,0-Schwelle, und beide reißen das vorab gesetzte Eichungsgatter bei **15 von 15**
Symbolen; außerdem liegt die Bestätigungshälfte vollständig nach der Dezimalisierung 2001,
also würde selbst V = 5 kein einziges Urteil ändern.

**`drift-durch-die-muehle` (Ergebnis-Drift durch die Mühle).**
Die Entscheidbarkeitsrechnung steht auf +10,44 % p. a., einer Zahl, die das eigene Repo
zwei Tage vorher kassiert hat (Commit 259d723, Rohlauf 14,07 → 8,44 % p. a.); post-fix
erwartet sind 4,5–6,7 % gegen eine MDE von 6,86 % — das Urteil „nicht entscheidbar" steht
vor dem ersten Lauf fest und wurde am 23.08. schon einmal gemessen. **Der Buchführungsteil
ist trotzdem der wichtigste Punkt des ganzen Stapels** → **S1**. Der echte Engpass ist
`drift_termine.json` mit 189 von 2.965 Symbolen und **null** delisteten Reihen: das ist eine
Datenbeschaffung, keine Messung.

**Und aus den drei aufgenommenen Studien gestrichen:**
- Aus `einstiegskurs-praemie`: die Klasse K (1d-Strategien ab 2006 können 60m-Strategien ab
  2024 nicht kontrollieren), der ARTEFAKT-Zweig (durch die Konstruktion unerreichbar) und
  die Behauptung, jede bisherige Zahl ließe sich pauschal um P vermindern (P ist je
  Strategie verschieden). Die Rauchprobe des Vorschlags wäre vor dem Start durchgefallen:
  drei von vier Schnitten reißen die selbst gesetzte 0,005-Pp-Schwelle, der 1d-Wert um
  Faktor 7,6 — weil die unbedingte Übernachtdrift von +0,038 Pp/Tag ein realer Effekt ist
  und kein Werkzeugfehler.
- Aus `nachbar-kontrolle`: die Kennzahl q (bei perfekt unverzerrtem A7 fällt das JA-Urteil
  in 18,8 % der Läufe — die Studie kann „verzerrt" nicht von „verrauschter" trennen), die
  leere UND-Bedingung (aus Median < 1/3 folgt bei 38 Werten zwingend, dass ≥ 19 darunter
  liegen), das Leitbeispiel `monatswende-breit` (Tautologie: es kauft 75 % des Marktes) und
  der Fehlertyp A10 „die Kontrolle ist der Fehler".
- Aus `ueberlebensverzerrung-messen`: der verdünnte Δ-Endpunkt, die B5-Hälftung, das
  Quellen-Gatter als Median (kann strukturell nicht reißen) und die Folgerung, ein
  2-Jahres-Fenster mit 9 % Sterblichen gebe das 40-Jahre-Archiv frei.
- Aus `eroeffnungsluecke`: die 1d-Strategien (`monatswende-breit`, `quartalsschub-betrag`,
  `momentum` stehen alle **vor** Sitzungsbeginn fest und haben keinen Vorgriff — bei ihnen
  misst L eine andere Strategie, nicht Füllkosten), die 25 verdeckten Varianten, der
  NEIN-Zweig in der alten Form (durch `t1` a priori unerreichbar) und die Vorgabe
  `einstieg: 'folgeEroeffnung'` für die ganze Maschine (ob ein Schluss-Fill zulässig ist,
  ist eine Eigenschaft der **Strategie**, nicht der Maschine).
- Aus `kanten-wiederfindung`: die komplette Macht-Hälfte (eine Zeile Arithmetik → **S2**),
  der δ = 0-Placebo (Multiplikation mit 1 lässt den Spiegel bitgleich, prüft also nichts)
  und die Ankündigung, alle Nein-Befunde umzuschreiben (35 von 38 Varianten stehen bereits
  auf „nicht entscheidbar").

---

## 6. Die unbequeme Möglichkeit

Nimm an, es stimmt: **in diesen Daten gibt es für diesen Handelsstil keine handelbare Kante
mehr zu finden.** 3.372 Tests mit 0 von 51 Bestätigungen, zwei sauber reproduzierte und
dann verpuffende Kandidaten (79 % und 86 % Verlust), null belegte Kanten nach S1. Das ist
nicht die pessimistische Lesart — das ist die **einfachste** Erklärung aller vorliegenden
Zahlen.

Drei Dinge sprechen dafür, und alle drei sind schon gemessen:

1. **Der Bestätigungskorpus ist von Rauschen nicht unterscheidbar.** 38 Varianten, Median
   |t| 0,69 (Rauscherwartung 0,674), 2 über |t| = 2 (Erwartung 1,73), Maximum 2,14. Das ist
   nicht „knapp verfehlt", das ist eine N(0,1)-Verteilung.
2. **Der Schwund ist Auswahl, nicht Abnutzung.** Ausgesuchte Kandidaten fallen 8 von 8
   (+0,97 Pp), nicht ausgesuchte 7 von 30 (−0,33 Pp). Die Kandidaten waren nie da.
3. **Die Auflösungswand macht das Übrigbleibende unerreichbar.** Selbst *wenn* eine Kante
   von 0,10 Pp existierte, bräuchte man 35 Jahre Bestätigungs-Signaltage, um sie zu
   bestätigen. Das Archiv hat 20.

### Was dann die richtige nächste Messung ist

Unter der Nullhypothese ist jede weitere Detektorsuche wertlos. Aber es gibt **vier
Messungen, die genau dann informativ sind**, und drei davon sind billig.

**M1 — Die Obergrenzen-Meldung. (Das Wichtigste, kostet nichts.)**
Statt „nicht bestätigt" für jede durchsuchte Familie die **obere Grenze des 95-%-Intervalls
des Überschusses** ausweisen. Liegt sie unter der Produkthürde der Klasse, ist die Familie
**geschlossen**, nicht „nicht entscheidbar". Das verwandelt 3.372 Nullergebnisse aus
Schweigen in eine Aussage: *„Wir haben die Familien X, Y, Z durchsucht und können
ausschließen, dass dort eine Kante größer als 0,3 Pp liegt."* Das ist echtes Wissen, es ist
publikationsreif, und es existiert heute schon in den Protokollen — es wird nur nicht
ausgeschrieben. Kombiniert mit S2 (`delta80`) ist das eine Nachmittagsarbeit.

**M2 — Die t-Verteilung gegen eine empirische Null eichen. (1 Test.)**
Der Satz „der Korpus sieht aus wie Rauschen" gilt nur, wenn die tagesgeclusterte
Newey-West-t wirklich N(0,1) ist. Das ist in diesem Projekt nie geprüft worden, und A8 sagt
ausdrücklich, dass Nullarchive dafür nicht taugen. Die richtige Eichung: **dieselben
Strategien gegen gedrehte Kalender** — alle Datumsetiketten um k Handelstage verschieben
(k = 60 Werte), Renditereihe unangetastet. Das liefert die wahre Verteilung der t auf
*diesen* Daten, mit den echten Fettschwänzen und der Querschnittsabhängigkeit, für **beide**
Hälften (was `placeboLauf()` mit Zeile 444 prinzipiell nicht kann). Dann ein KS-Test der 38
Bestätigungs-t gegen diese empirische Null. Passt es: **das Projekt hat einen positiven
Befund** — „wir haben nichts gefunden, und unser Messgerät sagt, dass genau das zu erwarten
war, wenn nichts da ist." Passt es nicht, ist der Nullpunkt kaputt und alles davor ist
neu zu bewerten. Das ist die einzige Messung, die den Null-Zustand von einem Werkzeugfehler
unterscheiden kann.

**M3 — Den Gegenstand wechseln: von Kante auf Kosten und Ausführung.**
Wenn es kein Alpha gibt, ist der erwartete Ertrag des ganzen Unternehmens **minus Kosten**.
Dann ist jede Pp Kostenersparnis genau so viel wert wie eine Pp Alpha und **um Größenordnungen
leichter zu messen**, weil die Effekte groß sind: die Spanne schwankt über das Universum um
Faktor 3,8 (MU 0,0335 % bis ARM 0,1263 %), der Standard-Schein kostet 0,23 Pp je 3 Stunden
gegen 0,04 Pp für die Aktie, die Sitzungsgrenzen-Lücke misst 0,20 Pp. Das sind Zahlen, die
in Tagen entscheidbar sind statt in Jahrzehnten. Konkret: die laufende Demo-Kostenmessung
zur Hauptlinie machen, die Produkt-Kostentabelle je Klasse fertig messen, und den
Live-gegen-Messung-Abgleich als Test-Invariante festziehen (das ist bereits viermal
schiefgegangen). **Studie 3 dieses Plans ist genau so eine Messung** — sie misst keine
Kante, sie misst das Lineal und einen Kostenposten. Sie bleibt auch unter der Null wertvoll.

**M4 — Die einzige wirklich zurückgehaltene Hälfte ist die Zukunft.**
Jeder Zeitschnitt im Archiv ist informationell verbraucht: „seit 2015" und „60 statt 20
Tage" wurden *innerhalb* der angeblichen Bestätigungshälfte gewählt, `rsi2seit` hat ihre
am 23., 24. und 25.08. verbraucht. Wenn du nach all dem noch einen Beleg willst, dann als
**vorwärts laufende Probe mit vorab genanntem Enddatum**: Regel eingefroren, Kosten
eingefroren, Enddatum eingefroren, MDE vorab ausgerechnet. Die ehrliche Zahl dazu: bei 250
Handelstagen im Jahr und heutiger Streuung sieht eine solche Probe nach einem Jahr eine
Kante von 0,19 Pp, nach drei Jahren von 0,11 Pp. **Mit** der Querschnitts-Kontrolle aus
Studie 1 (falls sie Faktor 3 liefert) nach einem Jahr 0,06 Pp. Das ist die einzige Zahl,
die entscheidet, ob eine Vorwärtsprobe überhaupt lohnt — und sie hängt an Studie 1. Noch
ein Grund für Rang 1.

### Was unter der Null NICHT die Antwort ist

- **Nicht:** die Entdeckungsschwelle senken oder die Bonferroni-Zählung „realistischer"
  machen. Das repariert das Werkzeug, indem man die Latte unerreichbar niedrig legt.
- **Nicht:** noch ein Detektor. 15 × 4 hat null geliefert; der 16. liefert null.
- **Nicht:** den Zeitschnitt durch einen Symbolschnitt ersetzen. Beide Symbolhälften sehen
  dieselben Tage, also dieselben Schocks; eine periodenangepasste Regel trägt problemlos
  hinüber. Das entschärft die stärkste Schutzvorrichtung des Projekts.
- **Nicht:** Kapital auf unbelegte Regeln verteilen, weil „irgendwas muss ja laufen".
  Nach S1 steht das Projekt bei null belegten Kanten; das gehört in `mfdepot.js`, in
  `driftui.js` und in die Oberfläche, bevor die nächste Messung startet.

### Die ehrliche Bilanz

Der wahrscheinlichste Ausgang dieses Plans ist: Studie 3 sagt „Sitzungsgrenze ja, Rest
nein" (sicher entscheidbar), Studie 2 sagt „Überlebensverzerrung ist real und groß"
(t ≈ 5 in der Vorprobe), Studie 1 sagt „Faktor 2–4 auf die Auflösung" — und **danach hat
das Projekt immer noch null Kanten, aber zum ersten Mal ein Messgerät, das eine Kante in
der Größe seiner eigenen Kostenhürde überhaupt sehen könnte.** Das ist kein glanzvoller,
aber ein ehrlicher Fortschritt. Ohne Studie 1 ist jede weitere Suche eine Suche mit einem
Lineal, dessen kleinster Strich sechsmal größer ist als das gesuchte Objekt.

---

## 7. Ablauf

| # | Was | Aufwand | Tests |
|---|---|---|---|
| 0 | Stufe 0, Punkte S1–S9 (Schreibtisch) | 1 Tag | 0 |
| 1 | Gatter: Wiederfindung als Differenz-Design, 1d **und** 60m | < 1 h | 1 |
| 2 | Studie 1 — Querschnitts-Kontrolle | mittel | 1 |
| 3 | Studie 2 — Überlebensverzerrung (mit A7-Abbruch-Vorlauf als Gatter) | mittel | 4 |
| 4 | Studie 3 — Einstiegskonvention (mit Schalter + Testfall) | mittel | 2 |
| | **Summe** | | **8** |

Reihenfolge ist bindend: **S1 vor allem anderen** (das Hauptbuch darf sich keinen weiteren
Tag widersprechen), **Gatter vor Studie 1 und 2** (beide bauen auf einem Punktschätzer auf,
dessen Skala nie geprüft wurde), **Studie 1 vor Studie 2** (falls die Querschnitts-Kontrolle
Auflösung kauft, wird Studie 2 damit gefahren und ihre MDE fällt). Studie 3 ist von den
anderen unabhängig und kann parallel laufen.

Jede der drei Studien bekommt vor dem Lauf ihre eigene Datei unter
`studien/vorregistrierung-<datum>/`, auf die Platte geschrieben, **bevor** die erste Zahl
fällt.
