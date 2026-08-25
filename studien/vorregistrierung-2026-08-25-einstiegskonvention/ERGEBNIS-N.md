# Einstiegskonvention, Zweig N — Ergebnis, 25.08.2026

**Kein Urteil steigt.** Zwei Varianten sahen danach aus und gehen nach der vorregistrierten
Regel zurück in den Entdeckungsstapel. Vier unabhängige Gründe sprechen dagegen, sie für
einen Fund zu halten.

## Die Verschiebung, nach Ausstiegsart getrennt

| Strategie | Ausstieg | Verschiebung |
|---|---|---:|
| `t1-zwangsglattstellung` V2 | Zeit | **−0,1184 Pp** |
| `t1-zwangsglattstellung` V1 | Zeit | −0,0861 |
| `kapitulation` V2 | Zeit | −0,0305 |
| `t2-umsatzschock` V1 | Zeit | −0,0246 |
| `t1-zwangsglattstellung` V0 | Zeit | −0,0227 |
| `t3-stundendrift` V1 | Zeit | −0,0103 |
| `t2-umsatzschock` V0 | Zeit | −0,0109 |
| `t3-stundendrift` V0 | Zeit | −0,0061 |
| `rsi2seit` V0 | Zeit | −0,0020 |
| **`rsi2seit-mcp` V0…V4** | **Stop** | **+0,0007 … +0,0076** |

**Alle neun Zeit-Ausstiegs-Varianten fallen. Alle fünf Stop-Varianten steigen.** Das ist
kein Zufallsmuster, sondern ein Mechanismus.

## Warum die Stop-Varianten steigen — und warum das kein Ertrag ist

Der MCP-Stop lautet `Stop = Kaufkurs + (Höchstkurs − Kaufkurs) × MCP%`. Er hängt **am
Kaufkurs**. Verschiebt man den Einstieg auf die Eröffnung der Folgekerze, verschiebt sich
das Stopniveau mit — und damit **welche Trades wann ausgestoppt werden**.

Das ist nicht dieselbe Strategie mit anderer Füllung. Es ist eine andere Strategie.

Und genau deshalb deckt die Werkzeugprobe es nicht ab: Sie verlangt die geschlossene
Vorhersage `|Δ − L − Ê[L·r_offen]| ≤ 0,001 Pp` ausdrücklich **für jede
Zeit-Ausstiegs-Strategie**. Für Stop-Strategien gilt die Identität `Δ = −L(1+r_neu)`
nicht — die Sperre hat `rsi2seit-mcp` also nie geprüft.

## Die vier Gründe gegen den vermeintlichen Fund

`rsi2seit-mcp` V3 (t 2,00 → 2,63) und V4 (t 1,99 → 2,66) überschreiten die
Bonferroni-Schwelle von 2,576. Trotzdem ist es keiner:

1. **Die Vorregistrierung sagt es vorher.** *„Nach unten: alles. Nach oben: nichts."* Eine
   Strategie, deren korrigierter Wert vielversprechend aussieht, geht **zurück in den
   Entdeckungsstapel** und braucht frische Bestätigungstage. Und: Die 26 Varianten des
   Zweigs N *„erzeugen kein Urteil"* — berichtet werden Punktschätzer und Intervall, ohne
   Sterne.
2. **Die Werkzeugprobe deckt Stop-Strategien nicht ab** (siehe oben). Der Anstieg kommt aus
   einer Wechselwirkung, die nie validiert wurde.
3. **Die eigene Erwartung war negativ.** Die Strategiedatei schreibt vor der Messung:
   *„Der Stop kappt den rechten Schwanz … Die Erwartung ist also NEGATIV, und sie wird
   trotzdem gemessen."* Ein Umschlagen ins Positive gegen die eigene angemeldete Erwartung
   ist ein Warnsignal, kein Beleg.
4. **Die Testzahl ist zu klein gezählt (B8).** `rsi2seit-mcp` hat kein `testfamilie`-Feld,
   die Maschine zählt nur seine fünf Varianten → Schwelle 2,576. Es benutzt aber **dasselbe
   Einstiegssignal** wie `rsi2seit`, das ebenfalls gemessen wurde. Über sechs Tests wäre die
   Schwelle 2,638 — V3 (2,63) fiele darunter, V4 (2,66) bliebe knapp darüber. Und sechs ist
   selbst noch zu wenig gezählt.

Dazu, unabhängig von allem: **die Bestätigungshälfte ist verbraucht.** Sie wurde heute
mehrfach angesehen.

## Die Schutzvorhersage für `t1` ist gescheitert

| | vorhergesagt | gemessen |
|---|---|---|
| Überschuss | +0,08 bis +0,12 Pp | **−0,0272 Pp** |
| t | 1,6 bis 3,1 | **−0,42** |

Beides außerhalb. Die Vorhersage stützte sich darauf, dass `t1` zu 99,9 % auf der
Sitzungsgrenze feuert und die Übernachtlücke unter `folgeEroeffnung` die Handelsrendite
verlässt — `Var(Ü_neu) ≈ Var(Ü_alt) − Var(L)`. Die Richtung stimmte (der Überschuss fällt),
die **Größe und das Vorzeichen des Ergebnisses nicht**.

Das ist ein Fehlschlag des Modells hinter der Vorhersage, und er gehört benannt. Was hält,
ist die Entkopplung: Die Vorregistrierung schrieb ausdrücklich, `t1` sei **unabhängig vom
t-Wert** ungültig, weil seine Bestätigungshälfte verbraucht ist. Diese Begründung trägt
auch jetzt — sie hätte ebenso getragen, wenn `t1` bei t = 3 gelandet wäre. Genau dafür war
sie geschrieben.

## Was Zweig N geliefert hat

**Keine Kante.** Was er geliefert hat, ist eine Größenordnung: Die Einstiegskonvention
verschiebt gemessene Überschüsse um bis zu **0,12 Pp** — mehr als die Kostenhürde von
0,10 Pp und das Zweieinhalbfache der größten je sauber gemessenen Nettokante (0,047 Pp).

Bei `t1`, das fast ausschließlich auf der Schlusskerze feuert, war der gemessene
„Ertrag" also größtenteils eine Übernachtlücke, die niemand hätte handeln können.

**Folge:** Für Strategien, die auf der Sitzungsgrenze feuern, ist `folgeEroeffnung` die
ehrliche Konvention. Für Stop-Strategien ist der Wechsel **kein reiner Konventionswechsel**
und braucht eine eigene Vorregistrierung — er ändert, welche Trades ausgestoppt werden.

## Kandidat für den Entdeckungsstapel

`rsi2seit-mcp` V4 (MCP 10 %, +0,0671 Pp, 95-%-Intervall [+0,0176, +0,1165]) geht als
**Kandidat** in den Entdeckungsstapel — nicht als Fund. Was er bräuchte:

- eine eigene Vorregistrierung mit `testfamilie`, die `rsi2seit` mitzählt,
- eine Werkzeugprobe, die Stop-Strategien wirklich abdeckt,
- und **frische Bestätigungstage**. Die einzige unverbrauchte Hälfte ist die Zukunft.

Sein Intervall reicht von +0,018 bis +0,117 Pp. Die Kostenhürde liegt bei 0,10. Selbst im
günstigsten Fall wäre die Kante also knapp — das gehört zur Beurteilung dazu, bevor
jemand Aufwand hineinsteckt.
