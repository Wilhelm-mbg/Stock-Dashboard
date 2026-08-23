# Vorregistrierung „Eigenbau", 23.08.2026

Geschrieben **vor** jeder Messung. Wer nachträglich etwas ändert, ändert eine
Datei mit Zeitstempel im Git — das ist der ganze Zweck.

## Warum überhaupt noch eine Suche

Am selben Tag hat die große Signalstudie 3.372 Tests gefahren und **0 von 51**
Kandidaten bestätigt, und die vier bisher als „belegt" geführten Kanten sind an der
gepaarten Kontrolle gescheitert. Die naheliegende Antwort wäre, aufzuhören.

Der Grund, es trotzdem zu versuchen, ist ein anderer als vorher: Alle bisherigen
Kandidaten waren **Preismuster** — RSI, Kanäle, Winkel, Formationen. Ein Preismuster
sagt nicht, *wer* handeln muss. Diese Vorregistrierung enthält nur Thesen, bei denen
sich die Frage „wer muss hier handeln, und warum?" mit einem Satz beantworten lässt,
der nichts mit dem Chart zu tun hat.

Die Erfolgsaussicht bleibt niedrig. Das ist keine Bescheidenheitsformel, sondern die
gemessene Grundrate dieses Projekts.

## Familie und Schwelle

- Name: `eigenbau-2026-08-23`
- **7 Tests** insgesamt, über drei Dateien
- Bonferroni-Schwelle für |t|: **2,69** (zweiseitig, α = 0,05, 7 Tests)
- Die Maschine rechnet ab heute mit `testfamilie.testsGesamt`, damit die Schwelle
  nicht pro Datei zurückfällt (Fehlertyp B8, heute ergänzt)

Ein Kandidat gilt nur dann als bestätigt, wenn auf der **zurückgehaltenen zweiten
Hälfte** der Handelstage gilt: Überschuss über der Kontrolle > MDE **und** |t| > 2,69.

## Was NICHT registriert wird, und warum

**Quartalsende-Fensterputzen** (Fondsmanager verkaufen Verlierer vor dem Stichtag,
weil sie im Bericht schlecht aussehen). Mechanisch die stärkste These der Liste.
Sie wird **nicht** getestet, weil die Zahl der Bestätigungstage vorab feststeht:
11 Quartalsenden im Archiv, davon etwa 5 in der Bestätigungshälfte, mal 4 Handelstage
= rund 20 Tage. Die Maschine verlangt 30. Das Urteil stünde also vor der Messung fest
(`nicht-messbar`), und der Test würde nur die Schwelle für die anderen verschärfen.
**Erst nachprüfbar, wenn das Archiv 6+ Jahre umfasst.**

**Übernacht-Prämie unbedingt** („der Ertrag entsteht über Nacht"). Nicht messbar in
diesem Aufbau, und zwar aus einem strukturellen Grund, der es wert ist, notiert zu
werden: Die Kontrolle ist die Erwartung **desselben Symbols zur selben UTC-Stunde**.
Ein Signal, das immer zur selben Stunde feuert, wird gegen genau diese Erwartung
gemessen — der Überschuss ist dann per Konstruktion null. Zeitfenster-Effekte sind
mit dieser Kontrolle nicht prüfbar, nur **bedingte** Effekte innerhalb des Fensters.
Deshalb sind T1 und T3 unten bedingt formuliert.

---

## T1 — Übernacht nach Zwangsglattstellung

**Wer muss handeln.** Wer mit Hebel innerhalb des Tages handelt, muss vor
Börsenschluss glattstellen: Übernachtfinanzierung, Margin, interne Risikolimits. An
Tagen mit starkem Verlust ist dieser Zwang am größten — Nachschussforderungen und
Stop-Kaskaden treffen zusammen, und beide fragen nicht nach dem Preis. Das Angebot in
der Schlussstunde ist dann zu einem erheblichen Teil erzwungen und nicht
informationsgetrieben. Wer über Nacht die Gegenseite nimmt, stellt Kapital genau dann
bereit, wenn es sonst niemand stellt, und sollte dafür bezahlt werden.

**Signal.** Letzte Kerze der Sitzung (erkannt an der Tages-Anfangsstunde: 13 → letzte
ist 19, 14 → letzte ist 20; beides aus `bars[0..i]`) **und** Tagesrendite
≤ −k × (Standardabweichung der Tagesrenditen der letzten 60 Handelstage).

**Halten:** 1 Kerze. Einstieg zum Schluss, Ausstieg zum Schluss der ersten Stunde des
Folgetages. Kein Auktionspreis — das wäre nicht handelbar.

**Varianten (3 Tests):** k ∈ {1,5 · 2,0 · 2,5}

**Erwartung.** Positiv, aber knapp. Die Kostenhürde von 0,10 Pp (2 × 5 Bp) liegt auf
einer einzigen Nacht. Es gibt eine Überschneidung mit dem Kapitulations-Dip, die im
Bericht ausgewiesen werden muss.

## T2 — Umsatzschock, der aufhört

**Wer muss handeln.** Ein Verkäufer, dessen Position größer ist als der übliche
Stundenumsatz, muss für Sofortigkeit zahlen — er kann nicht warten, sonst bewegt er
den Kurs gegen sich. Die Signatur ist ein Umsatzausschlag zusammen mit einem
Kursrückgang. Wer die Gegenseite nimmt, kassiert die Prämie für Sofortigkeit.

**Das Problem und seine Lösung.** Ein Umsatzausschlag mit Kursrückgang sieht bei
einer echten Nachricht genauso aus. Ohne Nachrichtenquelle braucht es ein anderes
Unterscheidungsmerkmal: Bei einer Nachricht läuft der Kurs weiter, bei reinem
Liquiditätsbedarf hört er auf zu fallen, sobald der Verkäufer fertig ist. Deshalb
wird **nicht** in den Rückgang hinein gekauft, sondern erst in der Kerze **danach**,
und nur, wenn diese nicht weiter verloren hat.

**Signal.** Kerze i−1: Umsatz ≥ k × Median-Umsatz derselben UTC-Stunde der letzten
60 Handelstage **und** Rendite ≤ −1 Standardabweichung (60 Kerzen).
Kerze i (Einstieg): Rendite ≥ 0.

**Halten:** 8 Kerzen (rund 1,3 Handelstage).

**Varianten (2 Tests):** k ∈ {3 · 5}

**Erwartung.** Unklar. Das ist die These mit der sauberen Mechanik und dem
schwächsten Beleg, dass sich der Liquiditätsbedarf von der Nachricht trennen lässt.

## T3 — Trägt die jüngste Stunden-Drift eines Werts?

**Warum diese These überhaupt.** Der heutige Befund war, dass rund zwei Drittel des
Rohvorteils aller geprüften Kanten schlichtes **Halten** sind — nicht das Signal.
Wenn Halten den Ertrag trägt, ist die entscheidende Frage nicht „welches Signal",
sondern „**welches Halten**". Diese These prüft, ob die stundenspezifische Drift eines
Werts überhaupt fortbesteht.

**Wer muss handeln.** Hier niemand — und das ist der Punkt. Die These hat bewusst
**keine** Zwangsgeschichte. Sie ist ein Messgerät, kein Handelsvorschlag: Kommt sie
durch, ist Halten steuerbar und alle bisherigen Ergebnisse müssen unter dieser
Frage neu gelesen werden. Kommt sie nicht durch, ist der Basisertrag Rauschen um
einen Marktmittelwert, und jeder Versuch, ihn per Auswahl zu heben, ist vergeblich.
**Das ist das nützlichere der beiden Ergebnisse.**

**Warum das nicht tautologisch ist.** Die Kontrolle ist der Mittelwert des Symbols
zu dieser Stunde über die **ganze Hälfte**. Das Signal benutzt ein **rollendes
Fenster** der letzten 60 Vorkommen. Ist die Drift konstant, heben sich beide auf und
der Überschuss ist null. Nur wenn die Drift *zeitlich schwankt und fortbesteht*,
entsteht ein Überschuss.

**Signal.** Mittlere Rendite dieses Symbols zu dieser UTC-Stunde über die letzten
60 Vorkommen ≥ k × deren Standardfehler → long.

**Halten:** 1 Kerze.

**Varianten (2 Tests):** k ∈ {1,0 · 2,0}

**Erwartung.** Negativ. Wenn es anders wäre, hätte die Kursreihe ein Gedächtnis auf
Stundenebene, und das wäre der auffälligste Befund des Projekts.

---

## Abbruchregeln

- Kein nachträgliches Weglassen von Werten, Zeiträumen oder Varianten (B7).
- Keine Umdeutung eines `nicht-bestätigt` in „vielversprechend".
- Kommt ein Kandidat durch, ist er damit **nicht** handelbar — es folgt die
  Kostenrechnung gegen das Produkt und eine zweite Messung auf frischen Tagen.
