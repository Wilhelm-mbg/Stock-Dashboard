'use strict';
/* ================= Probe 2: der ABRUFMODUS =================
 *
 * Probe 1 hat beantwortet, DASS die Tafel liefert. Offen ist, WIE abgerufen wird - und das
 * entscheidet ueber Messgroesse und Laufzeit, muss also vor der Registrierung feststehen.
 *
 * Frage A: Traegt der Endpunkt sort=desc? Der zum Zeitpunkt T gueltige Quote ist der LETZTE
 *   bei oder vor T, nicht der erste danach. Wer den ersten danach nimmt, trifft bei duennen
 *   Werten systematisch den Augenblick einer Kursstellung - also genau die Klasse, um die es
 *   geht, zu schoen. Ohne sort=desc muesste die Studie anders gebaut werden.
 *
 * Frage B: Wie weit muss das Rueckblickfenster sein, damit ein duenner Wert einen Quote hat?
 *   Getestet mit 1 / 5 / 30 Minuten an MBUU.
 *
 * Frage C: Gilt `limit` je Symbol oder fuer den ganzen Aufruf? Probe 1, Frage 8 legt "fuer
 *   den ganzen Aufruf" nahe (limit=50 -> 50-mal AAPL, die anderen beiden leer). Wenn limit
 *   dagegen JE SYMBOL gilt, faellt die Laufzeit um zwei Groessenordnungen. Das ist die
 *   teuerste offene Frage der Studie und wird nicht geraten.
 *
 * Frage D: Wie viele Tage traegt ein Auktionsabruf? Bestimmt das Budget von Zusatz B.
 *
 * Frage E: Was kommt an einem Halbtag nach 13:00 ET zurueck? (Die Halbtage sind im Plan
 *   ausgeschlossen; die Probe prueft, ob der Ausschluss noetig ist.)
 *
 * Aufruf:  node studien/vorregistrierung-2026-09-02-spannen-historisch/probe2.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var S = require('./schluessel.js');
var P1 = require('./probe.js');

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Zeitstempel T minus n Minuten, als RFC3339. */
function minus(iso, minuten) {
  return new Date(new Date(iso).getTime() - minuten * 60000).toISOString();
}

function zeile(q) {
  if (!q) return 'kein Quote';
  var s = P1.spannePp(q);
  return q.t + '  bp=' + q.bp + ' ap=' + q.ap + '  Spanne=' + (s == null ? 'FEHLEND' : s.toFixed(4) + ' Pp');
}

/** Der Abruf, wie ihn das Messwerkzeug machen soll. */
function pfadDesc(syms, T, minuten, limit) {
  return '/stocks/quotes?symbols=' + encodeURIComponent(syms) +
         '&start=' + encodeURIComponent(minus(T, minuten)) +
         '&end=' + encodeURIComponent(T) +
         '&limit=' + limit + '&sort=desc&feed=sip';
}

async function main() {
  sag('=== Probe 2: Abrufmodus - ' + new Date().toISOString() + ' ===');
  sag('');
  if (!S.vorhanden()) { sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').'); return; }

  /* ---- A: sort=desc ---- */
  sag('A) sort=desc, AAPL, 5-Minuten-Rueckblick auf 2018-03-01 09:35:00 ET');
  var a = await abr(pfadDesc('AAPL', '2018-03-01T14:35:00Z', 5, 1));
  sag('    HTTP ' + a.status);
  if (a.status === 200) {
    sag('    ' + zeile(erster(a, 'AAPL')));
    sag('    -> muss BEI ODER VOR 14:35:00Z liegen. ' +
        (erster(a, 'AAPL') && erster(a, 'AAPL').t <= '2018-03-01T14:35:00.001Z' ? 'ERFUELLT' : 'VERFEHLT'));
  } else { sag('    Rumpf: ' + kurz(a)); }
  sag('');
  await pause(400);

  /* ---- B: Rueckblickfenster am duennen Wert ---- */
  sag('B) Rueckblickfenster, ' + P1.DUENN + ', 2018-03-01 09:35:00 ET');
  for (var i = 0; i < 3; i++) {
    var m = [1, 5, 30][i];
    var b = await abr(pfadDesc(P1.DUENN, '2018-03-01T14:35:00Z', m, 1));
    sag('    ' + String(m).padStart(2) + ' min:  HTTP ' + b.status + '   ' +
        (b.status === 200 ? zeile(erster(b, P1.DUENN)) : kurz(b)));
    await pause(400);
  }
  sag('');

  /* ---- B2: derselbe Wert im Mittagsfenster, als Vergleich ---- */
  sag('B2) ' + P1.DUENN + ' im Mittagsfenster 12:30 ET (Vergleich zur Eroeffnung)');
  var b2 = await abr(pfadDesc(P1.DUENN, '2018-03-01T17:30:00Z', 5, 1));
  sag('    HTTP ' + b2.status + '   ' + (b2.status === 200 ? zeile(erster(b2, P1.DUENN)) : kurz(b2)));
  sag('');
  await pause(400);

  /* ---- C: gilt limit je Symbol? Die teuerste Frage. ---- */
  sag('C) limit je Symbol oder je Aufruf?  symbols=AAPL,MSFT,' + P1.DUENN + ' limit=3 sort=desc, 30 min');
  var c = await abr(pfadDesc('AAPL,MSFT,' + P1.DUENN, '2018-03-01T17:30:00Z', 30, 3));
  sag('    HTTP ' + c.status);
  if (c.status === 200 && c.daten && c.daten.quotes) {
    var namen = Object.keys(c.daten.quotes);
    sag('    Symbole: ' + namen.map(function (n) { return n + '=' + c.daten.quotes[n].length; }).join(', '));
    sag('    -> je Symbol EIN Quote bei ' + namen.length + ' Symbolen und limit=3? ' +
        (namen.length === 3 && namen.every(function (n) { return c.daten.quotes[n].length >= 1; })
          ? 'JA - Sammelabruf moeglich, Laufzeit faellt drastisch'
          : 'NEIN - limit gilt fuer den ganzen Aufruf, ein Abruf je Symbol noetig'));
  } else { sag('    Rumpf: ' + kurz(c)); }
  sag('');
  await pause(400);

  /* ---- C2: Gegenprobe zu C mit limit=1 ---- */
  sag('C2) Gegenprobe: dieselben drei Symbole mit limit=1');
  var c2 = await abr(pfadDesc('AAPL,MSFT,' + P1.DUENN, '2018-03-01T17:30:00Z', 30, 1));
  if (c2.status === 200 && c2.daten && c2.daten.quotes) {
    sag('    Symbole: ' + Object.keys(c2.daten.quotes).map(function (n) {
      return n + '=' + c2.daten.quotes[n].length; }).join(', '));
  } else { sag('    HTTP ' + c2.status + ' ' + kurz(c2)); }
  sag('');
  await pause(400);

  /* ---- D: Auktionen, wie viele Tage je Abruf ---- */
  sag('D) Auktionen AAPL, ein ganzes Jahr in einem Abruf (2018)');
  var d = await abr('/stocks/auctions?symbols=AAPL&start=2018-01-01&end=2018-12-31&limit=10000&feed=sip');
  sag('    HTTP ' + d.status);
  if (d.status === 200 && d.daten && d.daten.auctions && d.daten.auctions.AAPL) {
    var L = d.daten.auctions.AAPL;
    sag('    Tage in der Antwort: ' + L.length + '   erster ' + L[0].d + '   letzter ' + L[L.length - 1].d);
    sag('    next_page_token: ' + (d.daten.next_page_token ? 'ja' : 'nein'));
    var mitC = L.filter(function (x) { return x.c && x.c.length; }).length;
    var mitO = L.filter(function (x) { return x.o && x.o.length; }).length;
    sag('    davon mit Schlussauktion ' + mitC + ', mit Eroeffnungsauktion ' + mitO);
  } else { sag('    Rumpf: ' + kurz(d)); }
  sag('');
  await pause(400);

  /* ---- E: Halbtag nach 13:00 ET ---- */
  sag('E) Halbtag 2018-11-23 (Tag nach Thanksgiving), 15:55 ET - Handel endete 13:00');
  var e = await abr(pfadDesc('AAPL', '2018-11-23T20:55:00Z', 5, 1));
  sag('    HTTP ' + e.status + '   ' + (e.status === 200 ? zeile(erster(e, 'AAPL')) : kurz(e)));
  sag('    (leer = der Ausschluss der Halbtage im Plan ist richtig)');
  sag('');
  sag('=== Ende Probe 2 ===');
}

function erster(r, sym) {
  var L = r.daten && r.daten.quotes ? r.daten.quotes[sym] : null;
  return Array.isArray(L) && L.length ? L[0] : null;
}
function kurz(r) { return String(r.text || '').replace(/\s+/g, ' ').slice(0, 250); }
function abr(pfad) { return P1.abruf(pfad); }

if (require.main === module) { main(); }
