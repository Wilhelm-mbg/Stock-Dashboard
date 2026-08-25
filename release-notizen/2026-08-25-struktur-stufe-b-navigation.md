## Die Unter-Reiter schalten ab dem ersten Bild — und die App merkt sich, wo man war

Die elf Pillen (Schalter & Einstellungen, Explorer, Protokoll, Trendfinder …) waren beim
Start eine Weile tot: Sie sahen bedienbar aus und taten nichts, weil ihre Verkabelung
hinter dem Laden des Depots hing — einem Umlauf über die vollständige Depot-Datei plus
rund 300 Zeilen Aufräumarbeit, in der letzten von 31 Skriptdateien. Die Navigation gehört
jetzt der Programmhülle und wartet auf nichts. Ein Klick wirkt ab dem ersten Bild; ist das
Depot noch nicht da, wird die Unterseite gemerkt und nachgezeichnet, sobald es steht.

**Neu: Reiter und Pille überleben den Neustart.** Wer die App auf „Regeln → Regelbuch"
schließt, landet beim nächsten Start dort. Gemerkt wird ausschließlich der Ort — keine
offenen Fenster, keine Explorer-Detailansicht: Ein Fenster, das ohne den Klick
wiederkommt, der es geöffnet hat, verwirrt mehr, als das Wiederfinden spart.

Eine Ausnahme mit Absicht: Der wiederhergestellte Trendfinder holt **keine** Kurse. Beim
Klick sind fünfzehn Kursabfragen eine Bestellung, bei jedem Programmstart wären sie eine
ungefragte. Der Reiter zeigt dann seinen Leerzustand, und „Jetzt prüfen" steht daneben.

**Fehlermeldungen benennen den richtigen Bereich.** Der Melde-Knopf las den offenen Reiter
bisher an einem Merkmal ab, das die App nie setzt — er hat nie etwas gefunden. Jetzt steht
in der Meldung der Klartextname und die Kennung, also etwa „Heute (dashboard)".

**Unter der Haube aufgeräumt:** Die sechs Reiter-Blöcke im Markup standen in einer anderen
Reihenfolge als die Leiste darüber, zwei hatten keine Blockgrenze, drei
Abschnittsüberschriften kündigten Abschnitte an, die woanders liegen, und ein leeres
Raster erzeugte nichts als Luft. Für Anwender folgenlos — außer den 12 px Abstand, die mit
dem leeren Raster verschwinden — aber für jede spätere Sitzung eine Falle.

---

### Für die Release-Wache

Vier Commits, aufgeteilt so, dass jeder für sich lesbar bleibt. Der erste ist ein **reiner
Umzug** von Markup-Blöcken; nachgewiesen mit einem sortierten Zeilenvergleich: die einzige
Inhaltsänderung sind zwei nackte `</div>`, die eine Beschriftung bekommen.

13 neue Zusicherungen (Abschnitt 59), vier bestehende von `depot.js` auf `app-shell.js`
umgehängt. Drei davon wären bei korrektem Umbau rot geworden, eine still leer gelaufen —
repariert wurde die Zusicherung, nicht das Verhalten.

**Zwei Fallen aus dem Bauplan sind beim Bauen aufgelaufen und behoben:**

1. Der vorgeschlagene Quellcode-Kommentar in `bugs.js` zitierte den alten Selektor
   wörtlich — und die neue Sperrklinke sucht genau diese Zeichenfolge in der ganzen
   Datei. Der Kommentar hätte den Test bei völlig korrektem Code rot gemacht.
2. Die erste Zusicherung des neuen Blocks prüfte die Länge eines Ausschnitts statt der
   Fundstelle. Fehlt der Umschalter, liefert `indexOf` −1, `slice(0,-1)` die halbe Datei
   und die Zusicherung wird grün, während sie etwas Falsches behauptet. Gegengeprobt gegen
   den Vorstand: die Bauplan-Fassung grün, die korrigierte rot.

**Von Hand nachzusehen** (die Tests lesen nur Quelltext, sie führen die Oberfläche nicht
aus): alle elf Pillen in allen drei Leisten; die Protokoll-Filter und der CSV-Knopf dürfen
den Reiter Vermögen **nicht** leeren (das war der Fehler vom 23.08.); Heatmap-Kachel und
Positionszeile springen weiter in den Explorer; App auf einer Unterseite schließen und neu
starten.
