'use strict';
/* Stufe 2 - das Buch gegen den S&P 500 (Auftrag §1.4 und Nachtrag §5; Lesarten in VORREGISTRIERUNG.md Teil C).
 *
 * Start: alles in SPY zur Eroeffnung des ersten Tags. Je Handelstag ZUR EROEFFNUNG, in dieser Reihenfolge:
 *   (0) Reihenende: erste Eroeffnung nach der letzten Zeile einer gehaltenen Reihe - Totalverlust (Insolvenz, Zwangs-Delisting) oder
 *       letzter Schlusskurs, der Erloes geht in SPY, der Platz wird frei.
 *   (1) Verkauf der Positionen, deren 60. Handelstag erreicht ist; der Erloes geht in SPY.
 *   (2) Buchwert zur Eroeffnung, EINMAL (nach den Verkaeufen, vor den Kaeufen); Kaufbetrag = Buchwert / Plaetze fuer alle Kaeufe des Tags.
 *   (3) Kaeufe in der Reihenfolge der Annahmezeit (frueheste zuerst; gleiche Sekunde: der groessere Signalwert, dann das Kuerzel),
 *       bezahlt durch Verkauf von SPY. Kein Kredit: reicht der SPY-Bestand nicht ganz, wird mit dem Rest gekauft; ist er null, verfaellt
 *       die Meldung. Plaetze voll: verfaellt. Ohne Eroeffnungskurs: kein Kauf. Schon gehaltene Firma: kein zweiter Kauf.
 * ZUM SCHLUSS: Ausschuettung des SPY (auf die Stueckzahl ueber die Nacht) kostenfrei wieder in SPY; Ausschuettungen gehaltener Aktien
 * (Stueckzahl ueber die Nacht) mit SPY-Kosten in SPY; Bewertung zum Schlusskurs (fehlt die Zeile: letzter Schlusskurs).
 *
 * Kein Handel nimmt einen anderen Kurs als die Eroeffnung des Handelstags; der Schlusskurs eines Tags geht in keine Entscheidung
 * dieses Tags ein (er bewertet und er legt Ausschuettungen an - das ist die Regel §5.4, keine Entscheidung).
 *
 * Das Modul bekommt die fertige Liste der Meldungen des obersten Zehntels. Ob der Signalwert die Ueberraschung oder eine Zufallszahl
 * ist, weiss es nicht. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */

function reihenfolge(a, b) { return a.zeit - b.zeit || b.wert - a.wert || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }

/** Der Massstab: Startkapital zur ersten Eroeffnung in SPY, Ausschuettungen am Ex-Tag zum Schluss wieder angelegt, ohne Kosten -
 *  dieselbe Rechnung wie in studien/massstab-rueckblick-2026-10-04/rueckblick.js (Schritt 5 von `simuliere`). */
function massstab(T, Q, DIV, opt) {
  var g = T.g, spy = opt.spy, o0 = Q.ord[opt.startTag], oEnd = Q.ord[opt.endTag], z0 = T.zeileVon(spy, opt.startTag);
  if (!(o0 >= 0) || !(oEnd >= o0) || z0 < 0) throw new Error('Massstab: Start oder Ende ist kein Panel-Handelstag');
  var stueck = opt.start / g.bEroeffnung[z0], schluss = NaN, tage = [], wert = opt.start;
  for (var o = o0; o <= oEnd; o++) {
    var d = Q.ptage[o], zS = T.zeileVon(spy, d);
    if (zS >= 0) {
      if (d > opt.startTag) {
        var l = DIV(spy, d);
        for (var i = 0; i < l.length; i++) { var betrag = stueck * l[i].basis * l[i].satz; stueck += betrag / g.bSchluss[zS]; }
      }
      schluss = g.bSchluss[zS];
    }
    wert = stueck * schluss;
    tage.push({ tag: d, spy: wert });
  }
  return { endwert: wert, tage: tage, stueck: stueck };
}

/**
 * T, Q:      Panel-Tafel und RB.vorbereiten(T)
 * DIV:       function (sym, tag) -> [{ basis, satz }]  (Rueckblick Nr. 74: ausschuettungenAm)
 * meldungen: [{ E, sym, cik, klasse, zeit (Sekunden), wert, name }] - nur das oberste Zehntel, Einstiegstag im Fenster
 * opt:       { startTag, endTag, start, plaetze, halten, kostenPp: [je Klasse, Pp je Umlauf], spyBp, totalverlust: {grund: true}, spy, detail }
 */
function simuliere(T, Q, DIV, meldungen, opt) {
  var g = T.g, spy = opt.spy, s = opt.spyBp / 10000, detail = !!opt.detail;
  var o0 = Q.ord[opt.startTag], oEnd = Q.ord[opt.endTag], z0 = T.zeileVon(spy, opt.startTag);
  if (!(o0 >= 0) || !(oEnd >= o0) || z0 < 0 || !(g.bEroeffnung[z0] > 0)) throw new Error('Buch: Start oder Ende ist kein Panel-Handelstag mit SPY-Kurs');
  var jeTag = {};
  meldungen.forEach(function (m) {
    if (m.E < opt.startTag || m.E > opt.endTag) throw new Error('Meldung ausserhalb des Fensters');
    if (!(opt.kostenPp[m.klasse] >= 0)) throw new Error('Klasse ohne Kostensatz: ' + m.klasse);
    (jeTag[m.E] = jeTag[m.E] || []).push(m);
  });
  Object.keys(jeTag).forEach(function (k) { jeTag[k].sort(reihenfolge); });

  var spyStueck = opt.start / g.bEroeffnung[z0], n0 = spyStueck, F = 1, cEnde = NaN;
  var pos = [], alle = [], gehalten = {}, tage = [], handel = [], wert = opt.start;
  var zz = { meldungen: meldungen.length, gekauft: 0, teilkauf: 0, verfallenPlaetzeVoll: 0, verfallenKeinSpy: 0, ohneEroeffnung: 0, schonGehalten: 0,
    verkauft: 0, verkaufVerschoben: 0, reihenenden: 0, totalverluste: 0, lueckentage: 0, kostenAktien: 0, kostenSpy: 0, volumenAktien: 0,
    ausschuettungen: 0, ausschuettungSumme: 0, spyAusschuettungen: 0, spyAusschuettungSumme: 0, platzTage: 0, aktienAnteilSumme: 0, tage: 0, maxPlaetze: 0 };

  function anlegen(betrag, kurs, p, Fd) {                       /* Erloes in SPY: 0,5 Basispunkte auf das Volumen */
    if (!(betrag > 0)) return;
    var st = betrag * (1 - s) / kurs;
    spyStueck += st; zz.kostenSpy += betrag * s; p.einheiten += st / Fd;
  }

  for (var o = o0; o <= oEnd; o++) {
    var d = Q.ptage[o], zS = T.zeileVon(spy, d), i, p, z, op;
    if (zS < 0 || !(g.bEroeffnung[zS] > 0) || !(g.bSchluss[zS] > 0)) throw new Error('SPY ohne Kurs am Tag ' + T.kal.tage[d]);
    var oS = g.bEroeffnung[zS], cS = g.bSchluss[zS], spyNacht = spyStueck;
    var divS = d > opt.startTag ? DIV(spy, d) : [], jeAnteil = 0;
    for (i = 0; i < divS.length; i++) jeAnteil += divS[i].basis * divS[i].satz;
    var Fd = F * (1 + jeAnteil / cS);                           /* Faktor fuer jeden Handel dieses Tags (Zerlegung der Beitraege) */

    /* (0) Reihenende */
    for (i = pos.length - 1; i >= 0; i--) {
      p = pos[i];
      if (T.zeileVon(p.sym, d) >= 0) continue;
      var lz = T.letzteZeile(p.sym);
      if (g.tag[lz] < d) {
        var grund = T.endeGrund[p.sym] || null, total = !!(grund && opt.totalverlust[grund]);
        var erloes = total ? 0 : p.stueck * g.bSchluss[lz];
        anlegen(erloes, oS, p, Fd);
        p.offen = false; p.ausTag = d; p.ausArt = total ? 'totalverlust' : 'reihenende'; p.ausGrund = grund; p.erloes = erloes;
        pos.splice(i, 1); delete gehalten[p.cik];
        zz.reihenenden++; if (total) zz.totalverluste++;
        if (detail) handel.push({ tag: d, art: p.ausArt, name: p.name, stueck: p.stueck, kurs: total ? 0 : g.bSchluss[lz], volumen: erloes, spyKurs: oS });
      } else zz.lueckentage++;
    }
    /* Ausschuettungen gehaltener Aktien: Anspruch hat die Stueckzahl ueber die Nacht (Kauf vor heute); angelegt wird zum Schluss */
    var bar = [];
    for (i = 0; i < pos.length; i++) {
      p = pos[i];
      if (!(p.seitTag < d)) continue;
      var l = DIV(p.sym, d);
      for (var j = 0; j < l.length; j++) bar.push({ p: p, betrag: p.stueck * l[j].basis * l[j].satz });
    }
    /* (1) Verkauf am 60. Handelstag zur Eroeffnung; ohne Eroeffnungskurs an diesem Tag: am ersten Folgetag mit Eroeffnungskurs */
    for (i = pos.length - 1; i >= 0; i--) {
      p = pos[i];
      if (o - p.seitOrd < opt.halten) continue;
      z = T.zeileVon(p.sym, d); op = z >= 0 ? g.bEroeffnung[z] : NaN;
      if (!(op > 0)) { if (!p.verschoben) { p.verschoben = true; zz.verkaufVerschoben++; } continue; }
      var vol = p.stueck * op, kv = vol * opt.kostenPp[p.klasse] / 200;
      zz.kostenAktien += kv; zz.volumenAktien += vol;
      anlegen(vol - kv, oS, p, Fd);
      p.offen = false; p.ausTag = d; p.ausArt = 'verkauf'; p.erloes = vol - kv;
      pos.splice(i, 1); delete gehalten[p.cik];
      zz.verkauft++;
      if (detail) handel.push({ tag: d, art: 'verkauf', name: p.name, stueck: p.stueck, kurs: op, volumen: vol, kosten: kv, spyKurs: oS });
    }
    /* (2) Buchwert zur Eroeffnung, einmal je Tag (§5.1) */
    var buchwert = spyStueck * oS;
    for (i = 0; i < pos.length; i++) {
      p = pos[i]; z = T.zeileVon(p.sym, d); op = z >= 0 ? g.bEroeffnung[z] : NaN;
      buchwert += p.stueck * (op > 0 ? op : p.letzterSchluss);
    }
    /* (3) Kaeufe */
    var liste = jeTag[d] || [], betrag = buchwert / opt.plaetze;
    for (i = 0; i < liste.length; i++) {
      var m = liste[i];
      if (gehalten[m.cik]) { zz.schonGehalten++; continue; }
      z = T.zeileVon(m.sym, d); op = z >= 0 ? g.bEroeffnung[z] : NaN;
      if (!(op > 0)) { zz.ohneEroeffnung++; continue; }
      if (pos.length >= opt.plaetze) { zz.verfallenPlaetzeVoll++; continue; }
      var spyWert = spyStueck * oS;
      if (!(spyWert > 1e-9)) { zz.verfallenKeinSpy++; continue; }
      var c2 = opt.kostenPp[m.klasse] / 200, V = betrag, S = V * (1 + c2) / (1 - s), teil = false;
      if (S >= spyWert) { teil = S > spyWert; S = spyWert; V = S * (1 - s) / (1 + c2); spyStueck = 0; } else spyStueck -= S / oS;
      if (teil) zz.teilkauf++;
      zz.kostenSpy += S * s; zz.kostenAktien += V * c2; zz.volumenAktien += V;
      p = { sym: m.sym, cik: m.cik, klasse: m.klasse, name: m.name, wert: m.wert, stueck: V / op, seitTag: d, seitOrd: o, einstand: V, kaufkurs: op,
        letzterSchluss: op, einheiten: -(S / oS) / Fd, offen: true, ausTag: -1, ausArt: null, verschoben: false, ausschuettung: 0 };
      pos.push(p); alle.push(p); gehalten[m.cik] = true;
      zz.gekauft++;
      if (detail) handel.push({ tag: d, art: 'kauf', name: m.name, stueck: p.stueck, kurs: op, volumen: V, kosten: V * c2, spyVerkauft: S, spyKurs: oS, buchwert: buchwert, teil: teil });
    }
    if (pos.length > zz.maxPlaetze) zz.maxPlaetze = pos.length;

    /* Schluss: Ausschuettung des SPY kostenfrei wieder in SPY (wie der Massstab) */
    for (i = 0; i < divS.length; i++) {
      var bS = spyNacht * divS[i].basis * divS[i].satz;
      spyStueck += bS / cS; zz.spyAusschuettungen++; zz.spyAusschuettungSumme += bS;
    }
    F = Fd;
    /* Ausschuettungen der Aktien zum Schluss des Ex-Tags in SPY (§5.4), mit SPY-Kosten */
    for (i = 0; i < bar.length; i++) {
      anlegen(bar[i].betrag, cS, bar[i].p, F);
      zz.ausschuettungen++; zz.ausschuettungSumme += bar[i].betrag; bar[i].p.ausschuettung += bar[i].betrag;
      if (detail) handel.push({ tag: d, art: 'ausschuettung', name: bar[i].p.name, volumen: bar[i].betrag, spyKurs: cS });
    }
    /* Bewertung zum Schluss */
    var aktien = 0;
    for (i = 0; i < pos.length; i++) {
      p = pos[i]; z = T.zeileVon(p.sym, d);
      if (z >= 0 && g.bSchluss[z] > 0) p.letzterSchluss = g.bSchluss[z];
      aktien += p.stueck * p.letzterSchluss;
    }
    wert = spyStueck * cS + aktien; cEnde = cS;
    zz.platzTage += pos.length; zz.aktienAnteilSumme += aktien / wert; zz.tage++;
    if (detail) tage.push({ tag: d, buch: wert, plaetze: pos.length, aktien: aktien });
  }

  /* Zerlegung: Endwert Buch - Endwert Massstab = Summe der Beitraege der Positionen (jede Bewegung in SPY-Anteilen, auf das Ende gerechnet) */
  var massstabEnde = n0 * F * cEnde, summe = 0, beitraege = new Float64Array(alle.length);
  for (var k = 0; k < alle.length; k++) {
    var q = alle[k];
    q.beitrag = q.einheiten * F * cEnde + (q.offen ? q.stueck * q.letzterSchluss : 0);
    beitraege[k] = q.beitrag; summe += q.beitrag;
  }
  var sortiert = Float64Array.from(beitraege).sort(), top10 = 0;
  for (k = sortiert.length - 1; k >= Math.max(0, sortiert.length - 10); k--) top10 += sortiert[k];
  var aus = { endwert: wert, massstabEnde: massstabEnde, abstand: wert - massstabEnde, beitragSumme: summe, top10Summe: top10, zaehler: zz,
    plaetzeMittel: zz.platzTage / zz.tage, aktienAnteilMittel: zz.aktienAnteilSumme / zz.tage, offeneAmEnde: pos.length, spyStueckEnde: spyStueck };
  if (detail) { aus.tage = tage; aus.handel = handel; aus.positionen = alle; }
  return aus;
}

module.exports = { simuliere: simuliere, massstab: massstab, reihenfolge: reihenfolge };
