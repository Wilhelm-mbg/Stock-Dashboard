#!/bin/bash
# SPIEGEL EINES FORTGESCHRIEBENEN PANEL-ORDNERS AUF DEN RECHENKNECHT (Auftrag Nr. 123, 23.10.2026), EINWEG PC -> Server.
#
#   bash tools/panel-fortschreiben-spiegel.sh voll-v23f-2026-10            (Server 192.168.0.11, Schluessel ~/.ssh/r620_claude)
#   bash tools/panel-fortschreiben-spiegel.sh voll-v23f-2026-10 --lokal <zielordner>   (Probe ohne Server)
#
# Muster tools/archiv-spiegel-erstkopie.sh: tar liest, der Strom geht durch ssh in ein tar auf dem Server (kein rsync in der
# Git-Bash des PC), Empfang mit --no-same-owner. Ablauf:
#   1. lokal: Pruefsummen aller Dateien (sha256sum), die Pruefung des Werkzeugs (--pruefen-ordner) muss gueltig sein;
#   2. Ziel <ordner> darf auf dem Server NICHT liegen (nie ueberschreiben; voll-v23c wird nie angefasst);
#   3. nicht waehrend des Nachtlaufs (01:30-04:00 UTC) und nicht, solange pruefstrasse/.panel.lock liegt;
#   4. Strom in <ordner>.neu, Pruefsummen auf dem Server gegen die lokale Liste, erst dann mv <ordner>.neu <ordner> (atomar).
# Umschalten macht nur der PM (pruefstrasse/konfig.json "panel", Commit + Push; der Nachtlauf holt origin).
# Der Schluessel wird nie ausgegeben. Simulation, keine Anlageberatung.
set -u
set -o pipefail
export PATH="/usr/bin:/mingw64/bin:$PATH"
NAME="${1:-}"
[[ "$NAME" =~ ^voll-v23f-[0-9]{4}-[0-9]{2}$ ]] || { echo "Aufruf: $0 voll-v23f-YYYY-MM [--lokal <ziel>]"; exit 1; }
HIER="$(cd "$(dirname "$0")/.." && pwd)"
PS="$HIER/studien/querschnitt-pruefstand-2026-09-13"
QUELLE="$PS/$NAME"
[ -f "$QUELLE/panel/_stand.json" ] || { echo "FEHLER: $QUELLE/panel/_stand.json fehlt"; exit 1; }
SCHLUESSEL="${SPIEGEL_SCHLUESSEL:-$HOME/.ssh/r620_claude}"
SERVER="${SPIEGEL_SERVER:-root@192.168.0.11}"
ZIELBASIS="${SPIEGEL_ZIEL:-/archiv/markt-dashboard/Stock-Dashboard/studien/querschnitt-pruefstand-2026-09-13}"
LOKAL=""
if [ "${2:-}" = "--lokal" ]; then LOKAL="${3:?Zielordner fehlt}"; ZIELBASIS="$LOKAL"; fi
fern() { if [ -n "$LOKAL" ]; then bash -c "$1"; else ssh -i "$SCHLUESSEL" -o BatchMode=yes -o ConnectTimeout=15 "$SERVER" "$1"; fi; }

# 1. lokal pruefen
node "$HIER/tools/panel-fortschreiben.js" --pruefen-ordner "$QUELLE" | grep -q '"gueltig": true' || { echo "FEHLER: Pruefsummen des Ordners ungueltig (--pruefen-ordner)"; exit 1; }
LISTE="$(cd "$QUELLE" && find . -type f | LC_ALL=C sort | xargs sha256sum)" || { echo "FEHLER: sha256sum lokal"; exit 1; }
N=$(printf '%s\n' "$LISTE" | wc -l)
echo "lokal: $N Dateien in $NAME"

# 2./3. Ziel frei, keine Sperre, kein Nachtlauf
if [ -z "$LOKAL" ]; then
  H=$(date -u +%H%M); if [ "$H" -ge 0130 ] && [ "$H" -lt 0400 ]; then echo "ABBRUCH: Nachtlauf-Fenster 01:30-04:00 UTC"; exit 2; fi
fi
if ! fern "test ! -e '$ZIELBASIS/$NAME'"; then
  SCHON="$(fern "cd '$ZIELBASIS/$NAME' && find . -type f | LC_ALL=C sort | xargs sha256sum")"
  if [ "$SCHON" = "$LISTE" ]; then echo "schon gespiegelt: $NAME, Pruefsummen gleich - nichts zu tun"; exit 0; fi
  echo "ABBRUCH: $NAME liegt schon auf dem Ziel mit ANDEREN Pruefsummen - nichts ueberschrieben, PM fragen"; exit 1
fi
fern "test ! -e '$ZIELBASIS/../../pruefstrasse/.panel.lock'" || { echo "ABBRUCH: pruefstrasse/.panel.lock liegt (Laeufer liest das Panel)"; exit 2; }
fern "rm -rf '$ZIELBASIS/$NAME.neu' && mkdir -p '$ZIELBASIS/$NAME.neu'" || { echo "FEHLER: Zielordner nicht anlegbar"; exit 1; }

# 4. Strom, Abgleich, Umbenennen
tar -C "$QUELLE" -cf - . | fern "tar -C '$ZIELBASIS/$NAME.neu' --no-same-owner -xf -" || { echo "FEHLER: Uebertragung"; exit 1; }
FERN="$(fern "cd '$ZIELBASIS/$NAME.neu' && find . -type f | LC_ALL=C sort | xargs sha256sum")" || { echo "FEHLER: sha256sum auf dem Ziel"; exit 1; }
if [ "$LISTE" != "$FERN" ]; then echo "ABBRUCH: Pruefsummen auf dem Ziel anders - $NAME.neu bleibt zur Ansicht liegen"; diff <(printf '%s\n' "$LISTE") <(printf '%s\n' "$FERN") | head -5; exit 1; fi
fern "mv '$ZIELBASIS/$NAME.neu' '$ZIELBASIS/$NAME'" || { echo "FEHLER: Umbenennen"; exit 1; }
echo "gespiegelt: $NAME, $N Dateien, sha256 beidseitig gleich -> $ZIELBASIS/$NAME"
