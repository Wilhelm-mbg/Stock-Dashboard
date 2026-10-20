# Pruefstrasse - Stand

Geschrieben von tools/pruefstrasse-nacht.sh auf rechenknecht, alle Zeiten UTC.

- Letzter Lauf: 2026-10-20T15:17:16+00:00 bis 2026-10-20T15:17:44+00:00, Dauer 28 s (Zeitgrenze 6h)
- Laeufer: `pruefstrasse/laeufer.js --naechster`, Node v24.18.0, rc=0 (ok)
- Daten: `/archiv/markt-dashboard/archiv-spiegel`; Stand vor dem Lauf: 164ac94
- Push der Vornacht: gescheitert 2026-10-20T15:17:10+00:00 (oertlich 735dbd6)
- Log: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20.log`, Laeufer-Ausgabe: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20-laeufer.log`

## Warteschlange und letzte Urteile (Laeufer-Ausgabe, letzte 60 Zeilen)

```
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
2026-10-20T15:16:29.866Z  START vor-fomc-long auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:16:29.993Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:16:29.994Z  Siegel 1: Kandidatenordner in Commit 720bbbaffef1f68566dc1620b34a7fa55acbe71e, nichts Ungesichertes
2026-10-20T15:16:29.994Z  Entdeckung bis 2022-12-30 ueber 2 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung zeit)
2026-10-20T15:16:48.957Z    [entdeckung] fertig entdeckung
2026-10-20T15:16:48.958Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":118144,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":0,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":74209,"gebucht":87870,"ohneHorizont":0,"topfFehlt":0,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":2060,"spaetOhneTag":43940,"placeboEntfaellt":87870} | Verstoesse 0
2026-10-20T15:16:48.958Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 96.4 %, max 100.3 %, 54 von 56 Signaltagen ueber 50 %, Bewertung zeit
2026-10-20T15:16:48.958Z    H1: Tage 54, Trades 43935, netto −0,0354, t −0,28 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:16:48.959Z    H2: Tage 54, Trades 43935, netto −0,4091, t −1,59 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:16:48.959Z  Gegenproben: ohne Befund; Kandidaten 0 von 2
2026-10-20T15:16:49.031Z  Siegel 2: KANDIDATEN.json committet in 6916cd3dacba5617859fe94d6e4930912051834b (Blob 05afb4103a6c)
2026-10-20T15:16:49.031Z  Keine Pruefung: kein Kandidat
2026-10-20T15:16:49.032Z  URTEIL: nicht entscheidbar - kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)
2026-10-20T15:16:49.033Z  Register: 11 Konfigurationen insgesamt, 0.25 Zufallstreffer erwartet
2026-10-20T15:16:49.049Z  ENDE nicht entscheidbar - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:16:49.185Z  Commit 1eaef33ec82cf5a6075fd515116ec7cedf5f7742
{"urteil":"nicht entscheidbar","grund":"kein Kandidat (0 von 2 ausgeschlossen, Rest unter der Aufloesung)","commit":"1eaef33ec82cf5a6075fd515116ec7cedf5f7742","siegel1":"720bbbaffef1f68566dc1620b34a7fa55acbe71e","siegel2":"6916cd3dacba5617859fe94d6e4930912051834b"}
2026-10-20T15:16:56.387Z  START umkehr-nach-vorzeichenserie auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:16:56.634Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:16:56.634Z  Siegel 1: Kandidatenordner in Commit 1c9238625c506a5ff140c3b10b77f143be36e00b, nichts Ungesichertes
2026-10-20T15:16:56.637Z  Entdeckung bis 2022-12-30 ueber 1 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung topf)
2026-10-20T15:17:09.777Z    [entdeckung] fertig entdeckung
2026-10-20T15:17:09.778Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":54767,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":45983,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":35417,"gebucht":19348,"ohneHorizont":7,"topfFehlt":1,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":460,"spaetOhneTag":19350} | Verstoesse 0
2026-10-20T15:17:09.778Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 1.5 %, max 40.6 %, 0 von 1667 Signaltagen ueber 50 %, Bewertung topf
2026-10-20T15:17:09.778Z    H1: Tage 1484, Trades 19348, netto −0,0017, t −0,03 -> nicht entscheidbar (netto <= 0, t < 2, Tor 1)
2026-10-20T15:17:09.779Z  Gegenproben: ohne Befund; Kandidaten 0 von 1
2026-10-20T15:17:09.831Z  Siegel 2: KANDIDATEN.json committet in c0d992afdbb79793f10efea976b742c0d52762db (Blob 9be56c1bde55)
2026-10-20T15:17:09.831Z  Keine Pruefung: kein Kandidat
2026-10-20T15:17:09.832Z  URTEIL: nicht entscheidbar - kein Kandidat (0 von 1 ausgeschlossen, Rest unter der Aufloesung)
2026-10-20T15:17:09.832Z  Register: 12 Konfigurationen insgesamt, 0.27 Zufallstreffer erwartet
2026-10-20T15:17:09.837Z  ENDE nicht entscheidbar - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:17:09.897Z  Commit 7b26dec372008b116e4f5299d53e9c648b8f7d5b
{"urteil":"nicht entscheidbar","grund":"kein Kandidat (0 von 1 ausgeschlossen, Rest unter der Aufloesung)","commit":"7b26dec372008b116e4f5299d53e9c648b8f7d5b","siegel1":"1c9238625c506a5ff140c3b10b77f143be36e00b","siegel2":"c0d992afdbb79793f10efea976b742c0d52762db"}
2026-10-20T15:17:17.593Z  START fomc-gerade-wochen-long auf Zweig pruefstrasse-ergebnisse
2026-10-20T15:17:18.108Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-20T15:17:18.109Z  Siegel 1: Kandidatenordner in Commit 464539ec6c5d954d3894d20f1e0f415bed25cf2c, nichts Ungesichertes
2026-10-20T15:17:18.110Z  Entdeckung bis 2022-12-30 ueber 1 Konfigurationen (Form tag, Adapter tag, Quelle panel, Bewertung zeit)
2026-10-20T15:17:44.489Z    [entdeckung] fertig entdeckung
2026-10-20T15:17:44.490Z  Verschiebungs-Gegenprobe: Versatz 5 Handelstage statt Vorgabe 20, Grund (REGEL.md "Versatz"): `versatzTage: 5` statt der Vorgabe 20. Die Regel hat eine **Periode von 10 Handelstagen** (Woche 0 → 2 → 4 → 6). Um 20 verschoben träfe jedes Signal das übernächste eigene Fenster (Woche 0 → Woche 4, Woche 2 → Woche 6 oder die nächste Woche 0). Ein richtiges Messgerät sähe dann denselben Effekt und hieße „Messgerät-Fehler“. Mit +5 Handelstagen landet jedes Fenster in der **folgenden ungeraden W...
2026-10-20T15:17:44.490Z  Entdeckung fertig: {"zulaessig":3768932,"ohneKlasse":2959271,"massnahmen":802,"signalAufrufe":3765887,"signale":367843,"ohneBestaetigungstag":0,"abgelehnt":0,"cooldown":0,"ohneEinstieg":0,"einstiegMassnahmen":1,"richtungOhneKonfiguration":231042,"gebucht":135967,"ohneHorizont":1668,"topfFehlt":0,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":1010,"spaetOhneTag":14,"placeboEntfaellt":136801} | Verstoesse 0
2026-10-20T15:17:44.490Z  Anteil der zulaessigen Reihen mit Signal am Signaltag (Entdeckung): Mittel 82.3 %, max 100.3 %, 168 von 204 Signaltagen ueber 50 %, Bewertung zeit
2026-10-20T15:17:44.490Z    W0246-H5: Tage 177, Trades 135967, netto −1,0110, t −4,62 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-20T15:17:44.491Z  Gegenproben: ohne Befund; Kandidaten 0 von 1
2026-10-20T15:17:44.558Z  Siegel 2: KANDIDATEN.json committet in ae8128aa146dc74722edbd6363253ad99c565229 (Blob 11c704b89c0d)
2026-10-20T15:17:44.558Z  Keine Pruefung: kein Kandidat
2026-10-20T15:17:44.559Z  URTEIL: nein - jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)
2026-10-20T15:17:44.560Z  Register: 13 Konfigurationen insgesamt, 0.30 Zufallstreffer erwartet
2026-10-20T15:17:44.568Z  ENDE nein - Belegstand und Log angehaengt, Commit folgt
2026-10-20T15:17:44.966Z  Commit e286a862c7d9b666f04f64df5630c7af63a723f3
{"urteil":"nein","grund":"jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)","commit":"e286a862c7d9b666f04f64df5630c7af63a723f3","siegel1":"464539ec6c5d954d3894d20f1e0f415bed25cf2c","siegel2":"ae8128aa146dc74722edbd6363253ad99c565229"}
```

## Fehler

keine (rc=0)
