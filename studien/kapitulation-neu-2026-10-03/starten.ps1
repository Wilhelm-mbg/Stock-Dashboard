# Startet den registrierten Lauf abgekoppelt (Win32_Process.Create): die Prozesse haengen nicht am Sitzungsbaum und
# ueberleben das Ende der Claude-Sitzung. Jeder Start wird mit Uhrzeit und Grund in lauf/laeufe.json vermerkt.
#   powershell -NoProfile -ExecutionPolicy Bypass -File starten.ps1 -Grund "Erststart"
#   powershell -NoProfile -ExecutionPolicy Bypass -File starten.ps1 -Grund "Teil 2 nach Abbruch" -Teile 2 -OhneWaechter
param([string]$Grund = 'Erststart', [int[]]$Teile = @(0, 1, 2, 3), [switch]$OhneWaechter)
$ordner = 'C:\Users\Wilhe\Downloads\Stock-Dashboard\studien\kapitulation-neu-2026-10-03'
$repo = 'C:\Users\Wilhe\Downloads\Stock-Dashboard'
$was = ($Teile -join '+')
if (-not $OhneWaechter) { $was = $was + '+Waechter' }
& 'C:\Program Files\nodejs\node.exe' "$ordner\messen.js" --vermerk $Grund $was
foreach ($k in $Teile) {
  $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "cmd.exe /c $ordner\lauf-teil.cmd $k"; CurrentDirectory = $repo }
  Write-Output "Teil $k : PID $($r.ProcessId), Rueckgabe $($r.ReturnValue)"
}
if (-not $OhneWaechter) {
  $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "cmd.exe /c $ordner\lauf-stufen.cmd"; CurrentDirectory = $repo }
  Write-Output "Waechter : PID $($r.ProcessId), Rueckgabe $($r.ReturnValue)"
}
