@echo off
setlocal
rem ===================================================================================
rem  ALPACA-VOLLSAMMLUNG - der Nachtlauf (Stufe Z1c)
rem
rem    tools\vollsammlung-nacht.cmd            die Balken holen (der lange Lauf)
rem    tools\vollsammlung-nacht.cmd massnahmen die Kapitalmassnahmen (einmalig, ~50 min)
rem    tools\vollsammlung-nacht.cmd lebenszeit die Lebenszeiten (einmalig, ~50 min)
rem    tools\vollsammlung-nacht.cmd ableiten   die bereinigte Kopie (ohne Netz)
rem
rem  Abbruch mit Strg+C ist GEFAHRLOS. Jede Symbol-Jahr-Datei wird in einem Stueck
rem  geschrieben; der naechste Start macht dort weiter, wo dieser aufgehoert hat, und
rem  holt eine abgebrochene Aufgabe neu. Die Jahre werden von hinten abgearbeitet -
rem  bricht der Lauf ab, liegt das juengste Jahr VOLLSTAENDIG da.
rem
rem  Der Zugang steht in Wilhelms Benutzerprofil. Ein frisch geoeffnetes Fenster erbt
rem  ihn von selbst; kommt der Start aus einem aelteren Prozess, wird er hier aus dem
rem  Profil nachgeholt - ohne ihn anzuzeigen, zu protokollieren oder in eine Datei zu
rem  schreiben. Die Zeilen unten geben ihn nie aus (@echo off, und der for-Umweg
rem  schreibt direkt in die Variable).
rem ===================================================================================

cd /d "%~dp0.."

if not defined ALPACA_KEY (
  for /f "usebackq delims=" %%K in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_KEY','User')"`) do set "ALPACA_KEY=%%K"
)
if not defined ALPACA_SECRET (
  for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_SECRET','User')"`) do set "ALPACA_SECRET=%%S"
)
if not defined ALPACA_KEY (
  echo Kein Zugang: ALPACA_KEY steht nicht im Benutzerprofil.
  exit /b 2
)

set "MODUS=%~1"
if "%MODUS%"=="" set "MODUS=holen"

echo Vollsammlung: Modus %MODUS%, Start %DATE% %TIME%
node tools\alpaca-vollsammlung.js --%MODUS% %2 %3 %4 %5
echo Ende %DATE% %TIME%  (Rueckgabewert %ERRORLEVEL%)
endlocal
