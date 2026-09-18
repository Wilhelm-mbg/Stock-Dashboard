## OmniRoute liegt als Backup bereit — angeschlossen ist nichts

Das KI-Gateway OmniRoute (357 Anbieter hinter einer Schnittstelle) ist auf Wilhelms Rechner
global über npm installiert und in `wiki/omniroute-backup.md` beschrieben: Start- und
Stopp-Befehl, Port 20128, Datenpfad, welche Anbieter gebündelt werden und warum das bei manchen
gegen deren Nutzungsbedingungen verstößt. Für den Anwender der App ändert sich nichts: die App
ruft weiterhin kein Sprachmodell auf, Claude Code läuft über das Abo, es gibt kein Konto, keinen
Schlüssel, keinen Autostart. Wer OmniRoute später anschließen will, findet im Wiki, was dafür
fehlt — und tut es bewusst, nicht nebenbei.

Nachtrag vom selben Tag: auf Wilhelms Entscheid hin wurde OmniRoute mit seinen Installationsskripten und
nativen Modulen nachinstalliert (zwei Binärdateien von GitHub, alles im Wiki festgehalten); dabei kam heraus,
dass die Installation nur innerhalb der Claude-App sichtbar ist — angeschlossen ist weiterhin nichts.
