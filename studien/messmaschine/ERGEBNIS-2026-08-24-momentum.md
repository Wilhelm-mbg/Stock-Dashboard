# Ergebnis „Momentum", 24.08.2026

Vorregistrierung: [VORREGISTRIERUNG-2026-08-24-momentum.md](VORREGISTRIERUNG-2026-08-24-momentum.md),
Commit `0dcc034`, geschrieben vor der ersten Messung.

## Urteil

**Nicht entscheidbar — alle vier Varianten.** Und der Weg dorthin ist der eigentliche
Befund des Tages.

## Was die erste Rechnung ergab

2.249 Werte, 10.076 Handelstage, Schnitt 2006-08-14.

| Variante | Signale | Entdeckung | Bestätigung | MDE | t | Urteil |
|---|---|---|---|---|---|---|
| V2 stärkste 5 % | 606.122 | +2,813 | +1,522 | 0,460 | **6,62** | bestätigt |
| V0 stärkste 10 % | 1.231.227 | +2,075 | +0,897 | 0,378 | **4,74** | bestätigt |
| V1 stärkste 20 % | 2.433.428 | +1,388 | +0,256 | 0,318 | 1,61 | nicht entscheidbar |
| V3 stärkste 33 % | 4.020.562 | +0,848 | −0,047 | 0,286 | −0,33 | nicht entscheidbar |

Alles sprach dafür: **beide Hälften positiv** — das hatte an diesem Tag keine andere
These geschafft — und eine saubere Dosis-Wirkungs-Beziehung (5 % > 10 % > 20 % > 33 %).
Netto +1,03 Pp je Signal bei der Live-Einstellung.

## Warum es trotzdem nichts ist

Bei 63 Tagen Haltedauer und einem Signal an **jedem** Tag teilen aufeinanderfolgende
Beobachtungen 62 von 63 Tagen ihres Ergebnisfensters. Die Maschine clusterte über
Handelstage und behandelte sie als unabhängige Wiederholungen.

Die Autokorrelation der Tagesmittel zeigt es unmissverständlich:

| Verzögerung | 1 | 5 | 21 | **63** | 126 |
|---|---|---|---|---|---|
| Autokorrelation | 0,979 | 0,902 | 0,646 | **0,016** | 0,082 |

Sie fällt **exakt bei der Haltedauer** ab. Das ist die Lehrbuchsignatur perfekter
Überlappung.

| Rechnung | t |
|---|---|
| naiv (Tage als unabhängig) | 4,74 |
| **Newey-West, 63 Verzögerungen** | **0,74** |
| nicht überlappende Blöcke, Median über 63 Startlagen | **0,52** |

**0 von 63 Rasterlagen** erreichen die Schwelle 2,50 (kleinster 0,25, größter 1,02).
Der Standardfehler war um Faktor **6,42** zu klein.

Das reproduziert unabhängig, was die Kontroll-Prüfung der Parallelsitzung für die
alte Momentum-Auswertung gemessen hatte: von 63 Lagen erreicht keine ein t ≥ 1,96.
Mit anderem Universum, anderer Kontrolle, anderem Code — dieselbe Antwort.

## Nach der Korrektur

| Variante | Überschuss | MDE | t | Urteil |
|---|---|---|---|---|
| V0 stärkste 10 % | +0,897 | 2,421 | 0,74 | nicht entscheidbar |
| V1 stärkste 20 % | +0,256 | 2,029 | 0,25 | nicht entscheidbar |
| V2 stärkste 5 % | +1,522 | 2,938 | 1,04 | nicht entscheidbar |
| V3 stärkste 33 % | −0,047 | 1,815 | −0,05 | nicht entscheidbar |

## Der Fehler heißt jetzt B10 und ist behoben

Die Maschine clusterte über Tage — richtig gegen den Fehler, Signale desselben Tages
als unabhängig zu zählen (B1). Der zweite Schritt fehlte: Bei H Kerzen Haltedauer
teilen aufeinanderfolgende **Tage** H−1 Kerzen ihres Ergebnisfensters.

Der Standardfehler ist jetzt immer Newey-West-korrigiert, mit **H−1** Verzögerungen
und Bartlett-Gewichten. Bei H = 1 ändert das exakt nichts; der Vergrößerungsfaktor
steht im Protokoll, und ab Faktor 3 warnt die Maschine.

**Betroffen war jede Messung mit H > 1.** Nachgerechnet:

| Messung | H | t vorher | t nachher |
|---|---|---|---|
| Momentum, stärkste 10 % | 63 | 4,74 | **0,74** |
| Kapitulations-Dip V0 | 26 | 2,59 | **1,74** |

Damit löst sich auch das „grenzwertig" vom Kapitulations-Dip auf. Beide Befunde
dieses Tages sind weg.

## Was offen bleibt

**Die Überlebensverzerrung wurde gar nicht erreicht.** Sie war der zweite Einwand
der Vorregistrierung, und die Messung ist vorher gescheitert. Die 2.249 Werte sind
die, die Yahoo heute noch führt — über 40 Jahre eine massive Auswahl. Falls die These
je die Überlappungsprüfung besteht, kommt diese Hürde noch.

**Die Ergebnis-Drift blieb ungemessen.** Sie braucht Quartalstermine; die liegen für
rund 189 Werte vor, nicht für 2.965. Das ist ein Datenproblem, kein Messproblem.

## Was das wert war

Ein Ergebnis mit t = 4,74, beiden Hälften positiv und sauberer Dosis-Wirkung ist
genau der Fund, den man behalten möchte. Er hielt einer Frage nicht stand, die man
sich stellen muss, gerade **weil** alles dafür spricht: *Warum ist dieser t-Wert so
groß?*

Die Maschine kann diesen Fehler ab jetzt nicht mehr machen.
