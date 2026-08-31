# Ergebnis — Erste Messung des News-Sentiments (Übernachtertrag)

**31.08.2026.** Vorregistrierung im selben Ordner, Lauf `messe-news-sentiment.js`,
Rohzahlen `lauf.json`. Store und Kursarchiv wurden **nur gelesen**; gearbeitet wurde
auf den Kopien `store-kopie/` (17 Dateien) und `archiv-kopie/` (17 Dateien).

## Die Antwort

> **Sagt der Sentiment-Score den Übernachtertrag voraus — ja, nein, oder nicht messbar
> mit diesen Daten?**
>
> ## NICHT MESSBAR.
>
> Und zwar nicht knapp: Das Archiv trägt **35 Beobachtungen an 10 Zeitpunkten**. Um
> eine Kante in Größe der Kostenhürde (0,10 %) von null zu unterscheiden, bräuchte es
> **rund 2.600 unabhängige Symbol-Tage**. Es fehlt der Faktor **75**.

Das ist kein Nein. **Der Score ist nach wie vor weder belegt noch widerlegt** — er
trägt weiterhin 35 % Gewicht im Handels-Score, und diese Messung ändert daran nichts.
Sie sagt nur, was das Archiv nach zwölf Tagen hergibt: zu wenig, um die Frage
überhaupt zu stellen.

## Was das Archiv hergibt

| Größe | Wert |
|---|---|
| Symbole | 17 (16 Groß-Tech + XOM) |
| Meldungen gesamt | 337 |
| Zeitspanne | 10.08.–21.08.2026 |
| Symbol-Tage mit ≥ 1 Meldung bis Schluss | 44 |
| **davon Score ≠ 0 → Beobachtungen** | **35** |
| Zeitpunkte (Handelstage) | 10 |
| davon am 21.08. | 16 Beobachtungen / 232 Meldungen |
| Vorzeichen | 30 positiv / 5 negativ |
| Deckel 400 je Symbol | nicht erreicht |

Zwei Dinge stechen hervor. **Erstens** stammen 232 der 337 Meldungen vom 21.08. und 70
vom 20.08. — das ist das Abrufverhalten der App, nicht die Nachrichtenlage. **Zweitens**
liegt die Hälfte aller Beobachtungen auf diesem einen Tag; im Querschnitt eines
einzigen Tages misst man aber vor allem den Tag, nicht das Symbol. Deshalb wurde
tagesbereinigt gerechnet (Querschnittsmittel des Tages abgezogen) und der Standardfehler
**je Tag geclustert**.

## Die Tabelle — echte Zahlen, Placebo und Positivkontrolle nebeneinander

Endpunkt: Steigung *b* der Regression des tagesbereinigten Übernachtertrags
(Eröffnung(T+1)/Schluss(T) − 1, in Pp) auf den Sentiment-Score, se je Tag geclustert.

| Zeile | b (Pp je Score-Punkt) | se | t |
|---|---|---|---|
| **ECHT (nachrichtlich, kein Urteil)** | **+0,336** | 0,365 | 0,92 |
| Placebo, Mittel aus 200 Permutationen (Saat 20260831) | −0,034 | 0,659 | −0,05 |
| Positivkontrolle rauschfrei (Soll +0,50) | **+0,500000** | — | — |
| Positivkontrolle, ein Zug (Soll +0,50) | +1,477 | 0,917 | 1,61 |
| Positivkontrolle, Mittel aus 2.000 Zügen (Soll +0,50) | **+0,5024** | 0,0230 | — |

**Placebo-Band (5./95. Perzentil): −1,140 … +1,125 Pp/Punkt.** Die echte Schätzung
**+0,336 liegt mitten in diesem Band** — sie ist von einer zufälligen Zuordnung der
Schlagzeilen zu Symbol-Tagen nicht zu unterscheiden.

**MDE der Steigung: 2,892 Pp/Punkt ungeclustert, 5,410 Pp/Punkt je Tag geclustert.**
Bei einer Score-Streuung von sx = 0,300 entspricht die echte Schätzung von +0,336
einem Ertragsunterschied von rund 0,10 Pp über eine Score-Standardabweichung — also
exakt Kostenhürden-Größe, und damit rund **eine Größenordnung unter dem, was diese
Anordnung auflösen kann**.

## Die drei Pflicht-Kontrollen

**(a) Placebo** — bestanden. Mittel −0,034 (Soll null), Band symmetrisch um null.

**(b) Positivkontrolle** — bestanden, aber erst nach einer Korrektur an der Kontrolle
selbst (Nachtrag 1 der Vorregistrierung, offen deklariert). Die angemeldete Fassung
(ein Zug, ±30 %) lieferte +1,477 und hätte auf »totes Werkzeug« erkannt. Tatsächlich
rechnet das Geschirr **exakt** richtig (rauschfrei 0,500000) und ist **unverzerrt**
(2.000 Züge: 0,5024 ± 0,0230). Der Einzelzug streut mit sd 1,027; **nur 11,5 % aller
Züge treffen die eingebaute 0,50 auf ±30 %** — die angemeldete Regel konnte bei dieser
Anordnung mit 88,5 % Wahrscheinlichkeit gar nicht bestehen.

> **Das ist der lehrreichste Teil des Laufs.** Eine Anordnung, die einen *eingebauten*
> Effekt vom Fünffachen der Kostenhürde in 88,5 % der Fälle verfehlt, kann über einen
> echten Effekt in Kostenhürden-Größe nichts sagen. Die durchgefallene Positivkontrolle
> war kein Werkzeugdefekt, sondern die Blindheit selbst — sichtbar gemacht.

**(c) Look-ahead** — sauber. **377 Zeitstempel geprüft, 0 nach Handelsschluss.** Der
Score wird mit `nowMs` = Schluss T gebildet, sodass die Frische-Gewichtung
(≤ 6 h / ≤ 24 h / ≤ 48 h) rückwirkend genau das sieht, was sie live gesehen hätte.
Verwendet wird die **echte** `Q.sentiment()` aus `quant.js` per `require` — kein
Nachbau —, gefüttert mit den 12 jüngsten Schlagzeilen bis Schluss T, weil
`getSymbolNews()` live höchstens 12 Feed-Einträge liefert (`depot.js`).

## Bekannte Verzerrungen — etikettiert, nicht wegdiskutiert

1. **Auswahl.** Das Archiv enthält nur Symbole, die die App beobachtet hat: 16
   Groß-Tech-Werte plus XOM. Keine Zufallsstichprobe, kein Querschnitt. **GOOG und
   GOOGL sind dieselbe Firma** — zwei Zeilen, eine Beobachtung.
2. **Zeitstempel.** `archiviereNews` schreibt `it.t || Date.now()`: die `pubDate` des
   Feeds, ersatzweise den **Abrufzeitpunkt**. Wo die pubDate fehlte, ist der Stempel
   systematisch **später** als das Erscheinen — der Score sieht die Nachricht dann
   später, als der Markt sie sah.
3. **Beobachtungsfenster.** Archiviert wird nur, während die App läuft. Die
   Ballung auf dem 20./21.08. ist Abrufverhalten. **Seit dem 21.08. wurde nichts mehr
   archiviert** (Stand-Feld der Store-Dateien) — das Archiv läuft derzeit *nicht* mit.
4. **Score-Verteilung.** 30 positiv gegen 5 negativ. Die Schlagwortlisten treffen
   überwiegend positiv; die negative Seite ist zu dünn für einen Vorzeichenvergleich.

## Was die Frage beantwortbar machen würde

Kein Urteil, nur die Rechnung: Bei ~2.600 nötigen unabhängigen Symbol-Tagen und
17 beobachteten Symbolen wären das **rund 155 Handelstage mit einer Meldung je Symbol
und Tag** — gut sieben Monate durchgehender Archivierung beim heutigen Umfang, und
das nur, wenn die Beobachtungen zeitlich streuen statt sich auf einzelne Tage zu
ballen. Mit mehr Symbolen sinkt die Zahl der nötigen Tage entsprechend.

**Der einzige Engpass ist die Zeit, nicht das Werkzeug:** Look-ahead ist sauber, das
Geschirr rechnet exakt und unverzerrt, die echte Scorer-Funktion ist eingebunden. Der
Lauf ist ohne Änderung wiederholbar, sobald das Archiv mehr trägt.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
