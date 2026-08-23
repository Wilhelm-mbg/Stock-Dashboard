# Fehlertypen, gegen die die Messmaschine geprüft ist

Jeder Eintrag ist ein Fehler, der am 23.08.2026 in einer echten Messung dieses
Projekts vorgekommen ist — in Skripten des Autors, in Agentenarbeit oder in der
App selbst. Für jeden gibt es in `test-messmaschine.js` einen Testfall, der die
Maschine mit genau diesem Fehler füttert und prüft, dass sie ihn **erkennt oder
unmöglich macht**. Kein neuer Fehlertyp wird ohne Testfall aufgenommen.

Die Maschine ist nicht klug. Sie ist nur an diesen Stellen schon einmal gestolpert.

## A — Kontrolle

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| A1 | Keine Kontrolle: Rohrendite als Kante gemeldet | +0,073 Pp „nach Spanne" ohne Vergleich; 62 % davon waren Halten | Kontrolle ist Pflichtbestandteil jeder Auswertung, kein Schalter |
| A2 | Kontrolle aus **einer** Zufallsziehung | Streuung 3,88 Pp statt 0,79; Maximum wanderte zwischen Läufen | Kontrolle ist die Erwartung über **alle** Kerzen desselben Symbols zur selben Stunde — deterministisch, kein Zufall |
| A3 | Kontrolle nicht gepaart: Listen verschieden sortiert, Paarung über Index | nur 0,6 % gleiches Symbol | Kontrolle wird **je Signal** aus dessen Symbol und Stunde nachgeschlagen, nie über Listenindex |
| A4 | Kontrolle liegt zeitlich **vor** dem Ereignis | Ersatzeinstieg zur Hälfte vor der Meldung, maß den Anlauf | Kontrolle nutzt nur die Tageszeit, nie einen Zeitpunkt relativ zum Signal |
| A5 | Kontrolle aus anderer Zeithälfte als das Signal | 50,5 % der Kontrollkerzen aus der jeweils anderen Hälfte | Kontrollerwartung wird **je Hälfte** getrennt gebildet |

## B — Statistik

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| B1 | t über Einzelsignale statt über Tage | bläht t um Faktor 2–3 auf | t wird **nur** über Tagesmittel gerechnet; ein Signal-t gibt es nicht |
| B2 | Tagesmittel gleichgewichtet als „Erwartung je Handel" gelesen | +0,066 (Tage) vs. +0,0115 (je Signal); 4 von 5 Zeilen kippten das Vorzeichen | Beide Zahlen werden ausgewiesen und **benannt**: „Teststatistik (Tage)" und „Erwartung je Handel (Signale)" |
| B3 | MDE fehlt → „kein Effekt" statt „nicht entscheidbar" | „traegt" ohne Test in neue-lage.js | MDE steht **vor** dem Urteil; unter MDE ist das Urteil immer „nicht entscheidbar" |
| B4 | Zahl der Tests nicht ausgewiesen | 60 Kombinationen gemeldet, ≥370 gerechnet | Jeder Aufruf der Maschine zählt hoch; Bonferroni wird auf die **tatsächliche** Zahl gerechnet und ausgewiesen |
| B5 | Entdeckung und Bestätigung auf denselben Tagen | schutz-messen.js behauptete Trennung, hatte keine | Der Schnitt ist Teil der Signatur; ohne Bestätigungszeitraum kein Urteil |
| B6 | Bonferroni auf das volle t statt auf die Bestätigung | „verfehlt |t| > 3,34 (t = 2,29)" auf voller Achse, Bestätigung hatte t = 1,40 | Schwelle wird auf den **Bestätigungs**-t angewandt |
| B7 | Nachträgliches Weglassen von Fällen, das das Ergebnis macht | „ohne die zwei Crash-Tage +0,40" | Teilmengen nur, wenn sie in der Vorregistrierung stehen; sonst verweigert |

## C — Einheiten und Zeit

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| C1 | Haltedauer in Wanduhrzeit statt Kerzen | 480 Min über Nacht = 1 Kerze statt 8 | Haltedauer ist **immer** eine Kerzenzahl; Minuten werden nicht akzeptiert |
| C2 | Nächte als Handelstagswechsel statt Kalendernächte | Faktor 1,45 in ausgeliefertem Code | Nächte werden aus Zeitstempeln gezählt (Kalendertage) |
| C3 | Doppelte Prozentumrechnung | 54,4 % → „5.444 %" | Alle Renditen intern als Anteil; Prozent nur in der Ausgabe, einmal |
| C4 | Handelstage als Kalendertage | 252/365-Näherung | Handelstage werden aus der Achse gezählt |
| C5 | Kosten doppelt abgezogen | Netto-Spalte nochmal um Hürde gemindert | Kosten werden **einmal** an **einer** Stelle abgezogen; Brutto und Netto sind getrennte Felder |

## D — Gemessenes Objekt ≠ implementiertes Objekt

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| D1 | Filter im Skript anders als in der App | Umsatz der Signalkerze ×6,5 statt Tagesmittel; t −1,61 → −0,20 | Filter kommen aus **quant.js/depot.js**, nicht aus Nachbildungen; wo nicht möglich, steht „Nachbildung" im Protokoll |
| D2 | Drei Werte für dieselbe Kante in Umlauf | 0,11 / 0,147 / 0,170 | Das Protokoll ist die **einzige** Quelle; die App liest es, rechnet nichts selbst |
| D3 | Konfiguration stillschweigend gewechselt | `instrument:'schein'` mit Kommentar „Voreinstellung" (war `basis`) | Konfiguration steht vollständig im Protokoll; Abweichung von der App-Voreinstellung wird ausgewiesen |
| D4 | Feste Annahmen, die das Ergebnis tragen | Basiswert 200 $, Vola 0,30 fest verdrahtet; Hürde schwankt Faktor 2 | Annahmen stehen als Felder im Protokoll, nicht als Konstanten im Code |
| D5 | Zeitzone: Datum ohne Uhrzeit als „vor Börsenschluss" | 59,8 % der Termine; 14,07 → 8,44 % p.a. | Termine ohne Uhrzeit gelten als **nach** Schluss (konservativ) und werden gezählt |

## E — Reichweite

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| E1 | Überlebensverzerrung nicht benannt | in keiner Schutzmechanismus-Messung erwähnt | Pflichtfeld: Universum-Herkunft und Stichtag der Auswahl |
| E2 | Von 10 Werten auf 191 verallgemeinert | Stabilitätsaussage der Kanalerkennung | Zahl der Werte und Signale steht in jeder Aussage |
| E3 | Behauptung ohne Skript | „17 Jahre" aus falsch gewichteter Aussicht | Jede Zahl im Protokoll trägt den Namen der Funktion, die sie erzeugt hat |
