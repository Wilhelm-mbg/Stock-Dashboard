'use strict';
/* ================= Trendfinder (Werkzeuge → Betrieb, Klappe Trendfinder) =================
 *
 * Stufe E des Struktur-Plans (studien/struktur-plan-2026-08-25/PLAN.md): erster der
 * sieben Bloecke, die aus depot.js herausgeloest sind. Der Inhalt ist WOERTLICH
 * umgezogen - gleiche Funktionen, gleiche Kommentare, gleiche Marken; nur dieser
 * Kopf und die Verkabelung am Ende sind neu. Der Block beruehrt den Depot-Zustand
 * nicht schreibend und handelt nichts.
 *
 * Abhaengigkeiten: Q/U/Chart sind global (Ladereihenfolge: quant, app-shell und
 * chart stehen weit vor dieser Datei). Was aus dem Handelsmodul kommt - das
 * Beobachtungs-Universum, der Intraday-Kursabruf, der Parallel-Helfer -, wird von
 * depot.js in init() ueber WendeUI.verkabeln() hereingereicht: depot bleibt der
 * einzige Ort, der Kurse holt. */
(function () {
  var U = window.U, Q = window.Quant;
  var niceTicks = window.Chart.niceTicks;
  var fmtTick = window.Chart.fmtTick;
  var fmtTimeTick = window.Chart.fmtTimeTick;
  /* Von depot.js hereingereicht (verkabeln) - vorher ist pruefen() ein stiller Leerlauf. */
  var universe = null, fetchIntraday = null, pmap = null;

  /* ================= Trendfinder (Felix #33/#35, Umbau #58) =================
   * Seit #58 steht der TREND vorn und der Trendwechsel daneben als sein Sonderfall:
   * Ein Trend hat drei Eigenschaften - Richtung, Guete, Breite -, dieselben, die der
   * Aktien-Explorer zu einem Kanal nennt. Ein Wechsel ist der Moment, in dem der junge
   * Abschnitt gegen den Vortrend dreht. Beides wird getrennt bestimmt; die Guete loest
   * ausdruecklich NICHTS aus (als Handelsbedingung gemessen und widerlegt: -0,17 Pp,
   * t = -4,1).
   * BEOBACHTUNG, kein Handel: Der Winkel-Detektor war der einzige Teilueberlebende
   * der Trendwende-Studie, aber die 1m-Basis war zu kurz und ~44 % des Effekts war
   * Tageszeit-Drift. Der Retest kommt, wenn das naechtlich wachsende 1m-Archiv
   * 60+ Tage traegt. Bis dahin: live ansehen, nichts kaufen. */
  var wendeLaeuft = false, wendeZuletzt = 0;
  /* Die zuletzt geprueften Kerzen je Wert, damit der Chart (Wunsch #38) genau die
   * Reihe zeigt, auf der auch gerechnet wurde - kein zweiter Abruf, keine Abweichung. */
  var WENDE_BARS = {}, WENDE_ERG = {}, WENDE_F = 5;
  /** Was ist aus frueheren Drehungen DIESER Reihe geworden?
   *  Der Detektor wird ueber die Historie gefahren; jede Drehung wird bis zur
   *  GEGENDREHUNG gehalten - das ist die einzige Ausstiegsregel, die aus der Regel
   *  selbst folgt. Eine erfundene Haltedauer waere eine zweite, ungemessene Annahme.
   *
   *  Daneben die Kontrolle: dieselbe Haltedauer, dieselbe Reihe, aber an beliebigen
   *  Punkten - der Durchschnitt ueber alle. Ohne sie misst man Marktdrift und nennt
   *  sie Signal; bei der gemessenen Intraday-Regel waren das rund zwei Drittel.
   *
   *  Rueckgabe: { n, mittel, ktr, ueberschuss, dauerSchnitt } oder null. */
  function wendeNachlese(bars, opt) {
    try {
      if (!bars || bars.length < 260) return null;
      var S = opt.schwelle, F = opt.bestaetigung;
      var SCHRITT = Math.max(1, Math.round(bars.length / 400));   // nicht jede Kerze - das reicht und bleibt schnell
      var offen = null, faelle = [];
      for (var i = 200; i < bars.length - 1; i += SCHRITT) {
        var w = null;
        try { w = Q.trendwechsel(bars.slice(0, i + 1), { schwelle: S, bestaetigung: F }); } catch (e) { continue; }
        if (!w) continue;
        var richtung = w.aktuell && w.aktuell.winkel != null ? Math.sign(w.aktuell.winkel) : 0;
        if (offen && richtung && richtung !== offen.richtung) {
          // Gegendrehung: Position schliessen
          var ein = bars[offen.i][1], aus = bars[i][1];
          if (ein > 0 && aus > 0) {
            faelle.push({ i: offen.i, dauer: i - offen.i,
              ret: (aus / ein - 1) * 100 * offen.richtung });   // Short-Bein mit umgekehrtem Vorzeichen
          }
          offen = null;
        }
        if (!offen && w.signal && richtung) offen = { i: i, richtung: richtung };
      }
      if (faelle.length < 5) return null;
      var sum = 0, dau = 0;
      faelle.forEach(function (f) { sum += f.ret; dau += f.dauer; });
      var mittel = sum / faelle.length, dSchnitt = Math.round(dau / faelle.length);
      /* Kontrolle: dieselbe mittlere Haltedauer, ueber die ganze Reihe gemittelt.
       * Absolutbetrag waere falsch - gefragt ist, was ein beliebiger Einstieg
       * ueber dieselbe Zeit gebracht haette. */
      var ks = 0, kn = 0;
      for (var j = 200; j + dSchnitt < bars.length; j += SCHRITT) {
        var a2 = bars[j][1], b2 = bars[j + dSchnitt][1];
        if (a2 > 0 && b2 > 0) { ks += (b2 / a2 - 1) * 100; kn++; }
      }
      var ktr = kn >= 20 ? ks / kn : null;
      return { n: faelle.length, mittel: Math.round(mittel * 1000) / 1000,
               ktr: ktr == null ? null : Math.round(ktr * 1000) / 1000,
               ueberschuss: ktr == null ? null : Math.round((mittel - ktr) * 1000) / 1000,
               dauerSchnitt: dSchnitt };
    } catch (e) { return null; }
  }

  async function wendePruefen(erzwungen) {
    var el = document.getElementById('wendeTabelle'), st = document.getElementById('wendeStatus');
    if (!el || wendeLaeuft) return;
    // Beim blossen Reiterwechsel hoechstens alle 3 Minuten neu rechnen
    if (!erzwungen && Date.now() - wendeZuletzt < 3 * 60000 && el.querySelector('table')) return;
    wendeLaeuft = true;
    if (st) st.textContent = 'Prüfe …';
    try {
      var iv = (document.getElementById('wendeIv') || {}).value || '1m';
      var S = parseFloat((document.getElementById('wendeS') || {}).value || '1');
      var F = parseInt((document.getElementById('wendeF') || {}).value || '5', 10);
      var barMin = iv === '5m' ? 5 : 1;
      WENDE_F = F; WENDE_BARS = {}; WENDE_ERG = {};
      var syms = universe();   // 15 Standard-Werte + eigene Watchlist - bewusst NICHT der 99er-Pool (Abruflast)
      var fertig = 0;
      var zeilen = [];
      await pmap(syms, async function (sy) {
        var fd = await fetchIntraday(sy, iv, false);
        fertig++;
        if (st) st.textContent = 'Prüfe … (' + fertig + '/' + syms.length + ')';
        if (!fd || !fd.series || fd.series.length < 60) { zeilen.push({ sym: sy, fehler: 'keine Daten' }); return; }
        var sigBars = Q.fertigeBars(fd.series, barMin, Date.now());
        var w = Q.trendwechsel(sigBars, { schwelle: S, bestaetigung: F });
        WENDE_BARS[sy] = sigBars; WENDE_ERG[sy] = w;
        var nl = wendeNachlese(sigBars, { schwelle: S, bestaetigung: F });
        /* Der Trend selbst wird UNABHAENGIG von der Wendepunkt-Suche bestimmt (Wunsch #58).
         * Grund: Der Detektor braucht ZWEI bestaetigte Wendepunkte, sonst gibt er null
         * zurueck - und die Zeile meldete dann 'zu wenig Historie', obwohl ein
         * schnurgerader Trend lief. Wo der Detektor einen jungen Abschnitt hat, ist DAS
         * der Trend; wo nicht, steht der Kanal ueber die letzten 120 Kerzen - als
         * Fenster gekennzeichnet, damit man beides nicht verwechselt. */
        var kt = w && w.bild && w.bild.kanalJung ? { k: w.bild.kanalJung, quelle: 'wende' } : null;
        if (!kt && sigBars.length >= 40 && Q.kanalUeber) {
          var vonT = Math.max(0, sigBars.length - 1 - 120);
          var kf = Q.kanalUeber(sigBars, vonT, sigBars.length - 1);
          if (kf) kt = { k: kf, quelle: 'fenster' };
        }
        zeilen.push({ sym: sy, w: w, nl: nl, kt: kt });
      }, 4);
      /* Frische Wechsel zuoberst, danach die BESTEN Trends, erst dann die steilsten
       * (Wunsch #58: der Trend ist die Hauptsache, der Wechsel sein Sonderfall).
       * Die Reihenfolge ordnet nur die Anzeige - gehandelt wird davon nichts. */
      var gueteVon = function (z) { return z.kt ? z.kt.k.guete : -1; };
      zeilen.sort(function (a, b) {
        var sa = a.w && a.w.signal ? 1 : 0, sb = b.w && b.w.signal ? 1 : 0;
        if (sa !== sb) return sb - sa;
        var ga = gueteVon(a), gb = gueteVon(b);
        if (ga !== gb) return gb - ga;
        var wa = a.w && a.w.aktuell && a.w.aktuell.winkel != null ? Math.abs(a.w.aktuell.winkel) : -1;
        var wb = b.w && b.w.aktuell && b.w.aktuell.winkel != null ? Math.abs(b.w.aktuell.winkel) : -1;
        return wb - wa;
      });
      var pfeil = function (t) { return t === 'auf' || t === 'up' ? '↗' : (t === 'ab' || t === 'down' ? '↘' : '→'); };
      /* Der Kopf wird zweimal gebraucht: fuer die Tabelle und fuer die Tabelle in der
       * Klappe - damit eingeklappte Zeilen ihre Spaltenbeschriftung behalten. */
      var kopf = '<tr><th>Wert</th>' +
        '<th title="Der laufende Abschnitt seit dem letzten bestätigten Wendepunkt: Richtung und normierter Winkel (Steigung × Länge ÷ Kanalbreite).">Trend jetzt</th>' +
        '<th title="Güte 0–100 aus denselben drei Eigenschaften, die der Aktien-Explorer zu einem Kanal nennt: Passgenauigkeit, Berührungen beider Kanten, Länge. Reine Beschreibung – als Handelsbedingung ist der Kanal gemessen und widerlegt (−0,17 Pp je Trade, t = −4,1).">Güte</th>' +
        '<th title="Breite des Kanals in Prozent des Kursniveaus – wie viel Luft der Trend zwischen seinen Kanten hat.">Breite</th>' +
        '<th>Vortrend</th><th>Drehung</th>' +
        '<th title="Die einzige Ausstiegsregel, die aus dem Detektor selbst folgt: halten, bis der Winkel zurückdreht.">Ausstieg</th>' +
        '<th title="Wie viele Drehungen dieser Art in der verfügbaren Historie überhaupt vorkommen. Für eine belastbare Bewertung bräuchte es rund 30 – dafür reicht das Archiv nicht.">Fälle in der Historie</th>' +
        '<th>Stand</th></tr>';
      var h = '<table class="tbl">' + kopf;
      /* Die Zeilen werden erst gesammelt und dann durch U.wandBuendeln geschickt:
       * gleiche Statuszeilen werden zu einer Sammelzeile mit Zaehler, die Einzelzeilen
       * stehen woertlich in der Klappe darunter (Befund B2, 25.08.2026). */
      var posten = [];
      zeilen.forEach(function (z) {
        if (z.fehler || (!z.w && !z.kt)) {
          /* Zeilen ohne jede Aussage sind der Hauptfall der Wiederholungs-Wand: bei
           * frischem Archiv steht das fuer JEDEN Wert da. Der Grund wird zum Schluessel,
           * der Text selbst bleibt woertlich in der Zeile - einmal gerechnet, damit
           * Schluessel und Anzeige nicht auseinanderlaufen koennen. */
          var leerGrund = z.fehler || 'zu wenig Historie';
          posten.push({ status: leerGrund, html:
            '<tr><td><b>' + U.esc(z.sym) + '</b></td><td colspan="8" style="color:var(--muted);">' + U.esc(leerGrund) + '</td></tr>' });
          return;
        }
        var v = z.w ? z.w.vorher : null, a = z.w ? z.w.aktuell : null, sig = z.w ? z.w.signal : null;
        /* Die drei Eigenschaften des laufenden Trends (Wunsch #58) kommen aus GENAU dem
         * Kanal, den der Detektor selbst gerechnet hat - kein zweiter Rechenweg. */
        var kj = z.kt ? z.kt.k : null;
        var ausFenster = !!(z.kt && z.kt.quelle === 'fenster');
        // Winkel des Fenster-Kanals in derselben Einheit wie der des Detektors
        var wkF = (ausFenster && kj.breite > 0) ? Math.round(kj.steigung * kj.n / kj.breite * 100) / 100 : null;
        var dreht = v && a && a.winkel != null && Math.abs(v.winkel) >= 0.5 && Math.sign(a.winkel) !== Math.sign(v.winkel);
        var zeichenbar = !!(z.w && z.w.bild && (z.w.bild.kanalVor || z.w.bild.kanalJung));
        /* Der Stand steht jetzt als eigene Groesse da, weil er zweimal gebraucht wird:
         * in seiner Zelle und als Schluessel der Sammelzeile. Wortlaut unveraendert. */
        var standTxt = !z.w ? 'nur Trend, kein Wechsel-Urteil'
          : (a && a.winkel != null && Math.abs(a.winkel) < S ? 'zu flach' : 'kein Wechsel');
        var zeileHtml = '<tr' + (zeichenbar ? ' data-wende="' + U.esc(z.sym) + '" style="cursor:pointer;' + (sig ? ' background:var(--up-soft);' : '') + '" title="Klick zeigt den Kursverlauf mit Wendepunkt und beiden Abschnitten"' : (sig ? ' style="background:var(--up-soft);"' : '')) + '><td><b>' + U.esc(z.sym) + (zeichenbar ? ' <span style="color:var(--muted); font-weight:400;">▸</span>' : '') + '</b></td>' +
          '<td>' + (a && a.winkel != null
            ? pfeil(a.trend) + ' ' + U.nf2.format(a.winkel) + ' <span style="color:var(--muted);">(seit ' + a.seitKerzen + ' Kerzen)</span>'
            : (kj
              ? pfeil(kj.trend) + (wkF != null ? ' ' + U.nf2.format(wkF) : '') +
                ' <span style="color:var(--muted);">(Fenster: letzte ' + kj.n + ' Kerzen' +
                (a ? ', ' + U.esc(a.trend) : ', kein bestätigter Wendepunkt') + ')</span>'
              : '<span style="color:var(--muted);">–</span>')) + '</td>' +
          '<td' + (kj ? ' title="Passgenauigkeit ' + kj.r2 + ', Kanten berührt ' + kj.beruehrungenOben + '× oben / ' + kj.beruehrungenUnten + '× unten, ' + kj.n + ' Kerzen lang – ' + (ausFenster ? 'gerechnet über ein festes Fenster, weil kein bestätigter Wendepunkt in Reichweite liegt' : 'gerechnet über den jungen Abschnitt seit dem Wendepunkt') + '"' : '') + '>' +
            (kj ? kj.guete + '/100' : '<span style="color:var(--muted);">–</span>') + '</td>' +
          '<td>' + (kj ? U.nf2.format(kj.breitePct) + ' %' : '<span style="color:var(--muted);">–</span>') + '</td>' +
          '<td>' + (v ? pfeil(v.trend) + ' ' + U.nf2.format(v.winkel) : '<span style="color:var(--muted);">kein Vortrend</span>') + '</td>' +
          '<td>' + (!z.w ? '<span style="color:var(--muted);">nicht bestimmbar</span>' : (dreht ? '<b>ja</b>' : 'nein')) + '</td>' +
          /* AUSSTIEG: Der Detektor hat keine eigene Ausstiegsregel - er erkennt eine
           * Drehung und sagt nie, wann man wieder raus soll. Die einzige Regel, die
           * aus ihm selbst folgt, ist die symmetrische: halten, bis der Winkel
           * zurueckdreht. Eine erfundene Haltedauer stuende hier als Zahl, die nie
           * gemessen wurde - deshalb steht stattdessen die Bedingung da. */
          '<td>' + (a && a.winkel != null
            ? '<span style="color:var(--muted);">bei Gegendrehung' +
              (z.nl && z.nl.dauerSchnitt ? ' – bisher im Schnitt nach ' + z.nl.dauerSchnitt + ' Kerzen' : '') + '</span>'
            : '<span style="color:var(--muted);">–</span>') + '</td>' +
          /* HIER STAND EINE ERTRAGSZAHL, UND SIE IST WIEDER RAUS.
           * Gemessen am 23.08.2026: Auf 4.000 Fuenf-Minuten-Kerzen findet der Detektor
           * rund SECHS Drehungen. Bei sechs Faellen kippt das Mittel das Vorzeichen,
           * sobald man nur die Abtastdichte aendert (-0,028 / +0,166 / +0,230 % bei
           * gleicher Fallzahl). Eine Zahl, die von einem Implementierungsdetail
           * abhaengt, gehoert nicht in die Oberflaeche - wer sie sieht, liest sie,
           * egal wie vorsichtig der Text daneben steht.
           * Was bleibt, ist die FALLZAHL: Sie sagt ehrlich, dass sich hier nichts
           * bewerten laesst. */
          '<td>' + (z.nl
            ? '<span style="color:var(--muted);">' + z.nl.n + ' Drehungen in der Historie – ' +
              'zu wenige für eine Bewertung</span>'
            : '<span style="color:var(--muted);">zu wenig Historie</span>') + '</td>' +
          '<td>' + (sig
            ? '<b class="' + (sig.dir === 'call' ? 'pos' : 'neg') + '">Wechsel nach ' + (sig.dir === 'call' ? 'OBEN' : 'UNTEN') + '</b>'
            : '<span style="color:var(--muted);">' + standTxt + '</span>') + '</td></tr>';
        /* Gebuendelt wird nur, was NICHTS zeigt: kein Wechsel UND kein Trendkanal.
         * Zeilen mit Kanal bleiben einzeln stehen - seit #58 ist der Trend die
         * Hauptsache und der Wechsel sein Sonderfall; eine Sammelzeile duerfte ihn
         * nicht verdecken. */
        posten.push({ status: (sig || kj) ? null : standTxt, html: zeileHtml });
      });
      h += U.wandBuendeln(posten, { spalten: 9, kopf: kopf, was: 'Werte' });
      h += '</table><div class="hinweis" style="margin-top:8px;"><b>Trendfinder:</b> Zuerst steht der laufende ' +
        'Trend mit seinen drei Eigenschaften – Richtung, Güte, Breite –, dieselben drei, die auch der ' +
        'Aktien-Explorer zu einem Kanal nennt, aus derselben Rechnung. Der Trendwechsel ist der Sonderfall ' +
        'rechts daneben: der Moment, in dem der junge Abschnitt gegen den Vortrend dreht (Wunsch #58).' +
        '<br><b>Trend ohne Wendepunkt:</b> Die Wechsel-Erkennung braucht zwei bestätigte Wendepunkte. Wo die ' +
        'fehlen, stand hier früher nur „zu wenig Historie“ – auch dann, wenn ein schnurgerader Trend lief. ' +
        'Jetzt steht dort der Kanal über die letzten 120 Kerzen, als „Fenster“ gekennzeichnet. Ein ' +
        'Wechsel-Urteil gibt es in solchen Zeilen weiterhin nicht – das wäre eine Zahl ohne Grundlage.' +
        '<br><b>Die Güte löst nichts aus – und das ist gemessen, nicht vorsichtig:</b> Der Trendkanal als ' +
        'Handelsbedingung kostete −0,17 Pp je Trade bei t = −4,1 (Abschnittskanal-Studie). Er ist als Filter ' +
        'nicht neutral, sondern schädlich. Ein Trend mit Güte 90 ist deshalb ein gut beschriebener Trend – ' +
        'kein guter Einstieg.' +
        '<br><br>Winkel = Steigung × Abschnittslänge ÷ Kanalbreite ' +
        '(wie steil relativ zum eigenen Rauschen; Vorzeichen = Richtung). „Wechsel“ = junger Abschnitt ist steiler als die ' +
        'Schwelle UND dreht gegen den Vortrend – die Studien-Bedingung. <b>Zeile anklicken</b> zeigt den Kursverlauf mit ' +
        'Wendepunkt und beiden Abschnitten (Wunsch #38). Simulation, keine Anlageberatung.' +
        '<br><br><b>Zum Ausstieg:</b> Der Detektor hat keine eigene Ausstiegsregel – er erkennt eine ' +
        'Drehung und sagt nichts darüber, wann man wieder heraus soll. Die einzige Regel, die aus ihm ' +
        'selbst folgt, ist die symmetrische: halten, bis der Winkel zurückdreht. Genau so ist die ' +
        'Spalte „Bisher“ gerechnet – jede vergangene Drehung dieser Reihe bis zur Gegendrehung.' +
        '<br><b>Warum hier keine Ertragszahl steht:</b> Es war eine geplant – und sie ist beim ' +
        'Nachrechnen durchgefallen. Auf 4.000 Fünf-Minuten-Kerzen findet der Detektor rund <b>sechs</b> ' +
        'Drehungen. Bei sechs Fällen entscheidet ein einziger Trade das Mittel, und das Vorzeichen ' +
        'kippt, sobald man nur die Abtastdichte ändert (−0,028 / +0,166 / +0,230 % bei gleicher ' +
        'Fallzahl). Für eine belastbare Bewertung bräuchte es rund 30 Fälle je Wert, also etwa ' +
        '20.000 Kerzen – das Archiv hat gut 5.000.' +
        '<br>Das ist selbst ein Ergebnis: <b>Dieser Reiter kann seine eigenen Signale nicht ' +
        'bewerten.</b> Er zeigt die Marktstruktur, und dafür ist er gut. Ob eine Drehung etwas ' +
        'einbringt, ist damit nicht zu beantworten – und eine Zahl hinzuschreiben, die es zu ' +
        'beantworten scheint, wäre schlechter als keine.' +
        '<br><b>Was aus der großen Messung bekannt ist:</b> Der Winkel-Detektor wurde auf 55 ' +
        'zurückgehaltenen Handelstagen nachgemessen; die ursprünglich gefundenen +0,25 Pp sind ' +
        'widerlegt (0,074 Pp, t = 1,22). Das ist die belastbare Aussage zu diesem Detektor.</div>';
      el.innerHTML = h;
      wendeChartsVerkabeln(el);
      wendeZuletzt = Date.now();
      if (st) st.textContent = 'Stand ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' + zeilen.filter(function (z) { return z.w && z.w.signal; }).length + ' Wechsel';
    } catch (eW) {
      if (st) st.textContent = 'Prüfung fehlgeschlagen: ' + (eW && eW.message ? eW.message : eW);
    } finally {
      wendeLaeuft = false;
    }
  }

  /* Wunsch #38: die Wende im Chart nachvollziehen koennen.
   * Ein Klick auf eine Zeile klappt den Kursverlauf darunter auf und zeigt GENAU das,
   * woraus der Detektor sein Urteil bildet: den Vor-Abschnitt, den bestaetigten
   * Wendepunkt, den jungen Abschnitt und beide Kanaele. Reine Anzeige - es wird
   * weiterhin nichts gehandelt. */
  function wendeChartsVerkabeln(el) {
    el.querySelectorAll('[data-wende]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var sy = tr.getAttribute('data-wende');
        var warOffen = tr.nextElementSibling && tr.nextElementSibling.className === 'wende-inline';
        el.querySelectorAll('tr.wende-inline').forEach(function (x) { x.parentNode.removeChild(x); });
        if (warOffen) return;
        tr.insertAdjacentHTML('afterend',
          '<tr class="wende-inline"><td colspan="9" style="background:var(--panel); padding:8px 12px; cursor:default;">' +
          '<div style="font-size:var(--fs-neben); font-weight:600; margin-bottom:4px;">' + U.esc(sy) + ' – Kursverlauf mit Wendepunkt</div>' +
          '<svg class="wende-chart" style="width:100%; height:220px; display:block;"></svg>' +
          '<div class="wende-legende" style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:6px; line-height:1.5;"></div>' +
          '</td></tr>');
        var zeile = tr.nextElementSibling;
        zeichneWendeChart(zeile.querySelector('.wende-chart'), zeile.querySelector('.wende-legende'),
          WENDE_BARS[sy], WENDE_ERG[sy], WENDE_F);
      });
    });
  }

  /** Zeichnet den Ausschnitt um die Wende: Kurs, beide Kanaele, Wendepunkt und
   *  die Kerze, ab der er bestaetigt war. Alle Geometrie stammt aus w.bild,
   *  also aus derselben Rechnung wie die Tabelle - der Chart kann gar nicht
   *  etwas anderes behaupten als das Urteil daneben. */
  function zeichneWendeChart(svg, legende, bars, w, F) {
    if (!svg) return;
    var b = w && w.bild;
    if (!bars || !bars.length || !b) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Keine Kerzen mehr im Speicher – bitte erneut prüfen.</text>';
      return;
    }
    var kV = b.kanalVor, kJ = b.kanalJung;
    // Fenster: etwas Vorlauf vor dem aelteren Wendepunkt, hoechstens 400 Kerzen
    var von = Math.max(0, Math.min(b.wpVor, bars.length - 1) - 12);
    von = Math.max(von, bars.length - 400);
    var bis = bars.length - 1;
    if (bis - von < 5) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Zu wenig Kerzen zum Zeichnen.</text>';
      return;
    }

    var W = svg.clientWidth || 860, H = svg.clientHeight || 220;
    var padL = 8, padR = 54, padT = 12, padB = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function X(i) { return padL + (i - von) / Math.max(1, bis - von) * plotW; }

    // Wertebereich: Kurse plus beide Kanalkanten im sichtbaren Fenster
    var lo = Infinity, hi = -Infinity, i;
    for (i = von; i <= bis; i++) {
      var c = bars[i][1];
      if (c == null) continue;
      if (c < lo) lo = c;
      if (c > hi) hi = c;
    }
    function kanalWert(k, idx, welche) {
      var mitte = k.achse + k.steigung * (idx - k.von);
      if (welche === 'm') return mitte;
      return mitte + (welche === 'o' ? (k.oben - k.mitteJetzt) : (k.unten - k.mitteJetzt));
    }
    [kV, kJ].forEach(function (k) {
      if (!k) return;
      [k.von, k.bis].forEach(function (idx) {
        ['o', 'u'].forEach(function (wl) {
          var v2 = kanalWert(k, idx, wl);
          if (isFinite(v2)) { if (v2 < lo) lo = v2; if (v2 > hi) hi = v2; }
        });
      });
    });
    if (!isFinite(lo) || !isFinite(hi)) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Keine gültigen Kurse.</text>';
      return;
    }
    var luft = (hi - lo) * 0.10 || 1;
    lo -= luft; hi += luft;
    function Y(v3) { return H - padB - (v3 - lo) / (hi - lo) * plotH; }

    var html = '';
    niceTicks(lo, hi, 4).forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + plotW + 4) + '" y="' + (Y(tv) + 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, hi - lo) + '</text>';
    });
    for (var xi = 0; xi <= 3; xi++) {
      var ix = Math.round(von + (bis - von) * xi / 3);
      html += '<text x="' + X(ix).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle') +
        '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(bars[ix][0], bars[bis][0] - bars[von][0]) + '</text>';
    }

    // Beide Kanaele als Band + Mittellinie, jeweils nur ueber ihren eigenen Abschnitt
    function band(k, farbe, gestrichelt) {
      if (!k) return '';
      var a = Math.max(von, k.von), e = Math.min(bis, k.bis);
      if (e - a < 1) return '';
      var oben = [], unten = [], mitte = [], j;
      for (j = a; j <= e; j++) {
        oben.push((oben.length ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'o')).toFixed(1));
        mitte.push((mitte.length ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'm')).toFixed(1));
      }
      for (j = e; j >= a; j--) unten.push(X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'u')).toFixed(1));
      return '<path d="' + oben.join(' ') + ' L' + unten.join(' L') + ' Z" fill="' + farbe + '" opacity="0.12"></path>' +
        '<path d="' + mitte.join(' ') + '" fill="none" stroke="' + farbe + '" stroke-width="1.8"' + (gestrichelt ? ' stroke-dasharray="5 4"' : '') + '></path>';
    }
    var farbeJung = w.aktuell && w.aktuell.winkel != null
      ? (w.aktuell.winkel > 0 ? 'var(--up)' : 'var(--down)') : 'var(--series3)';
    html += band(kV, 'var(--series2)', true);
    html += band(kJ, farbeJung, false);

    // Kurs
    var pfad = [];
    for (i = von; i <= bis; i++) {
      if (bars[i][1] == null) continue;
      pfad.push((pfad.length ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(bars[i][1]).toFixed(1));
    }
    html += '<path d="' + pfad.join(' ') + '" fill="none" stroke="var(--series)" stroke-width="1.8" stroke-linejoin="round"></path>';

    // Wendepunkte und die Kerze, ab der der juengere bestaetigt war
    function senkrechte(idx, farbe, text, hoch) {
      if (idx < von || idx > bis) return '';
      var x = X(idx);
      return '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + padT + '" y2="' + (H - padB) +
        '" stroke="' + farbe + '" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.8"></line>' +
        '<text x="' + (x + 3).toFixed(1) + '" y="' + (hoch ? padT + 9 : padT + 21) + '" fill="' + farbe + '" font-size="9.5" font-weight="600">' + text + '</text>';
    }
    html += senkrechte(b.wpVor, 'var(--muted)', 'Wendepunkt davor', true);
    html += senkrechte(b.wpLetzt, 'var(--ink-2)', 'Wendepunkt', true);
    html += senkrechte(b.wpLetzt + (F || 5), 'var(--muted)', 'ab hier bestätigt', false);
    [b.wpVor, b.wpLetzt].forEach(function (idx) {
      if (idx < von || idx > bis || bars[idx][1] == null) return;
      html += '<circle cx="' + X(idx).toFixed(1) + '" cy="' + Y(bars[idx][1]).toFixed(1) + '" r="4" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2"></circle>';
    });
    svg.innerHTML = html;

    if (legende) {
      var v = w.vorher, a2 = w.aktuell;
      legende.innerHTML =
        '<span style="color:var(--series2);">▬</span> Vor-Abschnitt (gestrichelt): ' +
        (v ? 'Winkel ' + U.nf2.format(v.winkel) : 'kein Vortrend') + ' · ' +
        '<span style="color:' + farbeJung + ';">▬</span> junger Abschnitt: ' +
        (a2 && a2.winkel != null ? 'Winkel ' + U.nf2.format(a2.winkel) + ' über ' + a2.seitKerzen + ' Kerzen' : U.esc(a2 ? a2.trend : '–')) + '<br>' +
        'Der Wendepunkt gilt erst ' + (F || 5) + ' Kerzen später als bestätigt – vorher weiß der Detektor nichts von ihm ' +
        '(walk-forward, kein Blick in die Zukunft). ' +
        (w.signal ? '<b class="' + (w.signal.dir === 'call' ? 'pos' : 'neg') + '">Das ist ein Wechsel nach ' + (w.signal.dir === 'call' ? 'OBEN' : 'UNTEN') + '.</b> ' : '') +
        'Beobachtung, kein Handel – Simulation, keine Anlageberatung.';
    }
  }


  /** Von depot.js init() gerufen: reicht die drei Handels-Helfer herein und
   *  verkabelt die Bedienelemente des Reiters. Der sub-changed-Sonderfall (Pille
   *  'wende' loest eine Pruefung aus) bleibt bewusst in depot.js - die Navigations-
   *  Sonderfaelle stehen dort an EINER Stelle. */
  /* Das URTEIL ueber den Detektor - die einzige Zeile Dauertext, die auf dieser Seite
   * geblieben ist (Oberflaeche Stufe 3, 03.09.2026). Sie steht NICHT im Markup: die
   * Zahlen (-0,17 Pp, t = -4,1) sind eine Messaussage, und die wohnt in
   * studienurteile.js - der Ablage, in der ausschliesslich Verwerfungen stehen.
   * Faellt der Eintrag weg, bleibt die Zeile leer, statt eine Behauptung zu zeigen. */
  function urteilZeigen() {
    var el = document.getElementById('wendeUrteil');
    if (!el) return;
    var u = window.StudienUrteile && window.StudienUrteile.verworfen('kanaltrend');
    el.textContent = u ? u.befund : '';
  }

  function verkabeln(deps) {
    universe = deps.universe;
    fetchIntraday = deps.fetchIntraday;
    pmap = deps.pmap;
    urteilZeigen();
    var wBtn = document.getElementById('wendeBtn');
    if (wBtn) wBtn.addEventListener('click', function () { wendePruefen(true); });
    ['wendeIv', 'wendeS', 'wendeF'].forEach(function (id) {
      var e2 = document.getElementById(id);
      if (e2) e2.addEventListener('change', function () { wendePruefen(true); });
    });
  }

  window.WendeUI = { verkabeln: verkabeln, pruefen: wendePruefen };
})();
