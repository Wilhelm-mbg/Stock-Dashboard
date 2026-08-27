# Wofür diese 72 Rohantworten da sind

Yahoo-Chart-Antworten (60m, period1/period2 je Tag), abgerufen 27.08.2026
~02:2x: 6 Symbole × (5 erreichbare Halbtage + Positivtag 2026-08-20) × mit/ohne
includePrePost. Dateiname: `<sym>_<tag>_<pp|nopp>.json`.

Sie sind der einzige unabhängig entstandene Positivsatz des Projekts für zwei
Befunde der Nacht auf den 27.08.:

1. **Giftkerzen:** nopp-Abrufe hängen eine HEUTIGE Stempelkerze (2026-08-26
   20:00, aktueller Kurs, v=0) an historische Antworten — 26 der 30
   Halbtags-nopp-Dateien tragen sie. Der QS-Stempelsucher und die
   kurse.js-Fenstersperre (3fbc9b5) wurden an genau diesen Dateien belegt.
2. **AH-Lieferpolitik:** nopp liefert an Halbtagen genau EINE Kerze nach
   Sitzungsende (30/30), an Normaltagen keine (6/6) — die Ursache des
   Archiv-Populationsmusters. pp-Dateien enthalten den vollen Nachhandel
   (Kurse mit v=0 = Liefer-Lücke der Quelle, kein Handels-Beleg).

NICHT als Kursdaten verwenden — die nopp-Dateien enthalten die Giftkerze
absichtlich unbereinigt. Auswertung: ../quellabruf-halbtage.js (--vergleich),
../mechanik-5m15m.js; Übergabe desingner-2026-08-27-0515.md im Briefkasten.
