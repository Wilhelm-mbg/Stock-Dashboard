# Inventar: Reiter „Regeln" — Bestandsaufnahme am laufenden Programm

**Auftrag:** Wilhelm, 27.08.2026, über den PM — *„können wir bitte auch den gesamten Tab
Regeln (mit Unterverzeichnissen) weitgehend überarbeiten, UI-mäßig und inhaltlich? das ist
mir alles viel zu viel und unübersichtlich und teilweise unlogisch und verwirrend"*.

**Was das hier ist:** eine Aufnahme, keine Bewertung und kein Plan. Gemessen am laufenden
Programm in einem isolierten Profil (`v8.34.1`, 38 gesäte Messprotokolle, 1280×900).
**Nichts wurde angeklickt außer Reitern und Pillen.**

**Was das hier NICHT ist:** die Streichliste. Die macht Wilhelm.

---

## 1. Der Umfang, gemessen

| Unterreiter | sichtbare Bedienelemente | davon versteckt | Karten | Textzeichen |
|---|---:|---:|---:|---:|
| Übersicht | 10 | 0 | 5 | 2.840 |
| **Schalter & Einstellungen** | **31** | **13** | 2 | 2.762 |
| Mittelfrist | 16 | 0 | 6 | 3.445 |
| **Regelbuch** | 6 | 0 | 6 | **4.045** |
| Chart | 7 | 1 | 1 | 772 |
| Autopilot | 13 | (2)¹ | 2 | 2.046 |
| **Summe** | **83** | **14** | **22** | **15.910** |

¹ Die zwei in *Autopilot* waren ein **Messfehler von mir** — beim Messen war eine andere
Pille offen, also war der ganze Unterreiter `display:none`. Kein Befund über die
Oberfläche. Siehe 3.1.

**83 Bedienelemente und rund 16.000 Zeichen Text auf sechs Unterreitern.** Zum Vergleich:
Wilhelms Beschwerde nennt genau diese Menge.

Die Zahl der PM-Messung (44 im HTML für „Schalter & Einstellungen") und meine (44 gesamt,
31 sichtbar) stimmen überein — **13 davon stehen im HTML, sind aber nicht auf dem Schirm.**

## 2. Lebt alles? — **Kein toter Schalter gefunden**

Wilhelms Frage 2 zielt auf die sechs toten Schalter, die hier schon einmal gefunden wurden.

- **0** Bedienelemente ohne jede Fundstelle im Code.
- **25** Knöpfe mit Kennung geprüft: **alle 25 sind verdrahtet.**

**Wie belastbar das ist:** Meine Textsuche meldete zuerst 23 „nie verdrahtet", dann nach
Verbesserung noch 3 (`#mfdTaktBtn`, `#mfdRebalanceBtn`, `#mfdDriftBtn`). **Ich habe alle
drei von Hand nachgesehen — sie sind verdrahtet** (`mfdepot.js:310–312`, zwölf Zeilen nach
der Stelle, an der ihre Kennungen stehen). Das Idiom `var b1 = el('x'), b2 = el('y'); …`
mit der Verdrahtung weiter unten schlägt jede fensterbasierte Textsuche.

> ⚠ **Damit ist „kein toter Schalter" ein Befund mit Vorbehalt.** Eine Textsuche kann
> Verdrahtung über Delegation grundsätzlich nicht sehen. **Für die Gegenrichtung — ein
> Knopf, der zwar verdrahtet ist, dessen Handler aber nichts mehr tut — sagt sie gar
> nichts.** Das kann nur `06` von der Code-Seite prüfen.

## 3. Was mir strukturell aufgefallen ist

Fünf Beobachtungen, die zu Wilhelms Worten „zu viel", „unübersichtlich", „unlogisch"
passen. **Beobachtungen, keine Empfehlungen.**

### 3.1 Die Auslöser-Auswahl steckt hinter „Experten-Einstellungen"

> **Korrigiert am 27.08. 18:15.** Die erste Fassung dieses Abschnitts trug eine
> **Vermutung** („die Blöcke hängen daran, ob die Strategie eingeschaltet ist"). Der PM
> sagte: miss es. **Gemessen — und die Vermutung war falsch.** Es sind drei verschiedene
> Ursachen, und zwei der 13 sind gar kein Fund. `probe-13-unsichtbare.js`.

| Ursache | Bedienelemente | Bewertung |
|---|---|---|
| **Zugeklapptes `<details id="idExperte">` „Experten-Einstellungen anzeigen"** | **`#idMode`** · `#idKryptoHandeln` · `#idScreener` · `#idAutoTune` · `#idKrypto` · `#idSchattenImmer` | **der eigentliche Fund** |
| Vorfahr-`<label>` auf `display:none` | `#idExit` (`#lblExit`) · `#idTrend` · `#idMtf` · `#idChannel` · `#idTrail` | bedingt eingeblendet |
| Zugeklapptes `<details id="archivWiderlegt">` „Archiv: gemessen und widerlegt" | `#hourlyEnabled` | **richtig so** |
| `opacity: 0`, sichtbarer Ersatz `.knob` 42×23 vorhanden | `#idEnabled` | **kein Fund — Bauweise** |
| *(Messfehler von mir)* | `#pilotOn`, `#aoRegime` | **kein Fund** |

**Der Fund: `#idMode` — die Auswahl des Auslösers — liegt hinter einer zugeklappten
Klappe namens „Experten-Einstellungen".** Das ist die Einstellung, die bestimmt, *welche
gemessene Strategie überhaupt läuft. Wer sie sucht, muss erst wissen, dass er Experte ist.
Fünf weitere Schalter liegen mit ihr dort.

**Zweitens:** fünf Einstellungen (`#idExit`, `#idTrend`, `#idTrail`, `#idMtf`,
`#idChannel`) hängen an einem `<label>`, das auf `display:none` steht — sie erscheinen und
verschwinden je nach Lage. **Das ist die Sorte, die eine Seite „unlogisch und verwirrend"
macht:** man sucht etwas, das man gestern gesehen hat, und es ist weg. *Wovon genau sie
abhängen, habe ich nicht gemessen.*

**Positiv, und es gehört zu Frage 5:** `#hourlyEnabled` sitzt hinter einer Klappe, die
ausdrücklich **„Archiv: gemessen und widerlegt – Stunden…"** heißt. **Für die
Stunden-Strategie ist das Aufräumen also schon geschehen** — ein Muster, das für andere
widerlegte Dinge taugen könnte.

**Zwei meiner 13 waren keine Funde.** `#idEnabled` ist eine Checkbox mit `opacity:0` in
einem selbstgebauten Schalter — die sichtbare `.knob` daneben ist 42×23 groß, das ist die
Bauweise und kein Mangel. Und `#pilotOn`/`#aoRegime` standen nur deshalb auf „unsichtbar",
**weil beim Messen eine andere Pille offen war** — ein Fehler meiner Aufnahme, kein Befund
über die Oberfläche.

### 3.2 Die Strategiekarten der Übersicht haben keine Überschrift

Auf *Übersicht* fand meine Kartenaufnahme zweimal „(ohne Überschrift)" und zweimal die
Überschrift **„nicht entscheidbar"** — das ist die Urteils-Pille, die mangels `h2/h3/h4` als
Kopf der Karte durchgeht. **Die vier Strategiekarten tragen ihren Namen also in einem
`<span>`, nicht in einem Überschriftenelement.** Das betrifft Übersichtlichkeit **und**
Barrierefreiheit (Vorlesereihenfolge, Sprungmarken).

### 3.3 Das Regelbuch ist die Textwand des Reiters

6 Bedienelemente, aber **4.045 Zeichen** — der höchste Textanteil bei der geringsten
Bedienbarkeit. Zwei Karten allein tragen **2.823** („Bilanz dieser Regel") und **1.941**
Zeichen („Was hat gewirkt?").

### 3.4 Eine Karte mit drei Knöpfen und null Text

*Autopilot* → **„Backtest (Handwerkzeug)"**: 3 Bedienelemente, **0 Zeichen** sichtbarer
Text. Was sie tut, steht nirgends auf der Karte.

### 3.5 Die Last ist sehr ungleich verteilt

*Chart* hat eine Karte und 772 Zeichen; *Regelbuch* hat sechs Karten und 4.045. **Der
Reiter hat keinen erkennbaren gemeinsamen Maßstab dafür, was einen eigenen Unterreiter
verdient.**

## 4. Doppelungen — nichts gefunden, mit engem Prüfmaß

**0** Beschriftungen kommen in mehreren Unterreitern vor.

> ⚠ **Das Maß war eng.** Ich habe auf **gleiche Beschriftung** geprüft. Wilhelms Frage 3
> („derselbe Wert unter zwei Namen") verlangt den Vergleich der **Speicherschlüssel**, auf
> die die Bedienelemente schreiben — das steht im Code, nicht auf dem Schirm. **Diese Frage
> ist offen** und gehört mit `06` zusammen beantwortet.

## 5. Was ich NICHT beurteilen kann

Ausdrücklich markiert, statt geraten:

1. **„Wirkt es?" im Sinne von: tut der Handler noch etwas.** Textsuche sieht Verdrahtung,
   nicht Wirkung.
2. **Ob eine Einstellung etwas Widerlegtes steuert.** Dafür muss jeder Schalter gegen den
   Messstand gehalten werden (Belegstand 0 von 12). **Das ist der aufwendigste Teil und
   noch nicht gemacht.**
3. ~~**Warum die 13 Elemente unsichtbar sind** — vermutet, nicht gemessen.~~
   **Am 27.08. 18:15 nachgemessen (3.1), die Vermutung war falsch.** Offen bleibt nur
   noch, *wovon* die fünf bedingt eingeblendeten Einstellungen abhängen.
4. **Ob zwei Bedienelemente denselben Speicherwert schreiben** (siehe 4).
5. **Was jedes einzelne Bedienelement in Wilhelms Sprache tut.** 83 Stück; das ist die
   eigentliche Fleißarbeit und steht noch aus.

## 6. Rohdaten

| Datei | Inhalt |
|---|---|
| `probe-inventar-regeln.js` | Aufnahme am laufenden Programm |
| `inventar-abgleich.js` | Abgleich der Kennungen gegen die Quelltexte, mit Selbstprüfung |
| `rohbefund-inventar.json` | jedes Bedienelement mit Kennung, Beschriftung, Karte, Wert, Sichtbarkeit, Fokussierbarkeit, Ort |
| `rohbefund-inventar-abgleich.json` | Fundstellen je Kennung |

**Methodische Vorsicht, aus den Fehlern dieses Tages:** Rechtecke werden **vor** dem
Fokussieren erfasst (`focus()` scrollt), Sichtbarkeit **und** Fokussierbarkeit werden
getrennt bestimmt (ein gefülltes Rechteck heißt nicht, dass man hinkommt — das war der
Fehler in #109), und jeder Melder trägt eine Selbstprüfung.
