# Kapitulation neu messen — Phase 1: Machbarkeit (Auftrag Nr. 65, 03.10.2026)

**Die Zählung ist eine Stichprobe: 400 von 7.299 Reihen** (126 lebend / 274 verschwunden, Saat `kapitulation-2026-10-03`).
Die Vollzählung hätte nach gemessenem Durchsatz rund **122 Minuten** gebraucht (400 s für 6,42 GB mit acht Prozessen, die Platte
begrenzt) — über der 30-Minuten-Grenze aus §1a.4. **Blind:** es wurde keine Rendite eines Kapitulations-Signals gerechnet; die
einzigen Renditen stammen aus Zufallseinstiegen (Topf), aus denen jeder Reihentag mit echtem Signal ausgeschlossen ist.
Alle Zahlen stehen in `ergebnis.json` (aus `roh/*.json`, erzeugt von `zaehlen.js` → `auswerten.js`; `test.js` 12 grün).

**Urteil: am Rand.** Für den behaupteten Effekt (+1,107 Pp) reicht die Zahl der Signaltage; für den um die Überlebensverzerrung
gekürzten Effekt (+0,68 Pp, Band 0,36 … 0,92) reicht sie knapp oder nicht; ein Nein in Hürdengröße ist ausgeschlossen.

## 1. Die Strategie, wörtlich

**Auslöser** — `quant.js`, Funktion `einstiegSignal` (ab Zeile 1748), Zweig `P.ENTRY === 'kapitulation'`:

```
1751  var win = bars.slice(Math.max(0, ci - Math.max(P.period * 4, P.CHAN ? 380 : 260)), ci + 1);
1837  var rk = reversionSignal(win, P.LINE, P.period, P.ZTHR);
1838  if (rk.signal !== 'call') return null;
1840  try { kk = kanalUeber(bars, Math.max(0, ci - 200), ci); } catch (eK3) { }
1841  if (!kk || kk.trend !== 'ab') return null;
1843  for (var vq3 = win.length - 51; vq3 < win.length - 1; vq3++) {
1844    if (vq3 >= 0) { vsK3 += (win[vq3][2] || 0); vnK3++; }
1847  if (!(vAvg3 > 0 && (win[win.length - 1][2] || 0) > 1.3 * vAvg3)) return null;
```

- Überdehnung (`reversionSignal`, `quant.js:1074–1093`): Abstand Schluss − EMA20, geteilt durch die EMA, über die letzten 80 Kerzen
  zentriert und durch die Standardabweichung geteilt; `var signal = z <= -zThr ? 'call' : …` (Zeile 1090) mit `ZTHR = 2.0`; dazu
  `if (signal === 'call' && !(closes[n - 1] > closes[n - 2])) signal = null;` (Zeile 1093) — die Signalkerze muss über dem Vorschluss schließen.
- Abwärtskanal (`kanalUeber`, `quant.js:2419`): Regressionsgerade über 200 Kerzen, Breite aus dem 92./8. Perzentil der Abweichungen;
  `var hub = steig * (n - 1);` / `var trend = hub > breite * 0.5 ? 'auf' : hub < -breite * 0.5 ? 'ab' : 'seit';` (Zeilen 2471–2472).
- Umsatzbestätigung: Stückzahl der Signalkerze > 1,3 × Mittel der 50 Kerzen davor (Zeilen 1843–1847).

**Aufruf und Variante V2** — `studien/messmaschine/strategien/kapitulation.js`:

```
28   var P = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0,
29             MINQ: 0, CHAN: false, MTF: false, TREND: false };
147    zeitrahmen: '60m',
150    leseFensterKerzen: 261,
151    haltedauerKerzen: 26,
152    richtung: 'long',
161      { liquiditaet: true, regime: true },
165        var dv = dollarVolNachlaufend(bars, i, 20);
166        if (dv == null || dv < 50e6) return null;
168      if (params.regime && marktUeberLinie(bars[i][0]) === true) return null;
```

- **Umsatzfilter** (Zeilen 36–58): **Mittel** (nicht Median) des Tagesumsatzes der 20 Handelstage **vor** dem Signaltag, je Tag die Summe
  Schluss × Stück der 60m-Kerzen; unter 20 Vortagen kein Signal.
- **Regime** (Zeilen 70–96, 116–125): Reihe **SPY, 60m**; `ema = s[q][1] * k + ema * (1 - k)` mit `k = 2 / (200 + 1)` auf
  **Stundenschlüssen**; `ueber.push(q >= 200 ? s[q][1] > ema : null)`. Gesperrt wird nur, wenn SPY **über** der Linie liegt (`=== true`);
  „gleich" und „kein Urteil" lassen durch. Maßgeblich ist die letzte SPY-Kerze **streng vor** dem Stempel der Signalkerze.
- **Einstieg/Ausstieg** (Protokoll, Entscheidung C8 und Feld `ausstieg`): Einstieg zum Schluss der Signalkerze, Ausstieg nach genau
  26 fertigen Kerzen zum Schluss (Zeit-Ausstieg, kein Stop, kein Ziel); 7 Stundenkerzen je Tag ⇒ 3,7 Handelstage.

**Was das Protokoll vom 26.08.2026 zählte** (`studien/messmaschine/protokolle/kapitulation-2026-08-26.json`, Maschine 1.2.0):
*Signal* = jede Stundenkerze `i ≥ 261` mit Auslöser und vorhandener Ausstiegskerze (`i < Länge − 26`), ohne Abklingzeit — aufeinander
folgende Kerzen desselben Werts zählen einzeln. *Tag* = UTC-Kalendertag der Signalkerze; Urteilsgröße ist das Mittel der Tagesmittel
des Überschusses gegen die „Erwartung Symbol × UTC-Stunde" (A7-Lesefenster ausgeschnitten), t über Tage. Universum 2.201 Werte
(„Ueberlebende"), 730 Handelstage 2023-09-26 … 2026-08-24, Schnitt 2025-03-12. V2: 2.567 Signale an 163 Tagen; Entdeckung 65 Tage
−0,367 Pp, Bestätigung 98 Tage +1,107 Pp, se 0,517, t 2,14, Urteil `nicht-bestaetigt`. (Schleife und Tagesschlüssel sind aus den
Protokollfeldern und aus `kapitulation-schwanz.js:49–68` gelesen, das die Maschine nachstellt — `messmaschine.js` selbst wurde in
diesem Auftrag nicht gelesen.)

**Befunde Code ↔ Protokoll ↔ Auftragstext**

1. Die Strategiedatei ist zeichengleich mit der im Protokoll eingebetteten Quelle (8.393 Zeichen); die drei Funktionen in `quant.js` sind
   seit dem Stand vor der Messung unverändert (die Änderungen seither liegen an anderen Stellen der Datei). Gemessenes = heutiger Code.
2. `strategien.js:41–42` nennt für den Kapitulations-Dip „t = 4,6" und „+0,94 Pp, t = 3,1" — das sind Zahlen der August-Studien, nicht
   des Protokolls (dort t 2,14, nicht bestätigt, Entdeckungshälfte negativ). Oberflächentext und Protokoll weichen ab.
3. „SPY unter EMA200" heißt im Code: **Stundenbasis**, gesperrt nur bei „über", Kerze streng vor dem Signal (siehe oben).
4. „≥ 50 Mio $" ist ein **Mittel**; die Kostenklassen sind nach dem **Median** geschnitten. 15 der 456 V2-Signale der Stichprobe
   liegen deshalb in der Klasse 5–50 Mio $ (Hürde 0,157 Pp).
5. Das Protokoll clustert über Tage, aber nicht über die Überlappung der 3,7-Tage-Fenster. Mit der hier am Placebo gemessenen
   Aufblähung (1,351) wird aus t 2,14 ein t von 1,84 (Anhaltswert, `aufloesung.zusatz`).

## 2. Messgerät

| Gerät | trägt | es fehlt |
|---|---|---|
| Minuten-Messgerät v4 (`studien/vorregistrierung-2026-09-06-signale-minuten/`) | Lesen des Archivs (bereinigt vor roh, Lebenszeit, Sperrtage), Klassen und Kassa-Hürde je Tag, Zellen je ET-Tag × Klasse × lebend, Placebos | Zeitrahmen 60m; Halten über Tages- und Jahresdatei-Grenzen (Erträge enden am Sitzungsschluss); Vorlauf 261 Stundenkerzen ≈ 38 Tage (Warmlauf 16); Umsatz- und Regime-Tor; Überlappungs-Statistik; Buchung bei Reihenende |
| Querschnitts-Prüfstand (`studien/querschnitt-pruefstand-2026-09-13/`) | Hansen-Hodrick/Block-Statistik (`statistik.js`), Totalverlust-Regel §3.6 mit Grundtafel | arbeitet auf der Tagestafel mit Rängen; ein Auslöser auf Stundenkerzen ist dort nicht darstellbar |
| alte Messmaschine 1.2.0 + `strategien/kapitulation.js` | der gemessene Auslöser, Tore, Protokollform | liest ein 60m-Archiv im Yahoo-Format (wäre ein Archiv-Neubau), lädt alles in den Speicher, Kontrolle ohne Tagesbereinigung, keine Überlappungskorrektur, Signale ohne Ausstiegskerze fallen still heraus (genau die Verschwundenen), Pauschalkosten |

**Empfehlung:** keine zweite Maschine und kein Umbau eines abgenommenen Geräts. Das Zählskript dieses Ordners setzt die drei Geräte
bereits zusammen — Auslöser aus der Strategiedatei (unverändert), Lesen und Klassen aus dem Minuten-Messgerät, Statistik aus dem
Prüfstand — und ergänzt nur 60m-Verdichtung und SPY-Regime aus demselben Archiv (geprüft in `test.js`). Für Phase 2 fehlt:
Rendite der Signale gegen den Tagestopf, Buchung bei Reihenende nach §3.6, Kosten je Klasse, die Tore der Vorregistrierung
(Nullpunkt, Leck-Klinke, se vor dem Mittel) und eine Abnahme. **Aufwand:** ein Bau-Auftrag 150–200k Token, dazu ein Lauf von rund
2 Stunden (`--alle --teil k/8`, je Teil fortsetzbar; 122 GB lesen). Eine Beschränkung auf Reihen mit liquiden Tagen spart wenig:
158 der 400 Stichproben-Reihen tragen 73,9 % der Bytes.

## 3. Signalzählung (Stichprobe, hochgerechnet)

Fenster 2016-01-04 … 2026-08-31, 2.680 Handelstage; das Regime-Tor ist an **941** Tagen offen (exakt, aus SPY; 909 nach 37 Tagen
Vorlauf). Gelesen 2.461 Jahresdateien; **36 laut `_lebenszeit.json` geführte Jahresdateien fehlen** auf der Platte (nicht untersucht).
Gewicht je Reihe 18,30 (lebend) / 18,22 (verschwunden). Bänder: 95 %, Bootstrap über Reihen je Schicht.

| | Signale Stichprobe | hochgerechnet | Band | Signaltage Stichprobe | auf Verschwundenen | Band |
|---|---:|---:|---|---:|---:|---|
| ohne Regime (V1) | 890 | 16.279 | 12.745 … 20.157 | 477 von 2.643 | 13,1 % | 6,0 … 22,1 % |
| **mit Regime (V2)** | **456** | **8.341** | 6.348 … 10.463 | **224 von 909** | **11,4 %** | 5,0 … 19,7 % |

Belegung: 158 Reihen mit liquiden Tagen, 122.129 liquide Reihentage (42.826 bei offenem Tor) ⇒ 0,73 % Signale je liquidem
Reihentag (V1), 1,07 % je offenem liquidem Reihentag (V2).

**Je Jahr** (Signale Stichprobe / hochgerechnet / Signaltage Stichprobe / auf Verschwundenen):

| Jahr | V1 | V2 | Tor offen (Tage) |
|---|---|---|---:|
| 2016 | 59 / 1.078 / 32 / 17 | 27 / 494 / 16 / 7 | 108 |
| 2017 | 49 / 896 / 34 / 16 | 8 / 146 / 8 / 0 | 49 |
| 2018 | 95 / 1.736 / 52 / 30 | 58 / 1.060 / 30 / 16 | 120 |
| 2019 | 56 / 1.024 / 34 / 9 | 28 / 512 / 13 / 5 | 67 |
| 2020 | 80 / 1.463 / 26 / 10 | 64 / 1.171 / 15 / 7 | 75 |
| 2021 | 73 / 1.335 / 50 / 8 | 24 / 439 / 15 / 2 | 61 |
| 2022 | 76 / 1.390 / 47 / 9 | 61 / 1.116 / 39 / 8 | 168 |
| 2023 | 96 / 1.757 / 49 / 5 | 44 / 805 / 26 / 0 | 94 |
| 2024 | 89 / 1.628 / 46 / 6 | 22 / 402 / 11 / 3 | 54 |
| 2025 | 144 / 2.635 / 61 / 7 | 86 / 1.574 / 27 / 4 | 80 |
| 2026 | 73 / 1.336 / 46 / 0 | 34 / 622 / 24 / 0 | 65 |

**Je Umsatzklasse des Signaltags** (Median der 20 Balkentage davor; Signale / hochgerechnet / Signaltage Stichprobe / auf Verschwundenen):

| Klasse (Hürde je Umlauf) | V1 | V2 |
|---|---|---|
| 5–50 Mio $ (0,157 Pp) | 39 / 712 / 28 / 16 | 15 / 274 / 14 / 4 |
| 50–250 (0,085) | 613 / 11.212 / 356 / 84 | 315 / 5.762 / 171 / 39 |
| 250–1.000 (0,065) | 190 / 3.476 / 129 / 17 | 104 / 1.903 / 70 / 9 |
| ab 1.000 (0,045) | 48 / 878 / 35 / 0 | 22 / 403 / 17 / 0 |

**Signaltage des Universums (V2)** — die Größe, auf die es ankommt, und die unsicherste der Stichprobe: ein Tag ist Signaltag, sobald
*irgendeine* der 7.299 Reihen feuert; 5,5 % der Reihen sehen das nur an einem Teil der Tage.

| Fenster | Untergrenze (Stichprobe) | Modell | geeicht am alten Protokoll | Obergrenze (Tor offen) |
|---|---:|---:|---:|---:|
| **unberührt** (vor 2023-09-26, nie auf 60m gemessen) | 154 | **403** | **493** | 683 |
| altes Fenster (ab 2023-09-26) | 70 | 157 | 163 (Protokoll, 2.201 Überlebende) | 226 |
| gesamt | 224 | 559 | 656 | 909 |

Modell = Gamma-Poisson-Verdünnung, angepasst an Mittel und Null-Anteil der Tageszahlen. **Es schätzt zu tief:** aus der halben
Stichprobe sagt es für die ganze 194,6 Signaltage voraus (Band 164,6 … 226,1), gezählt sind 224 (Faktor 1,15); im alten Fenster liegt es
mit 157 unter den 163 des Protokolls. Die Eichung überträgt die Quote des alten Protokolls (163 von 226 offenen Tagen, 72,1 %) auf die
offenen Tage. Sicher sind nur die Grenzen. Anhäufungskurve der Stichprobe (Signaltage bei 50/100/200/300/400 Reihen):
43 / 73 / 136 / 181 / 224 — noch weit von der Sättigung.

**Häufung:** in der Stichprobe je Signaltag Median 1, P95 5, Maximum 25 Signale (V2; V1: 1 / 4 / 25); die stärksten 5 % der Tage
tragen 23,9 % der V2-Signale. Im Universumsmaßstab sind das im Mittel 12,7 … 14,9 Signale je Signaltag (altes Protokoll: 15,7).

**Ränder:** Signale an Sperrtagen um nicht angewandte Maßnahmen 0; Signale, deren Reihe innerhalb der Haltedauer endet: **1** (V2,
0,2 %) — die Totalverlust-Regel trifft wenige Fälle, aber jeder zählt −100 %; Abweichung Umsatztor Skript/Strategiedatei 0.

**Verzerrungsfrage in Zahlen:** 11,4 % der V2-Signale liegen auf später verschwundenen Reihen (Band 5,0 … 19,7 %) — obwohl diese
68 % der Reihen stellen: der Umsatzfilter hält die meisten fern. Mit der gemessenen Lücke der Dip-Familie (−3,78 Pp je Paartag,
`studien/verzerrungsrichtung-2026-08-26/`) ergibt das eine Verschiebung von −0,43 Pp: **erwarteter Effekt +0,68 Pp** (Band des
Anteils ⇒ 0,36 … 0,92). Die Übertragung ist eine Annahme (dort Tagesdaten, Rutsch ≥ 10 % in 5 Tagen, H = 4 Tage).

## 4. Die 47 Split-Sätze ohne Kurssprung (Nr. 41)

Alle 47 Reihen wurden **ganz** gezählt (keine Stichprobe; `roh/sperrliste.json`). **44** Sätze sind in `alpaca1m-bereinigt` angewandt
(nicht: FNF, HON, INPX). Der Sprung am Ex-Tag (erste Stundenkerze gegen die letzte davor): **32** bei ≤ −50 % (bis −99,1 %),
7 zwischen −10 % und −49 % (GSK, IHG, IR, MFGP, MFH, MNTX, WHLR), **5 nach oben** (DRS +44 %, EBIX +198 %, TRNX +272 %,
SMTS +4.844 %, MFCB +10.591 %) — der Auftrag nannte 44 Sprünge von −50 … −98 %.

| Fenster um den Ex-Tag (e = erste Kerze am Ex-Tag) | V1-Signale | V2-Signale |
|---|---:|---:|
| e−26 … e−1 (Halteperiode überspannt den Sprung) | 0 | 0 |
| **e … e+26 (am oder nach dem Ex-Tag, innerhalb der Haltedauer)** | **32** | **17** |
| e+27 … e+261 (Sprung im Lesefenster) | 3 | 0 |

Die 32 Signale liegen in 10 Reihen (ARNC 4, CNX 3, DB 3, DLPH 4, EQT 2, NVS 2, SRC 2, TGNA 4, TRN 6, WRK 2), die 17 V2-Signale
in 5 (ARNC, DB, EQT, TRN, WRK). Gegen rund 8.300 V2-Signale sind das 0,2 % — klein, aber es sind Kunstsignale an großen, liquiden
Werten. **Vorschlag:** Sperrliste Symbol × Ex-Tag aus `splitAbgelehntListe` (alle 47), gesperrt für Signale **und** Topf im Fenster
e−26 … e+261 Stundenkerzen. So ist es in `zaehlen.js` schon gebaut; die Kopien bleiben, wie sie sind.

## 5. Auflösung vor dem Urteil

**Placebo** (Zufallseinstiege an den 224 V2-Signaltagen der Stichprobe, gleiche Klasse, gleiche Haltedauer, so viele wie Signale;
200 Ziehungen, Mediane; 9.831 Topf-Einträge):

| Größe | sd je Signaltag | se naiv | se Hansen-Hodrick (Lag 3) | se 5-Tage-Blöcke | es gilt | Aufblähung | Mittel |
|---|---:|---:|---:|---:|---:|---:|---:|
| roh (ohne Kontrolle) | 5,05 Pp | 0,338 | 0,392 | 0,346 | 0,392 | 1,351 | +0,155 |
| tagesbereinigt (gegen den Rest des Tagestopfs) | 4,25 Pp | 0,285 | 0,286 | 0,302 | 0,302 | 1,120 | −0,015 |

Zerlegung: der gemeinsame Teil (Tagesmittel des ganzen Topfs an den Signaltagen) streut mit 3,15 Pp und trägt fast die ganze
Überlappung (Aufblähung 1,92); der eigene Teil streut mit 5,45 Pp je Einstieg. **Zwei Vorbehalte:** (a) die Stichprobe mittelt je Tag
über 2 Signale, das Universum über 13 … 15 — bei Zufallseinstiegen fiele der eigene Teil dort auf 1,53 Pp je Tag; (b) echte
Kapitulations-Signale sind unruhiger als Zufallseinstiege und laufen gemeinsam. Das alte Protokoll zeigt es: 5,12 Pp je Signaltag
(Bestätigung) und 6,13 (gesamt) bei 15,7 Signalen je Tag — mit einer Kontrolle ohne Tagesbereinigung.

**MDE₈₀** (z = 2,8016; se = sd × √Aufblähung / √N) und nötige Signaltage:

| Streuungs-Anker | MDE₈₀ bei 403 | bei 493 | bei 683 | nötig für +1,107 | nötig für +0,68 | nötig für 0,157 (Hürde) | Tor 1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Placebo roh | 0,82 Pp | 0,74 | 0,63 | 221 | 590 | 10.992 | 1.801 |
| Placebo tagesbereinigt | 0,63 | 0,57 | 0,48 | 130 | 346 | 6.459 | 1.058 |
| gemeinsamer Teil allein | 0,61 | 0,55 | 0,47 | 122 | 326 | 6.077 | 995 |
| altes Protokoll, Bestätigung (echte Signale) | 0,83 | 0,75 | 0,64 | 227 | 605 | 11.278 | 1.847 |
| altes Protokoll, gesamt | 0,99 | 0,90 | 0,76 | 325 | 868 | 16.186 | 2.651 |

(Spalten 403 / 493 / 683 = unberührtes Fenster nach Modell / geeicht / Obergrenze. Tor 1 = Entdeckung ≥ 4 × Bestätigungs-MDE der
Maschine ⇒ se ≤ 0,138 Pp.)

**Urteil der Machbarkeit: am Rand.**

- **Behaupteter Effekt +1,107 Pp:** nötig **122 … 325** Signaltage, vorhanden im unberührten Fenster **403 … 493** (sicher 154 … 683).
  Das ist **entscheidbar** — die Messung fände einen Effekt dieser Größe mit über 80 % Macht.
- **Nach Abzug der Verzerrung (+0,68 Pp):** nötig **326 … 868**, vorhanden 403 … 493 unberührt, 559 … 656 mit dem alten Fenster.
  **Am Rand**; am unteren Band (+0,36) nicht entscheidbar.
- **Effekt in Hürdengröße (0,045 … 0,157 Pp):** nötig 6.077 … 197.647 Signaltage bei höchstens 909. **Nicht entscheidbar** — die
  Messung kann die Behauptung stützen oder in ihrer Größe zurückweisen (MDE₈₀ 0,5 … 1,0 Pp), aber kein Nein unter der Hürde liefern.
- **Tor 1** verlangt 995 … 2.651 Signaltage und ist mit keinem der Anker erreichbar, solange die Streuung der echten Signale nicht
  deutlich unter dem Stichproben-Placebo liegt. Ob sie das tut, lässt sich ohne Blick auf das Mittel prüfen (se vor dem Urteil,
  `VORREGISTRIERUNG.md` §6).
- **Offen aus der Stichprobe:** die Zahl der Signaltage selbst (403 Modell, 493 geeicht). Die Vollzählung (2 Stunden, blind) macht
  aus dem Band eine Zahl und gehört an den Anfang von Phase 2.
