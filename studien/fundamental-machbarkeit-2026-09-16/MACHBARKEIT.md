# Fundamentaldaten aus den SEC Financial Statement Data Sets: Machbarkeit (16.09.2026)

**Frage:** Liefern die kostenlosen FSDS-Quartalspakete der SEC punkt-in-Zeit brauchbare Bilanzdaten für das
7.299-Reihen-Panel (Bruttoprofitabilität, F&E-Intensität, Bilanzwachstum)? **Es wurde nichts gemessen** — nur Deckung,
Fallen und Aufwand. Alle Zahlen kommen aus den Skripten dieses Ordners (`panel.js` → `deckung.js` → `tags.js` →
`pruefung.js` → `bericht.js`); die vollständigen Tafeln stehen in `tafeln.md`, keine Zahl ist von Hand abgetippt.

## Empfehlung in einem Satz

**Taugt — für die Klassen ab1000, 250-1000 und 50-250 ohne Einschränkung, für 5-50 mit einer Lücke von rund 15 %,
für unter5/dünn nur mit Vorbehalt.** Assets sind praktisch vollständig (99,7–100 % der Reihen mit Bericht), Umsatz
97–99 % (liquide Klassen), die Aktienzahl ist der Engpass (81–91 %). Die drei Fallen (Einreichungsdatum, Neudarstellung,
Tag-Wildwuchs) sind alle real und alle **mit Regeln beherrschbar**, keine erfordert eine kostenpflichtige Quelle.
Der Vollausbau 2016–2026 kostet ≈ 4 GB Download, unter einer Stunde Rechenzeit und ≈ 20 MB Fundamentaltafel.

## 1. Die Quelle (Aufbau, aus den zwei Roh-Quartalen dokumentiert)

Roh unter `E:/Markt-Dashboard-Archiv/edgar-fsds/<quartal>/` (2019q2: 90 MB ZIP → 483 MB; 2024q2: 119 MB → 607 MB).
Vier Tab-Tabellen mit Kopfzeile, Leser `fsds-lesen.js` (streamt num.txt, 3,4 Mio Zeilen in 5 s):

| Tabelle | Zeile je | Schlüssel und Datumsfelder |
| --- | --- | --- |
| `sub.txt` (7.233 / 7.676 Zeilen) | Einreichung | `adsh` Akzession (Schlüssel), `cik` Registrant, `form`, **`period` = Bilanzstichtag** (auf Monatsende gerundet!), **`filed` = Einreichungsdatum** (ab hier öffentlich), `accepted` Zeitstempel, `fy`/`fp`, `afs` Filer-Status, `prevrpt` (später geändert), `sic` |
| `num.txt` (2,8 / 3,4 Mio) | Zahl | `adsh`, `tag`, `version` (us-gaap/2023, ifrs/2023, dei/…, = `adsh` bei firmeneigenen Tags), **`ddate`** (Periodenende der Zahl, gerundet; bei Vergleichszahlen älter als `period`), `qtrs` (0 Bestand, 1 Quartal, 4 Jahr), `uom`, `segments` (leer = Konzernwert), `coreg`, `value` |
| `tag.txt` | (tag, version) | `custom`, `datatype`, `iord` (Bestand/Dauer), `crdr`, Text |
| `pre.txt` | Darstellungszeile | `stmt` (BS/IS/CF…), `tag`, `plabel` — zeigt, was die Firma als „Umsatz" ausweist |

Formulare je Quartal: 10-Q 5.385 / 5.406, 10-K 998 / 1.033, 20-F 365 / 503, dazu /A-Änderungen (≈ 230) und Prospekte.
Abrufweg: `https://www.sec.gov/files/dera/data/financial-statement-data-sets/<jjjj>q<n>.zip`, Quartale 2009q1 bis 2026q2
vorhanden (2026q3 noch 404), ein Abruf je Quartal, User-Agent mit Kontakt.

## 2. Deckung gegen das Panel

Panel: 7.299 Aktienreihen (CS/ADRC aus `_lebenszeit.json`, wie die Grundstudie), CIK für 7.222 (2.283 lebende über die
SEC-Tickertabelle, 4.939 verschwundene über die Volltext-Zuordnung — davon 1.003 „schwach"; 77 ohne CIK). Aktiv im
Quartal (hatte Kurse): 3.982 (2019q2) / 3.700 (2024q2). Umsatzklasse wie im Prüfstand: Median des Dollar-Umsatzes der
60 Handelstage vor Quartalsbeginn, mindestens 40 davon; „dünn" = weniger als 40 Umsatztage (das sind keine jungen,
sondern totgehandelte Reihen: AATC 0 Tage). Klassen geprüft an AAPL 9,7 Mrd $, JPM 1,4 Mrd $, GE 0,8 Mrd $ (2024).

**Erwartung des PM („ab1000 nahezu vollständig, 50-250 lückenhaft") — gemessen:** ab1000 97–100 %, 250-1000 94,5 %,
50-250 86–89 %, 5-50 84–88 %, unter5 79 %, dünn 60–73 % der aktiven Reihen haben im Quartal einen periodischen Bericht.

| Klasse | aktiv 19 / 24 | period. Bericht | Umsatz¹ | Vermögen¹ | Aktienzahl¹ | KERN² (an aktiv) | Brutto³ (Nicht-Finanz) | F&E gemeldet³ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ab1000 | 17 / 39 | 100 % / 97 % | 100 / 97 % | 100 / 100 % | 94 / 87 % | 94 / 85 % | 100 / 94 % | 93 / 84 % |
| 250-1000 | 128 / 219 | 94,5 / 94,5 % | 98 / 99 % | 100 / 100 % | 81 / 84 % | 77 / 80 % | 65 / 74 % | 47 / 47 % |
| 50-250 | 610 / 698 | 86 / 89 % | 98 / 97 % | 100 / 100 % | 84 / 87 % | 72 / 77 % | 72 / 74 % | 37 / 38 % |
| 5-50 | 1.365 / 1.374 | 84 / 88 % | 94 / 91 % | 100 / 100 % | 85 / 89 % | 69 / 73 % | 69 / 66 % | 39 / 43 % |
| unter5 | 1.207 / 818 | 79 / 79 % | 88 / 81 % | 100 / 100 % | 88 / 91 % | 62 / 61 % | 55 / 55 % | 51 / 61 % |
| dünn | 655 / 552 | 60 / 73 % | 74 / 45 % | 100 / 100 % | 76 / 65 % | 36 / 31 % | 58 / 42 % | 47 / 45 % |
| **gesamt** | **3.982 / 3.700** | **79 / 84 %** | **90 / 85 %** | **100 / 100 %** | **84 / 85 %** | **63 / 65 %** | **64 / 64 %** | **44 / 47 %** |

¹ Anteil der Reihen mit Bericht, Tag mit Wert zum Bilanzstichtag. ² Umsatz + Vermögen + Aktienzahl im selben Quartal.
³ Reihen mit Bericht außerhalb SIC 6000–6799; Brutto = Umsatz UND Umsatzkosten; F&E fehlt meist wirklich (kein F&E),
Novy-Marx setzt fehlendes F&E auf null — das ist keine Datenlücke.

**Wer fehlt in den liquiden Klassen** (2024q2, 87 Reihen ab 50 Mio $ mit CIK, aber ohne Bericht): 27 ADR/ausländisch
(ASML, BHP, BIDU, BILI, ARGX — 20-F/40-F liegt außerhalb des Quartals, sonst nur 6-K), 41 lebende US-Reihen ohne jede
Einreichung im Quartal (AEM, BCE, ALC, AER — kanadische/irische Emittenten, 40-F/20-F jährlich), 13 verschwundene mit
CIK-Wechsel durch Umstrukturierung (APA, ABC → COR), 6 mit anderer Einreichung (S-1, 8-K), aber keinem Bericht.
**Ein Quartal ist eine Untergrenze:** wer jährlich einreicht (20-F/40-F) oder ein Geschäftsjahr per April hat, taucht
in einem rollierenden 4-Quartals-Fenster auf — aber mit bis zu 12 Monaten Stand.

**Unabhängige Zählung (frames-API, Assets zum 31.03.):** 2.514 von 2.532 FSDS-Treffern bestätigt (99,3 %), 2.551 von
2.575 (99,1 %). Die 18/24 „nur FSDS" sind Fremdwährungs-Filer (CP, SONY, HMC, VOD), die nicht im USD-Frame stehen. Die
275/305 „nur Frame" zerfallen in 101/100 **später eingereicht** (Vergleichszahl im nächsten 10-K — der Frame ist nicht
punkt-in-zeit), 153/168 anderer Stichtag im Quartal (abweichendes Geschäftsjahr) und 21/37 ohne Filing im Quartal.

**Handprobe gegen EDGAR** (`companyconcept`-API, gleiche Akzession, 5 Firmen je Quartal, eine je Klasse: AAPL, ABBV/AAL,
A, AAOI, ABUS): **20 von 20 Werten** (Umsatz und Assets) stimmen auf den Dollar, Einreichungsdatum identisch.

## 3. Die Fallen (alle gemessen)

1. **Punkt-in-Zeit.** `filed − period`: 10-Q Median 39 Tage (p10 30, p90 45–46), 10-K Median 91–92 (p90 114–117),
   20-F/40-F Median 116–117. Panel liquide: Median 26–33, p90 31–44; unter5/dünn p90 81–110. Über alle periodischen
   Berichte liegen 29 % über 45 Tagen, 18–20 % über 90. **Eine Kennzahl, die am Bilanzstichtag ins Ranking geht, sieht
   im Mittel 5–6 Wochen in die Zukunft** — bei 10-K drei Monate. Regel: nutzbar ab dem ersten Handelstag NACH `filed`
   (`accepted` trägt die Uhrzeit; nach 17:30 ET angenommene Filings zählen ohnehin erst am Folgetag). 1–2 Fälle mit
   negativem Abstand je Quartal (Übergangsberichte) → Plausibilitätsfilter `filed ≥ period`.
2. **Monatsend-Rundung.** FSDS rundet `period` und `ddate` auf das Monatsende (Apple 30.03. → 31.03.). Für die
   Quartalszuordnung harmlos, für jede Verknüpfung mit dem Original ±7 Tage Toleranz nötig (die Handprobe fiel zuerst
   genau daran).
3. **Neudarstellungen.** Innerhalb eines Quartals tragen 1.856 / 1.528 Schlüssel (cik, tag, ddate, qtrs) zwei
   Einreichungen; davon **79 / 73 mit verschiedenem Wert (4,3 / 4,8 %)**, 33 / 36 im Panel — 10-K/A-Korrekturen
   (TTNP: 11,96 Mio → 5,69 Mio Aktien einen Tag später), Skalenfehler (I: Assets 23,8 Mio vs 0,5 Mio), Umgliederungen
   (AURC F&E). Über die Zeit (API, 5 Firmen): Assets in 1–3 von 14–19 Bilanzstichtagen später anders (~10 %), Umsatz in
   0–4 von 45–82 Zeiträumen (0–5 %). **Regel: erste Veröffentlichung gilt** — je (cik, tag, ddate, qtrs) den Wert mit
   dem kleinsten `filed` behalten; `companyfacts`/`frames` NIE als Quelle (sie führen den zuletzt eingereichten Wert).
4. **Tag-Wildwuchs Umsatz.** Werte-Sicht (Panel-Einreichungen mit Umsatz, 2019 → 2024):
   `RevenueFromContractWithCustomerExcludingAssessedTax` 39,8 → 51,7 %, `Revenues` 38,8 → 34,0 %,
   `…IncludingAssessedTax` 9,8 → 6,6 %, `InterestAndDividendIncomeOperating` (Banken) 7,9 → 5,4 %,
   `RevenuesNetOfInterestExpense` 1,2 %. **Die Top 3 decken 88–92 %, die Top 5 97–99 %.** `SalesRevenueNet` aus
   dem Auftrag ist tot (0,8 % 2019, 0 % 2024 — aus der Taxonomie gestrichen). Darstellungs-Sicht (erste Umsatzzeile
   der GuV): 76 / 60 verschiedene Tags im Panel, davon **firmeneigen 3,6 / 2,8 %** — die sind ohne Etiketten-Heuristik
   verloren. **Zuordnungstabelle nötig: ja, ≈ 15 Standard-Tags mit Priorität plus die Regel „Zins-Tags nur bei SIC
   6000–6799"** (ohne sie ging „Zinsertrag, netto" von Industriewerten als Umsatz durch — in meinem ersten Lauf
   passiert). Für Umsatzkosten ist der Wildwuchs größer: Brutto-Deckung nur 64–74 % (viele Firmen buchen
   `CostsAndExpenses`, `OperatingExpenses` oder eigene Tags) — dort braucht es ≈ 10 weitere Tags und bleibt lückig.
5. **Aktienzahl.** Die Deckblatt-Zahl `dei:EntityCommonStockSharesOutstanding` steht praktisch nicht in num.txt
   (8 Zeilen in 2024q2). Bleiben `CommonStockSharesOutstanding` (Bilanz) und die gewichteten Aktienzahlen (GuV) —
   Mehrklassen-Emittenten (BRK.A/B, TSM, V, GOOG) melden je Klasse in `segments`, der Konzernwert fehlt. Deckung
   81–91 %; für Marktwert-Nenner (F&E/MW, B/M) ist eine zweite Quelle oder Segment-Summierung nötig.
6. **Ausländische Emittenten** (ADRC, kanadische CS): IFRS-Tags (`ifrs/2023`-Version), Fremdwährung (`uom` CAD/JPY),
   jährlich (20-F/40-F) — eigene Zuordnung und Kursumrechnung, Stand bis 12 Monate alt. Betrifft etwa die Hälfte der
   Lücke in den liquiden Klassen.
7. **CIK-Zuordnung.** 1.003 „schwache" Zuordnungen und CIK-Wechsel bei Umstrukturierungen (APA 2021, Holding-Neubau)
   liegen fast alle in den verschwundenen Reihen; die Deckung der lebenden liquiden Reihen ist davon unberührt.

## 4. Hochrechnung 2016–2026 (42 Quartale, 2016q1 bis 2026q2)

- **Bytes:** ZIP je Quartal 60–119 MB (gemessen 2016q1 95, 2018q1 93, 2019q2 90, 2021q1 98, 2023q1 114, 2024q2 119,
  2025q4 66, 2026q1 85, 2026q2 60) → **≈ 3,8 GB gepackt, ≈ 20 GB entpackt** (Faktor 5,1). Behalten muss man nur
  `sub.txt` + die num-Zeilen der Panel-CIKs mit Zieltags (73–81 Tausend je Quartal, ≈ 5 MB) → ≈ 200 MB; die ZIPs
  bleiben als Beleg auf E: (1,6 TB frei).
- **Zeit:** Download 209 MB in unter 90 s (zwei parallele Abrufe) → ≈ 30 min für alle; Entpacken ≈ 1 min je Quartal;
  Lesen 4–5 s je Quartal → **unter einer Stunde Wanduhr, 42 EDGAR-Anfragen** (Limit 10/s irrelevant). Nachlauf je
  neues Quartal: ein Abruf, ≈ 2 Minuten, die SEC stellt das Paket ≈ 2 Wochen nach Quartalsende bereit (2026q2 liegt
  vor, 2026q3 nicht) — **der Datensatz selbst kommt also mit bis zu 3,5 Monaten Verzug**; für die Aktualität der letzten
  Wochen braucht es zusätzlich die tägliche EDGAR-Volltext-/Index-Abfrage aus `tools/edgar.js` oder `companyfacts` mit
  `filed`-Filter (dort nur für den laufenden Rand, nie rückwirkend).
- **Fundamentaltafel je (Reihe, Quartal):** je Quartal ≈ 3.100–3.300 Reihen mit Bericht → 42 × 3.200 ≈ **135.000
  Sätze** à ≈ 12 Felder (adsh, form, period, filed, umsatz, umsatzkosten, assets, fue, aktien, uom, tagQuelle, marken)
  ≈ 15–20 MB JSON — unter 2 % der Tagestafel des Prüfstands (9,9 Mio Zeilen). Als je Reihe sortierte Liste nach `filed`
  sofort abfragbar.
- **Anbindung an `lesen-panel.js` (nur Vorschlag, kein Code im Prüfstand-Ordner):** eine Datei
  `fundamental/tafel-v1.json` `{ kennung, reihen: { SYM: [ {filed, period, form, umsatz, umsatzkosten, assets, fue,
  aktien, marken}, … ] } }`, sortiert nach `filed`. Der Panelleser bekommt eine Funktion `fundamentalAm(sym, tag)`,
  die den letzten Satz mit `filed < tag` liefert (streng kleiner: nutzbar ab dem Handelstag nach der Einreichung) und
  `null`, wenn der Satz älter als 15 Monate ist (Aktualitäts-Tor, sonst zählen tote Jahresabschlüsse). Die Rangfunktionen
  des Prüfstands (§T2.3-Muster) rechnen dann z. B. Bruttoprofitabilität = (umsatz − umsatzkosten) / assets nur, wenn
  beide Felder da sind, und marken `FUNDAMENTAL_FEHLT` sonst. Neudarstellung: die Tafel enthält je (cik, tag, ddate,
  qtrs) nur die ERSTE Veröffentlichung — das erzwingt der Bauplan beim Zusammenführen der 42 Quartale, nicht der Leser.

## 5. Prüfungen dieser Studie

- Handprobe: 10 Firmen × (Umsatz, Assets) gegen die SEC-XBRL-API — 20/20 gleich (Wert, Stichtag ±Rundung, `filed`).
- Deckung gegen unabhängige Zählung (frames): 99,1–99,3 % der FSDS-Treffer bestätigt, Restfälle erklärt (§2).
- `filed − period`-Verteilung je Form und Klasse: in `tafeln.md`, 20 Stichproben (2 je Klasse und Quartal) gelistet.
- Klassen-Plausibilität an sechs bekannten Werten; Panelzähler identisch mit der Grundstudie (7.299 / 2.303 / 4.996).
- Zwei eigene Messfehler unterwegs gefunden und behoben (Aktienzahl-Datum, Zins-Tag als Umsatz) — beide hätten die
  Deckung in eine Richtung verzerrt; beschrieben in den Kopfkommentaren von `deckung.js`.

## 6. Was das Nein wäre und was jetzt NICHT folgt

Ein „taugt nicht" hätte ausgesehen wie: Assets-Deckung unter 80 % in ab1000, Handprobe mit Abweichungen, oder
`filed` nicht im Datensatz. Nichts davon trat ein. Was NICHT folgt: keine Faktor-Messung, keine Rangfunktion, kein
Vollausbau — der braucht eine Vorregistrierung (Tags mit Priorität, Erst-Veröffentlichungs-Regel, Aktualitäts-Tor,
Umgang mit ADR/IFRS, Aktienzahl-Quelle) und Wilhelms Entscheid, ob die Klassen 50-250 und 5-50 mit 15 % Lücke dabei sind.
