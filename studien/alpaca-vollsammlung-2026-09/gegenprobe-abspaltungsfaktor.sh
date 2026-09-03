#!/bin/sh
# GEGENPROBEN zum gemessenen Abspaltungs-Kursfaktor: jede Sperrklinke muss EINMAL rot werden.
#
# Eine Zusicherung, die nie gefallen ist, ist keine Zusicherung, sondern ein Satz. Jeder
# Eingriff hier bricht GENAU EINE Eigenschaft und erwartet, dass genau die Pruefung
# anschlaegt, die sie bewacht. Gleiche Bauart wie gegenprobe.sh der Vollsammlung, und
# dieselben zwei Lehren aus deren erstem Anlauf:
#   - es wird geprueft, ob der Eingriff ANGEKOMMEN ist; ein Eingriff, der nichts trifft,
#     meldet sonst "gruen" und behauptet, eine saubere Klinke sei blind. Geprueft wird auf
#     das ANWESENDE neue Stueck, nicht auf das Verschwinden des alten: wo das neue Stueck
#     mit dem alten anfaengt, faende ein Verschwinden-Test es immer noch.
#   - es wird nie auf ein Emoji gegrept, sondern auf Text ohne Sonderzeichen.
#
# Gefahren wird in einer ISOLIERTEN KOPIE (git archive HEAD), nie im geteilten Arbeitsbaum -
# in ihm arbeiten Parallelsitzungen. Die zu pruefenden Aenderungen muessen also committet
# sein, sonst prueft die Kopie den Stand von vorher.
#
#   sh studien/alpaca-vollsammlung-2026-09/gegenprobe-abspaltungsfaktor.sh
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
KOPIE="${TMPDIR:-/tmp}/abspaltungsfaktor-gegenprobe-$$"
mkdir -p "$KOPIE"
( cd "$REPO" && git archive HEAD ) | tar -x -C "$KOPIE"
echo "Isolierte Kopie: $KOPIE"
W="$KOPIE/tools/alpaca-abspaltungsfaktor.js"
V="$KOPIE/tools/alpaca-vollsammlung.js"
WM=$(cygpath -m "$W" 2>/dev/null || echo "$W")
VM=$(cygpath -m "$V" 2>/dev/null || echo "$V")
ROT=0; GRUEN=0

# $1 Name  $2 Datei (relativ)  $3 neues Stueck, das nach dem Eingriff DA sein muss
# $4 Befehl  $5 Muster, das im Fehlerfall erscheinen muss
probe() {
  name="$1"; datei="$2"; da="$3"; befehl="$4"; muster="$5"
  if ! grep -qF "$da" "$KOPIE/$datei"; then
    echo "  GRUEN $name  <-- der Eingriff ist gar nicht angekommen"
    GRUEN=$((GRUEN+1))
  else
    aus=$(cd "$KOPIE" && eval "$befehl" 2>&1)
    if printf '%s' "$aus" | grep -qE "$muster"; then
      echo "  ROT   $name"
      ROT=$((ROT+1))
    else
      echo "  GRUEN $name  <-- die Klinke greift NICHT"
      GRUEN=$((GRUEN+1))
    fi
  fi
  ( cd "$REPO" && git archive HEAD ) | tar -x -C "$KOPIE"
}

# Wie probe(), nur faehrt sie den vollen Testlauf und prueft auf FEHLGESCHLAGEN. Die
# gefallene Zusicherung wird mitausgegeben, damit im Protokoll steht, WELCHE fiel, nicht
# nur DASS eine fiel.
probe_t6() {
  name="$1"; datei="$2"; da="$3"; text="$4"
  if ! grep -qF "$da" "$KOPIE/$datei"; then
    echo "  GRUEN $name  <-- der Eingriff ist gar nicht angekommen"
    GRUEN=$((GRUEN+1))
  else
    ( cd "$KOPIE" && node test-v6.js > gegenprobe-lauf.txt 2>&1 )
    if grep -q 'FEHLGESCHLAGEN' "$KOPIE/gegenprobe-lauf.txt"; then
      echo "  ROT   $name"
      grep -F "$text" "$KOPIE/gegenprobe-lauf.txt" | sed 's/^/          /' | head -2
      ROT=$((ROT+1))
    else
      echo "  GRUEN $name  <-- die Klinke greift NICHT"
      GRUEN=$((GRUEN+1))
    fi
  fi
  ( cd "$REPO" && git archive HEAD ) | tar -x -C "$KOPIE"
}

echo ""
echo "== Eingriffe am Werkzeug (gegen --kontrolle, ohne Netz) =="

# DIE Gegenprobe aus dem Auftrag: die Kontrolle "nach der Massnahme = 1" ausbauen. Ohne sie
# wird jede Abspaltung gemessen, hinter der noch eine zweite Massnahme liegt - und deren
# Faktor liefe still in den geschriebenen mit hinein.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('if (Math.abs(erg.nachMedian - 1) > BAND) {','if (0) { /*H1*/');fs.writeFileSync(p,s);"
probe "H1 die Kontrolle 'nach der Massnahme = 1' ist ausgebaut" \
      "tools/alpaca-abspaltungsfaktor.js" "if (0) { /*H1*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A5 Kontrolle"

# Die Richtung. all/dividend statt dividend/all - der Faktor waere 0,9459 statt 1,0572,
# und die bereinigte Reihe um 11 % verschoben. In jeder Zusammenfassung sieht das richtig aus.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('push({ tag: tag, v: d / a });','push({ tag: tag, v: a / d }); /*H2*/');fs.writeFileSync(p,s);"
probe "H2 die Richtung ist umgedreht (all/dividend statt dividend/all)" \
      "tools/alpaca-abspaltungsfaktor.js" "v: a / d }); /*H2*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A1 die SPGI-Form|A1a Richtung"

# "unklar" wird doch als Faktor geschrieben - der Weg vom Urteil zur Datei fuehrt durch
# genau diese eine Funktion.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace(\"if (!erg || erg.urteil !== 'gemessen' || !(erg.faktor > 0)) return null;\",'if (!erg || !(erg.faktor > 0)) return null; /*H3*/');fs.writeFileSync(p,s);"
probe "H3 satzAus() schreibt auch bei 'unklar' einen Faktor" \
      "tools/alpaca-abspaltungsfaktor.js" "return null; /*H3*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A6"

# Die Streuungsschranke faellt weg: liegt eine zweite Massnahme IM Fenster davor, ist der
# Median eine Mischung aus zwei Skalen - und trotzdem eine Zahl.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('if (erg.streuung > BAND) {','if (0) { /*H4*/');fs.writeFileSync(p,s);"
probe "H4 die Streuungsschranke ist ausgebaut (zwei Skalen ergeben einen Median)" \
      "tools/alpaca-abspaltungsfaktor.js" "if (0) { /*H4*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A8"

# Ohne Balken nach der Massnahme ist die Kontrolle nicht fahrbar. "Nicht pruefbar" darf
# nicht als "bestanden" durchgehen - erloschene Werte sind hier die Mehrheit.
#
# ZWEI Eingriffe, und das ist Absicht: die Zaehlschranke ALLEIN wegzunehmen bricht die
# Eigenschaft gar nicht, sondern nur den Code - der Median eines leeren Feldes ist null,
# und die Kontrolle darunter faellt daran ohnehin. Der erste Anlauf dieser Gegenprobe tat
# genau das und meldete "gruen", also: die Klinke greift nicht. Sie greift; der Eingriff
# stellte nur nie die gefaehrliche Lage her. Erst beides zusammen - Schranke weg UND ein
# leeres Feld als bestanden gewertet - baut den Fehler nach, um den es geht.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('if (nach.length < MIND_NACH) {','if (0) { /*H5*/').replace('erg.nachMedian = median(nach.map(function (x) { return x.v; }));','erg.nachMedian = nach.length ? median(nach.map(function (x) { return x.v; })) : 1;');fs.writeFileSync(p,s);"
probe "H5 'nicht pruefbar' geht als bestanden durch (erloschener Wert)" \
      "tools/alpaca-abspaltungsfaktor.js" "if (0) { /*H5*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A9"

# Die zweite faktortragende Massnahme am Wirkungstag wird nicht mehr gesucht. Der gemessene
# Faktor traegt sie dann mit, und die Ableitung wendet den Split der Quelle ein zweites Mal
# an - bei MHUA waere das der Faktor 0,0001 statt 0,01.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('    if (e === selbst) return;','    if (e === selbst) return; if (1) return; /*H13*/');fs.writeFileSync(p,s);"
probe "H13 die zweite Massnahme am Wirkungstag wird nicht mehr gesucht" \
      "tools/alpaca-abspaltungsfaktor.js" "if (1) return; /*H13*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A14"

# Ein Nachmessen mit Urteil "unklar" laesst den alten Faktor stehen - dann ueberlebt genau
# der Eintrag, den die neue Messung verwirft, und man haelt ihn fuer geprueft.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('  if (liste.length) neu.gemesseneFaktoren = liste; else delete neu.gemesseneFaktoren;','  neu.gemesseneFaktoren = m.gemesseneFaktoren; /*H14*/');fs.writeFileSync(p,s);"
probe "H14 austragen() laesst den alten Faktor stehen" \
      "tools/alpaca-abspaltungsfaktor.js" "neu.gemesseneFaktoren = m.gemesseneFaktoren; /*H14*/" \
      "node tools/alpaca-abspaltungsfaktor.js --kontrolle" "A16"

echo ""
echo "== Eingriffe, die nur test-v6 sieht (Block 35) =="

# Die Drossel. Der Vollauf laeuft parallel mit 170/min auf demselben Zugang; die Grenze der
# Quelle gilt fuer den Zugang, nicht je Werkzeug.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('var RATE_JE_MIN = 20;','var RATE_JE_MIN = 170; /*H6*/');fs.writeFileSync(p,s);"
probe_t6 "H6 die Drossel steht auf 170/min statt 20/min" \
         "tools/alpaca-abspaltungsfaktor.js" "var RATE_JE_MIN = 170; /*H6*/" "die Drossel steht bei hoechstens"

# Ein 429 wird wiederholt statt abgebrochen - der Wiederholungssturm ginge zu Lasten des
# Vollaufs, nicht zu eigenen.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('throw Ueberlastet(isFinite(warte) && warte > 0 ? warte : 60);','Z.wiederholt++; await pause(2000); continue; /*H7*/');fs.writeFileSync(p,s);"
probe_t6 "H7 ein 429 wird wiederholt statt abgebrochen" \
         "tools/alpaca-abspaltungsfaktor.js" "continue; /*H7*/" "wird NIE wiederholt"

# Geschrieben wird ausserhalb von alpaca-massnahmen/ - hier in die ROHDATEN, die dieses
# Werkzeug nicht einmal lesen darf.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('M.atomarSchreiben(p, JSON.stringify(eintragen(m, satz)));',\"M.atomarSchreiben(path.join(WURZEL, 'alpaca1m', a.ordner + '.json'), JSON.stringify(eintragen(m, satz))); /*H8*/\");fs.writeFileSync(p,s);"
probe_t6 "H8 geschrieben wird in die Rohdaten alpaca1m/" \
         "tools/alpaca-abspaltungsfaktor.js" "/*H8*/" "alpaca1m"

# Die Eichung ist nicht mehr bindend: der Lauf schreibt, obwohl die Positivkontrolle
# danebenliegt.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('if (!eich.bestanden) {','if (0) { /*H9*/');fs.writeFileSync(p,s);"
probe_t6 "H9 eine gefallene Eichung haelt den Lauf nicht mehr auf" \
         "tools/alpaca-abspaltungsfaktor.js" "if (0) { /*H9*/" "faellt eine Eichung"

# Die Quellenlisten werden mitveraendert - gemessen und geliefert waeren nicht mehr
# unterscheidbar.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('neu.gemesseneFaktoren = liste;','neu.gemesseneFaktoren = liste; neu.ohneFaktor = []; /*H10*/');fs.writeFileSync(p,s);"
probe_t6 "H10 eintragen() raeumt die Quellenliste ohneFaktor mit ab" \
         "tools/alpaca-abspaltungsfaktor.js" "neu.ohneFaktor = []; /*H10*/" "Byte fuer Byte"

# Und die Gegenrichtung in der Vollsammlung: ein erneuter Massnahmen-Lauf wirft die
# gemessenen Faktoren weg. Sie kosten je einen Zweitabruf und stehen in keiner Antwort
# der Quelle - still weg heisst: die Werte fallen wieder aus der bereinigten Kopie.
node -e "var fs=require('fs'),p='$VM',s=fs.readFileSync(p,'utf8');s=s.replace('gemesseneFaktoren: gemessenAlt || undefined','gemesseneFaktoren: undefined /*H11*/');fs.writeFileSync(p,s);"
probe_t6 "H11 ein erneuter Massnahmen-Lauf wirft die gemessenen Faktoren weg" \
         "tools/alpaca-vollsammlung.js" "gemesseneFaktoren: undefined /*H11*/" "traegt die gemessenen"

# Und die Leseregel: ein Teillauf pflegt sie nicht mehr - sie behauptet danach weiter, ein
# Wert habe keine Kopie, dessen Faktor inzwischen gemessen und dessen Kopie geschrieben ist.
node -e "var fs=require('fs'),p='$VM',s=fs.readFileSync(p,'utf8');s=s.replace('ohneKopie = alteRegel.ohneKopieWeilAbspaltung.filter','ohneKopie = [].concat /*H12*/');fs.writeFileSync(p,s);"
probe_t6 "H12 ein Teillauf kuerzt die Liste 'ohne Kopie' nicht mehr" \
         "tools/alpaca-vollsammlung.js" "[].concat /*H12*/" "Teillauf kuerzt"

# Die Nachkontrolle sieht nicht mehr hin. Sie ist der einzige Weg, auf dem ein Faktor
# auffaellt, der VOR der Sperre geschrieben wurde oder unter dem die Quelle spaeter einen
# Split nachreicht - keine Messung fasst ihn je wieder an.
node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('      var st = stoererAus(m.saetze, selbst, g.bisTag, g.datum);','      var st = []; /*H15*/');fs.writeFileSync(p,s);"
probe_t6 "H15 die Nachkontrolle --pruefen sieht keine Stoerer mehr" \
         "tools/alpaca-abspaltungsfaktor.js" "var st = []; /*H15*/" "pruefen sieht einen nachtraeglich"

echo ""
echo "Gegenproben: $ROT rot, $GRUEN gruen (gruen = die Klinke greift nicht)"
echo "Kopie bleibt zum Nachsehen: $KOPIE"
[ "$GRUEN" -eq 0 ]
