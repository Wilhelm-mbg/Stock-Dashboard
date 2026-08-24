## Die App vergisst weniger

Drei Dinge werden ab jetzt dauerhaft festgehalten, die vorher verloren gingen:

**Die Geld-Brief-Spannen** wurden in einem Ringpuffer gesammelt, der nach rund
16 Handelstagen den ältesten Tag lautlos fallen ließ. Jetzt wird je Tag und Wert ein
Median festgeschrieben — 461 Bytes am Tag, gut 100 KB im Jahr. Erst damit lässt sich
über Wochen beantworten, ob die Kostenannahme von 0,10 % trägt und ob die engen Werte
dauerhaft eng sind.

**Jeder Trade** bekommt die tatsächlich notierte Spanne seines Wertes beim Ein- und
beim Ausstieg mit. Bisher hing die Kostenmessung an einer Spiegelung aufs Demo-Konto,
die nicht zustande kam — sie stand deshalb bei null Runden und wäre dort geblieben.
Liegt keine Messung vor, wird nichts eingetragen statt geraten.

**Scheitert die Spiegelung**, steht der Grund jetzt in den Daten. Vorher wurde nur
mitgezählt, und der Zähler war beim nächsten Start weg.

Am Handel ändert sich nichts — es wird nur mehr aufgeschrieben.

## Das 1-Minuten-Archiv hätte sein Ziel nie erreicht

Es behielt 90 Kalendertage — rund 62 Handelstage. Die für Felix' Winkel-Detektor (#33)
zugesagte Neubewertung braucht 77. Das Archiv stand bei 63 und wäre in drei Wochen an
den Deckel gestoßen: ab dann fällt für jeden neuen Tag der älteste heraus. Die nächtliche
Sammlung wäre brav weitergelaufen und hätte das Ziel nie erreicht, auf das sie
zusammengetragen wird.

Das Fenster liegt jetzt bei 250 Tagen (~173 Handelstage) — genug für die Frage und für
die Teilung in Entdeckung und Bestätigung, die dieses Projekt für jedes Urteil verlangt.
Kostet rund 500 MB statt 180.
