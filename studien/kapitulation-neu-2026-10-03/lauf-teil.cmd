@echo off
rem Ein Teil des Archivlaufs (Auftrag Nr. 68), abgekoppelt gestartet von starten.ps1 ueber Win32_Process.Create.
rem PATH wird erzwungen: ein Prozess ausserhalb des Sitzungsbaums erbt nur den System-PATH.
rem Aufruf von Hand:  lauf-teil.cmd 0     (Teile 0 bis 3; ein fertiger Teil tut nichts, ein abgebrochener setzt fort)
rem Die Umleitung steht VOR dem echo: eine Ziffer direkt vor ">>" liest cmd als Kanalnummer (im ersten Start verstuemmelt).
set "PATH=C:\Program Files\nodejs;%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem"
cd /d "C:\Users\Wilhe\Downloads\Stock-Dashboard"
if not exist "studien\kapitulation-neu-2026-10-03\lauf\teile" mkdir "studien\kapitulation-neu-2026-10-03\lauf\teile"
>> "studien\kapitulation-neu-2026-10-03\lauf\teile\teil-%1.log" echo [%date% %time%] Start Teil %1
node --max-old-space-size=4096 "studien\kapitulation-neu-2026-10-03\messen.js" --teil %1/4 >> "studien\kapitulation-neu-2026-10-03\lauf\teile\teil-%1.log" 2>&1
>> "studien\kapitulation-neu-2026-10-03\lauf\teile\teil-%1.log" echo [%date% %time%] Ende Teil %1 mit Code %errorlevel%
