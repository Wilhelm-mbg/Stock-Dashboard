# Kanal-Güte (#80): die drei Wege, zum Entscheid vorgelegt

**Für Wilhelm, 26.08.2026.** Die App zeigt für jeden Trendkanal eine „Güte" von 0
bis 100. Gemessen (#80): **Reines Rauschen bekommt im Median 75.** Die Zahl sieht
aus wie eine Schulnote, aber ihr Nullpunkt liegt nicht bei null — ein Kanal mit
Güte 75 kann schlicht Zufall sein. Du hast drei Wege zur Wahl; hier ist je einer
in Anwendersprache, mit dem, was er gewinnt und was er kostet. **Keine
Empfehlung — gebaut wird nach deinem Entscheid.**

## Wo die Zahl heute steht — und was sie dort tut

| Ort | Was man sieht | Welche Rolle die Zahl dort hat |
|---|---|---|
| Werkzeuge → Aktien-Explorer | Kanäle im Chart: Beschriftung („lang ▲ 82"), Erklärkasten beim Zeigen („Güte 78/100, Passgenauigkeit …, Kanten berührt …"), Info-Zeile unterm Chart | Note **und Sichtbarkeit**: schwache Kanäle werden blasser gezeichnet |
| Werkzeuge → Aktien-Explorer, Kanal-Abschnitte | „A1 ▲ · Güte 75/100" je Trendabschnitt | Note und Sichtbarkeit; Abschnitte **unter Güte 50 werden gar nicht gezeigt** |
| Regeln → Chart | Kontextzeile „aktuell aufwärts, Güte 71/100" | Nur Note |
| Regeln → Mittelfrist, Live-Signal-Monitor | Spalte „Kanal: 34 % · Güte 62" | Nur Note — **aber siehe Befund B1: das ist eine andere Zahl** |
| Im Verborgenen | Die App wählt, **welcher** Kanal als „der" Kanal gilt (bei mehreren Kandidaten gewinnt die höchste Güte) | Auswahlkriterium — der Nutzer sieht nur das Ergebnis |

Wichtig als Rahmen: **Die Güte löst nirgendwo einen Handel aus.** Das ist gemessen
und mit Absicht so (der Trendkanal als Handelsbedingung kostete −0,17 Punkte je
Trade). Es geht hier also rein um Ehrlichkeit der Anzeige, nicht um Handelsregeln.

## Woraus die Zahl besteht, in einem Satz

Passgenauigkeit der Linie (45 Punkte), wie oft der Kurs beide Kanten berührt
(35 Punkte), ob der Abschnitt lang genug ist (20 Punkte). Das Problem: Eine
Gerade, die man **an die Daten anpasst**, passt auch auf Zufall ganz ordentlich —
deshalb landet Rauschen im Median bei 75, und der wirklich aussagekräftige
Bereich der Skala ist das schmale Band darüber.

---

## Weg 1 — Den Bezugspunkt danebenschreiben

**So sähe es aus:** „Güte 82/100 · Rauschen erreicht hier im Mittel 75" — im
Erklärkasten und überall, wo die Zahl steht, ein kurzer Zusatz.

**Was es gewinnt:** Der kleinste Eingriff. Alle Zahlen bleiben, wie man sie
kennt; nichts verschiebt sich in der Auswahl oder Sichtbarkeit der Kanäle; in
einer Stunde umgesetzt. Und es ist ehrlich: Der Leser erfährt den Nullpunkt.

**Was es kostet:** Die Zahl selbst bleibt irreführend gebaut. „82 von 100" liest
sich weiter wie eine gute Note, obwohl zwischen Rauschen (75) und Bestwert (100)
nur 25 Punkte echte Aussage liegen. Die blasser/kräftiger-Zeichnung und der
50er-Filter im Explorer rechnen weiter mit der alten Skala — ein Zufallskanal
mit 75 wird weiter kräftig gezeichnet. Der Zusatz muss an jede Stelle, sonst
entsteht genau die Zwei-Wahrheiten-Lage, die #100 gerade erst beseitigt hat.

## Weg 2 — Auf ein Perzentil umstellen

**So sähe es aus:** „Enger als 91 % des Zufalls" statt „Güte 82/100". Die Zahl
sagt dann: Von hundert Zufallspfaden gleicher Länge sähen nur neun so geordnet
aus wie dieser Kanal.

**Was es gewinnt:** Die Zahl bekommt eine echte Bedeutung mit Nullpunkt: 50 %
heißt „wie Zufall", erst hohe Werte heißen etwas. Es gibt dafür Präzedenz im
eigenen Code: Die Seitwärts-Enge wird bereits gegen eine ausgemessene
Zufallserwartung gerechnet (3.000 Läufe je Fensterlänge) — dieselbe Technik,
auf die ganze Skala angewandt.

**Was es kostet:** Der teuerste Weg. Alle vertrauten Zahlen ändern sich (ein
gewohntes „82" wird vielleicht ein „68 %") — jeder Vergleich mit dem eigenen
Gedächtnis oder alten Bildschirmfotos bricht. Die Zufallsverteilung muss je
Fensterlänge geeicht und als feste Tabelle abgelegt werden. Und die
**versteckten Schwellen müssen mit umgeeicht werden** (der 50er-Filter, die
Blass-Zeichnung, die Bester-Kanal-Auswahl) — sonst ändert sich still, **welche
Kanäle überhaupt erscheinen**. Ohne diese Umeichung wäre der Weg eine
Verschlimmbesserung; mit ihr ist er ein eigenes kleines Vorhaben mit Messung.

## Weg 3 — Rangfolge statt Note

**So sähe es aus:** Keine absolute Zahl mehr. „Kanal 1 von 3 (der
tragfähigste)", „2 von 3" — die Güte ordnet intern weiter, angezeigt wird nur
noch der Rang. Der Erklärkasten behält die messbaren Einzelteile
(Passgenauigkeit, Berührungen, Länge) für den, der es genau wissen will.

**Was es gewinnt:** Die falsche Autorität der 0-bis-100-Note verschwindet
ersatzlos — die App behauptet nur noch, was sie belegen kann: ordnen, nicht
benoten. Keine Eichung nötig, keine versteckten Schwellen zu verschieben (intern
darf die alte Zahl weiterordnen, sie wird nur nicht mehr gezeigt).

**Was es kostet:** Der Abstand geht verloren: „1 von 3" sagt nicht, ob der
erste **viel** oder **kaum** besser ist als der zweite — und ein „1 von 1" sagt
gar nichts (auch ein einzelner Zufallskanal ist der beste seiner Liste — genau
dann trüge die Anzeige wieder eine leere Aussage, nur in neuem Gewand). Über
verschiedene Werte hinweg ist nichts mehr vergleichbar („AMD 1. Kanal" vs.
„MSFT 1. Kanal" sagt nichts). Die Blass-Zeichnung braucht eine neue Quelle.

---

## Zwei Befunde beim Erheben (keine Urteile, aber entscheidungsrelevant)

**B1 — „Güte" ist in der App zwei verschiedene Zahlen.** Der Explorer und der
Strategie-Chart zeigen die Kanal-Güte aus der einen Rechnung (die mit dem
Median-75-Befund). Der **Live-Signal-Monitor** zeigt unter demselben Wort „Güte"
den Score einer **anderen, strenger gebauten Rechnung** (sie verlangt
nachgewiesenes Pendeln zwischen den Kanten). Für die ist der Median-75-Befund
**nicht gemessen** — sie kann besser sein, schlechter, oder gleich; niemand
weiß es. Welcher Weg auch gewählt wird: Er muss sagen, ob er beide Zahlen
betrifft, und die zweite bräuchte dafür erst ihre eigene Rauschen-Messung.

**B2 — Die Güte ist nicht nur Anzeige, sondern auch Türsteher.** Sie entscheidet
mit, welche Kanäle gezeigt werden (Filter unter 50, Blass-Zeichnung) und
welcher Kanal „der" Kanal ist (beste-Güte-Auswahl). Weg 1 lässt das unberührt;
Weg 2 verschiebt es, wenn nicht umgeeicht wird; Weg 3 lässt es intern bestehen.
Das ist der Grund, warum die drei Wege so unterschiedlich teuer sind.

---

*Für die Entwickler: kanaele-Güte `quant.js` (~Z. 2445–2486, Formel 45/35/20),
Anzeigen `explorer.js` ~621/628/648/656/664/669, `strategiechart.js:48`,
`depot.js` renderSigMonitor (~Z. 1421, dort aber `trendChannel.score` aus
`quant.js` ~1529 — Befund B1), Auswahl/Filter `quant.js` ~2517/2543/2578/2585.
Die bestehende Testklinke (`test-channel.js` ~291) prüft nur „kein
Seitwärts-Kanal ≥ 80 auf Zufall" — der Median-75-Befund liegt darunter.
Auftrag #80, nur Vorlage — kein Code geändert.*
