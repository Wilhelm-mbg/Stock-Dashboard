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
  /* Universum JE INTERVALL. Der Zweck ist verschieden: 1m/5m/15m fuettern den
   * Intraday-Handel und brauchen die Handelsmenge; 60m und 1d sind Messbestand
   * und brauchen alles. Wer hier nichts eintraegt, faellt auf 'universum' oben
   * zurueck - eine Einstellung, die es schon gab, bleibt damit gueltig.
   *
   * ACHTUNG, ZWEI DINGE HEISSEN HIER "UNIVERSUM" UND SIND ES NICHT:
   *   - diese Felder waehlen AUS, welche Werte gesammelt werden ('top500', 'alle',
   *     'etf' oder eine eigene Liste). Sie sind eine Einstellung.
   *   - massive/universum-<datum>.json ist der PUNKT-IN-ZEIT-BESTAND: welcher Wert
   *     WANN zum Universum gehoerte. Er ist eine Tatsache, er ist die Grundlage der
   *     Ueberlebensverzerrungs-Rechnung, und er ist die QUELLE, aus der die Auswahl
   *     oben schoepft (Q.listeBauen liest ihn). Fehlt er, kann gar nicht gesammelt
   *     werden - dann meldet offeneSymbole ein Hindernis, keinen Rueckstand.
   * Wer die beiden verwechselt, aendert eine Einstellung und glaubt, er habe den
   * Bestand geaendert - oder umgekehrt. */
  universen: { '60m': 'alle', '1d': 'alle' },
  /* Intervall -> Abstand in Tagen. 0 heisst: nicht sammeln. */
  intervalle: { '1m': 1, '5m': 7, '15m': 7, '60m': 1, '1d': 1 },
  nachSchlussMinuten: 30,
  abstandMs: Q.ABSTAND_MS,
};

/* Welche Intervalle die App selbst holt.
 *
 * BIS ZUM 27.08.2026 STANDEN 60m UND 1d BEWUSST NICHT HIER, und die Begruendung
 * war richtig: sie umfassen das ganze Universum (rund 2.900 Werte, 97 Minuten je
 * Lauf) und wurden von einem naechtlichen Werkzeug geholt - zwei Programme, die
 * dasselbe Archiv fuellen, ohne voneinander zu wissen, waeren doppelte Netzlast
 * fuer nichts. Diese Voraussetzung ist entfallen: die naechtlichen Aufgaben sind
 * geloescht, das Archiv wuerde ohne Zutun altern. Wilhelms Entscheid dazu lautet
 * "die app soll es machen, sie laeuft ohnehin" - sie ist der einzige Beteiligte,
 * der nicht ausfaellt. Der Grund gegen die Doppelarbeit bleibt gueltig und wird
 * jetzt anders eingeloest: die Archivsperre (_laeuft.json) haelt Handlaeufe und
 * Automat auseinander, und der Deckel unten sorgt dafuer, dass kein Lauf das
 * Archiv stundenlang belegt. */
var ERLAUBTE_INTERVALLE = ['1m', '5m', '15m', '60m', '1d'];

/* HOECHSTENS SO VIELE WERTE JE LAUF. Der Unterschied zwischen "die App sammelt"
 * und "die App faehrt einen Drei-Stunden-Batch": ein gedeckelter Lauf gibt die
 * Sperre nach rund zehn Minuten wieder frei, sodass ein draengendes Intervall
 * (1m verliert nach sieben Tagen unwiederbringlich) dazwischenkommt. Der Rest
 * bleibt offen und wird beim naechsten Mal geholt - die Buchfuehrung dafuer gibt
 * es laengst, sie zaehlt je Wert und nicht je Archiv.
 * NUR FUER DEN AUTOMATEN: ein Lauf von Hand holt weiterhin alles. */
var DECKEL_JE_LAUF = 300;

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
    universen: {},
    intervalle: {},
    nachSchlussMinuten: Math.round(zahl(roh.nachSchlussMinuten, 0, 720, VORGABE.nachSchlussMinuten)),
    abstandMs: Math.round(zahl(roh.abstandMs, 300, 60000, VORGABE.abstandMs)),
  };
  ERLAUBTE_INTERVALLE.forEach(function (iv) {
    var q = roh.intervalle && roh.intervalle[iv];
    e.intervalle[iv] = Math.round(zahl(q, 0, 365, VORGABE.intervalle[iv]));
    /* Das Universum je Intervall: eigener Eintrag, sonst die Vorgabe fuer dieses
     * Intervall, sonst das allgemeine Feld. Ein Tippfehler faellt damit auf eine
     * gueltige Menge zurueck und nicht auf eine leere. */
    var u = roh.universen && roh.universen[iv];
    e.universen[iv] = (typeof u === 'string' && u.trim())
      ? u.trim() : (VORGABE.universen[iv] || e.universum);
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
function symboleFuer(einst, intervall) {
  /* Ohne Intervall gilt das allgemeine Feld - so bleiben Aufrufer gueltig, die
   * nur "die Sammelmenge" meinen (der Handlauf-Knopf zum Beispiel). */
  var wahl = (intervall && einst.universen && einst.universen[intervall]) || einst.universum;
  var b = Q.listeBauen(wahl);
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
/* DER LEERE VERSUCH (04.09.2026, Wilhelms Auftrag "so aktuell wie nur moeglich").
 *
 * Ein Rueckstand im Inhalt sagt noch nicht, dass jemand ihn aufholen KANN. Findet die
 * Quelle fuer einen Wert nichts Neues - delistet, Reihe eingestellt, dieses Intervall
 * wird nicht mehr gefuehrt -, bleibt bisTag alt, und die Zeile darueber sagt bis in
 * alle Ewigkeit "faellig". Der Wert steht damit bei jedem Blick auf die Uhr vorn, und
 * alles hinter ihm kommt nie an die Reihe. Genau so lief es vom 02. bis zum 04.09.2026:
 * 124 Laeufe ueber EA und AVB, waehrend 522 Viertelstunden- und 3.263 Tagesreihen
 * warteten.
 *
 * kerzenquelle.js schreibt fuer diesen Fall `versucht: <heute>`. Hier wird daraus die
 * Entscheidung: ein Wert mit Rueckstand, dessen leerer Versuch noch keinen Abstand her
 * ist, ist NICHT faellig. Nach `abstandTage` fragt ihn der naechste Lauf wieder - genau
 * wie einen Wert ohne Daten. AUFGEGEBEN WIRD KEINER: ein Papier kann nach Wochen
 * wieder handelbar sein, und ein dauerhafter Ausschluss waere wieder ein stiller.
 *
 * DER BEZUGSPUNKT IST DERSELBE WIE OBEN, der letzte abgeschlossene Handelstag. Am
 * Wochenende rueckt er nicht weiter - dann wird auch nicht nachgefragt, denn es kann
 * nichts Neues geben. */
function istFaellig(eintrag, sollTag, abstandTage, jetzt) {
  if (!eintrag) return true;
  if (eintrag.bisTag) {
    var rueck = tageSeit(eintrag.bisTag, Date.parse(sollTag + 'T00:00:00Z'));
    if (!(rueck == null || rueck >= abstandTage)) return false;
    return !leerVersuchtFrisch(eintrag, sollTag, abstandTage);
  }
  var seit = tageSeit(eintrag.am, jetzt);
  if (!(seit == null || seit >= abstandTage)) return false;
  return !leerVersuchtFrisch(eintrag, sollTag, abstandTage);
}

/* Hat dieser Wert einen leeren Versuch, der noch keinen Abstand her ist? Getrennte
 * Funktion, weil zwei Stellen sie brauchen: istFaellig() haelt ihn zurueck, und
 * offeneSymbole() zaehlt ihn - "auf Stand" und "leer versucht" sind zwei Zustaende
 * und duerfen in der Anzeige nicht derselbe sein. */
function leerVersuchtFrisch(eintrag, sollTag, abstandTage) {
  if (!eintrag || !eintrag.versucht) return false;
  var seitVersuch = tageSeit(eintrag.versucht, Date.parse(sollTag + 'T00:00:00Z'));
  return seitVersuch != null && seitVersuch < abstandTage;
}

function offeneSymbole(intervall, einst, jetzt) {
  jetzt = jetzt || Date.now();
  var b = symboleFuer(einst, intervall);
  if (b.grund) return { grund: b.grund, alle: 0, dran: [] };
  var abstandTage = einst.intervalle[intervall];
  /* Abstand 0 heisst AUS. Ohne diese Zeile fiel der Wert auf 1 zurueck, und die Karte
   * meldete fuer eine abgeschaltete Aufloesung 34 offene Werte - eine Zahl, die nach
   * Rueckstand aussieht, wo gar nichts geplant ist. */
  if (!abstandTage) return { alle: b.symbole.length, dran: [], aus: true, quelle: b.quelle };
  var stand = Q.standLesen(Q.ordnerVon(intervall));
  var soll = Q.letzterAbgeschlossenerHandelstag(new Date(jetzt));
  var dran = [];
  var leerVersucht = 0;
  b.symbole.forEach(function (sym) {
    var f = stand.fertig && stand.fertig[sym];
    if (f) {
      if (istFaellig(f, soll, abstandTage, jetzt)) dran.push(sym);
      /* "Auf Stand" und "leer versucht" sind zwei verschiedene Gruende, nicht dran
       * zu sein. Sie hier zusammenzuwerfen hiesse, dem Leser einen Rueckstand als
       * Gesundheit zu verkaufen - dieselbe Stille, aus der dieser Fund kam. */
      else if (leerVersuchtFrisch(f, soll, abstandTage)) leerVersucht++;
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
  return { alle: b.symbole.length, dran: dran, leerVersucht: leerVersucht, quelle: b.quelle };
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
  var leerV = offen.leerVersucht || 0;
  var lage0 = { offen: dran, alle: offen.alle, leerVersucht: leerV,
                luecke: luecke, verloren: !!luecke.verloren };

  if (!dran) {
    lage0.faellig = false;
    /* "Alle Werte sind auf Stand" waere eine Beschoenigung, sobald welche darunter
     * sind, fuer die die Quelle nichts mehr hat. Der Zusatz nennt sie beim Namen. */
    lage0.grund = 'Alle ' + offen.alle + ' Werte sind auf Stand' +
      (leerV ? ' (' + leerV + ' davon nur leer versucht - die Quelle liefert dafuer nichts Neues)' : '');
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
      /* Fuer die Karte: wie viele Werte NUR deshalb nicht dran sind, weil die
       * Quelle sie leer beantwortet hat. Ohne diese Zahl saehe eine ausgelaufene
       * Reihe genauso aus wie eine gepflegte. */
      leerVersucht: offen.leerVersucht || 0,
      faellig: !!f.faellig,
      art: f.art || null,
      grund: f.grund,
      fensterTage: l.fensterTage,
      verloren: !!l.verloren,
      verloreneTage: l.luecke,
    };
  });
}

/* WELCHE INTERVALLE ARBEITET EIN BLICK AUF DIE UHR AB - UND IN WELCHER REIHENFOLGE?
 *
 * Bis zum 04.09.2026 stand diese Entscheidung in main.js und lautete `dran[0]`: EIN
 * Intervall je Blick, und zwar das erste faellige. Sie war fuenf Tage lang gruen und
 * trotzdem falsch, denn "das erste faellige" konnte ein Intervall sein, das NIE fertig
 * wird - der Kopf der Schlange, der nicht bedient werden kann, und hinter ihm steht
 * alles still (wiki/fehlerformen.md). 124 Laeufe ueber zwei Werte, drei Tage Stillstand
 * im Tagesarchiv, und jede einzelne Protokollzeile sah gesund aus.
 *
 * Jetzt kommen ALLE faelligen dran, nacheinander. Zwei Dinge bleiben:
 *   - 'aufholen' zuerst. Ein zulaufendes Quellfenster ist unwiederbringlich, ein
 *     planmaessiger Lauf kann warten.
 *   - die Reihenfolge aus ERLAUBTE_INTERVALLE innerhalb der beiden Gruppen: erst die
 *     Intraday-Aufloesungen, dann der Messbestand.
 * Aufgeteilt wird mit filter() und nicht mit sort(): filter haelt die Reihenfolge
 * nachweislich, eine Vergleichsfunktion tut es nur, solange die Laufzeit stabil
 * sortiert.
 *
 * REIN, damit sie ohne Electron pruefbar ist - das war der Grund, warum die alte
 * Fassung nie eine Zusicherung hatte. */
function reihenfolge(zeilen) {
  var faellige = (zeilen || []).filter(function (z) { return z && z.faellig; });
  var vorn = faellige.filter(function (z) { return z.art === 'aufholen'; });
  var hinten = faellige.filter(function (z) { return z.art !== 'aufholen'; });
  return vorn.concat(hinten);
}

function dauerSchaetzungMin(anzahl, abstandMs) {
  return Math.ceil(anzahl * abstandMs / 60000);
}

module.exports = {
  VORGABE: VORGABE, ERLAUBTE_INTERVALLE: ERLAUBTE_INTERVALLE, DECKEL_JE_LAUF: DECKEL_JE_LAUF,
  einstellungen: einstellungen, newYork: newYork, marktOffen: marktOffen, ruhig: ruhig,
  symboleFuer: symboleFuer, offeneSymbole: offeneSymbole, istFaellig: istFaellig,
  faellig: faellig, lage: lage, reihenfolge: reihenfolge,
  leerVersuchtFrisch: leerVersuchtFrisch,
  dauerSchaetzungMin: dauerSchaetzungMin, tageSeit: tageSeit,
  OEFFNET: OEFFNET, SCHLIESST: SCHLIESST,
};
