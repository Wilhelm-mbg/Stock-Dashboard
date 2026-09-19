# GDELT GKG 2.1 Codebook – Lesenotizen

Quelle: GDELT Global Knowledge Graph (GKG) Data Format Codebook V2.1, 2/19/2015

## 1. Spaltentafel GKG 2.1

| Index | Feldname | Format und Trennzeichen | Seite |
|-------|----------|------------------------|-------|
| 1 | GKGRECORDID | String: YYYYMMDDHHMMSS-X oder YYYYMMDDHHMMSS-TX (T kennzeichnet Translingual-Dokument) | 28 |
| 2 | V2.1DATE | Integer YYYYMMDDHHMMSS (Veröffentlichungsdatum des Dokuments, nicht Crawl-Zeit); 0 für unbekannte Quellen | 29 |
| 3 | V2SOURCECOLLECTIONIDENTIFIER | Integer (1=WEB, 2=CITATIONONLY, 3=CORE, 4=DTIC, 5=JSTOR, 6=NONTEXTUALSOURCE) | 30–31 |
| 4 | V2SOURCECOMMONNAME | Text (z.B. Toplevel-Domain oder "BBC Monitoring" oder "JSTOR") | 32 |
| 5 | V2DOCUMENTIDENTIFIER | Text (URL, DOI, Zitation oder Identifier je nach SourceCollectionIdentifier) | 33 |
| 6 | V1COUNTS | Semicolon-delimitiert Blöcke; Felder mit # getrennt: CountType#Count#ObjectType#LocationType#LocationFullName#LocationCountryCode#LocationADM1Code#LocationLatitude#LocationLongitude#LocationFeatureID | 34–35 |
| 7 | V2.1COUNTS | Identical to V1COUNTS plus character offset field am Ende jedes Eintrags | 40 |
| 8 | V1THEMES | Semicolon-delimitiert Liste von Theme-Namen (>275 erkannte Themes) | 40 |
| 9 | V2ENHANCEDTHEMES | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: ThemeName,CharacterOffset (>300 erkannte Themes; jede Nennung separat) | 40–41 |
| 10 | V1LOCATIONS | Semicolon-delimitiert Blöcke; Felder mit # getrennt: LocationType#LocationFullName#LocationCountryCode#LocationADM1Code#LocationLatitude#LocationLongitude#LocationFeatureID | 42–48 |
| 11 | V2ENHANCEDLOCATIONS | Identical to V1LOCATIONS plus: LocationADM2Code zwischen ADM1Code und Latitude; Character offset field am Ende; mehrfache Nennungen separat | 49 |
| 12 | V1PERSONS | Semicolon-delimitiert Liste von Personennamen (spezialisiert auf Afrikanische, Asiatische, Nahöstliche Namen) | 49 |
| 13 | V2ENHANCEDPERSONS | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: PersonName,CharacterOffset (jede Nennung separat) | 49 |
| 14 | V1ORGANIZATIONS | Semicolon-delimitiert Liste von Organisations-/Firmennamen | 49–50 |
| 15 | V2ENHANCEDORGANIZATIONS | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: OrganizationName,CharacterOffset (jede Nennung separat) | 50 |
| 16 | V1.5TONE | Comma-delimitiert Liste von 6 Werten: Tone,PositiveScore,NegativeScore,Polarity,ActivityReferenceDensity,SelfGroupReferenceDensity,WordCount | 52–60 |
| 17 | V2.1ENHANCEDDATES | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: DateResolution,Month,Day,Year,CharacterOffset | 61 |
| 18 | V2GCAM | Comma-delimitiert Key/Value-Paare (Colon-delimitiert): wc:WordCount,DictionaryID.DimensionID:Score | 62–64 |
| 19 | V2.1SHARINGIMAGE | Textual URL (das manuell vom Outlet gewählte Sharing Image für Social Media) | 64 |
| 20 | V2.1RELATEDIMAGES | Semicolon-delimitiert Liste von URLs (relevante Bilder im Artikel, algorithmisch bewertet) | 64 |
| 21 | V2.1SOCIALIMAGEEMBEDS | Semicolon-delimitiert Liste von URLs (embedded Image-Posts von Twitter/Instagram) | 64–65 |
| 22 | V2.1SOCIALVIDEOEMBEDS | Semicolon-delimitiert Liste von URLs (embedded Videos von YouTube, DailyMotion, Vimeo, Vine) | 65 |
| 23 | V2.1QUOTATIONS | Pound-delimitiert (#) Blöcke; Felder mit Pipe (|) getrennt: Offset\|Length\|Verb\|Quote | 67–69 |
| 24 | V2.1ALLNAMES | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: NameText,CharacterOffset (Events, Bewegungen, Festivals, Kriege, Gesetze, Daten) | 70 |
| 25 | V2.1AMOUNTS | Semicolon-delimitiert Blöcke; Felder mit Komma getrennt: Amount,Object,CharacterOffset (numerische Werte, Textual oder Mixed Format konvertiert) | 71–75 |
| 26 | V2.1TRANSLATIONINFO | Semicolon-delimitiert Felder (leer für English-Originale): srclc:ISO639-2code; eng:TranslationCitationString | 76–77 |
| 27 | V2EXTRASXML | XML-formatiert (spezielle Daten für Subsets; aktuell CITEDREFERENCESLIST für akademische Artikel) | 79–82 |

**Gesamtzahl Spalten: 27**

---

## 2. V2EnhancedOrganizations gegen V1Organizations

| Aspekt | V1ORGANIZATIONS | V2ENHANCEDORGANIZATIONS |
|--------|-----------------|------------------------|
| **Format** | Semicolon-delimitiert Liste (einfach) | Semicolon-delimitiert Blöcke |
| **Feldstruktur** | Nur Organisationsnamen | Name, Character Offset (Komma getrennt) |
| **Character Offset** | Nicht enthalten | Vorhanden (ermöglicht Proximity-Kontext zu anderen V2Enhanced-Feldern) |
| **Mehrfachnennungen** | Nicht explizit unterschieden | Jede Nennung wird separat aufgelistet |
| **Trennzeichen innerhalb Eintrag** | Nicht zutreffend | Komma zwischen Name und Offset |
| **Trennzeichen zwischen Einträgen** | Semicolon | Semicolon |
| **Großschreibung** | nicht belegt | nicht belegt |
| **Kommas im Namen** | nicht belegt | nicht belegt |

**Quelle**: Seite 49–50

---

## 3. V1.5Tone / V2Tone

**Exakter Feldname im Codebook**: V1.5TONE (keine separate V2TONE erwähnt)

**Format**: Comma-delimited list of six core emotional dimensions, each as single precision floating point number

**Reihenfolge und Bedeutung der Teilfelder**:

| Feld | Bedeutung | Wertebereich | Hinweise |
|------|-----------|--------------|----------|
| 1. Tone | Average "tone" des Dokuments (Positive Score minus Negative Score) | −100 to +100 | Common values −10 to +10; 0 = neutral; nahe-Null kann entweder niedrige emotionale Reaktion oder sich aufhebende Scores bedeuten |
| 2. Positive Score | Prozentanteil aller Wörter mit positiver emotionaler Konnotation | 0 to +100 | Prozentangabe aller Wörter im Artikel |
| 3. Negative Score | Prozentanteil aller Wörter mit negativer emotionaler Konnotation | 0 to +100 | Prozentangabe aller Wörter im Artikel |
| 4. Polarity | Prozentanteil der Wörter mit Matches im tonal dictionary | Floating point | Indikator für emotionale Polarisierung; hohe Polarity + neutraler Tone = emotionale Spannung ohne klare Richtung |
| 5. Activity Reference Density | Prozentanteil aktiver Wörter | Floating point | Basic Proxy für Aktivitätsniveau des Texts vs. klinisch beschreibender Text |
| 6. Self/Group Reference Density | Prozentanteil aller Wörter, die Pronomen sind (selbst- und gruppenbezogen) | Floating point | News media tendieren zu sehr niedrigen Dichten; unterscheidet bestimmte Medieklassen und Kontexte |
| 7. Word Count | Gesamtanzahl Wörter im Dokument | Integer | **NEU in Version 1.5** (Feld wurde hinzugefügt) |

**Quelle**: Seite 52–60

**Hinweis**: Der Text nennt "V1.5TONE" nicht "V2TONE". Die Versionierung drückt aus, dass dieses Feld in Version 1.5 um das WordCount-Feld erweitert wurde.

---

## 4. Weitere Felder (Detailformat)

### GKGRECORDID
- **Format**: String (NICHT numeric field, trotz Nummern)
- **Struktur**: YYYYMMDDHHMMSS-X oder YYYYMMDDHHMMSS-TX
  - YYYYMMDDHHMMSS = volle Datum+Zeit des 15-Minuten-Batch
  - `-` (Dash)
  - `T` (optionaler Capital Letter) = Translingual-Flag (Dokument wurde maschinell übersetzt)
  - `X` = sequentielle Nummern aller Einträge in diesem Batch
- **Beispiel**: 20150203033000-5 (5. Eintrag des Batches vom 03.02.2015 03:30:00 UTC); 20150203033000-T5 (transliertes Dokument)
- **Quelle**: Seite 28

### V2.1DATE
- **Format**: Integer YYYYMMDDHHMMSS
- **Bedeutung**: Veröffentlichungsdatum des News-Dokuments (NICHT Crawl-Zeit, nicht zeitverschoben wie im Event-Stream)
- **Spezialfälle**: 
  - 0 für spezielle Sammlungen, wenn unbekannt oder nicht zutreffend (z.B. gescannte Historische Dokumente)
  - Gleicher Wert für alle Reihen in einer Datei
- **Hinweis GKG 2.0**: In GKG 2.0 noch YYYYMMDD-Format (ohne HH/MM/SS)
- **Quelle**: Seite 29

### V2SourceCollectionIdentifier
- **Format**: Integer
- **Werte**:
  - 1 = WEB (Document ist eine URL, DocumentIdentifier ist fully-qualified URL)
  - 2 = CITATIONONLY (Offline-Quelle, DocumentIdentifier ist textuelle Zitation im APA/Chicago/Harvard/MLA-Format)
  - 3 = CORE (CORE-Archiv, DocumentIdentifier ist DOI)
  - 4 = DTIC (DTIC-Archiv, DocumentIdentifier ist DOI)
  - 5 = JSTOR (JSTOR-Archiv, DocumentIdentifier ist DOI)
  - 6 = NONTEXTUALSOURCE (non-textual mit textual proxy wie Closed Captions; URL auf Originalquelle; z.B. Internet Archive Television News Archive)
- **Zweck**: Zur Interpretation des DocumentIdentifier-Feldes und zum Aufsuchen des Originalinhalts
- **Quelle**: Seite 30–31

### V2SourceCommonName
- **Format**: Text (human-friendly identifier)
- **Inhalt**:
  - Für Web-URLs: Top-level domain
  - Für BBC-Material: "BBC Monitoring"
  - Für JSTOR-Material: "JSTOR"
- **Zweck**: Human display und network analysis von Informationsflüssen, macht Domain-Parsing unnötig
- **Quelle**: Seite 32

### V2DocumentIdentifier
- **Format**: Text (variabel)
- **Inhalt** (je nach SourceCollectionIdentifier):
  - SourceCollection 1 (WEB): fully-qualified URL
  - SourceCollection 2 (CITATIONONLY): textuelle Zitation (Format variiert: APA/Chicago/Harvard/MLA; keine Normalisierung garantiert)
  - SourceCollection 3/4/5 (Archivdateien): numerisch/alphanumerisch DOI
  - SourceCollection 6 (NONTEXTUALSOURCE): URL der Originalquelle (z.B. Video-URL)
- **Warnung**: Citation format varies; keine Annahmen zur Präzision des Formats machen
- **Quelle**: Seite 33

### V2ExtrasXML
- **Format**: XML-formatiert
- **Zweck**: Spezielle nicht-Standard-Daten für bestimmte Subsets der GKG-Collection
- **Tags (bekannt)**:
  - `<CITEDREFERENCESLIST>` (nur Academic Journal subcollection)
    - `<CITATION>` (Blöcke für einzelne Zitationen)
      - `<AUTHORS><AUTHOR>...</AUTHOR>...</AUTHORS>` (Author names, order-normalized aber nicht sonst normalisiert)
      - `<TITLE>` (Title des Artikels, falls applicable)
      - `<BOOKTITLE>` (Title des Buchs, falls applicable)
      - `<DATE>` (Publication date)
      - `<JOURNAL>` (Journal name)
      - `<VOLUME>` (Journal volume)
      - `<ISSUE>` (Journal issue)
      - `<PAGES>` (Page range)
      - `<INSTITUTION>` (Institutional affiliation)
      - `<PUBLISHER>` (Publisher)
      - `<LOCATION>` (Location of publisher)
      - `<MARKER>` (Textual marker im Originaltext, z.B. "Leetaru et al, 2014")
    - Basis: ParsCit software (machine learning, hat Fehlerquoten)
- **Leer** für News-Inhalte
- **Flexible Parsing erforderlich**: Felder nicht garantiert in Reihenfolge; nicht alle Felder in allen Citations
- **Quelle**: Seite 79–82

---

## 5. Fallen (Parsing-Kritische Punkte)

### Dateiformat
- **Trennzeichen**: Tab-delimited (trotz .csv-Dateiendung; .csv-Endung wegen Software-Kompatibilität)
- **Zeilenennung**: Roh-Output-Format; eine Zeile pro Dokument
- **Kopfzeile**: Nicht erwähnt in Codebook (Annahme: keine Kopfzeile im Dateistream)
- **Speichereffizienz**: Für schnelle gescannte Verarbeitung mit vollständig parallelisierten Streaming-Parsing optimiert
- **Quelle**: Seite 5–6

### Zeichensatz und Encoding
- Nicht explizit genannt im Text; nur "tab-delimited CSV" erwähnt
- **Warnung**: Multilingual processing (65 Sprachen mit Translingual); Encoding-Annahme für non-ASCII-Zeichen nicht belegt

### Feld-Inhalts-Fallen
- **Tabulatoren oder Zeilenumbrüche innerhalb Felder**: Nicht erwähnt; Tab-Delimitation könnte durch Tabs im Text gestört werden (nicht dokumentiert)
- **Leere Felder**: 
  - Möglich für OptionalFelder (z.B. V2EXTRASXML ist leer für News)
  - V2.1DATE = 0 für unbekannte Quellen oder spezielle Sammlungen
  - LocationType/LocationFullName/etc. können blank sein bei unvollständiger Erkennung
  - Verb in V2.1QUOTATIONS kann abwesend sein
  - V2ENHANCEDDATES/AMOUNTS: Absenz bedeutet Score 0 (wie bei V2GCAM)
- **Zeilen mit abweichender Feldzahl**: 
  - Optional-Felder können abweichende Zahl führen (nicht dokumentiert)
  - Benutzer sollten defensive Parsing-Logik schreiben
- **Quelle**: Seite 23–25 (Diskussion von Inclusion-Kriterien und Flexibilität)

### Zeitbezug und Verzerrungen
- **DATE vs. Crawl-Zeit**: DATE = Veröffentlichungsdatum des Dokuments, NICHT Zeit des Crawls oder der Verarbeitung (unterschied zum Event-Stream)
- **Translingual-Kennzeichnung**: T im GKGRECORDID markiert maschinell übersetzte Dokumente (Important: kann Language Bias oder Translation Errors tragen)
- **Quelle**: Seite 9–10, 28–29

### Inclusion-Kriterien und Biases
- **GKG 2.1 Änderung**: Ein Artikel wird INCLUDED, wenn er IRGENDWELCHE erfolgreich extrahierten Informationen hat (inklusive GCAM Emotional Scores), nicht mehr nur mit Locations
- **Konsequenz**: Felder dürfen KEINE Annahmen über vorhandene Geographic Information machen
- **Keine Clustering-Deduplication**: Im Unterschied zu GKG 1.0 werden identische Metadaten in 20 Artikeln als 20 separate Einträge gelistet (Grund: unterschiedliche GCAM Scores bei verschiedenen Sprachbenutzungen)
- **Quelle**: Seite 23–25

### Besondere Zeichensätz in Feldern
- **V1COUNTS / V2.1COUNTS**: Pound-Symbol (#) als Feldtrenner (möglich Parsing-Konflikt wenn # im Object-Namen)
- **Comma-delimited Felder (V2ENHANCEDTHEMES, etc.)**: Komma trennt Name und Offset; **nicht dokumentiert, ob Kommas im Namen vorkommen können**
- **Semicolon-delimited**: Semicolon trennt mehrere Blöcke; **nicht dokumentiert, ob Semicolons in Werten vorkommen können**
- **Pipe-delimited in Quotations**: Pipe (|) trennt Offset/Length/Verb/Quote
- **Quelle**: Seite 34–82 (Feldformat-Definitionen)

### V2GCAM Word Count
- **Special Key**: `wc:WordCount` ist erste Entry (nicht immer null)
- **Native Language Word Count**: `nwc:WordCount` wenn non-English Dictionaries matches produzieren (Languages können unterschiedliche Wortcounts haben in Translation)
- **Fehlende Dimensions** = Score 0 (wichtig für sparsame Dateiformat-Optimierung)
- **Quelle**: Seite 62–64

### Preis/Kosten-ähnliche Zeichenketten in Amounts
- **Format**: "20,000 combat soldiers" → Amount=20000 (Kommas entfernt), Object="combat soldiers"
- **Textual Formats**: "two million", "tens of millions" werden zu Ziffer-Format konvertiert
- **Prozente**: NICHT unterstützt (Kontext-abhängig, zu mehrdeutig)
- **Quelle**: Seite 73–75

### Character Offsets in V2Enhanced Feldern
- **Zweck**: Ermöglichen Proximity-basierte Kontextualisierung von Personen ↔ Orte ↔ Rollen ↔ Themen
- **Genauigkeit**: "approximate character offset" (nicht exakt, nur zum Proximity-Matching)
- **Umgang**: Mit anderen V2ENHANCED-Feldern kombinierbar für funktionale/geografische/thematische Affiliationen
- **Quelle**: Seite 14–15, 40–71

### Geschichtsquellen und Special Collections
- **OCR'd historical documents**: DATE kann 0 sein (wenn Publikationsdatum unbekannt)
- **Academic journals**: V2EXTRASXML trägt CITEDREFERENCESLIST (ParsCit-basiert, machine learning errors möglich)
- **Television News Archive**: SourceCollectionIdentifier=6 (Closed Captions als textual proxy)
- **Quelle**: Seite 29, 79–82

### Nicht in GKG 2.1 enthalten
- **NUMARTS Feld**: Diskontinuiert (früher V1.0; jetzt separate Einträge statt Clustering)
- **Separate Counts-only File**: Eliminated (alte Praxis; jetzt single data file)
- **Quelle**: Seite 26–27

### Backward-Kompatibilität
- **GKG 1.0 wird weiterhin parallel erzeugt** (für Benutzer, die alte Format brauchen)
- **GKG 2.0 Format**: Nur für spezielle Subcollections verwendet; wird nicht für Daily News produziert; GKG 2.0 compat feed kommt NICHT
- **Minimal-Modifikationen** in GKG 2.1 gegenüber 2.0 (neuen Felder, keine Major Restructuring)
- **Quelle**: Seite 21–22, 26

---

## 6. Zusammenfassung Parsing-Strategie

1. **Tab-Delimited Parsing** (trotz .csv-Endung)
2. **Keine Kopfzeile**; 27 Spalten in fester Reihenfolge
3. **Encoding**: Multilingual (UTF-8 wahrscheinlich, aber nicht garantiert)
4. **Fehlende Felder/Leerzeilen**: Defensiv mit Null-Checks handhaben
5. **Character Offsets**: Zur Proximity-Kontextualisierung gruppieren
6. **Translingual-Flag** (T in GKGRECORDID) **vor Statistics** separat auswerten
7. **DATE ≠ Crawl-Zeit** (Veröffentlichung, nicht Verarbeitung)
8. **Keine Annahmen auf vorhandene Geographic Information** (neu in 2.1)
9. **Optional-Felder können leer sein** (insbesondere V2EXTRASXML, V2GCAM wenn keine Matches)
10. **Multiple Nennung** in V2ENHANCED-Feldern sind separate Einträge (nicht aggregiert)

---

Verbrauch: Claude Haiku 4.5, ca. 62.000 Token, 17 Seiten gelesen
