---
tags: [betrieb, werkzeuge]
---
# OmniRoute: Kostenrechnung „Aufgaben auslagern" (18.09.2026)

Wilhelms Frage: kann der PM Aufgaben an OmniRoute auslagern — und was hätte das in der letzten Woche gespart?
Antwort vorab: **technisch ja, netto etwa 4–5 % der Agenten-Token, ≈ 150–200k je Woche.** Das lohnt heute nicht; es
lohnt, sobald eine echte Massen-Textaufgabe ansteht (Beispiel unten).

## 1. Was auslagerbar ist — und was nicht

Auslagerbar an ein fremdes Modell hinter OmniRoute (OpenAI-artige Schnittstelle auf Port 20128):
**Lesen und Verdichten von Rohmaterial** (fremde Dokumentation, Skill-Dateien, Filings), **Klassifizieren vieler kurzer
Texte** (Grund einer Abmeldung aus einem 8-K), **Übersetzen**, **Erstentwürfe von Tabellen** aus vorhandenen Daten.
Nicht auslagerbar: Messungen, Code mit Sperrklinken, Urteile, Vorregistrierungen, Übergaben, Wiki — alles, was die
Fehlerformen-Seite als „Detail, das den Unterschied macht" beschreibt. Jede ausgelagerte Antwort muss vom Agenten
gelesen und geprüft werden; dieser Lese- und Prüfaufwand frisst einen Teil der Ersparnis (Ansatz: 40–60 % des
ausgelagerten Volumens kommen als zu prüfende Antwort zurück).

## 2. Die Woche 11.–18.09. nachgerechnet

Verbrauch je Agenten-Sitzung: bis 16.09. Selbstschätzung der Übergabe (liegt um den Faktor ~2 zu tief, siehe
`ponytail-probe.md`), ab 18.09. Abrechnung. Der Anteil „auslagerbar" ist die Einschätzung des PM nach Lesen der Übergabe.

| Sitzung | Verbrauch | Art der Arbeit | auslagerbar | Token |
|---|---:|---|---:|---:|
| trendwende-ii-nachtrag3/4/5, klassen | 424k | Messung, Auswertung, Berichte | 5 % | 21k |
| updater-paket | 220k | Electron-Code, Tests | 5 % | 11k |
| verschwundene-gruende | 105k | EDGAR-Texte zu 4.996 Reihen klassifizieren | 30 % | 32k |
| querschnitt-pruefstand teil1 | 450k | Messmaschine bauen | 5 % | 22k |
| querschnitt-pruefstand teil2/3/4 | 820k | Messungen, French-Abgleich, Berichte | 5 % | 41k |
| chancen-karte | 320k | Bigdata-Rohdaten lesen und verdichten | 25 % | 80k |
| fundamental-machbarkeit | 125k | SEC-Dokumentation lesen, Stichproben | 20 % | 25k |
| fundamentaltafel | 253k | Datenbau, Leser, Tests | 5 % | 13k |
| panel-rueckwaerts-splits | 490k (Abr.) | Ursache, Reparatur, Neubau, Vergleich | 5 % | 25k |
| werkzeuge-uebernahme | 406k (Abr.) | 25 Skills lesen (≈110k), anpassen, Tabellen | 18 % | 73k |
| omniroute-backup + native | 323k (Abr.) | Installation, Probelauf, Doku | 0 % | 0 |
| **Summe** | **≈ 3,9 M** | | **≈ 9 %** | **≈ 343k** |

Ohne Angabe (nicht gezählt): pr-text-paket-qs, release-wache; der PM selbst (Prüfen, Aufträge, Wiki — nichts davon
auslagerbar). Rechnet man die Selbstschätzungen auf die Abrechnung hoch (×1,5–2), liegt die Woche bei 5–7 M Token; der
auslagerbare Anteil bleibt bei ≈ 9 %, weil er mitskaliert.

**Netto:** 343k ausgelagert, davon kommen 40–60 % als Antwort zurück, die gelesen und geprüft werden muss, dazu der
Auftragstext je Teilaufgabe → **Ersparnis ≈ 150–200k je Woche, 4–5 % des Agenten-Verbrauchs.** Die Ersparnis zählt
nur, wenn die Abo-Grenze der Claude-Nutzung erreicht wird — Token, die nicht an der Grenze fehlen, sind nichts wert.

## 3. Was auf der anderen Seite steht

- **Qualität:** Die Fehlerformen dieser Woche saßen in Details (2·K in der Spiegelsumme, 94 statt 53 geänderte Zeilen,
  47 Split-Sätze ohne Sprung). Ein Verdichter, der Details weglässt, spart Token und kostet den Fund.
- **Daten verlassen den Rechner:** Repo- und Studiendaten sind öffentlich bzw. unkritisch; Mühlwerk, Schlüssel, Kontodaten
  nie. Eine Datenschranke im Brückenwerkzeug wäre Pflicht.
- **Nutzungsbedingungen:** Das Projekt selbst stuft viele Gratis-Anbieter als `caution` oder `avoid` ein
  (`docs/reference/FREE_TIERS.md`, Stand 02.09.2026): Mistral („nur persönliche Zwecke", 1 Mrd Token/Monat), Groq (kein
  Weiterverkauf, 30 M/Monat), Gemini (Flash-Familie, ratenbegrenzt, „für Entwickler"), OpenRouter (50 Anfragen/Tag gratis,
  1.000 mit einmalig 10 $). Persönlicher Gebrauch ist bei den meisten erlaubt; Kapazität wäre kein Engpass (Bedarf
  ≈ 1,5 M/Monat).
- **Betrieb:** ein zweites Modell, das beaufsichtigt werden muss; OmniRoute lauscht ab Werk auf 0.0.0.0 ohne Auth
  (`omniroute-backup.md`); die Installation liegt nur im MSIX-Overlay der Claude-App.

## 4. Wann es sich lohnen würde

Sobald eine **Massen-Textaufgabe** ansteht, deren Rohmaterial die Kontexte sprengt: die zurückgestellte Ereignisstudie
(EDGAR Form 4 / 8-K über Zehntausende Meldungen klassifizieren) oder eine Bilanz-Textauswertung über alle 6.003 CIKs.
Dort ginge es um Millionen Token je Lauf, und die Klassifikation ist prüfbar (Stichprobe gegen Handarbeit). Dann:
Anbieter durch Wilhelm, Brücke mit Datenschranke und Stichproben-Prüfung, Vorregistrierung der Prüfquote.

## 5. Empfehlung

Heute **kein Anbieter**. Backup bleibt Backup. Wieder aufrufen, wenn ein Auftrag der Art aus §4 kommt — dann ist die
Rechnung eine andere (Ersparnis > 50 % des Auftrags statt 5 % der Woche).
