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

## 9. Nachtrag 27.08. ~01:2x — PM-Zustimmung und zwei Festlegungen VOR dem Lauf

**Sperre 3 ist gefallen:** Der PM hat die Vorregistrierung gelesen und zustimmend
beantwortet (Nachricht ~01:15). Seine dritte Anmerkung verlangt eine Festlegung, sie
kommt hiermit:

**a) Der Kontrolltopf ENTHÄLT die gewählten stärksten 10 % — absichtlich, unverändert
zur Eichung.** Gründe: (1) Der Auftrag verbietet Neues; die Eichung, das überlappende
Protokoll und das laufende virtuelle Buch messen alle gegen den Alle-Werte-Topf — eine
Referenz, die den Maßstab wechselt, wäre mit nichts vergleichbar. (2) Die Dämpfung ist
**deterministisch und bekannt**: enthält der Topf den Anteil a der Gewählten, gilt
algebraisch Überschuss_gegen_Rest = Überschuss_gegen_Alle / (1 − a); bei a ≈ 0,10 ist
das Faktor ≈ 1,11 — konservativ (dämpft zur Null, erzeugt nichts). **Das unterscheidet
diese Bauform von A6**, wo die gepaarte Kontrolle den Effekt fast vollständig absorbierte
(Faktor 45). (3) Die Rest-Fassung wird **nachrichtlich mitgedruckt** — als reine
Umrechnung über die je Periode gemessenen a_P, nicht als zweiter Test; testsGesamt
bleibt 1.

**b) Reichweite von W1, damit es später niemand falsch liest:** Die Kunstinjektion
trifft die **bereits gewählten** Zehntel-Mitglieder. W1 prüft also die
**Überschuss-Arithmetik** (findet die Maschine einen eingebauten Effekt der Gewählten
wieder?), **nicht die Auswahl** (ob das Merkmal die Richtigen wählt). Dieser Satz
wandert wörtlich ins Ergebnis. Operationalisierung, vorab: je Periode wird für gewählte
Werte die Folgerendite ersetzt durch (1+folge)·1,02 − 1; der **Sollwert wird exakt aus
den injizierten Beträgen berechnet** (einschließlich der Topf-Verwässerung um a_P und
des multiplikativen Anteils) und vor dem Vergleich gedruckt; Band ±30 %. W2-Regel
operationalisiert: |Placebo-Mittel| < (1,960 + 0,8416) · se_Placebo.

**c) Kettenabdruck (§2) präzisiert:** Der 5-%-Abgleich der B10/g-Kette läuft auf der
**Bestätigungshälfte** dieses Laufs gegen se_NW = 1,1293 Pp aus dem abgelegten
überlappenden Protokoll (Var 0) — die Hälfte, auf der g = 1,543 gemessen wurde; die
Gesamthistorie hat eine andere Basis und wäre kein fairer Abdruck.

**Sperrenstand nach diesem Nachtrag:** **Sperre 1 steht** (Wilhelms Datenfund-Vorrang).
Der PM hatte zunächst vermutet, sie binde archiv1d technisch nicht, und hat diese
Prämisse selbst zurückgezogen (~01:25): der Tafelsatz „Tagesarchiv nicht betroffen"
galt #96 (flache 20:00-Kerze), **nicht** den Phantom-Dochten — ob die auch auf 1d
sitzen, misst die QS gerade (markt-dashboard-ab). **Bis zu Wilhelms Wort gilt die
Sperre.** Sachlich dazu, für die Vorlage an Wilhelm: **diese Messung liest
ausschließlich Schlusskurse** (Merkmal aus Schlüssen t−252/t−21, Folgerendite
Schluss→Schluss; kein Stop, kein Hoch/Tief im Rechenweg) — Phantom-DOCHTE könnten sie
also selbst dann nicht verzerren, wenn die QS sie auf 1d findet; relevant für diese
Messung wäre nur ein Schlusskurs-Defekt (QS-Zeitbefund: Schlüsse nach einem Tag <1 %
Änderungen). Das ist ein Fakt zur Entscheidung, keine Aufhebung — entscheiden tut
Wilhelm. Sperre 2 nur fürs Hürden-Urteil. Sperre 3 gefallen. Sperre 4 Wachhund
(die verwaiste 1d-Sperre — PID 52300 tot — bewertet der Wachhund, nicht ich).
Das Werkzeug (§8) wird jetzt gebaut, damit der Lauf sofort starten kann, wenn Wilhelm
Sperre 1 löst.

---

## 10. Nachtrag 27.08. ~01:5x — Sperrlage aktualisiert, eine neue benannte Einschränkung

**a) Sperrlage (PM-Meldung ~01:45):** Von den drei 26.08.-Datenfunden sind zwei
erledigt (markt-dashboard-1d): die fünf „falschen" Delistings sind in Wahrheit **echt**
(SEC-belegt, 25-NSE + 8-K Item 2.01 — das Warnsignal selbst war der Fehler), und
`massive-tagesdaten.js:29` ist als rollendes 730-Tage-Fenster geklärt. Offen: die
Wachhund-Rundung. Wilhelms Sperre 1 (Phantom-Dochte, 25.08.) steht unverändert bis zu
seinem Wort; die QS-Befunde (1d nicht betroffen, Schlusskurs-Konsistenztest ab 03:45)
liegen ihm morgen vor. **Auswirkung der Delisting-Korrektur auf die Verzerrungsmessung
vom 26.08.: keine** — AVB/EQR/WBS & Co. hatten keine Kursdateien im massive-Bestand und
standen in keiner Kohorte; der dortige Automatik-Filter fand folgerichtig 0 Fälle.

**b) Neue benannte Einschränkung zu §5 (QS-Zählung, vom PM auf die Tafel gehoben):**
Das Tagesarchiv enthält **158.733 Nullumsatz-Tage (1,02 %), Schwerpunkt in den
1990ern.** Eine flache Tageskerze liefert Rendite null und schiebt die Bewegung auf den
Folgetag (Stale-Price-Effekt). Für diese Messung heißt das: Merkmals-Ränge illiquider
Werte und der gleichgewichtete Kontrolltopf können in der Frühzeit der Historie auf
veralteten Kursen stehen; die Richtung ist nicht vorab bestimmbar. **Sie wird als
Einschränkung geführt, nicht behandelt** — eine Behandlung (z. B. Liquiditätsboden)
wäre eine neue Anordnung und damit ein zweiter Test, den der Auftrag verbietet. Wenn
Wilhelm die Größe beziffert haben will: das wäre eine eigene, klein vorregistrierte
Empfindlichkeitsmessung nach dem Muster der Docht-Messung (A/B mit ausgeschlossenen
Nullumsatz-Tagen), NACH dem Referenzlauf, nicht darin.

---

## 11. Nachtrag 27.08. ~02:0x — Nullumsatz-Sprungkerzen: mit dem eigenen Filter nachgezählt

Auf QS-Befund (Stempel-Kerzen LBRDA/LBRDK, ~89 mutmaßliche Split-Ränder) habe ich rein
lesend gezählt, was davon **meinen** Universumsfilter überlebt (WP.istAktie + F1 +
Mindesthistorie — exakt der Lader dieses Werkzeugs). **Positivkontrolle bestanden:** die
Zählung fand die drei von der QS benannten, im Universum erwarteten Fälle exakt wieder
(LBRDA +16,6 %, LBRDK +16,8 % am 21.08.; PECO +200,0 % = 3:1).

**Ergebnis:** F1 wirft die harten Split-Ränder als **ganze Reihen** (ASTH +750 %,
ARWR −88 % → beide komplett draußen; insgesamt 36 Reihen). Im Universum **verbleiben
50 Nullumsatz-Kerzen mit |Sprung| > 10 %** über ~30 von 2.213 Reihen: 39 vor 2005,
6 bis 2014, **5 ab 2015** — bei ~22 Mio Kerzen ein 2-ppm-Phänomen, konzentriert in der
Kleinwert-Illiquidität der 80er/90er (+50 %/+100 %-Einzelkerzen bei Regionalbanken),
dazu PECO 2021 (Split-Rand, +200 %) und die zwei bestätigten Stempel LBRDA/LBRDK
(21.08.2026, jeweils letzte Kerze der Datei).

**Einordnung und Festlegung:** Ein solcher Tag kann über den Level-Shift im
Rückblickfenster einen Merkmals-Rang verschieben und im Haltefenster eine
Periodenrendite prägen — bei 50 Kerzen auf 155 × ~2.000 Perioden-Beobachtungen ist der
erwartete Einfluss klein, aber nicht null, und die Richtung nicht vorab bestimmbar.
**Geführt als benannte Einschränkung neben Nachtrag 10b; nicht behandelt** (jede
Bereinigungsregel wäre eine neue Anordnung). Die Liste der 50 liegt reproduzierbar im
Zähl-Einzeiler dieser Prüfung (Kriterium: Umsatz 0 und |Schluss/Vortagesschluss − 1| >
10 %); wer sie beziffert haben will: dieselbe kleine A/B-Empfindlichkeitsmessung wie
für Nachtrag 10b, NACH dem Referenzlauf.

*Nebenbefund an die Datenqualität (nicht meine Baustelle, aber gezählt): F1 verwirft
36 ganze Reihen wegen einzelner kaputter Ränder — darunter frische Fälle wie BYND
+2920 % am 2026-07-20 und CHRD +25733 % am 2020-11-20. Das ist die bekannte harte
Bauart des Filters; die Fälle gehören auf die Tafel, nicht in diese Messung.*

---

## 12. Nachtrag 27.08. ~02:1x — Phantom-Schwänze (falsche Existenz): geprüft, benannt

Auf PM/QS-Befund (Reihen, die aufgehört haben, tragen flache Nullumsatz-Schwänze — ein
Stempel je Sammellauf, der Schwanz **wächst** also täglich) rein lesend geprüft, mit
meinem eigenen Lader:

1. **Im Universum:** AVB (Schwanz 5 Kerzen, 17.–21.08.) und EQR (4 Kerzen) — beide
   Aktie, F1-sauber, **JA**. Die drei Anleihe-ETF-Schwänze (IBDP, IBTE, BSCO) wirft
   der Wertpapierart-Filter. LBRDA/LBRDK tragen keinen flachen Schwanz, sondern je
   eine Sprung-Stempelkerze — das ist die Fallklasse aus Nachtrag 11.
2. **Wählbar und haltbar?** **Heute realisiert: nein.** Die letzte vollständige
   Phase-0-Periode läuft 02.03.–01.06.2026 — der Schwanz liegt dahinter, außerhalb
   jedes Halte- und Merkmalfensters; und in der letzten Periode ranken AVB/EQR mit
   Merkmal −21,6 %/−16,0 % auf Rang 1845/1751 von 2.213 (Zehntel-Schwelle: +84,7 %).
   **Strukturell: ja.** Sobald das Archiv ~eine Handelswoche wächst, entsteht die
   Periode 01.06.→Anfang September, die die Phantomtage mit eingefrorener Rendite
   durchträgt; und ein künftiger Fall mit Übernahme-Run-up (die typische Konstellation)
   würde gewählt UND gehalten. Nullrendite statt echtem Ausgang ist in beide Richtungen
   falsch — und es ist die Richtung, in der Überlebensverzerrung entsteht, nicht die,
   in der sie auffällt.
3. **Benannt, nicht behandelt** (Reihe: 158.733 flache Tage → 50 Sprungkerzen →
   Phantom-Schwänze). Für den JETZT anstehenden Referenzlauf ist der realisierte
   Einfluss null; für jeden späteren Lauf auf gewachsenem Archiv ist er strukturell
   angelegt und wachsend.

**Ergänzung nach der vollständigen QS-Liste (~02:2x, 9 Reihen / 21 Tage):** Auch
**WBS** (1 Phantomtag, 20.08.) ist Aktie und im Universum — gleiche Lage wie AVB/EQR
(Schwanz jenseits der letzten Periode). **BTSGU** (1 Phantomtag 25.08., kein
Delisting-Eintrag, frischester Fall) fällt als Nicht-Aktie aus dem Universum. Und die
QS-Präzisierung ist wichtig und übernommen: **LBRDA/LBRDK liefern auf ihrem
Stempeltag keinen Nullstand, sondern +16,6/16,8 % ERFUNDENEN GEWINN** — die Fallklasse
mit der größten Wirkung, falls ein künftiges Periodenende auf so einen Stempel fällt.
Diese Messung hat keinen Liquiditätsfilter, der die Phantomtage abfangen würde
(nur WP-Art + F1) — die Existenz-Mechanik greift hier also strukturell, sobald das
Fenster sie erreicht.

**Entscheidungsbezug für Wilhelm (der PM trägt ihn vor):** Das Setzen der
Abmeldedaten für beendete Reihen ist **genau die strukturelle Reparatur** dieses
Mechanismus — ein Papier mit Ende kann nicht über sein Ende hinaus gehalten werden.
Mein Befund sagt: heute Kosmetik, ab nächster Woche Messhygiene.

---

## 13. Nachtrag 27.08. ~02:3x — QS-Einschränkung übernommen: der Schwanz ist gedeckelt, das Raster verengt weiter

**Die QS hat ihr eigenes „ein Stempel je Sammellauf" korrigiert** (Übergabe
qs-audit-2026-08-27-0145-STEMPEL-ZWEITER-ART.md): Nach 1–5 Stempeltagen **verstummt die
Reihe ganz** — keine der neun hat seit ihrem letzten Phantomtag eine weitere Kerze
bekommen (sechs mit Archivstand 26.08. belegt, AVB/EQR mit Stand 24.08. noch
unbestätigt; Falsifikationsbedingung reift beim nächsten Sammellauf). **Die gefährliche
Gestalt — eine dauerhaft flache Reihe ohne Rückschlag, die jede Momentum-Rangfolge nach
oben spült — tritt damit NICHT ein.**

**Meine Formel aus Nachtrag 12 („strukturell real und wachsend") wird ersetzt durch:
strukturell möglich, je Papier eng gedeckelt, im aktuellen Raster nicht realisiert.**
Denn die Perioden-Mechanik verengt die QS-Deckelung weiter: Ein Papier **ohne Kerze am
Periodenende ist gar kein Kandidat** dieser Periode (der Lader verlangt beide
Grenzkerzen). Wirkung entsteht also nur, wenn ein Phase-0-Periodenende **exakt in das
1–5-Tage-Schwanzfenster fällt.** Für AVB/EQR/WBS und das aktuelle Raster: nie — das
nächste Rasterende liegt bei ~02.09., die Reihen enden 20./21.08. Das Restrisiko
schrumpft auf: künftige Delistings, deren Schwanzfenster zufällig ein Rasterende
enthält — dann 1–5 eingefrorene Tage bzw. im LBRDA/LBRDK-Fall ein erfundener
Sprung als Periodenschluss. Größenordnung: ≤5/63 Wahrscheinlichkeit je betroffenem
Papier für genau eine Periode.

Offen bleibt (QS-Grenze, nicht meine): ob die Quelle verstummt oder der Sammler das
Symbol fallen lässt — für die Messung gleichgültig, für eine Reparatur nicht.
Wilhelms Abmeldedatum-Entscheid bleibt die saubere strukturelle Lösung; der
Dringlichkeitsgrad sinkt durch diesen Nachtrag von „ab nächster Woche Messhygiene"
auf „geordnete Hygiene ohne Termindruck".

---

## 14. Nachtrag 27.08. ~04:1x — die Deckelungs-These ist falsifiziert; Nachtrag 13 teilweise zurückgenommen

Die QS hat ihre eigene Falsifikationsbedingung ausgelöst (Lauf 6, Vermerk
qs-audit-2026-08-27-0400-VIER-LAEUFE.md): **BTSGU hat nach dem Nachtlauf einen
weiteren Phantomtag bekommen — die These »der Schwanz friert ein« ist damit als
allgemeine Aussage widerlegt** (sie fiel durch eine Beobachtung außerhalb der eng
gefassten registrierten Bedingungen; die QS meldet es selbst).

**Was das an Nachtrag 13 ändert:** Die Formel »je Papier eng gedeckelt« ist als
Allgemeinaussage zurückgenommen. Beobachtet bleibt: die Universums-Reihen (AVB, EQR,
WBS) haben weiterhin KEINE neuen Phantomtage; der wachsende Fall (BTSGU) liegt als
Nicht-Aktie außerhalb des Universums. **Unverändert gilt die Raster-Mechanik** (ohne
Kerze am Periodenende kein Kandidat) — aber wenn Schwänze wachsen KÖNNEN, kann ein
künftiger Universums-Fall die gefährliche Dauerflach-Gestalt doch ausbilden, und dann
trifft irgendwann auch ein Rasterende hinein. **Die Dringlichkeit von Wilhelms
Abmeldedatum-Entscheid steigt damit zurück von »geordnete Hygiene« auf »Messhygiene
mit Beobachtung«**: solange kein Abmeldedatum existiert, gehört das Schwanz-Wachstum
der Universums-Reihen beobachtet (die QS-Falsifikationsprüfung läuft ohnehin je
Sammellauf weiter).

*Bilanz der Nachträge 12–14, damit niemand die Kette verliert: 12 = Mechanik real,
heute nicht realisiert · 13 = Deckelung (QS) verengt weiter — 14 = Deckelung
widerlegt, Beobachtungspflicht statt Entwarnung. Der Referenzlauf selbst bleibt von
allen dreien unberührt (letzte vollständige Periode endet 01.06., vor jedem Schwanz).*

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
