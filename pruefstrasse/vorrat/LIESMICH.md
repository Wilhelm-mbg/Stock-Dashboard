# Vorrat der Prüfstraße

Ablage für Kandidaten, die der Läufer **noch nicht** messen soll, weil ihnen ein Stück Messgerät fehlt — der Läufer liest diesen Ordner
nicht (`--naechster`, `--pruefen` und `--kandidat` kennen nur `warteschlange/`); `node pruefstrasse/vorrat/<kennung>/test.js` läuft hier
wie gewohnt. Ist das Messgerät geliefert, wandert der Kandidat per `git mv` zurück in die Warteschlange (eigener Commit, dann `--pruefen`).

**Erster Anlass (Nr. 117 → Nr. 118):** der Tag-Adapter (`pruefstrasse/adapter/tag.js`, FORM.md §3) bewertete jeden Trade gegen den Topf
**aller Reihen desselben Tages** (gleiche Klasse, Dauer, Lebend-Status). Eine marktweite Kalenderregel signalisiert an einem Tag alle Reihen —
Signalmenge = Topf, Überschuss exakt null, Urteil „nein" ohne Aussage über den Kalendereffekt (Fehlerform „Tagestopf löscht marktweite
Effekte"). Seit Nr. 118 (12.10.2026) gibt es dafür `bewertung: "zeit"` (zeitlicher Topf je Reihe und Zeitraum ohne Signalfenster, FORM.md §3).

| Kennung | Form | Bewertung | Herkunft | Stand |
|---|---|---|---|---|
| `monatswende-long` | tag | zeit | Nr. 117 (12.10.2026), Siegel 1 `02d4ac5`, dann hierher | **zurück in der Warteschlange** seit Nr. 118 (12.10.2026), `--pruefen` grün |
| `vor-fomc-long` | tag | zeit | Nr. 117 (12.10.2026), Siegel 1 `5aeea61`, dann hierher | **zurück in der Warteschlange** seit Nr. 118 (12.10.2026), `--pruefen` grün |

Der Ordner ist damit leer und bleibt als Ablage für den nächsten Fall bestehen. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
