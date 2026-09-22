# Vorregistrierung — Mehrfaktor-Kombination, Runde 1b — **ENTWURF** (22.09.2026, nicht registriert)

**Status:** Entwurf des Werkzeug-Chats (Auftrag Nr. 48 §3). **Nicht registriert, keine Zahl eines Feldes gemessen.** Registriert
wird dieses Papier erst, wenn Wilhelm die offenen Entscheide (§9) getroffen hat und **bevor** der Kombinationslauf startet; die
neun Feldzellen (Runde 1a) entstehen davor, sind aber **Bau- und Nullpunktprüfungen, keine Auswahl**.

**Die Feldwahl stammt aus `wiki/mehrfaktor-felder.md` vom 22.09.2026 (Commit `4da7ecf`), vor jeder Feldmessung.** Änderungen an
Feldern, Formeln oder Gewichten nach der ersten Feldzelle sind Nachträge mit Datum und Grund (§11), nie stille Korrekturen.

Alles Simulation mit virtuellem Kapital, Kursrenditen ohne Ausschüttungen. **Keine Anlageberatung.** Nur Lesezugriff auf Panel und
Fundamentaltafel; kein Netz, kein Archiv auf E:.

---

## 1. Die Frage — eine Vorhersage, ein Test

Liefert das **oberste Dezil der gleichgewichteten Rangkombination** der sieben Signalfelder (Momentum, niedrige Schwankung,
Bewertung, Ertragskraft, Investition, Gewinnüberraschung, F&E-Intensität) gegen das Universum **netto** (Kassa-Hürde je Klasse ×
Umschlag) eine positive Monatsrendite?

**Vorhersage:** Dezil oben − Universum, netto, **> 0 Pp je Monat** über die Signaltage 2017-01 … 2024-08; erwartete Größe nach
§6: 0,3–0,6 Pp je Monat. **Ein** Test, **eine** registrierte Strategie. Long-Short, Dezil unten, Jahresscheiben, Regime,
Kontrollgrößen und alle Einzelfelder sind Diagnose und entscheiden nichts.

Warum die Kombination und nicht ein Feld (`wiki/faktoren-kombinieren.md` §2): fast jedes Nein dieses Monats kam von der
Auflösungswand. Sieben schwache, teils unabhängige Signale mit je t ≈ 1–1,5 ergeben gleichgewichtet ein Signal mit t ≈ 2–3;
die Kombination ist der Weg, nicht ein Zusatz — unter der Bedingung, dass Felder und Gewichte **vorher** feststehen.

---

## 2. Die Maschine (steht, geprüft, wird benutzt)

`studien/mehrfaktor-2026-09-22/zelle.js` (Kennung `mehrfaktor-2026-09-22/zelle/v1`, Commits `cff2f0b`, `243d042`), eine dünne
Schicht über dem Querschnitts-Prüfstand (`studien/querschnitt-pruefstand-2026-09-13/`, Panel v2.1 `panel/v2`, 9.904.017
Tageszeilen, 7.338 Reihen, bis 2026-09-15): `universum` (punkt-in-Zeit), `Sicht` (Leck-Sperrklinke), `halte`, `umschlagKosten`,
`bewerte`/`kennzahlen`, `orakelPeriode`, `zufallFabrik`, `fundamental-lesen.js` (Bilanz mit Klinke). Geprüft mit 23 Prüfungen
(`test.js`), nur Kunstfelder: Zufall ≈ 0, Orakel groß und identisch mit dem eingebauten, Leck wirft, konstant leer, Lücken bleiben
`null`, Kunstpanel-Kante 2,15 gegen Soll 1,84 Pp, Regression Momentum [2,3] trifft die Teil-2-Zahl exakt.

Konventionen, für alle Zellen und die Kombination gleich (`zelle.js` Kopf):

| | Regel |
|---|---|
| Signaltag | **erster** Panel-Handelstag jedes Kalendermonats; Werte lesen Kurse **bis einschließlich** Signaltag, Bilanz nur mit `filed` **strikt vor** dem Signaltag (Leser wirft sonst) |
| Ausführung, Haltefenster | Eröffnung des nächsten Handelstags a → Eröffnung des Ausführungstags des nächsten Signaltags (`halte`, täglich gleichgewichtet; Tote nach §3.6 Teil 1: Insolvenz + Zwangs-Delisting = Totalverlust). **Abweichung vom Auftrag** („Schluss des Signaltags"): `halte` kann Schluss→Schluss nicht, eine zweite Haltefunktion wäre eine zweite Maschine — Entscheid §9 (1) |
| Universum | Umsatzklassen 50-250 / 250-1000 / ab1000 (`K.UNIVERSUM_KLASSEN_TEIL3`), 250 Vortage, Cent-Boden, Qualitätsmarken, Eröffnungskurs am Ausführungstag; SPY nie Mitglied; Signaltag zählt ab 100 Mitgliedern. Gemessen (Kunstfeld, 92 Signaltage): **760 Mitglieder** je Signaltag (Klassen 562 / 185 / 35 wie Teil 4), Dezil 76 |
| Rang | je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; **fehlender Wert = mittlerer Rang (n+1)/2**, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½). Dezil oben = Rang > 0,9 n, unten ≤ 0,1 n. Je Dezil wird gezählt, wie viele Mitglieder aufgefüllt waren |
| Kosten | `umschlagKosten`: ½ Σ\|Δw\| × Kassa-Hürde der Klasse am Signaltag (0,0854 / 0,0647 / 0,0449 Pp je Umlauf); gemessen ≈ 0,080 Pp je Einheit Umschlag im Klassenmix; Zufallsdezil Umschlag 90 % ⇒ 0,073 Pp je Monat |
| Statistik | Hauptmaß Mittel der Monatsperioden, se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Perioden (= naiv), t = Mittel/se; daneben Tagesreihe mit HH-Lag 21 (t_HH), Marke ab Faktor 1,5. **MDE₈₀ = 2,8016 × se** (`K.MDE_FAKTOR`) |
| Rückhaltefenster | **2024-09 … 2026-08 (24 Signaltage) versiegelt**: die Maschine lädt ohne `rueckhalte: true` keinen Signaltag ab 2024-09-01 (Klinke, `test.js` B2); jede Zelle trägt `rueckhalte: false\|true`; die Flagge setzt nur der PM nach dem Urteil (§8) |

---

## 3. Universum und Signaltage

- Entdeckung und Urteil: **92 Signaltage 2017-01-03 … 2024-08-01** (Haltefenster bis 2024-09-04).
- Rückhalte: **24 Signaltage 2024-09-03 … 2026-08-03** (Haltefenster bis 2026-09-02) — erst nach dem Urteil (§8).
- Jahresscheiben (Kalenderjahr des Signaltags; 2024 „dünn" mit 8 Monaten), letzte 250 Tage ab dem letzten geladenen Signaltag.

---

## 4. Die Felder — Formel, Rolle, Richtung (aus `mehrfaktor-felder.md` §1, Nr. 1–11 ohne 9 und 12)

Alle Rohgrößen sind so orientiert, dass **höher = besser** (das Dezil oben wird gekauft); „gedreht" heißt Vorzeichen −. Jede Zelle
liefert die Rohgröße, keinen Rang. Bilanzgrößen kommen aus `sicht.fundamentalAm(sym, tag)` (jüngstes 10-K/10-Q mit `filed` < tag,
Aktualitäts-Tor 456 Tage, Felder `roh`, `quartale` D0…D7, `summe4q`, `abgeleitet`); Kurse aus `sicht.zeileAm`, `sicht.zurueck`,
`sicht.felder`. Literaturzahlen sind Long-Short je Monat vor Kosten und **Obergrenzen** (McLean/Pontiff 2016: realistisch die Hälfte).

| Nr. | Feld (Zelle) | Rolle | Rohgröße je Symbol am Signaltag t | Quelle | Literatur L-S/Monat |
|---|---|---|---|---|---|
| 1 | Momentum (`momentum`) | **Signal** | bSchluss(21 Panelzeilen vor t) / bSchluss(252 Zeilen vor t) − 1 (wie `momentum12_1` des Prüfstands) | Panel | ≈ 1 Pp (Jegadeesh/Titman 1993); Teil 3 Klassen 1–3: +1,1 Pp gegen Universum, t 2,3 |
| 2 | Kurzfrist-Umkehr (`umkehr`) | **Kostenfrage, nicht gewichtet** | −(bSchluss(t) / bSchluss(21 Zeilen vor t) − 1) | Panel | ≈ 1 Pp (Jegadeesh 1990), Umschlag ~90 % ⇒ Kosten ≈ 0,07 Pp; die Zelle belegt nur Umschlag und Netto |
| 3 | Niedrige Schwankung (`schwankung`) | **Signal** | −sd der Tagesrenditen (`rendite`, Pp = 100 · (Schluss/Vorschluss − 1)) über die 252 Zeilen z, zurueck(z,1) … zurueck(z,251) bis einschließlich t (Stichproben-sd n−1, alle 252 vorhanden und endlich, sonst null); Einheit Pp | Panel | 0,5–0,7 Pp (Ang et al. 2006, Frazzini/Pedersen 2014) |
| 4 | Größe (`groesse`) | **Kontrolle** | ln(Marktwert), Marktwert = `aktien` (jüngstes Filing) × rohSchluss(t); Split zwischen `filed` und t verzerrt um den Faktor — ausweisen | Tafel × Panel | Banz 1981; heute schwach |
| 5 | Bewertung (`bewertung`) | **Signal** | `roh.eigenkapital` (Bestand D0, jüngstes Filing) / Marktwert (wie 4); **negatives Eigenkapital ist ein Wert (unterstes Dezil), kein Fehler** — Anzahl berichten; E/P (`summe4q.netto` / Marktwert) nachrichtlich als zweite Zelle `bewertung-ep`, nicht gewichtet — Entscheid §9 (4) | Tafel × Panel | 0,3–0,4 Pp (Fama/French 1992) |
| 6 | Ertragskraft (`ertragskraft`) | **Signal** | (`roh.umsatz` − `roh.umsatzkosten`) × 4 / `roh.qtrs` / `roh.vermoegen` — Bruttogewinn **des jüngsten Filings auf Jahresrate** (10-K qtrs 4, 10-Q qtrs 1), Verhältnis; null, wenn eine Größe fehlt oder vermoegen ≤ 0. *Nachtrag §11 (1): die Tafel führt 4-Quartals-Summen nur für umsatz/netto/operativ, nicht für umsatzkosten.* ROA (`abgeleitet.roa` = netto 4Q / vermoegen D0) nachrichtlich als zweite Zelle `ertragskraft-roa`, nicht gewichtet | Tafel | 0,3–0,5 Pp (Novy-Marx 2013) |
| 7 | Investition (`investition`) | **Signal** | −100 · (`roh.vermoegen` / `vermoegenVor` − 1) in Pp (`vermoegenVor` = Assets am Stichtag D4, Zeilenfeld der Tafel; Vermögenswachstum, gedreht); null, wenn eines fehlt oder ≤ 0 | Tafel | ≈ 0,3 Pp (Cooper/Gulen/Schill 2008, Fama/French 2015) |
| 8 | Gewinnüberraschung (`sue`) | **Signal** | (`quartale.netto[0]` − `quartale.netto[4]`) / sd(`quartale.netto[0…7]`, Stichproben-sd n−1); null bei einem fehlenden der acht Quartale oder sd = 0; Signal ab `filed` (der Leser liefert nur `filed` < t) — Nenner Entscheid §9 (5); Anteil der Quartalswege `y` berichten | Tafel `quartale` | 0,5–1 Pp über 2–3 Monate (Bernard/Thomas 1989) |
| 10 | F&E-Intensität (`fue`) | **Signal** | `roh.fue` / `roh.umsatz` **desselben Filings** (gleiche `qtrs`, darum ohne Jahresrate), Verhältnis; **nur Symbole mit ausgewiesenem F&E** (`roh.fue` ≠ null; ein ausgewiesenes 0 ist ein Wert), sonst null (nie 0); null bei umsatz fehlend oder ≤ 0. *Nachtrag §11 (1).* Nachrichtlich `fue-marktwert` = `roh.fue` × 4 / `roh.qtrs` / Marktwert (Jahresrate), nicht gewichtet | Tafel | ≈ 0,5 Pp für F&E-starke Werte (Chan/Lakonishok/Sougiannis 2001) |
| 11 | Verschuldung (`verschuldung`) | **Kontrolle** | (vermoegen − eigenkapital) / vermoegen (D0) | Tafel | Campbell/Hilscher/Szilagyi 2008: Notlage zahlt negativ |

Nicht in Runde 1: 9 Fundamental-Momentum (überlappt mit 8; Auftrag schließt es aus), 12 Branchen-Momentum, 13–16 (Runde 2/3).

**Erwartete Abdeckung** (aus Teil 4 und dem Bilanz-Kunstfeld vom 22.09.): Panel-Felder 100 %; Bilanz-Felder ≈ 83 % des Universums
(50-250: 81 %, 250-1000: 89 %, ab1000: 90 %; 20-F/40-F-Filer, Reihen ohne CIK, Filings jenseits des Tors); F&E ≈ 30–40 %
(50.918 von 158.516 Filings). Die Abdeckung je Klasse und Jahr ist Teil jeder Zelle.

---

## 5. Die Kombination (Runde 1b)

`kombiniere(zellen, ['momentum', 'schwankung', 'bewertung', 'ertragskraft', 'investition', 'sue', 'fue'], Gewichte alle 1,
{ kontrollen: ['groesse', 'verschuldung'] })`, dann `zelleAusKombination(...)` — die Kombination läuft als Zelle durch dieselbe
Maschine (Einzelmessung, Orakel, Placebo Symbole, Zufall, Klinke, Bericht; Placebo Versatz entfällt, er gehört in die Feldzellen).

- **Gewichte gleich (1), vorab, nie angepasst.** Ein Symbol, dem ein Feld fehlt, bekommt dort den mittleren Rang; die Zahl der
  Auffüllungen je Feld und **je Dezil** wird ausgewiesen. Ein Dezil, das überwiegend aus Auffüllungen besteht, ist ein Fund über die
  Daten, kein Signal.
- **Kontrollgrößen** 4 und 11 werden je Signaltag als Rang mitgeführt und berichtet: mittlerer Kontrollrang im Dezil oben gegen
  Universum (ist das Dezil klein/verschuldet?). Sie gewichten nichts.
- **Umkehr (2)** wird nicht kombiniert. Seine Zelle beantwortet nur die Kostenfrage (Umschlag × Hürde gegen Literatur ×½).
- Universum, Signaltage und Rückhalte-Flagge aller Zellen müssen identisch sein (`kombiniere` wirft sonst).

---

## 6. Vorprüfung — VOR dem Kombinationslauf, Pflicht (Auftrag §1a.8)

Ein Nullbefund ohne diese Vorprüfung ist keiner (Fehlerform „Kostenvorprüfung am falschen Ort", 15.09.).

1. **Erwartete Kante.** Je Signalfeld Literatur L-S ×½ (Zerfall) ×½ (einseitig, Dezil oben gegen Universum) ≈ 0,1–0,25 Pp je
   Monat. Kombination von k = 7 Signalen: unter Unabhängigkeit wächst die Trennschärfe mit √k (≈ 2,6); die Fundamentalfelder 5–7
   hängen zusammen (Fama/French 2015), realistisch √4–√5 ≈ 2–2,2. **Erwartung brutto 0,3–0,6 Pp je Monat.** Diese Zahl steht
   hier, **bevor** eine Zelle gemessen ist, und wird nicht nachgezogen.
2. **Kosten.** Umschlag der Kombination aus der **Verweildauer im Dezil** (nicht aus der Trägheit der Kennzahlen): Schätzung =
   Mittel der Dezil-Umschläge der sieben Feldzellen (jede Zelle liefert ihn); Kosten = Umschlag × 0,080 Pp. Bei 40–60 % Umschlag
   0,03–0,05 Pp je Monat. **Tor V1:** erwartete Kante ×½ (0,15–0,3 Pp) > Kosten — sonst ist die Frage vor der Messung tot.
3. **Auflösung.** Boden aus den Zufallsdezilen der Maschine (gemessen 22.09., 92 Signaltage, Klassen 1–3): se je Ziehung
   **0,110 Pp**, **MDE₈₀-Boden 0,31 Pp** je Monat (bei 116 Signaltagen 0,28). Ein echtes Dezil streut stärker (Faktor 2–4;
   Momentum Teil 3: 4,45 — `MACHBARKEIT.md` §7 der Stimmungsstudie): **×1 / ×2 / ×4 = 0,31 / 0,62 / 1,24 Pp.** Schätzung vor dem
   Lauf: MDE₈₀ = 2,8016 × Median der se (netto) der sieben Feldzellen. **Tor V2:** erwartete Kante ×½ ≥ MDE₈₀-Schätzung. Fällt V2,
   wird der Lauf trotzdem gefahren, aber das Urteil kann dann nur „belegt" oder **„nicht entscheidbar"** lauten — nie „kein Effekt".
   Ehrlich vorab: bei Faktor 4 (1,24 Pp) ist die Frage mit 92 Monaten nicht auflösbar; bei Faktor 2 (0,62 Pp) am Rand. Die
   Kombination hat weniger Faktorneigung als ein Einzeldezil, deshalb ist Faktor 2 die Arbeitsannahme — geprüft wird sie an den
   Zellen, nicht behauptet.
4. **Maschine je Zelle:** Orakel, Placebo Symbole, Zufall ×12, Leck-Klinke (Kurs und Bilanz) bestanden — sonst kommt die Zelle
   nicht in die Kombination (gemeldet, nicht repariert; Nachtrag nötig). Placebo Versatz wird ausgewiesen, aber nach §9 (3)
   behandelt.

---

## 7. Urteil vorab

**„belegt"**, wenn **alle** gelten: (a) Tore der Maschine (jede Feldzelle **und** die Kombinationszelle: Orakel, Placebo Symbole,
Zufall, Klinke) bestanden; (b) Vorprüfung §6 dokumentiert; (c) Dezil oben − Universum **netto** ≥ MDE₈₀ (aus dem Lauf, 2,8016 ×
se); (d) **t_HH ≥ 3** (Tor wie Teil 4; bei einem Test wäre z = 1,96 — Entscheid §9 (6)); (e) letzte 250 Tage im Mittel nicht
negativ (wie Teil 4 §T4.6). Sonst **„nicht belegt: nichts oberhalb von <MDE₈₀> Pp je Monat"** — nie „da ist nichts"; fällt V2,
lautet der Satz „nicht entscheidbar unterhalb von <MDE₈₀> Pp".

Testzahl **1**. Keine zweite Gewichtung, kein Weglassen eines Feldes, keine andere Dezilbreite, kein anderes Haltefenster nach dem
Blick auf die Zahlen. Neue Ideen bekommen eine Runde 2 mit eigener Vorregistrierung.

---

## 8. Rückhaltefenster — Bestätigung außerhalb des Rechenfensters

Nach dem Urteil (und nur dann) setzt der PM `rueckhalte: true`, alle Zellen und die Kombination werden **einmal** über
2017-01 … 2026-08 neu gebaut, und die 24 Signaltage 2024-09 … 2026-08 werden als eigene Reihe berichtet: Vorzeichen, Größe,
se, t, MDE₈₀ (mit 24 Monaten groß — genau das soll die Tafel zeigen). Regel: die Rückhaltereihe **bestätigt oder widerspricht**,
sie wird nicht zur Anpassung benutzt; eine Kante, die im Rechenfenster belegt und im Rückhaltefenster negativ ist, geht als
„belegt, Rückhalte widerspricht" in den Belegstand — nicht als belegt.

---

## 9. Was Wilhelm entscheiden muss (Formular, vor der Registrierung)

1. **Haltefenster:** Prüfstand-Konvention Eröffnung(a) → Eröffnung(a') (so gebaut, alles wiederverwendet) **oder** Schluss(t) →
   Schluss(t') wie im Auftrag (verlangt eine zweite Haltefunktion neben `halte`).
2. **Orakel-Schranke:** horizontgleich (Dezil − Universum ≥ 5 Pp, Teil 3) plus Long-Short ≥ 20 Pp (Δ Teil 4), Mittel/sd ≥ 1,
   t ≥ 8 — so gebaut, weil die 20 Pp einseitig auf einen Monat übertragen bei einwandfreier Maschine fallen (gemessen 18,6 Pp
   bei 92, 19,9 bei 116 Signaltagen; t 29; L-S 34–36 Pp) — **oder** 20 Pp einseitig wie im Auftrag §1a.2 (dann fällt jede Zelle).
3. **Placebo 1 (Versatz +21):** als Tor (Auftrag: „≈ 0") **oder** nur als Diagnose. Bei trägen Feldern ist er ≈ Einzelmessung, bei
   Umkehr und SUE enthält er die Halteperiode (≈ Orakel); die Erwartung ≈ 0 gilt nur für Felder ohne Zeitstruktur.
4. **Bewertung:** nur Buchwert/Marktwert gewichtet (E/P nachrichtlich) **oder** beide als getrennte Signale (dann acht Signale).
5. **SUE-Nenner:** sd der acht Quartalsgewinne D0…D7 (Feldseite) **oder** sd der Vorjahresdifferenzen (Bernard/Thomas; die Tafel
   trägt nur vier davon).
6. **t-Schwelle:** 3 (Auftrag, „Tore wie Teil 4") **oder** 1,96 (ein Test, α 0,05 zweiseitig).
7. **Rangregel bei Lücken:** Streckung auf 1..n (Dezil = 10 % der Symbole **mit Wert**, so gebaut) **oder** Lückenblock in der
   Mitte (Dezil = 10 % des Universums, bei F&E dann das oberste Viertel der Ausweiser).
8. **Umkehr-Zelle:** bauen (Kostenfrage, nicht kombiniert) **oder** streichen.
9. **F&E ohne Ausweis:** null (so gebaut, Abdeckung wird berichtet) **oder** 0 (dann ist „kein F&E" ein Signalwert und die
   Abdeckung 100 %).
10. **Freigabe der neun Feld-Agenten** nach `AUFTRAG-VORLAGE-FELD.md` (Budget je 120k).

**Entschieden (PM, 22.09.2026 15:01, jeweils die Empfehlung der Übergabe Nr. 48 §4; Wilhelm kann jeden Punkt vor der Registrierung
umstoßen):** 1 Prüfstand-Haltefenster Eröffnung(a) → Eröffnung(a′) · 2 horizontgleich 5 Pp + Long-Short 20 Pp, alles aus `konfig.js`
(20 Pp einseitig war eine Schranke aus der falschen Skala, Fehlerform vom 09.09.) · 3 Placebo Versatz nur Diagnose; Nullpunkt =
Orakel, Placebo Symbole, Zufall, Klinke · 4 nur B/M gewichtet, E/P nachrichtlich · 5 sd der acht Quartalsgewinne (n−1) · 6 t_HH ≥ 3 ·
7 Streckung (Dezil = 10 % der Ausweiser; Aufgefüllte je Dezil gezählt — das ist die Umsetzung von „fehlend = mittlerer Rang" aus
Auftrag §1a.1, kein Widerspruch) · 8 Umkehr-Zelle bauen · 9 F&E ohne Ausweis = null · 10 freigegeben 22.09. als Nr. 49–57
(Aufträge `uebergabe/auftrag-mehrfaktor-feld-<feld>-2026-09-22.md`; Größe und Verschuldung als ein Agent, beide Kontrollen).
**Wilhelms Formular:** die Registrierung selbst — nach den Zellen, mit der Vorprüfung §6 (Tore V1/V2) in der Hand.

---

## 10. Prüfungen der Kombination (vor dem Lauf, zusätzlich zu `test.js`)

- K-P1 Alle sieben Signalzellen und zwei Kontrollzellen tragen `kennung` `mehrfaktor-2026-09-22/zelle/v1`, `rueckhalte: false`,
  dieselben 92 Signaltage und dieselben Universen (`kombiniere` wirft sonst).
- K-P2 Kein `kunst`-Eintrag in einer Zelle der Kombination.
- K-P3 Gewichte genau {1,1,1,1,1,1,1}, Kontrollen genau {groesse, verschuldung}, Umkehr nicht enthalten.
- K-P4 Nullpunkt jeder Zelle: Orakel, Placebo Symbole, Zufall, Leck bestanden (Placebo Versatz nach §9 (3)).
- K-P5 Vorprüfung §6 als Datei `pruefung/vorpruefung-kombination.json` **vor** dem Lauf (Erwartung, Umschlag, MDE-Schätzung, V1, V2).
- K-P6 Kombinationszelle: Auffüllungen je Feld und je Dezil ausgewiesen; Anteil aufgefüllter Mitglieder im Dezil oben < 50 %.
- K-P7 Urteil folgt §7 aus den eigenen Zahlen (MDE = 2,8016 × se, t, letzte 250 Tage); Satzform „nichts oberhalb von …".
- K-P8 Rückhaltereihe erst nach dem Urteil, eigene Datei, Flagge in der Kennung.

---

## 11. Nachträge

1. **22.09.2026 15:19 (PM), vor der ersten Feldzelle — Formeln 6 und 10 an die Tafel angepasst.** Grund: `bauen.js` bildet
   4-Quartals-Summen (`summe4q`, `quartale`) nur für `SUMMEN = ['umsatz', 'netto', 'operativ']`; `umsatzkosten` und `fue` gibt es
   nur als Rohfluss des Filings (`roh`, mit `roh.qtrs` 4 für 10-K, 1 für 10-Q). Ertragskraft daher als Bruttogewinn des jüngsten
   Filings auf Jahresrate (× 4/qtrs) durch `roh.vermoegen`; F&E-Intensität als `roh.fue / roh.umsatz` desselben Filings (Verhältnis,
   qtrs kürzt sich). Das Feld und seine Richtung bleiben, nur die Operationalisierung folgt der Tafel. Mit demselben Nachtrag
   benannt: `ertragskraft-roa` (nachrichtlich), negatives Eigenkapital als Wert (Feld 5), sd n−1 (Feld 8), `vermoegenVor` als
   Zeilenfeld (Feld 7), Einheiten (Momentum, Umkehr, Investition in Pp; Schwankung in der Einheit der Panel-Spalte `rendite`).
   Keine Zahl eines Feldes war zu diesem Zeitpunkt gemessen.
2. **22.09.2026 15:40 (PM), nach den Feldzellen, vor der Kombination — Fund über die Daten, keine Änderung an Formeln oder
   Regeln.** Das Panel v2.1 klebt bei **101 Reihen** zwei Notierungen mit mehr als einem Jahr Lücke zu einer Reihe zusammen
   (wiederverwendete Kürzel und Wiederzulassungen: SN = Sanchez Energy bis 2019 + SharkNinja ab 2023-07-31, dazu MBLY, DOW, CHK,
   XL, DWAC, CART …; gefunden vom Momentum-Chat an SN mit 21.872 Pp am 2024-07-01, vom PM über alle Reihen gezählt). Folge: die
   250-Vortage-Regel des Universums zählt Zeilen des alten Emittenten mit, Momentum und Schwankung rechnen über die Lücke.
   Ausmaß in den Zellen: **57 Mitglied-Monate von 69.969** (0,08 %; im Mittel 0,6 je Signaltag, höchstens 3; 13 Symbole). Entscheid:
   Zellen bleiben, der Fund geht als Panel-Nachbesserung (v2.2: Trennung an Lücken > 90 Tage über den `~2`-Mechanismus) in die
   offene Liste (mit Nr. 41); die Kombination wird auf v2.1 gerechnet und der Fund im Bericht ausgewiesen. Wird v2.2 vor der
   Kombination fertig, werden alle Zellen einmal neu gebaut (Sekunden) — als Nachtrag 3 mit beiden Zahlen.
   **Zweiter Datenfund derselben Art (Fundamentaltafel):** einzelne Filings tragen Beträge in der falschen Einheit (HRC 10-K vom
   2021-11-12: `vermoegen` 4.999,1 statt 4.999.100.000 — gefunden vom Ertragskraft-Chat; PM-Zählung über alle 158.516 Filings:
   **15 isolierte Einbrüche/Spitzen um mehr als Faktor 100** bei 13 CIKs, dazu SPAC-Hüllen mit echten 1.000×-Sprüngen, die keine
   Fehler sind). Wirkung: einzelne Symbol-Monate mit absurden Rohwerten in den Feldern 4, 5, 6, 7, 11 — der Rang ist dagegen
   unempfindlich (das Symbol landet am Rand eines Dezils). Entscheid wie oben: Zellen bleiben; Tafel-Nachbesserung (Plausibilität
   gegen Nachbar-Filings) als offener Punkt Nr. 59; im Kombinationsbericht ausgewiesen.

---

*Entwurf 2026-09-22 (Werkzeug-Chat, Nr. 48). Nichts gemessen außer Kunstfeldern. Alles Simulation mit virtuellem Kapital, keine
Anlageberatung.*
