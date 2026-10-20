# Pruefstrasse - Stand

Geschrieben von tools/pruefstrasse-nacht.sh auf rechenknecht, alle Zeiten UTC.

- Letzter Lauf: 2026-10-20T15:16:55+00:00 bis 2026-10-20T15:17:09+00:00, Dauer 14 s (Zeitgrenze 6h)
- Laeufer: `pruefstrasse/laeufer.js --naechster`, Node v24.18.0, rc=0 (ok)
- Daten: `/archiv/markt-dashboard/archiv-spiegel`; Stand vor dem Lauf: da58a25
- Push der Vornacht: gescheitert 2026-10-20T15:16:50+00:00 (oertlich da58a25)
- Log: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20.log`, Laeufer-Ausgabe: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-20-laeufer.log`

## Warteschlange und letzte Urteile (Laeufer-Ausgabe, letzte 60 Zeilen)

```
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
```

## Fehler

keine (rc=0)
