'use strict';
/* ================= Das Lagebild: alles, was die App zeigt, als EINE Datei =================
 *
 * Auftrag Nr. 115 (12.10.2026): das Markt-Dashboard wird Reiter "Markt" im Management-Tool.
 * Die App bleibt die Maschine, das Tool das Gesicht - es liest lagebild.json (Vertrag
 * uebergabe/auftrag-markt-im-management-tool-2026-10-12.md §3.2, Fassung lagebild/v1).
 *
 * Reines Modul wie massstab.js: laeuft in Node ohne Fenster (test-v6.js, Abschnitt 107)
 * und im Renderer (berichte.js reicht die Quellen herein). Drei Regeln:
 *   1. bau(quellen) wirft NIE. Fehlt eine Quelle oder bricht ein Abschnitt, steht dort
 *      null - das Tool zeigt die Karte grau "noch kein Stand". Innerhalb eines Abschnitts
 *      ist jeder Schluessel der Referenz vorhanden (null oder []), nie fehlt einer.
 *   2. Texte mit Urteil oder Beleg kommen aus den vorhandenen Funktionen der App
 *      (Massstab.hinweis, StudienUrteile.rueckblickText/ueberholtKopf, die Textfunktionen
 *      der Karten in mfdepot.js und depot.js). Hier wird kein Prozent eines Buchs und kein
 *      Marktvergleich gerechnet (Klinke 92 in test-v6.js) und kein Urteil formuliert.
 *   3. Nichts aus Einstellungen oder Zugangsdaten: bau() liest keine Settings, keine
 *      Schluessel, keine Pfade - nur Depot-Zustand, Leseauskuenfte und Zaehler.
 *
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
(function (root) {

  var KENNUNG = 'markt-dashboard/lagebild/v1';
  var HINWEIS = 'Simulation mit virtuellem Kapital, keine Anlageberatung.';
  var RADAR_UEBERSCHRIFT = 'Gehandelt wird hiervon nichts';
  var TAG = 86400000;
  var PROTOKOLL_MAX = 500;

  function zahl(x) { return typeof x === 'number' && isFinite(x); }
  function z2(x) { return zahl(x) ? Math.round(x * 100) / 100 : null; }
  function z4(x) { return zahl(x) ? Math.round(x * 10000) / 10000 : null; }
  function iso(ms) { return zahl(ms) && ms > 0 ? new Date(ms).toISOString() : null; }
  function isoAus(x) {
    if (x instanceof Date) return isFinite(x.getTime()) ? x.toISOString() : null;
    if (zahl(x)) return iso(x);
    if (typeof x === 'string' && x) { var t = Date.parse(x); return isFinite(t) ? new Date(t).toISOString() : null; }
    return null;
  }
  function tagAus(x) { var s = isoAus(x); return s ? s.slice(0, 10) : null; }
  function text(x) { return x == null ? null : String(x); }
  /** Ein Abschnitt: null, wenn die Quelle fehlt oder der Bau bricht - nie eine Ausnahme. */
  function abschnitt(fn) { try { var r = fn(); return r === undefined ? null : r; } catch (e) { return null; } }

  /* ---------------- Sitzung nach NYSE-Zeit (Rueckfrage 10) ----------------
   * vor 04:00-09:30, haupt 09:30-16:00 (Kurztag 13:00), nach 16:00-20:00, sonst zu.
   * Feiertage und Kurztage aus boerse.js (die Liste der App, auch calendar.js kennt
   * keine andere). Die Ortszeit New Yorks liefert Intl - kein eigener Sommerzeit-Kalender. */
  var NY_FORMAT = null;
  function nyTeile(ms) {
    if (!NY_FORMAT) {
      NY_FORMAT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    var o = {};
    NY_FORMAT.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return { jahr: +o.year, monat: +o.month, tag: +o.day, minuten: (+o.hour % 24) * 60 + (+o.minute) };
  }
  function sitzung(ms, Boerse) {
    if (!zahl(ms)) ms = Date.now();
    var ny = nyTeile(ms);
    var nyTag = Date.UTC(ny.jahr, ny.monat - 1, ny.tag);
    if (Boerse && typeof Boerse.istHandelstag === 'function' && !Boerse.istHandelstag(nyTag)) return 'zu';
    var laenge = (Boerse && typeof Boerse.sitzungsMinuten === 'function') ? Boerse.sitzungsMinuten(nyTag) : 390;
    if (!laenge) { var wt = new Date(nyTag).getUTCDay(); if (wt === 0 || wt === 6) return 'zu'; laenge = 390; }
    var m = ny.minuten;
    if (m >= 4 * 60 && m < 9 * 60 + 30) return 'vor';
    if (m >= 9 * 60 + 30 && m < 9 * 60 + 30 + laenge) return 'haupt';
    if (m >= 9 * 60 + 30 + laenge && m < 20 * 60) return 'nach';
    return 'zu';
  }

  /* ---------------- Die Abschnitte ---------------- */

  function kopf(q, jetzt) {
    var D = q.D;
    if (!D) return null;
    var s = sitzung(jetzt, q.Boerse);
    var H = q.HEALTH || {};
    var letzter = zahl(H.lastScanT) && H.lastScanT > 0 ? H.lastScanT : null;
    /* Dieselben zwei Zahlen wie das Kopf-Cockpit der App (#ckEquity, #ckDay: equityNow,
     * tagesPnl) - keine eigene Summe ueber die Buecher. */
    var kz = (q.DepotAPI && q.DepotAPI.kopfzahlen) ? q.DepotAPI.kopfzahlen() : null;
    var wert = kz ? kz.equity : null;
    var offen = 0;
    offen += (D.positions || []).length;
    offen += ((D.mfBuch && D.mfBuch.positionen) || []).length;
    offen += ((D.driftBuch && D.driftBuch.positionen) || []).length;
    return {
      gesamtwert: z2(wert), tagPct: kz ? z2(kz.tagPct) : null, offenePositionen: offen,
      marktOffen: s === 'haupt', sitzung: s, letzterScan: iso(letzter),
      naechsterScan: (s === 'haupt' && letzter && zahl(q.scanMs)) ? iso(letzter + q.scanMs) : null
    };
  }

  function positionenMf(buch, kursVon) {
    return ((buch && buch.positionen) || []).map(function (p) {
      var kurs = typeof kursVon === 'function' ? kursVon(p.sym) : null;
      var wert = zahl(kurs) && zahl(p.stueck) ? kurs * p.stueck : null;
      return { sym: text(p.sym), menge: zahl(p.stueck) ? p.stueck : null, einstand: z4(p.einstand), kurs: z4(kurs), wert: z2(wert),
        pct: (zahl(kurs) && zahl(p.einstand) && p.einstand > 0 && q_pz) ? z2(q_pz(kurs, p.einstand)) : null, seit: isoAus(p.seit) };
    });
  }
  var q_pz = null;   // Massstab.prozent - der EINE Rechenweg fuer einen Prozentstand

  function gegenMarktAbschnitt(v, textFn, Massstab) {
    var t = typeof textFn === 'function' ? textFn(v) : null;
    var ok = !!(v && v.ok);
    return { text: text(t), buchPct: ok ? z2(v.buchPct) : null, marktPct: ok ? z2(v.marktPct) : null,
      abstandPp: ok ? z2(v.abstandPp) : null, von: ok ? tagAus(v.seit) : null, bis: ok ? tagAus(v.bis) : null,
      hinweis: (ok && Massstab && Massstab.hinweis) ? text(Massstab.hinweis(v)) : null };
  }
  function rueckblickZeilen(schluessel, SU) {
    if (!SU || !SU.rueckblicke || !schluessel) return [];
    return SU.rueckblicke(schluessel).map(function (r) { return { text: SU.rueckblickText(r), fundstelle: text(r.quelle) }; });
  }
  /* Auftrag Nr. 126 (26.10.2026): Massstab Nasdaq-100 nach Steuer, Kosten und Regeln je Buch - nur ERGAENZT (Vertrag v1).
   * Gerechnet wird in massstab.js (nachSteuer) und mfdepot.js (karteDaten); hier wird nur uebernommen und gerundet. Fuer Buecher
   * ohne diese Rechnung (Drift, Intraday) stehen die Schluessel mit null da. */
  /* Nachbesserung QS (F1/F4): massstab traegt Name und ISIN auch, wenn es (noch) keine Zahl gibt; p. a. erst ab 20 Handelstagen des
   * Abschnitts, sonst stehen die p.-a.-Felder null und der Gesamtertrag in nachSteuerGesamt (mit paGrund). */
  function regelFelder(k, konfig) {
    var roh = k && k.nachSteuer ? k.nachSteuer : null, ns = roh && roh.ok ? roh : null, kf = konfig || null, g = ns && ns.gesamt ? ns.gesamt : null;
    return {
      massstab: roh && roh.massstab ? { name: text(roh.massstab.name), etf: text(roh.massstab.etf), ertragPa: ns ? z2(ns.massstab.ertragPa) : null,
        nachSteuerPa: ns ? z2(ns.massstab.nachSteuerPa) : null } : null,
      nachSteuerGesamt: g ? { buchPct: z2(g.buchNachSteuerPct), massstabPct: z2(g.massstabNachSteuerPct), abstandPp: z2(g.abstandPp), bruttoPct: z2(g.bruttoPct),
        massstabBruttoPct: z2(g.massstabBruttoPct), kostenPp: z4(g.kostenPp), von: text(ns.von), bis: text(ns.bis), massstabBis: text(ns.massstab.qqqBis) } : null,
      abschnittHandelstage: ns && typeof ns.handelstage === 'number' ? ns.handelstage : null,
      paGrund: ns ? text(ns.paGrund) : null,
      buchNachSteuerPa: ns ? z2(ns.buchNachSteuerPa) : null,
      abstandNachSteuerPa: ns ? z2(ns.abstandNachSteuerPa) : null,
      kostenJahrPp: ns ? z4(ns.kostenJahrPp) : null,
      kostenRegel: kf && kf.kostenRegel ? text(kf.kostenRegel) : null,
      regelK: kf ? !!(kf.kleinstAnteil > 0) : null,
      regelnSeit: k && k.regelnSeit ? tagAus(k.regelnSeit) : null,
      regelnText: k && k.regelnText ? text('Regeln seit ' + (tagAus(k.regelnSeit) || '?').split('-').reverse().join('.') + ': ' + k.regelnText) : null,
      vorwaertsAbschnitte: ((k && k.abschnitte) || []).map(function (a) { return { von: tagAus(a.von), bis: tagAus(a.bis), regeln: text(a.regeln) }; }),
      nachSteuerGrund: k && k.nachSteuer && !k.nachSteuer.ok ? text(k.nachSteuer.grund) : null,
      spyPa: ns ? z2(ns.spyPa) : null,
      bruttoPa: ns ? z2(ns.bruttoPa) : null
    };
  }
  function letzteHandlung(hs, buchName) {
    var h = (hs || []).filter(function (x) { return x && x.buch === buchName; })[0];
    return h ? { zeit: iso(h.at), text: text(h.art) } : { zeit: null, text: null };
  }

  function buecher(q) {
    var D = q.D, MFD = q.MFDepot, SU = q.StudienUrteile, M = q.Massstab;
    if (!D || !MFD || !MFD.karteDaten || !MFD.gegenMarktText) return null;
    q_pz = M && M.prozent ? M.prozent : null;
    var hs = (q.DepotAPI && q.DepotAPI.handlungen) ? q.DepotAPI.handlungen(60) : [];
    function mf(name, titel, buchName, rueckSchluessel, konfig) {
      var k = MFD.karteDaten(name);
      var buch = k && k.buch;
      var pct = (k && q_pz) ? q_pz(k.wert, k.start) : null;
      return Object.assign({
        name: name, titel: titel, an: !!(k && k.an), wert: z2(k && k.wert), start: z2(k && k.start),
        ergebnisPct: z2(pct), ergebnisEuro: (k && zahl(k.wert) && zahl(k.start)) ? z2(k.wert - k.start) : null,
        positionen: positionenMf(buch, q.kursVon),
        letzteHandlung: letzteHandlung(hs, buchName),
        naechsteUmschichtung: (k && k.naechsteUmschichtung) ? tagAus(k.naechsteUmschichtung) : null,
        gegenMarkt: gegenMarktAbschnitt(k && k.massstab, MFD.gegenMarktText, M),
        rueckblick: rueckblickZeilen(rueckSchluessel, SU),
        buchSatz: (SU && SU.buchSatz) ? (SU.buchSatz(rueckSchluessel) || null) : null,
        konfiguration: konfig
      }, regelFelder(k, name === 'momentum' && buch ? buch.konfig : null));
    }
    var kM = D.mfBuch && D.mfBuch.konfig ? Object.assign({}, D.mfBuch.konfig) : {};
    kM.quelle = 'gemessene Konfiguration des Buchs (mfBuch.konfig), nur Anzeige';
    var kD = q.Drift && q.Drift.STANDARD ? Object.assign({}, q.Drift.STANDARD) : {};
    kD.quelle = 'Drift.STANDARD, nur Anzeige';
    var I = D.intraday || {};
    var kI = { modus: text(I.mode), zeitrahmen: text(I.interval), haltedauer: zahl(I.scalpHold) ? I.scalpHold : null,
      bestaetigung: zahl(I.confirmBps) ? I.confirmBps : null, instrument: text(I.instrument), quelle: 'D.intraday, nur Anzeige' };
    var eq = typeof q.equityNow === 'function' ? q.equityNow() : null;
    var gm = (q.DepotAPI && q.DepotAPI.intradayGegenMarkt) ? q.DepotAPI.intradayGegenMarkt() : null;
    var intraday = {
      name: 'intraday', titel: 'Intraday-Depot', an: !!I.enabled, wert: z2(eq), start: z2(q.startKapital),
      ergebnisPct: (q_pz && zahl(eq)) ? z2(q_pz(eq, q.startKapital)) : null,
      ergebnisEuro: (zahl(eq) && zahl(q.startKapital)) ? z2(eq - q.startKapital) : null,
      positionen: (D.positions || []).map(function (p) {
        var kurs = typeof q.kursVon === 'function' ? q.kursVon(p.sym) : null;
        return { sym: text(p.sym), menge: zahl(p.qty) ? p.qty : null, einstand: z4(p.entry), kurs: z4(kurs),
          wert: (zahl(kurs) && zahl(p.qty)) ? z2(kurs * p.qty) : null,
          pct: (zahl(kurs) && zahl(p.entry) && p.entry > 0 && q_pz) ? z2(q_pz(kurs, p.entry)) : null, seit: iso(p.openT) };
      }),
      letzteHandlung: letzteHandlung(hs, 'Intraday'),
      naechsteUmschichtung: null,
      gegenMarkt: gegenMarktAbschnitt(gm && gm.v, function () { return gm ? gm.text : null; }, M),
      rueckblick: [], buchSatz: null, konfiguration: kI
    };
    Object.assign(intraday, regelFelder(null, null));
    return [mf('momentum', 'Momentum-Buch', 'Momentum-Buch', 'momentum-liquide', kM),
      mf('drift', 'Drift-Buch', 'Drift-Buch', 'drift', kD), intraday];
  }

  /* verlauf.markt: die Marktlinie des Massstabs zum Momentum-Buch (vergleich().marktReihe,
   * Prozent seit Vergleichsbeginn) als Index 100 + Prozent - kein zweiter Rechenweg. */
  function verlauf(q) {
    var D = q.D;
    if (!D || !Array.isArray(D.mfVerlauf)) return null;
    var eq = {};
    (D.equityHist || []).forEach(function (p) { if (p && zahl(p[0])) eq[new Date(p[0]).toISOString().slice(0, 10)] = p[1]; });
    var punkte = D.mfVerlauf.filter(function (p) { return p && zahl(p.t); }).map(function (p) {
      var i = zahl(eq[new Date(p.t).toISOString().slice(0, 10)]) ? eq[new Date(p.t).toISOString().slice(0, 10)] : null;
      var m = zahl(p.momentum) ? p.momentum : null, d = zahl(p.drift) ? p.drift : null;
      var g = (m != null || d != null || i != null) ? (m || 0) + (d || 0) + (i || 0) : null;
      return [p.t, z2(g), z2(m), z2(d), z2(i)];
    });
    var v = (q.MFDepot && q.MFDepot.vergleich) ? q.MFDepot.vergleich('momentum') : null;
    var markt = (v && v.ok && Array.isArray(v.marktReihe)) ? v.marktReihe.filter(function (p) { return zahl(p[1]); })
      .map(function (p) { return [p[0], z2(100 + p[1])]; }) : [];
    return { punkte: punkte, markt: markt,
      hinweis: 'punkte = Tagespunkte der Buecher (mfVerlauf) plus Intraday-Depot desselben Tages; markt = Marktlinie des Massstabs zum Momentum-Buch (massstab.js vergleich().marktReihe) als Index 100 + Prozent.' };
  }

  function protokoll(q) {
    var D = q.D;
    if (!D) return null;
    var zeilen = [];
    (D.trades || []).forEach(function (t) {
      if (!t) return;
      zeilen.push({ zu: iso(t.closeT), auf: iso(t.openT), sym: text(t.sym), richtung: text(t.dir), buch: 'intraday',
        modus: text(t.mode || t.strategy), menge: zahl(t.qty) ? t.qty : null, pnl: z2(t.pnl),
        pnlPct: (zahl(t.pnl) && zahl(t.entry) && zahl(t.qty) && t.entry * t.qty > 0 && q_pz) ? z2(q_pz(t.entry * t.qty + t.pnl, t.entry * t.qty)) : null,
        warum: text(t.why || t.reason || null), _t: zahl(t.closeT) ? t.closeT : (t.openT || 0) });
    });
    [['mfBuch', 'momentum'], ['driftBuch', 'drift']].forEach(function (b) {
      (((D[b[0]] || {}).trades) || []).forEach(function (t) {
        if (!t) return;
        zeilen.push({ zu: t.pnl != null ? iso(t.t) : null, auf: t.pnl != null ? null : iso(t.t), sym: text(t.sym), richtung: text(t.art),
          buch: b[1], modus: null, menge: zahl(t.stueck) ? t.stueck : null, pnl: z2(t.pnl), pnlPct: null,
          warum: text(t.grund || t.txt || null), _t: t.t || 0 });
      });
    });
    zeilen.sort(function (a, b) { return b._t - a._t; });
    return { trades: zeilen.slice(0, PROTOKOLL_MAX).map(function (z) { delete z._t; return z; }) };
  }

  function papiere(q) {
    var D = q.D;
    if (!D) return null;
    var aus = [];
    function name(sym) { return (q.nameVon && q.nameVon(sym)) || sym; }
    [['mfBuch', 'momentum'], ['driftBuch', 'drift']].forEach(function (b) {
      (((D[b[0]] || {}).positionen) || []).forEach(function (p) {
        var kurs = q.kursVon ? q.kursVon(p.sym) : null;
        aus.push({ sym: text(p.sym), name: text(name(p.sym)), menge: zahl(p.stueck) ? p.stueck : null, einstand: z4(p.einstand), kurs: z4(kurs),
          wert: (zahl(kurs) && zahl(p.stueck)) ? z2(kurs * p.stueck) : null, buch: b[1] });
      });
    });
    (D.positions || []).forEach(function (p) {
      var kurs = q.kursVon ? q.kursVon(p.sym) : null;
      aus.push({ sym: text(p.sym), name: text(name(p.sym)), menge: zahl(p.qty) ? p.qty : null, einstand: z4(p.entry), kurs: z4(kurs),
        wert: (zahl(kurs) && zahl(p.qty)) ? z2(kurs * p.qty) : null, buch: 'intraday' });
    });
    return aus;
  }

  /* Die Kacheln der App (renderer.js INDICES) - dieselben Kuerzel und Namen in derselben
   * Reihenfolge; nichts wird neu abgerufen: Dash.quote kennt nur, was die Kachelreihe geholt
   * hat (Nr. 116). Fuehrt der Renderer die Liste einmal selbst heraus (Dash.INDICES), gilt sie. */
  var INDIZES = [['^GSPC', 'S&P 500'], ['^IXIC', 'Nasdaq Composite'], ['^DJI', 'Dow Jones'], ['^GDAXI', 'DAX'], ['^SOX', 'PHLX Semiconductor'],
    ['^VIX', 'VIX (Volatilität)'], ['GC=F', 'Gold (Future)'], ['CL=F', 'Öl WTI (Future)'], ['DX-Y.NYB', 'Dollar-Index'], ['BTC-USD', 'Bitcoin']];
  function hotliste(l) {
    return (l || []).map(function (w) { return { sym: text(w.sym), name: text(w.name), pct: z2(w.pct), umsatz: z2(w.umsatz) }; });
  }
  function markt(q) {
    var Dash = q.Dash;
    if (!Dash || typeof Dash.quote !== 'function') return null;
    var liste = Array.isArray(Dash.INDICES) ? Dash.INDICES.map(function (i) { return [i.y, i.name]; }) : INDIZES;
    /* Sektoren und Hotlists: der GEZEICHNETE Stand des Reiters Markt (marktui.js standRechnen,
     * ueber den Store gelesen), in die Vertragsform gebracht von MarktUebersicht.lagebild -
     * kein zweiter Rechenweg. Marktkarte: Marktwerte.lagebild() = die zuletzt gezeichnete Karte. */
    var MU = q.MarktUebersicht;
    var ueb = abschnitt(function () { return (MU && typeof MU.lagebild === 'function') ? MU.lagebild(q.marktStand) : null; });
    var mk = abschnitt(function () { return (q.Marktwerte && typeof q.Marktwerte.lagebild === 'function') ? q.Marktwerte.lagebild() : null; });
    var indizes = liste.map(function (i) {
      var quote = Dash.quote(i[0]);
      if (!quote) return null;
      var kurve = Array.isArray(quote.series) ? quote.series.filter(function (p) { return Array.isArray(p) && zahl(p[0]) && zahl(p[1]); })
        .map(function (p) { return [p[0], z4(p[1])]; }) : [];
      return { sym: i[0], name: i[1], kurs: z4(quote.price), pct: z2(quote.pct), kurve: kurve };
    }).filter(Boolean);
    var termine = [];
    (q.termine || []).forEach(function (e) { if (e) termine.push({ datum: tagAus(e.datum || e.dt), sym: text(e.sym || null), art: text(e.art || e.name) }); });
    var radar = (Dash.radar && typeof Dash.radar === 'function') ? (Dash.radar() || {}) : {};
    var vm = radar.vormarkt && Array.isArray(radar.vormarkt.zeilen) ? radar.vormarkt.zeilen : [];
    var nachrichten = (Dash.nachrichten && typeof Dash.nachrichten === 'function') ? Dash.nachrichten() : (q.nachrichten || []);
    return {
      indizes: indizes,
      sektoren: ueb ? (ueb.sektoren || []).map(function (s) { return { name: text(s.name), pct1T: z2(s.pct1T), pct1W: z2(s.pct1W), pct1M: z2(s.pct1M) }; }) : [],
      /* ausbrueche = die 52-Wochen-Hoch-Liste des Reiters; luecken fuehrt der Reiter nicht (Vorboersen-
       * Luecken: radar.vormarkt); volumen (relatives Volumen) ist ein angekuendigter Zusatz. */
      hotlists: { gewinner: hotliste(ueb && ueb.hotlists.gewinner), verlierer: hotliste(ueb && ueb.hotlists.verlierer), umsatz: hotliste(ueb && ueb.hotlists.umsatz),
        ausbrueche: hotliste(ueb && ueb.hotlists.ausbrueche), luecken: hotliste(ueb && ueb.hotlists.luecken), volumen: hotliste(ueb && ueb.hotlists.volumen) },
      marktkarte: mk ? (mk.sektoren || []).map(function (s) {
        return { sektor: text(s.sektor), werte: (s.werte || []).map(function (w) {
          return { sym: text(w.sym), name: text(w.name), pct: z2(w.pct), umsatz: z2(w.umsatz), mcap: z2(w.mcap) };
        }) };
      }) : [],
      termine: termine,
      nachrichten: (nachrichten || []).slice(0, 25).map(function (n) {
        return { zeit: iso(n.t), quelle: text(n.source || null), titel: text(n.title), sym: text(n.sym || null), url: text(n.url) };
      }),
      /* Radar: die bereinigten Listen der Karten (renderer.js), wie sie gezeigt werden. */
      radar: { ueberschrift: RADAR_UEBERSCHRIFT,
        insider: (radar.insider || []).map(function (e) {
          return { datum: tagAus(e.zeit || e.t), sym: text(e.sym), person: text((e.wer && e.wer[0] && e.wer[0].person) || null),
            art: 'Kauf', betrag: z2(e.wert), quelle: 'SEC Form 4' };
        }),
        vormarkt: vm.map(function (z) { return { sym: text(z.sym), pct: z2(z.luecke), kerzen: zahl(z.kerzen) ? z.kerzen : null,
          hinweis: 'Vorbörse: Kerzenzahl statt Umsatz (Yahoo hat vorbörslich kein Volumen)' }; }),
        spekulation: (radar.spekulation || []).map(function (e) { return { sym: text(e.sym), text: text(e.these), quelle: text(e.art || 'Radar') }; }) }
    };
  }

  function regeln(q) {
    var D = q.D, API = q.DepotAPI;
    if (!D || !API) return null;
    var a = API.antwort ? API.antwort() : null;
    var st = API.regelStatus ? API.regelStatus() : null;
    var SU = q.StudienUrteile;
    var strategien = [];
    var kennungen = API.protokollKennungen ? API.protokollKennungen() : [];
    kennungen.forEach(function (k) {
      var pk = API.protokollKante ? API.protokollKante(k) : null;
      var g = SU && SU.gueltig ? SU.gueltig(k, pk) : (pk ? { protokoll: pk, register: null } : null);
      if (!g) return;
      var urteil = g.protokoll ? text(g.protokoll.urteil) : text(g.register.etikett || 'verworfen');
      strategien.push({ name: k, gruppe: urteil === 'bestaetigt' ? 'belegt' : (/widerlegt|verworfen|zurueckgewiesen|zurückgewiesen/.test(urteil || '') ? 'verworfen' : 'messung'),
        etikett: urteil, protokollzeile: g.protokoll ? text('Messprotokoll ' + (g.protokoll.datum || '') + (zahl(g.protokoll.jeSignalPp) ? ', je Signal ' + g.protokoll.jeSignalPp + ' Pp' : '')) : text(g.register.befund),
        belegText: g.protokoll ? 'Messprotokoll im Datenordner' : text(g.register.befund), fundstelle: g.protokoll ? 'Markt-Dashboard-Daten/protokolle' : text(g.register.quelle) });
    });
    var huerde = API.kostenHuerde ? API.kostenHuerde() : null;
    var I = D.intraday || {};
    var edge = D.edgeWaechter || D.edge || null;
    var regime = D.regime || null;
    var pause = (D.handelsPause && zahl(D.handelsPause.bis) && D.handelsPause.bis > (q.jetzt || Date.now())) ? D.handelsPause : null;
    var auto = D.autoOpt || null;
    var lc = auto && auto.lastCheck ? auto.lastCheck : null;
    /* Die Antwort-Seite: dieselben Textfunktionen wie strategien.js renderAntwort. */
    var AT = q.antwortTexte, absaetze = [], handelt = [];
    if (AT && a && st) {
      absaetze = AT.status(a).map(function (z) { return z.text + (z.warnung ? z.trenner + z.warnung : ''); });
      handelt = AT.handelt(a, st).map(function (z) {
        return { buch: text(z.name), text: text(z.text) + (z.zusatz ? ' + ' + z.zusatz.text : ''),
          beleg: text(z.chip && z.chip.txt), fundstelle: text((z.chip && z.chip.quelle) || null) };
      });
    }
    return {
      antwort: { ueberschrift: 'Was wird gehandelt – und warum', absaetze: absaetze, handelt: handelt },
      /* Nr. 126: die Kostenregel des Momentum-Buchs in einem Satz (kostenregel.js KURZTEXT) */
      kostenRegel: q.Kostenregel && q.Kostenregel.KURZTEXT ? text(q.Kostenregel.KURZTEXT) : null,
      strategien: strategien,
      /* kostenHuerde: Schreibweise der Referenzdatei (Fassung 2) - der Schluessel ist das Soll. */
      intraday: { an: !!I.enabled, modus: text(I.mode), klartext: text(q.intradayKlartext || null),
        'kostenHuerde': huerde ? z4(huerde.pp) : null,
        edge: { text: edge ? text(edge.text || edge.satz || null) : null, zeit: edge ? isoAus(edge.at || edge.zeit) : null },
        regime: { setup: regime ? text(regime.setup || regime.key || null) : null, begruendung: regime ? text(regime.txt || regime.begruendung || null) : null,
          zeit: regime ? isoAus(regime.at || regime.t) : null, pause: !!pause } },
      risiko: { maxPositionen: a && zahl(a.maxPos) ? a.maxPos : null, tagesverlustPct: a && zahl(a.dayLossPct) ? a.dayLossPct : null,
        exposure: D.risk && zahl(D.risk.maxExposure) ? D.risk.maxExposure : null,
        verlustSerie: D.lossStreak && zahl(D.lossStreak.n) ? D.lossStreak.n : (zahl(D.lossStreak) ? D.lossStreak : null),
        bremse: D.maxRisikostufe != null ? 'Risikostufe ' + D.maxRisikostufe : null,
        letzteAnpassung: D.lastTune ? { zeit: isoAus(D.lastTune.at || D.lastTune.t), text: text(D.lastTune.txt || D.lastTune.text) } : null },
      watchlist: (D.watchlist || []).map(function (w) { return w && w.y; }).filter(Boolean),
      monitor: (q.signale || []).map(function (s) { return { sym: text(s.sym), signal: text(s.signal || null), zeit: iso(s.t), text: text(s.grund) }; }),
      autopilot: { an: !!(auto && auto.enabled), pruefung: lc ? { zeit: isoAus(lc.at), ok: !lc.fehler && !lc.error, text: text(lc.fehler || lc.error || lc.txt || null) } : null,
        edge: edge ? text(edge.text || edge.satz || null) : null }
    };
  }

  function betrieb(q) {
    var D = q.D, H = q.HEALTH;
    if (!D && !H) return null;
    /* gesundheit: aus demselben Objekt, das analyse-daten.json traegt (berichte.js), auf die
     * Schluessel der Referenz abgebildet - letzterFehler als { zeit, text }. */
    var gq = q.gesundheit || null, g = null;
    if (gq) {
      var lf = gq.letzterFehler;
      g = { appLaeuftSeit: isoAus(gq.appLaeuftSeit), scansGesamt: zahl(gq.scansGesamt) ? gq.scansGesamt : null, scanFehler: zahl(gq.scanFehler) ? gq.scanFehler : null,
        letzterScan: isoAus(gq.letzterScan), kursAbrufeOk: zahl(gq.kursAbrufeOk) ? gq.kursAbrufeOk : null, kursAbrufeFehler: zahl(gq.kursAbrufeFehler) ? gq.kursAbrufeFehler : null,
        killSwitchAusloesungen: zahl(gq.killSwitchAusloesungen) ? gq.killSwitchAusloesungen : null,
        hintergrundRechnerAusfaelle: zahl(gq.hintergrundRechnerAusfaelle) ? gq.hintergrundRechnerAusfaelle : null,
        analyseExportFehler: zahl(gq.analyseExportFehler) ? gq.analyseExportFehler : null,
        /* Schreibweise der Referenzdatei (Fassung 2) - der Schluessel ist das Soll. */
        'edgeWaechterAusfaelle': zahl(gq.edgeWaechterAusfaelle) ? gq.edgeWaechterAusfaelle : null,
        letzterFehler: lf ? fehlerZeile(lf, null) : null, marktOffen: !!gq.marktOffen,
        scanIntervallSollMs: zahl(gq.scanIntervallSollMs) ? gq.scanIntervallSollMs : null,
        scanLueckenMin: Array.isArray(gq.scanLueckenMin) ? gq.scanLueckenMin : [] };
    }
    var ab = q.abdeckung;
    var abdeckung = [];
    if (ab) {
      [['1m', ab.min1], ['5m', ab.min5]].forEach(function (r) {
        var d = r[1];
        if (!d) return;
        abdeckung.push({ rahmen: r[0], werte: zahl(d.werte) ? d.werte : null, von: tagAus(d.von), bis: tagAus(d.bis),
          luecken: zahl(d.luecken) ? d.luecken : null, anteil: zahl(d.anteil) ? z4(d.anteil) : (zahl(d.handelstage) && zahl(ab.zielTage) && ab.zielTage > 0 ? z4(d.handelstage / ab.zielTage) : null) });
      });
    }
    var API = q.DepotAPI, SU = q.StudienUrteile;
    var scoreboard = [];
    ((API && API.protokollKennungen) ? API.protokollKennungen() : []).forEach(function (k) {
      var pk = API.protokollKante(k);
      /* "ueberholt durch": dieselbe Entscheidung wie das Scoreboard (scoreboard.js ueberholtDurch). */
      var reg = (q.Scoreboard && q.Scoreboard.ueberholtDurch && pk) ? q.Scoreboard.ueberholtDurch(k, { gemessenAm: pk.datum }) : null;
      scoreboard.push({ kennung: k, urteil: pk ? text(pk.urteil) : (reg ? text(reg.etikett || 'verworfen') : null),
        zahl: pk && zahl(pk.jeSignalPp) ? pk.jeSignalPp + ' Pp je Signal' : null, stand: pk ? tagAus(pk.datum) : (reg ? reg.datum : null),
        ueberholtDurch: reg && SU.ueberholtKopf ? SU.ueberholtKopf(reg) : null });
    });
    var register = [];
    var verworfenK = ['donchian', 'squeeze', 'ruecksetzer', 'kanaltrend', 'kapitulation'];
    if (SU && SU.verworfen) verworfenK.forEach(function (k) {
      var v = SU.verworfen(k);
      if (v) register.push({ name: k, urteil: text(v.etikett || 'verworfen'), altesUrteil: null, etikett: text(v.befund) });
    });
    var schatten = D ? (D.schatten || []) : [];
    var stat = D ? (D.schattenStat || {}) : {};
    var bilanz = Object.keys(stat).map(function (gr) {
      var s = stat[gr] || {};
      return { grund: gr, n: zahl(s.n) ? s.n : null, summePct: z2(s.sumPct != null ? s.sumPct : s.summePct), gerettet: zahl(s.gerettet) ? s.gerettet : null, verhindert: zahl(s.verhindert) ? s.verhindert : null };
    });
    var bench = (API && API.intradayGegenMarkt) ? API.intradayGegenMarkt() : null;
    /* kosten: die Auskunft aus kosten.js (Kosten.lagebild = kostenBilanz in Vertragsform);
     * ohne Runden null. wochenbericht: die Textfunktion des Wochenreports (berichte.js
     * wochenberichtText) ohne Dialog - bricht sie, steht null (Nr. 116). */
    var ko = abschnitt(function () { return (q.Kosten && typeof q.Kosten.lagebild === 'function') ? q.Kosten.lagebild() : (q.kosten || null); });
    var wb = abschnitt(function () { return typeof q.wochenbericht === 'function' ? text(q.wochenbericht() || null) : null; });
    return {
      gesundheit: g,
      archiv: { abdeckung: abdeckung },
      sammler: q.sammler ? { laeuft: !!q.sammler.laeuft, stand: isoAus(q.sammler.stand || q.sammler.at), menge: zahl(q.sammler.menge) ? q.sammler.menge : null, sperre: text(q.sammler.sperre || null) } : null,
      kosten: ko ? { runden: zahl(ko.runden) ? ko.runden : null, huerdeGemessen: z4(ko.huerdeGemessen), annahme: z4(ko.annahme), stand: tagAus(ko.stand) } : null,
      scoreboard: scoreboard,
      register: register,
      journal: (D ? (D.tuneLog || []) : []).slice(-60).map(function (j) { return { zeit: isoAus(j.at || j.t), text: text(j.txt || j.text), quelle: text(j.quelle || j.wer || null) }; }),
      schattenbuch: { bilanz: bilanz, offen: schatten.filter(function (x) { return x && x.status === 'open'; }).length,
        letzte: schatten.slice(0, 20).map(function (x) { return { sym: text(x.sym), richtung: text(x.dir), grund: text(x.grund || x.why), zeit: iso(x.openT || x.t) }; }) },
      berichte: { messbericht: D && D.central ? text(D.central.berichtMd || null) : null, wochenbericht: wb, stand: D && D.central ? isoAus(D.central.at) : null },
      benchmark: bench && bench.v && bench.v.ok ? { text: text(bench.text), punkte: (bench.v.marktReihe || []).map(function (p) { return [p[0], null, z2(100 + p[1]), null]; }) } : { text: bench ? text(bench.text) : null, punkte: [] },
      regelbuch: (D && Array.isArray(D.regeln) ? D.regeln : []).map(function (r) { return { name: text(r.name), text: text(r.txt || r.text || (r.cfg && r.cfg.mode) || null) }; }),
      trendfinder: { text: 'Winkel-Detektor: +0,25 widerlegt, marktneutral - nur im Archiv.', fundstelle: 'wiki/belegstand.md' }
    };
  }

  /** Ein Fehler der Maschine als { zeit, quelle?, text } - der Text woertlich, wie er kam. */
  function fehlerZeile(e, quelle) {
    var o = (typeof e === 'string') ? { text: e } : (e || {});
    var z = { zeit: isoAus(o.at || o.t || o.zeit || null), text: text(o.text || o.msg || o.txt || (typeof e === 'string' ? e : null)) };
    if (quelle !== null) z.quelle = text(o.quelle || quelle);
    return z;
  }
  function fehler(q) {
    var H = q.HEALTH, D = q.D;
    if (!H && !D) return null;
    var aus = [];
    if (H && H.lastError) aus.push(fehlerZeile(H.lastError, 'App'));
    var lc = D && D.autoOpt && D.autoOpt.lastCheck;
    if (lc && (lc.fehler || lc.error)) aus.push({ zeit: isoAus(lc.at), quelle: 'Autopilot-Pruefung', text: text(lc.fehler || lc.error) });
    return aus;
  }

  /* Nichts aus Einstellungen oder Zugangsdaten - und kein Benutzerpfad: Fehlertexte der
   * Maschine duerfen Pfade nennen, im Export steht statt C:\Users\<name>\... nur <Pfad>. */
  var PFAD_RE = /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"']+(?:[\\/]+[^\\/\s"']+)*/g;
  function entschaerfen(x) {
    if (typeof x === 'string') return x.replace(PFAD_RE, function () { return '<Pfad>'; });
    if (Array.isArray(x)) return x.map(entschaerfen);
    if (x && typeof x === 'object') { var o = {}; Object.keys(x).forEach(function (k) { o[k] = entschaerfen(x[k]); }); return o; }
    return x;
  }

  /** Das Lagebild aus den Quellen des Renderers. Wirft nie. */
  function bau(quellen) {
    return entschaerfen(bauRoh(quellen));
  }
  function bauRoh(quellen) {
    var q = quellen || {};
    var jetzt = zahl(q.jetzt) ? q.jetzt : Date.now();
    return {
      kennung: KENNUNG, exportiert: new Date(jetzt).toISOString(), appVersion: text(q.appVersion || null), hinweis: HINWEIS,
      kopf: abschnitt(function () { return kopf(q, jetzt); }),
      buecher: abschnitt(function () { return buecher(q); }),
      verlauf: abschnitt(function () { return verlauf(q); }),
      protokoll: abschnitt(function () { return protokoll(q); }),
      papiere: abschnitt(function () { return papiere(q); }),
      markt: abschnitt(function () { return markt(q); }),
      regeln: abschnitt(function () { return regeln(q); }),
      betrieb: abschnitt(function () { return betrieb(q); }),
      fehler: abschnitt(function () { return fehler(q); })
    };
  }

  /* ---------------- markt-chart/<SYM>.json ---------------- */
  var CHART_MAX = 1024 * 1024;
  var ZEHN_JAHRE = 3653 * TAG, EIN_JAHR = 366 * TAG;
  /** Kerzen auf die letzten n Handelstage kuerzen (Handelstag = Kalendertag UTC mit Kerzen). */
  function letzteTage(kerzen, n) {
    var tage = {}, liste = [];
    for (var i = kerzen.length - 1; i >= 0; i--) {
      var t = Math.floor(kerzen[i][0] / TAG);
      if (!tage[t]) { if (liste.length >= n) break; tage[t] = 1; liste.push(t); }
    }
    return kerzen.slice(i + 1);
  }
  var GRENZEN = { '1m': 2, '5m': 10, '15m': 30 };
  function chart(sym, e) {
    e = e || {};
    var jetzt = zahl(e.jetzt) ? e.jetzt : Date.now();
    var rahmen = {}, quelle = e.kerzen || {};
    ['1m', '5m', '15m', '60m', '1d'].forEach(function (r) {
      var k = (Array.isArray(quelle[r]) ? quelle[r] : []).filter(function (x) { return Array.isArray(x) && zahl(x[0]); })
        .map(function (x) { return [x[0], z4(x[1]), z4(x[2]), z4(x[3]), z4(x[4]), zahl(x[5]) ? x[5] : null]; });
      if (GRENZEN[r]) k = letzteTage(k, GRENZEN[r]);
      else if (r === '60m') k = k.filter(function (x) { return x[0] >= jetzt - EIN_JAHR; });
      rahmen[r] = k;
    });
    var aus = { sym: String(sym || '').toUpperCase(), name: text(e.name || null), exportiert: new Date(jetzt).toISOString(), rahmen: rahmen, gekappt: false,
      kennzahlen: e.kennzahlen || {}, zeichnungen: Array.isArray(e.zeichnungen) ? e.zeichnungen : [],
      signale: Array.isArray(e.signale) ? e.signale : [], termine: Array.isArray(e.termine) ? e.termine : [] };
    var stufen = [ZEHN_JAHRE, 5 * EIN_JAHR, 2 * EIN_JAHR, EIN_JAHR];
    for (var s = 0; s < stufen.length && JSON.stringify(aus).length > CHART_MAX; s++) {
      aus.rahmen['1d'] = aus.rahmen['1d'].filter(function (x) { return x[0] >= jetzt - stufen[s]; });
      aus.gekappt = true;
    }
    return aus;
  }

  /* ---------------- Schema gegen die Referenz ---------------- */
  function istObjekt(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function pruefeSchema(obj, referenz) {
    var fehlend = [], fremd = [];
    /* Freie Objekte: ihre Schluessel haengen an der gemessenen Konfiguration bzw. am Wert. */
    var FREI = { konfiguration: 1, kennzahlen: 1 };
    function geh(o, r, pfad, tiefe) {
      if (Array.isArray(r)) {
        if (!Array.isArray(o)) { if (!(o === null && tiefe === 1)) fehlend.push(pfad + ' (Liste erwartet)'); return; }
        if (r.length && istObjekt(r[0])) o.forEach(function (x, i) { if (istObjekt(x)) geh(x, r[0], pfad + '[' + i + ']', tiefe + 1); });
        return;
      }
      if (!istObjekt(r)) return;
      if (o === null && tiefe >= 1) return;   // ganzer Abschnitt oder verschachteltes Objekt: null erlaubt
      if (!istObjekt(o)) { fehlend.push(pfad + ' (Objekt erwartet)'); return; }
      Object.keys(r).forEach(function (k) {
        if (k.charAt(0) === '_') return;
        if (!(k in o)) fehlend.push(pfad ? pfad + '.' + k : k);
        else if (!FREI[k]) geh(o[k], r[k], pfad ? pfad + '.' + k : k, tiefe + 1);
      });
      Object.keys(o).forEach(function (k) { if (k.charAt(0) !== '_' && !(k in r)) fremd.push(pfad ? pfad + '.' + k : k); });
    }
    geh(obj, referenz, '', 0);
    return { fehlend: fehlend, fremd: fremd, ok: fehlend.length === 0 };
  }

  var Lagebild = { KENNUNG: KENNUNG, HINWEIS: HINWEIS, bau: bau, chart: chart, pruefeSchema: pruefeSchema, sitzung: sitzung, entschaerfen: entschaerfen,
    CHART_MAX: CHART_MAX, GRENZEN: GRENZEN };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Lagebild; return; }
  root.Lagebild = Lagebild;
})(typeof window !== 'undefined' ? window : globalThis);
