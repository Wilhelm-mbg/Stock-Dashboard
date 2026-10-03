# Startet den Panelbau v2.2 (Auftrag Nr. 67) OHNE FENSTER und AUSSERHALB des Prozessbaums der Chat-Sitzung:
# N Bau-Teile (Vorgabe 4 - nie mehr als vier gleichzeitig) und einen Nachlauf, der auf die Fertig-Dateien wartet,
# vereint und die Kernpruefung faehrt. Muster und Grund wie panelbau-start.ps1 (v2.1): Win32_Process.Create erzeugt die
# Prozesse ueber den WMI-Dienst, sie ueberleben das Ende des Werkzeugaufrufs und das Neuverbinden der Sitzung - nicht
# aber das Herunterfahren des Rechners. Danach denselben Aufruf wiederholen: jeder Teil setzt an seinem Pruefpunkt
# (_fortschritt.json, alle 50 Reihen) fort, fertige Teile sind in Sekunden durch.
#
# Aufruf: powershell -ExecutionPolicy Bypass -File panelbau-v22-start.ps1 [-Teile 0,1,2,3] [-N 4] [-OhneNachlauf]
# Ein Lauf gilt erst als gestartet, wenn voll-v22\teil-<k>\_lauf.log liegt.
param([int[]]$Teile = @(0, 1, 2, 3), [int]$N = 4, [switch]$OhneNachlauf)
$hier = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = Join-Path $hier 'panelbau-v22.cmd'
if ($Teile.Count -gt 4) { "Mehr als vier Bau-Prozesse sind nicht erlaubt (Auftrag Nr. 67, Abschnitt 0)."; exit 2 }
# Doppelstart verhindern: zwei Prozesse auf demselben Teilordner zerstoeren die Bloecke.
$laeuft = @(Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'paneldaten\.js.*voll-v22' })
if ($laeuft.Count -gt 0) { "Es laufen schon " + $laeuft.Count + " Bau-Prozesse auf voll-v22 (PID " + (($laeuft | ForEach-Object { $_.ProcessId }) -join ', ') + ") - kein Start."; exit 3 }
$si = ([wmiclass]"Win32_ProcessStartup").CreateInstance()
$si.ShowWindow = 0
foreach ($k in $Teile) {
  $befehl = 'cmd.exe /c ""' + $cmd + '" ' + $k + ' ' + $N + '"'
  $r = ([wmiclass]"Win32_Process").Create($befehl, $hier, $si)
  "Teil ${k}/${N}: ReturnValue " + $r.ReturnValue + " PID " + $r.ProcessId
}
if (-not $OhneNachlauf) {
  $befehl = 'cmd.exe /c ""' + $cmd + '" nachlauf ' + $N + '"'
  $r = ([wmiclass]"Win32_Process").Create($befehl, $hier, $si)
  "Nachlauf: ReturnValue " + $r.ReturnValue + " PID " + $r.ProcessId
}
