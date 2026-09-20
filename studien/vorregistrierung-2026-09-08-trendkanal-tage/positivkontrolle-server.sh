#!/bin/bash
# Positivkontrolle des Rechenknechts gegen Auftrag Nr. 46, Teil 3.2 (Wilhelms Vorgabe
# 20.09.2026): kein Vollauf, sondern der kleinste abgeschlossene Baustein einer
# abgenommenen Studie - hier der 19-Reihen-Pilot von Trendkanal Tage (08./09.09.2026,
# pilot-1/PILOT-ERGEBNIS.md), auf denselben Eingabedateien (Archiv-Spiegel), derselben
# Kennung (folgt automatisch aus konfig.js, unveraendert seit dem Original-Pilot) und
# denselben Parametern (Schluss-Kandidat c1 = Vorgabe, kein --schluss noetig).
#
# Laeuft NUR auf dem Server, gestartet ueber systemd-run (Auftrag §3.1) - keine
# Bindung an eine SSH-Sitzung, kein Fenster, Log je Teil.
#
# Node exakt v24.18.0 (wie der PC am 19.09.2026), NICHT das v24.21.0 im PATH -
# Entscheid §6.4 des PM-Nachtrags. Quelle: Archiv-Spiegel, schreibgeschuetzt.
set -u
set -o pipefail
export PATH=/opt/node-v24.18.0/bin:/usr/bin:/bin
export MD_ALPACA_WURZEL=/archiv/markt-dashboard/archiv-spiegel

cd "$(dirname "$0")" || exit 9
LOG=positivkontrolle-server.log
REIHEN="AAPL AATC ABVE AC ACCD ADAP AMZN COKE COST CRVL DJCO HD JPM MSFT NEU NVDA PG WINA XOM"

{
  echo "=========================================================="
  echo "START $(date -Iseconds)  node=$(node -v)  MD_ALPACA_WURZEL=$MD_ALPACA_WURZEL"
  echo "Reihen (19, wie pilot-1 vom 08.09.2026): $REIHEN"
} >> "$LOG"

rm -rf tage-positivkontrolle pilot-positivkontrolle
node --max-old-space-size=2048 tagesbalken.js --aus tage-positivkontrolle --reihen $REIHEN --wachhund 300 >> "$LOG" 2>&1
RC1=$?
echo "tagesbalken.js rc=$RC1  $(date -Iseconds)" >> "$LOG"
if [ $RC1 -ne 0 ]; then echo "ABBRUCH nach tagesbalken.js" >> "$LOG"; exit $RC1; fi

node --max-old-space-size=4096 messen.js --aus pilot-positivkontrolle --tage tage-positivkontrolle >> "$LOG" 2>&1
RC2=$?
echo "messen.js rc=$RC2  $(date -Iseconds)" >> "$LOG"
if [ $RC2 -ne 0 ]; then echo "ABBRUCH nach messen.js" >> "$LOG"; exit $RC2; fi

node auswerten.js --aus pilot-positivkontrolle >> "$LOG" 2>&1
RC3=$?
echo "ENDE $(date -Iseconds)  auswerten.js rc=$RC3" >> "$LOG"
exit $RC3
