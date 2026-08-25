## Fünf Reiter statt sechs — und jede Sache hat einen Ort

Die Navigation ist neu sortiert. Nichts ist weg, aber vieles steht jetzt dort, wo man es
sucht.

**Die Marktkarte ist keine eigene Seite mehr.** Sie war ein ganzer Reiter für eine einzige
Ansicht, während „Heute" ein Scrollband aus zehn Abschnitten war. „Heute" hat jetzt drei
Pillen: **Überblick**, **Marktkarte**, **Radar & Insider**. Die Karte lädt weiter im
Hintergrund — daran ändert sich nichts, sie hing nie am geöffneten Reiter.

**Spekulations-Radar, Insider-Käufe und Vorbörsen-Lücken stehen zusammen.** Sie
beantworten dieselbe Frage — was wird geredet, was tun Insider, was steht vorbörslich
anders — und an keiner von ihnen ist etwas gemessen. Bisher lagen sie mitten im Überblick.

**Die Mittelfrist-Strategien: Steuerung unter Regeln, Bestand unter Vermögen.** Vermögen
führte bis jetzt neun Parameter, drei Lade- und drei Handelsknöpfe — obwohl dorthin nur
gehört, was das Depot *hält*. Die neue Pille **Regeln → Mittelfrist** trägt alle
Stellschrauben und ihre Rechner; unter **Vermögen → Bücher** stehen die beiden virtuellen
Bücher. Wer an einem Rad dreht, sieht das Ergebnis jetzt auf derselben Seite.

**Die eigenen Papiere haben ein Zuhause.** Bisher lagen Signalliste und
Übernahme-Formular auf „Heute", die Bestandstabelle unter Vermögen — und beide Seiten
verwiesen aufeinander. **Vermögen → Meine Papiere** trägt jetzt Bestand und Formular;
löschen geht dort ebenfalls, nicht mehr nur auf „Heute". Auf „Heute" bleibt der
Signalstand, also das, was sich täglich ändert — und der ist jetzt **untergliedert**:
Werte mit Kurzfrist-Signal zuerst, dann die, die ein Buch hält, dann der Rest. Bis heute
sahen Zeilen mit Signal genauso aus wie Zeilen ohne — die Einfärbung war im Stylesheet nie
angekommen.

**Zwei Wörter, die dasselbe zu heißen schienen:** Im Cockpit stand „DEPOT" für das
virtuelle 100.000-$-Buch, direkt daneben „Mein Depot" für die echten Papiere. Die Kachel
heißt jetzt **Simulation**, die Überschrift **Meine Papiere**.

**Fehlermeldungen benennen jetzt auch die Pille** — „Heute" allein sagte nach dem Umbau
nicht mehr, welche der drei Ansichten gemeint war.

---

### Für die Release-Wache

Vier Commits, drei Pakete. Die Umzüge sind Blockverschiebungen: die betroffenen Blöcke
wurden aus der Datei **geschnitten**, nicht abgeschrieben — in ihnen stehen Messaussagen
(Momentum t = 1,62; 8,44 statt 14,07 % p. a.; der ISIN/WKN-Messsatz vom 25.08.), die beim
Abtippen hätten verrutschen können. Die Bauskripte prüfen nach jedem Schnitt: jede Kennung
genau einmal, kein Bezeichner verloren, div-Bilanz unverändert.

**39 neue Zusicherungen.** Für die 26 Kennungen der Mittelfrist-Steuerung und die fünf der
eigenen Papiere gab es bis heute **keine einzige** — das ist die Lücke, durch die der
falsche Wegweiser in `bestandui.js` fallen konnte: die Datei stand nicht in der
Quellenliste der Wegweiser-Prüfung. Sie steht jetzt drin.

Jedes Paket ist zusätzlich mit **`tools/ui-probe.js`** verifiziert — der isolierten
Verhaltensprobe, die die Designer-Sitzung heute gebaut hat. Sie startet die App mit
frischem Datenordner, klickt jeden Reiter und jede Pille und zählt unbehandelte Fehler:
zuletzt **5 Reiter, 16 Pillen, grün**. Das ist die Fehlerklasse, die `test-v6` als
Textprüfer strukturell nicht sehen kann.

**Ein Leerzustand ist Regressionsschutz, keine Politur:** `zeige()` füllt die Buch-Container
nur, wenn der Takt durchlief. Beim Erststart ohne Tagesdaten kehrt er vorher um — bisher
fiel das nicht auf, weil die Statuszeile im selben Panel den Grund nannte. Nach dem Umzug
steht sie unter Regeln.

**Zweimal Doppelarbeit vermieden:** `offenerTab()` und die Urteil-Tabelle standen auf der
Liste zweier Sitzungen. Beide waren schon gebaut — übersprungen, nicht zurückgedreht, nur
gegengeprobt.

**Nicht angefasst, mit Grund:** Die Kachel „Signale offen laut Modell" rechnet ohne die
Nutzerparameter, `#drHeute` mit ihnen — bei geänderten Einstellungen widersprechen sich
zwei Zahlen. Die betroffene Zeile steht im Handelstakt; eigenes Vorhaben.
