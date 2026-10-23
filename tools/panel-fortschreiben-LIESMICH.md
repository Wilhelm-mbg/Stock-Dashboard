# Panel-Fortschreibung (Auftrag Nr. 123)

Verlängert das Kurspanel der Prüfstraße (`studien/querschnitt-pruefstand-2026-09-13/voll-v23c`, v2.3 Bau 2c, Ende 2026-09-15)
monatlich um die neuen Handelstage. Ergebnis je Lauf: ein **neuer** Ordner `voll-v23f-YYYY-MM/` (Monat des Deckels), git-ignoriert.
`voll-v23c` bleibt unverändert und ist der Ordner der Eichung (`pruefstrasse/konfig.json` `panelEichung`).

## Werkzeuge

| Datei | Zweck |
|---|---|
| `tools/panel-fortschreiben.js` | `--trocken` (rechnen, prüfen, Bericht), `--schreiben` (nur nach gleichem Trockenlauf), `--pruefen-ordner <ordner>` |
| `tools/panel-fortschreiben-massnahmen.js` | Maßnahmen-Nachtrag nur für die lebenden Panel-Reihen → `E:/…/alpaca-massnahmen-nachtrag-YYYY-MM/` |
| `tools/panel-fortschreiben-spiegel.sh` | tar über ssh auf den Rechenknecht in einen **neuen** Ordner, SHA-256 beidseitig, dann `mv` |
| `tools/panel-fortschreiben.cmd` | Kette 1–4 für die Aufgabenplanung (holt den Zugang aus dem Benutzerprofil, nie ins Log) |
| `tools/panel-fortschreiben-aufgabe.xml` | Aufgabe „Markt-Dashboard Panel-Fortschreibung“, 2.–6. des Monats 07:00, **deaktiviert** |
| `tools/nyse-kalender.js` | Handelskalender aus der NYSE-Regel (Rule 7.2) ab 2027, geprüft = Alpaca-Kalender 2016–2026 |
| `tools/panel-fortschreiben.test.js` | Kunsttests (Mini-Archiv, Stamm mit dem Originalweg gebaut) |

Berichte: `Markt-Dashboard-Daten/panel-fortschreibung/trocken-<deckel>.json`, `schreiben-<deckel>.json`, `lauf.log`.

## Ablauf eines Laufs

1. **Vorbedingungen:** Stamm-Kennung `…/panel/v2.3`; Kalender des Stamms = Anfangsstück des Kalenders; Minuten-Manifest reicht über den
   Deckel und wurde nach Börsenschluss des Deckeltags geschrieben (sonst Rückgabe 2, morgen wieder). Deckel = letzter Handelstag des Vormonats
   (bezogen auf den Manifest-Stand) oder `--monat`/`--bis`. Stamm = jüngster `voll-v23f-*`, sonst `voll-v23c`.
2. **Lesen:** je lebender Reihe die Rohdateien `alpaca1m/<ORD>/<jahr>.json` ab dem Jahr des Stamm-Endes, mit `lesen-panel.js ladeJahr`
   unverändert (nur in diesem Prozess: bereinigte Kopien abgeschaltet, Fenster bis 2035). Immer **roh**: die Kopien enden 03.09./04.10.2026.
3. **Wiedergabe-Probe:** jede Stamm-Zeile desselben Jahres wird aus der Rohdatei nachgerechnet (Schluss, Eröffnung, Kerzen, Umsätze,
   Tagesmarken). Abweichung in den letzten 60 Zeilen einer Reihe = Befund (die Reihe würde sonst mit einem anderen Umsatzfenster weiterlaufen).
4. **Neue Zeilen** wie `paneldaten.js zeilenAus`: Schluss = Eröffnung der 16:00-Kerze, Klasse = Median-Umsatz der 60 Vortage (≥ 40), Marken.
5. **Faktor vorwärts verankert** (Entscheid PM 23.10.2026): für den letzten Stamm-Tag L der Reihe mit Faktor `faktor_L`
   ```
   faktor_t = faktor_L × Π (1 / f_s)   über die angenommenen eigenen Splits s mit L < ex_s ≤ t,   f_s = new_rate / old_rate
   bereinigt_t = roh_t / faktor_t        rendite_t = 100 × (bereinigt_t / bereinigt_(t-1) − 1)
   ```
   Alte Zeilen behalten ihren Faktor; `roh` bleibt roh; die bereinigte Reihe ist am Split stetig (Kunsttest: 2:1 → faktor 1 → 0,5,
   Rendite am Ex-Tag +0,2 % statt −50 %). Ein Split gilt nur mit Sprung in der Rohreihe (Split-Sperre `paneldaten.js splitSperre`).
   Quellen: `alpaca-massnahmen/` + alle `alpaca-massnahmen-nachtrag-*/` (+ `_angekuendigt.json`).
6. **lebend/Abgang:** lebend bleibt, wessen letzter Minutentag höchstens 10 Handelstage vor dem Deckel liegt (Regel `lebenszeit-minuten.js`);
   sonst `lebend 0`, `ende_datum` = letzte Zeile, `ende_grund` = jüngste Ende-Maßnahme (cash_mergers, stock_mergers, …, name_changes) oder `verstummt`.
7. **Blöcke:** Jahre vor dem Jahr des Stamm-Endes werden **byte-gleich kopiert** (SHA-256 nach dem Kopieren geprüft). Im laufenden Jahr bleiben
   alle alten Zeilen gleich bis auf zwei gezählte Marken: LETZTER_TAG am alten Ende fällt weg, MASSNAHME_NAH aus Maßnahmen nach dem Stamm-Ende
   kommt dazu (±10 Handelstage). Neue Zeilen hängen in Ordnung (tag, sym) an. Blockköpfe in derselben Form (`kennung, n, spalten, jahr`).
8. **Stand:** Kennung bleibt `querschnitt-pruefstand-2026-09-13/panel/v2.3`; `bau` = `v2.3+YYYY-MM`; `stand` = Manifest-Stand (deterministisch);
   `tage` bis zum 31.12. des Deckeljahres (Kalender der Quelle, danach NYSE-Regel); Feld `fortschreibung` (Stamm, Deckel, Faktorregel,
   Prüfsummen je Block, Kette). Laufzeit und Uhrzeit nur in `_lauf.json`.
9. **Kontrollen (Befund = nichts geschrieben):** Zeilen je neuem Tag ≥ 80 % (Stamm-Ende minus Abgänge) und letzter voller Tag = Deckel;
   Klassenverteilung neu vs. 20 Tage davor ≤ 3 Pp; SPY gegen `archiv1d/etf/bars_1d_SPY.json` (Yahoo) Median ≤ 0,02 Pp, Max ≤ 0,3 Pp;
   Vorgänger-Doppel (≥ 5 neue Tage mit gleichem Schluss und Kerzenzahl); Nachleben (Zeilen > 5 Handelstage nach einer Ende-Maßnahme);
   Wiedergabe; Dateifehler. Trefferlisten ohne Abbruch: abgelehnte Splits, |Rendite| > 40 %, Splits kurz vor dem Stamm-Ende, die der Stamm nicht kannte.
10. **Zweiter Lauf gleich:** `--schreiben` rechnet neu und schreibt nur, wenn der Trockenlauf zum selben Deckel dieselben Prüfsummen hatte.
    Liegt der Zielordner schon: gleiche Prüfsummen → 0, andere → 1 (nie überschrieben).

## Prüfstraße

`pruefstrasse/konfig.json`: `panel` (Kandidaten, Zählung, Prüfzeit, `--vorwaerts`) und `panelEichung` (gesperrte Tafel: Kalibrierung,
`--eichung`, Kunsttests am Eichfenster; bleibt `voll-v23c`). `--pruefen` nennt beide Ordner mit Kennung, `bau` und letztem vollem Tag;
Eichung, Vorwärts-Log und Ergebnis nennen `bau`. **Umschalten** nur durch den PM: `panel` auf `studien/querschnitt-pruefstand-2026-09-13/voll-v23f-YYYY-MM`,
Commit, Push main (der Server holt origin im Nachtlauf). Rückweg: `panel` zurück auf `voll-v23c` bzw. den Vormonat.

## Grenzen

- Universum wächst nicht: das Minutenarchiv führt keine neuen Werte (Stand Phase 1: 0 Ordner mit erstem Balken nach 15.09.).
- Sonderschließungen (Staatstrauer) sind nicht vorhersagbar: nach der Ankündigung in `tools/nyse-kalender.js SONDER` eintragen.
- Ende-Gründe aus Maßnahmen, nicht aus der Gründe-Tafel (EDGAR); `verstummt` zählt in der Prüfstraße als Gruppe `sonstige`.
- Splits, die zwischen Stand des Maßnahmen-Ordners (03.09.) und Stamm-Ende lagen und dem Stamm fehlten, werden gemeldet, nicht nachgetragen.
