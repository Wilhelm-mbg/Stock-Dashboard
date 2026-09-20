#!/bin/bash
# Abnahme der Archiv-Erstkopie (oder einer Nachtkopie) per Byte-Identitaet, NICHT per
# Dateizahl (Auftrag Nr. 46, §2.3; Entscheid des PM §6.2 des Nachtrags).
#
# Ablauf: sha256 ueber JEDE Datei auf beiden Seiten (Pfad relativ zur Archivwurzel als
# Schluessel, damit Quelle "/e/Markt-Dashboard-Archiv/X" und Ziel
# "/archiv/markt-dashboard/archiv-spiegel/X" vergleichbar sind), dann `comm`/`diff`
# gegen die Nacharbeitsliste der Erstkopie: eine Abweichung, die DORT steht, ist die
# Fehlerform "Zerrissene Datei sieht heil aus" (die App schrieb waehrend der Kopie
# weiter) und wird zuerst einzeln nachkopiert, bevor die Abweichungen gezaehlt werden.
# Eine Abweichung, die NICHT auf der Nacharbeitsliste steht, ist ein Fund.
#
# Lange Laufzeit (sha256 liest die ganze Platte noch einmal): wie die Erstkopie ueber
# Win32_Process.Create ausserhalb des Sitzungsbaums starten (wiki/betrieb.md, "Lange
# Laeufe"), nie direkt aus einer Claude-Sitzung.
set -u
set -o pipefail
export PATH=/usr/bin:/bin:$PATH

QUELLE=/e/Markt-Dashboard-Archiv
ZIEL=/archiv/markt-dashboard/archiv-spiegel
SERVER=root@192.168.0.11
SCHLUESSEL=/c/Users/Wilhe/.ssh/r620_claude
DATEN=/c/Users/Wilhe/Downloads/Markt-Dashboard-Daten
LOG="$DATEN/spiegel-erstkopie.log"
NACHARBEIT="$DATEN/spiegel-erstkopie-nacharbeit.txt"
PC_LISTE="$DATEN/spiegel-pc.sha256"
SERVER_LISTE="$DATEN/spiegel-server.sha256"
VERGLEICH="$DATEN/spiegel-vergleich.txt"
SPIEGELLOG="$DATEN/spiegel.log"

for werkzeug in find sha256sum sort comm ssh; do
  command -v "$werkzeug" > /dev/null || { echo "ABBRUCH: $werkzeug fehlt im PATH" >> "$LOG"; exit 3; }
done

STARTZEIT=$(date -Iseconds)
echo "SHA256-ABNAHME START $STARTZEIT" >> "$LOG"

# 1. Nacharbeit ZUERST nachkopieren (Auftrag §6 Reihenfolge) - sonst faellt jede Datei
#    der Liste hinterher als "echte" Abweichung auf, obwohl sie erwartet war.
NACH_N=0
if [ -s "$NACHARBEIT" ]; then
  NACH_N=$(wc -l < "$NACHARBEIT")
  echo "Nacharbeit: $NACH_N Dateien werden einzeln nachkopiert" >> "$LOG"
  while IFS= read -r datei; do
    [ -z "$datei" ] && continue
    REL="${datei#"$QUELLE"/}"
    tar -C "$QUELLE" -cf - "$REL" 2>>"$LOG" | ssh -i "$SCHLUESSEL" -o BatchMode=yes "$SERVER" "tar -C $ZIEL -xf -" 2>>"$LOG"
  done < "$NACHARBEIT"
  echo "Nacharbeit fertig $(date -Iseconds)" >> "$LOG"
fi

# 2. sha256 auf dem PC (relative Pfade als Schluessel, sortiert)
( cd "$QUELLE" && find . -type f -exec sha256sum {} + ) \
  | sed 's#  \./#  #' | sort -k2 > "$PC_LISTE"
echo "PC-Liste fertig $(date -Iseconds): $(wc -l < "$PC_LISTE") Dateien" >> "$LOG"

# 3. sha256 auf dem Server, ueber ssh zurueckgeholt (gleiche relative Pfade)
ssh -i "$SCHLUESSEL" -o BatchMode=yes "$SERVER" \
  "cd $ZIEL && find . -type f -exec sha256sum {} + | sed 's#  \\./#  #' | sort -k2" \
  > "$SERVER_LISTE"
echo "Server-Liste fertig $(date -Iseconds): $(wc -l < "$SERVER_LISTE") Dateien" >> "$LOG"

# 4. Vergleich: `comm -3` zeigt Zeilen, die nicht auf BEIDEN Seiten identisch vorkommen
#    (Pfad UND Hash muessen uebereinstimmen, weil beide Teil der sortierten Zeile sind).
comm -3 "$PC_LISTE" "$SERVER_LISTE" > "$VERGLEICH"
ABWEICHUNGEN=$(wc -l < "$VERGLEICH")
ENDEZEIT=$(date -Iseconds)

{
  echo "=========================================================="
  echo "Start   $STARTZEIT"
  echo "Ende    $ENDEZEIT"
  echo "Dateien PC     $(wc -l < "$PC_LISTE")"
  echo "Dateien Server $(wc -l < "$SERVER_LISTE")"
  echo "Bytes PC       $(find "$QUELLE" -type f -printf '%s\n' | awk '{s+=$1} END{print s+0}')"
  echo "Nachkopiert (Nacharbeitsliste vor der Pruefung) $NACH_N"
  echo "Abweichungen (comm -3, Pfad+Hash)  $ABWEICHUNGEN"
} >> "$SPIEGELLOG"

# 5. Eine fehlende Nacht faellt auf: kein neuer Absatz seit > 26h ist ein Fund fuer den
#    naechsten Betrieb-Chat, nicht fuer diesen Lauf - siehe Pruefzeile im Betrieb-Wiki.
echo "SHA256-ABNAHME ENDE $ENDEZEIT  Abweichungen=$ABWEICHUNGEN  rc=0" >> "$LOG"
echo "Protokoll: $SPIEGELLOG"
echo "Abweichungen: $ABWEICHUNGEN"
exit 0
