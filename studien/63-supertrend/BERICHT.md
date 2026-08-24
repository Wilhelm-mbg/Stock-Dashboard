# Supertrend-Regelwerk (Issue #63) — Ergebnis

Vorregistriert am 24.08.2026 (`REGISTRIERUNG.md`), gerechnet am selben Tag mit dem
unveränderten Messgeschirr der Signalstudie 2026-08. Alle Zahlen sind reproduzierbar:
`node praefix-probe.js`, dann der Lauf, dann `node auswertung.js`.

## Das Ergebnis in einem Satz

**Felix' Regelwerk hat den vorregistrierten Test nicht bestanden — und die drei Filter,
die das Regelwerk ausmachen, tragen nichts bei: der nackte Supertrend-Wechsel misst dasselbe.**

## Die vier Primärtests

`st_voll` = Schritt 1 + 2 + 3 des Issues. Horizont 3 h. Überschuss gegen die
Versatz-Kontrolle (gleiches Symbol, gleiche Tageszeit, andere Tage), t über Tage geclustert.

| Zeitrahmen | Richtung | Signale | Symbole | Tage | brutto | netto (0,10) | t | MDE |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 5m | long | 3.665 | 185 | 59 | +0,004 | −0,096 | +0,25 | 0,095 |
| 5m | short | 3.484 | 185 | 59 | +0,076 | −0,024 | +1,48 | 0,094 |
| 15m | long | 1.794 | 185 | 52 | +0,007 | −0,093 | −0,17 | 0,107 |
| 15m | short | 1.483 | 185 | 52 | +0,018 | −0,082 | −0,49 | 0,146 |

Alle Angaben in Prozentpunkten je Trade. Schwelle war |t| ≥ 2,50 **und** netto positiv
**und** Symbolanteil ≥ 0,55. **Keine der vier Zellen erfüllt auch nur die erste Bedingung.**

## Warum das ein belastbares Nein ist (und wo es aufhört)

Die kleinste nachweisbare Wirkung liegt bei **0,094–0,146 Pp** je Trade. Diese Messung
konnte also alles sehen, was größer als etwa 0,15 Pp ist — sie hat nichts gesehen.

Das ist genau der Bereich, auf den es ankommt: Die **Produkthürde** eines Standard-Scheins
(ATM, 21 Tage, Hebel 16,2) beträgt **0,23 Pp je 3-Stunden-Umlauf**. Selbst die freundlichste
Zelle (5m short, +0,076 Pp brutto) liegt nach reinen Aktienkosten (0,10 Pp) schon im Minus.
**Es gibt keinen Rest, der nur am falschen Produkt gescheitert wäre.**

Was diese Messung *nicht* ausschließt: eine Kante unter etwa 0,09 Pp. Die wäre aber mit
keinem verfügbaren Produkt handelbar — die billigste Produktvariante der Signalstudie kostet
0,05 Pp je 3 h, der Standard-Schein 0,23.

## Der interessanteste Nebenbefund: die Filter tragen nichts

Horizont 3 h, brutto in Pp, ganzer Zeitraum:

| Stufe | 5m long | 5m short | 15m long | 15m short | Signale (5m) |
|---|---:|---:|---:|---:|---:|
| `st_roh` — nur Farbwechsel | +0,020 | +0,070 | +0,025 | +0,030 | 25.460 |
| `st_ema` — + EMA-50-Filter | +0,023 | +0,066 | +0,038 | +0,034 | 17.292 |
| `st_voll` — + RSI-Filter (Felix) | +0,004 | +0,076 | +0,007 | +0,018 | 13.927 |
| `st_steil` — + Flach-Ausschluss | +0,028 | +0,207 | −0,124 | −0,020 | 3.575 |

Der EMA-50-Richtungsfilter wirft 32 % der Signale weg und verändert das Ergebnis um
0,003–0,013 Pp — also um nichts. Der RSI-Filter wirft weitere 19 % weg und macht die
Long-Seite auf beiden Zeitrahmen **schlechter**. Beide Filter sind auf diesen Daten reine
Signalvernichtung: Sie kosten Gelegenheiten, ohne die Trefferqualität zu heben.

Das ist der ehrlichste Teil des Befunds, weil es Felix' eigene Kernannahme prüft: die
Ausschlüsse in Schritt 1 und 3 sollten „vor Verlusten schützen". Auf 62 Handelstagen,
185 Werten und 25.460 Rohsignalen tun sie das messbar nicht.

## Was nach Fund aussieht und keiner ist

`st_steil short 3h` auf 5m: +0,207 Pp, t = 2,11, 65 % positive Symbole. Das ist die einzige
Zelle mit positivem Netto nach Aktienkosten (+0,107). Sie ist trotzdem kein Fund:

* Sie war **nicht** vorregistriert (Nebenbefund).
* t = 2,11 liegt unter der Primärschwelle 2,50.
* Auf 15m dreht dieselbe Regel ins Minus (−0,020) — sie repliziert über den Zeitrahmen nicht.
* Gegen den Standard-Schein bleibt auch sie negativ (−0,023).

Ebenso die stärksten Zeilen der ganzen Rechnung: **„Mittwoch short"** mit t bis 3,69.
Über beide Zeitrahmen wurden **945 Testzeilen** gerechnet; die Bonferroni-Schwelle liegt
damit bei **|t| ≥ 4,04**, und der größte gemessene Wert ist 3,69. Vier Zeilen liegen über
|t| = 3,29 (unter reinem Zufall zu erwarten: 0,9) — **drei davon sind derselbe Mittwoch**,
getragen von 11 bis 12 Tagen. Ein Wochentagseffekt aus zwölf Mittwochen ist keine Kante,
sondern die Streuung von zwölf Tagen.

## Nicht neu gemessen (schon bekannt)

**Schritt 4 — Stop-Loss auf der Supertrend-Linie.** Die Stop-Interaktion ist in diesem Projekt
bereits gemessen: Jeder Stop kostet Erwartungswert, monoton mit der Enge. Der Erwartungswert
intraday steckt im rechten Rand der Verteilung, und ein enger Trailing-Stop schneidet genau
diesen Rand ab. Ein Stop auf der Supertrend-Linie kann die Tabelle oben nur nach unten
korrigieren, nicht nach oben.

## Prüfungen, die vorher liefen

* Präfix-Probe: 9.600 Stichproben, 259 Treffer, **0 Abweichungen** — kein Zukunftsblick.
* Bausteine gegen Handrechnungen: ATR, Wilder-RSI, EMA, Supertrend-Richtung — alle ok.
* Rauchtest: alle vier Stufen mit plausibler Signaldichte (nach einem dokumentierten
  Nachtrag zum Flach-Ausschluss, siehe `REGISTRIERUNG.md`).

## Konsequenz

Nicht einbauen — weder als Handelssignal noch als Vorschlag. Der Supertrend-Wechsel ist als
**Anzeige** unschädlich (er beschreibt, was der Kurs getan hat), aber eine Karte, die etwas
zeigt, was gemessen bei null liegt, lädt zum Handeln danach ein. Deshalb hier: nein, mit
offengelegten Zahlen.

## Nachrechnen

```
node studien/63-supertrend/praefix-probe.js
cd studien/signalstudie-2026-08
DETEKTOR_TABELLE=<repo>/studien/63-supertrend/detektoren.js node messgeschirr.js 5m beide
DETEKTOR_TABELLE=<repo>/studien/63-supertrend/detektoren.js node messgeschirr.js 15m beide
```
(die beiden `lauf-*-beide.json` nach `studien/63-supertrend/ergebnisse/` verschieben, dann
`node studien/63-supertrend/auswertung.js`). Im Repo liegen nur die schlanken
`zeilen-*.json` (Testzeilen ohne Einzelereignisse, 0,1 MB statt 25 MB); `auswertung.js`
liest beides. Der ganze Lauf dauert unter einer Minute.
