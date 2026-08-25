'use strict';
/* Die Marktkarte: Flaeche ist Groesse, Farbe ist der Tag.
 *
 * WAS SIE IST. Eine Uebersicht wie bei Finviz: jeder Wert ein Rechteck, die Flaeche
 * nach Marktkapitalisierung, die Farbe nach Tagesveraenderung, gruppiert nach Sektor.
 * Auf einen Blick sieht man, ob heute der ganze Markt faellt oder nur ein Sektor.
 *
 * WAS SIE NICHT IST. Kein Signal, keine Rangliste, keine Empfehlung. Bei Issue #63
 * stand der Satz, der auch hier gilt: eine Karte, die etwas ZEIGT, laedt zum Handeln
 * danach ein. Deshalb gibt es hier bewusst keine Sortierung nach "heissestem Sektor"
 * und keine Hervorhebung von Ausreissern - beides sieht aus wie ein Befund und ist
 * keiner. Gemessen ist an dieser Karte nichts; sie zeigt, was heute passiert ist.
 *
 * WARUM EIGENE DATEI. Die Aufteilung ist reine Rechnerei: Rechtecke rein, Rechtecke
 * raus, kein DOM, kein Netz, kein Zustand. Damit laeuft sie in Node und laesst sich
 * PRUEFEN - ob sich Kaestchen ueberlappen, ob die Flaechen wirklich den Groessen
 * entsprechen, ob bei null Werten nichts abstuerzt. Am Bildschirm faellt ein Fehler
 * von zwei Pixeln nicht auf; im Test schon.
 *
 * DAS VERFAHREN ist "squarified treemap" (Bruls, Huizing, van Wijk 2000). Der naive
 * Weg - immer abwechselnd waagerecht und senkrecht teilen - erzeugt bei ungleichen
 * Groessen lange duenne Striche, in denen kein Text mehr steht. Squarified nimmt
 * stattdessen Reihen auf und schliesst eine Reihe, sobald das Seitenverhaeltnis
 * schlechter wuerde. Ergebnis: moeglichst quadratische Kaestchen. */
(function (root) {

  /* Die Farbskala. Gedeckelt bei ±3 %: darueber wird nichts mehr unterscheidbar,
   * und ein einzelner Ausreisser wuerde sonst die ganze Karte blass aussehen lassen.
   * Bewusst nicht rot/gruen allein - der Helligkeitsunterschied traegt die Aussage
   * mit, damit die Karte auch fuer Rot-Gruen-Blinde lesbar bleibt. */
  var DECKEL = 3;

  function mische(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  /* Weisse Schrift braucht Kontrast 4,5:1 - das ist die Schwelle, die der Rest der
   * App auch einhaelt. Umgestellt heisst das: die Leuchtdichte des Grundes darf
   * hoechstens (1,05 / 4,5) - 0,05 = 0,1833 betragen. Etwas Rand dazu. */
  var MAX_LEUCHTE = 0.175;

  /** Farbe eines Kaestchens. pct = Tagesveraenderung in Prozent, null = unbekannt. */
  function farbe(pct) {
    if (pct == null || !isFinite(pct)) return { rgb: abdunkeln([96, 102, 112]), text: '#ffffff' };
    var t = Math.min(Math.abs(pct) / DECKEL, 1);
    var neutral = [78, 84, 94];
    var rgb = pct >= 0 ? mische(neutral, [42, 175, 92], t) : mische(neutral, [214, 58, 58], t);
    return { rgb: abdunkeln(rgb), text: '#ffffff' };
  }

  /** Relative Leuchtdichte nach WCAG. */
  function leuchtdichte(rgb) {
    var c = rgb.map(function (v) {
      var s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  /** Den Grund so weit abdunkeln, dass weisse Schrift darauf sicher lesbar ist.
   *
   *  Der erste Wurf hat stattdessen je nach Helligkeit zwischen schwarzer und weisser
   *  Schrift gewaehlt. Das reichte nicht: Bei mittlerem Gruen kam WEDER Schwarz noch
   *  Weiss ueber 4,5:1 - der Test fand 4,44 bei +2 %. Eine Farbe, auf der keine
   *  Schrift lesbar ist, laesst sich nicht durch die Wahl der Schrift retten; sie
   *  muss sich aendern. Der Farbton bleibt dabei erhalten, nur die Helligkeit sinkt. */
  function abdunkeln(rgb) {
    var f = 1;
    for (var i = 0; i < 40 && leuchtdichte(rgb.map(function (v) { return Math.round(v * f); })) > MAX_LEUCHTE; i++) {
      f -= 0.02;
    }
    return rgb.map(function (v) { return Math.max(0, Math.round(v * f)); });
  }

  function seitenVerhaeltnis(reihe, laenge, summe) {
    /* Das schlechteste Seitenverhaeltnis der Reihe - danach entscheidet das Verfahren,
     * ob noch ein Kaestchen dazu passt oder die Reihe geschlossen wird. */
    var max = 0, min = Infinity;
    for (var i = 0; i < reihe.length; i++) {
      if (reihe[i].wert > max) max = reihe[i].wert;
      if (reihe[i].wert < min) min = reihe[i].wert;
    }
    if (!summe || !min) return Infinity;
    var l2 = laenge * laenge, s2 = summe * summe;
    return Math.max(l2 * max / s2, s2 / (l2 * min));
  }

  /** Squarified treemap. posten: [{ wert, ...beliebig }], rechteck: {x,y,b,h}
   *  Rueckgabe: dieselben Objekte mit x, y, b, h - in derselben Reihenfolge wie
   *  hineingegeben, damit der Aufrufer sie zuordnen kann. */
  function aufteilen(posten, rechteck) {
    var liste = (posten || []).filter(function (p) { return p && p.wert > 0; })
      .map(function (p, i) { return { p: p, wert: p.wert, i: i }; })
      .sort(function (a, b) { return b.wert - a.wert; });
    var out = [];
    if (!liste.length) return out;

    var flaeche = rechteck.b * rechteck.h;
    var gesamt = liste.reduce(function (a, x) { return a + x.wert; }, 0);
    if (!(flaeche > 0) || !(gesamt > 0)) return out;
    /* Auf Flaeche umrechnen: ab hier ist "wert" ein Flaechenanteil in Pixeln, und
     * die Rechnung bleibt unabhaengig von der Groessenordnung der Eingabe. */
    liste.forEach(function (x) { x.wert = x.wert / gesamt * flaeche; });

    var x = rechteck.x, y = rechteck.y, b = rechteck.b, h = rechteck.h;
    var reihe = [], reihenSumme = 0;
    var k = 0;

    function reiheSetzen() {
      var kurz = Math.min(b, h);
      var dicke = reihenSumme / kurz;
      var pos = 0;
      for (var i = 0; i < reihe.length; i++) {
        var teil = reihe[i].wert / reihenSumme * kurz;
        if (b >= h) out.push({ p: reihe[i].p, i: reihe[i].i, x: x, y: y + pos, b: dicke, h: teil });
        else out.push({ p: reihe[i].p, i: reihe[i].i, x: x + pos, y: y, b: teil, h: dicke });
        pos += teil;
      }
      if (b >= h) { x += dicke; b -= dicke; } else { y += dicke; h -= dicke; }
      reihe = []; reihenSumme = 0;
    }

    while (k < liste.length) {
      var kurzSeite = Math.min(b, h);
      if (!(kurzSeite > 0)) break;
      var naechst = liste[k];
      var jetzt = reihe.length ? seitenVerhaeltnis(reihe, kurzSeite, reihenSumme) : Infinity;
      var mitNeu = seitenVerhaeltnis(reihe.concat([naechst]), kurzSeite, reihenSumme + naechst.wert);
      if (!reihe.length || mitNeu <= jetzt) {
        reihe.push(naechst); reihenSumme += naechst.wert; k++;
      } else {
        reiheSetzen();
      }
    }
    if (reihe.length) reiheSetzen();

    /* Zurueck in die Eingabereihenfolge - der Aufrufer soll nicht suchen muessen. */
    out.sort(function (a, c) { return a.i - c.i; });
    return out.map(function (r) {
      return { wert: r.p.wert, daten: r.p, x: r.x, y: r.y, b: r.b, h: r.h };
    });
  }

  /** Nach Sektor buendeln. Die Reihenfolge der Sektoren ist die nach Gesamtgroesse -
   *  das ist keine Wertung, sondern sorgt dafuer, dass die grossen Bloecke oben links
   *  liegen und die Karte nicht bei jeder Aktualisierung umspringt. */
  function buendeln(werte) {
    var proSektor = {};
    (werte || []).forEach(function (w) {
      if (!w || !(w.groesse > 0)) return;
      var s = w.sektor || 'Sonstige';
      if (!proSektor[s]) proSektor[s] = { sektor: s, wert: 0, kinder: [] };
      proSektor[s].wert += w.groesse;
      proSektor[s].kinder.push({ wert: w.groesse, sym: w.sym, name: w.name, pct: w.pct });
    });
    return Object.keys(proSektor).map(function (s) { return proSektor[s]; })
      .sort(function (a, b) { return b.wert - a.wert; });
  }

  /** Die ganze Karte: erst die Sektoren aufteilen, dann in jedem die Werte.
   *  rand = Abstand zwischen den Sektorbloecken, kopf = Platz fuer die Sektor-
   *  ueberschrift. Beides in Pixeln. */
  function baue(werte, breite, hoehe, o) {
    o = o || {};
    var rand = o.rand == null ? 3 : o.rand;
    var kopf = o.kopf == null ? 16 : o.kopf;
    var bloecke = aufteilen(buendeln(werte), { x: 0, y: 0, b: breite, h: hoehe });
    return bloecke.map(function (bl) {
      var innen = {
        x: bl.x + rand, y: bl.y + rand + kopf,
        b: Math.max(0, bl.b - 2 * rand), h: Math.max(0, bl.h - 2 * rand - kopf)
      };
      return {
        sektor: bl.daten.sektor, wert: bl.wert,
        x: bl.x, y: bl.y, b: bl.b, h: bl.h,
        kinder: aufteilen(bl.daten.kinder, innen)
      };
    });
  }

  var Marktkarte = {
    DECKEL: DECKEL, MAX_LEUCHTE: MAX_LEUCHTE, farbe: farbe, abdunkeln: abdunkeln, leuchtdichte: leuchtdichte,
    aufteilen: aufteilen, buendeln: buendeln, baue: baue
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Marktkarte; return; }
  root.Marktkarte = Marktkarte;
})(typeof window !== 'undefined' ? window : globalThis);
