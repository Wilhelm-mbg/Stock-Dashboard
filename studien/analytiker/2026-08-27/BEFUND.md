# Analytiker — 6. Lauf, 27.08.2026 ~03:15

**Archiv-Lage:** archiv60m frisch (Rückstand 0, 99,7 % auf Stand). **archiv1d wird
gerade geschrieben** (Sperre seit 23:58 UTC, lebender Prozess — der Nachtlauf startete
diesmal ~1¾ h später als üblich und läuft voraussichtlich bis ~03:20 UTC). Alle Prüfungen
dieser Nacht kommen deshalb ohne archiv1d aus; nichts wurde auf dem gemischten Archiv
gemessen.

**Ergebnis in einem Satz: kein Fund.** A, B (ersatzweise), C, D (vollständig über die
12 frischen Protokolle) und E bestanden; eine Abweichung in D ist vollständig erklärt.

---

## A. Code gegen Protokoll — bestanden

- Alle 12 Protokolle vom 26.08. sagen `nicht-entscheidbar` (9), `nicht-bestaetigt`
  (kapitulation, winkelbestaetigt) oder `nicht-messbar` (monatsende-kauf). Kein Protokoll
  sagt `bestaetigt`.
- Die Kanten-Anzeige (`PROTOKOLL_KANTE`, depot.js:754–841) unabhängig nachgebaut
  (`nachrechnung-d.js`-Vorstufe, siehe Lauf-Log): je Strategie-Schlüssel gewinnt das
  neueste Protokoll, Urteil = `bestesUrteil`, Zahl nur aus einer Variante mit genau diesem
  Urteil, tage80 = Minimum ohne `nicht-messbar`-Varianten. Nachbau deckungsgleich für alle
  12 Schlüssel.
- Statische Texte (index.html, Auslöser-Gruppen, Regelbuch): keine Belegbehauptung über
  die Protokolle hinaus; kapitulation ist korrekt als „IN ÜBERPRÜFUNG … nicht als belegt"
  ausgewiesen, die Auslöser-Gruppierung zieht ihren Belegstand zur Laufzeit aus
  `PROTOKOLL_KANTE` (Regel D2).

## B. Placebo — ersatzweise über die Protokoll-Placebos (archiv1d gesperrt)

Kein frischer Maschinenlauf (das 1d-Archiv ist gesperrt; ein 60m-Lauf über `messen.js`
unterbleibt wegen der bekannten Falle, dass er Protokolle überschreibt —
`messmaschine-audit-fallen`). Stattdessen die `placeboOk`-Regel der Maschine
(|tagesmittel| ≤ mde, messmaschine.js:1154) für alle 12 Protokolle **unabhängig
nachgerechnet: alle bestanden**, |t| durchweg ≤ 1,25 (Maximum rsi2seit-mcp 1,25).

## C. Live gleich Messung — bestanden

- Live-Vorgaben (depot.js:32): 60m, period 20, confirmBps 15, scalpHold 480; kapitulation
  bekommt 1560 min (depot.js:2317 mit Vorbelegung, 3169 erzwingt 1560 für Kapi-Trades,
  applySetup 6405–6408 setzt die Haltedauer beim Wechsel). Identisch mit den gemessenen
  Parametern der Protokolle (rsi2seit: period 20, confirmBps 15, 8 Kerzen; kapitulation:
  ZTHR 2,0, 26 Kerzen, Vorlauf 261).
- Kerzen-Vorlauf: live erzwungen ≥ 261 (depot.js:2661–2663, Geduldsmeldung statt
  falschem Signal) — deckungsgleich mit `leseFensterKerzen: 261` der Messstrategien.
- Wechselpfade geprüft: Setup-Pillen, Auslöser- und Ausstiegs-Wahl laufen ALLE durch
  `applySetup`, das die gemessene Konfiguration (Intervall, Bestätigung, Haltedauer)
  mitführt; einen direkten Modus-Wechsel ohne diesen Pfad gibt es nicht (idM hat keinen
  eigenen change-Listener). Die Marktlage-Automatik ist seit v8 reine Anzeige.
- ZTHR-Scheinwiderspruch notiert: rsi2seit wurde mit ZTHR 1,5 gemessen, live gilt
  zOf(15)=2,0 — laut Strategie-Quelle im Protokoll geht ZTHR in den rsi2seit-Auslöser
  nicht ein; nur für kapitulation zählt er, und dort ist er mit 2,0 identisch gemessen.

## D. Kanten-Neuberechnung — vollständig über die 12 frischen Protokolle

Werkzeug: `nachrechnung-d.js` (hier im Ordner; eigene Implementierung von Normalquantil,
Bonferroni-Schwelle, delta80, Urteilsregeln, tage80, bestesUrteil — nicht der
Maschinen-Code).

- **35 Varianten-Entscheidungen nachgerechnet: Schwelle, delta80, Urteil, tage80 und
  bestesUrteil stimmen überall überein** — mit genau einer Abweichung, und die ist
  erklärt:
- `monatsende-kauf` V0 trägt `aussicht.tage80 = 187` bei nur 17 Messtagen. Die
  30-Tage-Schranke (Wilhelms Auflage 20:25) kam erst mit Messmaschine 1.5.0 in den Code
  (Commit 799ba96, 26.08. 20:11 UTC); das Protokoll wurde 07:24 UTC gemessen — es ist
  schlicht älter als der Fix. Die Oberfläche überspringt `nicht-messbar`-Varianten bei
  der tage80-Anzeige (depot.js:809), die Zahl dringt also nicht nach außen. **Kein
  Fund; bei der nächsten Neumessung verschwindet sie von selbst.** Wer die Protokolle
  maschinell auswertet, muss wissen: Protokolle vor 1.5.0 können Aussichten unter der
  30-Tage-Schranke tragen.
- Keine Kante kippt, keine wird entscheidbar: die Protokolle sind von gestern, seither
  ist höchstens ein Handelstag dazugekommen — materiell keine neue Auflösung.
- Laufende Vorregistrierungen: `glockendruck-nacht`, `nachtstoss-umkehr` (beide Tüftler,
  26.08.) und `strang-a` (Rolle Berechnungen, heute 01:1x) warten alle auf archiv1d —
  das gerade nachgeladen wird. **Strang A wird heute Nacht von der Rolle Berechnungen
  selbst gemessen; ich habe bewusst nicht hineingemessen.** Kein vorregistriertes Urteil
  war fällig, dessen Datenmenge erreicht und ungeprüft wäre.

## E. Annahmen-Drift

- **Kostenmessung:** Live-Store unverändert bei **1 Runde** (AAPL, 25.08. 18:22 UTC,
  0,042 %); `depot_vor_reset.json` trägt weiter die 38 Runden (Mittel 0,0855 %,
  konservativ gegen die 0,10-%-Annahme) — Zustand wie in #99 gemeldet. **Beobachtung:
  am Handelstag 26.08. kam keine einzige neue Runde dazu.** Ob die App lief, ist von
  hier nicht feststellbar; wenn morgen Nacht immer noch 1 Runde steht, obwohl die App
  lief, wäre DAS ein Fund (Messbetrieb steht).
- **Datenqualität 60m:** 6 nachhängende Reihen (TWO 2 Handelstage, LBRDA/LBRDK/WBS 5,
  EQR 7, AVB 8) — der Wachhund weist sie selbst als „verdächtig, eher Abruffehler als
  Delisting" aus; AVB/EQR passen zum bekannten Befund abgemeldeter Reihen. Keine neue
  Handlung nötig, das Universum-Filter-Risiko ist dort dokumentiert.

## F — nicht dran (Wechsel-Rhythmus); nächster Punkt der Rotation: 4 (Überlebensverzerrung).

## Maßstäbe dieser Nacht

Geprüfte Testzahl: je Protokoll ausgewiesen (1–7 Tests, Bonferroni-Schwellen 1,96–2,69,
unabhängig reproduziert). MDE/delta80: in jedem der 35 Varianten-Urteile mitgeprüft.
Geclustert wird in den Protokollen über Tage; die Nachrechnung übernimmt deren
Tage-Basis und rechnet nichts auf Einzelsignalen.
