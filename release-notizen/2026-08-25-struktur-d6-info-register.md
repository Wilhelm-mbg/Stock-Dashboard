## Die Experten-Einstellungen erklären sich jetzt auch ohne Maus

Die vier Gruppen unter „Schalter & Einstellungen → Experten" — Signal, Risiko & Kosten,
Filter & Schutz, Haltedauer & Ausstieg — haben je einen Erklärknopf in der Überschrift.
Bisher lag ihr ganzes Wissen in 18 Tooltips: nur mit der Maus erreichbar, auf einem
Tastbildschirm gar nicht. Die Tooltips bleiben alle stehen; es kommt nur ein Weg dazu.

**Der eigentliche Gewinn sind nicht die 18.** Sieben Bedienelemente hatten *überhaupt
keine* Erklärung — darunter die Haltedauer, an der beide gemessenen Strategien hängen, und
der Event-Blackout. Für die ist der neue Text nicht die zweite, sondern die **erste**
Stelle, an der ihr Grund steht.

Die Texte erzählen die Tooltips nicht nach. Sie sagen, warum es die Gruppe gibt und was
ein Dreh daran kostet: dass Setup, Auslöser, Zeitrahmen und Ausstieg zusammen *die* Regel
bilden, die gemessen wurde — wer eines verstellt, handelt eine andere. Dass der eigentliche
Kostenhebel das Bezugsverhältnis ist und nicht der Hebel. Dass unter „Filter & Schutz"
alles nur Trades *verhindert*, und dass „Signale immer aufzeichnen" der einzige Schalter
ist, der nichts kostet — ausschalten heißt: keine Beweisaufnahme mehr.

**Der Trendfinder ist kürzer geworden.** Zwei Begründungsabsätze standen als Dauertext über
der Tabelle und schoben das Ergebnis nach unten. Sie stehen jetzt vollständig hinter dem
„i" — Wort für Wort, es sind Messaussagen. Sichtbar bleibt, was man zum Bedienen braucht.

---

### Für die Release-Wache

Die Absätze wurden aus der Datei **extrahiert und entmarkupt**, nicht abgetippt: sie tragen
echte U+2212-Minuszeichen (−0,17 Pp bei t = −4,1), und eine Zusicherung sucht genau diese
Zeichenfolge.

**Zwei Nebenbefunde beim Zählen:**

1. **Bestehender Anzeigefehler, nicht behoben:** `Info.zeigen()` escapt die Punkte mit
   `U.esc`. Drei **bestehende** Einträge (`marktkarte`, `messung.strategien`,
   `messung.eingabe`) enthalten trotzdem `<b>` und `<code>` und zeigen sie dem Nutzer
   wörtlich als Text. Nicht angefasst — das hieße entweder `U.esc` aufweichen oder drei
   Messaussagen ändern. Eigener Auftrag. Die neuen Einträge sind markup-frei, und eine
   Zusicherung hält das fest.
2. **Ein verwaister Registereintrag:** `strategien.js` meldete für *jede* Strategie einen
   Eintrag an, zeichnet den Knopf aber nur für Karten — die Fußnoten-Strategie „lang" hatte
   einen Text, den kein Knopf je aufruft. Behoben. Die vorhandene Prüfung konnte das nicht
   sehen: sie hält `app-shell.js` gegen `index.html` und kennt die zur Laufzeit
   angemeldeten Einträge nicht.

**Die Zahl 171 aus dem Plan war nicht reproduzierbar** — gezählt sind 123 `title=` über
alle Nicht-Test-Dateien. Die 18 an `#idParams` sind nachgezählt und belastbar.

Elf neue Zusicherungen. Die Gruppen-Prüfung filtert über die *Tooltips*, nicht stumpf über
alle Gruppen: „Wellen-Screener" hat keinen einzigen `title` (sein Grund steht sichtbar) und
braucht deshalb keinen Knopf. Gegengeprobt: nimmt man einem der vier Knöpfe weg, wird die
Zusicherung rot.

Zwei bestehende Zusicherungen sind zu Recht rot geworden und wurden **neu gemessen, nicht
abgeschwächt** — eine Schnittmarke endete auf `</div>`, und dort steht jetzt der Knopf.
