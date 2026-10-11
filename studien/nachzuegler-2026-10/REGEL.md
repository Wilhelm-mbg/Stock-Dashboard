# Nachzügler-Studie (Nr. 109) — Regel

**Stand:** 11.10.2026, Studien-Chat. **Siegel 1** = der Commit, der diese Datei, `lesen.js` (Sperre) und `test.js` (Gegenprobe)
zuerst ins Repo bringt — vor jedem Lauf auf echten Daten. **Siegel 2** = der Commit von `KANDIDATEN.json` nach der Entdeckung.
Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Die Regel — wörtlich aus `wiki/entscheide.md` (letzter Eintrag, Commits `bb70ef8` und `faf6adb`)

Der folgende Block ist zeichengleich übernommen; `test.js` vergleicht ihn mit dem Eintrag in `wiki/entscheide.md` (Stand `faf6adb`).

- **Nachzügler-Studie (Nr. 109) — festgeschrieben vor dem ersten Lauf (Wilhelm, Auftrag als Nachricht, 11.10.2026; Parameter vom PM gesetzt um 08:37):** Ereignis bei Aktie A, gemessen wird nur die verknüpfte Aktie B (H1) bzw. das Paar B − A (H2); die Rendite von A ist nie Ergebnisgröße. Bereits Gemessenes (Donchian 20/55 Tagesbasis, Eröffnungsspanne und Donchian 1m/5m/15m, Vortageshoch, Gap-and-Go) wird nicht wiederholt.
  - **Daten:** Panel v2.3 (`voll-v23c`, Kennung `PANEL_KENNUNG_V23`), Umsatz in Dollar; 8-K Item 2.02 und SIC aus `E:/Markt-Dashboard-Archiv/edgar-submissions/cik/*.json` (Feld `k8`, Annahmezeit `t`, Items `i`; ab 09/2015); Abgangsgründe aus der Gründe-Tafel v2.1 (Nr. 92). Kein Yahoo, kein Bigdata.
  - **Zeiträume:** Entdeckung bis 30.12.2022 (Ereignisse ab dem ersten Tag mit 250 Vortagen, also praktisch ab 2017); Prüfung ab 01.01.2023, im Code gesperrt bis zum Siegel-Commit der Kandidatenliste (Hash wird geprüft; Gegenprobe ohne Siegel muss scheitern).
  - **Auslöser bei A (je Richtung getrennt):** E1 Schluss über dem höchsten / unter dem tiefsten **Schluss** der vorigen 20 Handelstage (das Panel führt kein Hoch/Tief); E2 dasselbe mit 55 Tagen; E3 8-K Item 2.02, Reaktion = Rendite von A minus SPY vom letzten Schluss vor der Annahme bis zum ersten Schluss danach, Schwelle **|Reaktion| ≥ 2 × Standardabweichung der Tagesrenditen von A über die 60 Handelstage davor**. Das Ereignis steht bei allen drei am **Schluss** dieses Tages fest; Einstieg von B zur **Eröffnung des nächsten Handelstags**. Je A und Auslöser höchstens ein Ereignis in 20 Handelstagen (Sperrfrist).
  - **Verknüpfung:** V1 gleiche **SIC-Gruppe auf drei Stellen**, alle Mitglieder im Universum; V2 die **5** Aktien mit der höchsten Korrelation der Tagesrendite minus Beta × SPY über **250 Handelstage**, berechnet am letzten Handelstag des Vormonats (nur Daten davor), mindestens 200 gemeinsame Tage. B ausgeschlossen (getrennt ausgewiesen): eigenes 8-K Item 2.02 am Ereignis- oder Einstiegstag, eigener Auslöser derselben Art und Richtung am Ereignistag. Dasselbe B am selben Tag zählt einmal.
  - **Universum:** A und B mit Umsatzklasse ab 5 Mio $ (Klassen des Prüfstands); für H2 A nur aus den Klassen 250–1.000 und ab 1.000 Mio $.
  - **Hypothesen:** H1 B in Ereignisrichtung (long bei Aufwärts-, short bei Abwärtsereignis), Überschuss gegen den Topf aus **unverknüpften** Aktien derselben Umsatzklasse und desselben Einstiegstags (ohne A und alle B dieses Ereignisses); H2 B in Ereignisrichtung minus A dagegen. Leihkosten der Leerverkaufsseite Grundannahme **1 % p. a.**, Empfindlichkeit 0 und 3 %.
  - **Haltedauern:** Schluss des Einstiegstags, Schluss +1, +5, +20 Handelstage danach.
  - **Kosten:** volle Kassa-Hürde je Umsatzklasse (0,157 / 0,085 / 0,065 / 0,045 Pp je Umlauf), bei H2 für A und B.
  - **Konfigurationszahl:** 3 Auslöser × 2 Richtungen × 2 Verknüpfungen × 2 Hypothesen × 4 Haltedauern × 4 Umsatzklassen von B = **384**.
  - **Kandidat (Entdeckung):** netto > 0, t ≥ 2 mit nach Datum gruppiertem Standardfehler, Tor 1 wie im Belegstand, Placebos (a) zufällige Ereignistage gleicher Tagesverteilung, (b) zufälliges unverknüpftes B derselben Klasse, (c) Ereignis um 20 Handelstage verschoben — Placebo-Verstoß nur bei |t| ≥ 2 **und** einer Größe von mindestens einem Viertel der Hürde der Klasse. Erwartete Zufallstreffer bei t ≥ 2 einseitig: höchstens rund **9** von 384 (Obergrenze, die Konfigurationen hängen zusammen).
  - **Belegt (Prüfung ab 2023):** gleiche Richtung, netto > 0 und Holm-Bonferroni über **alle 384** (Familienfehler 5 %, einseitig; die erste Schwelle z ≈ 3,65). Erwartete Zufallstreffer danach unter **0,05**. Übernahme- und Insolvenz-Abgänge von B innerhalb der Haltedauer in eigener Zeile, nicht im Hauptergebnis; je Klasse von B und je Kalenderjahr, 2020 und 2022 zusätzlich ohne sie.
  - **Nachtrag 1 zur Nachzügler-Studie (PM, 08:46, nach dem Zweitleser, vor jedem Lauf; Konfigurationszahl bleibt 384):** (1) **Kosten:** eingestiegen wird zur Eröffnung, ausgestiegen zum Schluss — Hürde je Umlauf = halbe Spanne des Eröffnungs- plus halbe Spanne des Schlussfensters aus `wiki/kosten.md` (Tabelle „eroeffnung / mitte / schluss"): **0,221 / 0,102 / 0,074 / 0,055 Pp** (5–50 / 50–250 / 250–1.000 / ab 1.000 Mio $); die Kassa-Hürde K (0,157 / 0,085 / 0,065 / 0,045) nur als Vergleichszeile. (2) **E3-Zeitpunkt:** Annahme vor 16:00 an einem Handelstag → Reaktion bis zum Schluss dieses Tages; sonst bis zum Schluss des nächsten Handelstags; Einstieg von B immer zur Eröffnung danach (die Reaktion liegt so stets vor dem Einstieg). (3) **Umsatzklasse** von A und B: Spalte `klasse` des Panels am Einstiegstag (60 Vortage). (4) **Standardfehler:** nach Einstiegsdatum gruppiert, bei überlappenden Haltedauern (+5, +20) mit Hansen-Hodrick-Korrektur wie in der Trendkanal-Studie. (5) **Kandidat** braucht beides: t ≥ 2 und Tor 1 des Belegstands. (6) **Pilot** darf nur technische Fehler beheben (Daten, Code), nie Schwellen oder Parameter dieses Eintrags; jede Änderung als Nachtrag mit Commit. (7) **Sperre:** die Studie liest das Panel nur über eine Lese-Funktion des Studienordners; sie gibt Tage ab 01.01.2023 nur frei, wenn `KANDIDATEN.json` in einem Commit liegt und seither unverändert ist (`git log -1 -- KANDIDATEN.json` plus `git diff --quiet <hash> -- KANDIDATEN.json`); der Test prüft auch, dass im Studienordner kein anderer Panel-Zugriff steht.

## 2. Ergänzungen — nur, was die Regel offenlässt (jede mit Begründung)

Nichts hier ändert eine Zahl der Regel. Die Konfigurationszahl bleibt **384**.

**Z1 Kürzel → CIK.** (1) Genauer Reihenname in `studien/fundamental-machbarkeit-2026-09-16/fundamentaltafel/_reihen.json`
(Feld `cik`); (2) sonst die Zeile der Gründe-Tafel v2.1 (`studien/datenfundament-2026-10-04/tafel-v2/verschwundene-gruende-v21.json`),
deren `panel.reihe` gleich dem Reihennamen ist, mit `cik` ≠ null; (3) sonst keine CIK. **Kein Rückgriff auf den Grundnamen** einer
Reihe `X~2`: hinter `~N` steht oft ein neu vergebenes Kürzel (andere Firma). *Begründung:* dieselben Quellen, mit denen die
Drift-Studie und die Gründe-Tafel arbeiten; falsche CIK wäre schlimmer als keine. Ohne CIK: weder V1 (als A oder B) noch E3; E1, E2
und V2 gelten unverändert.

**Z2 SIC und 8-K.** SIC = Feld `sic` der Datei `E:/Markt-Dashboard-Archiv/edgar-submissions/cik/<CIK10>.json`; Gruppe = die ersten drei
Ziffern einer vierstelligen SIC; leer, `0000` oder nicht vierstellig ⇒ keine Gruppe. Das ist die **heutige** SIC der Firma, nicht die
damalige (Grenze der Quelle, im Ergebnis genannt). 8-K = Einträge in `k8` mit `f` gleich `8-K` (keine Berichtigungen `8-K/A`: sie
sind keine neue Nachricht; so auch die Drift-Studie) und `2.02` unter den Items `i`. Annahmezeit `t` ist echte Weltzeit (Zeitprüfung
Nr. 80, `studien/ergebnis-drift-ereignis-2026-10-04/zeitpruefung.json`: 10 von 10) und wird nach New York umgerechnet.

**Z3 Gleiche Firma ist nie B.** Hat B dieselbe CIK wie A (zwei Aktiengattungen, z. B. GOOG/GOOGL), ist B ausgeschlossen — in V1 und
V2, auch als Kandidat der Korrelationsliste. *Begründung:* die zweite Gattung ist A in anderer Verpackung; die Regel sagt „die Rendite
von A ist nie Ergebnisgröße".

**Z4 Zulässig (A am Ereignistag D; B und Topf ebenso).** Der Universumsfilter des Prüfstands (`universum(T, D, {klassen:[0,1,2,3]})`):
keine Referenzreihe, Quelle rein, Cent-Boden der Klasse, ≥ 250 Vortage der Reihe, kein Stempeltag, keine Kapitalmaßnahme nah,
Dichte erfüllt, Eröffnungskurs am Einstiegstag. Dazu: `klasse` der Zeile am **Einstiegstag** (Nachtrag 1 (3)) ist 0–3; sie bestimmt
die Klasse von B, die Hürde und die Topfzelle. *Begründung:* „250 Vortage" steht in der Regel; der Rest ist die Prüfstand-Konvention,
gleich für B und Topf, damit beide dieselbe Grundgesamtheit haben.

**Z5 Ertrag.** Einstiegstag e = nächster Handelstag mit Panelzeilen nach D. Ertrag in Pp = (1 + `renditeOC` der Zeile e) ×
Π (1 + `rendite`) über die Zeilen der Reihe mit Tag in (e, e+h] − 1, h ∈ {0, 1, 5, 20} Handelstage des Kalenders (Konvention `halte`
des Prüfstands, Kurse bereinigt, ohne Ausschüttungen). Endet die Reihe vor e+h, ist das ein **Abgang** (Z15). Fehlt nur die Zeile am
Tag e+h, zählt der letzte Schluss davor. Ist eine Rendite im Fenster nicht endlich, fällt die Beobachtung weg (gezählt).

**Z6 Zeiträume.** Entdeckung = Beobachtungen mit **Ausstieg** e+h ≤ 30.12.2022 (die Sperre lässt spätere Zeilen nicht lesen);
Prüfung = Einstieg e ≥ 03.01.2023 (erster Handelstag ab 01.01.2023) und e+h ≤ letzter voller Panel-Tag. Was am Jahreswechsel
dazwischen liegt (Einstieg 2022, Ausstieg 2023), gehört zu keinem Zeitraum. *Begründung:* kein Ergebnisanteil aus der Prüfzeit in der
Entdeckung.

**Z7 Auslöser.** E1/E2: bereinigter Schluss von D **echt größer** als das Maximum (bzw. **echt kleiner** als das Minimum) der bereinigten
Schlüsse der 20 (55) vorigen Zeilen der Reihe; D selbst ist nicht im Vergleichsfenster. E3: Reaktionstag R nach Nachtrag 1 (2) —
Annahme an einem Handelstag vor dem Handelsschluss ⇒ R = dieser Tag; sonst R = nächster Handelstag. „Vor 16:00" gilt an
verkürzten Handelstagen als „vor 13:00" (dem Schluss laut Kalender): eine Meldung um 14:00 eines Halbtags liegt nach dem Schluss, die
Reaktion bis „zum Schluss dieses Tages" enthielte sie nicht. Reaktion = `rendite` von A in der Zeile R minus Rendite von SPY über
dieselbe Spanne (Schluss der vorigen Zeile von A bis Schluss R). Schwelle: Stichproben-Standardabweichung (n − 1) der `rendite` der
60 Zeilen von A vor R, mindestens 50 endliche Werte, sonst kein Ereignis. Mehrere 2.02-Meldungen mit demselben R ⇒ ein Kandidat.
Richtung = Vorzeichen der Reaktion. D = R. Hat eine CIK mehrere Reihen mit Zeile an R (Gattungen), ist jede ein eigenes A.

**Z8 Sperrfrist.** Je (A, Auslöser, Richtung), in zeitlicher Reihenfolge, nur zulässige Ereignisse (Z4) zählen und sperren: nach
einem Ereignis an D ist das nächste frühestens an D + 20 (Handelstage des Kalenders). *Begründung:* die Richtungen sind getrennte
Konfigurationen; eine richtungsübergreifende Sperre machte die Stichprobe der einen von den Ereignissen der anderen abhängig.

**Z9 V2 genau.** Stichtag c = letzter Handelstag des Monats vor dem Monat von D. Fenster = die 250 Handelstage des Kalenders bis
einschließlich c. Gültiger Tag einer Reihe = Zeile im Fenster mit endlicher `rendite` (SPY ebenso). Residuum = `rendite` − β ×
`rendite` SPY, β = Kleinste-Quadrate-Steigung über die gültigen Tage der Reihe. Pearson-Korrelation der Residuen über die
gemeinsamen gültigen Tage, mindestens 200. Kandidaten: Reihen mit ≥ 200 gültigen Tagen, Zeile an c mit `klasse` 0–3, nicht SPY,
andere CIK als A (Z3). Die 5 höchsten Korrelationen (Gleichstand: kleinerer Symbolindex). A braucht selbst ≥ 200 gültige Tage.
Ist ein B an D nicht zulässig, fällt es weg und wird nicht ersetzt.

**Z10 Ausschlüsse von B** (gezählt und mit ihrem Brutto-Mittel getrennt ausgewiesen): (i) eigene 8-K-2.02-Meldung, deren
Reaktionstag (Abbildung wie Z7) D oder e ist — das erfasst Meldungen von der Nacht vor D bis zum Schluss von e; (ii) eigener
Auslöser derselben Art und Richtung an D, gemessen als **Rohbedingung** (Schluss über dem eigenen 20-/55-Tage-Extrem, ohne
Sperrfrist): die Sperrfrist dünnt nur die Ereignisse von A, sie ändert nicht, dass B selbst ausgebrochen ist. Für E3 deckt (i) den
eigenen Auslöser ab.

**Z11 Topf (H1) je Ereignis.** Zulässige Aktien (Z4) der Klasse von B am Einstiegstag mit gültigem Ertrag über dasselbe Fenster
(kein Abgang, Z5), ohne A und ohne **alle** verknüpften Aktien dieses Ereignisses (auch die nach Z10 ausgeschlossenen),
ungewichtetes Mittel. *Begründung:* wörtlich „ohne A und alle B dieses Ereignisses"; ein Topf über alle Ereignisse eines Tages wäre
an dichten Tagen (Hunderte Ausbrüche, ihre SIC-Gruppen decken fast den Markt) leer.

**Z12 Einmal je B und Tag.** Je (Auslöser, Richtung, Verknüpfung, Einstiegstag) zählt B einmal: H1-Wert = Mittel von
dir·(r_B − Topf) über die Ereignisse, die B verknüpfen; H2-Wert = dir·(r_B − Mittel r_A) über die Ereignisse mit A der Klassen
250–1.000 / ab 1.000 und gültigem Ertrag von A; Kosten K(B) + Mittel K(A). Endet A vor e+h, fällt dieses Ereignis aus H2 (gezählt).

**Z13 Kosten.** Hürden je Umlauf nach Nachtrag 1 (1) mit der Klasse am Einstiegstag. Leihkosten = Satz × (h + 1)/252 auf das
Leerverkaufsbein (Einstiegstag zählt als ein Tag): H1 aufwärts keines, H1 abwärts B, H2 aufwärts A, H2 abwärts B. Hauptsatz 1 % p. a.,
Empfindlichkeit 0 % und 3 % als Zeilen, die Kassa-Hürde K als Vergleichszeile — keine davon ist eine eigene Konfiguration.

**Z14 Statistik.** Je Konfiguration die Tagesreihe der Tagesmittel (ungewichtet über die Beobachtungen eines Einstiegstags) am
Kalenderindex von e; Momente mit `momente(paare, L)` aus `studien/querschnitt-pruefstand-2026-09-13/statistik.js` (wortgleich zur
Trendkanal-Studie), **L = h + 1** (Hansen-Hodrick bis Lag h; h = 0 ⇒ naiv). Auch +1 überlappt um einen Tag und bekommt deshalb die
Korrektur. Hauptgröße = Mittel der Tagesmittel netto, se = Hansen-Hodrick (fällt es ≤ 0 aus: Block-se, Marke `HH<0`), t = Mittel/se.
**Mindestens 30 Einstiegstage** in der Entdeckung, sonst „nicht prüfbar" (wie die Trendkanal-Studie: darunter ist der se nicht deutbar;
das macht die Regel nur strenger).

**Z15 Abgänge.** Endet die Reihe von B vor e+h: nicht im Hauptergebnis, eigene Zeile je Grundgruppe (`ende_grund` des Panels v2.3 =
Gründe-Tafel v2.1): **Übernahme** (`uebernahme`, `fusion-aktientausch`, `spac-ende`), **Insolvenz** (`insolvenz`, `zwangs-delisting`),
**sonstige** (alle übrigen, auch Kürzelwechsel). Ertrag bis zum letzten Schluss; Insolvenz zusätzlich mit Totalverlust (−100 %).
Topf-Mitglieder mit Abgang fallen ebenso aus dem Topf (gleiche Behandlung wie B).

**Z16 Tor 1 ohne Blick in die Prüfzeit.** Die Prüfzeit ist bis zum Siegel 2 gesperrt, ihr se ist also unbekannt. MDE_B = 2 × se_B,proj
mit se_B,proj = se_E × √(T_E / T_B); T_E = Handelstage von 03.01.2017 bis 30.12.2022 − h, T_B = Handelstage von 03.01.2023 bis zum
letzten vollen Panel-Tag − h (Zahl der Kalendertage, ergebnisfrei). Tor 1: Netto_E > 0 und Netto_E ≥ 4 × MDE_B. Nach dem Prüflauf
steht das tatsächliche MDE_B daneben (nachrichtlich). **Folge, vorab hingeschrieben:** Tor 1 verlangt t_E ≳ 8 × √(T_E/T_B) ≈ 10 —
erheblich strenger als t ≥ 2. Tor 2 (`delta80` unter der Hürde) steht nachrichtlich daneben; die Regel verlangt es nicht.

**Z17 Placebos (je Konfiguration, alle drei, Brutto).** (a) Je echtem Ereignis (A, D) ein Tag D′, gleichverteilt gezogen aus allen
echten Ereignistagen desselben Auslösers, derselben Richtung und desselben Zeitraums (so bleibt die Tagesverteilung); A bleibt; A muss
an D′ zulässig sein (bis zu 50 Züge, sonst gezählt verworfen); Verknüpfung, Ausschlüsse, Topf, Dedup wie echt an D′. (b) Je echter
Beobachtung (B, Tag) ein B′ gleichverteilt aus den zulässigen Aktien derselben Klasse mit gültigem Ertrag, nicht verknüpft mit den
beitragenden Ereignissen und keines ihrer A, ≠ B (bis zu 50 Züge); gleicher Topf bzw. gleiches A. (c) Jedes echte Ereignis um 20
Handelstage später (D + 20), A bleibt, alles andere neu an D + 20; fällt es aus dem Zeitraum, entfällt es (gezählt). Maß = Brutto
(dir·(r − Topf) bzw. dir·(r_B − r_A)), denn ohne Kante ist das Brutto null, das Netto aber −Hürde. Verstoß = |t| ≥ 2 **und**
|Mittel| ≥ K(Klasse von B)/4 (Hürden nach Nachtrag 1). Ein Verstoß genügt, und die Konfiguration ist kein Kandidat. Zufall fest:
`mulberry32(fnv(Schlüssel))` aus `statistik.js`, Schlüssel aus Placebo, Auslöser, Richtung, Verknüpfung, Reihe, Tag.

**Z18 Kandidat und Siegel 2.** Kandidat = ≥ 30 Einstiegstage, Netto_E > 0, t_E ≥ 2, Tor 1 (Z16), kein Placebo-Verstoß (Z17).
`KANDIDATEN.json` (Liste, Entdeckungszahlen, Prüfsumme von `ergebnis-entdeckung.json`) wird committet, **bevor** die Prüfzeit
geöffnet wird; auch eine leere Liste wird gesiegelt.

**Z19 Prüfung.** Nur die gesiegelten Kandidaten: Tagesreihe in der Prüfzeit, t_B wie Z14, p = 1 − Φ(t_B) einseitig. Holm über
m = 384 (nicht geprüfte zählen als p = 1): die k-kleinste p gegen 0,05/(384 − k + 1), Abbruch beim ersten Verfehlen; erste Schwelle
z = Φ⁻¹(1 − 0,05/384) ≈ 3,65. Belegt = Holm bestanden **und** Netto_B > 0. Placebos der Prüfzeit nachrichtlich.

**Z20 Tabellen.** Je Klasse von B (= Konfiguration), je Kalenderjahr des Einstiegs; Entdeckung zusätzlich ohne die Einstiege 2020
und ohne die Einstiege 2022.

**Z21 Pilot.** 200 Reihen, je Klasse 50 (Klasse = Median der `klasse` 2017–2022), gewählt nach `fnv(Reihenname)` aufsteigend, dazu
SPY; nur Entdeckung. Inhalt: Zählungen, Laufzeit, Placebos, Abgänge, zwei Artefakt-Gegenproben: (1) Einstieg einen Tag später
(Eröffnung e + 1) bei festem Ausstieg e + h (h ≥ 1), Topf über dasselbe Fenster; (2) kein Blick nach vorn — die Ereignisse und die
V2-Listen eines Tages werden auf einer Kopie neu bestimmt, in der alle Zeilen nach D (bzw. nach c) gelöscht sind; sie müssen
gleich sein. Der Pilot behebt nur technische Fehler (Nachtrag 1 (6)); jede Änderung als Nachtrag hier, mit Commit.

**Z22 Sperre (Nachtrag 1 (7)).** Das Panel liest nur `lesen.js`. Ohne gültiges Siegel liest es **die Jahresblöcke ab 2023 gar nicht**
und schneidet den letzten Tag auf den letzten Handelstag vor dem 01.01.2023. Gültig heißt: `KANDIDATEN.json` liegt in diesem Ordner,
`git log -1 --format=%H -- KANDIDATEN.json` liefert einen Commit, `git diff --quiet <hash> -- KANDIDATEN.json` ist still,
`git status --porcelain` für die Datei ist leer, und die Git-Prüfsumme der Datei (`git hash-object`) gleicht der des Commits (`git rev-parse <hash>:<pfad>`); die SHA-256 steht im Lauf daneben. Sonst
bricht ein Lauf mit Prüfzeit mit Fehler ab. `test.js` zeigt das an einem Wegwerf-Repo (fehlt, nicht committet, geändert, gültig)
und prüft, dass keine andere Datei des Ordners das Panel anfasst.

**Z22a Zahlen vorab.** 384 Konfigurationen. Zufallstreffer bei t ≥ 2 einseitig: höchstens 384 × 0,0228 ≈ **8,7** (Obergrenze; die
Konfigurationen hängen zusammen); mit Tor 1 (t_E ≳ 10) praktisch **0**; belegt nach Holm: **< 0,05**.
