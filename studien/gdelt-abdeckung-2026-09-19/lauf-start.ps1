# GDELT-Abdeckungsprobe (Nr. 44): Teile des Zaehl-Laufs als Aufgaben der Windows-Aufgabenplanung anlegen und starten -
# ohne Fenster, ausserhalb des Prozessbaums einer Claude-Sitzung (wiki/betrieb.md, "Lange Laeufe").
# Muster: Register-ScheduledTask je Teil in einer Schleife (nie "-File ... -Teile 1,2,3": PowerShell/cmd trennen am Komma).
# schtasks /TR mit eingebetteten Anfuehrungszeichen scheitert aus PowerShell 5.1 ("Ungueltige Option") - darum die Cmdlets.
# Aufruf (PowerShell):  & .\lauf-start.ps1 -Name 2025 -Teile 4 -Von 2025-01-01 -Bis 2025-12-31 [-OhneKurz 12]
#                       & .\lauf-start.ps1 -Name 2018q1 -Teile 2 -Von 2018-01-01 -Bis 2018-03-31
# Fortsetzen nach Abbruch: derselbe Aufruf (erledigte Tage werden uebersprungen; laufende Aufgabe wird nicht doppelt gestartet).
# Ein Lauf gilt erst als gestartet, wenn voll/tage/<tag>.json liegt (nicht die Prozessliste).
param(
  [Parameter(Mandatory=$true)][string]$Name,
  [int]$Teile = 4,
  [Parameter(Mandatory=$true)][string]$Von,
  [Parameter(Mandatory=$true)][string]$Bis,
  [string]$OhneKurz = ''
)
$hier = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = Join-Path $hier 'lauf.cmd'
if (-not (Test-Path $cmd)) { throw "lauf.cmd fehlt: $cmd" }
$einstellungen = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Days 7) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
$ausloeser = New-ScheduledTaskTrigger -Once -At (Get-Date).AddYears(1)   # feuert nie von selbst; Start nur per Start-ScheduledTask
foreach ($k in 1..$Teile) {
  $tn = "Markt-Dashboard GDELT $Name Teil $k"
  $args = "$k $Teile $Von $Bis"
  if ($OhneKurz -ne '') { $args = "$args $OhneKurz" }
  $argument = "-NoProfile -WindowStyle Hidden -Command `"& '$cmd' $args; exit `$LASTEXITCODE`""
  $aktion = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument -WorkingDirectory $hier
  Register-ScheduledTask -TaskName $tn -Action $aktion -Trigger $ausloeser -Settings $einstellungen -Force | Out-Null
  Start-ScheduledTask -TaskName $tn
  $info = Get-ScheduledTaskInfo -TaskName $tn
  Write-Output "gestartet: $tn ($args) -> LastTaskResult $($info.LastTaskResult)"
  Start-Sleep -Seconds 2
}
Write-Output "Pruefen: Get-ScheduledTaskInfo -TaskName 'Markt-Dashboard GDELT $Name Teil 1' ; Get-Process node ; dir $hier\voll\tage"
