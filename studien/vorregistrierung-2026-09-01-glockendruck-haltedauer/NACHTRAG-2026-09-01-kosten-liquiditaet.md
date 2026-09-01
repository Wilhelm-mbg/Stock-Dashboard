# Nachtrag zur Vorregistrierung `glockendruck-haltedauer` — Kostenformel, Aktien-Spalte, Liquiditäts-Schnitt

**01.09.2026, auf Wilhelms Nachtrag zum Auftrag „Kosten unter die Kante".**

**Zeitliche Einordnung, ehrlich:** Die drei H-Läufe (H=2/3/5, Familie noch 3) waren
beim Eintreffen dieses Nachtrags bereits gestartet und maschinell abgeschlossen.
**Keine ihrer Zahlen wurde angesehen** — die Ausgabedatei ist ungelesen, kein
Protokoll wurde geöffnet. Diese Protokolle werden mit der unten korrigierten
Familienzahl überschrieben und neu erzeugt; erst danach wird gelesen. Der Nachtrag
ist damit ein Vor-Ertragsblick-Nachtrag im Sinne der Hausregel.

## 1. Die Kostenformel je Haltedauer — Finanzierung skaliert mit H

**Kosten(H) = K (Rundenkosten, einmalig) + F · H (Übernachtfinanzierung je Nacht).**

F wird nicht geschätzt, sondern der Quelle entnommen —
**capital.com/en-int/ways-to-trade/fees-and-charges** (abgerufen 01.09.2026):

> Übernachtgebühr = „Our daily fee +/- Interest-rate benchmark"; der Jahressatz der
> Gebühr beträgt **4 %**, geteilt durch 360 oder 365 je Währungskonvention. Beispiel
> der Seite (USD): Benchmark SOFR, dort mit 5,01448 % p. a. angesetzt = 0,01393 %
> täglich. Und: „1:1 leverage (unleveraged) CFD positions are not subject to
> overnight funding" (für die meisten Märkte; Ausnahmen genannt: Natural Gas,
> US Cocoa, VIX).

Daraus, für Long-Aktien-CFD in USD: **F ≈ (SOFR + 4 %) / 365 ≈ 0,0247 %/Nacht**
(mit dem SOFR-Stand des Seitenbeispiels; der instrumentgenaue Satz steht nur je
Markt auf der Plattform und ist ohne Login nicht abrufbar — als Restlücke benannt,
Größenordnung durch die Formel gedeckt). **Zwei Fassungen werden geführt:**

- **CFD gehebelt:** Kosten(H) = K + 0,0247·H Pp.
- **CFD ungehebelt (1:1):** Kosten(H) = K (laut Quelle keine Übernachtfinanzierung).

**Vorab-Rechnung mit der belegten H=1-Kante (0,0444 Pp/Nacht):** F = 0,0247 ist
**kleiner** als die Kante je Nacht — der Fall „Finanzierung ≥ Kante/Nacht ⇒ jedes H
negativ" tritt mit dem heutigen Zinsstand **nicht** ein, aber F frisst gut die
Hälfte jeder Zusatznacht. Die JA-Bedingung wird deshalb verschärft:

> **JA_H (CFD gehebelt): Überschuss(H) ≥ K + 0,0247·H** und t ≥ Familienschwelle.
> **JA_H (ungehebelt): Überschuss(H) ≥ K** und t ≥ Familienschwelle (wie §4 der
> Vorregistrierung). Beide Zeilen werden ausgewiesen; „JA" ohne Zusatz meint die
> ungehebelte Fassung, die gehebelte wird daneben beurteilt.

## 2. Zweite Kostenspalte, NUR NACHRICHTLICH: echter Aktien-Broker

Kassa-Aktie: keine Übernachtfinanzierung, kein Hebel, Kommission fix. Rechnung:
notierte Spanne der Aktienhürde **0,04 Pp** (Projekt-Kostentabelle,
`signalstudie-2026-08/BERICHT.md`) + 2 × Mindestkommission (Größenordnung 1 $ je
Order, IBKR-artig) auf eine **Referenzposition 10.000 $** = 0,02 Pp →
**Kosten_Aktie(H) ≈ 0,06 Pp, konstant in H.** Kein Urteil auf dieser Spalte — dort
wird nicht gehandelt; sie beantwortet nur Wilhelms Strukturfrage, ob die Kante über
den Kosten läge, wenn die Ausführung anders wäre. Positionsgrößen-Abhängigkeit der
Mindestkommission ist ausgewiesen (bei 2.000 $ wären es 0,10 Pp allein Kommission).

## 3. Vorregistrierter Zusatzendpunkt: Liquiditäts-Schnitt

**Definition, vorab fixiert:** liquide(i) ⇔ Median des Tagesumsatzes
(Schluss × Stück) über die 120 Handelstage i−119…i **≥ 1 Mrd $** — je Tag gerechnet,
rückschaufrei (keine heutige Symbolliste auf die Historie).

**Begründung der Schwelle:** Die Kosten-Messbasis aus Teil 1 beginnt bei 1,6 Mrd $
Tagesumsatz (kleinstes gemessenes Symbol) — 1 Mrd ist die unterste Klasse, für die
die gemessene Rundenverteilung (Median 0,0857 / p75 0,1103 %) überhaupt als
Kostenmaß taugt und die der Broker durchgängig führt. Unterhalb davon ist K
unbelegt und mutmaßlich höher.

**Anordnung:** identische Signalregel, aber Zulassung zusätzlich liquide(i); das
Schlussdruck-Quintil wird **im liquiden Teiluniversum** gebildet (die handelbare
Fassung: wer nur dort handeln kann, bildet sein Quintil dort). Gemessen für
**H ∈ {1, 2, 3, 5}** — H=1 liquide ist der direkte Überlebens-Test des Effekts.

**Familienkorrektur:** 3 (breit H=2/3/5) + 4 (liquide H=1/2/3/5) = **7 Tests**,
Schwelle |t| ≥ ~2,69 (exakt aus der Maschine). Die schon gestarteten breiten Läufe
werden mit testsGesamt = 7 neu erzeugt; delta80 aller Läufe rechnet mit der
7er-Schwelle.

**Vorsicht, ausgewiesen:** Die Liquiditätsauswahl ist eine AUSWAHL. Lebt der Effekt
nur in illiquiden Werten, ist er praktisch unhandelbar — und genau das wäre dann
der Befund, kein Scheitern der Studie. Umgekehrt gilt ein liquides JA nur für das
liquide Teiluniversum.

## 4. Etikett auf jeder Teil-1-Kostenzahl

Die Freigabeschwelle der Kostenmessung (Runden über ≥2 Tage UND ≥2 Marktlagen,
je Lage ≥10) ist **unerfüllt**: 20 Aktien-Runden über 3 Tage, aber nur EINE
erfasste Marktlage (trend-auf, 3 Runden; 17 ohne Lagen-Stempel), 16 von 20 aus
einer einzigen Minute. **Jede Kostenzahl in ERGEBNIS und Tabellen trägt das
Etikett „vorläufig — Freigabeschwelle unerfüllt".** K = 0,110 bleibt die
vorregistrierte Schwelle (die beste vorhandene Zahl), wird aber nie als „belegt"
bezeichnet.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
