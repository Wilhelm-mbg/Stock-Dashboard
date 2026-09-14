# Vorregistrierung — Querschnitts-Prüfstand, **Teil 2** (15.09.2026)

Nachtrag zu `VORREGISTRIERUNG.md` (Teil 1, 13.09.2026). Dieses Papier wird **als erster Commit von Teil 2
geschrieben, vor jeder Zahl**. Die Maschine aus Teil 1 — Tafel, Prüfrahmen, Leck-Sperrklinke, Kontrollen,
`test.js` — wird **benutzt und nicht verändert**, abgesehen von den in §T2.1 beschriebenen Ergänzungen.

Alles Simulation mit virtuellem Kapital. **Keine Anlageberatung.** Nur Lesezugriff auf Archiv und Referenz.

---

## T2.0 Zwei Entscheide aus der Abnahme von Teil 1

### T2.0.1 Das gefallene Orakel-Kriterium bleibt gefallen — die Korrektur gilt ausdrücklich nachträglich

Teil 1 meldete: **ORAKEL GEFALLEN** — `orakelTag/monat` lieferte `Mittel/sd = 0,82 < 1,0`. Dieser Befund
**bleibt so im Protokoll stehen**. Er wird nicht umdatiert, nicht umformuliert und nicht nachträglich
bestanden gerechnet.

**Korrektur für die Zukunft, ausdrücklich nachträglich beschlossen** (PM-Entscheid bei der Abnahme von
Teil 1, hier vor der ersten Zahl von Teil 2 festgeschrieben):

> Die **Verhältnis- und t-Kriterien** des Orakels (`|Mittel|/sd ≥ 1,0`, `t ≥ 8`, und das bereits in
> Nachtrag 4 gefallene `t ≥ 20`) gelten **nur für diejenige Orakel-Fassung, deren Sichtweite der
> Haltedauer entspricht** — also `orakelTag` bei wöchentlicher Umschichtung (Sichtweite 1 Tag, Haltedauer
> 5 Tage: noch vertretbar) und `orakelPeriode` bei jeder Frequenz. Für `orakelTag/monat` ist die
> Sichtweite **ein** Tag bei **21** Tagen Haltedauer; die restlichen 20 Tage sind für die Rangfunktion
> reines Rauschen und blähen die Perioden-Streuung `sd` auf, ohne den Effekt zu vergrößern. Ein
> Verhältnis-Kriterium misst dort die **Verdünnung der Sichtweite**, nicht die Verrohrung.
>
> Die **Pp-Schranke bleibt für alle Fassungen und alle Frequenzen das Hauptkriterium**
> (≥ 2,0 Pp je Periode brutto und netto für `orakelTag`; ≥ 5,0 Pp je Woche für `orakelPeriode`).

Nachrechnung an den Zahlen von Teil 1, damit die Korrektur nicht bloß eine Behauptung ist:
`orakelPeriode/monat` — dieselbe Maschine, Sichtweite = Haltedauer — liefert **+19,635 Pp** je Periode bei
`t = 26,6`; `orakelTag/monat` liefert **+3,937 Pp** bei `t = 8,8`. Beide Pp-Schranken sind mit großem
Abstand gehalten. Das ist genau das vorhergesagte Muster: die Verrohrung ist in Ordnung, die *eine*
gefallene Kennzahl war ein Artefakt der Sichtweite.

**Für Teil 2 gilt:** die Maschine wird als verrohrungsgeprüft behandelt. Fällt in Teil 2 **irgendeine**
Kontrolle, wird gemeldet und nicht repariert.

### T2.0.2 Momentum 12-1 ist Kontext, kein Befund

Die +1,622 Pp je Monat aus Teil 1 sind **keine belegte Kante**. Momentum 12-1 ist eine
Verrohrungskontrolle mit Vorzeichenerwartung: ohne Vorregistrierung als Strategie, ohne Bonferroni, ohne
Urteil. In Teil 2 dient die Momentum-Reihe ausschließlich als **Messobjekt des Außen-Prüfsteins**
(§T2.2) — sie wird dort mit einer fremden Reihe verglichen, nicht bewertet.

---

## T2.1 Was an der Maschine ergänzt wird (und was nicht)

**Ergänzt wird genau zweierlei:**

1. **`auswerten()` in `kontrollen.js` schreibt je Lauf die Periodenreihe heraus** — neues Feld
   `perioden[]` mit je Periode: `signaltag` (Datum), `ausfuehrungstag` (Datum), `monat` (YYYY-MM des
   Ausführungstags), `brutto`, `netto` (beides Hauptgröße Long−Universum, Pp), `umschlag`, `kosten`,
   `nUni`, `k`, `regime`. Ohne diese Reihe ist **keine** Zeitreihenprüfung gegen eine fremde Reihe
   möglich; `kontrollen.json` speicherte bisher nur Aggregate. Die Aggregate bleiben Byte-für-Byte
   dieselben — `perioden[]` wird **daneben** geschrieben, es wird keine bestehende Zahl neu berechnet.
2. **Vier neue Rangfunktionen** in `rangfunktionen.js` (§T2.3) und ein Läufer `kandidaten.js`. Der
   Prüfrahmen `pruefstand.js`, die Konfiguration der Universumsregeln, die Kostenformel, die se-Regel und
   die Leck-Sperrklinke werden **nicht angefasst**.

**Nicht ergänzt wird:** keine neue Datenquelle, kein Netzzugriff, kein neues Panel. Das Panel aus Teil 1
(9.899.585 Tageszeilen, 7.300 Reihen, 2016-01-04 … 2026-09-11) wird unverändert gelesen.

---

## T2.2 Der Außen-Prüfstein: unsere Momentum-Reihe gegen Kenneth Frenchs `Mom`

Bisher prüft sich die Maschine ausschließlich an sich selbst (Orakel, Zufall, Leck-Probe sind alle
**intern**). Der Außen-Prüfstein ist die erste Prüfung gegen eine **unabhängig erzeugte** Reihe.

### T2.2.1 Die Referenzreihe

`C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/referenz/F-F_Momentum_Factor.csv` — Kenneth Frenchs
veröffentlichter Momentum-Faktor `Mom`, monatlich, 1927-01 … 2026-07, aus der CRSP-Datenbank 202607.
Die Datei liegt **außerhalb** des Repos (das Repo ist öffentlich) und wird **nur gelesen, nie kopiert**.
Gelesen wird ausschließlich der monatliche Block (Zeilen mit sechsstelligem `YYYYMM`-Schlüssel); der
Jahresblock am Dateiende und die Fehlwertmarken `-99.99` / `-999` werden verworfen. Werte in Prozent
je Monat, das ist dieselbe Einheit wie unsere Pp.

### T2.2.2 Was verglichen wird — und was ausdrücklich **nicht** erwartet wird

Unsere Reihe: `momentum-12-1`, **monatlich**, Hauptgröße **Long-Dezil − gleichgewichtetes Universum**,
brutto, aus ~220 liquiden US-Werten (Klassen 250–1000 und ab1000).
Frenchs Reihe: **Long-Short** über **alle** US-Aktien (NYSE/AMEX/NASDAQ), **wertgewichtet** innerhalb von
zwei Größengruppen, Grenzen bei den NYSE-Perzentilen 30/70.

Das sind verschiedene Konstruktionen. **Die Höhe muss nicht übereinstimmen** — ein Long-Short-Faktor hat
systematisch größere Ausschläge als ein Long-gegen-Universum, und ein wertgewichteter Faktor über den
ganzen Markt hat eine andere Streuung als ein gleichgewichteter über 220 liquide Werte. Geprüft wird
allein der **Gleichlauf**: die Pearson-Korrelation ρ über die gemeinsamen Monate.

### T2.2.3 Die Zuordnung Periode → Kalendermonat (vor dem Rechnen festgelegt)

Eine Monatsperiode unserer Maschine läuft von der **Eröffnung des ersten Handelstags** eines Monats bis
zur **Eröffnung des ersten Handelstags des Folgemonats** (Signaltag = letzter Handelstag des Vormonats,
Ausführung am nächsten Handelstag). Sie deckt damit einen Kalendermonat bis auf wenige Stunden an beiden
Rändern. **Regel:** die Periode trägt den Kalendermonat ihres **Ausführungstags** `a`.
Ein Versatz um einen Monat wäre der klassische Weg, eine echte Korrelation zu zerstören oder eine falsche
zu erzeugen; deshalb wird die Zuordnung hier festgeschrieben und im Ergebnis **die Korrelation bei
Versatz −1, 0 und +1 Monat ausgewiesen**. Erwartung: das Maximum liegt bei Versatz 0. Liegt es woanders,
ist das ein Befund über die Zuordnung, kein Ergebnis.

Erwarteter gemeinsamer Bereich: unsere Monatsperioden beginnen mit dem Ausführungsmonat **2017-02**
(250 Vortage + 252 Handelstage Momentum-Fenster ab 2016-01-04), Frenchs Reihe endet **2026-07**.

### T2.2.4 Die Schranken — vorab

| ρ (gemeinsame Monate, brutto) | Urteil |
|---|---|
| **ρ ≥ 0,5** | **Die Maschine bildet den bekannten Faktor ab.** Der erste Prüfstein von außen ist bestanden. |
| **0,2 ≤ ρ < 0,5** | **teilweise.** Wird so hingeschrieben, und die Abweichung wird an den Kalenderjahren gezeigt. |
| **ρ < 0,2** | **BEFUND.** Unsere Momentum-Zahl misst dann etwas anderes als den Faktor; die +1,622 Pp aus Teil 1 sind bis zur Klärung **nicht verwendbar**. **Melden, nicht reparieren.** |

Nachrichtlich zusätzlich, ohne eigene Schranke:
- dieselbe Korrelation **je Kalenderjahr** (Jahre mit < 6 gemeinsamen Monaten als „zu dünn" markiert),
- die Regressionssteigung β unserer Reihe auf `Mom` (sie beziffert den Größenunterschied, den ρ
  bewusst ignoriert),
- das **Vorzeichen im Momentum-Einbruch 2021**. Fällt unsere Reihe dort ebenfalls, ist das ein starkes
  Zeichen; Frenchs `Mom` liefert für das Kalenderjahr 2021 −2,32 % (Jahresblock der Referenzdatei), und
  unsere Jahresscheibe 2021 liegt bei −2,22 Pp je Monat (Teil 1, netto). Diese beiden Zahlen sind
  **verschiedene Größen** (Jahresrendite gegen Monatsmittel) und werden nicht gleichgesetzt; verglichen
  wird das **Vorzeichen** und der monatliche Verlauf innerhalb des Einbruchs.

### T2.2.5 Die Dividendenlücke beziffern

Unsere Renditen enthalten **keine Ausschüttungen** (§1.4 Teil 1: das Archiv ist `adjustment=raw`, die
bereinigte Kopie wendet Splits und gemessene Abspaltungen an, ausdrücklich keine Dividenden).
In der Hauptgröße kürzt sich eine **gleich große** Ausschüttung heraus; übrig bleibt die **Differenz**
der Dividendenrendite zwischen Long-Dezil und Universum:

> `Überschuss_Kurs = Überschuss_Gesamtrendite − (Dividendenrendite_Dezil − Dividendenrendite_Universum)`

Zahlt das Momentum-Dezil **weniger** Dividende als das Universum (die erwartete Richtung: Momentum-Gewinner
sind überdurchschnittlich wachstumslastig), dann **überschätzt** unsere Zahl den Gesamtrenditeüberschuss.

**Verfahren, vorab festgelegt:** es wird aus dem vorhandenen Bestand geschätzt und das Verfahren
offengelegt. Steht im Bestand keine Ausschüttungsgröße, die eine *Messung* erlaubt, wird das
**hingeschrieben und eine Obergrenze angegeben statt einer Schätzung** — eine Zahl ohne Messung wäre
geraten. Die Obergrenze ist in jedem Fall nennbar: sie ist die Dividendenrendite des Universums selbst
(der Extremfall „das Dezil zahlt gar nichts"), und diese ist nach oben durch die bekannte Marktrendite
beschränkt. Was Annahme ist und was Messung, wird je Zahl ausgewiesen.

---

## T2.3 Die vier Kandidaten — vorregistriert, keine Suche

**Testzahl: 4 Rangfunktionen × 2 Umschichtungsfrequenzen (Woche, Monat) = 8.** Vorab festgelegt.
Bonferroni darauf: zweiseitig α = 0,05 ⇒ α/8 = 0,00625 ⇒ **kritischer Betrag |t| ≥ 2,734**.

**Rangkonvention des Prüfrahmens:** höherer Rangwert ⇒ Long-Dezil. Wo das untere Ende gekauft wird,
trägt die Rangfunktion das Vorzeichen `−` in sich. Die Richtung („welches Ende wird gekauft") steht
**hier**, vor der Messung; das jeweils andere Ende erscheint als Short-Dezil in der Diagnose und ist
**kein zweiter Test**.

Alle vier lesen ausschließlich Panelzeilen **bis einschließlich Signaltag t**, über `sicht.zurueck(z,k)`
(per Bau vergangenheitsbezogen) und die Zeile an t selbst. Kein Zugriff über `sicht.zeile(sym, tg>t)` —
die Leck-Sperrklinke muss für alle vier **null** Verstöße melden, sonst ist der Lauf ungültig.
Fehlt eine benötigte Vorzeile oder ist ein Kurs ≤ 0, liefert die Rangfunktion `NaN` und das Papier fällt
an diesem Tag aus dem Universum (gezählt als `rangNaN`).

### K1 — Kurzfrist-Umkehr

> `r5 = 100 · (bereinigter_Schluss(t) / bereinigter_Schluss(t−5) − 1)`, gerechnet über die **5 vorigen
> Panelzeilen derselben Reihe**. **Rangwert = −r5**, gekauft wird das **untere** Ende von `r5`.

*Grund:* Trendwende II hat gemessen, dass nach Extremen eine echte Trennung existiert (rohe Trennung
0,04 bis 0,36 Pp, in **allen 15 Zellen positiv**); sie war dort nur zu klein für die Spanne **bei
Haltedauern von Stunden**. Bei Wochen- und Monatshaltedauer verschiebt sich das Verhältnis von Effekt zu
Kostenhürde um Größenordnungen — das ist die Lehre der Auflösungswand, angewandt statt wiederholt.

### K2 — Tiefe Volatilität

> `sd60 = Standardabweichung der bereinigten Tagesrenditen der letzten 60 Panelzeilen` (Zeilen
> `t, t−1, … , t−59`; Stichproben-sd mit Nenner n−1; mindestens 60 verwertbare Renditen, sonst `NaN`).
> **Rangwert = −sd60**, gekauft wird das **untere** Ende.

*Grund:* niedriger Umschlag (die Volatilitätsordnung ist träge) und ein **anderer Mechanismus** als K1 —
nicht renditegetrieben, also nicht dieselbe Größe in anderer Verpackung.

### K3 — Abstand zum 52-Wochen-Hoch

> `naehe = bereinigter_Schluss(t) / max(bereinigter_Schluss über die Zeilen t−249 … t)`.
> **Rangwert = naehe**, gekauft wird das **obere** Ende (die Papiere **nahe** ihrem Hoch).

Zwei Festlegungen, die vor der Messung gehören:
- **Die Tafel führt kein Tageshoch** (§1.2 Teil 1: `roh_schluss`, `roh_eroeffnung`, kein `hoch`). „Hoch
  über 250 Tage" ist deshalb hier das **höchste Tages*schluss*niveau** der letzten 250 Panelzeilen. Das
  ist eine *andere* Größe als das Intraday-Hoch (systematisch etwas niedriger) und wird so berichtet.
- **Gerechnet wird auf der bereinigten Reihe**, nicht auf `roh_schluss`. Ein Verhältnis aus zwei
  Rohkursen über 250 Tage trüge den Split-Faktor mit und wäre nach jedem Split um genau diesen Faktor
  falsch (Fehlerform „bereinigte Kurse messen den Cent-Boden falsch", hier in der Gegenrichtung: eine
  Verhältnisgröße über Zeit braucht die **bereinigte** Reihe). Der Auftragstext nennt `roh_schluss`;
  die Verhältnisbildung macht die Bereinigung zur einzig richtigen Wahl, und die Abweichung vom
  Auftragswortlaut steht hier ausdrücklich.

*Grund:* ein **Niveau** statt einer Rendite — also nicht dieselbe Größe wie Momentum in anderer
Verpackung. Richtung nach der dokumentierten Form des Effekts (Papiere nahe am 52-Wochen-Hoch).

### K4 — Umsatzschock mit Richtung

> `schock = dollar_umsatz(t) / Median(dollar_umsatz über die Zeilen t−60 … t−1)`, multipliziert mit dem
> **Vorzeichen der Tagesrendite an t** (`+1`, `−1`, bei Rendite exakt 0: `0`).
> **Rangwert = schock · sign(rendite(t))**, gekauft wird das **obere** Ende (Umsatzschub an einem
> **Aufwärts**tag).

Der Median läuft über die 60 Zeilen **vor** t, nicht einschließlich t — sonst stünde der Zähler in seinem
eigenen Nenner. Mindestens 40 verwertbare Umsätze im Fenster, sonst `NaN`. Der Dollarumsatz ist gegen die
Bereinigung invariant (§ Nachtrag 3 Teil 1) und trägt keinen Faktor.

*Grund:* die **einzige** Größe im Feld, die **nicht aus dem Kurs kommt** — damit der Satz von vier
Kandidaten nicht viermal dieselbe Information testet.

### T2.3.1 Was je Zeile berichtet wird

Für jede der 8 Zeilen: brutto, netto, `t` auf der **Perioden**reihe (Hauptmaß), die drei se auf der
Tagesreihe (naiv / Hansen-Hodrick / Newey-West) mit der Spreizungsmarke, Umschlag, **gemessene** Kosten,
Jahresscheiben 2016…2026, die letzten 250 Handelstage, der Regimeschnitt SPY über/unter EMA200, die Zahl
der Toten im gehaltenen Dezil und die Empfindlichkeit gegen die Ausbuchungsregel (haupt / streng / milde).

### T2.3.2 Kostenvorprüfung — vor der Messung, nicht danach

Regel: `Faktor = erwarteter Effekt je Periode / (erwarteter Umschlag × Hürde je Umlauf)`. Unter **Faktor 4**
wird die Zeile **gemessen, aber im Bericht als „unter der Vorprüfschwelle" markiert** (Auftrag Teil 2 §2).
Hürde je Umlauf: **0,063 Pp** — das ist der aus Teil 1 *gemessene* Mischwert des Universums
(Momentum monatlich: Umschlag 29,3 % ⇒ Kosten 0,0184 Pp ⇒ 0,0628 Pp je Umlauf), er liegt zwischen den
Klassenhürden 0,0647 (250–1000) und 0,0449 (ab1000).

| # | Zeile | erwarteter Effekt je Periode (Pp) | erwarteter Umschlag | Umschlag × Hürde (Pp) | Faktor | Vorprüfung |
|---|---|---|---|---|---|---|
| 1 | K1 Kurzfrist-Umkehr, **Woche** | +0,10 … +0,30 | ~0,85 | 0,054 | 1,9 … 5,6 | **grenzwertig** |
| 2 | K1 Kurzfrist-Umkehr, **Monat** | +0,30 … +0,80 | ~0,90 | 0,057 | 5,3 … 14,1 | messen |
| 3 | K2 Tiefe Volatilität, **Woche** | +0,025 … +0,075 | ~0,05 | 0,0032 | 7,9 … 23,8 | messen |
| 4 | K2 Tiefe Volatilität, **Monat** | +0,10 … +0,30 | ~0,12 | 0,0076 | 13,2 … 39,7 | messen |
| 5 | K3 52-Wochen-Hoch, **Woche** | +0,04 … +0,08 | ~0,10 | 0,0063 | 6,3 … 12,7 | messen |
| 6 | K3 52-Wochen-Hoch, **Monat** | +0,15 … +0,30 | ~0,25 | 0,0158 | 9,5 … 19,0 | messen |
| 7 | K4 Umsatzschock, **Woche** | +0,03 … +0,06 | ~0,85 | 0,054 | 0,6 … 1,1 | **unter der Schwelle** |
| 8 | K4 Umsatzschock, **Monat** | +0,10 … +0,25 | ~0,90 | 0,057 | 1,8 … 4,4 | **unter der Schwelle** |

Die erwarteten Effekte sind **Schätzungen aus der dokumentierten Größenordnung der jeweiligen Form**,
nicht aus unseren Daten — sie stehen hier, damit die Messung sie widerlegen kann. Der **gemessene**
Umschlag wird im Ergebnis gegen die Schätzung gehalten; weicht er stark ab, ist die Vorprüfung dieser
Zeile nachträglich falsch gewesen und das steht dann dort.

---

## T2.4 Die Tore — was ein Kandidat bestehen muss, damit ein Zielportfolio entsteht

Vorab festgelegt. Ein Kandidat besteht **nur**, wenn **alle** Tore halten. Für jedes Tor gilt: gefallen
heißt gefallen, es wird gemeldet und nicht nachgebessert.

| Tor | Bedingung | Begründung |
|---|---|---|
| **T-0 Maschine** | Leck-Sperrklinke meldet **0** Verstöße im Lauf; Lauf nicht `ungueltig` | ohne Klinke ist jede Zahl wertlos |
| **T-1 Außen** | Der Außen-Prüfstein (§T2.2.4) ist **nicht** gefallen (ρ ≥ 0,2) | fällt er, misst der Querschnitt etwas anderes als gedacht — dann darf aus ihm auch kein Portfolio kommen |
| **T-2 Vorzeichen** | `netto`-Mittel der Hauptgröße **> 0** | ein Kandidat mit falschem Vorzeichen ist widerlegt, nicht belegt |
| **T-3 Signifikanz (Perioden)** | `t` auf der **Perioden**reihe, netto, **≥ 2,734** (Bonferroni, 8 Tests) | Hauptmaß nach §2.6 |
| **T-4 Signifikanz (Tagesreihe, Hansen-Hodrick)** | `netto`-Mittel / `se_HH` der Tagesreihe **≥ 2,734** | eine se-Spreizung darf das Urteil nicht allein tragen |
| **T-5 Aktualität** | letzte 250 Handelstage: `netto`-Mittel **> 0** | Aktualitäts-Tor (Lehre „Zeitachse: Jahresscheiben + Aktualitäts-Tor"): eine gestorbene Kante ist keine Kante |
| **T-6 Jahresscheiben** | höchstens **3** der ≥ 10-Perioden-Jahresscheiben mit negativem Mittel, **und** kein Jahr trägt mehr als **60 %** der Gesamtsumme der Periodenüberschüsse | gegen „ein Jahr trägt alles" |
| **T-7 Ausbuchung** | `netto` > 0 in **allen drei** Empfindlichkeitsvarianten (haupt / streng / milde) | die Überlebensverzerrung darf das Vorzeichen nicht drehen |
| **T-8 Kosten** | `netto` > 0 auch mit der **Eröffnungs-Hürde** (Faktor 1,81–2,07 der Spannen-Studie) statt der mittleren | wir führen zur Eröffnung aus |

**Placebo im selben Lauf:** die Zufalls-Kontrolle aus Teil 1 (12 Ziehungen je Frequenz) wurde auf
demselben Panel gefahren und bestand. Sie wird für Teil 2 **nicht** neu gefahren; ihre Zahlen stehen in
`voll/kontrollen.json` und gelten für dieselbe Maschine und dasselbe Panel.

**Ausgabe (Auftrag §4):** besteht ein Kandidat alle Tore, wird zusätzlich ein **Zielportfolio**
geschrieben — `zielportfolio/<datum>.json` mit `datum`, je Papier `kuerzel`, `gewicht`, `klasse`, dazu
Rangfunktion, Frequenz, Signaltag und Ausführungstag. **Besteht nichts, wird kein Portfolio geschrieben;
das ist dann das Ergebnis.** Ein Zielportfolio ist eine Simulationsausgabe, keine Anlageempfehlung.

---

## T2.5 Zwei Warnungen, die in die Vorregistrierung gehören

1. **Die Gründe-Tafel der verschwundenen Reihen darf NICHT als Signal dienen.** Den Grund für das
   Verschwinden einer Reihe (Insolvenz, Übernahme, Zwangs-Delisting …) kennt man **erst nach dem
   Ereignis**. Eine Rangfunktion, die ihn benutzt, ist ein Leck in Reinform — und zwar eines, das die
   Sperrklinke **nicht** fängt, weil die Grunddatei keine Panelzeile ist. Die Tafel dient in dieser
   Studie **ausschließlich** der richtigen Rückrechnung beim Ausbuchen (§3.6 Teil 1). Keine der vier
   Rangfunktionen liest sie; `test.js`-Prüfung T2-P5 hält das fest.
2. **Kein Nachlegen.** Wer nach dem Ergebnis eine fünfte Rangfunktion nachreicht, ändert die Testzahl und
   damit die Bonferroni-Schranke rückwirkend. Neue Ideen kommen in einen **Teil 3 mit eigener
   Vorregistrierung**. Das gilt auch für das Umdrehen einer Richtung nach dem Blick aufs Ergebnis: die
   Richtung jedes Kandidaten steht in §T2.3, das Short-Dezil ist Diagnose und kein zweiter Test.

---

## T2.6 Prüfungen (Ergänzung zu `test.js`)

Neu, zusätzlich zu den 47 Prüfungen aus Teil 1:

- **T2-P1** Die vier Rangfunktionen erzeugen auf dem echten Panel **0** Verstöße der Leck-Sperrklinke.
- **T2-P2** Jede Rangfunktion liefert auf einem kleinen Kunstfall den **von Hand nachgerechneten** Wert
  (5-Tage-Rendite, sd über 60, Verhältnis zum Maximum, Umsatz durch Median × Vorzeichen).
- **T2-P3** `perioden[]` eines Laufs hat genau `perioden` Einträge, die Datumsangaben sind aufsteigend und
  ohne Dublette, und das Mittel über `perioden[].netto` stimmt mit `netto.mittel` auf 1e-9 überein.
- **T2-P4** Die Monatszuordnung aus §T2.2.3 ist eindeutig: keine zwei Perioden tragen denselben Monat.
- **T2-P5** Keine der vier Rangfunktionen ruft `K.gruende()` oder liest `GRUENDE_DATEI` (Warnung 1).
- **T2-P6** Der Leser der Referenzdatei liefert für drei von Hand nachgeschlagene Monate exakt den Wert
  aus der Datei und verwirft den Jahresblock.
- **T2-P7** Die Korrelationsfunktion liefert auf konstruierten Paaren exakt ±1 und 0.

---

*Geschrieben 2026-09-15, vor der ersten Zahl von Teil 2. Nur Lesezugriff auf Archiv und Referenzdatei.
Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.*
