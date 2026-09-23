#!/bin/bash
# Uebertrag des GDELT-Datenbaus vom Rechenknecht nach E: (Auftrag Nr. 63, §3.3): der PC ZIEHT (der Server schreibt nie nach E:),
# je Etappe ein tar-Strom ueber SSH, danach sofort sha256 am PC gegen die Serverliste - bytegenau, 0 Zeilen diff (Fehlerform
# "Zerrissene Datei sieht heil aus"). Wiederaufnehmbar: eine Etappe mit Marke pruefung/<etappe>.ok wird uebersprungen; eine
# abgebrochene oder abweichende Etappe raeumt NUR ihre eigenen Zielpfade (nur am PC) und zieht neu. Kein rsync.
# GNU-Werkzeuge ausdruecklich ueber /usr/bin und namentlich geprueft (Fehlerform "Der Lauf ausserhalb des Sitzungsbaums erbt den
# System-PATH": System32\tar.exe und find.exe liefern still anderes). Listenvergleich normalisiert (Fehlerform sha256-Formatfalle
# 20.09.: "*" vor dem Pfad im Binaermodus, CR am Zeilenende): sed 's/ \*/  /', tr -d '\r', sort -k2, diff.
# Voraussetzung: <ziel>/sha256-server.txt (tage, roh, kontrolle) und <ziel>/lauf/sha256-lauf-server.txt vom Server geholt.
# Aufruf (Git-Bash am PC): bash uebertrag-e.sh [Etappe ...]    ohne Argument alle: roh-2017 .. roh-2026 roh-rest tage kontrolle lauf
set -u
KEY=/c/Users/Wilhe/.ssh/r620_claude
SSH="ssh -i $KEY -o BatchMode=yes -o ServerAliveInterval=30 root@192.168.0.11"
QUELLE=/archiv/markt-dashboard/studien-zellen/gdelt-2017-2026
ZIEL=/e/Markt-Dashboard-Archiv/studien-zellen/gdelt-2017-2026
TAR=/usr/bin/tar; SHA=/usr/bin/sha256sum; FIND=/usr/bin/find; XARGS=/usr/bin/xargs
$TAR --version | head -1 | grep -q 'GNU tar' || { echo "ABBRUCH: $TAR ist kein GNU tar"; exit 4; }
$SHA --version | head -1 | grep -q 'GNU coreutils' || { echo "ABBRUCH: $SHA ist kein GNU sha256sum"; exit 4; }
$FIND --version | head -1 | grep -q 'GNU find' || { echo "ABBRUCH: $FIND ist kein GNU find"; exit 4; }
mkdir -p "$ZIEL/pruefung" "$ZIEL/lauf"
ETAPPEN="roh-2017 roh-2018 roh-2019 roh-2020 roh-2021 roh-2022 roh-2023 roh-2024 roh-2025 roh-2026 roh-rest tage kontrolle lauf"
[ $# -gt 0 ] && ETAPPEN="$*"
norm() { sed 's/ \*/  /' "$1" | tr -d '\r' | sort -k2; }
for e in $ETAPPEN; do
  case "$e" in
    roh-rest)       p="roh/_schema.json roh/_teile"; liste="$ZIEL/sha256-server.txt"; ziel="$ZIEL"; muster='  roh/_' ;;
    roh-[0-9]*)     p="roh/${e#roh-}-*";            liste="$ZIEL/sha256-server.txt"; ziel="$ZIEL"; muster="  roh/${e#roh-}-" ;;
    tage|kontrolle) p="$e";                          liste="$ZIEL/sha256-server.txt"; ziel="$ZIEL"; muster="  $e/" ;;
    lauf)           p="log-*.txt lauf-*.out _fortschritt-*.json tage-vor-umbau nacharbeit pruefung/abschluss.json pruefung/abschluss.log pruefung/vergleich-126.txt"; liste="$ZIEL/lauf/sha256-lauf-server.txt"; ziel="$ZIEL/lauf"; muster='  ' ;;
    *) echo "unbekannte Etappe $e"; exit 2 ;;
  esac
  ok="$ZIEL/pruefung/$e.ok"
  if [ -f "$ok" ]; then echo "$e: schon bytegleich geprueft ($(cat "$ok"))"; continue; fi
  [ -s "$liste" ] || { echo "ABBRUCH: Serverliste $liste fehlt"; exit 4; }
  norm "$liste" | grep -E "^[0-9a-f]{64}$muster" > "$ZIEL/pruefung/soll-$e.txt"
  soll=$(wc -l < "$ZIEL/pruefung/soll-$e.txt")
  [ "$soll" -gt 0 ] || { echo "ABBRUCH: $e hat 0 Eintraege in der Serverliste"; exit 4; }
  # Zielpfade DIESER Etappe raeumen (Wiederholung nach Abbruch) - nur unter $ziel, nur die Muster der Etappe
  ( cd "$ziel" && for q in $p; do rm -rf "$q"; done ) 2>/dev/null
  t0=$(date +%s); echo "$e: ziehe $soll Dateien ($p) ..."
  $SSH "cd $QUELLE && tar -cf - $p" | $TAR -C "$ziel" -xf -
  ps=("${PIPESTATUS[@]}")
  if [ "${ps[0]}" != 0 ] || [ "${ps[1]}" != 0 ]; then echo "$e: ABBRUCH tar-Strom (ssh ${ps[0]}, tar ${ps[1]}) - Etappe wiederholen"; exit 3; fi
  t1=$(date +%s)
  ( cd "$ziel" && $FIND $p -type f | sort | $XARGS -d '\n' $SHA ) > "$ZIEL/pruefung/sha256-pc-$e.txt"
  norm "$ZIEL/pruefung/sha256-pc-$e.txt" > "$ZIEL/pruefung/ist-$e.txt"
  if diff "$ZIEL/pruefung/soll-$e.txt" "$ZIEL/pruefung/ist-$e.txt" > "$ZIEL/pruefung/diff-$e.txt"; then
    echo "$e: $soll Dateien bytegleich, Strom $((t1 - t0)) s, sha256 $(( $(date +%s) - t1 )) s"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$ok"
  else
    echo "$e: ABWEICHUNG $(wc -l < "$ZIEL/pruefung/diff-$e.txt") diff-Zeilen (siehe pruefung/diff-$e.txt) - Etappe wiederholen"; exit 5
  fi
done
echo "alle angegebenen Etappen bytegleich."
