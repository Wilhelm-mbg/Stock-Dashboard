'use strict';
/* ================= Reiter Markt, Pille Ueberblick: die Anzeige =================
 *
 * Die RECHNUNG steht in markt/uebersicht.js und ist dort in Node pruefbar. Hier
 * steht nur, was die Rechnung mit dem Bildschirm zu tun hat: Daten holen, Ergebnis
 * hinschreiben, Stand merken.
 *
 * DREI QUELLEN, und sie werden nie vermischt:
 *   LANGSAM  Branche und Aktienanzahl kommen aus <Datenordner>/markt/stammdaten.json
 *            (SEC, Jahresrhythmus) - dieselbe Datei wie fuer die Marktkarte, ueber
 *            deren Leseauskunft window.Marktwerte. Eine zweite Auswahl derselben
 *            Werte waere eine zweite Wahrheit darueber, was "der Markt" ist.
 *   SCHNELL  Kurs, Tagesveraenderung, Volumen, Marktkapitalisierung und das
 *            52-Wochen-Hoch kommen im Sammelabruf (yahoo-quotes, Bloecke zu 400).
 *   ARCHIV   Der Median des Tagesvolumens und die Wochen-/Monatsspanne kommen aus
 *            dem eigenen Tagesarchiv (markt-tagesreihen). Yahoos averageVolume
 *            waere die bequeme Zahl und die falsche.
 *
 * WAS SIE NICHT IST: kein Signal, keine Rangliste zum Handeln, keine Empfehlung.
 * An keiner Zahl auf diesem Reiter ist etwas gemessen. Die grosse Signalstudie vom
 * 23.08.2026 hat in 3.372 Tests keinen bestaetigten Vorteil der Ausbruchsfamilie
 * gefunden - "heute stark gestiegen" ist genau das.
 *
 * Alles Simulation, keine Anlageberatung. */
(function () {
  var U = window.U || {};
  function esc(x) { return U.esc ? U.esc(x) : String(x); }
  var nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

  /* Die Grundgesamtheit der Hotlists: die groessten Werte mit Stammdaten. Die Zahl
   * ist eine SETZUNG und keine Messung - sie steht deshalb in der Fusszeile, damit
   * niemand "der groesste Gewinner des Tages" liest, wo "der groesste Gewinner unter
   * den 600 groessten Werten" steht. Sechshundert sind zwei Sammelabrufe. */
  var UNIVERSUM = 600;
  var FRISCH_MS = 5 * 60000;
  var TAGE_FENSTER = 60;         // Handelstage aus dem Tagesarchiv
  var WOCHE = 5, MONAT = 21;     // Handelstage, nicht Kalendertage
  var STAND_KEY = 'marktUeberblickStand';

  var KURSE = {};                // sym -> { kurs, pct, volumen, mkap, hoch52, at }
  var TAGES = null;              // sym -> [[t, schluss, umsatz], ...]
  var TAGES_TAG = '';            // fuer welchen Kalendertag die Reihen geholt wurden
  var TAGES_GRUND = '';
  var STAND = null;              // was zuletzt gezeichnet wurde (auch aus dem Speicher)
  var ZEITRAUM = 't1';
  var laeuft = false;
  var letzterLauf = 0;
  var taktung = null;
  var kursGrund = '';

  function MU() { return window.MarktUebersicht; }
  function el(id) { return document.getElementById(id); }
  function setz(id, html) { var e = el(id); if (e) e.innerHTML = html; }

  /* ---------------------------------------------------------------------------
   * Der Zustand der Sitzung
   *
   * Gerechnet wird in markt/uebersicht.js; hier wird nur eingesetzt, was die zwei
   * Fachmodule ohnehin wissen. Die Sitzungslaenge kommt aus boerse.js und nicht als
   * feste 390: an Halbtagen stuende sonst drei Stunden lang "regulaerer Handel"
   * ueber einem geschlossenen Markt. */
  function sitzungZeichnen() {
    var e = el('marktSitzung');
    if (!e || !MU() || !window.Quant) return;
    var jetzt = Date.now();
    var laenge = window.Boerse ? window.Boerse.sitzungsMinuten(jetzt) : 390;
    var min = window.Quant.minutenSeitOeffnung(jetzt);
    var z = MU().sitzungszustand(min, laenge);
    if (!z) { e.innerHTML = '<span class="loading">Zustand der Sitzung nicht ermittelbar.</span>'; return; }
    var offen = z.zustand === 'regulaer';
    var stand = (STAND && STAND.zeit)
      ? 'Kurse: Stand ' + new Date(STAND.zeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
      : 'Kurse: noch keine geholt';
    e.innerHTML =
      '<span class="zustand"><span class="mdot ' + (offen ? 'open' : 'closed') + '"></span>' + esc(z.text) + '</span>' +
      '<span class="quelle">' + esc(stand) + '</span>' +
      (kursGrund ? '<span class="quelle">Kursabruf gescheitert: ' + esc(kursGrund) + '</span>' : '');
  }

  /* ---------------------------------------------------------------------------
   * Kurse: erst nehmen, was die App schon hat
   *
   * Die Marktkarte fuehrt denselben Kreis von Werten und haelt ihre Kurse fuenf
   * Minuten. Sie hier abzuschoepfen ist nicht nur billiger - es ist die einzige
   * Art, dieselbe Tagesveraenderung an beiden Orten stehen zu haben. Zwei eigene
   * Abrufe im Minutenabstand zeigten sonst zwei Zahlen fuer denselben Tag. */
  function ausDerApp(sym) {
    var m = window.Marktwerte && window.Marktwerte.kurs ? window.Marktwerte.kurs(sym) : null;
    if (m && m.kurs > 0) return m;
    var q = window.Dash && window.Dash.quote ? window.Dash.quote(sym) : null;
    if (q && q.price != null && q.pct != null) return { kurs: q.price, pct: q.pct };
    return null;
  }
  function kursFrisch(sym) {
    var c = KURSE[sym];
    return !!(c && c.kurs > 0 && Date.now() - c.at <= FRISCH_MS);
  }

  async function kurseHolen(liste) {
    var jetzt = Date.now();
    var offen = liste.filter(function (w) { return !kursFrisch(w.sym); });
    /* Volumen, Marktkapitalisierung und das 52-Wochen-Hoch stehen NUR im
     * Sammelabruf. Der Kurs aus der Karte reicht fuer die Gewinner-Liste, nicht fuer
     * "ungewoehnliches Volumen" - deshalb wird er hier nur als Zwischenstand
     * eingesetzt und der Abruf trotzdem gemacht. */
    offen.forEach(function (w) {
      var k = ausDerApp(w.sym);
      if (k) KURSE[w.sym] = { kurs: k.kurs, pct: k.pct, volumen: null, mkap: null, hoch52: null, at: jetzt, ausApp: true };
    });
    var K = window.Kurse;
    if (!K || typeof K.holeViele !== 'function') { kursGrund = 'Sammelabruf in dieser Fassung nicht vorhanden'; return; }
    if (!offen.length) { kursGrund = ''; return; }
    var r = await K.holeViele(offen.map(function (w) { return w.sym; }));
    if (!r || !r.ok) {
      /* Ein gescheiterter Abruf darf nicht wie ein leerer Markt aussehen. Was schon
       * im Speicher steht, bleibt stehen; der Grund wandert in die Kopfzeile. */
      kursGrund = (r && r.grund) || 'unbekannt';
      return;
    }
    kursGrund = '';
    var nun = Date.now();
    offen.forEach(function (w) {
      var q = r.kurse[w.sym];
      if (!q || !(q.kurs > 0)) return;
      KURSE[w.sym] = {
        kurs: q.kurs,
        /* Yahoo liefert die Prozentzahl mit; nur wenn sie fehlt, wird sie aus dem
         * Vortagesschluss gerechnet. Fehlt auch der, bleibt sie null - eine
         * unbekannte Veraenderung ist unbekannt, nicht null Prozent. */
        pct: q.pct != null ? q.pct : (q.vorher > 0 ? (q.kurs / q.vorher - 1) * 100 : null),
        volumen: q.volumen != null ? q.volumen : null,
        mkap: q.mkap != null ? q.mkap : null,
        hoch52: q.hoch52 != null ? q.hoch52 : null,
        at: nun
      };
    });
  }

  /* ---------------------------------------------------------------------------
   * Tagesreihen aus dem eigenen Archiv - einmal je Kalendertag
   *
   * Das Archiv waechst einmal am Tag. Es oefter zu lesen kostet Platte und bringt
   * dieselben Zahlen. Ein Fehlschlag wird NICHT gemerkt: liegt das Archiv beim Start
   * noch nicht da, soll der naechste Versuch nachsehen und nicht den gespeicherten
   * Fehlschlag wiederholen (derselbe Fehler wie bei den Stammdaten am 25.08.2026). */
  async function tagesreihenHolen(liste) {
    var tag = new Date().toISOString().slice(0, 10);
    if (TAGES && TAGES_TAG === tag) return TAGES;
    if (!window.api || typeof window.api.marktTagesreihen !== 'function') {
      TAGES_GRUND = 'Schnittstelle fehlt'; return null;
    }
    var r = await window.api.marktTagesreihen(liste.map(function (w) { return w.sym; }), TAGE_FENSTER);
    if (!r || !r.ok || !r.reihen) { TAGES_GRUND = (r && r.grund) || 'Abruf fehlgeschlagen'; return null; }
    TAGES = r.reihen;
    TAGES_TAG = tag;
    TAGES_GRUND = Object.keys(r.reihen).length ? '' : 'Im Tagesarchiv liegt keiner dieser Werte';
    return TAGES;
  }

  /* ---------------------------------------------------------------------------
   * Ergebnistermine - einmal je Kalendertag
   *
   * Die Liste aendert sich im Tagesrhythmus. Sie beim Start und danach einmal
   * taeglich zu holen, ist genau die Frische, die sie hat. */
  var EARN = null, EARN_TAG = '', EARN_GRUND = '', EARN_NAECHST = null;
  async function earningsHolen() {
    var tag = new Date().toISOString().slice(0, 10);
    if (EARN && EARN_TAG === tag) return EARN;
    if (!window.api || typeof window.api.earningsKalender !== 'function') {
      EARN_GRUND = 'Schnittstelle fehlt'; return null;
    }
    var r = await window.api.earningsKalender(2);
    if (!r || !r.ok) { EARN_GRUND = (r && r.grund) || 'Abruf fehlgeschlagen'; return null; }
    EARN = r.termine || [];
    /* Der naechste Termin AUSSERHALB des Fensters. Anfang September steht in Yahoos
     * Kalender wirklich nichts fuer heute und morgen - zwischen den Quartalssaisons
     * ist die Liste leer, und das ist kein Fehler. Ohne dieses Datum waere das von
     * "die Quelle hat nichts geliefert" nicht zu unterscheiden. */
    EARN_NAECHST = r.naechster || null;
    EARN_TAG = tag;
    EARN_GRUND = '';
    return EARN;
  }

  /* ---------------------------------------------------------------------------
   * Aus Stammdaten, Kursen und Archiv wird die Anzeige */
  function standRechnen(a) {
    var M = MU();
    var werte = [], mitVolumen = 0;
    a.liste.forEach(function (w) {
      var k = KURSE[w.sym];
      if (!k || !(k.kurs > 0)) return;
      var reihe = TAGES ? TAGES[w.sym] : null;
      /* Der HEUTIGE Tag darf nicht im Nenner stehen. Das Archiv endet beim letzten
       * abgeschlossenen Handelstag; steht dessen Kerze schon drin und ist es
       * derselbe Tag wie der laufende, verglaeche sich der Wert teilweise mit sich
       * selbst (wiki/fehlerformen.md, geteilter Kurs). Deshalb wird die letzte
       * Kerze abgeschnitten, sobald sie von heute ist. */
      var vol = reihe ? M.volumenReihe(heuteAbschneiden(reihe)) : [];
      var rel = M.relativesVolumen(k.volumen, vol);
      if (rel) mitVolumen++;
      werte.push({
        sym: w.sym, name: w.name, sektor: w.sektor,
        kurs: k.kurs, pct: k.pct,
        /* Die Groesse aus Yahoos marketCap, ersatzweise Kurs x Stueckzahl der SEC -
         * dieselbe Rechnung, aus der die Marktkarte ihre Flaechen macht. */
        kap: k.mkap != null ? k.mkap : (w.aktien > 0 ? k.kurs * w.aktien : null),
        volumen: k.volumen, hoch52: k.hoch52,
        relVol: rel ? rel.faktor : null, relTage: rel ? rel.tage : null,
        woche: reihe ? M.spanne(reihe, WOCHE) : null,
        monat: reihe ? M.spanne(reihe, MONAT) : null
      });
    });
    function leiste(feld) {
      return M.sektorLeiste(werte.map(function (w) {
        return { sektor: w.sektor, kap: w.kap, pct: w[feld] };
      }));
    }
    var hot = M.hotlists(werte);
    return {
      zeit: Date.now(),
      universum: a.liste.length,
      gezeigt: werte.length,
      mitVolumen: mitVolumen,
      archivGrund: TAGES_GRUND,
      sektoren: {
        t1: M.sektorLeiste(werte.map(function (w) { return { sektor: w.sektor, kap: w.kap, pct: w.pct }; })),
        w1: leiste('woche'),
        m1: leiste('monat')
      },
      hotlists: {
        gewinner: schlank(hot.gewinner), verlierer: schlank(hot.verlierer),
        umsatz: schlank(hot.umsatz), volumen: schlank(hot.volumen), hoch52: schlank(hot.hoch52)
      },
      naheAm: hot.naheAm,
      earnings: (EARN || []).slice(0, 24),
      earningsGrund: EARN_GRUND,
      earningsNaechst: EARN_NAECHST
    };
  }
  function heuteAbschneiden(reihe) {
    if (!reihe || !reihe.length) return reihe;
    var heute = new Date().toISOString().slice(0, 10);
    var letzte = new Date(reihe[reihe.length - 1][0]).toISOString().slice(0, 10);
    return letzte === heute ? reihe.slice(0, -1) : reihe;
  }
  /* Nur was gezeichnet wird, wird gemerkt. Sechshundert Kursstaende in den Speicher
   * zu legen waere ein Archiv, und ein zweites Archiv desselben Tages ist genau die
   * Sorte doppelte Wahrheit, die dieses Projekt schon einmal Tage gekostet hat. */
  function schlank(zeilen) {
    return (zeilen || []).map(function (w) {
      return { sym: w.sym, name: w.name, kurs: w.kurs, pct: w.pct, volumen: w.volumen,
               umsatz: w.umsatz != null ? w.umsatz : null, relVol: w.relVol != null ? w.relVol : null,
               relTage: w.relTage != null ? w.relTage : null, hoch52: w.hoch52, naehe: w.naehe != null ? w.naehe : null };
    });
  }

  /* ---------------------------------------------------------------------------
   * Zeichnen */
  function pz(v, stellen) {
    if (v == null || !isFinite(v)) return '–';
    return (v > 0 ? '+' : '') + (stellen === 1 ? nf1 : nf2).format(v) + ' %';
  }
  function cls(v) { return v > 0.001 ? 'up' : (v < -0.001 ? 'down' : ''); }
  function geld(v) {
    if (!(v > 0)) return '–';
    if (v >= 1e12) return nf2.format(v / 1e12) + ' Bio. $';
    if (v >= 1e9) return nf1.format(v / 1e9) + ' Mrd. $';
    if (v >= 1e6) return nf0.format(v / 1e6) + ' Mio. $';
    return nf0.format(v) + ' $';
  }

  function sektorenZeichnen() {
    var e = el('marktSektoren');
    if (!e) return;
    var reihen = STAND && STAND.sektoren ? (STAND.sektoren[ZEITRAUM] || []) : [];
    if (!reihen.length) {
      e.innerHTML = '<div class="loading">' +
        (ZEITRAUM === 't1' ? 'Noch keine Kurse geladen.'
          : 'Für diesen Zeitraum liegen noch keine Tagesreihen im Archiv' +
            (STAND && STAND.archivGrund ? ' (' + esc(STAND.archivGrund) + ')' : '') + '.') +
        '</div>';
      fussZeichnen();
      return;
    }
    /* Der laengste Balken bestimmt den Massstab. Eine feste Skala waere an einem
     * ruhigen Tag ein Bild ohne Balken und an einem wilden ein Bild voller Anschlaege;
     * der Massstab steht deshalb in der Fusszeile, damit die Laenge lesbar bleibt. */
    var max = 0;
    reihen.forEach(function (r) { if (Math.abs(r.pct) > max) max = Math.abs(r.pct); });
    if (!(max > 0)) max = 1;
    e.innerHTML = reihen.map(function (r) {
      var anteil = Math.min(50, Math.abs(r.pct) / max * 50);
      var stil = r.pct >= 0
        ? 'left:50%; width:' + anteil.toFixed(1) + '%; background:var(--up);'
        : 'right:50%; width:' + anteil.toFixed(1) + '%; background:var(--down);';
      return '<div class="sekzeile"><span class="nm" title="' + esc(r.sektor) + '">' + esc(r.sektor) + '</span>' +
        '<span class="bahn"><span class="mitte"></span><i style="' + stil + '"></i></span>' +
        '<span class="pz ' + cls(r.pct) + '">' + pz(r.pct) + '</span>' +
        '<span class="anz">' + nf0.format(r.n) + ' Werte</span></div>';
    }).join('');
    fussZeichnen(max);
  }
  function fussZeichnen(max) {
    var f = el('marktSektorenFuss');
    if (!f) return;
    if (!STAND) { f.innerHTML = ''; return; }
    var quelle = ZEITRAUM === 't1'
      ? 'Ein Tag: aus den laufenden Kursen (Vortagesschluss bis jetzt).'
      : (ZEITRAUM === 'w1' ? 'Eine Woche = 5 Handelstage' : 'Ein Monat = 21 Handelstage') +
        ': aus dem eigenen Tagesarchiv.';
    f.innerHTML = quelle +
      ' Gewichtet nach Marktkapitalisierung über ' + nf0.format(STAND.gezeigt) + ' von ' +
      nf0.format(STAND.universum) + ' Werten mit Stammdaten; ein Sektor unter drei Werten wird nicht gezeigt.' +
      (max ? ' Längster Balken: ' + pz(max) + '.' : '');
  }

  function hotZeile(w, wertHtml, titel) {
    return '<button type="button" class="hotzeile" data-marktsym="' + esc(w.sym) + '" data-marktname="' +
      esc(w.name || w.sym) + '" title="' + esc(titel || (w.name || w.sym)) + ' · Klick öffnet den Aktien-Explorer">' +
      '<span class="sym">' + esc(w.sym) + '</span>' + wertHtml + '</button>';
  }
  function liste(titel, zeilen, bauZeile, leerText) {
    var inhalt = (zeilen && zeilen.length)
      ? zeilen.map(bauZeile).join('')
      : '<div class="leer">' + esc(leerText) + '</div>';
    return '<div class="hotliste"><h3>' + esc(titel) + '</h3>' + inhalt + '</div>';
  }
  function hotlistsZeichnen() {
    var e = el('marktHotlists');
    if (!e) return;
    if (!STAND || !STAND.hotlists) { e.innerHTML = '<div class="loading">Noch keine Kurse geladen.</div>'; return; }
    var H = STAND.hotlists;
    function pctZeile(w) {
      return hotZeile(w, '<span class="wert ' + cls(w.pct) + '">' + pz(w.pct) + '</span>',
        (w.name || w.sym) + ' · ' + nf2.format(w.kurs) + ' $');
    }
    e.innerHTML =
      liste('Gewinner heute', H.gewinner, pctZeile, 'noch keine Kurse') +
      liste('Verlierer heute', H.verlierer, pctZeile, 'noch keine Kurse') +
      liste('Meist gehandelt (Umsatz)', H.umsatz, function (w) {
        return hotZeile(w, '<span class="wert">' + geld(w.umsatz) + '</span>',
          (w.name || w.sym) + ' · ' + nf0.format(w.volumen) + ' Stück');
      }, 'noch keine Umsätze') +
      liste('Ungewöhnliches Volumen', H.volumen, function (w) {
        return hotZeile(w, '<span class="wert">' + nf1.format(w.relVol) + '×</span>',
          (w.name || w.sym) + ' · heute ' + nf0.format(w.volumen) + ' Stück gegen den Median aus ' +
          nf0.format(w.relTage) + ' Handelstagen');
      }, 'kein Wert mit genug Tagen im Archiv') +
      liste('Am 52-Wochen-Hoch', H.hoch52, function (w) {
        return hotZeile(w, '<span class="wert ' + cls(w.pct) + '">' + pz(w.pct) + '</span>',
          (w.name || w.sym) + ' · Hoch ' + nf2.format(w.hoch52) + ' $, jetzt ' + nf2.format(w.kurs) + ' $');
      }, 'keiner am Hoch');
  }

  /* Vor Eroeffnung / nach Schluss kommt aus Yahoos startdatetimetype und nicht aus
   * der Uhrzeit - bei unbestaetigten Terminen setzt Yahoo die Uhrzeit frei. */
  var ART = { BMO: 'vor Eröffnung', AMC: 'nach Schluss', TAS: 'Zeit unbestätigt', TNS: 'Zeit unbestätigt' };
  function earningsZeichnen() {
    var e = el('marktEarnings');
    if (!e) return;
    if (!STAND) { e.innerHTML = '<div class="loading">Termine werden geholt …</div>'; return; }
    var t = STAND.earnings || [];
    if (!t.length) {
      var n = STAND.earningsNaechst;
      e.innerHTML = '<div class="loading">' +
        (STAND.earningsGrund ? 'Termine nicht erreichbar (' + esc(STAND.earningsGrund) + ').'
          : 'Heute und morgen berichtet keiner der gemeldeten Werte.' +
            (n && n.zeit ? ' Der nächste gemeldete Termin: ' + esc(n.sym) +
              ' am ' + new Date(n.zeit).toLocaleDateString('de-DE') + '.' : '')) + '</div>';
      return;
    }
    var heute = new Date().toISOString().slice(0, 10);
    e.innerHTML = t.map(function (x) {
      var tag = new Date(x.zeit).toISOString().slice(0, 10);
      var wann = tag === heute ? 'heute' : (tag > heute ? 'morgen' : 'vorbei');
      return '<div class="news-item"><div class="t">' +
        '<b>' + esc(x.sym) + '</b>' + (x.name ? ' ' + esc(x.name) : '') + '</div>' +
        '<div class="src"><span class="wann">' + esc(wann) + '</span><br>' +
        '<span class="art">' + esc(ART[x.art] || 'Zeit unbestätigt') + '</span></div></div>';
    }).join('');
  }

  function zeichnen() {
    sitzungZeichnen();
    sektorenZeichnen();
    hotlistsZeichnen();
    earningsZeichnen();
  }

  /* ---------------------------------------------------------------------------
   * Was fehlt, wird gesagt - nicht als leere Flaeche gezeigt */
  function stammFehlt(st) {
    setz('marktSektoren', '<div class="loading">Noch keine Stammdaten: die Sektor-Leiste braucht je Wert die ' +
      'Branche und die Anzahl ausstehender Aktien. Beides holt der Reiter <b>Markt → Marktkarte</b> mit einem Knopf.' +
      (st && st.grund ? ' (' + esc(st.grund) + ')' : '') + '</div>');
    setz('marktHotlists', '<div class="loading">Ohne Stammdaten gibt es keine Grundgesamtheit, aus der eine ' +
      'Hotlist entstehen könnte.</div>');
  }

  async function laden() {
    if (laeuft) return;
    laeuft = true;
    try {
      sitzungZeichnen();
      var MW = window.Marktwerte;
      if (!MW || !MU()) return;
      await MW.artenLaden();
      var st = await MW.stammLaden();
      if (!st || st.fehlt) { stammFehlt(st); return; }
      var a = MW.auswahl(UNIVERSUM);
      if (!a.liste.length) { stammFehlt(null); return; }
      await kurseHolen(a.liste);
      await tagesreihenHolen(a.liste);
      await earningsHolen();
      var neu = standRechnen(a);
      /* EIN HALBER LAUF LOESCHT DEN ALTEN STAND NICHT.
       * Ueber sechshundert der groessten Werte kann "kaum ein Kurs" nur eines
       * heissen: der Abruf ist nicht durchgekommen. Den gemerkten Stand dann zu
       * ueberschreiben, machte aus einer Stoerung einen leeren Markt - und der
       * Leser saehe den Unterschied nicht. Stehen bleibt der alte Stand MIT seinem
       * Zeitstempel, und der Grund steht in der Kopfzeile.
       * Die Haelfte ist dieselbe Schwelle, mit der renderer.js entscheidet, ob die
       * Kursquelle als gestoert gilt - eine zweite, andere Zahl fuer dieselbe Frage
       * waere eine Zahl zu viel. */
      var reicht = neu.gezeigt >= Math.max(1, Math.floor(neu.universum / 2));
      if (!reicht && STAND && STAND.gezeigt > neu.gezeigt) {
        kursGrund = 'nur ' + nf0.format(neu.gezeigt) + ' von ' + nf0.format(neu.universum) +
          ' Kursen angekommen – angezeigt ist der letzte vollständige Stand' +
          (kursGrund ? ' (' + kursGrund + ')' : '');
        letzterLauf = Date.now();
        zeichnen();
        return;
      }
      STAND = neu;
      /* Gemerkt wird der gezeichnete Stand, nicht die Rohdaten - genau wie beim
       * Vorboersen-Kasten. Beim naechsten Start steht damit etwas da, und es traegt
       * seinen Zeitstempel: eine Liste ohne Datum saehe aus wie von jetzt. */
      try { window.api.storeSet(STAND_KEY, STAND); } catch (e) { /* ohne Speicher geht es auch */ }
      letzterLauf = Date.now();
      zeichnen();
    } catch (e) {
      kursGrund = String((e && e.message) || e);
      sitzungZeichnen();
    } finally { laeuft = false; }
  }

  async function ausSpeicher() {
    try {
      var g = await window.api.storeGet(STAND_KEY);
      if (g && g.sektoren && g.hotlists) { STAND = g; zeichnen(); return; }
    } catch (e) { /* ohne Speicher startet der Reiter eben leer */ }
    zeichnen();
  }

  function taktenAn() {
    if (taktung) return;
    /* Fuenf Minuten, dieselbe Spanne wie die Frische des Zwischenspeichers und wie
     * die Marktkarte. Ausgesetzt wird nur bei unsichtbarem Fenster - dann sieht
     * ohnehin niemand hin, und der gemerkte Stand haelt bis zum Aufwachen. */
    taktung = setInterval(function () {
      sitzungZeichnen();
      if (document.hidden) return;
      if (Date.now() - letzterLauf >= FRISCH_MS) laden();
    }, 20000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var zr = el('marktSektorZeitraum');
    if (zr) {
      zr.addEventListener('click', function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest('button[data-zeitraum]') : null;
        if (!b) return;
        ZEITRAUM = b.getAttribute('data-zeitraum');
        [].slice.call(zr.querySelectorAll('button[data-zeitraum]')).forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
        /* Umschalten zeichnet NUR neu. Alle drei Zeitraeume stehen im selben Stand -
         * ein Abruf je Knopfdruck waere derselbe Fehler wie bei der Marktkarte vor
         * Issue #79: der Filter haengt am Netz statt an den Daten. */
        sektorenZeichnen();
      });
    }
    /* Ein Zuhoerer am Kasten statt dreissig an den Zeilen. */
    var hl = el('marktHotlists');
    if (hl) {
      hl.addEventListener('click', function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest('[data-marktsym]') : null;
        if (!b || !window.Explorer || !window.Explorer.oeffne) return;
        window.Explorer.oeffne(b.getAttribute('data-marktsym'), b.getAttribute('data-marktname'));
      });
    }
    /* Beim Oeffnen der Pille neu zeichnen: solange sie nicht gewaehlt ist, hat der
     * Kasten keine Breite, und die Balken stuenden beim ersten Blick falsch. Geholt
     * wird dabei nur, was aelter als fuenf Minuten ist. */
    document.addEventListener('sub-changed', function (ev) {
      var d = ev.detail || {};
      if (d.sub !== 'marktueberblick') return;
      taktenAn();
      zeichnen();
      if (Date.now() - letzterLauf >= FRISCH_MS) laden();
    });
    ausSpeicher();
    /* 14 Sekunden Vorlauf: davor holt die Kachelreihe ihre Kurse und die Marktkarte
     * ihren ersten Satz - genau die schoepft dieser Reiter ab. Wer frueher startet,
     * holt dieselben Kurse ein zweites Mal. */
    setTimeout(function () { if (!letzterLauf) laden(); }, 14000);
    taktenAn();
  });

  /* Nur fuer Proben und die Selbstpruefung - kein Bedienweg. */
  window.__marktUeberblickLaden = laden;
})();
