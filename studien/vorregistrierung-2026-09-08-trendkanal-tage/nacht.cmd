@echo off
setlocal enabledelayedexpansion
rem ===================================================================================
rem  TRENDKANAL AUF TAGESBASIS - die Vollaggregation und Messung (VORREGISTRIERUNG.md §14)
rem
rem    studien\vorregistrierung-2026-09-08-trendkanal-tage\nacht.cmd            Tagesbalken ueber ALLE Reihen, ein Prozess, Ausgabe tage\
rem    studien\vorregistrierung-2026-09-08-trendkanal-tage\nacht.cmd 3/8        Teil 3 von 8, Ausgabe tage-3\ (Teil 0 liest zusaetzlich SPY)
rem    studien\vorregistrierung-2026-09-08-trendkanal-tage\nacht.cmd messen     nach der Aggregation: messen.js ueber tage\ (bzw. tage-0..tage-7) -> voll\, dann auswerten.js
rem
rem  Schritt 1 (Lesen, dominiert): tagesbalken.js liest jede Symbol-Jahr-Datei des Minutenarchivs GENAU EINMAL und
rem  schreibt je Reihe tage\<REIHE>.json (Pilot: 204 Dateien / 0,88 GB in 22 s bei warmem Plattenpuffer; kalt rechnet der
rem  PM mit ~11 MB/s wie in der Minutenstudie, also ~3 h fuer 122 GB in einem Prozess). Fortsetzbar: eine Reihe ist ganz
rem  oder gar nicht in der Ausgabe, _fortschritt.json fuehrt die erledigten.
rem  Schritt 2 (Minuten): messen.js laedt alle Tagesdateien in den Speicher (Pilot: 19 Reihen in 1,9 s; hochgerechnet
rem  ~12 min fuer 7.299 Reihen) und schreibt voll\_zellen.bin; auswerten.js schreibt ERGEBNIS.md nur bei vollstaendiger
rem  Aggregation, sonst PILOT-ERGEBNIS.md.
rem
rem  NUR LESEN auf E:/Markt-Dashboard-Archiv - kein Netz, kein Schluessel, keine Sperre. Sicherung von tage\ nach
rem  E:/Markt-Dashboard-Archiv/studien-zellen/ macht der PM.
rem
rem  Aufgabenplanung (wiki/betrieb.md, kein && in /TR), NACH dem 1m-Vollauf der Minutenstudie:
rem    schtasks /Create /TN "Markt-Dashboard Trendkanal Tage 0" /TR "\"<Repo>\studien\vorregistrierung-2026-09-08-trendkanal-tage\nacht.cmd\" 0/4" /SC ONCE /ST 01:00 /F
rem    schtasks /Run /TN "Markt-Dashboard Trendkanal Tage 0"
rem    ... danach:  nacht.cmd messen
rem
rem  Diese Datei startet NICHTS von selbst - der PM legt die Aufgabe an, wenn die Platte frei ist.
rem ===================================================================================

cd /d "%~dp0..\.."
set "STUDIE=studien\vorregistrierung-2026-09-08-trendkanal-tage"
set "ARG=%~1"

if /I "%ARG%"=="messen" goto messen

set "AUS=tage"
set "TEILARG="
if not "%ARG%"=="" (
  for /f "tokens=1 delims=/" %%K in ("%ARG%") do set "AUS=tage-%%K"
  set "TEILARG=--teil %ARG%"
)
set "LOG=%STUDIE%\nacht-!AUS!.log"
echo Trendkanal Tage: Tagesbalken Ausgabe !AUS! %TEILARG%, Start %DATE% %TIME% >> "!LOG!"
node --max-old-space-size=2048 "%STUDIE%\tagesbalken.js" --aus !AUS! %TEILARG% --wachhund 300 >> "!LOG!" 2>&1
set "RC=%ERRORLEVEL%"
echo Ende %DATE% %TIME%  (Rueckgabewert %RC%) >> "!LOG!"
endlocal & exit /b %RC%

:messen
set "LOG=%STUDIE%\nacht-messen.log"
set "TAGE="
if exist "%STUDIE%\tage\_fortschritt.json" set "TAGE=--tage tage"
for /L %%K in (0,1,15) do if exist "%STUDIE%\tage-%%K\_fortschritt.json" set "TAGE=!TAGE! --tage tage-%%K"
if "!TAGE!"=="" (
  echo Keine Tagesordner gefunden - erst die Aggregation laufen lassen. >> "!LOG!"
  endlocal & exit /b 7
)
echo Trendkanal Tage: messen ueber !TAGE!, Start %DATE% %TIME% >> "!LOG!"
node --max-old-space-size=4096 "%STUDIE%\messen.js" --aus voll !TAGE! >> "!LOG!" 2>&1
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" node "%STUDIE%\auswerten.js" --aus voll >> "!LOG!" 2>&1
echo Ende %DATE% %TIME%  (Rueckgabewert %RC%) >> "!LOG!"
endlocal & exit /b %RC%
