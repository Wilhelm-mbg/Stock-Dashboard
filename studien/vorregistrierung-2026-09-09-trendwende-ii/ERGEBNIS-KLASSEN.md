# Trendwende II — Auswertung je Umsatzklasse (NACHTRAG 6, 13.09.2026)

**Status: nachträglich, hypothesenerzeugend, KEIN Beleg.** Diese Auswertung entsteht, nachdem das gepoolte
Urteil des Vollaufs feststeht (k₁ = 0, k₂ = 0, **belegt 0** über 225 Konfigurationen). Sie rechnet **nichts
neu**: `_zellen.bin` der Vollauf-Ordner wird nur gelesen, es gibt keinen Archivzugriff und keinen
Detektorlauf. `voll-0/ERGEBNIS.md` und `voll-0/ergebnis.json` sind unberührt.

**Kein Ergebnis dieser Tafel heißt „belegt".** Das höchste erreichbare Etikett einer Klassenzeile ist
**„Kandidat für den Vorwärtstest ab 2026-09-01"**. Die Testzahl steigt auf **900** (225 × 4);
die Schwelle ist `max(z_Bonf(k₁), z_Bonf(900))` = **4,0309**
(adaptiv 2,9352, über alle Tests 4,0309).
Registriert in `VORREGISTRIERUNG.md` §22 (NACHTRAG 6), Commit **vor** der ersten Zahl.

Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.

## 1. Die Antwort in einer Tabelle

Zahl der Konfigurationen (aus 225) je Klasse, die **Tor 1** bestehen — `u_Entdeckung ≥ 4 · MDE_B`:

| Klasse | K_kand (Pp) | Tor 1 bestanden | Tor 2 bestanden | Zeilen ohne Signal | beste Zeile nach Tor-1-Abstand | u_E / MDE_B (Tor: 4) | u_B | t_B |
|---|---|---|---|---|---|---|---|---|
| 5-50 | 0,1569 | 0 | 0 | 0 | W7 5m long schluss | 1,24 | 0,0105 | 1,04 |
| 50-250 | 0,0854 | 2 | 2 | 0 | W7 15m long schluss | 4,86 | 0,0877 | 7,99 |
| 250-1000 | 0,0647 | 4 | 3 | 0 | W7 15m long schluss | 6,22 | 0,1261 | 10,58 |
| ab1000 | 0,0449 | 9 | 2 | 0 | W7 5m long schluss | 6,81 | 0,1960 | 11,92 |

Zur Kontrolle dieselbe Spalte nach dem **t der Bestätigung** sortiert (eine andere Frage — sie ignoriert Tor 1):

| Klasse | beste Zeile nach t_B | u_B | se_B | t_B | K_kand | delta80 | Tor 1 |
|---|---|---|---|---|---|---|---|
| 5-50 | W7 15m long naechste | 0,2766 | 0,1225 | 2,26 | 0,1569 | 0,5970 | nein |
| 50-250 | W7 15m long schluss | 0,0877 | 0,0110 | 7,99 | 0,0854 | 0,0535 | ja |
| 250-1000 | W7 15m long schluss | 0,1261 | 0,0119 | 10,58 | 0,0647 | 0,0580 | ja |
| ab1000 | W7 5m long schluss | 0,1960 | 0,0164 | 11,92 | 0,0449 | 0,0801 | ja |

**Etiketten über alle 900 Klassenzeilen:** kein Kandidat 884 · nicht entscheidbar 9 · Kandidat fuer den Vorwaertstest 7.

## 2. Der PM-Verdacht direkt beantwortet: W7 5m long 3h

Die Frage war: **lebt W7 in der Klasse `ab1000` (Hürde 0,0449) oder `250-1000` (0,0647)?**

| Sicht | nTage_B | nSig_B | brutto_B | K_kand | u_E | MDE_B | 4·MDE_B | u_E/MDE_B | Tor 1 | u_B | se_B | t_B | delta80 | Tor 2 | letzte 250: u / t | Spiegel-Summe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gepoolt | 894 | 1.405.550 | 0,1242 | 0,1222 | 0,0162 | 0,0182 | 0,0727 | 0,89 | nein | -0,0005 | 0,0091 | -0,06 | 0,0443 | nein | -0,0089 / -0,54 | -0,0199 (t -1,49) |
| 5-50 | 894 | 778.082 | 0,1303 | 0,1569 | -0,0033 | 0,0192 | 0,0768 | -0,17 | nein | -0,0297 | 0,0096 | -3,10 | 0,0468 | nein | -0,0562 / -3,51 | -0,0785 (t -5,84) |
| 50-250 | 894 | 460.586 | 0,1254 | 0,0854 | 0,0495 | 0,0183 | 0,0732 | 2,70 | nein | 0,0321 | 0,0092 | 3,51 | 0,0446 | nein | 0,0248 / 1,43 | 0,0427 (t 3,06) |
| 250-1000 | 894 | 140.452 | 0,1255 | 0,0647 | 0,0744 | 0,0209 | 0,0838 | 3,55 | nein | 0,0485 | 0,0105 | 4,63 | 0,0510 | nein | 0,0433 / 2,03 | 0,0825 (t 5,12) |
| ab1000 | 892 | 26.430 | 0,1990 | 0,0449 | 0,1807 | 0,0330 | 0,1320 | 5,48 | ja | 0,1283 | 0,0165 | 7,78 | 0,0804 | nein | 0,1171 / 3,71 | 0,2363 (t 9,30) |

**ab1000: Tor 1 bestanden** — u_E 0,1807 = 5,48 × MDE_B, u_B 0,1283 (t 7,78).

**250-1000: nein.** u_E 0,0744 gegen 4 · MDE_B = 0,0838 — es fehlen 0,0094 Pp, das sind 3,55 von den nötigen 4,00 MDE_B. In der Bestätigung u 0,0485 (t 4,63), brutto 0,1255 gegen die Klassenhürde 0,0647 (brutto − K_kand = 0,0608).

Alle vier Klassen stehen oben, nicht nur die beiden liquiden — auch die, die schlechter aussieht.

## 2b. Der Fund — und die fünf Zahlen, die ihn einordnen

**Der Fund.** Die Zahl der Zeilen, die Tor 1 bestehen, steigt monoton mit der Liquidität:
**5-50 0 · 50-250 2 · 250-1000 4 · ab1000 9** (aus je 225).
In der teuersten Klasse besteht **keine einzige** Zeile Tor 1, in der billigsten neun. Der gepoolte Befund
„kein Kandidat" war also **nicht** durchgehend wahr: die Hürde der illiquiden Masse hat Struktur verdeckt,
die in den liquiden Klassen sichtbar ist. Der Verdacht des PM trifft zu.

**Was ihn einordnet — fünf Zahlen, jede aus dieser Tafel:**

1. **Ein einziger Detektor.** Alle 15 Tor-1-Zeilen kommen von 1 der 8 Detektoren: W7 15. Eine Kante, die nur ein Detektor sieht, ist keine Eigenschaft des Marktes, sondern eine Eigenschaft dieses Detektors.
2. **Eine einzige Haltedauer-Familie.** schluss 12, 3h 3 — und **10 der 15** Zeilen fallen über das **Uhrzeit-Versatz-Tor** des Hauptlaufs (`|Haltezeit_kand / Haltezeit_topf − 1| > 0.15`): sie halten 15–20 % länger als ihr Vergleich. Nach den Regeln des Hauptlaufs (§19.3) wäre keine dieser Zeilen „belegt" — unabhängig von ihrem `t`. **Ob** der Versatz die Höhe erklärt, ist damit nicht gesagt (siehe 3.), **dass** der Vergleich für diese Zeilen nicht sauber ist, schon.
3. **Long und Short gewinnen gleichzeitig — und das spricht hier NICHT gegen den Fund.** Die Spiegel-Summe
   `u_long + u_short` ist rechnerisch `r̄(nach Long-Signalen) − r̄(nach Short-Signalen)`: der Topf **kürzt sich
   heraus**. Sie ist damit immun gegen einen falschen Vergleich, und sie ist groß, positiv und wächst monoton
   mit der Liquidität (Tafel unten). Der Versatz kann sie nicht erzeugen: längeres Halten schiebt `u_long`
   hinauf und `u_short` hinunter, nicht beides hinauf. **Der Detektor trennt die beiden Folgemengen also
   wirklich.** Was die Summe *nicht* sagt: ob die **Höhe** von `u` stimmt — die hängt am Topf, und genau dort
   sitzt der Versatz.
4. **Die saubersten Zeilen sind nicht entscheidbar — nicht negativ.** 3 Zeilen bestehen Tor 1,
   das Uhrzeit-Versatz-Tor und das Lücken-Tor, fallen aber über **Tor 2** (`delta80 ≥ K_kand`): W7 5m long 3h/ab1000 (u 0,1283, t 7,78, delta80 0,0804 gegen K 0,0449); W7 5m short 3h/ab1000 (u 0,1077, t 6,30, delta80 0,0833 gegen K 0,0449); W7 15m long 3h/ab1000 (u 0,1445, t 6,13, delta80 0,1149 gegen K 0,0449).
   In der liquidesten Klasse ist die Hürde klein (0,0449) — und die Stichprobe so dünn, dass die auflösbare
   Differenz größer ist als die Hürde. Das ist die **Auflösungswand**, kein Nein.
5. **Die Kante ist in den letzten 250 Tagen dünn.** Von den 7 Zeilen mit dem Etikett „Kandidat" haben 2 ein `t` der letzten 250 Tage unter 2,00 — darunter **beide** Zeilen,
   die alle Tore des Hauptlaufs bestehen.

**Die 7 Zeilen mit dem höchsten Etikett — mit den Toren des Hauptlaufs danebengestellt:**

| Det | ZR | Ri | H | Klasse | nSig_B | u_B | t_B | K_kand | delta80 | letzte 250: u / t | Versatz | Uhrzeit-Tor | Lücken-Tor | sauber | Spiegel-Summe (t) | Überlebens-Differenz |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| W7 | 15m | long | schluss | 250-1000 | 115.972 | 0,1261 | 10,58 | 0,0647 | 0,0580 | 0,1101 / 4,95 | 0,16 | nein | ja | nein | 0,2207 (10,03) | -0,0062 |
| W7 | 5m | long | schluss | 250-1000 | 209.639 | 0,0924 | 9,26 | 0,0647 | 0,0486 | 0,0788 / 4,25 | 0,18 | nein | ja | nein | 0,1606 (9,52) | -0,0036 |
| W7 | 15m | long | schluss | 50-250 | 386.251 | 0,0877 | 7,99 | 0,0854 | 0,0535 | 0,0542 / 2,89 | 0,16 | nein | ja | nein | 0,1522 (7,77) | -0,0040 |
| W7 | 5m | long | schluss | 50-250 | 692.359 | 0,0707 | 7,42 | 0,0854 | 0,0464 | 0,0430 / 2,62 | 0,18 | nein | ja | nein | 0,1182 (7,38) | -0,0019 |
| W7 | 5m | short | schluss | 250-1000 | 230.699 | 0,0682 | 6,80 | 0,0647 | 0,0488 | 0,0434 / 2,39 | 0,19 | nein | ja | nein | 0,1606 (9,52) | -0,0005 |
| W7 | 1m | long | schluss | ab1000 | 86.521 | 0,0415 | 6,07 | 0,0449 | 0,0333 | 0,0116 / 0,94 | 0,06 | ja | ja | **ja** | 0,0751 (6,45) | 0,0005 |
| W7 | 1m | short | schluss | ab1000 | 92.107 | 0,0336 | 4,99 | 0,0449 | 0,0328 | 0,0113 / 0,87 | 0,06 | ja | ja | **ja** | 0,0751 (6,45) | 0,0003 |

**2 Zeilen besteht auch die übrigen Tore des Hauptlaufs** (Uhrzeit-Versatz, Einstiegslücke): W7 1m long schluss / ab1000, W7 1m short schluss / ab1000.
Das ist **kein Beleg** (§6.0) — es ist die Liste, aus der ein **Vorwärtstest ab 2026-09-01** vorab
festgelegt werden könnte: Detektor, Zeitrahmen, Richtung, Haltedauer und **Klasse** stehen damit vor dem
ersten neuen Handelstag fest. Vor einem solchen Test gehört die Spiegel-Summe erklärt, nicht weggelassen.

**Spiegel-Diagnose (nachgetragen, nachdem die Tor-1-Zeilen sichtbar waren — reine Diagnose, kein Urteil).**
`u_long + u_short` über die Tage mit Signal in beiden Richtungen, je Klasse, für die Konfigurationen mit
mindestens einer Tor-1-Zeile:

| Det | ZR | H | Klasse | u_long | u_short | Summe | t | nTage |
|---|---|---|---|---|---|---|---|---|
| W7 | 1m | schluss | gepoolt | -0,0447 | -0,0516 | -0,0963 | -12,96 | 894 |
| W7 | 1m | schluss | 5-50 | -0,0865 | -0,0966 | -0,1831 | -21,81 | 894 |
| W7 | 1m | schluss | 50-250 | -0,0218 | -0,0281 | -0,0499 | -6,84 | 894 |
| W7 | 1m | schluss | 250-1000 | -0,0017 | -0,0076 | -0,0093 | -1,26 | 894 |
| W7 | 1m | schluss | ab1000 | 0,0415 | 0,0336 | 0,0751 | 6,45 | 894 |
| W7 | 5m | 3h | gepoolt | -0,0005 | -0,0194 | -0,0199 | -1,49 | 894 |
| W7 | 5m | 3h | 5-50 | -0,0297 | -0,0488 | -0,0785 | -5,84 | 894 |
| W7 | 5m | 3h | 50-250 | 0,0321 | 0,0106 | 0,0427 | 3,06 | 894 |
| W7 | 5m | 3h | 250-1000 | 0,0485 | 0,0340 | 0,0825 | 5,12 | 894 |
| W7 | 5m | 3h | ab1000 | 0,1283 | 0,1077 | 0,2363 | 9,30 | 892 |
| W7 | 5m | schluss | gepoolt | 0,0398 | 0,0200 | 0,0599 | 3,76 | 894 |
| W7 | 5m | schluss | 5-50 | 0,0105 | -0,0073 | 0,0032 | 0,20 | 894 |
| W7 | 5m | schluss | 50-250 | 0,0707 | 0,0475 | 0,1182 | 7,38 | 894 |
| W7 | 5m | schluss | 250-1000 | 0,0924 | 0,0682 | 0,1606 | 9,52 | 894 |
| W7 | 5m | schluss | ab1000 | 0,1960 | 0,1411 | 0,3371 | 13,15 | 894 |
| W7 | 15m | 3h | gepoolt | -0,0070 | -0,0138 | -0,0207 | -1,30 | 894 |
| W7 | 15m | 3h | 5-50 | -0,0436 | -0,0534 | -0,0970 | -5,99 | 894 |
| W7 | 15m | 3h | 50-250 | 0,0363 | 0,0250 | 0,0612 | 3,54 | 894 |
| W7 | 15m | 3h | 250-1000 | 0,0610 | 0,0543 | 0,1156 | 5,58 | 893 |
| W7 | 15m | 3h | ab1000 | 0,1445 | 0,1214 | 0,2628 | 7,59 | 837 |
| W7 | 15m | schluss | gepoolt | 0,0499 | 0,0267 | 0,0766 | 4,00 | 894 |
| W7 | 15m | schluss | 5-50 | 0,0168 | -0,0115 | 0,0054 | 0,27 | 894 |
| W7 | 15m | schluss | 50-250 | 0,0877 | 0,0644 | 0,1522 | 7,77 | 894 |
| W7 | 15m | schluss | 250-1000 | 0,1261 | 0,0946 | 0,2207 | 10,03 | 894 |
| W7 | 15m | schluss | ab1000 | 0,2345 | 0,1779 | 0,4182 | 11,50 | 856 |

Zwei Muster stehen darin, beide gegen die Deutung „reines Rauschen": die Summe wächst **monoton mit der
Liquiditätsklasse** (in `5-50` liegt sie bei null oder negativ, in `ab1000` bei +0,24 bis +0,42 Pp), und sie
wächst **monoton mit der Haltedauer** — im Hauptlauf ist dieselbe Summe bei 15m und 1h stark **negativ**
(bis −0,21 Pp, |t| > 40), bei 3h nahe null, bei „schluss" positiv. Der Detektor zeigt auf kurzer Sicht in
die **falsche** Richtung und dreht mit der Haltedauer. Das ist zu erklären, bevor daraus etwas wird.

## 3. Prüfungen

### 3.1 Positivkontrolle: exakte Zerlegung je Tag

Für jede Konfiguration und jeden Signaltag muss gelten `u_gepoolt,t = Σ_k mN_k,t · u_k,t / Σ_k mN_k,t`
(dasselbe für `brutto` mit `n`). Geprüft über **594.096** Konfigurations-Tage:

- maximale absolute Abweichung `u`: **3.553e-15** Pp (bei W1b 1m short naechste Tag 2189)
- maximale absolute Abweichung `brutto`: **7.105e-15** Pp
- Tage im gepoolten Satz ohne Gegenstück in den Klassen: **0** (Soll: 0)

**Bestanden** — die Abweichung ist Fließkommarauschen. Die Klassenzerlegung ist vollständig und verlustfrei.

### 3.2 Positivkontrolle: die gepoolte Tafel gegen den Hauptlauf

Dasselbe Werkzeug rechnet zusätzlich die **gepoolte** Tafel (alle vier Klassen zusammen) und hält sie Zeile
für Zeile gegen `voll-0/ergebnis.json` (Kennung `trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1`,
k₁ = 0, k₂ = 0, belegt 0).
Verglichen: **225** Konfigurationen, fehlend 0.

| Feld | maximale absolute Abweichung |
|---|---|
| besTage | 0 |
| besSig | 0 |
| entTage | 0 |
| entSig | 0 |
| brutto_B | 0 |
| u_B | 0 |
| se_B | 0 |
| t_B | 0 |
| u_E | 0 |
| t_E | 0 |
| K_kand | 0 |
| MDE_B | 0 |
| aktU | 0 |
| schein1 | 0 |

Tor-1-Abweichungen (ja/nein): **0** (Soll: 0).

**Bestanden** — der neue Lesepfad ist derselbe wie im Hauptlauf. Ohne diese Zeile wäre keine Klassenzahl zu glauben.

### 3.3 Aggregat-Abweichung: signalgewichtete Rückaddition

Diese Zahl ist **nicht** null und soll es nicht sein: das gepoolte Mittel ist ein Mittel über **Tage**, die
signalgewichtete Rückaddition eines über **Signale**. Der Abstand misst, wie stark der Klassenmix über die
Zeit wandert — genau der Effekt, um den es in dieser Auswertung geht.

| Größe | Median der Beträge | P90 | Maximum |
|---|---|---|---|
| u_B | 0,0005 | 0,0071 | 0,0480 |
| brutto_B | 0,0011 | 0,0068 | 0,0339 |

### 3.4 Die Hürde je Klasse gegen `konfig.js`

| Klasse | `KLASSEN[k].huerde` | K_kand aus den Zellen (Median über die Klassenzeilen mit Signal) | gleich |
|---|---|---|---|
| 5-50 | 0,1569 | 0,156900 | ja |
| 50-250 | 0,0854 | 0,085400 | ja |
| 250-1000 | 0,0647 | 0,064700 | ja |
| ab1000 | 0,0449 | 0,044900 | ja |

**Bestanden** — `K_kand` einer Klassenzeile ist konstruktionsgemäß exakt die Hürde der Klasse.

## 4. Placebo A je Klasse — beide Kriterien getrennt

Schranken: `|t| < 3`; Größe intraday `|Mittel| < 0,0450` Pp, übernacht
`|Mittel| < 3 · 0,0038 = 0,0114` Pp.

**60 Bänder: 54 im Band, 6 fallen NUR über `t`, 0 nur über die Größe, 0 über beides.**

| ZR | H | Klasse | nTage | nSig | Mittel (Pp) | se | t | Betrag t < 3 | Größe < Schranke | Mittel/Schranke | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1m | 15m | 5-50 | 2.660 | 33.024.489 | -0,0002 | 0,0001 | -1,85 | ja | ja | 1/246 | im Band |
| 1m | 15m | 50-250 | 2.660 | 28.341.221 | -0,0001 | 0,0001 | -1,36 | ja | ja | 1/410 | im Band |
| 1m | 15m | 250-1000 | 2.660 | 8.122.295 | -0,0001 | 0,0001 | -0,76 | ja | ja | 1/423 | im Band |
| 1m | 15m | ab1000 | 2.660 | 1.444.366 | -0,0001 | 0,0004 | -0,23 | ja | ja | 1/531 | im Band |
| 1m | 1h | 5-50 | 2.660 | 30.035.514 | -0,0008 | 0,0002 | -3,89 | nein | ja | 1/60 | **nur über t** |
| 1m | 1h | 50-250 | 2.660 | 25.833.964 | -0,0004 | 0,0001 | -2,68 | ja | ja | 1/112 | im Band |
| 1m | 1h | 250-1000 | 2.660 | 7.415.543 | -0,0001 | 0,0003 | -0,44 | ja | ja | 1/402 | im Band |
| 1m | 1h | ab1000 | 2.660 | 1.319.459 | -0,0008 | 0,0007 | -1,18 | ja | ja | 1/55 | im Band |
| 1m | 3h | 5-50 | 2.660 | 19.073.162 | -0,0014 | 0,0004 | -3,61 | nein | ja | 1/32 | **nur über t** |
| 1m | 3h | 50-250 | 2.660 | 16.388.597 | -0,0012 | 0,0003 | -4,05 | nein | ja | 1/37 | **nur über t** |
| 1m | 3h | 250-1000 | 2.660 | 4.705.857 | -0,0011 | 0,0005 | -2,17 | ja | ja | 1/41 | im Band |
| 1m | 3h | ab1000 | 2.660 | 836.549 | -0,0014 | 0,0013 | -1,08 | ja | ja | 1/33 | im Band |
| 1m | schluss | 5-50 | 2.660 | 33.024.690 | -0,0017 | 0,0003 | -5,87 | nein | ja | 1/27 | **nur über t** |
| 1m | schluss | 50-250 | 2.660 | 28.341.494 | -0,0010 | 0,0002 | -4,38 | nein | ja | 1/46 | **nur über t** |
| 1m | schluss | 250-1000 | 2.660 | 8.122.370 | -0,0010 | 0,0004 | -2,60 | ja | ja | 1/47 | im Band |
| 1m | schluss | ab1000 | 2.660 | 1.444.375 | -0,0012 | 0,0010 | -1,23 | ja | ja | 1/38 | im Band |
| 1m | naechste | 5-50 | 2.659 | 33.006.657 | -0,0043 | 0,0022 | -2,01 | ja | ja | 0,38 | im Band |
| 1m | naechste | 50-250 | 2.659 | 28.325.185 | -0,0013 | 0,0004 | -3,31 | nein | ja | 0,11 | **nur über t** |
| 1m | naechste | 250-1000 | 2.659 | 8.116.212 | -0,0012 | 0,0006 | -2,03 | ja | ja | 0,11 | im Band |
| 1m | naechste | ab1000 | 2.659 | 1.443.096 | -0,0029 | 0,0016 | -1,86 | ja | ja | 0,26 | im Band |
| 5m | 15m | 5-50 | 2.660 | 26.279.104 | -0,0001 | 0,0001 | -1,18 | ja | ja | 1/378 | im Band |
| 5m | 15m | 50-250 | 2.660 | 13.562.340 | -0,0002 | 0,0001 | -1,53 | ja | ja | 1/264 | im Band |
| 5m | 15m | 250-1000 | 2.660 | 3.484.993 | -0,0001 | 0,0002 | -0,63 | ja | ja | 1/340 | im Band |
| 5m | 15m | ab1000 | 2.660 | 601.888 | -0,0001 | 0,0006 | -0,10 | ja | ja | 1/774 | im Band |
| 5m | 1h | 5-50 | 2.660 | 23.681.258 | -0,0004 | 0,0002 | -2,32 | ja | ja | 1/100 | im Band |
| 5m | 1h | 50-250 | 2.660 | 12.235.740 | -0,0002 | 0,0002 | -0,87 | ja | ja | 1/244 | im Band |
| 5m | 1h | 250-1000 | 2.660 | 3.144.150 | 0,0000 | 0,0004 | 0,01 | ja | ja | 1/10544 | im Band |
| 5m | 1h | ab1000 | 2.660 | 542.922 | -0,0003 | 0,0011 | -0,23 | ja | ja | 1/178 | im Band |
| 5m | 3h | 5-50 | 2.660 | 14.874.674 | -0,0002 | 0,0004 | -0,44 | ja | ja | 1/262 | im Band |
| 5m | 3h | 50-250 | 2.660 | 7.697.800 | -0,0005 | 0,0004 | -1,12 | ja | ja | 1/96 | im Band |
| 5m | 3h | 250-1000 | 2.660 | 1.978.223 | 0,0008 | 0,0008 | 0,96 | ja | ja | 1/58 | im Band |
| 5m | 3h | ab1000 | 2.660 | 341.146 | 0,0024 | 0,0020 | 1,19 | ja | ja | 1/19 | im Band |
| 5m | schluss | 5-50 | 2.660 | 26.279.367 | -0,0005 | 0,0003 | -1,87 | ja | ja | 1/85 | im Band |
| 5m | schluss | 50-250 | 2.660 | 13.562.487 | -0,0006 | 0,0003 | -2,05 | ja | ja | 1/71 | im Band |
| 5m | schluss | 250-1000 | 2.660 | 3.485.027 | 0,0005 | 0,0006 | 0,85 | ja | ja | 1/91 | im Band |
| 5m | schluss | ab1000 | 2.660 | 601.889 | -0,0005 | 0,0015 | -0,32 | ja | ja | 1/97 | im Band |
| 5m | naechste | 5-50 | 2.659 | 26.266.090 | 0,0009 | 0,0019 | 0,45 | ja | ja | 1/13 | im Band |
| 5m | naechste | 50-250 | 2.659 | 13.554.070 | -0,0009 | 0,0005 | -1,84 | ja | ja | 1/12 | im Band |
| 5m | naechste | 250-1000 | 2.659 | 3.482.451 | 0,0017 | 0,0009 | 1,85 | ja | ja | 0,15 | im Band |
| 5m | naechste | ab1000 | 2.659 | 601.397 | -0,0013 | 0,0025 | -0,52 | ja | ja | 0,11 | im Band |
| 15m | 15m | 5-50 | 2.660 | 11.957.824 | -0,0004 | 0,0001 | -2,46 | ja | ja | 1/126 | im Band |
| 15m | 15m | 50-250 | 2.660 | 5.825.079 | 0,0003 | 0,0002 | 1,82 | ja | ja | 1/144 | im Band |
| 15m | 15m | 250-1000 | 2.660 | 1.484.052 | 0,0004 | 0,0003 | 1,50 | ja | ja | 1/102 | im Band |
| 15m | 15m | ab1000 | 2.660 | 255.673 | 0,0009 | 0,0009 | 1,04 | ja | ja | 1/51 | im Band |
| 15m | 1h | 5-50 | 2.660 | 10.452.515 | -0,0003 | 0,0003 | -1,20 | ja | ja | 1/129 | im Band |
| 15m | 1h | 50-250 | 2.660 | 5.093.126 | 0,0004 | 0,0003 | 1,10 | ja | ja | 1/128 | im Band |
| 15m | 1h | 250-1000 | 2.660 | 1.298.120 | 0,0001 | 0,0006 | 0,22 | ja | ja | 1/345 | im Band |
| 15m | 1h | ab1000 | 2.660 | 223.705 | -0,0001 | 0,0017 | -0,07 | ja | ja | 1/382 | im Band |
| 15m | 3h | 5-50 | 2.660 | 6.449.769 | -0,0010 | 0,0007 | -1,48 | ja | ja | 1/47 | im Band |
| 15m | 3h | 50-250 | 2.660 | 3.145.064 | -0,0005 | 0,0007 | -0,75 | ja | ja | 1/86 | im Band |
| 15m | 3h | 250-1000 | 2.660 | 801.903 | -0,0020 | 0,0012 | -1,61 | ja | ja | 1/23 | im Band |
| 15m | 3h | ab1000 | 2.660 | 138.117 | 0,0034 | 0,0032 | 1,05 | ja | ja | 1/13 | im Band |
| 15m | schluss | 5-50 | 2.660 | 11.958.038 | -0,0009 | 0,0004 | -2,11 | ja | ja | 1/49 | im Band |
| 15m | schluss | 50-250 | 2.660 | 5.825.160 | -0,0003 | 0,0005 | -0,63 | ja | ja | 1/152 | im Band |
| 15m | schluss | 250-1000 | 2.660 | 1.484.066 | -0,0014 | 0,0009 | -1,53 | ja | ja | 1/32 | im Band |
| 15m | schluss | ab1000 | 2.660 | 255.673 | 0,0036 | 0,0024 | 1,49 | ja | ja | 1/12 | im Band |
| 15m | naechste | 5-50 | 2.659 | 11.951.544 | -0,0020 | 0,0013 | -1,49 | ja | ja | 0,18 | im Band |
| 15m | naechste | 50-250 | 2.659 | 5.821.318 | -0,0011 | 0,0008 | -1,51 | ja | ja | 0,10 | im Band |
| 15m | naechste | 250-1000 | 2.659 | 1.482.944 | -0,0002 | 0,0015 | -0,15 | ja | ja | 1/49 | im Band |
| 15m | naechste | ab1000 | 2.659 | 255.474 | 0,0012 | 0,0042 | 0,28 | ja | ja | 0,10 | im Band |

**Die Bänder, die nur über `t` fallen, sind ein Methodenbefund, kein Urteilsgrund.** Bei Millionen Signalen
je Band ist die `se` so klein, dass `|t| < 3` jede beliebig kleine Verzerrung rot färbt; die Mittel liegen
dabei bei einem Bruchteil der Größenschranke. Am Urteil ändert das nichts — es war ohnehin nichts belegt —,
an der Methode schon: für Bänder dieser Dichte ist die Größenschranke das tragende Kriterium.

## 5. Jahresscheiben für die Zeilen, die in ihrer Klasse Tor 1 bestehen

### W7 1m long schluss — Klasse ab1000

u_E 0,0597 (4,37 × MDE_B), u_B 0,0415 (t 6,07), K_kand 0,0449, delta80 0,0333, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0032, u_B lückenbereinigt 0,0380 (t 5,56), Haltezeit Kandidat 221,29 min gegen Topf 209,23 min (Versatz 0,06, Uhrzeit-Tor ja), Überlebens-Differenz brutto 0,0005, Spiegel-Summe 0,0751 (t 6,45).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 5.259 | 0,0314 | 0,0104 | 3,02 | 0,0987 | 0,0538 | -0,0613 | nein |
| 2017 | 251 | 6.141 | 0,0095 | 0,0082 | 1,16 | 0,0518 | 0,0069 | -0,1082 | nein |
| 2018 | 251 | 10.263 | 0,1018 | 0,0155 | 6,59 | 0,0867 | 0,0418 | -0,0733 | nein |
| 2019 | 252 | 9.237 | 0,0166 | 0,0100 | 1,66 | 0,0874 | 0,0425 | -0,0726 | nein |
| 2020 | 253 | 17.487 | 0,0796 | 0,0166 | 4,79 | 0,1436 | 0,0987 | -0,0164 | nein |
| 2021 | 252 | 24.337 | 0,0403 | 0,0147 | 2,73 | 0,0676 | 0,0227 | -0,0924 | nein |
| 2022 | 251 | 19.745 | 0,1249 | 0,0160 | 7,79 | 0,1830 | 0,1381 | 0,0230 | nein |
| 2023 | 250 | 12.140 | 0,0791 | 0,0110 | 7,21 | 0,1595 | 0,1146 | -0,0005 | nein |
| 2024 | 252 | 18.003 | 0,0234 | 0,0127 | 1,85 | 0,0587 | 0,0138 | -0,1013 | nein |
| 2025 | 250 | 28.484 | 0,0523 | 0,0144 | 3,63 | 0,1045 | 0,0596 | -0,0555 | nein |
| 2026 | 166 | 28.866 | 0,0163 | 0,0166 | 0,98 | 0,0829 | 0,0380 | -0,0771 | nein |
| letzte 250 | 250 | 39.952 | 0,0116 | 0,0124 | 0,94 | 0,0505 | 0,0056 | -0,1095 | nein |

Trend über die Jahre: Steigung 0,0003 Pp/Jahr (t 0,07, 11 Jahre).

### W7 1m short schluss — Klasse ab1000

u_E 0,0595 (4,42 × MDE_B), u_B 0,0336 (t 4,99), K_kand 0,0449, delta80 0,0328, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0029, u_B lückenbereinigt 0,0306 (t 4,56), Haltezeit Kandidat 222,61 min gegen Topf 209,23 min (Versatz 0,06, Uhrzeit-Tor ja), Überlebens-Differenz brutto 0,0003, Spiegel-Summe 0,0751 (t 6,45).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 5.599 | 0,0292 | 0,0116 | 2,52 | 0,0417 | -0,0032 | -0,1183 | nein |
| 2017 | 251 | 6.882 | 0,0029 | 0,0105 | 0,27 | 0,0494 | 0,0045 | -0,1106 | nein |
| 2018 | 251 | 10.798 | 0,0976 | 0,0158 | 6,17 | 0,1966 | 0,1517 | 0,0366 | nein |
| 2019 | 252 | 10.249 | 0,0046 | 0,0109 | 0,42 | 0,0207 | -0,0242 | -0,1393 | nein |
| 2020 | 253 | 19.044 | 0,0924 | 0,0169 | 5,48 | 0,1095 | 0,0646 | -0,0505 | nein |
| 2021 | 252 | 25.770 | 0,0336 | 0,0155 | 2,16 | 0,0832 | 0,0383 | -0,0768 | nein |
| 2022 | 251 | 19.243 | 0,1547 | 0,0164 | 9,43 | 0,1807 | 0,1358 | 0,0207 | nein |
| 2023 | 250 | 13.492 | 0,0434 | 0,0098 | 4,42 | 0,0525 | 0,0076 | -0,1075 | nein |
| 2024 | 252 | 19.566 | 0,0232 | 0,0117 | 1,99 | 0,0778 | 0,0329 | -0,0822 | nein |
| 2025 | 250 | 30.640 | 0,0521 | 0,0159 | 3,27 | 0,0897 | 0,0448 | -0,0703 | nein |
| 2026 | 166 | 29.566 | 0,0098 | 0,0151 | 0,65 | 0,0331 | -0,0118 | -0,1269 | nein |
| letzte 250 | 250 | 41.227 | 0,0113 | 0,0131 | 0,87 | 0,0623 | 0,0174 | -0,0977 | nein |

Trend über die Jahre: Steigung 0,0002 Pp/Jahr (t 0,03, 11 Jahre).

### W7 5m long 3h — Klasse ab1000

u_E 0,1807 (5,48 × MDE_B), u_B 0,1283 (t 7,78), K_kand 0,0449, delta80 0,0804, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0019, u_B lückenbereinigt 0,1259 (t 7,59), Haltezeit Kandidat 180,00 min gegen Topf 180,00 min (Versatz -0,00, Uhrzeit-Tor ja), Überlebens-Differenz brutto 0,0000, Spiegel-Summe 0,2363 (t 9,30).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 213 | 1.695 | 0,1172 | 0,0304 | 3,86 | 0,1453 | 0,1004 | 0,0953 | nein |
| 2017 | 237 | 1.749 | 0,0797 | 0,0213 | 3,75 | 0,1267 | 0,0818 | 0,0767 | nein |
| 2018 | 241 | 3.089 | 0,1547 | 0,0404 | 3,83 | 0,1461 | 0,1012 | 0,0961 | nein |
| 2019 | 241 | 2.601 | 0,1766 | 0,0375 | 4,70 | 0,2350 | 0,1901 | 0,1850 | nein |
| 2020 | 252 | 5.133 | 0,3112 | 0,0486 | 6,41 | 0,3418 | 0,2969 | 0,2918 | nein |
| 2021 | 252 | 7.670 | 0,1602 | 0,0376 | 4,26 | 0,1932 | 0,1483 | 0,1432 | nein |
| 2022 | 243 | 6.796 | 0,2527 | 0,0414 | 6,10 | 0,2530 | 0,2081 | 0,2030 | nein |
| 2023 | 248 | 3.716 | 0,1602 | 0,0307 | 5,21 | 0,2647 | 0,2198 | 0,2147 | nein |
| 2024 | 252 | 5.515 | 0,1163 | 0,0312 | 3,73 | 0,1723 | 0,1274 | 0,1223 | nein |
| 2025 | 249 | 8.379 | 0,1282 | 0,0328 | 3,91 | 0,2037 | 0,1588 | 0,1537 | nein |
| 2026 | 166 | 9.100 | 0,1035 | 0,0386 | 2,68 | 0,1748 | 0,1299 | 0,1248 | nein |
| letzte 250 | 250 | 12.479 | 0,1171 | 0,0315 | 3,71 | 0,1797 | 0,1348 | 0,1297 | nein |

Trend über die Jahre: Steigung -0,0007 Pp/Jahr (t -0,11, 11 Jahre).

### W7 5m long schluss — Klasse 50-250

u_E 0,0833 (4,37 × MDE_B), u_B 0,0707 (t 7,42), K_kand 0,0854, delta80 0,0464, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0086, u_B lückenbereinigt 0,0611 (t 6,46), Haltezeit Kandidat 243,38 min gegen Topf 207,04 min (Versatz 0,18, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0019, Spiegel-Summe 0,1182 (t 7,38).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 142.209 | 0,0592 | 0,0146 | 4,05 | 0,1916 | 0,1062 | 0,0316 | nein |
| 2017 | 251 | 151.842 | -0,0268 | 0,0077 | -3,49 | 0,0685 | -0,0169 | -0,0915 | nein |
| 2018 | 251 | 173.966 | 0,0732 | 0,0153 | 4,79 | 0,0986 | 0,0132 | -0,0614 | nein |
| 2019 | 252 | 151.352 | 0,0212 | 0,0126 | 1,69 | 0,1283 | 0,0429 | -0,0317 | nein |
| 2020 | 253 | 170.752 | 0,1392 | 0,0325 | 4,28 | 0,2256 | 0,1402 | 0,0656 | nein |
| 2021 | 252 | 186.413 | 0,0900 | 0,0201 | 4,48 | 0,1463 | 0,0609 | -0,0137 | nein |
| 2022 | 251 | 198.183 | 0,2199 | 0,0257 | 8,56 | 0,3149 | 0,2295 | 0,1549 | nein |
| 2023 | 250 | 174.684 | 0,0945 | 0,0158 | 5,98 | 0,1911 | 0,1057 | 0,0311 | nein |
| 2024 | 252 | 181.727 | 0,0303 | 0,0123 | 2,47 | 0,0972 | 0,0118 | -0,0628 | nein |
| 2025 | 250 | 204.432 | 0,1137 | 0,0248 | 4,58 | 0,2038 | 0,1184 | 0,0438 | nein |
| 2026 | 166 | 145.855 | 0,0408 | 0,0191 | 2,14 | 0,1237 | 0,0383 | -0,0363 | nein |
| letzte 250 | 250 | 217.462 | 0,0430 | 0,0164 | 2,62 | 0,1049 | 0,0195 | -0,0551 | nein |

Trend über die Jahre: Steigung 0,0052 Pp/Jahr (t 0,80, 11 Jahre).

### W7 5m long schluss — Klasse 250-1000

u_E 0,1149 (5,76 × MDE_B), u_B 0,0924 (t 9,26), K_kand 0,0647, delta80 0,0486, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0033, u_B lückenbereinigt 0,0890 (t 8,94), Haltezeit Kandidat 244,47 min gegen Topf 207,12 min (Versatz 0,18, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0036, Spiegel-Summe 0,1606 (t 9,52).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 28.441 | 0,0829 | 0,0155 | 5,34 | 0,1695 | 0,1048 | 0,0095 | nein |
| 2017 | 251 | 25.436 | 0,0044 | 0,0085 | 0,52 | 0,0727 | 0,0080 | -0,0873 | nein |
| 2018 | 251 | 34.616 | 0,0988 | 0,0154 | 6,43 | 0,1079 | 0,0432 | -0,0521 | nein |
| 2019 | 252 | 28.245 | 0,0677 | 0,0160 | 4,23 | 0,1557 | 0,0910 | -0,0043 | nein |
| 2020 | 253 | 42.539 | 0,1753 | 0,0271 | 6,48 | 0,2417 | 0,1770 | 0,0817 | nein |
| 2021 | 252 | 52.774 | 0,0997 | 0,0215 | 4,64 | 0,1315 | 0,0668 | -0,0285 | nein |
| 2022 | 251 | 58.671 | 0,2662 | 0,0273 | 9,75 | 0,3493 | 0,2846 | 0,1893 | nein |
| 2023 | 250 | 44.695 | 0,1051 | 0,0165 | 6,38 | 0,1827 | 0,1180 | 0,0227 | nein |
| 2024 | 252 | 48.240 | 0,0534 | 0,0158 | 3,37 | 0,1125 | 0,0478 | -0,0475 | nein |
| 2025 | 250 | 66.149 | 0,1454 | 0,0238 | 6,12 | 0,2168 | 0,1521 | 0,0568 | nein |
| 2026 | 166 | 54.288 | 0,0664 | 0,0219 | 3,04 | 0,1257 | 0,0610 | -0,0343 | nein |
| letzte 250 | 250 | 79.244 | 0,0788 | 0,0186 | 4,25 | 0,1191 | 0,0544 | -0,0409 | nein |

Trend über die Jahre: Steigung 0,0046 Pp/Jahr (t 0,68, 11 Jahre).

### W7 5m long schluss — Klasse ab1000

u_E 0,2241 (6,81 × MDE_B), u_B 0,1960 (t 11,92), K_kand 0,0449, delta80 0,0801, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0019, u_B lückenbereinigt 0,1936 (t 11,74), Haltezeit Kandidat 247,95 min gegen Topf 207,11 min (Versatz 0,20, Uhrzeit-Tor nein), Überlebens-Differenz brutto 0,0007, Spiegel-Summe 0,3371 (t 13,15).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 227 | 2.542 | 0,1603 | 0,0284 | 5,64 | 0,2136 | 0,1687 | 0,0536 | nein |
| 2017 | 243 | 2.527 | 0,0893 | 0,0224 | 4,00 | 0,1240 | 0,0791 | -0,0360 | nein |
| 2018 | 248 | 4.788 | 0,2647 | 0,0391 | 6,78 | 0,2427 | 0,1978 | 0,0827 | nein |
| 2019 | 249 | 3.791 | 0,2047 | 0,0346 | 5,91 | 0,2694 | 0,2245 | 0,1094 | nein |
| 2020 | 252 | 7.776 | 0,3029 | 0,0405 | 7,49 | 0,3564 | 0,3115 | 0,1964 | nein |
| 2021 | 252 | 11.119 | 0,1867 | 0,0381 | 4,89 | 0,2040 | 0,1591 | 0,0440 | nein |
| 2022 | 249 | 10.206 | 0,3385 | 0,0351 | 9,66 | 0,3875 | 0,3426 | 0,2275 | nein |
| 2023 | 250 | 5.370 | 0,2465 | 0,0301 | 8,19 | 0,3262 | 0,2813 | 0,1662 | nein |
| 2024 | 252 | 7.965 | 0,1648 | 0,0336 | 4,90 | 0,1988 | 0,1539 | 0,0388 | nein |
| 2025 | 250 | 12.600 | 0,2171 | 0,0318 | 6,83 | 0,2692 | 0,2243 | 0,1092 | nein |
| 2026 | 166 | 13.192 | 0,1584 | 0,0345 | 4,59 | 0,2250 | 0,1801 | 0,0650 | nein |
| letzte 250 | 250 | 18.216 | 0,1594 | 0,0277 | 5,75 | 0,1984 | 0,1535 | 0,0384 | nein |

Trend über die Jahre: Steigung 0,0029 Pp/Jahr (t 0,41, 11 Jahre).

### W7 5m short 3h — Klasse ab1000

u_E 0,1404 (4,11 × MDE_B), u_B 0,1077 (t 6,30), K_kand 0,0449, delta80 0,0833, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0012, u_B lückenbereinigt 0,1065 (t 6,23), Haltezeit Kandidat 180,00 min gegen Topf 180,00 min (Versatz 0,00, Uhrzeit-Tor ja), Überlebens-Differenz brutto 0,0002, Spiegel-Summe 0,2363 (t 9,30).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 222 | 1.882 | 0,0662 | 0,0269 | 2,46 | 0,0945 | 0,0496 | 0,0445 | nein |
| 2017 | 245 | 2.358 | 0,0712 | 0,0277 | 2,57 | 0,0893 | 0,0444 | 0,0393 | nein |
| 2018 | 242 | 3.608 | 0,1425 | 0,0402 | 3,54 | 0,1970 | 0,1521 | 0,1470 | nein |
| 2019 | 245 | 3.526 | 0,0736 | 0,0273 | 2,70 | 0,0809 | 0,0360 | 0,0309 | nein |
| 2020 | 251 | 5.937 | 0,1840 | 0,0623 | 2,96 | 0,2193 | 0,1744 | 0,1693 | nein |
| 2021 | 252 | 8.544 | 0,1226 | 0,0385 | 3,18 | 0,1554 | 0,1105 | 0,1054 | nein |
| 2022 | 245 | 5.919 | 0,3175 | 0,0463 | 6,85 | 0,3882 | 0,3433 | 0,3382 | nein |
| 2023 | 250 | 4.354 | 0,1584 | 0,0348 | 4,55 | 0,1409 | 0,0960 | 0,0909 | nein |
| 2024 | 252 | 6.211 | 0,0720 | 0,0286 | 2,52 | 0,1057 | 0,0608 | 0,0557 | nein |
| 2025 | 250 | 10.043 | 0,1409 | 0,0349 | 4,03 | 0,1546 | 0,1097 | 0,1046 | nein |
| 2026 | 166 | 9.651 | 0,0366 | 0,0362 | 1,01 | 0,0556 | 0,0107 | 0,0056 | nein |
| letzte 250 | 250 | 13.457 | 0,0610 | 0,0284 | 2,15 | 0,0885 | 0,0436 | 0,0385 | nein |

Trend über die Jahre: Steigung 0,0020 Pp/Jahr (t 0,26, 11 Jahre).

### W7 5m short schluss — Klasse 250-1000

u_E 0,0996 (4,97 × MDE_B), u_B 0,0682 (t 6,80), K_kand 0,0647, delta80 0,0488, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0028, u_B lückenbereinigt 0,0654 (t 6,53), Haltezeit Kandidat 245,82 min gegen Topf 207,11 min (Versatz 0,19, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0005, Spiegel-Summe 0,1606 (t 9,52).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 30.877 | 0,0588 | 0,0139 | 4,23 | 0,0962 | 0,0315 | -0,0638 | nein |
| 2017 | 251 | 29.846 | -0,0223 | 0,0083 | -2,67 | 0,0341 | -0,0306 | -0,1259 | nein |
| 2018 | 251 | 36.338 | 0,1025 | 0,0183 | 5,60 | 0,2166 | 0,1519 | 0,0566 | nein |
| 2019 | 252 | 34.855 | 0,0418 | 0,0124 | 3,37 | 0,0804 | 0,0157 | -0,0796 | nein |
| 2020 | 253 | 45.568 | 0,1628 | 0,0325 | 5,01 | 0,2168 | 0,1521 | 0,0568 | nein |
| 2021 | 252 | 58.988 | 0,0702 | 0,0244 | 2,87 | 0,1611 | 0,0964 | 0,0011 | nein |
| 2022 | 251 | 57.281 | 0,2793 | 0,0323 | 8,65 | 0,3195 | 0,2548 | 0,1595 | nein |
| 2023 | 250 | 50.187 | 0,0820 | 0,0149 | 5,50 | 0,1287 | 0,0640 | -0,0313 | nein |
| 2024 | 252 | 53.850 | 0,0504 | 0,0160 | 3,14 | 0,1185 | 0,0538 | -0,0415 | nein |
| 2025 | 250 | 76.106 | 0,1008 | 0,0263 | 3,84 | 0,1573 | 0,0926 | -0,0027 | nein |
| 2026 | 166 | 55.557 | 0,0317 | 0,0193 | 1,64 | 0,0997 | 0,0350 | -0,0603 | nein |
| letzte 250 | 250 | 82.454 | 0,0434 | 0,0181 | 2,39 | 0,1308 | 0,0661 | -0,0292 | nein |

Trend über die Jahre: Steigung 0,0036 Pp/Jahr (t 0,46, 11 Jahre).

### W7 5m short schluss — Klasse ab1000

u_E 0,1954 (6,41 × MDE_B), u_B 0,1411 (t 9,25), K_kand 0,0449, delta80 0,0743, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0012, u_B lückenbereinigt 0,1399 (t 9,16), Haltezeit Kandidat 248,39 min gegen Topf 207,11 min (Versatz 0,20, Uhrzeit-Tor nein), Überlebens-Differenz brutto 0,0003, Spiegel-Summe 0,3371 (t 13,15).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 228 | 2.720 | 0,1194 | 0,0250 | 4,77 | 0,1233 | 0,0784 | -0,0367 | nein |
| 2017 | 246 | 3.419 | 0,0738 | 0,0264 | 2,80 | 0,1159 | 0,0710 | -0,0441 | nein |
| 2018 | 247 | 5.364 | 0,2752 | 0,0411 | 6,70 | 0,3490 | 0,3041 | 0,1890 | nein |
| 2019 | 250 | 5.119 | 0,0990 | 0,0237 | 4,18 | 0,1152 | 0,0703 | -0,0448 | nein |
| 2020 | 252 | 8.934 | 0,2330 | 0,0419 | 5,56 | 0,2300 | 0,1851 | 0,0700 | nein |
| 2021 | 252 | 12.374 | 0,1630 | 0,0377 | 4,32 | 0,2062 | 0,1613 | 0,0462 | nein |
| 2022 | 249 | 9.046 | 0,4074 | 0,0399 | 10,21 | 0,4226 | 0,3777 | 0,2626 | nein |
| 2023 | 250 | 6.605 | 0,1806 | 0,0254 | 7,12 | 0,1905 | 0,1456 | 0,0305 | nein |
| 2024 | 252 | 9.107 | 0,0824 | 0,0266 | 3,10 | 0,1381 | 0,0932 | -0,0219 | nein |
| 2025 | 250 | 14.876 | 0,1872 | 0,0357 | 5,24 | 0,2249 | 0,1800 | 0,0649 | nein |
| 2026 | 166 | 13.892 | 0,0947 | 0,0298 | 3,17 | 0,1182 | 0,0733 | -0,0418 | nein |
| letzte 250 | 250 | 19.570 | 0,1022 | 0,0269 | 3,80 | 0,1533 | 0,1084 | -0,0067 | nein |

Trend über die Jahre: Steigung 0,0008 Pp/Jahr (t 0,08, 11 Jahre).

### W7 15m long 3h — Klasse ab1000

u_E 0,1961 (4,16 × MDE_B), u_B 0,1445 (t 6,13), K_kand 0,0449, delta80 0,1149, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0002, u_B lückenbereinigt 0,1443 (t 6,12), Haltezeit Kandidat 180,00 min gegen Topf 180,00 min (Versatz 0,00, Uhrzeit-Tor ja), Überlebens-Differenz brutto 0,0002, Spiegel-Summe 0,2628 (t 7,59).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 162 | 829 | 0,1233 | 0,0380 | 3,24 | 0,1448 | 0,0999 | 0,0948 | nein |
| 2017 | 188 | 822 | 0,0922 | 0,0403 | 2,29 | 0,1332 | 0,0883 | 0,0832 | nein |
| 2018 | 205 | 1.599 | 0,2032 | 0,0507 | 4,01 | 0,1757 | 0,1308 | 0,1257 | nein |
| 2019 | 191 | 1.175 | 0,1263 | 0,0564 | 2,24 | 0,1806 | 0,1357 | 0,1306 | nein |
| 2020 | 229 | 2.591 | 0,3474 | 0,0817 | 4,25 | 0,3826 | 0,3377 | 0,3326 | nein |
| 2021 | 243 | 3.900 | 0,1392 | 0,0616 | 2,26 | 0,1561 | 0,1112 | 0,1061 | nein |
| 2022 | 225 | 4.065 | 0,2919 | 0,0788 | 3,70 | 0,2692 | 0,2243 | 0,2192 | nein |
| 2023 | 222 | 1.910 | 0,1713 | 0,0477 | 3,59 | 0,2614 | 0,2165 | 0,2114 | nein |
| 2024 | 243 | 2.877 | 0,1645 | 0,0462 | 3,56 | 0,2126 | 0,1677 | 0,1626 | nein |
| 2025 | 247 | 4.388 | 0,1266 | 0,0398 | 3,18 | 0,2011 | 0,1562 | 0,1511 | nein |
| 2026 | 166 | 4.900 | 0,1162 | 0,0581 | 2,00 | 0,1866 | 0,1417 | 0,1366 | nein |
| letzte 250 | 250 | 6.755 | 0,1340 | 0,0440 | 3,04 | 0,1963 | 0,1514 | 0,1463 | nein |

Trend über die Jahre: Steigung 0,0002 Pp/Jahr (t 0,02, 11 Jahre).

### W7 15m long schluss — Klasse 50-250

u_E 0,1068 (4,86 × MDE_B), u_B 0,0877 (t 7,99), K_kand 0,0854, delta80 0,0535, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0037, u_B lückenbereinigt 0,0827 (t 7,57), Haltezeit Kandidat 233,60 min gegen Topf 202,09 min (Versatz 0,16, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0040, Spiegel-Summe 0,1522 (t 7,77).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 75.602 | 0,1030 | 0,0189 | 5,44 | 0,2341 | 0,1487 | 0,0741 | nein |
| 2017 | 251 | 79.391 | -0,0178 | 0,0100 | -1,78 | 0,0768 | -0,0086 | -0,0832 | nein |
| 2018 | 251 | 97.664 | 0,0984 | 0,0180 | 5,46 | 0,1237 | 0,0383 | -0,0363 | nein |
| 2019 | 252 | 79.782 | 0,0249 | 0,0139 | 1,80 | 0,1307 | 0,0453 | -0,0293 | nein |
| 2020 | 253 | 94.691 | 0,1268 | 0,0512 | 2,48 | 0,2108 | 0,1254 | 0,0508 | nein |
| 2021 | 252 | 99.320 | 0,1204 | 0,0243 | 4,95 | 0,1747 | 0,0893 | 0,0147 | nein |
| 2022 | 251 | 118.411 | 0,2893 | 0,0411 | 7,04 | 0,3826 | 0,2972 | 0,2226 | nein |
| 2023 | 250 | 96.907 | 0,1228 | 0,0192 | 6,39 | 0,2182 | 0,1328 | 0,0582 | nein |
| 2024 | 252 | 102.776 | 0,0385 | 0,0149 | 2,59 | 0,1048 | 0,0194 | -0,0552 | nein |
| 2025 | 250 | 112.358 | 0,1262 | 0,0279 | 4,53 | 0,2205 | 0,1351 | 0,0605 | nein |
| 2026 | 166 | 80.583 | 0,0579 | 0,0223 | 2,60 | 0,1422 | 0,0568 | -0,0178 | nein |
| letzte 250 | 250 | 121.722 | 0,0542 | 0,0188 | 2,89 | 0,1171 | 0,0317 | -0,0429 | nein |

Trend über die Jahre: Steigung 0,0048 Pp/Jahr (t 0,61, 11 Jahre).

### W7 15m long schluss — Klasse 250-1000

u_E 0,1483 (6,22 × MDE_B), u_B 0,1261 (t 10,58), K_kand 0,0647, delta80 0,0580, Tor 2 ja — Etikett: **Kandidat fuer den Vorwaertstest**.

Einstiegslücke je Signal 0,0012, u_B lückenbereinigt 0,1243 (t 10,45), Haltezeit Kandidat 234,95 min gegen Topf 202,10 min (Versatz 0,16, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0062, Spiegel-Summe 0,2207 (t 10,03).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 231 | 14.948 | 0,0878 | 0,0264 | 3,32 | 0,1720 | 0,1073 | 0,0120 | nein |
| 2017 | 251 | 13.030 | 0,0213 | 0,0131 | 1,62 | 0,0890 | 0,0243 | -0,0710 | nein |
| 2018 | 249 | 19.287 | 0,1445 | 0,0205 | 7,06 | 0,1418 | 0,0771 | -0,0182 | nein |
| 2019 | 251 | 14.554 | 0,0910 | 0,0238 | 3,82 | 0,1753 | 0,1106 | 0,0153 | nein |
| 2020 | 252 | 23.122 | 0,2125 | 0,0434 | 4,90 | 0,2776 | 0,2129 | 0,1176 | nein |
| 2021 | 252 | 28.490 | 0,1479 | 0,0294 | 5,03 | 0,1786 | 0,1139 | 0,0186 | nein |
| 2022 | 249 | 35.242 | 0,3263 | 0,0380 | 8,58 | 0,4068 | 0,3421 | 0,2468 | nein |
| 2023 | 250 | 24.604 | 0,1494 | 0,0204 | 7,34 | 0,2268 | 0,1621 | 0,0668 | nein |
| 2024 | 252 | 26.516 | 0,0800 | 0,0185 | 4,32 | 0,1384 | 0,0737 | -0,0216 | nein |
| 2025 | 250 | 36.080 | 0,1728 | 0,0274 | 6,30 | 0,2458 | 0,1811 | 0,0858 | nein |
| 2026 | 166 | 30.527 | 0,0986 | 0,0274 | 3,60 | 0,1605 | 0,0958 | 0,0005 | nein |
| letzte 250 | 250 | 44.774 | 0,1101 | 0,0222 | 4,95 | 0,1518 | 0,0871 | -0,0082 | nein |

Trend über die Jahre: Steigung 0,0063 Pp/Jahr (t 0,81, 11 Jahre).

### W7 15m long schluss — Klasse ab1000

u_E 0,2928 (6,14 × MDE_B), u_B 0,2345 (t 9,83), K_kand 0,0449, delta80 0,1162, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0002, u_B lückenbereinigt 0,2344 (t 9,83), Haltezeit Kandidat 238,11 min gegen Topf 202,15 min (Versatz 0,18, Uhrzeit-Tor nein), Überlebens-Differenz brutto 0,0003, Spiegel-Summe 0,4182 (t 11,50).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 181 | 1.322 | 0,2004 | 0,0402 | 4,99 | 0,2343 | 0,1894 | 0,0743 | nein |
| 2017 | 201 | 1.227 | 0,1455 | 0,0383 | 3,80 | 0,1827 | 0,1378 | 0,0227 | nein |
| 2018 | 216 | 2.618 | 0,2942 | 0,0495 | 5,94 | 0,2466 | 0,2017 | 0,0866 | nein |
| 2019 | 216 | 1.874 | 0,2313 | 0,0475 | 4,87 | 0,2860 | 0,2411 | 0,1260 | nein |
| 2020 | 239 | 4.154 | 0,4505 | 0,0678 | 6,64 | 0,4909 | 0,4460 | 0,3309 | nein |
| 2021 | 247 | 6.025 | 0,2524 | 0,0710 | 3,56 | 0,2600 | 0,2151 | 0,1000 | nein |
| 2022 | 231 | 6.497 | 0,4011 | 0,0627 | 6,40 | 0,4144 | 0,3695 | 0,2544 | nein |
| 2023 | 229 | 2.835 | 0,2718 | 0,0500 | 5,44 | 0,3362 | 0,2913 | 0,1762 | nein |
| 2024 | 247 | 4.352 | 0,2479 | 0,0526 | 4,71 | 0,2765 | 0,2316 | 0,1165 | nein |
| 2025 | 248 | 6.953 | 0,2252 | 0,0408 | 5,52 | 0,2803 | 0,2354 | 0,1203 | nein |
| 2026 | 166 | 7.535 | 0,2237 | 0,0487 | 4,59 | 0,2938 | 0,2489 | 0,1338 | nein |
| letzte 250 | 250 | 10.456 | 0,2177 | 0,0396 | 5,50 | 0,2587 | 0,2138 | 0,0987 | nein |

Trend über die Jahre: Steigung 0,0030 Pp/Jahr (t 0,34, 11 Jahre).

### W7 15m short schluss — Klasse 250-1000

u_E 0,1194 (4,31 × MDE_B), u_B 0,0946 (t 6,83), K_kand 0,0647, delta80 0,0675, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal 0,0004, u_B lückenbereinigt 0,0936 (t 6,78), Haltezeit Kandidat 237,03 min gegen Topf 202,09 min (Versatz 0,17, Uhrzeit-Tor nein), Überlebens-Differenz brutto -0,0019, Spiegel-Summe 0,2207 (t 10,03).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 232 | 17.794 | 0,0562 | 0,0166 | 3,38 | 0,0924 | 0,0277 | -0,0676 | nein |
| 2017 | 251 | 17.612 | -0,0102 | 0,0105 | -0,97 | 0,0462 | -0,0185 | -0,1138 | nein |
| 2018 | 251 | 20.751 | 0,1031 | 0,0199 | 5,18 | 0,2163 | 0,1516 | 0,0563 | nein |
| 2019 | 251 | 20.676 | 0,0503 | 0,0135 | 3,71 | 0,0893 | 0,0246 | -0,0707 | nein |
| 2020 | 252 | 26.678 | 0,2563 | 0,0584 | 4,39 | 0,3018 | 0,2371 | 0,1418 | nein |
| 2021 | 252 | 34.128 | 0,0481 | 0,0257 | 1,87 | 0,1406 | 0,0759 | -0,0194 | nein |
| 2022 | 250 | 32.209 | 0,3218 | 0,0421 | 7,65 | 0,3605 | 0,2958 | 0,2005 | nein |
| 2023 | 250 | 29.588 | 0,1116 | 0,0184 | 6,05 | 0,1593 | 0,0946 | -0,0007 | nein |
| 2024 | 252 | 31.589 | 0,0610 | 0,0206 | 2,96 | 0,1297 | 0,0650 | -0,0303 | nein |
| 2025 | 250 | 44.027 | 0,1503 | 0,0384 | 3,92 | 0,2040 | 0,1393 | 0,0440 | nein |
| 2026 | 166 | 31.985 | 0,0484 | 0,0257 | 1,88 | 0,1143 | 0,0496 | -0,0457 | nein |
| letzte 250 | 250 | 47.411 | 0,0502 | 0,0213 | 2,36 | 0,1362 | 0,0715 | -0,0238 | nein |

Trend über die Jahre: Steigung 0,0060 Pp/Jahr (t 0,62, 11 Jahre).

### W7 15m short schluss — Klasse ab1000

u_E 0,1745 (4,17 × MDE_B), u_B 0,1779 (t 8,51), K_kand 0,0449, delta80 0,1018, Tor 2 nein — Etikett: **nicht entscheidbar** (Tor 2: delta80 >= K_kand).

Einstiegslücke je Signal -0,0003, u_B lückenbereinigt 0,1780 (t 8,53), Haltezeit Kandidat 239,85 min gegen Topf 202,11 min (Versatz 0,19, Uhrzeit-Tor nein), Überlebens-Differenz brutto 0,0004, Spiegel-Summe 0,4182 (t 11,50).

| Jahr | nTage | nSig | u | se | t | brutto | netto | Schein BV1 | dünn |
|---|---|---|---|---|---|---|---|---|---|
| 2016 | 200 | 1.592 | 0,1688 | 0,0371 | 4,55 | 0,1591 | 0,1142 | -0,0009 | nein |
| 2017 | 229 | 2.153 | 0,0787 | 0,0270 | 2,91 | 0,1154 | 0,0705 | -0,0446 | nein |
| 2018 | 228 | 3.154 | 0,2000 | 0,0431 | 4,64 | 0,2415 | 0,1966 | 0,0815 | nein |
| 2019 | 235 | 3.223 | 0,0833 | 0,0293 | 2,84 | 0,0926 | 0,0477 | -0,0674 | nein |
| 2020 | 239 | 5.271 | 0,2096 | 0,0694 | 3,02 | 0,2201 | 0,1752 | 0,0601 | nein |
| 2021 | 251 | 7.019 | 0,1411 | 0,0590 | 2,39 | 0,1833 | 0,1384 | 0,0233 | nein |
| 2022 | 228 | 4.868 | 0,3349 | 0,0556 | 6,02 | 0,3583 | 0,3134 | 0,1983 | nein |
| 2023 | 238 | 4.074 | 0,2322 | 0,0351 | 6,62 | 0,2328 | 0,1879 | 0,0728 | nein |
| 2024 | 249 | 5.416 | 0,1133 | 0,0432 | 2,62 | 0,1651 | 0,1202 | 0,0051 | nein |
| 2025 | 250 | 8.588 | 0,2231 | 0,0449 | 4,97 | 0,2559 | 0,2110 | 0,0959 | nein |
| 2026 | 166 | 8.346 | 0,1409 | 0,0333 | 4,23 | 0,1610 | 0,1161 | 0,0010 | nein |
| letzte 250 | 250 | 11.616 | 0,1468 | 0,0340 | 4,31 | 0,1958 | 0,1509 | 0,0358 | nein |

Trend über die Jahre: Steigung 0,0055 Pp/Jahr (t 0,74, 11 Jahre).

## 6. Die vollständige Tafel — 900 Zeilen, sortiert nach dem `t` der Entdeckung

`u_E/MDE` ist der Tor-1-Abstand: Tor 1 verlangt **4,00**. `Schein` ist das Brutto-Tagesmittel der
Bestätigung minus Scheinhürde (BV1 / Standard). Zeilen ohne Signal in der Klasse stehen mit „–" da.

| # | Det | ZR | Ri | H | Klasse | nTage_E | u_E | t_E | u_E/MDE | Tor 1 | nTage_B | nSig_B | brutto_B | K_kand | u_B | se_B | t_B | MDE_B | delta80 | akt u | akt t | BV1 | Std | Etikett |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | W7 | 5m | long | schluss | ab1000 | 1.744 | 0,2241 | 16,99 | 6,81 | ja | 894 | 38.735 | 0,2467 | 0,0449 | 0,1960 | 0,0164 | 11,92 | 0,0329 | 0,0801 | 0,1594 | 5,75 | 0,0867 | -0,1733 | nicht entscheidbar |
| 2 | W7 | 5m | long | schluss | 250-1000 | 1.766 | 0,1149 | 14,94 | 5,76 | ja | 894 | 209.639 | 0,1551 | 0,0647 | 0,0924 | 0,0100 | 9,26 | 0,0200 | 0,0486 | 0,0788 | 4,25 | -0,0049 | -0,2649 | Kandidat fuer den Vorwaertstest |
| 3 | W7 | 5m | short | schluss | ab1000 | 1.748 | 0,1954 | 14,74 | 6,41 | ja | 894 | 43.818 | 0,1802 | 0,0449 | 0,1411 | 0,0153 | 9,25 | 0,0305 | 0,0743 | 0,1022 | 3,80 | 0,0202 | -0,2398 | nicht entscheidbar |
| 4 | W7 | 15m | long | schluss | ab1000 | 1.551 | 0,2928 | 13,34 | 6,14 | ja | 870 | 21.533 | 0,2825 | 0,0449 | 0,2345 | 0,0238 | 9,83 | 0,0477 | 0,1162 | 0,2177 | 5,50 | 0,1225 | -0,1375 | nicht entscheidbar |
| 5 | W7 | 15m | long | schluss | 250-1000 | 1.759 | 0,1483 | 13,21 | 6,22 | ja | 894 | 115.972 | 0,1895 | 0,0647 | 0,1261 | 0,0119 | 10,58 | 0,0238 | 0,0580 | 0,1101 | 4,95 | 0,0295 | -0,2305 | Kandidat fuer den Vorwaertstest |
| 6 | W7 | 5m | long | 3h | ab1000 | 1.702 | 0,1807 | 12,53 | 5,48 | ja | 892 | 26.430 | 0,1990 | 0,0449 | 0,1283 | 0,0165 | 7,78 | 0,0330 | 0,0804 | 0,1171 | 3,71 | 0,1490 | -0,0310 | nicht entscheidbar |
| 7 | W7 | 1m | long | schluss | ab1000 | 1.766 | 0,0597 | 11,56 | 4,37 | ja | 894 | 86.521 | 0,0927 | 0,0449 | 0,0415 | 0,0068 | 6,07 | 0,0137 | 0,0333 | 0,0116 | 0,94 | -0,0673 | -0,3273 | Kandidat fuer den Vorwaertstest |
| 8 | W7 | 5m | short | schluss | 250-1000 | 1.766 | 0,0996 | 11,50 | 4,97 | ja | 894 | 230.699 | 0,1321 | 0,0647 | 0,0682 | 0,0100 | 6,80 | 0,0200 | 0,0488 | 0,0434 | 2,39 | -0,0279 | -0,2879 | Kandidat fuer den Vorwaertstest |
| 9 | W7 | 1m | short | schluss | ab1000 | 1.766 | 0,0595 | 10,89 | 4,42 | ja | 894 | 92.107 | 0,0722 | 0,0449 | 0,0336 | 0,0067 | 4,99 | 0,0135 | 0,0328 | 0,0113 | 0,87 | -0,0878 | -0,3478 | Kandidat fuer den Vorwaertstest |
| 10 | W7 | 5m | long | schluss | 50-250 | 1.766 | 0,0833 | 10,78 | 4,37 | ja | 894 | 692.359 | 0,1491 | 0,0854 | 0,0707 | 0,0095 | 7,42 | 0,0191 | 0,0464 | 0,0430 | 2,62 | -0,0109 | -0,2709 | Kandidat fuer den Vorwaertstest |
| 11 | W7 | 15m | short | schluss | 250-1000 | 1.763 | 0,1194 | 9,87 | 4,31 | ja | 894 | 133.987 | 0,1577 | 0,0647 | 0,0946 | 0,0139 | 6,83 | 0,0277 | 0,0675 | 0,0502 | 2,36 | -0,0023 | -0,2623 | nicht entscheidbar |
| 12 | W7 | 15m | long | schluss | 50-250 | 1.766 | 0,1068 | 9,59 | 4,86 | ja | 894 | 386.251 | 0,1671 | 0,0854 | 0,0877 | 0,0110 | 7,99 | 0,0219 | 0,0535 | 0,0542 | 2,89 | 0,0071 | -0,2529 | Kandidat fuer den Vorwaertstest |
| 13 | W7 | 15m | short | schluss | ab1000 | 1.633 | 0,1745 | 9,47 | 4,17 | ja | 880 | 25.967 | 0,2116 | 0,0449 | 0,1779 | 0,0209 | 8,51 | 0,0418 | 0,1018 | 0,1468 | 4,31 | 0,0516 | -0,2084 | nicht entscheidbar |
| 14 | W7 | 5m | long | naechste | 250-1000 | 1.766 | 0,0999 | 9,24 | 3,36 | nein | 893 | 209.290 | 0,2150 | 0,0647 | 0,1026 | 0,0149 | 6,89 | 0,0298 | 0,0725 | 0,1078 | 3,85 | 0,0550 | -0,2050 | kein Kandidat |
| 15 | W7 | 5m | short | 3h | ab1000 | 1.726 | 0,1404 | 9,12 | 4,11 | ja | 894 | 29.863 | 0,1264 | 0,0449 | 0,1077 | 0,0171 | 6,30 | 0,0342 | 0,0833 | 0,0610 | 2,15 | 0,0764 | -0,1036 | nicht entscheidbar |
| 16 | W7 | 5m | long | naechste | ab1000 | 1.744 | 0,1597 | 8,84 | 3,52 | nein | 893 | 38.661 | 0,3292 | 0,0449 | 0,1766 | 0,0227 | 7,78 | 0,0454 | 0,1106 | 0,1572 | 3,60 | 0,1692 | -0,0908 | kein Kandidat |
| 17 | W7 | 15m | long | naechste | 250-1000 | 1.759 | 0,1339 | 8,61 | 3,47 | nein | 893 | 115.717 | 0,2606 | 0,0647 | 0,1478 | 0,0193 | 7,66 | 0,0386 | 0,0940 | 0,1776 | 5,25 | 0,1006 | -0,1594 | kein Kandidat |
| 18 | W7 | 5m | short | schluss | 50-250 | 1.766 | 0,0627 | 8,51 | 3,44 | nein | 894 | 742.248 | 0,1387 | 0,0854 | 0,0475 | 0,0091 | 5,22 | 0,0182 | 0,0443 | 0,0240 | 1,63 | -0,0213 | -0,2813 | kein Kandidat |
| 19 | W7 | 5m | long | 3h | 250-1000 | 1.765 | 0,0744 | 8,33 | 3,55 | nein | 894 | 140.452 | 0,1255 | 0,0647 | 0,0485 | 0,0105 | 4,63 | 0,0209 | 0,0510 | 0,0433 | 2,03 | 0,0755 | -0,1045 | kein Kandidat |
| 20 | W7 | 1m | short | 3h | ab1000 | 1.765 | 0,0639 | 8,21 | 3,28 | nein | 894 | 55.225 | 0,0545 | 0,0449 | 0,0358 | 0,0098 | 3,67 | 0,0195 | 0,0475 | 0,0202 | 0,98 | 0,0045 | -0,1755 | kein Kandidat |
| 21 | W7 | 5m | short | naechste | ab1000 | 1.748 | 0,1512 | 8,18 | 3,47 | nein | 893 | 43.783 | 0,0728 | 0,0449 | 0,1331 | 0,0218 | 6,11 | 0,0436 | 0,1061 | 0,1367 | 3,23 | -0,0872 | -0,3472 | kein Kandidat |
| 22 | W7 | 15m | long | naechste | 50-250 | 1.766 | 0,1115 | 8,17 | 3,48 | nein | 893 | 385.307 | 0,2415 | 0,0854 | 0,1147 | 0,0160 | 7,16 | 0,0321 | 0,0781 | 0,1008 | 3,75 | 0,0815 | -0,1785 | kein Kandidat |
| 23 | W7 | 15m | long | 3h | ab1000 | 1.461 | 0,1961 | 8,17 | 4,16 | ja | 860 | 13.982 | 0,2093 | 0,0449 | 0,1445 | 0,0236 | 6,13 | 0,0472 | 0,1149 | 0,1340 | 3,04 | 0,1593 | -0,0207 | nicht entscheidbar |
| 24 | W7 | 15m | short | schluss | 50-250 | 1.766 | 0,0667 | 8,06 | 2,88 | nein | 894 | 427.447 | 0,1545 | 0,0854 | 0,0644 | 0,0116 | 5,56 | 0,0232 | 0,0565 | 0,0328 | 1,87 | -0,0055 | -0,2655 | kein Kandidat |
| 25 | W7 | 5m | short | naechste | 250-1000 | 1.766 | 0,0898 | 7,98 | 3,33 | nein | 893 | 230.484 | 0,0849 | 0,0647 | 0,0698 | 0,0135 | 5,17 | 0,0270 | 0,0658 | 0,0507 | 2,07 | -0,0751 | -0,3351 | kein Kandidat |
| 26 | W7 | 15m | long | naechste | ab1000 | 1.551 | 0,2316 | 7,97 | 3,49 | nein | 869 | 21.490 | 0,3509 | 0,0449 | 0,1973 | 0,0332 | 5,94 | 0,0664 | 0,1619 | 0,2636 | 4,38 | 0,1909 | -0,0691 | kein Kandidat |
| 27 | W7 | 5m | long | naechste | 50-250 | 1.766 | 0,0786 | 7,90 | 2,93 | nein | 893 | 691.090 | 0,2016 | 0,0854 | 0,0755 | 0,0134 | 5,63 | 0,0268 | 0,0654 | 0,0559 | 2,46 | 0,0416 | -0,2184 | kein Kandidat |
| 28 | W7 | 5m | short | 1h | ab1000 | 1.744 | 0,0696 | 7,62 | 3,16 | nein | 894 | 39.993 | 0,0686 | 0,0449 | 0,0282 | 0,0110 | 2,57 | 0,0220 | 0,0536 | 0,0085 | 0,55 | 0,0186 | -0,1614 | kein Kandidat |
| 29 | W7 | 5m | long | 1h | ab1000 | 1.731 | 0,0708 | 7,44 | 3,25 | nein | 893 | 35.360 | 0,0912 | 0,0449 | 0,0420 | 0,0109 | 3,86 | 0,0218 | 0,0531 | 0,0266 | 1,28 | 0,0412 | -0,1388 | kein Kandidat |
| 30 | W7 | 15m | long | 1h | ab1000 | 1.532 | 0,1109 | 7,34 | 4,00 | nein | 867 | 19.597 | 0,0987 | 0,0449 | 0,0509 | 0,0139 | 3,67 | 0,0277 | 0,0676 | 0,0544 | 2,18 | 0,0487 | -0,1313 | kein Kandidat |
| 31 | W4 | 1m | long | schluss | ab1000 | 864 | 0,2876 | 7,34 | 3,11 | nein | 645 | 1.841 | 0,0857 | 0,0449 | 0,0806 | 0,0463 | 1,74 | 0,0925 | 0,2255 | 0,1000 | 1,92 | -0,0743 | -0,3343 | kein Kandidat |
| 32 | W7 | 1m | long | 3h | ab1000 | 1.766 | 0,0518 | 7,22 | 2,87 | nein | 894 | 51.770 | 0,1088 | 0,0449 | 0,0379 | 0,0090 | 4,20 | 0,0180 | 0,0439 | 0,0183 | 1,03 | 0,0588 | -0,1212 | kein Kandidat |
| 33 | W7 | 15m | short | naechste | 250-1000 | 1.763 | 0,1079 | 6,65 | 3,12 | nein | 893 | 133.906 | 0,1040 | 0,0647 | 0,0893 | 0,0173 | 5,16 | 0,0346 | 0,0842 | 0,0821 | 2,67 | -0,0560 | -0,3160 | kein Kandidat |
| 34 | W7 | 5m | short | 3h | 250-1000 | 1.765 | 0,0746 | 6,42 | 3,62 | nein | 894 | 155.564 | 0,0839 | 0,0647 | 0,0340 | 0,0103 | 3,29 | 0,0206 | 0,0502 | 0,0185 | 0,93 | 0,0339 | -0,1461 | kein Kandidat |
| 35 | W7 | 5m | long | 3h | 50-250 | 1.766 | 0,0495 | 6,38 | 2,70 | nein | 894 | 460.586 | 0,1254 | 0,0854 | 0,0321 | 0,0092 | 3,51 | 0,0183 | 0,0446 | 0,0248 | 1,43 | 0,0754 | -0,1046 | kein Kandidat |
| 36 | W7 | 5m | short | naechste | 50-250 | 1.766 | 0,0607 | 6,34 | 2,47 | nein | 893 | 741.660 | 0,0943 | 0,0854 | 0,0505 | 0,0123 | 4,10 | 0,0246 | 0,0600 | 0,0360 | 1,81 | -0,0657 | -0,3257 | kein Kandidat |
| 37 | W7 | 1m | long | naechste | ab1000 | 1.766 | 0,0443 | 6,31 | 2,56 | nein | 893 | 86.371 | 0,1993 | 0,0449 | 0,0462 | 0,0087 | 5,34 | 0,0173 | 0,0422 | 0,0218 | 1,27 | 0,0393 | -0,2207 | kein Kandidat |
| 38 | W3 | 1m | long | schluss | 250-1000 | 1.763 | 0,1158 | 6,24 | 2,60 | nein | 894 | 25.547 | 0,1625 | 0,0647 | 0,0990 | 0,0223 | 4,45 | 0,0445 | 0,1085 | 0,0900 | 2,24 | 0,0025 | -0,2575 | kein Kandidat |
| 39 | W7 | 1m | short | naechste | ab1000 | 1.766 | 0,0448 | 6,03 | 2,43 | nein | 893 | 91.960 | -0,0218 | 0,0449 | 0,0395 | 0,0092 | 4,29 | 0,0184 | 0,0448 | 0,0308 | 1,68 | -0,1818 | -0,4418 | kein Kandidat |
| 40 | W7 | 15m | long | 3h | 250-1000 | 1.757 | 0,0787 | 5,92 | 3,16 | nein | 893 | 73.862 | 0,1380 | 0,0647 | 0,0610 | 0,0125 | 4,90 | 0,0249 | 0,0607 | 0,0489 | 1,87 | 0,0880 | -0,0920 | kein Kandidat |
| 41 | W7 | 15m | short | naechste | 50-250 | 1.766 | 0,0650 | 5,85 | 2,16 | nein | 893 | 427.164 | 0,1138 | 0,0854 | 0,0709 | 0,0151 | 4,70 | 0,0301 | 0,0734 | 0,0650 | 2,73 | -0,0462 | -0,3062 | kein Kandidat |
| 42 | W3 | 1m | long | schluss | 50-250 | 1.766 | 0,0764 | 5,56 | 2,06 | nein | 894 | 55.460 | 0,1126 | 0,0854 | 0,0342 | 0,0185 | 1,85 | 0,0371 | 0,0903 | -0,0043 | -0,15 | -0,0474 | -0,3074 | kein Kandidat |
| 43 | W7 | 15m | long | 3h | 50-250 | 1.766 | 0,0559 | 5,49 | 2,74 | nein | 894 | 243.839 | 0,1290 | 0,0854 | 0,0363 | 0,0102 | 3,55 | 0,0204 | 0,0498 | 0,0235 | 1,16 | 0,0790 | -0,1010 | kein Kandidat |
| 44 | W4 | 1m | long | schluss | 250-1000 | 1.754 | 0,0629 | 5,49 | 2,70 | nein | 894 | 13.735 | 0,0736 | 0,0647 | 0,0096 | 0,0116 | 0,82 | 0,0233 | 0,0567 | -0,0002 | -0,01 | -0,0864 | -0,3464 | kein Kandidat |
| 45 | W7 | 15m | short | 3h | 250-1000 | 1.756 | 0,0659 | 5,21 | 2,40 | nein | 894 | 86.577 | 0,1047 | 0,0647 | 0,0543 | 0,0137 | 3,96 | 0,0274 | 0,0669 | 0,0064 | 0,30 | 0,0547 | -0,1253 | kein Kandidat |
| 46 | W3 | 1m | long | schluss | ab1000 | 1.575 | 0,1235 | 4,56 | 1,75 | nein | 865 | 7.856 | 0,1358 | 0,0449 | 0,0983 | 0,0353 | 2,79 | 0,0705 | 0,1718 | 0,0954 | 1,66 | -0,0242 | -0,2842 | kein Kandidat |
| 47 | W3 | 1m | long | naechste | 50-250 | 1.766 | 0,0757 | 4,42 | 1,57 | nein | 893 | 55.369 | 0,1769 | 0,0854 | 0,0492 | 0,0240 | 2,05 | 0,0481 | 0,1171 | 0,0051 | 0,12 | 0,0169 | -0,2431 | kein Kandidat |
| 48 | W7 | 5m | short | 3h | 50-250 | 1.766 | 0,0354 | 4,24 | 1,94 | nein | 894 | 499.997 | 0,0871 | 0,0854 | 0,0106 | 0,0092 | 1,15 | 0,0183 | 0,0446 | 0,0021 | 0,13 | 0,0371 | -0,1429 | kein Kandidat |
| 49 | W4 | 5m | long | schluss | ab1000 | 149 | 0,3813 | 4,17 | 1,55 | nein | 134 | 176 | -0,0829 | 0,0449 | 0,1063 | 0,1228 | 0,87 | 0,2455 | 0,5982 | 0,1425 | 1,05 | -0,2429 | -0,5029 | kein Kandidat |
| 50 | W7 | 15m | short | 3h | ab1000 | 1.574 | 0,0855 | 4,16 | 2,01 | nein | 871 | 16.939 | 0,1394 | 0,0449 | 0,1214 | 0,0212 | 5,72 | 0,0424 | 0,1034 | 0,0995 | 2,68 | 0,0894 | -0,0906 | kein Kandidat |
| 51 | W4 | 5m | long | schluss | 50-250 | 1.753 | 0,0603 | 3,96 | 1,99 | nein | 891 | 9.705 | 0,0899 | 0,0854 | 0,0111 | 0,0152 | 0,73 | 0,0303 | 0,0739 | -0,0365 | -1,25 | -0,0701 | -0,3301 | kein Kandidat |
| 52 | W3 | 1m | long | naechste | 250-1000 | 1.763 | 0,0924 | 3,63 | 1,64 | nein | 893 | 25.511 | 0,2006 | 0,0647 | 0,0871 | 0,0282 | 3,09 | 0,0565 | 0,1375 | 0,1063 | 2,02 | 0,0406 | -0,2194 | kein Kandidat |
| 53 | W4 | 15m | long | schluss | 250-1000 | 173 | 0,3039 | 3,49 | 2,22 | nein | 192 | 262 | -0,0903 | 0,0647 | -0,0075 | 0,0684 | -0,11 | 0,1367 | 0,3330 | -0,0207 | -0,17 | -0,2503 | -0,5103 | kein Kandidat |
| 54 | W4 | 1m | long | naechste | ab1000 | 864 | 0,3271 | 3,37 | 2,84 | nein | 644 | 1.840 | 0,1266 | 0,0449 | 0,0139 | 0,0577 | 0,24 | 0,1154 | 0,2811 | 0,0846 | 1,08 | -0,0334 | -0,2934 | kein Kandidat |
| 55 | W4 | 1m | long | schluss | 50-250 | 1.766 | 0,0206 | 3,20 | 1,18 | nein | 894 | 37.157 | 0,0590 | 0,0854 | -0,0200 | 0,0087 | -2,29 | 0,0175 | 0,0425 | -0,0415 | -2,52 | -0,1010 | -0,3610 | kein Kandidat |
| 56 | W4 | 1m | long | 3h | 250-1000 | 1.686 | 0,0510 | 3,17 | 1,68 | nein | 884 | 7.332 | 0,0762 | 0,0647 | -0,0003 | 0,0152 | -0,02 | 0,0304 | 0,0741 | -0,0136 | -0,49 | 0,0262 | -0,1538 | kein Kandidat |
| 57 | W4 | 15m | long | schluss | ab1000 | 24 | 0,4872 | 3,11 | 0,72 | nein | 22 | 23 | -0,4413 | 0,0449 | -0,0580 | 0,3370 | -0,17 | 0,6740 | 1,6421 | 0,0703 | 0,24 | -0,6013 | -0,8613 | kein Kandidat |
| 58 | W7 | 5m | long | schluss | 5-50 | 1.766 | 0,0252 | 3,07 | 1,24 | nein | 894 | 1.167.764 | 0,1558 | 0,1569 | 0,0105 | 0,0101 | 1,04 | 0,0203 | 0,0494 | -0,0264 | -1,58 | -0,0042 | -0,2642 | kein Kandidat |
| 59 | W7 | 15m | short | naechste | ab1000 | 1.633 | 0,0959 | 3,07 | 1,54 | nein | 879 | 25.958 | 0,0656 | 0,0449 | 0,1309 | 0,0312 | 4,19 | 0,0625 | 0,1522 | 0,2022 | 3,59 | -0,0944 | -0,3544 | kein Kandidat |
| 60 | W4 | 1m | long | naechste | 250-1000 | 1.754 | 0,0517 | 3,05 | 1,46 | nein | 893 | 13.711 | 0,1253 | 0,0647 | 0,0123 | 0,0177 | 0,70 | 0,0354 | 0,0863 | 0,0092 | 0,25 | -0,0347 | -0,2947 | kein Kandidat |
| 61 | W7 | 15m | short | 1h | ab1000 | 1.624 | 0,0327 | 2,91 | 1,47 | nein | 878 | 23.703 | 0,0773 | 0,0449 | 0,0382 | 0,0112 | 3,42 | 0,0223 | 0,0544 | 0,0370 | 2,18 | 0,0273 | -0,1527 | kein Kandidat |
| 62 | W4 | 5m | long | 3h | ab1000 | 52 | 0,3747 | 2,90 | 1,22 | nein | 59 | 64 | -0,0301 | 0,0449 | 0,0208 | 0,1542 | 0,14 | 0,3083 | 0,7511 | 0,0878 | 0,49 | -0,0801 | -0,2601 | kein Kandidat |
| 63 | W3 | 5m | long | schluss | 50-250 | 1.747 | 0,0732 | 2,72 | 1,26 | nein | 890 | 27.365 | 0,0722 | 0,0854 | -0,0039 | 0,0291 | -0,13 | 0,0583 | 0,1420 | -0,0780 | -1,44 | -0,0878 | -0,3478 | kein Kandidat |
| 64 | W7 | 15m | long | 1h | 250-1000 | 1.759 | 0,0185 | 2,71 | 1,18 | nein | 894 | 104.456 | 0,0723 | 0,0647 | 0,0058 | 0,0078 | 0,74 | 0,0156 | 0,0381 | -0,0093 | -0,67 | 0,0223 | -0,1577 | kein Kandidat |
| 65 | W7 | 15m | short | 3h | 50-250 | 1.766 | 0,0244 | 2,66 | 1,02 | nein | 894 | 276.088 | 0,1018 | 0,0854 | 0,0250 | 0,0119 | 2,09 | 0,0239 | 0,0582 | 0,0022 | 0,13 | 0,0518 | -0,1282 | kein Kandidat |
| 66 | W7 | 5m | long | naechste | 5-50 | 1.766 | 0,0261 | 2,65 | 0,39 | nein | 893 | 1.166.097 | 0,3048 | 0,1569 | 0,0743 | 0,0332 | 2,24 | 0,0663 | 0,1616 | -0,0106 | -0,51 | 0,1448 | -0,1152 | kein Kandidat |
| 67 | W3 | 15m | long | schluss | ab1000 | 440 | 0,2191 | 2,62 | 1,35 | nein | 394 | 1.088 | 0,1851 | 0,0449 | 0,1835 | 0,0809 | 2,27 | 0,1618 | 0,3942 | 0,2570 | 1,97 | 0,0251 | -0,2349 | kein Kandidat |
| 68 | W4 | 1m | long | 3h | ab1000 | 471 | 0,3586 | 2,52 | 3,75 | nein | 439 | 841 | 0,1146 | 0,0449 | 0,1103 | 0,0479 | 2,31 | 0,0957 | 0,2332 | 0,1649 | 2,40 | 0,0646 | -0,1154 | kein Kandidat |
| 69 | W4 | 5m | long | naechste | ab1000 | 149 | 0,3039 | 2,51 | 0,65 | nein | 134 | 176 | -0,3246 | 0,0449 | -0,3048 | 0,2341 | -1,30 | 0,4681 | 1,1405 | -0,1320 | -0,52 | -0,4846 | -0,7446 | kein Kandidat |
| 70 | W7 | 15m | long | schluss | 5-50 | 1.766 | 0,0241 | 2,43 | 1,08 | nein | 894 | 700.943 | 0,1636 | 0,1569 | 0,0168 | 0,0112 | 1,50 | 0,0224 | 0,0545 | -0,0145 | -0,80 | 0,0036 | -0,2564 | kein Kandidat |
| 71 | W3 | 15m | long | 3h | ab1000 | 416 | 0,1931 | 2,43 | 1,51 | nein | 383 | 1.062 | 0,1385 | 0,0449 | 0,0993 | 0,0641 | 1,55 | 0,1282 | 0,3123 | 0,1066 | 1,19 | 0,0885 | -0,0915 | kein Kandidat |
| 72 | W3 | 5m | long | 3h | 50-250 | 1.740 | 0,0580 | 2,40 | 1,05 | nein | 890 | 24.898 | 0,0682 | 0,0854 | -0,0221 | 0,0276 | -0,80 | 0,0552 | 0,1346 | -0,0697 | -1,43 | 0,0182 | -0,1618 | kein Kandidat |
| 73 | W7 | 15m | short | 1h | 250-1000 | 1.762 | 0,0163 | 2,36 | 1,41 | nein | 894 | 121.538 | 0,0538 | 0,0647 | -0,0078 | 0,0058 | -1,35 | 0,0116 | 0,0282 | -0,0194 | -1,91 | 0,0038 | -0,1762 | kein Kandidat |
| 74 | W3 | 1m | long | 3h | 50-250 | 1.763 | 0,0492 | 2,35 | 0,99 | nein | 894 | 31.071 | 0,0863 | 0,0854 | -0,0082 | 0,0249 | -0,33 | 0,0497 | 0,1211 | -0,0009 | -0,02 | 0,0363 | -0,1437 | kein Kandidat |
| 75 | W4 | 15m | long | 3h | 250-1000 | 22 | 0,5924 | 2,35 | 0,99 | nein | 24 | 25 | 0,2039 | 0,0647 | 0,3484 | 0,3001 | 1,16 | 0,6002 | 1,4621 | 0,7548 | 1,20 | 0,1539 | -0,0261 | kein Kandidat |
| 76 | W4 | 5m | long | 3h | 50-250 | 1.592 | 0,0539 | 2,29 | 1,16 | nein | 849 | 3.914 | 0,0790 | 0,0854 | 0,0021 | 0,0232 | 0,09 | 0,0463 | 0,1128 | -0,0728 | -1,52 | 0,0290 | -0,1510 | kein Kandidat |
| 77 | W3 | 1m | long | 3h | 250-1000 | 1.728 | 0,0563 | 2,28 | 0,94 | nein | 892 | 15.613 | 0,0865 | 0,0647 | 0,0087 | 0,0298 | 0,29 | 0,0596 | 0,1453 | 0,0230 | 0,42 | 0,0365 | -0,1435 | kein Kandidat |
| 78 | W4 | 1m | long | 1h | ab1000 | 765 | 0,1126 | 2,27 | 1,50 | nein | 602 | 1.514 | 0,0616 | 0,0449 | 0,0284 | 0,0376 | 0,75 | 0,0752 | 0,1831 | 0,0104 | 0,24 | 0,0116 | -0,1684 | kein Kandidat |
| 79 | W7 | 15m | long | naechste | 5-50 | 1.766 | 0,0260 | 2,25 | 0,11 | nein | 893 | 699.593 | 0,5042 | 0,1569 | 0,2766 | 0,1225 | 2,26 | 0,2450 | 0,5970 | 0,0323 | 1,29 | 0,3442 | 0,0842 | kein Kandidat |
| 80 | W3 | 5m | long | 3h | ab1000 | 929 | 0,1196 | 2,24 | 1,15 | nein | 655 | 2.847 | 0,0924 | 0,0449 | 0,0292 | 0,0521 | 0,56 | 0,1041 | 0,2537 | 0,0116 | 0,14 | 0,0424 | -0,1376 | kein Kandidat |
| 81 | W3 | 1m | long | naechste | ab1000 | 1.575 | 0,0718 | 2,19 | 0,76 | nein | 864 | 7.843 | 0,2489 | 0,0449 | 0,1175 | 0,0474 | 2,48 | 0,0949 | 0,2312 | 0,1586 | 1,78 | 0,0889 | -0,1711 | kein Kandidat |
| 82 | W4 | 1m | short | schluss | 250-1000 | 1.760 | 0,0225 | 2,18 | 0,96 | nein | 894 | 13.882 | 0,0634 | 0,0647 | 0,0001 | 0,0117 | 0,01 | 0,0234 | 0,0569 | -0,0229 | -1,20 | -0,0966 | -0,3566 | kein Kandidat |
| 83 | W3 | 5m | long | naechste | 50-250 | 1.747 | 0,0770 | 2,15 | 1,06 | nein | 889 | 27.301 | 0,1311 | 0,0854 | 0,0088 | 0,0365 | 0,24 | 0,0729 | 0,1777 | -0,0506 | -0,66 | -0,0289 | -0,2889 | kein Kandidat |
| 84 | W4 | 15m | short | schluss | 250-1000 | 216 | 0,1463 | 2,13 | 1,31 | nein | 199 | 281 | 0,0501 | 0,0647 | 0,1337 | 0,0557 | 2,40 | 0,1115 | 0,2716 | 0,1031 | 1,12 | -0,1099 | -0,3699 | kein Kandidat |
| 85 | W4 | 1m | short | schluss | ab1000 | 932 | 0,0982 | 2,06 | 1,12 | nein | 681 | 1.816 | 0,0806 | 0,0449 | 0,0751 | 0,0439 | 1,71 | 0,0877 | 0,2138 | 0,1038 | 1,89 | -0,0794 | -0,3394 | kein Kandidat |
| 86 | W4 | 15m | long | 3h | ab1000 | 3 | 0,6879 | 1,98 | – | nein | 1 | 1 | 1,2646 | 0,0449 | 0,8330 | – | – | – | – | 0,8330 | – | 1,2146 | 1,0346 | nicht entscheidbar |
| 87 | W4 | 15m | short | 3h | 50-250 | 246 | 0,1575 | 1,97 | 0,89 | nein | 151 | 186 | 0,1343 | 0,0854 | 0,1314 | 0,0884 | 1,49 | 0,1769 | 0,4309 | 0,2525 | 1,32 | 0,0843 | -0,0957 | kein Kandidat |
| 88 | W7 | 5m | long | 1h | 250-1000 | 1.766 | 0,0104 | 1,96 | 0,77 | nein | 894 | 189.948 | 0,0583 | 0,0647 | -0,0080 | 0,0067 | -1,18 | 0,0134 | 0,0327 | -0,0203 | -1,56 | 0,0083 | -0,1717 | kein Kandidat |
| 89 | W4 | 15m | short | naechste | 50-250 | 1.149 | 0,0958 | 1,94 | 1,15 | nein | 654 | 1.688 | -0,0505 | 0,0854 | -0,0179 | 0,0417 | -0,43 | 0,0834 | 0,2033 | -0,0150 | -0,20 | -0,2105 | -0,4705 | kein Kandidat |
| 90 | W4 | 15m | short | schluss | 50-250 | 1.149 | 0,0555 | 1,89 | 0,88 | nein | 655 | 1.690 | 0,0633 | 0,0854 | 0,0352 | 0,0316 | 1,12 | 0,0631 | 0,1538 | 0,0464 | 0,77 | -0,0967 | -0,3567 | kein Kandidat |
| 91 | W3 | 15m | long | schluss | 50-250 | 1.638 | 0,0636 | 1,88 | 0,62 | nein | 865 | 11.836 | 0,1091 | 0,0854 | 0,0301 | 0,0509 | 0,59 | 0,1018 | 0,2481 | 0,0520 | 0,61 | -0,0509 | -0,3109 | kein Kandidat |
| 92 | W4 | 5m | long | naechste | 50-250 | 1.753 | 0,0458 | 1,80 | 0,89 | nein | 890 | 9.694 | 0,1220 | 0,0854 | -0,0054 | 0,0258 | -0,21 | 0,0516 | 0,1257 | -0,0433 | -1,05 | -0,0380 | -0,2980 | kein Kandidat |
| 93 | W4 | 15m | long | schluss | 50-250 | 1.118 | 0,0450 | 1,79 | 0,70 | nein | 639 | 1.617 | 0,0401 | 0,0854 | 0,0296 | 0,0322 | 0,92 | 0,0644 | 0,1568 | -0,1140 | -1,72 | -0,1199 | -0,3799 | kein Kandidat |
| 94 | W3 | 1m | long | 3h | ab1000 | 1.351 | 0,0632 | 1,72 | 0,67 | nein | 811 | 5.331 | 0,0633 | 0,0449 | 0,0082 | 0,0470 | 0,17 | 0,0939 | 0,2289 | 0,0570 | 0,71 | 0,0133 | -0,1667 | kein Kandidat |
| 95 | W3 | 15m | long | 1h | ab1000 | 435 | 0,0964 | 1,70 | 0,95 | nein | 391 | 1.079 | 0,1404 | 0,0449 | 0,1053 | 0,0506 | 2,08 | 0,1013 | 0,2468 | 0,0894 | 1,42 | 0,0904 | -0,0896 | kein Kandidat |
| 96 | W3 | 5m | long | schluss | 250-1000 | 1.611 | 0,0530 | 1,69 | 0,82 | nein | 868 | 11.396 | 0,1294 | 0,0647 | 0,0703 | 0,0323 | 2,18 | 0,0645 | 0,1572 | -0,0427 | -0,72 | -0,0306 | -0,2906 | kein Kandidat |
| 97 | W4 | 15m | long | 1h | 250-1000 | 102 | 0,1327 | 1,67 | 0,99 | nein | 128 | 147 | 0,0152 | 0,0647 | -0,0001 | 0,0672 | -0,00 | 0,1343 | 0,3273 | 0,0439 | 0,44 | -0,0348 | -0,2148 | kein Kandidat |
| 98 | W4 | 5m | short | schluss | 250-1000 | 1.054 | 0,0614 | 1,63 | 1,10 | nein | 723 | 1.920 | 0,0566 | 0,0647 | 0,0260 | 0,0280 | 0,93 | 0,0559 | 0,1362 | 0,0639 | 1,40 | -0,1034 | -0,3634 | kein Kandidat |
| 99 | W4 | 15m | short | 1h | 50-250 | 863 | 0,0469 | 1,58 | 0,73 | nein | 507 | 924 | 0,0711 | 0,0854 | 0,0128 | 0,0321 | 0,40 | 0,0643 | 0,1566 | 0,1320 | 1,64 | 0,0211 | -0,1589 | kein Kandidat |
| 100 | W7 | 1m | short | schluss | 250-1000 | 1.766 | 0,0056 | 1,55 | 0,67 | nein | 894 | 457.257 | 0,0561 | 0,0647 | -0,0076 | 0,0042 | -1,82 | 0,0084 | 0,0204 | -0,0191 | -2,42 | -0,1039 | -0,3639 | kein Kandidat |
| 101 | W4 | 5m | long | naechste | 250-1000 | 975 | 0,0935 | 1,44 | 0,95 | nein | 682 | 1.899 | 0,1851 | 0,0647 | 0,1122 | 0,0491 | 2,29 | 0,0982 | 0,2392 | -0,0034 | -0,07 | 0,0251 | -0,2349 | kein Kandidat |
| 102 | W3 | 5m | long | schluss | ab1000 | 978 | 0,0913 | 1,42 | 0,81 | nein | 666 | 2.985 | 0,1497 | 0,0449 | 0,1110 | 0,0561 | 1,98 | 0,1122 | 0,2733 | 0,0243 | 0,24 | -0,0103 | -0,2703 | kein Kandidat |
| 103 | W7 | 1m | long | schluss | 250-1000 | 1.766 | 0,0048 | 1,38 | 0,55 | nein | 894 | 436.807 | 0,0627 | 0,0647 | -0,0017 | 0,0044 | -0,39 | 0,0088 | 0,0214 | -0,0154 | -1,99 | -0,0973 | -0,3573 | kein Kandidat |
| 104 | W4 | 5m | long | 3h | 250-1000 | 490 | 0,0669 | 1,34 | 0,68 | nein | 400 | 692 | 0,1345 | 0,0647 | 0,1211 | 0,0491 | 2,47 | 0,0983 | 0,2394 | 0,0800 | 1,24 | 0,0845 | -0,0955 | kein Kandidat |
| 105 | W3 | 15m | long | 3h | 50-250 | 1.609 | 0,0377 | 1,33 | 0,49 | nein | 852 | 11.176 | 0,0922 | 0,0854 | -0,0000 | 0,0385 | -0,00 | 0,0771 | 0,1877 | -0,0176 | -0,27 | 0,0422 | -0,1378 | kein Kandidat |
| 106 | W4 | 15m | long | naechste | 50-250 | 1.118 | 0,0537 | 1,30 | 0,44 | nein | 638 | 1.615 | 0,1158 | 0,0854 | 0,0613 | 0,0604 | 1,01 | 0,1209 | 0,2944 | -0,0649 | -0,61 | -0,0442 | -0,3042 | kein Kandidat |
| 107 | W4 | 1m | short | 3h | ab1000 | 527 | 0,0703 | 1,29 | 0,65 | nein | 495 | 870 | 0,0671 | 0,0449 | 0,0819 | 0,0545 | 1,50 | 0,1089 | 0,2654 | 0,1594 | 1,90 | 0,0171 | -0,1629 | kein Kandidat |
| 108 | W4 | 15m | long | 3h | 5-50 | 683 | 0,1018 | 1,28 | 0,78 | nein | 350 | 557 | 0,0011 | 0,1569 | -0,0365 | 0,0653 | -0,56 | 0,1307 | 0,3184 | -0,0262 | -0,19 | -0,0489 | -0,2289 | kein Kandidat |
| 109 | W4 | 5m | long | naechste | 5-50 | 1.766 | 0,0271 | 1,26 | 0,42 | nein | 892 | 16.392 | 0,1795 | 0,1569 | -0,0499 | 0,0324 | -1,54 | 0,0649 | 0,1581 | -0,0415 | -1,08 | 0,0195 | -0,2405 | kein Kandidat |
| 110 | W4 | 5m | long | schluss | 250-1000 | 975 | 0,0714 | 1,15 | 1,17 | nein | 683 | 1.903 | 0,1152 | 0,0647 | 0,0897 | 0,0305 | 2,94 | 0,0611 | 0,1488 | 0,0918 | 2,04 | -0,0448 | -0,3048 | kein Kandidat |
| 111 | W4 | 1m | long | naechste | 50-250 | 1.766 | 0,0098 | 1,13 | 0,35 | nein | 893 | 37.120 | 0,1192 | 0,0854 | -0,0093 | 0,0138 | -0,67 | 0,0275 | 0,0670 | -0,0213 | -0,78 | -0,0408 | -0,3008 | kein Kandidat |
| 112 | W3 | 5m | long | 1h | ab1000 | 961 | 0,0412 | 1,11 | 0,54 | nein | 662 | 2.936 | 0,0521 | 0,0449 | 0,0094 | 0,0381 | 0,25 | 0,0762 | 0,1857 | 0,0420 | 0,62 | 0,0021 | -0,1779 | kein Kandidat |
| 113 | W3 | 5m | long | 1h | 50-250 | 1.746 | 0,0186 | 1,10 | 0,48 | nein | 890 | 26.560 | 0,0324 | 0,0854 | -0,0532 | 0,0195 | -2,73 | 0,0390 | 0,0949 | -0,0900 | -2,60 | -0,0176 | -0,1976 | kein Kandidat |
| 114 | W4 | 5m | short | 3h | 250-1000 | 578 | 0,0620 | 1,09 | 0,67 | nein | 452 | 712 | -0,0447 | 0,0647 | -0,0519 | 0,0464 | -1,12 | 0,0927 | 0,2259 | -0,0057 | -0,08 | -0,0947 | -0,2747 | kein Kandidat |
| 115 | W4 | 15m | long | naechste | 250-1000 | 173 | 0,1259 | 1,09 | 0,68 | nein | 191 | 261 | -0,0364 | 0,0647 | -0,0367 | 0,0929 | -0,39 | 0,1857 | 0,4524 | -0,1416 | -0,89 | -0,1964 | -0,4564 | kein Kandidat |
| 116 | W4 | 15m | short | schluss | ab1000 | 22 | 0,1773 | 1,07 | 0,30 | nein | 21 | 21 | -0,3507 | 0,0449 | -0,2640 | 0,2952 | -0,89 | 0,5903 | 1,4382 | 0,0844 | 0,37 | -0,5107 | -0,7707 | kein Kandidat |
| 117 | W3 | 15m | long | naechste | 5-50 | 1.730 | 0,0486 | 1,01 | 0,18 | nein | 877 | 17.694 | 0,2525 | 0,1569 | 0,0324 | 0,1349 | 0,24 | 0,2698 | 0,6573 | -0,0151 | -0,15 | 0,0925 | -0,1675 | kein Kandidat |
| 118 | W3 | 5m | long | 3h | 250-1000 | 1.590 | 0,0276 | 0,91 | 0,45 | nein | 863 | 10.636 | 0,0865 | 0,0647 | 0,0109 | 0,0308 | 0,35 | 0,0616 | 0,1500 | -0,0523 | -0,95 | 0,0365 | -0,1435 | kein Kandidat |
| 119 | W4 | 15m | long | 3h | 50-250 | 242 | 0,0594 | 0,88 | 0,32 | nein | 166 | 214 | 0,1019 | 0,0854 | 0,1548 | 0,0915 | 1,69 | 0,1831 | 0,4460 | 0,0072 | 0,04 | 0,0519 | -0,1281 | kein Kandidat |
| 120 | W7 | 5m | short | 1h | 250-1000 | 1.766 | 0,0044 | 0,85 | 0,37 | nein | 894 | 209.720 | 0,0470 | 0,0647 | -0,0148 | 0,0060 | -2,48 | 0,0120 | 0,0292 | -0,0260 | -2,66 | -0,0030 | -0,1830 | kein Kandidat |
| 121 | W3 | 5m | long | naechste | 5-50 | 1.763 | 0,0246 | 0,79 | 0,27 | nein | 892 | 36.732 | 0,1993 | 0,1569 | -0,0324 | 0,0462 | -0,70 | 0,0924 | 0,2250 | -0,0128 | -0,20 | 0,0393 | -0,2207 | kein Kandidat |
| 122 | W7 | 1m | long | naechste | 250-1000 | 1.766 | 0,0035 | 0,78 | 0,32 | nein | 893 | 436.128 | 0,1138 | 0,0647 | -0,0003 | 0,0055 | -0,06 | 0,0110 | 0,0268 | -0,0053 | -0,51 | -0,0462 | -0,3062 | kein Kandidat |
| 123 | W4 | 15m | short | naechste | 250-1000 | 216 | 0,1090 | 0,69 | 0,42 | nein | 199 | 281 | 0,1615 | 0,0647 | 0,3122 | 0,1311 | 2,38 | 0,2623 | 0,6390 | 0,5593 | 2,03 | 0,0015 | -0,2585 | kein Kandidat |
| 124 | W3 | 15m | long | naechste | 50-250 | 1.638 | 0,0304 | 0,67 | 0,25 | nein | 864 | 11.813 | 0,1644 | 0,0854 | 0,0388 | 0,0612 | 0,63 | 0,1225 | 0,2983 | 0,0362 | 0,30 | 0,0044 | -0,2556 | kein Kandidat |
| 125 | W7 | 5m | short | schluss | 5-50 | 1.766 | 0,0048 | 0,66 | 0,24 | nein | 894 | 1.183.085 | 0,1604 | 0,1569 | -0,0073 | 0,0097 | -0,75 | 0,0195 | 0,0475 | -0,0272 | -1,84 | 0,0004 | -0,2596 | kein Kandidat |
| 126 | W4 | 5m | short | naechste | 250-1000 | 1.053 | 0,0306 | 0,60 | 0,27 | nein | 722 | 1.917 | -0,0215 | 0,0647 | -0,0075 | 0,0560 | -0,13 | 0,1119 | 0,2727 | -0,0269 | -0,28 | -0,1815 | -0,4415 | kein Kandidat |
| 127 | W4 | 15m | short | 3h | 250-1000 | 27 | 0,2413 | 0,59 | 1,05 | nein | 31 | 32 | 0,2913 | 0,0647 | 0,3849 | 0,1152 | 3,34 | 0,2304 | 0,5613 | 0,6041 | 3,45 | 0,2413 | 0,0613 | kein Kandidat |
| 128 | W7 | 1m | short | naechste | 250-1000 | 1.766 | 0,0027 | 0,57 | 0,23 | nein | 893 | 456.634 | 0,0078 | 0,0647 | -0,0064 | 0,0059 | -1,09 | 0,0118 | 0,0287 | -0,0042 | -0,36 | -0,1522 | -0,4122 | kein Kandidat |
| 129 | W4 | 15m | long | naechste | ab1000 | 24 | 0,1997 | 0,56 | 0,10 | nein | 22 | 23 | 0,4481 | 0,0449 | 0,8713 | 1,0242 | 0,85 | 2,0484 | 4,9905 | -0,5532 | -0,82 | 0,2881 | 0,0281 | kein Kandidat |
| 130 | W4 | 15m | short | naechste | ab1000 | 22 | 0,1214 | 0,53 | 0,13 | nein | 21 | 21 | -0,2624 | 0,0449 | -0,4278 | 0,4631 | -0,92 | 0,9263 | 2,2567 | -0,3074 | -0,46 | -0,4224 | -0,6824 | kein Kandidat |
| 131 | W3 | 15m | long | naechste | ab1000 | 440 | 0,0541 | 0,49 | 0,24 | nein | 393 | 1.087 | 0,3071 | 0,0449 | 0,1774 | 0,1121 | 1,58 | 0,2242 | 0,5463 | 0,2442 | 1,48 | 0,1471 | -0,1129 | kein Kandidat |
| 132 | W4 | 15m | long | naechste | 5-50 | 1.644 | 0,0216 | 0,49 | 0,21 | nein | 828 | 4.074 | 0,1240 | 0,1569 | -0,0826 | 0,0520 | -1,59 | 0,1040 | 0,2533 | 0,0474 | 0,57 | -0,0360 | -0,2960 | kein Kandidat |
| 133 | W4 | 15m | short | 3h | 5-50 | 705 | 0,0306 | 0,44 | 0,21 | nein | 371 | 586 | 0,0769 | 0,1569 | 0,0072 | 0,0729 | 0,10 | 0,1458 | 0,3553 | -0,1212 | -0,83 | 0,0269 | -0,1531 | kein Kandidat |
| 134 | W4 | 5m | short | 3h | ab1000 | 36 | 0,1382 | 0,43 | 0,39 | nein | 56 | 61 | -0,1170 | 0,0449 | -0,0347 | 0,1771 | -0,20 | 0,3542 | 0,8629 | 0,3284 | 1,92 | -0,1670 | -0,3470 | kein Kandidat |
| 135 | W4 | 5m | short | schluss | 50-250 | 1.757 | 0,0046 | 0,37 | 0,12 | nein | 893 | 9.888 | 0,0743 | 0,0854 | -0,0168 | 0,0184 | -0,91 | 0,0368 | 0,0897 | -0,0189 | -0,71 | -0,0857 | -0,3457 | kein Kandidat |
| 136 | W4 | 1m | long | 15m | ab1000 | 864 | 0,0109 | 0,33 | 0,30 | nein | 645 | 1.841 | 0,0168 | 0,0449 | -0,0252 | 0,0183 | -1,38 | 0,0366 | 0,0892 | -0,0087 | -0,36 | -0,0332 | -0,2132 | kein Kandidat |
| 137 | W4 | 1m | short | 3h | 250-1000 | 1.703 | 0,0040 | 0,26 | 0,13 | nein | 890 | 7.615 | 0,0406 | 0,0647 | -0,0063 | 0,0157 | -0,40 | 0,0314 | 0,0764 | -0,0240 | -0,84 | -0,0094 | -0,1894 | kein Kandidat |
| 138 | W3 | 15m | long | 15m | ab1000 | 440 | 0,0077 | 0,22 | 0,12 | nein | 394 | 1.088 | 0,0335 | 0,0449 | -0,0061 | 0,0324 | -0,19 | 0,0649 | 0,1580 | -0,0477 | -1,30 | -0,0165 | -0,1965 | kein Kandidat |
| 139 | W3 | 1m | long | naechste | 5-50 | 1.766 | 0,0041 | 0,22 | 0,02 | nein | 893 | 53.428 | 0,3780 | 0,1569 | 0,1009 | 0,1328 | 0,76 | 0,2656 | 0,6472 | -0,0288 | -0,60 | 0,2180 | -0,0420 | kein Kandidat |
| 140 | W7 | 5m | short | naechste | 5-50 | 1.766 | 0,0020 | 0,21 | 0,06 | nein | 893 | 1.182.228 | 0,0863 | 0,1569 | 0,0038 | 0,0179 | 0,21 | 0,0357 | 0,0871 | -0,0204 | -1,15 | -0,0737 | -0,3337 | kein Kandidat |
| 141 | W3 | 5m | long | schluss | 5-50 | 1.763 | 0,0058 | 0,20 | 0,07 | nein | 893 | 36.799 | 0,0867 | 0,1569 | -0,0579 | 0,0419 | -1,38 | 0,0837 | 0,2040 | -0,0338 | -0,59 | -0,0733 | -0,3333 | kein Kandidat |
| 142 | W4 | 1m | short | naechste | ab1000 | 931 | 0,0199 | 0,18 | 0,12 | nein | 680 | 1.808 | -0,2132 | 0,0449 | -0,0910 | 0,0829 | -1,10 | 0,1657 | 0,4038 | 0,0615 | 0,77 | -0,3732 | -0,6332 | kein Kandidat |
| 143 | W4 | 1m | short | naechste | 250-1000 | 1.760 | 0,0023 | 0,15 | 0,06 | nein | 893 | 13.862 | 0,0165 | 0,0647 | 0,0006 | 0,0183 | 0,03 | 0,0365 | 0,0890 | -0,0360 | -1,05 | -0,1435 | -0,4035 | kein Kandidat |
| 144 | W4 | 1m | long | 3h | 50-250 | 1.764 | 0,0011 | 0,14 | 0,05 | nein | 892 | 20.166 | 0,0611 | 0,0854 | -0,0330 | 0,0104 | -3,18 | 0,0208 | 0,0506 | -0,0230 | -1,13 | 0,0111 | -0,1689 | kein Kandidat |
| 145 | W4 | 1m | short | 1h | ab1000 | 833 | 0,0047 | 0,13 | 0,07 | nein | 638 | 1.520 | 0,0433 | 0,0449 | 0,0156 | 0,0313 | 0,50 | 0,0626 | 0,1526 | 0,0270 | 0,55 | -0,0067 | -0,1867 | kein Kandidat |
| 146 | W7 | 1m | short | 3h | 250-1000 | 1.766 | 0,0007 | 0,13 | 0,06 | nein | 894 | 274.113 | 0,0349 | 0,0647 | -0,0140 | 0,0059 | -2,36 | 0,0118 | 0,0288 | -0,0234 | -2,00 | -0,0151 | -0,1951 | kein Kandidat |
| 147 | W4 | 15m | long | 15m | ab1000 | 24 | 0,0108 | 0,13 | 0,04 | nein | 22 | 23 | -0,1414 | 0,0449 | -0,1634 | 0,1340 | -1,22 | 0,2680 | 0,6530 | -0,2222 | -1,47 | -0,1914 | -0,3714 | kein Kandidat |
| 148 | W3 | 15m | long | schluss | 5-50 | 1.730 | 0,0038 | 0,10 | 0,03 | nein | 878 | 17.725 | 0,1200 | 0,1569 | -0,0242 | 0,0581 | -0,42 | 0,1162 | 0,2830 | 0,0855 | 0,92 | -0,0400 | -0,3000 | kein Kandidat |
| 149 | W3 | 1m | long | 1h | 250-1000 | 1.760 | 0,0007 | 0,05 | 0,02 | nein | 894 | 22.926 | 0,0533 | 0,0647 | -0,0136 | 0,0188 | -0,72 | 0,0376 | 0,0916 | -0,0174 | -0,48 | 0,0033 | -0,1767 | kein Kandidat |
| 150 | W4 | 15m | short | 3h | ab1000 | 3 | 0,0193 | 0,04 | 0,01 | nein | 7 | 7 | -0,7973 | 0,0449 | -0,7243 | 0,6762 | -1,07 | 1,3525 | 3,2950 | 0,1986 | 0,45 | -0,8473 | -1,0273 | kein Kandidat |
| 151 | W4 | 15m | short | 1h | ab1000 | 11 | 0,0118 | 0,04 | 0,02 | nein | 14 | 14 | -0,2981 | 0,0449 | -0,2688 | 0,3007 | -0,89 | 0,6014 | 1,4651 | 0,2927 | 1,10 | -0,3481 | -0,5281 | kein Kandidat |
| 152 | W2 | 15m | long | 3h | ab1000 | 243 | 0,0018 | 0,03 | 0,01 | nein | 218 | 363 | 0,0440 | 0,0449 | -0,0449 | 0,0836 | -0,54 | 0,1671 | 0,4071 | -0,1505 | -0,97 | -0,0060 | -0,1860 | kein Kandidat |
| 153 | W4 | 15m | long | 1h | ab1000 | 17 | -0,0012 | -0,01 | -0,00 | nein | 14 | 15 | 0,0810 | 0,0449 | 0,1325 | 0,2160 | 0,61 | 0,4319 | 1,0523 | 0,0099 | 0,05 | 0,0310 | -0,1490 | kein Kandidat |
| 154 | W3 | 15m | long | schluss | 250-1000 | 1.207 | -0,0031 | -0,07 | -0,03 | nein | 729 | 4.613 | 0,1058 | 0,0647 | 0,0644 | 0,0463 | 1,39 | 0,0926 | 0,2256 | 0,0503 | 0,65 | -0,0542 | -0,3142 | kein Kandidat |
| 155 | W3 | 1m | long | 1h | ab1000 | 1.534 | -0,0023 | -0,10 | -0,04 | nein | 860 | 7.227 | 0,0185 | 0,0449 | -0,0263 | 0,0276 | -0,95 | 0,0553 | 0,1347 | -0,0551 | -1,11 | -0,0315 | -0,2115 | kein Kandidat |
| 156 | W4 | 5m | short | naechste | 50-250 | 1.757 | -0,0031 | -0,17 | -0,06 | nein | 892 | 9.877 | 0,0311 | 0,0854 | -0,0110 | 0,0248 | -0,44 | 0,0497 | 0,1210 | -0,0180 | -0,42 | -0,1289 | -0,3889 | kein Kandidat |
| 157 | W3 | 5m | long | naechste | 250-1000 | 1.611 | -0,0076 | -0,18 | -0,09 | nein | 867 | 11.365 | 0,1838 | 0,0647 | 0,0747 | 0,0421 | 1,77 | 0,0842 | 0,2052 | 0,0082 | 0,10 | 0,0238 | -0,2362 | kein Kandidat |
| 158 | W4 | 15m | long | 1h | 50-250 | 827 | -0,0042 | -0,19 | -0,06 | nein | 486 | 946 | -0,0039 | 0,0854 | -0,0562 | 0,0335 | -1,67 | 0,0671 | 0,1634 | -0,1375 | -1,80 | -0,0539 | -0,2339 | kein Kandidat |
| 159 | W3 | 5m | long | 3h | 5-50 | 1.763 | -0,0052 | -0,21 | -0,07 | nein | 893 | 32.966 | 0,0782 | 0,1569 | -0,0814 | 0,0375 | -2,17 | 0,0751 | 0,1829 | -0,0787 | -1,70 | 0,0282 | -0,1518 | kein Kandidat |
| 160 | W4 | 1m | short | 15m | ab1000 | 932 | -0,0047 | -0,22 | -0,16 | nein | 681 | 1.816 | 0,0224 | 0,0449 | -0,0190 | 0,0150 | -1,27 | 0,0300 | 0,0732 | -0,0352 | -1,54 | -0,0276 | -0,2076 | kein Kandidat |
| 161 | W4 | 5m | long | 1h | 50-250 | 1.733 | -0,0030 | -0,24 | -0,13 | nein | 885 | 7.458 | 0,0209 | 0,0854 | -0,0643 | 0,0113 | -5,68 | 0,0226 | 0,0551 | -0,0948 | -4,12 | -0,0291 | -0,2091 | kein Kandidat |
| 162 | W3 | 5m | long | naechste | ab1000 | 978 | -0,0255 | -0,36 | -0,16 | nein | 665 | 2.982 | 0,2595 | 0,0449 | 0,1074 | 0,0806 | 1,33 | 0,1613 | 0,3929 | 0,0182 | 0,13 | 0,0995 | -0,1605 | kein Kandidat |
| 163 | W3 | 15m | long | 3h | 5-50 | 1.710 | -0,0115 | -0,37 | -0,10 | nein | 869 | 16.523 | 0,0892 | 0,1569 | -0,0712 | 0,0591 | -1,21 | 0,1181 | 0,2878 | -0,0293 | -0,35 | 0,0392 | -0,1408 | kein Kandidat |
| 164 | W4 | 5m | long | schluss | 5-50 | 1.766 | -0,0042 | -0,37 | -0,10 | nein | 893 | 16.405 | 0,1246 | 0,1569 | -0,0209 | 0,0211 | -0,99 | 0,0422 | 0,1028 | -0,0317 | -1,14 | -0,0354 | -0,2954 | kein Kandidat |
| 165 | W4 | 15m | long | schluss | 5-50 | 1.645 | -0,0095 | -0,38 | -0,18 | nein | 829 | 4.078 | 0,0881 | 0,1569 | -0,0340 | 0,0271 | -1,25 | 0,0542 | 0,1321 | -0,0146 | -0,24 | -0,0719 | -0,3319 | kein Kandidat |
| 166 | W4 | 1m | long | 1h | 250-1000 | 1.740 | -0,0034 | -0,39 | -0,19 | nein | 894 | 11.410 | 0,0290 | 0,0647 | -0,0379 | 0,0090 | -4,23 | 0,0179 | 0,0437 | -0,0474 | -2,71 | -0,0210 | -0,2010 | kein Kandidat |
| 167 | W4 | 5m | short | 3h | 50-250 | 1.637 | -0,0083 | -0,42 | -0,16 | nein | 848 | 3.960 | 0,0278 | 0,0854 | -0,0503 | 0,0254 | -1,98 | 0,0507 | 0,1236 | -0,0280 | -0,66 | -0,0222 | -0,2022 | kein Kandidat |
| 168 | W7 | 15m | short | schluss | 5-50 | 1.766 | -0,0033 | -0,43 | -0,14 | nein | 894 | 712.019 | 0,1542 | 0,1569 | -0,0115 | 0,0118 | -0,97 | 0,0236 | 0,0575 | -0,0304 | -1,42 | -0,0058 | -0,2658 | kein Kandidat |
| 169 | W7 | 5m | long | 3h | 5-50 | 1.766 | -0,0033 | -0,43 | -0,17 | nein | 894 | 778.082 | 0,1303 | 0,1569 | -0,0297 | 0,0096 | -3,10 | 0,0192 | 0,0468 | -0,0562 | -3,51 | 0,0803 | -0,0997 | kein Kandidat |
| 170 | W2 | 15m | short | 3h | ab1000 | 262 | -0,0277 | -0,47 | -0,19 | nein | 218 | 327 | 0,0312 | 0,0449 | -0,0333 | 0,0720 | -0,46 | 0,1441 | 0,3510 | -0,0159 | -0,12 | -0,0188 | -0,1988 | kein Kandidat |
| 171 | W4 | 5m | long | 3h | 5-50 | 1.743 | -0,0104 | -0,51 | -0,18 | nein | 878 | 6.915 | 0,0994 | 0,1569 | -0,0563 | 0,0289 | -1,95 | 0,0579 | 0,1410 | -0,0164 | -0,33 | 0,0494 | -0,1306 | kein Kandidat |
| 172 | W3 | 15m | long | naechste | 250-1000 | 1.207 | -0,0274 | -0,53 | -0,25 | nein | 728 | 4.602 | 0,1625 | 0,0647 | 0,0724 | 0,0553 | 1,31 | 0,1107 | 0,2697 | 0,0207 | 0,22 | 0,0025 | -0,2575 | kein Kandidat |
| 173 | W4 | 5m | long | 1h | 250-1000 | 840 | -0,0302 | -0,54 | -0,59 | nein | 608 | 1.429 | 0,0756 | 0,0647 | 0,0261 | 0,0256 | 1,02 | 0,0512 | 0,1248 | 0,0510 | 1,34 | 0,0256 | -0,1544 | kein Kandidat |
| 174 | W3 | 5m | long | 1h | 250-1000 | 1.605 | -0,0140 | -0,62 | -0,30 | nein | 867 | 11.141 | 0,0522 | 0,0647 | -0,0125 | 0,0232 | -0,54 | 0,0464 | 0,1130 | -0,0689 | -1,66 | 0,0022 | -0,1778 | kein Kandidat |
| 175 | W3 | 15m | long | 1h | 50-250 | 1.635 | -0,0147 | -0,66 | -0,25 | nein | 863 | 11.621 | 0,1168 | 0,0854 | 0,0298 | 0,0288 | 1,03 | 0,0577 | 0,1405 | 0,0166 | 0,34 | 0,0668 | -0,1132 | kein Kandidat |
| 176 | W4 | 5m | short | schluss | ab1000 | 139 | -0,4204 | -0,78 | -1,53 | nein | 136 | 177 | 0,0611 | 0,0449 | 0,1951 | 0,1373 | 1,42 | 0,2745 | 0,6688 | 0,2196 | 2,00 | -0,0989 | -0,3589 | kein Kandidat |
| 177 | W4 | 5m | short | 1h | ab1000 | 105 | -0,0778 | -0,79 | -0,41 | nein | 117 | 143 | 0,0511 | 0,0449 | 0,0656 | 0,0955 | 0,69 | 0,1910 | 0,4652 | 0,0705 | 0,80 | 0,0011 | -0,1789 | kein Kandidat |
| 178 | W3 | 1m | long | schluss | 5-50 | 1.766 | -0,0130 | -0,80 | -0,29 | nein | 894 | 53.506 | 0,0988 | 0,1569 | -0,0494 | 0,0227 | -2,18 | 0,0454 | 0,1107 | -0,0257 | -0,70 | -0,0612 | -0,3212 | kein Kandidat |
| 179 | W4 | 15m | short | 15m | ab1000 | 22 | -0,0867 | -0,80 | -0,26 | nein | 21 | 21 | -0,2710 | 0,0449 | -0,2999 | 0,1691 | -1,77 | 0,3381 | 0,8238 | -0,0802 | -0,52 | -0,3210 | -0,5010 | kein Kandidat |
| 180 | W4 | 5m | short | 15m | ab1000 | 139 | -0,0634 | -0,81 | -0,70 | nein | 136 | 177 | 0,0397 | 0,0449 | 0,0101 | 0,0453 | 0,22 | 0,0906 | 0,2206 | 0,0271 | 0,55 | -0,0103 | -0,1903 | kein Kandidat |
| 181 | W4 | 5m | short | 1h | 250-1000 | 899 | -0,0253 | -0,82 | -0,57 | nein | 649 | 1.467 | -0,0100 | 0,0647 | -0,0584 | 0,0221 | -2,65 | 0,0441 | 0,1075 | -0,0868 | -2,17 | -0,0600 | -0,2400 | kein Kandidat |
| 182 | W4 | 15m | short | 1h | 250-1000 | 132 | -0,0801 | -0,86 | -0,75 | nein | 120 | 151 | 0,0589 | 0,0647 | 0,0559 | 0,0534 | 1,05 | 0,1069 | 0,2604 | 0,1319 | 1,77 | 0,0089 | -0,1711 | kein Kandidat |
| 183 | W4 | 5m | short | naechste | ab1000 | 139 | -1,4025 | -0,87 | -3,58 | nein | 136 | 177 | -0,1642 | 0,0449 | 0,1299 | 0,1957 | 0,66 | 0,3914 | 0,9536 | 0,2396 | 1,29 | -0,3242 | -0,5842 | kein Kandidat |
| 184 | W3 | 15m | long | 1h | 250-1000 | 1.198 | -0,0240 | -0,92 | -0,44 | nein | 726 | 4.555 | 0,0593 | 0,0647 | -0,0016 | 0,0276 | -0,06 | 0,0551 | 0,1344 | 0,0257 | 0,55 | 0,0093 | -0,1707 | kein Kandidat |
| 185 | W2 | 5m | long | naechste | ab1000 | 1.277 | -0,0312 | -0,97 | -0,39 | nein | 792 | 3.231 | 0,0813 | 0,0449 | -0,0640 | 0,0396 | -1,62 | 0,0791 | 0,1927 | -0,0386 | -0,55 | -0,0787 | -0,3387 | kein Kandidat |
| 186 | W2 | 15m | short | 3h | 250-1000 | 969 | -0,0317 | -0,97 | -0,45 | nein | 608 | 1.867 | 0,0648 | 0,0647 | -0,0125 | 0,0356 | -0,35 | 0,0711 | 0,1733 | -0,0650 | -0,84 | 0,0148 | -0,1652 | kein Kandidat |
| 187 | W3 | 5m | long | 15m | ab1000 | 978 | -0,0200 | -0,99 | -0,43 | nein | 666 | 2.985 | 0,0184 | 0,0449 | -0,0247 | 0,0229 | -1,07 | 0,0459 | 0,1118 | 0,0026 | 0,06 | -0,0316 | -0,2116 | kein Kandidat |
| 188 | W7 | 1m | long | 3h | 250-1000 | 1.766 | -0,0049 | -1,04 | -0,41 | nein | 894 | 262.487 | 0,0706 | 0,0647 | -0,0086 | 0,0060 | -1,44 | 0,0119 | 0,0291 | -0,0198 | -1,64 | 0,0206 | -0,1594 | kein Kandidat |
| 189 | W1b | 1m | long | naechste | ab1000 | 1.765 | -0,0136 | -1,07 | -0,50 | nein | 893 | 26.918 | 0,1254 | 0,0449 | -0,0269 | 0,0135 | -1,99 | 0,0271 | 0,0660 | -0,0130 | -0,49 | -0,0346 | -0,2946 | kein Kandidat |
| 190 | W2 | 5m | long | 1h | ab1000 | 1.216 | -0,0191 | -1,09 | -0,52 | nein | 758 | 2.910 | 0,0451 | 0,0449 | -0,0036 | 0,0184 | -0,20 | 0,0367 | 0,0894 | 0,0375 | 1,02 | -0,0049 | -0,1849 | kein Kandidat |
| 191 | W4 | 1m | short | naechste | 50-250 | 1.766 | -0,0134 | -1,18 | -0,42 | nein | 893 | 38.263 | -0,0019 | 0,0854 | -0,0427 | 0,0158 | -2,71 | 0,0315 | 0,0768 | -0,0459 | -1,96 | -0,1619 | -0,4219 | kein Kandidat |
| 192 | W3 | 5m | long | 15m | 250-1000 | 1.611 | -0,0165 | -1,20 | -0,68 | nein | 868 | 11.396 | 0,0245 | 0,0647 | -0,0399 | 0,0122 | -3,26 | 0,0245 | 0,0596 | -0,0610 | -2,52 | -0,0255 | -0,2055 | kein Kandidat |
| 193 | W7 | 15m | long | 1h | 50-250 | 1.766 | -0,0071 | -1,23 | -0,55 | nein | 894 | 347.858 | 0,0633 | 0,0854 | -0,0233 | 0,0065 | -3,60 | 0,0129 | 0,0315 | -0,0325 | -3,19 | 0,0133 | -0,1667 | kein Kandidat |
| 194 | W1a | 15m | short | 3h | ab1000 | 503 | -0,0556 | -1,24 | -0,54 | nein | 395 | 826 | -0,0063 | 0,0449 | -0,0471 | 0,0516 | -0,91 | 0,1031 | 0,2512 | -0,0006 | -0,01 | -0,0563 | -0,2363 | kein Kandidat |
| 195 | W1a | 15m | short | naechste | ab1000 | 899 | -0,0647 | -1,29 | -0,47 | nein | 621 | 1.775 | 0,0280 | 0,0449 | 0,0437 | 0,0693 | 0,63 | 0,1385 | 0,3375 | 0,0870 | 0,63 | -0,1320 | -0,3920 | kein Kandidat |
| 196 | W7 | 15m | long | 15m | ab1000 | 1.551 | -0,0095 | -1,31 | -0,55 | nein | 870 | 21.533 | 0,0359 | 0,0449 | -0,0088 | 0,0086 | -1,02 | 0,0173 | 0,0421 | -0,0046 | -0,29 | -0,0141 | -0,1941 | kein Kandidat |
| 197 | W2 | 1m | short | naechste | ab1000 | 1.756 | -0,0208 | -1,35 | -0,57 | nein | 892 | 13.238 | -0,0813 | 0,0449 | -0,0213 | 0,0183 | -1,16 | 0,0367 | 0,0894 | 0,0094 | 0,33 | -0,2413 | -0,5013 | kein Kandidat |
| 198 | W4 | 5m | long | 1h | ab1000 | 112 | -0,1000 | -1,35 | -0,57 | nein | 109 | 136 | -0,1561 | 0,0449 | -0,1350 | 0,0871 | -1,55 | 0,1742 | 0,4244 | -0,1032 | -1,20 | -0,2061 | -0,3861 | kein Kandidat |
| 199 | W2 | 1m | short | 3h | ab1000 | 1.671 | -0,0184 | -1,38 | -0,58 | nein | 875 | 6.699 | -0,0123 | 0,0449 | -0,0325 | 0,0160 | -2,04 | 0,0320 | 0,0778 | 0,0087 | 0,31 | -0,0623 | -0,2423 | kein Kandidat |
| 200 | W4 | 5m | long | 15m | ab1000 | 149 | -0,0864 | -1,40 | -1,06 | nein | 134 | 176 | -0,0636 | 0,0449 | -0,0911 | 0,0409 | -2,23 | 0,0818 | 0,1993 | -0,0917 | -2,00 | -0,1136 | -0,2936 | kein Kandidat |
| 201 | W7 | 5m | short | 3h | 5-50 | 1.766 | -0,0121 | -1,45 | -0,64 | nein | 894 | 801.407 | 0,1044 | 0,1569 | -0,0488 | 0,0094 | -5,20 | 0,0188 | 0,0458 | -0,0615 | -3,69 | 0,0544 | -0,1256 | kein Kandidat |
| 202 | W1b | 1m | long | 3h | ab1000 | 1.748 | -0,0144 | -1,47 | -0,56 | nein | 893 | 16.080 | 0,0484 | 0,0449 | -0,0223 | 0,0129 | -1,72 | 0,0258 | 0,0629 | -0,0119 | -0,54 | -0,0016 | -0,1816 | kein Kandidat |
| 203 | W4 | 15m | short | schluss | 5-50 | 1.657 | -0,0315 | -1,49 | -0,58 | nein | 844 | 4.428 | 0,0796 | 0,1569 | -0,0672 | 0,0271 | -2,48 | 0,0543 | 0,1322 | -0,1312 | -2,71 | -0,0804 | -0,3404 | kein Kandidat |
| 204 | W1b | 15m | short | naechste | ab1000 | 858 | -0,0769 | -1,53 | -0,53 | nein | 596 | 1.653 | 0,0354 | 0,0449 | 0,0497 | 0,0719 | 0,69 | 0,1438 | 0,3503 | 0,0606 | 0,44 | -0,1246 | -0,3846 | kein Kandidat |
| 205 | W4 | 15m | long | 15m | 250-1000 | 173 | -0,0517 | -1,57 | -0,83 | nein | 192 | 262 | -0,0376 | 0,0647 | -0,0930 | 0,0310 | -3,00 | 0,0620 | 0,1511 | -0,1119 | -2,65 | -0,0876 | -0,2676 | kein Kandidat |
| 206 | W2 | 5m | short | naechste | ab1000 | 1.333 | -0,0493 | -1,58 | -0,50 | nein | 795 | 3.019 | -0,0457 | 0,0449 | 0,0109 | 0,0495 | 0,22 | 0,0990 | 0,2411 | 0,0715 | 0,89 | -0,2057 | -0,4657 | kein Kandidat |
| 207 | W7 | 15m | long | 3h | 5-50 | 1.766 | -0,0147 | -1,60 | -0,72 | nein | 894 | 440.317 | 0,1158 | 0,1569 | -0,0436 | 0,0103 | -4,23 | 0,0206 | 0,0502 | -0,0582 | -3,24 | 0,0658 | -0,1142 | kein Kandidat |
| 208 | W7 | 15m | short | naechste | 5-50 | 1.766 | -0,0193 | -1,63 | -0,46 | nein | 893 | 711.547 | 0,0932 | 0,1569 | 0,0084 | 0,0210 | 0,40 | 0,0420 | 0,1022 | 0,0041 | 0,20 | -0,0668 | -0,3268 | kein Kandidat |
| 209 | W1a | 1m | long | naechste | ab1000 | 1.765 | -0,0188 | -1,66 | -0,72 | nein | 893 | 28.423 | 0,1239 | 0,0449 | -0,0281 | 0,0132 | -2,13 | 0,0263 | 0,0641 | -0,0068 | -0,27 | -0,0361 | -0,2961 | kein Kandidat |
| 210 | W3 | 1m | long | 15m | ab1000 | 1.575 | -0,0222 | -1,67 | -0,67 | nein | 865 | 7.856 | 0,0260 | 0,0449 | -0,0187 | 0,0165 | -1,14 | 0,0329 | 0,0803 | -0,0446 | -1,60 | -0,0240 | -0,2040 | kein Kandidat |
| 211 | W4 | 15m | short | naechste | 5-50 | 1.657 | -0,0572 | -1,68 | -0,55 | nein | 843 | 4.425 | 0,0270 | 0,1569 | -0,0422 | 0,0516 | -0,82 | 0,1031 | 0,2512 | -0,1810 | -1,45 | -0,1330 | -0,3930 | kein Kandidat |
| 212 | W4 | 15m | short | 15m | 250-1000 | 216 | -0,1084 | -1,70 | -2,20 | nein | 199 | 281 | 0,0236 | 0,0647 | -0,0304 | 0,0246 | -1,24 | 0,0492 | 0,1199 | 0,0091 | 0,21 | -0,0264 | -0,2064 | kein Kandidat |
| 213 | W4 | 15m | long | 1h | 5-50 | 1.492 | -0,0416 | -1,75 | -0,91 | nein | 751 | 2.376 | 0,0503 | 0,1569 | -0,0914 | 0,0229 | -4,00 | 0,0458 | 0,1115 | -0,1025 | -2,20 | 0,0003 | -0,1797 | kein Kandidat |
| 214 | W1b | 15m | short | 3h | ab1000 | 468 | -0,0798 | -1,79 | -0,77 | nein | 377 | 760 | -0,0029 | 0,0449 | -0,0524 | 0,0519 | -1,01 | 0,1038 | 0,2528 | -0,0355 | -0,42 | -0,0529 | -0,2329 | kein Kandidat |
| 215 | W1b | 1m | long | schluss | ab1000 | 1.765 | -0,0138 | -1,90 | -0,77 | nein | 894 | 26.962 | 0,0238 | 0,0449 | -0,0277 | 0,0090 | -3,10 | 0,0179 | 0,0436 | -0,0358 | -2,27 | -0,1362 | -0,3962 | kein Kandidat |
| 216 | W1a | 1m | short | naechste | ab1000 | 1.766 | -0,0177 | -1,90 | -0,71 | nein | 893 | 29.175 | -0,0785 | 0,0449 | -0,0170 | 0,0125 | -1,37 | 0,0249 | 0,0608 | 0,0036 | 0,17 | -0,2385 | -0,4985 | kein Kandidat |
| 217 | W7 | 1m | short | 1h | ab1000 | 1.766 | -0,0079 | -1,91 | -0,80 | nein | 894 | 84.446 | 0,0107 | 0,0449 | -0,0298 | 0,0050 | -6,00 | 0,0100 | 0,0243 | -0,0370 | -3,66 | -0,0393 | -0,2193 | kein Kandidat |
| 218 | W3 | 1m | long | 3h | 5-50 | 1.766 | -0,0450 | -1,99 | -0,70 | nein | 894 | 32.092 | 0,0613 | 0,1569 | -0,1027 | 0,0322 | -3,19 | 0,0644 | 0,1568 | -0,0941 | -1,86 | 0,0113 | -0,1687 | kein Kandidat |
| 219 | W7 | 1m | long | 1h | ab1000 | 1.766 | -0,0085 | -2,06 | -0,73 | nein | 894 | 78.818 | 0,0252 | 0,0449 | -0,0240 | 0,0058 | -4,10 | 0,0117 | 0,0285 | -0,0387 | -3,36 | -0,0248 | -0,2048 | kein Kandidat |
| 220 | W1b | 15m | long | naechste | ab1000 | 810 | -0,0992 | -2,08 | -0,89 | nein | 604 | 1.712 | 0,0633 | 0,0449 | -0,1086 | 0,0560 | -1,94 | 0,1120 | 0,2727 | -0,1547 | -1,42 | -0,0967 | -0,3567 | kein Kandidat |
| 221 | W5 | 15m | short | naechste | ab1000 | 1.744 | -0,0331 | -2,11 | -0,81 | nein | 893 | 20.002 | -0,1289 | 0,0449 | -0,0660 | 0,0203 | -3,24 | 0,0407 | 0,0991 | -0,0228 | -0,63 | -0,2889 | -0,5489 | kein Kandidat |
| 222 | W3 | 1m | long | 1h | 50-250 | 1.766 | -0,0237 | -2,12 | -0,82 | nein | 894 | 49.070 | 0,0384 | 0,0854 | -0,0482 | 0,0145 | -3,33 | 0,0290 | 0,0706 | -0,0284 | -1,14 | -0,0116 | -0,1916 | kein Kandidat |
| 223 | W1a | 1m | long | 3h | ab1000 | 1.752 | -0,0195 | -2,12 | -0,78 | nein | 893 | 16.909 | 0,0434 | 0,0449 | -0,0272 | 0,0124 | -2,19 | 0,0248 | 0,0605 | -0,0144 | -0,69 | -0,0066 | -0,1866 | kein Kandidat |
| 224 | W2 | 5m | long | 3h | ab1000 | 904 | -0,0638 | -2,12 | -0,84 | nein | 630 | 1.696 | 0,0044 | 0,0449 | -0,0787 | 0,0381 | -2,07 | 0,0762 | 0,1856 | -0,0638 | -0,98 | -0,0456 | -0,2256 | kein Kandidat |
| 225 | W2 | 15m | short | naechste | ab1000 | 520 | -0,1606 | -2,15 | -1,03 | nein | 389 | 693 | 0,0182 | 0,0449 | 0,0161 | 0,0781 | 0,21 | 0,1561 | 0,3803 | 0,0554 | 0,38 | -0,1418 | -0,4018 | kein Kandidat |
| 226 | W3 | 15m | long | 1h | 5-50 | 1.727 | -0,0488 | -2,18 | -0,69 | nein | 876 | 17.258 | 0,0782 | 0,1569 | -0,0766 | 0,0353 | -2,17 | 0,0705 | 0,1718 | -0,0656 | -0,88 | 0,0282 | -0,1518 | kein Kandidat |
| 227 | W1a | 15m | long | naechste | ab1000 | 856 | -0,1067 | -2,22 | -0,90 | nein | 625 | 1.815 | 0,0754 | 0,0449 | -0,0916 | 0,0593 | -1,54 | 0,1187 | 0,2891 | -0,1388 | -1,17 | -0,0846 | -0,3446 | kein Kandidat |
| 228 | W3 | 15m | long | 15m | 250-1000 | 1.207 | -0,0420 | -2,23 | -1,25 | nein | 729 | 4.613 | 0,0107 | 0,0647 | -0,0524 | 0,0169 | -3,11 | 0,0337 | 0,0821 | -0,0768 | -2,99 | -0,0393 | -0,2193 | kein Kandidat |
| 229 | W1b | 1m | short | naechste | ab1000 | 1.765 | -0,0219 | -2,26 | -0,82 | nein | 893 | 27.624 | -0,0810 | 0,0449 | -0,0197 | 0,0134 | -1,47 | 0,0269 | 0,0655 | 0,0054 | 0,26 | -0,2410 | -0,5010 | kein Kandidat |
| 230 | W2 | 15m | long | schluss | ab1000 | 485 | -0,0993 | -2,28 | -0,99 | nein | 391 | 783 | 0,0344 | 0,0449 | -0,0838 | 0,0501 | -1,67 | 0,1001 | 0,2440 | -0,1660 | -2,01 | -0,1256 | -0,3856 | kein Kandidat |
| 231 | W1b | 5m | long | 1h | ab1000 | 1.523 | -0,0287 | -2,30 | -1,01 | nein | 866 | 5.778 | 0,0184 | 0,0449 | -0,0310 | 0,0142 | -2,19 | 0,0284 | 0,0691 | -0,0240 | -0,83 | -0,0316 | -0,2116 | kein Kandidat |
| 232 | W1b | 5m | short | naechste | ab1000 | 1.604 | -0,0491 | -2,30 | -0,94 | nein | 869 | 6.366 | -0,0843 | 0,0449 | -0,0218 | 0,0260 | -0,84 | 0,0521 | 0,1269 | 0,0363 | 0,78 | -0,2443 | -0,5043 | kein Kandidat |
| 233 | W1b | 15m | short | 3h | 250-1000 | 1.304 | -0,0472 | -2,32 | -0,92 | nein | 762 | 4.106 | 0,0061 | 0,0647 | -0,0578 | 0,0256 | -2,26 | 0,0511 | 0,1245 | -0,1232 | -2,22 | -0,0439 | -0,2239 | kein Kandidat |
| 234 | W2 | 5m | long | schluss | ab1000 | 1.277 | -0,0507 | -2,39 | -0,70 | nein | 793 | 3.239 | 0,0294 | 0,0449 | -0,0284 | 0,0360 | -0,79 | 0,0720 | 0,1753 | -0,0036 | -0,08 | -0,1306 | -0,3906 | kein Kandidat |
| 235 | W1a | 5m | long | 1h | ab1000 | 1.558 | -0,0305 | -2,46 | -1,11 | nein | 869 | 6.129 | 0,0156 | 0,0449 | -0,0342 | 0,0138 | -2,48 | 0,0276 | 0,0672 | -0,0214 | -0,72 | -0,0344 | -0,2144 | kein Kandidat |
| 236 | W2 | 1m | long | naechste | ab1000 | 1.755 | -0,0365 | -2,48 | -0,95 | nein | 893 | 12.927 | 0,1042 | 0,0449 | -0,0464 | 0,0191 | -2,42 | 0,0383 | 0,0932 | -0,0031 | -0,10 | -0,0558 | -0,3158 | kein Kandidat |
| 237 | W2 | 15m | long | 3h | 50-250 | 1.559 | -0,1235 | -2,50 | -2,15 | nein | 829 | 6.662 | -0,0238 | 0,0854 | -0,1056 | 0,0288 | -3,67 | 0,0576 | 0,1403 | -0,1314 | -2,48 | -0,0738 | -0,2538 | kein Kandidat |
| 238 | W2 | 5m | short | 3h | ab1000 | 940 | -0,0826 | -2,53 | -1,09 | nein | 633 | 1.556 | 0,0168 | 0,0449 | -0,0464 | 0,0379 | -1,23 | 0,0758 | 0,1846 | -0,0907 | -1,29 | -0,0332 | -0,2132 | kein Kandidat |
| 239 | W2 | 1m | long | 3h | ab1000 | 1.644 | -0,0335 | -2,56 | -0,88 | nein | 875 | 6.665 | 0,0491 | 0,0449 | -0,0214 | 0,0191 | -1,12 | 0,0381 | 0,0929 | -0,0106 | -0,35 | -0,0009 | -0,1809 | kein Kandidat |
| 240 | W1b | 15m | short | naechste | 250-1000 | 1.665 | -0,0573 | -2,62 | -1,07 | nein | 870 | 9.230 | -0,0328 | 0,0647 | -0,0643 | 0,0268 | -2,40 | 0,0537 | 0,1308 | -0,0825 | -1,56 | -0,1928 | -0,4528 | kein Kandidat |
| 241 | W2 | 1m | short | schluss | ab1000 | 1.756 | -0,0224 | -2,65 | -1,04 | nein | 893 | 13.259 | 0,0264 | 0,0449 | -0,0122 | 0,0108 | -1,13 | 0,0215 | 0,0524 | 0,0044 | 0,24 | -0,1336 | -0,3936 | kein Kandidat |
| 242 | W2 | 15m | long | naechste | ab1000 | 485 | -0,1674 | -2,65 | -1,04 | nein | 390 | 781 | 0,1442 | 0,0449 | -0,0858 | 0,0802 | -1,07 | 0,1603 | 0,3906 | -0,2164 | -1,69 | -0,0158 | -0,2758 | kein Kandidat |
| 243 | W3 | 15m | long | 3h | 250-1000 | 1.167 | -0,0979 | -2,70 | -1,18 | nein | 715 | 4.408 | 0,0827 | 0,0647 | 0,0239 | 0,0416 | 0,58 | 0,0831 | 0,2025 | 0,0516 | 0,74 | 0,0327 | -0,1473 | kein Kandidat |
| 244 | W4 | 5m | long | 15m | 250-1000 | 975 | -0,0388 | -2,74 | -1,60 | nein | 683 | 1.903 | 0,0380 | 0,0647 | -0,0236 | 0,0121 | -1,95 | 0,0242 | 0,0590 | -0,0479 | -2,45 | -0,0120 | -0,1920 | kein Kandidat |
| 245 | W4 | 5m | short | 3h | 5-50 | 1.746 | -0,0596 | -2,75 | -1,21 | nein | 883 | 7.192 | 0,0591 | 0,1569 | -0,0935 | 0,0246 | -3,81 | 0,0491 | 0,1197 | -0,0708 | -1,71 | 0,0091 | -0,1709 | kein Kandidat |
| 246 | W1b | 5m | long | naechste | ab1000 | 1.563 | -0,0743 | -2,76 | -1,17 | nein | 871 | 6.462 | 0,0635 | 0,0449 | -0,0909 | 0,0318 | -2,86 | 0,0636 | 0,1549 | -0,0555 | -0,95 | -0,0965 | -0,3565 | kein Kandidat |
| 247 | W2 | 15m | short | naechste | 250-1000 | 1.473 | -0,0845 | -2,77 | -1,09 | nein | 805 | 4.341 | -0,0366 | 0,0647 | -0,0648 | 0,0389 | -1,67 | 0,0778 | 0,1894 | -0,1026 | -1,45 | -0,1966 | -0,4566 | kein Kandidat |
| 248 | W4 | 1m | short | 1h | 250-1000 | 1.757 | -0,0242 | -2,79 | -1,28 | nein | 894 | 11.757 | 0,0285 | 0,0647 | -0,0330 | 0,0094 | -3,50 | 0,0189 | 0,0460 | -0,0479 | -3,20 | -0,0215 | -0,2015 | kein Kandidat |
| 249 | W2 | 5m | short | schluss | ab1000 | 1.333 | -0,0656 | -2,79 | -1,23 | nein | 796 | 3.023 | 0,0526 | 0,0449 | -0,0079 | 0,0266 | -0,30 | 0,0531 | 0,1294 | 0,0329 | 0,68 | -0,1074 | -0,3674 | kein Kandidat |
| 250 | W7 | 5m | short | 15m | ab1000 | 1.748 | -0,0132 | -2,79 | -0,97 | nein | 894 | 43.818 | 0,0251 | 0,0449 | -0,0192 | 0,0068 | -2,83 | 0,0136 | 0,0330 | -0,0365 | -4,43 | -0,0249 | -0,2049 | kein Kandidat |
| 251 | W4 | 1m | short | schluss | 50-250 | 1.766 | -0,0185 | -2,82 | -0,93 | nein | 894 | 38.301 | 0,0603 | 0,0854 | -0,0303 | 0,0099 | -3,05 | 0,0198 | 0,0483 | -0,0397 | -2,41 | -0,0997 | -0,3597 | kein Kandidat |
| 252 | W3 | 5m | long | 1h | 5-50 | 1.763 | -0,0500 | -2,83 | -1,15 | nein | 893 | 35.475 | 0,0403 | 0,1569 | -0,1154 | 0,0218 | -5,29 | 0,0436 | 0,1063 | -0,1040 | -3,17 | -0,0097 | -0,1897 | kein Kandidat |
| 253 | W4 | 1m | long | naechste | 5-50 | 1.766 | -0,0333 | -2,84 | -0,50 | nein | 893 | 26.484 | 0,1223 | 0,1569 | -0,1505 | 0,0335 | -4,50 | 0,0669 | 0,1630 | -0,1584 | -3,53 | -0,0377 | -0,2977 | kein Kandidat |
| 254 | W1a | 5m | long | naechste | ab1000 | 1.596 | -0,0735 | -2,85 | -1,22 | nein | 874 | 6.851 | 0,0718 | 0,0449 | -0,0838 | 0,0301 | -2,78 | 0,0602 | 0,1468 | -0,0466 | -0,81 | -0,0882 | -0,3482 | kein Kandidat |
| 255 | W1a | 5m | short | naechste | ab1000 | 1.625 | -0,0588 | -2,85 | -1,15 | nein | 873 | 6.732 | -0,0930 | 0,0449 | -0,0295 | 0,0256 | -1,15 | 0,0512 | 0,1247 | 0,0437 | 0,95 | -0,2530 | -0,5130 | kein Kandidat |
| 256 | W2 | 15m | short | 1h | 250-1000 | 1.414 | -0,0667 | -2,85 | -2,30 | nein | 785 | 4.008 | -0,0111 | 0,0647 | -0,0813 | 0,0145 | -5,60 | 0,0290 | 0,0707 | -0,0583 | -2,05 | -0,0611 | -0,2411 | kein Kandidat |
| 257 | W2 | 15m | short | schluss | ab1000 | 521 | -0,1481 | -2,90 | -1,58 | nein | 390 | 694 | 0,0759 | 0,0449 | -0,0127 | 0,0467 | -0,27 | 0,0934 | 0,2276 | -0,0167 | -0,20 | -0,0841 | -0,3441 | kein Kandidat |
| 258 | W7 | 5m | long | 1h | 50-250 | 1.766 | -0,0139 | -2,93 | -1,18 | nein | 894 | 626.517 | 0,0609 | 0,0854 | -0,0255 | 0,0059 | -4,33 | 0,0118 | 0,0286 | -0,0335 | -3,34 | 0,0109 | -0,1691 | kein Kandidat |
| 259 | W6 | 15m | long | naechste | ab1000 | 1.622 | -0,1344 | -2,94 | -2,52 | nein | 880 | 12.126 | 0,0310 | 0,0449 | -0,1193 | 0,0266 | -4,48 | 0,0532 | 0,1297 | -0,1082 | -2,13 | -0,1290 | -0,3890 | kein Kandidat |
| 260 | W7 | 15m | short | 3h | 5-50 | 1.766 | -0,0253 | -2,94 | -1,12 | nein | 894 | 458.299 | 0,1001 | 0,1569 | -0,0534 | 0,0113 | -4,72 | 0,0226 | 0,0551 | -0,0760 | -3,66 | 0,0501 | -0,1299 | kein Kandidat |
| 261 | W1a | 15m | short | 3h | 250-1000 | 1.347 | -0,0606 | -2,97 | -1,23 | nein | 783 | 4.414 | 0,0058 | 0,0647 | -0,0593 | 0,0247 | -2,40 | 0,0494 | 0,1202 | -0,1243 | -2,29 | -0,0442 | -0,2242 | kein Kandidat |
| 262 | W2 | 15m | long | 1h | ab1000 | 438 | -0,0754 | -2,98 | -1,10 | nein | 366 | 717 | 0,0422 | 0,0449 | -0,0448 | 0,0342 | -1,31 | 0,0684 | 0,1667 | -0,0762 | -1,30 | -0,0078 | -0,1878 | kein Kandidat |
| 263 | W2 | 15m | long | 15m | ab1000 | 485 | -0,0514 | -2,99 | -1,34 | nein | 391 | 783 | -0,0310 | 0,0449 | -0,0846 | 0,0192 | -4,41 | 0,0384 | 0,0934 | -0,0947 | -3,42 | -0,0810 | -0,2610 | kein Kandidat |
| 264 | W1a | 15m | short | schluss | ab1000 | 900 | -0,0857 | -3,02 | -1,08 | nein | 622 | 1.777 | 0,0643 | 0,0449 | -0,0015 | 0,0398 | -0,04 | 0,0795 | 0,1938 | 0,0423 | 0,51 | -0,0957 | -0,3557 | kein Kandidat |
| 265 | W4 | 1m | short | 3h | 50-250 | 1.765 | -0,0245 | -3,03 | -1,08 | nein | 893 | 21.430 | 0,0415 | 0,0854 | -0,0344 | 0,0114 | -3,02 | 0,0228 | 0,0555 | -0,0323 | -1,46 | -0,0085 | -0,1885 | kein Kandidat |
| 266 | W3 | 15m | long | 15m | 50-250 | 1.638 | -0,0421 | -3,09 | -1,03 | nein | 865 | 11.836 | 0,0614 | 0,0854 | -0,0240 | 0,0205 | -1,17 | 0,0411 | 0,1000 | -0,0188 | -0,47 | 0,0114 | -0,1686 | kein Kandidat |
| 267 | W1a | 1m | long | schluss | ab1000 | 1.765 | -0,0212 | -3,13 | -1,22 | nein | 894 | 28.470 | 0,0215 | 0,0449 | -0,0300 | 0,0087 | -3,45 | 0,0174 | 0,0423 | -0,0389 | -2,64 | -0,1385 | -0,3985 | kein Kandidat |
| 268 | W1b | 15m | short | schluss | ab1000 | 859 | -0,0911 | -3,20 | -1,12 | nein | 597 | 1.655 | 0,0591 | 0,0449 | -0,0028 | 0,0405 | -0,07 | 0,0811 | 0,1975 | 0,0216 | 0,26 | -0,1009 | -0,3609 | kein Kandidat |
| 269 | W7 | 15m | short | 1h | 50-250 | 1.766 | -0,0148 | -3,25 | -1,59 | nein | 894 | 386.794 | 0,0517 | 0,0854 | -0,0318 | 0,0046 | -6,85 | 0,0093 | 0,0226 | -0,0370 | -4,21 | 0,0017 | -0,1783 | kein Kandidat |
| 270 | W1b | 5m | short | schluss | ab1000 | 1.604 | -0,0502 | -3,36 | -1,30 | nein | 870 | 6.372 | -0,0035 | 0,0449 | -0,0444 | 0,0193 | -2,29 | 0,0387 | 0,0942 | -0,0034 | -0,10 | -0,1635 | -0,4235 | kein Kandidat |
| 271 | W4 | 5m | short | schluss | 5-50 | 1.766 | -0,0436 | -3,37 | -1,19 | nein | 894 | 16.995 | 0,0754 | 0,1569 | -0,0905 | 0,0183 | -4,94 | 0,0366 | 0,0892 | -0,1084 | -3,92 | -0,0846 | -0,3446 | kein Kandidat |
| 272 | W1b | 1m | short | 3h | ab1000 | 1.749 | -0,0315 | -3,40 | -1,21 | nein | 892 | 16.312 | 0,0031 | 0,0449 | -0,0154 | 0,0130 | -1,18 | 0,0261 | 0,0636 | 0,0297 | 1,22 | -0,0469 | -0,2269 | kein Kandidat |
| 273 | W1a | 15m | short | naechste | 250-1000 | 1.685 | -0,0727 | -3,41 | -1,36 | nein | 874 | 9.955 | -0,0271 | 0,0647 | -0,0576 | 0,0268 | -2,15 | 0,0536 | 0,1306 | -0,0774 | -1,51 | -0,1871 | -0,4471 | kein Kandidat |
| 274 | W4 | 5m | short | 15m | 250-1000 | 1.054 | -0,0525 | -3,46 | -2,45 | nein | 723 | 1.920 | 0,0135 | 0,0647 | -0,0481 | 0,0107 | -4,49 | 0,0214 | 0,0522 | -0,0745 | -4,33 | -0,0365 | -0,2165 | kein Kandidat |
| 275 | W6 | 15m | short | naechste | ab1000 | 1.627 | -0,1975 | -3,48 | -3,86 | nein | 885 | 11.925 | -0,1639 | 0,0449 | -0,0933 | 0,0256 | -3,65 | 0,0511 | 0,1245 | -0,0889 | -2,10 | -0,3239 | -0,5839 | kein Kandidat |
| 276 | W1a | 1m | short | 3h | ab1000 | 1.753 | -0,0304 | -3,51 | -1,22 | nein | 892 | 17.167 | 0,0006 | 0,0449 | -0,0180 | 0,0125 | -1,44 | 0,0250 | 0,0609 | 0,0241 | 1,00 | -0,0494 | -0,2294 | kein Kandidat |
| 277 | W2 | 15m | short | 1h | ab1000 | 479 | -0,1430 | -3,52 | -1,76 | nein | 364 | 635 | 0,0477 | 0,0449 | -0,0276 | 0,0407 | -0,68 | 0,0813 | 0,1981 | -0,0916 | -1,49 | -0,0023 | -0,1823 | kein Kandidat |
| 278 | W7 | 5m | long | 15m | ab1000 | 1.744 | -0,0189 | -3,56 | -1,63 | nein | 894 | 38.735 | 0,0202 | 0,0449 | -0,0252 | 0,0058 | -4,35 | 0,0116 | 0,0282 | -0,0256 | -2,29 | -0,0298 | -0,2098 | kein Kandidat |
| 279 | W1b | 5m | long | schluss | ab1000 | 1.563 | -0,0592 | -3,63 | -1,41 | nein | 872 | 6.475 | 0,0058 | 0,0449 | -0,0508 | 0,0210 | -2,42 | 0,0420 | 0,1022 | -0,0349 | -0,98 | -0,1542 | -0,4142 | kein Kandidat |
| 280 | W1b | 5m | long | 3h | ab1000 | 1.225 | -0,0886 | -3,64 | -1,34 | nein | 786 | 3.330 | -0,0021 | 0,0449 | -0,0788 | 0,0330 | -2,39 | 0,0660 | 0,1608 | -0,0960 | -1,91 | -0,0521 | -0,2321 | kein Kandidat |
| 281 | W1a | 5m | long | 3h | ab1000 | 1.278 | -0,0862 | -3,66 | -1,35 | nein | 802 | 3.565 | -0,0122 | 0,0449 | -0,0890 | 0,0319 | -2,79 | 0,0638 | 0,1554 | -0,0924 | -1,74 | -0,0622 | -0,2422 | kein Kandidat |
| 282 | W1b | 15m | long | 3h | ab1000 | 436 | -0,1817 | -3,67 | -1,59 | nein | 376 | 800 | 0,0347 | 0,0449 | -0,0365 | 0,0571 | -0,64 | 0,1143 | 0,2784 | -0,0192 | -0,21 | -0,0153 | -0,1953 | kein Kandidat |
| 283 | W1b | 1m | short | schluss | ab1000 | 1.765 | -0,0240 | -3,69 | -1,33 | nein | 894 | 27.664 | 0,0281 | 0,0449 | -0,0104 | 0,0090 | -1,16 | 0,0180 | 0,0438 | -0,0046 | -0,29 | -0,1319 | -0,3919 | kein Kandidat |
| 284 | W1a | 5m | long | schluss | ab1000 | 1.596 | -0,0587 | -3,74 | -1,51 | nein | 875 | 6.865 | 0,0032 | 0,0449 | -0,0528 | 0,0195 | -2,71 | 0,0390 | 0,0949 | -0,0326 | -1,02 | -0,1568 | -0,4168 | kein Kandidat |
| 285 | W2 | 1m | long | schluss | ab1000 | 1.755 | -0,0330 | -3,78 | -1,40 | nein | 894 | 12.954 | 0,0111 | 0,0449 | -0,0403 | 0,0118 | -3,42 | 0,0236 | 0,0574 | -0,0353 | -1,92 | -0,1489 | -0,4089 | kein Kandidat |
| 286 | W1b | 5m | short | 3h | ab1000 | 1.297 | -0,0869 | -3,80 | -1,49 | nein | 780 | 3.348 | -0,0620 | 0,0449 | -0,0979 | 0,0292 | -3,35 | 0,0584 | 0,1422 | -0,1329 | -2,57 | -0,1120 | -0,2920 | kein Kandidat |
| 287 | W3 | 1m | long | 15m | 250-1000 | 1.763 | -0,0320 | -3,82 | -1,54 | nein | 894 | 25.547 | 0,0359 | 0,0647 | -0,0292 | 0,0104 | -2,81 | 0,0208 | 0,0507 | -0,0186 | -1,08 | -0,0141 | -0,1941 | kein Kandidat |
| 288 | W1b | 15m | short | 15m | ab1000 | 859 | -0,0416 | -3,93 | -1,23 | nein | 597 | 1.655 | 0,0113 | 0,0449 | -0,0372 | 0,0169 | -2,20 | 0,0338 | 0,0825 | -0,0685 | -2,80 | -0,0387 | -0,2187 | kein Kandidat |
| 289 | W1a | 5m | short | schluss | ab1000 | 1.625 | -0,0575 | -3,97 | -1,56 | nein | 874 | 6.739 | 0,0006 | 0,0449 | -0,0407 | 0,0184 | -2,21 | 0,0367 | 0,0895 | 0,0045 | 0,13 | -0,1594 | -0,4194 | kein Kandidat |
| 290 | W1b | 15m | short | 1h | ab1000 | 799 | -0,0870 | -3,98 | -1,40 | nein | 565 | 1.503 | 0,0368 | 0,0449 | -0,0204 | 0,0312 | -0,65 | 0,0623 | 0,1518 | -0,0885 | -1,71 | -0,0132 | -0,1932 | kein Kandidat |
| 291 | W1a | 1m | short | schluss | ab1000 | 1.766 | -0,0246 | -4,00 | -1,45 | nein | 894 | 29.218 | 0,0238 | 0,0449 | -0,0147 | 0,0085 | -1,73 | 0,0170 | 0,0414 | -0,0108 | -0,72 | -0,1362 | -0,3962 | kein Kandidat |
| 292 | W2 | 5m | short | naechste | 250-1000 | 1.764 | -0,0598 | -4,02 | -1,79 | nein | 893 | 17.101 | 0,0093 | 0,0647 | -0,0086 | 0,0167 | -0,52 | 0,0334 | 0,0815 | -0,0294 | -0,96 | -0,1507 | -0,4107 | kein Kandidat |
| 293 | W1a | 15m | long | 3h | ab1000 | 460 | -0,1943 | -4,02 | -1,74 | nein | 398 | 848 | 0,0025 | 0,0449 | -0,0672 | 0,0558 | -1,20 | 0,1115 | 0,2717 | -0,0994 | -1,07 | -0,0475 | -0,2275 | kein Kandidat |
| 294 | W4 | 1m | long | schluss | 5-50 | 1.766 | -0,0380 | -4,13 | -1,36 | nein | 894 | 26.504 | 0,0489 | 0,1569 | -0,1001 | 0,0140 | -7,18 | 0,0279 | 0,0680 | -0,1226 | -4,29 | -0,1111 | -0,3711 | kein Kandidat |
| 295 | W3 | 5m | long | 15m | 50-250 | 1.747 | -0,0387 | -4,19 | -1,75 | nein | 890 | 27.365 | 0,0164 | 0,0854 | -0,0689 | 0,0111 | -6,22 | 0,0221 | 0,0539 | -0,0727 | -3,57 | -0,0336 | -0,2136 | kein Kandidat |
| 296 | W2 | 15m | short | 15m | ab1000 | 521 | -0,0622 | -4,21 | -1,29 | nein | 390 | 694 | 0,0227 | 0,0449 | -0,0298 | 0,0240 | -1,24 | 0,0480 | 0,1170 | -0,0769 | -2,47 | -0,0273 | -0,2073 | kein Kandidat |
| 297 | W2 | 1m | short | 1h | ab1000 | 1.752 | -0,0291 | -4,23 | -1,92 | nein | 892 | 11.903 | 0,0012 | 0,0449 | -0,0391 | 0,0076 | -5,15 | 0,0152 | 0,0370 | -0,0121 | -0,92 | -0,0488 | -0,2288 | kein Kandidat |
| 298 | W2 | 5m | long | naechste | 250-1000 | 1.766 | -0,0626 | -4,25 | -1,83 | nein | 893 | 17.547 | 0,0511 | 0,0647 | -0,0632 | 0,0171 | -3,70 | 0,0342 | 0,0833 | -0,0804 | -2,59 | -0,1089 | -0,3689 | kein Kandidat |
| 299 | W4 | 5m | short | naechste | 5-50 | 1.766 | -0,0678 | -4,25 | -1,01 | nein | 893 | 16.975 | -0,0097 | 0,1569 | -0,0912 | 0,0336 | -2,72 | 0,0672 | 0,1636 | -0,0923 | -2,08 | -0,1697 | -0,4297 | kein Kandidat |
| 300 | W7 | 1m | short | 3h | 50-250 | 1.766 | -0,0200 | -4,26 | -1,81 | nein | 894 | 747.504 | 0,0399 | 0,0854 | -0,0355 | 0,0055 | -6,42 | 0,0110 | 0,0269 | -0,0456 | -4,51 | -0,0101 | -0,1901 | kein Kandidat |
| 301 | W4 | 1m | long | 3h | 5-50 | 1.762 | -0,0503 | -4,27 | -1,32 | nein | 892 | 15.172 | 0,0617 | 0,1569 | -0,1024 | 0,0190 | -5,38 | 0,0380 | 0,0927 | -0,1274 | -3,67 | 0,0117 | -0,1683 | kein Kandidat |
| 302 | W7 | 5m | short | 1h | 50-250 | 1.766 | -0,0185 | -4,28 | -1,61 | nein | 894 | 673.586 | 0,0512 | 0,0854 | -0,0327 | 0,0057 | -5,69 | 0,0115 | 0,0280 | -0,0389 | -4,40 | 0,0012 | -0,1788 | kein Kandidat |
| 303 | W1a | 15m | short | 1h | ab1000 | 839 | -0,0895 | -4,30 | -1,49 | nein | 589 | 1.624 | 0,0391 | 0,0449 | -0,0188 | 0,0299 | -0,63 | 0,0599 | 0,1459 | -0,0735 | -1,42 | -0,0109 | -0,1909 | kein Kandidat |
| 304 | W5 | 15m | short | 3h | ab1000 | 1.580 | -0,0633 | -4,35 | -1,79 | nein | 872 | 9.027 | -0,0298 | 0,0449 | -0,0501 | 0,0177 | -2,83 | 0,0354 | 0,0862 | -0,0023 | -0,08 | -0,0798 | -0,2598 | kein Kandidat |
| 305 | W7 | 1m | long | naechste | 50-250 | 1.766 | -0,0181 | -4,42 | -1,68 | nein | 893 | 1.204.010 | 0,1077 | 0,0854 | -0,0206 | 0,0054 | -3,83 | 0,0108 | 0,0262 | -0,0315 | -3,55 | -0,0523 | -0,3123 | kein Kandidat |
| 306 | W6 | 5m | short | naechste | ab1000 | 1.766 | -0,0405 | -4,46 | -1,78 | nein | 893 | 36.719 | -0,1120 | 0,0449 | -0,0504 | 0,0114 | -4,42 | 0,0228 | 0,0556 | -0,0428 | -2,18 | -0,2720 | -0,5320 | kein Kandidat |
| 307 | W6 | 15m | long | 3h | ab1000 | 1.379 | -0,0834 | -4,47 | -1,94 | nein | 828 | 5.875 | 0,0091 | 0,0449 | -0,0604 | 0,0215 | -2,81 | 0,0430 | 0,1047 | -0,0683 | -1,73 | -0,0409 | -0,2209 | kein Kandidat |
| 308 | W1a | 5m | short | 3h | ab1000 | 1.343 | -0,0990 | -4,48 | -1,71 | nein | 792 | 3.559 | -0,0642 | 0,0449 | -0,0993 | 0,0289 | -3,44 | 0,0577 | 0,1406 | -0,1306 | -2,59 | -0,1142 | -0,2942 | kein Kandidat |
| 309 | W1b | 15m | long | 1h | ab1000 | 754 | -0,1003 | -4,52 | -1,97 | nein | 567 | 1.562 | 0,0021 | 0,0449 | -0,0608 | 0,0255 | -2,38 | 0,0510 | 0,1243 | -0,0999 | -2,30 | -0,0479 | -0,2279 | kein Kandidat |
| 310 | W5 | 15m | long | naechste | ab1000 | 1.740 | -0,0672 | -4,56 | -1,73 | nein | 893 | 21.479 | 0,0739 | 0,0449 | -0,0798 | 0,0194 | -4,11 | 0,0389 | 0,0947 | -0,1332 | -3,90 | -0,0861 | -0,3461 | kein Kandidat |
| 311 | W7 | 1m | short | naechste | 50-250 | 1.766 | -0,0191 | -4,58 | -1,70 | nein | 893 | 1.242.565 | 0,0159 | 0,0854 | -0,0261 | 0,0056 | -4,66 | 0,0112 | 0,0273 | -0,0366 | -3,74 | -0,1441 | -0,4041 | kein Kandidat |
| 312 | W1a | 15m | short | 15m | ab1000 | 900 | -0,0462 | -4,59 | -1,45 | nein | 622 | 1.777 | 0,0105 | 0,0449 | -0,0382 | 0,0160 | -2,39 | 0,0319 | 0,0778 | -0,0668 | -2,83 | -0,0395 | -0,2195 | kein Kandidat |
| 313 | W2 | 5m | long | 3h | 250-1000 | 1.717 | -0,0873 | -4,61 | -2,45 | nein | 889 | 9.095 | -0,0107 | 0,0647 | -0,0890 | 0,0178 | -5,00 | 0,0356 | 0,0868 | -0,0739 | -2,65 | -0,0607 | -0,2407 | kein Kandidat |
| 314 | W2 | 5m | short | 1h | ab1000 | 1.265 | -0,0699 | -4,63 | -1,95 | nein | 775 | 2.687 | 0,0077 | 0,0449 | -0,0379 | 0,0179 | -2,11 | 0,0358 | 0,0873 | -0,0303 | -0,92 | -0,0423 | -0,2223 | kein Kandidat |
| 315 | W4 | 5m | short | 1h | 50-250 | 1.745 | -0,0466 | -4,67 | -1,86 | nein | 891 | 7.571 | 0,0052 | 0,0854 | -0,0787 | 0,0125 | -6,30 | 0,0250 | 0,0609 | -0,0841 | -2,96 | -0,0448 | -0,2248 | kein Kandidat |
| 316 | W6 | 5m | long | 3h | ab1000 | 1.744 | -0,0485 | -4,71 | -1,42 | nein | 892 | 17.119 | 0,0574 | 0,0449 | -0,0134 | 0,0171 | -0,79 | 0,0342 | 0,0833 | 0,0205 | 0,46 | 0,0074 | -0,1726 | kein Kandidat |
| 317 | W4 | 15m | short | 1h | 5-50 | 1.489 | -0,0976 | -4,82 | -1,99 | nein | 758 | 2.517 | 0,0109 | 0,1569 | -0,1304 | 0,0245 | -5,33 | 0,0489 | 0,1192 | -0,2067 | -4,74 | -0,0391 | -0,2191 | kein Kandidat |
| 318 | W5 | 15m | long | 3h | ab1000 | 1.589 | -0,0800 | -4,82 | -2,17 | nein | 873 | 10.092 | 0,0067 | 0,0449 | -0,0618 | 0,0184 | -3,35 | 0,0369 | 0,0898 | -0,0708 | -2,05 | -0,0433 | -0,2233 | kein Kandidat |
| 319 | W2 | 15m | short | schluss | 250-1000 | 1.473 | -0,0986 | -5,01 | -2,14 | nein | 806 | 4.345 | 0,0024 | 0,0647 | -0,0793 | 0,0231 | -3,43 | 0,0462 | 0,1124 | -0,1120 | -2,58 | -0,1576 | -0,4176 | kein Kandidat |
| 320 | W1a | 15m | long | 1h | ab1000 | 800 | -0,1069 | -5,05 | -2,22 | nein | 590 | 1.661 | -0,0050 | 0,0449 | -0,0675 | 0,0241 | -2,80 | 0,0481 | 0,1172 | -0,1259 | -2,98 | -0,0550 | -0,2350 | kein Kandidat |
| 321 | W6 | 5m | short | 3h | ab1000 | 1.746 | -0,0557 | -5,08 | -1,99 | nein | 894 | 16.973 | -0,0332 | 0,0449 | -0,0524 | 0,0140 | -3,75 | 0,0280 | 0,0681 | -0,0462 | -1,69 | -0,0832 | -0,2632 | kein Kandidat |
| 322 | W1a | 15m | long | 15m | ab1000 | 856 | -0,0563 | -5,10 | -1,93 | nein | 626 | 1.820 | -0,0382 | 0,0449 | -0,0861 | 0,0146 | -5,91 | 0,0292 | 0,0711 | -0,0724 | -3,33 | -0,0882 | -0,2682 | kein Kandidat |
| 323 | W2 | 5m | long | 15m | ab1000 | 1.277 | -0,0447 | -5,14 | -2,12 | nein | 793 | 3.239 | 0,0023 | 0,0449 | -0,0426 | 0,0105 | -4,04 | 0,0211 | 0,0514 | -0,0555 | -2,59 | -0,0477 | -0,2277 | kein Kandidat |
| 324 | W1b | 15m | long | 3h | 250-1000 | 1.322 | -0,1116 | -5,15 | -2,04 | nein | 745 | 4.117 | -0,0173 | 0,0647 | -0,1028 | 0,0274 | -3,75 | 0,0548 | 0,1335 | -0,0958 | -1,96 | -0,0673 | -0,2473 | kein Kandidat |
| 325 | W2 | 15m | long | 3h | 250-1000 | 979 | -0,1363 | -5,15 | -1,57 | nein | 609 | 1.942 | 0,0327 | 0,0647 | -0,0396 | 0,0434 | -0,91 | 0,0869 | 0,2116 | -0,0342 | -0,51 | -0,0173 | -0,1973 | kein Kandidat |
| 326 | W4 | 15m | short | 15m | 50-250 | 1.149 | -0,0606 | -5,21 | -2,23 | nein | 655 | 1.690 | 0,0015 | 0,0854 | -0,0790 | 0,0136 | -5,81 | 0,0272 | 0,0663 | -0,0500 | -2,14 | -0,0485 | -0,2285 | kein Kandidat |
| 327 | W5 | 15m | short | 1h | ab1000 | 1.723 | -0,0432 | -5,26 | -2,28 | nein | 894 | 16.542 | 0,0183 | 0,0449 | -0,0217 | 0,0095 | -2,28 | 0,0190 | 0,0462 | 0,0171 | 1,16 | -0,0317 | -0,2117 | kein Kandidat |
| 328 | W1b | 5m | long | 15m | ab1000 | 1.563 | -0,0350 | -5,29 | -2,40 | nein | 872 | 6.475 | -0,0070 | 0,0449 | -0,0524 | 0,0073 | -7,19 | 0,0146 | 0,0355 | -0,0665 | -5,10 | -0,0570 | -0,2370 | kein Kandidat |
| 329 | W1b | 15m | long | 15m | ab1000 | 810 | -0,0607 | -5,31 | -1,99 | nein | 605 | 1.717 | -0,0363 | 0,0449 | -0,0840 | 0,0153 | -5,51 | 0,0305 | 0,0743 | -0,0630 | -2,76 | -0,0863 | -0,2663 | kein Kandidat |
| 330 | W1b | 5m | short | 1h | ab1000 | 1.563 | -0,0647 | -5,34 | -2,23 | nein | 861 | 5.682 | 0,0075 | 0,0449 | -0,0343 | 0,0145 | -2,36 | 0,0290 | 0,0707 | -0,0386 | -1,57 | -0,0425 | -0,2225 | kein Kandidat |
| 331 | W7 | 1m | long | 3h | 50-250 | 1.766 | -0,0238 | -5,37 | -2,14 | nein | 894 | 722.873 | 0,0666 | 0,0854 | -0,0280 | 0,0056 | -5,03 | 0,0112 | 0,0272 | -0,0346 | -3,39 | 0,0166 | -0,1634 | kein Kandidat |
| 332 | W1b | 15m | long | schluss | ab1000 | 810 | -0,1675 | -5,38 | -2,19 | nein | 605 | 1.717 | -0,0300 | 0,0449 | -0,1002 | 0,0382 | -2,62 | 0,0764 | 0,1861 | -0,1022 | -1,63 | -0,1900 | -0,4500 | kein Kandidat |
| 333 | W2 | 1m | long | 1h | ab1000 | 1.750 | -0,0380 | -5,39 | -2,18 | nein | 894 | 11.745 | 0,0102 | 0,0449 | -0,0390 | 0,0087 | -4,47 | 0,0174 | 0,0425 | -0,0389 | -2,64 | -0,0398 | -0,2198 | kein Kandidat |
| 334 | W7 | 1m | long | schluss | 50-250 | 1.766 | -0,0181 | -5,42 | -1,99 | nein | 894 | 1.205.742 | 0,0571 | 0,0854 | -0,0218 | 0,0046 | -4,78 | 0,0091 | 0,0222 | -0,0347 | -4,79 | -0,1029 | -0,3629 | kein Kandidat |
| 335 | W6 | 5m | long | naechste | ab1000 | 1.766 | -0,0468 | -5,47 | -1,67 | nein | 893 | 36.654 | 0,1236 | 0,0449 | -0,0264 | 0,0140 | -1,88 | 0,0280 | 0,0683 | -0,0433 | -1,84 | -0,0364 | -0,2964 | kein Kandidat |
| 336 | W1a | 5m | long | 15m | ab1000 | 1.596 | -0,0341 | -5,47 | -2,41 | nein | 875 | 6.865 | -0,0104 | 0,0449 | -0,0559 | 0,0071 | -7,90 | 0,0142 | 0,0345 | -0,0758 | -5,86 | -0,0604 | -0,2404 | kein Kandidat |
| 337 | W1a | 15m | long | schluss | ab1000 | 856 | -0,1670 | -5,48 | -2,24 | nein | 626 | 1.820 | -0,0363 | 0,0449 | -0,1047 | 0,0373 | -2,81 | 0,0746 | 0,1816 | -0,1210 | -2,02 | -0,1963 | -0,4563 | kein Kandidat |
| 338 | W6 | 5m | long | schluss | ab1000 | 1.766 | -0,0328 | -5,53 | -1,79 | nein | 894 | 36.709 | 0,0350 | 0,0449 | -0,0159 | 0,0091 | -1,74 | 0,0183 | 0,0445 | -0,0213 | -1,40 | -0,1250 | -0,3850 | kein Kandidat |
| 339 | W1a | 15m | long | 3h | 250-1000 | 1.366 | -0,1172 | -5,56 | -2,23 | nein | 769 | 4.477 | -0,0141 | 0,0647 | -0,0968 | 0,0263 | -3,68 | 0,0526 | 0,1282 | -0,0979 | -2,07 | -0,0641 | -0,2441 | kein Kandidat |
| 340 | W1a | 5m | short | 1h | ab1000 | 1.588 | -0,0664 | -5,67 | -2,35 | nein | 867 | 6.009 | 0,0088 | 0,0449 | -0,0331 | 0,0141 | -2,34 | 0,0283 | 0,0689 | -0,0334 | -1,40 | -0,0412 | -0,2212 | kein Kandidat |
| 341 | W1b | 15m | long | naechste | 250-1000 | 1.657 | -0,1265 | -5,72 | -2,20 | nein | 873 | 9.048 | -0,0221 | 0,0647 | -0,1429 | 0,0288 | -4,97 | 0,0576 | 0,1402 | -0,1840 | -3,37 | -0,1821 | -0,4421 | kein Kandidat |
| 342 | W2 | 5m | short | 3h | 250-1000 | 1.715 | -0,0829 | -5,73 | -2,22 | nein | 885 | 8.896 | -0,0463 | 0,0647 | -0,1063 | 0,0186 | -5,71 | 0,0373 | 0,0908 | -0,1081 | -3,84 | -0,0963 | -0,2763 | kein Kandidat |
| 343 | W6 | 15m | short | 1h | ab1000 | 1.581 | -0,0782 | -5,74 | -3,72 | nein | 883 | 10.277 | -0,0275 | 0,0449 | -0,0656 | 0,0105 | -6,25 | 0,0210 | 0,0511 | -0,0321 | -1,93 | -0,0775 | -0,2575 | kein Kandidat |
| 344 | W6 | 15m | short | 3h | ab1000 | 1.364 | -0,1539 | -5,79 | -3,07 | nein | 834 | 5.716 | -0,0904 | 0,0449 | -0,1113 | 0,0250 | -4,45 | 0,0501 | 0,1220 | -0,0742 | -2,18 | -0,1404 | -0,3204 | kein Kandidat |
| 345 | W6 | 15m | long | schluss | ab1000 | 1.622 | -0,1084 | -5,81 | -3,43 | nein | 881 | 12.145 | -0,0269 | 0,0449 | -0,0824 | 0,0158 | -5,21 | 0,0316 | 0,0771 | -0,0849 | -2,64 | -0,1869 | -0,4469 | kein Kandidat |
| 346 | W6 | 1m | short | 3h | ab1000 | 1.766 | -0,0275 | -5,87 | -2,28 | nein | 894 | 53.753 | -0,0072 | 0,0449 | -0,0259 | 0,0060 | -4,30 | 0,0121 | 0,0294 | -0,0135 | -1,18 | -0,0572 | -0,2372 | kein Kandidat |
| 347 | W6 | 1m | short | schluss | ab1000 | 1.766 | -0,0206 | -5,95 | -2,27 | nein | 894 | 92.014 | 0,0113 | 0,0449 | -0,0272 | 0,0045 | -6,02 | 0,0091 | 0,0221 | -0,0223 | -2,86 | -0,1487 | -0,4087 | kein Kandidat |
| 348 | W2 | 15m | long | naechste | 50-250 | 1.746 | -0,1500 | -5,98 | -2,83 | nein | 889 | 15.661 | -0,0580 | 0,0854 | -0,1842 | 0,0265 | -6,95 | 0,0530 | 0,1291 | -0,2243 | -4,97 | -0,2180 | -0,4780 | kein Kandidat |
| 349 | W1a | 15m | long | naechste | 250-1000 | 1.679 | -0,1262 | -6,00 | -2,22 | nein | 876 | 9.804 | -0,0238 | 0,0647 | -0,1435 | 0,0284 | -5,06 | 0,0567 | 0,1382 | -0,2052 | -3,79 | -0,1838 | -0,4438 | kein Kandidat |
| 350 | W2 | 5m | short | 15m | ab1000 | 1.333 | -0,0508 | -6,02 | -2,80 | nein | 796 | 3.023 | 0,0001 | 0,0449 | -0,0452 | 0,0091 | -4,98 | 0,0182 | 0,0443 | -0,0609 | -3,87 | -0,0499 | -0,2299 | kein Kandidat |
| 351 | W7 | 1m | short | schluss | 50-250 | 1.766 | -0,0194 | -6,02 | -2,38 | nein | 894 | 1.243.979 | 0,0631 | 0,0854 | -0,0281 | 0,0041 | -6,91 | 0,0081 | 0,0198 | -0,0416 | -6,20 | -0,0969 | -0,3569 | kein Kandidat |
| 352 | W1b | 15m | short | schluss | 250-1000 | 1.665 | -0,0776 | -6,11 | -2,36 | nein | 871 | 9.238 | -0,0125 | 0,0647 | -0,0917 | 0,0164 | -5,59 | 0,0328 | 0,0800 | -0,0994 | -2,96 | -0,1725 | -0,4325 | kein Kandidat |
| 353 | W6 | 1m | short | naechste | ab1000 | 1.766 | -0,0295 | -6,13 | -2,35 | nein | 893 | 91.845 | -0,0821 | 0,0449 | -0,0191 | 0,0063 | -3,05 | 0,0125 | 0,0306 | -0,0003 | -0,02 | -0,2421 | -0,5021 | kein Kandidat |
| 354 | W2 | 15m | long | naechste | 250-1000 | 1.458 | -0,1866 | -6,31 | -2,53 | nein | 805 | 4.293 | 0,0073 | 0,0647 | -0,1233 | 0,0369 | -3,34 | 0,0739 | 0,1799 | -0,1506 | -2,10 | -0,1527 | -0,4127 | kein Kandidat |
| 355 | W1b | 1m | long | 1h | ab1000 | 1.764 | -0,0346 | -6,34 | -2,53 | nein | 894 | 24.790 | 0,0162 | 0,0449 | -0,0331 | 0,0069 | -4,83 | 0,0137 | 0,0334 | -0,0422 | -3,18 | -0,0338 | -0,2138 | kein Kandidat |
| 356 | W3 | 15m | long | 15m | 5-50 | 1.730 | -0,0886 | -6,36 | -1,35 | nein | 878 | 17.725 | 0,0831 | 0,1569 | -0,0730 | 0,0327 | -2,23 | 0,0654 | 0,1594 | -0,0302 | -0,29 | 0,0331 | -0,1469 | kein Kandidat |
| 357 | W6 | 15m | short | schluss | ab1000 | 1.627 | -0,1476 | -6,44 | -4,57 | nein | 886 | 11.933 | -0,0702 | 0,0449 | -0,1052 | 0,0161 | -6,52 | 0,0323 | 0,0787 | -0,0717 | -2,89 | -0,2302 | -0,4902 | kein Kandidat |
| 358 | W1b | 1m | short | 1h | ab1000 | 1.764 | -0,0327 | -6,45 | -2,52 | nein | 894 | 25.336 | 0,0119 | 0,0449 | -0,0286 | 0,0065 | -4,42 | 0,0130 | 0,0316 | -0,0213 | -1,86 | -0,0381 | -0,2181 | kein Kandidat |
| 359 | W1b | 15m | short | naechste | 50-250 | 1.761 | -0,1024 | -6,49 | -3,11 | nein | 891 | 31.630 | -0,0579 | 0,0854 | -0,1105 | 0,0165 | -6,72 | 0,0329 | 0,0802 | -0,1130 | -3,24 | -0,2179 | -0,4779 | kein Kandidat |
| 360 | W6 | 15m | long | 1h | ab1000 | 1.593 | -0,0595 | -6,62 | -2,79 | nein | 878 | 10.577 | -0,0005 | 0,0449 | -0,0498 | 0,0107 | -4,66 | 0,0213 | 0,0520 | -0,0722 | -3,45 | -0,0505 | -0,2305 | kein Kandidat |
| 361 | W2 | 15m | short | 3h | 50-250 | 1.530 | -0,1149 | -6,66 | -2,08 | nein | 811 | 6.592 | 0,0124 | 0,0854 | -0,0806 | 0,0277 | -2,91 | 0,0554 | 0,1349 | -0,1366 | -3,34 | -0,0376 | -0,2176 | kein Kandidat |
| 362 | W1b | 5m | long | naechste | 250-1000 | 1.766 | -0,0687 | -6,71 | -2,59 | nein | 893 | 34.115 | 0,0457 | 0,0647 | -0,0670 | 0,0132 | -5,06 | 0,0265 | 0,0645 | -0,0807 | -3,14 | -0,1143 | -0,3743 | kein Kandidat |
| 363 | W1b | 15m | long | schluss | 250-1000 | 1.657 | -0,1242 | -6,71 | -3,63 | nein | 874 | 9.060 | -0,0519 | 0,0647 | -0,1248 | 0,0171 | -7,29 | 0,0343 | 0,0835 | -0,1335 | -3,81 | -0,2119 | -0,4719 | kein Kandidat |
| 364 | W6 | 1m | long | naechste | ab1000 | 1.766 | -0,0310 | -6,93 | -2,54 | nein | 893 | 91.903 | 0,1339 | 0,0449 | -0,0171 | 0,0061 | -2,80 | 0,0122 | 0,0297 | -0,0033 | -0,32 | -0,0261 | -0,2861 | kein Kandidat |
| 365 | W2 | 5m | long | 1h | 250-1000 | 1.764 | -0,0590 | -6,94 | -3,56 | nein | 894 | 15.612 | 0,0165 | 0,0647 | -0,0498 | 0,0083 | -6,00 | 0,0166 | 0,0404 | -0,0220 | -1,36 | -0,0335 | -0,2135 | kein Kandidat |
| 366 | W1a | 15m | short | schluss | 250-1000 | 1.685 | -0,0865 | -6,95 | -2,70 | nein | 875 | 9.965 | -0,0039 | 0,0647 | -0,0817 | 0,0160 | -5,09 | 0,0321 | 0,0782 | -0,0907 | -2,88 | -0,1639 | -0,4239 | kein Kandidat |
| 367 | W1b | 15m | short | 3h | 50-250 | 1.673 | -0,1119 | -6,96 | -3,01 | nein | 868 | 13.884 | 0,0140 | 0,0854 | -0,0702 | 0,0186 | -3,77 | 0,0372 | 0,0906 | -0,0882 | -2,59 | -0,0360 | -0,2160 | kein Kandidat |
| 368 | W4 | 1m | long | 15m | 250-1000 | 1.754 | -0,0333 | -6,99 | -3,49 | nein | 894 | 13.735 | 0,0145 | 0,0647 | -0,0507 | 0,0048 | -10,62 | 0,0095 | 0,0232 | -0,0466 | -5,22 | -0,0355 | -0,2155 | kein Kandidat |
| 369 | W1b | 15m | short | 1h | 250-1000 | 1.634 | -0,0726 | -7,03 | -3,39 | nein | 862 | 8.467 | -0,0242 | 0,0647 | -0,0917 | 0,0107 | -8,56 | 0,0214 | 0,0522 | -0,0877 | -4,64 | -0,0742 | -0,2542 | kein Kandidat |
| 370 | W1a | 1m | long | 1h | ab1000 | 1.765 | -0,0369 | -7,07 | -2,77 | nein | 894 | 26.165 | 0,0142 | 0,0449 | -0,0351 | 0,0067 | -5,28 | 0,0133 | 0,0324 | -0,0444 | -3,47 | -0,0358 | -0,2158 | kein Kandidat |
| 371 | W1a | 15m | long | schluss | 250-1000 | 1.679 | -0,1238 | -7,07 | -3,62 | nein | 877 | 9.816 | -0,0465 | 0,0647 | -0,1186 | 0,0171 | -6,94 | 0,0342 | 0,0833 | -0,1332 | -4,03 | -0,2065 | -0,4665 | kein Kandidat |
| 372 | W5 | 15m | long | 1h | ab1000 | 1.714 | -0,0613 | -7,07 | -2,71 | nein | 893 | 18.092 | 0,0146 | 0,0449 | -0,0354 | 0,0113 | -3,13 | 0,0226 | 0,0551 | -0,0385 | -2,52 | -0,0354 | -0,2154 | kein Kandidat |
| 373 | W1a | 1m | short | 1h | ab1000 | 1.766 | -0,0346 | -7,08 | -2,77 | nein | 894 | 26.717 | 0,0089 | 0,0449 | -0,0316 | 0,0063 | -5,06 | 0,0125 | 0,0305 | -0,0247 | -2,21 | -0,0411 | -0,2211 | kein Kandidat |
| 374 | W6 | 1m | long | 3h | ab1000 | 1.766 | -0,0337 | -7,15 | -2,93 | nein | 894 | 53.858 | 0,0459 | 0,0449 | -0,0250 | 0,0057 | -4,36 | 0,0115 | 0,0280 | -0,0176 | -1,66 | -0,0041 | -0,1841 | kein Kandidat |
| 375 | W6 | 5m | short | schluss | ab1000 | 1.766 | -0,0433 | -7,19 | -2,67 | nein | 894 | 36.781 | -0,0018 | 0,0449 | -0,0407 | 0,0081 | -5,02 | 0,0162 | 0,0395 | -0,0402 | -2,71 | -0,1618 | -0,4218 | kein Kandidat |
| 376 | W1b | 5m | short | naechste | 250-1000 | 1.766 | -0,0713 | -7,21 | -2,99 | nein | 893 | 33.963 | -0,0162 | 0,0647 | -0,0334 | 0,0119 | -2,80 | 0,0239 | 0,0581 | -0,0370 | -1,59 | -0,1762 | -0,4362 | kein Kandidat |
| 377 | W2 | 15m | short | naechste | 50-250 | 1.747 | -0,1170 | -7,22 | -2,51 | nein | 885 | 15.643 | -0,0761 | 0,0854 | -0,1327 | 0,0233 | -5,69 | 0,0466 | 0,1136 | -0,0878 | -2,05 | -0,2361 | -0,4961 | kein Kandidat |
| 378 | W1b | 15m | long | 3h | 50-250 | 1.684 | -0,1289 | -7,24 | -3,33 | nein | 874 | 13.838 | -0,0098 | 0,0854 | -0,1004 | 0,0194 | -5,19 | 0,0387 | 0,0943 | -0,0866 | -3,10 | -0,0598 | -0,2398 | kein Kandidat |
| 379 | W1b | 5m | short | 3h | 250-1000 | 1.752 | -0,0798 | -7,28 | -2,29 | nein | 890 | 17.879 | -0,0166 | 0,0647 | -0,0682 | 0,0174 | -3,91 | 0,0349 | 0,0850 | -0,0726 | -3,05 | -0,0666 | -0,2466 | kein Kandidat |
| 380 | W1a | 15m | short | naechste | 50-250 | 1.762 | -0,1054 | -7,35 | -3,34 | nein | 891 | 34.729 | -0,0591 | 0,0854 | -0,1117 | 0,0158 | -7,07 | 0,0316 | 0,0770 | -0,0972 | -2,95 | -0,2191 | -0,4791 | kein Kandidat |
| 381 | W6 | 5m | long | 1h | ab1000 | 1.766 | -0,0391 | -7,36 | -2,88 | nein | 894 | 31.868 | 0,0110 | 0,0449 | -0,0384 | 0,0068 | -5,65 | 0,0136 | 0,0331 | -0,0413 | -3,18 | -0,0390 | -0,2190 | kein Kandidat |
| 382 | W6 | 1m | long | schluss | ab1000 | 1.766 | -0,0241 | -7,37 | -2,90 | nein | 894 | 92.051 | 0,0267 | 0,0449 | -0,0245 | 0,0042 | -5,88 | 0,0083 | 0,0203 | -0,0213 | -3,45 | -0,1333 | -0,3933 | kein Kandidat |
| 383 | W1a | 15m | long | 3h | 50-250 | 1.695 | -0,1339 | -7,40 | -3,59 | nein | 877 | 15.177 | -0,0081 | 0,0854 | -0,0994 | 0,0187 | -5,33 | 0,0373 | 0,0909 | -0,1046 | -3,96 | -0,0581 | -0,2381 | kein Kandidat |
| 384 | W7 | 15m | short | 15m | ab1000 | 1.633 | -0,0471 | -7,41 | -3,79 | nein | 880 | 25.967 | 0,0255 | 0,0449 | -0,0185 | 0,0062 | -2,98 | 0,0124 | 0,0303 | -0,0191 | -2,13 | -0,0245 | -0,2045 | kein Kandidat |
| 385 | W5 | 15m | short | schluss | ab1000 | 1.744 | -0,0726 | -7,41 | -3,00 | nein | 894 | 20.052 | -0,0277 | 0,0449 | -0,0655 | 0,0121 | -5,42 | 0,0242 | 0,0589 | -0,0128 | -0,66 | -0,1877 | -0,4477 | kein Kandidat |
| 386 | W4 | 1m | short | 3h | 5-50 | 1.764 | -0,0940 | -7,45 | -2,11 | nein | 893 | 16.571 | 0,0605 | 0,1569 | -0,0884 | 0,0223 | -3,97 | 0,0445 | 0,1085 | -0,0748 | -1,72 | 0,0105 | -0,1695 | kein Kandidat |
| 387 | W4 | 15m | long | 15m | 50-250 | 1.118 | -0,0683 | -7,57 | -2,57 | nein | 639 | 1.617 | 0,0037 | 0,0854 | -0,0757 | 0,0133 | -5,69 | 0,0266 | 0,0648 | -0,1071 | -4,37 | -0,0463 | -0,2263 | kein Kandidat |
| 388 | W1a | 15m | short | 1h | 250-1000 | 1.657 | -0,0744 | -7,58 | -3,60 | nein | 867 | 9.170 | -0,0175 | 0,0647 | -0,0841 | 0,0103 | -8,13 | 0,0207 | 0,0504 | -0,0803 | -4,39 | -0,0675 | -0,2475 | kein Kandidat |
| 389 | W1a | 5m | long | naechste | 250-1000 | 1.766 | -0,0714 | -7,59 | -2,84 | nein | 893 | 36.620 | 0,0449 | 0,0647 | -0,0679 | 0,0126 | -5,39 | 0,0252 | 0,0614 | -0,0805 | -3,35 | -0,1151 | -0,3751 | kein Kandidat |
| 390 | W1a | 15m | short | 3h | 50-250 | 1.687 | -0,1155 | -7,73 | -3,33 | nein | 871 | 15.106 | 0,0146 | 0,0854 | -0,0687 | 0,0173 | -3,96 | 0,0347 | 0,0844 | -0,0831 | -2,54 | -0,0354 | -0,2154 | kein Kandidat |
| 391 | W1b | 5m | short | 15m | ab1000 | 1.604 | -0,0474 | -7,79 | -3,62 | nein | 870 | 6.372 | -0,0038 | 0,0449 | -0,0481 | 0,0066 | -7,34 | 0,0131 | 0,0319 | -0,0507 | -3,95 | -0,0538 | -0,2338 | kein Kandidat |
| 392 | W6 | 15m | short | 15m | ab1000 | 1.627 | -0,0441 | -7,80 | -4,25 | nein | 886 | 11.933 | -0,0079 | 0,0449 | -0,0520 | 0,0052 | -10,02 | 0,0104 | 0,0253 | -0,0403 | -4,35 | -0,0579 | -0,2379 | kein Kandidat |
| 393 | W1b | 5m | long | 3h | 250-1000 | 1.754 | -0,1001 | -7,84 | -4,01 | nein | 891 | 17.712 | -0,0109 | 0,0647 | -0,0887 | 0,0125 | -7,11 | 0,0249 | 0,0608 | -0,0777 | -3,52 | -0,0609 | -0,2409 | kein Kandidat |
| 394 | W1a | 5m | short | naechste | 250-1000 | 1.766 | -0,0738 | -7,84 | -3,12 | nein | 893 | 36.454 | -0,0200 | 0,0647 | -0,0371 | 0,0118 | -3,14 | 0,0236 | 0,0576 | -0,0379 | -1,65 | -0,1800 | -0,4400 | kein Kandidat |
| 395 | W3 | 1m | long | 1h | 5-50 | 1.766 | -0,1008 | -7,87 | -2,88 | nein | 894 | 47.795 | 0,0198 | 0,1569 | -0,1377 | 0,0175 | -7,86 | 0,0350 | 0,0854 | -0,1523 | -5,25 | -0,0302 | -0,2102 | kein Kandidat |
| 396 | W1a | 5m | short | 3h | 250-1000 | 1.754 | -0,0830 | -7,93 | -2,44 | nein | 892 | 19.308 | -0,0145 | 0,0647 | -0,0661 | 0,0170 | -3,88 | 0,0341 | 0,0830 | -0,0659 | -2,88 | -0,0645 | -0,2445 | kein Kandidat |
| 397 | W4 | 1m | long | 1h | 50-250 | 1.766 | -0,0373 | -7,95 | -2,84 | nein | 894 | 30.630 | 0,0260 | 0,0854 | -0,0607 | 0,0065 | -9,27 | 0,0131 | 0,0319 | -0,0565 | -4,39 | -0,0240 | -0,2040 | kein Kandidat |
| 398 | W2 | 5m | short | schluss | 250-1000 | 1.764 | -0,0798 | -7,98 | -3,13 | nein | 894 | 17.139 | 0,0137 | 0,0647 | -0,0520 | 0,0127 | -4,08 | 0,0255 | 0,0621 | -0,0661 | -3,27 | -0,1463 | -0,4063 | kein Kandidat |
| 399 | W1a | 5m | short | 15m | ab1000 | 1.625 | -0,0468 | -7,99 | -3,55 | nein | 874 | 6.739 | -0,0031 | 0,0449 | -0,0474 | 0,0066 | -7,19 | 0,0132 | 0,0321 | -0,0509 | -3,96 | -0,0531 | -0,2331 | kein Kandidat |
| 400 | W2 | 5m | long | schluss | 250-1000 | 1.766 | -0,0840 | -8,13 | -3,65 | nein | 894 | 17.564 | -0,0131 | 0,0647 | -0,0766 | 0,0115 | -6,66 | 0,0230 | 0,0560 | -0,0625 | -3,17 | -0,1731 | -0,4331 | kein Kandidat |
| 401 | W2 | 15m | long | 1h | 250-1000 | 1.398 | -0,1068 | -8,34 | -3,17 | nein | 791 | 3.921 | -0,0050 | 0,0647 | -0,0799 | 0,0169 | -4,74 | 0,0337 | 0,0822 | -0,1002 | -3,28 | -0,0550 | -0,2350 | kein Kandidat |
| 402 | W3 | 1m | long | 15m | 50-250 | 1.766 | -0,0534 | -8,46 | -3,37 | nein | 894 | 55.460 | 0,0259 | 0,0854 | -0,0598 | 0,0079 | -7,55 | 0,0158 | 0,0386 | -0,0383 | -2,96 | -0,0241 | -0,2041 | kein Kandidat |
| 403 | W2 | 15m | long | schluss | 250-1000 | 1.458 | -0,1491 | -8,52 | -3,25 | nein | 806 | 4.299 | -0,0306 | 0,0647 | -0,1077 | 0,0229 | -4,70 | 0,0458 | 0,1116 | -0,0828 | -1,97 | -0,1906 | -0,4506 | kein Kandidat |
| 404 | W5 | 5m | short | 3h | ab1000 | 1.749 | -0,0716 | -8,52 | -3,63 | nein | 894 | 25.767 | -0,0467 | 0,0449 | -0,0659 | 0,0099 | -6,67 | 0,0197 | 0,0481 | -0,0517 | -2,83 | -0,0967 | -0,2767 | kein Kandidat |
| 405 | W2 | 1m | long | 3h | 250-1000 | 1.753 | -0,0602 | -8,71 | -3,65 | nein | 886 | 35.821 | 0,0145 | 0,0647 | -0,0618 | 0,0082 | -7,50 | 0,0165 | 0,0402 | -0,0349 | -1,96 | -0,0355 | -0,2155 | kein Kandidat |
| 406 | W2 | 15m | long | 3h | 5-50 | 1.718 | -0,2375 | -8,80 | -3,91 | nein | 876 | 12.933 | 0,0239 | 0,1569 | -0,1407 | 0,0304 | -4,63 | 0,0607 | 0,1479 | -0,1435 | -3,13 | -0,0261 | -0,2061 | kein Kandidat |
| 407 | W2 | 1m | short | 3h | 250-1000 | 1.753 | -0,0520 | -8,81 | -3,48 | nein | 886 | 36.138 | -0,0157 | 0,0647 | -0,0677 | 0,0075 | -9,07 | 0,0149 | 0,0364 | -0,0572 | -4,02 | -0,0657 | -0,2457 | kein Kandidat |
| 408 | W1a | 5m | long | 3h | 250-1000 | 1.755 | -0,1045 | -8,85 | -4,46 | nein | 892 | 19.137 | -0,0149 | 0,0647 | -0,0928 | 0,0117 | -7,92 | 0,0234 | 0,0571 | -0,0740 | -3,51 | -0,0649 | -0,2449 | kein Kandidat |
| 409 | W2 | 15m | short | 3h | 5-50 | 1.718 | -0,1918 | -8,95 | -4,29 | nein | 867 | 12.426 | -0,0270 | 0,1569 | -0,1802 | 0,0223 | -8,07 | 0,0447 | 0,1088 | -0,2032 | -4,52 | -0,0770 | -0,2570 | kein Kandidat |
| 410 | W4 | 1m | short | naechste | 5-50 | 1.766 | -0,1358 | -8,95 | -1,49 | nein | 893 | 27.553 | -0,0451 | 0,1569 | -0,0832 | 0,0456 | -1,83 | 0,0912 | 0,2221 | -0,0994 | -1,69 | -0,2051 | -0,4651 | kein Kandidat |
| 411 | W2 | 1m | short | naechste | 250-1000 | 1.766 | -0,0525 | -8,96 | -3,64 | nein | 893 | 71.940 | -0,0336 | 0,0647 | -0,0477 | 0,0072 | -6,62 | 0,0144 | 0,0351 | -0,0507 | -3,32 | -0,1936 | -0,4536 | kein Kandidat |
| 412 | W4 | 5m | long | 15m | 50-250 | 1.753 | -0,0499 | -9,18 | -4,67 | nein | 891 | 9.705 | 0,0115 | 0,0854 | -0,0739 | 0,0053 | -13,82 | 0,0107 | 0,0260 | -0,0905 | -10,36 | -0,0385 | -0,2185 | kein Kandidat |
| 413 | W6 | 5m | short | 1h | ab1000 | 1.766 | -0,0499 | -9,19 | -3,91 | nein | 894 | 31.513 | 0,0011 | 0,0449 | -0,0394 | 0,0064 | -6,18 | 0,0128 | 0,0311 | -0,0354 | -2,97 | -0,0489 | -0,2289 | kein Kandidat |
| 414 | W2 | 15m | long | 15m | 250-1000 | 1.458 | -0,0678 | -9,25 | -4,13 | nein | 806 | 4.299 | -0,0220 | 0,0647 | -0,0887 | 0,0082 | -10,80 | 0,0164 | 0,0400 | -0,0986 | -6,49 | -0,0720 | -0,2520 | kein Kandidat |
| 415 | W2 | 5m | short | 1h | 250-1000 | 1.763 | -0,0646 | -9,40 | -3,01 | nein | 893 | 15.365 | 0,0052 | 0,0647 | -0,0574 | 0,0107 | -5,34 | 0,0215 | 0,0523 | -0,0513 | -3,35 | -0,0448 | -0,2248 | kein Kandidat |
| 416 | W5 | 15m | short | 3h | 250-1000 | 1.762 | -0,0763 | -9,46 | -3,73 | nein | 893 | 48.343 | -0,0351 | 0,0647 | -0,0872 | 0,0102 | -8,52 | 0,0205 | 0,0499 | -0,0665 | -3,39 | -0,0851 | -0,2651 | kein Kandidat |
| 417 | W1b | 1m | long | 3h | 250-1000 | 1.766 | -0,0417 | -9,46 | -3,44 | nein | 894 | 81.252 | 0,0318 | 0,0647 | -0,0477 | 0,0061 | -7,88 | 0,0121 | 0,0295 | -0,0362 | -3,39 | -0,0182 | -0,1982 | kein Kandidat |
| 418 | W1b | 15m | long | 1h | 250-1000 | 1.629 | -0,1025 | -9,46 | -4,43 | nein | 861 | 8.270 | -0,0261 | 0,0647 | -0,0969 | 0,0116 | -8,38 | 0,0231 | 0,0563 | -0,1028 | -5,08 | -0,0761 | -0,2561 | kein Kandidat |
| 419 | W3 | 5m | long | 15m | 5-50 | 1.763 | -0,1061 | -9,54 | -2,78 | nein | 893 | 36.799 | 0,0386 | 0,1569 | -0,1179 | 0,0191 | -6,18 | 0,0382 | 0,0930 | -0,1215 | -6,28 | -0,0114 | -0,1914 | kein Kandidat |
| 420 | W4 | 5m | long | 1h | 5-50 | 1.764 | -0,0915 | -9,63 | -2,95 | nein | 893 | 12.801 | 0,0596 | 0,1569 | -0,0964 | 0,0155 | -6,22 | 0,0310 | 0,0755 | -0,1189 | -5,50 | 0,0096 | -0,1704 | kein Kandidat |
| 421 | W2 | 15m | long | schluss | 50-250 | 1.746 | -0,1674 | -9,67 | -4,82 | nein | 890 | 15.675 | -0,0711 | 0,0854 | -0,1504 | 0,0173 | -8,67 | 0,0347 | 0,0845 | -0,1962 | -6,86 | -0,2311 | -0,4911 | kein Kandidat |
| 422 | W1a | 15m | long | 1h | 250-1000 | 1.654 | -0,0962 | -9,68 | -4,27 | nein | 866 | 9.001 | -0,0236 | 0,0647 | -0,0942 | 0,0113 | -8,37 | 0,0225 | 0,0549 | -0,1049 | -5,30 | -0,0736 | -0,2536 | kein Kandidat |
| 423 | W4 | 1m | short | schluss | 5-50 | 1.766 | -0,0959 | -9,70 | -2,46 | nein | 894 | 27.582 | 0,0821 | 0,1569 | -0,0809 | 0,0195 | -4,15 | 0,0390 | 0,0949 | -0,0552 | -1,64 | -0,0779 | -0,3379 | kein Kandidat |
| 424 | W2 | 5m | long | naechste | 50-250 | 1.766 | -0,1020 | -9,86 | -3,93 | nein | 893 | 61.416 | 0,0212 | 0,0854 | -0,1054 | 0,0130 | -8,13 | 0,0259 | 0,0632 | -0,1139 | -5,11 | -0,1388 | -0,3988 | kein Kandidat |
| 425 | W5 | 5m | short | naechste | ab1000 | 1.766 | -0,1006 | -9,89 | -4,25 | nein | 893 | 46.656 | -0,1636 | 0,0449 | -0,1021 | 0,0118 | -8,63 | 0,0237 | 0,0577 | -0,1065 | -5,25 | -0,3236 | -0,5836 | kein Kandidat |
| 426 | W2 | 15m | short | 15m | 250-1000 | 1.473 | -0,0695 | -10,08 | -4,62 | nein | 806 | 4.345 | -0,0031 | 0,0647 | -0,0696 | 0,0075 | -9,25 | 0,0150 | 0,0366 | -0,0804 | -6,28 | -0,0531 | -0,2331 | kein Kandidat |
| 427 | W1b | 15m | long | naechste | 50-250 | 1.762 | -0,1408 | -10,18 | -3,15 | nein | 892 | 31.404 | -0,0073 | 0,0854 | -0,1356 | 0,0223 | -6,07 | 0,0447 | 0,1089 | -0,1629 | -4,52 | -0,1673 | -0,4273 | kein Kandidat |
| 428 | W5 | 5m | long | naechste | ab1000 | 1.766 | -0,1056 | -10,20 | -4,30 | nein | 893 | 49.034 | 0,0302 | 0,0449 | -0,1205 | 0,0123 | -9,82 | 0,0245 | 0,0598 | -0,1423 | -5,85 | -0,1298 | -0,3898 | kein Kandidat |
| 429 | W1b | 1m | short | naechste | 250-1000 | 1.766 | -0,0444 | -10,22 | -3,97 | nein | 893 | 139.375 | -0,0303 | 0,0647 | -0,0449 | 0,0056 | -8,04 | 0,0112 | 0,0272 | -0,0326 | -2,60 | -0,1903 | -0,4503 | kein Kandidat |
| 430 | W1b | 1m | long | naechste | 250-1000 | 1.766 | -0,0461 | -10,28 | -3,73 | nein | 893 | 137.580 | 0,0772 | 0,0647 | -0,0373 | 0,0062 | -6,03 | 0,0124 | 0,0301 | -0,0405 | -3,21 | -0,0828 | -0,3428 | kein Kandidat |
| 431 | W6 | 15m | long | 15m | ab1000 | 1.622 | -0,0462 | -10,28 | -4,29 | nein | 881 | 12.145 | -0,0097 | 0,0449 | -0,0545 | 0,0054 | -10,11 | 0,0108 | 0,0263 | -0,0601 | -6,73 | -0,0597 | -0,2397 | kein Kandidat |
| 432 | W1b | 5m | short | schluss | 250-1000 | 1.766 | -0,0749 | -10,36 | -4,05 | nein | 894 | 34.031 | 0,0190 | 0,0647 | -0,0468 | 0,0092 | -5,06 | 0,0185 | 0,0450 | -0,0496 | -3,09 | -0,1410 | -0,4010 | kein Kandidat |
| 433 | W1b | 15m | short | naechste | 5-50 | 1.766 | -0,2101 | -10,40 | -5,22 | nein | 892 | 58.175 | -0,0789 | 0,1569 | -0,1645 | 0,0201 | -8,17 | 0,0403 | 0,0981 | -0,1567 | -4,74 | -0,2389 | -0,4989 | kein Kandidat |
| 434 | W4 | 1m | short | 1h | 50-250 | 1.766 | -0,0525 | -10,47 | -3,33 | nein | 894 | 32.220 | 0,0187 | 0,0854 | -0,0647 | 0,0079 | -8,21 | 0,0158 | 0,0384 | -0,0659 | -4,67 | -0,0313 | -0,2113 | kein Kandidat |
| 435 | W1a | 1m | long | 3h | 250-1000 | 1.766 | -0,0442 | -10,53 | -3,85 | nein | 894 | 87.617 | 0,0296 | 0,0647 | -0,0500 | 0,0057 | -8,71 | 0,0115 | 0,0280 | -0,0400 | -3,89 | -0,0204 | -0,2004 | kein Kandidat |
| 436 | W1b | 1m | short | 3h | 250-1000 | 1.766 | -0,0472 | -10,63 | -4,28 | nein | 894 | 81.973 | -0,0003 | 0,0647 | -0,0498 | 0,0055 | -9,03 | 0,0110 | 0,0269 | -0,0327 | -2,57 | -0,0503 | -0,2303 | kein Kandidat |
| 437 | W1a | 15m | long | naechste | 50-250 | 1.762 | -0,1419 | -10,64 | -3,39 | nein | 893 | 34.618 | -0,0125 | 0,0854 | -0,1405 | 0,0210 | -6,71 | 0,0419 | 0,1021 | -0,1666 | -5,16 | -0,1725 | -0,4325 | kein Kandidat |
| 438 | W5 | 15m | long | schluss | ab1000 | 1.740 | -0,1037 | -10,71 | -4,20 | nein | 894 | 21.500 | -0,0227 | 0,0449 | -0,0747 | 0,0124 | -6,05 | 0,0247 | 0,0602 | -0,0912 | -4,51 | -0,1827 | -0,4427 | kein Kandidat |
| 439 | W7 | 15m | long | 15m | 250-1000 | 1.759 | -0,0483 | -10,73 | -5,24 | nein | 894 | 115.972 | 0,0275 | 0,0647 | -0,0372 | 0,0046 | -8,08 | 0,0092 | 0,0224 | -0,0383 | -4,96 | -0,0225 | -0,2025 | kein Kandidat |
| 440 | W1a | 1m | short | naechste | 250-1000 | 1.766 | -0,0453 | -10,86 | -4,42 | nein | 893 | 150.742 | -0,0290 | 0,0647 | -0,0435 | 0,0051 | -8,48 | 0,0103 | 0,0250 | -0,0309 | -2,79 | -0,1890 | -0,4490 | kein Kandidat |
| 441 | W2 | 15m | short | schluss | 50-250 | 1.747 | -0,1305 | -10,87 | -4,36 | nein | 886 | 15.659 | -0,0087 | 0,0854 | -0,1114 | 0,0150 | -7,45 | 0,0299 | 0,0729 | -0,1197 | -3,71 | -0,1687 | -0,4287 | kein Kandidat |
| 442 | W4 | 5m | short | 15m | 50-250 | 1.757 | -0,0644 | -11,02 | -5,46 | nein | 893 | 9.888 | 0,0084 | 0,0854 | -0,0768 | 0,0059 | -13,02 | 0,0118 | 0,0287 | -0,0798 | -7,30 | -0,0416 | -0,2216 | kein Kandidat |
| 443 | W4 | 5m | short | 1h | 5-50 | 1.765 | -0,1160 | -11,09 | -4,48 | nein | 894 | 13.141 | 0,0202 | 0,1569 | -0,1367 | 0,0130 | -10,55 | 0,0259 | 0,0631 | -0,1432 | -6,50 | -0,0298 | -0,2098 | kein Kandidat |
| 444 | W1a | 1m | short | 3h | 250-1000 | 1.766 | -0,0478 | -11,13 | -4,69 | nein | 894 | 88.298 | -0,0023 | 0,0647 | -0,0518 | 0,0051 | -10,15 | 0,0102 | 0,0249 | -0,0363 | -3,08 | -0,0523 | -0,2323 | kein Kandidat |
| 445 | W1a | 5m | short | schluss | 250-1000 | 1.766 | -0,0779 | -11,14 | -4,24 | nein | 894 | 36.529 | 0,0194 | 0,0647 | -0,0464 | 0,0092 | -5,05 | 0,0184 | 0,0447 | -0,0458 | -2,95 | -0,1406 | -0,4006 | kein Kandidat |
| 446 | W1b | 15m | short | schluss | 50-250 | 1.761 | -0,1195 | -11,21 | -5,55 | nein | 892 | 31.669 | -0,0126 | 0,0854 | -0,1118 | 0,0108 | -10,38 | 0,0215 | 0,0525 | -0,1185 | -5,23 | -0,1726 | -0,4326 | kein Kandidat |
| 447 | W1b | 5m | long | schluss | 250-1000 | 1.766 | -0,0829 | -11,28 | -4,42 | nein | 894 | 34.154 | -0,0132 | 0,0647 | -0,0763 | 0,0094 | -8,14 | 0,0188 | 0,0457 | -0,0556 | -3,83 | -0,1732 | -0,4332 | kein Kandidat |
| 448 | W2 | 1m | long | naechste | 250-1000 | 1.766 | -0,0682 | -11,29 | -4,24 | nein | 893 | 71.353 | 0,0527 | 0,0647 | -0,0618 | 0,0081 | -7,67 | 0,0161 | 0,0392 | -0,0435 | -2,93 | -0,1073 | -0,3673 | kein Kandidat |
| 449 | W5 | 5m | long | 3h | ab1000 | 1.752 | -0,1023 | -11,47 | -4,88 | nein | 892 | 27.401 | -0,0063 | 0,0449 | -0,0761 | 0,0105 | -7,26 | 0,0210 | 0,0510 | -0,0627 | -3,19 | -0,0563 | -0,2363 | kein Kandidat |
| 450 | W1a | 1m | long | naechste | 250-1000 | 1.766 | -0,0502 | -11,50 | -4,44 | nein | 893 | 149.240 | 0,0742 | 0,0647 | -0,0406 | 0,0056 | -7,19 | 0,0113 | 0,0275 | -0,0424 | -3,87 | -0,0858 | -0,3458 | kein Kandidat |
| 451 | W1b | 5m | long | 1h | 250-1000 | 1.765 | -0,0722 | -11,56 | -5,37 | nein | 894 | 30.331 | 0,0097 | 0,0647 | -0,0564 | 0,0067 | -8,40 | 0,0134 | 0,0327 | -0,0347 | -2,67 | -0,0403 | -0,2203 | kein Kandidat |
| 452 | W1b | 5m | short | 1h | 250-1000 | 1.765 | -0,0653 | -11,60 | -4,98 | nein | 894 | 30.592 | 0,0175 | 0,0647 | -0,0448 | 0,0066 | -6,83 | 0,0131 | 0,0320 | -0,0411 | -3,69 | -0,0325 | -0,2125 | kein Kandidat |
| 453 | W6 | 1m | short | 1h | ab1000 | 1.766 | -0,0324 | -11,61 | -5,09 | nein | 894 | 84.259 | 0,0064 | 0,0449 | -0,0342 | 0,0032 | -10,74 | 0,0064 | 0,0155 | -0,0310 | -5,19 | -0,0436 | -0,2236 | kein Kandidat |
| 454 | W1a | 15m | short | schluss | 50-250 | 1.762 | -0,1232 | -11,87 | -6,01 | nein | 892 | 34.774 | -0,0129 | 0,0854 | -0,1121 | 0,0102 | -10,94 | 0,0205 | 0,0499 | -0,1202 | -5,79 | -0,1729 | -0,4329 | kein Kandidat |
| 455 | W2 | 15m | short | naechste | 5-50 | 1.765 | -0,2159 | -11,92 | -4,16 | nein | 892 | 30.945 | -0,1314 | 0,1569 | -0,2212 | 0,0260 | -8,52 | 0,0519 | 0,1265 | -0,2265 | -4,04 | -0,2914 | -0,5514 | kein Kandidat |
| 456 | W5 | 15m | short | naechste | 250-1000 | 1.766 | -0,0835 | -11,99 | -4,35 | nein | 893 | 103.245 | -0,0714 | 0,0647 | -0,0868 | 0,0096 | -9,05 | 0,0192 | 0,0468 | -0,0724 | -3,22 | -0,2314 | -0,4914 | kein Kandidat |
| 457 | W5 | 15m | short | 15m | ab1000 | 1.744 | -0,0456 | -12,01 | -4,57 | nein | 894 | 20.052 | 0,0018 | 0,0449 | -0,0428 | 0,0050 | -8,59 | 0,0100 | 0,0243 | -0,0341 | -5,04 | -0,0482 | -0,2282 | kein Kandidat |
| 458 | W1a | 5m | short | 1h | 250-1000 | 1.766 | -0,0661 | -12,04 | -5,19 | nein | 894 | 32.855 | 0,0192 | 0,0647 | -0,0431 | 0,0064 | -6,77 | 0,0127 | 0,0310 | -0,0370 | -3,30 | -0,0308 | -0,2108 | kein Kandidat |
| 459 | W1b | 15m | long | 3h | 5-50 | 1.743 | -0,2403 | -12,04 | -6,80 | nein | 887 | 24.961 | -0,0215 | 0,1569 | -0,1811 | 0,0177 | -10,25 | 0,0353 | 0,0861 | -0,1734 | -4,99 | -0,0715 | -0,2515 | kein Kandidat |
| 460 | W6 | 5m | long | 3h | 250-1000 | 1.766 | -0,0691 | -12,12 | -5,36 | nein | 894 | 92.596 | 0,0087 | 0,0647 | -0,0699 | 0,0064 | -10,86 | 0,0129 | 0,0314 | -0,0643 | -5,28 | -0,0413 | -0,2213 | kein Kandidat |
| 461 | W1a | 5m | long | 1h | 250-1000 | 1.765 | -0,0725 | -12,12 | -5,69 | nein | 894 | 32.581 | 0,0100 | 0,0647 | -0,0563 | 0,0064 | -8,84 | 0,0127 | 0,0310 | -0,0327 | -2,63 | -0,0400 | -0,2200 | kein Kandidat |
| 462 | W1a | 15m | long | 3h | 5-50 | 1.751 | -0,2256 | -12,14 | -6,66 | nein | 889 | 27.776 | -0,0271 | 0,1569 | -0,1864 | 0,0169 | -11,01 | 0,0339 | 0,0825 | -0,1626 | -5,23 | -0,0771 | -0,2571 | kein Kandidat |
| 463 | W5 | 15m | long | 3h | 250-1000 | 1.760 | -0,0966 | -12,23 | -5,48 | nein | 893 | 50.584 | -0,0077 | 0,0647 | -0,0859 | 0,0088 | -9,75 | 0,0176 | 0,0429 | -0,0743 | -4,27 | -0,0577 | -0,2377 | kein Kandidat |
| 464 | W2 | 1m | long | 15m | ab1000 | 1.755 | -0,0421 | -12,40 | -4,64 | nein | 894 | 12.954 | 0,0022 | 0,0449 | -0,0436 | 0,0045 | -9,61 | 0,0091 | 0,0221 | -0,0520 | -6,03 | -0,0478 | -0,2278 | kein Kandidat |
| 465 | W2 | 5m | short | 3h | 50-250 | 1.764 | -0,1116 | -12,45 | -4,96 | nein | 892 | 32.275 | -0,0359 | 0,0854 | -0,1136 | 0,0113 | -10,09 | 0,0225 | 0,0549 | -0,1044 | -5,57 | -0,0859 | -0,2659 | kein Kandidat |
| 466 | W4 | 1m | short | 15m | 250-1000 | 1.760 | -0,0542 | -12,47 | -5,17 | nein | 894 | 13.882 | 0,0098 | 0,0647 | -0,0542 | 0,0052 | -10,35 | 0,0105 | 0,0255 | -0,0647 | -6,85 | -0,0402 | -0,2202 | kein Kandidat |
| 467 | W6 | 15m | long | 3h | 250-1000 | 1.751 | -0,1066 | -12,56 | -5,09 | nein | 885 | 31.369 | -0,0207 | 0,0647 | -0,0968 | 0,0105 | -9,24 | 0,0209 | 0,0510 | -0,0755 | -3,93 | -0,0707 | -0,2507 | kein Kandidat |
| 468 | W1a | 5m | long | schluss | 250-1000 | 1.766 | -0,0872 | -12,62 | -4,87 | nein | 894 | 36.662 | -0,0126 | 0,0647 | -0,0759 | 0,0090 | -8,46 | 0,0179 | 0,0437 | -0,0543 | -3,85 | -0,1726 | -0,4326 | kein Kandidat |
| 469 | W2 | 1m | short | 15m | ab1000 | 1.756 | -0,0417 | -12,62 | -4,82 | nein | 893 | 13.259 | 0,0019 | 0,0449 | -0,0421 | 0,0043 | -9,71 | 0,0087 | 0,0211 | -0,0452 | -5,86 | -0,0481 | -0,2281 | kein Kandidat |
| 470 | W1b | 15m | short | 15m | 250-1000 | 1.665 | -0,0649 | -12,73 | -5,81 | nein | 871 | 9.238 | -0,0001 | 0,0647 | -0,0659 | 0,0056 | -11,82 | 0,0112 | 0,0272 | -0,0778 | -8,20 | -0,0501 | -0,2301 | kein Kandidat |
| 471 | W2 | 1m | short | schluss | 250-1000 | 1.766 | -0,0525 | -12,75 | -5,58 | nein | 894 | 72.050 | 0,0116 | 0,0647 | -0,0525 | 0,0047 | -11,15 | 0,0094 | 0,0229 | -0,0531 | -5,76 | -0,1484 | -0,4084 | kein Kandidat |
| 472 | W2 | 5m | long | 3h | 50-250 | 1.764 | -0,1230 | -12,78 | -5,67 | nein | 893 | 31.878 | -0,0300 | 0,0854 | -0,1231 | 0,0108 | -11,35 | 0,0217 | 0,0529 | -0,0999 | -4,69 | -0,0800 | -0,2600 | kein Kandidat |
| 473 | W1b | 1m | long | schluss | 250-1000 | 1.766 | -0,0421 | -12,81 | -5,16 | nein | 894 | 137.787 | 0,0226 | 0,0647 | -0,0421 | 0,0041 | -10,32 | 0,0082 | 0,0199 | -0,0490 | -6,09 | -0,1374 | -0,3974 | kein Kandidat |
| 474 | W5 | 15m | long | naechste | 250-1000 | 1.766 | -0,0953 | -13,05 | -3,92 | nein | 893 | 108.088 | 0,0108 | 0,0647 | -0,1040 | 0,0121 | -8,56 | 0,0243 | 0,0592 | -0,1153 | -4,48 | -0,1492 | -0,4092 | kein Kandidat |
| 475 | W2 | 1m | long | schluss | 250-1000 | 1.766 | -0,0595 | -13,06 | -5,46 | nein | 894 | 71.465 | 0,0094 | 0,0647 | -0,0551 | 0,0055 | -10,10 | 0,0109 | 0,0266 | -0,0475 | -4,30 | -0,1506 | -0,4106 | kein Kandidat |
| 476 | W6 | 5m | long | naechste | 250-1000 | 1.766 | -0,0603 | -13,16 | -4,57 | nein | 893 | 196.100 | 0,0530 | 0,0647 | -0,0602 | 0,0066 | -9,12 | 0,0132 | 0,0322 | -0,0524 | -4,36 | -0,1070 | -0,3670 | kein Kandidat |
| 477 | W2 | 15m | long | 1h | 50-250 | 1.740 | -0,1191 | -13,24 | -5,58 | nein | 884 | 14.240 | -0,0293 | 0,0854 | -0,1165 | 0,0107 | -10,92 | 0,0213 | 0,0520 | -0,1454 | -7,91 | -0,0793 | -0,2593 | kein Kandidat |
| 478 | W4 | 15m | long | 15m | 5-50 | 1.645 | -0,1161 | -13,43 | -3,91 | nein | 829 | 4.078 | 0,0267 | 0,1569 | -0,1277 | 0,0148 | -8,60 | 0,0297 | 0,0723 | -0,1244 | -7,29 | -0,0233 | -0,2033 | kein Kandidat |
| 479 | W6 | 15m | short | 3h | 250-1000 | 1.748 | -0,1159 | -13,64 | -6,30 | nein | 886 | 31.693 | -0,0518 | 0,0647 | -0,1057 | 0,0092 | -11,50 | 0,0184 | 0,0448 | -0,0834 | -4,48 | -0,1018 | -0,2818 | kein Kandidat |
| 480 | W1b | 15m | short | 3h | 5-50 | 1.746 | -0,2081 | -13,67 | -5,40 | nein | 887 | 24.398 | -0,0079 | 0,1569 | -0,1633 | 0,0193 | -8,47 | 0,0386 | 0,0939 | -0,1608 | -4,81 | -0,0579 | -0,2379 | kein Kandidat |
| 481 | W5 | 15m | long | 15m | ab1000 | 1.740 | -0,0564 | -13,71 | -6,16 | nein | 894 | 21.500 | -0,0058 | 0,0449 | -0,0511 | 0,0046 | -11,17 | 0,0091 | 0,0223 | -0,0553 | -6,35 | -0,0558 | -0,2358 | kein Kandidat |
| 482 | W1b | 15m | long | 15m | 250-1000 | 1.657 | -0,0737 | -13,73 | -6,13 | nein | 874 | 9.060 | -0,0177 | 0,0647 | -0,0833 | 0,0060 | -13,88 | 0,0120 | 0,0293 | -0,0913 | -8,73 | -0,0677 | -0,2477 | kein Kandidat |
| 483 | W1a | 15m | short | 15m | 250-1000 | 1.685 | -0,0658 | -13,74 | -6,02 | nein | 875 | 9.965 | -0,0002 | 0,0647 | -0,0659 | 0,0055 | -12,07 | 0,0109 | 0,0266 | -0,0779 | -8,08 | -0,0502 | -0,2302 | kein Kandidat |
| 484 | W1b | 1m | short | schluss | 250-1000 | 1.766 | -0,0445 | -13,74 | -5,65 | nein | 894 | 139.545 | 0,0196 | 0,0647 | -0,0449 | 0,0039 | -11,41 | 0,0079 | 0,0192 | -0,0375 | -4,81 | -0,1404 | -0,4004 | kein Kandidat |
| 485 | W2 | 5m | short | naechste | 50-250 | 1.766 | -0,0951 | -13,79 | -4,72 | nein | 893 | 60.789 | -0,0448 | 0,0854 | -0,0890 | 0,0101 | -8,83 | 0,0202 | 0,0491 | -0,0857 | -3,99 | -0,2048 | -0,4648 | kein Kandidat |
| 486 | W4 | 15m | short | 15m | 5-50 | 1.657 | -0,1330 | -13,91 | -6,61 | nein | 844 | 4.428 | 0,0310 | 0,1569 | -0,1243 | 0,0101 | -12,35 | 0,0201 | 0,0490 | -0,1340 | -7,06 | -0,0190 | -0,1990 | kein Kandidat |
| 487 | W2 | 15m | short | 1h | 50-250 | 1.736 | -0,1177 | -13,93 | -5,11 | nein | 884 | 14.242 | -0,0090 | 0,0854 | -0,0969 | 0,0115 | -8,40 | 0,0231 | 0,0562 | -0,0891 | -3,89 | -0,0590 | -0,2390 | kein Kandidat |
| 488 | W1b | 15m | long | schluss | 50-250 | 1.762 | -0,1452 | -14,08 | -4,91 | nein | 893 | 31.443 | -0,0464 | 0,0854 | -0,1263 | 0,0148 | -8,54 | 0,0296 | 0,0721 | -0,1384 | -6,55 | -0,2064 | -0,4664 | kein Kandidat |
| 489 | W5 | 15m | long | 3h | 50-250 | 1.763 | -0,1088 | -14,30 | -7,66 | nein | 894 | 162.964 | -0,0056 | 0,0854 | -0,0993 | 0,0071 | -13,97 | 0,0142 | 0,0346 | -0,0986 | -6,96 | -0,0556 | -0,2356 | kein Kandidat |
| 490 | W7 | 1m | long | 15m | ab1000 | 1.766 | -0,0379 | -14,48 | -5,89 | nein | 894 | 86.521 | 0,0056 | 0,0449 | -0,0401 | 0,0032 | -12,48 | 0,0064 | 0,0157 | -0,0476 | -7,52 | -0,0444 | -0,2244 | kein Kandidat |
| 491 | W1b | 5m | short | 3h | 50-250 | 1.766 | -0,1059 | -14,59 | -5,32 | nein | 894 | 60.236 | -0,0247 | 0,0854 | -0,1020 | 0,0100 | -10,25 | 0,0199 | 0,0485 | -0,0962 | -6,07 | -0,0747 | -0,2547 | kein Kandidat |
| 492 | W6 | 15m | short | naechste | 250-1000 | 1.766 | -0,1425 | -14,61 | -6,34 | nein | 893 | 65.852 | -0,0746 | 0,0647 | -0,0903 | 0,0112 | -8,03 | 0,0225 | 0,0548 | -0,0618 | -2,70 | -0,2346 | -0,4946 | kein Kandidat |
| 493 | W6 | 1m | long | 1h | ab1000 | 1.766 | -0,0378 | -14,76 | -6,19 | nein | 894 | 84.071 | 0,0138 | 0,0449 | -0,0354 | 0,0031 | -11,59 | 0,0061 | 0,0149 | -0,0278 | -4,83 | -0,0362 | -0,2162 | kein Kandidat |
| 494 | W1a | 1m | short | schluss | 250-1000 | 1.766 | -0,0456 | -14,81 | -6,01 | nein | 894 | 150.930 | 0,0184 | 0,0647 | -0,0460 | 0,0038 | -12,14 | 0,0076 | 0,0185 | -0,0380 | -5,25 | -0,1416 | -0,4016 | kein Kandidat |
| 495 | W1a | 15m | long | 15m | 250-1000 | 1.679 | -0,0715 | -14,84 | -5,97 | nein | 877 | 9.816 | -0,0150 | 0,0647 | -0,0807 | 0,0060 | -13,47 | 0,0120 | 0,0292 | -0,0900 | -8,92 | -0,0650 | -0,2450 | kein Kandidat |
| 496 | W1b | 5m | short | naechste | 50-250 | 1.766 | -0,0928 | -14,91 | -5,77 | nein | 893 | 112.533 | -0,0315 | 0,0854 | -0,0758 | 0,0080 | -9,42 | 0,0161 | 0,0392 | -0,0700 | -4,83 | -0,1915 | -0,4515 | kein Kandidat |
| 497 | W1a | 1m | long | schluss | 250-1000 | 1.766 | -0,0462 | -14,93 | -6,07 | nein | 894 | 149.468 | 0,0199 | 0,0647 | -0,0450 | 0,0038 | -11,83 | 0,0076 | 0,0185 | -0,0506 | -6,82 | -0,1401 | -0,4001 | kein Kandidat |
| 498 | W7 | 1m | long | 1h | 250-1000 | 1.766 | -0,0431 | -14,98 | -5,77 | nein | 894 | 398.826 | 0,0181 | 0,0647 | -0,0491 | 0,0037 | -13,15 | 0,0075 | 0,0182 | -0,0532 | -7,30 | -0,0319 | -0,2119 | kein Kandidat |
| 499 | W1a | 15m | short | 3h | 5-50 | 1.750 | -0,2075 | -14,99 | -6,40 | nein | 889 | 27.132 | -0,0112 | 0,1569 | -0,1650 | 0,0162 | -10,17 | 0,0324 | 0,0790 | -0,1782 | -6,24 | -0,0612 | -0,2412 | kein Kandidat |
| 500 | W6 | 15m | long | naechste | 250-1000 | 1.766 | -0,1294 | -15,06 | -5,17 | nein | 893 | 66.462 | 0,0148 | 0,0647 | -0,0999 | 0,0125 | -7,97 | 0,0251 | 0,0610 | -0,0679 | -2,48 | -0,1452 | -0,4052 | kein Kandidat |
| 501 | W7 | 15m | long | 1h | 5-50 | 1.766 | -0,0780 | -15,09 | -5,95 | nein | 894 | 630.416 | 0,0665 | 0,1569 | -0,0896 | 0,0066 | -13,66 | 0,0131 | 0,0320 | -0,1050 | -11,33 | 0,0165 | -0,1635 | kein Kandidat |
| 502 | W2 | 1m | long | 3h | 50-250 | 1.753 | -0,0809 | -15,09 | -6,27 | nein | 886 | 107.107 | 0,0076 | 0,0854 | -0,0848 | 0,0064 | -13,14 | 0,0129 | 0,0314 | -0,0789 | -6,02 | -0,0424 | -0,2224 | kein Kandidat |
| 503 | W7 | 5m | long | 1h | 5-50 | 1.766 | -0,0739 | -15,11 | -6,05 | nein | 894 | 1.058.485 | 0,0688 | 0,1569 | -0,0872 | 0,0061 | -14,28 | 0,0122 | 0,0298 | -0,1080 | -11,02 | 0,0188 | -0,1612 | kein Kandidat |
| 504 | W6 | 5m | short | naechste | 250-1000 | 1.766 | -0,0653 | -15,15 | -6,39 | nein | 893 | 196.501 | -0,0490 | 0,0647 | -0,0647 | 0,0051 | -12,66 | 0,0102 | 0,0249 | -0,0510 | -4,97 | -0,2090 | -0,4690 | kein Kandidat |
| 505 | W5 | 15m | short | 1h | 250-1000 | 1.766 | -0,0650 | -15,18 | -6,48 | nein | 894 | 86.427 | 0,0050 | 0,0647 | -0,0573 | 0,0050 | -11,44 | 0,0100 | 0,0244 | -0,0469 | -5,25 | -0,0450 | -0,2250 | kein Kandidat |
| 506 | W4 | 1m | long | 1h | 5-50 | 1.766 | -0,1035 | -15,32 | -4,94 | nein | 894 | 22.372 | 0,0264 | 0,1569 | -0,1315 | 0,0105 | -12,55 | 0,0209 | 0,0510 | -0,1594 | -8,08 | -0,0236 | -0,2036 | kein Kandidat |
| 507 | W1a | 15m | short | 1h | 50-250 | 1.760 | -0,1131 | -15,32 | -7,61 | nein | 892 | 31.739 | -0,0066 | 0,0854 | -0,0926 | 0,0074 | -12,47 | 0,0149 | 0,0362 | -0,0864 | -6,44 | -0,0566 | -0,2366 | kein Kandidat |
| 508 | W7 | 1m | short | 3h | 5-50 | 1.766 | -0,0889 | -15,34 | -6,75 | nein | 894 | 761.277 | 0,0377 | 0,1569 | -0,1104 | 0,0066 | -16,74 | 0,0132 | 0,0321 | -0,1332 | -11,49 | -0,0123 | -0,1923 | kein Kandidat |
| 509 | W2 | 15m | long | naechste | 5-50 | 1.763 | -0,2417 | -15,34 | -5,17 | nein | 892 | 31.522 | -0,0207 | 0,1569 | -0,2547 | 0,0234 | -10,90 | 0,0468 | 0,1139 | -0,1934 | -5,14 | -0,1807 | -0,4407 | kein Kandidat |
| 510 | W1a | 5m | short | 3h | 50-250 | 1.766 | -0,1060 | -15,41 | -5,82 | nein | 894 | 66.738 | -0,0261 | 0,0854 | -0,1034 | 0,0091 | -11,35 | 0,0182 | 0,0444 | -0,0949 | -6,37 | -0,0761 | -0,2561 | kein Kandidat |
| 511 | W7 | 1m | short | 1h | 250-1000 | 1.766 | -0,0421 | -15,45 | -6,76 | nein | 894 | 418.049 | 0,0093 | 0,0647 | -0,0525 | 0,0031 | -16,90 | 0,0062 | 0,0152 | -0,0607 | -10,12 | -0,0407 | -0,2207 | kein Kandidat |
| 512 | W1b | 15m | short | 1h | 50-250 | 1.758 | -0,1109 | -15,56 | -7,25 | nein | 892 | 28.770 | -0,0075 | 0,0854 | -0,0936 | 0,0076 | -12,24 | 0,0153 | 0,0373 | -0,0863 | -6,21 | -0,0575 | -0,2375 | kein Kandidat |
| 513 | W1b | 1m | short | 15m | ab1000 | 1.765 | -0,0462 | -15,63 | -5,90 | nein | 894 | 27.664 | 0,0043 | 0,0449 | -0,0397 | 0,0039 | -10,14 | 0,0078 | 0,0191 | -0,0371 | -5,38 | -0,0457 | -0,2257 | kein Kandidat |
| 514 | W3 | 1m | long | 15m | 5-50 | 1.766 | -0,1223 | -15,64 | -6,03 | nein | 894 | 53.506 | 0,0193 | 0,1569 | -0,1381 | 0,0101 | -13,61 | 0,0203 | 0,0494 | -0,1268 | -7,04 | -0,0307 | -0,2107 | kein Kandidat |
| 515 | W2 | 1m | short | 3h | 50-250 | 1.753 | -0,0778 | -15,65 | -5,33 | nein | 886 | 107.824 | -0,0067 | 0,0854 | -0,0852 | 0,0073 | -11,68 | 0,0146 | 0,0356 | -0,0711 | -5,69 | -0,0567 | -0,2367 | kein Kandidat |
| 516 | W2 | 15m | long | 15m | 50-250 | 1.746 | -0,0947 | -15,67 | -9,04 | nein | 890 | 15.675 | -0,0149 | 0,0854 | -0,1003 | 0,0052 | -19,17 | 0,0105 | 0,0255 | -0,1003 | -12,95 | -0,0649 | -0,2449 | kein Kandidat |
| 517 | W1a | 15m | short | naechste | 5-50 | 1.766 | -0,2185 | -15,69 | -6,05 | nein | 893 | 65.901 | -0,0931 | 0,1569 | -0,1775 | 0,0181 | -9,82 | 0,0361 | 0,0880 | -0,1634 | -5,40 | -0,2531 | -0,5131 | kein Kandidat |
| 518 | W1a | 5m | long | naechste | 50-250 | 1.766 | -0,1004 | -15,69 | -5,82 | nein | 893 | 123.842 | 0,0295 | 0,0854 | -0,0972 | 0,0086 | -11,27 | 0,0173 | 0,0420 | -0,0904 | -5,97 | -0,1305 | -0,3905 | kein Kandidat |
| 519 | W1b | 5m | long | 3h | 50-250 | 1.764 | -0,1191 | -15,70 | -6,59 | nein | 894 | 59.063 | -0,0233 | 0,0854 | -0,1174 | 0,0090 | -12,97 | 0,0181 | 0,0441 | -0,0957 | -5,76 | -0,0733 | -0,2533 | kein Kandidat |
| 520 | W1b | 15m | long | 1h | 50-250 | 1.759 | -0,1157 | -15,97 | -6,41 | nein | 893 | 28.614 | -0,0155 | 0,0854 | -0,1024 | 0,0090 | -11,34 | 0,0181 | 0,0440 | -0,1234 | -8,57 | -0,0655 | -0,2455 | kein Kandidat |
| 521 | W5 | 5m | short | 1h | ab1000 | 1.765 | -0,0761 | -16,09 | -6,76 | nein | 894 | 42.160 | -0,0310 | 0,0449 | -0,0715 | 0,0056 | -12,71 | 0,0113 | 0,0274 | -0,0660 | -6,75 | -0,0810 | -0,2610 | kein Kandidat |
| 522 | W1a | 15m | long | schluss | 50-250 | 1.762 | -0,1463 | -16,17 | -5,18 | nein | 894 | 34.660 | -0,0474 | 0,0854 | -0,1273 | 0,0141 | -9,01 | 0,0283 | 0,0688 | -0,1425 | -7,09 | -0,2074 | -0,4674 | kein Kandidat |
| 523 | W1a | 1m | short | 15m | ab1000 | 1.766 | -0,0461 | -16,23 | -6,02 | nein | 894 | 29.218 | 0,0041 | 0,0449 | -0,0399 | 0,0038 | -10,41 | 0,0077 | 0,0187 | -0,0369 | -5,46 | -0,0459 | -0,2259 | kein Kandidat |
| 524 | W6 | 5m | long | schluss | 250-1000 | 1.766 | -0,0568 | -16,35 | -6,03 | nein | 894 | 196.376 | 0,0079 | 0,0647 | -0,0561 | 0,0047 | -11,92 | 0,0094 | 0,0229 | -0,0552 | -7,28 | -0,1521 | -0,4121 | kein Kandidat |
| 525 | W2 | 1m | short | 1h | 250-1000 | 1.766 | -0,0556 | -16,40 | -6,78 | nein | 894 | 64.320 | -0,0002 | 0,0647 | -0,0621 | 0,0041 | -15,15 | 0,0082 | 0,0200 | -0,0624 | -9,20 | -0,0502 | -0,2302 | kein Kandidat |
| 526 | W5 | 1m | long | naechste | ab1000 | 1.766 | -0,0912 | -16,41 | -6,67 | nein | 893 | 93.038 | 0,0455 | 0,0449 | -0,1056 | 0,0068 | -15,45 | 0,0137 | 0,0333 | -0,1011 | -7,60 | -0,1145 | -0,3745 | kein Kandidat |
| 527 | W1a | 15m | long | 1h | 50-250 | 1.760 | -0,1146 | -16,43 | -6,87 | nein | 894 | 31.702 | -0,0175 | 0,0854 | -0,1045 | 0,0083 | -12,53 | 0,0167 | 0,0406 | -0,1240 | -9,00 | -0,0675 | -0,2475 | kein Kandidat |
| 528 | W2 | 1m | long | 1h | 250-1000 | 1.766 | -0,0581 | -16,44 | -7,43 | nein | 894 | 64.358 | 0,0026 | 0,0647 | -0,0647 | 0,0039 | -16,56 | 0,0078 | 0,0190 | -0,0670 | -7,96 | -0,0474 | -0,2274 | kein Kandidat |
| 529 | W5 | 15m | short | 3h | 50-250 | 1.766 | -0,0947 | -16,53 | -6,09 | nein | 893 | 160.342 | -0,0256 | 0,0854 | -0,1034 | 0,0078 | -13,29 | 0,0156 | 0,0379 | -0,0848 | -6,29 | -0,0756 | -0,2556 | kein Kandidat |
| 530 | W1a | 5m | short | naechste | 50-250 | 1.766 | -0,0963 | -16,56 | -6,08 | nein | 893 | 123.770 | -0,0350 | 0,0854 | -0,0794 | 0,0079 | -10,03 | 0,0158 | 0,0386 | -0,0761 | -5,32 | -0,1950 | -0,4550 | kein Kandidat |
| 531 | W1b | 1m | long | 15m | ab1000 | 1.765 | -0,0516 | -16,58 | -5,81 | nein | 894 | 26.962 | 0,0083 | 0,0449 | -0,0375 | 0,0044 | -8,45 | 0,0089 | 0,0216 | -0,0517 | -7,01 | -0,0417 | -0,2217 | kein Kandidat |
| 532 | W7 | 5m | long | 15m | 250-1000 | 1.766 | -0,0453 | -16,67 | -7,54 | nein | 894 | 209.639 | 0,0165 | 0,0647 | -0,0483 | 0,0030 | -16,10 | 0,0060 | 0,0146 | -0,0512 | -8,74 | -0,0335 | -0,2135 | kein Kandidat |
| 533 | W2 | 5m | long | 15m | 250-1000 | 1.766 | -0,0629 | -16,67 | -8,21 | nein | 894 | 17.564 | -0,0013 | 0,0647 | -0,0663 | 0,0038 | -17,30 | 0,0077 | 0,0187 | -0,0603 | -8,28 | -0,0513 | -0,2313 | kein Kandidat |
| 534 | W6 | 5m | short | 3h | 250-1000 | 1.766 | -0,0845 | -16,68 | -6,10 | nein | 894 | 92.462 | -0,0331 | 0,0647 | -0,0840 | 0,0069 | -12,14 | 0,0138 | 0,0337 | -0,0589 | -4,12 | -0,0831 | -0,2631 | kein Kandidat |
| 535 | W1b | 5m | long | naechste | 50-250 | 1.766 | -0,1018 | -16,70 | -5,77 | nein | 893 | 112.377 | 0,0301 | 0,0854 | -0,0965 | 0,0088 | -10,94 | 0,0176 | 0,0430 | -0,0910 | -5,67 | -0,1299 | -0,3899 | kein Kandidat |
| 536 | W7 | 15m | short | 15m | 250-1000 | 1.763 | -0,0456 | -16,71 | -7,73 | nein | 894 | 133.987 | 0,0180 | 0,0647 | -0,0464 | 0,0029 | -15,72 | 0,0059 | 0,0144 | -0,0535 | -11,79 | -0,0320 | -0,2120 | kein Kandidat |
| 537 | W1a | 5m | long | 3h | 50-250 | 1.765 | -0,1230 | -16,92 | -7,32 | nein | 894 | 65.634 | -0,0198 | 0,0854 | -0,1138 | 0,0084 | -13,56 | 0,0168 | 0,0409 | -0,0932 | -5,95 | -0,0698 | -0,2498 | kein Kandidat |
| 538 | W7 | 15m | short | 1h | 5-50 | 1.766 | -0,0780 | -16,96 | -7,26 | nein | 894 | 644.348 | 0,0593 | 0,1569 | -0,0978 | 0,0054 | -18,21 | 0,0107 | 0,0262 | -0,1029 | -10,28 | 0,0093 | -0,1707 | kein Kandidat |
| 539 | W5 | 1m | short | naechste | ab1000 | 1.766 | -0,0976 | -17,07 | -7,09 | nein | 893 | 89.409 | -0,1649 | 0,0449 | -0,1026 | 0,0069 | -14,89 | 0,0138 | 0,0336 | -0,0990 | -7,09 | -0,3249 | -0,5849 | kein Kandidat |
| 540 | W7 | 1m | short | 15m | ab1000 | 1.766 | -0,0374 | -17,11 | -6,35 | nein | 894 | 92.107 | -0,0010 | 0,0449 | -0,0451 | 0,0029 | -15,30 | 0,0059 | 0,0143 | -0,0493 | -8,42 | -0,0510 | -0,2310 | kein Kandidat |
| 541 | W7 | 5m | short | 1h | 5-50 | 1.766 | -0,0766 | -17,15 | -5,94 | nein | 894 | 1.076.912 | 0,0640 | 0,1569 | -0,0933 | 0,0064 | -14,48 | 0,0129 | 0,0314 | -0,1059 | -11,33 | 0,0140 | -0,1660 | kein Kandidat |
| 542 | W6 | 5m | long | 1h | 250-1000 | 1.766 | -0,0603 | -17,31 | -8,74 | nein | 894 | 171.005 | 0,0020 | 0,0647 | -0,0649 | 0,0035 | -18,80 | 0,0069 | 0,0168 | -0,0613 | -8,99 | -0,0480 | -0,2280 | kein Kandidat |
| 543 | W1a | 1m | long | 15m | ab1000 | 1.765 | -0,0509 | -17,46 | -5,86 | nein | 894 | 28.470 | 0,0071 | 0,0449 | -0,0387 | 0,0043 | -8,92 | 0,0087 | 0,0212 | -0,0504 | -6,96 | -0,0429 | -0,2229 | kein Kandidat |
| 544 | W7 | 1m | short | naechste | 5-50 | 1.766 | -0,0871 | -17,48 | -3,14 | nein | 893 | 1.259.739 | -0,0426 | 0,1569 | -0,0823 | 0,0139 | -5,93 | 0,0278 | 0,0677 | -0,1154 | -12,04 | -0,2026 | -0,4626 | kein Kandidat |
| 545 | W4 | 1m | short | 1h | 5-50 | 1.766 | -0,1301 | -17,55 | -4,27 | nein | 894 | 23.956 | 0,0405 | 0,1569 | -0,1147 | 0,0152 | -7,52 | 0,0305 | 0,0743 | -0,0871 | -3,48 | -0,0095 | -0,1895 | kein Kandidat |
| 546 | W7 | 1m | long | 3h | 5-50 | 1.766 | -0,0942 | -17,56 | -6,69 | nein | 894 | 765.111 | 0,0662 | 0,1569 | -0,0985 | 0,0070 | -13,99 | 0,0141 | 0,0343 | -0,1152 | -10,01 | 0,0162 | -0,1638 | kein Kandidat |
| 547 | W2 | 5m | short | 1h | 50-250 | 1.766 | -0,0881 | -17,64 | -7,30 | nein | 894 | 54.779 | 0,0083 | 0,0854 | -0,0759 | 0,0060 | -12,58 | 0,0121 | 0,0294 | -0,0674 | -6,30 | -0,0417 | -0,2217 | kein Kandidat |
| 548 | W5 | 15m | long | 1h | 250-1000 | 1.766 | -0,0760 | -17,68 | -7,89 | nein | 894 | 90.280 | 0,0010 | 0,0647 | -0,0665 | 0,0048 | -13,80 | 0,0096 | 0,0235 | -0,0581 | -6,69 | -0,0490 | -0,2290 | kein Kandidat |
| 549 | W5 | 5m | short | 3h | 250-1000 | 1.765 | -0,0859 | -17,84 | -7,85 | nein | 894 | 132.817 | -0,0269 | 0,0647 | -0,0779 | 0,0055 | -14,25 | 0,0109 | 0,0266 | -0,0747 | -6,53 | -0,0769 | -0,2569 | kein Kandidat |
| 550 | W5 | 5m | long | 1h | ab1000 | 1.766 | -0,0923 | -18,00 | -7,81 | nein | 894 | 44.363 | -0,0267 | 0,0449 | -0,0760 | 0,0059 | -12,86 | 0,0118 | 0,0288 | -0,0672 | -7,14 | -0,0767 | -0,2567 | kein Kandidat |
| 551 | W5 | 5m | long | 3h | 250-1000 | 1.766 | -0,0963 | -18,00 | -8,49 | nein | 894 | 140.503 | -0,0053 | 0,0647 | -0,0843 | 0,0057 | -14,87 | 0,0113 | 0,0276 | -0,0808 | -7,38 | -0,0553 | -0,2353 | kein Kandidat |
| 552 | W6 | 5m | long | 15m | ab1000 | 1.766 | -0,0504 | -18,14 | -7,31 | nein | 894 | 36.709 | 0,0004 | 0,0449 | -0,0451 | 0,0034 | -13,11 | 0,0069 | 0,0168 | -0,0502 | -7,90 | -0,0496 | -0,2296 | kein Kandidat |
| 553 | W7 | 1m | long | naechste | 5-50 | 1.766 | -0,0883 | -18,15 | -3,09 | nein | 893 | 1.267.190 | 0,2058 | 0,1569 | -0,0667 | 0,0143 | -4,67 | 0,0286 | 0,0697 | -0,1016 | -10,04 | 0,0458 | -0,2142 | kein Kandidat |
| 554 | W5 | 15m | short | schluss | 250-1000 | 1.766 | -0,0901 | -18,26 | -7,61 | nein | 894 | 103.483 | -0,0211 | 0,0647 | -0,0863 | 0,0059 | -14,57 | 0,0118 | 0,0289 | -0,0631 | -5,42 | -0,1811 | -0,4411 | kein Kandidat |
| 555 | W6 | 15m | long | 1h | 250-1000 | 1.766 | -0,0789 | -18,30 | -7,72 | nein | 894 | 57.473 | -0,0050 | 0,0647 | -0,0722 | 0,0051 | -14,11 | 0,0102 | 0,0249 | -0,0634 | -7,32 | -0,0550 | -0,2350 | kein Kandidat |
| 556 | W5 | 1m | long | 3h | ab1000 | 1.766 | -0,1070 | -18,30 | -7,02 | nein | 894 | 55.821 | -0,0327 | 0,0449 | -0,1037 | 0,0076 | -13,62 | 0,0152 | 0,0371 | -0,0876 | -5,43 | -0,0827 | -0,2627 | kein Kandidat |
| 557 | W2 | 1m | long | naechste | 50-250 | 1.766 | -0,0809 | -18,44 | -7,14 | nein | 893 | 218.713 | 0,0482 | 0,0854 | -0,0801 | 0,0057 | -14,14 | 0,0113 | 0,0276 | -0,0645 | -5,89 | -0,1118 | -0,3718 | kein Kandidat |
| 558 | W2 | 5m | long | 1h | 50-250 | 1.766 | -0,0943 | -18,50 | -7,80 | nein | 894 | 54.414 | 0,0023 | 0,0854 | -0,0844 | 0,0060 | -13,95 | 0,0121 | 0,0295 | -0,0671 | -6,48 | -0,0477 | -0,2277 | kein Kandidat |
| 559 | W6 | 15m | long | schluss | 250-1000 | 1.766 | -0,1108 | -18,80 | -8,15 | nein | 894 | 66.531 | -0,0396 | 0,0647 | -0,1048 | 0,0068 | -15,43 | 0,0136 | 0,0331 | -0,0902 | -6,08 | -0,1996 | -0,4596 | kein Kandidat |
| 560 | W2 | 5m | short | schluss | 50-250 | 1.766 | -0,1076 | -18,90 | -7,55 | nein | 894 | 60.907 | -0,0005 | 0,0854 | -0,0924 | 0,0071 | -12,97 | 0,0143 | 0,0347 | -0,0787 | -5,50 | -0,1605 | -0,4205 | kein Kandidat |
| 561 | W2 | 1m | short | naechste | 50-250 | 1.766 | -0,0738 | -18,91 | -6,77 | nein | 893 | 219.159 | -0,0318 | 0,0854 | -0,0740 | 0,0055 | -13,57 | 0,0109 | 0,0266 | -0,0651 | -5,58 | -0,1918 | -0,4518 | kein Kandidat |
| 562 | W5 | 5m | short | schluss | ab1000 | 1.766 | -0,1171 | -18,96 | -7,12 | nein | 894 | 46.730 | -0,0735 | 0,0449 | -0,1124 | 0,0082 | -13,66 | 0,0165 | 0,0401 | -0,0982 | -7,37 | -0,2335 | -0,4935 | kein Kandidat |
| 563 | W1b | 5m | short | schluss | 50-250 | 1.766 | -0,0952 | -19,25 | -7,45 | nein | 894 | 112.723 | 0,0126 | 0,0854 | -0,0794 | 0,0064 | -12,43 | 0,0128 | 0,0311 | -0,0684 | -5,81 | -0,1474 | -0,4074 | kein Kandidat |
| 564 | W1b | 5m | short | 1h | 50-250 | 1.766 | -0,0845 | -19,31 | -8,06 | nein | 894 | 101.510 | 0,0144 | 0,0854 | -0,0698 | 0,0052 | -13,31 | 0,0105 | 0,0255 | -0,0617 | -7,15 | -0,0356 | -0,2156 | kein Kandidat |
| 565 | W5 | 1m | short | 3h | ab1000 | 1.766 | -0,1069 | -19,33 | -7,51 | nein | 894 | 53.374 | -0,0809 | 0,0449 | -0,0997 | 0,0071 | -14,01 | 0,0142 | 0,0347 | -0,0955 | -6,48 | -0,1309 | -0,3109 | kein Kandidat |
| 566 | W2 | 15m | short | schluss | 5-50 | 1.765 | -0,2139 | -19,33 | -6,80 | nein | 893 | 30.968 | -0,0496 | 0,1569 | -0,2173 | 0,0157 | -13,82 | 0,0314 | 0,0766 | -0,2176 | -9,48 | -0,2096 | -0,4696 | kein Kandidat |
| 567 | W1b | 1m | short | 3h | 50-250 | 1.766 | -0,0674 | -19,40 | -8,56 | nein | 894 | 229.696 | 0,0107 | 0,0854 | -0,0648 | 0,0039 | -16,47 | 0,0079 | 0,0192 | -0,0586 | -6,78 | -0,0393 | -0,2193 | kein Kandidat |
| 568 | W1b | 15m | long | naechste | 5-50 | 1.766 | -0,2182 | -19,44 | -5,21 | nein | 893 | 58.550 | -0,0302 | 0,1569 | -0,2586 | 0,0210 | -12,34 | 0,0419 | 0,1021 | -0,2010 | -7,29 | -0,1902 | -0,4502 | kein Kandidat |
| 569 | W5 | 15m | short | naechste | 50-250 | 1.766 | -0,1019 | -19,48 | -6,64 | nein | 893 | 334.574 | -0,0732 | 0,0854 | -0,1164 | 0,0077 | -15,17 | 0,0153 | 0,0374 | -0,1020 | -6,79 | -0,2332 | -0,4932 | kein Kandidat |
| 570 | W6 | 1m | short | 3h | 250-1000 | 1.766 | -0,0494 | -19,55 | -6,99 | nein | 894 | 269.645 | -0,0083 | 0,0647 | -0,0578 | 0,0035 | -16,37 | 0,0071 | 0,0172 | -0,0575 | -9,47 | -0,0583 | -0,2383 | kein Kandidat |
| 571 | W1b | 1m | long | 1h | 250-1000 | 1.766 | -0,0529 | -19,58 | -7,97 | nein | 894 | 126.608 | 0,0095 | 0,0647 | -0,0578 | 0,0033 | -17,44 | 0,0066 | 0,0161 | -0,0675 | -10,95 | -0,0405 | -0,2205 | kein Kandidat |
| 572 | W1b | 1m | long | naechste | 50-250 | 1.766 | -0,0653 | -19,74 | -7,44 | nein | 893 | 388.327 | 0,0690 | 0,0854 | -0,0596 | 0,0044 | -13,58 | 0,0088 | 0,0214 | -0,0483 | -5,91 | -0,0910 | -0,3510 | kein Kandidat |
| 573 | W2 | 5m | short | 15m | 250-1000 | 1.764 | -0,0698 | -19,74 | -8,61 | nein | 894 | 17.139 | -0,0006 | 0,0647 | -0,0650 | 0,0041 | -16,02 | 0,0081 | 0,0198 | -0,0700 | -9,68 | -0,0506 | -0,2306 | kein Kandidat |
| 574 | W6 | 1m | short | naechste | 250-1000 | 1.766 | -0,0478 | -19,77 | -8,35 | nein | 893 | 461.520 | -0,0389 | 0,0647 | -0,0536 | 0,0029 | -18,73 | 0,0057 | 0,0140 | -0,0525 | -9,89 | -0,1989 | -0,4589 | kein Kandidat |
| 575 | W7 | 5m | short | 15m | 250-1000 | 1.766 | -0,0452 | -19,88 | -6,49 | nein | 894 | 230.699 | 0,0139 | 0,0647 | -0,0503 | 0,0035 | -14,43 | 0,0070 | 0,0170 | -0,0563 | -12,51 | -0,0361 | -0,2161 | kein Kandidat |
| 576 | W2 | 5m | long | schluss | 50-250 | 1.766 | -0,1178 | -19,97 | -7,25 | nein | 894 | 61.494 | -0,0294 | 0,0854 | -0,1084 | 0,0081 | -13,35 | 0,0162 | 0,0396 | -0,0879 | -6,72 | -0,1894 | -0,4494 | kein Kandidat |
| 577 | W1b | 1m | short | 1h | 250-1000 | 1.766 | -0,0536 | -20,08 | -8,84 | nein | 894 | 127.374 | 0,0041 | 0,0647 | -0,0579 | 0,0030 | -19,13 | 0,0061 | 0,0148 | -0,0575 | -9,45 | -0,0459 | -0,2259 | kein Kandidat |
| 578 | W1b | 1m | long | 3h | 50-250 | 1.766 | -0,0665 | -20,09 | -7,93 | nein | 894 | 227.990 | 0,0271 | 0,0854 | -0,0679 | 0,0042 | -16,20 | 0,0084 | 0,0204 | -0,0615 | -8,29 | -0,0229 | -0,2029 | kein Kandidat |
| 579 | W1a | 15m | long | naechste | 5-50 | 1.766 | -0,2127 | -20,27 | -5,20 | nein | 893 | 66.016 | -0,0262 | 0,1569 | -0,2538 | 0,0204 | -12,42 | 0,0409 | 0,0996 | -0,1889 | -7,29 | -0,1862 | -0,4462 | kein Kandidat |
| 580 | W6 | 5m | short | 15m | ab1000 | 1.766 | -0,0527 | -20,27 | -8,04 | nein | 894 | 36.781 | -0,0056 | 0,0449 | -0,0500 | 0,0033 | -15,26 | 0,0065 | 0,0160 | -0,0501 | -9,30 | -0,0556 | -0,2356 | kein Kandidat |
| 581 | W6 | 15m | short | 1h | 250-1000 | 1.765 | -0,0908 | -20,38 | -9,29 | nein | 894 | 56.952 | -0,0241 | 0,0647 | -0,0862 | 0,0049 | -17,62 | 0,0098 | 0,0238 | -0,0745 | -8,78 | -0,0741 | -0,2541 | kein Kandidat |
| 582 | W5 | 5m | long | schluss | ab1000 | 1.766 | -0,1331 | -20,40 | -7,95 | nein | 894 | 49.114 | -0,0706 | 0,0449 | -0,1212 | 0,0084 | -14,48 | 0,0167 | 0,0408 | -0,1233 | -7,88 | -0,2306 | -0,4906 | kein Kandidat |
| 583 | W1a | 5m | short | 1h | 50-250 | 1.766 | -0,0850 | -20,41 | -8,36 | nein | 894 | 111.659 | 0,0122 | 0,0854 | -0,0720 | 0,0051 | -14,15 | 0,0102 | 0,0248 | -0,0650 | -7,83 | -0,0378 | -0,2178 | kein Kandidat |
| 584 | W5 | 15m | long | naechste | 50-250 | 1.766 | -0,1140 | -20,47 | -6,49 | nein | 893 | 344.356 | 0,0040 | 0,0854 | -0,1238 | 0,0088 | -14,12 | 0,0175 | 0,0427 | -0,1273 | -8,43 | -0,1560 | -0,4160 | kein Kandidat |
| 585 | W2 | 15m | long | schluss | 5-50 | 1.763 | -0,2543 | -20,51 | -9,31 | nein | 893 | 31.550 | -0,0638 | 0,1569 | -0,2154 | 0,0137 | -15,78 | 0,0273 | 0,0665 | -0,1732 | -6,34 | -0,2238 | -0,4838 | kein Kandidat |
| 586 | W1b | 5m | long | 1h | 50-250 | 1.766 | -0,0922 | -20,58 | -9,11 | nein | 894 | 99.898 | 0,0069 | 0,0854 | -0,0797 | 0,0051 | -15,76 | 0,0101 | 0,0246 | -0,0628 | -6,62 | -0,0431 | -0,2231 | kein Kandidat |
| 587 | W6 | 1m | long | 3h | 250-1000 | 1.766 | -0,0515 | -20,64 | -8,41 | nein | 894 | 270.639 | 0,0237 | 0,0647 | -0,0561 | 0,0031 | -18,29 | 0,0061 | 0,0149 | -0,0574 | -9,64 | -0,0263 | -0,2063 | kein Kandidat |
| 588 | W1a | 5m | short | schluss | 50-250 | 1.766 | -0,0976 | -20,68 | -7,78 | nein | 894 | 123.984 | 0,0104 | 0,0854 | -0,0816 | 0,0063 | -13,00 | 0,0126 | 0,0306 | -0,0724 | -6,43 | -0,1496 | -0,4096 | kein Kandidat |
| 589 | W1a | 1m | short | 1h | 250-1000 | 1.766 | -0,0537 | -20,89 | -9,40 | nein | 894 | 137.729 | 0,0033 | 0,0647 | -0,0587 | 0,0029 | -20,55 | 0,0057 | 0,0139 | -0,0597 | -10,42 | -0,0467 | -0,2267 | kein Kandidat |
| 590 | W6 | 1m | long | naechste | 250-1000 | 1.766 | -0,0496 | -21,15 | -7,20 | nein | 893 | 460.660 | 0,0650 | 0,0647 | -0,0495 | 0,0034 | -14,37 | 0,0069 | 0,0168 | -0,0558 | -9,69 | -0,0950 | -0,3550 | kein Kandidat |
| 591 | W6 | 15m | short | schluss | 250-1000 | 1.766 | -0,1252 | -21,21 | -7,74 | nein | 894 | 65.919 | -0,0440 | 0,0647 | -0,1085 | 0,0081 | -13,42 | 0,0162 | 0,0394 | -0,0821 | -6,51 | -0,2040 | -0,4640 | kein Kandidat |
| 592 | W1a | 1m | long | 1h | 250-1000 | 1.766 | -0,0545 | -21,21 | -8,73 | nein | 894 | 137.168 | 0,0088 | 0,0647 | -0,0585 | 0,0031 | -18,75 | 0,0062 | 0,0152 | -0,0658 | -11,46 | -0,0412 | -0,2212 | kein Kandidat |
| 593 | W6 | 15m | long | naechste | 50-250 | 1.766 | -0,1403 | -21,28 | -7,55 | nein | 893 | 223.573 | 0,0108 | 0,0854 | -0,1171 | 0,0093 | -12,60 | 0,0186 | 0,0453 | -0,1020 | -5,07 | -0,1492 | -0,4092 | kein Kandidat |
| 594 | W1a | 1m | short | 3h | 50-250 | 1.766 | -0,0694 | -21,28 | -9,20 | nein | 894 | 254.964 | 0,0086 | 0,0854 | -0,0669 | 0,0038 | -17,75 | 0,0075 | 0,0184 | -0,0597 | -7,05 | -0,0414 | -0,2214 | kein Kandidat |
| 595 | W6 | 5m | short | schluss | 250-1000 | 1.766 | -0,0668 | -21,31 | -8,99 | nein | 894 | 196.752 | -0,0003 | 0,0647 | -0,0653 | 0,0037 | -17,56 | 0,0074 | 0,0181 | -0,0538 | -6,74 | -0,1603 | -0,4203 | kein Kandidat |
| 596 | W5 | 15m | long | schluss | 250-1000 | 1.766 | -0,1097 | -21,40 | -8,04 | nein | 894 | 108.214 | -0,0327 | 0,0647 | -0,0986 | 0,0068 | -14,44 | 0,0137 | 0,0333 | -0,0891 | -8,07 | -0,1927 | -0,4527 | kein Kandidat |
| 597 | W6 | 5m | long | naechste | 50-250 | 1.766 | -0,0786 | -21,44 | -7,77 | nein | 893 | 647.056 | 0,0450 | 0,0854 | -0,0817 | 0,0051 | -16,17 | 0,0101 | 0,0246 | -0,0874 | -9,34 | -0,1150 | -0,3750 | kein Kandidat |
| 598 | W6 | 5m | long | 3h | 50-250 | 1.766 | -0,0888 | -21,45 | -9,26 | nein | 894 | 305.819 | -0,0011 | 0,0854 | -0,0950 | 0,0048 | -19,81 | 0,0096 | 0,0234 | -0,0981 | -11,39 | -0,0511 | -0,2311 | kein Kandidat |
| 599 | W1b | 5m | long | 15m | 250-1000 | 1.766 | -0,0641 | -21,61 | -10,43 | nein | 894 | 34.154 | 0,0021 | 0,0647 | -0,0628 | 0,0031 | -20,45 | 0,0061 | 0,0150 | -0,0647 | -11,45 | -0,0479 | -0,2279 | kein Kandidat |
| 600 | W1a | 5m | long | 1h | 50-250 | 1.766 | -0,0934 | -21,66 | -9,55 | nein | 894 | 110.164 | 0,0050 | 0,0854 | -0,0816 | 0,0049 | -16,68 | 0,0098 | 0,0238 | -0,0634 | -7,09 | -0,0450 | -0,2250 | kein Kandidat |
| 601 | W1b | 1m | short | naechste | 50-250 | 1.766 | -0,0641 | -21,69 | -8,43 | nein | 893 | 392.215 | -0,0190 | 0,0854 | -0,0612 | 0,0038 | -16,10 | 0,0076 | 0,0185 | -0,0550 | -7,17 | -0,1790 | -0,4390 | kein Kandidat |
| 602 | W7 | 1m | long | schluss | 5-50 | 1.766 | -0,0893 | -21,74 | -8,28 | nein | 894 | 1.268.655 | 0,0629 | 0,1569 | -0,0865 | 0,0054 | -16,04 | 0,0108 | 0,0263 | -0,1046 | -12,01 | -0,0971 | -0,3571 | kein Kandidat |
| 603 | W1a | 1m | long | naechste | 50-250 | 1.766 | -0,0687 | -21,78 | -8,60 | nein | 893 | 434.820 | 0,0645 | 0,0854 | -0,0639 | 0,0040 | -16,02 | 0,0080 | 0,0194 | -0,0539 | -7,31 | -0,0955 | -0,3555 | kein Kandidat |
| 604 | W5 | 5m | long | naechste | 250-1000 | 1.766 | -0,1159 | -21,89 | -7,61 | nein | 893 | 249.017 | -0,0050 | 0,0647 | -0,1190 | 0,0076 | -15,63 | 0,0152 | 0,0371 | -0,1206 | -9,62 | -0,1650 | -0,4250 | kein Kandidat |
| 605 | W1b | 5m | long | schluss | 50-250 | 1.766 | -0,1074 | -22,00 | -7,65 | nein | 894 | 112.515 | -0,0177 | 0,0854 | -0,0966 | 0,0070 | -13,75 | 0,0140 | 0,0342 | -0,0788 | -7,47 | -0,1777 | -0,4377 | kein Kandidat |
| 606 | W2 | 1m | short | schluss | 50-250 | 1.766 | -0,0720 | -22,44 | -9,01 | nein | 894 | 219.398 | 0,0158 | 0,0854 | -0,0757 | 0,0040 | -18,94 | 0,0080 | 0,0195 | -0,0674 | -8,99 | -0,1442 | -0,4042 | kein Kandidat |
| 607 | W1a | 1m | long | 3h | 50-250 | 1.766 | -0,0697 | -22,52 | -8,80 | nein | 894 | 253.485 | 0,0245 | 0,0854 | -0,0705 | 0,0040 | -17,80 | 0,0079 | 0,0193 | -0,0649 | -9,18 | -0,0255 | -0,2055 | kein Kandidat |
| 608 | W6 | 5m | short | 1h | 250-1000 | 1.766 | -0,0689 | -22,58 | -10,16 | nein | 894 | 169.162 | -0,0030 | 0,0647 | -0,0653 | 0,0034 | -19,26 | 0,0068 | 0,0165 | -0,0610 | -9,43 | -0,0530 | -0,2330 | kein Kandidat |
| 609 | W6 | 15m | long | 3h | 50-250 | 1.753 | -0,1349 | -22,59 | -9,31 | nein | 886 | 104.009 | -0,0272 | 0,0854 | -0,1185 | 0,0072 | -16,35 | 0,0145 | 0,0353 | -0,1163 | -8,58 | -0,0772 | -0,2572 | kein Kandidat |
| 610 | W5 | 5m | long | 15m | ab1000 | 1.766 | -0,0547 | -22,64 | -8,66 | nein | 894 | 49.114 | -0,0099 | 0,0449 | -0,0554 | 0,0032 | -17,54 | 0,0063 | 0,0154 | -0,0493 | -10,31 | -0,0599 | -0,2399 | kein Kandidat |
| 611 | W5 | 5m | short | naechste | 250-1000 | 1.766 | -0,1143 | -22,73 | -8,12 | nein | 893 | 238.225 | -0,0997 | 0,0647 | -0,1161 | 0,0070 | -16,50 | 0,0141 | 0,0343 | -0,1180 | -9,33 | -0,2597 | -0,5197 | kein Kandidat |
| 612 | W1a | 5m | long | 15m | 250-1000 | 1.766 | -0,0647 | -22,75 | -10,87 | nein | 894 | 36.662 | 0,0010 | 0,0647 | -0,0639 | 0,0030 | -21,45 | 0,0060 | 0,0145 | -0,0635 | -11,45 | -0,0490 | -0,2290 | kein Kandidat |
| 613 | W2 | 1m | long | schluss | 50-250 | 1.766 | -0,0782 | -22,79 | -9,82 | nein | 894 | 218.963 | 0,0005 | 0,0854 | -0,0787 | 0,0040 | -19,76 | 0,0080 | 0,0194 | -0,0761 | -9,67 | -0,1595 | -0,4195 | kein Kandidat |
| 614 | W5 | 1m | long | 1h | ab1000 | 1.766 | -0,0685 | -23,13 | -9,12 | nein | 894 | 86.451 | -0,0181 | 0,0449 | -0,0673 | 0,0038 | -17,91 | 0,0075 | 0,0183 | -0,0573 | -8,09 | -0,0681 | -0,2481 | kein Kandidat |
| 615 | W5 | 5m | short | 15m | ab1000 | 1.766 | -0,0544 | -23,16 | -9,81 | nein | 894 | 46.730 | -0,0074 | 0,0449 | -0,0517 | 0,0028 | -18,64 | 0,0056 | 0,0135 | -0,0520 | -9,28 | -0,0574 | -0,2374 | kein Kandidat |
| 616 | W7 | 1m | short | schluss | 5-50 | 1.766 | -0,0921 | -23,27 | -9,38 | nein | 894 | 1.261.014 | 0,0668 | 0,1569 | -0,0966 | 0,0049 | -19,67 | 0,0098 | 0,0239 | -0,1155 | -14,97 | -0,0932 | -0,3532 | kein Kandidat |
| 617 | W1a | 5m | long | schluss | 50-250 | 1.766 | -0,1094 | -23,32 | -8,06 | nein | 894 | 124.000 | -0,0199 | 0,0854 | -0,0989 | 0,0068 | -14,58 | 0,0136 | 0,0331 | -0,0772 | -7,73 | -0,1799 | -0,4399 | kein Kandidat |
| 618 | W5 | 15m | short | 1h | 50-250 | 1.766 | -0,0857 | -23,38 | -10,00 | nein | 894 | 282.473 | 0,0030 | 0,0854 | -0,0809 | 0,0043 | -18,89 | 0,0086 | 0,0209 | -0,0695 | -9,49 | -0,0470 | -0,2270 | kein Kandidat |
| 619 | W2 | 15m | short | 15m | 50-250 | 1.747 | -0,0935 | -23,39 | -9,87 | nein | 886 | 15.659 | -0,0009 | 0,0854 | -0,0872 | 0,0047 | -18,40 | 0,0095 | 0,0231 | -0,0940 | -11,63 | -0,0509 | -0,2309 | kein Kandidat |
| 620 | W6 | 15m | short | 3h | 50-250 | 1.752 | -0,1354 | -23,57 | -9,18 | nein | 886 | 106.087 | -0,0435 | 0,0854 | -0,1234 | 0,0074 | -16,73 | 0,0148 | 0,0359 | -0,0971 | -7,13 | -0,0935 | -0,2735 | kein Kandidat |
| 621 | W1a | 1m | short | naechste | 50-250 | 1.766 | -0,0666 | -23,73 | -9,29 | nein | 893 | 437.922 | -0,0201 | 0,0854 | -0,0622 | 0,0036 | -17,38 | 0,0072 | 0,0174 | -0,0540 | -7,34 | -0,1801 | -0,4401 | kein Kandidat |
| 622 | W5 | 1m | short | 1h | ab1000 | 1.766 | -0,0710 | -23,93 | -8,94 | nein | 894 | 82.770 | -0,0211 | 0,0449 | -0,0617 | 0,0040 | -15,54 | 0,0079 | 0,0193 | -0,0568 | -7,15 | -0,0711 | -0,2511 | kein Kandidat |
| 623 | W1b | 5m | short | 15m | 250-1000 | 1.766 | -0,0670 | -24,03 | -11,06 | nein | 894 | 34.031 | 0,0040 | 0,0647 | -0,0604 | 0,0030 | -19,92 | 0,0061 | 0,0148 | -0,0648 | -10,92 | -0,0460 | -0,2260 | kein Kandidat |
| 624 | W7 | 1m | long | 1h | 50-250 | 1.766 | -0,0646 | -24,18 | -9,00 | nein | 894 | 1.101.585 | 0,0184 | 0,0854 | -0,0684 | 0,0036 | -19,06 | 0,0072 | 0,0175 | -0,0694 | -10,24 | -0,0316 | -0,2116 | kein Kandidat |
| 625 | W2 | 1m | long | 3h | 5-50 | 1.753 | -0,1557 | -24,23 | -9,63 | nein | 886 | 128.232 | -0,0035 | 0,1569 | -0,1655 | 0,0081 | -20,46 | 0,0162 | 0,0394 | -0,1610 | -11,28 | -0,0535 | -0,2335 | kein Kandidat |
| 626 | W1b | 1m | long | schluss | 50-250 | 1.766 | -0,0620 | -24,31 | -10,36 | nein | 894 | 388.787 | 0,0170 | 0,0854 | -0,0621 | 0,0030 | -20,75 | 0,0060 | 0,0146 | -0,0615 | -11,32 | -0,1430 | -0,4030 | kein Kandidat |
| 627 | W1a | 5m | short | 15m | 250-1000 | 1.766 | -0,0682 | -24,89 | -11,74 | nein | 894 | 36.529 | 0,0042 | 0,0647 | -0,0601 | 0,0029 | -20,72 | 0,0058 | 0,0141 | -0,0638 | -11,02 | -0,0458 | -0,2258 | kein Kandidat |
| 628 | W2 | 1m | long | 1h | 50-250 | 1.766 | -0,0779 | -24,95 | -11,88 | nein | 894 | 195.610 | 0,0024 | 0,0854 | -0,0845 | 0,0033 | -25,75 | 0,0066 | 0,0160 | -0,0907 | -14,47 | -0,0476 | -0,2276 | kein Kandidat |
| 629 | W1b | 15m | long | schluss | 5-50 | 1.766 | -0,2226 | -24,96 | -9,42 | nein | 894 | 58.593 | -0,0684 | 0,1569 | -0,2165 | 0,0118 | -18,33 | 0,0236 | 0,0575 | -0,1847 | -9,03 | -0,2284 | -0,4884 | kein Kandidat |
| 630 | W6 | 15m | short | naechste | 50-250 | 1.766 | -0,1546 | -25,13 | -9,30 | nein | 893 | 223.550 | -0,0822 | 0,0854 | -0,1256 | 0,0083 | -15,11 | 0,0166 | 0,0405 | -0,0736 | -5,05 | -0,2422 | -0,5022 | kein Kandidat |
| 631 | W1b | 1m | short | schluss | 50-250 | 1.766 | -0,0640 | -25,28 | -9,75 | nein | 894 | 392.636 | 0,0294 | 0,0854 | -0,0619 | 0,0033 | -18,86 | 0,0066 | 0,0160 | -0,0619 | -11,59 | -0,1306 | -0,3906 | kein Kandidat |
| 632 | W2 | 1m | short | 3h | 5-50 | 1.753 | -0,1505 | -25,34 | -8,55 | nein | 886 | 129.255 | -0,0113 | 0,1569 | -0,1631 | 0,0088 | -18,54 | 0,0176 | 0,0429 | -0,1483 | -9,77 | -0,0613 | -0,2413 | kein Kandidat |
| 633 | W5 | 15m | long | 1h | 50-250 | 1.766 | -0,0930 | -25,42 | -10,73 | nein | 894 | 288.827 | 0,0026 | 0,0854 | -0,0845 | 0,0043 | -19,50 | 0,0087 | 0,0211 | -0,0816 | -11,69 | -0,0474 | -0,2274 | kein Kandidat |
| 634 | W6 | 5m | short | naechste | 50-250 | 1.766 | -0,0868 | -25,52 | -10,47 | nein | 893 | 648.210 | -0,0403 | 0,0854 | -0,0844 | 0,0041 | -20,36 | 0,0083 | 0,0202 | -0,0708 | -9,69 | -0,2003 | -0,4603 | kein Kandidat |
| 635 | W4 | 1m | long | 15m | 50-250 | 1.766 | -0,0666 | -25,55 | -9,42 | nein | 894 | 37.157 | 0,0137 | 0,0854 | -0,0720 | 0,0035 | -20,38 | 0,0071 | 0,0172 | -0,0741 | -10,22 | -0,0363 | -0,2163 | kein Kandidat |
| 636 | W2 | 15m | long | 1h | 5-50 | 1.762 | -0,2036 | -25,58 | -10,15 | nein | 892 | 28.492 | -0,0273 | 0,1569 | -0,1855 | 0,0100 | -18,50 | 0,0201 | 0,0489 | -0,1857 | -9,10 | -0,0773 | -0,2573 | kein Kandidat |
| 637 | W1b | 15m | short | schluss | 5-50 | 1.766 | -0,2168 | -25,78 | -9,33 | nein | 893 | 58.215 | -0,0195 | 0,1569 | -0,1876 | 0,0116 | -16,15 | 0,0232 | 0,0566 | -0,1830 | -9,64 | -0,1795 | -0,4395 | kein Kandidat |
| 638 | W1a | 15m | long | 15m | 50-250 | 1.762 | -0,0961 | -25,85 | -12,98 | nein | 894 | 34.660 | -0,0115 | 0,0854 | -0,0970 | 0,0037 | -26,22 | 0,0074 | 0,0180 | -0,1045 | -16,51 | -0,0615 | -0,2415 | kein Kandidat |
| 639 | W6 | 5m | long | schluss | 50-250 | 1.766 | -0,0770 | -25,92 | -9,91 | nein | 894 | 647.939 | -0,0000 | 0,0854 | -0,0790 | 0,0039 | -20,33 | 0,0078 | 0,0189 | -0,0836 | -13,84 | -0,1600 | -0,4200 | kein Kandidat |
| 640 | W6 | 5m | short | 3h | 50-250 | 1.766 | -0,1063 | -25,95 | -10,54 | nein | 894 | 307.667 | -0,0243 | 0,0854 | -0,1014 | 0,0050 | -20,11 | 0,0101 | 0,0246 | -0,0869 | -8,60 | -0,0743 | -0,2543 | kein Kandidat |
| 641 | W2 | 5m | long | 3h | 5-50 | 1.765 | -0,2108 | -26,03 | -11,07 | nein | 894 | 59.442 | -0,0292 | 0,1569 | -0,1899 | 0,0095 | -19,94 | 0,0190 | 0,0464 | -0,1830 | -9,95 | -0,0792 | -0,2592 | kein Kandidat |
| 642 | W2 | 5m | short | 3h | 5-50 | 1.766 | -0,2023 | -26,12 | -8,66 | nein | 894 | 60.585 | -0,0526 | 0,1569 | -0,2062 | 0,0117 | -17,65 | 0,0234 | 0,0569 | -0,1800 | -10,93 | -0,1026 | -0,2826 | kein Kandidat |
| 643 | W7 | 15m | long | 15m | 50-250 | 1.766 | -0,0695 | -26,17 | -8,85 | nein | 894 | 386.251 | 0,0264 | 0,0854 | -0,0590 | 0,0039 | -15,04 | 0,0079 | 0,0191 | -0,0611 | -11,31 | -0,0236 | -0,2036 | kein Kandidat |
| 644 | W7 | 1m | short | 1h | 50-250 | 1.766 | -0,0642 | -26,22 | -10,55 | nein | 894 | 1.136.330 | 0,0089 | 0,0854 | -0,0748 | 0,0030 | -24,57 | 0,0061 | 0,0148 | -0,0801 | -13,90 | -0,0411 | -0,2211 | kein Kandidat |
| 645 | W6 | 1m | short | 15m | ab1000 | 1.766 | -0,0434 | -26,23 | -9,70 | nein | 894 | 92.014 | 0,0011 | 0,0449 | -0,0429 | 0,0022 | -19,16 | 0,0045 | 0,0109 | -0,0471 | -12,06 | -0,0489 | -0,2289 | kein Kandidat |
| 646 | W1a | 15m | long | schluss | 5-50 | 1.766 | -0,2229 | -26,41 | -9,58 | nein | 894 | 66.078 | -0,0722 | 0,1569 | -0,2201 | 0,0116 | -18,92 | 0,0233 | 0,0567 | -0,1815 | -9,41 | -0,2322 | -0,4922 | kein Kandidat |
| 647 | W1b | 15m | long | 15m | 50-250 | 1.762 | -0,0983 | -26,47 | -12,65 | nein | 893 | 31.443 | -0,0123 | 0,0854 | -0,0978 | 0,0039 | -25,16 | 0,0078 | 0,0189 | -0,1040 | -16,22 | -0,0623 | -0,2423 | kein Kandidat |
| 648 | W5 | 5m | long | 3h | 50-250 | 1.766 | -0,1139 | -26,47 | -11,66 | nein | 894 | 445.831 | -0,0096 | 0,0854 | -0,1037 | 0,0049 | -21,24 | 0,0098 | 0,0238 | -0,1023 | -13,30 | -0,0596 | -0,2396 | kein Kandidat |
| 649 | W5 | 1m | long | schluss | ab1000 | 1.766 | -0,1050 | -26,51 | -10,86 | nein | 894 | 93.179 | -0,0502 | 0,0449 | -0,1014 | 0,0048 | -20,99 | 0,0097 | 0,0235 | -0,0800 | -9,22 | -0,2102 | -0,4702 | kein Kandidat |
| 650 | W7 | 15m | short | 15m | 50-250 | 1.766 | -0,0659 | -26,89 | -14,92 | nein | 894 | 427.446 | 0,0166 | 0,0854 | -0,0686 | 0,0022 | -31,05 | 0,0044 | 0,0108 | -0,0710 | -18,47 | -0,0334 | -0,2134 | kein Kandidat |
| 651 | W1b | 15m | short | 15m | 50-250 | 1.761 | -0,0934 | -26,93 | -13,82 | nein | 892 | 31.669 | -0,0009 | 0,0854 | -0,0869 | 0,0034 | -25,70 | 0,0068 | 0,0165 | -0,0860 | -14,50 | -0,0509 | -0,2309 | kein Kandidat |
| 652 | W7 | 5m | long | 15m | 50-250 | 1.766 | -0,0657 | -26,95 | -12,30 | nein | 894 | 692.358 | 0,0220 | 0,0854 | -0,0634 | 0,0027 | -23,77 | 0,0053 | 0,0130 | -0,0647 | -13,07 | -0,0280 | -0,2080 | kein Kandidat |
| 653 | W5 | 1m | short | 15m | ab1000 | 1.766 | -0,0515 | -27,15 | -10,94 | nein | 894 | 89.574 | -0,0072 | 0,0449 | -0,0512 | 0,0024 | -21,76 | 0,0047 | 0,0115 | -0,0525 | -11,41 | -0,0572 | -0,2372 | kein Kandidat |
| 654 | W5 | 5m | short | 3h | 50-250 | 1.766 | -0,1073 | -27,42 | -12,28 | nein | 894 | 424.895 | -0,0267 | 0,0854 | -0,1040 | 0,0044 | -23,80 | 0,0087 | 0,0213 | -0,1032 | -12,15 | -0,0767 | -0,2567 | kein Kandidat |
| 655 | W1a | 15m | short | schluss | 5-50 | 1.766 | -0,2150 | -27,43 | -11,93 | nein | 894 | 65.955 | -0,0299 | 0,1569 | -0,1974 | 0,0090 | -21,91 | 0,0180 | 0,0439 | -0,1925 | -11,45 | -0,1899 | -0,4499 | kein Kandidat |
| 656 | W1b | 5m | short | 3h | 5-50 | 1.766 | -0,1812 | -27,43 | -9,83 | nein | 894 | 102.746 | -0,0399 | 0,1569 | -0,1935 | 0,0092 | -21,01 | 0,0184 | 0,0449 | -0,1652 | -11,11 | -0,0899 | -0,2699 | kein Kandidat |
| 657 | W5 | 1m | short | schluss | ab1000 | 1.766 | -0,1076 | -27,53 | -10,34 | nein | 894 | 89.574 | -0,0665 | 0,0449 | -0,1051 | 0,0052 | -20,21 | 0,0104 | 0,0253 | -0,0862 | -9,97 | -0,2265 | -0,4865 | kein Kandidat |
| 658 | W1a | 1m | short | schluss | 50-250 | 1.766 | -0,0662 | -27,56 | -10,77 | nein | 894 | 438.419 | 0,0268 | 0,0854 | -0,0645 | 0,0031 | -21,00 | 0,0061 | 0,0150 | -0,0630 | -12,43 | -0,1332 | -0,3932 | kein Kandidat |
| 659 | W1b | 5m | long | 3h | 5-50 | 1.766 | -0,1980 | -27,81 | -12,21 | nein | 894 | 102.033 | -0,0205 | 0,1569 | -0,1810 | 0,0081 | -22,33 | 0,0162 | 0,0395 | -0,1755 | -12,53 | -0,0705 | -0,2505 | kein Kandidat |
| 660 | W5 | 15m | short | schluss | 50-250 | 1.766 | -0,1084 | -27,92 | -10,19 | nein | 894 | 335.259 | -0,0192 | 0,0854 | -0,1101 | 0,0053 | -20,70 | 0,0106 | 0,0259 | -0,0890 | -10,54 | -0,1792 | -0,4392 | kein Kandidat |
| 661 | W6 | 5m | long | 1h | 50-250 | 1.766 | -0,0796 | -27,98 | -13,60 | nein | 894 | 563.325 | -0,0008 | 0,0854 | -0,0874 | 0,0029 | -29,86 | 0,0059 | 0,0143 | -0,0863 | -15,21 | -0,0508 | -0,2308 | kein Kandidat |
| 662 | W2 | 15m | short | 1h | 5-50 | 1.762 | -0,2078 | -28,13 | -12,27 | nein | 893 | 28.124 | -0,0247 | 0,1569 | -0,1827 | 0,0085 | -21,59 | 0,0169 | 0,0412 | -0,1697 | -11,20 | -0,0747 | -0,2547 | kein Kandidat |
| 663 | W5 | 1m | long | 15m | ab1000 | 1.766 | -0,0492 | -28,18 | -11,85 | nein | 894 | 93.179 | -0,0050 | 0,0449 | -0,0507 | 0,0021 | -24,44 | 0,0042 | 0,0101 | -0,0514 | -14,28 | -0,0550 | -0,2350 | kein Kandidat |
| 664 | W6 | 1m | short | schluss | 250-1000 | 1.766 | -0,0483 | -28,21 | -11,66 | nein | 894 | 462.192 | 0,0100 | 0,0647 | -0,0542 | 0,0021 | -26,21 | 0,0041 | 0,0101 | -0,0572 | -13,77 | -0,1500 | -0,4100 | kein Kandidat |
| 665 | W1b | 15m | long | 1h | 5-50 | 1.766 | -0,1864 | -28,22 | -11,29 | nein | 894 | 53.069 | -0,0286 | 0,1569 | -0,1854 | 0,0083 | -22,46 | 0,0165 | 0,0402 | -0,1967 | -13,18 | -0,0786 | -0,2586 | kein Kandidat |
| 666 | W1a | 1m | long | schluss | 50-250 | 1.766 | -0,0669 | -28,27 | -12,17 | nein | 894 | 435.356 | 0,0129 | 0,0854 | -0,0662 | 0,0028 | -24,08 | 0,0055 | 0,0134 | -0,0658 | -13,56 | -0,1471 | -0,4071 | kein Kandidat |
| 667 | W4 | 1m | short | 15m | 50-250 | 1.766 | -0,0725 | -28,35 | -7,49 | nein | 894 | 38.301 | 0,0106 | 0,0854 | -0,0743 | 0,0048 | -15,33 | 0,0097 | 0,0236 | -0,0802 | -10,96 | -0,0394 | -0,2194 | kein Kandidat |
| 668 | W6 | 1m | long | 15m | ab1000 | 1.766 | -0,0459 | -28,41 | -11,70 | nein | 894 | 92.051 | 0,0039 | 0,0449 | -0,0418 | 0,0020 | -21,31 | 0,0039 | 0,0096 | -0,0405 | -10,48 | -0,0461 | -0,2261 | kein Kandidat |
| 669 | W2 | 1m | long | naechste | 5-50 | 1.766 | -0,1455 | -28,42 | -1,95 | nein | 893 | 263.714 | 0,1111 | 0,1569 | -0,1623 | 0,0374 | -4,34 | 0,0748 | 0,1822 | -0,1513 | -11,82 | -0,0489 | -0,3089 | kein Kandidat |
| 670 | W5 | 15m | long | 3h | 5-50 | 1.765 | -0,1829 | -28,59 | -12,73 | nein | 894 | 281.468 | -0,0118 | 0,1569 | -0,1716 | 0,0072 | -23,89 | 0,0144 | 0,0350 | -0,1624 | -9,94 | -0,0618 | -0,2418 | kein Kandidat |
| 671 | W2 | 1m | short | 1h | 50-250 | 1.766 | -0,0787 | -28,66 | -10,52 | nein | 894 | 194.891 | 0,0034 | 0,0854 | -0,0805 | 0,0037 | -21,51 | 0,0075 | 0,0182 | -0,0748 | -13,65 | -0,0466 | -0,2266 | kein Kandidat |
| 672 | W5 | 1m | long | 3h | 250-1000 | 1.766 | -0,1057 | -29,10 | -11,41 | nein | 894 | 274.304 | -0,0155 | 0,0647 | -0,0960 | 0,0046 | -20,71 | 0,0093 | 0,0226 | -0,0937 | -9,76 | -0,0655 | -0,2455 | kein Kandidat |
| 673 | W5 | 1m | short | 3h | 250-1000 | 1.766 | -0,1023 | -29,31 | -12,44 | nein | 894 | 265.588 | -0,0476 | 0,0647 | -0,0976 | 0,0041 | -23,74 | 0,0082 | 0,0200 | -0,0968 | -11,55 | -0,0976 | -0,2776 | kein Kandidat |
| 674 | W2 | 5m | short | naechste | 5-50 | 1.766 | -0,1957 | -29,34 | -5,49 | nein | 893 | 112.801 | -0,0799 | 0,1569 | -0,1628 | 0,0178 | -9,13 | 0,0357 | 0,0869 | -0,1763 | -8,05 | -0,2399 | -0,4999 | kein Kandidat |
| 675 | W5 | 15m | long | schluss | 50-250 | 1.766 | -0,1233 | -29,70 | -11,30 | nein | 894 | 344.702 | -0,0367 | 0,0854 | -0,1170 | 0,0055 | -21,44 | 0,0109 | 0,0266 | -0,1068 | -13,01 | -0,1967 | -0,4567 | kein Kandidat |
| 676 | W1a | 15m | short | 15m | 50-250 | 1.762 | -0,0933 | -29,70 | -14,15 | nein | 892 | 34.774 | -0,0014 | 0,0854 | -0,0874 | 0,0033 | -26,53 | 0,0066 | 0,0160 | -0,0881 | -14,81 | -0,0514 | -0,2314 | kein Kandidat |
| 677 | W1a | 5m | short | 3h | 5-50 | 1.766 | -0,1861 | -29,79 | -10,81 | nein | 894 | 118.437 | -0,0422 | 0,1569 | -0,1958 | 0,0086 | -22,76 | 0,0172 | 0,0419 | -0,1681 | -11,87 | -0,0922 | -0,2722 | kein Kandidat |
| 678 | W6 | 15m | long | 1h | 50-250 | 1.766 | -0,1067 | -29,92 | -10,83 | nein | 894 | 192.357 | -0,0052 | 0,0854 | -0,0922 | 0,0049 | -18,72 | 0,0099 | 0,0240 | -0,0928 | -13,41 | -0,0552 | -0,2352 | kein Kandidat |
| 679 | W1a | 5m | long | 3h | 5-50 | 1.766 | -0,1997 | -30,00 | -13,14 | nein | 894 | 117.694 | -0,0245 | 0,1569 | -0,1850 | 0,0076 | -24,35 | 0,0152 | 0,0370 | -0,1833 | -13,80 | -0,0745 | -0,2545 | kein Kandidat |
| 680 | W5 | 5m | short | 1h | 250-1000 | 1.766 | -0,0855 | -30,10 | -12,40 | nein | 894 | 214.696 | -0,0179 | 0,0647 | -0,0805 | 0,0034 | -23,35 | 0,0069 | 0,0168 | -0,0784 | -14,82 | -0,0679 | -0,2479 | kein Kandidat |
| 681 | W1a | 15m | long | 1h | 5-50 | 1.766 | -0,1878 | -30,27 | -11,87 | nein | 894 | 60.136 | -0,0308 | 0,1569 | -0,1875 | 0,0079 | -23,70 | 0,0158 | 0,0385 | -0,1926 | -13,58 | -0,0808 | -0,2608 | kein Kandidat |
| 682 | W4 | 5m | short | 15m | 5-50 | 1.766 | -0,1413 | -30,28 | -9,12 | nein | 894 | 16.994 | 0,0074 | 0,1569 | -0,1496 | 0,0077 | -19,32 | 0,0155 | 0,0377 | -0,1434 | -12,41 | -0,0426 | -0,2226 | kein Kandidat |
| 683 | W4 | 5m | long | 15m | 5-50 | 1.766 | -0,1219 | -30,37 | -5,90 | nein | 893 | 16.405 | 0,0228 | 0,1569 | -0,1338 | 0,0103 | -12,95 | 0,0207 | 0,0504 | -0,1428 | -13,86 | -0,0272 | -0,2072 | kein Kandidat |
| 684 | W2 | 5m | long | naechste | 5-50 | 1.766 | -0,1935 | -30,41 | -5,97 | nein | 893 | 113.322 | 0,0180 | 0,1569 | -0,2143 | 0,0162 | -13,21 | 0,0324 | 0,0790 | -0,1749 | -9,08 | -0,1420 | -0,4020 | kein Kandidat |
| 685 | W6 | 1m | long | schluss | 250-1000 | 1.766 | -0,0501 | -30,49 | -10,01 | nein | 894 | 461.334 | 0,0147 | 0,0647 | -0,0503 | 0,0025 | -20,10 | 0,0050 | 0,0122 | -0,0574 | -14,66 | -0,1453 | -0,4053 | kein Kandidat |
| 686 | W6 | 15m | short | 1h | 50-250 | 1.766 | -0,1088 | -31,12 | -13,75 | nein | 894 | 192.980 | -0,0177 | 0,0854 | -0,1015 | 0,0040 | -25,65 | 0,0079 | 0,0193 | -0,0896 | -13,72 | -0,0677 | -0,2477 | kein Kandidat |
| 687 | W5 | 5m | long | naechste | 50-250 | 1.766 | -0,1331 | -31,25 | -9,55 | nein | 893 | 784.624 | -0,0070 | 0,0854 | -0,1340 | 0,0070 | -19,23 | 0,0139 | 0,0340 | -0,1276 | -13,36 | -0,1670 | -0,4270 | kein Kandidat |
| 688 | W2 | 1m | short | naechste | 5-50 | 1.766 | -0,1432 | -31,28 | -3,16 | nein | 893 | 262.832 | -0,1195 | 0,1569 | -0,1599 | 0,0227 | -7,05 | 0,0453 | 0,1105 | -0,1386 | -11,15 | -0,2795 | -0,5395 | kein Kandidat |
| 689 | W1b | 5m | short | naechste | 5-50 | 1.766 | -0,1715 | -31,36 | -2,14 | nein | 893 | 189.919 | -0,1067 | 0,1569 | -0,1897 | 0,0400 | -4,74 | 0,0800 | 0,1949 | -0,1485 | -8,96 | -0,2667 | -0,5267 | kein Kandidat |
| 690 | W1b | 15m | short | 1h | 5-50 | 1.766 | -0,1926 | -31,42 | -13,49 | nein | 893 | 52.776 | -0,0189 | 0,1569 | -0,1773 | 0,0071 | -24,83 | 0,0143 | 0,0348 | -0,1724 | -13,95 | -0,0689 | -0,2489 | kein Kandidat |
| 691 | W7 | 5m | short | 15m | 50-250 | 1.766 | -0,0624 | -31,53 | -8,92 | nein | 894 | 742.248 | 0,0173 | 0,0854 | -0,0679 | 0,0035 | -19,40 | 0,0070 | 0,0171 | -0,0713 | -16,13 | -0,0327 | -0,2127 | kein Kandidat |
| 692 | W6 | 15m | long | schluss | 50-250 | 1.766 | -0,1327 | -31,59 | -12,53 | nein | 894 | 223.780 | -0,0409 | 0,0854 | -0,1212 | 0,0053 | -22,89 | 0,0106 | 0,0258 | -0,1081 | -9,89 | -0,2009 | -0,4609 | kein Kandidat |
| 693 | W5 | 5m | long | schluss | 250-1000 | 1.766 | -0,1243 | -31,72 | -11,75 | nein | 894 | 249.354 | -0,0515 | 0,0647 | -0,1163 | 0,0053 | -21,99 | 0,0106 | 0,0258 | -0,1108 | -13,48 | -0,2115 | -0,4715 | kein Kandidat |
| 694 | W5 | 15m | short | 3h | 5-50 | 1.766 | -0,1754 | -31,72 | -11,33 | nein | 894 | 285.720 | -0,0231 | 0,1569 | -0,1769 | 0,0077 | -22,86 | 0,0155 | 0,0377 | -0,1609 | -14,05 | -0,0731 | -0,2531 | kein Kandidat |
| 695 | W6 | 15m | long | 15m | 250-1000 | 1.766 | -0,0680 | -31,87 | -15,23 | nein | 894 | 66.531 | -0,0049 | 0,0647 | -0,0698 | 0,0022 | -31,27 | 0,0045 | 0,0109 | -0,0678 | -14,72 | -0,0549 | -0,2349 | kein Kandidat |
| 696 | W5 | 5m | short | naechste | 50-250 | 1.766 | -0,1299 | -32,01 | -10,52 | nein | 893 | 758.797 | -0,0909 | 0,0854 | -0,1351 | 0,0062 | -21,90 | 0,0123 | 0,0301 | -0,1312 | -13,83 | -0,2509 | -0,5109 | kein Kandidat |
| 697 | W6 | 5m | short | schluss | 50-250 | 1.766 | -0,0852 | -32,27 | -13,62 | nein | 894 | 648.931 | 0,0070 | 0,0854 | -0,0848 | 0,0031 | -27,11 | 0,0063 | 0,0152 | -0,0764 | -12,57 | -0,1530 | -0,4130 | kein Kandidat |
| 698 | W5 | 1m | long | naechste | 250-1000 | 1.766 | -0,1058 | -32,39 | -13,01 | nein | 893 | 456.086 | 0,0119 | 0,0647 | -0,1033 | 0,0041 | -25,41 | 0,0081 | 0,0198 | -0,1063 | -12,10 | -0,1481 | -0,4081 | kein Kandidat |
| 699 | W5 | 5m | long | 1h | 250-1000 | 1.766 | -0,0892 | -32,59 | -13,73 | nein | 894 | 225.992 | -0,0159 | 0,0647 | -0,0832 | 0,0032 | -25,62 | 0,0065 | 0,0158 | -0,0777 | -14,57 | -0,0659 | -0,2459 | kein Kandidat |
| 700 | W5 | 1m | short | naechste | 250-1000 | 1.766 | -0,1062 | -32,68 | -12,20 | nein | 893 | 441.934 | -0,0909 | 0,0647 | -0,1060 | 0,0044 | -24,36 | 0,0087 | 0,0212 | -0,1071 | -11,41 | -0,2509 | -0,5109 | kein Kandidat |
| 701 | W5 | 15m | short | 15m | 250-1000 | 1.766 | -0,0663 | -32,83 | -15,16 | nein | 894 | 103.483 | 0,0009 | 0,0647 | -0,0637 | 0,0022 | -29,15 | 0,0044 | 0,0107 | -0,0622 | -15,07 | -0,0491 | -0,2291 | kein Kandidat |
| 702 | W6 | 15m | short | schluss | 50-250 | 1.766 | -0,1440 | -32,88 | -15,05 | nein | 894 | 223.763 | -0,0390 | 0,0854 | -0,1297 | 0,0048 | -27,13 | 0,0096 | 0,0233 | -0,1045 | -11,31 | -0,1990 | -0,4590 | kein Kandidat |
| 703 | W5 | 5m | short | schluss | 250-1000 | 1.766 | -0,1179 | -32,96 | -10,95 | nein | 894 | 238.602 | -0,0480 | 0,0647 | -0,1138 | 0,0054 | -21,13 | 0,0108 | 0,0262 | -0,1051 | -12,52 | -0,2080 | -0,4680 | kein Kandidat |
| 704 | W2 | 1m | long | 15m | 250-1000 | 1.766 | -0,0653 | -33,06 | -14,14 | nein | 894 | 71.465 | -0,0020 | 0,0647 | -0,0673 | 0,0023 | -29,13 | 0,0046 | 0,0113 | -0,0706 | -16,35 | -0,0520 | -0,2320 | kein Kandidat |
| 705 | W1b | 5m | long | naechste | 5-50 | 1.766 | -0,1810 | -33,19 | -6,43 | nein | 893 | 191.432 | 0,0341 | 0,1569 | -0,1969 | 0,0141 | -14,00 | 0,0281 | 0,0685 | -0,1701 | -11,20 | -0,1259 | -0,3859 | kein Kandidat |
| 706 | W6 | 1m | long | 3h | 50-250 | 1.766 | -0,0731 | -33,39 | -14,66 | nein | 894 | 742.508 | 0,0177 | 0,0854 | -0,0773 | 0,0025 | -31,01 | 0,0050 | 0,0121 | -0,0796 | -17,88 | -0,0323 | -0,2123 | kein Kandidat |
| 707 | W1b | 1m | long | 3h | 5-50 | 1.766 | -0,1285 | -33,41 | -12,97 | nein | 894 | 249.537 | 0,0280 | 0,1569 | -0,1371 | 0,0050 | -27,69 | 0,0099 | 0,0241 | -0,1401 | -17,17 | -0,0220 | -0,2020 | kein Kandidat |
| 708 | W1b | 1m | long | 1h | 50-250 | 1.766 | -0,0755 | -33,43 | -14,42 | nein | 894 | 355.961 | 0,0116 | 0,0854 | -0,0753 | 0,0026 | -28,78 | 0,0052 | 0,0128 | -0,0802 | -17,84 | -0,0384 | -0,2184 | kein Kandidat |
| 709 | W1b | 1m | short | 3h | 5-50 | 1.766 | -0,1297 | -33,53 | -13,77 | nein | 894 | 248.563 | 0,0102 | 0,1569 | -0,1383 | 0,0047 | -29,38 | 0,0094 | 0,0229 | -0,1360 | -15,28 | -0,0398 | -0,2198 | kein Kandidat |
| 710 | W2 | 5m | long | 1h | 5-50 | 1.766 | -0,1666 | -33,73 | -15,32 | nein | 894 | 100.487 | -0,0014 | 0,1569 | -0,1577 | 0,0054 | -28,99 | 0,0109 | 0,0265 | -0,1462 | -15,86 | -0,0514 | -0,2314 | kein Kandidat |
| 711 | W1a | 15m | short | 1h | 5-50 | 1.766 | -0,1931 | -33,87 | -14,89 | nein | 894 | 60.097 | -0,0210 | 0,1569 | -0,1790 | 0,0065 | -27,60 | 0,0130 | 0,0316 | -0,1767 | -15,10 | -0,0710 | -0,2510 | kein Kandidat |
| 712 | W1a | 5m | short | naechste | 5-50 | 1.766 | -0,1758 | -33,89 | -2,55 | nein | 893 | 217.429 | -0,1035 | 0,1569 | -0,1863 | 0,0345 | -5,40 | 0,0690 | 0,1680 | -0,1480 | -9,15 | -0,2635 | -0,5235 | kein Kandidat |
| 713 | W6 | 1m | short | 3h | 50-250 | 1.766 | -0,0730 | -34,07 | -12,32 | nein | 894 | 745.171 | -0,0039 | 0,0854 | -0,0796 | 0,0030 | -26,87 | 0,0059 | 0,0144 | -0,0809 | -16,01 | -0,0539 | -0,2339 | kein Kandidat |
| 714 | W1b | 1m | short | naechste | 5-50 | 1.766 | -0,1262 | -34,32 | -3,19 | nein | 893 | 418.639 | -0,0706 | 0,1569 | -0,1114 | 0,0198 | -5,62 | 0,0396 | 0,0965 | -0,1346 | -14,86 | -0,2306 | -0,4906 | kein Kandidat |
| 715 | W5 | 15m | long | naechste | 5-50 | 1.766 | -0,1832 | -34,39 | -5,88 | nein | 893 | 576.802 | 0,0066 | 0,1569 | -0,2221 | 0,0156 | -14,26 | 0,0312 | 0,0759 | -0,2086 | -17,68 | -0,1534 | -0,4134 | kein Kandidat |
| 716 | W2 | 5m | long | schluss | 5-50 | 1.766 | -0,1937 | -34,57 | -13,89 | nein | 894 | 113.455 | -0,0355 | 0,1569 | -0,1814 | 0,0070 | -26,01 | 0,0139 | 0,0340 | -0,1733 | -14,95 | -0,1955 | -0,4555 | kein Kandidat |
| 717 | W6 | 5m | short | 1h | 50-250 | 1.766 | -0,0880 | -34,63 | -13,47 | nein | 894 | 558.586 | -0,0045 | 0,0854 | -0,0887 | 0,0033 | -27,15 | 0,0065 | 0,0159 | -0,0854 | -17,93 | -0,0545 | -0,2345 | kein Kandidat |
| 718 | W1b | 1m | long | naechste | 5-50 | 1.766 | -0,1241 | -34,63 | -2,07 | nein | 893 | 422.731 | 0,1511 | 0,1569 | -0,1219 | 0,0300 | -4,06 | 0,0600 | 0,1462 | -0,1390 | -16,84 | -0,0089 | -0,2689 | kein Kandidat |
| 719 | W5 | 15m | short | naechste | 5-50 | 1.766 | -0,1751 | -34,74 | -4,63 | nein | 893 | 576.665 | -0,1277 | 0,1569 | -0,2128 | 0,0189 | -11,24 | 0,0379 | 0,0922 | -0,1835 | -15,86 | -0,2877 | -0,5477 | kein Kandidat |
| 720 | W2 | 5m | long | 15m | 50-250 | 1.766 | -0,0879 | -35,49 | -15,66 | nein | 894 | 61.494 | -0,0012 | 0,0854 | -0,0867 | 0,0028 | -30,88 | 0,0056 | 0,0137 | -0,0843 | -16,42 | -0,0512 | -0,2312 | kein Kandidat |
| 721 | W5 | 15m | long | 15m | 250-1000 | 1.766 | -0,0741 | -35,78 | -17,86 | nein | 894 | 108.214 | -0,0028 | 0,0647 | -0,0677 | 0,0021 | -32,63 | 0,0042 | 0,0101 | -0,0693 | -16,50 | -0,0528 | -0,2328 | kein Kandidat |
| 722 | W1a | 1m | long | 1h | 50-250 | 1.766 | -0,0766 | -35,81 | -15,54 | nein | 894 | 398.060 | 0,0101 | 0,0854 | -0,0768 | 0,0025 | -31,16 | 0,0049 | 0,0120 | -0,0817 | -19,30 | -0,0399 | -0,2199 | kein Kandidat |
| 723 | W1b | 1m | short | 1h | 50-250 | 1.766 | -0,0765 | -35,89 | -15,28 | nein | 894 | 357.438 | 0,0066 | 0,0854 | -0,0771 | 0,0025 | -30,84 | 0,0050 | 0,0122 | -0,0731 | -17,77 | -0,0434 | -0,2234 | kein Kandidat |
| 724 | W7 | 1m | long | 15m | 250-1000 | 1.766 | -0,0609 | -35,91 | -15,56 | nein | 894 | 436.807 | 0,0052 | 0,0647 | -0,0601 | 0,0020 | -30,72 | 0,0039 | 0,0095 | -0,0603 | -15,94 | -0,0448 | -0,2248 | kein Kandidat |
| 725 | W2 | 5m | short | 1h | 5-50 | 1.766 | -0,1627 | -35,95 | -13,62 | nein | 894 | 101.434 | -0,0026 | 0,1569 | -0,1603 | 0,0060 | -26,83 | 0,0119 | 0,0291 | -0,1468 | -16,04 | -0,0526 | -0,2326 | kein Kandidat |
| 726 | W1a | 1m | short | 3h | 5-50 | 1.766 | -0,1322 | -36,08 | -14,86 | nein | 894 | 290.243 | 0,0073 | 0,1569 | -0,1413 | 0,0044 | -31,78 | 0,0089 | 0,0217 | -0,1383 | -17,04 | -0,0427 | -0,2227 | kein Kandidat |
| 727 | W6 | 15m | short | 15m | 250-1000 | 1.766 | -0,0713 | -36,10 | -15,76 | nein | 894 | 65.919 | -0,0082 | 0,0647 | -0,0727 | 0,0023 | -32,13 | 0,0045 | 0,0110 | -0,0749 | -18,19 | -0,0582 | -0,2382 | kein Kandidat |
| 728 | W1a | 5m | long | naechste | 5-50 | 1.766 | -0,1820 | -36,39 | -6,55 | nein | 893 | 219.180 | 0,0255 | 0,1569 | -0,2059 | 0,0139 | -14,81 | 0,0278 | 0,0677 | -0,1817 | -12,79 | -0,1345 | -0,3945 | kein Kandidat |
| 729 | W2 | 5m | short | schluss | 5-50 | 1.766 | -0,1896 | -36,65 | -11,46 | nein | 894 | 112.952 | -0,0083 | 0,1569 | -0,1766 | 0,0083 | -21,35 | 0,0165 | 0,0403 | -0,1640 | -12,81 | -0,1683 | -0,4283 | kein Kandidat |
| 730 | W1b | 5m | long | 1h | 5-50 | 1.766 | -0,1621 | -36,68 | -16,88 | nein | 894 | 170.800 | 0,0016 | 0,1569 | -0,1546 | 0,0048 | -32,20 | 0,0096 | 0,0234 | -0,1413 | -17,06 | -0,0484 | -0,2284 | kein Kandidat |
| 731 | W1b | 5m | short | schluss | 5-50 | 1.766 | -0,1690 | -37,19 | -9,96 | nein | 894 | 190.133 | 0,0064 | 0,1569 | -0,1619 | 0,0085 | -19,07 | 0,0170 | 0,0414 | -0,1550 | -14,76 | -0,1536 | -0,4136 | kein Kandidat |
| 732 | W1b | 5m | short | 1h | 5-50 | 1.766 | -0,1550 | -37,28 | -15,86 | nein | 894 | 170.890 | 0,0087 | 0,1569 | -0,1489 | 0,0049 | -30,47 | 0,0098 | 0,0238 | -0,1355 | -16,55 | -0,0413 | -0,2213 | kein Kandidat |
| 733 | W1b | 5m | long | schluss | 5-50 | 1.766 | -0,1799 | -37,50 | -14,00 | nein | 894 | 191.648 | -0,0233 | 0,1569 | -0,1691 | 0,0064 | -26,30 | 0,0129 | 0,0313 | -0,1661 | -17,32 | -0,1833 | -0,4433 | kein Kandidat |
| 734 | W1a | 1m | long | 3h | 5-50 | 1.766 | -0,1333 | -37,56 | -14,56 | nein | 894 | 290.983 | 0,0251 | 0,1569 | -0,1402 | 0,0046 | -30,63 | 0,0092 | 0,0223 | -0,1390 | -18,04 | -0,0249 | -0,2049 | kein Kandidat |
| 735 | W4 | 1m | short | 15m | 5-50 | 1.766 | -0,1482 | -37,58 | -9,39 | nein | 894 | 27.581 | 0,0096 | 0,1569 | -0,1466 | 0,0079 | -18,57 | 0,0158 | 0,0385 | -0,1338 | -11,30 | -0,0404 | -0,2204 | kein Kandidat |
| 736 | W4 | 1m | long | 15m | 5-50 | 1.766 | -0,1357 | -37,74 | -11,42 | nein | 894 | 26.504 | 0,0129 | 0,1569 | -0,1446 | 0,0059 | -24,33 | 0,0119 | 0,0290 | -0,1647 | -14,40 | -0,0371 | -0,2171 | kein Kandidat |
| 737 | W6 | 1m | long | naechste | 50-250 | 1.766 | -0,0727 | -37,84 | -13,24 | nein | 893 | 1.269.850 | 0,0543 | 0,0854 | -0,0743 | 0,0027 | -27,05 | 0,0055 | 0,0134 | -0,0796 | -19,59 | -0,1057 | -0,3657 | kein Kandidat |
| 738 | W1a | 1m | short | 1h | 50-250 | 1.766 | -0,0772 | -37,99 | -16,38 | nein | 894 | 398.659 | 0,0060 | 0,0854 | -0,0778 | 0,0024 | -33,05 | 0,0047 | 0,0115 | -0,0733 | -18,37 | -0,0440 | -0,2240 | kein Kandidat |
| 739 | W6 | 1m | short | 1h | 250-1000 | 1.766 | -0,0565 | -38,07 | -16,50 | nein | 894 | 422.126 | -0,0027 | 0,0647 | -0,0647 | 0,0017 | -37,78 | 0,0034 | 0,0083 | -0,0677 | -21,51 | -0,0527 | -0,2327 | kein Kandidat |
| 740 | W5 | 1m | long | 3h | 50-250 | 1.766 | -0,1237 | -38,29 | -16,10 | nein | 894 | 740.461 | -0,0203 | 0,0854 | -0,1156 | 0,0038 | -30,11 | 0,0077 | 0,0187 | -0,1115 | -15,47 | -0,0703 | -0,2503 | kein Kandidat |
| 741 | W2 | 1m | short | 15m | 250-1000 | 1.766 | -0,0626 | -38,29 | -15,15 | nein | 894 | 72.050 | -0,0012 | 0,0647 | -0,0653 | 0,0021 | -31,60 | 0,0041 | 0,0101 | -0,0614 | -17,00 | -0,0512 | -0,2312 | kein Kandidat |
| 742 | W1a | 5m | long | 1h | 5-50 | 1.766 | -0,1630 | -38,36 | -17,88 | nein | 894 | 195.630 | 0,0000 | 0,1569 | -0,1562 | 0,0046 | -34,27 | 0,0091 | 0,0222 | -0,1448 | -18,94 | -0,0500 | -0,2300 | kein Kandidat |
| 743 | W1a | 5m | short | 1h | 5-50 | 1.766 | -0,1560 | -38,73 | -16,75 | nein | 894 | 195.706 | 0,0060 | 0,1569 | -0,1516 | 0,0047 | -32,57 | 0,0093 | 0,0227 | -0,1378 | -17,23 | -0,0440 | -0,2240 | kein Kandidat |
| 744 | W1a | 1m | short | naechste | 5-50 | 1.766 | -0,1296 | -38,82 | -6,83 | nein | 893 | 493.427 | -0,0697 | 0,1569 | -0,1102 | 0,0095 | -11,62 | 0,0190 | 0,0462 | -0,1335 | -17,63 | -0,2297 | -0,4897 | kein Kandidat |
| 745 | W2 | 1m | long | schluss | 5-50 | 1.766 | -0,1519 | -38,84 | -15,40 | nein | 894 | 264.006 | -0,0052 | 0,1569 | -0,1551 | 0,0049 | -31,45 | 0,0099 | 0,0240 | -0,1539 | -17,69 | -0,1652 | -0,4252 | kein Kandidat |
| 746 | W6 | 15m | long | 3h | 5-50 | 1.753 | -0,2106 | -38,90 | -14,87 | nein | 886 | 189.788 | -0,0414 | 0,1569 | -0,2000 | 0,0071 | -28,26 | 0,0142 | 0,0345 | -0,1933 | -16,16 | -0,0914 | -0,2714 | kein Kandidat |
| 747 | W1a | 1m | long | naechste | 5-50 | 1.766 | -0,1302 | -38,90 | -2,82 | nein | 893 | 497.278 | 0,1420 | 0,1569 | -0,1307 | 0,0231 | -5,66 | 0,0462 | 0,1126 | -0,1401 | -19,00 | -0,0180 | -0,2780 | kein Kandidat |
| 748 | W6 | 1m | short | naechste | 50-250 | 1.766 | -0,0729 | -39,02 | -16,17 | nein | 893 | 1.274.997 | -0,0344 | 0,0854 | -0,0765 | 0,0023 | -33,96 | 0,0045 | 0,0110 | -0,0793 | -16,34 | -0,1944 | -0,4544 | kein Kandidat |
| 749 | W2 | 1m | short | schluss | 5-50 | 1.766 | -0,1460 | -39,35 | -14,90 | nein | 894 | 263.110 | 0,0173 | 0,1569 | -0,1466 | 0,0049 | -29,91 | 0,0098 | 0,0239 | -0,1467 | -15,66 | -0,1427 | -0,4027 | kein Kandidat |
| 750 | W6 | 15m | short | 3h | 5-50 | 1.753 | -0,2166 | -39,41 | -14,63 | nein | 886 | 195.784 | -0,0412 | 0,1569 | -0,1969 | 0,0074 | -26,61 | 0,0148 | 0,0361 | -0,1729 | -12,28 | -0,0912 | -0,2712 | kein Kandidat |
| 751 | W5 | 1m | short | 3h | 50-250 | 1.766 | -0,1238 | -39,69 | -17,88 | nein | 894 | 721.946 | -0,0428 | 0,0854 | -0,1187 | 0,0035 | -34,31 | 0,0069 | 0,0169 | -0,1153 | -18,03 | -0,0928 | -0,2728 | kein Kandidat |
| 752 | W1a | 5m | short | schluss | 5-50 | 1.766 | -0,1733 | -40,03 | -11,33 | nein | 894 | 217.693 | 0,0023 | 0,1569 | -0,1659 | 0,0077 | -21,68 | 0,0153 | 0,0373 | -0,1570 | -15,38 | -0,1577 | -0,4177 | kein Kandidat |
| 753 | W1a | 5m | long | schluss | 5-50 | 1.766 | -0,1829 | -40,16 | -15,24 | nein | 894 | 219.442 | -0,0296 | 0,1569 | -0,1754 | 0,0060 | -29,24 | 0,0120 | 0,0292 | -0,1745 | -19,65 | -0,1896 | -0,4496 | kein Kandidat |
| 754 | W2 | 5m | short | 15m | 50-250 | 1.766 | -0,0865 | -40,25 | -16,53 | nein | 894 | 60.907 | -0,0013 | 0,0854 | -0,0866 | 0,0026 | -33,11 | 0,0052 | 0,0127 | -0,0866 | -16,72 | -0,0513 | -0,2313 | kein Kandidat |
| 755 | W1b | 5m | long | 15m | 50-250 | 1.766 | -0,0874 | -40,32 | -18,20 | nein | 894 | 112.515 | -0,0008 | 0,0854 | -0,0863 | 0,0024 | -35,92 | 0,0048 | 0,0117 | -0,0820 | -19,22 | -0,0508 | -0,2308 | kein Kandidat |
| 756 | W6 | 1m | long | 1h | 250-1000 | 1.766 | -0,0589 | -41,36 | -18,27 | nein | 894 | 421.521 | 0,0052 | 0,0647 | -0,0621 | 0,0016 | -38,55 | 0,0032 | 0,0079 | -0,0638 | -21,06 | -0,0448 | -0,2248 | kein Kandidat |
| 757 | W6 | 5m | long | 3h | 5-50 | 1.766 | -0,1677 | -41,41 | -17,67 | nein | 894 | 514.316 | -0,0158 | 0,1569 | -0,1763 | 0,0047 | -37,16 | 0,0095 | 0,0231 | -0,1704 | -20,08 | -0,0658 | -0,2458 | kein Kandidat |
| 758 | W5 | 5m | long | schluss | 50-250 | 1.766 | -0,1365 | -41,50 | -13,71 | nein | 894 | 785.470 | -0,0561 | 0,0854 | -0,1353 | 0,0050 | -27,18 | 0,0100 | 0,0243 | -0,1238 | -19,51 | -0,2161 | -0,4761 | kein Kandidat |
| 759 | W1a | 5m | long | 15m | 50-250 | 1.766 | -0,0870 | -42,00 | -18,96 | nein | 894 | 124.000 | -0,0010 | 0,0854 | -0,0865 | 0,0023 | -37,72 | 0,0046 | 0,0112 | -0,0825 | -20,47 | -0,0510 | -0,2310 | kein Kandidat |
| 760 | W7 | 1m | short | 15m | 250-1000 | 1.766 | -0,0592 | -42,23 | -16,18 | nein | 894 | 457.256 | 0,0025 | 0,0647 | -0,0616 | 0,0018 | -33,68 | 0,0037 | 0,0089 | -0,0641 | -18,18 | -0,0475 | -0,2275 | kein Kandidat |
| 761 | W6 | 5m | long | 15m | 250-1000 | 1.766 | -0,0690 | -42,27 | -20,01 | nein | 894 | 196.376 | -0,0024 | 0,0647 | -0,0673 | 0,0017 | -39,07 | 0,0034 | 0,0084 | -0,0684 | -19,31 | -0,0524 | -0,2324 | kein Kandidat |
| 762 | W7 | 1m | long | 1h | 5-50 | 1.766 | -0,1423 | -42,47 | -16,75 | nein | 894 | 1.159.455 | 0,0195 | 0,1569 | -0,1385 | 0,0042 | -32,60 | 0,0085 | 0,0207 | -0,1449 | -19,48 | -0,0305 | -0,2105 | kein Kandidat |
| 763 | W5 | 5m | short | schluss | 50-250 | 1.766 | -0,1326 | -42,52 | -13,03 | nein | 894 | 760.006 | -0,0406 | 0,0854 | -0,1328 | 0,0051 | -26,08 | 0,0102 | 0,0248 | -0,1238 | -17,54 | -0,2006 | -0,4606 | kein Kandidat |
| 764 | W5 | 1m | short | 1h | 250-1000 | 1.766 | -0,0796 | -42,71 | -16,37 | nein | 894 | 408.270 | -0,0139 | 0,0647 | -0,0760 | 0,0024 | -31,29 | 0,0049 | 0,0118 | -0,0726 | -16,30 | -0,0639 | -0,2439 | kein Kandidat |
| 765 | W1b | 1m | long | 15m | 250-1000 | 1.766 | -0,0667 | -42,86 | -13,16 | nein | 894 | 137.787 | 0,0026 | 0,0647 | -0,0627 | 0,0025 | -24,72 | 0,0051 | 0,0124 | -0,0712 | -18,38 | -0,0474 | -0,2274 | kein Kandidat |
| 766 | W5 | 1m | long | 1h | 250-1000 | 1.766 | -0,0807 | -42,98 | -18,87 | nein | 894 | 421.670 | -0,0069 | 0,0647 | -0,0745 | 0,0021 | -34,84 | 0,0043 | 0,0104 | -0,0703 | -16,28 | -0,0569 | -0,2369 | kein Kandidat |
| 767 | W6 | 15m | short | naechste | 5-50 | 1.766 | -0,2343 | -43,05 | -8,84 | nein | 893 | 416.607 | -0,0926 | 0,1569 | -0,1777 | 0,0132 | -13,41 | 0,0265 | 0,0645 | -0,1944 | -12,74 | -0,2526 | -0,5126 | kein Kandidat |
| 768 | W2 | 1m | long | 1h | 5-50 | 1.766 | -0,1516 | -43,19 | -18,99 | nein | 894 | 235.320 | -0,0034 | 0,1569 | -0,1615 | 0,0040 | -40,46 | 0,0080 | 0,0194 | -0,1673 | -23,88 | -0,0534 | -0,2334 | kein Kandidat |
| 769 | W1b | 1m | long | schluss | 5-50 | 1.766 | -0,1255 | -43,29 | -17,04 | nein | 894 | 423.212 | 0,0165 | 0,1569 | -0,1333 | 0,0037 | -36,19 | 0,0074 | 0,0179 | -0,1385 | -22,45 | -0,1435 | -0,4035 | kein Kandidat |
| 770 | W5 | 1m | short | schluss | 250-1000 | 1.766 | -0,1074 | -43,82 | -17,02 | nein | 894 | 442.626 | -0,0400 | 0,0647 | -0,1047 | 0,0032 | -33,20 | 0,0063 | 0,0154 | -0,0989 | -17,42 | -0,2000 | -0,4600 | kein Kandidat |
| 771 | W5 | 1m | long | schluss | 250-1000 | 1.766 | -0,1091 | -44,14 | -18,12 | nein | 894 | 456.722 | -0,0357 | 0,0647 | -0,1012 | 0,0030 | -33,62 | 0,0060 | 0,0147 | -0,0942 | -17,16 | -0,1957 | -0,4557 | kein Kandidat |
| 772 | W5 | 1m | short | naechste | 50-250 | 1.766 | -0,1265 | -44,28 | -16,01 | nein | 893 | 1.193.980 | -0,0830 | 0,0854 | -0,1255 | 0,0039 | -31,76 | 0,0079 | 0,0192 | -0,1185 | -16,58 | -0,2430 | -0,5030 | kein Kandidat |
| 773 | W5 | 15m | short | 1h | 5-50 | 1.766 | -0,1569 | -44,33 | -19,11 | nein | 894 | 488.883 | -0,0021 | 0,1569 | -0,1595 | 0,0041 | -38,84 | 0,0082 | 0,0200 | -0,1456 | -21,12 | -0,0521 | -0,2321 | kein Kandidat |
| 774 | W5 | 1m | long | naechste | 50-250 | 1.766 | -0,1261 | -44,53 | -15,86 | nein | 893 | 1.223.692 | 0,0058 | 0,0854 | -0,1231 | 0,0040 | -30,97 | 0,0080 | 0,0194 | -0,1180 | -17,16 | -0,1542 | -0,4142 | kein Kandidat |
| 775 | W2 | 15m | long | 15m | 5-50 | 1.763 | -0,1724 | -44,57 | -18,92 | nein | 893 | 31.550 | -0,0068 | 0,1569 | -0,1638 | 0,0046 | -35,95 | 0,0091 | 0,0222 | -0,1552 | -15,18 | -0,0568 | -0,2368 | kein Kandidat |
| 776 | W1a | 1m | long | 15m | 250-1000 | 1.766 | -0,0666 | -44,90 | -13,60 | nein | 894 | 149.468 | 0,0024 | 0,0647 | -0,0629 | 0,0024 | -25,67 | 0,0049 | 0,0119 | -0,0706 | -19,49 | -0,0476 | -0,2276 | kein Kandidat |
| 777 | W5 | 5m | short | 1h | 50-250 | 1.766 | -0,1058 | -45,38 | -17,48 | nein | 894 | 683.869 | -0,0178 | 0,0854 | -0,1021 | 0,0030 | -33,74 | 0,0061 | 0,0147 | -0,1029 | -24,69 | -0,0678 | -0,2478 | kein Kandidat |
| 778 | W5 | 15m | long | 1h | 5-50 | 1.766 | -0,1627 | -45,43 | -20,02 | nein | 894 | 488.446 | -0,0031 | 0,1569 | -0,1596 | 0,0041 | -39,26 | 0,0081 | 0,0198 | -0,1561 | -24,04 | -0,0531 | -0,2331 | kein Kandidat |
| 779 | W5 | 15m | short | schluss | 5-50 | 1.766 | -0,1813 | -45,62 | -17,39 | nein | 894 | 577.590 | -0,0223 | 0,1569 | -0,1886 | 0,0052 | -36,19 | 0,0104 | 0,0254 | -0,1702 | -21,39 | -0,1823 | -0,4423 | kein Kandidat |
| 780 | W5 | 15m | long | schluss | 5-50 | 1.766 | -0,1904 | -45,86 | -17,08 | nein | 894 | 577.301 | -0,0429 | 0,1569 | -0,1904 | 0,0056 | -34,17 | 0,0111 | 0,0271 | -0,1816 | -20,16 | -0,2029 | -0,4629 | kein Kandidat |
| 781 | W6 | 15m | long | naechste | 5-50 | 1.766 | -0,2194 | -45,95 | -8,06 | nein | 893 | 408.925 | 0,0034 | 0,1569 | -0,2247 | 0,0136 | -16,51 | 0,0272 | 0,0663 | -0,1889 | -13,91 | -0,1566 | -0,4166 | kein Kandidat |
| 782 | W7 | 1m | short | 1h | 5-50 | 1.766 | -0,1419 | -46,73 | -18,09 | nein | 894 | 1.152.875 | 0,0067 | 0,1569 | -0,1487 | 0,0039 | -37,92 | 0,0078 | 0,0191 | -0,1608 | -22,58 | -0,0433 | -0,2233 | kein Kandidat |
| 783 | W1b | 5m | short | 15m | 50-250 | 1.766 | -0,0852 | -46,83 | -19,13 | nein | 894 | 112.723 | 0,0033 | 0,0854 | -0,0820 | 0,0022 | -36,84 | 0,0045 | 0,0109 | -0,0807 | -19,44 | -0,0467 | -0,2267 | kein Kandidat |
| 784 | W1b | 1m | short | schluss | 5-50 | 1.766 | -0,1303 | -46,85 | -16,16 | nein | 894 | 419.046 | 0,0349 | 0,1569 | -0,1287 | 0,0040 | -31,93 | 0,0081 | 0,0196 | -0,1322 | -20,04 | -0,1251 | -0,3851 | kein Kandidat |
| 785 | W2 | 1m | short | 1h | 5-50 | 1.766 | -0,1509 | -47,11 | -19,33 | nein | 894 | 233.392 | 0,0009 | 0,1569 | -0,1548 | 0,0039 | -39,65 | 0,0078 | 0,0190 | -0,1523 | -24,01 | -0,0491 | -0,2291 | kein Kandidat |
| 786 | W6 | 5m | short | 3h | 5-50 | 1.766 | -0,1800 | -47,22 | -17,20 | nein | 894 | 529.186 | -0,0198 | 0,1569 | -0,1734 | 0,0052 | -33,13 | 0,0105 | 0,0255 | -0,1602 | -18,28 | -0,0698 | -0,2498 | kein Kandidat |
| 787 | W5 | 5m | long | 3h | 5-50 | 1.766 | -0,1932 | -47,48 | -21,25 | nein | 894 | 694.485 | -0,0234 | 0,1569 | -0,1840 | 0,0045 | -40,48 | 0,0091 | 0,0221 | -0,1816 | -25,17 | -0,0734 | -0,2534 | kein Kandidat |
| 788 | W6 | 5m | long | naechste | 5-50 | 1.766 | -0,1574 | -47,66 | -6,21 | nein | 893 | 1.069.776 | 0,0521 | 0,1569 | -0,1788 | 0,0127 | -14,11 | 0,0253 | 0,0617 | -0,1627 | -20,11 | -0,1079 | -0,3679 | kein Kandidat |
| 789 | W1b | 1m | short | 15m | 250-1000 | 1.766 | -0,0650 | -47,84 | -17,30 | nein | 894 | 139.545 | 0,0001 | 0,0647 | -0,0640 | 0,0019 | -34,03 | 0,0038 | 0,0092 | -0,0635 | -19,74 | -0,0499 | -0,2299 | kein Kandidat |
| 790 | W2 | 15m | short | 15m | 5-50 | 1.765 | -0,1735 | -48,18 | -21,14 | nein | 893 | 30.968 | -0,0095 | 0,1569 | -0,1671 | 0,0041 | -40,70 | 0,0082 | 0,0200 | -0,1587 | -20,99 | -0,0595 | -0,2395 | kein Kandidat |
| 791 | W1a | 5m | short | 15m | 50-250 | 1.766 | -0,0850 | -48,25 | -20,08 | nein | 894 | 123.984 | 0,0023 | 0,0854 | -0,0830 | 0,0021 | -39,21 | 0,0042 | 0,0103 | -0,0829 | -20,97 | -0,0477 | -0,2277 | kein Kandidat |
| 792 | W5 | 5m | short | 15m | 250-1000 | 1.766 | -0,0708 | -48,78 | -21,11 | nein | 894 | 238.602 | -0,0060 | 0,0647 | -0,0704 | 0,0017 | -42,01 | 0,0034 | 0,0082 | -0,0666 | -22,32 | -0,0560 | -0,2360 | kein Kandidat |
| 793 | W6 | 1m | long | schluss | 50-250 | 1.766 | -0,0716 | -48,78 | -16,94 | nein | 894 | 1.271.511 | 0,0065 | 0,0854 | -0,0727 | 0,0021 | -34,40 | 0,0042 | 0,0103 | -0,0779 | -26,13 | -0,1535 | -0,4135 | kein Kandidat |
| 794 | W5 | 5m | long | 15m | 250-1000 | 1.766 | -0,0700 | -48,78 | -19,38 | nein | 894 | 249.354 | -0,0040 | 0,0647 | -0,0691 | 0,0018 | -38,28 | 0,0036 | 0,0088 | -0,0654 | -25,75 | -0,0540 | -0,2340 | kein Kandidat |
| 795 | W5 | 5m | long | 1h | 50-250 | 1.766 | -0,1070 | -48,87 | -19,26 | nein | 894 | 712.818 | -0,0155 | 0,0854 | -0,1023 | 0,0028 | -36,83 | 0,0056 | 0,0135 | -0,0990 | -23,42 | -0,0655 | -0,2455 | kein Kandidat |
| 796 | W1a | 1m | short | 15m | 250-1000 | 1.766 | -0,0645 | -49,04 | -17,67 | nein | 894 | 150.930 | 0,0004 | 0,0647 | -0,0637 | 0,0018 | -34,92 | 0,0036 | 0,0089 | -0,0638 | -21,00 | -0,0496 | -0,2296 | kein Kandidat |
| 797 | W6 | 5m | short | 15m | 250-1000 | 1.766 | -0,0689 | -49,07 | -15,93 | nein | 894 | 196.752 | -0,0043 | 0,0647 | -0,0686 | 0,0022 | -31,73 | 0,0043 | 0,0105 | -0,0688 | -21,97 | -0,0543 | -0,2343 | kein Kandidat |
| 798 | W5 | 5m | short | 3h | 5-50 | 1.766 | -0,1871 | -50,52 | -21,51 | nein | 894 | 686.493 | -0,0268 | 0,1569 | -0,1803 | 0,0044 | -41,43 | 0,0087 | 0,0212 | -0,1760 | -23,12 | -0,0768 | -0,2568 | kein Kandidat |
| 799 | W1a | 1m | short | schluss | 5-50 | 1.766 | -0,1329 | -50,73 | -17,87 | nein | 894 | 493.930 | 0,0300 | 0,1569 | -0,1337 | 0,0037 | -35,97 | 0,0074 | 0,0181 | -0,1358 | -23,36 | -0,1300 | -0,3900 | kein Kandidat |
| 800 | W1a | 1m | long | schluss | 5-50 | 1.766 | -0,1333 | -51,04 | -20,09 | nein | 894 | 497.882 | 0,0106 | 0,1569 | -0,1393 | 0,0033 | -41,96 | 0,0066 | 0,0162 | -0,1413 | -24,81 | -0,1494 | -0,4094 | kein Kandidat |
| 801 | W6 | 1m | short | schluss | 50-250 | 1.766 | -0,0723 | -51,11 | -20,64 | nein | 894 | 1.276.637 | 0,0149 | 0,0854 | -0,0766 | 0,0018 | -43,71 | 0,0035 | 0,0085 | -0,0784 | -23,03 | -0,1451 | -0,4051 | kein Kandidat |
| 802 | W5 | 15m | short | 15m | 50-250 | 1.766 | -0,0856 | -51,15 | -22,90 | nein | 894 | 335.259 | -0,0012 | 0,0854 | -0,0865 | 0,0019 | -46,29 | 0,0037 | 0,0091 | -0,0854 | -27,25 | -0,0512 | -0,2312 | kein Kandidat |
| 803 | W7 | 1m | long | 15m | 50-250 | 1.766 | -0,0825 | -51,40 | -21,44 | nein | 894 | 1.205.741 | 0,0079 | 0,0854 | -0,0778 | 0,0019 | -40,48 | 0,0038 | 0,0094 | -0,0767 | -21,03 | -0,0421 | -0,2221 | kein Kandidat |
| 804 | W5 | 5m | long | naechste | 5-50 | 1.766 | -0,2120 | -51,86 | -7,25 | nein | 893 | 1.220.166 | 0,0012 | 0,1569 | -0,2302 | 0,0146 | -15,73 | 0,0293 | 0,0713 | -0,2077 | -26,42 | -0,1588 | -0,4188 | kein Kandidat |
| 805 | W7 | 5m | long | 15m | 5-50 | 1.766 | -0,1296 | -52,35 | -23,69 | nein | 894 | 1.167.763 | 0,0278 | 0,1569 | -0,1288 | 0,0027 | -47,12 | 0,0055 | 0,0133 | -0,1353 | -26,97 | -0,0222 | -0,2022 | kein Kandidat |
| 806 | W6 | 1m | long | 3h | 5-50 | 1.766 | -0,1435 | -52,62 | -24,39 | nein | 894 | 778.366 | 0,0176 | 0,1569 | -0,1475 | 0,0029 | -50,12 | 0,0059 | 0,0143 | -0,1519 | -30,73 | -0,0324 | -0,2124 | kein Kandidat |
| 807 | W5 | 5m | short | naechste | 5-50 | 1.766 | -0,2064 | -52,87 | -8,83 | nein | 893 | 1.214.972 | -0,1458 | 0,1569 | -0,2286 | 0,0117 | -19,56 | 0,0234 | 0,0569 | -0,2094 | -24,71 | -0,3058 | -0,5658 | kein Kandidat |
| 808 | W6 | 15m | long | 1h | 5-50 | 1.766 | -0,1804 | -53,73 | -17,97 | nein | 894 | 350.505 | -0,0173 | 0,1569 | -0,1738 | 0,0050 | -34,62 | 0,0100 | 0,0245 | -0,1689 | -23,98 | -0,0673 | -0,2473 | kein Kandidat |
| 809 | W6 | 5m | long | schluss | 5-50 | 1.766 | -0,1530 | -53,88 | -17,95 | nein | 894 | 1.071.016 | -0,0101 | 0,1569 | -0,1559 | 0,0043 | -36,57 | 0,0085 | 0,0208 | -0,1578 | -29,76 | -0,1701 | -0,4301 | kein Kandidat |
| 810 | W7 | 15m | long | 15m | 5-50 | 1.766 | -0,1368 | -53,98 | -17,91 | nein | 894 | 700.939 | 0,0268 | 0,1569 | -0,1298 | 0,0038 | -33,97 | 0,0076 | 0,0186 | -0,1399 | -30,77 | -0,0232 | -0,2032 | kein Kandidat |
| 811 | W6 | 1m | short | 3h | 5-50 | 1.766 | -0,1445 | -54,27 | -22,27 | nein | 894 | 781.573 | -0,0021 | 0,1569 | -0,1506 | 0,0032 | -46,42 | 0,0065 | 0,0158 | -0,1532 | -27,55 | -0,0521 | -0,2321 | kein Kandidat |
| 812 | W6 | 5m | short | naechste | 5-50 | 1.766 | -0,1639 | -54,51 | -6,21 | nein | 893 | 1.087.444 | -0,0629 | 0,1569 | -0,1456 | 0,0132 | -11,03 | 0,0264 | 0,0643 | -0,1549 | -21,97 | -0,2229 | -0,4829 | kein Kandidat |
| 813 | W1b | 15m | short | 15m | 5-50 | 1.766 | -0,1699 | -54,58 | -26,57 | nein | 893 | 58.213 | -0,0088 | 0,1569 | -0,1662 | 0,0032 | -51,99 | 0,0064 | 0,0156 | -0,1646 | -29,77 | -0,0588 | -0,2388 | kein Kandidat |
| 814 | W6 | 15m | long | schluss | 5-50 | 1.766 | -0,2072 | -54,61 | -21,33 | nein | 894 | 409.354 | -0,0552 | 0,1569 | -0,2028 | 0,0049 | -41,76 | 0,0097 | 0,0237 | -0,1932 | -20,14 | -0,2152 | -0,4752 | kein Kandidat |
| 815 | W5 | 1m | short | schluss | 50-250 | 1.766 | -0,1285 | -54,64 | -21,28 | nein | 894 | 1.195.701 | -0,0340 | 0,0854 | -0,1257 | 0,0030 | -41,66 | 0,0060 | 0,0147 | -0,1177 | -24,99 | -0,1940 | -0,4540 | kein Kandidat |
| 816 | W5 | 1m | long | 3h | 5-50 | 1.766 | -0,1956 | -54,85 | -23,78 | nein | 894 | 738.384 | -0,0183 | 0,1569 | -0,1839 | 0,0041 | -44,73 | 0,0082 | 0,0200 | -0,1804 | -22,40 | -0,0683 | -0,2483 | kein Kandidat |
| 817 | W5 | 15m | long | 15m | 50-250 | 1.766 | -0,0922 | -55,51 | -27,45 | nein | 894 | 344.702 | -0,0031 | 0,0854 | -0,0886 | 0,0017 | -52,78 | 0,0034 | 0,0082 | -0,0909 | -29,42 | -0,0531 | -0,2331 | kein Kandidat |
| 818 | W6 | 15m | long | 15m | 50-250 | 1.766 | -0,0914 | -56,40 | -24,73 | nein | 894 | 223.778 | -0,0038 | 0,0854 | -0,0892 | 0,0018 | -48,29 | 0,0037 | 0,0090 | -0,0877 | -26,18 | -0,0538 | -0,2338 | kein Kandidat |
| 819 | W6 | 15m | short | 1h | 5-50 | 1.766 | -0,1861 | -56,47 | -23,57 | nein | 894 | 357.296 | -0,0167 | 0,1569 | -0,1741 | 0,0039 | -44,10 | 0,0079 | 0,0192 | -0,1633 | -26,14 | -0,0667 | -0,2467 | kein Kandidat |
| 820 | W5 | 1m | short | 3h | 5-50 | 1.766 | -0,1959 | -56,55 | -24,37 | nein | 894 | 741.615 | -0,0369 | 0,1569 | -0,1859 | 0,0040 | -46,27 | 0,0080 | 0,0196 | -0,1764 | -27,54 | -0,0869 | -0,2669 | kein Kandidat |
| 821 | W1b | 1m | long | 1h | 5-50 | 1.766 | -0,1413 | -56,80 | -24,61 | nein | 894 | 387.106 | 0,0078 | 0,1569 | -0,1503 | 0,0029 | -52,35 | 0,0057 | 0,0140 | -0,1553 | -31,41 | -0,0422 | -0,2222 | kein Kandidat |
| 822 | W5 | 1m | long | schluss | 50-250 | 1.766 | -0,1263 | -57,07 | -22,00 | nein | 894 | 1.225.085 | -0,0434 | 0,0854 | -0,1230 | 0,0029 | -42,83 | 0,0057 | 0,0140 | -0,1152 | -25,21 | -0,2034 | -0,4634 | kein Kandidat |
| 823 | W6 | 1m | long | naechste | 5-50 | 1.766 | -0,1428 | -57,72 | -6,55 | nein | 893 | 1.334.108 | 0,1191 | 0,1569 | -0,1535 | 0,0109 | -14,09 | 0,0218 | 0,0531 | -0,1488 | -28,31 | -0,0409 | -0,3009 | kein Kandidat |
| 824 | W7 | 1m | short | 15m | 50-250 | 1.766 | -0,0799 | -58,06 | -22,75 | nein | 894 | 1.243.979 | 0,0041 | 0,0854 | -0,0808 | 0,0018 | -46,03 | 0,0035 | 0,0086 | -0,0842 | -24,78 | -0,0459 | -0,2259 | kein Kandidat |
| 825 | W6 | 15m | short | schluss | 5-50 | 1.766 | -0,2234 | -58,16 | -16,96 | nein | 894 | 417.049 | -0,0384 | 0,1569 | -0,2049 | 0,0066 | -31,13 | 0,0132 | 0,0321 | -0,2003 | -10,72 | -0,1984 | -0,4584 | kein Kandidat |
| 826 | W7 | 5m | short | 15m | 5-50 | 1.766 | -0,1275 | -58,43 | -17,14 | nein | 894 | 1.183.084 | 0,0221 | 0,1569 | -0,1350 | 0,0037 | -36,29 | 0,0074 | 0,0181 | -0,1433 | -31,14 | -0,0279 | -0,2079 | kein Kandidat |
| 827 | W6 | 5m | long | 1h | 5-50 | 1.766 | -0,1576 | -59,01 | -25,13 | nein | 894 | 930.886 | -0,0089 | 0,1569 | -0,1651 | 0,0031 | -52,66 | 0,0063 | 0,0153 | -0,1642 | -30,02 | -0,0589 | -0,2389 | kein Kandidat |
| 828 | W2 | 1m | long | 15m | 50-250 | 1.766 | -0,0869 | -59,32 | -21,36 | nein | 894 | 218.963 | -0,0028 | 0,0854 | -0,0886 | 0,0020 | -43,52 | 0,0041 | 0,0099 | -0,0882 | -28,51 | -0,0528 | -0,2328 | kein Kandidat |
| 829 | W1a | 15m | short | 15m | 5-50 | 1.766 | -0,1703 | -60,50 | -28,70 | nein | 894 | 65.953 | -0,0110 | 0,1569 | -0,1683 | 0,0030 | -56,75 | 0,0059 | 0,0145 | -0,1678 | -31,52 | -0,0610 | -0,2410 | kein Kandidat |
| 830 | W5 | 1m | long | naechste | 5-50 | 1.766 | -0,2025 | -60,75 | -11,59 | nein | 893 | 1.210.462 | 0,0590 | 0,1569 | -0,2144 | 0,0087 | -24,55 | 0,0175 | 0,0426 | -0,1877 | -28,22 | -0,1010 | -0,3610 | kein Kandidat |
| 831 | W5 | 1m | short | 1h | 50-250 | 1.766 | -0,0999 | -61,07 | -22,28 | nein | 894 | 1.101.066 | -0,0119 | 0,0854 | -0,0958 | 0,0022 | -42,76 | 0,0045 | 0,0109 | -0,0943 | -26,00 | -0,0619 | -0,2419 | kein Kandidat |
| 832 | W5 | 1m | long | 1h | 50-250 | 1.766 | -0,0995 | -61,11 | -25,69 | nein | 894 | 1.127.102 | -0,0070 | 0,0854 | -0,0941 | 0,0019 | -48,61 | 0,0039 | 0,0094 | -0,0917 | -25,61 | -0,0570 | -0,2370 | kein Kandidat |
| 833 | W1b | 15m | long | 15m | 5-50 | 1.766 | -0,1699 | -61,60 | -24,88 | nein | 894 | 58.591 | -0,0040 | 0,1569 | -0,1607 | 0,0034 | -47,06 | 0,0068 | 0,0166 | -0,1601 | -25,00 | -0,0540 | -0,2340 | kein Kandidat |
| 834 | W6 | 1m | long | 1h | 50-250 | 1.766 | -0,0805 | -61,61 | -27,48 | nein | 894 | 1.160.590 | 0,0043 | 0,0854 | -0,0827 | 0,0015 | -56,41 | 0,0029 | 0,0071 | -0,0832 | -35,00 | -0,0457 | -0,2257 | kein Kandidat |
| 835 | W6 | 1m | short | naechste | 5-50 | 1.766 | -0,1413 | -61,78 | -7,30 | nein | 893 | 1.336.292 | -0,1015 | 0,1569 | -0,1416 | 0,0097 | -14,64 | 0,0194 | 0,0472 | -0,1466 | -26,55 | -0,2615 | -0,5215 | kein Kandidat |
| 836 | W5 | 1m | short | 15m | 250-1000 | 1.766 | -0,0664 | -62,34 | -26,89 | nein | 894 | 442.626 | -0,0046 | 0,0647 | -0,0687 | 0,0012 | -55,62 | 0,0025 | 0,0060 | -0,0693 | -28,84 | -0,0546 | -0,2346 | kein Kandidat |
| 837 | W5 | 1m | short | naechste | 5-50 | 1.766 | -0,2004 | -62,72 | -5,27 | nein | 893 | 1.216.625 | -0,1531 | 0,1569 | -0,1940 | 0,0190 | -10,21 | 0,0380 | 0,0926 | -0,1927 | -26,59 | -0,3131 | -0,5731 | kein Kandidat |
| 838 | W1b | 1m | short | 1h | 5-50 | 1.766 | -0,1444 | -62,87 | -26,56 | nein | 894 | 381.778 | 0,0086 | 0,1569 | -0,1470 | 0,0027 | -54,11 | 0,0054 | 0,0132 | -0,1463 | -30,64 | -0,0414 | -0,2214 | kein Kandidat |
| 839 | W6 | 5m | short | schluss | 5-50 | 1.766 | -0,1617 | -63,03 | -27,38 | nein | 894 | 1.088.538 | 0,0085 | 0,1569 | -0,1595 | 0,0030 | -54,03 | 0,0059 | 0,0144 | -0,1518 | -29,41 | -0,1515 | -0,4115 | kein Kandidat |
| 840 | W6 | 15m | short | 15m | 50-250 | 1.766 | -0,0913 | -63,06 | -25,82 | nein | 894 | 223.763 | -0,0074 | 0,0854 | -0,0927 | 0,0018 | -52,44 | 0,0035 | 0,0086 | -0,0893 | -31,65 | -0,0574 | -0,2374 | kein Kandidat |
| 841 | W1a | 15m | long | 15m | 5-50 | 1.766 | -0,1692 | -63,10 | -26,24 | nein | 894 | 66.076 | -0,0048 | 0,1569 | -0,1615 | 0,0032 | -50,08 | 0,0065 | 0,0157 | -0,1590 | -26,36 | -0,0548 | -0,2348 | kein Kandidat |
| 842 | W7 | 15m | short | 15m | 5-50 | 1.766 | -0,1305 | -63,40 | -27,62 | nein | 894 | 712.014 | 0,0210 | 0,1569 | -0,1361 | 0,0024 | -57,61 | 0,0047 | 0,0115 | -0,1414 | -34,99 | -0,0290 | -0,2090 | kein Kandidat |
| 843 | W1a | 1m | long | 1h | 5-50 | 1.766 | -0,1433 | -63,68 | -27,15 | nein | 894 | 454.595 | 0,0073 | 0,1569 | -0,1508 | 0,0026 | -57,15 | 0,0053 | 0,0129 | -0,1551 | -34,95 | -0,0427 | -0,2227 | kein Kandidat |
| 844 | W5 | 5m | long | schluss | 5-50 | 1.766 | -0,2117 | -64,45 | -20,47 | nein | 894 | 1.221.283 | -0,0665 | 0,1569 | -0,2125 | 0,0052 | -41,10 | 0,0103 | 0,0252 | -0,2008 | -34,10 | -0,2265 | -0,4865 | kein Kandidat |
| 845 | W6 | 1m | short | 1h | 50-250 | 1.766 | -0,0809 | -65,59 | -26,85 | nein | 894 | 1.164.873 | -0,0012 | 0,0854 | -0,0850 | 0,0015 | -56,44 | 0,0030 | 0,0073 | -0,0844 | -31,12 | -0,0512 | -0,2312 | kein Kandidat |
| 846 | W2 | 1m | short | 15m | 50-250 | 1.766 | -0,0865 | -67,13 | -24,97 | nein | 894 | 219.398 | 0,0007 | 0,0854 | -0,0843 | 0,0017 | -48,70 | 0,0035 | 0,0084 | -0,0779 | -27,74 | -0,0493 | -0,2293 | kein Kandidat |
| 847 | W1a | 1m | short | 1h | 5-50 | 1.766 | -0,1450 | -67,29 | -28,84 | nein | 894 | 449.166 | 0,0064 | 0,1569 | -0,1492 | 0,0025 | -59,35 | 0,0050 | 0,0123 | -0,1495 | -35,00 | -0,0436 | -0,2236 | kein Kandidat |
| 848 | W5 | 5m | short | schluss | 5-50 | 1.766 | -0,2072 | -67,42 | -19,38 | nein | 894 | 1.216.578 | -0,0426 | 0,1569 | -0,2108 | 0,0053 | -39,43 | 0,0107 | 0,0261 | -0,2014 | -32,92 | -0,2026 | -0,4626 | kein Kandidat |
| 849 | W6 | 5m | short | 1h | 5-50 | 1.766 | -0,1660 | -68,09 | -26,46 | nein | 894 | 940.404 | -0,0049 | 0,1569 | -0,1625 | 0,0031 | -51,80 | 0,0063 | 0,0153 | -0,1601 | -35,99 | -0,0549 | -0,2349 | kein Kandidat |
| 850 | W6 | 5m | long | 15m | 50-250 | 1.766 | -0,0893 | -68,85 | -30,58 | nein | 894 | 647.939 | -0,0041 | 0,0854 | -0,0896 | 0,0015 | -61,36 | 0,0029 | 0,0071 | -0,0897 | -31,86 | -0,0541 | -0,2341 | kein Kandidat |
| 851 | W6 | 1m | long | 15m | 250-1000 | 1.766 | -0,0649 | -69,81 | -31,94 | nein | 894 | 461.333 | -0,0003 | 0,0647 | -0,0656 | 0,0010 | -64,50 | 0,0020 | 0,0050 | -0,0662 | -34,90 | -0,0503 | -0,2303 | kein Kandidat |
| 852 | W6 | 1m | short | 15m | 250-1000 | 1.766 | -0,0631 | -71,13 | -25,91 | nein | 894 | 462.192 | -0,0028 | 0,0647 | -0,0669 | 0,0012 | -54,94 | 0,0024 | 0,0059 | -0,0711 | -36,69 | -0,0528 | -0,2328 | kein Kandidat |
| 853 | W1b | 1m | long | 15m | 50-250 | 1.766 | -0,0868 | -71,48 | -22,79 | nein | 894 | 388.787 | 0,0015 | 0,0854 | -0,0843 | 0,0019 | -44,29 | 0,0038 | 0,0093 | -0,0840 | -32,12 | -0,0485 | -0,2285 | kein Kandidat |
| 854 | W2 | 5m | long | 15m | 5-50 | 1.766 | -0,1603 | -71,93 | -31,87 | nein | 894 | 113.455 | -0,0017 | 0,1569 | -0,1583 | 0,0025 | -62,95 | 0,0050 | 0,0123 | -0,1547 | -35,94 | -0,0517 | -0,2317 | kein Kandidat |
| 855 | W5 | 1m | long | 15m | 250-1000 | 1.766 | -0,0678 | -74,18 | -31,63 | nein | 894 | 456.722 | -0,0020 | 0,0647 | -0,0673 | 0,0011 | -62,79 | 0,0021 | 0,0052 | -0,0659 | -35,97 | -0,0520 | -0,2320 | kein Kandidat |
| 856 | W1a | 1m | long | 15m | 50-250 | 1.766 | -0,0868 | -75,37 | -24,06 | nein | 894 | 435.356 | 0,0012 | 0,0854 | -0,0846 | 0,0018 | -46,88 | 0,0036 | 0,0088 | -0,0841 | -33,81 | -0,0488 | -0,2288 | kein Kandidat |
| 857 | W6 | 1m | long | schluss | 5-50 | 1.766 | -0,1408 | -76,41 | -29,17 | nein | 894 | 1.335.676 | 0,0057 | 0,1569 | -0,1442 | 0,0024 | -59,72 | 0,0048 | 0,0118 | -0,1482 | -42,44 | -0,1543 | -0,4143 | kein Kandidat |
| 858 | W5 | 1m | short | schluss | 5-50 | 1.766 | -0,2021 | -76,42 | -28,63 | nein | 894 | 1.217.985 | -0,0344 | 0,1569 | -0,1986 | 0,0035 | -56,27 | 0,0071 | 0,0172 | -0,1899 | -34,61 | -0,1944 | -0,4544 | kein Kandidat |
| 859 | W5 | 5m | short | 15m | 50-250 | 1.766 | -0,0908 | -76,44 | -31,15 | nein | 894 | 760.006 | -0,0058 | 0,0854 | -0,0911 | 0,0015 | -62,53 | 0,0029 | 0,0071 | -0,0871 | -42,37 | -0,0558 | -0,2358 | kein Kandidat |
| 860 | W1b | 1m | short | 15m | 50-250 | 1.766 | -0,0860 | -77,31 | -29,31 | nein | 894 | 392.636 | 0,0003 | 0,0854 | -0,0847 | 0,0015 | -57,71 | 0,0029 | 0,0072 | -0,0805 | -32,64 | -0,0497 | -0,2297 | kein Kandidat |
| 861 | W7 | 1m | long | 15m | 5-50 | 1.766 | -0,1575 | -77,78 | -32,98 | nein | 894 | 1.268.655 | 0,0101 | 0,1569 | -0,1474 | 0,0024 | -61,69 | 0,0048 | 0,0116 | -0,1474 | -33,32 | -0,0399 | -0,2199 | kein Kandidat |
| 862 | W5 | 1m | long | schluss | 5-50 | 1.766 | -0,1988 | -77,78 | -28,63 | nein | 894 | 1.211.689 | -0,0459 | 0,1569 | -0,1962 | 0,0035 | -56,53 | 0,0069 | 0,0169 | -0,1898 | -35,67 | -0,2059 | -0,4659 | kein Kandidat |
| 863 | W5 | 5m | long | 15m | 50-250 | 1.766 | -0,0889 | -79,97 | -26,26 | nein | 894 | 785.470 | -0,0049 | 0,0854 | -0,0905 | 0,0017 | -53,45 | 0,0034 | 0,0082 | -0,0873 | -44,54 | -0,0549 | -0,2349 | kein Kandidat |
| 864 | W6 | 5m | short | 15m | 50-250 | 1.766 | -0,0913 | -80,16 | -21,82 | nein | 894 | 648.930 | -0,0059 | 0,0854 | -0,0912 | 0,0021 | -43,62 | 0,0042 | 0,0102 | -0,0875 | -38,71 | -0,0559 | -0,2359 | kein Kandidat |
| 865 | W1a | 1m | short | 15m | 50-250 | 1.766 | -0,0859 | -80,53 | -31,04 | nein | 894 | 438.419 | -0,0000 | 0,0854 | -0,0850 | 0,0014 | -61,41 | 0,0028 | 0,0067 | -0,0809 | -35,89 | -0,0500 | -0,2300 | kein Kandidat |
| 866 | W1b | 5m | long | 15m | 5-50 | 1.766 | -0,1597 | -80,77 | -37,82 | nein | 894 | 191.648 | -0,0004 | 0,1569 | -0,1570 | 0,0021 | -74,38 | 0,0042 | 0,0103 | -0,1523 | -41,95 | -0,0504 | -0,2304 | kein Kandidat |
| 867 | W5 | 5m | short | 1h | 5-50 | 1.766 | -0,1804 | -81,38 | -31,77 | nein | 894 | 1.096.902 | -0,0184 | 0,1569 | -0,1761 | 0,0028 | -62,04 | 0,0057 | 0,0138 | -0,1690 | -43,38 | -0,0684 | -0,2484 | kein Kandidat |
| 868 | W6 | 1m | short | schluss | 5-50 | 1.766 | -0,1435 | -83,07 | -33,86 | nein | 894 | 1.337.754 | 0,0151 | 0,1569 | -0,1486 | 0,0021 | -70,12 | 0,0042 | 0,0103 | -0,1490 | -38,41 | -0,1449 | -0,4049 | kein Kandidat |
| 869 | W5 | 5m | long | 1h | 5-50 | 1.766 | -0,1823 | -83,15 | -36,26 | nein | 894 | 1.108.143 | -0,0212 | 0,1569 | -0,1776 | 0,0025 | -70,64 | 0,0050 | 0,0122 | -0,1727 | -45,14 | -0,0712 | -0,2512 | kein Kandidat |
| 870 | W1a | 5m | long | 15m | 5-50 | 1.766 | -0,1601 | -83,30 | -39,72 | nein | 894 | 219.442 | -0,0007 | 0,1569 | -0,1574 | 0,0020 | -78,12 | 0,0040 | 0,0098 | -0,1526 | -44,96 | -0,0507 | -0,2307 | kein Kandidat |
| 871 | W2 | 5m | short | 15m | 5-50 | 1.766 | -0,1584 | -84,58 | -34,11 | nein | 894 | 112.952 | -0,0018 | 0,1569 | -0,1590 | 0,0023 | -68,47 | 0,0046 | 0,0113 | -0,1566 | -36,49 | -0,0518 | -0,2318 | kein Kandidat |
| 872 | W7 | 1m | short | 15m | 5-50 | 1.766 | -0,1543 | -85,26 | -33,68 | nein | 894 | 1.261.014 | 0,0038 | 0,1569 | -0,1524 | 0,0023 | -66,54 | 0,0046 | 0,0112 | -0,1584 | -37,22 | -0,0462 | -0,2262 | kein Kandidat |
| 873 | W5 | 1m | short | 1h | 5-50 | 1.766 | -0,1705 | -90,55 | -34,80 | nein | 894 | 1.119.968 | -0,0105 | 0,1569 | -0,1663 | 0,0024 | -67,88 | 0,0049 | 0,0119 | -0,1627 | -41,84 | -0,0605 | -0,2405 | kein Kandidat |
| 874 | W5 | 1m | long | 1h | 5-50 | 1.766 | -0,1694 | -92,20 | -37,68 | nein | 894 | 1.113.512 | -0,0060 | 0,1569 | -0,1642 | 0,0022 | -73,06 | 0,0045 | 0,0110 | -0,1571 | -38,43 | -0,0560 | -0,2360 | kein Kandidat |
| 875 | W6 | 1m | long | 1h | 5-50 | 1.766 | -0,1529 | -92,83 | -43,90 | nein | 894 | 1.217.431 | 0,0021 | 0,1569 | -0,1560 | 0,0017 | -89,58 | 0,0035 | 0,0085 | -0,1566 | -57,04 | -0,0479 | -0,2279 | kein Kandidat |
| 876 | W1b | 5m | short | 15m | 5-50 | 1.766 | -0,1560 | -94,01 | -38,31 | nein | 894 | 190.133 | 0,0022 | 0,1569 | -0,1549 | 0,0020 | -76,07 | 0,0041 | 0,0099 | -0,1542 | -42,72 | -0,0478 | -0,2278 | kein Kandidat |
| 877 | W5 | 1m | short | 15m | 50-250 | 1.766 | -0,0879 | -97,13 | -41,73 | nein | 894 | 1.195.700 | -0,0049 | 0,0854 | -0,0899 | 0,0011 | -85,36 | 0,0021 | 0,0051 | -0,0908 | -47,57 | -0,0549 | -0,2349 | kein Kandidat |
| 878 | W1a | 5m | short | 15m | 5-50 | 1.766 | -0,1563 | -97,43 | -40,31 | nein | 894 | 217.693 | 0,0011 | 0,1569 | -0,1561 | 0,0019 | -80,50 | 0,0039 | 0,0094 | -0,1542 | -43,62 | -0,0489 | -0,2289 | kein Kandidat |
| 879 | W5 | 15m | short | 15m | 5-50 | 1.766 | -0,1577 | -99,13 | -42,98 | nein | 894 | 577.578 | -0,0021 | 0,1569 | -0,1593 | 0,0018 | -86,84 | 0,0037 | 0,0089 | -0,1576 | -52,84 | -0,0521 | -0,2321 | kein Kandidat |
| 880 | W2 | 1m | long | 15m | 5-50 | 1.766 | -0,1598 | -102,25 | -36,50 | nein | 894 | 264.006 | -0,0060 | 0,1569 | -0,1636 | 0,0022 | -74,74 | 0,0044 | 0,0107 | -0,1624 | -50,19 | -0,0560 | -0,2360 | kein Kandidat |
| 881 | W5 | 15m | long | 15m | 5-50 | 1.766 | -0,1637 | -102,31 | -45,67 | nein | 894 | 577.291 | -0,0039 | 0,1569 | -0,1605 | 0,0018 | -89,57 | 0,0036 | 0,0087 | -0,1633 | -55,02 | -0,0539 | -0,2339 | kein Kandidat |
| 882 | W6 | 1m | long | 15m | 50-250 | 1.766 | -0,0869 | -103,82 | -47,92 | nein | 894 | 1.271.510 | -0,0004 | 0,0854 | -0,0862 | 0,0009 | -95,06 | 0,0018 | 0,0044 | -0,0879 | -56,58 | -0,0504 | -0,2304 | kein Kandidat |
| 883 | W6 | 1m | short | 1h | 5-50 | 1.766 | -0,1548 | -105,01 | -42,09 | nein | 894 | 1.219.737 | -0,0042 | 0,1569 | -0,1598 | 0,0018 | -86,92 | 0,0037 | 0,0090 | -0,1596 | -48,80 | -0,0542 | -0,2342 | kein Kandidat |
| 884 | W2 | 1m | short | 15m | 5-50 | 1.766 | -0,1586 | -111,13 | -42,37 | nein | 894 | 263.110 | -0,0038 | 0,1569 | -0,1601 | 0,0019 | -85,50 | 0,0037 | 0,0091 | -0,1560 | -52,58 | -0,0538 | -0,2338 | kein Kandidat |
| 885 | W5 | 1m | long | 15m | 50-250 | 1.766 | -0,0873 | -111,18 | -47,94 | nein | 894 | 1.225.085 | -0,0024 | 0,0854 | -0,0883 | 0,0009 | -96,96 | 0,0018 | 0,0044 | -0,0888 | -55,59 | -0,0524 | -0,2324 | kein Kandidat |
| 886 | W6 | 1m | short | 15m | 50-250 | 1.766 | -0,0862 | -113,05 | -38,96 | nein | 894 | 1.276.637 | -0,0032 | 0,0854 | -0,0881 | 0,0011 | -79,68 | 0,0022 | 0,0054 | -0,0896 | -56,57 | -0,0532 | -0,2332 | kein Kandidat |
| 887 | W6 | 15m | long | 15m | 5-50 | 1.766 | -0,1663 | -115,49 | -44,24 | nein | 894 | 409.346 | -0,0090 | 0,1569 | -0,1656 | 0,0019 | -88,10 | 0,0038 | 0,0092 | -0,1626 | -54,39 | -0,0590 | -0,2390 | kein Kandidat |
| 888 | W1b | 1m | long | 15m | 5-50 | 1.766 | -0,1575 | -118,13 | -41,41 | nein | 894 | 423.212 | -0,0012 | 0,1569 | -0,1587 | 0,0019 | -83,48 | 0,0038 | 0,0093 | -0,1577 | -52,95 | -0,0512 | -0,2312 | kein Kandidat |
| 889 | W6 | 15m | short | 15m | 5-50 | 1.766 | -0,1697 | -122,75 | -50,04 | nein | 894 | 417.038 | -0,0079 | 0,1569 | -0,1651 | 0,0017 | -97,36 | 0,0034 | 0,0083 | -0,1628 | -60,85 | -0,0579 | -0,2379 | kein Kandidat |
| 890 | W1b | 1m | short | 15m | 5-50 | 1.766 | -0,1569 | -125,68 | -49,46 | nein | 894 | 419.046 | -0,0006 | 0,1569 | -0,1569 | 0,0016 | -98,92 | 0,0032 | 0,0077 | -0,1529 | -58,64 | -0,0506 | -0,2306 | kein Kandidat |
| 891 | W1a | 1m | long | 15m | 5-50 | 1.766 | -0,1577 | -127,51 | -43,80 | nein | 894 | 497.882 | -0,0005 | 0,1569 | -0,1580 | 0,0018 | -87,79 | 0,0036 | 0,0088 | -0,1561 | -56,54 | -0,0505 | -0,2305 | kein Kandidat |
| 892 | W6 | 5m | long | 15m | 5-50 | 1.766 | -0,1647 | -131,25 | -54,04 | nein | 894 | 1.071.015 | -0,0090 | 0,1569 | -0,1657 | 0,0015 | -108,72 | 0,0030 | 0,0074 | -0,1658 | -64,85 | -0,0590 | -0,2390 | kein Kandidat |
| 893 | W1a | 1m | short | 15m | 5-50 | 1.766 | -0,1563 | -132,53 | -52,34 | nein | 894 | 493.930 | -0,0009 | 0,1569 | -0,1572 | 0,0015 | -105,24 | 0,0030 | 0,0073 | -0,1535 | -62,34 | -0,0509 | -0,2309 | kein Kandidat |
| 894 | W5 | 5m | short | 15m | 5-50 | 1.766 | -0,1633 | -135,46 | -58,64 | nein | 894 | 1.216.577 | -0,0075 | 0,1569 | -0,1646 | 0,0014 | -118,26 | 0,0028 | 0,0068 | -0,1587 | -86,53 | -0,0575 | -0,2375 | kein Kandidat |
| 895 | W6 | 5m | short | 15m | 5-50 | 1.766 | -0,1676 | -142,96 | -40,22 | nein | 894 | 1.088.538 | -0,0091 | 0,1569 | -0,1663 | 0,0021 | -79,83 | 0,0042 | 0,0101 | -0,1614 | -67,83 | -0,0591 | -0,2391 | kein Kandidat |
| 896 | W5 | 5m | long | 15m | 5-50 | 1.766 | -0,1611 | -145,82 | -52,58 | nein | 894 | 1.221.280 | -0,0077 | 0,1569 | -0,1644 | 0,0015 | -107,36 | 0,0031 | 0,0075 | -0,1611 | -84,10 | -0,0577 | -0,2377 | kein Kandidat |
| 897 | W6 | 1m | long | 15m | 5-50 | 1.766 | -0,1604 | -156,06 | -73,44 | nein | 894 | 1.335.676 | -0,0025 | 0,1569 | -0,1600 | 0,0011 | -146,47 | 0,0022 | 0,0053 | -0,1610 | -87,40 | -0,0525 | -0,2325 | kein Kandidat |
| 898 | W5 | 1m | short | 15m | 5-50 | 1.766 | -0,1576 | -167,00 | -63,78 | nein | 894 | 1.217.985 | -0,0042 | 0,1569 | -0,1605 | 0,0012 | -129,93 | 0,0025 | 0,0060 | -0,1600 | -72,94 | -0,0542 | -0,2342 | kein Kandidat |
| 899 | W6 | 1m | short | 15m | 5-50 | 1.766 | -0,1597 | -174,69 | -62,90 | nein | 894 | 1.337.754 | -0,0057 | 0,1569 | -0,1619 | 0,0013 | -127,54 | 0,0025 | 0,0062 | -0,1613 | -82,90 | -0,0557 | -0,2357 | kein Kandidat |
| 900 | W5 | 1m | long | 15m | 5-50 | 1.766 | -0,1571 | -179,34 | -70,58 | nein | 894 | 1.211.689 | -0,0026 | 0,1569 | -0,1601 | 0,0011 | -143,84 | 0,0022 | 0,0054 | -0,1584 | -79,25 | -0,0526 | -0,2326 | kein Kandidat |

## 7. Klassenmix (nachrichtlich, aus dem Hauptlauf)

| ZR | Sicht | 5-50 | 50-250 | 250-1000 | ab1000 | Anteil 5-50 |
|---|---|---|---|---|---|---|
| 1m | gesamt | 33.115.738 | 28.424.753 | 8.152.910 | 1.452.745 | 46,55 % |
| 1m | bestaetigung | 10.101.551 | 9.643.132 | 3.491.347 | 695.486 | 42,21 % |
| 5m | gesamt | 26.341.631 | 13.601.827 | 3.498.375 | 605.043 | 59,80 % |
| 5m | bestaetigung | 8.063.786 | 4.919.534 | 1.512.720 | 287.938 | 54,54 % |
| 15m | gesamt | 11.986.012 | 5.841.556 | 1.489.207 | 256.763 | 61,24 % |
| 15m | bestaetigung | 3.731.846 | 2.120.225 | 645.985 | 122.708 | 56,37 % |

Das ist der Grund der Frage: der gepoolte `K_kand` ist fast der Wert der illiquiden Masse.

## 8. Was daraus folgt

1. **Die Erklärung „die Hürde der illiquiden Masse hat alles erschlagen" ist nicht widerlegt — sie ist
   bestätigt, aber sie rettet nichts.** Die Zahl der Tor-1-Zeilen steigt monoton mit der Liquidität
   (0 / 2 / 4 / 9 über die vier Klassen), und der gepoolte `K_kand` ist fast der Wert der
   billigsten Klasse. Wer nur gepoolt misst, sieht in dieser Familie nichts, was in `ab1000` sichtbar ist.
2. **Das gepoolte Nein des Hauptlaufs bleibt stehen.** Diese Tafel ist post hoc, ihre Testzahl ist 900,
   und sie kann kein „belegt" vergeben. Sie verschiebt nichts an `ERGEBNIS.md`.
3. **Alles hängt an einem Detektor.** Alle 15 Tor-1-Zeilen gehören zu **W7**, keinem der sieben anderen.
   Das macht den Fund nicht falsch, aber es ist keine Aussage über „Wenden", sondern über diese eine Funktion.
4. **Die offene Frage ist das Vorzeichen über die Haltedauer.** Derselbe Detektor trennt die Folgemengen auf
   15m und 1h in die **entgegengesetzte** Richtung (Spiegel-Summe bis −0,21 Pp) und dreht mit der Haltedauer.
   Eine Wende, die auf einer Stunde das Gegenteil und auf einem Tag das Behauptete tut, ist entweder zwei
   verschiedene Sachen oder eine Eigenschaft des Messfensters. Diese Frage steht vor jedem Vorwärtstest.
5. **Für die Methode:** Umsatzklassen gehören in jede künftige Vorregistrierung dieser Familie als
   **vorab festgelegte** Schnittdimension — nicht als nachträgliche Suche. Ein gepoolter `K_kand`, der fast
   der Wert der billigsten Klasse ist, ist keine Kostenannahme, sondern ein Mischungsartefakt.

## 9. Herkunft und Laufzeit

| Ordner | Dateien | Reihen | beendet | Kennung |
|---|---|---|---|---|
| voll-0 | 5.613 | 913 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-1 | 5.605 | 913 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-2 | 5.803 | 913 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-3 | 5.606 | 912 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-4 | 5.702 | 912 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-5 | 5.618 | 912 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-6 | 5.573 | 912 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |
| voll-7 | 5.576 | 912 | vollstaendig | trendwende-ii-2026-09-09/v4/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre+verzoegert1 |

Kalender 2.680 Tage, Bestätigung ab 2023-02-07 (Index 1786), Regime ab 2021-01-01 (Index 1259), letzte 250 Tage ab 2025-09-03.
Auswertung 11 s, erzeugt 2026-09-13T09:37:15.953Z.
