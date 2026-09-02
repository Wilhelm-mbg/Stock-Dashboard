# Drei gemessene Kostenrunden waren still verschwunden

*Sitzung „Kosten", 03.09.2026. Behebt Befund 2 aus
`2026-09-03-bestand-und-kopfzeile.md`. Nicht gepusht, keine Version, kein Build —
das macht die Release-Wache.*

## Für die Freigabe-Notiz

**Kostenrunden, die noch im Depot lagen, zählen wieder mit. In dieser Installation
sind das drei — die CFD-Messung rechnet damit auf fünf Runden statt auf zwei.**

Seit dem 27.08. wohnt die Messreihe der echten Handelskosten in einem eigenen Lager,
das der Depot-Reset nicht anfasst. Beim ersten Laden sollte mitgenommen werden, was
noch im Depot lag. Das ist nie passiert: der Weg war gebaut, wurde aber zu einem
Zeitpunkt gegangen, an dem das Depot noch gar nicht bereitstand — und er hat das nicht
gemeldet. Keine Fehlermeldung, keine Null, gar nichts. Die Runden waren nicht kaputt,
sie wurden nur nie abgeholt.

In diesem Datenordner betraf das **drei Runden vom 25. bis 27.08.** (AAPL, AAPL,
MSFT), keine davon doppelt. Beim nächsten Start wandern sie in die Messreihe: die
**CFD-Bilanz geht von 2 auf 5 Runden**, der Median von 0,046 % auf 0,0445 %. Das
Depot selbst wird dabei nur gelesen, nichts daran geändert. Von Wilhelms Schwelle
(rund 20 Runden, bevor die 0,10-%-Annahme ein Urteil bekommt) ist die Reihe damit
weiterhin weit entfernt — aber sie steht jetzt auf dem, was wirklich gemessen wurde.

## Technisch

- `kosten.js`, `messungHolen()`: das Depot kommt über `holeDepot()` statt über das
  Modul-`D`. Das Modul-`D` füllt allein `mitFrischemD()` an den öffentlichen
  Einstiegen — `verkabeln()` ruft `messungHolen()` aber davor, und `messungLadenP`
  verhindert jeden zweiten Lauf. `depotAlt` war dadurch ausnahmslos leer.
- Geändert ist **allein die Herkunft des Depots**, keine Rechenregel: was übernommen
  wird und wie entdoppelt wird, entscheidet unverändert `messungMischen()`.
- Gesetzt wurde es in `messungHolen()` statt in `verkabeln()`, weil `messungHolen()`
  von fünf Stellen gerufen wird (u. a. `rundeAblegen`) — so trägt der Pfad seine
  Datenquelle selbst, statt an der Reihenfolge in `verkabeln()` zu hängen.
- Neue Zusicherung `(c2)` in `test-v6.js`: misst **funktional** durch den echten Weg
  (`verkabeln()` → `messungHolen()` → `kostenRunden()`/`kostenBilanz()`), mit einem
  Depot, das Altrunden trägt. Geprüft werden Übernahme, Entdopplung, beide Bilanzen,
  das Zurückschreiben in den eigenen Store und dass das Depot unverändert bleibt.
  Die Sandbox `kostenSandbox()` nimmt dafür ein `depotMessung`.
- **Positivkontrolle nachgewiesen:** mit zurückgedrehter Korrektur sind 5 der 9
  Zusicherungen rot und melden `kostenRunden(): 1` statt 4. Dazu eine Gegenprobe im
  Block selbst (ohne Altrunden im Depot bleibt es bei 1), damit er nicht eine Zahl
  misst, die ohnehin immer stimmt.
- `npm test` grün (eslint, `test-channel.js`, `test-v6.js` mit 2887 Zusicherungen).

## Die Fehlerform

Ein **„Nullbefund vom toten Werkzeug"** (`wiki/fehlerformen.md`): der Pfad besteht,
feuert nie, und meldet dabei keine Null, sondern gar nichts. Die vorhandene Prüfung
zog `messungMischen()` als Funktion heraus und testete sie isoliert — die Funktion war
auch immer richtig. Nur gerufen hat sie niemand mit Daten. Gefunden hat es erst ein
funktionaler Lauf durch den ganzen Weg, und genau so prüft die neue Zusicherung.
