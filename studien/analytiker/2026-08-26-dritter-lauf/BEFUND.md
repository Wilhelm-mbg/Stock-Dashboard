# Analytiker-Befund, 26.08.2026, dritter Lauf (03:15, regulärer Termin)

Geprüft: Wächterprüfungen A–C und E mit Schwerpunkt auf den Änderungen der Nacht
(Archiv-Reinigung #85 `4e36674`, Maschinen-Reparaturen #86/#87/#88 `ade84ec`,
Versionierung `118ad72`, UI-Umzug #83/#89 `79a505b`, Theme `2d90433`), dazu der
vertiefte Block **F, Rotationspunkt 2: Signifikanz-Rechnung und Testzahl-Korrektur**
— einschließlich der offenen Frage des zweiten Laufs (Newey-West-Verzögerung H−1
in Kerzen auf einer Tages-Reihe).

## F. Methodenkritik: Signifikanz-Rechnung — **Methode trägt**, ein Fund

Unabhängige Gegenprobe (eigener Aufbau, nicht `test-messmaschine.js`):
`f2-signifikanz.js` + `f2-signifikanz-ausgabe.txt` in diesem Ordner. Referenz für
die Normalquantile ist eine eigene, hochgenaue Implementierung (erfc über die
unvollständige Gammafunktion, Newton-Verfeinerung; Selbstkontrolle an drei
Literaturwerten: |Abw| ≤ 4,3e−14).

1. **`normInv`/`bonferroniSchwelle` exakt.** 11 Stützstellen von tests=1 bis
   tests=3372: größte Abweichung 3,6e−9 — für jede hier denkbare Testzahl weit
   unterhalb jeder Relevanz.
2. **Alle 21 abgelegten Protokolle:** B4-Schwelle aus `tests` unabhängig
   nachgerechnet, 0 Abweichungen. Testzahlen real 1–7; die Testfamilien-Erhöhung
   (`testfamilie.testsGesamt`) greift, wo deklariert.
3. **Die offene Frage des zweiten Laufs ist beantwortet: die Verzögerungswahl
   H−1 in KERZEN auf der TAGES-Reihe ist unschädlich.** Simulation des echten
   Erzeugungsprozesses (252 Tage × 7 Kerzen, iid, H=8 ⇒ Nachbartage teilen genau
   1 Kerze; 4.000 Wiederholungen, fester Seed): Verwerfungsrate unter der
   Nullhypothese naiv (L=0) 8,28 %, tagesrichtig (L=1) 6,45 %, Maschine (L=7)
   6,25 % — die Maschine liegt sogar näher an der Nominalrate als die
   tagesrichtige Wahl, weil die Bartlett-Gewichte bei größerem L die erste
   Autokovarianz weniger stauchen. Preis: der Standardfehler streut stärker
   (0,0205 gegen 0,0108). Die Vermutung „vermutlich konservativ" war falsch
   herum, aber folgenlos. Bei dünn gesäten Signaltagen (jeder 2. Tag, keine
   echte Überlappung) kostet die überzählige Korrektur 6,70 % statt 5 % —
   hinnehmbar, notiert. Die leichte Über-Verwerfung ~6 % aller Varianten ist der
   bekannte Endlichkeits-Effekt von Newey-West plus Normal- statt t-Quantil,
   kein Konstruktionsfehler.
4. **Nebenbefunde beziffert:** Autokovarianz-Teiler n−k statt n bei n=250, k=7:
   Faktor 1,029, vernachlässigbar; der Rückfall bei negativer Langfristvarianz
   nimmt die unkorrigierte (größere) Varianz — vorsichtige Richtung.

**Fund F2-1 (Issue #91): `aussicht.tage80` rechnet gegen t=2, das Urteil fällt
gegen die Bonferroni-Schwelle.** `messmaschine.js:1169` benutzt
`VERFAHREN.zAlpha` (1,96); bestätigt wird aber erst ab `schwelle`
(`bonferroniSchwelle(P.tests)`, Z. 1110–1133) — bei den real abgelegten Läufen
2,24–2,69 (16 von 21 Protokollen haben tests>1). Die Planungszahl untertreibt
die nötigen Tage um Faktor ((schwelle+z80)/(1,96+z80))²: 21 % bei tests=2, 33 %
bei 3, 42 % bei 4, 59 % bei tests=7. Der eigene Kommentar der Stelle setzt den
Maßstab („dieselbe Frage …, die später wirklich entschieden wird") — und
`delta80` zwei Bildschirmseiten darüber benutzt die Schwelle bereits richtig;
die beiden Planungszahlen widersprechen sich. Brisant, weil #86 die `aussicht`
gerade zum Feuern gebracht hat und die Neumessung aller zwölf Strategien
bevorsteht: jedes Protokoll mit Varianten bekäme eine zu optimistische
Tage-bis-Urteil-Zahl für die Auflösungswand-Planung. Gegenprobe: in Z. 1169
`schwelle` statt `VERFAHREN.zAlpha` einsetzen; für tests=1 ändert sich nichts,
für tests=7 muss tage80 um ×1,59 wachsen.

## A. Code gegen Protokoll — bestanden

Der UI-Umzug `79a505b` (`bestandui.js`, Signalstand-Spalten nach Vermögen)
enthält keinerlei Belegtexte (grep auf urteil/belegt/bestaetigt: 0 Treffer im
Anzeigetext). Die Kanten-Kette der Oberfläche läuft weiter ausschließlich über
`PROTOKOLL_KANTE` ← `readProtokolle()` (depot.js:720 ff.); „belegt" wird nur bei
`urteil === 'bestaetigt'` gezeigt (depot.js:6231). Theme-Umbau `2d90433` berührt
keine Behauptungen. Neue Protokolle tragen `version` 1.1.0 **und** `codeStand`
(im Placebo-Protokoll dieser Nacht sichtbar: `adb9a60568fd`) — die
Versionierungs-Zusage aus `118ad72` ist damit im Protokoll angekommen, nicht nur
im Code.

## B. Placebo — bestanden, #88-Reparatur von außen bestätigt

Erster frischer Placebo auf dem **gereinigten** Realarchiv (nach #85; geprüft:
letzte Kerze trägt Sekunde 0, keine laufende Quote-Stempel-Kerze mehr) mit
Maschine **1.1.0**: 2.874 Werte, 730 Handelstage, 334.715 Signale.

- Konvention `schlusskerze`: Überschuss **−0,0080 Pp, t −0,11** (MDE 0,1479 Pp) — im Rahmen.
- Konvention `folgeEroeffnung`: Überschuss **−0,0091 Pp, t −0,13**; eingebauter
  Placebo der Maschine **−0,0032 Pp, t −0,06**. Genau dieser Pfad hätte vor
  `ade84ec` die mittlere Übernachtlücke als Schein-Überschuss gemessen — die
  #88-Reparatur hält damit auch der externen Gegenprobe stand.

Protokolle in diesem Ordner (`analytiker-placebo-*.json`).

## C. Live gleich Messung — bestanden

Store der installierten App unverändert und deckungsgleich mit der
Messkonfiguration: mode rsi2seit, 60m, period 20, confirmBps 15, scalpHold 480
(= 8 Kerzen), instrument basis, kapiZusatz an, regimeZuteilung an. Die
Code-Änderungen der Nacht (UI/Theme) sind nicht ausgeliefert; Live läuft auf
v8.33.2 — kein Konflikt zwischen Live-Pfad und Messung.

## D. (nicht dran) — keine frischen Tage

Beide Archive enden am 24.08. (60m und 1d geprüft); seit der letzten
Kanten-Neuberechnung ist kein Handelstag hinzugekommen, eine Neuberechnung wäre
identisch. Vorregistrierungen: rsi2seit-mcp V4 wartet auf frische Tage;
`glockendruck-nacht` wartet weiter auf den `ausstieg`-Schalter (Zweig N) — #85
und #88 sind als Vorbedingungen seit heute Nacht erfüllt.

## E. Annahmen-Drift — unverändert

Kostenmessung Demo-Konto: weiterhin genau 1 Runde (AAPL, 0,042 %) — keine
Aussage, kein Drift-Urteil. Spannen-Proben im Store aktuell (sieben Werte,
0,031–0,057 %), im Rahmen der 0,10-%-Annahme.

## Maßstäbe dieses Laufs

MDE vor jedem Urteil ausgewiesen (Placebo 0,1479/0,1350 Pp; Simulation:
Nominalrate 5 % als Maßstab). Testzahl: 11 Quantil-Stützstellen, 21 Protokolle,
2 Placebo-Läufe, 3 Simulationsvarianten × 4.000 Wiederholungen, fester Seed.
Clusterung über Tage überall (Placebo: 730 Tage; Simulation: Tagesreihen).
Kein Code, kein Test, keine Konfiguration geändert. Nächste Nacht: **D
(Kanten-Neuberechnung), falls frische Handelstage im Archiv sind — sonst
F-Rotation Punkt 3 (Clusterung über Tage)**; in der Nacht auf Sonntag D
vollständig.
