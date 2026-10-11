# Donchian-20-Ausbruch nach oben, bestätigt, long (Trockenprobe der Prüfstraße)

**Schon gemessen** in der Trendkanal-Studie (09.09.2026, Linie K3-20, Einstieg E1, Richtung long; Belegstand: „Regression K2,
Donchian 20 … Ausbruch long −0,04 … +0,34 Pp, alle |t| ≤ 1,7 → offen", H5 „in jeder Klasse zu"). Dieser Kandidat läuft als erste
Trockenprobe: das Urteil der Prüfstraße muss dem Belegstand entsprechen. Nichts hier ist neu eingestellt.

## Regel (Prosa)

1. **Kanal (K3-20):** obere Linie = höchstes Hoch, untere Linie = tiefstes Tief der **20 Handelstage vor** dem Tag i (i−20 … i−1; der
   Tag i selbst zählt nicht). Fundstelle: Donchian-Kanal, Turtle-Regeln (System 1: 20-Tage-Ausbruch); `kanaele.js` `k3Reihe` der
   Trendkanal-Studie, Parameter `K3.N = [20, 55]` (`konfig.js` Z. 57).
2. **Richtung des Kanals:** „auf", wenn obere **und** untere Linie über ihrem Stand von ⌈20/2⌉ = 10 Tagen zuvor liegen; „ab", wenn beide
   darunter; sonst „seit". Mindestvorlauf 20 + 10 = 30 Tage. Fundstelle: `kanaele.js` `k3Am`, Vorregistrierung §3.
3. **Signal am Tag i (Ausbruch E1):** Kanal nicht „ab" **und** Schluss(i) > obere Linie × (1 + 15 Bp). Spiegelbildlich short (nicht
   konfiguriert — nur long wird gemessen, Leihe ist im Projekt nicht gemessen). Fundstelle: `confirmBps = 15` = Live-Parameter des
   August-Detektors der App (`quant.js`, `K3.confirmBps`, `konfig.js` Z. 57); `e1Signal` in `kanaele.js`.
4. **Bestätigung am Tag i+1:** Schluss(i+1) > obere Linie des Signaltags (bei Donchian dieselbe Linie). Fundstelle: `e1Bestaetigt`,
   Vorregistrierung §4 („bestätigter Ausbruch").
5. **Einstieg:** Eröffnung des Tages i+2 (Versatz 2 = Signaltag + Bestätigungstag). Cooldown 5 Handelstage je Richtung.
   Fundstelle: `EINSTIEGE[0].versatz = 2`, `COOLDOWN_TAGE = 5` (`konfig.js` Z. 65, 69).
6. **Ausstieg:** Eröffnung des ersten Handelstags ≥ Einstiegstag + 5 / 10 / 20 (drei Konfigurationen). Fundstelle: `AUSSTIEGE`
   (`konfig.js` Z. 67); „bis Kanalbruch" ist in der Prüfstraßen-Form nicht abbildbar und entfällt.

## Parameter (alle mit Fundstelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| N (Kanalfenster) | 20 Handelstage | Turtle System 1; Trendkanal `K3.N[0]` |
| Richtungsfenster | ⌈N/2⌉ = 10 | Trendkanal `k3Reihe` (`halb`) |
| confirmBps | 15 | App-Detektor (quant.js), Trendkanal `K3.confirmBps` |
| Versatz | 2 Tage | Trendkanal `EINSTIEGE` E1 |
| Haltedauern | 5, 10, 20 | Trendkanal `AUSSTIEGE` H5/H10/H20 |

## Erwartung (vorab)

Roh positiv, weil der Markt steigt; gegen den Topf derselben Zelle **nicht** positiv (Trendkanal: −0,04 bis +0,34 Pp, |t| ≤ 1,7, H5
mit oberer Grenze unter der Hürde jeder Klasse). Erwartetes Urteil der Prüfstraße: **nicht entscheidbar** (H10, H20 offen) mit
der Zeile H5 „nein" (Größe ausgeschlossen); kein Kandidat, keine Prüfung.
