# Studie #33 – Felix' Winkel-Detektor, Neubewertung (22.08.2026)

Nachrechenbarer Beleg zum Kommentar in Issue #33.

| Datei | Inhalt |
|---|---|
| `original-21-08.js` | Die Originalstudie vom 21.08. auf 7 Tagen Yahoo-1m (13.–21.08.). Bucket-Auswahl. |
| `hauptstudie.js` | Neubewertung auf 88 Werten, 62 Handelstagen. Detektor zeilengleich, Kontrolle je Symbol × Tageszeit-Versatz, leave-one-day-out. 16 Buckets, Bonferroni. |
| `zusatzpruefungen.js` | Out-of-Sample (55 neue Tage), alte vs. neue Kontrolle, Vertrauensbereich, Marktneutralität (Tages-Beta), Hälften, Einstieg eine Kerze später. |
| `ergebnis-16-buckets.json` | Rohergebnis der Hauptstudie. |

Beide Skripte lesen das Kursarchiv aus `%APPDATA%/markt-dashboard/store/` und brauchen
`quant.js` aus dem Repo-Wurzelverzeichnis. Aufruf: `node studien/33-winkel-detektor/hauptstudie.js`.

**Ergebnis in einem Satz:** Die +0,25 Pp von damals sind widerlegt (OOS +0,074); ein kleiner
echter Effekt ist wahrscheinlich (marktneutral 0,103 Pp, t über Tage 1,69), aber nicht belegt;
ob er über die Kosten kommt, ist mit diesem Aufbau nicht entscheidbar.

**Vor dem Posten von der Gegenprüfung gefunden und korrigiert:** Auswahlmenge in der
Bestätigungsmenge (7 der 62 Tage), Permutationstest mit iid-Null (p=0,001 war der naive
t-Wert im Kostüm), überlaufender Zufallsgenerator, Power-Versprechen ohne Rechnung.
Details in der Projekt-Checkliste.
