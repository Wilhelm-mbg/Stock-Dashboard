'use strict';
/* Handschriftliche Einordnung je Szenario; harness.js haengt sie an szenario-<kennung>.md an (Abschnitt "Einordnung"). */
module.exports = {
  a: 'Gegenprobe ohne Befund. Der Takt um 09:35 NY (erster Takt nach "Boersenoeffnung + 5 Minuten") schichtet genau einmal um: 9 Verkaeufe, 9 Kaeufe zur Eroeffnung des Montags, ' +
    'Rangfolge auf den Schluessen von Freitag 20.11. (Journalzeile), Korb 190 zulaessig (zwei Kunstwerte mit zu wenig Umsatz und der Wert mit nur 252 Balken fehlen, der mit genau 253 Balken ist dabei), ' +
    'Zielzahl 19, der letzte Kauf wird mangels Bargeld auf 53,72 Stueck verkleinert, Bargeld danach 0. Von Hand nachgerechnet, mit MFHandel.planeUmschichtung/fuehreAus und von der App: Stueckzahlen auf 1e-3 gleich. ' +
    'Der Freitagspunkt wird um 16:20 NY geschrieben (der erste Takt nach dem Laden, das um 16:15 angestossen wurde) und traegt das Buch VOR der Umschichtung; Montag und Dienstag je ein Punkt.',
  b1: 'Gegenprobe ohne Befund. Solange alle Abrufe null liefern (08:00-12:00), steht auf der Karte "kein Tagesbalken fuer SPY ... kein Handel" (die SPY-Probe schuetzt vor einem Handel ohne Kurs), ' +
    'ab 12:00 wird einmal zur Eroeffnung des Montags umgeschichtet (nicht zum Kurs von 12:00). Das Nachladen wird in diesem Zeitraum nicht gebraucht (Bestand vom Freitagabend ist bis Mo 16:15 frisch).',
  b1w: 'Wie b1, die Quelle wirft eine Ausnahme statt null: derselbe Ablauf, kein "Fehler" in der Statuszeile (eroeffnung() faengt sie ab).',
  b2: 'BEFUND (Klasse A, H-b2-budget-ohne-kurs). Die Umschichtung laeuft richtig an (um 09:35 die 11 Orders mit Kurs, um 11:00 die 7 uebrigen zur Eroeffnung des Montags - nie zum laufenden Kurs, ' +
    'keine Doppelausfuehrung), aber der Platzwert (Depotwert / Zielzahl) wird um 09:35 ohne die fuenf gehaltenen Positionen berechnet, deren Eroeffnung fehlt (planeUmschichtung: Position ohne Kurs zaehlt 0). ' +
    'Budget je Kauf ~4,5 statt ~6,1 Tsd. $, alle neun Kaeufe 42,7 statt 58,2 Stueck, und das Nachfassen um 11:00 uebernimmt dieses Budget (offen.kaeufe[].budget). Am Ende liegen 14.163,63 $ (12 % des Buchs) als Bargeld, ' +
    'Soll 0. Nach REGEL §1.3 ist "Position ohne Kurs gehalten" gemeint - dort ist der Wert der Position aber weiter im Buch; in der Messung hat jeder Wert an jedem Tag eine Eroeffnung.',
  b3: 'Wie b2, aber die Quelle bleibt bis Dienstag 10:00 teilweise down. Folgen: (1) das Nachfassen um 16:00 gibt auf - 3 Verkaeufe und 4 Kaeufe bleiben liegen, die drei Verkaufswerte stehen danach 63 Handelstage im Buch ' +
    '(REGEL: "ohne Kurs kein Handel" - bei einer Quellenstoerung ist das ein anderer Fall als bei fehlenden Daten); (2) das Laden am Montagabend wird von ladenAnnehmen abgelehnt (148 von 193 < 95 %), der Bestand vom Freitag bleibt stehen, ' +
    'jede Stunde ein neuer Versuch mit je 194 Abrufen (21 Ladeversuche im Lauf), der Montagspunkt entsteht erst Dienstag 10:20; (3) dieselbe Budget-Abweichung wie b2 (13.809,90 $ Bargeld).',
  c1: 'Befund in einem Teil. Der Split 2:1 am Freitag (SCHW, Wert mit genau 253 Balken) wird am Freitag 16:20 gebucht (Stueck 29,59 -> 59,19), die Umschichtung am Montag stimmt mit dem Soll ueberein. ' +
    'Die Ausschuettung auf einem BLEIBENDEN Wert (ELV, 29,49 $) wird Montag 16:20 gutgeschrieben, wie REGEL C.3. Die Ausschuettung auf einem zur Eroeffnung VERKAUFTEN Wert (TXN, 29,33 $) geht verloren: ' +
    'bucheMassnahmen laeuft erst nach dem Laden am Abend und nur ueber gehaltene Positionen (H-c1-div-verkaufte-position, A, klein). REGEL C.3 sagt: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch" - ' +
    'das ist auch im echten Depot so (T+1: Ex-Tag = Stichtag, der Verkaeufer behaelt die Dividende, verkauft aber zum Kurs nach Abschlag). Zweifel an der REGEL gibt es also nicht, die App weicht ab. ' +
    'Folge: Tagespunkte Montag und Dienstag je 29,33 $ unter dem Soll.',
  c2: 'BEFUND (Klasse A, H-c2-split-ex-tag). Split 2:1 mit Ex-Tag Montag in drei Werten, der Bestand der App ist vom Freitag. Yahoo meldet die Montagseroeffnung schon in neuer Stueckelung (halber Kurs), die App rechnet sie gegen die alte ' +
    'Stueckzahl: (1) der VERKAUFTE Wert (WELL) bringt 3.064,58 $ statt 6.129,16 $ - die Haelfte der Position ist weg; (2) der BLEIBENDE Wert (NVDA) geht mit halbem Wert in den Depotwert (und wird erst Montag 16:20 gebucht, 29,53 -> 59,05); ' +
    '(3) der Platzwert sinkt um ca. 5 %, die neun Kaeufe haben 55,1 statt 58,2 Stueck. Der NEU gekaufte Wert mit Split am selben Tag ist richtig (kursT = Stempel des Montagsbalkens, kein spaeteres Buchen). ' +
    'Tagespunkt Montag 113.146,41 gegen Soll 116.232,90 (-3.086,49 $, 2,7 % des Buchs). c1-Befund (verlorene Ausschuettung) ist hier mit enthalten. ' +
    'Die REGEL (Panel mit rueckwirkend bereinigten Kursen) kennt das Problem nicht; Soll = Stueckzahl mal Split vor der Umschichtung.',
  d: 'BEFUND (Klasse B, H-d-reihenende-fuenf-tage; Budgetanteil: Klasse A, H-b2-budget-ohne-kurs). Der gehaltene, nicht im Ziel stehende Wert (WELL) hat seine letzte Kerze am Mittwoch 18.11. REGEL §1.4 buchte ihn am Donnerstag 19.11. zum letzten Schluss aus; ' +
    'die App wartet absichtlich fuenf Handelstage (mfhandel.js, "BEWUSSTE ABWEICHUNG"). Am Montag hat sie erst drei, also: kein Eroeffnungskurs, der Verkauf wird als "offen" gemerkt und um 16:00 aufgegeben, die Position bleibt, ' +
    'am Ende 20 statt 19 Positionen. Ihr Wert fehlt im Platzwert, die Kaeufe sind 55 statt 58 Stueck. Der Rest der Umschichtung stimmt, auch die Kurse (alle Eroeffnung).',
  d2: 'BEFUND (Klasse B/A wie d). Hier ist der Wert, dessen Reihe am 18.11. endet, ein im Ziel bleibender Wert (ELV). REGEL: ausgebucht am Donnerstag, am Montag als Ziel ohne Kurs nicht gekauft - Bargeld 5.723 $ bleibt liegen, 18 Positionen. ' +
    'App: Position bleibt (19 Positionen), ihr Wert fehlt im Platzwert, die Kaeufe sind kleiner, Bargeld 2.489 $. Beide Seiten halten Geld ungenutzt, aber verschieden viel und verschieden lang; die App bucht erst Mittwoch 25.11. aus.',
  e: 'Gegenprobe ohne Befund. Start Montag 15:50: der Bestand ist vom Donnerstag (nicht frisch gegen die Uhr), der erste Takt laedt nach, der zweite (15:55) schichtet zur Eroeffnung des Montags um - 5 Minuten vor Schluss, aber zum richtigen Kurs. ' +
    'Der Freitagspunkt wird vor dem Handel geschrieben.',
  e30: 'Gegenprobe ohne Befund, mit dem echten Takt der App (12 s nach dem Start, dann alle 30 min): der erste Takt (15:50:12) laedt nach, der zweite um 16:20:12 - NACH dem Schluss - schichtet zur Eroeffnung des Montags um; ' +
    'der Kurs ist richtig, die Uhrzeit nicht "zur Eroeffnung". Der Montagspunkt kommt erst 17:20, weil das Nachladen hoechstens einmal je Stunde angestossen wird (ladeAngestossen).',
  f: 'Gegenprobe ohne Befund. Montag (Feiertag, SPY ohne Balken): die App haelt "faellig" (62 Balken seit der letzten Umschichtung), die SPY-Probe findet keinen Balken, es wird nicht gehandelt, keine Journalzeile, kein Montagspunkt. ' +
    'Dienstag 09:35: eine Umschichtung zur Eroeffnung des Dienstags, Stichtag Freitag 20.11., ein Punkt fuer Dienstag, keiner fuer Montag. Die Marktreihe ist am Montagabend nach 16:15 neu geladen worden (sonst haette stichtagPruefen am Dienstag abgelehnt).',
  g: 'BEFUND (Klasse B, H-g-uhr-vor-laufender-balken). -30 min um 09:50 (nach dem Handel) ohne Wirkung. +2 h um 13:00 (netto +90 min): ab 14:45 NY zeigt die Uhr 16:15, der Takt laedt nach und behaelt den LAUFENDEN Balken als Schluss ' +
    '(ohneLaufendenBalken prueft nur die Systemuhr); der Montagspunkt (14:50 NY geschrieben) steht 106,79 $ ueber dem Soll, der Dienstagspunkt (Uhr weiter +90 min) 115,33 $. Der Handel selbst ist richtig. ' +
    'Keine Doppelausfuehrung, kein negatives Bargeld, keine Statusfehler. Teil 2 (szenario-g-dst.md): nyTag/nyUhr/nyZeit/letzterFertigerWerktag/bestandFrisch ueber 08.03.2026, 01.11.2026, 14.03.2027 gegen eine unabhaengige Regelrechnung: 0 Abweichungen. ' +
    'Der Wechsel 2027 ist am 14.03.2027, nicht am 07.03.2027 (zweiter Sonntag im Maerz).',
  g1b: 'Gegenprobe ohne Befund. Die Uhr wird um 09:00 NY um 30 min zurueckgestellt: die App darf erst bei Weltzeit 10:05 handeln (Uhr 09:35), tut es dann einmal und zur Eroeffnung des Montags.'
};
