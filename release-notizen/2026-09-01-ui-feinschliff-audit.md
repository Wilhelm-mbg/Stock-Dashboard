# UI-Feinschliff: alle 16 Audit-Punkte abgearbeitet

**Art:** Oberflächen-Feinschliff + kleine Funktionsergänzungen · **Rolle:** Oberfläche ·
01.09.2026, sieben Commits nach Wilhelms Auftrag „arbeite alles ab" zur Audit-Liste
vom Vortag. Kein Handelspfad berührt.

## Behoben

- **Sechs tote Wegweiser** auf die alte Pillen-Struktur (Regeln → Intraday/
  Autopilot/Regelbuch, „Stell oben ein") repariert; die Wegweiser-Sperrklinke
  prüft jetzt auch nackte Pfeil-Pfade („X → Y") gegen echte Reiter-/Pillen-Namen.
- **Chips brechen nicht mehr** mitten im Rahmen (inline-block); Selects hängen am
  Zellenrand, die belegt-box hat 200-px-Spalten (kein abgeschnittener Text mehr).
- **Antwort-Seite ohne Wortlaut-Doppel:** eigene Präsens-Sätze (`tut`-Feld);
  Überblick-Panel zur schlanken Zeile; „Gemessene Voreinstellungen" wohnt jetzt
  unter Risiko & Einstellungen.
- **Risiko & Einstellungen** hat drei Abschnittsköpfe + Sprungleiste (ohne
  Scroll-Animation); im **Werkzeug** steht der Chart zuerst, Regelbuch zuletzt.
- **Messung:** Klarbeschreibung (grund-Halbsatz) neben der Kennung; Hilfsdateien
  der Maschine (wertpapierart, tageshilfen …) nicht mehr als „nie gemessene
  Strategie" gelistet (Unterscheider ist der key-Export-Vertrag, Fußzeile zählt
  sie); leere Läufe/Zuletzt-Spalten erscheinen erst mit dem ersten Protokoll.
- **Vermögen:** Simnote nennt die echten Bereiche; Bücher-Absatz wortgleich
  hinter den i-Knopf (vermoegen.buecher).
- **Thema „System"** als dritter Zustand (folgt dem OS, auch zur Laufzeit).
- **A11y-Rest:** scope="col" in Signal-Monitor/Schattenbuch-Tabelle, sr-only-Klasse.
- **Explorer** zeichnet alle zwölf festen Hex-Farben aus der Token-Palette; neu
  `--series5` in beiden Themen (Kontrast gerechnet: 5,51/5,00 hell, 6,59/6,03 dunkel).
- **Geführter Erststart** (drei Karten, einmalig, nach der Diagnose-Frage).
- **News-Ticker** zeigt bei reduzierter Bewegung einen statischen »-Pfeil.

## Als bereits gelöst befunden (keine Änderung)

Diagnose-Dialog ist modal (Abdunklung, Fokus, Escape — der Erstbefund war ein
Artefakt programmatischer Klicks), Theme-Blitz seit 26.08. behoben (thema.js),
Kachel-Kontrast testgerechnet (Abschnitt 41), Bücher-Cockpit-Tooltip existiert.
Bewusst offen: Renderer-Zusammenschluss drawBig/chart.js (eigenes Vorhaben laut
Struktur-Plan — chart.js kann keine Kerzen).

## Testlage

eslint, test-v6, test-channel grün; Screenshot-Probe über alle 15 Ansichten
(breit + schmal) in isolierter Instanz: Erststart erscheint und schließt, keine
Konsolenfehler, kein H-Scroll. Sperrklinken zweimal am eigenen Code ausgelöst
(RegExp-Methodenname, Kommentar) — Code umformuliert, Klinken unangetastet.
