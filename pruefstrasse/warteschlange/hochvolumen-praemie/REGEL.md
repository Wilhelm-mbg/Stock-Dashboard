# High-Volume Return Premium, long (Ideen-Agent, 11.10.2026, dritter Lauf)

Eine Aktie, deren **Dollarumsatz an einem Tag ungewöhnlich hoch** ist (unter den obersten 10 % der letzten 50 Handelstage),
läuft in den folgenden zehn bis zwanzig Handelstagen besser als vergleichbare Aktien — unabhängig davon, ob der Kurs an dem
Tag stieg oder fiel. Erklärung der Autoren: der Umsatzschub macht die Aktie sichtbar (Mertons Investor-Recognition), neue
Käufer kommen nach. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Regel (Prosa)

1. **Dollarumsatz** je Tag = Schluss × Stückumsatz. Fundstelle: GKM (2001) S. 5, Fn. 9 („we approximate the daily dollar volume by
   multiplying the share volume by the last trading price").
2. **Fenster:** der Tag i und die **49 Handelstage davor** (i−49 … i−1, „reference period"), zusammen 50 Tage. Fundstelle: GKM S. 4–5,
   Abb. 2 („49 days" Referenz, „1 day" Bildung).
3. **Signal am Tag i (long):** der Dollarumsatz von Tag i hat im Fenster **Rang ≥ 46 von 50** (Rang = 1 + Zahl der Referenztage mit
   kleinerem Umsatz), also gehört er zu den obersten 10 %. Fundstelle: GKM Gl. (2), „H, if Ψ ≥ 46".
4. **Filter:** jeder der 50 Tage hat Schluss und Umsatz (sonst fällt das Fenster weg, GKM Fn. 7); der Schluss lag an keinem der 49
   Referenztage unter **5 $** (GKM S. 4: „stocks whose price fell below $5 … in the first 49 days"). Die übrigen GKM-Filter (Fusion,
   Delisting, Kapitalerhöhung im Vorjahr; mindestens ein Jahr Notiz) sind mit der Sicht nicht abbildbar und entfallen; die
   Prüfstraße zählt Abgänge selbst getrennt.
5. **Einstieg:** Eröffnung des Tages nach dem Signal (Form `tag` ohne `bestaetigt`); GKM messen ab dem Schluss des Bildungstags —
   die Einstiegslücke weist die Prüfstraße als Gegenprobe „Einstieg einen Tag später" aus. Cooldown 5 Tage setzt der Adapter.
6. **Ausstieg:** Eröffnung des ersten Handelstags ≥ Einstieg + 10 bzw. + 20 (zwei Konfigurationen). Fundstelle: GKM Tabelle 2, Horizonte
   t = 10 und t = 20 Tage. Der dritte Horizont der Quelle (t = 1) entfällt: dort liegt die Long-Seite bei +0,06 bis +0,12 Pp, unter dem
   Dreifachen der Kassa-Hürde jeder Klasse (Auftragsregel 2).
7. **Umsatzklassen 1–3** (ab 50 Mio $ Tagesumsatz). Klasse 0 (5–50 Mio $) entfällt: die Quelle nennt für Kleinwerte +0,45 Pp bei 20 Tagen,
   unter 3 × 0,157 = 0,47 Pp.

GKM bilden die Portfolios nur an jedem 51. Tag (nicht überlappende Intervalle) — eine Wahl für ihre Teststatistik, nicht Teil der
Regel. Die Tag-Form prüft jeden Tag und rechnet die Überlappung mit Hansen-Hodrick heraus.

## Parameter (alle aus der Quelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Fenster | 50 Handelstage (49 Referenz + 1 Bildung) | GKM S. 4, Abb. 2 |
| Schwelle | Rang ≥ 46 von 50 (oberste 10 %) | GKM Gl. (2) |
| Umsatzmaß | Dollarumsatz = Schluss × Stück | GKM Fn. 9 |
| Mindestkurs | 5 $ im Referenzzeitraum | GKM S. 4, Fn. 8 |
| Haltedauern | 10 und 20 Handelstage | GKM Tabelle 2 |
| Richtung | long (die Low-Volume-Short-Seite ist nicht handelbar, Leihe nicht gemessen) | — |

## Beleg

- **Regel und Größe:** Gervais, Kaniel & Mingelgrin, „The High-Volume Return Premium", *Journal of Finance* 56(3) (2001) 877–919;
  Arbeitspapier https://rodneywhitecenter.wharton.upenn.edu/wp-content/uploads/2014/04/9901.pdf (abgerufen 2026-10-11).
  NYSE 1963–1996, Tabelle 2, Long-Seite gegen das Referenzportfolio derselben Größenklasse („Reference Returns, High Volume"):

  | Größenklasse | 1 Tag | 10 Tage | 20 Tage |
  |---|---:|---:|---:|
  | groß (Dezil 9–10) | +0,06 (t 2,78) | **+0,18** (t 3,23) | **+0,29** (t 3,80) |
  | mittel (Dezil 6–8) | +0,12 (t 4,42) | **+0,26** (t 3,68) | **+0,41** (t 4,36) |
  | klein (Dezil 2–5) | +0,12 (t 2,54) | +0,28 (t 2,21) | +0,45 (t 2,65) |

  Brutto-Beleg; nach der Auftragsregel genügt er, weil er das Dreifache der Kassa-Hürde je Umlauf erreicht: Klasse ab1000
  3 × 0,045 = 0,135 (groß: 0,18 / 0,29 ✓), 250-1000 3 × 0,065 = 0,195 (mittel: 0,26 / 0,41 ✓), 50-250 3 × 0,085 = 0,256
  (mittel/klein: 0,26–0,28 / 0,41–0,45 ✓, bei 10 Tagen knapp). Die Kosten rechnet die Prüfstraße selbst.
- **Nach 2010 bestätigt (Existenz, nicht die Größe in liquiden US-Werten nach 2016):** Kaniel, Ozoguz & Starks, „The high volume return
  premium: Cross-country evidence", *JFE* 103(2) (2012) 255–279, https://ideas.repec.org/a/eee/jfinec/v103y2012i2p255-279.html — Prämie
  in 41 Ländern, nicht durch Risiko oder Liquidität erklärt. Wang, „The high volume return premium and economic fundamentals", *JFE* 140(1)
  (2021) 325–345, https://ideas.repec.org/a/eee/jfinec/v140y2021i1p325-345.html — US-Prämie, durch Faktor- und Fehlbewertungsmodelle
  nicht erklärt. Kang, „Enhancing the High-Volume Return Premium" (SSRN 4934371, 2024; Zusammenfassung bei Quantpedia), Rücktest
  1964–2022. Alle abgerufen 2026-10-11. **Vorbehalt:** die Volltexte dieser drei waren nicht frei lesbar; ihre US-Größen nach 2010
  sind hier nicht belegt. Die Parameter stammen deshalb allein aus GKM.

## Wogegen geprüft (Regel 1)

- `pruefstrasse/register.json`: existiert noch nicht. `pruefstrasse/warteschlange/`: nur `donchian20-ausbruch-long`. Zweig
  `pruefstrasse-ergebnisse`: existiert auf origin nicht. Zweig `pruefstrasse-ideen`: `trendfaktor-gleitende-mittel` und
  `kurzfrist-momentum-umschlag` (beide verworfen, `ideen-verworfen.md`) — keine Umsatzregel in Tag-Form.
- `wiki/belegstand.md`: nächstverwandt ist **K4 „Umsatzschock mit Richtung"** (Querschnitt 15.09.2026): Umsatz(Tag)/Median(60) **×
  Vorzeichen der Tagesrendite**, Top-Dezil gegen Universum, Woche −0,17 Pp (t −2,36), Monat −0,45 (t −1,65), MDE₈₀ dort 11,6–23,5 % p. a.
  Unterschied: K4 ist gerichtet (hoher Umsatz **an Aufwärtstagen**) und ein Querschnittsrang; die HVRP ist richtungslos (GKM zeigen,
  dass sie von der Tagesrendite unabhängig ist), misst den Rang im eigenen 50-Tage-Fenster und läuft als Ereignis mit Tagescluster —
  andere Regel, andere Auflösung. K4 ist ein Warnsignal für die Größe (die Hälfte der HVRP-Ereignisse sind K4-Fälle), deshalb liegt
  die eigene Erwartung bei 0 bis +0,2 Pp.
- Weiter verwandt, aber verschieden: Kapitulation (Volumen + Kursrutsch, 60m), Nachzügler (Ereignis bei Aktie A, Rendite von B),
  Ergebnis-Drift (Quartalszahlen), Signalstudie (51 Detektoren auf Minuten-/60m-Basis), Kurzfrist-Umkehr 5 Tage, Momentum,
  Trendkanal. `ideen-verworfen.md`: Jiang & Zhu (Sprünge), Medhat & Schmeling (Umschlag × Vormonatsrendite) — beide nicht diese Regel.

## Machbarkeit vor der Auflösungswand (Regel 3)

- **Signaltage:** Entdeckung 2016-01 bis 2022-12 ≈ **1.735 Handelstage** (kalibrierung.json `entNTage`); an praktisch jedem Tag
  feuern Werte. **Trades:** ≈ 1.300 Reihen je Tag in den Klassen 1–3 × ~10 % Treffer, durch Cooldown 5 gedünnt → grob **80–120 je Tag,
  150.000–200.000 in der Entdeckung** (mehr als Donchian-20: 100.692).
- **Standardfehler:** Eichung Donchian-20 H5 (kalibrierung.json): −0,256 Pp bei t −3,13 → se ≈ 0,082 Pp. Mit H10/H20 wächst der
  Hansen-Hodrick-Fehler grob mit √(H/5), mehr Trades je Tag dämpfen nur den eigenen Anteil: se(H10) ≈ 0,08–0,12, se(H20) ≈ 0,12–0,20 Pp.
  Trendkanal (Belegstand 09.09.): „kleine Kanten unter ~0,5 Pp je Trade bei 10–20 Tagen nicht auflösbar" — passt.
- **MDE₈₀ = 2,8016 × se:** **H10 ≈ 0,22–0,34 Pp, H20 ≈ 0,34–0,56 Pp.**
- **Behauptete Größe (Quelle):** H10 +0,18 bis +0,28, H20 +0,29 bis +0,45 Pp.
- **Kriterium:** MDE₈₀ ≤ 2 × behauptete Größe? H10: 0,34 ≤ 2 × 0,18 = 0,36 ✓. H20: 0,56 ≤ 2 × 0,29 = 0,58 ✓. In der Mitte der Spannen
  erreicht die Größe die MDE₈₀ sogar (H10 0,23 gegen 0,28; H20 0,37 gegen 0,45). → **informatives Urteil möglich**: die Messung kann die
  Quellgröße bestätigen oder in ihrer Größe ausschließen. Tor 1 (4 × Bestätigungs-MDE ≈ 1,2–2,2 Pp) wird die Quellgröße **nicht**
  erreichen; ein „belegt" ist damit praktisch ausgeschlossen, ein Größen-Ausschluss („nein" bzw. obere Grenze unter der Quellgröße) nicht.

## Erwartung (vorab)

Richtung positiv. Größe gegen den Topf: Quelle +0,18–0,28 (H10) / +0,29–0,45 (H20) brutto; eigene Erwartung nach K4 und Publikations-
abnutzung **0 bis +0,2 Pp**, netto um die Hürde (0,05–0,09 Pp) kleiner. Erwartetes Urteil: **nicht entscheidbar**, mit oberer Grenze
nahe oder unter der Quellgröße; ein „nein" ist möglich.
