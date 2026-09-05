'use strict';
/* ================= Chart-Einstellungen: der Dialog =================================
 *
 * Aktien-Viewer 8b (05.09.2026). Hier steht die BEDIENUNG; die Rechnung und jede
 * Vorgabe stehen in markt/charteinstellungen.js. Diese Datei kennt keinen einzigen
 * Feldnamen und keine einzige Farbe: sie baut den Dialog aus der Feldtabelle des
 * Moduls (REITER/FELDER) und schreibt ueber lies()/schreib() zurueck.
 *
 * Warum eine eigene Datei und nicht ein Block in explorer.js: explorer.js ist die
 * Bedienung des Viewers und traegt nach 8a die Zeitraum-, Zoom- und Signalleisten.
 * Ein Dialog mit vier Reitern und vier Dutzend Feldern daneben waere die Datei, in
 * der niemand mehr etwas findet. Dasselbe Muster wie dialogstapel.js: die Huelle
 * neben dem, was sie bedient.
 *
 * DER DIALOG GEHT UEBER DEN STAPEL. window.openModal(id, ausloeser) - nicht
 * classList.add('open'). Wer daran vorbei oeffnet, bekommt keine Ebene, und beim
 * naechsten Dialog steht der Stapel falsch (QS-Fund B1, 04.09.2026).
 *
 * VORSCHAU UND ABBRECHEN. Gearbeitet wird auf einer KOPIE; jede Aenderung zeichnet
 * den Chart sofort neu (sonst waehlt man Farben blind). "Abbrechen" stellt den
 * Stand von vor dem Oeffnen wieder her und zeichnet noch einmal - der Knopf muss
 * etwas bewirken, sonst ist er eine Behauptung.
 *
 * Alles Simulation; hier wird nichts bewertet und nichts gehandelt.
 */
(function () {
  var CE = window.ChartEinstellungen;

  var STORE_STAND = 'chartEinstellungen';
  var STORE_VORLAGEN = 'chartVorlagen';
  var DIALOG = 'chartSetModalBg';
  /* Die eigene Vorlage bekommt diesen Vorsatz im Auswahlfeld, damit eingebaute und
   * eigene Vorlagen nicht denselben Wert tragen koennen. */
  var EIGEN = 'eigen:';

  var stand = CE.vorgabe();        // der geltende Stand
  var arbeit = null;               // die Kopie, solange der Dialog offen ist
  var vorher = null;               // der Stand beim Oeffnen - fuer Abbrechen
  var vorlagen = {};               // eigene Vorlagen, Name -> Einstellungen
  var reiterAktiv = CE.REITER[0].wert;
  var horcher = [];                // wer neu zeichnen will, traegt sich hier ein
  var umgebung = { thema: 'hell', alpacaZugang: false, feed: '', quellen: {} };

  function melden() {
    horcher.forEach(function (f) { try { f(stand); } catch (e) { /* ein Zuhoerer darf den Dialog nicht reissen */ } });
  }

  /* ---- Speicher ---------------------------------------------------------- */
  function laden() {
    if (!window.api || typeof window.api.storeGet !== 'function') return Promise.resolve(stand);
    return Promise.all([window.api.storeGet(STORE_STAND), window.api.storeGet(STORE_VORLAGEN)])
      .then(function (r) {
        var erg = CE.uebernehmen(r[0]);
        stand = erg.einstellungen;
        if (!erg.ok && r[0]) hinweisSetzen('Gemerkte Chart-Einstellungen waren unbrauchbar (' + erg.grund + ') – Vorgabe geladen.');
        vorlagen = (r[1] && typeof r[1] === 'object' && !Array.isArray(r[1])) ? r[1] : {};
        melden();
        return stand;
      }, function () { return stand; });
  }
  function sichern() {
    if (!window.api || typeof window.api.storeSet !== 'function') return;
    try { window.api.storeSet(STORE_STAND, stand); } catch (e) { /* ohne Speicher geht es auch */ }
  }
  function vorlagenSichern() {
    if (!window.api || typeof window.api.storeSet !== 'function') return;
    try { window.api.storeSet(STORE_VORLAGEN, vorlagen); } catch (e) { /* ohne Speicher geht es auch */ }
  }

  /* ---- Bau des Dialogs ---------------------------------------------------- */
  function el(tag, attr, text) {
    var e = document.createElement(tag);
    Object.keys(attr || {}).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  var hinweisArt = '';
  function hinweisSetzen(text, art) {
    hinweisArt = text ? (art || 'info') : '';
    var h = document.getElementById('csFussHinweis');
    if (h) h.textContent = text || '';
  }

  function listeVon(name) { return CE[name] || []; }

  /* Der Grund, auf dem der Chart liegt - GEMESSEN, nicht angenommen. Das Modul
   * kann kein Stylesheet lesen; hier wird die wirklich gerenderte Farbe geholt und
   * in Hex verwandelt. Ist sie durchsichtig oder unlesbar, kommt null zurueck und
   * die Warnung bleibt aus: eine erfundene Warnung ist so schlecht wie eine
   * fehlende. */
  function grundFarbe() {
    try {
      var ziel = document.getElementById('vwChart');
      var el2 = ziel && ziel.closest ? ziel.closest('.panel') : null;
      var roh = window.getComputedStyle(el2 || document.body).backgroundColor;
      var m = String(roh).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
      if (!m) return null;
      if (m[4] !== undefined && Number(m[4]) < 0.9) return null;   // durchsichtig: nicht raten
      return '#' + [1, 2, 3].map(function (i) {
        var h = Number(m[i]).toString(16);
        return h.length < 2 ? '0' + h : h;
      }).join('');
    } catch (e) { return null; }
  }
  /* Die Kontrastwarnung steht in der Fusszeile - aber sie ueberschreibt keinen
   * Fehlergrund, der dort schon steht. Deshalb traegt jeder Hinweis seine ART. */
  function warnungPruefen() {
    if (!arbeit) return;
    if (hinweisArt && hinweisArt !== 'kontrast') return;
    var grund = grundFarbe();
    if (!grund) { if (hinweisArt === 'kontrast') hinweisSetzen(''); return; }
    hinweisSetzen(CE.kontrastWarnung(arbeit, umgebung.thema, grund), 'kontrast');
  }

  function reiterBauen() {
    var wrap = document.getElementById('csReiter');
    if (!wrap) return;
    wrap.innerHTML = '';
    CE.REITER.forEach(function (r) {
      var b = el('button', {
        type: 'button', role: 'tab', id: 'csReiter-' + r.wert,
        'data-reiter': r.wert, 'aria-controls': 'csInhalt',
        'aria-selected': r.wert === reiterAktiv ? 'true' : 'false',
        tabindex: r.wert === reiterAktiv ? '0' : '-1'
      }, r.text);
      b.addEventListener('click', function () { reiterWaehlen(r.wert); });
      b.addEventListener('keydown', reiterTaste);
      wrap.appendChild(b);
    });
  }
  /* Pfeiltasten wandern durch die Reiter - so verlangt es das Muster fuer eine
   * Reiterleiste, und die Tastaturprobe misst es. */
  function reiterTaste(ev) {
    var vor = ev.key === 'ArrowDown' || ev.key === 'ArrowRight';
    var zurueck = ev.key === 'ArrowUp' || ev.key === 'ArrowLeft';
    if (!vor && !zurueck) return;
    ev.preventDefault();
    var w = CE.REITER.map(function (r) { return r.wert; });
    var i = w.indexOf(reiterAktiv);
    var neu = w[(i + (vor ? 1 : w.length - 1)) % w.length];
    reiterWaehlen(neu);
    var b = document.getElementById('csReiter-' + neu);
    if (b) b.focus();
  }
  function reiterWaehlen(wert) {
    reiterAktiv = wert;
    var wrap = document.getElementById('csReiter');
    if (wrap) {
      [].slice.call(wrap.querySelectorAll('button[data-reiter]')).forEach(function (b) {
        var an = b.getAttribute('data-reiter') === wert;
        b.setAttribute('aria-selected', an ? 'true' : 'false');
        b.setAttribute('tabindex', an ? '0' : '-1');
      });
    }
    inhaltBauen();
  }

  /* Ein Feld aus der Tabelle wird zu einer Zeile. Der Dialog kennt nur `art` -
   * welche Felder es gibt, sagt das Modul. */
  function zeileBauen(f, i) {
    var zeile = el('div', { class: 'csZeile' });
    var kennung = 'csF' + i;
    var wert = f.art === 'farbe' ? arbeit.farben[umgebung.thema][f.feld] : CE.lies(arbeit, f.pfad);
    var eingabe;

    if (f.art === 'schalter') {
      eingabe = el('input', { type: 'checkbox', id: kennung });
      eingabe.checked = !!wert;
      eingabe.addEventListener('change', function () { setzen(f, eingabe.checked); });
    } else if (f.art === 'farbe') {
      eingabe = el('input', { type: 'color', id: kennung });
      eingabe.value = wert;
      eingabe.addEventListener('input', function () { setzen(f, eingabe.value.toLowerCase()); });
    } else if (f.art === 'deckkraft') {
      /* Die Grenzen stehen NICHT hier: 0 und 1 sind die Grenzen aus gueltig(). */
      eingabe = el('input', { type: 'range', id: kennung, min: '0', max: '1', step: '0.05' });
      eingabe.value = String(wert);
      eingabe.addEventListener('input', function () { setzen(f, Number(eingabe.value)); });
    } else if (f.art === 'praezision') {
      eingabe = el('select', { id: kennung });
      CE.PRAEZISIONEN.forEach(function (p) {
        var o = el('option', { value: String(p) }, p === 'auto' ? 'Aus dem Kurs' : (p + ' Stellen'));
        eingabe.appendChild(o);
      });
      eingabe.value = String(wert);
      eingabe.addEventListener('change', function () {
        setzen(f, eingabe.value === 'auto' ? 'auto' : Number(eingabe.value));
      });
    } else {
      eingabe = el('select', { id: kennung });
      listeVon(f.liste).forEach(function (o) { eingabe.appendChild(el('option', { value: o.wert }, o.text)); });
      eingabe.value = String(wert);
      eingabe.addEventListener('change', function () { setzen(f, eingabe.value); });
    }

    var name = el('label', { for: kennung }, f.text);
    zeile.appendChild(name);
    zeile.appendChild(eingabe);
    if (f.hilfe) zeile.appendChild(el('div', { class: 'csHilfe' }, f.hilfe));

    /* Bei den Ereignissen steht neben dem Schalter, WAS es zu zeigen gaebe:
     * eine Zahl, "keine Daten" oder "aus". Ein Haken, der nichts bewirkt, weil die
     * Datei fehlt, sieht sonst genauso aus wie einer bei einem Wert ohne
     * Ausschuettung - und das sind zwei verschiedene Dinge. */
    if (f.pfad && f.pfad.indexOf('ereignisse.') === 0) {
      var art = f.pfad.slice('ereignisse.'.length);
      var stand = CE.markenStand(umgebung.quellen || {}, arbeit);
      if (Object.prototype.hasOwnProperty.call(stand, art)) {
        var s = stand[art];
        var wort = s === 'keine Daten' ? 'keine Daten vorhanden'
          : (s === 'aus' ? 'ausgeschaltet' : s + ' im geladenen Zeitraum');
        zeile.appendChild(el('div', { class: 'csHilfe' }, wort));
      }
    }

    /* Bid/Ask nur mit Zugang - und der Grund steht daneben, nicht im Nichts. */
    if (f.pfad === 'skala.bidAsk') {
      var moeglich = CE.bidAskMoeglich(umgebung.alpacaZugang);
      var text = moeglich.an ? CE.bidAskBeschriftung(umgebung.feed) : moeglich.grund;
      zeile.appendChild(el('div', { class: moeglich.an ? 'csHilfe' : 'csGrund' }, text));
      if (!moeglich.an) {
        zeile.classList.add('csAus');
        eingabe.disabled = true;
        eingabe.checked = false;
      }
    }
    return zeile;
  }

  function inhaltBauen() {
    var wrap = document.getElementById('csInhalt');
    if (!wrap || !arbeit) return;
    wrap.innerHTML = '';
    wrap.setAttribute('role', 'tabpanel');
    wrap.setAttribute('aria-labelledby', 'csReiter-' + reiterAktiv);
    CE.FELDER.forEach(function (f, i) {
      if (f.reiter !== reiterAktiv) return;
      wrap.appendChild(zeileBauen(f, i));
    });
  }

  /* Ein Wert wird gesetzt - auf der KOPIE. Kommt dabei etwas Ungueltiges heraus,
   * wird es nicht uebernommen und der Grund steht in der Fusszeile. */
  function setzen(f, wert) {
    var probe = JSON.parse(JSON.stringify(arbeit));
    if (f.art === 'farbe') probe.farben[umgebung.thema][f.feld] = wert;
    else CE.schreib(probe, f.pfad, wert);
    var p = CE.gueltig(probe);
    if (!p.ok) { hinweisSetzen(p.feld + ': ' + p.grund, 'fehler'); return; }
    hinweisSetzen('');
    arbeit = probe;
    stand = probe;                 // Vorschau: der Chart zeigt sofort, was gewaehlt ist
    melden();
    warnungPruefen();
  }

  /* ---- Vorlagen ----------------------------------------------------------- */
  function vorlagenBauen() {
    var sel = document.getElementById('csVorlage');
    if (!sel) return;
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '' }, '– wählen –'));
    CE.VORLAGEN.forEach(function (v) { sel.appendChild(el('option', { value: v.wert }, v.text)); });
    Object.keys(vorlagen).sort().forEach(function (n) {
      sel.appendChild(el('option', { value: EIGEN + n }, n));
    });
  }
  function vorlageLaden(wert) {
    if (!wert) return;
    var neu = wert.indexOf(EIGEN) === 0 ? vorlagen[wert.slice(EIGEN.length)] : CE.vorlage(wert);
    var erg = CE.uebernehmen(neu);
    if (!erg.ok) { hinweisSetzen('Vorlage unbrauchbar: ' + erg.grund, 'fehler'); return; }
    arbeit = erg.einstellungen;
    stand = arbeit;
    hinweisSetzen('');
    inhaltBauen();
    melden();
    /* Genau hier ist die Warnung noetig: "Hell" im dunklen Thema erzwingt eine
     * Palette, die sich vom Grund kaum abhebt. Der Nutzer darf das - er soll es
     * nur nicht erst am leeren Chart merken. */
    warnungPruefen();
  }

  /* ---- Oeffnen, Ok, Abbrechen --------------------------------------------- */
  function oeffnen(ausloeser, lage) {
    umgebung.thema = (lage && lage.thema) || umgebung.thema;
    umgebung.alpacaZugang = !!(lage && lage.alpacaZugang);
    umgebung.feed = (lage && lage.feed) || umgebung.feed;
    /* Was es an Ereignissen ueberhaupt zu zeigen gaebe, weiss der Viewer - nicht
     * dieser Dialog. Er reicht es beim Oeffnen herein; hier wird nichts geladen. */
    umgebung.quellen = (lage && lage.ereignisQuellen) || {};
    vorher = JSON.parse(JSON.stringify(stand));
    arbeit = JSON.parse(JSON.stringify(stand));
    hinweisSetzen('');
    reiterBauen();
    vorlagenBauen();
    inhaltBauen();
    window.openModal(DIALOG, ausloeser || null);
    warnungPruefen();
  }
  function schliessen() {
    var bg = document.getElementById(DIALOG);
    var kreuz = bg && bg.querySelector('[data-close="' + DIALOG + '"]');
    if (kreuz) kreuz.click(); else if (bg) bg.classList.remove('open');
  }
  function ok() {
    stand = arbeit;
    /* ERST die Arbeitskopie loeschen, DANN schliessen. schliessen() drueckt das
     * Schliessen-Kreuz, und an dem haengt die Ruecknahme fuer den Fall "Dialog
     * weggeklickt" - sie sah eine offene Arbeitskopie und machte das gerade
     * Bestaetigte wieder rueckgaengig. Die Oberflaechen-Probe hat es gemessen:
     * nach Ok waren null Bildpunkte der gewaehlten Farbe auf der Leinwand. */
    arbeit = null;
    vorher = null;
    sichern();
    melden();
    schliessen();
  }
  function abbrechen() {
    stand = vorher;
    arbeit = null;
    melden();
    schliessen();
  }

  function verdrahten() {
    var knopf = function (id, fn) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    knopf('csOk', ok);
    knopf('csAbbrechen', abbrechen);
    knopf('csZuruecksetzen', function () {
      arbeit = CE.vorgabe(); stand = arbeit; hinweisSetzen('Auf Standard zurückgesetzt.');
      inhaltBauen(); melden();
    });
    /* Der Name kommt aus einem Feld im Dialog, nicht aus window.prompt: Electron
     * unterstuetzt prompt() nicht ("prompt() is and will not be supported") - der
     * Knopf haette nichts getan und dabei ausgesehen wie ein Knopf. */
    knopf('csVorlageSpeichern', function () {
      var feld = document.getElementById('csVorlageName');
      var name = feld ? String(feld.value || '').trim().slice(0, CE.VORLAGE_NAME_MAX) : '';
      if (!name) { hinweisSetzen('Bitte erst einen Namen für die Vorlage eintragen.'); if (feld) feld.focus(); return; }
      vorlagen[name] = JSON.parse(JSON.stringify(arbeit));
      vorlagenSichern();
      vorlagenBauen();
      var sel = document.getElementById('csVorlage');
      if (sel) sel.value = EIGEN + name;
      if (feld) feld.value = '';
      hinweisSetzen('Vorlage „' + name + '" gespeichert.');
    });
    var nameFeld = document.getElementById('csVorlageName');
    if (nameFeld) nameFeld.setAttribute('maxlength', String(CE.VORLAGE_NAME_MAX));
    var sel = document.getElementById('csVorlage');
    if (sel) sel.addEventListener('change', function () { vorlageLaden(sel.value); });
    /* Das Kreuz und der Klick auf den Rücken schliessen wie Abbrechen - sonst
     * bliebe eine Vorschau stehen, die niemand bestaetigt hat. */
    var bg = document.getElementById(DIALOG);
    if (bg) {
      bg.addEventListener('click', function (ev) { if (ev.target === bg && arbeit) abbrechen(); });
      var kreuz = bg.querySelector('[data-close="' + DIALOG + '"]');
      if (kreuz) kreuz.addEventListener('click', function () { if (arbeit) { stand = vorher; arbeit = null; melden(); } });
    }
  }

  window.ChartSet = {
    laden: laden,
    oeffnen: oeffnen,
    stand: function () { return stand; },
    beiAenderung: function (f) { if (typeof f === 'function') horcher.push(f); },
    thema: function (t) { umgebung.thema = t === 'dunkel' ? 'dunkel' : 'hell'; },
    verdrahten: verdrahten
  };
})();
