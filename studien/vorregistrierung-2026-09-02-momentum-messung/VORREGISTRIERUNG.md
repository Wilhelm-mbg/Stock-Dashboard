# Vorregistrierung: Monats-Momentum MESSEN — 02.09.2026

**Geschrieben und committet, bevor das Werkzeug dieser Studie gebaut oder ausgeführt wurde.**
Auftrag vom 02.09.2026 (PM), eine Sitzung, ein Lauf. Rolle: Berechnungen.

> **Das ist eine MESSUNG, keine Eichung.** Die Eichung vom 25.08.2026
> (`studien/momentum-nichtueberlappend/`) hat die **Messanordnung** validiert — *g* = 1,543
> bei Phase 0, Minimum 1,342 über 63 Lagen — und durfte über Momentum selbst nichts sagen.
> Sie bleibt unverändert; hier wird nur auf sie verwiesen. **Diese Studie wendet die
> validierte Anordnung auf die Sache selbst an und fällt ein Urteil.**

## 0. Was diese Messung ist — und was sie nicht sein kann

**Die Daten sind gesehen.** Beide Hälften des Archivs wurden am 24./25.08. überlappend und
nicht überlappend ausgewertet; die Zahlen stehen in `studien/momentum-nichtueberlappend/ERGEBNIS.md`
und in `studien/messmaschine/ERGEBNIS-2026-08-24-momentum.md`. Es gibt keine unberührte
Hälfte mehr. **Diese Messung ist deshalb keine Out-of-Sample-Prüfung** und wird nirgends
als solche geführt.

Was sie leistet, ist etwas anderes und Vorgeschriebenes: eine **vorab festgelegte
Entscheidungsregel** mit Kosten je Gefäß, Placebo in derselben Blickzeile, Positivkontrolle,
ausgewiesener Multiplizität, geprüfter Überlebensverzerrung und einer **Obergrenze des
Vertrauensbandes** (`studien/OBERGRENZEN-BEFUND.md`: „nicht entscheidbar" ist eine
Nicht-Aussage, die obere Grenze sagt oft mehr). Nichts davon hat Momentum bisher bekommen.

**Was das Urteil deshalb wert ist:** Ein JA wäre ein In-Sample-JA auf gesehenen Daten und
müsste als solches etikettiert werden. Ein NEIN über die Obergrenze ist davon weniger
betroffen — es sagt, was selbst die optimistischste mit den Daten verträgliche Kante
**nicht** schafft. Die Regel aus `wiki/messmethodik.md` (Out-of-Sample-Pflicht, bewusst
offen) bleibt bestehen; die einzige unberührte Hälfte ist die Zukunft.

## 1. Gesehene Zahlen — vollständig deklariert

| Quelle | Zahl |
|---|---|
| Eichung 25.08., Bestätigung, Phase 0, nicht überlappend | **+1,537 Pp je Umlauf, se 0,732, t 2,10, 79 Perioden**, Streuung je Periode 6,506 Pp |
| Eichung, Bestätigung, überlappend + Newey-West | +1,160 Pp, se 1,129, t 1,03 |
| Eichung, alle 63 Lagen | *g* min 1,342 / Median 1,569 / max 1,921 |
| Eichung, Entdeckung | überlappend se 1,223, nicht überlappend se 0,873, *g* 1,40; Entdeckungsüberschuss (überlappend) +3,304 Pp |
| Maschine 24.08., V0 (stärkste 10 %), Bestätigung, 5 Bp Kosten | +0,897 Pp, Newey-West t 0,74; 0 von 63 Rasterlagen über 2,50 |
| Obergrenzen-Befund 25.08., V0 | obere Grenze 3,373 Pp je Umlauf (überlappend) |
| App (`momentum.js`) | „Parameter gewählt auf 1970–2004, geprüft auf 2005–2026 OHNE Anpassung", 197 Werte, Vorsprung +5,4 Pp p. a. |

**Erwartung, ehrlich vor dem Lauf aus diesen Zahlen abgeleitet:** Der gesehene Brutto-
Überschuss (+1,537 Pp je Umlauf) liegt **unter** der CFD-Hürde (≈ 2,36 Pp, §4). Ein **JA am
CFD-Gefäß ist damit arithmetisch vor dem Lauf ausgeschlossen** — er ist kein Ziel dieser
Messung. Offen ist die Frage **NEIN gegen nicht entscheidbar**: Fällt die Obergrenze unter
die CFD-Hürde? Dafür müsste se unter ≈ 0,42 Pp liegen; bei 0,73 wird sie es nicht. **Erwartet
wird also „nicht entscheidbar" mit einer Obergrenze nahe 3 Pp je Umlauf** — und der
eigentliche Ertrag dieser Studie sind die exakte Obergrenze, die Netto-Zahlen je Gefäß, die
Kontrollen und die Prüfung der Überlebensverzerrung. Wer nach dem Lauf etwas anderes liest,
lese diesen Absatz noch einmal.

## 2. Machbarkeit — VOR der Registrierung gerechnet, konservativ UND realistisch

Formel `wiki/aufloesungswand.md`: **N(d) ≈ N_vorhanden · (delta80 / d)²**, `d` = gesuchte
Kante in Pp je Umlauf, `delta80 = (Schwelle + 0,8416) · se`. Einheiten: delta80 und d in
**Prozentpunkten je Umlauf**, N in **Perioden** (× 63 = Handelstage).

**Haltedauer-Falle, hier der bestimmende Faktor:** 4.975 Bestätigungs-Handelstage ÷ 63 =
**79 unabhängige Perioden.** Mehr gibt es nicht, und die nicht überlappende Anordnung zählt
genau diese 79 — sie *ist* die Falle, ehrlich ausgerechnet, statt 4.975 abhängiger Tage.

**Zwei Rechnungen, weil unsere Planformeln nachweislich zu konservativ waren** (Newey-West
54 % zu konservativ, `studien/momentum-nichtueberlappend/`; geclusterte Planformel Faktor 4,2,
`studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/`):

| | se je Umlauf | delta80 (1,96) | delta80 (2,576, Familie §5) |
|---|---|---|---|
| **konservativ** — überlappend + Newey-West, wie in der Landkarte angesetzt | 1,129 | **3,16 Pp** | 3,86 Pp |
| **realistisch** — nicht überlappend, am 25.08. geeicht | 0,732 | **2,05 Pp** | 2,50 Pp |

Nötige Perioden für eine Kante in Hürdengröße (vorhanden: **79**):

| Hürde `d` | konservativ | realistisch | Befund |
|---|---|---|---|
| **CFD gehebelt ≈ 2,36 Pp** | 79·(3,16/2,36)² = **142** → Faktor 1,8 fehlt → *„nicht messbar"* | 79·(2,05/2,36)² = **60** → vorhanden | **Die konservative Formel erklärt die CFD-Frage für unbeantwortbar; die geeichte sagt: beantwortbar.** Mit Familienschwelle realistisch 89 (Faktor 1,12) — an der Kante. |
| CFD ungehebelt 0,110 Pp | — | 79·(2,05/0,11)² ≈ **27.500 Perioden ≈ 6.900 Jahre** | blind für eine Kante *in Hürdengröße*; diese Frage stellt sich aber nicht so (nächste Zeile) |
| Kassa 0,06 Pp (Annahme) | — | ≈ 92.000 Perioden | dito |
| Kassa, Kante in **Literaturgröße** (1,5 Pp) über der Hürde: d = 1,44 | 79·(3,16/1,44)² = 380 | 79·(2,05/1,44)² = **160** → Faktor 2 fehlt | ein Kassa-JA in Literaturgröße hat realistisch ~50 % Macht — **wird deshalb nur nachrichtlich geführt**, kein Urteil |

**Entscheid aus der Machbarkeit:** Die CFD-Frage wird gemessen (realistisch beantwortbar;
konservativ nicht — beide Zahlen stehen oben, wie verlangt). Die Kassa-Frage wird
nachrichtlich mitgeführt und als Annahme etikettiert (Auftrag §6, kein Broker-Konto). Es
gibt keine Eintrittskarten-Sperre mehr (Entscheid 27.08.: *etikettieren, nicht filtern*).

## 3. Anordnung — eingefroren, nichts optimiert

| | Festlegung | Herkunft |
|---|---|---|
| Archiv | `E:/Markt-Dashboard-Archiv/archiv1d`, Format `[zeit, schluss, umsatz, hoch, tief, eroeffnung]` | wie Eichung |
| Universum | `WP.istAktie` (CS/ADRC, Testkürzel raus), F1-Plausibilität (Sprung > +400 % / < −80 %, Kurs > 100.000 → Reihe raus) | wie Maschine und Eichung |
| Letzte Kerze | je Reihe entfernt (#85, Stempel-Kerzen-Lehre) | Hauskonvention seit 27.08. |
| Merkmal | Rendite von t−252 bis t−21 (**Rückblick 231, Lücke 21**) | App „(geprüft)", `momentum.js` |
| Auswahl | **stärkste 10 %** der zulässigen Werte | App „(geprüft)" |
| Haltedauer | **63 Handelstage**, feste Kalender-Umschichtung | App „(geprüft)" |
| Einstieg / Ausstieg | Schluss am Umschichtungstag t / Schluss an t+63. Fehlt der Schluss an t+63 (Delisting im Fenster): **letzter vorhandener Schluss in (t, t+63]** — der Sterbepfad wird mitgenommen, nicht verworfen | neu gegenüber Eichung (dort: Wert übersprungen); betrifft im Überlebenden-Archiv nur die 5 im August delisteten Namen |
| Vergleich | gleichgewichteter Mittelwert **aller** zulässigen Werte derselben Periode (Basket ist Teil davon) | wie Eichung |
| Mindestbreite | 100 Werte je Periode | wie Eichung |
| Rasterlage | **Phase 0**: erste Umschichtung auf Index 252 der gemeinsamen Zeitachse — keine Wahl, kein Blick; die anderen 62 Lagen nur als Streubild | wie Eichung (B9) |
| Schnitt | 2006-08-14; **Urteil nur auf der Bestätigungshälfte** (Perioden mit Start ≥ Schnitt) | Hauskonvention B5 |
| Kein Parameter-Sweep | Rückblick, Lücke, Haltedauer, Anteil werden **nicht** variiert | `wiki/messmethodik.md` Punkt 8/10 |

Kein geteilter Kurs: das Merkmal endet bei t−21, die Zielgröße beginnt bei t.

## 4. Kosten — nach `wiki/kosten.md`, je Gefäß, K + F·H

| Gefäß | Kosten je Umlauf | Rolle |
|---|---|---|
| **CFD gehebelt** | **K + F · Nächte** = 0,110 + 0,0247 · Kalendernächte(t → t+63); 63 Handelstage ≈ 91 Kalendernächte → **≈ 2,36 Pp**; **je Periode exakt aus dem Kalender gerechnet** | **URTEIL** |
| CFD ungehebelt (1:1) | K = 0,110 (laut Quelle finanzierungsbefreit) | nachrichtlich |
| Kassa-Aktie | **≈ 0,06 Pp — ANNAHME**, nicht gemessen, kein Broker-Konto (Nachtrag `glockendruck-haltedauer`, Referenz 10.000 $) | nachrichtlich, ausdrücklich Annahme |

**Etiketten, die an jeder Kostenzahl hängen:** K = 0,110 trägt *„vorläufig — Freigabeschwelle
unerfüllt"* (16 von 20 Runden aus einer Minute, eine Marktlage) und ist **für Mega-Caps
gemessen** — für ein 2.200er-Universum optimistisch (`wiki/kosten.md`). F beruht auf der
öffentlichen Gebührenformel (SOFR + 4 %)/365. Die Kosten werden **auf jeden Korbwert voll
angesetzt** (Umschlag 100 %); der gemessene tatsächliche Umschlag wird nachrichtlich
ausgewiesen, senkt aber nur K, nicht F·H, und ändert das Urteil nicht.

Die Kosten fallen **je Umlauf** an, der Überschuss ist **je Umlauf** — gleiche Skala, keine
Jahresrechnung (Lehre aus `OBERGRENZEN-BEFUND.md`, „Korrektur einer eigenen Aussage").

## 5. Endpunkt, Testzahl, Schwellen, Entscheidungsregeln

**Primärer Endpunkt (einer):** Netto-Überschuss je Umlauf am CFD-Gefäß,
`netto_p = brutto_p − (K + F · Nächte_p)`, gemittelt über die Bestätigungsperioden bei
Phase 0; se aus der gewöhnlichen Streuung der Perioden (nichts überlappt), `t = Mittel/se`.
Brutto und Obergrenze werden auf derselben Skala ausgewiesen.

**Testzahl: 1** in dieser Registrierung. **Familie und Schwelle:** Die Momentum-Familie der
Maschine (`momentum-2026-08-24`, 4 Varianten, Schwelle 2,50) hat dieselbe Live-Variante auf
denselben Daten schon geprüft; dieser Lauf ist die **fünfte Prüfung derselben Sache** und
wird so gezählt: **Bonferroni bei 5 Tests, |t| ≥ 2,576.** Nominal (1,96) wird daneben
gedruckt, entscheidet aber nicht. Die 63 Rasterlagen sind Streubild, keine Tests.

**Regeln, in dieser Reihenfolge geprüft:**

| Urteil | Bedingung |
|---|---|
| **JA** | Mittel(netto) > 0 **und** t_netto ≥ 2,576 — *wäre ein In-Sample-JA und würde so etikettiert* |
| **NEIN** | Obergrenze des 95-%-Bandes von brutto, `Mittel(brutto) + 1,96 · se`, liegt **unter** der mittleren CFD-Hürde `K + F · Nächte̅` — selbst die optimistischste Kante deckt die Kosten nicht |
| **nicht messbar** | weder JA noch NEIN, und realisiertes `delta80 = (1,96 + 0,8416) · se` > CFD-Hürde |
| **nicht entscheidbar** | sonst |

In jedem Fall wird die **Obergrenze** genannt (95 % zweiseitig; die 2,576-Grenze daneben),
denn sie ist die Aussage, die bleibt.

**Nachrichtlich, kein Urteil, dieselben Regeln formal angewendet:** CFD ungehebelt (Hürde
0,110) und Kassa (Hürde 0,06 — ANNAHME). Beide Zeilen stehen in derselben Tabelle wie das
Urteil, mit ihrem Etikett.

## 6. Pflichtkontrollen — alle VOR dem Blick auf das Urteil, Reihenfolge fest

| Kontrolle | Bauart | Bestanden wenn |
|---|---|---|
| **W0 Reproduktion der Eichung** | Brutto-Überschuss Bestätigung Phase 0 dieses Werkzeugs gegen die Eichung (+1,537 Pp, 79 Perioden) | Abweichung ≤ 0,05 Pp und gleiche Periodenzahl; sonst Halt und Ursache benennen (zulässige Ursachen: #85, Delisting-Ausstieg, 5 Tage mehr Archiv) |
| **Placebo (in derselben Blickzeile)** | je Periode ein **zufälliger** Korb gleicher Größe (10 %) ohne jeden Kursbezug, Saat 20260902, mulberry32 — richtige Antwort null; dazu 200 Ziehungen als Rauschboden | Placebo |t| < 2,576; **sd der 200 Placebo-Mittel ÷ se des Kandidaten ∈ [0,7; 1,4]** (sonst stimmt die Streuungsrechnung nicht) |
| **Positivkontrolle** | Ausstiegskurs jedes Korbwerts × 1,02 (Implantat +2,000 Pp) — läuft durch dieselbe Kette bis zum Netto | Wiederfindung des **analytischen Solls** `2,000 · (1 − Korb/Alle)` je Periode gemittelt (≈ +1,80 Pp, weil der Markt den Korb enthält) auf ±5 % |
| Datenwächter | `tools/archiv-wachhund.js archiv1d` vor dem Lauf; Fingerabdruck des Archivs vor/nach dem Einlesen | Wachhund-Befund wird gedruckt (1 Tag Rückstand ist für 63-Tage-Perioden unerheblich und wird vermerkt, ≥ 2 Tage → Halt); Fingerabdruck unverändert |
| Klassifizierung | `WP.klassifizierungDa()` | sonst Abbruch |

Fällt eine Kontrolle, wird **kein Urteil** gebildet; der Befund wird berichtet.

## 7. Überlebensverzerrung — Prüfung, ob Weg 3 hier überhaupt gilt

**Der Weg-3-Wert (+0,0462 Pp/Tag, t 21,4) ist ÜBER NACHT und UNBEDINGT gemessen** — je Tag, alle
Werte, ohne Auswahl. Der Endpunkt hier ist **bedingt** (stärkste 10 % nach 231-Tage-Rendite)
und **63 Tage lang**, und er ist eine **Differenz** Korb − Markt, in der beide Seiten von
fehlenden Werten betroffen sind. `wiki/ueberlebensverzerrung.md` verbietet das pauschale
Übertragen ausdrücklich (Dip-Familie: −3,78 Pp, also andersherum). **Vor der Messung wird
deshalb kein Vorzeichen unterstellt.**

**Was gemessen wird (nachrichtlich, kein Korrekturwert, kein Urteil):** Auf dem Fenster, in
dem die 1.164 Verschwundenen-Reihen (`massive/tagesdaten`, 2024-08-23 bis 2026-08-28,
CS/ADRC, F1, Beschnitt am Delisting-Datum, #85) Kurse haben, wird dieselbe Regel zweimal
gefahren: **Überlebende allein** und **Vereinigung** (Überlebende + Verschwundene, Rangfolge
und Markt über die Vereinigung). Zulässig sind die Phase-0-Umschichtungen, an denen die
Verschwundenen 252 Tage Vorlauf haben (ab ≈ 2025-08) und t+63 im Fenster liegt — **erwartet
3–4 Perioden.** Ausgewiesen je Periode:

1. Anteil Verschwundener im Universum und **im Korb** (landen sie überproportional im
   stärksten Zehntel?),
2. Überschuss Überlebende allein gegen Vereinigung, Differenz Δ,
3. das **Weg-3-Analogon auf 63 Tagen**: unbedingte 63-Tage-Rendite Verschwundene minus
   Überlebende — trägt das Übernacht-Vorzeichen bis zur Monatshaltedauer?

Dazu, über **alle 63 Lagen** im Fenster (mehr Zeitpunkte, nur für Punkt 1): der mittlere
Korb-Anteil der Verschwundenen gegen ihren Universumsanteil.

**Ergebnis dieser Prüfung wird hingeschrieben, wie es fällt** — mit dem Etikett *„Fenster
2024-08 bis 2026-08, übernahme-dominiert, k Perioden; 2008/09 nicht gemessen"* (wie
`studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md`). Eine Aussage über die Richtung im
Urteilsfenster 2006–2026 ist daraus **nicht** ableitbar; das steht dann so im Ergebnis.

## 8. Nachrichtlich — wird ausgewiesen, entscheidet nichts

- **Ären:** Entdeckungshälfte (< 2006-08-14) und Gesamtspanne, brutto und netto, Phase 0;
  dazu je Jahrzehnt. *Nicht das Urteil* — die Entdeckungshälfte hat den größeren gesehenen
  Überschuss, sie nachträglich hinzuzunehmen wäre Auswahl.
- **63 Rasterlagen:** Minimum / Median / Maximum von brutto, netto-CFD und t; Zahl der Lagen
  mit t_netto ≥ 2,576 — Streubild.
- **Umschlag:** Anteil der Korbwerte, die schon in der Vorperiode im Korb waren.
- **Liquiditätsprofil des Korbs:** Anteil der Korbwerte mit Median-Tagesumsatz (20 Tage vor t)
  ≥ 1 Mrd $, ≥ 100 Mio $, < 5 Mio $ — sagt, für welche Kostenklasse K überhaupt gilt.
  **Keine Ertragsaufteilung nach Liquidität** (wäre ein weiterer Test).
- **Kalendernächte je Periode** (Mittel, Min, Max).

## 9. Sperrliste

Kein Parameter wird verändert · keine weitere Variante · kein Urteil auf Kassa oder
ungehebelt · kein Korrekturwert aus §7 · keine Aussage „Momentum trägt" aus einem
Streubild · kein Wechsel der Rasterlage · keine Jahresrechnung · `massive/universum-2024-09-02.json`
wird nicht angefasst · die Eichungsstudie wird nicht verändert · kein SendMessage, keine
Version.

## 10. Ablauf

1. Diese Registrierung committen (Zeitstempel = Beleg).
2. Werkzeug `messen.js` bauen und committen, **bevor** es auf Erträge läuft.
3. `node messen.js --waechter` — nur Kontrollen (§6), kein Kandidaten-Urteil gedruckt.
4. `node messen.js --lauf` — Kontrollen erneut, dann Urteil; Rohdaten nach `lauf-<zeit>.json`.
5. `ERGEBNIS.md`, Wiki, Kurznotiz, Commit, Push.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
