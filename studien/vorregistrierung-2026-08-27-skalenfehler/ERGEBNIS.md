# Ergebnis — Skalen-Diagnose §2-Join: Urteil je Reihe/Segment (27.08.2026, ~13:20)

**Eichung 9/9 bestanden** (nach einer dokumentierten Eich-Iteration: Rand-Fenster für
heute ausgeführte Splits, Nachtrag 5). Grundlage: lauf-2026-08-27-10-14.json (I1/I2,
Wächter W1 50/50, W2 0,72 %) × 35 Ereignis-Dateien des Analytikers (Massive, Konvention
im Dateikopf) × Archive auf E:. **Nichts geschrieben, nichts repariert — Tabelle für
Wilhelms Einzel-Entscheid je Reihe.**

## Tabelle je Reihe (Klassen je Sprung: F = Datum+Faktor treffen · F? = nur Datum ·
F-ECHO = nur Faktor (Skalen-Mischung) · U = kein Ereignis-Bezug)

| Reihe | Urteil (Zusammenfassung; Details je Segment im join-JSON) | F/F?/Echo/U | Null lokal* |
|---|---|---|---|
| **BYND** | **1d-Seite mischt Skalen** — 5 Echo-Sprünge ≈ ×30 (Juli/Aug 2026, Split ×30 am 14.08.); Quote-Segmente 0,0333→1 | 0/0/5/4 | 0,015 |
| **WHLR** | **GEGENLÄUFIG — beide Archive haben an der Reihe gearbeitet:** F-Altfall 03.04.2017 (q 8,24 auf ×8, roh-Rest in alter Historie) · Echo 2024/2025 · **F am 26.08.2026** (q 0,272: roher Randbalken in ×4-Historie) · **Rand = VERZUG, keine kaputte Seite** (60m konsistent-roh bis 26.08., 1d rückangepasst um ×4 wegen Split-Ausführung 27.08.; beide letzten Balken identisch roh 0,399) | 2/0/2/1 | 0,069 |
| **B** | TRENNFALL (Quote driftet; ticker_change 2025-05-09 als dritter Zeuge) — teilen, nicht reparieren | 0/0/0/0 | 0 |
| **QXO** | TRENNFALL (Quote driftet; ticker_change 2024-06-06) — teilen, nicht reparieren | 0/0/0/5 | 0 |
| **RGR** | Versatz (0,374→1), aber **0 geführte Splits** → unentscheidbar mit diesen zwei Endpunkten (Seite kennt nur der externe Massive-Zeuge: 60m) | 0/0/0/0 | 0 |
| **SITC** | Versatz (0,2975→1), 2 geführte Splits treffen die Segmentgrenze nicht → unentscheidbar (Spin-off fehlt in den Endpunkten) | 0/0/0/0 | 0 |
| ARWR | nur U (60 Sprünge, 1 geführter Split ×10 2011 passt nirgends) → unentscheidbar | 0/0/0/60 | 0,022 |
| BYRN | nur U (23; Split ×10 2021 passt nirgends) → unentscheidbar | 0/0/0/23 | 0,014 |
| ASTH | nur U (18; 0 geführte Ereignisse) → unentscheidbar | 0/0/0/18 | 0 |
| HROW | U (14) + 1 Echo ×5 2011 — **schwach**: der geführte ×5-Split liegt 2013, zwei Jahre nach dem Sprung | 0/0/1/14 | 0,009 |
| IOVA/TGTX/WT/CHRD/INDV/BLNK | nur U → unentscheidbar (Quote am Rand konsistent) | — | ≈0 |

*Null lokal = provisorische Zufalls-Erwartung für Datums-Treffer (nSprünge·nSplitTage·3/nHandelstage);
der unabhängige Analytiker-Nullwert aus dem 275er-Lauf ersetzt sie. WHLRs 2 F-Treffer
gegen lokal 0,069 erwartete: kein Zufallsprodukt.

## Was die drei PM-/QS-Fragen jetzt messbar beantwortet

1. **ARWR/BYRN/ASTH** (QS alt: »harmlos, mehrfache Splits« · PM-Sorge nach
   Semantik-Drehung: »Anpassungsfehler«): **beides nein** — Massive führt dort 0–1
   Splits, keiner passt nach Datum oder Faktor. Die Sprünge bleiben »unentscheidbar
   mit diesen zwei Endpunkten« (Archivfehler ODER nicht geführtes Ereignis;
   Massive-Abdeckung für Microcaps der 1990er ist unbelegt — nicht raten).
2. **Segment-Pflicht:** umgesetzt — WHLR trägt vier datierte Einzel-Urteile statt
   eines Reihen-Urteils, plus GEGENLÄUFIG-Flag. »Bei WHLR ist X kaputt« ohne
   Zeitraum+Konvention wäre für jeden Teilzeitraum falsch.
3. **Konvention:** Der Rand-Versatz ×4 ist KEIN Schaden, sondern Anpassungs-Verzug
   (roh vs. rückangepasst). **Warnung: Er verschwindet voraussichtlich mit dem
   nächtlichen 60m-Abruf von selbst — wer heute repariert, zerstört morgen.**

## Deutungsgrenzen

- F-ECHO belegt Skalen-Mischung nur über den Faktor; ohne Zeitnähe (HROW) ist es
  schwach und wird nicht als Beleg geführt.
- Dividenden blieben ungenutzt (Kontinuitäts-Zeuge wäre ein eigener Schritt).
- ETF-Vorbehalt (DFEN): hier ohne Wirkung — alle 16 Zeilen sind Aktien; gilt aber
  für jede S1-Erweiterung.
- Der lokale Nullwert ist eine Erwartungs-Formel, kein gemessenes Placebo; die
  Grundrate des Analytikers ist maßgeblich.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
