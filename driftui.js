'use strict';
/* Oberfläche für die Ergebnis-Drift-Strategie.
 * Die Rechnung selbst steht in drift.js (rein, in Node testbar) – hier wird nur geholt,
 * angezeigt und bedient.
 *
 * Die Termine kommen aus zwei Quellen, weil keine für sich reicht:
 *   TIEF   Yahoos Kalender-Endpunkt, zurück bis in die 1990er – aber nicht aktuell
 *          (am 21.08.2026 endete er bei Juni 2025, während die Kurse bis August 2026
 *          liefen). Gut für den Rückblick, unbrauchbar für den laufenden Betrieb.
 *   FRISCH earningsHistory + calendarEvents, zusammengesetzt in drift.js – liefert
 *          jeweils nur den JÜNGSTEN Termin, dafür aktuell.
 * Beide werden in einem eigenen Archiv zusammengeführt, das mit jedem Abruf wächst.
 * Genau wie beim Kursarchiv schließt sich die Lücke damit über die Zeit von selbst.
 */
(function () {
  var Dr = window.Drift, U = window.U;
  var DATEN = null;                 // {kurse, markt, termine}
  var LAEUFT = false;

  function stat(t) { var e = document.getElementById('drStatus'); if (e) e.textContent = t || ''; }
  function opts() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; };
    return {
      halten: parseInt(g('drHalten') || '60', 10),
      anteil: parseFloat(g('drAnteil') || '0.2'),
      fenster: parseInt(g('drFenster') || '120', 10),
      kostenBp: parseInt(g('drKosten') || '10', 10)
    };
  }

  /* ---------------- Termin-Archiv ---------------- */
  /** Zwei Terminlisten verschmelzen, doppelte am Tagesdatum erkennen.
   *  Ein Termin steht als [ISO-Zeit, Schätzung, Ist, Überraschung%]. */
  function mische(alt, neu) {
    var nachTag = {};
    (alt || []).forEach(function (t) { if (t && t[0]) nachTag[String(t[0]).slice(0, 10)] = t; });
    (neu || []).forEach(function (t) {
      if (!t || !t[0]) return;
      var k = String(t[0]).slice(0, 10);
      // Ein Eintrag MIT Überraschung schlägt einen ohne – der tiefe Kalender führt
      // angekündigte Termine ohne Zahlen, die später mit Werten nachkommen.
      if (!nachTag[k] || (nachTag[k][3] == null && t[3] != null)) nachTag[k] = t;
    });
    return Object.keys(nachTag).sort().map(function (k) { return nachTag[k]; });
  }

  async function ladeTermine(syms, vollstaendig) {
    var archiv = (await window.api.storeGet('drift_termine')) || { at: 0, sym: {} };
    if (!archiv.sym) archiv.sym = {};
    /* Einmalige Bereinigung: Termine in der ZUKUNFT duerfen keine Zahlen tragen. Durch den
     * paareAktuell-Fehler (bis 8.23.42) hing die Vorquartals-Ueberraschung am naechsten
     * Meldetermin - 25 Eintraege im Archiv, z. B. GS 13.10.2026 mit den Q2-Zahlen. Ohne
     * Bereinigung wuerde mische() sie nie ersetzen, weil ein Eintrag MIT Zahlen gewinnt. */
    if (!archiv.zukunftBereinigt) {
      var jetzt = Date.now(), bereinigt = 0;
      Object.keys(archiv.sym).forEach(function (s) {
        (archiv.sym[s] || []).forEach(function (t) {
          if (t && t[0] && Date.parse(t[0]) > jetzt && t[3] != null) { t[1] = null; t[2] = null; t[3] = null; bereinigt++; }
        });
      });
      archiv.zukunftBereinigt = jetzt;
      if (bereinigt) console.log('Ertragstermine: ' + bereinigt + ' Zukunftstermine von fremden Zahlen befreit.');
    }
    var fehlend = syms.filter(function (s) { return !archiv.sym[s] || !archiv.sym[s].length; });
    // Vollständiger Lauf: alle Symbole. Sonst nur die, die noch gar nichts haben,
    // plus ein rollierender Teil für die frischen Termine.
    var holen = vollstaendig ? syms.slice() : fehlend.slice();
    if (!vollstaendig) {
      var start = (archiv.zeiger || 0) % Math.max(1, syms.length);
      for (var z = 0; z < 25 && holen.length < 25; z++) {
        var s2 = syms[(start + z) % syms.length];
        if (holen.indexOf(s2) === -1) holen.push(s2);
      }
      archiv.zeiger = start + 25;
    }
    var neu = 0, fehler = 0, ohneAktuell = 0;
    for (var i = 0; i < holen.length; i++) {
      stat('Lade Ergebnistermine … ' + (i + 1) + '/' + holen.length + ' (' + holen[i] + ')');
      var r = null;
      try { r = await window.api.earningsFetch(holen[i]); } catch (e) { }
      if (!r || !r.ok) { fehler++; await new Promise(function (w) { setTimeout(w, 800); }); continue; }
      var liste = r.termine || [];
      if (r.aktuell) liste = liste.concat([[r.aktuell.termin, r.aktuell.schaetzung, r.aktuell.ist, r.aktuell.ueberraschung]]);
      /* Der tiefe Kalender endet rund ein Jahr in der Vergangenheit; erst r.aktuell
       * bringt den kommenden Termin. Faellt genau diese Haelfte aus, meldete der
       * Hauptprozess trotzdem ok:true und hier wurde stillschweigend uebersprungen -
       * das Archiv galt danach als frisch und war es nicht. */
      else if (r.aktuellGrund) ohneAktuell++;
      var vorher = (archiv.sym[holen[i]] || []).length;
      archiv.sym[holen[i]] = mische(archiv.sym[holen[i]], liste);
      neu += archiv.sym[holen[i]].length - vorher;
      // Yahoo drosselt bei zu vielen Anfragen in Folge – lieber langsam und vollständig
      await new Promise(function (w) { setTimeout(w, 700); });
    }
    archiv.at = Date.now();
    await window.api.storeSet('drift_termine', archiv);
    stat(Object.keys(archiv.sym).length + ' Werte im Terminarchiv, ' + neu + ' neue Termine' +
      (fehler ? ', ' + fehler + ' Abrufe fehlgeschlagen (Drosselung? Später nochmal)' : '') +
      (ohneAktuell ? ', ' + ohneAktuell + ' ohne aktuellen Termin – für diese Werte ist nur die ' +
        'Vergangenheit bekannt' : '') + '.');
    return archiv;
  }

  /* ---------------- Kurse ---------------- */
  /** Der Mittelfrist-Tab lädt dasselbe Universum und legt es unter mf_tagesdaten ab.
   *  Zweimal dieselben 190 Symbole zu holen wäre Verschwendung – und würde die
   *  Drosselung provozieren, an der der Terminabruf ohnehin schon knabbert. */
  async function ladeKurse() {
    var g = window.MF && window.MF.tagesdatenLesen ? await window.MF.tagesdatenLesen() : await window.api.storeGet('mf_tagesdaten');
    if (!g || !g.roh || Object.keys(g.roh).length < 30) return null;
    return g.roh;
  }
  async function ladeMarkt() {
    var key = 'drift_markt';
    var c = await window.api.storeGet(key);
    if (c && c.reihe && Date.now() - c.at < 20 * 3600000) return c.reihe;
    try {
      /* BEREINIGT: Der Marktvergleich laeuft ueber Jahrzehnte (period1=0). Ohne
       * adjclose macht jeder Split aus einer Verdopplung eine Halbierung. */
      var kd = await window.Kurse.hole('SPY', { von: 0, bis: Date.now(), interval: '1d', bereinigt: true });
      if (!kd) return c ? c.reihe : null;
      var reihe = window.Kurse.reihe(kd.bars);
      if (reihe.length < 500) return c ? c.reihe : null;
      await window.api.storeSet(key, { at: Date.now(), reihe: reihe });
      return reihe;
    } catch (e) { return c ? c.reihe : null; }
  }

  /* ---------------- Anzeige ---------------- */
  function zeigeErgebnis(res, wieViele) {
    var el = document.getElementById('drErgebnis');
    if (!el) return;
    if (!res) {
      el.innerHTML = '<div class="empty">Zu wenige Ereignisse für eine Auswertung. ' +
        'Das Terminarchiv muss erst gefüllt werden – „Termine laden“ oben.</div>';
      return;
    }
    var gut = res.tWert >= 2;
    el.innerHTML =
      '<div class="depot-stats">' +
        '<div class="tile"><div class="name">Ertrag p. a. (marktneutral)</div><div class="val ' +
          (res.proJahr >= 0 ? 'pos' : 'neg') + '" style="font-size:var(--fs-zahl);">' + U.signTxt(res.proJahr, ' %') + '</div></div>' +
        '<div class="tile"><div class="name">t-Wert</div><div class="val" style="font-size:var(--fs-zahl);">' + res.tWert + '</div></div>' +
        '<div class="tile"><div class="name">Positive Monate</div><div class="val" style="font-size:var(--fs-zahl);">' + res.positiveMonate + ' %</div></div>' +
        '<div class="tile"><div class="name">Gemessene Monate</div><div class="val" style="font-size:var(--fs-zahl);">' + res.verlauf.length + '</div></div>' +
        '<div class="tile"><div class="name">Positionen gleichzeitig</div><div class="val" style="font-size:var(--fs-zahl);">' + res.offenSchnitt + '</div></div>' +
      '</div>' +
      '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:8px;">' +
        res.positionen.toLocaleString('de-DE') + ' Positionen aus ' + wieViele + ' Werten · ' +
        res.monate[0] + ' bis ' + res.monate[res.monate.length - 1] + ' · ' +
        '<b class="' + (gut ? 'pos' : 'neg') + '">' +
        (gut ? 'überzufällig (t ≥ 2)' : 'nicht überzufällig – das ist kein Beleg') + '</b>' +
      '</div>';
  }

  function zeigeHeute(h) {
    var el = document.getElementById('drHeute');
    if (!el) return;
    if (!h || (!h.offen.length && !h.faellig.length)) {
      el.innerHTML = '<div class="empty" style="padding:10px 0;">Zurzeit keine offenen Positionen. ' +
        'Das ist normal, wenn im Terminarchiv keine Meldung der letzten ' + (h ? h.halten : 60) + ' Handelstage steht – ' +
        'Yahoos tiefer Kalender hinkt der Gegenwart hinterher, die frischen Termine kommen erst mit den nächsten Abrufen dazu.</div>';
      return;
    }
    var zeilen = h.offen.map(function (o) {
      return '<tr><td>' + U.esc(o.sym) + '</td>' +
        '<td class="' + (o.richtung === 'kaufen' ? 'pos' : 'neg') + '">' + (o.richtung === 'kaufen' ? '▲ kaufen' : '▼ verkaufen') + '</td>' +
        '<td style="text-align:right;">' + U.signTxt(o.ueberraschung, ' %') + '</td>' +
        '<td style="text-align:right;">' + o.rang + '</td>' +
        '<td style="text-align:right;">' + o.seitTagen + '</td>' +
        '<td style="text-align:right;">' + o.nochTage + '</td>' +
        '<td style="text-align:right;" class="' + (o.standPct >= 0 ? 'pos' : 'neg') + '">' +
          (o.standPct == null ? '–' : U.signTxt(o.standPct, ' %')) + '</td></tr>';
    }).join('');
    el.innerHTML =
      (h.faellig.length
        ? '<div style="font-size:var(--fs-text); margin-bottom:8px; padding:8px 10px; border-left:3px solid var(--warn);">' +
          '<b>Heute fällig:</b> ' + h.faellig.map(function (f) { return U.esc(f.sym) + ' ' + f.richtung; }).join(', ') +
          ' – die Haltedauer von ' + h.halten + ' Handelstagen ist erreicht.</div>'
        : '') +
      '<table class="tbl"><thead><tr><th>Wert</th><th>Richtung</th>' +
      '<th style="text-align:right;">Überraschung</th><th style="text-align:right;">Rang</th>' +
      '<th style="text-align:right;">seit</th><th style="text-align:right;">noch</th>' +
      '<th style="text-align:right;">Stand</th></tr></thead><tbody>' + zeilen + '</tbody></table>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:6px;">' +
      'Rang = Perzentil der Überraschung gegenüber den letzten ' + opts().fenster + ' Handelstagen. ' +
      'Simulation mit virtuellem Kapital, keine Anlageberatung.</div>';
  }

  /* ---------------- Ablauf ---------------- */
  async function rechne() {
    if (LAEUFT) return;
    LAEUFT = true;
    try {
      stat('Lade Kurse …');
      var kurse = await ladeKurse();
      if (!kurse) {
        stat('Keine Tageskurse vorhanden. Bitte zuerst unter „Vermögen → Mittelfristig“ die Kurse laden – beide Strategien nutzen dieselben Daten.');
        return;
      }
      var markt = await ladeMarkt();
      if (!markt) { stat('Marktreferenz (SPY) nicht abrufbar.'); return; }
      var archiv = (await window.api.storeGet('drift_termine')) || { sym: {} };
      var termine = {};
      Object.keys(kurse).forEach(function (s) {
        if (archiv.sym && archiv.sym[s] && archiv.sym[s].length) termine[s] = archiv.sym[s];
      });
      var n = Object.keys(termine).length;
      if (n < 20) {
        stat('Erst ' + n + ' Werte im Terminarchiv. Für eine Auswertung sollten es mindestens 20 sein – „Termine laden“ oben.');
        zeigeErgebnis(null); zeigeHeute(null);
        return;
      }
      stat('Rechne über ' + n + ' Werte …');
      var O = opts();
      DATEN = { kurse: kurse, markt: markt, termine: termine };
      zeigeErgebnis(Dr.durchlauf(kurse, termine, markt, O), n);
      zeigeHeute(Dr.heute(kurse, termine, markt, O));
      stat(n + ' Werte ausgewertet. Terminarchiv vom ' +
        (archiv.at ? new Date(archiv.at).toLocaleString('de-DE') : '–') + '.');
    } finally { LAEUFT = false; }
  }

  async function ladeAlles(vollstaendig) {
    if (LAEUFT) return;
    LAEUFT = true;
    try {
      var kurse = await ladeKurse();
      if (!kurse) { stat('Keine Tageskurse vorhanden. Bitte zuerst unter „Vermögen → Mittelfristig“ die Kurse laden.'); return; }
      await ladeTermine(Object.keys(kurse), vollstaendig);
    } finally { LAEUFT = false; }
    rechne();
  }

  function bereit() {
    var b1 = document.getElementById('drLadeBtn');
    var b2 = document.getElementById('drLadeAlleBtn');
    var b3 = document.getElementById('drRechneBtn');
    if (b1) b1.addEventListener('click', function () { ladeAlles(false); });
    if (b2) b2.addEventListener('click', function () { ladeAlles(true); });
    if (b3) b3.addEventListener('click', rechne);
    ['drHalten', 'drAnteil', 'drFenster', 'drKosten'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.addEventListener('change', function () { if (DATEN) rechne(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  // hintergrund: rollierender Termin-Abruf (25 Symbole je Lauf), gedacht fuer den
  // Zeitgeber im Mittelfrist-Depot. Ohne ihn bleibt "Was waere heute offen?" leer,
  // weil Yahoos tiefer Kalender der Gegenwart um ein Jahr hinterherhinkt.
  window.DriftUI = { rechne: rechne, hintergrund: function () { ladeAlles(false); } };
})();
