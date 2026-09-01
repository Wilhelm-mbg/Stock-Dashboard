# Ergebnis — `glockendruck-haltedauer` (Kosten unter die Kante)

**Gemessen 01.09.2026**, Messmaschine 1.6.2, `archiv1d` (2.213 CS/ADRC-Reihen,
B5-Schnitt 2006-08-16). Protokolle `glockendruck-nacht-{h2,h3,h5,h1l,h2l,h3l,h5l}-2026-09-01.json`.
**Familie `glockendruck-haltedauer-2026-09`: 7 Tests, Schwelle |t| ≥ 2,6901**
(aus der Maschine). Kostenschwelle **K = 0,110 Pp** je Runde
(*vorläufig — Freigabeschwelle der Kostenmessung unerfüllt*, Nachtrag §4);
Finanzierung **F ≈ 0,0247 Pp/Nacht** für gehebelte Long-Aktien-CFDs
(Capital.com-Gebührenseite: 4 % p. a. + Benchmark, /365; ungehebelte 1:1-Positionen
laut Quelle ohne Übernachtfinanzierung).

## Urteil

> ## **Für KEIN H übersteigt die kumulierte Kante die reale Kostenverteilung.**
> Breit: H=2 **nicht entscheidbar** (+0,0604 Pp, t 2,22 — unter Schwelle und unter K),
> H=3 und H=5 **nicht messbar** (delta80 0,155 / 0,267 > K — die vorab gerechnete
> Auflösungswand, für H=5 wie registriert vorhergesagt). **Liquide (≥ 1 Mrd $):
> der Effekt überlebt den Schnitt nicht** — H=1 liquide +0,0234 Pp (t 0,68), ab H=2
> Punktschätzer ≈ 0 bis negativ; alle vier liquiden Läufe an K nicht messbar
> (delta80 0,122–0,548). **Der glockendruck-Überschuss lebt dort, wo er nicht
> handelbar ist — das ist der im Nachtrag vorgesehene Befund, kein Scheitern der
> Studie.**

## Zahlen — Kandidaten und Placebo in einer Tabelle (Bestätigung, Urteilshälfte)

| Lauf | Überschuss (Pp/Runde) | se | t | delta80 | Tage | Urteil nach §4 + Nachtrag |
|---|---|---|---|---|---|---|
| **H=2 breit** | **+0,0604** | 0,0272 | 2,22 | 0,0961 | 5.038 | **nicht entscheidbar** (kein JA: < K und t < 2,69; kein NEIN: obere Grenze 0,134 > K) |
| *Placebo (H=2-Lauf)* | *+0,0110* | — | *0,43* | *MDE 0,0516* | — | *bestanden* |
| **H=3 breit** | +0,0651 | 0,0439 | 1,48 | **0,1549 > K** | 5.037 | **nicht messbar** |
| *Placebo (H=3-Lauf)* | *+0,0146* | — | *0,35* | *MDE 0,0825* | — | *bestanden* |
| **H=5 breit** | +0,0712 | 0,0757 | 0,94 | **0,2673 > K** | 5.035 | **nicht messbar** (wie vorab deklariert) |
| *Placebo (H=5-Lauf)* | *+0,0145* | — | *0,20* | *MDE 0,1434* | — | *bestanden* |
| **H=1 liquide** | +0,0234 | 0,0345 | 0,68 | **0,1218 > K** | 1.975 | **nicht messbar**; Punkt ≈ halbiert vs. breit (+0,0444) |
| *Placebo (H=1l-Lauf)* | *−0,0047* | — | *−0,26* | *MDE 0,0363* | — | *bestanden* |
| H=2 liquide | −0,0024 | 0,0669 | −0,04 | 0,2364 | 1.974 | nicht messbar |
| H=3 liquide | −0,0372 | 0,0974 | −0,38 | 0,3439 | 1.973 | nicht messbar |
| H=5 liquide | −0,1002 | 0,1552 | −0,65 | 0,5482 | 1.971 | nicht messbar |
| *Placebos (H=2/3/5l)* | *+0,0567 / +0,0101 / −0,0388* | — | *1,41 / 0,18 / −0,42* | *je < MDE* | — | *alle bestanden* |

Referenz H=1 breit (gemessen 01.09., eigene Familie): +0,0444, t 3,71, delta80 0,0417.

**Grenzertrag der Zusatznächte (NUR NACHRICHTLICH, rückprall-frei per Bauart):**
Nacht 2: +0,0160 Pp; Nacht 3: +0,0047; Nächte 4–5: +0,0061 zusammen — im Mittel
**~+0,007 Pp je Zusatznacht**. Das ist weniger als ein Drittel der Finanzierung
F = 0,0247: **gehebelt ist jede Zusatznacht netto negativ** (Kosten(H) = K + F·H
wächst schneller als die Kante). Ungehebelt (F = 0) wächst die Kante zu langsam:
selbst der H=5-Punktschätzer (+0,0712, nicht messbar) bleibt unter K = 0,110.
Der kleine Grenzertrag stützt zugleich den Rückprall-Vorbehalt des Originals:
was über Nacht 1 hinaus kein frisches Geld bringt, sieht nach Einstiegs-Artefakt
plus einmaliger Prämie aus, nicht nach persistenter Drift.

## Die Kostenformel, ausgefüllt (Punktschätzer gegen Kosten je Fassung)

| H | Kante (Punkt, breit) | CFD gehebelt K+F·H | CFD ungehebelt K | Aktien-Broker ~0,06 (nachrichtlich) |
|---|---|---|---|---|
| 1 | +0,0444 (belegt) | 0,135 ✗ | 0,110 ✗ | 0,06 ✗ |
| 2 | +0,0604 (n. entsch.) | 0,159 ✗ | 0,110 ✗ | 0,06 (+0,000; Punkt knapp drüber, t 2,22 unbewiesen) |
| 3 | +0,0651 (n. messbar) | 0,184 ✗ | 0,110 ✗ | 0,06 (Punkt drüber, unbewiesen) |
| 5 | +0,0712 (n. messbar) | 0,234 ✗ | 0,110 ✗ | 0,06 (Punkt drüber, unbewiesen) |

Die Aktien-Broker-Spalte trägt **kein Urteil** (dort wird nicht gehandelt;
Referenzposition 10.000 $, Mindestkommission skaliert die Zahl). Sie beantwortet
Wilhelms Strukturfrage so: **auch mit Kassa-Ausführung wäre nichts belegt** — die
Punktschätzer ab H=2 lägen zwar über 0,06, aber keiner erreicht die Familien-
schwelle, und der liquide Schnitt zeigt, dass genau die handelbaren Werte den
Effekt nicht tragen.

## Einordnung des liquiden Schnitts

Die liquiden Läufe haben nur ~1.975 Bestätigungstage: vor ~2018 gab es selten
≥ 20 Werte mit 120-Tage-Median-Umsatz ≥ 1 Mrd $ je Tag, die Entdeckungshälfte ist
leer (0 Tage) — der Schnitt ist deshalb strukturell unschärfer (delta80 ≥ 0,12)
als der breite. Trotzdem ist die Richtung deutlich: der Punktschätzer fällt beim
Übergang breit → liquide bei H=1 auf die Hälfte und ab H=2 auf ≈ 0 bis negativ,
während er breit mit H wächst. Vorsicht aus dem Nachtrag gilt: das ist eine
Auswahl-Aussage („der Effekt konzentriert sich in den kleineren, teureren
Werten"), kein Beweis, dass er dort null ist.

## Weg-3-Bezug (Auflage: Richtung der Überlebensverzerrung je Urteil)

Weg 3 (01.09.): das Überlebenden-Archiv untertreibt über Nacht +0,046 Pp/Tag
(t 21,4) unbedingt — von der A7-Kontrolle herausgekürzt. Bedingt beschönigt es die
Dip-Seite (−3,78 Pp je Signaltag), und glockendruck wählt Schluss-am-Tief: **alle
positiven Punktschätzer hier sind eher nach oben verzerrt.** Die Urteile „nicht
entscheidbar/nicht messbar/kein H über den Kosten" werden von der Verzerrung
gestärkt; ein JA wäre konservativ gewesen — es kam keines. Bei H > 1 wächst die
Belastung: je länger die Haltedauer nach einem Schwächesignal, desto mehr fehlende
Sterbepfade würden in ein echtes Vollpopulations-Ergebnis eingehen.

## Gatter, Etiketten, Grenzen

- Alle 7 Placebos bestanden (Tabelle). Auswahlfunktionen wörtlich aus
  `glockendruck-nacht-n.js`; #85 auf der Ausstiegskerze erzwungen; Ausstieg
  `folgeEroeffnung` ohne Rückfall (C9, Testfall 19 der Maschine).
- **Jede Kostenzahl trägt das Etikett „vorläufig — Freigabeschwelle unerfüllt"**:
  20 Aktien-Runden über 3 Tage, nur 1 erfasste Marktlage, 16 von 20 aus einer
  Minute; Messbasis ausschließlich ≥ 1,6 Mrd $ Tagesumsatz. F beruht auf der
  öffentlichen Gebührenformel mit dem SOFR-Stand des Seitenbeispiels; der
  instrumentgenaue Satz je Markt bleibt eine benannte Restlücke.
- Geerbte Vorbehalte unverändert: Spannen-Rückprall (Niveau aller H belastet,
  Grenzertrag frei), C8-Vorgriff (alle Zahlen obere Schranken), Kosten der
  Auktionsfüllung ungemessen, Ären (Urteil nur Bestätigung).
- Sperrliste eingehalten: kein viertes H, K unverändert, kein Kanten-Urteil fürs
  breite Universum, Grenzertrag ohne Urteil.

**Konsequenz (deskriptiv):** Der Kostenhebel Haltedauer trägt nicht — weder
gehebelt (Finanzierung frisst die Zusatznacht) noch ungehebelt (Kante wächst zu
langsam), und im einzigen Universum mit belegten Kosten existiert die Kante nicht
nachweisbar. Wer den +0,044er-Effekt weiter verfolgen will, muss die Runde selbst
billiger machen (Auktionskosten-Messung, Auftrag B) oder die Rückprall-Frage
klären — nicht länger halten.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
