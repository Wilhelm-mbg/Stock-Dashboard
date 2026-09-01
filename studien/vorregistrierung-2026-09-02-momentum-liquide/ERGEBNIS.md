# Monats-Momentum in liquider Fassung — Ergebnis, 02.09.2026

**Gemessen:** 02.09.2026 00:52 MESZ (`lauf-2026-09-01-22-52.json`, UTC-Stempel), Werkzeug
`messen.js` wie committet **vor** dem ersten Lauf mit Filter (3ccdfc3). Vorregistrierung
51ac880. Wächterlauf (`waechter-*.json`, Konsole `waechter-konsole.txt`) vor dem Urteilslauf.
Archiv `archiv1d`: 2.213 CS/ADRC-Reihen (716 keine Aktie, 36 F1-kaputt), Zeitachse 1986-08-25
bis 2026-08-28 (#85) — **byte-gleich zum Vorbild** (W0-Abweichung 0,00000). Wachhund: 1
Handelstag Rückstand, unerheblich. **Korbfilter: Median-Tagesumsatz über 20 Balken bis t
≥ 100 Mio $, Punkt-in-Zeit, vor der Rangbildung, Vergleich gegen das liquide Universum.**
**Familie 6 Tests, Schwelle |t| ≥ 2,638. Testzahl dieser Studie: 1.**

## Antwort in einem Satz

> **Lebt Momentum im handelbaren Teil? — JA nach der registrierten Regel, In-Sample und am
> Rand:** brutto **+1,835 Pp je 63-Tage-Umlauf** im liquiden Korb (se 0,911, t 2,02,
> **79 unabhängige Perioden**, 1 Test), 95-%-Band **[+0,050, +3,620]**; der liquide Korb ist
> **nicht schwächer als der breite** (gepaart +0,29 Pp, t 0,69). **Aber:** bei der
> Familienschwelle 2,638 schließt das Band null ein ([−0,567, +4,238]), nur **18 von 63
> Rasterlagen** erfüllen die Regel, und ohne die 2020er bleiben +0,40 Pp über 54 Perioden.

**Die Erwartung der Registrierung (§0) ist NICHT eingetroffen.** Erwartet war „der Effekt
stirbt oder wird nicht entscheidbar" (glockendruck-Lehre). Gemessen: der Punktschätzer
**steigt** von +1,541 auf +1,835 (Faktor 1,19), das Band wird breiter (se 0,732 → 0,911), und
die untere Grenze bleibt mit +0,050 knapp über null. **Die Lehre „der Effekt lebt, wo er nicht
handelbar ist" gilt für Momentum nicht** — sie stammt aus der Übernacht-Familie und wird im
Wiki entsprechend eingegrenzt.

## Urteil nach §5 — die Regeln, wie registriert

| Regel | Bedingung | Ist | |
|---|---|---|---|
| **LEBT** | untere 95-%-Grenze > 0 **und** Punkt ≥ 0,770 | **+0,050 > 0** und **+1,835 ≥ 0,770** | **erfüllt** |
| STIRBT Weg 1 | obere 95-%-Grenze brutto < 0,770 | +3,620 | nicht erfüllt |
| STIRBT Weg 2 | obere 95-%-Grenze des gepaarten Δ < −0,770 | +1,128 | nicht erfüllt |

> ## **LEBT** — mit drei Etiketten, die zur Zahl gehören:
> 1. **In-Sample.** Dieselben gesehenen Perioden wie das Vorbild; die einzige unberührte
>    Hälfte ist die Zukunft.
> 2. **Am Rand.** Untere Grenze +0,050 Pp — 0,05 Pp weniger Kante, und das Urteil hieße
>    „nicht entscheidbar". Nominales t 2,02 liegt **unter der Familienschwelle 2,638**; das
>    2,638-Band reicht bis −0,567. Wer die Familienschwelle an das Band anlegt (die
>    Registrierung tut es nicht, sie druckt sie daneben), liest „nicht entscheidbar".
> 3. **Streubild.** Die registrierte Phase 0 liegt an **Rang 14 von 63** Rasterlagen (Median
>    +1,696, min +1,298, max +2,077); die LEBT-Regel wäre in **18 von 63** Lagen erfüllt.
>    Phase 0 war per Konstruktion festgelegt, nicht gewählt — aber sie liegt, wie schon im
>    Vorbild, über dem Median.

| | Wert |
|---|---|
| MDE (2 · se) | 1,82 Pp je Umlauf (breit 1,46) |
| delta80 (1,96) / (Familie 2,638) | 2,55 / 3,17 Pp |
| Perioden mit brutto > 0 | 50 von 79 |
| Nötige Perioden für ein LEBT an der Familienschwelle bei dieser Kante | ≈ 153 (≈ 38 Jahre) |
| Kalendernächte je Periode | Mittel 91,5, min 88, max 97 |

## Kandidat, Placebo, gepaartes Δ und Gefäße in einer Tabelle (Bestätigung, Phase 0, 79 Perioden)

| Zeile | brutto | se | t | 95-%-Band | Hürde | netto | t_netto | Etikett |
|---|---|---|---|---|---|---|---|---|
| **liquider Korb gegen liquides Universum — URTEIL §5** | **+1,835** | 0,911 | 2,02 | **[+0,050, +3,620]** | — | — | — | **LEBT** (In-Sample, Rand) |
| breiter Korb (W0, dieselben Perioden, Vorbild) | +1,541 | 0,732 | 2,10 | [+0,106, +2,976] | — | — | — | Bezug |
| **gepaartes Δ liquide − breit** | **+0,294** | 0,426 | 0,69 | [−0,540, +1,128] | — | — | — | nicht schwächer; ein Drittel schwächer nicht ausgeschlossen |
| *Placebo (Zufallskorb aus den liquiden Kandidaten, Soll null)* | *+0,237* | *0,320* | *0,74* | | | *(CFD −2,134)* | | *bestanden* |
| liquider Korb gegen **breiten** Markt (nachrichtlich, §8) | +0,781 | 1,011 | 0,77 | | | | | Wahl der Vergleichsgruppe |
| CFD gehebelt — nachrichtlich (§5b) | +1,835 | | | | 2,370 | **−0,535** | −0,59 | formal „nicht messbar" (delta80 2,55 > Hürde); Obergrenze netto +1,249; **kein Urteil** — Vorbild: nicht entscheidbar |
| CFD ungehebelt — nachrichtlich | +1,835 | | | | 0,110 | +1,725 | 1,89 | kein Urteil |
| Kassa-Aktie — nachrichtlich, **ANNAHME 0,06** | +1,835 | | | | 0,060 | **+1,775** | **1,95** | kein Urteil; unter 1,96 und unter 2,638 |

**Zur Vergleichsgruppe (§3):** Gegen das liquide Universum +1,835; gegen den breiten Markt
+0,781 (t 0,77). Die Differenz ist die Größen-/Liquiditätsprämie im Fenster: der breite
Markt (1.650 Werte, gleichgewichtet) lief besser als der liquide (400 Werte). Registriert
und geurteilt ist die erste Zeile; die zweite zeigt, dass ein liquider Käufer gegen einen
gleichgewichteten Kleinwerte-Index gemessen deutlich weniger sähe. Beides steht hier.

**Zur Kassa-Zeile:** Das Vorbild hatte drei Vorbehalte: In-Sample, Annahme, ein Fünftel des
Korbs illiquide. **Der dritte ist weg** — der Korb besteht nur noch aus Werten, für die die
Annahme (10.000 $ in liquiden Werten) und K (Mega-Caps) überhaupt gedacht sind. Die ersten
beiden bleiben, und t_netto 1,95 liegt unter jeder Schwelle. **Kein Urteil.** Was aus der
Annahme einen Messwert machen würde, steht unverändert in `wiki/offene-auftraege.md`
(Paper-Konto, nach Umsatzklassen geschichtet).

## Kontrollen — alle vor dem Blick auf das Urteil (Wächterlauf), im Urteilslauf identisch

| Kontrolle | Soll | Ist | |
|---|---|---|---|
| **W0 Reproduktion des Vorbilds (Filter AUS)** | +1,54097 Pp, 79 Perioden, Abweichung < 0,01 | **+1,54097, 79, Abweichung 0,00000**; größte Abweichung je Periode 0,00 (79 von 79 Perioden mit Gegenstück) | bestanden — der Umbau hat ohne Filter nichts verändert |
| Placebo t | \|t\| < 2,638 | +0,237 Pp, se 0,320, t 0,74 | bestanden |
| Placebo-Rauschboden, **registriertes** Kriterium (Nachtrag 1 Vorbild) | se Placebo ÷ sd(200 Placebo-Mittel) ∈ [0,7; 1,4] | 0,320 / 0,263 = **1,213** | bestanden |
| *Kriterium des Vorbilds, nur nachrichtlich* | *sd Placebo-Mittel ÷ se Kandidat* | *0,289 (misst Faktorstreuung)* | *nicht registriert* |
| Placebo-Ziehungen mit \|t\| ≥ 2,638 | ≈ 2 von 200 | 3 von 200 | nachrichtlich |
| Positivkontrolle (Ausstieg × 1,02) | Soll exakt +1,879 (Näherung +1,800), ±5 % | gefunden +1,879 brutto und netto, Verhältnis 1,0000 | bestanden |
| Wachhund / Fingerabdruck / Klassifizierung | ≤ 1 Tag / unverändert / vorhanden | 1 Tag / unverändert (2.965 Dateien) / vorhanden | bestanden |
| Perioden an der Mindestbreite gescheitert (Bestätigung) | 0 | **0** (Entdeckung: 65 — siehe Ären) | bestanden |

**Der Wächterlauf druckte den Mittelwert des liquiden Korbs nicht** (nur se 0,911, MDE 1,82,
Korbgrößen). Die Machbarkeit aus §2 der Registrierung (se ≈ 0,8–0,9) traf: 0,911.

## Machbarkeit: Plan gegen Ist

| | registriert (§2) | gemessen |
|---|---|---|
| se liquide | ≈ 0,8–0,9 | 0,911 |
| MDE | ≈ 1,6–1,8 | 1,82 |
| se des gepaarten Δ | ≈ 0,4 | 0,426 |
| Punkt nötig für „untere Grenze > 0" | ≈ 1,7 | 1,785 (Ist 1,835 — **0,05 darüber**) |

Die Vorhersage „LEBT verlangt einen Punktschätzer über dem breiten Wert" war richtig — und
genau das ist eingetreten. Das Urteil hängt an der Schätzgenauigkeit, nicht an der Größe:
eine Kante von +1,8 Pp je Quartal ist groß, das Band ist es auch.

## Korb und Universum nach Filter (nachrichtlich)

| | breit (Vorbild) | liquide |
|---|---|---|
| Universum je Periode (Mittel) | 1.650 | **400** (min 152, Median 351, max 950) |
| Korb je Periode (Mittel) | 165 | **40** (min 15, Median 35, max 95) |
| Anteil ≥ 1 Mrd $ im Korb | 2,6 % | **9,6 %** (≥ 100 Mio $ per Bau 100 %, < 5 Mio $ per Bau 0 %) |
| Umschlag gehalten aus Vorperiode | 54,1 % | 48,8 % → effektives K 0,056 |
| Delisting-Ausstiege im Korb | 5 | **0** |

**Der nominale Filter wird über die Zeit lockerer** (kein Inflations- oder Marktabgleich,
wie registriert): liquides Universum/Korb je Jahr 2006 **155/16** · 2010 264/27 · 2015 335/34
· 2020 449/45 · 2024 633/63 · 2026 **950/95**. Die frühen Bestätigungsperioden tragen mit
Körben von 15–25 Werten die größte idiosynkratische Streuung. In der Entdeckungshälfte
scheiterten **65 Perioden** an der Mindestbreite (vor ≈ 2003 hatten weniger als 100 Werte
des Archivs 100 Mio $ Tagesumsatz) — sie ist deshalb mit 11 Perioden praktisch leer.

## Überlebensverzerrung (§7) im liquiden Korb — der Filter entfernt die Verschwundenen

| | breit (Vorbild) | liquide |
|---|---|---|
| Verschwundene im Universum (alle 63 Lagen, 190 Perioden) | 11,03 % | **2,43 %** |
| Verschwundene im Korb | 13,11 % | **3,69 %** |
| Verhältnis Korb / Universum | 1,19 | **1,52** |

| Periode | Universum (V) | Korb (V) | delistet im Fenster | brutto S | brutto U | Δ U−S | Weg-3-Analogon 63 T (V−S) |
|---|---|---|---|---|---|---|---|
| 2025-08-28 → 11-26 | 794 (3,0 %) | 79 (2,5 %) | 6 | +2,496 | +2,547 | +0,051 | +3,66 |
| 2025-11-26 → 2026-03-02 | 872 (3,0 %) | 87 (6,9 %) | 8 | +5,448 | +5,354 | −0,094 | +1,22 |
| 2026-03-02 → 06-01 | 971 (2,2 %) | 97 (3,1 %) | 11 | +16,968 | +16,140 | −0,828 | −5,67 |

**Befund zur Verzerrungsrichtung:** Der Liquiditätsfilter reduziert den Anteil der
Verschwundenen im Universum um den Faktor 4,5 (11,0 → 2,4 %). Das Überlebenden-Archiv kann
den liquiden Effekt deshalb **weniger** verzerren als den breiten — was bleibt, sind vor allem
liquide Übernahmeziele (Verhältnis 1,52: sie landen weiter überproportional im stärksten
Zehntel). Auf Korbebene ist Δ U−S in drei Perioden klein und gemischt (+0,05 / −0,09 / −0,83).
Das Weg-3-Analogon dreht das Vorzeichen zwischen den Perioden. **Kein Korrekturwert, kein
Vorzeichen für 2006–2026**; Etikett: *Fenster 2024-08 bis 2026-08, übernahme-dominiert, 3
Perioden, 2008/09 nicht gemessen.* Der Weg-3-Wert (über Nacht) bleibt nicht übertragbar.

## Nachrichtlich — entscheidet nichts

**Ären, Phase 0, liquide:**

| Ära | Perioden | brutto (se, t) | netto CFD (t) | netto Kassa, Annahme (t) | Obergrenze brutto |
|---|---|---|---|---|---|
| Entdeckung (< 2006-08-14) | **11** (65 an Mindestbreite gescheitert) | +0,938 (2,059, 0,46) | −1,424 (−0,69) | +0,878 (0,43) | +4,974 |
| **Bestätigung (Urteil)** | 79 | **+1,835 (0,911, 2,02)** | −0,535 (−0,59) | +1,775 (1,95) | +3,620 |
| Gesamt | 90 | +1,726 (0,835, 2,07) | −0,644 (−0,77) | +1,666 (1,99) | +3,362 |
| 2000er | 25 | **−0,598 (1,651, −0,36)** | −2,966 (−1,80) | −0,658 | +2,638 |
| 2010er | 40 | +1,168 (0,849, 1,37) | −1,201 (−1,42) | +1,108 | +2,833 |
| **2020er** | 25 | **+4,941 (2,007, 2,46)** | +2,570 (1,28) | +4,881 (2,43) | +8,875 |
| Bestätigung **ohne 2020er** | 54 | **+0,397** | | | |

**Das Bild hängt am jüngsten Jahrzehnt.** Die 2000er (Momentum-Crash 2009: −21,6 Pp am
2009-02-18, −11,9 am 2008-08-18) sind negativ, die 2010er nicht signifikant, die 2020er
tragen mit +4,9 Pp je Umlauf (2020-11-19 +20,2, 2021-02-23 −20,6, 2023-11-22 +18,3,
2024-08-26 +21,1) den Großteil. Über die 54 Perioden bis 2019 bleiben +0,40 Pp — unter der
Hälfte. Das ist eine Beschreibung, kein Test (keine Ära wurde vorregistriert).

**63 Rasterlagen (Bestätigung, liquide), Streubild:** brutto min +1,298 / Median +1,696 /
max +2,077; t brutto 1,36–2,42; **LEBT-Regel erfüllt in 18 von 63**; **netto CFD in allen 63
Lagen negativ** (−1,072 bis −0,294); Obergrenze brutto 2,96–4,39; t netto Kassa ≥ 1,96 in
12 von 63, ≥ 2,638 in **0**. Phase 0 (+1,835) an Rang 14 von 63.

## Was daraus folgt (deskriptiv, keine Empfehlung)

- **Für die Frage des Auftrags:** Momentum ist im handelbaren Teil **nicht schwächer** als im
  breiten Korb — der Punkt ist höher, das gepaarte Δ positiv. Das unterscheidet Momentum von
  der Übernacht-Familie; die Lehre „der Effekt lebt, wo er nicht handelbar ist" ist damit
  **auf die Übernacht-Familie eingegrenzt**, nicht widerlegt (dort wurde sie gemessen).
- **Für die Belegstärke:** Ein In-Sample-LEBT am Rand des 95-%-Bandes mit 1 von 6 Tests der
  Familie, das an der Familienschwelle nicht steht und in 45 von 63 Lagen nicht steht. Es
  ist der stärkste Momentum-Befund, den dieses Archiv hergibt, und er reicht nicht für ein
  „belegt". **Was ihn heben könnte, ist nur Zeit** (≈ 153 Perioden für die Familienschwelle)
  oder ein unberührter Datensatz.
- **Für die Gefäße:** CFD unverändert unbegehbar (Finanzierung 2,26 Pp). Die Kassa-Zeile ist
  jetzt ohne den Liquiditäts-Vorbehalt und steht bei t 1,95 — mit **Annahme** statt Messwert.
  Die Kostenmessung am Paper-Konto ist der einzige Schritt, der diese Zeile weiterbringt.
- **Für die Methodik:** Die Machbarkeitsschätzung aus gesehenen Streuungen traf (se 0,911
  gegen ≈ 0,8–0,9). Und: **eine registrierte Erwartung darf falsch sein** — sie war es hier,
  und das steht oben.

**Sperrliste eingehalten:** Schwelle 100 Mio $ nicht variiert, kein zweiter Filterwert, keine
Schichtung, kein Parameter verändert, kein Urteil auf Gefäßen, kein Korrekturwert aus §7,
kein Lagenwechsel, eingefrorenes Universum unberührt, Vorbild- und Eichungsstudie unverändert,
keine SendMessage, keine Version.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
