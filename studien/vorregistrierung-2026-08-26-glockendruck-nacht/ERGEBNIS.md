# Ergebnis — `glockendruck-nacht`

**Gemessen 01.09.2026** auf `archiv1d` (E:, 2.213 CS/ADRC-Reihen, 10.081 Handelstage
19.11.1986–28.08.2026, B5-Schnitt 2006-08-16 → Bestätigung 5.039 Tage). Instrumente:
Messmaschine **1.6.2** (`glockendruck-nacht-n.js` / `-t.js`, Protokolle
`…/protokolle/glockendruck-nacht-{n,t}-2026-09-01.json`) und das gepaarte
Querschnitts-Werkzeug (`…querschnitt-uebernacht/messe-querschnitt-gepaart.js`,
`gepaart-glockendruck-nacht-2026-09-01.json`). Familie `uebernacht-2026-08`:
**JA-Familie 6 Tests, z 2,6383; NEIN-Familie 12, z 2,8653** (ANMELDUNG 27.08.).
Signalanteil wie vorab gezählt: Auswahl 174,9 von 872,7 Zugelassenen je Tag = 20,0 %
(vorregistriert 19,8 %); 1.706.909 Signale.

## Urteil

> ## **NEIN an der CFD-Hürde: die obere Grenze des Nacht-Überschusses liegt unter 0,10 Pp.**
> Darunter existiert ein **realer, aber unhandelbarer** Nacht-Überschuss: +0,0444 Pp,
> t 3,71 — über der Familienschwelle 2,64 und der kampagnenweiten 2,73, mit grünem
> Placebo, und er sitzt im Nachtbein (Zweig T ≈ 0). Er ist als **obere Schranke** zu
> lesen (C8-Vorgriff, Gatter 3) und **rückprall-belastet** (Nachträge 26./27.08.:
> die Auswahl sortiert nach der Bandlage; Nagels „Hälfte" ist hier eine *untere*
> Schranke des Rückprall-Anteils).

Die NEIN-Aussage an der **Aktienhürde (0,04 Pp)** war nach beiden Nachträgen vom
26.08. nicht mehr zulässig (Marge 0,0005 Pp, Auflösungswand-Regel) und wird nicht
behauptet — der Lauf bestätigt das: delta80 = 0,0417 Pp > 0,04. Auch der **gepaarte**
Endpunkt trägt hier kein NEIN an 0,04 (obere Grenze +0,0691 > 0,04) — er ist
signifikant **positiv** (+0,0605, t 20,12), darf aber laut Vorrangregel **niemals ein
JA erzeugen** (Existenzaussage, kein Handelsurteil).

## Zahlen — Kandidat und Placebo in einer Tabelle (Bestätigung, Urteilshälfte)

| Reihe | Überschuss (Pp/Tag) | se | t | delta80 | obere Grenze z 2,8653 (z 1,96) |
|---|---|---|---|---|---|
| **Zweig N (Nacht, primär)** | **+0,0444** | 0,0120 | **+3,71** | 0,0417 | 0,0788 (0,0679) |
| *Placebo Niveau (Maschine, kursfrei)* | *−0,0020* | — | *−0,17* | *MDE 0,0230* | *bestanden* |
| Zweig T (Tag, Trennschärfe) | −0,0027 | 0,0175 | −0,15 | 0,0607 | — |
| *Placebo Niveau (T-Lauf)* | *+0,0100* | — | *+0,62* | *MDE 0,0325* | *bestanden* |
| **gepaart gegen den Rest der Zugelassenen** | **+0,0605** | 0,0030 | **+20,12** | — | **0,0691 (0,0663)** |
| *Placebo gepaart (5 Ziehungen, gleiche Bauform)* | *−0,0015 … +0,0011* | *0,0011* | *−1,34 … +1,00* | — | *max. 0,0043* |

Nachrichtlich: roh Bestätigung +0,0854 Pp; je Signal +0,0417 Pp (netto nach
0,10-Pp-Spanne **−0,058**); Entdeckung Überschuss +0,1092 Pp (t 14,80), gepaart
Entdeckung +0,1328 (t 38,16) — der Effekt war in der ersten Hälfte mehr als doppelt
so groß. Maschinen-eigene Querschnittskontrolle (alle Werte, nur Eichung): +0,0468
(t 17,96). σ_gepaart 0,2133 Pp; **Stilanteil** σ(Kandidat)/σ(Placebo) = **2,68**
(misst Marktzug-Kürzung und Stil, keine Güte; Placebo-sd-Band 0,0777–0,0806, 3,7 %).

## Entscheidungsweg (Tabelle aus §6 + Nachträge + Vorrangregel der ANMELDUNG)

- **JA** (≥ +0,10 Pp, |t| ≥ Schwelle, T < Hälfte): +0,0444 < 0,10 → **nicht erfüllt.**
  (T-Bedingung wäre erfüllt gewesen: Zweig T −0,0027 trägt nichts.)
- **NEIN an der CFD-Hürde** (per Nachträge die einzige zulässige NEIN-Fassung):
  Niveau 0,0788 < 0,10 ✓ und gepaart 0,0691 < 0,10 ✓ → **NEIN.**
- Vorrangregel: Niveau-NEIN, gepaart signifikant positiv → **NEIN** steht; das
  gepaarte Positiv wird als Widerspruch ausgewiesen und erzeugt kein JA.

## Gatter — alle geprüft, keines gerissen

1. **Eröffnungskurs-Bereinigung** (härtestes Gatter): über alle 8.568.519
   Beobachtungen 10 Eröffnungen außerhalb des Tagesbandes (0,0001 %), **0
   Sprungpaare** (gegenläufige >40-%-Sprünge in Nacht- und Tagbein bei normalem
   Tagesschritt — die Signatur ungleich bereinigter Eröffnungen). Deckt sich mit
   Weg 3 (0 von 1.074.815 W4-ungültig). **Hält.**
2. **#85**: letzte Kerze je Reihe verworfen (Zulassung `i+2 < länge`). ✓
3. **C8-Vorgriff**: ausgewiesen; jede positive Zahl hier ist obere Schranke. ✓
4. **Placebo gleicher Bauform**: Niveau (Maschine, gleiche Sitzungspositionen und
   Häufigkeit) und gepaart (gleiche Tagesbreite, gewürfelt in Zeit und Symbol) —
   beide in der Tabelle, beide unauffällig. ✓
5. **Überlebensverzerrung**: ausgewiesen, siehe Weg-3-Bezug unten. ✓
6. **Ären**: Das Urteil fällt ausschließlich auf der Bestätigung (ab 2006-08-16,
   vollständig nach der Dezimalisierung); die Entdeckungshälfte (mischt
   Bruchpreis-Ära) steht nur nachrichtlich daneben. ✓
7. **Kostenzahl unbelegt**: 0,04/0,10 Pp beschreiben notierte Spannen; was eine
   Auktionsfüllung kostet, ist weiter ungemessen. Vorbehalt gilt. ✓

Abweichungen vom Zählwerkzeug, benannt: B5-Schnitt der Maschine (2006-08-16,
5.039 Tage) statt der Tüftler-Zählung (ab 2008, 4.665); Vorlauf 261 Kerzen je Reihe
(Maschinen-Verfahren); die letzte Archivkerze bleibt in den Kontrolltöpfen (1 von
~10.000 je Reihe). Im gepaarten Werkzeug 1.750 Extremwerte (>25 Pp) ausgeworfen —
Zählwerkzeug-Konvention.

## Weg-3-Bezug (Auflage: Richtung der Überlebensverzerrung je Urteil)

Weg 3 (Mitglied 2, 01.09.) hat belegt: das Überlebenden-Archiv **untertreibt** die
Übernacht-Rendite der Gesamtpopulation um +0,046 Pp/Tag (t 21,4) — unbedingt.
Für dieses Urteil gilt:

- Die **unbedingte** Untertreibung ist eine Kohorten-Eigenschaft; die A7-Kontrolle
  zieht jedem Symbol seinen eigenen Nachtdurchschnitt ab und kürzt sie damit aus dem
  Niveau-Überschuss heraus.
- **Bedingt** wirkt die Lücke hier in die Gegenrichtung: die Auswahl (Schluss am
  Tagestief) trifft genau die Fälle, deren Sterbepfade fehlen — auf Dip-Signalen
  **beschönigt** das Archiv (−3,78 Pp je Signaltag, gemessen 26.08.). Der gemessene
  Überschuss (+0,0444) und erst recht das gepaarte Positiv (+0,0605, Auswahl gegen
  Rest, Verschwundene fehlen überproportional in der Auswahl) sind also eher **nach
  oben** verzerrt. **Das NEIN wird von der Verzerrung gestärkt, nicht bedroht; ein
  JA wäre konservativ gewesen — es kam keines.**

## Deutungsgrenzen

Kein Kanten-Urteil über die 5-Mio-$-Zulassung hinaus; der Standard-Schein war
ausdrücklich nicht Gegenstand. Ein Handelsversprechen hängt an keiner dieser Zahlen:
netto je Umlauf ist der Befund auf jedem Produkt des Depots negativ. Der reale kleine
Nacht-Überschuss ist ohne Mittelkurs-Gegenprobe (archiv1d führt keine Geld-/Briefkurse)
nicht vom Spannen-Rückprall zu trennen — *nicht prüfbar, als benannte Einschränkung*.
Aufschlussreich als Befund: die Schwesterstudie ohne geteilten Kurs
(`nachtstoss-umkehr`) sieht im selben Fenster **−0,023 Pp** — konsistent damit, dass
ein erheblicher Teil der +0,044 Bandlagen-Rückprall ist.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
