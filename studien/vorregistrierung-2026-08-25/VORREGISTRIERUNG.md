# Vorregistrierung vom 25.08.2026 — Kalenderzwang und Meldungszwang

> **Zur Herkunft dieser Datei.** Die Vorregistrierung entstand am 25.08.2026 aus einer
> Suche über sechs Richtungen (13 Agenten, 16 Kandidaten, sechs Gegenprüfungen), die zu
> **einer** Vorregistrierung verdichtet wurde. Sie stand nur im Gesprächsverlauf und ist
> von dort **nachträglich** auf die Platte geschrieben worden — das war ein Versäumnis:
> eine Vorregistrierung, die nur im Kontext lebt, ist keine. Der wörtliche Auszug liegt
> als `_roh.txt` daneben; diese Datei ist die lesbare Fassung.
>
> **Was dabei verlorengegangen ist, steht in Abschnitt 6** — der Quelltext von Kandidat B
> ist im Protokoll mitten in der Datei abgeschnitten und nicht wiederherstellbar.

---

## 1. Die Kandidaten

### Kandidat A — `monatswende-breit`

| | |
|---|---|
| Kennung | `monatswende-breit` |
| Zeitrahmen | `1d` |
| Haltedauer | 5 Kerzen |
| `leseFensterKerzen` | 21 |
| Richtung | long |
| Varianten | 2 — `{fenster: 5}`, `{fenster: 4}` |
| Universum | `CS` (Stammaktie) und `ADRC` (Hinterlegungsschein) |

**Grund.** Zum Monatswechsel treffen mehrere Zuflüsse mit Termin zusammen, die keiner der
Beteiligten frei legen kann: Gehalts- und Sparplanraten werden zum Monatsersten investiert,
Fonds und Pensionskassen bewerten zum Stichtag und stellen dafür ihre Quoten her, Zins- und
Ausschüttungszuflüsse werden zum Monatsende angelegt, und Verwalter, die nach Monatsergebnis
bezahlt werden, wollen zum Stichtag investiert sein statt in Bargeld. Jeder dieser Käufe folgt
einem Kalender, keinem Preisurteil. Der Termin steht Jahre im Voraus fest, und **das Signal
liest zu seiner Bildung keinen einzigen Kurs**.

Drei Sucher haben die Monatswende unabhängig voneinander gefunden (`monatswende-breit`,
`monatswechsel-zufluss`, `monatszufluss`). Sie sind zu **einem** Test zusammengeführt; sie
einzeln zu messen hieße, drei Bonferroni-Stellen für eine einzige Wette auszugeben.

Der Quelltext liegt als `_A.js` bei und ist unverändert nach
`studien/messmaschine/strategien/monatswende-breit.js` übernommen.

**Vorab geprüft (vom Verdichter, auf `such1d`):** 6.002 Signale bei `fenster 5`,
239 Ereignistage, **0 Vorgriffs-Abweichungen** zwischen voller und bei `i` gekappter Reihe,
**0 Monate mit mehr als einem Einstieg je Symbol**. `fenster 4` wählt in 70 % der Monate
einen anderen Einstiegstag als `fenster 5` — die zweite Variante ist keine Doppelung.

### Kandidat B — `quartalsschub-betrag`

| | |
|---|---|
| Kennung | `quartalsschub-betrag` |
| Zeitrahmen | `1d` |
| Haltedauer | 5 Kerzen |
| `leseFensterKerzen` | 80 |
| Richtung | long |
| Varianten | 2 — V1: \|Überraschung\| ≥ 5 %, Verfall ≤ −2 % · V2: \|Überraschung\| ≥ 5 %, Verfall ≤ −5 % |

**Grund — neu geschrieben, und das war Bedingung für die Aufnahme.** Der eingereichte Grund
(„gute Zahlen erzwingen den Widerruf einer veröffentlichten negativen Festlegung") ist auf der
Entdeckungshälfte **widerlegt**: nach demselben Kursverfall zahlt eine Überraschung von −5 %
*mehr* als eine von +5 % (+1,619 gegen +0,870 Pp je Signal), und −20 % zahlt +2,507 Pp.
Wirksam ist der **Betrag** der Meldung, nicht ihr Vorzeichen:

> Ein Wert, der drei Monate lang gefallen ist, trägt vor seinem Quartalstermin eine
> aufgestaute Ergebnisunsicherheit. Wer sein Risikobudget daran gebunden hat — der
> Fondsmanager, der die Position vor dem Termin gedeckelt hat, das Risikobuch, das die
> Ereignisvolatilität limitiert, der Verwalter, der vor seinem Ausschuss keine ungelöste
> Lage halten darf —, gibt dieses Budget erst wieder frei, wenn die Zahl da ist **und groß
> genug war, um die Unsicherheit tatsächlich aufzulösen**. Eine Meldung nahe der Schätzung
> löst nichts auf: sie beantwortet die Frage nicht, die die Position blockiert hat. Genau
> das ist messbar — nach demselben Kursverfall zahlt \|Überraschung\| < 5 % nichts
> (+0,095 Pp, t 0,47), während **beide** Richtungen mit \|Überraschung\| ≥ 5 % zahlen. Das
> Freigeben des Budgets ist ein Verwaltungsvorgang mit Vorlauf, kein Kursurteil, und es
> läuft über Tage.

---

## 2. Testzahl und Schwelle

| | |
|---|---|
| Kandidaten | 2 |
| Varianten insgesamt | 4 |
| **Tests insgesamt** | **4** |
| Bonferroni, zweiseitig, α = 0,05 | 0,05 / 4 = 0,0125 |
| **Schwelle** | **\|t\| ≥ 2,50** |

Beide Dateien tragen `testfamilie: { testsGesamt: 4 }`. Ohne dieses Feld meldet die Maschine
„Tests 2" je Datei und urteilt an einer Schwelle von 2,24 — an der falschen Latte.

---

## 3. Was jeder Kandidat braucht

MDE = 2 × Standardfehler. Erforderlicher Überschuss bei der Schwelle: **2,50 × SE**.

| Kandidat / Variante | Entdeckung Pp (t) | SE | Erforderlich bei \|t\| 2,50 | Reicht noch bei … % |
|---|---|---|---|---|
| `monatswende-breit` V1 (fenster 5) | 0,729 (5,04) | 0,145 | **0,363 Pp** | 50 % |
| `monatswende-breit` V2 (fenster 4) | 0,43–0,76 (3,8–6,2) ¹ | 0,14–0,17 | **0,375 Pp** | 49–87 % |
| `quartalsschub-betrag` V1 | 1,155 (3,91) | 0,295 | **0,325 Pp** | 28 % |
| `quartalsschub-betrag` V2 | 1,266 (3,71) | 0,341 | **0,375 Pp** | 30 % |

¹ Für `fenster 4` liegt kein Punktwert vor, nur das dokumentierte Plateau über `fenster` 3–7
× `H` 3–6: 0,43 bis 0,76 Pp bei t 3,8 bis 6,2. Auch die schlechteste Ecke dieses Plateaus
liegt über der Schwelle.

Für die Monatswende umfasst die Bestätigungshälfte rund 240 Monatswechsel gegen 227 in der
Entdeckung. Die wirksame Stichprobe ist die Zahl der **Ereignistage**, nicht der Handel — die
Maschine rechnet auf Tagesmitteln, das Klumpen über die ~1.200 gleichzeitig gehandelten Werte
ist damit behandelt.

---

## 4. Auflagen für den Bestätigungslauf

1. **Rauchprobe vor dem Urteil.** Die Maschine fängt Würfe aus `signal()` in `gruende.fehler`
   ab und meldet dann still „null Signale". Eine Zahl nahe null ist ein Werkzeugfehler, keine
   Widerlegung.
2. **Über Tage clustern**, nicht über Handel — die Maschine tut das per Tagesmittel bereits.
3. **Schwanzanteil auf der NETTO-Summe** mit 1-%-Grenze: trägt weniger als 1 % der Handel den
   halben Ertrag, ist es keine Kante.
4. **Die Monatsmitte ist keine Gegenprobe.** Der Überschuss summiert sich über alle Kerzen per
   Konstruktion auf null (nachgemessen: +0,0001 Pp über 3,86 Mio Kerzen). Ist eine Teilmenge
   positiv, muss die Restmenge negativ sein.
5. **Kostenannahme** 0,10 % je Umlauf auf dem Basiswert (gemessen 0,104 %).

---

## 5. Abgelehnt — vierzehn Kandidaten

| Kandidat | Grund der Ablehnung |
|---|---|
| `monatswechsel-zufluss` | Dieselbe Wette wie A, nur mit anderem Fenstermaß und Umsatzfilter. |
| `monatszufluss` | Dieselbe Wette, feuert an allen vier Tagen des Fensters — überlappende Einstiege ohne Informationsgewinn. |
| `monatswende-rueckkauf` | Der Auswahl-Aufschlag ist über den ganzen Monat konstant (Stichtag 0,508 Pp gegen 0,411 im Mittel von 44 anderen Versatzlagen, z = 0,75) — Monatswende mal termin-loser Kurzfrist-Umkehr, also Doppelung. |
| `steuerverlust-umkehr` | Halber Ertrag aus 0,96 % der Handel (unter der 1-%-Grenze), über 19 Saisons geclustert t 2,61, die letzten drei Saisons vor dem Schnitt alle negativ. |
| `schlussdruck-gegentag` | Siehe Abschnitt 5.1 — die beste nicht handelbare Entdeckung des Pakets. |
| `leerbuch-umkehr` | 102–107 % des Überschusses sitzen im Sprung vom Signalschluss zum ersten Druck der Folgekerze; der handelbare Rest ist vor Kosten negativ. Er kauft den Abschlag nicht, er **ist** der Abschlag. |
| `leerbuch-tageskerzen` | Roll-Schätzer gibt ~0,93 Pp Spanne je Umlauf gegen 0,402 Pp Bruttoüberschuss; trägt nur in volatilen Regimen. |
| `quartalsschub-nur-ueberraschung` | Halber Ertrag aus 0,9 % der Handel, über Meldesaisons t 2,37 — und es ist der bereits belegte Ergebnis-Drift in Kurzfassung. |
| `quartalsschub-nur-verfall` | Der erklärte Wirkmechanismus liegt in den eigenen Daten bei t 0,72; die Datei funktioniert nur, weil sie die Betragsfälle stillschweigend mitführt. |
| `innertags-abgabedruck` | Ein Mindest-Tick kostet auf der tatsächlichen Handelspopulation 3,97 Pp gegen 0,74 Pp Bruttoüberschuss. |
| `schlussdruck` | 0,65 % der Handel tragen den halben Ertrag, Median je Handel negativ, Trefferquote 49,9 %. |
| `zwangsband` | Hundertprozentige Teilmenge von `innertags-abgabedruck` (45.530 von 45.530 Handeln identisch). |
| `querschnitt-umkehr-im-streuungsregime` | 0,66 % der Handel tragen die Hälfte; ohne die besten 2 % fällt der Überschuss auf −0,047 Pp. |
| `monatszufluss-schwach` | Zusatznutzen des Schwachfilters am Stichtag +0,117 Pp, in der Monatsmitte +0,119 Pp — die mechanismus-spezifische Vorhersage ist exakt null. |

### 5.1 Der schärfste abgelehnte Fall

`schlussdruck-gegentag` hatte den **besten Nullpunkt des ganzen Pakets**: dieselbe Regel zur
Mittagsstunde liefert bei 243.214 Signalen +0,003 Pp. Er scheitert an der Handelbarkeit —
**67 % des Überschusses entstehen zwischen Signalschluss und dem ersten Druck des
Folgetages**, und der Einstiegskurs *ist* dieser Schlusskurs. Der handelbare Rest liegt mit
0,079 Pp unter der Kostenhürde. Festgehalten als Befund („die Eröffnungsauktion zahlt den
Schlussdruck zurück"), nicht als Test.

---

## 6. Was verlorengegangen ist

**Der Quelltext von Kandidat B ist nicht wiederherstellbar.** Im Gesprächsprotokoll bricht die
Datei mitten in der Symbol-Brücke ab (`/* PFLICHT-RAUCHPROBE: … Ein Bruecken-Fehlschlag darf
nicht al`) — der Agentenbericht war zu lang und wurde abgeschnitten. Erhalten sind der Grund,
die Varianten, die Erwartungswerte und die Auflagen; **nicht** erhalten ist, wie
„Überraschung" und „Verfall" operativ gebildet wurden und wie die Zuordnung Kurs­reihe →
Symbol lief.

Konsequenz, und sie ist streng: **B wird in diesem Lauf nicht gemessen.** Den Code aus der
Prosa nachzubauen hieße, die Operationalisierung *jetzt* zu wählen — und genau diese Freiheit
soll eine Vorregistrierung wegnehmen. Ein nachgebauter B wäre eine **neue** Vorregistrierung
mit neuer Entdeckungshälfte, kein eingelöster Bestätigungstest.

Dass dabei nur 2 statt 4 Tests laufen, ist unbedenklich: die Schwelle 2,50 wurde für vier
Tests gesetzt und bleibt stehen. Sie auf zwei Tests anzuwenden ist **konservativ** — zu
streng, nie zu lax. Sie nachträglich auf 2,24 zu senken, weil B ausfällt, wäre genau der
Griff, den die Mühle verbietet.

**Lehre:** Eine Vorregistrierung gehört in dem Augenblick auf die Platte, in dem sie steht —
nicht, wenn man sie braucht.
