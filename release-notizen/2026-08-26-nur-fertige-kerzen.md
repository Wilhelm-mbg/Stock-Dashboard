## Das Kursarchiv endet nicht mehr mitten in der Sitzung

Die Kursquelle liefert am Ende jeder Reihe die **laufende** Kerze mit — eine
Momentaufnahme mitten im Handelstag, keine fertige Stunde. Die landete bisher im Archiv,
auf dem alle Messungen rechnen. Betroffen waren **2.841 von 2.917** Reihen.

Das ist keine große Zahl (eine Kerze von rund 5.000), aber sie sitzt immer am jüngsten
Rand — genau dort, wo eine Messung den letzten Handelstag ausliest. Und sie wandert mit
jedem Abruf mit.

Jetzt kommen nur noch fertige Kerzen ins Archiv, und die vorhandenen sind entfernt.

---

### Für die Release-Wache

Issue #85, Fund des nächtlichen Analytikers, erweitert durch eine Messung des Tüftlers
(auch das Tagesarchiv betroffen). Beides selbst nachgemessen, nicht übernommen.

**Eine Regel, eine Stelle** (`fertigeKerze` in `tools/yahoo-60m-holen.js`):

- **Alle Intervalle:** Sekunde ≠ 0 → laufende Kerze. Die Quelle stempelt sie mit der
  Quote-Uhrzeit (16:57:27 statt 16:30); eine Gitterkerze trägt immer Sekunde 0.
- **Tageskerzen:** am Stempel **nicht** erkennbar — nachgemessen, 0 von 400. Sie tragen
  den Sitzungsbeginn und sehen auch als Teiltag normal aus. Fertig sind sie, sobald die
  Sitzung zu ist (`currentTradingPeriod.regular.end`).

**Bewusst nicht „Stempel + Intervall ≤ jetzt“:** Die letzte Sitzungskerze ist kürzer als
eine Stunde (19:30 bis 20:00 UTC) und wäre fälschlich verworfen worden. Eine Zusicherung
hält genau diesen Fall fest.

**Der Haken, den das Issue nicht beschreibt:** Das Zusammenführen vereinigt über den
**Zeitstempel**. `16:57:27` ist ein anderer Schlüssel als `16:30` — eine alte Teilkerze
wäre also nie ersetzt worden, sondern künftig mitten in der Reihe stehengeblieben. Ein
Neuabruf allein heilt das 60-Minuten-Archiv nicht. Deshalb filtert die Zusammenführung
jetzt auch das Vorhandene.

**Tagesarchiv heilt sich selbst:** Dort trägt der Teiltag *denselben* Stempel wie der
volle Tag, und beim Zusammenführen gewinnt die neuere Kerze. Nach dem nächsten Abruf nach
Handelsschluss ist es sauber. Nichts zu löschen — eine Umsatz-Faustregel ist kein Grund,
Daten wegzuwerfen.

**Neues Werkzeug** `tools/archiv-teilkerzen-entfernen.js`: reinigt ein vorhandenes Archiv
ohne Netz, Sekunden statt Stunden. Zählt nur; geschrieben wird erst mit `--wirklich`.
Bereits gelaufen — 2.841 Teilkerzen entfernt, Gegenprobe zeigt null.

Vor dem Löschen geprüft, ob dabei echte Stunden verlorengehen: 288 von 292 Teilkerzen
standen **zusätzlich** neben der richtigen Gitterkerze derselben Stunde. Die vier übrigen
betrafen Stunden, für die noch gar keine fertige Kerze existierte — auch dort war die
Teilkerze keine gültige Kerze, sondern eine Momentaufnahme.

**#85 ist damit als Vorstufe der Neumessung erledigt.** Es bleiben #86, #87, #88.
