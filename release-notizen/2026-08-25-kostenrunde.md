## Die Kosten lassen sich jetzt direkt messen

Bisher wartete die Messung der echten Handelskosten auf einen Trade, der auf dem
Demo-Konto gespiegelt wurde. Sie stand deshalb bei null Runden — und wäre dort geblieben:
gespiegelt wird nur der Intraday-Pfad, und der ist seit dem 23.8. vom Edge-Wächter
pausiert, weil der Vorsprung verfallen ist. Der Schutzmechanismus verhinderte also genau
die Messung, die über ihn entscheiden würde.

Die Kostenfrage hängt aber gar nicht an der Strategie. Der neue Knopf **„Kostenrunde
messen"** (bei den Regeln, unter den Kosten-Angaben) öffnet auf dem Capital.com-**Demo**-Konto
die kleinstmögliche Position und schließt sie sofort wieder. Aus beiden Ausführungskursen
ergibt sich, was ein Umlauf wirklich kostet — Spanne plus Schlupf, getrennt ausgewiesen.
Zwanzig Runden an einem Vormittag statt zwanzig Monaten.

Er läuft **nur auf Klick**, fragt vorher, und sagt es ausdrücklich, falls eine Position
offen bleiben sollte.
