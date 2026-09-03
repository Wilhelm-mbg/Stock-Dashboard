# Wilhelms Entscheide (geltend)

Nur was **weitergilt**. Aufgehobenes steht mit Datum der Aufhebung.

## Daten und Messung

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

## Betrieb

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
- **Zwei Kursarchive werden ZUSAMMENGEFÜHRT** (03.09., Wilhelm, Formular): der Renderer-Store `bars_<iv>_<sym>` (Scan/Backfill) und die Dateisammlung des Sammlers (kerzenquelle.js) sollen ein Archiv werden; Alternativen „benennen und dokumentieren" und „so lassen" verworfen. Betrifft Handelspfad und Autopilot — stufenweise, mit Test-Invariante „Live = Messung" und eigener Messung, dass nichts driftet. Auftrag folgt nach Code-Karte. *Fundstelle: `uebergabe/oberflaeche-stufe4-2026-09-03.md` §5.1*
- **Oberfläche: schneiden auf drei Bildschirme** (02.09. abends, Wilhelm, Formular): Heute · Regeln · Werkzeuge; Reiter Vermögen und Messung entfallen (Inhalt zieht um, nichts wird gelöscht); Explorer und Schein-Finder bleiben und werden später optimiert; Backtest und Kursarchiv „wenig bis gar nicht" sichtbar, höchstens eine Grafik zur Vollständigkeit des Archivs; tägliche Nutzung laut Wilhelm: Bücher/Depot, Marktüberblick, News. Zielbild und Stufen in [oberflaeche.md](oberflaeche.md).
- **Spekulations-Radar-Routine NICHT aufs Wiki umgestellt** (02.09.) — reine Anzeige, bleibt wie sie ist.
- **Insider-Käufe (Form 4) weggelassen** (01.09.) — Landkarten-Empfehlung 3 nicht verfolgt.
- **Server-Nutzung** (R620 als Webserver, R720xd als Storage) — vertagt.
