# Tüftler-Nacht 27.08.2026 — Nacht-Typ B (Datenbestand)

**Kein neuer Entwurf.** Warteschlange bei Beginn **2** — formal kein Stau, aber beide
offenen Entwürfe stehen hinter Datenqualität *und* Strang A und warten auf dieselbe
ungebaute Vorbedingung. Und die Arbeit dieser Nacht *ist* Datenqualität, also Priorität I.

Angegangen wurde die Hausaufgabe, die ich mir am 26.08. selbst hingeschrieben hatte:
**„Zwei Jahre sind ein kurzes Fenster; ob sie für ein Urteil reichen, gehört vor dem Lauf
ausgerechnet, nicht danach."** Das betrifft **Weg 3** meines Vorschlags C zur
Überlebenslücke — auf den bereits beschafften 1.164 Verschwundenen die *Richtung* der
Verzerrung messen.

Die Antwort lautet: **Weg 3 ist in einer Form weit über der Schwelle und in der anderen
heute gar nicht ausführbar.** Und beim Nachrechnen ist mir ein eigener Befund von gestern
zerbrochen.

---

## 1. Der Fund, der eilt: den 1.164 Reihen fehlt der Eröffnungskurs

**Gezählt über alle Dateien** (`tagesdaten/`, 27.08.):

| | |
|---|---|
| Reihen | **1.164** |
| Kerzen | **305.908** |
| Feldzahl je Kerze | **5 bei 305.908 von 305.908** — `[t, c, v, h, l]` |
| Eröffnungskurs | **fehlt vollständig** |

**Die Quelle führt ihn.** Eine einzige Sonde (`probe-eroeffnung.js`, ein Abruf, AACB,
02.–06.06.2025) liefert die Feldnamen `c h l n o t v vw` — **`o` ist da**, dazu `vw` und
`n`. Weggeworfen wird er erst bei der Ablage, in `tools/massive-tagesdaten.js:130`:

    var bars = (j.results || []).map(function (b) { return [b.t, b.c, b.v || 0, b.h, b.l]; });

*(Der Code der Werkzeuge liegt außerhalb meiner Rolle — ich melde, ich ändere nicht.)*

### Warum das mehr ist als ein fehlendes Feld

**Jede Übernacht-Frage braucht `Eröffnung(i+1)`.** Beide vorregistrierten Entwürfe
(`glockendruck-nacht`, `nachtstoss-umkehr`) leben genau dort, und die Auflösungswand ist
über Nacht überhaupt nur deshalb zu unterbieten. **Solange der Eröffnungskurs der
Verschwundenen fehlt, lässt sich für das Übernachtfenster nicht prüfen, ob die
Überlebenslücke das Vorzeichen dreht** — also genau die Einschränkung nicht ausräumen, die
in beiden Vorregistrierungen als benannter Vorbehalt steht.

### Und es läuft eine Uhr — das ist der Grund für die Eile

Das Fenster der Quelle rollt: **730 Tage, keinen Tag mehr.** Was hinten herausfällt, ist
dauerhaft weg. Gezählt (`zaehle-randverlust.js`):

| Verzögerung | Fensterrand | Symbol-Tage ohne Eröffnungskurs | Anteil |
|---|---|---|---|
| **heute** | 2024-08-27 | **1.894** | 0,62 % |
| 7 Tage | 2024-09-03 | 5.811 | 1,90 % |
| 14 Tage | 2024-09-10 | 10.760 | 3,52 % |
| 30 Tage | 2024-09-26 | 22.637 | 7,40 % |
| 90 Tage | 2024-11-25 | **62.948** | **20,58 %** |

**Rund 3.917 Symbol-Tage je Woche**, etwa 980 je Handelstag. *Betroffen sind **nur** die
Eröffnungskurse — Schluss, Hoch, Tief und Umsatz dieser Tage liegen bereits auf der Platte
und bleiben.* Nachholen kostet **1.164 Abrufe × 13 s ≈ 4,2 Stunden** Wartezeit an der
5-je-Minute-Grenze, sonst nichts.

> **Auftragsvorschlag D unten.** Er ist der einzige Punkt dieser Nacht, bei dem Warten
> etwas kostet, das sich später nicht mehr kaufen lässt.

---

## 2. Weg 3 ist nicht knapp — er ist um Größenordnungen über der Schwelle

Gerechnet auf dem, was heute auf der Platte liegt: **Schluss zu Schluss**, gepaart, Tag für
Tag der Querschnitt der Überlebenden gegen den der Verschwundenen
(`zaehle-lueckenfenster.js`). Konventionen wie in den beiden Vorregistrierungen: Art
CS/ADRC, Umsatzschnitt 5 Mio $, `reiheKaputt`, letzte Kerze weg (#85) — **beide Seiten
gleich behandelt.**

| Größe | Wert |
|---|---|
| Handelstage mit beiden Seiten | **496** (2024-08-23 … 2026-08-24) |
| Tage ganz ohne Verschwundene | 6 |
| Breite: Überlebende / Verschwundene (Median je Tag) | 2.133 / **177** |
| Anteil der Verschwundenen am Querschnitt | **7,73 %** Median, 12,44 % Maximum |
| σ der Differenzreihe (erste Differenzen, mittelwertfrei) | **0,0586 Pp** |
| σ der Differenzreihe (gewöhnlich, zur Gegenprobe) | 0,0693 Pp |
| se | 0,0026 Pp |
| **`delta80` bei 2 Tests** | **0,0081 Pp** |
| **nötige Handelstage für 0,04 Pp (Aktienhürde)** | **21** |
| nötige Handelstage für 0,10 Pp (CFD-Hürde) | 4 |

**Vorhanden 496, nötig 21.** Das ist der Faktor **24**. Mit der konservativeren gewöhnlichen
σ wären es 29 statt 21 — das Urteil ändert sich nicht.

**Warum so scharf?** Weil die Frage *gepaart* ist. Gemessen wird nicht ein Niveau, sondern
eine Differenz auf denselben Tagen; der Marktfaktor, der die Niveaureihe auf σ = 0,88 Pp
aufbläht, hebt sich in der Differenz weg. Übrig bleibt σ = 0,0586 Pp — **Faktor 15
schmaler.** Dazu kommt, dass die Verschwundenen nur 7,7 % des Querschnitts stellen, was die
Differenz noch einmal dämpft.

### Was diese Zahl NICHT sagt — drei Grenzen, ausdrücklich

1. **Es ist das Schluss-zu-Schluss-Fenster, nicht das Übernachtfenster.** Für Übernacht
   fehlt der Eröffnungskurs (Abschnitt 1). Ob sich die Richtung überträgt, ist offen und
   **ausdrücklich nicht von mir beantwortet.**
2. **Es ist der Zeitraum 2024-08 bis 2026-08**, nicht das Bestätigungsfenster 2008–2026.
   Gemessen würde die Verzerrung *im jüngsten Regime*, nicht über den ganzen Korpus.
3. **Es sind die Verschwundenen mit Kursen**, 1.023 nach Filter von 1.164 beschafften — die
   Liste führt 6.921 aktienartige. Die Rechnung beziffert die Auflösung dieser Stichprobe,
   nicht die Vollständigkeit der Lücke.

**Der Mittelwert der Differenzreihe wurde nie gebildet.** Die berichtete Streuung kommt aus
den ersten Differenzen, `sd(d_t − d_{t−1})/√2`, und die sind mittelwertfrei — die Antwort
selbst bleibt für die Mess-Kette verschlossen. Die gewöhnliche σ läuft nur als Gegenprobe
mit; dass beide dicht beieinander liegen (0,0586 gegen 0,0693), sagt, dass die Reihe
seriell unauffällig ist und der erste Schätzer trägt.

---

## 3. Rücknahme: von drei „belegt falsch delisteten" bleibt keiner

Am 26.08. habe ich gemeldet, **AVB, EQR und WBS** stünden zu Unrecht als delistet in
`massive/verschwundene.json` — sie handelten „lückenlos bis heute, 8 von 8 Kerzen im
Fenster 17.–26.08.". **Ich habe Kerzen gezählt. Ich hätte Umsatz zählen müssen.**

Nachgezählt am 27.08. bei derselben Quelle, mit **drei** unterschiedenen Zuständen
(`probe-yahoo-lebend.js`):

| Symbol | gehandelt | Stempel (v = 0) | leer (v = null) | letzter Umsatz | Eintrag der Liste | Urteil |
|---|---|---|---|---|---|---|
| **AVB** | 21 | 0 | 2 | **2026-08-24**, 6,2 Mio Stück | 2026-08-18 | **nur das DATUM falsch** (Nachtrag 05:05) |
| **EQR** | 7 | 4 | 8 | **2026-08-17** | 2026-08-18 | **stimmig — zurückgenommen** |
| **WBS** | 9 | 1 | 9 | **2026-08-19** | 2026-08-20 | **stimmig — zurückgenommen** |
| LBRDA | **0** | 1 | 3 | — | 2026-08-21 | stimmig |
| LBRDK | **0** | 1 | 3 | — | 2026-08-21 | stimmig |
| *TWO (Kontrolle)* | 21 | 0 | 2 | 2026-08-24 | *nicht in der Liste* | lebt |
| *AAPL (Positivkontrolle)* | **23** | 0 | 0 | 2026-08-26 | *nicht in der Liste* | lebt |

### 🔴 Nachtrag 05:05 — der letzte Fall fällt auch: von drei bleibt **null**

Der PM legte einen Widerspruch vor: QS misst für AVB letzten Umsatz **14.08.**, `-06`s
Wachhund führt AVB mit **8 Tagen Rückstand**, `markt-dashboard-1d` hat ein SEC-**`25-NSE`
vom 17.08.** Seine Vermutung, ich hätte im `massive`-Bestand gemessen, trifft nicht zu —
meine Zahl kommt aus einem **frischen Yahoo-Abruf**, `indicators.quote[0].volume`,
unbereinigt. **Es ist kein Quellstreit, sondern derselbe Anbieter zweimal, zehn Tage
auseinander:**

| | 14.08. | 17.–21.08. | 24.08. | 25./26.08. |
|---|---|---|---|---|
| `archiv1d` (`quelle`: *yahoo v8 chart*, `stand` 24.08. 18:38) | v = 6.938.895 | **5× v = 0**, Schluss identisch bis zur 15. Stelle | fehlt | fehlt |
| frischer Abruf 27.08. | — | 20.08. v = 4,33 Mio · 21.08. v = 7,16 Mio | **v = 6.201.087** | `null` |

**Die QS hat für `archiv1d` recht, und der Wachhund bestätigt es unabhängig:** 8 Tage
Rückstand ist genau die Lücke 14.→24.08. `archiv1d` ist für AVB stehen geblieben und hat
statt Daten Stempel gesammelt — **derselbe Fall, vor dem ich in Abschnitt 4 warne, diesmal
an meinem eigenen Beispiel.**

*Feldsemantik, damit daraus nicht die nächste Differenz wird: `archiv1d` führt **bereinigte**
Schlusskurse (daher die 15 Stellen), mein Abruf den unbereinigten `quote.close` — 65,90
gegen 65,14. Für den **Umsatz** ist das folgenlos.*

**Folge für meinen letzten Fall:** Yahoo zeigt Handel bis 24.08. und danach nichts. Mit dem
`25-NSE` vom 17.08. zusammen passt das — eine Abmeldung nach Form 25 wird nicht am
Einreichungstag wirksam, sondern mit Frist danach; Handel bis kurz davor ist der Normalfall.
**AVB ist damit kein Falsch-Positiv der Liste, sondern ein falsches DATUM** (18.08. statt
Handelsende 24.08., rund 4 Handelstage). *Die Frist habe ich am Filing selbst nicht geprüft
— plausible Zusammenführung, kein Befund.*

**Was bleibt:** die Delisting-**Daten** am jüngsten Rand sind unzuverlässig, die Delistings
selbst sind es nicht. Das ist schwächer als das, womit ich in die Nacht gegangen bin, und
es ist die Aussage, die trägt.

---

**Die Kerzen, auf die ich mich gestern gestützt hatte, waren zum Teil Stempelkerzen mit
Umsatz 0** — genau die Sorte, die im Projektgedächtnis seit Wochen als Falle steht. Ich bin
in eine Falle gelaufen, die ich selbst mit aufgeschrieben hatte.

**Was damit auch zu klein wird: mein Warnsatz.** Ich hatte geschrieben, wer die Liste als
Ausschlussliste verwende, werfe „AvalonBay und Equity Residential aus dem Universum".
Gezählt (`pruefe-delisting-liste.js`): **von 6.921 aktienartigen Einträgen der Liste stehen
genau 5 überhaupt im Kursarchiv** — AVB, EQR, WBS, LBRDA, LBRDK. Der Schaden einer
Verwendung als Ausschlussliste ist damit auf **eine** belegt lebende Reihe begrenzt (AVB),
nicht auf zwei Schwergewichte. Die Regel „Delistings der letzten ~30 Tage sind unbestätigt
und gehören gegengeprüft" bleibt richtig — **die Gegenprobe muss nur nach Umsatz fragen,
nicht nach Kerzen.**

---

## 4. Ein Werkzeugfehler, im eigenen Bau gefunden

Mein erster Detektor wollte das **Überlebensarchiv** als Zeugen nehmen: „steht als
verschwunden in der Liste, hat aber frische Kerzen in `archiv1d` → falsch delistet." Zwei
Gründe, warum das nicht trägt — beide erst durch Gegenproben sichtbar:

1. **Genau die fünf Streitreihen sind die, die der Wachhund als rückständig führt.** Ihre
   letzten Archivkerzen tragen Umsatz 0, AVB hat **sechs** aufeinanderfolgende Tage mit
   demselben Schluss bis auf die 15. Stelle, EQR **fünf**. *Ein Archiv mit Rückstand ist im
   selben Zustand wie das, was es bezeugen soll — es kann nicht bezeugen, ob ein Papier
   handelt.*
2. **Der #85-Schnitt schnitt den eigenen Fall weg.** „Letzte Kerze weg" ist richtig und
   machte trotzdem genau die Reihen unsichtbar, deren einzige junge Kerze die letzte ist:
   LBRDA und LBRDK fielen aus der Prüfung, obwohl sie zur Streitmenge gehören. Der erste
   Lauf meldete deshalb **3 statt 5** Fälle — und die fehlenden zwei waren die, die das
   Kriterium widerlegt hätten.

Beide Fassungen liegen bei; die zweite trägt eine **Positivkontrolle** (zehn unbestrittene
Reihen, alle „lebendig", AAPL 23 von 23 gehandelt), weil ein Kriterium ohne Nachweis, dass
es überhaupt anschlägt, nichts wert ist.

---

## 5. Zwei Einträge für den Fehlerkatalog

- **Beschaffungsfehler:** *Kerzen zählen ist kein Handelsnachweis — Umsatz zählen ist
  einer.* Und die Quelle kennt **drei** Zustände, nicht zwei: `v > 0` gehandelt,
  `v === 0` Stempelkerze, `v === null` keine Daten. Wer nur „hat Kerzen" prüft, vermengt
  alle drei. *Verwandt mit „die Quelle hat geantwortet ist kein Beleg" — dieselbe Familie,
  eine Ebene tiefer.*
- **Werkzeugfehler:** *Ein Bestand mit bekanntem Rückstand taugt nicht als Zeuge für die
  Frage, ob etwas noch läuft* — er befindet sich im selben Zustand wie der zu prüfende
  Fall, und beide sehen von außen gleich aus. Zeuge muss eine Quelle sein, die von dem
  vermuteten Fehler nicht betroffen ist.

---

## 6. Werkzeuge und Ablagen dieser Nacht

| Werkzeug | tut | Ablage |
|---|---|---|
| `werkzeug/probe-eroeffnung.js` | ein Abruf: führt die Quelle `o`? | — (Ausgabe) |
| `werkzeug/zaehle-lueckenfenster.js` | Machbarkeit Weg 3, mittelwertfrei | `daten/zaehlung-lueckenfenster-2026-08-27.json` |
| `werkzeug/zaehle-randverlust.js` | Verlustuhr am Fensterrand | `daten/zaehlung-randverlust-2026-08-27.json` |
| `werkzeug/pruefe-delisting-liste.js` | Liste gegen Archiv, mit Positivkontrolle | `daten/pruefung-delisting-liste-2026-08-27.json` |
| `werkzeug/probe-yahoo-lebend.js` | zweite Quelle, nach Umsatz statt Kerzen | `daten/probe-yahoo-lebend-2026-08-27.json` |

Nichts verändert, nichts gemessen, kein fremder Code angefasst.
