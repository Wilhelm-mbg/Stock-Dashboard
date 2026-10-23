# Momentum-Buch zur Wiedervorlage 23.11.2026 — echte Kosten, IBKR, Maßstab Nasdaq-100 nach Steuer (Auftrag Nr. 122, 23.10.2026)

**Beobachtung, kein Beleg.** Rückblick auf einen Korb (187 umsatzstärkste bzw. breiter Markt), zwei Fenster, je ein Schub. Alles Simulation
mit virtuellem Kapital, keine Anlage- und keine Steuerberatung.

## Fragestellung
1. Was kostet ein Rundlauf des Buchs wirklich, wenn statt pauschal 20 Bp je Seite (0,40 Pp) die **gemessene Kassa-Spanne je Umsatzklasse**
   (Kassa = Fenster `mitte`; Eröffnung = mitte × Eröffnungsfaktor der Klasse) und die **IBKR-Gebühr** (IBKR Ireland, Fixed und Tiered) angesetzt
   werden — je Klasse und Positionsgröße (Kapital / 19 Plätze; 100.000 $, 50.000 €, 10.000 €)?
2. Wie verschiebt sich der gesiegelte Rückblick (Nr. 96, Panel v2.3, Regel K) mit diesen Kosten — Abstand am ersten Starttag, Median der
   63 Startphasen, Rückschlag, Umschichtungen und Kosten je Jahr?
3. Wo steht der Maßstab Nasdaq-100 mit Dividenden (QQQ) in beiden Fenstern, brutto und nach deutscher Steuer, gegen das Buch nach Steuer
   (S&P 500 nachrichtlich)?
4. Welcher UCITS-Nasdaq-100-ETF wäre der handelbare Maßstab bei IBKR (US-ETFs sind für EWR-Privatkunden ohne KID gesperrt)?
5. Wiedervorlage-Tabelle für den 23.11.2026.

## Dateien
| Datei | Inhalt | Aufruf |
|---|---|---|
| `kosten.js` | Kostenmodell (Klassen, IBKR Fixed/Tiered, Umtausch), Tabelle je Klasse × Positionsgröße → `kosten.json` | `node studien/momentum-wiedervorlage-2026-10-23/kosten.js` |
| `rechnen.js` | Rückblick mit neuem Kostenmodell über den gesiegelten Rechner (`kleinst.js` → `korb.js` → `rueckblick.js` → `mfhandel.js`, alle nur geladen); ersetzt zur Laufzeit nur `MH.fuehreAus` durch eine Kopie der Hülle mit k je Handel; **erst bitgleich bei 20 Bp, dann umschalten** → `ergebnis.json` | `node --max-old-space-size=6144 studien/momentum-wiedervorlage-2026-10-23/rechnen.js` (≈ 4,5 min) |
| `massstab.js` | QQQ und SPY aus Minutenbalken + Ausschüttungen (brutto, 63 Startphasen), Buch und Fonds nach Steuer mit `steuer.js` aus Nr. 82 (nur geladen) → `massstab.json` | `node --max-old-space-size=6144 studien/momentum-wiedervorlage-2026-10-23/massstab.js` |
| `ERGEBNIS.md` | Tabellen, Beobachtung, Grenzen, Wiedervorlage-Tabelle | — |
| `quellen.md` | alle URLs mit Abrufdatum und alle Fundstellen im Repo | — |

## Annahmen
- **Ausführung:** der Rückblick handelt zum **Eröffnungskurs** des Ausführungstags (`korb.js`/`rueckblick.js` Schritt 3: `preise = bEroeffnung`).
  Die Eröffnungslage ist deshalb die zum Rückblick passende; die Kassa-Lage beschreibt ein Buch, das im Tagesverlauf handelt (das App-Buch
  kaufte am 25.08.2026 um 18:15 UTC, Belegstand Nachtrag Nr. 81).
- **Spanne:** volle notierte Spanne je Umlauf, je Seite die Hälfte; Werte ab 2021 (maßgeblich laut `wiki/kosten.md`) auch für das Fenster
  2017–2021 (dort waren die gemessenen Spannen kleiner: 0,1107 / 0,0477 / 0,0289 / 0,0222 — für Fenster A ist die Annahme vorsichtig).
  **Schlupf** ist nicht getrennt modelliert: die gemessene Spanne ist die Füllung am Quote ohne Marktwirkung; Wilhelms „~0,10 Pp inkl. Schlupf"
  entspricht der Kassa-Lage des Korbs 187 (0,10–0,11 Pp je Rundlauf). Marktwirkung (Tiefe) ist nicht gemessen.
- **Klasse je Wert und Tag:** Median `umsatz` der letzten 20 Panel-Zeilen bis zum Stichtag; unter 5 Mio $ gilt die Spanne der Klasse 5-50 (gezählt).
- **IBKR-Gebühr:** echte Stückzahl über den rohen Kurs (bereinigter Eröffnungskurs × rohSchluss / bSchluss), Fixed: max(0,005 $ × Stück, 1 $),
  höchstens 1 % des Werts; Tiered: max(0,0035 × Stück, 0,35 $), höchstens 0,5 %, plus Börse 0,0030 (Entnahme, Markt-Order), Clearing 0,0002,
  Pass-Through; beide: CAT 0,000003 je Stück, beim Verkauf SEC 0,0000206 × Wert, TAF 0 (Gebührenpause bis 31.12.2026). Gebühren von heute
  für alle Jahre.
- **Positionsgröße:** der Rückblick rechnet mit 100.000 $ Start; 50.000 € und 10.000 € (× 1,1205) werden über die Skalierung der festen
  Gebührenteile gerechnet (Gebühr in Buchwährung = Gebühr der echten Größe × 100.000 / Kapital) — gleichwertig zu einem Buch mit kleinerem Start,
  bis auf die Rundung der Stückzahl auf vier Stellen. Bruchstücke sind bei IBKR für US-Aktien handelbar (Seite: gleiche Provision).
- **Umtausch EUR→USD:** einmalig 2 $ Mindestgebühr (0,002–0,018 Pp des Kapitals) — nicht in den Läufen, nur in der Tabelle; bei Nachschüssen je
  Umtausch wieder mindestens 2 $.
- **Steuer:** Modell Nr. 82 unverändert (Satz 26,375 %, Teilfreistellung 30 %, Vorabpauschale mit Basiszins je Jahr, 2017 Annahme 0,59 %),
  **Sparer-Pauschbetrag (1.000 € je Person) genannt, nicht angerechnet**; Dollar wie Euro (kein Wechselkurs); Verlustverrechnung Aktien nur mit
  Aktien (Aktien-Verlusttopf), Ausschüttungen netto. Der Steuerrechner kennt nur einen Kostensatz je Seite: eingesetzt ist der effektive Satz des
  Laufs aus `rechnen.js` (gezahlte Kosten / Volumen); der Fehler dieser Näherung steht vor Steuern daneben. Regel K über eine schlichte Hülle.
- **Nasdaq-Fonds:** Kurs QQQ (enthält QQQ-Kosten 0,20 %), Ausschüttungen zu 85 % wieder angelegt (Quellensteuer im irischen Fonds),
  Zusatzkosten = TER des UCITS-ETF − 0,20 % (Xtrackers 0,20 % → 0); bei iShares/Invesco (0,30 %) rund 0,1 Pp p. a. weniger. Keine Kauf- und
  Verkaufskosten des Fonds.
- **Daten:** Panel v2.3 Bau 2c wie Nr. 96; QQQ aus `alpaca1m/QQQ` (roh, kein Split im Zeitraum), Ausschüttungen `alpaca-massnahmen/QQQ.json`;
  im Tagesarchiv `archiv1d` gibt es **keine** Reihe QQQ (Hinweis des PM geprüft). Gegenprobe: SPY auf demselben Weg gegen den SPY-Maßstab des Panels.
- `lagebild.json` liegt nicht unter `Markt-Dashboard-Daten/` → Vorwärtstest als Platzhalter mit Anleitung (ERGEBNIS.md, letzte Tabelle).
