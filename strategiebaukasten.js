'use strict';
/* Der Baukasten: aus Klicken wird eine Signalfunktion.
 *
 * WARUM ES IHN GIBT. Das Eingabefeld fuer eine neue Strategie verlangte JavaScript -
 * eine Funktion signal(bars, i, params), dazu wahlweise eine Ausstiegsregel und eine
 * JSON-Liste fuer die Parametervarianten. Wer nicht programmiert, kam damit keinen
 * Schritt weit. Das Formular war nicht schwer zu BEDIENEN, es war fuer die meisten
 * Menschen schlicht nicht bedienbar.
 *
 * WAS SICH NICHT LOESEN LAESST: Eine beliebige Handelsidee laesst sich nicht anklicken.
 * Wer eine Regel will, die es hier nicht gibt, braucht Code - daran ist nichts zu
 * machen, und es zu verschweigen waere gelogen. Deshalb ZWEI Wege, nicht einer:
 *   - Der Baukasten deckt die haeufigen Muster ab und schreibt den Code selbst.
 *   - Der Expertenmodus ist das alte Formular, unveraendert, mit voller Freiheit.
 * Der erzeugte Code wird IMMER angezeigt und laesst sich in den Expertenmodus
 * uebernehmen. Der Baukasten ist damit auch ein Lehrmittel: man sieht, was aus der
 * eigenen Auswahl geworden ist, und kann von dort aus weiterschreiben.
 *
 * WAS DER BAUKASTEN NICHT TUT: Er schreibt den GRUND nicht. Der Grund ist die
 * Vorregistrierung - die These, warum ein Effekt ueberhaupt existieren sollte, und
 * wer hier handeln MUSS. Wuerde der Baukasten ihn ausfuellen, waere die Huerde weg,
 * die diese ganze Maschine traegt: dass jemand vorher nachgedacht hat. Er gibt
 * Beispiele fuer einen guten und einen schlechten Grund. Schreiben muss ihn der Mensch.
 *
 * KEIN BLICK IN DIE ZUKUNFT. Jedes Muster hier liest ausschliesslich bars[0..i] -
 * niemals bars[i+1], auch nicht dessen Zeitstempel. Das ist strenger als das
 * mitgelieferte Beispiel im alten Formular, das ueber bars[i+1] geprueft hat, ob der
 * Monat wechselt. Kalenderwissen ist erlaubt (ein Mensch weiss auch, dass morgen der
 * Erste ist) - aber es wird aus dem Zeitstempel der AKTUELLEN Kerze gerechnet, nicht
 * aus dem Vorhandensein der naechsten. Wer bars[i+1] liest, erfaehrt nebenbei, dass
 * dort ueberhaupt gehandelt wurde.
 *
 * Reine Datei: kein DOM, kein Netz, kein Zustand. Damit laeuft sie in Node, und die
 * Testsuite kann die erzeugten Funktionen wirklich AUSFUEHREN statt sie zu lesen. */
(function (root) {

  /* ---------- Bausteine, die in den erzeugten Code wandern ----------
   * Sie stehen als Text hier, weil sie Teil der abgelegten Strategiedatei werden.
   * Jeder ist fuer sich lesbar - wer den erzeugten Code aufmacht, soll verstehen,
   * was er tut, und ihn weiterschreiben koennen. */
  var HILFEN = {
    ersteKerzeDesTages:
      'function ersteKerzeDesTages(bars, i) {\n' +
      '  /* Die erste Kerze eines Handelstages - erkannt am Datumswechsel gegen die\n' +
      '   * VORIGE Kerze. Schaut nur zurueck, nie nach vorn. */\n' +
      '  if (i < 1) return false;\n' +
      '  return new Date(bars[i][0]).getUTCDate() !== new Date(bars[i - 1][0]).getUTCDate();\n' +
      '}',
    werktageBisMonatsende:
      'function werktageBisMonatsende(t) {\n' +
      '  /* Wie viele Werktage kommen nach diesem Tag noch im selben Monat?\n' +
      '   * 0 = dieser Tag ist der letzte Werktag des Monats, 1 = der vorletzte, usw.\n' +
      '   * Gerechnet allein aus dem Zeitstempel - kein Blick in die Kursreihe.\n' +
      '   * Feiertage kennt diese Rechnung nicht; sie zaehlt Montag bis Freitag. Ein\n' +
      '   * Feiertag am Monatsende verschiebt das Signal dann um einen Tag. */\n' +
      '  var m = new Date(t).getUTCMonth(), k = 0, n = new Date(t);\n' +
      '  for (var s = 0; s < 40; s++) {\n' +
      '    n.setUTCDate(n.getUTCDate() + 1);\n' +
      '    if (n.getUTCDay() === 0 || n.getUTCDay() === 6) continue;\n' +
      '    if (n.getUTCMonth() !== m) return k;\n' +
      '    k++;\n' +
      '  }\n' +
      '  return -1;\n' +
      '}',
    kerzeImTag:
      'function kerzeImTag(bars, i) {\n' +
      '  /* Die wievielte Kerze dieses Handelstages ist bars[i]? 0 = die erste.\n' +
      '   * Zaehlt rueckwaerts bis zum Datumswechsel. */\n' +
      '  var z = 0;\n' +
      '  for (var k = i; k > 0; k--) {\n' +
      '    if (new Date(bars[k][0]).getUTCDate() !== new Date(bars[k - 1][0]).getUTCDate()) break;\n' +
      '    z++;\n' +
      '  }\n' +
      '  return z;\n' +
      '}'
  };

  var WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  /* ---------- Die Muster ----------
   * satz()   - was die Strategie in einem Satz tut, in Alltagssprache
   * warum    - WOFUER so ein Effekt sprechen koennte. Das ist ein Denkanstoss fuer
   *            den Grund, KEIN fertiger Grund: er nennt die Sorte Begruendung, die
   *            traegt, und ueberlaest das Nachdenken dem Menschen.
   * felder   - die Fragen, die der Mensch beantwortet. Alles Zahlen mit Grenzen.
   * bau()    - macht daraus Code. A(name) liefert entweder die Zahl selbst oder
   *            'params.name' - je nachdem, ob mehrere Werte durchprobiert werden. */
  var MUSTER = [
    {
      id: 'monatsende',
      name: 'Monatsende',
      kurz: 'Am Ende eines Monats kaufen oder verkaufen',
      satz: function (w) {
        var v = Number(String(w.vorlauf).split(',')[0]) || 0;
        return v === 0
          ? 'Am letzten Werktag des Monats, gleich zum Handelsstart.'
          : 'Am ' + (v + 1) + '. letzten Werktag des Monats, gleich zum Handelsstart.';
      },
      warum: 'wenn Indexfonds und Pensionskassen zum Monatsende ihre Gewichte wieder herstellen ' +
        'müssen – ein Zufluss mit Termin, kein Kursmuster. Wer so begründet, nennt jemanden, der ' +
        'handeln MUSS, und sagt warum.',
      kennung: 'monatsende',
      hilfen: ['ersteKerzeDesTages', 'werktageBisMonatsende'],
      felder: [{
        name: 'vorlauf', frage: 'Wie viele Werktage vor dem Monatsende?',
        vorgabe: '0', min: 0, max: 10, einheit: 'Werktage vorher',
        hilfe: '0 = am letzten Werktag selbst. 1 = einen Werktag früher.'
      }],
      bau: function (A, dir) {
        return 'function signal(bars, i, params) {\n' +
          '  // Nur einmal am Tag, zur ersten Kerze - sonst gäbe es ein Signal je Stunde.\n' +
          '  if (!ersteKerzeDesTages(bars, i)) return null;\n' +
          '  return werktageBisMonatsende(bars[i][0]) === ' + A('vorlauf') + ' ? { dir: ' + dir + ' } : null;\n' +
          '}';
      }
    },
    {
      id: 'wochentag',
      name: 'Ein bestimmter Wochentag',
      kurz: 'Immer montags, dienstags, …',
      satz: function (w) {
        var t = Number(String(w.tag).split(',')[0]) || 1;
        return 'Jeden ' + (WOCHENTAGE[t] || 'Montag') + ', gleich zum Handelsstart.';
      },
      warum: 'nur, wenn an diesem Tag regelmäßig etwas passiert – ein Abrechnungstermin, ein ' +
        'Zufluss, eine Veröffentlichung. Ein Wochentag allein ist kein Grund, sondern eine ' +
        'Beobachtung ohne These.',
      kennung: 'wochentag',
      hilfen: ['ersteKerzeDesTages'],
      felder: [{
        name: 'tag', frage: 'An welchem Wochentag?',
        vorgabe: '1', min: 1, max: 5, einheit: '1 = Montag … 5 = Freitag',
        hilfe: 'Der Handel läuft Montag bis Freitag.'
      }],
      bau: function (A, dir) {
        return 'function signal(bars, i, params) {\n' +
          '  if (!ersteKerzeDesTages(bars, i)) return null;\n' +
          '  // getUTCDay(): 1 = Montag … 5 = Freitag\n' +
          '  return new Date(bars[i][0]).getUTCDay() === ' + A('tag') + ' ? { dir: ' + dir + ' } : null;\n' +
          '}';
      }
    },
    {
      id: 'tageszeit',
      name: 'Eine bestimmte Tageszeit',
      kurz: 'Jeden Handelstag zur gleichen Stunde',
      satz: function (w) {
        var n = Number(String(w.nach).split(',')[0]) || 0;
        return n === 0 ? 'Jeden Handelstag mit der ersten Kerze.'
          : 'Jeden Handelstag, ' + n + ' Stunde(n) nach Handelsstart.';
      },
      warum: 'für die erste Stunde – über Nacht aufgelaufene Aufträge werden dann ausgeführt. ' +
        'Für eine beliebige Stunde mitten am Tag gibt es meist keinen Grund, und dann misst ' +
        'man Rauschen.',
      kennung: 'tageszeit',
      hilfen: ['kerzeImTag'],
      felder: [{
        name: 'nach', frage: 'Wie viele Stunden nach Handelsstart?',
        vorgabe: '0', min: 0, max: 12, einheit: 'Stunden nach Start',
        hilfe: '0 = die erste Kerze des Tages. Ein Handelstag hat rund 7 Stundenkerzen.'
      }],
      bau: function (A, dir) {
        return 'function signal(bars, i, params) {\n' +
          '  return kerzeImTag(bars, i) === ' + A('nach') + ' ? { dir: ' + dir + ' } : null;\n' +
          '}';
      }
    },
    {
      id: 'rueckgang',
      name: 'Nach einem starken Rückgang',
      kurz: 'Wenn der Kurs stark gefallen ist',
      satz: function (w) {
        var n = Number(String(w.kerzen).split(',')[0]) || 6;
        var p = Number(String(w.prozent).split(',')[0]) || 3;
        return 'Wenn der Kurs in den letzten ' + n + ' Stunden um mehr als ' + p + ' % gefallen ist.';
      },
      warum: 'wenn jemand VERKAUFEN MUSS statt will – eine Nachschussforderung, ein Fonds mit ' +
        'Abflüssen, ein Index, der einen Wert herauswirft. Wer nur „das war zu viel“ denkt, hat ' +
        'keine These, sondern ein Gefühl.',
      kennung: 'rueckgang',
      hilfen: [],
      felder: [
        {
          name: 'kerzen', frage: 'Über wie viele Stunden?',
          vorgabe: '6', min: 1, max: 130, einheit: 'Stundenkerzen',
          hilfe: 'Ein Handelstag hat rund 7 Stundenkerzen.'
        },
        {
          name: 'prozent', frage: 'Wie viel Prozent muss der Kurs mindestens gefallen sein?',
          vorgabe: '3', min: 0.1, max: 90, einheit: '%',
          hilfe: 'Je größer die Zahl, desto seltener das Signal – und desto weniger Daten am Ende.'
        }
      ],
      bau: function (A, dir) {
        return 'function signal(bars, i, params) {\n' +
          '  var n = ' + A('kerzen') + ';\n' +
          '  if (i < n) return null;\n' +
          '  var vorher = bars[i - n][1], jetzt = bars[i][1];\n' +
          '  // Kaputte Kurse (0, negativ) nicht als Absturz missverstehen\n' +
          '  if (!(vorher > 0) || !(jetzt > 0)) return null;\n' +
          '  return (jetzt / vorher - 1) * 100 <= -(' + A('prozent') + ') ? { dir: ' + dir + ' } : null;\n' +
          '}';
      }
    },
    {
      id: 'ausbruch',
      name: 'Ausbruch über das bisherige Hoch',
      kurz: 'Wenn der Kurs über das Hoch der letzten Stunden steigt',
      satz: function (w) {
        var n = Number(String(w.kerzen).split(',')[0]) || 24;
        return 'Wenn der Schlusskurs über dem höchsten Hoch der letzten ' + n + ' Stunden liegt.';
      },
      warum: 'wenn oberhalb eines Hochs Aufträge liegen, die dann ausgelöst werden – Stop-Aufträge ' +
        'von Leerverkäufern etwa. Das ist ein Mechanismus. „Stärke setzt sich fort“ ist keiner.',
      kennung: 'ausbruch',
      hilfen: [],
      felder: [{
        name: 'kerzen', frage: 'Über wie viele Stunden zurück?',
        vorgabe: '24', min: 2, max: 400, einheit: 'Stundenkerzen',
        hilfe: '24 Stunden sind rund 3,5 Handelstage.'
      }],
      bau: function (A, dir) {
        return 'function signal(bars, i, params) {\n' +
          '  var n = ' + A('kerzen') + ';\n' +
          '  if (i < n) return null;\n' +
          '  var h = 0;\n' +
          '  for (var k = i - n; k < i; k++) {\n' +
          '    // Aeltere Archiveintraege haben kein Hoch - dann zaehlt der Schlusskurs.\n' +
          '    var x = bars[k][3] != null ? bars[k][3] : bars[k][1];\n' +
          '    if (x > h) h = x;\n' +
          '  }\n' +
          '  // Verglichen wird der SCHLUSS der aktuellen Kerze gegen Hochs davor -\n' +
          '  // niemals gegen das Hoch der laufenden Kerze. Das waere ein Blick hinein.\n' +
          '  return h > 0 && bars[i][1] > h ? { dir: ' + dir + ' } : null;\n' +
          '}';
      }
    }
  ];

  function musterVon(id) {
    for (var i = 0; i < MUSTER.length; i++) if (MUSTER[i].id === id) return MUSTER[i];
    return null;
  }

  /** Aus 'long'/'short'/'beide' wird die Richtung, die das Signal zurueckgibt.
   *  'beide' kann ein einseitiges Muster nicht bedienen - es wird zu Long, und die
   *  Oberflaeche sagt das dazu. */
  function richtungDir(richtung) { return richtung === 'short' ? -1 : 1; }

  /** Eine Feldeingabe lesen. Eine Zahl -> feste Zahl. Mehrere, durch Komma getrennt
   *  -> Parametervarianten: die Maschine misst jede einzeln.
   *  Gibt { zahlen: [..], fehler: null|'...' }. */
  function zahlen(feld, roh) {
    var txt = String(roh == null ? feld.vorgabe : roh).trim();
    if (!txt) return { zahlen: [], fehler: feld.frage + ' fehlt.' };
    var teile = txt.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    var out = [];
    for (var i = 0; i < teile.length; i++) {
      /* Komma als Dezimaltrennzeichen ginge hier nicht - es trennt schon die Varianten.
       * Wer "3,5" meint, schreibt "3.5". Das steht auch in der Oberflaeche. */
      var n = Number(teile[i]);
      if (!isFinite(n)) return { zahlen: [], fehler: feld.frage + ' – „' + teile[i] + '“ ist keine Zahl.' };
      if (n < feld.min || n > feld.max) {
        return { zahlen: [], fehler: feld.frage + ' – ' + n + ' liegt außerhalb von ' + feld.min + ' bis ' + feld.max + '.' };
      }
      out.push(n);
    }
    return { zahlen: out, fehler: null };
  }

  /** Der Bau. wahl: { muster, richtung, werte: {feldname: 'text'} }
   *  Rueckgabe bei Erfolg:
   *    { ok: true, signal, varianten (null oder Liste), kennung, satz, warum,
   *      tests (wie viele Messungen daraus werden) }
   *  Bei Fehler: { ok: false, fehler } - mit einem Satz, der sagt, WAS zu tun ist. */
  function baue(wahl) {
    wahl = wahl || {};
    var m = musterVon(wahl.muster);
    if (!m) return { ok: false, fehler: 'Kein Muster gewählt.' };
    var werte = wahl.werte || {};
    var dir = richtungDir(wahl.richtung);

    var proFeld = {};
    for (var i = 0; i < m.felder.length; i++) {
      var f = m.felder[i];
      var z = zahlen(f, werte[f.name]);
      if (z.fehler) return { ok: false, fehler: z.fehler };
      proFeld[f.name] = z.zahlen;
    }

    /* Varianten entstehen als Kreuzprodukt ueber alle Felder mit mehreren Werten.
     * Das kann schnell gross werden - zwei Felder mit je vier Werten sind sechzehn
     * Tests, und die Bonferroni-Schwelle rechnet mit allen. Deshalb eine Obergrenze
     * und ein Hinweis, statt still eine Zahl zu erzeugen, die kein Signal mehr
     * ueberspringen kann. */
    var mehrfach = m.felder.filter(function (fd) { return proFeld[fd.name].length > 1; });
    var varianten = null;
    if (mehrfach.length) {
      varianten = [{}];
      m.felder.forEach(function (fd) {
        var neu = [];
        proFeld[fd.name].forEach(function (v) {
          varianten.forEach(function (vor) {
            var kopie = {};
            Object.keys(vor).forEach(function (k) { kopie[k] = vor[k]; });
            kopie[fd.name] = v;
            neu.push(kopie);
          });
        });
        varianten = neu;
      });
      if (varianten.length > 24) {
        return { ok: false, fehler: 'Das wären ' + varianten.length + ' Tests. Jede Variante ist eine ' +
          'eigene Messung, und die Hürde steigt mit jeder – bei so vielen kommt praktisch nichts mehr ' +
          'durch. Höchstens 24; weniger ist besser.' };
      }
    }

    /* A(name) entscheidet, ob die Zahl fest im Code steht oder aus params kommt.
     * Fest ist besser zu lesen; params nur dort, wo wirklich mehrere Werte laufen. */
    function A(name) {
      var liste = proFeld[name];
      if (liste.length > 1) {
        /* Der Rueckfall ist kein Schmuck: die Maschine ruft signal auch mit dem
         * leeren Parametersatz auf, wenn jemand die Varianten spaeter herausnimmt. */
        return '(params && params.' + name + ' != null ? params.' + name + ' : ' + liste[0] + ')';
      }
      return String(liste[0]);
    }

    var teile = [];
    (m.hilfen || []).forEach(function (h) { teile.push(HILFEN[h]); });
    teile.push(m.bau(A, dir));

    var eineWahl = {};
    m.felder.forEach(function (fd) { eineWahl[fd.name] = proFeld[fd.name].join(','); });

    return {
      ok: true,
      signal: teile.join('\n\n'),
      varianten: varianten,
      kennung: m.kennung + '-' + (dir === 1 ? 'kauf' : 'verkauf'),
      satz: m.satz(eineWahl),
      warum: m.warum,
      tests: varianten ? varianten.length : 1
    };
  }

  var Baukasten = {
    MUSTER: MUSTER, HILFEN: HILFEN, WOCHENTAGE: WOCHENTAGE,
    musterVon: musterVon, richtungDir: richtungDir, zahlen: zahlen, baue: baue
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Baukasten; return; }
  root.Baukasten = Baukasten;
})(typeof window !== 'undefined' ? window : globalThis);
