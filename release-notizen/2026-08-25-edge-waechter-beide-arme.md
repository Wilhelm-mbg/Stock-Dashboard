# Die Schutzpause galt nur für eine der beiden Regeln

Der Edge-Wächter setzt neue Einstiege aus, wenn der gemessene Vorsprung einer Regel
zweimal in Folge verfallen ist. Für den **Kapitulations-Dip** hat er das nie getan: Die
Stelle, die vor jedem Einstieg nach einer Pause fragt, las ein Feld ab, das nirgends im
Programm je gesetzt wurde. Sie fragte also immer ins Leere und bekam immer „keine Pause"
zur Antwort.

Der Wächter misst jetzt beide Regeln getrennt und pausiert jede für sich. Getrennt und
nicht gemeinsam, weil die beiden verschiedene Haltedauern und verschiedene Marktlagen
haben — eine gemeinsame Pause hätte die gesunde Regel mit stillgelegt.

Gefunden wurde das durch eine Durchsicht des Programmtexts, nicht im Betrieb. Ein neuer
Selbsttest sucht ab sofort nach genau dieser Sorte Fehler: einer Einstellung, die
abgefragt, aber nie gesetzt wird — im Programmtext sieht so etwas nach einer Sicherung
aus, und niemand prüft nach.
