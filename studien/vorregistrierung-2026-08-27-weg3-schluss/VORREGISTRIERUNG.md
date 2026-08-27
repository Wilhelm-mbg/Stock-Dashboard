# Vorregistrierung — Überlebenslücke Weg 3: die unbedingte Richtung, Schluss-zu-Schluss

**Stand:** 27.08.2026, ~09:0x — vor jedem Rechenschritt auf der Kohorte. **Rolle:**
Berechnungen. **Auftrag:** PM (heute früh), auf Tüftler-Vorschlag C/Weg 3 mit
Machbarkeits-Nachweis (`studien/tueftler/2026-08-27-nacht4-…md` §2, Faktor 24 über
der Schwelle). **Damit ist die alte Formel »mit den vorhandenen Quellen nicht zu
schließen« für Weg 3 überholt** — genau solche überholten Formeln haben sich hier
schon einmal teuer weitergetragen.

## 0. Frage und Abgrenzung

**Gemessen wird die RICHTUNG und GRÖSSE der unbedingten Überlebensverzerrung im
Tagesfenster:** Läuft der Querschnitt der später Verschwundenen Tag für Tag anders als
der der Überlebenden — Schluss zu Schluss, gepaart über denselben Kalendertag? Kein
Signal, keine Strategie, kein Kanten-Urteil. Abgrenzung zur Verzerrungsmessung vom
26.08.: Dort war die Frage BEDINGT (Dip-/Monatsende-Zwillinge für die drei drehbaren
Protokolle, H = 4/1, eigene Filter); hier ist sie UNBEDINGT mit den Tüftler-
Konventionen und ~7-fach schärferer Auflösung. Die Übernacht-Fassung ist ausdrücklich
NICHT Teil dieses Laufs (sie braucht Vorschlag D/Eröffnungskurse und ist das zweite
Familienmitglied).

## 1. Anordnung — exakt die Konventionen der Machbarkeits-Zählung

| | |
|---|---|
| Verschwundenen-Arm | `massive/tagesdaten/` (1.164 Dateien; nach Filter ~1.023) |
| Überlebenden-Arm | `E:/Markt-Dashboard-Archiv/archiv1d` |
| Wertpapierart | CS/ADRC (`WP.istAktie`, inkl. Testkürzel-Riegel; `klassifizierungDa` wird geprüft) |
| Liquidität | Umsatzschnitt **5 Mio $** je Tag (Tüftler-Konvention, beide Arme gleich) |
| Reihenprüfung | `reiheKaputt` (F1), letzte Kerze weg (#85) — beide Arme gleich |
| Endpunkt-Baustein | Tagesrendite Schluss(t−1)→Schluss(t) je Wert |
| Paarung | je Handelstag: Mittel(Verschwundene) − Mittel(Überlebende) = d_t |
| Fenster | 2024-08-23 … 2026-08-24 (Datenstand des Laufs; ~496 Paartage, Tage ohne Verschwundene fallen) |
| Beschnitt Verschwundene | Kerzen nach `delistet` + 1 Handelstag fallen (wie 26.08.) |

## 2. Endpunkt und Testfamilie

**Primär: ĉ = Mittel(d_t)** über alle Paartage; Streuung PRIMÄR aus ersten Differenzen
(sd(d_t − d_{t−1})/√2, mittelwertfrei — die Zahl, die der Tüftler ohne Blick auf den
Mittelwert bestimmt hat: 0,0586 Pp), gewöhnliche sd als Gegenprobe (0,0693); se = σ/√n,
t = ĉ/se. **Testfamilie `ueberlebensluecke-wege`, testsGesamt = 2** — Mitglied 1 ist
dieser Lauf, Mitglied 2 die spätere Übernacht-Fassung (hiermit vorregistriert als
Familienmitglied; sie bekommt vor ihrem Lauf ihre eigene Vorregistrierung).
Schwelle: Bonferroni bei 2 Tests (|t| ≥ ~2,24, exakt aus der Maschinen-Formel,
im Lauf gedruckt). delta80 = (Schwelle + z₈₀)·se — erwartet ~0,008 Pp.

## 3. Bereits gesehene Zahlen — vollständige Erklärung

| Größe | Wert | gesehen |
|---|---|---|
| Unbedingt, alter zukunftslesender Boden (25.08.) | **+0,0141 Pp, t 4,26** | 25.08., Bestätigungshälfte |
| **Mein Z0 (26.08., eigene Konventionen: H=4, Lücken-Einstieg, Trailing-Boden, Winsorisierung)** | **−0,1250 Pp, t −2,15** | 26.08., als Kontext berichtet, nie beurteilt |
| Tüftler-Streuung (mittelwertfrei) | σ 0,0586 / 0,0693 Pp, 496 Tage, Anteil 7,73 % | 27.08., Mittelwert NIE gebildet |

**Ehrliche Lage:** Die Richtung ist damit zweimal in GEGENSÄTZLICHE Richtungen
angedeutet worden — beide Male unterhalb einer Familienschwelle, beide Male mit anderen
Konventionen. Der exakte Weg-3-Endpunkt (H=1, 5-Mio-Schnitt, #85-Kerze weg) ist von
niemandem berechnet. **Dieser Lauf entscheidet die Frage; er bestätigt nicht meine
eigene Z0-Zahl** — fällt ĉ nahe −0,125, ist das Konvergenz zweier Anordnungen, fällt
es anders, gilt DIESER vorregistrierte Wert, und die Abweichung wird berichtet statt
wegerklärt.

## 4. Wächter — Reihenfolge fest, vor der echten Kohorte

1. **W1 Kunstinjektion (Positivkontrolle, Pflicht):** 200 zufällige Überlebende
   (Seed 20260827) erhalten als Pseudo-Verschwundene einen eingebauten Zusatz von
   **−0,05 Pp je Tag** (Größenordnung 6× delta80); Sollwert exakt aus der Injektion,
   Wiederfindung ±30 %, sonst Endpunkt widerlegt, kein echter Lauf.
2. **W2b Maschinen-Null:** 200 Ziehungen, je zwei disjunkte Zufalls-Arme aus den
   Überlebenden in Verschwundenen-Größe (~177/Tag) mit nachgestellten Kalenderspannen;
   |Mittel über Ziehungen| < ¼·(Schwelle+z₈₀)·sd(Ziehungen), sonst ungültig.
3. Wachhund je Archiv (1d), Klassifizierungs-Wächter, ein Lauf, Werkzeug vor dem
   ersten echten Lauf committet.

## 5. Entscheidungsregeln — vorab

- **R1 Richtung belegt** (Vorzeichen benannt: negativ = Archiv beschönigt), wenn
  |t| ≥ Familienschwelle.
- **R2 im Fenster ohne messbare Richtung**, wenn |t| < Schwelle und 90-%-Band ganz
  in ±delta80.
- **R3 sonst nicht entscheidbar.**
- **Materialität nur BERICHTET, nicht beurteilt:** ĉ gegen die Anker 0,04/0,10 Pp
  (Hürden-Regel F2=2c ist noch ohne Zahl) und gegen die delta80 der zwölf Protokolle —
  nachrichtlich, mit dem Fenster-Vorbehalt.
- **Sperrliste wörtlich:** kein Kanten-Urteil, kein E1-Leiserstellen, keine
  Übernacht-Aussage (Mitglied 2), Fenster 2024-08→2026-08 ≠ 2008/09, Stichprobe
  1.023 von 6.921 (Auflösung der Stichprobe, nicht Vollständigkeit der Lücke).

## 6. Werkzeug

`messe-weg3.js` in diesem Ordner (wird nach dieser Registrierung gebaut und VOR dem
ersten echten Lauf committet); Kohortenlauf erst nach PM-Rückmeldung auf diese
Vorregistrierung — wie bei den zwei Messungen zuvor.

---

## 7. Nachtrag 27.08. ~09:3x — Endpunkt korrigiert, VOR dem Werkzeugbau

Beim Spiegeln des Tüftler-Werkzeugs (`zaehle-lueckenfenster.js`, Zeile 157) zeigte
sich: **Meine §1/§2-Beschreibung war falsch — die gezählte Differenzreihe ist
ANTEILS-GEWICHTET:** d_t = f_t · (Mittel_V − Mittel_S) · 100 mit f_t = Anteil der
Verschwundenen am Tages-Querschnitt (~7,7 %). Nur für DIESE Reihe gilt σ = 0,0586 Pp
und der Faktor 24; die rohe Kohortendifferenz wäre ~13-fach breiter und läge NICHT
über der Schwelle. Festlegung hiermit:

1. **Primärendpunkt = die gewichtete Reihe, exakt wie gezählt.** Sie hat die richtige
   Bedeutung für die Frage: f·(V−S) ist die Verschiebung, die die Lücke dem gepoolten
   Tages-Querschnitt des Archivs aufprägt — »wie stark drückt das Fehlen dieser Werte
   den Archiv-Messwert«, direkt in Archiv-Einheiten.
2. **B13-Vorkehrung (die 25.08.-Falle: gewichteter Schätzer gegen feste Hürde):**
   Die ungewichtete Kohortendifferenz ĉ_roh UND die f-Zeitreihe werden getrennt
   ausgewiesen; jeder Anker-Vergleich (0,04/0,10 Pp) nennt ausdrücklich, dass er die
   GEWICHTETE Größe misst, und bleibt nachrichtlich (kein Urteil — wie registriert).
   Das Richtungsurteil R1 fällt auf der gewichteten Reihe; das Vorzeichen beider
   Größen ist identisch (f > 0), die Richtung ist also gewichtsfrei gültig.
3. **Weitere gespiegelte Konventionen, jetzt exakt:** Überlebende min. 100 Kerzen,
   Verschwundene min. 20; Umsatzschnitt je BEOBACHTUNG (Schluss × Tagesumsatz ≥ 5 Mio $);
   Überlebenden-Tage ab 2024-08-23; BREITE_MIN 20 Überlebende je Tag; Tage ohne
   Verschwundene fallen. Mein zusätzlicher Beschnitt am Delisting-Datum ist gegenüber
   der Zählung redundant (Phantom-Schwänze haben Umsatz 0 und fallen am
   5-Mio-Schnitt von selbst) — er bleibt als Gürtel-und-Hosenträger, ändert aber
   nachweislich keine Beobachtung.

*Korrigiert vor Werkzeugbau und Lauf; kein Wert existiert. Der Fehler wäre im Lauf
als Faktor-13-Diskrepanz zwischen registrierter und gezählter σ sofort aufgefallen —
besser, er fällt hier auf.*

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
