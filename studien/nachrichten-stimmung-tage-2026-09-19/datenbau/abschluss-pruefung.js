'use strict';
/* Abschlusspruefung des GDELT-Datenbaus Nr. 47 (Auftrag Nr. 63, §1 und §2). Liest NUR; schreibt <ablage>/pruefung/abschluss.json.
 * Aufruf (Rechenknecht): /opt/node-v24.18.0/bin/node abschluss-pruefung.js /archiv/markt-dashboard/studien-zellen/gdelt-2017-2026
 *  §1.1 Tagesdateien der 3.530 ET-Tage 2017-01-01..2026-08-31: vorhanden, gueltiges JSON, vollstaendig (gefunden + fehlend = soll),
 *       Summen aller Zaehler, Summe n / nSpaet ueber die Symbole, je Tag mit fehler > 0 eine Zeile, offeneTage der Fortschrittsdateien
 *       gegen die Tagesdatei (der Fortschritt eines Teils wird nicht nachgetragen, die Tagesdatei ist die Wahrheit).
 *  §1.3 je Jahr: Firmennennungen je Tag (zaehler.treffer = Summe n + nSpaet ueber die Kartensymbole) Median / P5 / P95,
 *       Ausreisser < 10 % des Jahresmedians (der GDELT-Ausfall 15.06.-01.07.2025 muss darin stehen; er ist kein Fehler).
 *  §2.1 UTC-Dateitage 2017-01-01..2026-09-01 (Kalender gerechnet, nicht angenommen): erwartet, vorhanden, fehlend; Stuecke in
 *       roh/_teile mit Name -> UTC-Tag, ET-Tag, Rolle (fruehe Stunden aus ET U-1 oder Rest aus ET U), Randtag ja/nein.
 *  §2.3 Stichprobe jeder 88. UTC-Tag (Position 88, 176, ... 3520 = 40 Tage): Stempel in Spalte 2 des Auszugs (zcat | awk), Zeilen
 *       je Stueck gegen den Beleg roh/<U>.json, mitOrganisation der beruehrten ET-Tage gegen die Stuecke, fehlend gegen tage/,
 *       Feldzahl je Zeile (muss 6 sein). Abweichungen sind Befund, keine Reparatur.
 *  §2.4 Groesse je Jahr und gesamt (Bytes der .tsv.gz), Zeilen gesamt aus den Belegen (jeder Beleg traegt `zeilen`; die
 *       Stichprobe belegt Beleg = Auszug), Download (bytesZip der Tagesdateien), Lauf-Eckdaten aus log-<k>.txt (START/ENDE teil k/20).
 * Simulation, keine Anlageberatung. */
var fs = require('fs'), path = require('path'), cp = require('child_process');
var A = process.argv[2]; if (!A) throw new Error('Ablage fehlt');
var TEILE = 20, SCHRITT = 88, PROBEN = 40;

function tage(von, bis) { var l = [], t = Date.parse(von + 'T00:00:00Z'), e = Date.parse(bis + 'T00:00:00Z'); for (; t <= e; t += 86400000) l.push(new Date(t).toISOString().slice(0, 10)); return l; }
function tagDavor(tag) { return new Date(Date.parse(tag + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10); }
function lies(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function quantil(arr, q) { var s = arr.slice().sort(function (a, b) { return a - b; }); if (!s.length) return null; var i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
function beleg(u) { var p = path.join(A, 'roh', u + '.json'); return fs.existsSync(p) ? lies(p) : null; }
function stueckFrueh(uNext, et) { var b = beleg(uNext); if (b) return b.stuecke[0]; var p = path.join(A, 'roh', '_teile', uNext + '_' + et + '.json'); return fs.existsSync(p) ? lies(p) : null; }
function stueckRest(uPrev) { var b = beleg(uPrev); if (b) return b.stuecke[1]; var p = path.join(A, 'roh', '_teile', uPrev + '_' + uPrev + '.json'); return fs.existsSync(p) ? lies(p) : null; }

var ET = tage('2017-01-01', '2026-08-31'), UTC = tage('2017-01-01', '2026-09-01');

/* ---------- §1.1 Tagesdateien ---------- */
var FELDER = ['soll', 'gefunden', 'fehlend', 'zeilen', 'falscheFeldzahl', 'mitOrganisation', 'ohneTon', 'stempelAusDatei', 'stempelUngleichDatei', 'treffer', 'trefferSpaet', 'trefferUebersetzt', 'fremderTag', 'bytesZip', 'bytesCsv'];
var t1 = { erwartet: ET.length, vorhanden: 0, ungueltig: [], unvollstaendig: [], fehlerTage: [], summen: { fehler: 0 }, nSumme: 0, nSpaetSumme: 0, symbolTage: 0, symboleGesamt: {}, fehlendJeJahr: {}, fehlendJeStundeUTC: {}, blockAusfaelle: [], tageOhneDatei: [], kennungen: {} };
var jeTag = {};
ET.forEach(function (d) {
  var p = path.join(A, 'tage', d + '.json'), j;
  if (!fs.existsSync(p)) { t1.ungueltig.push(d + ' fehlt'); return; }
  try { j = lies(p); } catch (e) { t1.ungueltig.push(d + ' ' + e.message); return; }
  if (j.tag !== d || !j.zaehler || !j.symbole || !j.stichprobe) { t1.ungueltig.push(d + ' Format'); return; }
  t1.vorhanden++;
  var kk = j.kennung + ' | ' + j.karte; t1.kennungen[kk] = (t1.kennungen[kk] || 0) + 1;
  var z = j.zaehler; jeTag[d] = z;
  FELDER.forEach(function (f) { t1.summen[f] = (t1.summen[f] || 0) + (z[f] || 0); });
  t1.summen.fehler += z.fehler.length;
  if (z.fehler.length) t1.fehlerTage.push({ tag: d, gefunden: z.gefunden, soll: z.soll, fehler: z.fehler });
  if (z.gefunden + z.fehlend !== z.soll) t1.unvollstaendig.push(d + ' ' + z.gefunden + '+' + z.fehlend + '/' + z.soll);
  if (z.gefunden === 0) t1.tageOhneDatei.push(d);
  if (z.fehlend >= 8) t1.blockAusfaelle.push({ tag: d, fehlend: z.fehlend, soll: z.soll });
  var y = d.slice(0, 4); t1.fehlendJeJahr[y] = (t1.fehlendJeJahr[y] || 0) + z.fehlend;
  z.fehlendStempel.forEach(function (s) { var h = s.slice(8, 10); t1.fehlendJeStundeUTC[h] = (t1.fehlendJeStundeUTC[h] || 0) + 1; });
  Object.keys(j.symbole).forEach(function (s) { t1.nSumme += j.symbole[s].n; t1.nSpaetSumme += j.symbole[s].nSpaet; t1.symbolTage++; t1.symboleGesamt[s] = 1; });
});
t1.symboleGesamt = Object.keys(t1.symboleGesamt).length;
t1.nPlusNSpaetGleichTreffer = t1.nSumme + t1.nSpaetSumme === t1.summen.treffer;

/* offeneTage der 20 Fortschrittsdateien gegen die Tagesdatei */
var fort = { dateien: 0, offeneEintraege: [], nochOffen: [] };
for (var k = 1; k <= TEILE; k++) {
  var fp = path.join(A, '_fortschritt-' + TEILE + '-' + k + '.json'); if (!fs.existsSync(fp)) continue;
  var f = lies(fp); fort.dateien++;
  Object.keys(f.offeneTage || {}).forEach(function (d) {
    fort.offeneEintraege.push(d + ' (teil ' + k + ')');
    var z = jeTag[d]; if (!z || z.gefunden + z.fehlend !== z.soll) fort.nochOffen.push(d);
  });
}

/* ---------- §1.3 Plausibilitaet je Jahr ---------- */
var jahre = {};
Object.keys(jeTag).sort().forEach(function (d) { var y = d.slice(0, 4); (jahre[y] = jahre[y] || []).push(d); });
var t13 = {};
Object.keys(jahre).forEach(function (y) {
  var tr = jahre[y].map(function (d) { return jeTag[d].treffer; }), mo = jahre[y].map(function (d) { return jeTag[d].mitOrganisation; });
  var med = quantil(tr, 0.5), grenze = 0.1 * med;
  t13[y] = { tage: tr.length, treffer: { median: med, p5: quantil(tr, 0.05), p95: quantil(tr, 0.95) }, mitOrganisation: { median: quantil(mo, 0.5), p5: quantil(mo, 0.05), p95: quantil(mo, 0.95) },
    grenze: grenze, ausreisser: jahre[y].filter(function (d) { return jeTag[d].treffer < grenze; }).map(function (d) { var z = jeTag[d]; return { tag: d, treffer: z.treffer, gefunden: z.gefunden, soll: z.soll }; }) };
});

/* ---------- §2.1 Rohauszug: UTC-Tage und Stuecke ---------- */
var t2 = { erwartet: UTC.length, erster: UTC[0], letzter: UTC[UTC.length - 1], vorhanden: 0, fehlend: [], ohneBeleg: [], stuecke: [], stueckeOhneBeleg: [], reste: [] };
UTC.forEach(function (u) {
  if (fs.existsSync(path.join(A, 'roh', u + '.tsv.gz'))) { t2.vorhanden++; if (!fs.existsSync(path.join(A, 'roh', u + '.json'))) t2.ohneBeleg.push(u); }
  else t2.fehlend.push(u);
});
var teileD = path.join(A, 'roh', '_teile');
fs.readdirSync(teileD).sort().forEach(function (f) {
  var m = /^(\d{4}-\d\d-\d\d)_(\d{4}-\d\d-\d\d)\.(json|tsv\.gz)$/.exec(f);
  if (!m) { t2.reste.push(f); return; }
  if (m[3] !== 'json') { if (!fs.existsSync(path.join(teileD, m[1] + '_' + m[2] + '.json'))) t2.stueckeOhneBeleg.push(f); return; }
  var s = lies(path.join(teileD, f)), u = m[1], et = m[2];
  var rand = (u === '2017-01-01' && et === '2017-01-01') || (u === '2026-09-01' && et === '2026-08-31');
  var partner = et === u ? u + '_' + tagDavor(u) : u + '_' + u;
  t2.stuecke.push({ datei: f.replace(/\.json$/, ''), utcTag: u, etTag: et, rolle: et === u ? 'Rest des ET-Tags U (ab 04:00/05:00 UTC)' : 'fruehe Stunden aus ET-Tag U-1 (bis 03:45/04:45 UTC)', soll: s.soll, dateien: s.dateien, fehlend: s.fehlend, zeilen: s.zeilen, bytesGz: s.bytesGz, von: s.von, bis: s.bis,
    randtag: rand, partner: partner, partnerDa: fs.existsSync(path.join(teileD, partner + '.json')), utcTagFertig: fs.existsSync(path.join(A, 'roh', u + '.tsv.gz')) });
});
t2.randtage = t2.stuecke.filter(function (s) { return s.randtag; }).map(function (s) { return s.datei; });
t2.fehlendOhneRandtage = t2.fehlend.filter(function (u) { return u !== '2017-01-01' && u !== '2026-09-01'; });

/* ---------- §2.3 Stichprobe ---------- */
var AWK = "zcat \"$1\" | awk -F'\\t' '{s[$2]++; f[NF]++} END {for (k in s) print \"S\", k, s[k]; for (k in f) print \"F\", k, f[k]}'";
var probe = { schritt: SCHRITT, positionen: [], tage: [], ok: 0, abweichungen: [] };
for (var i = 1; i <= PROBEN; i++) {
  var pos = SCHRITT * i, u = UTC[pos - 1]; probe.positionen.push(pos);
  var b = beleg(u), gz = path.join(A, 'roh', u + '.tsv.gz'), r = { utcTag: u, position: pos };
  if (!b || !fs.existsSync(gz)) { r.fehler = 'UTC-Tag nicht fertig'; probe.tage.push(r); probe.abweichungen.push(u + ': nicht fertig'); continue; }
  var out = cp.execFileSync('sh', ['-c', AWK, 'sh', gz], { maxBuffer: 16 * 1024 * 1024 }).toString().split('\n');
  var st = {}, feld = {}, zeilen = 0;
  out.forEach(function (l) { var c = l.split(' '); if (c[0] === 'S') { st[c[1]] = +c[2]; zeilen += +c[2]; } else if (c[0] === 'F') feld[c[1]] = +c[2]; });
  var pre = u.replace(/-/g, ''), echt = Object.keys(st).filter(function (s) { return /^\d{14}$/.test(s) && s.indexOf(pre) === 0; }).sort();
  var fremd = Object.keys(st).filter(function (s) { return echt.indexOf(s) < 0; });
  var s0 = b.stuecke[0], s1 = b.stuecke[1], z0 = 0, z1 = 0;
  echt.forEach(function (s) { if (s <= s0.bis) z0 += st[s]; else z1 += st[s]; });
  var uPrev = tagDavor(u), uNext = UTC[pos], rest = stueckRest(uPrev), frueh = stueckFrueh(uNext, u);
  var zt = jeTag[u], ztPrev = jeTag[uPrev];
  var fehlTage = ztPrev.fehlendStempel.concat(zt.fehlendStempel).filter(function (s) { return s.indexOf(pre) === 0; }).sort();
  var counts = echt.map(function (s) { return st[s]; });
  r.dateien = b.dateien; r.fehlendBeleg = b.fehlend.length; r.fehlendTage = fehlTage.length;
  r.stempel = echt.length; r.stempelSoll = 96 - b.fehlend.length; r.fremdeStempel = fremd.map(function (s) { return s + ':' + st[s]; });
  r.zeilen = zeilen; r.zeilenBeleg = b.zeilen; r.feldzahlen = feld;
  r.stueckFrueh = { ist: z0, beleg: s0.zeilen, etTag: s0.etTag }; r.stueckRest = { ist: z1, beleg: s1.zeilen, etTag: s1.etTag };
  r.mitOrganisationET = { tag: u, tagesdatei: zt.mitOrganisation, ausStuecken: frueh ? s1.zeilen + frueh.zeilen : null };
  r.mitOrganisationETVortag = { tag: uPrev, tagesdatei: ztPrev.mitOrganisation, ausStuecken: rest ? rest.zeilen + s0.zeilen : null };
  r.zeilenJeStempel = { min: Math.min.apply(null, counts), max: Math.max.apply(null, counts) };
  var pruef = [
    ['stempel', echt.length === r.stempelSoll], ['fehlendGleich', JSON.stringify(fehlTage) === JSON.stringify(b.fehlend.slice().sort())],
    ['zeilenBeleg', zeilen === b.zeilen], ['stueckFrueh', z0 === s0.zeilen], ['stueckRest', z1 === s1.zeilen],
    ['etTagZuordnung', s0.etTag === uPrev && s1.etTag === u], ['feldzahl6', Object.keys(feld).join(',') === '6' || zeilen === 0],
    ['mitOrganisationET', r.mitOrganisationET.ausStuecken === zt.mitOrganisation], ['mitOrganisationETVortag', r.mitOrganisationETVortag.ausStuecken === ztPrev.mitOrganisation],
    ['keineFremdenStempel', fremd.length === 0]];
  r.nichtBestanden = pruef.filter(function (p) { return !p[1]; }).map(function (p) { return p[0]; });
  r.ok = r.nichtBestanden.length === 0;
  if (r.ok) probe.ok++; else probe.abweichungen.push(u + ': ' + r.nichtBestanden.join(','));
  probe.tage.push(r);
  process.stderr.write('Probe ' + i + '/' + PROBEN + ' ' + u + ' ' + (r.ok ? 'ok' : 'ABWEICHUNG ' + r.nichtBestanden.join(',')) + '\n');
}

/* ---------- §2.4 Groesse ---------- */
var t24 = { jeJahr: {}, bytesGz: 0, bytesRoh: 0, zeilen: 0, dateien: 0, fehlend: 0, utcTage: 0, stuecke: { bytesGz: 0, zeilen: 0, anzahl: 0 } };
UTC.forEach(function (u) {
  var gz = path.join(A, 'roh', u + '.tsv.gz'); if (!fs.existsSync(gz)) return;
  var y = u.slice(0, 4), j = t24.jeJahr[y] = t24.jeJahr[y] || { utcTage: 0, bytesGz: 0, bytesRoh: 0, zeilen: 0, dateien: 0, fehlend: 0 }, b = beleg(u), sz = fs.statSync(gz).size;
  j.utcTage++; j.bytesGz += sz; t24.utcTage++; t24.bytesGz += sz;
  if (b) { j.bytesRoh += b.bytesRoh; j.zeilen += b.zeilen; j.dateien += b.dateien; j.fehlend += b.fehlend.length; t24.bytesRoh += b.bytesRoh; t24.zeilen += b.zeilen; t24.dateien += b.dateien; t24.fehlend += b.fehlend.length; }
});
t2.stuecke.forEach(function (s) { t24.stuecke.anzahl++; t24.stuecke.bytesGz += s.bytesGz; t24.stuecke.zeilen += s.zeilen; });
Object.keys(t24.jeJahr).forEach(function (y) { t24.jeJahr[y].gb = +(t24.jeJahr[y].bytesGz / 1e9).toFixed(2); });
t24.gb = +(t24.bytesGz / 1e9).toFixed(2); t24.gib = +(t24.bytesGz / 1073741824).toFixed(2);
t24.downloadZipBytes = t1.summen.bytesZip; t24.downloadCsvBytes = t1.summen.bytesCsv; t24.downloadTB = +(t1.summen.bytesZip / 1e12).toFixed(3);
t24.anteilAuszugAmDownload = +(t24.bytesGz / t1.summen.bytesZip * 100).toFixed(2);

/* ---------- Lauf-Eckdaten aus den Logs ---------- */
var lauf = { teile: [], start: null, ende: null, dateien: 0, netzfehlerTage: [], nacharbeitZeilen: [] };
for (var k2 = 1; k2 <= TEILE; k2++) {
  var lp = path.join(A, 'log-' + k2 + '.txt'); if (!fs.existsSync(lp)) continue;
  var zl = fs.readFileSync(lp, 'utf8').split('\n'), t = { teil: k2 };
  zl.forEach(function (l) {
    var m;
    if (!t.start && (m = new RegExp('^(\\S+) START .* teil ' + k2 + '/' + TEILE + ' tage=(\\d+)').exec(l))) { t.start = m[1]; t.tage = +m[2]; }
    else if (!t.ende && (m = new RegExp('^(\\S+) ENDE teil ' + k2 + '/' + TEILE + ' tage=(\\d+) dateien=(\\d+) (\\d+) s').exec(l))) { t.ende = m[1]; t.dateien = +m[3]; t.sekunden = +m[4]; }
    else if ((m = /^(\S+) (\d{4}-\d\d-\d\d) dateien=(\d+)\/(\d+) fehlend=(\d+)(?:\([^)]*\))? fehler=([1-9]\d*)\((.*?)\)/.exec(l))) { if (m[1] < '2026-09-23') lauf.netzfehlerTage.push({ tag: m[2], teil: k2, gefunden: +m[3], soll: +m[4], fehler: m[7] }); }   // die Fehlend-Klammer traegt Leerzeichen (mehrere Stempel)
    if (/ teil 1\/1 /.test(l) || (/^2026-09-2[3-9]T/.test(l) && !/fortschritt/.test(l))) lauf.nacharbeitZeilen.push(l);
  });
  lauf.teile.push(t);
  if (t.start && (!lauf.start || t.start < lauf.start)) lauf.start = t.start;
  if (t.ende && (!lauf.ende || t.ende > lauf.ende)) lauf.ende = t.ende;
  lauf.dateien += t.dateien || 0;
}
lauf.netzfehlerTage.sort(function (a, b) { return a.tag < b.tag ? -1 : 1; });

var erg = { kennung: 'nachrichten-stimmung-tage-2026-09-19/gdelt/v1 abschluss', erstellt: new Date().toISOString(), ablage: A,
  kalender: { etTage: ET.length, etVon: ET[0], etBis: ET[ET.length - 1], utcTage: UTC.length, utcVon: UTC[0], utcBis: UTC[UTC.length - 1] },
  tagesdateien: t1, fortschritt: fort, plausibilitaet: t13, rohauszug: t2, stichprobe: probe, groesse: t24, lauf: lauf };
fs.mkdirSync(path.join(A, 'pruefung'), { recursive: true });
var zielP = path.join(A, 'pruefung', 'abschluss.json');
fs.writeFileSync(zielP + '.tmp', JSON.stringify(erg, null, 1)); fs.renameSync(zielP + '.tmp', zielP);

console.log('Kalender: ET-Tage ' + ET.length + ' (' + ET[0] + '..' + ET[ET.length - 1] + '), UTC-Tage ' + UTC.length + ' (' + UTC[0] + '..' + UTC[UTC.length - 1] + ')');
console.log('§1.1 Tagesdateien: ' + t1.vorhanden + '/' + t1.erwartet + ' ungueltig=' + t1.ungueltig.length + ' unvollstaendig=' + t1.unvollstaendig.length + ' fehler-Summe=' + t1.summen.fehler + ' (Tage: ' + t1.fehlerTage.map(function (x) { return x.tag; }).join(' ') + ') fehlend(404)=' + t1.summen.fehlend + ' gefunden=' + t1.summen.gefunden + ' soll=' + t1.summen.soll);
console.log('     n=' + t1.nSumme + ' nSpaet=' + t1.nSpaetSumme + ' treffer=' + t1.summen.treffer + ' (gleich: ' + t1.nPlusNSpaetGleichTreffer + ') mitOrganisation=' + t1.summen.mitOrganisation + ' zeilen=' + t1.summen.zeilen + ' fremderTag=' + t1.summen.fremderTag + ' stempelAusDatei=' + t1.summen.stempelAusDatei + ' symbole=' + t1.symboleGesamt);
console.log('     offeneTage in Fortschritt: ' + fort.offeneEintraege.length + ', davon laut Tagesdatei noch offen: ' + fort.nochOffen.length + ' ' + fort.nochOffen.join(' '));
Object.keys(t13).forEach(function (y) { var s = t13[y]; console.log('§1.3 ' + y + ': ' + s.tage + ' Tage, treffer Median ' + s.treffer.median + ' P5 ' + s.treffer.p5 + ' P95 ' + s.treffer.p95 + ', Ausreisser<10%: ' + s.ausreisser.length + (s.ausreisser.length ? ' (' + s.ausreisser.map(function (a) { return a.tag + ':' + a.treffer + '/' + a.gefunden + 'D'; }).join(' ') + ')' : '')); });
console.log('§2.1 UTC-Tage: erwartet ' + t2.erwartet + ' vorhanden ' + t2.vorhanden + ' fehlend ' + t2.fehlend.length + ' (' + t2.fehlend.join(' ') + ') ohneBeleg=' + t2.ohneBeleg.length + ' Stuecke=' + t2.stuecke.length + ' (Randtage: ' + t2.randtage.join(' ') + ') Reste=' + t2.reste.length + ' stueckeOhneBeleg=' + t2.stueckeOhneBeleg.length);
console.log('§2.3 Stichprobe: ' + probe.ok + '/' + PROBEN + ' bestanden' + (probe.abweichungen.length ? ' ABWEICHUNGEN: ' + probe.abweichungen.join('; ') : ''));
console.log('§2.4 Auszug: ' + t24.utcTage + ' UTC-Tage, ' + t24.gb + ' GB (' + t24.gib + ' GiB), ' + t24.zeilen + ' Zeilen, ' + t24.dateien + ' Quelldateien, fehlend(404) ' + t24.fehlend + '; Stuecke ' + t24.stuecke.anzahl + ' = ' + t24.stuecke.zeilen + ' Zeilen; Download ' + t24.downloadTB + ' TB zip, Auszug = ' + t24.anteilAuszugAmDownload + ' %');
Object.keys(t24.jeJahr).forEach(function (y) { var j = t24.jeJahr[y]; console.log('     ' + y + ': ' + j.utcTage + ' Tage ' + j.gb + ' GB ' + j.zeilen + ' Zeilen fehlend ' + j.fehlend); });
console.log('Lauf: ' + lauf.teile.length + ' Teile, Start ' + lauf.start + ' Ende ' + lauf.ende + ', Dateien ' + lauf.dateien + ', Netzfehler-Tage im Vollauf ' + lauf.netzfehlerTage.length + ', Nacharbeit-Zeilen ' + lauf.nacharbeitZeilen.length);
console.log('geschrieben: ' + zielP);
