# Überlebensverzerrung

Unser Kursarchiv enthält nur Werte, **die es heute noch gibt**. Wer darauf misst, misst eine
geschönte Welt — Pleiten, Übernahmen und Delistings fehlen.

## Wie groß die Lücke ist

**≥ 12,7 % des Querschnitts fehlen, auf ~20 % steigend** — mit den vorhandenen Quellen **nicht
zu schließen**. *Fundstelle: `studien/vorregistrierung-2026-08-25-ueberlebensverzerrung/`,
`studien/landkarte-2026-09-01/LANDKARTE.md`*

Gegenmaßnahme im Haus: **1.164 Reihen verschwundener Werte** (`massive/`) plus ein
**eingefrorenes Punkt-in-Zeit-Universum** (Stichtag 2024-09-02) — siehe
[datenquellen.md](datenquellen.md).

**Seit 03.09.2026 wird die Lücke auf Minutenbasis geschlossen** (Stufe Z1c,
`tools/alpaca-vollsammlung.js`): das Alpaca-Minutenarchiv sammelt **5.082 verschwundene Werte** (davon führt die Quelle 4.798)
neben den 3.263 des eingefrorenen Universums, zurück bis 2016 — nicht 1.164 Tagesreihen, sondern
Minutenbalken. Zwei Dinge daran sind für die Verzerrung entscheidend und stehen ausführlich in
[datenquellen.md](datenquellen.md): (1) die **Lebenszeit** jedes Werts kommt aus den Balken der
Quelle selbst (erster/letzter Balken), nicht aus dem Listendatum — ein Wert, den die Liste zu früh
für tot erklärt, verliert dadurch keine Kurse; (2) ein **wiederverwendetes Kürzel** wird als eigene
Reihe `<KÜRZEL>~2` geführt, nie mit dem Vorgänger vermischt. Ohne (2) hätte die Sammlung ihre
eigene Verzerrung erzeugt: der erloschene Träger bekäme die Kurse seines Nachfolgers angehängt und
sähe damit aus, als habe er überlebt.

Was das **nicht** leistet: die Lücke ist damit für den US-Aktienquerschnitt ab 2016 geschlossen,
nicht davor und nicht für Werte, die auch Alpaca nicht führt. Wie groß der verbleibende Rest ist,
sagt erst die Auszählung nach dem Vollauf.

## Weg 3 — die Messung, wie stark und in welche Richtung verzerrt wird

Beide Mitglieder gemessen, **alle Wächter grün**:

| Mitglied | c_gew | t | Paartage | Fundstelle |
|---|---|---|---|---|
| 1 — Schlusskurse | **+0,0568 Pp/Tag** | 20,99 | — | `studien/vorregistrierung-2026-08-27-weg3-schluss/ERGEBNIS.md` |
| 2 — Übernacht | **+0,0462 Pp/Tag** | **21,39** | 496 | `studien/vorregistrierung-2026-08-27-weg3-uebernacht/ERGEBNIS.md` |

*Intraday nachrichtlich: +0,0140, t 7,83. Sperrliste eingehalten: kein Kanten-Urteil, keine
Reparatur-Empfehlung.*

> ## **Urteil: Richtung belegt POSITIV — das Archiv UNTERTREIBT über Nacht.**

**Überraschende Richtung.** Die Verschwundenen brachten über Nacht im Schnitt *mehr*, nicht
weniger. Plausible Erklärung (nicht gemessen): Übernahmen zahlen Prämien; Pleiten sterben eher
tagsüber.

## Wie man damit rechnet

- Ein **JA** auf Überlebenden-Daten ist **konservativ** gemessen — es wäre mit vollständigen
  Daten eher größer.
- Ein **NEIN** muss die Verzerrungsrichtung **mitbedenken** — es könnte ein zu Unrecht
  verworfener Kandidat sein.
- **Kein einheitliches Vorzeichen über alle Strategieklassen.** Für die Dip-Familie beschönigt
  das Archiv um **−3,78 Pp** (`studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md`) — also
  andersherum. **Nie pauschal anwenden, immer je Klasse prüfen.**
- **Und nie über den Horizont hinweg (gemessen 02.09.2026, Monats-Momentum H = 63):** Der
  Weg-3-Wert gilt **über Nacht**. Auf **63 Tagen** liefen die Verschwundenen im Fenster 2024-08
  bis 2026-08 unbedingt **deutlich schlechter** als Überlebende (−0,9 / −7,6 / −8,4 Pp je
  Periode) — **das umgekehrte Vorzeichen**: auf Monatshaltedauer dominieren Sterbepfade, nicht
  Übernahmeprämien. Bedingt landen Verschwundene **1,19× überproportional** im stärksten
  Zehntel (13,1 % gegen 11,0 %); auf Korbebene (Korb − Markt) war das Vorzeichen in drei
  Perioden **gemischt** (+0,12 / +0,59 / −0,49 Pp). **Kein Korrekturwert, kein Vorzeichen für
  2006–2026**; 52 Verschwundenen-Reihen fielen dem F1-Filter (Sprünge am Delisting) zum Opfer.
  *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`, §7*

## ⚠ Wie weit die Gegenmaßnahme reicht — und wo sie aufhört (gezählt 03.09.2026)

**Die 1.164 verschwundenen Reihen decken nur 2024-08-23 bis heute.** Der früheste Tagesbalken
über alle Reihen ist der **23.08.2024**; sie stammen aus der Gratisstufe von Massive, deren
Aggregat-Fenster zwei Jahre zurückreicht ([datenquellen.md](datenquellen.md)). `verschwundene.json`
kennt 6.921 aktienartige Kürzel — Balken haben nur die zuletzt Verschwundenen:

| Delisting-Jahr | aktienartige Kürzel | davon mit Tagesbalken |
|---|---|---|
| 2004–2022 | 3.690 | **0** |
| 2023 | 740 | 15 (2 %) |
| 2024 | 609 | 225 (37 %) |
| 2025 | 558 | **540 (97 %)** |
| 2026 | 438 | **406 (93 %)** |

**Was das für jede Messung heißt, die die Verschwundenen als Vergleichsgruppe braucht:**
sie ist auf **2025/2026** beschränkt. Für 2016–2024 gibt es keine Gegengruppe — nicht „noch
nicht", sondern **gar nicht**, weil die Kursdaten nicht mehr zu beschaffen sind. Die
Weg-3-Messungen oben (Schlusskurse, Übernacht) haben deshalb ihren Messzeitraum, und der
Korrekturwert gilt nicht davor. *Fundstelle:
`studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md` §9b.1*

**Zweiter Befund derselben Zählung: die Verschwundenen sind eine ANDERE Grundgesamtheit,
nicht ein Ausschnitt derselben.** Von 1.164 Reihen liegen **823 (2025) bzw. 848 (2026) unter
5 Mio $ Median-Tagesumsatz** und damit unterhalb jedes Universums, mit dem hier gemessen wird;
**kein einziger** hatte je über 1.000 Mio $. Und wo beide Rahmen sich überschneiden, sind die
Verschwundenen **billiger**: in der Klasse 5-50 Median-Kurs **17,76 $ gegen 29,00 $**. Wer
Verschwundene gegen Überlebende hält, misst deshalb zuerst Kurs und Größe — und erst danach
Sterblichkeit. Kurseffekte gehören in jede solche Rechnung als eigene Zeile.

## Klassen, die damit gar nicht messbar sind

Strategien, deren Auswahl systematisch bei Verschwundenen landet (Pleitenähe,
Delisting-Arbitrage, Small-Cap-Reversal), sind mit dem Überlebenden-Archiv **nicht** messbar —
die Verschwundenen-Reihen decken nur den Messzeitraum ab.

## Gemessen 03.09.2026: Zusatz C der Spannen-Studie (nur 2025/2026)

Die einzige Messung im Haus, die Verschwundene und Überlebende **an derselben Zielgröße** vergleicht (notierte Spanne, Alpaca-SIP-Tafel), mit derselben Auswertungsfunktion und Positivkontrolle (4 von 4 Mediane des Rahmens A exakt reproduziert). Ergebnis: in 5–50 Mio $ **nicht entscheidbar** (+0,0021 Pp, Band [−0,032, +0,041], Auflösung 0,055 Pp); in 50–250 handeln die Verschwundenen **enger** (−0,0449, Band schließt die Null aus) — die Erwartung „Verschwundene breiter" hat sich für diese Jahre nicht bestätigt. Auf die Hürden wirkt das in der vierten Stelle nicht. **Für 2016–2024 bleibt es beim Kasten oben: nicht messbar.** *Fundstelle: `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS-ZUSATZ-C.md`, Registrierung §9b (Commit `30c5626`, vor dem Bau).*
