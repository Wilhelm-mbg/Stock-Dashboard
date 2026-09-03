#!/bin/sh
# GEGENPROBEN zur Vollsammlung: jede Sperrklinke muss EINMAL rot werden.
#
# Eine Zusicherung, die nie gefallen ist, ist keine Zusicherung, sondern ein Satz. Jeder
# Eingriff hier bricht GENAU EINE Eigenschaft und erwartet, dass genau die Pruefung
# anschlaegt, die sie bewacht.
#
# Gefahren wird in einer ISOLIERTEN KOPIE (git archive), nie im geteilten Arbeitsbaum -
# in ihm arbeiten Parallelsitzungen.
#
#   sh studien/alpaca-vollsammlung-2026-09/gegenprobe.sh
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
KOPIE="${TMPDIR:-/tmp}/vollsammlung-gegenprobe-$$"
mkdir -p "$KOPIE"
( cd "$REPO" && git archive HEAD ) | tar -x -C "$KOPIE"
echo "Isolierte Kopie: $KOPIE"
W="$KOPIE/tools/alpaca-vollsammlung.js"
T="$KOPIE/test-v6.js"
ROT=0; GRUEN=0

# $1 Name  $2 Befehl, der die Pruefung faehrt  $3 Muster, das im Fehlerfall erscheinen muss
probe() {
  name="$1"; befehl="$2"; muster="$3"
  aus=$(cd "$KOPIE" && eval "$befehl" 2>&1)
  if printf '%s' "$aus" | grep -qE "$muster"; then
    echo "  ROT   $name"
    ROT=$((ROT+1))
  else
    echo "  GRUEN $name  <-- die Klinke greift NICHT"
    GRUEN=$((GRUEN+1))
  fi
  ( cd "$REPO" && git archive HEAD ) | tar -x -C "$KOPIE"
}

echo ""
echo "== Eingriffe am Werkzeug (gegen --kontrolle) =="

sed -i 's|return \[k\[0\], k\[1\] / f, k\[2\] \* f, k\[3\] / f, k\[4\] / f, k\[5\] / f\];|return [k[0], k[1] / f, k[2] / f, k[3] / f, k[4] / f, k[5] / f];|' "$W"
probe "G1 Umsatz wird geteilt statt malgenommen (Gegenwert kippt)" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: E2|FEHLT: E4"

sed -i "s|if (!e \|\| !/split/.test(String(e._art))) return null;|if (!e) return null; if (/spin/.test(String(e._art))) { var s = Number(e.new_rate); return isFinite(s) \&\& s > 0 ? s : null; } if (!/split/.test(String(e._art))) return null;|" "$W"
probe "G2 aus einer Abspaltung wird doch ein Faktor gemacht" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: D3|FEHLT: D5"

sed -i 's|for (var i = 0; i < sortiert.length; i++) if (k\[0\] < sortiert\[i\].ms) f \*= sortiert\[i\].faktor;|for (var i = 0; i < sortiert.length; i++) if (k[0] >= sortiert[i].ms) f *= sortiert[i].faktor;|' "$W"
probe "G3 die Massnahme wirkt auf die Kerzen DANACH statt DAVOR" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: E1|FEHLT: E3|FEHLT: E5"

# Einzeilig ersetzen. Der erste Anlauf ging ueber einen Zeilenumbruch ('...;\n  for (...')
# und traf nichts - die Gegenprobe meldete "gruen" und behauptete damit, eine saubere
# Klinke sei blind. Ein Eingriff, der nicht ankommt, prueft nichts; deshalb prueft
# probe_t6() unten ausdruecklich, ob er angekommen ist.
sed -i 's|for (var j = bisJahr; j >= AB_JAHR; j--) jahre.push(j);|for (var j = AB_JAHR; j <= bisJahr; j++) jahre.push(j);|' "$W"
probe "G4 Ringverteilung laeuft vom aeltesten Jahr aufwaerts" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: G1|FEHLT: G2"

sed -i 's|var name = sauber ? reihe : reihe.replace(/\[^A-Za-z0-9.\]/g, ._.) + ._. + kurzstempel(reihe);|var name = reihe;|' "$W"
probe "G5 der Ordnername ist wieder einfach das Kuerzel (CON, HIw)" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: A3|FEHLT: A4|FEHLT: A6"

sed -i 's|return Math.min(bis, (jetzt \|\| Date.now()) - SIP_ABSTAND_MS);|return bis;|' "$W"
probe "G6 das Abruf-Ende wird nicht mehr gekappt (Tarif-Sperre)" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: K1"

sed -i 's|return { von: M.nyNachUtc(jahr, 1, 1, 0, 0), bis: M.nyNachUtc(jahr + 1, 1, 1, 0, 0) - 1 };|return { von: Date.UTC(jahr, 0, 1), bis: Date.UTC(jahr + 1, 0, 1) - 1 };|' "$W"
probe "G7 Jahresgrenze wieder auf UTC-Mitternacht (Silvester doppelt)" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: J2|FEHLT: J3"

sed -i 's|if (stille < LUECKE_TAGE) return null;|if (false) return null;|' "$W"
probe "G8 die Luecken-Wache faellt weg (laufende Reihe wird zerschnitten)" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: F2"

sed -i 's|e\[2\] += k\[2\];|e[2] = k[2];|' "$W"
probe "G9 die 5m-Verdichtung summiert den Umsatz nicht mehr" \
      "node tools/alpaca-vollsammlung.js --kontrolle" "FEHLT: H1"

echo ""
echo "== Eingriffe, die nur test-v6 sieht (Block 35) =="
#
# Hier wird NICHT auf das rote Kreuz gegrept: das Zeichen ist ein Emoji, und ein Muster
# mit Emoji durch zwei Schalen und ein eval zu tragen, hat beim ersten Anlauf still
# nichts getroffen - die Gegenprobe sagte "gruen", obwohl die Klinke sauber ansprang.
# Stattdessen zwei Bedingungen, die beide ohne Sonderzeichen auskommen:
#   (1) der Eingriff ist wirklich angekommen (die alte Zeichenkette steht nicht mehr da),
#   (2) der Lauf endet mit FEHLGESCHLAGEN - und der unversehrte Lauf tut das nicht,
#       das ist vorher geprueft.
# Die betroffene Zusicherung wird zusaetzlich ausgegeben, damit im Protokoll steht,
# WELCHE gefallen ist, nicht nur DASS eine fiel.
probe_t6() {
  name="$1"; weg="$2"; text="$3"
  if grep -qF "$weg" "$KOPIE/$4"; then
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
WM=$(cygpath -m "$W" 2>/dev/null || echo "$W")
PM=$(cygpath -m "$KOPIE/studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js" 2>/dev/null || echo "$KOPIE/studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js")

sed -i "s|nurQuelle(yh, 'yahoo')|yh.series|" "$W"
probe_t6 "G10 der Yahoo-Vergleich nimmt ALLE Kerzen (Alpaca gegen Alpaca = Tautologie)" \
         "nurQuelle(yh, 'yahoo')" "Quelle YAHOO" "tools/alpaca-vollsammlung.js"

node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('M.atomarSchreiben(ziel, text);',\"M.atomarSchreiben(path.join(WURZEL, 'archiv1m', 'bars_1m_' + a.sym + '.json'), text);\");fs.writeFileSync(p,s);"
probe_t6 "G11 die Vollsammlung schreibt in das Yahoo-Archiv" \
         "M.atomarSchreiben(ziel, text);" "Yahoo-Archiv als Ziel" "tools/alpaca-vollsammlung.js"

node -e "var fs=require('fs'),p='$WM',s=fs.readFileSync(p,'utf8');s=s.replace('if (F.laufend && F.laufend[a.key]) return true;','if (F.laufend && F.laufend[a.key]) return false;');fs.writeFileSync(p,s);"
probe_t6 "G12 eine abgebrochene Aufgabe wird NICHT neu geholt" \
         "if (F.laufend && F.laufend[a.key]) return true;" "nach einem Abbruch" "tools/alpaca-vollsammlung.js"

node -e "var fs=require('fs'),p='$PM',s=fs.readFileSync(p,'utf8');s=s.replace('process.stdout.write(S.verdecken(t)','process.stdout.write((t)');fs.writeFileSync(p,s);"
probe_t6 "G13 verdecken() aus der Massnahmen-Probe ausgebaut" \
         "process.stdout.write(S.verdecken(t)" "Massnahmen-Probe" "studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js"

echo ""
echo "Gegenproben: $ROT rot, $GRUEN gruen (gruen = die Klinke greift nicht)"
echo "Kopie bleibt zum Nachsehen: $KOPIE"
[ "$GRUEN" -eq 0 ]
