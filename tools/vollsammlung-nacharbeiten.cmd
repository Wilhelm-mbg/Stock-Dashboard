@echo off
setlocal
rem ===================================================================================
rem  NACHARBEITEN ZUR ALPACA-VOLLSAMMLUNG (06.09.2026) - EINE Aufgabe, vier Schritte,
rem  alles ohne Netz ausser dem Yahoo-Vergleich (der liest nur die Yahoo-Archive):
rem
rem    1. Sicherungsliste der bereinigten Kopien VOR dem Schreiben (Hashes)
rem    2. --ableiten ueber alle Werte (bereinigte Kopien, _regel.json)
rem    3. --manifest (Pruefsummen beider Wurzeln, Lueckenliste, Minuten-Lebenszeit,
rem       Zusammenfassung)
rem    4. --pruefen an drei Werten mit Ueberlappung + Manifestvergleich + --gegen-yahoo
rem
rem  Aufruf (als Windows-Aufgabe, Muster wiki/betrieb.md):
rem    schtasks /Create /TN "Markt-Dashboard Nacharbeiten" /TR "\"C:\Users\Wilhe\Downloads\Stock-Dashboard\tools\vollsammlung-nacharbeiten.cmd\"" /SC ONCE /ST HH:MM /F
rem  Das Protokoll liegt unter studien\alpaca-vollsammlung-2026-09\nacharbeiten-<datum>.log.
rem  Kein Schluessel wird gebraucht oder gelesen.
rem ===================================================================================

cd /d "%~dp0.."
set "LOG=studien\alpaca-vollsammlung-2026-09\nacharbeiten-2026-09-06.log"

echo Nacharbeiten: Start %DATE% %TIME% >> "%LOG%"
echo == 1. Sicherungsliste bereinigt (vorher) >> "%LOG%"
node --max-old-space-size=4096 tools\alpaca-vollsammlung.js --manifest --nur-bereinigt --ausgabe studien\alpaca-vollsammlung-2026-09\sicherung-bereinigt-vor-ableiten-2026-09-06.json >> "%LOG%" 2>&1
echo == 2. ableiten  %DATE% %TIME% >> "%LOG%"
node --max-old-space-size=4096 tools\alpaca-vollsammlung.js --ableiten >> "%LOG%" 2>&1
echo == 3. manifest  %DATE% %TIME% >> "%LOG%"
node --max-old-space-size=4096 tools\alpaca-vollsammlung.js --manifest >> "%LOG%" 2>&1
echo == 4. pruefen MNST SPGI AAPL + gegen-yahoo  %DATE% %TIME% >> "%LOG%"
node --max-old-space-size=4096 tools\alpaca-vollsammlung.js --pruefen --ordner MNST SPGI AAPL --gegen-yahoo MNST SPGI AAPL >> "%LOG%" 2>&1
echo Nacharbeiten: ENDE %DATE% %TIME%  (Rueckgabewert %ERRORLEVEL%) >> "%LOG%"
endlocal
