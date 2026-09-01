# Vorregistrierung: Monats-Momentum in LIQUIDER Fassung — 02.09.2026

**Geschrieben und committet, bevor das Werkzeug dieser Studie umgebaut oder ausgeführt wurde.**
Wilhelms Entscheid vom 02.09.2026, eine Sitzung, ein Lauf. Rolle: Berechnungen.

**Vorbild und Ausgangspunkt:** `studien/vorregistrierung-2026-09-02-momentum-messung/`
(Registrierung 22a0eff, Nachtrag 1 3e7d17c, Ergebnis 224f458). Die Vorbildstudie bleibt
**unverändert**; alles, was dort festgelegt ist, gilt hier wörtlich weiter. **Diese Registrierung
ändert genau eine Sache** (§3) und legt dafür einen neuen primären Endpunkt fest (§5).

## 0. Die Frage

> **Überlebt der Momentum-Effekt dort, wo man ihn kaufen kann?**

Der breite Korb der Vorbildmessung ist illiquide: **18,2 % der Korbwerte unter 5 Mio $**
Tagesumsatz, nur **24,5 % ≥ 100 Mio $**, **2,6 % ≥ 1 Mrd $** (Median Schluss × Stück über
20 Balken bis t). Die Kostenannahmen (K = 0,110 für Mega-Caps gemessen; Kassa 0,06 als Annahme
für 10.000-$-Positionen in liquiden Werten) gelten für ein Viertel bis ein Vierzigstel dieses
Korbs. Die Vorbild-Registrierung sagt in §8 ausdrücklich: *„Keine Ertragsaufteilung nach
Liquidität (wäre ein weiterer Test)."* **Genau dieser Test ist jetzt beauftragt.**

**Erwartung, gegen die gemessen wird (vor dem Lauf hingeschrieben):** Bei glockendruck starb
der Effekt im liquiden Teil (≥ 1 Mrd $: t 0,68; `wiki/kosten.md`: *„Der Effekt lebt, wo er
nicht handelbar ist."*). Die Literatur zu Momentum sagt dagegen, dass der Effekt in
Großwerten schwächer, aber vorhanden ist. **Vorhersage: der Punktschätzer fällt, das Band
wird breiter, und das wahrscheinlichste Urteil ist „nicht entscheidbar"** (§2). Wer nach dem
Lauf etwas anderes liest, lese diesen Absatz noch einmal.

## 1. Gesehene Zahlen — vollständig deklariert

Alle Zahlen der Vorbildstudie sind gesehen (`ERGEBNIS.md`, `lauf-2026-09-01-22-25.json`):

| Größe (Bestätigung, Phase 0, 79 Perioden) | Wert |
|---|---|
| Brutto-Überschuss breit | **+1,5410 Pp je Umlauf** (exakt 1,54097), se 0,7321, sd 6,507, t 2,10 |
| 95-%-Band brutto breit | [+0,106, +2,976] |
| Placebo (Zufallskorb, 165 von 1.650) | sd je Periode 1,793, se 0,202 |
| Korb / Breite im Mittel | 165 / 1.650 Werte |
| Liquiditätsprofil des breiten Korbs | ≥ 1 Mrd $ 2,6 %, ≥ 100 Mio $ 24,5 %, < 5 Mio $ 18,2 % |
| CFD-Hürde | K + F · 91,5 Nächte = 2,370 Pp |
| Verschwundene im Korb (alle 63 Lagen, 190 Perioden) | 13,1 % gegen 11,0 % im Universum, Faktor 1,19 |

**Nicht gesehen:** jede Zahl, die aus einem nach Liquidität gefilterten Korb stammt. Das
Werkzeug des Vorbilds berechnet die Liquidität je Kandidat, filtert aber nirgends und weist
keine Aufteilung aus. Der Ertrag des liquiden Korbs ist unberührt.

**Was diese Messung ist:** wie das Vorbild eine In-Sample-Messung auf gesehenen Daten mit
vorab festgelegter Entscheidungsregel — **keine Out-of-Sample-Prüfung**. Die einzige
unberührte Hälfte ist die Zukunft.

## 2. Machbarkeit — vor dem Lauf gerechnet

Die Periodenzahl bleibt **79** (Haltedauer-Falle, `wiki/aufloesungswand.md`); der Filter
ändert nichts an der Zahl der Zeitpunkte, nur an der Breite je Zeitpunkt.

**Erwarteter Standardfehler im liquiden Korb (Schätzung aus den gesehenen Zahlen):** Die
Streuung je Periode setzt sich aus der Faktorstreuung (breit: √(6,507² − 1,793²) ≈ 6,26 Pp)
und dem idiosynkratischen Rest zusammen (breit 1,79 Pp bei 165 Korbwerten). Passiert ein
Viertel des Universums den Filter (≈ 400 Werte, Korb ≈ 40), wächst der Rest um √(165/40) ≈ 2
auf ≈ 3,6 Pp; zusammen ≈ 7,2 Pp je Periode → **se ≈ 0,81**, wenn die Faktorstreuung gleich
bleibt (Großwerte streuen eher weniger; dann etwas kleiner).

| | breit (gemessen) | liquide (erwartet) |
|---|---|---|
| se je Umlauf | 0,732 | ≈ 0,8–0,9 |
| MDE (2 · se) | 1,46 Pp | ≈ 1,6–1,8 Pp |
| delta80 (1,96) | 2,05 Pp | ≈ 2,3–2,5 Pp |

**Folgerung, ehrlich:** Ein „lebt" (§5) verlangt, dass die untere Bandgrenze über null liegt —
bei se ≈ 0,85 also einen Punktschätzer über ≈ 1,7 Pp, **mehr als der breite Korb selbst hat**.
Ein „stirbt" über die Obergrenze verlangt einen Punktschätzer unter ≈ −0,9 Pp. **Dazwischen —
und dort liegt die Vorhersage — ist die Frage mit 79 Perioden nicht entscheidbar.** Schärfer
ist der **gepaarte Vergleich** (§5, Δ je Periode gegen den breiten Korb): dort hebt sich die
Faktorstreuung weitgehend auf, se_Δ ≈ 3,6/√79 ≈ **0,4 Pp**. Er sagt, ob der liquide Korb
*nachweislich schwächer* ist als der breite; er sagt nicht, ob er von null verschieden ist.

Kein Eintrittskarten-Halt (Entscheid 27.08.: etikettieren, nicht filtern). Die Machbarkeit
wird gemessen: der Wächterlauf (§10) druckt den realisierten se des liquiden Korbs **ohne**
seinen Mittelwert.

## 3. Anordnung — wie das Vorbild, mit EINER Änderung

Alles wie `studien/vorregistrierung-2026-09-02-momentum-messung/VORREGISTRIERUNG.md` §3:
Archiv `archiv1d`, Universum `WP.istAktie` + F1, letzte Kerze weg (#85), Merkmal Rendite
t−252 → t−21 (Rückblick 231, Lücke 21), **stärkste 10 %**, **63 Handelstage**, nicht
überlappend, Delisting-Ausstieg = letzter Schluss in (t, t+63], Mindestbreite 100, **Phase 0**,
Schnitt 2006-08-14, Urteil nur Bestätigung, kein Parameter-Sweep.

**Die einzige Änderung — der Korbfilter VOR der Rangbildung:**

| | Festlegung |
|---|---|
| Filter | Ein Wert ist in Periode t nur zulässig, wenn sein **Median-Tagesumsatz über die 20 Balken bis einschließlich t ≥ 100.000.000 $** ist (Schluss × Stück je Balken, Median). |
| Rechnung | **Dieselbe** wie das Liquiditätsprofil in `messen.js` (Vorbild, `periode()`: `median(Schluss × Stück, i−19..i)`) — kein Nachbau. |
| Punkt-in-Zeit | Die Liquidität wird **zum Zeitpunkt t** aus den Balken bis t gerechnet — nie mit heutigen Werten. Sonst Look-ahead und Überlebensauswahl. Nominal, ohne Inflations- oder Marktanpassung: 100 Mio $ in 2006 ist ein strengerer Filter als 2026; die Universumsgröße je Periode wird deshalb ausgewiesen (§8). |
| Schwelle | **100 Mio $ vorab gesetzt** (Auftrag), nicht gesucht. Sie wird nicht variiert. Kein zweiter Filterwert, keine Schichten. |
| Vergleichsgruppe | Der gleichgewichtete Mittelwert **aller zulässigen, also liquiden Werte** derselben Periode (Korb ist Teil davon). Begründung: Der Filter definiert das Universum; ein liquider Korb gegen einen zu 18 % illiquiden Markt würde eine Liquiditäts-/Größenprämie in die Differenz mischen und misst nicht Momentum. Nachrichtlich wird daneben der liquide Korb gegen den **breiten** Markt gedruckt (§8) — kein Urteil. |
| Rangbildung | Erst filtern, dann die stärksten 10 % **der liquiden** Werte. Der Korb wird kleiner (≈ ein Viertel), nicht der Anteil. |
| Mindestbreite | 100 liquide Werte je Periode; darunter fällt die Periode aus und wird gezählt. |

Kein geteilter Kurs: das Merkmal endet bei t−21, der Filter nutzt Schluss × Stück bis t, die
Zielgröße beginnt bei t. Der Filter enthält den Schluss an t, der Einstiegskurs ist derselbe
Schluss — der Filter fragt aber nach der **Höhe des Umsatzes**, nicht nach der Lage des
Schlusses; Umsatz bedingt nicht auf Vorzeichen der Folgerendite (Lehre „geteilter Kurs" aus
`wiki/fehlerformen.md` greift, wo die *Auswahl* nach der Lage des Schlusses fragt; hier nicht).

## 4. Kosten — unverändert, je Gefäß, K + F·H

Wie Vorbild §4: CFD gehebelt K + F · Kalendernächte (0,110 + 0,0247 · Nächte, je Periode aus
dem Kalender), CFD ungehebelt K, Kassa 0,06 **ANNAHME**. Etiketten unverändert. **Neu ist nur,
dass die Etiketten hier besser passen:** K ist für Mega-Caps gemessen, die Kassa-Annahme für
liquide Werte — im liquiden Korb gilt beides für den ganzen Korb, nicht für ein Viertel. Das
macht die Annahme nicht zum Messwert (kein Broker-Konto), aber es beseitigt den dritten
Vorbehalt des Vorbild-Ergebnisses (*„für ein Fünftel des Korbs sicher nicht"*).

## 5. Endpunkte, Testzahl, Schwellen, Entscheidungsregeln

### Primärer Endpunkt (einer): der BRUTTO-Effekt im liquiden Korb

`brutto_liq_p` je Bestätigungsperiode bei Phase 0, gemittelt; se aus der gewöhnlichen
Streuung der Perioden (nichts überlappt); 95-%-Band `Mittel ± 1,96 · se`. Verglichen mit dem
breiten Wert **+1,541 Pp** (Vorbild). Dazu, vorregistriert als **Hilfsgröße für die
Sterbe-Regel:** das **gepaarte Δ_p = brutto_liq_p − brutto_breit_p** über dieselben Perioden
(Paarung nach Starttag), Mittel, se, 95-%-Band.

**Bezugsgröße „die Hälfte": 0,770 Pp je Umlauf** (50 % von 1,541). Begründung, vor dem Lauf:
Unterhalb der Hälfte ist die Kassa-Frage — die einzige, an der die Arithmetik im Vorbild
aufgehen konnte — für Jahrzehnte hinter der Auflösungswand: eine Kante von 0,77 Pp braucht
bei se 0,73 rund 79·(2,05/0,77)² ≈ **560 Perioden ≈ 140 Jahre**. Oberhalb der Hälfte bleibt sie
eine offene Frage. 50 % trennt also *„offen"* von *„für uns geschlossen"*, nicht *„gut"* von
*„schlecht"*.

**Regeln, in dieser Reihenfolge geprüft (die drei schließen sich gegenseitig aus):**

| Urteil | Bedingung |
|---|---|
| **LEBT** | untere 95-%-Grenze von brutto_liq **> 0** **und** Punktschätzer brutto_liq **≥ 0,770 Pp** |
| **STIRBT** | obere 95-%-Grenze von brutto_liq **< 0,770 Pp** (selbst optimistisch weniger als die Hälfte) **oder** obere 95-%-Grenze des gepaarten Δ **< −0,770 Pp** (liquide nachweislich um mehr als die Hälfte schwächer als breit) |
| **NICHT ENTSCHEIDBAR** | sonst — dann werden delta80, MDE und die nötige Periodenzahl für beide Richtungen genannt |

Die Sterbe-Regel hat zwei Wege; beide sind Obergrenzen-Regeln (Haus-Logik aus
`studien/OBERGRENZEN-BEFUND.md`). Ihr gemeinsames Fehlurteil-Risiko gegen eine wahre Kante
von genau 0,770 ist ≤ 5 % (2 × 2,5 %) und wird so ausgewiesen. Ein „LEBT" ist ein
**In-Sample-LEBT** auf gesehenen Perioden und wird so etikettiert; es ist keine Aussage über
Netto-Ertrag.

**Testzahl: 1** in dieser Registrierung. **Familie:** Momentum-Familie der Maschine (4
Varianten) + Vorbildmessung + diese = **6 Prüfungen derselben Sache → Bonferroni |t| ≥ 2,638**
(zweiseitig 0,05/6). Sie gilt für jede **JA-Behauptung** über Netto-Ertrag (§5b); für die
Band-Regeln oben wird das 95-%-Band (1,96) benutzt wie im Vorbild (dort NEIN über die
1,96-Obergrenze), und die 2,638-Grenzen werden daneben gedruckt. Die 63 Rasterlagen sind
Streubild, keine Tests.

### 5b. Gefäße — wie Vorbild, nachrichtlich zum Vergleich

Dieselben Regeln wie Vorbild §5 (JA / NEIN / nicht messbar / nicht entscheidbar) formal auf
den liquiden Korb angewendet, **mit Familienschwelle 2,638**: CFD gehebelt (Hürde K + F·Nächte̅),
CFD ungehebelt (0,110), Kassa (0,060 — **ANNAHME**). Alle drei Zeilen stehen in derselben
Tabelle wie das Urteil und der Placebo. **Kein eigenes Urteil dieser Studie** — die CFD-Frage
ist im Vorbild beantwortet („nicht entscheidbar", NEIN erst in 60 Jahren); hier wird nur
gezeigt, wie die Zeilen im liquiden Korb aussehen.

## 6. Pflichtkontrollen — alle VOR dem Blick auf das Urteil, Reihenfolge fest

| Kontrolle | Bauart | Bestanden wenn |
|---|---|---|
| **W0 Reproduktion des Vorbilds (Filter AUS)** | Das umgebaute Werkzeug läuft **in jedem Lauf zuerst ohne Filter** (`umsatzMin = 0`) über Bestätigung, Phase 0, und vergleicht mit dem Vorbild: +1,54097 Pp, 79 Perioden | **Abweichung < 0,01 Pp** und gleiche Periodenzahl; sonst **Halt — der Umbau hat etwas verändert, nichts darf gemessen werden.** Dazu nachrichtlich: größte Abweichung je Periode gegen `lauf-2026-09-01-22-25.json` (Archiv kann seit dem Vorbild 1–2 Tage gewachsen sein; #85 verschiebt die letzte Kerze) |
| **Placebo (in derselben Blickzeile)** | je Periode ein zufälliger Korb gleicher Größe **aus den liquiden Kandidaten**, ohne Kursbezug, Saat 20260902, mulberry32; 200 Ziehungen als Rauschboden | Placebo \|t\| < 2,638; **korrigiertes Kriterium aus Nachtrag 1 des Vorbilds:** se der Placebo-Reihe (parametrisch, 79 Perioden) ÷ sd der 200 Placebo-Mittel ∈ [0,7; 1,4]. *Das gefallene Kriterium des Vorbilds (sd Placebo-Mittel ÷ se Kandidat) wird hier nicht registriert, nur nachrichtlich gedruckt — es misst Faktorstreuung, keinen Rauschboden (`wiki/fehlerformen.md` „Kontrollkriterium falsch gebaut").* |
| **Positivkontrolle** | Ausstiegskurs jedes liquiden Korbwerts × 1,02, durch dieselbe Kette bis zum Netto | Wiederfindung des analytischen Solls `2,000 · (1 + r_Korb) · (1 − Korb/Alle)` je Periode gemittelt auf ±5 %; brutto = netto (Kosten additiv) |
| Datenwächter | `tools/archiv-wachhund.js archiv1d`; Fingerabdruck vor/nach dem Einlesen | Rückstand ≤ 1 Tag (vermerkt), ≥ 2 → Halt; Fingerabdruck unverändert |
| Klassifizierung | `WP.klassifizierungDa()` | sonst Abbruch |

Fällt eine Kontrolle, wird **kein Urteil** gebildet; der Befund wird berichtet.

## 7. Überlebensverzerrung — im liquiden Korb (nachrichtlich, kein Korrekturwert)

Wie Vorbild §7, mit Filter: Auf dem Verschwundenen-Fenster (`massive/tagesdaten`, 2024-08 bis
2026-08) laufen Überlebende allein (S) und Vereinigung (U) **beide mit dem 100-Mio-$-Filter**
(Liquidität der Verschwundenen aus ihren eigenen Balken bis t — Punkt-in-Zeit). Ausgewiesen je
Periode: Anteil Verschwundener im liquiden Universum und im liquiden Korb, Δ U−S, Weg-3-Analogon
63 T; dazu über alle 63 Lagen der Korb-/Universumsanteil.

**Erwartung (vorab):** Breit lagen Verschwundene 1,19× überrepräsentiert im Korb. Der Filter
dürfte viele entfernen (Verschwundene sind eher klein) — **der Anteil Verschwundener im
liquiden Korb ist selbst ein Befund zur Verzerrungsrichtung:** je kleiner, desto weniger kann
das Überlebenden-Archiv den liquiden Effekt verzerren. Etikett wie Vorbild: *Fenster 2024-08
bis 2026-08, übernahme-dominiert, wenige Perioden; 2008/09 nicht gemessen.* **Der Weg-3-Wert
(über Nacht, unbedingt) bleibt NICHT übertragbar** — das hat das Vorbild gezeigt (Vorzeichen
dreht mit dem Horizont).

## 8. Nachrichtlich — wird ausgewiesen, entscheidet nichts

- **Korbgröße und Universumsgröße je Periode** (liquide): min / Median / max und Verlauf über
  die Jahre — der Filter verkleinert den Korb, se steigt; der nominale Filter wird über 20
  Jahre lockerer.
- **Anteil der Perioden, die an der Mindestbreite scheitern** (Soll: 0).
- **Liquiditätsprofil nach Filter:** Anteil ≥ 1 Mrd $ im liquiden Korb (≥ 100 Mio $ ist per
  Bau 100 %, < 5 Mio $ per Bau 0 %).
- **Liquider Korb gegen breiten Markt** (Korb_liq − Markt_breit, Bestätigung): sagt, ob die
  Wahl der Vergleichsgruppe (§3) das Bild ändert. Kein Urteil.
- **Gepaartes Δ** (§5) mit Band, auch wenn die Sterbe-Regel nicht greift.
- **Ären** (Entdeckung, Bestätigung, Gesamt, Jahrzehnte), brutto und netto je Gefäß, Phase 0.
- **63 Rasterlagen** (Bestätigung, liquide): min / Median / Max von brutto, netto CFD, t;
  Lagen mit t_netto ≥ 2,638.
- **Umschlag** (gehalten aus der Vorperiode), Kalendernächte je Periode.
- **Placebo-Kriterium des Vorbilds** (sd Placebo-Mittel ÷ se Kandidat), nur zur Einordnung.

## 9. Sperrliste

Kein Parameter wird verändert · **die Schwelle 100 Mio $ wird nicht variiert, kein zweiter
Filterwert, keine Schichtung** · keine weitere Variante · kein Urteil auf Kassa, ungehebelt
oder CFD (5b ist nachrichtlich) · kein Korrekturwert aus §7 · keine Aussage aus einem
Streubild · kein Wechsel der Rasterlage · keine Jahresrechnung · `massive/universum-2024-09-02.json`
wird nicht angefasst · **die Vorbildstudie und ihr `messen.js` werden nicht verändert** ·
Eichungsstudie unverändert · kein SendMessage, keine Version.

## 10. Werkzeug und Ablauf

**Werkzeug: Kopie von `messen.js` in diesen Ordner, erweitert um `--umsatzMin=<$>`.**
Begründung für Kopie statt Parameter im Vorbildordner: (1) der Vorbildordner bleibt
byte-gleich zu seinem Ergebnis-Commit — sein Ergebnis bleibt mit seinem eigenen Werkzeug
reproduzierbar; (2) Rohdaten (`lauf-*.json`) landen im Ordner der Studie, zu der sie gehören;
(3) die Gleichwertigkeit von Kopie und Original wird nicht behauptet, sondern in **W0**
bewiesen (Filter aus ⇒ +1,541 auf < 0,01). Filter aus (`--umsatzMin=0`) ist **exakt das alte
Verhalten**; der Filter greift an genau einer Stelle (`periode()`, vor `korbBilden()`), und
die Liquiditätsrechnung ist die vorhandene.

1. Diese Registrierung committen (Zeitstempel = Beleg).
2. `messen.js` kopieren, erweitern, committen — **bevor** es mit Filter auf Erträge läuft.
3. `node messen.js --waechter --umsatzMin=100000000` — W0 (Filter aus, druckt den bekannten
   breiten Wert), Placebo, Positivkontrolle, Datenwächter, realisierter **se** und Korbgrößen des
   liquiden Korbs — **ohne** dessen Mittelwert. Kein Urteil gedruckt.
4. `node messen.js --lauf --umsatzMin=100000000` — Kontrollen erneut, dann Urteil nach §5;
   Rohdaten nach `lauf-<zeit>.json`.
5. `ERGEBNIS.md`, Wiki (`belegstand.md` Momentum-Zeile, `offene-auftraege.md`, `log.md`;
   `kosten.md` nur, wenn sich die Lehre „der Effekt lebt, wo er nicht handelbar ist" bestätigt
   oder widerlegt — dann mit Fundstelle), Kurznotiz, Commit, Push.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
