# Sammelstelle für Release-Notizen

Hier legt **jede Sitzung** ab, was in den nächsten Release gehört — als eigene Datei,
nicht als Anhängsel an eine gemeinsame. Der Grund ist banal und teuer gelernt: An diesem
Projekt arbeiten regelmäßig mehrere Sitzungen gleichzeitig, und eine gemeinsame Datei
erzeugt genau dort einen Konflikt, wo niemand einen gebrauchen kann.

## Wie

Eine Datei je Vorhaben, benannt nach Datum und Sache:

    release-notizen/2026-08-24-issue-68-reiter.md
    release-notizen/2026-08-24-newey-west.md

Inhalt: das, was ein **Anwender** wissen will — nicht die Commit-Liste. Ein Titel als
Überschrift, zwei bis fünf Sätze darunter. Was sich für ihn ändert, nicht welche Funktion
umbenannt wurde.

```markdown
## Die Positionszeile erklärt sich selbst

Ein Klick auf das Kürzel öffnet den Aktien-Explorer, der Pfeil davor klappt Chart und
Signale auf — mit dem eigenen Einstieg markiert. Gezeigt wird die Regel, unter der die
Position eröffnet wurde, nicht die gerade eingestellte.
```

## Was danach passiert

`node tools/release.js --hoch` sammelt alle Dateien hier ein, baut daraus den
Release-Text, und **löscht sie danach** (in einem eigenen Commit). Was hier liegt, ist
also immer nur das noch nicht Ausgelieferte. Liegt gar nichts hier, nimmt das Skript
ersatzweise die Commit-Liste seit dem letzten Tag — lesbar, aber deutlich schlechter.

## Der ganze Ablauf

    node tools/release.js --pruefen    # was ist unveröffentlicht, welche Notizen liegen da
    node tools/release.js --bauen      # Version hochzählen, sauber bauen, testen
    node tools/release.js --hoch       # Entwurf, Assets, veröffentlichen, gegenprüfen

Oder alles auf einmal mit `--alles`. Ein `--minor` zählt die mittlere Stelle hoch
(8.28.3 → 8.29.0) statt der letzten.

Das Skript **weigert sich**, aus einem schmutzigen Arbeitsbaum zu bauen, bei roten Tests
auszuliefern, eine schon vergebene Nummer zu nehmen oder `telemetrie.json` zu committen.
Nach dem Veröffentlichen prüft es nach, ob wirklich das eigene Paket oben liegt — eine
parallele Sitzung hat schon einmal die Assets desselben Tags ersetzt.
