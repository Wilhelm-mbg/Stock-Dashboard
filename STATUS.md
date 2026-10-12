# Pruefstrasse - Stand

Geschrieben von tools/pruefstrasse-nacht.sh auf rechenknecht, alle Zeiten UTC.

- Letzter Lauf: 2026-10-12T02:00:04+00:00 bis 2026-10-12T02:00:49+00:00, Dauer 45 s (Zeitgrenze 6h)
- Laeufer: `pruefstrasse/laeufer.js --naechster`, Node v24.18.0, rc=0 (ok)
- Daten: `/archiv/markt-dashboard/archiv-spiegel`; Stand vor dem Lauf: f6bb3e1
- Push der Vornacht: noch keiner
- Log: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-12.log`, Laeufer-Ausgabe: `/archiv/markt-dashboard/pruefstrasse-logs/2026-10-12-laeufer.log`

## Warteschlange und letzte Urteile (Laeufer-Ausgabe, letzte 60 Zeilen)

```
2026-10-12T02:00:05.097Z  START donchian20-ausbruch-long auf Zweig pruefstrasse-ergebnisse
2026-10-12T02:00:05.373Z  Form gueltig, test.js gruen (ALLE TESTS GRUEN)
2026-10-12T02:00:05.373Z  Siegel 1: Kandidatenordner in Commit 3ab9d72089a32a77e99eb773d983c7cc72589e00, nichts Ungesichertes
2026-10-12T02:00:05.374Z  Entdeckung bis 2022-12-30 ueber 3 Konfigurationen (Form tag, Adapter tag, Quelle trendkanal-tage)
2026-10-12T02:00:49.644Z    [entdeckung] fertig entdeckung
2026-10-12T02:00:49.645Z  Entdeckung fertig: {"zulaessig":3948624,"ohneKlasse":2333845,"massnahmen":1044,"signalAufrufe":3945401,"signale":170332,"ohneBestaetigungstag":0,"abgelehnt":63326,"cooldown":171439,"ohneEinstieg":69,"einstiegMassnahmen":8,"richtungOhneKonfiguration":72356,"gebucht":293269,"ohneHorizont":3825,"topfFehlt":3,"nachMaxTag":0,"placeboOhnePartner":0,"versatzOhneTag":3144,"spaetOhneTag":108} | Verstoesse 0
2026-10-12T02:00:49.645Z    H5: Tage 1711, Trades 97942, netto −0,3722, t −3,01 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-12T02:00:49.645Z    H10: Tage 1710, Trades 97921, netto −0,3595, t −2,31 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-12T02:00:49.645Z    H20: Tage 1710, Trades 97406, netto −0,5347, t −2,70 -> nein (netto <= 0, t < 2, Tor 1)
2026-10-12T02:00:49.646Z  Gegenproben: ohne Befund; Kandidaten 0 von 3
2026-10-12T02:00:49.699Z  Siegel 2: KANDIDATEN.json committet in a39f8046ad2805e8210fb2b602c865d411f2e738 (Blob 7614c8634c90)
2026-10-12T02:00:49.699Z  Keine Pruefung: kein Kandidat
2026-10-12T02:00:49.699Z  URTEIL: nein - jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)
2026-10-12T02:00:49.700Z  Register: 3 Konfigurationen insgesamt, 0.07 Zufallstreffer erwartet
2026-10-12T02:00:49.705Z  ENDE nein - Belegstand und Log angehaengt, Commit folgt
2026-10-12T02:00:49.757Z  Commit b351a965eff9bbce5e973d9638b236461e64be89
{"urteil":"nein","grund":"jede Konfiguration in der behaupteten Richtung ausgeschlossen (obere 95-%-Grenze netto < 0)","commit":"b351a965eff9bbce5e973d9638b236461e64be89","siegel1":"3ab9d72089a32a77e99eb773d983c7cc72589e00","siegel2":"a39f8046ad2805e8210fb2b602c865d411f2e738"}
```

## Fehler

keine (rc=0)
