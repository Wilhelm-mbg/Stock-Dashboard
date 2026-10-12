# Vorrat der Prüfstraße

Kandidaten, die eine Bewertung ohne Tagestopf brauchen (Auftrag Nr. 118: `bewertung: "zeit"` = Überschuss gegen den Topf aller Tage
derselben Reihe, Cluster je Kalendertag); erst nach Nr. 118 in die Warteschlange.

Warum: der Tag-Adapter (`pruefstrasse/adapter/tag.js`, FORM.md §3) bewertet jeden Trade gegen den Topf **aller Reihen desselben Tages**
(gleiche Klasse, Dauer, Lebend-Status). Eine marktweite Kalenderregel signalisiert an einem Tag alle Reihen — Signalmenge = Topf,
Überschuss exakt null, Urteil „nein" ohne Aussage über den Kalendereffekt. Der Läufer liest diesen Ordner nicht (`--naechster`, `--pruefen`
und `--kandidat` kennen nur `warteschlange/`); `node pruefstrasse/vorrat/<kennung>/test.js` läuft hier wie gewohnt.

| Kennung | Form | Bewertung | Herkunft | Stand |
|---|---|---|---|---|
| `monatswende-long` | tag | zeit | Nr. 117 (12.10.2026), `--pruefen` grün in der Warteschlange, Siegel 1 `02d4ac5`, dann hierher verschoben | wartet auf Nr. 118 |
| `vor-fomc-long` | tag | zeit | Nr. 117 (12.10.2026), `--pruefen` grün in der Warteschlange, Siegel 1 `5aeea61`, dann hierher verschoben | wartet auf Nr. 118 |

Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
