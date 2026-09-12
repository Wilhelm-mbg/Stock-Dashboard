## Die App kann sich wieder selbst aktualisieren

Die Fassungen 8.44.0 und 8.44.1 wurden unvollständig ausgeliefert: Dem Paket fehlten
mehrere Bausteine, die das Update-Modul zum Laufen braucht. Unter Einstellungen →
Automatische Updates stand deshalb „Update-Modul nicht ladbar" — und eine App, der
dieser Teil fehlt, kann sich bauartbedingt nicht selbst reparieren.

**Einmal von Hand nötig:** Wer noch auf 8.44.0 oder 8.44.1 sitzt, lädt diese Fassung
einmalig als Setup von den GitHub-Releases und installiert sie darüber. Danach laufen
die automatischen Updates wieder wie gewohnt; Depot, Einstellungen und Archiv bleiben
unberührt.

Damit das nicht wieder still passiert, zählt die Release-Routine ab jetzt vor jeder
Veröffentlichung nach, ob wirklich alle Fremdbausteine im Paket liegen, und lädt das
Update-Modul einmal probeweise aus dem fertigen Paket. Fehlt etwas, wird gar nicht
erst ausgeliefert. Die Meldung in der App nennt jetzt außerdem den Ausweg.
