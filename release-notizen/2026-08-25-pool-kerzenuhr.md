# Der Beobachtungs-Pool wird jetzt vollständig angesehen, nicht mehr reihum

Neben den Basiswerten beobachtet der Intraday-Scanner einen größeren Pool — beim
Standard 89 Werte. Bisher waren davon je Runde nur **zwölf** an der Reihe; jeder Wert kam
alle rund elf Minuten dran.

Verpasst wurde dadurch nichts: Das Signal entsteht beim **Schluss einer Stundenkerze**, und
ein voller Umlauf war schneller als eine Stunde. Was es kostete, war **Zeit** — der Einstieg
konnte bis zu elf Minuten nach dem Kerzenschluss erfolgen, während die Messung, an der die
Strategie gemessen wird, genau am Schluss einsteigt. Diese Lücke war also nicht Bequemlichkeit,
sondern ein Unterschied zwischen dem, was gemessen wurde, und dem, was gehandelt wird.

Jetzt wird der ganze Pool **einmal je Kerze** durchgesehen, direkt nach ihrem Schluss.
Nebenbei braucht das **weniger** Abfragen als vorher, nicht mehr: rund 89 je Stunde statt 480.
