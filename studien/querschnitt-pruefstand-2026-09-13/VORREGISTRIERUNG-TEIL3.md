# Vorregistrierung — Querschnitts-Prüfstand, **Teil 3**: Trend reiten (16.09.2026)

Nachtrag zu `VORREGISTRIERUNG.md` (Teil 1) und `VORREGISTRIERUNG-TEIL2.md` (Teil 2). Dieses Papier wird
**als erster Commit von Teil 3 geschrieben, vor jeder Zahl**. Die Maschine — Tafel, Prüfrahmen, Leck-Sperrklinke,
Kontrollen, Außen-Prüfstein, `test.js` (47) und `test-teil2.js` (20) — wird **benutzt, nicht neu gebaut**;
was ergänzt wird, steht in §T3.1 abschließend.

Alles Simulation mit virtuellem Kapital. **Keine Anlageberatung.** Nur Lesezugriff; kein Netz, kein Archiv, kein
Schlüssel. Die Referenzdatei liegt außerhalb des Repos und wird nur gelesen.

---

## T3.0 Was Teil 3 fragt — und was es ausdrücklich nicht fragt

Teil 2 hat gesucht und nichts gefunden; die Nachrechnung vom 15.09. (`belegstand.md`) ergab, dass die Bauart
„Dezil gegen Universum" mit ~22 Werten je Dezil nur Kanten ab 12–24 % je Jahr auflösen kann. **Teil 3 sucht
nicht.** Momentum 12-1 ist über neunzig Jahre dokumentiert, und unsere Reihe läuft mit Kenneth Frenchs
veröffentlichtem Faktor mit (Teil 2: ρ = 0,73 in der Long-Short-Fassung). Die Frage ist allein, **wie man es
fährt**: welches Universum, welche Absicherung, zu welchen Kosten — und ob es die Härtefälle 2018Q4, 2020
(Crash), 2020-11…2021-06 (Momentum-Einbruch) und 2022 übersteht.

**Nicht getestet wird die Nullhypothese „Momentum > 0".** Sie ist extern belegt und wird hier als Kontext mit
t und MDE ausgewiesen, aber nicht beurteilt. **Getestet werden die Varianten gegeneinander**, gepaart über
dieselben Monate (§T3.5). Testzahl für Urteile: **3** (V1, V2, V3 jeweils gegen V0).

---

## T3.1 Was an der Maschine ergänzt wird (abschließend)

1. **`universum()` in `pruefstand.js` nimmt `opt.klassen`** (Vorgabe: unverändert `K.UNIVERSUM_KLASSEN`
   = [2, 3]). `lauf()` reicht `opt` bereits durch. Ohne die Option rechnet die Maschine Byte für Byte wie
   bisher; `test.js` und `test-teil2.js` müssen danach unverändert grün sein (T3-P11), und die Momentum-Zahl
   von Teil 2 (netto +1,609984 Pp je Monat) muss mit `opt.klassen = [2, 3]` auf 1e-9 wiederkommen (T3-P12).
2. **`konfig.js` bekommt einen Teil-3-Block** mit den Zahlen dieses Papiers — jede genau einmal.
3. **Neu, neben der Maschine:** `varianten.js` (die vier Varianten als Überlagerung auf der V0-Tagesreihe,
   mit eigener Sperrklinke, §T3.3/§T3.6), `teil3.js` (Läufer), `bericht-teil3.js` (Bericht), `test-teil3.js`
   (Prüfungen §T3.9). Sie lesen die Tafel **nur** über den Prüfrahmen.

**Nicht ergänzt:** keine neue Datenquelle, kein neues Panel, keine neue Rangfunktion. Panel wie Teil 1/2
(9.899.585 Tageszeilen, 7.300 Reihen, 2016-01-04 … 2026-09-11).

---

## T3.2 Universum und Grundvariante V0

**Universum:** Umsatzklassen **50-250, 250-1000, ab1000** (Indizes 1, 2, 3), punkt-in-Zeit wie bisher:
Cent-Boden (Punkt 3), 250 Vortage, `quelle_rein`, Qualitätsmarken, Eröffnungskurs am Ausführungstag. Die Klasse
5-50 bleibt draußen (Hürde 0,157 Pp je Umlauf). Je Umschichtung werden Universumsgröße und Klassenmix (Universum
und Dezil) gezählt und berichtet.

**V0:** Momentum 12-1 (`momentum12_1` der Maschine: Schluss(t−21)/Schluss(t−252) auf der bereinigten Reihe),
**monatliche** Umschichtung (Signal = letzter Handelstag des Monats, Ausführung Eröffnung des nächsten
Handelstags), **oberstes Dezil, gleichgewichtet, long only**, Kosten gemessen = 0,5 · Σ|Δw| · Klassenhürde je
Papier (Hürde der Klasse des Papiers am Signaltag; mittleres Fenster, wie in Teil 1/2). Haltekonvention der
Maschine: täglich gleichgewichtet, Tote nach §3.6 Teil 1 (Hauptzahl: Insolvenz + Zwangs-Delisting =
Totalverlust).

**Zwei Vergleichsgrößen, beide ausgewiesen:**
- das **gleichgewichtete Universum** derselben Umschichtung, mit seinen eigenen (gemessenen) Umschichtungskosten —
  die Hauptgröße der Maschine (`Long − Universum`);
- **SPY aus demselben Panel**, gehalten Eröffnung(a) → Eröffnung(aEnde) je Periode mit derselben Haltefunktion,
  **ohne Kosten** (Vergleichsmaßstab, keine gehandelte Strategie). SPY ist Kursreihe ohne Ausschüttung — wie alle
  unsere Reihen; die Dividendenzeile (§T3.7) behandelt das.

Alle Reihen sind **Kursrenditen ohne Ausschüttungen**; Kasse verzinst sich mit **null** (konservativ).

---

## T3.3 Die vier Varianten — vorregistriert, keine weiteren

Alle vier halten **dasselbe Dezil** (das von V0 am Signaltag t gewählte) und unterscheiden sich allein im
**Einsatz** e ∈ [0, 1]. Der Rest ist Kasse zu null.

| | Regel | Entscheid | Wirkung ab |
|---|---|---|---|
| **V0** | e = 1 | — | — |
| **V1 Regime-Schalter** | e = 1, wenn SPY-Schluss(t) > EMA200(t) (bereinigte Reihe, `spyRegime` der Maschine, dieselbe wie im Regimeschnitt); sonst e = 0 | **täglich** zum Schluss jedes Handelstags d | **Eröffnung des nächsten Handelstags** — zur Umschichtung **und** bei jedem Regimewechsel mitten im Monat (dann wird das laufende Dezil sofort verkauft bzw. wieder gekauft) |
| **V2 Volatilitätsbremse** | e = min(1, 15 / σ₆₀), σ₆₀ = Stichproben-sd der **V0-Tagesrenditen brutto** (Kalendertage, Grenztage zusammengelegt) über die **60 Handelstage bis einschließlich t**, × √252, in % je Jahr | **monatlich** am Signaltag t | Eröffnung(a), für die ganze Periode |
| **V3** | e = e(V1) · e(V2) | Regime täglich, Bremse monatlich | wie V1 und V2 |

Festlegungen, die vor der Messung gehören:
- **V2 entscheidet monatlich, nicht täglich.** Die Bremse ist eine Dosierung des Portfolios und wird dort gesetzt,
  wo das Portfolio gebildet wird (Barroso/Santa-Clara 2015 skalieren ebenfalls monatlich). Tägliches Nachdosieren
  erzeugte einen Strom kleiner Trades ohne dokumentierten Nutzen.
- **Anlaufregel V2:** liegen am Signaltag weniger als 60 V0-Tagesrenditen vor (die ersten Perioden der Reihe), gilt
  e = 1; die Zahl dieser Perioden wird ausgewiesen (erwartet: 3, 2017-02 … 2017-04).
- **Fehlt ein Regimewert** (SPY ohne Zeile am Entscheidungstag): kein Handel, Einsatz bleibt; wird gezählt
  (erwartet: 0).
- **Der Preis der Absicherung wird mitgezählt und bepreist.** Jede Einsatzänderung ist ein Trade:
  Umschlag 0,5 · Σ|Δ(e·w)|, Kosten 0,5 · Σ|Δ(e·w)| · Hürde der Klasse des Papiers am Entscheidungstag — mit der
  Kostenfunktion der Maschine (`umschlagKosten`), nur mit skalierten Gewichten. Bei e ≡ 1 ist das exakt die
  Kostenzahl der Maschine (T3-P1). Innerhalb einer Periode gelten für die Kosten die Anfangsgewichte 1/N aller
  N Mitglieder (auch bereits ausgebuchter — konservativ, überzeichnet Kosten geringfügig).
- **Der Grenztag beim Regimewechsel wird geteilt.** Ein Wechsel zum Schluss von d wirkt zur Eröffnung von d+1. Die
  Nacht d → d+1 (Schluss → Eröffnung) gehört noch dem **alten** Einsatz, der Tag d+1 (Eröffnung → Schluss) dem
  **neuen**. Die Maschine führt innerhalb einer Periode Schluss-zu-Schluss-Renditen; an Wechseltagen werden die
  beiden Stücke deshalb je Mitglied aus `rendite` und `renditeOC` getrennt gemittelt ((1+cc)/(1+oc)−1 und oc),
  wie es die Haltefunktion an Periodenrändern ohnehin tut. So gibt es keine Nacht, die dem falschen Einsatz
  zugeschrieben wird — in Crashs sind gerade die Nächte groß, und ein systematischer Fehler in eine Richtung
  wäre nicht auszuschließen. An Periodenrändern liegen die Stücke schon getrennt vor (Schluss→Eröffnung am
  Periodenende mit dem alten, Eröffnung→Schluss am Ausführungstag mit dem neuen Einsatz).

**Tagesreihe je Variante:** brutto_d = Verkettung der Tagesstücke mit ihrem Einsatz, netto_d = brutto_d −
Σ Kosten des Tages. Monatsrendite = Verkettung der netto-Tagesrenditen der Periode (Eröffnung a bis Eröffnung
aEnde). Monat = Kalendermonat des **Ausführungstags** (Regel §T2.2.3). Jahresscheiben und Krisenfenster
folgen derselben Zuordnung (abweichend von Teil 1/2, wo die Jahresscheibe am Signaltag hing — hier steht es).

---

## T3.4 Was je Variante berichtet wird — mit MDE in jeder Tafel

**MDE-Konvention (Pflicht seit 15.09.):** MDE₈₀ = (z₀,₉₇₅ + z₀,₈₀) · se = **2,8016 · se** — die kleinste Kante,
die der jeweilige Test mit 80 % Wahrscheinlichkeit auf 5 % zweiseitig gefunden hätte. (`momente()` der Maschine
trägt daneben das ältere `mde = 2·se`; maßgeblich ist hier 2,8016.) test-teil3 rechnet den Faktor unabhängig
nach (T3-P0).

Je Variante V0…V3, alle auf n = Zahl der Monatsperioden (identisch für alle vier):
1. **brutto, netto** je Monat (eigene Reihe), **Umschlag** (inkl. Ein-/Ausschalten), **Kosten**, **Zeit im
   Markt** = mittlerer Einsatz über die Handelstage (Einsatz am Tagesschluss) und Anteil der Tage mit e > 0.
2. **Überschuss gegen das Universum und gegen SPY** (Monatsdifferenzen): Mittel, se naiv (Monate), t; daneben
   Hansen-Hodrick-se auf der Tagesdifferenzreihe mit Lag 21 und t — die se-Regel der Maschine; MDE₈₀ zu beiden.
3. **Maximaler Rückgang** (Spitze-zu-Tal des Kapitalstands aus den netto-Tagesrenditen, in %), **schlechtestes
   12-Monats-Fenster** (rollend über die Monatsreihe, verkettet), **Sharpe** (annualisiert, Kasse 0:
   Mittel·12 / (sd·√12) der Monatsrenditen netto), **Jahresscheiben** (Mittel, se, t, MDE₈₀ je Kalenderjahr; unter
   10 Perioden „dünn"), **letzte 250 Handelstage** (Signaltag ≥ letzter Tag − 250).
4. **Krisentafel (Pflicht):** Fenster nach Ausführungsmonat **2018-10…12** (3 Monate), **2020-02…04** (3),
   **2020-11…2021-06** (8, Momentum-Einbruch), **2022-01…10** (10). Je Variante: verkettete Nettorendite des
   Fensters, maximaler Rückgang innerhalb des Fensters (Spitze im Fenster), Zeit im Markt; daneben Universum und
   SPY. Für V1/V2/V3 zusätzlich die gepaarte Monatsdifferenz zu V0 im Fenster mit se und **MDE₈₀** — bei 3 bis 8
   Monaten wird die MDE groß sein; genau das soll die Tafel zeigen, statt einen Fenstervergleich als Beleg
   auszugeben.

---

## T3.5 Die gepaarten Vergleiche — was „besser" heißt, vorab

Für V1, V2, V3 jeweils gegen V0, über **dieselben Monate**:
- **Monatsdifferenz** Δ = netto(V) − netto(V0): Mittel, se naiv (n Monate, nicht überlappend — Hauptmaß),
  t_naiv; daneben HH-se auf der **Tagesdifferenzreihe** (Lag 21), t_HH; **MDE₈₀** zu beiden.
- **Differenz der maximalen Rückgänge** ΔMDD = MDD(V) − MDD(V0) (in Pp; ohne se — ein Maximum hat keine).

| Urteil | Bedingung |
|---|---|
| **Absicherung bestanden** | MDD(V) < MDD(V0) **und** nicht signifikant schlechter: t_naiv ≥ −1,96 **und** t_HH ≥ −1,96 |
| **nicht bestanden** | MDD(V) ≥ MDD(V0), **oder** t_naiv < −1,96, **oder** t_HH < −1,96 |

Keine Bonferroni-Korrektur auf der Schlechter-Seite: eine Korrektur würde die Schranke lockern und die
Absicherung leichter bestehen lassen; die Schranke bleibt bei 1,96. **Die Schwäche des Kriteriums wird
mitgeliefert:** „nicht signifikant schlechter" kann nur eine Verschlechterung ab ≈ 1,96 · se sehen; die
MDE-Spalte sagt, wie groß sie hätte sein müssen (Vorprüfung §T3.8: 0,3 bis 0,5 Pp je Monat, also 3 bis 6 % je
Jahr — eine Absicherung kann das kosten und trotzdem bestehen).

**Ausgabe (§5 des Auftrags):** die bestandene Variante — bei mehreren die mit dem **kleinsten** MDD — wird als
Zielportfolio geschrieben (§T3.10). Besteht keine, wird **V0** geschrieben, und im Bericht steht, dass die
Absicherung nicht trägt. Voraussetzung für jedes Zielportfolio: die Tore §T3.6 (Maschine) und §T3.7 (Außen)
halten.

---

## T3.6 Kontrollen auf dem erweiterten Universum — Pflicht, Schranken vorab

Alle Kontrollen laufen **monatlich** (die einzige Frequenz von Teil 3) mit `opt.klassen = [1, 2, 3]`.

| Kontrolle | Schranke | Grund |
|---|---|---|
| **Leck-Sperrklinke der Maschine** | V0-Lauf: **0** Verstöße; Positivkontrolle `leckProbe` (liest t+1 ohne Schlüssel): **> 0**; `sauberProbe`: 0 | ohne Klinke ist jede Zahl wertlos |
| **Sperrklinke der Überlagerung** (neu, §T3.3) | V1/V2/V3: **0** Zugriffe auf Regime- oder V0-Tage **nach** dem Entscheidungstag. **Zwei präparierte Fälle:** V1 liest das Regime an t+1, V2 zieht die 60 Tage bis t+1 — beide müssen **> 0** Verstöße melden und als `ungueltig` markiert sein | der Regime-Schalter und die Bremse dürfen nur Daten bis Schluss t sehen; die Klinke muss das nachweislich fangen |
| **Orakel `orakelTag/monat`** | brutto **≥ 2,0 Pp** und netto **≥ 2,0 Pp** je Periode (Pp-Schranke = Hauptkriterium; Verhältnis/t **nicht** für diese Fassung — Entscheid 14.09.) | Verrohrung |
| **Orakel `orakelPeriode/monat`** (horizontgleich) | brutto **≥ 5,0 Pp**, Mittel/sd **≥ 1,0**, t **≥ 8** | Verrohrung, Sichtweite = Haltedauer |
| **Zufall**, 12 Ziehungen | \|Mittel brutto\| < 0,25 Pp **und** \|Mittel netto+Kosten\| < 0,25 Pp; höchstens 3 Ziehungen mit \|t\| ≥ 3 | Nullpunkt der Messmaschine |

**Fällt eine Kontrolle: melden, nicht reparieren.** Dann gilt die Maschine auf dem erweiterten Universum als
nicht bestätigt, die Zahlen werden trotzdem berichtet (gekennzeichnet), und **kein Zielportfolio** wird geschrieben.

---

## T3.7 Außen-Prüfstein und Dividendenzeile

**Außen-Prüfstein:** die **Long-Short-Fassung** (oberstes minus unterstes Dezil, brutto, monatlich) der V0-Reihe
auf dem erweiterten Universum gegen `F-F_Momentum_Factor.csv` (`Mom`), Zuordnung Periode → Kalendermonat des
Ausführungstags (§T2.2.3), Versatz −1/0/+1 ausgewiesen (Maximum erwartet bei 0). Das ist diesmal die
**registrierte** Größe (Teil 2 hat gezeigt, dass Long−Universum nur die halbe Verrohrung sieht).

| ρ | Urteil |
|---|---|
| **≥ 0,5** | **bestanden** (erwartet; Teil 2 lieferte 0,73 auf dem engen Universum) |
| 0,2 … 0,5 | **teilweise — BEFUND**: das erweiterte Universum hat den Gleichlauf verändert; wird gemeldet, nicht repariert; Zielportfolio wird geschrieben, aber der Bericht trägt den Befund an erster Stelle |
| **< 0,2** | **GEFALLEN**: unsere Reihe misst etwas anderes als der Faktor — kein Zielportfolio |

Wie in Teil 2 kommen nur **abgeleitete** Größen in den Bericht, nie Werte der Referenzreihe.

**Dividendenzeile, Verfahren offengelegt:** Teil 2 hat die Lücke Dezil − Universum **gemessen**:
**−0,0744 Pp je Monat** (t −6,4), auf dem engen Universum (Dezil 0,83 % je Jahr, Universum 1,73 %). Für Teil 3
gibt es keinen Archivzugriff, also keine Neumessung; die Zahl wird **übertragen** und so gekennzeichnet.
Richtung der Abweichung auf dem erweiterten Universum: kleinere Werte schütten eher weniger aus, die Lücke
dürfte betragsmäßig **kleiner** sein — die übertragene Zahl ist damit eher zu streng, nicht zu mild.
- Gegen das Universum: Korrektur = ē · (−0,0744) Pp je Monat, ē = mittlerer Einsatz der Variante (in Kasse
  fällt keine Dividende an, aber auch die Lücke nicht).
- Gegen SPY: Korrektur = ē · 0,83/12 − y_SPY/12 Pp je Monat, mit y_SPY = **Annahme** 1,6 % je Jahr (Spanne 1,3
  … 1,9 % ausgewiesen; die Dividendenrendite des S&P 500 in 2017–2026 ist ein bekannter Außenwert, im Panel nicht
  messbar). Für V0: 0,069 − 0,133 = **−0,064 Pp je Monat** (Spanne −0,039 … −0,089). Annahme und Messung stehen
  je Zahl getrennt.

---

## T3.8 Die zwei Vorprüfungen — mit Zahlen, vor dem Lauf

### Kostenvorprüfung

| Größe | Wert | Quelle |
|---|---|---|
| Umschlag Momentum 12-1 monatlich | **29,3 %** je Monat (0,2927) | Teil 1, gemessen |
| Hürde je Umlauf 50-250 / 250-1000 / ab1000 | 0,0854 / 0,0647 / 0,0449 Pp | Spannen-Studie, `KLASSEN` |
| Kosten je Monat, wenn das Dezil ganz in 50-250 läge | 0,293 · 0,0854 = **0,0250 Pp** | Rechnung |
| Kosten je Monat beim Teil-1-Mix (nur 250-1000 + ab1000) | **0,0184 Pp** | Teil 1, gemessen |
| Erwartete Bruttokante gegen das Universum | 1 … 2 Pp je Monat (Teil 1: +1,62) | Kontext |
| **Faktor** Kante / Kosten | **40 … 80** — weit über der Vorprüfschwelle 4 | |
| Absicherungskosten V1 | ~1,7 Wechsel je Jahr (Teil 2: 20 von 116 Monaten unter EMA200), je Wechsel Umschlag 0,5 · Hürde ≈ 0,07 ⇒ ≈ 0,035 Pp je Wechsel ⇒ **≈ 0,005 Pp je Monat** | Schätzung |
| Absicherungskosten V2 | \|Δe\| ≈ 0,1 je Monat ⇒ 0,5 · 0,1 · 0,07 ≈ **0,0035 Pp je Monat** | Schätzung |

Die gemessenen Umschläge und Kosten werden im Ergebnis gegen diese Schätzungen gehalten (Lehre aus Teil 2:
Umschlagschätzungen aus der Trägheit der Größe waren um Faktor 2,7–5,3 zu niedrig). Der eigentliche Preis der
Absicherung ist nicht die Handelskosten, sondern die **verpasste Rendite in Kasse** — die misst §T3.5.

### Auflösungsvorprüfung

Teil 1, Momentum monatlich, Dezil − Universum, 21,5 Werte je Dezil, Universum 220: **sd = 6,659 Pp je Monat**
(n 115, se 0,621, t 2,62). Skaliert mit √(22/80) = 0,524 ⇒ sd ≈ **3,49 Pp**, se ≈ 0,326 (n 115) ⇒
**MDE₈₀ ≈ 0,91 Pp je Monat** für V0 gegen das Universum. Ehrliche Einschränkung: die Skalierung unterstellt
reines Einzelwert-Rauschen; der systematische Teil (die Faktorstreuung selbst) schrumpft mit der Dezilgröße
**nicht**. Realistisch liegt sd zwischen 3,5 und 6,7 Pp ⇒ MDE₈₀ **0,91 … 1,74 Pp je Monat**. Das reicht für
eine Kante von 1–2 Pp je Monat knapp — und es ist **kein Test**, sondern Kontext.

**Entscheidend sind die gepaarten Differenzen** (§T3.5). Annahme: eigene Monatsstreuung des Long-only-Dezils
≈ 6 Pp (Markt ~4,5 · β ~1,2 plus Einzelwertanteil):
- **V1 − V0:** Differenz ≠ 0 nur in Kasse-Monaten (~17 %) ⇒ sd_Δ ≈ √0,17 · 6 ≈ **2,5 Pp** ⇒ se ≈ 0,23 ⇒
  **MDE₈₀ ≈ 0,65 Pp je Monat**; „signifikant schlechter" erst ab ≈ 0,46 Pp je Monat (5,5 % je Jahr).
- **V2 − V0:** e typisch 0,6 … 1,0 ⇒ sd_Δ ≈ 0,25 · 6 ≈ **1,5 Pp** ⇒ se ≈ 0,14 ⇒ **MDE₈₀ ≈ 0,39 Pp**;
  Schwelle ≈ 0,27 Pp je Monat.
- **V3 − V0:** ≈ √(2,5² + 1,5²) ≈ **2,9 Pp** ⇒ se ≈ 0,27 ⇒ **MDE₈₀ ≈ 0,76 Pp**; Schwelle ≈ 0,53 Pp je Monat.

Diese Zahlen stehen hier, damit die Messung sie widerlegen kann. Weicht die gemessene se um mehr als Faktor 1,5
ab, steht das im Ergebnis als falsche Vorprüfung.

---

## T3.9 Prüfungen (`test-teil3.js`), zusätzlich zu 47 + 20

- **T3-P0** MDE-Faktor 2,8016 = z₀,₉₇₅ + z₀,₈₀, unabhängig über eine eigene erf-Näherung nachgerechnet.
- **T3-P1** V0 als Überlagerung mit e ≡ 1 reproduziert die Tagesreihe der Maschine (brutto und netto, 1e-9),
  die Periodenrenditen brutto (1e-9) und die Kostenzahl je Periode (1e-12).
- **T3-P2** Kunstfall V1: drei Perioden, ein Regimewechsel mitten in der zweiten — Tagesreihe, Kosten und
  Umschlag von Hand nachgerechnet, einschließlich des geteilten Grenztags (Nacht alt, Tag neu).
- **T3-P3** Kunstfall V2: V0-Tagesreihe mit bekannter sd ⇒ e = min(1, 15/σ) von Hand; unter 60 Tagen e = 1;
  σ genau über die 60 Tage bis t (Tag t+1 ändert nichts).
- **T3-P4** Sperrklinke der Überlagerung: präparierter V1-Fall (Regime an t+1) und V2-Fall (Fenster bis t+1)
  melden > 0 Verstöße und `ungueltig`; die sauberen Läufe 0.
- **T3-P5** Maximaler Rückgang (Kapitalstand 100 → 120 → 90 → 130 ⇒ 25 %), schlechtestes 12-Monats-Fenster und
  Sharpe auf Handreihen.
- **T3-P6** Kosten einer Vollliquidation = 0,5 · Σ wᵢ · hᵢ; Einsatz 1 → 0,6 kostet genau 0,4 davon.
- **T3-P7** Gepaarte Differenzreihe: gleiche n, gleiche Monate wie V0; Mittel der Differenzen = Differenz der
  Mittel (1e-9).
- **T3-P8** Jedes Dezilmitglied jeder Periode hat Klasse ∈ {1, 2, 3}, SPY nie darunter; `K.UNIVERSUM_KLASSEN`
  ist unverändert [2, 3].
- **T3-P9** Krisenfenster enthalten 3 / 3 / 8 / 10 Monate, Zuordnung nach Ausführungsmonat.
- **T3-P10** Zielportfolio-Dateien: Gewichte summieren zum Einsatz (1e-9), N = Dezilgröße, Klassen ∈ {1, 2, 3},
  Daten stimmen mit dem Lauf überein.
- **T3-P11** `test.js` (47) und `test-teil2.js` (20) laufen nach den Ergänzungen unverändert grün.
- **T3-P12** `momentum12_1/monat` mit `opt.klassen = [2, 3]` liefert netto +1,609984 Pp (Teil 2) auf 1e-9.

---

## T3.10 Ausgabe

Für die Variante nach §T3.5: `zielportfolio/momentum-<variante>/<ausfuehrungstag>.json` je Umschichtung **und**
je Regimewechsel (das ist ein Handelsanlass) mit: `variante`, `anlass` (umschichtung | regimewechsel), `datum`
(Ausführungstag), `signaltag`, `einsatzquote`, `regime` (SPY über/unter EMA200 am Entscheidungstag),
`volatilitaet60` (% je Jahr, wo berechnet), `positionen[]` mit `kuerzel`, `gewicht` (= Einsatz / N), `klasse`.
Alles Simulationsausgabe — die Schnittstelle zum Momentum-Buch des Mittelfrist-Depots, keine Anlageempfehlung.

## T3.11 Zwei Warnungen

1. **Kein Nachlegen.** Keine fünfte Variante, kein anderes Vol-Ziel, kein anderes EMA-Fenster nach dem Blick auf
   die Zahlen. Neue Ideen bekommen einen Teil 4 mit eigener Vorregistrierung.
2. **Die Gründe-Tafel bleibt Ausbuchungsregel, nie Signal** (Warnung 1 aus Teil 2). Weder die Rangfunktion
   noch die Überlagerung liest sie.

---

*Geschrieben 2026-09-16, vor der ersten Zahl von Teil 3. Nur Lesezugriff auf Panel und Referenzdatei.
Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.*
