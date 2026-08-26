# Auditor — Nacht auf den 27.08.2026

**Geprüfte Spanne:** `d964891..04c9be5` (117 Commits).
**Baum beim Lauf:** schmutzig — fremde, unfertige Arbeit an `tools/massive-tagesdaten.js`, später `kerzenquelle.js`; dazu ein fremder Studienordner. **Keine** davon ist eine Oberflächen-Datei, kein Fund dieser Nacht ist deshalb vorläufig.
**HEAD wanderte während des Laufs** von `04c9be5` auf `04b0f0d` (6 fremde Commits). Nachgeprüft: in diesen sechs Commits ist **keine Oberflächen-Datei** angefasst — die Messungen gelten auch für `04b0f0d`.

**Ergebnis:** `npm test` **grün**. `tools/ui-probe.js` **grün** (5 Reiter, 17 Pillen, Exit 0). Eigene vertiefte Probe: **0 Seitenfehler, 0 Konsolenfehler**.
**Funde: 1 A, 3 B, 5 C.** Issues #105, #106, #107, #108.

---

## 1. Was neu war und woraus der Schwerpunkt folgte

Oberflächen-Dateien in der Änderungsmenge: `index.html` (+19), `scoreboard.js` (+244), `archivkarte.js` (**neu**, 199), `depot.js` (113), `explorer.js` (30), `quant.js` (+34), `strategien.js` (14), `strategiechart.js` (5), `app-shell.js`, `kurse.js`.

Daraus vier Schwerpunkte:

| | Fläche | Warum |
|---|---|---|
| A | *Messung → Scoreboard* | zwei neue Spalten (Feinheit/delta80, Aussicht), dreigeteilte Tabelle, Auflösungswand an der **Live**-Kostenhürde; `label()` → `U.urteilText` (#102) |
| B | *Werkzeuge → Kursarchiv* | vollständig neue Pille und neue Datei; lädt erst auf `sub-changed` |
| C | Perzentil statt Roh-Güte (#80) | `explorer.js`, `strategiechart.js`, neue Funktion in `quant.js` |
| D | **Rotation: Reiter *Regeln*** (`strategien`) | turnusgemäß dran |

## 2. Wie geprüft wurde

Drei eigene Proben, alle in einem **frischen, isolierten Profil** unter `%TEMP%` (`app.setPath` für `userData` und `downloads`, `loadFile`-Patch auf die Repo-Wurzel). Der Speicher, der Datenordner und die Installation des Anwenders wurden **nicht angefasst**.

- `probe.js` — Rundgang über alle 5 Reiter und 17 Pillen in **zwei Fenstergrößen** (1280×800, 1000×700), neun automatische Messungen je Fläche, 43 Bildschirmfotos, dazu die vier Schwerpunkt-Messungen. **Mit gesätem Datenordner** (38 Messprotokolle aus dem Repo kopiert) — ohne sie ist der Kern dieser Änderungsmenge nur ein Leerzustand.
- `probe-huerde.js` — stellt das Produkt im **Testprofil** von `basis` auf `schein` um und misst, welche der vier Stellen, die „Kostenhürde" sagen, mitwandern.
- `probe-perzentil.js` — Nachtrag, siehe Abschnitt 6.

**Nicht geklickt** wurde alles aus der Sperrliste. Ausdrücklich dazu gezählt: der neue Knopf **„Jetzt holen"** der Kursarchiv-Karte — er startet einen echten Sammellauf gegen Yahoo. Er wurde gelesen, nicht gedrückt.

---

## 3. A-Fund

### A1 — Das Messband rechnet mit einer festen Kostenhürde, während das Scoreboard live rechnet · **#105**

`messband.js:27` trägt `var HUERDE_PP = 0.10`. Seit `6c790c8` benutzt das Scoreboard für dieselbe Größe `DepotAPI.kostenHuerde()`. In der Voreinstellung ergeben beide **zufällig** 0,100 Pp — der Widerspruch ist dort unsichtbar.

Gemessen mit umgestelltem Produkt:

| | `instrument = basis` | `instrument = schein` |
|---|---|---|
| `DepotAPI.kostenHuerde().pp` | **0,100** (Aktie 1x) | **0,0665** (Ruhig BV 1,0, Hebel 9,77) |
| Scoreboard, Satz an der Wand | „ab **0,183 Pp**" | „ab **0,077 Pp**" ✔ folgt |
| Scoreboard, Einsortierung | `rsi2seit-mcp` **vor** der Wand | `rsi2seit-mcp` **hinter** der Wand ✔ folgt |
| Messband | „Kostenhürde 0.10 Pp → netto -0.079 Pp" | **unverändert** ✖ |

Die Kopfzeile derselben Seite weiß zu diesem Zeitpunkt schon „Gehandelt wird der Hebelschein". Mit dem Schein wäre netto **−0,045 Pp**, angezeigt werden **−0,079 Pp**.

**Nebenbei bestätigt:** Wilhelms Auflage zur Wand („Ändern Sie das Produkt oder die Haltedauer, verschiebt sich diese Grenze") trägt — das Scoreboard folgt der Einstellung nachweislich, Satz **und** Einsortierung.

**Herkunft:** `messband.js` liegt außerhalb der Änderungsmenge. Der **Widerspruch** ist trotzdem neu — er entsteht erst dadurch, dass das Scoreboard seit `6c790c8` live rechnet.

---

## 4. B-Funde

### B1 — Roher Urteils-Schlüssel auf zwei weiteren Flächen · **#106**

`nicht-entscheidbar` / `nicht-bestaetigt` stehen unübersetzt in
- *Regeln → **Übersicht*** (`strategien.js:260`, `U.esc(pk.urteil)`)
- *Vermögen → Depot*, Messband (`messband.js:143` und `:159`, `esc(k.urteil)`)

Dieselbe Zahl aus demselben Protokoll wird in der App **vierfach verschieden** geschrieben, zwei davon in **benachbarten Pillen desselben Reiters**:

| Fläche | Urteil | Zahl |
|---|---|---|
| Regeln → Schalter & Einstellungen | nicht entscheidbar ✔ | +0,021 Pp ✔ |
| Regeln → Regelbuch | nicht entscheidbar ✔ | +0,021 Pp ✔ |
| **Regeln → Übersicht** | nicht-entscheidbar ✖ | +0,021 Pp ✔ |
| **Vermögen → Depot** | nicht-entscheidbar ✖ | +0.021 Pp ✖ |

Auf der Übersichtskarte steht der rohe Schlüssel drei Zeilen unter der Pille „gemessen – gegen Kontrolle **nicht entscheidbar**", die es richtig schreibt. Das ist die nicht mitreparierte Hälfte von #102; `U.urteilText()` (`app-shell.js:36`) liegt bereit.

### B2 — Zahlenspalten linksbündig unter rechtsbündigen Köpfen · **#107**

Zwei Klassen ohne Wirkung:
- `class="num"` (`scoreboard.js`, 14×) hat im **ganzen Repo keine CSS-Regel**. Gemessen: Zellen `text-align: start`, Köpfe inline `right`.
- `class="zahl"` (`archivkarte.js`, 4×) hat eine Regel, die aber auf `#bestandTabelle` eingeschränkt ist (`index.html:600/601`) und hier nicht greift. Gemessen: `left`/`start`.

Betroffen sind sieben Spalten des Scoreboards und zwei der Kursarchiv-Karte. Am stärksten bei den **neuen** Spalten: bei 1000 px endet der Kopf „AUSSICHT / SIGNALTAGE BIS / ENTSCHEIDBAR" rund 90 px rechts von seinen Werten und sieht aus, als gehöre er zur Spalte daneben.
Kein Neuschaden für das Scoreboard (die Klasse war nie definiert), aber sichtbar verschärft; für die Kursarchiv-Karte neu.

### B3 — Englische Dezimalschreibweise · **#108**

- Messband: **sechs** Zahlen in einer Karte (`+0.021 Pp`, `0.10 Pp`, `-0.079 Pp`, `+0.218 Pp`, `0.1310`, `+0.0072 Pp`), dazu ein Bindestrich-Minus statt eines Minuszeichens. Ursache `messband.js:41` (`toFixed`) und zwei `HUERDE_PP.toFixed(2)`. Die Kacheln unmittelbar darunter stehen richtig (`100.000,00 $`).
- Kursarchiv-Karte: `1.2 s Abstand je Anfrage`. Die Autopilot-Karte schreibt dieselbe Art Zahl richtig („0,3 s Pause").

Dieselbe Substanz wie #94, das angenommen und repariert wurde.

---

## 5. C-Liste (kein Issue)

1. **Kursarchiv, Einheit nur einmal:** „1 Minute alle 1 Tag(e) · 5 Minuten alle 7 · 15 Minuten alle 7" — bei den letzten beiden fehlt die Einheit.
2. **Drei gleichnamige Knöpfe „Jetzt holen"** in der Kursarchiv-Karte ohne unterscheidbaren zugänglichen Namen. Die Auflösung steckt in `data-iv`, nicht in einem `aria-label`. (Material für den offenen Barrierefreiheits-Block.)
3. **Zwei Karten heißen „Kursarchiv"** und meinen verschiedene Ablagen: *Werkzeuge → Kursarchiv* (Yahoo, 1m/5m/15m) und *Regeln → Autopilot* („Kursarchiv (Ziel für volle Belastbarkeit: 60 Handelstage)" / „Kursarchiv auffüllen (Capital.com)").
4. **Scoreboard-Fußnote gegen Wand-Satz:** die Fußnote nennt als Vergleichsmaß „Aktie **0,04**", elf Zeilen darüber weist die Wand für „Aktie 1x" **0,100 Pp** aus. Beides ist erklärbar (gemessener Marktwert gegen Rechnung mit Einsatz und Gebühr) — die Anzeige sagt es nicht dazu.
5. **`quant.js`, `gueteZufallsAnteil(null, n)` gibt `0` statt `null`** (`isFinite(null) === true`). Über die Oberfläche derzeit nicht erreichbar — Beobachtung für den Analytiker, kein Oberflächenfund.

---

## 6. Was geprüft wurde und **in Ordnung** war

- **Scoreboard-Struktur:** 10 Spalten in Kopf **und** jeder Zeile, keine abweichende Zeile, keine Rollbalken bei 1280 **und** 1000 px. Die Detailtabelle („Alle Varianten") ebenfalls konsistent.
- **Beide Trennzeilen erscheinen** und tragen die richtigen Zahlen; die kleinste Feinheit hinter der Wand (0,183 Pp) stimmt mit den Zeilen darunter überein.
- **Die „–"-Zellen tragen ihren Grund als Titel** — beide Fälle unterschieden (kein positiver Punktschätzer / Urteil „nicht messbar", Maschinenlücke).
- **Kursarchiv-Karte** kommt sauber aus dem Ladetext heraus (`sub-changed` greift), zeigt einen **erklärten** Leerzustand („Kein Punkt-in-Zeit-Universum im Datenordner …") statt einer stummen leeren Karte, und markiert das ausdrücklich als „geht nicht", nicht als „auf Stand" — genau das, wogegen die Karte gebaut ist.
- **Regelkopf (#103):** Zeilenköpfe stehen in normaler Schreibung und Zellengröße, unter der letzten Zeile kein Reststrich mehr. Hält.
- **#80, Positivkontrolle:** `Quant.gueteZufallsAnteil` existiert, liefert über alle 8 Fensterklassen × 101 Güten **nur** Werte in 0..100, ist **monoton** in der Roh-Güte, und gibt bei untauglichem `n` `null` zurück. 0 Ausreißer, 0 Monotonieverstöße.
- **0 unbehandelte Seitenfehler, 0 Konsolenfehler** über 44 Flächenbesuche.

**Nullbefund-Korrektur, eigene:** Die Hauptprobe meldete für #80 zuerst „fehlt". Das war **mein** Fehler, kein Fund — sie fragte nach `window.Q`, veröffentlicht ist aber `window.Quant` (`Q` ist nur ein Modul-Alias, `explorer.js:5`). Ein Nullbefund ohne Positivkontrolle hätte hier beinahe eine fehlende Funktion behauptet, die es längst gibt. Nachgeprüft mit `probe-perzentil.js`.

---

## 7. Was bewusst **nicht** geprüft wurde

- Alles hinter der Sperrliste: `#kostenRundeBtn`, `#depotResetBtn`, `#pilotOn`/`#pilotBtn`, `#stratEmpfohlenBtn`, `#btRunBtn`, `#quelleTestBtn`, `#aiBtn`, `#setUpdInstallBtn` — und neu dazu die drei **„Jetzt holen"** der Kursarchiv-Karte sowie „Chart laden" und „Kursarchiv auffüllen".
- Netzabhängige Inhalte: Explorer-Chart, Schein-Finder, Trendfinder, Radar & Insider. Das isolierte Profil hat keinen Zugang; leere Karten dort sind **erwartet** und kein Fund.
- Das **dunkle Thema** — nur hell geprüft.
- **Barrierefreiheit vollständig** (Tastaturreihenfolge, Kontrast) — eigener Rotationspunkt, noch offen.

**Nächster Rotationspunkt: `werkzeuge`.**

---

## 8. Dateien dieses Laufs

| Datei | Inhalt |
|---|---|
| `probe.js` | Rundgang + Schwerpunkte A–D, 2 Fenstergrößen |
| `probe-huerde.js` | Produktwechsel im Testprofil, vier „Kostenhürde"-Stellen im Vergleich |
| `probe-perzentil.js` | Nachtrag #80 mit Positivkontrolle |
| `rohbefund-probe.json` | alle Rohmessungen des Rundgangs |
| `rohbefund-huerde.json` | vorher/nachher der Hürdenmessung |
| `rohbefund-perzentil.json` | 808 Aufrufe von `gueteZufallsAnteil` |
| `bilder/` | 5 Bildschirmfotos, je eines zu einem Fund (von 43 erzeugten) |
