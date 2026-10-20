# Pruefstrasse - Stand

Geschrieben von tools/pruefstrasse-nacht.sh auf rechenknecht, alle Zeiten UTC.

- Letzter Lauf: 2026-10-20T15:13:11+00:00 bis 2026-10-20T15:13:43+00:00, Dauer 32 s (Zeitgrenze 6h)
- Laeufer: `pruefstrasse/laeufer.js --naechster`, Node v24.18.0, rc=0 (ok)
- Daten: `/archiv/markt-dashboard/archiv-spiegel`; Stand vor dem Lauf: 4fee30d
- Push der Vornacht: gescheitert 2026-10-12T02:00:50+00:00 (oertlich 4ff2ddb)
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
```

## Fehler

keine (rc=0)
