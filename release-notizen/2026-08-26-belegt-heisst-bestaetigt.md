## „Belegt“ steht jetzt nur noch da, wo ein Messprotokoll es sagt

An sieben Stellen nannte die Oberfläche die beiden Intraday-Regeln „belegt“ — auf dem
Knopf, in zwei Erklärtexten, in einem Tooltip und in den Hinweisen nach einem Update.
Kein einziges der zwölf Messprotokolle sagt das. Alle sieben heißen jetzt „gemessen“,
und das ist auch richtig so: die Regeln **sind** gemessen, ihr Vorsprung ist nur nicht
bestätigt.

Der Unterschied ist nicht kosmetisch. „Gemessen“ heißt: wir haben hingesehen. „Belegt“
heißt: es trägt. Das zweite hat bisher niemand nachweisen können, und die Oberfläche
sollte es dann auch nicht behaupten.

Was schon richtig war und so bleibt: Die Anzeige, die den Belegstand aus dem Protokoll
**abliest**, sagt weiterhin „Belegt (Protokoll sagt bestätigt)“ — diese Gruppe ist derzeit
leer, und genau das ist die ehrliche Auskunft.

---

### Für die Release-Wache

Issue #84, Fund des nächtlichen Analytikers. Der Befund wurde vor dem Bauen unabhängig
nachgeprüft — alle zwölf Protokolle gelesen, kein Urteil `bestaetigt`. Wäre eines dabei
gewesen, wäre der Fund entkräftet und die Änderung falsch.

Mitgenommen, gleiche Klasse, im Code: eine fest verdrahtete Liste namens `belegt`
(rsi2seit + kapitulation) in der nächtlichen Suche. Die Einschränkung selbst ist richtig
und bleibt — nur der Name behauptete zu viel. Reine Umbenennung, kein Verhalten. Das ist
dieselbe Stelle wie `TRIG_BELEGT` am Vortag, eine Ebene weiter.

**Vierte Sperrklinke** nach dem Muster der Design-Skala: kein sichtbarer Text darf eine
Kante „belegt“ nennen. Geprüft wird die *Behauptung* (belegte + Kante/Regel/Modus …),
nicht das Wort — die abgelesene Gruppenüberschrift bleibt erlaubt und wird von einer
zweiten Zusicherung ausdrücklich geschützt. Gegengeprobt gegen `v8.33.2`: sie findet dort
alle sieben.

**Bewusst nicht angefasst:** In 21 Quellcode-Kommentaren lebt die Formel weiter. Sie
tragen dort Geschichte („die Inventur vom 21.08. fand …“); Vergangenes umzuschreiben wäre
schlimmer, als sie stehen zu lassen. Eigener Befund, kein Teil dieses Auftrags.
