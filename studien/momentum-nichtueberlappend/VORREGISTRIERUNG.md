# Vorregistrierung: Momentum ohne Überlappung — 25.08.2026

> **Dies ist eine EICHUNG, keine Kandidatenprüfung.** Sie beantwortet die Frage *„war die
> Messanordnung der Grund, warum Momentum tot aussah?"* — und ausdrücklich **nicht**
> *„trägt Momentum?"*. Ein Ja ist kein Beleg für eine Kante.

## 1. Zwei Offenlegungen vorweg, die das Gewicht dieser Studie bestimmen

**Die Bestätigungshälfte ist nicht mehr unberührt.** Die überlappende Messung ist am
24./25.08. bereits darauf gelaufen (Variante 0: +1,160 Pp, se 1,129, t 1,03). Dieser Lauf
ist deshalb **keine Bestätigung**, sondern eine Neuauswertung derselben, schon gesehenen
Daten mit einem anderen Schätzer. Es gibt nichts mehr zu verbrennen — aber auch nichts
mehr zu belegen.

**Das S4-Tor ist gerissen.** Die Hausregel lautet: Entdeckungsüberschuss ≥ 4 ×
Bestätigungs-MDE, sonst wird die Bestätigungshälfte nicht angefasst. Hier:
**3,304 gegen 4 × 1,747 = 6,99 Pp.** Durchgefallen.

Das Tor wird nicht gesenkt und nicht umgangen. Es gilt für **Kandidatenprüfungen** — es
soll verhindern, dass eine unberührte Bestätigungshälfte an einen unterversorgten Test
verschwendet wird. Beides trifft hier nicht zu: Die Hälfte ist bereits gesehen, und
gemessen wird das Messgerät, nicht der Markt. Genau deshalb steht oben „Eichung" und nicht
„Prüfung", und genau deshalb kann aus diesem Lauf **kein Urteil über Momentum** folgen.

## 2. Die Frage

Die bisherige Messung eröffnet an **jedem** Handelstag eine 63-Tage-Position. Über 20 Jahre
sind das 5.038 Beobachtungen — aber jede teilt 62 von 63 Tagen mit ihrer Nachbarin. B10
(Newey-West über 62 Verzögerungen) korrigiert das, und der Standardfehler wächst dabei um
Faktor 6,42: aus t = 4,74 wurde t = 0,74.

Die Frage ist, ob diese Korrektur **zu grob** ist. Newey-West ist eine Näherung; bei sehr
langen Verzögerungen und wenigen effektiven Blöcken ist sie bekannt konservativ. Die
Alternative ist keine andere Statistik, sondern eine andere **Anordnung**: ein Depot, das
auf festem Kalender alle 63 Handelstage umschichtet. Dann sind die Beobachtungen echt
unabhängig — vier im Jahr, über 20 Jahre achtzig — und es braucht gar keine Korrektur.

Genau diese Konstruktion fährt `mfhandel.js` bereits als virtuelles Buch
(`rebalanceFaellig: tage >= 63`, Ziel = stärkste 10 %). Sie ist nie durch die Mühle gegangen.

## 3. Festgelegt, bevor die Bestätigungshälfte angesehen wurde

| | |
|---|---|
| Archiv | `E:/Markt-Dashboard-Archiv/archiv1d` |
| Universum | `WP.istAktie` (CS/ADRC), F1-Plausibilitätsfilter wie in der Maschine |
| Merkmal | Rendite von t−252 bis t−21 (Rückblick 231, Lücke 21) |
| Auswahl | stärkste **10 %** — die Live-Einstellung aus `mfdepot.js` |
| Haltedauer | 63 Handelstage, feste Kalender-Umschichtung |
| Vergleich | Gleichgewichteter Mittelwert **aller** zulässigen Werte derselben Periode |
| Schnitt | 2006-08-14, derselbe wie in der Maschine |

**Die Rasterlage (B9).** 63 Handelstage Abstand heißt 63 mögliche Startphasen; sich eine
auszusuchen wäre ein verdeckter Mehrfachtest. Festgelegt ist **Phase 0** — die erste
Umschichtung liegt auf dem ersten Handelstag, an dem das Merkmal überhaupt gebildet werden
kann (Index 252). Keine Wahl, kein Blick. Die anderen 62 Lagen werden mitgerechnet und als
**Streubild** angezeigt, ausdrücklich nicht als Tests.

## 4. Der Endpunkt

**`g = se(überlappend, Newey-West) / se(nicht überlappend)`**, beide auf der
Bestätigungshälfte, beide auf der Skala *Pp je Umlauf*.

Auf der Entdeckungshälfte ist `g` bereits bekannt: 1,223 / 0,873 = **1,40**. Die unten
festgelegten Schwellen sind **nach** diesem Blick gesetzt — das ist der zweite Grund,
warum diese Studie als Eichung geführt wird.

| | Bedingung |
|---|---|
| **JA** — die Anordnung war das Problem | `g` bei Phase 0 ≥ **1,5** **und** Minimum über alle 63 Lagen ≥ **1,2** |
| **NEIN** — Newey-West hatte recht | Maximum über alle 63 Lagen < **1,3** |
| dazwischen | unentschieden, kein Eintrag in beide Richtungen |

**Testzahl: 1.** `g` ist ein Verhältnis zweier gemessener Standardfehler und hat keine
Nullhypothese. Die 63 Lagen sind beschreibend; wer sie einzeln beurteilte, hätte 63 Tests.

## 5. Was dieser Lauf nicht sagen darf

Der Lauf gibt nebenbei einen Überschuss und ein `t` für die Bestätigungshälfte aus.
**Diese Zahlen sind kein Urteil über Momentum**, aus drei Gründen gleichzeitig:

1. Die Hälfte war schon gesehen.
2. Das S4-Tor ist gerissen.
3. Die Anordnung wurde gewechselt, nachdem die erste Anordnung ein unerwünschtes Ergebnis
   geliefert hatte — das ist der Kern von post-hoc, auch wenn der Wechsel gut begründet ist.

Sie werden berichtet, weil sie zur Eichung gehören: Ein `g` von 1,5 bei gleichzeitig
unverändertem Punktschätzer heißt etwas anderes als ein `g` von 1,5 bei verschobenem.
Der Belegstand von Momentum bleibt **unbelegt**, egal wie dieser Lauf ausgeht.

Sollte `g` groß ausfallen, ist die richtige Folge **nicht** „Momentum trägt doch", sondern:
*Für lange Haltedauern ist die nicht überlappende Anordnung die Messanordnung — und dann
braucht Momentum eine neue, sauber vorregistrierte Prüfung auf Daten, die noch niemand
gesehen hat.* Die einzige solche Hälfte ist die Zukunft.

---

*Geschrieben, bevor `--haelfte=bestaetigung` ausgeführt wurde. Ergebnis in `ERGEBNIS.md`.*
