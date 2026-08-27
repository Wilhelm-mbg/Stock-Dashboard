# Ergebnis — Docht-Empfindlichkeit: der Effekt hebt sich im Überschuss auf

**Gemessen:** 27.08.2026, ~02:5x–03:1x, Rolle Berechnungen. Auftrag PM ~01:35 (»VOR der
Phantom-Docht-Reparatur: hebt sich der Docht-Effekt im Überschuss auf?«). Treiber
`messe-docht-empfindlichkeit.js` (Maßstab vorab committet 402bc5d, Präzisierung
»tragende Wechsel« 770a312 VOR dem Lauf, auf QS-Warnung). Maschine 1.5.0, ein Lauf,
sechs Kinder-Prozesse. Rohdaten: `<strategie>-A/B.json`, `vergleich.json`,
`ausschluss-zaehlung.json` in diesem Ordner.

## Urteil je Strategie (Maßstab: tragender Urteilswechsel ODER |Δ| ≥ delta80_A)

| Strategie | G-Anteil der Signale* | größtes \|Δ\| | kleinstes delta80_A | Urteil |
|---|---:|---:|---:|---|
| kapitulation | 8–10 % | 0,043 Pp | 1,17 Pp | **hebt sich auf** |
| rsi2seit-mcp | 36,4 % | 0,006 Pp | 0,080 Pp | **hebt sich auf** (Var 3/4: Randrauschen, s. u.) |
| t1-zwangsglattstellung | 100 % | 0,034 Pp | 0,21 Pp | **hebt sich auf** |

*G-Anteil = Signale auf der letzten Tageskerze (Positionsangabe; historisch die stabile
19:30 — Nacht-Einordnung des PM). Die drei stehen sehr verschieden im Wind, deshalb
getrennt ausgewiesen; das Urteil ist trotzdem bei allen dreien dasselbe, mit Abständen
von Faktor 6 (t1) bis Faktor 27 (kapitulation Var2) zwischen Δ und delta80.

## Die Zahlen

- **Anordnung:** gepaarter A/B-Vergleich, identischer Archivstand (frisch nach dem
  Nachtlauf, 60m fertig 01:58), identische Maschine 1.5.0. Arm B = Kopie ohne
  Nullumsatz-Kerzen: **76.339 von 14.657.063 Kerzen entfernt (0,52 %)** über alle
  2.885 Reihen (Top: PSEP 590, BILZ 441 — illiquide ETF-artige; Zählung je Reihe im
  JSON). Signalverlust je Strategie: kapitulation −12 bis +2, rsi2seit-mcp −413,
  t1 −652 (von 15.273–57.445).
- **Deltas des Bestätigungs-Überschusses** (B minus A, je Variante): kapitulation
  −0,043/−0,035/−0,002 · rsi2seit-mcp +0,0045…+0,0061 · t1 +0,005/−0,005/−0,034 Pp —
  alle um ein Vielfaches unter dem jeweiligen delta80_A.
- **Placebo-t beider Arme** überall unauffällig (−0,57 … +1,18).
- **Randrauschen-Beleg:** rsi2seit-mcp Var 3/4 wechseln das Etikett
  (nicht-entscheidbar → nicht-bestätigt) an Margen von **+0,0054/+0,0049 Pp** — exakt
  die Fallklasse, vor der die QS gewarnt hat. Nach dem vorab präzisierten Maßstab
  sind das keine tragenden Wechsel; ohne die Präzisierung hätte dieser Lauf auf
  Rauschbasis »hebt sich nicht auf« gemeldet. Der Wechsel bestätigt erneut: die
  Urteilsgrenze dieser Strategie liegt im Rauschen (Tafel-Befund von gestern).

## Was daraus folgt — und was nicht

1. **Für Wilhelms Datenfund-1-Entscheid:** Nach der Auftragslogik (»hebt er sich auf →
   Reparatur unnötig«) ist die Phantom-Docht-Reparatur im 60m-Archiv **keine
   Dringlichkeit für die Messseite.** Signal und Kontrolle laufen durch dieselbe
   `fuehreAus`; die Dochte kürzen sich im Überschuss messbar heraus.
2. **Das gekippte rsi2seit-mcp-Urteil wird durch Bereinigung nicht stabil anders** —
   auch ohne Nullumsatz-Kerzen bleibt es an seiner Grenze und flackert dort.
3. **Kein Kanten-Urteil.** Reine Empfindlichkeitsmessung; an den Belegständen ändert
   sich nichts (weiterhin NULL belegte Kanten).
4. **Geltungsbereich:** Ein Archivstand (der frische), drei Strategien, alle
   Nullumsatz-Kerzen gemeinsam entfernt (historische Dochte + die zwei jungen
   Quote-Kerzen 25./26.08. — nach der Nacht-Einordnung praktisch nur Erstere).
   Der Lauf trennt NICHT zwischen Docht- und Stempel-Unterklassen; nach dem
   Aufhebungs-Ergebnis ist die Trennung gegenstandslos.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
