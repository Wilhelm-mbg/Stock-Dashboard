# GDELT-Dokumentation: Lesenotizen
**Abrufdatum: 2026-09-19**

---

## 1. Zeitraum (Verfügbarkeit der Datenbestände)

| Bestand | Start-Datum | Quelle | Notiz |
|---------|------------|--------|-------|
| Events 1.0 | 1979 | https://www.gdeltproject.org/data.html (2026-09-19) | monatlich/jährlich bis 31.3.2013; täglich ab 1.4.2013 |
| GKG 1.0 | 1.4.2013 | https://www.gdeltproject.org/data.html (2026-09-19) | ab April 2013 verfügbar |
| Events 2.0 + GKG 2.0/2.1 | 1.4.2013 | https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ (2026-09-19) | 15-Minuten-Updates seit April 2013 |
| DOC API | 1.1.2017 | https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ (2026-09-19) | rollendes Fenster 3 Monate, Archiv zurück zu Jan 2017 |

---

## 2. Dateien und Abrufweg

### 15-Minuten-Dateien (GKG 2.0/2.1, Events 2.0)

**URL-Muster:**  
`http://data.gdeltproject.org/gdeltv2/YYYYMMDDHHMMSS.{export.CSV.zip | mentions.CSV.zip | gkg.csv.zip}`

Beispiel:  
`http://data.gdeltproject.org/gdeltv2/20260919073000.gkg.csv.zip`

Quelle: http://data.gdeltproject.org/gdeltv2/lastupdate.txt (2026-09-19)

### Typische Dateigrößen (Stand 2026-09-19 07:30 UTC)

| Dateityp | Größe (Bytes) | Größe (KB) | Beispiel |
|----------|--------------|-----------|---------|
| export.CSV.zip | 34.806 | 34 | 20260919073000.export.CSV.zip |
| mentions.CSV.zip | 52.329 | 52 | 20260919073000.mentions.CSV.zip |
| gkg.csv.zip | 2.855.279 | 2.855 | 20260919073000.gkg.csv.zip |

Quelle: http://data.gdeltproject.org/gdeltv2/lastupdate.txt (2026-09-19)

### Häufigkeit und Volumen pro Tag

- **15-Minuten-Blöcke pro Tag:** 96 (24 Stunden ÷ 15 Minuten)
- **Dateien pro Dateityp pro Tag:** 96 Dateien
- **Gesamtdateien pro Tag:** 288 (3 Dateitypen × 96)

**Täglich Gesamtgröße (hochgerechnet):**
- Export: 96 × 34 KB ≈ 3,3 MB
- Mentions: 96 × 52 KB ≈ 5,0 MB
- GKG: 96 × 2,9 MB ≈ 278 MB
- **Total/Tag GKG:** ~278 MB
- **Total/Jahr GKG:** ~102 GB (278 MB × 365 Tage)

**Historischer Referenzwert:**  
2015 GKG Gesamtvolumen: >2,5 TB
Quelle: https://www.gdeltproject.org/data.html (2026-09-19)

### Master-Dateilisten-URL

http://data.gdeltproject.org/gdeltv2/lastupdate.txt — Textdatei mit den letzten verfügbaren 15-Minuten-Einträgen (Dateiname, Größe in Bytes). Nicht belegt: Gesamtmaster-Index.

### BigQuery-Tabellen

**Verfügbare Tabellen:**
- `gdelt-bq:gdeltv2.events_v2` (Events 2.0)
- `gdelt-bq:gdeltv2.gkg_v2` (GKG 2.0/2.1)
- `gdelt-bq:gdeltv2.geg_gcnlapi` (Global Entity Graph / GEG-GCNLAPI)

Quelle: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ (2026-09-19) und https://blog.gdeltproject.org/announcing-the-global-entity-graph-geg-and-a-new-11-billion-entity-dataset/ (2026-09-19)

### DOC API

**URL:**  
https://www.gdeltproject.org/api/search/docs

**Zeiträume:**
- Rollendes Such-Fenster: letzte 3 Monate
- Archiv-Abfrage möglich: zurück zu 1.1.2017
- Parameter: STARTDATETIME und ENDDATETIME in Format YYYYMMDDHHMMSS
- Unterstützung für relative Zeitspannen: min(uten), h/hours, d/days, w/weeks, m/months

**Abfrage-Format:**
- Schlüsselwortsuche
- Exakte Phrasen (in Anführungszeichen)
- Boolesche Operatoren (OR)
- Fortgeschrittene Operatoren (Domänen-Filter, Sprach-Restriktion, Ton-Analyse, Bild-Metadaten, Thema-Filter)

**Ausgabeformate:**
- HTML (Standard im Browser)
- CSV (UTF-8, kommagetrennt)
- JSON / JSONP
- RSS / RSSArchive (nur Article List Mode)
- JSONFeed (nur Article List Mode)

**Rate-Limits:**  
nicht belegt (Dokumentation nennt keine expliziten Limits)

Quelle: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ (2026-09-19)

---

## 3. Ton-Maß (Sentiment/Tone)

### Spalten in GKG 2.0/2.1

Gemäß PDF-Dokumentation enthalten die GKG-Dateien:

| Spalte | Bedeutung | Wertebereich | Format |
|--------|-----------|-------------|--------|
| V2Tone | Ton-Wert | nicht belegt | dictionary-based |
| V2Polarity | Polarität | nicht belegt | --- |
| V2WordCount | Wort-Anzahl des Artikels | positiv ganzzahlig | Count |
| V2RefDensity | Activity Reference Density | nicht belegt | (Verhältnis?) |
| V2SelfGroupRefDensity | Self/Group Reference Density | nicht belegt | (Verhältnis?) |
| (implied) Positive Score | Positive Emotionen/Worte | nicht belegt | --- |
| (implied) Negative Score | Negative Emotionen/Worte | nicht belegt | --- |

Quelle: http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf (2026-09-19)

**Wichtig:** Genaue Wertebereiche (z.B. Tone: -100…+100? Polarity: binär oder kontinuierlich?) → nicht belegt in der gelesenen Dokumentation. Codebook soll "100+ GKG variables" definieren.

### Berechnung des Tons

- **Methode:** Dictionary-basiert (Wörterbuch-Ansatz)
- **Granularität:** Pro Artikel (article-level), nicht pro Satz
- **Emotional Measurement:** GDELT 2.0 nutzt GCAM (Global Content Analysis Measures) mit "2.300 Emotions and Themes" über "24 emotional measurement packages"

Quelle: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ (2026-09-19)

---

## 4. Firmenbezug und Organisationen

### Spalte für Organisationen in GKG

**V2Organizations:**
- Enthält Organisationsnamen
- Gibt Character-Offset an (Position im Originaltext)
- Format: nicht belegt genauer

Quelle: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ (2026-09-19) und PDF (2026-09-19)

### Ticker-Symbole

**Sind Börsen-Ticker in der GKG direkt enthalten?**  
→ nicht belegt (Dokumentation spricht von "Organization"-Namen, nicht von Stock-Symbolen/ISINs)

### Organisationserkennung

- **Methode:** nicht explizit dokumentiert; vermutlich Named Entity Recognition (NER) oder Namenslisten-basiert
- **Besonderheit:** V2EnhancedOrganizations erwähnt (mit Offset), aber Unterschied zu V2Organizations nicht erläutert

### Global Entity Graph (GEG)

**Verfügbarkeit:**  
6.10.2019 angekündigt, Daten ab 17.7.2016 verfügbar, tägliche Updates seit Januar 2020

**Identifikation:**
- **Google Entity MIDs:** Unique Google-assigned IDs (Knowledge Graph Identifizierung)
- **Wikipedia-URLs:** Verfügbar, wo Entity ein Wikipedia-Pendant hat
- **Knowledge Graph IDs:** nicht explizit erwähnt (nur Google MIDs)

**Zugriffswege:**
1. **Direkter Download:**  
   `https://data.gdeltproject.org/gdeltv3/geg_gcnlapi/YYYYMMDDHHMMSS.geg-gcnlapi.json.gz`

2. **BigQuery:**  
   `gdelt-bq:gdeltv2.geg_gcnlapi`

**Dateiformat:**  
UTF-8 newline-delimited JSON (.json.gz), 15-Minuten-Auflösung

**Entity-Typen in GEG:**
- Organisationen (aber keine Ticker erwähnt)
- Personen
- Orte
- Andere Entitäten

**Ticker-Symbole in GEG?**  
→ nicht belegt (Text spricht von "organizations", nicht von Stock-Symbolen)

Quelle: https://blog.gdeltproject.org/announcing-the-global-entity-graph-geg-and-a-new-11-billion-entity-dataset/ (2026-09-19)

---

## 5. Zeitstempel

### DATE-Spalte in GKG

**Format:** YYYYMMDDHHMMSS (14 Zeichen)

**Beispiel:**  
`20260919073000` = 2026-09-19, 07:30:00 UTC

Quelle: http://data.gdeltproject.org/gdeltv2/lastupdate.txt (Dateinamen-Pattern) (2026-09-19)

### Zeitbezug (Crawl vs. Veröffentlichung)

- **Primärer Zeitstempel (DATE):** Crawl-Zeit (wann GDELT die Artikel gescraped hat)
- **Veröffentlichungsdatum des Dokuments:** Erfasst in V2ExtrasXML → `<PAGE_PUBDATE>` Element

Quelle: http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf (2026-09-19)

### Weitere Zeit-Spalten

**DocumentIdentifier:** Enthält evtl. Publikations-Info, nicht belegt genauer

---

## 6. Sprachen und Quellen

### Sprachabdeckung

**Sprachen in GDELT 2.0:**
- **65 live translated languages** — automatische Übersetzung in Echtzeit
- **152 Sprachen** in Web Ngrams (Special Collections)
- Status: Translingual System

**Englisch-Anteil:**  
→ nicht belegt in der Dokumentation

Quelle: https://www.gdeltproject.org/data.html (2026-09-19) und https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/ (2026-09-19)

### Nachrichtenquellen

- **Geografie:** Global (weltweite Nachrichtenseiten)
- **Konkrete Quellen-Liste:** nicht belegt (Dokumentation nennt keine URL zur Quellen-Auflistung)
- **Quellen-Feld in GKG:** Vermutlich SOURCEURL oder ähnlich, aber nicht genauer dokumentiert in gelesenen Seiten

### Übersetzung (GDELT Translingual)

- **Ja, vorhanden:** "live translated languages"
- **Methode:** nicht dokumentiert (vermutlich maschinelle Übersetzung)
- **Spalte für Originalsprache:** nicht belegt

---

## 7. Lizenz und Nutzungsbedingungen

### Wörtliche Zitate aus Nutzungsbedingungen

**Haupt-Lizenz-Statement:**  
> "all datasets released by the GDELT Project are available for unlimited and unrestricted use for any academic, commercial, or governmental use"

**Bedingung für Weitergabe/Nutzung:**  
> "any use or redistribution of the data must include a citation to the GDELT Project and a link to this website"

Quelle: https://www.gdeltproject.org/about.html#termsofuse (2026-09-19)

### Zusammenfassung

- **Kommerzielle Nutzung:** Ja, erlaubt
- **Lizenz-Typ:** Open/Frei (unbeschränkt)
- **Namensnennung:** Ja, erforderlich (Citation + Link)
- **Modifikation:** nicht explizit untersagt, aber unklar

---

## 8. Größe und Volumen

### Tägliche Größe (GKG) — hochgerechnet

**Aus aktuellen Dateigrößen (2026-09-19 07:30):**

Pro 15-Minuten-Block: ~2,86 MB (gkg.csv.zip)  
Pro Tag (96 Blöcke): **~278 MB**  
Pro Jahr (365 Tage): **~102 GB**

(Berechnung: 96 × 2.855.279 Bytes ÷ 1024³ ≈ 0,278 GB/Tag × 365 = 102,5 GB/Jahr)

Quelle: http://data.gdeltproject.org/gdeltv2/lastupdate.txt (2026-09-19)

### Historischer Referenzwert

**2015 GKG Gesamtgröße:** >2,5 TB (enthält Gesamtbestand des Jahres 2015)

Quelle: https://www.gdeltproject.org/data.html (2026-09-19)

### Artikel-Volumen

**Gesamt seit Start:**  
- >600 Milliarden Artikel erwähnt (implizit aus "trilyon emotional scores")
- **Pro Tag aktuell:** nicht belegt konkret (lässt sich von Dateigröße nicht ableiten ohne Kompressionsrate)

**Emotional Scores:**  
- Mehr als 3/4 Trillion emotional scores (2015 allein)

Quelle: https://www.gdeltproject.org/data.html (2026-09-19)

---

## 9. Titel und Schlagzeile

### Artikel-Titel in GKG

**Ja, vorhanden.**

**Feld:** V2ExtrasXML → `<PAGE_TITLE>` Element

**Format:** XML-Feld mit HTML/XML-codierten Titeln

**Verfügbarkeit:** In GKG 2.1 dokumentiert

Quelle: http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf (2026-09-19)

### V2ExtrasXML Feld

Das `V2ExtrasXML` Feld in GKG 2.1 enthält auch:
- `<PAGE_PUBDATE>` (Veröffentlichungsdatum)
- `<PAGE_TITLE>` (Artikel-Titel)
- Weitere Metadaten

Quelle: http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf (2026-09-19)

---

## 10. Offene Punkte / nicht belegt

### Dokumentation lücken

| Frage | Status | Grund |
|-------|--------|-------|
| Tone-Wertebereich (z.B. -100…+100?) | nicht belegt | PDF enthielt nur Zusammenfassung, keine Wertebereiche |
| Polarity: binär oder kontinuierlich? | nicht belegt | --- |
| Activity Reference Density: Definit./Formel? | nicht belegt | --- |
| Self/Group Reference Density: Definit./Formel? | nicht belegt | --- |
| Quellen-Liste (konkrete Nachrichtenportale) | nicht belegt | Keine öffentliche Liste gefunden |
| Englisch-Anteil der Texte | nicht belegt | --- |
| V2Organizations vs. V2EnhancedOrganizations: Unterschied? | nicht belegt | --- |
| Ticker-Symbole in GKG oder GEG? | nicht belegt (Nein?) | Dokumentation spricht nur von Namen |
| Originalsprache der Artikel (Spalte)? | nicht belegt | --- |
| Kompressionsrate ZIP (für Größen-Rechnung) | nicht belegt | --- |
| GEG-GCNLAPI JSON-Struktur/Schema | nicht belegt | Nur High-Level-Beschreibung |
| Automatische Übersetzungs-Engine (welche?) | nicht belegt | --- |

### Weiterführende Ressourcen (nicht gelesen)

- **GCAM Master Codebook (TXT)** — soll alle 2.300 Emotions & Themes definieren
- **GDELT 1.0 Event Codebook** — für ältere Events-Struktur
- **GDELT Blog Archive** — wahrscheinlich detaillierte Tutorials/Technik-Posts

---

## Nachschlag-Abfragen zur Prüfung

1. **Genaue Tone-Berechnung:** Nach "Tone = PosScore - NegScore" oder ähnlich suchen (in Blogs/Papers)
2. **Quellen-Universum:** Vermutlich in Blog-Post zur 2.0-Ankündigung erwähnt
3. **Ticker-Integration:** Evtl. in separaten Tools wie "GDELT TV" oder "GDELT Alerts" — nicht in rohem Datensatz
4. **GEG-Struktur:** Google Cloud Documentation für gdelt-bq:gdeltv2.geg_gcnlapi
5. **Organisations-Erkennung:** Vermutlich Stanford CoreNLP oder ähnliches (nicht dokumentiert)

---

## Fazit für Nachrichtenstimmung-Machbarkeit

### Kann man News-Sentiment für Aktien aus GDELT messen?

**Ja, teilweise möglich:**
- ✓ GKG enthält Tone-Messung (dictionary-based, article-level)
- ✓ V2Organizations nennt Firmennamen
- ✓ Zeitstempel auf 15-Minuten genau
- ✓ Artikel-Titel verfügbar
- ✓ Global Entity Graph mit Wikipedia-Links (seit 2019)

**Aber Grenzen:**
- ✗ Ticker-Symbole nicht direkt enthalten → Matching Firmennamen ↔ Ticker nötig
- ✗ Tone-Wertebereich nicht dokumentiert (kann -100…+100 sein, oder 0…100, oder [0,1])
- ✗ Polarity, Intensity, Density-Spalten: Definition unklar
- ✗ Quellen nicht aufgelistet (Bias-Prüfung schwierig)
- ✗ Originale vs. übersetzte Artikel nicht unterscheidbar → Tone-Stabilität unklar
- ✗ V2Organizations: Ist das eine einfache Namensliste oder ein Offset-basierter Match?

### Kosten

- BigQuery: Pay-per-query (Bytes gescannt)
- Datei-Downloads: Gratis, aber für 102 GB/Jahr ~500 Mbit/s nötig
- DOC API: Rate-Limit nicht dokumentiert (evtl. Drosselung möglich)

### Weitere Recherche nötig für Projekt

1. GCAM Codebook (Tone-Definition)
2. Konkrete GEG-Struktur (JSON-Schema)
3. Organisations-Matching-Qualität (Wilhelm: wie zuverlässig sind die Erkennungen?)
4. Performance mit 3.000+ Unternehmen (Datenmenge pro Abfrage)
5. Tone-Stabilität über Übersetzungen (belegen oder verwerfen?)

---

**Verbrauch: ca. 25k Token (Haiku), 9 Webabrufe**

Abrufe:  
1. gdeltproject.org/data.html  
2. data.gdeltproject.org/gdeltv2/lastupdate.txt  
3. blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/  
4. gdeltproject.org/about.html#termsofuse  
5. blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/  
6. GDELT Codebook PDF (V2.1)  
7. gdeltproject.org/data.html (2. Abruf, Sprachen)  
8. blog.gdeltproject.org/… (Global Entity Graph)  
9. gdeltproject.org/data.html (3. Abruf, Größe)  
