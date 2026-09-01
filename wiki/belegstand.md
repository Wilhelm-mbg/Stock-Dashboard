# Belegstand

> ## **Belegte handelbare Kanten: NULL.**
> Stand 01.09.2026. Das ist seit Wochen der Stand und er ist ehrlich.

## Widerlegt (gemessen tot)

| Sache | Zahl | Fundstelle |
|---|---|---|
| **News-Sentiment (Übernacht, Großwerte)** | **b = +0,0070 Pp/Score-Punkt, t = 0,31** — mitten im Placebo-Band. Selbst die Obergrenze des 90-%-Bandes liegt **Faktor 8,5 unter der CFD-Hürde** (und 4,1 unter der Aktienhürde). 33.307 Beobachtungen, 1.338 Tages-Cluster, 233.625 Meldungen. **Gilt für überlebende Großwerte über Nacht mit der Scorer-Funktion aus `quant.js` — nicht für Nebenwerte, andere Fenster oder andere Scorer.** | `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md` |
| Stunden-Strategie (Technik-Score) | **t = −11,6** — Kontraindikator, nicht nur wirkungslos | Gedächtnisprotokoll + `#hourlyEnabled` steht in der App als „widerlegt – abgeschaltet" |
| glockendruck-nacht | **Effekt stirbt in liquiden Werten** (≥1 Mrd $: H=1 +0,023 Pp, t 0,68) | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/`, Commit `6263f1b` |
| nachtstoss-umkehr | Gegenrichtung; Richtungssäule von den eigenen Autoren zurückgenommen | `studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/ERGEBNIS.md` |
| abgabedruck-nacht | — | `studien/vorregistrierung-2026-08-27-abgabedruck-nacht/ERGEBNIS.md` |
| Supertrend-Regelwerk | EMA-/RSI-Filter tragen null, halbieren aber die Signale | `studien/63-supertrend/` |
| Abschnittskanäle **als Bedingung** | −0,17 Pp, t = −4,1 → nur Anzeige | Gedächtnisprotokoll |
| Monatswende | war Marktzeitgeschäft, nicht Saisonalität | Gedächtnisprotokoll |
| Krypto-Dip-Modi, Bullenflagge | verlieren bzw. widerlegt | Gedächtnisprotokoll |
| Große Signalstudie | **0 von 51 Detektoren bestätigt**, 3.372 Tests | `studien/signalstudie-2026-08/` |

**Die Übernacht-Familie ist komplett durchgemessen: vier von vier NEIN.**

## Nicht entscheidbar (ruht — weder belegt noch widerlegt)

| Sache | Zahl | Fundstelle |
|---|---|---|
| `rsi2seit` (RSI2 im Seitwärtskanal) | Überschuss **+0,021 Pp je Signal**, real, unter jeder Beweisschwelle | Messprotokoll 2026-08-26 im Datenordner |
| Momentum-Buch | t fiel von 4,74 auf **0,74** nach Korrektur | `studien/momentum-nichtueberlappend/`, `studien/OBERGRENZEN-BEFUND.md` |
| Ergebnis-Drift-Buch | t 1,7–2,0 nach Zeitzonen-Korrektur | Protokolle im Datenordner |
| Trendwende-/Winkel-Detektor | Netto unentscheidbar | `studien/33-winkel-detektor/` |

## Nicht messbar (Werkzeug oder Daten reichen nicht)

| Sache | Grund | Fundstelle |
|---|---|---|
| ~~News-Sentiment~~ | ~~**⚠ ÜBERHOLT 01.09.2026** — das Urteil „es fehlt Faktor 75" galt für das App-Archiv (35 Beobachtungen an 10 Zeitpunkten). Auf der **Gratisstufe** des Anbieters stehen **2.367 Zeitpunkte** zur Verfügung → auf Großwerten ~22.600 Beobachtungen gegen nötige ~2.600 = **Faktor 8,7. Die Klasse ist messbar, die Messung steht aus.**~~ **ERLEDIGT 01.09.2026 abends: die Messung ist gelaufen, das Urteil lautet NEIN — Zeile jetzt unter „Widerlegt".** *Und die 2.367 Zeitpunkte waren zu optimistisch: das sind Handelstage, nicht Tage mit Nachrichten. Nutzbar sind **1.338** (Abdeckung vor Mai 2021 unter 10 %).* | Urteil: `studien/vorregistrierung-2026-08-31-news-sentiment/ERGEBNIS.md` · Überholung: `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md` · Korrektur: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/VORREGISTRIERUNG.md` Nachtrag 1 |
| Optionen, Value/Quality, Index-Aufnahmen, Dividendentermine, Saisonalität, Intraday | strukturell, siehe [datenquellen.md](datenquellen.md) | `studien/landkarte-2026-09-01/LANDKARTE.md` |

## Validierte BEDINGUNGEN (keine Strategien!)

Diese haben eine unabhängige Re-Validierung überlebt. **Sie sagen, WANN etwas erlaubt ist —
sie sind selbst kein Einstieg.**

- **SPY > EMA200 als Gate:** +0,098 Pp, **t = 2,6** — eingebaut
- **Regime-Zuteilung R-TREND:** **t = 3,2** — eingebaut (`rsi2seit` über der EMA200, Kapitulation darunter)

Siehe [messmethodik.md](messmethodik.md) für die Frage, warum eine Bedingung leichter zu belegen
ist als eine Strategie.
