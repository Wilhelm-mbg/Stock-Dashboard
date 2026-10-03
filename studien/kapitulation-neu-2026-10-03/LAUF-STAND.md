# LAUF-STAND — Kapitulation V2, der registrierte Lauf (Auftrag Nr. 68)

Kennung `kapitulation-neu-2026-10-03/v1`. Diese Datei sagt, was läuft und wie es **ohne** die Sitzung weitergeht, die den Lauf gestartet
hat. Simulation mit virtuellem Kapital, keine Anlageberatung.

## Was läuft (Start 03.10.2026, siehe `lauf/laeufe.json`)

Fünf abgekoppelte Prozesse (über `Win32_Process.Create`, hängen nicht an der Claude-Sitzung; ein Abmelden oder Ausschalten beendet sie):

| Prozess | tut | schreibt |
|---|---|---|
| vier Teile `messen.js --teil k/4` (k = 0…3) | lesen je ein Viertel der 7.299 Reihen von E: (nur lesend), zählen Signale, bauen den vollen Tagestopf, legen die Erträge der echten Signale **versiegelt** ab | `lauf/teile/teil-k-von-4.zaehl.ndjson`, `….ertrag.ndjson` (Siegel), `….fortschritt.json`, `….fertig`, `teil-k.log` |
| Wächter `messen.js --warten` | wartet auf die vier `.fertig`, rechnet dann die Tore **in der Reihenfolge der Vorregistrierung §6** und den Bericht | `lauf/zaehlung.json` → `nullpunkt.json` → `placebo.json` → `leck-klinke.json` → `kosten.json` → `stufe-a.json` → (nur bei MDE₈₀ ≤ 1,107 Pp) `stufe-b.json` → `nachrichtlich.json` → `urteil.json`; `ERGEBNIS.md`, `protokoll.json`, `lauf/stufen.fertig`, `lauf/stufen.log` |

## Nachsehen

- Fortschritt: `lauf/teile/teil-k-von-4.fortschritt.json` (Reihen erledigt / gesamt, GB, Minuten); letzte Zeile von `lauf/teile/teil-k.log`.
- Fertig ist der Lauf, wenn `lauf/stufen.fertig` liegt. `lauf/abbruch.json` = ein Tor 2–4 ist gerissen (Befund an den PM, **kein**
  Neustart ohne Rückfrage). `lauf/stufen.fehler.json` = technischer Abbruch der Stufen (Ausnahme im Log `lauf/stufen.log`).
- Ein Teil ist tot, wenn `teil-k-von-4.fertig` fehlt **und** kein Prozess `messen.js --teil k/4` mehr läuft (seine
  `.fortschritt.json` wird dann nicht mehr jünger; im Log steht die Ausnahme). Prozesse ansehen:
  `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object CommandLine -like '*kapitulation-neu*' | Select-Object ProcessId, CommandLine"`.
  (Die Start-/Ende-Zeilen der beiden `.cmd` sind im ersten Start verstümmelt — eine Ziffer direkt vor `>>` liest cmd als Kanalnummer;
  betroffen ist nur diese Logzeile, nicht der Lauf. Nach dem Lauf berichtigt.)

## Von Hand weitermachen (aus der Repo-Wurzel `C:\Users\Wilhe\Downloads\Stock-Dashboard`)

1. **Ein Teil ist abgebrochen** (Ausnahme, Speicher, Neustart des PC): denselben Teil neu starten — er überspringt erledigte Reihen, eine
   halb geschriebene letzte Zeile wird verworfen und neu gerechnet, nichts zählt doppelt:
   `powershell -NoProfile -ExecutionPolicy Bypass -File studien\kapitulation-neu-2026-10-03\starten.ps1 -Grund "Teil 2 nach Abbruch" -Teile 2 -OhneWaechter`
   (läuft der Wächter nicht mehr: `-OhneWaechter` weglassen). Jeder Start steht danach mit Uhrzeit und Grund in `lauf/laeufe.json`.
2. **Die Teile sind fertig, die Stufen fehlen** (kein `lauf/stufen.fertig`, Wächter tot): `studien\kapitulation-neu-2026-10-03\lauf-stufen.cmd`
   oder direkt `node --max-old-space-size=4096 studien/kapitulation-neu-2026-10-03/messen.js --stufen`. Vorhandene Stufendateien werden
   **nicht** neu gerechnet; die Kette setzt hinter der letzten fort.
3. **Stufe B wird nie von Hand geöffnet.** Sie rechnet nur, wenn `lauf/stufe-a.json` auf der Platte liegt und MDE₈₀ ≤ 1,107 Pp ist
   (`messen.js`, Funktion `stufeB`; `test.js` Abschnitt 9). Ist MDE₈₀ größer, lautet das Urteil „nicht entscheidbar" und das Mittel bleibt zu.
4. **Nur der Bericht fehlt:** `node studien/kapitulation-neu-2026-10-03/messen.js --bericht` schreibt `ERGEBNIS.md` und `protokoll.json` aus
   den JSON-Dateien des Laufs.
5. **Danach von Hand:** Abschnitt `## 11. Ergebnis (vom Lauf geschrieben, <Datum>)` an `VORREGISTRIERUNG.md` anhängen (Urteilssatz aus
   `lauf/urteil.json`, sonst nichts an dem Papier ändern), Übergabe `Markt-Dashboard-Daten/uebergabe/kapitulation-messung-2026-10-03.md`,
   Commit mit Pfadangabe (`lauf/*.json`, `ERGEBNIS.md`, `protokoll.json`, `VORREGISTRIERUNG.md`, `LAUF-STAND.md`).

## Was nicht geht

Kein zweiter Lauf, keine andere Variante, kein Blick in `lauf/teile/*.ertrag.ndjson` (das Siegel) außerhalb von Stufe A/B. Nichts auf E:
schreiben. Die Strategiedatei ist vor dem Lauf geprüft (zeichengleich mit der Quelle im Protokoll vom 26.08.2026, sha256
`7339e5312dadd900…`); jeder Teil prüft das beim Start erneut und rechnet sonst nicht.

## Stand

- 03.10.2026 20:36 — Code fertig (`messen.js`, `test.js` 52 grün, eslint sauber), Rauchprobe an 20 Reihen im Kratzordner (Wiederaufnahme
  nach zerrissener Zeile ergibt bytegleiche Journale; Siegel nicht geöffnet). Start des Laufs 20:36:23 (`lauf/laeufe.json`).
- 03.10.2026 22:55 — alle vier Teile fertig (je 139 Minuten, zusammen 122,7 GB, **ein** Start, keine Wiederaufnahme).
- 03.10.2026 23:06 — **Lauf zu Ende** (`lauf/stufen.fertig`): alle Tore gehalten, Stufe A geschrieben, Stufe B geöffnet, Urteil in
  `lauf/urteil.json`, Bericht in `ERGEBNIS.md` und `protokoll.json`. Es läuft kein Prozess mehr. Danach: die Hauptzahl unabhängig von
  `messen.js` aus den Journalen nachgerechnet (gleich: 528 Signaltage, netto −0,0238 Pp, sd 6,3283); §11 an die Vorregistrierung
  angehängt; die Logzeilen der beiden `.cmd` berichtigt (Umleitung vor dem `echo`); im Bericht ein erklärender Satz zur
  Totalverlust-Empfindlichkeit ergänzt und `--bericht` neu geschrieben (liest nur `lauf/*.json`, rechnet nichts neu).
- Der Sitzungs-Weckruf lief zwei Stunden an seine Zeitgrenze und wurde durch einen begrenzten ersetzt; ein „Wächter steht" um 22:56 war
  ein Fehlalarm der Weckruf-Bedingung (das Wächter-Log schweigt, solange er wartet). Der Lauf selbst war davon nie berührt.
- **Offen:** nichts am Lauf. Die Journale (`lauf/teile/`, rund 45 MB, samt Siegel) liegen auf der Platte und sind nicht eingecheckt.
