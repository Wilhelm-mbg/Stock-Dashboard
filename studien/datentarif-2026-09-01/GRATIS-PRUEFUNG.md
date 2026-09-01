# Was die Gratisstufe wirklich kann — getastet, nicht abgeleitet

**01.09.2026.** Empirischer Teil zu `EMPFEHLUNG.md` (gleicher Ordner). Kein Kauf, keine
Anmeldung. Der Schlüssel wurde für die Aufrufe verwendet, steht ausschließlich im
`Authorization`-Header — **nie in einer URL** — und läuft vor jeder Ausgabe zusätzlich
durch eine Maskierung. Er kommt in keiner Zeile dieses Dokuments, keiner Protokolldatei
und keinem Commit vor. Rate-Limit 5/Min strikt eingehalten (13 s Abstand), **kein
einziger 429** — die Statuscodes unten sind unverfälscht.

Werkzeuge: `gratis-sonde.js` (Phasen A/B/D), `dichte-zaehlen.js`. Rohdaten: `sonde-A.json`,
`sonde-B.json`, `sonde-D.json`, `dichte.json`.

> **Das Wichtigste zuerst: Die Empfehlung von heute Vormittag empfahl $29/Monat
> hauptsächlich, um Nachrichten-Historie zu bekommen. Diese Historie haben wir bereits —
> auf der Gratisstufe, 9,4 Jahre zurück. Der Hauptgrund für den Kauf ist damit entfallen.**

---

## 1. Endpunkt-Tabelle (echte Statuscodes, Basic-Schlüssel, 01.09.2026)

| Endpunkt | HTTP | Feld | Kern der Antwort |
|---|---|---|---|
| `/v3/reference/tickers?active=false` | **200** | OK | 1 Treffer (Lehman-Warrant von 2008) |
| `/v2/reference/news?ticker=AAPL` | **200** | OK | 5 Treffer — **erreichbar** |
| `/v2/aggs/…/1/day/` **innerhalb** ~730 T | **200** | OK | 9 Tageskerzen |
| `/v2/aggs/…/1/day/` **außerhalb** ~730 T | **403** | NOT_AUTHORIZED | „Your plan doesn't include this **data timeframe**" |
| `/v2/aggs/…/1/minute/` frisch | **200** | OK | echte Minutenbalken (v 30.673, n 1.115 Trades) |
| `/v2/aggs/…/1/minute/` ~700 T zurück | **200** | OK | echte Minutenbalken (v 1.870, n 90) |
| `/v2/aggs/…/1/minute/` ~820 T zurück | **403** | NOT_AUTHORIZED | „…**data timeframe**" |
| `/v3/reference/dividends?ticker=AAPL` | **200** | OK | 5 Termine |
| `/v2/aggs/…/1/day/?adjusted=false` | **200** | OK | 6 **unadjustierte** Tageskerzen |
| `/v2/reference/news?…&limit=1000` | **200** | OK | **1000** Treffer auf einer Seite |
| `/v2/reference/news?ticker=FRCB` *(delistet)* | **200** | OK | **1** Treffer (2024-11-18) |
| `/v3/reference/splits?ticker=AAPL` | **200** | OK | älteste Seite reicht bis **1987-06-16** |

### Die 403-Mehrdeutigkeit — aufgelöst

Der Auftrag verlangt, drei Fälle zu unterscheiden, die alle wie „geht nicht" aussehen:

| Fall | Signatur | bei uns aufgetreten? |
|---|---|---|
| (a) Tarif deckt den **Endpunkt** nicht | Text nennt Plan/Feature | **nie** |
| (b) Endpunkt **existiert nicht** | HTTP 404 / „Unknown" | **nie** |
| (c) **Zeitraum** außerhalb der Stufe | 403 `NOT_AUTHORIZED`, Text nennt ausdrücklich **„data timeframe"** | **2×** (Tages- und Minutenaggregate jenseits ~730 T) |
| (d) freigeschaltet, **0 Treffer** | HTTP **200**, `results: []` | 1× (Nachrichten vor 2016 — siehe §2) |

**Jeder getestete Endpunkt war erreichbar. Gedeckelt ist ausschließlich das ZEITFENSTER
der Marktdaten-Aggregate.** Das ist ein anderer Befund als „Basic kann nur Tagesschluss",
wie die Preisseite nahelegt.

> **(d) ist kein (a).** „0 Treffer" bei HTTP 200 heißt: der Endpunkt gehört uns, dort ist
> nur nichts. Genau diese Unterscheidung war der Grund für die Statusspalte — in einer
> reinen Trefferzählung sehen beide identisch aus.

### Was Basic damit wirklich ist

| | Grenze |
|---|---|
| Tages-Aggregate | **~730 Tage rollend** (403 „data timeframe" dahinter) — Befund der Vorarbeit bestätigt |
| **Minutenbalken** | **ebenfalls ~730 Tage — und sie ANTWORTEN**, entgegen „End of Day Data" auf der Preisseite |
| **Nachrichten** | **bis 2017-04-10** — 9,4 Jahre, kein 2-Jahres-Deckel |
| Referenz (Ticker, Splits, Dividenden) | **kein Zeitdeckel** — Splits bis 1987 |
| Unadjustierte Kurse | verfügbar (`adjusted=false`) |
| Tempo | 5 Abrufe/Min |

### Die News-Wand, binär gesucht (nicht geraten)

Zehn Halbierungsschritte über `published_utc.lt`, jeder mit HTTP 200:
vor 2016-08-31 → nein · vor 2017-04-01 → nein · vor **2017-04-09 → nein** · vor
**2017-04-13 → JA** (jüngste davor 2017-04-10) · vor 2018-09-01 → JA · vor 2021-05-02 → JA.

**Wand für AAPL: 2017-04-10.** Vor 2016-01-01 kamen HTTP 200 mit **0 Treffern** — Fall (d),
also Bestandsende, keine Tarifgrenze.

---

## 2. Die gezählte Dichte — sie ersetzt die 20,6 %

**Anordnung vor dem ersten Abruf festgelegt:** Saat **20260901**, 30 Symbole zufällig aus
den 2.965 Namen des 1d-Archivs, 20 zufällige Handelstage aus dem erreichbaren Fenster
(499 zur Wahl), Rückblick 2 Tage je Stichtag, Score mit der echten `Q.sentiment()`, Fenster
= die 12 jüngsten Schlagzeilen bis Handelsschluss T, Look-ahead-Riegel auf `published_utc`.

**Zweite Schicht ebenfalls vorab festgelegt** (nicht nachträglich gesucht): dieselben 20
Abrufe werden zusätzlich gegen die 17 Großwerte unseres bisherigen News-Archivs
ausgewertet. Ein Tagesabruf liefert den ganzen Markt (328–705 Artikel, 512 Ticker, **eine
Seite, nie abgeschnitten**) — beide Schichten kosten deshalb dieselben 20 Abrufe.
**20 von 20 Tagen auswertbar, keine Trunkierung.**

| Schicht | Symbol-Tage | ≥ 1 Meldung | **Score ≠ 0** |
|---|---|---|---|
| **Zufallszug** (30 aus 2.965) | 600 | 63 = **10,5 %** | 18 = **3,0 %** |
| **Großwerte** (unsere 17) | 340 | 312 = **91,8 %** | 191 = **56,2 %** |

> **Die 20,6 % der Empfehlung waren in beide Richtungen falsch.** Für Großwerte
> **unterschätzten** sie fast um das Dreifache (56,2 %) — unser eigenes Archiv sah nur,
> was die App zufällig abrief. Für einen Querschnitt **überschätzten** sie um das
> Siebenfache (3,0 %). Der Unterschied ist keine Nachkommastelle, sondern die Antwort auf
> die Frage, welches Universum eine Sentiment-Messung überhaupt tragen kann.

*Unsicherheit, ehrlich: 18 von 600 ist eine kleine Zahl; binomial ±1,4 Pp (2σ), durch
Tagesbündelung real eher mehr. Die 56,2 % (191 von 340) stehen auf ±5,4 Pp. Die
Größenordnungen — 3 % gegen 56 % — sind davon unberührt.*

### Was das für die Sentiment-Klasse bedeutet

Nötig laut `vorregistrierung-2026-08-31-news-sentiment/ERGEBNIS.md`: **~2.600 unabhängige
Symbol-Tage**. Verfügbare Zeitpunkte ab 2017-04-10: **~2.367 Handelstage** (heute: 10).

| Universum | erwartete Beobachtungen | gegen ~2.600 |
|---|---|---|
| unsere 17 Großwerte | **~22.600** | **Faktor 8,7** |
| 30 Zufallsnamen | ~2.130 | Faktor 0,8 — **reicht nicht** |
| 200 Zufallsnamen | ~14.200 | Faktor 5,5 |
| 500 Zufallsnamen | ~35.500 | Faktor 13,7 |

**→ Die Klasse „News/Sentiment", in der Landkarte als „NEIN — es fehlt Faktor 75"
geführt, ist auf der GRATISSTUFE messbar.** Nicht in Monaten — jetzt. Zusätzlich fallen
zwei der drei etikettierten Verzerrungen der Erstmessung weg: die **Auswahl** (wir wählen
das Universum) und der **Stempel** (`published_utc` statt Abrufzeitpunkt).

*Der Landkarten-Eintrag „(4) Nur Zeit … Monate bis über ein Jahr — Wiedervorlage, kein
Scope-Kandidat jetzt" ist damit überholt. Er ging davon aus, dass wir selbst sammeln
müssen.*

**Zwei neue Verzerrungen, die dafür eintreten und vor eine Vorregistrierung gehören:**
1. **Abdeckungsdichte über die Jahre.** Ob 2017 so dicht berichtet ist wie 2026, ist
   ungezählt. Muss vorab je Jahr gezählt werden.
2. **Verschwundene sind im Nachrichtenindex dünn.** FRCB (Delisting 2023) liefert genau
   **1** Treffer. Eine Sentiment-Messung auf Überlebenden erbt damit die
   Überlebensverzerrung — und die Nachrichtenseite kann sie *nicht* selbst korrigieren.

---

## 3. Was die Bezahlstufen konkret bringen — mit den negativen Fällen

Gerechnet mit der Wand-Formel der Landkarte, **N(d) ≈ N_vorhanden · (delta80/d)²**,
Anker 60m: delta80 **0,434 Pp** auf 730 Handelstagen.

| Stufe | Preis | was sie ÜBER Basic hinaus bringt |
|---|---|---|
| **Basic** | $0 | *(heute)* Aggregate 2 J inkl. **Minutenbalken**, News 9,4 J, Referenz ohne Zeitdeckel, 5/Min |
| **Starter** | $29 | **unbegrenzte Abrufe**; Aggregate 2 → 5 J |
| **Developer** | $79 | Aggregate 5 → 10 J; Trades |
| **Advanced** | $199 | Aggregate 10 → 20+ J; Flat Files; Echtzeit; Financials |

### Intraday — bleibt auf JEDER Stufe NEIN

| Datenlage | Handelstage | delta80 |
|---|---|---|
| heutige eigene 5m/15m-Sammlung | 60 | 1,514 Pp |
| **Basic-Minutenbalken (2 J)** | 504 | 0,522 Pp |
| Starter (5 J) | 1.260 | 0,330 Pp |
| Developer (10 J) | 2.520 | 0,234 Pp |
| Advanced (20 J) | 5.040 | **0,165 Pp** |

Typischer gemessener Intraday-Effekt: **~0,10 Pp**. Kostenhürden 0,06 / 0,110 / **0,23 Pp
je 3 h**. Um 0,10 Pp aufzulösen, wären **~54,6 Jahre** 60m-Historie nötig; die tiefste
kaufbare Stufe gibt 20+. **Und die Klasse ist doppelt gedeckelt** — ein Tarif repariert
das Fenster, nicht das Produkt. Advanced schließt Intraday nicht auf.

*Aber: Basic-Minutenbalken heben unsere Intraday-Datenlage sofort von 60 auf 504
Handelstage — delta80 von 1,514 auf 0,522 Pp, **ohne einen Cent**. Das ist keine
Aufschließung der Klasse, aber es macht die Landkarten-Forderung „Jahre eigener
5m/15m-Sammlung" für den Fensterteil gegenstandslos.*

### Klassen, die AUCH mit Advanced ($199) unmessbar bleiben

| Klasse | Grund |
|---|---|
| **Volatilität/Optionen** (2.8) | Optionsdaten sind ein **eigenes Produkt** — in **keiner** Stocks-Stufe enthalten. Die Landkarte nennt sie „den weitesten Weg aller Klassen"; kein Stocks-Tarif verkürzt ihn. |
| **Saisonalität** (2.5) | Der Engpass sind **Kalender-Zeitpunkte**, nicht Daten. Mehr Historie erzeugt keine zusätzlichen Monatswenden pro Jahr. |
| **Index-Aufnahmen** | Ankündigungsquelle fehlt im Produkt; dazu Signalzahl winzig. |
| **Intraday** (2.9) | siehe oben — Produktkosten, nicht Datenfenster. |
| **Krypto** (2.10) | fehlt die **Kostenmessung**, nicht die Historie. |
| **Value/Quality** (2.6) | Advanced enthält „Financials & Ratios", aber die Landkarte nennt als Engpass den **Punkt-in-Zeit-Aufbau** („Wochen Arbeit", freier Weg EDGAR-XBRL) — Arbeit, nicht Zugang. *Ich habe den Financials-Endpunkt nicht getastet; das bleibt offen.* |
| **Paare/Spreads** (2.7) | Kosten doppelt (~0,22 Pp CFD) und Short-Bein-Kostenmodell ungemessen. |

### Was Geld tatsächlich kauft

1. **Tempo.** `ABSTAND_MS = 13000` bedient 5 Abrufe/Min; 2.965 Werte = **10,7 h je
   Vollauf**. Unbegrenzt = Minuten. Das ist der größte praktische Posten — und der
   einzige, der schon ab Starter voll anfällt.
2. **Tiefe für die Verschwundenen** (2 → 5 → 10 → 20 J). Schließt keine neue Klasse auf,
   **härtet aber die NEIN-Seiten** der einzigen Klasse unter der Wand (Übernacht).
3. Flat Files (nur Advanced) für Massenabzüge.

---

## 4. Die drei Zusatzfragen

**(a) Wachsen Minutendaten rückwirkend mit dem Abo, oder erst ab Abo-Beginn?**
**Empirisch beantwortet, und zwar rückwirkend.** Unser Basic-Schlüssel liefert *heute*
Minutenbalken von vor ~700 Tagen (HTTP 200) und Nachrichten von **2017** — ohne dass wir
so lange Kunde gewesen wären. Das Fenster ist ein **rollender Rückblick**, keine
Ansammlung ab Anmeldung. Der 403 dahinter nennt ausdrücklich „data **timeframe**", also
eine Fenstergrenze, keine Startdatums-Grenze.
*Grenze der Aussage: belegt ist es für Basic. Dass Starter sich genauso verhält, ist die
naheliegende, aber ungeprüfte Fortschreibung — vor einem Kauf beim Support bestätigen.*

**(b) Können `kerzenquelle.js` und `massive.js` eine höhere Stufe ohne Umbau nutzen?**
**Nein.** Drei Stellen, alle klein, alle im Code belegt (nur gelesen, nichts geändert):

| Fundstelle | heute | Wirkung auf einer höheren Stufe |
|---|---|---|
| `tools/massive.js:25` | `ABSTAND_MS = 13000` | „unbegrenzt" bliebe **wirkungslos** |
| `tools/massive-tagesdaten.js:189` | `VON = '2023-11-13'` | auch Advanced holte nur bis 2023 |
| `tools/massive-tagesdaten.js:190` | `FENSTER_TAGE = 730` | nur Meldetext, aber irreführend |

**`kerzenquelle.js` ist nicht betroffen** — es liest Massive-Daten nur aus dem Datenordner
(Z. 571/602) und ruft die Schnittstelle nie. Und `package.json → build.files` nimmt nur
die obersten `*.js`; **`tools/` ist nicht im Paket** — eine Bezahlstufe erreicht den
Live-Handel gar nicht.

**Zusätzlicher Befund:** **Kein einziges Werkzeug ruft `reference/news`, `reference/dividends`
oder `reference/splits`** (geprüft, Treffer: null). Drei Endpunkte, die wir **schon
bezahlt haben** (mit $0), liegen ungenutzt.

**(c) Was brächte ein Monat Starter, morgen gebucht, nach 30 Tagen gekündigt?**
Ehrlich: **wenig, was nicht auch ohne ginge.** Der Nachrichtenbestand — der Hauptgrund der
Vormittags-Empfehlung — ist auf Basic vorhanden. Bliebe:
- ein **Vollauf ohne Bremse** (10,7 h → Minuten) für 2.965 Werte, **einmalig abgezogen und
  dauerhaft behalten**;
- Tages- und Minutendaten **5 statt 2 Jahre** tief, ebenfalls einmalig abgezogen und
  behalten — auch nach der Kündigung, denn die Daten liegen dann bei uns.

**Das ist das eigentliche Argument für einen Monat: nicht Zugang mieten, sondern ein
Archiv einmalig abziehen.** Es setzt voraus, dass (a) auch für Starter gilt, und dass die
Bremse vorher gelöst ist — sonst sind 30 Tage à 5 Abrufe/Min zu wenig für den Abzug.

---

## 5. Vorlage für Wilhelms Entscheid — kein Entscheid

> ### Empfehlung: **jetzt nichts kaufen.** Zuerst zwei Dinge tun, die $0 kosten.

**Schritt 1 — die Sentiment-Messung jetzt fahren, auf der Gratisstufe.**
Sie ist der Grund, aus dem heute Vormittag $29 empfohlen wurden, und sie geht bereits:
9,4 Jahre Nachrichten, 2.367 Zeitpunkte, auf 17 Großwerten **Faktor 8,7** über dem Bedarf.
Kosten: Abrufzeit. **Wenn diese Messung ein Urteil fällt — JA oder NEIN —, war sie die
wertvollste Einzelmessung des Projekts, und sie war umsonst.**
*Das Universum muss dabei aus Großwerten bestehen: der Zufallsquerschnitt liefert 3,0 %
Dichte und reißt die Schwelle (Faktor 0,8).*

**Schritt 2 — die drei ungenutzten Gratis-Endpunkte einsammeln.**
Dividendentermine + unadjustierte Kurse lösen den Datenteil von Landkarte 2.12
(„Dividendenbezogene Termine: NEIN im Bestand"); Splits bis 1987 gehören zu den
Sprungpaar-Befunden. Alles HTTP 200, alles $0, alles heute ungenutzt.

**Danach erst die Kaufabwägung — und dann als einmaliger Abzug, nicht als Abo:**
**Starter, $29, ein Monat, gekündigt nach dem Abzug.** Begründung: unbegrenzte Abrufe für
einen Vollauf plus 5 statt 2 Jahre Tiefe, beides einmalig geholt und dauerhaft behalten.
**Nicht Developer/Advanced:** deren Mehrleistung zielt auf Intraday (bleibt auf jeder
Stufe NEIN) und Optionen (in keiner Stocks-Stufe enthalten).

**Vor jedem Kauf zu klären, beide blockierend:**
1. **Support fragen:** Gilt der rückwirkende Rückblick auch für Starter? Für Basic ist er
   belegt, für Starter nicht.
2. **Universums-Sperre einbauen.** `kerzenquelle.js universumWerte()` nimmt `dat[0]`, die
   alphabetisch erste `universum-*.json`. Ein früher datiertes zweites Universum
   überschreibt `universum-2024-09-02.json` nicht — es **verdrängt es lautlos aus jeder
   Messung**. Eine tiefere Stufe ist genau der Anlass, so eine Datei zu bauen.

**Korrektur an der eigenen Vorarbeit:** `EMPFEHLUNG.md` empfahl heute Vormittag Starter
mit dem Nachrichtenbestand als Hauptgrund und schätzte die Dichte auf 20,6 %. Beides ist
durch diese Messung überholt — der Bestand ist gratis vorhanden, und die Dichte ist je
nach Universum 3,0 % oder 56,2 %. Die Datei bleibt als Tarif- und Quellenübersicht gültig;
**für den Kaufentscheid gilt dieses Dokument.**

---

*Alle Statuscodes am 01.09.2026 mit dem Basic-Schlüssel gemessen, 13 s Abstand, kein 429.
Keine Erträge und keine Kursreihen angesehen; aus `archiv1d` wurde ausschließlich das
Zeitstempel-Feld gelesen, um Handelstage zu kennen. `massive/universum-2024-09-02.json`
nicht angefasst. Simulation mit virtuellem Kapital. Keine Anlageberatung.*
