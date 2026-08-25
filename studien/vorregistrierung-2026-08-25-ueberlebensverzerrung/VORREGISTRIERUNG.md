# KEINE VORREGISTRIERUNG — warum die Überlebensverzerrung so nicht gemessen wird

**Stand:** 25.08.2026. **Art:** Ablehnungsentscheid mit Datenprogramm.
**Vorgänger:** `studien/entwuerfe-2026-08-25/ueberlebensverzerrung.md` (Entwurf).
**Geprüft von:** zwei Skeptikern (Linse *Vorgriff*, Linse *Auflösung*), beide unabhängig
mit eigenen Skripten auf den echten Daten. Beide Urteile: hält nicht stand, Auflösung
reicht nicht.

Dieses Dokument ist **das Ergebnis**, nicht sein Ausbleiben. Es sagt, was gemessen wurde,
was daran nicht trägt, und welche Datenarbeit die Frage messbar machen würde.

---

## 1. Entscheid in einem Absatz

Die Frage ist richtig gestellt und seit dem ersten Lauf offen: die Zeile E1 steht unter
jedem Protokoll des Projekts und ist unbeziffert. Der Entwurf hat sie aber mit einem
Endpunkt beantworten wollen, der sie **per Konstruktion nicht ausdrücken kann**, mit
einem Wächter, der ein positives Ergebnis **rechnerisch unmöglich** macht, und auf einer
Datenbasis, deren Auswahlfilter **Zukunftswissen** benutzt. Die drei Mängel sind
reparierbar. Was sie **nicht** reparieren, ist der Zustand danach: der Endpunkt, den die
Reparatur zum Primärendpunkt machen müsste, ist auf der Bestätigungshälfte **bereits
angesehen worden** (im Prüflauf der Linse *Auflösung*, +0,0141 Pp, t = 4,26). Und die
Datenbasis deckt **zwei von zwanzig Jahren** und **146 von 6.921** delisteten Tickern ab,
mit einer Lücke, die in dieselbe Richtung zeigt wie der zu messende Fehler.

**Beschluss:** Die Messung wird **nicht** durchgeführt. Zuerst werden Daten geholt
(Abschnitt 6). Danach ist sie neu vorzuregistrieren, auf einer Hälfte, die niemand
gesehen hat.

---

## 2. Die drei tödlichen Mängel, nachgerechnet

### 2.1 Der A7-Endpunkt frisst die Frage auf

Der Primärendpunkt war die gepaarte Tagesdifferenz des **A7-Überschusses**. Die
A7-Kontrolle mittelt je `(Symbol × Sitzungsposition × Hälfte)` über die eigenen Kerzen
desselben Symbols — auf 1d ist die Sitzungsposition konstant 0. Für **P1 breit**, die auf
jeder Kerze feuert, ist die Signalmenge damit **identisch mit dem Kontrolltopf**; der
Überschuss ist eine reine Innerhalb-Symbol-Zentrierung und bis auf das ausgelassene
Lesefenster und die 1-%-Stutzung algebraisch null.

Der Sterbepfad wird vom eigenen Topf herausgemittelt, **weil der Topf der Sterbepfad
ist**: bei einem Zwei-Jahres-Fenster besteht die halbe im Archiv sichtbare Lebensspanne
einer delisteten Reihe nur noch aus ihm.

Beide Skeptiker haben das unabhängig beziffert:

| Größe | ROH (ohne Kontrolle) | A7-Überschuss |
|---|---:|---:|
| die 25 größten Absteiger unter den Delisteten, je Signal | **−1,0627 Pp** | **+0,0053 Pp** |
| Median über 241 Symbole, delistet | +0,3347 Pp | +0,0033 Pp |
| Median über 241 Symbole, überlebend | +0,1905 Pp | −0,0001 Pp |
| **Unterschied der Kohorten** | **≈ 0,14 Pp** | **≈ 0,003 Pp** (Faktor 45 kleiner) |
| gepaarte Tagesdifferenz, Bestätigungshälfte | **+0,0141 Pp, t = 4,26** | **+0,0018 Pp, t = 0,58** |

Werte mit −47,6 % Median-Gesamtrendite kommen als **+0,005 Pp Überschuss** heraus. Das
Urteil „Verzerrung belegt klein" (Regel 5 des Entwurfs) wäre also eine Eigenschaft des
Schätzers gewesen, nicht des Marktes, und wäre gefallen, ob die wahre Verzerrung 0 oder
5 Pp beträgt. Da das Gesamturteil der Studie per Abschnitt 9 als P1s Urteil definiert war,
hätte die ganze Studie dieses Artefakt geerbt. Der einzige Endpunkt mit Inhalt (die
Rohdifferenz) war in 7.2 ausdrücklich als „nicht urteilsbildend" entmachtet.

### 2.2 Der Placebo-Wächter macht „belegt" unerreichbar

`placeboLauf` (`messmaschine.js` Z. 448–470, heute nachgelesen) wählt mit festem Schritt
`schritt[p] = max(1, round(verfuegbar[p] / positionen[p]))`. Für P1 breit ist
`positionen[p]` die Zahl **aller** Kerzen in `[vorlauf, len−H)` und `verfuegbar[p]` zählt
dieselbe Menge → `schritt = 1` → `zaehler % 1 !== 0` ist **nie** wahr. Der Placebo feuert
auf jeder Kerze, mit derselben Kontrolle, demselben Lesefenster, demselben Hälften-Filter.
Seine Signalmenge ist **identisch** mit der von P1.

Folglich `B_placebo == B_P1` und `MDE_placebo == MDE_P1`. Auflage 4 / Regel 1 erklärt die
Auswertung für ungültig, wenn `|B_placebo| > MDE_placebo`; Regel 4 erklärt „belegt", wenn
`|t| ≥ 2,394`, was `|B| > MDE` bereits enthält. Regel 1 wird **zuerst** geprüft. **P1 kann
nie „belegt" liefern**, und Regel 1 reißt P2 und P3 ausdrücklich mit. Die erreichbaren
Ausgänge der Studie waren nur `{ungültig, belegt klein, nicht entscheidbar}`.

Auch nach Reparatur des Schritts bleibt der Konstruktionsfehler: ein kursblinder,
unbedingter Stichprobenzieher über dasselbe Universum hat **dieselbe Erwartung** wie P1.
Der Wächter ist nicht orthogonal zum Endpunkt — er **ist** der Endpunkt.

### 2.3 Vorgriff im Liquiditätsboden

Der in 2.2 des Entwurfs festgeschriebene Boden (Median-Dollarvolumen ≥ 3.447.123 $) wird
über das **ganze Fenster** jeder delisteten Reihe gerechnet — einschließlich des
Volumensprungs am Übernahmetag und der Merger-Arb-Phase danach. Information, die an
keinem Signaltag existierte. Gegen einen punkt-in-Zeit-Boden (Median der ersten
21 Kerzen) gemessen:

| | Reihen | Median-Gesamtrendite | Anteil unter −50 % |
|---|---:|---:|---:|
| allein durch **Spätvolumen hereingeholt** | 26 | **+62,1 %** | 3,8 % |
| allein durch Spätvolumen **hinausgeworfen** | 13 | **−63,9 %** | 53,8 % |

Der Filter lässt systematisch die Übernahmen herein und die Pleiten hinaus — und genau
daran hängt der „wichtigste Einzelbefund" des Entwurfs (2.5). Punkt-in-Zeit lautet er
**Median-Rückgang −7,6 % statt −6,3 %** und **9,5 % statt 6,6 % unter −50 %**.

Zweiter Vorgriff im selben Filter: der Median läuft über die **eigene Fensterlänge**, die
vom Delisting-Datum abhängt. Wer früh stirbt, wird nur an seiner Deal-Phase gemessen
(hohes Volumen, kommt rein); wer spät stirbt, an zwei ruhigen Jahren. Dritter Punkt: der
Boden wird nur auf **einen Arm** des gepaarten Vergleichs angewandt.

---

## 3. Die Auflösung — S5 ist für die Sonde mit Inhalt gerissen

Beide Skeptiker haben `sd_NW(d_t)` direkt auf der Bestätigungshälfte nachgemessen (die
Linse *Vorgriff* bewusst nur die Streuung, ohne Mittelwerte anzusehen). Die Zahlen decken
sich auf drei Stellen:

| Sonde | sd_NW gemessen | sd_NW behauptet | delta80 gemessen | delta80 behauptet | S5 |
|---|---:|---:|---:|---:|:--|
| **P1 breit** | 0,0649 / 0,0651 Pp | 0,0991 | **0,0134 / 0,0135 Pp** | 0,0202 | hält |
| **P3 stärke** | 0,2290 Pp | 0,1521 | **0,0473 Pp** | 0,0311 | hält |
| **P2 rutsch** | **0,6545 / 0,6560 Pp** | 0,2615 | **0,1353 / 0,1356 Pp** | 0,0534 | **gerissen** |

Die Produkthürde ist 0,10 Pp. **P2 liegt darüber** — nach Regel 3 des Entwurfs steht ihr
Urteil damit vorab auf „blind". P2 war ausgerechnet der 1d-Zwilling der Dip-Familie und
der einzige Träger der Übertragung auf `rsi2seit` und `kapitulation`.

**Die Ursache ist nachgewiesen, nicht vermutet.** Abschnitt 8.1 ersetzte bedingtes Feuern
durch zufälliges Ausdünnen mit fester Rate. Auf derselben Hälfte nachgestellt: zufälliges
Ausdünnen auf 3 % gibt `sd_NW = 0,2420 Pp` (reproduziert den Entwurfswert 0,2615 fast
exakt), die **echte** Bedingung „5-Tage-Rendite ≤ −10 %" gibt **0,6545 Pp** — Faktor 2,70.
Zufälliges Ausdünnen kann nicht sehen, dass eine Absturz-Bedingung den fetten Schwanz
auswählt. Dieselbe Rechnung trägt P3.

**Zusammengenommen: die Sonde mit Auflösung (P1) hat keinen Inhalt, die Sonde mit Inhalt
(P2) hat keine Auflösung.**

---

## 4. Das falsche Gewicht — warum jede Pp-Zahl um Faktor 1,7 danebenlag

Der Endpunkt `B = Mittel von w_t·(m_d,t − m_s,t)` ist **proportional zum
Kohortengewicht w**. Der Entwurf skalierte die komplette MDE/delta80-Tabelle auf
**w = 5,78 %** — den Wert über das ganze Fenster. Gezählt:

| Hälfte | w |
|---|---:|
| Entdeckung | **8,19 %** |
| **Bestätigung** | **3,34 – 3,57 %** (je Sonde; P3 4,72 %) |
| ganzes Fenster | 5,78 % |

`w_t` fällt von 4,5 % in den ersten 20 Bestätigungstagen auf **0,12 %** in den letzten 20,
weil die Delisteten über das Fenster wegsterben; vier Tage haben gar kein delistetes
Signal. Der Schätzer, der gegen eine **feste** 0,10-Pp-Hürde gehalten wird, ist damit um
41 % geschrumpft, und das Äquivalenzurteil fällt um Faktor 1,7 zu leicht.

Schärfer formuliert: mit `se(P1) = 0,0042` müsste `|B|` für ein Hürden-Urteil **21,9 se**
erreichen — ein Kohorteneffekt von 2,75 Pp je 5 Tagen (≈ 140 Pp/Jahr). **Der Ausgang
„Verzerrung belegt klein" stand vor dem ersten Lauf fest.** Eine vorregistrierte
Entscheidungsregel, deren Ergebnis rechnerisch determiniert ist, ist keine
Entscheidungsregel — und der Entwurf nannte genau diesen Ausgang in §9 „den praktisch
wichtigsten".

---

## 5. Warum die Reparatur die Studie heute trotzdem nicht rettet

Die naheliegende Reparatur ist bekannt und richtig: Endpunkt tauschen (rohe bzw.
gewichtsfreie Kohortendifferenz `c = m_d,t − m_s,t` primär, A7-Fassung sekundär),
Wächter orthogonal bauen (Etikettentausch: die Marke „delistet" zufällig an nach
Liquidität gepaarte **Überlebende** vergeben), Liquiditätsboden punkt-in-Zeit auf **beide**
Arme, Streuung aus der echten Signalbedingung, Gewicht je Hälfte ausweisen.

Drei Gründe, warum das **heute** keine Vorregistrierung ergibt:

**(a) Die Bestätigungshälfte des reparierten Endpunkts ist verbrannt.** Der Prüflauf der
Linse *Auflösung* hat den Punktschätzer der rohen gepaarten Differenz auf der
Bestätigungshälfte gerechnet und berichtet: **+0,0141 Pp, t = 4,26**, Vorzeichen positiv;
Kohorten-Tagesmittel roh +0,705 (delistet) gegen +0,380 Pp (überlebend). Das ist genau die
Zahl, die die Reparatur zum Primärendpunkt machen würde. Sie kann nicht als zurückgehalten
ausgegeben werden. Frische Bestätigungstage gibt es nicht: das delistete Archiv endet am
**2026-08-21**.

**(b) Die Bestätigungshälfte ist ein anderes Universum als das beschriebene.** Nur **156**
der 256 delisteten Reihen erreichen sie überhaupt (100 sind vor dem Schnitt gestorben);
**146** erreichen das A7-Minimum `n ≥ 20`, **133** die Stutzungsschwelle 50, **104** die
91 Kerzen, die P3 bei `lese = 61` braucht. Das `n ≥ 20`-Kriterium wirft still die am
schnellsten Gestorbenen weg — eine Auswahl nach **Zeit-bis-zum-Tod**, wieder in Richtung
der erwünschten Antwort. Der Entwurf beschrieb durchgehend die Welt der Entdeckungshälfte
(257 Reihen, 65.194 Namenstage, Median 149 Kandidaten je Tag) und stellte sie als Grundlage
des Bestätigungsurteils dar. Die ehrliche Abdeckungszahl lautet **146 von 6.921 = 2,1 %**,
nicht 3,7 %.

**(c) Die Linkstrunkierung drückt die gemessene Größe um einen ungenannten Betrag.** Jede
delistete Reihe beginnt bei 2024-08-23; ein Wert, der im Oktober 2024 verschwindet, steuert
30 Kerzen statt seiner ganzen Lebensspanne bei. Die echte Archivverzerrung kommt aber aus
der **vollen** Historie der fehlenden Namen. Jedes Ergebnis wäre eine Untergrenze
**unbekannter Schärfe** — und im nächsten Protokoll würde daraus die Erlaubnis, die
Überlebens-Warnung E1 leiser zu stellen. Das wäre teurer als gar nicht gemessen zu haben.

---

## 6. Was stattdessen zu tun ist — das Datenprogramm

Die Frage ist gut. Es fehlen Daten, nicht Ideen. In dieser Reihenfolge:

**D1 — Die nie abgefragten 5.394 Ticker holen.** `tagesdaten-stand.json` zeigt: von 6.921
aktienartigen delisteten Tickern wurden **1.505** überhaupt angefragt (1.037 `fertig`,
468 `ohneDaten`). **5.394 wurden nie abgefragt.** Damit fehlen sämtliche Delistings der
Jahre 2004–2023 vollständig — die Dotcom-Nachwehen, 2008/09, der SPAC-Kater 2022/23, also
genau die Zeiträume, in denen Delisting Insolvenz hieß statt Übernahme. Quelle und Format
sind dieselben wie bei den vorhandenen 1.037 (`/v2/aggs 1/day`); der Abruf ist Fleißarbeit,
keine Forschung.

> ### ⚠ KORREKTUR vom 25.08.2026 — an der API nachgemessen, nicht angenommen
>
> Hier stand: *„Ohne Rückschau-Beschränkung abrufen: volle Historie je Ticker, nicht zwei
> Jahre."* **Das geht auf diesem Zugang nicht.** Die Zwei-Jahres-Grenze ist keine
> Abrufentscheidung, sondern eine **Plangrenze** — ein rollendes Fenster.
>
> Gemessen an AAPL: Anfragen ab 2004, 2010, 2015, 2019, 2021, 2022, 2023 und **2024-07**
> geben alle **HTTP 403**; erst ab 2024-10 kommen Kerzen.
>
> Und an genau der Population, die D1 meint — nie abgefragte delistete Werte, mit voller
> Historie angefragt (`range/1/day/1990-01-01/<delisting>`):
>
> | Ticker | delistet | Antwort |
> |---|---|---|
> | LIA | 2010-11-30 | HTTP 403 |
> | KING | 2016-02-24 | HTTP 403 |
> | LOAK | 2020-12-30 | HTTP 403 |
> | KDNY | 2023-08-14 | HTTP 403 |
> | LPTV | **2024-08-09** | HTTP 403 |
> | SILV | 2025-02-18 | 118 Kerzen — aber erst **ab 2024-08-26** |
> | TCGL | 2026-06-15 | 74 Kerzen — ab 2025-10-15 |
>
> **Von den 4.909 nie abgefragten liegen 82 im erreichbaren Fenster, 4.827 davor.** Und
> selbst die erreichbaren liefern nur das Fensterstück, nicht ihre Historie — `SILV`
> beginnt exakt an der Fensterkante.
>
> D1 in der ursprünglichen Form wären rund **17 Stunden Abruf**, fast durchweg mit 403
> beantwortet. `tools/massive-tagesdaten.js` kannte die Grenze übrigens schon; im
> Kommentar steht *„Die Basis-Stufe liefert zwei Jahre; mehr wäre ohnehin nicht drin."*
>
> **Was stattdessen gilt:**
> 1. **Rückwärts ist nichts zu holen.** 5.250 von 6.409 delisteten Stammaktien liegen
>    außerhalb des Fensters; ihre Kurse sind auf diesem Zugang endgültig weg. Wer sie
>    braucht, braucht eine höhere Datenstufe — was die kostet, kann ich von hier nicht
>    beurteilen.
> 2. **Vorwärts sehr wohl.** Die vorhandenen 1.037 Reihen sind **verderblich**: Das
>    Fenster rollt, und in einem Jahr wären die heutigen 2024er Daten nicht mehr
>    abrufbar. Wer regelmäßig die neu delisteten Werte holt, sammelt über Jahre genau die
>    Historie an, die das Fenster sonst wegwirft. In fünf Jahren hätte das Archiv sieben
>    Jahre — durch Nicht-Vergessen, nicht durch Nachkaufen.
> 3. **Sofort holbar:** 130 nie versuchte Ticker im Fenster. Der Abruf läuft.
>
> Der Ablehnungsentscheid dieser Vorregistrierung bleibt davon **unberührt** — er stützte
> sich nie auf D1, sondern auf den A7-Endpunkt, den Placebo mit `schritt = 1` und das
> gerissene S5-Tor.

**D2 — Eröffnungskurs mitnehmen.** Die vorhandenen 1.037 Dateien haben fünf Spalten
`[ms, schluss, volumen, hoch, tief]`. Solange das so bleibt, ist auf der delisteten Seite
keine Stop-Regel und keine Einstiegskonvention `folgeEroeffnung` messbar — und die
Einstiegskonvention-Studie (Rang 3) kann über delistete Werte grundsätzlich nichts sagen.
Beim Neuabruf die sechste Spalte mitnehmen.

**D3 — Abdeckungslücke beziffern, bevor gemessen wird.** Auch im heutigen Fenster fehlt
ein Fünftel (1.221 Delistings, 988 mit Kursdatei = 80,9 %), und von den 233 Fehlenden kamen
93 mit 0–19 Kerzen zurück. Wer bei der Quelle keine Kurse mehr hat, ist typischerweise der
ausgesetzte, der insolvente, der von der Börse geworfene Wert. **Die Korrektur ist selbst
überlebensverzerrt, in dieselbe Richtung.** Nach D1 ist diese Quote je Kalenderjahr zu
zählen und im Protokoll zu führen.

**D4 — Erst danach neu vorregistrieren**, mit: gewichtsfreier Kohortendifferenz als
Primärendpunkt und `w_t` als getrennt ausgewiesener Zeitreihe (dann ist die Verschiebung
eines beliebigen Archivs `w·c` und für jedes Gewicht nachrechenbar); Etikettentausch-Wächter
statt Placebo; punkt-in-Zeit-Liquiditätsboden auf beide Arme; Streuung aus der echten
Signalbedingung; und einer Gegenprobe gegen die eigene Konstruktion (Kunstarchiv mit
**eingebauter, bekannter** Verzerrung — etwa 200 Überlebende künstlich am Fensterende um
−40 % laufen lassen und als „delistet" markieren; findet die Maschine sie nicht wieder,
ist der Endpunkt widerlegt, bevor echte Daten angefasst werden). **Diese eine Gegenprobe
hätte beide tödlichen Mängel vor dem ersten echten Lauf gefunden.**

---

## 7. Was aus diesem Ablehnungsentscheid **berichtet** werden darf

Als **beschreibender Befund ohne Urteil**, mit dem Vermerk, dass er auf einer angesehenen
Bestätigungshälfte und einem rückschauend gefilterten Universum steht:

> Im Fenster 2024-08 bis 2026-08 laufen **liquide** US-Werte vor ihrem Verschwinden
> **besser** als die Überlebenden, nicht schlechter: rohe gepaarte Tagesdifferenz
> +0,0141 Pp (t = 4,26), Kohortendifferenz +0,33 Pp je 5 Tagen. Der Grund ist die
> Zusammensetzung — ein liquider Wert, der verschwindet, wird in der Regel übernommen,
> und die Prämie steht am letzten Handelstag schon im Kurs. Die Vorstellung
> „Delisting = Totalverlust" gilt für den illiquiden Schwanz, und den hat das Kursarchiv
> nie enthalten.

Und was daraus **nicht** folgt:

1. **Nicht:** „Die Überlebensverzerrung des Projekts ist beziffert." Zwei von zwanzig
   Jahren, 146 von 6.921 Tickern, und ausgerechnet das Ende, in dem Übernahmen dominieren.
2. **Nicht:** „Die Verzerrung zeigt nach oben." Das Vorzeichen dieses Fensters ist eine
   Aussage über liquide Übernahmen, nicht über 2008/09.
3. **Nicht:** „Die Verzerrung ist klein, also ist Momentum/rsi2seit doch belegt." Der
   Belegstand bleibt **NULL belegte Kanten**.
4. **Nicht:** „Auch `rsi2seit` und `kapitulation` sind sauber." Für 60m gibt es **keine
   einzige** delistete Reihe; `massive/` enthält nur `tagesdaten/`.
5. **Nicht:** „E1 darf jetzt leiser gestellt werden." E1 bleibt in jedem Protokoll,
   unverändert, bis D1–D4 durch sind.

---

## 8. Was in den Fehlerkatalog gehört

| # | Fehler | Beleg vom 25.08.2026 |
|---|---|---|
| **A10** | **Die Kontrolle absorbiert den Effekt, den die Studie sucht.** Wenn die Signalmenge den Kontrolltopf **ist** (Sonde feuert auf jeder Kerze) oder der Topf überwiegend aus dem gesuchten Zustand besteht, ist der Überschuss algebraisch null — unabhängig von der Wahrheit. | 25 größte delistete Absteiger: ROH −1,0627 Pp, A7-Überschuss **+0,0053 Pp**. Abhilfe: vor der Vorregistrierung prüfen, welcher Anteil des Kontrolltopfes aus dem gesuchten Zustand stammt. |
| **SP3** | **Der Placebo ist nicht orthogonal zum Endpunkt.** Ein kursblinder Stichprobenzieher über dasselbe Universum mit `schritt = 1` hat dieselbe Signalmenge wie eine breit feuernde Sonde; der Wächter macht dann ein positives Urteil unmöglich. | `placeboLauf` Z. 457: `schritt = max(1, round(verfuegbar/positionen))`. Abhilfe: `schritt == 1` als **Fehler werfen**, nicht still zulassen; Wächter aus dem Komplement oder per Etikettentausch. |
| **B11** | **Filter, der Zukunftsdaten liest.** Ein Auswahlkriterium über das ganze Fenster ist ein Vorgriff, wenn das Fenster nach dem Signaltag weitergeht — hier holt der Volumenboden Übernahmen herein und wirft Pleiten hinaus. | 26 Reihen hereingeholt (+62,1 %), 13 hinausgeworfen (−63,9 %). Abhilfe: punkt-in-Zeit, rollend, auf **alle** Arme gleich. |
| **B12** | **Planungsstreuung aus zufälligem Ausdünnen statt bedingter Auswahl.** Faktor 2,70 zu klein, S5 dadurch scheinbar bestanden. | P2: Proxy 0,2420 Pp gegen echte Bedingung 0,6545 Pp. Abhilfe: `sd_NW` je Sonde **mit der echten Signalbedingung** auf der Entdeckungshälfte rechnen. |
| **B13** | **Der Endpunkt ist mit einem Gewicht skaliert, die Hürde nicht.** `B ∝ w`; ein w-skalierter Schätzer gegen eine feste Hürde macht das Äquivalenzurteil automatisch. | `|B|` hätte 21,9 se erreichen müssen. Abhilfe: gewichtsfreie Größe berichten, Gewicht getrennt. |

---

## 9. Anerkennung dessen, was der Entwurf richtig gemacht hat

Damit dieser Entscheid nicht als Abwertung gelesen wird: die Fallzählung des Entwurfs war
**ehrlich und reproduzierbar**. Beide Skeptiker haben 2.242 Überlebende, 1.062.522
Namenstage, 65.172–65.194 delistete Namenstage und w = 5,78 % über das Fenster exakt
reproduziert; auch die `reiheKaputt`-Treffer stimmen (EQC −93 %, MULN 21,8 Mio $/Aktie,
dazu SDM −86 %, das der Entwurf mitzählte, aber nicht nannte). Die Paarung wirkt wie
behauptet: das Tagesmittel der Überlebenden allein streut mit 3,4–5,5 Pp, die Paardifferenz
mit 0,065–0,11 Pp. Die Entscheidung „K1 messen, K2 rechnen" ist richtig, und die verworfene
Alternative (synthetische Kerzen) wurde aus dem richtigen Grund verworfen.

Der Entwurf ist nicht schlampig. Er **misst das Falsche mit dem falschen Wächter** — und
das ist genau die Fehlerklasse, gegen die die Mühle gebaut ist. Dass sie hier vor dem
ersten echten Lauf gefunden wurde, ist der Zweck des Verfahrens.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
