# Großer Tagesanstieg (über 8 %) bei unauffälligem Umsatz (ATV ≤ 1,52), long – Drift nach Kudryavtsev — **nicht entscheidbar**

**Kurzfassung.** Kandidat `grossanstieg-ohne-umsatz` (Form tag, Bewertung topf, 2 Konfigurationen, vorab festgelegt), gemessen 20.10.2026 auf panel (querschnitt-pruefstand-2026-09-13/panel/v2.3). **Urteil: nicht entscheidbar** — kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung). Kandidaten nach der Entdeckung: 0. Register: 7 Konfigurationen bisher insgesamt geprueft, 0.2 Zufallstreffer (t ≥ 2) zu erwarten. Erwartung vorab: Quelle (Proxy A, |SR|>8 %, unterstes ATV-Quintil, Marktmodell, ab Schluss des Ereignistags): CAR 1-5 +0,77 Pp (p 1,3 %), CAR 1-20 +1,08 Pp (p 0,2 %) brutto; ab Folgeeröffnung und gegen den Topf eigene Erwartung H5 0 bis +0,5 Pp, H20 0 bis +0,8 Pp (positiv).

Siegel 1 (Kandidatenordner) `4cfa64f17f85`, Siegel 2 (KANDIDATEN.json) `dc84c11e5496`. Entdeckung bis vor 2023-01-03, Pruefung ab 2023-01-01 nur fuer Kandidaten. Kriterien: netto > 0, t ≥ 2 (Kandidaten-Kriterium), Tor 1 (Entdeckung ≥ 4 × projizierte Bestaetigungs-MDE), kein Placebo-Verstoss (|Placebo| > 2 se und > ¼ Huerde); MDE80 = 2.8016 × se ist die Aufloesung, kein Kriterium.

## Konfigurationen

| Konf | Richtung, H | Ent Tage | Trades | u brutto | u netto | t | se HH | MDE80 | Tor 1 | Placebo | verschoben 20 T | Einstieg +1 T | Δ alle−lebend | Abgaenge | Urteil | Pruefung Tage / netto / t |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H5 | long 5 T | 661 | 4.737 | −0,0364 | −0,1161 | −0,30 | +0,3885 | +1,0885 | nein | +0,1427 (t +0,80) | −0,1662 (t −0,40) | −0,2840 | +0,2020 | uebe 2, inso 1, sons 2 | nicht entscheidbar |
| H20 | long 20 T | 656 | 4.722 | +0,0082 | −0,0715 | −0,06 | +1,1211 | +3,1408 | nein | −0,4367 (t −1,38) | −0,5023 (t −0,38) | −0,2436 | −0,1036 | uebe 7, inso 1, sons 2 | nicht entscheidbar |

Alle Groessen in Pp je Trade/Signal (Tagesmittel), se Hansen-Hodrick. Gegenproben: Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung; verschoben = dasselbe Signal 20 Handelstage spaeter (wirkt es, ist das Messgeraet verdaechtig); Einstieg +1 T bei festem Ausstieg; Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige).

**Bewertung topf.** Ueberschuss = Rendite (Eroeffnung Einstieg -> Eroeffnung Ausstieg) minus Topf derselben Zelle (Einstiegstag, Dauer, Umsatzklasse, lebend) - das Verfahren der Trendkanal-Studie; Kassa-Huerde je Klasse; Placebo = anderer zulaessiger Wert gleicher Klasse am selben Tag, gleiche Richtung; Verschiebung um 20 Handelstage. Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): im Mittel 1 %, hoechstens 33 % (0 von 1259 Signaltagen ueber 50 %). Verschiebungs-Gegenprobe: Versatz 20 Handelstage (Vorgabe).
Signaltage und Trades (Entdeckung): H5 661 Signaltage / 4.737 Trades (7,2 je Signaltag); H20 656 Signaltage / 4.722 Trades (7,2 je Signaltag). Die Aufloesung (se Hansen-Hodrick ueber die Tagesreihe, Lag = Haltedauer) haengt an der Zahl der Signaltage, nicht an der Zahl der Trades.

## Zaehler und Quelle

`{"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":17152,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":3149,"ohneEinstieg":0,"einstiegMassnahmen":0,"richtungOhneKonfiguration":12409,"gebucht":9459,"ohneHorizont":309,"topfFehlt":4,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":62,"spaetOhneTag":12}` — Verstoesse gegen „kein Blick nach vorn": 0 — Laufzeit {"topf":6638,"messen":4538}
Quelle: panel, 6706 Reihen, letzter Tag 2022-12-30. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
