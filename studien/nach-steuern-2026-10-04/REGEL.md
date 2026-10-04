# REGEL — Nach Steuern: derselbe Rückblick für ein deutsches Privatdepot (Auftrag Nr. 82)

Kennung `nach-steuern-2026-10-04/v1`. Diese Datei ist **vor dem Lauf** geschrieben und mit Code (`steuer.js`) und Tests (`test.js`)
zusammen committet (Siegel). Teil A ist §1 und §5 des Auftrags `uebergabe/auftrag-nach-steuern-2026-10-04.md`, **wörtlich** und
unverändert; §5 (Nachtrag des PM nach dem Zweitleser) geht dem übrigen Text vor. Teil B nennt die Fundstellen. Teil C hält fest, wie der
Code die Stellen liest, die Teil A offen lässt. Teil D nennt die Prüfungen. Nach dem Siegel wird an A, B und C nichts mehr geändert; was
nicht geht, wird gemeldet, nicht angepasst.

**Rechenmodell mit Annahmen, keine Steuerberatung.** Beschreibende Zahlen nach vorher festgelegter Regel, kein Urteil; es entscheidet
Wilhelm. Alles Simulation mit virtuellem Kapital.

## Teil A — das Modell, wörtlich

### §1 Das Modell (vom PM festgelegt, bevor es eine Zahl gibt — nicht ändern; was nicht geht, melden statt anpassen)

**1.1 Gemeinsam.** Steuersatz auf Kapitalerträge **26,375 %** (25 % plus 5,5 % Solidaritätszuschlag, keine Kirchensteuer). Sparer-Pauschbetrag
**0** (bei 100.000 Startkapital eine Rundungsgröße; nützt beiden Seiten gleich). Gerechnet wird mit dem **heutigen** Steuerrecht für alle
Jahre beider Fenster. Alles in Dollar, als wäre es Euro (kein Wechselkurs — benannte Grenze). Kurse, Kosten (20 Basispunkte je Seite),
Fenster, Korb, Startphasen und Reihenende wie in Nr. 78.

**1.2 Das Buch** (Mechanik der App, unverändert — auch ihre Eigenheit, dass bei knappem Bargeld die letzten Käufe verkleinert werden oder
ausfallen, Belegstand „Kleinstpositionen").
- **Ablauf am Ausführungstag:** wie in Nr. 78 **einmal** planen (`planeUmschichtung`); die Verkäufe des Plans ausführen; **die Steuer
  abrechnen** (Bargeld sinkt oder steigt); dann die Käufe des Plans in Rangfolge ausführen — reicht das Bargeld nicht, verkleinert
  `fuehreAus` wie immer. Technisch: `fuehreAus` zweimal rufen (erst nur `verkaufen`, dann nur `kaufen`), dazwischen die Steuer. **Mit
  Steuersatz 0 ist der Ablauf wörtlich der aus Nr. 78** (Selbstprüfung, §2).
- **Verkauf:** Gewinn = Erlös nach Kosten − Einstand mit Kosten (`einstand` × Stück, wie `fuehreAus` ihn führt: Kaufkurs × 1,002).
- **Aktien-Verlusttopf:** Verluste aus Aktienverkäufen werden nur mit Gewinnen aus Aktienverkäufen verrechnet. Innerhalb eines Kalenderjahres
  rechnet die Bank laufend ab: nach jedem Abrechnungsschritt ist die Jahressteuer = max(0, Topf) × Steuersatz, mit Topf = Verlustvortrag
  (≤ 0) + Gewinne − Verluste des Jahres bisher; die Differenz zur bisher im Jahr gezahlten Steuer wird belastet oder erstattet (eine
  Erstattung ist damit nie größer als die im selben Jahr gezahlte Steuer). Ein negativer Topf am Jahresende wird ins nächste Jahr vorgetragen;
  über die Jahresgrenze wird nichts erstattet. Abgerechnet wird je Ausführungstag einmal (alle Verkäufe des Tages zusammen) und bei jedem
  Reihenende.
- **Reihenende** (Abgang einer gehaltenen Aktie): Auszahlung zum letzten Kurs oder Totalverlust wie in Nr. 78; Gewinn oder Verlust geht wie
  ein Verkauf in den Aktien-Verlusttopf (Annahme, benannt), abgerechnet am selben Tag.
- **Ausschüttungen:** bei Gutschrift mit 26,375 % besteuert (netto 73,625 % gutgeschrieben); keine Verrechnung mit dem Aktien-Verlusttopf.
  Zeitpunkt der Gutschrift wie in Nr. 78 (nach dem Handel des Ex-Tags).
- **Zwei Endwerte:** (a) **„bleibt stehen"** — Buchwert am letzten Tag zum Schluss, offene Gewinne unversteuert; (b) **„alles verkauft"** —
  am letzten Tag zum Schlusskurs verkauft, 20 Basispunkte Kosten, Steuer nach den Regeln oben; ein dann verbleibender Verlusttopf verfällt.

**1.3 Der Indexfonds** (thesaurierender S&P-500-Fonds nach europäischem Recht, Sitz Irland — ein Modell, kein bestimmtes Produkt).
- **Anteilswert:** Kursverlauf des SPY aus dem Panel; jede Ausschüttung des SPY (aus `korb.js`, mit der dort ergänzten vom 15.06.2018)
  wird zu **85 %** am Ex-Tag zum Schluss wieder angelegt (15 % Quellensteuer im Fonds); laufende Kosten **0,07 % im Jahr**, je Handelstag
  anteilig abgezogen (Faktor (1 − 0,0007)^(1/252)). Kauf am ersten Tag zur Eröffnung, ohne Kaufkosten (wie der Maßstab in Nr. 74/78 — benannt).
- **Vorabpauschale** je Kalenderjahr J: Basisertrag = Wert der Anteile am ersten Handelstag des Jahres zur Eröffnung (im Kaufjahr: Kaufwert,
  gekürzt um ein Zwölftel für jeden vollen Monat vor dem Kaufmonat) × Basiszins(J) × 0,7; ist der Basiszins nicht positiv, gibt es keine.
  Vorabpauschale = min(Basisertrag, Wertzuwachs der Anteile im Jahr), mindestens 0. Steuerbar sind 70 % davon (Teilfreistellung 30 %);
  Steuer = steuerbar × 26,375 %, fällig am ersten Handelstag des Folgejahres, bezahlt durch Verkauf von Anteilen in Höhe der Steuer zur
  Eröffnung (die Steuer auf diesen Kleinstverkauf wird vernachlässigt — benannt). Liegt der erste Handelstag des Folgejahres nach dem
  Fensterende, fällt sie nicht mehr in die Rechnung.
- **Basiszins** (amtlich; vom PM am 04.10.2026 nachgeschlagen: Schreiben des Bundesfinanzministeriums vom 13.01.2026 für 2026, dazu die
  Übersichten bei steuertipps.de und in der Wikipedia unter „Vorabpauschale"): 2018 0,87 % · 2019 0,52 % · 2020 0,07 % · 2021 −0,45 % ·
  2022 −0,05 % · 2023 2,55 % · 2024 2,29 % · 2025 2,53 % · 2026 3,20 %. Für **2017** gab es die Regelung noch nicht: gerechnet wird mit
  0,59 % (**Annahme des PM, nicht nachgeschlagen**; Wirkung unter 0,1 % des Werts — so in `REGEL.md` und `ERGEBNIS.md` kennzeichnen).
- **Zwei Endwerte:** (a) „bleibt stehen" — Wert der Anteile am letzten Tag zum Schluss; (b) „alles verkauft" — Gewinn = Endwert − Kaufwert
  der noch gehaltenen Anteile − Summe der schon versteuerten Vorabpauschalen (anteilig für die noch gehaltenen Anteile); steuerbar 70 %;
  Steuer 26,375 %; im Verkaufsjahr keine Vorabpauschale. Ein Verlust wird nicht erstattet.

**1.4 Die Läufe — genau diese vier, keine weiteren.** **A-187** und **B-187** (Hauptzahlen), nachrichtlich **A-breit** und **B-breit**
(der breite Korb im Fenster B ist der amtliche Rückblick Nr. 74); alle mit der Mechanik der App. Je Lauf: k = 0 und die 63 Startphasen,
je **vor Steuern** (Steuersatz 0, Fonds = SPY wie in Nr. 78), **nach Steuern (a)** und **nach Steuern (b)**. Die Variante „Gleichgewicht"
ist nicht Teil dieses Auftrags (der Rechner führt die Mechanik aber als Schalter weiter, damit ein späterer Lauf kein Umbau ist).

**1.5 Die Sätze, die am Ende stehen (vorher festgelegt):** je Lauf „Nach Steuern, alles verkauft: Buch … % p. a. gegen Indexfonds … % p. a.,
Abstand … Pp p. a. (vor Steuern … Pp p. a.); in … von 63 Startphasen liegt das Buch vorn (Median des Abstands … Pp p. a., vor Steuern …)."
Dazu je Lauf: gezahlte Steuer des Buchs in Dollar und als Unterschied in Pp p. a. zwischen „vor Steuern" und „nach Steuern (b)", dasselbe
für den Fonds; Zahl der Käufe, die wegen der Steuer verkleinert wurden oder ausfielen (Zähler: voll / verkleinert / unter 5 % des Budgets /
ausgefallen — je vor und nach Steuern). Kein Urteil, kein „lohnt sich".

**1.6 Ein Lauf.** `REGEL.md` (dieser §1 wörtlich, dazu deine Lesarten), Code und Tests committen (**Siegel-Commit**), dann die vier Läufe
in einem Durchgang, dann Ergebnis committen. Ein Fehler im Code wird benannt, behoben, wiederholt und unter `korrekturen` vermerkt. Ein
Ergebnis, das nicht gefällt, ist kein Fehler.

### §5 Nachtrag des PM nach dem Zweitleser (04.10.2026) — geht dem Text oben vor

**5.1 Die Vorabpauschale ist richtig beschrieben — die 0,7 stehen zweimal da, und beide gelten.** Das erste 0,7 gehört zum Basisertrag
(Wert am Jahresanfang × Basiszins × 0,7, Investmentsteuergesetz § 18), das zweite ist die Teilfreistellung für Aktienfonds (30 % der
Vorabpauschale bleiben steuerfrei, § 20). Der Zweitleser hielt das für einen Fehler; es ist keiner. **Rechenprobe (gehört in `test.js`):**
Wert 50.000, Basiszins 3,20 % → Basisertrag und Vorabpauschale 1.120,00 → steuerbar 784,00 → Steuer 206,78 (so auch ein veröffentlichter
Rechner, vom PM am 04.10.2026 nachgeschlagen).

**5.2 Woher die Sollwerte der Selbstprüfung kommen.** A-187, B-187, A-breit: `studien/momentum-korb-2026-10-04/ergebnis.json` →
`laeufe[<Name>].haupt.buchEnde` / `.spyEnde`, die 63 Phasen unter `laeufe[<Name>].zufallsbereich.startphasen`. **B-breit** (breiter Korb,
Fenster B = der amtliche Rückblick Nr. 74) ist in dieser Datei kein eigener Lauf: k = 0 steht dort unter `selbstpruefung.buchEnde`
(165.209,66) und `.spyEnde` (181.193,87); die 63 Phasen stehen in `studien/massstab-rueckblick-2026-10-04/ergebnis.json` unter
`zufallsbereich.startphasen`. Die Namen der Felder in den Phasenlisten dort nachsehen, nicht raten.

**5.3 Kleinstpositionen (Nr. 85).** Wilhelm hat am 04.10.2026 entschieden, die Kleinstpositionen im Buch abzustellen. Das ändert diesen
Auftrag nicht: gerechnet wird mit der Mechanik, wie sie in Nr. 78 gemessen wurde. Dein Rechner ruft Planung und Ausführung aber an genau
einer Stelle (die Funktionen der App), damit ein späterer Nachlauf mit der berichtigten Mechanik kein Umbau ist.

## Teil B — Fundstellen und gelesene Konstanten

| Größe | Wert | Fundstelle |
|---|---|---|
| Rechner, auf dem aufgebaut wird | `zielAm` (Zielliste, Korb der 187), `Massnahmen` mit der SPY-Ergänzung vom 15.06.2018, `fensterTage`, `spyKlinken`, `FENSTER`, `KORB_N` — nur gerufen | `studien/momentum-korb-2026-10-04/korb.js` (Nr. 78) |
| amtlicher Rechner | `vorbereiten`, `ausschuettungenAm`, `median`, `START`, `KOSTEN_BP`, `PHASEN`, `MASSSTAB`, Panel-Ordner — nur gerufen | `studien/massstab-rueckblick-2026-10-04/rueckblick.js` (Nr. 74) |
| Buch der App | `planeUmschichtung`, `fuehreAus`, `bewerte`, `buchKonfig` — nur gerufen, an **einer** Stelle (`handel()` in `steuer.js`) | `mfhandel.js` Z. 97–171 |
| Einstand einer Position | Kaufkurs × 1,002 (`einstand: o.kurs * (1 + k)`) | `mfhandel.js` Z. 152 |
| Gewinn eines Verkaufs in der App | `erloes - p.stueck * p.einstand`, auf Cent gerundet als `pnl` | `mfhandel.js` Z. 135–138 |
| Verkleinern eines Kaufs | `floor(bargeld / (kurs × 1,002) × 10000) / 10000` Stück; 0 Stück = kein Kauf | `mfhandel.js` Z. 144–150 |
| Budget eines Kaufs | Depotwert zu Eröffnungskursen / Zielzahl (`plan.kaufen[i].budget`) | `mfhandel.js` Z. 118–120 |
| Startkapital / Kosten / Startphasen / Korb | 100.000 / 20 Basispunkte je Seite / 63 / 187 | Nr. 74 und Nr. 78 |
| Fenster | A: 04.01.2017–15.09.2021 (1.183 Handelstage, 18 SPY-Ausschüttungen), B: 16.09.2021–15.09.2026 (1.254, 20) | `korb.js` `FENSTER` |
| Sollwerte der Selbstprüfung | A-187, B-187, A-breit: `laeufe[<Name>].haupt.buchEnde` / `.spyEnde`, Phasen unter `.zufallsbereich.startphasen.phasen` (Felder `k`, `start`, `buchGesamt`, `spyGesamt`, …; keine Endwerte je Phase, der Endwert ist 100.000 × (1 + Gesamt / 100)) | `studien/momentum-korb-2026-10-04/ergebnis.json` |
| Sollwerte B-breit | k = 0: `selbstpruefung.buchEnde` 165.209,66 / `.spyEnde` 181.193,87 (Nr. 78); die 63 Phasen: `zufallsbereich.startphasen.phasen` (Nr. 74, dieselben Felder) | Auftrag §5.2 |
| Steuersatz | 0,26375 (= 0,25 × 1,055) | Auftrag §1.1 |
| Basiszins | 2017 0,59 % (**Annahme des PM, nicht nachgeschlagen**; Wirkung unter 0,1 % des Werts) · 2018 0,87 % · 2019 0,52 % · 2020 0,07 % · 2021 −0,45 % · 2022 −0,05 % · 2023 2,55 % · 2024 2,29 % · 2025 2,53 % · 2026 3,20 % | Auftrag §1.3 |
| Zählung des PM zu den Kleinstpositionen (vor Steuern, alle 63 Phasen; voll / verkleinert / unter 5 % / ausgefallen) | A-187 10.106 / 983 / 318 / 1.064 · A-breit 24.170 / 1.021 / 705 / 6.554 · B-187 10.051 / 1.043 / 466 / 1.993 — nur zum Vergleich mit dem Zähler dieses Rechners, ändert keine Zahl | `wiki/belegstand.md`, Abschnitt Rückblick über fünf Jahre |

## Teil C — Lesarten des Codes (vor dem Lauf festgelegt)

1. **Aufbau.** `steuer.js` enthält eine eigene Kopie des Nachlaufs `simuliere` aus Nr. 78 (dieselben sechs Schritte in derselben
   Reihenfolge, dieselben Ausdrücke) mit der Steuerschicht. Zielliste, Korb, Maßnahmen, Fenster und Klinken werden aus `korb.js` und
   `rueckblick.js` gerufen; diese Dateien, das Panel und `mfhandel.js` werden nicht geändert. Planung und Ausführung der App stehen an
   genau einer Stelle (`handel()`): `planeUmschichtung` einmal, `fuehreAus` zweimal (erst nur `verkaufen`, dann nur `kaufen`), dazwischen
   die Steuer. Mit Steuersatz 0 ist das Zug um Zug der Ablauf aus Nr. 78 (`fuehreAus` führt selbst erst alle Verkäufe, dann alle Käufe aus).
2. **Reihenfolge an einem Handelstag.** Jahreswechsel des Verlusttopfs (erster Handelstag eines neuen Kalenderjahres, vor allem anderen) →
   (1) Reihenende ausbuchen, alle Reihenenden des Tages zusammen abrechnen → (2) Ausschüttungen des Ex-Tags ermitteln (Stückzahl über die
   Nacht) → (3) am Ausführungstag: einmal planen, Verkäufe, Steuer abrechnen, Käufe → (4) Ausschüttungen netto gutschreiben → (5) Maßstab
   SPY wie in Nr. 78 → (6) Bewertung zum Schluss. Das Budget der Käufe steht also fest, bevor die Steuer des Tages bekannt ist; fehlt
   danach Bargeld, verkleinert `fuehreAus` die Käufe in Rangfolge oder lässt sie ausfallen.
3. **Gewinn eines Verkaufs** = `stueck × kurs × 0,998 − stueck × einstand`, ungerundet in den Topf (derselbe Ausdruck wie `pnl` der App;
   Klinke: auf den Cent gleich dem `pnl`, das `fuehreAus` schreibt). **Reihenende:** Gewinn = Gutschrift (letzter Kurs × Stück, ohne
   Kosten; bei Totalverlust 0) − `stueck × einstand`.
4. **Aktien-Verlusttopf.** Das Kalenderjahr ist das des Handelstags, an dem gebucht wird (ein Reihenende zählt in das Jahr des
   Ausbuchungstags). Je Abrechnungsschritt: Jahressteuer = max(0, Vortrag + Gewinne − Verluste des Jahres) × 26,375 %; belastet oder
   erstattet wird die Differenz zur im Jahr schon gezahlten Steuer. Am Jahreswechsel: ein negativer Topf wird ohne Grenze vorgetragen,
   ein positiver nicht; gezahlte Steuer des alten Jahres bleibt gezahlt. Klinke: das Bargeld wird durch die Steuer nie negativ.
5. **Ausschüttungen des Buchs:** netto = brutto × (1 − 0,26375), gutgeschrieben nach dem Handel des Ex-Tags wie in Nr. 78; die Steuer
   zählt in das Jahr des Ex-Tags; der Aktien-Verlusttopf bleibt unberührt (auch ein Verlustvortrag mindert sie nicht).
6. **Zähler der geplanten Käufe (§1.5)** — vier getrennte Fächer, ihre Summe ist die Zahl der geplanten Käufe (`plan.kaufen`):
   **voll** (ausgeführte Stückzahl = geplante), **verkleinert** (weniger Stück als geplant, Volumen Stück × Kurs mindestens 5 % des
   Budgets), **unter 5 % des Budgets** (weniger Stück als geplant und Volumen unter 5 % des Budgets), **ausgefallen** (0 Stück). Ziele
   ohne Eröffnungskurs sind keine geplanten Käufe und werden nicht gezählt. Berichtet je Lauf für k = 0 und als Summe über die 63
   Startphasen, je vor Steuern (Steuersatz 0) und nach Steuern. „Wegen der Steuer" ist der Unterschied der beiden Zählungen; die beiden
   Bücher gehen nach dem ersten besteuerten Verkauf eigene Wege, eine Zuordnung Kauf für Kauf gibt es nicht.
7. **Endwerte des Buchs.** (a) „bleibt stehen" = Buchwert zum Schluss des letzten Tags aus `bewerte` (auf Cent). (b) „alles verkauft" =
   Bargeld + Σ Stück × Schlusskurs × 0,998 − Abrechnung; fehlt einer Position am letzten Tag die Zeile, gilt ihr letzter Schlusskurs
   (wie bei der Bewertung). Die Gewinne und Verluste gehen in den Topf des letzten Jahres, es folgt **ein** Abrechnungsschritt — er
   kann eine Erstattung sein (höchstens die im letzten Jahr gezahlte Steuer); ein dann noch negativer Topf verfällt. Das Buch selbst
   bleibt dabei unverändert. „Vor Steuern" ist die Zahl aus Nr. 78 / Nr. 74 (nicht verkauft); der Abstand von „vor Steuern" zu (b)
   enthält deshalb auch die 20 Basispunkte des Endverkaufs (nachrichtlich ausgewiesen).
8. **Der Indexfonds.** Anteilswert = SPY-Kurs × f, f = 1 beim Kauf. Kauf am ersten Tag zur Eröffnung: 100.000 / Eröffnungskurs
   Anteile, ohne Kosten; auch der Verkauf am Ende und die Steuerverkäufe sind ohne Kosten (der Auftrag nennt keine). Ausschüttungen des
   SPY mit Ex-Tag **nach** dem Kauftag (wie beim Maßstab in Nr. 78; Betrag je Stück aus derselben Funktion, mit der Ergänzung vom
   15.06.2018): f × (1 + 0,85 × Betrag / Schlusskurs) am Ex-Tag. Laufende Kosten: f × (1 − 0,0007)^(1/252) an **jedem** Handelstag des
   Laufs zum Schluss, der Kauftag eingeschlossen. Fehlt dem SPY im Fenster eine Zeile, bricht der Lauf ab (Klinke).
9. **Vorabpauschale im Ablauf.** Am ersten Handelstag eines neuen Kalenderjahres, zur Eröffnung, in dieser Reihenfolge: (i) die
   Vorabpauschale des abgelaufenen Jahres J: Basisertrag = Jahresanfangswert × Basiszins(J) × 0,7 (ist der Basiszins nicht positiv: 0);
   Wertzuwachs = Wert der gehaltenen Anteile zum letzten Schluss des Jahres J − Jahresanfangswert; Vorabpauschale = min(Basisertrag,
   Wertzuwachs), mindestens 0; steuerbar 70 %; Steuer 26,375 %. (ii) Die Steuer wird durch Verkauf von Anteilen zum Anteilswert der
   Eröffnung bezahlt (Eröffnungskurs × f vom Vortag). (iii) Der **Jahresanfangswert des neuen Jahres** ist der Wert der danach noch
   gehaltenen Anteile zu diesem Eröffnungswert — die für die Steuer verkauften Anteile sind am Jahresende nicht mehr da und tragen
   keine Vorabpauschale. Im **Kaufjahr** ist der Jahresanfangswert der Kaufwert (100.000) und der Basisertrag wird mit
   (13 − Kaufmonat) / 12 gekürzt (Januar 12/12, September 4/12, Dezember 1/12). Für das **letzte Kalenderjahr** des Fensters gibt es
   keine Vorabpauschale (Fälligkeit nach dem Fensterende; im Verkaufsjahr keine). Fehlt ein Basiszins, bricht der Lauf ab.
10. **Endwerte des Fonds.** (a) Anteile × Anteilswert zum letzten Schluss. (b) Gewinn = (a) − Anteile × Kaufkurs − Σ über die Jahre
    (Vorabpauschale des Jahres je damals gehaltenem Anteil) × noch gehaltene Anteile; Steuer = max(0, Gewinn) × 0,7 × 26,375 %; ein
    Verlust wird nicht erstattet. Die Steuer auf die kleinen Steuerverkäufe wird vernachlässigt (Auftrag).
11. **Drei Lesarten je Startphase.** *Vor Steuern:* Nachlauf mit Steuersatz 0 gegen den Maßstab SPY wie in Nr. 78 (volle Wiederanlage,
    ohne Kosten). *Nach Steuern (a):* Buch (a) gegen Fonds (a). *Nach Steuern (b):* Buch (b) gegen Fonds (b). p. a. wie in Nr. 74 / 78
    (Kalenderzeit vom ersten Ausführungstag bis zum letzten Tag, auf 100.000). „Vorn" heißt strikt Endwert Buch > Endwert Fonds. Median
    über die 63 Abstände. Der Satz aus §1.5 nennt für k = 0 Buch, Fonds und Abstand nach (b) und den Abstand vor Steuern, dazu die Zahl
    der Phasen vorn nach (b) und die Mediane nach (b) und vor Steuern.
12. **Steuer in Dollar und als Unterschied (§1.5).** Buch: laufend gezahlt (Aktiensteuer netto je Jahr plus Steuer auf Ausschüttungen)
    und beim Endverkauf; Fonds: Steuer auf die Vorabpauschalen und beim Endverkauf. Unterschied = p. a. vor Steuern − p. a. nach
    Steuern (b), für Buch und Fonds, k = 0. Nachrichtlich, ohne weiteren Lauf: der Teil des Fonds-Unterschieds, der keine deutsche
    Steuer ist (Fonds mit 85 % Wiederanlage und Kosten, aber Steuersatz 0), und beim Buch der Teil aus den Kosten des Endverkaufs.
13. **Selbstprüfung (§2, §5.2).** Vor den Läufen: k = 0 mit Steuersatz 0 für alle vier Läufe auf den Cent gegen die Sollwerte, sonst
    kein Lauf. Im Lauf wird zusätzlich **jede** der 4 × 63 Startphasen vor Steuern mit Nr. 78 / Nr. 74 verglichen (Endwert Buch und SPY
    auf den Cent; bei einer Abweichung bricht der Lauf ab). `test.js` prüft k = 0 Tag für Tag gegen den Rechner aus Nr. 78 und drei
    zufällig gezogene Phasen je Lauf (Zufallsgenerator mulberry32, Startwert 82).
14. **Mechanik „Gleichgewicht"** bleibt als Schalter im Rechner (eigene, in Verkäufe und Käufe geteilte Fassung derselben Ausdrücke wie
    in Nr. 78, Teilverkäufe gehen mit ihrem Gewinn in den Topf); sie ist kein Lauf dieses Auftrags. Geprüft ist nur: mit Steuersatz 0
    gleich Nr. 78, und ein Kunstfall mit Steuer.
15. **Benannte Grenzen des Modells (aus Teil A, nichts davon wird angepasst):** kein Wechselkurs; heutiges Steuerrecht für alle Jahre;
    kein Sparer-Pauschbetrag, keine Kirchensteuer; Reihenende wie ein Verkauf; Steuer auf die Steuerverkäufe des Fonds vernachlässigt;
    Fonds ohne Kauf- und Verkaufskosten; Basiszins 2017 eine Annahme des PM. Bekannte Mängel des Panels (Nr. 72) sind nicht behoben.

## Teil D — Prüfungen vor dem Lauf (`test.js`, 160 Prüfungen, vor dem Siegel grün)

- **Aktien-Verlusttopf von Hand:** ein Gewinnverkauf (Steuer = Gewinn × 26,375 %); Verlust nach Gewinn im selben Jahr (Erstattung,
  höchstens das Gezahlte); Verlust vor Gewinn (Verrechnung); Verlustvortrag über die Jahresgrenze (keine Erstattung, Verrechnung im
  Folgejahr; ein positiver Topf wird nicht vorgetragen); Steuersatz 0; die vier Fächer des Zählers mit der Grenze bei genau 5 %.
- **Kunstpanel (dasselbe wie in Nr. 78):** mit Steuersatz 0 jeder Tageswert (Buch, SPY, Bargeld) gleich dem Rechner aus Nr. 78 —
  Grundfall, Ausschüttungen, Reihenenden, je mit der Mechanik der App und „Gleichgewicht". Mit Steuer von Hand: Gewinnverkauf; die
  Steuer steht zwischen Verkäufen und Käufen (der letzte Kauf schrumpft um den Steuerbetrag); Ausschüttung netto 73,625 % ohne Einfluss
  auf den Topf, auch nach einem Aktienverlust; Reihenende mit Gewinn, Reihenende mit Verlust nach Gewinn (Erstattung gedeckelt),
  Verlust vor Gewinn, Verlustvortrag, keine Erstattung über die Jahresgrenze; ein ausgefallener Kauf im Zähler; Endverkauf (b) mit
  Gewinn und mit verfallendem Verlusttopf; „Gleichgewicht" mit Steuer aus Teilverkäufen.
- **Indexfonds von Hand:** die Rechenprobe aus §5.1 (50.000 / 3,20 % → 1.120,00 → 784,00 → 206,78); Jahr mit positivem Basiszins und
  größerem Zuwachs; Jahr mit kleinerem Zuwachs (Deckel); Verlustjahr (0); negativer Basiszins (0); Zwölftel-Regel (September 4/12,
  Januar 12/12, Dezember 1/12); Fälligkeit nach dem Fensterende (fällt weg); Endverkauf mit anteiligem Abzug der Vorabpauschalen;
  Verlust beim Endverkauf (keine Erstattung); Wiederanlage zu 85 %, Ausschüttung am Kauftag zählt nicht; laufende Kosten (252
  Handelstage = genau 0,07 %); fehlender Basiszins bricht ab; der Fonds ohne Steuer, Kosten und Abschlag ist der Maßstab aus Nr. 78.
- **Trockenlauf des ganzen Berichts am Kunstpanel:** 63 Phasen in drei Lesarten, vor Steuern bitgleich mit `startphasen` aus Nr. 78;
  die Selbstprüfung bricht ab, wenn eine Phase um einen Dollar oder k = 0 um einen Cent abweicht; vier Sätze nach §1.5, eine Tabelle
  mit zwölf Zeilen, der Pflichtsatz, keine verbotenen Wörter.
- **Echtes Panel, nur Steuersatz 0** (vor dem Siegel entsteht kein Ergebnis nach Steuern): k = 0 der vier Läufe auf den Cent gleich
  Nr. 78 / Nr. 74 und Tag für Tag gleich dem Rechner aus Nr. 78; je Lauf drei zufällig gezogene Startphasen (A-187: 47, 52, 33 ·
  B-187: 40, 32, 23 · A-breit: 58, 24, 22 · B-breit: 41, 28, 58) gleich den Sollwerten; der Schalter „Gleichgewicht" bei Steuersatz 0
  gleich A-187-gleich und B-187-gleich aus Nr. 78; die SPY-Reihe des Fonds (1.183 / 1.254 Tage, 18 / 20 Ausschüttungen) und der Fonds
  ohne Abzüge gleich dem SPY-Endwert aus Nr. 78; Kalenderjahre mit Fälligkeit im Fenster: A 2017–2020, B 2021–2025.
