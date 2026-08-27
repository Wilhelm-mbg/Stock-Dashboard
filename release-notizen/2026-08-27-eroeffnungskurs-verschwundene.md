## Die verschwundenen Werte haben endlich einen Eröffnungskurs

Das Archiv der von der Börse genommenen Werte — 1.164 Reihen, mit denen sich die
Überlebensverzerrung überhaupt erst messen lässt — führte in **keiner einzigen** seiner
305.908 Kerzen den Eröffnungskurs, obwohl die Quelle ihn mitliefert. Ohne ihn lässt sich
für das Übernacht-Fenster nicht prüfen, ob die Überlebenslücke das Vorzeichen dreht; und
genau über Nacht ist die Auflösungswand überhaupt zu unterbieten.

Das Werkzeug trägt ihn jetzt nach. Beim Nachtragen kam ein zweiter, größerer Fehler heraus:
Es **überschrieb** die Datei, statt sie zu ergänzen. Weil die Quelle nur ein rollendes
Fenster von 730 Tagen führt, hätte jeder Nachhol-Lauf bei jedem Wert den ältesten Tag
gelöscht — ein Lauf, der Daten retten soll, hätte Daten vernichtet. Er mischt jetzt, und
Tage außerhalb des Quellfensters bleiben stehen; sie sind die einzigen, die es je geben wird.

Nebenbei fielen 23 doppelte Einträge in der Liste der Verschwundenen auf (dieselbe Firma,
Löschdatum einen Tag auseinander). Sie kosteten je einen Abruf und wären seit dem Mischen
nicht mehr harmlos gewesen. Der Lauf zieht sie zusammen — und schlägt Alarm, falls ein
Kürzel je neu vergeben wurde, statt zwei Firmen stillschweigend in eine Kursreihe zu legen.
