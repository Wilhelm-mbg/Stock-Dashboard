# Analytiker-Befund, Nacht auf den 26.08.2026 (erster Lauf)

Geprüft: Wächterprüfungen A–C und E, vertiefter Block D (Kanten/Vorregistrierungen).
F-Rotation beginnt nächste Nacht mit der Kontrollgruppen-Konstruktion (A7-Lesefenster).

## A. Code gegen Protokoll — 1 Fund (klein)

Stand der Protokolle (`studien/messmaschine/protokolle/`, je Strategie die Variante mit
dem stärksten Bestätigungs-t, exakt die Auswahllogik der App aus `depot.js`):

| Kante | Urteil | je Signal | t | Datum |
|---|---|---:|---:|---|
| rsi2seit | nicht-entscheidbar | +0,021 Pp | 0,83 | 25.08. |
| kapitulation | nicht-bestaetigt | +1,071 Pp | 2,14 | 25.08. |
| rsi2seit-mcp | nicht-bestaetigt | +0,053 Pp | 2,01 | 25.08. |
| momentum | nicht-entscheidbar | +2,020 Pp | 1,28 | 25.08. |
| übrige 8 | nicht-entscheidbar/nicht-messbar | | | |

**Kein Protokoll sagt „bestaetigt".** Die dynamischen Anzeigen (PROTOKOLL_KANTE,
triggerBelegstand, protokollZeile) bilden das korrekt ab — die Gruppe „Belegt
(Protokoll sagt bestätigt)" ist heute leer, Grün gibt es nur bei Protokoll-Urteil
„bestaetigt". Das ist sauber.

**Fund:** Mehrere *sichtbare* Texte nennen die Intraday-Regeln trotzdem „belegt" —
die überholte Formel („zwei validierte Kanten") lebt in der Prosa weiter, gegen
Regel 1 des Struktur-Plans („Belegstand aus Protokollen, nie aus Prosa"):

- `index.html:890` Knopf **„Belegte Voreinstellungen übernehmen"** (+ `strategien.js:187`
  Protokolleintrag „Belegte Voreinstellungen übernommen", `depot.js:5932` Verweis).
- `depot.js:609` Erklärtext: „Bei der **belegten** Intraday-Regel …"
- `depot.js:3376` Tabellenfuß: „**Belegte** Intraday-Kanten: nur Not-Stop …"
- `depot.js:5985` Sicherungs-Protokolltext: „Die **belegte** Kante war auf …"

Erwartet wäre „gemessene" (so nennt es der Tooltip desselben Knopfes selbst).
→ Issue „Analytiker: Oberfläche nennt Kanten ‚belegt', kein Protokoll sagt bestätigt".

## B. Placebo-Lauf — bestanden

Eigenes Signal ohne jeden Kursbezug (jede 41. Kerze, `placebo-strategie.js`) direkt
durch `messmaschine.js` (nicht über messen.js — kein Protokoll im App-Datenordner):
2.874 Werte, 730 Handelstage, 334.717 Signale. **Überschuss −0,0077 Pp, t = −0,10,
MDE 0,148 Pp, Urteil nicht-entscheidbar.** Nullpunkt liegt auf null.
Protokoll: `analytiker-placebo-2026-08-25.json`.

Notiert (kein Fund, bekannte Grenze): SP3 aus dem Ablehnungsentscheid
Überlebensverzerrung — `placeboLauf` lässt `schritt = 1` still zu; bei breit
feuernden Sonden ist der Placebo dann identisch mit dem Signal. Abhilfe steht dort
beschrieben, Reparatur gehört einer Bausitzung.

## C. Live gleich Messung — bestanden

- Store der installierten App (`depot.json`): mode rsi2seit, 60m, period 20, ema,
  confirmBps 15, scalpHold 480 (= 8 Kerzen), instrument basis, kapiZusatz an,
  regimeZuteilung an — deckt sich mit den Messmodulen.
- ZTHR-Verdacht geprüft und **ausgeräumt**: `zOf(15) = 2,0` gegen `ZTHR: 1,5` im
  rsi2seit-Messmodul sieht nach Abweichung aus, aber der rsi2seit-Auslöser
  (`quant.js:1760–1792`) benutzt ZTHR gar nicht (rsiExtremSignal + Kanal + Volumen,
  alle fest). Für kapitulation, wo ZTHR eingeht, misst das Modul mit 2,0 = zOf(15) = live.
- Kerzenzahl-Sperre (≥ 261) in `depot.js:2534` vorhanden; Testsuite (2074
  Zusicherungen, inkl. Live-=-Messung-Invarianten) grün auf HEAD (v8.33.0-6-g8142ada).

## D. Kanten-Neuberechnung — keine frischen Tage

Archiv endet 24.08. = „bis" aller Protokolle vom 25.08.; null neue Handelstage seit
der gestrigen Vollmessung, Neuberechnung wäre eine Wiederholung. Vorregistrierungen:
Überlebensverzerrung ist ein abgeschlossener Ablehnungsentscheid (nichts fällig),
quartalsschub-betrag/monatswende-breit sind eingelöst (Protokolle 25.08.),
rsi2seit-mcp V4 ist noch nicht vorregistriert (offener Auftrag des Studien-Strangs).
Nichts hat seine vorregistrierte Datenmenge erreicht, ohne beurteilt zu sein.

## E. Annahmen-Drift — 1 Fund (klein) + Stand

- Kostenmessung Demo-Konto: erst **1 Runde** (0,042 %) seit 25.08. — weit vor den
  ~20 Runden fürs Urteil, keine Aussage. Spannen-Proben: 102.
- **Fund:** Alle **2.885 von 2.885** Reihen des 60m-Archivs auf E: enden mit einer
  **laufenden Kerze mit Quote-Stempel** (z. B. A: …14:30, 15:30, 16:30, dann
  **16:57:27**; Abruf mitten in der Sitzung vom 24.08.). Mitten in den Reihen: **0**
  krumme Stempel (Aktualisierung ersetzt sauber). `tools/yahoo-60m-holen.js`
  übernimmt Yahoos letzten (laufenden) Balken ungeschnitten; `messmaschine.js`
  lädt `series` unbeschnitten und `reiheKaputt` prüft keine Stempel. Damit enthält
  die Messbasis je Reihe eine unfertige Kerze und einen Teil-Handelstag, dessen
  „letzte Kerze des Tages" (F3-Schlüssel der A7-Kontrolle) eine 12:57-ET-Momentaufnahme
  ist. Größenordnung heute: ≤ 1 Kerze von ~5.000, ≤ 1 Tag von 730 — numerisch
  vernachlässigbar, aber exakt die Fehlerklasse „Stempel-Kerzen der Quelle"
  (App-seitig 23.08. behoben), neu eingeschleppt über den Archiv-Pfad, und sie
  wandert mit jedem Abruf auf den jeweils jüngsten Tag.
  → Issue „Analytiker: 60m-Archiv endet in laufender Quote-Stempel-Kerze".

## Maßstäbe dieses Laufs

Placebo: 334.717 Signale, über 730 Tage geclustert, MDE ausgewiesen (0,148 Pp),
1 Test, keine Varianten. Archiv-Zählung: Vollerhebung (2.885 Reihen), kein Sampling.
Keine Kante neu beurteilt (keine neuen Daten — ein „unklar" wäre hier eine Wiederholung
des gestrigen Protokolls gewesen, keine neue Information).
