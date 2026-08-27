# Ergebnis — Bauform-Sweep: Yahoo rechnet ein, was es meldet. Das Problem sitzt im Ereignis-Katalog.

**Gemessen:** 27.08.2026 ~19:1x, Rolle Berechnungen (Paket vom Analytiker übernommen,
PM-Auftrag nach der Auflösung der Nachtläufe). Werkzeug `messe-bauform.js`,
Rohdaten `lauf-*.json`. **Nichts geändert — Zählen vor Ändern.**

## Die Frage

Zeigen RGR, SITC, B, BYND dasselbe Muster: **Yahoo führt ein Split-Ereignis im
`events`-Feld, passt die Historie aber nicht an?** Gegenkontrolle AAPL/NVDA.

## Antwort: Nein. Die Bauform ist konsistent.

| Ereignisse gemeldet | eingerechnet (gesund) | nicht eingerechnet | Sprung da, Faktor passt nicht |
|---|---|---|---|
| **26** | **20 = 76,9 %** | **0 belastbar** | 5 |

**Gegenkontrolle bestanden** (PM-Auflage): AAPL und NVDA haben ein gefülltes
`events`-Feld (5 bzw. 6 Splits) — der Sweep misst die Bauform und nicht die
Anwesenheit eines Feldes. Beide Kontrollreihen sind sauber: bei AAPL alle drei
prüfbaren Ereignisse eingerechnet, bei NVDA vier von sechs.

**Die sechs Auffälligen sind Marktbewegungen, keine Anpassungsfehler.** Der einzige
formale Treffer — SITC 10.03.2009, Ereignisfaktor 0,9376 — ist **nicht belastbar**:
Die relative ±10-%-Toleranz spannt dort ein **18,8 Prozentpunkte breites** Band
(−15,6 % bis +3,1 % Tagesbewegung), und der 10. März 2009 war ein Finanzkrisentag;
die gefundene Bewegung von −11,9 % fällt hinein, ohne etwas zu belegen. Das ist
dieselbe Trennschärfe-Grenze, die heute schon bei den kleinen Faktoren gemessen
wurde: **Bei Ereignisfaktoren nahe 1 ist eine relative Toleranz wertlos.** Die
übrigen fünf (NVDA 2000/2001, AAPL 2000, RGR 1981, BYND 2026) haben enge Bänder
weit weg von der gefundenen Bewegung — sie erscheinen nur, weil meine
Sprung-Schwelle von 8 % bei volatilen Werten normale Tage markiert. Kein Urteil
hängt daran.

## Der eigentliche Fund: die Diagnose dreht sich um

**RGR 24.10.2025 (374:1000) ist als »eingerechnet« gewertet — kein Sprung in der
Historie.** Yahoo hat die Giftpillen-Rechtedividende also nicht nur als Split
**gemeldet**, sondern die Historie auch konsequent danach **umgeschrieben**.

Damit verschiebt sich, wo der Defekt sitzt: **nicht in der Verarbeitung, sondern im
Ereignis-Katalog.** Yahoo arbeitet sauber — es rechnet zuverlässig ein, was in
seinem Katalog steht. Der Schaden entsteht, weil dort ein wirtschaftlich
wertloses Ereignis als 374:1000-Split geführt wird. **Eine Kennzeichnung über das
`events`-Feld würde deshalb nicht helfen**, den RGR-Fall zu finden: Dort ist Feld
und Historie in Übereinstimmung — nur beide falsch.

## Grenzen

- Sechs Reihen, 26 Ereignisse. Keine Grundgesamtheits-Aussage über den Bestand.
- Die Prüfung erkennt »nicht eingerechnet« nur, wenn der Sprung ≥ 8 % ist und der
  Faktor im ±10-%-Band liegt. Ereignisse unter ~8 % Kurswirkung sind **strukturell
  nicht prüfbar** (Kleinfaktor-Befund von heute Nachmittag).
- **Werkzeugfehler des ersten Laufs, dokumentiert:** Bei `range=max` liefert Yahoo
  stillschweigend **Monatskerzen** (NVDA: 332 für 27 Jahre). Der erste Lauf verglich
  deshalb Monatsbewegungen mit Split-Faktoren und meldete 25 von 26 Ereignissen als
  »nicht eingerechnet« — ein Artefakt, das wie ein dramatischer Befund aussah.
  Verraten hat es die Kerzenzahl in der eigenen Ausgabe. Der Sweep holt jetzt je
  Ereignis ein enges Tagesfenster; nichts davon wurde je berichtet.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
