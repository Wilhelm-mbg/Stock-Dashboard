# Nachtrag zur Vorregistrierung `glockendruck-nacht`

**26.08.2026, 08:48, Strategie-Tüftler.**
Die Vorregistrierung selbst ist **unverändert** — sie wird nicht nachträglich
umgeschrieben. Dieser Nachtrag steht daneben und ist vor jeder Messung geschrieben.

---

## Der Befund: der Schlussdruck teilt einen Kurs mit der Zielgröße

Zielgröße (Zweig N): `Eröffnung(i+1) / Schluss(i) − 1`.
Bedingung: `S = (Schluss(i) − Tief(i)) / (Hoch(i) − Tief(i))`, unterstes Quintil.

**`Schluss(i)` steht in beiden — mit entgegengesetztem Vorzeichen.** Ein Schluss, dessen
letzter Druck auf dem Geldkurs steht, senkt `S` **und** hebt die gemessene
Übernachtrendite. Das ist die klassische Spannen-Umkehr (bid-ask bounce), und sie erzeugt
einen Scheineffekt in **exakt der Richtung, die diese Vorregistrierung behauptet.**

Das steht in keinem der sieben Gatter. Gatter 3 (C8-Vorgriff) betrifft den *Zeitpunkt* der
Kenntnis von `S`, nicht den *geteilten Kurs*. Es sind zwei verschiedene Fehler.

## Die Zählung

`studien/tueftler/werkzeug/zaehle-spannenrueckprall.js`, 400 Symbole, 9.499 Handelstage
(26.08.1986 – 20.08.2026), unterstes `S`-Quintil, Rohausgabe
`studien/tueftler/daten/zaehlung-spannenrueckprall-2026-08-26.json`.
Reine Abzählung — keine Rendite wurde darin gemittelt.

| Größe | Wert |
|---|---|
| Schluss **exakt** auf dem Tagestief | **6,4 %** der ausgewählten Symbol-Tage |
| `S` < 0,05 | **23,1 %** |
| `S`-Median der Auswahl | 0,124 |
| Tagesspanne der Auswahl, Median | 2,52 Pp (Gesamtkorb 2,30 Pp) |
| halbe notierte Spanne, Größenordnung | ~0,02 Pp (Kostentabelle Aktie 0,04 je Umlauf) |

Die Auswahlregel ist ihrer Natur nach zum Geldkurs geneigt — sie sucht Tage, an denen der
letzte Handel ein Verkauf war. Die Neigung ist also systematisch, nicht zufällig verteilt.

## Was daraus folgt — und was nicht

**Die JA-Seite hält.** Die JA-Schwelle steht auf 0,10 Pp. Ein Rückprall-Beitrag in der
Größenordnung 0,02 Pp ist höchstens ein Fünftel davon; ein JA über 0,10 Pp wäre durch
den Rückprall allein nicht erklärbar. Es bleibt bei Gatter 3: ein JA ist wegen des
C8-Vorgriffs ohnehin **vorläufig** und verlangt die ausführbare Fassung als Nachlauf.

**Die NEIN-Seite hält nicht.** Sie lautet: obere Grenze < **0,04 Pp** ⇒ das
Sitzungsgrenzen-Fenster ist über 40 Jahre unterhalb der Aktienhürde geschlossen. Das wäre
die schärfste obere Schranke der Projektgeschichte. Aber:

    delta80 (2 Tests) = 0,0397 Pp
    Aktienhürde       = 0,0400 Pp
    Marge             = 0,0005 Pp

Ein Rückprall-Beitrag von wenigen **Tausendstel** Pp beherrscht diese Marge um ein
Vielfaches. Die NEIN-Aussage ist damit **nicht rückprall-fest**, solange sie am
Schlussdruck hängt.

## Empfehlung an die Mess-Kette (kein Auftrag, keine Änderung der Regeln)

1. **Die NEIN-Aussage nur mit Vorbehalt melden**, oder sie auf die CFD-Hürde (0,10 Pp)
   stellen, wo reichlich Luft ist. Ein „unterhalb 0,10 Pp geschlossen" ist rückprall-fest
   und immer noch eine sehr starke Aussage.
2. **Nicht die Vorregistrierung ändern.** Die Schwellen bleiben, wie sie am 26.08.
   festgelegt wurden; dieser Nachtrag sagt nur, wie das Ergebnis zu lesen ist.
3. **Wer den Rückprall wirklich messen will**, hat einen sauberen Weg: dieselbe Studie mit
   Einstieg zu `Eröffnung(i+1)` statt zu `Schluss(i)` (Zweig T ist bereits so gebaut). Der
   geteilte Kurs verschwindet dabei; die Differenz zwischen den Zweigen enthält den
   Rückprall. Das ist **kein zusätzlicher Test**, sondern eine Lesart der schon
   vorregistrierten zwei.

## Der Entwurf, der daraus entstanden ist

`studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/` — gleiches Fenster, gleiche
Auflösung (`delta80` 0,0396 gegen 0,0397 Pp), aber **disjunkte Kurse** in Signal und
Zielgröße und **kein C8-Vorgriff**. Die Auswahlen der beiden Studien überschneiden sich
nur zufällig (0,190 gegen eine Zufallserwartung von 0,198), es sind also zwei Schüsse und
nicht einer. Zur Testzahl der Familie siehe dort, Abschnitt 8.
