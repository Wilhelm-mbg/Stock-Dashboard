'use strict';
/* ================= Zeichnungen im Chart: die Rechnung, ohne Fenster =============
 *
 * Wozu es diese Datei gibt (Aktien-Viewer 8c, 05.09.2026): Wilhelm will im Chart
 * zeichnen koennen - Linien, Rechtecke, Fibonacci, ein Messwerkzeug. Jede dieser
 * Zeichnungen ist eine RECHNUNG (wo liegt sie, was trifft der Zeiger, welches
 * Niveau steht bei 61,8), und eine Rechnung, die nur im Renderer steht, laesst
 * sich nicht pruefen. Deshalb steht sie hier, und in explorer.js steht nur die
 * Bedienung.
 *
 * Diese Datei hat kein window, kein document, kein Netz, keinen Speicher; sie
 * schreibt nichts und loest nichts aus. Sie zeichnet in einen Zeichenkontext, den
 * der AUFRUFER hereingibt - in Node laesst sich dafuer eine Attrappe einsetzen.
 *
 * DIE ZEICHNUNGEN LEBEN IN DATEN-KOORDINATEN, nie in Pixeln:
 *
 *     {id, art, punkte:[{t, kurs}], stil:{farbe, breite, linienart},
 *      text, gesperrt, sichtbar}
 *
 * `t` ist ein Zeitstempel in ms, `kurs` ein Kurs. Wer eine Zeichnung in Pixeln
 * ablegt, hat sie beim naechsten Zoom verloren: dieselbe Linie saesse nach einem
 * Radklick auf einem anderen Kurs, und der Chart behauptete etwas, das nie
 * gezeichnet wurde. Pixel entstehen erst in `projektion()`, aus der Skala des
 * Kerzencharts - es gibt KEINE zweite Skala in diesem Programm.
 *
 * DIE BRUECKE ZEIT <-> PIXEL ist der Bruchindex. `skala()` in kerzenchart.js
 * rechnet ueber den INDEX der Kerze (x(i)), nicht ueber die Zeit - und das ist
 * richtig so: die Kerzen sitzen auf gleichen Faechern, obwohl zwischen Freitag und
 * Montag zwei Tage liegen. Eine Zeichnung muss deshalb ihren Zeitstempel erst in
 * einen Bruchindex uebersetzen (`indexVonZeit`), und der haengt an der Kerzenreihe,
 * die gerade im Bild ist.
 *
 * WAS SIE NICHT IST: kein Signal, keine Auswahl, kein Handelscode. Aus einer
 * Zeichnung folgt nichts - der Viewer bewertet nichts und handelt nichts. Alles
 * Simulation, keine Anlageberatung.
 */
(function (root) {

  function zahl(v) { return typeof v === 'number' && isFinite(v); }
  function kerzeOk(k) { return Array.isArray(k) && k.length >= 2 && zahl(k[0]) && zahl(k[1]); }

  /* ---------------------------------------------------------------------------
   * 1) Der Katalog der Werkzeuge
   *
   * EINE Tabelle, aus der Leiste, Tastenkuerzel, Punktzahl und Pruefung kommen.
   * Stuende die Punktzahl einmal hier und einmal beim Zeichnen, waere die zweite
   * Stelle die, die man beim naechsten Werkzeug vergisst.
   *
   * `punkte` ist die Zahl der Klicks, die eine Zeichnung braucht; `0` heisst
   * "beliebig viele" (Pinsel, endet mit Doppelklick oder Esc).
   *
   * Die Tastenkuerzel folgen TradingView, wo es dort welche gibt (Alt+F fuer
   * Fibonacci, Alt+Umschalt+R fuer das Rechteck); der Rest ist der Anfangsbuchstabe
   * des deutschen Namens. Sie stehen als DATEN hier, nicht als Zweige in einer
   * Tastaturbehandlung - sonst kennt die Leiste andere Kuerzel als die Tastatur. */
  var ARTEN = {
    linie:          { punkte: 2, name: 'Linie',            zeichen: '╱', taste: { code: 'KeyT', alt: true } },
    horizontale:    { punkte: 1, name: 'Horizontale',      zeichen: '─', taste: { code: 'KeyH', alt: true } },
    vertikale:      { punkte: 1, name: 'Vertikale',        zeichen: '│', taste: { code: 'KeyV', alt: true } },
    rechteck:       { punkte: 2, name: 'Rechteck',         zeichen: '▭', taste: { code: 'KeyR', alt: true, shift: true } },
    pfeil:          { punkte: 2, name: 'Pfeil',            zeichen: '↗', taste: { code: 'KeyA', alt: true } },
    text:           { punkte: 1, name: 'Text',             zeichen: 'T', taste: { code: 'KeyX', alt: true } },
    pinsel:         { punkte: 0, name: 'Pinsel',           zeichen: '✎', taste: { code: 'KeyB', alt: true } },
    messung:        { punkte: 2, name: 'Messwerkzeug',     zeichen: '⇕', taste: { code: 'KeyM', alt: true }, fluechtig: true },
    fibRetracement: { punkte: 2, name: 'Fib-Retracement',  zeichen: 'F', taste: { code: 'KeyF', alt: true }, fib: true },
    fibErweiterung: { punkte: 3, name: 'Fib-Erweiterung (trendbasiert)', zeichen: 'F₃', fib: true },
    fibKanal:       { punkte: 3, name: 'Fib-Kanal',        zeichen: 'F∥', fib: true },
    fibZeitzonen:   { punkte: 2, name: 'Fib-Zeitzonen',    zeichen: 'F⏱', fib: true },
    fibFaecher:     { punkte: 2, name: 'Fib-Fächer',       zeichen: 'F◺', fib: true }
  };
  var ART_LISTE = Object.keys(ARTEN);

  /* Die Fibonacci-Niveaus in Prozent. 78,6 ist die Wurzel aus 61,8 und steht bei
   * TradingView mit in der Vorgabe; 50 ist gar keine Fibonacci-Zahl, sondern
   * Gewohnheit - beides bleibt drin, weil der Chart zeigt, was Wilhelm gewohnt ist.
   * GEMESSEN IST AN DIESEN NIVEAUS NICHTS. Sie sind Anzeige, kein Signal. */
  var FIB_NIVEAUS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 161.8, 261.8];
  /* Fuer die Zeitzonen zaehlt die Folge selbst, nicht ihr Verhaeltnis. */
  var FIB_ZAHLEN = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

  var LINIENARTEN = ['voll', 'gestrichelt', 'gepunktet'];
  var STRICHE = { voll: [], gestrichelt: [6, 4], gepunktet: [1, 3] };
  var MAGNET_MODI = ['aus', 'schwach', 'stark'];
  var STIL_VORGABE = { farbe: '#2563eb', breite: 1.5, linienart: 'voll' };
  /* Wie nah der Zeiger sein muss, damit eine Zeichnung als getroffen gilt, und wie
   * gross die Griffe sind - in Pixeln, weil beides eine Frage der Hand ist und
   * nicht des Kurses. An EINER Stelle, damit Treffertest und Zeichnung dieselbe
   * Zahl benutzen: ein Griff, der groesser gemalt als getroffen wird, ist ein Griff,
   * den man nicht fassen kann. */
  var TREFFER_PX = 6;
  var GRIFF_PX = 4;

  /* ---------------------------------------------------------------------------
   * 2) Anlegen und pruefen
   *
   * Die Kennung ist ein Zaehler, keine Zufallszahl: dieselbe Folge von Aufrufen
   * gibt dieselben Kennungen, sonst waere keine Pruefung wiederholbar. Beim Lesen
   * aus dem Speicher wird der Zaehler ueber die groesste vorhandene Kennung
   * gehoben - sonst bekaeme die naechste Zeichnung die Kennung einer alten. */
  var zaehler = 0;
  function neueKennung() { zaehler++; return 'z' + zaehler; }
  function zaehlerAngleichen(liste) {
    (liste || []).forEach(function (z) {
      var m = /^z(\d+)$/.exec(z && z.id);
      if (m && Number(m[1]) > zaehler) zaehler = Number(m[1]);
    });
  }

  function punktOk(p) { return !!p && zahl(p.t) && zahl(p.kurs); }
  function punkteKopie(punkte) {
    return (punkte || []).filter(punktOk).map(function (p) { return { t: p.t, kurs: p.kurs }; });
  }
  var HEX = /^#[0-9a-fA-F]{6}$/;

  function neu(art, punkte, stil, text) {
    if (!ARTEN[art]) return null;
    var s = stil || {};
    return {
      id: neueKennung(),
      art: art,
      punkte: punkteKopie(punkte),
      stil: {
        farbe: HEX.test(s.farbe) ? s.farbe : STIL_VORGABE.farbe,
        breite: s.breite > 0 ? s.breite : STIL_VORGABE.breite,
        linienart: LINIENARTEN.indexOf(s.linienart) >= 0 ? s.linienart : STIL_VORGABE.linienart
      },
      text: text == null ? '' : String(text),
      gesperrt: false,
      sichtbar: true
    };
  }

  /** Hat die Zeichnung ihre Punkte beisammen? Der Pinsel (0 = beliebig viele)
   *  braucht mindestens zwei, sonst waere er ein Punkt. */
  function vollstaendig(z) {
    if (!z || !ARTEN[z.art]) return false;
    var n = ARTEN[z.art].punkte;
    var haben = (z.punkte || []).length;
    return n === 0 ? haben >= 2 : haben >= n;
  }

  /** Modellpruefung MIT GRUND. Ein stilles `false` waere beim Lesen aus dem
   *  Speicher genau die Stelle, an der eine kaputte Zeichnung unsichtbar
   *  verschwindet - und niemand wuesste, warum seine Linie weg ist. */
  function gueltig(z) {
    if (!z || typeof z !== 'object') return { ok: false, grund: 'keine Zeichnung' };
    if (!ARTEN[z.art]) return { ok: false, grund: 'unbekannte Art: ' + String(z && z.art) };
    if (!z.id) return { ok: false, grund: 'ohne Kennung' };
    var pp = z.punkte;
    if (!Array.isArray(pp) || !pp.length) return { ok: false, grund: 'ohne Punkte' };
    for (var i = 0; i < pp.length; i++) {
      if (!punktOk(pp[i])) return { ok: false, grund: 'Punkt ' + (i + 1) + ' ist kein {t, kurs}' };
    }
    var soll = ARTEN[z.art].punkte;
    if (soll === 0 ? pp.length < 2 : pp.length !== soll) {
      return { ok: false, grund: z.art + ' braucht ' + (soll === 0 ? 'mindestens 2' : soll) + ' Punkte, hat ' + pp.length };
    }
    var s = z.stil || {};
    if (!HEX.test(s.farbe)) return { ok: false, grund: 'Farbe ist kein Hexwert: ' + String(s.farbe) };
    if (!(s.breite > 0) || s.breite > 12) return { ok: false, grund: 'Breite ausserhalb 0-12: ' + String(s.breite) };
    if (LINIENARTEN.indexOf(s.linienart) < 0) return { ok: false, grund: 'unbekannte Linienart: ' + String(s.linienart) };
    return { ok: true, grund: null };
  }

  /* ---------------------------------------------------------------------------
   * 3) Die Bruecke Zeit <-> Bruchindex
   *
   * Zwischen zwei Kerzen wird linear geteilt: liegt ein Zeitstempel auf halbem Weg
   * zwischen Kerze 7 und Kerze 8, ist sein Index 7,5. Damit sitzt eine Linie, die
   * mitten in einer Kerze angefasst wurde, nach dem Zoomen wieder mitten in
   * derselben Kerze.
   *
   * AUSSERHALB DER REIHE WIRD GERATEN, und zwar mit dem mittleren Kerzenabstand des
   * Bildes. Das ist ehrlich, aber es ist geraten: ueber ein Wochenende ist der
   * mittlere Abstand zu gross, ueber eine Mittagspause zu klein. Eine Zeichnung,
   * die aus dem Bild herausragt, verschiebt sich deshalb beim Blaettern leicht -
   * sobald ihr Ankerpunkt wieder in der Reihe liegt, sitzt sie exakt. Die
   * Alternative waere, sie am Rand festzukleben, und das waere eine Behauptung
   * ueber eine Zeit, die das Bild gar nicht zeigt. */
  function mittlererAbstand(ks) {
    var n = ks.length;
    if (n < 2) return 0;
    var d = (ks[n - 1][0] - ks[0][0]) / (n - 1);
    return d > 0 ? d : 0;
  }
  function indexVonZeit(kerzen, t) {
    var ks = (kerzen || []).filter(kerzeOk);
    var n = ks.length;
    if (!n || !zahl(t)) return null;
    if (n === 1) return 0;
    var d = mittlererAbstand(ks);
    if (t <= ks[0][0]) return d > 0 ? (t - ks[0][0]) / d : 0;
    if (t >= ks[n - 1][0]) return d > 0 ? (n - 1) + (t - ks[n - 1][0]) / d : n - 1;
    var lo = 0, hi = n - 1, m;
    while (hi - lo > 1) {
      m = (lo + hi) >> 1;
      if (ks[m][0] <= t) lo = m; else hi = m;
    }
    var spanne = ks[hi][0] - ks[lo][0];
    return spanne > 0 ? lo + (t - ks[lo][0]) / spanne : lo;
  }
  function zeitVonIndex(kerzen, fi) {
    var ks = (kerzen || []).filter(kerzeOk);
    var n = ks.length;
    if (!n || !zahl(fi)) return null;
    if (n === 1) return ks[0][0];
    var d = mittlererAbstand(ks);
    if (fi <= 0) return ks[0][0] + fi * d;
    if (fi >= n - 1) return ks[n - 1][0] + (fi - (n - 1)) * d;
    var i = Math.floor(fi), r = fi - i;
    return ks[i][0] + (ks[i + 1][0] - ks[i][0]) * r;
  }

  /** Die Projektion: Daten -> Pixel und zurueck, gebaut aus der Kerzenreihe im Bild
   *  und der Skala des Kerzencharts. Der KURS geht durch `sk.y`/`sk.kurs` und wird
   *  hier NICHT nachgerechnet - stellt die Skala eines Tages auf logarithmisch um,
   *  folgen die Zeichnungen ohne eine Zeile hier. Genau dafuer gibt es nur eine
   *  Skala. */
  function projektion(kerzen, sk) {
    if (!sk) return null;
    return {
      x: function (t) {
        var fi = indexVonZeit(kerzen, t);
        return fi == null ? null : sk.links + (fi + 0.5) * sk.dx;
      },
      t: function (px) { return zeitVonIndex(kerzen, (px - sk.links) / sk.dx - 0.5); },
      y: function (kurs) { return sk.y(kurs); },
      kurs: function (py) { return sk.kurs(py); },
      index: function (t) { return indexVonZeit(kerzen, t); },
      /* Die Raender des Zeichenfelds - Horizontale und Vertikale brauchen sie. */
      xVon: sk.links,
      xBis: sk.breite - sk.rechts,
      yVon: sk.oben,
      yBis: sk.oben + sk.kursHoehe + sk.volHoehe,
      yKursBis: sk.oben + sk.kursHoehe
    };
  }

  /** Ein Punkt aus Pixeln - der Weg, den jeder Klick nimmt. */
  function punktAusPixel(kerzen, sk, px, py) {
    var pr = projektion(kerzen, sk);
    if (!pr) return null;
    var t = pr.t(px), kurs = pr.kurs(py);
    return (zahl(t) && zahl(kurs)) ? { t: t, kurs: kurs } : null;
  }

  /* ---------------------------------------------------------------------------
   * 4) Der Magnet
   *
   * STARK faengt immer: der Punkt springt auf den naechstgelegenen der vier Werte
   * der naechsten Kerze (Eroeffnung, Hoch, Tief, Schluss) und auf deren Stempel.
   * SCHWACH faengt nur, wenn er ohnehin schon nah dran ist - `toleranz` ist die
   * Naehe in KURS-Einheiten, die der Aufrufer aus ein paar Pixeln rechnet (die Hand
   * zielt in Pixeln, nicht in Dollar).
   * AUS gibt den Punkt unveraendert zurueck.
   *
   * Gefangen wird immer beides, Zeit und Kurs: ein Punkt, der auf dem Hoch sitzt,
   * aber zwischen zwei Kerzen, sitzt auf nichts. */
  function fangen(kerzen, punkt, modus, toleranz) {
    if (!punktOk(punkt)) return null;
    if (modus !== 'schwach' && modus !== 'stark') return { t: punkt.t, kurs: punkt.kurs };
    var ks = (kerzen || []).filter(kerzeOk);
    if (!ks.length) return { t: punkt.t, kurs: punkt.kurs };
    var fi = indexVonZeit(ks, punkt.t);
    var i = Math.max(0, Math.min(ks.length - 1, Math.round(fi)));
    var k = ks[i];
    var werte = [k[1]];
    if (zahl(k[3])) werte.push(k[3]);
    if (zahl(k[4])) werte.push(k[4]);
    if (zahl(k[5])) werte.push(k[5]);
    var besterKurs = werte[0], besterAbstand = Math.abs(werte[0] - punkt.kurs);
    werte.forEach(function (v) {
      var a = Math.abs(v - punkt.kurs);
      if (a < besterAbstand) { besterAbstand = a; besterKurs = v; }
    });
    if (modus === 'schwach' && !(besterAbstand <= (toleranz > 0 ? toleranz : 0))) {
      return { t: punkt.t, kurs: punkt.kurs };     // zu weit weg - nicht anfassen
    }
    return { t: k[0], kurs: besterKurs, gefangen: true };
  }

  /* ---------------------------------------------------------------------------
   * 5) Fibonacci
   *
   * ALLES HIER IST ANZEIGE. Das Projekt hat an Fibonacci-Niveaus nichts gemessen,
   * und aus keinem dieser Niveaus folgt ein Handel.
   *
   * RETRACEMENT aus zwei Punkten: Niveau 0 liegt auf dem ZWEITEN Punkt (dem Ende
   * der Bewegung), Niveau 100 auf dem ersten. Ein Rueckgang von 61,8 % einer
   * Bewegung von 100 auf 200 steht damit bei 138,2 - so herum, wie TradingView es
   * zeichnet und wie man es liest ("der Kurs ist auf 61,8 zurueckgekommen"). */
  function fibNiveaus(p1, p2, niveaus) {
    if (!punktOk(p1) || !punktOk(p2)) return [];
    var spanne = p2.kurs - p1.kurs;
    return (niveaus || FIB_NIVEAUS).map(function (n) {
      return { niveau: n, kurs: p2.kurs - (n / 100) * spanne };
    });
  }

  /** TRENDBASIERTE ERWEITERUNG aus drei Punkten: die Bewegung 1->2 wird vom
   *  dritten Punkt aus abgetragen. Niveau 0 liegt auf Punkt 3, Niveau 100 eine
   *  volle Bewegung darueber (bzw. darunter, wenn es abwaerts ging). */
  function fibErweiterung(p1, p2, p3, niveaus) {
    if (!punktOk(p1) || !punktOk(p2) || !punktOk(p3)) return [];
    var spanne = p2.kurs - p1.kurs;
    return (niveaus || FIB_NIVEAUS).map(function (n) {
      return { niveau: n, kurs: p3.kurs + (n / 100) * spanne };
    });
  }

  /** ZEITZONEN aus zwei Punkten: der Abstand der beiden Punkte ist EIN Schritt,
   *  und die Senkrechten stehen bei den Fibonacci-Vielfachen davon. Gerechnet wird
   *  in KERZEN, nicht in Millisekunden - sonst saessen die Linien ueber Nacht und
   *  am Wochenende neben den Kerzen, auf die sie zeigen sollen. */
  function fibZeitzonen(kerzen, p1, p2, zahlen) {
    if (!punktOk(p1) || !punktOk(p2)) return [];
    var i1 = indexVonZeit(kerzen, p1.t), i2 = indexVonZeit(kerzen, p2.t);
    if (i1 == null || i2 == null) return [];
    var schritt = i2 - i1;
    if (!schritt) return [];
    return (zahlen || FIB_ZAHLEN).map(function (f) {
      var idx = i1 + f * schritt;
      return { zahl: f, index: idx, t: zeitVonIndex(kerzen, idx) };
    });
  }

  /** FAECHER aus zwei Punkten: Strahlen aus Punkt 1 durch die Fibonacci-Teilung der
   *  Senkrechten ueber Punkt 2. Die Steigung steht in KURS JE KERZE - dieselbe
   *  Einheit, in der der Chart seine Faecher zeichnet. Der Strahl zu Niveau 0
   *  laeuft durch Punkt 2 selbst, der zu Niveau 100 waagerecht aus Punkt 1 heraus. */
  function fibFaecher(kerzen, p1, p2, niveaus) {
    if (!punktOk(p1) || !punktOk(p2)) return [];
    var i1 = indexVonZeit(kerzen, p1.t), i2 = indexVonZeit(kerzen, p2.t);
    if (i1 == null || i2 == null || i1 === i2) return [];
    var dI = i2 - i1;
    return fibNiveaus(p1, p2, niveaus).map(function (n) {
      return { niveau: n.niveau, steigung: (n.kurs - p1.kurs) / dI, kursBeiP2: n.kurs };
    });
  }

  /** KANAL aus drei Punkten: 1->2 ist die Grundlinie (Niveau 0), Punkt 3 gibt die
   *  Breite (Niveau 100). Die uebrigen Niveaus liegen parallel dazwischen und
   *  darueber hinaus. Gerechnet wird der Versatz SENKRECHT IN KURS an der Stelle
   *  von Punkt 3 - im Bild sind die Linien damit parallel, und genau so sieht man
   *  einen Kanal an. */
  function fibKanal(kerzen, p1, p2, p3, niveaus) {
    if (!punktOk(p1) || !punktOk(p2) || !punktOk(p3)) return [];
    var i1 = indexVonZeit(kerzen, p1.t), i2 = indexVonZeit(kerzen, p2.t), i3 = indexVonZeit(kerzen, p3.t);
    if (i1 == null || i2 == null || i3 == null || i1 === i2) return [];
    var steigung = (p2.kurs - p1.kurs) / (i2 - i1);
    var aufGrundlinie = p1.kurs + steigung * (i3 - i1);
    var versatz = p3.kurs - aufGrundlinie;
    return (niveaus || FIB_NIVEAUS).map(function (n) {
      var v = (n / 100) * versatz;
      return {
        niveau: n, steigung: steigung,
        von: { t: p1.t, kurs: p1.kurs + v },
        bis: { t: p2.t, kurs: p2.kurs + v }
      };
    });
  }

  /* ---------------------------------------------------------------------------
   * 6) Das Messwerkzeug
   *
   * Genau die Box, die TradingView zeigt: Kursdifferenz absolut und in Prozent,
   * die Zahl der Kerzen dazwischen, die Dauer und das Volumen im gemessenen
   * Abschnitt.
   *
   * ZWEI ZAEHLUNGEN, die man nicht verwechseln darf: `kerzen` ist die SPANNE
   * (Abstand der beiden Anker in Kerzen, wie "45 bars" bei TradingView), `volumen`
   * summiert die Kerzen im Abschnitt EINSCHLIESSLICH beider Enden. Wer die Spanne
   * fuer die Zahl der summierten Kerzen haelt, rechnet um eine Kerze daneben; die
   * Rueckgabe nennt beide (`volumenKerzen`), damit die Anzeige nicht raten muss.
   *
   * Ohne Volumen in den Kerzen kommt `null` zurueck, nicht 0 - eine Null waere die
   * Behauptung, es sei nichts gehandelt worden. */
  function messung(kerzen, p1, p2) {
    if (!punktOk(p1) || !punktOk(p2)) return null;
    var ks = (kerzen || []).filter(kerzeOk);
    var i1 = indexVonZeit(ks, p1.t), i2 = indexVonZeit(ks, p2.t);
    var diff = p2.kurs - p1.kurs;
    var prozent = p1.kurs !== 0 ? (diff / Math.abs(p1.kurs)) * 100 : null;
    var vonI = null, bisI = null, volumen = null, volKerzen = 0;
    if (i1 != null && i2 != null && ks.length) {
      vonI = Math.max(0, Math.min(ks.length - 1, Math.round(Math.min(i1, i2))));
      bisI = Math.max(0, Math.min(ks.length - 1, Math.round(Math.max(i1, i2))));
      for (var i = vonI; i <= bisI; i++) {
        if (zahl(ks[i][2])) { volumen = (volumen || 0) + ks[i][2]; volKerzen++; }
      }
    }
    return {
      kursVon: p1.kurs, kursBis: p2.kurs,
      diff: diff, prozent: prozent,
      kerzen: (i1 != null && i2 != null) ? Math.abs(Math.round(i2) - Math.round(i1)) : null,
      dauerMs: p2.t - p1.t,
      dauerText: dauerText(p2.t - p1.t),
      volumen: volumen, volumenKerzen: volKerzen,
      aufwaerts: diff >= 0
    };
  }

  /** Dauer als Wort. Rein: keine Uhr, keine Zeitzone - nur die Differenz. */
  function dauerText(ms) {
    if (!zahl(ms)) return '';
    var v = Math.abs(ms);
    var min = Math.round(v / 60000);
    if (min < 60) return min + ' Min';
    var std = Math.floor(min / 60), restMin = min % 60;
    if (std < 24) return std + ' Std' + (restMin ? ' ' + restMin + ' Min' : '');
    var tage = Math.floor(std / 24), restStd = std % 24;
    return tage + ' T' + (restStd ? ' ' + restStd + ' Std' : '');
  }

  /* ---------------------------------------------------------------------------
   * 7) Geometrie: EIN Ort fuer das, was man sieht, und das, was man trifft
   *
   * Diese Funktion uebersetzt eine Zeichnung in Pixel-Bausteine. Sowohl der
   * Zeichner (Abschnitt 9) als auch der Treffertest (Abschnitt 8) benutzen SIE -
   * und zwar dieselbe. Zwei Rechnungen waeren zwei Wahrheiten darueber, wo eine
   * Linie liegt, und man merkte es erst daran, dass man neben seine eigene Linie
   * klickt.
   *
   * Zurueck kommen Segmente (Strecken), Kaesten, Texte, Pfeilspitzen und Griffe -
   * alles in Pixeln der hereingereichten Skala. */
  function pkt(pr, p) { return { x: pr.x(p.t), y: pr.y(p.kurs) }; }

  function geometrie(z, kerzen, sk) {
    var leer = { segmente: [], kaesten: [], texte: [], spitzen: [], griffe: [] };
    if (!z || !ARTEN[z.art] || !sk) return leer;
    var pr = projektion(kerzen, sk);
    if (!pr) return leer;
    var pp = (z.punkte || []).filter(punktOk);
    if (!pp.length) return leer;
    var g = { segmente: [], kaesten: [], texte: [], spitzen: [], griffe: [] };
    var P = pp.map(function (p) { return pkt(pr, p); });
    P.forEach(function (q) { g.griffe.push({ x: q.x, y: q.y }); });
    var a = P[0], b = P[1], c = P[2];

    switch (z.art) {
      case 'linie':
      case 'pfeil':
        if (!b) break;
        g.segmente.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        if (z.art === 'pfeil') g.spitzen.push({ x: b.x, y: b.y, winkel: Math.atan2(b.y - a.y, b.x - a.x) });
        break;

      case 'horizontale':
        g.segmente.push({ x1: pr.xVon, y1: a.y, x2: pr.xBis, y2: a.y });
        g.texte.push({ x: pr.xBis, y: a.y, text: null, kurs: pp[0].kurs, rechts: true });
        break;

      case 'vertikale':
        g.segmente.push({ x1: a.x, y1: pr.yVon, x2: a.x, y2: pr.yBis });
        break;

      case 'rechteck':
        if (!b) break;
        var rx = Math.min(a.x, b.x), ry = Math.min(a.y, b.y);
        var rb = Math.abs(b.x - a.x), rh = Math.abs(b.y - a.y);
        g.kaesten.push({ x: rx, y: ry, breite: rb, hoehe: rh });
        /* Die vier Kanten als Segmente - der Treffertest fasst das Rechteck an
         * seinem Rand an, nicht an seiner Flaeche: sonst waere ein grosses
         * Rechteck eine Falle, die jeden Klick darunter verschluckt. */
        g.segmente.push({ x1: rx, y1: ry, x2: rx + rb, y2: ry });
        g.segmente.push({ x1: rx + rb, y1: ry, x2: rx + rb, y2: ry + rh });
        g.segmente.push({ x1: rx + rb, y1: ry + rh, x2: rx, y2: ry + rh });
        g.segmente.push({ x1: rx, y1: ry + rh, x2: rx, y2: ry });
        break;

      case 'text':
        g.texte.push({ x: a.x, y: a.y, text: z.text || '' });
        break;

      case 'pinsel':
        for (var i = 1; i < P.length; i++) {
          g.segmente.push({ x1: P[i - 1].x, y1: P[i - 1].y, x2: P[i].x, y2: P[i].y });
        }
        break;

      case 'messung':
        if (!b) break;
        g.kaesten.push({
          x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
          breite: Math.abs(b.x - a.x), hoehe: Math.abs(b.y - a.y), mess: true
        });
        g.segmente.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        g.spitzen.push({ x: b.x, y: b.y, winkel: Math.atan2(b.y - a.y, b.x - a.x) });
        break;

      case 'fibRetracement':
        if (!b) break;
        fibNiveaus(pp[0], pp[1]).forEach(function (n) {
          var y = pr.y(n.kurs);
          g.segmente.push({ x1: Math.min(a.x, b.x), y1: y, x2: Math.max(a.x, b.x), y2: y, niveau: n.niveau });
          g.texte.push({ x: Math.min(a.x, b.x), y: y, text: fibWort(n.niveau), kurs: n.kurs, klein: true });
        });
        g.segmente.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, hilfe: true });
        break;

      case 'fibErweiterung':
        if (!c) break;
        fibErweiterung(pp[0], pp[1], pp[2]).forEach(function (n) {
          var y = pr.y(n.kurs);
          g.segmente.push({ x1: Math.min(a.x, c.x), y1: y, x2: pr.xBis, y2: y, niveau: n.niveau });
          g.texte.push({ x: Math.min(a.x, c.x), y: y, text: fibWort(n.niveau), kurs: n.kurs, klein: true });
        });
        g.segmente.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, hilfe: true });
        g.segmente.push({ x1: b.x, y1: b.y, x2: c.x, y2: c.y, hilfe: true });
        break;

      case 'fibKanal':
        if (!c) break;
        fibKanal(kerzen, pp[0], pp[1], pp[2]).forEach(function (L) {
          var q1 = pkt(pr, L.von), q2 = pkt(pr, L.bis);
          g.segmente.push({ x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y, niveau: L.niveau });
          g.texte.push({ x: q2.x, y: q2.y, text: fibWort(L.niveau), klein: true });
        });
        break;

      case 'fibZeitzonen':
        if (!b) break;
        fibZeitzonen(kerzen, pp[0], pp[1]).forEach(function (Z) {
          var x = sk.links + (Z.index + 0.5) * sk.dx;
          if (x < pr.xVon - 1 || x > pr.xBis + 1) return;   // ausserhalb des Bildes
          g.segmente.push({ x1: x, y1: pr.yVon, x2: x, y2: pr.yBis, niveau: Z.zahl });
          g.texte.push({ x: x, y: pr.yVon, text: String(Z.zahl), klein: true });
        });
        break;

      case 'fibFaecher':
        if (!b) break;
        var i1f = indexVonZeit(kerzen, pp[0].t);
        fibFaecher(kerzen, pp[0], pp[1]).forEach(function (F) {
          /* Der Strahl laeuft aus Punkt 1 bis zum rechten Rand des Feldes. */
          var iRand = (pr.xBis - sk.links) / sk.dx - 0.5;
          var kursRand = pp[0].kurs + F.steigung * (iRand - i1f);
          g.segmente.push({ x1: a.x, y1: a.y, x2: pr.xBis, y2: pr.y(kursRand), niveau: F.niveau });
          g.texte.push({ x: pr.xBis, y: pr.y(kursRand), text: fibWort(F.niveau), klein: true, rechts: true });
        });
        break;
    }
    return g;
  }
  /* Die Beschriftung eines Niveaus. Ganze Zahlen ohne Komma, sonst mit einer
   * Nachkommastelle - "23,6" und "100", nicht "23,6" und "100,0". */
  function fibWort(n) {
    return (Math.round(n * 10) % 10 === 0 ? String(Math.round(n)) : String(n).replace('.', ','));
  }

  /* ---------------------------------------------------------------------------
   * 8) Der Treffertest
   *
   * Welche Zeichnung liegt unter dem Zeiger? Gesucht wird von HINTEN nach vorn -
   * die zuletzt gezeichnete liegt oben und wird zuerst gefunden, so wie sie auch
   * gemalt wurde.
   *
   * Griffe schlagen Linien: wer den Endpunkt einer Linie anfasst, will ihn
   * verschieben, nicht die ganze Linie. Deshalb erst alle Griffe aller Zeichnungen,
   * dann die Strecken.
   *
   * Unsichtbare Zeichnungen werden nicht getroffen (man kann nicht anfassen, was
   * man nicht sieht). GESPERRTE schon - sie duerfen ausgewaehlt und wieder
   * entsperrt werden, nur nicht verschoben; das entscheidet `verschieben`. */
  function abstandZuStrecke(px, py, s) {
    var dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    var laenge2 = dx * dx + dy * dy;
    if (!laenge2) return Math.sqrt((px - s.x1) * (px - s.x1) + (py - s.y1) * (py - s.y1));
    var t = ((px - s.x1) * dx + (py - s.y1) * dy) / laenge2;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    var qx = s.x1 + t * dx, qy = s.y1 + t * dy;
    return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
  }

  function treffer(liste, px, py, kerzen, sk, toleranz) {
    var tol = toleranz > 0 ? toleranz : TREFFER_PX;
    var zs = (liste || []).filter(function (z) { return z && z.sichtbar !== false; });
    var i, j, g;
    /* (a) Griffe zuerst, von oben nach unten. */
    for (i = zs.length - 1; i >= 0; i--) {
      g = geometrie(zs[i], kerzen, sk);
      for (j = 0; j < g.griffe.length; j++) {
        var h = g.griffe[j];
        if (!zahl(h.x) || !zahl(h.y)) continue;
        if (Math.abs(px - h.x) <= GRIFF_PX + tol / 2 && Math.abs(py - h.y) <= GRIFF_PX + tol / 2) {
          return { id: zs[i].id, zeichnung: zs[i], griff: j, abstand: 0 };
        }
      }
    }
    /* (b) dann die Strecken - und der KLEINSTE Abstand gewinnt, nicht der erste
     *     gefundene: liegen zwei Linien dicht beieinander, faengt sonst immer
     *     dieselbe jeden Klick ab. */
    var best = null;
    for (i = zs.length - 1; i >= 0; i--) {
      g = geometrie(zs[i], kerzen, sk);
      for (j = 0; j < g.segmente.length; j++) {
        var s = g.segmente[j];
        if (!zahl(s.x1) || !zahl(s.y1) || !zahl(s.x2) || !zahl(s.y2)) continue;
        var d = abstandZuStrecke(px, py, s);
        if (d <= tol && (!best || d < best.abstand)) {
          best = { id: zs[i].id, zeichnung: zs[i], griff: null, abstand: d };
        }
      }
      /* Ein Text hat keine Strecke - er wird ueber einen kleinen Kasten um seinen
       * Ankerpunkt getroffen. Die Breite haengt an der Zeichenkette, nicht am
       * Zeichenkontext: diese Datei misst nichts am Bildschirm. */
      if (zs[i].art === 'text') {
        for (j = 0; j < g.texte.length; j++) {
          var tx = g.texte[j];
          if (!zahl(tx.x) || !zahl(tx.y)) continue;
          var breite = Math.max(12, String(tx.text || '').length * 7);
          if (px >= tx.x - tol && px <= tx.x + breite + tol &&
              py >= tx.y - 10 - tol && py <= tx.y + 4 + tol && (!best || best.abstand > 0)) {
            best = { id: zs[i].id, zeichnung: zs[i], griff: null, abstand: 0 };
          }
        }
      }
    }
    return best;
  }

  /* ---------------------------------------------------------------------------
   * 9) Aendern
   *
   * Verschieben und Punkt-Setzen arbeiten in DATEN, nicht in Pixeln: der Aufrufer
   * rechnet die Mausbewegung einmal in eine Zeit- und eine Kursdifferenz um und
   * gibt die herein. Sonst haette das Verschieben eine eigene Skala. */
  function verschieben(z, dt, dKurs) {
    if (!z || z.gesperrt) return false;
    if (!zahl(dt) || !zahl(dKurs)) return false;
    z.punkte = (z.punkte || []).map(function (p) { return { t: p.t + dt, kurs: p.kurs + dKurs }; });
    return true;
  }
  function punktSetzen(z, i, punkt) {
    if (!z || z.gesperrt || !punktOk(punkt)) return false;
    if (!Array.isArray(z.punkte) || i < 0 || i >= z.punkte.length) return false;
    z.punkte[i] = { t: punkt.t, kurs: punkt.kurs };
    return true;
  }

  /* ---------------------------------------------------------------------------
   * 10) Speichern und Lesen
   *
   * Der Speicher haelt je Wert eine Liste. Beim LESEN wird jede Zeichnung geprueft;
   * was durchfaellt, kommt mit Grund in `verworfen` zurueck und nicht still weg -
   * eine verschwundene Linie ohne Meldung waere derselbe stille Verlust, den das
   * Projekt schon zweimal in den Kerzen hatte. */
  function alsText(liste) {
    return JSON.stringify((liste || []).filter(function (z) { return gueltig(z).ok; }));
  }
  function ausText(text) {
    var roh;
    try { roh = JSON.parse(String(text == null ? '[]' : text)); }
    catch (e) { return { liste: [], verworfen: [{ grund: 'kein lesbares JSON' }] }; }
    return ausListe(roh);
  }
  function ausListe(roh) {
    if (!Array.isArray(roh)) return { liste: [], verworfen: [{ grund: 'keine Liste' }] };
    var gut = [], schlecht = [];
    roh.forEach(function (z, i) {
      var p = gueltig(z);
      if (!p.ok) { schlecht.push({ nr: i + 1, grund: p.grund }); return; }
      gut.push({
        id: z.id, art: z.art,
        punkte: punkteKopie(z.punkte),
        stil: { farbe: z.stil.farbe, breite: z.stil.breite, linienart: z.stil.linienart },
        text: z.text == null ? '' : String(z.text),
        gesperrt: !!z.gesperrt,
        sichtbar: z.sichtbar !== false
      });
    });
    zaehlerAngleichen(gut);
    return { liste: gut, verworfen: schlecht };
  }

  /* ---------------------------------------------------------------------------
   * 11) Zeichnen
   *
   * `ctx` ist ein Canvas-Zeichenkontext - oder in der Pruefung eine Attrappe. Diese
   * Funktion fragt NICHTS ab: keine Breite am Fenster, keine Farbe aus einem
   * Element, keine Daten. Sie malt auf eine EIGENE Ebene ueber dem Kerzen-Canvas,
   * damit der Kerzenchart unveraendert bleibt.
   *
   * Was gezeichnet wird, kommt aus `geometrie()` - derselben Rechnung, die auch der
   * Treffertest benutzt. */
  function zeichnen(ctx, liste, kerzen, sk, opt) {
    if (!ctx || !sk) return { zeichnungen: 0, segmente: 0 };
    var o = opt || {};
    ctx.clearRect(0, 0, sk.breite, sk.hoehe);
    var zs = (liste || []).filter(function (z) { return z && z.sichtbar !== false && vollstaendig(z); });
    var gezaehlt = 0, segmente = 0;
    zs.forEach(function (z) {
      var g = geometrie(z, kerzen, sk);
      var stil = z.stil || STIL_VORGABE;
      gezaehlt++;
      ctx.save();
      ctx.strokeStyle = stil.farbe;
      ctx.fillStyle = stil.farbe;
      ctx.lineWidth = stil.breite;
      var strich = STRICHE[stil.linienart] || [];
      if (ctx.setLineDash) ctx.setLineDash(strich);
      g.kaesten.forEach(function (k) {
        if (!zahl(k.x) || !zahl(k.y)) return;
        ctx.save();
        ctx.globalAlpha = o.fuellDeckkraft > 0 ? o.fuellDeckkraft : 0.08;
        ctx.fillRect(k.x, k.y, k.breite, k.hoehe);
        ctx.restore();
      });
      g.segmente.forEach(function (s) {
        if (!zahl(s.x1) || !zahl(s.y1) || !zahl(s.x2) || !zahl(s.y2)) return;
        segmente++;
        ctx.save();
        if (s.hilfe && ctx.setLineDash) { ctx.setLineDash([2, 3]); ctx.globalAlpha = 0.6; }
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
        ctx.restore();
      });
      /* Die Pfeilspitze ist ein gefuelltes Dreieck am Ende der Strecke; ihre Groesse
       * waechst mit der Linienbreite, damit ein dicker Pfeil keine Nadel traegt. */
      g.spitzen.forEach(function (s) {
        if (!zahl(s.x) || !zahl(s.y)) return;
        var L = 6 + stil.breite * 2;
        ctx.save();
        if (ctx.setLineDash) ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - L * Math.cos(s.winkel - 0.4), s.y - L * Math.sin(s.winkel - 0.4));
        ctx.lineTo(s.x - L * Math.cos(s.winkel + 0.4), s.y - L * Math.sin(s.winkel + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      g.texte.forEach(function (tx) {
        if (!zahl(tx.x) || !zahl(tx.y)) return;
        var wort = tx.text;
        if (wort == null && zahl(tx.kurs) && typeof o.kursWort === 'function') wort = o.kursWort(tx.kurs);
        else if (wort != null && zahl(tx.kurs) && typeof o.kursWort === 'function') wort = wort + '  ' + o.kursWort(tx.kurs);
        if (!wort) return;
        ctx.save();
        if (ctx.setLineDash) ctx.setLineDash([]);
        ctx.font = (tx.klein ? 10 : 12) + 'px system-ui, sans-serif';
        ctx.textAlign = tx.rechts ? 'right' : 'left';
        ctx.fillText(String(wort), tx.x + (tx.rechts ? -3 : 3), tx.y - 3);
        ctx.restore();
      });
      /* Die Griffe nur an der AUSGEWAEHLTEN Zeichnung - alle Griffe aller
       * Zeichnungen gleichzeitig waeren ein Bild aus Quadraten. */
      if (o.ausgewaehlt === z.id && !z.gesperrt) {
        ctx.save();
        if (ctx.setLineDash) ctx.setLineDash([]);
        ctx.fillStyle = o.griffFarbe || stil.farbe;
        g.griffe.forEach(function (h) {
          if (!zahl(h.x) || !zahl(h.y)) return;
          ctx.fillRect(h.x - GRIFF_PX, h.y - GRIFF_PX, GRIFF_PX * 2, GRIFF_PX * 2);
        });
        ctx.restore();
      }
      ctx.restore();
    });
    return { zeichnungen: gezaehlt, segmente: segmente };
  }

  var Zeichnungen = {
    ARTEN: ARTEN, ART_LISTE: ART_LISTE,
    FIB_NIVEAUS: FIB_NIVEAUS, FIB_ZAHLEN: FIB_ZAHLEN,
    LINIENARTEN: LINIENARTEN, STRICHE: STRICHE,
    MAGNET_MODI: MAGNET_MODI, STIL_VORGABE: STIL_VORGABE,
    TREFFER_PX: TREFFER_PX, GRIFF_PX: GRIFF_PX,
    neu: neu, vollstaendig: vollstaendig, gueltig: gueltig,
    indexVonZeit: indexVonZeit, zeitVonIndex: zeitVonIndex,
    projektion: projektion, punktAusPixel: punktAusPixel,
    fangen: fangen,
    fibNiveaus: fibNiveaus, fibErweiterung: fibErweiterung,
    fibZeitzonen: fibZeitzonen, fibFaecher: fibFaecher, fibKanal: fibKanal,
    fibWort: fibWort,
    messung: messung, dauerText: dauerText,
    geometrie: geometrie, treffer: treffer, abstandZuStrecke: abstandZuStrecke,
    verschieben: verschieben, punktSetzen: punktSetzen,
    alsText: alsText, ausText: ausText, ausListe: ausListe,
    zeichnen: zeichnen
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Zeichnungen; return; }
  root.Zeichnungen = Zeichnungen;
})(typeof window !== 'undefined' ? window : globalThis);
