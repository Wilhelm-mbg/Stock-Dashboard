# Befund: Der Winkel am bestätigten Kanal (Felix, #33/#36)

Registrierung: `VORREGISTRIERUNG-2026-08-25-winkelbestaetigt.md`, geschrieben vor dem
Lauf. Protokoll: `protokolle/winkelbestaetigt-2026-08-25.json`.
**2.201 Werte, 730 Handelstage, Schnitt 2025-03-12, Stundenkerzen.**

## Die Zahlen

Bestätigungshälfte, Überschuss über die Kontrolle, t über **Tage** geclustert:

| Stufe | Winkel ≥ | Signale | Überschuss | t | MDE | netto n. Spanne |
|---|---|---|---|---|---|---|
| S0 | 0,0 | 711.251 | −0,0619 Pp | −0,96 | 0,1283 | −0,1712 Pp |
| S05 | 0,5 | 503.083 | −0,1250 Pp | −1,34 | 0,1871 | −0,1773 Pp |
| S10 | 1,0 | 318.460 | −0,0864 Pp | −1,54 | 0,1124 | −0,1811 Pp |
| S15 | 1,5 | 178.716 | −0,0870 Pp | −1,58 | 0,1102 | −0,1908 Pp |
| S20 | 2,0 | 89.861 | −0,1272 Pp | **−2,11** | 0,1206 | −0,2271 Pp |

**MDE vor dem Urteil**: Nur bei S20 liegt der Überschuss überhaupt über der kleinsten
nachweisbaren Wirkung. Alle übrigen Stufen sind **nicht entscheidbar** — das ist eine
Aussage über die Datenmenge, nicht über die Idee.

## Urteil

**Felix' Behauptung ist nicht bestätigt.** Die Registrierung verlangte beides: einen
über die Stufen *steigenden* Überschuss und eine Stufe mit t ≥ 2,58. Keines trifft zu.

Der Überschuss steigt nirgends. Er ist auf allen fünf Stufen **negativ**, und die
steilste Stufe ist die schlechteste — genau umgekehrt zur These. Auffällig ist die
Stetigkeit des t über die Stufen: −0,96 → −1,34 → −1,54 → −1,58 → −2,11. Bei
geschachtelten Stichproben ist das kein unabhängiger Trend, aber es zeigt in eine
Richtung, und zwar in die andere.

**„Widerlegt" wird trotzdem nicht ausgesprochen.** t = −2,11 liegt unter der
Bonferroni-Schwelle 2,58, und ein Vorzeichen ist kein Beleg. Was hier steht, ist:
*nicht bestätigt, und die Richtung spricht dagegen.*

## Der eigentliche Fund

**Die Bestätigung selbst trägt nichts.** S0 ist der Nullpunkt: jeder Kanal, der sich an
acht ungesehenen Kerzen bewährt hat, ohne jede Winkelbedingung. Auch er liegt bei
−0,0619 Pp. Ein Kanal, der gehalten hat, sagt über die nächsten acht Kerzen nichts.

Das passt zum bereits gemessenen Befund, dass Abschnittskanäle als Handelsbedingung
schädlich waren (−0,17 Pp, t = −4,1). Kanäle beschreiben, was war. Sie belegen nichts
über das, was kommt.

## Warum es zwei Läufe gab

Der erste Detektor (`winkelgrad.js`) nannte einen Trend „bestätigt", sobald
`Q.kanalUeber` überhaupt ein Ergebnis lieferte — mit der Begründung, die Funktion
verlange Randberührungen und ein Varianzverhältnis gegen den Zufall. **Sie verlangt
nichts davon.** In 20.000 Zufallspfaden gab sie kein einziges Mal `null` zurück.
Reines Rauschen bekommt Güte-Median 75 und heißt zu 35 % „trend: auf"; die
Randberührung kann strukturell nicht scheitern, weil die Ränder das 92.-/8.-Perzentil
genau der Abweichungen sind, an denen sie geprüft werden.

Der Detektor feuerte deshalb auf **52,7 %** aller Kerzen. Der korrigierte feuert auf
**6,6 %**. Beide Läufe stehen; der erste beantwortet die Frage „lässt sich über 40
Kerzen eine Gerade legen", der zweite Felix' Frage.

Aufgefallen ist der Fehler auf Wilhelms Nachfrage, nicht von selbst.

## Was offen bleibt

- **1m und 5m.** Felix' ursprüngliches Bild (#33) war der Minutenchart. Das 1m-Archiv
  hat 63 Handelstage, die #33-Registrierung nennt 77 als Mindestmaß — in etwa drei
  Wochen messbar.
- **Der Ausstieg.** Felix' zweite Regel (je steiler der Winkel, desto mehr
  Ausstiegssignale) ist nie geprüft worden und braucht eine eigene Registrierung.
- **Die Positionsgröße.** Bewusst nicht gebaut: sie ändert nicht, *ob* eine Kante
  existiert. Solange keine da ist, ändert sie nichts.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
