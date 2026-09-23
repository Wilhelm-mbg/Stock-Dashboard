# Vorregistrierung — Mehrfaktor-Kombination, Runde 1b — **REGISTRIERT** (23.09.2026 22:16)

**Status: REGISTRIERT** — Wilhelm per Formular am 23.09.2026 22:16 („Registrieren und laufen lassen"), nach Nachträgen 1–5 und vor
dem Kombinationslauf (Nr. 62). **Siegel:** der Commit, der diese Statuszeile einführt (Hash im Wiki-Log und in `wiki/entscheide.md`);
ab hier ändert sich an diesem Papier nichts mehr außer dem Ergebnisabschnitt (§12, vom Lauf geschrieben) und datierten Nachträgen,
die nichts an Frage, Test, Feldern, Gewichten, Universum, Signaltagen, Haltefenster oder Toren ändern. Zum Zeitpunkt der
Registrierung war **kein IC eines echten Feldes und keine Kombinationszahl** berechnet oder angesehen; die 13 Feldzellen
(`zellen/`, Kennung `zelle/v1.1`, Tafel v1.1) tragen ihre IC-Werte als Diagnose in den Dateien, die der PM nur auf se/MDE₈₀ gelesen hat.

*Ursprünglicher Kopf (22.09.):* Entwurf des Werkzeug-Chats (Auftrag Nr. 48 §3), nicht registriert, keine Zahl eines Feldes gemessen;
die neun Feldzellen (Runde 1a) entstehen davor, sind aber **Bau- und Nullpunktprüfungen, keine Auswahl**.

**Die Feldwahl stammt aus `wiki/mehrfaktor-felder.md` vom 22.09.2026 (Commit `4da7ecf`), vor jeder Feldmessung.** Änderungen an
Feldern, Formeln oder Gewichten nach der ersten Feldzelle sind Nachträge mit Datum und Grund (§11), nie stille Korrekturen.

Alles Simulation mit virtuellem Kapital, Kursrenditen ohne Ausschüttungen. **Keine Anlageberatung.** Nur Lesezugriff auf Panel und
Fundamentaltafel; kein Netz, kein Archiv auf E:.

---

## 1. Die Frage — eine Vorhersage, ein Test

*(Fassung nach Nachtrag 3, 22.09.2026, Wilhelms Entscheid „A": Teststatistik ist der Rang-Informationskoeffizient; Felder, Gewichte,
Universum, Signaltage, Haltefenster unverändert.)*

Trägt die **gleichgewichtete Rangkombination** der sieben Signalfelder (Momentum, niedrige Schwankung, Bewertung, Ertragskraft,
Investition, Gewinnüberraschung, F&E-Intensität) **Information über die Rangfolge der nächsten Monatsrenditen** im Universum?

**Vorhersage:** der **mittlere Spearman-IC** zwischen Kombinationsrang und Halteperioden-Rendite (brutto, Eröffnung(a) → Eröffnung(a′),
alle Universumsmitglieder, Aufgefüllte mit mittlerem Rang; Definition Nachtrag 3) über die 92 Signaltage 2017-01 … 2024-08 ist
**> 0**; erwartete Größe nach §6: **0,02–0,03** (Literatur für Mehrfaktor-Komposite 0,04–0,06, halbiert für Zerfall). **Ein** Test.
Dezil oben − Universum (brutto/netto), Long-Short, Dezil unten, Jahresscheiben, Regime, Kontrollgrößen und alle Einzelfelder sind
Diagnose und entscheiden nichts. Ein Ja heißt **„Information belegt, Handelbarkeit nicht entscheidbar"** (das Dezil netto wird mit
seiner MDE₈₀ berichtet, nicht beurteilt) — der Belegstand führt das so, nicht als handelbare Kante.

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
3. **Auflösung (Dezil, nur noch Diagnose).** Boden aus den Zufallsdezilen der Maschine (gemessen 22.09., 92 Signaltage, Klassen 1–3):
   se je Ziehung **0,110 Pp**, **MDE₈₀-Boden 0,31 Pp** je Monat. Gemessen an den v1-Zellen (22.09.): Median der se (netto) der sieben
   Feldzellen 0,372 ⇒ **MDE₈₀-Schätzung 1,04 Pp** — Tor V2 für das Dezil **gefallen** (Kante/2 = 0,15–0,30). Deshalb Nachtrag 3.
3a. **Auflösung (IC, der Test).** Boden aus Kunstfeldern (22.09., `wiki/mehrfaktor-vorpruefung.md` §2): Zufall se **0,0035**,
   **MDE₈₀-Boden 0,010**; Orakel IC exakt 1,0000. Ein echtes Signal streut über die Zeit stärker (Faktor 2–4): **×2 / ×4 = 0,020 / 0,039.**
   Schätzung vor dem Lauf: MDE₈₀(IC) = 2,8016 × Median der se(IC) der sieben Feldzellen (aus den neu gebauten Zellen mit IC — die
   se, nicht die IC-Werte, gehen in die Schätzung ein). **Tor V2:** erwarteter IC (0,02–0,03) ≥ MDE₈₀(IC)-Schätzung. Fällt V2, wird der
   Lauf trotzdem gefahren, aber das Urteil kann dann nur „belegt" oder **„nicht entscheidbar unterhalb von IC X"** lauten — nie „kein Effekt".
4. **Maschine je Zelle:** Orakel, Placebo Symbole, Zufall ×12, Leck-Klinke (Kurs und Bilanz) bestanden — sonst kommt die Zelle
   nicht in die Kombination (gemeldet, nicht repariert; Nachtrag nötig). Placebo Versatz wird ausgewiesen, aber nach §9 (3)
   behandelt.

---

## 7. Urteil vorab

*(Fassung nach Nachtrag 3.)* **„Information belegt"**, wenn **alle** gelten: (a) Tore der Maschine (jede Feldzelle **und** die
Kombinationszelle: Orakel — Dezil und IC = 1 —, Placebo Symbole, Zufall, Klinke) bestanden; (b) Vorprüfung §6 dokumentiert
(`pruefung/vorpruefung-kombination.json` vor dem Lauf); (c) **mittlerer IC ≥ MDE₈₀(IC)** aus dem Lauf (2,8016 × se); (d) **t ≥ 3**
(Mittel/se über die 92 Signaltage; Entscheid §9 (6) sinngemäß); (e) die letzten 12 Signaltage im Mittel nicht negativ. Sonst
**„nicht belegt: nichts oberhalb von IC <MDE₈₀>"** — nie „da ist nichts"; fällt V2 (§6.3a), lautet der Satz „nicht entscheidbar
unterhalb von IC <MDE₈₀>". Das Dezil oben netto wird daneben **berichtet** (Wert, se, MDE₈₀, Umschlag, Kosten) und nicht beurteilt:
die Handelbarkeit bleibt offen, solange das Dezil unter seiner MDE₈₀ liegt.

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
- K-P7 Urteil folgt §7 aus den eigenen Zahlen des IC (MDE₈₀ = 2,8016 × se, t, letzte 12 Signaltage); Satzform „nichts oberhalb von IC …";
  das Dezil netto wird berichtet, nicht beurteilt (Nachtrag 3). Alle Zellen der Kombination tragen Kennung `…/zelle/v1.1` (mit IC) und
  dieselbe `tafelKennung` (Fundamentaltafel v1.1).
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
3. **22.09.2026 21:20 (PM, nach Wilhelms Entscheid „A" per Formular), vor der Registrierung und bevor ein IC eines echten Feldes
   existiert — Teststatistik geändert: Rang-IC statt Dezil netto.** Grund: die Vorprüfung §6.3 an den v1-Zellen ergab MDE₈₀ 1,04 Pp
   gegen eine erwartete Kante von 0,15–0,30 — der Dezil-Test kann die Frage mit 92 Monaten nicht entscheiden (nötig ≈ 2.500 Monate).
   Der IC-Boden wurde **ausschließlich an Kunstfeldern** gemessen (Zufall se 0,0035, MDE₈₀ 0,010; Orakel 1,0000); kein IC eines echten
   Feldes oder der Kombination war zu diesem Zeitpunkt berechnet. **Definition (bindend, Auftrag Nr. 61):** je Signaltag Spearman-IC
   = Pearson-Korrelation der Ränge (Gleichstand = mittlerer Rang) zwischen Kombinationsrang (alle Universumsmitglieder, Aufgefüllte mit
   mittlerem Rang) und Halteperioden-Rendite der Maschine (brutto, Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust); Signaltag ohne
   IC bei < 100 Paaren; Mittel über die Signaltage, se = sd/√n, t = Mittel/se, MDE₈₀ = 2,8016 × se; Jahresscheiben und letzte 12
   Signaltage als Diagnose. Feldzellen tragen ihren IC (nur Mitglieder mit Wert) als Diagnose. Felder, Gewichte (alle 1), Kontrollen,
   Universum, Signaltage, Haltefenster, Rückhaltefenster: **unverändert**. Kosten (§6.2) bleiben als Information über die Handelbarkeit
   des Dezils, gehen nicht in das Urteil ein. §1, §6.3/3a, §7, §10 K-P5/K-P7 sind entsprechend gefasst.
4. **22.09.2026 22:08 (PM), nach Abnahme der Maschine v1.1 (Nr. 61, `f5b5cb2`, 31 Prüfungen grün im eigenen Lauf) — Konvention von y
   festgehalten, keine Änderung der Definition:** die Halteperioden-Rendite je Mitglied kommt aus der Haltefunktion `halte` der Maschine (ein
   Mitglied je Aufruf, Totalverlust nach §3.6 Teil 1, brutto) — dieselbe Funktion wie die Dezilmessung. Das Dezil-Orakel des Prüfstands
   (`orakelPeriode`) weicht davon minimal ab (IC 0,9997, kein Wert bitgleich; andere Rundung des Prüfstands) — es bleibt die Kontrolle der
   Dezilmessung; der IC-Orakel-Test benutzt y selbst und ist exakt 1 (Prüfung D1). Kunstfeld-Böden mit der fertigen Maschine: Zufall se 0,0035 /
   MDE₈₀ 0,0098, 12 Ziehungen MDE-Boden 0,0106, Kunstpanel-Kante IC 0,111 (t 11,3) ab 2020. Kein IC eines echten Feldes berechnet.
5. **22.09.2026 22:28 (PM) — alle 13 Feldzellen neu gebaut auf Fundamentaltafel v1.1 (Nr. 60, `ee3158a`) und Maschine v1.1 (Nr. 61,
   `f5b5cb2`); Nachtrag-3-Fassung des Vergleichs.** PM-Nachrechnung unabhängig von der Maschine: 69.969 Werte je Zelle identisch (0
   Abweichungen, alle 13). Vorher/Nachher (v1 → v1.1): Panel-Felder unverändert (0 geänderte Werte); Tafel-Felder 34 (F&E) bis 787
   (Größe, Bewertung) von 69.969 Werten geändert; Dezil oben − Universum netto verschiebt sich um höchstens 0,07 Pp (Bewertung-E/P
   −0,148 → −0,080, Verschuldung 0,425 → 0,458, Investition 0,107 → 0,131), se und MDE₈₀ praktisch gleich; Abdeckung der Bilanzfelder
   −0,8 Pp (verworfene Zuordnungen). Nullpunkt (vier Kontrollen) in allen 13 Zellen bestanden. **Vorprüfung §6** (`pruefung/vorpruefung-
   kombination.json`, `pruefung/vorpruefung.js`; nur se-Werte, keine IC-Mittel): V1 bestanden (Umschlag 21,4 % ⇒ 0,017 Pp);
   **V2 (IC) gefallen:** Median se(IC) der sieben Signalzellen 0,0177 (Faktor 5,0 über dem Kunstfeld-Boden 0,0035) ⇒ MDE₈₀(IC)-Schätzung
   **0,0495** gegen erwarteten IC 0,02–0,03. Zur Einordnung (kein Tor): die Schätzung nimmt an, die Kombination streue wie ein
   Einzelfeld; unter Unabhängigkeit der sieben IC-Reihen wäre es 0,0177/√7 ⇒ MDE₈₀ 0,019, mit k_eff = 4 wie in §6.1 ⇒ 0,025 — die
   Wahrheit liegt dazwischen und zeigt sich erst im Lauf. **Folge nach §6.3a/§7:** der Lauf wird gefahren; ein Nein lautet „nicht
   entscheidbar unterhalb von IC <MDE₈₀ aus dem Lauf>", ein Ja verlangt IC ≥ MDE₈₀ aus dem Lauf und t ≥ 3. Registrierung: Wilhelms
   Formular; danach ändert sich an diesem Papier nichts mehr außer dem Ergebnisabschnitt.

---

*Entwurf 2026-09-22 (Werkzeug-Chat, Nr. 48). Nichts gemessen außer Kunstfeldern. Alles Simulation mit virtuellem Kapital, keine
Anlageberatung.*

---

## 12. Ergebnis (vom Lauf geschrieben, 23.09.2026)

**Urteil nach §7: „nicht entscheidbar unterhalb von IC 0,0505".** Satzform nach §6.3a, weil Tor V2 vor dem Lauf mit dem registrierten
Schätzer gefallen war (Schätzung 0,0495; Lauf 0,0505). Bedingungen: (a) Nullpunkt der Kombinationszelle und aller neun Feldzellen
bestanden ✓; (b) Vorprüfung dokumentiert ✓; (c) IC Mittel 0,0124 ≥ MDE₈₀ 0,0505 ✗; (d) t 0,69 ≥ 3 ✗; (e) letzte 12 Signaltage
(2023-09-01 … 2024-08-01) Mittel 0,0536 ≥ 0 ✓. Ein Lauf (Auftrag Nr. 62, `kombination.js`, 23.09.2026 22:34, 5,7 s), Testzahl 1,
`rueckhalte: false`, 92 Signaltage 2017-01-03 … 2024-08-01.

- **IC** (`zellen/kombination.json`, `einzelmessung.ic`): n 92, Mittel 0,0124, sd 0,1728, se 0,0180, t 0,69, MDE₈₀ 0,0505, kein
  Signaltag ohne IC; letzte 12: n 12, Mittel 0,0536.
- **Dezil oben − Universum netto (berichtet, nicht beurteilt):** −0,176 Pp, se 0,265, t −0,67 (t_HH −0,64), MDE₈₀ 0,743 Pp,
  Umschlag 29,4 %, Kosten 0,024 Pp je Monat; brutto −0,159 Pp.
- **Nullpunkt der Kombinationszelle:** Orakel bestanden (Dezil 18,59 Pp, t 29,4, Long-Short 34,40 Pp; IC 1,0000); Placebo Symbole
  bestanden (IC −0,0009, t −0,26; Dezil netto −0,214 Pp, t −1,27); Zufall ×12 bestanden (IC Mittel −0,0006, MDE₈₀-Boden(IC) 0,0106,
  Dezil-Boden 0,309 Pp, 0 Ausreißer); Leck-Klinke bestanden (0 Verstöße, Positivkontrolle Kurs 1 / Bilanz 1). Placebo Versatz entfällt.
- **K-P6 gefallen (Befund an den PM, keine Reparatur):** Anteil aufgefüllter Mitglieder im Dezil oben 84,3 % (5.933 von 7.042
  Mitglied-Monaten; Zählweise der Maschine: mindestens ein fehlendes Feld), Dezil unten 58,6 %; Auffüllungen je Feld über 69.969
  Mitglied-Monate: fue 71,9 %, ertragskraft 45,8 %, bewertung 22,4 %, sue 17,8 %, investition 16,6 %, momentum/schwankung 0,0 %.
- Kontrollgrößen (Näherung, Rangkorrelation Kombinationswert ↔ Kontrollrang je Signaltag): groesse +0,226, verschuldung −0,005.
- Prüfungen: K-P1–K-P5 ✓, K-P6 ✗, K-P7 ✓, K-P8 ✓ (`pruefung/kombination-pruefungen.json`). Bericht: `ERGEBNIS-KOMBINATION.md`.
- Repo-Stand vor dem Lauf HEAD `7efb519`; **Commit des Laufs: der Commit, der diesen Abschnitt einführt**
  (`git log -1 -- studien/mehrfaktor-2026-09-22/zellen/kombination.json`; Hash in der Übergabe Nr. 62).
