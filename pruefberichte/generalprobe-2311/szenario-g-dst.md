# Szenario g (Teil 2) - Sommer-/Winterzeit: direkter Test der Uhr in mfhandel.js

Gegen eine unabhaengige Regelrechnung (US-Regel: zweiter Sonntag im Maerz 02:00 EST bis erster Sonntag im November 02:00 EDT). Getestet: nyTag/nyUhr im 5-Minuten-Raster ueber die Wechsel 08.03.2026, 01.11.2026, 14.03.2027 (und die Woche um den 07.03.2027, an dem es KEINEN Wechsel gibt - der Wechsel 2027 ist am 14.03.), letzterFertigerWerktag im selben Raster (also auch 22:00-04:00 UTC), nyZeit fuer 00:00, 09:30, 09:35, 16:00, 16:15, 23:59 an jedem Tag der Fenster und bestandFrisch an der Grenze 16:15 +/- 1 Minute.

- Raster-Punkte: 10212, nyZeit-Faelle: 204, bestandFrisch-Faelle: 204
- Abweichungen: **0**


- Info: {"luecke_2026_03_08_0230":"2026-03-08T06:30:00.000Z","doppel_2026_11_01_0130":"2026-11-01T06:30:00.000Z","wechsel2027":"2027-03-06 EST, 2027-03-07 EST, 2027-03-08 EST, 2027-03-09 EST, 2027-03-10 EST, 2027-03-11 EST, 2027-03-12 EST, 2027-03-13 EST, 2027-03-14 EDT, 2027-03-15 EDT"}
