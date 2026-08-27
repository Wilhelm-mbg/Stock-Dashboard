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
| Sprung ↔ Ereignis passt (Datum ±1 Handelstag, Faktor ±10 %) in Archiv A, fehlt/verspätet in B | **»B weicht vom Ereignis ab«** (welche Seite stimmt, mit Beleg) |
| Sprung, KEIN Ereignis an dem Datum, Quote konstant | **»unentscheidbar mit diesen zwei Endpunkten«** (RGR/SITC-Klasse: Archivfehler ODER nicht geführtes Ereignis — nicht raten, Auflage 2) |
| Quote driftet | **»Trennfall«** (B-Klasse: zwei Firmen, gehört geteilt, nicht repariert — Auflage 3) |
| Ereignis vorhanden, beide Archive stimmen | **»konsistent«** (kein Befund) |

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

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
