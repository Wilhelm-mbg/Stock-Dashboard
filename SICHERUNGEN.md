# Die aktiven Sicherungen

Stand 25.08.2026, aus dem Quelltext zusammengetragen — nicht aus dem Gedächtnis.
Alles hier betrifft die **Simulation mit virtuellem Kapital**, keine Anlageberatung.

> **Warum es diese Liste gibt.** An einem einzigen Tag kamen drei Befunde zusammen: eine
> Sicherung, die nur auf dem Papier existierte (`edgePauseKapi` wurde gelesen und nie
> geschrieben), eine, die sich abschalten aber nicht wieder einschalten ließ, und eine, die
> sechsmal von sechs Mal falschen Alarm schlug. Keiner davon fiel im Betrieb auf — eine
> abgeschaltete Sicherung sieht im Programm genauso aus wie eine wachsame.
> Diese Liste ist die Gegenmaßnahme: **Was schützt, steht aufgeschrieben und lässt sich
> nachzählen.**

---

## 1. Vier Ebenen, die oft verwechselt werden

Sie greifen an völlig verschiedenen Stellen. Das ist keine Wortklauberei — wer sie
verwechselt, hält sich für geschützt, wo er es nicht ist.

| Ebene | reagiert auf | schließt | Reichweite |
|---|---|---|---|
| **Stop / Ziel** | den **Kurs** | diese eine Position | ein Trade |
| **Kill-Switch** | **Geld** (Tagesverlust) | **alles sofort**, Ruhe bis Handelsende | das ganze Depot |
| **Edge-Wächter** | die **Belege** (gemessene Kante) | **nichts** | neue Einstiege einer Regel |
| **Einstiegssperren** | Marktlage, Risiko, Datenlage | **nichts** | das einzelne Signal |

---

## 2. Was Positionen schließt

### Stop und Ziel je Position
`sl −25 %`, `tp +35 %` (Vorgabe). Wirkt auf die einzelne Position, kursbasiert.
Die Messmaschine kennt das als `stopNiveau` und hat eigene Fehlertypen dafür (**C6, C7**) —
ein Ausstieg, der live anders füllt als in der Messung, hat schon einmal aus `t = 5,96`
ein `t = −0,75` gemacht.

### Kill-Switch: Tagesverlust
Bei **−5 %** vom Tagesstartwert wird **alles sofort glattgestellt** und der Handel ruht bis
Handelsende. Bewusst rein deterministisch — keine KI, kein Ermessen, kein Netzwerk.

*Vorgeschichte:* Das Limit bremste ursprünglich nur das Neugeschäft; offene Positionen
liefen beliebig tief darunter weiter. Es war eine Bremse, kein Kapitalschutz.

---

## 3. Was neue Einstiege verhindert

### Risikogrenzen (`risiko.js`)
| | Vorgabe |
|---|---|
| Positionslimit | 8 gleichzeitig |
| Tagesverlust | −5 % |
| Exposure in Scheinen | 40 % |

Fehlt eine dieser Zahlen, wird **nicht** eröffnet — im Zweifel nein. Ein Tippfehler im
Feldnamen soll keinen Handel auslösen.

### Edge-Wächter (je Arm getrennt)
Misst jede Nacht die Kante über ein rollendes 120-Tage-Fenster neu. Zwei Messungen mit
**bedeutsamem** Rückgang (t ≤ −1) und **echter neuer Messbasis** setzen neue Einstiege
dieses Arms aus. Offene Positionen laufen normal weiter, das Schattenbuch misst weiter,
eine positive Messung hebt die Pause von selbst auf.

- **Je Arm eigen** (`edgePause`, `edgePauseKapi`) — die Arme haben verschiedene
  Haltedauern und Regime; eine gemeinsame Pause legte den gesunden Arm mit still.
- **Von Hand übersteuerbar** (`edgePauseHand`) — die Entscheidung wird dauerhaft
  respektiert und nie automatisch angefasst. Sie steht dann sichtbar im Warnband und
  lässt sich dort zurücknehmen.
- **Wichtig:** Der Wächter ist ein **Aufsatz außerhalb der gemessenen Strategie.** Was
  gemessen wurde, ist die Regel *ohne* ihn. Was er kostet, ist nie gemessen worden — die
  Messmaschine kann ihn derzeit nicht ausdrücken, weil sie Trades misst und nicht
  Erlaubnisse.

### Regime-Zuteilung
Jede Kante nur in ihrem gemessenen Regime (belegt, `t = 3,2`):
- **RSI(2) im Seitwärtskanal** pausiert, wenn der S&P 500 unter der 200er-Linie steht.
- **Kapitulations-Dip** pausiert, wenn er darüber steht.

### Handelspause der Marktlage
Passt kein Setup („weder Trend noch Wellen"), wird bis zur nächsten stündlichen Prüfung
nichts Neues eröffnet. **Gilt ausdrücklich nicht für `rsi2seit` und `kapitulation`** — die
beiden haben ihr eigenes, gemessenes Regime-Gate und handeln durch.

### Klumpen-Deckel
- **Richtung:** höchstens 8 gleichgerichtete offene Positionen. *Zehn gleichgerichtete
  Trades sind eine Wette, zehnmal.*
- **Sektor:** eigener Deckel für Halbleiter (Stichtagsliste vom 22.08.2026 — eine
  **Setzung**, keine Messung, aber sie schreibt Schatten und ist damit überprüfbar).

### Takt und Menge
Cooldown 120 Minuten je Symbol („Straßenbahn-Regel"), höchstens 10 Einstiege je Tag,
Meide-Stunden, Zeitfenster.

### Event-Blackout
Vor Terminen (Quartalszahlen u. ä.) wird nicht eröffnet. Steht auf `block`.

### Datenlage
- **Kursdaten veraltet** — eine Kerze älter als das Dreifache ihrer Länge sperrt.
- **Kursquelle gestört** — keine frische Bewertung, kein Einstieg. Nach zwei Scans ohne
  Daten kommt eine Meldung.
- **Kursreihe zu kurz**, **Liquiditätsfilter** (Mindestumsatz 50 Mio $).

### Gesperrte Symbole
Wer wiederholt Verluste bringt, wird gesperrt (`symBlock`); von Hand gesetzte Sperren
bleiben stehen.

### Gemessene Einschränkungen
- **Put-Seite trägt nicht** — RSI(2) im Seitwärtskanal handelt nur Long. Gemessen:
  Put-Bein −0,099 % je Trade gegen +0,075 % auf der Call-Seite.
- **Kosten-Check** — deckt die erwartete Bewegung die Kosten nicht, wird nicht gehandelt.

---

## 4. Sicherungen außerhalb des Handels

| | |
|---|---|
| **Store-Sicherung** | Zwei Generationen Sicherungskopien des Depotstands (`.bak1`, `.bak2`) |
| **Speicher-Prüfung** | `save()` prüft sein Ergebnis und meldet Fehlschläge, statt still zu scheitern |
| **Ausfall-Wächter** | Fällt der Edge-Wächter selbst aus, wird das laut gemeldet — mit ihm fiele eine schützende Handlung aus |
| **Archiv-Rückschreibung** | Ein gescheitertes Schreiben wird gemeldet und beim nächsten Mal erneut versucht |

---

## 5. Wie man prüft, dass eine Sicherung wirklich lebt

Aus den drei Befunden vom 25.08.2026 sind drei Wachhunde geworden, die diese
Fehlerklassen abfangen:

| Abschnitt in `test-v6.js` | fängt |
|---|---|
| **48 — Toter Schutz** | Ein Zustandsfeld, das *ohne Vorgabewert* gelesen und nie geschrieben wird. Dann heißt `undefined` still „nein" |
| **49 — Einwegschalter** | Eine Sicherung, die sich abschalten, aber nicht wieder einschalten lässt — und deren Knopf einen Zuhörer hat, nicht nur Beschriftung |
| **51 — Eichung** | Die Auslöseregel wird gegen die **echten** Messungen gefahren, die sie zum Fehlalarm gebracht haben |

**Die Lehre in einem Satz:** Eine Sicherung, die dauernd falschen Alarm schlägt, wird
abgeschaltet — und ist dann schlechter als keine. Kalibrierung ist Teil des Schutzes,
nicht Kosmetik.

---

## 6. Was hier bewusst **nicht** steht

Diese Liste zählt auf, was **schützt**. Sie sagt nichts darüber, ob die Strategien
**funktionieren**. Der Belegstand steht getrennt davon — und er lautet derzeit:
**null belegte Kanten.** Momentum und Ergebnis-Drift stehen beide auf *nicht
entscheidbar*; nicht widerlegt, aber unbelegt.

Sicherungen ersetzen keinen Beleg. Sie begrenzen den Schaden, wenn keiner da ist.
