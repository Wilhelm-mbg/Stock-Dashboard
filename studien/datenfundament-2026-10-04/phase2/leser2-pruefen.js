'use strict';
/* TEIL 3 - Pruefung des Lesers v2 am echten Archiv (nur lesen). Schreibt teil3-pruefung.json in diesen Ordner.
 *
 *  P1  reihen(): 7.299 Eintraege, 2.249 lebende; `jahre` = Jahre mit Datei (keine "erwarteten" Jahre ohne Datei).
 *  P2  die 33 Aktienreihen mit veralteter alter Kopie (../t1-leser-veraltet.json): leser2 liefert 2026 Kerzen bis zum Ende
 *      der Rohdatei - oder bricht fuer die in Teil 2 ausgenommenen Reihen mit der klaren Meldung ab.
 *  P3  20 zufaellig gezogene ANDERE Reihen (Saat `leser2-andere`; weder die 33 noch die 44 Reihen mit neuer Kopie):
 *      Kerze fuer Kerze dasselbe wie lesen.js, in jedem Jahr - im Fenster von lesen.js; dazu gezaehlt, was leser2 in der
 *      Vorgabe (bis zum Ende des Archivs) mehr liefert.
 *  P4  10 gezogene Reihen MIT alter, nicht veralteter Kopie (Saat `leser2-altkopie`): derselbe Vergleich - der Weg
 *      "alte Kopie, weil sie so weit reicht wie die Rohdatei".
 *  P5  die 44 Reihen der Gruppe (a): das Ex-Jahr kommt aus v2, der Kopf nennt den verworfenen oder verschobenen Satz.
 *
 * Aufruf:  node --max-old-space-size=4096 leser2-pruefen.js
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');
var L2 = require('./leser2.js');
var LP = L2.alt;

function gleicheKerzen(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) { var x = a[i], y = b[i]; if (x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2] || x[3] !== y[3] || x[4] !== y[4] || x[5] !== y[5]) return false; }
  return true;
}
/** Vergleich leser2 gegen lesen.js ueber alle Jahre einer Reihe. */
function vergleicheReihe(R2, Ralt) {
  var z = { reihe: R2.reihe, jahre: 0, jahreGleich: 0, kerzen: 0, mehrInVorgabe: 0, vorgabeBisFensterGleich: 0, kopien: {}, abweichung: [] };
  var fensterEnde = LP.etTagMs(L2.FENSTER_LESEN.bis) + 86400000 - 1;
  R2.jahre.forEach(function (jahr) {
    var a = LP.ladeJahr(Ralt, jahr);
    var b = L2.ladeJahr(R2, jahr, { fenster: L2.FENSTER_LESEN });
    var c = L2.ladeJahr(R2, jahr);                          // Vorgabe: bis zum Ende des Archivs
    z.jahre++;
    z.kopien[String(b.kopie)] = (z.kopien[String(b.kopie)] || 0) + 1;
    if (a.ok !== b.ok) { z.abweichung.push(jahr + ': ok ' + a.ok + ' / ' + b.ok); return; }
    if (!a.ok) { z.jahreGleich++; return; }
    z.kerzen += a.kerzen.length;
    if (gleicheKerzen(a.kerzen, b.kerzen) && a.quelle === b.quelle && path.resolve(a.pfad) === path.resolve(b.pfad)) z.jahreGleich++; else z.abweichung.push(jahr + ': ' + a.kerzen.length + ' / ' + b.kerzen.length + ' Kerzen');
    var bisFenster = c.kerzen.filter(function (k) { return k[0] <= fensterEnde; });
    if (gleicheKerzen(a.kerzen, bisFenster)) z.vorgabeBisFensterGleich++;
    z.mehrInVorgabe += c.kerzen.length - bisFenster.length;
  });
  return z;
}

function main() {
  var R2 = L2.reihen(), Ralt = LP.reihen(), je2 = {}, jeAlt = {};
  R2.forEach(function (r) { je2[r.reihe] = r; }); Ralt.forEach(function (r) { jeAlt[r.reihe] = r; });
  var man = L2.manifeste(), Lz = P.lebenszeitMinuten();
  var E = { stand: new Date().toISOString(), kennung: L2.KENNUNG, fensterLesen: L2.FENSTER_LESEN, endeDesArchivs: Lz.endeDesArchivs };

  /* P1 */
  var jahreOhneDatei = 0, jahreAltOhneDatei = 0;
  R2.forEach(function (r) { r.jahre.forEach(function (j) { if (!man.roh[r.ordner + '/' + j + '.json']) jahreOhneDatei++; }); });
  Ralt.forEach(function (r) { r.jahre.forEach(function (j) { if (!man.roh[r.ordner + '/' + j + '.json']) jahreAltOhneDatei++; }); });
  E.p1 = { reihen: R2.length, lebend: R2.filter(function (r) { return r.lebend === 1; }).length, lebendInLesenJs: Ralt.filter(function (r) { return r.lebend === 1; }).length,
    jahreOhneDatei: jahreOhneDatei, jahreOhneDateiInLesenJs: jahreAltOhneDatei };
  E.p1.bestanden = E.p1.reihen === 7299 && E.p1.lebend === 2249 && jahreOhneDatei === 0;

  /* P2 */
  var V = G.json(path.join(G.HIER, 't1-leser-veraltet.json')).reihen, m2 = G.json(P.BER2 + '/_manifest.json');
  var ausgenommen = {}; (m2.ausgenommen || []).forEach(function (a) { ausgenommen[a.schluessel] = a; });
  E.p2 = { reihen: V.length, bisRohEnde: 0, abbruchAusgenommen: [], unerwartet: [], zeilen: [] };
  V.forEach(function (v) {
    var R = je2[v.reihe], schl = R.ordner + '/' + v.jahr + '.json', roh = man.roh[schl];
    try {
      var g = L2.ladeJahr(R, v.jahr);
      var letzte = g.ok && g.kerzen.length ? g.kerzen[g.kerzen.length - 1][0] : null;
      /* Ende der Rohdatei = letzter Minutentag der Datei; leser2 liefert regulaere Kerzen: der letzte Tag muss derselbe sein */
      var ok = g.ok && letzte != null && G.etTag(letzte) === G.etTag(roh.letzter) && g.kopie === 'v2';
      var alt = null; try { alt = LP.ladeJahr(jeAlt[v.reihe], v.jahr); } catch (e) { alt = null; }
      if (ok) E.p2.bisRohEnde++; else E.p2.unerwartet.push(v.reihe + ': letzter Tag ' + (letzte ? G.etTag(letzte) : '-') + ', Rohdatei ' + G.etTag(roh.letzter) + ', Kopie ' + g.kopie);
      E.p2.zeilen.push({ reihe: v.reihe, kopie: g.kopie, kerzen: g.kerzen.length, letzterTag: letzte ? G.etTag(letzte) : null, rohEnde: G.etTag(roh.letzter), alteKopieEnde: v.leserEnde,
        kerzenLesenJs: alt && alt.ok ? alt.kerzen.length : null });
    } catch (e) {
      if (e.code === 'LESER2_KOPIE_VERALTET' && ausgenommen[schl]) E.p2.abbruchAusgenommen.push({ reihe: v.reihe, meldung: e.message });
      else E.p2.unerwartet.push(v.reihe + ': ' + e.message);
    }
  });
  E.p2.bestanden = E.p2.unerwartet.length === 0 && E.p2.bisRohEnde + E.p2.abbruchAusgenommen.length === V.length;

  /* P3 */
  var die33 = {}; V.forEach(function (v) { die33[v.reihe] = 1; });
  var gruppeA = {}; Object.keys(m2.eintraege).forEach(function (k) { if (m2.eintraege[k].gruppe === 'a') gruppeA[k.split('/')[0]] = 1; });
  var andere = R2.filter(function (r) { return !die33[r.reihe] && !gruppeA[r.ordner]; });
  var zug = G.ziehe(andere, 20, 'leser2-andere', function (r) { return r.reihe; });
  E.p3 = { grundgesamtheit: andere.length, gezogen: zug.map(function (r) { return r.reihe; }), reihen: zug.map(function (r) { return vergleicheReihe(r, jeAlt[r.reihe]); }) };
  E.p3.jahre = E.p3.reihen.reduce(function (s, z) { return s + z.jahre; }, 0); E.p3.kerzen = E.p3.reihen.reduce(function (s, z) { return s + z.kerzen; }, 0);
  E.p3.mehrInVorgabe = E.p3.reihen.reduce(function (s, z) { return s + z.mehrInVorgabe; }, 0);
  E.p3.bestanden = E.p3.reihen.every(function (z) { return z.jahreGleich === z.jahre && z.abweichung.length === 0; });

  /* P4 */
  var mitAlt = andere.filter(function (r) { return r.jahre.some(function (j) { return man.alt[r.ordner + '/' + j + '.json']; }); });
  var zug4 = G.ziehe(mitAlt, 10, 'leser2-altkopie', function (r) { return r.reihe; });
  E.p4 = { grundgesamtheit: mitAlt.length, gezogen: zug4.map(function (r) { return r.reihe; }), reihen: zug4.map(function (r) { return vergleicheReihe(r, jeAlt[r.reihe]); }) };
  E.p4.jahre = E.p4.reihen.reduce(function (s, z) { return s + z.jahre; }, 0); E.p4.kerzen = E.p4.reihen.reduce(function (s, z) { return s + z.kerzen; }, 0);
  E.p4.jahreAusAlterKopie = E.p4.reihen.reduce(function (s, z) { return s + (z.kopien.alt || 0); }, 0);
  E.p4.bestanden = E.p4.reihen.every(function (z) { return z.jahreGleich === z.jahre && z.abweichung.length === 0; }) && E.p4.jahreAusAlterKopie > 0;

  /* P5 */
  var S5 = G.json(path.join(G.HIER, 't5-saetze.json')).saetze.filter(function (s) { return s.angewandt === 1; });
  E.p5 = { saetze: S5.length, ausV2: 0, kopfNenntSatz: 0, fehler: [] };
  S5.forEach(function (s) {
    var R = je2[s.reihe]; if (!R) { E.p5.fehler.push(s.reihe + ': keine Aktienreihe'); return; }
    var jahr = Number(s.ex.slice(0, 4));
    try {
      var g = L2.ladeJahr(R, jahr, { fenster: { von: '2000-01-01', bis: '2099-12-31' } });
      if (g.kopie === 'v2') E.p5.ausV2++;
      var j = JSON.parse(fs.readFileSync(g.pfad, 'utf8'));
      var verworfen = (j.v2.verworfen || []).some(function (x) { return x.datum === s.ex && x.art === s.art; });
      var verschoben = (j.massnahmen || []).some(function (x) { return x.datumQuelle === s.ex && x.verschoben === 1; });
      if (verworfen || verschoben) E.p5.kopfNenntSatz++; else E.p5.fehler.push(s.reihe + ' ' + s.ex + ': Kopf nennt den Satz nicht');
    } catch (e) { E.p5.fehler.push(s.reihe + ': ' + e.message.slice(0, 120)); }
  });
  E.p5.bestanden = E.p5.fehler.length === 0 && E.p5.ausV2 === S5.length && E.p5.kopfNenntSatz === S5.length;

  E.bestanden = E.p1.bestanden && E.p2.bestanden && E.p3.bestanden && E.p4.bestanden && E.p5.bestanden;
  P.schreibe('teil3-pruefung.json', E);
  console.log(JSON.stringify({ p1: E.p1, p2: { reihen: E.p2.reihen, bisRohEnde: E.p2.bisRohEnde, abbruchAusgenommen: E.p2.abbruchAusgenommen, unerwartet: E.p2.unerwartet, bestanden: E.p2.bestanden },
    p3: { grundgesamtheit: E.p3.grundgesamtheit, gezogen: E.p3.gezogen, jahre: E.p3.jahre, kerzen: E.p3.kerzen, mehrInVorgabe: E.p3.mehrInVorgabe, bestanden: E.p3.bestanden, abweichungen: E.p3.reihen.filter(function (z) { return z.abweichung.length; }) },
    p4: { grundgesamtheit: E.p4.grundgesamtheit, gezogen: E.p4.gezogen, jahre: E.p4.jahre, kerzen: E.p4.kerzen, jahreAusAlterKopie: E.p4.jahreAusAlterKopie, bestanden: E.p4.bestanden, abweichungen: E.p4.reihen.filter(function (z) { return z.abweichung.length; }) },
    p5: E.p5, bestanden: E.bestanden }, null, 1));
}

if (require.main === module) main();
