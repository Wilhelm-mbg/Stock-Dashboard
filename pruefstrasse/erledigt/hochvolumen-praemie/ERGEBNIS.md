# High-Volume Return Premium: Dollarumsatz des Tages unter den obersten 10 % der letzten 50 Tage, long — **nein**

**Kurzfassung.** Kandidat `hochvolumen-praemie` (Form tag, Bewertung topf, 2 Konfigurationen, vorab festgelegt), gemessen 20.10.2026 auf panel (querschnitt-pruefstand-2026-09-13/panel/v2.3). **Urteil: nein** — jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0). Kandidaten nach der Entdeckung: 0. Register: 5 Konfigurationen bisher insgesamt geprueft, 0.1 Zufallstreffer (t ≥ 2) zu erwarten. Erwartung vorab: Quelle (1963-1996, Long-Seite gegen Referenzportfolio derselben Groessenklasse): +0,18 bis +0,28 Pp je Trade bei 10 Tagen, +0,29 bis +0,45 Pp bei 20 Tagen brutto; nach 2016 in liquiden Werten eher kleiner (Belegstand K4 'Umsatzschock mit Richtung' negativ) - eigene Erwartung gegen den Topf: 0 bis +0,2 Pp (positiv).

Siegel 1 (Kandidatenordner) `815a7aa7de9f`, Siegel 2 (KANDIDATEN.json) `7d692d89832e`. Entdeckung bis vor 2023-01-03, Pruefung ab 2023-01-01 nur fuer Kandidaten. Kriterien: netto > 0, t ≥ 2 (Kandidaten-Kriterium), Tor 1 (Entdeckung ≥ 4 × projizierte Bestaetigungs-MDE), kein Placebo-Verstoss (|Placebo| > 2 se und > ¼ Huerde); MDE80 = 2.8016 × se ist die Aufloesung, kein Kriterium.

## Konfigurationen

| Konf | Richtung, H | Ent Tage | Trades | u brutto | u netto | t | se HH | MDE80 | Tor 1 | Placebo | verschoben 20 T | Einstieg +1 T | Δ alle−lebend | Abgaenge | Urteil | Pruefung Tage / netto / t |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H10 | long 10 T | 1703 | 78.007 | −0,0713 | −0,1519 | −2,73 | +0,0557 | +0,1561 | nein | −0,2626 (t −1,72) | −0,0199 (t −0,46) | −0,1314 | +0,0083 | uebe 199, inso 1, sons 27 | nein |
| H20 | long 20 T | 1701 | 77.695 | −0,0989 | −0,1795 | −3,04 | +0,0590 | +0,1652 | nein | +0,2530 (t +1,49) | −0,0415 (t −0,64) | −0,1521 | +0,0164 | uebe 298, inso 3, sons 45 | nein |

Alle Groessen in Pp je Trade/Signal (Tagesmittel), se Hansen-Hodrick. Gegenproben: Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung; verschoben = dasselbe Signal 20 Handelstage spaeter (wirkt es, ist das Messgeraet verdaechtig); Einstieg +1 T bei festem Ausstieg; Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige).

**Bewertung topf.** Ueberschuss = Rendite (Eroeffnung Einstieg -> Eroeffnung Ausstieg) minus Topf derselben Zelle (Einstiegstag, Dauer, Umsatzklasse, lebend) - das Verfahren der Trendkanal-Studie; Kassa-Huerde je Klasse; Placebo = anderer zulaessiger Wert gleicher Klasse am selben Tag, gleiche Richtung; Verschiebung um 20 Handelstage. Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): im Mittel 6 %, hoechstens 51 % (1 von 1712 Signaltagen ueber 50 %). Verschiebungs-Gegenprobe: Versatz 20 Handelstage (Vorgabe).
Signaltage und Trades (Entdeckung): H10 1703 Signaltage / 78.007 Trades (45,8 je Signaltag); H20 1701 Signaltage / 77.695 Trades (45,7 je Signaltag). Die Aufloesung (se Hansen-Hodrick ueber die Tagesreihe, Lag = Haltedauer) haengt an der Zahl der Signaltage, nicht an der Zahl der Trades.

## Zaehler und Quelle

`{"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":208715,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":182836,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":130324,"gebucht":155702,"ohneHorizont":4687,"topfFehlt":4,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":2084,"spaetOhneTag":72}` — Verstoesse gegen „kein Blick nach vorn": 0 — Laufzeit {"topf":6347,"messen":7315}
Quelle: panel, 6706 Reihen, letzter Tag 2022-12-30. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
