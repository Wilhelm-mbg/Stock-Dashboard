# Einstiegskonvention, Zweig E — Ergebnis, 25.08.2026

| | vorregistriert | gemessen | Urteil |
|---|---|---|---|
| **E1** Äquivalenz je Zelle, Marge ±0,010 Pp | Intervall in **jeder** Zelle in der Marge | 12 von 13 Zellen ja | **nicht entscheidbar** für eine Zelle, Aggregataussage entfällt |
| **E3** Schichtungspflicht | `sd(GRENZE) ≥ 3 · sd(INNEN)` | **13,41** | **JA — eigene Schicht** |

## Vorher: die Vorregistrierung nachgerechnet

Nach den Erfahrungen dieses Tages (die D1-Empfehlung des Nachbardokuments war falsch, der
Pilot der Querschnitts-Kontrolle täuschte durch seine Spannweite) habe ich die tragenden
Zahlen unabhängig nachgerechnet, bevor ich gemessen habe:

| | behauptet | nachgerechnet |
|---|---|---|
| Reihen benutzt | 2.873 (11 nach F1, 1 zu kurz) | **exakt gleich** |
| GRENZE-Fälle | 1.980.534 auf 692 Tagen | **exakt gleich** |
| bitgleich GRENZE | 2,22 % | 2,22 % |
| Kalenderabstand 1 / 2–3 / 4–7 / >7 | +0,05975 / +0,06506 / −0,13621 / −18,94 | **alle vier auf fünf Stellen** |

Einzige Abweichung: INNEN 11.821.670 gegen 11.818.797 — Differenz genau 2.873, also eine je
Reihe. Eine Randkonvention, kein Fehler. **Die Vorregistrierung hält.**

## E1 — die eine Zelle, die die Marge verlässt

| Zelle | Tage | Fälle | Mittel | Halbbreite | in der Marge |
|---|---:|---:|---:|---:|---|
| bestaetigung\|0 … \|5 | 361–365 | ~1,04 Mio je | −0,0006 … +0,0049 Pp | ≤ 0,0031 | ja |
| entdeckung\|0 … \|5 | 324–328 | ~0,93 Mio je | −0,0039 … −0,0013 Pp | ≤ 0,0029 | ja |
| **bestaetigung\|6** | **3** | **5** | **+59,75 Pp** | **±133,92** | **NEIN** |

Zwölf Zellen mit je rund einer Million Fällen liegen bequem in der Marge. Die dreizehnte
hat **fünf Fälle an drei Tagen**.

Nach der vorregistrierten Regel lautet das Urteil für diese Zelle **nicht entscheidbar**,
und die Aggregataussage entfällt. Das steht so, obwohl die Zelle offensichtlich ein
Datenartefakt ist und kein Befund: Position 6 ist im 60m-Archiv fast immer die *letzte*
Kerze des Tages und fällt damit unter GRENZE — E1 misst aber nur INNEN. Die fünf Fälle sind
Tage mit einer achten Kerze.

**Die Regel nicht nachträglich zu biegen, ist Absicht.** Sie wurde geschrieben, um zu
verhindern, dass ein Aggregat eine schlechte Zelle verdeckt. Dass sie hier eine *leere*
Zelle trifft statt einer schlechten, ist eine Schwäche der Regel — aber eine Regel nach dem
Blick auf die Zahlen zu präzisieren, ist genau der Griff, den die Mühle verbietet.

**Was man trotzdem sagen darf:** Innerhalb der Sitzung liegt die Lücke bei −0,00003 Pp über
11,8 Millionen Fälle. Für jede Zelle mit mehr als fünf Fällen ist die Schluss-Konvention
folgenlos.

## E3 — und was die Messung dabei aufgedeckt hat

```
INNEN    n = 11.821.670   Mittel −0,00003 Pp   sd 0,1316 Pp
GRENZE   n =  1.980.534   Mittel +0,05539 Pp   sd 1,7652 Pp
Verhältnis 13,41   (Schwelle 3)
```

Nicht von den Mehrtageslöchern getrieben: auf 1-Tages-Abstände beschränkt bleibt das
Verhältnis bei 13,35.

**Der eigentliche Fund kam beim Nachprüfen der Folge.** Die Maschine schlüsselt ihren
Kontrolltopf seit F3 nach Sitzungsposition — die Annahme dahinter war, die Position sage,
was *nach* der Kerze kommt. Das gilt nur bei konstanter Sitzungslänge:

| Position der Signalkerze | INNEN | GRENZE |
|---:|---:|---:|
| 0 | 1.980.393 | 147 |
| 1 | 1.980.184 | 216 |
| 2 | 1.982.560 | 362 |
| **3** | **1.962.308** | **20.289** |
| 4 | 1.960.088 | 821 |
| 5 | 1.956.132 | 2.560 |
| 6 | 5 | 1.956.139 |

**Jede Position enthält beides.** An verkürzten Handelstagen ist schon Position 3 die
letzte Kerze — 20.289-mal.

Und das ist nicht folgenlos. Die Folgerendite über H = 8, also genau das, was im
Kontrolltopf liegt:

| Position 3 | n | Mittel |
|---|---:|---:|
| innerhalb der Sitzung | 1.959.436 | **+0,0925 Pp** |
| an der Grenze | 20.287 | **−0,4205 Pp** |
| | | **Abstand 0,513 Pp** |

Bei 1,03 % Anteil verschiebt das den Topf um **0,0053 Pp**. Die größte je sauber gemessene
Nettokante liegt bei 0,047 Pp — es sind also 11 % davon, und es ist **Verzerrung, kein
Rauschen**: Sie schrumpft nicht mit mehr Daten.

## Umgesetzt

Der Topf-Schlüssel ist jetzt die **Sitzungsschicht**: Position *plus* die Frage, ob dies die
letzte Kerze ihres Tages ist (`3I` gegen `3G`). Die F3-Lehre gilt unverändert weiter —
`sitzungsSchicht()` baut auf `sitzungsPosition()` auf, keine UTC-Stunde.

**Der Preis, offen gesagt: alle bestehenden Protokolle sind damit veraltet.** Der erste
Neulauf zeigt allerdings, dass sich für `rsi2seit` fast nichts ändert (+0,0541 gegen +0,054
Pp, t 0,83 unverändert) — die Verunreinigung trifft Strategien unterschiedlich stark, je
nachdem, auf welchen Positionen sie feuern.

## Was Zweig E nicht sagt

Er sagt **nichts über den Markt**. Er misst das Lineal: ob die Einstiegskonvention der
Maschine innerhalb einer Sitzung etwas kostet (nein) und ob die Sitzungsgrenze eine eigene
Schicht braucht (ja). Kein Urteil über eine Strategie folgt daraus — nur, dass künftige
Urteile auf einem etwas saubereren Topf stehen.

**Zweig N** — die Neumessung der acht 60m-Strategien mit Füllung zum ersten handelbaren
Kurs *nach* dem Signal — ist damit noch offen.
