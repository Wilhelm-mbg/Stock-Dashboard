'use strict';
/* ================= Abschnitts-Laeufer fuer test-v6.js =================
 *
 * WOZU. Die Suite hat ueber 5.400 Pruefungen in ueber hundert Abschnitten; jede
 * Sitzung faehrt sie mehrfach, und das ist der groesste Kostenposten einer
 * Klinken-Sitzung (wiki/offene-auftraege.md, "Abschnitts-Laeufer fuer test-v6.js").
 * Wer an einem Abschnitt arbeitet, braucht zwischendurch nur DIESEN Abschnitt.
 *
 * Aufruf - immer ueber test-v6.js, aus der Repo-Wurzel:
 *
 *   node test-v6.js --abschnitt 72              alle Abschnitte mit der Nummer 72
 *   node test-v6.js --abschnitt 17b 44 Wachhund  mehrere; Text = Teil des Kopfes
 *   node test-v6.js --abschnitt 90-100          Nummernbereich (97b gehoert dazu)
 *   node test-v6.js --abschnitt "44) Design"    genau einer, wenn die Nummer doppelt ist
 *   node test-v6.js --abschnitt lfd:57          laufende Nummer aus --liste (eindeutig)
 *   node test-v6.js --nur-geaendert             was sich gegenueber main geaendert hat
 *   node test-v6.js --nur-geaendert --gegen origin/main
 *   node test-v6.js --liste                     die Gliederung mit Zeilen und Quelldateien
 *   node test-v6.js --zeiten                    alles, mit Laufzeit je Abschnitt am Ende
 *   node test-v6.js --abschnitt 72 --trocken    nur zeigen, was laufen wuerde
 *
 * Ohne einen dieser Schalter laeuft test-v6.js wie immer, Zeile fuer Zeile - der
 * Laeufer wird dann nicht einmal geladen. Ein Teil-Lauf ersetzt NICHT den vollen
 * Lauf vor dem Push (`npm test`); er sagt das am Ende auch.
 *
 * WIE. test-v6.js ist eine Folge oberster Anweisungen. Der Laeufer liest sie mit
 * espree (kommt mit eslint) und gliedert sie:
 *   - Vorspann: alles vor dem ersten Abschnittskopf (ok, fails, probe, ...). Laeuft immer.
 *   - Abschnitt: beginnt an einem obersten `console.log('<Kopf>')` oder an einer
 *     obersten IIFE, deren erste Anweisung ein solcher console.log ist. Alles bis
 *     zum naechsten Beginn gehoert dazu (auch IIFEs ohne eigenen Kopf).
 *   - Schluss: `Promise.all(offeneProben).then(...)`. Laeuft immer.
 * Dann wird der Quelltext in einem EIGENEN Prozess ausgefuehrt, wobei die nicht
 * gewaehlten Abschnitte durch Leerzeilen ersetzt werden. Zeilennummern bleiben
 * damit gleich (Fehlermeldungen zeigen auf die echte Zeile in test-v6.js), und
 * __filename, __dirname und require sind die von test-v6.js.
 *
 * Abhaengigkeiten: Die ersten Abschnitte arbeiten mit obersten Variablen, die ein
 * frueherer Abschnitt angelegt hat (z. B. `t0` aus Abschnitt 1). Der Laeufer findet
 * solche Bezuege mit eslint-scope und nimmt den liefernden Abschnitt mit - er sagt
 * es im Kopf des Laufs ("mitgenommen"). Was er NICHT sehen kann, ist Zustand, den
 * ein Abschnitt zur Laufzeit hinterlaesst (Dateien, Modul-Zustand). Deshalb laeuft
 * zur Abnahme jeder Abschnitt einmal allein (pruefberichte/2026-10-testlaeufer.md).
 *
 * --nur-geaendert: geaenderte Dateien = `git diff --name-only <merge-base mit main>`
 * plus ungetrackte Dateien. Ein Abschnitt ist betroffen, wenn er eine dieser Dateien
 * nennt (Zeichenketten und Regex-Literale mit Dateipfad, z. B. __dirname + '/depot.js')
 * - oder eine Datei, die eine genannte per require() nachlaedt. In test-v6.js selbst
 * zaehlen die geaenderten Zeilen: ein geaenderter Abschnitt laeuft, ein geaenderter
 * Vorspann oder Schluss laesst alles laufen. Dateien ohne Abschnitt werden genannt.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const childProcess = require('child_process');
const Modul = require('module');
const { AsyncLocalStorage } = require('async_hooks');

/* Die Schalter, an denen test-v6.js den Laeufer erkennt. Alles andere auf der
 * Kommandozeile laesst test-v6.js unbeachtet - wie bisher. */
const SCHALTER = /^--(abschnitt|nur-geaendert|liste|zeiten|gegen|trocken)(=|$)/;

function gewuenscht(argumente) {
  return argumente.some(function (a) { return SCHALTER.test(a); });
}

/* Aus test-v6.js heraus: den Lauf an einen eigenen Prozess uebergeben und dessen
 * Rueckgabewert liefern. Ein durch ein Signal beendeter Prozess hat status null -
 * das darf nie als 0 (gruen) durchgehen. */
function uebernehmen(testDatei, argumente, optionen) {
  const r = childProcess.spawnSync(process.execPath,
    [__filename, '--datei', testDatei].concat(argumente), { stdio: (optionen && optionen.stdio) || 'inherit' });
  if (r.error) { console.error('Abschnitts-Laeufer: ' + r.error.message); return 2; }
  return r.status === 0 ? 0 : (r.status || 1);
}

/* ------------------------------------------------------------------ Gliederung */

function espree() {
  try { return require('espree'); } catch (e) {
    throw new Error('espree fehlt (kommt mit eslint) - im Repo `npm install` ausfuehren');
  }
}

function parsen(quelle) {
  return espree().parse(quelle, { ecmaVersion: 2022, sourceType: 'script', loc: true, range: true });
}

function istLog(st) {
  return !!st && st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' &&
    st.expression.callee.type === 'MemberExpression' && !st.expression.callee.computed &&
    st.expression.callee.object.type === 'Identifier' && st.expression.callee.object.name === 'console' &&
    st.expression.callee.property.name === 'log';
}

/* Text des ersten Arguments eines console.log, wenn es eine feste Zeichenkette ist. */
function logText(st) {
  if (!istLog(st)) return null;
  const a = st.expression.arguments[0];
  if (a && a.type === 'Literal' && typeof a.value === 'string') return a.value;
  if (a && a.type === 'TemplateLiteral' && a.expressions.length === 0) return a.quasis[0].value.cooked;
  return null;
}

function iifeRumpf(st) {
  if (!st || st.type !== 'ExpressionStatement' || st.expression.type !== 'CallExpression') return null;
  const f = st.expression.callee;
  if ((f.type === 'FunctionExpression' || f.type === 'ArrowFunctionExpression') && f.body.type === 'BlockStatement') return f.body.body;
  return null;
}

function istSchluss(st) {
  /* Promise.all(offeneProben).then(...) */
  if (!st || st.type !== 'ExpressionStatement' || st.expression.type !== 'CallExpression') return false;
  const c = st.expression.callee;
  if (c.type !== 'MemberExpression' || c.property.name !== 'then' || c.object.type !== 'CallExpression') return false;
  const inner = c.object;
  return inner.callee.type === 'MemberExpression' && inner.callee.object.name === 'Promise' &&
    inner.callee.property.name === 'all' && inner.arguments.length === 1 &&
    inner.arguments[0].type === 'Identifier' && inner.arguments[0].name === 'offeneProben';
}

function kopfBereinigt(text) { return String(text).replace(/^\s+/, '').replace(/\s+$/, ''); }

function falte(s) {
  return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/* Gliedert den Quelltext. Liefert { ast, vorspann, einheiten, schluss } mit
 * Anweisungsindizes; wirft, wenn die Datei nicht die erwartete Form hat - ein
 * Teil-Lauf ueber eine falsch verstandene Datei waere schlimmer als keiner. */
function gliederung(quelle) {
  const ast = parsen(quelle);
  const body = ast.body;
  const kopfAn = [];   // Index -> Kopftext, wo eine Einheit beginnt
  for (let i = 0; i < body.length; i++) {
    const t = logText(body[i]);
    if (t !== null && kopfBereinigt(t)) { kopfAn[i] = t; continue; }
    const rumpf = iifeRumpf(body[i]);
    if (rumpf && rumpf.length && !(i > 0 && kopfAn[i - 1] !== undefined)) {
      const ti = logText(rumpf[0]);
      if (ti !== null && kopfBereinigt(ti)) kopfAn[i] = ti;
    }
  }
  const letzte = body.length - 1;
  if (letzte < 0 || !istSchluss(body[letzte])) {
    throw new Error('test-v6.js endet nicht mit Promise.all(offeneProben).then(...) - Gliederung verweigert');
  }
  let erste = -1;
  for (let i = 0; i < letzte; i++) { if (kopfAn[i] !== undefined) { erste = i; break; } }
  if (erste < 0) throw new Error('kein Abschnittskopf gefunden');
  const vorspann = [];
  for (let i = 0; i < erste; i++) vorspann.push(i);
  const einheiten = [];
  let akt = null;
  for (let i = erste; i < letzte; i++) {
    if (kopfAn[i] !== undefined) {
      const kopf = kopfBereinigt(kopfAn[i]);
      const m = /^(\d+[a-z]?)\)/i.exec(kopf);
      akt = { lfd: einheiten.length + 1, kopf: kopf, nummer: m ? m[1].toLowerCase() : null, anweisungen: [] };
      einheiten.push(akt);
    }
    akt.anweisungen.push(i);
  }
  const zeilenVorher = vorspann.length ? body[vorspann[vorspann.length - 1]].loc.end.line : 0;
  let bisher = zeilenVorher;
  einheiten.forEach(function (e) {
    const a = body[e.anweisungen[0]], z = body[e.anweisungen[e.anweisungen.length - 1]];
    e.startZeile = a.loc.start.line;
    e.endZeile = z.loc.end.line;
    /* Der Bereich reicht vom Ende der vorigen Einheit bis zum eigenen Ende: Kommentare
     * ueber einem Abschnitt gehoeren zu ihm (fuer --nur-geaendert). */
    e.bereichStart = bisher + 1;
    bisher = e.endZeile;
  });
  return {
    ast: ast, vorspann: vorspann, einheiten: einheiten, schluss: [letzte],
    vorspannEnde: zeilenVorher, schlussStart: body[letzte].loc.start.line
  };
}

/* Jede oberste Anweisung gehoert genau einem Teil an - sonst wird nicht gelaufen. */
function abdeckungPruefen(gl) {
  const n = gl.ast.body.length;
  const gesehen = new Array(n).fill(0);
  gl.vorspann.forEach(function (i) { gesehen[i]++; });
  gl.schluss.forEach(function (i) { gesehen[i]++; });
  gl.einheiten.forEach(function (e) { e.anweisungen.forEach(function (i) { gesehen[i]++; }); });
  const falsch = gesehen.map(function (x, i) { return x === 1 ? -1 : i; }).filter(function (i) { return i >= 0; });
  return { ok: falsch.length === 0, anweisungen: n, falsch: falsch };
}

/* ------------------------------------------------------------------ Auswahl */

/* muster: Liste von Nummern ("72", "17b"), Bereichen ("90-100"), laufenden Nummern
 * ("lfd:57") oder Text (Teil des Kopfes, Gross/klein und Umlaute egal).
 * Liefert { lfd: [..], ohneTreffer: [..] }. */
function waehle(einheiten, muster) {
  const gewaehlt = new Set();
  const ohneTreffer = [];
  muster.forEach(function (roh) {
    const m = String(roh).trim();
    if (!m) return;
    let treffer;
    const bereich = /^(\d+)-(\d+)$/.exec(m);
    const lfd = /^lfd:(\d+)$/i.exec(m);
    if (lfd) {
      treffer = einheiten.filter(function (e) { return e.lfd === +lfd[1]; });
    } else if (/^\d+[a-z]?$/i.test(m)) {
      treffer = einheiten.filter(function (e) { return e.nummer === m.toLowerCase(); });
    } else if (bereich) {
      const von = +bereich[1], bis = +bereich[2];
      treffer = einheiten.filter(function (e) {
        const z = e.nummer ? parseInt(e.nummer, 10) : NaN;
        return z >= von && z <= bis;
      });
    } else {
      const f = falte(m);
      treffer = einheiten.filter(function (e) { return falte(e.kopf).indexOf(f) > -1; });
    }
    if (!treffer.length) ohneTreffer.push(m);
    treffer.forEach(function (e) { gewaehlt.add(e.lfd); });
  });
  return { lfd: Array.from(gewaehlt).sort(function (a, b) { return a - b; }), ohneTreffer: ohneTreffer };
}

/* ------------------------------------------------------------------ Abhaengigkeiten */

function anweisungsSucher(body) {
  const starts = body.map(function (st) { return st.range[0]; });
  return function (offset) {
    let lo = 0, hi = starts.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] <= offset) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best >= 0 && offset < body[best].range[1] ? best : -1;
  };
}

function einheitVonAnweisung(gl) {
  const einheitVon = new Array(gl.ast.body.length).fill(0);   // 0 = Vorspann/Schluss
  gl.einheiten.forEach(function (e) { e.anweisungen.forEach(function (i) { einheitVon[i] = e.lfd; }); });
  return einheitVon;
}

/* Oberste Variablen: in welchen obersten Anweisungen angelegt, in welchen benutzt
 * (auch aus Funktionen darin heraus). Einmal je Gliederung gerechnet. */
function globaleBezuege(gl) {
  if (gl.bezuege) return gl.bezuege;
  const scope = require('eslint-scope');
  /* nodejsScope: test-v6.js laeuft wie jedes CommonJS-Modul in einer Funktion. Ohne
   * diese Angabe loest eslint-scope Bezuege auf oberste var-Variablen gar nicht auf
   * (im echten globalen Bereich koennten sie von aussen kommen) - die Abhaengigkeiten
   * waeren dann still leer. */
  const sm = scope.analyze(gl.ast, {
    ecmaVersion: 2022, sourceType: 'script', nodejsScope: true, childVisitorKeys: require('eslint-visitor-keys').KEYS
  });
  const modul = sm.globalScope.childScopes.filter(function (s) { return s.block === gl.ast; })[0];
  if (!modul) throw new Error('eslint-scope lieferte keinen Modulbereich');
  const finde = anweisungsSucher(gl.ast.body);
  gl.bezuege = modul.variables.map(function (v) {
    return {
      name: v.name,
      defs: v.defs.map(function (d) { return finde(d.name.range[0]); }).filter(function (i) { return i >= 0; }),
      refs: v.references.map(function (r) { return finde(r.identifier.range[0]); }).filter(function (i) { return i >= 0; })
    };
  });
  return gl.bezuege;
}

/* Welche Einheit braucht oberste Variablen welcher anderen? Liefert
 * Map lfd -> Map(lfd-des-Lieferanten -> [Variablennamen]). */
function abhaengigkeiten(gl) {
  const einheitVon = einheitVonAnweisung(gl);
  const ergebnis = new Map();
  globaleBezuege(gl).forEach(function (v) {
    const lieferanten = new Set();
    v.defs.forEach(function (i) { if (einheitVon[i]) lieferanten.add(einheitVon[i]); });
    if (!lieferanten.size) return;              // im Vorspann angelegt: laeuft ohnehin immer
    v.refs.forEach(function (i) {
      const nutzer = einheitVon[i];
      if (!nutzer || lieferanten.has(nutzer)) return;   // eigene Deklaration gilt
      if (!ergebnis.has(nutzer)) ergebnis.set(nutzer, new Map());
      lieferanten.forEach(function (l) {
        const m = ergebnis.get(nutzer);
        if (!m.has(l)) m.set(l, []);
        if (m.get(l).indexOf(v.name) < 0) m.get(l).push(v.name);
      });
    });
  });
  return ergebnis;
}

/* Gewaehlte Einheiten plus alles, was sie (auch mittelbar) brauchen. */
function mitAbhaengigkeiten(lfdListe, abh) {
  const drin = new Set(lfdListe);
  const mitgenommen = new Map();   // lfd -> [Grund]
  const offen = lfdListe.slice();
  while (offen.length) {
    const n = offen.pop();
    const m = abh.get(n);
    if (!m) continue;
    m.forEach(function (namen, l) {
      if (!drin.has(l)) { drin.add(l); offen.push(l); mitgenommen.set(l, []); }
      if (mitgenommen.has(l)) mitgenommen.get(l).push(namen.join(', ') + ' fuer ' + n);
    });
  }
  return { lfd: Array.from(drin).sort(function (a, b) { return a - b; }), mitgenommen: mitgenommen };
}

/* ------------------------------------------------------------------ Quelldateien */

function kinder(knoten, keys, f) {
  const k = keys[knoten.type] || [];
  k.forEach(function (name) {
    const w = knoten[name];
    if (Array.isArray(w)) w.forEach(function (x) { if (x && typeof x.type === 'string') f(x); });
    else if (w && typeof w.type === 'string') f(w);
  });
}

/* Alle Zeichenketten eines Teilbaums: String-Literale, Teile von Template-Literalen,
 * Muster von Regex-Literalen (dort mit aufgeloesten \/ und \.). */
function zeichenketten(knoten) {
  const keys = require('eslint-visitor-keys').KEYS;
  const out = [];
  (function lauf(n) {
    if (n.type === 'Literal') {
      if (typeof n.value === 'string') out.push(n.value);
      else if (n.regex) out.push(n.regex.pattern.replace(/\\(.)/g, '$1'));
    } else if (n.type === 'TemplateElement') out.push(n.value.cooked || '');
    kinder(n, keys, lauf);
  })(knoten);
  return out;
}

const PFAD = /(?:^|[^\w./-])\.{0,2}\/?((?:[\w-][\w.-]*\/)*[\w-][\w.-]*\.(?:js|mjs|cjs|json|html|md|css|cmd|sh))(?![\w-])/g;

/* Repo-Dateien, die in den Zeichenketten genannt werden. dateien = Set aller Repo-
 * Pfade (mit /), nachName = Map Dateiname -> [Pfade]. */
function genannteDateien(texte, dateien, nachName) {
  const gefunden = new Set();
  texte.forEach(function (t) {
    String(t).replace(/\\/g, '/').replace(PFAD, function (_, p) {
      const rein = p.replace(/^\.\//, '');
      if (dateien.has(rein)) { gefunden.add(rein); return ''; }
      const name = rein.split('/').pop();
      const kand = nachName.get(name) || [];
      /* Nur der Dateiname ist eindeutig genug, wenn es hoechstens drei gibt
       * (path.join(__dirname, 'tools', 'release.js') steht in Stuecken da). */
      if (kand.length && kand.length <= 3 && kand.every(function (k) { return k.split('/').pop() === name; })) {
        kand.forEach(function (k) { gefunden.add(k); });
      }
      return '';
    });
  });
  return gefunden;
}

/* require()-Graph der Repo-Dateien: Datei -> [nachgeladene Repo-Dateien]. */
function requireGraph(wurzel, dateien) {
  const graph = new Map();
  dateien.forEach(function (d) {
    if (!/\.(js|cjs|mjs)$/.test(d) || /^node_modules\//.test(d)) return;
    let q;
    try { q = fs.readFileSync(path.join(wurzel, d), 'utf8'); } catch (e) { return; }
    const ziele = [];
    const dir = path.posix.dirname(d);
    const re = /require\(\s*(?:__dirname\s*\+\s*)?(['"])(\.{0,2}\/[^'"]+)\1\s*\)/g;
    let m;
    while ((m = re.exec(q))) {
      let rel = m[2];
      if (rel.charAt(0) === '/') rel = '.' + rel;            // __dirname + '/x.js'
      let ziel = path.posix.normalize(path.posix.join(dir, rel));
      if (!dateien.has(ziel) && dateien.has(ziel + '.js')) ziel += '.js';
      if (dateien.has(ziel)) ziele.push(ziel);
    }
    graph.set(d, ziele);
  });
  return graph;
}

function huelle(start, graph) {
  const drin = new Set();
  const offen = Array.from(start);
  while (offen.length) {
    const d = offen.pop();
    if (drin.has(d)) continue;
    drin.add(d);
    (graph.get(d) || []).forEach(function (z) { if (!drin.has(z)) offen.push(z); });
  }
  return drin;
}

function git(wurzel, args) {
  const r = childProcess.spawnSync('git', args, { cwd: wurzel, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error('git nicht aufrufbar: ' + r.error.message);
  if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + String(r.stderr || '').trim());
  return r.stdout;
}

function repoDateien(wurzel) {
  return new Set(git(wurzel, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0').filter(Boolean));
}

/* Quelldateien je Einheit: die Dateien, die sie selbst nennt; die, die der Vorspann
 * fuer eine von ihr benutzte Variable laedt (`var Q = require('./quant.js')` - wer Q
 * benutzt, haengt an quant.js); die ihrer Lieferanten (siehe abhaengigkeiten); und
 * von alldem die require()-Huelle. */
function quelldateien(gl, wurzel, dateien) {
  const nachName = new Map();
  dateien.forEach(function (d) {
    const n = d.split('/').pop();
    if (!nachName.has(n)) nachName.set(n, []);
    nachName.get(n).push(d);
  });
  const graph = requireGraph(wurzel, dateien);
  const body = gl.ast.body;
  const genannt = body.map(function (st) { return genannteDateien(zeichenketten(st), dateien, nachName); });
  const einheitVon = einheitVonAnweisung(gl);
  const eigene = new Map();
  gl.einheiten.forEach(function (e) {
    const s = new Set();
    e.anweisungen.forEach(function (i) { genannt[i].forEach(function (d) { s.add(d); }); });
    eigene.set(e.lfd, s);
  });
  globaleBezuege(gl).forEach(function (v) {
    const ausVorspann = v.defs.filter(function (i) { return !einheitVon[i]; });
    if (!ausVorspann.length) return;
    v.refs.forEach(function (i) {
      const l = einheitVon[i];
      if (!l) return;
      ausVorspann.forEach(function (d) { genannt[d].forEach(function (x) { eigene.get(l).add(x); }); });
    });
  });
  const abh = abhaengigkeiten(gl);
  const je = new Map();
  gl.einheiten.forEach(function (e) {
    const s = new Set(eigene.get(e.lfd));
    mitAbhaengigkeiten([e.lfd], abh).lfd.forEach(function (l) { eigene.get(l).forEach(function (d) { s.add(d); }); });
    je.set(e.lfd, huelle(s, graph));
  });
  return je;
}

/* "@@ -a,b +c,d @@" -> geaenderte Zeilen der NEUEN Fassung (bei d = 0: die Stelle). */
function geaenderteZeilen(diffText) {
  const zeilen = [];
  String(diffText).split('\n').forEach(function (z) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(z);
    if (!m) return;
    const c = +m[1], d = m[2] === undefined ? 1 : +m[2];
    if (d === 0) { zeilen.push(c, c + 1); return; }
    for (let k = 0; k < d; k++) zeilen.push(c + k);
  });
  return zeilen;
}

/* Welche Einheiten treffen die geaenderten Zeilen von test-v6.js? 'alle', wenn
 * Vorspann oder Schluss betroffen sind. */
function einheitenZuZeilen(gl, zeilen) {
  const treffer = new Set();
  let alle = false;
  zeilen.forEach(function (z) {
    if (z <= gl.vorspannEnde || z >= gl.schlussStart) { alle = true; return; }
    gl.einheiten.forEach(function (e) { if (z >= e.bereichStart && z <= e.endZeile) treffer.add(e.lfd); });
  });
  return { alle: alle, lfd: Array.from(treffer).sort(function (a, b) { return a - b; }) };
}

/* "Gegenueber main": auf einem eigenen Zweig ist das main. Wer AUF main arbeitet (der
 * geteilte Arbeitsbaum), meint mit "geaendert" alles, was noch nicht auf origin/main
 * steht - eigene lokale Commits eingeschlossen. Mehr zu waehlen ist dabei harmlos,
 * weniger nicht. */
function basisFinden(wurzel, gegen) {
  if (gegen) return gegen;
  const ref = function (r) { try { return git(wurzel, ['rev-parse', '--verify', '--quiet', r + '^{commit}']).trim(); } catch (e) { return null; } };
  const kopf = ref('HEAD'), main = ref('main'), origin = ref('origin/main');
  if (main && main !== kopf) return 'main';
  if (origin) return 'origin/main';
  if (main) return 'main';
  throw new Error('weder main noch origin/main gefunden - mit --gegen <ref> angeben');
}

function nurGeaendert(gl, wurzel, testDatei, gegen) {
  const basis = basisFinden(wurzel, gegen);
  const mb = git(wurzel, ['merge-base', 'HEAD', basis]).trim();
  const testRel = path.relative(wurzel, testDatei).replace(/\\/g, '/');
  const geaendert = new Set(git(wurzel, ['diff', '--name-only', mb]).split('\n').filter(Boolean));
  git(wurzel, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .forEach(function (d) { geaendert.add(d); });
  const gruende = new Map();   // lfd -> [Datei]
  let alle = false;
  if (geaendert.has(testRel)) {
    const z = einheitenZuZeilen(gl, geaenderteZeilen(git(wurzel, ['diff', '-U0', mb, '--', testRel])));
    alle = z.alle;
    z.lfd.forEach(function (l) { gruende.set(l, [testRel + ' (Zeilen des Abschnitts)']); });
  }
  const dateien = repoDateien(wurzel);
  const je = quelldateien(gl, wurzel, dateien);
  const ohneAbschnitt = [];
  geaendert.forEach(function (d) {
    if (d === testRel) return;
    let getroffen = false;
    je.forEach(function (menge, lfd) {
      if (!menge.has(d)) return;
      getroffen = true;
      if (!gruende.has(lfd)) gruende.set(lfd, []);
      gruende.get(lfd).push(d);
    });
    if (!getroffen) ohneAbschnitt.push(d);
  });
  const lfd = alle ? gl.einheiten.map(function (e) { return e.lfd; })
    : Array.from(gruende.keys()).sort(function (a, b) { return a - b; });
  return { basis: basis, mergeBase: mb, geaendert: Array.from(geaendert).sort(), alle: alle,
    lfd: lfd, gruende: gruende, ohneAbschnitt: ohneAbschnitt.sort() };
}

/* ------------------------------------------------------------------ Ausfuehren */

/* Quelltext fuer den Teil-Lauf: nicht gewaehlte Anweisungen werden durch ihre
 * Zeilenumbrueche ersetzt (Zeilennummern bleiben), vor jede gewaehlte Einheit kommt
 * eine Zeitmarke auf DIESELBE Zeile. */
function teilQuelle(quelle, gl, lfdListe) {
  const body = gl.ast.body;
  const gewaehlt = new Set(lfdListe);
  const einfuegen = new Map();   // Offset -> Text
  const leeren = [];
  let erste = true;
  gl.einheiten.forEach(function (e) {
    if (!gewaehlt.has(e.lfd)) {
      e.anweisungen.forEach(function (i) { leeren.push(body[i].range); });
      return;
    }
    const at = body[e.anweisungen[0]].range[0];
    let t = '__laeufer.beginn(' + e.lfd + '); ';
    if (erste) { t = 'ok = __laeufer.zaehler(ok); probe = __laeufer.huelle(probe); ' + t; erste = false; }
    einfuegen.set(at, t);
  });
  einfuegen.set(body[gl.schluss[0]].range[0], '__laeufer.beginn(0); ');
  const stellen = [];
  leeren.forEach(function (r) { stellen.push({ von: r[0], bis: r[1], text: null }); });
  einfuegen.forEach(function (t, at) { stellen.push({ von: at, bis: at, text: t }); });
  stellen.sort(function (a, b) { return a.von - b.von || (a.text === null ? 1 : -1); });
  let out = '', pos = 0;
  stellen.forEach(function (s) {
    out += quelle.slice(pos, s.von);
    if (s.text !== null) { out += s.text; pos = s.von; }
    else { out += quelle.slice(s.von, s.bis).replace(/[^\n]/g, ''); pos = s.bis; }
  });
  return out + quelle.slice(pos);
}

function ms(x) { return x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function ausfuehren(testDatei, quelle, gl, lfdListe, optionen) {
  const jetzt = function () { return Number(process.hrtime.bigint()) / 1e6; };
  const je = new Map();
  gl.einheiten.forEach(function (e) { je.set(e.lfd, { sync: 0, async: 0, zusagen: 0, gruen: 0, rot: 0 }); });
  je.set(0, { sync: 0, async: 0, zusagen: 0, gruen: 0, rot: 0 });
  let aktuell = 0, seit = jetzt();
  const t0 = seit;
  /* Wem gehoert eine Pruefung, die erst spaeter feuert (nach einem await, in einem
   * Zeitgeber)? Dem Abschnitt, der sie angestossen hat: AsyncLocalStorage traegt die
   * laufende Nummer in jede Zusage und jeden Zeitgeber, die waehrend des Abschnitts
   * entstehen. Ohne das landeten alle asynchronen Pruefungen beim Schluss. */
  const kontext = new AsyncLocalStorage();
  const wem = function () {
    const k = kontext.getStore();
    return je.get(k === undefined ? aktuell : k) || je.get(0);
  };
  const laeufer = {
    beginn: function (lfd) {
      const t = jetzt();
      if (aktuell) je.get(aktuell).sync += t - seit;
      aktuell = lfd; seit = t;
      kontext.enterWith(lfd);
    },
    zaehler: function (okAlt) {
      return function (bedingung) {
        const s = wem();
        if (bedingung) s.gruen++; else s.rot++;
        return okAlt.apply(this, arguments);
      };
    },
    huelle: function (probeAlt) {
      return function (zusage) {
        const s = wem(), t = jetzt();
        s.zusagen++;
        const fertig = function () { s.async = Math.max(s.async, jetzt() - t); };
        Promise.resolve(zusage).then(fertig, fertig);
        return probeAlt.apply(this, arguments);
      };
    }
  };
  process.on('exit', function () {
    let gruen = 0, rot = 0;
    je.forEach(function (s) { gruen += s.gruen; rot += s.rot; });
    const gesamt = jetzt() - t0;
    if (optionen.zeiten) {
      const zeilen = gl.einheiten.filter(function (e) { return lfdListe.indexOf(e.lfd) > -1; })
        .map(function (e) { return { e: e, s: je.get(e.lfd) }; })
        .sort(function (a, b) { return Math.max(b.s.sync, b.s.async) - Math.max(a.s.sync, a.s.async); });
      console.log('\nLaufzeit je Abschnitt (synchron = Rechenzeit am Stueck; asynchron = laengste Zusage, laeuft parallel zu allem danach):');
      console.log('   lfd  Zeile   sync ms  async ms  Pruef.  Kopf');
      zeilen.forEach(function (z) {
        console.log(String(z.e.lfd).padStart(6) + String(z.e.startZeile).padStart(7) + ms(z.s.sync).padStart(10) +
          (z.s.zusagen ? ms(z.s.async) : '-').padStart(10) + String(z.s.gruen + z.s.rot).padStart(8) + '  ' + z.e.kopf.slice(0, 70));
      });
      let summeSync = 0;
      je.forEach(function (s, lfd) { if (lfd) summeSync += s.sync; });
      console.log('   Summe synchron ' + ms(summeSync) + ' ms, Warten am Schluss ' + ms(gesamt - summeSync) +
        ' ms, gesamt ' + ms(gesamt) + ' ms (ohne Start und Gliederung)');
    }
    const voll = lfdListe.length === gl.einheiten.length;
    console.log('\nAbschnitts-Lauf: ' + (gruen + rot) + ' Pruefungen in ' + lfdListe.length + ' von ' +
      gl.einheiten.length + ' Abschnitten, ' + rot + ' fehlgeschlagen, ' + (gesamt / 1000).toFixed(1) + ' s' +
      (voll ? '' : ' - KEIN voller Lauf; vor dem Push: npm test'));
  });
  process.argv = [process.argv[0], testDatei];
  const kopf = '(function (exports, require, module, __filename, __dirname, __laeufer) {';
  const fn = vm.runInThisContext(kopf + teilQuelle(quelle, gl, lfdListe) + '\n})', { filename: testDatei });
  const mod = new Modul(testDatei, null);
  mod.filename = testDatei;
  mod.paths = Modul._nodeModulePaths(path.dirname(testDatei));
  fn.call(mod.exports, mod.exports, Modul.createRequire(testDatei), mod, testDatei, path.dirname(testDatei), laeufer);
}

/* ------------------------------------------------------------------ Kommandozeile */

function argumenteLesen(argv) {
  const o = { datei: null, muster: [], nurGeaendert: false, liste: false, zeiten: false, trocken: false, gegen: null, fremd: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const gleich = /^(--[\w-]+)=(.*)$/.exec(a);
    const name = gleich ? gleich[1] : a;
    const werte = [];
    if (gleich) werte.push(gleich[2]);
    if (name === '--abschnitt' || name === '--datei' || name === '--gegen') {
      while (i + 1 < argv.length && !/^--/.test(argv[i + 1])) {
        werte.push(argv[++i]);
        if (name !== '--abschnitt') break;
      }
    }
    if (name === '--abschnitt') {
      /* cmd.exe trennt an Kommas - "17,72" kann als ein oder als zwei Argumente kommen. */
      werte.forEach(function (w) { String(w).split(',').forEach(function (x) { if (x.trim()) o.muster.push(x.trim()); }); });
      if (!werte.length) o.fremd.push(a + ' (ohne Wert)');
    } else if (name === '--datei') o.datei = werte[0] || null;
    else if (name === '--gegen') o.gegen = werte[0] || null;
    else if (name === '--nur-geaendert') o.nurGeaendert = true;
    else if (name === '--liste') o.liste = true;
    else if (name === '--zeiten') o.zeiten = true;
    else if (name === '--trocken') o.trocken = true;
    else o.fremd.push(a);
  }
  return o;
}

function liste(gl, je) {
  console.log('Gliederung von test-v6.js: Vorspann bis Zeile ' + gl.vorspannEnde + ', ' + gl.einheiten.length +
    ' Abschnitte, Schluss ab Zeile ' + gl.schlussStart);
  console.log('   lfd  Nummer  Zeilen         Kopf');
  gl.einheiten.forEach(function (e) {
    console.log(String(e.lfd).padStart(6) + '  ' + (e.nummer || '-').padEnd(6) + '  ' +
      (e.startZeile + '-' + e.endZeile).padEnd(13) + '  ' + e.kopf.slice(0, 80));
    if (je) {
      const d = Array.from(je.get(e.lfd) || []).sort();
      console.log('                               Dateien: ' + (d.length ? d.join(', ') : '(keine erkannt)'));
    }
  });
}

function haupt(argv) {
  const o = argumenteLesen(argv);
  const testDatei = path.resolve(o.datei || path.join(__dirname, '..', 'test-v6.js'));
  const wurzel = path.dirname(testDatei);
  if (o.fremd.length) {
    console.error('Abschnitts-Laeufer: unbekannte Angabe ' + o.fremd.join(' ') + ' (siehe Kopf von tools/testlaeufer.js)');
    return 2;
  }
  const quelle = fs.readFileSync(testDatei, 'utf8');
  const gl = gliederung(quelle);
  const abd = abdeckungPruefen(gl);
  if (!abd.ok) {
    console.error('Abschnitts-Laeufer: Gliederung deckt die Datei nicht genau einmal ab (Anweisungen ' +
      abd.falsch.slice(0, 5).join(', ') + ') - kein Teil-Lauf');
    return 2;
  }
  if (o.liste) {
    let je = null;
    try { je = quelldateien(gl, wurzel, repoDateien(wurzel)); } catch (e) { console.log('(Quelldateien nicht ermittelbar: ' + e.message + ')'); }
    liste(gl, je);
    return 0;
  }
  let lfd = [];
  const kopfzeilen = [];
  if (o.muster.length) {
    const w = waehle(gl.einheiten, o.muster);
    if (w.ohneTreffer.length) {
      console.error('Abschnitts-Laeufer: kein Abschnitt passt zu ' + w.ohneTreffer.map(function (x) { return '"' + x + '"'; }).join(', ') +
        ' - die Gliederung zeigt: node test-v6.js --liste');
      return 2;
    }
    lfd = w.lfd;
  }
  if (o.nurGeaendert) {
    const g = nurGeaendert(gl, wurzel, testDatei, o.gegen);
    kopfzeilen.push('Geaendert gegenueber ' + g.basis + ' (Abzweig ' + g.mergeBase.slice(0, 7) + '): ' +
      (g.geaendert.length ? g.geaendert.join(', ') : 'nichts'));
    if (g.alle) kopfzeilen.push('  Vorspann oder Schluss von test-v6.js geaendert - alle Abschnitte laufen');
    else g.gruende.forEach(function (d, l) {
      const e = gl.einheiten[l - 1];
      kopfzeilen.push('  ' + e.kopf.slice(0, 60) + '  <- ' + d.join(', '));
    });
    if (g.ohneAbschnitt.length) kopfzeilen.push('  ohne Abschnitt (kein Test nennt sie): ' + g.ohneAbschnitt.join(', '));
    g.lfd.forEach(function (l) { if (lfd.indexOf(l) < 0) lfd.push(l); });
    lfd.sort(function (a, b) { return a - b; });
    if (!lfd.length) {
      kopfzeilen.forEach(function (z) { console.log(z); });
      console.log('Abschnitts-Lauf: kein Abschnitt betroffen - nichts zu tun.');
      return 0;
    }
  }
  if (!o.muster.length && !o.nurGeaendert) lfd = gl.einheiten.map(function (e) { return e.lfd; });   // --zeiten allein
  const mit = mitAbhaengigkeiten(lfd, abhaengigkeiten(gl));
  console.log('Abschnitts-Lauf (tools/testlaeufer.js): ' + lfd.length + ' von ' + gl.einheiten.length + ' Abschnitten' +
    (mit.mitgenommen.size ? ', dazu ' + mit.mitgenommen.size + ' mitgenommen' : ''));
  kopfzeilen.forEach(function (z) { console.log(z); });
  if (lfd.length < gl.einheiten.length) {
    lfd.forEach(function (l) {
      const e = gl.einheiten[l - 1];
      console.log('  ' + e.kopf.slice(0, 80) + '  [Zeilen ' + e.startZeile + '-' + e.endZeile + ']');
    });
  }
  mit.mitgenommen.forEach(function (gruende, l) {
    console.log('  + mitgenommen: ' + gl.einheiten[l - 1].kopf.slice(0, 60) + '  (' + gruende.join('; ') + ')');
  });
  if (o.trocken) return 0;
  console.log('');
  /* Ausgefuehrt wird AUSSERHALB des try in der Hauptroutine: ein Absturz in einem
   * Abschnitt soll mit vollem Stapel und Rueckgabewert 1 enden wie im vollen Lauf,
   * nicht als "Abschnitts-Laeufer: <Meldung>". */
  return function () { ausfuehren(testDatei, quelle, gl, mit.lfd, { zeiten: o.zeiten }); };
}

module.exports = {
  SCHALTER: SCHALTER, gewuenscht: gewuenscht, uebernehmen: uebernehmen,
  gliederung: gliederung, abdeckungPruefen: abdeckungPruefen, waehle: waehle,
  globaleBezuege: globaleBezuege, abhaengigkeiten: abhaengigkeiten, mitAbhaengigkeiten: mitAbhaengigkeiten,
  genannteDateien: genannteDateien, zeichenketten: zeichenketten, quelldateien: quelldateien,
  requireGraph: requireGraph, huelle: huelle,
  geaenderteZeilen: geaenderteZeilen, einheitenZuZeilen: einheitenZuZeilen,
  teilQuelle: teilQuelle, argumenteLesen: argumenteLesen, haupt: haupt
};

if (require.main === module) {
  let rc;
  try { rc = haupt(process.argv.slice(2)); } catch (e) {
    console.error('Abschnitts-Laeufer: ' + (e && e.message || e));
    rc = 2;
  }
  if (typeof rc === 'function') rc();   // der Schluss von test-v6.js beendet den Prozess
  else process.exit(rc);
}
