# Vorregistrierung: Trendwende II — Wenden auf Minutenbasis, mit Aktie und Schein bewertet, je Jahr gelesen — 12.09.2026

**Geschrieben und committet, BEVOR eine Rendite gerechnet wurde.** Rolle: Studien-Chat (Berechnungen).
Auftrag: `Markt-Dashboard-Daten/uebergabe/auftrag-trendwende-ii-2026-09-09.md` (PM, 09.09.2026).
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

Quelle: das Alpaca-Minutenarchiv auf `E:/Markt-Dashboard-Archiv/` (`alpaca1m/` roh, `alpaca1m-bereinigt/` nur über
`lesen.js`, `alpaca-massnahmen/`), **nur lesend** — keine Sperre, keine Schlüssel, kein Netz, kein Yahoo. Die Studie
schreibt ausschließlich in diesen Ordner (Phase 2: die zwei `JAHRESSCHEIBEN.md` und die additiven `--jahre`-Optionen, §12).

---

## 0. Die Frage (Wilhelm, 09.09.2026)

> „Unsere Strategie muss in jeder Marktlage funktionieren. Ich will keine langen Positionen halten, sondern jeden Trend
> mitnehmen — also eine Trendwende feststellen und sie je nachdem mit einem Call oder Put mitnehmen. Und da müssen wir
> einen optimalen Weg im Gewinn/Kosten-Verhältnis finden." — „Sollten wir nicht nur ein Handelsjahr betrachten?"

In eine messbare Frage übersetzt: **Gibt es einen Wende-Detektor (Familien W1–W8), dessen Überschuss gegen den Topf nach
der gemessenen Kassa-Hürde seiner Umsatzklasse über Minuten bis eine Nacht eine Kante hat — in den letzten 250
Handelstagen noch lebt — und der zusätzlich die Hürde eines Optionsscheins (Call/Put) übersteht?** Jedes Ergebnis wird
außerdem **je Kalenderjahr** und **je Marktlage** (SPY über/unter EMA200) gelesen.

Was schon gemessen ist und hier **nicht neu erfunden** wird (Pflichtlektüre):

- **Trendwende 21./22.08.** (`studien/33-winkel-detektor/README.md`, Issue #33, Felix' Detektor): auf 99 Werten, 60 Tagen
  Yahoo-1m waren Wende-**Longs** nach bestätigtem Tief in allen Familien unter der Drift (t bis −6,3), Wende-**Shorts**
  brutto positiv (t bis +9,1), tot an 0,10 % Kosten. Winkel-Detektor OOS +0,074 Pp brutto, netto −0,026, marktneutral
  0,103 (t 1,69) — „ein kleiner echter Effekt ist wahrscheinlich, aber nicht belegt".
- **Produkthürden** (`studien/signalstudie-2026-08/BERICHT.md`, Tabelle „Produkt / Hebel / 3 h / 1 Tag"; `wiki/kosten.md`):
  Standard-Schein ATM 21 T (Hebel 16,2) **0,23 Pp je 3 h / 0,42 je Tag**; Schein ATM 60 T BV 1,0 (Hebel 9,8) **0,05 / 0,16**;
  US-Option ATM 21 T 0,27 / 0,46; Schein 5 % OTM 10 T 0,61 / 1,11. Kassa-Aktie je Umsatzklasse (Fenster `mitte`, ab 2021):
  **0,1569 / 0,0854 / 0,0647 / 0,0449 Pp je Umlauf**.
- **Signalstudie Minuten** (`studien/vorregistrierung-2026-09-06-signale-minuten/`, 5m/15m 08.09., 1m 11.09.): **0 von 234**
  Konfigurationen belegt; bestes Brutto 0,152 Pp (vwap-abstand 5m long bis Schluss, Bestätigung netto −0,014); 1m:
  64 von 75 „in jeder Klasse zu", Kapitulation long bis Schluss Bestätigung netto +0,003 (t 0,1); Placebos sauber;
  realisierte Auflösung auf 1m delta80 0,05–0,08 Pp. `kapitulation`, `kanaltrend` und `wendepunkt-trendwechsel` sind dort
  auf allen drei Zeitrahmen mit 1 h / 3 h / bis Schluss gemessen — hier laufen sie erneut, mit 15 min, Übernacht und der
  Schein-Zeile; die alten Zahlen bleiben Referenz, kein Ersatz.
- **Regime** (`wiki/belegstand.md`: „SPY > EMA200 als Gate +0,098 Pp, t 2,6; Regime-Zuteilung R-TREND t 3,2 — rsi2seit
  über der EMA200, Kapitulation darunter"). „In jeder Marktlage" heißt deshalb: je Lage messen, nicht eine Regel für alle.

Die gesuchte Kante ist damit nicht ausgeschlossen, aber eng: sie müsste auf Minuten bis eine Nacht leben, die Kassa-Hürde
ihrer Klasse schlagen — und für Call/Put zusätzlich 0,23 Pp je drei Stunden (Standard-Schein) bzw. 0,05 Pp (BV 1,0).

## 0.1 Gesehene Zahlen — vollständig deklariert

**Keine einzige Rendite, kein Signal, keine Zelle dieser Studie wurde berechnet.** Gesehen wurden zur Planung, alle aus
fertigen Berichten oder Meta-Dateien:

| Größe | Wert | Woher |
|---|---|---|
| Handelstage im Fenster 2016-01-04 … 2026-08-31 (ET) | **2.680**, Entdeckung 1.786, Bestätigung 894 ab 2023-02-07, ab 2021 1.421 | Registrierung Minutenstudie §5 (`_kalender.json`) |
| Reihen mit Eintrag im Vollauf / lebend / nicht lebend | 7.299 / 2.306 / 4.993 | `ergebnis-gesamt-2026-09-11/ERGEBNIS.md` §0 |
| Dateien je Zeitrahmen-Vollauf / GB / reguläre Kerzen (beide Läufe) | 45.096 / 122 / 4,74 Mrd | ebenda |
| Laufzeit Minutenstudie | 5m/15m 16,7 h in 8 Teilen; 1m 09.09. 09:57 – 11.09. 07:57 (drei Unterbrechungen) | Auftrag §4, `belegstand.md` |
| Ergebnisse der Minutenstudie, #33, Kostentabellen | wie in §0 zitiert | `belegstand.md`, `README.md` #33, `BERICHT.md`, `kosten.md` |
| OOS-Zelle der #33-Neubewertung | S = 0,5, F = 6 („bester Short-Bucket") | `zusatzpruefungen.js` Zeile 14 |

---

## 1. Was gemessen wird — Daten, Universum, Regeln: alles wie in der Minutenstudie

Per `require` **unverändert wiederverwendet** aus `studien/vorregistrierung-2026-09-06-signale-minuten/` (`konfig.js`
für Kalender, Klassen, Hürden, Split, Lebend-Regel, Cent-Boden, Maßnahmenfenster; `lesen.js` für Reihen, Jahresdateien,
Rohfaktor, Verdichtung 5m/15m, Tage). Die Zahlen, damit sie hier stehen:

| Regel | Wert | Fundstelle |
|---|---|---|
| Datenfenster (ET) | 2016-01-01 … 2026-08-31; Kalender 2016-01-04 … 2026-08-31 | Minutenstudie §2 |
| Universum | nur CS/ADRC (`wertpapierarten.json`), mit Verschwundenen, `~2`-Reihen eigenständig | Nachtrag 1.8 |
| Dichteregel | ≥ 80 % der Sollkerzen **je Zeitrahmen** (390/78/26; Halbtag 210/42/14) | Nachtrag 1a |
| Umsatzklasse | `Liquide.medianUmsatz` über 20 Balkentage d−20 … d−1; Grenzen 5/50/250/1.000 Mio $; < 5 Mio $ ohne Klasse | §3, Nachtrag 1.19 |
| Kassa-Hürde K je Umlauf (mitte, ab 2021) | 5–50 **0,1569** · 50–250 **0,0854** · 250–1.000 **0,0647** · ab 1.000 **0,0449** Pp | `wiki/kosten.md` |
| Einstiegsfenster-Hürde (nachrichtlich, Feld `h2`) | vor 10:00 ET K × 2,68 / 2,46 / 2,07 / 1,81; ab 15:30 (Halbtag 12:30) 0,1025 / 0,0540 / 0,0409 / 0,0329 | Nachtrag 1.12 |
| Maßnahmenfenster | ± 10 Handelstage um Ex-Tage (Splits, Abspaltungen); bereinigt gelesen nur die nicht angewandten | §8 |
| lebend | letzter Balken ≥ 2026-08-17 ET | Nachtrag 1.13 |
| Entdeckung / Bestätigung | 2016-01-04 … 2023-02-06 / **2023-02-07 … 2026-08-31**; Urteil ab 2021 | §5 |
| Zulässige Signalkerze | ≥ 30 Minuten Sitzung nach Kerzenende, Folgekerze vorhanden; **Cooldown 60 Minuten** je (Reihe, Detektor, Zeitrahmen) | §2, Nachtrag 1.16 |
| Einstieg | Eröffnung der Kerze i+1 (`bars[i+1][5]`) — kein Kurs, den das Signal sieht | §2 |
| Cent-Boden | 0,005 $ je Umlauf auf dem **rohen** Kurs; Σ Einstiegskurs und Zahl über der Klassenhürde je Zelle, kein Filter | Nachtrag 3.3 |
| Placebo A / B | k zufällige zulässige Kerzen des Tages, Zufallsrichtung / gepaart im 30-Minuten-Fenster, gleiche Richtung; Saat aus (Reihe, Tag, Detektor, ZR) | §7a, Nachtrag 1.4 |
| Topf | alle zulässigen Kerzen aller Reihen, Long-Ertrag je (ZR, H, ET-Tag, Klasse, lebend) | §7b |
| Kassa-Short | dieselbe Hürde als Untergrenze; **nie „handelbar"** als Aktie (Leihe ungemessen) | Nachtrag 2.4 |

**Zeitrahmen:** 1m aus der Datei, 5m und 15m verdichtet (`lesen.verdichte`, Viewer-Funktion). **Ein Lesedurchlauf für
alle drei Zeitrahmen** (Aufteilung des Vollaufs nur nach Reihen `--teil k/8`, nie nach Umsatzklasse; `--zeitrahmen` bleibt
als Notausgang wie dort).

## 2. Detektoren — neun Familien der Wende, jede eine reine Funktion `signal(bars, i, params) -> {dir:+1|-1}|null`

Alle sehen nur `bars[0..i]` (Kerzen `[t, schluss, umsatz, hoch, tief, eroeffnung]` auf dem Sitzungsraster), halten keinen
Signalzustand; die einzigen Caches sind Datencaches (Wendepunktlisten je Reihe — ein Wendepunkt bei j sieht `bars[j−F..j+F]`
und wird erst ab `i ≥ j+F` benutzt, was die Präfix-Probe Signal für Signal prüft). Muster: `_tabelle.js` der August-Studie.
`kanalUeber` und `wendepunkte` sind die Funktionen aus `quant.js` (Zeilen 2396/2419), Winkel `w = steigung · n / breite`.

| Kürzel | Familie | Definition — EXAKT | Richtungen | Herkunft |
|---|---|---|---|---|
| **W1a** | Winkel, Schwelle | **Zeilengleich zu `detect()` in `studien/33-winkel-detektor/hauptstudie.js`** mit der OOS-Zelle **S = 0,5, F = 6**: Wendepunkte `Q.wendepunkte(bars, 6)` über die **fortlaufende** Reihe (Abschnitte dürfen die Nacht überspannen, wie dort); bestätigt ab `w.i + 6 ≤ i`; Vortrend-Winkel `wAlt` = Winkel des Kanals `kanalUeber(bars, wVor.i, wLetzt.i)` zwischen den zwei jüngsten bestätigten Wendepunkten; Abschnitt offen nur, wenn **|wAlt| ≥ 0,5**; junger Kanal `kanalUeber(bars, wLetzt.i, i)` ab **i − wLetzt.i ≥ 10**; Signal, wenn **|wNeu| ≥ 0,5** (S) und `sign(wNeu) ≠ sign(wAlt)`; Richtung `wNeu > 0 → long`, sonst short; **nur die erste Kerze je Abschnitt** (dort `sectionDone`). Der Cooldown 60 Kerzen und MIN_REST 30 von `detect()` werden durch die Regeln aus §1 (60 Minuten, 30 Minuten) ersetzt — auf 1m identisch; die Gleichheitsprobe (§14) zählt die Abweichungen, die nur aus dieser Zustandsregel entstehen | long, short | Felix (#33), Neubewertung 22.08. |
| **W1b** | Winkel, stark | dieselbe Funktion, Abschnitt offen nur bei **|wAlt| ≥ 1,0** (der „Gewichts"-Vorschlag aus #33 als zweite Schwelle; ein echtes Gewicht bräuchte ein Zellenfeld — nicht in diesem Auftrag). S = 0,5, F = 6 wie W1a | long, short | #33 Vorschlag |
| **W2** | Wendepunkt-Trendwechsel | August-Tabelle `wendepunkt-trendwechsel` **unverändert** (per `require`): `Q.trendwechsel`-Logik, **S = 1,0, F = 5**, MIN_JUNG 10, Vortrend-Schwelle 0,5 (in `urteil()` fest), `ersteImAbschnitt`; **1m auf der Tagesreihe ab 59 Kerzen, 5m/15m fortlaufend** (`PARAM_JE_ZR` der Minutenstudie); Präfix-Probe gegen `signalPraefix` (Referenz `Q.trendwechsel(bars.slice(0, i+1))`) | long, short | App (`Q.trendwechsel`), #33/#35 |
| **W3** | Kapitulation | August-Tabelle `kapitulation` **unverändert**: `Q.einstiegSignal` ENTRY kapitulation, EMA20, ZTHR 2,0 (z ≤ −2 zur Leitlinie), Kanal `kanalUeber(bars, i−200, i)` mit `trend = 'ab'`, Umsatz der Signalkerze > 1,3 × Ø der 50 davor, i ≥ 260 | **nur long** | August, App |
| **W4** | Erschöpfung/Klimax | **N = 5** Kerzen in eine Richtung, alle im selben Tag: Aufwärtslauf ⇔ für k = i−4 … i−1 gilt `hoch[k] > hoch[k−1]` **und** `tief[k] > tief[k−1]`, und die letzte Kerze i macht ein neues Hoch `hoch[i] > hoch[i−1]`; **Umsatz der letzten Kerze ≥ 3 × Median** der Umsätze der Tageskerzen `d.von … i−1` (mindestens **10** Kerzen seit Tagesanfang, sonst kein Signal); **Schluss der letzten Kerze innerhalb der Spanne der vorletzten**: `tief[i−1] ≤ schluss[i] ≤ hoch[i−1]` → **short**. Abwärtslauf spiegelbildlich (tiefere Tiefs und Hochs, neues Tief, Schluss in der Vorspanne) → **long**. Tagesanfang = erste Kerze desselben UTC-Tages (`tagVon`, wie `_tabelle.js`) | long, short | neu (Auftrag) |
| **W5** | Dow-Struktur | Wendepunkte `Q.wendepunkte(bars, 5)` (**F = 5**: Hoch bei j, wenn alle Hochs in j±5 kleiner sind) über die **fortlaufende** Reihe; bestätigt ab `j + 5 ≤ i`. **Short** an der Kerze `i = H2.i + 5`, an der das jüngste Hoch H2 bestätigt wird, wenn das zuvor bestätigte Hoch H1 (das letzte bestätigte Hoch vor H2) **höher** liegt (`H2.preis < H1.preis`) und **H2.i − H1.i ≥ 10** (Mindestabstand). **Long** spiegelbildlich: jüngstes bestätigtes Tief höher als das vorige (`T2.preis > T1.preis`), Abstand ≥ 10, Signal bei `i = T2.i + 5`. Genau eine Signalkerze je Wendepunkt (nur an der Bestätigungskerze) | long, short | August-Familie |
| **W6** | V-Umkehr | **k = 3, m = 12** Kerzen, alles im selben Tag. σ = Standardabweichung der 20 Kerzenrenditen `(c[t]−c[t−1])/c[t−1]`, t = a−19 … a (fortlaufende Reihe, ≥ 21 Kerzen davor). Aufwärts-V (→ **short**): b = Index des **höchsten Schlusses** in `[i−12, i−1]`; a = Index des **tiefsten Schlusses** in `[b−12, b−1]` (a ≥ Tagesanfang); Bewegung `c[b] − c[a] ≥ 3 · σ · c[a]`; Rücklauf `c[b] − c[i] ≥ 0,5 · (c[b] − c[a])`, und an der Vorkerze noch nicht (`c[b] − c[i−1] < 0,5 · (c[b] − c[a])`) — die **erste** Kerze, an der 50 % erreicht sind. Abwärts-V spiegelbildlich (tiefster Schluss b, höchster a davor, Rücklauf nach oben) → **long** | long, short | August-Familie |
| **W7** | RSI-Divergenz | **RSI(14) = `Q.rsi`** (quant.js Zeile 33: einfaches Mittel der Gewinne/Verluste über 14 Kerzen, fortlaufende Reihe). **Short**: `c[i] > max c[i−60 … i−1]` (neues 60-Kerzen-Hoch) **und** `RSI(i) < max RSI[i−60 … i−1]` (RSI macht kein neues Hoch). **Long**: `c[i] < min c[i−60 … i−1]` und `RSI(i) > min RSI[i−60 … i−1]`. Braucht i ≥ 74 | long, short | August-Familie |
| **W8** | Kanaltrend (Auftrag: „Gegen-Kanaltrend") | August-Tabelle `kanaltrend` **unverändert** (`gegen-kanaltrend.js` ist die Gegenprüfung dieser Funktion und ruft sie wörtlich): `Q.einstiegSignal` ENTRY kanaltrend, MINQ 60, ZTHR 1,5, EMA20-Kreuzung (15 Bp) **in Kanalrichtung** auf dem 261er-Fenster, Kanal gültig, kein Ausbruch; Vorfilter `Q.signalCross` wie in der Minutenstudie (Gleichheitsprobe dort) | long, short | August |

**Ausgewiesen, vor der ersten Zelle:** W8 ist nach seinem Code eine **Trendfolge** (Kreuzung in Kanalrichtung), kein
Wende-Detektor; die Umschreibung des Auftrags „Rücklauf gegen den Abschnittskanal" trifft keine Funktion des August-Ordners.
Er läuft, weil der Auftrag ihn nennt und weil er die einzige Kanal-Referenz gegen W1/W2 ist; im Bericht steht er unter
„Referenz Trendfolge", nicht unter „Wende". Fällt der PM anders, wird die Zeile gestrichen, nicht umgedeutet (offene Frage
in der Übergabe). Ein zehnter Detektor wird nicht aufgenommen.

**Zählung:** 9 Detektoren, davon 8 beidseitig, W3 nur long ⇒ 17 (Detektor, Richtung) × 3 Zeitrahmen × 5 Haltedauern =
**255 Konfigurationen** (Obergrenze des Auftrags 300). Familie im Sinne der Überlebens-Differenz: **Wende-Winkel** (W1a,
W1b, W2), **Wende-Struktur** (W4, W5, W6, W7), **Dip** (W3), **Trendfolge-Referenz** (W8).

## 3. Haltedauern — fünf, Ausstieg wie in der Minutenstudie, eine neue

| Kürzel | Ausstieg | Anmerkung |
|---|---|---|
| `15m` | Eröffnung der ersten Kerze j mit `t_j ≥ t_{i+1} + 15 min` | neu (kürzester Horizont; auf 15m-Kerzen = die Folgekerze) |
| `1h` | … + 60 min | wie dort |
| `3h` | … + 180 min | wie dort |
| `schluss` | Schluss der letzten regulären Kerze des Tages (15:59-Kerze; Näherung für die Schlussauktion) | wie dort, Nachtrag 1.14 |
| `naechste` | **Eröffnung der ersten regulären 1m-Kerze des nächsten Kalender-Handelstags** der Reihe (`kal.idx[Tag] + 1`); hat die Reihe an diesem Tag keine Kerze, **keine Beobachtung** (gezählt `ohneHorizont[naechste]`) | **Übernacht** — die einzige „lange" Position; keine längere |

Gibt es innerhalb der Sitzung keine Ausstiegskerze (15m/1h/3h), hat der Horizont keine Beobachtung (wie dort). Der
Übernacht-Ausstieg am **letzten Handelstag einer Jahresdatei** kommt aus der ersten Kerze der Folgedatei: offene Zellen-
Beiträge (Kandidat, Placebo A/B, Topf) werden mit dem Warmlauf in die nächste Datei übergeben und dort verbucht (sie
gehören dann zur Folgedatei: „ganz oder gar nicht" gilt je Datei). Nach einer **Fortsetzung aus dem Checkpoint** fehlt
diese Übergabe für die erste Datei je Reihe — gezählt als `fortsetzungOhneUebernacht` (Dateien), nie geschätzt. Am
31.08.2026 gibt es keinen Folgetag: keine Beobachtung, gezählt. Ist der Folgetag im Kalender, aber die Reihe hat dort
keine Kerzen (Lücke), keine Beobachtung. Der Eröffnungskurs ist derselbe auf allen drei Zeitrahmen (Eröffnung der ersten
1m-Kerze).

**Ertrag:** `r = dir · (Ausstieg − Einstieg) / Einstieg · 100` in Pp. **Topf, Placebo A und B** laufen für alle fünf
Haltedauern mit denselben Regeln (Nachtrag 1.22 dort).

## 4. Kosten — zwei Zeilen je Konfiguration, beide hier festgelegt

**Zeile 1 — Kassa-Hürde je Umsatzklasse** (§1; Endpunkt K_mitte ab 2021, Einstiegsfenster-Hürde `h2` nachrichtlich). Sie
entscheidet **belegt / widerlegt als Größe / nicht entscheidbar** und **handelbar** wie in der Minutenstudie. Für
`naechste` liegt der Ausstieg im Eröffnungsfenster des Folgetags — die Einstiegsfenster-Hürde deckt nur den Einstieg;
die Übernacht-Zeile trägt deshalb den Vermerk „Ausstieg in der Eröffnung, Faktor 1,8–2,7 auf die halbe Runde nicht
enthalten" (Kassa: F = 0, keine Übernachtfinanzierung, `kosten.md`).

**Zeile 2 — Schein-Hürde, zwei Produkte, Konstanten aus `BERICHT.md`** (Tabelle „Produkt / Hebel / 3 h / 1 Tag";
`konfig.js` nennt die Quelle, `test.js` liest die Tabelle aus der Datei und hält die Zahlen dagegen):

| Produkt | 15m / 1h / 3h | schluss / naechste | Herkunft |
|---|---|---|---|
| **Schein BV 1,0, ATM 60 T** (Hebel 9,8) — das billigere | **0,05** | **0,16** | Spalten „3 h" / „1 Tag" |
| **Standard-Schein ATM 21 T** (Hebel 16,2) — der Schein der App | **0,23** | **0,42** | dieselben Spalten |

Der Schein **ersetzt** die Kassa-Hürde (seine Zahl enthält Spanne durch Hebel plus Zeitwert/Finanzierung in Pp des
Basiswerts): `netto_schein = brutto − K_schein(H)`. Für 15m und 1h gilt der 3-h-Wert (Untergrenze der Tabelle; ein
kürzerer Wert ist nicht gemessen — ausgewiesen). Je Konfiguration stehen im Bericht `netto_schein_B` (Tagesmittel der
Bestätigung, beide Produkte) und `t` dazu.

**Flagge „handelbar mit Schein"** (Wilhelms Call/Put-Frage in einer Zahl), **zweimal**, je Produkt:
`belegt` **und** `delta80 ≤ K_Kandidat` (Auflösung) **und** `netto_Fenster_B > 0` **und** `netto_schein_B > 0` für das Produkt.
Das ist „handelbar" der Minutenstudie **ohne das Leihe-Veto** — mit einem Put braucht es keine Wertpapierleihe; Short-Zeilen
können deshalb „handelbar mit Schein" werden, bleiben aber als Aktie „nein (Leihe)". Auslegung dieser Rolle, dem PM zur
Bestätigung vorgelegt (Übergabe). Nachrichtlich daneben: `delta80` gegen die Schein-Hürde (ob die Auflösung den Schein
überhaupt sehen könnte).

## 5. Ergebnisgrößen und Vorrang — wie in der Kanalstudie (§6 dort)

| Größe | Formel | Rolle |
|---|---|---|
| **Hauptgröße `u`** — Überschuss gegen den Topf, netto | `u = dir · (rLong − Topf) − K_Klasse`; Topf = Zelle (ZR, H, ET-Tag, Klasse, lebend) aller zulässigen Kerzen | entscheidet belegt / widerlegt als Größe / nicht entscheidbar |
| Nebengröße `n` — roher Netto-Ertrag | `n = r − K_Klasse` | **handelbar** verlangt zusätzlich Tagesmittel_B(n) > 0 |
| Nebengröße `nF` — Netto mit Einstiegsfenster-Hürde | `r − h2` | stuft „belegt" zu „belegt, aber Eröffnungskosten" herab; „handelbar" verlangt nF_B > 0 |
| `s1`, `s2` — Schein-Netto | `r − K_schein(H)` je Produkt | erzeugt nur „handelbar mit Schein" (§4) |
| Brutto | `r` | steht überall daneben |

Das ist die Umkehr der Vorrangregel der Minutenstudie (dort Urteil über `n`, Topf nur herabstufend — Nachtrag 1b.1 dort),
so wie der Auftrag §1 es festlegt („Überschuss je Signal gegen den Nullpunkt (Topf) minus Kassa-Hürde") und wie die
Kanalstudie es hält. Grund: Wenden werden an Tagen gefunden, an denen der Markt selbst dreht; ein rohes `n` mischte den
Tag mit dem Signal.

## 6. Aggregation — der Tag ist die Clustereinheit; Übernacht mit Hansen-Hodrick

Je (Konfiguration, ET-Tag) das Mittel über alle Signale des Tages (alle Reihen, Klassen gepoolt, jede Hürde je Signal).
Die Tagesreihe trägt das Urteil; Signaltage, Signale, Reihen werden getrennt gezählt (Minutenstudie §4, Nachtrag 1.7).

- **Intraday (15m, 1h, 3h, schluss):** keine Überlappung — `se = sd(Tagesmittel) / √nTage`, `t = Mittel / se` (wie dort).
- **Übernacht (`naechste`):** `se` primär **Hansen-Hodrick mit Rechteckgewichten bis Lag 1** (L = 2 in der Notation der
  Kanalstudie: `LRV = γ₀ + 2·γ₁`, Lags in Handelstag-Abständen des Kalenders), `se = √(LRV / nTage)` — die Funktion
  `momente(paare, L)` aus `studien/vorregistrierung-2026-09-08-trendkanal-tage/auswerten.js` wird **per `require`**
  wiederverwendet (Formel dort §7); Newey-West und Block-se stehen nachrichtlich daneben; fällt HH ≤ 0 aus, gilt der
  Block-Wert mit Marke `HH<0`. Intraday-Zeilen laufen durch dieselbe Funktion mit L = 1 (= naive se).

Im Speicher liegen nur **Summen** je Zelle (§10): `n, Σr, Σr², Σh2`; netto folgt daraus (K je Zelle konstant), Topf und
Schein-Zeilen ebenso.

## 7. Entdeckung, Bestätigung, Tore, Bonferroni — wie in der Minutenstudie, plus das Aktualitäts-Tor

Split und Regimeschnitt wie §1 (Bestätigung 894 Tage ab 2023-02-07, Urteil ab 2021). `se_B` aus der **u-Tagesreihe der
Bestätigung** (Streuung, nicht Mittel), `MDE_B = 2 · se_B`.

1. **Tor 1 — Entdeckung `u` ≥ 4 × MDE_B** und Entdeckungs-Tagesmittel(u) > 0. Durchgefallen ⇒ „kein Kandidat". k₁.
2. **Tor 2 — `delta80 = (z_Bonf(k₁) + 0,8416) · se_B < K_Kandidat`**, K_Kandidat = signalgewichtetes Mittel der Klassenhürden
   über die Signalzahlen je Klasse in der Bestätigung (Zählung, keine Rendite; Nachtrag 1.6 dort). Sonst „nicht
   entscheidbar", spart Bonferroni. k₂.
3. **Bonferroni über k₂:** `z_Bonf(k) = Φ⁻¹(1 − 0,025/k)`; k = 1 ⇒ 1,96, 5 ⇒ 2,58, 10 ⇒ 2,81, 20 ⇒ 3,02, 50 ⇒ 3,29
   (Nachtrag 1.1 dort; `auswerten.js` prüft sich an diesen Werten).
4. **Aktualitäts-Tor (neu, vorregistriert, gilt für `belegt`):** in den **letzten 250 Handelstagen des Kalenders**
   (Kalenderindex nTage−250 … nTage−1, also bis 2026-08-31; das Datum des ersten Tages steht im Bericht) muss das
   Netto-Tagesmittel(u) **> 0** und **t > −2** sein (se wie §6, Sicht alle, Klassen gepoolt). Begründung: ein Mittel über
   dreieinhalb Bestätigungsjahre kann eine 2025 gestorbene Kante als lebendig zeigen. Signaltage in den 250 Tagen < 10 ⇒
   Tor nicht prüfbar ⇒ nicht belegt („zu wenig Aktualität").

**Die Wörter, als Regel mit Zahl:**

- **belegt:** Tor 1, Tor 2 und Aktualitäts-Tor bestanden; Bestätigung ab 2021 mit **≥ 30 Signaltagen**; Tagesmittel_B(u)
  > 0 und `t_B ≥ z_Bonf(k₂)`; Vorzeichen wie in der Entdeckung; Placebo im Band (§8). Herabstufungen wie dort: „belegt,
  aber Eröffnungskosten" (nF_B ≤ 0).
- **widerlegt als Größe:** obere 95-%-Grenze des **Brutto**-Tagesmittels_B < K_Kandidat („in seiner Klasse zu");
  < 0,0449 ⇒ „in jeder Klasse zu". Größenaussage, kein Nachweis von null; für alle Konfigurationen mit ≥ 30
  Bestätigungs-Signaltagen (Nachtrag 1.20 dort). **Dazu neu:** obere Grenze < 0,05 ⇒ „für jeden Schein zu"; < 0,23 ⇒
  „für den Standard-Schein zu" — nachrichtliche Spalten, dieselbe Arithmetik.
- **nicht entscheidbar:** alles andere.
- **handelbar** (Aktie): belegt ∧ `delta80 ≤ K_Kandidat` ∧ Tagesmittel_B(n) > 0 ∧ nF_B > 0; Short **nie** (Leihe).
- **handelbar mit Schein** (BV 1,0 / Standard, getrennt): §4.
- **Kandidat für den Vorwärtstest:** **nicht belegt** ∧ in den letzten 250 Handelstagen ≥ **30** Signaltage ∧
  Tagesmittel_250(u) > 0 ∧ **t_250 ≥ 2,0**. Gelistet mit Zahlen (u, n, beide Schein-Netto), **kein Urteil**; die
  Prüfung geschieht an den Daten ab 2026-09-01, die Live-Sammler und Nachlauf täglich anhäufen (eigener Auftrag, nicht
  dieser). Erwartete Zahl zufälliger Kandidaten bei 255 Konfigurationen und t ≥ 2 einseitig: ≈ 6 — die Liste ist eine
  Rangliste, kein Befund. Eine nur im letzten Jahr lebendige Kante wird **nie** belegt.

## 8. Kontrollen — Placebo-Schranken je Skala (Fehlerform vom 09.09.)

- **Placebo A gegen den Topf, gerichtet** (`dir_p · (rohLong_p − Topf)`, Nachtrag 1.2/1.3 dort):
  - **intraday** (15m, 1h, 3h, schluss): je Konfiguration `|t| < 3`; **gepoolt je (ZR, H)** über alle neun Detektoren
    `|t| < 3` **und** `|Mittel| < 0,045 Pp` (Auftrag §2d; die Minutenstudie hielt gepoolt 0,01 Pp bei se 0,006–0,03 — die
    Schranke hier ist die der Kanalstudie, 0,0449 = kleinste Klassenhürde).
  - **Übernacht** (`naechste`): je Konfiguration `|t| < 3` (Hansen-Hodrick-se); gepoolt `|t| < 3` **und**
    `|Mittel| < 3 · se_erwartet`. **`se_erwartet` wird aus dem Piloten notiert** (PILOT-ERGEBNIS.md, als datierter
    Nachtrag hier eingetragen, **vor** dem Vollauf), nie aus dem Vollauf.
  - Fällt die gepoolte Prüfung, bekommt kein Kandidat dieses (ZR, H) „belegt"; fällt nur die eigene, nur dieser nicht.
- **Placebo B** (gepaart) nachrichtlich: `Kandidat − Placebo B` je Konfiguration.
- **Nullpunkt** aus dem ganzen Topf, nie aus dem Signal-Topf. **Überlebens-Differenz** alle − lebend je Familie (§2) und
  je Umsatzklasse. **Rauschboden** nachrichtlich: `se_B` Placebo A / Kandidat.
- **Positivkontrolle** (§14): gepflanzte Ausstiege in allen fünf Haltedauern (auch Übernacht über eine Jahresgrenze).

## 9. Die Zeitachse — Jahresscheiben, Trend, Regime (Wilhelms Frage; Auftrag §2)

**a) Jahresscheiben — Pflichttabelle.** Für jede der 255 Konfigurationen, aus den Zellen (je ET-Tag) ohne neue Messung,
Sicht alle, Klassen gepoolt: je **Kalenderjahr 2016 … 2026** und für **„letzte 250 Handelstage"** (Definition §7.4)
die Spalten `nTage, nSignale, Mittel(u), se, t` sowie `Brutto` und `netto_schein (BV 1,0)`. se je §6 (Übernacht
Hansen-Hodrick Lag 1). Jahre mit < 10 Signaltagen stehen mit Zahl, aber ohne t („zu dünn"). Format im Bericht: ein
Block je (Detektor, Zeitrahmen) mit einer Zeile je (Richtung, Haltedauer, Jahr) — und eine Kurztafel „Jahr × Familie".
**b) Trend über die Jahre** (nachrichtlich, eine Zeile je Konfiguration): OLS-Steigung des Jahresmittels(u) über die
Jahresnummer (2016 = 0), nur Jahre mit ≥ 30 Signaltagen, ungewichtet; `se` der Steigung aus der Regression, `t`.
Weniger als 4 solche Jahre ⇒ „–".
**c) Regime-Sicht** (nachrichtlich): Bestätigung je Konfiguration getrennt nach **SPY über / unter EMA200 auf
Tagesbasis** — SPY (ETF, Marktreihe, kein Kandidat) aus dem Archiv über `lesen.ladeJahr`; Tagesschluss = Schluss der
letzten regulären 1m-Kerze (15:59; Näherung wie Nachtrag 1.14 dort — die Kanalstudie nahm ihren Kreuzproben-Schluss c1;
die Abweichung liegt in der 16:00-Minute und ändert eine EMA200 nicht); `regime[Tag] = 1`, wenn `C_Tag > EMA200`
einschließlich des Tages, 0 sonst, −1 in den ersten 200 Tagen (Vorlauf, unbekannt — wie `regimeAus()` der Kanalstudie).
Das Regime ist eine Eigenschaft des Tages, kein Zellenfeld: die Tagesreihe wird beim Auswerten geschnitten. „In jeder
Marktlage" wird damit zur Tabelle (Mittel, se, t, nTage je Lage), nicht zur Behauptung; kein Urteil daraus.

## 10. Zellenlayout, Kennung, Speicher

Wie die Minutenstudie, mit eigenen Zahlen: Reihen der Zellentabelle = 3 Arten (Kandidat, Placebo A, Placebo B) × 27
Kandidaten (9 Detektoren × 3 ZR) = **81**; Zelle = (Reihe, Richtung, Haltedauer 5, ET-Tag 2.680, Klasse 4, lebend 2) mit
`n, Σr, Σr², Σh2` ⇒ 17,37 Mio Zellen × 4 Felder × 8 Byte = **556 MB**; Topf (ZR 3, H 5, Tag, Klasse, lebend) 7,7 MB;
Kurs-Zellen (27 × 2 × Tag × Klasse × lebend, drei Felder) 27,8 MB. **≈ 590 MB je Prozess**, acht Prozesse ≈ 4,7 GB.
Die Schein-Hürde ist eine Konstante je Haltedauer und braucht kein Feld; das Regime ist eine Eigenschaft des Tages.
**Kennung:** `trendwende-ii-2026-09-09/v1/9x3x2x5x4x3+kurs+schein+jahre`. Checkpoints alle 200 Dateien, Wachhund 900 s,
`--teil k/8`, Fortsetzung, `_fortschritt.json` mit Kennung — alles wie dort.

## 11. Auflösungs-Vorrechnung — vorab, beide Rechnungen

Anker: realisierte Werte der Minutenstudie (delta80 dichter Detektoren auf 1m 0,05–0,08 Pp; Planwerte 1 h 0,040 / 3 h
0,069 / bis Schluss 0,080 bei 894 Tagen, Nachtrag 1.1 dort). Wende-Detektoren sind **dünner** als rsi2/vwap (W3 im
August 2–9 Signale je Symbol auf 740 Tagen; W4 und W5 vermutlich ≤ 1 je Reihe und Woche) — die Tagesstreuung liegt
näher an der „dünn"-Zeile (0,065 / 0,091 / 0,103).

| Haltedauer | sd Tag (Annahme) | MDE_B (894 Tage) | delta80 (k₁ = 5, z 2,58) | 5–50 | 50–250 | 250–1000 | ab 1000 |
|---|---|---|---|---|---|---|---|
| 15m | 0,25 | 0,017 | **0,029** | ✓ | ✓ | ✓ | ✓ |
| 1h | 0,45 | 0,030 | **0,051** | ✓ | ✓ | ✓ | ✗ (knapp) |
| 3h | 0,70 | 0,047 | **0,080** | ✓ | ✓ | ✗ | ✗ |
| schluss | 0,80 | 0,054 | **0,091** | ✓ | ✗ (knapp) | ✗ | ✗ |
| naechste (Übernacht) | 1,00 (Übernachtsprung Median 0,486 Pp, p75 0,989, `kosten.md` Zusatz B) | 0,067 | **0,114** | ✓ | ✗ | ✗ | ✗ |

Gegen den **Schein** (0,05 / 0,16): auf 15m und 1h sichtbar, ab 3 h nur der Standard-Schein (0,23 / 0,42) — dort ist das
Instrument für den billigen Schein **strukturell blind** (nur Obergrenzen). **Folge, vor dem Lauf hingeschrieben:** für
Übernacht und „bis Schluss" in den liquiden Klassen kann diese Studie höchstens Obergrenzen liefern, kein Ja; ein
Übernacht-„Ja" wäre nur in 5–50 möglich, wo die Kassa-Hürde 0,1569 ist. Die realisierten `se_B` stehen im Bericht neben
diesen Planzahlen. **Nicht entscheidbar ist der Befund, kein Nein.**

## 12. Phase 2 — Jahresscheiben rückwirkend für zwei fertige Studien (nur nachrichtlich, post hoc, kein Urteil)

- **Minutenstudie 5m/15m:** Zellen `E:/Markt-Dashboard-Archiv/studien-zellen/signale-minuten-5m15m-2026-09-08/`
  (`zellen-teil-0..7.bin` + `fortschritt-teil-k.json`), nur lesen; Ausgabe
  `studien/vorregistrierung-2026-09-06-signale-minuten/ergebnis-5m15m-2026-09-08/JAHRESSCHEIBEN.md` — die einzige Datei,
  die dort angelegt wird. Weg: **additive Option `--jahre`** im dortigen `auswerten.js` (Standard = altes Verhalten;
  `test.js` dort, 81 Prüfungen, bleibt grün und bekommt **eine** dazu); der 1m-Lauf (Zellen in
  `studien-zellen/signale-minuten-1m-2026-09-11/`) wird mit derselben Option gelesen, ohne Änderung.
- **Kanalstudie:** Zellen `studien-zellen/trendkanal-tage-2026-09-09/voll/`; additive Option `--jahre` in
  `studien/vorregistrierung-2026-09-08-trendkanal-tage/auswerten.js` (`test.js` dort, 71 Prüfungen, grün plus eine);
  Ausgabe `ergebnis-2026-09-09/JAHRESSCHEIBEN.md`. Dort se je §7 der Kanalstudie (Hansen-Hodrick Lag H−1).
- Format wie §9a/b: je Konfiguration und Jahr `nTage, nSignale, Mittel(u), se, t`, letzte 250 Handelstage, Trendzeile.
  **Kein Tor, kein Urteil, keine Änderung an den fertigen Berichten.**

## 13. Erwartungen — vorab und getrennt notiert

**Wilhelm (09.09.):** Trendwenden lassen sich feststellen und mit Call/Put mitnehmen; das Gewinn/Kosten-Verhältnis ist
optimierbar.

**PM (Auftrag §5):** Wende-Short nach bestätigtem Hoch wieder brutto positiv (t > 3 auf 5m/15m), netto als Aktie in der
Klasse ab 1 Mrd ≈ 0 ± 0,03 Pp, **mit Schein überall negativ**; Wende-Long intraday tot; W1b (starker Vortrend) ≤ 0,10 Pp
brutto; in den Jahresscheiben kein Aufwärtstrend der Kanten. Kein Kandidat „handelbar mit Schein".

**Diese Rolle, eigene Zahlen, vor der ersten Zelle:**

- **Wende-Short** (W5 short, W7 short, W1a/W1b short) auf 5m/15m gegen den Topf brutto **+0,03 … +0,08 Pp** bei 1 h,
  t 2–5 bei den dichteren (W7); Kassa-netto in ab 1000 **−0,02 … +0,03**, in 5–50 klar negativ (Hürde 0,157); Schein
  BV 1,0 **−0,02 … +0,03** (nicht entscheidbar), Standard-Schein **−0,15 … −0,20**.
- **Wende-Long intraday** gegen den Topf **−0,05 … 0** (Messerfangen); W3 long bis Schluss wie im 1m-Lauf ≈ +0,00 … +0,04
  brutto, netto ≈ 0.
- **W1b ≤ 0,10 brutto** — Zustimmung; eigene Zahl **+0,02 … +0,06** auf 1m, 1 h, kein Vorteil gegenüber W1a.
- **Übernacht (`naechste`):** Long-Wenden (W3, W5 long) brutto **+0,02 … +0,08** (Übernachtdrift), gegen den Topf ≈ 0;
  Short-Übernacht gegen den Topf ≈ 0, roh negativ (−0,05). Keine Übernacht-Zeile bestätigt (Auflösung §11).
- **W4 Klimax:** selten, „nicht entscheidbar" in jeder Klasse. **W6 V-Umkehr:** gegen den Topf **negativ** (−0,02 … −0,05:
  nach 50 % Rücklauf setzt sich die Bewegung eher fort). **W8:** wie im 1m-Lauf, null.
- **Jahresscheiben:** kein Aufwärtstrend; Wende-Short-Brutto **fällt** über die Jahre (2016–2019 über 2023–2026), Steigung
  negativ mit |t| < 2. **Aktualitäts-Tor** kippt keinen Kandidaten, weil keiner Tor 1 passiert. **Kandidaten für den
  Vorwärtstest: 3–10**, davon die meisten Rauschen.
- **Kein Kandidat „handelbar mit Schein"** in beiden Produkten; **0 belegt**; mehrere „widerlegt als Größe" bei 15m/1h
  in ab 1000; Übernacht durchweg „nicht entscheidbar".

Wer nach dem Lauf etwas anderes liest, lese diesen Absatz noch einmal.

## 14. Das Messgerät und seine Tests (Phase 1, Commit 2) — Kopie mit Herkunft, eigene Kennung

Eine additive Konfigurationsschnittstelle in `messen.js` der Minutenstudie ginge **nicht ohne Verhaltensänderung**
(Übernacht-Ausstieg über Dateigrenzen, Warmlauf-Übergabe, fünfte Haltedauer, eigene Detektortabelle, Schein-Zeile) —
deshalb **Kopie** von `konfig.js`, `messen.js`, `auswerten.js`, `test.js`, `nacht.cmd`, `hochrechnung.js` in diesen
Ordner mit Herkunftsvermerk im Kopf; `lesen.js` und die Konstanten der Minutenstudie werden **per `require`**
weiterverwendet (nicht kopiert), `momente()` der Kanalstudie ebenso. Die 81 Prüfungen der Minutenstudie werden
**mitgetragen**, soweit sie diese Studie betreffen (Gleichheitsproben der 13 August-Detektoren werden zu denen für
W2/W3/W8), plus die neuen:

- **Präfix-Probe je Detektor:** `signal(bars.slice(0, i+1), i)` gleich `signal(bars, i)` an **≥ 1.000** Stichproben je
  Detektor (AAPL/2024 auf 1m, 5m, 15m plus Kunst-Reihe; Schwerpunkt Reihenende).
- **Positivkontrolle:** gepflanzte Ausstiege in allen fünf Haltedauern (Größe und Richtung wiedergefunden; Übernacht über
  eine Jahresgrenze aus zwei Kunst-Dateien).
- **Placebo-Null** auf Zufallsreihen, alle Haltedauern, gepoolt im Band.
- **Gleichheit W1a gegen `hauptstudie.js detect()`** (S 0,5, F 6, Vortrend 0,5) an AAPL/2024 1m: jede Abweichung wird
  klassifiziert; zulässig sind nur Abweichungen der Cooldown-Zustandsregel (§2), Anteil ≤ 2 %, sonst rot.
- **W2/W3/W8 gegen die August-Detektoren** (Identität per `require`, Signal für Signal), W2 zusätzlich gegen
  `signalPraefix`.
- **Kostenkonstanten** gegen `BERICHT.md` (Tabelle aus der Datei gelesen) und `wiki/kosten.md`.
- **Jahresscheiben-Tabelle gegen eine Handrechnung** (Kunst-Zellen mit bekannten Tagesmitteln je Jahr).
- **Aktualitäts-Tor:** konstruierte Tagesreihe „bis 2024 lebendig, ab 2025 gestorben" ⇒ nicht belegt; „nur 2026 lebendig"
  ⇒ Kandidat Vorwärtstest, nicht belegt.
- **Hansen-Hodrick L = 2** an einer Reihe mit bekannter Lag-1-Autokorrelation (se_HH > se_naiv).
- **Regime:** SPY-EMA200 gegen eine naive Rechnung.
- **Klinken:** kein Netz (keine `http/https/net`-Module), kein Schlüssel, kein Schreiben unter `archivWurzel()`, kein
  Yahoo; Fortsetzbarkeit bitidentisch; Kennung; Ordner `pilot-*` heißen nie `voll`.
- **Pilot (≤ 20 Reihen, dieselben 20 wie in der Kanalstudie, alle Jahre, nur lesen, ein Prozess):** liquide **SPY**
  (Marktreihe, nur Regime), AAPL, MSFT, NVDA, AMZN, JPM, XOM, PG, HD, COST; illiquide COKE, NEU, CRVL, WINA, DJCO;
  verschwunden AATC, ABVE, AC, ADAP, ACCD. Ausgabe `PILOT-ERGEBNIS.md`, Laufzeit auf 45.096 Dateien hochgerechnet,
  `se_erwartet` für den Übernacht-Placebo notiert (§8). **Der Vollauf startet nicht aus diesem Chat** — der PM startet
  ihn über die Aufgabenplanung, nach dem 1m-Lauf (Platte E:).

## 15. Was diese Studie NICHT sagt

- Nichts über Parameter-Varianten der Detektoren (eine Schwelle, ein F, ein k je Familie — hingeschrieben, nicht gesucht).
- Nicht die effektiven Kosten (Schlupf, Tiefe, Teilfüllung; Schein-Hürden sind Tabellenwerte an 15 US-Großwerten).
- Kein Ja aus der Entdeckung, aus Jahresscheiben, aus der Regime-Sicht, aus der Vorwärtstest-Liste oder aus Phase 2.
- Nichts über Haltedauern über eine Nacht hinaus, nichts über CFD, nichts über 60m, nichts vor 2016.
- Für blinde Zellen (§11) kein Nein — nur Obergrenzen.

---

*Commit 1 dieser Studie ist diese Datei. Jede Abweichung davon steht als datierter Nachtrag unter dieser Linie, nie darüber.*

## 16. NACHTRAG 1 — 12.09.2026, nach dem Bau des Messgeräts und `test.js`, vor dem Piloten und vor jeder Auswertung

Gerechnet wurde bis hier keine Rendite außer den Gleichheits-, Laufzeit- und Kunstreihen-Proben von `test.js` und einer
Laufzeitprobe an AAPL/2024 (21 s je Datei, davon 1m 18 s; Signale je Detektor auf 1m: W1a 348, W1b 330, W2 145, W3 43,
W4 9, W5 1.135, W6 1.153, W7 1.115, W8 7 — nur Zählungen, keine Erträge angesehen). Was hier steht, ersetzt die genannten
Stellen oben; alles andere bleibt.

1. **W1a gegen `hauptstudie.js detect()` (§14) — Toleranz 2 % → 3 %.** An AAPL/2024 1m (S 0,5 / F 6) sind 382 von 390
   `detect()`-Signalen in Index und Richtung identisch; 8 fehlen dem reinen Detektor, weil `detect()` eine Kerze im
   Cooldown **nicht auswertet** und den Abschnitt deshalb offen lässt, während die reine Funktion die dort stehende
   Bedingung als „schon gefeuert" liest (§2, dokumentierte Zustandsregel); 1 weiteres Signal ist die Folge (der Scan
   feuert, wo `detect()` nach seinem Mehr-Signal im Cooldown ist). Das sind 2,31 %, alle klassifiziert (`test.js` 4f
   verlangt die Klassifikation jeder einzelnen Abweichung). Die Zahl 2 % war eine Schätzung vor dem Bau; die Regel bleibt,
   die Schranke wird auf **3 %** gesetzt. Eine exakte Gleichheit bräuchte den Cooldown-Zustand im Detektor — das wäre
   kein reiner Detektor mehr.
2. **Intraday-se ist die naive Stichproben-se (§6, präzisiert).** `momente()` der Kanalstudie setzt bei L = 1
   `se = √(γ₀/n)` mit γ₀ = Σ(x−x̄)²/n (Populationsvarianz, Faktor √((n−1)/n) kleiner als sd/√n). Für die Intraday-Zeilen
   dieser Studie gilt wörtlich „= naive se": `auswerten.js momente()` setzt bei L = 1 `se = sd/√n` mit (n−1) im Nenner
   (wie die Minutenstudie). Bei 894 Tagen ist der Unterschied 0,06 % — ausgewiesen, weil „gleiche Funktion" sonst nicht
   stimmt. Übernacht (L = 2) bleibt Hansen-Hodrick aus derselben Funktion.
3. **Pilotliste (§14):** SPY ist die Marktreihe für das Regime (ETF, von `lesen.reihen()` ausgeschlossen) und kein
   Kandidat; der Pilot misst **19 Aktien**, SPY wird beim Auswerten für die Regime-Sicht gelesen.
4. **Zähler (§3), ergänzt:** `uebernachtOffen / uebernachtVerbucht / uebernachtVerfallen / ohneNaechsterTag /
   fortsetzungOhneUebernacht` stehen in `_fortschritt.json` und im Bericht; `ohneHorizont` hat fünf Felder.

Kennung unverändert `trendwende-ii-2026-09-09/v1/9x3x2x5x4x3+kurs+schein+jahre`.

## 17. NACHTRAG 2 — 12.09.2026, nach dem Piloten (19 Reihen, ein Prozess, 13:20–13:50), vor dem Vollauf

Der Pilot (`pilot-1/`, `PILOT-ERGEBNIS.md`) ist gelaufen: 193 Dateien, 11,2 Mio reguläre Kerzen, 30 Minuten, 0 Detektorfehler,
8 ausgelassene Dateien (AATC 2023–2025, ABVE 2016–2020 — die bekannten Archivlücken), Übernacht offen/verbucht/verfallen
56.824 / 51.151 / 5.673 (verfallen = letzte Datei je Reihe), gepoolte Placebo-Bänder 0 von 15 gefallen, Einzel-Placebos 4
von 135. **Die Zahlen des Piloten sind kein Befund** (19 Reihen, davon 5 illiquide und 5 verschwundene; Tagesmittel über so
wenige Reihen tragen das Marktbeta ungedämpft).

1. **`se_erwartet` für den Übernacht-Placebo (§8):** gepoolte Placebo-A-se der Haltedauer `naechste` im Piloten: 1m 0,0017,
   5m 0,0023, 15m 0,0038 Pp. Gesetzt wird der **größte Wert, 0,0038** (`konfig.js SE_ERWARTET_NAECHSTE`), Schranke also
   |Mittel| < 0,0114 Pp neben |t| < 3. Im Vollauf (≈ 7.300 Reihen) wird die se kleiner sein; die Schranke aus dem Piloten
   ist damit die weitere und eine echte Vorab-Zahl.
2. **Hochrechnung (§14):** 2.900–3.000 s je GB Pilotrate (1m trägt 83 % der Rechenzeit); 122 GB ⇒ ≈ 100 Prozess-Stunden,
   in 8 Teilen 12–13 h nominal, unter Parallellast (acht Prozesse, eine Platte) eher **ein Tag**; Rahmen 1–2 Tage.
3. **Beobachtung, keine Regeländerung — W7 (RSI-Divergenz):** im Piloten ist W7 auf 5m/15m in **beiden** Richtungen gegen den
   Topf positiv (u_B 0,11–0,22 Pp, t 6–13), auch **über Nacht** (long und short je +0,13…+0,22). Beide Richtungen positiv
   heißt: der **Einstiegskurs** ist verzerrt, nicht der Markt vorhersagbar — W7 feuert exakt am 60-Kerzen-Extrem, und die
   Eröffnung der Folgekerze liegt dann mit hoher Wahrscheinlichkeit noch auf derselben Seite der Spanne (Bid-Ask-Bounce am
   Extrem; die Kassa-Hürde deckt den Median der Spanne zur Mittagszeit, nicht die Spanne am Extrem). Der Placebo (zufällige
   Kerzen) kann das nicht sehen; die Gegenprobe „geteilter Kurs" prüft nur den Signalschluss. Beleg im Piloten: die gepaarte
   Differenz Kandidat − Placebo B (gleiches 30-Minuten-Fenster, gleiche Richtung, anderer Einstieg) ist für W7 5m long
   **bei „bis Schluss" und „nächste Eröffnung" gleich groß** (+0,129 / +0,129 Pp, t 22 / 21; short +0,113 / +0,113) — eine
   Größe, die vom Ausstieg nicht abhängt, sitzt im Einstieg. **Die registrierte Einstiegsregel bleibt unverändert** (sie ist die der Minutenstudie). Vorschlag an den PM, vor dem Vollauf zu entscheiden: eine
   **nachrichtliche Robustheitszeile „Einstieg Eröffnung i+2"** (eine Kerze später) als vierte Art in der Zellentabelle
   (+27 Reihen, ≈ 740 MB je Prozess) oder als Kurszellen-Feld „Σ Eröffnung i+1 − Schluss i" (Einstiegslücke S9 der
   Messmaschine, 8 Byte je Kurszelle). Ohne eine davon kann der Vollauf für W7 (und jede Regel, die am Extrem feuert)
   Bounce und Wende nicht trennen; ein „belegt" für W7 wäre dann mit diesem Vorbehalt zu lesen.
4. **Zähler `fortsetzungOhneUebernacht`** zählt auch die erste Datei nach einer **Archivlücke** (Vorjahr fehlt, Warmlauf neu
   gebaut) — im Piloten 1 (ABVE/2021 nach fehlenden 2016–2020). Bedeutung unverändert: keine Übernacht-Übergabe in diese
   Datei, gezählt, nicht geschätzt.
5. **Realisierte se_B (u, Bestätigung, Median über die Konfigurationen, 19 Reihen):** 1m 0,004–0,018, 5m 0,010–0,035,
   15m 0,018–0,067 Pp — im Vollauf um etwa √(7.300/19) kleiner für die idiosynkratische Komponente; die Planzahlen aus §11
   bleiben stehen, der Vollauf schreibt seine se_B daneben.

Kennung unverändert. Der Vollauf startet nicht aus diesem Chat.

## 18. NACHTRAG 3 — 12.09.2026, Entscheide des PM zu §6 der Übergabe; **vor jeder Zelle der Kennung v2**

Grundlage: `uebergabe/auftrag-trendwende-ii-nachtrag3-2026-09-12.md` (PM, 12.09.2026) — die sechs offenen Fragen der
Übergabe vom 12.09. sind entschieden. Dieser Nachtrag steht **vor der ersten neuen Zelle**: er ist geschrieben und
committet, bevor eine einzige Zahl der neuen Kennung **ausgewertet** wurde (der Pilotlauf `pilot-2/` schrieb ab
16:15 Uhr Zellen; `auswerten.js` wurde darauf erst nach diesem Commit aufgerufen — kein Wert aus v2 war vorher zu sehen).
Die Entscheide selbst stammen aus dem schriftlichen Auftrag des PM und nicht aus einem Ergebnis.

Kennung neu: **`trendwende-ii-2026-09-09/v2/8x3x2x5x4x3+kurs+luecke+schein+jahre`**. Zellen der Kennung v1 (`pilot-1/`)
passen nicht mehr — `messen.js`/`auswerten.js` brechen bei fremder Kennung ab, es wird nichts vermischt.

### 3.1 Einstiegslücke als fünftes Kurszellen-Feld (Entscheid 1 zu W7 / „Einstieg am Extrem")

**Gemessen wird je Kurszelle** — also je (Kandidat = Detektor × Zeitrahmen, Richtung, ET-Tag, Umsatzklasse, lebend) —
zusätzlich zu n, Σ Einstiegskurs und „über dem Cent-Boden" die **Einstiegslücke**

> `luecke = dir · (Eröffnung_{i+1} − Schluss_i) / Schluss_i · 100` in Pp, summiert (8 Byte je Kurszelle, Feld `kl`).

- **In Handelsrichtung** (`dir`), damit long und short dieselbe Vorzeichenlage haben: positiv heißt „der Kurs ist
  zwischen Signalschluss und Einstieg schon in die behauptete Richtung gesprungen". Die Richtung steckt ohnehin im
  Zellenindex; die Größe ist damit je Konfiguration direkt lesbar.
- **Verhältnis, deshalb ohne `rohFaktor`**: Splits und Ausschüttungen kürzen sich in Zähler und Nenner. Der Cent-Boden
  bleibt am **rohen** Kurs (Nachtrag 1 der Minutenstudie), die Lücke ist eine Rendite und wird an den bereinigten Kursen
  gerechnet — beides steht in derselben Zelle, mit verschiedenen Feldern.
- Ist `Schluss_i` nicht positiv, wird nichts addiert und der Zähler `lueckeOhneSchluss` erhöht (nie geschätzt).
- Die Kurszelle kennt **keine Haltedauer**: alle fünf Haltedauern einer (Detektor, ZR, Richtung) tragen dieselbe Lücke.
  Das ist gewollt — die Lücke sitzt im Einstieg, und genau das ist die Beobachtung, die geprüft wird (Nachtrag 2.3).
- **Keine Robustheitszeile „Einstieg Eröffnung i+2"** (Entscheid des PM: zu teuer für das, was sie sagt).

**Im Bericht je Konfiguration zwei neue Spalten** (Bestätigungszeitraum, Sicht „alle"):

| Spalte | Definition |
|---|---|
| `luecke_B (je Signal)` | Σ Lücke / Σ n über die Bestätigungstage — das vom PM verlangte **Mittel je Signal** |
| `luecke_B (Tagesmittel)` | ungewichtetes Mittel der Tagesmittel der Lücke über die Bestätigungstage |
| `netto_B lueckenbereinigt` | Tagesmittel von **(netto_t − luecke_t)** über die Bestätigungstage, se/t wie jede andere Zeile (Lag 1, übernacht Hansen-Hodrick) |
| `t lueckenbereinigt` | t dieser Tagesreihe |

**Präzisierung zur Formel des Entscheids** („`netto_B_lueckenbereinigt` = netto_B − luecke_B"): netto_B ist in dieser
Studie ein **Tagesmittel über Signaltage**, das Mittel je Signal ist eine andere Skala (Obergrenzen-Übergabe vom 02.09.:
„Protokolle tragen zwei Skalen"). Die Differenz wird deshalb **je Tag** gebildet und dann gemittelt; nur so hat sie
überhaupt eine se und ein t — und das Tor verlangt ein t. Beide Lückenmaße stehen im Bericht nebeneinander; sie
unterscheiden sich nur durch die Gewichtung der Tage.

**Verschärftes Tor, vorregistriert vor dem Vollauf:** `belegt` — und damit jedes `handelbar` / `handelbar mit Schein` —
verlangt **zusätzlich zu allen bisherigen Bedingungen**

> `netto_B lueckenbereinigt > 0` **und** `t` darauf `≥ z_Bonf(k2)`.

Fällt eine Zeile nur an dieser Bedingung, lautet das Urteil **`nicht belegt: Einstiegsluecke`** (neuer Wert in der
Urteilsliste, Reihenfolge im Urteilsbaum: nach dem Aktualitäts-Tor, vor den Placebo-Herabstufungen). Wo
`luecke_B (Tagesmittel) > ½ · brutto_B` ist, trägt die Zeile zusätzlich den Vermerk **„Extrem-Einstieg"**.

**Was das Tor nicht ist:** kein Kostenmodell. Die Lücke ist nicht Teil des gemessenen Ertrags (der läuft von der
Eröffnung i+1 bis zum Ausstieg); sie ist das Maß dafür, **wie weit der Einstieg vom Extrem entfernt liegt**, an dem die
Regel feuert. Ist das gemessene Netto nicht größer als diese Lücke, ist die mechanische Erklärung (Spanne am Extrem,
Bid-Ask-Bounce) mindestens so gut wie die behauptete Wende — und die Studie sagt dann nicht „belegt". Das ist eine
**Verschärfung**, nie eine Lockerung: keine Zeile kann durch die neue Spalte belegt werden, die es vorher nicht war.

### 3.2 Der Trendfolge-Detektor ist gestrichen (Entscheid 2, vormals W8)

Der bis hierher als „W8 / Kanaltrend (Referenz Trendfolge)" mitgeführte Detektor ist **aus der Studie entfernt**.
Begründung: er ist nach Code (`kanaltrend` der August-Tabelle, `Q.einstiegSignal` mit `MINQ 60`) eine **EMA20-Kreuzung
in Kanalrichtung** — Trendfolge, kein Wende-Detektor; die Umschreibung der Vorregistrierung §2 („Rücklauf gegen den
Abschnittskanal") trifft keine August-Funktion. Eine Referenzzeile, die die Frage der Studie nicht stellt, kostet
Bonferroni-Breite und lädt zur Fehldeutung ein.

Folgen: **8 Detektoren**, 24 Kandidaten (8 × 3 Zeitrahmen), 72 Zellenreihen, **15 Detektor-Richtungen × 3 × 5 = 225
Konfigurationen** (vorher 255), Zellenspeicher ≈ 535 MB je Prozess (vorher ≈ 590), Familie „trendfolge-referenz"
entfällt. Die August-Tabelle selbst bleibt unangetastet (`kanaltrend` steht dort weiter; diese Studie zieht ihn nur
nicht mehr). Der `signalCross`-Vorfilter bleibt als Code in `messen.js`, wird aber von keinem Detektor mehr verlangt.
`test.js` hält die Streichung als **Klinke über Eigenschaften** fest (kein Tabelleneintrag, kein Schlüssel, keine
Familie, kein Vorfilter-Verbraucher, 225 Konfigurationen) — nicht über Textsuche, damit Kommentare und dieser Nachtrag
den Namen weiter nennen dürfen.

### 3.3 Short „handelbar mit Schein" ohne Leihe-Veto, Flagge heißt „handelbar mit Put" (Entscheid 3)

Bestätigt: ein Put braucht keine Wertpapierleihe, deshalb gilt das Leihe-Veto nur für den **Kassa-Short** — der bleibt
**„nie handelbar"** (Minutenstudie Nachtrag 2.4). Für Short-Konfigurationen heißt die Schein-Flagge im Bericht
**„handelbar mit Put"** (Spalte „Schein-Flagge"; Long: „handelbar mit Schein"); die Zählung in §2 weist die
Put-Zeilen getrennt aus. Die gemessenen Hürden sind unverändert die Tabellenwerte aus `BERICHT.md` (BV 1,0: 0,05 / 0,16;
Standard: 0,23 / 0,42 Pp je Umlauf) — ein Put ist dort so teuer wie ein Call.

### 3.4 Ablage der 1m-Jahresscheiben (Entscheid 4)

Erledigt durch den PM (Verschiebung nach `ergebnis-1m-2026-09-11/JAHRESSCHEIBEN.md`); für diese Studie ohne Folge.

### 3.5 `se_erwartet` bleibt eine Zahl (Entscheid 5)

Bestätigt: **0,0038 Pp** (der größte der drei Zeitrahmen aus Pilot 1) gilt für alle Zeitrahmen als Schranke des
Übernacht-Placebos (|Mittel| < 3 · se_erwartet = 0,0114 Pp neben |t| < 3) — bewusst die **weitere** Schranke, und eine
Zahl aus einem Lauf mit alter Kennung, also vor dem Vollauf feststehend. Sie wird **nicht** aus `pilot-2/` neu gesetzt.

### 3.6 Zähler `fortsetzungOhneUebernacht` behält seinen Namen (Entscheid 6)

Bestätigt. Bedeutung (unverändert, hier ausgeschrieben): der Zähler steht für **jede Datei, in die keine offenen
Übernacht-Beiträge der Vordatei übergeben werden konnten** — nach einer Fortsetzung aus dem Checkpoint *und* nach einer
Archivlücke (Vorjahr fehlt, Warmlauf neu gebaut). Er zählt Dateien, nicht Beiträge; die verlorenen Beiträge selbst
stehen in `uebernachtVerfallen`.

### 3.7 Was sich nicht ändert

Einstiegsregel (Eröffnung i+1), Hauptgröße u, Tore 1 und 2, Bonferroni, Aktualitäts-Tor, Placebo-Bänder, Kosten- und
Schein-Hürden, Jahresscheiben, Regime, Haltedauern, Kalender, Klassen, Dichteregel, Cooldown, Zellenlayout im Übrigen.
Der Pilot `pilot-2/` läuft über **dieselben 19 Reihen** wie Pilot 1; seine Zahlen sind wie dort **kein Befund**.
Der Vollauf startet nicht aus diesem Chat.

## 19. NACHTRAG 4 — 12.09.2026, Entscheide des PM zu §9 der Übergabe; **vor der ersten Zelle der Kennung v3**

Grundlage: `uebergabe/auftrag-trendwende-ii-nachtrag4-2026-09-12.md` (PM, 12.09.2026). Dieser Nachtrag ist geschrieben
und committet, **bevor eine einzige neue Zelle gerechnet wurde** (eigener Commit vor jeder Änderung an `konfig.js`,
`messen.js`, `auswerten.js`, `test.js`). Die Entscheide stammen aus dem schriftlichen Auftrag des PM, nicht aus einem
Ergebnis.

Kennung neu: **`trendwende-ii-2026-09-09/v3/8x3x2x5x4x3+kurs+luecke+haltezeit+schein+jahre`**. Zellen der Kennung v2
(`pilot-2/`) passen nicht mehr — Kennungs- und Längenprüfung brechen ab, es wird nichts vermischt.

### 4.0 Warum: die Bounce-Vermutung ist gefallen, die Uhrzeit des Topfs ist die neue Verdächtige

Nachtrag 3 hat die Einstiegslücke gemessen. Sie ist bei W7 **klein** (0,002–0,013 Pp, 2–6 % des Bruttos) und erklärt
den Befund nicht. Entscheidend ist das **Profil über die Haltedauern** (u_B in der Bestätigung, `pilot-2/`):

| Konfiguration | 15m | 1h | 3h | bis Schluss | nächste Eröffnung |
|---|---|---|---|---|---|
| W7 5m long | −0,0285 | 0,0288 | 0,1138 | 0,1854 | 0,1666 |
| W7 5m short | −0,0367 | 0,0079 | 0,0662 | 0,1270 | 0,1304 |
| W7 15m long | −0,0457 | 0,0227 | 0,0975 | 0,2074 | 0,2210 |
| W7 15m short | −0,0498 | 0,0053 | 0,0719 | 0,1526 | 0,1537 |

Ein Bid-Ask-Bounce am Einstieg wäre **sofort da und über die Haltedauern flach**; dieses Profil ist bei 15 Minuten
negativ, bei einer Stunde null und wächst bis zum Schluss. Die Vermutung des PM aus Nachtrag 3 ist damit widerlegt.

**Die neue, vorab benannte Verdächtige: die Uhrzeitverteilung des Topfs.** Für „bis Schluss" und „nächste Eröffnung"
hängt die tatsächliche Haltezeit an der **Uhrzeit des Signals** — ein Signal um 10:00 hält sechs Stunden, eines um
15:30 eine halbe. Der Topf derselben Zelle mittelt über **alle** zulässigen Kerzen des Tages, also über eine andere
Uhrzeitverteilung. Feuert ein Detektor systematisch früher am Tag als der Durchschnitt, trägt er mehr Tagesdrift als
sein Topf — **in beiden Richtungen** (long verdient die Drift, short wird gegen einen Topf gemessen, der weniger Drift
enthält). Genau das zeigt der Pilot: acht Zellen sind beidseitig positiv mit t ≥ 2, alle acht W7, und der Effekt wächst
mit der verbleibenden Tageszeit. Das ist kein Beweis; es ist die einzige Erklärung, die zum Profil passt, und sie ist
**messbar**. Sie kann auch scheitern — dann steht das im Bericht (§4.6).

### 4.1 Das Lücken-Tor sitzt auf `u_B`, nicht auf `netto_B` (Entscheid 1)

Das Urteil `belegt` fällt über die Hauptgröße **u** (§5). Ein Tor auf `netto` ist ein Tor auf einer anderen Skala, deren
se drei- bis sechsmal größer ist — also ein zweiter, schwächerer Test unter falschem Namen; dieselbe Fehlerform wie der
Einheitenfehler bei delta80 (Lehre „Die Auflösungswand"). Ab Kennung v3 gilt deshalb:

> **`u_B lueckenbereinigt`** = Tagesmittel von **(u_t − luecke_t)** über die Bestätigungstage, se/t wie jede andere
> Zeile (Lag 1, übernacht Hansen-Hodrick). **`belegt` — und damit jedes `handelbar` — verlangt
> `u_B lueckenbereinigt > 0` und `t ≥ z_Bonf(k₂)`.**

Die Differenz wird weiter **je Tag** gebildet und dann gemittelt (Skalenregel aus Nachtrag 3.1). Tage ohne Topf (u ist
dort NaN) fallen aus der Rechnung und werden als `ohneU` gezählt. `netto_B lueckenbereinigt` und sein t **bleiben als
Spalten im Bericht, entscheiden aber nichts mehr**. Der Urteilswert heißt unverändert `nicht belegt: Einstiegsluecke`;
der Vermerk „Extrem-Einstieg" bleibt am Brutto. Es bleibt eine reine Verschärfung gegenüber „ohne Tor": keine Zeile
kann durch die Spalte belegt werden, die es sonst nicht wäre.

### 4.2 Neue Zellenfelder: Haltezeit von Kandidat und Topf (Entscheid 2)

Zwei neue Felder je **Haltezeitzelle** = (Kandidat = Detektor × Zeitrahmen, Richtung, **Haltedauer**, ET-Tag,
Umsatzklasse, lebend): **Σ Haltezeit in Sitzungsminuten** und die **Zahl der Beobachtungen** dazu. Für den Topf ein
viertes Feld je Topfzelle (ZR, Haltedauer, Tag, Klasse, lebend): **Σ Haltezeit**; die Zahl ist das vorhandene `tn`.

**Definition der Haltezeit** (Einstieg bis Ausstieg, in Minuten der regulären Sitzung):

- Einstieg: Beginn der Einstiegskerze `i+1` (dort wird zur Eröffnung gekauft).
- Feste Haltedauern (15m / 1h / 3h): bis zum Beginn der Ausstiegskerze `j` — konstruktionsgemäß genau H, solange das
  Gitter lückenlos ist.
- „bis Schluss": bis zum **Ende der letzten regulären Kerze des Tages** (nicht bis zum Kalender-Schluss — die
  Haltezeit soll den tatsächlichen Ausstieg messen, auch an dünnen Tagen).
- „nächste Eröffnung": **dieselbe Zahl wie „bis Schluss"**. Die Nachtpause zählt **null Sitzungsminuten**, und am
  Folgetag wird zur Eröffnung ausgestiegen, also vor der ersten Sitzungsminute. Das ist gewollt: die Nacht ist für
  jeden Einstieg desselben Tages gleich lang und kann deshalb keinen Versatz zwischen Kandidat und Topf erzeugen.
- Übernacht-Beiträge, die über eine Dateigrenze übergeben werden, tragen ihre Haltezeit mit; verfallen sie, verfällt
  auch die Haltezeit — Zähler und Ertragszelle bleiben deckungsgleich.
- Placebo A und B bekommen **keine** Haltezeitzellen (sie werden für den Versatz nicht gebraucht; Placebo B liegt
  ohnehin im selben 30-Minuten-Fenster wie sein Kandidat).

**Im Bericht je Konfiguration drei neue Spalten** (Bestätigungszeitraum, Sicht „alle", Klassen gepoolt):

| Spalte | Definition |
|---|---|
| `haltezeit_kand` | Σ Haltezeit / Σ n der Kandidatenzellen über die Bestätigungs-Signaltage, in Minuten |
| `haltezeit_topf` | dasselbe aus den Topfzellen, **über genau dieselben Signaltage** |
| `uhrzeit_versatz` | `haltezeit_kand / haltezeit_topf − 1` |

Der Topf wird bewusst auf **dieselben Tage** eingeschränkt: sonst misst der Versatz auch den Tagesmix (Halbtage,
Jahre) statt der Uhrzeit. Fehlt einer der beiden Werte, steht „–" und das Tor greift nicht.

### 4.3 Vorregistriertes Tor „Uhrzeit-Versatz" (Entscheid 3)

> Eine Konfiguration mit **|uhrzeit_versatz| > 0,15** kann für die Haltedauern **„bis Schluss" und „nächste Eröffnung"
> nicht `belegt`** werden. Urteil: **`nicht belegt: Uhrzeit-Versatz`** (neuer Wert der Urteilsliste, im Urteilsbaum
> **nach** dem Lücken-Tor, vor den Placebo-Herabstufungen), eigene Spalte im Bericht.

Begründung steht in §4.0: bei diesen beiden Haltedauern ist die Haltezeit eine Funktion der Uhrzeit, und ein Kandidat,
der 15 % länger (oder kürzer) hält als sein Topf, wird gegen einen **anders exponierten** Vergleich gemessen. Der
Überschuss u ist dann keine Wende, sondern ein Stück Tagesdrift. Für 15m/1h/3h greift das Tor **nicht** — dort ist die
Haltezeit beider Seiten die Haltedauer selbst. Die Schwelle 0,15 ist eine Setzung vor der Messung: sie liegt weit über
dem, was Gitterlücken erzeugen können (Prüfung: |Versatz| ≤ 0,05 bei festen Haltedauern), und weit unter dem, was ein
systematischer Uhrzeitversatz erzeugen würde (eine Stunde von rund 195 Minuten mittlerer Resthaltezeit sind bereits
0,31). Auch dieses Tor ist eine reine Verschärfung.

### 4.4 Spiegel-Spalten als Diagnose — ausdrücklich **kein Tor** (Entscheid 4)

Je Zeile zusätzlich die Werte der Gegenrichtung und die Summe beider Richtungen:

| Spalte | Definition |
|---|---|
| `u_spiegel` / `t_spiegel` | u_B und t_B derselben (Detektor, ZR, Haltedauer) in der **Gegenrichtung** |
| `u_summe` / `se` / `t` | Tagesmittel von **(u_long,t + u_short,t)** über die Tage, an denen **beide** Richtungen ein Signal haben; se/t wie sonst |

**Aus diesen Spalten folgt kein Urteil.** Long und short feuern zu verschiedenen Zeitpunkten; dass beide positiv sind,
ist für sich genommen kein Widerspruch und kein Beweis. Die Spalten dienen dem Leser und der nächsten Diagnose. Für
`W3` (nur long) bleiben sie leer.

### 4.5 Prüfungen zu diesem Nachtrag (vor dem Piloten grün)

1. `uhrzeit_versatz` ≈ 0 bei festen Haltedauern — **Toleranz |Versatz| ≤ 0,05**, gemessen an der Kunst-Reihe.
2. Konstruierter Fall **„Detektor feuert nur in der ersten Stunde"** ⇒ Versatz deutlich positiv, Tor greift bei
   „bis Schluss" / „nächste Eröffnung".
3. Konstruierter Fall **„Detektor feuert gleichverteilt über den Tag"** ⇒ Versatz ≈ 0, Tor greift nicht.
4. Das Lücken-Tor rechnet auf **u** (Handrechnung an einer konstruierten Zelle); die netto-Spalte entscheidet nicht
   mehr — eine Zeile mit gutem u-bereinigten Wert und schlechtem netto-bereinigten Wert bleibt `belegt`.
5. Die Spiegel-Spalten stimmen mit der jeweils anderen Zeile überein (u_spiegel(long) = u_B(short) und umgekehrt).
6. Alle Prüfungen der Nachträge 1–3 bleiben grün.

### 4.6 Was passiert, wenn die Hypothese nicht trägt

Ist der Versatz im Piloten klein und greift das Tor nicht, dann ist **die Hypothese des PM widerlegt** — und genau das
steht dann im Bericht und in der Übergabe, mit dem gemessenen Versatz. Es wird **nicht** still auf eine andere
Erklärung ausgewichen; die nächste zu messende Größe wird benannt, aber erst nach einem Auftrag gemessen. Ein
widerlegter PM ist ein Ergebnis, kein Makel.

### 4.7 Was sich nicht ändert

Einstiegsregel (Eröffnung i+1), Hauptgröße u, Tore 1 und 2, Bonferroni, Aktualitäts-Tor, Placebo-Bänder, Kosten- und
Schein-Hürden, Jahresscheiben, Regime, Haltedauern, Kalender, Klassen, Dichteregel, Cooldown, Detektoren (8, W8 bleibt
gestrichen), Zellenlayout im Übrigen. Speicher je Prozess steigt von ≈ 535 MB auf **≈ 620 MB** (Haltezeitzellen
2 × 41 MB, Topf-Haltezeit 2,6 MB). Der Pilot `pilot-3/` läuft über **dieselben 19 Reihen**; seine Zahlen sind wie
bisher **kein Befund**. Der Vollauf startet nicht aus diesem Chat.
