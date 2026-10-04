@echo off
setlocal
rem ===================================================================================
rem  MASSNAHMEN-NACHTRAG BEI ALPACA (Auftrag Nr. 89, Teil A, 04.10.2026)
rem
rem  Startet a-massnahmen-nachtrag.js mit dem Zugang aus Wilhelms Benutzerprofil.
rem  Muster: tools\vollsammlung-nachholen.cmd. Ein frisch geoeffnetes Fenster erbt den
rem  Zugang von selbst; kommt der Start aus einem aelteren Prozess, wird er hier aus dem
rem  Profil nachgeholt - ohne ihn anzuzeigen, zu protokollieren oder in eine Datei zu
rem  schreiben. Diese Datei enthaelt keinen Zugang.
rem
rem    a-massnahmen-nachtrag.cmd --probe     ein Abruf ohne Symbol-Angabe, nur Zaehlungen
rem    a-massnahmen-nachtrag.cmd --holen     der ganze Zeitraum in den NEUEN Ordner
rem
rem  Geschrieben wird nur nach E:\Markt-Dashboard-Archiv\alpaca-massnahmen-nachtrag-2026-10\
rem  und in diesen Ordner (Zaehlungen, Protokoll). Der alte Ordner alpaca-massnahmen\ wird
rem  nur gelesen. Listen nie mit Komma uebergeben - cmd.exe trennt Argumente am Komma.
rem ===================================================================================

cd /d "%~dp0..\..\.."

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
if not defined ALPACA_SECRET (
  echo Kein Zugang: ALPACA_SECRET steht nicht im Benutzerprofil.
  exit /b 2
)

node studien\datenfundament-2026-10-04\abrufe\a-massnahmen-nachtrag.js %*
set "RC=%ERRORLEVEL%"
endlocal & exit /b %RC%
