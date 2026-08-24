## Ausliefern läuft jetzt über eine Routine

`node tools/release.js` übernimmt den ganzen Ablauf: Version hochzählen, aus einem
sauberen Baum bauen, testen, veröffentlichen — und danach nachsehen, ob wirklich das
eigene Paket oben liegt. Für dich ändert sich nichts an der App; für die Updates ändert
sich, dass sie verlässlicher und schneller kommen.

Jede Sitzung, die hier arbeitet, legt ihre Notiz in `release-notizen/` ab. Der
Release-Text entsteht daraus, statt aus einer Liste von Commit-Zeilen.
