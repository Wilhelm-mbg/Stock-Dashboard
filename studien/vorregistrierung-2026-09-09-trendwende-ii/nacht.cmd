@echo off
setlocal enabledelayedexpansion
rem ===================================================================================
rem  TRENDWENDE II - der Nachtlauf des Messgeraets (VORREGISTRIERUNG.md §10, §14)
rem  Herkunft: nacht.cmd der Minutenstudie (studien/vorregistrierung-2026-09-06-signale-minuten), Pfade angepasst.
rem
rem    studien\vorregistrierung-2026-09-09-trendwende-ii\nacht.cmd            ein Prozess, Ausgabe voll\
rem    studien\vorregistrierung-2026-09-09-trendwende-ii\nacht.cmd 3/8        Teil 3 von 8, Ausgabe voll-3\
rem    studien\vorregistrierung-2026-09-09-trendwende-ii\nacht.cmd 3/8 1m     dasselbe, nur Zeitrahmen 1m (Notausgang)
rem
rem  EIN Lesedurchlauf fuer alle drei Zeitrahmen; Aufteilung nur nach Reihen (k/8), nie nach Umsatzklasse.
rem  NUR LESEN auf E:/Markt-Dashboard-Archiv - kein Netz, kein Schluessel, keine Sperre.
rem  Abbruch ist GEFAHRLOS: alle 200 Dateien liegt ein Zwischenstand (_fortschritt.json + _zellen.bin), der naechste
rem  Start macht dort weiter (eine Datei je Reihe verliert dann ihre Uebernacht-Uebergabe, gezaehlt). Wachhund 900 s.
rem
rem  Aufgabenplanung (wiki/betrieb.md, kein && in /TR):
rem    schtasks /Create /TN "Markt-Dashboard Trendwende II 0" /TR "\"<Repo>\studien\vorregistrierung-2026-09-09-trendwende-ii\nacht.cmd\" 0/8" /SC ONCE /ST 01:00 /F
rem    schtasks /Run /TN "Markt-Dashboard Trendwende II 0"
rem
rem  Diese Datei startet NICHTS von selbst - der PM legt die Aufgabe an, wenn die Platte frei ist.
rem ===================================================================================

rem  NACHTRAG 5 (VORREGISTRIERUNG §20.1): die Zellen des verzoegerten Einstiegs sind im VOLLAUF AUS.
set "TW2_VERZOEGERT=0"

cd /d "%~dp0..\.."

set "TEIL=%~1"
set "AUS=voll"
set "TEILARG="
if not "%TEIL%"=="" (
  for /f "tokens=1 delims=/" %%K in ("%TEIL%") do set "AUS=voll-%%K"
  set "TEILARG=--teil %TEIL%"
)
shift

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

set "STUDIE=studien\vorregistrierung-2026-09-09-trendwende-ii"
set "LOG=%STUDIE%\nacht-!AUS!.log"

echo Trendwende II: Ausgabe !AUS! %TEILARG% !ZRARG!, Start %DATE% %TIME% >> "!LOG!"
node --max-old-space-size=4096 "%STUDIE%\messen.js" --aus !AUS! %TEILARG% !ZRARG! --checkpoint 200 --wachhund 900 >> "!LOG!" 2>&1
set "RC=%ERRORLEVEL%"
echo Ende %DATE% %TIME%  (Rueckgabewert %RC%) >> "%LOG%"
endlocal & exit /b %RC%
