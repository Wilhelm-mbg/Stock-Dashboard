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

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
