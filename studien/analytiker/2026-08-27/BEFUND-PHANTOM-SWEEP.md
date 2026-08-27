# Phantom-Anpassungs-Sweep: Yahoo-Events gegen Massive-Events, plus die 17er-Frage

**Analytiker, 27.08.2026, ~18:30. PM-Auftrag (vorgezogen von 03:15).** Werkzeug
`phantom-sweep.js`, Rohdaten `phantom-sweep-ergebnis.json`. 288 Reihen geprüft
(alle mit vorhandenen Massive-Splitdaten + Kontrollen), je Reihe ein Yahoo-Abruf
(range=max → volle Ereignishistorie). Zählen, nichts geändert.

## 0. Instrumentenfehler, zuerst und offen

Die NVDA-Kontrolle war falsch aufgebaut (leere Massive-Liste statt echter Daten) —
NVDAs zwei Yahoo-Splits (2021, 2024) erscheinen dadurch fälschlich als
„Yahoo-only" und sind **Artefakte meines Skripts, keine Phantome**. Die
AAPL-Kontrolle (echte Liste) bestand: alle 5 Yahoo-Splits von Massive gedeckt,
AAPL taucht in keiner Abweichungsliste auf. Alle Zahlen unten sind um die zwei
NVDA-Zeilen bereinigt.

## 1. Kernzahlen

    geprueft: 288 Reihen   ·   beidseitig leer: 103   ·   Yahoo-Splits gedeckt: 215
    Yahoo-only: 260 Ereignisse in 110 Reihen   ·   Massive-only: 19

    Yahoo-only je Jahrzehnt: 1960er 1 · 70er 8 · 80er 46 · 90er 98 · 2000er 62
                             · 2010er 32 · 2020er 13

**Die Masse (215 von 260) liegt vor 2010 — das ist keine Phantom-Liste, sondern
die Abdeckungsgrenze von Massive:** für ältere Klein-/Mittelwerte führt Massive
schlicht keine Splits (AIG 1977–2000, CAR 1985–96, BOKF 1991–2004 …). Vor 2010
ist „Yahoo-only" ohne dritten Zeugen NICHT als Phantom deutbar.

## 2. Ab 2010 (45 Ereignisse) — hier trennt es sich

**(a) ~15 KRUMME Faktoren = Sonderereignisse, die Yahoo als Splits kodiert
(die RGR-Bauform, jetzt gezählt):** RGR 374:1000 (Giftpille, EDGAR-belegt) ·
OXY 1042:1000 (2014, California-Resources-Abspaltung) · WMB 10000:8152 (2012,
WPX-Abspaltung) · EHC 1257:1000 (2022, Enhabit) · JCI 10000:4971 + 955:1000
(2012/2016, Fusionen) · SAFE 1284:1000 + 16:100 · VYX 163:100 (2023,
NCR-Aufspaltung) · CTO 1228:1000 · GERN 1058:1000 · GRBK 1532:1000 ·
JILL 1191:1000 · RILY 101:100 · LEU 91:1000. **RGR ist kein Einzelfall — die
Kodierungs-Bauform tritt in ~5 % der geprüften Reihen auf.** (Die Deutungen in
Klammern sind benannte Hypothesen aus Faktor+Datum, einzeln EDGAR-prüfbar; belegt
ist bisher nur RGR.)

**(b) ~30 GLATTE Faktoren = Mischung aus zwei belegten Klassen:**
- **Massive fehlen echte Splits auch nach 2010:** QXO 1:8 (06/2024 — Massive: 0
  Einträge, heute früh gemessen) und MNST 2:1 (02/2012 — Massive führt nur
  2016/2023/2026). Zwei harte Belege; die übrigen glatten Fälle sind je einzeln
  zu prüfen.
- **Ticker-Recycling:** Yahoo-Events können dem FRÜHEREN Ticker-Inhaber gehören
  (DRS 2016, APPS 2013 …) — spiegelbildlich enthält auch die Massive-only-Liste
  Vor-Börsengang-Einträge unter heutigen Tickern (MRNA 2010–2017, UPST 2012,
  APLD 2003): **beide Vendoren mischen Alt-Inhaber unter aktuelle Kürzel.**

## 3. Die 17er-Frage des PM: Wer trägt das Phantom auf der 60m-Seite?

**Belegtes Phantom (falsche Kurse, kein reales Ereignis): genau 1 von 17 — RGR,
auf der 60m-Seite** (Yahoo-Rohhistorie ×2,674 umgeschrieben; das 1d trägt über
die zufällig richtige angepasste Ansicht die echten Kurse). Alle übrigen 16 sind
nach heutigem Stand REALE Ereignisse oder Trennfälle — dort ist keine Seite
„falsch", sondern roh gegen rückangepasst:

| Reihe | Quote 1d/60m vor Angleich | Klasse |
|---|---|---|
| RGR | 0,374 | **PHANTOM auf 60m** (einziger belegter Fall) |
| WHLR | 4,0 | realer 4:1 (heute), 1d vorweg-angepasst, 26.08. roh |
| BYND | 0,033 | realer 30:1, 60m nachgezogen, 1d-Historie alt + Juli-Flip-Flops |
| IESC | 2,0 | realer 1:2 (24.08.), 60m angepasst, 1d roh — **Quote stand schon seit 2023 auf 2,0: das 60m-Fenster trägt die angepasste, das 1d die rohe Historie** |
| MNST | 2,0 | realer 2:1 (11.08.2026); dazu **Flip-Flops im Juli 2026 (2,0/1,0 im Tageswechsel — BYND-Muster, neuer Fall)** |
| SOXS | 15,0 | realer Forward-Split 1:15 (26.05.2026) |
| CLM | 0,987 konstant | vermutl. Ausschüttungs-/Anpassungsdifferenz, klein |
| CBSH | 0,952 | reale 5-%-Aktiendividende (belegt) |
| SCCO | 1,012 | reale Quartals-Aktiendividenden ~0,99 (belegt, CBSH-Familie) |
| QGEN | 1,032 | reale 1,03er-Kapitalmaßnahmen (belegt, CBSH-Familie) |
| GBTC / ETHE | 0,903 / 0,890 | Spin-off-Hypothese (Mini-Trusts), EDGAR offen |
| SITC | 0,297 | reales Ereignis 01.10.2024 (vermutl. Spin-off), Endpunkte führen es nicht |
| B / DOC | driftend | Trennfälle (belegt) |
| LBRDA / LBRDK | 1,0 bis auf ein 6-Tage-Fenster 07/2025 (0,936) | Kleinstfall, ungeklärt — eher Datenlücke als Skala |

**Beide Richtungen kommen vor** (mal ist 60m die angepasste Seite: BYND/IESC/
SOXS; mal die rohe: WHLR; mal die falsche: RGR) — **„welches Archiv stimmt" ist
je Reihe UND je Segment zu entscheiden. Ein pauschaler Befund „das 60m trägt die
Phantome" ist durch die Zählung NICHT gedeckt: belegt ist ein einzelner Fall.**

## 4. Grenzen dieser Zählung (Auflagen erfüllt, Lücken benannt)

- Die 288er-Menge ist sprung-/ereignis-ausgewählt — für SAUBERE Phantome
  strukturell blind (die zeigen sich nur im Archiv-Vergleich; dafür ist die
  17er-Liste der Detektor, und deren Gegenzeuge reicht nur 730 Tage zurück:
  **Phantome älter als zwei Jahre haben keinen Wirkungs-Nachweis**).
- „In EDGAR nicht gefunden" gilt je geprüftem Fenster; die Krumm-Deutungen in
  2(a) sind Hypothesen mit Datum, nicht Urteile.
- Yahoos numerator/denominator-Konvention ist uneinheitlich — Matching lief in
  beiden Orientierungen ±3 %.
- **Meta-Lehre des Tages, jetzt gemessen statt vermutet: KEIN Vendor taugt allein
  als Ereignis-Referenz.** Yahoo kodiert Nicht-Splits als Splits und schreibt
  dabei Rohhistorien um; Massive fehlen echte Splits (QXO, MNST 2012) und es
  mischt Vor-IPO-Einträge unter heutige Ticker. Ereignis-Urteile brauchen
  mindestens zwei Vendoren plus EDGAR als Schiedsrichter.
