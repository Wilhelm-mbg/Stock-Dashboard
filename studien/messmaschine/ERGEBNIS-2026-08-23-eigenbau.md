# Ergebnis „Eigenbau", 23.08.2026

Zur Vorregistrierung: [VORREGISTRIERUNG-2026-08-23-eigenbau.md](VORREGISTRIERUNG-2026-08-23-eigenbau.md),
festgeschrieben in Commit `836bfac` **vor** der ersten Messung.

> **Dieses Dokument ist die zweite Fassung.** Die erste (Commit `c8b63b4`) enthielt
> zwei falsche Behauptungen, die eine Gegenprüfung aufgedeckt hat. Beide sind unten
> unter „Was ich zurücknehmen muss" benannt. Die Urteile ändern sich dadurch nicht,
> die Begründungen schon.

## Die kurze Antwort

**Keine der drei Thesen trägt.** Alle sieben vorregistrierten Tests: nicht entscheidbar.

Der Ertrag liegt woanders: Beim Messen kam ein Fehler im Messgerät heraus, der jede
bisherige Messung dieses Projekts berührt — und die Abhilfe dafür ist stärker als das,
was ich zuerst gebaut hatte.

## Die sieben Tests, korrigierter Stand

Prozentpunkte, Bestätigungshälfte, Kontrolle nach **A7** (ohne das Lesefenster des
Signals). Bonferroni-Schwelle für |t| bei 7 Tests: **2,69**.

| These | Variante | Überschuss | MDE | t | je Signal | Urteil |
|---|---|---|---|---|---|---|
| T1 Zwangsglattstellung | k=1,5 | +0,1041 | 0,1426 | 1,46 | −0,1011 | nicht entscheidbar |
| | k=2,0 | +0,0543 | 0,1812 | 0,60 | −0,3053 | nicht entscheidbar |
| | k=2,5 | −0,1620 | 0,2339 | −1,38 | −0,5416 | nicht entscheidbar |
| T2 Umsatzschock | k=3 | +0,0783 | 0,2264 | 0,69 | +0,0640 | nicht entscheidbar |
| | k=5 | +0,0898 | 0,3597 | 0,50 | −0,0475 | nicht entscheidbar |
| T3 Stunden-Drift | k=1,0 | +0,0021 | 0,0211 | 0,19 | +0,0022 | nicht entscheidbar |
| | k=2,0 | +0,0034 | 0,0368 | 0,19 | −0,0004 | nicht entscheidbar |

Keine Variante erreicht auch nur ihre eigene MDE. Netto nach Spanne ist jede negativ.

## Der Fehler im Messgerät (A6) und seine Abhilfe (A7)

Die Kontrolle mittelt über einen **endlichen** Topf — rund 366 Kerzen je Symbol,
Stunde und Hälfte. Liest ein Signal Kerzen aus diesem Topf und wählt danach aus, dann
verschiebt jede Auswahl den Rest in die Gegenrichtung. Ohne dass im Markt irgendetwas
passiert.

**Der Beweis** ist nicht der Nullversuch, sondern eine Manipulation der Ursache mit
vorhergesagtem Ausgang: Schrumpft der Topf von 366 auf 183 auf 103 Werte, wächst die
Verzerrung um Faktor **1,84** und **2,81** — vorhergesagt waren 1,87 und 2,9. Vier
unabhängige geschlossene Rechnungen treffen sie zusätzlich auf 1–4 %. Und die
Placebo-Probe: derselbe Detektor, am Topf der **Vorstunde** gemessen, ergibt −0,0005
statt −0,0242 Pp.

**A7** macht die Verzerrung nicht messbar, sondern unmöglich: Die Strategie gibt an,
wie weit sie zurückliest, und die Kontrolle lässt genau diese Kerzen aus. Der
Erwartungswert des Überschusses ist dann unter der Nullhypothese exakt null — ein
Durchlauf, kein Zufall.

| `t3-stundendrift` | Überschuss | t | Urteil |
|---|---|---|---|
| vor A7, echtes Archiv | −0,0329 | −3,19 | **widerlegt** |
| vor A7, Zufallsarchiv | — | −8,07 | **widerlegt** |
| nach A7, echtes Archiv | +0,0021 | 0,19 | nicht entscheidbar |
| nach A7, Zufallsarchiv | −0,0003 ± 0,0006 | −0,45 | Eichung in Ordnung |

## Was ich zurücknehmen muss

### 1. „Der gesamte rsi2seit-Überschuss war das Messgerät" — falsch

Diese Aussage stützte sich auf eine Verzerrungsschätzung von +0,027 Pp aus 30
Nullversuchen. Mit A7 zeigt sich, dass bei `rsi2seit` praktisch keine Verzerrung
vorliegt:

| | Überschuss | t | je Signal |
|---|---|---|---|
| roh (vor A7) | +0,0241 | 0,26 | −0,0415 |
| **mit A7** | **+0,0277** | **0,30** | **−0,0415** |
| mit Nullversuch-Abzug (falsch) | −0,0030 | −0,03 | — |

Das Urteil war und bleibt **nicht entscheidbar**. Aber „war alles Artefakt" stimmt
nicht. Ein Verzerrungsschätzer mit eigenem Fehler ist selbst eine Fehlerquelle — das
ist die Lehre.

### 2. Die T1-Hälfte meiner A6-Erklärung — falsche Ursache

Ich schrieb, T1 komme auf Zufallsdaten „bestätigt" durch, **weil** es nach oben
verzerrt sei. Der Punktschätzer war dort +0,0946 gegen +0,0933 echt — praktisch
gleich. Was das Fehlurteil erzeugte, war der **Standardfehler**: 0,0319 statt 0,0707.

Gegenprobe: Vergrößert man T1s Lesefenster von 430 auf 4.000 Kerzen, schrumpft sein
Null-Überschuss **nicht** (0,059 → 0,045 → 0,048 → 0,051 → 0,063). Bei einer
Überlappungsverzerrung müsste er das.

Die richtige Ursache steht jetzt als eigener Fehlertyp **A8**: Der Nullversuch würfelt
jedes Symbol einzeln und zerstört den Gleichlauf der Werte. Ein Tagesmittel über 190
Werte streut dort viel weniger als in echt. **Ein Nullarchiv taugt für Verzerrung, nie
für Signifikanz.**

## Drei Fehler in meinem eigenen Werkzeug

| | Fehler | Wirkung |
|---|---|---|
| `messmaschine.js:251` | Kontrolle einmal mit `varianten[0]` gebaut, obwohl der Kommentar zwei Zeilen darüber „je Variante" forderte | alle 5 MCP-Urteile liefen mit der Kontrolle für MCP 90 %. Variante 4 fällt korrigiert von t = 2,01 auf **0,37** |
| Zufallsgenerator | Zyklus 10.466, alle 30 Saaten auf demselben Ring, ein Archiv braucht 106 Umläufe | Streuungsangaben der Nullversuche waren wertlos |
| Vertauschung unvollständig | Umsatz blieb liegen, Hoch/Tief wurden skaliert | Umsatzkopplung 0,40 → 0,14, T2 verlor 57 % seiner Signale, 1-%-Stops lösten 60 % zu oft aus |

Nach der Reparatur ist das Nullarchiv originalgetreu:

```
                        echt    vertauscht
Korr(|Rendite|,Umsatz)  0,1291    0,1291
Vorschluss in Spanne    88,5 %    88,2 %
1-%-Stop löst aus       9,69 %    9,69 %
```

## Was in der App stand

`depot.js:626` hielt `KANTE = { rsi2seit: 0.11 }` fest verdrahtet und zeigte daraus
unter der Werksvorgabe **„Gemessener Vorsprung dieses Auslösers: 0.11 Pp → netto +0.01
Pp" in Grün** — während dasselbe Protokoll desselben Tages „nicht entscheidbar" und je
Signal −0,0415 Pp führte. Zwei unabhängige Fehler: eine überholte Zahl, und ein
Tagesmittel gegen Kosten je Umlauf gestellt.

Die Kante kommt jetzt aus dem Protokoll (Regel D2), mit Urteil daneben. **Und die
eigentliche Regel, die gefehlt hat: Grün heißt nicht „Zahl ist positiv", sondern
„Urteil ist bestätigt und trägt die Kosten."** Eine nicht entscheidbare Messung ist
kein Vorsprung, egal welches Vorzeichen sie hat.

## Was nicht betroffen ist

- **Momentum / Mittelfrist.** Auswahlfenster (t−231 bis t−21) und Ergebnisfenster sind
  disjunkt; A6 kann dort konstruktiv nicht greifen.
- **Ergebnis-Drift.** Misst zwei disjunkte Quintilbeine gegeneinander und führt seit
  dem 21.08. einen eigenen Nullversuch.
- **Regime-Zuteilung R-TREND und Pool-Wahl.** Differenzen zweier Arme; eine
  gleichförmige Verzerrung kürzt sich heraus.
- **Der analytische Standardfehler auf echten Daten.** Newey-West 0,62× bis 1,08×,
  studentisierter Bootstrap verlangt 2,67–2,73 gegen benutzte 2,69. Das war der
  plausibelste Angriff auf das Verfahren, und er ist gescheitert.

## Offen

- **Kapitulations-Dip** wird vom Depot gehandelt und ist mit dieser Maschine nie
  gemessen worden. Höchste Priorität.
- **Der Edge-Wächter** (`depot.js:7493`) löst eine echte Handelssperre am Vorzeichen
  eines auf zwei Stellen gerundeten Mittelwerts aus, dessen eigene MDE etwa das
  Vierfache der bewachten Kante beträgt; er sperrt auch `kapitulation` mit, das er nie
  misst. Nicht geändert — das ist eine Entscheidung über Handel, nicht über Code.
