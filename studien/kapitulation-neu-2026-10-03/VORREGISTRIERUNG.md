# VORREGISTRIERUNG — Kapitulation V2 auf dem sauberen Archiv · **ENTWURF, NICHT REGISTRIERT** (03.10.2026)

Stand: Entwurf aus Auftrag Nr. 65. Gerechnet ist bisher nur die blinde Zählung (`MACHBARKEIT.md`, `ergebnis.json`). Registriert wird
erst nach Wilhelms Entscheid (Abschnitt 10) — dann mit Datum, Commit und ohne das Wort „Entwurf". Bis dahin bindet der Text an nichts.

## 1. Die eine Vorhersage

> Die Kapitulation in der Variante V2 **wie am 26.08.2026 gemessen** erzielt im **unberührten Fenster** (erster signalfähiger Tag 2016 bis
> 2023-09-25) einen **positiven** Überschuss über die Halteperiode von 26 Stundenkerzen gegen den Tagestopf, **nach** Kassa-Kosten.

Testzahl **1**. Keine Parametersuche, keine zweite Variante, kein anderer Zeitrahmen, keine andere Haltedauer. Schwelle |t| ≥ 1,96.

## 2. Definition (eingefroren, nichts davon wird angefasst)

- Auslöser: `quant.js` `einstiegSignal`, Zweig `kapitulation` (Zeilen 1837–1848), mit `reversionSignal` (1074–1093) und `kanalUeber`
  (ab 2419); Parameter aus `studien/messmaschine/strategien/kapitulation.js:28–29` (`ZTHR 2.0`, EMA 20).
- Umsatztor: Mittel der 20 Handelstage vor dem Signaltag ≥ 50 Mio $ (`kapitulation.js:36–58, 165–166`).
- Regime: SPY 60m nicht über der EMA200 der Stundenschlüsse, letzte Kerze streng vor dem Signal (`kapitulation.js:87–92, 168`) —
  SPY aus **demselben** Archiv.
- Vorlauf 261 Stundenkerzen, Einstieg zum Schluss der Signalkerze, Ausstieg nach 26 Stundenkerzen zum Schluss, nur Long, keine
  Abklingzeit (jede Signalkerze zählt, wie im Protokoll).
- Die Strategiedatei ist zeichengleich mit der Quelle im Protokoll; ändert sie sich vor dem Lauf, ist die Registrierung hinfällig.

## 3. Daten

Alpaca-Minutenarchiv `E:/Markt-Dashboard-Archiv/alpaca1m` mit den bereinigten Kopien (`alpaca1m-bereinigt`, bereinigt vor roh), nur
lesend; 7.299 Aktien (CS/ADRC), davon 4.993 verschwunden; nur reguläre Kerzen; Lebenszeit je Reihe; 60m aus 1m im Gitter ab 09:30 ET
(7 Kerzen, die letzte 30 Minuten). Leseregeln des Minuten-Messgeräts (`lesen.js`), Sperrtage ± 10 Handelstage um nicht angewandte
Maßnahmen. **Signaltag** = ET-Handelstag mit mindestens einem Signal im Universum, über alle Klassen.

## 4. Fenster (Vorschlag)

| Fenster | Rolle |
|---|---|
| erster signalfähiger Tag … 2023-09-25 | **Bestätigung** — auf 60m nie gemessen; geschätzt 403 … 493 Signaltage (sicher 154 … 683) |
| 2023-09-26 … 2026-08-24 | **Wiederholung** des alten Fensters auf sauberem Archiv, „alle" gegen „nur lebend" — berichtet, **kein Urteil** |
| ab 2026-08-25 | Rückhaltefenster, wächst mit dem Archiv; kein Urteil vor 100 Signaltagen |

Keine Entdeckungshälfte: gesucht wird nichts, die Entdeckung ist das alte Protokoll. Nachrichtlich: beide Hälften des
Bestätigungsfensters getrennt (das alte Protokoll wechselte zwischen den Hälften das Vorzeichen).

## 5. Urteilsgröße

Je Signal: Schluss[i+26] / Schluss[i] − 1, minus das Mittel des **Tagestopfs** (Zufallseinstiege desselben ET-Tags und derselben
Umsatzklasse unter den Kerzen, die V2 hätte nehmen dürfen; ohne Reihentage mit Signal). Tagesmittel gleichgewichtet über die Signale des
Tags, dann Mittel über die Signaltage. **se = die größte aus naiv, Hansen-Hodrick (Rechteckkern, Lag 3) und 5-Tage-Blöcken**
(`studien/querschnitt-pruefstand-2026-09-13/statistik.js`). **Netto** = brutto minus Kassa-Hürde der Klasse des Signaltags je Umlauf
(0,157 / 0,085 / 0,065 / 0,045 Pp). Nachrichtlich, ohne Urteil: dieselbe Zahl gegen die Kontrolle des alten Protokolls (Erwartung
Symbol × Stunde), die Einstiegslücke S9, und „nur lebend".

## 6. Tore, in dieser Reihenfolge — jedes vor dem Mittel

1. **Vollzählung, blind:** Signale und Signaltage über alle Reihen (kein Ertrag). Sie ersetzt die Stichproben-Schätzung.
2. **Nullpunkt:** Zufallseinstiege an den Signaltagen (wie in Phase 1) gegen den Tagestopf — |t| < 2, sonst Abbruch.
3. **Placebo ohne Kursbezug:** ein Signal aus Kürzel und Datum (Streuwert), gleiche Häufigkeit je Tag — |t| < 2, sonst Abbruch.
4. **Leck-Klinke:** an 20 Reihen feuert der Auslöser auf dem Präfix `bars[0..i]` genau dort, wo er auf der ganzen Reihe feuert; die
   Regime-Kerze liegt streng vor dem Signal. Jede Abweichung: Abbruch.
5. **Kosten vor dem Urteil:** die Hürde je Klasse und der Klassen-Mix der Signale stehen im Bericht, bevor das Mittel gerechnet ist.
6. **se vor dem Mittel:** der Lauf schreibt zuerst nur N und se der echten Signale auf die Platte. Ist MDE₈₀ = 2,80 × se **größer
   als 1,107 Pp**, lautet das Urteil „nicht entscheidbar" und das Mittel wird nicht geöffnet. Tor 1 der Mühle (se ≤ 0,138 Pp) wird
   ausgewiesen; ist es verfehlt, steht das neben dem Urteil. Tor 2 ist vorab verfehlt (delta80 weit über jeder Hürde) — die Messung
   prüft die Behauptung, nicht die Hürde, und sagt das.

## 7. Verschwundene Reihen

Jede Reihe wird bis zu ihrem letzten Balken geführt; ein Signal, dessen Reihe in der Haltedauer endet, **bleibt in der Messung**.
Buchung nach Prüfstand §3.6 mit der Grundtafel `studien/verschwundene-gruende-2026-09-12/`: Insolvenz und Zwangs-Delisting
**Totalverlust der Restposition**, sonst letzter Kurs. Pflicht-Empfindlichkeit: einmal Totalverlust auch für `unbekannt`/`freiwillig`,
einmal letzter Kurs für alle. Liegt die Differenz in der Größe des Effekts, wird das Ergebnis als davon abhängig berichtet.

## 8. Sperrliste

Die 47 Sätze aus `studien/querschnitt-pruefstand-2026-09-13/panel-stand.json` → `zaehler.splitAbgelehntListe`, Symbol × Ex-Tag:
gesperrt für Signale **und** Topf von 26 Stundenkerzen vor bis 261 nach der ersten Kerze des Ex-Tags. Die Kopien werden nicht neu gebaut.

## 9. Satzformen der Urteile

- **bestätigt:** „V2 netto +x Pp je Signaltag, Band [a; b] über null, N Signaltage, Placebos gehalten." — nur wenn a > 0.
- **nicht bestätigt:** „Band [a; b] schließt null ein bei MDE₈₀ = m ≤ 1,107 Pp; ein Effekt der behaupteten Größe wäre aufgefallen."
- **in der behaupteten Größe zurückgewiesen:** „obere Grenze b < 1,107 Pp."
- **nicht entscheidbar:** „MDE₈₀ = m > 1,107 Pp bei N Signaltagen; das Mittel wurde nicht geöffnet."

Jeder Satz trägt N, se, MDE₈₀, den Anteil der Signale auf Verschwundenen und die Zahl der Totalverlust-Buchungen. Aussagen über
Kosten-Tauglichkeit fallen nicht; dafür ist die Messung zu grob (Tor 2).

## 10. Was Wilhelm entscheiden muss

1. **Phase 2 ja oder nein** — bei Urteil „am Rand": ein Bau-Auftrag (150–200k Token) plus ein Lauf von rund 2 Stunden.
2. **Vollzählung vorab?** Zwei Stunden, blind, macht aus „403 … 493" eine Zahl, bevor über 1. entschieden wird.
3. **Fenster wie in §4** (unberührtes Fenster als Bestätigung, altes Fenster nur als Wiederholung)?
4. **Kontrolle:** Tagestopf (schärfer, neu) als Urteilsgröße — oder die Symbol-Stunden-Erwartung des alten Protokolls (vergleichbar,
   aber rund 5 Pp Streuung je Signaltag)?
5. **Abbruchregel §6.6** (kein Blick auf das Mittel, wenn MDE₈₀ > 1,107 Pp) und die **Totalverlust-Regel §7** so übernehmen?
