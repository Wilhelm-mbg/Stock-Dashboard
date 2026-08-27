# Einzelsprünge gegen den Ereignis-Zeugen: Grundrate, Nullwert, und die krummen Sieben

**Analytiker, 27.08.2026, ~16:15. PM-Budget-Auftrag (dritte Kandidatenmenge).**
Trennregel Fassung 2 mit vorab fixierten Klassen (TRENNREGEL-EINZELSPRUENGE.md),
Hypothesen mit vorab fixierten Widerlegungskriterien (HYPOTHESEN-KRUMME-SIEBEN.md).
Abrufe: 275 Reihen Splits (davon 26 im zweiten Durchgang nach einem ~90-minütigen
Netzausfall — Endstand 0 Fehler, alle 275 abgedeckt), plus 5 Nachlauf-Calls.
Ablage: `einzelspruenge/` (getrennt von der vorregistrierten Menge), Rohdaten der
Nachlauf-Calls in `krumme-sieben-daten.json`.

## 1. Grundrate und Nullwert — nebeneinander, wie verabredet

    Beobachtet (534 Einzelspruenge in 275 Reihen):
      F   (Anpassungsfehler-Koinzidenz)     :   5
      F?  (Datum trifft, Faktor nicht)      :   3
      U   (kein Split, unentscheidbar)      : 526
      X   (nicht pruefbar)                  :   0

    Nullwert (Permutation, 1.000 Ziehungen, Saat 20260827, 113 Reihen mit Splits):
      Erwartung Zufalls-Koinzidenzen : 0,42     95. Perzentil : 2     Maximum : 4
      analytische obere Schranke     : 0,45

**Beobachtete F+F? = 8 gegen p95 = 2 → die Koinzidenz-Zählung ist belegt, kein
Zufallsprodukt.** Und die Grundrate in der gedrehten Semantik gelesen: **526 von
534 Sprüngen (98,5 %) haben positiv belegt KEINEN Split** — die Rückanpassung des
Tagesarchivs funktioniert fast immer; die Sprungmasse ist Markt oder nicht
geführte Ereignisse, kein Anpassungsproblem. Die Anpassung versagt in **5 belegten
Fällen** (plus 3 unklaren) — eine kurze, konkrete Liste statt eines diffusen
Verdachts.

## 2. Die F/F?-Liste (vollständig)

| K | Reihe | Sprungtag | Faktor | Split laut Massive | Einordnung |
|---|---|---|---|---|---|
| F | WHLR | 26.08.2026 | 0,272 | 4:1, Ausf. 27.08. | bekannter Teilanpassungs-Fall von heute früh (Eichfall) |
| F | WHLR | 03.04.2017 | 8,237 | 8:1, 03.04.2017 | Altfall derselben Klasse, Fund der Positivkontrolle |
| F | IESC | 24.08.2026 | 0,474 | 1:2 (Forward), 24.08. | **NEU und frisch: der Split von vor drei Tagen ist im 1d nicht geglättet** — steht auch in der QS-17er-Liste („IESC 2:1") |
| F | WY | 20.07.2010 | 0,381 | Faktor 0,409, 20.07.2010 | **NEU:** Weyerhaeusers Aktien-Sonderausschüttung 2010 nicht angepasst |
| F | EXPE | 21.12.2011 | 0,488 | 2:1 (Reverse), 21.12.2011 | **mit Vorbehalt:** am selben Tag fand die TripAdvisor-Abspaltung statt — Sprung ist Kombination aus Split UND Spin-off; die reine F-Lesart greift zu kurz |
| F? | SMCX | 20.03.2026 | 0,334 | 2er-Split am 19.03. | Datum ±1, Faktor verfehlt — Teil-/Falsch-Anpassung oder Zusatzereignis |
| F? | UCO | 21.04.2020 | 0,432 | 25:1, 21.04.2020 | Datum exakt, Faktor weit daneben — vermutlich ECHTER Ölcrash-Tag auf korrekt geglättetem Split-Datum; F? fängt also auch reale Bewegungen an Split-Tagen (gewollt: „man weiß, dass etwas nicht stimmt, nur nicht was") |
| F? | WEN | 05.09.2003 | 0,315 | 1:2, 05.09.2003 | Datum exakt, Faktor verfehlt |

## 3. Hinweis-Spalten unter U (Hinweise, keine Urteile)

H-Tick 19 (exakte 2er-Faktoren bei Sub-Dollar-Kursen — c4s Tick-Raster-Hypothese) ·
H-Fenster 62 (im 730-Tage-Fenster, per 60m-Zweitzeuge nachprüfbar) · H-Extrem 67
(Faktor ≥4 — als reine Marktbewegung selten, naheliegende Stichprobe). Beispiele
korrekt in U: AAPL 29.09.2000 (realer Kurssturz), AMC/GME 2021 (Squeeze),
AIG/APA 2008/2020 (Crashs), die ARWR-1990er-Pendel.

**QS-17er-Zusatzspalte:** 14 U-Zeilen und 3 F/F?-Zeilen liegen in Reihen der
berichtigten QS-Skalenliste (BYND, ETHE, IESC, MNST, SOXS, WHLR) — dort überlagern
sich Einzelsprung- und Skalen-Befund; die Zeilen tragen den Vermerk.

## 4. Die krummen Sieben — Ergebnisse gegen die VORAB fixierten Kriterien

- **CBSH: BESTÄTIGT (starke Form).** Der Splits-Endpunkt führt die jährlichen
  5-%-Aktiendividenden als 1:1,05-Einträge — 22 Stück seit den 90ern, darunter
  **exakt der vorhergesagte 01.12.2023**. Zahl (1,05) und Datum getroffen. Damit
  wandert CBSH aus „krumm/unerklärt" zu **Split-belegt** — und als Nebenertrag:
  **Massive führt Aktiendividenden im Splits-Datensatz**, künftige Matches müssen
  auch 1,0x-Faktoren prüfen.
- **DOC: BELEGT nach dem B-Standard (alle drei Merkmale).** ticker_change auf DOC
  am **04.03.2024** — exakt der lokal vorhergesagte Quoten-Sprungtag (Healthpeak,
  vorher PEAK seit 2019) — UND Dividendenbruch (0,23 $ bis 01/2024, 0,30 $ ab
  02/2024) UND driftende Quote (3,55/4,25 %). **DOC ist ein Trennfall der
  B-Klasse: zwei Firmen unter einem Kürzel, gehört geteilt, nicht repariert.**
- **GBTC / ETHE: wie registriert unentscheidbar mit diesen Endpunkten.** An den
  Sprungdaten (30.07./23.07.2024) ist der Splits-Endpunkt leer (nur Alt-Splits
  1:91/2018 bzw. 1:9/2020 — die Abdeckung von Trust-Splits existiert also
  grundsätzlich). Die benannte, extern prüfbare Hypothese bleibt: Grayscale-
  Mini-Trust-Abspaltungen Juli 2024 (Faktoren 0,9033/0,8897 ≈ 10/11 %
  abgespalten). **EDGAR-Prüfung (8-K um die Daten) ist der registrierte nächste
  Schritt** — zusätzlicher Zeuge, kein rückwirkender Ersatz.

## 5. Was diese Messung NICHT kann (unverändert plus Neues)

Spin-offs/Ticker-Events stehen nicht im Splits-/Dividenden-Datensatz (GBTC/ETHE,
SITC bleiben deshalb dort unentscheidbar) · ETF-/Trust-Split-Abdeckung bleibt
unter Vorbehalt (DFEN-Fall) · Microcap-Abdeckung der 1990er unbelegt (ARWR-
Vorbehalt der Rolle Berechnungen, geteilt) · F? mischt Teil-Anpassungen mit
echten Bewegungen an Split-Tagen (UCO) — die Klasse ist bewusst eine
„hier stimmt etwas nicht"-Liste, kein Urteil.
