# Vorregistrierung — Querschnitts-Prüfstand, **Teil 4**: „Gedrückt, aber liefert" (18.09.2026)

Nachtrag zu `VORREGISTRIERUNG.md` (Teil 1), `-TEIL2.md` und `-TEIL3.md`. Dieses Papier wird **als erster Commit von
Teil 4 geschrieben, vor jeder Zahl**. Die Maschine — Tafel, Prüfrahmen (`universum`, `Sicht`, `signaltage`, `halte`,
`umschlagKosten`), Statistik (`momente`), Kontrollen, `test.js` (47) / `test-teil2.js` (20) / `test-teil3.js` (15) — wird
**benutzt, nicht neu gebaut**. Die Fundamentaltafel (Stufe A, Commit `00befd9`, Kennung `fundamentaltafel-2026-09-16/v1`)
wird **nur gelesen**, ausschließlich über ihren Leser `fundamental-lesen.js` mit Sperrklinke.

Alles Simulation mit virtuellem Kapital. **Keine Anlageberatung.** Nur Lesezugriff; kein Netz, kein Archiv auf E:, kein
Schlüssel. Referenzdatei (`F-F_Momentum_Factor.csv`) wird in Teil 4 nicht gebraucht und nicht gelesen.

---

## T4.0 Die Frage — und warum sie diesmal auflösbar ist

Wilhelm (16.09.): Werte finden, „die schon liefern, bevor der Kurs es zeigt". Messbar gemacht:
**A** = der Kurs ist gedrückt (12-Monats-Rendite mindestens 10 Pp hinter SPY), **B** = die Gewinne beschleunigen
(Fundamental-Momentum nach Novy-Marx 2015 positiv im jüngsten Filing, das am Signaltag schon eingereicht war).
Getestet wird **A∧B gegen A∧¬B, gepaart je Monat** — beide Seiten sind gedrückt, aus demselben Universum, zur selben
Zeit; die Marktbewegung fällt in der Differenz heraus. Das ist nicht „Dezil gegen Universum" (Teil 2, MDE 12–24 % je
Jahr), sondern ein streuungsarmer Paarvergleich mit ~160 Werten je Seite.

**Auflösungsvorprüfung des PM (16.09., aus dem Panel, vor dieser Messung):** A trifft im Mittel **324 von 783**
liquiden Werten je Monat (117 Monate). Gepaarte Zufallshalbierung von A bei 120 Tagen: **Paar-sd 3,22 Pp je Monat**,
MDE₈₀ **1,0 Pp naiv / 2,4 Pp überlappungsbereinigt** (Faktor des PM: z_Bonf(4) + z₀,₈₀ = 3,340, n 117; Überlappung
× √6); bei 250 Tagen **2,1 / 7,3 Pp** (× √12). Erwartung aus der Literatur (Novy-Marx 2015, Fundamental-Momentum
≈ 0,5–1 Pp je Monat): **3–6 Pp je 120 Tage**. Verhältnis 1,2–2,5 ⇒ auflösbar. **Hauptfenster 120 Tage; 250 Tage nur
nachrichtlich.** §T4.8 reproduziert diese Vorprüfung als Prüfung, **bevor** die erste Ergebniszahl entsteht.

Testzahl für Urteile: **2** (Test 1 und Test 2, §T4.4). z_Bonf(2) = Φ⁻¹(1 − 0,05/4) = **2,2414**
(test-teil4 rechnet den Wert unabhängig nach, T4-P0).

---

## T4.1 Was an der Maschine ergänzt wird (abschließend)

1. **`konfig.js` bekommt einen Teil-4-Block** mit den Zahlen dieses Papiers — jede genau einmal. Kein bestehender Wert
   ändert sich; `test.js`, `test-teil2.js`, `test-teil3.js` müssen danach unverändert grün sein (T4-P11).
2. **Neu, neben der Maschine:** `teil4.js` (Läufer), `bericht-teil4.js` (Bericht), `test-teil4.js` (Prüfungen §T4.9).
   Sie lesen die Kurs-Tafel **nur** über den Prüfrahmen (`universum`, `Sicht`, `halte`, `umschlagKosten`) und die
   Fundamentaltafel **nur** über `fundamental-lesen.js`.

**Nicht ergänzt:** keine neue Datenquelle, kein neues Panel, keine Änderung an `pruefstand.js`, `rangfunktionen.js`,
`statistik.js`, `kontrollen.js`, `varianten.js`. Panel wie Teil 1–3 (9.899.585 Tageszeilen, 7.300 Reihen,
2016-01-04 … 2026-09-11). Fundamentaltafel-Ordner wird nicht beschrieben.

---

## T4.2 Universum, Signaltage, Horizont, Haltekonvention

- **Universum:** Umsatzklassen **50-250 / 250-1000 / ab1000** (Indizes 1, 2, 3 = `K.UNIVERSUM_KLASSEN_TEIL3`),
  punkt-in-Zeit über `universum(T, t, {klassen})` wie Teil 3: Cent-Boden, 250 Vortage, `quelle_rein`, Qualitätsmarken,
  Eröffnungskurs am Ausführungstag. SPY ist Referenz, nie Mitglied.
- **Signaltage:** letzter Handelstag jedes Kalendermonats (`signaltage(T, 'monat')`). **Ausführung:** Eröffnung des
  nächsten Handelstags a (= `U.aTag`).
- **Horizont (Hauptfenster):** **120 Handelstage.** Periodenende aEnde = der **120. Panel-Handelstag nach a** (Tage mit
  Panelzeilen, in Kalenderindex-Reihenfolge). Gehalten wird **Eröffnung(a) → Eröffnung(aEnde)** mit der Haltefunktion
  der Maschine (`halte`: täglich gleichgewichtet, Tote nach §3.6 Teil 1, Hauptzahl Insolvenz + Zwangs-Delisting =
  Totalverlust, Lücken = Kasse zu null). **Nachrichtlich: 250 Handelstage** (aEnde = 250. Panel-Handelstag nach a).
  Liegt aEnde hinter dem letzten vollständigen Handelstag der Tafel, ist die Periode **unvollständig und fällt weg**
  (Zahl ausgewiesen; erwartet ≈ 6 Monate bei 120, ≈ 12 bei 250 Tagen am Ende der Reihe).
- **Überlappung:** die Monatsperioden überlappen sich (H = ⌈120/21⌉ = **6** Monate; bei 250 Tagen ⌈250/21⌉ = **12**).
  Die se-Regel steht in §T4.5.
- **Kosten:** je Seite/Portfolio **ein Umlauf**: Kauf zu Eröffnung(a), Verkauf zu Eröffnung(aEnde);
  Kosten = Σᵢ wᵢ · Hürde(Klasse des Papiers am Signaltag t), wᵢ = 1/N — das ist exakt **2 × `umschlagKosten(T, {}, w, t)`**
  der Maschine (Aufbau aus dem Nichts + Vollliquidation; T4-P7). Hürden je Umlauf: 50-250 0,0854 / 250-1000 0,0647 /
  ab1000 0,0449 Pp (Spannen-Studie, `KLASSEN`). Netto = brutto − Kosten je Periode.
- Alle Reihen sind **Kursrenditen ohne Ausschüttungen** (§T4.7).

---

## T4.3 Die zwei Bedingungen — Definition vorab

**A (gedrückt):** in Panelzeilen der jeweiligen Reihe, nur über `sicht`:
r = 100 · (bSchluss(t) / bSchluss(250 Zeilen vor t) − 1); dieselbe Größe für **SPY** (Zeile an t, 250 SPY-Zeilen zurück).
**A ⇔ r − r_SPY ≤ −10 Pp** (Grenze eingeschlossen). Fehlt SPY am Signaltag: Monat fällt weg (Zahl ausgewiesen, erwartet 0).
Fehlt die 250. Vorzeile: nicht A (durch die 250 Vortage des Universums ausgeschlossen, Zähler trotzdem).

**B (liefert):** `fundamentalAm(kürzel, ISO-Datum(t))` des Lesers (Aktualitäts-Tor **456 Tage** = Vorgabe des Lesers; älteres
Filing ⇒ null). Liefert er eine Zeile z mit `z.abgeleitet.fm` als endlicher Zahl:
**B ⇔ fm > 0**, **¬B ⇔ fm ≤ 0** (fm = ROA(4Q) − ROA(4Q, Vorjahr), Novy-Marx). Liefert er null (keine Reihe, kein Filing mit
`filed < t`, veraltet) oder ist fm nicht endlich: **„ohne Fundament"** — weder B noch ¬B, **nie stillschweigend in ¬B**;
Anteil je Monat und Klasse wird berichtet (§T4.6). Die Zuordnung Kürzel → CIK ist die des Lesers (`_reihen.json`),
einschließlich der 1.003 als „schwach" markierten; ihr Anteil unter den A-Mitgliedern wird gezählt, nicht ausgeschlossen.

**Sektor:** `z.sektor` der Tafelzeile (= `sektorVonSic(z.sic)`, SIC-Divisionen: Landwirtschaft 100–999, Bergbau/Öl
1000–1499, Bau 1500–1799, Verarbeitendes Gewerbe 2000–3999, Transport/Versorger/Kommunikation 4000–4999, Großhandel
5000–5199, Einzelhandel 5200–5999, Finanzen/Immobilien 6000–6799, Dienstleistungen 7000–8999, Öffentliche Verwaltung
9100–9999, sonst „unbekannt").

Die A/B-Bestimmung ist eine Rangfunktion im Sinne der Maschine: sie liest die Kurs-Tafel **nur** über `sicht.zeile`
(Tag ≤ t) und `sicht.zurueck`; jeder Zugriff auf einen Tag nach t wird von der Sperrklinke gezählt und macht den Lauf
ungültig. Die Zukunft (Halteperiode) berechnet allein `halte` außerhalb der Rangfunktion.

---

## T4.4 Die zwei Haupttests

**Test 1 — A∧B gegen A∧¬B (das Urteil).** Je Monat: Seite AB = alle Universumsmitglieder mit A und B, Seite A¬B = alle mit
A und ¬B, beide gleichgewichtet, 120 Tage, Kosten je Seite ein Umlauf. Monatsdifferenz Δ = netto(AB) − netto(A¬B)
(brutto daneben). **Mindestens 10 Mitglieder je Seite**, sonst fällt der Monat weg (Zahl ausgewiesen; erwartet 0).
**Vorhersage: Δ ≥ +2 Pp je 120 Tage.**

**Test 2 — B-Quintil gegen Universum (Eichung, kein Tor).** Ohne Bedingung A. Pool = Universumsmitglieder **mit
Fundament**; Q5 = die obersten ⌊n/5⌋ nach fm (Gleichstände nach Symbolindex, wie die Maschine sortiert), gleichgewichtet;
Vergleich = der **ganze Pool** gleichgewichtet mit seinen eigenen Umlaufkosten. Δ = netto(Q5) − netto(Pool), 120 Tage.
Erwartung positiv (Novy-Marx). Nachrichtlich: Q1 (unterste) und Q5 − Q1.

**Nachrichtlich, ohne Urteil:** beide Tests über **250 Tage**; Test 1 **je Sektor** (Monat zählt im Sektor nur mit
≥ 5 Mitgliedern je Seite; MDE je Sektor); **Jahresscheiben** (Kalenderjahr des Ausführungstags a, wie Teil 3);
**letzte 250 Tage** (Signaltag t ≥ letzter Tag − 250; bei 120-Tage-Fenstern sind das ≈ 6 Monate — die MDE dort wird
groß sein, genau das soll die Tafel zeigen); **Klassenmix** je Seite; **Anteil „ohne Fundament"** je Monat und Klasse.

---

## T4.5 Statistik und MDE — Pflicht in jeder Tafel

- **Hauptmaß je Test:** Mittel der Monatsdifferenzen Δ̄, **Hansen-Hodrick-se** auf der Monatsreihe (Kalendermonat als
  Index; Rechteckkern über die Autokovarianzen der **Lags 1 … H−1 = 1 … 5** bei 120 Tagen — `momente(paare, 6)` der
  Maschine; bei 250 Tagen Lags 1 … 11, `momente(paare, 12)`), **t = Δ̄ / se_HH**. Daneben immer se naiv (und der Faktor
  se_HH/se_naiv als Maß der Überlappung; Marke ab Faktor 1,5 wie in der Maschine). Fällt die HH-Langfristvarianz
  ≤ 0 (`seHH` null), gilt die Block-se der Maschine (`hh0` ausgewiesen).
- **MDE₈₀ = 2,8016 · se_HH** (Konvention seit 15.09., `K.MDE_FAKTOR`); für die zwei Haupttests zusätzlich
  **MDE₈₀,Bonf = (z_Bonf(2) + z₀,₈₀) · se_HH = 3,0830 · se_HH**. **Ein Urteil ohne MDE gilt nicht.**
- **Jahresscheiben und Sektoren:** dieselbe Rechnung auf der Teilreihe (unter 6 Perioden „dünn").

---

## T4.6 Urteil vorab

**Test 1 „belegt"**, wenn **alle drei** gelten: Δ̄_netto ≥ MDE₈₀ **und** t_HH ≥ z_Bonf(2) = 2,2414 **und** die Reihe der
letzten 250 Tage im Mittel **nicht negativ** ist. Sonst **„nicht belegt"** mit dem Satz *„nichts oberhalb von
<MDE₈₀> Pp je 120 Tage"* — nie „da ist nichts". Test 2 bekommt kein Urteil, nur Δ, se, t, MDE und den Vergleich mit der
Literatur (Vorzeichen, Größenordnung). Die 250-Tage-Zahlen, Sektoren, Jahre entscheiden nichts.

**Ausgabe:** `ERGEBNIS-TEIL4.md` (Bericht aus `teil4-ergebnis.json`), **kein Zielportfolio** (Entscheid 16.09.). Besteht
Test 1: Kandidatenliste je Monat als `kandidaten-teil4/<monat>.json` (die AB-Seite, Liste, kein Portfolio). Besteht er
nicht, wird kein solcher Ordner angelegt.

---

## T4.7 Kontrollen — Pflicht, Schranken vorab

| Kontrolle | Bau | Schranke (Soll) |
|---|---|---|
| **Placebo** | B je Monat **zufällig permutiert** unter den A-Mitgliedern mit Fundament (Zahl der B je Monat bleibt); 12 Ziehungen, Saat `teil4-placebo-2026-09-18#k`, Generator der Maschine (`fnv`/`mulberry32`) | \|Mittel brutto über 12\| < **0,5 Pp** **und** \|Mittel netto\| < 0,5 Pp; höchstens **3** Ziehungen mit \|t_HH\| ≥ 3 |
| **Orakel** | B ersetzt durch das **Vorzeichen der künftigen 120-Tage-Rendite** je A-Mitglied (Eröffnung(a) → Eröffnung(aEnde), letzte Zeile bei vorzeitigem Ende — wie `orakelPeriode`), gelesen über eine `Sicht` **mit** Orakelschlüssel; Δ = Gewinner − Verlierer | Δ̄_brutto ≥ **20 Pp** je 120 Tage, Mittel/sd ≥ **1,0**, t_HH ≥ **8** |
| **Leck-Klinke des Prüfstands** | (a) A/B-Auswahl läuft unter `Sicht` **ohne** Schlüssel: **0** Verstöße, sonst ungültig; (b) Positivkontrolle: dieselbe Auswahl mit einem präparierten Zugriff auf t+1: **> 0** Verstöße und `ungueltig`; (c) `leckProbe`/`sauberProbe` der Maschine monatlich auf Klassen [1,2,3]: > 0 / 0 | wie angegeben |
| **Leck-Klinke des Lesers** | (a) präpariertes Filing `filed = t` an `klinke()` **muss werfen**, `filed = t − 1` liefern; (b) nach dem Lauf: **0** Einträge im Protokoll aller Zugriffe mit `filed ≥ tag` (Zahl der Zugriffe ausgewiesen) | 0 Verstöße |

**Fällt eine Kontrolle oder die Vorprüfung (§T4.8): melden, nicht reparieren.** Die Zahlen werden trotzdem berichtet,
gekennzeichnet; Test 1 kann dann nicht „belegt" sein.

---

## T4.8 Vorprüfung — Reproduktion vor der ersten Ergebniszahl

Aus demselben Universum und denselben Signaltagen, **vor** Test 1/2:
1. **A-Anteil:** Mittel der A-Mitglieder je Monat und des Universums je Monat. Erwartet 324 von 783 (41,4 %).
2. **Paar-sd der Zufallshalbierung:** A je Monat in zwei Zufallshälften (Saat `teil4-vorpruefung-2026-09-18`), 120 Tage
   mit `halte`, Differenz brutto; sd über die vollständigen Monate. Erwartet **3,22 Pp**. Dasselbe bei 250 Tagen
   (erwartet ≈ 6,8 Pp, aus 2,1 = 3,340 · sd/√117 zurückgerechnet).
3. **MDE nach der Rechnung des PM:** 3,340 · sd/√n naiv, × √6 (bzw. √12) überlappungsbereinigt. Erwartet 1,0 / 2,4 und
   2,1 / 7,3 Pp.

**Regel:** weicht eine der Größen (A-Anteil, Paar-sd 120, Paar-sd 250) um **mehr als Faktor 1,5** ab, wird das gemeldet,
bevor Test 1/2 gerechnet werden — der Läufer schreibt die Vorprüfung als eigenen Baustein auf die Platte und markiert
`vorpruefung.bestanden`. Die Zahlen von Test 1/2 werden dann trotzdem berichtet, aber als „Vorprüfung gefallen" gekennzeichnet.

---

## T4.9 Was die Tafel nicht weiß — im Bericht benennen

- **Dividenden** (Zeile aus Teil 2): Renditen ohne Ausschüttung; gemessen in Teil 2 Universum 1,73 % je Jahr, Momentum-
  Dezil 0,83 %, Lücke −0,0744 Pp je Monat. Für A∧B gegen A∧¬B ist die Lücke **nicht gemessen** (kein Archivzugriff);
  beide Seiten sind gedrückte Werte desselben Pools — die Richtung ist offen, die Größenordnung nach Teil 2 ≤ 0,1 Pp je
  Monat (≤ 0,6 Pp je 120 Tage).
- **20-F/40-F-Filer** fehlen: 4.931 Filings nur gezählt; in den liquiden Klassen 5–12 % der aktiven Reihen je Jahr
  (ab1000 5,3/5,7 %, 250-1000 4,1/6,5 %, 50-250 9,5/11,8 % in 2019/2024) — sie landen in „ohne Fundament".
- **8-K-Vorabmeldungen:** die Quartalszahl ist meist Wochen vor dem 10-Q bekannt; die Tafel nimmt das spätere `filed`
  — konservativ (Signal nie zu früh, oft zu spät).
- **2016** im Vorlauf dünner (Quartalswerte vor 2014 fehlen; deshalb 2014–2015 geladen), **Neudarstellungen** nicht
  übernommen (erste Veröffentlichung gilt), **2026q3 fehlt** (Filings seit 01.07.2026) — betrifft nur Signaltage, deren
  120-Tage-Fenster ohnehin unvollständig ist.
- **Schwache CIK-Zuordnungen** (1.003) werden verwendet und gezählt, nicht ausgeschlossen.

---

## T4.10 Prüfungen (`test-teil4.js`), zusätzlich zu 47 + 20 + 15

- **T4-P0** z_Bonf(2) = 2,2414 und MDE-Faktoren 2,8016 / 3,0830 unabhängig über eine eigene erf-Näherung.
- **T4-P1** Periodenende: aEnde ist der 120. (250.) Panel-Handelstag nach a, auch über Tage ohne Panelzeilen hinweg;
  reicht die Tafel nicht, fällt die Periode weg.
- **T4-P2** A auf einer Kunst-Tafel: −5 % gegen SPY +6 % ⇒ A; +0 % gegen +9 % ⇒ nicht A; genau −10 Pp ⇒ A.
- **T4-P3** B-Klassifikation mit einem Kunst-Leser: fm > 0 ⇒ B, fm ≤ 0 ⇒ ¬B, null / nicht endlich / kein Filing ⇒ ohne
  Fundament (nie ¬B).
- **T4-P4** HH-se auf einer Handreihe mit bekannter Autokovarianz: `momente(…, 6)` nimmt genau die Lags 1…5; unabhängige
  Rechnung stimmt auf 1e-9; t und MDE folgen.
- **T4-P5** Placebo: Zahl der B je Monat bleibt erhalten, Permutation deterministisch je Saat, verschiedene Saaten
  verschieden.
- **T4-P6** Orakel auf einer Kunst-Tafel: Gewinner/Verlierer-Differenz von Hand.
- **T4-P7** Kosten je Seite = mittlere Hürde der Klassen am Signaltag = 2 × `umschlagKosten(T, {}, w, t)`.
- **T4-P8** Sperrklinke: die A/B-Auswahl unter Sicht ohne Schlüssel erzeugt 0 Verstöße; die präparierte Fassung > 0
  und `ungueltig`.
- **T4-P9** Leser-Klinke: `klinke(sym, tag, {filed: tag})` wirft, `{filed: tag−1}` liefert (nur mit Tafel auf der
  Platte, sonst „übersprungen").
- **T4-P10** Ergebnisdatei: Urteil folgt der Regel §T4.6 aus den eigenen Zahlen; MDE = Faktor × se; n konsistent;
  Kontrollen mit ihren Schranken (nur mit `--ergebnis`).
- **T4-P11** `test.js` (47), `test-teil2.js` (20), `test-teil3.js` (15) laufen unverändert grün (`--maschine`).
- **T4-P12** Sektorname jedes B/¬B-Mitglieds liegt in den SIC-Divisionen oder ist „unbekannt".

## T4.11 Zwei Warnungen

1. **Kein Nachlegen.** Keine andere A-Schwelle, kein anderes Fenster, kein anderer Horizont, kein Ausschluss von
   Sektoren oder schwachen Zuordnungen nach dem Blick auf die Zahlen. Neue Ideen bekommen einen Teil 5.
2. **Die Gründe-Tafel bleibt Ausbuchungsregel, nie Signal**; die Fundamentaltafel wird nur über den Leser mit Klinke
   gelesen, nie über `alleFilings` im Ranking.

---

*Geschrieben 2026-09-18, vor der ersten Zahl von Teil 4. Nur Lesezugriff auf Panel und Fundamentaltafel.
Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.*
