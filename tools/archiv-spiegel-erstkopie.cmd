@echo off
rem Startet die Erstkopie des Kursarchivs auf den Rechenknecht.
rem Wird per Win32_Process.Create AUSSERHALB des Prozessbaums einer Claude-Sitzung
rem gestartet, sonst stirbt der Lauf mit der Claude-App (wiki/betrieb.md, Lange Laeufe).
rem Ausgabe steht in Markt-Dashboard-Daten\spiegel-erstkopie.log.
"C:\Program Files\Git\usr\bin\bash.exe" -c "/c/Users/Wilhe/Downloads/Stock-Dashboard/tools/archiv-spiegel-erstkopie.sh"
