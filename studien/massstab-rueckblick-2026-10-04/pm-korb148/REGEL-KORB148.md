# Rückblick über fünf Jahre mit einem Korb wie in der App — Regel der Vorab-Rechnung des PM (04.10.2026)

**Stand:** festgelegt am 04.10.2026 um 09:35, **bevor** es eine Zahl gibt. Wilhelms Entscheid (Formular, 04.10.2026): „Ich rechne es selbst vor"
— der PM rechnet mit seinem geprüften Skript; ein zweiter, unabhängiger Lauf folgt nur, wenn Wilhelm auf die Zahl hin echtes Geld einsetzen will.

**Warum:** Der amtliche Rückblick (`../ERGEBNIS.md`, Auftrag Nr. 74) hat die Regel des Momentum-Buchs auf **alle** liquiden Aktien des Panels
angewandt (515 bis 923 zulässige Werte, Zielzahl 52 bis 92). Das Buch der App wählt aber aus **148** großen Werten (gezählt am 04.10.2026 im
Bestand der App: 148 Reihen in den Tagesdaten, alle über der Umsatzschwelle, Zielzahl 15). Die Annahme „weitgehend dieselbe Menge" im Auftrag
war falsch. Ein Rückblick auf der heutigen Liste der App wäre durch die Auswahl geschönt (die Liste kennt die Gewinner von heute). Diese Rechnung
nimmt deshalb den nächstliegenden Korb, der ohne Wissen von heute auskommt.

## Die Regel

Alles wie in `../REGEL.md` Teil A (§1 des Auftrags Nr. 74, Fassung 2) — Panel v2.2, Fenster 16.09.2021 bis 15.09.2026, das Buch mit den
Funktionen der App nachgespielt (`mfhandel.js`: `momentumZiel`, `planeUmschichtung`, `fuehreAus` mit 20 Basispunkten je Seite), Stichtag = Handelstag
vor dem Ausführungstag, Handel zur Eröffnung, nächster Ausführungstag der 63. Handelstag danach, Reihenende nach der Hauptregel des Prüfstands,
Gesamtertrag auf beiden Seiten, SPY aus dem Panel ohne Kosten, „schlägt den Markt" heißt Buch > SPY — **mit genau einem Unterschied:**

> **Der Korb.** An jedem Stichtag bekommt `momentumZiel` nur die **148 Aktienreihen mit dem höchsten Median-Tagesumsatz** (Median über die
> 20 Balken bis einschließlich Stichtag — dieselbe Größe, die `liquide.js` für die Schwelle rechnet) unter denen, die das Buch auf dem vollen
> Panel zulassen würde (mindestens 253 Zeilen, nicht veraltet, Stärke berechenbar, Median-Tagesumsatz ≥ 100 Mio $). Bei gleichem Umsatz
> entscheidet der Name. Auf diese 148 wird `momentumZiel` unverändert angewandt (Zielzahl `max(5, round(148 × 0,1))` = 15).

- **N = 148** ist die Zahl der Werte, die die App heute führt. Kein anderes N wird gerechnet.
- **Hauptzahl:** erster Ausführungstag 16.09.2021 (k = 0). **Zufallsbereich:** dieselbe Rechnung für k = 0 … 62 (Minimum, Median, Maximum des
  Abstands in Pp p. a., Zahl der Phasen mit Buch > SPY) und die Periodenstreuung für k = 0 (Mittel, Standardfehler, 95-%-Band mit dem t-Wert).
- **Rechner:** das Skript `pm-korb148.js` in diesem Ordner — der Nachspieler des PM, der die amtliche Hauptzahl unabhängig getroffen hat
  (−2,05 gegen −2,06 Pp p. a.). Seine Lesarten: Ausschüttungen werden am Ex-Tag **vor** dem Handel gutgeschrieben (amtlicher Lauf: danach);
  Anspruch hat, wer die Position über die Nacht hielt; Ex-Datum muss ein Panel-Handelstag sein. Zur Selbstprüfung rechnet das Skript im selben
  Lauf den breiten Korb (ohne die Beschränkung auf 148) für k = 0 mit — er muss +65,3 % gegen +81,2 % ergeben; das ist keine zweite Variante.
- **Ein Lauf.** Diese Datei und das Skript werden committet, dann wird gerechnet. Ein Fehler im Skript wird benannt, behoben und vermerkt; ein
  Ergebnis, das nicht gefällt, ist kein Fehler.

## Was die Zahl ist und was nicht

- Eine **Vorab-Rechnung mit einer einzigen Rechnung** — ohne den zweiten, unabhängigen Lauf, den die Regeln des Projekts für eine Messung
  verlangen. So wird sie überall bezeichnet.
- Sie beschreibt die Vergangenheit eines Korbs **wie** der der App (die 148 umsatzstärksten Aktien des jeweiligen Tages), nicht die Liste der App
  selbst. Nachrichtlich wird gezählt, wie viele der 148 Werte der App am letzten Stichtag in diesem Korb stehen.
- Kein Urteil über eine Kante, keine Wörter „belegt" oder „bestätigt". Fünf Jahre sind 20 Umschichtungen; bei 15 Werten im Korb schwankt das
  Ergebnis stärker als im breiten Korb.
