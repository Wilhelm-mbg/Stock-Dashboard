# Neumessung aller zwölf Strategien, 26.08.2026

Erste vollständige Neumessung, nachdem fünf Instrumentenfehler repariert waren
(#85–#88, #91) und die Messmaschine eine Versionsnummer bekommen hat, die sich nicht
mehr von Hand pflegen lässt.

**Die Frage war nicht „welche Strategie trägt?", sondern „haben die Reparaturen die
Messungen verbogen?".** Antwort: nein.

---

## Rahmen

| | |
|---|---|
| Maschine | **1.2.0**, Codestand `6a7d9e29db6f` — in **allen zwölf** Protokollen identisch |
| Archive | `E:/Markt-Dashboard-Archiv`, 2.887 Werte 60m / 2.966 täglich, beide enden 2026-08-24 |
| Protokolle | zwölf, mit heutigem Datum — die 26 älteren bleiben unangetastet liegen |
| Laufzeit | 8 Sekunden bis 19 Minuten je Strategie, gut eine Stunde insgesamt |

Dass **ein einziger Codestand** in allen zwölf Dateien steht, ist kein Nebensatz: Der
Lauf lädt die Maschine für jede Strategie neu. Eine Änderung mittendrin hätte bedeutet,
dass die ersten Strategien mit einer anderen Maschine gemessen wurden als die letzten —
genau die Unvergleichbarkeit, für die die Versionierung gebaut wurde. Die Sperre auf
`messmaschine.js` während des Laufs hat gehalten, und das ist hier **nachgewiesen**, nicht
angenommen.

## Ergebnis

**33 von 34 Varianten: Urteil unverändert.** Eine hat gewechselt:

```
rsi2seit-mcp Variante 3:  nicht-bestaetigt  ->  nicht-entscheidbar
  Überschuss 0,0556 -> 0,0552 Pp   gegen MDE 0,0554 Pp   (Abstand -0,0002 Pp)
```

Ausgelöst von **fünf fehlenden Signalen aus 104.900** — den unfertigen Kerzen, die #85
aus dem Stundenarchiv entfernt hat. Ein Urteil, das an 0,0002 Prozentpunkten hängt, ist
kein Urteil; dass es jetzt „nicht entscheidbar" heißt, ist die ehrlichere Auskunft.

### Wo sich Zahlen bewegt haben, und wo nicht

| | |
|---|---|
| Tages-Strategien (`momentum`, `monatswende-breit`, `quartalsschub-betrag`) | **bitgleich** — kein Feld abweichend |
| Stunden-Strategien | ein paar Signale weniger, Überschuss in der vierten Nachkommastelle |

Das Tagesarchiv wurde seit dem 24.08. nicht geschrieben, das Stundenarchiv am 26.08. um
00:49 — von der #85-Bereinigung. **Genau dort, wo die Reparatur eingegriffen hat,
verschieben sich Zahlen, und sonst nirgends.** Nachgeprüft: beide Archive enthalten keine
Teilkerze mehr.

### Nicht vergleichbar

`monatsende-kauf` lief zuletzt am 23.08. auf **191 Werten**, jetzt auf **2.874**. Jede
Differenz ist eine Folge der Datenmenge, kein Befund über die Strategie. Das Protokoll
steht, der Vergleich nicht.

## Die Aussicht — zum ersten Mal überhaupt

Bis zum 26.08. stand `aussicht` in **jedem** Protokoll auf `null` (#86: die Bedingung
fragte ein Feld ab, das es nie gab). Jetzt weist sie aus, wie viele Handelstage bis zu
einem Urteil fehlen — gerechnet gegen die Bonferroni-Schwelle (#91), nicht gegen t=2:

| Strategie | kleinste Aussicht (Tage) |
|---|---|
| **monatsende-kauf** | **187** |
| **kapitulation** | **224** |
| rsi2seit-mcp | 1.070 |
| monatswende-breit | 3.803 |
| rsi2seit | 4.116 |
| t3-stundendrift | 12.655 |
| quartalsschub-betrag | 13.257 |
| t2-umsatzschock | 17.317 |
| momentum | 33.683 |
| t1-zwangsglattstellung | 34.691 |
| `winkelbestaetigt`, `winkelgrad` | – (Punktschätzer nicht positiv) |

Die größte Einzelzahl: `momentum` Variante 3 bräuchte **562.398** Handelstage.

**Eine Warnung zu dieser Spalte.** Sie sagt, wann sich etwas *entscheiden* ließe — nicht,
ob es sich lohnt. `rsi2seit-mcp` verfehlt die Nachweisgrenze um 0,4 %, ist aber
**nach Handelskosten negativ** (je Signal +0,0526 Pp, netto −0,0474 Pp). Man kann Jahre
warten und am Ende bewiesen haben, dass eine Regel Geld kostet. „Fast signifikant" und
„fast profitabel" sind zwei verschiedene Dinge.

## Selbstprüfung

Der Placebo-Lauf liegt in **allen zwölf** Protokollen im Rahmen — auch bei den drei
Strategien, deren Kontrolltöpfe #88 berührt hätte. Warnungen: `A7` und `F4` bei
`monatsende-kauf`, `B2` bei `t1`, `t2` (zweimal) und `t3`.

## Zwei Dinge, die beim Messen schiefgingen

**Der Läufer hat die falschen zwölf gemessen.** Im Repo liegen 14 Dateien, davon sind
**elf** Strategien; `tageshilfen.js`, `test-tageshilfen.js` und `wertpapierart.js` sind
Hilfen. Die zwölfte, `monatsende-kauf.js`, liegt im **Datenordner** — der zweite Ort, den
`main.js:708` ausdrücklich kennt. `wertpapierart.js` wurde von der Maschine verweigert
(„Strategie ohne Begründung"), was die Sperrklinke im Feld bestätigt hat. Ohne diesen Fund
wären es elf gewesen, **und die Zahl zwölf hätte trotzdem gestimmt** — elf echte plus eine
verweigerte Hilfsdatei.

**Die erste Fassung dieser Auswertung verglich verschiedene Varianten miteinander.** Sie
nahm je Protokoll die Variante, die das Urteil trägt — sobald das Urteil wechselt, stehen
damit zwei verschiedene Varianten nebeneinander. Für `rsi2seit-mcp` kam so „t 2,01 → 1,72"
heraus; Variante gegen Variante sind es 1,74 → 1,72. Die Fassung in `vergleich.js`
vergleicht Variante *i* gegen Variante *i* und weigert sich, Protokolle mit
verschiedenem Universum zu vergleichen.

## Rechenweg

`vergleich.js` in diesem Ordner, `AUSGABE.md` ist seine Ausgabe, `laufzeiten.log` das
Protokoll des Laufs. Die Protokolle selbst liegen unter
`studien/messmaschine/protokolle/*-2026-08-26.json` und, byteweise gleich, im Datenordner
der App — von dort liest das Scoreboard, **ohne dass ein Release nötig wäre**.
