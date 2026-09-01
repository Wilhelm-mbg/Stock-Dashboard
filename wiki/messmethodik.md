# Messmethodik

**Das eigentliche Kapital des Projekts.** Teuer bezahlt mit dutzenden eigenen Fehlern.
Reihenfolge ist Pflicht, nicht Empfehlung.

## A — VOR der Messung

1. **Machbarkeit rechnen.** Wie viele Signaltage bräuchte eine Kante in Kostenhürden-Größe?
   Siehe [aufloesungswand.md](aufloesungswand.md). Weniger vorhanden ⇒ **„nicht messbar" ist
   der Befund**, kein Nein. *So starb News-Sentiment ehrlich.*
2. **Vorregistrieren:** Endpunkt, Toleranzen, Testzahl schriftlich — **bevor jemand Erträge
   sieht.** Zwei Endpunkte brauchen eine **Vorrangregel vorab**, sonst sucht man sich hinterher
   den passenden aus.
3. **Multiplizität:** Familienweite Schwelle. Wer 51 Detektoren testet, findet garantiert
   Zufall. *(0 von 51 überlebten die Korrektur.)*

## B — WÄHREND der Messung (Wächter)

4. **Placebo läuft immer mit** — ein Signal ohne jeden Kursbezug, richtige Antwort null. Steht
   in **derselben Tabelle, derselben Blickzeile** wie der Kandidat, nie in einer Fußnote.
   *Er hat einen kompletten Fehlschluss getötet und vier Fehler gefunden, die sieben formale
   Prüfungen übersahen. Fundstelle: `studien/vorregistrierung-2026-08-27-querschnitt-uebernacht/`*
5. **Positivkontrolle:** ein künstlich eingebauter Effekt **muss** wiedergefunden werden.
   Sonst ist das Werkzeug tot und jede Null wertlos. *Weg 3: Soll −0,0044, gefunden −0,0048 ✓*
6. **Datenwächter:** Archiv aktuell (Wachhund)? Sperren? Abmeldeliste frisch?
7. **Kosten je Klasse ansetzen**, nie pauschal — siehe [kosten.md](kosten.md).

## C — Parameter

8. **Nie auf denselben Daten optimieren, auf denen geurteilt wird.** Deshalb steht in der App
   „63 Tage **(geprüft)**" — einmal gemessen, dann eingefroren.
9. **Stufenzerlegung:** jeden Filter einzeln messen. *Supertrend-Lehre: EMA- und RSI-Filter
   trugen exakt null, halbierten aber die Signale — Komplexität, die nur schadet.*
10. **Keine Massen-Sweeps.** Wer 10.000 Kombinationen durchrechnet, findet garantiert eine, die
    zufällig glänzt. Unsere Bauart ist bewusst rechenarm.

## D — Danach

11. **Live = Messung als TEST-INVARIANTE**, nicht als Vorsatz. *Es gab Strategien, die live auf
    151 statt 261 Kerzen liefen.* Heute reißt eine Sperrklinke bei Abweichung.
12. **Die Prüfungen selbst prüfen:** Ein Test muss den **Grund** prüfen, nicht nur das Ergebnis.
    Gegenprobe: Härtung testweise ausbauen — wird der Test rot? Wenn nein, prüft er nichts.

## Offen (bewusst)

**Out-of-Sample-Pflicht** — jedes künftige „Ja" auf zurückgehaltenen Zeiträumen bestätigen
zu müssen, **steht in keiner Sperrklinke.** Bislang Disziplin ohne Zwang.

## Warum eine Bedingung leichter zu belegen ist als eine Strategie

Eine Bedingung (z. B. SPY>EMA200) wird über **alle** Signale einer Strategie gemessen und hat
deshalb viel mehr Beobachtungen als ein einzelner Einstieg. Das erklärt, warum unsere einzigen
zwei validierten Dinge Bedingungen sind — siehe [belegstand.md](belegstand.md).
