## Ein Urteil heißt überall gleich — und die Einwilligungsfrage ist ein richtiges Fenster

**Der sichtbare Fehler:** Eine Strategie, die als „bestätigt – aber Nullpunkt verschoben"
gemessen wurde, hieß im Scoreboard genau so — und in der Strategien-Liste zehn Zentimeter
darunter stand der rohe Schlüssel `bestaetigt-aber-nullpunkt-verschoben`. Zwei Anzeigen
für ein Urteil, weil die Datei zwei Beschriftungstabellen führte und der zweiten genau
dieses Urteil fehlte. Es gibt jetzt eine Tabelle: Rang, Beschriftung und Farbe stehen für
jedes Urteil in einer Zeile.

**Kein „undefined" mehr in den Karten.** Der Spekulations-Radar und die Nachrichten
schreiben Inhalt aus dem Netz auf die Oberfläche, und der hat regelmäßig Lücken. Fehlte
ein Feld, stand dort wörtlich das Wort „undefined". Jetzt steht dort nichts.

**Die Frage nach den Diagnosedaten ist ein richtiges Fenster.** Sie war bisher das einzige
Overlay der App, das aus der Reihe fiel: kein abgedunkelter Hintergrund, keine Fokusfalle,
kein Escape — ausgerechnet die Frage, die beim allerersten Start über einem halb geladenen
Dashboard liegt. Sie benutzt jetzt dasselbe Dialog-Muster wie alle anderen Fenster. Wer
sie wegklickt, ohne zu antworten, hat weiterhin nichts gesendet und wird beim nächsten
Start erneut gefragt.

**Fehler im Mittelfrist-Depot sind als Fehler zu erkennen.** Die Meldung stand bisher grau
an derselben Stelle wie die Kursangabe und war von ihr nicht zu unterscheiden. Sie ist
jetzt rot und findet beim nächsten erfolgreichen Durchlauf von allein in ihre Grundfarbe
zurück.

**Unter der Haube:** Vier eigene Escape-Funktionen, vier eigene Kachel-Bauplätze und acht
Varianten derselben Statuszeile sind auf je einen gemeinsamen Baustein zusammengeführt.
Für Anwender unsichtbar — aber vier Kopien heißen vier Orte, an denen die nächste
Korrektur nur zu einem Viertel ankommt.

---

### Für die Release-Wache

Sieben Commits, 26 Einzeländerungen über 13 Dateien. 21 neue Zusicherungen (Abschnitte 60,
61, 62 und vier bestehende Blöcke), dazu zwei Sperrklinken nach dem Muster der
Design-Skala: nur `U.esc` escapt in diesem Programm, und es gibt keine zweite
Urteil-Tabelle.

**Drei Fallen aus dem Bauplan, die beim Anwenden aufgelaufen sind:**

1. Zwei Quellcode-Kommentare nannten genau die Bezeichner, die die zugehörige Sperrklinke
   im Text sucht — sie hätten den Test bei völlig korrektem Code rot gemacht. Beide
   beschreiben die alte Lage jetzt, statt den Bezeichner abzuschreiben. (Von der
   Gegenprüfung des Bauplans gemeldet.)
2. Die Kachel-Hilfe hatte denselben Anker wie die Statuszeilen-Hilfe, aber nur den halben
   Ersatztext — wörtlich angewandt hätte sie `U.signTxt` und `U.statuszeile` gelöscht.
3. Zwei bestehende Zusicherungen maßen die *Schreibweise* statt der Eigenschaft
   (`RANG = { 'bestaetigt': 0` und `+ esc(z.these)`). Beide Eigenschaften gelten
   unverändert und wurden neu gemessen, nicht gestrichen — die Sortierregel jetzt am
   laufenden Code statt an einer Textmarke.

**Bewusst nicht gemacht, jeweils begründet:** Die drei `window.confirm` in `mfdepot.js`
und `depot.js` bleiben stehen — zwei davon sind Gatter vor dem Handel, und ein DOM-Dialog
ist zwangsläufig asynchron. Das ist ein Umbau im Handelspfad und braucht einen eigenen
Auftrag. `renderer.js` behält seine Kacheln (eine Zusicherung prüft dort `kachel-sub` als
Text), `bestandui.js` seine Statuszeile (sie färbt einen Teilsatz ein, das kann keine
Hilfe mit einem Zustand je Zeile), `depot.js` seine rund 20 Statuszeilen (die warten auf
Stufe E). Erklärtexte je Urteil wurden **nicht** erfunden: das wären neue Messaussagen.

**Von Hand nachzusehen:** Reiter Messung, Strategien-Liste — eine Strategie mit dem
Nullpunkt-Urteil muss dort jetzt ausgeschrieben stehen. Und der Erststart-Dialog in einer
frischen Instanz.
