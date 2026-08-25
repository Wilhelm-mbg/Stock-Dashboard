# Entwurf — Rang 3: Einstiegskonvention

**Stand 25.08.2026. Entwurf, keine Vorregistrierung.** Wer daraus eine Vorregistrierung
macht, kopiert die Abschnitte 4–9 unverändert und datiert sie, bevor der erste
Maschinenlauf startet.

---

## 0. Kurzfassung

Die Maschine steigt zum Schluss derselben Kerze ein, aus der das Signal gebildet wird
(`messmaschine.js`, `var s0 = b[i][1]`, an vier Stellen: Signalschleife Z. 788,
Kontrolltopf Z. 223, Querschnitts-Kontrolle Z. 511, Placebo Z. 471). Der Fehlerkatalog
deckt den Ausstieg ab (C6, C7), den Einstieg keine Zeile.

Ich habe die Größe, um die es geht, während des Entwurfs auf **beiden vollen Archiven**
ausgezählt. Ergebnis in drei Sätzen:

1. **Innerhalb der Sitzung ist die Lücke null** — und zwar mit einer Auflösung, die
   nichts zu wünschen übrig lässt: −0,000054 Pp auf 11.818.797 Fällen, 95-%-Grenze
   ±0,00068 Pp. Das ist ein Fünfhundertstel der Kostenhürde. In 20,78 % der Fälle ist
   `Eröffnung[i+1]` **bitgleich** `Schluss[i]`.
2. **An der Sitzungsgrenze ist sie es nicht** — +0,0554 Pp im Mittel, und vor allem: die
   Streuung je Fall springt von 0,1209 Pp auf 1,7652 Pp, **Faktor 14,6** (Varianz 213).
   Auf 1d, wo jede Kerze eine Sitzungsgrenze ist, +0,0318 Pp mit t = 5,27.
3. **Die Sitzungsgrenze ist nicht „Position 6".** 0,40 % aller Symbol-Handelstage haben
   weniger als sieben Kerzen; dort liegt die letzte Kerze auf Position 3, 4 oder 5. Wer
   nach Position schichtet, wirft 24.395 Grenzfälle in den Innentopf — und das reicht,
   um Position 4 von +0,0016 Pp auf −0,0058 Pp zu ziehen und ihren Standardfehler um
   Faktor 7,3 aufzublähen.

Damit ist die Studie **nicht** die Studie, die im Plan stand. Der Vorbefund („L innerhalb
der Sitzung exakt null, die Lücke sitzt auf Position 6") stimmt in der Richtung und ist in
der Abgrenzung falsch. Und beim Nachlesen im Code sind **drei Fehler in der
S9-Zeile selbst** aufgefallen, die schwerer wiegen als die Frage, die sie beantworten
sollte (Abschnitt 2).

Der Entwurf trennt deshalb sauber:

- **Zweig E — Eichung des Lineals.** Drei Endpunkte, alle entscheidbar, zwei davon
  bereits entschieden. Kein Kandidat, keine Marktaussage, keine
  Entdeckung/Bestätigung-Trennung.
- **Zweig W — Werkzeugbau.** Ein Einstiegs-Schalter, dessen Richtigkeit gegen eine
  **geschlossene Vorhersage** geprüft wird, nicht gegen „sieht plausibel aus".
- **Zweig N — Neubewertung.** Acht 60m-Protokolle werden neu gemessen. **Kein Urteil
  darf dadurch nach oben.** Das ist die eigentliche Gefahrenstelle (Abschnitt 12).

---

## 1. Was ich im Repo nachgelesen habe

| Datei | wofür |
|---|---|
| `studien/messmaschine/messmaschine.js` (1.085 Z.) | Einstieg, Kontrolltopf, Querschnitt, Placebo, S9-Zeilen |
| `studien/messmaschine/FEHLERTYPEN.md` | A6/A7/A9, B9/B10, C6/C7, F1–F4, SP |
| `studien/messmaschine/strategien/*.js` (11 Verträge) | liest das Signal `close[i]`? |
| `quant.js` Z. 1720 ff. (`einstiegSignal`) | `var spot = bars[ci][1]`, `win = bars.slice(…, ci+1)` |
| `studien/messmaschine/protokolle/*-2026-08-25.json` (11 Läufe) | echte Signalzahlen, Sitzungspositionen, S9-Werte |
| `studien/PLAN-NAECHSTE-STUDIEN.md`, `studien/STUFE0-ERGEBNIS.md` | Vorbefund und dessen Herkunft |

Eigene Auszählskripte und ihre Rohausgaben liegen neben diesem Entwurf unter
`studien/entwuerfe-2026-08-25/mess-skripte/`:

| Datei | was sie tut |
|---|---|
| `inv.js` | Archiv-Inventur: Dateien, Kerzen, Eröffnungskurs-Abdeckung, Positionshistogramm, Stempel-Kerzen |
| `luecke.js` | Lücke je Sitzungsposition, erste Fassung |
| `luecke2.js` | dieselbe über das volle Universum, mit Querschnitts-Residuum |
| `luecke3.js` | **die maßgebliche**: Schichtung nach `Position[i+1] === 0` statt nach Position 6 |
| `out60m.json`, `out60m_grenze.json`, `out1d_grenze.json` | die Rohausgaben, aus denen jede Zahl dieses Entwurfs stammt |

Aufruf: `node luecke3.js <60m|1d> <Dateigrenze, 0 = alle> <Vorlauf>`.
Jede Zahl in diesem Entwurf ist mit `0` (volles Archiv) und Vorlauf `261` entstanden.

---

## 2. Drei Befunde, die den Entwurf verändert haben

### Befund 1 — S9 zentriert gegen den falschen Topf

`einstiegsluecke.universumMittel` (Z. 735–753) mittelt die Lücke über **alle Kerzen**
des Universums, ohne nach Sitzungsposition zu schichten. Da die Lücke an der Grenze
1.000-mal so groß ist wie innen, ist dieser gepoolte Mittelwert (60m: +0,0079 Pp) für
jede Strategie falsch, deren Signale ungleich über die Positionen verteilt sind.

Gemessen, mit der positionsgeschichteten Basis aus dem vollen 60m-Archiv:

| Strategie | Anteil Grenze | S9-Wert heute | richtig geschichtet | Verschiebung |
|---|---|---|---|---|
| `t1` V0 | 99,9 % | −0,0720 Pp | **−0,1195 Pp** | −0,0475 Pp (**40 % des Werts**) |
| `t1` V2 | 99,9 % | −0,2381 Pp | **−0,2855 Pp** | −0,0474 Pp |
| `rsi2seit`, `rsi2seit-mcp` | 36,4 % | +0,0284 Pp | **+0,0162 Pp** | −0,0122 Pp (**43 %**) |
| `t3` V0 | 20,2 % | +0,0074 Pp | +0,0041 Pp | −0,0033 Pp |
| `winkelgrad` V0 | 14,1 % | +0,0008 Pp | +0,0015 Pp | +0,0007 Pp |
| `kapitulation` V0 | 10,0 % | −0,0299 Pp | −0,0269 Pp | +0,0030 Pp |

Bei gleichverteilten Positionen (`winkelgrad`, `winkelbestaetigt`) ist der Fehler
belanglos; bei `t1` beträgt er 40 % der gemeldeten Zahl. Das ist genau die Bauart von
**F3** — dort war es die UTC-Stunde statt der Sitzungsposition, hier die fehlende
Schichtung nach derselben Achse.

### Befund 2 — „Sitzungsgrenze" ist nicht „Position 6"

Kerzen je Symbol-Handelstag im vollen 60m-Archiv (2.061.641 + 31.531 = 2.093.172
Symbol-Tage nach Vorlauf):

| Kerzen am Tag | 7 | 4 | 6 | 5 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| Symbol-Tage | 2.061.641 | 21.932 | 2.992 | 2.478 | 504 | 363 | 262 |
| Anteil | 99,60 % | 1,05 ‰ | 0,14 ‰ | 0,12 ‰ | – | – | – |

Von 1.980.534 Grenzfällen liegen 24.395 (1,23 %) **nicht** auf Position 6, davon 20.289
auf Position 3 (verkürzte Handelstage, Mittel −0,2573 Pp bei sd 1,526 Pp).

Was das kostet, wenn man nach Position schichtet statt nach „letzter Kerze des Tages":

| Position | Mittel nach Position | Mittel richtig (nur innen) | se nach Position | se richtig |
|---|---|---|---|---|
| 3 | −0,00156 Pp | +0,00159 Pp | 0,00159 | 0,00093 |
| 4 | **−0,00581 Pp** | **+0,00161 Pp** | **0,00437** | **0,00060** |

Das Vorzeichen kippt und der Standardfehler wächst um Faktor 7,3 — aus 0,4 ‰ der Tage.
Richtige Kennung: `GRENZE[i] := (Sitzungsposition[i+1] === 0)`.

### Befund 3 — der S9-Warntext gilt nur unter einer Bedingung, steht aber unbedingt da

S9 schreibt: *„Diesen Teil kann ein Einstieg zum Schluss nicht mitnehmen."* Das ist nur
richtig, wenn die Strategie `close[i]` **liest** — dann kennt sie ihr Signal erst, wenn der
Kurs schon Geschichte ist. Liest sie ihn nicht, ist der Schluss-Fill eine gewöhnliche
MOC-Order, die Lücke liegt **innerhalb** des Handels, und die Warnung ist ein Fehlalarm.

Nachgelesen, Strategie für Strategie:

| Strategie | liest `close[i]`? | Beleg |
|---|---|---|
| `kapitulation`, `rsi2seit`, `rsi2seit-mcp` | **ja** | `quant.js:1721` `spot = bars[ci][1]`, `win = bars.slice(…, ci+1)`; dazu Volumenbestätigung der Signalkerze |
| `t1-zwangsglattstellung` | **ja** | `c.tagRet[j]` = Tagesrendite bis `close[i]` |
| `t2-umsatzschock` | **ja** | `var pi = bars[i][1]`, Bedingung `pi/pa − 1 ≥ 0` |
| `t3-stundendrift` | **ja** | `stundenDrift` nutzt `folgeRet[idx]` bis `idx+1 = i` |
| `winkelbestaetigt`, `winkelgrad` | **ja** | `kanalUeber(bars, …, i)` |
| `momentum` | **nein** | Merkmal nur `bars[i−231][1]` und `bars[i−21][1]`; Signal nur der Rang |
| `monatswende-breit` | **nein** | nur `bars[i][0]` (Kalender) und `bars[i−1][0]` |
| `quartalsschub-betrag` | **nein** | nur `bars[i−1][1]`, `bars[i−1−64][1]` und die Zeitstempel |

**Acht von elf lesen `close[i]` — alle acht auf 60m. Null von drei auf 1d.**

Und daraus folgt eine Korrektur am Kopfbefund von `STUFE0-ERGEBNIS.md`: die Zeile
*„`quartalsschub-betrag` kauft die Meldungslücke nicht, es ist die Meldungslücke"* trägt
nicht. Der Detektor liest `close[i]` nicht; alles, was er braucht, steht am Vortagesschluss
und im Kalender, also spätestens zur Eröffnung von Tag i fest. Eine MOC-Order auf Tag i
ist zulässig, und die Lücke danach liegt im Handel. Dazu kommt: der Nenner des
„106 %"-Verhältnisses ist **+0,1843 Pp bei MDE 0,3978 Pp** — selbst nicht messbar. Ein
Verhältnis zu Rauschen ist kein Befund. (Der Zähler dagegen ist gut gemessen:
+0,1928 Pp bei se 0,0306, t = 6,3. Die Aussage, die trägt, lautet: *der Ertrag dieses
Detektors liegt über Nacht* — nicht *er ist nicht handelbar*.)

---

## 3. Eichung oder Kandidatenprüfung?

**Beides, mit verschiedenen Schwellen — und das muss vorab getrennt werden, sonst
wandert die Beweislast an die falsche Stelle.**

**Zweig E ist eine Eichung.** Gemessen wird eine Eigenschaft des Archivs und der Maschine,
kein Marktmechanismus. Es gibt nichts, wogegen eine zurückgehaltene Hälfte schützen
würde: L ist nicht durchsucht, es gibt keine Variantenwahl, die man optimieren könnte,
und die Vorab-Tore S4/S5 greifen nicht (sie regeln, wann eine **Kandidatenhälfte**
angefasst werden darf). Die richtige Form ist der **Äquivalenztest** — „ist das klein
genug, um folgenlos zu sein" — nicht der Signifikanztest. Bei 11,8 Millionen Fällen ist
jede noch so belanglose Abweichung signifikant; Signifikanz ist hier die falsche Frage.

**Zweig N ist eine Kandidatenprüfung mit umgekehrter Beweislast.** Das Neumessen der acht
60m-Strategien ist ein zweiter Blick auf **verbrauchte** Bestätigungshälften. Es darf
deshalb nur nach unten wirken. Die Konvention wird **nicht** gewählt, weil sie besser
aussieht, sondern von einer mechanischen Eigenschaft bestimmt (`signalNutztSchlussKerzeI`).
Details in Abschnitt 8 und 12.

**Zweig W ist Werkzeugbau, kein Test.** Er wird gegen eine geschlossene Vorhersage
geprüft (Abschnitt 7c).

---

## 4. Frage

**E1.** Kostet die Konvention „Einstieg zum Schluss der Signalkerze" **innerhalb** einer
Sitzung etwas, das eine Handelsentscheidung berühren könnte?

**E2.** Kostet sie etwas **an der Sitzungsgrenze** — auf 60m (Position 6 bzw. letzte Kerze
des Tages) und auf 1d (jede Kerze)?

**E3.** Muss die Maschine die Sitzungsgrenze überhaupt als eigene Schicht führen, oder
reicht die Sitzungsposition?

**N.** Um wie viel verschiebt sich der gemessene Überschuss jeder live laufenden
60m-Strategie, wenn sie zum ersten handelbaren Kurs nach dem Signal gefüllt wird statt
zum Signalkurs — und ändert das ein Urteil?

---

## 5. Datenbasis, gezählt

### 5.1 `E:/Markt-Dashboard-Archiv/archiv60m`

| Größe | Wert |
|---|---|
| Dateien `bars_60m_*.json` | 2.887 |
| davon benutzbar | **2.873** |
| nach F1 verworfen (Sprung > +400 %/< −80 % oder Kurs > 100.000 $) | 11 |
| zu kurz (< Vorlauf + 3) | 1 |
| Zeitraum | 2023-09-26 bis 2026-08-24 |
| Kalendertage mit Handel | 730 |
| Lückenfälle nach Vorlauf 261 | **13.799.331** |
| davon ohne echten Eröffnungskurs | **0** (Abdeckung 100,000 %) |
| Reihen, deren letzte Kerze eine Stempel-Kerze ist (Vol 0, o=h=l=c) | **2.873 von 2.873** — alle, ausgeschlossen |

Schichtung nach `GRENZE[i] := (Position[i+1] === 0)`:

| Schicht | Fälle | Handelstage | Fälle/Tag |
|---|---|---|---|
| INNEN | **11.818.797** | 693 | 17.054 |
| GRENZE | **1.980.534** | 692 | 2.862 |

### 5.2 `E:/Markt-Dashboard-Archiv/archiv1d`

| Größe | Wert |
|---|---|
| Dateien | 2.966 |
| benutzbar | **2.907** |
| nach F1 verworfen | 58 |
| Handelstage (Kalendertage mit Kerzen) | 9.814, zurück bis 1986 |
| Lückenfälle nach Vorlauf 261 | **14.456.629** |
| ohne echten Eröffnungskurs | **0** |
| letzte Kerze Stempel | 8 |
| Kerzen je Tag | ausnahmslos 1 → jede Kerze ist GRENZE |

### 5.3 Was **nicht** in der Datenbasis ist

Die 1.037 delisteten Reihen mit Kursen
(`Markt-Dashboard-Daten/massive/tagesdaten/*.json`) haben **fünf** Spalten
`[ms, schluss, volumen, hoch, tief]` — **keinen Eröffnungskurs**. Diese Studie kann über
delistete Werte grundsätzlich nichts sagen (E1: Überlebensverzerrung, hier unheilbar,
weil die Größe im Datensatz fehlt).

---

## 6. Vorab-Einteilungen

Vor jedem Urteil festgelegt, keine nachträglichen Ausschlüsse (B7):

1. **Zeitrahmen:** 60m und 1d getrennt, nie gepoolt.
2. **Schicht:** `GRENZE` gegen `INNEN`, definiert über `Position[i+1] === 0`.
   **Nicht** über Position 6 (Befund 2).
3. **Sitzungsposition** als zweite Achse *innerhalb* der Schicht, für die
   Basisgewichtung der S9-Zeile.
4. **Ausschlüsse, abschließend:** F1-kaputte Reihen; die abschließende Stempel-Kerze
   jeder Reihe; Kerzen ohne echten Eröffnungskurs (gemessen 0, die Regel steht trotzdem);
   Vorlauf 261 Kerzen (A9 — dieselbe Grenze wie die Signalschleife).
5. **Kein Halbierungsschnitt für Zweig E**, begründet: L ist eine mechanische Eigenschaft
   des Archivs, keine durchsuchte These; es gibt keine Auswahl, gegen die eine
   zurückgehaltene Hälfte schützen könnte. **Aber:** L wird je Hälfte **berichtet**. Kippt
   das Vorzeichen zwischen den Hälften, gilt der Wert als instabil und trägt kein Urteil.
6. **Zweig N** erbt den Schnitt der jeweiligen Strategie (60m: 2025-03-12) unverändert.

---

## 7. Endpunkte

### 7a. Zweig E — drei Endpunkte

| # | Endpunkt | Definition |
|---|---|---|
| **E1** | `L_innen` | Tagesmittel von `Eröffnung[i+1]/Schluss[i] − 1` über alle INNEN-Kerzen, 60m |
| **E2** | `L_grenze,1d` | dasselbe über alle 1d-Kerzen |
| **E3** | `Q = sd(GRENZE)/sd(INNEN)` je Fall, 60m |

**Warum nicht der Universumswert an der 60m-Grenze als vierter Endpunkt?** Weil er unter
der A7-Kontrolle strukturell nicht entscheidbar und unter der Querschnitts-Kontrolle
identisch null ist. Gemessen: +0,05543 Pp, se 0,02447, t = 2,27 — unter der Schwelle. Der
Grund ist keine zu kleine Stichprobe (1,98 Mio. Fälle), sondern der **gemeinsame
Marktfaktor**: von der Streuung der Tagesmittel (0,6437 Pp) sind 0,6430 Pp marktweit und
nur 0,0007 Pp mitteln sich mit der Breite weg. Mehr Symbole helfen null. Der
Universumswert an der 60m-Grenze ist deshalb **Basisgröße für die Zentrierung**, kein
Endpunkt — und das steht vorab hier, nicht hinterher als Ausrede.

### 7b. Zweig N — je Strategie und Variante

`Δ := Ü(Einstieg Schluss[i]) − Ü(Einstieg Eröffnung[i+1])`, gepaart aus zwei
Maschinenläufen auf denselben Signalen, mit **derselben** Kontrolle, demselben Placebo und
derselben B10-Korrektur (H−1 Verzögerungen) in beiden Läufen.

### 7c. Zweig W — die Werkzeugprobe (das eigentliche Argument für den Schalter)

Ohne Ausstiegsregel gilt exakt
`(1 + r_schluss) = (Eröffnung[i+1]/Schluss[i]) · (1 + r_offen)`,
und weil die Kontrolle mitwandert, folgt

> **Δ muss gleich der zentrierten Lücke L sein, bis auf den Kreuzterm
> `E[Lücke · r_offen]`.**

Das ist eine **geschlossene Vorhersage vor dem Lauf**. Der Schalter gilt als gebaut, wenn
für alle Zeit-Ausstiegs-Strategien `|Δ − L| ≤ 0,005 Pp`. Weicht es ab, ist der Schalter
falsch — nicht der Markt überraschend. Für `rsi2seit-mcp` (Stop-Regel) gilt die Identität
**nicht**; genau dort ist der Schalter die einzige Messmöglichkeit, und genau dort darf die
Probe nicht als bestanden gelten.

---

## 8. Erwartete MDE und delta80 — mit Rechnung

### 8.1 Die Varianzkomponenten, gemessen

Aus dem vollen Durchlauf, je Fall in Pp:

| Schicht | sd je Fall | sd der Tagesmittel | Symbole/Tag | σ_markt | σ_idio (querschnitts-zentriert) |
|---|---|---|---|---|---|
| 60m INNEN | 0,1209 | 0,0075 | 17.054 | **0,00744** | **0,1206** |
| 60m GRENZE | 1,7652 | 0,6437 | 2.862 | **0,64297** | **1,6438** |
| 1d | 1,7509 | 0,5986 | 1.473 | **0,59712** | **1,6153** |

Rechnung für σ_markt: `σ_m = √(sd_Tagesmittel² − σ_idio²/Symbole je Tag)`.
60m GRENZE: √(0,6437² − 1,6438²/2862) = √(0,41435 − 0,00094) = **0,64297**.

Damit ist der Kern des Auflösungsproblems benannt: an der Sitzungsgrenze sind **99,8 % der
Varianz der Tagesmittel marktweit**. Breite hilft dort nicht; nur die
Querschnitts-Kontrolle hilft, und nur für eine Teilmenge.

### 8.2 MDE und delta80 der drei Eichungs-Endpunkte

`se = sd_Tagesmittel/√Tage`, `MDE = 2 · se`, `delta80 = (Schwelle + 0,8416) · se`
mit Schwelle 2,394 (Bonferroni, 3 Tests):

| Endpunkt | se | MDE | delta80 | 95-%-Halbbreite (2,394·se) |
|---|---|---|---|---|
| **E1** 60m INNEN | 0,0075/√693 = **0,000285 Pp** | 0,00057 Pp | 0,00092 Pp | **0,00068 Pp** |
| **E2** 1d | 0,5986/√9814 = **0,006042 Pp** | 0,01208 Pp | 0,01955 Pp | 0,01446 Pp |
| **E3** Varianzverhältnis | 13,8 Mio. Fälle — kein p-Wert nötig | | | |

Verhältnis zur Kostenhürde (0,10 Pp): E1 löst **147-mal** feiner auf als die Hürde, E2
**7-mal**. Beide Endpunkte sind entscheidbar — das ist bei den 38 bisherigen Messungen des
Projekts vier Mal der Fall gewesen.

### 8.3 delta80 für Zweig N, je Strategie

Modell (alle Größen gemessen, nichts geschätzt):

```
Var(Tagesmittel von L) = w²·(σ_m,Grenze² + σ_idio,Grenze²/k_g)
                       + (1−w)²·(σ_m,innen² + σ_idio,innen²/k_i)
se = √(Var / Handelstage)
```
mit `w` = Anteil der Signale an der Sitzungsgrenze, `k_g`/`k_i` = Signale je Tag in der
jeweiligen Schicht. Die Signalzahlen stammen aus den Protokollen vom 25.08.2026, die
Positionsverteilung ebenfalls.

| Strategie | V | Signale | Tage | w | L (geschichtet) | se(L) | delta80 | Ü (Best.) | MDE(Ü) |
|---|---|---|---|---|---|---|---|---|---|
| `t1` | 0 | 106.902 | 661 | 99,9 % | **−0,1195** | 0,0255 | 0,0825 | −0,0040 | 0,1166 |
| `t1` | 1 | 52.134 | 661 | 99,9 % | **−0,1993** | 0,0260 | 0,0841 | −0,0086 | 0,1347 |
| `t1` | 2 | 27.651 | 661 | 99,9 % | **−0,2855** | 0,0269 | 0,0870 | +0,0293 | 0,1511 |
| `rsi2seit` | 0 | 104.905 | 692 | 36,4 % | +0,0162 | 0,0094 | 0,0304 | +0,0544 | 0,1304 |
| `rsi2seit-mcp` | 0–4 | 104.905 | 692 | 36,4 % | +0,0162 | 0,0094 | 0,0304 | +0,039…+0,060 | 0,045…0,060 |
| `t3` | 0 | 2.390.866 | 669 | 20,2 % | +0,0041 | 0,0051 | 0,0165 | +0,0018 | 0,0198 |
| `t3` | 1 | 392.882 | 669 | 23,7 % | +0,0076 | 0,0060 | 0,0194 | +0,0088 | 0,0256 |
| `t2` | 0 | 90.937 | 669 | 13,4 % | +0,0036 | 0,0039 | 0,0126 | +0,0198 | 0,1237 |
| `t2` | 1 | 31.028 | 669 | 11,9 % | +0,0167 | 0,0044 | 0,0142 | +0,0413 | 0,1669 |
| `kapitulation` | 0 | 10.783 | 647 | 10,0 % | **−0,0269** | 0,0057 | 0,0184 | +0,5346 | 0,7225 |
| `kapitulation` | 2 | 2.567 | 163 | 7,8 % | **−0,0522** | 0,0102 | 0,0330 | +1,1076 | 1,0333 |
| `winkelbestaetigt` | 0–4 | 90k–711k | ~690 | ~15,7 % | −0,003…−0,009 | ~0,0040 | ~0,013 | −0,06…−0,13 | 0,11…0,19 |
| `winkelgrad` | 0–4 | 1,3–5,5 Mio. | 692 | ~14,2 % | −0,002…+0,002 | ~0,0035 | ~0,011 | −0,04…−0,07 | 0,12 |
| `momentum` | 0–3 | 0,6–4,0 Mio. | 9.752 | 100 % | +0,021…+0,086 | ~0,0062 | 0,0200 | +0,28…+1,69 | 1,8…2,6 |
| `monatswende` | 0/1 | 579.543 | 468 | 100 % | +0,0252 / −0,0091 | 0,0277 | 0,0896 | +0,150 | 0,363 |
| `quartalsschub` | 0 | 3.490 | 1.868 | 100 % | **+0,1928** | 0,0306 | 0,0990 | +0,1843 | 0,3978 |

*(Deklarierte Näherung: die Basis stammt aus dem **ganzen** Archiv, die Strategien laufen
auf gefilterten Universen — `kapitulation` und `winkel*` auf 2.201, `quartalsschub` auf
189 Werten. Die Maschine muss die Basis **im Universum der Strategie** rechnen. Für die
Größenordnung ist die Abweichung unerheblich: die gepoolte Archivbasis 0,0079 Pp gegen die
von der Maschine im 2.201er-Universum gemessene 0,0085 Pp. Für Zweig N ist der Wert der
Tabelle eine **Vorhersage**, nicht das Ergebnis.)*

**Ablesung:**

- **Drei Zeilen sind entscheidbar und groß:** `t1` (alle drei Varianten, |L| = 0,12–0,29 Pp
  gegen delta80 0,08) und `quartalsschub` (0,193 gegen 0,099). Bei `t1` ist die Korrektur
  **größer als die MDE der Messung, die sie korrigiert.**
- **`kapitulation` ist entscheidbar und klein** (−0,027 gegen delta80 0,018), aber gegen
  einen Überschuss von 0,53 Pp belanglos.
- **Der Rest liegt unter delta80** — nicht „null", sondern *nicht entscheidbar*, mit einer
  95-%-Obergrenze zwischen 0,007 und 0,035 Pp. Das reicht, um zu sagen: die Verschiebung
  bleibt unter einem Drittel der Kostenhürde.
- **Nur `winkelgrad`** hält die scharfe Marge von 0,010 Pp mit der oberen Grenze ein.

---

## 9. Entscheidungsregel — VORAB

### Zweig E

> **E1 (Äquivalenz).** Innerhalb der Sitzung gilt die Schluss-Konvention als folgenlos,
> wenn das 95-%-Intervall von `L_innen` **ganz** innerhalb von ±0,010 Pp liegt (= 10 % der
> Kostenhürde 0,10 Pp). Liegt es nicht ganz darin, ist das Ergebnis „nicht entscheidbar" —
> **nicht** „Effekt vorhanden".
>
> **E2 (Vorzeichen).** Die Übernachtlücke auf 1d gilt als von null verschieden, wenn
> `|t| ≥ 2,394` **und** `|L| ≥ MDE`. Sonst „nicht entscheidbar".
>
> **E3 (Schichtungspflicht).** Die Sitzungsgrenze wird als eigene Schicht geführt, wenn
> `sd(GRENZE) ≥ 3 · sd(INNEN)` je Fall. Sonst reicht die Sitzungsposition.

### Zweig N — die Konvention wird **nicht** gemessen, sondern abgeleitet

> Jede Strategiedatei erklärt `signalNutztSchlussKerzeI: true|false`. Die Maschine
> **verweigert** ohne dieses Feld (es gibt keinen konservativen Vorgabewert: bei `t1`
> hilft die Korrektur, bei `quartalsschub` schadet sie).
>
> `true` → `einstieg: 'folgeEroeffnung'`, zwingend.
> `false` → `einstieg: 'schluss'`, zulässig (MOC/LOC ist real und hochliquide).
>
> **Der Schalter ist nie frei wählbar und wird nie danach gesetzt, welcher Lauf besser
> aussieht.** Er steht im Protokoll (D3).

### Zweig N — was die Neumessung ändern darf

> **Nach unten: alles. Nach oben: nichts.**
>
> Die acht 60m-Strategien laufen auf **verbrauchten** Bestätigungshälften (`rsi2seit` am
> 23., 24. und 25.08.). Ein Urteil darf durch die Neumessung von „belegt" auf „nicht
> entscheidbar" oder „widerlegt" fallen. Es darf **nicht** steigen. Eine Strategie, deren
> korrigierter Wert vielversprechend aussieht, geht zurück in den Entdeckungsstapel und
> braucht **frische** Bestätigungstage.
>
> Konkret vorhergesagt, damit es nachher nicht wie ein Fund aussieht: `t1` V0 springt von
> Ü = −0,0040 Pp (t −0,07) auf **≈ +0,1155 Pp**, bei se 0,0583 also **t ≈ 1,98**. Das
> liegt unter seiner eigenen Bonferroni-Schwelle (7 Tests → 2,690) und bleibt „nicht
> entscheidbar". **Sollte es die Schwelle überschreiten, gilt es trotzdem nicht.**
> `rsi2seit-mcp` V4 fällt von +0,0597 auf ≈ +0,0435 Pp, t von 2,00 auf ≈ 1,46 — die
> Korrektur wirkt dort nach unten.

### Werkzeugprobe

> Der Schalter gilt als richtig gebaut, wenn für jede Zeit-Ausstiegs-Strategie
> `|Δ − L| ≤ 0,005 Pp` und der Placebo unter **beiden** Konventionen dasselbe liefert
> (Differenz unter seiner eigenen Auflösung). Sonst wird nichts neu gemessen, bis der
> Schalter stimmt.

---

## 10. Testzahl und Schwelle

**Testzahl: 3** — E1, E2, E3. Das ist die vollständige Familie des Eichungszweigs;
sie steht als `testfamilie.testsGesamt = 3` in der Messdatei (B8).

**Schwelle: |t| ≥ 2,394** (zweiseitig, α = 0,05/3).

**Was ausdrücklich *keine* Tests sind, und warum:**

- Die 26 Strategie-Varianten des Zweigs N. Sie erzeugen kein Urteil: die Konvention steht
  vorher fest, und die Neumessung darf nur nach unten wirken. Berichtet werden
  Punktschätzer und 95-%-Intervall, ohne Sterne.
- Die Werkzeugprobe. Sie prüft eine geschlossene Vorhersage gegen eine feste Toleranz.
- Die Sitzungspositions-Aufschlüsselung (7 Positionen × 2 Schichten). Sie ist beschreibend
  und darf **nicht** dazu benutzt werden, eine „auffällige Position" zu melden — das wäre
  **B9** in Reinform. Wer eine Positionsaussage will, meldet sie als neuen Test an.

---

## 11. Auflagen

1. **Vier Stellen, ein Schalter.** `s0` wird in Signalschleife (Z. 788), Kontrolltopf
   (Z. 223), Querschnitts-Kontrolle (Z. 511) und Placebo (Z. 471) **gleichzeitig** gesetzt.
   Kein zweiter Prüfstand, keine Nachbildung der Kontrolle (D1).
2. **`eroeffnungKurs()` bekommt einen strengen Modus.** Unter `folgeEroeffnung` darf sie
   **nicht** still auf `bars[k−1][1]` zurückfallen — das setzt L mechanisch auf null. Fehlt
   der Eröffnungskurs, fällt das Signal aus und wird gezählt (F4-Zeile, Warnung über 2 %).
   Gemessen sind heute 0 solche Fälle in beiden Archiven; die Regel steht für das nächste
   Archiv.
3. **Ausstieg bleibt unverändert** bei `Schluss[i+H]`, vorregistriert und begründet: sonst
   ändern sich Einstiegskonvention *und* Ausstiegsuhr gleichzeitig, und Δ ist nicht mehr
   die Lücke. Folge, die ausgesprochen gehört: unter `folgeEroeffnung` hält der Handel
   H Kerzen **minus die Lücke**. Bei H = 1 ist es genau die Kerze i+1 ohne ihre Eröffnungslücke.
4. **Stop-Pfad** beginnt weiter bei Kerze i+1; die erste Kerze trägt kein Stop-Niveau
   (C6 bleibt unberührt). Die Füllung bleibt „der schlechtere aus Stop und erstem
   handelbaren Kurs" (C7).
5. **A7/F2 unverändert:** der Kontrollausschnitt beginnt weiter bei `i − Fenster − H`.
6. **B10:** L selbst hat H = 1 und braucht keine Newey-West-Korrektur; Δ erbt H der
   Strategie und wird mit H−1 Verzögerungen gerechnet. Δ wird aus den **beiden Läufen**
   gebildet, nicht aus der Lücke — die Lücke ist die Vorhersage, nicht die Messung.
7. **Placebo mit der richtigen Zellstruktur.** Der Placebo-Schritt muss die Verteilung der
   Strategie über `(GRENZE-Flag × Sitzungsposition)` nachbilden, nicht nur über die
   Position. Ein gleichverteilter Placebo hat an der Grenze zu wenig Gewicht und besteht
   deshalb immer — er prüft dann nichts. Der Placebo läuft unter **beiden** Konventionen;
   die Differenz muss null sein.
8. **Basis im eigenen Universum.** Die S9-Basis wird über das Universum **dieser** Messung
   gerechnet, nicht über das ganze Archiv.
9. **S9-Zeile:** Basis geschichtet nach `(GRENZE × Position)`, gewichtet mit der
   Signalverteilung; Grenzkennung `Position[i+1] === 0`; der Warntext wird
   konditionalisiert auf `signalNutztSchlussKerzeI === true`.
10. **Kleiner Nebenfehler mitnehmen:** `lueckeN` zählt heute auch Signale, die später
    mangels Kontrolle ausfallen (`messmaschine.js` Z. 785 vor dem `erw == null continue`).
    Gemessen ist der Unterschied belanglos (≤ 0,12 %, `momentum`), aber Lücke und
    Überschuss sollen über **dieselbe** Signalmenge gemittelt werden.
11. **Pflichtzeilen im Protokoll:** Anteil bitgleicher Fälle (60m INNEN 20,78 %,
    60m GRENZE 2,22 %, 1d 10,28 %), Anteil Signale ohne echten Eröffnungskurs, Anteil
    Signale an der Sitzungsgrenze, Zahl der verkürzten Handelstage im Universum.
12. **Testfall nach C6/C7-Muster** in `test-messmaschine.js`: zwei Kunstarchive mit
    identischen Schluss-, Hoch- und Tiefkursen und einer **gesetzten** Eröffnungslücke von
    z. B. 0,50 Pp; die gemessene Differenz Δ muss die gesetzte Lücke sein. Dazu ein
    Testfall, der ein Archiv **ohne** Eröffnungskurse unter `folgeEroeffnung` füttert und
    prüft, dass die Maschine verweigert statt zurückzufallen.
13. **Neuer Katalogeintrag C8** in `FEHLERTYPEN.md`:
    *„Einstieg zum Schluss der eigenen Auslösekerze. Ein Signal, das `close[i]` liest, kann
    nicht zu `close[i]` gefüllt werden. Vorkommen 25.08.2026: acht von elf Strategien; bei
    `t1` verschiebt die Korrektur den Überschuss um 0,12 Pp — mehr als die MDE derselben
    Messung. Was die Maschine tut: `signalNutztSchlussKerzeI` ist Pflichtfeld; ohne es
    verweigert sie."* Dazu ein Satz zur Abgrenzung: *„Die Grenze ist die letzte Kerze des
    Handelstags, nicht Position 6 — 0,40 % der Symbol-Tage sind kürzer."*

---

## 12. Die größte Gefahr: die Konvention als verdeckter Mehrfachtest (B9/B4)

Das ist der Fehlertyp, an dem diese Studie am ehesten scheitert, und er ist nicht
theoretisch — er ist in den Zahlen schon angelegt.

Die Korrektur wirkt **nicht** einheitlich nach unten. Bei `t1` hebt sie den Überschuss um
0,12 Pp an und schiebt t von −0,07 auf ≈ 1,98. Wer 26 Varianten unter zwei Konventionen
rechnet, hat 52 Zahlen und darf sich aus jeder Zeile die freundlichere aussuchen. Das ist
exakt B9 („jede willkürliche Lage ist ein Test") mit einem besonders guten Vorwand: *die
Korrektur ist ja richtig.*

Drei Riegel, alle vorab:

1. **Die Konvention ist mechanisch bestimmt**, nicht gemessen. Ein Feld im Vertrag, eine
   Ableitung, kein Vergleich.
2. **Die alte Zahl wird zurückgezogen, nicht danebengestellt.** Es gibt je Strategie genau
   eine gültige Konvention und genau ein gültiges Protokoll. Keine „Fassung A/Fassung B".
3. **Kein Urteil nach oben auf verbrauchter Bestätigung.** Die Vorhersage aus Abschnitt 9
   steht schriftlich vor dem Lauf da, samt `t ≈ 1,98` für `t1` — damit nachher niemand,
   auch ich nicht, so tun kann, als sei das ein Fund.

Zweitgrößte Gefahr: **A9/F3 in neuer Verkleidung.** Der neue Grenzflag greift auf
`Position[i+1]` zu und schaut damit eine Kerze weiter als die Signalschleife. Das ist
zulässig (er benutzt nur den Zeitstempel, keinen Kurs), aber es ist genau die Bauart, aus
der C6 entstanden ist. Der Testfall muss zeigen, dass kein Kurswert aus i+1 in die
Signalbildung gerät.

---

## 13. Was folgt aus einem Ja

| Gefunden | Folge |
|---|---|
| E1 ja (Innensitzung folgenlos) | Die Schluss-Konvention ist für den Innersitzungs-Anteil **jeder** Strategie freigesprochen. Der Anteil steht künftig als Zahl im Protokoll. |
| E2 ja (1d-Übernachtlücke real) | Jede künftige 1d-Strategie, die `close[i]` liest, muss `folgeEroeffnung` benutzen. Die drei bestehenden tun es nicht — sie bleiben unangetastet. |
| E3 ja (Schichtungspflicht) | Grenzflag in Kontrolltopf-Schlüssel, Placebo-Zellen und S9-Basis. |
| N | Acht 60m-Protokolle neu, alte zurückgezogen. Kein Urteil nach oben. |

**Nicht neu gerechnet wird die Große Signalstudie** (3.372 Tests, 0 von 51 bestätigt).
Begründung, vorab: sie endete auf null. Eine Korrektur kann dort nur neue Kandidaten
**erzeugen**, und zwar auf vollständig verbrauchten Daten — das wäre reines
Mehrfachtesten. Wer einen Detektor daraus wiederbeleben will, misst ihn unter der
richtigen Konvention auf **frischen** Bestätigungstagen neu.

---

## 14. Was diese Messung NICHT sagen darf

1. **Nicht:** „Die Schluss-Konvention ist innerhalb der Sitzung als Marktaussage
   freigesprochen." Auf 60m ist `Eröffnung[i+1]` in **20,78 %** der Fälle bitgleich
   `Schluss[i]` — es ist derselbe Druck, eine Sekunde später. Was hier null ist, ist eine
   **Eigenschaft des Archivs**. Die echten Innersitzungs-Kosten sind Spanne und
   Marktwirkung; die stehen in `kosten.spanneBp` und sind hier nicht gemessen.
2. **Nicht:** „`Eröffnung[i+1]` ist der wahre Füllkurs an der Sitzungsgrenze." Sie ist eine
   **obere Schranke** der Füllkosten. Der Schlussauktionsdruck der letzten Minuten und der
   Nachhandel stehen in keinem der beiden Archive; die Eröffnungsauktion hat ihre eigene
   Marktwirkung, die hier ebenfalls fehlt.
3. **Nicht:** „Strategie X ist widerlegt / bestätigt." Der Konventionswechsel ändert den
   **Schätzgegenstand**, nicht die Beweislage. Auf verbrauchten Bestätigungshälften trägt
   keine Zahl ein neues Urteil nach oben.
4. **Nicht:** „Die Lücke ist eine Kante." Gemessen wird, was eine Einstiegskonvention
   kostet — nicht, ob jemand die Lücke verdienen kann. Wer sie handeln will, braucht eine
   eigene Vorregistrierung mit eigener Kostenrechnung.
5. **Nicht:** „`quartalsschub-betrag` ist ein Lückeneffekt und damit unhandelbar."
   Der Detektor liest `close[i]` nicht; MOC ist zulässig; die Lücke liegt im Handel. Und
   der Nenner des 106-%-Verhältnisses (+0,1843 Pp bei MDE 0,3978 Pp) ist selbst nicht
   messbar. Was trägt: *der Ertrag liegt über Nacht* — 0,1928 Pp bei se 0,0306.
6. **Nicht:** „Der 60m-Universumswert an der Sitzungsgrenze ist +0,055 Pp." Er ist
   +0,055 ± 0,059 Pp und damit **nicht entscheidbar**; die Ursache ist der gemeinsame
   Marktfaktor, nicht die Stichprobengröße. Er dient als Zentrierungsbasis, nie als Befund.
7. **Nichts über delistete Werte.** Deren Reihen haben fünf Spalten und keinen
   Eröffnungskurs — die Größe existiert dort nicht. Die gesamte Studie läuft auf einem
   überlebenden Universum (E1).
8. **Nichts über 1m/5m, Krypto oder Scheine.** Die Produkthürde des Standard-Scheins
   (0,23 Pp je 3 h) liegt obendrauf und wird von dieser Studie nicht berührt.
9. **Nicht:** „Die Maschine hat bisher falsch gerechnet." Für den Innersitzungs-Anteil
   jeder Strategie ist die Konvention nachweislich folgenlos. Betroffen ist der
   Grenz-Anteil, und der steht künftig als Zahl im Protokoll — bei `winkelgrad` sind es
   0,002 Pp, bei `t1` 0,12 Pp.

---

## 15. Deklarierte Abweichungen von der reinen Lehre

1. **Die Eichungszahlen standen vor der Entscheidungsregel fest.** Ich habe die Archive
   ausgezählt, bevor ich die Marge von 0,010 Pp gesetzt habe. Das ist eine Abweichung von
   „Vorregistrierung vor dem Messen" und wird hier deklariert, nicht verschwiegen. Zur
   Einordnung: E1 kommt bei −0,000054 Pp mit einer 95-%-Halbbreite von 0,00068 Pp heraus.
   Die Marge hätte auch bei 0,001 Pp (1 % der Hürde) liegen können, ohne das Ergebnis zu
   ändern — die Wahl kann das Urteil nicht getragen haben. Für Zweig N (die Maschinenläufe)
   gilt die Vorregistrierung vollständig: dort ist noch nichts gemessen.
2. **Die Basiswerte der Zweig-N-Tabelle stammen aus dem ganzen Archiv**, nicht aus dem
   Universum jeder Strategie. Sie sind eine Vorhersage; die Maschine rechnet sie neu.
3. **Der Vorbefund des Prüfers ist nicht reproduziert.** Er nannte für Position 6
   +0,2034 Pp auf 7.031 Fällen; ich messe im vollen Universum +0,0586 Pp auf 1.956.139
   Fällen. Die Zahlen beschreiben verschiedene Mengen (seine Fallzahl passt nicht zum
   Universum, 81.180/7.031 = 11,5 gegen ein Verhältnis von 6:1 in der Grundgesamtheit).
   Ich verwende meine Zahl und weise die Abweichung aus, statt sie zu glätten.
4. **Der Plan nannte „sechs 60m-Strategien und drei 1d".** Nachgezählt sind es **acht**
   60m (`winkelbestaetigt` und `winkelgrad` kamen dazu) und drei 1d, also 11 Verträge und
   26 Varianten.

---

## 16. Reihenfolge und Aufwand

| Schritt | Ergebnis | Aufwand |
|---|---|---|
| 1 | Grenzflag + geschichtete S9-Basis + konditionaler Warntext, mit Testfall | ~1 h |
| 2 | Alle 11 Protokolle mit korrigierter S9-Zeile neu erzeugen (nur Anzeige, keine Urteile) | ~1 h Rechenzeit |
| 3 | `signalNutztSchlussKerzeI` in alle 11 Verträge, Verweigerung ohne Feld | ~30 min |
| 4 | `einstieg`-Schalter an vier Stellen + strenger `eroeffnungKurs` + zwei Testfälle | ~2 h |
| 5 | **Werkzeugprobe** — `\|Δ − L\| ≤ 0,005 Pp` auf drei Zeit-Ausstiegs-Strategien | ~1 h |
| 6 | Erst wenn 5 besteht: acht 60m-Strategien neu messen, alte zurückziehen | ~3 h Rechenzeit |
| 7 | C8 in `FEHLERTYPEN.md`, Befundnotiz, Release-Notiz | ~1 h |

Schritt 1 und 2 lohnen sich **auch dann**, wenn Schritt 4 nie gebaut wird: die S9-Zeile ist
heute für die zwei Strategien falsch, bei denen sie am meisten zu sagen hätte.
