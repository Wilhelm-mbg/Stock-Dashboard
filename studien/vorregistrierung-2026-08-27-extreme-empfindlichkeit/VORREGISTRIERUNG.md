# Vorregistrierung — Extreme-Empfindlichkeit: Verschieben die strittigen Hoch/Tief die gemessene Kante?

**Stand:** 27.08.2026 ~14:5x, vor jedem Rechenschritt. **Rolle:** Berechnungen.
**Auftrag:** PM (»die Frage, die die QS als ›Messung der Mess-Seite‹ abgegeben hat«).
QS-Befund als Ausgang (uebergabe/qs-audit-2026-08-27-1330-DRITTER-ZEUGE.md):
3,22 % der Reihen-Tage uneinig > 0,2 % auf Hoch/Tief, davon 5,4 % Skalen-Konvention →
**3,05 % echte Widersprüche**; das Tief doppelt so oft betroffen wie das Hoch; bei
Widerspruch hat jedes Archiv ~zur Hälfte recht; Schlüsse sauber.

## 0. Relevanz-Verengung (gemessen per Code-Durchsicht, vor dieser Registrierung)

Die Einstiegs-Zweige der belegten Strategien (reversionSignal, ENTRY rsi2seit /
kapitulation) lesen **nur Schlusskurse**. Hoch/Tief liest im Messpfad genau eine
belegte Strategie: **rsi2seit-mcp** — stopNiveau aus `abgeschlossen[k].hoch`
(rsi2seit-mcp.js:46–51), Stopp-Ausführung gegen `p.tief` (messmaschine.js:545).
**Die Frage lautet damit konkret: Verschieben die strittigen Extreme das
rsi2seit-mcp-Messergebnis?** kapitulation (Ende-zu-Ende schlusskurs-blind) läuft als
**Negativkontrolle** mit: ihr Δ muss ≈ 0 sein, sonst ist das Geschirr kaputt.

## 1. Anordnung (Docht-Muster, gepaart)

- **Arm A:** archiv60m unverändert. **Arm B:** Kopie, in der auf strittigen Tagen
  die Extremträger-Kerzen docht-neutralisiert sind.
- **Strittiger Tag** (je Reihe, lokal aus beiden Archiven, QS-Kriterien):
  Tages-Hoch bzw. -Tief aus 60m-Aggregation weicht vom archiv1d-Wert um > 0,2 % ab,
  UND der Tag ist kein Skalen-Fall (h-, l-, c-Verhältnis einheitlich ±1 % und fern
  der 1 um > 1 % → Skala, ausgenommen — die 17 Zensus-Reihen erledigen sich damit
  je Tag von selbst).
- **Neutralisierung chirurgisch:** Nur auf der abweichenden Seite, nur die
  Stundenkerze(n), die das Tagesextrem tragen: strittiges Hoch → H := max(O, C)
  dieser Kerze; strittiges Tief → T := min(O, C). Alles andere bleibt.
- **Lesart:** Der A/B-Unterschied ist eine **Obergrenze** des Einflusses der
  strittigen Extreme (die Neutralisierung entfernt auf diesen Kerzen auch echte
  Docht-Information; ~die Hälfte der strittigen Tage hat ohnehin das 1d falsch).
- Beide Arme: identischer Archivstand, identische Maschine, je ein messe()-Lauf
  rsi2seit-mcp und kapitulation (4 Läufe, Kinderprozesse wie Docht-Studie).

## 2. Maßstab (identisch zur Docht-Studie, vorab)

**»Verschiebt« = tragender Urteilswechsel** (Wechsel über eine Belegt/Widerlegt-
Grenze, nicht das dokumentierte Randflackern nicht-entscheidbar↔nicht-bestätigt an
Margen unter delta80) **ODER |Δ Bestätigungs-Überschuss| ≥ delta80_A** der jeweiligen
Variante. Alles darunter = »verschiebt nicht messbar«. Negativkontrolle kapitulation:
|Δ| < ¼·delta80_A erwartet; darüber ist der LAUF ungültig (nicht die These belegt).

## 3. Machbarkeit (Sperre, bestanden)

Dasselbe A/B-Muster lief heute Nacht als Docht-Studie in ~20 Minuten (6 Läufe);
hier sind es 4. Plattenplatz für eine zweite 60m-Kopie war vorhanden. delta80 der
betroffenen Variante(n) liegt aus der Docht-Studie vor (rsi2seit-mcp ~0,08 Pp;
Δ dort ~0,006). Kein Sperrfall.

## 4. Gesehene Zahlen — deklariert

QS-Zensus-Zahlen (3,22 %/5,4 %/17 Reihen, p50/p90/p99 der Abweichungen, Tief:Hoch
≈ 2,3:1), Docht-Studien-Ergebnis (alle drei »hebt sich auf«), rsi2seit-mcp-
Randflackern. **Nicht gesehen: irgendein A/B-Wert dieser Anordnung.** Erwartung
ausdrücklich offen — die Docht-Studie entfernte GANZE Nullumsatz-Kerzen (0,52 %),
hier werden gezielt strittige Extreme auf ~3 % der Tage entfernt, die der Stopp-Pfad
direkt liest; ein anderes Ergebnis als »hebt sich auf« wäre NICHT überraschend.

## 5. Sperrliste

Kein Kanten-Urteil (Empfindlichkeitsmessung) · keine Archiv-Reparatur, keine
Kerzen-Korrektur am Original · kein Urteil über Strategien außerhalb der zwei
gemessenen · Ergebnis nur in diesen Ordner · Stopp-REGEL-Änderungen (z. B. »Stopp
auf Schluss statt Tief«) wären ein eigener Vorschlag an den PM, niemals Teil dieses
Laufs.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
