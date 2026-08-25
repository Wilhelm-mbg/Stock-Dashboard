# Startlogik aufgeräumt – und die Depotkurve wächst jetzt immer

Die Startfunktion der App ist gedrittelt: Das Laden und alle Einmal-Umstellungen
alter Bestände stehen jetzt in einer eigenen Datei (depotmigration.js), die Takte
(was wie oft läuft) stehen gebündelt an einem Ort, die Verdrahtung bleibt. Für
Anwender sichtbar ist eine Verbesserung: Der Depotverlauf bekam seinen Punkt bisher
nur, wenn man den Vermögen-Reiter ansah – jetzt wächst die Kurve unabhängig davon
(weiterhin höchstens ein Punkt alle 10 Minuten). Das Prüfwerkzeug ui-probe erkennt
außerdem ab jetzt einen abgebrochenen App-Start am Warnband.
