# Vorregistrierung „Kapitulations-Dip", 24.08.2026

Geschrieben **vor** jeder Messung. Der Zeitstempel dieses Commits ist der Beleg.

## Warum diese Messung

Der Kapitulations-Dip ist die einzige Kante, die das Depot **tatsächlich handelt**
(`kapiZusatz: true` im gespeicherten Zustand) und die mit der Messmaschine **nie
gemessen wurde**. Er stammt aus der Bedingungsstudie vom 21.08.2026 — vor A6, vor A7,
vor der Testfamilien-Zählung.

Die Zahl, die im Code steht: *Median +0,44 % je Trade nach 10 Bp Kosten, 26
Handelsstunden Horizont, t = 4,62, 98 von 154 Werten positiv, beide Hälften positiv.*

## Was diese Messung anders macht als die Studie von damals

Das ist kein Nachrechnen, sondern eine **strengere** Frage. Vier Unterschiede, alle
in Richtung „schwerer zu bestehen":

| | damals | jetzt |
|---|---|---|
| Streuung geclustert über | **Symbole** (t = 4,62) | **Handelstage** — Symbole an einem Tag bewegen sich gemeinsam, das ist keine unabhängige Wiederholung |
| Vergleichsmaßstab | Drift-Basislinie | **gepaarte Kontrolle**, Erwartung desselben Symbols zur selben UTC-Stunde |
| Kontrolle | enthielt, was das Signal las | **A7**: ohne die 261 gelesenen Kerzen |
| Urteil | über die volle Historie | nur auf der **zurückgehaltenen** zweiten Hälfte |

Es wäre kein Widerspruch, wenn dabei weniger herauskommt. Es wäre der Normalfall.

## Was live wirklich läuft — nachgelesen, nicht angenommen

Genau hier ist dieses Projekt schon viermal danebengelegen. Der Live-Aufruf steht in
`depot.js:3550`:

```js
Q.einstiegSignal(sigBars, sigBars.length - 1, {
  ENTRY: 'kapitulation', LINE: cfg.lineType || 'ema', period: cfg.period || 20,
  confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0,
  CHAN: false, MTF: false, TREND: false
});
```

Mit dem **gespeicherten** Zustand (`lineType: 'ema'`, `period: 20`, `confirmBps: 15`):

- **ZTHR = 2,0.** `zOf(15)` liefert 2,0, nicht 1,5. Für `kapitulation` ist das
  entscheidend — anders als bei `rsi2seit`, wo ZTHR gar nicht in den Auslöser eingeht.
- **Haltedauer 26 Kerzen.** `maxHoldMin: kapiTrade ? 1560 : …` (`depot.js:3835`), und
  der Ausstieg zählt **fertige Kerzen**, nicht Wanduhrzeit (`depot.js:3397-3407`).
  1560 Min / 60 = 26.
- **261 Kerzen Vorlauf**, identisch zur Maschine (`depot.js:3355`).
- Gemessen wird über **`quant.js` selbst**, keine Nachbildung (Fehlertyp D1).

## Familie und Schwelle

- Name: `kapitulation-2026-08-24`, **3 Tests**
- Bonferroni-Schwelle für |t|: **2,39** (zweiseitig, α = 0,05, 3 Tests)
- `leseFensterKerzen: 261` → A7 aktiv
- Haltedauer 26 Kerzen, Richtung long, Spanne 2 × 5 Bp

## Die drei Tests

**V0 — nur der Auslöser.** Die Frage: Trägt das Signal überhaupt? Ohne jedes Tor, auf
allen 191 Aktien des Archivs.

**V1 — + handelbares Universum.** Live verlangt `minDollarVol: 50`, also 50 Mio $
Tagesumsatz. Nachgebildet als **nachlaufender** Durchschnitt über die letzten 20
Handelstage — live rechnet den Durchschnitt über das ganze geholte Fenster, was für
ein historisches Signal ein Blick nach vorn wäre. Die Messung ist hier also strenger
als die App.

**V2 — + Regime-Tor.** Live pausiert der Kapitulations-Dip, wenn SPY **über** seiner
EMA200 liegt (`depot.js:3586`). SPY liegt nicht im 60m-Archiv; nachgebildet wird über
`drift_markt.reihe` (Tagesreihe, 8.448 Einträge) mit EMA29 — 200 Stundenkerzen sind
rund 28,6 Handelstage. **Das ist ausdrücklich eine Nachbildung** (D1) und steht so im
Protokoll. Sie kann die Live-Bedingung nicht exakt treffen.

## Erwartung, vor der Messung

**Der Auslöser überlebt die gepaarte Kontrolle wahrscheinlich nicht.** Grund: Das
Signal kauft nach einem Abverkauf im Abwärtskanal — dieselbe Auswahlrichtung wie
`rsi2seit`, das mit A7 auf +0,0277 Pp bei t = 0,30 kommt, und wie T1, das bei
−0,10 Pp je Signal landet.

Es gibt aber einen Unterschied, der für ihn spricht: **26 Kerzen statt 8.** Die
Kostenhürde ist fix je Umlauf, ein persistenter Effekt wächst mit der Haltedauer. Von
allem, was hier bisher gemessen wurde, hat er die günstigste Bauart.

Der dokumentierte Schwanz-Befund („ohne die besten 5 % fällt das Mittel unter die
Basislinie") wird **nicht** als Ausschlussgrund benutzt — nachträgliches Weglassen
verbietet B7. Er wird als Kennzahl mitberichtet.

## Abbruchregeln

- Keine weiteren Varianten nach dem ersten Blick auf die Zahlen.
- Kein Wechsel der Haltedauer, wenn 26 nicht trägt. Wer 8, 13 und 40 nachschiebt,
  hat vier Tests gemacht und drei verschwiegen.
- Trägt der Auslöser, ist er damit **nicht** freigegeben: Es folgen die Kostenrechnung
  gegen das reale Produkt und eine Eichung gegen Nullarchive.
- Trägt er nicht, wird der Live-Handel **nicht** eigenmächtig abgeschaltet. Das ist
  Wilhelms Entscheidung; die Messung liefert die Grundlage, nicht das Urteil darüber.
