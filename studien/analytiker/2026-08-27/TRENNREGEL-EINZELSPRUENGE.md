# Trennregel für die 534 Einzelsprünge — Fassung 2 (VOR dem Abruf; Fassung 1 von der eigenen Positivkontrolle widerlegt)

**Widerlegungs-Vermerk (~12:25, vor jedem Abruf für diese Menge):** Fassung 1 nahm an,
WHLRs 16 belegte Splits erschienen als 16 Einzelsprünge und müssten „S = echt"
ergeben. Die Kontrolle fand nur 5 Einzelsprünge und ordnete 3 als U ein — **und der
Fehler lag in der Prämisse, nicht im Code:** ein RÜCKANGEPASSTES Archiv zeigt an
Split-Daten gar keine Sprünge (Gegenprobe: AAPL/NVDA/TSLA mit zusammen ~12 echten
Splits → 0 Sprünge an Split-Daten; AAPLs einziger Sprung überhaupt, 29.09.2000
r=0,48, ist der bekannte reale Kurssturz). **Die Semantik dreht sich damit um:**
ein Sprung, der auf ein Split-Datum fällt, ist in unserem (nachweislich
angepassten) Archiv gerade der ANPASSUNGSFEHLER — exakt die heute früh belegte
BYND/WHLR-1d-Klasse. Der Kontroll-Lauf selbst hat dabei einen bisher unbekannten
Altfall gefunden: WHLR 03.04.2017, Sprung r=8,24 exakt auf dem 8:1-Split — dieselbe
Fehlerklasse, neun Jahre alt. Fassung 1 bleibt unten als Geschichte stehen
(durchgestrichen gedacht); es gilt Fassung 2.

## Fassung 2 — Klassen

| Klasse | Bedingung (mechanisch) | Bedeutung |
|---|---|---|
| **F — Anpassungsfehler-Koinzidenz** | Split-Ereignis ±1 Handelstag, Kursfaktor trifft Sprungfaktor ±10 % (auch invers) | Das Archiv zeigt einen Sprung, den die Anpassung hätte wegglätten müssen → Anpassung fehlt/teilweise an dieser Stelle (BYND/WHLR-Klasse). Richtung benannt: das Archiv weicht vom Ereignis ab. Seltene Fehlklassifikation möglich (echter Marktsprung zufällig am Split-Datum mit passendem Faktor) — als Vorbehalt ausgewiesen. |
| **U — kein Split, unentscheidbar** | kein Split-Match | „Kein Split" ist positiv belegt; ob Markt (AAPL-2000-Klasse), Spin-off, sonstige Maßnahme oder Skalenfehler (RGR-Klasse), können diese Endpunkte nicht wissen. NIE als „RGR-Verdacht" führen. Hinweis-Spalten H-Tick / H-Fenster / H-Extrem wie gehabt. |
| **X — nicht prüfbar** | Abruf fehlgeschlagen | ausweisen. |

## Fassung-2-Kontrollen (gelaufen VOR der Anwendung auf die 275)

- **K1 (muss leer sein):** AAPL/NVDA/TSLA — korrekt angepasste Reihen mit echten
  Splits zeigen 0 Split-koinzidente Sprünge. **Bestanden** (0/0/0; AAPLs
  2000er-Sprung ist U, wie es sein muss).
- **K2 (muss F melden):** WHLR 26.08.2026 ↔ Split 27.08. (der heute früh belegte
  Teilanpassungs-Fehler). **Bestanden** (als Koinzidenz erkannt).
- **K3 (Ertrag der Kontrolle):** WHLR 03.04.2017 ↔ 8:1-Split als F — neuer Altfall
  derselben Klasse, war bisher unbekannt.

---

## Fassung 1 (überholt, zur Dokumentation)


**Analytiker, 27.08.2026, ~12:15 — geschrieben, bevor irgendein Abruf für diese
Menge lief und bevor irgendeine Klassenzahl bekannt ist.** PM-Budget: ~275 Abrufe.
Dritte Kandidatenmenge NEBEN c4s I1 ∪ F1-Verworfene, ausdrücklich so benannt;
Ablage getrennt unter `studien/analytiker/2026-08-27/einzelspruenge/`, nichts
fließt ungefragt in den vorregistrierten Studienordner der Rolle Berechnungen.

## Gegenstand

Alle Sprünge im Tagesarchiv mit Tagesschluss-Faktor ≥ 2 oder ≤ 0,5, die NICHT in
einem I1-Pendel-Paar stecken (Stand der Zählung: 534 Sprünge in 275 Reihen, auf dem
am 27.08. neu geschriebenen archiv1d).

## Der Zeuge und seine Zuständigkeit (Auflage 1 des PM)

Abgerufen wird je Reihe der **Splits-Endpunkt** (Dividenden nicht: eine Bardividende
kann keinen Faktor-2-Sprung erzeugen, und das Budget ist auf ~275 Calls gesetzt).
Der Splits-Endpunkt ist **für Splits zuständig und vollständig genug geprüft**
(AAPL bis 1987, WHLR 16 Einträge, B 2006). Er ist **NICHT zuständig** für:
Spin-offs, Ticker-Neuvergaben, sonstige Kapitalmaßnahmen, echte Marktbewegungen.

## Die Klassen — drei, nicht zwei

| Klasse | Bedingung (mechanisch, keine Ermessensspielräume) | Bedeutung |
|---|---|---|
| **S — Split-belegt** | Ein Split-Ereignis mit Ausführungsdatum ±1 Handelstag der Reihe UND Kursfaktor, der den Sprungfaktor auf ±10 % trifft (auch invers geprüft) | Echter Sprung. Kein Befund. |
| **U — kein Split, Frage offen** | Kein Split-Match | „Hier war kein Split" ist positiv belegt — aber ob der Sprung Markt, Spin-off, sonstige Maßnahme oder Archivfehler ist, **können diese Endpunkte nicht wissen** → **„unentscheidbar mit diesen Endpunkten"**. NIEMALS „RGR-Verdacht" als Urteil. |
| **X — nicht prüfbar** | Abruf fehlgeschlagen oder Reihe nicht auflösbar | Ausweisen, nie in S oder U zählen. |

**Es gibt bewusst KEINE Verdachts-Klasse aus diesem Zeugen allein.** Der RGR-Fall
wurde heute früh nur entscheidbar, weil ein zweites ARCHIV als Zeuge da war; für die
historischen Einzelsprünge fehlt der. Stattdessen bekommt jede U-Zeile **prüfbare
Hinweis-Spalten** (Hinweise, keine Urteile):

- **H-Tick:** Faktor in [1,96..2,04] oder [0,49..0,51] UND Kursniveau < 1 $ am
  Sprungtag → Tick-Raster-Hypothese der Rolle Berechnungen (Sub-Dollar-Kurse im
  1/16-Raster erzeugen mechanisch exakte Zweier-Faktoren).
- **H-Fenster:** Sprungdatum ≥ 2024-08-27 → der 60m-Zweitzeuge wäre verfügbar
  (nachprüfbar, hier nicht ausgeführt).
- **H-Extrem:** Faktor ≥ 4 oder ≤ 0,25 → als reine Marktbewegung sehr selten;
  bleibt trotzdem U, der Hinweis macht ihn nur zur naheliegenden Stichprobe.

## Grundrate (Auflage 2)

Das ausgewiesene Hauptergebnis ist die **Quote S / (S+U)** über alle geprüften
Einzelsprünge — nicht die Liste. Vorab keine Erwartung fixiert außer der Richtung:
liegt die Quote hoch, ist das Archiv im Wesentlichen ehrlich und U eine kurze Liste;
liegt sie niedrig, ist das ein eigenes Problem.

## Positivkontrolle (Auflage 4) — Falsifikationsbedingung

**WHLR trägt 16 echte Einzelsprünge (16 belegte Reverse Splits).** Die Sortierung
muss **alle 16 als S einordnen**, mit den vorhandenen Eichdaten, VOR der Auswertung
der übrigen Reihen. Ordnet sie auch nur einen als U ein, ist die Regel widerlegt und
wird NICHT auf die 275 angewandt, sondern erst repariert und neu geeicht — und die
Reparatur wird im Befund ausgewiesen.

## Was diese Messung ausdrücklich NICHT kann

Spin-offs von Archivfehlern trennen (beide sind U); Ticker-Neuvergaben erkennen
(dafür der Events-Endpunkt, gezielt, über c4s Trennfall-Liste); Sprünge unter
Faktor 2 sehen (Schwelle der Enumeration, deckt z. B. den SITC-Faktor 3,36 ab,
nicht aber kleinere Skalenfehler).
