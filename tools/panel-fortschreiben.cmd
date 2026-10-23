@echo off
setlocal
rem ===================================================================================
rem  PANEL-FORTSCHREIBUNG (Auftrag Nr. 123, 23.10.2026) - monatlicher Lauf fuer die Aufgabenplanung
rem
rem  Reihenfolge, jeder Schritt bricht die Kette bei einem Fehler ab:
rem    1. tools\panel-fortschreiben-massnahmen.js   Nachtrag der Kapitalmassnahmen, nur lebende Panel-Reihen (Netz, Zugang)
rem    2. tools\panel-fortschreiben.js --trocken    zaehlen, Wiedergabe- und Kontrollpruefung, Pruefsummen - schreibt nur den Bericht
rem    3. tools\panel-fortschreiben.js --schreiben  nur bei bestandenem Trockenlauf mit denselben Pruefsummen; neuer Ordner voll-v23f-YYYY-MM
rem    4. tools\panel-fortschreiben-spiegel.sh      tar ueber ssh in einen NEUEN Ordner auf dem Rechenknecht, sha256 beidseitig
rem  Umschalten (pruefstrasse\konfig.json "panel") macht nur der PM.
rem  Rueckgabe 2 aus Schritt 2 = Minutenarchiv noch nicht so weit: die Aufgabe laeuft am naechsten Tag (2. bis 6.) wieder.
rem  Schon gebauter Monat: Schritt 3 meldet "gleiche Pruefsummen, nichts zu tun" (0).
rem
rem  Aufgabe (der PM legt sie an, deaktiviert; Vorlage tools\panel-fortschreiben-aufgabe.xml):
rem    schtasks /Create /TN "Markt-Dashboard Panel-Fortschreibung" /XML "C:\Users\Wilhe\Downloads\Stock-Dashboard\tools\panel-fortschreiben-aufgabe.xml"
rem  Protokoll: ..\Markt-Dashboard-Daten\panel-fortschreibung\lauf.log (angehaengt), Berichte daneben.
rem
rem  Der Zugang steht in Wilhelms Benutzerprofil und wird hier nur in die Umgebung dieses Prozesses geholt - ohne ihn
rem  anzuzeigen, zu protokollieren oder in eine Datei zu schreiben (Muster tools\vollsammlung-nachholen.cmd).
rem ===================================================================================

cd /d "%~dp0.."
set "LOGD=%~dp0..\..\Markt-Dashboard-Daten\panel-fortschreibung"
if not exist "%LOGD%" mkdir "%LOGD%"
set "LOG=%LOGD%\lauf.log"

if not defined ALPACA_KEY (
  for /f "usebackq delims=" %%K in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_KEY','User')"`) do set "ALPACA_KEY=%%K"
)
if not defined ALPACA_SECRET (
  for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('ALPACA_SECRET','User')"`) do set "ALPACA_SECRET=%%S"
)

echo ==== Panel-Fortschreibung Start %DATE% %TIME% >> "%LOG%"
node tools\panel-fortschreiben-massnahmen.js >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
if not "%RC%"=="0" goto ende
node --max-old-space-size=6144 tools\panel-fortschreiben.js --trocken >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
if not "%RC%"=="0" goto ende
node --max-old-space-size=6144 tools\panel-fortschreiben.js --schreiben >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
if not "%RC%"=="0" goto ende
for /f "usebackq delims=" %%O in (`node -p "require('./tools/panel-fortschreiben.js').stammOrdnerWahl(require('path').join(process.cwd(),'studien','querschnitt-pruefstand-2026-09-13')).split(/[\\/]/).pop()"`) do set "ORDNER=%%O"
"C:\Program Files\Git\usr\bin\bash.exe" -c "bash tools/panel-fortschreiben-spiegel.sh %ORDNER%" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
:ende
echo ==== Ende %DATE% %TIME% Rueckgabe %RC% >> "%LOG%"
endlocal & exit /b %RC%
