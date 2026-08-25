'use strict';
/* ================= Mittelfrist-Depot: Verdrahtung =================
 *
 * Führt die zwei Mittelfrist-Strategien als echte (virtuelle) Bücher:
 *   MOMENTUM   stärkstes Zehntel, Rebalancing alle 63 Handelstage, 20 Bp je Seite
 *   DRIFT      Ergebnis-Drift, 60 Handelstage je Position, long UND short, 10 Bp
 *
 * ACHTUNG, Stand 25.08.2026: Hier stand "die zwei BELEGTEN Mittelfrist-Strategien".
 * Das stimmt nicht mehr und stimmte seit dem 24.08. nicht. Momentum ist an B10
 * gestorben (Newey-West ueber 63 ueberlappende Kerzen: t 4,74 -> 0,74, Urteil "nicht
 * entscheidbar, alle vier Varianten", siehe studien/messmaschine/ERGEBNIS-2026-08-24-
 * momentum.md). Die Ergebnis-Drift weist strategien.js selbst als "im zurueckgehaltenen
 * Zeitraum t = 1,7-2,0: nicht entscheidbar" aus.
 * Beide sind NICHT WIDERLEGT, aber UNBELEGT. Die Buecher laufen weiter - sie sind
 * Simulation und sammeln Vorwaertsdaten; nur ist das kein Beleg, und dieser Kommentar
 * darf nicht wieder einen behaupten (Regel D2: der Beleg steht im Protokoll, nie im Code).
 *
 * Die Schalter im Strategien-Tab (D.momentumAn / D.driftAn) bekommen hiermit erstmals
 * Wirkung: An heißt, das Buch handelt selbsttätig. Aus heißt, es wird nur gerechnet
 * und erinnert („Rebalancing fällig“), gehandelt wird nichts.
 *
 * Die Logik steht in mfhandel.js (rein, in Node getestet) — hier nur Laden, Takt,
 * Anzeige. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
(function () {
  var U = window.U;
  var LAEUFT = false;
  /* Gleiches Startkapital wie das Intraday-Depot (depot.js, START_CAPITAL).
   * Zwei verschiedene Startkapitalien in einer Anwendung waeren genau die Art
   * Doppelzahl, die hier schon mehrfach zu falschen Prozentangaben gefuehrt hat. */
  var START_KAPITAL = 100000;

  function D() { return window.__D ? window.__D() : null; }
  function speichern() { if (window.__save) window.__save(); }
  function el(id) { return document.getElementById(id); }

  /* ---------------- Daten ---------------- */
  async function ladeKurse() {
    // Liest ueber den Teile-Speicher des Mittelfrist-Tabs (ein Lader, eine Wahrheit)
    var g = window.MF && window.MF.tagesdatenLesen ? await window.MF.tagesdatenLesen() : await window.api.storeGet('mf_tagesdaten');
    if (!g || !g.roh) return null;
    var preise = {}, juengster = 0;
    Object.keys(g.roh).forEach(function (s) {
      var r = g.roh[s];
      if (r && r.length) { preise[s] = r[r.length - 1][1]; if (r[r.length - 1][0] > juengster) juengster = r[r.length - 1][0]; }
    });
    return { roh: g.roh, preise: preise, stand: g.at || 0, juengster: juengster };
  }
  async function ladeMarkt() {
    var c = await window.api.storeGet('drift_markt');
    return c && c.reihe ? c.reihe : null;
  }

  /* Kurse frisch halten: älter als 26 Stunden -> den Lader des Mittelfrist-Tabs
   * anstoßen. Ohne das markiert das Depot auf eingefrorenen Kursen - und ein
   * eingefrorener Wert sieht im fallenden Markt fälschlich stabil aus. */
  var ladeAngestossen = 0;
  function kurseFrischHalten(stand) {
    if (Date.now() - stand < 26 * 3600000) return;
    if (Date.now() - ladeAngestossen < 3600000) return;    // höchstens einmal je Stunde anstoßen
    ladeAngestossen = Date.now();
    if (window.MF && window.MF.ladeUniversum) window.MF.ladeUniversum();
  }

  /* ---------------- Bücher ---------------- */
  function buchInit(name) {
    return { name: name, start: START_KAPITAL, cash: START_KAPITAL, positionen: [], trades: [],
      angelegt: Date.now(), letztesRebalanceT: 0 };
  }

  async function takt(manuell) {
    if (LAEUFT) return;
    var d = D();
    if (!d) return;
    LAEUFT = true;
    try {
      var daten = await ladeKurse();
      var markt = await ladeMarkt();
      if (!daten || !markt) {
        /* Erststart-Luecke aus der ersten externen Diagnose (mfBuchWert: null): Frische
         * Installationen haben keine Tagesdaten, und der Erstladevorgang von 193 Werten
         * wartete auf einen Knopfdruck, von dem niemand wusste. Jetzt stoesst er sich
         * selbst an - hoechstens einmal je Stunde, mit sichtbarem Status. */
        if (window.MF && window.MF.ladeUniversum && Date.now() - ladeAngestossen > 3600000) {
          ladeAngestossen = Date.now();
          zeige(null, null, null, 'Erster Start: Tageskurse für 193 Werte werden geladen (einmalig, ein paar Minuten) …');
          try { await window.MF.ladeUniversum(); } catch (eL) { }
          daten = await ladeKurse();
          markt = markt || await ladeMarkt();
        }
        /* Der Verweis zeigte auf die Pille, auf der dieser Text selbst steht. Genannt
           wird deshalb der Knopf, der die Daten wirklich holt - wörtlich so, wie er
           beschriftet ist (#mfLadenBtn, gleiches Pillen-Panel, weiter oben). */
        if (!daten || !markt) { zeige(null, null, null, 'Keine Tagesdaten – erst oben „Daten holen und rechnen“.'); return; }
      }
      kurseFrischHalten(daten.stand);
      var MH = window.MFHandel, Dr = window.Drift;
      var now = Date.now();

      /* ---- Momentum-Buch ---- */
      if (!d.mfBuch) d.mfBuch = buchInit('momentum');
      var faellig = MH.rebalanceFaellig(markt, d.mfBuch.letztesRebalanceT, 63);
      var ziel = MH.momentumZiel(daten.roh, { nowMs: daten.juengster || now });
      var plan = ziel.zuWenig ? null : MH.planeUmschichtung(ziel.ziel, d.mfBuch, daten.preise);
      if (plan && (faellig || manuell === 'momentum')) {
        if (d.momentumAn || manuell === 'momentum') {
          var nM = MH.fuehreAus(d.mfBuch, plan, now, 20);
          d.mfBuch.letztesRebalanceT = now;
          if (!d.tuneLog) d.tuneLog = [];
          d.tuneLog.unshift({ id: 'mfrebal-' + now, at: now, quelle: manuell === 'momentum' ? 'hand' : 'automatik',
            applied: ['Momentum-Rebalancing: ' + nM + ' Orders'],
            txt: 'Momentum-Depot umgeschichtet: ' + plan.verkaufen.length + ' Verkäufe, ' + plan.kaufen.length +
              ' Käufe auf das stärkste Zehntel (' + ziel.ziel.length + ' Werte). Kosten 20 Bp je Seite.' +
              (ziel.uebersprungen.length ? ' Ohne frische Kurse übersprungen: ' + ziel.uebersprungen.slice(0, 6).join(', ') + (ziel.uebersprungen.length > 6 ? ' …' : '') : '') +
              (plan.fehltKurs.length ? ' Ohne Kurs nicht handelbar: ' + plan.fehltKurs.slice(0, 6).join(', ') + (plan.fehltKurs.length > 6 ? ' …' : '') : '') });
          speichern();
          plan = MH.planeUmschichtung(ziel.ziel, d.mfBuch, daten.preise);   // frisch für die Anzeige
          faellig = false;
        }
      }

      /* ---- Drift-Buch ---- */
      var driftInfo = null;
      var termine = await window.api.storeGet('drift_termine');
      if (termine && termine.sym) {
        var kurseD = {}, termD = {};
        Object.keys(daten.roh).forEach(function (s) {
          if (termine.sym[s] && termine.sym[s].length) { kurseD[s] = daten.roh[s]; termD[s] = termine.sym[s]; }
        });
        if (Object.keys(termD).length >= 20) {
          if (!d.driftBuch) d.driftBuch = buchInit('drift');
          var heute = Dr.heute(kurseD, termD, markt);
          var getanD;
          if (d.driftAn || manuell === 'drift') {
            getanD = MH.driftAbgleich(d.driftBuch, heute, daten.preise, now, {});
            if (getanD.geschlossen || getanD.eroeffnet || getanD.verworfen.length) {
              if (!d.tuneLog) d.tuneLog = [];
              d.tuneLog.unshift({ id: 'driftab-' + now, at: now, quelle: manuell === 'drift' ? 'hand' : 'automatik',
                applied: ['Drift-Abgleich: ' + getanD.eroeffnet + ' eröffnet, ' + getanD.geschlossen + ' geschlossen' +
                  (getanD.verworfen.length ? ', ' + getanD.verworfen.length + ' verworfen' : '')],
                txt: 'Ergebnis-Drift-Depot abgeglichen. Neue Signale nur, wenn jünger als 5 Handelstage – ' +
                  'ein 40 Tage altes Signal hat den Großteil seiner Wirkung hinter sich.' +
                  (getanD.verworfen.length ? ' Erkannt, aber nicht gehandelt: ' + verworfenKurz(getanD.verworfen) : '') });
              speichern();
            }
          } else {
            // Automatik aus: trotzdem erheben, was das Buch täte. Der Prüf-Modus rechnet
            // auf einer Kopie und fasst das echte Buch nicht an.
            getanD = MH.driftAbgleich(d.driftBuch, heute, daten.preise, now, { nurPruefen: true });
          }
          driftInfo = { heute: heute, werte: Object.keys(termD).length, verworfen: getanD.verworfen };
        }
      }

      /* ---- Verlauf für den Vergleich mit dem Markt ---- */
      var spy = markt.length ? markt[markt.length - 1][1] : null;
      var bwM = MH.bewerte(d.mfBuch, daten.preise);
      var bwD = d.driftBuch ? MH.bewerteDrift(d.driftBuch, daten.preise) : null;
      if (!d.mfVerlauf) d.mfVerlauf = [];
      var heute10 = new Date(now).toISOString().slice(0, 10);
      if (!d.mfVerlauf.length || new Date(d.mfVerlauf[d.mfVerlauf.length - 1].t).toISOString().slice(0, 10) !== heute10) {
        /* Startkapital MITSCHREIBEN, nicht spaeter erraten: Das Cockpit rechnete den
         * Prozentstand frueher gegen eine fest verdrahtete 10000 und zeigte fuer ein
         * unberuehrtes Buch +900 %. Steht der Bezugswert im Punkt selbst, bleibt auch
         * ein alter Verlauf nach einer spaeteren Kapitalaenderung richtig lesbar. */
        d.mfVerlauf.push({ t: now, momentum: bwM.wert, drift: bwD ? bwD.wert : null, spy: spy,
          startM: d.mfBuch ? d.mfBuch.start : START_KAPITAL,
          startD: d.driftBuch ? d.driftBuch.start : null });
        if (d.mfVerlauf.length > 750) d.mfVerlauf = d.mfVerlauf.slice(-750);
        speichern();
      }

      zeige({ ziel: ziel, plan: plan, faellig: faellig, bewertung: bwM }, driftInfo && d.driftBuch
        ? { info: driftInfo, bewertung: bwD } : null, daten, null);
    } catch (e) {
      zeige(null, null, null, 'Fehler: ' + (e.message || e));
    } finally { LAEUFT = false; }
  }

  /* ---------------- Anzeige ---------------- */

  /** Kurzfassung der verworfenen Signale für den Protokoll-Eintrag: nach Grund
   *  gebündelt, damit aus 30 Einzelzeilen ein lesbarer Satz wird. */
  function verworfenKurz(liste) {
    var nachGrund = {}, reihenfolge = [];
    liste.forEach(function (v) {
      // Zahlen aus dem Grund nehmen, sonst zählt jedes Signalalter als eigener Grund
      var g = String(v.grund).replace(/\d+/g, 'n');
      if (nachGrund[g] == null) { nachGrund[g] = 0; reihenfolge.push(g); }
      nachGrund[g]++;
    });
    return reihenfolge.map(function (g) { return nachGrund[g] + '× ' + g; }).join('; ') + '.';
  }

  /** „Erkannt, aber nicht gehandelt“ – jedes Signal, das das Modell sah und das Buch
   *  NICHT nahm, mit Grund. Vorher verschwanden diese Fälle spurlos: Im Fenster stand
   *  „Signale offen laut Modell: 12“ neben drei Positionen, und nirgends war
   *  nachvollziehbar, woran die neun anderen scheiterten. Reine Anzeige – sie ändert
   *  nichts am Handel. */
  function verworfenTabelle(liste, titel, mitRichtung) {
    if (!liste || !liste.length) return '';
    var zeigen = liste.slice(0, 40);
    return '<details class="how" style="margin-top:8px;"><summary>' + U.esc(titel) + ' (' + liste.length + ')</summary>' +
      '<table class="tbl"><thead><tr><th>Wert</th>' + (mitRichtung ? '<th>Richtung</th>' : '') +
      '<th>Grund</th></tr></thead><tbody>' +
      zeigen.map(function (v) {
        return '<tr><td>' + U.esc(v.sym) + '</td>' +
          (mitRichtung ? '<td>' + (v.richtung == null ? '–' : (v.richtung > 0 ? '▲ long' : '▼ short')) + '</td>' : '') +
          '<td>' + U.esc(v.grund) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (liste.length > zeigen.length ? '<div class="hinweis">… und ' + (liste.length - zeigen.length) + ' weitere.</div>' : '') +
      '</details>';
  }

  function posTabelle(buch, preise, mitRichtung) {
    if (!buch.positionen.length) return '<div class="empty" style="padding:6px 0;">Keine Positionen.</div>';
    return '<table class="tbl"><thead><tr><th>Wert</th>' + (mitRichtung ? '<th>Richtung</th>' : '') +
      '<th style="text-align:right;">Stück</th><th style="text-align:right;">Einstand</th>' +
      '<th style="text-align:right;">Kurs</th><th style="text-align:right;">±</th></tr></thead><tbody>' +
      buch.positionen.map(function (p) {
        var k = preise[p.sym];
        var pnlPct = k > 0 ? ((p.richtung != null && p.richtung < 0 ? (2 * p.einstand - k) : k) / p.einstand - 1) * 100 : null;
        return '<tr><td>' + U.esc(p.sym) + '</td>' +
          (mitRichtung ? '<td>' + (p.richtung > 0 ? '▲ long' : '▼ short') + '</td>' : '') +
          '<td style="text-align:right;">' + p.stueck + '</td>' +
          '<td style="text-align:right;">' + U.nf2.format(p.einstand) + '</td>' +
          '<td style="text-align:right;">' + (k > 0 ? U.nf2.format(k) : '–') + '</td>' +
          '<td style="text-align:right;" class="' + (pnlPct >= 0 ? 'pos' : 'neg') + '">' +
          (pnlPct == null ? '–' : U.signTxt(Math.round(pnlPct * 10) / 10, ' %')) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function zeige(mom, drift, daten, fehler) {
    /* Ein Fehler ist hier kein Zwischenstand: er ersetzt die Kursangabe und beendet die
     * Anzeige. Deshalb 'fehler' als Zustand - die Zeile wird eingefaerbt und faellt
     * beim naechsten erfolgreichen Durchlauf von selbst wieder auf ihre Grundfarbe.
     * #mfdStatus traegt class="hinweis"; der Inline-Stil ist leer, die Hilfe merkt sich
     * genau dieses '' und stellt es wieder her - die Klassenfarbe bleibt also. */
    if (fehler) { U.statuszeile('mfdStatus', fehler, 'fehler'); return; }
    var d = D();
    if (daten) {
      U.statuszeile('mfdStatus', 'Kurse vom ' + new Date(daten.juengster).toLocaleDateString('de-DE') +
        (Date.now() - daten.stand > 26 * 3600000 ? ' – veraltet, Nachladen angestoßen' : '') + '.');
    }
    var eM = el('mfdMomentum');
    if (eM && mom) {
      var b = d.mfBuch, bw = mom.bewertung;
      var pnl = bw.wert - b.start;
      /* cls statt sign: das Buch zeigt ein Ergebnis von genau 0 $ gruen. U.signCls
       * saehe es neutral. Welche der beiden Anzeigen richtig ist, entscheidet nicht
       * diese Aufraeumarbeit - der Ausdruck bleibt deshalb, wie er war. */
      var pnlCls = pnl >= 0 ? 'pos' : 'neg';
      var html = '<div class="depot-stats">' +
        U.kachel('Depotwert', U.money(bw.wert), { cls: pnlCls, fs: 'var(--fs-zahl)' }) +
        U.kachel('Ergebnis', U.signTxt(Math.round(pnl * 100) / 100, ' $'), { cls: pnlCls, fs: 'var(--fs-zahl)' }) +
        U.kachel('Positionen', b.positionen.length, { fs: 'var(--fs-zahl)' }) +
        U.kachel('Status', d.momentumAn ? 'handelt selbst' : 'nur rechnen', { fs: 'var(--fs-gross)' }) +
        '</div>';
      if (mom.faellig && mom.plan) {
        html += '<div style="font-size:var(--fs-text); margin:8px 0; padding:8px 10px; border-left:3px solid var(--warn);">' +
          '<b>Rebalancing fällig.</b> ' + (d.momentumAn ? 'Wird beim nächsten Takt ausgeführt.' :
          'Automatik ist aus – Handlungsliste: ' +
          (mom.plan.verkaufen.length ? 'verkaufen ' + mom.plan.verkaufen.map(function (o) { return o.sym; }).join(', ') + '; ' : '') +
          (mom.plan.kaufen.length ? 'kaufen ' + mom.plan.kaufen.map(function (o) { return o.sym; }).join(', ') : '')) + '</div>';
      }
      html += posTabelle(b, daten.preise, false);
      if (bw.ohneKurs.length) html += '<div class="hinweis">Ohne frischen Kurs (zum Einstand bewertet): ' + bw.ohneKurs.join(', ') + '</div>';
      // Erkannt, aber nicht ins Depot genommen: Rangfolge-Ausschlüsse und Ziele ohne Kurs
      var vM = (mom.ziel.verworfen || []).slice();
      ((mom.plan && mom.plan.fehltKurs) || []).forEach(function (sy) {
        vM.push({ sym: sy, grund: 'im Ziel, aber ohne frischen Kurs – nicht handelbar' });
      });
      html += verworfenTabelle(vM, 'Erkannt, aber nicht ins Depot genommen', false);
      eM.innerHTML = html;
    }
    var eD = el('mfdDrift');
    if (eD) {
      if (!drift) {
        eD.innerHTML = '<div class="empty" style="padding:6px 0;">Zu wenige Werte mit Ergebnisterminen – der Hintergrund-Abruf füllt das Archiv laufend auf.</div>';
      } else {
        var bD = d.driftBuch, bwD = drift.bewertung;
        var pnlD = bwD.wert - bD.start;
        var pnlDCls = pnlD >= 0 ? 'pos' : 'neg';
        eD.innerHTML = '<div class="depot-stats">' +
          U.kachel('Depotwert', U.money(bwD.wert), { cls: pnlDCls, fs: 'var(--fs-zahl)' }) +
          U.kachel('Ergebnis', U.signTxt(Math.round(pnlD * 100) / 100, ' $'), { cls: pnlDCls, fs: 'var(--fs-zahl)' }) +
          U.kachel('Positionen', bD.positionen.length, { fs: 'var(--fs-zahl)' }) +
          U.kachel('Signale offen laut Modell', drift.info.heute.offen.length, { fs: 'var(--fs-zahl)' }) +
          U.kachel('Status', d.driftAn ? 'handelt selbst' : 'nur rechnen', { fs: 'var(--fs-gross)' }) +
          '</div>' +
          posTabelle(bD, daten.preise, true) +
          verworfenTabelle(drift.info.verworfen, 'Erkannt, aber nicht gehandelt', true);
      }
    }
  }

  function bereit() {
    var b1 = el('mfdRebalanceBtn'), b2 = el('mfdDriftBtn'), b3 = el('mfdTaktBtn');
    /* Beide Knoepfe buchen auch dann echte Orders, wenn das Buch abgeschaltet ist -
     * takt() laesst 'manuell' den Schalter ausdruecklich uebersteuern. Die Karte
     * daneben zeigt in diesem Zustand aber "nur rechnen". Wer dort auf "jetzt
     * umschichten" drueckt, erwartet eine Vorschau und bekommt einen Handel. Also
     * einmal nachfragen - und nur dann, sonst waere es eine Klickbremse ohne Zweck. */
    function abgeschaltetOk(an, was) {
      var d = D();
      if (!d || d[an]) return true;
      return window.confirm(was + ' ist gerade abgeschaltet („nur rechnen“).\n\n' +
        'Der Knopf bucht trotzdem echte Orders im virtuellen Buch. Fortfahren?');
    }
    if (b1) b1.addEventListener('click', function () { if (abgeschaltetOk('momentumAn', 'Das Momentum-Buch')) takt('momentum'); });
    if (b2) b2.addEventListener('click', function () { if (abgeschaltetOk('driftAn', 'Das Drift-Buch')) takt('drift'); });
    if (b3) b3.addEventListener('click', function () { takt(); });
    setTimeout(function () { takt(); }, 12000);
    setInterval(function () { takt(); }, 30 * 60000);

    /* Drift-Termine im Hintergrund frisch halten (Punkt 3 der Liste): alle 6 Stunden
     * ein rollierender Block über den Kalender-Abruf des Drift-Tabs. Ohne das bleibt
     * „Was wäre heute offen?“ für immer leer, weil Yahoos tiefer Kalender der
     * Gegenwart um ein Jahr hinterherhinkt. */
    setInterval(function () {
      if (window.DriftUI && window.DriftUI.hintergrund) window.DriftUI.hintergrund();
    }, 6 * 3600000);
    setTimeout(function () {
      if (window.DriftUI && window.DriftUI.hintergrund) window.DriftUI.hintergrund();
    }, 90000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.MFDepot = { takt: takt };
})();
