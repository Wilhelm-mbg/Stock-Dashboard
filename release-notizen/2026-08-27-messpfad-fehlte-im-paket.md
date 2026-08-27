# Defekt: Der Messpfad war im ausgelieferten Paket nicht lauffähig

**Art:** Fehlerbehebung (Regression aus v8.34.1) · **Rolle:** Berechnungen ·
gefunden von der Release-Wache, gemessen und behoben am 27.08.2026.

## Was kaputt war

`studien/messmaschine/strategien/wertpapierart.js` wurde **nicht mitgeliefert** —
`build.files` nahm aus dem Studien-Ordner nur die zwei Maschinendateien. Seit
v8.34.1 lädt die Messmaschine diese Datei aber bei jedem Lauf (Integritätsschranke:
ohne Wertpapier-Klassifizierung würde der Universumsfilter alles durchlassen).

**Wirkung in der installierten App:** Wer im Baukasten eine Strategie ablegte und
»Jetzt messen« drückte, bekam statt einer Messung einen Abbruch mit
MODULE_NOT_FOUND. Kein App-Absturz, kein Datenverlust — der Fehler trat im
Unterprozess auf und wurde als »Die Messung ist nicht durchgelaufen« angezeigt.
Messungen aus dem Projektordner waren nie betroffen (dort existiert die Datei).

**Reichweite:** v8.34.1 und v8.34.2. v8.34.0 hatte den Defekt noch nicht — die
Schranke kam erst danach hinzu. Kein Automat und keine geplante Aufgabe benutzte
den Pfad; der Defekt war also ausgeliefert, aber ruhend.

## Was geändert wurde

1. **`build.files` nimmt die eine benötigte Datei mit** — nicht den ganzen
   Strategien-Ordner. Der App-Pfad lädt die zu messende Strategie aus dem
   Datenordner, nicht aus dem Paket; gebraucht wird im Paket nur die
   Klassifizierung. `asarUnpack` deckt sie über das bestehende Muster ab.
2. **Die Schranke stürzt nicht mehr an ihrem eigenen Fall** (Maschine 1.6.2): Die
   Existenz der Datei wird geprüft, **bevor** sie geladen wird; danach wird nichts
   mehr abgefangen. Fehlt sie, verweigert die Maschine mit benanntem Pfad statt
   abzustürzen. Ist sie vorhanden, aber kaputt — oder fehlt **ihr** eine
   Abhängigkeit —, fliegt der Fehler weiterhin laut, statt sich als saubere
   Verweigerung zu tarnen.
3. **`tools/release.js`** kennt die Datei jetzt als paketrelevant; sonst wäre sie
   still aus der Release-Prüfung gefallen.

## Was verhindert, dass es wiederkommt

Eine neue Sperrklinke in der Testsuite **baut das Paket nach und probiert es aus**:
Sie kopiert genau die von `build.files` getroffenen Dateien in einen leeren Ordner
und lässt dort einen Messlauf starten. Fehlt eine Datei, die der Messpfad braucht,
schlägt sie an — unabhängig davon, über welches `require` sie geladen wird.

Ein erster Entwurf hatte stattdessen die Abhängigkeitskette statisch nachgebaut.
Eine adversarische Gegenprüfung hat ihn verworfen: Er übersah sechs Ladeformen
(u. a. `module.require`, aliasierte `require`, JSON über eine Ordner-Regel, per
`readFileSync` gelesene Dateien) — und, schwerwiegender, **vier von fünf plausiblen
Reparaturen hätten ihn rot gemacht.** Ein Test, der die Reparatur blockiert, ist
schlimmer als keiner. Die jetzige Form ist gegen alle fünf Reparaturformen geprüft
(6/6: Defekt rot, jede Reparatur grün).

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
