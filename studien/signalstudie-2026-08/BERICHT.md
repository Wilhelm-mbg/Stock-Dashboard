# Große Signalstudie — Ergebnis (23.08.2026)

Registrierung: `REGISTRIERUNG.md`, festgeschrieben am 22.08. um 21:47 Uhr, **vor der ersten
Rechnung**. Skripte und Rohdaten in diesem Ordner; jede Zahl unten ist reproduzierbar.

## Das Ergebnis in einem Satz

**Kein einziges der 51 geprüften Signale, keine Bedingung und keine Kombination hat die
zurückgehaltenen Tage überstanden** — und die drei Angriffe auf dieses Nein haben es nicht
gekippt, sondern bestätigt.

| Zeitrahmen | Werte | Tests in der Entdeckung | Kandidaten | bestätigt |
|---|---:|---:|---:|---:|
| 1m | 88 | 440 | 13 | **0** |
| 5m | 158 | 980 | 13 | **0** |
| 15m | 158 | 596 | 13 | **0** |
| 60m | 114 | 1.356 | 16 | **0** |

Gemessen wurden 15 Detektoren (alle walk-forward geprüft, 0 Abweichungen in bis zu 33.563
Stichproben), neun Bedingungen, Paare im 30-Minuten-Fenster, drei Horizonte, beide Richtungen.

## Warum das Nein belastbar ist

Drei Angriffe, alle gerechnet, keiner trägt:

**1. „Die Kontrolle ist zu scharf und rechnet echte Kanten weg."** Nachgerechnet mit drei
Kontrollen auf denselben Signalen: Versatz-Kontrolle 0,09 / Symbol-Drift 0,10 / roh 0,20 Pp
(rsi2seit). Die beiden Kontrollen liefern praktisch dasselbe — der Unterschied zur
Rohrendite ist Marktdrift, kein Artefakt.

**2. „Der Split ist ein Regimewechsel."** Das stimmt: S&P −0,27 % in der Entdeckung, **+3,59 %**
in der Bestätigung, und 32 der 51 Kandidaten sind Short. Auf 15m drehten 0 von 4 Long, aber
die Shorts kippten. Also marktneutral nachgerechnet (Tages-Beta herausgerechnet): **kein
einziger Kandidat kippt ins Positive.** Bestes t 2,61 gegen Schwelle 2,86. Das Regime erklärt
das Muster, aber nicht das Ergebnis.

**3. „Die Studie war unterdimensioniert."** Das trifft zu — und ist die wichtigste
Einschränkung:

| Zeitrahmen | Bestätigungstage | nachweisbar ab (t=2) | mit 80 % Sicherheit ab |
|---|---:|---:|---:|
| 1m | 22 | 0,144 Pp | 0,179 Pp |
| 5m | 22 | 0,217 Pp | 0,270 Pp |
| 15m | 22 | 0,301 Pp | 0,374 Pp |
| 60m | 242 | **0,434 Pp** | 0,540 Pp |

Belegte Kanten dieses Projekts liegen bei 0,10–0,15 Pp. **Der 60-Minuten-Teil konnte
strukturell nichts bestätigen** — er hätte eine viermal größere Kante gebraucht, als je
gemessen wurde. 242 Tage klingen nach viel; tagesgeclustert sind sie es nicht.

Ehrliche Formulierung des Ergebnisses: **„Keine Kante über 0,15–0,3 Pp je Trade. Darunter
ist diese Studie blind."** Nicht: „nichts funktioniert."

## Was sich nicht in null auflöst

**rsi2seit (die belegte Kante) reproduziert sich — nur unterhalb der Auflösung.**
Entdeckung +0,090 Pp, Bestätigung +0,114 Pp, marktneutral +0,116 Pp. Über 725 Handelstage,
in beiden Hälften, mit stabiler Größe. Der t-Wert bleibt bei 0,7–0,9, weil der
tagesgeclusterte Standardfehler bei 0,217 Pp liegt. Validiert war die Kante mit +0,147 Pp
und t über *Symbole* — hier ist die Zahl kleiner und der Test strenger.

**Der Kapitulations-Dip ist keine Kante, sondern eine Wette auf normale Tage.** Median über
alle 313 Signale: −0,37 Pp. **Ohne die zwei Crash-Tage 3./4.4.2025** (79 der 313 Signale,
also ein Viertel): Median **+0,40 Pp**. Unter der 200-Tage-Linie: Median −1,53 Pp; darüber
+0,45 Pp. Die Strategie kauft den Ausverkauf und gewinnt meistens ein wenig — bis der
Ausverkauf weitergeht, dann verliert sie viel. Der Regime-Filter, der seit 8.23.26 eingebaut
ist, greift genau hier.

**Felix' Winkel-Detektor dominierte die 1-Minuten-Entdeckung vollständig** — beide besten
Einzelsignale, alle fünf besten Bedingungen, t bis 2,74. In der Bestätigung: alles bei null.
Konsistent mit der Neubewertung von #33 vom Vortag.

## Welches Finanzprodukt trägt eine Kante?

Alle Kosten auf **Prozentpunkte des Basiswerts** umgerechnet (Spanne durch Hebel, plus
Zeitwert), mit dem Modell der App:

| Produkt | Hebel | 3 h | 1 Tag | 1 Woche | 3 Wochen |
|---|---:|---:|---:|---:|---:|
| **Aktie** (1 Bp + 1 $/Seite) | 1 | **0,04** | 0,04 | 0,04 | 0,04 |
| **Schein ATM 60 T, BV 1,0** | 9,8 | **0,05** | 0,16 | 0,67 | 2,06 |
| **CFD** (5 Bp Spanne) | 1–5 | **0,10** | 0,12 | 0,20 | 0,39 |
| Schein ATM 21 T (Standard) | 16,2 | 0,23 | 0,42 | 1,36 | 6,37 |
| US-Option ATM 21 T (2 %) | 16,2 | 0,27 | 0,46 | 1,39 | 6,41 |
| Schein 5 % OTM, 10 T | 33,8 | 0,61 | 1,11 | 3,17 | 3,52 |

**Der Standard-Optionsschein der App macht jede bekannte Kante negativ.** rsi2seit mit
+0,11 Pp kostet dort 0,23 Pp je Umlauf — netto −0,12. Mit der Aktie bliebe +0,07, mit dem
CFD +0,01, mit dem teuren Schein (Bezugsverhältnis 1,0, ein Cent Spanne auf 11 Euro = 0,18 %)
+0,06.

Das ist die wichtigste praktische Erkenntnis der Studie: **Die Hürde war nie die
Signalqualität, sondern das Produkt.** Ein Hebel von 16 multipliziert den Gewinn — und die
Spanne gleich mit.

Die CFD-Zeile ist noch eine Annahme; die Spannen-Messung ab Montag 24.08. liefert den ersten
echten Wert.

## Ist die algorithmische Erkennung die Grenze?

Diese Frage ist **aus vorhandenen Daten nicht beantwortbar** — es gibt im Projekt keinen
einzigen menschlichen Einstieg, der vor Kenntnis des Ergebnisses aufgezeichnet wurde. Was
die Studie stattdessen zeigt:

- Die Detektoren **finden**, was sie finden sollen: Der Winkel-Detektor rankt auf 1m ganz
  oben, rsi2seit reproduziert seine Größe. Die Erkennung ist nicht das Problem.
- Sie finden nur **zu wenig**: Die Effekte liegen bei 0,1 Pp, die Kostenhürde bei 0,04–0,23 Pp
  je nach Produkt. Ein besserer Detektor müsste nicht *präziser* sein, sondern *größere*
  Bewegungen treffen.

Ein Blindtest-Protokoll liegt in `HYBRID-PROTOKOLL.md`: 200 verdeckte Situationen je
Teilnehmer, Auflösung ≈ 0,13 Pp. Solange der nicht gelaufen ist, ist jede Aussage zur
Hybrid-Frage Meinung.

## Was daraus für die App folgt

1. **Produktkosten sichtbar machen.** Neben jedem Signal gehört die Hürde des gewählten
   Produkts — sonst sieht ein +0,15-Pp-Signal nach Gewinn aus, obwohl es mit dem
   Standard-Schein −0,08 macht.
2. **Kein neues Signal verdrahten.** Es gibt keinen Gewinner.
3. **Die Detektor-Reparaturen aus dem Audit** (kanaltrend rechnet keinen Kanal, wave feuert
   live praktisch nie, ORB auf 15m/60m tot) — offen, unabhängig von dieser Studie.
4. **Bestätigungsfenster verlängern**: Mit jedem Handelstag wächst der Bestand. Bei 120
   Bestätigungstagen läge die Auflösung auf 1m bei ≈ 0,06 Pp — dann wäre die Frage
   entscheidbar, die heute offenbleibt.

## Grenzen dieser Studie

- **22 Bestätigungstage** auf allen Intraday-Stufen; das ist wenig, und es war vorab bekannt.
- **Der 60m-Teil** hatte keine Auflösung für Kanten realistischer Größe.
- **Ein Regimewechsel** fiel in die Bestätigung; marktneutral gerechnet ändert das nichts,
  aber die Short-Kandidaten waren strukturell im Nachteil.
- **Kein Parameterraster** (bewusst): gemessen wurde, was live läuft.
- **Momentum und Drift** haben Haltedauern von 63 bzw. 60 Tagen; auf 1–5-Tage-Horizonten
  gemessen sind ihre Referenzzeilen **keine Prüfung dieser Kanten**.
