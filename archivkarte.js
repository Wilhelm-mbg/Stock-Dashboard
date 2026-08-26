'use strict';
/* DIE KURSARCHIV-KARTE - zeigt, ob die App wirklich sammelt.
 *
 * Wilhelms Auftrag hatte einen eigenen Punkt dafuer: "Sichtbar machen, dass
 * gesammelt wird - und ob es klappt." Der Grund steht in der Geschichte dieses
 * Projekts. Das Stundenarchiv stand zwei Tage still, ohne dass es jemand merkte,
 * weil der Lauf "Nichts zu tun" meldete und mit Erfolg ausging. Am Abend des
 * 26.08.2026 starben drei Abrufe und liessen halbfertige Archive zurueck; von
 * aussen sah alles gesund aus. Eine Anzeige, die nur "laeuft" sagt, waere die
 * naechste Verkleidung derselben Stille.
 *
 * Deshalb stehen hier vier Zahlen je Aufloesung, und keine davon ist geschoent:
 *   - wie viele Werte im Archiv liegen (und wie viele davon angesehen wurden)
 *   - wie alt die juengste Kerze ist
 *   - wann zuletzt gesammelt wurde
 *   - wie viele Werte gerade offen sind
 * Dazu, wenn es soweit ist, der Satz, den niemand hoeren will: wie viele Tage
 * unwiederbringlich weg sind.
 *
 * Diese Datei zeigt und stoesst an. Sie misst nichts und handelt nicht.
 */
(function (root) {
  var U = root.U || { esc: function (s) { return String(s == null ? '' : s); } };
  var api = root.api;

  var LETZTER = null;
  var laeuftAnfrage = false;

  function el(id) { return document.getElementById(id); }

  function tagText(tag) {
    if (!tag) return 'noch nie';
    var heute = new Date().toISOString().slice(0, 10);
    if (tag === heute) return 'heute';
    var d = Math.round((Date.parse(heute + 'T00:00:00Z') - Date.parse(tag + 'T00:00:00Z')) / 86400000);
    if (d === 1) return 'gestern';
    return 'vor ' + d + ' Tagen (' + tag + ')';
  }

  function alterText(ms) {
    if (ms == null) return '–';
    var std = (Date.now() - ms) / 3600000;
    if (std < 1) return 'vor ' + Math.max(1, Math.round(std * 60)) + ' Minuten';
    if (std < 48) return 'vor ' + std.toFixed(1) + ' Stunden';
    return 'vor ' + (std / 24).toFixed(1) + ' Tagen';
  }

  var NAME = { '1m': '1 Minute', '5m': '5 Minuten', '15m': '15 Minuten' };

  function zeileHtml(z, st) {
    var laeuftHier = st.laeuft && st.laufIntervall === z.intervall;
    var h = '';
    h += '<tr>';
    h += '<th scope="row">' + U.esc(NAME[z.intervall] || z.intervall) + '</th>';
    h += '<td class="zahl">' + z.werte.toLocaleString('de-DE') + '</td>';
    h += '<td>' + U.esc(z.juengsterTag ? alterText(z.juengsteMs) : 'nichts da') + '</td>';
    h += '<td>' + U.esc(tagText(z.zuletztGesammelt)) + '</td>';
    /* Abgeschaltet sieht anders aus als "nichts offen": eine Aufloesung mit Abstand 0
     * ist nicht auf Stand, sie ist gar nicht vorgesehen. */
    h += '<td class="zahl">' + (!z.abstandTage ? 'aus'
      : (z.offeneWerte ? z.offeneWerte.toLocaleString('de-DE') + ' / ' + z.imUniversum.toLocaleString('de-DE') : '–')) + '</td>';
    h += '<td>';
    if (laeuftHier) {
      h += '<span style="color:var(--series);">sammelt gerade</span>';
    } else if (z.hindernis) {
      /* Ein leeres Archiv ohne Universum ist NICHT "auf Stand". Genau so sieht die
       * Stille aus, gegen die diese Karte gebaut ist. */
      h += '<span style="color:var(--down);">geht nicht</span>';
    } else if (z.verloren) {
      h += '<span style="color:var(--down);">' + z.verloreneTage.toFixed(1) + ' Tage verloren</span>';
    } else if (z.faellig) {
      h += '<span style="color:var(--series);">dran</span>';
    } else {
      h += '<span style="color:var(--muted);">auf Stand</span>';
    }
    h += '</td>';
    h += '<td><button class="btn ghost arch-hol" type="button" data-iv="' + U.esc(z.intervall) + '"' +
      (st.laeuft ? ' disabled' : '') + ' style="padding:3px 9px; font-size:var(--fs-klein);">Jetzt holen</button></td>';
    h += '</tr>';
    /* Die Begruendung steht unter der Zeile, nicht als Titel-Attribut: was nur beim
     * Darueberfahren erscheint, liest niemand, wenn er es braeuchte. */
    h += '<tr><td colspan="7" style="padding-top:0; border-top:none; font-size:var(--fs-klein); color:var(--muted);">' +
      U.esc(z.grund || '') +
      (z.sperre && z.sperre.verwaist
        ? ' · <span style="color:var(--down);">Liegengebliebene Sperre: ' + U.esc(z.sperre.warum || 'unbekannt') + '</span>'
        : '') +
      '</td></tr>';
    return h;
  }

  function zeichne(st) {
    var k = el('archivKarte');
    if (!k) return;
    LETZTER = st;
    if (st.fehler) {
      k.innerHTML = '<div class="loading">Das Archiv ist nicht lesbar: ' + U.esc(st.fehler) + '</div>';
      return;
    }
    var e = st.einstellungen || {};
    var h = '';

    h += '<div style="font-size:var(--fs-neben); color:var(--ink-2); line-height:1.5; margin-bottom:10px; max-width:72ch;">' +
      'Die App holt die feinen Kerzen selbst und legt sie im Kursarchiv ab – dasselbe Format und dieselbe Ablage, ' +
      'die auch das Abrufwerkzeug schreibt. <b>Yahoo hält Intraday-Kerzen nur begrenzt vor</b> ' +
      '(1 Minute 7 Tage, 5 und 15 Minuten 60 Tage). Was in dieser Zeit nicht geholt wurde, ist nicht später nachzuholen, sondern fort.' +
      '</div>';

    if (st.laeuft) {
      var f = st.fortschritt || {};
      var anteil = f.von ? Math.round(100 * f.nr / f.von) : 0;
      h += '<div class="panel" style="padding:8px 10px; margin-bottom:10px;">' +
        '<b>Sammelt ' + U.esc(NAME[st.laufIntervall] || st.laufIntervall) + '</b> – ' +
        f.nr + ' von ' + f.von + ' (' + anteil + ' %), zuletzt ' + U.esc(f.sym || '…') +
        ' · ' + f.ok + ' geholt, ' + f.leer + ' ohne Daten' +
        (f.vonHand ? ' · von Hand gestartet' : ' · planmäßig') +
        ' <button class="btn ghost" type="button" id="archStop" style="padding:3px 9px; font-size:var(--fs-klein); margin-left:8px;">Anhalten</button>' +
        '</div>';
    } else if (st.letzter) {
      var L = st.letzter;
      h += '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:10px;">' +
        'Letzter Lauf: ' + U.esc(NAME[L.intervall] || L.intervall) + ' – ' +
        L.ok + ' Reihen, ' + L.kerzen.toLocaleString('de-DE') + ' Kerzen' +
        (L.dazu ? ' (' + L.dazu.toLocaleString('de-DE') + ' neu)' : '') +
        (L.leer ? ', ' + L.leer + ' ohne Daten' : '') +
        (L.abgebrochen ? ' · <span style="color:var(--down);">abgebrochen: ' + U.esc(L.grund || '') + '</span>' : '') +
        '</div>';
    }
    if (st.letzterFehler) {
      h += '<div class="panel" style="padding:8px 10px; margin-bottom:10px; color:var(--down);">' +
        'Letzter Versuch schlug fehl: ' + U.esc(st.letzterFehler) + '</div>';
    }

    h += '<div style="overflow-x:auto;"><table class="tbl" id="archivTabelle"><thead><tr>' +
      '<th>Auflösung</th><th class="zahl">Werte</th><th>Jüngste Kerze</th><th>Zuletzt gesammelt</th>' +
      '<th class="zahl">Offen</th><th>Stand</th><th></th></tr></thead><tbody>';
    (st.zeilen || []).forEach(function (z) { h += zeileHtml(z, st); });
    h += '</tbody></table></div>';

    /* DIE ZAHLEN OFFEN HINLEGEN. Wilhelm soll sie drehen koennen, ohne dass jemand
     * ihm erklaeren muss, wo sie stehen. */
    h += '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:10px; line-height:1.6;">' +
      '<b>So ist es eingestellt:</b> Universum <code>' + U.esc(e.universum || '?') + '</code>' +
      ' · 1 Minute alle ' + e.intervalle['1m'] + ' Tag(e)' +
      ' · 5 Minuten alle ' + e.intervalle['5m'] + ' · 15 Minuten alle ' + e.intervalle['15m'] +
      ' · ' + (e.abstandMs / 1000).toFixed(1) + ' s Abstand je Anfrage' +
      ' · frühestens ' + e.nachSchlussMinuten + ' Minuten nach Handelsschluss.' +
      '<br>Warum nach Handelsschluss: Yahoo korrigiert fertige Kerzen noch rund 18 Minuten rückwirkend nach ' +
      '(am 26.08.2026 über sechs Runden gemessen). Wer mitten in der Sitzung sammelt, schreibt vorläufige Zahlen.' +
      (st.marktOffen ? ' <b>Der Markt ist gerade offen</b> – planmäßig wird deshalb nicht gesammelt.' : '') +
      '<br>Stunden- und Tageskerzen holt die App <b>nicht</b>: die umfassen das ganze Universum und gehören zu den nächtlichen Werkzeugen.' +
      '</div>';

    k.innerHTML = h;

    var stop = el('archStop');
    if (stop) stop.onclick = function () { if (api && api.sammlerStop) api.sammlerStop().then(laden); };
    Array.prototype.forEach.call(k.querySelectorAll('.arch-hol'), function (b) {
      b.onclick = function () {
        if (!api || !api.sammlerStart) return;
        b.disabled = true;
        api.sammlerStart(b.getAttribute('data-iv')).then(function (r) {
          if (r && !r.ok) root.alert('Sammeln nicht möglich: ' + (r.grund || 'unbekannt'));
          laden();
        }).catch(function () { laden(); });
      };
    });
  }

  function laden() {
    if (!api || !api.sammlerStand || laeuftAnfrage) return;
    laeuftAnfrage = true;
    api.sammlerStand().then(function (st) {
      laeuftAnfrage = false;
      if (st) zeichne(st);
    }).catch(function (e) {
      laeuftAnfrage = false;
      var k = el('archivKarte');
      if (k) k.innerHTML = '<div class="loading">Der Sammler antwortet nicht: ' + U.esc(String(e && e.message || e)) + '</div>';
    });
  }

  if (api && api.onSammler) api.onSammler(function (st) { if (st) zeichne(st); });

  /* Geladen wird, wenn die Unterseite aufgeht - nicht beim Start der App. Der Stand
   * liest das Archiv von der Platte (bis zu 60 Dateien je Aufloesung); das gehoert
   * nicht in den Startvorgang, den Wilhelm jeden Morgen abwartet.
   * Der Fortschritt kommt ohnehin von selbst ueber onSammler. */
  document.addEventListener('sub-changed', function (ev) {
    if (ev && ev.detail && ev.detail.sub === 'archiv') laden();
  });
  /* Und wenn die Unterseite beim Start schon offen ist, weil die App sich den Ort
   * gemerkt hat: dann kommt kein sub-changed mehr, das diese Datei hoert. */
  document.addEventListener('DOMContentLoaded', function () {
    var s = document.getElementById('sub-archiv');
    if (s && s.classList.contains('active')) laden();
  });

  root.Archivkarte = { laden: laden, zeichne: zeichne, letzter: function () { return LETZTER; } };
})(typeof window !== 'undefined' ? window : globalThis);
