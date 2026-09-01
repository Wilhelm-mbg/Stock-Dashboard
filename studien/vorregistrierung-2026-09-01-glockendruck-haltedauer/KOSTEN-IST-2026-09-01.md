# Kosten-Ist-Stand 01.09.2026 (Teil 1 des Auftrags „Kosten unter die Kante")

**Quelle:** Store der App, nur lesend (`kostenmessung.json`, `depot.json`,
`depot_vor_reset.json` — dedupliziert über at|sym). **Jede Zahl hier trägt das
Etikett „vorläufig — Freigabeschwelle unerfüllt".**

## a) Bestand

**42 Runden gesamt, davon 20 Aktien** (22 Krypto, getrennt geführt), über **3 Tage**
(25.08., 27.08., 01.09.) — aber **16 der 20 stammen aus EINER Minute**
(25.08. 13:31–32 UTC, die alte Klickfolge in der teuersten Tagesminute). Echt neu
seit dem Messautomat (v8.35): **4 Runden** (25.08. 18:22, 27.08. 15:38 ×2,
01.09. 16:01), mit gewürfelter Uhrzeit. **Marktlagen: nur `trend-auf` erfasst**
(3 Runden), 17 ohne Lagen-Stempel → Freigabeschwelle (≥2 Tage UND ≥2 Lagen, je
Lage ≥10) **unerfüllt** — es fehlt die zweite Lage komplett.

## b) Zusammensetzung — wo die Spiegelung gelingt und wo nicht

Gelungen: 15 Symbole, **ausnahmslos Mega-Caps** (AAPL 5×, MSFT 2×, je 1× NVDA,
AMZN, META, GOOGL, TSLA, AMD, AVGO, MU, INTC, QCOM, ASML, TSM, ARM). Kleinster
Tagesumsatz der Messbasis: **ARM, 1,6 Mrd $** (Median der Basis: 10 Mrd $).
Fehlschläge: **RC_NOT_ENOUGH_MARGIN 7×** (QCOM, TSLA, MU, ABBV, BTCUSD — die
Margin-Sperre der Erinnerung vom 25.08. wirkt weiter, der Automat halbiert zwar
nach, kommt aber nicht immer durch), **„Kein Markt gefunden" 1×** (MS — selbst
Large Caps fehlen dem Broker teils). Werte unter ~1 Mrd $ Umsatz kommen in der
Messreihe **gar nicht vor**.

## c) Kostenverteilung und die ehrliche Antwort

| Klasse (Median-Tagesumsatz) | Datenlage | je Umlauf |
|---|---|---|
| ≥ 1 Mrd $ (einzige gemessene) | 20 Runden | **Median 0,0857 % · p75 0,1103 % · max 0,2525 %** |
| ≥ 1 Mrd $, notierte Spannen | 15 Symbole | Median 0,049 %, aber ARM 0,137 / INTC 0,126 / QCOM 0,110 |
| 250 M–1 Mrd / 50–250 M / 5–50 M | **0 Runden, 0 Spannen** | unbelegt; Roll-Schätzer des Archivuniversums ~0,93 Pp (leerbuch-tageskerzen) |

glockendruck-Auswahl (letzte ~250 Tage, 108.362 Symbol-Tage): Umsatz-Median
**69 Mio $** (p25 26, p75 203); **41 % der Auswahl in 5–50 Mio, nur 4,8 % ≥ 1 Mrd.**

> **Antwort: Für die gemessene Mrd-Klasse ist 0,10 % ≈ passend** (zwischen Median
> 0,086 und p75 0,110; schon dort reißen einzelne Werte auf 0,13–0,25 %).
> **Für das glockendruck-Universum ist 0,10 % optimistisch:** die Messbasis ist im
> Umsatz ~150-fach stärker als die Auswahl, die Spanne wächst schon innerhalb der
> Mrd-Klasse um Faktor 3–4 zum unteren Rand, und der Roll-Schätzer des breiten
> Archivs liegt eine Größenordnung höher. Dazu ist die Übernachtfinanzierung
> (glockendruck hält über Nacht) in keiner Runde enthalten — die Runden schließen
> sofort.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
