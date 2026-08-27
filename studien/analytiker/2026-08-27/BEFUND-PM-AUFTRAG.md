# Analytiker — PM-Auftrag 27.08.2026 (~09:00): zwei Nachzählungen

Auftraggeber: Projekt-Manager (`markt-dashboard-f5`). Beide Aufgaben sind reine
Zählungen; nichts wurde repariert, kein Archiv geschrieben. Werkzeuge hier im Ordner:
`zaehle-2508.js`, `zaehle-2508-gegen-1d.js`, `halbtage-c-anteil.js`.
Archivstand: beide Archive frisch (Wachhund Rückstand 0; 60m neu geschrieben 01:58,
1d 03:34). Kerzenformat `[zeit, schluss, umsatz, hoch, tief, eroeffnung]`
(kerzenquelle.js:15 — Achtung, Index 1 ist der SCHLUSS, nicht die Eröffnung).

---

## 1. Datenfund 2: Stimmt der 25.08. im neu geschriebenen 60m-Archiv jetzt? — JA, mit einer benannten Restgestalt

**Beanstandet war:** (a) 2.839 von 2.885 Reihen trugen eine 20:00Z-Kerze (Umsatz 0,
Kurs = eingefrorener 19:30-Quote-Stand); (b) die 19:30-Kerze selbst war unfertig
eingefroren (AAPL archiviert v 2.851.594 / c 309,8999 gegen Quelle v 2.846.819 /
c 309,8299).

**Gezählt (2.916 Reihen inkl. `etf/`, 2.910 mit Kerzen am 25.08.):**

| Frage | Ergebnis |
|---|---|
| 19:30-Kerze konsolidiert? | **Ja.** AAPL trägt jetzt exakt die im Datenfund dokumentierten Quellwerte: c 309,8299 / v 2.846.819. Der eingefrorene Stand ist weg. |
| 20:00Z-Kerze noch da? | **Ja, in 2.870 von 2.910** (40 ohne), alle Umsatz 0, flach. `zusammenfuehren()` löscht nie — erwartungsgemäß. |
| Ist ihr Kurs falsch? | **Nein.** Gegen den 1d-Tagesbalken (2.833 vergleichbar): **99,33 % exakt gleich dem amtlichen Tagesschluss**, 99,89 % innerhalb 0,1 %; Abweichung p50 und p90 = 0,0000 %. Die 20:00-Kerze IST der amtliche Schlusskurs — konsistent mit dem Nacht-Befund zur 20:00-Kerze. |
| Wer trifft den Tagesschluss besser? | 20:00 in 2.146 Fällen näher, 19:30 in **2**, gleich 685. Die 19:30 trifft exakt nur zu 24,1 % (letzter Handel vor der Auktion). |
| Alter Einfrier-Verdacht (20:00 == 19:30)? | Nur noch 689 Fälle — und das sind jetzt schlicht Tage, an denen letzter Handel = Auktionspreis. |

**Urteil: Der beanstandete Zustand existiert nicht mehr.** Die 19:30 ist neu und
konsolidiert, die stehengebliebene 20:00-Kerze trägt den amtlichen Schlusskurs — sie
ist eine Umsatz-0-Kerze, die die Quelle nicht mehr liefert, aber **inhaltlich korrekt**.
„Der ganze 25.08. neu zu holen" hat sich durchs Neuschreiben erledigt.

**Einschränkungen, ehrlich:**
- Für die **Intraday-Umsätze** je Stunde gibt es keinen zweiten Zeugen; belegt ist die
  Konsolidierung am AAPL-Beispiel (exakter Treffer aller drei dokumentierten Zahlen)
  plus dem flächigen 1d-Schluss-Abgleich. Wer mehr will, braucht einen Abrufvergleich
  (~20 Symbole) — den habe ich als reine Zähl-Rolle nicht gemacht.
- **Ausreißer im Abgleich:** WHLR weicht um Faktor **exakt 4,0** ab — das 60m-Archiv ist
  rückangepasst, das 1d springt erst am 26.08. auf die neue Skala (1,466 → 0,399).
  **Das ist die bekannte Familie RGR/SITC/B** (ein Archiv angepasst, das andere nicht),
  WHLR gehört auf diese Liste. Danach HAIN 0,46 %, alles Übrige ≤ 0,18 %.
- Der 26.08. trägt die 20:00-Kerze ebenfalls (2.885 von 2.910) — die Gestalt „jüngste
  Tage tragen den Auktionsstempel" bleibt bestehen und ist kein Fehler.

## 2. Der 9–12-%-C-Anteil an Halbtagen — **Nullbefund, die Vermutung stimmt** *(unabhängige Replikation)*

**Einordnung nach Abschluss der Zählung:** Die QS (`ab`) hat um 08:18 denselben Schluss
über den Mechanismus gezogen (Commit `ced319c`: Halbtagsschluss 13:00 ET = 18:00:00 UTC,
die Schlussauktion fällt in den 18:00-Eimer). Meine Zählung entstand unabhängig davon
und bestätigt die Aussage **flächig über die gesamte Population** (alle 2.878 Reihen,
20.101 Halbtags-Zellen, alle fünf Toleranzstufen) statt über Mechanismus + Stichprobe.
Zwei Wege, ein Ergebnis — das ist der Wert dieser Doppelung.

**Frage:** An Halbtagen passt der Tagesbalken zu 9–12 % erst mit Nachhandel (C).
Vermutung (bis jetzt ungemessen): das ist die fehlende letzte Sitzungshalbstunde,
deren Extreme in der auf den Sitzungsschluss gestempelten Auktionskerze liegen.

**Methode:** Exakt die Klassifikation von `schiedsrichter-test.js` (gleiche Halbtage,
gleiche Toleranz-Leiter), mit einem zusätzlichen Aggregat **D = Sitzung + Randkerze +
die exakt auf den Sitzungsschluss gestempelte Kerze** (17:00Z Sommer / 18:00Z Winter).
Reihenfolge A → B → D → C → keins. 2.878 Reihen, 20.101 Halbtags-Zellen.

| Toleranz | A | B | **D (neu)** | **C** | keins |
|---|---|---|---|---|---|
| exakt | 38,13 | 0,18 | **8,91** | **0,00** | 52,78 |
| 1e-5 | 42,88 | 0,21 | **9,92** | **0,00** | 46,98 |
| 1e-4 | 52,68 | 0,25 | **11,83** | **0,00** | 35,24 |
| 1e-3 | 74,85 | 0,10 | **12,07** | **0,00** | 12,98 |

**C fällt auf 0,00 % — auf JEDER Stufe der Leiter.** Der gesamte frühere C-Anteil ist
die Schluss-Auktionskerze, nicht der Nachhandel. Kein einziger Halbtags-Fall braucht
echte Nachhandelskerzen.

**Positivkontrolle (Hausregel):** Die D-Spalte reproduziert die C-Spalte des QS-Laufs
zahlengenau über alle fünf Stufen (8,91 / 9,16 / 9,92 / 11,83 / 12,07 gegen QS
8,9 / 9,2 / 9,9 / 11,8 / 12,1) — das Werkzeug misst dieselbe Population wie das der
QS und feuert exakt dort, wo es feuern muss.

**Nebenbefund, eingeordnet:** Das erhöhte „keins" an Halbtagen (35,2 % bei 1e-4 gegen
19,5 % an Normaltagen) schrumpft durch D **nicht** — konsistent mit der bekannten
Lücke: bei einem Teil der Reihen ist die letzte Sitzungshalbstunde nirgends enthalten
(die Auktionskerze ist flach und trägt nur den Schlusskurs, nicht die Extreme der
Halbstunde). Fehlende Daten, keine Fehlklassifikation — dieselbe Wurzel, andere
Erscheinung. Je-Halbtag-Aufschlüsselung in `halbtage-c-anteil.js`-Ausgabe.

**→ Für den Schiedsrichter heißt das:** „Tagesbalken führt den Nachhandel mit" ist
jetzt auch an Halbtagen widerlegt. Das Urteil „außerhalb der Tagesspanne = außerhalb
der Sitzung" gilt uneingeschränkt; Option (c) bleibt tot.
