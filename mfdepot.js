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
    var b = { name: name, start: START_KAPITAL, cash: START_KAPITAL, positionen: [], trades: [],
      angelegt: Date.now(), letztesRebalanceT: 0 };
    /* Ein NEUES Momentum-Buch startet gleich mit der gemessenen Konfiguration - eine
     * "Umstellung" gibt es nur fuer Buecher, die schon vorher liefen. */
    if (name === 'momentum' && window.MFHandel && window.MFHandel.buchKonfig) {
      b.konfig = window.MFHandel.buchKonfig(); b.konfigSeit = b.angelegt; b.liquideSeit = null; b.korbVerlauf = [];
    }
    return b;
  }

  /* ---- Buch = Messung (Wilhelms Entscheid 02.09.2026) ----
   * Die Konfiguration des Momentum-Buchs kommt aus momentum.js + liquide.js
   * (MFHandel.buchKonfig). Das Buch merkt sich, womit es rechnet; weicht die gemerkte
   * Konfiguration von der gelesenen ab - beim ersten Takt nach dem Update fehlt sie
   * ganz -, ist das eine HANDLUNG und bekommt eine Journalzeile mit alter und neuer
   * Konfiguration. Gehandelt wird dabei NICHTS: die neue Regel greift bei der naechsten
   * regulaeren Umschichtung; Positionen ausserhalb des liquiden Korbs werden dort
   * verkauft, nicht sofort. */
  var KONFIG_FELDER = ['rueckblick', 'luecke', 'halten', 'anteil', 'mindestWerte', 'umsatzMin', 'umsatzFenster'];
  function konfigGleich(a, b) {
    if (!a || !b) return false;
    return KONFIG_FELDER.every(function (k) { return a[k] === b[k]; });
  }
  function konfigText(k) {
    return 'Rückblick ' + k.rueckblick + ', Lücke ' + k.luecke + ', Halten ' + k.halten + ' Handelstage, stärkste ' +
      Math.round(k.anteil * 100) + ' %, mindestens ' + k.mindestWerte + ' zulässige Werte, Korb nur Median-Tagesumsatz ≥ ' +
      Math.round(k.umsatzMin / 1e6) + ' Mio $ (Schluss × Stück über ' + k.umsatzFenster + ' Balken bis zum Stichtag, Punkt-in-Zeit, vor der Rangbildung)';
  }
  function umstellungPruefen(d, KONFIG, now) {
    if (konfigGleich(d.mfBuch.konfig, KONFIG)) return false;
    var altTxt = d.mfBuch.konfig ? konfigText(d.mfBuch.konfig)
      : 'Rückblick 231, Lücke 21, Halten 63 Handelstage, stärkste 10 %, mindestens 25 Werte, KEIN Umsatzfilter (breiter Korb, alle geladenen Werte)';
    if (!d.tuneLog) d.tuneLog = [];
    d.tuneLog.unshift({ id: 'mfkonfig-' + now, at: now, quelle: 'umstellung',
      applied: ['Momentum-Buch: Konfiguration → gemessene liquide Fassung (Studie 02.09.2026)'],
      txt: 'Alt: ' + altTxt + '. Neu: ' + konfigText(KONFIG) + '. Greift bei der nächsten regulären Umschichtung; ' +
        'Positionen außerhalb des liquiden Korbs werden dort verkauft, nicht sofort. Ab der ersten Umschichtung auf dem ' +
        'liquiden Korb ist jede weitere ein Out-of-Sample-Beleg. Simulation mit virtuellem Kapital, keine Anlageberatung.' });
    d.mfBuch.konfig = KONFIG;
    d.mfBuch.konfigSeit = now;
    d.mfBuch.liquideSeit = null;
    d.mfBuch.korbVerlauf = [];
    return true;
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
      var KONFIG = MH.buchKonfig();
      if (umstellungPruefen(d, KONFIG, now)) speichern();
      var faellig = MH.rebalanceFaellig(markt, d.mfBuch.letztesRebalanceT, KONFIG.halten);
      var ziel = MH.momentumZiel(daten.roh, { nowMs: daten.juengster || now });
      /* Gespeicherte Tagesdaten ohne Stueckzahlen (Bestand von vor dem Korbfilter): der
       * Lader des Mittelfrist-Tabs erkennt das und laedt neu - er muss nur angestossen
       * werden, hoechstens einmal je Stunde. Bis dahin bildet das Buch keinen Korb. */
      if (ziel.korb && ziel.korb.ohneUmsatz > 0 && ziel.korb.ohneUmsatz * 2 >= ziel.korb.geprueft &&
          window.MF && window.MF.ladeUniversum && Date.now() - ladeAngestossen > 3600000) {
        ladeAngestossen = Date.now();
        window.MF.ladeUniversum();
      }
      var plan = ziel.zuWenig ? null : MH.planeUmschichtung(ziel.ziel, d.mfBuch, daten.preise);
      if (plan && (faellig || manuell === 'momentum')) {
        if (d.momentumAn || manuell === 'momentum') {
          var nM = MH.fuehreAus(d.mfBuch, plan, now, 20);
          d.mfBuch.letztesRebalanceT = now;
          /* Erste Umschichtung auf dem liquiden Korb = Beginn des Vorwaertstests; die
           * Korbgroesse je Umschichtung weist die Drift der nominalen Schwelle
           * NACHRICHTLICH aus (wiki/fehlerformen.md) - behoben wird sie nicht. */
          if (!d.mfBuch.liquideSeit) d.mfBuch.liquideSeit = now;
          if (!d.mfBuch.korbVerlauf) d.mfBuch.korbVerlauf = [];
          d.mfBuch.korbVerlauf.push({ t: now, zulaessig: ziel.korb.zulaessig, geprueft: ziel.korb.geprueft, ziel: ziel.ziel.length });
          if (d.mfBuch.korbVerlauf.length > 120) d.mfBuch.korbVerlauf = d.mfBuch.korbVerlauf.slice(-120);
          if (!d.tuneLog) d.tuneLog = [];
          d.tuneLog.unshift({ id: 'mfrebal-' + now, at: now, quelle: manuell === 'momentum' ? 'hand' : 'automatik',
            applied: ['Momentum-Rebalancing: ' + nM + ' Orders'],
            txt: 'Momentum-Depot umgeschichtet: ' + plan.verkaufen.length + ' Verkäufe, ' + plan.kaufen.length +
              ' Käufe auf das stärkste Zehntel (' + ziel.ziel.length + ' Werte). Kosten 20 Bp je Seite.' +
              ' Korb: ' + ziel.korb.zulaessig + ' von ' + ziel.korb.geprueft + ' Werten zulässig (Median-Tagesumsatz ≥ ' +
              Math.round(ziel.korb.umsatzMin / 1e6) + ' Mio $ über ' + ziel.korb.fenster + ' Balken).' +
              (ziel.uebersprungen.length ? ' Nicht im Korb oder ohne frische Kurse: ' + ziel.uebersprungen.slice(0, 6).join(', ') + (ziel.uebersprungen.length > 6 ? ' …' : '') : '') +
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
            /* NUR HANDLUNGEN ins Journal (Wilhelms Entscheid 31.08.2026): "42 verworfen"
             * ist das Ergebnis einer Pruefung, keine Handlung. Der alte Zustand schrieb
             * bei jedem Halbstunden-Takt eine Zeile "0 eroeffnet, 0 geschlossen, 42
             * verworfen" und begrub darunter die echten Aenderungen. Ein Lauf ohne
             * Eroeffnung/Schliessung setzt jetzt nur den Pruef-Stempel (unten); die
             * Verworfenen stehen weiter live in der Drift-Karte und - wenn wirklich
             * gehandelt wurde - im txt des Handlungs-Eintrags. */
            if (getanD.geschlossen || getanD.eroeffnet) {
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

      /* Pruef-Stempel: jeder durchgelaufene Takt haelt fest, DASS geprueft wurde -
       * als Feld im Store, nicht als Journalzeile. Das Journal baut daraus die eine
       * Statuszeile "zuletzt geprueft ... / keine Aenderung seit ...". Der Stempel
       * wird mit dem naechsten ohnehin faelligen speichern() persistent; ein eigener
       * Schreibvorgang je Takt waere dafuer zu teuer. */
      if (!d.pruefStand) d.pruefStand = {};
      d.pruefStand.buecher = now;
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

  /* ---- Die Buecher-Karten oben im Bestand (Oberflaeche Stufe 2, 03.09.2026) ----
   *
   * LETZTER BEWERTETER STAND je Buch. Die Karte hat genau EINEN Schreiber (diese
   * Datei) und zwei Ausloeser: takt(), sobald eine Bewertung vorliegt, und
   * depot.js render() bei jedem Zeichnen des Bestands. Ohne diesen Merker wuerde
   * render() die frische Bewertung mit dem taeglichen Verlaufspunkt ueberschreiben -
   * dieselbe Zahl an zwei Orten, verschieden alt.
   * Hier wird NICHTS nachgerechnet: abgelegt wird nur, was takt() ohnehin gerechnet
   * hat (MFHandel.bewerte / bewerteDrift). */
  var STAND = { momentum: null, drift: null };

  function letzterPunkt(d) {
    var v = d && d.mfVerlauf;
    return (v && v.length) ? v[v.length - 1] : null;
  }

  /** Alles, was auf einer Buch-Karte steht - aus Daten, nie aus Text.
   *  quelle 'live'    = aus der Bewertung des letzten Takts,
   *  quelle 'verlauf' = aus dem juengsten Punkt in d.mfVerlauf. Der wird nur EINMAL
   *                     JE TAG geschrieben, deshalb steht sein Datum auf der Karte.
   *  Fehlt beides, bleibt wert null - die Karte schreibt dann einen Strich samt Grund
   *  und erfindet keine Zahl. */
  function buchKarteDaten(name) {
    var d = D();
    if (!d) return null;
    var buch = name === 'momentum' ? d.mfBuch : d.driftBuch;
    var an = name === 'momentum' ? !!d.momentumAn : !!d.driftAn;
    var s = STAND[name], lp = letzterPunkt(d);
    var wert = null, start = null, quelle = null, standT = null;
    if (s) { wert = s.wert; start = s.start; quelle = 'live'; standT = s.at; }
    else if (lp && lp[name] != null) {
      wert = lp[name];
      /* Startkapital aus dem Punkt selbst, sonst aus dem Buch - nie eine feste Zahl.
       * Genau hier stand im Cockpit einmal 10000, waehrend die Buecher mit 100000
       * laufen: ein unberuehrtes Buch meldete dadurch +900 %. */
      start = (name === 'momentum' ? lp.startM : lp.startD) || (buch && buch.start) || null;
      quelle = 'verlauf'; standT = lp.t;
    }
    var trades = (buch && buch.trades) || [];
    return {
      name: name, an: an, buch: buch, wert: wert, start: start, quelle: quelle, standT: standT,
      positionen: (buch && buch.positionen) ? buch.positionen.length : null,
      faellig: s ? !!s.faellig : false,
      letzte: trades.length ? trades[trades.length - 1] : null,
      geprueft: (d.pruefStand && d.pruefStand.buecher) ? d.pruefStand.buecher : null
    };
  }

  function fakten(zeilen) {
    return '<dl class="buch-fakten">' + zeilen.map(function (z) {
      return '<dt>' + U.esc(z[0]) + '</dt><dd>' + z[1] + '</dd>';
    }).join('') + '</dl>';
  }

  /** Ein Strich MIT Grund. Eine Karte, die eine Zahl nicht hat, sagt warum; sie laesst
   *  das Feld nicht leer und setzt keine Null an die Stelle einer fehlenden Messung. */
  function ohne(grund) { return '–<span style="color:var(--muted);"> · ' + U.esc(grund) + '</span>'; }

  function handlungText(t) {
    if (!t) return ohne('noch keine Order');
    return U.d(t.t) + ' · ' + U.esc(t.art) + ' ' + U.esc(t.sym);
  }

  /* Der naechste Takt kommt aus dem Buch, nicht aus einem Kalender: faellig ist, was
   * MFHandel.rebalanceFaellig im letzten Durchlauf gesagt hat; sonst steht da, nach
   * wie vielen Handelstagen es soweit ist (b.konfig.halten - die gemessene
   * Konfiguration) und wann zuletzt umgeschichtet wurde. */
  function taktTextMomentum(k) {
    if (k.faellig) return 'Umschichtung fällig';
    if (!k.buch || !k.buch.letztesRebalanceT) return 'erste Umschichtung steht aus';
    var h = k.buch.konfig ? k.buch.konfig.halten : null;
    return (h ? 'nach ' + h + ' Handelstagen · ' : '') + 'letzte Umschichtung ' + U.d(k.buch.letztesRebalanceT);
  }
  /* Das Drift-Buch hat keinen Umschichtungs-Rhythmus: es gleicht bei jedem Takt ab.
   * Was es ueber die Zeit sagt, ist deshalb der Pruef-Stempel aus d.pruefStand. */
  function taktTextDrift(k) {
    return (k.an ? 'Abgleich bei jedem Takt' : 'Automatik aus – es wird nur gerechnet') +
      (k.geprueft ? ' · zuletzt geprüft ' + U.dt(k.geprueft) : ' · noch nicht geprüft');
  }

  function karteHtml(k, taktTxt) {
    if (!k) return '';
    var pnl = (k.wert != null && k.start) ? k.wert - k.start : null;
    /* cls statt U.signCls: das Buch zeigt ein Ergebnis von genau 0 $ gruen. Welche der
     * beiden Anzeigen richtig ist, entscheidet nicht diese Karte - der Ausdruck ist
     * derselbe wie in der Kachelreihe, die hier bis zum 03.09.2026 stand. */
    var cls = pnl == null ? '' : (pnl >= 0 ? 'pos' : 'neg');
    var kopf = k.wert == null
      ? '<div class="buch-aus">' + (k.buch
          ? 'Noch kein Stand – der Takt hat dieses Buch noch nicht bewertet.'
          : 'Buch noch nicht angelegt – es entsteht beim ersten Takt.') + '</div>'
      : '<div class="buch-wert ' + cls + '">' + U.money(k.wert) + '</div>' +
        '<div class="buch-erg ' + cls + '">' + (pnl == null
          ? ohne('kein Startkapital im Verlauf')
          : U.signTxt(Math.round(pnl * 100) / 100, ' $') + ' · ' + U.pz1((k.wert / k.start - 1) * 100)) + '</div>' +
        (k.quelle === 'verlauf'
          ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">Stand vom ' +
            U.d(k.standT) + ' – der Takt hat seither nicht neu bewertet.</div>'
          : '');
    return kopf + fakten([
      ['Positionen', k.positionen == null ? ohne('Buch noch nicht angelegt') : String(k.positionen)],
      ['Status', k.an ? 'handelt selbst' : 'nur rechnen'],
      ['Nächster Takt', U.esc(taktTxt)],
      ['Zuletzt getan', handlungText(k.letzte)]
    ]);
  }

  /** Die zwei Buch-Karten oben im Bestand schreiben. depot.js render() ruft sie bei
   *  jedem Zeichnen mit auf, damit die Karten stehen, bevor der erste Takt durch ist. */
  function karten() {
    var m = buchKarteDaten('momentum');
    var dr = buchKarteDaten('drift');
    var eM = el('buchMomentumKopf');
    if (eM && m) eM.innerHTML = karteHtml(m, taktTextMomentum(m));
    var eD = el('buchDriftKopf');
    if (eD && dr) eD.innerHTML = karteHtml(dr, taktTextDrift(dr));
  }

  function zeige(mom, drift, daten, fehler) {
    /* Ein Fehler ist hier kein Zwischenstand: er ersetzt die Kursangabe und beendet die
     * Anzeige. Deshalb 'fehler' als Zustand - die Zeile wird eingefaerbt und faellt
     * beim naechsten erfolgreichen Durchlauf von selbst wieder auf ihre Grundfarbe.
     * #mfdStatus traegt class="hinweis"; der Inline-Stil ist leer, die Hilfe merkt sich
     * genau dieses '' und stellt es wieder her - die Klassenfarbe bleibt also.
     * Die Karten werden trotzdem geschrieben: sie leben dann vom letzten Verlaufspunkt
     * und sagen dazu, von wann er ist. */
    if (fehler) { U.statuszeile('mfdStatus', fehler, 'fehler'); karten(); return; }
    var d = D();
    if (daten) {
      U.statuszeile('mfdStatus', 'Kurse vom ' + new Date(daten.juengster).toLocaleDateString('de-DE') +
        (Date.now() - daten.stand > 26 * 3600000 ? ' – veraltet, Nachladen angestoßen' : '') + '.');
    }
    /* Ab hier die KLAPPE "Positionen im Detail": Korb und Konfiguration, der
     * Faelligkeits-Hinweis mit der Handlungsliste, die Positionstabelle und die
     * verworfenen Signale - alles wortgleich wie vorher. Die vier Kennzahlen, die
     * hier bis zum 03.09.2026 als Kachelreihe darueber standen, stehen jetzt auf der
     * Karte; gerechnet werden sie an derselben Stelle wie vorher. */
    if (mom) {
      var b = d.mfBuch, bw = mom.bewertung;
      STAND.momentum = { wert: bw.wert, start: b.start, faellig: !!mom.faellig, at: Date.now() };
      var eM = el('mfdMomentum');
      if (eM) {
        /* Korb und Konfiguration, wie das Buch sie WIRKLICH liest (Zahlen aus mom.ziel.korb
         * und b.konfig, nie aus einem Text hier). Die Korbgroesse je Umschichtung ist die
         * nachrichtliche Ausweisung der Schwellen-Drift. */
        var html = '';
        var kb = mom.ziel.korb;
        if (kb) {
          html += '<div style="font-size:var(--fs-neben); color:var(--muted); margin:6px 0;">' +
            'Korb: <b>' + kb.zulaessig + '</b> von ' + kb.geprueft + ' Werten zulässig (Median-Tagesumsatz ≥ ' +
            Math.round(kb.umsatzMin / 1e6) + ' Mio $ über ' + kb.fenster + ' Balken bis zum Stichtag, vor der Rangbildung)' +
            (kb.ohneUmsatz ? ' · ' + kb.ohneUmsatz + ' ohne Stückzahlen – Tagesdaten werden neu geladen' : '') +
            (mom.ziel.zuWenig ? ' · <b>unter ' + (b.konfig ? b.konfig.mindestWerte : '?') + ' zulässigen Werten – kein Korb</b>' : '') +
            '. Konfiguration wie gemessen (Studie 02.09.2026)' +
            (b.konfigSeit ? ' seit ' + new Date(b.konfigSeit).toLocaleDateString('de-DE') : '') +
            ' · Vorwärtstest ' + (b.liquideSeit ? 'seit ' + new Date(b.liquideSeit).toLocaleDateString('de-DE') : 'ab der nächsten Umschichtung') + '.' +
            (b.korbVerlauf && b.korbVerlauf.length
              ? '<br>Korbgröße je Umschichtung (nachrichtlich – die nominale Schwelle wandert mit dem Marktvolumen): ' +
                b.korbVerlauf.slice(-12).map(function (k) { return new Date(k.t).toLocaleDateString('de-DE') + ' ' + k.zulaessig + '/' + k.geprueft; }).join(', ')
              : '') +
            '</div>';
        }
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
    }
    var eD = el('mfdDrift');
    if (drift) {
      var bD = d.driftBuch, bwD = drift.bewertung;
      STAND.drift = { wert: bwD.wert, start: bD.start, at: Date.now() };
      if (eD) {
        /* "Signale offen laut Modell" war bis zum 03.09.2026 eine Kachel. Sie gehoert
         * nicht auf die Karte (dort stehen die vier Groessen, die jedes Buch hat),
         * verschwindet aber nicht: sie steht hier ueber der Positionstabelle, neben
         * der Zahl der Werte, die das Buch ueberhaupt im Blick hat. */
        eD.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted); margin:6px 0;">' +
          'Signale offen laut Modell: <b>' + drift.info.heute.offen.length + '</b> · ' +
          drift.info.werte + ' Werte mit Ergebnisterminen im Blick.</div>' +
          posTabelle(bD, daten.preise, true) +
          verworfenTabelle(drift.info.verworfen, 'Erkannt, aber nicht gehandelt', true);
      }
    } else if (eD) {
      eD.innerHTML = '<div class="empty" style="padding:6px 0;">Zu wenige Werte mit Ergebnisterminen – der Hintergrund-Abruf füllt das Archiv laufend auf.</div>';
    }
    karten();
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

  /* karten() ist bewusst mit exportiert: depot.js render() zeichnet den Bestand,
   * und die zwei Buch-Karten gehoeren dazu. Der Schreiber bleibt trotzdem diese
   * Datei - render() bestellt nur, es formuliert nicht. */
  window.MFDepot = { takt: takt, karten: karten };
})();
