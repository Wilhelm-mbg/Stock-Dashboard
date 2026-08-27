# Die App holt sich die Kursdaten jetzt selbst

Unter **Werkzeuge › Kursarchiv** gibt es eine neue Seite. Die App holt dort die feinen
Kerzen (1, 5 und 15 Minuten) selbstständig von Yahoo und legt sie im Kursarchiv ab –
bisher musste das jemand von Hand anstoßen, und wenn es dabei abbrach, merkte es niemand.

Die Seite zeigt für jede Auflösung vier Zahlen: wie viele Werte im Archiv liegen, wie alt
die jüngste Kerze ist, wann zuletzt gesammelt wurde und wie viele Werte gerade offen sind.
Darunter steht im Klartext, warum gerade gesammelt wird oder warum nicht. Ein Knopf je
Auflösung startet den Lauf von Hand, ein zweiter hält ihn an.

**Warum das wichtig ist:** Yahoo hält Intraday-Kerzen nur begrenzt vor – Minutenkerzen
sieben Tage, 5- und 15-Minuten-Kerzen sechzig. Was in dieser Zeit nicht geholt wurde, ist
nicht später nachzuholen, sondern endgültig fort. War der Rechner eine Woche aus, sagt die
App jetzt, wie viele Tage fehlen, statt stillschweigend weiterzumachen.

**Gesammelt wird nach Handelsschluss**, frühestens dreißig Minuten danach. Der Grund ist
gemessen: Yahoo korrigiert auch fertige Kerzen noch rund achtzehn Minuten lang nach. Wer
mitten in der Sitzung sammelt, schreibt vorläufige Zahlen. Läuft dagegen das Zeitfenster
ab, wird auch bei offenem Markt geholt – eine vorläufige Kerze ist besser als gar keine.

Die eingestellten Zahlen stehen offen auf der Seite: die 500 umsatzstärksten Werte plus die
großen ETFs, Minutenkerzen täglich, 5 und 15 Minuten wöchentlich, 1,2 Sekunden Abstand
zwischen zwei Abfragen. Stunden- und Tageskerzen holt die App bewusst nicht.

Am Handel ändert sich nichts. Die neue Seite sammelt Kursdaten und sonst nichts.
