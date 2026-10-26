# Kandidaten blind — Übersicht (04.10.2026)

Drei vorab festgelegte Regeln, ohne Kursdaten geschrieben; gemessen wird später lokal. Keine Zahl aus unseren Daten, Erwartungen sind Urteile aus der Literatur (Belege: `belege/`). Keine Anlageberatung.

1. **`sektor-momentum`** — 3 stärkste der 11 SPDR-Sektor-ETFs nach 12-Monats-Rendite, Takt 21 Tage, gleich gewichtet. Beleg: Moskowitz–Grinblatt 1999, Faber 2010 (aus Sekundärquellen; nach 2000 laut Arnott et al. 2023 deutlich schwächer). Erwartung: −4 bis +3 Pp p. a., Chance „schlägt SPY" 30–40 %. Hauptrisiko: ETF-Reihen evtl. nicht im Panel (dann „nicht ausführbar"); Takt 21 braucht Simulatoränderung und größere t-Tabelle.
2. **`qualitaet-gpa`** — Novy-Marx 2013, Bruttogewinn/Bilanzsumme, obere 30 liquide Nichtfinanzwerte, jährlich. Beleg: Large-Cap-Spread 0,28 %/Monat (t 2,05, Long-Short, 1963–2009), nach 2007 nicht schwächer. Erwartung: −3 bis +1,5 Pp p. a., Schwerpunkt −1. Hauptrisiko: **nicht unabhängig vom verworfenen Mehrfaktor-Lauf** (dort war `ertragskraft` dieselbe Größe); nur 4–5 Perioden je Fenster, Auflösung 6–10 Pp.
3. **`aktionaersrendite`** — (Dividenden + Rückkäufe − Emissionen)/Marktkapitalisierung, obere 30 liquide Nichtfinanzwerte, 63 Tage. Beleg: Boudoukh et al. 2007; Realwelt-ETFs lagen hinter dem Index (SYLD −1,7, PKW −0,6 Pp p. a.). Erwartung: −2 bis +1 Pp p. a., Mitte −1. Hauptrisiko: Value-Tilt gegen Mega-Cap-Wachstum; Split-Falle bei der Aktienzahl (SEC unbereinigt, Kurse bereinigt).

**Auswahl:** Saisonalität (≈5 %, Umschlag ≈100 %/Monat), Dual Momentum (10–20 %, eher Risikoschutz), 52-Wochen-Hoch und Residual-Momentum (kaum unabhängig von 11-1) ausgeschieden.
**Ehrlich:** Keine Regel hat einen Long-only-/Large-Cap-/Netto-Nachbau nach 2010 gegen SPY; die Auflösung (3–5 Pp je Periode) lässt für alle drei am ehesten „nicht entscheidbar" erwarten. Tests: 76 / 120 / 163 Prüfungen grün (`node <ordner>/test.js`). ESLint lief hier nicht (Paket `globals` fehlt).
