---
tags: [steuerung]
---
# Wilhelms Entscheide (geltend)

Nur was **weitergilt**, jüngste zuerst. Aufgehobenes steht mit Datum der Aufhebung. Wirklich Offenes steht ganz unten — und nur das.

## Daten und Messung

- **Abspaltungs-Kursfaktor per Zweitabruf: JA** (03.09.2026 spät, Wilhelm, Formular). Alpacas Maßnahmen-Tabelle trägt bei Abspaltungen nur das Stückverhältnis; der Kursfaktor wird je betroffenem Wert und Abspaltung einmal gemessen (`adjustment=all ÷ dividend` an gemeinsamen Stempeln, SPGI 1,0572) und mit Datum und Herkunft `gemessen` in die Maßnahmen-Tabelle geschrieben; danach bekommen auch diese Werte eine bereinigte Kopie. Rohdaten unberührt. Ausnahme von „kein zweiter Abruf" gilt nur hierfür. Fundstelle [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §6 Punkt 8.
- **Skalenkonvention des Alpaca-Archivs: BEIDES** (03.09.2026 abends, Wilhelm, Formular): Rohdaten (echte gehandelte Kurse, append-only, nie rückwirkend geändert) UND eine bereinigte Kopie in Yahoo-Konvention. Die Kopie wird **lokal aus Roh + Kapitalmaßnahmen-Tabelle abgeleitet**, nicht doppelt geholt; bei einer neuen Maßnahme wird nur die Kopie des betroffenen Werts neu abgeleitet. Alternativen „nur roh" und „nur bereinigt" verworfen. Anlass: MNST-Split und SPGI-Abspaltung im Nachholer-Fenster. Fundstelle [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §6 Punkt 8.
- **Alpaca-Balken-Probe: freigegeben mit Nachtrag** (03.09.2026, Wilhelm, Formular). Die Probe fiel an einem von acht Kriterien (ARM: 9 statt höchstens 7 Minutenkerzen über 0,1 %, Maximum 0,18 %); alle Lagemaße praktisch null. Das gemessene Urteil bleibt `false`; die Freigabe ist eine eigene Datei mit Datum. Breite Gegenprobe über 133 Werte durch den Nachholer (`--pruefen`), Stoppregel > 10 % der Werte. Fundstelle [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §6 Punkt 2.
- **Alles sammeln, nicht nur das Nötige** (03.09.2026, Wilhelm): „Haben ist immer besser als brauchen —
  lieber alles sammeln als es dann später zu brauchen"; er will auf dem Datensatz vielleicht ein LLM
  trainieren. Folge: der Alpaca-Nachholer für die verworfenen CFD-Bereiche bleibt (~10 min), zusätzlich
  kommt eine **Alpaca-Vollsammlung** — Minutenbalken für das ganze eingefrorene Universum plus die seit
  2016 verschwundenen Werte, Vor- und Nachbörse mit (Sitzung markiert), eigener Ordner
  `E:/Markt-Dashboard-Archiv/alpaca1m/`, ersetzt nichts, bis ein Leser in Z2 ausdrücklich umgehängt wird.
  Erstes Kursarchiv des Projekts ohne Überlebensverzerrung (ab 2016). **Nicht** gesammelt: die vollständige
  Quote-Tafel (Terabytes je Jahr); Krypto bleibt Yahoo. Plan in [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §5 Z1c.
- **Punkt-in-Zeit-Universum EINGEFROREN** (31.08.2026). `massive/universum-2024-09-02.json` ist
  schreibgeschützt, Kopie auf `E:` — **unveränderliche Messgrundlage**. Grund: der Stichtag
  fiel am 03.09.2026 aus dem Gratis-Fenster; danach nie wieder erzeugbar. **Kein Nachbau, kein
  neuer Stichtag, kein App-Erzeuger.**
- **1m-Sammlung RUHT** (27.08.2026) — ein regulärer Lauf hatte 489 Reihen Kerzen entfernt.
  Umgesetzt über `sammler.json` (`{"intervalle":{"1m":0}}`), in der gebauten Fassung
  gegengeprüft.
- **Sentiment-Gewicht auf NULL** (31.08.2026) — *„Was nie gemessen wurde, steuert nichts."*
  Anzeige bleibt, gekennzeichnet als unbelegt. **Wiedererhöhung nur gegen eine belegte
  Messung.** Umgesetzt in Vorgabe **und per Migration** für gespeicherte Stände.
- **Kostenhürde = Live-Hürde**, nicht die theoretische.
- **Eintrittskarte „unter 1.000 Handelstage" AUFGEHOBEN** (27.08.2026) — es gibt keine
  Vorabschranke; **nicht filtern, sondern etikettieren.**
- **Stopp-Regeln: mindestens 10 Beobachtungen je Marktlage.**
- **Feinere Marktlagen zulassen.**
- **Reihenfolge umgestellt (01.09. abends):** erst Paper-Konto beim Aktienbroker (Wilhelms
  Handlung) und dort Kosten messen; dann Wiedervorlage klein; Momentum erst gegen gemessene
  Aktienkosten. *Grund: jede Gefäß-Rechnung ohne gemessene Aktienkosten bleibt Annahme.*
  *Notiz 02.09.: Die **CFD-Messung** wurde per Auftrag vorgezogen (Ergebnis „nicht
  entscheidbar", `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`); die
  Kassa-Zeile steht dort ausdrücklich als **Annahme** — der Entscheid selbst steht.*
- **Liquide Momentum-Fassung JETZT messen** (02.09.): Korb ≥ 100 Mio $ Tagesumsatz, neue
  Vorregistrierung auf vorhandenen Daten (~350k). *Ausnahme von „keine halbe Arbeit parallel",
  weil sie ohne Paper-Konto beantwortbar ist und dessen Kostenmessung für diesen Kandidaten
  überflüssig machen kann.*
- **Momentum-Buch auf den liquiden Korb umstellen** (02.09.): das Simulationsbuch übernimmt
  exakt die gemessene Konfiguration (231/21/63, stärkste 10 %, ≥ 100 Mio $ Median-Tagesumsatz,
  Punkt-in-Zeit). Jede künftige Periode ist Out-of-Sample-Beleg; Sperrklinke Buch = Messung.
- **Aktien-Kostenmessung über Alpaca-Paper** (02.09.): Broker-Recherche ergab drei Kandidaten mit echten Aktien, US-Nebenwerten, Paper-Konto und REST-Schnittstelle (Alpaca, Interactive Brokers, Trading 212). *Gewählt Alpaca:* kein Depot nötig, Schlüssel-Anbindung aus Node, Füllung am NBBO misst genau die unbekannte Größe (Spanne). Echtkonto für Deutschland unsicher — für die Messung unerheblich, die Spanne gehört dem Markt, nicht dem Broker. IBKR bleibt der Weg, wenn ein Echtkonto ansteht (realistischste Füllung, Gateway/OAuth-Aufwand). Details [offene-auftraege.md](offene-auftraege.md), Vergleich [datenquellen.md](datenquellen.md).
- **Kostenhürde aus der historischen Kurstafel statt aus Paper-Runden** (02.09. abends, Wilhelm): „um es sinnvoll auswerten zu können, müssen wir das minütlich über mehrere Tage erfassen — gibt es keine Möglichkeit, das aus historischen Daten abzulesen?" Antwort: ja, Alpaca Basic (NBBO seit 2016, laut Dokumentation, Probe steht aus). Paper-Automat bleibt als Kontrolle. Auftrag in [offene-auftraege.md](offene-auftraege.md).
- **Vereinigungsregel der Kursarchive** (03.09., Wilhelm, Formular nach Z0): (1) Grundregel angenommen — bei gemeinsamem Stempel gewinnt die Datei in allen Feldern, laufende und Quote-Kerzen werden nicht übernommen, Quelle je Kerze abgeleitet; (2) CFD-markierte Store-Kerzen (77 % der 1m-Tiefe) **verwerfen und neu holen** — Ersatzquelle Alpaca-SIP-Minutenbalken (Probe in Z1); (3) Capital-Spannen bekommen ein eigenes Hüllenfeld `spannen`; (4) Krypto bekommt einen eigenen Ordner `archiv<iv>/krypto/`. *Fundstelle: `studien/archiv-zusammenfuehrung-2026-09/BEFUND.md` §5, [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §6*
- **Zwei Kursarchive werden ZUSAMMENGEFÜHRT** (03.09., Wilhelm, Formular): der Renderer-Store `bars_<iv>_<sym>` (Scan/Backfill) und die Dateisammlung des Sammlers (kerzenquelle.js) sollen ein Archiv werden; Alternativen „benennen und dokumentieren" und „so lassen" verworfen. Betrifft Handelspfad und Autopilot — stufenweise, mit Test-Invariante „Live = Messung" und eigener Messung, dass nichts driftet. Auftrag folgt nach Code-Karte. *Fundstelle: `uebergabe/oberflaeche-stufe4-2026-09-03.md` §5.1*

## Oberfläche

- **Eingefrorenes Universum mit der App ausliefern** (04.09., Wilhelm, Formular zu GitHub #111): fremde Installationen konnten nie sammeln, weil `massive/universum-*.json` nur in Wilhelms Datenordner liegt. Gewählt: Kopie der eingefrorenen Datei ins Paket, Erststart-Kopie in den Datenordner, nie überschreiben. Alternativen „Ersatzliste aus Yahoo" (keine Punkt-in-Zeit-Eigenschaft) und „nur antworten" verworfen. Auftrag `uebergabe/auftrag-universum-mitliefern-2026-09-04.md`, nach dem Sammler-Chat (beide fassen kerzenquelle.js und test-v6.js an).
- **Markt-Reiter: alle ~3.200 Aktien statt 600, Takt 1 Minute** (04.09., Wilhelm, Formular; „warum nur 600?" / „so aktuell wie nur möglich"): die 600 waren eine Setzung vom 25.08. aus der Zeit der Einzelabrufe (600 Anfragen je Bild); seit dem Sammelabruf (800 Kürzel je Anfrage, 3,4 s) kostet das ganze Universum ~8 Anfragen je Runde. Alternativen 1.500 und 600 verworfen. Beides im Auftrag `uebergabe/auftrag-sammler-verhungern-2026-09-04.md` (Punkte 4 und 5); Drosselung durch Yahoo muss sichtbar werden, nicht still zurückfallen.
- **Archiv LIVE nachführen, über Alpaca** (04.09., Wilhelm, Formular; Frage „geht das nicht live?"): das Minutenarchiv soll während der US-Sitzung nachgeführt werden — alle paar Minuten die FERTIGEN 1m-Balken (Gratisstufe: SIP mit 15 Min Verzögerung, zu verifizieren), daraus 5m/15m/60m ableiten. Alternativen verworfen: Yahoo-Live für top500 (Höflichkeitsgrenze, Stempel-Falle), nur der Viewer live, so lassen. **Vor dem Bau:** Nur-Lese-Probe am Konto während der Sitzung (Alter des jüngsten Balkens je Feed sip/iex/delayed_sip; Aufgabe „Markt-Dashboard Probe Live-Verzoegerung" 04.09. 16:05). Danach ein Bau-Chat. Auftrag in [offene-auftraege.md](offene-auftraege.md).
- **Reines Markt-Dashboard als vierter Reiter** (04.09.2026, Wilhelm, Formular nach TradingView-Sichtung): Reiter „Markt" nur für den Markt — Index-Kacheln, Sektor-Leiste, Heatmap, Hotlists, Earnings-Kalender, Vor-/Nachbörse, Schlagzeilen; Marktkarte und Radar ziehen dorthin, ebenso die Marktblöcke aus Heute→Überblick (Kacheln, Heatmap, News, Kalender); Heute behält Bestand und Meine Papiere. „Nicht so vermixt mit den Strategien." Aktien-Viewer nach TradingView-Muster ist Stufe 6 (verworfen: Viewer zuerst; beides in einer Stufe). Nicht übernommen: Analystenrating, Community-Ideen, Forecasts (Meinungen, keine Daten). Fundstelle [oberflaeche.md](oberflaeche.md) Stufe 5.
- **Oberfläche: schneiden auf drei Bildschirme** (02.09. abends, Wilhelm, Formular): Heute · Regeln · Werkzeuge; Reiter Vermögen und Messung entfallen (Inhalt zieht um, nichts wird gelöscht); Explorer und Schein-Finder bleiben und werden später optimiert; Backtest und Kursarchiv „wenig bis gar nicht" sichtbar, höchstens eine Grafik zur Vollständigkeit des Archivs; tägliche Nutzung laut Wilhelm: Bücher/Depot, Marktüberblick, News. Zielbild und Stufen in [oberflaeche.md](oberflaeche.md).
- **Spekulations-Radar-Routine NICHT aufs Wiki umgestellt** (02.09.) — reine Anzeige, bleibt wie sie ist.
- **Insider-Käufe (Form 4) weggelassen** (01.09.) — Landkarten-Empfehlung 3 nicht verfolgt.

## Betrieb

- **Budgets knapp, Nachschlag erlaubt** (04.09.2026, Wilhelm, Formular): Aufträge bekommen enge Token-Budgets (Faustzahlen in [betrieb.md](betrieb.md)); ein Chat darf mit Begründung überziehen, nie ohne Übergabe. Verbrauch ist Pflichtzeile der Übergabe.
- **Jeder Auftrag mit Start-Prompt** (04.09.2026, Wilhelm): zu jeder Auftragsdatei ein Dreizeiler zum Einfügen, der auf die Datei verweist.
- **Lange Läufe nur über die Windows-Aufgabenplanung** (04.09.2026, PM nach dem Abbruch 04:38; Wilhelm 03.09.: „starte du doch bitte einfach die cmd"): der PM startet Migrationen, Nachholer und Nachtläufe selbst, Schlüssel bleiben im Benutzerprofil. Hebt „im Hintergrund einer Sitzung" auf.
- **Alpaca-Schlüssel im Benutzerprofil** (03.09.2026, Wilhelm): `setx`, nie in Code/Log/Commit/Chat; Prozesse bekommen sie durchgereicht.
- **Kein PM-Weckruf mehr** (31.08.2026) — hebt die Anordnung vom 27.08. abends auf. Grund:
  Token-Verbrauch.
- **Wenige Chats, selbsttragende Prompts** (31.08.2026) — siehe [betrieb.md](betrieb.md).
- **Entscheide werden IMMER doppelt verteilt:** an jede Sitzung **und** auf die Tafel bzw. ins
  Wiki. *Die Kanäle haben komplementäre Löcher.*
- **Entscheidungen als Formular**, nie als Fließtext.
- **Unfertige `abmeldungen.js`-Arbeit beiseitegelegt** (31.08.2026, `git stash` auf main).

## Offen zur Entscheidung

- **Datentarif — Vorlage liegt, Entscheid steht aus.** *Empfehlung der Prüfung vom 01.09.:
  **jetzt nichts kaufen** — erst die Sentiment-Messung gratis fahren, dann die drei ungenutzten
  Endpunkte (Dividenden, unadjustiert, Splits bis 1987) einsammeln. Danach Starter $29 als
  **einmaliger Abzug** (Vollauf ohne Ratenbremse + 5 statt 2 Jahre, bleibt dauerhaft), **nicht
  als Abo**. Zwei Sperren vorher: Support zur Rückwirkung fragen, und die `dat[0]`-Falle beim
  eingefrorenen Universum schließen.*
- **Server-Nutzung** (R620 als Webserver, R720xd als Storage) — vertagt.
- **Vor Stufe 6 (Aktien-Viewer): Vor- und Nachbörse im Chart?** — Formular folgt mit dem Auftrag.
- **Vor Z2: Leser direkt ans Alpaca-Archiv oder ans Yahoo-Dateiarchiv?** — ändert die Messbasis; Formular nach der Vollsammlung.
- **Zweiter Yahoo-Abruf für die 90 ungeprüften Alpaca-Bereiche?** ([offene-auftraege.md](offene-auftraege.md), Baustellen)
