#!/usr/bin/env bash
# Rechenknecht (Dell R620) über das iDRAC ein- und ausschalten — Redfish, ohne dass ein Passwort durch
# diese Shell geht. Entscheid Wilhelms 22.09.2026: Server im Testbetrieb auf Abruf statt Dauerbetrieb.
#
# Anmeldedaten legt Wilhelm selbst in eine netrc-Datei in seinem Profil; curl liest sie direkt, das Skript
# lädt sie nie in eine Variable und gibt sie nie aus. Inhalt (eine Zeile):
#   machine 192.168.0.120 login <iDRAC-Benutzer> password <Passwort>
# Der iDRAC-Benutzer hat nur die Rolle "Operator" (Strom schalten, nichts umkonfigurieren).
#
# Aufruf (Git-Bash):  tools/knecht.sh status | an | aus [--erzwingen]
#   an   schaltet ein, wenn aus, und wartet, bis der Rechenknecht per SSH antwortet (höchstens 15 min)
#   aus  fährt den R620 geordnet herunter — aber nur, wenn im Rechenknecht kein Lauf mehr lebt UND auf dem
#        Proxmox-Host außer dem Rechenknecht kein anderer Gast läuft; sonst Abbruch mit Grund.
#        --erzwingen überspringt beide Sperren und ist nur auf Wilhelms ausdrückliches Ja erlaubt.
set -u
IDRAC=${KNECHT_IDRAC:-192.168.0.120}
NETRC=${KNECHT_NETRC:-/c/Users/Wilhe/.idrac/netrc}
KNECHT=root@192.168.0.11
HOST=root@192.168.0.10
SCHLUESSEL=${KNECHT_SCHLUESSEL:-/c/Users/Wilhe/.ssh/r620_claude}
SYS="https://$IDRAC/redfish/v1/Systems/System.Embedded.1"
SSH="ssh -i $SCHLUESSEL -o BatchMode=yes -o ConnectTimeout=8"

if [ ! -r "$NETRC" ]; then
  echo "Keine Anmeldedatei $NETRC — Wilhelm legt sie an (wiki/betrieb.md, Abschnitt Rechenknecht auf Abruf)."
  exit 2
fi

# Der PM legt die Datei nur mit Platzhaltern an; Wilhelm ersetzt sie. Solange ein Platzhalter drinsteht, wird
# gar nicht erst angemeldet — Fehlversuche können das iDRAC für diese Adresse sperren. grep -q gibt nichts aus.
if grep -q -e BENUTZER_HIER -e PASSWORT_HIER "$NETRC"; then
  echo "In $NETRC stehen noch Platzhalter — Wilhelm trägt Benutzer und Passwort ein."
  exit 2
fi

rf() { curl -sk --netrc-file "$NETRC" -m 20 "$@"; }
zustand() { rf "$SYS" | grep -o '"PowerState":"[A-Za-z]*"' | cut -d'"' -f4; }
schalte() {   # $1 = ResetType; gibt den HTTP-Code aus
  rf -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
     -d "{\"ResetType\":\"$1\"}" "$SYS/Actions/ComputerSystem.Reset"
}

case "${1:-status}" in
  status)
    z=$(zustand)
    echo "Strom laut iDRAC: ${z:-unbekannt (Anmeldung abgelehnt oder iDRAC nicht erreichbar)}"
    if $SSH $KNECHT true 2>/dev/null; then echo "Rechenknecht: erreichbar"; else echo "Rechenknecht: nicht erreichbar"; fi
    ;;
  an)
    z=$(zustand)
    if [ -z "$z" ]; then echo "iDRAC antwortet nicht oder Anmeldung abgelehnt — nichts geschaltet."; exit 3; fi
    if [ "$z" != "On" ]; then
      code=$(schalte On)
      case "$code" in 200|202|204) echo "Einschalten angenommen (HTTP $code)";; *) echo "Einschalten abgelehnt: HTTP $code"; exit 3;; esac
    else
      echo "Strom ist schon an."
    fi
    for i in $(seq 1 60); do
      if $SSH $KNECHT true 2>/dev/null; then echo "Rechenknecht erreichbar nach $((i * 15)) s"; exit 0; fi
      sleep 15
    done
    echo "Rechenknecht nach 15 min nicht erreichbar — Konsole im iDRAC ansehen."
    exit 4
    ;;
  aus)
    if [ "${2:-}" != "--erzwingen" ]; then
      laeuft=$($SSH $KNECHT 'pgrep -a -x "node|tar|sha256sum|curl|rsync" | head -5' 2>/dev/null)
      if [ -n "$laeuft" ]; then echo "Nicht ausgeschaltet — im Rechenknecht läuft noch:"; echo "$laeuft"; exit 5; fi
      gaeste=$($SSH $HOST 'n=$(pct list 2>/dev/null | awk "NR>1 && \$2==\"running\"" | wc -l); m=$(qm list 2>/dev/null | awk "NR>1 && \$3==\"running\"" | wc -l); echo $((n + m))' 2>/dev/null)
      if [ -z "$gaeste" ]; then echo "Nicht ausgeschaltet — Proxmox-Host nicht per SSH prüfbar, also unbekannt, ob dort noch etwas läuft."; exit 6; fi
      if [ "$gaeste" -gt 1 ]; then echo "Nicht ausgeschaltet — auf dem R620 laufen $gaeste Gäste, nicht nur der Rechenknecht."; exit 6; fi
    fi
    code=$(schalte GracefulShutdown)
    case "$code" in 200|202|204) echo "Geordnetes Herunterfahren angenommen (HTTP $code)";; *) echo "Herunterfahren abgelehnt: HTTP $code"; exit 3;; esac
    ;;
  *)
    echo "Aufruf: tools/knecht.sh status | an | aus [--erzwingen]"; exit 1 ;;
esac
