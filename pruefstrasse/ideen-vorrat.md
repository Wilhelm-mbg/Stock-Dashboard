# Ideen-Vorrat der Prüfstraße (Stand 12.10.2026)

**Zweck.** Der nächtliche Ideen-Agent (Cloud, 5 Minuten je Lauf) soll nicht mehr suchen, sondern aus einem geprüften Vorrat schöpfen. Hier stehen
Tagesregeln aus Veröffentlichungen nach 2010 (oder ältere Quellen mit Nachbau nach 2010), jede mit Quelle, Parametern der Quelle, Sicht-Bedarf,
grober Signalzahl und MDE80-Rechnung. Alles Simulation mit virtuellem Kapital, keine Anlageberatung. Kein Eintrag ist gemessen; Urteile hier sind
**Vorab-Urteile über die Machbarkeit**, nie über die Regel.

**Lesereihenfolge für den Ideen-Agenten.** (1) `pruefstrasse/FORM.md`, (2) `pruefstrasse/register.json` und `pruefstrasse/erledigt/*/ERGEBNIS.md`,
(3) `pruefstrasse/warteschlange/*/REGEL.md`, (4) `pruefstrasse/ideen-verworfen.md`, (5) diese Datei. **Regel:** der Ideen-Agent nimmt den
**obersten Eintrag, dessen Spalte „Stand" noch leer ist**, prüft Quelle, Parameter und Rechnung selbst nach (die Volltexte waren hier teils nicht
frei lesbar — das steht dann in der Zeile „Größe"), baut den Kandidaten nach FORM.md oder begründet in `ideen-verworfen.md`, warum nicht, und trägt
in „Stand" ein, was daraus wurde (Kennung + Datum, oder „verworfen, siehe ideen-verworfen.md"). Einträge mit Urteil „Form fehlt" sind erst dran,
wenn die genannte Sicht-Erweiterung geliefert ist (Abschnitt am Ende).

**Rechenweise der MDE80 (Faustregel aus dem Auftrag).** Eichung Donchian-20 H5: 100.692 Trades an 1.735 Entdeckungstagen, se ≈ 0,082 Pp
(`pruefstrasse/kalibrierung.json`: brutto −0,2556 Pp bei t −3,13), MDE80 = 2,8016 × se ≈ **0,23 Pp**. Skalierung: se ∝ 1/√Trades und ∝ √(H/5),
also **MDE80(N, H) ≈ 0,23 Pp × √(100.692 / N) × √(H / 5)**. Vorsicht: das `ERGEBNIS.md` desselben Laufs weist se_HH 0,1235 (H5), 0,1556 (H10),
0,1982 (H20) aus, also MDE80 0,35 / 0,44 / 0,56 Pp — **Faktor 1,5 über der Faustregel**; und die Eichpopulation sind gewöhnliche Tage, Ereignisse
nach Kurssprüngen streuen stärker (in `ideen-verworfen.md` wurde dafür grob Faktor 2 angesetzt). Wo das zutrifft, steht es in der Zeile. Zahl der
Reihen je Tag in den Panel-Klassen 1–3: rund 800 (Zählung des PM zur `hochvolumen-praemie`: 1.403.463 Zeilen an 1.735 Tagen); Entdeckung
04.01.2016 bis 30.12.2022. Kassa-Hürde je Umlauf 0,157 / 0,085 / 0,065 / 0,045 Pp nach Umsatzklasse; Brutto-Belege genügen ab dem Dreifachen
(Ideen-Agent Fassung 2).

**Ein Befund vorab, der die Kalenderregeln betrifft.** Die Tag-Form bewertet jeden Trade gegen den **Topf derselben Zelle** = Mittel aller
zulässigen Reihen derselben Klasse am selben Einstiegstag (`pruefstrasse/adapter/tag.js`, `topf()` Z. 100–120). Eine Regel, die an einem Tag
**alle** Reihen auslöst (Monatswende, Vor-FOMC, Vorfeiertag, FOMC-Wochen), hat damit einen Überschuss von **genau null** — der marktweite Effekt
ist der Topf. Solche Regeln brauchen einen Bewertungsmodus ohne Tagestopf (gegen null bzw. gegen das Mittel aller Tage; Hansen-Hodrick über die
Tagesreihe bleibt) oder eine Korb-Form, die ihn trägt. Das betrifft auch die beiden Kandidaten aus Auftrag Nr. 117 (Nr. 13 und 14 unten).

---

## 1. Umkehr nach großer Tagesbewegung bei gleichgerichtetem Markt

| | |
|---|---|
| Kennung | `umkehr-grossbewegung-marktgleich` |
| Quelle | Kudryavtsev, „The Availability Heuristic and Reversals Following Large Stock Price Changes", *Journal of Behavioral Finance* 19(2) (2018) 159–176, https://ideas.repec.org/a/taf/hbhfxx/v19y2018i2p159-176.html (Abstract frei; abgerufen 2026-10-12). Sekundär: Matos, Lobão & Pacheco (2022), Nachbau am FTSE 100 2010–2018 — „keine signifikante Überreaktion", https://repositorio.upt.pt/items/a4801e97-e8d4-4d01-bbcb-ce1895aee717 (abgerufen 2026-10-12). Schon in `ideen-verworfen.md` (11.10., vierter Lauf) als Vorarbeit genannt; damals verworfen, weil die Sicht keine Marktreihe hatte — **seit Nr. 113 gibt es `markt(j)`**. |
| Stichprobe / Zeitraum | Abstract nennt sie nicht; laut Sekundärzitat (koreanische Studie 2023, Suchergebnis) S&P-500-Werte mit Tagesbewegung ≥ 10 %. Volltext nicht frei. |
| Regel (wörtlich aus dem Abstract) | „both positive and negative large price moves accompanied by the same-sign contemporaneous daily market returns are followed by significant reversals on the next 2 trading days and over 5- and 20-day intervals"; bei gegenläufigem Markt „nonsignificant price drifts". Handelbar nur die Long-Seite: Kurssturz am Tag i **und** Marktrendite(i) < 0 → long; Haltedauer 2 / 5 / 20 Tage. Schwelle (≥ 10 %?) und Marktmaß am Volltext zu bestätigen. |
| Größe | **nicht frei** (Abstract: „magnitude of the reversals increasing over longer postevent windows", stärker bei kleinen, schwankungsreichen Werten). Zum Vergleich die Vorarbeit 2021 (Economic Studies 30(7)): CAR 1…63 Tage nach Stürzen mit tiefstem Vor-CAR-Dezil +1,52 %, brutto. |
| Sicht braucht | `c`, `markt(j)` (Marktrendite des Ereignistags) — **vorhanden**. Kein h/l. |
| Signalzahl | Schätzung aus `ideen-verworfen.md`: 2.800–5.600 Bewegungen ≥ 10 % in der Entdeckung; davon rund die Hälfte marktgleich, nur Stürze → **≈ 700–1.400 Trades**, ~0,4–0,8 je Tag. |
| MDE80 | Faustregel bei N = 1.000: H2 1,5 Pp · H5 2,3 Pp · H20 4,6 Pp. Ereignisstreuung nach 10-%-Sturz grob doppelt → **≈ 3 / 4,6 / 9 Pp**. |
| Urteil | **zu klein, solange die Größe der Quelle nicht vorliegt** (Form heute erfüllt). Einstellbar, wenn der Volltext für die 2-Tage-Umkehr ≥ 1,5 Pp (H2) bzw. ≥ 2,3 Pp (H5) nennt — sonst in `ideen-verworfen.md` mit der Zahl. |
| Stand | verworfen (Ideen-Agent 14.10.2026, zweiter Lauf): Volltext JBF 2018 weiter nicht frei; der unabhängige Nachbau nach 2010 (Matos, Pacheco & Lobão 2022, FTSE 100 2010–2018, Volltext gelesen) findet nach Stürzen mit fallendem Markt keine Umkehr (Tab. 6: \|SR\| > 10 %, MR < 0, mittlere AR Tag 1–5 −0,45 % groß / −0,18 % klein, n. s.) — siehe ideen-verworfen.md 14.10. (zweiter Lauf) |

## 2. Umkehr nach einer Serie gleicher Tagesvorzeichen

| | |
|---|---|
| Kennung | `umkehr-nach-vorzeichenserie` |
| Quelle | Kudryavtsev, „The Effect of Preceding Sequences on Stock Returns", *European Financial and Accounting Journal* 12(4) (2017) 83–96, DOI 10.18267/j.efaj.202, Volltext frei (CC-BY): https://efaj.actavia.vse.cz/pdfs/efa/2017/04/06.pdf — PDF hier nicht lesbar (Binärstrom, kein Renderer); Abstract: https://ideas.repec.org/a/prg/jnlefa/v2017y2017i4id202p83-96.html (beide abgerufen 2026-10-12). |
| Stichprobe / Zeitraum | „large sample of daily stock price data" (Abstract); Markt und Jahre im Volltext. |
| Regel (wörtlich aus dem Abstract) | „following relatively long sequences of positive (negative) stock returns, abnormal stock returns are on average significantly negative (positive)"; „the longer the return sequence, the stronger the effect"; marktbereinigte Renditen. Handelbar: nach n Tagen in Folge mit negativem Vorzeichen → long, Haltedauer 1 (Quelle misst den Folgetag Schluss-zu-Schluss; die Tag-Form steigt zur Folgeeröffnung ein und aus — Abweichung in REGEL.md). n aus dem Volltext (nicht erfinden). |
| Größe | **nicht frei** (Abstract ohne Zahl). Nötig für Regel 2: brutto ≥ 3 × Kassa-Hürde = 0,135 / 0,195 / 0,256 Pp je Umlauf nach Klasse. |
| Sicht braucht | `c`, für die Marktbereinigung `markt(j)` — **vorhanden**. |
| Signalzahl | Münzmodell (eigene Rechnung, keine Quelle): P(≥ 5 gleiche Vorzeichen in Folge) ≈ 2 × 0,5⁵ ≈ 6 % der Wert-Tage → ≈ 50 je Tag → **≈ 50.000–85.000 Trades** (Cooldown 5 Tage dünnt), bei n = 4 etwa doppelt, bei n = 6 halb. |
| MDE80 | bei N = 50.000: H1 **0,15 Pp**, H2 0,21, H5 0,33 (Faustregel). Fein genug für jede Größe ab der Hürde. |
| Verwandt, nicht gleich | Kurzfrist-Umkehr 5 Tage (Querschnitt 15.09., Renditerang, t 1,19); Dip-Familie der Minutenstudie (Nein). Hier: Vorzeichenfolge als Ereignis, keine Rangfolge — Regel 1 ausdrücklich prüfen. |
| Urteil | **einstellbar, sobald der Volltext die Größe und n liefert** (Auflösung reicht); ohne Zahl nicht einstellen. Der Ideen-Agent hat WebFetch — der Volltext ist frei. |
| Stand | eingestellt als `umkehr-nach-vorzeichenserie` (Ideen-Agent 13.10.2026): Volltext gelesen, n = 5 (Tabelle 1 Panel B +0,343 %, Tabelle 5 NEG5 +0,277, t 2,84), H1, Klassen 1–3; MDE80 ≈ 0,26–0,40 Pp; Statistik der Quelle in sich widersprüchlich (in REGEL.md). |

## 3. Umkehr nach Übernacht-Sprung (Eröffnungslücke)

| | |
|---|---|
| Kennung | `umkehr-uebernachtsprung` |
| Quelle | Bahcivan, Dam & Gonenc, „Information shocks and short-term market overreaction: overnight jumps" (Arbeitstitel laut Suchergebnis), FEB Research Report 2023002-EEF, Universität Groningen, Januar 2023, https://www.rug.nl/feb/research/febri-research-reports/docs-2023/2023002-eef-def.pdf — PDF hier nicht lesbar (abgerufen 2026-10-12). Warnungen aus Nachbauten: Branch & Ma (2018, Daten 2011–2017): Übernacht/Intraday-Umkehr „absent among S&P 500 stocks", nur in kleinen Werten; Abschlussarbeit Universität Turku (2026, US-Tagesdaten 2011–2024): Gap→Intraday-Umkehr brutto signifikant, **netto nach Spanne und Kommission klar negativ** (https://www.utupub.fi/bitstreams/88057d2a-1ee8-4c05-9592-c535a21b502c/download, abgerufen 2026-10-12). |
| Stichprobe / Zeitraum | > 9.700 NYSE/AMEX/NASDAQ-Werte, Juni 1993 – Dezember 2021 (Suchergebnis); Sprünge nach Lee & Mykland (2008). |
| Regel (laut Suchergebnis-Zitat) | „overreaction to overnight price jumps, followed by return reversal and predictability for up to five days"; Gegenstrategie „short-lived". Handelbar: negativer Übernacht-Sprung (Eröffnung(i) gegen Schluss(i−1), Sprungtest der Quelle) → long zur Eröffnung i+1, Haltedauer 1–5. Testparameter (Fenster, Signifikanzniveau) aus dem Volltext. |
| Größe | **nicht frei**. |
| Sicht braucht | `o`, `c` — **vorhanden** (Panel liefert o). |
| Signalzahl | unbekannt; Sprünge nach Lee-Mykland sind selten — vor dem Einstellen zählen (eigenes Zählskript ohne Renditen). Annahme 1–2 % der Wert-Tage → ≈ 15.000–30.000 in der Entdeckung. |
| MDE80 | bei N = 20.000: H1 0,23 Pp · H5 0,52 Pp (Faustregel; Ereignisstreuung eher höher). |
| Urteil | **Form erfüllt, Größe fehlt**; bei den Warnungen (liquide Werte: verschwunden; netto negativ) eher Größen-Ausschluss als Bestätigung zu erwarten — als informatives Urteil zulässig. Einstellen nur mit den Zahlen der Quelle. |
| Stand | verworfen (Ideen-Agent 14.10.2026): Volltext gelesen — Größe nur als Grafik, Tag 1 = Intraday des Sprungtags (Tag-Form verpasst ihn), eigene Strategie der Autoren −0,2 % (D1, t −0,71); siehe ideen-verworfen.md |

## 4. Sprung-Fortsetzung über 1–3 Monate

| | |
|---|---|
| Kennung | `sprung-fortsetzung` |
| Quelle | Jiang & Zhu, „Information shocks and short-term market underreaction", *JFE* 124(1) (2017) 43–64, https://ideas.repec.org/a/eee/jfinec/v124y2017i1p43-64.html (Abstract; abgerufen 2026-10-12). In `ideen-verworfen.md` (11.10., zweiter Lauf) mit „Wiedervorlage, sobald ein Nachbau nach Kosten vorliegt" — **Fassung 2 des Ideen-Agenten lässt Brutto ≥ 3 × Hürde genügen**, also wieder offen. |
| Stichprobe / Zeitraum | „US equity market" (Abstract); Jahre und Sprungtest im Volltext (ScienceDirect, nicht frei). |
| Regel (wörtlich) | „Strategies long (short) stocks with positive (negative) lagged jump returns earn significantly positive returns over the next one- to three-month horizons"; „intraday jumps, especially overnight jumps" tragen zusätzlich. Handelbar: positiver Sprung am Tag i → long zur Eröffnung i+1, Haltedauer 20 / 40 / 60 (60 ist das Maximum der Tag-Form). |
| Größe | **nicht frei**. Für Regel 2 nötig: brutto ≥ 0,135–0,256 Pp je Umlauf — bei Monatshorizont leicht erreichbar, wenn die Quelle überhaupt eine Zahl nennt. |
| Sicht braucht | `c` (Sprungtest auf Tagesrenditen), für Übernacht-Sprünge `o` — **vorhanden**. Achtung: Nr. 3 sagt für dieselben Übernacht-Sprünge Umkehr bis Tag 5, Nr. 4 Fortsetzung über Monate — zwei Horizonte, eine Regel je Kandidat. |
| Signalzahl | wie Nr. 3: ≈ 15.000–30.000 (Annahme, zu zählen). |
| MDE80 | bei N = 20.000: H20 **1,0 Pp** · H40 1,46 · H60 1,8 Pp (Faustregel). Kriterium erfüllt, wenn die Long-Seite ≥ 0,5 Pp je 20 Tage trägt. |
| Urteil | **Form erfüllt, Größe fehlt** — mit Volltext voraussichtlich einstellbar (Monatshorizont, viele Ereignisse). |
| Stand | verworfen (Ideen-Agent 14.10.2026): Quelle ist Dezilsortierung (Korb); Nachbau Bahcivan et al. 2023 (Table 7): D10 +0,4 %/Monat FF4, t 1,49 — nicht signifikant, unter MDE80; siehe ideen-verworfen.md |

## 5. Dividendenmonat-Prämie (Vorlauf zum Ex-Tag)

| | |
|---|---|
| Kennung | `dividendenmonat-long` |
| Quelle | Hartzmark & Solomon, „The dividend month premium", *JFE* 109(3) (2013) 640–660, https://ideas.repec.org/a/eee/jfinec/v109y2013i3p640-660.html; Zahlen aus dem Arbeitspapier-Abstract (SSRN 1930620) nach https://alphaarchitect.com/2011/10/dividends-can-pay-without-paying und https://vvv.quantpedia.com/?p=477 (alle abgerufen 2026-10-12). |
| Stichprobe / Zeitraum | US-Aktien 1927–2009 (Zusammenfassungen; die JFE-Fassung kann abweichen). |
| Regel (wörtlich) | „companies have positive abnormal returns in months when they are predicted to issue a dividend"; Vorhersage aus der eigenen Dividendenhistorie (Quartals-/Halbjahres-/Jahreszahler; Vorschrift im Volltext); „daily returns increase as the ex-dividend day approaches, and are negative afterwards". Handelbar: erwarteter Ex-Tag in k Handelstagen → long bis zur Eröffnung am Ex-Tag (k aus dem Volltext). |
| Größe (brutto, je Monat) | **+53 Bp** gegen alle anderen Firmen, **+37 Bp** gegen Zahler ohne erwartete Dividende; Buch aller erwarteten Zahler **+41 Bp** abnormal je Monat (Zusammenfassung). Der Vor-Ex-Tag-Anteil ist kleiner als der Monatswert (Umkehr danach). Keine Kostenangabe. |
| Sicht braucht | **Dividendenhistorie je Reihe (Ex-Tage, Punkt-in-Zeit) — fehlt.** Daten liegen vor: `alpaca-massnahmen/` (Barausschüttungen mit Ex-Tag; allein 01.09.–03.10.2026: 4.046). |
| Signalzahl | Annahme ~350 Zahler in Klassen 1–3 × 4 je Jahr × 7 Jahre ≈ **9.800 Ereignisse** (Anteil der Zahler ungezählt). |
| MDE80 | bei N = 10.000: H10 **1,0 Pp** · H20 1,5 Pp. Kriterium MDE80 ≤ 2 × 0,53 = 1,06 → bei H10 gerade; gegen den Vor-Ex-Anteil allein nicht. |
| Urteil | **Form fehlt (Ex-Tage in der Sicht)**; danach grenzwertig einstellbar (Größen-Ausschluss möglich). Hinweis: Belegstand führt „Dividendentermine — nicht messbar (strukturell)" vom 01.09.; die Datenlage hat sich mit dem Maßnahmen-Ordner geändert. |
| Stand | |

## 6. Vor-Quartalszahlen-Prämie (Ankündiger-Prämie)

| | |
|---|---|
| Kennung | `vor-quartalszahlen-long` |
| Quelle | Savor & Wilson, „Earnings Announcements and Systematic Risk", *Journal of Finance* 71(1) (2016), DOI 10.1111/jofi.12361; Arbeitspapier https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/Draft20111215p_edited.pdf. Ältere Grundlage: Frazzini & Lamont (2007), NBER w13090; Welt: Barber, De George, Lehavy & Trueman (2013), *JFE* 108(1) (Zusammenfassung https://alphaarchitect.com/introducing-the-global-earnings-announcement-premium/ — 403, nicht gelesen). Alle abgerufen 2026-10-12. |
| Stichprobe / Zeitraum | US-Aktien; Jahre im Volltext. |
| Regel (laut Suchergebnis) | Firmen, die planmäßig Quartalszahlen melden, verdienen in der Meldewoche mehr: „firms scheduled to report earnings earn an annualized abnormal return of 9.9 %"; „early (late) announcers earn higher (lower) returns". Erwarteter Termin aus dem Vorjahrestermin desselben Quartals (Vorschrift im Volltext). Handelbar: erwarteter Termin in 5 Handelstagen → long bis zur Eröffnung nach der Meldung (H5). |
| Größe | 9,9 % p. a. als laufend gehaltenes Ankündiger-Portfolio ≈ 0,04 Pp je Handelstag (eigene Umrechnung /252) → **≈ 0,2 Pp je 5-Tage-Fenster**. Keine Kostenangabe. |
| Sicht braucht | **Meldetermine je Reihe (Punkt-in-Zeit) — fehlt.** Daten liegen vor: 8-K-2.02-Tafel aus Nr. 80 (126.907 Meldungen 2016–2026 mit Annahmezeit) und Earnings-Kalender der App. |
| Signalzahl | 800 × 4 × 7 ≈ **22.400** Ereignisse, stark auf Meldesaisons geballt (Nr. 80: Zuschlag rund ein Viertel). |
| MDE80 | bei N = 22.400, H5: 0,49 Pp, mit Ballung ≈ **0,6 Pp** — über 2 × 0,2. |
| Verwandt | Ergebnis-Drift (nach der Meldung, Überraschung aus dem Bericht; 04.10. „nicht entscheidbar", MDE 1,49 Pp je 60 Tage) — anderes Fenster (vor statt nach). |
| Urteil | **Form fehlt und zu klein** in der Tag-Form; als Korb (Ankündiger-Buch) ohnehin zu grob. Nur wieder vorlegen, wenn eine Quelle nach 2010 je Ereignis ≥ 0,4 Pp nennt. |
| Stand | |

## 7. Insiderkäufe (Form 4), opportunistische Käufe

| | |
|---|---|
| Kennung | `insiderkauf-long` |
| Quelle | Cohen, Malloy & Pomorski, „Decoding Inside Information", *Journal of Finance* 67(3) (2012); NBER w16454, https://www.nber.org/papers/w16454.pdf; Zusammenfassungen https://www.nber.org/digest/apr11/decoding-inside-information, https://corpgov.law.harvard.edu/2012/02/03/decoding-inside-information (alle abgerufen 2026-10-12). Im Wiki: `mehrfaktor-felder.md` Feld 14 („EDGAR Form 4 frei, nicht gebaut"), `entscheide.md` 01.09. („weggelassen"). |
| Stichprobe / Zeitraum | Thomson-Reuters-Insidermeldungen Januar 1986 – Dezember 2007. |
| Regel (laut Quelle) | Insider werden in „routine" (Handel im selben Kalendermonat in den Vorjahren) und „opportunistic" getrennt; nur opportunistische Trades tragen Information. Buch aus opportunistischen Trades: **82 Bp je Monat wertgewichtet** (Routine ≈ 0); gleichgewichtet 180 Bp (nur in der HLS-Zusammenfassung, zu prüfen); Abstand opportunistisch–routine 158 Bp je Monat. Handelbar: opportunistischer Kauf am Tag i (Meldung Form 4) → long zur Eröffnung i+1, Haltedauer 20 / 40 / 60. Die Trennung braucht 3 Vorjahre Insiderhistorie je Person. |
| Größe | 0,82 Pp je Monat (Buch, Kauf- und Verkaufsseite zusammen; Long-Seite allein nicht nachgelesen). Keine Kostenangabe. |
| Sicht braucht | **Ereignisspalte Insiderkauf — fehlt; Datenbau nötig** (EDGAR Form 4 frei, `wiki/datenquellen.md` Z. 94; Zuordnung CIK→Kürzel wie bei der 8-K-Tafel). |
| Signalzahl | ungezählt; Annahme 2–5 offene Käufe je Reihe und Jahr → 11.000–28.000, opportunistische Teilmenge kleiner. |
| MDE80 | bei N = 10.000: H20 **1,46 Pp**; bei N = 20.000: 1,03 Pp. Kriterium ≤ 2 × 0,82 = 1,64 → erfüllt, sofern ≥ 10.000 Ereignisse und die Long-Seite den Buchwert trägt. |
| Urteil | **Form fehlt (Datenbau Form 4)**; danach einstellbar-nahe. Lohnendster Datenbau unter den Ereignisregeln neben Nr. 5. |
| Stand | |

## 8. FOMC-Zyklus: gerade Wochen

| | |
|---|---|
| Kennung | `fomc-gerade-wochen-long` |
| Quelle | Cieslak, Morse & Vissing-Jorgensen, „Stock Returns over the FOMC Cycle", *Journal of Finance* 74(5) (2019) 2201–2248, DOI 10.1111/jofi.12818; SSRN 2687614; Zusammenfassung https://hedgefundalpha.com/?p=1157265 (abgerufen 2026-10-12). |
| Stichprobe / Zeitraum | US-Markt seit 1994 (Woche 0 beginnt am Tag vor der planmäßigen Bekanntgabe, acht Sitzungen je Jahr). |
| Regel (laut Quelle) | Die Aktienprämie seit 1994 entsteht in den **geraden Wochen** (0, 2, 4, 6) des FOMC-Zyklus; ungerade Wochen tragen wenig; „statistically significantly higher in even weeks than in odd weeks". Handelbar: long über jede gerade Woche (H5), sonst Kasse. |
| Größe | Basispunkte je Woche **nicht frei** (nur Richtung und Signifikanz). Woche 0 enthält die Lucca-Moench-Drift (≈ ½ % 2 pm → 2 pm). |
| Sicht braucht | FOMC-Termine als `params` (kommt mit Nr. 117), `datum(j)` (Nr. 117) — **und einen Bewertungsmodus ohne Tagestopf** (marktweit: alle Reihen feuern gleichzeitig, Überschuss gegen den Topf ≡ 0). |
| Signalzahl | ≈ 8 × 4 × 7 ≈ 220 Wochen in der Entdeckung, **ein Cluster je Woche** — die Faustregel (je Trade) gilt hier nicht; se aus der SPY-Wochenstreuung (`markt(j)`) vor dem Einstellen aus der Tafel ziehen. |
| MDE80 | nicht nach der Faustregel schätzbar; mit 220 Clustern grob in der Größenordnung einer Wochen-Marktstreuung geteilt durch √220 (Zahl erst aus der Tafel). |
| Urteil | **Form fehlt (Topf) und Zahl der Quelle fehlt.** |
| Stand | eingestellt als `fomc-gerade-wochen-long` (Ideen-Agent 18.10.2026): Volltext Arbeitspapier 2015 gelesen — Wochen 0/2/4/6 = Tage −1…3, 9…13, 19…23, 29…33, +0,57/+0,30/+0,42/+0,61 % gegen ungerade −0,12…−0,17 % (Tab. 1: +13,6 bzw. +10 Bp/Tag); H5, Klassen 1–3, Bewertung `zeit`, Versatz 5; 171 Signaltage, MDE80 ≈ 0,47–0,67 gegen ≈ 0,55 Pp; ohne Woche 0 nicht auflösbar |

## 9. Übernacht-Fortsetzung gegen Tag-Umkehr

| | |
|---|---|
| Kennung | `uebernacht-tag-zugkraft` |
| Quelle | Lou, Polk & Skouras, „A tug of war: Overnight versus intraday expected returns", *JFE* 134 (2019) 192–213; Volltext https://personal.lse.ac.uk/polk/research/TugOfWar.pdf, LSE-Eprint https://eprints.lse.ac.uk/87481/ (abgerufen 2026-10-12). |
| Regel (wörtlich) | „strong overnight and intraday firm-level return continuation, along with an offsetting cross-period reversal effect, all of which lasts for years"; alle abnormalen Momentum-Erträge fallen über Nacht an; Unterschied Übernacht–Intraday schwankt bedingt „on the order of two percent per month". |
| Größe | Dezil-Monatsrenditen nicht nachgelesen; bedingte Spanne ≈ 2 % je Monat (Long-Short, Übernacht gegen Tag). |
| Sicht braucht | Form: **Einstieg zum Schluss, Ausstieg zur nächsten Eröffnung** — die Tag-Form hält Eröffnung→Eröffnung; dazu Querschnittsränge (Korb). Beides fehlt. |
| Urteil | **Form fehlt** (Übernacht-Haltung und Querschnitt). Die Übernacht-Familie der Messmaschine (Minuten, 2026-08/09) ist außerdem „vier von vier nein" — hier anderes Signal (Monats-Übernachtrendite), aber dasselbe Haltefenster. |
| Stand | |

## 10. MAX-Effekt (Lotterie-Aktien)

| | |
|---|---|
| Kennung | `max-effekt` |
| Quelle | Bali, Cakici & Whitelaw, „Maxing out: Stocks as lotteries and the cross-section of expected returns", *JFE* 99(2) (2011) 427–446, DOI 10.1016/j.jfineco.2010.08.014; Abstract https://academicnewsletter.sufe.edu.cn/info/356984; Gegenlesart Gorman et al. (2021/22, *Critical Finance Review*): Überreaktion statt Lotterie (abgerufen 2026-10-12). |
| Regel (wörtlich) | Sortierung nach der höchsten Tagesrendite des Vormonats (MAX); „average raw and risk-adjusted return differences between stocks in the lowest and highest MAX deciles exceed 1 % per month", robust gegen Größe, B/M, Momentum, Kurzfrist-Umkehr, Liquidität, Schiefe. |
| Größe | > 1 Pp je Monat Long-Short (tief minus hoch); Long-Seite allein (tiefes MAX gegen Markt) nicht nachgelesen, sicher kleiner. |
| Sicht braucht | Querschnittsrang → nur Korb-Form; eine feste MAX-Schwelle für die Tag-Form wäre erfunden (Regel 2). |
| MDE80 | Korb-Form: 7–12 Pp je 63-Tage-Periode (`aufloesungswand.md`, Nachtrag 11.10.) gegen höchstens ≈ 3 Pp je Periode. |
| Urteil | **zu klein (Korb-Form).** Wiedervorlage mit einem Querschnitts-Adapter mit Tagesclusterung. |
| Stand | |

## 11. Kurzfrist-Umkehr nur bei hoher Marktschwankung

| | |
|---|---|
| Kennung | `umkehr-bei-marktstress` |
| Quelle | Nagel, „Evaporating Liquidity", *Review of Financial Studies* 25(7) (2012); NBER w17653, https://www.nber.org/papers/w17653.pdf; Zahl aus https://vvv.quantpedia.com/es/wp-json/wp/v2/posts/808 (Sekundärquelle; abgerufen 2026-10-12). |
| Regel (wörtlich) | „expected return from liquidity provision is strongly time-varying and highly predictable with the VIX index"; Umkehrstrategien (Lehmann-Gewichte, 5 Tage) verdienen bei hohem VIX viel, sonst wenig; laut Quantpedia „1 VIX-Punkt mehr → 5,37 Bp höhere Umkehrrendite über die nächsten 5 Tage (große Werte)". |
| Sicht braucht | Querschnitt (Korb); VIX fehlt — `markt(j)` erlaubt nur eine realisierte SPY-Schwankung als Ersatz (Abweichung von der Quelle). |
| Verwandt | Kurzfrist-Umkehr 5 Tage im Querschnitt 15.09. (t 1,19): eine Bedingung darauf wäre eine Abwandlung des Gemessenen (Regel 1). |
| Urteil | **zu klein (Korb) und Abwandlung.** |
| Stand | |

## 12. Saisonalität je Aktie (gleicher Kalendermonat)

| | |
|---|---|
| Kennung | `monatssaisonalitaet-je-aktie` |
| Quelle | Keloharju, Linnainmaa & Nyberg, „Return Seasonalities", *Journal of Finance* 71(4) (2016) 1557–1590, DOI 10.1111/jofi.12398; https://research.fi/en/results/publication/0360897916, https://hedgefundalpha.com/strategies/return-seasonalities-a-stock-selection-strategy/ (abgerufen 2026-10-12). |
| Regel | Aktien nach ihrer Durchschnittsrendite im selben Kalendermonat der Vorjahre sortiert; Long-Short „about 13 % a year"; Saisonalitäten auch täglich und in Anomalien, Rohstoffen, Länderindizes. |
| Sicht braucht | Querschnitt (Korb) **und** Historie über viele Jahre — das Panel beginnt 2016 (Vorlauf-Problem wie beim Trendfaktor in `ideen-verworfen.md`). |
| MDE80 | Korb 30–50 Pp p. a. gegen 13 Pp p. a. Long-Short (Long-Seite kleiner). |
| Urteil | **zu klein (Korb) und Datenlänge.** |
| Stand | |

## 13. Monatswende — **schon eingestellt (Nr. 117)**

| | |
|---|---|
| Kennung | `monatswende-long` (Auftrag Nr. 117, Bau am 12.10. gestartet; `uebergabe/auftrag-kalender-kandidaten-2026-10-12.md`) |
| Quelle | McConnell & Xu (2008), *FAJ* 64(2); Etula, Rinne, Suominen & Vaittinen, „Dash for Cash: Monthly Market Impact of Institutional Liquidity Needs", *RFS* 33(1) (2020) 75–111, https://academic.oup.com/rfs/article/33/1/75/5494694; Zusammenfassung https://www.cxoadvisory.com/?p=26333 (abgerufen 2026-10-12). |
| Regel | Fenster T−3 … T+3 um den letzten Handelstag; „the seven-day TOTM window accounts for nearly all of the U.S. market's gross cumulative return since 1926", 40 % geringere Schwankung als Halten; Verkäufe drücken T−8…T−4, Erholung T−3…0, Käufe heben +1…+3, Rückgabe +4…+8. Kosten: netto „materially smaller" (keine Zahl). Nachbau 24 Märkte 1980–2014: Fensterbeginn in 18, Ende in 12 Indizes signifikant. |
| Größe | Basispunkte je Tag nur als Grafik, nicht als Zahl frei. |
| Hinweis für Nr. 117 | **marktweit** → Überschuss gegen den Topf derselben Zelle ≡ 0 (siehe Einleitung). Belegstand: „Monatswende — war Marktzeitgeschäft, nicht Saisonalität (Gedächtnisprotokoll)" und `aufloesungswand.md`: „hätte 79.500 Tage gebraucht" (Index-Reihe). Signalzahl: 84 Monatswenden in der Entdeckung = 84 Cluster, nicht 84 × 800 Trades. |
| Urteil | **schon eingestellt**; ohne Bewertungsmodus ohne Topf misst der Lauf null. |
| Stand | Nr. 117 (12.10.2026) |

## 14. Vor-FOMC-Drift — **schon eingestellt (Nr. 117)**

| | |
|---|---|
| Kennung | `vor-fomc-long` (Auftrag Nr. 117) |
| Quelle | Lucca & Moench, „The Pre-FOMC Announcement Drift", *Journal of Finance* 70(1) (2015): **+49 Bp** im S&P 500 in den 24 Stunden vor planmäßigen Bekanntgaben, September 1994 – März 2011 (≈ 80 % der Jahresrendite). Fortdauer: Kurov, Wolfe & Gilbert, „The disappearing pre-FOMC announcement drift", *Finance Research Letters* 40 (2021), https://ideas.repec.org/a/eee/finlet/v40y2021ics1544612320315956.html, Arbeitspapier https://www.skidmore.edu/economics/documents/KurovWolfeGilbert-TheDisappearingPre-FOMC-Announce-Drift-200914.pdf — „essentially disappeared after 2015", Stichprobe bis Dezember 2019; NY Fed Liberty Street 2018: nur noch bei Sitzungen mit Pressekonferenz, https://libertystreeteconomics.newyorkfed.org/2018/11/the-pre-fomc-announcement-drift-more-recent-evidence.html (alle abgerufen 2026-10-12). |
| Hinweis für Nr. 117 | marktweit → Topf ≡ 0; 8 × 7 = 56 Ereignisse in der Entdeckung = 56 Cluster; die Quelle nach 2015 sagt für den Entdeckungszeitraum 2016–2022 „verschwunden" — Erwartung entsprechend. |
| Urteil | **schon eingestellt**; derselbe Topf-Vorbehalt. |
| Stand | Nr. 117 (12.10.2026) |

## 15. Hochvolumen-Prämie — **schon eingestellt (Warteschlange)**

| | |
|---|---|
| Kennung | `hochvolumen-praemie` (Ideen-Agent 11.10., dritter Lauf; Nachträge PM zu `roh`) |
| Quelle / Größe | Gervais, Kaniel & Mingelgrin (2001) Tabelle 2, Long-Seite groß +0,18 / +0,29 Pp (10 / 20 Tage), mittel +0,26 / +0,41; Kaniel, Ozoguz & Starks (2012), Wang (2021) — alles in `warteschlange/hochvolumen-praemie/REGEL.md`. |
| Urteil | **schon eingestellt**; Umsatzregeln (Rang des Tagesumsatzes im Fenster) nicht noch einmal vorschlagen. |
| Stand | Warteschlange seit 11.10.2026 |

## 16. Index-Aufnahme S&P 500

| | |
|---|---|
| Kennung | `index-aufnahme-long` |
| Quelle | Greenwood & Sammon, „The Disappearing Index Effect", *Journal of Finance* 80(2) (2025) 657–698, DOI 10.1111/jofi.13410; NBER w30748 https://www.nber.org/system/files/working_papers/w30748/w30748.pdf; https://alphaarchitect.com/disappearing-index-effect/ (abgerufen 2026-10-12). |
| Größe | Abnormale Rendite einer Aufnahme (Ankündigung bis Wirksamkeit, im Mittel 4,8 Tage): **7,4 % in den 1990ern → unter 1 % im letzten Jahrzehnt** (Arbeitspapier 0,8 %); Streichungen 2010–2020 +0,1 % (Arbeitspapier −0,6 %). |
| Sicht braucht | Index-Mitgliedschaften und Ankündigungstage — **nicht vorhanden**. |
| Signalzahl / MDE80 | Annahme ≈ 20 Aufnahmen je Jahr (ungezählt) × 7 ≈ 140 Ereignisse; H5 bei N = 140: **≈ 6 Pp** ≫ 1 Pp. |
| Urteil | **Form fehlt und zu klein** — die Quelle selbst nennt den Effekt für 2010–2020 unter 1 Pp. Nicht weiterverfolgen. |
| Stand | |

## 17. Vorfeiertag

| | |
|---|---|
| Kennung | `vorfeiertag-long` |
| Quelle | *Critical Finance Review* 13(3–4) (2024), Nachbau 1983–2019: „the pre-holiday effect now exists only among small firms. For large firms, the differences … have become insignificant, and especially after 1990", https://nowpublishers.com/article/Details/CFR-0111; Dumitriu & Stefanescu (2020), MPRA 100463 (2000–2009: hohe abnormale Renditen 3–4 Tage vor Feiertagen, vor allem Small Caps), https://mpra.ub.uni-muenchen.de/100463 (abgerufen 2026-10-12). |
| Sicht braucht | Feiertage aus dem Tafelkalender (Lücke an einem Werktag) — mit `datum(j)` (Nr. 117) ableitbar; **marktweit → Topf ≡ 0** (Bewertungsmodus fehlt). |
| Signalzahl | Annahme ≈ 9 Börsenfeiertage je Jahr × 7 Jahre ≈ 63 Cluster (aus dem Tafelkalender zu zählen). |
| Urteil | **Form fehlt**, und die Quelle sagt für große Werte seit 1990 nichts Signifikantes — in den Klassen 1–3 nicht lohnend. |
| Stand | |

---

## Sicht-Erweiterungen, die am meisten freischalten

| Erweiterung | macht messbar | Aufwand / Datenlage |
|---|---|---|
| **Bewertungsmodus ohne Tagestopf** (Überschuss gegen null oder gegen das Mittel aller Tage; Hansen-Hodrick über die Tagesreihe bleibt; Placebo = dieselbe Regel um 20 Tage verschoben) | Nr. 8, 13, 14, 17 — **und ist Voraussetzung, dass die beiden Kandidaten aus Nr. 117 überhaupt etwas messen** | Adapter `tag.js`, ein Schalter je Kandidat (`bewertung: "topf" | "null"`); Daten vorhanden |
| **Ex-Tage je Reihe** (`sicht.exTage(j)` oder `sicht.letzteDividende(j)`, Punkt-in-Zeit) | Nr. 5 | `alpaca-massnahmen/` liegt vor; Tafelspalte bauen |
| **Meldetermine je Reihe** (`sicht.letzteMeldung(j)`, erwarteter Termin = Vorjahrestermin desselben Quartals) | Nr. 6 (zu klein, aber messbar) und künftige Vor-/Nach-Meldungsregeln | 8-K-2.02-Tafel aus Nr. 80 (126.907 Meldungen) liegt vor |
| **Form-4-Tafel** (EDGAR, Käufe/Verkäufe je Reihe, Personenkennung für routine/opportunistisch) | Nr. 7 | Datenbau (EDGAR frei; Zuordnung CIK→Kürzel wie bei der 8-K-Tafel); Entscheid 01.09. „weggelassen" wäre aufzuheben |
| **FOMC-Termine als `params`** und `datum(j)` | Nr. 8, 14 | kommt mit Nr. 117 |
| **Tagesdaten vor 2016** (mindestens 2008) | Nr. 12; Trendfaktor und Saisonalitäten aus `ideen-verworfen.md` | ein Tagesarchiv auf E: soll bis 1986 zurückreichen (Gedächtnisnotiz des PM, hier nicht nachgeprüft), ist aber nicht die Panel-Quelle (Quellenpflicht je Kerze) |
| **Querschnitts-Adapter mit Tagesclusterung** (Dezil gegen Universum je Tag) | Nr. 9, 10, 11, 12; Medhat & Schmeling aus `ideen-verworfen.md` | zurückgestellt (PM 11.10.); Prüfstand 15.09. löst nur ≈ 12 Pp p. a. auf |

## Geprüft und bewusst nicht aufgenommen

- **Jahreswechsel-Verlierer (Steuerverkäufe, Umkehr im Januar):** keine Quelle nach 2010 für US-Aktien mit Zahlen gefunden (nur Muni-CEF/ETF: Carrion & Zhang 2024, *JFR* 47(4)); sieben Jahreswechsel = sieben Cluster in der Entdeckung.
- **Aktiensplits:** die Reaktion liegt am Ankündigungstag (nicht in der Sicht; `roh`/`c` zeigen nur den Ex-Tag); Nachbauten nach 2010 nur Abschlussarbeiten; Drift laut Boehme & Danielsen (2007) kurz und friktionsbedingt.
- **Eröffnungslücke → Umkehr am selben Tag:** Tag-Form steigt erst zur Folgeeröffnung ein; Nachbauten (Turku 2026: netto negativ; Branch & Ma 2018: bei S&P-500-Werten verschwunden). Der mehrtägige Teil steht als Nr. 3.
- **Ergebnis-Drift / PEAD** in jeder Fassung (SUE, Ankündigungsrendite): gemessen 04.10. (nicht entscheidbar); rendite-basierte Überraschung = Abwandlung.
- **52-Wochen-Hoch / Ausbruch auf neues Hoch:** Querschnitt 15.09. (nein) und Donchian 20/55 (09.09., 12.10.) — anderer Kanalparameter = Wiederholung.
- **Kurzfrist-Umkehr 5 Tage, Umsatzschock mit Richtung, tiefe Volatilität, 52-Wochen-Hoch:** Querschnitt 15.09. gemessen.
- **Momentum 12-1, Sektor-Momentum, Trendfilter auf SPY (Faber, GEM, 200 Tage), käufliche Faktor-ETFs:** gemessen 16.09., 04.–05.10.
- **Kapitulation (Volumen + Sturz), Dip-/Ausbruch-/Wende-Familie:** gemessen (Minuten 09/2026, Kapitulation 03.10.); eine Tagesfassung wäre dieselbe Regel auf anderem Zeitrahmen.
- **Regime-Filter SPY > EMA200 als Zusatzbedingung:** gemessen (Bedingung 04.10., Vermerk); Kombination mit neuen Regeln ist Abwandlung — erst die Regel allein.
- **Nachrichten-Stimmung (GDELT), News-Sentiment:** gemessen 01.09. und 03.10.
- **Qualität GP/A, Aktionärsrendite, Sektor-Momentum über ETFs:** am 04.10. blind festgelegt (`studien/kandidaten-blind-2026-10/`), Korb-Form — dort nach `aufloesungswand.md` zu grob.
- **Trendfaktor (Han/Zhou/Zhu), Kurzfrist-Momentum × Umschlag (Medhat/Schmeling), Umkehr nach Großbewegung mit Vor-CAR-Dezil (Kudryavtsev 2021), Gutierrez 3-Tage, IBS, Plastun et al.:** `ideen-verworfen.md` 11.10.
- **Betting against beta / Low-Vol:** Korb-Form; tiefe Volatilität im Querschnitt 15.09. in die falsche Richtung.
- **Sell in May / Halloween:** Haltedauer > 60 Tage (Maximum der Tag-Form), marktweit.
- **Wochentagseffekte, Optionsverfall, Russell-Rekonstitution:** nicht recherchiert (Zeit); alle marktweit bzw. ohne Mitgliedsdaten.
- **Minuten-/Stundenregeln aller Art:** Auftrag §3; Signalstudie Minuten 1m/5m/15m 234 Konfigurationen nein, Daytrader-Sieb 05.10. nichts.
