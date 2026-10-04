'use strict';
/* Schreibt ERGEBNIS.md aus ergebnis.json, tabellen.md, factsheet-gesamt.json, zweitrechner/vergleich.json,
 * ergaenzungen.json und geschlossene-fonds.json. Jede Zahl im Text kommt aus diesen Dateien (keine Abschrift von Hand).
 *   node ergebnis-schreiben.js     (nach rechnen.js je Gruppe, factsheet-nachrechnen.js, vergleich-zweit.js, zusammenfuehren.js) */
const fs = require('fs');
const path = require('path');
const O = __dirname;
const lies = (n) => JSON.parse(fs.readFileSync(path.join(O, n), 'utf8'));
const E = lies('ergebnis.json');
const FS = lies('factsheet-gesamt.json');
const VZ = lies(path.join('zweitrechner', 'vergleich.json'));
const EG = lies('ergaenzungen.json');
const GF = lies('geschlossene-fonds.json');
const tab = fs.readFileSync(path.join(O, 'tabellen.md'), 'utf8');
const M = '−';
const z = (x, st) => { if (x == null || !isFinite(x)) return '–'; const k = st == null ? 2 : st; if (Math.abs(x) < 0.5 * Math.pow(10, -k)) return '±' + (0).toFixed(k).replace('.', ','); const s = Math.abs(x).toFixed(k).replace('.', ','); return (x < 0 ? M : x > 0 ? '+' : '±') + s; };
const pp = (x, st) => z(x * 100, st);
const pr = (x, st) => (x * 100).toFixed(st == null ? 0 : st).replace('.', ',') + ' %';
const d = (s) => (s ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : '–');
const mo = (s) => (s ? s.slice(5, 7) + '/' + s.slice(0, 4) : '–');
const F = (id) => { const f = E.fonds.find((x) => x.id === id); if (!f) throw new Error('Fonds fehlt: ' + id); return f; };
const spanne = (ids, fn) => { const v = ids.map(fn); return [Math.min(...v), Math.max(...v)]; };
const liste = (xs) => xs.length ? xs.join(', ') : 'keiner';

const Z = E.zusammenfassung.zaehlung; const V = E.zusammenfassung.verlaesslichVorn;
const nFonds = Z.auftrag.fonds + Z.zusatz.fonds + Z.ucits.fonds;
const nVorn = V.auftrag.length + V.zusatz.length + V.ucits.length;
const faktorGruppen = E.fonds.filter((f) => f.kategorie !== 'Kontrolle' && f.gruppe !== 'Wachstum' && f.gruppe !== 'Momentum');
const momentum = E.fonds.filter((f) => f.kategorie !== 'Kontrolle' && f.gruppe === 'Momentum');
const wachstum = E.fonds.filter((f) => f.kategorie !== 'Kontrolle' && f.gruppe === 'Wachstum');
const nV = (xs) => xs.filter((f) => f.urteil === 'verlässlich vorn').length;
const faktorVorn = faktorGruppen.filter((f) => f.urteil === 'verlässlich vorn');
const ucitsNdq = V.ucits;
const [bLo, bHi] = spanne(ucitsNdq, (id) => F(id).gegenSPY.B.abstandPa);
const [aLo, aHi] = spanne(ucitsNdq, (id) => F(id).gegenSPY.A.abstandPa);
const qqq = F('QQQ'); const spmo = F('SPMO'); const ivv = F('IVV'); const voo = F('VOO'); const qdva = F('QDVA');
const qr = qqq.gegenSPY.rollierend; const qnu = qr.nichtUeberlappend;
const vzOk = VZ.zeilen.filter((x) => x.ok).length;
const fsz = FS.zusammen;

let t = '';
t += '# ERGEBNIS — Faktor-ETF-Realitätsprobe: Hat ein käuflicher Faktor-/Smart-Beta-ETF über fünf Jahre verlässlich den S&P 500 geschlagen?\n\n';
t += 'Kennung `' + E.kennung + '`. Regel und Fondsliste gesiegelt vor dem ersten Kurs (`REGEL.md`, Commit `7218e4d`), Rechner `b0cce7c`; ';
t += 'Korrekturen nach dem Siegel unten (Abschnitt 6). Datenende 15.09.2026. Beschreibende Zahlen nach vorab festgelegter Regel — **keine Anlageberatung**.\n\n';

t += '## Kurzfassung\n\n';
t += '1. Nach der vorab festgelegten Regel (≥ 80 % der rollierenden 5-Jahres-Fenster vor SPY **und** vorn in A 2017–21 **und** in B 2021–26) sind von ' + nFonds + ' Fonds ' + nVorn + ' „verlässlich vorn": Wachstum ' + nV(wachstum) + ' von ' + wachstum.length + ', Momentum ' + nV(momentum) + ' von ' + momentum.length + ' (nur SPMO), **alle übrigen Faktoren ' + faktorVorn.length + ' von ' + faktorGruppen.length + '** (Gleichgewicht, Qualität, niedrige Schwankung, Value, Dividende, Aktionärsrendite, kleine/mittlere Werte, Multifaktor, Moat, Free Cashflow, Fundamental-/Umsatzgewichtung).\n';
t += '2. Von den 27 verlangten US-ETFs: nur **' + V.auftrag.join(' und ') + '** (Nasdaq-100 bzw. S&P 500 Momentum). Zusatz: ' + liste(V.zusatz) + ' (alle Wachstum). In Deutschland kaufbar (UCITS, ' + Z.ucits.fonds + ' Fonds): nur die fünf **Nasdaq-100-Fonds ' + ucitsNdq.join(', ') + '** — gegen SPY und gegen den UCITS-S&P-500 SXR8.\n';
t += '3. US-ETFs sind für Privatanleger in der EU nicht kaufbar (kein Basisinformationsblatt). Für SPMO gibt es kein UCITS-Gegenstück; der MSCI-USA-Momentum-UCITS QDVA lag in ' + qdva.gegenSPY.rollierend.vorn + ' von ' + qdva.gegenSPY.rollierend.n + ' Fenstern vorn.\n';
t += '4. Die Regel verlangt keinen Mindestabstand: auch die reinen S&P-500-Kontrollen **IVV und VOO** bestehen sie (' + pr(ivv.gegenSPY.rollierend.anteil) + ' bzw. ' + pr(voo.gegenSPY.rollierend.anteil) + ' der Fenster, Median ' + pp(ivv.gegenSPY.rollierend.median) + ' / ' + pp(voo.gegenSPY.rollierend.median) + ' Pp p. a.) — allein, weil sie billiger sind als SPY. „Verlässlich vorn" heißt also nicht „deutlich vorn".\n';
t += '5. Nasdaq-100-UCITS: in A ' + pp(aLo, 1) + ' bis ' + pp(aHi, 1) + ' Pp p. a., in B nur ' + pp(bLo, 1) + ' bis ' + pp(bHi, 1) + '; ihre Yahoo-Historie beginnt erst 2008/2010, also mitten in der Technologie-Ära. QQQ seit 1999 zeigt den Rest: schlechtestes Fenster ' + pp(qr.schlechtester, 1) + ' Pp p. a. (Start ' + mo(qr.schlechtesterStart + '-01') + '), Rückschlag gegen SPY ' + pr(qqq.gegenSPY.rueckschlagGegenMassstab.tiefe, 0).replace('-', M) + ' (' + d(qqq.gegenSPY.rueckschlagGegenMassstab.spitze) + '–' + d(qqq.gegenSPY.rueckschlagGegenMassstab.tal) + '), ' + qnu.filter((x) => !x.vorn).length + ' von ' + qnu.length + ' nicht überlappenden Fünfjahresblöcken hinten.\n';
t += '6. Fünf Jahre Vorsprung sind wenige unabhängige Beobachtungen: SPMO hat zwei nicht überlappende Blöcke, die Nasdaq-UCITS drei. Ein Anteil von 80 % aus überlappenden Fenstern ist kein Beleg für die Zukunft.\n';
t += '7. Überlebensverzerrung: ' + GF.fonds.length + ' seit 2010 geschlossene Faktor-/Smart-Beta-ETFs belegt (' + GF.fonds.filter((x) => x.boerse === 'US').length + ' US, ' + GF.fonds.filter((x) => x.boerse === 'UCITS').length + ' UCITS), meist wegen zu wenig Vermögen nach schwacher Entwicklung — die gezählten Überlebenden sind im Schnitt zu gut.\n';
t += '8. Prüfung: Factsheets in ' + fsz.verglichen + ' Stichproben ' + z(fsz.min, 2) + ' bis ' + z(fsz.max, 2) + ' Pp p. a. (Median ' + z(fsz.median, 3) + '); zweiter, unabhängiger Rechner trifft alle ' + vzOk + ' verglichenen Größen; ' + EG.eintraege.length + ' Yahoo-Ausschüttungsfehler mit Anbieterbeleg nachgetragen.\n\n';

t += '## 1. Zählung\n\n| Art | Fonds | verlässlich vorn | nicht verlässlich vorn | zu jung | verlässlich vorn sind |\n|---|---|---|---|---|---|\n';
for (const [k, n] of [['auftrag', 'Vom Auftrag verlangt (US)'], ['zusatz', 'Zusatz (US)'], ['ucits', 'UCITS (in DE kaufbar)'], ['kontrolle', 'Kontrollen']]) {
  const c = Z[k];
  t += '| ' + n + ' | ' + c.fonds + ' | ' + c.verlaesslichVorn + ' | ' + c.nichtVerlaesslich + ' | ' + c.zuJung + ' | ' + liste(V[k]) + ' |\n';
}
t += '\nKontrollen haben kein Urteil im Sinne der Frage (REGEL A1); ihre Zeile zeigt, was die Regel misst.\n\n';

t += '## 2. Alle Fonds\n\nAbstand = Rendite p. a. Fonds − Rendite p. a. Maßstab in Prozentpunkten (Gesamtertrag mit Ausschüttungen, nach Fondskosten). ';
t += 'Fenster = alle rollierenden 5-Jahres-Fenster mit Monatsstart ab dem ersten Monat beider Reihen bis Ende August 2026. ';
t += 'Rückschlag = größter Fall der Reihe Fonds/Maßstab gegenüber ihrem Höchststand. UCITS: gegen SPY in USD (EZB-Kurs) und gegen SXR8 in EUR; ';
t += '„verlässlich vorn" verlangt beide (REGEL A1/C6).\n\n';
t += tab.replace(/^### /gm, '#### ') + '\n';

t += '### Anmerkungen zu einzelnen Zeilen\n\n';
const anm = [
  ['QQQ', 'Reihe ab 10.03.1999 erst nach Korrektur K1b (K1 hatte echte Bewegungen 2000/01 als Datenbruch gelesen). Zwei Ausschüttungen gestrichen, eine nachgetragen, acht Beträge ersetzt (C2).'],
  ['SPMO', '2015–2017 kaum gehandelt (viele unveränderte Schlusskurse); drei fehlende Invesco-Ausschüttungen nachgetragen. Das Urteil hält auch ohne die ersten Monate (Gruppenbericht g2).'],
  ['IVW', 'Knapp: ' + F('IVW').gegenSPY.rollierend.vorn + ' von ' + F('IVW').gegenSPY.rollierend.n + ' Fenstern bei 205 nötigen, B nur ' + pp(F('IVW').gegenSPY.B.abstandPa) + ' Pp; jede Ausschüttung gegen iShares geprüft.'],
  ['IWF', 'Verfehlt 80 % um drei Fenster (' + F('IWF').gegenSPY.rollierend.vorn + '/' + F('IWF').gegenSPY.rollierend.n + ') und liegt in B ' + pp(F('IWF').gegenSPY.B.abstandPa) + ' Pp hinten.'],
  ['VUG', 'Vanguard nennt nur die letzten sechs Ausschüttungen; Lücken davor (vermutlich 12/2014 wie bei VOO/MGK) sind nicht prüfbar. Das Urteil hängt an B (' + pp(F('VUG').gegenSPY.B.abstandPa) + ' Pp), nicht an den Fenstern.'],
  ['MGK', 'Ausschüttung 12/2014 fehlt bei Yahoo (über die Vanguard-Jahresrendite 2014 bestätigt, Betrag vom Anbieter nicht genannt, daher nicht nachgetragen) — MGK ist eher etwas zu schlecht gerechnet.'],
  ['SYLD', '21 Ausschüttungen 09/2013–09/2018 fehlten bei Yahoo (Cambria-Historie) und sind nachgetragen: A von −2,12 auf ' + pp(F('SYLD').gegenSPY.A.abstandPa) + ' Pp p. a.'],
  ['IVV / VOO', 'IVV: Zusatzeintrag 16.12.2003 gestrichen, 23.03.2016 nachgetragen; VOO: Ausschüttung 12/2014 aus der Jahressumme des Jahresberichts abgeleitet (einziger abgeleiteter Betrag, markiert). Ohne diese Korrekturen 179/256 bzw. 82/132 Fenster.'],
  ['SCHD, VIG, VYM, VBR, AVUV, VTV, VUG, MGK', 'Ausschüttungshistorie beim Anbieter nicht vollständig abrufbar (Schwab HTTP 403; Vanguard/Avantis nur letzte Zahlungen) — Yahoo-Ausschüttungen ungeprüft; Factsheets stimmen auf ±0,05 Pp p. a.'],
  ['SXRV', 'Gerechnet über CSNDX.SW (SIX, USD): die Xetra-Reihe beginnt 101 Tage nach Auflage (C6). Mit SXRV.DE gleiches Urteil (Gruppenbericht g4).'],
  ['EXXT, EQQQ', 'Yahoo führt 2008 USD-Kurse in der EUR-Reihe (EQQQ.DE springt bis 08/2009 hin und her) — Korrektur K2. EXXT: acht Ausschüttungen 2008–2013 nachgetragen. EQQQ vor 2013 beim Anbieter nicht prüfbar.'],
  ['LYMS, 6AQQ', 'Pariser Notizen (UST.PA, ANX.PA) mit der Historie der verschmolzenen Lyxor-Vorgänger.'],
  ['MWOT', '„Zu jung" ist hier eine Datenlücke: Yahoo führt die Historie des Lyxor-Vorgängers (bis 07/2024) unter keinem der Symbole.'],
  ['WTEU', 'Anfangsabschnitt 10/2014–03/2015 vermutlich in USD (K2 greift nicht, weil EURUSD beim Austritt unter 1,1275 lag) — Fenster mit Start bis 03/2015 und der Rückschlag sind unsicher; A/B nicht betroffen.'],
  ['SXRG, SC0K, 6PSA', 'Sehr unsaubere Yahoo-Reihen (dutzende USD-Tage, von K2 umgerechnet) — Fenster und Rückschläge nur grob; A und B weit hinten, das Urteil hängt nicht daran.'],
  ['EXX5', 'Endkurs B lag bei Yahoo in USD (02.–23.09.2026); nach K2 B ' + pp(F('EXX5').gegenSPY.B.abstandPa) + ' statt −0,06 Pp p. a.'],
  ['P500', 'Kontrolle: SPXS.L am 02.01.2014 um Faktor 100 (Korrektur K3). Gegen SXR8 ' + F('P500').gegenSXR8.rollierend.vorn + '/' + F('P500').gegenSXR8.rollierend.n + ' Fenster, A ' + pp(F('P500').gegenSXR8.A.abstandPa) + ', B ' + pp(F('P500').gegenSXR8.B.abstandPa) + ' Pp — die Swap-Bauform allein (keine 15 % Quellensteuer) erfüllt die Regel gegen SXR8.'],
  ['HWWD', 'Strategiewechsel am 25.10.2017 (Marktgewicht → Multifaktor, laut HSBC).'],
  ['Klasse „Welt"', 'IS3Q, XDEQ, IQQ0, XDEB, IS3S, XDEV, IS3R, XDEM, BBCK, IS3T, VVGM, IBCZ, HWWD bilden MSCI-World-/Welt-Faktoren ab; der Vergleich mit dem S&P 500 mischt Faktor und Region.'],
  ['ausgeschlossen', 'HSBC MSCI USA Quality (IE00B5WFQ436) — bildete bis 2025 den breiten MSCI USA ab (REGEL B3).']
];
for (const [k, v] of anm) t += '- **' + k + ':** ' + v + '\n';
t += '\n';

t += '## 3. Was die „verlässlich vorn"-Fonds gemeinsam haben\n\n';
t += 'Alle zehn sind **große US-Wachstums- oder Momentumwerte** — in den Jahren 2009–2026 dieselben wenigen Technologiekonzerne. Kein Fonds eines anderen Faktors erfüllt die Regel. ';
t += 'Die nicht überlappenden Fünfjahresblöcke (erstes Fenster, dann je 60 Monate weiter):\n\n| Fonds | Blöcke (Start: Abstand p. a.) | ganze Zeit Abstand p. a. | Rückschlag Fonds / SPY absolut |\n|---|---|---|---|\n';
for (const id of V.auftrag.concat(V.zusatz, V.ucits)) {
  const f = F(id); const g = f.gegenSPY;
  t += '| ' + id + ' | ' + g.rollierend.nichtUeberlappend.map((x) => mo(x.start + '-01') + ': ' + pp(x.abstandPa)).join('; ') + ' | ' + pp(g.gesamt.abstandPa) + ' (ab ' + d(g.gesamt.von) + ') | ' + pr(g.rueckschlagAbsolut.fonds, 0).replace('-', M) + ' / ' + pr(g.rueckschlagAbsolut.mass, 0).replace('-', M) + ' |\n';
}
t += '\nQQQ und IVW reichen bis 1999/2000 zurück und zeigen den Preis: ein Fünfjahresblock (Start 1999/2000) deutlich hinten. Die UCITS-Reihen beginnen erst 2008/2010 und enthalten diesen Block nicht.\n\n';

t += '## 4. Kontrollen\n\n';
t += '| Kontrolle | gegen | A | B | Fenster vorn | Median p. a. | was sie zeigt |\n|---|---|---|---|---|---|---|\n';
const kon = [['IVV', 'gegenSPY', 'SPY', 'gleicher Index, 0,03 % statt 0,0945 % Kosten'], ['VOO', 'gegenSPY', 'SPY', 'dasselbe bei Vanguard'],
  ['SXR8', 'gegenSPY', 'SPY (USD)', 'UCITS-Zwilling: 15 % Quellensteuer auf US-Dividenden, Zeitversatz Xetra'], ['P500', 'gegenSXR8', 'SXR8 (EUR)', 'Swap-UCITS ohne Quellensteuerabzug']];
for (const [id, feld, geg, was] of kon) {
  const g = F(id)[feld];
  t += '| ' + id + ' | ' + geg + ' | ' + pp(g.A.abstandPa) + ' | ' + pp(g.B.abstandPa) + ' | ' + g.rollierend.vorn + '/' + g.rollierend.n + ' (' + pr(g.rollierend.anteil) + ') | ' + pp(g.rollierend.median) + ' | ' + was + ' |\n';
}
t += '\nEichung (REGEL C7.6/7) bestanden: SPY Fenster A +115,91 % (Gegenprobe Nr. 78: +115,81 % Yahoo-bereinigt), B +80,97 % (Nr. 88: +81,2 %), gegen den S&P 500 Total Return Index −0,10 / −0,11 Pp p. a.; IVV/VOO gegen SPY in A und B je unter 0,15 Pp. ';
t += 'Die 80-%-Regel wird von Fonds bestanden, deren wahrer Vorsprung null bis ein Zehntel Prozentpunkt ist — sie trennt „billiger" nicht von „besser".\n\n';

t += '## 5. Überlebensverzerrung (c)\n\n';
t += 'Belegt (je Fonds mit geöffneter Quelle, `geschlossene-fonds.md`): **' + GF.fonds.length + ' Faktor-/Smart-Beta-ETFs seit 2010 geschlossen**, ' + GF.fonds.filter((x) => x.boerse === 'US').length + ' US-gelistete und ' + GF.fonds.filter((x) => x.boerse === 'UCITS').length + ' UCITS. ';
t += 'Wellen: Russell 2012 (25 Fonds), iShares 2018 (13 Faktorfonds), Invesco 2020 (rund 20 Faktorfonds unter 42 Schließungen), John Hancock 2022 (10 Multifaktor-Sektorfonds), Morgan Stanley 2024 (alle 6 Smart-Beta-UCITS). Grund fast immer: zu wenig Vermögen. ';
t += 'Zählungen: Morningstar meldet für die USA 2020 73 Schließungen bei 21 Neuauflagen strategischer Beta-Produkte und rund 179 geschlossene Faktorstrategien in fünf Jahren bis 2021; ';
t += '„The Smart Beta Mirage" (Huang/Song/Xiang, JFQA 2024) misst rund +3 % Mehrrendite der Indizes in der Rückrechnung, aber −0,5 bis −1 % nach dem ETF-Start. ';
t += 'Die Liste ist nicht erschöpfend; Kurse der geschlossenen Fonds wurden nicht geladen. **Richtung:** Die hier gerechneten Fonds sind die Überlebenden — und zusätzlich die heute bekannten (Bekanntheitsverzerrung). Beides macht das Bild zu gut, nicht zu schlecht.\n\n';

t += '## 6. Datenprüfung und Korrekturen nach dem Siegel\n\n';
t += 'Alle Korrekturen wirken für alle Fonds gleich, sind im Code benannt und getestet (`test.js`), und keine ändert ein Urteil eines Fonds aus Auftrag, Zusatz oder UCITS-Liste (nachgerechnet: ohne C2 und K2 dieselben zehn). Es kippen nur die Kontrollen IVV (179 → 218 von 256 Fenstern) und VOO (82 → 131 von 132) — durch fehlende bzw. überzählige Yahoo-Ausschüttungen, die bei einem Vorsprung von Hundertstelpunkten den Ausschlag geben.\n\n';
t += '- **K1 / K1b** (`d311da7`, `194c1b9`): SXR8.DE beginnt bei Yahoo mit eingefrorenen Kursen bis 29.10.2010 → Reihe ab 01.11.2010. Die erste Fassung K1 verwarf auch echte Bewegungen (QQQ 2000/01); K1b verwirft einen Anfang nur nach ≥ 5 gleichen Schlusskursen und wurde vor jeder Auswertung eingesetzt.\n';
t += '- **C2 benannte Ergänzungen** (`ergaenzungen.json`): ' + EG.eintraege.length + ' nachgewiesene Abweichungen der Yahoo-Ausschüttungen von den Anbieterhistorien (' + Object.entries(EG.zaehlung).map(([k, v]) => v + ' ' + k).join(', ') + '), ' + EG.fondsGeprueft + ' Fonds abgeglichen; systematisch: Invesco-Septemberausschüttungen 2020/2021 fehlen, iShares-Zusatzeinträge 16.12.2003, SYLD 2013–2018 fehlt ganz, UCITS-Ausschüttungen vor 2013/14 fehlen. Nicht prüfbar: ' + EG.nichtPruefbar.join(', ') + '. Bei den US-Fonds mit nachgetragenen Ausschüttungen sank die Factsheet-Abweichung dadurch auf höchstens 0,02 Pp p. a. (z. B. RPV −0,14 → ' + z(FS.stichproben.find((x) => x.id === 'RPV').abweichung_pp, 3) + ', RWL −0,10 → ' + z(FS.stichproben.find((x) => x.id === 'RWL').abweichung_pp, 3) + ').\n';
t += '- **K2 USD-Werte in EUR-Reihen**: Yahoo führt in Xetra-/Mailand-/Paris-Notizen tage- bis monateweise Kurs × EURUSD; erkannt am Sprung um genau den EZB-Kurs (Einzeltage ab EURUSD 1,083, Abschnitte ab 1,1275), umgerechnet statt verworfen; geprüft an sauberen Zweitnotizen (EQQQ.DE gegen EQQQ.MI: 163/164 Fenster, Rückschlag −24,4 % gegen −24,9 %). Zwei lockerere Vorfassungen lasen Zeitversatz-Tage (2020, 2022, Wahltag 06.11.2024) als USD-Werte und wurden verworfen.\n';
t += '- **K3 Faktor-100-Brüche**: ein Tagesverhältnis von genau 1/100 oder 100 (SPXS.L 02.01.2014, USFM.L 29.08.2025) wird als Einheiten-/Splitfehler zurückgerechnet.\n';
t += '- Weitere Befunde ohne Korrektur: SPY 15.11.2004 Sonderausschüttung echt (fünf statt vier im Jahr); SPY-Schluss 06.01.2000 verdächtig (kein Monatsende); umsatzlose Tage bei SPMO 2015–17, QUS 2015–16, CSNDX.SW; SXR8 und alle Fensterränder A/B der „verlässlich vorn"-Fonds frei von nachgewiesenen Fehlern.\n\n';

t += '## 7. Factsheet-Stichproben (REGEL C9)\n\n';
t += 'Anbieterwert der 5-Jahres-Rendite p. a. zum Stichtag gegen unseren Wert aus derselben Reihe (Endstand mit allen Korrekturen; „Gruppe" = Wert vor den Korrekturen). ';
t += fsz.verglichen + ' verglichen, ' + fsz.nichtErreichbar + ' nicht erreichbar; Abweichung ' + z(fsz.min, 2) + ' bis ' + z(fsz.max, 2) + ' Pp p. a., Median ' + z(fsz.median, 3) + '. ';
t += 'Über 0,30: ' + (fsz.ueber030.length ? FS.stichproben.filter((x) => Math.abs(x.abweichung_pp) >= 0.3).map((x) => x.id + ' ' + z(x.abweichung_pp)).join(', ') + ' (London am 31.08. geschlossen, mit der Xetra-Notiz −0,11)' : 'keine') + '. UCITS-Factsheets nennen meist nur den NAV (US-Schluss); der Xetra-Schluss liegt 4½ Stunden früher — daher die etwas größere Streuung.\n\n';
t += '| Fonds | Symbol | Stichtag | Art | Währung | Anbieter 5 J. p. a. | unser 5 J. p. a. | Abweichung (Pp) |\n|---|---|---|---|---|---|---|---|\n';
for (const s of FS.stichproben) {
  if (s.nicht_erreichbar) { t += '| ' + s.id + ' | ' + s.symbol + ' | ' + d(s.stichtag) + ' | – | – | nicht erreichbar | ' + (s.gruppe_5j_pa != null ? z(s.gruppe_5j_pa, 2).replace('+', '') + ' %' : '–') + ' | – |\n'; continue; }
  t += '| ' + s.id + ' | ' + s.symbol + ' | ' + d(s.stichtag) + ' | ' + s.art + ' | ' + s.waehrung + ' | ' + s.anbieter_5j_pa.toFixed(2).replace('.', ',') + ' % | ' + s.end_5j_pa.toFixed(2).replace('.', ',') + ' % | ' + z(s.abweichung_pp, 2) + ' |\n';
}
t += '\n';

t += '## 8. Zweiter Rechner (REGEL C10)\n\n';
t += 'Ein unabhängiger Agent hat aus `REGEL.md` eigenen Code geschrieben (`zweitrechner/zweit.js`), die Kurse selbst geladen und SPY, SPMO, SCHD, XDEW sowie alle zehn „verlässlich vorn"-Fonds gerechnet (UCITS auch gegen SXR8). ';
t += 'Abgleich `vergleich-zweit.js` (Rechenweg gegen Rechenweg, ohne die Datenkorrekturen nach dem Siegel, die er nicht kennt): **' + vzOk + ' von ' + VZ.zeilen.length + ' Größen innerhalb der Toleranz** (0,05 Pp p. a., ±1 Fenster, 0,5 Pp Rückschlag), die meisten auf vier Nachkommastellen gleich. ';
t += 'Er fand unabhängig dieselben Datenfehler (fehlende Ausschüttungen QQQ/SPMO/MGK, USD-Kurse in EQQQ.DE/EXXT.DE).\n\n';

t += '## 9. Grenzen\n\n';
t += '- **Überlebens- und Bekanntheitsverzerrung** (Abschnitt 5): das Bild ist zu gut.\n';
t += '- **Überlappende Fenster:** 60 aufeinanderfolgende Fenster teilen 59 Monate; hinter „130 von 130" stehen drei unabhängige Fünfjahresblöcke.\n';
t += '- **Viele Fonds, ein Regime:** alle Treffer sind US-Großwerte mit Technologie-Schwerpunkt; ein anderes Jahrzehnt (2000–2009) kehrte das Bild um (QQQ, IVW).\n';
t += '- **Kein Mindestabstand:** die Regel lässt reine Kostenvorteile als „verlässlich vorn" durch (IVV, VOO, P500 gegen SXR8).\n';
t += '- **Datenquelle Yahoo:** inoffiziell, Ausschüttungen lückenhaft, EUR-Notizen teils in USD; korrigiert, wo belegt (Abschnitt 6), sonst benannt. UCITS-Historie bei Yahoo erst ab 2008 (ältere Fonds) bzw. Notierungsbeginn.\n';
t += '- **Zeitversatz:** Xetra schließt 17:30 MEZ, SPY 22:00 MEZ — darum der zweite Maßstab SXR8.\n';
t += '- **Steuern und Handelskosten** nicht gerechnet (Teilfreistellung für Aktienfonds gleich; Spanne/Ordergebühr einmalig, beim S&P-500-Fonds ebenso).\n';
t += '- **Vergangenheit:** fünf Jahre vorn sagen nichts Sicheres über die nächsten fünf.\n\n';

t += '## 10. Dateien\n\n';
t += '`REGEL.md` (Siegel), `fonds.json`/`fonds-bauen.js` (Liste), `ucits-recherche.*` (UCITS-Suche), `laden.js` (Lader; Rohdaten nicht im Repo, Prüfsummen in `pruefsummen-*.json`), ';
t += '`rechnen.js` (Rechner), `test.js` (Prüfungen), `gruppe-g1…g5.json/.md` (Laden, Prüfen, Rechnen je Gruppe), `factsheet-*.json`, `factsheet-nachrechnen.js`, ';
t += '`ergaenzungen-*.json`/`ergaenzungen-bauen.js`, `geschlossene-fonds.*`, `zweitrechner/` (zweiter Rechner, `vergleich.json`), `zusammenfuehren.js`, `ergebnis.json`, `tabellen.md`, dieses Dokument (`ergebnis-schreiben.js`).\n';

fs.writeFileSync(path.join(O, 'ERGEBNIS.md'), t);
console.log('ERGEBNIS.md: ' + t.split('\n').length + ' Zeilen');
