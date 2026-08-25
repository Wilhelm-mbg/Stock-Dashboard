#!/usr/bin/env bash
# Eichlauf der Querschnitts-Kontrolle ueber alle Strategien des Repos.
#
# MESSMASCHINE_PROTOKOLLE ist gesetzt (S8): ohne die Variable legt messen.js eine Kopie in
# den Datenordner, und depot.js waehlt daraus die Variante mit dem groessten Bestaetigungs-t
# und zeigt sie als Kante. Ein Studienlauf wuerde sich damit selbst veroeffentlichen.
set -u
cd "$(dirname "$0")/../.."
export MESSMASCHINE_PROTOKOLLE="$PWD/studien/messmaschine/protokolle"

STRATEGIEN="quartalsschub-betrag monatswende-breit momentum kapitulation rsi2seit rsi2seit-mcp t1-zwangsglattstellung t2-umsatzschock t3-stundendrift"

for n in $STRATEGIEN; do
  echo "=== $n ==="
  node --max-old-space-size=14336 studien/messmaschine/messen.js \
       "studien/messmaschine/strategien/$n.js" 2>&1 | grep -E "^Messe|ACHTUNG|Werte,|FEHLER|Error" | head -3
  if [ $? -ne 0 ]; then echo "  (Lauf gescheitert)"; fi
done
echo "FERTIG"
