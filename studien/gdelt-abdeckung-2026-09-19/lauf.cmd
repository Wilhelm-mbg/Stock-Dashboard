@echo off
rem GDELT-Abdeckungsprobe (Nr. 44): ein Teil des Zaehl-Laufs, gestartet von der Aufgabenplanung (kein Fenster,
rem Aufruf ueber powershell -WindowStyle Hidden, siehe lauf-start.ps1). Fortsetzbar je Tag; ein Neustart ueberspringt
rem erledigte Tage. Argumente: k n von bis [ohneKurz]   (ohneKurz = Ziffern der Klassen ohne Komma, z. B. 12)
cd /d "%~dp0"
if "%5"=="" (
  node gkg-zaehlen.js --von %3 --bis %4 --teil %1/%2 >> "voll\lauf-%3-%1.out" 2>&1
) else (
  node gkg-zaehlen.js --von %3 --bis %4 --teil %1/%2 --ohneKurz %5 >> "voll\lauf-%3-%1.out" 2>&1
)
exit /b %ERRORLEVEL%
