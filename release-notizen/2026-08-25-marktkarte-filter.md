# Die Marktkarte reagiert sofort auf die Filter

Wer die Anzahl oder die Branche änderte, musste warten: Die Karte holte danach jedes Mal
alle Kurse neu — bei 300 Werten hunderte Abrufe für eine Auswahl, die sich gar nicht
geändert hatte. Kurse hängen aber am Wertpapier, nicht am Filter.

Die Karte merkt sich die Kurse jetzt fünf Minuten lang. Ein Filterwechsel kostet damit in
aller Regel keinen einzigen Abruf mehr und zeichnet sofort neu. Auch das Flackern von
„Kurse holen: 0 von 300 …" ist weg, wenn nichts zu holen ist.

Aufgefrischt wird alle fünf Minuten, solange der Reiter offen ist — vorher war es
während der US-Handelszeit jede Minute. Für eine Übersicht genügt das, und es hält die
Kursquelle frei für die Teile der App, die sie wirklich brauchen. Der Zwischenspeicher
überlebt den Reiterwechsel: Beim Zurückkommen steht die Karte sofort.

In der Fußzeile steht jetzt, wie viele Werte ohne Abruf gezeichnet wurden.
