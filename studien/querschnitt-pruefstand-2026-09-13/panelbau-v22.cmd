@echo off
rem Panelbau v2.2 (Auftrag Nr. 67): ein Bau-Teil ODER der Nachlauf.
rem   panelbau-v22.cmd <k> <n>          baut Teil k von n nach voll-v22\teil-<k>\  (fortsetzbar ueber _fortschritt.json)
rem   panelbau-v22.cmd nachlauf <n>     wartet auf voll-v22\teil-0..n-1\_teil.json, vereint, faehrt die Kernpruefung
rem Gestartet ueber Win32_Process.Create (panelbau-v22-start.ps1), also AUSSERHALB des Sitzungsbaums: der Prozess erbt den
rem System-PATH, nicht den der Sitzung. Darum wird der PATH hier erzwungen und node namentlich geprueft - stimmt die
rem Version nicht, bricht der Lauf mit Rueckgabewert 9 ab, statt mit einem anderen node still etwas anderes zu bauen.
rem voll\ (v2.1) wird nie angefasst: --luecken verweigert das Ziel voll, Teilordner und Panel tragen ihre Kennung.
rem Umleitungen stehen VORN: "echo ... rc=0> datei" wuerde die 0 als Handle lesen und die Zeile verschlucken.
setlocal
set "PATH=C:\Program Files\nodejs;C:\Windows\System32;C:\Windows"
cd /d "%~dp0"
if not exist "voll-v22\log" mkdir "voll-v22\log"
set "NODEV="
for /f "delims=" %%v in ('node --version 2^>nul') do set "NODEV=%%v"
if not "%NODEV%"=="v24.18.0" (
  >> "voll-v22\log\teil-%1.err" echo %DATE% %TIME% node ist "%NODEV%" statt v24.18.0 - Abbruch
  exit /b 9
)
if /i "%1"=="nachlauf" goto nachlauf
>> "voll-v22\log\teil-%1.out" echo %DATE% %TIME% Start Teil %1 von %2 mit node %NODEV%
node --max-old-space-size=4096 paneldaten.js --aus voll-v22 --luecken --teil %1/%2 --checkpoint 50 >> "voll-v22\log\teil-%1.out" 2>> "voll-v22\log\teil-%1.err"
exit /b %ERRORLEVEL%

:nachlauf
set /a LETZTER=%2-1
>> "voll-v22\log\nachlauf.out" echo %DATE% %TIME% Nachlauf wartet auf %2 Teile
:warte
set "FEHLT="
for /l %%i in (0,1,%LETZTER%) do if not exist "voll-v22\teil-%%i\_teil.json" set "FEHLT=1"
if defined FEHLT (
  ping -n 61 127.0.0.1 >nul
  goto warte
)
>> "voll-v22\log\nachlauf.out" echo %DATE% %TIME% alle Teile fertig - vereinen
node --max-old-space-size=4096 paneldaten.js --aus voll-v22 --luecken --vereinen >> "voll-v22\log\nachlauf.out" 2>> "voll-v22\log\nachlauf.err"
set "RCV=%ERRORLEVEL%"
if not "%RCV%"=="0" (
  > "voll-v22\log\nachlauf-fertig.txt" echo vereinen rc %RCV%
  exit /b 1
)
>> "voll-v22\log\nachlauf.out" echo %DATE% %TIME% Kernpruefung
node --max-old-space-size=8192 pruefung-v22.js --b voll-v22 >> "voll-v22\log\nachlauf.out" 2>> "voll-v22\log\nachlauf.err"
set "RCP=%ERRORLEVEL%"
> "voll-v22\log\nachlauf-fertig.txt" echo vereinen rc 0, kernpruefung rc %RCP%
exit /b 0
