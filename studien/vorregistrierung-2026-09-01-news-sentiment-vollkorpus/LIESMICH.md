# Was in diesem Ordner liegt

- `VORREGISTRIERUNG.md` — vor jedem Ertragsblick geschrieben.
- `ERGEBNIS.md` — das Urteil.
- `universum-und-machbarkeit.js` → `universum.json` — Auswahlregel und Machbarkeit.
- `korpus-holen.js` → `korpus/` — Schlagzeilen ab 2017-04-10, **nicht committet**
  (rund 20 MB, jederzeit neu holbar; das Skript nimmt fertige Symbole wieder auf).
- `messe-vollkorpus.js` → `lauf.json` — die Messung. Braucht kein Netz.

Reihenfolge: `universum-und-machbarkeit.js` → `korpus-holen.js` → `messe-vollkorpus.js`.
Der Schluessel steht nur im Authorization-Header, nie in einer URL.
