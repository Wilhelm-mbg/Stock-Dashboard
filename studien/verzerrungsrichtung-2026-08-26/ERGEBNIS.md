# Ergebnis — Richtung und Stärke der Überlebensverzerrung

**Gemessen:** 26.08.2026, ~22:2x, Rolle Berechnungen. **Ein** Kohortenlauf, wie
vorregistriert (`../vorregistrierung-2026-08-26-verzerrungsrichtung/VORREGISTRIERUNG.md`
mit Nachträgen 9–12, alle VOR dem Lauf committet). Werkzeug:
`messe-verzerrungsrichtung.js`, Seed 20260826, Rohdaten `lauf-*.json` daneben.
**Wächter zuerst, alle bestanden** (W1 Positivkontrolle: eingebauter −40-%-Effekt zu
0,903 wiedergefunden; W2b Maschinen-Null −0,0036/+0,0033 Pp; Z9-Prüfungen grün).
Auftrag: Wilhelm 26.08. 17:40 (c), PM-Freigabe 19:15; Kohortenlauf auf Wilhelms
»weiter« (~22:15), nachdem der PM-Chat auf zwei Anfragen still blieb.

---

## Die Urteile (Familie 5 Tests, Schwelle |t| ≥ 2,576 — Regeln R1–R6, unverändert)

| Test | Urteil |
|---|---|
| Richtung Z1 (Dip-Rutsch) | **Richtung belegt: NEGATIV — das Archiv beschönigt** (t = −6,19) |
| Richtung Z2 (Monatsende) | im Fenster ohne messbare Richtung (t = 0,88, nur 23 Paartage) |
| Materialität kapitulation | im Fenster unerheblich (obere Grenze 0,61 < 0,84 Pp = delta80Prot/2) |
| Materialität **rsi2seit-mcp** | **Verzerrung materiell** — ΔB_Quer = −0,48 Pp ≥ delta80Prot 0,077 Pp (Faktor ~6) |
| Materialität monatsende-kauf | im Fenster unerheblich — **Bezug unter Vorbehalt (17-Tage-Lauf,** `messmaschine.js:1266`**)** |

## Die Zahlen

| Sonde | c (gepaart, gewichtsfrei) | se_NW | t | Paartage | w̄ | Sockel k | c_jenseits |
|---|---:|---:|---:|---:|---:|---:|---:|
| Z1 Dip-Rutsch (H=4, Lücke) | **−3,7815 Pp** | 0,6104 | **−6,19** | 450 | 12,67 % | −0,145 | −3,64 |
| Z2 Monatsende (H=1, Lücke) | +0,0296 Pp | 0,0337 | 0,88 | 23 | 6,83 % | +0,050 | −0,02 |
| Z0 breit (Kontext, kein Urteil) | −0,1250 Pp | 0,0581 | −2,15 | 476 | 6,77 % | — | — |
| Z9 Mittwoch (Maschinenprüfung) | −0,1318 Pp | 0,0705 | −1,87 | 97 | 6,75 % | — | — |

Z9-Kohortenprüfung bestanden: |c_Z9 − c_Z0| = 0,0067 < 0,199 Pp. Stutzung
(Winsorisierung 1 %/Seite) und gefallene Signale je Sonde stehen im `lauf-*.json`.
**Empfindlichkeit** (Einstieg am Signalschluss, teilt den Kurs, NICHT beurteilt):
Z1 −4,28 Pp (t = −7,33), Z2 −0,11 (t = −1,89) — die beurteilte Lücken-Variante ist
die konservativere; der Befund hängt nicht an der Einstiegskonvention.

## Was das in Klartext heißt

1. **Nach einem Absturz (≥ −10 % in 5 Tagen) fallen Werte, die später verschwinden, in
   den nächsten 4 Handelstagen um ~3,8 Punkte weiter, wo Überlebende sich fangen.**
   Ein Archiv, das nur Überlebende führt, zeigt Dip-Kauf-Strategien deshalb
   systematisch **zu schön**. Fast der ganze Effekt ist Sterbepfad, nicht
   Kleinheit (Sockel nur −0,15 von −3,78).
2. **Für `rsi2seit-mcp` ist das materiell:** die implizierte Verschiebung (−0,48 Pp bei
   historischem Lückenanteil 12,7 %; im Fenster gemessen w̄ = 12,7 % ⇒ ΔB_Fenster
   −0,48 Pp, identisch) übertrifft dessen Auflösung delta80 um Faktor ~6. Die
   E1-Warnung dieses Protokolls hat jetzt Zahl und Vorzeichen; jedes künftige Urteil
   der Dip-Familie auf Überlebenden-Daten muss sie ausweisen. **Ü1-Vorbehalt im selben
   Satz:** gemessen am Tages-Zwilling, auf 60m übertragen, nicht gemessen.
3. **Für `kapitulation` gilt dieselbe Richtung, aber sein Messwerk ist zu grob**, als
   dass −0,48 Pp dort etwas kippen könnte (delta80Prot 1,67 Pp). Für
   **`monatsende-kauf`**: keine messbare Richtung, Verschiebung unerheblich — beides
   unter dem 17-Tage-Vorbehalt seiner Bezugsgrößen.
4. **Für Strang A (momentum):** kein Korrekturwert (Aussicht jenseits jeder Auflösung),
   aber die benannte Einschränkung hat jetzt ein Vorzeichen: die Lücke wirkt
   **beschönigend**. »Auf einem Universum ohne Rückschau gemessen« darf weiterhin für
   nichts fallen.

## Der Kontrast zur verbrannten Zahl vom 25.08. — eine Deutung, kein Beweis

Der 25.08. sah unbedingt **+0,0141 Pp (t 4,26)**: Verschwundene liefen dort BESSER.
Dieser Lauf misst unbedingt **−0,125 Pp (t −2,15)**. Drei Konstruktionsunterschiede
können das erklären, allen voran die **B11-Reparatur**: der alte Liquiditätsboden las
das ganze Fenster (holte Übernahmen herein, warf Pleiten hinaus — am 25.08. selbst
nachgewiesen: ±62/−64 %); der neue ist punkt-in-zeit auf beiden Armen. Dazu:
artgefiltertes Universum (ETFs raus) und Lücken-Einstieg. Welcher Anteil auf welchen
Unterschied entfällt, ist hier NICHT gemessen — die Zerlegung wäre eine eigene Frage.

## Was aus diesem Ergebnis NICHT folgt (Sperrliste, wörtlich aus §5)

1. Kein „belegt", „widerlegt" oder sonst ein Kanten-Urteil für irgendeine Strategie.
2. Keine Änderung an E1 nach unten — auch bei den „unerheblich"-Urteilen nicht; sie
   gelten nur für dieses Fenster.
3. Keine Aussage über momentum außer der benannten Einschränkung.
4. Keine 60m-Aussage ohne den Ü1-Vorbehalt im selben Satz.

## Geltungsbereich (E-F1 bis E-F4, unverändert gültig)

Fenster 2024-08-23 bis 2026-08-21, übernahme-dominiert — **das belegte NEGATIV gilt für
dieses Fenster; 2008/09 ist damit nicht gemessen.** Abdeckung 1.048 von 6.921
Delistings seit 2004 (~15 %), davor null. Kein Eröffnungskurs (Lücken-Konvention).
Keine 60m-Verschwundenen (Ü1). Linkstrunkierung: alle Werte sind Untergrenzen
unbekannter Schärfe. Zensus: 2.249 aktienartige Überlebende (716 Nicht-Aktien
ausgefiltert), 1.048 brauchbare Verschwundene (116 zu kurz), 500 Handelstage,
Kalender aus der Vereinigungsmenge (Nachtrag 10).

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
