# Auditor — Nacht auf 26.08.2026 (erster Lauf)

Geprüfter Stand: **a502c99** („Tafel: #83/#89 genommen")
Vorheriger Lauf: keiner — dies ist der erste. Änderungsmenge deshalb: letzte sieben Tage
(405 Commits, 231 Dateien) plus einmalige volle Grundprüfung über alle fünf Reiter.

## Arbeitsbaum war schmutzig

Zwei fremde, unfertige Dateien lagen im Baum: `bestandui.js` (+185/−?) und `index.html` (21 Zeilen).
Sie gehören zu Wilhelms Entscheid vom 26.08. („Meine Papiere verschwindet ganz aus Heute (b)",
Tafel-Zeile bca6825). Nicht angefasst, nicht committet. Jeder Fund auf der Fläche
**Vermögen → Meine Papiere** und **Heute** wäre deshalb vorläufig gewesen — es gab dort keinen.

## Was lief

| Prüfung | Ergebnis |
|---|---|
| `npm test` (`eslint .`, `test-channel.js`, `test-v6.js`) | **6 rot** — vollständig aus der offenen fremden Arbeit, siehe unten |
| `eslint .` allein | grün |
| `tools/ui-probe.js` | **grün** (Exit 0), 5 Reiter, 16 Pillen geschaltet |
| vertiefte Probe (`probe.js`) | 0 unbehandelte Fehler, 0 `console.error`, 26 Bildschirmfotos |
| Gegenprobe Laufband (`probe-reduzierte-bewegung.js`) | **1 Fund (B)** |

### Die 6 roten Tests sind kein Fund

Alle sechs prüfen die Signalliste auf „Heute" per Textmarke gegen `index.html`:

- Die Signalliste steht auf „Heute" — und nur dort (Felix, #71)
- Beide Überschriften führen auf denselben Erkläreintrag
- Die Liste auf „Heute" ist nach Kurz- und Mittelfrist-Signal untergliedert
- Jeder Wert steht in genau einer Gruppe, das Kurzfrist-Signal hat Vorrang
- Die Gruppenzeile spannt genau über die fünf Spalten
- `td.up` und `td.muted` haben eine Regel

Gegenprobe: `git show HEAD:index.html` enthält `id="bestandListe"` in Zeile 792, der Arbeitsbaum
nicht mehr. Die laufende Arbeit entfernt die Liste aus „Heute" (genau der beauftragte Entscheid b),
die Sperrklinken sind noch nicht nachgezogen. **Rot bei schmutzigem Baum → notiert, nicht gemeldet.**
Bei sauberem Baum wäre das sofort ein Fund gewesen.

## Funde

### B-1 — Das News-Laufband steht still und zeigt nur die Hälfte (Issue angelegt)

**Reiter:** Heute → Überblick · **Fenstergrößen:** 1280×800 und 1000×700, beide
**Herkunft:** kein Regress der letzten Nacht — die Regel steht seit **075c53a (21.08.2026, v8.23.10)**,
dem Commit, der das Laufband eingeführt hat. Innerhalb meines siebentägigen Erstfensters, aber fünf Tage alt.

`index.html:166` schaltet unter `prefers-reduced-motion: reduce` die Animation der Laufband-Spur
ersatzlos ab. Der Rahmen `#newsTicker` (Zeile 155–159) bleibt dabei auf `overflow: hidden` und
`white-space: nowrap`. Ergebnis: die Spur steht auf `translateX(0)` fest, es gibt keinen Rollbalken,
keinen Umbruch und keinen zweiten Weg zum Rest.

Gemessen (`gegenprobe-laufband.json`), zwei Messungen im Abstand von 2,5 s:

| | Wert |
|---|---|
| `matchMedia('(prefers-reduced-motion: reduce)')` **ohne** Emulation | `true` |
| `animation-name` der Spur | `none` (trotz `animation-duration: 70s`) |
| Transform nach 2,5 s verändert? | **nein** |
| Breite der Spur / des Rahmens | 5367 px / 1230 px |
| Anker im Band / davon im sichtbaren Rahmen | 12 / **3** |

Der entscheidende Punkt: **`redBew` war schon ohne meine Emulation `true`.** Auf diesem Rechner
ist die Windows-Einstellung „Animationen anzeigen" aus. Das Laufband ist hier also im echten
Betrieb ein totes, abgeschnittenes Band — nicht in einem konstruierten Sonderfall.

`renderTicker()` (renderer.js:861–873) verdoppelt den Inhalt für die nahtlose Schleife; die
12 Anker sind 6 Schlagzeilen × 2. Sichtbar bleiben davon knapp 3.

Der Kommentar in renderer.js:857–860 sagt, das Band „respektiert prefers-reduced-motion (ebenfalls
CSS)". Die Absicht ist richtig — die Umsetzung schaltet die Bewegung ab, ohne den Inhalt anders
erreichbar zu machen. Auch das `title`-Versprechen in index.html:782 („unter dem Mauszeiger hält
es an") läuft für diese Nutzer ins Leere.

**Warum B und nicht A:** dieselben Schlagzeilen stehen zusätzlich im News-Kasten `#news`
(index.html:811), gespeist aus demselben `NEWS`-Array. Inhalt geht also nicht verloren — das
Laufband selbst ist wirkungslos und seine eigenen Links sind unerreichbar.

**Grenze dieser Messung, ehrlich gesagt:** weil die Einstellung auf diesem Rechner ohnehin aktiv
ist, konnte ich den Gegenfall (Bewegung erlaubt) hier **nicht** messen. Dass das Band mit erlaubter
Bewegung läuft, folgt aus dem CSS, ist aber von mir nicht beobachtet.

Beleg: `bilder/laufband-steht-still-1280.png`, `gegenprobe-laufband.json`.

## C-Liste (kein Issue)

1. **Trendfinder, Tabelle, 1000×700** — das kleine Aufklapp-Dreieck hinter dem Wert bricht
   uneinheitlich um: bei `ASML` rutscht es in die zweite Zeile, bei `TSM` bleibt es inline,
   bei `META` fehlt es. Unglücklicher Umbruch, kein Funktionsfehler.
2. **Regeln → Schalter & Einstellungen, 1000×700** — die Beschriftung „MAX. OFFENE POSITIONEN"
   bricht zweizeilig um, die beiden Nachbarn nicht; das Auswahlfeld darunter sitzt dadurch
   tiefer als seine Reihe. Nur Ausrichtung.
3. **Heute → Radar & Insider** — im Text zu `WBD` steht „Vergleichsgespräche **ueber** die
   Paramount-Skydance-Übernahme". Umschrift statt Umlaut. Das ist **Radar-Daten**, nicht Markup
   (`spekulationen.json`) — gehört genau genommen der Radar-Task, nicht der Oberfläche.

## Falschmeldungen, die die Probe erzeugt hat (für den nächsten Lauf)

Damit die nächste Nacht sie nicht erneut untersucht:

- **9 × „Schaltfläche außerhalb des Fensters"** — die Anker in `#newsTicker .tickSpur`.
  Bei laufendem Band ist das der Normalzustand eines Laufbands. Die Prüfung darf `#newsTicker`
  nicht mehr als normalen Container behandeln. (Dass daraus trotzdem B-1 wurde, lag an der
  Gegenprobe, nicht an dieser Regel.)
- **3 × „unfertiger Wert"** — alle drei sind deutscher Fließtext bzw. eine bewusste Code-Vorschau
  mit dem Wort *null*: `index.html:1246` „bei null herauskommt", Regelbuch „Einmalig auf null
  gesetzt", `#stCodeVorschau` (gezeigter Quelltext). Das Muster braucht eine Ausnahme für
  `pre`/`code` und darf `null` nicht als ganzes Wort in Prosa treffen.

## Was gemessen wurde und nichts fand

Über alle 5 Reiter und 16 Pillen, in 1280×800 und 1000×700:

- waagerechter Überlauf (Dokument und je Karte): **0**
- Inhalt, der aus seiner Karte läuft: **0**
- überlappende Geschwister-Bedienelemente: **0**
- Schaltflächen mit Größe 0: **0**
- **Barrierefreiheit — sichtbare `button`/`a`/`[role=button]` ohne zugänglichen Namen: 0.**
  Diese Null ist belastbar: dieselbe Auswahl und derselbe Sichtbarkeitsfilter haben im selben
  Lauf 9 andere Treffer geliefert, die Schleife lief also. Statische Gegenprobe: kein leeres
  `<button>` im Markup, 34 `aria-label` auf 108 Knöpfe.
- leere Karten ohne Leerzustandstext: **0** — die Leerzustände sind durchweg gut
  („Noch keine Trades …", „Noch keine Stammdaten. …", „Die Kurve entsteht, sobald …").
- unbehandelte Fehler / `console.error`: **0 / 0**
- Zahl- und Datumsformate: durchgehend deutsch (`7.677,28`, `+0,32 %`, `26.08.26, 01:13 Uhr`).
- Farblogik: geprüft an VIX (−2,52 % rot) und Bitcoin (−0,06 % rot) gegen S&P 500 (+0,32 % grün) — richtig herum.
- Mojibake: keins im Markup gefunden.

## Bewusst nicht geprüft

- Alle Bedienelemente der Sperrliste (`#kostenRundeBtn`, `#depotResetBtn`, `#pilotOn`, `#pilotBtn`,
  `#stratEmpfohlenBtn`, `#btRunBtn`, `#quelleTestBtn`, `#aiBtn`, `#setUpdInstallBtn` und alles,
  was kauft, verkauft, zurücksetzt oder festschreibt) — nicht angefasst, weder von Hand noch aus
  einem Skript.
- Alles, was Netz oder Zugangsdaten braucht: leere Karten und fehlende Kurse im isolierten,
  netzlosen Profil sind erwartet und kein Fund.
- Die Einwilligungsfrage „Diagnosedaten teilen?" wurde **nicht beantwortet**. Sie lag beim
  Erststart über der halben Fläche; weggeklickt wurde sie mit einem echten Escape-Tastendruck.
  `diagnose.js` hält ausdrücklich fest, dass das erlaubt ist und weiterhin „es wird nichts
  gesendet" bedeutet. Kein Klick auf „Ja" oder „Nein".
- Tastaturreihenfolge und Kontrastwerte — gehören zum Rotationspunkt Barrierefreiheit,
  heute nur die zugänglichen Namen.

## Nächster Rotationspunkt

Heute lief die volle Grundprüfung über alle fünf Reiter, mit dem tiefsten Blick auf **dashboard**.
Als Nächstes ist **depot** dran.

## Dateien

- `probe.js` — vertiefte Probe (7 Messungen, 26 Bildschirmfotos, zwei Fenstergrößen)
- `probe-reduzierte-bewegung.js` — Gegenprobe zum Laufband
- `rohbefund-probe.json`, `gegenprobe-laufband.json` — Rohausgaben
- `bilder/laufband-steht-still-1280.png` — Beleg zu B-1

Die übrigen 25 Bildschirmfotos bleiben im Temp und verschwinden — nur Belege zu Funden kommen
ins Repo.

---

## Nachtrag am Ende des Laufs (HEAD war inzwischen a2cd1be)

Während dieses Laufs haben andere Sitzungen weitergearbeitet. Zwei Dinge dazu, damit die
Lage nicht falsch in Erinnerung bleibt:

1. **Die 6 roten Tests sind erledigt.** Die offene Arbeit ist als **79a505b** („#83/#89: Meine
   Papiere ganz nach Vermoegen, Signalstand zieht mit") gelandet; die sechs Sperrklinken sind
   damit grün. Meine Einordnung „fremde unfertige Arbeit, kein Fund" hat sich bestätigt.
2. **Dafür ist jetzt ein anderer Test rot:** *„Auch die Entdeckungshälfte bekommt einen
   geprüften Nullpunkt"* (test-v6.js:7514). Er liest `studien/messmaschine/messmaschine.js` —
   und genau diese Datei ist im Arbeitsbaum offen (fremde Arbeit an #86/#87/#88, Tafel b859ed1).
   **Wieder rot bei schmutzigem Baum → notiert, nicht gemeldet.**

**`ZULETZT.txt` steht bewusst auf `a502c99`, nicht auf dem neueren HEAD.** Geprüft habe ich
a502c99. Der nächste Lauf nimmt damit 79a505b und die drei Tafel-Commits in seine Änderungsmenge
auf — die fertige Fassung von „Meine Papiere" unter Vermögen habe ich **nicht** gesehen, nur die
halbfertige. Sie gehört in die nächste Nacht.
