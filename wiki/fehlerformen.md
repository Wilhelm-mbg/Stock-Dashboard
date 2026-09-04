---
tags: [lehre]
---
# Bekannte Fehlerformen

> ## **Die Krankheit des Tages: eine Prüfung, die grün wird, weil sie etwas anderes prüft,
> als man glaubt.**
> An einem einzigen Tag (27.08.2026) trat sie in **neun** Erscheinungsformen auf. **Jede wurde
> von einer Gegenprobe gefunden, keine von Verdacht.**

## Die Formen

| Form | Beispiel |
|---|---|
| **Prüfung prüft etwas anderes** | Ein Test war rot, weil die Maschine schon früher verweigerte — die geprüfte Schranke wurde nie erreicht. Nur `verweigert === true` zu prüfen hätte GRÜN ergeben. **Immer auf den GRUND prüfen.** |
| **Test mit Verfallsdatum** | Wachhund-Tests bauten Kunstkerzen mit festem Datum, fragten aber mit der echten Uhr → ab ~28.08. rot aus dem falschen Grund. Blockierte ein Release. |
| **Tautologische Prüfung** | `git merge-base --is-ancestor <Prüfstand> <Tag>` — ein Prüfstand ist IMMER Vorfahr. Prüfte nichts. |
| **Nullbefund vom toten Werkzeug** | Ein Prüfling, der nie feuert, besteht jeden Leertest. **Deshalb Positivkontrolle.** |
| **„0 gefunden" vs. „nichts zu durchsuchen"** | Von außen ununterscheidbar. Ein leeres Archiv meldet „0 Abmeldungen" statt „kein Archiv". |
| **Behauptung statt Bestätigung** | `kanalUeber` verwarf nie — die „Bestätigung" konnte nicht ablehnen. **Bestätigung gehört außerhalb des Rechenfensters.** |
| **Geteilter Kurs** | Teilt das Signal einen Kurs mit der Zielgröße, entsteht ein Scheineffekt in behaupteter Richtung. |
| **Sperrklinke frisst ihren Kommentar** | Der erklärende Kommentar nennt den verbotenen Bezeichner → grün im Bauplan, rot im Repo. |
| **Die Wand ist nicht das Fenster** | Der Nachrichten-Index reicht bis 2017 zurück — aber das sagt nur, wo die **älteste** Meldung liegt, nicht ab wann die Abdeckung trägt. Sie ist eine Stufe: 2021-03 **9,6 %** → 2021-05 **94,0 %**. *AAPL hatte 2017 **eine** Meldung und 2021 dann 4.296.* Nutzbar waren **1.338** statt 2.367 Tage. **Verallgemeinerung: Der Anfang eines Bestandes und der Anfang seiner Brauchbarkeit sind zwei verschiedene Daten — immer beide prüfen.** *Fundstelle: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`, Commit `d803a14`* |
| **Planformel zu konservativ** | Die Vorab-Formel für geclusterte Standardfehler war um **Faktor 4,2** zu pessimistisch (geclusterter se nur 18 % über dem ungeclusterten). **Eine zu vorsichtige Machbarkeitsrechnung erklärt Fragen für unbeantwortbar, die es nicht sind** — dieselbe Gefahr wie zu optimistisch, nur andersherum. *Fundstelle: ebenda* |
| **Kontrollkriterium falsch gebaut** | Ein *registriertes* Placebo-Kriterium maß Faktorstreuung statt Rauschboden und fiel durch (Verhältnis 0,25), obwohl der Placebo sauber war. Korrektur als **Nachtrag VOR dem Urteilslauf**, gefallenes Kriterium bleibt ausgewiesen. **Regel: auch die Kontrollen brauchen eine Positivkontrolle — ein Kriterium, das einen sauberen Placebo durchfallen lässt, ist selbst der Fehler.** *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/`, Commit `3e7d17c`* |
| **Zu konservative Formel — Gegenprobe gelungen** | Die Newey-West-Planformel hätte die Momentum-Frage für blind erklärt (142 Perioden nötig, 79 da). Die **geeichte** Formel sagte delta80 2,05 voraus, gemessen 2,051. *Beleg, dass die Form „zu vorsichtig gerechnet" nicht nur Kandidaten begräbt, sondern dass die Eichung sie zuverlässig behebt.* *Fundstelle: ebenda* |
| **Nominale Schwelle über 20 Jahre** | Ein Liquiditätsfilter „≥ 100 Mio $ Tagesumsatz" ist 2006 ein anderer Filter als 2026: er ließ damals 16 von 155 Werten durch, heute 95 von 950 — **die Definition von „liquide" wandert mit dem Marktvolumen**, und die Entdeckungshälfte der Vorregistrierung war deshalb fast leer (65 Perioden < 100 Werte). *Regel: Schwellen über lange Historien relativ setzen (Quantil je Zeitpunkt) oder die Drift ausweisen.* *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md`* |
| **Zähler mit Schwelle** | `FAKTOR_MIN = 2` schnitt **53 %** der bekannten Skalenfälle weg, bevor die Logik anlief. Er meldete keine Null, sondern eine kleinere Zahl — **die aussah wie ein Ergebnis.** |

- **Skalenfehler zeigen Sprungpaare.** Zwei sich aufhebende Sprünge in einer Reihe sind kein Markt,
  sondern eine falsche Anpassung an einer Quellengrenze (MNST/SPGI, 03.09.2026: Yahoo bereinigt, Alpaca roh).
  Die Störung hat einen Ort; Schneiden ist falsch, der Ort wird repariert. *Fundstelle:
  `uebergabe/skalenreparatur-2026-09-03.md`.*

## Formen bei der Deutung

- **Regel überlebt ihre Grundlage.** Ein Entscheid war richtig, als er fiel; die Voraussetzung
  entfiel, der Entscheid galt weiter. *Fünf Fälle an einem Tag.*
- **Formel trägt sich selbst weiter.** *„Zwei validierte Kanten"* lief wochenlang durch Code,
  Befunde und Gedächtnis, nachdem die Grundlage weg war. **Deshalb Zitierpflicht im Wiki.**
- **Reichweite geht verloren.** *„Die Rückanpassung funktioniert fast immer"* — gemessen war
  nur der Bereich ab Faktor 2, und genau dort liegen Kapitalmaßnahmen NICHT.
- **Regel breiter angewandt als ihre Voraussetzung reicht — und sie LÖSCHT.** `rasterFilter()`
  ließ Minute 0 nur als späteste Kerze des Tages zu. Das trägt genau eine Voraussetzung: das
  60m-Börsengitter liegt auf `:30`, dort ist Minute 0 entweder Schluss oder Abrufstempel.
  Angewandt wurde sie auf **jedes** Intervall. Auf 1m/5m/15m liegt die volle Stunde AUF dem
  Gitter, bei Krypto-60m liegt **alles** auf `:00` — die Regel löschte 6 echte Stunden je
  5m-Tag und 95,8 % der Krypto-Kerzen. Zehn Tage lang, bei jedem Sammellauf, ohne eine Meldung.
  *Der Unterschied zu „Reichweite geht verloren": dort wird eine Aussage überdehnt, hier eine
  **löschende** Regel — der Schaden ist nicht ein falscher Satz, sondern fehlende Daten.*
  **Regel: eine Regel, die Daten wegwirft, muss ihren Geltungsbereich im Code nennen (Intervall,
  Wertpapierart), und die Klinke muss beide Seiten prüfen — dass sie greift, wo sie soll, UND
  dass sie nicht greift, wo sie nicht soll.** *Fundstelle: R5,
  [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §7/§8a, `f9462e4` → 03.09.2026*
- **Auswahl statt Zufall.** Die 16 Kostenrunden aus einer Minute waren **eine Klickfolge**, kein
  Pech der Marktlage. *Pech wiederholt sich vielleicht nicht, ein Verfahren schon.*
- **Abweichung ohne Nullerwartung deuten.** Ein Modellfehler wurde als Signaleigenschaft
  gedeutet — bis der Placebo dieselbe Abweichung zeigte.
- **Aggregator-Datum ist kein Beleg.** Ein zehn Wochen alter Deal erschien als Montagsmeldung.
  **Gegenprobe ist EDGAR.**

- **Der Kopf der Schlange, der nie fertig wird.** Eine Warteschlange, die immer nur das
  vorderste Element bedient, steht still, sobald dieses Element nie „erledigt" werden kann.
  Der App-Sammler nahm je Blick auf die Uhr nur das erste fällige Intervall, und fällig blieb ein
  Wert, solange seine jüngste Kerze alt war — bei zwei Werten, für die Yahoo nichts mehr liefert,
  also für immer. 122 Läufe „5m, 2 Werte" in drei Tagen, während 3.263 Tagesreihen warteten;
  jede Zeile im Log sah ordentlich aus. **Gegenprobe:** Läufe mit `neu=0` zählen, nicht Läufe.
  *Fundstelle: `uebergabe/auftrag-sammler-verhungern-2026-09-04.md`.*

## Werkzeug-eigene Fallen

- **Windows-Pfade in `node -e`:** Backslashes überleben Bash-Quoting nicht — und der Fehler
  bestätigt sich selbst, weil das Kontroll-Lesen denselben Pfad nimmt.
- **`@($null).Count` ist 1 in PowerShell** — ein falscher Feldname meldet nicht „fehlt",
  sondern „genau eins".
- **Bash `date` läuft anders als die Windows-Uhr.** Zeitstempel immer aus `Get-Date` oder
  `git log --format=%ci`.
- **`writeFileSync` überschreibt** — `vereinigen()` ist der einzige Weg, frisch gewinnt.
- **Code im Repo ≠ Code im Paket.** `tools/` wird nicht ausgeliefert; ein Aufruf dort läuft in
  der App **still** ins Leere.
- **Fest verdrahtete Pfade** (`E:/…`) funktionieren nur auf einer Maschine.
- **Zeitstempel als ZEICHENKETTE vergleichen.** `'…T14:35:00Z' > '…T14:35:00.001Z'`, weil `.`
  vor `Z` sortiert. Ein Prüfsatz meldete deshalb „VERFEHLT" an einer Schnittstelle, die genau
  das Richtige tat. **Immer `Date.parse`.** *Fundstelle:
  `studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md` §1.1.*
- **Der Alias, der an der Sperrklinke vorbeiführt.** Eine Klinke suchte `process.env.ALPACA`;
  die geprüfte Datei las über `var E = process.env; E.ALPACA_KEY` — und wurde grün, weil sie
  das Muster nicht enthielt. **Eine Klinke, die eine Schreibweise sucht, muss die Umgehung
  dieser Schreibweise mitsuchen.** Gefunden hat es der eigene Test, nicht der Verdacht.
- **Die Schnittstelle, die lieber irgendetwas antwortet als nichts.** `feed=iex` gab auf eine
  2018er Anfrage Quotes von 2020, HTTP 200. Ein Abruf um 15:55 ET an einem Halbtag gab einen
  nachbörslichen Quote statt einer Lücke. **Beide Male sieht die Antwort richtig aus.** Gegen
  diese Form hilft nur, den gelieferten Zeitstempel gegen den angefragten zu halten — und
  Handelszeiten aus dem Kalender der Börse zu nehmen, nicht aus einer Liste im Code.
  *Fundstelle: [datenquellen.md](datenquellen.md), Kasten bei „Alpaca als Kursquelle".*
- **Drei Leck-Tests, die dieselbe Zusage abwarten, prüfen einander.** Jeder hängt
  `process.stdout.write` um; laufen sie verschachtelt, reißt der erste, der zurücksetzt, die
  Haken der anderen mit — deren „gesammelt" enthält dann nur die (verdeckte) Ausgabe des
  **Nachbarn**, und der Test besteht mit fremden Zeilen. Gefunden von der Gegenprobe (Verdeckung
  aus der Z1-Probe ausgebaut → blieb grün), nicht vom Verdacht. **Regel: Tests, die einen
  globalen Haken setzen, laufen als Kette, nie auf eine gemeinsame Zusage.** *Fundstelle:
  test-v6 Block 35 (b), `uebergabe/archiv-z1-2026-09-03.md` §7, 03.09.2026.*
- **Die Klinke sucht das Wort, nicht die Stelle.** `quelleNeu: 'alpaca'` stand auch in der
  Positivkontrolle des Werkzeugs; auf `'yahoo'` umgestellt am Schreibpfad blieb die Suche über
  die ganze Datei grün. **Klinken auf Schreibpfade anchoren am Aufruf, der schreibt.** *Fundstelle: ebenda, Gegenprobe G17.*
- **Ein Trockenlauf, der aussieht wie ein Befund.** Ein Probelauf der Auswertung auf
  erfundenen Daten hinterließ ein vollständig ausgefülltes `ERGEBNIS.md` im Studienordner.
  **Werkzeuge, die Berichte schreiben, benennen die Datei nach der Herkunft der Zahlen** —
  nicht nach der Absicht des Aufrufers.
