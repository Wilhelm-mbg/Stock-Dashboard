# REGEL — Auftrag Nr. 89: VWAP-Trend (veröffentlichte Regel) und EMA-Stapel auf QQQ, SPY, IWM

Festgelegt vom PM am 04.10.2026, **bevor es eine Zahl gibt**. Teil A ist §2 des Auftrags
(`uebergabe/auftrag-reel-strategien-2026-10-04.md`) wörtlich. Teil B sind die Lesarten des Studien-Chats — festgehalten vor dem
ersten Lauf, zusammen mit Code und Tests im Siegel-Commit. Teil C ist, was vor dem Siegel an den Daten gezählt wurde (nur Aufbau und
Vollständigkeit, keine Erträge, keine Signale).

## A. Die Regeln (§2 des Auftrags, wörtlich)

## 2. Die Regeln (vom PM festgelegt, bevor es eine Zahl gibt — nicht ändern; was nicht geht, melden statt anpassen)

**2.1 VWAP des Tages.** Nach jeder regulären Kerze t: `VWAP_t = Σ(HLC × Umsatz) / Σ Umsatz` über alle regulären Kerzen des Tages bis
einschließlich t, mit `HLC = (Hoch + Tief + Schluss) / 3`. Kein Vor- oder Nachbörsenhandel.

**2.2 Regel R1 „VWAP-Trend" (wie im Papier).** Nach dem Schluss der ersten regulären Kerze: Schluss über VWAP → long, darunter → short
(gleich → keine Position, bis es sich unterscheidet). Danach nach jedem Kerzenschluss: Schluss über VWAP → Ziel long, unter VWAP → Ziel
short, gleich → Position bleibt. Gewechselt wird nur auf Schlusskurse, nie innerhalb einer Kerze. Am Schluss der letzten regulären Kerze
des Tages wird glattgestellt; nichts bleibt über Nacht. Größe: bei jedem Einstieg das ganze aktuelle Vermögen, kein Hebel, Bruchstücke
erlaubt.

**2.3 Regel R2 „EMA-Stapel" (Nachbau der im Reel genannten Zutaten durch den PM — nicht seine Regel).** EMA 9, 21 und 50 auf den
Schlusskursen der regulären 1-Minuten-Kerzen, fortlaufend über die Tage (kein Neustart am Morgen), `α = 2/(n+1)`, Startwert = erster
Schlusskurs des Fensters; die ersten 250 Kerzen des Archivs erzeugen kein Signal. Zustand nach jedem Kerzenschluss: **long**, wenn
EMA9 > EMA21 > EMA50 und Schluss > VWAP; **short**, wenn EMA9 < EMA21 < EMA50 und Schluss < VWAP; sonst **ohne Position**. Sonst alles
wie R1 (Wechsel nur auf Schlusskurse, abends glatt, ganzes Vermögen).

**2.4 Zwei Fassungen der Ausführung.** **P („wie im Papier"):** gehandelt wird zum Schlusskurs der Kerze, die das Signal gibt.
**N („nächste Eröffnung"):** gehandelt wird zur Eröffnung der nächsten vorhandenen regulären Kerze. **In beiden Fassungen** löst die
letzte reguläre Kerze des Tages keinen Handel mehr aus (ihr Signal wird nicht ausgewertet); die bestehende Position wird zu ihrem
Schlusskurs glattgestellt. **Maßgeblich ist N** (P ist nicht ausführbar: man kennt den Schlusskurs erst, wenn er vorbei ist); P dient der
Eichung am Papier.

**2.5 Kosten.** `c` Basispunkte auf jeden gehandelten Betrag: jeder Einstieg kostet `c` × Betrag, jeder Ausstieg `c` × Betrag — auch der
erste Einstieg des Tages und das Glattstellen am Abend; ein Wechsel von long nach short ist Ausstieg plus Einstieg, also zweimal. Leiter:
`c` = 0 · „Papier" (0,0005 $ je Aktie, keine Slippage) · 0,1 · 0,25 · 0,5 · 1,0 · 1,5. **Vorher festgelegte Lesarten:** `c = 0,25` =
„Aktie, realistisch" (halbe Spanne von 1 Cent bei Kursen von 150 bis 700 $ plus etwas Rutsch); `c = 1,0` = „Options-Hürde, geschätzt vom
PM, nicht gemessen" (Spanne, Kommission und Zeitwertverlust einer Option am Geld mit null bis einem Tag Laufzeit, umgerechnet auf den
Basiswert). Dazu je Lauf die **Kostengrenze `c*`**, bei der der mittlere Tagesertrag null wird (mittlerer Brutto-Tagesertrag geteilt
durch den mittleren Tagesumsatz in Vielfachen des Vermögens).

**2.6 Fenster.** **W-Papier** 02.01.2018–28.09.2023 (das Fenster des Papiers) · **W-Vor** 04.01.2016–29.12.2017 · **W-Nach**
29.09.2023–30.09.2026 (**vom Papier nicht gesehen — hier fällt das Urteil**). Jedes Fenster beginnt mit 100.000.

**2.7 Die Läufe — genau diese, keine weiteren.** Regeln R1 und R2 × Werte QQQ, SPY, IWM × Fassungen P und N × die drei Fenster × die
Kostenleiter. **Hauptlauf: R1, QQQ, Fassung N, W-Nach.** Alles andere steht daneben.

**2.8 Ereignis-Sicht (ohne Ausstiegsregel).** Ereignis R1: ein Kerzenschluss wechselt die VWAP-Seite. Ereignis R2: Eintritt in den
Zustand long oder short aus einem anderen Zustand. Je Ereignis der Ertrag von der Eröffnung der nächsten Kerze bis zur Eröffnung der Kerze
H Minuten später (H = 5, 15, 30, 60; reicht der Tag nicht, entfällt das Ereignis für dieses H), in Richtung des Signals. **Kontrolle:**
davon abgezogen wird der mittlere Ertrag desselben Werts über dieselbe Tagesminute und dasselbe H im selben Kalenderjahr, mit demselben
Vorzeichen (nimmt den Tageszeit-Gang heraus). Je Wert, Regel, Fenster und H: Zahl der Ereignisse, Mittel in Basispunkten, Standardfehler
über Tage gebündelt, t.

**2.9 Kennzahlen je Lauf.** Ein **Trade** ist eine Position vom Einstieg bis zum Ausstieg (ein Wechsel long → short beendet einen Trade
und beginnt den nächsten). **Trefferquote** = Anteil der Trades mit Ertrag größer null nach den Kosten der jeweiligen Stufe (für die
Eichung also bei der Stufe „Papier"). Gesamtertrag, Ertrag p. a., Schwankung p. a., Sharpe (aus Tageserträgen, √252), größter Rückschlag
(aus Tagesendständen), Trades, Trades je Tag, Trefferquote, mittlerer Brutto-Ertrag je Trade in Basispunkten, mittlerer Tagesumsatz (Summe
der gehandelten Beträge eines Tages geteilt durch das Vermögen am Tagesanfang), `c*`; mittlerer Tagesertrag mit
Standardfehler und t (Tageserträge, Newey-West mit 5 Verzögerungen); Kalenderjahre; nachrichtlich der Anteil des Ertrags aus der ersten
Stunde, der Mitte und der letzten Stunde; daneben Kaufen-und-Halten desselben Werts über dasselbe Fenster (Kursertrag, ohne
Ausschüttungen — so benennen).

**2.10 Eichung am Papier (Pflicht vor dem Lauf, ist keine weitere Variante).** R1, QQQ, Fassung P, Kosten „Papier", W-Papier. Das Papier
nennt +671 %, rund 21.967 Trades, Trefferquote rund 17 %, größter Rückschlag 9,4 %, Sharpe 2,1. **Im Rahmen**, wenn Trades 20.000–24.000,
Trefferquote 15–19 % und Gesamtertrag +300 % bis +1.200 %. Außerhalb: anhalten, Ursache suchen (Daten, Lesart der Regel), **nichts
anpassen**, melden. Die Datenquelle des Papiers ist eine andere als unsere — Gleichheit auf die Stelle ist nicht zu erwarten.

**2.11 Die Sätze, die am Ende stehen (vorher festgelegt).** Für den Hauptlauf und — nachrichtlich — für jeden anderen Lauf im Fenster
W-Nach, Fassung N:
- **„hält auch nach Kosten"**: mittlerer Tagesertrag bei `c = 0,25` größer null mit t ≥ 2.
- **„hält nur ohne Kosten"**: bei `c = 0` größer null mit t ≥ 2, aber nicht bei `c = 0,25`.
- **„hält nicht"**: sonst.
- Dazu immer: „verträgt Kosten bis `c*` Basispunkte je Seite" und der Satz zur Options-Hürde: „bei geschätzten 1,0 Basispunkten je Seite
  bleibt … % p. a." (mit dem Vermerk „Hürde geschätzt, nicht gemessen").
Ein Hauptlauf, elf Nebenläufe im Urteilsfenster: die Nebenläufe sind nachrichtlich und werden nicht als weitere Belege gezählt.

**2.12 Ein Lauf.** `REGEL.md` (dieser §2 wörtlich, dazu deine Lesarten), Code und Tests committen (**Siegel-Commit**), Eichung, dann alle
Läufe in einem Durchgang, dann Ergebnis committen. Ein Fehler im Code wird benannt, behoben, wiederholt und unter `korrekturen` vermerkt.
Ein Ergebnis, das nicht gefällt, ist kein Fehler.

## B. Lesarten des Studien-Chats (vor dem ersten Lauf festgehalten)

Keine davon ist ein weiterer Parameter der Regel; jede füllt eine Stelle, an der §2 dem Code eine Entscheidung überlässt.

- **L1 Reguläre Kerze, Handelstag.** Eine Kerze zählt, wenn ihr Stempel in einem Block `regulaer` der Jahresdatei liegt **und** ihre
  Minute nach New Yorker Ortszeit zwischen 09:30 und 15:59 liegt. Ein Block `regulaer` ist ein Handelstag; sein Datum ist das New Yorker
  Datum des Blockanfangs. Ein Tag gehört zu einem Fenster, wenn sein Datum zwischen den beiden Grenzen liegt (beide einschließlich).
  Tage nach dem 30.09.2026 werden nicht gelesen.
- **L2 „Gleich".** Schluss und VWAP gelten als gleich, wenn sie sich um höchstens 10⁻⁹ des Kurses unterscheiden (bei 500 $ ein
  halbes Millionstel Dollar — weit unter jeder Kursstufe). Grund: `(H+L+C)/3` liegt rechnerisch oft ein Bit neben `C`, auch wenn
  H = L = C; ohne diese Schranke würde ein Rundungsrest als Signal gelesen. Die Zahl der Gleichstände wird ausgewiesen.
- **L3 VWAP ohne Umsatz.** Ist die Umsatzsumme des Tages noch null, ist der VWAP nicht definiert und gilt als „gleich" (kein Signal).
  Im Bestand kommt das nicht vor (0 reguläre Kerzen mit Umsatz null).
- **L4 EMA.** Die drei EMA laufen **einmal** über die ganze Reihe, beginnend mit dem ersten regulären Schlusskurs des Archivs
  (04.01.2016, zugleich der erste Tag von W-Vor) — „Fenster" in 2.3 ist als Datenfenster der Studie gelesen, nicht als jedes der drei
  Auswertungsfenster. Kein Neustart am Morgen, keiner an einer Fenstergrenze. Gesperrt sind die Kerzen 1 bis 250 des Archivs. (Nach 250
  Kerzen wiegt der Startwert im EMA 50 weniger als 0,01 %; ein Neustart je Fenster änderte höchstens den ersten Tag.)
- **L5 Kosten und Größe.** Einstieg zum Preis `p` mit Vermögen `E`: Stückzahl `q = E / (p + g)`, mit Gebühr je Stück `g = c × p`
  (Stufe „Papier": `g = 0,0005 $`). Kaufbetrag plus Gebühr ist also genau das Vermögen — kein Hebel. Ausstieg zum Preis `p'` mit
  `g' = c × p'` (bzw. 0,0005 $): long `E' = q × (p' − g')`, short `E' = q × (2p − p' − g')`. Gehandelter Betrag ist jeweils `q × Preis`.
  Short ohne Leihgebühr, kein Zins auf Bargeld.
- **L6 Trade.** Brutto-Ertrag eines Trades: long `p'/p − 1`, short `1 − p'/p`. Netto-Ertrag: `E'/E − 1` (mit Einstiegs- und
  Ausstiegsgebühr der Stufe). Trefferquote = Anteil der Trades mit Netto-Ertrag größer null.
- **L7 Tagesumsatz und Kostengrenze.** Tagesumsatz = Summe aller `q × Preis` des Tages (Einstiege und Ausstiege) geteilt durch das
  Vermögen am Tagesanfang. `c*` = mittlerer Tagesertrag des Laufs mit `c = 0` geteilt durch dessen mittleren Tagesumsatz, in
  Basispunkten. Das ist die lineare Näherung des Auftrags; die Prüfung zeigt, dass der mittlere Tagesertrag bei `c = c*` bis auf einen
  kleinen Rest null ist.
- **L8 Ertrag p. a., Schwankung, Sharpe, Rückschlag.** Ertrag p. a. = `(Endstand / 100.000)^(252 / Handelstage) − 1`. Schwankung =
  Standardabweichung der Tageserträge (Stichprobe) × √252. Sharpe = Mittel / Standardabweichung × √252, ohne Abzug eines Zinses.
  Größter Rückschlag aus den Tagesendständen; der Startwert 100.000 zählt als erster Gipfel.
- **L9 Newey-West.** Bartlett-Gewichte `1 − l/6` für die Verzögerungen `l` = 1 bis 5; Standardfehler des Mittels = Wurzel aus
  (Langfrist-Varianz / Zahl der Tage); Varianzen mit Teiler T.
- **L10 Tageszeit-Anteile.** Das Vermögen wird zu jedem Kerzenschluss bewertet (offene Position zum Schlusskurs, Gebühren im Moment
  des Handels gebucht); die logarithmische Änderung von Schluss zu Schluss wird der Kerze zugerechnet, in der sie entsteht. Erste Stunde
  = Kerzen vor 10:30; letzte Stunde = die letzten 60 Minuten vor dem Sitzungsende (15:00–15:59; an verkürzten Tagen 12:00–12:59);
  Mitte = der Rest. Verkürzt ist ein Tag, dessen letzte Kerze vor 13:00 liegt. Anteil = Summe des Eimers / Summe aller drei.
- **L11 Kaufen-und-Halten.** Eröffnung der ersten regulären Kerze des Fensters bis Schluss der letzten; p. a. wie L8. Kursertrag aus
  rohen Kursen, ohne Ausschüttungen.
- **L12 Ereignisse.** R1: der Zustand wechselt innerhalb eines Tages von long nach short oder umgekehrt (ein Gleichstand hält die
  Seite; die erste Seite des Tages ist kein Wechsel). R2: der Zustand ist long oder short und weicht vom Zustand der Vorkerze ab; vor
  der ersten Kerze des Tages gilt „ohne Position" (wie in der Handelsregel, die über Nacht glatt ist). Das Signal der letzten Kerze des
  Tages ist kein Ereignis (es gibt keine nächste Kerze).
- **L13 „H Minuten später".** Einstieg ist die Eröffnung der nächsten vorhandenen regulären Kerze nach der Signalkerze. Ziel ist die
  Eröffnung der ersten vorhandenen regulären Kerze desselben Tages, deren Stempel mindestens H Minuten nach dem Einstieg liegt; gibt es
  keine, entfällt das Ereignis für dieses H.
- **L14 Kontrolle.** Mittel desselben Vorwärtsertrags (dieselbe Einstiegsminute, dasselbe H) über **alle** Handelstage desselben
  Kalenderjahrs im Archiv bis zum 30.09.2026 — unabhängig von den Fenstergrenzen (2023 liegt in zwei Fenstern). Der Tag des Ereignisses
  ist im Mittel enthalten. Abgezogen wird mit dem Vorzeichen des Signals.
- **L15 Standardfehler der Ereignis-Sicht.** Bündel = Handelstag. Mit `S_d` = Summe der Überschüsse des Tages, `n_d` = Zahl seiner
  Ereignisse, `N` = alle Ereignisse, `G` = Tage mit Ereignis, `m` = Mittel: `SE = Wurzel( G/(G−1) × Σ (S_d − n_d × m)² ) / N`.
- **L16 Der Satz.** `t` in 2.11 ist das Newey-West-t des mittleren Tagesertrags (L9). „Größer null mit t ≥ 2" heißt: Mittel > 0 und
  t ≥ 2.
- **L17 Lücken.** Tage mit fehlenden Kerzen werden gehandelt, wie sie im Archiv stehen: die letzte **vorhandene** reguläre Kerze ist
  die letzte des Tages; ein Tag mit einer einzigen Kerze hat keinen Handel und den Tagesertrag null. Nichts wird aufgefüllt, kein Tag
  ausgeschlossen.
- **L18 Reihenfolge am Tag.** Fassung N: das Signal der Kerze `i` wird zur Eröffnung der Kerze `i+1` gehandelt; das Signal der
  vorletzten Kerze wird also noch zur Eröffnung der letzten gehandelt und die Position zu deren Schluss glattgestellt.
- **L19 Rahmen der Eichung.** Geprüft werden genau die drei Größen aus 2.10 (Trades, Trefferquote, Gesamtertrag); Rückschlag und
  Sharpe stehen daneben. `lauf.js` startet die Läufe nur, wenn `eichung.json` vom selben Siegel stammt und „im Rahmen" sagt.

## C. Vor dem Siegel gezählt (nur Aufbau und Vollständigkeit; `zaehlen.js`, `zaehlen-luecken.js`, `daten-zaehlung.json`)

- Je Wert **2.701 Handelstage** vom 04.01.2016 bis 30.09.2026, bei allen drei Werten dieselben Tage. Fenster: W-Vor 503, W-Papier
  1.445, W-Nach 753 Tage.
- Reguläre Kerzen: QQQ 1.048.717 · SPY 1.049.506 · IWM 1.049.503. Je Tag: 2.672 Tage mit genau 390 Kerzen, 21 verkürzte Tage mit genau
  210 Kerzen.
- Tage unter 380 Kerzen: QQQ 28 (21 verkürzte + 7), SPY 26 (21 + 5), IWM 26 (21 + 5). Die unvollständigen: 09., 12., 16. und
  18.03.2020 je 376 Kerzen bei allen drei Werten (Handelsunterbrechungen); **QQQ 02.05.2018 und 03.05.2018 nur die Kerze 09:30**
  (die Jahresdatei führt an diesen Tagen fast nichts — Lücke der Quelle, im Fenster des Papiers); QQQ 22.02.2016 340 Kerzen (50 fehlen:
  zwischen 10:25 und 11:12 sowie zwischen 11:13 und 11:18); SPY 12.08.2019 360 Kerzen (Ende 15:31), IWM 12.08.2019 357 Kerzen (Ende 15:30).
- Erste Kerze immer 09:30. Keine Kerze mit Umsatz null, kein Widerspruch zwischen Hoch/Tief und Eröffnung/Schluss, keine unsortierten
  oder doppelten Stempel, keine regulären Kerzen außerhalb 09:30–15:59.
- Splits im Fenster: **keine** (Maßnahmen-Dateien, Stand 03.09.2026: nur Barausschüttungen — QQQ 44, SPY 40, IWM 42). Gegenprobe am
  Bestand bis 30.09.2026: kein Sprung über Nacht von mehr als 20 % bei einem der drei Werte.
