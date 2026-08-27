# Auftrag für den nächsten Auditor-Nachtlauf

*Angelegt 27.08.2026, 18:20, vom Auditor für sich selbst. **Lies das vor dem Rotationsblock.***
*Grund: Wilhelms Auftrag vom 27.08. lebt sonst nur in einem Chat, und ein Chat kann zu sein.
Dieselbe Lehre wie bei den Übergabe-Dateien — die Datei trägt immer, die Nachricht ist die Abkürzung.*

---

## 0. Der eine Satz, der alles umdreht

Wilhelm wurde gefragt, was er im Reiter *Regeln* regelmäßig tut. Seine Antwort:

> ### „Nachsehen was passiert ist."

**Regelbuch, Chart, Autopilot-Auswertung — also LESEN, nicht STELLEN.**
Nicht: Strategien an- und ausschalten. Nicht: Einstellungen feinjustieren. Nicht: Mittelfrist.

Dazu, mit den Zahlen aus `2026-08-27/INVENTAR-REGELN.md`:

| | Bedienelemente | nutzt Wilhelm? |
|---|---:|---|
| Schalter & Einstellungen | 31 (+13 versteckt) | **nein** |
| Mittelfrist | 16 | **nein** |
| Regelbuch · Chart · Autopilot | 6 + 7 + 13 | **ja — das ist sein Reiter** |

> **Die Seite ist als Steuerstand gebaut. Er benutzt sie als Bericht.**
> Der größte Unterreiter ist der, den er am wenigsten braucht; das Regelbuch — seine
> Textwand mit 4.045 Zeichen — ist der, den er tatsächlich liest.

**Wilhelms Richtung: „UMBAUEN UND AUSDÜNNEN."** Struktur neu schneiden *und* Inhalte
streichen. **Aber: die Streichliste macht Wilhelm.** Wir liefern die Grundlage, er
entscheidet. Nichts verschwindet ungefragt.

## 1. Reihenfolge des Nachtlaufs (vom PM gesetzt)

**Platz 1 — Frage 5: steuert etwas Widerlegtes?**
Jeder der 83 Schalter gegen den Messstand halten. **Belegstand 0 von 12.** Wenn Wilhelm
die Schalter ohnehin kaum benutzt, ist jeder Schalter für eine widerlegte Sache *doppelt*
überflüssig — er kostet Übersicht, ohne je gebraucht zu werden. Hier stand schon einmal
ein Knopf für etwas, das es nicht mehr gab.
*Gutes Vorbild in der App selbst:* `#hourlyEnabled` liegt hinter einer Klappe namens
„Archiv: gemessen und widerlegt". So kann Aufräumen aussehen.

**Platz 2 — die drei LESE-Bereiche in Wilhelms Sprache.**
Regelbuch, Chart, Autopilot: *Was steht da? Was davon ist verständlich? Was ist
Wiederholung? Was fehlt?* Beim Regelbuch (4.045 Zeichen, zwei Karten mit 2.823 und 1.941)
ist die Frage **nicht** „welcher Knopf", sondern: **sagt der Text, was Wilhelm wissen will
— oder erklärt er sich selbst?**

**Platz 3 — wovon die fünf bedingt eingeblendeten Einstellungen abhängen.**
`#idExit`, `#idTrend`, `#idTrail`, `#idMtf`, `#idChannel` hängen an einem `<label>` auf
`display:none`. **Messen, nicht vermuten** — der erste Anlauf hat hier schon einmal
danebengelegen (siehe 3.1 im Inventar).

**Platz 4 — Ort und Doppelungen, zusammen mit `06`.**
„Derselbe Wert unter zwei Namen" verlangt den Vergleich der **Speicherschlüssel**; die
stehen im Code, nicht auf dem Schirm. Meine Prüfung auf gleiche *Beschriftung* war zu eng
und hat deshalb **keine** Null gemeldet, sondern die Frage offen gelassen.

**Platz 1b — Markierungsspalte: welcher Knopf braucht gar keinen Knopf?**
*Wilhelms Zusatzfrage vom 27.08. abends, über den PM:*

> *„die Messungen in der App wie z. B. die Kostenrunde sollten auch **automatisch im
> Hintergrund** passieren. Dafür braucht es keinen Button, wenn sie nicht mehr gebraucht
> wird kann das ja auch stoppen. Aber erst dann, **das gilt auch für die anderen ähnlichen
> Buttons**"*

Beim Durchgehen der 83 **mitlaufend** markieren — keine eigene Untersuchung:

**Erkennungszeichen für „könnte von selbst laufen":**
- startet etwas und **wartet auf ein Ergebnis** (statt sofort etwas zu schalten),
- das Ergebnis wäre **morgen noch richtig** (hängt nicht daran, dass jetzt jemand hinsieht),
- muss **wiederholt** gedrückt werden, um zu nützen → dann ist Klicken der Engpass.

**⚠ Und die Gegenrichtung ausdrücklich mit benennen: welche dürfen NIEMALS von selbst
laufen?** Alles, was **echtes Geld oder echte Orders** bewegt, und alles, wo **Wilhelms
Urteil** der Punkt ist. *Die Kostenrunde setzt echte Demo-Orders ab — sie ist der
Grenzfall, den er bewusst entschieden hat. Andere könnten jenseits der Grenze liegen, und
die will der PM benannt haben, **bevor** jemand sie automatisiert.*

**Erster Schnitt vom 27.08. 18:35 — zwei Fälle sind schon VERIFIZIERT, nicht vermutet:**

| Knopf | Befund | Beleg |
|---|---|---|
| `#mfdTaktBtn` „Jetzt prüfen" | **läuft längst von selbst** — `takt()` alle **30 Minuten**, dazu 12 s nach dem Start | `mfdepot.js:313–314` |
| `#pilotBtn` „jetzt messen (10–20 Min)" | **läuft längst von selbst** — der Autopilot misst jede Nacht nach US-Schluss; die Karte sagt es selbst | Kartentext *Autopilot* |

**Das ist genau Wilhelms Muster, zweimal belegt: der Knopf ist der Handauslöser für etwas,
das ohnehin läuft.**

*Kandidaten (aus dem Namen gelesen, **nicht** verifiziert — im Nachtlauf einzeln prüfen):*
`#screenBtn` · `#runJobBtn` · `#mfLadenBtn` · `#drLadeBtn` · `#drLadeAlleBtn` ·
`#drRechneBtn` · `#massenBtn` · `#massen1mBtn` · `#regimeBtn` · `#filterBtn` ·
`#retroBtn` · `#weeklyBtn` · `#reportShowBtn`

*⚠ Vorläufige NIEMALS-Liste (Sicherheitsrichtung, im Zweifel drin lassen):*
`#kostenRundeBtn` *(echte Demo-Order — Wilhelms bewusster Grenzfall, vergeben)* ·
`#mfdRebalanceBtn` · `#mfdDriftBtn` *(schichten Buchpositionen um)* ·
`#stratEmpfohlenBtn` *(stellt die ganze Konfiguration um)* ·
`#regelNeuBtn` *(schreibt eine Regel fest)* · die vier Strategie-Schalter und
„Ausbruch"/„Umkehr" *(Wilhelms Urteil ist der Punkt)* · `#btRunBtn` *(langer Lauf)*.

*Nicht automatisierbar, weil es gar kein Auftrag ist:* `#stcBtn` „Chart laden" *(zeigt,
was gerade gewählt ist)* · `#exportDataBtn` · `#massenStopBtn` *(Halteknopf muss bleiben)*.

*Nebenbei zu prüfen:* `#massenBtn`/`#massen1mBtn` **überschneiden sich mit der neuen
Kursarchiv-Karte** (`sammelplan.js`), die seit `v8.34.0` von selbst sammelt. **Zwei Wege
für dieselbe Arbeit** — das ist zugleich Wilhelms Doppelungs-Frage.

**Daneben, unverändert:** Rotationsblock **`werkzeuge`** und der Barrierefreiheits-Rest
(Kontrast mit repariertem Prüfer, Vorlesereihenfolge, Überschriftenhierarchie, `aria-live`,
**Tastaturfallen in den Dialogen** — letztere ungeprüft, weil die eigenen Proben den
Einwilligungsdialog routiniert mit Escape wegklicken).

## 2. Was schon steht — nicht noch einmal machen

- **Umfang gemessen:** 83 Bedienelemente, 22 Karten, ~15.900 Zeichen.
- **Kein toter Schalter** (25 von 25 verdrahtet) — **mit Vorbehalt**: Textsuche sieht
  Delegation nicht und sagt über „Handler tut nichts mehr" gar nichts. Anfangsverdacht,
  kein Freispruch. Gegenprobe gehört `06`.
- **Die 13 Unsichtbaren sind aufgeklärt** (3.1): `#idMode` und fünf weitere hinter
  `<details id="idExperte">` „Experten-Einstellungen"; fünf bedingt über `display:none`;
  `#idEnabled` ist Bauweise; `#pilotOn`/`#aoRegime` waren mein Messfehler.
- **Strategiekarten der Übersicht haben keine Überschrift** — Name steht in einem `<span>`.

## 3. Werkzeuge, die bereitliegen

| Datei (in `studien/auditor/2026-08-27/`) | wofür |
|---|---|
| `probe-inventar-regeln.js` | Aufnahme aller Bedienelemente und Karten je Unterreiter |
| `inventar-abgleich.js` | Kennungen gegen die Quelltexte, mit Selbstprüfung |
| `probe-13-unsichtbare.js` | warum ein Element nicht sichtbar ist (Vorfahren, Bauweise) |
| `probe-tastatur.js` | Tastaturreihenfolge, **drei Köder** — ⚠ braucht die Reparatur aus 4. |
| `probe-109-gegenprobe.js` | Fokussierbarkeit statt Rechteck |

## 4. Zwei Reparaturen an den eigenen Werkzeugen — vor dem nächsten Lauf

1. **`probe-tastatur.js`:** Sichtbarkeit am Rechteck reicht **nicht**. Ein zugeklapptes
   `<details>` lässt das Rechteck gefüllt, der Browser verweigert den Fokus trotzdem —
   genau daran ist **#109 als Falschbefund** entstanden. **Kriterium ist
   `document.activeElement`.**
2. **Geometrie und Fokus getrennt erheben.** `el.focus()` **scrollt**; jedes danach
   gemessene `getBoundingClientRect()` steht auf einer anderen Scrollposition. Erst alle
   Rechtecke in Dokumentkoordinaten (`rect + scrollY`), **dann** die Fokuskette.
3. **Und die Reparatur braucht eine Positivkontrolle:** ein Knopf, der *wirklich* falsch
   steht — sonst wird der geschärfte Prüfer grün, **weil er gar nichts mehr findet.**

## 5. Die Hausregeln, die dieser Tag gekostet hat

- **Drei Köder, nicht einer** — eine Sorte Köder findet nur eine Sorte Blindheit.
  (K1 fest positioniert, K2 visuell vorgezogen, K3 positiver `tabindex`.)
- **Auspacken nur nach `%TEMP%`.** `asar extract-file` schreibt ins *Arbeitsverzeichnis*;
  im geteilten Repo löscht ein nachfolgendes `mv` Kerndateien.
- **Ein Nullbefund ohne Positivkontrolle ist kein Befund** — und die Regel greift **in
  beide Richtungen**: am 27.08. gab es vier Nullbefunde *und zwei Falschbefunde*, einer
  davon (#109) war schon als Issue draußen und zugeteilt.
- **Nie melden, was man nicht nachgesehen hat.** Die Textsuche meldete 23 tote Schalter,
  dann 3; von Hand nachgesehen waren **alle drei verdrahtet**. Gemeldet wurde null.
