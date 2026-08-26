# Warteschlange des Strategie-Tüftlers

Entwürfe, die auf Messung durch die Mess-Kette warten. Der Tüftler trägt ein,
der Projekt-Manager verteilt, die Mess-Kette streicht nach der Messung.

**Offen: 2 Entwürfe, 0 Auftragsvorschläge** (beide Vorschläge sind am 26.08. 09:00 von
Wilhelm freigegeben und stehen jetzt auf der Tafel unter „Aufträge").
(Bei 3 oder mehr offenen Entwürfen arbeitet der Tüftler nachts am Datenbestand
statt zu entwerfen. Beim nächsten Lauf ist der Stand **2** — noch kein Stau, aber knapp.)

---

## Entwürfe — warten auf Messung

### 1. `glockendruck-nacht` — eingetragen 26.08.2026

**Status:** wartet auf Messung. Vorbedingung: `ausstieg`-Schalter (Tafel, freigegeben).
Zusätzlich gilt die beschlossene Sperre (erst die Neumessung der zwölf Strategien
auf dem versionierten Instrument).

**Vorregistrierung:** `studien/vorregistrierung-2026-08-26-glockendruck-nacht/VORREGISTRIERUNG.md`
**Nachtrag (26.08., vor jeder Messung):** `…/NACHTRAG-2026-08-26-spannenrueckprall.md`
**Entwurfsnotizen:** `studien/tueftler/2026-08-26-glockendruck-nacht.md`

**These.** Wer über die Sitzungsgrenze hält, stellt Kapital bereit, wenn die
Innertagsmenge flach sein muss und Market-on-Close-Fluss nicht nach dem Preis fragt.
Beobachtbar am Schlussdruck: `S = (Schluss − Tief)/(Hoch − Tief)`, unterstes Quintil
des zugelassenen Querschnitts, long über Nacht.

**Machbarkeits-Zahlen** (gezählt, nicht gemessen; 400er-Stichprobe aus 2.249 CS/ADRC):

| Größe | Wert |
|---|---|
| Handelstage / davon Bestätigung | 9.329 / **4.665** (ab 05.02.2008) |
| Signalanteil | 19,8 %, feuert an praktisch jedem Tag |
| Breite der Auswahl | 34/Tag in der Stichprobe (≈ 190/Tag im vollen Universum) |
| Beharrlichkeit | **0,200** bei Zufallserwartung 0,198 — rein zeitlich wechselnd |
| Streuung σ der Tagesmittel | 0,880 Pp (voller Tag zum Vergleich: 1,474) |
| se / MDE | 0,0129 / 0,0258 Pp |
| **`delta80` bei 2 Tests** | **0,0397 Pp** — Korpus-Median ist 0,605 → **Faktor 15,2 schärfer** |
| Kostenhürden | Aktie 0,04 · CFD 0,10 · Standard-Schein 0,23 (letzterer ausgeschlossen) |
| Umsatz-Median der Auswahl | 34,3 Mio $ (Korb 37,2) — **keine Kostenneigung** |

**Warum beide Antworten zählen.** JA (≥ 0,10 Pp, |t| ≥ 2,2414, Tagbein trägt weniger als
die Hälfte) wäre die erste handelbare Kante auf dem Basiswert. NEIN (obere Grenze < 0,04 Pp)
schließt das Sitzungsgrenzen-Fenster über 40 Jahre unterhalb der Aktienhürde.

**⚠ Einschränkung, nachgetragen am 26.08. 08:48 — vom Tüftler selbst gefunden.**
`S` teilt den Kurs `Schluss(i)` mit der Zielgröße, und zwar mit entgegengesetztem
Vorzeichen: ein Schluss auf dem Geldkurs senkt `S` und hebt die gemessene Übernachtrendite
(Spannen-Umkehr). Gezählt: **6,4 %** der ausgewählten Tage schließen exakt auf dem
Tagestief, **23,1 %** haben `S` < 0,05. Halbe notierte Spanne ~0,02 Pp.
→ **Die JA-Seite (0,10 Pp) hält.** → **Die NEIN-Seite hält nicht:** zwischen `delta80`
(0,0397) und der Aktienhürde (0,04) liegen 0,0005 Pp, das beherrscht der Rückprall
mehrfach. NEIN entweder mit Vorbehalt melden oder auf die CFD-Hürde (0,10) stellen.
Einzelheiten im Nachtrag. **Die Vorregistrierung selbst bleibt unverändert.**

**Testzahl 2** (Nachtbein, Tagbein), Schwelle |t| ≥ 2,2414. Sieben Gatter, darunter zwei
harte: Eröffnungskurs-Bereinigung an Ex-Tagen und der offen ausgewiesene C8-Vorgriff
(die Zahl ist eine **obere Schranke**, ein NEIN bleibt gültig, ein JA ist vorläufig).

---

### 2. `nachtstoss-umkehr` — eingetragen 26.08.2026 (zweiter Lauf, 08:48)

**Status:** wartet auf Messung. **Dieselbe** Vorbedingung wie Entwurf 1
(`ausstieg`-Schalter) — **keine zusätzliche Bauarbeit.** Sperre wie oben.

**Vorregistrierung:** `studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/VORREGISTRIERUNG.md`
**Entwurfsnotizen:** `studien/tueftler/2026-08-26-nacht2-nachtstoss-umkehr.md`

**These.** Die Eröffnungsauktion hat die dünnste Beteiligung des Tages und wickelt zugleich
den meisten terminfixen Fluss ab (MOO, über Nacht eingestellte Orders, Nachbildung). Ein
Teil des Eröffnungskurses ist deshalb Druck, nicht Wert. Wird er innertags zurückgezahlt,
sammelt Innertags-Kapital ihn ein; wird er **über Nacht** zurückgezahlt, ist es eine
Risikoprämie für unbewirtschaftetes Halten. Signal:
`z1 = (Eröffnung(i)/Schluss(i−1) − 1) / sd(59 vorherige Übernachtstöße)`,
unterstes Quintil, long, Einstieg Schluss(i), Ausstieg Eröffnung(i+1).

**Warum dieser Entwurf neben Entwurf 1 steht — die zwei strukturellen Vorzüge:**

| | Signal liest | Zielgröße liest |
|---|---|---|
| `glockendruck-nacht` | Hoch(i), Tief(i), **Schluss(i)** | **Schluss(i)**, Eröffnung(i+1) |
| **`nachtstoss-umkehr`** | Schluss(i−1), **Eröffnung(i)** | Schluss(i), Eröffnung(i+1) |

1. **Disjunkte Kurse** → kein Spannen-Rückprall, den Entwurf 1 sich einfängt.
2. **Kein C8-Vorgriff.** `z1` steht um 09:31 fest, der Einstieg liegt zu Schluss(i) —
   über sechs Stunden dazwischen. Entwurf 1 muss `S` beim Auftrag raten und deshalb als
   obere Schranke gemeldet werden; hier entfällt der Vorbehalt ersatzlos.

**Machbarkeits-Zahlen** (gezählt, nicht gemessen; 400er-Stichprobe, `zaehle-nachtstoss.js`):

| Größe | Wert |
|---|---|
| Handelstage / davon Bestätigung | 9.471 (18.11.1986 – 20.08.2026) / **4.736** |
| Symbol-Tage nach Liquiditätsschnitt | 1.602.376 |
| Signalanteil | 19,8 %, feuert an praktisch jedem Tag; Breite 33/Tag (≈ 185 im vollen Universum) |
| Beharrlichkeit | **0,217** bei Zufallserwartung 0,198 — zeitlich wechselnd, A7-tauglich |
| **Überschneidung mit der Auswahl von Entwurf 1** | **0,190** bei Zufallserwartung 0,198 → **unabhängig, zwei Schüsse** |
| Streuung σ der Tagesmittel | 0,8833 Pp |
| se / MDE | 0,01284 / 0,0257 Pp |
| **`delta80` bei 2 Tests** | **0,0396 Pp** — Korpus-Median 0,605 → **Faktor 15,3 schärfer** |
| Umsatz-Median der Auswahl | 36,6 Mio $ (Korb 36,5) — **keine Kostenneigung, besser als Entwurf 1** |

**Richtung ist begründet, nicht geraten** (Dossier vom 26.08.): Lou/Polk/Skouras 2019
finden das Kurzfrist-Umkehr-Alpha im **Nachtbein** (+0,93 %/Monat, t = 4,28) und negativ im
Tagbein; Boyarchenko et al. 2023 die Asymmetrie **nach Ausverkäufen ja, nach Kauftagen
nein** — deshalb nur die Runter-Seite. Die Gegenthese (Fortsetzung) steht als **eigener
vorregistrierter Ausgang** in der Entscheidungstabelle.

**Testzahl 2** (Zweig N Nacht, Zweig T Tag), Schwelle |t| ≥ 2,2414. Acht Gatter, darunter
zwei harte: der `ausstieg`-Schalter an allen drei Stellen (C7) und die
Eröffnungskurs-Bereinigung — die wirkt hier **doppelt**, weil auch das Signal aus
Eröffnung/Schluss gebildet wird.

**⚠ Familien-Testzahl, offen ausgewiesen.** Entwürfe 1 und 2 messen dasselbe Fenster auf
demselben Korpus. Familienweit sind das **4 Tests** → `delta80` = **0,0429 Pp**, also
**über** der Aktienhürde. Die JA-Schwellen (0,10) bleiben locker erreichbar; die
NEIN-Aussage „unterhalb der Aktienhürde geschlossen" gilt **studienweise, nicht
familienweit** und muss so berichtet werden. Bonferroni ist hier konservativ (die
Auswahlen sind unabhängig) — das ist ein Argument, keine Erlaubnis.

---

## Auftragsvorschläge

*Beide Vorschläge des ersten Laufs sind am 26.08. 09:00 von Wilhelm freigegeben (Antworten
2a und 3a) und stehen auf der Tafel unter „Aufträge". Hier bleibt nur der Verweis:*

- **A. `ausstieg`-Schalter in der Messmaschine** — freigegeben, auf eigenem Zweig, weil die
  laufende Neumessung dieselbe Datei liest. **Vorbedingung für beide Entwürfe.**
- **B. Auktionskosten am Demo-Konto messen** — freigegeben. Solange offen, steht unter
  jeder Netto-Aussage beider Entwürfe ein Vorbehalt.

Der Tüftler hat in diesem Lauf **keinen neuen Auftragsvorschlag** erzeugt — der neue
Kandidat kommt mit denselben Vorbedingungen aus.

---

## Hinweise an andere Rollen (keine Aufträge)

- **Neu, 26.08. 08:48 — Fehlerkatalog, Entwurfsfehler:** *Ein Signal, das einen Kurs mit
  seiner Zielgröße teilt, erzeugt über die Spannen-Umkehr einen Scheineffekt in der
  behaupteten Richtung. Vor der Vorregistrierung gehört die Frage beantwortet: welche
  Kurse liest das Signal, welche die Zielgröße, und ist der Schnitt leer?* Gefunden an der
  eigenen Schwesterstudie, nicht in der Nachbetrachtung eines fremden Protokolls.
- **Bestätigt, zweiter Fall:** *Ein Querschnittsmerkmal, dessen Auswahl von Tag zu Tag
  beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss zeigen.* Fassung H
  (drei Nächte addiert) kam auf Beharrlichkeit **0,561** gegen 0,198 Zufallserwartung —
  dieselbe Todesursache wie beim Kandidaten `V` (0,943), nur langsamer. Bereits über
  Aggregation entsteht der Fehler; er braucht keine offensichtlich statische Kennzahl.
- **#85 betrifft auch `archiv1d`, nicht nur 60m.** Gemessen 26.08. auf 80 Reihen: 56 % haben
  in der letzten Kerze unter 60 % ihres Median-Volumens; AAPL 24.08. 15,0 statt 46,8 Mio
  Stück; `stand` der Dateien 24.08. 17:27 UTC, also mitten in der Sitzung. Wer #85
  abarbeitet, sollte das Tagesarchiv mitnehmen.
- **Falsches Etikett:** das Feld `quelle` der 1d-Dateien lautet
  `"yahoo v8 chart, range=730d interval=60m"`. Die Daten sind Tageskerzen ab 1986.
