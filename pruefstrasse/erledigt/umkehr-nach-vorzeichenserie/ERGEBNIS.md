# Umkehr nach fünf und mehr Handelstagen ohne Kursanstieg in Folge, long – Gambler's-Fallacy-Umkehr nach Kudryavtsev — **nicht entscheidbar**

**Kurzfassung.** Kandidat `umkehr-nach-vorzeichenserie` (Form tag, Bewertung topf, 1 Konfigurationen, vorab festgelegt), gemessen 20.10.2026 auf panel (querschnitt-pruefstand-2026-09-13/panel/v2.3). **Urteil: nicht entscheidbar** — kein Kandidat (0 von 1 ausgeschlossen, Rest unter der Aufloesung). Kandidaten nach der Entdeckung: 0. Register: 12 Konfigurationen bisher insgesamt geprueft, 0.3 Zufallstreffer (t ≥ 2) zu erwarten. Erwartung vorab: Quelle (Folge von 5 Minustagen, Marktmodell, Schluss zu Schluss am Folgetag): +0,343 Pp (Tabelle 1, p < 5 %), +0,277 Pp nach Kontrollen (Tabelle 5), große Werte +0,288 Pp (Tabelle 2) brutto; ab Folgeeröffnung und gegen den Topf eigene Erwartung H1 0 bis +0,15 Pp brutto (Übernachtanteil fehlt, Zahlen der Quelle mit inneren Widersprüchen, siehe REGEL.md) (positiv).

Siegel 1 (Kandidatenordner) `1c9238625c50`, Siegel 2 (KANDIDATEN.json) `c0d992afdbb7`. Entdeckung bis vor 2023-01-03, Pruefung ab 2023-01-01 nur fuer Kandidaten. Kriterien: netto > 0, t ≥ 2 (Kandidaten-Kriterium), Tor 1 (Entdeckung ≥ 4 × projizierte Bestaetigungs-MDE), kein Placebo-Verstoss (|Placebo| > 2 se und > ¼ Huerde); MDE80 = 2.8016 × se ist die Aufloesung, kein Kriterium.

## Konfigurationen

| Konf | Richtung, H | Ent Tage | Trades | u brutto | u netto | t | se HH | MDE80 | Tor 1 | Placebo | verschoben 20 T | Einstieg +1 T | Δ alle−lebend | Abgaenge | Urteil | Pruefung Tage / netto / t |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | long 1 T | 1484 | 19.348 | +0,0788 | −0,0017 | −0,03 | +0,0490 | +0,1373 | nein | −0,0168 (t −0,32) | −0,1091 (t −2,84) | – | −0,0103 | uebe 0, inso 0, sons 1 | nicht entscheidbar |

Alle Groessen in Pp je Trade/Signal (Tagesmittel), se Hansen-Hodrick. Gegenproben: Placebo = anderer Wert gleicher Klasse am selben Tag, gleiche Richtung; verschoben = dasselbe Signal 20 Handelstage spaeter (wirkt es, ist das Messgeraet verdaechtig); Einstieg +1 T bei festem Ausstieg; Δ alle−lebend = Ueberlebensprobe; Abgaenge getrennt (uebernahme / insolvenz / sonstige).

**Bewertung topf.** Ueberschuss = Rendite (Eroeffnung Einstieg -> Eroeffnung Ausstieg) minus Topf derselben Zelle (Einstiegstag, Dauer, Umsatzklasse, lebend) - das Verfahren der Trendkanal-Studie; Kassa-Huerde je Klasse; Placebo = anderer zulaessiger Wert gleicher Klasse am selben Tag, gleiche Richtung; Verschiebung um 20 Handelstage. Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): im Mittel 1 %, hoechstens 41 % (0 von 1667 Signaltagen ueber 50 %). Verschiebungs-Gegenprobe: Versatz 20 Handelstage (Vorgabe).
Signaltage und Trades (Entdeckung): H1 1484 Signaltage / 19.348 Trades (13,0 je Signaltag). Die Aufloesung (se Hansen-Hodrick ueber die Tagesreihe, Lag = Haltedauer) haengt an der Zahl der Signaltage, nicht an der Zahl der Trades.

## Zaehler und Quelle

`{"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":54767,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":45983,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":35417,"gebucht":19348,"ohneHorizont":7,"topfFehlt":1,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":460,"spaetOhneTag":19350}` — Verstoesse gegen „kein Blick nach vorn": 0 — Laufzeit {"topf":6837,"messen":256}
Quelle: panel, 6706 Reihen, letzter Tag 2022-12-30. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
