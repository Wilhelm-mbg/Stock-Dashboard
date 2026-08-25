# Vorregistrierung: Einstiegskonvention

**Datiert 25.08.2026, vor dem ersten Maschinenlauf des Zweigs N.**
**Vorgänger:** `studien/entwuerfe-2026-08-25/einstiegskonvention.md` (Entwurf).
**Geprüft von:** zwei Skeptikern (Linse *Vorgriff*, Linse *Auflösung*). Die Linse
*Auflösung* hat den Entwurf getragen und jede Zahl unabhängig reproduziert; die Linse
*Vorgriff* hat drei Mängel gefunden, die **vor** dem ersten Lauf behoben werden müssen.
Alle drei sind hier behoben. Das ist die verbindliche Fassung.

**Das ist die einzige der drei Vorhaben vom 25.08., die etwas entscheiden kann.** E1 hat
gegen seine Äquivalenzmarge **Faktor 15,6** Luft — die erste Messung dieses Projekts mit
echtem Spielraum statt Grenzlage.

---

## 0. Was sich gegenüber dem Entwurf geändert hat

Sieben bindende Änderungen. Wer den Entwurf kennt, liest zuerst diese Liste.

| # | Änderung | Grund |
|---|---|---|
| **Ä1** | **Basisvertrag** für `lueckeBasis()`: je Hälfte, je Zelle, ohne die Signalkerzen, gestutzt, im Universum der Messung. Wachhund bricht ab, wenn Basis und berichtete Größe aus verschiedenen Hälften stammen. | `lueckeBasis()` läuft heute über **beide** Hälften (Z. 737–753 nachgelesen), die Kontrolle daneben trennt sie (A5). Halbverschiebung der Grenzbasis: **0,043 Pp** = 70× die MDE von E1. |
| **Ä2** | **`signalNutztSchlussKerzeI` wird per Instrumentierung ABGELEITET**, nicht von Hand gesetzt, und ist **dreiwertig**. Das Vertragsfeld wird dagegen **geprüft**, Abweichung ist Abbruch. | Das Feld sollte laut §12 „mechanisch bestimmt" sein; die Maschine erzwang nur seine Existenz. Gesetzt hätte es jemand, der die Wirkrichtung je Strategie schon ausgerechnet hat — B9 in Reinform. |
| **Ä3** | **Placebo zieht aus dem Komplement** (Kerzen, auf denen das Signal nicht gefeuert hat) und **verweigert bei `schritt == 1`**. | `winkelgrad` V0: 5.547.482 Signale gegen 10.553.315 Kerzen → `schritt = 2` → rund **50 % Kontamination**. Auflage 7 des Entwurfs (feinere Zellen) hätte das verschlimmert. |
| **Ä4** | **E2 wird auf „beschreibend, überlebensverzerrt, kein Urteil" herabgestuft.** Testzahl fällt von 3 auf **2**, Schwelle von 2,394 auf **2,241**. | E2 ändert nichts (keine 1d-Strategie liest `close[i]`, §13 sagt selbst „sie bleiben unangetastet") und läuft auf einem Universum, dem 6.921 delistete Ticker fehlen, deren Reihen **keinen Eröffnungskurs** haben — die Verzerrung ist dort nicht einmal abschätzbar. |
| **Ä5** | **E1 wird je Zelle geurteilt**, nicht aggregiert; die Vorzeichen-Regel wird **vorab** präzisiert. | Die Aggregatzahl −0,000054 Pp ist eine **Auslöschung**: INNEN_P4 +0,00162 (t 2,71), INNEN_P5 −0,00194 (t −4,09). Und `L_innen` kippt zwischen den Hälften (E −0,00237, B +0,00203) — nach Regel 6.5 des Entwurfs wäre E1 damit nichtig gewesen. |
| **Ä6** | **Die t1-Schutzvorhersage wird als Intervall gegeben und die Ungültigkeit vom t-Wert entkoppelt.** | Der Entwurf sagte t ≈ 1,98 mit der **alten** se voraus. Beide Korrekturen wirken: Zähler fällt (Halbfehler, ≈ +0,0953 statt +0,1155), Nenner fällt (Lücke verlässt die Handelsrendite, se ≈ 0,047 statt 0,058). Die Vorhersage lag vermutlich auf der falschen Seite ihrer eigenen Schwelle. |
| **Ä7** | **Der 60m-Grenzwert ist weiter kein Endpunkt — aber aus dem richtigen Grund.** | „Strukturell nicht entscheidbar" ist falsch: der Marktanteil der Tagesmittel-Varianz ist 60m 99,77 % gegen 1d 99,51 %, also praktisch gleich. Der Unterschied sind die **Tage** (692 gegen 9.814). |

---

## 1. Fragen

**E1.** Kostet die Konvention „Einstieg zum Schluss der Signalkerze" **innerhalb** einer
Sitzung etwas, das eine Handelsentscheidung berühren könnte?

**E3.** Muss die Maschine die Sitzungsgrenze als **eigene Schicht** führen, oder reicht die
Sitzungsposition?

**N.** Um wie viel verschiebt sich der gemessene Überschuss jeder live laufenden
60m-Strategie, wenn sie zum ersten handelbaren Kurs **nach** dem Signal gefüllt wird statt
zum Signalkurs — und ändert das ein Urteil? (Antwort darf nur **nach unten** wirken.)

**E2 ist keine Frage mit Urteil mehr.** Die 1d-Übernachtlücke wird beschreibend berichtet
(Ä4).

---

## 2. Datenbasis, gezählt

### 2.1 `E:/Markt-Dashboard-Archiv/archiv60m`

| Größe | Wert |
|---|---|
| Dateien `bars_60m_*.json` | 2.887 |
| benutzbar | **2.873** (11 nach F1 verworfen, 1 zu kurz) |
| Zeitraum | 2023-09-26 … 2026-08-24, **730** Kalendertage mit Handel |
| Lückenfälle nach Vorlauf 261 | **13.799.331**, davon ohne echten Eröffnungskurs **0** |
| INNEN (`Position[i+1] !== 0`) | **11.818.797** Fälle auf **693** Tagen |
| GRENZE (`Position[i+1] === 0`) | **1.980.534** Fälle auf **692** Tagen |
| bitgleich `Eröffnung[i+1] == Schluss[i]` | INNEN 20,78 %, GRENZE 2,22 % |

### 2.2 `E:/Markt-Dashboard-Archiv/archiv1d`

2.966 Dateien, **2.907** benutzbar (58 nach F1), **9.814** Handelstage, **14.456.629**
Lückenfälle nach Vorlauf 261, 0 ohne Eröffnungskurs, bitgleich 10,28 %.
**Korrektur zum Entwurf:** die 9.814 Tage beginnen nach Vorlauf 261 am **1987-09-04**.
Die Rohdaten reichen bis 1986 zurück, die gezählten Tage nicht.

### 2.3 Zwei Zählungen, die der Entwurf als Nebensache führte und die Zellen erzwingen

**Wochentag.** 60m GRENZE: Mo −0,0257 | Di **+0,1277** | Mi +0,0891 | Do +0,0311 |
Fr +0,0466 Pp. Spanne **0,153 Pp** — das **15-fache** der scharfen Marge und das
1,5-fache der Kostenhürde. 1d: Mo +0,0663 bis Mi +0,0134, Spanne 0,053 Pp = 4× die MDE
von E2. `t1` ist eine Zwangsglattstellungs-These und hat Wochentagsstruktur.

**Kalenderabstand innerhalb von GRENZE.** 60m: 1 Tag **+0,05975** Pp (1.534.093 Fälle) |
2–3 Tage +0,06506 (392.065) | 4–7 Tage **−0,13621** (54.372) | über 7 Tage **−18,94 Pp**
bei 4 Fällen. Die vier Monster überleben F1 (das prüft nur Schluss-zu-Schluss über
+400 %/−80 %). Der 4–7-Tage-Block allein verschiebt die Grenzbasis um −0,0053 Pp, über die
Hälfte der scharfen Marge. „GRENZE" mischt heute Übernachtlücken mit Mehrtageslöchern.

### 2.4 Was **nicht** in der Datenbasis ist

Die 1.037 delisteten Reihen (`Markt-Dashboard-Daten/massive/tagesdaten/*.json`) haben
**fünf** Spalten und **keinen Eröffnungskurs**. Diese Studie läuft vollständig auf einem
überlebenden Universum (E1 des Fehlerkatalogs) und kann über delistete Werte
grundsätzlich nichts sagen.

---

## 3. Vorab-Einteilungen

1. **Zeitrahmen:** 60m und 1d getrennt, nie gepoolt.
2. **Schicht:** `GRENZE[i] := (Sitzungsposition[i+1] === 0)`. **Nicht** Position 6 —
   0,40 % der Symbol-Handelstage sind kürzer, und 24.395 Grenzfälle (1,23 %) liegen nicht
   auf Position 6. Wer nach Position schichtet, zieht Position 4 von +0,00161 Pp auf
   −0,00581 Pp und bläht ihren Standardfehler um Faktor 7,3.
3. **Zellen** (bindend, Abschnitt 4): `Hälfte × GRENZE × Sitzungsposition ×
   Kalenderabstand-Klasse`. Kalenderabstand-Klassen: `1 Tag`, `2–3`, `4–7`, `> 7`.
   Wochentag ist **keine** Zelle, sondern eine Pflicht-Empfindlichkeitsrechnung
   (Abschnitt 4.3) — sonst zerfasern die Zellen.
4. **Ausschlüsse, abschließend:** F1-kaputte Reihen; die abschließende Stempel-Kerze jeder
   Reihe; Kerzen ohne echten Eröffnungskurs (gemessen 0); Vorlauf 261.
   **Deklariert, nicht als B7-konform verbucht:** `reiheKaputt` durchläuft die **ganze**
   Reihe — ein Fehldruck im Jahr 2026 löscht dasselbe Symbol auch aus 1986. Das sind
   11 Reihen (60m) und 58 (1d), und es ist der Sache nach ein **zukunftsabhängiger**
   Ausschluss. Er bleibt (die Alternative wäre schlimmer), aber er wird als Abweichung
   geführt, nicht als Schutz.
5. **Kein Halbierungsschnitt für Zweig E** — L ist eine mechanische Eigenschaft des
   Archivs, keine durchsuchte These. **Aber** L wird je Hälfte berichtet und je Hälfte
   geurteilt (Ä5).
6. **Zweig N** erbt den Schnitt der jeweiligen Strategie (60m: 2025-03-12) unverändert.

---

## 4. Der Basisvertrag — vor dem ersten Lauf zu bauen (Ä1)

`lueckeBasis()` bekommt dieselben Zusicherungen wie `baueKontrolle`, schriftlich als
**Vertrag**, nicht als Einzelauflagen. Fünf Punkte, alle prüfbar:

| | Zusicherung | Warum |
|---|---|---|
| **(a)** | **Dieselbe HÄLFTE** wie die berichtete Größe. Je Hälfte eine eigene Basis, nie gepoolt. | Gemessen: GRENZE Entdeckung **+0,07834** gegen Bestätigung **+0,03519** Pp; INNEN Entdeckung −0,00237 gegen Bestätigung **+0,00203** — **Vorzeichenwechsel**. Die Tabelle 8.3 des Entwurfs zentrierte eine Beide-Hälften-Lücke gegen einen Nur-Bestätigung-Überschuss. |
| **(b)** | **Dasselbe Universum** wie die Messung, nicht das ganze Archiv. | Gepoolte Archivbasis 0,0079 Pp gegen 0,0085 Pp im 2.201er-Universum. |
| **(c)** | **Dieselben Zellen** (Abschnitt 3.3), gewichtet mit der Signalverteilung. | Die Lücke ist an der Grenze rund 1.000-mal so groß wie innen. |
| **(d)** | **OHNE die Signalkerzen** (leave-one-out), und der **Signalanteil am Topf** ist eine Pflichtzeile. | A6, gezählt: `winkelgrad` V0 stellt **52,6 %** des Basistopfs, `momentum` V3 32,5 %, `t3` V0 17,3 %. Entkontaminiert wandert `winkelgrad` V0 von L = 0,00081 auf **0,00171 Pp** (Faktor **2,11**), `momentum` V3 von 0,01532 auf 0,02271. Die Ablesung „nur `winkelgrad` hält die scharfe Marge ein" ruhte auf einer per Konstruktion halbierten Zahl. |
| **(e)** | **Gestutzt wie die Kontrolle** (1 % je Seite, F1b). | `baueKontrolle` stutzt mit der ausdrücklichen Begründung, ein einziger Fehldruck verschiebe den Topf zweistellig; `lueckeBasis` addierte roh. Zwei Schätzer verschiedener Bauart standen nebeneinander und wurden voneinander abgezogen. |

**Wachhund (bindend):** Die Auswertung **bricht ab**, wenn Basis und berichteter Überschuss
aus verschiedenen Hälften, verschiedenen Universen oder verschiedenen Zellrastern stammen.
Nicht Warnung — Abbruch. Das ist die Zeile, die diesen Fehler in Zukunft verhindert.

**Vorlauf.** Die Basis benutzt heute den festen `VERFAHREN.mindestKerzenVorlauf` = 261,
nicht das Lesefenster der Strategie. `t1` hat `leseFensterKerzen = 430`; die Basis mittelt
also über 169 Kerzen je Reihe, auf denen das Signal gar nicht feuern kann (≈ 3,5 % des
Topfes), obwohl der Kommentar in Z. 742 „dieselben Grenzen wie die Signalschleife"
behauptet. **Auflage:** die Basis läuft ab `max(261, leseFensterKerzen)`.

**Folge, ausdrücklich:** Abschnitt 8.3 des Entwurfs (die Zweig-N-Tabelle) wird nach dem
Basisvertrag **vollständig neu gerechnet**. Die heutigen Zahlen dieser Tabelle werden
**nicht** datiert und **nicht** eingefroren; sie sind Größenordnungen, keine Vorhersagen.
Der Kopfbefund ändert sich bereits sichtbar: `t1` V0 lautet mit Beide-Hälften-Basis
−0,1197 Pp, mit Bestätigungs-Basis **−0,0993 Pp** — womit der Satz „die Korrektur ist
größer als die MDE der Messung, die sie korrigiert (0,1166)" **fällt**. Er ist dann kleiner.

**Was der Basisvertrag NICHT berührt:** E1 und E3. Beide sind ungezentrierte Größen
(`L = Eröffnung[i+1]/Schluss[i] − 1` bzw. ein Varianzverhältnis) und brauchen keine Basis.
Ihre Zahlen aus Abschnitt 2 stehen.

---

## 5. Die Einstiegskonvention wird abgeleitet, nicht behauptet (Ä2)

**Die Regel lautet nicht „liest die Strategie `close[i]`?".** Sie lautet:

> **Der Einstieg ist der erste handelbare Kurs echt NACH dem Zeitpunkt, zu dem alle
> Eingaben des Signals öffentlich sind.**

„Liest `close[i]`" ist nur der Sonderfall dieser Regel für reine Kursdetektoren.

**Das Feld wird dreiwertig:**

| Wert | Einstieg | wann |
|---|---|---|
| `schlusskerze` | `Schluss[i]` **verboten**, → `Eröffnung[i+1]` | Signal liest `close[i]` |
| `vortagsschluss` | `Eröffnung[i]` **zulässig** | alle Eingaben stehen zum Schluss von i−1 fest |
| `sitzungsintern` | `Schluss[i]` zulässig (MOC/LOC ist real und hochliquide) | Eingaben stehen vor dem Schlussfixing von i fest |

Für alle drei bisherigen `false`-Strategien ist der früheste handelbare Kurs
**`Eröffnung[i]`**, nicht `Schluss[i]`: bei `quartalsschub-betrag` steht die Überraschung
nach Börsenschluss i−1 fest und der Verfallsfilter liest `bars[i−1][1]`; bei `momentum`
liegen die Merkmale bei i−231 und i−21; bei `monatswende-breit` ist es reine
Kalenderarithmetik. Der Entwurf schloss das per Bauart aus, ohne es zu erwähnen. Die Wahl
ist im `false`-Zweig **konservativ** (ein früherer Einstieg nähme den Ertrag von Tag i
hinzu und höbe `quartalsschub` eher an) — deshalb bleibt sie, aber sie steht jetzt da.

**Die Ableitung ist mechanisch, nicht gelesen.** Ein Probelauf reicht jeder Strategie ein
Proxy-`bars`, das jeden Zugriff protokolliert (Zeilenindex **und** Spalte), sowohl in
`signal(bars, i, params, rang, sym)` als auch in `querschnitt.merkmal(bars, i)`. Berührt
eine Strategie auf einer Stichprobe von mindestens 5.000 Kerzen irgendein Feld der Zeile i
außer dem Zeitstempel, ist der Wert `schlusskerze`. Das Vertragsfeld wird **dagegen
geprüft**; Abweichung ist **Abbruch der Messung**, nicht Warnung. Damit wird aus Riegel 1
des Entwurfs tatsächlich, was er zu sein behauptet.

**Zwei Vorgriffskanäle, die die Instrumentierung NICHT sieht und die deshalb hier stehen:**

1. **`momentum`** hängt am Querschnittsrang, dessen Grundgesamtheit die **2026 noch
   vorhandenen Dateien** sind. „Stärkstes Zehntel von 1990" ist über die **Zusammensetzung**
   ein Vorgriff, nicht über `close[i]`. Das ist E1 (Überlebensverzerrung) in einer Form,
   die diese Studie nicht heilt.
2. **`quartalsschub-betrag`** verlangt in `universum` `!!TERMINE[sym]` — **189 Symbole aus
   dem heutigen App-Store**, also eine Auswahl auf spätere Daten. Der Entwurf
   rehabilitierte den Detektor in Befund 3 und 14.5 auf dieser Grundgesamtheit, ohne sie zu
   benennen. Jede Aussage über `quartalsschub` trägt diesen Vorbehalt.

---

## 6. Der Placebo (Ä3)

`placeboLauf` zieht heute mit festem Schritt `max(1, round(verfuegbar/positionen))` aus
**derselben** Menge, aus der das Signal feuert. Bei `winkelgrad` V0 ist das Verhältnis
**1,90** → Schritt 2 → der Placebo ist jede zweite Kerze des Archivs und enthält rund die
Hälfte der echten Signale. Seine wahre Antwort ist dann nicht null.

**Auflagen, alle vor Schritt 5 der Reihenfolge:**

- Der Placebo zieht aus dem **Komplement** (Kerzen, auf denen das Signal **nicht** gefeuert
  hat).
- Er **verweigert** (`verweigert: true`), wenn in einer Zelle `verfuegbar/benötigt < 5`.
- `schritt == 1` wird als **Fehler geworfen**, nicht still zugelassen.
- Er bildet die Verteilung über `(GRENZE × Sitzungsposition)` nach, nicht nur über die
  Position — ein gleichverteilter Placebo hat an der Grenze zu wenig Gewicht und besteht
  deshalb immer.
- Er läuft unter **beiden** Konventionen; die Differenz muss null sein.

**Warum die Reihenfolge zählt:** Die Werkzeugprobe macht „der Placebo liefert unter beiden
Konventionen dasselbe" zur Sperre vor Schritt 6. Ein **korrekt** gebauter Schalter lässt
einen kontaminierten Placebo um den Signalanteil × L wandern — die Probe würde den
**richtigen** Schalter zurückweisen. Erst nach der Reparatur ist sie eine Probe auf den
Schalter statt auf sich selbst.

---

## 7. Endpunkte

### 7.1 Zweig E

| # | Endpunkt | Definition | Art |
|---|---|---|---|
| **E1** | `L_innen` **je Zelle** | Tagesmittel von `Eröffnung[i+1]/Schluss[i] − 1` über INNEN-Kerzen, 60m, getrennt je `(Hälfte × Sitzungsposition)` | **Äquivalenztest, urteilsbildend** |
| **E3** | `Q = sd(GRENZE)/sd(INNEN)` je Fall, 60m | Varianzverhältnis | **urteilsbildend** |
| **E2** | `L_grenze,1d` | dasselbe über alle 1d-Kerzen | **beschreibend, kein Urteil** (Ä4) |

**Warum der 60m-Grenzwert kein Endpunkt ist (Ä7).** Gemessen +0,05543 Pp, se 0,02447,
t = 2,27 — unter der Schwelle. Der Grund ist **nicht** der gemeinsame Marktfaktor als
Unterscheidungsmerkmal: der Marktanteil der Tagesmittel-Varianz beträgt 60m **99,77 %** und
1d **99,51 %**, also praktisch dasselbe. Der einzige Unterschied sind die **Tage**: 692
gegen 9.814. **Breite hilft null, nur Tage helfen.** Nötig sind **773** Tage für
`|t| ≥ 2,394` beim beobachteten Effekt (81 mehr, ≈ 4 Monate) und **1.412** Tage für delta80
(≈ 2,9 Jahre). Der Wert ist damit **Zentrierungsbasis, kein Befund** — und die Frage ist
**wiedervorlagefähig**, nicht tot. Wiedervorlage: sobald `archiv60m` 773 Handelstage trägt.

### 7.2 Zweig N

`Δ := Ü(Einstieg Schluss[i]) − Ü(Einstieg Eröffnung[i+1])`, gepaart aus zwei
Maschinenläufen auf denselben Signalen, mit derselben Kontrolle, demselben (reparierten)
Placebo und derselben B10-Korrektur (H−1 Verzögerungen) in beiden Läufen. Δ wird aus den
**beiden Läufen** gebildet, nicht aus der Lücke — die Lücke ist die Vorhersage.

### 7.3 Werkzeugprobe

Ohne Ausstiegsregel gilt exakt
`(1 + r_schluss) = (Eröffnung[i+1]/Schluss[i]) · (1 + r_offen)`, also

> `Δ − L = E[L · r_offen] = Cov(L, r_offen) + E[L]·E[r_offen]`

**Der Kreuzterm wird VORAB je Strategie ausgerechnet**, nicht als null angenommen. Die
Toleranz 0,005 Pp des Entwurfs war nicht hergeleitet: bei `sd(L) = 1,7652 Pp` an der Grenze
entspricht sie einer Korrelation von rund **|ρ| = 0,28** zwischen Übernachtlücke und
folgender Innentagesrendite. Übernachtumkehr in dieser Größenordnung ist nicht
ausgeschlossen — die Probe könnte am **realen** Kreuzterm scheitern und wäre dann nicht
diagnostisch. **Neue Fassung:** die geschlossene Vorhersage lautet
`Δ = L + Ê[L·r_offen]`, und die Toleranz ist die **Rechenungenauigkeit** dieser drei
Größen (± 0,001 Pp), nicht null.

Für `rsi2seit-mcp` (Stop-Regel) gilt die Identität **nicht**; genau dort ist der Schalter
die einzige Messmöglichkeit, und genau dort darf die Probe nicht als bestanden gelten.

---

## 8. MDE, delta80 und die Tore

**Testzahl 2** (E1, E3). Schwelle zweiseitig `|t| ≥ 2,241` (α = 0,05/2).
delta80-Faktor `2,241 + 0,8416 = 3,083`.

| Endpunkt | se | MDE | delta80 | Halbbreite `2,241·se` | Marge / Schwelle | Verhältnis |
|---|---:|---:|---:|---:|---:|---:|
| **E1** aggregiert | 0,0075/√693 = **0,000285 Pp** | 0,00057 | 0,00088 | **0,000639 Pp** | ±0,010 Pp | **15,6×** |
| **E1** schlechteste Zelle | — | — | — | **≈ 0,0031 Pp** | ±0,010 Pp | **3,2×** |
| **E3** | 13,8 Mio. Fälle, Verhältnis 1,7652/0,1209 = **14,6** | — | — | — | ≥ 3 | **4,9×** |
| *E2 (beschreibend)* | *0,5986/√9814 = 0,006042* | *0,01208* | — | — | — | — |

**S5 (delta80 unter der Produkthürde 0,10 Pp):** E1 **bestanden mit Faktor 114**
(0,00088 gegen 0,10). E3 braucht keinen p-Wert. **Bestanden.**

**S4 greift für Zweig E nicht** — es regelt, wann eine **Kandidatenhälfte** angefasst werden
darf, und E1/E3 haben keinen Kandidaten und keine Variantenwahl.

**S4/S5 für Zweig N — fünfte deklarierte Abweichung.** Zweig N rechnet acht 60m-Strategien
auf ihren **verbrauchten** Bestätigungshälften neu. S4 wird dafür **abbedungen**, weil sein
Zweck (kein neuer Kandidat aus verbrauchten Daten) durch die Nach-unten-Regel
(Abschnitt 9) **stärker** erfüllt wird als durch S4 selbst. Das steht jetzt in
Abschnitt 13, statt stillschweigend zu gelten.

**Auflösung von Zweig N, ehrlich:** Bei 11,8 bzw. 14,5 Millionen Fällen ist die statistische
Auflösung **nicht** die bindende Schranke. Die systematischen Verschiebungen sind um
Größenordnungen größer: Halbverschiebung der Grenzbasis 0,043 Pp (= 70× E1s MDE, und selbst
nur auf ±0,07 Pp bekannt — also von der Größe der ganzen `t1`-Korrektur), A6-Selbsteinschluss
Faktor 2,11, Wochentagsspanne 0,153 Pp (= 268× E1s MDE). **Jede verbliebene Frage in Zweig N
ist eine Bias-Frage, keine Rauschfrage.** Deshalb Ä1 und Ä3 vor dem ersten Lauf.

---

## 9. Entscheidungsregel — VORAB, wörtlich

### Zweig E

> **E1 (Äquivalenz, je Zelle).** Innerhalb der Sitzung gilt die Schluss-Konvention als
> folgenlos, wenn das Intervall `L ± 2,241·se` in **JEDER** Zelle
> `(Hälfte × Sitzungsposition)` ganz innerhalb von **±0,010 Pp** liegt (= 10 % der
> Kostenhürde). Verlässt **eine** Zelle die Marge, lautet das Urteil für diese Zelle
> „nicht entscheidbar" — **nicht** „Effekt vorhanden" — und die Aggregataussage entfällt.
>
> **Vorzeichenregel, vorab präzisiert (Ä5):** Ein Vorzeichenwechsel zwischen den Hälften
> schadet **nur dann**, wenn eine der beiden Hälften die Äquivalenzmarge verlässt. Grund:
> bei −0,00237 gegen +0,00203 Pp ist der Wechsel eine Eigenschaft der vierten
> Nachkommastelle, nicht der Sache; die Regel 6.5 des Entwurfs hätte E1 daran nichtig
> gemacht. Diese Präzisierung steht **hier**, vor dem Urteil, nicht danach.
>
> **E3 (Schichtungspflicht).** Die Sitzungsgrenze wird als eigene Schicht geführt, wenn
> `sd(GRENZE) ≥ 3 · sd(INNEN)` je Fall. Sonst reicht die Sitzungsposition.

### Zweig N — die Konvention wird abgeleitet, nicht gemessen

> Jede Strategiedatei erklärt `einstiegsZeitpunkt: 'schlusskerze' | 'vortagsschluss' |
> 'sitzungsintern'`. Die Maschine **leitet den Wert per Instrumentierung ab** (Abschnitt 5),
> **prüft** das Vertragsfeld dagegen und **bricht bei Abweichung ab**. Ohne Feld verweigert
> sie. Der Schalter ist nie frei wählbar und wird nie danach gesetzt, welcher Lauf besser
> aussieht. Er steht im Protokoll (D3).

### Zweig N — was die Neumessung ändern darf

> **Nach unten: alles. Nach oben: nichts.**
>
> Ein Urteil darf von „belegt" auf „nicht entscheidbar" oder „widerlegt" fallen. Es darf
> **nicht** steigen. Eine Strategie, deren korrigierter Wert vielversprechend aussieht,
> geht zurück in den Entdeckungsstapel und braucht **frische** Bestätigungstage.
>
> **Schutzvorhersage für `t1` V0 (Ä6), als Intervall:** Der Überschuss springt von
> −0,0040 Pp auf **+0,08 bis +0,12 Pp**; der Standardfehler fällt von 0,0583 auf
> **≈ 0,047** (unter `folgeEroeffnung` verlässt die Übernachtlücke die Handelsrendite, und
> `t1` sitzt zu **99,914 %** auf der Sitzungsgrenze, wo die Lücke je Fall sd 1,7652 Pp hat:
> `Var(Ü_neu) ≈ Var(Ü_alt) − Var(L)`). Daraus **t ≈ 1,6 bis 3,1**.
>
> **Die Ungültigkeit ist vom t-Wert entkoppelt.** Der Grund lautet: *die Bestätigungshälfte
> von `t1` ist verbraucht* — Punkt. **Nicht:** „es reißt die Schwelle ohnehin nicht." Nur die
> erste Begründung hält, wenn die Schwelle fällt, und das wahrscheinlichste Ergebnis liegt
> **auf oder über** der alten Bonferroni-Schwelle 2,690. Eine Schutzvorhersage, die auf der
> falschen Seite ihrer eigenen Schwelle landet, erzeugt genau den Rechtfertigungsdruck, den
> sie verhindern soll.
>
> `rsi2seit-mcp` V4 fällt von +0,0597 auf ≈ +0,0435 Pp — die Korrektur wirkt dort nach
> unten.

### Werkzeugprobe (Sperre vor Schritt 6)

> Der Schalter gilt als richtig gebaut, wenn für jede Zeit-Ausstiegs-Strategie
> `|Δ − L − Ê[L·r_offen]| ≤ 0,001 Pp` **und** der reparierte Placebo unter **beiden**
> Konventionen dasselbe liefert (Differenz unter seiner eigenen Auflösung). Sonst wird
> nichts neu gemessen, bis der Schalter stimmt.

---

## 10. Testzahl und Schwelle

**Testzahl: 2** — E1, E3. Steht als `testfamilie.testsGesamt = 2` in der Messdatei (B8).
**Schwelle `|t| ≥ 2,241`**, dieselbe Schwelle für Signifikanz **und** Äquivalenz. Der
Entwurf hatte hier eine Asymmetrie (Signifikanz Bonferroni-korrigiert, Äquivalenz mit
unkorrigiertem 1,96) — die Korrektur wäre also genau für den **nicht** erwarteten Ausgang
angewandt und für den erwarteten fallengelassen worden. Beide laufen jetzt auf 2,241.

**Was ausdrücklich keine Tests sind:**

- **E2.** Beschreibend, überlebensverzerrt, kein Urteil (Ä4).
- **Die 26 Strategie-Varianten des Zweigs N.** Sie erzeugen kein Urteil: die Konvention
  steht vorher fest, und die Neumessung darf nur nach unten wirken. Berichtet werden
  Punktschätzer und 95-%-Intervall, ohne Sterne.
- **Die Werkzeugprobe.** Geschlossene Vorhersage gegen feste Toleranz.
- **Die Sitzungspositions-Aufschlüsselung und die Wochentags-Empfindlichkeitsrechnung.**
  Beschreibend. Sie dürfen **nicht** dazu benutzt werden, eine „auffällige Position" oder
  einen „auffälligen Wochentag" zu melden — das wäre B9 in Reinform. Wer eine solche
  Aussage will, meldet sie als neuen Test an.
  *Abgrenzung zu Abschnitt 2.3 und Befund 2:* die dortige Verwendung ist **definitorisch**
  (sie begründet den Grenzflag und die Zellstruktur) und behauptet keinen Effekt.

---

## 11. Auflagen

1. **Basisvertrag** (Abschnitt 4), mit Abbruch-Wachhund. **Vor** allem anderen.
2. **Vier Stellen, ein Schalter.** `s0` wird in Signalschleife (Z. 788), Kontrolltopf
   (Z. 223), Querschnitts-Kontrolle (Z. 511) und Placebo (Z. 471) **gleichzeitig** gesetzt.
   Kein zweiter Prüfstand, keine Nachbildung der Kontrolle (D1).
3. **`eroeffnungKurs()` bekommt einen strengen Modus.** Unter `folgeEroeffnung` darf sie
   **nicht** still auf `bars[k−1][1]` zurückfallen — das setzt L mechanisch auf null. Fehlt
   der Eröffnungskurs, fällt das Signal aus und wird gezählt (F4-Zeile, Warnung über 2 %).
4. **Instrumentierte Ableitung** von `einstiegsZeitpunkt` (Abschnitt 5), Vertragsfeld wird
   geprüft, Abweichung ist Abbruch.
5. **Placebo aus dem Komplement**, `schritt == 1` wirft (Abschnitt 6).
6. **Ausstieg bleibt unverändert** bei `Schluss[i+H]`. Folge, die ausgesprochen gehört:
   unter `folgeEroeffnung` hält der Handel H Kerzen **minus die Lücke**.
7. **Stop-Pfad** beginnt weiter bei Kerze i+1 (C6 unberührt); Füllung bleibt „der
   schlechtere aus Stop und erstem handelbaren Kurs" (C7).
8. **A7/F2 unverändert:** der Kontrollausschnitt beginnt weiter bei `i − Fenster − H`.
9. **B10:** L selbst hat H = 1; Δ erbt H der Strategie und wird mit H−1 Verzögerungen
   gerechnet.
10. **`lueckeN`** zählt heute auch Signale, die später mangels Kontrolle ausfallen
    (Z. 785, vor dem `erw == null continue`). Gemessen ≤ 0,12 % — Lücke und Überschuss
    sollen trotzdem über **dieselbe** Signalmenge gemittelt werden.
11. **Pflichtzeilen im Protokoll:** Anteil bitgleicher Fälle; Anteil Signale ohne echten
    Eröffnungskurs; Anteil Signale an der Sitzungsgrenze; **Signalanteil am Basistopf**
    (Ä1d); Verteilung über die Kalenderabstand-Klassen; Zahl der verkürzten Handelstage;
    abgeleiteter und deklarierter `einstiegsZeitpunkt` je Strategie.
12. **Testfälle** in `test-messmaschine.js`: (a) zwei Kunstarchive mit identischen Schluss-,
    Hoch- und Tiefkursen und einer **gesetzten** Eröffnungslücke von 0,50 Pp — die gemessene
    Differenz Δ muss die gesetzte Lücke sein; (b) ein Archiv **ohne** Eröffnungskurse unter
    `folgeEroeffnung` — die Maschine muss verweigern statt zurückzufallen; (c) Basis und
    Überschuss aus verschiedenen Hälften — der Wachhund muss abbrechen; (d) ein Signal, das
    `close[i]` liest, aber `sitzungsintern` deklariert — die Instrumentierung muss abbrechen.
13. **Neuer Katalogeintrag C8:** *„Einstieg zum Schluss der eigenen Auslösekerze. Ein
    Signal, das `close[i]` liest, kann nicht zu `close[i]` gefüllt werden. Die Regel lautet:
    erster handelbarer Kurs echt nach dem letzten Eingabewert von `signal()`. Vorkommen
    25.08.2026: acht von elf Strategien. Was die Maschine tut: `einstiegsZeitpunkt` wird per
    Instrumentierung abgeleitet und gegen das Vertragsfeld geprüft; Abweichung ist Abbruch.
    Die Grenze ist die letzte Kerze des Handelstags, nicht Position 6 — 0,40 % der
    Symbol-Tage sind kürzer."*
14. **Neuer Katalogeintrag A5b:** *„Die Zentrierungsbasis stammt aus einer anderen Hälfte,
    einem anderen Universum oder einem anderen Zellraster als die zentrierte Größe.
    Vorkommen 25.08.2026: `lueckeBasis()` lief über beide Hälften, während die Kontrolle
    daneben trennte — Halbverschiebung 0,043 Pp = 70× die MDE des Endpunkts. Was die
    Maschine tut: Basisvertrag mit Abbruch-Wachhund."*
15. **Ergebnis sofort auf die Platte**, nach `studien/einstiegskonvention-2026-08/`, Code
    und Protokolle als Dateien.

---

## 12. Die größte Gefahr: die Konvention als verdeckter Mehrfachtest (B9/B4)

Die Korrektur wirkt **nicht** einheitlich nach unten. Bei `t1` hebt sie den Überschuss an
und schiebt t von −0,07 auf 1,6–3,1. Wer 26 Varianten unter zwei Konventionen rechnet, hat
52 Zahlen und darf sich aus jeder Zeile die freundlichere aussuchen — mit einem besonders
guten Vorwand: *die Korrektur ist ja richtig.*

Vier Riegel, alle vorab:

1. **Die Konvention ist mechanisch ABGELEITET** (Abschnitt 5), nicht gesetzt und nicht
   gemessen. Abweichung zwischen Ableitung und Vertragsfeld ist Abbruch.
2. **Die alte Zahl wird zurückgezogen, nicht danebengestellt.** Je Strategie genau eine
   gültige Konvention und genau ein gültiges Protokoll. Keine „Fassung A / Fassung B".
3. **Kein Urteil nach oben auf verbrauchter Bestätigung**, unabhängig vom t-Wert (Ä6).
4. **Die Zweig-N-Tabelle wird nach dem Basisvertrag neu gerechnet** und **nicht** mit ihren
   heutigen Zahlen datiert.

**Zweitgrößte Gefahr: A9/F3 in neuer Verkleidung.** Der Grenzflag greift auf
`Position[i+1]` zu und schaut damit eine Kerze weiter als die Signalschleife. Das ist
zulässig (er benutzt nur den Zeitstempel, keinen Kurs), aber es ist genau die Bauart, aus
der C6 entstanden ist. Testfall 12(a) muss zeigen, dass kein Kurswert aus i+1 in die
Signalbildung gerät.

---

## 13. Deklarierte Abweichungen

1. **Die Eichungszahlen standen vor der Entscheidungsregel fest.** Die Archive wurden
   ausgezählt, bevor die Marge 0,010 Pp gesetzt wurde. Zur Einordnung: die Marge ist aus
   der **Produkthürde** abgeleitet (10 % von 0,10 Pp), nicht an die Daten angepasst. Auf
   der Aggregatebene (Halbbreite 0,00064 Pp) kann die Wahl das Urteil nicht getragen haben.
   **Auf der Zellebene kann sie es:** die schlechteste Zelle liegt bei ≈ 0,003 Pp, also nur
   Faktor 3,2 innerhalb — eine Marge von 0,001 Pp hätte dort ein anderes Urteil ergeben.
   Das wird hier gesagt, nicht verschwiegen. Für Zweig N gilt die Vorregistrierung
   vollständig: dort ist noch nichts gemessen.
2. **Die Basiswerte der Zweig-N-Tabelle stammen aus dem ganzen Archiv** und aus **beiden
   Hälften**. Sie sind nach Ä1 **hinfällig** und werden neu gerechnet; sie stehen nur noch
   als Größenordnung im Entwurf.
3. **Der Vorbefund des Prüfers ist nicht reproduziert.** Er nannte für Position 6
   +0,2034 Pp auf 7.031 Fällen; gemessen sind +0,0586 Pp auf 1.956.139 Fällen. Ich verwende
   meine Zahl und weise die Abweichung aus.
4. **Der Plan nannte „sechs 60m-Strategien und drei 1d".** Nachgezählt sind es **acht** 60m
   und drei 1d, also 11 Verträge und 26 Varianten.
5. **S4 wird für Zweig N abbedungen** (Abschnitt 8), begründet durch die Nach-unten-Regel.
6. **`reiheKaputt` ist ein zukunftsabhängiger Ganzreihen-Ausschluss** (11 Reihen 60m,
   58 Reihen 1d) und wird als Abweichung geführt, nicht als B7-konformer Schutz.

---

## 14. Was diese Messung NICHT sagen darf

1. **Nicht:** „Die Schluss-Konvention ist innerhalb der Sitzung als **Marktaussage**
   freigesprochen." Auf 60m ist `Eröffnung[i+1]` in **20,78 %** der Fälle bitgleich
   `Schluss[i]` — derselbe Druck, eine Sekunde später. Was hier null ist, ist eine
   **Eigenschaft des Archivs**. Die echten Innersitzungs-Kosten sind Spanne und
   Marktwirkung; die stehen in `kosten.spanneBp` und sind hier nicht gemessen.
2. **Nicht:** „`Eröffnung[i+1]` ist der wahre Füllkurs an der Sitzungsgrenze." Sie ist eine
   **obere Schranke** der Füllkosten. Schlussauktionsdruck und Nachhandel stehen in keinem
   der beiden Archive.
3. **Nicht:** „Strategie X ist widerlegt / bestätigt." Der Konventionswechsel ändert den
   **Schätzgegenstand**, nicht die Beweislage.
4. **Nicht:** „Die Lücke ist eine Kante."
5. **Nicht:** „`quartalsschub-betrag` ist ein Lückeneffekt und damit unhandelbar." Der
   Detektor liest `close[i]` nicht; die Meldung steht nach Börsenschluss i−1 fest; MOC auf
   Tag i ist zulässig. Der Nenner des 106-%-Verhältnisses (+0,1843 Pp bei MDE 0,3978 Pp)
   ist selbst nicht messbar. Was trägt: *der Ertrag liegt über Nacht* (+0,1928 Pp,
   se 0,0306) — **auf 189 Symbolen, die aus dem heutigen App-Store stammen** (Abschnitt 5).
6. **Nicht:** „Der 60m-Universumswert an der Sitzungsgrenze ist +0,055 Pp." Er ist
   +0,055 ± 0,059 Pp, **nicht entscheidbar**, und die Ursache sind die Tage, nicht die
   Breite. Wiedervorlage bei 773 Handelstagen.
7. **Nichts über delistete Werte.** Fünf Spalten, kein Eröffnungskurs.
8. **Nichts über 1m/5m, Krypto oder Scheine.** Die Produkthürde des Standard-Scheins
   (0,23 Pp je 3 h) liegt obendrauf.
9. **Nicht:** „Die Maschine hat bisher richtig gerechnet." Der Satz aus 14.9 des Entwurfs
   („Nicht: Die Maschine hat bisher falsch gerechnet") wird **gestrichen**. Mit einer Basis
   aus der falschen Hälfte und einem Topf, der bei `winkelgrad` zu **52,6 %** aus dem Signal
   selbst besteht, hat sie für die vielsignaligen Detektoren **falsch gerechnet**. Das ist
   der wertvollste Fund dieses Vorhabens und gehört so berichtet — für den
   Innersitzungs-Anteil ist die Konvention folgenlos, für die S9-Zeile war die Rechnung
   fehlerhaft.

---

## 15. Reihenfolge und Aufwand

| Schritt | Ergebnis | Sperre |
|---|---|---|
| 1 | **Basisvertrag** + Abbruch-Wachhund + Testfall 12(c) | — |
| 2 | Grenzflag, Zellraster (inkl. Kalenderabstand), geschichtete S9-Basis, konditionaler Warntext | nach 1 |
| 3 | **Placebo aus dem Komplement**, `schritt == 1` wirft | — |
| 4 | Alle 11 Protokolle mit korrigierter S9-Zeile neu erzeugen (**nur Anzeige, keine Urteile**) | nach 1–3 |
| 5 | **Instrumentierte Ableitung** von `einstiegsZeitpunkt`, Vertragsfeld in alle 11 Verträge, Prüfung + Abbruch, Testfall 12(d) | — |
| 6 | `einstieg`-Schalter an vier Stellen + strenger `eroeffnungKurs` + Testfälle 12(a)(b) | nach 5 |
| 7 | Kreuzterm `Ê[L·r_offen]` je Strategie ausrechnen, Vorhersagen schriftlich ablegen | nach 1 |
| 8 | **Werkzeugprobe** `\|Δ − L − Ê\| ≤ 0,001 Pp` auf drei Zeit-Ausstiegs-Strategien | nach 3, 6, 7 |
| 9 | **Erst wenn 8 besteht:** acht 60m-Strategien neu messen, alte zurückziehen | nach 8 |
| 10 | C8 + A5b in `FEHLERTYPEN.md`, Befundnotiz, Release-Notiz | — |

**Die Schritte 1–4 lohnen sich auch dann, wenn Schritt 6 nie gebaut wird:** die S9-Zeile ist
heute für genau die zwei Strategien falsch, bei denen sie am meisten zu sagen hätte.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
