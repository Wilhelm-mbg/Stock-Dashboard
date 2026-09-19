# GDELT-Abdeckungsprobe (Nr. 44): Teile des Zaehl-Laufs als Aufgaben der Windows-Aufgabenplanung anlegen und starten -
# ohne Fenster, ausserhalb des Prozessbaums einer Claude-Sitzung (wiki/betrieb.md, "Lange Laeufe").
# Muster: Register je Teil in einer Schleife (nie "-File ... -Teile 1,2,3": PowerShell/cmd trennen am Komma).
# Aufruf (PowerShell):  & .\lauf-start.ps1 -Name 2025 -Teile 4 -Von 2025-01-01 -Bis 2025-12-31 [-OhneKurz 12]
#                       & .\lauf-start.ps1 -Name 2018q1 -Teile 2 -Von 2018-01-01 -Bis 2018-03-31
# Fortsetzen nach Abbruch: derselbe Aufruf (erledigte Tage werden uebersprungen).
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
foreach ($k in 1..$Teile) {
  $tn = "Markt-Dashboard GDELT $Name Teil $k"
  $args = "$k $Teile $Von $Bis"
  if ($OhneKurz -ne '') { $args = "$args $OhneKurz" }
  $tr = "powershell.exe -NoProfile -WindowStyle Hidden -Command `"& '$cmd' $args; exit `$LASTEXITCODE`""
  schtasks /Create /TN "$tn" /TR "$tr" /SC ONCE /ST 23:59 /F | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "schtasks /Create fehlgeschlagen fuer $tn" }
  schtasks /Run /TN "$tn" | Out-Null
  Write-Output "gestartet: $tn ($args) -> Rueckgabe $LASTEXITCODE"
  Start-Sleep -Seconds 2
}
Write-Output "Pruefen: schtasks /Query /TN `"Markt-Dashboard GDELT $Name Teil 1`" /FO LIST ; Get-Process node ; dir $hier\voll\tage"
