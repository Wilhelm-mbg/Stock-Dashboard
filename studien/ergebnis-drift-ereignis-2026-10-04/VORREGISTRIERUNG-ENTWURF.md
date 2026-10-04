# ENTWURF einer Vorregistrierung — Ergebnis-Drift tagesgenau

**Nicht registriert. Nicht gestartet. Kein Ertrag nach Überraschung wurde gebildet.** Dieses Papier ist die Vorlage, über die Wilhelm entscheidet
(Auftrag Nr. 80, M7). Alle Zahlen kommen aus der blinden Machbarkeit (`MACHBARKEIT.md`, `aufloesung.json`, `tore.json`, `tore2.json`). Wird es
registriert, wandert es unverändert nach `studien/vorregistrierung-<datum>-ergebnis-drift/` und wird committet, **bevor** ein Skript die
Überraschung mit einem Ertrag zusammenbringt. Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Frage

Steigen US-Aktien der Umsatzklassen 50-250, 250-1000 und ab1000 in den Handelstagen **nach** einer Quartalsmeldung (8-K Punkt 2.02), deren
Überraschung im obersten Zehntel liegt, stärker als (A) Aktien mit einer Überraschung im untersten Zehntel und (B) der Durchschnitt ihrer
Umsatzklasse am selben Tag — und bleibt (B) nach Kosten übrig? (B) ist die Seite, die Wilhelm handeln könnte; (A) ist die Diagnose.

## 2. Daten und Ereignisse — eingefroren

Auszug `meldungen-202.tsv` (125.796 Meldungen Form 8-K, SHA-256 bei Registrierung eintragen), Bilanz-Tafel v1.1, Panel v2.2 (bis 15.09.2026).
Ereignis = Hauptmeldung nach `zuordnung.js` mit Überraschung nach `ueberraschung.js`, Einstiegstag nach `zeit.js`, Reihe und Universum nach
`rechnen.js` (Universum des Prüfstands am Handelstag vor dem Einstieg; Klassen 1, 2, 3). Erwartete Zahl: **25.298 Ereignisse**, 1.876 Einstiegstage,
1.418 Firmen, 7,8 % von verschwundenen Firmen. Weicht die Zahl der Messung um mehr als 1 % ab, ist das ein Abbruchgrund (§9).
Die Klasse 5-50 ist nicht Teil der Messung (Eröffnungs-Hürde 0,42 Pp; 15.855 Meldungen scheitern dort ohnehin an der Minutendichte).

## 3. Signal

Überraschung = `(netto D0 − netto D4) / sd(netto D0…D7)` der zugeordneten Tafelzeile (Größe des Felds `sue`). **Zehntel punkt-in-zeit:** Vergleichsmenge
sind die Überraschungen aller Ereignisse mit Einstiegstag in den 63 Handelstagen **vor** dem Einstiegstag (mindestens 200, sonst kein Signal);
oberstes Zehntel = Wert ≥ 90. Perzentil dieser Menge, unterstes = Wert ≤ 10. Perzentil. Nichts gekappt. Keine weiteren Filter, keine Varianten.

## 4. Einstieg und Haltedauer

Kauf zur **Eröffnung des Einstiegstags** (erster Handelstag, an dessen Eröffnung die 8-K angenommen war: Annahme vor 09:30:00 New York → derselbe Tag,
sonst der nächste). Verkauf zur Eröffnung **H Handelstage** später. **Hauptgröße H = 60**, zweite Größe H = 20. **Vorrangregel:** über das Urteil
entscheidet allein H = 60; H = 20 wird berichtet und kann ein Urteil weder retten noch kippen. Abgänge im Haltefenster wie im Prüfstand
(Insolvenz/Zwangs-Delisting = Totalverlust, sonst letzter Kurs).

## 5. Kontrolle, Größen, Schätzer

Kontrolle als Erwartung: das Mittel desselben Ertrags über **alle** Universumswerte derselben Klasse am selben Tag. Bereinigter Ertrag = Ertrag − Kontrolle.
**A** = Mittel(oberstes Zehntel) − Mittel(unterstes Zehntel). **B** = Mittel(oberstes Zehntel); **B netto** = B − Eröffnungs-Hürde der Klasse (§7).
Daneben, immer in derselben Tabelle: **M** = Mittel aller Melder (zeigt, wie viel von B bloß „hat gemeldet" ist) und **B − M**.

**Schätzer — zu entscheiden, bevor registriert wird (blind vorbereitet):**

| Schätzer | MDE A, H 60 | MDE B, H 60 | Bemerkung |
|---|---:|---:|---|
| Tagesmittel (erst je Einstiegstag, dann über die Tage) | 2,45 | 1,63 | Wortlaut des Auftrags; ein Tag mit einer Meldung wiegt wie einer mit hundert |
| **Ereignis-Mittel** (jede Meldung gleich) — Empfehlung | 1,54 | 1,07 | entspricht „jede Meldung mit gleichem Einsatz handeln" |
| Tagesmittel, Ränder bei 1 % gestutzt | 1,57 | 1,21 | Stutzgrenzen über alle Ereignisse, blind |

**Standardfehler:** 200 Zufalls-Zuteilungen in den Messdaten (Zufallszahl statt Überraschung, fester Startwert) **und** der Fehler der Tagesreihe
(Newey-West, Lag H−1); es gilt der größere. t = Größe / Fehler, über Tage geclustert.

## 6. Placebo und Positivkontrolle — in derselben Tabelle wie A und B

- **Placebo ohne Kursbezug:** die letzte Ziffer der Akzessionsnummer als „Überraschung" (Ziffer 9 = oben, 0 = unten). Soll: A und B − M innerhalb von
  ±2 eigenen Standardfehlern. Die Schranke steht in Fehler-Einheiten der Zelle, nicht als absolute Zahl.
- **Positivkontrolle:** ein eingepflanzter Abstand in Höhe der MDE muss in mindestens 65 % der Zufallsläufe t ≥ 2 erreichen (Soll 80 %; in der
  Machbarkeit 76–82 %).

## 7. Kosten je Klasse

Je Umlauf zur Eröffnung: **0,210 Pp (50-250) · 0,134 Pp (250-1000) · 0,081 Pp (ab1000)** — Mittagsspanne 0,085 / 0,065 / 0,045 Pp mal Eröffnungsfaktor
2,46 / 2,07 / 1,81 (`wiki/kosten.md`, gemessen 03.09.2026). Ein Umlauf je Ereignis, F = 0 (Kassa). Über die Ereignisse gemittelt 0,19 Pp.

## 8. Rückhalt, Testzahl und Tore — zwei Fassungen, je am Nullfall und am eingepflanzten Effekt geprüft

Erwartete Größe (Literatur, aus dem Gedächtnis, nicht nachgeschlagen): früher 4 Pp Abstand über 60 Tage (Kaufseite 2 Pp); heute in liquiden Werten
eher die Hälfte oder weniger. Macht bei H = 60:

| | Nullfall | A = 4 Pp | A = 2 Pp | B = 2 Pp | B = 1 Pp |
|---|---:|---:|---:|---:|---:|
| **Fassung 1** Entdeckung 2017–2020 und Bestätigung 2021–2026, je t ≥ 2 — Tagesmittel | 0,05 % | 59,8 % | 10,7 % | 30,7 % | 3,8 % |
| Fassung 1 — Ereignis-Mittel | 0,05 % | 96,5 % | 38,8 % | 78,7 % | 16,7 % |
| **Fassung 2** ein Fenster 2021–2026, t ≥ 2,5 — Tagesmittel | 0,6 % | 96,2 % | 35,7 % | 70,2 % | 16,2 % |
| Fassung 2 — Ereignis-Mittel | 0,6 % | 100 % | 68,5 % | 97,8 % | 40,6 % |

- **Fassung 1 (Mühle, klassisch):** Entdeckung 2017–2020, Bestätigung 2021–2026. Fällt die Entdeckung durch (t < 2 bei H = 60), wird das
  Bestätigungsfenster nicht geöffnet. Schwäche: das Entdeckungsfenster ist das dünne (9.013 Ereignisse, 2016 fehlt).
- **Fassung 2 (Hypothese aus der Literatur, kein Entdeckungslauf):** Signal, Einstieg, Haltedauer und Schätzer stehen in diesem Papier, bevor ein
  Ertrag angesehen wird — es gibt nichts zu entdecken, also auch nichts zu bestätigen als die Hypothese selbst. Ein Test über **2021–2026**
  (16.285 Ereignisse; Wilhelms „letzte fünf Jahre"), Schwelle **t ≥ 2,5** (vier Größen: zwei Haltedauern × A, B; einseitig 5 % / 4 → 2,24, aufgerundet).
  2017–2020 wird danach als zweiter, unabhängiger Blick berichtet: trägt es dort das **umgekehrte** Vorzeichen mit t ≤ −2, gilt nichts als belegt. Der
  eigentliche Rückhalt ist der **Vorwärtstest**: Meldungen ab dem Tag der Registrierung, einige Monate (ein Quartal bringt rund 800 Ereignisse der Hauptklassen, davon ein Zehntel im obersten Zehntel).
- **Die Projektregel „Entdeckung ≥ 4 × Bestätigungs-MDE" (CLAUDE.md) kann hier nicht gelten:** sie verlangt 10,5 Pp (A) bzw. 7,4 Pp (B) über 60 Tage
  — der eingepflanzte Effekt von 4 Pp passiert sie in 0,01 % der Fälle. Vorschlag: sie durch die Vorbedingung ersetzen, die diese Machbarkeit schon
  geprüft hat („erwarteter Effekt ≥ MDE des entscheidenden Fensters"): erfüllt für 4 Pp, **nicht erfüllt für die halbe Größe** außer mit dem Ereignis-Mittel.

## 9. Abbruchregeln

Abbruch ohne Urteil, wenn: (1) das Placebo außerhalb ±3 eigener Fehler liegt; (2) die Positivkontrolle unter 65 % bleibt; (3) die Ereigniszahl um mehr
als 1 % von §2 abweicht; (4) ein Skript die Überraschung vor der Registrierung mit einem Ertrag zusammengebracht hat (dann ist die Blindheit gebrochen
und das Papier wertlos); (5) die Tafel oder das Panel eine andere Kennung trägt. Kein Nachjustieren von Zehntel-Grenzen, Haltedauer, Klassen, Schätzer.

## 10. Was als „belegt" gälte — und was nicht

- **Belegt:** das Tor der gewählten Fassung ist für **A und für B netto** bei H = 60 passiert, Placebo und Positivkontrolle bestanden, und **B − M > 0**
  (sonst ist B die Prämie des Meldens, nicht der Überraschung). Auch dann ist es ein Befund über Erträge gegen das Klassenmittel — über echtes Geld
  entscheidet erst §11.
- **Nicht belegt:** A oder B netto verfehlt das Tor **und** die obere 95-%-Schranke von B netto liegt unter 1 Pp über 60 Tage — dann ist der Effekt in
  der handelbaren Größe ausgeschlossen.
- **Nicht entscheidbar:** das Tor ist verfehlt, aber die obere Schranke liegt über 1 Pp. Das ist bei wahrer halber Größe der wahrscheinlichste Ausgang
  (§8) und muss vor dem Start als möglicher Ausgang akzeptiert sein.
- Nie belegt durch: H = 20 allein, eine einzelne Klasse, ein einzelnes Jahr, die Seite A ohne B.

## 11. Gegen den S&P 500 nach Kosten — zweite Stufe, nur nach „belegt"

B misst gegen das Klassenmittel, nicht gegen den Index, und kennt keine Kapitalbindung. Wilhelms Maßstab braucht ein **Buch**: 40 gleich große Plätze,
jede Meldung des obersten Zehntels belegt zur Eröffnung des Einstiegstags einen freien Platz für 60 Handelstage (sind alle belegt, verfällt sie; die
Reihenfolge am selben Tag nach Annahmezeit), freies Kapital liegt in SPY, Kosten je Umlauf nach §7. Vergleich: dasselbe Kapital durchgehend in SPY, beide
Seiten mit derselben Behandlung der Dividenden, **über die letzten fünf Jahre**, mit Zufallsbereich (dasselbe Buch mit der Zufallszahl statt der
Überraschung, 200 Läufe). Erst wenn das Buch den Index nach Kosten außerhalb dieses Bereichs schlägt, folgt der Vorwärtstest von einigen Monaten — und
erst danach die Frage nach echtem Geld. Diese Stufe wird gesondert registriert.

## 12. Was Wilhelm bzw. der PM vor einer Registrierung entscheiden müsste

1. **Überhaupt messen?** Auflösbar ist die alte Effektgröße; für die halbe reicht es nur knapp und nur mit dem Ereignis-Mittel.
2. **Fassung 1 oder 2** (§8) — und damit, ob die Projektregel „4 × MDE" für diese Studie ersetzt wird.
3. **Schätzer** (§5): Tagesmittel nach Wortlaut oder Ereignis-Mittel.
4. **2016 dazunehmen?** Dafür müsste die 250-Vortage-Regel des Universums für diese Studie gelockert werden (geschätzt 1.500 bis 2.000 Ereignisse mehr im dünnen Fenster; nicht gezählt).
5. **Die 203 Firmen mit CIK-Wechsel** (darunter XOM) vorher in der Tafel nachziehen oder als bekannte Lücke stehen lassen.
