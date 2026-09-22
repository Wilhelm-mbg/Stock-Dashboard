# Auftragsvorlage: Feld-Agent der Mehrfaktor-Studie (Runde 1a) — `<FELD>`

*Vorlage des Werkzeug-Chats (Nr. 48 §4). Der PM füllt die spitzen Klammern aus `VORREGISTRIERUNG-KOMBINATION.md` §4 und startet je
Feld einen Agenten. Ein Zweitleser liest die Vorlage einmal, nicht neunmal.*

**Rolle:** Feld-Agent (baut **eine** Faktorzelle und prüft ihren Nullpunkt; **findet keine Kante**). **Repo:**
`C:/Users/Wilhe/Downloads/Stock-Dashboard`. **Ordner:** `studien/mehrfaktor-2026-09-22/felder/<feld>/` (neu, nur dieser).
**Budget:** 120k. **Übergabe:** `C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/uebergabe/mehrfaktor-feld-<feld>-<datum>.md`.
**Maschine:** `studien/mehrfaktor-2026-09-22/zelle.js` (Kennung `mehrfaktor-2026-09-22/zelle/v1`) — **benutzen, nicht ändern**.

## 0. Regeln

- Zuerst lesen: `CLAUDE.md`; `VORREGISTRIERUNG-KOMBINATION.md` §2 und §4 (deine Feldzeile ist bindend); Kopf von `zelle.js`
  (Beispielaufruf, Rang- und Haltekonvention); `wiki/mehrfaktor-felder.md` §0–§3; `wiki/fehlerformen.md` „Messwerkzeug-Fallen",
  „Nullbefund vom toten Werkzeug", „Geteilter Kurs"; für Bilanzfelder `studien/fundamental-machbarkeit-2026-09-16/FUNDAMENTALTAFEL.md`
  §1 (Felder `roh`, `quartale` D0…D7, `summe4q`, `abgeleitet`, `marken`) und den Kopf von `fundamental-lesen.js`.
- Node **v24.18.0**, Läufe am PC (Panel liegt auf C:), nicht auf dem Server. Kein Push, keine Version; Commits nur mit Pfadangabe in
  einem Befehl (`git add <neu> && git commit -m "…" -- <eigene Dateien>`), nie `git add -A`; Trailer
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; nur der eigene Ordner + die drei Zellendateien + Übergabe; `wiki/`,
  `CLAUDE.md`, `.claude/skills/`, `zelle.js`, `test.js`, andere Felder nicht anfassen. Deutsche Ausgabe; Patch-Skripte über das
  Write-Werkzeug. Simulation mit virtuellem Kapital, keine Anlageberatung.
- **Die Formel steht in §4 der Vorregistrierung.** Du setzt sie um; du wählst nicht, du stimmst nicht ab, du vergleichst nicht mit
  anderen Fenstern. Eine Formel, die sich an der Tafel nicht bauen lässt, ist ein **Befund für den PM**, kein Anlass zur Abwandlung.

## 1. Das Feld

| | |
|---|---|
| Feld (Zellenname) | `<feld>` (a–z, 0–9, Bindestrich) — Nr. `<nr>` der Feldseite |
| Rolle in der Kombination | `<Signal / Kontrollgröße / Kostenfrage>` |
| Rohgröße je Symbol am Signaltag t | `<Formel aus §4, mit Richtung: höher = besser; „gedreht" = Vorzeichen −>` |
| Einheit | `<Pp / Verhältnis / ln>` |
| Datenquelle | `<Panel über sicht / Fundamentaltafel über sicht.fundamentalAm / beides>` |
| Wert fehlt | **`null`** — nie 0, nie ein Ersatzwert; die Maschine füllt mit dem mittleren Rang auf und zählt es |
| Erwartete Abdeckung | `<aus §4; Bilanz ≈ 83 %, F&E ≈ 30–40 %>` |
| Literatur (L-S je Monat, Obergrenze) | `<aus §4>` |

**Erlaubte Zugriffe** (alles andere ist ein Leck; die Klinke der Maschine zählt und wirft):

- Kurse nur über `sicht`: `sicht.zeileAm(sym)` (Panelzeile am Signaltag, −1 = keine), `sicht.zurueck(zeile, k)` (k-te Zeile der Reihe
  davor), `sicht.felder.{bSchluss, bEroeffnung, rendite, renditeOC, rohSchluss, umsatz, klasse}` (Spalten des Panels, bereinigt außer
  `rohSchluss`), `sicht.zeile(symIdx, tag)` nur mit `tag ≤ sicht.tag`, `sicht.iso`, `sicht.symIdx(sym)`.
- Bilanz nur über `sicht.fundamentalAm(sym, tag)` mit `tag = sicht.iso` (jüngstes 10-K/10-Q mit `filed` **strikt vor** dem
  Signaltag, Aktualitäts-Tor 456 Tage; sonst `null`). Nie `require('fundamental-lesen.js')`, nie `alleFilings`, nie `period` als
  Signaldatum.
- Preisaussagen (Marktwert, Cent-Boden) mit `rohSchluss`, Renditen mit `bSchluss` (Fehlerform „Bereinigte Kurse messen den
  Cent-Boden falsch").
- Nichts aus der Zukunft, nichts aus `K.gruende()`, nichts aus anderen Zellen, nichts aus dem Rückhaltefenster.

## 2. Aufruf

Schreib `felder/<feld>/feld.js` nach dem Muster `pruefung/kunstfeld-zufall.js`:

```js
'use strict';
module.exports = {
  feld: '<feld>',
  definition: '<Formel als Text, mit Richtung und Einheit>',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {
    var z = sicht.zeileAm(sym); if (z < 0) return null;
    // ... Rohgröße aus sicht.felder / sicht.zurueck / sicht.fundamentalAm(sym, tag) ...
    return (typeof w === 'number' && isFinite(w)) ? w : null;
  },
};
```

Lauf (aus dem Studienordner; schreibt `zellen/<feld>.json`, `zellen/<feld>-nullpunkt.json`, `zellen/<feld>-bericht.md`):

```bash
cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/<feld>/feld.js
```

Erwartung: Tafel 1 s, Lauf 2–4 s, RSS ≈ 1,0–1,2 GB (Kunstfeld 22.09.). Ein Lauf über Minuten heißt: die Werte-Funktion rechnet je
Symbol über zu viele Zeilen (Fehlerform „Präfix-Aufruf ist quadratisch") — fenstern, nicht warten. **Ohne `--rueckhalte`** (die
Flagge setzt nur der PM nach dem Urteil; deine Zelle trägt `rueckhalte: false`, 92 Signaltage 2017-01-03 … 2024-08-01).

## 3. Abgabe

1. `felder/<feld>/feld.js` (die Werte-Funktion, kommentiert: welche Tafelfelder, welche Zeilen, welche Lücken).
2. `zellen/<feld>.json`, `zellen/<feld>-nullpunkt.json`, `zellen/<feld>-bericht.md` — **aus der Maschine, nicht von Hand**.
3. `felder/<feld>/ERGEBNIS.md` — kurz, Zahlen aus dem Bericht, nichts abgetippt, was die Maschine nicht schreibt.
4. Übergabe-Datei (Pfad oben) mit **Tokenverbrauch als Pflichtzeile**.
5. Commit nach dem Lauf: `git add felder/<feld>/ zellen/<feld>.json zellen/<feld>-nullpunkt.json zellen/<feld>-bericht.md && git commit -m "Mehrfaktor Feld <feld>: Zelle gebaut, Nullpunkt <bestanden/…>" -- <dieselben Pfade>`.

## 4. Pflichtangaben in `ERGEBNIS.md`

- **Abdeckung** je Klasse und Jahr (Tabelle aus dem Bericht) und die Gründe für Lücken (kein Filing, Tor, Feld nicht ausgewiesen,
  zu kurze Reihe).
- **Nullpunkt**: Orakel (Dezil − Universum, Long-Short, t, Schranke), Placebo Symbole, Zufall ×12 (Mittel, |t| ≥ 3-Fälle, se je
  Ziehung, MDE-Boden), Placebo Versatz (mit dem Hinweis der Maschine — bei trägen Feldern ≈ Einzelmessung), Klinke (Positivkontrolle
  Kurs/Bilanz, Leser-Zugriffe und Verstöße). **Fällt eine Kontrolle: melden, nicht reparieren, nicht nachlegen.**
- **Einzelmessung** als Diagnose: Dezil oben − Universum brutto/netto, se, t, t_HH, **MDE₈₀**, Umschlag, Kosten, Dezilgröße,
  Auffüllungen je Dezil, Jahresscheiben, letzte 250 Tage. Formulierung immer „nichts oberhalb von X Pp" bzw. „X Pp bei MDE₈₀ Y" —
  nie „belegt", nie „Kante", nie „da ist nichts". Die Zelle ist kein Urteil.
- **Umschlag × Hürde gegen Literatur ×½** (die Kostenfrage des Feldes, eine Zeile).
- **Fallstricke** der Tafel, die du gesehen hast (Neudarstellungen, Splits zwischen `filed` und t, Quartalswege `y`, Ausreißer).
- **Laufzeit, RSS, Tokenverbrauch.**

## 5. Verbote

- Kein Rang, kein Dezil, kein Universum, keine Haltefunktion, keine Statistik selbst bauen — **keine zweite Maschine**. Fehlt der
  Maschine etwas, ist das ein Befund an den PM (Übergabe), kein Anlass für eigenen Code.
- Keine Auswahl und kein Nachlegen: kein zweites Fenster, keine andere Skalierung, kein Winsorisieren, kein Ausschluss von
  Sektoren oder Klassen nach dem Blick auf die Zahlen. Nachrichtliche Varianten nur, wenn §4 sie nennt (`bewertung-ep`, `fue-marktwert`).
- Kein `--rueckhalte`, kein Blick auf Signaltage ab 2024-09-01, kein Lesen anderer Zellen, kein Lauf eines fremden Feldes „zum Vergleich".
- Keine Änderung an `zelle.js`, `test.js`, `konfig.js` des Prüfstands, an der Fundamentaltafel oder am Panel.
- Keine Sätze über Handelbarkeit oder eine Kante. Das Wort „belegt" gehört in kein Feldergebnis.

## 6. Sonderabsatz Gewinnüberraschung (`sue`, Nr. 8)

- Quartalsgewinne aus `quartale` (D0 = jüngstes Quartal des Filings, D4 = Vorjahresquartal, D0…D7 = acht Quartale); Wege mit
  Marke `y` (Jahr − YTD3) sind erlaubt, ihr Anteil wird berichtet. SUE = (netto D0 − netto D4) / sd(netto D0 … D7) — Nenner nach
  Entscheid §9 (5) der Vorregistrierung; `null` bei weniger als acht Quartalen, fehlendem D0/D4 oder sd = 0.
- **Signal ab `filed`, nicht ab `period`:** der Leser liefert nur Filings mit `filed` < Signaltag — das ist die Klinke; nimm nie
  `period` als Datum. 8-K-Vorabmeldungen liegen oft Wochen vor dem 10-Q: das Signal kommt konservativ **zu spät**, nie zu früh
  (§T4.9 Teil 4); das ist auszuweisen, nicht zu „reparieren".
- Placebo Versatz (+21 Tage) enthält bei SUE Filings aus der Halteperiode — er wird ≠ 0 sein; berichten, nicht deuten.

## 7. Sonderabsatz F&E-Intensität (`fue`, Nr. 10)

- `fue` (4Q-Summe) / `umsatz` (4Q-Summe); **nur Symbole, deren Filing F&E ausweist** — alle anderen `null`, nie 0 (Entscheid §9 (9)).
  Erwartete Abdeckung 30–40 % des Universums, je Klasse und Jahr verschieden (Technologie/Pharma) — **die Abdeckungstafel ist der
  halbe Bericht**: welche Klassen, welche Jahre, wie viele Symbole je Signaltag (Dezil = 10 % der Ausweiser, also ≈ 25 Mitglieder).
- Nachrichtlich zweite Zelle `fue-marktwert` = fue 4Q / Marktwert (Marktwert wie Feld 4: `aktien` × `rohSchluss`), nicht gewichtet.
- Umsatz 0 oder fehlend ⇒ `null`; F&E > Umsatz (Biotech) ist ein echter Wert, kein Fehler — Verteilung berichten (Quantile), nichts kappen.

## 8. Übergabe (Dreizeiler + Pflichtzeile)

Was gebaut, was der Nullpunkt sagt (fünf Kontrollen mit Zahl), was die Einzelmessung sagt (netto, MDE₈₀, Abdeckung), was der PM
entscheiden muss; Commit-Hash; **Verbrauch laut Abrechnung**. Höchstens 12 Zeilen im Chat, alles Weitere in der Datei.
