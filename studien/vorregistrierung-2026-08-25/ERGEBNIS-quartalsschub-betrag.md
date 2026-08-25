# `quartalsschub-betrag` (Neubau) — 25.08.2026

**Urteil: NICHT ENTSCHEIDBAR, beide Varianten.** Der Nachbau ist gelungen, der
Entdeckungsbefund reproduziert — und er hält auf der zurückgehaltenen Hälfte nicht.

## Der Nachbau hat die überlieferte Strategie getroffen

Vorab festgelegte Annahmebedingung: Überschuss der Entdeckungshälfte für V1 zwischen
+0,58 und +2,31 Pp, Vorzeichen stimmend.

| | überliefert | Neubau | |
|---|---|---|---|
| V0 (Verfall ≤ −2 %) | +1,155 Pp (t 3,91) | **+1,289 Pp (t 3,97)** | ✔ in der Spanne |
| V1 (Verfall ≤ −5 %) | +1,266 Pp (t 3,71) | **+1,369 Pp (t 3,51)** | ✔ in der Spanne |

Nicht nur die Punktwerte, auch die **t-Werte stimmen fast exakt** (3,97 gegen 3,91;
3,51 gegen 3,71). Dazu hatte schon die Rauchprobe getroffen: vorhergesagt waren
1.900–2.100 Signale für die strenge Variante, gemessen **1.910**.

Das ist die eigentliche Leistung dieses Laufs. Aus einer Prosabeschreibung ist eine
Strategie rekonstruiert worden, die dieselben Zahlen erzeugt wie das verlorene Original —
und zwar an einer Bedingung gemessen, die **vor** dem Lauf schriftlich feststand.

## Und sie hält nicht

| | Entdeckung | Bestätigung | nötig bei \|t\| 2,50 |
|---|---|---|---|
| V0 | +1,2891 Pp (t 3,97) | **+0,1843 Pp (t 0,93)** | 0,398 Pp |
| V1 | +1,3686 Pp (t 3,51) | **+0,1621 Pp (t 0,70)** | 0,464 Pp |

189 Werte, 10.076 Handelstage, Schnitt 2006-08-14, 3.490 bzw. 2.723 Signale auf
1.198 bzw. 996 Bestätigungstagen.

Von der Entdeckung bleiben **14 %** übrig. Bei Kandidat A waren es 21 % — beide fallen
auf dieselbe Weise und in derselben Größenordnung.

## Was die Selbstprüfung diesmal zusätzlich sagt

Der Placebo hat bestanden, aber knapp:

```
Placebo (Signal ohne jeden Kursbezug, wahre Antwort null):  +0,1474 Pp
eigene Auflösung:                                            0,2677 Pp
gemessener Überschuss der Bestätigung (V0):                 +0,1843 Pp
```

**Der Nullpunkt der Maschine liegt hier bei +0,147 Pp — und der gemessene Effekt bei
+0,184 Pp.** Beide sind praktisch gleich groß. Das ist kein Fehler: der Placebo bleibt
innerhalb seiner eigenen Auflösung, das Urteil ist nicht gekennzeichnet. Aber es zeigt
schärfer als jede Fehlerbalken-Angabe, warum „nicht entscheidbar" hier das richtige Wort
ist — auf 189 Symbolen rauscht die Maschine in derselben Größenordnung, in der der Effekt
angeblich liegt.

Das ist das erste Mal, dass die Selbstprüfung mehr liefert als bestanden/durchgefallen.

F1 fand keine auffällige Reihe, F4 verlor kein einziges Signal, keine Warnungen.

## Der Engpass ist die Datenmenge, nicht die These

Die ursprüngliche Suche rechnete mit **1.198 Aktien** und sagte eine Auflösung von
≈ 0,26 Pp voraus. Das Terminarchiv der App führt aber nur **189 Symbole** — die Auflösung
liegt deshalb bei 0,40 bzw. 0,46 Pp, also rund 60–80 % schlechter als geplant.

Das war in Abschnitt 6 der Vorregistrierung vorhergesagt, und es ist eingetreten. Wäre die
Auflösung wie geplant bei 0,26 Pp gewesen, läge V0 mit +0,184 Pp immer noch darunter — der
Effekt wäre auch dann nicht durchgekommen. **Mehr Daten hätten dieses Urteil nicht
gedreht**, sie hätten es nur schärfer gemacht: statt „nicht entscheidbar" wäre bei
gleichbleibendem Punktwert womöglich „nicht bestätigt" herausgekommen.

Der Punktwert wandert dabei natürlich mit. Was ein breiteres Terminarchiv wirklich
brächte, ist eine **ehrliche** Antwort statt einer offenen — nicht ein besseres Ergebnis.

## Nachtrag zur Werkzeugkette

Diese Fassung braucht **keine Symbol-Brücke** mehr. Die alte musste sich aus dem ersten
Zeitstempel und zehn frühen Schlusskursen einen Fingerabdruck je Kursreihe bauen und das
Archiv ein zweites Mal einlesen — weil `signal()` das Symbol nicht bekam. Seit heute
bekommt es das (`messmaschine.js`, fünftes Argument).

Genau in jener Brücke ist der ursprüngliche Quelltext abgebrochen. Der längste und
verwickeltste Teil der Datei existierte nur, weil an einer Stelle ein Argument fehlte.

---

## Bilanz der Suche vom 25.08.2026

| | |
|---|---|
| Eingereichte Kandidaten | 16 |
| Vorregistriert | 2 |
| Gemessen | 2 (B als Neubau) |
| **Bestätigt** | **0** |

Beide Kandidaten reproduzieren ihre Entdeckung sauber und verlieren auf der
zurückgehaltenen Hälfte 79 bzw. 86 % ihrer Wirkung. Das Projekt steht weiter bei zwei
validierten Kanten: Momentum und Ergebnis-Drift.
