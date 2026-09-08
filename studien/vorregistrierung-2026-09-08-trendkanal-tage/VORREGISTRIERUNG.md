# Vorregistrierung: Trendkanal auf Tagesbasis — 08.09.2026

**Geschrieben und committet, BEVOR eine Rendite gerechnet wurde.** Rolle: Berechnungen.
Auftrag: `Markt-Dashboard-Daten/uebergabe/auftrag-trendkanal-tage-2026-09-08.md` (PM, 08.09.2026).
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

Quelle: das Alpaca-Minutenarchiv auf `E:/Markt-Dashboard-Archiv/` (`alpaca1m/` roh, `alpaca1m-bereinigt/`
Split-bereinigt, `alpaca-massnahmen/`), **nur lesend**; `archiv1d/` (Yahoo-Tageskerzen, überlebensverzerrt)
**nur als Kreuzprobe**, nie als Messbasis. Die Studie schreibt ausschließlich in diesen Ordner.

---

## 0. Die Frage

Wilhelm, 08.09.2026: „Man muss ja warten, bis der Kanal sicher ausgebaut ist. Das ist eher etwas, was man über
Tage/Wochen laufen hat und nicht Minuten."

> **Bringt ein *ausgebauter* Trendkanal auf Tageskerzen, gehandelt über Tage bis Wochen, gegenüber dem Rest
> des Marktes einen Überschuss, der die Kassa-Hürde seiner Umsatzklasse übersteigt — und wenn ja, ist er
> handelbar (roher Netto-Ertrag > 0, Auflösungswand)?**

Was schon gemessen ist und hier **nicht** noch einmal gefragt wird:

- Minutenbasis 5m/15m (`studien/vorregistrierung-2026-09-06-signale-minuten/ergebnis-5m15m-2026-09-08/ERGEBNIS.md`):
  Ausbruchs- und Kanalregeln **schon vor Kosten negativ** (Donchian brutto −0,12 bis −0,21 Pp je Signal,
  t −15 bis −19; Kanaltrend −0,03 bis −0,08, t −11). 0 von 144 Konfigurationen bestehen Tor 1.
- Stundenbasis: der Abschnittskanal der App **als Bedingung schädlich** (−0,17 Pp, t −4,1; `wiki/belegstand.md`).
- Trend trägt bisher nur als **Kontext** (SPY über EMA200, t 3,2, R-TREND) und auf **Monatsskala** (Momentum
  liquide, an der Kante, `vorregistrierung-2026-09-02-momentum-liquide`).

Offen ist die Tagesskala mit Haltedauern von einer bis vier Wochen. Genau das misst diese Studie.

## 0.1 Gesehene Zahlen — vollständig deklariert

**Keine einzige Rendite, kein Signal, keine Zelle wurde berechnet.** Gesehen wurden, zur Planung:

| Größe | Wert | Woher |
|---|---|---|
| Handelstage im Fenster 2016-01-04 … 2026-08-31 (ET) | **2.680**, davon 21 Halbtage | `alpaca1m/_kalender.json` über `konfig.js` der Minutenstudie |
| Split 2/3 (Kalender der Quelle) | Entdeckung 1.786 Tage bis 2023-02-06, **Bestätigung 894 Tage ab 2023-02-07** | ebenda |
| Tage ab 2021-01-01 / davon in der Entdeckung | 1.421 / 527 | ebenda |
| Reihen CS/ADRC mit Balken (`L.reihen()` der Minutenstudie) | **7.299**, davon lebend 2.306, verschwunden 4.801 (Gruppe), universum 2.498 | `lesen.js`, `_lebenszeit.json`, `wertpapierarten.json` |
| ausgeschlossen je Wertpapierart | ETF 694, ETV 35, FUND 16, ETN 7, ETS 4, UNIT 1, TEST 1, ohne Art 1 | ebenda |
| Symbol-Jahr-Dateien im Fenster | **45.658** (Lebenszeit-Jahre; die Minutenstudie las 45.096 vorhandene, 83 fehlten) | `_lebenszeit.json`, ERGEBNIS §0 |
| `archiv1d/` Tagesreihen / davon Studien-Reihen | 2.965 / 2.249 — **SPY ist nicht in `archiv1d`** | Ordner |
| SPY im Minutenarchiv | 2016-01-04 bis 2026-09-03, 2.683 Tage, Art ETF (Gruppe `etf`) | `_lebenszeit.json` |
| Aufbau einer Jahresdatei | `series` `[zeit, schluss, umsatz, hoch, tief, eroeffnung]`, `sitzungen` mit `vor`/`regulaer`/`nach`; regulär endet **15:59 ET**, die 16:00-Kerze liegt im Bereich `nach` | SPY/2024.json, AAPL/2024.json (Kopf, ein Tag) |
| **Ein** Tag zur Formatprobe: AAPL 2024-01-02 | 09:30-Kerze Eröffnung **187,17** (Yahoo O 187,15); 15:59-Schluss 185,525; 16:00-Kerze O 185,51 / H 185,65 / L 185,51 / C 185,60, 11,75 Mio Stück (Yahoo **C 185,64**, V 82,5 Mio); Σ Stück regulär 64,4 Mio, + 16:00-Kerze 76,2 Mio, ganzer Tag 94,2 Mio | eine Datei, ein Tag, keine Rendite |

**Folge aus der Formatprobe, vor der Messung:** Der amtliche Schluss (Schlussauktion) lag an diesem einen Tag
**nicht** auf der Eröffnung der 16:00-Kerze, sondern zwischen deren Tief und Hoch. Die Wahl des Schlusses wird
deshalb nicht gesetzt, sondern **mit drei registrierten Kandidaten und einer Entscheidungsregel** gemessen (§1.2).

Der Auftrag nennt 45.096 Dateien; die Lebenszeit-Datei nennt 45.658 Symbol-Jahre. Die Differenz sind die in
`_luecken.json` erfassten fehlenden Jahre (PM 07.09.: 340 Reihen, alle erfasst) — „Datei fehlt" wird protokolliert.

---

## 1. Tageskerzen aus dem Minutenarchiv — nicht aus Yahoo

### 1.1 Definition je Reihe und Handelstag (ET-Kalendertag der Quelle)

Aus den 1m-Kerzen der Jahresdatei (bereinigt, wo eine Kopie existiert, sonst roh — `alpaca1m-bereinigt/_regel.json`):

| Feld | Definition | Rückfall (wird als Flag gezählt) |
|---|---|---|
| **O** Eröffnung | Eröffnung (`k[5]`) der **09:30-Kerze** (Eröffnungsauktion) | Eröffnung der ersten regulären Kerze des Tages, Flag `oSpaet` |
| **H** Hoch | Maximum der Hochs aller regulären Kerzen **plus** der 16:00-Kerze (Halbtag: 13:00-Kerze), falls vorhanden | — |
| **L** Tief | Minimum der Tiefs, gleiche Menge | — |
| **C** Schluss | **einer von drei Kandidaten, §1.2** | Schluss der letzten regulären Kerze, Flag `cRegulaer` |
| **V** Stück | Σ Stück aller regulären Kerzen **plus** 16:00-Kerze (die Schlussauktion gehört zum Handelstag) | — |
| `nReg` | Zahl der regulären 1m-Kerzen des Tages | — |

Die 16:00-Kerze ist die Kerze mit Stempel `bis + 60 s` des regulären `sitzungen`-Bereichs (Halbtag 13:00). Vor- und
Nachbörse gehen sonst nirgends ein. Ein Tag ohne reguläre Kerze existiert für die Reihe nicht. Kein Dichte-Filter
(die 80-%-Regel der Minutenstudie galt Detektoren, die über Minutenlücken rechnen; eine Tageskerze aus wenigen
Minuten ist eine dünne, aber echte Tageskerze); `nReg` wird gespeichert, damit die Auswertung dünne Tage zählen kann.

**Lebenszeit aus dem Archiv:** eine Reihe beginnt mit ihrem ersten und endet mit ihrem letzten Handelstag im Fenster
(`_lebenszeit.json`, `~2`-Reihen ab `zweiteReihe.abMs`, erloschene Träger bis `wiederverwendet.schnitt`, alles über
`lesen.js reihen()`). **Die Verschwundenen sind drin** — 4.801 der 7.299 Reihen. `lebend` ⇔ letzter Balken
≥ 2026-08-17 ET (Regel der Minutenstudie, Nachtrag 13).

**Kapitalmaßnahmen wie in der Minutenstudie (§8 dort):** roh gelesene Reihen: Ex-Tage von `forward_splits`,
`reverse_splits`, `unit_splits`, `spin_offs` **± 10 Handelstage** ausgeschlossen (kein Signal, kein Einstieg an
diesen Tagen; ein laufender Trade läuft durch); bereinigt gelesene: nur die dort nicht angewandten Maßnahmen.
`lesen.js ausschlussTage()` wird wiederverwendet. Zusätzlich wird je Tag der **Rohkurs-Faktor**
(`lesen.js rohFaktorFunktion`) gespeichert — für den Cent-Boden (§11d).

### 1.2 Die Schluss-Wahl — drei Kandidaten, Kreuzprobe gegen Yahoo, Regel vorab

Yahoo (`archiv1d/bars_1d_<SYM>.json`, `yahoo v8 chart interval=1d`, Split-bereinigt, nicht Dividenden-bereinigt)
führt die **amtlichen Auktionskurse**. Kandidaten für C aus dem Minutenarchiv:

| Kandidat | Definition | Erwartung vorab |
|---|---|---|
| **C1** (Auftrag) | Eröffnung der 16:00-Kerze | Formatprobe spricht dagegen (185,51 gegen 185,64) |
| **C2** | Schluss der 16:00-Kerze | plausibel: der Auktionsdruck liegt im Volumen der Kerze, der letzte Druck nahe am Auktionskurs |
| **C3** | Schluss der 15:59-Kerze (letzte reguläre) | Näherung der Minutenstudie (Nachtrag 14), fortlaufender Handel |

**Entscheidungsregel (vorab):** Für 20 Werte (§14, alle Tage mit Yahoo-Gegenstück, außerhalb der Maßnahmenfenster)
wird je Kandidat `|C_k / C_Yahoo − 1|` in Pp berechnet; ebenso für O. **Gewählt wird der Kandidat mit dem kleinsten
Median der Abweichung**; bei Gleichstand (Differenz der Mediane < 0,002 Pp) C2 vor C1 vor C3 (Auktionsnähe).
**Toleranz:** der gewählte Kandidat muss Median ≤ **0,03 Pp** und 95.-Perzentil ≤ **0,30 Pp** erreichen, O ebenso.
Wird die Toleranz verfehlt, ist das ein Befund über die Quelle (nicht über die Wahl) und geht als Vorbehalt in den
Bericht; die Messung läuft mit dem besten Kandidaten weiter. Alle drei Kandidaten werden in den Tagesdateien
mitgeführt, sodass die Wahl **ohne Neu-Lesen** auswertbar bleibt; die Signalrechnung nimmt nur den gewählten.
Nachrichtlich: Verhältnis V / V_Yahoo (Yahoo zählt konsolidiert; hier nur Sitzung plus Auktion).

Die Kreuzprobe vergleicht **bereinigt gegen bereinigt**: wo Alpaca eine bereinigte Kopie hat, gegen Yahoo direkt;
wo Alpaca roh ist (kein Split im Zeitraum), ebenso. Sprungpaare (Skalenfehler, `wiki/fehlerformen.md`) werden als
Tage mit |Δ| > 5 Pp gesondert gezählt und nicht in den Median genommen — sie sind ein eigener Befund.

### 1.3 Datei je Reihe

`tage/<REIHE>.json`, spaltenweise: `tag` (Index in den Kalender der Quelle), `o, h, l, c1, c2, c3, v, nReg,
rohFaktor, klasse, flags` (Bit 1 `oSpaet`, Bit 2 `c16fehlt`, Bit 4 `massnahmenfenster`), dazu Kopf `reihe, ordner,
lebend, art, gruppe, ende (Ende-Art aus alpaca-massnahmen), quelleJeJahr, ausgelassen`. Ausgabeordner in
`.gitignore`; Sicherung nach `E:/Markt-Dashboard-Archiv/studien-zellen/` durch den PM.

## 2. Universum, Umsatzklasse, Kassa-Hürde

- **Universum:** nur Wertpapierart **CS/ADRC** (`wertpapierart.js`, Testkürzel raus; fehlt die Karte, bricht der Lauf
  ab) — 7.299 Reihen. **SPY** wird gesondert als **Marktreihe** gelesen (ETF, kein Kandidat).
- **Umsatzklasse je Wert-Tag** wie in der Minutenstudie: `Liquide.medianUmsatz` (`liquide.js`, Median =
  `sortiert[n >> 1]`) über die **20 Balkentage d−20 … d−1** von `C × V` (Schluss des gewählten Kandidaten ×
  Stück nach §1.1). Klassengrenzen `kosten.js UMSATZ_KLASSEN` (5 / 50 / 250 / 1.000 Mio $). **< 5 Mio $ oder weniger
  als 20 Vortage ⇒ ohne Klasse, nicht gewertet, gezählt.** Die Klasse eines Signals ist die Klasse seines
  **Signaltages**; sie gilt für den ganzen Trade.
- **Kassa-Hürde je Klasse, alle Jahre** (`wiki/kosten.md`, K ab 2021, Fenster `mitte`): **0,1569 / 0,0854 / 0,0647 /
  0,0449 Pp je Umlauf**. Ein Trade ist ein Umlauf. Das ist die Hürde, die der Auftrag setzt und die die Minutenstudie
  benutzt hat; sie ist die notierte Spanne im fortlaufenden Handel. Beide Auktionen (Einstieg und Ausstieg zur
  Eröffnung) haben keine notierte Spanne — die Hürde ist hier ein Stellvertreter. **Nachrichtlich** eine zweite
  Nettogröße mit der Eröffnungsfenster-Hürde (`K × 2,68 / 2,46 / 2,07 / 1,81`, `kosten.md`) als pessimistische Sicht.
- Cent-Boden-Vorbehalt (`kosten.md`): für liquide Klassen ist K großteils eine Preisaussage — §11d beziffert ihn.

## 3. Drei Kanal-Definitionen — feste Parameter, kein Suchen

Alle drei rechnen auf dem Tagesarray `[t, C, V, H, L, O]` **bis einschließlich Tag i** (`bars[0..i]`); kein Feld
eines späteren Tages geht ein. Jeder Kanal liefert am Tag i: `oben_i`, `unten_i`, `steigung_i` (je Tag), `richtung`
∈ {auf, ab, seit}, `ausgebaut` (ja/nein), `breite_i = oben_i − unten_i`.

| | **K1 — Abschnittskanal der App** | **K2 — Regressionskanal 40 Tage** | **K3 — Donchian 20 und 55 Tage** |
|---|---|---|---|
| Rechnung | `Q.kanalSegmente(bars[i−249..i])` (die letzten 250 Tageskerzen — das Jahresfenster, das der Chart zeigt), davon der **letzte Abschnitt** (`bis === i`; die Funktion endet den letzten Abschnitt immer am rechten Rand) | `Q.channelFit(closes, 40, i)`: Regressionsgerade über die Schlüsse i−39..i, Linien bei **±2 · sd der Residuen** (die Funktion liefert `upper/lower` genau so) | `oben_i` = max H über i−N..i−1, `unten_i` = min L über i−N..i−1 (N = 20 bzw. 55, **ohne** den aktuellen Tag), wie `Q.donchianSignal` |
| „ausgebaut" | App-Kriterium **und** die Zahlen des Auftrags: Abschnitt existiert (`guete ≥ 50`, `mindestGuete` der App) **und** `n ≥ 20 Tage` **und** `min(beruehrungenOben, beruehrungenUnten) ≥ 3`. Begründung für das UND: die Roh-Güte hat auf Rauschen einen Median von 75–94 (#80, `kanal-guete-2026-08-26`) — „Abschnitt existiert" allein ist kein Ausbau | **R² ≥ 0,5 und \|t_Steigung\| ≥ 2,0** (`channelFit` liefert `r2` und `t`; 2,0 ist `CHAN_MIN.tSlope` der App) | immer „ausgebaut", wenn N Vortage vorliegen — Donchian ist der klassische Maßstab ohne Güteprüfung |
| Richtung | `trend` des Abschnitts (`auf`/`ab`/`seit`, App-Regel: Hub > halbe Breite) | Vorzeichen der Steigung (bei ausgebaut ist sie ≠ 0) | **auf**, wenn `oben_i > oben_{i−⌈N/2⌉}` **und** `unten_i > unten_{i−⌈N/2⌉}` (der Korridor ist gewandert); **ab** spiegelbildlich; sonst seit |
| Linie am Tag j > i (Fortschreibung, für Bestätigung und Kanalbruch) | `oben_i + steigung_i · (j − i)`, ebenso unten | ebenso | **nachlaufend**: `oben_j`, `unten_j` neu aus j−N..j−1 (das ist die Donchian-Linie) |
| Mindestvorlauf | 250 Tage im Fenster (davor kein Kanal; `kanalSegmente` braucht ≥ 40, das Chart-Fenster 250) | 40 Tage | N + ⌈N/2⌉ Tage |

Vier **Linien-Definitionen** ergeben sich daraus: K1, K2, K3-20, K3-55. Der Auftrag zählt „3 Kanäle"; ehrlich gezählt
sind es vier Linien, und so wird die Familie gezählt (§10). Die Zahlen (250, 40, ±2 sd, 0,5, 2,0, 20, 55, 20 Tage,
3 Berührungen, Güte 50) stehen fest. Wer eine ändert, schreibt einen Nachtrag **vor** der Messung.

**Gleichheit gegen die App (test.js):** K1 ist per Konstruktion die App-Funktion; die Probe zeigt an echten
Tageskerzen (AAPL), dass `oben/unten/trend/guete` des benutzten Abschnitts **Feld für Feld** mit einem direkten
Aufruf von `Q.kanalSegmente` auf demselben Fenster übereinstimmen und dass der benutzte Abschnitt der ist, der am
rechten Rand endet. K2 = `Q.channelFit` (upper/lower/r2/t Feld für Feld). K3: `oben/unten` = `hoch/tief` aus
`Q.donchianSignal(bars, N, 0)`.

## 4. Zwei Einstiege — wie Chartisten es tun

Signaltag i, Kurse nur aus `bars[0..i]` (Bestätigung: `bars[0..i+1]`). **Einstieg immer zur Eröffnung eines
späteren Tages**, nie zu einem Kurs, den das Signal gesehen hat (`wiki/fehlerformen.md`, „Geteilter Kurs").

| | **E1 — Ausbruch** | **E2 — Rücklauf** |
|---|---|---|
| Bedingung am Tag i | Kanal ausgebaut **und** `C_i > oben_i` (Long); für K3 zusätzlich das Live-`confirmBps` der App: `C_i > oben_i · (1 + 0,0015)` (`Q.donchianSignal(…, 15)` — der Detektor der August-Tabelle) | Kanal ausgebaut, **Richtung auf**, und `C_i ≤ unten_i + 0,15 · breite_i` (Berührung mit der Toleranz der App: `kanalUeber` zählt Berührungen im Band `0,15 · breite`) **und** `C_i > unten_i − 0,15 · breite_i` (kein Durchbruch nach unten — sonst ist es ein E1-Short-Fall) |
| Bestätigung | Tag i+1: `C_{i+1} > oben_i + steigung_i` (K1/K2) bzw. `C_{i+1} > oben_i` (K3, dieselbe Linie wie am Signaltag) — ein weiterer Schluss darüber. **Außerhalb des Rechenfensters des Signals**, kann ablehnen, Ablehnungen werden gezählt (`fehlerformen.md`, „Behauptung statt Bestätigung") | keine — der Rücksetzer wird gekauft |
| Einstieg | Eröffnung **Tag i+2** = `O_{i+2}` | Eröffnung **Tag i+1** = `O_{i+1}` |
| Richtung | Long bei Ausbruch nach oben aus Kanal mit Richtung **auf oder seit** (Ausbruch aus dem Seitwärtskorridor zählt); Short spiegelbildlich (`C_i < unten_i`, Kanal ab oder seit) | Long nur im **Aufwärtskanal**; Short nur im Abwärtskanal (Berührung der oberen Linie) |

- **Cooldown:** je (Reihe, Linie, Einstieg, Richtung) kein neues Signal innerhalb von **5 Handelstagen** nach dem
  letzten Signaltag (ein Trend = nicht zehn Signale an zehn Tagen; 5 = kürzeste Haltedauer). Bei H = 10/20 können
  Trades derselben Reihe überlappen — die Aggregation je Tag (§7) trägt das.
- **Maßnahmenfenster (§1.1):** kein Signaltag, kein Einstiegstag im Fenster.
- **Klasse:** Signaltag i muss eine Klasse haben (§2); sonst „ohne Klasse", gezählt.
- **Short ist nie handelbar** (Leihe nicht gemessen, PM-Regel Nachtrag 2 der Minutenstudie), wird aber **als Größe
  gemessen** mit derselben Hürde als Untergrenze.
- **Kein Zusatzfilter** — keine Volumenbestätigung, kein Abstand zur Linie, kein Mindestkurs. Das ist die Regel des
  Auftrags („kein Suchen").

## 5. Ausstiege

Einstiegstag e (i+2 bzw. i+1). Handelstage zählen im Kalender der Quelle.

| Ausstieg | Regel | Ausstiegskurs |
|---|---|---|
| **H = 5** | Eröffnung Tag e+5 | `O_{e+5}` |
| **H = 10** | Eröffnung Tag e+10 | `O_{e+10}` |
| **H = 20** | Eröffnung Tag e+20 | `O_{e+20}` |
| **bis Kanalbruch** | erster Tag j ≥ e mit `C_j < unten_j` (Long; Linie nach §3 fortgeschrieben — K1/K2 linear ab i, K3 nachlaufend) ⇒ Eröffnung Tag j+1; **höchstens 60 Tage**: ohne Bruch bis j = e+59 ⇒ `O_{e+60}` | `O_{j+1}` bzw. `O_{e+60}` |

Short spiegelbildlich (`C_j > oben_j`).

**Delisting-Regel (Kern der Überlebensfrage):** Endet die Reihe (letzter Handelstag der Reihe `letzt` im Fenster)
**vor** dem Ausstiegstag und ist die Reihe **nicht lebend**, gilt **der letzte verfügbare Schluss `C_letzt` als
Ausstieg**. Diese Fälle gehen in die Hauptgröße ein **und** werden je Zelle getrennt gezählt (Zahl, Σ Ertrag) —
Tabelle „Delisting-Ausstiege" je Kanal × Einstieg × H im Bericht. Ist die Reihe **lebend** und der Ausstiegstag liegt
hinter dem 31.08.2026, gibt es **keine Beobachtung** („rechtszensiert", gezählt) — die Reihe lebt, nur das Fenster
endet. Dieselbe Regel gilt für den Topf (§6), sonst wäre der Nullpunkt gegen die Verschwundenen verschoben.

Kein Stop-Loss, kein Ziel, keine Nachbesserung — vier feste Ausstiege, wie registriert.

## 6. Ergebnisgrößen — hier anders als in der Minutenstudie

Über Tage und Wochen dominiert die Marktbewegung jeden Long-Trade; ein roher Ertrag misst dann nur „long gewesen
sein". Deshalb:

**Rohertrag je Trade** (Pp): `r = dir · (Ausstieg − Einstieg) / Einstieg · 100`.

**Topf** (Nullpunkt, `wiki/messmethodik.md`, `nullpunkt-der-messmaschine` A7): für jeden zulässigen Wert-Tag
(Reihe mit Klasse am Tag e, außerhalb des Maßnahmenfensters) und jede Dauer `d = 1 … 61` der Long-Ertrag
`O_e → O_{e+d}` mit derselben Delisting-/Zensur-Regel wie die Signale. Topfzelle = (Einstiegstag e, Dauer d,
Umsatzklasse, lebend): `n, Σ`. Der Topf eines Signals ist die Zelle seines Einstiegstags, seiner **tatsächlichen
Dauer** (H bzw. j+1−e), seiner Klasse und seines lebend-Flags — **alle zulässigen Werte derselben Zelle**, nie der
Signal-Topf. Die Klasse gehört in die Zelle, weil die Verschwundenen eine andere Grundgesamtheit sind (kleiner,
billiger — `wiki/ueberlebensverzerrung.md`): ein Topf über alle Klassen mischte Größeneffekt und Signal.

| Größe | Formel | Rolle |
|---|---|---|
| **Hauptgröße `u`** — Überschuss gegen den Topf, netto | `u = dir · (rLong − Topf) − K_Klasse` | entscheidet **belegt / widerlegt als Größe / nicht entscheidbar** |
| Nebengröße `n` — roher Netto-Ertrag | `n = r − K_Klasse` | **„handelbar"** verlangt zusätzlich Tagesmittel_B(n) > 0 (einen relativen Überschuss kann man ohne Absicherung nicht essen; Absicherungskosten sind nicht gemessen) |
| Nebengröße `s` — SPY-bereinigt | `s = dir · (rLong − r_SPY) − K_Klasse`, r_SPY = Ertrag der SPY-Tageskerzen `O_e → O_Ausstieg` (Delisting: bis `letzt`) | nachrichtlich, „gegen den Index" |
| Nebengröße `nF` — Netto mit Eröffnungsfenster-Hürde | `n − K_Klasse · (Faktor − 1)` | nachrichtlich, pessimistische Kosten |

**Vorrangregel:** Das Urteil fällt über `u`. `n` erzeugt oder entzieht „handelbar", nie „belegt". `s` und `nF`
erzeugen nichts. Brutto (`u + K`) steht überall daneben.

## 7. Aggregation mit überlappenden Haltedauern

**Clustereinheit ist der Einstiegstag e:** je (Konfiguration, e) das Mittel über alle Trades des Tages (alle Reihen).
Die Tagesreihe trägt das Urteil. Zeitpunkte (Signaltage) und Fälle (Trades) werden getrennt gezählt.

Der Tag als Clustereinheit reicht hier **nicht**: bei H = 20 überlappen sich zwanzig Tagesreihen, Nachbartage teilen
19 von 20 Kurstagen. Registrierte Standardfehler-Rechnung:

- **Primär: Hansen-Hodrick** — Langfristvarianz der Tagesreihe mit **Rechteckgewichten bis Lag H−1**
  (`γ₀ + 2 Σ_{k=1}^{H−1} γ_k`, Lags in Handelstag-Abständen des Kalenders, nicht in Array-Positionen, damit
  signalfreie Tage die Lags nicht verschieben); `se = √(LRV / nTage)`. Für überlappende H-Tage-Fenster aus
  unabhängigen Tagesrenditen ist dieser Schätzer **in Erwartung exakt** (Autokovarianz bei Lag k ist genau
  `σ²(H−k)`, k < H, und null ab H). Fällt die geschätzte LRV ≤ 0 aus (in Stichproben möglich), gilt der Block-Wert
  unten und die Zeile trägt die Marke `HH<0`.
- **Nachrichtlich, beide immer daneben:** (a) **Newey-West Bartlett, Lag H** (Standard der Literatur, schrumpft die
  Kovarianzen und liegt deshalb etwas zu tief); (b) **Blöcke von H Tagen** (Blockmittel, `se = sd/√nBlöcke`).
  Vorrechnung: Nachbarblöcke der Länge H teilen ein Dreieck von Kurstagen, ihre Korrelation ist
  `H(H−1)(H+1)/6 ÷ (H(H−1)(2H−1)/3 + H²) ≈ 0,24` — der Block-se ist um ≈ 18 % zu klein (H = 5: √1,47 = 1,21).
  Deshalb ist der Block **nicht** primär; er steht daneben, weil er anschaulich ist.
- **Wirksame Zahl unabhängiger Beobachtungen:** `n_eff ≈ nTage / H` (Varianz eines Mittels überlappender
  H-Tage-Renditen ist H-mal die eines Mittels unabhängiger). Wird je Konfiguration ausgewiesen, dazu nTage,
  nTrades, nBlöcke.
- **Kanalbruch (≤ 60 Tage):** Lag = 60 für Hansen-Hodrick, Blöcke von 60 Tagen — die Dauer variiert je Trade; die
  mittlere realisierte Dauer steht daneben.

**Beweis in `test.js` (Simulation ohne Kante):** N Kunst-Reihen aus unabhängigem Tagesrauschen, überlappende
H-Tage-Fenster, zufällige „Signale"; über viele Wiederholungen die **wahre** Streuung des Gesamtmittels messen und
dagegen halten: naive Tagesrechnung `sd/√nTage` muss um **≈ √H zu klein** sein (Toleranz: Verhältnis naiv/wahr
< 0,6 bei H = 5, < 0,45 bei H = 10 und < 0,35 bei H = 20), **Hansen-Hodrick muss innerhalb ±12 % der Wahrheit**
liegen (Simulationsrauschen bei 400 Wiederholungen ≈ 4 %), Block-H zwischen 0,72 und 0,95 (vorhergesagt 0,82).
Eine Probe, die diese drei Verhältnisse nicht zeigt, ist rot — auch wenn „irgendein se" herauskommt.

## 8. Entdeckung und Bestätigung — nach Einstiegstagen, vor der ersten Rechnung fest

Wie die Minutenstudie (§5 dort), Kalender der Quelle, 2.680 Handelstage:

| | Tage | von | bis |
|---|---|---|---|
| **Entdeckung** | **1.786** | 2016-01-04 | 2023-02-06 |
| **Bestätigung** | **894** | **2023-02-07** | 2026-08-31 |

Zuordnung nach dem **Einstiegstag** e. **Urteil allein ab 2021-01-01** (mit diesem Split die ganze Bestätigung;
`auswerten.js` erzwingt es unabhängig vom Split). **Regimeschnitt 2021 als Diagnose:** Entdeckung getrennt
≤ 2020 (1.259 Tage) / ≥ 2021 (527 Tage), kein Filter. Ein Trade, dessen Fenster den Split überschreitet, gehört zu
seinem Einstiegstag.

**Auflösungs-Vorrechnung je H steht in §12** — sie ist Teil dieser Registrierung.

## 9. Eine registrierte Bedingung — weil sie validiert ist

**„Markt über der EMA200":** SPY-Schluss (gewählter Kandidat, §1.2) am Signaltag i **über** der EMA200 der
SPY-Tagesschlüsse (EMA mit α = 2/201, gestartet als Mittel der ersten 200 Schlüsse ab 2016-01-04; die ersten 200
Handelstage haben kein Regime — gezählt). Sie ist **Kontext, nicht Einstieg**: je Konfiguration eine Variante
„nur Signale mit Regime über". **Nur nachrichtlich** (§10): kein Tor, kein Urteil, keine Bonferroni-Zählung —
sonst wären es 128 Konfigurationen. Nichts weiter; jede zusätzliche Bedingung wäre eine neue Studie.

## 10. Tore, Bonferroni, Wörter — wie in der Minutenstudie

**Familie:** 4 Linien (K1, K2, K3-20, K3-55) × 2 Einstiege × 2 Richtungen × 4 Ausstiege = **64 Konfigurationen**
(≤ 72). Die Regime-Variante (§9) verdoppelt nichts, weil sie kein Urteil bekommt. Kanalbruch ist der vierte Ausstieg.

Beide Tore hängen nur an der Zahl der Bestätigungstage und der Streuung (Hansen-Hodrick-se, §7), nicht am Ergebnis.
`se_B` aus der Tagesreihe von `u` in der Bestätigung; `MDE_B = 2 · se_B`.

1. **Tor 1 — Entdeckung ≥ 4 × MDE_B** und Entdeckungs-Tagesmittel `u` > 0. Sonst „kein Kandidat". k₁ = Zahl der
   Konfigurationen, die Tor 1 passieren (über alle 64).
2. **Tor 2 — `delta80 = (z_Bonf(k₁) + 0,8416) · se_B` < K_Kandidat**, K_Kandidat = tradegewichtetes Mittel der
   Klassenhürden über die **Bestätigungs-Trades** (Zählung, ergebnisfrei). `delta80 ≥ K` ⇒ **nicht entscheidbar**,
   spart Bonferroni. k₂ = Zahl mit beiden Toren.
3. **Bonferroni über k₂**, `z_Bonf(k) = Φ⁻¹(1 − 0,025/k)`: k = 1 ⇒ 1,96, 5 ⇒ 2,58, 10 ⇒ 2,81, 20 ⇒ 3,02
   (Nachtrag 1.1 der Minutenstudie; `auswerten.js` prüft sich an diesen Zahlen).

**Die Wörter, als Regel mit Zahl:**

- **belegt:** Tor 1 und 2; Bestätigung ab 2021 mit **≥ 30 Signaltagen** und **n_eff ≥ 20**; Tagesmittel_B(u) > 0,
  `t_B ≥ z_Bonf(k₂)`; Vorzeichen wie in der Entdeckung; Placebo A im Band (§11a). Fällt Placebo gepoolt oder eigen,
  heißt es „belegt-aber-nullpunkt-verschoben".
- **handelbar:** belegt **und** Long **und** Tagesmittel_B(n) > 0 (roher Netto-Ertrag, §6) **und** `delta80 ≤ K_Kandidat`.
  Short: „nein (Leihe)".
- **widerlegt als Größe:** obere 95-%-Grenze des **Brutto**-Tagesmittels_B (`u + K`; `Tagesmittel + 1,96 · se_B`,
  Hansen-Hodrick) **< K_Kandidat** („in seiner Klasse zu"); < 0,0449 ⇒ „in jeder Klasse zu". Größenaussage für
  **alle** Konfigurationen mit ≥ 30 Bestätigungs-Signaltagen, auch die ohne Kandidatenstatus; erzeugt keine
  Multiplizität.
- **nicht entscheidbar:** alles andere. Trägt eine Konfiguration nach Tor 2 „nicht entscheidbar" und liegt zugleich
  ihre **untere** 95-%-Grenze des Netto-Tagesmittels_B über null, steht das als Größenaussage **„Band über null,
  Regel nicht bestätigbar"** daneben — nachrichtlich, kein belegt (die Wand entscheidet, nicht der t-Wert).

## 11. Kontrollen, die mitlaufen — in derselben Tabelle wie der Kandidat

**(a) Placebo A — zufällige Wert-Tage mit derselben Tagesfrequenz.** Je (Konfiguration, Einstiegstag e) mit k Trades
werden k **zufällige andere zulässige Reihen desselben Tages e** gezogen (beliebige Klasse, ohne Kursblick, Saat
deterministisch aus (Konfiguration, e)), **zufällige Richtung**, derselbe Ausstieg (feste H; für Kanalbruch die
Dauer des gepaarten echten Trades). Maß `dir_p · (rLong_p − Topf seiner Zelle)`. **Soll null.** Band: **gepoolt**
je (Einstieg, H) über alle Linien und Richtungen `|t| < 3` **und** `|Mittel| < 0,045 Pp` (die kleinste Hürde — ein
Versatz darunter ändert kein Urteil; die 0,01 der Minutenstudie wären auf Wochenskala ein Kriterium, das einen
sauberen Placebo durchfallen lässt, `fehlerformen.md` „Kontrollkriterium falsch gebaut"); **eigen** je Konfiguration
`|t| < 3`. Fällt gepoolt, wird in diesem (Einstieg, H) nichts belegt; fällt eigen, nur dieser Kandidat nicht.
Standardfehler wie §7 (Hansen-Hodrick).

**(b) Placebo B — gleicher Tag, gleiche Klasse, zufälliger anderer Wert, gleiche Richtung.** Je echtem Trade eine
andere zulässige Reihe **derselben Klasse am selben Einstiegstag** mit derselben Richtung und demselben Ausstieg.
`Kandidat − Placebo B` (gepaart je Tag) ist die topffreie Differenz „die Auswahl" gegen „der Tag": der Topf kürzt sich
heraus. **Nachrichtlich** in der Kandidatentafel, kein Urteil. Ohne Partner (einzige Reihe der Klasse an dem Tag) ⇒
gezählt.

**(c) Überlebensverzerrung.** Jede Zelle trägt das lebend-Flag; `auswerten.js` rechnet alles zweimal (alle / nur
lebend). Differenz alle − lebend des Bestätigungs-Brutto-Tagesmittels **je Kanal × Einstieg × H**, dazu je
Umsatzklasse. **Erwartung des Auftrags, vorab:** der größte Effekt aller bisherigen Studien, weil Verschwundene über
Wochen fallen (Anker: −0,9 bis −8,4 Pp je 63-Tage-Periode, `momentum-messung` §7; auf Minutenbasis ±0,01 Pp). Dazu
die **Delisting-Tabelle** (§5): Zahl und Mittel der Trades mit Ausstieg zum letzten Schluss.

**(d) Cent-Boden mit rohem Kurs.** Je Trade mit Einstieg: Σ Einstiegskurs **roh** (`O_e · rohFaktor(e)`) und Zahl der
Trades mit `100 · 0,005 / Kurs > K_Klasse` — je (Konfiguration ohne H, Richtung, Tag, Klasse, lebend). Beschreibung
der Population, kein Filter, kein Urteil (Minutenstudie Nachtrag 3).

**(e) Positivkontrolle in `test.js`:** Kunst-Reihen (Irrfahrt mit unabhängigem Rauschen auf O und C, **keine
Gerade**), gepflanzte Kante bekannter Größe **in der Eröffnung des Ausstiegstags** der E2-Trades einer Linie
(nur dort; Signale rechnen auf Schlüssen und bleiben unberührt — wird geprüft); Größe und Richtung müssen
wiedergefunden werden (roh ≈ Pflanzung, Überschuss gegen den Topf ≈ Pflanzung · (1 − 1/N_Reihen)); ohne Pflanzung
Placebo und Kandidat im Band.

## 12. Auflösungs-Vorrechnung — ehrlich, je H

**Annahmen (Planzahlen, alle vorab):** Bestätigung 894 Tage, dichte Konfigurationen feuern an fast jedem Tag;
idiosynkratische Tagesstreuung einer Aktie **σ_idio ≈ 2,5 Pp** (Anker: Zufallskorb aus ~200 Werten hat über 63 Tage
1,8 Pp Streuung — `aufloesungswand.md` —, je Wert also ≈ 1,8·√200/√63 ≈ 3,2; Großwerte niedriger; 2,5 als Mitte),
über H Tage `σ_idio · √H`; k Trades je Tag; Tagesmittel-Streuung `σ_idio · √H / √k`; `n_eff = 894 / H`;
`se_B = sd_Tag / √n_eff`; `delta80 = 2,80 · se_B` (k₁ = 1) bzw. `3,42 · se_B` (k₁ = 5). Der Topf-Abzug entfernt
den Markt (sonst käme ≈ 1 Pp·√H dazu — deshalb ist die rohe Nebengröße viel gröber).

| H | n_eff | k = 20 (dünn): sd / se_B / delta80 | k = 60 (mittel) | k = 200 (dicht) | gegen K (0,157 / 0,085 / 0,065 / 0,045) |
|---|---|---|---|---|---|
| **5** | 179 | 1,25 / 0,093 / **0,26** | 0,72 / 0,054 / **0,15** | 0,40 / 0,030 / **0,083** | dünn: keine Klasse · mittel: nur 5–50 · dicht: 5–50, 50–250 |
| **10** | 89 | 1,77 / 0,187 / **0,52** | 1,02 / 0,108 / **0,30** | 0,56 / 0,059 / **0,17** | dünn/mittel: keine · dicht: knapp 5–50 |
| **20** | 45 | 2,50 / 0,373 / **1,04** | 1,44 / 0,215 / **0,60** | 0,79 / 0,118 / **0,33** | **keine Klasse unter keiner Annahme** |
| Kanalbruch (≤ 60, mittlere Dauer unbekannt) | ≈ 15–45 | — | — | — | wie H = 20 oder gröber |

**Folge, vor dem Lauf hingeschrieben:**

- **H = 20 und „bis Kanalbruch" sind nach dieser Rechnung nicht entscheidbar** — unter keiner Dichte-Annahme fällt
  `delta80` unter eine Klassenhürde. Sie werden **gemessen und als Obergrenzen berichtet** (Größenaussage §10), laufen
  formal durch dieselben Tore (die dann nach Plan bei Tor 2 schließen). **Hauptgrößen sind H = 5 und H = 10.**
- **H = 5 ist entscheidbar**, wenn die Konfiguration ≥ 60 Trades je Tag liefert, und dann zuerst in der Klasse 5–50;
  **H = 10** nur bei ≥ 200 Trades je Tag. K_Kandidat liegt bei gemischtem Klassenmix eher bei 0,09–0,12 — dann
  braucht auch H = 5 die dichte Annahme.
- Die Planformel war in der Minutenstudie um Faktor 3,6 zu konservativ (realisiert 0,016 gegen Plan 0,058) und im
  Sentiment-Vollkorpus um 4,2 (`aufloesungswand.md`). **Die realisierten `se_B` stehen im Bericht neben dem Plan**,
  als Zugewinn gekennzeichnet, nicht als vorregistriert.
- **Nicht entscheidbar ist der Befund, kein Nein** (`messmethodik.md` A1). Ein Nein auf H = 20 bräuchte nach dieser
  Rechnung ≥ 4× mehr Bestätigungstage, als es seit 2021 gibt.

## 13. Erwartungen, vorab und getrennt notiert

**Wilhelm (08.09.):** der ausgebaute Kanal trägt — der Ausbruch aus dem oder der Rücklauf im fertigen Kanal bringt über
Tage bis Wochen einen Überschuss.

**PM (Auftrag):** E1 Ausbruch relativ zum Topf ≈ null oder negativ nach Kosten (wie intraday); E2 Rücklauf im
Aufwärtskanal klein positiv, aber unter der Hürde der illiquiden Klassen; Trend trägt in der Literatur über Monate und
auf Indizes, nicht über Wochen auf Einzelaktien.

**Diese Rolle, abweichend notiert:** E1 brutto gegen den Topf leicht positiv bei H = 5 (Ausbruchs-Momentum von Tagen,
0,1–0,3 Pp), gegen die Hürde der dominierenden Klasse 5–50 netto ≈ null; bei H = 20 verschwindet es hinter der Wand.
E2 im Aufwärtskanal: ≈ null gegen den Topf (der Rücksetzer im Trend ist im Querschnitt kein Vorteil gegen den
Rest des Trends). Überlebensdifferenz alle − lebend **negativ und groß** (−0,1 bis −0,5 Pp je Tagesmittel bei
H = 20), größer bei Short-Konfigurationen. Erwartung: **kein Kandidat belegt und handelbar**, mehrere „widerlegt als
Größe" bei H = 5 in ab 1000, H = 20 durchweg „nicht entscheidbar". Wer nach dem Lauf etwas anderes liest, lese diesen
Absatz noch einmal.

## 14. Das Messgerät und seine Tests (Phase 1, Commit 2)

- `konfig.js`: alle Zahlen dieser Registrierung **genau einmal**; Kalender, Klassen, Hürden, Split, Lebend-Regel
  per `require` aus `konfig.js`/`lesen.js` der Minutenstudie (unverändert), geprüft gegen die Quellen.
- `tagesbalken.js`: **ein Lesedurchlauf über das Archiv** (je Jahresdatei ganz lesen, wie `lesen.js leseJson`:
  einmal nach 5 s wiederholen, dann „ausgelassen"), Tageskerzen nach §1 in `tage/<REIHE>.json`; fortsetzbar
  (`_fortschritt.json`, erledigte Reihen), Wachhund je Datei, `--teil k/n`, `--reihen` (Pilot, Marke `pilot`),
  Laufzeit je Datei protokolliert. SPY als Marktreihe gesondert (`tage/SPY.json`).
- `kanaele.js`: K1/K2/K3, E1/E2, Ausstiege als **reine Funktionen** auf Tagesarrays (K1 über `require('quant.js')`).
- `messen.js`: alle Tagesdateien in den Speicher (spaltenweise, Float32), je Reihe und Tag die vier Linien einmal,
  daraus alle 64 Konfigurationen, Regime-Variante, Placebo A/B, Topf (Dauer 1..61), Delisting-Zähler, Cent-Boden in
  **einem Zug**; Zellen je (Reihe der Zellentabelle, Richtung, H, Einstiegstag, Klasse, lebend) mit `n, Σu·, Σr, Σs,
  Σ nF-Abzug, n_delist, Σr_delist`; Ausgabe `_zellen.bin` + `_fortschritt.json` mit Kennung; Pilot-Ordner heißen
  `pilot-*`, Vollauf `voll`.
- `auswerten.js`: Tagesreihen, Hansen-Hodrick/Newey-West/Block-se, n_eff, Tore, Bonferroni, `delta80`, Placebo-Bänder,
  Überlebens-Differenz, Delisting-Tabelle, Regime-Diagnose und -Variante, Cent-Boden, Obergrenzen ⇒ **`ERGEBNIS.md`
  nur bei vollständiger Aggregation aller Reihen, sonst `PILOT-ERGEBNIS.md`** (`fehlerformen.md`, „Ein Trockenlauf,
  der aussieht wie ein Befund").
- `nacht.cmd`: Wrapper für die Aufgabenplanung (`wiki/betrieb.md`), **nur geschrieben, nie gestartet**.
- `test.js`: Positivkontrolle (§11e); Placebo null auf Zufallsreihen; **Tageskerzen gegen Yahoo an 20 Werten** mit
  der Regel aus §1.2 (Ergebnis wird als Zahl protokolliert, die Toleranz ist die Prüfung); K1 = App-Kanal, K2 =
  `channelFit`, K3 = `donchianSignal` (§3); Klassenregel = `liquide.js`, Grenzen = `kosten.js`, Hürden =
  `wiki/kosten.md`; **Überlappungs-Beweis** (§7); Delisting-Ausstieg (Kunst-Reihe, die endet: letzter Schluss, Zähler,
  Topf ebenso; lebende Reihe: zensiert); Fortsetzbarkeit der Aggregation (Kindprozesse, bitidentisch); **Gegenprobe
  geteilter Kurs** (E2 mit `C_i` als Einstieg ⇒ Scheineffekt positiv, E1 mit `C_{i+1}` ⇒ negativ; beide müssen
  entstehen, sonst rot); Bestätigung kann ablehnen (gezählt > 0 auf der Zufallsreihe); Tage außerhalb des Fensters,
  Klasse < 5 Mio $, Maßnahmenfenster zählen nicht.
- **Pilot (≤ 20 Reihen, alle Jahre, nur lesen):** liquide **SPY** (Marktreihe), AAPL, MSFT, NVDA, AMZN, JPM, XOM, PG,
  HD, COST; illiquide COKE, NEU, CRVL, WINA, DJCO; verschwunden AATC (Ende 2025-03), ABVE (2026-06), AC (2025-09),
  ADAP (ADRC, 2025-10), ACCD (2025-04, ab 2020). **Kreuzprobe Yahoo (§1.2) an 20 Werten:** die 14 lebenden
  Pilot-Aktien über alle Jahre plus GE, TSLA, F, BAC, INTC, KO **nur 2024** (sechs weitere Jahresdateien, allein für
  die Kreuzprobe, nicht aggregiert; GE mit Reverse-Split 2021 und TSLA mit Splits sind bewusst dabei — die
  Kreuzprobe soll die Bereinigung sehen). Laufzeit wird gemessen und auf 45.658 Dateien hochgerechnet (Lesen
  dominiert: die Minutenstudie las ~15 GB in ~1.350 s je Prozess). **Der Vollauf startet nicht aus diesem Chat.**

## 15. Was diese Studie NICHT sagt

- Nichts über **andere Kanal-Definitionen, Parameter oder Filter** — gemessen wird, was hier steht.
- Nichts über **Intraday, CFD, Scheine, Yahoo als Messbasis, Zeit vor 2016, Werte ohne Alpaca-Balken**.
- Nicht die **effektiven** Kosten der Auktionen (Schlupf, Teilfüllung, Auktionsungleichgewicht): die notierte
  Spanne des fortlaufenden Handels ist ein Stellvertreter.
- Kein **Ja** aus der Entdeckung, aus SPY-bereinigt, aus Placebo B oder aus der Regime-Variante.
- Für **H = 20 und Kanalbruch kein Nein** — nur Obergrenzen (§12).
- Short: eine Größe, nie eine Regel (Leihe nicht gemessen).

---

*Commit 1 dieser Studie ist diese Datei. Jede Abweichung davon steht als datierter Nachtrag unter dieser Linie,
nie darüber.*
