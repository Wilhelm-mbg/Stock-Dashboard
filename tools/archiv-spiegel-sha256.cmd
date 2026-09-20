@echo off
rem Startet die sha256-Abnahme der Archiv-Erstkopie (Auftrag Nr. 46, Teil 2.3).
rem Wird per Win32_Process.Create AUSSERHALB des Prozessbaums einer Claude-Sitzung
rem gestartet, sonst stirbt der Lauf mit der Claude-App (wiki/betrieb.md, Lange Laeufe).
rem Ausgabe steht in Markt-Dashboard-Daten\spiegel-erstkopie.log (Fortschritt) und
rem Markt-Dashboard-Daten\spiegel.log (Ergebnis je Lauf).
"C:\Program Files\Git\usr\bin\bash.exe" -c "/c/Users/Wilhe/Downloads/Stock-Dashboard/tools/archiv-spiegel-sha256.sh"
