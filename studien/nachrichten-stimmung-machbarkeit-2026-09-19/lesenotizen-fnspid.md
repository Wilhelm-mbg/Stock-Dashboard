# Lesenotizen: FNSPID-Datensatz (Financial News and Stock Price Integration Dataset)

**Abrufdatum:** 2026-09-19  
**Quelle Papier:** arXiv 2402.06698 (Dong, Fan, Peng 2024)  
**Dataset-Plattform:** HuggingFace (Zihan1004/FNSPID)  
**GitHub:** github.com/Zdong104/FNSPID_Financial_News_Dataset

---

## 1. Zeitraum

**Datenabdeckung:** 1999 bis 2023 (25 Jahre)  
**Quelle:** Papier Seite 1, Abstract + Paper Section 3

### Verteilung der Schlagzeilen nach Jahr

Laut Paper Section 4.1 und Figure 6 ("News Count Over Time"):  
- Die Neuigkeitsmenge ist **exponentiell über Zeit angewachsen**
- Besonders ab ~2015 deutlicher Anstieg
- 2000–2010: Deutlich kleinere Volumen (Zahl nicht explizit angegeben)
- 2015–2023: Massiver Anstieg, Spitzenwert in den 2020er Jahren
- **Genaue Jahresverteilung nicht tabelliert** im Paper/README vorhanden, nur Graphik in Figure 6
- Beobachtung: Asymmetrische Verteilung mit Konzentration auf Gegenwart

**Quelle:** Paper arXiv:2402.06698, Section 4 "FNSPID Property", Figure 6 (https://arxiv.org/pdf/2402.06698, abrufdatum 2026-09-19)

---

## 2. Umfang

### Schlagzeilen (Nachrichten-Zeilen)
- **Gesamt:** 15,7 Millionen Nachrichten-Einträge
- **Mit Sentiment-Score:** 402.546 Artikel (nur Top-50-Aktien)
- **Mit Ticker-Symbol:** 37,54% aller Nachrichten (~5,9 Mio)
- **Ohne Ticker-Symbol:** 62,46% (~9,8 Mio)

### Ticker/Aktien (Börse)
- **Zahl der Ticker:** 4.775 S&P 500-Unternehmen
- **Börse:** S&P 500 (US-amerikanische große Kapitalisierung)
- **Sentiment-Scores nur für:** 50 der 4.775 Aktien (1,05% der Unternehmen)

### Volltext vorhanden
- **Mit Artikel-Volltext:** 75,22% (~11,8 Mio Artikel)
- **Ohne Artikel-Volltext (nur Titel/Metadaten):** 24,78% (~3,9 Mio Artikel)

### Quellen/Publisher
**Genannt im Paper:**
- NASDAQ (Hauptquelle, Selenium-Scraping von Nachrichten)
- **Bloomberg** (verarbeitete Altdaten)
- **Reuters** (verarbeitete Altdaten)
- **Benzinga** (verarbeitete Altdaten, auch in HuggingFace-Preview sichtbar)
- **Lenta** (Russische Finanzquelle, verarbeitete Altdaten)

**Prozentuale Anteile:** Nicht im Paper/README angegeben, nur in Vergleichstabelle (Table 1) dass "4 stock market news websites" verwendet wurden. HuggingFace-Preview zeigt zu 100% Benzinga Insights, aber das ist keine repräsentative Stichprobe.

**Quelle:** Paper Section 3 "Constructing FNSPID", GitHub README, HuggingFace-Datensatzkarte (https://huggingface.co/datasets/Zihan1004/FNSPID, abrufdatum 2026-09-19)

---

## 3. Dateien und Abrufweg

### HuggingFace API-Dateilisten

**Stock_news-Verzeichnis** (https://huggingface.co/api/datasets/Zihan1004/FNSPID/tree/main/Stock_news):
| Dateiname | Größe (Bytes) | Größe (GB) | Format |
|-----------|---------------|-----------|--------|
| All_external.csv | 5.731.397.037 | 5,73 | CSV |
| nasdaq_external_data.csv | 23.232.979.597 | 23,23 | CSV |
| **Summe** | 28.964.376.634 | 28,96 | CSV |

**Stock_price-Verzeichnis** (https://huggingface.co/api/datasets/Zihan1004/FNSPID/tree/main/Stock_price):
| Dateiname | Größe (Bytes) | Größe (MB) | Format |
|-----------|---------------|-----------|--------|
| full_history.zip | 589.525.596 | 589,5 | ZIP (komprimiert) |

**Gesamt-Datensatzgröße:** Paper gibt >30 GB an (vor Kompression/nach Entpackung)

### Spaltenstruktur (Nachrichten/Stock_news)

**Spaltenbezeichnungen:**
- `Date` – Veröffentlichungsdatum
- `Article_title` – Schlagzeile
- `Stock_symbol` – Ticker-Symbol (z.B. AAPL)
- `Url` – Link zur Originalnachricht
- `Publisher` – Quelle (z.B. Benzinga, Reuters)
- `Author` – Name des Autors (falls verfügbar)
- `Article` – Volltext des Artikels (kann leer sein)
- `Lsa_summary` – Zusammenfassung (LSA-Algorithmus, Sumy-Package)
- `Luhn_summary` – Zusammenfassung (Luhn-Algorithmus)
- `Textrank_summary` – Zusammenfassung (TextRank-Algorithmus)
- `Lexrank_summary` – Zusammenfassung (LexRank-Algorithmus)

**Sentiment-Score-Spalte:** 
- **Name:** Nicht explizit dokumentiert; Spalte wird als "Sentiment Score 1-5" im Paper referenziert
- **Wertebereich:** 1 bis 5 (Integer)
- **Legende:**
  - 1 = negativ
  - 2 = etwas negativ
  - 3 = neutral
  - 4 = etwas positiv
  - 5 = positiv
- **Verfügbarkeit:** Nur für 50 Top-Aktien (402.546 Artikel); für übrige 4.725 Aktien nicht vorhanden
- **Berechnung:** Mittels ChatGPT-API; Details s. Abschnitt 8

### Spaltenstruktur (Aktienkurse/Stock_price)

**Spaltenbezeichnungen** (Tabelle 2 des Papers):
- `Date` – Handelsatum (YYYY-MM-DD HH:MM:SS)
- `Open` – Eröffnungskurs
- `High` – Tagesspitzenkurs
- `Low` – Tagestiefkurs
- `Close` – Schlusskurs
- `Adj Close` – Inflationsbereinigter Schlusskurs (für Dividenden angepasst)
- `Volume` – Handelsvolumen (Zahl der Aktien)

### Datenformat

**Format:** CSV (Textformat, Trennzeichen nicht explizit dokumentiert, wahrscheinlich Komma)  
**Sortierung:** 
- `nasdaq_external_data.csv` – Chronologisch nach Datum (2023-12-28 bis ältere Einträge)
- `All_external.csv` – Kombination aus früheren Quellen, Sortierung unklar

**Range-Abrufe:** HTTP-Range-Requests unter HuggingFace nicht dokumentiert; direkte Download-URLs folgen Schema `https://huggingface.co/datasets/Zihan1004/FNSPID/resolve/main/Stock_news/<datei>`

**Quelle:** Paper Table 2, Figure 3; HuggingFace-Dateilisten (https://huggingface.co/api/datasets/Zihan1004/FNSPID/tree/main/Stock_news und Stock_price, abrufdatum 2026-09-19)

---

## 4. Ticker-Zuordnung

**Ist je Zeile ein Ticker-Symbol vorhanden?**  
Bedingt ja: **37,54%** der Nachrichten enthalten ein `Stock_symbol`-Feld; **62,46%** nicht.

**Zuordnungsmethode:**
Laut Paper Section 3.1 und README nicht vollständig dokumentiert. Aus dem Papier lässt sich ableiten:
- NASDAQ-Scraping: Nachrichten wurden pro Ticker von NASDAQ gesammelt (2-stufiger Prozess: Headlines + URLs per Selenium, dann Volltext auslesen)
- **Probleme:** Nachrichten ohne expliziten Ticker in der Quelle werden nicht zugeordnet
- **Keine nachträgliche Namenssuche erwähnt**

Paper sagt: "we collected headlines and URLs from NASDAQ for each stock in the list by the Python package Selenium" – das impliziert, dass nur Nachrichten, die bereits auf NASDAQ pro Ticker gelistet waren, einen Symbol bekamen.

Ergebnis: **Ticker-Zuordnung ist quellenseitig, nicht durch algorithmische Namenerkennung**

**Quelle:** Paper Section 3.1 "Data mining and processing" (https://arxiv.org/pdf/2402.06698, abrufdatum 2026-09-19)

---

## 5. Zeitstempel

**Format:** ISO 8601 Standard  
**Beispiel:** `2022-06-03 00:00:00`, `2023-12-28 00:00:00`  
**Zeitzone:** UTC (im HuggingFace-Karten-Text erwähnt als "YYYY-MM-DD HH:MM:SS UTC")

**Granularität:** 
- **Nachrichten (Stock_news):** Sekunden-Genauigkeit (HH:MM:SS)
- **Aktienkurse (Stock_price):** Sekundengenauigkeit, aber meist auf Tageskerzen (00:00:00) berechnet

**Was die Uhrzeit bedeutet:**
- Für NASDAQ-Nachrichten: Veröffentlichungszeit der News
- Für Kursdata: Marktschluss (16:00 EDT) oder aggregiert über den Handelstag
- Paper erwähnt "time-aligned", d.h. Nachrichten und Kurse sind chronologisch aufeinander abgestimmt

**Quelle:** HuggingFace-Karte (https://huggingface.co/datasets/Zihan1004/FNSPID, abrufdatum 2026-09-19); Figure 3 im Paper

---

## 6. Lizenz

### Angaben aus verschiedenen Quellen

**HuggingFace-Datensatzkarte:**
```
Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC-4.0)
```
Explizite Angabe auf der Kartenseite: "commercial use without authorization" ist verboten.

**GitHub README:**
Enthält eine LICENSE-Datei; Text sagt: "code is shared without any guarantee for its reliability and security"
Verbot: "without prior authorization" für kommerzielle Nutzung

**ArXiv-Paper (Section 1):**
```
Lizenz im CCS-Zitat: "© 2024 Association for Computing Machinery"
Generelle Einleitung: CC BY 4.0 (Attribution erforderlich)
```

**Widerspruch:** Paper nennt CC BY 4.0, HuggingFace nennt CC BY-NC-4.0. HuggingFace ist die autoritativere Quelle für die Dataset-Lizenzierung.

### Nutzung für private Forschung erlaubt?
**Ja**, unter CC BY-NC-4.0:
- Erlaubt: Forschung, akademische Projekte, Lehre, private Experimente
- Nicht erlaubt: Verkauf, kommerzielle Produkte, kommerzielle Services ohne Genehmigung
- Verpflichtung: Nennung der Autoren (Dong, Fan, Peng)

**Quelle:** HuggingFace (https://huggingface.co/datasets/Zihan1004/FNSPID, abrufdatum 2026-09-19); GitHub README (https://github.com/Zdong104/FNSPID_Financial_News_Dataset, abrufdatum 2026-09-19)

---

## 7. Sentiment-Scores

**Enthält der Datensatz Stimmungsmaße?**  
Ja, aber **nur für einen kleinen Ausschnitt** (50 Aktien, ~402.546 Artikel = 2,56% aller Einträge).

### Sentiment-Score-Details

| Eigenschaft | Wert |
|-------------|------|
| **Spaltenname** | `Sentiment_Score` (nicht explizit dokumentiert; "Sentiment Score 1-5") |
| **Wertebereich** | Integer 1–5 |
| **Skalierung** | 1=negativ, 2=etwas negativ, 3=neutral, 4=etwas positiv, 5=positiv |
| **Abdeckung** | 50 von 4.775 Aktien (1,05%) |
| **Zahl der Scores** | 402.546 Artikel |
| **Erzeugung** | GPT-3.5 (ChatGPT) |
| **Input** | Lsa-zusammengefasste Artikel (gekürzt auf ~3 Sätze) |
| **Batch-Größe** | Bis zu 10 Artikel pro API-Call; Temperatur 0 |
| **Distribution** | Abb. 4 zeigt: ~37% Score=1, ~26% Score=2, ~23% Score=3, ~3% Score=4, ~11% Score=5 (asymmetrisch zu negativ) |

### Berechnung (Task 3 im Paper)

1. **Textverkleinerung:** Artikel → LSA-Zusammenfassung (~3 Sätze)
2. **Gewichtung:** Sätze mit Ticker-Symbol erhalten höheres Gewicht
3. **ChatGPT-Prompt:** Structured Input mit System-Prompt + Beispiele (2-Shot Learning)
4. **Dekodierung:** Raw GPT-Output von 1–5 wird direkt als Score übernommen
5. **Fehlende Tage:** Exponentieller Decay mit β=0,03 (Formel 6 im Paper)
6. **Tages-Aggregation:** Durchschnitt aller Scores eines Tages (wenn mehrere Artikel pro Tag)

### Warum nur 50 Aktien?
Laut Paper: "computational resources do not allow" vollständige Labeling aller 15,7 Mio. Artikel. Top-50 als Pilotprojekt für "Task 3 - Sentiment Quantification".

**Quelle:** Paper Section 3.1 und Figure 2, Figure 4 (Sentiment Distribution); Appendix A.2 (https://arxiv.org/pdf/2402.06698, abrufdatum 2026-09-19)

---

## 8. Bekannte Schwächen (laut Paper/GitHub)

### Explizit erwähnte Limitationen

1. **Kleine Sentiment-Labeling-Menge:**  
   Nur 402.546 von 15,7 Mio. Artikel (~2,56%) haben Stimmungsscores. Keine Scores für 4.725 Aktien.  
   Begründung: "computational resources do not allow" (Paper Section 3.1)

2. **Ticker-Zuordnung unvollständig:**  
   62,46% der Nachrichten haben kein Ticker-Symbol; automatische Namenerkennung nicht implementiert.

3. **Asymmetrische Zeitverteilung:**  
   Exponentiell viel mehr Nachrichten seit 2015; vor 2010 sehr dünn besetzt. Schwierig für Training über lange Zeiträume.

4. **Datenqualität schwer reproduzierbar:**  
   NASDAQ- und Web-Scraping können sich ändern; Seiten-Layout-Updates brechen Parser. Paper merkt an: "our dataset ... is not designed for direct application in production environments" (GitHub).

5. **Unbekannte Duplikat-Rate:**  
   Paper erwähnt nicht, ob Duplikate zwischen den vier Quellen (NASDAQ, Bloomberg, Reuters, Benzinga, Lenta) gereinigt wurden.

6. **Keine Überlebensverzerrung erwähnt, aber implizit:**  
   Datensatz enthält nur S&P 500-Aktien (Überlebende). Ausgestorbene Ticker vor 1999 oder Delistings nach 2023 nicht abgedeckt.

7. **Sentiment-Stabilität unklar:**  
   Paper testet nur auf "Temperatur 0" bei ChatGPT. Langzeit-Drift der Modellausgaben (GPT-3.5 → GPT-4, etc.) nicht untersucht.

### Nicht erwähnt (potenzielle Probleme)

- **Lücken in einzelnen Aktien-Zeitreihen:** Nicht dokumentiert
- **Falsch zugeordnete Ticker:** Keine Gegenprobe erwähnt
- **Sentiment-Score-Validierung:** Keine Gegenprüfung gegen manuelles Labeling für die 50 Aktien
- **Kurs-Anpassungen:** Splits/Dividenden → Adj_Close, aber Konsistenz nicht geprüft

**Quelle:** Paper Section 3.1, Section 6 "Discussion"; GitHub README (https://github.com/Zdong104/FNSPID_Financial_News_Dataset, abrufdatum 2026-09-19)

---

## 9. Offene Punkte / Nicht dokumentiert

### Was die Dokumentation nicht sagt

1. **CSV-Trennzeichen:** 
   Format unklar (wahrscheinlich Komma, aber nicht explizit dokumentiert)

2. **Datenorganisation:**  
   Ist `All_external.csv` eine einzelne große Datei oder mehrere (z.B. pro Ticker/pro Jahr)? → Nicht belegt
   Sortierungsreihenfolge von `All_external.csv` unklar

3. **Fehlerquoten:**  
   Parsing-Fehlerrate beim Scraping nicht dokumentiert

4. **Sprachzusammensetzung:**  
   5,10% Russisch / 94,90% Englisch (Figure 5B), aber: wo sind die Russisch-Texte? Aus Lenta? Verarbeitung unterschiedlich?

5. **Duplikate:**  
   Sind Nachrichten, die auf mehreren Quellen (NASDAQ + Bloomberg) erscheinen, dedupliziert oder doppelt enthalten?

6. **Feature-Ingenierie:**  
   Welche Preprocessing-Schritte wurden auf Text angewendet (Groß-/Kleinschreibung, Stopwords, etc.)?

7. **Missing Data Handling:**  
   Nur für Sentiment-Scores erklärt (Decay-Formel), aber nicht für Kurse oder fehlende Artikel-Texte

8. **Kaggle-Zugang:**  
   Dataset auf https://www.kaggle.com/datasets/zihan1004/fnspid gelistet, aber ohne Login nicht erreichbar; keine zusätzlichen Informationen verfügbar

9. **Warum vier Quellen?:**  
   Paper erklärt nicht, nach welchen Kriterien Bloomberg, Reuters, Benzinga, Lenta ausgewählt wurden oder wie sie kombiniert/dedupliziert wurden

10. **Empirische Validierung:**  
   Paper zeigt nur ML-Experiments (Table 3: Transformer R²=0,988), aber keine Gegenprobe, ob Sentiments tatsächlich mit Preisen korrelieren

**Quelle:** Synthesiert aus Lücken in Paper (arXiv:2402.06698), GitHub README, HuggingFace-Karte (abrufdatum 2026-09-19)

---

## Zusammenfassung für Wilhelm

### Machbarkeit für Nachrichten-Stimmungs-Signale

**Pro:**
- ✅ Massive Menge (15,7 Mio. Artikel)
- ✅ S&P 500 & Zeitreihen (Kernziel)
- ✅ 25 Jahre Historie (1999–2023)
- ✅ Volltext verfügbar (75%)
- ✅ Kostenfrei, CC-BY-NC-4.0
- ✅ Quellendokumentation (NASDAQ, Bloomberg, Reuters, Benzinga, Lenta)

**Contra:**
- ❌ Sentimentscores nur für 50 von 4.775 Aktien (2,56%)
- ❌ 62% der Nachrichten ohne Ticker-Symbol
- ❌ Asymmetrische Zeitverteilung (viel 2015+, dünn vor 2010)
- ❌ Keine Validierung gegen Preis-Korrelationen
- ❌ Sentiment-Labeling mit ChatGPT (Model-Drift über Zeit)
- ❌ Keine Duplikat-Bereinigung dokumentiert
- ❌ Überlebensverzerrung (nur lebende S&P 500-Werte)

### Nächste Schritte

1. Download + Schnellprüfung (5% Sample): Format, Spalten, Dateistruktur validieren
2. Ticker-Recovery: 62% ohne Symbol durch Textsuche/Namensmatching ergänzen?
3. Duplikat-Audit: Häufigkeit von Wiederholungen über Quellen prüfen
4. Sentiment-Erweiterung: 402.546 Scores für 50 Aktien replizieren auf Top 100 oder Top 500?
5. Zeit-Stratifizierung: Signal-Quality vor/nach 2015 trennen testen

---

## Verbrauch

- **Token (Haiku):** ca. 35k (WebFetch + PDF-Text + Analyse)
- **Webabrufe:** 7 (arXiv, GitHub, HuggingFace Karte, API Stock_news, API Stock_price, Kaggle)
- **Dateidownloads:** 0 (nur Dokumentation gelesen)
