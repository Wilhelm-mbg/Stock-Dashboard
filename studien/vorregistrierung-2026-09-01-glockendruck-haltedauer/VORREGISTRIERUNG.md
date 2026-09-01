# Vorregistrierung — `glockendruck-haltedauer` (Kosten unter die Kante, Teil 2)

**Geschrieben 01.09.2026, VOR dem ersten Blick auf einen H>1-Ertrag.** Alle unten
verwendeten Zahlen stammen aus bereits committeten Quellen: dem H=1-Protokoll
`glockendruck-nacht-n-2026-09-01.json` (Überschuss +0,0444 Pp, t 3,71, se 0,0120,
5.039 Bestätigungstage) und der Kosten-Ist-Auswertung von heute (Teil 1 dieses
Auftrags, Zahlen unten). Kein H=2/3/5-Ertrag wurde berechnet, gedruckt oder gesehen.

## 0. Frage

`glockendruck-nacht` hat einen realen Nacht-Überschuss (+0,044 Pp je Umlauf), der an
der 0,10-%-Kostenannahme scheitert. Wilhelms Entscheid vom 01.09.: **die Kosten
angreifen, nicht neue Signale suchen.** Hebel Haltedauer: Ein- und Ausstieg bleiben
EINE Runde, egal ob eine oder fünf Nächte gehalten wird. Trägt der Effekt über
mehrere Nächte, wächst die Kante je Runde, während die Kosten je Runde konstant
bleiben. **Kante(H) muss die EINE Runde schlagen, nicht H Runden.**

## 1. Anordnung

Signal, Auswahl, Zulassung, Universum: **wörtlich `glockendruck-nacht-n.js`**
(unterstes Schlussdruck-Quintil der Zugelassenen, dieselben Funktionen per require —
kein Nachbau). Einstieg Schluss(i), **Ausstieg Eröffnung(i+H)**, long, `archiv1d`.
Drei Haltedauern: **H = 2, 3, 5** Kerzen (= H Nächte + H−1 Handelstage; H=1 ist
gemessen und wird NICHT erneut getestet). Maschine 1.6.2, `ausstiegsZeitpunkt:
'folgeEroeffnung'` (kein Rückfall: fehlt die Eröffnung, wird ausgeworfen),
Newey-West mit H−1 Verzögerungen, `leseFensterKerzen 61`. Zusätzlich zur geerbten
Zulassung: die Ausstiegskerze i+H darf nie die letzte Kerze der Reihe sein (#85).

**Endpunkt je H:** A7-Überschuss je Umlauf auf der Bestätigungshälfte (B5), wie bei
H=1. **Nachrichtlich, kein Test:** der Grenzertrag der Zusatznächte
Überschuss(H) − Überschuss(1), mit Überschuss(1) = +0,0444 aus dem committeten
Protokoll.

## 2. Testzahl und Schwellen

**Familie `glockendruck-haltedauer-2026-09`, testsGesamt = 3** (H=2, 3, 5), Schwelle
**|t| ≥ 2,394** (Bonferroni, zweiseitig, aus der Maschine gedruckt). Der Endpunkt je
H ist EINER; Zweig T entfällt (die Trennschärfe-Frage ist mit H=1 beantwortet: der
Effekt sitzt im Nachtbein, T ≈ 0).

**Kostenschwelle aus Teil 1 (heute erhoben, vor dieser Registrierung):**

| Größe | Wert |
|---|---|
| gemessene Runden (Aktien, dedupliziert über alle Lager) | 20, davon 16 aus EINER Minute (25.08. 13:31–32 UTC) |
| Runden-Verteilung je Umlauf | Median **0,0857 %**, p75 **0,1103 %**, max 0,2525 % |
| Messbasis | 15 Symbole, ALLE ≥ 1,6 Mrd $ Tagesumsatz (Median 10 Mrd) |
| glockendruck-Auswahl (letzte ~250 Tage) | Umsatz-Median **69 Mio $**, 41 % in 5–50 Mio |

> **K = 0,110 Pp je Umlauf** (p75 der gemessenen Runden) ist die vorregistrierte
> Erfolgsschwelle. Sie gilt ausdrücklich nur für die **handelbare Mega-Cap-Teilmenge**
> — für das breite glockendruck-Universum ist sie eine UNTERGRENZE der echten Kosten
> (Begründung in Teil 1: Messbasis 150-fach umsatzstärker als die Auswahl; ARM mit
> 1,6 Mrd $ Umsatz notiert schon 0,137 %; Roll-Schätzer des Archivuniversums ~0,93 Pp).
> Die alte Referenz 0,10 wird daneben ausgewiesen. Übernachtfinanzierung des CFD ist
> in K NICHT enthalten (die Messrunden schließen sofort) — sie wächst mit H und wird
> als unbezifferte, H-proportionale Zusatzlast ausgewiesen.

## 3. Machbarkeit VORAB — reichen die Signaltage?

Signaltage bleiben ~5.039 (das Signal feuert täglich); die Frage ist die
**Auflösung**. Planungsformel, offen gelegt: se(H) ≈ √(H·se_N² + (H−1)·se_T²) · f_NW
mit se_N = 0,0120, se_T = 0,0175 (beide aus den H=1-Protokollen), f_NW ∈ [1, √(2H−1)]
(Bartlett-Spanne; der echte Faktor kommt aus dem Lauf). delta80 = (2,394+0,8416)·se:

| H | se optimistisch (f=1) | se konservativ | delta80 opt. | delta80 kons. | Ziel 0,110 erreichbar? |
|---|---|---|---|---|---|
| 2 | 0,0244 | 0,0423 | 0,079 | 0,137 | **offen — entscheidet der Lauf** |
| 3 | 0,0323 | 0,0722 | 0,105 | 0,234 | knapp bis blind |
| 5 | 0,0441 | 0,1323 | 0,143 | 0,428 | **voraussichtlich strukturell blind** |

**Vorab-Befund, Teil der Registrierung:** Für H=5 liegt selbst die optimistische
delta80-Schätzung über der Kostenschwelle — bestätigt der Lauf das (delta80 > K),
lautet das Urteil für H=5 **„nicht messbar auf diesen Daten"**, und genau das ist
dann der Befund. Gemessen wird trotzdem: der echte delta80 und der Punktschätzer
sind die Planungszahlen für jede Folgearbeit.

## 4. Entscheidungsregeln — vorab, je H

- **JA_H**: Überschuss(H) ≥ **K = 0,110 Pp** UND t ≥ 2,394 UND delta80(H) ≤ K.
  Ein JA erbt beide H=1-Vorbehalte (unten) und gilt nur für die Mega-Cap-Teilmenge.
- **NEIN_H**: Überschuss(H) + 2,394·se < K — „die kumulierte Kante schlägt die reale
  Kostenverteilung nicht" (1,96er-Grenze nachrichtlich daneben).
- **nicht messbar_H**: delta80(H) > K (strukturell blind für die Zielgröße).
- **nicht entscheidbar_H**: sonst.
- Placebo der Maschine (kursfrei, gleiche Bauform) schlägt an → Lauf ungültig.

## 5. Gesehene Zahlen und geerbte Vorbehalte — vollständig deklariert

Gesehen: alle Zahlen des H=1-Laufs (Überschuss +0,0444, t 3,71; T-Zweig −0,0027;
gepaart +0,0605) und die Teil-1-Kostenzahlen. **Keine Richtungserwartung für den
Grenzertrag der Nächte 2..H wird registriert** — Persistenz, Abklingen und Umkehr
sind alle zulässig; berichtet wird, was fällt.

Geerbt und unverändert gültig: **(a) Spannen-Rückprall** (Nachträge 26./27.08.,
Nagel 2012): der geteilte Kurs sitzt im EINSTIEG Schluss(i) und ist damit bei allen
H identisch — der **Grenzertrag** der Zusatznächte ist rückprall-frei, das
**Niveau** jedes H bleibt rückprall-belastet wie H=1. **(b) C8-Vorgriff**: S liest
Schluss(i) und füllt zu Schluss(i) — jede Zahl ist eine obere Schranke, ein NEIN
bleibt gültig, ein JA wäre vorläufig. **(c) Weg 3** (01.09.): das Archiv untertreibt
über Nacht +0,046 Pp/Tag (t 21,4) unbedingt (von A7 gekürzt); bedingt beschönigt es
die Dip-Seite — Richtung in jedem Urteil vermerken. **(d)** Ären/Kosten-Vorbehalte
wie im Original.

## 6. Sperrliste

Kein viertes H nach Sicht der Ergebnisse. Keine Änderung von K nach dem Lauf. Kein
Kanten-Urteil fürs breite Universum — K deckt nur die Mega-Cap-Teilmenge. Der
Grenzertrag ist nachrichtlich und erzeugt weder JA noch NEIN. Ergebnis nur in diesen
Ordner.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
