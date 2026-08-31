# Vorregistrierung — Erste Messung des News-Sentiments (Übernachtertrag)

**Stand:** 31.08.2026, ~20:30. **Rolle:** Arbeitssitzung, Einzelauftrag.
**Familie:** `news-sentiment-erstmessung`, **testsGesamt = 1** (nur der
Übernacht-Endpunkt bekommt ein Urteil). Schwelle zweiseitig α = 0,05, |t| ≥ 1,96 —
ohne Bonferroni-Aufschlag, weil nur EIN Test angemeldet ist.

## 0. Die eine Frage

**Sagt der Sentiment-Score den Übernachtertrag voraus — ja, nein, oder nicht messbar
mit diesen Daten?** Kein Kanten-Urteil, keine Gewichtungs-Empfehlung, keine
Reparatur-Vorschläge für `sentiment()`.

## 1. Machbarkeit — VOR der Anmeldung gerechnet, und sie entscheidet bereits

Gezählt auf der Kopie des Stores (`store-kopie/`, 17 Dateien), Score mit der echten
`Q.sentiment()`:

| Größe | Wert |
|---|---|
| Symbole im Archiv | 17 |
| Meldungen gesamt | 337 |
| Zeitspanne | 10.08.–21.08.2026 (12 Kalendertage, 10 Werktage) |
| Symbol-Tage mit ≥ 1 Meldung bis Schluss | 44 |
| **davon Score ≠ 0** | **35** |
| davon mit verändertem Schlagzeilen-Fenster | 33 |
| Zeitpunkte (Tage mit ≥ 1 frischer Beobachtung) | 10 |
| Beobachtungen am 21.08. allein | 16 von 33 |
| Meldungen am 21.08. allein | 232 von 337 |
| Vorzeichen | 28 positiv / 5 negativ |

Streuung des Übernachtertrags (Eröffnung(T+1)/Schluss(T) − 1), gemessen auf den
letzten 260 Handelstagen derselben 17 Werte aus `archiv1d`: **sd tagesbereinigt
1,830 Pp** (4.420 Symbol-Tage; roher Median je Symbol 1,732 Pp). Das ist reines
Rauschmaß — es wurde kein Zusammenhang zu irgendeinem Score angesehen.

**MDE** (zweiseitig, α 0,05, Power 80 %, Faktor 2,8016):

| Rechnung | MDE | in Kostenhürden (0,10 %) |
|---|---|---|
| Zweistichprobe 28 pos / 5 neg | 2,489 Pp | **24,9 ×** |
| Einstichprobe n = 33 (alle als unabhängig) | 0,893 Pp | **8,9 ×** |
| je Tag geclustert, n = 10 Zeitpunkte | 0,893 Pp | **8,9 ×** |

Für eine Kante in Größe der Kostenhürde bräuchte es **2.629 unabhängige
Symbol-Tage**. Vorhanden sind 33, verteilt auf 10 Zeitpunkte, davon die Hälfte an
EINEM Tag.

**Damit ist die Sperre gezogen: Die Frage ist mit diesen Daten strukturell nicht
beantwortbar. Das Urteil lautet »nicht messbar« und steht VOR jedem Blick auf den
Zusammenhang fest.** Es kann durch keine Zahl aus dem Lauf mehr gedreht werden —
weder in die eine noch in die andere Richtung.

## 2. Anordnung (angemeldet, damit sie wiederholbar ist, wenn das Archiv einmal trägt)

- **Beobachtung:** (Symbol, Handelstag T) mit Score ≠ 0 bei Schluss T.
- **Score:** `require('../../quant.js').sentiment(fenster, nowMs)` — die **echte**
  Funktion, kein Nachbau. `nowMs` = Handelsschluss T (16:00 New York, Sommerzeit
  über `Q.usSommerzeit`). `fenster` = die 12 jüngsten Schlagzeilen mit Stempel
  ≤ Schluss T — genau das, was `getSymbolNews()` live liefert (`depot.js`: höchstens
  12 Feed-Einträge je Abruf).
- **Endpunkt:** Übernachtertrag T→T+1 = Eröffnung(T+1)/Schluss(T) − 1, in Pp, aus
  `archiv1d` (Feld 5 = Eröffnung), **tagesbereinigt** (Querschnittsmittel des Tages
  über alle 17 Archivsymbole abgezogen) — sonst misst der 21.08. mit seinen 16
  Beobachtungen nur den Markttag.
- **Primärzahl:** Steigung b der Regression tagesbereinigter Übernachtertrag auf
  Score; t **je Tag geclustert** (n = Zahl der Zeitpunkte), nicht je Symbol-Tag.
- **Entscheidungsregeln:** R1 »sagt voraus« bei |t| ≥ 1,96 UND MDE ≤ Effekt;
  R2 »sagt nichts voraus« bei |t| < 1,96 UND 90-%-Band ganz innerhalb ±MDE;
  **R3 »nicht messbar«, wenn die MDE die Kostenhürde um mehr als das Dreifache
  überschreitet — was nach §1 bereits feststeht.**

## 3. Pflicht-Kontrollen (laufen trotz feststehendem Urteil mit)

1. **Placebo:** Titel zwischen den Symbol-Tagen permutiert, **Saat 20260831**,
   200 Ziehungen. Erwartung: null. Zahlen in DIESELBE Tabelle wie die echten.
2. **Positivkontrolle:** synthetischer Übernachtertrag = 0,50 Pp × Score + Rauschen
   (sd 1,830 Pp, dieselbe Saat). Das Geschirr MUSS die 0,50 wiederfinden (±30 %),
   sonst ist ein Nullbefund ein totes Werkzeug und kein Befund.
3. **Look-ahead:** für jede Beobachtung wird geprüft und gezählt, dass **kein**
   Stempel > Schluss T in den Score eingeht. Ein einziger Verstoß hält den Lauf an.

**Warum trotz §1 gerechnet wird:** Die Punktschätzung wird **ausschließlich
nachrichtlich** berichtet, in derselben Tabelle wie Placebo und Positivkontrolle,
und trägt kein Urteil. Sie zeigt, dass das Geschirr steht — nicht, was der Markt tut.

## 4. Bekannte Verzerrungen — etikettiert, nicht wegdiskutiert

- **Auswahl:** Das Archiv enthält nur Symbole, die die App beobachtet hat — 17
  Groß-Tech-Werte plus XOM. Keine Zufallsstichprobe, kein Querschnitt.
  **GOOG und GOOGL sind dieselbe Firma** — zwei Zeilen, eine Beobachtung.
- **Stempel:** `archiviereNews` schreibt `it.t || Date.now()`, also die `pubDate` des
  Feeds, ersatzweise den **Abrufzeitpunkt**. Wo die pubDate fehlte, ist der Stempel
  ein Abrufstempel und damit systematisch **später** als das Erscheinen.
- **Beobachtungsfenster:** Das Archiv sieht Meldungen nur, während die App lief.
  232 der 337 Meldungen tragen den 21.08. — das ist Abrufverhalten, nicht Nachrichtenlage.
  Seit dem 21.08. wurde nichts mehr archiviert (Stand-Feld der Dateien).
- **Deckel 400** je Symbol: nicht erreicht (größte Datei deutlich darunter), also
  hier folgenlos.

## 5. Sperrliste

Kein Kanten-Urteil · keine Empfehlung zum News-Gewicht von 35 % · keine Änderung an
`quant.js` oder `depot.js` aus diesem Lauf · Ergebnis nur in diesen Ordner · der
Store wird **nur gelesen**, gearbeitet wird auf `store-kopie/` und `archiv-kopie/`.

---

## Nachtrag 1 (31.08.2026, ~20:55, NACH dem Lauf) — die Positivkontrolle war nie erfüllbar

**Offen deklariert: dies ist eine nachträgliche Änderung an einer Kontrolle, nicht am
Endpunkt.** Endpunkt, Entscheidungsregeln und das Urteil aus §1 bleiben unverändert.

Die in §3.2 angemeldete Positivkontrolle (ein Zug, Wiederfindung ±30 %) lieferte
**+1,477 statt +0,50** und hätte den Lauf als »totes Werkzeug« abgestempelt. Die
Nachprüfung zeigt, dass **die Regel selbst der Fehler war**:

| Form | Ergebnis | Deutung |
|---|---|---|
| rauschfrei, y = 0,50 · Score | **0,500000** | Geschirr rechnet exakt richtig |
| ein Zug mit Rauschen (angemeldet) | +1,477 | außerhalb ±30 % |
| Mittel aus 2.000 Zügen | **+0,5024 ± 0,0230** | unverzerrt, bestanden |

Ein Einzelzug streut mit **sd 1,027 Pp/Punkt**; **nur 11,5 % aller Züge** treffen die
eingebaute 0,50 auf ±30 %. Die angemeldete Regel war bei dieser Anordnung also mit
88,5 % Wahrscheinlichkeit ein Fehlalarm — eine Prüfung, die nicht bestehen KANN, ist
so wertlos wie eine, die nicht durchfallen kann. Ein Einzelzug löste erst ab einem
eingebauten Effekt von **9,59 Pp/Punkt** sicher auf.

**Festlegung:** Die Positivkontrolle besteht künftig aus der rauschfreien Form
(prüft das Geschirr) UND dem Mittel vieler Züge (prüft die Unverzerrtheit). Der
Einzelzug bleibt in der Tabelle stehen, aber ohne Urteilskraft.

**Und er ist selbst ein Befund:** dass die Anordnung einen eingebauten Effekt vom
Fünffachen der Kostenhürde nicht wiederfindet, ist die anschaulichste Bestätigung
der Blindheit aus §1.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
