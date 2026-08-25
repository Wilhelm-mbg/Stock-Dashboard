# Warteschlange des Strategie-Tüftlers

Entwürfe, die auf Messung durch die Mess-Kette warten. Der Tüftler trägt ein,
der Projekt-Manager verteilt, die Mess-Kette streicht nach der Messung.

**Offen: 1 Entwurf, 2 Auftragsvorschläge.**
(Bei 3 oder mehr offenen Entwürfen arbeitet der Tüftler nachts am Datenbestand
statt zu entwerfen.)

---

## Entwürfe — warten auf Messung

### 1. `glockendruck-nacht` — eingetragen 26.08.2026

**Status:** wartet auf Messung. Vorbedingung: Auftragsvorschlag A unten.
Zusätzlich gilt die beschlossene Sperre (erst die Neumessung der zwölf Strategien
auf dem versionierten Instrument).

**Vorregistrierung:** `studien/vorregistrierung-2026-08-26-glockendruck-nacht/VORREGISTRIERUNG.md`
**Entwurfsnotizen:** `studien/tueftler/2026-08-26-glockendruck-nacht.md`

**These.** Wer über die Sitzungsgrenze hält, stellt Kapital bereit, wenn die
Innertagsmenge flach sein muss und Market-on-Close-Fluss nicht nach dem Preis fragt.
Beobachtbar am Schlussdruck: `S = (Schluss − Tief)/(Hoch − Tief)`, unterstes Quintil
des zugelassenen Querschnitts, long über Nacht.

**Machbarkeits-Zahlen** (gezählt, nicht gemessen; 400er-Stichprobe aus 2.249 CS/ADRC):

| Größe | Wert |
|---|---|
| Handelstage / davon Bestätigung | 9.329 / **4.665** (ab 05.02.2008) |
| Signalanteil | 19,8 %, feuert an praktisch jedem Tag |
| Breite der Auswahl | 34/Tag in der Stichprobe (≈ 190/Tag im vollen Universum) |
| Beharrlichkeit | **0,200** bei Zufallserwartung 0,198 — rein zeitlich wechselnd |
| Streuung σ der Tagesmittel | 0,880 Pp (voller Tag zum Vergleich: 1,474) |
| se / MDE | 0,0129 / 0,0258 Pp |
| **`delta80` bei 2 Tests** | **0,0397 Pp** — Korpus-Median ist 0,605 → **Faktor 15,2 schärfer** |
| Kostenhürden | Aktie 0,04 · CFD 0,10 · Standard-Schein 0,23 (letzterer ausgeschlossen) |
| Umsatz-Median der Auswahl | 34,3 Mio $ (Korb 37,2) — **keine Kostenneigung** |

**Warum beide Antworten zählen.** JA (≥ 0,10 Pp, |t| ≥ 2,2414, Tagbein trägt weniger als
die Hälfte) wäre die erste handelbare Kante auf dem Basiswert. NEIN (obere Grenze < 0,04 Pp)
schließt das Sitzungsgrenzen-Fenster über 40 Jahre unterhalb der Aktienhürde — die schärfste
obere Schranke, die dieses Projekt je gehabt hätte, und genau die Sorte Aussage, die M1
des Studienplans einfordert. `delta80` = 0,0397 liegt unter **beiden** Schwellen; es gibt
keinen Zweig, in den die Studie nicht laufen kann.

**Testzahl 2** (Nachtbein, Tagbein), Schwelle |t| ≥ 2,2414. Sieben Gatter in der
Vorregistrierung, darunter zwei harte: Eröffnungskurs-Bereinigung an Ex-Tagen und der
offen ausgewiesene C8-Vorgriff (die Zahl ist eine **obere Schranke**, ein NEIN bleibt
gültig, ein JA ist vorläufig).

---

## Auftragsvorschläge — gebaut wird von einer Bausitzung, nicht vom Tüftler

### A. `ausstieg`-Schalter in der Messmaschine *(Vorbedingung für Entwurf 1)*

Spiegelbild des bereits vorhandenen `einstieg`-Schalters:
`ausstieg: 'schluss' | 'folgeEroeffnung'` in `messmaschine.js`.

- Muss an **allen drei Stellen zugleich** greifen: Signal, Kontrolltopf, Placebo. Nur den
  Signalpfad umzustellen heißt, zwei verschiedene Ausführungen zu vergleichen und den
  Unterschied Effekt zu nennen — der **C7**-Fehler, der hier schon aus t 5,96 ein t −0,75
  gemacht hat.
- `eroeffnungKurs()` fällt heute beim Fehlen der Eröffnung still auf `bars[k−1][1]` zurück.
  Für einen **Ausstieg** ist dieser Rückfall unzulässig: er setzt die Rendite mechanisch auf
  die Schluss-Fassung und verdünnt jeden Unterschied gegen null. Das Signal muss dann
  ausgeworfen werden.
- Testfall nach dem Muster von C6/C7.
- Ohne diesen Schalter ist nur das Tagbein der Studie messbar, nicht das Nachtbein.

### B. Auktionskosten am Demo-Konto messen

Die Kostentabelle (Aktie 0,04 · CFD 0,10 · Schein 0,23 Pp je Umlauf) beschreibt die
**notierte Spanne**. Ein Übernacht-Handel füllt aber in der **Schluss- und der
Eröffnungsauktion**, und was eine Auktionsfüllung wirklich kostet, ist hier nie gemessen
worden. Die laufende Kostenmessung des Demo-Kontos (seit 8.23.32) sollte um Auktionsorders
erweitert werden.

Das ist kein Beiwerk: Es ist eine **M3-Messung** aus Abschnitt 6 des Studienplans — großer
Effekt, in Tagen entscheidbar — und sie trägt auch dann, wenn es gar keine Kante gibt.
Solange sie offen ist, steht unter jeder Netto-Aussage dieses Entwurfs ein Vorbehalt.

---

## Hinweise an andere Rollen (keine Aufträge)

- **#85 betrifft auch `archiv1d`, nicht nur 60m.** Gemessen 26.08. auf 80 Reihen: 56 % haben
  in der letzten Kerze unter 60 % ihres Median-Volumens; AAPL 24.08. 15,0 statt 46,8 Mio
  Stück; `stand` der Dateien 24.08. 17:27 UTC, also mitten in der Sitzung. Wer #85
  abarbeitet, sollte das Tagesarchiv mitnehmen.
- **Falsches Etikett:** das Feld `quelle` der 1d-Dateien lautet
  `"yahoo v8 chart, range=730d interval=60m"`. Die Daten sind Tageskerzen ab 1986.
- **Für `FEHLERTYPEN.md`, als Entwurfsfehler:** *Ein Querschnittsmerkmal, dessen Auswahl von
  Tag zu Tag beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss zeigen.
  Beharrlichkeit gegen die Zufallserwartung (= Signalanteil) gehört vor die Vorregistrierung.*
  Gefunden am 26.08. am eigenen ersten Entwurf (Beharrlichkeit 0,943), der daran gestorben ist.
