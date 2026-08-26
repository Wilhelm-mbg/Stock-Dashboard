# Vorregistrierung — Strang A: momentum nicht überlappend, REFERENZMESSUNG AUSSER KONKURRENZ

**Stand:** 27.08.2026, ~01:1x — vor jedem Rechenschritt. **Rolle:** Berechnungen.
**Entscheide, die diese Fassung bindet:** Wilhelm F1 = 1a, F2 = 2c, F3 = 3a
(Tafel 27.08. 00:20/00:55) auf den Entwurf `studien/entwuerfe-2026-08-26/strang-a-momentum.md`.
**Vorgänger:** Eichung 25.08. (`studien/momentum-nichtueberlappend/`, g = 1,543,
Anordnung validiert) · B10/Eichungs-Klärung (Anhang 5 des Entwurfs: der t-Sprung
1,03 → 2,10 ist zu 100 % Schätzer) · Verzerrungsmessung 26.08. (Archiv beschönigt;
Richtung belegt).

---

## 0. Was diese Messung IST und was sie NICHT sein kann

**Sie ist eine Referenzmessung außer Konkurrenz (F3 = 3a):** die einzige noch offene
große Anordnung des Korpus (momentum, stärkste 10 %, 63 Handelstage, nicht überlappend)
einmal sauber durch die Mühlen-Disziplin — Placebo, Kontrolle, Positivkontrolle,
Familie, Einschränkungen — damit es EINE ehrliche Bezugszahl gibt statt des nachweislich
falschen überlappenden Protokolls (t = 4,74 war Pseudo-Replikation; t = 0,74 mit
Newey-West ist 54 % übervorsichtig).

**Sie kann kein Beleg sein, per Konstruktion:** Beide Hälften der Historie sind gesehen
(Entdeckung seit 24.08., Bestätigung durch die Eichung am 25.08.: +1,537 Pp je Umlauf,
se 0,732, t 2,10). Deshalb, vorab und unumstößlich:

- **Der Ausgang „bestätigt" ist ausgeschlossen.** Liefert die Maschine ein
  bestätigt-artiges Etikett, wird es im Ergebnis, auf der Tafel und in jedem Protokollfeld
  als **„außer Konkurrenz — kein Beleg (Hälften verbrannt)"** geführt. Der Belegstand
  des Projekts bleibt davon unberührt: **NULL belegte Kanten.**
- Erreichbare Aussagen: ein **Referenzwert** (Punktschätzer ± se, delta80), ein
  **„widerlegt"** (das wäre neu und stünde), oder **„nicht entscheidbar"**.
- Kein Eintrag in die Kandidaten-/Aussichtstabellen als Kandidat; die Beschriftung
  „außer Konkurrenz" wandert in jede Zeile, die diese Messung zitiert.

## 1. Anordnung — exakt die geeichte, nichts Neues

| | |
|---|---|
| Archiv | `E:/Markt-Dashboard-Archiv/archiv1d` (Stand nach dem Nachtlauf 27.08.) |
| Universum | `WP.istAktie` (CS/ADRC), Mindesthistorie wie Eichung, MINDEST_WERTE 100 |
| Merkmal | Rendite t−252 … t−21 (Rückblick 231, Lücke 21) |
| Auswahl | stärkste **10 %** (Live-Einstellung des Buchs) |
| Haltedauer | 63 Handelstage, feste Kalender-Umschichtung |
| Vergleich (Kontrolltopf) | gleichgewichteter Mittelwert **aller** zulässigen Werte derselben Periode |
| Schnitt | 2006-08-14 (wie Maschine und Eichung) |
| Rasterlage | **Phase 0** primär (B9, keine Wahl); alle 63 Lagen als Streubild, beschreibend |
| Zeitraum | **volle Historie** (beide Hälften — sie sind ohnehin gesehen; getrennt UND gesamt ausgewiesen) |

**Der Auftrag verbietet Neues ausdrücklich:** kein neuer Detektor, keine
Parametersuche, keine zweite Auswahlquote. Wer hier eine Variante ergänzt, hat den
Auftrag missverstanden.

## 2. Endpunkte

Primär: **Überschuss je Umlauf** (Pp) = Depotrendite der Periode minus Kontrolltopf,
Phase 0, volle Historie; Mittel, sd, se = sd/√n (echt unabhängige Perioden, keine
NW-Korrektur nötig — das ist der Sinn der Anordnung), t = Mittel/se.
**testsGesamt = 1** (eine Konfiguration; das Streubild sind keine Tests).
Ausgewiesen werden außerdem: die zwei Hälften getrennt · alle 63 Lagen (Min/Median/Max)
· **delta80 = (1,960 + 0,8416) · se** in Pp je Umlauf (die Währung von Wilhelms
Schranke) · Signal-/Periodenzahlen · die B10/g-Kette als Kontrollabdruck (se_naiv,
se_NW, se_unabhängig müssen die Kette aus Anhang 5 reproduzieren, Toleranz 5 %).

## 3. Wächter — Reihenfolge fest, vor der echten Rechnung

1. **W1 Kunstinjektion (Positivkontrolle; Pflicht laut Hausregel für jeden möglichen
   Nullbefund):** In einer Archiv-KOPIE erhalten die jeweils gewählten Zehntel-Mitglieder
   einer Periode einen eingebauten Zusatz von **+2 Pp je Umlauf** (gleichmäßig über die
   63 Kerzen, Seed 20260827). Sollwert vorab aus der Injektion; die Maschine muss
   ĉ_kunst − ĉ_basis = +2 Pp ± 30 % wiederfinden, sonst ist der Endpunkt widerlegt und
   nichts Echtes wird gerechnet.
2. **W2 kursblinder Placebo:** identischer Ablauf, aber die Auswahl je Periode ist eine
   seed-feste Zufallsziehung gleicher Größe (kein Kursbezug). Richtige Antwort:
   Überschuss ≈ 0. Regel: |ĉ_placebo| < delta80 des Laufs, sonst Messung ungültig
   (die Kontrolle wäre schief).
3. Erst danach der eine echte Lauf. **Wachhund vor jeder Archivberührung; Exit 2 =
   Sperre = kein Lauf.** Jeder Rechenschritt in einem frischen Node-Prozess.

## 4. Die Kostenhürde — Regel statt Zahl (F2 = 2c)

**Die Hürde je Umlauf ist der Median der gemessenen Auktions-Rundenkosten des
Demo-Kontos für AKTIEN über mindestens 20 Aktienrunden**, Stand zum Zeitpunkt des Laufs;
die Anlageklassen-Trennung der Kostenmessung ist dafür Blocker (Tafel 27.08.).
**Bis diese ≥ 20 Runden existieren, wird delta80 gegen die zwei Anker 0,04 und
0,40 Pp je Umlauf nur BERICHTET, nicht beurteilt.** Die Regel steht hiermit fest;
die Zahl trägt sie später selbst ein.

## 5. Überlebenslücke — benannte Einschränkung mit Vorzeichen (Pflichtblock)

Jede Zahl dieser Messung steht auf einem Überlebenden-Archiv. Gezählt (Tüftler 26.08.):
mindestens **12,7 %** des Querschnitts fehlen über das Fenster 2008–2026, steigend auf
~20 % (2023), vor 2004 unbeziffert. Gemessen (Berechnungen 26.08.): die Richtung ist
**beschönigend** (Dip-Zwilling c = −3,78 Pp, t = −6,19; unbedingt −0,125 Pp, t −2,15).
Für momentum existiert **kein Korrekturwert** — der Punktschätzer dieser Referenz ist
deshalb als **Obergrenze unbekannter Schärfe** zu führen, in jedem Satz, der ihn zitiert.

## 6. Teil 2 — die prospektive Regel (die einzige ungesehene Hälfte ist die Zukunft)

Das virtuelle MOMENTUM-Buch (läuft seit 8.20.0, exakt diese Anordnung) wird das
vorregistrierte Prüfgerät. Regeln, hiermit fixiert:

1. Nach jeder abgeschlossenen 63-Tage-Periode wird ihr Überschuss (Buch minus
   EW-Universum derselben Periode, Pp je Umlauf) an
   `studien/vorregistrierung-2026-08-27-strang-a/prospektiv-ledger.json` angehängt —
   nur angehängt, nie geändert.
2. **NEIN-Seite (kann früh fallen):** Ist nach n ≥ 8 neuen Perioden das prospektive
   Mittel < −delta80_Referenz, gilt die JA-Hypothese als praktisch tot; Meldung an
   PM/Wilhelm, das Buch bleibt virtuell.
3. **JA-Seite (ehrlich: Jahrzehnte):** frühestens ab t_prospektiv ≥ 1,960 auf
   ausschließlich prospektiven Perioden; bei se je Periode ≈ 6,5 Pp und wahrem Effekt
   +1,5 Pp sind das ~75 Perioden ≈ 19 Jahre. Diese Zahl steht hier, damit niemand in
   zwei Jahren „fast belegt" liest.
4. Zwischenstände werden berichtet, nie beurteilt.

## 7. Sperren für den Lauf (alle müssen fallen, Reihenfolge egal)

1. Wilhelms Datenfund-Vorrang: die zwei Funde (Phantom-Dochte — dessen Dringlichkeit
   misst gerade meine Docht-Empfindlichkeitsmessung —, der 25.08.) sind behoben oder
   ausdrücklich freigegeben.
2. Kostenmessung: ≥ 20 Aktienrunden (nur für den BEURTEILTEN Hürdenvergleich; der
   Referenzlauf selbst könnte vorher fahren, wenn PM/Wilhelm das wollen — dann mit
   Anker-Bericht statt Hürden-Urteil).
3. PM-Rückmeldung auf diese Vorregistrierung (wie bei der Verzerrungsmessung: melden,
   wenn sie steht — nicht erst nach dem Lauf).
4. Wachhund Exit 0 auf archiv1d.

## 8. Werkzeug

`messe-strang-a.js` in diesem Ordner (wird nach dem Docht-Lauf gebaut und VOR dem
ersten echten Lauf committet): erweitert die Eichungs-Maschine
(`studien/momentum-nichtueberlappend/messen.js`) um W1/W2, volle Historie, delta80-
Ausweis, Kettenabdruck und die Außer-Konkurrenz-Beschriftung in jeder Ausgabe.
Schreibt nur in diesen Ordner. Überschreibt nichts.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
