# Bestätigungslauf `monatswende-breit` — 25.08.2026

**Urteil: NICHT ENTSCHEIDBAR, beide Varianten.** Der Entdeckungsbefund hat sich auf der
zurückgehaltenen Hälfte nicht gehalten.

| | Entdeckung | Bestätigung | vorregistriert nötig |
|---|---|---|---|
| V1 (`fenster 5`) | **+0,6952 Pp** (t 4,87) | **+0,1497 Pp** (t 0,83) | 0,363 Pp |
| V2 (`fenster 4`) | **+0,5268 Pp** (t 3,81) | **+0,1548 Pp** (t 0,84) | 0,375 Pp |

Auflösung (MDE) auf der Bestätigungshälfte: 0,3625 bzw. 0,3682 Pp.
Universum 2.213 Werte, 10.076 Handelstage (1986-08-25 bis 2026-08-24), Schnitt **2006-08-14**,
579.543 bzw. 579.616 Signale.

---

## Was hier passiert ist

Die **Entdeckung ist reproduziert.** Vorregistriert war +0,729 Pp bei t 5,04, gemessen auf dem
Vollarchiv +0,695 Pp bei t 4,87 — der Sucher hat nichts erfunden, der Effekt war auf der ersten
Hälfte wirklich da.

Auf der Bestätigungshälfte bleiben davon **21 %** übrig. Vorregistriert war, dass die Hälfte
reichen würde. Der Rückgang ist kein knappes Verfehlen: der beobachtete Überschuss liegt bei
41 % der eigenen Auflösung.

**„Nicht entscheidbar" heißt hier nicht „kein Effekt".** +0,15 Pp liegt unter der MDE — diese
Datenmenge kann nicht zwischen +0,15 und 0 unterscheiden. Was sie ausschließt, ist die
Größenordnung der Entdeckung: ein Effekt von +0,70 Pp hätte auf dieser Hälfte ein t weit über
der Schwelle erzeugt. Die Wette in ihrer entdeckten Stärke ist damit erledigt.

## Der zweite, härtere Grund

Selbst wenn die Bestätigung durchgekommen wäre, wäre das Ergebnis nicht handelbar gewesen:

```
je Signal (handelbar):  +0,1468 Pp
netto nach Spanne:      +0,0468 Pp
```

Die Kostenhürde des Projekts liegt bei **0,10 Pp je Umlauf** (gemessen 0,104 %). Der
handelbare Überschuss deckt sie knapp — und die Strategie kauft 579.543-mal. Das ist dieselbe
Wand, an der schon die große Signalstudie stand: Eine Kante, die kleiner ist als die
Produkthürde, ist keine.

## Warum dem Ergebnis zu trauen ist

Die Maschine hat sich in diesem Lauf selbst geprüft:

| Prüfung | Ergebnis |
|---|---|
| **SP Placebo** (Signal ohne Kursbezug, wahre Antwort null) | **+0,0271 Pp** bei Auflösung 0,1622 Pp — bestanden |
| **F1 Datenprüfung** | 36 Reihen wegen unmöglicher Kurse verworfen (AGX +3.100 %, BRK.A bis 809.300 $, …) |
| **F4 Kontrollverlust** | 8 von 579.543 Signalen (0,0 %) |
| Warnungen | keine |

Der Schnitt liegt auf **2006-08-14** — genau die Grenze, die die Vorregistrierung genannt hat
(Bestätigungshälfte 2006-08 bis 2026-08). Es ist also wirklich die zurückgehaltene Hälfte
gemessen worden, nicht eine andere.

## Was das Signal besonders macht — und warum es trotzdem nicht reicht

`monatswende-breit` liest zu seiner Bildung **keinen einzigen Kurs**. Es gibt keine
Kurvenanpassung, keinen Schwellenwert, kein Fenster, das man hätte suchen können — nur den
Kalender. Damit fällt eine ganze Klasse von Fehlern von vornherein weg: Vorgriff, Auswahl nach
dem Ergebnis, Überlebensverzerrung in der Signalbildung.

Genau das macht den Befund aussagekräftig. Wenn ein Signal ohne jeden Freiheitsgrad auf 20
Jahren +0,70 Pp zeigt und auf den nächsten 20 Jahren +0,15 Pp, dann ist die naheliegende
Erklärung nicht ein Messfehler, sondern **Abnutzung**: Der Monatswende-Effekt ist seit den
1990ern in der Literatur beschrieben, und er ist eine der ersten Regelmäßigkeiten, auf die
sich Systematiker gestürzt haben. Ein Effekt, der aus einem Kalender kommt, den jeder kennt,
ist genau der Effekt, der wegkonkurriert wird.

Das ist eine Vermutung, keine Messung — der Zeitverlauf innerhalb der Bestätigungshälfte ist
hier nicht aufgeschlüsselt, und ihn *jetzt* aufzuschlüsseln wäre Nachbohren an einem Test,
der bereits gefallen ist.

## Kandidat B wurde nicht gemessen

Der Quelltext von `quartalsschub-betrag` ist verlorengegangen — siehe Abschnitt 6 der
Vorregistrierung. Er aus der Prosa nachzubauen hieße, die Operationalisierung nach der
Vorregistrierung zu wählen; das wäre kein eingelöster Bestätigungstest, sondern ein neuer
Entdeckungslauf.

Die Schwelle **bleibt bei 2,50**, obwohl nur zwei statt vier Tests gelaufen sind. Sie zu
senken, weil ein Kandidat ausgefallen ist, wäre genau der Griff, den die Mühle verbietet — und
er hätte am Ergebnis ohnehin nichts geändert: t 0,83 liegt auch unter 2,24.

---

## Bilanz der Vorregistrierung vom 25.08.2026

| | |
|---|---|
| Eingereichte Kandidaten | 16 |
| Vorregistriert | 2 |
| Gemessen | 1 (B: Quelltext verloren) |
| **Bestätigt** | **0** |

Damit steht das Projekt weiter bei **zwei** validierten Kanten (Momentum, Ergebnis-Drift) und
keiner neuen aus dieser Suche.
