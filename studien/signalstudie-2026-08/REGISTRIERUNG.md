# Große Signalstudie — Registrierung (22.08.2026, vor der ersten Rechnung)

Dieses Dokument wird **vor** jeder Messung festgeschrieben. Was hier nicht steht, darf
nachher nicht als Befund gemeldet werden. Abweichungen werden als solche gekennzeichnet.

## Frage

Welche Signale — einzeln, kombiniert oder an Bedingungen geknüpft — liefern auf der
heutigen Datenbasis einen Überschuss, der nach Kosten trägt? Und: Ist die algorithmische
Erkennung selbst die Grenze?

## Warum das Design so streng ist

Die Studie fragt nach dem Besten aus hunderten Kandidaten. Bei 49 Tests lag die Chance auf
einen zufälligen |t| > 2 schon bei 92 % (Dichte-Studie). Heute hat die Neubewertung von #33
gezeigt, was passiert, wenn die Auswahlmenge in der Bestätigungsmenge steckt: +0,24 wird zu
+0,07. Deshalb:

1. **Entdeckung und Bestätigung auf getrennten Tagen.** Die Auswahl geschieht
   ausschließlich auf der Entdeckungsmenge. Die Bestätigungsmenge wird genau **einmal**
   angefasst, am Ende, mit der vorher fixierten Kandidatenliste.
2. **Jeder Test wird gezählt** — auch die verworfenen Screening-Tests. Die Bonferroni-Schwelle
   auf der Bestätigungsmenge gilt für die Zahl der dort geprüften Kandidaten; die
   Entdeckungsphase ist reines Ranking ohne Signifikanzanspruch.
3. **Tag ist die Clustereinheit.** t-Werte über Tage, nicht über Symbole oder Signale.
4. **MDE vor dem Urteil.** Liegt die gesuchte Kante unter der Auflösung, heißt das Urteil
   „unentschieden", nicht „widerlegt".
5. **Kontrolle je Symbol × Tageszeit-Versatz, leave-one-day-out** (Intraday) bzw. je Symbol
   × Kalender, Drift herausgerechnet (60m).
6. **Kosten:** 0,10 % je Umlauf als Arbeitsannahme; die Spannen-Messung ab 24.08. liefert den
   ersten echten Wert und wird nachgetragen.

## Datenbasis (Stand 22.08.2026, 22:30)

| Tier | Zeitrahmen | Werte | Zeitraum | Handelstage | Quelle |
|---|---|---|---|---|---|
| A | 1m | 88 | 26.05.–21.08.2026 | 62 | Capital (bis ~11./13.08.), dann Yahoo |
| A | 5m, 15m | 130 / 167 | ~26.05.–21.08.2026 | ~62 | überwiegend Yahoo |
| B | 60m | 122 | ~Sep 2023–21.08.2026 | ~740 | Yahoo |

**Split Tier A (Intraday):** Entdeckung = Handelstage 1–41 (26.05.–22.07.), Bestätigung =
Tage 42–62 (23.07.–21.08.). Die Bestätigungsmenge enthält bewusst die V-Erholung ab 29.07.
— ein Regimewechsel ist der härteste Test.
**Split Tier B (60m):** Entdeckung = erste 2/3 der Handelstage je Symbol, Bestätigung =
letztes Drittel (≈ 250 Tage, reicht bis 21.08.2026).

**Ehrlich vorab:** Tier A hat auf 21 Bestätigungstagen bei SD ≈ 0,45 Pp eine Auflösung von
≈ 0,20 Pp. Intraday-Kanten unter 0,2 Pp kann diese Studie **nicht bestätigen**, nur
ranken. Tier B kann Effekte ab ≈ 0,06 Pp auflösen.

## Kandidaten (vollständige Liste, nichts kommt nachträglich hinzu)

**Einzelsignale (Detektoren als reine Funktionen aus quant.js / depot.js):**
rsi2, rsi2seit (RSI2 im Seitwärtskanal), kapitulation, reversion, pullback, donchian,
squeeze, kanaltrend, wave, orb, wendepunkt-basis, trendwechsel (Winkel), signalCross
(MA-Kreuzung), vwap-Abstand, momentum (Bücher), drift (Ertragstermin-Drift).
Jeder mit seinem **Standardparameter aus der App** — kein Parameterraster in der
Entdeckung. (Ein Raster wäre ein weiterer Multiplikator; Parameter, die live laufen, sind
die einzigen, die zählen.)

**Bedingungen (je Signal binär geprüft):**
Regime (Index über/unter EMA200), Tageszeit (Eröffnung 0–60 Min / Mitte / Schluss
letzte 60 Min), Wochentag, Vola-Regime (realisierte 20-Tage-Vola des Symbols über/unter
Median), Liquiditätshälfte (obere/untere 50 % nach Umsatz), Ertragsterminnähe (±2 Handels-
tage), Kanal vorhanden (Abschnittskanal gültig), Technik-Score-Terzil, Vortagsrendite-Terzil.

**Kombinationen:** Konjunktion zweier Einzelsignale im selben 30-Minuten-Fenster
(gleiche Richtung). Nur Paare, deren beide Glieder in der Entdeckung einzeln t(Tag) > 0,5
in derselben Richtung zeigen. Die Zahl der so gerechneten Paare wird ausgewiesen.

**Horizonte:** 1 h, 3 h, Tagesschluss (Intraday); 1 Tag, 3 Tage, 5 Tage (60m).
**Richtungen:** Long und Short getrennt.

## Auswahlregel für die Bestätigung (vorab fixiert)

Aus der Entdeckung kommen in die Bestätigung:
- die **fünf** besten Einzelsignal-Konfigurationen (Signal × Richtung × Horizont) nach t(Tag),
- die **fünf** besten Bedingungs-Konfigurationen (Signal × Bedingung × Richtung × Horizont),
- die **drei** besten Paare,
- **plus** die bereits belegten Kanten (rsi2seit, Kapitulation, Momentum, Drift) als Referenz.

Also höchstens 13 + 4 = 17 Kandidaten → Bonferroni-Schwelle |t| ≈ 2,9 zweiseitig auf der
Bestätigungsmenge. Die belegten Kanten werden separat ausgewiesen (vorab benannte
Hypothesen, keine Scan-Funde).

## Korrektheit (Phase 1, vor jeder Messung)

Jeder Detektor wird adversarisch auf Zukunftsblick geprüft: Präfix-Probe (Lauf auf
bars[0..i] muss dasselbe Signal liefern wie der Lauf auf der ganzen Reihe), laufende
Kerze (fertigeBars), Parametergleichheit Live vs. Messung, Sitzungsfilter mit Wochentag.
Ein Detektor, der die Präfix-Probe nicht besteht, wird repariert oder ausgeschlossen —
**vor** der Messung, und das wird dokumentiert.

## Produkt- und Kostenfrage (Phase 5)

Für jeden Bestätigungs-Überlebenden: Break-even-Kosten = Brutto-Überschuss. Dagegen die
Kostenseite je Produkt: Basiswert/Aktie (Spanne liquide Namen ≈ 1–3 Bp + Gebühr),
CFD (Spanne ab 24.08. gemessen + Finanzierung über Nacht), Optionsschein (Modell der App:
Spanne 1–3 %, Aufgeld, Theta), US-Option (Spanne je nach Moneyness). Ergebnis: welches
Produkt für welche Haltedauer und Kantengröße überhaupt in Frage kommt.

## Hybrid-Frage (Phase 6)

Ob ein Mensch Muster erkennt, die der Algorithmus nicht fasst, lässt sich **nicht aus
vorhandenen Daten** beantworten — es gibt keine Aufzeichnung menschlicher Einstiege. Phase
6 liefert deshalb (a) eine Messung, *wo* die Algorithmen versagen (Fehlsignal-Cluster:
welche Marktphasen, welche Muster), und (b) ein Protokoll für einen Blindtest, in dem
Felix und Wilhelm Einstiege auf verdeckten Charts markieren, ohne das Ergebnis zu sehen.
Das ist die einzige ehrliche Antwort auf die Hybrid-Frage; alles andere wäre Meinung.

## Was NICHT Teil dieser Studie ist

Parameter-Optimierung (bewusst), Krypto (widerlegt), 1-Minuten-Gewichtung (widerlegt),
Stunden-Strategie (widerlegt, archiviert).
