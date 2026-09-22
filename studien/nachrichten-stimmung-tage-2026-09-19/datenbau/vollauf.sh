#!/bin/sh
# GDELT-Datenbau 2017-01-01 .. 2026-08-31 auf dem Rechenknecht (Auftrag Nr. 47, Baustein 4).
# Je Teil eine systemd-Einheit gdelt-datenbau-<k> (Neustart bei Fehler nach 60 s; fortsetzbar je Tag).
# Aufruf:  sh vollauf.sh start <n>     startet n Teile (vorher test.js - rot = kein Start)
#          sh vollauf.sh stopp         haelt alle Teile an (angefangene Tage werden beim naechsten Start wiederholt)
#          sh vollauf.sh stand         Einheiten, erledigte Tage, Groesse der Ablage
# Parallelitaet aendern: stopp, dann start <neues n> - erledigte Tage erkennt das Werkzeug an ihrer vollstaendigen Tagesdatei.
set -e
NODE=/opt/node-v24.18.0/bin/node
HIER=$(cd "$(dirname "$0")" && pwd)
AUS=/archiv/markt-dashboard/studien-zellen/gdelt-2017-2026
VON=2017-01-01
BIS=2026-08-31
case "$1" in
  start)
    N=${2:?Teilzahl fehlt}
    mkdir -p "$AUS/tage"
    "$NODE" "$HIER/test.js" "$AUS/kontrolle/probe.gkg.csv.zip"
    for k in $(seq 1 "$N"); do
      systemctl reset-failed "gdelt-datenbau-$k" 2>/dev/null || true
      systemd-run --unit="gdelt-datenbau-$k" --working-directory="$HIER" \
        -p Restart=on-failure -p RestartSec=60 -p RestartPreventExitStatus=3 \
        -p StandardOutput=append:"$AUS/lauf-$N-$k.out" -p StandardError=append:"$AUS/lauf-$N-$k.out" \
        "$NODE" --max-old-space-size=2048 gkg-tage.js --von $VON --bis $BIS --teil "$k/$N" --aus "$AUS"
    done ;;
  stopp)
    systemctl stop 'gdelt-datenbau-*' ;;
  stand)
    systemctl list-units --no-legend 'gdelt-datenbau-*' | awk '{print $1, $3, $4}'
    echo "Tagesdateien: $(ls "$AUS/tage" | grep -c '\.json$') von 3530"
    du -sh "$AUS/tage" ;;
  *) echo "sh vollauf.sh start <n> | stopp | stand"; exit 2 ;;
esac
