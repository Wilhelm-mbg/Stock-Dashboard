# Der Edge-Wächter schlug sechsmal falschen Alarm

Der Wächter misst jede Nacht nach, ob eine Regel ihren gemessenen Vorsprung noch hat, und
setzt neue Einstiege aus, wenn er zweimal hintereinander verfallen war. In den bisherigen
Messungen hat er **sechsmal von sechs Mal** Verfall gemeldet — und jedes Mal auf Zahlen,
die von null nicht zu unterscheiden waren.

Zwei Gründe. Erstens galt **jeder** nicht-positive Wert als Verfall, egal wie winzig. Bei
einer Kante, deren wahrer Vorsprung nahe null liegt, pendelt die Messung um null und landet
etwa in der Hälfte der Fälle im Minus. Zweitens war „zweimal hintereinander" oft gar keine
zweite Messung: Der Wächter rechnet über ein rollendes Fenster, und bei der Pause vom
24. August lagen zwischen den beiden Messungen **null neue Signale**.

Das ist nicht harmlos. Eine Sicherung, die dauernd grundlos anschlägt, wird abgeschaltet —
und genau das ist passiert. Seit dem 22. August stand der Wächter per Hand aus, für **beide**
Regeln, dauerhaft. Schlecht geeicht hat er zu weniger Schutz geführt als gar keiner.

Ab jetzt zählt als Verfall nur ein **bedeutsamer** Rückgang, und zwischen den beiden
Messungen muss echte neue Messbasis liegen. Eine Kante, die wirklich wegbricht, löst
weiterhin problemlos aus — keine der sechs Rauschmessungen hätte es getan. Aufgehoben wird
eine Pause weiterhin erst, wenn der Vorsprung wieder positiv ist: Es soll leichter sein,
pausiert zu bleiben, als weiterzuhandeln.
