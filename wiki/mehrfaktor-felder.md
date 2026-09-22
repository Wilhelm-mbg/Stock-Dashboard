---
tags: [strategie, studien]
---
# Mehrfaktor-Studie: welche Felder in Frage kommen (Prüfung des PM, 22.09.2026)

Wilhelms Auftrag: die Mehrfaktor-Studie vorbereiten, je Feld einen Agenten — vorher prüfen, welche Felder relevant wären.
Diese Seite ist die Prüfung. Maßstab je Feld: (1) gibt es eine belastbare Literatur mit Größenordnung, (2) haben wir die Daten
**punkt-in-Zeit**, (3) passt der Horizont zur Monatsbasis, (4) was haben wir selbst schon gemessen.

**Vorab die wichtigste Regel:** Die Felder der Kombination werden **jetzt, aus der Literatur** gewählt — nicht später aus unseren
Einzelergebnissen. Wer die Felder nach dem Messen aussucht, hat die Kombination an die Daten angepasst; dann gilt Bonferroni
über alles, was je gemessen wurde, und die Kante ist weg (Fehlerform der großen Signalstudie). Die Einzelmessungen je Feld sind
**Bau- und Nullpunktprüfungen** (Orakel, Placebo, Leck-Klinke, MDE), keine Auswahl.

**Zweite Regel:** Veröffentlichte Kanten zerfallen. McLean/Pontiff (2016) messen über 97 Anomalien etwa ein Viertel Zerfall außerhalb
der Stichprobe und gut die Hälfte nach Veröffentlichung. Die Literaturzahlen unten sind also Obergrenzen; realistisch ist die Hälfte,
und davon geht die Kassa-Hürde je Umlauf ab (Klassen 1–3: 0,085 / 0,065 / 0,045 Pp).

## 1. Die Felder

| # | Feld (Wilhelms Komponente) | Maß je Symbol und Monat | Literatur, Größenordnung Long-Short je Monat, vor Kosten | Daten bei uns | Schon gemessen | Empfehlung |
|---|---|---|---|---|---|---|
| 1 | **Momentum** (Marktlage, mittelfristig) | Rendite Monate −12 … −2 | Jegadeesh/Titman 1993, ≈ 1 Pp; Einbrüche 2009, 2020/21 | Panel v2.1 | Teil 3: +2,1 Pp brutto, gegen Universum +1,1 (t 2,3), allein nicht aufgelöst | **Runde 1** |
| 2 | **Kurzfrist-Umkehr** (Marktlage, kurz) | Rendite Monat −1, gedreht | Jegadeesh 1990, ≈ 1 Pp, aber umschlagsstark → Kosten fressen den Großteil | Panel | nein (nur `k1Umkehr` als Prüfstand-Rangfunktion) | Runde 1, **nur als Kostenfrage** |
| 3 | **Niedrige Schwankung** | Streuung der Tagesrenditen über 12 Monate, gedreht (oder Beta) | Frazzini/Pedersen 2014 (BAB), Ang et al. 2006; ≈ 0,5–0,7 Pp | Panel | nein | **Runde 1** |
| 4 | **Größe** | Marktwert = Aktien (Tafel, punkt-in-Zeit) × Kurs | Banz 1981; heute schwach, eher Liquiditätsprämie | Tafel `aktien` (105.265 Zeilen) × Panel | nein; Klassen sind Umsatz, nicht Größe | Runde 1 als **Kontrollgröße**, kein Signal |
| 5 | **Bewertung** (Fundamente) | Eigenkapital / Marktwert, Gewinn / Marktwert | Fama/French 1992 (HML ≈ 0,3–0,4 Pp); seit 2007 lange tot, 2021–22 zurück | Tafel `eigenkapital`, `netto`, `aktien` | nein | **Runde 1** |
| 6 | **Ertragskraft** (Fundamente) | Bruttogewinn (Umsatz − Umsatzkosten) / Vermögen; ROA | Novy-Marx 2013 (≈ 0,3–0,5 Pp, robust auch bei Großen) | Tafel `umsatz`, `umsatzkosten`, `vermoegen` | Teil 4 nur bedingt („gedrückt, aber liefert": Nein) | **Runde 1** |
| 7 | **Investition / Vermögenswachstum** (Fundamente) | Vermögen / Vermögen Vorjahr − 1, gedreht | Cooper/Gulen/Schill 2008, Fama/French 2015 (CMA ≈ 0,3 Pp) | Tafel `vermoegen`, `vermoegenVor` | nein | **Runde 1** |
| 8 | **Gewinnüberraschung / Nachlauf** (Ausblick) | SUE: Quartalsgewinn − Vorjahresquartal, geteilt durch Streuung der letzten 8 Quartale; Signal ab `filed` | Bernard/Thomas 1989 (PEAD ≈ 0,5–1 Pp über 2–3 Monate), eine der robustesten | Tafel `quartale` D0…D7, `filed` | nein (Teil 4 maß fm, nicht SUE) | **Runde 1** |
| 9 | **Fundamental-Momentum** | ROA − ROA Vorjahr (`fm`) | Novy-Marx 2015 | Tafel `fm` (135.156 Zeilen) | Teil 4 bedingt | Runde 1, **nachrichtlich neben 8** (überlappt) |
| 10 | **Innovation: F&E-Intensität** | F&E-Aufwand / Umsatz und / Marktwert | Chan/Lakonishok/Sougiannis 2001 (≈ 0,5 Pp für F&E-starke Werte); Hirshleifer/Hsu/Li 2013 brauchen Patente | Tafel `fue` (50.918 Zeilen; nur wer F&E ausweist) | nein | **Runde 1** — erstes Innovationsmaß |
| 11 | **Verschuldung / Notlage** | (Vermögen − Eigenkapital) / Vermögen | Campbell/Hilscher/Szilagyi 2008: Notlage zahlt **negativ** | Tafel | nein | Runde 1 als **Kontrollgröße** |
| 12 | **Branchen-Momentum** | Rendite der Branche (SIC-Sektor) Monate −12 … −2 | Moskowitz/Grinblatt 1999 | Tafel `sektorVonSic` × Panel | nein | Runde 2 (überlappt mit 1) |
| 13 | **Nachrichten-Stimmung, monatlich** (Marktlage) | Mittel des Tages-Tons je Monat aus dem GDELT-Rohauszug | Tetlock 2007 (Tage!); monatlich schwach belegt | Nr. 47 baut | Nr. 45 registriert (Tagesdesign) | Runde 2, **nur nach** Nr. 45 |
| 14 | **Insider-Käufe** (Ausblick) | Netto-Käufe von Vorständen/Direktoren je Monat (Form 4) | Lakonishok/Lee 2001, Cohen/Malloy/Pomorski 2012 (≈ 0,5–1 Pp, „opportunistische" Insider) | EDGAR Form 4 frei, **nicht gebaut** (Insider-Karte der App zeigt nur an) | nein | Runde 2, eigener Datenbau (Server) |
| 15 | **Textänderung im Geschäftsbericht** (Ausblick, Innovation) | Ähnlichkeit 10-K zu Vorjahr, gedreht („Lazy Prices") | Cohen/Malloy/Nguyen 2020 (≈ 0,6 Pp) | EDGAR-Volltext frei, **nicht gebaut**, ohne Modell rechenbar | nein | Runde 2, eigener Datenbau (Server) |
| 16 | **Leerverkaufsquote** | Short Interest / Aktien | Boehmer et al. 2008, negativ | FINRA frei ab 2013, **nicht gebaut** | nein | Runde 3 |
| 17 | Analystenschätzungen, Optionen, 13F | — | belastbar, aber Daten nicht frei / nicht punkt-in-Zeit | nicht verfügbar | — | **nein** |

Nicht als Feld tauglich: Trendkanäle, Formationen, Intraday-Signale, Übernachtdrift — alle gemessen, alle Nein (Belegstand).

## 2. Was „Runde 1" heißt — und was nicht

Runde 1 = **neun Felder, alle aus vorhandenen Daten** (Panel v2.1 + Fundamentaltafel), Monatsbasis, Klassen 1–3, Haltedauer 1 Monat
(Momentum-Umschlag 32 %, Kosten 0,026 Pp je Monat), Signaltag = erster Handelstag des Monats, Bilanzdaten nur mit `filed` vor dem
Signaltag (Leser wirft sonst). Je Feld ein Agent, der **die Faktorzelle baut und den Nullpunkt prüft** — nicht „eine Kante findet":
Orakel-Positivkontrolle, Placebo (Datum +21 Tage, Symbole permutiert), Leck-Klinke, MDE₈₀, Kosten, Jahresscheiben. Ergebnis je
Feld ist eine Datei im gemeinsamen Format (unten), damit die Kombination mechanisch ist.

**Die Kombination ist Runde 1b, eine eigene Vorregistrierung:** gleichgewichtete Ränge über die **vorab festgelegten** Felder
1, 3, 5, 6, 7, 8, 10 (Signale), mit 4 und 11 als Kontrollgrößen und 2 nur als Kostenfrage; **eine** Vorhersage (Dezil oben gegen
Universum, netto > 0), Rückhaltefenster 2024-09 … 2026-08 versiegelt. Die Feldwahl steht **hier**, vor jeder Messung. Änderungen
danach sind Nachträge mit Datum und Grund.

## 3. Gemeinsames Format der Faktorzelle (jeder Feld-Agent liefert genau das)

`studien/mehrfaktor-2026-09-22/zellen/<feld>.json`: `{ kennung, feld, stand, definition (Formel als Text), signaltage: [{ tag,
werte: { SYM: zahl | null } }], abdeckung je Klasse und Jahr, nullpunkt: { orakel, placebo, leck }, einzelmessung: { dezilUni brutto/netto,
se_HH, t, MDE80, umschlag, kosten }, quellen }`. Werte sind **Rohgrößen** (kein Rang) — der Rang wird in der Kombination je Signaltag
gebildet, damit alle Felder dieselbe Rangregel haben. Ein Feld ohne Wert an einem Signaltag liefert `null`, nie 0.

## 4. Reihenfolge

1. **Vorbereitung (ein Werkzeug-Chat):** gemeinsame Maschine `mehrfaktor/zelle.js` (Panel + Tafel laden, Signaltage, Universum,
   Nullpunkt-Kontrollen, Einzelmessung, Ausgabeformat) + `VORREGISTRIERUNG-KOMBINATION.md` als Entwurf + Auftragsvorlage je Feld.
   Erst wenn diese Maschine mit einem Kunstfeld (Zufall ⇒ 0, Orakel ⇒ groß) grün ist, starten die Feld-Agenten — sonst bauen neun
   Agenten neun Maschinen (Fehlerform „zwei Fassungen einer Regel").
2. **Feld-Agenten parallel** (je eigener Ordner, eigene Übergabe, Zweitleser für die Vorlage einmal statt neunmal).
3. **Kombination** nach Freigabe der Vorregistrierung durch Wilhelm.

Nichts davon ist beauftragt; Wilhelm wählt die Felder.
