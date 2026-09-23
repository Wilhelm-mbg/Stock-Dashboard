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

*Geschrieben von `kombination.js` am 2026-09-23T20:34:37.811Z aus `zellen/kombination.json` und `zellen/kombination-nullpunkt.json`; nichts abgetippt, was die Maschine nicht schreibt. Zwei Zeilen (Panel-Kennung in der Kopfzeile, Dezil unten in §3) nach dem Lauf aus `zellen/kombination.json` nachgetragen, weil der Generator sie falsch formatierte; der Generator ist korrigiert, die Maschinendateien sind unberührt. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.*
