'use strict';
/* Baustein 3 (Auftrag Nr. 44): Auswertung der Tageszaehler -> ABDECKUNG.md + auswertung.json.
 * (a) Abdeckung je Klasse und Monat (Anteil Symbole mit >= 1 / >= 5 / >= 20 Artikeln), je Stufe
 * (b) Artikel je Symbol-Monat: Median, P10, P90 je Klasse (mit und ohne Null-Monate)
 * (c) Fehlerquote der Zuordnung aus den von Hand gepruefen Stichproben (pruefung-*.json, Urteile von mir, nicht von einem Modell)
 * (d) Ton je Klasse: Mittel, sd, Anteil negativ   (e) 2018 gegen 2025   (f) Urteil je Klasse (>= 80 % mit >= 5/Monat, Fehler <= 10 %)
 * Dazu: systematische Luecken (fehlende Uhrzeiten ueber alle Tage), Datenmenge, Laufzeit.
 *
 * Aufruf:  node auswerten.js [--aus voll]                       -> ABDECKUNG.md, auswertung.json
 *          node auswerten.js --stichprobe <name> [--je 34] [--klasse] [--tag T] [--aus voll]
 *              -> pruefung-<name>.json: je Monat (oder je Tag/Klasse) die `je` Treffer mit kleinstem u je Stufe (gleichverteilt),
 *                 Urteil-Feld leer; danach von Hand fuellen: "urteil": "richtig" | "falsch" [, "grund": "..."]
 * Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var HIER = __dirname;
var STUFEN = ['voll', 'kurz'], KLASSEN = [1, 2, 3], SCHWELLEN = [1, 5, 20];

function argumente(a) { var o = {}; for (var i = 0; i < a.length; i++) if (a[i].slice(0, 2) === '--') { var k = a[i].slice(2); if (i + 1 < a.length && a[i + 1].slice(0, 2) !== '--') o[k] = a[++i]; else o[k] = true; } return o; }
function quantil(sortiert, q) { if (!sortiert.length) return null; var p = (sortiert.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return +(sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (p - lo)).toFixed(1); }
function pz(x, n) { return n ? (100 * x / n).toFixed(1) + ' %' : '-'; }

function ladeTage(aus, von, bis, tag) {
  var d = path.join(aus, 'tage');
  return fs.readdirSync(d).filter(function (f) { return /^\d{4}-\d{2}-\d{2}\.json$/.test(f); }).map(function (f) { return f.slice(0, 10); })
    .filter(function (t) { return (!von || t >= von) && (!bis || t <= bis) && (!tag || t === tag); }).sort()
    .map(function (t) { return JSON.parse(fs.readFileSync(path.join(d, t + '.json'), 'utf8')); });
}
function klasseVon(karte, sym, monat) { var k = karte.karte[sym]; if (!k) return null; return monat < '2020' ? k.klasse2018 : k.klasse2025; }

/* ---------- Stichprobe zum Pruefen anlegen ---------- */
function stichprobeAnlegen(a, aus, karte) {
  var tage = ladeTage(aus, a.von, a.bis, a.tag), je = parseInt(a.je, 10) || 34, gruppen = {};
  tage.forEach(function (T) {
    STUFEN.forEach(function (st) {
      var r = T.stichprobe[st]; if (!r) return;
      var listen = Array.isArray(r) ? { 0: r } : r;
      Object.keys(listen).forEach(function (kl) {
        listen[kl].forEach(function (x) {
          var g = (a.klasse ? 'k' + (x.klasse || kl) : T.tag.slice(0, 7)) + '|' + st;
          (gruppen[g] = gruppen[g] || []).push(x);
        });
      });
    });
  });
  var aus2 = [];
  Object.keys(gruppen).sort().forEach(function (g) {
    gruppen[g].sort(function (x, y) { return x.u - y.u; }).slice(0, je).forEach(function (x) {
      var k = karte.karte[x.sym] || {};
      aus2.push({ gruppe: g, sym: x.sym, klasse: x.klasse || null, name: k.voll, kurz: k.kurz, stufe: x.stufe, tag: x.tag, org: x.org, quelle: x.quelle, dok: x.dok, ton: x.ton, uebersetzt: x.uebersetzt, urteil: null });
    });
  });
  var p = path.join(HIER, 'pruefung-' + a.stichprobe + '.json');
  fs.writeFileSync(p, JSON.stringify({ kennung: 'gdelt-abdeckung-2026-09-19/pruefung/v1', stand: new Date().toISOString(), tage: tage.length, je: je, regel: 'urteil richtig = der Organisationstext meint die Firma des Symbols; falsch = andere Firma, Produkt, Ort, Person, Boerse/Index als Handelsplatz', eintraege: aus2 }, null, 1));
  process.stdout.write(p + ': ' + aus2.length + ' Eintraege in ' + Object.keys(gruppen).length + ' Gruppen\n');
}

/* ---------- Hauptauswertung ---------- */
function auswerten(a, aus, karte) {
  var tage = ladeTage(aus, a.von, a.bis, null);
  if (!tage.length) throw new Error('keine Tagesdateien unter ' + aus);
  var M = {};                                           // monat -> sym -> stufe -> [n, ts, tq, neg, uebersetzt]
  var luecken = {}, gesamt = { tage: 0, dateien: 0, fehlend: 0, fehler: 0, zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, bytesZip: 0, bytesCsv: 0, dauerS: 0, treffer: { voll: 0, kurz: 0 } };
  var tageJeMonat = {};
  tage.forEach(function (T) {
    var z = T.zaehler, m = T.tag.slice(0, 7);
    tageJeMonat[m] = (tageJeMonat[m] || 0) + 1;
    gesamt.tage++; gesamt.dateien += z.gefunden; gesamt.fehlend += z.fehlend; gesamt.fehler += z.fehler.length; gesamt.zeilen += z.zeilen; gesamt.falscheFeldzahl += z.falscheFeldzahl;
    gesamt.mitOrganisation += z.mitOrganisation; gesamt.bytesZip += z.bytesZip; gesamt.bytesCsv += z.bytesCsv; gesamt.dauerS += T.dauerS; gesamt.treffer.voll += z.treffer.voll; gesamt.treffer.kurz += z.treffer.kurz;
    z.fehlendUhrzeiten.forEach(function (u) { luecken[u] = (luecken[u] || 0) + 1; });
    var mm = M[m] || (M[m] = {});
    Object.keys(T.symbole).forEach(function (s) {
      var q = mm[s] || (mm[s] = { voll: [0, 0, 0, 0, 0], kurz: [0, 0, 0, 0, 0] });
      STUFEN.forEach(function (st) { for (var i = 0; i < 5; i++) q[st][i] += T.symbole[s][st][i]; });
    });
  });
  var monate = Object.keys(M).sort();

  /* (a)+(b)+(d) je Monat, Klasse, Stufe */
  var abdeckung = {}, verteilung = {}, ton = {};
  monate.forEach(function (m) {
    var jahr = m.slice(0, 4), feld = jahr < '2020' ? 'klasse2018' : 'klasse2025';
    KLASSEN.forEach(function (kl) {
      var syms = Object.keys(karte.karte).filter(function (s) { return karte.karte[s][feld] === kl; });
      var mitName = syms.filter(function (s) { return karte.karte[s].voll; });
      STUFEN.forEach(function (st) {
        var key = m + '|' + kl + '|' + st, n = { symbole: syms.length, mitName: mitName.length, mitKurz: syms.filter(function (s) { return karte.karte[s].kurz; }).length };
        var werte = syms.map(function (s) { return M[m][s] ? M[m][s][st][0] : 0; });
        SCHWELLEN.forEach(function (sw) { n['ab' + sw] = werte.filter(function (x) { return x >= sw; }).length; });
        abdeckung[key] = n;
        var sortiert = werte.slice().sort(function (x, y) { return x - y; }), positiv = sortiert.filter(function (x) { return x > 0; });
        verteilung[key] = { median: quantil(sortiert, 0.5), p10: quantil(sortiert, 0.1), p90: quantil(sortiert, 0.9), medianPositiv: quantil(positiv, 0.5), p10Positiv: quantil(positiv, 0.1), p90Positiv: quantil(positiv, 0.9), summe: werte.reduce(function (x, y) { return x + y; }, 0) };
        var tn = 0, ts = 0, tq = 0, neg = 0, ue = 0;
        syms.forEach(function (s) { var q = M[m][s] && M[m][s][st]; if (q) { tn += q[0]; ts += q[1]; tq += q[2]; neg += q[3]; ue += q[4]; } });
        var mittel = tn ? ts / tn : null;
        ton[key] = { n: tn, mittel: mittel === null ? null : +mittel.toFixed(3), sd: tn > 1 ? +Math.sqrt(Math.max(0, tq / tn - mittel * mittel)).toFixed(3) : null, anteilNegativ: tn ? +(neg / tn).toFixed(3) : null, anteilUebersetzt: tn ? +(ue / tn).toFixed(3) : null };
      });
    });
  });

  /* (c) Fehlerquote aus pruefung-*.json (Urteile von Hand) */
  var fehler = {};
  fs.readdirSync(HIER).filter(function (f) { return /^pruefung-.*\.json$/.test(f); }).forEach(function (f) {
    var P = JSON.parse(fs.readFileSync(path.join(HIER, f), 'utf8')), name = f.replace(/^pruefung-|\.json$/g, '');
    var je = {};
    P.eintraege.forEach(function (e) {
      if (!e.urteil) return;
      var kl = e.klasse || (karte.karte[e.sym] ? (karte.karte[e.sym].klasse2025 || karte.karte[e.sym].klasse2018) : 0);
      [e.stufe + '|' + kl, e.stufe + '|alle'].forEach(function (k) {
        var q = je[k] || (je[k] = { n: 0, falsch: 0, verdacht: 0, beispiele: [], verdachtBeispiele: [] });
        q.n++;
        if (e.urteil === 'falsch') { q.falsch++; if (q.beispiele.length < 6) q.beispiele.push(e.sym + ' <- "' + e.org.replace(/,\d+$/, '') + '"' + (e.grund ? ' (' + e.grund + ')' : '')); }
        /* "verdacht": Name stimmt, aber die Firma ist Medium/Handelsplatz/Plattform statt Gegenstand (Nasdaq-Listing, zitierte
         * New York Times, "posted on Twitter") - aus dem Organisationstext nicht entscheidbar, darum getrennt gezaehlt. */
        if (e.urteil === 'verdacht') { q.verdacht++; if (q.verdachtBeispiele.length < 3) q.verdachtBeispiele.push(e.sym + ' <- "' + e.org.replace(/,\d+$/, '') + '"'); }
      });
    });
    var offen = P.eintraege.filter(function (e) { return !e.urteil; }).length;
    fehler[name] = { eintraege: P.eintraege.length, offen: offen, je: je };
  });

  /* (f) Urteil je Klasse: Median ueber die Monate (Anteil >= 5 Artikel), getrennt 2025 / 2018; Fehlerquote aus dem Vollauf-Pruefsatz, sonst Vorlauf */
  function median(l) { var s = l.slice().sort(function (x, y) { return x - y; }); return s.length ? quantil(s, 0.5) : null; }
  var urteil = {};
  ['2025', '2018'].forEach(function (jahr) {
    var ms = monate.filter(function (m) { return m.slice(0, 4) === jahr; }); if (!ms.length) return;
    KLASSEN.forEach(function (kl) {
      STUFEN.forEach(function (st) {
        var anteile = ms.map(function (m) { var n = abdeckung[m + '|' + kl + '|' + st]; return n.symbole ? 100 * n.ab5 / n.symbole : 0; });
        var pr = fehler['vollauf-' + jahr] || fehler['vollauf-2025'] || fehler['vorlauf'];
        var fq = pr && pr.je[st + '|' + kl] ? pr.je[st + '|' + kl] : null;
        var fqP = fq && fq.n ? 100 * fq.falsch / fq.n : null;
        var med = median(anteile);
        urteil[jahr + '|' + kl + '|' + st] = { monate: ms.length, anteilAb5Median: med, anteilAb5Min: Math.min.apply(null, anteile).toFixed(1), fehlerquote: fqP === null ? null : +fqP.toFixed(1), fehlerN: fq ? fq.n : 0,
          traegt: med !== null && med >= 80 && fqP !== null && fqP <= 10, grund: med === null ? 'keine Daten' : (med < 80 ? 'Abdeckung ' + med + ' % < 80 %' : (fqP === null ? 'Fehlerquote nicht gemessen' : (fqP > 10 ? 'Fehlerquote ' + fqP.toFixed(1) + ' % > 10 %' : 'ok'))) };
      });
    });
  });

  var J = { kennung: 'gdelt-abdeckung-2026-09-19/auswertung/v1', stand: new Date().toISOString(), karte: karte.kennung, zaehlKennung: tage[0].kennung, gesamt: gesamt, monate: monate, tageJeMonat: tageJeMonat, luecken: luecken, abdeckung: abdeckung, verteilung: verteilung, ton: ton, fehler: fehler, urteil: urteil };
  fs.writeFileSync(path.join(HIER, 'auswertung.json'), JSON.stringify(J, null, 1));

  /* ---------- ABDECKUNG.md ---------- */
  var L = [];
  L.push('# GDELT-Abdeckungsprobe — Ergebnis (Auftrag Nr. 44)', '', 'Stand ' + J.stand.slice(0, 16).replace('T', ' ') + ' UTC · Karte `' + karte.kennung + '` (' + Object.keys(karte.karte).length + ' Symbole, ' + karte.zaehler.ohneNamen + ' ohne Namen) · Zaehler `' + J.zaehlKennung + '`', '',
    '**Datenmenge:** ' + gesamt.tage + ' Tage, ' + gesamt.dateien + ' Dateien gefunden, ' + gesamt.fehlend + ' fehlend (404), ' + gesamt.fehler + ' Fehler; ' + (gesamt.bytesZip / 1073741824).toFixed(1) + ' GB gezippt / ' + (gesamt.bytesCsv / 1073741824).toFixed(1) + ' GB entpackt im Fluss; ' + gesamt.zeilen.toLocaleString('de-DE') + ' Artikelzeilen (' + gesamt.falscheFeldzahl + ' mit falscher Feldzahl, ' + pz(gesamt.mitOrganisation, gesamt.zeilen) + ' mit Organisation); Treffer voll ' + gesamt.treffer.voll.toLocaleString('de-DE') + ', kurz ' + gesamt.treffer.kurz.toLocaleString('de-DE') + '; Rechenzeit ' + (gesamt.dauerS / 3600).toFixed(1) + ' Prozess-Stunden.', '');
  var lk = Object.keys(luecken).sort(function (x, y) { return luecken[y] - luecken[x]; });
  L.push('**Systematische Luecken (fehlende 15-min-Dateien nach Uhrzeit UTC, Tage):** ' + (lk.length ? lk.slice(0, 12).map(function (u) { return u + ':' + luecken[u]; }).join(', ') + (lk.length > 12 ? ' …' : '') : 'keine') + '.', '');
  L.push('## (a) Abdeckung je Klasse und Monat — Anteil der Symbole mit >= 1 / >= 5 / >= 20 Artikeln', '');
  STUFEN.forEach(function (st) {
    L.push('### Stufe „' + st + '"', '', '| Monat | Tage | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl + ' (n) | >=1 | >=5 | >=20'; }).join(' | ') + ' |', '|---|---|' + KLASSEN.map(function () { return '---|---|---|---'; }).join('|') + '|');
    monate.forEach(function (m) {
      L.push('| ' + m + ' | ' + tageJeMonat[m] + ' | ' + KLASSEN.map(function (kl) { var n = abdeckung[m + '|' + kl + '|' + st]; return n.symbole + ' | ' + pz(n.ab1, n.symbole) + ' | ' + pz(n.ab5, n.symbole) + ' | ' + pz(n.ab20, n.symbole); }).join(' | ') + ' |');
    });
    L.push('');
  });
  L.push('## (b) Artikel je Symbol-Monat — Median / P10 / P90 (alle Symbol-Monate; in Klammern nur Monate mit >= 1 Artikel)', '');
  STUFEN.forEach(function (st) {
    L.push('### Stufe „' + st + '"', '', '| Monat | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
    monate.forEach(function (m) {
      L.push('| ' + m + ' | ' + KLASSEN.map(function (kl) { var v = verteilung[m + '|' + kl + '|' + st]; return v.median + ' / ' + v.p10 + ' / ' + v.p90 + ' (' + v.medianPositiv + ' / ' + v.p10Positiv + ' / ' + v.p90Positiv + ')'; }).join(' | ') + ' |');
    });
    L.push('');
  });
  L.push('## (c) Fehlerquote der Zuordnung — von Hand geprueft (Organisationstext gegen Firma), kein Modell', '');
  Object.keys(fehler).forEach(function (name) {
    var F = fehler[name];
    L.push('### Pruefsatz `pruefung-' + name + '.json` — ' + F.eintraege + ' Eintraege, ' + F.offen + ' ungeprueft', '', '| Stufe | Klasse | n | falsch (Name) | Quote | Beispiele falscher Treffer | Verdacht Medium/Handelsplatz/Plattform |', '|---|---|---|---|---|---|---|');
    Object.keys(F.je).sort().forEach(function (k) { var q = F.je[k], t = k.split('|'); L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + q.n + ' | ' + q.falsch + ' | ' + pz(q.falsch, q.n) + ' | ' + q.beispiele.join('; ') + ' | ' + q.verdacht + ' (' + pz(q.verdacht, q.n) + ') ' + q.verdachtBeispiele.join('; ') + ' |'); });
    L.push('');
  });
  L.push('## (d) Ton je Klasse (Mittel / sd / Anteil negativ / Anteil uebersetzt), ueber alle Monate', '');
  L.push('| Jahr | Stufe | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
  ['2025', '2018'].forEach(function (jahr) {
    STUFEN.forEach(function (st) {
      var zeile = KLASSEN.map(function (kl) {
        var n = 0, s = 0, q = 0, neg = 0, ue = 0;
        monate.filter(function (m) { return m.slice(0, 4) === jahr; }).forEach(function (m) { var t = ton[m + '|' + kl + '|' + st]; if (t.n) { n += t.n; s += t.mittel * t.n; q += (t.sd * t.sd + t.mittel * t.mittel) * t.n; neg += t.anteilNegativ * t.n; ue += t.anteilUebersetzt * t.n; } });
        if (!n) return '-';
        var mi = s / n; return mi.toFixed(2) + ' / ' + Math.sqrt(Math.max(0, q / n - mi * mi)).toFixed(2) + ' / ' + pz(neg, n) + ' / ' + pz(ue, n) + ' (n ' + n.toLocaleString('de-DE') + ')';
      });
      if (zeile.some(function (x) { return x !== '-'; })) L.push('| ' + jahr + ' | ' + st + ' | ' + zeile.join(' | ') + ' |');
    });
  });
  L.push('', '## (e) 2018 gegen 2025 — Median ueber die Monate: Anteil Symbole mit >= 5 Artikeln', '');
  L.push('| Jahr | Stufe | ' + KLASSEN.map(function (kl) { return 'Kl. ' + kl; }).join(' | ') + ' |', '|---|---|' + KLASSEN.map(function () { return '---'; }).join('|') + '|');
  ['2025', '2018'].forEach(function (jahr) { STUFEN.forEach(function (st) { var z = KLASSEN.map(function (kl) { var u = urteil[jahr + '|' + kl + '|' + st]; return u ? u.anteilAb5Median + ' % (min ' + u.anteilAb5Min + ' %, ' + u.monate + ' Mon.)' : '-'; }); if (z.some(function (x) { return x !== '-'; })) L.push('| ' + jahr + ' | ' + st + ' | ' + z.join(' | ') + ' |'); }); });
  L.push('', '## (f) Urteil je Klasse — traegt GDELT ein Tagesdesign? (>= 80 % der Symbole mit >= 5 Artikeln je Monat UND Fehlerquote <= 10 %)', '');
  L.push('| Jahr | Klasse | Stufe | Abdeckung >=5 (Median) | Fehlerquote (n) | Urteil | Grund |', '|---|---|---|---|---|---|---|');
  Object.keys(urteil).forEach(function (k) { var u = urteil[k], t = k.split('|'); L.push('| ' + t[0] + ' | ' + t[1] + ' | ' + t[2] + ' | ' + u.anteilAb5Median + ' % | ' + (u.fehlerquote === null ? '-' : u.fehlerquote + ' % (' + u.fehlerN + ')') + ' | ' + (u.traegt ? '**JA**' : 'NEIN') + ' | ' + u.grund + ' |'); });
  L.push('', '_Zaehlung: `gkg-zaehlen.js` (Spalte 15 V2EnhancedOrganizations, Spalte 16 V1.5Tone; ein Artikel je Symbol und Stufe einmal). Klassen: 1 = 50–250, 2 = 250–1.000, 3 = ab 1.000 Mio $ Tagesumsatz (Panel v2.1, Stichtag 2025-01-02 bzw. 2018-01-02). Quelle: GDELT Project, https://www.gdeltproject.org/ — Simulation, keine Anlageberatung._', '');
  fs.writeFileSync(path.join(HIER, 'ABDECKUNG.md'), L.join('\n'));
  process.stdout.write('ABDECKUNG.md: ' + monate.length + ' Monate, ' + gesamt.tage + ' Tage, Urteile: ' + Object.keys(urteil).map(function (k) { return k + '=' + (urteil[k].traegt ? 'JA' : 'nein'); }).join(' ') + '\n');
}

if (require.main === module) {
  var a = argumente(process.argv.slice(2)), aus = path.resolve(HIER, a.aus || 'voll');
  var karte = JSON.parse(fs.readFileSync(path.join(HIER, 'namenskarte.json'), 'utf8'));
  if (a.stichprobe) stichprobeAnlegen(a, aus, karte); else auswerten(a, aus, karte);
}
module.exports = { quantil: quantil, ladeTage: ladeTage };
