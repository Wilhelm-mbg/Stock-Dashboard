@echo off
setlocal enabledelayedexpansion
rem ===================================================================================
rem  TRENDWENDE II - Auswertung der fertigen Zellen (NUR LESEN)
rem
rem    auswerten.cmd                  Haupttafel  -> voll-0\ERGEBNIS.md, voll-0\ergebnis.json
rem    auswerten.cmd klassen          Klassentafel -> ERGEBNIS-KLASSEN.md, ergebnis-klassen.json (NACHTRAG 6)
rem    auswerten.cmd klassen voll-3   nur einen Ordner (Teilauswertung, dann steht PILOT im Namen)
rem
rem  WARUM ES DIESE DATEI GIBT: auswerten.js prueft die Kennung der Zellen gegen die Umgebung und BRICHT AB, wenn
rem  sie nicht passt. Die acht Vollauf-Ordner tragen "...+verzoegert1", also muss TW2_VERZOEGERT=1 gesetzt sein -
rem  ohne das laeuft gar nichts, mit dem falschen Wert (z. B. leer => 1,5) auch nicht. Der Wert MUSS gequotet
rem  stehen, cmd.exe trennt sonst am Komma.
rem
rem  Beides liest ausschliesslich _zellen.bin/_fortschritt.json der Vollauf-Ordner und das Kursarchiv fuer die
rem  SPY-Regimezeile. Keine neue Messung, kein Schluessel, kein Netz.
rem ===================================================================================

set "TW2_VERZOEGERT=1"
cd /d "%~dp0..\.."
set "STUDIE=studien\vorregistrierung-2026-09-09-trendwende-ii"

set "WAS=%~1"
if /I "%WAS%"=="klassen" (set "SKRIPT=auswerten-klassen.js" & shift) else (set "SKRIPT=auswerten.js")

set "ORDNER="
:sammeln
if "%~1"=="" goto weiter
set "ORDNER=!ORDNER! --aus %~1"
shift
goto sammeln
:weiter
if "!ORDNER!"=="" set "ORDNER=--aus voll-0 --aus voll-1 --aus voll-2 --aus voll-3 --aus voll-4 --aus voll-5 --aus voll-6 --aus voll-7"

echo TW2_VERZOEGERT="%TW2_VERZOEGERT%"  Skript: %SKRIPT%  Ordner:!ORDNER!
node --max-old-space-size=8192 "%STUDIE%\%SKRIPT%" !ORDNER!
endlocal & exit /b %ERRORLEVEL%
