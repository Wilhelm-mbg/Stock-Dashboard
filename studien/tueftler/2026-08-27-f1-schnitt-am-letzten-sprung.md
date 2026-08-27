# F1: „Schnitt am letzten Sprung" — die Zähl-Hälfte

**Auftrag** des PM (`markt-dashboard-f5`), 27.08. vormittags: *wie viele Reihen F1 verwirft,
wo die Sprünge sitzen, wie viel brauchbare Historie ein Schnitt zurückholt.* Datenbestand,
keine Ertragsrechnung. **Die Entscheidung, ob der Schnitt zulässig ist, gehört der
Messseite — nicht mir.**

---

## ⚠ ZUERST, VOR DEM LAUF: die Frage, die ich NICHT beantworte

*Auf Auflage des PM hier notiert, bevor eine einzige Zahl entsteht — damit sie nicht
nachträglich zur Fußnote eines Ergebnisses wird.*

> **Ein Schnitt am letzten Sprung wählt den behaltenen Zeitraum nach einer
> Kurseigenschaft aus. Ist das ein zulässiges Auswahlkriterium?**

Die Frage ist ernst, weil in diesem Projekt **zweimal** ein Scheineffekt genau so entstanden
ist — ein Kriterium, das die Zielgröße mitliest (Spannen-Rückprall bei `glockendruck-nacht`;
Klasse-R-Ausschluss im QS-Werkzeug, 67,5 statt 57,7 %). Konkret sind mindestens **vier**
Bedenken zu klären, und keines davon kann ich klären:

1. **Der Schnittpunkt ist selbst ein Kursereignis.** Behalten wird, was *nach* einem
   extremen Kurssprung liegt. Wenn Sprünge sich häufen (Übernahme, Reverse-Split,
   Bilanzschock), ist der behaltene Abschnitt systematisch ein Zeitraum *nach* einem
   Umbruch — und nicht mehr eine Zufallsstichprobe aus der Lebensdauer des Papiers.
2. **Die Schnittlänge variiert je Reihe.** Eine Reihe, die spät springt, behält wenig; eine,
   die früh springt, behält viel. Damit wiegt der Querschnitt Papiere unterschiedlich stark
   nach dem Zeitpunkt ihres Sprungs — **wieder eine Kurseigenschaft.**
3. **Rückwärtsschau.** Wer heute am letzten Sprung schneidet, benutzt Wissen, das am
   behaltenen Anfang niemand hatte. Für eine Handelsregel ist das ein Vorgriff; für eine
   reine Datenbereinigung möglicherweise nicht. **Welcher der beiden Fälle hier vorliegt,
   ist eine Messfrage.**
4. **Der Sprung kann echt sein.** Nicht jeder Sprung ist ein Datenfehler — Reverse-Splits
   und Übernahmen sind reale Ereignisse. Ein Schnitt entfernt dann **Kursgeschichte, keinen
   Fehler.** Umgekehrt bleibt ein Datenfehler unbehoben, wenn er *nach* dem Schnittpunkt
   liegt.

**Mein Beitrag hört bei den Zahlen auf.** Was unten steht, sagt, **wie viel** ein Schnitt
zurückholte — nicht, **ob** man ihn machen darf.

---

## Was schon gezählt ist — ich wiederhole es nicht

Eine andere Sitzung hat um ~01:50 auf PM-Auftrag bereits gezählt
(`studien/datenfund-dochte-2026-08-27/f1-raender.js`, Ergebnis in `f1-ergebnis.txt`):

- **58 von 2.965 Reihen** verwirft F1 in `archiv1d` *(der PM hatte 36 genannt; die
  Abweichung ist dort als eigener Fund vermerkt)*
- davon **genau ein Sprung: 25 · mehrere Sprünge: 7 · gar kein Sprung, nur Kurs > 100.000 $: 23**
- **Rand-Bereinigung** (erste/letzte 5 Kerzen) rettet **genau eine** Reihe (SEZL)

**Damit sind zwei meiner drei Teilfragen beantwortet, und ich übernehme sie als gegeben.**
Offen bleibt die dritte — und sie ist eine *andere* Operation als die Rand-Bereinigung:
nicht die Ränder kappen, sondern **am letzten Sprung schneiden und den Rest behalten.**

**Eine Beobachtung schon aus deren Liste, ohne eigene Rechnung:** Die **23 Reihen ohne
Sprung** kann ein Schnitt am Sprung **grundsätzlich nicht retten** — es gibt keinen Sprung,
an dem zu schneiden wäre. Sie scheitern an der Preisschwelle, und die ist eine
*Niveau*-Eigenschaft, die ein Schnitt nicht beseitigt. **Die Rettungsfrage betrifft also
höchstens 35 der 58 Reihen.** Dazu kommt, dass die 23 fast durchweg gehebelte und inverse
ETFs sind (SQQQ, TZA, UVXY, SPXU …) — ob sie überhaupt ins Universum gehören, entscheidet
schon der Wertpapierart-Filter, nicht F1. **Das prüfe ich unten mit.**

---

## Ergebnis 1 — die Rettungsfrage betrifft 32 Reihen, nicht 58

Reproduziert (`werkzeug/zaehle-f1-schnitt.js`, 2.965 Reihen): **58 verworfen —
deckungsgleich mit der Vorarbeit von 01:50.** Danach schrumpft die Menge zweimal:

| Schritt | bleibt | fällt weg | warum |
|---|---|---|---|
| von F1 verworfen | **58** | — | Sprung > +400 % / < −80 % oder Kurs > 100.000 $ |
| nach Wertpapierart (CS/ADRC) | **36** | 22 | **ETFs — die wirft schon der Art-Filter, nicht erst F1.** Für sie ist die Rettungsfrage gegenstandslos |
| mit mindestens einem Sprung | **32** | 4 | ohne Sprung gibt es nichts zu schneiden — die Preisschwelle ist eine *Niveau*-Eigenschaft |

**Die 23 Reihen ohne Sprung sind fast alle gehebelte oder inverse ETFs** (SQQQ, TZA,
UVXY, SPXU, FAZ …) plus BRK.A, das echt über 100.000 $ notiert. **Ein Schnitt kann keine
davon retten.**

## Ergebnis 2 — der beauftragte Schnitt ist nicht der beste, und beide sind nicht der Punkt

Für die 32 Aktien mit Sprung, gerechnet in Tageskerzen (»brauchbar« = mindestens 250
Kerzen **und** Preisschwelle nicht mehr gerissen):

| Schnitt | Reihen brauchbar | Kerzen zurückgeholt | von 177.995 |
|---|---|---|---|
| **Schwanz** — alles nach dem letzten Sprung *(das wörtlich Beauftragte)* | **28 von 32** | **112.739** | 63,3 % |
| Kopf — alles vor dem ersten Sprung | 25 von 32 | 63.495 | 35,7 % |
| **Längster sprungfreier Abschnitt** | **31 von 32** | **137.909** | **77,5 %** |

Der längste Abschnitt holt **25.170 Kerzen mehr** als der Schwanz und drei Reihen mehr —
**ohne zusätzliche Annahme, es ist dieselbe Operation mit besserer Wahl des Stücks.**
*Aber Vorsicht: er verschärft Bedenken 1 und 2 von oben, weil er das behaltene Stück nach
**allen** Sprüngen aussucht statt nur nach dem letzten. Er ist zählerisch überlegen und
methodisch nicht harmloser.*

**Warum der Schwanz so schlecht abschneidet, zeigen zwei Reihen:**

- **ELME**: ein einziger Sprung, und der liegt bei Kerze **9.919 von 10.078** (08.01.2026,
  −84 %). Der Schwanz behält **159** Kerzen, der Kopf **9.919**. *Vierzig Jahre werden
  weggeworfen, um acht Monate zu behalten.*
- **BYND**: Schwanz **12** Kerzen von 1.840.

**Und eine Reihe zeigt die Grenze jedes Schnitts:** bei **WHLR** reißt auch der beste
Abschnitt die Preisschwelle weiter. *Ein Schnitt beseitigt keine Niveau-Verletzung.*

## Ergebnis 3 — der eigentliche Fund: der Schnitt behandelt meist gar kein Regime, sondern einen Fehler mit Ort

Von den 8 Reihen mit **mehreren** Sprüngen zeigen **5** Sprungpaare, die sich fast genau
aufheben und **1 bis 6 Kerzen** auseinanderliegen:

    BLNK  2010-04-05 ×0,09  ->  2010-04-09 ×10,00   Produkt 0,938
    ASTH  2013-11-07 ×18,54 ->  2013-11-08 ×0,05    Produkt 1,000
    BYRN  2016-04-01 ×0,19  ->  2016-04-04 ×5,40    Produkt 1,000
    INDV  2022-11-23 ×0,16  ->  2022-11-28 ×6,72    Produkt 1,071
    BYND  2026-07-20 ×30,20 ->  2026-07-23 ×0,03    Produkt 0,944   (und fünf weitere Paare)

**Ein Kurs, der um Faktor 30 springt und drei Tage später um Faktor 1/30 zurück, hat keine
Marktbewegung gemacht — er stand auf der falschen Skala.** Bei **BYND** deckt sich das mit
einem unabhängigen Fund derselben Nacht: *„vier Reihen mit inkonsistenter Kursanpassung
zwischen 60m und 1d, BYND Faktor exakt 30."* **Dieselbe Zahl, aus einer anderen Richtung.**

**Damit hat die Störung einen Ort — und der Schnitt nutzt diese Information nicht:**

| Reihe | gestörte Zone (erster bis letzter Sprung) | Schnitt am letzten Sprung wirft weg |
|---|---|---|
| **BYRN** | **2 Kerzen** (0,04 %) | **2.405** (47,9 %) |
| **INDV** | **3 Kerzen** (0,10 %) | **1.993** (68,0 %) |
| BLNK | 5 (0,12 %) | 74 (1,8 %) |
| **BYND** | **17 Kerzen** (0,92 %) | **1.828** (99,3 %) |
| IVT | 35 (1,11 %) | 1.908 (60,7 %) |
| ARWR | 82 (1,00 %) | 2.206 (26,8 %) |
| HOLO | 102 (8,04 %) | 629 (49,6 %) |
| ASTH | 1.523 (34,67 %) | 1.544 (35,1 %) |

**In sieben von acht Fällen ist die gestörte Zone kleiner als 8 % der Reihe, meist unter
1 % — und der Schnitt wirft bis zu 99,3 % weg.** Bei BYRN steht eine Störung von zwei
Kerzen gegen 2.405 verworfene: **Faktor 1.200.** Nur bei ASTH sind Störzone und Schnitt
vergleichbar groß; dort liegen die Sprünge wirklich über Jahre verteilt.

> **Der Befund ist also nicht „der Schnitt holt X zurück", sondern: die Reihen, um die es
> geht, sind überwiegend nicht regimegebrochen, sondern an wenigen Kerzen falsch skaliert.**
> Ob daraus „reparieren statt schneiden" folgt, ist eine Messentscheidung — **aber sie
> sollte mit dieser Zahl getroffen werden und nicht ohne sie.**

## Was ich ausdrücklich NICHT gezählt habe

- **Ob die Sprünge echt sind.** Das Aufheb-Muster ist eine **Signatur**, kein Beweis. Bei
  BYND stützt ein unabhängiger Fund dieselbe Deutung; bei den anderen vier ist es eine
  starke Anzeige und mehr nicht.
- **Ob ein Schnitt oder eine Reparatur zulässig ist.** Siehe die vier Bedenken oben —
  unverändert offen, und nicht meine Entscheidung.
- **`archiv60m`.** Gezählt wurde nur `archiv1d`. Die Reihenmenge dort kann anders sein.

**Ablage:** `studien/tueftler/daten/zaehlung-f1-schnitt-2026-08-27.json` (alle 58 Reihen
einzeln, mit Datumsgrenzen je Abschnitt).
