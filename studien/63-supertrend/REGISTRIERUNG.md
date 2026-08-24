# Vorregistrierung — Supertrend-Regelwerk aus Issue #63

Festgeschrieben am **24.08.2026**, **vor der ersten Rechnung**. Alles, was unten steht,
steht fest, bevor eine Zahl bekannt ist. Wird danach etwas geändert, wird die Änderung
hier als Nachtrag mit Datum vermerkt — nicht stillschweigend eingebaut.

## Die Idee (Felix, Issue #63)

Bei jeder Kerze im 5- oder 15-Minuten-Chart von oben nach unten:

1. **Richtungs-Filter** — Kurs über EMA 50 → nur Long; Kurs unter EMA 50 → nur Short.
2. **Signal-Geber** — Supertrend(10, 2) wechselt beim Kerzenschluss die Farbe.
   Rot→Grün = Kaufkandidat, Grün→Rot = Verkaufskandidat.
3. **Überhitzungs-Schutz** — RSI(14) beim Wechsel: Long nur bei RSI < 65, Short nur bei RSI > 35.
4. Einstieg zur nächsten Kerze, Stop-Loss auf der Supertrend-Linie.
   Zusätzlich genannter Ausschluss: flacher EMA 50 („Seitwärts-Säge") → nicht handeln.

## Was genau gemessen wird

**Detektoren** (reine Funktionen `signal(bars, i) -> {dir}|null`, sehen nur `bars[0..i]`):

| Schlüssel | Inhalt |
|---|---|
| `st_roh` | nur Schritt 2 (Supertrend-Farbwechsel), ohne jeden Filter |
| `st_ema` | Schritt 1 + 2 (EMA-50-Richtungsfilter) |
| `st_voll` | Schritt 1 + 2 + 3 — **Felix' Regelwerk** |
| `st_steil` | `st_voll` zusätzlich mit Flach-Ausschluss (EMA-50-Steigung über 20 Kerzen ≥ 0,10 % je Kerze in Signalrichtung) |

Feste Parameter, aus dem Issue übernommen, **nicht** optimiert: ATR-Periode 10, Faktor 2,
EMA 50, RSI 14 (Wilder), Schwellen 65 / 35. Es wird **kein Parameterraster** gerechnet.

**Zeitrahmen:** 5m und 15m (die im Issue genannten). 1m und 60m nicht.

**Messung:** Messgeschirr der Signalstudie 2026-08 (`studien/signalstudie-2026-08/messgeschirr.js`,
unverändert). Überschuss gegen die Versatz-Kontrolle (leave-one-day-out, gleiche Tageszeit,
gleiches Symbol), t über **Tage** geclustert, Horizonte 1 h / 3 h / Tagesschluss, Cooldown und
Mindestrestzeit wie dort registriert.

**Zeitraum:** der ganze verfügbare Kalender (26.05.–21.08.2026). **Kein Entdeckungs-/
Bestätigungssplit** — weil hier nichts ausgewählt wird: alle Parameter kommen aus dem Issue,
nicht aus den Daten. Der Split würde nur Trennschärfe verschenken.

## Entscheidungsregel (steht vor der Messung fest)

**Primärtests: 4.** `st_voll`, Horizont 3 h, {5m, 15m} × {long, short}.
Bonferroni 0,05/4 → Schwelle **|t| ≥ 2,50**.

`st_voll` gilt als **belegt**, wenn für mindestens eine der vier Zellen *alle drei* gelten:

1. t über Tage ≥ 2,50 (Vorzeichen in Signalrichtung),
2. netto nach 0,10 Pp Kosten positiv,
3. Anteil positiver Symbole ≥ 0,55 (Symbole mit ≥ 3 Signalen).

Alles andere — `st_roh`, `st_ema`, `st_steil`, Horizonte 1 h und TS, Bedingungsschnitte —
ist **Nebenbefund**: wird berichtet, begründet aber kein Ja.

## Was diese Messung nicht kann (vor dem Urteil festgehalten)

Der Kalender endet am 21.08.2026; er hat rund 63 Handelstage. Aus der Signalstudie ist die
tagesgeclusterte Streuung bekannt: nachweisbar ab etwa **0,13 Pp (5m)** bzw. **0,18 Pp (15m)**
je Trade. Liegt der wahre Effekt darunter, sagt diese Messung „nicht entscheidbar" — nicht „nein".

Das ist hier ausnahmsweise wenig schmerzhaft: Die **Produkthürde** eines Standard-Scheins
(ATM, 21 Tage, Hebel 16) liegt bei **0,23 Pp je 3-Stunden-Umlauf** (Signalstudie, Produkttabelle).
Ein Effekt, den diese Messung nicht sieht, wäre mit dem Standardprodukt ohnehin negativ.
Die Auflösungsgrenze liegt also **unter** der Handelbarkeitsgrenze.

## Bekanntes, das nicht neu gemessen wird

* **Stop-Loss auf der Supertrend-Linie** (Schritt 4): Die Stop-Interaktion ist bereits gemessen —
  jeder Stop kostet Erwartungswert, monoton mit der Enge; ein enger Stop schneidet genau den
  rechten Rand der Verteilung ab, in dem der Erwartungswert steckt. Wird hier nicht wiederholt.
  Gemessen wird der Einstieg ohne Stop; ein Stop kann das Ergebnis nur verschlechtern.
* **Ausbruchsfamilie** (donchian, squeeze, orb, kanaltrend): in der Signalstudie durchgefallen.
  Supertrend ist verwandt (ATR-Band-Durchbruch), aber **nicht** identisch und war dort nicht
  dabei — deshalb wird gemessen statt verwiesen.

## Prüfungen vor der Auswertung

* **Präfix-Probe:** `signal(bars.slice(0, i+1), i)` muss `signal(bars, i)` gleichen (kein Zukunftsblick).
* **Rauchtest:** Signalzahl je Detektor plausibel (> 200 Signale je Zeitrahmen), sonst kein Urteil.

---

## Nachtrag 24.08.2026 (vor jeder Renditerechnung)

Der Flach-Ausschluss von `st_steil` war mit „EMA-50-Steigung ≥ 0,10 % je Kerze" unbrauchbar
gewählt: Rauchtest auf sechs Werten ergab **0 Signale** (0,10 % je 5-Minuten-Kerze wären rund
8 % am Tag). Das ist der in der Registrierung vorgesehene Fall „Signalzahl nicht plausibel".

Ersetzt durch eine skalenfreie Fassung: **|EMA 50 heute − EMA 50 vor 20 Kerzen| ≥ 1 × ATR(10)**,
Vorzeichen in Signalrichtung. Neuer Rauchtest: 136 Rohsignale auf sechs Werten — plausibel.

Zum Zeitpunkt dieser Änderung war **keine einzige Renditezahl** gerechnet; geändert wurde
allein die Signaldefinition eines **Nebenbefunds**. Die vier Primärtests (`st_voll`) sind
unberührt.
