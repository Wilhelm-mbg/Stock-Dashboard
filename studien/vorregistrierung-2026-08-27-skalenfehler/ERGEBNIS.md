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

*Null lokal = provisorische Zufalls-Erwartung für Datums-Treffer (nSprünge·nSplitTage·3/nHandelstage).
**Ersetzt durch den finalen Analytiker-Nullwert (~15:45):** Permutation, 1.000
Ziehungen, Saat 20260827, 113 Reihen mit Splits → **Erwartung 0,42 Datums-Treffer,
p95 = 2, Maximum 4** (analytische Schranke 0,45). Global beobachtet: **8** (F = 5,
F? = 3 aus 534 Einzelsprüngen über 275 Reihen) ≫ p95 — **die F-Klasse ist kein
Zufallsprodukt**; WHLRs 2 F-Treffer sind damit auch global gedeckt.

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

## Nachtrag (~15:45) — Analytiker-Endlieferung (BEFUND-EINZELSPRUENGE.md)

- **Trennfall-Liste jetzt zu dritt und datumsfest:** B (2025-05-09), QXO (2024-06-06),
  **DOC (2024-03-04**, ticker_change + Dividendenbruch + Drift — Analytiker-Befund,
  außerhalb meiner Kandidatenmenge).
- **IESC 24.08.2026** (1:2-Split, Analytiker-Sweep, nicht in meinen 16 Zeilen) —
  *präzisiert ~16:05:* Massive hat den Split eingearbeitet (adjusted ≈ 342 für
  19.–21.08.), unser 1d-Archiv steht EXAKT auf Massives Roh-Ansicht (697/683/685).
  Das ist die **VERZUG-Signatur** (Archiv konsistent-roh, Vendor fertig), noch kein
  belegter F-Fall — ob Yahoo-Verzug oder Misch-Fehler, entscheidet 06 morgen per
  direktem Yahoo-Abruf. Gleiche Vorsicht wie beim WHLR-Rand: **nicht heute
  reparieren, was der Nachtabruf morgen selbst setzt.**
- **Reichweiten-Grenze meines Joins, jetzt benannt (CBSH-Klasse):** Massive führt
  Aktiendividenden als 1:1,05-Splits. Sprünge unter Faktor 2 liegen außerhalb der
  vorregistrierten I1-Definition — **der Join sieht sie nicht.** Wer Aktiendividenden
  prüfen will, braucht eine eigene Registrierung mit kleinerer Faktor-Schwelle und
  entsprechend härterem Nullwert (viel mehr Zufalls-Kandidaten nahe 1,0).
- GBTC/ETHE: unentscheidbar mit EDGAR-Hypothese (registrierter Übergabepunkt beim
  Analytiker).

## Nachtrag (~19:35) — die Reichweite dieses Instruments, gemessen statt geschätzt

Auf zwei Prüffragen des PM am Code nachgemessen — **der Sprung-Detektor dieser Studie
ist für über die Hälfte der bekannten Fälle blind**, und zwar aus einem Grund, der
vor der Pendel-Logik greift:

1. **Die Faktor-2-Schwelle schneidet 53 % weg.** `FAKTOR_MIN = 2` sammelt nur Sprünge
   ≥ 2 bzw. ≤ 0,5. Von den 17 belegten Skalenreihen liegen **9 dazwischen** und sind
   damit unsichtbar, unabhängig von jeder Paar-Logik: SCCO 1,012 · CLM 0,984 ·
   GBTC 0,903 · QGEN 1,032 · ETHE 0,890 · CBSH 0,952 · LBRDK 0,936 · LBRDA 0,937 ·
   DOC 1,509. Dazu kommt die vom PM benannte zweite Blindheit: Eine **einmalige,
   dauerhafte Stufe** (Spin-off) hat keinen Gegensprung und wäre auch oberhalb der
   Schwelle kein Pendel.
2. **Der Ereignis-Abgleich kennt nur Splits** (join.js:57, `art === 'split'`).
   Ausschüttungen wie die Grayscale-Mini-Trust-Abspaltung tauchen dort per Definition
   nicht auf; für GBTC/ETHE existiert nicht einmal eine Ereignisdatei.

**Gefunden wurden diese Fälle von einem anderen Instrument** — dem Archiv-Quoten-
Vergleich (Konventions-Zensus der QS), der Niveauunterschiede misst und deshalb keine
Faktor-Schwelle hat. **Er ist die Zählung, nicht dieser Detektor.** Seine eigene
Grenze ist die Überlappung beider Archive (730 Tage): ältere Fälle hat niemand
gezählt, und Fälle, in denen beide Archive gleich falsch liegen, findet auch er nicht.

**Folge für eine Reparatur-Untersuchung:** Ein Abgleich, der nur Splits kennt, kann
eine Reparatur nicht begründen, deren Klasse auch Nicht-Splits enthält — der
Vorbehalt gehört vor die Untersuchung, nicht hinter sie.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
