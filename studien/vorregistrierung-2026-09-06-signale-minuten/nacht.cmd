@echo off
setlocal enabledelayedexpansion
rem ===================================================================================
rem  SIGNALSTUDIE MINUTEN - der Nachtlauf des Messgeraets (VORREGISTRIERUNG.md §11)
rem
rem    studien\vorregistrierung-2026-09-06-signale-minuten\nacht.cmd            ein Prozess, Ausgabe voll\
rem    studien\vorregistrierung-2026-09-06-signale-minuten\nacht.cmd 3/8        Teil 3 von 8, Ausgabe voll-3\
rem    studien\vorregistrierung-2026-09-06-signale-minuten\nacht.cmd 3/8 1m     dasselbe, aber nur der Zeitrahmen 1m
rem    studien\vorregistrierung-2026-09-06-signale-minuten\nacht.cmd 3/8 5m 15m nur 5m und 15m (Ausgabe voll-3-5m-15m)
rem
rem  ZEITRAHMEN statt Umsatzklasse (Nachtrag 2, PM 07.09.): Passt der Vollauf nicht in acht Teile a 12 h, wird
rem  NACH ZEITRAHMEN geteilt - erst 1m ueber alles, dann 5m/15m. Eine Teilung nach Umsatzklasse waere eine Auswahl
rem  auf einer Groesse, die im Urteil vorkommt. auswerten.js warnt, wenn die zusammengelegten Teile nicht alle
rem  drei Zeitrahmen decken.
rem
rem  NUR LESEN auf E:/Markt-Dashboard-Archiv - kein Netz, kein Schluessel, keine Sperre.
rem  Abbruch ist GEFAHRLOS: alle 200 Dateien liegt ein Zwischenstand (_fortschritt.json +
rem  _zellen.bin), der naechste Start macht dort weiter. Der Wachhund ueberspringt eine Datei,
rem  die laenger als 900 s rechnet, und protokolliert sie.
rem
rem  Mehrere Teile laufen nebeneinander (16 Kerne, ~1 GB je Prozess); auswerten.js legt die
rem  Ordner voll-0 .. voll-7 zusammen:  node auswerten.js --aus voll-0 --aus voll-1 ...
rem
rem  Aufgabenplanung (wiki/betrieb.md, kein && in /TR):
rem    schtasks /Create /TN "Markt-Dashboard Signalstudie 0" /TR "\"<Repo>\studien\vorregistrierung-2026-09-06-signale-minuten\nacht.cmd\" 0/8" /SC ONCE /ST 01:00 /F
rem    schtasks /Run /TN "Markt-Dashboard Signalstudie 0"
rem
rem  Diese Datei startet NICHTS von selbst - der PM legt die Aufgabe an, wenn die Platte frei ist.
rem ===================================================================================

cd /d "%~dp0..\.."

set "TEIL=%~1"
set "AUS=voll"
set "TEILARG="
if not "%TEIL%"=="" (
  for /f "tokens=1 delims=/" %%K in ("%TEIL%") do set "AUS=voll-%%K"
  set "TEILARG=--teil %TEIL%"
)
shift

rem  Alle weiteren Argumente sind Zeitrahmen (1m 5m 15m); cmd.exe trennt auch am Komma - deshalb einzeln
rem  einsammeln und an das Werkzeug durchreichen (wiki/fehlerformen.md "cmd.exe trennt am Komma").
set "ZRARG="
set "ZRNAME="
:sammelnZr
if "%~1"=="" goto weiterZr
set "ZRARG=!ZRARG! %~1"
set "ZRNAME=!ZRNAME!-%~1"
shift
goto sammelnZr
:weiterZr
if not "!ZRARG!"=="" (
  set "ZRARG=--zeitrahmen!ZRARG!"
  set "AUS=!AUS!!ZRNAME!"
)

set "STUDIE=studien\vorregistrierung-2026-09-06-signale-minuten"
set "LOG=%STUDIE%\nacht-!AUS!.log"

echo Signalstudie Minuten: Ausgabe !AUS! %TEILARG% !ZRARG!, Start %DATE% %TIME% >> "!LOG!"
node --max-old-space-size=4096 "%STUDIE%\messen.js" --aus !AUS! %TEILARG% !ZRARG! --checkpoint 200 --wachhund 900 >> "!LOG!" 2>&1
set "RC=%ERRORLEVEL%"
echo Ende %DATE% %TIME%  (Rueckgabewert %RC%) >> "%LOG%"
endlocal & exit /b %RC%
