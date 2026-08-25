# Stufe 0 — was ohne eine einzige neue Messung herauskam

Neun Punkte aus [PLAN-NAECHSTE-STUDIEN.md](PLAN-NAECHSTE-STUDIEN.md), erledigt am
25.08.2026. Keiner brauchte eine Vorregistrierung: es wird kein Urteil über den Markt
gefällt, sondern eine Rechenzeile oder ein Buchungsfehler berichtigt. Drei davon haben
Befunde geliefert, die größer sind als alles, was die letzten zwei Tage an Messungen
ergeben haben.

---

## S1 — Das Projekt hat null belegte Kanten

Erledigt und ausführlich in [ERGEBNIS-monatswende-breit.md](vorregistrierung-2026-08-25/ERGEBNIS-monatswende-breit.md)
dokumentiert. Kurz: Momentum steht seit dem 24.08. auf *nicht entscheidbar* (B10:
Newey-West über 63 überlappende Kerzen, t 4,74 → 0,74), die Ergebnis-Drift ebenso
(Zeitzonen-Fehler, im zurückgehaltenen Zeitraum t 1,7–2,0). **Nicht widerlegt, aber
unbelegt.** Korrigiert an vier Stellen; der Stand steht jetzt in `CLAUDE.md`, damit ihn
keine Sitzung wieder aus Prosa zusammenreimt.

## S2 — `delta80`: was jeder Lauf überhaupt hätte sehen können

Die Maschine schrieb bisher nur die **MDE** (2 × se). Die beantwortet die Frage *„ist das
noch Rauschen?"*. Sie beantwortet **nicht** die Frage, die vor einer Messung zählt:
*„hätte ich einen echten Effekt dieser Größe überhaupt gefunden?"* Dafür gilt

```
delta80 = (Bonferroni-Schwelle + 0,8416) × se
```

— der kleinste wahre Effekt, den der Lauf mit 80 % Wahrscheinlichkeit über die Schwelle
gebracht hätte. Er ist **immer größer als die MDE**. Wer die MDE für die Nachweisgrenze
hält, überschätzt systematisch, was seine Messung leisten kann.

Steht ab sofort in jeder Urteilszeile. Rückwirkend über die 38 vorhandenen Varianten
(`node tools/delta80-bericht.js`, liest nur, ändert kein Protokoll):

| | |
|---|---|
| Median `delta80` | **0,605 Pp** |
| Spanne | 0,035 bis 4,905 Pp |

**Wie viele Läufe waren für ihre Handelsklasse überhaupt nicht blind?**

| Handelsklasse | Hürde je Umlauf | Varianten, die eine solche Kante gefunden hätten |
|---|---|---|
| Aktie | 0,04 Pp | **2 von 38** |
| Schein ATM | 0,05 Pp | **3 von 38** |
| CFD | 0,10 Pp | **4 von 38** |
| Standard-Schein | 0,23 Pp | 12 von 38 |

Das ist der eigentliche Befund des Archivs. **Vierunddreißig von achtunddreißig Messungen
konnten eine CFD-handelbare Kante gar nicht finden** — unabhängig davon, was sie gemessen
haben. Ihr „nicht entscheidbar" war kein Ergebnis über den Markt, sondern über die
Datenmenge.

## S3 — Die Kostenanzeige war doppelt gezählt (C5)

`depot.js` meldete die notierte Spanne als `spreadPct × 200`, während `spannenBilanz()`
dasselbe Feld mit `× 100` gegen die 0,10-%-Annahme hält. Beides kann nicht stimmen.

Aufgelöst am Code: `aufKosten` und `zuKosten` werden **beide gegen `mid`** gemessen, jede
Seite kostet also die halbe Spanne und `runde` ist der volle Umlauf. `spreadPct =
(offer − bid)/mid` ist ebenfalls schon der volle Umlauf. Richtig ist **× 100**; mit × 200
stand die notierte Spanne doppelt so hoch wie der gemessene Umlauf, und die Anzeige „Rest
ist Schlupf" wurde regelmäßig negativ.

**Die Hürde bleibt bei 0,10 %.** `spannenBilanz()` rechnete von jeher richtig, und für das
tatsächliche Archivuniversum zeigen die eigenen Ablehnungen in die Gegenrichtung
(`leerbuch-tageskerzen`: Roll-Schätzer ~0,93 Pp je Umlauf; `innertags-abgabedruck`:
3,97 Pp Mindest-Tick). Korrigiert wurde eine **Anzeige**, nicht die Hürde.

## S4 / S5 — Zwei Tore vor dem Bestätigungslauf

Stehen in `CLAUDE.md`. Beide kosten nichts, beide hätten die zwei Kandidaten vom 25.08.
**ohne eine einzige Messung** gekippt:

| | Entdeckung | 4 × Bestätigungs-MDE nötig | |
|---|---|---|---|
| `monatswende-breit` | 0,695 Pp | 1,45 Pp | abgelehnt |
| `quartalsschub-betrag` | 1,289 Pp | 1,59 Pp | abgelehnt |

Das funktioniert, weil die Bestätigungs-MDE **vorher feststeht** — sie hängt nur an
Signaltagen und Streuung, nicht am Ergebnis. Wer sie erst nach dem Lauf ansieht, hat die
zurückgehaltene Hälfte für nichts verbraucht.

Tor 2: `delta80` muss unter der Produkthürde der Handelsklasse liegen. Praktische Folge bei
2,8 Pp Tagesstreuung — Kalendersignale mit unter 1.000 Bestätigungs-**Signaltagen** sind
strukturell nicht bestätigbar. Das schließt die ganze Monatswende-/Quartals-Familie aus.

## S6 — Abnutzung oder Auswahl? Erledigt ohne Messung

Die 38 vorhandenen Paare (Entdeckung → Bestätigung), aufgeteilt danach, ob die Strategie
**auf der Entdeckungshälfte ausgesucht** wurde:

| | n | fällt | Mittel (E − B) |
|---|---|---|---|
| ausgesucht (`monatswende`, `quartalsschub`, `momentum`) | 8 | **8 von 8** | **+0,97 Pp** |
| nicht ausgesucht (`kapitulation`, `rsi2seit`, `t1`, `t2`, `t3`, `monatsende-kauf`) | 30 | 7 von 30 | **−0,33 Pp** |

Eine Kalender**abnutzung** müsste in beiden Gruppen auftauchen. In der zweiten Gruppe ist
die jüngere Hälfte im Schnitt sogar *besser*. Das ist die Signatur von **Auswahl**, nicht
von Abnutzung — und damit ist die Frage beantwortet, ohne dass ein Raster gelaufen wäre.

Nachtrag zur eigenen Vermutung: Im Befund zu `monatswende-breit` steht, die naheliegende
Erklärung sei Abnutzung („der Monatswende-Effekt steht seit den 1990ern in der Literatur").
Diese Auszählung sagt etwas anderes. Die Vermutung war als Vermutung gekennzeichnet; jetzt
ist sie gemessen und trägt nicht.

## S7 — Der Placebo läuft jetzt auf beiden Hälften

`placeboLauf()` hatte `if (hf !== 'bestaetigung') continue`. Damit gab es für die
Entdeckungshälfte **keinen geprüften Nullpunkt** — und genau von dort stammen die Zahlen,
auf die Kandidaten vorregistriert werden. Beide Kandidaten vom 25.08. sind auf
Entdeckungszahlen angemeldet worden, deren Nullpunkt nie geprüft war.

Erster Lauf mit beiden: `quartalsschub-betrag` Entdeckung **+0,0369 Pp** bei einer
Auflösung von 0,2824 Pp — besteht.

## S8 — Studienläufe veröffentlichen sich nicht mehr selbst

Ohne `MESSMASCHINE_PROTOKOLLE` legt `messen.js` eine Kopie in den Datenordner. Von dort
liest die App, und `depot.js` wählt daraus die Variante mit dem **größten** Bestätigungs-t.
Ein Mehrvarianten-Lauf veröffentlicht damit von selbst sein Maximum als gemessene Kante.
Die Sperre steht jetzt als Pflichtaufruf in `CLAUDE.md` — in der Umgebung, nicht im Vorsatz.

## S9 — Zwei Pflichtzeilen, und die erste hat sofort etwas gefunden

Jede Messung protokolliert ab sofort:

1. **Die Einstiegslücke** — `(Eröffnung[i+1] / Schluss[i] − 1)` auf den Signalkerzen,
   zentriert gegen dieselbe Größe über alle Kerzen derselben Symbole.
2. **Die Verteilung der Signale über die Sitzungspositionen.**

Die Maschine steigt zum **Schluss der Signalkerze** ein. Sitzt der Ertrag in der Lücke
danach, ist er nicht handelbar — man kann nicht zu einem Kurs kaufen, den es erst nach dem
Kauf gibt.

**Erster Lauf, `quartalsschub-betrag`:**

| Variante | Lücke (zentriert) | Bestätigungsüberschuss | Anteil |
|---|---|---|---|
| V0 | +0,1958 Pp | +0,1843 Pp | **106 %** |
| V1 | +0,1807 Pp | +0,1621 Pp | **111 %** |

**Der gesamte gemessene Effekt sitzt in der Lücke — und mehr als das.** Das ist exakt das
Muster, an dem `leerbuch-umkehr` in derselben Suche gescheitert ist (102–107 %), nur wurde
es dort von Hand gefunden und hier von der Maschine gemeldet. Es erklärt den Befund ohne
jeden Marktmechanismus: `quartalsschub-betrag` kauft die Meldungslücke nicht, es **ist**
die Meldungslücke.

Beide Signale feuern zu 100 % auf Sitzungsposition 0 — die erste Kerze des Tages, also
genau die Position, deren „Folgerendite" die Übernachtbewegung enthält.

---

## Ein Fehler, den ein alter Wachhund gefangen hat

Die erste Fassung der Lücken-Basis mittelte ab Kerze 0, während das Signal erst ab
`vorlauf` feuern kann — ein Vergleich gegen Kerzen, auf denen das Signal gar nicht
auftreten kann, und die frühen Kerzen einer Reihe sind gerade die unruhigsten. Der
**bestehende A9-Wachhund** („jede Kerzenschleife der Maschine startet bei `vorlauf`") hat
das im selben Lauf gemeldet, in dem ich ihn geschrieben habe.

Das ist der Zweck solcher Regeln: Sie fangen den, der sie aufgestellt hat.

---

## Bilanz

Ohne eine einzige neue Messung:

- Der Belegstand des Projekts ist von „zwei validierte Kanten" auf **null** korrigiert.
- **34 von 38** bisherigen Messungen sind als für ihre Handelsklasse blind ausgewiesen.
- Der stärkste verbliebene Kandidat ist als **Lückeneffekt** entlarvt (106 % / 111 %).
- Die Abnutzungsfrage ist beantwortet: **Auswahl**, nicht Abnutzung.
- Zwei Tore verhindern künftig genau die zwei Läufe, die heute umsonst waren.
- Ein Rechenfehler in der Kostenanzeige ist behoben, ohne die Hürde anzufassen.

Damit ist Rang 1 des Plans (**Querschnitts-Kontrolle**) noch dringlicher als vorher: Sie ist
die einzige Studie, die an der Auflösungswand etwas ändern kann — und die Wand ist nach
dieser Auszählung härter, als sie im Plan stand.
