# Datentarif — Entscheidungsgrundlage für Wilhelm

**01.09.2026, Rechercheauftrag.** Kein Kauf, keine Anmeldung, kein Konto berührt.
**Der Schlüssel (`massive.key`) wurde für diese Recherche nicht gelesen und kommt in
keiner Zeile dieses Dokuments vor** — alle Zahlen stammen von öffentlichen Seiten.
**Dies ist eine Vorlage für Wilhelms Kaufentscheid, kein Entscheid.**

---

## 1. Wer der Anbieter ist

Aus dem Code, nicht geraten: `tools/massive.js` setzt `HOST = 'api.massive.com'`, und die
Werkzeuge rufen `/v2/aggs/grouped/locale/us/market/stocks/{tag}`,
`/v2/aggs/ticker/{sym}/range/1/day/…` und `/v3/reference/tickers?active=false` — die
Signatur von **Polygon.io**.

**Bestätigt:** Ein Abruf ohne Schlüssel auf `api.massive.com/v3/reference/tickers`
antwortet am 01.09.2026 mit `{"status":"ERROR","request_id":"…","error":"API Key was not
provided"}` — Polygons Fehlerformat. Und: **Polygon.io wurde zu Massive umbenannt**,
angekündigt zum 30.10.2025; Schlüssel, Konten und Endpunkte gelten unverändert weiter
([Polygon.io is Now Massive](https://massive.com/blog/polygon-is-now-massive), abgerufen
01.09.2026).

> **Wir sind also bereits Kunde dieses Anbieters — auf der kostenlosen Basisstufe.**

---

## 2. Tariftabelle (Stufe „Stocks", Stand 01.09.2026)

Quelle: [massive.com/pricing](https://massive.com/pricing) und
[massive.com/stocks](https://massive.com/stocks), beide abgerufen **01.09.2026**; die
Seiten tragen kein eigenes Änderungsdatum. Preise über beide Seiten unabhängig
gegengeprüft, sie stimmen überein.

| Stufe | Preis/Monat | Abrufrate | Historientiefe | Auflösung | Verzögerung |
|---|---|---|---|---|---|
| **Basic** *(heute unsere)* | **$0** | **5 Abrufe/Min** | **2 Jahre** | nur Tagesschluss | End-of-Day |
| **Starter** | **$29** | unbegrenzt | **5 Jahre** | + **Minutenbalken** | 15 Min verzögert |
| **Developer** | **$79** | unbegrenzt | **10 Jahre** | + Minutenbalken, + Trades | 15 Min verzögert |
| **Advanced** | **$199** | unbegrenzt | **20+ Jahre** | + Trades, Quotes, **Flat Files** | **Echtzeit** |
| Business | $2.499 | unbegrenzt | 20+ Jahre | + Weiterverbreitungsrechte | Echtzeit |

**Jahreszahlung: „Save 20 % with the annual plan"** → Starter ≈ **$23,20/Monat**,
Developer ≈ $63,20, Advanced ≈ $159,20. **„Unlimited Access. Cancel Anytime."**

**Referenzdaten** (Tickerstammdaten inkl. `active=false`, also **Verschwundene**, plus
Kapitalmaßnahmen) sind laut Preisseite **in allen Stufen enthalten** — auch der freien.
Die Tiefe der Kursreihen für diese Verschwundenen richtet sich aber nach der Stufe.

**Nachrichten-Endpunkt** (`/v2/reference/news`): „Included in all Stocks plans",
Datenbestand **„Records date back to June 22, 2016"**, Zugriff **Basic 2 Jahre, Starter /
Developer / Advanced „All history"**, stündlich aktualisiert; Felder u. a. `published_utc`,
`title`, `tickers`, `insights` (Sentiment des Anbieters)
([Ticker News Doku](https://massive.com/docs/rest/stocks/news), abgerufen 01.09.2026).

### Unser Free-Tier-Befund wird bestätigt

Die Preisseite nennt für Basic **„2 years"**. Unsere eigene Messung vom 27.08.2026
(`tools/massive-tagesdaten.js`, Z. 172 ff.) fand an 1.164 Reihen ein **rollendes
730-Tage-Fenster**: „abgerufen am 2026-08-23 → früheste Kerze 2024-08-23 (exakt 730
Tage)". **730 Tage = 2 Jahre. Der Befund deckt sich mit der Tarifzusage.** Damit ist auch
das „gleitend" erklärt: es ist ein rollendes Fenster, kein fester Startpunkt.

---

## 3. Was konkret messbar würde

Gerechnet mit der Wand-Formel der Landkarte, **N(d) ≈ N_vorhanden · (delta80/d)²**
(`studien/landkarte-2026-09-01/LANDKARTE.md`, §0.1), Anker von dort. **Keine Erträge
angesehen.**

### 3.1 News/Sentiment — die eine Klasse, die eine Bezahlstufe wirklich aufschließt

Landkarte-Urteil heute: **„NEIN — es fehlt Faktor 75"**. Unsere Messung vom 31.08. hatte
**35 Beobachtungen an 10 Zeitpunkten**, nötig wären rund **2.600** unabhängige
Symbol-Tage.

Der Nachrichten-Index reicht zurück bis **22.06.2016** = 10,2 Jahre ≈ **2.569
Handelstage**. Das ist allein an **Zeitpunkten** der Faktor **257** gegenüber heute — und
die Zahl der Zeitpunkte ist nach unserer eigenen Lehre („Querschnitt misst den Tag") die
bindende Größe, nicht die Fallzahl.

Mit der Beobachtungsdichte aus unserem eigenen Lauf (35 von 170 Symbol-Tagen = 20,6 %):

| Universum | erwartete Beobachtungen | gegen die nötigen ~2.600 |
|---|---|---|
| unsere 17 Symbole | ~8.990 | **Faktor 3,5** |
| 100 Symbole | ~52.900 | Faktor 20 |
| 500 Symbole | ~264.000 | Faktor 102 |

**→ Ab Starter ($29) wechselt die Klasse von „strukturell nicht messbar" zu „messbar mit
Reserve".** Zusätzlich fallen zwei der drei etikettierten Verzerrungen unserer Messung
weg: die **Auswahl** (wir wählen das Universum, statt zu nehmen, was die App zufällig
beobachtet hat) und der **Stempel** (`published_utc` ist die Veröffentlichungszeit, nicht
unser Abrufzeitpunkt).

*Vorbehalt, ehrlich: Die 20,6 % stammen aus 12 Tagen, die zur Hälfte auf einem einzigen
Tag liegen — ein schwacher Schätzer. Und der historische Index bringt eine neue,
ungemessene Verzerrung mit (Abdeckungsdichte über die Jahre, Nachträge der Verlage,
Nachrichten zu verschwundenen Werten). Die Dichte gehört vor die Vorregistrierung
gezählt, nicht danach.*

### 3.2 Überlebensverzerrung — kein neues Feld, aber Vertrauen in das bestehende

Die Verschwundenen decken laut Landkarte **„nur den Messzeitraum ab"**; gezählt wurden
**≥12,7 % fehlender Querschnitt, auf ~20 % steigend**, mit den vorhandenen Quellen nicht
zu schließen. Referenzdaten (`active=false`) haben wir schon; was fehlt, ist die **Tiefe
der Kursreihen** dieser Werte — genau die Stellschraube der Tarifstufen: Starter 5 J,
Developer 10 J, Advanced 20+ J.

**Das schließt keine neue Klasse auf, sondern härtet die einzige, die unter der Wand
liegt** (Übernacht-Anomalien). Nach heutigem Stand ist die Richtung bekannt und
konservativ („das Archiv untertreibt über Nacht, +0,046 Pp/Tag, t 21,4") — ein JA bleibt
also gültig; **ein NEIN ist es, das die Verzerrungsrichtung mitbedenken muss.** Mehr
Tiefe macht die NEIN-Seiten belastbar.

### 3.3 Intraday — Geld hilft hier nicht

Anker: delta80 **0,434 Pp** auf dem heutigen rollenden 730-Tage-Fenster (60m).

| Stufe | Handelstage | delta80 |
|---|---|---|
| Basic (2 J) | 504 | 0,522 Pp |
| Starter (5 J) | 1.260 | 0,330 Pp |
| Developer (10 J) | 2.520 | 0,234 Pp |
| Advanced (20 J) | 5.040 | **0,165 Pp** |
| Tick-Archiv ab 2004 (22 J) | 5.544 | 0,157 Pp |

Dem gegenüber: gemessene typische Intraday-Effektgröße **~0,10 Pp**, Kostenhürden
0,06 (Aktie) / 0,110 (CFD) / **0,23 Pp je 3 h (Standard-Schein)**.

- Um **0,10 Pp** aufzulösen: **13.750 Handelstage = 54,6 Jahre** 60m-Historie.
- Um **0,110 Pp** (CFD-Hürde): 11.364 Tage = **45,1 Jahre**.
- Um 0,23 Pp (Scheinhürde): 2.599 Tage = 10,3 Jahre.

**→ Die tiefste kaufbare Stufe (22 Jahre) bleibt um mehr als das Doppelte hinter dem
zurück, was nötig wäre, um die eigene typische Effektgröße überhaupt aufzulösen.** Und
die Klasse ist laut Landkarte **doppelt gedeckelt** — Fenster *und* Produkt. Ein Tarif
repariert nur das Fenster; die 0,23 Pp je drei Stunden bleiben. **Intraday bleibt NEIN,
und zwar auf jeder Stufe.**

### 3.4 Klassen, die eine Stocks-Stufe NICHT aufschließt

| Klasse | warum Geld hier nicht hilft |
|---|---|
| **Volatilität/Optionen** | Optionsdaten sind ein **eigenes Produkt**, in keiner Stocks-Stufe enthalten |
| **Index-Aufnahmen** | Ankündigungsquelle fehlt; Massive führt sie nicht — dazu Signalzahl winzig |
| **Saisonalität** | Kalender-Zeitpunkte, nicht Daten — „nichts Beschaffbares hilft" |
| **Earnings-Termine, Dividendentermine** | über **EDGAR kostenlos** beschaffbar; das ist Arbeit, kein Kauf |
| **Faktor Value/Quality** | Massive-Financials sind einreichungsgestempelt, aber die Landkarte nennt den Aufwand „groß"; die Klasse fällt nicht am Zugang, sondern am Punkt-in-Zeit-Aufbau |

**Ein kostenloser Nebenfund:** Die Aggregat-Endpunkte kennen `adjusted=true|false`; unsere
Werkzeuge rufen bisher nur `adjusted=true`. Die von der Landkarte für Dividendentermine
geforderten **unadjustierten Kurse** wären also **schon auf der heutigen Gratisstufe**
abrufbar — das kostet einen Parameter, keinen Cent.

---

## 4. Stolpersteine

**(a) Kündbarkeit.** „Unlimited Access. Cancel Anytime", Jahresplan 20 % günstiger. Ein
Monat Starter ist ein $29-Versuch, kein Vertrag. **Empfehlung: monatlich beginnen, erst
nach einer bestandenen Messung auf Jahreszahlung wechseln.**

**(b) Sind die Minutendaten rückwirkend voll da — oder wachsen sie ab Abo-Beginn?**
**Öffentlich nicht dokumentiert.** Die Wissensdatenbank beantwortet die Frage nicht;
Massive verweist auf den Support. Zwei Indizien sprechen für „rückwirkend":
1. **Unser eigener Beleg:** Auf der Gratisstufe lieferte die Quelle vom ersten Abruf an
   volle 730 Tage Historie — ohne dass wir 730 Tage Kunde gewesen wären. Das Fenster ist
   also ein **rollender Rückblick**, keine Ansammlung ab Anmeldung.
2. Für den Nachrichten-Endpunkt steht es ausdrücklich da: Starter und höher = **„All
   history"** ab 22.06.2016.
> **Trotzdem: vor dem Kauf beim Support bestätigen lassen.** Wäre es doch eine Ansammlung
> ab Abo-Beginn, wäre der gesamte Aufschluss aus §3.1 hinfällig — das ist die einzige
> Annahme in diesem Dokument, die den Entscheid kippen kann.

**(c) Können die vorhandenen Werkzeuge die Stufe ohne Umbau nutzen?** **Nein — drei
Stellen, alle klein, alle im Code belegt:**

| Fundstelle | heute | nötig |
|---|---|---|
| `tools/massive.js:25` | `ABSTAND_MS = 13000` — feste 13-s-Bremse für 5 Abrufe/Min | Bremse lösen; sonst bleibt „unbegrenzt" wirkungslos |
| `tools/massive-tagesdaten.js:189` | `VON = '2023-11-13'` — festes Startdatum | zurücksetzen; sonst holt auch Advanced nur bis 2023 |
| `tools/massive-tagesdaten.js:190` | `FENSTER_TAGE = 730` | nur Meldetext, aber irreführend, sobald die Stufe mehr kann |

Die Bremse ist der praktisch größte Posten: 2.965 Werte × 13 s ≈ **10,7 Stunden je
Vollauf**. Ohne Bremse sind das Minuten. **Das allein ist ein Arbeitsablauf-Gewinn, der
unabhängig von jeder Historientiefe zählt.**

**Nicht betroffen:** `kerzenquelle.js` und die App selbst. `kerzenquelle.js` berührt
Massive nur, um das Punkt-in-Zeit-Universum aus dem Datenordner zu **lesen**
(Z. 571/602) — es ruft die Schnittstelle nie. Und `package.json → build.files` nimmt nur
die obersten `*.js`; **`tools/` ist nicht im Paket.** Eine Bezahlstufe erreicht den
Live-Handel also gar nicht — sie ist reine Forschungsinfrastruktur. *(Alles nur gelesen,
nichts geändert.)*

**(d) Das eingefrorene Universum.** `massive/universum-2024-09-02.json` (Stichtag
02.09.2024) bleibt eingefroren — mit Bezahldaten neu erzeugen würde alle bisherigen
Messungen unvergleichbar machen.

> **Hier liegt eine scharfe Kante, und sie ist heute ungesichert.** `kerzenquelle.js`
> (`universumWerte()`, Z. 570 ff.) liest den Ordner mit `readdirSync`, filtert auf
> `universum-` und nimmt **`dat[0]` — die alphabetisch erste Datei**. Geprüft:
>
> | Ordnerinhalt | `dat[0]` |
> |---|---|
> | heute (nur eine Datei) | `universum-2024-09-02.json` ✔ |
> | nach einem 2020er-Vollauf | **`universum-2020-01-02.json`** ← ersetzt das eingefrorene **still** |
> | nach einem 2026er-Vollauf | `universum-2024-09-02.json` (bliebe zufällig richtig) |
>
> Ein zweites Universum **überschreibt die eingefrorene Datei nicht — es verdrängt sie
> lautlos aus jeder Messung**, sobald sein Stichtag früher liegt. Und eine tiefere
> Tarifstufe ist genau der Anlass, ein früheres Universum zu bauen. **Vor dem ersten
> Bezahl-Vollauf gehört hier eine Sperre hin** (fester Dateiname statt `dat[0]`, oder ein
> Abbruch bei mehr als einer Datei). Das ist Arbeit für eine eigene Sitzung, nicht Teil
> dieses Auftrags.

---

## 5. Empfehlung

> ### **Stocks Starter, $29/Monat, monatlich kündbar.**
> Nicht Developer, nicht Advanced — und nicht, weil Geld fehlt, sondern weil die
> Mehrleistung der teureren Stufen auf Klassen zielt, die **nicht am Zugang scheitern**.

**Wofür die $29 gekauft werden — in dieser Reihenfolge:**

1. **News/Sentiment wird messbar.** Die einzige Klasse, die eine Bezahlstufe von
   „strukturell nicht messbar" auf „messbar mit Faktor 3,5 Reserve" hebt (§3.1). Starter
   reicht dafür vollständig: „All history" ab 2016 gilt ab dieser Stufe.
2. **Die 13-Sekunden-Bremse fällt.** 10,7 Stunden je Vollauf werden zu Minuten (§4c) —
   unabhängig von der Historientiefe.
3. **5 Jahre statt 2 für die Verschwundenen.** Härtet die NEIN-Seiten der einzigen Klasse
   unter der Wand (§3.2).

**Warum nicht $79 (Developer):** Die zusätzlichen 5 Jahre Tiefe zahlen fast
ausschließlich auf Intraday ein — und Intraday bleibt auf **jeder** Stufe NEIN (§3.3).
Für News/Sentiment ändert Developer nichts, „All history" hat schon Starter.

**Warum nicht $199 (Advanced):** Echtzeit brauchen wir nicht (wir messen, wir handeln
nicht auf die Sekunde). Die 20+ Jahre lösen Intraday nicht (54,6 wären nötig). Bleiben
Flat Files und Financials — Letztere zielen auf Value/Quality, das laut Landkarte nicht
am Zugang scheitert, sondern am Punkt-in-Zeit-Aufbau.

**Was vor dem Kauf zu klären ist — beides blockierend:**
1. **Support fragen:** volle Historie ab Tag 1 oder Ansammlung ab Abo-Beginn? (§4b)
2. **Universums-Sperre einbauen**, bevor der erste Bezahl-Vollauf läuft. (§4d)

**Was den Kauf nachträglich rechtfertigen würde:** eine vorregistrierte
Sentiment-Messung, die mit der gekauften Historie ein Urteil fällt — **JA oder NEIN, beides
zählt.** Ein sauberes NEIN zu 35 % Entscheidungsgewicht wäre $29 wert gewesen.

**Was hier ausdrücklich NICHT entschieden ist:** der Kauf. Diese Vorlage empfiehlt eine
Stufe und einen Preis; die Bestellung macht Wilhelm.

---

*Alle Tarifangaben abgerufen am 01.09.2026 von den öffentlichen Seiten; die Seiten tragen
kein eigenes Änderungsdatum. Simulation mit virtuellem Kapital. Keine Anlageberatung.*

**Quellen:**
[Polygon.io is Now Massive](https://massive.com/blog/polygon-is-now-massive) ·
[massive.com/pricing](https://massive.com/pricing) ·
[massive.com/stocks](https://massive.com/stocks) ·
[Ticker News Doku](https://massive.com/docs/rest/stocks/news) ·
[Stocks FAQ](https://massive.com/knowledge-base/categories/stocks)
