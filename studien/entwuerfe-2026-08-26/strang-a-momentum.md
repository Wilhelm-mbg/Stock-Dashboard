# Entwurf: Strang A — momentum nicht überlappend durch die Mühle

**Stand:** 26.08.2026, ~22:5x, Rolle Berechnungen. **Das ist ein ENTWURF, keine
Vorregistrierung** — er legt die Arithmetik und drei Entscheidungsfragen vor, BEVOR
irgendetwas festgeschrieben wird. Grundlagen: Eichung 25.08.
(`studien/momentum-nichtueberlappend/`, g = 1,543, Anordnung validiert), Tafel-Auftrag
Strang A (Wilhelm 18:35), Verzerrungsmessung 26.08. (Richtung belegt: beschönigend),
Wilhelms delta80-Entscheid (20:30).

---

## 1. Die Lage, ehrlich

1. **Beide Hälften der Historie sind verbrannt.** Entdeckung (überlappend, t 4,74→0,74)
   und Bestätigung (Eichung: +1,537 Pp je Umlauf, se 0,732, t 2,10) sind gesehen. Die
   Eichung selbst schreibt: *„die einzige solche Hälfte ist die Zukunft."* Aus einem
   erneuten Lauf auf dieser Historie kann **kein „belegt"** entstehen — egal wie er
   ausgeht.
2. **Die delta80-Arithmetik (Wilhelms neue Schranke, Einheit: Prozentpunkte je
   63-Tage-Umlauf):** se ≈ 0,732 Pp auf ~79 unabhängigen Perioden ⇒
   delta80 ≈ (1,96+0,84)·0,732 ≈ **2,05 Pp** (1 Test) bzw. ≈ **2,50 Pp** (5er-Familie).
   Kostenhürde je Umlauf: **0,04 Pp** (Aktie, Strang-C-Tabelle) oder **0,40 Pp**
   (die 20 Bp je Seite, die das virtuelle Buch selbst ansetzt). **delta80 liegt also
   beim 5- bis 60-Fachen der Hürde** — und mehr Historie gibt es nicht: die ~79
   Perioden sind die ganze verfügbare Vergangenheit. Prospektiv wären für t ≥ 2 bei
   wahrem Effekt +1,5 Pp grob **~75 weitere Perioden ≈ 19 Jahre** nötig.
3. **Die Überlebenslücke drückt in die schöne Richtung.** Neu gemessen (26.08.):
   Richtung belegt NEGATIV — das Überlebenden-Archiv beschönigt. Für momentum gibt es
   keinen Korrekturwert, nur das Vorzeichen. Der Punktschätzer +1,537 ist also eine
   **Obergrenze** unbekannter Schärfe; dazu ist die Lücke vor 2004 nicht einmal
   beziffert.
4. **Vorbedingung laut Tafel offen:** die drei Datenfunde (falsche Delistings ·
   `massive-tagesdaten.js:29` · Wachhund-Rundung) liegen beim Master; Status unklar.

## 2. Was daraus folgt — der zweiteilige Zuschnitt

**Teil 1 — Bestandsmessung durch die Mühle (auf gesehenen Daten, ohne Belegmöglichkeit,
und das steht in jeder Zeile):** die nicht überlappende Anordnung (Phase 0, stärkste
10 %, 63 Tage, Universum WP.istAktie + F1, Schnitt 2006-08-14) einmal vollständig durch
die Messmaschine — mit Placebo (kursblind), Kontrolltopf, Testfamilie, Streubild über
alle 63 Lagen, und der Überlebenslücke als benannter Einschränkung MIT dem neuen
Vorzeichen. **Wert:** ersetzt das kaputte überlappende B10-Protokoll als
Referenzmessung; liefert die delta80/se-Zahlen, an denen alles Weitere hängt; die
mögliche Urteilsmenge ist vorab auf {nicht-entscheidbar, widerlegt} beschränkt —
**„bestätigt" ist als Ausgang ausgeschlossen**, per Konstruktion, nicht per Ergebnis.

**Teil 2 — prospektive Regel auf dem laufenden Buch:** das virtuelle MOMENTUM-Buch
(läuft seit 8.20.0) wird das vorregistrierte Prüfgerät für die Zukunft: jetzt
festgelegte Auswertungsregel je neuer 63-Tage-Periode (kumulierter Überschuss, se aus
Teil 1, JA/NEIN-Schwellen), Auswertung automatisch, niemand fasst die Regel mehr an.
**Ehrlich dazu:** auf Familienschwelle kommt das erst in ~zwei Jahrzehnten; realistisch
ist eine Überwachung mit Abbruchregel (NEIN-Seite kann früh fallen: wenn der laufende
Überschuss unter −X Pp kumuliert, ist die JA-Hypothese praktisch tot), nicht eine
baldige Bestätigung.

## 3. Drei Entscheidungsfragen (an PM/Wilhelm, mit Ziffer beantwortbar)

**F1 — Lohnt Teil 1 trotz Belegverbot?**
  1a = ja, als Referenzmessung bauen (meine Empfehlung: die Mühle erzwingt Placebo/
       Kontrolle/Familie, und das überlappende Protokoll ist als Referenz nachweislich
       falsch) · 1b = nein, Eichungszahlen genügen, nur Teil 2 · 1c = ganz zurückstellen

**F2 — Welche Kostenhürde gilt für momentum?**
  2a = 0,04 Pp je Umlauf (Aktien-Zeile der Strang-C-Tabelle; Basiswert-Regelfall) ·
  2b = 0,40 Pp (die 20 Bp je Seite des Buchs) · 2c = auf die laufende
       Kostenmessung des Demo-Kontos warten. **Der Unterschied entscheidet, ob der
       Punktschätzer +1,537 die Hürde um Faktor 38 oder um Faktor 3,8 schlägt.**

**F3 — Ist die neue delta80-Schranke eine ZULASSUNGS-Schranke für Strang A?**
  Wenn „Kandidat nur, wenn delta80 ≤ Hürde" wörtlich gilt, ist Strang A **nicht
  zulassungsfähig** (2,05 ≫ 0,40) — dann wäre Teil 1 keine Kandidatenprüfung, sondern
  eine Referenzmessung außer Konkurrenz, und das gehört vorher ausgesprochen.
  3a = so ist es gemeint, Referenzmessung außer Konkurrenz ·
  3b = die Schranke gilt nur für NEUE Tüftler-Kandidaten, Strang A ist Bestandsauftrag ·
  3c = Wilhelm entscheidet anders

## 4. Was ich NICHT vorschlage

- Keine neue Detektor-Idee, keine Parametersuche — der Auftrag sagt ausdrücklich: das
  Einzige richtig messen, was offen ist.
- Kein Lauf vor: (a) Antwort auf F1–F3, (b) Status der drei Datenfunde beim Master,
  (c) fertiger Vorregistrierung mit vorab fixierten Schwellen (dann wie gehabt:
  Wächter zuerst, ein Lauf, Rückmeldung vor der Kohorte).

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
