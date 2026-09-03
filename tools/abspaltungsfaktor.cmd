@echo off
setlocal
rem ===================================================================================
rem  ABSPALTUNGS-KURSFAKTOR - der Zweitabruf (Stufe Z1c, Nachtrag)
rem
rem    tools\abspaltungsfaktor.cmd listen      kein Netz: zaehlt und weist aus
rem    tools\abspaltungsfaktor.cmd eichen      nur die beiden Eichungen, 4 Abrufe
rem    tools\abspaltungsfaktor.cmd messen      misst und schreibt (2 Abrufe je Abspaltung)
rem
rem  Dieses Werkzeug drosselt auf 20 Abrufe je Minute - ein Zehntel der Grenze. Der
rem  Vollauf der Balken laeuft parallel mit 170/min auf DEMSELBEN Zugang. Ein 429
rem  bricht hier sofort ab und nennt die Wartezeit; wiederholt wird nicht, denn ein
rem  Wiederholungssturm ginge zu Lasten des Vollaufs. Abbruch ist gefahrlos: jede
rem  Maszahmen-Datei wird in einem Stueck geschrieben, ein neuer Start ueberspringt,
rem  was schon gemessen ist.
rem
rem  Der Zugang steht in Wilhelms Benutzerprofil. Ein frisch geoeffnetes Fenster erbt
rem  ihn von selbst; kommt der Start aus einem aelteren Prozess, wird er hier aus dem
rem  Profil nachgeholt - ohne ihn anzuzeigen, zu protokollieren oder in eine Datei zu
rem  schreiben.
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
if "%MODUS%"=="" set "MODUS=listen"
shift

rem  Alle weiteren Argumente einsammeln, nicht nur vier. UND: cmd.exe trennt Argumente auch
rem  am KOMMA - aus "--symbole AGE,CENTA,HON" werden vier Argumente. Beim ersten Nachmessen
rem  hat das still einen Wert statt fuenf gemessen, mit einem Bericht, der ordentlich
rem  aussah. Das Werkzeug nimmt darum eine Liste auch durch LEERZEICHEN getrennt an; hier
rem  wird nur dafuer gesorgt, dass wirklich alles ankommt.
set "REST="
:sammeln
if "%~1"=="" goto weiter
set "REST=%REST% %1"
shift
goto sammeln
:weiter

echo Abspaltungsfaktor: Modus %MODUS%, Start %DATE% %TIME%
node tools\alpaca-abspaltungsfaktor.js --%MODUS%%REST%
echo Ende %DATE% %TIME%  (Rueckgabewert %ERRORLEVEL%)
endlocal
