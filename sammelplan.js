'use strict';
/* WANN SAMMELT DIE APP - und welche Werte.
 *
 * kerzenquelle.js weiss, WIE eine Kerze geholt und fortgeschrieben wird. Hier steht
 * nur die Entscheidung darueber, ob jetzt ein guter Zeitpunkt ist. Getrennt, weil
 * die beiden Fragen verschieden oft falsch beantwortet werden: das Wie steht seit
 * dem 26.08.2026 fest und ist gemessen, das Wann haengt an Wilhelms Gewohnheiten
 * und wird sich aendern.
 *
 * ZWEI DINGE, DIE HIER NICHT PASSIEREN: es wird nicht gemessen und nicht gehandelt.
 * Dieser Planer schreibt Kursdateien und sonst nichts.
 *
 * DIE ZAHLEN STEHEN OFFEN (Vorgabe, aenderbar):
 *   Universum   die 500 umsatzstaerksten Werte des Punkt-in-Zeit-Universums,
 *               dazu immer die 31 ETFs
 *   1m          taeglich     - Yahoo haelt nur 7 Tage; was hier fehlt, ist fort
 *   5m / 15m    woechentlich - 60-Tage-Fenster, eine Woche Pause ist ungefaehrlich
 *   60m / 1d    gar nicht    - die holen die naechtlichen Werkzeuge, und zwar fuer
 *                              das GANZE Universum, nicht nur die 500
 *   Abstand     1,2 s je Anfrage (dieselbe Zahl wie im Werkzeug)
 *   Nachlauf    30 Minuten nach Handelsschluss
 *
 * WARUM NACH HANDELSSCHLUSS: gemessen am 26.08.2026 korrigiert Yahoo Kerzen noch
 * rund achtzehn Minuten rueckwirkend nach - nicht nur den Umsatz, auch Kurse. Wer
 * mitten in der Sitzung sammelt, schreibt vorlaeufige Zahlen. Sie werden beim
 * naechsten Lauf ueberschrieben, aber der letzte Lauf vor einer Pause bliebe stehen.
 * Der Handelsschluss kommt aus der Zeitzone America/New_York, nicht aus einer festen
 * UTC-Stunde: die waere von November bis Maerz um eine Stunde daneben. Nachgerechnet:
 * 20:35 UTC ist im August 16:35 New York (zu), im Dezember 15:35 (offen).
 */

var Q = require('./kerzenquelle.js');

var VORGABE = {
  an: true,
  universum: 'top500',
  /* Intervall -> Abstand in Tagen. 0 heisst: nicht sammeln. */
  intervalle: { '1m': 1, '5m': 7, '15m': 7 },
  nachSchlussMinuten: 30,
  abstandMs: Q.ABSTAND_MS,
};

/* Nur diese Intervalle darf die App selbst holen. 60m und 1d stehen bewusst nicht
 * drin: sie umfassen das ganze Universum (2.900 Werte, rund 97 Minuten je Lauf) und
 * gehoeren zu den naechtlichen Werkzeugen. Zwei Programme, die dasselbe Archiv
 * fuellen, ohne voneinander zu wissen, waeren doppelte Netzlast fuer nichts. */
var ERLAUBTE_INTERVALLE = ['1m', '5m', '15m'];

function zahl(x, klein, gross, ersatz) {
  var n = Number(x);
  if (!isFinite(n)) return ersatz;
  return Math.min(gross, Math.max(klein, n));
}

/* Eingaben kommen aus einer Datei, die ein Mensch bearbeitet haben kann. Was nicht
 * passt, wird auf die Vorgabe gezogen und nicht abgelehnt - eine Zahl mit Tippfehler
 * darf das Sammeln nicht stilllegen. */
function einstellungen(roh) {
  roh = roh && typeof roh === 'object' ? roh : {};
  var e = {
    an: roh.an === undefined ? VORGABE.an : !!roh.an,
    universum: typeof roh.universum === 'string' && roh.universum.trim()
      ? roh.universum.trim() : VORGABE.universum,
    intervalle: {},
    nachSchlussMinuten: Math.round(zahl(roh.nachSchlussMinuten, 0, 720, VORGABE.nachSchlussMinuten)),
    abstandMs: Math.round(zahl(roh.abstandMs, 300, 60000, VORGABE.abstandMs)),
  };
  ERLAUBTE_INTERVALLE.forEach(function (iv) {
    var q = roh.intervalle && roh.intervalle[iv];
    e.intervalle[iv] = Math.round(zahl(q, 0, 365, VORGABE.intervalle[iv]));
  });
  return e;
}

/* ================= WANN ================= */

/* Uhrzeit an der New Yorker Boerse. Ueber Intl, damit die Sommerzeit stimmt, ohne
 * dass hier ein Kalender gepflegt werden muss. */
function newYork(jetzt) {
  var f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour12: false,
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
  var t = {};
  f.formatToParts(new Date(jetzt)).forEach(function (p) { t[p.type] = p.value; });
  var stunde = parseInt(t.hour, 10) % 24;
  return {
    wochentag: t.weekday,
    minutenSeitMitternacht: stunde * 60 + parseInt(t.minute, 10),
    wochenende: t.weekday === 'Sat' || t.weekday === 'Sun',
  };
}

var OEFFNET = 9 * 60 + 30;   // 09:30 New York
var SCHLIESST = 16 * 60;     // 16:00 New York

/* Ist der Markt gerade offen? Feiertage kennt diese Funktion nicht und behauptet es
 * auch nicht - an einem Feiertag sagt sie "offen" und der Lauf verschiebt sich um
 * einen Tag. Das ist die harmlose Richtung: lieber einmal zu spaet sammeln als
 * vorlaeufige Kerzen schreiben. Halbe Handelstage (Schluss 13:00) verschieben den
 * Lauf um drei Stunden nach hinten, mehr nicht. */
function marktOffen(jetzt) {
  var ny = newYork(jetzt);
  if (ny.wochenende) return false;
  return ny.minutenSeitMitternacht >= OEFFNET && ny.minutenSeitMitternacht < SCHLIESST;
}

/* Ruhiger Zeitpunkt: nach Handelsschluss plus Nachlauf, oder vor der Eroeffnung. */
function ruhig(jetzt, nachSchlussMinuten) {
  var ny = newYork(jetzt);
  if (ny.wochenende) return true;
  if (ny.minutenSeitMitternacht < OEFFNET) return true;
  return ny.minutenSeitMitternacht >= SCHLIESST + nachSchlussMinuten;
}

function tageSeit(tag, jetzt) {
  if (!tag) return null;
  var t = Date.parse(tag + 'T00:00:00Z');
  if (!isFinite(t)) return null;
  return (jetzt - t) / 86400000;
}

/* ================= WELCHE WERTE ================= */

/* Die Werte fuer einen Lauf. Die ETFs kommen IMMER mit, unabhaengig vom Universum:
 * SPY ist der Anker des Regime-Tors, und ein Anker, der nur manchmal da ist, ist
 * keiner. Doppelte fallen raus. */
function symboleFuer(einst) {
  var b = Q.listeBauen(einst.universum);
  if (b.grund) return b;
  var gesehen = {};
  var aus = [];
  Q.ETFS.concat(b.symbole).forEach(function (s) {
    if (!gesehen[s]) { gesehen[s] = 1; aus.push(s); }
  });
  return { symbole: aus, quelle: b.quelle + ' + ' + Q.ETFS.length + ' ETFs' };
}

/* WELCHE WERTE SIND DRAN - je Wert gezaehlt, nicht je Archiv.
 * Die erste Fassung fragte nur, wann ZULETZT gesammelt wurde. Am 26.08.2026 stand
 * damit "1m: zuletzt vor 0,8 Tagen, nicht dran" ueber einem Archiv, dessen Lauf bei
 * 1.834 von 2.732 Werten gestorben war: 898 Werte hatte nie jemand geholt, und die
 * App haette bis zum naechsten Tag gewartet und dort wieder von vorn angefangen.
 * "Heute gesammelt" ist eben nicht "vollstaendig gesammelt" - dieselbe Verwechslung,
 * die das Stundenarchiv zwei Tage stillstehen liess.
 * Nebenbei loest das die Wiederaufnahme von selbst: ein abgebrochener Lauf laesst
 * genau die uebrigen Werte offen, und der naechste nimmt sie. */
/* IST DIESER WERT FAELLIG? Gemessen wird der Rueckstand des INHALTS, nicht das Alter
 * des Abrufs.
 *
 * Vorher entschied tageSeit(f.am) - das Datum, an dem zuletzt nachgesehen wurde. Ein
 * Lauf VOR der US-Eroeffnung kann zwangslaeufig nur den Vortag holen, setzte aber den
 * heutigen Stempel; danach galt der Wert bis morgen als erledigt. Am 27.08.2026 trugen
 * so 840 Reihen ueber drei Intervalle den Tagesstempel, und in der Stichprobe enthielt
 * KEINE EINZIGE den 27.08. - waehrend die Karte "alle 531 Werte sind auf Stand" meldete.
 * Wer daraus schloss, der heutige Tag sei im Archiv, mass auf einem Archiv ohne ihn.
 *
 * DER BEZUGSPUNKT IST DER LETZTE ABGESCHLOSSENE HANDELSTAG, nicht "heute". Damit loest
 * sich der Ausloeser von selbst: vor der Eroeffnung ist der letzte abgeschlossene Tag
 * der Vortag; eine Reihe, die den Vortag enthaelt, ist dann vollstaendig und wird gar
 * nicht erst geholt - es kann also auch nichts falsch gestempelt werden. Nach
 * Handelsschluss rutscht der Bezugspunkt weiter und der Wert wird faellig.
 *
 * WARUM DAS MEHR IST ALS KOSMETIK: Bleibt die App laenger als sieben Tage aus, faellt
 * die Luecke aus dem Quellfenster von 1m und ist wirklich weg - waehrend der Plan die
 * ganze Zeit "auf Stand" sagte. Der Verlust waere bis zuletzt unsichtbar gewesen.
 *
 * Eintraege ohne bisTag stammen von vor dieser Aenderung und fallen auf die alte
 * Rechnung zurueck. Das heilt sich beim naechsten Abruf von selbst, denn der schreibt
 * bisTag mit; ein Nachtragen von Hand haette 3.000 Dateien lesen muessen. */
function istFaellig(eintrag, sollTag, abstandTage, jetzt) {
  if (!eintrag) return true;
  if (eintrag.bisTag) {
    var rueck = tageSeit(eintrag.bisTag, Date.parse(sollTag + 'T00:00:00Z'));
    return rueck == null || rueck >= abstandTage;
  }
  var seit = tageSeit(eintrag.am, jetzt);
  return seit == null || seit >= abstandTage;
}

function offeneSymbole(intervall, einst, jetzt) {
  jetzt = jetzt || Date.now();
  var b = symboleFuer(einst);
  if (b.grund) return { grund: b.grund, alle: 0, dran: [] };
  var abstandTage = einst.intervalle[intervall];
  /* Abstand 0 heisst AUS. Ohne diese Zeile fiel der Wert auf 1 zurueck, und die Karte
   * meldete fuer eine abgeschaltete Aufloesung 34 offene Werte - eine Zahl, die nach
   * Rueckstand aussieht, wo gar nichts geplant ist. */
  if (!abstandTage) return { alle: b.symbole.length, dran: [], aus: true, quelle: b.quelle };
  var stand = Q.standLesen(Q.ordnerVon(intervall));
  var soll = Q.letzterAbgeschlossenerHandelstag(new Date(jetzt));
  var dran = [];
  b.symbole.forEach(function (sym) {
    var f = stand.fertig && stand.fertig[sym];
    if (f) {
      if (istFaellig(f, soll, abstandTage, jetzt)) dran.push(sym);
      return;
    }
    /* Werte ohne Daten (delistet, nie gelistet, an einem Tag mit Netzstoerung
     * durchgefallen) werden nicht bei jedem Lauf neu gefragt - aber auch nicht fuer
     * immer aufgegeben: nach dem zehnfachen Abstand darf es einer noch einmal
     * versuchen. Ein dauerhafter Ausschluss waere wieder ein stiller. */
    var o = stand.ohne && stand.ohne[sym];
    var seitOhne = o ? tageSeit(o.am, jetzt) : null;
    if (o && seitOhne != null && seitOhne < abstandTage * 10) return;
    dran.push(sym);
  });
  return { alle: b.symbole.length, dran: dran, quelle: b.quelle };
}

/* ================= IST ES SOWEIT ================= */

/* Drei Antworten, und die zweite ist die wichtige:
 *   'planmaessig'  Werte sind ueberfaellig und der Markt ist zu
 *   'aufholen'     das Fenster laeuft ab - dann wird auch bei offenem Markt geholt,
 *                  denn eine vorlaeufige Kerze ist besser als gar keine. Was aus
 *                  Yahoos rollendem Fenster faellt, kommt nie wieder.
 *   nicht faellig  mit Begruendung, nie kommentarlos
 */
function faellig(intervall, ueberblick, einst, jetzt, offen) {
  jetzt = jetzt || Date.now();
  var abstandTage = einst.intervalle[intervall];
  if (!einst.an) return { faellig: false, grund: 'Sammeln ist ausgeschaltet' };
  if (!abstandTage) return { faellig: false, grund: 'Fuer ' + intervall + ' ist kein Abstand gesetzt' };
  if (ueberblick.sperre && ueberblick.sperre.aktiv) {
    return { faellig: false, grund: 'Es schreibt gerade jemand in dieses Archiv' };
  }
  offen = offen || offeneSymbole(intervall, einst, jetzt);
  if (offen.grund) return { faellig: false, grund: offen.grund, offen: 0, alle: 0 };
  var dran = offen.dran.length;

  /* Wie nah ist das Fenster am Zulaufen? Der Vergleich haengt an der juengsten
   * KERZE, nicht am Sammeldatum: ein Lauf, der nichts Neues fand, ist kein Beleg
   * dafuer, dass das Archiv aktuell ist. */
  var luecke = Q.fensterLuecke(intervall, ueberblick.juengsteMs, jetzt);
  var cfg = Q.INTERVALLE[intervall] || {};
  /* Ab drei Vierteln des Fensters wird es eng. Bei 1m sind das gut fuenf Tage -
   * genug Vorlauf, um einen ausgeschalteten Rechner ueber ein Wochenende zu
   * ueberstehen, aber frueh genug, um nichts zu verlieren. */
  var eng = !!(cfg.fensterTage && luecke.tageAus != null && luecke.tageAus >= cfg.fensterTage * 0.75);
  var lage0 = { offen: dran, alle: offen.alle, luecke: luecke, verloren: !!luecke.verloren };

  if (!dran) {
    lage0.faellig = false;
    lage0.grund = 'Alle ' + offen.alle + ' Werte sind auf Stand';
    return lage0;
  }
  if (eng || luecke.verloren) {
    lage0.faellig = true;
    lage0.art = 'aufholen';
    lage0.grund = luecke.verloren
      ? 'Das Fenster ist zu: ' + luecke.luecke.toFixed(1) + ' Tage sind unwiederbringlich weg'
      : 'Das Fenster laeuft ab - noch ' + (cfg.fensterTage - luecke.tageAus).toFixed(1) + ' Tage';
    return lage0;
  }
  if (marktOffen(jetzt) || !ruhig(jetzt, einst.nachSchlussMinuten)) {
    lage0.faellig = false;
    lage0.grund = dran + ' Werte waeren dran, aber der Markt ist offen - waehrend der ' +
      'Sitzung sind die letzten Kerzen vorlaeufig';
    return lage0;
  }
  lage0.faellig = true;
  lage0.art = 'planmaessig';
  lage0.grund = dran + ' von ' + offen.alle + ' Werten sind laenger als ' + abstandTage + ' Tag(e) her';
  return lage0;
}

/* Was der Anwender sehen soll: je Intervall eine Zeile. Reine Auskunft, kein Netz. */
function lage(einst, jetzt) {
  jetzt = jetzt || Date.now();
  return ERLAUBTE_INTERVALLE.map(function (iv) {
    var ziel = Q.ordnerVon(iv);
    var u = Q.archivUeberblick(ziel, { stichprobe: 60 });
    var offen = offeneSymbole(iv, einst, jetzt);
    var f = faellig(iv, u, einst, jetzt, offen);
    var l = Q.fensterLuecke(iv, u.juengsteMs, jetzt);
    return {
      intervall: iv,
      ordner: ziel,
      werte: u.dateien,
      angesehen: u.angesehen,
      juengsterTag: u.juengsterTag,
      juengsteMs: u.juengsteMs,
      zuletztGesammelt: u.zuletztGesammelt,
      ohneDaten: u.ohneDaten,
      sperre: u.sperre,
      abstandTage: einst.intervalle[iv],
      imUniversum: offen.alle || 0,
      /* Ein HINDERNIS ist etwas anderes als "nicht dran": ohne Universum kann gar
       * nicht gesammelt werden, und das darf nicht wie Gesundheit aussehen. */
      hindernis: offen.grund || null,
      offeneWerte: offen.dran ? offen.dran.length : 0,
      faellig: !!f.faellig,
      art: f.art || null,
      grund: f.grund,
      fensterTage: l.fensterTage,
      verloren: !!l.verloren,
      verloreneTage: l.luecke,
    };
  });
}

function dauerSchaetzungMin(anzahl, abstandMs) {
  return Math.ceil(anzahl * abstandMs / 60000);
}

module.exports = {
  VORGABE: VORGABE, ERLAUBTE_INTERVALLE: ERLAUBTE_INTERVALLE,
  einstellungen: einstellungen, newYork: newYork, marktOffen: marktOffen, ruhig: ruhig,
  symboleFuer: symboleFuer, offeneSymbole: offeneSymbole, istFaellig: istFaellig,
  faellig: faellig, lage: lage,
  dauerSchaetzungMin: dauerSchaetzungMin, tageSeit: tageSeit,
  OEFFNET: OEFFNET, SCHLIESST: SCHLIESST,
};
