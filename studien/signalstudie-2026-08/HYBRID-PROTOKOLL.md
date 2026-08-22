# Phase 6 — Ist die algorithmische Erkennung die Grenze? Protokoll für einen Blindtest

## Warum das nicht aus Daten beantwortbar ist

Die Frage „erkennt ein Mensch Muster, die der Algorithmus nicht fasst" setzt voraus, dass
menschliche Einstiege *aufgezeichnet* wurden — mit Zeitstempel, Richtung und ohne Kenntnis
des Ergebnisses. Das Projekt hat drei Jahre Kurse und tausende Algorithmus-Signale, aber
**keinen einzigen dokumentierten menschlichen Einstieg unter Blindbedingungen.** Felix' Chart
in #33 („1-Minuten-Takt hätte um 17:00 das Verkaufssignal gegeben") ist ein Beispiel für das
Gegenteil: im Nachhinein auf einem Chart markiert, dessen Fortsetzung bekannt war.

Jede Antwort ohne Blindtest wäre Meinung. Deshalb hier das Protokoll.

## Was der Blindtest misst

Drei Fragen, getrennt:
1. **Trefferquote Mensch vs. Algorithmus** auf denselben Situationen, Überschuss gegen
   dieselbe Kontrolle (Symbol × Tageszeit, leave-one-day-out), t über Tage.
2. **Ergänzung:** Verbessert ein Veto des Menschen die Algorithmus-Signale? (Mensch sieht
   das Algorithmus-Signal und darf es ablehnen.) Misst, ob Hybrid = Algorithmus + Veto trägt.
3. **Ergänzung umgekehrt:** Findet der Mensch Einstiege, die kein Algorithmus meldet — und
   sind die besser als der Zufall?

## Aufbau

- **Situationen:** 200 je Teilnehmer, zufällig aus dem Archiv gezogen (Zufallsgenerator
  außerhalb der Schleife, Seed dokumentiert), stratifiziert: 100 mit Algorithmus-Signal
  (50 long, 50 short, über alle freigegebenen Detektoren), 100 ohne. Teilnehmer weiß nicht,
  welche Gruppe.
- **Anzeige:** Chart bis Zeitpunkt T, **Fortsetzung verdeckt**, Symbol anonymisiert
  („Wert A"), Datum verdeckt. 1m- und 5m-Ansicht, letzte 390 Kerzen (ein Handelstag) plus
  Vortag. Kein Volumen (Quellenproblem), kein Index.
- **Eingabe:** long / short / nichts, dazu Konfidenz 1–3. Zeitlimit 60 s je Situation.
- **Auflösung:** erst nach Abgabe aller 200. Keine Zwischenergebnisse — sonst lernt der
  Teilnehmer die Tagesstruktur der Stichprobe.
- **Teilnehmer:** Felix, Wilhelm, je getrennt. Mindestens 2 Sitzungen an verschiedenen
  Tagen (Ermüdung, Tagesform).
- **Auswertung:** wie jede Studie hier — Überschuss gegen Kontrolle, t über Tage, MDE
  vorab: bei 200 Situationen und SD ≈ 0,45 Pp liegt die Auflösung bei ≈ 0,13 Pp je
  Teilnehmer. Eine Kante unter 0,13 Pp ist damit nicht nachweisbar; das ist vorab bekannt.

## Was ein positives Ergebnis bedeuten würde — und was nicht

Trifft der Mensch besser als der Algorithmus, heißt das: Es gibt Struktur, die die
Detektoren nicht fassen. Dann ist der nächste Schritt nicht „Hybrid einführen", sondern:
**Was sieht der Mensch?** Die 200 Situationen mit Begründung sind dann Trainingsmaterial
für einen besseren Detektor. Ein dauerhaft diskretionärer Einstieg ist in einer Simulation,
die reproduzierbar sein soll, kein Ziel — er ist nicht testbar und nicht skalierbar.

Trifft der Mensch nicht besser, ist die Hybrid-Frage für dieses Projekt beantwortet.

## Umsetzung in der App

Ein Blindtest-Modus im Tab „Trendwechsel": zieht die Situationen aus dem Archiv, zeigt den
verdeckten Chart, speichert Eingaben mit Zeitstempel in `blindtest.json`, wertet nach Abschluss
aus und schreibt das Ergebnis als Studienbeleg. Wird gebaut, sobald Phase 4 abgeschlossen ist
und feststeht, welche Detektoren die Vergleichsbasis bilden.
