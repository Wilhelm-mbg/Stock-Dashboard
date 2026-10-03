@echo off
rem Der Waechter (Auftrag Nr. 68): wartet auf die vier Teile, rechnet dann die Tore in der Reihenfolge der Vorregistrierung
rem (Zaehlung, Nullpunkt, Placebo, Leck-Klinke, Kosten, Stufe A, bei offener Sperre Stufe B) und schreibt den Bericht.
rem Aufruf von Hand:  lauf-stufen.cmd            (wartet, falls Teile fehlen; rechnet nichts doppelt)
set "PATH=C:\Program Files\nodejs;%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem"
cd /d "C:\Users\Wilhe\Downloads\Stock-Dashboard"
if not exist "studien\kapitulation-neu-2026-10-03\lauf" mkdir "studien\kapitulation-neu-2026-10-03\lauf"
echo [%date% %time%] Start Waechter>> "studien\kapitulation-neu-2026-10-03\lauf\stufen.log"
node --max-old-space-size=4096 "studien\kapitulation-neu-2026-10-03\messen.js" --warten >> "studien\kapitulation-neu-2026-10-03\lauf\stufen.log" 2>&1
echo [%date% %time%] Ende Waechter mit Code %errorlevel%>> "studien\kapitulation-neu-2026-10-03\lauf\stufen.log"
