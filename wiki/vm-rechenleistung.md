---
tags: [betrieb, werkzeuge]
---
# Große VMs: was sie bringen würden (Einschätzung 19.09.2026)

Wilhelms Frage: „Wenn ich dir eine oder mehrere VMs mit viel RAM und CPU gebe, könntest du damit etwas anfangen?"
**Antwort: Ja — sie machen uns schneller und die Läufe zuverlässiger, aber nicht erfolgreicher.** Nichts davon ist gebaut
oder bestellt; das hier ist die Einschätzung vor jedem Entscheid.

## Ausgangslage (gemessen 19.09.)

Der Rechner hat 8 Kerne / 16 Threads (Ryzen 7 5700X3D) und 32 GB RAM. Das Archiv liegt auf E:, einer **HDD** (WD20EZRX).
Die langen Läufe bremsen an drei Stellen: an der Platte (Panelbau 2,8–5,6 MB/s je Teil), am Speicher (GDELT: sechs Teile
brauchten 15 GB, frei blieben 0,3 GB) und daran, dass der Rechner nachts ausgeht (1m-Lauf am 08.09. und Panelbau v2.1 am 18.09.
beim Herunterfahren gestorben; dazu die Aufgabenplanung, die vom 16. bis 18.09. jeden Start ablehnte).

## Was schneller würde (grob geschätzt)

| Lauf | heute | auf einer VM mit 32–64 Kernen, 128–256 GB RAM, NVMe |
|---|---|---|
| Panelbau (Tages-Panel) | 1–2 h | Minuten |
| Minuten-Signalstudie 1m (457 Prozess-Stunden) | drei Nächte | unter einem Tag |
| GDELT-Datenbau für Nr. 45 (≈ 1,8 TB Download, 61 Prozess-Stunden) | 2–3 Nächte | hängt an der Leitung: mit Gigabit ein Nachmittag, sonst eine Nacht — aber ohne dass der PC anbleiben muss |

## Was neu möglich würde

- **Läufe, die nicht sterben:** eine VM läuft durch, egal ob der PC aus ist; keine Aufgabenplanung-Aussetzer.
- **Das ganze Minutenarchiv im Speicher** (≈ 136 GB): Studien lesen es einmal statt bei jedem Lauf von der HDD.
- **Bessere Statistik je Frage:** Permutationstests mit 1.000 Ziehungen statt 12 Placebos, Block-Bootstrap für das MDE, ein
  Data-Snooping-Test über alles, was wir je getestet haben. Das macht Urteile belastbarer.
- **Kleine Textmodelle lokal** (Finanz-Klassifizierer der BERT-Größe): Schlagzeilen und 8-K-Texte klassifizieren, ohne dass Daten
  an Dritte gehen und ohne Nutzungsbedingungen fremder Gratis-Kontingente. Große Sprachmodelle nur mit GPU sinnvoll.

## Was sie nicht ändern

- **Die Auflösungswand:** zehn Jahre Daten bleiben zehn Jahre. Fast alle Neins dieses Monats kamen von der Zahl der unabhängigen
  Zeitpunkte und von der Kassa-Hürde, nicht von der Rechenzeit.
- **Mehr Rechenleistung verführt zu mehr Varianten, und jede zusätzliche Variante macht jeden Test schwächer** (Bonferroni, große
  Signalstudie: 3.372 Tests, 0 bestätigt). Die Leistung gehört in bessere Statistik je Frage, nicht in mehr Fragen.
- **Token der Agenten:** Entwerfen, Bauen, Prüfen kostet dasselbe. Indirekt sinkt der Verbrauch, weil weniger Läufe beaufsichtigt,
  neu gestartet oder nachgerechnet werden müssen (Nr. 38 kostete einen Teil seiner 490k genau dort).

## Eine oder mehrere?

**Eine große VM.** Unsere Läufe teilen sich ohne Absprache nach Reihen oder Tagen auf — das nutzt alle Kerne einer Maschine. Mehrere
VMs bräuchten eine Verteilschicht, also Code, den niemand verlangt hat.

## Ein Teil geht sofort ohne VM

F: ist eine NVMe mit 862 GB frei. Eine **schreibgeschützte Kopie des Archivs dort** nimmt die HDD-Bremse aus Panelbau und
Minutenstudien; die Archiv-Wurzel ist in den Minutenstudien schon per `MD_ALPACA_WURZEL` einstellbar. Das Original auf E: bleibt
die Tatsache, der Nachlauf schreibt weiter dorthin. Kerne, Speicher und „PC muss an bleiben" bleiben dabei unverändert.

## Was der PM bräuchte

1. Linux, 32–64 Kerne, 128–256 GB RAM, ≥ 1 TB NVMe, möglichst Gigabit-Anbindung.
2. SSH-Zugang mit einem Schlüssel, den Wilhelm anlegt; der PM sieht nie ein Passwort.
3. Einmalige Kopie des Archivs: im Heimnetz unter einer Stunde, in einer Cloud je nach Upload viele Stunden.
4. Regeln: keine Alpaca- oder Bigdata-Schlüssel auf der VM, keine Mühlwerk-Daten; der nächtliche Nachlauf bleibt zu Hause; die
   Archiv-Kopie ist nur lesbar; Ergebnisse kommen als kleine Dateien zurück.
5. Anpassung der Skripte: wenige fest verdrahtete Windows-Pfade (2 von 28 Dateien im Prüfstand, 1 von 5 bei GDELT, 0 in Trendwende
   II und der Stimmungsstudie) plus Linux-Startskripte statt `.cmd`.
6. **Erster Lauf als Abnahme:** einen Panel-Teil auf der VM bauen und bitgenau mit dem lokalen v2.1 vergleichen — erst dann gilt die
   VM als Messgerät.
7. Kosten und Konto (falls Cloud) entscheidet und bucht Wilhelm; der PM bestellt nichts.

---

## Nachtrag 20.09.2026: die Maschine steht — und die Schätzung oben war in einem Punkt falsch

Wilhelm hat geliefert: **Rechenknecht**, 192.168.0.11, LXC auf Proxmox (R620), Debian 13.6, **24 Kerne (Xeon E5-2650 v2),
192 GB RAM**, `/archiv` mit 916 GB frei, Node/git/rsync/tmux vorhanden, Autostart mit dem Host. Der PM hat sie am 20.09.
selbst vermessen (`pm-bench.js`, gleiche Last auf beiden Maschinen, gleiche Prüfsumme):

| Maß | PC | Rechenknecht |
|---|---|---|
| ein Kern | 397 Mio Schritte/s | **104 Mio Schritte/s** (3,8× langsamer) |
| voll parallel | ≈ 1,0–1,6 Mrd Schritte/s (16 Prozesse) | ≈ 0,8 Mrd Schritte/s (24 Prozesse) |
| Platte des Archivs | HDD, im Panelbau 2,8–5,6 MB/s je Teil | **537 MB/s schreiben, 520 lesen** |
| Speicher | 32 GB (GDELT scheiterte daran) | **192 GB, ohne cgroup-Grenze** |

**Damit fällt die Zeile „Minuten-Signalstudie unter einem Tag" aus der Tafel oben** — sie unterstellte 32–64 *schnelle*
Kerne. Rein rechengebundene Läufe werden auf dem Rechenknecht **nicht schneller**. Was bleibt, ist trotzdem viel: der
Panelbau war **plattengebunden** (HDD gegen SSD ist der Faktor, nicht die CPU), der GDELT-Lauf war **speichergebunden**
(vier statt sechs Teile, 0,3 GB frei), und beide sterben heute, wenn der PC ausgeht. Regel für alle Berichte vom Server:
**wer „schneller" schreibt, schreibt dazu warum — Platte, Speicher oder Parallelität, nie „mehr CPU".**

Nebenbefund: der Klon des öffentlichen Repos auf dem Server war **136 Commits alt**, weil wir nicht nach GitHub pushen.
Aktuell gehalten wird der Server per **Push ins LAN** (`knecht` = `ssh://root@192.168.0.11/archiv/markt-dashboard/Stock-Dashboard`,
dort `receive.denyCurrentBranch=updateInstead`). Push nach GitHub bleibt verboten.
