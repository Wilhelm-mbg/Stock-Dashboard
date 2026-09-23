# Ergebnis — Mehrfaktor-Kombination, Runde 1b (Auftrag Nr. 62, Lauf 2026-09-23)

**Urteil nach §7 der Vorregistrierung (wörtlich): nicht entscheidbar unterhalb von IC 0,0505.** Satzform nach §6.3a, weil Tor V2 vor dem Lauf mit dem registrierten Schätzer gefallen war (Schätzung MDE₈₀(IC) 0,0495); MDE₈₀ des Laufs = 2,8016 × se aus `zellen/kombination.json`.

Ein Lauf, Testzahl 1, kein Rückhaltefenster (`rueckhalte: false`). Zelle `kombination` (mehrfaktor-2026-09-22/zelle/v1.1), Panel `querschnitt-pruefstand-2026-09-13/panel/v2`, Tafel `—` (die Kombinationszelle öffnet die Tafel nicht; die Bilanzwerte stecken in den Feldzellen mit Tafel v1.1), 92 Signaltage 2017-01-03 … 2024-08-01. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

| §7 | Bedingung | Zahl | |
|---|---|---|---|
| (a) | Nullpunkt Kombinationszelle + neun Feldzellen | Orakel ✓, Orakel-IC ✓ (1,0000), Placebo Symbole ✓, Zufall ✓, Klinke ✓, K-P4 ✓ | ✓ |
| (b) | Vorprüfung dokumentiert | `pruefung/vorpruefung-kombination.json`, Stand 2026-09-22T20:28:37.491Z | ✓ |
| (c) | IC Mittel ≥ MDE₈₀ | 0,0124 gegen 0,0505 | ✗ |
| (d) | t ≥ 3 | 0,69 | ✗ |
| (e) | letzte 12 Signaltage im Mittel ≥ 0 | 0,0536 (n 12, 2023-09-01 … 2024-08-01) | ✓ |

## 1. IC — der eine Test (`einzelmessung.ic`)

| n | Mittel | sd | se | t | MDE₈₀ (2,8016 × se) | Signaltage ohne IC |
|---|---|---|---|---|---|---|
| 92 | 0,0124 | 0,1728 | 0,0180 | 0,69 | 0,0505 | 0 |

Letzte 12 Signaltage (2023-09-01 … 2024-08-01): n 12, Mittel 0,0536.

| Jahresscheibe | n | IC Mittel |
|---|---|---|
| 2017 | 12 | -0,0178 |
| 2018 | 12 | 0,0310 |
| 2019 | 12 | -0,0361 |
| 2020 | 12 | -0,0686 |
| 2021 | 12 | 0,0543 |
| 2022 | 12 | 0,1115 |
| 2023 | 12 | -0,0277 |
| 2024 | 8 | 0,0729 |

## 2. Nullpunkt der Kombinationszelle (`zellen/kombination-nullpunkt.json`)

- **Orakel** ✓: Dezil − Universum brutto 18,59 / netto 18,53 Pp, t 29,4, Mittel/sd 3,05, Long-Short brutto 34,40 Pp (Schranken: Dezil ≥ 5 Pp, L-S ≥ 20 Pp, t ≥ 8); **IC 1,0000** (min 1,0000, max 1,0000, Toleranz 1e-9) ✓; IC des Dezil-Orakels nachrichtlich 0,9997.
- **Placebo Symbole** ✓: Dezil netto -0,214 Pp, t -1,27 (Dezil ✓); IC -0,0009, t -0,26 ✓.
- **Zufall ×12** ✓: Dezil brutto -0,017 / netto+Kosten -0,009 Pp, Ziehungen mit |t| über Schranke 0, se je Ziehung 0,110, MDE₈₀-Boden 0,309 Pp, Umschlag 90,3 % (Dezil ✓); IC Mittel -0,0006, se je Ziehung 0,0038, MDE₈₀-Boden(IC) 0,0106, Ausreißer 0 ✓.
- **Leck-Klinke** ✓: Verstöße Hauptlauf 0, Positivkontrolle {"kurs":1,"bilanz":1,"tag":"2017-01-03"}; Bilanzleser geöffnet false, Zugriffe 0, Verstöße 0.
- **Placebo Versatz:** entfällt für die Kombination (`ohneVersatz`, gehört in die Feldzellen); Maschine: {"bestanden":null,"uebersprungen":"Placebo Versatz gehoert in die Feldzellen; eine Kombination hat an t + 21 keine Werte","schranke":{"tEinzeln":3,"schrankePp":0.25}}.
- Nullpunkt gesamt: ✓ — Regel: bestanden = Orakel (Dezil-Schranken UND IC = 1) + Placebo Symbole (|t| < 3 fuer Dezil UND IC) + Zufall (Dezil-Schranken UND IC-Schranken) + Klinke; Placebo Versatz nur Diagnose (Vorregistrierung §9 (3), PM 22.09.2026; IC seit v1.1, Auftrag Nr. 61).

## 3. Dezil-Diagnose — berichtet, nicht beurteilt (Pp je Monatsperiode)

| Größe | n | Mittel | se | t | t_HH | MDE₈₀ | Marke |
|---|---|---|---|---|---|---|---|
| Dezil oben − Universum brutto | 92 | -0,159 | 0,265 | -0,60 | -0,57 | 0,743 | — |
| Dezil oben − Universum **netto** | 92 | -0,176 | 0,265 | -0,67 | -0,64 | 0,743 | — |
| Long-Short brutto | 92 | -0,141 | 0,705 | -0,20 | — | 1,974 | — |
| Long-Short netto | 92 | -0,141 | 0,704 | -0,20 | — | 1,973 | — |

Dezil unten − Universum: brutto -0,018 / netto -0,035 Pp (die Maschine führt für das Dezil unten nur die Mittel, keine se).

Umschlag Dezil 29,4 % / Universum 7,9 %; Kosten Dezil 0,024 / Universum 0,007 Pp je Monat. Perioden 92, Universum im Mittel 760,5, Dezil oben 76,5, Dezil unten 75,6, Mitglieder mit Wert 760,5.

| Jahresscheibe (netto) | n | Mittel | se | t | MDE₈₀ | dünn |
|---|---|---|---|---|---|---|
| 2017 | 12 | -0,057 | 0,449 | -0,13 | 1,259 | nein |
| 2018 | 12 | -0,256 | 0,273 | -0,98 | 0,764 | nein |
| 2019 | 12 | -0,475 | 0,731 | -0,68 | 2,047 | nein |
| 2020 | 12 | -2,089 | 0,866 | -2,52 | 2,427 | nein |
| 2021 | 12 | 0,393 | 0,747 | 0,55 | 2,092 | nein |
| 2022 | 12 | 1,296 | 0,726 | 1,86 | 2,035 | nein |
| 2023 | 12 | -0,799 | 1,039 | -0,80 | 2,912 | nein |
| 2024 | 8 | 0,958 | 0,347 | 2,95 | 0,972 | ja |

Letzte 250 Tage (netto, ab 2023-08-03): n 12, Mittel 0,699, se 0,388, t 1,88, MDE₈₀ 1,088.
Regime: SPY unter EMA200 n 17, Mittel -1,287 (t -1,46); über EMA200 n 75, Mittel 0,076 (t 0,31); ohne Regime 0.

## 4. Kontrollgrößen (§5) — Näherung, nur Bericht

NAEHERUNG (Auftrag §1.5): Spearman-Rangkorrelation zwischen Kombinationswert und Kontrollrang je Signaltag ueber die Mitglieder mit Kontrollwert (Z.ic der Maschine), Mittel ueber die Signaltage. rho > 0: hohe Kombinationsraenge gehen mit hohem Kontrollrang einher (gross bzw. verschuldet). Der mittlere Kontrollrang der Dezilmitglieder ist nicht berichtbar, weil die Maschine die Dezilmitglieder nicht ausweist. Nur Bericht, kein Tor.

| Kontrolle | ρ Mittel | sd | se | t | n Signaltage | min | max | Abdeckung |
|---|---|---|---|---|---|---|---|---|
| groesse | 0,2256 | 0,0730 | 0,0076 | 29,65 | 92 | 0,0222 | 0,4115 | 77,8 % |
| verschuldung | -0,0050 | 0,0779 | 0,0081 | -0,62 | 92 | -0,2269 | 0,1371 | 84,1 % |

## 5. Auffüllungen (K-P6 ✗)

Je Feld (fehlender Wert = mittlerer Rang, über 69969 Mitglied-Monate; `kombiniere.zaehler`):

| Feld | Auffüllungen | Anteil |
|---|---|---|
| momentum | 24 | 0,0 % |
| schwankung | 24 | 0,0 % |
| bewertung | 15697 | 22,4 % |
| ertragskraft | 32033 | 45,8 % |
| investition | 11646 | 16,6 % |
| sue | 12481 | 17,8 % |
| fue | 50342 | 71,9 % |

Je Dezil (`einzelmessung.aufgefuellt`, Zählweise der Maschine: Mitglied mit mindestens einem fehlenden Feld): Dezil oben 5933 von 7042 Mitglied-Monaten = **84,3 %** (Schwelle < 50 %; Höchstwert an einem Signaltag 98,9 %); Dezil unten 4078 von 6956 = 58,6 %. Nenner: Summe der Dezilgroessen k je Periode aus kombination-nullpunkt.json einzelmessungPerioden (Maschine). Je Feld **und** je Dezil weist die Maschine nicht aus; keine eigene Dezilbildung (Auftrag §1a.2).

## 6. Vorprüfung §6 (K-P5, `pruefung/vorpruefung-kombination.json`, Stand 2026-09-22T20:28:37.491Z, Commit 83a3981 2026-09-22 22:29:49 +0200)

- V1 (Kosten): mittlerer Dezil-Umschlag der sieben Feldzellen 21,4 % ⇒ Kosten 0,017 Pp je Monat gegen Kante/2 0,15–0,30 Pp — bestanden.
- V2 (IC): Median se(IC) 0,0177 (Faktor 5,0 über dem Kunstfeld-Boden 0,0035) ⇒ Schätzung MDE₈₀(IC) 0,0495 gegen erwarteten IC 0,02–0,03 — gefallen (obere und untere Grenze). MDE₈₀(IC) des Laufs: 0,0505.

## 7. Zähler, Abdeckung, Datenfunde

- Zähler der Einzelmessung: `{"perioden":92,"zuKlein":0,"tote":20,"toteTotalverlust":0,"luecken":11,"universumSumme":69969,"mitWertSumme":69969,"aufgefuellt":{"oben":5933,"unten":4078},"verworfen":{"klasse":279743,"quelle":0,"cent":1010,"vortage":1484,"qualitaet":6816,"ausfuehrung":13}}`.
- Abdeckung gesamt: `{"50-250":{"n":52419,"mit":52419,"anteil":1},"250-1000":{"n":14986,"mit":14986,"anteil":1},"ab1000":{"n":2564,"mit":2564,"anteil":1},"gesamt":{"n":69969,"mit":69969,"anteil":1}}`.
- Datenfunde nach Vorregistrierung §11 Nachtrag 2 (nicht in diesem Lauf gemessen, dort beziffert): Panel v2.1 klebt bei 101 Reihen zwei Notierungen zusammen (57 Mitglied-Monate von 69.969, 13 Symbole); die Fundamentaltafel trägt 15 isolierte Einheitenfehler bei 13 CIKs. Entscheid dort: Kombination auf v2.1 und Tafel v1.1 gerechnet, Fund ausgewiesen.

## 8. Lauf

- Maschine: `{"sekunden":5.36,"maxRssMB":1245.30078125,"tafelLadeSekunden":2.404,"werteNull":0,"bilanzZugriffe":0,"node":"v24.18.0"}`; Prozess gesamt 5,7 s, RSS 907 MB, Node v24.18.0.
- Aufrufe: `Z.kombiniere(zellen, [momentum, schwankung, bewertung, ertragskraft, investition, sue, fue], null, { kontrollen: [groesse, verschuldung] })` → Gewichte {"momentum":1,"schwankung":1,"bewertung":1,"ertragskraft":1,"investition":1,"sue":1,"fue":1}; `Z.zelleAusKombination(komb, { definition, quellen })` → Zelle `kombination`.
- Dateien der Maschine: `zellen/kombination.json`, `zellen/kombination-nullpunkt.json`, `zellen/kombination-bericht.md`; Prüfungen: `pruefung/kombination-pruefungen.json`; Skript: `kombination.js`.
- Repo-Stand vor dem Lauf: HEAD `7efb519`, Siegel der Vorregistrierung `71f8da3`. Commit des Laufs: der Commit, der diese Datei einführt (`git log -1 -- studien/mehrfaktor-2026-09-22/zellen/kombination.json`; Hash in der Übergabe).

## 9. Prüfungen K-P1–K-P8

| Prüfung | | Kern |
|---|---|---|
| K-P1 | ✓ | neun Zellen mehrfaktor-2026-09-22/zelle/v1.1, rueckhalte false, 92 Signaltage 2017-01-03 … 2024-08-01, Universen identisch, Tafel fundamentaltafel-2026-09-16/v1.1 bei sieben Bilanzzellen, null bei momentum/schwankung |
| K-P2 | ✓ | kein kunst |
| K-P3 | ✓ | Gewichte {"momentum":1,"schwankung":1,"bewertung":1,"ertragskraft":1,"investition":1,"sue":1,"fue":1}, Kontrollen groesse, verschuldung, umkehr nicht enthalten |
| K-P4 | ✓ | Nullpunkt aller neun Zellen bestanden (Versatz notiert: momentum ✓, schwankung ✓, bewertung ✗, ertragskraft ✓, investition ✓, sue ✗, fue ✓, groesse ✓, verschuldung ✓) |
| K-P5 | ✓ | Datei Stand 2026-09-22T20:28:37.491Z vor dem Lauf (2026-09-23T20:34:31.986Z), V1 bestanden, V2 gefallen |
| K-P6 | ✗ | Anteil aufgefüllter Mitglieder im Dezil oben 84,3 % |
| K-P7 | ✓ | Urteil aus IC Mittel 0,0124, MDE₈₀ 0,0505, t 0,69, letzte 12 0,0536; Kennung mehrfaktor-2026-09-22/zelle/v1.1, Tafel — |
| K-P8 | ✓ | kein Rückhaltelauf, rueckhalte false, letzter Signaltag 2024-08-01 |

## 10. Rückhaltefenster (§8, vom Lauf geschrieben, 2026-09-23)

**Einordnung nach §8 (wörtlich): „bestätigt"** — mittlerer IC der 24 Rückhalte-Signaltage 2024-09-03 … 2026-08-03 = 0,0095 (Vorzeichen +) gegen 0,0124 (Vorzeichen +) im Rechenfenster (§12). Regel: gleiches Vorzeichen = „bestätigt", sonst „widerspricht"; keine Anpassung, kein zweiter Lauf, keine Deutung darüber hinaus. Zellen: `zellen-rueckhalte/` (13 Feldzellen und `kombination`, `rueckhalte: true`, 116 Signaltage 2017-01-03 … 2026-08-03); die versiegelten Zellen in `zellen/` sind unangetastet. Prüfdatei `pruefung/kombination-pruefungen-rueckhalte.json`.

| Reihe | n | Mittel | sd | se | t | MDE₈₀ |
|---|---|---|---|---|---|---|
| **IC, Rückhaltefenster** | 24 | 0,0095 | 0,1250 | 0,0255 | 0,37 | 0,0715 |
| Dezil oben − Universum netto, Rückhaltefenster (Pp) | 24 | -0,3030 | 2,1360 | 0,4360 | -0,69 | 1,2215 |
| Dezil oben − Universum brutto, Rückhaltefenster (Pp) | 24 | -0,2875 | 2,1346 | 0,4357 | -0,66 | 1,2207 |
| IC, Gesamtreihe 116 Signaltage (nachrichtlich) | 116 | 0,0118 | 0,1636 | 0,0152 | 0,78 | 0,0426 |
| Dezil oben − Universum netto, Gesamtreihe (Pp, nachrichtlich) | 116 | -0,2022 | 2,4563 | 0,2281 | -0,89 | 0,6389 |

Gesamtreihe, letzte 12 Signaltage: n 12, IC Mittel 0,0346.

| Signaltag | IC | Paare | Dezil netto Pp | Dezil brutto Pp | Dezil k | Universum |
|---|---|---|---|---|---|---|
| 2024-09-03 | -0,1423 | 756 | -2,741 | -2,722 | 76 | 756 |
| 2024-10-01 | 0,0397 | 780 | 1,185 | 1,195 | 78 | 780 |
| 2024-11-01 | 0,0139 | 784 | 1,379 | 1,402 | 79 | 784 |
| 2024-12-02 | 0,0775 | 799 | -0,054 | -0,030 | 80 | 799 |
| 2025-01-02 | 0,1305 | 783 | 0,023 | 0,033 | 79 | 783 |
| 2025-02-03 | 0,2445 | 872 | 3,597 | 3,609 | 88 | 872 |
| 2025-03-03 | 0,0100 | 902 | -1,500 | -1,469 | 91 | 902 |
| 2025-04-01 | -0,0571 | 903 | -1,356 | -1,348 | 91 | 903 |
| 2025-05-01 | -0,1161 | 963 | -3,005 | -2,991 | 97 | 963 |
| 2025-06-02 | -0,3100 | 909 | -3,031 | -3,002 | 91 | 909 |
| 2025-07-01 | -0,0180 | 945 | -0,265 | -0,257 | 95 | 945 |
| 2025-08-01 | -0,0610 | 995 | -2,338 | -2,317 | 100 | 995 |
| 2025-09-02 | -0,0930 | 908 | -2,685 | -2,669 | 91 | 908 |
| 2025-10-01 | 0,0203 | 946 | 0,248 | 0,259 | 95 | 946 |
| 2025-11-03 | 0,1645 | 1036 | 1,589 | 1,610 | 104 | 1036 |
| 2025-12-01 | -0,0466 | 1014 | -0,535 | -0,515 | 102 | 1014 |
| 2026-01-02 | 0,0657 | 951 | 0,359 | 0,366 | 96 | 951 |
| 2026-02-02 | 0,1439 | 1006 | 2,232 | 2,236 | 101 | 1006 |
| 2026-03-02 | 0,1296 | 1062 | 0,979 | 1,007 | 107 | 1062 |
| 2026-04-01 | -0,0885 | 1081 | -1,857 | -1,848 | 109 | 1081 |
| 2026-05-01 | -0,1444 | 1053 | -4,305 | -4,290 | 106 | 1053 |
| 2026-06-01 | 0,1187 | 1071 | 3,958 | 3,976 | 108 | 1071 |
| 2026-07-01 | 0,1299 | 1081 | 1,256 | 1,264 | 109 | 1081 |
| 2026-08-03 | 0,0153 | 1099 | -0,404 | -0,396 | 110 | 1099 |

Gegenproben: die 92 Monate vor 2024-09-01 dieses Laufs gegen die versiegelte 92-Monats-Zelle — IC Mittel 0,012419 (Abweichung 0,000000), Dezil netto -0,175852 Pp (Abweichung 0,000000); Periodenreihe des Nullpunkts gegen `einzelmessung.dezilUni.netto.mittel` der Maschine: Abweichung 0,000000000.
Nullpunkt der Kombinationszelle (116 Signaltage): Orakel ✓ (IC 1,0000 ✓), Placebo Symbole ✓, Zufall ✓, Klinke ✓; Feldzellen K-P4 ✓. Prüfungen: K-P1 ✓, K-P2 ✓, K-P3 ✓, K-P4 ✓, K-P5 ✓, K-P6 ✗, K-P7 ✓, K-P8 ✓ (K-P6 Anteil Dezil oben 84,7 %).
Lauf: `{"sekunden":4.836,"maxRssMB":1303.17578125,"tafelLadeSekunden":1.187,"werteNull":0,"bilanzZugriffe":0,"node":"v24.18.0"}`, Prozess 5,4 s, RSS 936 MB. Dateien: `zellen-rueckhalte/kombination.json`, `zellen-rueckhalte/kombination-nullpunkt.json`, `zellen-rueckhalte/kombination-bericht.md`.

*Geschrieben von `kombination.js` am 2026-09-23T20:34:37.811Z aus `zellen/kombination.json` und `zellen/kombination-nullpunkt.json`; nichts abgetippt, was die Maschine nicht schreibt. Zwei Zeilen (Panel-Kennung in der Kopfzeile, Dezil unten in §3) nach dem Lauf aus `zellen/kombination.json` nachgetragen, weil der Generator sie falsch formatierte; der Generator ist korrigiert, die Maschinendateien sind unberührt. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.*
