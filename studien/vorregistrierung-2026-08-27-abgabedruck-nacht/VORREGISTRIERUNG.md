# Vorregistrierung `abgabedruck-nacht`

**Angelegt 27.08.2026 abends (Windows-Uhr ~19:0x) vom Strategie-Tüftler. Vor jeder Messung.**

Zählwerkzeug: `studien/tueftler/werkzeug/zaehle-abgabedruck.js`
Rohausgabe: `studien/tueftler/daten/zaehlung-abgabedruck-2026-08-27.json`
Literatur: `studien/tueftler/recherche-2026-08-27/DOSSIER.md`

**Alle Zahlen unten sind GEZÄHLT, nicht gemessen.** Das Werkzeug berechnet Anzahlen,
Streuungen, Beharrlichkeit und Überschneidung. Es berechnet keinen Ertragsmittelwert, druckt
keinen und legt keinen ab.

---

## 1. Woher der Kandidat kommt: ein Verlierer, der an der Auflösung starb, nicht an Evidenz

`t2-umsatzschock` aus der Vorregistrierung vom 23.08. („Eigenbau") ist gemessen und mit
**„nicht entscheidbar"** abgelegt worden:

| | k = 3 | k = 5 |
|---|---|---|
| Überschuss | +0,0783 | +0,0898 |
| **MDE** | **0,2264** | **0,3597** |

**Der Punktschätzer war beide Male positiv und in der behaupteten Richtung — und beide Male
kleiner als die eigene Nachweisgrenze.** Gemessen wurde auf **60m mit 8 Kerzen Haltedauer**,
also in genau dem Fenster, das die Auflösungswand-Arbeit vom 25./26.08. als strukturell blind
ausgewiesen hat. **Über die These ist damit nichts gelernt worden.**

Dieser Entwurf setzt denselben Mechanismus in das Fenster, in dem er messbar ist — und baut
ihn gegen die zwei Fehler um, an denen die alte Fassung hing: **harte Schwellen** (die den Korb
auf 1–2 Werte je Tag zusammenschnüren) und **geteilte Kurse**.

---

## 2. Mechanismus — wer zahlt hier wem wofür

**Intermediäre nehmen das Orderungleichgewicht zum Börsenschluss auf und werden dafür über
die Übernachtrendite entschädigt.** Das ist nicht meine Vermutung, sondern der Befund von
**Boyarchenko, Larsen & Whelan (2023, RFS 36(9), 3502–3547)**, dort gemessen an
Schluss-Ungleichgewichten des NYSE. Dieselbe Arbeit liefert die **Richtung**: Ausverkäufe
erzeugen robuste positive Übernacht-Umkehr, Rallyes eine deutlich schwächere. **Deshalb nur
die Runter-Seite, long.**

**Warum genau über Nacht und nicht über fünf Tage:** Die Halbwertszeit des Händlerbestands
liegt bei **einem halben Tag für die größten Werte** bis zwei Tage für die kleinsten
(Hendershott & Menkveld 2010, NYSE; Hansch/Naik/Viswanathan 1998, LSE — beide zitiert bei
Nagel 2012). Unser Liquiditätsschnitt setzt uns ans große Ende (Auswahl-Median 36,8 Mio $
Tagesumsatz). **Das Übernachtfenster ist also rund eine Halbwertszeit.** H = 1 ist hier nicht
bloß bequem, sondern das vom Mechanismus verlangte Fenster.

### Die Stellvertreter-Annahme, offen ausgewiesen

Das Ungleichgewicht **am Schluss von Tag i** ist mit Tagesdaten nicht lesbar, ohne
`Schluss(i)` anzufassen — und `Schluss(i)` ist der Startpreis der Zielgröße. Ersatz: die
Literatur zum **Auftrags-Zerlegen** (institutionelle „parent orders" werden über mehrere
aufeinanderfolgende Handelstage gestreckt; Ungleichgewichte sind über Tage positiv
autokorreliert). **Deshalb ist das Vorzeichen des VORTAGES ein zulässiger Stellvertreter für
die Richtung des heutigen Ungleichgewichts.**

> **Es ist ein Stellvertreter, kein Messwert.** Diese Zeile stützt sich auf
> Suchergebnis-Zusammenfassungen mehrerer Arbeiten, **nicht auf einen geprüften Volltext** —
> sie trägt schwächer als die übrigen Belege. Wenn die Autokorrelation der Ungleichgewichte
> schwach ist, ist das Signal schlicht verrauscht, und die Studie misst dann eine
> abgeschwächte Fassung der These. **Ein NEIN wäre entsprechend schwächer zu lesen als ein JA.**

---

## 3. Signalregel

Universum: **Aktien** (Wertpapierart `CS`/`ADRC`, nie Namensliste), Tagesumsatz > 5 Mio $,
`archiv1d`, Kerzenformat `[t, c, v, h, l, o]`.

Für jedes Symbol und jeden Handelstag **i**:

    U(i)        = v(i) / Median( v(i−60) … v(i−1) )          // Umsatzschock, KURSFREI
    abflauend   = v(i) < v(i−1)                              // KURSFREI
    rVor        = Schluss(i−1) / Eröffnung(i−1) − 1           // Kurse des VORTAGES

    Gatter:  abflauend  UND  rVor < 0
    Rang:    absteigend nach U(i)
    Auswahl: die höchsten U(i) unter den Zugelassenen,
             gedeckelt auf das unterste Quintil des zugelassenen Querschnitts des Tages

**Einstieg `Schluss(i)`, Ausstieg `Eröffnung(i+1)`. H = 1. Richtung long.**

`leseFensterKerzen`: **62 Tage** (60 Umsätze + i−1 + i) — für die A7-Kontrolle anzugeben.

### 🔒 Disjunkte Kurse — der strukturelle Kern dieses Entwurfs

| | liest |
|---|---|
| **Signal** | `Eröffnung(i−1)`, `Schluss(i−1)`, `v(i)`, `v(i−1)`, 60 vorherige `v` |
| **Zielgröße** | `Schluss(i)`, `Eröffnung(i+1)` |

**Der Schnitt ist leer.** Kein geteilter Kurs, kein C8-Vorgriff (das Signal steht um 16:00 ET
fest, der Einstieg liegt in derselben Schlussauktion — die Umsatzzahl des Tages ist zum
Schlusszeitpunkt allerdings noch nicht endgültig, siehe Einschränkung 5).

**Und die schärfere Regel, aus Nagel (2012):** der Spannen-Rückprall hebt sich im breiten Korb
auf, weil manche Werte auf dem Geld- und manche auf dem Briefkurs schließen; er bleibt genau
dort stehen, wo die **Auswahl** nach der Lage des Schlusses im Tagesband fragt.
**Diese Auswahl fragt nicht danach** — sie liest am Tag i überhaupt keinen Kurs.

---

## 4. Machbarkeit — gezählt, 400er-Stichprobe aus dem Aktienuniversum

| Größe | Wert |
|---|---|
| Rahmen | 9.474 Handelstage, 19.11.1986 – 24.08.2026, 1.602.997 Symbol-Tage |
| Reihen verworfen (F1-Sprung / Kurs) | 5 · Extremwerte ausgesondert 310 |
| Handelstage mit Signal | **9.356** (98,8 %) |
| davon Bestätigungshälfte | **4.678** |
| Signalanteil | **19 %** · Breite **24/Tag** in der Stichprobe (≈ 134/Tag im vollen Universum) |
| **Beharrlichkeit** | **0,150** bei Zufallserwartung **0,190** — **unter** Zufall, ausgesprochen wechselnd |
| Überschneidung mit `glockendruck-nacht` | **0,192** (Erwartung ≈ 0,19) |
| Überschneidung mit `nachtstoss-umkehr` | **0,171** (Erwartung ≈ 0,19) |
| Streuung σ der Tagesmittel | **0,8848 Pp** |
| se / MDE | **0,01294 / 0,02587 Pp** |
| **`delta80` bei 2 Tests** | **0,03988 Pp** — Korpus-Median 0,605 → **Faktor 15,2 schärfer** |
| Umsatz-Median der Auswahl / des Korbes | **36,8 / 37,1 Mio $** — keine Kostenneigung |
| Kostenhürden | Aktie 0,04 · CFD 0,10 · Standard-Schein 0,23 (letzterer ausgeschlossen) |

**Nötige Handelstage** (skalieren mit 1/d²):

| | studienweise (2 Tests) | familienweit (6 Tests) |
|---|---|---|
| für 0,10 Pp | **744** — vorhanden 4.678, **Faktor 6,3** | **948** — Faktor 4,9 |
| für 0,04 Pp | 4.651 — vorhanden 4.678, **Faktor 1,006** | 5.925 — **reißt** |

> **Die JA-Seite besteht deutlich, auch familienweit.**
> **Die NEIN-Seite an der Aktienhürde steht studienweise exakt auf der Kante (Faktor 1,006)
> und reißt familienweit klar.** → **NEIN wird auf die CFD-Hürde (0,10 Pp) gestellt**, wie bei
> beiden Schwesterentwürfen. Ein „unterhalb der Aktienhürde geschlossen" ist mit diesem Korpus
> nicht zu haben.

### ⚠ Familien-Testzahl — die Kosten, die dieser Entwurf den anderen zwei auferlegt

Drei Entwürfe, derselbe Korpus, dasselbe Übernachtfenster, je 2 Tests → **6 Tests
familienweit**, `z_krit` = 2,6383.

| | bisher (4 Tests) | mit diesem Entwurf (6 Tests) |
|---|---|---|
| `glockendruck-nacht` `delta80` | 0,0429 | **0,0446** |
| `nachtstoss-umkehr` `delta80` | 0,0429 | **0,0447** |
| `abgabedruck-nacht` `delta80` | — | **0,0450** |

**Das ist eine Verschlechterung um rund 4 % für fremde, schon eingetragene Arbeit, und sie
geht auf mein Konto.** Die JA-Schwellen aller drei bleiben locker erreichbar (Faktor 4,7–4,9),
die NEIN-Aussagen waren schon vorher auf die CFD-Hürde gestellt. **Bonferroni ist hier
konservativ — die drei Auswahlen überschneiden sich nur auf Zufallsniveau (0,17–0,19) und
sind damit nahezu unabhängig. Das ist ein Argument, keine Erlaubnis.**

---

## 5. Wie der Zuschnitt zustande kam — und warum das zulässig ist

**Sechs Bauformen wurden gezählt, bevor eine gewählt wurde.** Die Wahl fiel nach **gezählter
Auflösung und gezählter Beharrlichkeit** — **niemals nach einem Ertrag; ein solcher wurde nie
berechnet.** Das ist der Unterschied zur k-Durchmusterung, die in der großen Signalstudie 3.372
Tests und 0 Bestätigungen erzeugt hat.

| Bauform | Breite | σ | `delta80`(2) | Beharr./Zufall |
|---|---|---|---|---|
| **K2 — gewählt** | 24 | **0,8848** | **0,0399** | **0,150 / 0,190 ✓** |
| K3: ohne Abflau-Gatter | 32 | 0,9089 | 0,0408 | 0,290 / 0,197 ✗ |
| P: Gatter, **Kunstrang statt Umsatz** | 32 | 0,8701 | 0,0390 | 0,188 / 0,197 |
| C2: nur Umsatzschock, kein Vorzeichen | 13 | 1,0897 | 0,0489 | 0,383 / 0,100 ✗ |
| K: harte Schwelle U ≥ 2 | **2** | 1,5541 | 0,0852 | 0,159 / 0,012 |
| C3: harte Schwelle U ≥ 3 | **1** | 2,1560 | 0,1625 | 0,257 / 0,007 |

**Drei Dinge, die diese Tabelle sagt, und zwei davon sind unbequem:**

1. **Harte Schwellen sind der Killer.** `U ≥ 2` schnürt den Korb auf 2 Werte je Tag und
   verdoppelt `delta80`; `U ≥ 3` vervierfacht es. **Das ist derselbe Bauartfehler, an dem
   `t2-umsatzschock` schon gestorben ist** — dort auf 60m, hier hätte er es wieder getan.
   *Rangieren statt schwellen* ist die Lehre.
2. **🔴 Der Umsatzschock-Rang kauft keine Auflösung — er kostet welche.** Bei **gleicher
   Korbbreite (32)** liefert der reine Kunstrang ohne jede Umsatzinformation σ 0,870, der
   Rang nach Umsatzschock σ 0,909: **4,5 % schlechter**, und die Beharrlichkeit steigt vom
   Zufallsniveau (0,188) auf das **1,47-Fache** (0,290). Ein beharrliches Querschnittsmerkmal
   zeigt gegen die A7-Kontrolle keinen Überschuss. **Der Umsatzschock steht in diesem Entwurf
   allein auf dem Mechanismus, nicht auf einer Zahl.**
3. **Das Abflau-Gatter rettet genau das.** Mit ihm fällt die Beharrlichkeit auf 0,150 —
   **unter** die Zufallserwartung — und σ trotz schmalerem Korb auf 0,8848. Es hat auch einen
   Mechanismusgrund (ein Wert mit weiter steigendem Umsatz steckt noch im Nachrichtenzyklus;
   der abflauende ist der Restbestandsfall), **aber der Grund ist dünner als die Zahl, und die
   Zahl war zuerst da. Das schreibe ich hin, statt es umzudrehen.**

> **📐 Und der allgemeine Befund, der über diesen Entwurf hinausgeht:**
> **In diesem Fenster ist die Auflösung eine Eigenschaft der KORBBREITE, nicht der Idee.**
> Fünf strukturell verschiedene Auswahlregeln mit ~20 %-Quintil und ~4.700 Bestätigungstagen
> landen alle bei `delta80` **0,0390–0,0408 Pp — eine Spanne von 4,5 %.** Erst Verengung
> zerstört sie (Breite 2 → 0,085; Breite 1 → 0,163).
> ***Die Machbarkeitszahl unterscheidet hier nicht zwischen Ideen. Sie bestraft nur Schmalheit.***
> **Das ist der beste Beleg für Wilhelms Regel vom 27.08.**, die Zahl zu rechnen und
> hinzuschreiben, statt mit ihr Kandidaten auszusortieren: **zum Aussortieren taugt sie in
> diesem Fenster gar nicht.**

---

## 6. Entscheidungstabelle — vor dem Lauf festgelegt

**Testzahl 2:** Zweig N (Nachtbein, die These) und Zweig T (Tagbein, Trennschärfe).
Schwelle **|t| ≥ 2,2414** (Bonferroni, 2 Tests, zweiseitig).

| Ausgang | Bedingung |
|---|---|
| **JA** | Zweig N ≥ **+0,10 Pp** je Umlauf **und** \|t\| ≥ 2,2414 **und** Zweig T trägt weniger als die Hälfte davon |
| **NEIN** | obere Grenze des Vertrauensbereichs von Zweig N < **0,10 Pp** (CFD-Hürde) |
| **nicht entscheidbar** | sonst — und dann ausdrücklich so berichtet, nicht als NEIN |

**Zweig T** (Einstieg `Eröffnung(i+1)`, Ausstieg `Schluss(i+1)`, H = 1) ist **keine zweite
Chance, sondern die Trennschärfe**: sitzt der Überschuss im Tagbein, ist es gewöhnliche
Kurzfrist-Gegenbewegung und **nicht** die Prämie für das Halten über die Schließung.

### 📐 Vorab registrierter Regimeschnitt — Berichtspflicht, kein zweites Urteil

Boyarchenko, Larsen & Whelan haben am **01.07.2026** („The Disappearing Overnight Drift",
Liberty Street Economics, FRBNY) veröffentlicht, dass die von ihnen 2023 belegte Drift **seit
Januar 2021 nahe null** ist — **nicht** wegen Veröffentlichungs-Arbitrage, sondern weil der
**Eingang** des Mechanismus zusammengebrochen ist: die Streuung der Schluss-Ungleichgewichte
fiel von sd 6,5 % auf **sd 2,9 %**.

**Da dieser Entwurf genau jenen Mechanismus benutzt, wird der Überschuss zusätzlich getrennt
berichtet für A: bis 31.12.2020 und B: ab 01.01.2021.** Der Schnittpunkt stammt aus der Quelle,
nicht aus unseren Daten, und wird nicht verschoben.

**Das Urteil hängt am ungeteilten Zeitraum.** Der Schnitt erhöht die Testzahl nicht, weil aus
ihm weder JA noch NEIN abgeleitet wird. **Er steht hier, damit ein schwaches Ergebnis nicht
NACHTRÄGLICH mit „das Regime ist tot" erklärt werden kann** — das wäre eine nachträgliche
Schwellenanpassung.

---

## 7. Was ich mir selbst nicht durchgehen lasse

1. **Die Überlebenslücke.** `archiv1d` enthält ausschließlich Werte, die es heute noch gibt.
   Über 2008–2026 fehlen **mindestens 12,7 %** des Querschnitts, steigend auf ~20 % (2023),
   **ausschließlich Nicht-Überlebende**; vor 2004 ist die Lücke nicht einmal diagnostizierbar.
   Die Aussage „auf einem Universum ohne Rückschau gemessen" darf für diesen Entwurf **nicht**
   fallen. Ob die Lücke ein Übernacht-Querschnittssignal in eine Richtung schiebt, ist eine
   Messfrage (Weg 3 in der Übernacht-Fassung, wartet auf den Eröffnungskurs-Nachlauf) und
   **ausdrücklich nicht vom Tüftler beantwortet**. Bekannt ist bereits: die Verzerrung hat
   **kein einheitliches Vorzeichen** — Übernahme-Prämien lassen das Archiv untertreiben,
   Sterbepfade lassen es beschönigen.
2. **Der Umsatzschock-Rang kostet Auflösung und erhöht die Beharrlichkeit** (Abschnitt 5,
   Punkt 2). Er steht allein auf dem Mechanismus. **Zeigt die A7-Kontrolle, dass der Überschuss
   verschwindet, ist das ein erwarteter Ausgang und kein Rätsel.**
3. **Das Abflau-Gatter wurde nach der Zahl gewählt, nicht nach dem Grund** (Abschnitt 5,
   Punkt 3).
4. **Der Stellvertreter für das Vorzeichen** ist die Vortagsrichtung, nicht das
   Ungleichgewicht selbst; die stützende Literatur ist nicht im Volltext geprüft (Abschnitt 2).
5. **Die Umsatzzahl des Tages i ist zum Schlusszeitpunkt noch nicht endgültig.** Der Einstieg
   liegt in der Schlussauktion; das konsolidierte Tagesvolumen steht erst danach fest, und die
   Auktion selbst ist ein erheblicher Teil davon. **Das ist ein echter C8-Vorgriff, klein aber
   vorhanden.** → **Die gemessene Zahl ist als OBERE SCHRANKE zu berichten. Ein NEIN bleibt
   gültig, ein JA ist vorläufig.** *Die saubere Gegenprobe wäre `U` aus `v(i−1)` statt `v(i)` —
   das kostet Aktualität und ist ein Vorschlag an die Mess-Kette, keine Änderung hier.*
6. **252 Umläufe im Jahr.** 10,1 Pp Kosten bei der Aktie, 25,2 Pp beim CFD. Ein JA bei
   0,10 Pp je Umlauf ist brutto ~25 Pp im Jahr und netto **null** auf dem CFD. Handelbar wäre
   dieser Entwurf, wenn überhaupt, auf der **Aktie** — die das Depot heute nicht handelt.
   **Kein Grund, ihn nicht zu messen; ein Grund, kein Handelsversprechen daran zu hängen.**
7. **Auktionskosten sind ungemessen** (Auftrag B, freigegeben, offen). Solange das so ist,
   steht unter jeder Netto-Aussage ein Vorbehalt — Ein- **und** Ausstieg dieses Entwurfs liegen
   in Auktionen.
8. **Dritte Studie auf demselben Korpus.** Der Faktor 15 an Auflösung kommt aus Haltedauer und
   Tagezahl, nicht aus neuen Daten.
