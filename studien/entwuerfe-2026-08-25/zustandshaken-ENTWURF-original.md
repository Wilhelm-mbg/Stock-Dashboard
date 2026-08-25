# Der Zustandshaken — Architektur-Entwurf

**Datum:** 25.08.2026
**Art:** Architektur-Entwurf. **Keine Vorregistrierung.** Es wird hier nichts als belegt behauptet.
**Gegenstand:** Wie die Messmaschine einen Zustand über die ganze Messung tragen könnte — und
ob der Edge-Wächter damit messbar wird.

**Ergebnis in einem Satz:**
Der Haken ist billig zu bauen (+1,8 % Laufzeit, gemessen) und der Vorgriff strukturell
verhinderbar. Aber die Frage, die ihn motiviert hat — *was kostet der Edge-Wächter* —
ist auf diesem Archiv **nicht entscheidbar**: der Wächter hat in 730 Handelstagen genau
**eine abgeschlossene Pausen-Episode** erzeugt, und der Endpunkt ist um **Faktor 2,7**
zu grob für die Produkthürde. Der Wächter gehört **deklariert**, nicht gemessen.

---

## 1. Frage

Zwei Fragen, die auseinandergehalten werden müssen:

**F1 (Architektur):** Wie sieht ein Haken aus, mit dem eine Strategie einen Zustand über
die ganze Messung tragen kann — also `erlaubnis(sym, i, zustand) -> bool`, wobei `zustand`
aus den **bisherigen Ergebnissen der Strategie selbst** gebildet wird? Wie wird Vorgriff
erzwungen statt zugesagt? Was kostet die dafür nötige Umstellung auf zeitliche
Reihenfolge?

**F2 (Machbarkeit):** Wenn es den Haken gäbe — wäre die Frage *„was kostet der
Edge-Wächter?"* damit beantwortbar?

F1 hat eine gute Antwort. F2 hat eine schlechte, und F2 entscheidet, ob F1 sich lohnt.

---

## 2. Was der Edge-Wächter wirklich ist (gelesen, nicht angenommen)

Quelle: `depot.js`, Funktion `edgeZustand(entry)` und der Block dahinter in `pilotMessen`.

- Er läuft **einmal je Nacht**, je Arm (`EDGE_ARME`: `rsi2seit` mit H=8, `kapitulation`
  mit H=26).
- Er rechnet die Signale des Arms über ein **rollendes 120-Tage-Fenster** auf dem
  60m-Archiv nach, zieht je Symbol die Drift desselben Fensters ab (A9), mittelt je
  Symbol und bildet **t über Symbole** (nicht über Tage). Mindestens 2 Signale je Symbol,
  mindestens 5 Symbole.
- `VERFALL_T = -1`. Verfall heißt: `rohT <= -1` **und** `nSym >= 5`.
- Pausiert wird erst, wenn **zwei aufeinanderfolgende Nächte** Verfall melden **und**
  der Signalzähler zwischen beiden gewachsen ist (`echteZweiteMessung`).
- Die Pause blockiert **neue Einstiege dieses Arms** (`depot.js`, `armPause`-Prüfung im
  Einstiegspfad); ein Hand-Entscheid `edgePauseHand` hebt sie dauerhaft auf.
- Aufgehoben wird automatisch, sobald `!verfall && rohMittel > 0`.
- Der Wächter läuft auf `messUniversum()` — Basis (15 Werte) + aktiver 60m-Pool.
  Mit `pool: volatil` sind das **39 Werte**. Die Messmaschine misst auf **2.871**.

Damit ist er ein **Zustandsautomat über Kalendertage**, dessen Übergänge von den
**eigenen vergangenen Ergebnissen** der Strategie abhängen. Genau das kann
`signal(bars, i, params, rang, sym)` nicht ausdrücken: die Funktion sieht die Kerzen
*eines* Werts plus einen Querschnittsrang, sonst nichts.

---

## 3. Datenbasis, mit gezählten Fallzahlen

Alle Zahlen unten sind **gerechnet**, nicht geschätzt. Das Messgeschirr liegt neben
diesem Entwurf unter `studien/entwuerfe-2026-08-25/zustandshaken-messgeschirr/`:

| Skript | was es rechnet |
|---|---|
| `waechter-sim.js` | spielt `edgeZustand()` Nacht für Nacht auf dem Archiv nach → `waechter-sim.json` |
| `ordnung-kosten.js` | symbolweise gegen zeitweise Schleife, gleiche Arbeit, gemessene Sekunden |
| `aufloesung.js` | Endpunkt auf dem Live-Universum, mit und ohne Abklingzeit |
| `a7-breite.js` | was das breitere A7-Lesefenster kostet |
| `gross.js` | derselbe Endpunkt auf allen 2.871 Reihen |
| `reihen-dump.js` | legt die Tagesreihen des Überschusses ab (`reihen.json`, ~1 MB, nicht mitkopiert) |
| `gatter.js` | ECHT / ZUKUNFT / PLACEBO-GATTER auf der fertigen Tagesreihe |

Aufrufe: `node waechter-sim.js waechter-sim.json`, dann
`node --max-old-space-size=12288 reihen-dump.js waechter-sim.json reihen.json`, dann
`node gatter.js reihen.json waechter-sim.json`.

### 3.1 Archiv

| Größe | Zahl |
|---|---|
| `E:/Markt-Dashboard-Archiv/archiv60m` | 2.885 Dateien, 1,3 GB |
| davon nach Aktien-Filter und `reiheKaputt`-Prüfung geladen | **2.871 Reihen** |
| Kerzen gesamt (alle 2.883 Reihen, vor Filter) | 14.605.746 |
| Handelstage | **730** (2023-09-26 … 2026-08-24) |
| Schnitt der Maschine (halbe Handelstage) | **2025-03-12** |
| mittlere Kerzenzahl je Wert und Handelstag | **6,97** |

Live-Universum des Wächters (Basis 15 + Pool `volatil` 33, ohne Doppelte):
**39 Werte**, alle 39 im Archiv vorhanden.

### 3.2 rsi2seit als Bezugsgröße (aus dem Protokoll vom 25.08.)

`studien/messmaschine/protokolle/rsi2seit-2026-08-25.json`:
2.874 Werte, 104.905 Signale, Bestätigung 364 Tage / 56.120 Signale,
Überschuss +0,0544 Pp, se 0,0652 Pp, MDE 0,1304 Pp, t 0,83 → *nicht-entscheidbar*.
Laufzeit 205,7 s.

Meine Nachrechnung mit derselben `_intern.baueKontrolle` (2.871 Reihen, Lesefenster 261,
kein Ausstieg): 104.883 Signale, Bestätigung 56.117, **+0,0529 Pp, se 0,0651, t 0,81**.
Die Abweichung zum Protokoll liegt bei 0,0015 Pp und kommt aus 3 Reihen Unterschied im
Filter. Das Messgeschirr ist damit gegen die Maschine geeicht.

### 3.3 Der Wächter, Nacht für Nacht nachgespielt (die entscheidende Zählung)

`waechter-sim.js` spielt die Regeln aus `depot.js` **wörtlich** nach — 120-Tage-Fenster,
Drift im selben Fenster, 120-Minuten-Abklingzeit, `VERFALL_T = -1`, zwei Nächte,
Signalzuwachs > 0, automatische Aufhebung. Über alle 730 Handelstage:

| | Zahl |
|---|---|
| Signale im Live-Universum (mit Abklingzeit) | **1.120** |
| Nächte mit auswertbarer Messung (`nSym >= 5`) | 655 von 730 |
| Signale im 120-Tage-Fenster | Median **124**, Spanne 0 … 217 |
| Nächte mit Verfall-Meldung | 35 (4,8 %) |
| **Zustandswechsel gesamt** | **3** |
| Handelstage mit aktiver Pause | **34** von 730 (4,7 %) |
| davon in der **Entdeckungshälfte** | **0** |
| davon in der **Bestätigungshälfte** | 34 (9,3 %) |

Die Pausen-Episoden:

| Episode | von | bis | Handelstage | Status |
|---|---|---|---|---|
| 1 | 2025-09-11 | 2025-10-10 | 22 | abgeschlossen |
| 2 | 2026-08-07 | 2026-08-24 | 12 | **offen** (läuft am Archivende noch) |

**Das ist die ganze Fallzahl: eine abgeschlossene Episode.**

Die t-Werte des Wächters über 655 Nächte: min −3,51 | 10 % −0,39 | Median +0,71 |
90 % +2,09 | max +3,14. Die Schwelle −1 wird selten und nur in zwei zusammenhängenden
Strecken unterschritten.

### 3.4 Signale auf Pausentagen

| Universum | Bestätigungstage mit Signal | davon Pausentage | Signale auf Pausentagen |
|---|---|---|---|
| Live (39 Werte) | 215 | **17** in **2** Episoden [11, 6] | 36 (mit Abklingzeit) / 41 (ohne) |
| Ganzes Archiv (2.871) | 364 | **33** in **2** Episoden [22, 11] | 4.274 |

---

## 4. Vorab-Einteilungen

Diese Einteilungen müssten **vor** jeder Messung feststehen. Ich schreibe sie hier hin,
damit sichtbar ist, dass sie den Fall nicht retten.

1. **Hälften:** wie die Maschine — Entdeckung vor `2025-03-12`, Bestätigung danach.
   *Befund: die Entdeckungshälfte enthält null Pausentage. Es gibt für diese Frage
   keine Entdeckungshälfte.*
2. **Arme:** `rsi2seit` (H=8) und `kapitulation` (H=26), getrennt. Sie haben eigene
   Pausen und eigene Haltedauern; eine gemeinsame Auswertung wäre eine dritte Größe.
3. **Universum:** ausschließlich `messUniversum()` — das, was der Wächter live gatet.
   Jede andere Wahl misst ein System, das nirgends läuft (siehe Z4 unten).
4. **Zustandstaktung:** eine Zustandsänderung je Kalendertag, nach Handelsschluss.
   Live läuft der Wächter nachts; eine Messung, die je Kerze neu entscheidet, misst
   etwas anderes.
5. **Informative Einheit:** die **Pausen-Episode**, nicht der Handelstag. Innerhalb
   einer Episode fällt keine neue Entscheidung.

---

## 5. Endpunkte

**Hauptendpunkt (E1):** die **gepaarte Tagesdifferenz**
`d_t = Tagesmittel(gated) − Tagesmittel(ungated)`.
An Nicht-Pausentagen ist `d_t` exakt null; an Pausentagen ist es `−x_t`.
Positiv heißt: der Wächter hat genützt.

Warum gepaart und nicht zwei getrennte Läufe: die beiden Varianten teilen 95 % ihrer
Signale. Zwei getrennte Standardfehler von je ~0,29 Pp gegeneinanderzustellen (Live) und
den Unterschied von 0,11 Pp zu beurteilen, wäre Rauschen gegen Rauschen. Gepaart fällt
alles Gemeinsame heraus und der Standardfehler sinkt von 0,29 auf 0,10 Pp — **Faktor 2,9,
gemessen.**

**Nebenendpunkt (E2, reine Anzeige):** der Überschuss **auf** den Pausentagen. Er sagt,
ob der Wächter überhaupt in schlechte Strecken hineingegriffen hat.

**Kontrollen (Pflicht, kein Endpunkt):**
- **ZUKUNFT** (positive Kontrolle): ein Gatter mit Vorgriff, das genau die Tage mit
  negativem Überschuss pausiert. Es *muss* stark positiv herauskommen; tut es das nicht,
  ist die Verkabelung kaputt.
- **PLACEBO-GATTER** (Nullpunkt): dieselben Episodenlängen, an jede andere mögliche
  Stelle der Bestätigungshälfte geschoben. Wahre Antwort: null. Die Streuung dieser
  Verschiebungen ist der **empirische Standardfehler** des Endpunkts.

---

## 6. Erwartete MDE und delta80 — mit Rechnung

### 6.1 Auf dem Live-Universum (39 Werte — was der Wächter wirklich gatet)

Bestätigungshälfte, 215 Tage mit Signal, Newey-West mit H−1 = 7 Verzögerungen:

```
UNGATED            n 215 | Mittel  +0,0793 Pp | se 0,2880 | MDE 0,5759 | d80 0,8068 | t  0,28
ECHT (Wächter)     n 215 | Mittel  −0,1064 Pp | se 0,1010 | MDE 0,2020 | d80 0,2830 | t −1,05
                                           17 Tage in 2 Episoden [11, 6]
NUR Pausentage     n  17 | Mittel  +1,2878 Pp | se 0,9146 |                          t  1,41
```

`delta80` nach dem Verfahren der Maschine: `(z_Bonferroni + z_0,84) · se`.
Bei 1 Test: `(1,960 + 0,842) · 0,1010 = 0,2830 Pp`.
Bei der Testfamilie aus Abschnitt 8 (4 Tests, Schwelle 2,498):
`(2,498 + 0,842) · 0,1010 = 0,337 Pp`.

### 6.2 Der Standardfehler der Maschine ist für diesen Endpunkt falsch

Das PLACEBO-GATTER (214 Verschiebungen, gleiche Episodenlängen) liefert die
Nullverteilung des Endpunkts:

```
LIVE:   5 % −0,1401 | Median −0,0073 | 95 % +0,1363 | min −0,2110 | max +0,1830
        empirischer se: 0,0803 Pp        (Modell-se: 0,1010 Pp)
        der echte Wert −0,1064 Pp wird von 45 von 214 Verschiebungen erreicht → p = 0,21

ARCHIV: 5 % −0,0378 | Median −0,0045 | 95 % +0,0291 | min −0,0513 | max +0,0644
        empirischer se: 0,0198 Pp        (Modell-se: 0,0106 Pp)  ← Faktor 1,87 ZU KLEIN
        der echte Wert +0,0115 Pp wird von 199 von 363 Verschiebungen erreicht → p = 0,55
```

Der Median der Nullverteilung liegt in beiden Fällen praktisch bei null — der Nullpunkt
stimmt. Aber die **Streuung** stimmt nicht: auf dem ganzen Archiv unterschätzt die
Newey-West-Rechnung der Maschine den Standardfehler um **Faktor 1,87**.

Der Grund ist B10 in einer Form, die die bestehende Korrektur nicht fängt: die
Newey-West-Korrektur läuft über H−1 = 7 Verzögerungen, weil sich die *Haltedauern*
um 7 Kerzen überlappen. Die Pausen-Episoden sind aber 22 und 11 Tage lang. Die
Korrelationslänge des Endpunkts ist die **Episode**, nicht die Haltedauer.

### 6.3 Die ehrliche Auflösung

| | Live (39) | Archiv (2.871) |
|---|---|---|
| Modell-se (Maschine) | 0,1010 Pp | 0,0106 Pp |
| **empirischer se (Permutation)** | **0,0803 Pp** | **0,0198 Pp** |
| delta80 bei 1 Test | 0,225 Pp | 0,0554 Pp |
| **delta80 bei 4 Tests (Schwelle 2,498)** | **0,268 Pp** | 0,0661 Pp |
| Produkthürde (Basiswert, 0,10 %/Umlauf) | 0,10 Pp | 0,10 Pp |
| **Verhältnis delta80 / Hürde** | **2,7** | 0,66 |

**Auf dem Universum, das der Wächter wirklich gatet, ist der Lauf um Faktor 2,7 zu grob
für eine Kante in Größe der Kostenhürde.** Vorab-Tor **S5 ist verletzt.**

Das Archiv-Universum sieht besser aus — aber es ist das falsche Universum (Z4).

### 6.4 Wie viel Daten es bräuchte

Der Standardfehler skaliert mit `1/√E`, wobei `E` die Zahl **unabhängiger Pausen-Episoden**
ist. Beobachtet: 2 Episoden in 730 Handelstagen = **0,69 Episoden je Jahr**.

*Für delta80 ≤ 0,10 Pp (Live-Universum, 4 Tests):*
```
benötigt:  se ≤ 0,10 / 3,340 = 0,0299 Pp
vorhanden: se   = 0,0803 Pp bei E = 2
Faktor:    0,0803 / 0,0299 = 2,68   →   E ≥ 2 · 2,68² = 14,4  →  15 Episoden
Zeit:      15 / 0,69 = 21,7 Jahre
```

*Für die eigene Mindest-Fallzahl der Maschine (30 Fälle, hier: 30 Episoden):*
```
30 / 0,69 = 43,5 Jahre 60-Minuten-Historie
```

Das Archiv hält **2,9 Jahre**. 60-Minuten-Kerzen bis 1982 gibt es nicht, weder bei Yahoo
noch bei Capital. Die Zahl ist nicht knapp verfehlt, sie ist um **eine Größenordnung**
verfehlt.

### 6.5 Die positive Kontrolle — der Endpunkt funktioniert, der Wächter nicht

```
LIVE   ZUKUNFT (alle 120 schlechten Tage) +1,2797 Pp  t 7,84
       ZUKUNFT (nur die 17 schlechtesten) +0,5000 Pp  t 3,61
ARCHIV ZUKUNFT (alle 166 schlechten Tage) +0,3851 Pp  t 8,38
       ZUKUNFT (nur die 33 schlechtesten) +0,1836 Pp  t 4,15
```

Ein Gatter, das mit **derselben Zahl von Pausentagen** die richtigen trifft, wäre auf dem
Live-Universum +0,50 Pp wert — das ist das 6,2-fache des empirischen Standardfehlers und
wäre klar sichtbar. **Der Endpunkt ist also nicht blind für Gatter an sich. Er ist blind
für dieses Gatter.** Der Wächter liegt mit −0,11 Pp (Live) bzw. +0,01 Pp (Archiv) mitten
in der Nullverteilung.

---

## 7. Entscheidungsregel — VORAB, wörtlich

> **R1 (Abnahme des Hakens).** Der Zustandshaken darf von keiner Strategie benutzt
> werden, bevor alle drei Prüfungen aus Abschnitt 9.4 in `test-messmaschine.js` grün
> sind: (a) der Zeitstempel-Wächter bricht bei jedem Ergebnis ab, dessen Ausstiegskerze
> nicht vor dem Entscheidungszeitpunkt liegt; (b) der Vorgriffs-Kanarienvogel — ein
> Gatter, das absichtlich die Zukunft frisst — liefert ein messbar **anderes** und
> deutlich besseres Ergebnis als dasselbe Gatter ohne Vorgriff; (c) das Nullgatter
> (gleiche Pausenquote, gleiche Episodenlängen, ohne Ergebnisbezug) liefert auf einem
> Kunstarchiv mit wahrem Wert null einen Endpunkt innerhalb seiner eigenen MDE.
> Fällt eine der drei durch, wird der Haken nicht ausgeliefert.

> **R2 (Zulassung einer Gatter-Messung).** Ein Gatter darf über den Haken **gemessen**
> werden, wenn und nur wenn **vor** dem Blick auf die Bestätigungshälfte gilt:
> (i) auf der **Entdeckungshälfte** liegen mindestens **8 abgeschlossene** Zustands-Episoden
> vor **und** der dort geschätzte Effekt ist mindestens **4 ×** so groß wie die
> Bestätigungs-MDE (S4); (ii) auf der Bestätigungshälfte liegen mindestens **15
> abgeschlossene** Episoden vor; (iii) `delta80`, berechnet aus dem **empirischen**
> Standardfehler des Permutations-Nullgatters (nicht aus dem Newey-West-Wert der
> Maschine), liegt **unter** der Produkthürde von 0,10 Pp (S5).
> Ist eine der drei Bedingungen verletzt, wird die Bestätigungshälfte **nicht angefasst**
> und das Gatter als **Aufsatz deklariert**.

> **R3 (Anwendung auf den Edge-Wächter, heute).** Der Edge-Wächter erfüllt R2 nicht:
> (i) Entdeckungshälfte 0 Episoden — verfehlt; (ii) Bestätigungshälfte 1 abgeschlossene
> + 1 offene Episode statt 15 — verfehlt; (iii) delta80 0,268 Pp gegen eine Hürde von
> 0,10 Pp — verfehlt, Faktor 2,7.
> **Damit wird der Edge-Wächter NICHT gemessen, sondern deklariert.** Diese
> Entscheidung wird frühestens neu aufgerollt, wenn 15 abgeschlossene Pausen-Episoden
> vorliegen; bei der beobachteten Rate von 0,69 Episoden je Jahr ist das nicht vor 2048.

> **R4 (Was stattdessen gebaut wird).** Der Haken wird gebaut — aber **nicht als
> Messwerkzeug, sondern als Test-Invariante**: `test-messmaschine.js` bekommt einen Fall,
> der die live gehandelte Regel *einschließlich* Gatter durch die Maschine schickt und
> prüft, dass die Signalmenge mit der live erzeugten übereinstimmt. Weicht sie ab, ist es
> ein **Fehler**, kein Befund. Das ist der fünfte Anlauf gegen dieselbe Fehlerart
> (Live ≠ Messung), und der erste, der sie strukturell prüfbar macht.

---

## 8. Testzahl und Schwelle

Die vorregistrierte Familie für eine *künftige* Gatter-Messung:

| # | Test |
|---|---|
| 1 | rsi2seit, Pausenregel „zwei Nächte, t ≤ −1" |
| 2 | rsi2seit, Pausenregel „eine Nacht, t ≤ −1" (die Fassung vor dem 25.08.) |
| 3 | Kapitulations-Dip, Pausenregel „zwei Nächte, t ≤ −1" |
| 4 | Kapitulations-Dip, Pausenregel „eine Nacht, t ≤ −1" |

**Testzahl 4.** Bonferroni-Schwelle zweiseitig: `|t| ≥ 2,498`.
`delta80 = (2,498 + 0,842) · se = 3,340 · se`.

Die Kontrollen (ZUKUNFT, PLACEBO-GATTER) zählen nicht mit: ihre wahre Antwort steht
vorher fest, sie sind Prüfungen des Geschirrs, keine Fragen an die Welt.

**Was ich für diesen Entwurf gerechnet habe, zählt separat und wird hier deklariert:**
Ich habe den Endpunkt auf 2 Universen × 2 A7-Fensterbreiten ausgewertet, dazu 2 positive
Kontrollen je Universum und je 214 bzw. 363 Permutationen. Das sind **4 Punktschätzer auf
der Bestätigungshälfte, die ich gesehen habe**. Siehe Abschnitt 11.

---

## 9. Die Architektur

### 9.1 Der Haken

Erweiterung des Strategie-Vertrags um ein optionales Feld `zustand`:

```js
zustand: {
  // Wie weit zurück der Zustand Ergebnisse liest. Pflichtfeld — es geht in
  // dasselbe A7-Lesefenster ein wie leseFensterKerzen.
  fensterKerzen: 836,          // 120 Handelstage × 6,97 Kerzen (gemessen)

  // WELCHE Symbole den Zustand speisen. Pflichtfeld, kein Standardwert.
  // Muss dieselbe Menge sein wie das gehandelte Universum, sonst Z4.
  universum: function (sym) { return LIVE.indexOf(sym) !== -1; },

  // Wie oft der Zustand sich ändern darf. 'tag' = einmal je Kalendertag nach
  // Handelsschluss, wie der Wächter live läuft.
  taktung: 'tag',

  anfang:     function ()               { return { ... }; },
  aufnehmen:  function (Z, ergebnis)    { /* faltet EIN abgeschlossenes Ergebnis ein */ },
  erlaubnis:  function (Z, sym, params) { return true; }
}
```

`ergebnis` ist ausschließlich `{ sym, dir, msEin, msAus, r }` — **keine Kerzen, kein
Index, kein Zugriff auf `bars`**. Das ist der halbe Vorgriffsschutz: was man nicht sieht,
kann man nicht vorwegnehmen.

`erlaubnis` bekommt **keinen Zeitindex und keine Kerzen**. Sie sieht `Z`, `sym`, `params`
— sonst nichts. Das ist die andere Hälfte: die Funktion *kann* nicht in die Zukunft
schauen, weil sie nichts hat, worin sie schauen könnte. Wer den Kursverlauf braucht,
schreibt ihn in `signal`, wo er schon heute geprüft ist.

### 9.2 Wie Vorgriff erzwungen wird (nicht zugesagt)

**Die Freigabe-Warteschlange.** Die Maschine hält einen Vorrangsstapel (min-heap) über
`msAus`. Ablauf je Entscheidungszeitpunkt `t`:

1. Alle Ergebnisse mit `msAus < t` aus dem Stapel nehmen und per `aufnehmen(Z, e)`
   einfalten.
2. Erst danach `erlaubnis(Z, sym, params)` aufrufen.
3. Wird ein Signal genommen, wandert sein Ergebnis mit `msAus = bars[i+H][0]` in den
   Stapel — **nicht** in den Zustand.

Der Zustand kann damit **kein** Ergebnis enthalten, dessen Ausstiegskerze nicht schon
geschlossen war. Nicht weil die Strategie es verspricht, sondern weil die Maschine es
nicht herausgibt. Der Strategie-Autor hat keinen Weg daran vorbei: `aufnehmen` wird nur
von der Maschine gerufen.

**Der Zeitstempel-Wächter.** Zusätzlich merkt sich die Maschine `maxAus` = größtes
bisher eingefaltetes `msAus`. Vor jedem `erlaubnis`-Aufruf wird `maxAus < t` geprüft.
Verletzung = Abbruch der Messung mit `verweigert: true`, nicht Warnung. Kosten: ein
Vergleich je Signal. Das fängt Umbauschäden, nicht Absicht — Absicht fängt Punkt 1.

**Gleichstand-Regel (Z3).** An einem Zeitstempel feuern viele Symbole gleichzeitig. Ob
das Ergebnis von `AAPL` schon im Zustand steht, wenn `ZS` beurteilt wird, darf **nicht**
von der alphabetischen Reihenfolge der Dateinamen abhängen — das wäre B9 (Rasterlage) in
neuer Kleidung. Regel: **innerhalb eines Zeitstempels sehen alle `erlaubnis`-Aufrufe
denselben Zustand.** Der Zustand rückt nur *zwischen* Zeitstempeln vor. Bei
`taktung: 'tag'` sogar nur zwischen Kalendertagen — das ist ohnehin, was der Wächter
live tut.

**Kaltstart am Schnitt (Z6).** Der Zustand läuft über den Entdeckungs/Bestätigungs-Schnitt
**hinweg**, weil er das live auch tut. Folge: die ersten ~120 Handelstage der
Bestätigungshälfte tragen einen Zustand, der teilweise auf Entdeckungsdaten gebildet
wurde. Das ist zulässig (der Zustand enthält nur vergangene Ergebnisse), muss aber im
Protokoll stehen. Ein Zustand, der am Schnitt zurückgesetzt wird, misst ein System, das
es nicht gibt.

### 9.3 Was die Umstellung auf zeitliche Reihenfolge kostet — gemessen

Die Signalschleife in `messe()` läuft heute **symbolweise**:
`syms.forEach(sym => { for (i = vorlauf; i < b.length - H; i++) ... })`.
Ein Zustand über die ganze Messung verlangt **zeitweise** Verarbeitung.

Gemessen (`ordnung-kosten.js`, gleiche Aufrufzahl, gleiche Trefferzahl, verifiziert):

| Archiv | Reihen | Aufrufe | A) symbolweise | Zeitachse bauen | B) zeitweise | Faktor |
|---|---|---|---|---|---|---|
| 60m | 2.883 | 13.830.219 | **0,45 s** | 0,46 s | **3,40 s** | 7,6× (mit Achse 8,6×) |
| 1d | 2.965 | 14.706.650 | **0,48 s** | 0,57 s | **5,79 s** | 12,0× (mit Achse 13,1×) |

Der Faktor sieht schlimm aus und ist es nicht. In einem echten Lauf ist die Schleife
selbst nicht der Kostentreiber:

```
rsi2seit, ganzes 60m-Archiv (gemessen):
  Laden                8,1 s
  Kontrolle bauen     19,4 s
  Signaldurchgang    157,6 s   ← quant.js/einstiegSignal, unverändert
  ------------------------------
  Summe             ~185 s     (Protokoll der Maschine: 205,7 s)

Aufschlag durch Zeitordnung: +2,95 s Schleife + 0,46 s Achse = +3,4 s  =  +1,8 %
```

Der Zeigerlauf ist billig: auf 60m nur **83.139** Leerlauf-Prüfungen bei 13,8 Mio.
Aufrufen; auf 1d **14,4 Mio.** (weil viele Reihen erst später beginnen), und selbst das
kostet nur 5,3 s. Der eigentliche Aufschlag ist Speicher-Lokalität: symbolweise bleibt
eine Reihe im Cache, zeitweise werden 2.871 Arrays je Zeitschritt angefasst.

**Das Muster existiert schon in der Maschine:** `baueQuerschnitt` baut genau diese
gemeinsame Zeitachse und läuft sie mit einem Zeiger je Symbol ab. Der Zustandshaken
braucht keine neue Technik, nur dieselbe an einer zweiten Stelle.

**Was wirklich teuer wird, ist nicht die Zeit, sondern die Zahl der Durchgänge:**

| heute | mit Zustand |
|---|---|
| 1 Durchgang je Variante | 1 Durchgang je Variante (zeitweise) |
| 1 Placebo-Durchgang je Hälfte | 1 Placebo-Durchgang **je Hälfte, durch den Haken** |
| — | 1 Nullgatter-Durchgang **je Verschiebung** (Permutation) |

Der Permutations-Nullpunkt aus 6.2 ist **nicht optional** — er ist der einzige ehrliche
Standardfehler dieses Endpunkts. Er kostet aber fast nichts, wenn man die Tagesreihe
einmal ablegt: 214 + 363 Verschiebungen auf den fertigen Reihen laufen in **0,13 s**
(gemessen, einschließlich Node-Start).

### 9.4 Wie man es testet

Drei Prüfungen, alle in `test-messmaschine.js`, alle auf einem **Kunstarchiv** mit
bekannter Wahrheit:

**(a) Zeitstempel-Wächter.** Ein Zustand, dessen `aufnehmen` künstlich mit einem
Ergebnis aus der Zukunft gefüttert wird, muss die Messung **abbrechen**. Prüft die
Sicherung selbst.

**(b) Vorgriffs-Kanarienvogel.** Zwei Läufe auf demselben Kunstarchiv:
ein Gatter, das die Zukunft sieht (pausiert genau die schlechten Tage), gegen dasselbe
Gatter mit einem Tag Verzögerung. Der Vorgriffslauf **muss** deutlich besser sein.
Kommen beide gleich heraus, ist entweder der Haken tot oder der ehrliche Lauf schummelt.
Auf echten Daten habe ich diesen Test schon gerechnet: ZUKUNFT liefert +1,28 Pp (Live)
gegen −0,11 Pp für den echten Wächter — der Abstand ist riesig und leicht zu prüfen.
**Das ist die positive Kontrolle, die dem Fehlerkatalog bisher fehlt:** SP prüft, ob
die Maschine bei Nichts eine Null liefert; niemand prüft, ob sie bei Etwas ein Etwas
liefert.

**(c) Nullgatter.** Gleiche Pausenquote, gleiche Episodenlängen, ohne jeden
Ergebnisbezug. Wahre Antwort null. Auf echten Daten gemessen: Median der Nullverteilung
−0,0073 Pp (Live) und −0,0045 Pp (Archiv) — der Nullpunkt des Endpunkts stimmt.

### 9.5 Verträglichkeit mit Placebo, A7 und Querschnitt

**Placebo (SP).** Der bestehende `placeboLauf` läuft symbolweise mit festem Schritt auf
denselben Sitzungspositionen wie das echte Signal. Mit einem Gatter würde er **die
falsche Maschine prüfen**: das Urteil fällt auf der gegateten Variante, der Nullpunkt
wird auf der ungegateten gemessen. Auflage: der Placebo bekommt eine **eigene
Zustandsinstanz**, gespeist mit **seinen eigenen** Ergebnissen, und läuft durch denselben
Haken. Kosten: ein zusätzlicher zeitgeordneter Durchgang je Hälfte, nach 9.3 etwa +3 s.
*Neue Fehlerart Z5.*

**A7.** Der Zustand liest die Ergebnisse der Strategie über 120 Handelstage zurück. Streng
genommen wächst damit das Lesefenster von 261 Kerzen (≈ 37 Handelstage) auf
`261 + 836 = 1.097` Kerzen (≈ 157 Handelstage). Gemessen (`a7-breite.js`, `gross.js`),
was das kostet:

| Lesefenster | Signale ohne Kontrolle (Live) | Signale ohne Kontrolle (Archiv) | Überschuss Bestätigung (Archiv) |
|---|---|---|---|
| 261 Kerzen | 0 von 1.266 (0,0 %) | 2 von 104.883 (0,00 %) | +0,0529 Pp, se 0,0651 |
| **1.097 Kerzen** | **0 von 1.266 (0,0 %)** | **12 von 104.883 (0,01 %)** | **+0,0515 Pp, se 0,0656** |

**Das ist die gute Nachricht dieses Entwurfs.** Der Kontrolltopf trägt das breitere
Fenster mühelos: ein Topf `(Symbol, Sitzungsposition, Hälfte)` hält bei 365 Handelstagen
je Hälfte rund 365 Kerzen; 1.097 Kerzen sind 157 davon, es bleiben ~208 übrig — weit über
der F4-Schranke von 20. Der Punktschätzer bewegt sich um 0,0014 Pp, F4 steigt von 0,00 %
auf 0,01 %. **Auflage: `leseFensterKerzen` muss bei einem Zustandshaken automatisch auf
`max(leseFensterKerzen, zustand.fensterKerzen)` gehoben werden** — und das Protokoll muss
beide Zahlen ausweisen.

**Querschnitts-Kontrolle.** Unberührt in der Konstruktion: `baueQuerschnittKontrolle`
baut den Topf aus **allen** Kerzen, nicht aus Signalen. Das Gatter verkleinert nur die
gepaarte Teilmenge. Zwei Auflagen: (i) die Eichzahl `se_A7 / se_Querschnitt` muss auf der
**gegateten** Teilmenge berichtet werden, nicht auf der ungegateten; (ii) der
Querschnittstopf enthält auch Werte, die das Gatter gerade sperrt — das ist richtig so,
denn er misst den Marktzug, nicht das eigene Buch.

**B10 / Newey-West.** Muss geändert werden. Siehe 6.2: die Korrelationslänge ist die
Episode (22 und 11 Tage), nicht H−1 = 7. Auflage: bei einem Zustandshaken wird der
Standardfehler **nicht** aus Newey-West genommen, sondern aus dem Permutations-Nullgatter.
*Neue Fehlerart Z2.*

---

## 10. Neue Fehlerarten für `FEHLERTYPEN.md`

Vorschlag Gruppe **Z — Zustand über die Messung**:

| # | Fehler | Vorkommen / Beleg | Was die Maschine tun muss |
|---|---|---|---|
| **Z1** | **Vorgriff über den Zustand** | noch keiner — der Haken existiert nicht | Freigabe-Warteschlange nach `msAus`; `aufnehmen` nur durch die Maschine; `erlaubnis` sieht weder Kerzen noch Index; Zeitstempel-Wächter bricht ab statt zu warnen |
| **Z2** | **Episoden statt Tage** | 25.08.: Endpunkt zeigt 364 Tage, informativ sind **2 Episoden**. Newey-West(H−1=7) unterschätzt den se um **Faktor 1,87** (0,0106 gegen 0,0198 Pp empirisch) | Der Standardfehler kommt aus dem Permutations-Nullgatter; die Fallzahl im Urteil ist die Zahl **abgeschlossener** Episoden, nicht die Tageszahl |
| **Z3** | **Symbolreihenfolge als verdeckter Parameter** | Variante von B9 | Innerhalb eines Zeitstempels sehen alle `erlaubnis`-Aufrufe denselben Zustand |
| **Z4** | **Zustandsuniversum ≠ Handelsuniversum** | 25.08. gemessen: derselbe Wächter, dieselben Pausentage — Endpunkt **−0,1064 Pp** auf 39 Werten, **+0,0115 Pp** auf 2.871. **Das Vorzeichen kippt.** | `zustand.universum` ist Pflichtfeld ohne Standardwert und wird gegen das gemessene Universum geprüft |
| **Z5** | **Placebo umgeht den Haken** | noch keiner | Der Placebo bekommt eine eigene Zustandsinstanz und läuft durch denselben Haken |
| **Z6** | **Kaltstart am Schnitt** | noch keiner | Der Zustand läuft über den Schnitt hinweg; das Protokoll weist aus, wie viele Bestätigungstage einen aus der Entdeckung gebildeten Zustand tragen |
| **Z7** | **Offene Episode als Fall gezählt** | 25.08.: Episode 2 (ab 2026-08-07) läuft am Archivende noch. Von 2 Episoden ist **1** abgeschlossen | Nur abgeschlossene Episoden zählen als Fälle |

Und eine Ergänzung zu **SP**, die nicht am Zustand hängt:

| **SP2** | **Nur der Nullpunkt wird geprüft, nie die Empfindlichkeit** | 25.08.: dass der Endpunkt Gatter *überhaupt* sehen kann, war nirgends geprüft — ZUKUNFT liefert +0,50 Pp bei 17 Pausentagen, der echte Wächter −0,11 Pp | Jede Messung mit Auswahlregel fährt eine **positive Kontrolle** mit: eine Regel mit bekanntem, großem Effekt. Bleibt sie unsichtbar, ist das Geschirr taub |

---

## 11. Auflagen

1. **Deklaration: die Bestätigungshälfte ist für diese Frage gesehen.** Ich habe für die
   Auflösungsrechnung die Punktschätzer der Bestätigungshälfte berechnet und in dieses
   Dokument geschrieben (−0,1064 Pp Live, +0,0115 Pp Archiv). Das ist ein Verstoß gegen
   „kein Blick auf die Bestätigung vor dem Urteil" — er ist hier zulässig, weil **kein
   Urteil gefällt wird** und weil es für diese Frage nie eine Entdeckungshälfte gab
   (0 Pausentage vor dem 12.03.2025). Aber er ist endgültig: eine spätere Messung des
   Edge-Wächters darf **diese** Bestätigungshälfte nicht als zurückgehalten ausgeben.
   Sie braucht Daten nach dem 24.08.2026.
2. **Der Haken wird gebaut, aber ohne Messanspruch.** R4. Er darf in kein Protokoll als
   Messwerkzeug eingehen, bevor R1 grün ist.
3. **`zustand.universum` ohne Standardwert.** Wer es vergisst, bekommt `verweigert: true`.
   Z4 ist die teuerste der neuen Fehlerarten — das Vorzeichen des Ergebnisses hängt daran.
4. **`leseFensterKerzen` wird automatisch angehoben**, siehe 9.5. Beide Zahlen ins
   Protokoll.
5. **Der Standardfehler kommt aus der Permutation**, nicht aus Newey-West, sobald ein
   Zustandshaken im Spiel ist. Sonst Z2.
6. **Nur abgeschlossene Episoden zählen.** Die offene Episode ab 2026-08-07 zählt nicht.
7. **Kosten und Ausstiegsregel:** der Haken ändert nichts am Ausstieg. Die Kostenhürde
   bleibt 2 × 5 bp = 0,10 % je Umlauf. Gatterte Signale kosten **nichts** — das ist der
   einzige Weg, auf dem ein Gatter überhaupt gewinnen kann, und er ist in E1 schon drin.
8. **Der Edge-Wächter wird deklariert**, nicht gemessen — konkret: `SICHERUNGEN.md` und
   die Oberfläche müssen sagen, dass der Wächter ein **ungemessener Aufsatz** ist, dass
   die gemessene Kante die Regel **ohne** ihn ist, und dass in 730 Handelstagen genau
   eine abgeschlossene Pause vorlag. Der heute im Code stehende Satz *„eine Pause kostet
   weniger als ein Irrtum"* ist eine **Annahme**, keine Messung; er darf so stehen
   bleiben, aber als Annahme gekennzeichnet.

---

## 12. Was diese Messung NICHT sagen darf

- **Nicht:** „Der Edge-Wächter schadet." Der Punktschätzer auf dem Live-Universum ist
  −0,1064 Pp, aber die Permutation gibt p = 0,21 und die informative Fallzahl ist
  **eine abgeschlossene Episode**. Das ist keine Aussage, das ist ein Datenpunkt.
- **Nicht:** „Der Edge-Wächter nützt." Auf dem ganzen Archiv steht +0,0115 Pp mit
  p = 0,55. Dasselbe Nichts mit anderem Vorzeichen.
- **Nicht:** „Der Wächter greift in schlechte Strecken." Auf den 17 Live-Pausentagen lag
  der Überschuss bei **+1,29 Pp** — der Wächter hat dort pausiert, wo es gut lief. Auf
  dem ganzen Archiv bei −0,13 Pp. Beide t-Werte unter 1,5. Das Vorzeichen dieser Aussage
  hängt am Universum, nicht an der Welt.
- **Nicht:** „Die Zahlen aus Abschnitt 6.1/6.3 sind ein Befund." Sie sind eine
  **Auflösungsrechnung**. Ihr Zweck war, S4 und S5 **vor** einer Entscheidung zu prüfen —
  und beide sind durchgefallen.
- **Nicht:** „delta80 = 0,066 Pp auf dem ganzen Archiv, also ist es messbar." Das
  Archiv-Universum ist nicht das Universum, das der Wächter gatet. Ein Haken, der auf
  2.871 Werten gatet, während der Wächter auf 39 rechnet, misst ein System, das nirgends
  läuft — genau der Fehler, der in diesem Projekt viermal schiefgegangen ist. Und selbst
  dort wäre die informative Fallzahl 2 Episoden.
- **Nicht:** „Die Umstellung auf Zeitordnung ist zu teuer." Sie ist gemessen +1,8 % auf
  einen 185-Sekunden-Lauf. Der Grund gegen die Messung ist statistisch, nicht technisch.
- **Nicht:** „Der Wächter ist damit widerlegt und kann weg." Nichts hier widerlegt ihn.
  Er bleibt eine **plausible, ungemessene** Schutzhandlung. Wer ihn abschaltet, tut das
  ebenso ohne Beleg wie wer ihn anlässt.
- **Nicht:** „Die Simulation aus 3.3 ist der Wächter." Sie spielt seine Regeln auf dem
  Archiv nach. Live liefen andere Kursstände, andere Poolbelegungen und ein
  Hand-Entscheid-Schalter (`edgePauseHand`), den die Simulation nicht kennt. Sie ist die
  beste verfügbare Näherung, nicht der Wächter selbst.

---

## 13. Empfehlung

**Bauen, aber nicht dafür.**

| | |
|---|---|
| Haken bauen? | **Ja.** +1,8 % Laufzeit (gemessen), Vorgriff strukturell ausgeschlossen, das Zeitachsen-Muster liegt in `baueQuerschnitt` schon fertig vor. Er räumt eine ganze Fehlerklasse ab. |
| Edge-Wächter damit messen? | **Nein.** 1 abgeschlossene Episode, delta80 Faktor 2,7 über der Hürde, S4 tot (0 Entdeckungsfälle). Frühestens neu prüfen bei 15 abgeschlossenen Episoden. |
| Edge-Wächter deklarieren? | **Ja.** Als ungemessener Aufsatz, mit der Fallzahl daneben. |
| Was der Haken sofort bringt | Die Test-Invariante „Live = Messung" wird zum ersten Mal **prüfbar** statt versprochen. Das ist der eigentliche Gewinn — nicht ein Urteil über den Wächter. |

Und ein Nebenfund, der über diesen Entwurf hinausgeht: **die Maschine prüft ihren
Nullpunkt (SP), aber nie ihre Empfindlichkeit.** Ein Gatter mit bekanntem großem Effekt
(ZUKUNFT) kostet einen Durchgang und sagt, ob das Geschirr überhaupt hören kann.
Bei 34 von 38 Messungen, die laut der Auflösungswand-Rechnung strukturell blind waren,
wäre das die billigste Warnlampe gewesen, die es gibt.
