# Vorregistrierung (ENTWURF, nicht registriert) — Nachrichten-Stimmung aus GDELT als Tagesdesign (19.09.2026)

**Auftrag Nr. 45.** Dieses Papier ist ein Entwurf, den Wilhelm freigibt oder ändert; registriert ist erst die freigegebene
Fassung (Kennung dann `nachrichten-stimmung-tage-2026-09-19/v1`, dieser Entwurf trägt `v0-entwurf`). Es wurde **nichts gemessen**:
keine Stimmung, kein GDELT-Zugriff, kein Modell, kein Datenbau. Gerechnet wurde nur die Vorprüfung der Auflösung (§8) auf dem
vorhandenen Panel v2.1 ohne Stimmung. Alle Zahlen dieses Papiers stehen genau einmal in `konstanten.js`; die Signal-Definition
steht als Code in `signal.js` und ist mit 42 Kunstfällen in `test.js` geprüft. Die Maschine des Prüfstands (`universum`, `Sicht`,
`halte`, `umschlagKosten`, `momente`) wird **benutzt, nicht neu gebaut**. Grundlagen: `MACHBARKEIT.md` (§7), `ABDECKUNG.md` (§f),
`VORREGISTRIERUNG-TEIL4.md` (Muster), `wiki/fehlerformen.md`, `wiki/belegstand.md`, `wiki/kosten.md`.

Alles Simulation mit virtuellem Kapital. **Keine Anlageberatung.**

---

## 1. Frage und Erwartung

**Frage:** Trägt die Tages-Stimmung aus GDELT (Ton je Symbol und Handelstag) in den Umsatzklassen 2–3 (250–1.000 / ab 1.000 Mio $
Tagesumsatz) **nach Kosten** eine Querschnittskante über 1, 3 oder 5 Handelstage?

**Literaturlage in zwei Sätzen:** Tetlock 2007 (JF 62(3)) findet ≈ 9,5 bp am Folgetag je Standardabweichung Medienpessimismus,
die binnen einer Woche zurücklaufen (Zeitreihe auf dem Index, Sekundärzitat); Ke/Kelly/Xiu 2019 (NBER 26186) beschreiben ein
Abklingen in ≈ 5 Tagen. **Die Zahl für die Long-Short-Tagesrendite eines Stimmungs-Dezils ist nicht belegt** — sie ist
**Wilhelms Hand oder Zweitquelle** (PDF liegt lokal, `MACHBARKEIT.md` §3). Bis dahin gilt als **Arbeitsannahme E₁ = 0,10 Pp
brutto je Halteperiode** (Dezil oben gegen Universum, H = 1, in der Größenordnung Tetlocks); für H = 3 und 5 dieselbe Größe
(Abklingen, keine Aufsummierung). Diese Zahl entscheidet nichts — sie steht in der Vorprüfung (§8) neben Hürde und MDE.

**Vorhersage (registriert):** Größe 1 (Rang des Tages-Tons), Long-Uni, H = 1: Δ̄_brutto ≥ +0,10 Pp; netto > 0 nur, wenn
Δ̄_brutto ≥ Hürde (§5). Wird sie verfehlt, lautet das Urteil „nichts oberhalb von <MDE₈₀> Pp je Periode", nie „kein Effekt".

## 2. Daten

- **Quelle:** GDELT GKG 2.1 (`data.gdeltproject.org/gdeltv2/<Stempel>.gkg.csv.zip`, 96 Dateien je Tag), Stufe **„voll"**
  (Namensvergleich `V2EnhancedOrganizations`, wie `gkg-zaehlen.js` Nr. 44; Stufe „kurz" ist untauglich, `ABDECKUNG.md` §f), Ton
  `V1.5Tone[0]`, Stempel `DATE` (Crawl-Zeit UTC, 15 min). Lizenz frei, Zitat Pflicht.
- **Universum:** Klassen **2 und 3** des Prüfstands (`K.KLASSEN[2]` = 250-1000, `[3]` = ab1000), punkt-in-Zeit je Signaltag über
  `universum(T, t, {klassen: [2, 3]})` (Cent-Boden, 250 Vortage, `quelle_rein`, Qualitätsmarken, Eröffnungskurs am Folgetag).
  Für den Datenbau: die Namensliste = Vereinigung der Mitglieder am **ersten Handelstag jedes Monats** 2017-01 … 2026-08
  (Namenskarte wie Nr. 44, `namenskarte.js`), **ohne** die Medien-/Plattform-/Börsen-Handliste `MEDIEN` aus `auswerten.js`
  (25 Kürzel; sie fallen aus dem Universum, nicht nur aus der Zählung — Grund: Verdacht 56–66 % bei TWTR/NDAQ/NYT, `ABDECKUNG.md` §c).
- **Zeitfenster:** Signaltage 2017-01-03 … 2026-08-31 (Panel v2.1, Kennung `querschnitt-pruefstand-2026-09-13/panel/v2`).
- **Signaltag t = Handelstag.** Zum Signal gehören **nur Artikel mit Crawl-Stempel ≤ 16:00:00 ET des Tages t** (Umrechnung
  UTC → ET über `Intl`, Sommerzeit inklusive; `signal.js → stempelET`, geprüft P1d/P1e). Artikel nach 16:00 ET zählen als
  „spät" (gezählt, nicht Signal); Artikel mit ET-Kalendertag **nach t** sind ein Leck: **die Klinke wirft, der Lauf ist ungültig**
  (`tagesSignal`, P1a/P1c). Positivkontrolle: eine präparierte Zeile mit Stempel t + 1 muss die Klinke werfen lassen (P1a).
- **Undefinierte Tage:** Block-Ausfall **15.06.–01.07.2025** (einschließlich) und Tage mit **< 48 der 96 Dateien**: Signal für alle
  Symbole undefiniert (`tagUndefiniert`, P2c–P2g). Gezählt, **nie interpoliert**; die Zahl der undefinierten Tage steht im Bericht.
- **Nicht im Universum:** Klasse 1 (Abdeckung 67–72 % < 80 %, `ABDECKUNG.md` §f), Klasse 0.

## 3. Größen je Symbol-Tag

| Größe | Formel | Rolle |
|---|---|---|
| `ton` | Mittel von `V1.5Tone[0]` über die Artikel des Tages t mit Stempel ≤ 16:00 ET; **mindestens 3 Artikel**, sonst undefiniert (P2a/P2b) | Rohgröße |
| `n` | Zahl dieser Artikel | nachrichtlich, Tor §6 |
| **G1 `rangTon`** | Rang von `ton` **je Tag im Querschnitt** der definierten Symbole, 0 … 1 (`rangJeTag`; Gleichstände nach Kürzel) | **Hauptgröße 1** |
| `aend` | `ton(t)` − Mittel der letzten **20 definierten** Tages-Töne des Symbols (Tage < t; mindestens 10, sonst undefiniert; `aenderung`, P4) | Rohgröße |
| **G2 `rangAend`** | Rang von `aend` je Tag im Querschnitt | **Hauptgröße 2** |

Der Rang je Tag ist **invariant gegen Niveau-Verschiebung und Skalierung** (P3a/P3b) — nötig, weil das Ton-Niveau zwischen
Jahren bricht (2018 Kl. 2 −0,45, 2025 +0,06; `ABDECKUNG.md` §d; Fehlerform „Skalen"). Genau **zwei registrierte Hauptgrößen**;
alles andere (Ton-Niveau, Artikelzahl, Anteil negativ, Anteil spät) ist nachrichtlich und trägt kein Urteil.

## 4. Portfolio und Haltedauer

- **Portfolios je Signaltag t** (nur Symbole mit definierter Größe; mindestens **20** definierte Symbole, sonst fällt der Tag für die
  Größe weg, Zahl ausgewiesen): **Long-Uni** = oberstes Dezil (⌈m/10⌉, mindestens 2) gleichgewichtet gegen das gesamte definierte
  Universum gleichgewichtet; **L-S** = oberstes gegen unterstes Dezil.
- **Einstieg:** Schluss von t (Tagesschluss aus Minuten = Eröffnung der 16:00-Kerze, `tageskerzen`-Regel; im Panel `bSchluss`).
  **Ausstieg:** Schluss des H-ten Handelstags nach t. **Haltedauern registriert: 1, 3, 5 Handelstage**; **21 nachrichtlich**
  (Brücke zur Machbarkeit, kein Urteil). Rendite je Papier = Π(1 + `rendite`/100) über die H Panel-Tage nach t; Tote und Lücken
  nach der Regel von `halte` (Insolvenz/Zwangs-Delisting = Totalverlust, Lücke = Kasse zu null).
- **Nachrichtlich:** Einstieg zur **Eröffnung von t + 1** (= Haltekonvention der Maschine, `halte`: Eröffnung(a) → Eröffnung(aEnde)),
  weil ein Artikel mit Stempel 15:59 ET zum Schluss nicht realistisch handelbar ist; Differenz zur Hauptzeile ausweisen.
- **Überlappung:** tägliche Signaltage mit H-Tage-Perioden überlappen ⇒ se nach **Hansen-Hodrick** (Rechteck, Lags 1 … H − 1;
  `momente(paare, H)` aus `statistik.js`, Zeitindex = laufende Handelstagsnummer). Für H = 1 ist das die naive se.

## 5. Kosten vor dem Urteil

- **Hürde je Umlauf** aus **einer Stelle** (`konfig.js → huerdeVon`, Spannen-Studie): Klasse 2 **0,0647 Pp**, Klasse 3 **0,0449 Pp**
  (P5a–P5c; Hinweis: der Auftragstext nennt 0,085/0,065 — das sind die Hürden der Klassen 1/2 des Prüfstands; die Konfig gilt).
- **Kosten je Periode (aus dem Lauf):** je Portfolio-Seite die Umschichtung von der Tranche t − H auf die Tranche t, beide Seiten
  gezählt: Kosten = 2 × `umschlagKosten(T, w_{t−H}, w_t, t)` (0,5 × Σ|Δw| × Hürde der Klasse des Papiers). Obergrenze = **ein Umlauf**
  je Periode (Long-Uni) bzw. **zwei** (L-S). Das Universum trägt nur seine Mitgliedswechsel (≈ 0). **Netto = brutto − Kosten**;
  **das Urteil fällt nur netto.** Gepoolt: Mischhürde nach Klassenanteil, in der Vorprüfung 0,0624 Pp.
- **Vorab (aus §8):** die **nötige Bruttokante** je Periode, um die Hürde zu schlagen, ist bei Long-Uni 0,065 (Kl. 2) / 0,045 (Kl. 3) /
  0,062 (gepoolt) Pp, bei L-S das Doppelte — unabhängig von H, weil jede Periode ein Umlauf ist; je Tag also Hürde/H.

## 6. Tore

**Maschinentore (Lauf ungültig, wenn eines fällt):** Orakel je Tag bestanden (§7), Placebos ≈ 0 (§7), Leck-Klinke 0 Verstöße
(Prüfstand-`Sicht` ohne Schlüssel **und** `tagesSignal`), Positivkontrolle beider Klinken > 0. **Abdeckungstor:** je Jahr und Klasse
≥ 80 % der Universumsmitglieder mit ≥ 5 Artikeln im Monatsmedian (Regel Nr. 44), sonst ist die Klasse in dem Jahr „nicht messbar".
**Vorprüfungstor (§8):** die Paar-sd des Zufallsdezils im Lauf liegt innerhalb **Faktor 1,5** der Werte aus `vorpruefung.json`.

**Kantentore:** Testzahl **12** = 2 Größen × 3 Haltedauern × 2 Portfolios (Universum gepoolt 2–3; Klassen getrennt nachrichtlich).
`belegt` nur, wenn **alle** gelten:
1. Δ̄_netto > 0 **und** Δ̄_netto ≥ MDE₈₀ (= 2,8016 × se_HH, ausgewiesen **vor** dem Blick auf Δ̄; dazu MDE₈₀ an der Schwelle = 3,8416 × se_HH);
2. **t_HH ≥ 3** (strenger als z_Bonf(12) = 2,865, P6a);
3. **Entdeckung/Bestätigung getrennt:** Entdeckung = ungerade Kalenderjahre, Bestätigung = gerade; **Tor 1:** Entdeckung ≥ 4 ×
   Bestätigungs-MDE₈₀, sonst wird die Bestätigung nicht gerechnet; Urteil aus der Bestätigung;
4. **Jahresscheiben** (Kalenderjahr von t) ausgewiesen; **Aktualitäts-Tor:** die letzten **250** Signaltage im Mittel netto nicht negativ;
5. Belegstand-Regel `wiki/belegstand.md`: Protokoll trägt `bestaetigt` **und** Placebo bestanden — nie aus Prosa.

Sonst „nicht belegt: nichts oberhalb von <MDE₈₀> Pp je Periode". **Kein Nachlegen:** keine andere Artikelschwelle, kein anderes
Fenster, keine andere Haltedauer, kein Ausschluss von Symbolen nach dem Blick auf die Zahlen; neue Ideen bekommen eine neue
Vorregistrierung.

## 7. Kontrollen (Schranken vorab)

| Kontrolle | Bau | Schranke (Soll) |
|---|---|---|
| **Placebo 1 (Zukunft)** | dieselbe Größe, aber jedem Tag t die Artikel des Tages **t + 21 Handelstage** zugeordnet — gelesen über `Sicht` **mit** Orakelschlüssel, als Placebo deklariert; 12 Ziehungen nur bei Placebo 2, hier eine Reihe | \|Mittel brutto\| < **0,02 Pp** je Periode **und** \|t_HH\| < 3 |
| **Placebo 2 (Permutation)** | Symbolzuordnung der Töne **je Tag** permutiert (Zahl definierter Symbole bleibt); **12** Ziehungen, Saat `nachrichten-stimmung-tage-2026-09-19#k`, `fnv`/`mulberry32` | \|Mittel über 12\| < **0,02 Pp**; höchstens **3** von 12 mit \|t_HH\| ≥ 3 |
| **Orakel** | Rang nach dem **Vorzeichen der künftigen H-Tage-Rendite** (Schluss t → Schluss t + H, `Sicht` mit Schlüssel); Δ = Gewinner − Verlierer | Δ̄_brutto ≥ **2,5 / 4,0 / 5,0 Pp** (H 1/3/5), t_HH ≥ **8** |
| **Nullpunkt** | Zufallsdezil gegen Universum, 5 Ziehungen (= §8) | \|Mittel\| / se < **3** in jeder Zelle (P7b, Positivkontrolle P7c) |
| **Kursloses Signal** | Größe aus Zufall ohne Kurs- und Textbezug (Saat) | wie Nullpunkt |
| **Leck-Klinken** | Prüfstand-`Sicht` ohne Schlüssel: 0 Verstöße; `tagesSignal` mit Stempel t + 1: wirft | 0 / > 0 |

Fällt eine Kontrolle: **melden, nicht reparieren**; Zahlen trotzdem berichten, gekennzeichnet; `belegt` ist dann ausgeschlossen.

## 8. Vorprüfung der Auflösung — gerechnet, ohne Stimmung (`vorpruefung.js`, `vorpruefung.json`)

Panel v2.1 (9.904.017 Zeilen, 7.338 Reihen), **2.428 tägliche Signaltage** 2017-01-03 … 2026-08-31, Klassen 2 und 3 getrennt und
gepoolt, Zufallsdezil (⌈n/10⌉, 5 Ziehungen, Saat `nachrichten-stimmung-tage-2026-09-19`) gegen Universum und oben gegen unten,
Haltekonvention der Maschine (Eröffnung t+1 → Eröffnung t+1+H), HH-se mit Lag H − 1, MDE₈₀ = 2,8016 × se. Klasse 3 hat an **663
Tagen** (vor 2020) unter 20 Papiere und fällt dort weg. Nullpunkt: Mittel in allen 18 Zellen ≈ 0 (max |Mittel|/se 0,8; P7b).

**Tafel (Pp je Periode; Dezil gegen Universum):**

| Klasse | H | Tage | n/Tag | Paar-sd | se_HH | **MDE₈₀ Boden ×1** | **×2** | **×4** | Hürde Long-Uni | MDE₈₀ L-S ×1 | Hürde L-S | Literatur E₁ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | 1 | 2.428 | 185 | 0,51 | 0,010 | **0,029** | 0,058 | 0,116 | 0,065 | 0,043 | 0,129 | 0,10 |
| 2 | 3 | 2.428 | 185 | 0,87 | 0,018 | **0,050** | 0,100 | 0,199 | 0,065 | 0,075 | 0,129 | 0,10 |
| 2 | 5 | 2.428 | 185 | 1,11 | 0,022 | **0,063** | 0,126 | 0,252 | 0,065 | 0,093 | 0,129 | 0,10 |
| 3 | 1 | 1.765 | 43 | 1,21 | 0,029 | **0,080** | 0,161 | 0,322 | 0,045 | 0,118 | 0,090 | 0,10 |
| 3 | 3 | 1.765 | 43 | 2,05 | 0,050 | **0,140** | 0,279 | 0,559 | 0,045 | 0,208 | 0,090 | 0,10 |
| 3 | 5 | 1.765 | 43 | 2,63 | 0,059 | **0,167** | 0,333 | 0,667 | 0,045 | 0,264 | 0,090 | 0,10 |
| 2+3 | 1 | 2.428 | 221 | 0,47 | 0,010 | **0,027** | 0,053 | 0,107 | 0,062 | 0,040 | 0,125 | 0,10 |
| 2+3 | 3 | 2.428 | 221 | 0,80 | 0,017 | **0,047** | 0,094 | 0,187 | 0,062 | 0,070 | 0,125 | 0,10 |
| 2+3 | 5 | 2.428 | 221 | 1,03 | 0,020 | **0,057** | 0,113 | 0,227 | 0,062 | 0,083 | 0,125 | 0,10 |

MDE₈₀ an der Schwelle t ≥ 3 (3,8416 × se): gepoolt 0,037 / 0,064 / 0,078 (H 1/3/5). Letzte 250 Tage (Aktualitäts-Tor, ab 2025-09-03):
gepoolt 0,077 / 0,134 / 0,158 — dort ist der Boden allein schon über der Hürde. Jahresscheiben 2017–2026 (H = 1, Kl. 2): MDE 0,07–0,12.
Der HH-Faktor liegt beim Zufallsdezil bei 1,0 (unabhängige Ziehungen); ein **echtes, träges** Signal erzeugt Überlappungs-
Autokorrelation bis √H — auch das steckt in der Spanne ×2–4, nicht im Boden.

**Urteil je Klasse (ein Satz):**
- **Klasse 2:** Bei H = 1 liegt der Boden (0,029) und sein Doppeltes (0,058) unter Hürde (0,065) und Literatur (0,10) — das Design
  **kann die Frage auflösen, wenn der Faktor ≤ 3 bleibt** (0,087 < 0,10); bei ×4 (0,116) und bei H = 5 ab ×2 nicht mehr: **ja, knapp, nur H = 1 sicher.**
- **Klasse 3:** Der Boden (0,080 bei H = 1) liegt **schon über der Hürde (0,045)** und ×2–4 (0,16–0,32) über jeder Literaturgröße —
  **nein**, Klasse 3 allein kann die Frage nicht auflösen (43 Papiere je Tag, 663 dünne Tage).
- **Gepoolt 2+3:** wie Klasse 2 (0,027 / 0,053 / 0,107 gegen 0,062 und 0,10): **ja, knapp bei H = 1** — deshalb ist das gepoolte
  Universum die Urteilszelle, die Klassen getrennt nachrichtlich.

## 9. Datenbau-Plan (nicht ausgeführt)

- **Was:** GKG-Vollstrom 2017-01-01 … 2026-08-31 (3.530 Tage × 96 Dateien = 338.880 Dateien) im Fluss zählen wie Nr. 44
  (`gkg-zaehlen.js`: Spalten 2, 15, 16 behalten, Namensvergleich Stufe „voll"), Namenskarte auf die **Vereinigung der Monats-
  Universen 2017–2026 der Klassen 2–3** erweitern (Nr. 44 hatte 998 Kürzel für zwei Stichtage; die Vereinigung ist zu zählen, geschätzt
  600–900 Kürzel ohne Medienliste).
- **Durchsatz und Laufzeit (aus Nr. 44: 455 Tage = 237 GB gezippt, 7,9 Prozess-Stunden, 4 Teile):** 3.530 Tage ⇒ **≈ 1,8 TB gezippt**
  (≈ 190 GB je Jahr gemessen 2025, ältere Jahre kleiner), **≈ 61 Prozess-Stunden**; mit 4 Teilen ≈ 15 h Wand, mit 8 Teilen ≈ 8 h —
  **2–3 Nächte** (à 7 h, per `schtasks`, nie aus der Claude-App; Rechner darf nicht ausgehen). Nichts wird gespeichert außer dem Extrakt.
- **Ablage je Symbol-Tag** (`voll/<jahr>.json` oder eine Zeile je Symbol-Tag): `ton` (Mittel ≤ 16:00 ET), `n` (≤ 16:00 ET),
  `nSpaet`, `tonAlle`, `letzterStempel`; **je Tag:** `dateien` (0–96), `fehlend`. Größe ≈ 800 Kürzel × 2.430 Tage × 60 B ≈ **120 MB**.
  Kennung `nachrichten-stimmung-tage-2026-09-19/gdelt/v1`, Zähler wie Nr. 44 (Dateien gefunden/fehlend/Fehler, Zeilen, Treffer).
- **Risiken:** (1) Block-Ausfälle — 2025-06-15…07-01 bekannt (12 Handelstage undefiniert); weitere Blöcke 2017–2024 unbekannt, der
  Zähler `dateien` je Tag findet sie; 2018 Q1 hatte 6,2 % Streu-Lücken ohne Blocktag. (2) Namensfehler 2,4–4,6 % (Kl. 2/3 voll,
  Nr. 44) — ohne Medienliste, sonst Verdacht bis 66 %; Handprüfung 100 Treffer je Jahr wie Nr. 44. (3) Übersetzungsstrom: der Zähllauf
  wies 0,0 % übersetzt aus — zu prüfen, ob das Feld leer ist statt „keine"; nicht-englische Artikel nachrichtlich getrennt zählen.
  (4) Ton-Niveau bricht zwischen Jahren — durch den Rang je Tag abgefangen, aber ein Bruch **innerhalb** eines Tages (Quellenmix)
  nicht; Anteil je Quelle nachrichtlich. (5) Universumsdrift: Kürzelwechsel (Nr. Teil 3 `kuerzelwechsel.js`) müssen in der
  Namenskarte je Monat stehen.

## 10. Was Wilhelm entscheiden muss

1. **Freigabe** dieser Vorregistrierung (oder Änderung) — danach wird nichts mehr entschieden, nur gerechnet.
2. **Datenbau:** 2–3 Nächte GDELT-Vollstrom über `schtasks` (≈ 1,8 TB Durchsatz, 120 MB Ablage) — ja/nein, und in welchen Nächten.
3. **Literaturzahl:** Ke/Kelly/Xiu-PDF öffnen und die Long-Short-Tagesrendite nachschlagen — oder E₁ = 0,10 Pp als Arbeitsannahme
   freigeben (sie entscheidet nichts, sie ordnet die Tafel ein).

## 11. Was die Tafel nicht weiß

Dividenden fehlen (Kursrenditen; Teil 2: Universum 1,73 %/Jahr, für 1–5 Tage ≤ 0,01 Pp); Nebenerwähnungen (≈ 4 von 20, Machbarkeit);
Sammelmeldungen (ein Artikel nennt viele Firmen — zählt für jede; keine k-Schwelle registriert, Anteil nachrichtlich); Crawl ≥
Veröffentlichung (konservativ: Signal nie zu früh, oft zu spät — ein Teil der 16:00-ET-Artikel ist am Markt schon Stunden bekannt);
Klasse 1 und Klasse 0 nicht im Universum.

---

*Entwurf geschrieben 2026-09-19, vor jeder Stimmungszahl. Nur Lesezugriff auf das Panel. Simulation, keine Anlageberatung.*
