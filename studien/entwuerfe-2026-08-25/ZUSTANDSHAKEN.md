# Der Zustandshaken — Architektur-Entscheid (Endfassung)

**Datum:** 25.08.2026
**Art:** Architektur-Entscheid. **Keine Vorregistrierung.** Es wird hier nichts als belegt
behauptet.
**Vorgänger:** `zustandshaken-ENTWURF-original.md` (gleiches Verzeichnis), geprüft von zwei
Skeptikern (Linse *Vorgriff*, Linse *Auflösung*). **Beide Urteile: hält nicht stand.** Die
Empfehlung des Entwurfs bleibt richtig, seine Zahlen und seine Architektur nicht.

---

## 0. Ergebnis in drei Sätzen

**Der Haken wird gebaut, der Edge-Wächter wird nicht gemessen, sondern deklariert.** Das
war schon die Empfehlung des Entwurfs und sie steht — aber auf anderen Zahlen und mit einer
anderen Architektur: der Entwurf hatte sich, ohne es zu merken, das **extremste von drei
möglichen Universen** ausgesucht, und dieses Universum war **rückschauend gewählt**. Der
teuerste Satz des Entwurfs — „es gab für diese Frage nie eine Entdeckungshälfte" — ist
**falsch**; auf dem Universum, das der Wächter tatsächlich bediente, liegen dort
**69 Pausentage in zwei abgeschlossenen Episoden**. Damit fällt die Rechtfertigung, mit der
der Entwurf die Bestätigungshälfte verbrannt hat.

**Der neue Hauptbefund dieses Papiers ist nicht der Haken, sondern eine Fehlerart:
Z8 — das Universum, das den Zustand speist, wurde mit Zukunftswissen gewählt.**

---

## 1. Die zwei Fragen

**F1 (Architektur):** Wie sieht ein Haken aus, mit dem eine Strategie einen Zustand über
die ganze Messung tragen kann — `erlaubnis(Z, sym, params) -> bool`, wobei `Z` aus den
bisherigen Ergebnissen der Strategie selbst gebildet wird? Wie wird Vorgriff **erzwungen**
statt zugesagt?

**F2 (Machbarkeit):** Wäre damit die Frage *„was kostet der Edge-Wächter?"* beantwortbar?

F1 hat eine gute Antwort — nach drei Korrekturen (Abschnitt 5). F2 hat eine schlechte, und
F2 entscheidet, ob F1 sich für **diesen** Zweck lohnt.

---

## 2. Der tödliche Mangel: das Universum wurde rückschauend gewählt (Z8)

### 2.1 Der Befund

`depot.js` Z. 2783–2789, heute nachgelesen:

```
var POOLS_60M = {
  /* Volatilstes Drittel des 99er-Universums (Stichtag 21.08.2026, Vola ueber die
   * letzten 120 Handelstage annualisiert, Spanne 46-96 % gegen 38 % Median). */
  volatil: ('MU ARM TEAM INTC ZS AMD ... TSM RCL').split(' '),
```

Das Auswahlfenster reicht damit von ca. **März 2026 bis 21.08.2026** — **vollständig
innerhalb der Bestätigungshälfte** (Schnitt 2025-03-12). Git: Commit `398f33d`, v8.23.22,
2026-08-21; der Edge-Wächter selbst entstand einen Tag zuvor (`3353118`, v8.23.23). **Auf
727 der 730 simulierten Handelstage lief weder dieser Wächter noch dieser Pool.**

Der Entwurf erklärte in Vorab-Einteilung 3 genau dieses 39-Werte-Universum zur einzig
zulässigen Wahl („was der Wächter wirklich gatet"). Eine Teilmenge, die aus späteren Daten
gebildet wurde, wurde damit als **Vorab**-Einteilung ausgegeben.

### 2.2 Die Kernzahl ist ein Artefakt dieser Auswahl — nachgerechnet

`waechter-sim.js` unverändert laufen lassen, nur das Zusatz-Universum getauscht (die
Simulation reproduziert den Entwurf exakt: 730 Tage, 34 Pausentage, 0 in der Entdeckung,
Episoden [22, 12 offen]):

| Universum | Pausentage | in Entdeckung | in Bestätigung | **abgeschlossene Episoden** |
|---|---:|---:|---:|---:|
| `volatil`, 39 Werte (der Entwurf) | 34 | **0** | 34 | **1** |
| Basis, 15 Werte (seit je unverändert) | 33 | 2 | 31 | **2** |
| **default-60m EXTRA, 99 Werte** *(in Kraft während der gesamten simulierten Strecke)* | **130** | **69** | **61** | **4** + 1 offen |

Die vier Episoden auf dem ehrlichen Universum: 2023-12-19 … 2024-01-24 (24 T),
2024-05-15 … 2024-07-19 (45 T), 2025-09-15 … 2025-10-13 (21 T), 2026-06-04 … 2026-07-15
(28 T), plus eine offene.

**„Das ist die ganze Fallzahl: eine abgeschlossene Episode" und „die Entdeckungshälfte
enthält null Pausentage" sind keine Eigenschaften des Wächters, sondern Eigenschaften einer
Liste, die vier Tage vor dem Entwurf aus Bestätigungsdaten geschrieben wurde.**

### 2.3 Was das kostet

Auflage 11.1 des Entwurfs begründete den Blick auf die Bestätigungshälfte so: *„er ist hier
zulässig, weil kein Urteil gefällt wird und weil es für diese Frage nie eine
Entdeckungshälfte gab (0 Pausentage vor dem 12.03.2025)."* Der zweite Halbsatz ist
widerlegt: 69 Pausentage in zwei abgeschlossenen Episoden (24 und 45 Handelstage). **S4
hätte auf der Entdeckungshälfte geschätzt werden können, ohne die Bestätigung anzufassen —
genau die von der Mühle verlangte Reihenfolge.**

**Die Rechtfertigung wird hiermit zurückgenommen.** Was verbrannt ist und was nicht:

| verbrannt | nicht verbrannt |
|---|---|
| der gepaarte Tagesüberschuss von `rsi2seit` **ab 2025-03-12** für die Frage „was kostet der Wächter" — auf **allen drei** Universen, weil alle drei angesehen wurden | der **Kapitulations-Arm** (H = 26, nie simuliert) |
| | **andere Pausenregeln** als „zwei Nächte, t ≤ −1" |
| | **alles nach dem 24.08.2026** |
| | die **Entdeckungshälfte** (auf dem ehrlichen Universum bisher nur für S4-Zwecke angesehen) |

---

## 3. Der zweite tödliche Mangel: der Haken kann den Wächter nicht ausdrücken

§9.2 Punkt 3 des Entwurfs lautete wörtlich: *„Wird ein Signal GENOMMEN, wandert sein
Ergebnis … in den Stapel."* Gegatterte Signale gingen also nie in den Zustand.

Der echte Wächter rechnet aber über **alle** Signale des Arms, gehandelt oder nicht.
`depot.js` Z. 8320–8330, nachgelesen: die Schleife über `i2` bildet `us` aus **jeder**
Signalkerze im Fenster; nirgends wird auf Pause gefiltert. Und aufgehoben wird die Pause nur
bei `!verfall && rohMittel > 0`.

**Folge:** Fällt die Speisung während der Pause weg, läuft das Fenster leer, `nSym` fällt
unter 5, `rohMittel` wird null — und die Aufhebungsbedingung kann **nie mehr** feuern. Der
Haken hätte den Wächter in eine **Dauerpause** gesperrt und damit genau die Fehlerart
erzeugt (Live ≠ Messung), gegen die R4 ihn stellt. **Keine der drei R1-Prüfungen berührt
die Aufhebung** — R1 hätte grün gemeldet und der Haken wäre trotzdem falsch gewesen.

**Dritter Mangel derselben Klasse:** Der Vertrag hat keine Stelle, an der der Zustand
**tickt**. `taktung: 'tag'` war deklariert, aber die einzigen Rückrufe waren
`anfang`/`aufnehmen`/`erlaubnis`, und `aufnehmen` läuft je **Ergebnis**, nicht je Tag. Die
nächtliche Rechnung des Wächters (Drift im Fenster, t über Symbole, Zwei-Nächte-Historie,
Signalzuwachs) hatte im Vertrag keinen Ort. Der Entwurf war als Bauplan **unvollständig**,
nicht nur unpräzise.

---

## 4. Die Zahlen, korrigiert

### 4.1 Die Auflösung — das Nein steht, mit anderer Begründung

Auf dem ehrlichen Universum gemessen gegen R2:

| Bedingung | verlangt | vorhanden (default-60m) | |
|---|---:|---:|:--|
| R2(i) abgeschlossene **Entdeckungs**-Episoden | ≥ 8 | **2** | verfehlt |
| R2(ii) abgeschlossene **Bestätigungs**-Episoden | ≥ 15 | **2** | verfehlt |
| R2(iii) delta80 unter 0,10 Pp | — | auf dem ehrlichen Universum **unbekannt** | offen |

**Der schärfste Beleg steht ungenutzt in den Zahlen des Entwurfs selbst.** Für
`|t| ≥ 2,498` bräuchte der Endpunkt `2,498 × 0,0803 = 0,2006 Pp`. Die **beste aller 214
starren Verschiebungen** des beobachteten Episodenmusters erreicht laut §6.2 gerade
**+0,1830 Pp**. Das heißt: **kein Gatter dieser Episodenform, an keiner Stelle der
Bestätigungshälfte, hätte die deklarierte Schwelle erreicht — selbst bei perfekter
Platzierung mit Vorgriff nicht.** Der Lauf ist nicht knapp zu grob, er ist für die gesamte
Gatterklasse taub.

Die positive Kontrolle des Entwurfs verdeckte das: `gatter.js` sortiert für ZUKUNFT die
17 **einzeln schlechtesten** Tage und nimmt die ersten. Das ist eine Auswahl, die kein
episodenförmiges Gatter treffen kann. **6,2 × se ist die Empfindlichkeit für eine nicht
realisierbare Gatterform; die realisierbare liegt bei 2,28 × se und damit unter der
Schwelle.**

### 4.2 Was an den Kopfzahlen nicht stimmt

- **Der Kopfwert −0,1064 Pp steht auf dem falschen Signalsatz.** `reihen-dump.js` (Quelle
  von `reihen.json` und damit von `gatter.js`) hat **keine Abklingzeit**; der Wächter und
  `aufloesung.js` haben 120 Minuten. §6.1 mischt beide Läufe: −0,1064 × 215/17 = 1,3457 Pp,
  daneben gedruckt „NUR Pausentage +1,2878 Pp" — 4,5 % auseinander, weil es zwei
  verschiedene Läufe sind. Die gesamte Auflösungsrechnung (se 0,0803, delta80 0,268) hängt
  am Satz **ohne** Abklingzeit, also an einem System, das live nicht läuft.
- **Der Kopfwert verletzt Auflage 6 / Z7.** Die Maske enthält beide Episoden [11, 6]; die
  6-Tage-Episode ist ein Ausschnitt der am 2026-08-24 noch **offenen**. Zählt man nur
  abgeschlossene, bleibt **ein** Block von 11 Signaltagen — und `gatter.js` druckt dann
  selbst „nur 1 Episode — kein Standardfehler schätzbar".
- **Der empirische se trägt ~16–20 % relative Unsicherheit.** 214 zyklische Verschiebungen
  eines starren Zweiblock-Musters sind keine 214 unabhängigen Ziehungen; effektiv sind es
  ~12–19 Platzierungen. Also **delta80 = 0,268 ± ~0,05 Pp**, „Faktor 2,7" = **2,7 ± 0,4**.
  Zusätzlich überlappen ~20 Verschiebungen die echte Maske und ziehen die Nullverteilung zur
  Beobachtung hin — p = 0,21 ist dadurch nach oben verzerrt. Vier Nachkommastellen sind
  nicht gedeckt.
- **Die Produkthürde 0,10 Pp ist für diesen Endpunkt eher zu mild als zu streng.** Der
  Endpunkt ist die **Veränderung** des Tagesmittels; die Strategie selbst liegt bei
  +0,0529 Pp. Ein Gatter, das die Kante halbiert oder verdoppelt, bewegt den Endpunkt um
  ~0,05 Pp und bliebe unter der Hürde. Gegen den sachlich richtigen Maßstab wäre das
  Verhältnis nicht 2,7, sondern **~5,4**. Das macht die Ablehnung **stärker**.
- **Nur der `rsi2seit`-Arm wurde simuliert.** `waechter-sim.js` setzt `P.ENTRY = rsi2seit`
  und `H = 8` fest; der Kapitulations-Arm (H = 26) kommt nicht vor. R3 urteilte gleichwohl
  über „den Edge-Wächter" — das wird eingeschränkt.
- **Die Zahl gesehener Punktschätzer stimmt nicht.** §8/§11.1 nennen „4 Punktschätzer auf
  der Bestätigungshälfte". Aus den Skripten gezählt: `aufloesung.js` 2 Varianten × 4
  Statistiken = 8; `gatter.js` 2 Universen × 5 Größen = 10; dazu `a7-breite.js` (2
  Fensterbreiten) und `gross.js` — **über 20**. Da kein Urteil fällt, ändert das nichts am
  Ergebnis; in einem Papier, dessen Kern ehrliches Testzählen ist, muss die Zahl stimmen.

### 4.3 Die Jahresrechnung, selbstkonsistent

Die alte Rechnung war in sich unstimmig: §6.4 leitet `E ≥ 14,4` aus `se ~ 1/√E` her, was
`N/E` konstant voraussetzt (also die **beobachtete** Rate von 1,38 je Jahr), teilt dann aber
durch 0,69 je Jahr — die Rate über das ganze Archiv, dessen Entdeckungshälfte auf dem
rückschauenden Universum 0 Episoden enthielt.

**Neu, mit ausgewiesenem λ auf dem ehrlichen Universum:** 4 abgeschlossene Episoden in
2,90 Jahren = **λ = 1,38 je Jahr**.

| Ziel | Episoden | Zeit bei λ = 1,38 | 95-%-Poisson-Band (λ ∈ [0,38; 3,53]) |
|---|---:|---:|---|
| R2(ii) | 15 | **~10,9 Jahre** (≈ 2037) | 4,2 – 39,5 Jahre |
| Maschinen-Mindestfallzahl | 30 | ~21,8 Jahre | 8,5 – 79 Jahre |

**„Nicht vor 2048" wird gestrichen.** Es war um rund Faktor 2 zu pessimistisch und
Scheinpräzision obendrein — es hätte eine Frage stillgelegt, die möglicherweise Anfang der
2030er entscheidbar wird. Ehrliche Fassung: **Wiedervorlage bei 8 abgeschlossenen
Entdeckungs- plus 15 Bestätigungs-Episoden; Erwartung Mitte der 2030er, mit weitem Band.**

### 4.4 Was die Kosten wirklich sind

Der Entwurf widersprach sich innerhalb von vier Zeilen: §9.3 verlangt „1
Nullgatter-Durchgang **je Verschiebung**", der Fließtext daneben behauptet, 214 + 363
Verschiebungen kosteten 0,13 s „auf den fertigen Reihen". Beides zugleich geht nicht:
sobald der Zustand rückkoppelt, ändert jede Verschiebung das Gatter, und die fertige Reihe
existiert nicht mehr.

**Ehrlich:**

| | Kosten |
|---|---|
| ein Durchgang mit Zeitordnung | **+3,4 s auf 185 s = +1,8 %** (gemessen, gilt) |
| vollständiger Lauf mit 577 Permutations-Durchgängen | **577 × 3,4 s ≈ 33 min ≈ 10,6× ein Normallauf** |
| Voraussetzung dafür | die Signalberechnung (157,6 s) muss **einmal zwischengespeichert** werden — sie hängt nicht am Gatter |

Die Zwischenspeicherung ist damit eine **Architekturanforderung**, keine Fußnote. Der
Permutations-Standardfehler ist nach Auflage 5 nicht optional.

---

## 5. Die korrigierte Architektur

### 5.1 Der Vertrag

```js
zustand: {
  // A7: ADDITIV zum Lesefenster der Strategie, nicht max().
  fensterKerzen: 836,          // deklariert konservativ: die Live-Regel sind
                               // 120 KALENDERtage (~83 Handelstage ~578 Kerzen),
                               // nicht 120 Handelstage. 836 testet ~44 % zu breit.

  // WELCHE Symbole den Zustand speisen. Pflichtfeld, kein Standardwert.
  // NEU (Z8): Herkunft und Stichtag der Liste sind Pflichtangaben und gehen ins
  // Protokoll. Die Liste muss zu JEDEM simulierten Zeitpunkt ohne spaetere Daten
  // bestimmbar gewesen sein.
  universum:         function (sym) { ... },
  universumHerkunft: 'default-60m EXTRA, in Kraft seit v8.x, Stichtag <datum>',

  taktung: 'tag',

  anfang:    function ()               { return { ... }; },
  aufnehmen: function (Z, ergebnis)    { /* faltet EIN abgeschlossenes Ergebnis ein */ },
  takt:      function (Z, ms)          { /* NEU: einmal je Kalendertag nach Schluss */ },
  erlaubnis: function (Z, sym, params) { return true; }
}
```

`ergebnis` ist ausschließlich `{ sym, dir, msEin, msAus, r, genommen }` — **keine Kerzen,
kein Index, kein Zugriff auf `bars`**. `erlaubnis` bekommt **keinen Zeitindex und keine
Kerzen**: sie *kann* nicht in die Zukunft schauen, weil sie nichts hat, worin sie schauen
könnte.

### 5.2 Drei Korrekturen gegenüber dem Entwurf

**(1) In den Freigabestapel gehen die Ergebnisse ALLER Signale**, mit einem Feld
`genommen: true|false`. Der Vorgriffsschutz hängt **nicht** daran, ob gehandelt wurde,
sondern allein an `msAus < t` — er bleibt also vollständig erhalten. Nur so kann ein Gatter
sich selbst wieder aufheben (Abschnitt 3).

**(2) `takt(Z, ms)`** wird bei `taktung: 'tag'` einmal je Kalendertag nach Handelsschluss
gerufen. Dort — und nur dort — läuft die nächtliche Rechnung. Ohne diesen Rückruf ist §9.1
nicht implementierbar.

**(3) Der Zeitstempel-Wächter wird geschärft.** Die Prüfung `maxAus < t` ist im
Produktivlauf **tautologisch**: die Warteschlange gibt nur Ergebnisse mit `msAus < t` frei,
`maxAus < t` ist damit per Konstruktion immer wahr. Sie prüft nur die künstlich gefütterte
Testinstanz. Ersetzt durch: **`r` wurde nur aus Kerzen bis zum TATSÄCHLICHEN Ausstieg
gebildet** (einschließlich `fuehreAus`-Ergebnis, wenn `stopNiveau` früher greift als `i+H`).
Und der Vergleich läuft auf **Schlusszeiten**, nicht auf Öffnungszeitstempeln:
`msAus = bars[i+H][0]` ist der Öffnungsstempel der Ausstiegskerze, der Ausstieg fällt auf
deren Schluss. Mit `msAus < t` wird ein Ergebnis, das in derselben Kerze ausläuft, in der
ein neues Signal einsteigt, ausgeschlossen — **live ist es verfügbar**. Die Messung wäre
strenger als live, und genau daran risse R4.

### 5.3 Unverändert gut (aus dem Entwurf übernommen)

- **Gleichstand-Regel (Z3):** innerhalb eines Zeitstempels sehen alle `erlaubnis`-Aufrufe
  denselben Zustand. Der Zustand rückt nur *zwischen* Zeitstempeln vor.
- **Kaltstart am Schnitt (Z6):** der Zustand läuft über den Schnitt **hinweg**, weil er das
  live auch tut; das Protokoll weist aus, wie viele Bestätigungstage einen aus der Entdeckung
  gebildeten Zustand tragen.
- **Placebo (Z5):** eigene Zustandsinstanz, gespeist mit seinen **eigenen** Ergebnissen,
  durch denselben Haken.
- **A7:** gemessen trägt der Kontrolltopf das breitere Fenster mühelos — 1.097 Kerzen lassen
  bei 365 Handelstagen je Hälfte rund 208 übrig, weit über der F4-Schranke von 20; der
  Punktschätzer bewegt sich um 0,0014 Pp, F4 steigt von 0,00 % auf 0,01 %.
  **Korrektur zur Auflage:** `leseFensterKerzen + zustand.fensterKerzen` (**additiv**), nicht
  `max(...)`. Der Entwurf rechnete additiv (261 + 836 = 1.097) und schrieb `max` vor — das
  wären 836 gewesen, und 261 Kerzen hätten im A7-Ausschluss gefehlt, also genau die
  Fehlerklasse (A7/F2), die der Haken schließen soll.
- **Zeitordnung:** das Muster liegt in `baueQuerschnitt` schon fertig vor.

### 5.4 Die Prüfungen (R1, erweitert)

| | Prüfung | Was sie fängt |
|---|---|---|
| (a) | **Ausstiegstreue** (statt Zeitstempel-Tautologie): `r` nur aus Kerzen bis zum tatsächlichen Ausstieg; Freigabe auf Schlusszeiten | falsch berechnetes `msAus`, Stop-Ausstiege |
| (b) | **Vorgriffs-Kanarienvogel**: Gatter mit Zukunft gegen dasselbe mit einem Tag Verzögerung — der Vorgriffslauf **muss** deutlich besser sein | toter Haken, schummelnder Ehrlich-Lauf |
| (c) | **Nullgatter**: gleiche Pausenquote, gleiche Episodenlängen, ohne Ergebnisbezug, Kunstarchiv mit wahrem Wert null | Nullpunkt |
| **(d)** | **BEFREIUNG (neu):** Kunstarchiv mit einer schlechten Strecke, danach einer guten. Das Gatter muss pausieren **UND später wieder freigeben.** Fällt es in Dauerpause, ist der Haken falsch verdrahtet. | **den Mangel aus Abschnitt 3 — die drei vorhandenen Prüfungen fangen ihn nicht** |

---

## 6. Entscheidungsregel — VORAB, wörtlich

> **R1 (Abnahme des Hakens).** Der Zustandshaken darf von keiner Strategie benutzt werden,
> bevor **alle vier** Prüfungen aus 5.4 in `test-messmaschine.js` grün sind. Fällt eine
> durch, wird der Haken nicht ausgeliefert.

> **R2 (Zulassung einer Gatter-Messung).** Ein Gatter darf über den Haken **gemessen**
> werden, wenn und nur wenn **vor** dem Blick auf die Bestätigungshälfte gilt:
>
> **(i)** Auf der **Entdeckungshälfte** liegen mindestens **8 abgeschlossene** Episoden vor
> **und** der dort geschätzte Effekt ist mindestens **4×** so groß wie die
> Bestätigungs-MDE (S4).
>
> **(ii)** Auf der Bestätigungshälfte liegen mindestens **15 abgeschlossene** Episoden vor.
> *(Die Wiederaufnahmeschwelle lautet damit 8 + 15 = 23 Episoden. Der Entwurf nannte in
> §6.4 und R3 nur die 15 — das erfüllte (ii), nicht (i), und war im eigenen Text
> unterbestimmt.)*
>
> **(iii)** `delta80`, berechnet aus dem **empirischen** Standardfehler des
> Permutations-Nullgatters **auf der ENTDECKUNGSHÄLFTE**, mit den **dort** beobachteten
> Episodenlängen, liegt **unter** der Produkthürde von 0,10 Pp (S5).
> *Geändert: `gatter.js` berechnet das Nullgatter heute ausschließlich auf `werteB`, also
> auf den realisierten Überschüssen der Bestätigungshälfte. Das Tor, das entscheiden soll,
> ob die Hälfte angefasst werden darf, war damit erst **nach** dem Anfassen berechenbar. Die
> Regel hätte den Verstoß lizenziert, den sie verhindern soll.*
>
> **(iv) NEU (Z8):** Das Universum, das den **Zustand** speist, ist zu jedem Zeitpunkt der
> Messung **ohne spätere Daten** bestimmbar. Herkunft und Stichtag stehen im Protokoll, und
> die Messung läuft auf **mindestens zwei** solchen Universen.
>
> **(v) NEU:** Die Wächter-Parameter `VERFALL_T`, Fensterlänge, `nSym`-Minimum und
> Mindestsignale je Symbol sind mit dem Stand vom 25.08.2026 **eingefroren**; jede Änderung
> ist ein **neuer Test** und geht in die Bonferroni-Zahl. *Ohne diese Bedingung ist R2
> wertlos: die t-Verteilung des Wächters (min −3,51, 10 % −0,39, Median +0,71) zeigt, dass
> −1 weit im Schwanz liegt — mit `VERFALL_T = −0,4` lieferte dasselbe Archiv sofort ein
> Vielfaches an Episoden, und R2(ii) wäre „erfüllt". Das ist B9 in neuer Kleidung.*
>
> **(vi) NEU:** Ein **Orakel derselben Episodenform** (bester Block je beobachteter Länge,
> frei platziert) muss die Bonferroni-Schwelle überschreiten. Heute tut es das mit 0,1830
> gegen 0,2006 Pp **nicht**.
>
> Ist eine Bedingung verletzt, wird die Bestätigungshälfte **nicht angefasst** und das
> Gatter als **Aufsatz deklariert**.

> **R3 (Anwendung auf den Edge-Wächter, `rsi2seit`-Arm, heute).** Er erfüllt R2 nicht:
> (i) **2** statt 8 Entdeckungs-Episoden — verfehlt; (ii) **2** statt 15
> Bestätigungs-Episoden — verfehlt; (iv) das im Entwurf benutzte Universum war
> **rückschauend gewählt** — verletzt; (vi) das Orakel derselben Form erreicht die Schwelle
> nicht — verfehlt.
> **Der Edge-Wächter wird NICHT gemessen, sondern deklariert.** Wiedervorlage bei
> 8 Entdeckungs- **plus** 15 abgeschlossenen Bestätigungs-Episoden; bei λ = 1,38 je Jahr
> Mitte der 2030er, Band 4–40 Jahre.
> **R3 gilt ausdrücklich nur für den `rsi2seit`-Arm.** Der Kapitulations-Arm (H = 26) wurde
> nie simuliert; über ihn wird nichts ausgesagt.

> **R4 (Was stattdessen gebaut wird).** Der Haken wird gebaut — **nicht als Messwerkzeug,
> sondern als Test-Invariante**: `test-messmaschine.js` bekommt einen Fall, der die live
> gehandelte Regel *einschließlich* Gatter durch die Maschine schickt und prüft, dass die
> Signalmenge mit der live erzeugten übereinstimmt. Weicht sie ab, ist es ein **Fehler**,
> kein Befund. Fünfter Anlauf gegen dieselbe Fehlerart (Live ≠ Messung), erster, der sie
> strukturell prüfbar macht.

---

## 7. Neue Fehlerarten für `FEHLERTYPEN.md`

Gruppe **Z — Zustand über die Messung**:

| # | Fehler | Beleg | Was die Maschine tun muss |
|---|---|---|---|
| **Z8** | **Das Universum, das den Zustand speist, wurde mit Zukunftswissen gewählt.** Weder Warteschlange noch Zeitstempel-Wächter können sehen, dass eine Symbolliste rückschauend geschrieben wurde. Der Vorgriffsschutz der Architektur gilt für den **zeitlichen Ergebnisstrom**, nicht für die **Auswahl der Symbole**. | 25.08.: `POOLS_60M.volatil`, Stichtag 21.08.2026, Auswahlkriterium vollständig aus der Bestätigungshälfte. Dasselbe Geschirr liefert 1 / 2 / **4** abgeschlossene Episoden je nach Universum; der Entwurf hatte das extremste. | `zustand.universum` **plus** `universumHerkunft` mit Stichtag sind Pflicht; Pflicht-Vergleichslauf auf mindestens zwei nicht rückschauend gewählten Universen. **Z8 ist teurer als Z4 — sie hat Z4 erst erzeugt.** |
| **Z9** | **Der Zustand wird nur von genommenen Handeln gespeist und kann sich nie befreien.** | 25.08.: §9.2 Punkt 3 des Entwurfs gegen `depot.js` Z. 8320–8330 (speist aus **allen** Signalen) → Dauerpause | Alle Ergebnisse in den Stapel, `genommen`-Flag; **BEFREIUNGS-Prüfung** in R1(d) |
| **Z1** | Vorgriff über den Zustand | noch keiner | Freigabe-Warteschlange nach `msAus`; `aufnehmen` nur durch die Maschine; `erlaubnis` sieht weder Kerzen noch Index |
| **Z2** | **Newey-West ist für Episoden-Endpunkte in UNBEKANNTER Richtung falsch** | 25.08.: auf dem Archiv **1,87× zu klein** (0,0106 gegen 0,0198), auf dem Live-Universum **1,26× zu groß** (0,1010 gegen 0,0803). *Die Entwurfsfassung („unterschätzt um Faktor 1,87") verallgemeinerte aus einem von zwei Fällen, und der andere zeigt in die Gegenrichtung.* | Der Standardfehler kommt aus der **Permutation**; die Fallzahl im Urteil ist die Zahl **abgeschlossener** Episoden |
| **Z3** | Symbolreihenfolge als verdeckter Parameter | Variante von B9 | Innerhalb eines Zeitstempels sehen alle `erlaubnis`-Aufrufe denselben Zustand |
| **Z4** | Zustandsuniversum ≠ Handelsuniversum | 25.08.: Endpunkt −0,1064 Pp auf 39 Werten, +0,0115 Pp auf 2.871 — Vorzeichenkipp. **Einschränkung:** der Vergleich stellt ein rückschauend gewähltes Universum gegen das Gesamtarchiv; das Vorzeichen kann Auswahlartefakt sein. Für Z4 als Befund braucht es zwei **nicht** rückschauend gewählte Universen. | `zustand.universum` Pflichtfeld ohne Standardwert, gegen das gemessene Universum geprüft |
| **Z5** | Placebo umgeht den Haken | noch keiner | eigene Zustandsinstanz, derselbe Haken |
| **Z6** | Kaltstart am Schnitt | noch keiner | Zustand läuft über den Schnitt; Protokoll weist die betroffenen Tage aus |
| **Z7** | Offene Episode als Fall gezählt | 25.08.: von 2 Episoden ist **1** abgeschlossen — und der Kopfwert des Entwurfs zählte die offene mit | Nur abgeschlossene Episoden zählen |

Und zu **SP**, unabhängig vom Zustand:

| # | Fehler | Beleg | Was die Maschine tun muss |
|---|---|---|---|
| **SP2** | **Nur der Nullpunkt wird geprüft, nie die Empfindlichkeit — und die positive Kontrolle muss dieselbe FORM haben wie das geprüfte Gatter.** | 25.08.: ZUKUNFT sortierte die 17 einzeln schlechtesten Tage (+0,50 Pp, 6,2 × se) — eine Auswahl, die kein episodenförmiges Gatter treffen kann. Das **Orakel derselben Form** erreicht nur +0,1830 Pp = 2,28 × se und liegt **unter** der Schwelle. | Jede Messung mit Auswahlregel fährt eine positive Kontrolle mit, **deren Auswahlform der geprüften entspricht**. Bleibt sie unsichtbar, ist das Geschirr taub. |

---

## 8. Auflagen

1. **Die Rechtfertigung aus 11.1 des Entwurfs ist zurückgenommen** (Abschnitt 2.3), der
   Verbrauchsumfang benannt.
2. **Der Haken wird gebaut, aber ohne Messanspruch.** R4. Kein Protokoll als Messwerkzeug
   vor R1 grün.
3. **`zustand.universum` und `universumHerkunft`** ohne Standardwert; wer sie vergisst,
   bekommt `verweigert: true`.
4. **`leseFensterKerzen + zustand.fensterKerzen`, additiv.** Beide Zahlen ins Protokoll.
5. **Standardfehler aus der Permutation**, nicht aus Newey-West, sobald ein Zustandshaken im
   Spiel ist — und der Permutations-se wird **mit seiner eigenen Unsicherheit** berichtet
   (~16–20 % relativ). Deklarieren: er ist eine **Randomisierungsgröße**, bedingt auf die
   realisierte Reihe — für den p-Wert richtig, für eine Vorausrechnung von delta80 nur eine
   Näherung.
6. **Nur abgeschlossene Episoden zählen.** Die offene ab 2026-08-07 zählt nicht — auch nicht
   im Kopfwert.
7. **Kopfzahlen auf EINEN Lauf vereinheitlichen:** `reihen-dump.js` bekommt die
   120-Minuten-Abklingzeit, damit der Endpunkt auf demselben Signalsatz steht wie der
   Wächter. Beide Varianten (mit/ohne) getrennt ausweisen.
8. **`reihen.json` mitablegen** oder `gatter.js` so umbauen, dass es aus `waechter-sim.json`
   plus Archiv selbst rechnet. Zahlen, die niemand nachrechnen kann, sind in diesem Projekt
   keine Zahlen (Regel „Agentenergebnis sofort auf die Platte").
9. **§3.3 umschreiben:** nicht „spielt die Regeln aus `depot.js` **wörtlich** nach", sondern
   „nachgespielt, mit drei deklarierten Abweichungen": (a) live wird `cool = 0` bei jedem
   nächtlichen Aufruf gesetzt, die Abklingzeit-Kette startet also jede Nacht am
   **verschobenen** linken Fensterrand neu — die Simulation rechnet **eine** globale Kette
   ab Index 300 (B9, Phase); (b) die Live-Driftschleife hat weder `c[i] > 0`-Prüfung noch
   Obergrenze, die Simulation ergänzt beide; (c) live filtert Signale nicht auf einen
   gültigen Ausstiegskurs, die Simulation schon.
10. **Zwischenspeicherung der Signalberechnung** ist Architekturanforderung (4.4), sonst
    kostet ein vollständiger Lauf das 10,6-fache statt +1,8 %.
11. **Der Edge-Wächter wird deklariert**, nicht gemessen: `SICHERUNGEN.md` und die
    Oberfläche müssen sagen, dass er ein **ungemessener Aufsatz** ist, dass die gemessene
    Kante die Regel **ohne** ihn ist, und dass in 730 Handelstagen auf dem Live-Universum
    **eine**, auf dem tatsächlich bedienten Universum **vier** abgeschlossene Pausen
    vorlagen. Der Satz *„eine Pause kostet weniger als ein Irrtum"* darf stehen bleiben —
    **als Annahme gekennzeichnet**.
12. **Unabhängig von dieser Studie zu flicken:** der **live** laufende `edgeZustand`
    (`depot.js` ~8306–8330) hat weder `c[i2] > 0` / `c[i2+H] > 0`-Prüfungen noch eine
    Obergrenze in der Driftschleife. Ein Fehldruck geht dort **ungefiltert** in `rohT` ein.
    Das ist eine offene **F1-Lücke im produktiven Wächter** und der einzige Punkt dieses
    Papiers, der sofort etwas kostet.

---

## 9. Was dieses Papier NICHT sagen darf

- **Nicht:** „Der Edge-Wächter schadet." Punktschätzer −0,1064 Pp auf einem rückschauend
  gewählten Universum, p = 0,21, informative Fallzahl **eine** abgeschlossene Episode.
- **Nicht:** „Der Edge-Wächter nützt." +0,0115 Pp auf dem Archiv, p = 0,55.
- **Nicht:** „Der Wächter greift in schlechte Strecken." Auf den 17 Live-Pausentagen lag der
  Überschuss bei +1,29 Pp — er pausierte, wo es gut lief. Das Vorzeichen dieser Aussage
  hängt am Universum, nicht an der Welt.
- **Nicht:** „delta80 = 0,268 Pp." Es sind 0,268 ± ~0,05 Pp, auf dem falschen Universum und
  auf dem Signalsatz ohne Abklingzeit gerechnet. Auf dem ehrlichen Universum (130 statt 34
  Pausentage, Episoden 21/28 statt 11/6) ist der Wert **unbekannt** — mit ~3,8-facher
  Pausenmasse eher niedriger.
- **Nicht:** „S4 ist tot." S4 war auf dem ehrlichen Universum **schätzbar** (2 Episoden,
  69 Tage). Er ist **verfehlt** (2 statt 8), nicht gegenstandslos.
- **Nicht:** „Nicht vor 2048." Gestrichen (4.3).
- **Nicht:** „Die Umstellung auf Zeitordnung ist zu teuer." +1,8 % je Durchgang. Der Grund
  gegen die Messung ist statistisch, nicht technisch.
- **Nicht:** „Der Wächter ist widerlegt und kann weg." Nichts hier widerlegt ihn. Wer ihn
  abschaltet, tut das ebenso ohne Beleg wie wer ihn anlässt.
- **Nicht:** „Die Simulation ist der Wächter." Sie spielt seine Regeln nach, mit drei
  deklarierten Abweichungen (Auflage 9), ohne `edgePauseHand`.

---

## 10. Empfehlung

| | |
|---|---|
| **Haken bauen?** | **Ja** — mit den drei Korrekturen aus 5.2 und der BEFREIUNGS-Prüfung. +1,8 % je Durchgang, das Zeitachsen-Muster liegt in `baueQuerschnitt` fertig vor, und er räumt eine ganze Fehlerklasse ab. |
| **Edge-Wächter damit messen?** | **Nein.** 2 statt 8 Entdeckungs-, 2 statt 15 Bestätigungs-Episoden; das Orakel derselben Episodenform erreicht die Schwelle nicht (0,1830 gegen 0,2006 Pp); und das Universum des Entwurfs war rückschauend gewählt. |
| **Edge-Wächter deklarieren?** | **Ja.** Als ungemessener Aufsatz, mit der Fallzahl daneben. |
| **Was der Haken sofort bringt** | Die Test-Invariante „Live = Messung" wird zum ersten Mal **prüfbar** statt versprochen. |
| **Der eigentliche Fund** | **Z8** — ein rückschauend gewähltes Zustandsuniversum. Es hat aus vier abgeschlossenen Episoden eine gemacht, aus 69 Entdeckungs-Pausentagen null, und daraus eine falsche Erlaubnis, die Bestätigungshälfte anzusehen. Der Vorgriffsschutz der Architektur greift für den Ergebnisstrom und **nicht** für die Symbolauswahl — das ist die Lücke, die dieses Papier schließt. |

Und ein Nebenfund, der über den Zustandshaken hinausgeht: **die Maschine prüft ihren
Nullpunkt (SP), aber nie ihre Empfindlichkeit — und wo sie es tut, mit der falschen Form.**
Eine positive Kontrolle in der **Form des geprüften Gatters** kostet einen Durchgang und
sagt, ob das Geschirr überhaupt hören kann. Bei 34 von 38 strukturell blinden Messungen
wäre das die billigste Warnlampe gewesen, die es gibt.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
