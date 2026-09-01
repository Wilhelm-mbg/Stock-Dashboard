# Ergebnis — Überlebenslücke Weg 3, Mitglied 2: die Übernacht-Fassung

**Gemessen:** 01.09.2026 06:41 UTC (`lauf-2026-09-01-06-41.json`, Seed 20260827).
**Werkzeug:** `messe-weg3-uebernacht.js --kohorte`, unverändert wie committet vor dem
Lauf. **Familie:** `ueberlebensluecke-wege`, testsGesamt = 2, Schwelle |t| ≥ 2,2414
(aus der Maschine gedruckt). **Erster Anlauf 31.08. abgebrochen:** Wachhund archiv1d
Exit 1 (Archiv 2 Handelstage zurück) — kein ĉ gebildet; Lauf erst nach Nachzug.

## Urteil (R1–R3, nur Übernacht)

**R1 — Richtung belegt: POSITIV. Das Archiv untertreibt ÜBER NACHT.**
ĉ_gew = **+0,0462 Pp/Tag**, se 0,0022 (aus ersten Differenzen), **t = 21,39** ≥ 2,2414,
496 Paartage (9 Tage ohne Verschwundene), f̄ = 6,64 %, delta80 = 0,0067 Pp.

Damit sitzt der Löwenanteil der bei Mitglied 1 belegten Tages-Lücke (+0,0568 Pp,
t 20,99) in der Übernacht-Komponente: +0,0462 von +0,0568 Pp ≈ 81 %.

## Zahlen — Kandidat und Kontrollen in einer Tabelle

| Reihe | c_gew (Pp/Tag) | se | t | N Paartage | Status |
|---|---|---|---|---|---|
| **Übernacht (Primärendpunkt, beurteilt)** | **+0,0462** | 0,0022 | **+21,39** | 496 | **R1: Richtung belegt, positiv** |
| Intraday (NUR NACHRICHTLICH, §1) | +0,0140 | 0,0018 | +7,83 | 496 | kein Urteil, keine Schwelle |
| W1 Kunstinjektion (Soll −0,0044) | −0,0048 | — | −9,56 | 505 | Verhältnis 1,089 ∈ [0,7; 1,3] → bestanden |
| W2b Maschinen-Null (200 Ziehungen) | −0,0005 | sd 0,0055 | — | — | |Mittel| < Grenze 0,0042 → bestanden |

Nachrichtlich: c_roh (ungewichtet) Übernacht +0,6261 Pp, Intraday +0,2096 Pp;
σ_FD/σ_gew Übernacht 0,0481/0,0601 Pp.

## Wächter (alle grün, vor jedem ĉ)

- **W4-Selbsttest** 10/10; Eröffnungs-Plausibilität: Überlebende 1.074.815 Kandidaten,
  0 ungültig (0,00 % — belegte Null, Nachtrag 2); Verschwundene unter der 2-%-Schranke.
- **W3 Dropout** (Nachtrag 1): Quote S 100,00 % / V 99,52 %, Differenz 0,48 Pp
  (Grenze 10), beide über der 90-%-Untergrenze → ok.
- **Wachhund archiv1d** Exit 0; **Stabilität** (Nachtrag 3): Fingerabdruck beider Arme
  vor/nach dem Lesen unverändert.
- **Zerlegungs-Identität** (ÜN ∘ ID = Tag): max. Abweichung 8,9e−16 auf 1.150.841
  Beobachtungen (Ausweis, kein Residuum).
- Arme: 2.213 Überlebende genutzt (36 verworfen), 1.108 Verschwundene (56 verworfen).

## Deutungsgrenzen — Sperrliste §6, unverändert

Kein Kanten-Urteil, keine Reparatur- oder Gewichtungs-Empfehlung aus diesem Lauf.
Intraday nur nachrichtlich (die Familie hat 2 Tests; ein drittes Urteil gäbe es nur
mit neuer Familie). Kein Urteil über die 5-Mio-$-Deutungsgrenze hinaus (heiße Tage
der dünnen Seite, wie Mitglied 1). Es wurde keine Richtungserwartung registriert;
berichtet ist, was fiel.

**Konsequenz für Messungen (deskriptiv, keine Empfehlung):** Jede Messung von
Übernacht-Größen auf Überlebenden-Archiven sieht im Mittel +0,046 Pp/Tag zu wenig
Übernacht-Rendite der Gesamtpopulation; eine Reparatur ist hier nicht Gegenstand.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
