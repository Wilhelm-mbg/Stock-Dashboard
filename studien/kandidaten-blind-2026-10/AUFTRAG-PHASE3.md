# Gemeinsamer Auftrag Phase 3 — blind festgelegte Regel (04.10.2026)

Wir haben KEINE Kursdaten und rechnen nichts. Gemessen wird später lokal auf dem Archiv. Keine Zahl aus
unseren Daten erfinden. Keine Anlageberatung. Alles Simulation mit virtuellem Kapital.

Gelesen haben musst du: `CLAUDE.md`, `wiki/messmethodik.md`, `studien/massstab-rueckblick-2026-10-04/REGEL.md`
(Aufbau und Zeitablauf), `studien/momentum-korb-2026-10-04/REGEL.md` + `korb.js`, in `mfhandel.js` die Funktion
`momentumZiel` (Zeilen 35–95), `planeUmschichtung`, `fuehreAus`, sowie deine Belegdatei
`studien/kandidaten-blind-2026-10/belege/FAMILIE-<deine>.md` (Quellen und Parameter von dort übernehmen,
Unverifiziertes ([G],[S],[W]) NICHT als gesichert ausgeben; wo ein Parameter nur aus dem Gedächtnis stammt, in
REGEL.md ausdrücklich „unverifiziert" nennen und den Wert aus dem Primärtext nachschlagen, falls du ihn erreichst).

## Rahmen (hart)
Nur Long, kein Leerverkauf, kein Hebel; höchstens ~30 Positionen; Haltedauer mindestens eine Woche (besser ein
Monat+); Universum US-Aktien mit Median-Tagesumsatz ≥ 100 Mio $ oder große US-ETFs; Daten: Tageskurse
(Eröffnung, Schluss, Umsatz), verschwundene Aktien ab 2016, Splits/Ausschüttungen, SEC-Quartalszahlen
(EDGAR Financial Statement Data Sets). Kosten 20 Bp je Seite. Maßstab SPY mit Ausschüttungen.
Parameter aus der Literatur, nicht erfinden, nicht optimieren; wo die Literatur mehrere nennt, VORAB eine festlegen
und begründen (die anderen als „nicht gerechnet" nennen). Ausgeschlossen (schon gemessen): 11-1-Momentum selbst,
Übernachtdrift, Ergebnis-Drift, Supertrend, VWAP/EMA auf Index-ETFs, Trendkanal, Formationen, Kapitulation,
Nachrichten-Stimmung, Mehrfaktor-Rangkombination, Gewinn-Momentum, Minuten-/Stundenregeln.

## Zu liefern (genau in `studien/kandidaten-blind-2026-10/<name>/`)
1. **REGEL.md** (Deutsch, im Aufbau der bestehenden REGEL.md-Dateien: Teil A Regel, Teil B Konstanten mit
   Fundstelle, Teil C Lesarten, Teil D Prüfungen): Universum, Signal, alle Parameter mit Fundstelle, Takt,
   Gewichtung/Mechanik (die der App `planeUmschichtung`/`fuehreAus` ODER „Gleichgewicht" wie in korb.js –
   EINE wählen und begründen), Kosten, Fenster **A 04.01.2017–15.09.2021** und **B 16.09.2021–15.09.2026**,
   **63 verschobene Starttage** (k = 0…62), Zeitablauf wie in der Grundregel (Stichtag = Vortag, Handel zur
   Eröffnung, Ausschüttungen, Reihenende). Wenn der Takt der Literatur nicht 63 Handelstage ist, nenne exakt, welche
   Simulatorgröße (`MH.buchKonfig().halten` bzw. die Taktzählung in korb.js) dafür zu ändern ist — ändere korb.js
   NICHT. **Entscheidregel VORAB**: „schlägt SPY" nur, wenn in BEIDEN Fenstern beim Start am ersten Tag (k=0) vorn
   UND in mindestens 45 von 63 Starttagen vorn (je Fenster) UND Median des Abstands über die Starttage > 0
   (je Fenster); sonst „schlägt nicht" bzw. nenne die Zwischenurteile. **Placebo-Kontrolle**: dieselbe Mechanik,
   dasselbe Universum, dieselbe Zielzahl, Auswahl zufällig mit festem Seed (deterministische PRNG, Seed aus
   Stichtag und festem Wort; implementiere sie in ziel.js als `placeboZiel`); Lesart des Placebos vorab. **Erwartung
   vorab**: welche Größe die Literatur für 2017–2026 nach Kosten erwarten lässt (Spanne, aus deiner Belegdatei,
   ehrlich), wie wahrscheinlich sie sichtbar wird (Streuung der Periodenabstände im Projekt: Standardfehler je
   Periode ca. 3–5 Pp bei 20 Perioden – Auflösung ist die Wand), und was als Fehlschlag gilt. Nenne das Hauptrisiko
   und was das Ergebnis NICHT sagen würde. Hinweis auf bekannte Mechanik-Mängel (Plätze leer, Kleinstpositionen,
   Wiedervorlage Nr. 85 in belegstand.md) gehört in Teil C.
2. **ziel.js** (CommonJS, keine Abhängigkeiten außer `require('../../mfhandel.js')` falls nötig): exportiert
   `zielfunktion(roh, opts)` mit derselben Form wie `momentumZiel(rohMap, opts)`: Eingabe
   `{ KÜRZEL: [[zeitMs, schlussBereinigt, umsatzStück], …] }` (Zeilen aufsteigend; `opts.nowMs` = Stichtag;
   alte Reihen > 7 Kalendertage vor nowMs fliegen raus wie dort), Rückgabe
   `{ ziel, rangfolge, korb, zuWenig, uebersprungen, verworfen }` (mindestens `ziel`, `rangfolge`, `korb`, `zuWenig`;
   `korb` mit `zulaessig`/`geprueft` wie dort, damit korb.js-ähnliche Kontrollen laufen). Dazu `placeboZiel(roh, opts)` mit
   gleicher Rückgabe und `KONFIG` (alle Parameter als Konstanten, kommentiert mit Fundstelle). Kein Blick voraus:
   nur Zeilen bis `nowMs`; Bilanzdaten nur, wenn ihr Einreichungsdatum (+ Karenz laut REGEL) ≤ nowMs. Bilanzdaten über
   `opts.fundamental`: dokumentierte Form im Kopfkommentar von ziel.js UND in REGEL.md (z. B. `{ KÜRZEL: [{ filed: 'JJJJ-MM-TT',
   periodEnde: 'JJJJ-MM-TT', form: '10-Q'|'10-K', werte: { TagName: Zahl } }, …] }`, SEC-Tag-Namen exakt, mit Regel
   für Quartals-Flussgrößen: Summe der letzten 4 Quartale bzw. 10-K, Duplikate/Korrekturen: jüngste Einreichung ≤ nowMs).
   Referenz-/ETF-Handhabung: nenne in REGEL.md, was passiert, wenn ein Kürzel nicht im Panel ist (fehlt ⇒ nicht
   zulässig; zu wenig zulässig ⇒ `zuWenig: true`, nicht handeln). Gleichstand deterministisch (Kürzel aufsteigend).
   Der Simulator (korb.js) kann `momentumZiel` durch `zielfunktion` austauschen; sorge dafür, dass nichts an
   Rückgabeform oder Eingabe abweicht.
3. **test.js** (`node studien/kandidaten-blind-2026-10/<name>/test.js`, ohne Abhängigkeiten, Exit-Code ≠ 0 bei
   Fehler, Ausgabe wie in den vorhandenen test.js): Kunstdaten, an denen JEDE Regelzeile geprüft wird, Sollwerte
   von Hand gerechnet (Rechenweg im Kommentar), inklusive Randfälle: Lücken in der Reihe, zu wenig Werte/zu kurze
   Reihen, Gleichstand, veraltete Reihe, Kurs ≤ 0, fehlende Bilanzdaten, Bilanz erst nach nowMs eingereicht (kein
   Blick voraus, mit Gegenprobe), Placebo ist deterministisch und wählt aus demselben Universum, Zielzahl, Obergrenze
   30 Positionen. Jede Prüfung muss den GRUND prüfen (wenn die Regelzeile ausgebaut wird, muss ein Test rot werden).
   Lass `test.js` laufen, bis alles grün ist; berichte die Zahl der Prüfungen.

## Nicht tun
Nichts an der App ändern, `korb.js`/`mfhandel.js`/andere Studien nicht anfassen, nicht committen, nicht pushen, keine
Issues. Nur den eigenen Ordner schreiben. Keine Kursdaten verwenden oder erfinden.

## Antwort
Fünf Sätze: Regel in einem Satz, gewählte Parameter, Erwartung vorab, offene/unverifizierte Parameter, Testzahl.
