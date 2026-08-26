'use strict';
/* ================= Signal-Chart (Regeln → Chart) =================
 *
 * Stufe E des Struktur-Plans, Block 2: die stc*-Familie aus depot.js, WOERTLICH
 * umgezogen - gleiche Funktionen, gleiche Kommentare, gleiche Marken; neu sind nur
 * dieser Kopf und die Verkabelung am Ende. Der Chart rechnet die gemessene Regel
 * auf Kerzen NACH, er handelt nichts und schreibt den Depot-Zustand nie.
 *
 * Abhaengigkeiten: Q/U/Chart sind global. Aus dem Handelsmodul kommen universe,
 * fetchIntraday und zOf ueber StrategieChart.verkabeln() - und der Depot-Zustand als
 * GETTER, nicht als Kopie: depot.js weist sein D beim Depot-Reset neu zu, eine
 * hereingereichte Kopie waere danach veraltet. Jeder oeffentliche Einstieg holt sich
 * deshalb zuerst den frischen Verweis (mitFrischemD), der Blocktext selbst liest
 * weiter einfach D. */
(function () {
  var U = window.U, Q = window.Quant;
  var niceTicks = window.Chart.niceTicks;
  var fmtTick = window.Chart.fmtTick;
  var fmtTimeTick = window.Chart.fmtTimeTick;
  /* Von depot.js hereingereicht (verkabeln) - vorher zeigt der Chart nur den Leerzustand. */
  var universe = null, fetchIntraday = null, zOf = null, holeDepot = null;
  var D = null;

  /* ================= Signal-Chart: was die Strategie sieht ================= */
  function stcParams(mode) {
    var cfg = D.intraday;
    return { ENTRY: mode, LINE: cfg.lineType || 'ema', period: cfg.period || 20, confirmBps: cfg.confirmBps,
      ZTHR: zOf(cfg.confirmBps), MINQ: 0, CHAN: false, MTF: false, TREND: false };
  }
  /** Bedingungen der letzten Kerze, einzeln geprueft - damit man sieht, WARUM (k)ein Signal steht.
   *  Die Einzelpruefungen spiegeln die Regel in Q.einstiegSignal; das Gesamturteil kommt
   *  trotzdem aus genau dieser Funktion, nicht aus der Summe der Haekchen. */
  function stcBedingungen(bars, mode, P, ciWunsch) {
    // ciWunsch: Index der zu pruefenden Kerze. Ohne Angabe die letzte abgeschlossene -
    // mit Angabe genau die Kerze, in der die Regel damals ihr Signal gab (Issue #52).
    var ci = ciWunsch == null ? bars.length - 1 : Math.max(0, Math.min(bars.length - 1, ciWunsch));
    var win = bars.slice(Math.max(0, ci - Math.max(P.period * 4, 260)), ci + 1);
    var closes = win.map(function (b) { return b[1]; });
    var n = closes.length, out = [];
    var kanal = null;
    try { kanal = Q.kanalUeber(bars, Math.max(0, ci - 200), ci); } catch (e) { }
    var kName = { seit: 'seitwärts', auf: 'aufwärts', ab: 'abwärts' };
    var vs = 0, vn = 0;
    for (var vq = n - 51; vq < n - 1; vq++) { if (vq >= 0) { vs += (win[vq][2] || 0); vn++; } }
    var vAvg = vn ? vs / vn : 0, vLast = win[n - 1][2] || 0;
    var vOk = vAvg > 0 && vLast > 1.3 * vAvg;
    var vTxt = 'Volumen der Signalkerze über dem 1,3-fachen der 50 Kerzen davor' + (vAvg > 0 ? ' – aktuell ' + (vLast / vAvg).toFixed(2) + '×' : ' – kein Volumen in der Reihe');
    /* #80 (Weg 2): Perzentil statt Roh-Guete - deren Nullpunkt liegt bei ~75-94. */
    var kPz = kanal ? Q.gueteZufallsAnteil(kanal.guete, kanal.n) : null;
    var kTxt = kanal ? ' – aktuell ' + (kName[kanal.trend] || kanal.trend) +
      (kPz == null ? '' : ', besser als ' + kPz + ' % des Zufalls') : ' – kein Kanal berechenbar';
    if (mode === 'rsi2seit') {
      var r2 = n >= 3 ? Q.rsi(closes, 2) : null;
      var e100 = Q.emaSeries(closes, 100);
      var steigt = n >= 120 && e100[n - 1] > e100[Math.max(0, n - 9)];
      out.push({ ok: r2 != null && r2 <= 10, txt: 'RSI(2) ≤ 10 (überverkauft)' + (r2 != null ? ' – aktuell ' + r2.toFixed(1) : '') });
      out.push({ ok: steigt, txt: 'EMA100 steigt (gegen 8 Kerzen zuvor) – nur dann ist der Dip ein Kauf' });
      out.push({ ok: !!kanal && kanal.trend === 'seit', txt: 'Kanal der letzten 200 Kerzen ist seitwärts' + kTxt });
      out.push({ ok: vOk, txt: vTxt });
    } else {
      var rv = Q.reversionSignal(win, P.LINE, P.period, P.ZTHR);
      out.push({ ok: rv.z != null && rv.z <= -P.ZTHR, txt: 'Abstand zur Leitlinie EMA' + P.period + ' mindestens ' + P.ZTHR + ' Standardabweichungen UNTER ihr' + (rv.z != null ? ' – aktuell z = ' + rv.z.toFixed(2) : '') });
      out.push({ ok: n >= 2 && closes[n - 1] > closes[n - 2], txt: 'Letzte Kerze dreht bereits nach oben (kein fallendes Messer)' });
      out.push({ ok: !!kanal && kanal.trend === 'ab', txt: 'Kanal der letzten 200 Kerzen ist abwärts (Kapitulation braucht den Ausverkauf)' + kTxt });
      out.push({ ok: vOk, txt: vTxt });
    }
    var sig = null;
    try { sig = Q.einstiegSignal(bars, ci, P); } catch (e2) { }
    return { liste: out, signal: sig && sig.dir ? sig.dir : null, kanal: kanal };
  }
  /** Alle Kanaele, die fuer die Entscheidung IN EINER BESTIMMTEN KERZE zaehlen.
   *  ci ist der Index dieser Kerze in der Gesamtreihe - beim Klick auf ein historisches
   *  Signal also dessen Kerze, sonst die letzte abgeschlossene.
   *
   *  Warum das eine eigene Funktion ist: Vorher zeichnete der Chart pauschal den Kanal
   *  der LETZTEN Kerze, auch wenn die Bedingungsliste daneben ein historisches Signal
   *  nachrechnete. An 292 echten Signalen gemessen war das in 100 % der Faelle ein
   *  anderer Kanal und in 81 % einer mit anderer Richtung.
   *
   *  Entscheidungsrelevant ist genau EINER: der 200-Kerzen-Kanal, den einstiegSignal
   *  als Erlaubnis abfragt. Die uebrigen sind Kontext und sind auch so beschriftet -
   *  ein Kanal, der nichts entscheidet, darf nicht aussehen wie einer, der es tut. */
  function stcKanalListe(S, ci, mitKontext) {
    var out = [], off = S.off, ende = S.show.length - 1;
    var kName = { seit: 'seitwärts', auf: 'aufwärts', ab: 'abwärts' };
    function hol(bis) { try { return Q.kanalUeber(S.bars, Math.max(0, bis - 200), bis); } catch (e) { return null; } }
    var soll = S.mode === 'rsi2seit' ? 'seit' : 'ab';
    var kJetzt = hol(S.bars.length - 1);
    if (ci != null && ci !== S.bars.length - 1) {
      // Der Kanal, an dem das ANGEKLICKTE Signal haengt - das ist der entscheidende.
      var kSig = hol(ci);
      if (kSig) out.push({ k: kSig, endI: ci - off, farbe: 'var(--series3)', breite: 2,
        opac: 0.95, name: 'Entscheidung: ' + (kName[kSig.trend] || kSig.trend) + (kSig.trend === soll ? ' ✓' : ' ✗') });
      // Der heutige Kanal daneben, gestrichelt: er entscheidet ueber das Signal von
      // damals nichts, beantwortet aber die naheliegende Frage "und wie steht es jetzt?".
      if (kJetzt) out.push({ k: kJetzt, endI: ende, farbe: 'var(--series3)', breite: 1.2, dash: '4 4',
        opac: 0.35, fuellen: false, name: 'heute: ' + (kName[kJetzt.trend] || kJetzt.trend) });
    } else if (kJetzt) {
      out.push({ k: kJetzt, endI: ende, farbe: 'var(--series3)', breite: 2, opac: 0.95,
        name: 'Entscheidung: ' + (kName[kJetzt.trend] || kJetzt.trend) + (kJetzt.trend === soll ? ' ✓' : ' ✗') });
    }
    /* Kontext-Ebenen: derselbe Kursverlauf auf kurzer, mittlerer und langer Sicht.
     * Sie entscheiden NICHTS - sie erklaeren, warum die 200er-Sicht so eingeordnet
     * wird, wie sie eingeordnet wird. Ein kurzer Abwaertskanal in einem langen
     * Seitwaertskanal ist kein Widerspruch, sondern beides wahr. */
    if (mitKontext) {
      var bis = ci == null ? S.bars.length - 1 : ci;
      var ks = [];
      try { ks = Q.kanaele(S.bars.slice(0, bis + 1)) || []; } catch (e3) { ks = []; }
      ks.forEach(function (k) {
        if (!k || !k.name || k.n >= 190 && k.n <= 210) return;   // die 200er-Sicht steht schon oben
        out.push({ k: k, endI: (k.bis != null ? k.bis : bis) - off, farbe: 'var(--muted)', breite: 1,
          dash: '2 4', opac: 0.5, fuellen: false,
          name: k.name + ' (' + k.n + '): ' + (kName[k.trend] || k.trend) });
      });
    }
    return out;
  }
  /** Ueberdehnungsband um die Leitlinie, je sichtbarer Kerze.
   *  Nur fuer den Kapitulations-Modus: dort IST die Unterkante der Ausloeser
   *  (z <= -ZTHR ist genau der Kurs an der Unterkante). Beim RSI(2)-Modus loest
   *  RSI(2) aus, nicht dieses Band - dann waere es Zierrat und bleibt weg.
   *  Die Kurse kommen aus reversionSignal selbst, damit es nur eine Formel gibt. */
  function stcBandSerie(S) {
    if (S.mode !== 'kapitulation') return null;
    var out = [];
    for (var k = 0; k < S.show.length; k++) {
      var gi = S.off + k;
      if (gi < 120) { out.push(null); continue; }
      var r = null;
      try { r = Q.reversionSignal(S.bars.slice(Math.max(0, gi - 260), gi + 1), S.P.LINE, S.P.period, S.P.ZTHR); } catch (e) { r = null; }
      out.push(r && r.bandUnten ? { oben: r.bandOben, unten: r.bandUnten } : null);
    }
    return out;
  }
  /** Zustand des zuletzt geladenen Strategie-Charts. Wird gebraucht, damit ein Klick auf
   *  ein historisches Signal die Bedingungen JENER Kerze nachrechnen kann, ohne die Reihe
   *  neu zu laden. Reine Anzeige - hier wird nichts gehandelt und nichts gespeichert. */
  var stcState = null;
  /* Laufsperre gegen den Doppelklick. Die Zeile fehlte zwischenzeitlich; unter
   * 'use strict' warf runStrategieChart() dadurch bei JEDEM Klick auf "Chart laden"
   * eine ReferenceError, und der Chartbereich blieb leer. */
  var stcRunning = false;
  var STC_IV = { '60m': { min: 60, txt: '60-Minuten-Kerzen' }, '15m': { min: 15, txt: '15-Minuten-Kerzen' }, '5m': { min: 5, txt: '5-Minuten-Kerzen' } };
  /** Die Rechnung hinter dem Strategie-Chart, ohne jede Oberflaeche: Kerzen holen,
   *  Signale nachspielen, Hilfslinien bauen. Seit Issue #68 steht sie getrennt da,
   *  weil sie zwei Ansichten bedient - den grossen Chart im Reiter "Regeln" und die
   *  aufgeklappte Zeile einer offenen Position. Zwei Ansichten, EINE Rechnung: sonst
   *  zeigen sie irgendwann verschiedene Signale fuer denselben Wert, und niemand
   *  weiss, welche der beiden das Buch meint. */
  async function stcRechnen(sym, mode, iv, spanne) {
    var ivCfg = STC_IV[iv] || STC_IV['60m'];
    if (!(spanne > 0)) spanne = 320;
    /* Vorlauf: der Detektor rechnet erst ab Kerze 261 (Kanal ueber 200 + EMA100).
     * Ohne diesen Puffer waere der linke Teil des Bildes systematisch signalfrei -
     * man hielte eine Luecke der Rechnung fuer eine Aussage ueber den Markt. */
    var tiefe = Math.max(900, spanne + 320);
    var bars = null;
    // Archiv zuerst: es hat die Tiefe (>= 261 Kerzen), die der Detektor braucht - wie im Live-Scan.
    if (window.Archiv) { try { bars = await window.Archiv.serie(iv, sym); } catch (eA) { bars = null; } }
    if (!bars || bars.length < 300) {
      var fd = await fetchIntraday(sym, iv, true);
      if (fd && fd.series && (!bars || fd.series.length > bars.length)) bars = fd.series;
    }
    if (!bars || bars.length < 300) {
      return { ok: false, grund: 'Zu wenig ' + ivCfg.txt + ' für ' + sym + ' (' + (bars ? bars.length : 0) +
        ' < 300) – der Detektor rechnet erst ab 261 Kerzen wie gemessen.' };
    }
    bars = Q.fertigeBars(bars.slice(-tiefe), ivCfg.min, Date.now());
    var P = stcParams(mode);
    // Signale nachspielen: wie der Edge-Waechter, mit der Abklingzeit des Modus
    var cool = 0, marks = [], coolMin = D.intraday.cooldownMin != null ? D.intraday.cooldownMin : 120;
    for (var i = 261; i < bars.length; i++) {
      if (bars[i][0] - cool < coolMin * 60000) continue;
      var s = null;
      try { s = Q.einstiegSignal(bars, i, P); } catch (e) { }
      if (!s || s.dir !== 'call') continue;
      cool = bars[i][0];
      marks.push(i);
    }
    var show = bars.slice(-Math.min(spanne, bars.length));
    var off = bars.length - show.length;
    var closesAll = bars.map(function (b) { return b[1]; });
    var e20 = Q.emaSeries(closesAll, P.period).slice(off), e100 = Q.emaSeries(closesAll, 100).slice(off);
    var bed = stcBedingungen(bars, mode, P);
    var indSerie = [];
    if (mode === 'rsi2seit') {
      for (var k = 0; k < show.length; k++) { var gi = off + k; indSerie.push(gi >= 2 ? Q.rsi(closesAll, 2, gi) : null); }
    } else {
      for (var k2 = 0; k2 < show.length; k2++) {
        var gi2 = off + k2;
        if (gi2 < 120) { indSerie.push(null); continue; }
        var rz = Q.reversionSignal(bars.slice(Math.max(0, gi2 - 260), gi2 + 1), P.LINE, P.period, P.ZTHR);
        indSerie.push(rz && rz.z != null ? rz.z : null);
      }
    }
    var marksShow = marks.filter(function (m) { return m >= off; }).map(function (m) { return m - off; });
    var S = { bars: bars, show: show, off: off, mode: mode, P: P, marks: marks, sym: sym, iv: iv,
      e20: e20, e100: e100, kanal: bed.kanal, marksShow: marksShow, gewaehlt: null, band: null };
    S.band = stcBandSerie(S);
    return { ok: true, S: S, indSerie: indSerie, bed: bed, ivCfg: ivCfg };
  }

  async function runStrategieChart() {
    if (stcRunning) return;
    stcRunning = true;
    var sel = document.getElementById('stcSym'), modeEl = document.getElementById('stcMode'), st = document.getElementById('stcStatus');
    var btn = document.getElementById('stcBtn'), info = document.getElementById('stcInfo');
    var svg = document.getElementById('stcChart'), ind = document.getElementById('stcInd');
    var ivEl = document.getElementById('stcIv'), spEl = document.getElementById('stcSpanne'), warnEl = document.getElementById('stcIvWarn');
    if (!sel || !modeEl || !svg) { stcRunning = false; return; }
    btn.disabled = true;
    try {
      var sym = sel.value, mode = modeEl.value === 'kapitulation' ? 'kapitulation' : 'rsi2seit';
      var iv = ivEl && STC_IV[ivEl.value] ? ivEl.value : '60m';
      var ivCfg = STC_IV[iv];
      var spanne = spEl ? parseInt(spEl.value, 10) : 320;
      if (!(spanne > 0)) spanne = 320;
      // Ehrlichkeit vor Bequemlichkeit: gemessen sind beide Regeln auf 60m. Andere
      // Kerzenlaengen darf man sich ansehen, aber sie sind KEIN Beleg - genau dieser
      // stille Wechsel weg von der gemessenen Konfiguration hat hier schon einmal
      // Live und Messung auseinanderlaufen lassen.
      if (warnEl) {
        if (iv === '60m') { warnEl.style.display = 'none'; warnEl.textContent = ''; }
        else {
          warnEl.style.display = '';
          warnEl.textContent = 'Achtung: ' + ivCfg.txt + ' sind NICHT die gemessene Konfiguration. Beide Regeln wurden auf 60-Minuten-Kerzen belegt, und die grosse Signalstudie vom 23.08.2026 fand auf anderen Zeitrahmen keine tragfaehige Kante. Was hier steht, ist eine Ansicht zum Nachvollziehen der Mechanik - kein Beleg. Gehandelt wird weiterhin nur, was auf 60m gemessen ist.';
        }
      }
      st.textContent = 'Lade ' + sym + ' (' + ivCfg.txt + ') …';
      var r = await stcRechnen(sym, mode, iv, spanne);
      if (!r.ok) { st.textContent = r.grund; return; }
      var bed = r.bed;
      var bars = r.S.bars, show = r.S.show, off = r.S.off, P = r.S.P;
      var marks = r.S.marks, marksShow = r.S.marksShow, e20 = r.S.e20, e100 = r.S.e100;
      var indSerie = r.indSerie;
      st.textContent = '';
      stcState = r.S;
      /* Erst hier wird die Ausgabe sichtbar, nicht schon im Markup: Ohne Daten waere
       * das eine schwarze Flaeche mit vollstaendiger Legende - eine Beschriftung fuer
       * Linien, die es noch nicht gibt. Der Fehlerpfad oben kehrt vorher um, dann
       * bleibt der Leerzustand stehen, und das ist richtig so. */
      var leerEl = document.getElementById('stcLeer');
      var ausEl = document.getElementById('stcAusgabe');
      if (leerEl) leerEl.style.display = 'none';
      if (ausEl) ausEl.style.display = '';
      var kEl = document.getElementById('stcKontext');
      drawStrategieChart(svg, show, e20, e100, stcKanalListe(stcState, null, !!(kEl && kEl.checked)),
        marksShow, null, stcState.band);
      drawStrategieIndikator(ind, show, indSerie, mode === 'rsi2seit'
        ? { lo: 0, hi: 100, schwelle: 10, name: 'RSI(2)' }
        : { lo: -4, hi: 4, schwelle: -P.ZTHR, name: 'z-Abstand zur EMA' + P.period });
      var name = mode === 'rsi2seit' ? 'RSI(2) im Seitwärtskanal' : 'Kapitulations-Dip im Abwärtskanal';
      var tage = Math.round((bars[bars.length - 1][0] - bars[261][0]) / 86400000);
      info.innerHTML = '<b>' + U.esc(name) + '</b> auf ' + U.esc(sym) + ' · ' + bars.length + ' ' + U.esc(ivCfg.txt) + ', davon ' + show.length + ' im Bild · Einstiege laut Regel in den letzten ~' + tage + ' Tagen: <b>' + marks.length + '</b>, im Bild <b>' + marksShow.length + '</b>' +
        ' · letzte Kerze ' + U.esc(new Date(bars[bars.length - 1][0]).toLocaleString('de-DE')) +
        (bed.signal === 'call' ? ' · <b style="color:var(--up);">Regel gibt JETZT ein Long-Signal</b>' : bed.signal === 'put' ? ' · Put-Seite gemeldet – trägt nicht, wird nicht gehandelt' : ' · aktuell kein Signal');
      stcListeZeichnen();
      stcCheckZeichnen(null);
    } catch (e3) {
      st.textContent = 'Fehler: ' + (e3.message || e3);
    } finally {
      btn.disabled = false;
      stcRunning = false;
    }
  }
  /** Alle historischen Signale der geladenen Reihe als anklickbare Liste (Issue #52).
   *  Nur was der Detektor tatsaechlich gemeldet hat - keine Nachbesserung, keine Auswahl
   *  der schoenen Faelle. Der spaetere Verlauf steht bewusst dabei: Wer ein Signal prueft,
   *  will sehen, was danach passiert ist. Das ist eine Beobachtung an EINEM Wert und
   *  ersetzt keine Messung - der Beleg steht in den Studien oben. */
  function stcListeZeichnen() {
    var el = document.getElementById('stcSignale');
    if (!el) return;
    var S = stcState;
    if (!S) { el.innerHTML = ''; return; }
    if (!S.marks.length) {
      el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted);">Keine Einstiege der Regel in diesem Zeitraum. Das ist ein normales Ergebnis – beide Regeln melden sich selten, und genau deshalb sind sie ueberhaupt messbar.</div>';
      return;
    }
    // Juengstes Signal zuerst: das ist das, was man pruefen will
    var rows = S.marks.slice().reverse().map(function (mi) {
      var b = S.bars[mi];
      // Verlauf danach: Schlusskurs 6 Kerzen spaeter, sofern die Reihe so weit reicht
      var zi = Math.min(S.bars.length - 1, mi + 6);
      var d6 = zi > mi ? (S.bars[zi][1] / b[1] - 1) * 100 : null;
      var imBild = mi >= S.off;
      return '<tr class="stcRow" data-idx="' + mi + '" style="cursor:pointer;' + (S.gewaehlt === mi ? ' background:var(--grid);' : '') + '">' +
        '<td>' + U.esc(new Date(b[0]).toLocaleString('de-DE')) + '</td>' +
        '<td>' + U.nf2.format(b[1]) + ' $</td>' +
        '<td class="' + (d6 == null ? '' : U.signCls(d6)) + '">' + (d6 == null ? '–' : U.signTxt(Math.round(d6 * 100) / 100, ' %')) + '</td>' +
        '<td style="color:var(--muted);">' + (imBild ? 'im Bild' : 'vor dem Bild') + '</td>' +
        '<td style="color:var(--series2);">Bedingungen zeigen</td></tr>';
    }).join('');
    el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:4px;">' + S.marks.length + ' Einstieg(e), die die Regel hier gegeben hätte – Zeile anklicken, um die Bedingungen jener Kerze nachzurechnen:</div>' +
      '<div style="max-height:230px; overflow:auto;"><table class="tbl"><tr><th>Zeitpunkt der Signalkerze</th><th>Kurs</th><th>nach 6 Kerzen</th><th>Lage</th><th></th></tr>' + rows + '</table></div>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:4px;">Die Spalte „nach 6 Kerzen" ist reine Kursbewegung des Basiswerts – ohne Kosten, ohne Schein und ohne Ausstiegsregel. Sie zeigt den Verlauf, nicht das Ergebnis eines Trades, und ist kein Beleg.</div>';
  }
  /** Bedingungsliste - entweder fuer die letzte abgeschlossene Kerze (idx = null)
   *  oder fuer die angeklickte Signalkerze. */
  function stcCheckZeichnen(idx) {
    var check = document.getElementById('stcCheck');
    var S = stcState;
    if (!check || !S) return;
    var bed = stcBedingungen(S.bars, S.mode, S.P, idx);
    var kopf;
    if (idx == null) {
      kopf = 'Bedingungen der letzten abgeschlossenen Kerze (alle müssen gleichzeitig gelten):';
    } else {
      kopf = 'Bedingungen der Signalkerze vom ' + U.esc(new Date(S.bars[idx][0]).toLocaleString('de-DE')) +
        ' – so sah die Regel den Markt in genau diesem Moment:';
    }
    check.innerHTML = '<div style="color:var(--muted); margin-bottom:2px;">' + kopf + '</div>' +
      bed.liste.map(function (bb) {
        return '<div><span style="color:' + (bb.ok ? 'var(--up)' : 'var(--down)') + '; font-weight:600;">' + (bb.ok ? '✓' : '✗') + '</span> ' + U.esc(bb.txt) + '</div>';
      }).join('') +
      (idx == null ? '' : '<div style="margin-top:4px; color:var(--muted); font-size:var(--fs-neben);">Gesamturteil des Detektors in dieser Kerze: ' +
        (bed.signal === 'call' ? '<b style="color:var(--up);">Einstieg (Long)</b>' : bed.signal === 'put' ? 'Put-Seite – wird nicht gehandelt' : 'kein Signal') +
        '. Es kommt aus <code>einstiegSignal</code> selbst, nicht aus der Summe der Häkchen – deshalb kann ein Häkchen fehlen und das Urteil trotzdem stehen (die Regel prüft manches auf einem anderen Fenster).</div>');
  }
  /** Klick auf ein Signal: Bedingungen jener Kerze zeigen und die Markierung hervorheben.
   *  Nochmal auf dieselbe Zeile klicken schaltet zurueck auf die letzte Kerze. */
  function stcSignalWaehlen(idx) {
    var S = stcState;
    if (!S || !(idx >= 0) || idx >= S.bars.length) return;
    S.gewaehlt = S.gewaehlt === idx ? null : idx;
    var svg = document.getElementById('stcChart');
    var hl = S.gewaehlt != null && S.gewaehlt >= S.off ? S.gewaehlt - S.off : null;
    var kEl2 = document.getElementById('stcKontext');
    if (svg) drawStrategieChart(svg, S.show, S.e20, S.e100,
      stcKanalListe(S, S.gewaehlt, !!(kEl2 && kEl2.checked)), S.marksShow, hl, S.band);
    stcListeZeichnen();
    stcCheckZeichnen(S.gewaehlt);
  }
  /** hl: Index (im Bildausschnitt) des angeklickten Signals - wird groesser und in der
   *  Gegenfarbe gezeichnet, damit man die Zeile der Liste im Chart wiederfindet. */
  /** kanaele: Liste von { k, endI, farbe, dash, opac, name } - jeder Kanal wird an
   *  SEINER Endkerze verankert (endI = Index im Bildausschnitt), nicht pauschal am
   *  rechten Rand. band: Liste je Bildkerze mit { oben, unten } oder null.
   *  hl: Index des angeklickten Signals im Bildausschnitt. */
  function drawStrategieChart(svg, bars, e20, e100, kanaele, marks, hl, band) {
    var W = svg.clientWidth || 900, H = svg.clientHeight || 280;
    var padL = 8, padR = 10, padT = 10, padB = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var closes = bars.map(function (b) { return b[1]; });
    var lo = Math.min.apply(null, closes), hi = Math.max.apply(null, closes);
    var n = bars.length;
    kanaele = (kanaele || []).filter(function (z) { return z && z.k && z.endI != null; });
    /* Kanal-Geometrie an der eigenen Endkerze: mitte(i) laeuft von der Endkerze aus
     * mit der Steigung zurueck. startI darf negativ werden - dann ragt der Kanal
     * links aus dem Bild, und genau das soll man sehen. */
    kanaele.forEach(function (z) {
      z.startI = z.endI - (z.k.n - 1);
      z.mitteBei = function (i) { return z.k.mitteJetzt - z.k.steigung * (z.endI - i); };
      z.obenAb = z.k.oben - z.k.mitteJetzt;
      z.untenAb = z.k.unten - z.k.mitteJetzt;
      var s = Math.max(0, Math.min(n - 1, z.startI)), e = Math.max(0, Math.min(n - 1, z.endI));
      [s, e].forEach(function (i) {
        lo = Math.min(lo, z.mitteBei(i) + z.untenAb);
        hi = Math.max(hi, z.mitteBei(i) + z.obenAb);
      });
    });
    if (band) for (var bi = 0; bi < n; bi++) {
      if (!band[bi]) continue;
      lo = Math.min(lo, band[bi].unten); hi = Math.max(hi, band[bi].oben);
    }
    var pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / Math.max(1, n - 1);
    function X(i) { return padL + i * step; }
    function Y(v) { return H - padB - (v - lo) / (hi - lo) * plotH; }
    var html = '';
    niceTicks(lo, hi, 4).forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + 2) + '" y="' + (Y(tv) - 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, hi - lo) + '</text>';
    });
    var x0 = bars[0][0], x1 = bars[n - 1][0];
    for (var xi = 0; xi <= 3; xi++) {
      var ti = Math.round((n - 1) * xi / 3);
      html += '<text x="' + X(ti).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle') + '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(bars[ti][0], x1 - x0) + '</text>';
    }
    /* Ueberdehnungsband um die Leitlinie: fuer den Kapitulations-Modus IST das der
     * Ausloeser - unterhalb der Unterkante steht z <= -ZTHR. Deshalb gehoert es ins
     * Bild und nicht nur in den Indikator darunter. */
    if (band) {
      var dO = '', dU = '';
      for (var q = 0; q < n; q++) {
        if (!band[q]) continue;
        dO += (dO ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(band[q].oben).toFixed(1);
        dU += (dU ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(band[q].unten).toFixed(1);
      }
      if (dO && dU) {
        html += '<path d="' + dU + '" fill="none" stroke="var(--series2)" stroke-width="1" stroke-dasharray="2 3" opacity="0.75"></path>';
        html += '<path d="' + dO + '" fill="none" stroke="var(--series2)" stroke-width="1" stroke-dasharray="2 3" opacity="0.35"></path>';
      }
    }
    kanaele.forEach(function (z) {
      var s = Math.max(0, z.startI), e = Math.min(n - 1, z.endI);
      if (e <= s) return;
      var yO = function (i) { return Y(z.mitteBei(i) + z.obenAb); };
      var yU = function (i) { return Y(z.mitteBei(i) + z.untenAb); };
      var opac = z.opac == null ? 0.85 : z.opac;
      if (z.fuellen !== false) {
        html += '<path d="M' + X(s).toFixed(1) + ' ' + yO(s).toFixed(1) + ' L' + X(e).toFixed(1) + ' ' + yO(e).toFixed(1) +
          ' L' + X(e).toFixed(1) + ' ' + yU(e).toFixed(1) + ' L' + X(s).toFixed(1) + ' ' + yU(s).toFixed(1) + ' Z" fill="' + z.farbe + '" opacity="0.10"></path>';
      }
      [yO, yU].forEach(function (yf) {
        html += '<line x1="' + X(s).toFixed(1) + '" y1="' + yf(s).toFixed(1) + '" x2="' + X(e).toFixed(1) + '" y2="' + yf(e).toFixed(1) +
          '" stroke="' + z.farbe + '" stroke-width="' + (z.breite || 1.5) + '"' + (z.dash ? ' stroke-dasharray="' + z.dash + '"' : '') + ' opacity="' + opac + '"></line>';
      });
      // Senkrechte an der Endkerze: sie zeigt, WELCHE Kerze diesen Kanal bestimmt hat.
      html += '<line x1="' + X(e).toFixed(1) + '" y1="' + yO(e).toFixed(1) + '" x2="' + X(e).toFixed(1) + '" y2="' + yU(e).toFixed(1) +
        '" stroke="' + z.farbe + '" stroke-width="1" opacity="' + (opac * 0.6) + '"></line>';
      if (z.name) {
        var ym = (yO(e) + yU(e)) / 2;
        html += '<text x="' + Math.min(W - padR - 2, X(e) - 3).toFixed(1) + '" y="' + ym.toFixed(1) + '" text-anchor="end" fill="' + z.farbe +
          '" font-size="9.5" opacity="' + Math.min(1, opac + 0.15) + '">' + U.esc(z.name) + '</text>';
      }
    });
    var linie = function (arr, farbe, dash) {
      var d = '';
      for (var i = 0; i < n; i++) { if (arr[i] == null) continue; d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(arr[i]).toFixed(1); }
      return d ? '<path d="' + d + '" fill="none" stroke="' + farbe + '" stroke-width="1.3" stroke-dasharray="' + dash + '"></path>' : '';
    };
    html += linie(e100, 'var(--series4)', '2 3') + linie(e20, 'var(--series2)', '5 4');
    html += '<path d="' + bars.map(function (b, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(b[1]).toFixed(1); }).join(' ') +
      '" fill="none" stroke="var(--series)" stroke-width="1.8" stroke-linejoin="round"></path>';
    marks.forEach(function (i) {
      var aktiv = hl != null && hl === i;
      // data-mark traegt den Index im Bildausschnitt; der Klick-Handler rechnet ihn
      // mit dem Versatz der Reihe in den echten Kerzenindex um.
      html += '<circle class="stcMark" data-mark="' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(bars[i][1]).toFixed(1) + '" r="' + (aktiv ? 8 : 5) +
        '" fill="' + (aktiv ? 'var(--series2)' : 'var(--up)') + '" stroke="var(--surface)" stroke-width="2" style="cursor:pointer;"></circle>';
    });
    svg.innerHTML = html;
    svg.__chart = null;
  }
  function drawStrategieIndikator(svg, bars, serie, o) {
    if (!svg) return;
    var W = svg.clientWidth || 900, H = svg.clientHeight || 110;
    var padL = 8, padR = 10, padT = 6, padB = 6;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var n = bars.length, plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / Math.max(1, n - 1);
    function X(i) { return padL + i * step; }
    function Y(v) { return H - padB - (Math.max(o.lo, Math.min(o.hi, v)) - o.lo) / (o.hi - o.lo) * plotH; }
    var html = '<rect x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="var(--grid)" opacity="0.25"></rect>';
    // Schwellenzone: unterhalb (RSI <= 10 bzw. z <= -ZTHR) ist der Ausloeser scharf
    html += '<rect x="' + padL + '" y="' + Y(o.schwelle).toFixed(1) + '" width="' + plotW + '" height="' + (H - padB - Y(o.schwelle)).toFixed(1) + '" fill="var(--up)" opacity="0.12"></rect>';
    html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(o.schwelle).toFixed(1) + '" y2="' + Y(o.schwelle).toFixed(1) + '" stroke="var(--up)" stroke-width="1" stroke-dasharray="3 3"></line>';
    html += '<text x="' + (padL + 2) + '" y="' + (padT + 10) + '" fill="var(--muted)" font-size="9.5">' + U.esc(o.name) + ' · Schwelle ' + o.schwelle + '</text>';
    var d = '';
    for (var i = 0; i < n; i++) { if (serie[i] == null) continue; d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(serie[i]).toFixed(1); }
    if (d) html += '<path d="' + d + '" fill="none" stroke="var(--series2)" stroke-width="1.3"></path>';
    svg.innerHTML = html;
  }


  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (siehe Kopfkommentar). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  /** Von depot.js init() gerufen. Verkabelt die Bedienelemente des Chart-Bereichs
   *  (Issue #51/#52) - die benannten Regeln daneben (Issue #36) bleiben in depot.js,
   *  sie sind Messinstrument, kein Chart. */
  function verkabeln(deps) {
    universe = deps.universe;
    fetchIntraday = deps.fetchIntraday;
    zOf = deps.zOf;
    holeDepot = deps.depot;
    var sb = document.getElementById('stcBtn'), ss = document.getElementById('stcSym');
    if (sb && ss) {
      universe().forEach(function (s2) { var o = document.createElement('option'); o.value = s2; o.textContent = s2; ss.appendChild(o); });
      sb.addEventListener('click', mitFrischemD(runStrategieChart));
      var kb = document.getElementById('stcKontext');
      // Neu zeichnen genuegt - die Reihe liegt schon im Zustand, ein Neuladen waere
      // ein Netzabruf fuer eine reine Anzeigefrage.
      if (kb) kb.addEventListener('change', function () {
        var S = stcState;
        if (!S) return;
        var svg = document.getElementById('stcChart');
        var hl = S.gewaehlt != null && S.gewaehlt >= S.off ? S.gewaehlt - S.off : null;
        if (svg) drawStrategieChart(svg, S.show, S.e20, S.e100,
          stcKanalListe(S, S.gewaehlt, kb.checked), S.marksShow, hl, S.band);
      });
    }
    // Signale anklickbar (Issue #52): in der Liste und direkt im Chart. Delegiert,
    // weil beide Inhalte bei jedem Lauf neu gezeichnet werden.
    var sl = document.getElementById('stcSignale');
    if (sl) sl.addEventListener('click', function (ev) {
      var tr = ev.target && ev.target.closest ? ev.target.closest('tr.stcRow') : null;
      if (tr) stcSignalWaehlen(parseInt(tr.getAttribute('data-idx'), 10));
    });
    var sc2 = document.getElementById('stcChart');
    if (sc2) sc2.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute || !t.getAttribute('data-mark')) return;
      if (!stcState) return;
      stcSignalWaehlen(stcState.off + parseInt(t.getAttribute('data-mark'), 10));
    });
  }

  window.StrategieChart = {
    verkabeln: verkabeln,
    rechnen: mitFrischemD(stcRechnen),
    zeichnen: drawStrategieChart,
    kanalListe: stcKanalListe,
    IV: STC_IV
  };
})();
