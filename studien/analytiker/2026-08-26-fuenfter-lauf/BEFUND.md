# Analytiker — fünfter Lauf, 26.08.2026 (~15:00–15:20 UTC, außerplanmäßig am Nachmittag)

Archivlage vorweg: `tools/archiv-wachhund.js` meldete **Exit 2** — archiv60m wird seit
14:13 UTC nachgezogen (außerplanmäßiger Nachzieh-Lauf, Dauer üblich >3 h). archiv1d ist
auf Stand (Rückstand 0, 2965/2965). **Deshalb liefen nur die archivfreien Blöcke A, C,
E und F; B (eigener Placebo-Lauf) und D (Kanten-Neuberechnung) entfallen diese Nacht.**
Ersatzweise wurden die in den 12 frischen Protokollen abgelegten Placebo-Werte geprüft:
alle |t| ≤ 1,25 — kein Maschinenfehler sichtbar.

## Fund 1 — B10-Überlappungs-Wächter ist toter Code (Issue #98)

`messmaschine.js` will nach jedem Lauf sichtbar machen, um welchen Faktor der
Newey-West-Standardfehler durch überlappende Halteperioden wächst
(`P.entscheide('B10 Ueberlappung', …)`), und warnen, wenn der Faktor 3 übersteigt
(„Ein Urteil, das ohne diese Korrektur zustande käme, wäre wertlos").

Gelesen wird dafür `r.bestaetigung.ueberschuss.ueberlappungsFaktor` (Z. 1004 ff.) —
aber `block()` (Z. 1010–1016) reicht genau dieses Feld **nicht** weiter, obwohl
`statistik()` es berechnet. `faktoren` ist damit immer leer, `if (faktoren.length)`
immer falsch.

**Gemessen:** 0 von 38 abgelegten Protokollen enthält eine Entscheidung mit Regel
„B10 …", obwohl fast alle Strategien H > 1 führen. Die eigentliche NW-Korrektur
**wirkt** (der se in den Urteilen ist korrigiert) — tot ist nur der Sichtbarkeits-
und Warnpfad darüber. Fehlergattung wie #86: ein nie geliefertes Feld, die Bedingung
fällt geschlossen aus. `test-v6.js:4040` prüft nur die Zeichenkette `P.warne('B10'`
im Quelltext, nicht das Verhalten (Testmarken-Falle).

**Gegenprobe:** `ueberlappungsFaktor` (und `tNaiv`) in `block()` aufnehmen, eine
beliebige 60m-Strategie mit H > 1 messen → im Protokoll muss „B10 Ueberlappung" mit
Faktor erscheinen; auf einer künstlichen Reihe mit starker Überlappung (H = 26) muss
die Warnung bei Faktor > 3 feuern.

## Fund 2 — Depot-Reset löschte 37 von 38 Kostenrunden (Issue #99)

Die Kostenmessung des Demo-Kontos (prüft die 0,10-%-Annahme, an der fast jede Studie
hängt) speichert ihre Runden in `D.kostenMessung` **im Depot-Store**. Der Depot-Reset
vom 25.08., 17:47 UTC (Nutzeraktion mit Sicherung `depot_vor_reset`) nahm die
Messdaten mit:

- `depot_vor_reset.json`: **38 Runden** (25.08. 12:02–13:32 UTC), Mittel je Runde
  **0,0855 %**, min/max 0,047/0,253 %
- `depot.json` (live): **1 Runde** (AAPL, 0,042 %, 25.08. 18:22 UTC), seither keine

Die App zählt also wieder 1 von ~20 Runden bis zum Urteil, während ein
urteilsfähiger Datensatz in der Sicherung liegt. Messdaten sind Projekt-Metrologie,
kein Depotzustand — sie gehören nicht in einen Store, den ein Reset leert. Der
Reset-Dialog warnt vor dem Depotverlust, nicht vor dem Messdatenverlust.

**Gegenprobe/Weg:** Runden aus `depot_vor_reset.json` in die laufende Messung
zurückspielen (oder die Messung dort auswerten) und `kostenMessung` künftig getrennt
vom Depot ablegen. Entscheiden und bauen muss das eine Bausitzung; der freigegebene
Auktionskosten-Auftrag (3a) fasst die Stelle ohnehin an.

**Richtigstellung in eigener Sache:** Der vierte Lauf schrieb „seit fünf Tagen keine
neue Runde" — falsch: die eine Runde stammt vom Vorabend (25.08. 18:22 UTC), und die
Messreihe davor war nicht alt, sondern beim Reset verlorengegangen.

## A. Code gegen Protokoll — bestanden

- Die 12 frischen 1.2.0-Protokolle (26.08.): codeStand einheitlich `6a7d9e29db6f`,
  **kein einziges** `bestaetigt` (10× nicht-entscheidbar, kapitulation und
  winkelbestaetigt nicht-bestätigt, monatsende-kauf nicht-messbar).
- `kantenAusProtokollen` (depot.js 746–792) unabhängig nachgebaut: für alle 12
  Schlüssel gewinnt das 26.08-Protokoll, Urteil = `bestesUrteil`, Zahl je Signal aus
  einer Variante, die genau dieses Urteil trägt (Nachrechnung siehe
  `kanten-simulation.txt`). `triggerBelegstand` kann damit nirgends „belegt" sagen.
- Sperrklinken (test-v6.js 5404 ff.) decken sichtbaren Text UND Kommentare; die
  Gegenprobe auf erfundenem Text greift.
- #92 (bestesUrteil-Rangfolge kann `widerlegt` verdecken) ist offen und unverändert
  in `messmaschine.js:1283` — keine Doppelmeldung.
- Beobachtung, kein Fund: Der Regime-Tooltip (index.html:1023, strategien.js:42)
  formuliert Ergebnisse der Studie vom 21.08. im Präsens („Gemessen trägt rsi2seit
  nur über der SPY-EMA200 …"), während die frischen Protokolle für die
  zugrundeliegenden Kanten nicht-entscheidbar/nicht-bestätigt sagen. Die Angaben
  sind datiert und als Studienergebnis attribuiert — die Studie maß zudem die
  Zuteilung, nicht die unbedingte Kante; deshalb keine Meldung. Wer die Texte
  anfasst, sollte das Präsens entschärfen.

## C. Live gleich Messung — bestanden

- Seit dem 4. Lauf (~09:00) änderten nur zwei Commits Produktcode: 779c02c
  (Kontrast/`<th scope="row">`, keine Handelslogik — Diff geprüft) und die
  Versionsvergabe 8.33.5 (package.json).
- Zusätzlich frisch nachgeprüft statt übernommen: Vorlauf 261 Kerzen an beiden
  Live-Stellen (depot.js 559/2594), Haltedauern live 480/1560 min = 8/26 Kerzen =
  Protokoll, und die ZTHR-Behandlung: live `zOf(15) = 2,0`, die Messstrategie
  `kapitulation.js` bildet genau das nach (dokumentiert „NICHT 1.5"); für rsi2seit
  geht ZTHR gar nicht in den Auslöser ein (quant.js 1760 ff.). Kein Widerspruch.

## E. Annahmen-Drift

Kostenannahme 0,10 % gegen die 38 verlorenen Runden gehalten: gemessen 0,0855 % im
Mittel — die Annahme liegt konservativ **über** der Messung, keine Drift nach oben.
Der Bestand der Messung selbst ist Fund 2. Spannen/Datenqualität (Kerzen-Naht,
Liquiditätsfilter) brauchen das 60m-Archiv → nächste Nacht.

## F. Methodenkritik (Rotation Punkt 3): Clusterung über Tage — Methode trägt

Kette: je Signal ein Überschuss → `tagesMittel()` gruppiert nach Kalendertag der
Signalkerze (gleichgewichtet je Tag, B2 weist den Unterschied zur Zahl je Signal
aus) → `statistik(tagesmittel, H−1)` mit Newey-West/Bartlett, positive-part-Schutz.

Kritikpunkt gefunden, geprüft, **entlastet**: `H−1` ist in **Kerzen**, die Reihe in
**Tagen** indiziert — bei H=8 nutzt die Maschine 7 Tages-Lags, obwohl die Fenster
nur ~1–2 Tage überlappen (bei H=26: 25 statt ~4). Der Begründungstext („so weit
überlappen die Ergebnisfenster") stimmt in der Einheit also nicht. Synthetischer
Gegenversuch (`f3-nw-lag-probe.js`, 4000 Wiederholungen, n=360 Tage, MA-Struktur in
Tagen, deterministischer LCG):

| Fall | wahre Streuung | se korrekte Bandbreite | se Maschine | Fehlalarme korrekt / Maschine |
|---|---|---|---|---|
| H=8, echte Überlappung 1 Tag | 0,0809 | 0,0695 | 0,0758 | 9,1 % / 6,6 % |
| H=26, echte Überlappung 3 Tage | 0,1097 | 0,0949 | 0,1030 | 9,3 % / 8,0 % |
| H=8, weißes Rauschen | 0,0532 | 0,0526 | 0,0520 | 5,0 % / 5,2 % |

Die „zu große" Bandbreite ist wegen der Bartlett-Stauchung der echten Lags praktisch
**näher an der Wahrheit** als die formal korrekte — kein Fund, nur den
Kommentar-Wortlaut sollte eine Bausitzung bei Gelegenheit richtigstellen.
Festzuhalten bleibt: NW ist bei stark korrelierten Reihen mit n≈360 inhärent leicht
antikonservativ (8–9 % statt 5 % unter H0); die Bonferroni-Schwellen (≥2,39 ab 3
Tests) puffern das, bei **einem** Test (rsi2seit, Schwelle 1,96) ist der Puffer weg —
im Hinterkopf behalten, wenn dort je ein knappes „bestätigt" fällt.

## Maßstäbe dieses Laufs

Kein Code, kein Test, keine Konfiguration geändert; Messmaschine nicht aufgerufen;
keine Archive gelesen (nur Protokolle, Store-Dateien, Quelltext). Testzahlen: 38
Protokolle Bestandsaufnahme, 12 Placebo-Werte, 3 synthetische Fälle × 4000
Wiederholungen. Fund 1 ist ein Logikbefund (deterministisch nachstellbar), Fund 2
ein Datenbestandsbefund (Zeitstempel belegt) — MDE entfällt für beide.
