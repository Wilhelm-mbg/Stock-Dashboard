## Fehlermeldungen aus automatisch gebauten Paketen kommen an

Wer aus dem Programm heraus einen Fehler gemeldet hat, hat unter Umständen ins Leere
gemeldet — und das war von außen nicht zu erkennen. Pakete, die von Hand gebaut wurden,
trugen den Rückkanal; solche, die automatisch aus einer Versionsmarke entstanden, nicht.
Dem Installer sah man den Unterschied nicht an.

Der automatische Bauweg legt den Rückkanal jetzt selbst an. Solange der dafür nötige
Schlüssel nicht hinterlegt ist, verhält sich der Bau wie bisher — sagt es aber deutlich,
statt stillzuschweigen.

**Was Wilhelm dafür tun muss:** unter *Settings → Secrets and variables → Actions* im
Repository ein Geheimnis namens `TELEMETRIE_JSON` anlegen und den vollständigen Inhalt
der eigenen `telemetrie.json` hineinkopieren. Bis dahin ändert sich nichts.

---

### Für die Release-Wache

Zwei Reparaturen aus Issue #76 (die sieben Fehler vom 25.08.), einzeln committet.

**#76.1** — `.github/workflows/build.yml` bekommt einen Schritt „Diagnose-Rückkanal
einlegen" vor dem Bauen, nach demselben Muster wie das Signatur-Zertifikat daneben:
Geheimnis da → Datei schreiben, Geheimnis leer → laut sagen und weiterbauen. Untätig,
bis das Geheimnis existiert.

**#76.6** — `tools/release.js` räumt die verbrauchten Notizen jetzt **vor** dem Tag weg.
Bisher geschah das danach; der Aufräum-Commit konnte den Tag also bauartbedingt nie
erreichen, und der nächste `--prüfen`-Lauf hielt ihn für unausgelieferte Arbeit. Im Log
nachweisbar an `v8.32.0`.

Die Umstellung hat einen Preis, und der ist bezahlt: Schlägt das Veröffentlichen danach
fehl, wären die Notizen verbraucht, ohne dass ein Release existiert. Der bestehende
Fehlerzweig räumte bisher nur den Tag weg — er holt jetzt auch die Notizen zurück
(Dateiname und Text stehen ohnehin im Speicher). Klappt selbst das nicht, nennt die
Meldung den Commit, aus dem sie sich wiederherstellen lassen.

`--hoch` weigert sich weiterhin gegen den Aufruf aus einer Sitzung — das war die
Bedingung, dieses Werkzeug überhaupt anzufassen. Die Hausregel verbietet das
*Ausliefern* durch eine Sitzung, nicht das Reparieren des Werkzeugs, und die Weigerung
steckt im Skript, nicht in der Regel.

**Die übrigen fünf Punkte waren bereits behoben** — nachgemessen, nicht aus dem
Gedächtnis: die fetch-Refspec holt alle Zweige, der Token-Platzhalter besteht die
Gültigkeitsprüfung nicht mehr, `.mjs` läuft nicht mehr am Linter vorbei, im Baubaum
läuft die volle Testreihe, und von 1.529 Regex-Literalen in den Testdateien trifft
keines mehr die leere Zeichenkette. (Der erste Messlauf meldete dort einen Treffer — ein
Fehlalarm des Prüfwerkzeugs, das ein in einer Zeichenkette gebautes Muster falsch
geschnitten hatte. Nachgeschärft und neu gemessen.)
