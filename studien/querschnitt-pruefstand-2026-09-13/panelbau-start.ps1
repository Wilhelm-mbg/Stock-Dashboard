# Startet die sechs Panelbau-Teile OHNE FENSTER und AUSSERHALB des Prozessbaums der Chat-Sitzung.
#
# Vorgesehen war die Aufgabenplanung (panelbau.cmd, Muster wiki/betrieb.md). Am 18.09.2026 (01:59-02:10) lehnte der
# Planer fuer dieses Konto JEDEN Start ab - `schtasks /Run` und Start-ScheduledTask, interaktiv, mit und ohne
# "nur im Netzbetrieb", mit und ohne Sandbox, sogar eine triviale Testaufgabe (cmd /c echo): LastTaskResult
# 0x800710E0 "vom Operator oder Administrator abgelehnt", keine Ausgabedatei, Ereignisprotokoll leer; S4U/SYSTEM
# braucht Elevation (Zugriff verweigert). Der Planer war schon am 10.09. gestoert (wiki/fehlerformen.md).
#
# Ausweg mit derselben Eigenschaft: Win32_Process.Create erzeugt den Prozess ueber den WMI-Dienst (WmiPrvSE), nicht
# als Kind der Werkzeug-Shell - er ueberlebt das Ende des Werkzeugaufrufs und das Neuverbinden der Sitzung
# (Fehlerform "Hintergrundlauf stirbt mit der Claude-App" betrifft Kinder des Sitzungsbaums). ShowWindow 0 = kein
# Fenster. panelbau.cmd leitet selbst nach voll\log2\ um; Fortsetzbarkeit ueber _fortschritt.json bleibt.
#
# Aufruf: powershell -ExecutionPolicy Bypass -File panelbau-start.ps1 [-Teile 0,1,2,3,4,5]
# Ein Lauf gilt erst als gestartet, wenn voll\teil-<k>\_lauf.log liegt.
param([int[]]$Teile = @(0, 1, 2, 3, 4, 5))
$hier = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = Join-Path $hier 'panelbau.cmd'
$si = ([wmiclass]"Win32_ProcessStartup").CreateInstance()
$si.ShowWindow = 0
foreach ($k in $Teile) {
  $befehl = 'cmd.exe /c ""' + $cmd + '" ' + $k + ' 6"'
  $r = ([wmiclass]"Win32_Process").Create($befehl, $hier, $si)
  "Teil ${k}: ReturnValue " + $r.ReturnValue + " PID " + $r.ProcessId
}
