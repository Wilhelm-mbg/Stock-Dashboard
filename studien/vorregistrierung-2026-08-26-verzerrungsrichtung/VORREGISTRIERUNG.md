# Vorregistrierung — Richtung und Stärke der Überlebensverzerrung

**Stand:** 26.08.2026, 20:05 — **vor dem ersten Rechenschritt auf der Kohorte.**
**Rolle:** Berechnungen (Chat-Sitzung). **Auftrag:** Wilhelm 26.08. 17:40 (Antwort c),
PM-Freigabe 26.08. 19:15.
**Vorgänger:** `studien/vorregistrierung-2026-08-25-ueberlebensverzerrung/VORREGISTRIERUNG.md`
(Ablehnungsentscheid mit Datenprogramm D1–D4) und
`studien/tueftler/2026-08-26-nacht3-ueberlebensluecke.md` (Zählung der Lücke).
**Dieses Dokument setzt D4 des Ablehnungsentscheids um** — auf der Datenlage, die der
Tüftler am 26.08. gezählt hat.

---

## 0. Die Frage, in einem Satz

Auf den **1.164 bereits beschafften Verschwundenen** (Tagesdaten, Fenster
2024-08-23 bis 2026-08-21): **in welche Richtung und wie stark** verschiebt das Fehlen
solcher Werte die Messwerte der drei drehbaren Protokolle — **nicht**: die Lücke
schließen, **nicht**: Daten kaufen, **nicht**: eine Kante belegen.

**Aus dieser Messung kann für keine Strategie ein „belegt" entstehen.** Sie beziffert
eine Störgröße (die E1-Warnung, die unter jedem Protokoll steht) — mehr nicht.

---

## 1. Was diese Messung von der abgelehnten unterscheidet

Der Ablehnungsentscheid vom 25.08. nannte fünf Fehler. Jeder bekommt hier die dort
geforderte Abhilfe:

| Fehler (25.08.) | Abhilfe in dieser Anordnung |
|---|---|
| **A10** — die A7-Kontrolle absorbiert den gesuchten Effekt | **Kein A7-Endpunkt.** Primär ist die rohe, gepaarte Kohortendifferenz. A7 kommt nirgends vor. |
| **SP3** — Placebo nicht orthogonal (schritt = 1) | Wächter ist der **Etikettentausch**: die Marke „verschwunden" wird zufällig an liquiditätsgepaarte Überlebende vergeben. Er teilt mit dem Endpunkt keine Signalmenge und kann nicht degenerieren. |
| **B11** — Liquiditätsboden liest Zukunft | Boden **punkt-in-Zeit** (rollender Median über die 21 Kerzen VOR dem Signaltag), auf **beide** Arme gleich. |
| **B12** — Planungsstreuung aus zufälligem Ausdünnen | Planung rechnet mit der am 25.08. an der **echten Bedingung** gemessenen Streuung (P2: sd_NW = 0,6545 Pp — deklariert als gesehen, Abschnitt 6). |
| **B13** — Endpunkt mit Gewicht skaliert, Hürde nicht | Primärendpunkt ist **gewichtsfrei** (c); das Gewicht w wird als eigene Zeitreihe ausgewiesen; jede Verschiebung ist w·c und für jedes Gewicht nachrechenbar. |

---

## 2. Datenbasis, mit den harten Grenzen zuerst

**Verschwundenen-Arm:** `<Datenordner>/massive/tagesdaten/` — 1.164 eindeutige Kürzel,
Spalten je Kerze `[ms, schluss, volumen, hoch, tief]` (**kein Eröffnungskurs**), Quelle
massive `/v2/aggs 1/day, adjusted`, Fensterkante hart bei **heute−2 Jahre** (Tüftler
Befund 4: Reihen sind ~9 Monate kürzer, als das Abrufwerkzeug annahm).

**Überlebenden-Arm:** `E:/Markt-Dashboard-Archiv/archiv1d` (2.965 Reihen, Pfad aus
`archiv1d-pfad.txt`), beschnitten auf **dasselbe Kalenderfenster** 2024-08-23 bis
2026-08-21.

**Vorab-Filter, beide Arme gleich:**

1. **Wertpapierart:** nur Aktienartiges (Abgleich gegen `massive/wertpapierarten.json`
   bzw. den bestehenden Universums-Filter). ETFs/Fonds raus — der Tüftler fand 3 ETFs
   allein unter 10 geprüften Rückständlern.
2. **Falsche Delistings am jungen Rand** (Tüftler Befund 3): Ein „Verschwundener" fliegt
   heraus, wenn seine Reihe **im Überlebenden-Archiv** mehr als 5 Handelstage NACH seinem
   Delisting-Datum weiterläuft (Automatik-Fassung der AVB/EQR/WBS-Regel; punkt-in-zeit
   unkritisch, weil sie nur ausschließt). Erwartung aus der Zählung: ~3–5 Ausschlüsse.
3. **Beschnitt am Todestag:** Kerzen nach `delistet` + 1 Handelstag werden verworfen
   (Nachzügler-Kerzen sind kein Börsenhandel mehr).
4. **Mindesthistorie:** eine Reihe nimmt erst ab ihrer 22. Kerze an Signalen teil
   (der rollende Boden braucht 21 Kerzen Vorlauf).
5. **Liquiditätsboden:** rollender Median des Dollarumsatzes (schluss × volumen) über
   die 21 Kerzen vor t, Schwelle **≥ 3.447.123 $** (die Konstante des Projekts,
   unverändert — nur die Berechnung ist jetzt punkt-in-zeit), auf beide Arme.

**Was diese Basis NICht kann (steht auch im Ergebnis, nicht nur hier):**

- **E-F1:** Das Fenster 2024-08→2026-08 ist übernahme-dominiert. Das Vorzeichen dieses
  Fensters ist keine Aussage über 2008/09. Abdeckung: 1.164 von 6.921 seit 2004
  gelisteten Delistings (~17 %), davor 0 %.
- **E-F2:** Kein Eröffnungskurs ⇒ keine Stop-Regeln, keine Einstiegskonvention
  `folgeEroeffnung`. Einstieg ist deshalb die **Folge-SCHLUSSkerze** (Abschnitt 4).
- **E-F3:** **Keine einzige 60m-Reihe auf der Verschwundenen-Seite.** Alle drei
  drehbaren Protokolle laufen auf `archiv60m`. Diese Messung erreicht sie nur über
  **Tages-Zwillinge** ihrer Signalbedingungen (Annahme Ü1, Abschnitt 4). Was auf
  Tagesebene gilt, wird auf 60m **übertragen, nicht gemessen** — das steht dann in
  jedem Satz des Ergebnisses.
- **E-F4:** Linkstrunkierung: Reihen beginnen frühestens 2024-08-23 bzw. am eigenen
  Listing. Jeder Befund ist eine **Untergrenze unbekannter Schärfe** gegenüber der
  vollen Historie.

---

## 3. Zielgrößen: die drei Drehbaren, mit Zahlen von heute

Aus den Protokollen vom 26.08. (`studien/messmaschine/protokolle/*-2026-08-26.json`),
Feld `aussicht.tage80`, kleinste Variante:

| Protokoll | bestesUrteil | kleinste Aussicht (Handelstage) | drehbar? |
|---|---|---:|---|
| kapitulation | nicht-bestaetigt | 224 | **ja** |
| monatsende-kauf | nicht-messbar | 187 | **ja** |
| rsi2seit-mcp | nicht-entscheidbar | 1.070 | **ja** |
| monatswende-breit | nicht-entscheidbar | 3.803 | nein |
| rsi2seit | nicht-entscheidbar | 4.116 | nein |
| quartalsschub-betrag | nicht-entscheidbar | 13.257 | nein |
| t3-stundendrift | nicht-entscheidbar | 12.655 | nein |
| t2-umsatzschock | nicht-entscheidbar | 17.317 | nein |
| momentum | nicht-entscheidbar | 33.683 | nein |
| t1-zwangsglattstellung | nicht-entscheidbar | 34.691 | nein |
| winkelgrad / winkelbestaetigt | (ohne aussicht-Feld) | — | nein |

Das deckt sich mit dem Tüftler-Hinweis in der PM-Freigabe (drei unter 1.500). Die
Einheiten-Falle aus dem Gedächtnis des Projekts sei hier ausdrücklich benannt:
**Aussicht ist in Handelstagen, delta80 in Prozentpunkten** — die beiden werden nirgends
verglichen.

`momentum` ist NICHT Ziel dieser Messung (Aussicht 33.683). Für Strang A liefert diese
Messung nur die **benannte Einschränkung** und das Vorzeichen — keine Korrekturzahl.

---

## 4. Anordnung

### 4.1 Die Zwillinge (Tages-Sonden)

| Sonde | Bedingung auf Tageskerzen | überträgt auf | wird beurteilt? |
|---|---|---|---|
| **Z1 „rutsch"** | 5-Tages-Rendite ≤ −10 % am Schluss t (exakt die P2-Definition vom 25.08.) | kapitulation, rsi2seit-mcp (Dip-Familie) | **ja** |
| **Z2 „monatsende"** | letzter Handelstag des Kalendermonats (Kalender = Handelstage von SPY aus `archiv1d`) | monatsende-kauf | **ja** |
| Z0 „breit" | jede Kerze | Kontext (unbedingtes Niveau) | nein — bereits gesehen, nur Bericht |
| Z9 „mittwoch" | kursblindes Kalendersignal (jeder Mittwoch) | Maschinenprüfung | nein — richtige Antwort: ≈ Z0 |

**Ü1 (Übertragungsannahme, ausdrücklich):** Die Dip-Familie auf 60m und ihr
Tages-Zwilling Z1 wählen dieselbe Marktlage (starker Kursrückgang über Tage). Der
25.08.-Entscheid führte Z1/P2 bereits als „den 1d-Zwilling der Dip-Familie". Für Z2 ist
die Übertragung fast exakt (Kalendersignal). **Gilt Ü1 nicht, gilt aus dieser Messung
für kapitulation/rsi2seit-mcp nichts** — das steht dann als erster Satz im Ergebnis.

**Haltedauer je Sonde:** H_Tage = max(1, round(Haltekerzen des Protokolls / 6,5)),
ausgelesen aus dem jeweiligen 2026-08-26-Protokoll beim Lauf-Start und **vor der
Kohortenrechnung gedruckt**. (Formel jetzt fixiert, Zahl kommt aus der Datei — nicht aus
meinem Kopf.)

**Einstiegskonvention (wegen E-F2 und wegen des geteilten Kurses):** Signal am Schluss t
⇒ Rendite von **Schluss t+1 bis Schluss t+1+H**. Die Kerze t+1 bleibt Lücke. Grund ist
der Katalog-Fehler „geteilter Kurs, Spannen-Rückprall": bei Dip-Signalen auf sterbenden
Werten ist der Geld-Brief-Rückprall am größten und würde einen Scheineffekt **in genau
der interessierenden Richtung** bauen. Die Variante ohne Lücke (Schluss t → t+H) läuft
als **Empfindlichkeitsangabe** mit, wird aber nicht beurteilt.

### 4.2 Endpunkte

Je Sonde, je Handelstag t mit mindestens **1 Verschwundenen-Signal** und mindestens
**5 Überlebenden-Signalen**:

- m_v,t = Mittel der H-Tage-Renditen der Verschwundenen-Signale des Tages t
- m_ü,t = dasselbe für Überlebende
- **d_t = m_v,t − m_ü,t** (gepaart über den Kalendertag)

**Primärendpunkt (je beurteilter Sonde):**
ĉ = Mittel(d_t), Streuung Newey-West mit Lag H+5, daraus t-Wert. **Gewichtsfrei.**

**Getrennt ausgewiesen (nie in ĉ eingerechnet):**
- w_t = Anteil Verschwundener an den Signalen des Tages t (Zeitreihe + Mittel w̄)
- n_v, n_ü, Tage mit/ohne Verschwundenen-Signal
- 1-%-Stutzung beidseitig auf Einzelrenditen (wie im Haus üblich), Anzahl gestutzter
  Werte wird gedruckt

**Abgeleitete Verschiebung je Protokoll** (reine Multiplikation, keine neue Schätzung):
- ΔB_Fenster = w̄ · ĉ (was die Lücke IM FENSTER am Messwert ändert)
- ΔB_Quer = 0,127 · ĉ (mit der vom Tüftler gezählten historischen Untergrenze
  des Querschnittsanteils; **0,127 ist gesetzt, nicht gefittet**)

### 4.3 Die zwei Wächter — beide laufen VOR der echten Kohorte

**W1 Kunstarchiv (Kalibrierung; zuerst, gegen die eigene Konstruktion):**
200 zufällig gezogene Überlebende erhalten gezogene Pseudo-Todestage (Ziehung aus der
empirischen Delisting-Datumsverteilung der echten 1.164); ihre Reihen werden dort
abgeschnitten, und über die letzten 63 Kerzen davor wird ein bekannter Abschlag von
**−40 % (gleichmäßig je Kerze) eingebaut**. Dann läuft exakt dieselbe Maschine (Z1, Z0).
**Regel W1:** Findet sie den eingebauten Effekt nicht wieder (ĉ_kunst außerhalb
±30 % um den konstruierten Sollwert, der aus der Injektion vorab berechnet und gedruckt
wird), ist der Endpunkt **widerlegt, bevor echte Daten angefasst werden**. Lauf endet.
(Zufallszahlen: fester Seed 20260826, im Skript verdrahtet.)

**W2 Etikettentausch (orthogonaler Null-Wächter):**
200 Ziehungen; je Ziehung bekommen zufällige Überlebende die Marke „verschwunden",
**gepaart nach Liquiditätsdezil** (Dollarumsatz-Median der ersten 21 Fensterkerzen) und
nach Reihenlänge im Fenster (damit auch die Linkstrunkierung nachgestellt ist); Anzahl =
Anzahl der echten Verschwundenen nach Filter. Dieselbe Maschine rechnet ĉ_swap je
Ziehung. **Regel W2:** Das zentrale 80-%-Band der 200 ĉ_swap muss die 0 enthalten, und
|Mittel(ĉ_swap)| < ¼ · delta80 der Familie. Sonst baut die Konstruktion selbst einen
Effekt ⇒ Messung **ungültig**, keine Urteile. Der Tausch fasst die echten Marken nie an.

**Z9-Prüfung:** |ĉ_Z9 − ĉ_Z0| < delta80 der Familie, sonst ungültig (die Bedingungs-
maschine hätte dann einen Fehler — das ist die Placebo-Pflicht aus dem Hausgedächtnis,
angepasst: die „richtige Antwort" eines kursblinden Signals ist hier das unbedingte
Niveau, nicht null).

### 4.4 Warum KEINE Entdeckungs-/Bestätigungshälfte

Abweichung vom Normalverfahren, offen begründet:

1. Die Bestätigungshälfte dieses Fensters ist für das unbedingte Niveau **verbrannt**
   (25.08.: +0,0141 Pp, t = 4,26 wurde gerechnet und berichtet). Eine „ungesehene
   Hälfte" wäre eine Behauptung, keine Eigenschaft.
2. Frische Tage gibt es nicht: der Verschwundenen-Arm endet hart am 2026-08-21, und
   w_t stirbt zum Fensterende (25.08. gemessen: 0,12 % in den letzten 20 Tagen). Eine
   „Bestätigungshälfte" wäre strukturell leerer als die erste — genau der Fehler B13
   in neuer Verkleidung.
3. Der Schutz, den die Hälften sonst leisten (keine Auswahl auf den Schätzer), kommt
   hier aus: **ein einziger Lauf** (keine Varianten außer der deklarierten
   Empfindlichkeitsangabe), Regeln und Schwellen in diesem Dokument **vor** dem Lauf,
   Werkzeug wird **vor** dem ersten Blick auf Kohorten-Zahlen committet, und die beiden
   Wächter W1/W2 sind orthogonal zum Endpunkt.

Wer das Verfahren später bewertet (Analytiker): die bewusste Abweichung steht hier,
damit sie kritisierbar ist — nicht versteckt.

### 4.5 Testfamilie

Familie `verzerrungsrichtung-2026-08-26`, **testsGesamt = 5**:
Richtung Z1, Richtung Z2, Materialität kapitulation, Materialität rsi2seit-mcp,
Materialität monatsende-kauf. Die t-Schwelle der Familie wird nach der B4-Regel der
Messmaschine (Version und Formel aus `messmaschine.js`, Stand HEAD beim Lauf) für 5 Tests
berechnet und **vor der Kohortenrechnung gedruckt**; delta80 der Familie ebenso. Keine
weiteren Sonden, keine weiteren Varianten — was hier nicht steht, wird nicht gerechnet.

---

## 5. Entscheidungsregeln — vorab, vollständig

Reihenfolge der Prüfung: **W1 → W2 → Z9 → dann erst Urteile.**

**Gültigkeit:**
- R0a: W1 verfehlt ⇒ „Endpunkt widerlegt am Kunstarchiv", Ende ohne Kohortenlauf.
- R0b: W2 oder Z9 verfehlt ⇒ „Messung ungültig", Ergebnis nennt nur den Wächterbefund.

**Richtung (je beurteilte Sonde Z1, Z2):**
- R1: |t(ĉ)| ≥ Familienschwelle ⇒ **„Richtung belegt"** mit Vorzeichen von ĉ
  (negativ = Verschwundene laufen nach dem Signal schlechter = das Überlebenden-Archiv
  **beschönigt** die Messwerte; positiv = es **untertreibt** sie).
- R2: |t(ĉ)| < Familienschwelle und 90-%-Band von ĉ ganz innerhalb ±delta80 ⇒
  **„im Fenster ohne messbare Richtung"**.
- R3: sonst ⇒ **„nicht entscheidbar mit diesen Daten"**.

**Materialität (je Protokoll; Richtung nach seiner Sonde):**
Bezugsgrößen aus dem jeweiligen 2026-08-26-Protokoll, Variante des `bestesUrteil`,
Block `bestaetigung.a7`: dessen se und das delta80 der Familie dieses Protokolls.
- R4: |ΔB_Quer| ≥ delta80_Protokoll und Richtung nach R1 belegt ⇒
  **„Verzerrung materiell"** (die E1-Warnung dieses Protokolls bekommt eine Zahl und
  ein Vorzeichen; jedes künftige Urteil dieses Protokolls muss sie ausweisen).
- R5: obere Grenze des 90-%-Bandes von |ΔB_Quer| < ½ · delta80_Protokoll ⇒
  **„im Fenster unerheblich"** (mit dem E-F1-Vorbehalt im selben Satz: gilt für ein
  übernahme-dominiertes Fenster, nicht für 2008/09).
- R6: sonst ⇒ **„nicht entscheidbar"**.

**Was aus keiner Kombination folgt (Sperrliste, wörtlich fürs Ergebnis):**
1. Kein „belegt", „widerlegt" oder sonst ein Kanten-Urteil für irgendeine Strategie.
2. Keine Änderung an E1 in irgendeinem Protokoll nach unten („leiser stellen") — auch
   bei R5 nicht; R5 gilt nur für dieses Fenster.
3. Keine Aussage über momentum außer der benannten Einschränkung (Abschnitt 3).
4. Keine 60m-Aussage ohne den Ü1-Vorbehalt im selben Satz.

---

## 6. Bereits gesehene Zahlen — vollständige Erklärung

Diese Werte sind vor dieser Vorregistrierung berechnet worden und können nicht als
Ergebnis dieser Messung ausgegeben werden:

| Größe | Wert | gesehen am |
|---|---|---|
| unbedingte gepaarte Tagesdifferenz (P1/Z0), Bestätigungshälfte | +0,0141 Pp, t = 4,26 | 25.08., Linse *Auflösung* |
| Kohorten-Tagesmittel roh (verschwunden / überlebend) | +0,705 / +0,380 Pp | 25.08. |
| sd_NW der Sonden P1 / P3 / **P2=Z1** | 0,065 / 0,229 / **0,655 Pp** | 25.08., beide Linsen |
| Median-Gesamtrendite der 25 größten Absteiger, roh je Signal | −1,0627 Pp | 25.08. |
| Lückenanteile je Jahr (7,9 %…20,2 %; ≥ 12,7 % übers Fenster) | Zählung | 26.08., Tüftler |

**Folgen:** Z0 wird berichtet, aber nicht beurteilt (sein Ergebnis ist bekannt). Die
Planung unten benutzt die gesehene P2-Streuung — als Planungsgröße ist das erlaubt und
nach B12 sogar Pflicht. **Die bedingten, gepaarten Kohortendifferenzen ĉ(Z1) und ĉ(Z2)
mit Lücken-Einstieg hat dagegen niemand je berechnet** — sie sind der ungesehene Kern
dieser Messung. Sollte sich beim Bau herausstellen, dass doch eine Stelle sie schon
gerechnet hat, wird diese Vorregistrierung VOR dem Lauf um den Fund ergänzt oder
zurückgezogen — nicht stillschweigend weitergemacht.

---

## 7. Machbarkeit (die Eintrittskarten-Rechnung, VOR dem Lauf)

Mit der gesehenen Z1-Streuung sd_NW ≈ 0,655 Pp: bei n ≈ 150–250 gepaarten Signaltagen
ist se(ĉ) ≈ 0,04–0,05 Pp; auflösbar (Familienschwelle ~2,6) sind |ĉ| ab ~0,11–0,14 Pp.
Die 25.08.-Kohortenzahlen (roh +0,33 Pp Unterschied unbedingt; Dip-Tage auf sterbenden
Werten −1,06 Pp je Signal) liegen **über** dieser Schwelle — die Richtungsfrage ist mit
diesen Daten also beantwortbar, in beide Richtungen. Für die Materialität gilt: delta80
der drehbaren Protokolle liegt in der Größenordnung ihrer se (0,3–0,4 Pp je Signaltag);
ΔB_Quer = 0,127·ĉ erreicht das ab |ĉ| ≈ 2,4–3 Pp — **eher unerreichbar**. Erwartung
ehrlich benannt: wahrscheinlichster Ausgang ist „Richtung belegt, Materialität je
Protokoll R5 oder R6". Auch das ist eine Antwort auf Wilhelms Frage („wie stark"), keine
Niederlage. Sollte alles auf R3/R6 hinauslaufen, ist die ehrliche Schlusszeile: **mit
diesem Fenster nicht messbar** — und der einzige offene Weg bleibt der, den der Tüftler
benannt hat (längere Historie = Geld = Wilhelms Entscheidung).

Dauer des Laufs: Minuten (zwei Kalendersonden über ~3.000 Tagesreihen). Keine
Auflösungswand-Eintrittskarte nötig — dies ist keine Strategie-Kandidatur; die
1.000-Tage-Regel gilt für Kandidaten, nicht für Störgrößen-Messungen. Der Vollständigkeit
halber: die beantwortbare Frage (Richtung) braucht nach obiger Rechnung ~150–250
Signaltage, die im Fenster **vorhanden** sind.

---

## 8. Werkzeug und Ablauf

1. Werkzeug: `studien/verzerrungsrichtung-2026-08-26/messe-verzerrungsrichtung.js`
   (neu, eigenständig; liest archiv1d + massive/tagesdaten; fasst `messmaschine.js`
   NICHT an — der Master arbeitet dort). Es druckt in dieser Reihenfolge:
   Filterzählung → Familienschwelle/delta80 → Haltedauern aus den Protokollen →
   **W1 → W2 → Z9** → erst dann Z1/Z2-Kohortenzahlen.
2. Das Werkzeug wird **vor dem ersten echten Lauf committet** (Stand zitierfähig).
3. **Ein** Lauf. Ergebnis als `ERGEBNIS.md` + Rohausgabe `lauf-<zeit>.json` daneben.
4. Ergebnis geht als Übergabe an den PM; Analytiker sieht es in seiner Nacht ohnehin.
5. Placebo-Disziplin, Stutzungszähler, Einheiten (Pp vs. Handelstage) wie oben.

**Start des Laufs erst nach PM-Rückmeldung auf diese Vorregistrierung** (Freigabe-Auflage:
„melde dich beim PM, wenn die Vorregistrierung steht — nicht erst nach dem Lauf").
W1/W2/Z9 berühren nur Überlebenden-Daten und dürfen zum Werkzeugtest vorab laufen; die
echte Kohorte bleibt bis zur Rückmeldung unberührt.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
