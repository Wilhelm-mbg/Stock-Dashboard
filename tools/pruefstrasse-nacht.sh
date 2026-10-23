#!/bin/bash
# Nachtlauf der Pruefstrasse auf dem Rechenknecht (Auftrag Nr. 111, 11.10.2026).
#
# Zweck: jede Nacht misst der Laeufer (pruefstrasse/laeufer.js, Auftrag Nr. 110) den
# naechsten Kandidaten. Das Ergebnis wird auf dem Zweig pruefstrasse-ergebnisse
# committet und nach GitHub geschoben - ohne Handgriff. Wilhelm, 11.10.2026:
# "Messungen sollen ohne Hand laufen."
#
# Einstieg auf dem Server: /archiv/markt-dashboard/pruefstrasse-nacht.sh
#   (Kopie dieser Datei; sobald tools/pruefstrasse-nacht.sh im Repo-Spiegel liegt,
#   ersetzt der Lauf die Kopie selbst durch einen Link ins Repo, siehe Schritt 9).
# Cron (root, Serverzeit UTC):  0 2 * * *  /archiv/markt-dashboard/pruefstrasse-nacht.sh
# Von Hand: dieselbe Zeile. Eine zweite Instanz wartet nicht, sie endet sofort (flock -n).
# Umgebung (optional): PRUEFSTRASSE_ZEITGRENZE (Vorgabe 6h), PRUEFSTRASSE_DATEN.
#
# Grundsaetze:
#   - Ende mit 0 ist der Normalfall - auch wenn der Laeufer fehlt oder der Push scheitert.
#     Der Lauf gilt dann als erledigt; der naechste erfolgreiche Push nimmt alles mit.
#     Ende mit 1 nur, wenn die Umgebung kaputt ist (Repo weg, Zweig nicht auszuchecken).
#   - Einzige Loeschung: eigene Logs aelter als 60 Tage. Sonst wird nichts geloescht.
#   - Gepusht wird ausschliesslich pruefstrasse-ergebnisse, nie main, nie ein anderer Zweig.
#     Der Push geht ueber den eigenen GitHub-Schluessel (~/.ssh/github-pruefstrasse,
#     Deploy Key mit Schreibrecht; ~/.ssh/config), das Holen ueber HTTPS ohne Schluessel.
#   - Alles steht im Tageslog; STATUS.md auf dem Zweig fasst den letzten Lauf zusammen.
#
# Warum origin/main jede Nacht in den Ergebnis-Zweig gemischt wird: der Zweig ist vom
# Laeufer-Stand abgeleitet, der Laeufer selbst wird auf main weiterentwickelt. Ohne das
# Mischen liefe jede Nacht ein veralteter Laeufer. Bei Konflikt: Mischen abgebrochen,
# Logzeile, der Lauf geht mit dem bisherigen Stand weiter. Dasselbe gilt fuer den Zweig
# pruefstrasse-ideen des Ideen-Agenten (Nr. 112), wenn er existiert.
#
# Warum der Spiegel danach wieder auf main steht: tags ueber rechnen andere Sitzungen im
# Repo-Spiegel und erwarten dort main (= GitHub). Der Ergebnis-Zweig ist nur nachts
# ausgecheckt; main wird dabei per --ff-only mitgezogen.
set -u
set -o pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export LANG=C.UTF-8

BASIS=/archiv/markt-dashboard
REPO=$BASIS/Stock-Dashboard
LOGDIR=$BASIS/pruefstrasse-logs
SPERRE=$BASIS/pruefstrasse.lock
EINSTIEG=$BASIS/pruefstrasse-nacht.sh
ZWEIG=pruefstrasse-ergebnisse
IDEEN=pruefstrasse-ideen
LAEUFER=pruefstrasse/laeufer.js
ZEITGRENZE=${PRUEFSTRASSE_ZEITGRENZE:-6h}
export PRUEFSTRASSE_DATEN=${PRUEFSTRASSE_DATEN:-$BASIS/archiv-spiegel}
# Wertpapier-Klassifizierung (Polygon-Arten je Kuerzel) liegt auf dem Server unter daten/, nicht im Archiv-Spiegel (PM 11.10.).
export PRUEFSTRASSE_WERTPAPIERARTEN=${PRUEFSTRASSE_WERTPAPIERARTEN:-$BASIS/daten/wertpapierarten.json}
# Messungen laufen mit derselben Node-Version wie auf dem PC (v24.18.0, auf dem Server
# "fuer Messungen daneben gelegt"). Fehlt sie, nimmt der Lauf das System-Node und sagt es.
NODE=/opt/node-v24.18.0/bin/node
[ -x "$NODE" ] || NODE=$(command -v node)

mkdir -p "$LOGDIR"
HEUTE=$(date -u +%F)
LOG=$LOGDIR/$HEUTE.log
LAEUFERLOG=$LOGDIR/$HEUTE-laeufer.log
exec >> "$LOG" 2>&1

exec 9> "$SPERRE"
if ! flock -n 9; then
  echo "$(date -u -Iseconds) Doppelstart verhindert: Sperre $SPERRE ist belegt - Ende 0"
  exit 0
fi

z() { echo "$(date -u -Iseconds) $*"; }
STARTSEK=$(date +%s)
ende() {  # $1 = Rueckgabewert
  z "ENDE rc=$1 Dauer=$(( $(date +%s) - STARTSEK ))s"
  exit "$1"
}

z "START Nachtlauf Pruefstrasse  Host=$(hostname)  Node=$("$NODE" --version 2>/dev/null) ($NODE)  Zeitgrenze=$ZEITGRENZE  Daten=$PRUEFSTRASSE_DATEN"

# 1. Einzige Loeschung auf dem Server: eigene Logs aelter als 60 Tage.
ALT=$(find "$LOGDIR" -maxdepth 1 -type f -name '*.log' -mtime +60 -print -delete | wc -l)
[ "$ALT" -gt 0 ] && z "Logs aelter als 60 Tage geloescht: $ALT"

cd "$REPO" || { z "FEHLER: Repo $REPO nicht erreichbar"; ende 1; }

# 2. Von GitHub holen (lesend, HTTPS, ohne Schluessel). Scheitert es, laeuft die Nacht mit
#    dem oertlichen Stand weiter; der Push scheitert dann wohl auch und wird geloggt.
if git fetch -q origin; then z "git fetch origin: ok"; else z "WARNUNG: git fetch origin gescheitert - weiter mit oertlichem Stand"; fi

# 3. Zweig pruefstrasse-ergebnisse bereitstellen und auf den origin-Stand bringen.
if git show-ref --verify --quiet "refs/heads/$ZWEIG"; then
  git checkout -q "$ZWEIG" || { z "FEHLER: git checkout $ZWEIG gescheitert (Arbeitsbaum veraendert?)"; ende 1; }
  if git show-ref --verify --quiet "refs/remotes/origin/$ZWEIG"; then
    if git merge -q --ff-only "origin/$ZWEIG"; then
      z "Zweig $ZWEIG auf origin-Stand: $(git rev-parse --short HEAD)"
    else
      z "WARNUNG: $ZWEIG und origin/$ZWEIG sind auseinandergelaufen - oertlicher Stand bleibt, Push wird scheitern"
    fi
  fi
elif git show-ref --verify --quiet "refs/remotes/origin/$ZWEIG"; then
  git checkout -q --no-track -b "$ZWEIG" "origin/$ZWEIG" || { z "FEHLER: Zweig $ZWEIG von origin nicht anlegbar"; ende 1; }
  z "Zweig $ZWEIG von origin uebernommen: $(git rev-parse --short HEAD)"
else
  git checkout -q --no-track -b "$ZWEIG" origin/main || { z "FEHLER: Zweig $ZWEIG von origin/main nicht anlegbar"; ende 1; }
  z "Zweig $ZWEIG neu von origin/main angelegt: $(git rev-parse --short HEAD)"
fi
[ "$(git rev-parse --abbrev-ref HEAD)" = "$ZWEIG" ] || { z "FEHLER: nicht auf $ZWEIG, sondern auf $(git rev-parse --abbrev-ref HEAD)"; ende 1; }

# 4. Laeufer-Stand (origin/main) und Ideen (origin/pruefstrasse-ideen) hineinmischen.
mischen() {  # $1 = Quelle, $2 = Name fuers Log
  local vorher; vorher=$(git rev-parse --short HEAD)
  if git merge -q --no-edit -m "Pruefstrasse: $2 hineingemischt ($HEUTE)" "$1"; then
    if [ "$vorher" = "$(git rev-parse --short HEAD)" ]; then z "$2: nichts Neues"; else z "$2 hineingemischt -> $(git rev-parse --short HEAD)"; fi
  else
    git merge --abort 2>/dev/null
    z "WARNUNG: Mischen von $2 abgebrochen (Konflikt) - Lauf mit bisherigem Stand $vorher"
  fi
}
mischen origin/main "origin/main (Laeufer-Stand)"
if git show-ref --verify --quiet "refs/remotes/origin/$IDEEN"; then
  mischen "origin/$IDEEN" "origin/$IDEEN (Ideen-Agent)"
else
  z "Zweig origin/$IDEEN nicht vorhanden - nichts zu mischen"
fi

zurueck_auf_main() {
  if git checkout -q main 2>/dev/null; then
    if git merge -q --ff-only origin/main 2>/dev/null; then z "Spiegel wieder auf main: $(git rev-parse --short HEAD)"; else z "Spiegel wieder auf main ($(git rev-parse --short HEAD)); WARNUNG: main nicht auf origin/main vorspulbar"; fi
  else
    z "WARNUNG: Rueckkehr auf main gescheitert - Spiegel bleibt auf $(git rev-parse --abbrev-ref HEAD)"
  fi
}

# 5. Laeufer vorhanden? Bis Nr. 110 auf main liegt, endet der Lauf hier - so kann der Cron
#    schon stehen, bevor es etwas zu messen gibt.
if [ ! -f "$LAEUFER" ]; then
  z "Laeufer fehlt ($REPO/$LAEUFER) - nichts zu messen"
  zurueck_auf_main
  ende 0
fi

# 6. Messen, mit Zeitgrenze. Die Ausgabe geht ins Tageslog UND in ein eigenes Laeufer-Log,
#    aus dem STATUS.md die letzten Zeilen uebernimmt (Warteschlange, Urteile).
STAND_VORHER=$(git rev-parse --short HEAD)
LAUFSTART=$(date +%s)
z "Laeufer startet: $NODE $LAEUFER --naechster  (timeout $ZEITGRENZE, Nachfrist 10m)"
timeout --kill-after=10m "$ZEITGRENZE" "$NODE" "$LAEUFER" --naechster 2>&1 | tee -a "$LAEUFERLOG"
RC=${PIPESTATUS[0]}
LAUFDAUER=$(( $(date +%s) - LAUFSTART ))
case $RC in
  0)   URTEIL="ok" ;;
  124) URTEIL="Zeitgrenze $ZEITGRENZE erreicht, Laeufer beendet (TERM)" ;;
  137) URTEIL="Zeitgrenze erreicht, Laeufer nach Nachfrist abgeschossen (KILL)" ;;
  *)   URTEIL="Fehler rc=$RC" ;;
esac
z "Laeufer fertig: rc=$RC ($URTEIL) Dauer=${LAUFDAUER}s"

# 6b. Vorwaertsbestaetigung (Nr. 121-2a, PM 23.10.2026): idempotent, committet selbst nur bei geaendertem Inhalt. Laeuft NACH --naechster,
#     nie parallel: beide nehmen im Kindprozess pruefstrasse/.panel.lock (laeufer.js panelSperre wartet bis 1 h). Bricht sie ab, bleibt die
#     Marke pruefstrasse/VORWAERTS-LAEUFT.json liegen und geht sichtbar mit in den Nachtcommit; der naechste Lauf lehnt ab, bis der PM sie entfernt.
#     Ohne Panel-Fortschreibung (Nr. 123) zaehlt sie nur und misst nichts.
z "Vorwaerts startet: $NODE $LAEUFER --vorwaerts"
timeout --kill-after=10m "$ZEITGRENZE" "$NODE" "$LAEUFER" --vorwaerts 2>&1 | tee -a "$LAEUFERLOG"
RCV=${PIPESTATUS[0]}
z "Vorwaerts fertig: rc=$RCV"
[ "$RCV" -ne 0 ] && URTEIL="$URTEIL; Vorwaerts rc=$RCV (Marke pruefstrasse/VORWAERTS-LAEUFT.json pruefen)"

# 7. STATUS.md auf dem Zweig: letzter Lauf, Dauer, Warteschlange/Urteile (Laeufer-Ausgabe),
#    Fehler, Push der Vornacht, nicht uebernommene Aenderungen.
ANDERE=$(git status --short -- . ':!pruefstrasse' ':!STATUS.md' | head -30)
LETZTER_PUSH=$(cat "$LOGDIR/letzter-push.txt" 2>/dev/null || echo "noch keiner")
{
  echo "# Pruefstrasse - Stand"
  echo
  echo "Geschrieben von tools/pruefstrasse-nacht.sh auf $(hostname), alle Zeiten UTC."
  echo
  echo "- Letzter Lauf: $(date -u -d "@$LAUFSTART" -Iseconds) bis $(date -u -Iseconds), Dauer ${LAUFDAUER} s (Zeitgrenze $ZEITGRENZE)"
  echo "- Laeufer: \`$LAEUFER --naechster\`, Node $("$NODE" --version 2>/dev/null), rc=$RC ($URTEIL)"
  echo "- Daten: \`$PRUEFSTRASSE_DATEN\`; Stand vor dem Lauf: $STAND_VORHER"
  echo "- Push der Vornacht: $LETZTER_PUSH"
  echo "- Log: \`$LOG\`, Laeufer-Ausgabe: \`$LAEUFERLOG\`"
  echo
  echo "## Warteschlange und letzte Urteile (Laeufer-Ausgabe, letzte 60 Zeilen)"
  echo
  echo '```'
  tail -n 60 "$LAEUFERLOG"
  echo '```'
  echo
  echo "## Fehler"
  echo
  if [ "$RC" -eq 0 ]; then echo "keine (rc=0)"; else echo "rc=$RC: $URTEIL - Einzelheiten im Log."; fi
  if [ -n "$ANDERE" ]; then
    echo
    echo "## Nicht uebernommene Aenderungen (ausserhalb pruefstrasse/ und STATUS.md, nicht committet)"
    echo
    echo '```'
    echo "$ANDERE"
    echo '```'
  fi
} > STATUS.md

# 8. Commit nur der Pruefstrassen-Pfade (pruefstrasse/, STATUS.md, die zwei Wiki-Seiten des Laeufers), dann Push - nur dieser
#    Zweig, mit vollem Refspec, damit nie etwas anderes geschoben wird.
git add -A -- pruefstrasse STATUS.md wiki/belegstand.md wiki/log.md   # PM 11.10.: der Laeufer haengt seinen Eintrag an belegstand.md und log.md an (Nr. 110) - mit committen, sonst bleibt der Spiegel schmutzig
if git diff --cached --quiet; then
  z "Nichts zu committen"
else
  if git -c user.name="Pruefstrasse Rechenknecht" -c user.email="pruefstrasse@rechenknecht.local" \
       commit -q -m "Pruefstrasse $HEUTE: Nachtlauf rc=$RC ($URTEIL), Dauer ${LAUFDAUER}s"; then
    z "Commit $(git rev-parse --short HEAD) auf $ZWEIG"
  else
    z "WARNUNG: Commit gescheitert"
  fi
fi
if git push -q origin "refs/heads/$ZWEIG:refs/heads/$ZWEIG"; then
  z "Push origin/$ZWEIG: ok ($(git rev-parse --short HEAD))"
  echo "ok $(date -u -Iseconds) $(git rev-parse --short HEAD)" > "$LOGDIR/letzter-push.txt"
else
  z "Push origin/$ZWEIG GESCHEITERT (rc=$?) - Commit bleibt oertlich, Lauf gilt als erledigt"
  echo "gescheitert $(date -u -Iseconds) (oertlich $(git rev-parse --short HEAD))" > "$LOGDIR/letzter-push.txt"
fi

zurueck_auf_main

# 9. Selbst-Verlinkung des Einstiegs: liegt dieses Skript inzwischen im Repo-Spiegel, wird
#    die Kopie unter $EINSTIEG durch einen Link ersetzt; ab dann pflegt git fetch/merge den
#    Einstieg mit. ln -sfn tauscht nur den Verzeichniseintrag - die laufende Instanz liest
#    weiter aus ihrer alten Inode.
if [ -f "$REPO/tools/pruefstrasse-nacht.sh" ] && [ -f "$EINSTIEG" ] && [ ! -L "$EINSTIEG" ]; then
  ln -sfn "$REPO/tools/pruefstrasse-nacht.sh" "$EINSTIEG" && z "Einstieg $EINSTIEG ist jetzt ein Link ins Repo"
fi

ende 0
