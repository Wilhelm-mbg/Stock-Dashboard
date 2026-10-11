'use strict';
/* LESEN - der EINZIGE Weg dieser Studie an das Panel (REGEL.md Z22, Nachtrag 1 (7)).
 *
 * Ohne gueltiges Siegel liest oeffne() die Jahresbloecke ab 2023 GAR NICHT und schneidet den letzten Tag auf den letzten
 * Handelstag vor dem 01.01.2023. Die Pruefzeit gibt es nur mit opt.pruefzeit = true, und dann nur, wenn pruefeSiegel() durchgeht:
 *   - KANDIDATEN.json liegt im Studienordner,
 *   - `git log -1 --format=%H -- KANDIDATEN.json` liefert einen Commit,
 *   - `git diff --quiet <hash> -- KANDIDATEN.json` ist still und `git status --porcelain` fuer die Datei leer,
 *   - die Git-Pruefsumme der Datei (`git hash-object`) gleicht der des Commits (`git rev-parse <hash>:<pfad>`).
 * Sonst wirft der Aufruf. Die Tafel hat dieselbe Form wie die des Pruefstands (dessen Tafel-Funktion, hier mit Jahresfilter
 * nachgebaut; test.js haelt beide am Kunstpanel Feld fuer Feld gegeneinander).
 *
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var crypto = require('crypto');
var KN = require('./konfig.js');
var K = require(path.join(KN.PRUEFSTAND, 'konfig.js'));
var P = require(path.join(KN.PRUEFSTAND, 'paneldaten.js'));
var PR = require(path.join(KN.PRUEFSTAND, 'pruefstand.js'));

/* Das Panel v2.3 - nur hier bekannt. */
var PANEL_AUS = path.join(KN.PRUEFSTAND, 'voll-v23c');

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function sperrFehler(text) { var e = new Error('SPERRE: ' + text); e.sperre = true; return e; }

/** Siegel pruefen. opt.repo (Vorgabe: dieses Repo), opt.pfad (relativ zum Repo; Vorgabe ORDNER_REL/KANDIDATEN.json). */
function pruefeSiegel(opt) {
  opt = opt || {};
  var repo = opt.repo || KN.REPO, rel = (opt.pfad || (KN.ORDNER_REL + '/' + KN.SIEGEL_DATEI)).replace(/\\/g, '/');
  var abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) throw sperrFehler(rel + ' fehlt - die Pruefzeit bleibt zu');
  var git = function (args) { return cp.spawnSync('git', args, { cwd: repo, encoding: 'buffer', windowsHide: true }); };
  var lg = git(['log', '-1', '--format=%H', '--', rel]);
  var hash = lg.status === 0 ? lg.stdout.toString('utf8').trim() : '';
  if (!/^[0-9a-f]{40}$/.test(hash)) throw sperrFehler(rel + ' liegt in keinem Commit');
  var df = git(['diff', '--quiet', hash, '--', rel]);
  if (df.status !== 0) throw sperrFehler(rel + ' ist seit ' + hash.slice(0, 7) + ' veraendert');
  var st = git(['status', '--porcelain', '--', rel]);
  if (st.status !== 0 || st.stdout.toString('utf8').trim() !== '') throw sperrFehler(rel + ' hat ungesicherte Aenderungen');
  /* Pruefsumme: Blob-Hash der Datei (mit denselben Zeilenende-Filtern wie beim Commit) gegen den Blob im Commit */
  var ho = git(['hash-object', '--', rel]), rp = git(['rev-parse', hash + ':' + rel]);
  var ist = ho.status === 0 ? ho.stdout.toString('utf8').trim() : '', soll = rp.status === 0 ? rp.stdout.toString('utf8').trim() : '';
  if (!ist || ist !== soll) throw sperrFehler('Pruefsumme von ' + rel + ' weicht vom Commit ab');
  return { commit: hash, blob: ist, sha256: sha256(fs.readFileSync(abs)), pfad: rel };
}

/** Schlusszeiten des Kalenders (Halbtage 13:00) - nur gelesen; null, wenn das Archiv nicht da ist. */
function kalenderSchluss() {
  try { return K.kalender().close; } catch (e) { return null; }
}

/**
 * Panel oeffnen. opt.aus (Panelordner mit panel/; Vorgabe voll-v23c), opt.kennung (Vorgabe Panel v2.3), opt.pruefzeit (true =
 * auch ab 2023 - nur mit Siegel), opt.siegel (Optionen fuer pruefeSiegel), opt.schluss (Schlusszeiten; Vorgabe kalenderSchluss()).
 */
function oeffne(opt) {
  opt = opt || {};
  var aus = opt.aus || PANEL_AUS, kennung = opt.kennung || K.PANEL_KENNUNG_V23;
  var siegel = null;
  if (opt.pruefzeit) siegel = pruefeSiegel(opt.siegel);           /* wirft ohne gueltiges Siegel - VOR jedem Lesen */
  var ordner = path.join(aus, 'panel');
  var stand = JSON.parse(fs.readFileSync(path.join(ordner, '_stand.json'), 'utf8'));
  if (stand.kennung !== kennung) throw new Error('Panelkennung ' + stand.kennung + ' statt ' + kennung);
  if (!Array.isArray(stand.tage) || !stand.tage.length) throw new Error('_stand.json ohne tage');
  var tage = stand.tage, idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  var sperrIdx = -1; for (var i = 0; i < tage.length; i++) if (tage[i] < KN.SPERRE_AB) sperrIdx = i;
  var offen = !!siegel;
  var jahre = stand.jahre.map(function (j) { return j.jahr; }).filter(function (j) { return offen || j < +KN.SPERRE_AB.slice(0, 4); })
    .sort(function (a, b) { return a - b; });
  var bloecke = jahre.map(function (j) { return P.leseBlock(path.join(ordner, j + '.bin'), kennung); });
  var n = 0; bloecke.forEach(function (b) { n += b.n; });

  var g = { n: 0 };
  g.tag = new Int32Array(n); g.sym = new Uint16Array(n); g.marken = new Uint8Array(n); g.klasse = new Int8Array(n);
  g.rohSchluss = new Float64Array(n); g.bSchluss = new Float64Array(n); g.bEroeffnung = new Float64Array(n);
  g.rendite = new Float32Array(n); g.renditeOC = new Float32Array(n); g.umsatz = new Float64Array(n);
  var o = 0;
  bloecke.forEach(function (b) {
    for (var q = 0; q < b.n; q++) {
      if (!offen && b.tag[q] > sperrIdx) throw sperrFehler('Block enthaelt einen Tag ab ' + KN.SPERRE_AB + ' (' + tage[b.tag[q]] + ')');
      g.tag[o] = b.tag[q]; g.sym[o] = b.sym[q]; g.marken[o] = b.marken[q]; g.klasse[o] = b.klasse[q];
      g.rohSchluss[o] = b.rohSchluss[q];
      g.bSchluss[o] = b.rohSchluss[q] / b.faktor[q];
      g.bEroeffnung[o] = b.rohEroeffnung[q] / b.faktor[q];
      g.rendite[o] = b.rendite[q]; g.renditeOC[o] = b.renditeOC[q];
      g.umsatz[o] = b.umsatzReg[q] + b.umsatzAuktion[q];
      o++;
    }
  });
  g.n = o; bloecke = null;

  if (stand.letzterVollTagIdx == null) throw new Error('_stand.json ohne letzterVollTagIdx');
  var maxTag = offen ? stand.letzterVollTagIdx : Math.min(stand.letzterVollTagIdx, sperrIdx);
  var nTage = tage.length;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (var i2 = 0; i2 < g.n; i2++) { var t = g.tag[i2]; if (tagVon[t] < 0) tagVon[t] = i2; tagBis[t] = i2 + 1; }
  var nSym = stand.symbole.length;
  var zaehl = new Int32Array(nSym + 1);
  for (var i3 = 0; i3 < g.n; i3++) zaehl[g.sym[i3] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(g.n), fuell = Int32Array.from(zaehl);
  for (var i4 = 0; i4 < g.n; i4++) symZeilen[fuell[g.sym[i4]]++] = i4;
  var posInReihe = new Int32Array(g.n);
  for (var s2 = 0; s2 < nSym; s2++) for (var q2 = symStart[s2]; q2 < symStart[s2 + 1]; q2++) posInReihe[symZeilen[q2]] = q2 - symStart[s2];
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var symName = stand.symbole.map(function (r) { return r.reihe; }), symIdx = {};
  symName.forEach(function (nm, i5) { symIdx[nm] = i5; });
  return { g: g, stand: stand, kal: { tage: tage, idx: idx, close: null }, maxTag: maxTag, nTage: nTage, nSym: nSym,
    tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen, posInReihe: posInReihe,
    zeileVon: zeileVon, endeGrund: stand.symbole.map(function (r) { return r.ende_grund; }), symName: symName, symIdx: symIdx,
    zurueck: function (z, k) { var sy = g.sym[z], p = posInReihe[z] - k; return p < 0 ? -1 : symZeilen[symStart[sy] + p]; },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; },
    gesperrt: !offen, sperrIdx: sperrIdx, siegel: siegel, jahreGelesen: jahre,
    schluss: opt.schluss !== undefined ? opt.schluss : kalenderSchluss() };
}

/** Universumsfilter des Pruefstands auf dieser Tafel (Z4). */
function universum(T, tag, opt) { return PR.universum(T, tag, opt); }

/** NUR FUER test.js: ein Kunstpanel im Panelformat schreiben. d = { kennung, tage, symbole, letzterVollTagIdx, zeilen: [...] },
 *  Zeilen nach (tag, sym) sortiert; Felder wie die Spalten des Panels (sym, tag, marken, klasse, rohSchluss, rohEroeffnung, faktor,
 *  rendite, renditeOC, umsatzReg, umsatzAuktion). */
function schreibeKunstpanel(aus, d) {
  var ordner = path.join(aus, 'panel'); fs.mkdirSync(ordner, { recursive: true });
  var jeJahr = {};
  d.zeilen.forEach(function (z) { var j = +d.tage[z.tag].slice(0, 4); (jeJahr[j] = jeJahr[j] || []).push(z); });
  var jahre = Object.keys(jeJahr).map(Number).sort(function (a, b) { return a - b; });
  jahre.forEach(function (j) {
    var zl = jeJahr[j], sp = P.leer(zl.length);
    zl.forEach(function (z, i) { P.SPALTEN.forEach(function (c) { sp[c.name][i] = z[c.name] !== undefined ? z[c.name] : (c.name === 'faktor' ? 1 : 0); }); });
    P.schreibeBlock(path.join(ordner, j + '.bin'), sp, zl.length, { kennung: d.kennung });
  });
  fs.writeFileSync(path.join(ordner, '_stand.json'), JSON.stringify({ kennung: d.kennung, tage: d.tage, symbole: d.symbole,
    letzterVollTagIdx: d.letzterVollTagIdx, jahre: jahre.map(function (j) { return { jahr: j, n: jeJahr[j].length }; }) }));
}

/** NUR FUER test.js: die eigene Tafel gegen die Tafel des Pruefstands halten (Feld fuer Feld). Rueckgabe { zeilen, abweichungen }.
 *  Gesperrt: jede eigene Zeile muss der Pruefstand-Zeile gleichen Inhalts entsprechen, und der Pruefstand hat zusaetzlich nur Tage ab 2023. */
function gegenPruefstand(aus, kennung, eigen) {
  var T0 = PR.Tafel(aus, { panelKennung: kennung }), T1 = eigen, ab = 0, felder = ['tag', 'sym', 'marken', 'klasse', 'rohSchluss', 'bSchluss', 'bEroeffnung', 'rendite', 'renditeOC', 'umsatz'];
  var n0 = 0; for (var i = 0; i < T0.g.n; i++) if (T1.gesperrt ? T0.g.tag[i] <= T1.sperrIdx : true) n0++;
  if (n0 !== T1.g.n) ab++;
  var j = 0;
  for (var q = 0; q < T0.g.n && j < T1.g.n; q++) {
    if (T1.gesperrt && T0.g.tag[q] > T1.sperrIdx) continue;
    felder.forEach(function (f) { var a = T0.g[f][q], b = T1.g[f][j]; if (!(a === b || (a !== a && b !== b))) ab++; });
    if (T0.posInReihe[q] !== T1.posInReihe[j]) ab++;
    j++;
  }
  var maxSoll = T1.gesperrt ? Math.min(T0.maxTag, T1.sperrIdx) : T0.maxTag;
  if (maxSoll !== T1.maxTag) ab++;
  return { zeilen: T1.g.n, zeilenPruefstand: T0.g.n, abweichungen: ab };
}

module.exports = { oeffne: oeffne, pruefeSiegel: pruefeSiegel, universum: universum, kalenderSchluss: kalenderSchluss,
  schreibeKunstpanel: schreibeKunstpanel, gegenPruefstand: gegenPruefstand, sha256: sha256 };
