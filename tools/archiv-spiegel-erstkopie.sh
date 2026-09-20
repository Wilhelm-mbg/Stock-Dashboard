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

# Gestartet wird ueber Win32_Process.Create, also mit dem System-PATH - und der
# kennt die Werkzeuge der Git-Bash NICHT. Ohne die naechste Zeile greift das
# Skript nach C:\Windows\System32\tar.exe und System32\find.exe: die Kopie liefe
# zwar (bsdtar schreibt einen gueltigen Strom), aber `date` und `wc` fehlen still
# und `find -newermt` waere das voellig andere Windows-find -- die Nacharbeits-
# liste aus §4 der Uebergabe bliebe leer, und niemand saehe es der Datei an.
export PATH=/usr/bin:/bin:$PATH

QUELLE=/e/Markt-Dashboard-Archiv
ZIEL=/archiv/markt-dashboard/archiv-spiegel
SERVER=root@192.168.0.11
SCHLUESSEL=/c/Users/Wilhe/.ssh/r620_claude
LOG=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie.log
LISTE=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie-dateien.txt
NACHARBEIT=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten/spiegel-erstkopie-nacharbeit.txt

# Sperrklinke gegen genau den Fall oben: lieber gar nicht laufen als mit den
# falschen Werkzeugen. Die Kopie saehe sonst erfolgreich aus.
if ! tar --version 2>/dev/null | head -1 | grep -q "GNU tar"; then
  echo "ABBRUCH $(date -Iseconds 2>/dev/null): kein GNU tar im PATH ($(command -v tar))" >> "$LOG"
  exit 3
fi
for werkzeug in find date wc ssh; do
  command -v "$werkzeug" > /dev/null || { echo "ABBRUCH: $werkzeug fehlt im PATH" >> "$LOG"; exit 3; }
done

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
