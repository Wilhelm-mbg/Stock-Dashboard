@echo off
rem Ein Teil des Panelbaus. Aufruf: panelbau.cmd <k> <n>
rem Wird von einer Windows-Aufgabe gestartet (ohne Fenster), damit der Lauf die startende Sitzung ueberlebt -
rem der erste Vollauf starb nach 11 Minuten still mit der Sitzung, die ihn gestartet hatte.
rem Die Ausgabedateien liegen unter voll\log2\: die Dateien des ersten Laufs waren noch von den
rem Umleitungs-Handles der toten Sitzung gesperrt, und ">>" brach daran still ab (Rueckgabewert 0).
cd /d "%~dp0"
if not exist "voll\log2" mkdir "voll\log2"
node --max-old-space-size=4096 paneldaten.js --aus voll --teil %1/%2 --checkpoint 50 >> "voll\log2\teil-%1.out" 2>> "voll\log2\teil-%1.err"
exit /b %ERRORLEVEL%
