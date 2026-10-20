# Pruefstrasse - Stand

Geschrieben von tools/pruefstrasse-nacht.sh auf rechenknecht, alle Zeiten UTC.

- Letzter Lauf: 2026-10-20T15:16:03+00:00 bis 2026-10-20T15:16:23+00:00, Dauer 20 s (Zeitgrenze 6h)
- Laeufer: `pruefstrasse/laeufer.js --naechster`, Node v24.18.0, rc=0 (ok)
- Daten: `/archiv/markt-dashboard/archiv-spiegel`; Stand vor dem Lauf: 28bbdcd
- Push der Vornacht: gescheitert 2026-10-20T15:15:57+00:00 (oertlich 28bbdcd)
- Log: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20.log`, Laeufer-Ausgabe: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20-laeufer.log`

## Warteschlange und letzte Urteile (Laeufer-Ausgabe, letzte 60 Zeilen)

```
2026-10-20T15:13:12.384Z  START hochvolumen-praemie auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:13:12.649Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:13:12.650Z  Siegel 1: Kandidatenordner in Commit 815a7aa7de9f53224fd8920861a4160c559e6858, nichts Ungesichertes
2026-10-20T15:13:12.651Z  Entdeckung bis 2022-12-30 ueber 2 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung topf)
2026-10-20T15:13:43.098Z    [entdeckung] fertig entdeckung
2026-10-20T15:13:43.099Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":208715,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":182836,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":130324,"gebucht":155702,"ohneHorizont":4687,"topfFehlt":4,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":2084,"spaetOhneTag":72} | Verstoesse 0
2026-10-20T15:13:43.099Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 5.6 %, max 50.7 %, 1 von 1712 Signaltagen ueber 50 %, Bewertung topf
2026-10-20T15:13:43.099Z    H10: Tage 1703, Trades 78007, netto −0,1519, t −2,73 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-20T15:13:43.099Z    H20: Tage 1701, Trades 77695, netto −0,1795, t −3,04 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-20T15:13:43.100Z  Gegenproben: ohne Befund; Kandidaten 0 von 2
2026-10-20T15:13:43.179Z  Siegel 2: KANDIDATEN.json committet in 7d692d89832eb8946f10f30890365894352f81d3 (Blob b291b80aa71f)
2026-10-20T15:13:43.179Z  Keine Pruefung: kein Kandidat
2026-10-20T15:13:43.179Z  URTEIL: nein - jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)
2026-10-20T15:13:43.179Z  Register: 5 Konfigurationen insgesamt, 0.11 Zufallstreffer erwartet
2026-10-20T15:13:43.184Z  ENDE nein - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:13:43.233Z  Commit ab668d74dc1f817bac272ae8e65d49ec529c9604
{"urteil":"nein","grund":"jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)","commit":"ab668d74dc1f817bac272ae8e65d49ec529c9604","siegel1":"815a7aa7de9f53224fd8920861a4160c559e6858","siegel2":"7d692d89832eb8946f10f30890365894352f81d3"}
2026-10-20T15:15:38.781Z  START grossanstieg-ohne-umsatz auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:15:39.101Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:15:39.101Z  Siegel 1: Kandidatenordner in Commit 4cfa64f17f8588d005e3a06f400dd7867dd5d728, nichts Ungesichertes
2026-10-20T15:15:39.102Z  Entdeckung bis 2022-12-30 ueber 2 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung topf)
2026-10-20T15:15:56.681Z    [entdeckung] fertig entdeckung
2026-10-20T15:15:56.682Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":17152,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":3149,"ohneEinstieg":0,"einstiegMassnahmen":0,"richtungOhneKonfiguration":12409,"gebucht":9459,"ohneHorizont":309,"topfFehlt":4,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":62,"spaetOhneTag":12} | Verstoesse 0
2026-10-20T15:15:56.682Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 0.6 %, max 33.4 %, 0 von 1259 Signaltagen ueber 50 %, Bewertung topf
2026-10-20T15:15:56.682Z    H5: Tage 661, Trades 4737, netto −0,1161, t −0,30 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:15:56.682Z    H20: Tage 656, Trades 4722, netto −0,0715, t −0,06 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:15:56.683Z  Gegenproben: ohne Befund; Kandidaten 0 von 2
2026-10-20T15:15:56.770Z  Siegel 2: KANDIDATEN.json committet in dc84c11e5496967cc6337c7c76316e2526d28e6b (Blob d4335083508a)
2026-10-20T15:15:56.770Z  Keine Pruefung: kein Kandidat
2026-10-20T15:15:56.770Z  URTEIL: nicht entscheidbar - kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)
2026-10-20T15:15:56.770Z  Register: 7 Konfigurationen insgesamt, 0.16 Zufallstreffer erwartet
2026-10-20T15:15:56.776Z  ENDE nicht entscheidbar - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:15:56.822Z  Commit 566f1bd7a40fab72a9c040cdf0468eeec6db9b8e
{"urteil":"nicht entscheidbar","grund":"kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)","commit":"566f1bd7a40fab72a9c040cdf0468eeec6db9b8e","siegel1":"4cfa64f17f8588d005e3a06f400dd7867dd5d728","siegel2":"dc84c11e5496967cc6337c7c76316e2526d28e6b"}
2026-10-20T15:16:03.964Z  START monatswende-long auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:16:04.272Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:16:04.273Z  Siegel 1: Kandidatenordner in Commit 8cd45a67a001e5d78992a8372d9cde54bdde84f7, nichts Ungesichertes
2026-10-20T15:16:04.274Z  Entdeckung bis 2022-12-30 ueber 2 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung zeit)
2026-10-20T15:16:23.106Z    [entdeckung] fertig entdeckung
2026-10-20T15:16:23.107Z  Verschiebungs-Gegenprobe: Versatz 10 Handelstage statt Vorgabe 20, Grund (REGEL.md "Versatz"): `versatzTage: 10` statt der Vorgabe 20 (PM-Entscheid 12.10.2026, Nachlieferung Nr. 118): der Abstand zweier Monatswenden beträgt ≈ 21 Handelstage, ein um 20 Handelstage verschobenes Signal landet ein bis drei Tage vor dem **nächsten** Monatsende — das verschobene Fenster überschneidet das nächste Signalfenster, die Gegenprobe zeigte den Effekt selbst und ein richtiges Messgerät würde als „verdä...
2026-10-20T15:16:23.107Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":173092,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":0,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":108712,"gebucht":127108,"ohneHorizont":1652,"topfFehlt":0,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":1990,"spaetOhneTag":1838,"placeboEntfaellt":128760} | Verstoesse 0
2026-10-20T15:16:23.107Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 98.7 %, max 100.3 %, 79 von 80 Signaltagen ueber 50 %, Bewertung zeit
2026-10-20T15:16:23.107Z    H4: Tage 80, Trades 63554, netto −0,0253, t −0,09 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:16:23.108Z    H3: Tage 80, Trades 63554, netto +0,0375, t +0,16 -> nicht entscheidbar (t < 2, Tor 1)
2026-10-20T15:16:23.108Z  Gegenproben: ohne Befund; Kandidaten 0 von 2
2026-10-20T15:16:23.190Z  Siegel 2: KANDIDATEN.json committet in c28f392112bbcbeae18ddc6461e21dd02f7a1e6b (Blob a6a0a0ac388a)
2026-10-20T15:16:23.190Z  Keine Pruefung: kein Kandidat
2026-10-20T15:16:23.190Z  URTEIL: nicht entscheidbar - kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)
2026-10-20T15:16:23.191Z  Register: 9 Konfigurationen insgesamt, 0.20 Zufallstreffer erwartet
2026-10-20T15:16:23.196Z  ENDE nicht entscheidbar - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:16:23.246Z  Commit aa28e027f08a5b9a72f273c2970384806bb45a77
{"urteil":"nicht entscheidbar","grund":"kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)","commit":"aa28e027f08a5b9a72f273c2970384806bb45a77","siegel1":"8cd45a67a001e5d78992a8372d9cde54bdde84f7","siegel2":"c28f392112bbcbeae18ddc6461e21dd02f7a1e6b"}
```

## Fehler

keine (rc=0)
