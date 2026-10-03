# Bau-Stand Panel v2.2 (Auftrag Nr. 67)

*Wer hier liest, weil die Sitzung des Werkzeug-Chats tot ist: der Bau läuft ohne sie weiter. Unten steht, wie man den Stand
abliest, fortsetzt und Vereinen und Prüfung von Hand startet. Alle Befehle aus dem Ordner
`studien/querschnitt-pruefstand-2026-09-13/`; `voll/` (v2.1) wird von keinem dieser Befehle angefasst.*

## Start

- **Gestartet:** 03.10.2026 **20:40:44** über `panelbau-v22-start.ps1` (`Win32_Process.Create`, außerhalb des Sitzungsbaums, ohne
  Fenster). Commit des Umbaus davor: `f7017cc`.
- **Teile:** 4 Bau-Prozesse (`--teil 0/4` … `3/4`, je `--max-old-space-size=4096`, je 1.869–1.870 Einträge der Symboltabelle) und
  ein Nachlauf (`panelbau-v22.cmd nachlauf 4`: wartet auf die vier `_teil.json`, vereint, fährt die Kernprüfung). Der Nachlauf
  rechnet erst, wenn die vier Teile fertig sind — nie mehr als vier Bau-Prozesse gleichzeitig.
- **Warum 4 Teile in einer Welle:** v2.1 lief in 6 Teilen zu je rund 57 Minuten (3.331–3.425 s je Teil, zusammen 20.333
  Prozess-Sekunden für 122 GB und 45.107 Jahresdateien; `voll/teil-k/_teil.json`). Auf vier Prozesse verteilt sind das mindestens
  **85 Minuten**. Heute Nacht lesen die vier Prozesse der Kapitulations-Messung (Nr. 68) dieselbe Platte, darum Erwartung
  **1,5 bis 2,5 Stunden**: Ende der Teile **zwischen 22:15 und 23:15**, danach Vereinen und Kernprüfung etwa 3 Minuten. Acht Teile
  in zwei Wellen brächten nichts — die Summe bleibt, und die zweite Welle bräuchte jemanden, der sie startet.
- **PATH** wird in `panelbau-v22.cmd` erzwungen (`C:\Program Files\nodejs;C:\Windows\System32;C:\Windows`), die node-Version
  geprüft (v24.18.0, sonst Rückgabewert 9 und eine Zeile in `voll-v22\log\teil-<k>.err`).
- **Deckel:** der Bau endet am **2026-09-15** (Stand von v2.1 und der Lücken-Liste). Das Archiv auf E: ist seit dem v2.1-Bau um
  13 Handelstage gewachsen (2026er Dateien am 03.10. fortgeschrieben, Probe an AAPL und SN: 26 Zeilen nur im ungedeckelten Bau,
  `LETZTER_TAG` wandert); ohne Deckel wäre v2.2 nicht mehr Zeile für Zeile mit v2.1 vergleichbar.

## Stand ablesen

```
type voll-v22\teil-0\_lauf.log            (letzte Zeile: erledigt/gesamt, Zeilen, GB, Rest in Minuten; ebenso teil-1..3)
type voll-v22\log\nachlauf.out            (Nachlauf: wartet / vereint / Kernprüfung)
type voll-v22\log\nachlauf-fertig.txt     (liegt erst am Ende: "vereinen rc 0, kernpruefung rc 0")
powershell -c "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | ? { $_.CommandLine -match 'voll-v22' } | select ProcessId, CommandLine"
```

Ein Teil ist fertig, wenn `voll-v22\teil-<k>\_teil.json` liegt und die letzte Logzeile `FERTIG` sagt. Fehler stehen in
`voll-v22\log\teil-<k>.err` (die eine Zeile „WERTPAPIERART … GCI" ist bekannt und harmlos) und als `FEHLER <Reihe>` im Log.

## Fortsetzen (nach Herunterfahren, Absturz, Stillstand)

Prüfpunkte liegen alle 50 Reihen (`_fortschritt.json` plus Jahresblöcke, atomar geschrieben). Denselben Start wiederholen:

```
powershell -ExecutionPolicy Bypass -File panelbau-v22-start.ps1
```

Jeder Teil überspringt, was in seinem `_fortschritt.json` steht; fertige Teile sind in Sekunden durch. Das Skript weigert sich,
solange noch ein Bau-Prozess auf `voll-v22` läuft (Doppelstart zerstört die Blöcke). Einzelne Teile: `-Teile 2,3`; ohne Nachlauf:
`-OhneNachlauf`. Ein Teilordner, der als v2.2 begonnen wurde, lässt sich nicht als v2.1 fortsetzen und umgekehrt (Abbruch mit
Meldung) — vor einer Fortsetzung prüfen: Summe der Werte in `erledigt` = `zaehler.zeilen` = Summe der `n` in den Blockköpfen.

## Vereinen und Kernprüfung von Hand (macht sonst der Nachlauf)

```
node --max-old-space-size=4096 paneldaten.js --aus voll-v22 --luecken --vereinen
node --max-old-space-size=8192 pruefung-v22.js --b voll-v22
```

`--vereinen` schreibt `voll-v22/panel/<jahr>.bin`, `voll-v22/panel/_stand.json` (Kennung `…/panel/v2.2`) und die Reihentafel
`voll-v22/reihen-abschnitte.json`. `pruefung-v22.js` schreibt `pruefung-v22.json` neben sich; Rückgabewert 0 und
`"bestanden": true` heißt: jede Zeile von v2.1 ist da, **95.150** Zeilen in **141** neuen Reihen, 0 unerklärte Unterschiede,
Kursspalten bitgleich, Wirkung 1.613 → 0 Reihen-Tage.

## Danach (Reihenfolge des Auftrags §2.5, §3)

1. Prüfzahl messen: `node --max-old-space-size=6144 kontrollen.js --aus voll-v22 --bericht voll-v22/kontrollen-v22.json`;
   der Wert `laeufe.momentum["monat/haupt"].netto.mittel` kommt als **zweiter** Schlüssel `…/panel/v2.2` in
   `K.REGRESSION23_ERWARTET` (konfig.js; der v2-Eintrag bleibt).
2. Suiten gegen `voll` (wie bisher) und gegen `voll-v22`: `node --max-old-space-size=6144 test.js --aus <ordner>`,
   `node test-teil2.js --referenz C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/referenz/F-F_Momentum_Factor.csv --kandidaten voll/kandidaten-voll.json --momentum momentum-perioden.json`,
   `node --max-old-space-size=6144 test-teil3.js --aus <ordner> --ergebnis teil3-ergebnis-v2.json`,
   `node --max-old-space-size=6144 test-teil4.js --ergebnis teil4-ergebnis-v2.json`; Mehrfaktor-Klinke B14:
   `node --max-old-space-size=6144 ../mehrfaktor-2026-09-22/test.js`, danach `git checkout -- studien/mehrfaktor-2026-09-22/pruefung/`.
3. `reihen-abschnitte.json` aus `voll-v22/` neben den Bericht kopieren, `PANEL-V22.md` und die Übergabe
   `uebergabe/panel-v22-neubau-2026-10-03.md` schreiben, Commit mit Pfadangabe.

## Verlauf

- 03.10. 20:40:44 Start der vier Teile und des Nachlaufs (PID der cmd-Hüllen 43824, 44088, 44400, 44380, Nachlauf 45540).
