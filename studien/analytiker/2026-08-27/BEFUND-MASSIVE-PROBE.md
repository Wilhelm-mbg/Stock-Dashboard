# Massive-Probeabruf: Der vorhandene Schlüssel schaltet Splits UND Dividenden frei

**Analytiker, 27.08.2026, ~10:45. PM-Auftrag.** Nur lesend (10 Abrufe, 13 s Abstand,
kein 429, nichts angemeldet, nichts verändert). Der Schlüssel kam aus
`tools/massive.js` (Bearer-Header) und steht in keiner Ausgabe und keiner Datei.
Werkzeug: `massive-probe.js`, Rohantworten: `massive-probe-daten.json` (enthalten
keinen Schlüssel — er reist nur im Header).

## Hauptantwort: JA — beide Endpunkte antworten auf der vorhandenen (Gratis-)Stufe

`/v3/reference/splits` und `/v3/reference/dividends` liefern Daten. **Beide
Richtungen geprüft (Auflage 3):**

- **Muss feuern:** AAPL → 5 Splits, korrekt inkl. 1:4 am 2020-08-31 und 1:7 am
  2014-06-09, ältester 1987-06-16. Der Endpunkt liefert also auch tiefe Historie,
  nicht nur Jüngstes.
- **Muss leer sein:** ARM (Börsengang 2023, nie gesplittet) → 0 Einträge. Die leere
  Liste ist dort die richtige Antwort — der Endpunkt gibt nicht „immer leer" zurück.

## Bezifferte Antwort für die fünf Reihen

Versatz = Median von (1d-Schluss ÷ letzter 60m-Schluss) je Tag, gemessen über 732
gemeinsame Tage je Reihe (`massive-probe.js`, Teil A):

| Reihe | Versatz 1d/60m | Ereignis laut Massive | Urteil |
|---|---|---|---|
| **RGR** | 0,3740 bis 23.10.2025, ab 24.10. exakt 1,0 | **Kein Split — 0 Einträge in der gesamten Firmengeschichte**; einzige Dividende im Umfeld: 0,04 $ (17.11.2025) | **1d stimmt.** 1d läuft durchgehend plausibel (44,52 → 46,96 $ um den Stichtag); die **60m-Historie vor dem 24.10.2025 ist um Faktor 2,674 zu hoch** (118–123 statt 44–46 $) und fällt am 24.10. um −62 % auf die 1d-Linie — ohne irgendein Ereignis, das das tragen würde. Ein unerklärter Skalenfehler im 60m-Archiv. |
| **WHLR** | exakt 4,0 über die GESAMTE gemeinsame Historie bis 25.08., am 26.08. = 1,0 | **Reverse Split 4:1, Ausführung 27.08.2026** (dazu 15 weitere Splits seit 2017, u. a. 24:1 am 17.05.2024) | **60m stimmt** (einheitliche Vor-Split-Skala, 26.08. = 0,399 beidseitig). Das **1d-Archiv hat den Split von HEUTE bereits in die Historie bis zum 25.08. eingearbeitet, den 26.08. aber roh gelassen** — ein tageweiser Skalenbruch innerhalb des 1d zwischen 25. und 26.08. |
| **BYND** | 0,0333 (= 1/30) bis ~10.08.2026, danach 1,0 | **Reverse Split 30:1, Ausführung 14.08.2026** | **60m stimmt** (Historie auf die neue Skala nachgezogen, wie es die Split-Konvention verlangt); die **1d-Historie blieb auf der alten Skala**. Dazu die schon von der QS gefundenen tageweisen Flip-Flops im Juli (Quote springt 30,2 → 0,033 → 30,6 …) — jetzt dem Ereignis zugeordnet: einzelne 1d-Tage standen schon VOR der Ausführung auf der neuen Skala. |
| **SITC** | 0,2975 bis 30.09.2024, ab 01.10. exakt 1,0 | Der Reverse Split 1:4 (19.08.2024) steckt in BEIDEN Archiven konsistent (kein Quotensprung an dem Tag); **am 01.10.2024 existiert KEIN Split- und KEIN Dividenden-Ereignis** | **Mechanisch entschieden, ereignisseitig offen:** Die konstante Quote zeigt, dass das **1d-Archiv die Historie um 3,361 rückangepasst hat**, während 60m den echten Kurssprung trägt (60,50 → 17,06 $ — beide Archive treffen sich ab 01.10. exakt). Nach der Split-only-Konvention des Systems stimmt 60m. **Was das Ereignis war, geben Splits/Dividenden nicht her** (naheliegend ein Spin-off; durch diese zwei Endpunkte NICHT belegbar). |
| **B** | driftet 0,59 → 0,45 → 0,43 → 0,36, ab 18.06.2025 = 1,0 | **Die Dividendenreihe bricht:** 0,16-$-Quartalsserie endet 22.08.2024, Lücke, neue Serie 0,10/0,15/0,175 $ ab 30.05.2025 | **Keine Versatz-Frage, sondern Ticker-Neuvergabe.** Eine DRIFTENDE Quote kann kein Anpassungsfehler sein (der wäre konstant) — hier liegen zwei verschiedene Firmen unter einem Kürzel: das 1d trägt die alte Firma bis zu deren Ende, das 60m (rollendes 730-Tage-Fenster) durchgehend die Historie des neuen Inhabers. Die Reihe braucht eine Trennung, kein Schiedsurteil. |

**Der eigentliche Neufund:** Die bisherige Arbeitsformel „ein Archiv ist
rückangepasst, das andere nicht" ist **je Reihe verschieden herum falsch**: bei RGR
ist das 60m kaputt, bei WHLR/BYND das 1d, bei SITC ist das 1d nach unserer
Konvention überadjustiert, und B ist gar kein Anpassungsfall. Eine pauschale
Reparaturrichtung hätte mindestens eine Reihe in die falsche Richtung „repariert".

## Was ich NICHT beantworten kann (Auflage 4)

- **Vollständigkeit vor ~2017:** punktuell belegt (AAPL bis 1987, B 2006, SITC 2018),
  aber keine systematische Vollständigkeitsprüfung des Split-Datensatzes.
- **Spin-offs und Ticker-Neuvergaben** stehen NICHT in diesen zwei Endpunkten —
  SITC (01.10.2024) und B (Neuvergabe) sind genau deshalb nur mechanisch bzw. über
  die Dividendenreihe entscheidbar. Ob Massive solche Ereignisse in einem anderen
  Endpunkt führt (Ticker-Events), habe ich nicht abgerufen.
- **Vollständigkeit der Dividendenlisten** (RGR 80, SITC 84, B 89 Einträge):
  plausibel, nicht gegen eine zweite Quelle geprüft.
- Ob die Gratis-Stufe diese Endpunkte DAUERHAFT führt, sagt nur die Preisseite —
  heute haben sie geantwortet, ohne einen einzigen 429.

## Folgerung für Wilhelms Entscheid

Für die Stränge S2/S4 (Versatz-Schiedsrichter, Anpassungsstände) ist der vorhandene
Schlüssel **arbeitsfähig, Kosten 0 €** — die Anbieter-Vorlage wird dafür zur
Rückfallebene. Offen bleiben S1 (132 Skalenwechsel: dieselbe Probe skaliert auf 132
Fälle ≈ 132 Abrufe ≈ 29 Minuten Tempolimit — machbar, aber Spin-off-Fälle bleiben
unentscheidbar) und S3 (Abgemeldete in der Breite: dafür sagt die Vorlage Norgate/
Sharadar/EODHD).

---

## NACHTRAG ~13:00 — Zeiträume ergänzt, WHLR-Urteil präzisiert (QS-Einwand war berechtigt)

Die QS hielt meinem „WHLR: 60m stimmt" ihre 25.08.-Messung entgegen (Massive und
archiv1d bei 1,36–1,496, archiv60m Faktor 4 darunter). **Auflösung per Rohkurs-Abruf
(adjusted=false, 27.08.): real gehandelt wurde am 25.08. zu 0,3665 und am 26.08. zu
0,399 — die niedrige Skala.** Der QS-Vergleich lief (heute abgefragt) gegen Massives
rückangepasste Ansicht, die den HEUTE ausgeführten 4:1-Reverse-Split bereits in die
Historie einarbeitet (0,3665×4 = 1,466). Beide Messungen sind richtig — sie reden
über zwei Konventionen: Rohskala vor Ausführung vs. rückangepasste Skala nach
Ausführung. Da die System-Konvention der Archive „rückangepasst" ist (AAPL/NVDA/
TSLA-Beleg), war mein Satz „60m stimmt" **zu breit**: richtig ist „in sich
konsistent auf der Vor-Ausführungs-Skala von heute früh".

**Die fünf Urteile mit Geltungszeitraum („gilt für …"):**

| Reihe | Urteil mit Zeitraum |
|---|---|
| **RGR** | 60m vor dem **24.10.2025** um Faktor 2,674 zu hoch (kein Ereignis existiert); **ab 24.10.2025 stimmen beide überein**. 1d über den ganzen Zeitraum plausibel-stetig. |
| **WHLR** | **Drei Segmente:** (1) historisch, z. B. **Sept. 2024**: 1d kaputt (QS: Kurse bis 62 Mio $ bei 0–13 Stück — nicht mein Befund, übernommen); dazu mein F-Fund **03.04.2017** (8:1-Split nicht geglättet). (2) **Stand heute früh vor Split-Ausführung** (Fetches 01:58/03:34): 60m einheitlich auf roher Vor-Split-Skala, 1d **in sich inkonsistent** (Historie schon ×4, der 26.08. roh) — das bleibt der Befund. (3) **Ab Ausführung 27.08.** ist die rückangepasste Darstellung (×4, wie 1d-Historie) die konventionskonforme; das 60m muss beim nächsten Nachziehen ×4 folgen, sonst ist DANN das 60m das falsche. |
| **BYND** | Vor dem **14.08.2026**: 60m rückangepasst (konventionskonform), 1d-Historie auf Rohskala (Konventionsbruch) **plus** tageweise Flip-Flops im **Juli 2026** (in jeder Konvention Fehler). Ab 14.08. identisch. |
| **SITC** | Vor dem **01.10.2024**: 1d um 3,361 rückangepasst (Ereignis nicht in Splits/Dividenden — vermutl. Spin-off, unbelegt), 60m roh mit echtem Kurssprung. **Ab 01.10.2024 exakt identisch.** Der 1:4-Split (19.08.2024) steckt in beiden konsistent. |
| **B** | Trennfall mit Datum: ticker_change auf Barrick am **09.05.2025** (Events-Endpunkt). 1d trägt davor die alte Firma, 60m durchgehend die Historie des neuen Inhabers; **ab ~18.06.2025 identisch**. Kein Skalen-Urteil sinnvoll. |

**Lehre für alle künftigen Skalen-Urteile:** Ein Archiv-Urteil ohne (a) Zeitraum und
(b) Konventions-Angabe (roh vs. rückangepasst) ist unvollständig — um einen
Ausführungstag herum können beide Archive „recht haben" und trotzdem
inkompatibel sein.
