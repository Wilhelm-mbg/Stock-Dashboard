# Analytiker-Befund, Nacht auf den 26.08.2026 — zweiter Lauf (23:36)

Geprüft: Wächterprüfungen A–C und E (verkürzt, da seit dem ersten Lauf heute Nacht
weder App-Code noch Messmaschine noch Archiv geändert wurden — nur Tafel, Tüftler-Studien
und Release-Werkzeug, geprüft per `git diff 8142ada..87eeadf`), dazu der vertiefte
Block **F, Rotationspunkt 1: Kontrollgruppen-Konstruktion / A7-Lesefenster**.

## F. Methodenkritik: A7-Lesefenster — **Methode trägt**, drei Funde am Rand

Unabhängige Gegenprobe (nicht `test-messmaschine.js`, eigener Aufbau):
`a7-gegenprobe.js` + `a7-gegenprobe-ausgabe.txt` in diesem Ordner.

**Kern-Urteil: die A7-Konstruktion trägt.**

1. **Ausschnitt-Arithmetik exakt.** `erwartung(sym, schicht, hälfte, von, bis)` gegen
   eine Brute-Force-Rechnung auf einem Kunstuniversum: 20 Fälle, größte Abweichung
   0,00e+0. Die Untergrenze `i−lese−H` (F2-Erweiterung: eine Kontrollkerze j trägt die
   Rendite über (j, j+H] und berührt das Lesefenster schon ab j = i−lese−H) und die
   Obergrenze `i+H−1` (Ergebnis-Überlappung) sind beide nachgerechnet richtig; die
   20-Restkerzen-Regel liefert null statt eines stillen Dünnmittels.
2. **Ende-zu-Ende-Nullpunkt.** Rücksetzer-Köder (feuert, wenn die letzten 30 Kerzen
   ≤ −2 % liefen) auf iid-Zufallspfaden (20 Symbole × 3.200 Kerzen, fester LCG-Seed,
   wahrer Überschuss exakt 0): mit A7-Fenster +0,0065 Pp bei MDE 0,0377 Pp (t 0,34,
   7.062 Signale / 228 Bestätigungstage) → Nullpunkt im Rahmen, Urteil
   nicht-entscheidbar. Ohne Fensterangabe warnt die Maschine (A7-Warnung vorhanden);
   die A6-Verschiebung war dort +0,0064 Pp (bei iid-Daten klein, wie erwartet).
3. **Strategie-Deklarationen stimmen.** Alle 11 Module deklarieren `leseFensterKerzen`
   ≥ tatsächliche Lesetiefe (winkelbestaetigt deklariert eine Kerze mehr als nötig —
   konservativ, unschädlich).
4. Maschinen-eigene Testsuite (`test-messmaschine.js`): alle Tests bestanden.

**Fund F-1 (Issue): `aussicht` (Tage bis t=2) feuert nie.** `messmaschine.js:1110`
prüft `u.sd > 0`, aber `block()` (Z. 891–897) gibt kein Feld `sd` zurück — die
Bedingung ist immer falsch. Beleg: alle Protokolle unter `protokolle/` führen
`"aussicht": null`, auch kapitulation (Bestätigung +1,071 Pp je Signal, t 2,14) und
rsi2seit-mcp (t 2,01), wo der Code sie laut eigenem Kommentar („nur, wenn der
Punktschätzer positiv ist") liefern müsste; in der Gegenprobe live reproduziert
(2 positive Urteile, 0 mit aussicht). `messen.js:95` hat die Ausgabezeile
(„bis t=2 mit 80 %: N Tage") — sie ist nie gedruckt worden. Fällt geschlossen aus
(keine falsche Zahl), aber es ist genau die Planungszahl, an der die
Auflösungswand-Arbeit hängt.

**Fund F-2 (Issue): A7-Protokolltext nennt das falsche Ausschlussfenster.**
`messmaschine.js:738` schreibt in die Entscheidung „Topf OHNE die Kerzen
[i−lese, i+H−1]“; gerechnet wird (richtig) [i−lese−H, i+H−1] (Z. 873–875, F2).
Der Entscheidungsweg soll laut Kopfkommentar „als Daten vorliegen“ — hier beschreibt
er ein anderes (schwächeres) Verfahren als das ausgeführte. Steht so in jedem
bisherigen Protokoll.

**Fund F-3 (Issue): der Placebo-Lauf ignoriert die Einstiegskonvention.**
`placeboLauf` (messmaschine.js:515) rechnet immer Schluss(i)→Schluss(i+H), während
Signalpfad und beide Kontrollen der Konvention folgen (`einstiegKurs`, Z. 133); der
Zweig-N-Kommentar (Z. 130) verspricht ausdrücklich „Der Schalter gilt fuer das Signal
UND BEIDE KONTROLLEN“. Bei `folgeEroeffnung` misst der Placebo dann
E[Schluss(i)→Schluss(i+H)] − E[Eröffnung(i+1)→Schluss(i+H)] = die mittlere
Übernachtlücke — ein systematischer Schein-Überschuss, obwohl der wahre Wert null
ist. Heute latent (kein Strategiemodul nutzt die Konvention), aber **die frisch
vorregistrierte `glockendruck-nacht` (Zweig T) verlangt `folgeEroeffnung`
ausdrücklich** — und bei H=1 auf archiv1d liegt die mittlere Übernachtlücke in der
Größenordnung der gesuchten Kante selbst. Der Nullpunktwächter (`placeboOk` gatet
das Urteil „bestaetigt") wäre genau für diese Studie verschoben. Gegenprobe zur
Bestätigung des Fundes: ein Placebo-Lauf mit `folgeEroeffnung` auf beliebigem Archiv
mit Eröffnungskursen muss heute einen Überschuss ≈ mittlere Übernachtlücke zeigen;
nach der Reparatur (Placebo benutzt `einstiegKurs` mit derselben Konvention) null.
Gehört zwingend zum Auftrag „ausstieg-Schalter der Maschine" aus der
Tüftler-Warteschlange dazu.

## A. Code gegen Protokoll — Übertrag, kein neuer Fund

Seit dem ersten Lauf heute Nacht keine Änderung an App-Code oder Protokollen
(git-Diff nur Tafel/Studien/Release-Werkzeug). #84 („belegt“-Prosa) bleibt offen und
ist als Auftrag auf der Tafel. Messmaschinen-Version weiterhin „1.0.0“ bei
ungekoppeltem Code — der Versionierungs-Auftrag liegt beim App-Codebase Master;
solange er offen ist, gilt: Protokolle vom 23.–25.08. stammen aus teils
verschiedenen Maschinenständen und sind nur über die Entscheidungslisten
vergleichbar, nicht über die Versionsnummer.

## B. Placebo — bestanden (Kunstarchiv), Realarchiv unverändert

Das Realarchiv ist seit dem sauberen Placebo des ersten Laufs (t −0,10) unverändert
(endet 24.08.); eine Wiederholung wäre identisch. Stattdessen lief der Placebo der
Maschine auf dem Kunstarchiv der Gegenprobe: −0,0157 Pp, t −0,94, MDE 0,0335 Pp —
im Rahmen. Bekannte Deckungslücken (Stop-Ausstiege; schritt=1 bei breiten Sonden)
bleiben notiert für die F-Rotation „Placebo-Abdeckung“.

## C. Live gleich Messung — bestanden (Übertrag + Stichprobe)

Store der installierten App: intraday.mode rsi2seit, 60m, period 20, confirmBps 15,
scalpHold 480 (= 8 Kerzen), instrument basis, kapiZusatz an, regimeZuteilung an —
unverändert gegen den ersten Lauf und deckungsgleich mit der Messkonfiguration.
Kein App-Code geändert seit dem grün getesteten Stand v8.33.0-6-g8142ada.

## D. (nicht dran; Notiz zur neuen Vorregistrierung)

`glockendruck-nacht` (Tüftler, heute Nacht) methodisch gesichtet, nicht gemessen:
Beharrlichkeits-Ausschluss des ersten Entwurfs ist genau die A7-Logik, Signalanteil
vorab gezählt (19,8 %), Testzahl 2 mit Rücknahmeregel über Zweig T — sauber
aufgesetzt. Aber: Zweig T hängt an `folgeEroeffnung` → Fund F-3 ist Vorbedingung,
zusätzlich zu #85 (laufende Stempel-Kerze betrifft laut Tüftler-Messung auch
archiv1d) und dem `ausstieg`-Schalter (Zweig N braucht Ausstieg zur Eröffnung, nicht
zum Schluss). Drei Vorbedingungen, bevor diese Messung laufen kann.

## E. Annahmen-Drift — unverändert

Kostenmessung Demo-Konto: weiterhin genau 1 Runde (0,042 %) — keine Aussage möglich,
kein Drift-Urteil. Nichts Neues seit dem ersten Lauf.

## Maßstäbe dieses Laufs

Gegenprobe: 7.062 Signale über 228 Tage geclustert, MDE ausgewiesen (0,0377 Pp),
1 Köder-Test je Fassung (mit/ohne Fenster), deterministischer Seed, Kunstarchiv mit
wahrem Wert null. Brute-Force-Abgleich: 20 Fälle, Toleranz 1e−12. Keine Kante neu
beurteilt (keine neuen Handelstage im Archiv). Nächster F-Rotationspunkt:
**Signifikanz-Rechnung und Testzahl-Korrektur** (Bonferroni/normInv,
Newey-West-Verzögerungswahl H−1 in Tagen gegen Kerzen — dort liegt eine offene
Frage: auf 60m überlappen H−1=7 Kerzen nur ~1–2 Handelstage, die Korrektur läuft
aber über 7 Tages-Verzögerungen; vermutlich konservativ, nachzurechnen).
