#!/bin/bash
# Erstkopie des Kursarchivs vom PC auf den Rechenknecht (R620), EINWEG.
#
# Der PC schiebt: tar liest E: sequenziell und schreibt den Strom durch ssh in ein
# tar auf dem Server. Kein rsync (gibt es in der Git-Bash des PC nicht), kein Samba
# (keine neue Software, kein Handgriff von Wilhelm auf dem kritischen Weg).
# Entscheid des PM vom 20.09.2026, §6.1 des Nachtrags zu Auftrag Nr. 46.
#
# Der Server schreibt NIE nach E:. Diese Richtung ist die einzige.
#
# Fehlerform "Zerrissene Datei sieht heil aus": waehrend der Kopie schreibt die App
# weiter ins Archiv (Yahoo-Sammler fuer archiv1d/archiv60m). Eine Datei, die genau
# dann kopiert wird, landet halb im Spiegel und ist trotzdem gueltiges JSON.
# Deshalb merkt sich dieser Lauf seine Startzeit und schreibt hinterher die Liste
# aller Dateien, die waehrend der Kopie angefasst wurden, nach *.nacharbeit.txt.
# Diese Liste ist KEIN Nebenprotokoll, sondern Pflichteingabe der sha256-Abnahme:
# die dort genannten Dateien werden nachkopiert, bevor die Abweichungen gezaehlt
# werden. Nicht gelistete Abweichungen sind ein Fund.
set -u
set -o pipefail

QUELLE=/e/Markt-Dashboard-Archiv
ZIEL=/archiv/markt-dashboard/archiv-spiegel
SERVER=root@192.168.0.11
SCHLUESSEL=/c/Users/Wilhe/.ssh/r620_claude
LOG=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie.log
LISTE=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie-dateien.txt
NACHARBEIT=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie-nacharbeit.txt

STARTSEK=$(date +%s)
{
  echo "=========================================================="
  echo "START $(date -Iseconds)  Quelle=$QUELLE  Ziel=$SERVER:$ZIEL"
} >> "$LOG"

# tar -v schreibt die Namen nach stderr (stdout ist der Datenstrom) -> die
# wachsende Liste ist der Nachweis, dass der Lauf wirklich Daten bewegt.
tar -C "$QUELLE" -cvf - . 2> "$LISTE" \
  | ssh -i "$SCHLUESSEL" -o BatchMode=yes -o ServerAliveInterval=30 "$SERVER" \
      "tar -C $ZIEL -xf -"
RC=$?

ENDESEK=$(date +%s)
find "$QUELLE" -type f -newermt "@$STARTSEK" > "$NACHARBEIT" 2>/dev/null

{
  echo "ENDE   $(date -Iseconds)  rc=$RC  Dauer=$((ENDESEK - STARTSEK))s"
  echo "Dateien im tar-Strom: $(wc -l < "$LISTE")"
  echo "Waehrend der Kopie geschrieben (Nacharbeit noetig): $(wc -l < "$NACHARBEIT")"
  echo "Listen: $LISTE  /  $NACHARBEIT"
} >> "$LOG"

exit $RC
