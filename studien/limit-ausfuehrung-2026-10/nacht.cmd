@echo off
setlocal enabledelayedexpansion
rem ===================================================================================
rem  LIMIT STATT MARKTORDER - Vollauf (REGEL.md §8.4, Siegel 9cb14c7)
rem
rem    studien\limit-ausfuehrung-2026-10\nacht.cmd 3/8 5m 15m   Teil 3 von 8, nur 5m und 15m (Ausgabe voll-3-5m-15m)
rem    studien\limit-ausfuehrung-2026-10\nacht.cmd 3/8 1m       Teil 3 von 8, nur 1m        (Ausgabe voll-3-1m)
rem
rem  Reihenfolge laut REGEL: erst 5m/15m ueber alles, dann 1m. Geteilt nur nach Zeitrahmen und Teil,
rem  nie nach Umsatzklasse. auswerten.js legt die Teile zusammen:
rem    node auswerten.js --aus voll-0-5m-15m ... --aus voll-7-5m-15m --aus voll-0-1m ... --aus voll-7-1m
rem         --abgleich E:/Markt-Dashboard-Archiv/studien-zellen/signale-minuten-5m15m-2026-09-08 ...
rem
rem  NUR LESEN auf E:/Markt-Dashboard-Archiv - kein Netz, kein Schluessel. Abbruch ist gefahrlos
rem  (Zwischenstand alle 200 Dateien, Neustart setzt fort). Speicher je Prozess: Zellen 481 MB (5m/15m)
rem  bzw. 241 MB (1m) plus Heap; vor dem Start freien Speicher pruefen (>= 3,5 GB Rest).
rem
rem  Diese Datei startet NICHTS von selbst und legt keine geplante Aufgabe an - der PM entscheidet.
rem ===================================================================================

cd /d "%~dp0..\.."

set "TEIL=%~1"
if "%TEIL%"=="" ( echo Teil fehlt, z. B. 0/8 & exit /b 2 )
for /f "tokens=1 delims=/" %%K in ("%TEIL%") do set "AUS=voll-%%K"
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
if "!ZRARG!"=="" ( echo Zeitrahmen fehlen, z. B. 5m 15m & exit /b 2 )
set "AUS=!AUS!!ZRNAME!"

set "STUDIE=studien\limit-ausfuehrung-2026-10"
set "LOG=%STUDIE%\nacht-!AUS!.log"
echo Limit-Ausfuehrung: Ausgabe !AUS! --teil %TEIL% --zeitrahmen!ZRARG!, Start %DATE% %TIME% >> "!LOG!"
node --max-old-space-size=4096 "%STUDIE%\lauf.js" --aus !AUS! --teil %TEIL% --zeitrahmen!ZRARG! --checkpoint 200 --wachhund 900 >> "!LOG!" 2>&1
set "RC=%ERRORLEVEL%"
echo Ende %DATE% %TIME%  (Rueckgabewert %RC%) >> "!LOG!"
endlocal & exit /b %RC%
