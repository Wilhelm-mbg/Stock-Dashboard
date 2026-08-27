# Vorregistrierung — Skalen-Diagnose gegen den Ereignis-Zeugen: je Reihe, nie pauschal. NICHTS SCHREIBEN.

**Stand:** 27.08.2026 mittags, vor jedem Rechenschritt; Fassung 2 — die Erstfassung
(Muster-Rückrechnung) wurde VOR ihrem Commit durch den Analytiker-Befund überholt:
Der `massive.key` schaltet Splits/Dividenden frei, und die fünf Streitreihen zeigen,
dass **»ein Archiv ist rückangepasst, das andere nicht« als pauschale Richtung falsch
ist** (RGR: 60m kaputt · WHLR/BYND: 1d kaputt · SITC: Ereignis fehlt in den Endpunkten ·
B: zwei Firmen unter einem Kürzel). **Rolle:** Berechnungen (Archiv-Seite und
Urteils-Gerüst); die ~132 Ereignis-Abrufe macht der Analytiker (PM-Zuteilung,
Abstimmung läuft). **Wilhelms Auflage unverändert: messen, ausweisen, vorlegen —
kein Kurs wird angefasst.**

## 0. Die Frage, neu

Je Kandidaten-Reihe (Skalenwechsel-Verdacht): **Was sagt der Ereignis-Datensatz
(Split/Dividende, Datum + Faktor), und welches Archiv stimmt damit überein?** Ein
Split ist ein belegtes Ereignis, kein erratenes Muster — damit entfallen drei der vier
Tüftler-Bedenken (keine Rückwärtsschau, keine Auswahl nach Zielgröße, Schnittlänge
irrelevant); das vierte (»der Sprung kann echt sein«) beantwortet der Zeuge selbst.

## 1. Instrumente (Archiv-Seite, meine)

**I1 Sprung-Enumerator** (aus Fassung 1, unverändert): je Reihe alle Sprünge mit
Faktor ≥ 2 bzw. ≤ 0,5 (Datum, Faktor, Richtung), Pendel-Paare (|Produkt−1| ≤ 0,10,
Fenster 30) mit Zonengrenzen. Liefert je Kandidat die Abgleichs-Liste für den Zeugen.

**I2 Quote-Drift-Diagnose** (neu — trennt Skalenfall von Ticker-Neuvergabe): über die
1d/60m-Überlappung das tägliche Verhältnis r_t = Schluss_1d/Schluss_60m; je Segment
zwischen Sprüngen: Median und relative Spannweite von r_t. **Konstant** (Spannweite
≤ 1 %) ⇒ Skalen-Versatz (reparabel-artig); **driftend** (> 5 %) ⇒ Verdacht
Ticker-Neuvergabe/zwei Firmen ⇒ **Trennfall, keine Reparatur** (Auflage 3);
dazwischen: unentschieden. Schwellen hiermit vorab fixiert.

**Wächter vor jeder echten Zählung:** W1 Positivkontrolle — 50 synthetische Pendel
(Speicherkopien, Seed 20260827) müssen grenzgenau gefunden werden (50/50, sonst
Abbruch); W2 Signalanteil — feuert der Enumerator auf > 2 % der F1-sauberen Reihen,
trennt er nicht (Zwei-Archiv-Zeuge klassifiziert die Feuer im 730-Tage-Fenster).

## 2. Urteils-Gerüst je Reihe (vorab, vollständig)

Eingabe je Kandidat: Sprungliste (I1, beide Archive soweit vorhanden) + Drift-Diagnose
(I2) + **Ereignisliste des Analytikers** (Schnittstelle unten). Ausgänge:

| Befundlage | Urteil |
|---|---|
| **Sprung AM Ereignisdatum** (±1 Handelstag, Faktor ≈ Ereignisfaktor ±10 %) in Archiv A, **kein Sprung** in B | **»A hat die Anpassung verfehlt«** — A ist die kaputte Seite. *(Nachtrag 4: In einem rückangepassten Archiv glättet die Anpassung den Split weg — der Sprung am Split-Datum IST der Anpassungsfehler, nicht der Beleg. Gemessen vom Analytiker: AAPL/NVDA/TSLA, ~12 Splits, 0 Sprünge an Split-Daten.)* |
| Sprung am Ereignisdatum, **Faktor weicht ab** (Datum trifft ±1, \|q/faktor − 1\| > 10 %) | **»teilweise/fehlerhaft angepasst«** (F?-Klasse, Abweichung beziffert) |
| Sprung, KEIN Ereignis an dem Datum, Quote konstant | **»unentscheidbar mit diesen zwei Endpunkten«** (RGR/SITC-Klasse: Archivfehler ODER nicht geführtes Ereignis — nicht raten, Auflage 2) |
| Quote driftet | **»Trennfall«** (B-Klasse: zwei Firmen, gehört geteilt, nicht repariert — Auflage 3) |
| Ereignis vorhanden, **kein Sprung in beiden** Archiven am Datum | **»konsistent angepasst«** (die gesunde Signatur) |

**Nie pauschal (Auflage 1):** Es gibt kein Sammel-Urteil über »die 132«; das Ergebnis
ist eine Tabelle je Reihe. **Nichts schreiben (Auflage 4):** Ausgabe ausschließlich in
diesen Studienordner; jede spätere Reparatur ist Wilhelms Einzel-Entscheid je Reihe
auf dieser Tabelle.

## 3. Schnittstelle zum Analytiker (abgestimmt, damit nichts doppelt läuft)

Er liefert je Kandidat JSON: `{sym, ereignisse: [{datum, art: 'split'|'dividende',
faktor}] , quelle, abgerufen}` — Ablage unter `studien/vorregistrierung-2026-08-27-
skalenfehler/ereignisse/`. Ich konsumiere, gleiche ab, urteile nach §2. Kandidatenmenge
= S1-Liste (132 Wechsler) ∪ meine I1-Funde auf den F1-Verworfenen; Priorität haben die
36 F1-Verworfenen (dort hängt die F1-Zulassungsfrage) und die fünf Streitreihen als
**Eichfälle** (bekannte Antworten — meine Maschine muss RGR/WHLR/BYND/SITC/B exakt so
einordnen wie der Analytiker-Befund, sonst ist das Gerüst widerlegt, bevor es urteilt).

## 4. Sperrliste

Kein Schreiben · keine Reparatur-Empfehlung als Pauschale · kein F1-Umbau aus diesem
Lauf · Spin-off-artige Lücken bleiben »unentscheidbar mit diesen zwei Endpunkten«
(die Endpunkte führen sie nicht — Erweiterung wäre ein eigener Beschluss).

---

## Nachtrag 1 — W1 fand eine Hüllkurven-Grenze des Erkenners (vor jeder echten Zählung)

Der erste Wächterlauf scheiterte 49/50: Bei CIFR (volatiler Wert) wurde das
synthetische Pendel nicht grenzgenau gefunden — Hypothese: die Injektionsstelle traf
einen Tag mit ≥10 % natürlicher Bewegung, die das Produkt-Kriterium (|q1·q2−1| ≤ 0,10)
sprengt. **Festlegungen, ohne den Erkenner anzufassen** (ihn nach dem Wächter zu
weiten wäre Tuning auf den Wächter):

1. **Hüllkurve ausgesprochen — nach dem zweiten W1-Fehlschlag präzisiert (47/50,
   CIFR/HUT/APLD, alle hochvolatil):** Maßgeblich ist das **PRODUKT der natürlichen
   Bewegungen beider Grenztage**, denn es geht direkt in |q1·q2−1| ein — zwei 6-%-Tage
   in gleicher Richtung sprengen die 0,10-Toleranz, obwohl jeder einzeln »ruhig«
   wirkt. Der Erkenner findet Pendel nur, wo dieses Produkt ≤ ~0,10 Abstand zur 1
   hält. Die Deckungslücke wird im Ergebnis beziffert; sie ist eine RECALL-Grenze,
   keine Fehlfeuer-Quelle, und trifft volatile Werte am stärksten.
2. **W1-Stellenbedingung (Verbundkriterium):** Injektionen nur an Stellen mit
   |n1·n2 − 1| ≤ 0,08 auf der UNVERÄNDERTEN Reihe (deterministisch, kein
   Ergebnisblick; 0,08 lässt Marge zur 0,10-Toleranz); verworfene Stellen werden
   geloggt. Soll bleibt 50/50. Die Einzeltag-Fassung (<10 % je Grenze) aus der ersten
   Nachtragsfassung war unzureichend — der zweite Fehlschlag hat es belegt.
3. Für das Urteils-Gerüst ändert sich nichts: Der Ereignis-Zeuge (Datum+Faktor) hängt
   nicht an der Hüllkurve — ein Ereignis-Abgleich findet auch Flips auf bewegten
   Grenztagen; die Hüllkurve begrenzt nur die ereignis-LOSE Enumeration.

## Nachtrag 4 — die Split-Prämisse war invertiert; §2 korrigiert VOR dem Join

Der Analytiker hat gemessen (AAPL/NVDA/TSLA: ~12 Splits, **0** Sprünge an Split-Daten;
WHLR-Positivkontrolle 5 statt 16 — elf wegangepasst): **In einem rückangepassten Archiv
zeigt ein Split-Datum KEINEN Sprung; ein Sprung AM Split-Datum ist der
Anpassungsfehler, nicht der Split.** Meine §2-Zeile 1 trug die alte Prämisse
(»Sprung passt zum Ereignis ⇒ diese Seite stimmt«) — **das Vorzeichen war invertiert**
und ist vor dem Bau des Joins korrigiert (Tabelle oben, neue Fassung). Zusätzlich
aufgenommen: die **F?-Klasse** (Datum trifft, Faktor nicht = teilweise Anpassung) und
der **sechste Eichfall WHLR 03.04.2017** (Sprung r = 8,24 exakt auf belegtem 8:1-Split,
neun Jahre alt) — er prüft, ob das Gerüst auch in alten Archivteilen greift. Der Join
war noch nicht gebaut; keine Zahl ist auf der falschen Prämisse entstanden.

**Nullwert-Pflicht (PM-Auflage):** Jede Quote von Datums-Treffern (Sprung trifft
Ereignisdatum ±1 HT) wird nur zusammen mit dem **Zufalls-Nullwert** ausgewiesen (wie
oft träfe ein Sprung ein Ereignisdatum rein zufällig — der Analytiker liefert ihn);
eine F-Quote ohne Nullwert daneben ist nicht lesbar und wird nicht berichtet.

## Nachtrag 5 — Join-Präzisierungen, VOR dem ersten Join-Lauf fixiert

Nach Sichtung der Ereignis-Dateien (Konventionen), aber **vor jedem Klassifizierungs-
Lauf**. Anlass: PM-Segment-Auflage (WHLR hat nachweislich zu verschiedenen Zeiten
verschiedene kaputte Seiten) und die Eichfall-Geometrie (der sechste Eichfall ist ein
Einzelsprung, kein Pendel).

1. **Einzelsprünge werden mitklassifiziert**, nicht nur Pendel: jeder Faktor-≥2-Sprung
   der Reihe bekommt eine Klasse. Pendel bleiben die Kandidaten-Definition (I1
   unverändert); die Klassifizierung dient dem §2-Urteil, nicht der Kandidatur.
2. **Klassen je Sprung:** `F` (Datum trifft Ereignis ±1 **Handelstag** im Tagesraster
   der Reihe UND |q/faktor−1| ≤ 0,10, auch invers) · `F?` (Datum trifft, Faktor weicht
   ab — beziffert) · `F-ECHO` (Datum trifft nicht, aber Faktor ≈ ein geführter
   Split-Faktor der Reihe — die BYND-Mechanik: Mischung verschieden skalierter Abrufe
   zeigt den Ereignisfaktor an ereignisfremden Daten) · `U` (kein Ereignis-Bezug;
   Tick-Spalte Kurs < 1 $ wird mitgeführt).
3. **VERZUG-Klasse für den Rand:** Liegt ein Ereignis NACH dem letzten Balken des
   einen Archivs, aber vor/auf dem letzten Balken des anderen, und die Rand-Quote ≈
   Ereignisfaktor, ist das **Anpassungs-Verzug der älteren Seite** (die Rückanpassung
   fehlt ihr noch) — messbar an den letzten Balken beider Archive, keine Reparatur-
   Aussage. Erwartung: WHLR-Rand (Split ×4 heute 27.08., Quote ≈ 4).
   *Eich-Iteration 1 (~13:15, nach Eichung 7/9):* Ein heute ausgeführter Split liegt
   nach dem letzten Balken BEIDER Archive und ist trotzdem in die 1d-Historie
   eingebacken (Abruf nach Ausführung wirkt rückwirkend). Fenster korrigiert: VERZUG
   prüft Splits nach dem letzten 60m-Balken mit Toleranz +5 Kalendertage über den
   1d-Rand hinaus; für den Datums-Treffer bekommt ein Split jenseits des Rasters den
   virtuellen Index »letzter Balken + 1«, damit der Rand-Sprung (WHLR 26.08.,
   q ≈ 1/4) als F zählt. Urteilslogik unverändert.
   *Präzisierung ~13:05 (Analytiker-Rohkurs-Befund, vor dem Lauf):* Jedes
   Segment-Urteil trägt **»gilt für <Zeitraum>, Konvention <roh|rückangepasst>«** —
   Massive adjusted=true bäckt selbst HEUTE ausgeführte Splits in die Historie, eine
   Seite kann also konsistent-roh und die andere rückangepasst sein, ohne dass eine
   »falsch« ist; kaputt ist nur eine IN SICH gemischte Seite. Am WHLR-Rand erwartet:
   60m konsistent-roh (VERZUG), 1d-Historie ×4 mit möglichem rohen Rand-Balken
   (26.08.) — läge er so im Archiv, fände der Join dort einen F-Sprung.
4. **Segment-Pflicht (PM-Auflage):** Das Urteil fällt **je Sprung/Segment**, die
   Reihen-Zeile ist nur Zusammenfassung; Reihen mit zeitlich gegenläufigen Befunden
   (alte F-Sprünge der 1d-Seite UND Rand-Verzug der 60m-Seite o. ä.) bekommen das
   Flag **»gegenläufige Segmente«** — beide Archive haben an der Reihe gearbeitet.
5. **Lokaler Nullwert (provisorisch):** E = nSprünge · nSplitTage · 3 / nHandelstage
   je Reihe wird neben jeder Treffer-Zahl gedruckt; der unabhängige Analytiker-
   Nullwert (aus dem 275er-Lauf) ersetzt ihn im Endbericht.
6. **ETF-Vorbehalt:** Massive-Split-Abdeckung für ETFs ist unbelegt (DFEN-Fall des
   Analytikers). Alle aktuellen Kandidaten sind Aktien; bei S1-Erweiterung wird die
   Wertpapierart je Zeile ausgewiesen und ETF-Zeilen tragen »Abdeckung unklar«.
7. **Eichfall-Erwartungen, vor dem Lauf ausgesprochen:** BYND = Versatz + Sprünge
   F/F-ECHO ≈ 30 (1d mischt Skalen) · WHLR = **beides**: Sprung 03.04.2017 r 8,24 →
   `F` (×8) UND Rand-Quote ≈ 4 → `VERZUG` (Split ×4 vom 27.08. nach letztem
   60m-Balken) + Flag gegenläufig — der Eichfall prüft damit genau die
   Segment-Fähigkeit · RGR (0 geführte Splits) = Versatz ohne Ereignis-Beleg →
   »unentscheidbar mit diesen zwei Endpunkten« (die Seite kennt nur der externe
   Massive-Zeuge des Analytikers) · SITC = Segmentgrenze ohne passendes Ereignis →
   unentscheidbar (Spin-off nicht in den Endpunkten) · B und QXO = TRENNFALL
   (I2-Drift; dritter Zeuge ticker_change 2025-05-09 / 2024-06-06 als Annotation) ·
   ARWR/BYRN/ASTH (PM-Neubewertung nach Semantik-Drehung) = Erwartung `U`: die
   geführten Splits (×10 bzw. keine) passen weder Datum noch Faktor der alten
   Pendel — sie bleiben »unentscheidbar«, werden also weder »harmlos« noch
   »Anpassungsfehler« genannt.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
