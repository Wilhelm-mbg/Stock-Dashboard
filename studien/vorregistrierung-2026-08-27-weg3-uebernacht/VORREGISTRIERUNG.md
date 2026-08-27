# Vorregistrierung — Überlebenslücke Weg 3, Familienmitglied 2: die Übernacht-Fassung

**Stand:** 27.08.2026 ~18:15, **datenblind geschrieben, BEVOR der 1d-Vollauf gemeldet
ist** — kein Eröffnungskurs dieser Kohorte wurde gesehen. **Rolle:** Berechnungen.
**Familie:** `ueberlebensluecke-wege`, testsGesamt = 2 (Mitglied 1 = Schluss-zu-Schluss,
belegt 27.08. vormittags; dieses ist Mitglied 2 — die Familie wurde in Mitglied 1
vorab deklariert, die Schwelle |t| ≥ 2,2414 ist dieselbe und wird im Lauf exakt aus
der Maschinen-Formel gedruckt).

## 0. Frage

Mitglied 1 hat belegt: unbedingt, Schluss-zu-Schluss, untertreibt das Archiv
(+0,0568 Pp gew., t 20,99). **Wo im Tag sitzt die Lücke — über Nacht oder im
Handelstag?** Gemessen wird die ÜBERNACHT-Komponente derselben Kohortenfrage:
Rendite je Wert **Schluss(t−1) → Eröffnung(t)**, gepaart je Handelstag wie gehabt.
Kein Signal, keine Strategie, kein Kanten-Urteil.

## 1. Anordnung — identisch Mitglied 1 bis auf den Endpunkt-Baustein

Arme (massive/tagesdaten vs. archiv1d), Wertpapierart (WP.istAktie + Testkürzel-Riegel
+ klassifizierungDa), Liquidität (5-Mio-$-Umsatzschnitt), Reihenprüfung (reiheKaputt,
#85-Kerze weg), Beschnitt (delistet + 1 HT), Fenster (Datenstand des Laufs, ~496
Paartage erwartet): **alles unverändert aus Mitglied 1.** Neuer Baustein:
ÜN-Rendite(t) = Eröffnung(t)/Schluss(t−1) − 1 (Balkenformat [zeit, schluss, umsatz,
hoch, tief, **eroeffnung** = Feld 5]).

**Primärer Endpunkt (wie Nachtrag 7 des Mitglieds 1, gewichtet):**
d_t = f_t · (V̄_ÜN,t − S̄_ÜN,t) · 100, f_t = Verschwundenen-Anteil des Tages;
ĉ = Mittel(d_t), Streuung primär aus ersten Differenzen, gewöhnliche sd als
Gegenprobe, t = ĉ/se. Ungewichtetes c_roh nachrichtlich.

**Intraday-Komponente (Eröffnung(t)→Schluss(t)) wird im selben Lauf mitberechnet,
aber NUR NACHRICHTLICH berichtet — kein Urteil, keine Schwelle.** Die Familie hat 2
Tests; ein drittes Urteil gäbe es nur mit neuer Familie. Die Zerlegungs-Identität
(ÜN ∘ Intraday = Tag, multiplikativ) wird als Konsistenz-Ausweis gedruckt, nicht als
Residuum gebildet.

## 2. Machbarkeit (Brille 9 — Sperre VOR der Registrierung, hier bestanden)

Gleiche Paartage wie Mitglied 1 (~496), gleiches Gewicht f; die Streuung einer
Tages-KOMPONENTE ist höchstens von der Größenordnung der Tages-Streuung
(σ_FD 0,0603 Pp bei Mitglied 1, se 0,0027) → **delta80 ≈ 0,008–0,010 Pp** — vier
Größenordnungen unter dem belegten Tages-Effekt und weit unter jeder plausiblen
Komponenten-Aufteilung. Die Frage ist mit vorhandenen Daten beantwortbar; kein
Sperrfall.

## 3. Gesehene Zahlen — vollständig deklariert

Mitglied 1: c_gew +0,0568 Pp (t 20,99), c_roh +0,7842 Pp, f̄ 6,67 %, 496 Paartage ·
Z0 (26.08.) −0,125 Pp t −2,15 · Z1 bedingt −3,78 Pp t −6,19 · Auflösungswand-Notiz
26.08. (H=1-Übernacht-delta80 der KANTEN-Rechnung, andere Frage). **Von der
ÜN-Komponente dieser Kohorte hat niemand je eine Zahl gebildet. Es wird KEINE
Richtungserwartung registriert** — ÜN trägt alles / Intraday trägt alles / gemischt /
gegenläufig sind alle vier zulässige Ausgänge; berichtet wird, was fällt.

## 4. Wächter — Reihenfolge fest, vor der echten Kohorte

1. **W1 Kunstinjektion** (Positivkontrolle): 200 Pseudo-Verschwundene (Seed 20260827)
   mit eingebautem ÜN-Zusatz **−0,05 Pp je Tag**; Wiederfindung ±30 %, sonst Endpunkt
   widerlegt, kein Lauf.
2. **W2b Maschinen-Null:** 200 Ziehungen disjunkter Zufalls-Arme aus den Überlebenden
   in Verschwundenen-Größe; |Mittel| < ¼·(Schwelle+z₈₀)·sd(Ziehungen).
3. **W3 Eröffnungs-Dropout (NEU, differentieller Ausfall):** Anteil gültiger
   Eröffnungen je Arm je Tag; **unterscheidet sich die Gültigkeitsquote der Arme im
   Fenstermittel um > 10 Pp absolut, ist der Lauf »nicht messbar«** — fehlende
   Eröffnungen könnten mit dem Verschwinden zusammenhängen (Ausschluss auf die
   Zielgröße, Brille 7). Beide Quoten werden immer ausgewiesen.
4. **W4 Eröffnungs-Plausibilität (Stempel-Kerzen-Lehre fürs neue Feld):**
   Eröffnung außerhalb [Tief, Hoch] des Tages oder ≤ 0 → Zeile ungültig; Quote je Arm
   ausgewiesen. Liegt sie in einem Arm über 2 %, wird der Lauf angehalten und der
   Befund gemeldet, bevor irgendein ĉ gebildet wird.
5. Wachhund archiv1d (je Archiv), ein Lauf, Werkzeug vor dem ersten echten Lauf
   committet.

## 5. Entscheidungsregeln — vorab

- **R1 Richtung belegt** (Vorzeichen benannt: positiv = Archiv untertreibt über
  Nacht), wenn |t| ≥ Familienschwelle (~2,2414, exakt aus der Maschine).
- **R2 im Fenster ohne messbare Richtung**, wenn |t| < Schwelle und 90-%-Band ganz in
  ±delta80.
- **R3 nicht entscheidbar** sonst; **nicht messbar** bei W1/W3/W4-Riss.

## 6. Lauf-Gate und Sperrliste

**Der Lauf startet ERST nach der Vollauf-Meldung des 1d (PM/06) und bestandenem
W3/W4-Vorlauf.** Diese Registrierung ist final; zulässig sind nur datierte Nachträge
VOR dem Lauf. Sperrliste: kein Kanten-Urteil · keine Reparatur-/Gewichtungs-Empfehlung
aus diesem Lauf · Intraday nur nachrichtlich · Ergebnis nur in diesen Ordner ·
kein Urteil über die 5-Mio-Deutungsgrenze hinaus (heiße Tage der dünnen Seite,
wie Mitglied 1).

---

## Nachtrag 1 (~18:40, VOR dem Bau) — W3 bekommt eine absolute Untergrenze

**PM-Einwand, übernommen:** W3 verglich nur die Gültigkeitsquoten der Arme
MITEINANDER und fing damit nur ASYMMETRISCHEN Ausfall. **Symmetrischer Ausfall
(beide Arme verlieren gleichmäßig aus demselben Grund) bliebe grün — und der Lauf
rechnete auf einer Population, die von der Auswahl selbst erzeugt sein kann.** Das
ist die Fehlerform des Tages (»der Wächter prüft etwas anderes, als man meint«).

**Festlegung:** Zusätzlich zur relativen 10-Pp-Schranke gilt: **Liegt die
Gültigkeitsquote der Eröffnungen in AUCH NUR EINEM Arm unter 90 % (gezählt auf den
tatsächlich gepaarten, liquiditätsgefilterten Zeilen), ist der Lauf »nicht
messbar«.** Herleitung statt Ratens: Der 1d-Pilot maß 99,5 % Eröffnungs-Abdeckung
im Fenster (Überlebende); nach dem 5-Mio-$-Tagesfilter ist ein fehlender
Eröffnungsdruck kein Rauschen, sondern ein Strukturbefund im Feld — 90 % lässt
großzügigen Raum für die Verschwundenen-Seite und reißt trotzdem, bevor eine
ausgewählte Restpopulation den Endpunkt trägt. Beide Quoten werden unverändert
immer ausgewiesen.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
