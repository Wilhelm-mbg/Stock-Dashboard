# Vorregistrierung: Signalstudie NEU auf Minutenbasis — 06.09.2026

**Geschrieben und committet, BEVOR eine Rendite gerechnet wurde.** Rolle: Berechnungen.
Auftrag: `Markt-Dashboard-Daten/uebergabe/auftrag-signalstudie-minuten-2026-09-06.md` (PM, 06.09.2026).
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

Quelle: das Alpaca-Minutenarchiv auf `E:/Markt-Dashboard-Archiv/` (`alpaca1m/` roh, `alpaca1m-bereinigt/`
Split-bereinigt, `alpaca-massnahmen/`), **nur lesend**. Die Studie schreibt ausschließlich in diesen Ordner.

---

## 0. Die Frage

> **Gibt es unter den bekannten Intraday-Signalen der App eines, das nach der GEMESSENEN
> Kassa-Hürde seiner Umsatzklasse eine Kante hat — und wenn ja, ist sie handelbar
> (Auflösungswand)?**

Die große Signalstudie vom August (`studien/signalstudie-2026-08/`, 3.372 Tests, 0 von 51 bestätigt)
hat diese Frage **nicht** beantwortet, sondern ihre eigene Blindheit beziffert (BERICHT.md):

> „Keine Kante über 0,15–0,3 Pp je Trade. Darunter ist diese Studie blind." — Intraday auf 22
> Bestätigungstagen, 1m auf 88 Werten mit 62 Tagen Tiefe, Kosten pauschal 0,10 Pp, **60 Minuten:
> „Der 60-Minuten-Teil konnte strukturell nichts bestätigen — er hätte eine viermal größere Kante
> gebraucht, als je gemessen wurde."**

Seit dem 05.09.2026 ist die Datenlage eine andere: **8.058 Reihen mit Balken, 2016–2026, ~2,95 Mrd
1m-Kerzen, ohne Überlebensverzerrung** (5.082 Verschwundene sind drin), und seit dem 03.09. die
**gemessene Kassa-Hürde je Umsatzklasse** (`wiki/kosten.md`). Wilhelm 03.09.: „ist Intraday wirklich so
tot?" — Antwort bisher: *unbelegt, nicht widerlegt* (`wiki/belegstand.md`, „Nicht messbar: Intraday").

## 0.1 Gesehene Zahlen — vollständig deklariert

**Keine einzige Rendite, kein Signal, keine Zelle wurde berechnet.** Gesehen wurden, zur Planung:

| Größe | Wert | Woher |
|---|---|---|
| Handelstage im Fenster 2016-01-04 … 2026-08-31 (ET) | **2.680**, davon 21 Halbtage | `alpaca1m/_kalender.json` |
| davon ab 2021-01-01 | 1.421 | ebenda |
| Reihen mit Lebenszeit / mit Balken (Ordner) / `~2`-Reihen | 8.348 / **8.058** / 3 (AAC, CAPA, JONE) | `_lebenszeit.json`, Ordnerzahl |
| Gruppen | universum 3.232 · etf 31 · verschwunden 5.082 | `_symbole.json` |
| letzter Balken ≥ 2026-08-01 („lebend") / davor / ohne Balken | 3.074 / 4.984 / 290 | `_lebenszeit.json` |
| Abspaltungen / Werte mit Abspaltung / Kursfaktor gemessen / unklar | 201 / 177 / 109 (108 Werte) / 92 | `alpaca-massnahmen/_abspaltungsfaktoren-stand.json` |
| bereinigte Ordner | 1.437 | `alpaca1m-bereinigt/` |
| Dateien / Umfang (Stichprobe 51 Ordner, hochgerechnet) | ~51.700 Dateien, ~146 GB | `statSync`, kein Inhalt |
| AAPL/2024.json | 9,47 MB, Kopf und Schwanz gelesen (Format, `sitzungen`) | eine Datei, keine Rechnung |

Der Auftrag nennt 8.055 Reihen und 175 Abspaltungsfälle; die Meta-Dateien sagen 8.058 und 177/92 — die
Zahlen des Laufs zählen, beide Stände sind genannt.

---

## 1. Kandidaten — 13 Detektoren × 3 Zeitrahmen = 39, mit Richtung und Haltedauer 234 Konfigurationen

**Detektoren:** die 13 Intraday-Detektoren der August-Tabelle `studien/signalstudie-2026-08/detektoren/_tabelle.js`,
**per `require` wiederverwendet, unverändert, mit ihren registrierten Parametern:**

| # | Schlüssel | August-Zeitrahmen | Anmerkung aus der Tabelle, die hier gilt |
|---|---|---|---|
| 1 | `rsi2` | 1m/5m/15m/60m | `mtf: 'auto'` = 5-Min-Bestätigung nur auf 1m |
| 2 | `rsi2seit` | 60m | Fenster-Guard i ≥ 260; belegte Variante |
| 3 | `kapitulation` | 60m | nur Long, selten, clustert an Stresstagen |
| 4 | `reversion` | 1m/5m/15m | 1m auf Tagesreihe ab 31 Kerzen |
| 5 | `pullback` | 5m | Intervallraster im Fenster |
| 6 | `donchian` | 5m | 20 % Gap-Ausbrüche in der Eröffnungskerze |
| 7 | `squeeze` | 60m/5m/15m | Kompressionsbedingung fast wirkungslos |
| 8 | `kanaltrend` | 60m/15m/5m | 5m/15m fast signalfrei |
| 9 | `wave` | 1m/5m/15m/60m | ohne Kanal-Gate, mit Trendpflicht |
| 10 | `orb` | 1m/5m | **15m per Konstruktion 0 Signale** (Range braucht ≥ 3 Kerzen in 30 Min) |
| 11 | `signalCross` | 5m/15m/60m | eine Kreuzung = ein Signal |
| 12 | `vwap-abstand` | 5m/15m/60m | Studien-Definition ohne Live-Pendant |
| 13 | `wendepunkt-trendwechsel` | 1m/5m | 1m Tagesreihe ab 59 Kerzen, 5m fortlaufend |

**Nicht dabei:** `momentum` und `drift` (Querschnitts-Detektoren, Haltedauer 63/60 Tage, brauchen den
App-Store — keine Intraday-Kandidaten; BERICHT.md: „ihre Referenzzeilen keine Prüfung dieser Kanten").
**60m nicht** (Begründung oben, wörtlich zitiert).

**Abweichung vom August, ausgewiesen:** Der Auftrag verlangt alle 13 auf **1m, 5m und 15m**. Acht Detektoren
waren im August für einzelne dieser Zeitrahmen **nicht** registriert (`rsi2seit`, `kapitulation`: nur 60m;
`pullback`, `donchian`: nur 5m; `squeeze`, `kanaltrend`, `signalCross`, `vwap-abstand`: nicht 1m; `orb`,
`wendepunkt-trendwechsel`: nicht 15m). Sie laufen hier trotzdem auf allen drei Zeitrahmen — mit denselben
Parametern, ohne Anpassung. Wo das strukturell leer bleibt (`orb` 15m), steht die Zelle als „0 Signale"
im Bericht, nicht als Nein. Die Detektoren erkennen den Zeitrahmen selbst am Kerzenabstand (`barMinVon`).

**Zeitrahmen:** 1m aus der Datei; **5m und 15m aus 1m verdichtet** mit `markt/kerzenchart.js verdichtenMinuten`
(Gitter je Sitzung, Anker 09:30 ET, wie der Viewer), Gleichheit mit der App-Funktion wird getestet (§11).

**Richtung:** Long und Short getrennt (wie August). **Konfiguration** = (Detektor, Zeitrahmen, Richtung,
Haltedauer). Familie: **13 × 3 × 2 × 3 = 234**. Detektoren, die nur eine Richtung kennen (`kapitulation`),
füllen die andere nicht.

**Gleichheit gegen die App:** Jeder verwendete Detektor ist ein dünner Mantel um eine `quant.js`-Funktion
(Tabelle: `Q.rsiExtremSignal`, `Q.einstiegSignal`, `Q.reversionSignal`, `Q.pullbackSignal`, `Q.donchianSignal`,
`Q.squeezeSignal`, `Q.signalCross`) oder eine im August aus `depot.js` extrahierte reine Funktion (`orb.js`,
`wendepunkt-trendwechsel.js`). `test.js` ruft an echten Kerzen einer Datei (AAPL/2024) Mantel und
App-Funktion **Signal für Signal** nebeneinander auf und verlangt Gleichheit (§11).

## 2. Sitzung, Zulässigkeit, Haltedauern, Ein- und Ausstieg

- **Sitzung:** nur Kerzen mit `sitzung = 'regulaer'` aus den `sitzungen`-Bereichen der Datei (Kalender der Quelle,
  Halbtage schließen 13:00). Vor-/Nachbörse werden weder gelesen noch gemessen. **Kein Übernacht.**
- **Datenfenster fest:** 2016-01-01 bis 2026-08-31 (ET). Kerzen danach werden abgeschnitten; damit ist egal,
  dass die App an die 2026-Dateien anhängt.
- **Zulässige Signalkerze** (wie August `MIN_REST`, `COOLDOWN`): nach dem Ende der Signalkerze verbleiben
  **≥ 30 Minuten** regulärer Sitzung (August: 1m 30 / 5m 6 / 15m 2 Kerzen = 30 Min); **Cooldown 60 Minuten**
  je (Reihe, Detektor, Zeitrahmen) nach einem Signal (August: 60/12/4 Kerzen). Zusätzlich muss eine Folgekerze
  in derselben Sitzung existieren (sonst kein Einstieg, das Signal zählt als „ohne Einstieg").
- **Haltedauern:** **1 h, 3 h, bis Schluss** — die drei Horizonte der August-Registrierung (`HORIZONTE`:
  1h/3h/TS); „bis Schluss" ist damit schon der dritte. In **Minuten** gerechnet, nicht in Kerzen, damit dünne
  Reihen mit Lücken dieselbe Haltedauer haben.
- **Einstieg:** **Eröffnung der Kerze i+1** (die erste Kerze nach der Signalkerze i) — `bars[i+1][5]`.
- **Ausstieg** für H ∈ {60, 180} Minuten: **Eröffnung der ersten Kerze j mit t_j ≥ t_{i+1} + H Minuten**.
  Gibt es keine solche Kerze mehr in der Sitzung, hat dieser Horizont **keine Beobachtung** (August:
  `continue`). Für **bis Schluss**: **Schlusskurs der letzten regulären Kerze des Tages** (die
  Schlussauktion; eine „Eröffnung der Kerze danach" gibt es nicht).
- **Kein Kurs, den das Signal selbst benutzt** (`wiki/fehlerformen.md`, „Geteilter Kurs"): Das Signal sieht
  `bars[0..i]`; Ein- und Ausstieg liegen ausschließlich in `bars[i+1..]`. Gegenprobe in `test.js`: mit
  `bars[i][1]` (Signalschluss) als Einstieg **muss** der Scheineffekt in behaupteter Richtung entstehen — die
  Probe ist rot, wenn er ausbleibt (§11).
- **Kassa-Short:** die Short-Seite wird mit derselben Hürde gerechnet und trägt den Vermerk „braucht Leihe;
  Hürde ist eine Untergrenze".

## 3. Ergebnisgröße

**Rohertrag je Signal** (Pp): `r = dir × (Ausstieg − Einstieg) / Einstieg × 100`.

**Überschuss (netto) je Signal:** `u = r − K(Klasse des Wert-Tages)` mit **K = Kassa-Hürde je Umlauf, Fenster
`mitte`, ab 2021** (`wiki/kosten.md`, „Das K der Kostenformel für das Kassa-Gefäß"):

| Klasse (Mio $ Median-Tagesumsatz) | K je Umlauf (Pp) |
|---|---|
| 5–50 | **0,1569** |
| 50–250 | **0,0854** |
| 250–1.000 | **0,0647** |
| ab 1.000 | **0,0449** |

**Die Hürde ab 2021 gilt für alle Jahre** — sie ist die heutige Hürde; die Frage lautet „lohnt es sich heute",
nicht „hätte es sich 2017 gelohnt". Unter 5 Mio $ gibt es keine Klasse (`kosten.js UMSATZ_KLASSEN`): dort wird
kein Signal gewertet, die Zahl wird ausgewiesen. Der **Cent-Boden-Vorbehalt** (`kosten.md`) gilt: für liquide
Klassen ist K zu einem großen Teil eine Preisaussage.

**Umsatzklasse des Wert-Tages:** `Liquide.medianUmsatz` (`liquide.js`, Median = `sortiert[n >> 1]`) über die
**20 regulären Handelstage vor dem Signaltag** (d−20 … d−1; der Signaltag selbst ist zur Signalzeit noch
nicht vollständig — Zukunftsblick vermeiden), Tagesumsatz = letzter regulärer Schluss × Σ reguläre Stück,
**aus den 1m-Kerzen selbst gerechnet**. Weniger als 20 Vortage ⇒ „ohne Klasse", nicht gewertet, gezählt.
Klassengrenzen: `kosten.js UMSATZ_KLASSEN` (5/50/250/1.000 Mio $, per Test gegen die Quelle gehalten).

**Nachrichtlich, vorregistriert als zweite Größe mit Vorrangregel:** **marktbereinigt** `m = (r − Topf) − K`,
wobei **Topf** das Mittel des Rohertrags **aller zulässigen regulären Kerzen aller Reihen** derselben
(ET-Tag, Zeitrahmen, Haltedauer, Umsatzklasse, lebend-Flag) ist — der **Nullpunkt aus dem ganzen Topf**
(§7b). **Vorrang:** das Urteil fällt über `u`; `m` darf ein „belegt" nur **herabstufen** (§6), nie erzeugen.
Grund: ein positives `u` bei negativem `m` ist Marktzeit („Monatswende war Marktzeitgeschäft",
`belegstand.md`), kein Signal.

## 4. Aggregation — der Tag ist die Clustereinheit

Je (Konfiguration, ET-Tag) das **Mittel über alle Signale des Tages** (alle Reihen). Die Tagesreihe trägt das
Urteil: Tagesmittel, `se = sd(Tagesmittel) / √nTage`, `t = Tagesmittel / se`. Signale desselben Tages teilen das
Marktbeta (`CLAUDE.md`, „Die Mühle"; `fehlerformen.md`, „Querschnitt misst den Tag"). Ausgewiesen wird immer
die **Zahl der Zeitpunkte (Signaltage)**, daneben die Zahl der Signale und der Reihen. Der **Erwartungswert je
Signal** (signalgewichtet) steht daneben; weichen die Vorzeichen ab, trägt die Zeile die B2-Warnung der
Messmaschine („dünne Tage tragen den Schätzer").

Im Speicher liegen nur **Summen** je (Konfiguration, ET-Tag, Umsatzklasse, lebend-Flag): `n, Σr, Σr²`
(netto folgt daraus, weil K in der Zelle konstant ist), dazu je Reihe die Signalzahl je Detektor
(**Signalanteil vorab zählen**, `fehlerformen.md` „Behauptung statt Bestätigung").

## 5. Entdeckung und Bestätigung — nach Tagen, vor der ersten Rechnung fest

**Regel aus der August-Registrierung, übernommen und zitiert:** „Entdeckung und Bestätigung auf getrennten
Tagen. Die Auswahl geschieht ausschließlich auf der Entdeckungsmenge. Die Bestätigungsmenge wird genau einmal
angefasst, am Ende, mit der vorher fixierten Kandidatenliste." Split wie Tier B: „Entdeckung = erste 2/3 der
Handelstage, Bestätigung = letztes Drittel" (`messgeschirr.js`: `cutoff = alleTage[floor(n · 2/3)]`, globaler
Kalender).

Aus dem Kalender der Quelle (2.680 Handelstage):

| | Tage | von | bis |
|---|---|---|---|
| **Entdeckung** | **1.786** | 2016-01-04 | 2023-02-06 |
| **Bestätigung** | **894** | **2023-02-07** | 2026-08-31 |

**Regimeschnitt 2021-01-01, vor der Messung:** Die Bestätigung wird **allein über Tage ≥ 2021-01-01**
geurteilt — mit dem Split oben ist das die ganze Bestätigungsmenge, und `auswerten.js` erzwingt es
unabhängig vom Split. Kosten und Übernachtdrift sind seit 2021 anders (`fehlerformen.md`,
`uebernachtdrift-eingang-kollabiert`). Die Entdeckung wird zusätzlich **getrennt ≤ 2020 / ≥ 2021 (527 Tage)**
ausgewiesen — als Diagnose, nicht als Filter.

## 6. Die zwei Tore, Bonferroni, und was die Wörter heißen

Beide Tore (`CLAUDE.md`, „Zwei Tore VOR dem Bestätigungslauf") hängen nur an der **Zahl der Bestätigungs-
Signaltage und der Streuung**, nicht am Ergebnis. `se_B = sd_B / √nTage_B` aus der Bestätigungs-Tagesreihe
(Streuung, nicht Mittel); `MDE_B = 2 · se_B`.

1. **Tor 1 — Entdeckung ≥ 4 × MDE_B**, und Entdeckungs-Tagesmittel netto > 0. Wer durchfällt, ist **kein
   Kandidat** (keine Aussage). k₁ = Zahl der Konfigurationen, die Tor 1 passieren.
2. **Tor 2 — `delta80` unter der Kassa-Hürde der Klasse, in der die Kante behauptet wird:**
   `delta80 = (z_Bonf(k₁) + 0,8416) · se_B` (Messmaschine S2, `zPower80`), verglichen mit
   **K_Kandidat = signalgewichtetes Mittel der Hürden über die Entdeckungssignale** der Konfiguration
   (= brutto − netto in der Entdeckung); je Klasse steht der Vergleich daneben. `delta80 > K_Kandidat` ⇒
   der Lauf bräuchte mehr Signaltage, als das Fenster hat (`N_nötig = nTage_B · (delta80/K)² > nTage_B`) ⇒
   **„nicht entscheidbar"**, wird nicht bestätigt und **spart Bonferroni**. k₂ = Zahl der Konfigurationen, die
   beide Tore passieren.
3. **Bonferroni über k₂** (zweiseitig, α = 0,05): `z_Bonf(k) = Φ⁻¹(1 − 0,025/k)`; k = 1 ⇒ 1,96, k = 5 ⇒ 2,81,
   k = 20 ⇒ 3,29. Die Entdeckung ist reines Ranking ohne Signifikanzanspruch (August, Punkt 2).

**Die Wörter, als Regel mit Zahl:**

- **belegt:** Tor 1 und Tor 2 bestanden; Bestätigung ab 2021 mit **≥ 30 Signaltagen**; netto Tagesmittel_B > 0
  und `t_B ≥ z_Bonf(k₂)`; Vorzeichen wie in der Entdeckung; **Placebo im Band** (§7a); marktbereinigtes
  Tagesmittel_B > 0 (sonst „belegt, aber Marktzeit" — herabgestuft, kein Beleg).
- **widerlegt als Größe:** obere 95-%-Grenze des **Brutto**-Tagesmittels_B (`Tagesmittel + 1,96 · se_B`)
  **< K_Kandidat** („in seiner Klasse zu"); < 0,0449 ⇒ „in jeder Klasse zu" (`belegstand.md`,
  Größen-Ausschlüsse). Das ist eine Größenaussage über die Bestätigungsmenge, kein Nachweis von null.
- **nicht entscheidbar:** alles andere — Tor-Fehler, < 30 Signaltage, Band schließt K ein.
- **handelbar:** nur, was belegt ist **und** dessen `delta80 ≤ K_Kandidat` (Tor 2) — die Auflösungswand
  (`wiki/aufloesungswand.md`) entscheidet, nicht der t-Wert.

## 7. Drei Kontrollen, die mitlaufen — in derselben Tabelle wie der Kandidat

**(a) Placebo.** Je (Detektor, Zeitrahmen, Reihe, Tag) mit k Signalen zieht das Placebo **k zufällige zulässige
reguläre Kerzen** desselben Tages (ohne Kursblick, ohne Zurücklegen, dieselben Regeln aus §2) mit zufälliger
Richtung; Saat deterministisch aus (Reihe, Tag, Detektor). Dieselbe Tagesfrequenz, derselbe Ein-/Ausstieg,
dieselben Zellen. **Soll:** vor Kosten null **gegen den Topf**: das Tagesmittel von `Placebo − Topf` hat
`|t| < 3` und `|Mittel| < 0,01 Pp` je (Zeitrahmen, Haltedauer). Verfehlt ⇒ die Maschine ist verschoben,
**kein Kandidat dieses Zeitrahmens wird „belegt"** (Messmaschine: `bestaetigt-aber-nullpunkt-verschoben`).
Das Kriterium ist ein Band, kein Test auf exakt null: ein Kriterium, das einen sauberen Placebo durchfallen
lässt, ist selbst der Fehler (`fehlerformen.md`, „Kontrollkriterium falsch gebaut"). Das rohe Placebo-Mittel
wird als **Intraday-Drift** berichtet (`messmethodik.md` §4: Placebo fand 4 Fehler, die 7 Prüfungen übersahen).

**(b) Nullpunkt.** Der Topf (§3) schöpft aus **allen** zulässigen regulären Kerzen aller Reihen der Zelle —
**nie aus dem Signal-Topf** (`nullpunkt-der-messmaschine`, A6→A7). Nullarchive und Placebo dienen nur der
**Verzerrungsmessung**, nie der Signifikanz (A8): das Urteil kommt aus der Tagesreihe des Kandidaten.

**(c) Überlebensverzerrung.** Jede Zelle trägt ein **lebend-Flag**: lebend ⇔ letzter Balken der Reihe
≥ 2026-08-17 ET (letzte zwei Handelswochen des Fensters; `~2`-Reihen zählen für sich). `auswerten.js` rechnet
alles **zweimal**: über alle Reihen und nur über lebende. Die Differenz je **Detektor-Familie** steht im Bericht:
**Dip** (`rsi2`, `rsi2seit`, `kapitulation`, `reversion`, `vwap-abstand`), **Ausbruch/Trend** (`donchian`,
`squeeze`, `orb`, `kanaltrend`, `signalCross`, `pullback`, `wave`), **Wende** (`wendepunkt-trendwechsel`).
August-Anker: das Yahoo-Archiv beschönigte die Dip-Familie um **−3,78 Pp** je Signaltag
(`studien/verzerrungsrichtung-2026-08-26/`). Vorbehalt aus `wiki/ueberlebensverzerrung.md`: die Verschwundenen
sind eine **andere Grundgesamtheit** (kleiner, billiger) — die Differenz mischt Sterblichkeit mit Größe;
deshalb steht sie zusätzlich **je Umsatzklasse**.

**Positivkontrolle** (§11): eine Kunst-Reihe mit gepflanzter Kante bekannter Größe muss vom Werkzeug in Größe
und Richtung wiedergefunden werden — sonst ist jede Null wertlos.

## 8. Kapitalmaßnahmen und Reihenhygiene

- **Splits:** bereinigte Datei aus `alpaca1m-bereinigt/`, wo vorhanden (`_regel.json`: fehlt sie, IST die Rohdatei
  die bereinigte). Splits sind dort mit `new_rate/old_rate` exakt korrigiert (`datenquellen.md`).
- **Abspaltungen ohne Kursfaktor:** Werte, deren Faktor „unklar" blieb, haben **keine** bereinigte Kopie
  (`_regel.json ohneKopieWeilAbspaltung`) — ihre Rohreihe trägt den Sprung **und** etwaige unkorrigierte Splits.
  Regel: für jede Reihe, die **roh** gelesen wird, werden alle Ex-Tage von `forward_splits`, `reverse_splits`,
  `unit_splits`, `spin_offs` aus `alpaca-massnahmen/<ORDNER>.json` **± 10 Handelstage** ausgeschlossen
  (Rückblick des längsten Detektors: 261 Kerzen ≈ 10 Handelstage auf 15m); für bereinigt gelesene Reihen nur
  die dort **nicht angewandten** Maßnahmen (Kopf `herkunft`). Dividenden: irrelevant (kein Übernacht). Die
  Zahl der ausgeschlossenen Reihen-Tage wird ausgewiesen. Stand der Quelle: 92 unklare Abspaltungen.
- **`~2`-Reihen:** eigene Reihe ab `zweiteReihe.abMs`; der erloschene Träger nur bis `wiederverwendet.schnitt`.
- **ETFs** (Gruppe `etf`, 31) werden ausgeschlossen — die Hürde ist an Aktien gemessen. Die Verschwundenen sind
  nach `verschwundene.json` „aktienartig" gefiltert (`ueberlebensverzerrung.md`), weiter nicht geprüft.
- **Unlesbare Datei** (Anhang im Gang): einmal nach 5 s wiederholen, dann als „ausgelassen" protokollieren,
  nie raten. **Wachhund je Datei** (Zeitlimit, überspringen, protokollieren).

## 9. Auflösungs-Vorrechnung — beide Rechnungen, wie `aufloesungswand.md` es verlangt

Die August-Studie gibt die 22-Tage-MDE (t = 2): 1m 0,144 / 5m 0,217 / 15m 0,301 Pp (BERICHT.md; die 242 Tage
gehörten dem 60m-Teil). Daraus die **Tagesstreuung des Tagesmittels**: `sd = MDE · √22 / 2` ⇒ **1m 0,338 /
5m 0,509 / 15m 0,706 Pp**. Bestätigungstage hier: **894** (dichte Detektoren feuern bei ~3.000 Reihen an
praktisch jedem Tag). `MDE = 2 · sd/√894`, `delta80 = (2,81 + 0,84) · sd/√894` (k = 5 angenommen).

**Rechnung A — konservativ, Streuung wie August (88–158 Werte je Tag):**

| Zeitrahmen | sd Tag | MDE_B | delta80 | 5–50 (0,157) | 50–250 (0,085) | 250–1000 (0,065) | ab 1000 (0,045) |
|---|---|---|---|---|---|---|---|
| 1m | 0,338 | 0,023 | **0,041** | ✓ | ✓ | ✓ | ✓ (knapp) |
| 5m | 0,509 | 0,034 | **0,062** | ✓ | ✓ | ✓ (knapp) | ✗ |
| 15m | 0,706 | 0,047 | **0,086** | ✓ | ✗ (knapp) | ✗ | ✗ |

**Rechnung B — geeicht auf den Marktboden.** Mit ~3.000 Reihen je Tag konvergiert das Tagesmittel des **rohen**
Ertrags gegen die Marktrendite der Haltedauer; ihre Streuung ist der Boden, unter den kein Querschnitt kommt
(S&P intraday σ ≈ 0,9 Pp/Tag 2016–2026): **1 h ≈ 0,35 / 3 h ≈ 0,60 / bis Schluss ≈ 0,70 Pp**. Dünne
Detektoren (≈ 5 Signale/Tag, idiosynkratisch ≈ 1,0 Pp je Signal auf 1 h) liegen darüber.

| Haltedauer | sd Tag (dicht) | MDE_B | delta80 | 5–50 | 50–250 | 250–1000 | ab 1000 | dünn: sd / delta80 |
|---|---|---|---|---|---|---|---|---|
| 1 h | 0,35 | 0,023 | **0,043** | ✓ | ✓ | ✓ | ✓ (knapp) | 0,57 / 0,070 |
| 3 h | 0,60 | 0,040 | **0,073** | ✓ | ✓ | ✗ | ✗ | 0,80 / 0,098 |
| bis Schluss | 0,70 | 0,047 | **0,085** | ✓ | ✓ (knapp) | ✗ | ✗ | 0,90 / 0,110 |

**Folge, vor dem Lauf hingeschrieben:** Die Studie ist für **1 h in allen Klassen** und für **jede Haltedauer in
den beiden illiquiden Klassen** entscheidbar; für **3 h / bis Schluss in 250–1000 und ab 1000 ist sie mit
dem rohen Endpunkt strukturell blind** — dort kann sie höchstens **Obergrenzen** liefern („dort liegt nichts
über X", Größenaussage), kein Ja. Die marktbereinigte Nebengröße (§3) ist um den Faktor √(Signale je Tag)
schärfer (Anker: Faktor 4,2 in `news-sentiment-vollkorpus`), darf aber nach der Vorrangregel nur
herabstufen — ein „Ja" über sie wäre eine andere Studie. **Beide Rechnungen sind Planzahlen; der Lauf
schreibt die realisierten `se_B` daneben** („Zugewinn kennzeichnen, nicht als vorregistriert ausgeben").
**Nicht entscheidbar ist der Befund, kein Nein** (`messmethodik.md` A1).

## 10. Erwartungen, vorab notiert

**PM (seit 03.09. im Gedächtnis):** die meisten Kandidaten bleiben null; **2–3 aus der Dichte-/Kapitulations-
Familie** könnten unter Kassa-Kosten über die Hürde kommen; handelbar entscheidet die Auflösungswand.

**Diese Rolle, abweichend:** Die Dip-Familie zeigt auf 1m/5m in den liquiden Klassen vermutlich ein
positives Brutto von 0,03–0,08 Pp (August: `rsi2seit` reproduzierte +0,11 unter der Auflösung) — **unter**
der Klassenhürde; in 5–50 größer, aber gegen 0,157 Pp netto negativ. Erwartung: **kein Kandidat belegt und
handelbar**, mehrere „widerlegt als Größe" in ab 1000, der Rest „nicht entscheidbar". Ausbruchs- und
Wende-Familie: null oder negativ (Kontraindikator-Muster wie Technik-Score). Wer nach dem Lauf etwas anderes
liest, lese diesen Absatz noch einmal.

## 11. Das Messgerät und seine Tests (Phase 1, Commit 2)

- `lesen.js`: eine Symbol-Jahr-Datei in einem Stück (bereinigt, sonst roh), Reihe über `_lebenszeit.json`/
  `_symbole.json`, auf das Datenfenster geschnitten, reguläre Kerzen aus `sitzungen`, 5m/15m per
  `verdichtenMinuten`; Warmlauf aus dem Vorjahr (Rückblick 261 Kerzen, 20 Vortage Umsatz), damit der
  Jahresanfang nicht fehlt.
- `messen.js`: **ein Durchlauf je Datei**, alle 39 Kandidaten × Haltedauern × Placebo × Topf in einem Zug;
  Zellen im Speicher (dichte Felder `n, Σ, Σ²`), Checkpoint alle N Dateien (`_fortschritt.json` +
  `_zellen.bin`), Neustart lädt und überspringt; Wachhund je Datei; Heap 4 GB; Abbruch gefahrlos;
  `--teil k/n` für mehrere Prozesse.
- `auswerten.js`: Tagesreihen, Tore, Bonferroni, `delta80`, Placebo-Band, Topf, Überlebens-Differenz,
  Regimeschnitt, Obergrenzen ⇒ `ERGEBNIS.md` + `ergebnis.json`. **Ein Lauf auf Kunst- oder Pilotdaten heißt
  `PILOT-*.md`, nie `ERGEBNIS.md`** (`fehlerformen.md`, „Ein Trockenlauf, der aussieht wie ein Befund").
- `nacht.cmd`: Wrapper für die Aufgabenplanung — **nur geschrieben, nicht gestartet**.
- `test.js` (Positivkontrolle und Sperrklinken): Kunst-Reihe mit gepflanzter Kante, **keine Gerade**
  (`fehlerformen.md`), Detektor findet sie, Größe und Richtung stimmen; Placebo auf Zufallsreihe = null
  im Band; Detektor-Gleichheit gegen `quant.js` Signal für Signal an echten Kerzen (AAPL/2024, nur lesen);
  Verdichtung = `verdichtenMinuten`; Klassenregel = `liquide.js` + `kosten.js UMSATZ_KLASSEN`; Hürden = die
  Zahlen aus `wiki/kosten.md`; Fortsetzbarkeit (nach k Dateien abbrechen, neu starten, Zellen bitidentisch);
  **Gegenprobe geteilter Kurs** (Signalschluss als Einstieg ⇒ Scheineffekt in behaupteter Richtung, muss
  rot sein); Tage außerhalb des Fensters, Vorbörse und Klasse < 5 Mio $ zählen nicht.
- **Pilot (≤ 20 Reihen, alle Jahre, nur lesen):** liquide AAPL, MSFT, NVDA, AMZN, JPM, XOM, PG, HD, COST, UNH;
  illiquide COKE, NEU, CRVL, WINA, DJCO (DJCO vermutlich unter 5 Mio $ — Probe der Klassenausschluss-Regel);
  verschwunden AATC, ABVE, AC, ADAP, ACCD (Ende 2025/2026, ≥ 6 Jahre). Laufzeit wird gemessen und auf
  ~51.700 Dateien hochgerechnet. **Der Vollauf startet nicht aus diesem Chat.**

## 12. Was diese Studie NICHT sagt

- Nichts über **neue Detektoren oder andere Parameter** — gemessen wird, was in der App steht.
- Nichts über **Übernacht**, **CFD**, **Scheine**, **Yahoo-Daten**, **60m**.
- Nicht die **effektiven** Kosten (Schlupf, Tiefe, Teilfüllung): die notierte Spanne ist eine Untergrenze.
- Kein **Ja** aus der Entdeckung, aus der marktbereinigten Nebengröße oder aus einem Placebo-Abstand.
- **Für blinde Zellen (§9) kein Nein** — nur Obergrenzen.
- Nichts über die Zeit **vor 2016** und nichts über Werte, die auch Alpaca nicht führt.

---

*Commit 1 dieser Studie ist diese Datei. Jede Abweichung davon steht als datierter Nachtrag unter dieser Linie,
nie darüber.*

## 13. NACHTRAG 1 — 07.09.2026, vor dem Pilot und vor jeder Auswertung

**Anlass:** adversarische Prüfung der Vorregistrierung (drei Blickwinkel, jeder Fund von einem Skeptiker
gegengelesen; Rohfassungen in der Übergabe genannt) und die Laufzeitprobe an AAPL/2016 (eine Jahresdatei lief in
den 900-s-Wachhund). Gerechnet wurde bis hier **keine Rendite** außer den Gleichheits- und Laufzeitproben unten.
Was hier steht, ersetzt die genannten Stellen oben; alles andere bleibt.

1. **Bonferroni (§6.3, §9) — Rechenfehler.** Nach der eigenen Formel `z_Bonf(k) = Φ⁻¹(1 − 0,025/k)` gilt
   **k = 1 ⇒ 1,96, k = 5 ⇒ 2,58, k = 10 ⇒ 2,81, k = 20 ⇒ 3,02, k = 50 ⇒ 3,29**; 2,81 und 3,29 gehörten zu k = 10
   und k = 50. §9 rechnete `delta80` deshalb mit 3,65 statt **3,42** — alle Plan-`delta80` waren 6,8 % zu groß.
   Korrigierte Planwerte (sd und MDE_B unverändert): Rechnung A **1m 0,039 / 5m 0,058 / 15m 0,081**; Rechnung B
   **1 h 0,040 / 3 h 0,069 / bis Schluss 0,080**; dünn **0,065 / 0,091 / 0,103**. Geänderte Zelle: **15m gegen
   50–250 (0,0854): ✗ (knapp) → ✓ (knapp)**; 5m gegen 250–1000 wird klar ✓. Der „Folge"-Absatz bleibt.
   `auswerten.js` rechnet die Normalquantile selbst und prüft sich an diesen Werten (test.js).
2. **Vorzeichen der Marktbereinigung (§3, §7a).** Der Topf ist der **ungerichtete Long-Ertrag**. Richtig:
   `m = dir · (rohLong − Topf) − K`, also `roh_gerichtet − dir · Topf − K`. Der Placebo-Nullpunkt wird ebenso
   gerichtet geprüft: `dir_p · (rohLong_p − Topf)`. Die **Intraday-Drift** wird aus der Topf-Tagesreihe
   berichtet (Placebo A hat mit Zufallsrichtung per Symmetrie Erwartung null und misst keine Drift).
3. **Placebo-Band (§7a) — Einheit und Skala.** Zwei Ebenen: je **Konfiguration** (Detektor × ZR × H)
   `|t| < 3` für `dir_p · (rohLong_p − Topf)`; **gepoolt** je (ZR, H) über alle 13 Detektoren `|t| < 3` **und**
   `|Mittel| < 0,01 Pp`. Fällt die gepoolte Prüfung, bekommt kein Kandidat dieses (ZR, H) „belegt"; fällt nur
   die eigene, nur dieser Kandidat nicht. Eine absolute Schranke allein hätte einen sauberen Placebo mit se ≈ 0,01
   in jedem vierten Fall durchfallen lassen.
4. **Placebo B — gepaart (neu, §7a).** Zu jedem echten Signal wird eine andere zulässige Kerze **desselben
   30-Minuten-Fensters desselben Tages** mit **derselben Richtung** gezogen (ohne Kursblick, deterministisch).
   `Kandidat − Placebo B` ist die tageszeit- und tagesneutrale Differenz (Augusts „Kontrolle je Tageszeit-
   Versatz") und steht **nachrichtlich** in der Kandidatentafel; sie erzeugt kein Urteil. Placebo A bleibt der
   Maschinen-Nullpunkt (Erwartung exakt null gegen den Topf).
5. **Tor 1 (§6.1) — welche Größe.** Das **netto** Tagesmittel der Entdeckung muss ≥ 4 × MDE_B sein (und > 0).
   Netto ist der Endpunkt; brutto steht daneben.
6. **K_Kandidat (§6.2) — aus der Bestätigung, ergebnisfrei.** Signalgewichtetes Mittel der Klassenhürden über
   die **Signalzahlen je Klasse in der Bestätigungsmenge** (Zählung, keine Rendite), nicht über die Entdeckung;
   der Klassenmix wandert über die Jahre (nominale Schwellen, `fehlerformen.md`).
7. **Urteilseinheit und Signaltag (§4, §6).** Einheit ist die **Konfiguration** (234), Klassen gepoolt, jede
   Hürde je Signal; die Klassenzerlegung steht **nachrichtlich** daneben und erzeugt kein Urteil und keinen
   Test. **Signaltag** = ET-Tag mit ≥ 1 gewertetem Signal der Konfiguration (Klasse bekannt, Einstieg vorhanden,
   Horizont beobachtet). Signale ohne Klasse / ohne Einstieg / ohne Horizont zählen für keinen Signaltag; ihre
   Zahl wird ausgewiesen.
8. **Wertpapierart (§8) — der ETF-Ausschluss traf 31 von 732.** Die Gruppe `universum` enthält 732
   Nicht-Aktien (666 ETF, 32 ETV, 16 FUND, 7 ETN …, dazu das Nasdaq-Testsymbol ZVZZT). Zulässig sind nur Reihen
   mit Wertpapierart **CS oder ADRC** aus `Markt-Dashboard-Daten/massive/wertpapierarten.json`, geprüft über
   `studien/messmaschine/strategien/wertpapierart.js` (Testkürzel ausgeschlossen); fehlt die Karte, bricht der
   Lauf ab. Ausgeschlossene werden je Art gezählt. Erwartung: ~2.500 Aktien im Universum plus die Verschwundenen.
9. **80-%-Regel (§1, §2) — die Datenvorbedingung der Detektoren.** Wie `messgeschirr.js ladeUniversum`: ein
   ET-Tag geht nur in die Detektion, wenn er **≥ 80 % der 1m-Sollkerzen** der Sitzung trägt (312 von 390, 168
   von 210 am Halbtag). Dünne Tage werden gezählt (`tageDuenn`), auf allen drei Zeitrahmen ausgelassen und
   fließen nur in den 20-Tage-Umsatz ein. Die Detektions-Reihe je (Datei, ZR) wird nur aus dichten Tagen gebaut.
10. **Zeitrahmen explizit (§1).** Statt `auto` werden je Zeitrahmen gesetzt: 1m `rsi2 mtf:true`, `reversion
    tagesreihe:true`, `wendepunkt-trendwechsel tagesreihe:true`; 5m/15m alle `false`. Zusätzlich muss
    `barMinVon(bars)` dem Soll (1/5/15) entsprechen, sonst wird (Datei, ZR) ausgelassen und gezählt
    (`zeitrahmenNichtErkannt`).
11. **Aufruf-Fensterung und Vorfilter (Laufzeit, §11).** Gemessen an AAPL/2016: `vwap-abstand` mit `bars[0..i]`
    kostet **52 ms je Aufruf** (1m; 78 Minuten je Jahresdatei), `kanaltrend` 1,25 ms, alle anderen 0,03–0,3 ms.
    Deshalb: (a) `vwap-abstand` bekommt ein Fenster, das **an einem Tagesanfang beginnt und ≥ 110 Kerzen vor i
    enthält** (die VWAP setzt je UTC-Tag neu auf, `reversionSignal` braucht 80 Abstände + Periode 20);
    Gleichheitsprobe 1m: 400 Indizes, **0 Abweichungen**, 0,74 ms je Aufruf — ein Fenster nur ab dem Vortag
    war auf 15m **falsch** (0 statt 22 Signale), daher die 110-Kerzen-Regel; test.js prüft alle drei Zeitrahmen.
    (b) `kanaltrend` wird nur gerufen, wenn `Q.signalCross` auf demselben 261er-Fenster eine Kreuzung meldet —
    `einstiegSignal` verlangt genau das (`if (!tsig.crossed) return null`). Die Detektoren selbst bleiben
    unverändert; beides sind Eigenschaften des Aufrufs, beide mit Gleichheitsprobe Signal für Signal.
12. **Einstiegsfenster-Hürde (§3) — zweite Nettogröße, nachrichtlich.** Die Quelle misst die Eröffnungsspanne
    1,8–2,7× und die Schlussspanne 0,63–0,73× der Mittagsspanne (`kosten.md`); mehrere Detektoren feuern an der
    Eröffnung. Je Signal wird zusätzlich die Hürde **nach dem Einstiegsfenster** summiert: Einstiegskerze vor
    10:00 ET → `K_mitte × Verhältnis (2,68 / 2,46 / 2,07 / 1,81)`, ab 15:30 ET → `K_schluss ab 2021 (0,1025 /
    0,0540 / 0,0409 / 0,0329)`, sonst `K_mitte`. Der Endpunkt bleibt `K_mitte` (Auftrag); **„belegt" verlangt
    zusätzlich netto_Fenster > 0**, sonst „belegt, aber Eröffnungskosten". Zellen tragen dafür eine vierte
    Summe (`h2`).
13. **lebend (§0.1, §7c).** Eine Schwelle: letzter Balken **≥ 2026-08-17 ET**; §0.1 zählte zur Orientierung mit
    ≥ 2026-08-01 (3.074) — der Lauf weist die Zahl aus. Ein erloschener Träger eines wiederverwendeten Kürzels ist
    **nie** lebend (sein Kürzel hat heute Balken, er nicht). „Lebend" ist die Näherung für „am 31.08.2026
    gelistet"; gelistete Reihen ohne Balken seit dem 17.08. gelten als nicht lebend. „Verschwunden" heißt nicht
    „gestorben": Namenswechsel und Fusionen aus `alpaca-massnahmen` werden je Reihe als **Ende-Art**
    nachrichtlich mitgeführt.
14. **„Bis Schluss" (§2)** ist der Schlusskurs der **letzten regulären Kerze (15:59)** — der 16:00-Balken zählt
    als `nach`; die Schlussauktion selbst ist nicht in den Minutenbalken. Näherung, ausgewiesen.
15. **Gegenprobe geteilter Kurs (§2, §11).** Der Scheineffekt hat je Familie ein Vorzeichen: **Dip-Detektoren
    positiv** (Kauf am tiefen Schluss, Rückprall), **Ausbruchs-Detektoren negativ**. test.js führt die Probe an
    einem Dip-Detektor (positiv erwartet).
16. **Cooldown (§2):** gesperrt ist jede Kerze mit `t_i − t_letztesSignal < 60 min` (Stempelabstand).
17. **Zahl der Abweichungen vom August (§1):** es sind **zehn** Detektoren mit neuen Zeitrahmen, nicht acht
    (zusätzlich `orb` und `wendepunkt-trendwechsel` auf 15m).
18. **„Gleichheit gegen die App" (§1, §11), präzisiert:** geprüft wird Gleichheit des Tabellen-Mantels mit der
    `quant.js`-Funktion (`rsi2`, `reversion`, `squeeze`, `donchian`, `kapitulation`, `rsi2seit`) bzw. mit der im
    August aus `depot.js` extrahierten reinen Funktion (`orb`, `wendepunkt-trendwechsel`). Die App-Gleichheit der
    Extraktion hat die August-Phase 1 belegt; `vwap-abstand` und `kanaltrend` sind Studien-Definitionen ohne
    Live-Pendant (Tabelle).
19. **Umsatzklasse (§3), präzisiert:** Tagesumsatz = letzter regulärer Schluss × Σ reguläre Stück (**nur
    Sitzung**; die Hürdenmessung schichtete nach Tagesdaten mit Gesamtvolumen — Klassen fallen hier etwas
    niedriger aus, ausgewiesen); Fenster = **20 Balkentage** der Reihe (Tage mit regulären Kerzen), nicht
    Kalendertage; `Liquide.medianUmsatz(ums, d−1, 20)` nimmt genau die Tage d−20 … d−1.
20. **Obergrenzen (§6) für alle Konfigurationen** mit ≥ 30 Bestätigungs-Signaltagen — auch für die, die kein
    Kandidat sind: „widerlegt als Größe" ist eine Größenaussage, kein Test, und erzeugt keine Multiplizität.
21. **Rechnung B (§9), Vorbehalt:** σ_Markt ≈ 0,9 Pp/Tag ist ein Ansatz ohne Fundstelle; die Wiki-Anker
    (`aufloesungswand.md`: Tag 1,474, mehrtägig 2,8) legen bis ~1,2 nahe — dann wären die B-Werte um ein Drittel
    größer. nTage_B = 894 gilt nur für dichte Detektoren; die realisierten `se_B` und Signaltage stehen im
    Bericht neben beiden Planrechnungen. **Der Bericht rundet auf 4 Nachkommastellen; verglichen wird
    ungerundet.**
22. **Topf und Placebos folgen denselben Ausschlüssen** (Klasse < 5 Mio $, Maßnahmenfenster, dünne Tage,
    Zulässigkeit, Horizont nur mit Ausstieg) wie die Kandidaten.
23. **Laufzeit und Vollauf.** Die Laufzeitprobe steht in der Übergabe; `nacht.cmd` unterstützt `k/n`-Teile für
    mehrere Prozesse (16 Kerne), `auswerten.js` legt die Teile zusammen. Der Vollauf startet nicht aus diesem Chat.

Konfigurationskennung nach diesem Nachtrag: `signale-minuten-2026-09-06/v2` (drei Zellenreihen je Kandidat:
Kandidat, Placebo A, Placebo B; vier Summen je Zelle).

**Nachtrag 1a (07.09.2026, 07:55, nach drei Minuten Pilot, vor jeder Auswertung) — zu Punkt 9:** Die
80-%-Regel gilt **je Zeitrahmen** (August: Soll 390 / 78 / 26 Kerzen), nicht „1m für alle drei". Der erste
Pilotanlauf zeigte: CRVL/2025 mit 27.037 regulären 1m-Kerzen (≈ 108 je Tag) hatte 0 von 250 gewerteten Tagen,
ABVE 0 von 103, COKE 17 von 166 — die Klasse 5–50 wäre auf 1m **und** 5m/15m leer gewesen, obwohl ihre 5m-Kerzen
dicht sind. Jetzt: ein Tag geht in die Detektion eines Zeitrahmens, wenn er ≥ 80 % der Sollkerzen **dieses**
Zeitrahmens trägt; dünne Tage werden je Zeitrahmen gezählt (`tageDuenn[zr]`). Der Pilot wurde abgebrochen und
neu gestartet; keine Zahl des Anlaufs wurde angesehen außer den Zeilen des Laufprotokolls (Tage gewertet).

**Nachtrag 1b (07.09.2026, während des Piloten, vor jeder Auswertung) — ausgewiesene Abweichungen aus der
vollständigen Gegenprobe (58 Gegenproben, 53 Funde bestehen, 5 widerlegt; Liste in der Übergabe-Ablage):**

1. **Abweichung von der Mühle** (`CLAUDE.md`: „Überschuss gegen eine Kontrolle, die als Erwartung gebaut ist"):
   der primäre Endpunkt ist der rohe Netto-Ertrag (Auftrag §3); die Kontrolle (Topf, Placebo B) steht daneben und
   stuft nur herab. Das ist eine bewusste Abweichung, keine Vergesslichkeit — die Frage lautet „lohnt es sich
   heute", und die Kassa-Hürde wird gegen den Ertrag gehalten, nicht gegen einen Überschuss.
2. **Rauschboden nicht geprüft:** Placebo A prüft den Nullpunkt, nicht den Standardfehler. Ein zu großer oder zu
   kleiner `se_B` würde Tor 1/2 und `delta80` verschieben, ohne aufzufallen. Nachrichtlich vergleicht
   `auswerten.js` `se_B` des Placebo A mit dem des Kandidaten je Konfiguration (Verhältnis; Erwartung ≈ 1 bei
   gleicher Signalzahl) — kein Urteilskriterium, Auffälligkeiten werden berichtet.
3. **Cent-Boden nicht beziffert:** die Zellen tragen keinen Einstiegskurs; ob die Signalpopulation billiger ist
   als der Klassenmedian (und die Hürde damit unterschätzt), kann diese Fassung nicht sagen. Offen für den PM:
   eine fünfte Summe (Σ Einstiegskurs) kostet ~80 MB und einen Neustart des Piloten.
4. **Sonderdividenden** liegen als Kurslücke im 261-Kerzen-Rückblick roher und bereinigter Reihen (die Kopie
   bereinigt keine Dividenden, Yahoo intraday auch nicht) — die App-Detektoren leben damit; hier ebenso, nicht
   ausgeschlossen.
5. **Einstiegslatenz** (t_{i+1} − Kerzenende) ist auf dichten Tagen null und wird nicht summiert; die 80-%-Regel
   je Zeitrahmen begrenzt sie auf ≤ 20 % der Sitzung als Lücke.
6. **Fundstellen zu „seit 2021 anders":** Kosten: `wiki/kosten.md`, Tabelle „Das K der Kostenformel" (K 2016–2020
   gegen K ab 2021, z. B. 5–50: 0,1107 → 0,1569); Übernachtdrift: Gedächtnis `uebernachtdrift-eingang-kollabiert`
   (Regimeschnitt 2021 gehört vor die Messung). `fehlerformen.md` nennt beides nicht ausdrücklich — das Zitat oben
   war ungenau.
7. **Jahresanker der Hürden-Klassen:** die Spannen-Studie ordnete Symbole ihrer Klasse **je Jahr** zu, diese
   Studie **je Wert-Tag** (20 Balkentage). Dieselbe Regel (`liquide.js`), anderer Zeitanker — ausgewiesen.
8. **Wendepunkt-Rückblick:** `wendepunkt-trendwechsel` auf 5m/15m ist „fortlaufend" (Wendepunkte über die
   ganze Reihe); sein Rückblick ist nicht 261 Kerzen. Ein Kurssprung, der älter als 10 Handelstage ist, bleibt in
   seiner Wendepunktliste. Das Maßnahmenfenster ±10 Tage gilt trotzdem für alle Detektoren gleich — ausgewiesen.
9. **Randperioden der Verdichtung:** `verdichtenMinuten` verwirft die erste Periode eines Arrays, wenn sie vor dem
   ersten Stempel begann, und die letzte, wenn sie unvollständig ist. Die Arrays hier beginnen an Tagesanfängen
   (Warmlauf) und enden am 31.08.2026 16:00; betroffen ist höchstens eine 5m-/15m-Kerze am Anfang eines
   Symbol-Jahres ohne Warmlauf.
10. **Tor 2 mit z_Bonf(k₁), Urteil mit z_Bonf(k₂):** k₁ ≥ k₂, der Torwert ist die konservativere Schwelle;
    beide Zahlen stehen im Bericht.

**Nachtrag 1c (07.09.2026, nach dem Code-Review von konfig/lesen/messen, vor jeder Auswertung; Kennung → v3):**
Der Review (Rohfassung `review-code.md` in der Übergabe-Ablage) fand keinen schweren, sechs mittlere Fehler; alle
eingebaut. Zur Registrierung gehört einer: **die Randperiode der Verdichtung (1b.9) trat je JAHRESDATEI auf**, nicht
nur am Fensterende — fehlt am letzten Handelstag eines Jahres die 15:59-Kerze (dünne Reihen), verlor
`verdichtenMinuten` den letzten 5m-/15m-Eimer, „bis Schluss" wäre der Schluss des vorletzten Eimers gewesen.
Behoben mit einem Sentinel einen Tag später, der den Eimer schließt und dann weggefiltert wird (`lesen.js verdichte`).
Die übrigen betreffen den Bau, nicht die Messgröße: Zellen- und Fortschrittsdatei tragen denselben Stand und die
Fortsetzung verweigert bei Abweichung (kein doppeltes Einrechnen nach hartem Kill); Zähler kommen wie die Zellen je
Datei ganz oder gar nicht; ein Detektor, der auf > 1 % seiner Aufrufe wirft, bricht den Lauf mit Meldung ab statt
als „0 Signale" zu erscheinen; der Warmlauf nach Fortsetzung kettet zwei Vorjahre (bitidentisch zum Lauf am Stück);
Warmlauf 16 statt 12 Handelstage; Schlussfenster der Einstiegshürde am Halbtag ab 12:30; Lese-Verluste (nicht
regulär, ohne Kurs, außerhalb) werden gezählt; `huerdeEroeffnung` ungerundet. Der Pilot wurde mit der v3-Fassung
neu gestartet; die Laufzeiten des v2-Anlaufs (identische Rechenlast) liegen als Protokolle bei.
