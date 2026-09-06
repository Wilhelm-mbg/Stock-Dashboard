@echo off
setlocal
rem ===================================================================================
rem  ALPACA-NACHHOLEN - der taegliche Nachlauf (06.09.2026), statt eines Vollaufs
rem
rem  Holt fuer alle gefuehrten Werte nur die Balken AB DEM LETZTEN STEMPEL der
rem  Jahresdatei bis zum letzten abgeschlossenen Handelstag (Sammelabrufe, 170/min,
rem  SIP, adjustment=raw, Sitzungen aus dem Kalender). Fortsetzbar: jeder Anhang
rem  verschiebt den Stempel. Teilt sich die Archivsperre mit dem Live-Sammler der App
rem  (wartet, bis sie frei ist). Fuehrt das Manifest der beruehrten Dateien nach.
rem
rem  Aufgabe (der PM legt sie an; Muster wiki/betrieb.md):
rem    schtasks /Create /TN "Markt-Dashboard Alpaca-Nachholen" /TR "\"C:\Users\Wilhe\Downloads\Stock-Dashboard\tools\vollsammlung-nachholen.cmd\"" /SC DAILY /ST 23:30 /F
rem  Protokoll: ..\Markt-Dashboard-Daten\nachholen.log (neben dem Repo), angehaengt.
rem
rem  Der Zugang steht in Wilhelms Benutzerprofil. Ein frisch geoeffnetes Fenster erbt
rem  ihn von selbst; kommt der Start aus einem aelteren Prozess, wird er hier aus dem
rem  Profil nachgeholt - ohne ihn anzuzeigen, zu protokollieren oder in eine Datei zu
rem  schreiben.
rem ===================================================================================

cd /d "%~dp0.."
set "LOG=%~dp0..\..\Markt-Dashboard-Daten\nachholen.log"

if not defined ALPACA_KEY (
  for /f "usebackq delims=" %%K in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_KEY','User')"`) do set "ALPACA_KEY=%%K"
)
if not defined ALPACA_SECRET (
  for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_SECRET','User')"`) do set "ALPACA_SECRET=%%S"
)
if not defined ALPACA_KEY (
  echo Kein Zugang: ALPACA_KEY steht nicht im Benutzerprofil. >> "%LOG%"
  exit /b 2
)

echo Nachholen: Start %DATE% %TIME% >> "%LOG%"
node --max-old-space-size=4096 tools\alpaca-vollsammlung.js --nachholen >> "%LOG%" 2>&1
echo Nachholen: Ende %DATE% %TIME%  (Rueckgabewert %ERRORLEVEL%) >> "%LOG%"
endlocal
