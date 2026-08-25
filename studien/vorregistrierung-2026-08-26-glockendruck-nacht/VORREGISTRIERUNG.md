# Vorregistrierung — `glockendruck-nacht`

**Geschrieben am 26.08.2026 vom Strategie-Tüftler, bevor irgendeine Rendite gerechnet wurde.**
Der Tüftler misst nicht. Alle Zahlen unten sind Anzahlen und Streuungen; kein Mittelwert
einer Rendite wurde berechnet, gedruckt oder abgelegt. Werkzeuge:
`studien/tueftler/werkzeug/zaehle-uebernacht.js` und `…/zaehle-bedingungen.js`,
Rohausgabe unter `studien/tueftler/daten/`.

---

## 0. Warum diese Vorregistrierung überhaupt interessant ist

Nicht wegen der These. Wegen der **Auflösung**.

Der Korpus des Projekts hat einen Median-`delta80` von **0,605 Pp** — das kleinste Objekt,
das eine typische bisherige Messung hätte sehen können. Die Kostenhürde liegt bei 0,04 Pp
(Aktie) bis 0,10 Pp (CFD). Jede bisherige Messung war also mit einem Lineal geführt, dessen
kleinster Strich sechs- bis fünfzehnmal größer war als das gesuchte Objekt.

Dieser Entwurf hat einen gerechneten `delta80` von **0,0397 Pp** (2 Tests). Das ist
**Faktor 15,2 schärfer als der Korpus-Median** und liegt erstmals *unterhalb* der
Kostenhürde der Aktie und *Faktor 2,5 unterhalb* der Kostenhürde des CFD.

Der Grund ist nicht Klugheit, sondern Arithmetik, und er ist auf drei Zeilen erklärbar:

| Hebel | Wirkung |
|---|---|
| **H = 1, keine Überlappung** | Newey-West hat null Verzögerungen zu korrigieren. B10, das aus `momentum` t 4,74 → 0,74 gemacht hat, greift hier nicht. |
| **Das Übernachtfenster streut wenig** | Tagesstreuung des Querschnittsmittels: **0,880 Pp** über Nacht gegen **1,474 Pp** über den vollen Tag — und gegen die 2,8 Pp, auf die die Auflösungswand geeicht ist (dort steckte eine mehrtägige Haltedauer drin). |
| **Maximale Dichte in TAGEN** | Das Signal feuert an praktisch jedem Handelstag: **4.665 Bestätigungstage** statt der 241–361, mit denen der bisherige Korpus arbeitet. |

Da die Wand quadratisch in der Tagezahl ist, ist der dritte Hebel der größte. Das ist der
eine Ausweg, den die Rolle ausdrücklich sucht: **hohe Signaldichte**, gemessen in Tagen,
nicht in Signalen — mehr Signale *je Tag* kaufen nachweislich nichts
(`PLAN-NAECHSTE-STUDIEN.md`, Rang 1: 154 → 1.000 Signale/Tag ändert die MDE um 0,9 %).

**Beide Antworten sind wertvoll**, und das ist die Bedingung des Plans für eine Studie:
- JA → die erste handelbare Kante der Projektgeschichte, auf dem Basiswert, bei maximaler Dichte.
- NEIN → das **Sitzungsgrenzen-Fenster ist über 40 Jahre unterhalb von 0,04 Pp geschlossen.**
  Das ist eine obere Schranke von einer Schärfe, die dieses Projekt noch nie erreicht hat,
  und genau die Sorte Aussage, die Abschnitt 6 des Plans als M1 einfordert.

---

## 1. Frage

Zahlt das Übernachtfenster einen **Überschuss über den eigenen Langfristdurchschnitt
desselben Symbols**, wenn der Schluss des Vortags am unteren Rand seiner Tagesspanne lag —
und liegt dieser Überschuss über der Kostenhürde des gehandelten Produkts?

## 2. Mechanismus — wer zahlt hier wem wofür

Um 16:00 Uhr New Yorker Zeit wechselt der Grenzhalter. Wer innertags mit Hebel handelt,
**muss** flach sein: Übernachtfinanzierung, Nachschussgrenzen, interne Risikolimits. Dazu
kommt Fluss aus Auftragsarten, die nicht nach dem Preis fragen, sondern nach dem Zeitpunkt
(Market-on-Close). Keiner dieser Verkäufer ist preisempfindlich; alle haben dieselbe Uhr.

Das Lager, das sie abgeben, muss jemand über Nacht halten — und über Nacht kann man eine
Position nicht bewirtschaften: kein Stop, kein Ausstieg, keine Absicherung. Wer sie nimmt,
schreibt eine Lückenoption und verlangt dafür eine Prämie. **Das ist eine Risikoprämie, kein
Fehler des Marktes** — und deshalb wäre sie nicht wegarbitriert, wenn es sie gibt.

Beobachtbar ist der Druck nicht direkt (Auktionsungleichgewichte liegen nicht vor), aber in
einer Größe, die das Tagesarchiv seit 1986 trägt: **wo im Tagesbereich der Schluss lag.**
Ein Schluss am Tagestief heißt, dass der letzte Grenzhändler des Tages noch verkaufte, als
die Glocke ging.

**Abgrenzung zu `t1-zwangsglattstellung`, und sie ist nicht kosmetisch.** T1 fragt: *war
heute ein großer Minustag?* (`tagRet ≤ −k · sd`). Diese Bedingung fragt: *war der letzte
Handel des Tages ein Gedrängter?* Eine Aktie kann 3 % im Plus stehen und trotzdem auf dem
Tagestief schließen. Die beiden Bedingungen sind nur schwach verwandt, und die zweite ist
näher am Mechanismus. T1 lief außerdem auf 60m über 361 Bestätigungstage; hier sind es
4.665 auf 1d.

## 3. Signalregel — vollständig, vor der Messung festgelegt

Zeitrahmen **1d**, Archiv `E:/Markt-Dashboard-Archiv/archiv1d`, Universum **CS + ADRC**
nach `wertpapierart.js` (keine Namensliste).

Je Handelstag *i* und Symbol:

1. **Zulassung:** Umsatz(i) = Schluss(i) × Stück(i) ≥ **5 Mio $** (derselbe Schnitt wie
   Studie 2), Hoch(i) > Tief(i), Eröffnung(i+1) vorhanden und > 0.
2. **Kennzahl:** `S = (Schluss(i) − Tief(i)) / (Hoch(i) − Tief(i))`.
3. **Auswahl:** `S` im **untersten Quintil** des an diesem Tag zugelassenen Querschnitts.
   Genau ein Quintil. Keine Dezil-, Terzil- oder Schwellenvariante — jede wäre ein
   weiterer Test, und an genau dieser Stelle hat sich das Projekt schon zweimal verzählt.
4. **Richtung:** long.
5. **Zweig N (primär):** Einstieg Schluss(i), Ausstieg **Eröffnung(i+1)** — das Nachtbein.
6. **Zweig T (Trennschärfe):** Einstieg **Eröffnung(i+1)**, Ausstieg Schluss(i+1) — das
   Tagbein. Läuft mit der heutigen Maschine über `einstieg: 'folgeEroeffnung'`, H = 1.

`leseFensterKerzen: 61` — die Kontrolle muss die 60 Kerzen aussparen, die das Signal
gelesen hat, sonst entsteht die Nullpunktverschiebung **A6/A7**.

**Gemessener Signalanteil, vorab gezählt: 19,8 %** des zugelassenen Querschnitts, an
praktisch jedem Handelstag. (Die Hausregel dazu stammt aus `kanalUeber`, das auf 52,7 % der
Kerzen feuerte und nie verwarf: der Signalanteil steht **vor** dem Lauf, nicht danach.)

## 4. Datenbasis und Machbarkeits-Check

Gezählt am 26.08.2026 auf einer Stichprobe von **400 Symbolen** (jedes ~5,6-te von 2.249
zugelassenen Reihen; 2.965 Reihen im Archiv insgesamt):

| Größe | Wert |
|---|---|
| Reihen von F1 (`reiheKaputt`) verworfen | 5 von 400 (1,3 %) |
| Extremwerte ausgeworfen (\|r\| > 25 Pp) | 310 von 1.597.906 (0,02 %) |
| Symbol-Tage nach Liquiditätsschnitt | **1.597.906** |
| Handelstage mit Breite ≥ 20 | **9.329** (19.11.1986 – 20.08.2026) |
| **Bestätigungshälfte (B5)** | **4.665 Tage ab 05.02.2008** |
| Breite der Auswahl, Median | 34/Tag in der Stichprobe (≈ 190/Tag im vollen Universum) |
| Umsatz-Median der Auswahl | **34,3 Mio $** (Gesamtkorb 37,2 Mio $) |

**Streuung und Nachweisgrenze** (Bestätigungshälfte, Tagesmittel des Querschnitts):

| Größe | Wert |
|---|---|
| Streuung σ der Tagesmittel | **0,8795 Pp** |
| se = σ / √4.665 | **0,01288 Pp** |
| MDE (Hausmaß, `mdeFaktor` = 2) | **0,0258 Pp** |
| `delta80` bei 1 Test (\|z\| ≥ 1,960) | 0,0361 Pp |
| **`delta80` bei 2 Tests (\|z\| ≥ 2,2414)** | **0,0397 Pp** |
| Korpus-Median `delta80` der 38 Varianten | 0,605 Pp → **Faktor 15,2 schärfer** |

**Gegenprobe zur Breite:** bei 150 statt 400 Stichprobensymbolen fällt σ auf 0,838 Pp — die
Streuung hängt also kaum an der Breite, sie wird vom gemeinsamen Marktzug beherrscht. Das
deckt sich mit dem eigenen Befund des Projekts (154 → 1.000 Signale/Tag ändert die MDE um
0,9 %) und heißt: **die Hochrechnung auf das volle Universum verändert `delta80` nicht
wesentlich.** Die Zahl 0,0397 Pp steht.

**Kostenhürden zum Vergleich** (`signalstudie-2026-08/BERICHT.md`, gültig für US-Großwerte
2026 und für sonst nichts): Aktie 0,04 — Schein ATM 0,05 — CFD 0,10 — Standard-Schein 0,23,
je Umlauf.

## 5. Warum die naheliegende Fassung dieses Entwurfs verworfen wurde

Der erste Entwurf der Nacht nahm als Bedingung den **Nachtanteil des Risikos**
`V = sd(60 Übernachtlücken) / sd(60 Innentagesbewegungen)` — höchstes Quintil. Er wurde vom
eigenen Machbarkeits-Check erledigt:

> **Beharrlichkeit 0,943.** 94,3 % der Werte im obersten V-Quintil waren schon am Vortag
> darin; die Zufallserwartung ist 0,198.

Die Kontrolle der Maschine (A7) zieht jedem Symbol seinen **eigenen** Langfristmittelwert
ab. Ein Merkmal, das Nacht für Nacht dieselben Werte wählt, ist faktisch eine feste
Symbolneigung — und die ist per Konstruktion null Überschuss. Der Kopf von
`t1-zwangsglattstellung.js` sagt genau das seit dem 23.08.; der Entwurf wäre ohne diesen
Check als scheinbar tragfähig in die Warteschlange gegangen.

Die Bedingung wurde deshalb aus einer vorab benannten Liste von fünf gewählt, **nach
Beharrlichkeit und Streuung, ohne einen einzigen Ertrag anzusehen**:

| Bedingung | Beharrlichkeit (Zufall 0,198) | σ (Pp) | Urteil |
|---|---|---|---|
| A Nachtanteil `V` | **0,943** | 0,934 | verworfen — A7 kürzt sie weg |
| **B Schlussdruck `S`** | **0,200** | **0,880** | **gewählt** |
| C Umsatzschock | 0,486 | 0,883 | halb beharrlich, schwächerer Mechanismus |
| D Spannenschock | 0,283 | 0,923 | brauchbar, aber unschärfer am Mechanismus |
| E Druck **und** Schock | 0,190 (Zufall 0,106) | 0,896 | halbiert die Breite ohne Gewinn |

Dass die Wahl ohne Ertragsblick fiel, ist der Grund, warum dieser Vergleich **keine Tests
verbraucht.** Er steht hier, damit niemand ihn später für eine verdeckte Suche halten muss.

## 6. Endpunkte, Testzahl, Entscheidungsregel

**Testzahl: 2.** Zweig N (Nacht) und Zweig T (Tag). Schwelle **|t| ≥ 2,2414** (Bonferroni,
zweiseitig, α = 0,05). Tagesgeclustert, Newey-West mit H−1 = 0 Verzögerungen.
Kampagnenweite Schwelle (8 Tests, |z| ≥ 2,73) wird **zusätzlich** ins Protokoll geschrieben.

**Zweig T ist keine zweite Chance, sondern die Trennschärfe.** Wenn der Effekt eine
Prämie für das Halten über die Sitzungsgrenze ist, sitzt er im Nachtbein und **nicht** im
Tagbein. Sitzt er im Tagbein genauso oder stärker, ist es gewöhnliche kurzfristige
Gegenbewegung — dann wird ein JA aus Zweig N **zurückgenommen**, unabhängig von seinem t.

| Ausgang | Bedingung |
|---|---|
| **JA** | Zweig N: Überschuss ≥ **0,10 Pp** je Umlauf **und** \|t\| ≥ 2,2414 **und** Zweig T trägt weniger als die Hälfte davon |
| **NEIN, Familie geschlossen** | Zweig N: obere Grenze (Überschuss + 1,96 · se) < **0,04 Pp** |
| **nicht entscheidbar** | sonst — mit Angabe, wie viele Tage für 0,04 Pp nötig wären |
| **ungültig** | der Placebo schlägt an, oder ein Gatter aus Abschnitt 7 reißt |

Die JA-Schwelle steht bewusst auf der **CFD-Hürde (0,10)** und nicht auf der Aktienhürde:
Ein JA soll auf dem Produkt handelbar sein, das die App wirklich benutzt. Die NEIN-Schwelle
steht auf der **Aktienhürde (0,04)**, weil ein Ausschluss dort am meisten schließt.
`delta80` = 0,0397 Pp liegt unter beiden — **beide Zweige sind erreichbar.** Das ist bei
keiner Studie des laufenden Plans außer Studie 3 der Fall.

## 7. Gatter — jedes einzeln bindend, alle vorab

1. **Eröffnungskurs-Bereinigung (härtestes Gatter, vor allem anderen).** Die ganze Studie
   hängt daran, dass Eröffnung und Schluss **derselben Zeile** gleich bereinigt sind. Sind
   Schlusskurse dividendenbereinigt und Eröffnungskurse nicht, trägt **jede** Übernachtrendite
   an Ex-Tagen einen systematischen Abschlag — ein Fehler genau der Klasse, die hier schon
   zweimal zugeschlagen hat (Zeitzonen-Fehler der Ergebnis-Drift, Stempel-Kerzen der Quelle).
   Prüfung: Verteilung von Eröffnung(i+1)/Schluss(i) an bekannten Split- und Ex-Tagen gegen
   gewöhnliche Tage. Reißt das Gatter, **entfällt das Urteil** — nicht die Zahl wird
   korrigiert, sondern die Studie ausgesetzt.
2. **#85 — laufende Kerze.** Die letzte Kerze jedes Abrufs wird verworfen. **Neu gemessen
   am 26.08.: das betrifft auch das Tagesarchiv**, nicht nur 60m — 56 % einer 80er-Stichprobe
   hatten in der letzten Kerze weniger als 60 % des Median-Volumens (AAPL 24.08.: 15,0 Mio
   Stück gegen 46,8 Mio am Vortag; `stand` = 24.08. 17:27 UTC, also mitten in der Sitzung).
3. **Vorgriff C8, offen ausgewiesen.** Das Signal liest Schluss(i) und füllt zu Schluss(i).
   Das ist ein Vorgriff auf die eigene Auslösekerze: Eine Market-on-Close-Order muss
   *vor* der Auktion liegen, `S` ist dann noch nicht bekannt. **Die gemessene Zahl ist
   deshalb eine OBERE SCHRANKE der handelbaren Kante, keine Messung davon.**
   Daraus folgt sauber: Ein **NEIN ist gültig** (die obere Schranke schließt die
   handelbare Fassung erst recht). Ein **JA ist vorläufig** und verlangt als Nachlauf die
   ausführbare Fassung (`S` aus den ersten sechs 60m-Kerzen, Einstieg in der Schlussstunde).
4. **Placebo mit gleicher Bauform.** Kein kursfreies Signal beliebiger Feuerdichte — der
   Placebo muss denselben Signalanteil (19,8 %) und dieselbe Querschnittsbreite je Tag
   nachbilden, sonst prüft er etwas anderes. Er muss **auch in der Zeit** gewürfelt werden.
5. **Überlebensverzerrung ausgewiesen.** `archiv1d` enthält nur Überlebende. Richtung der
   Verzerrung in den Bericht; als Gegenprobe die 1.037 delisteten Reihen — die decken
   allerdings nur 2024–2026 ab und können die Bestätigungshälfte nicht ersetzen.
6. **Ären beschreibend, nicht urteilend.** Vor 2001 (Bruchpreise) gegen danach getrennt
   ausweisen. Geurteilt wird ausschließlich auf der Bestätigungshälfte, die vollständig
   nach der Dezimalisierung liegt.
7. **Kostenzahl als unbelegt kennzeichnen.** 0,04 Pp ist eine Zahl für die *notierte
   Spanne*. Dieser Handel füllt in der **Schluss- und der Eröffnungsauktion**, und was eine
   Auktionsfüllung wirklich kostet, hat dieses Projekt nie gemessen. Solange das offen ist,
   trägt jede Netto-Aussage diesen Vorbehalt. (Auftragsvorschlag dazu in der Warteschlange.)

## 8. Was diese Studie nicht beantwortet

- **Nicht**, ob das Übernachtfenster *unbedingt* zahlt. Die A7-Kontrolle zieht jedem Symbol
  seinen eigenen Nachtdurchschnitt ab; der unbedingte Teil (+0,038 Pp/Tag laut
  `PLAN-NAECHSTE-STUDIEN.md` §5) fällt per Konstruktion heraus. Gemessen wird
  ausschließlich: *zahlt eine gedrängte Nacht mehr als eine gewöhnliche Nacht desselben Werts.*
- **Nicht**, ob 252 Umläufe im Jahr in einem echten Depot durchführbar sind. Bei 0,04 Pp je
  Umlauf sind das 10,1 Pp Kosten im Jahr, bei CFD 25,2 Pp. Die Depotfrage ist eine eigene.
- **Nicht** den Standard-Schein. 0,23 Pp × 252 = 58 Pp Kosten im Jahr; das Produkt ist für
  diesen Handel tot, bevor gerechnet wird, und wird ausdrücklich nicht gemessen.

## 9. Was gebaut sein muss, bevor gemessen wird

Ein Schalter `ausstieg: 'schluss' | 'folgeEroeffnung'` in `messmaschine.js` — das
Spiegelbild des bereits vorhandenen `einstieg`-Schalters. Er muss an **allen drei Stellen
zugleich** greifen (Signal, Kontrolltopf, Placebo), sonst werden zwei verschiedene
Ausführungen verglichen und der Unterschied Effekt genannt: der **C7**-Fehler, der hier
schon aus t 5,96 ein t −0,75 gemacht hat. Mit Testfall nach dem Muster von C6/C7.
Zweig T läuft ohne diese Änderung.

*Auftrag an eine Bausitzung; steht als Vorschlag in `studien/tueftler/WARTESCHLANGE.md`.
Der Tüftler ändert keinen Maschinencode.*

---

**Status:** wartet auf Messung. Die beschlossene Sperre gilt — gemessen wird erst, wenn die
zwölf Strategien auf dem versionierten Instrument neu gemessen sind. Vorregistrieren ist
davon nicht berührt.
