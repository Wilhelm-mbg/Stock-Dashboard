#!/bin/sh
# sha256-Listen des GDELT-Datenbaus auf dem Rechenknecht (Auftrag Nr. 63, §3.2): je Etappe eine Liste mit relativen Pfaden ab der
# Ablage, Zeilenformat "<hash>  <pfad>" (GNU sha256sum, Textmodus, LF). Etappen wie in uebertrag-e.sh: roh-2017 .. roh-2026,
# roh-rest (_schema.json + _teile), tage, kontrolle, lauf (Logs, Fortschritt, tage-vor-umbau, nacharbeit, pruefung/abschluss.json).
# Schreibt <ablage>/pruefung/sha256-server-<etappe>.txt - erst .tmp, dann Umbenennen (eine halbe Liste saehe sonst heil aus).
# Aufruf: sh sha256-server.sh <ablage> <etappe> ...      lang: nohup sh sha256-server.sh ... > <ablage>/pruefung/sha256.log 2>&1 &
set -e
A=${1:?Ablage fehlt}; shift
cd "$A"; mkdir -p pruefung
for e in "$@"; do
  case "$e" in
    roh-rest)       p="roh/_schema.json roh/_teile" ;;
    roh-[0-9]*)     p="roh/${e#roh-}-*" ;;
    tage|kontrolle) p="$e" ;;
    lauf)           p="log-*.txt lauf-*.out _fortschritt-*.json tage-vor-umbau nacharbeit pruefung/abschluss.json pruefung/abschluss.log pruefung/vergleich-126.txt" ;;
    *) echo "unbekannte Etappe $e" >&2; exit 2 ;;
  esac
  # $p absichtlich ungequotet: die Muster loesen sich hier (in der Ablage) auf
  find $p -type f | sort | xargs -d '\n' sha256sum > "pruefung/sha256-server-$e.txt.tmp"
  mv "pruefung/sha256-server-$e.txt.tmp" "pruefung/sha256-server-$e.txt"
  echo "$e: $(wc -l < "pruefung/sha256-server-$e.txt") Dateien, $(date -u +%Y-%m-%dT%H:%M:%SZ)"
done
