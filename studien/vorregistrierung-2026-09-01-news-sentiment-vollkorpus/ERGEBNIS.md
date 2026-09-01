# Ergebnis — News-Sentiment, Vollkorpus (Übernachtertrag)

**01.09.2026.** Vorregistrierung im selben Ordner (mit Nachtrag 1), Lauf
`messe-vollkorpus.js`, Rohzahlen `lauf.json`. Kein Schlüssel in Ausgabe, Log, Commit oder URL.

## Die Antwort

> **Sagt der Sentiment-Score den Übernachtertrag voraus?**
>
> # NEIN.
>
> **b = +0,0070 Pp je Score-Punkt (se 0,0224 geclustert, t = 0,31).** Kein Effekt, und schon
> gar keiner über den Kosten. Regel **R2** der Vorregistrierung: |t| < 1,96 **und** das
> 90-%-Band liegt vollständig innerhalb ±MDE.

**Testzahl: 1** (Familie `news-sentiment-vollkorpus`, testsGesamt = 1, Schwelle |t| ≥ 1,96,
kein Multiplizitätsaufschlag nötig).

| | |
|---|---|
| Fenster | 2021-05-01 … 2026-08-28, **1.338 Handelstage** |
| Universum | 30 Stammaktien, Punkt-in-Zeit-Liquidität ≥ 0,5 Mrd $ vor Fensterstart |
| Korpus | **233.625 Meldungen**, alle 30 Blätterketten erschöpft |
| Beobachtungen (Score ≠ 0) | **33.307** in 1.338 Tages-Clustern |
| **MDE** (konservativ, Planformel) | **0,2639** Pp/Punkt |
| **MDE** (realisiert, K₈₀ × se) | **0,0626** Pp/Punkt — 4,2× schärfer als geplant |

## Die Tabelle — Kandidat, Placebo und Positivkontrolle in derselben Blickzeile

| Zeile | b (Pp/Score-Punkt) | se | t |
|---|---|---|---|
| **KANDIDAT** | **+0,0070** | 0,0224 | **0,31** |
| **Placebo**, Mittel aus 200 Permutationen (Saat 20260901) | +0,0028 | 0,0193 | 0,14 |
| Positivkontrolle **rauschfrei** (Soll +0,50) | **+0,500000** | — | — |
| Positivkontrolle **2.000 Züge** (Soll +0,50) | **+0,4996** | 0,0004 | — |
| Positivkontrolle **1 Zug** (ohne Urteilskraft) | +0,4736 | 0,0187 | 25,33 |

**Placebo-Band (5./95. Perzentil): −0,0300 … +0,0312.** Der Kandidat **+0,0070 liegt mitten
darin** — er ist von einer zufälligen Zuordnung der Schlagzeilen zu Symbol-Tagen nicht zu
unterscheiden.

**Positivkontrolle bestanden**, alle drei Formen: rauschfrei **exakt** 0,500000, über 2.000
Züge 0,4996 (0,999×). Der Einzelzug traf diesmal ebenfalls (0,474) — bei n = 33.307 kann er
das, anders als am 31.08., wo er mit 11,5 % Trefferchance ein Fehlalarm war. Er bleibt
trotzdem ohne Urteilskraft, wie registriert.

**Look-ahead: 481.668 Zeitstempel geprüft, 0 nach Handelsschluss.** `published_utc` ist die
echte Veröffentlichungszeit — das ist der Vorteil gegenüber dem App-Archiv, das
`it.t || Date.now()` schreibt und damit teils Abrufzeiten führt.

## Warum das ein NEIN ist und keine Blindheit

Das ist der Unterschied zum 31.08. („NICHT MESSBAR"): Damals war das Band breiter als jede
interessante Kante. Diesmal ist es **eng genug, um einen handelbaren Effekt auszuschließen**.

Wirkung je **1-sd-Score-Sprung** (sx = 0,3336):

| | Pp | gegen die Hürde |
|---|---|---|
| Punktschätzung | **+0,0023** | — |
| **Obergrenze des 90-%-Bandes** | **+0,0146** | **CFD 0,1247 Pp → Faktor 8,5 darunter** |
| dieselbe Obergrenze | +0,0146 | **Kassa-Aktie 0,0600 Pp → Faktor 4,1 darunter** |

**Selbst das optimistische Ende des Konfidenzbandes bleibt um das 8,5-Fache unter der
CFD-Hürde.** Ein handelbarer Effekt ist damit nicht bloß nicht gefunden, sondern
ausgeschlossen.

**Kosten je Gefäß angesetzt, nie pauschal** (`wiki/kosten.md`, H = 1 Nacht): CFD gehebelt
K 0,10 + F 0,0247 = **0,1247 Pp**; Kassa-Aktie **0,0600 Pp** konstant. Die Runde stammt aus der
≥ 1,6-Mrd-$-Klasse, unser Rang 30 liegt bei 0,56 Mrd — die Hürde ist hier also eher
**optimistisch**, was das NEIN nur stärkt.

### Eine Verschärfung über die Vorregistrierung hinaus — als solche gekennzeichnet

Die Vorregistrierung stellte die NEIN-Seite auf die **CFD-Hürde** und hielt fest, ein NEIN
gelte ausdrücklich *nicht* für die Aktienhürde (die Planrechnung sah die Anordnung dort blind).
**Realisiert ist sie das nicht:** der geclusterte Standardfehler liegt nur **18 % über** dem
ungeclusterten (0,0224 gegen 0,0189) — nach der Tagesbereinigung ist die Abhängigkeit
innerhalb eines Tages klein, während die Planformel volle Abhängigkeit unterstellte. Die
realisierte MDE ist deshalb **4,2× schärfer** als geplant, und das Band schließt auch die
Aktienhürde aus (Faktor 4,1).

**Das ist ein Zugewinn, keine Umdeutung:** vorregistriert und geurteilt wird auf der
CFD-Hürde; die Aktienhürde kommt als *zusätzliche*, nachträglich belegte Aussage hinzu und ist
hier ausdrücklich als solche markiert.

### Beide Fassungen stimmen überein

Geclustert t = 0,31, ungeclustert t = 0,37. Die vorab festgelegte Vorrangregel (geurteilt wird
geclustert) musste keinen Konflikt entscheiden.

## Überlebensverzerrung — Richtung, wie vorab benannt

`wiki/ueberlebensverzerrung.md`: das Archiv **untertreibt** über Nacht um **+0,0462 Pp/Tag**
(Weg 3, Mitglied 2, t 21,39).

**Wirkung hier: praktisch keine.** Der Endpunkt ist eine **Steigung**, keine Höhe — ein
gleichmäßiger Niveauversatz kürzt sich in einer Differenz vollständig heraus.

**Was bleibt und wogegen dieses NEIN nicht immun ist:** Wäre der *Zusammenhang*
Sentiment→Übernacht bei den Verschwundenen ein anderer, wäre b verzerrt. Nach der Wiki-Regel
gilt: **ein NEIN muss die Verzerrungsrichtung mitbedenken — es könnte ein zu Unrecht
verworfener Kandidat sein.** Diese Richtung ist hier **nicht messbar**: die
Nachrichtenabdeckung Verschwundener ist dünn (FRCB, delistet 2023: **1** Treffer,
`GRATIS-PRUEFUNG.md`). Das NEIN gilt deshalb **für überlebende Großwerte**, nicht für
Pleitenähe oder Delisting-Kandidaten.

## Reichweite — was dieses NEIN nicht sagt

- **Nicht für kleine Werte.** Das Universum ist nach Größe gewählt, und diese Wahl war
  erzwungen: der Zufallsquerschnitt reißt die Schwelle (3,0 % Dichte, Faktor 0,8).
  Übertragung auf Nebenwerte ist unzulässig.
- **Nicht für andere Zeitfenster als über Nacht.** Gemessen wurde Schluss(T) → Eröffnung(T+1).
- **Nicht für andere Scorer.** Geprüft wurde die **echte** `Q.sentiment()` aus `quant.js`
  (Schlagwortlisten, Ereignis-Multiplikatoren, Frische-Gewichtung), nicht „Sentiment"
  allgemein. Ein besserer Scorer ist damit weder belegt noch widerlegt.
- **Nicht vor Mai 2021.** Davor trägt der Nachrichtenbestand nicht (Nachtrag 1).

## Folge für die App

**Keine.** Das News-Gewicht steht seit dem 31.08.2026 auf **0** (Entscheid Wilhelm,
`wiki/entscheide.md`). Dieses Ergebnis bestätigt den Entscheid nachträglich mit einer Messung
— es verlangt keine Änderung. Die Anzeige bleibt wie sie ist.

*Sperrliste eingehalten: kein Kanten-Urteil über die registrierte Frage hinaus, keine
Gewichtungs-Empfehlung, keine Änderung an `quant.js` oder `depot.js`,
`massive/universum-2024-09-02.json` nicht angefasst.*

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
