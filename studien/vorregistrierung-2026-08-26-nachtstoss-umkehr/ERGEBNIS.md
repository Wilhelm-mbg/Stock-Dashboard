# Ergebnis — `nachtstoss-umkehr`

**Gemessen 01.09.2026** auf `archiv1d` (E:, 2.213 CS/ADRC-Reihen, 10.081 Handelstage,
B5-Schnitt 2006-08-16 → Bestätigung 5.039 Tage). Instrumente: Messmaschine **1.6.2**
(`nachtstoss-umkehr-n.js` / `-t.js` / `-n-regime.js`, Protokolle vom 01.09.) und das
gepaarte Querschnitts-Werkzeug (`gepaart-nachtstoss-umkehr-2026-09-01.json`).
Familie `uebernacht-2026-08`: **JA-Familie 6, z 2,6383; NEIN-Familie 12, z 2,8653**
(ANMELDUNG 27.08.). Signalanteil wie vorregistriert: 174,9 von 872,7 Zugelassenen je
Tag = 20,0 %; 1.706.908 Signale.

## Urteil

> ## **NEIN, beidseitig: keine Übernacht-Umkehr — und auch keine Fortsetzung — von
> ## ≥ 0,10 Pp (Niveau, CFD-Hürde). In der engeren gepaarten Fassung: die Auswahl
> ## schlägt den Rest des Querschnitts nicht um ≥ 0,04 Pp — sie läuft ihm hinterher.**
> Der Punktschätzer zeigt in die **Gegenrichtung der These**: Zweig N −0,0233 Pp
> (t −1,94), gepaart **−0,0280 Pp (t −7,66)**. Das ist die Fortsetzungs-Richtung
> (Lou/Polk/Skouras), erreicht aber den vorregistrierten Fortsetzungs-Ausgang
> (≤ −0,10 Pp, |t| ≥ Schwelle) **nicht** — er wird nicht erklärt, nur berichtet.

## Zahlen — Kandidat und Placebo in einer Tabelle (Bestätigung, Urteilshälfte)

| Reihe | Überschuss (Pp/Tag) | se | t | delta80 | Grenzen z 2,8653 |
|---|---|---|---|---|---|
| **Zweig N (Nacht, primär)** | **−0,0233** | 0,0120 | **−1,94** | 0,0418 | ±: −0,0577 … +0,0111 |
| *Placebo Niveau (Maschine, kursfrei)* | *−0,0020* | — | *−0,17* | *MDE 0,0230* | *bestanden* |
| Zweig T (Tag, Trennschärfe) | +0,0280 | 0,0163 | +1,72 | 0,0566 | — |
| *Placebo Niveau (T-Lauf)* | *+0,0100* | — | *+0,62* | *MDE 0,0325* | *bestanden* |
| **gepaart gegen den Rest der Zugelassenen** | **−0,0280** | 0,0037 | **−7,66** | — | **−0,0385 … −0,0175** |
| *Placebo gepaart (5 Ziehungen, gleiche Bauform)* | *−0,0012 … +0,0012* | *0,0011* | *−1,08 … +1,11* | — | *max. +0,0044* |

Nachrichtlich: roh Bestätigung +0,0145 Pp; je Signal −0,0154 Pp; Entdeckung
Überschuss −0,0519 (t −6,86), gepaart Entdeckung −0,0779 (t −22,39) — die
Fortsetzungs-Richtung war früher stärker. Maschinen-eigene Querschnittskontrolle
(alle Werte, Eichung): −0,0241 (t −7,82). σ_gepaart 0,2598 Pp; **Stilanteil** 3,28
(höchster der drei, wie angemeldet erwartet; misst Stil, keine Güte).

## Regimeschnitt (Nachtrag 27.08. — Berichtspflicht, kein Urteil)

| Zeitraum (Zweig N, Bestätigungshälfte) | Überschuss | se | t | Tage |
|---|---|---|---|---|
| A: bis 31.12.2020 | **−0,0339** | 0,0145 | −2,34 | 3.620 |
| B: ab 01.01.2021 | +0,0038 | 0,0213 | +0,18 | 1.419 |

Die Gegenrichtung (Fortsetzung) saß **vor 2021**; seit 2021 ist nichts mehr da —
das bestätigt die dokumentierte fremde Vorhersage (Boyarchenko/Larsen/Whelan
01.07.2026: der Eingang des Mechanismus ist seit 2021 kollabiert) auf unseren Daten.
Das Gesamturteil hängt, wie registriert, am ungeteilten Zeitraum.

## Entscheidungsweg (§6 + Nachtrag 26.08. + Vorrangregel der ANMELDUNG)

- **JA**: Punktschätzer negativ → nicht erfüllt.
- **FORTSETZUNG statt Umkehr** (≤ −0,10, |t| ≥ Schwelle): −0,0233 > −0,10, |t| 1,94
  unter 2,64 → **nicht erklärt** (Richtungshinweis nur nachrichtlich).
- **NEIN beidseitig an der CFD-Hürde** (per Nachtrag 26.08. die einzige zulässige
  Niveau-NEIN-Fassung): |−0,0233| + 2,8653·0,0120 = 0,0577 < 0,10 ✓.
- **Gepaartes NEIN an der Aktienhürde** (Familie 12): obere Grenze −0,0175 < 0,04 ✓.
  Beidseitig knapp: |−0,0280| + 2,8653·0,0037 = 0,0385 < 0,04 — zur Unterseite siehe
  Weg-3-Vorbehalt unten.
- Vorrangregel: Niveau unentscheidbar-bis-NEIN, gepaart NEIN → **NEIN.**

## Gatter — alle geprüft, keines gerissen

1. **`ausstieg`-Schalter an allen drei Stellen**: Messmaschine 1.3.0+, Protokollzeile
   C9 („gilt für Signal, beide Kontrollen und der Placebo"), Testfall 19 in
   `test-messmaschine.js`. ✓
2. **Eröffnungskurs-Bereinigung**: 8.568.509 Beobachtungen, 10 Eröffnungen außerhalb
   des Tagesbandes (0,0001 %), **0 Sprungpaare**. Deckt sich mit Weg 3. ✓
3. **#85**: letzte Kerze verworfen (Zulassung `i+2 < länge`). ✓
4. **Placebo gleicher Bauform**: Niveau und gepaart, beide in der Tabelle, beide
   unauffällig. ✓
5. **Kein Vorgriff der Kennzahl**: `test-kennzahl-vorgriff.js` in diesem Ordner,
   Störproben gegen die EINGEBAUTE Funktion: **9/9** — z1 reagiert auf keinen Kurs
   des Tages i (Schluss/Hoch/Tief/Umsatz verdreht → unverändert), wohl aber auf
   Eröffnung(i), Schluss(i−1) und das Nennerfenster. ✓
6. **Überlebensverzerrung**: ausgewiesen, siehe unten — hier nicht harmlos. ✓
7. **Ären**: Urteil nur auf der Bestätigung (ab 2006-08-16, nach der
   Dezimalisierung); Entdeckung nachrichtlich. ✓
8. **Kostenzahl unbelegt**: Auktionsfüllungen ungemessen, Vorbehalt gilt. ✓

Abweichungen benannt: B5-Schnitt der Maschine (5.039 Bestätigungstage) statt der
Tüftler-Zählung (4.736 ab 2008); Vorlauf 261; letzte Archivkerze bleibt in den
Kontrolltöpfen; im gepaarten Werkzeug 1.750 Extremwerte (>25 Pp) ausgeworfen.

## Weg-3-Bezug (Auflage: Richtung der Überlebensverzerrung je Urteil)

Weg 3 (Mitglied 2, 01.09.): das Überlebenden-Archiv untertreibt die Übernacht-Rendite
der Gesamtpopulation um +0,046 Pp/Tag (t 21,4) — unbedingt; die A7-Kontrolle kürzt
diesen symbolfesten Anteil aus dem Niveau heraus. **Bedingt** wirkt die Lücke hier
gegen die These: ausgewählt wird nach einem scharfen Abwärtsstoß, und genau solche
Werte verschwinden überproportional — das Archiv **beschönigt** die Auswahlseite
(auf Dip-Signalen −3,78 Pp je Signaltag, 26.08.). Folgen:

- Das **NEIN gegen die Umkehr-These** (obere Grenzen) wird von der Verzerrung
  **gestärkt**: der wahre Wert der Vollpopulation läge eher noch niedriger.
- Die **Unterseite** (Fortsetzungs-Richtung) trägt den Vorbehalt: mit den fehlenden
  Sterbepfaden könnte die wahre gepaarte Differenz unter −0,04 Pp liegen — das
  beidseitige gepaarte NEIN ist auf dieser Seite (Marge 0,0015 Pp) nicht
  verzerrungsfest und wird nur einseitig (gegen die Umkehr-Richtung) belastbar
  behauptet.

## Deutungsgrenzen

Kein Kanten-Urteil über die 5-Mio-$-Zulassung hinaus; Standard-Schein nicht
Gegenstand. Ein gepaartes Ergebnis erzeugt niemals ein JA — hier stellt sich die
Frage nicht: es ist negativ. Die Richtungsbegründung der Vorregistrierung trug
schwächer als am 26.08. angenommen (beide Säulen eingeschränkt, Nachtrag 27.08.);
das Ergebnis fällt konsistent damit aus. G (Spiegelbild, Hoch-Seite) bleibt
ungemessen — es war als Nachlauf nur für ein JA vorgesehen.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
