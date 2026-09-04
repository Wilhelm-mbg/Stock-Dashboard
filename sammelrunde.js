'use strict';
/* EIN BLICK AUF DIE UHR - und was er abarbeitet.
 *
 * sammelplan.js sagt, WAS faellig ist. kerzenquelle.js sagt, WIE eine Reihe geholt
 * wird. Hier steht dazwischen die dritte Frage, die bis zum 04.09.2026 niemand
 * gestellt hat: WIE VIEL davon ein einzelner Blick auf die Uhr erledigt.
 *
 * DIE ANTWORT LAUTETE dran[0] - EINES. Sie stand in main.js, war fuenf Tage lang
 * gruen und trotzdem falsch. Denn "das erste faellige Intervall" kann eines sein, das
 * NIE fertig wird: ein Wert bleibt faellig, solange seine juengste Kerze hinter dem
 * letzten abgeschlossenen Handelstag liegt, und fuer einen Wert, den die Quelle nicht
 * mehr fuehrt, ist das fuer immer. Vom 02. bis zum 04.09.2026 liefen so 124 Laeufe
 * ueber zwei Werte (EA, bisTag 04.08.; AVB, bisTag 14.08.), waehrend 522 Viertelstunden-
 * und 3.263 Tagesreihen warteten. Jede Zeile im Protokoll sah ordentlich aus.
 * Der Kopf der Schlange, der nie fertig wird (wiki/fehlerformen.md).
 *
 * WARUM DAS EIN EIGENES MODUL IST: weil genau diese Schleife eine Zusicherung braucht
 * und sie in main.js keine bekommen konnte - dort haengt sie an Electron. Hier haengt
 * sie an nichts: Plan, Archiv, der eigentliche Lauf und der Funk kommen als Argumente
 * herein. Der Test spielt damit 124 Blicke auf die Uhr in Millisekunden durch und
 * sieht nach, ob der Fehler zurueckkommt.
 *
 * DREI DINGE, DIE HIER NICHT PASSIEREN: es wird nicht gehandelt, nicht gemessen und
 * nicht selbst geholt. Dieses Modul entscheidet die Reihenfolge und ruft auf.
 */
(function (root) {

  /* Der Schluessel einer Wertemenge. Sortiert, damit dieselbe Menge in anderer
   * Reihenfolge derselbe Schluessel ist - sonst waere jeder Lauf "eine neue Frage"
   * und die Stillstandsbremse griffe nie. */
  function laufSchluessel(symbole) {
    return symbole.length + ':' + symbole.slice().sort().join(',');
  }

  /* Kam in diesem Lauf irgendeine Reihe voran? Gemessen an leerVersucht gegen
   * verarbeitet und NICHT an neu=0: der Lauf vom 03.09.2026 um 20:38 schrieb 126
   * neue Kerzen und war trotzdem Stillstand - die Kerzen fuellten Luecken INNERHALB
   * der Reihen, der juengste Tag blieb, wo er war. Wer neu=0 zaehlt, uebersieht ihn. */
  function ohneFortschritt(erg) {
    return !!(erg && erg.verarbeitet > 0 && erg.leerVersucht >= erg.verarbeitet);
  }

  function stillstandBuchen(zustand, intervall, symbole, erg) {
    var s = laufSchluessel(symbole);
    if (!ohneFortschritt(erg)) { delete zustand[intervall]; return null; }
    var alt = zustand[intervall];
    if (alt && alt.schluessel === s) alt.male++;
    else zustand[intervall] = { schluessel: s, male: 1, seit: Date.now(), werte: symbole.length };
    return zustand[intervall];
  }

  /* Ist diese Menge schon zweimal hintereinander erfolglos gelaufen? Dann holt ein
   * drittes Mal nichts anderes heraus. DIE MENGE IST DER SCHLUESSEL, nicht das
   * Intervall: kommt ein Wert dazu oder faellt einer weg, ist es eine andere Frage an
   * die Quelle, und die wird gestellt. So kann diese Bremse nichts blockieren, was
   * noch Daten hat. */
  function stillstandGemeldet(zustand, intervall, symbole) {
    var st = zustand[intervall];
    return !!(st && st.male >= 2 && st.schluessel === laufSchluessel(symbole));
  }

  /** Ein Blick auf die Uhr.
   *
   *  o.plan            sammelplan.js
   *  o.kerzen          kerzenquelle.js (nur fuer archivUeberblick/ordnerVon)
   *  o.einstellungen   die gelesenen Sammel-Einstellungen
   *  o.lauf            async (intervall, symbole) -> { ok, ergebnis }
   *  o.funk            (kanal, nutzlast) - darf fehlen
   *  o.stillstand      Zustandsobjekt, das ueber die Blicke hinweg lebt
   *  o.jetzt           () -> ms, fuer Proben
   *  o.grundZeile      Text fuer die Startmeldung
   *
   *  Rueckgabe: { gelaufen: [...], uebersprungen: [...], fehler }
   */
  async function runde(o) {
    var Plan = o.plan, Q = o.kerzen;
    var einst = o.einstellungen;
    var jetzt = o.jetzt || function () { return Date.now(); };
    var zustand = o.stillstand || {};
    var funk = o.funk || function () {};
    var erg = { gelaufen: [], uebersprungen: [], fehler: null };
    if (!einst || !einst.an) return erg;

    var zeilen;
    try { zeilen = Plan.lage(einst, jetzt()); }
    catch (e) { erg.fehler = String((e && e.message) || e); return erg; }

    /* Was am ehesten verlorengeht, kommt zuerst - die Regel steht in sammelplan.js,
     * damit sie fuer sich geprueft werden kann. */
    var dran = Plan.reihenfolge(zeilen);
    for (var i = 0; i < dran.length; i++) {
      var z = dran[i];
      var offen = Plan.offeneSymbole(z.intervall, einst, jetzt());
      if (!offen.dran || !offen.dran.length) continue;

      /* NOCH EINMAL FRAGEN, kurz bevor es losgeht. Ein Lauf dauert Minuten; in der
       * Zeit kann der Markt aufgehen oder ein anderer Prozess die Archivsperre nehmen.
       * Die Lage von vor zwanzig Minuten waere dann eine Behauptung. */
      var u;
      try { u = Q.archivUeberblick(Q.ordnerVon(z.intervall), { stichprobe: 60 }); }
      catch (e2) { erg.fehler = String((e2 && e2.message) || e2); continue; }
      var jetztFaellig = Plan.faellig(z.intervall, u, einst, jetzt(), offen);
      if (!jetztFaellig.faellig) {
        erg.uebersprungen.push({ intervall: z.intervall, grund: jetztFaellig.grund });
        continue;
      }

      /* GEDECKELT, und nur hier: 60m und 1d umfassen das ganze Universum (rund 3.200
       * Werte, gut anderthalb Stunden). Ohne Deckel belegte ein Lauf die Archivsperre
       * so lange, dass ein draengendes Intervall nicht mehr dazwischenkaeme - 1m
       * verliert nach sieben Tagen unwiederbringlich. Der Rest bleibt offen und wird
       * beim naechsten Blick geholt; gezaehlt wird je Wert, nicht je Archiv. Ein Lauf
       * VON HAND geht weiterhin ungedeckelt durch - wer den Knopf drueckt, will alles. */
      var teil = offen.dran.slice(0, Plan.DECKEL_JE_LAUF);
      var rest = offen.dran.length - teil.length;

      if (stillstandGemeldet(zustand, z.intervall, teil)) {
        var gem = zustand[z.intervall];
        /* EINMAL SAGEN, NICHT BEI JEDEM BLICK. Der Zustand steht im Sammler-Stand und
         * damit dauerhaft auf der Karte; ein Funkspruch alle zwanzig Minuten waere
         * dieselbe Meldung 122-mal - und die naechste Form von Rauschen, in der eine
         * echte Meldung untergeht. */
        if (!gem.gemeldet) {
          gem.gemeldet = true;
          funk('sammler-hinweis', {
            art: 'stillstand', intervall: z.intervall, werte: teil.length, male: gem.male,
            grund: 'Dieselben ' + teil.length + ' Werte kamen ' + gem.male + '-mal hintereinander ' +
              'nicht voran - die Quelle liefert dafuer nichts Neues. Uebersprungen, bis sich ' +
              'die Menge aendert.',
          });
        }
        erg.uebersprungen.push({ intervall: z.intervall, grund: 'Stillstand', werte: teil.length });
        continue;
      }

      funk('sammler-hinweis', {
        art: 'start', intervall: z.intervall, werte: teil.length, rest: rest,
        grund: (o.grundZeile ? o.grundZeile + ': ' : '') + jetztFaellig.grund +
          (rest ? ' (' + teil.length + ' in diesem Lauf, ' + rest + ' danach)' : ''),
        verloren: z.verloren, verloreneTage: z.verloreneTage,
      });

      var r = await o.lauf(z.intervall, teil);
      erg.gelaufen.push({ intervall: z.intervall, werte: teil.length });
      var st = stillstandBuchen(zustand, z.intervall, teil, r && r.ergebnis);
      if (st && st.male === 2) {
        funk('sammler-hinweis', {
          art: 'stillstand', intervall: z.intervall, werte: teil.length, male: st.male,
          grund: 'Zweiter Lauf hintereinander ueber dieselben ' + teil.length +
            ' Werte, und keine einzige Reihe kam voran.',
        });
      }
      /* Ein abgebrochener Lauf beendet die Runde. Anhalten von Hand, acht Fehlschlaege
       * hintereinander oder eine Ausnahme heissen alle dasselbe: jetzt ist nicht der
       * Moment fuer das naechste Archiv. */
      if (!r || !r.ok || (r.ergebnis && r.ergebnis.abgebrochen)) break;
    }
    return erg;
  }

  var Runde = {
    runde: runde, laufSchluessel: laufSchluessel, ohneFortschritt: ohneFortschritt,
    stillstandBuchen: stillstandBuchen, stillstandGemeldet: stillstandGemeldet,
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Runde; return; }
  root.Sammelrunde = Runde;
})(typeof window !== 'undefined' ? window : globalThis);
