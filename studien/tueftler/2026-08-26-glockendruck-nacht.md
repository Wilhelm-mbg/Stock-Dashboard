# Nacht auf den 26.08.2026 — Entwurfsnotizen

**Nacht-Typ A** (Entwurf). Warteschlange bei Beginn: 0 offene Einträge, also kein Stau.

Ergebnis: ein vorregistrierter Kandidat
(`studien/vorregistrierung-2026-08-26-glockendruck-nacht/`), ein **selbst verworfener**
Kandidat, zwei Auftragsvorschläge und ein Datenfund.

---

## 1. Der Gedankengang

Die Rolle sucht Entwürfe, die an der Auflösungswand nicht scheitern *müssen*: hohe
Signaldichte oder großer Effekt. Beim Lesen der Protokolle fiel eine Zahl auf, die im
Plan nur als Nebensatz steht.

`PLAN-NAECHSTE-STUDIEN.md` eicht die Wand auf eine **Tagesstreuung von 2,8 Pp**,
rückgerechnet aus `monatswende-breit` (se 0,1812 Pp auf 241 Signaltagen). Daraus folgen die
bekannten Schreckenszahlen: 8.770 Bestätigungstage für eine Kante von 0,10 Pp, 35 Jahre.

Aber 2,8 Pp ist **keine Eigenschaft der Daten, sondern der Haltedauer.** In `monatswende-breit`
steckt eine mehrtägige Haltedauer; die Streuung einer H-Tage-Rendite wächst mit √H, und der
Standardfehler eines überlappenden Rasters wächst noch einmal mit √H obendrauf (B10). Die
Wand ist also **familienabhängig**, und niemand hat sie je für die kürzeste mögliche
Haltedauer nachgerechnet.

Der Beleg lag schon im eigenen Haus: `t1-zwangsglattstellung` hält **eine** Kerze über die
Sitzungsgrenze und hat auf 361 Bestätigungstagen se = 0,0583 Pp — das entspricht einer
Tagesstreuung von 1,11 Pp, nicht 2,8. T1 ist trotzdem an der Wand gescheitert, aber aus
einem anderen Grund: **361 Tage.** Das 60m-Archiv reicht 730 Kalendertage zurück, weil die
Quelle nicht mehr hergibt.

Und dann die Stelle, an der es kippt: **Das Tagesarchiv trägt Eröffnungskurse seit 1986.**
`Schluss(i) → Eröffnung(i+1)` ist die Übernachtrendite und steht über **9.329 Handelstage**
zur Verfügung, nicht über 500. Dieselbe kurze Haltedauer, 19-mal so viele Tage.

Das war die Nacht: nicht ein neuer Detektor, sondern **ein Fenster, in dem das Lineal
erstmals kleiner ist als das gesuchte Objekt.**

## 2. Was gezählt wurde

`werkzeug/zaehle-uebernacht.js` und `werkzeug/zaehle-bedingungen.js`, Rohausgabe in
`daten/`. Beide geben ausschließlich Anzahlen, Umsätze, Beharrlichkeiten und Streuungen
aus. **Kein Ertragsmittelwert wurde gedruckt oder abgelegt** — die Tagesmittel entstehen
rechnerisch (ohne sie gibt es keine Streuung), verlassen aber die Funktion nicht.

Die tragende Zahl, Bestätigungshälfte, Tagesmittel des Querschnitts:

| Fenster | Streuung |
|---|---|
| über Nacht (Schluss → Folge-Eröffnung) | **0,880 Pp** |
| voller Tag (Schluss → Folge-Schluss) | 1,474 Pp |
| Eichung der Wand im Plan | 2,8 Pp |

Bei 4.665 Bestätigungstagen: se 0,0129 Pp, MDE 0,0258 Pp, `delta80` 0,0397 Pp bei 2 Tests.
Korpus-Median `delta80`: 0,605 Pp. **Faktor 15,2.**

Nebenbei eine Bestätigung, dass richtig gerechnet wurde: die MDE des ungefilterten breiten
Übernacht-Korbs kommt bei **0,02475 Pp** heraus — exakt die Zahl, die der Plan in Rang 1
für ein breites Signal nennt. Zwei unabhängige Wege, dieselbe Stelle.

## 3. Der verworfene Kandidat — der eigentliche Lehrsatz der Nacht

Der erste Entwurf war `V = sd(60 Übernachtlücken) / sd(60 Innentagesbewegungen)`, höchstes
Quintil: *kauf die Werte, bei denen der Nachtanteil des Risikos am größten ist, denn dort
will die Innertagsmenge am dringendsten flach sein.* Mechanismus sauber, Dichte maximal,
Kostenneigung sogar günstig (Umsatz-Median 49,5 gegen 37,2 Mio $ im Korb — die Werte sind
**liquider** als der Durchschnitt, nicht illiquider, wie ich befürchtet hatte).

Gestorben an einer einzigen Zahl:

> **Beharrlichkeit 0,943** — 94,3 % der Werte im obersten V-Quintil waren schon am Vortag
> darin. Zufallserwartung: 0,198.

`V` ist fast vollständig eine **feste Eigenschaft des Symbols**, keine Bedingung. Die
A7-Kontrolle zieht jedem Symbol seinen eigenen Langfristmittelwert ab — ein zu 94 %
konstantes Merkmal ist damit per Konstruktion null Überschuss. Der Kandidat hätte gemessen
werden können, hätte Rechenzeit gekostet, und das Ergebnis hätte von vornherein festgestanden.

**Das gehört in den Fehlerkatalog, und zwar als Entwurfsfehler, nicht als Messfehler:**

> *Ein Querschnittsmerkmal, dessen Auswahl von Tag zu Tag beharrt, kann gegen eine
> Symbol-Eigen-Kontrolle keinen Überschuss zeigen. Beharrlichkeit gegen die
> Zufallserwartung (= Signalanteil) gehört vor die Vorregistrierung, nicht in die
> Nachbetrachtung.*

Der Kopf von `t1-zwangsglattstellung.js` sagt dasselbe seit dem 23.08. in Prosa
(*„Ein Signal, das jeden Abend feuert, wird gegen genau diesen Mittelwert gemessen — der
Überschuss wäre per Konstruktion null"*). Als **Zahl vor dem Lauf** stand es nirgends.

Die gewählte Bedingung — Schlussdruck `S = (Schluss − Tief)/(Hoch − Tief)`, unterstes
Quintil — hat Beharrlichkeit **0,200** gegen eine Zufallserwartung von 0,198: sie ist rein
zeitlich wechselnd, genau die Bauform, die A7 sehen kann.

## 4. Was ich mir selbst nicht durchgehen lasse

- **C8-Vorgriff.** Das Signal liest Schluss(i) und füllt zu Schluss(i). Eine
  Market-on-Close-Order liegt aber *vor* der Auktion, `S` ist dann unbekannt. Die Zahl ist
  eine **obere Schranke**. Ein NEIN bleibt damit gültig, ein JA ist vorläufig. Steht als
  Gatter 3 in der Vorregistrierung, nicht im Kleingedruckten.
- **Eröffnungskurs-Bereinigung.** Wenn Schluss dividendenbereinigt ist und Eröffnung
  derselben Zeile nicht, trägt jede Übernachtrendite an Ex-Tagen einen systematischen
  Abschlag. Das ist dieselbe Klasse wie der Zeitzonen-Fehler der Ergebnis-Drift. Härtestes
  Gatter, vor allem anderen.
- **Auktionskosten sind unbelegt.** 0,04 Pp ist eine Zahl für die notierte Spanne. Dieser
  Handel füllt in zwei Auktionen. Was das kostet, weiß hier niemand.
- **252 Umläufe im Jahr.** 10,1 Pp Kosten bei der Aktie, 25,2 Pp beim CFD, 58 Pp beim
  Standard-Schein. Der Schein ist tot, bevor gerechnet wird, und wird nicht gemessen.

## 5. Datenfund nebenbei — #85 betrifft auch das Tagesarchiv

Der offene Fund #85 (laufende Quote-Stempel-Kerze) ist für `archiv60m` gemeldet. Gemessen
am 26.08. auf einer 80er-Stichprobe aus `archiv1d`:

- **56 % der Reihen** haben in der letzten Kerze weniger als 60 % ihres Median-Volumens.
- AAPL, 24.08.2026: 15.047.189 Stück gegen 46.768.100 am Vortag.
- `stand` der Dateien: 24.08.2026 17:27 UTC = 13:27 New Yorker Zeit, **mitten in der Sitzung.**

Wer #85 abarbeitet, sollte das Tagesarchiv mitnehmen. Beide Zählwerkzeuge dieser Nacht
verwerfen die letzte Kerze bereits.

Zweiter, kleinerer Fund: das Feld `quelle` der 1d-Dateien lautet
`"yahoo v8 chart, range=730d interval=60m"` — ein falsches Etikett aus dem 60m-Abrufer.
Die Daten selbst sind Tageskerzen (10.076 Stück ab 1986). Kosmetisch, aber ein Etikett, das
lügt, wird irgendwann geglaubt.

## 6. Was diese Nacht nicht getan hat

Kein Ertrag gerechnet. Keine externe Suche verbraucht (0 von 5 Firecrawl-Suchen — die
Ideenquelle war das eigene Protokollarchiv, und sie hat gereicht). Kein App-, Maschinen-
oder Testcode angefasst. Die beiden Zählwerkzeuge liegen unter `studien/tueftler/werkzeug/`
und gehören zum Tüftler, nicht zur Messmaschine.
