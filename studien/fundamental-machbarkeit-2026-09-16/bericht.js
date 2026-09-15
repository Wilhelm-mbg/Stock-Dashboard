'use strict';
/* Schritt 5: Tafeln fuer MACHBARKEIT.md aus den Messdateien rendern (keine Zahl von Hand abgetippt).
 * Liest panel.json, deckung.json, deckung-reihen.json, tags.json, pruefung.json. Schreibt tafeln.md. */
var fs = require('fs');
var path = require('path');
var H = __dirname;
var panel = JSON.parse(fs.readFileSync(path.join(H, 'panel.json'), 'utf8'));
var deck = JSON.parse(fs.readFileSync(path.join(H, 'deckung.json'), 'utf8'));
var deckR = JSON.parse(fs.readFileSync(path.join(H, 'deckung-reihen.json'), 'utf8'));
var tags = JSON.parse(fs.readFileSync(path.join(H, 'tags.json'), 'utf8'));
var pr = JSON.parse(fs.readFileSync(path.join(H, 'pruefung.json'), 'utf8'));
var KL = ['ab1000', '250-1000', '50-250', '5-50', 'unter5', 'jung', 'gesamt'];
var NAME = { jung: 'duenn (<40 von 60 Umsatztagen)', gesamt: 'GESAMT' };
function pz(a, b) { return b ? (Math.round(1000 * a / b) / 10).toFixed(1) + ' %' : '–'; }
function zeile(a) { return '| ' + a.join(' | ') + ' |'; }
var out = [];

Object.keys(deck.quartale).forEach(function (qn) {
  var Q = deck.quartale[qn], T = Q.tafel;
  out.push('### Deckung ' + qn + ' (Einreichungen 10-K/10-Q/20-F/40-F im Quartal: ' + Q.einreichungen + ', Registranten ' + Q.registranten + ', davon im Panel ' + Q.registrantenImPanel + ')');
  out.push('');
  out.push(zeile(['Klasse', 'aktiv', 'mit CIK', 'auf EDGAR¹', 'period. Bericht', 'Umsatz', 'Vermögen', 'Aktienzahl', 'KERN²', 'Nicht-Finanz³', 'Brutto (U+UK)', 'F&E gemeldet']));
  out.push(zeile(['---', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:']));
  KL.forEach(function (k) {
    var c = T[k]; if (!c) return;
    out.push(zeile([NAME[k] || k, c.aktiv, c.mitCik, c.aufEdgar + ' (' + pz(c.aufEdgar, c.aktiv) + ')', c.mitFiling + ' (' + pz(c.mitFiling, c.aktiv) + ')',
      pz(c.umsatz, c.mitFiling), pz(c.vermoegen, c.mitFiling), pz(c.aktien, c.mitFiling), c.kern + ' (' + pz(c.kern, c.aktiv) + ' / ' + pz(c.kern, c.mitFiling) + ')',
      c.nichtFinanz, pz(c.nfBrutto, c.nichtFinanz), pz(c.nfFue, c.nichtFinanz)]));
  });
  out.push('');
  out.push('¹ CIK hat im Quartal irgendeine Einreichung (auch 8-K, S-1). ² Umsatz + Gesamtvermögen + Aktienzahl im selben Quartal (Anteil an aktiv / an Reihen mit Bericht). ³ Reihen mit Bericht und SIC außerhalb 6000–6799; Brutto = Umsatz und Umsatzkosten beide vorhanden; F&E fehlt meist wirklich (kein F&E), nicht als Datenlücke.');
  out.push('');
  var A = Q.abstand;
  out.push('### Abstand filed − period ' + qn + ' (Tage)');
  out.push('');
  out.push(zeile(['Menge', 'n', 'p10', 'Median', 'p90', 'p95', 'p99', 'max', 'Mittel', '> 45 T', '> 90 T', '> 180 T', 'negativ']));
  out.push(zeile(['---', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:', '---:']));
  out.push(zeile(['alle periodischen', A.alle.n, A.alle.p10, A.alle.p50, A.alle.p90, A.p95, A.p99, A.alle.max, A.alle.mittel, A.ueber45, A.ueber90, A.ueber180, A.negativ]));
  ['quartal', 'jahr', 'auslaend'].forEach(function (f) { var s = A.jeForm[f]; if (s) out.push(zeile([{ quartal: '10-Q', jahr: '10-K', auslaend: '20-F/40-F' }[f], s.n, s.p10, s.p50, s.p90, '', '', s.max, s.mittel, '', '', '', ''])); });
  KL.forEach(function (k) { var s = A.jeKlasse[k]; if (s && k !== 'gesamt') out.push(zeile(['Panel ' + (NAME[k] || k), s.n, s.p10, s.p50, s.p90, '', '', s.max, s.mittel, '', '', '', ''])); });
  out.push('');
  var N = Q.neudarstellungen;
  out.push('### Neudarstellungen innerhalb ' + qn + ' (Zieltags, Konzernwert, alle Registranten)');
  out.push('');
  out.push('Schlüssel (cik, tag, version, ddate, qtrs, uom): ' + N.schluessel + ' · in ≥ 2 Einreichungen: ' + N.mehrfach + ' · davon gleich: ' + N.gleich + ' · **verschieden: ' + N.verschieden + '** (' + pz(N.verschieden, N.mehrfach) + ' der mehrfach berichteten; je Gruppe ' + JSON.stringify(N.jeGruppe) + '), davon Panelreihen: ' + N.verschiedenImPanel + '.');
  out.push('');
  N.beispiele.slice(0, 4).forEach(function (b) { out.push('- ' + b.reihe + ' `' + b.key.split('|').slice(1, 5).join(' ') + '`: ' + b.werte.map(function (w) { return w.form + ' ' + w.filed + ' → ' + w.wert; }).join(' ; ')); });
  out.push('');
  /* 10 Stichproben je Quartal: je Klasse die ersten zwei Reihen mit Bericht */
  out.push('### Stichproben filed − period ' + qn + ' (je Klasse zwei Reihen, alphabetisch erste mit Bericht)');
  out.push('');
  out.push(zeile(['Reihe', 'Klasse', 'CIK', 'Form', 'period', 'filed', 'Tage']));
  out.push(zeile(['---', '---', '---', '---', '---', '---', '---:']));
  ['ab1000', '250-1000', '50-250', '5-50', 'unter5'].forEach(function (k) {
    deckR.reihen[qn].filter(function (r) { return r.klasse === k && r.filings.length; }).slice(0, 2).forEach(function (r) {
      var f = r.filings[0];
      out.push(zeile([r.reihe, k, r.cik, f.form, f.period, f.filed, f.abstand]));
    });
  });
  out.push('');
  var TG = tags.quartale[qn];
  out.push('### Umsatz-Tags ' + qn + ' (Panel-Einreichungen)');
  out.push('');
  out.push('Werte-Sicht (Tag, der die Umsatzzahl zum Stichtag trägt; ' + TG.werteSicht.filings + ' Einreichungen mit Umsatz): ' + TG.werteSicht.top.slice(0, 6).map(function (t) { return '`' + t.tag + '` ' + t.anteil + ' %'; }).join(', ') + '.');
  out.push('');
  out.push('Darstellungs-Sicht (erste Umsatzzeile der GuV, ' + TG.panel.filings + ' Einreichungen, ' + TG.panel.ohneUmsatzzeile + ' ohne Umsatzzeile, ' + TG.panel.verschiedeneTags + ' verschiedene Tags, firmeneigen ' + TG.panel.firmeneigen + '): ' + TG.panel.top.slice(0, 6).map(function (t) { return '`' + t.tag + '` ' + t.anteil + ' %'; }).join(', ') + '; Rest ' + TG.panel.rest + '. Alle Registranten: ' + TG.alle.verschiedeneTags + ' verschiedene Tags, firmeneigen ' + TG.alle.firmeneigen + ' von ' + TG.alle.mitZeile + '.');
  out.push('');
  out.push('### Gegenprobe ' + qn);
  out.push('');
  out.push('A) FSDS gegen SEC-XBRL-API (companyconcept), gleiche Akzession:');
  out.push('');
  out.push(zeile(['Reihe', 'Klasse', 'Form', 'period (FSDS)', 'filed', 'Größe', 'Tag', 'FSDS', 'API', 'API end', 'API filed', 'Urteil']));
  out.push(zeile(['---', '---', '---', '---', '---', '---', '---', '---:', '---:', '---', '---', '---']));
  pr.A[qn].forEach(function (p) { p.felder.forEach(function (f) { out.push(zeile([p.reihe, p.klasse, p.form, p.period, p.filed, f.gruppe, f.tag, f.fsds, f.api, f.apiEnd, f.apiFiled, f.stimmt ? 'stimmt' : 'ABWEICHUNG'])); }); });
  out.push('');
  out.push('B) Neudarstellungen über die Zeit (API, alle je berichteten Zeiträume derselben Firmen): ' + pr.B[qn].map(function (b) { return b.reihe + ' ' + b.tag.replace('RevenueFromContractWithCustomerExcludingAssessedTax', 'RevFromContract') + ' ' + b.verschieden + ' von ' + b.mehrfachBerichtet + ' mehrfach berichteten Zeiträumen' + (b.beispiel ? ' (z. B. ' + b.beispiel.zeitraum + ': ' + b.beispiel.filings.slice(0, 3).join(' / ') + ')' : ''); }).join('; ') + '.');
  out.push('');
  var C = pr.C[qn];
  out.push('C) Unabhängige Zählung frames-API `' + C.frame + '` (Assets, USD, Stichtag ' + C.stichtag + '): Registranten im Frame ' + C.frameRegistranten + '; Panel-CIKs aktiv ' + C.panelCiksAktiv + ', davon im Frame ' + C.panelCiksImFrame + '; FSDS-Panel-CIKs mit Assets zu diesem Stichtag ' + C.fsdsCiksMitAssetsAmStichtag + '; beide ' + C.beide + ' (' + pz(C.beide, C.fsdsCiksMitAssetsAmStichtag) + ' der FSDS-Treffer bestätigt); nur Frame ' + C.nurFrame + ' = später eingereicht ' + C.nurFrameSpaeterEingereicht + ' + anderer Stichtag im Quartal ' + C.nurFrameAndererStichtag + ' + kein Filing im Quartal ' + C.nurFrameKeinFiling + '; nur FSDS ' + C.nurFsds + ' (' + C.nurFsdsBeispiele.join(', ') + ' – Fremdwährung, nicht im USD-Frame).');
  out.push('');
});
out.push('Panel: ' + panel.zaehler.aktien + ' Aktienreihen, CIK-Quelle ' + JSON.stringify(panel.cikQuelle) + ', Sicherheit ' + JSON.stringify(panel.sicherheit) + '. EDGAR-Anfragen der Gegenprobe: ' + pr.anfragen + '.');
fs.writeFileSync(path.join(H, 'tafeln.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
