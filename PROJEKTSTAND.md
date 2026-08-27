<!-- PM-STAND
letzter-bericht: 2026-08-27 13:45 (Windows-Uhr)
gesehener-tag: v8.33.5
pm-adresse: markt-dashboard-f5 [5204c6]
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## 📋 NACHTBILANZ 27.08. — die 30-Sekunden-Fassung *(Stand 03:00 echter Zeit)*

> **🕐 Zu den Uhrzeiten in diesem Abschnitt und darunter:** Die Überschriften der Nacht tragen
> **vom PM geschätzte** Zeiten, die gegen Ende **bis zu ~35 Minuten vorlaufen**. Maßgeblich ist
> allein der `letzter-bericht`-Stempel im Kopf dieser Datei — er wird abgelesen, nicht
> geschätzt. **Operativ wichtig und in echter Zeit: die Archivsperre auf `archiv1d` fällt
> gegen 03:38.** *(Zweiter Anlauf: derselbe Fehler war um 01:15 schon einmal korrigiert
> worden.)*

**Ertrag der Nacht: null neue Kanten, sieben verhinderte Datenverluste — und eine Messung, die
den Streit beendet.** Der Belegstand bleibt **0 von 12**. Siebenmal wurde eine Reparatur, eine
Zahl oder eine Deutung angehalten, die echte Kurse zerstört oder ein falsches Urteil getragen
hätte — **dreimal traf es den PM, zweimal Vorgaben der QS, zweimal eigene Befunde der
Sitzungen.** Gefunden hat es jedes Mal eine Gegenprobe, nie ein Verdacht.

> ### ✅ DIE DOCHT-FRAGE IST BEANTWORTET (03:15) — der Effekt hebt sich auf
> **Vorregistriert gefragt, gepaart gemessen, Maßstab vor dem Lauf fixiert:** Entfernt man alle
> verdächtigen Kerzen (76.339 von 14,66 Mio = 0,52 %), ändert sich am Überschuss **bei allen
> drei Strategien praktisch nichts** — der Abstand zur Entscheidungsschwelle liegt beim
> **6- bis 27-Fachen**. Placebos beider Arme unauffällig, identischer Archivstand für beide
> Arme.
>
> **→ Damit ist die Reparatur, um die diese Nacht gestritten wurde, für die MESSSEITE
> gegenstandslos.** *Was bleibt, ist die Frage der Archiv-Sauberkeit — und die ist Entscheidung
> 1 unten.*

## 🔄 27.08. 13:0x — **EINE POSITIVKONTROLLE HAT DIE SEMANTIK UMGEDREHT, vor dem ersten Abruf**

**Der Analytiker wollte die 534 Einzelsprünge sortieren („Sprung mit Split-Beleg = echt"). Die
vorgeschriebene Positivkontrolle an `WHLR` fand statt der erwarteten 16 nur 5 — und der Grund
kippt die ganze Regel:**

> ### **Ein RÜCKANGEPASSTES Archiv zeigt an Split-Daten GAR KEINEN Sprung — die Anpassung glättet ihn weg.**
> **→ Ein Sprung AN einem Split-Datum ist deshalb nicht der Split, sondern der ANPASSUNGSFEHLER.**

**Gemessen, nicht überlegt:** *AAPL/NVDA/TSLA mit zusammen ~12 echten Splits zeigen im
Tagesarchiv **0 Sprünge** an Split-Daten. AAPLs einziger Faktor-2-Sprung überhaupt (29.09.2000,
−52 %) ist der bekannte reale Kurssturz.*

**🎯 Die Umkehrung macht den Lauf WERTVOLLER:** *Die Grundrate misst jetzt nicht „wie viele echte
Splits", sondern **wie oft die Anpassung versagt hat** — eine Zahl, die dieses Projekt noch nie
hatte.* **Und die Kontrolle hat dabei selbst einen Fund gemacht: `WHLR` 03.04.2017, Sprung
r = 8,24 exakt auf dem belegten 8:1-Split — dieselbe Fehlerklasse wie der heutige Fall, neun
Jahre alt, bisher unbekannt.**

**Fassung 2, vor dem Abruf fixiert, Widerlegung offengelegt:** **`F`** = Anpassungsfehler-Koinzidenz
(Datum ±1 HT **und** Faktor ±10 %, Richtung benannt) · **`U`** = kein Split, **unentscheidbar mit
diesen Endpunkten** (Markt/Spin-off/Skalenfehler — **nie „RGR-Verdacht"**) · **`X`** = nicht
prüfbar. *K1 (angepasste Reihen → 0 Koinzidenzen) und K2 (bekannter Fehler → F) bestanden.
**Fassung 1 bleibt als Geschichte im Dokument** — eine widerlegte Fassung, die verschwindet,
kommt in vier Wochen als neue Idee zurück.*

> **🔴 ZWEI PM-NACHFORDERUNGEN vor dem 275er-Lauf:**
> **1. Der NULLWERT fehlt.** *Wie oft träfe ein Sprung ein Split-Datum ±1 HT **rein zufällig**?
> 534 Sprünge über Jahrzehnte gegen die Split-Dichte derselben Reihen.* **Läge die Zufallsquote
> bei 3 % und man findet 5 % F, ist fast nichts belegt.** *Diese Nacht hat mehrfach gezeigt, dass
> ein Detektor ohne Gegenrechnung seiner Feuerrate alles und nichts beweist (`kanalUeber`:
> 52,7 % der Kerzen, Güte 75).*
> **2. `F?` als vierte Klasse — Datum trifft, Faktor NICHT.** *Sonst verschwindet die
> verdächtigste Klasse von allen in `U`: die **teilweise oder falsch durchgeführte** Anpassung —
> genau der heutige WHLR-Fall (26.08. ↔ 27.08.).* **`U` heißt „unentscheidbar", was diese Fälle
> gerade nicht sind: bei ihnen weiß man, dass etwas nicht stimmt, nur nicht was.**

---

## ✅ 27.08. 13:0x — Wilhelms neue Freigabeschwelle ist prüfbar hinterlegt (`06`, `9285468`)

**`kostenStreuung()` in `kosten.js` — eine reine Zählregel, kein Automat.** *Zählt über das
`krypto`-Feld (der Kommentar warnt ausdrücklich vor der `basis`-Lesart, mit den Zahlen
38-gegen-16). **Die Zielrundenzahl ist per Ratsche aus `depot.js` verbannt** — der Status zeigt
die erreichte Streuung statt „n von ~20".*

**Damit die Marktlagen-Seite überhaupt aus Daten zählbar wird, stempelt jede NEUE Runde die am
validierten R-TREND-Anker abgelesene Lage.** *Kein erfundenes Merkmal, sondern ein Instrument mit
eigener Validierung (t = 3,2).* **Und: Alt-Runden ohne Feld zählen als „nicht erfasst", NIE als
Lage** — *sonst hätte sich eine fehlende Angabe als „irgendeine Lage" getarnt.*

**Sperrklinke funktional durchgespielt:** *die Klickfolge vom 25.08. erfüllt nie · zwei Tage in
derselben Lage reichen nicht (**beide Wörter zählen**) · eine Krypto-Runde mit `basis=true`
verschiebt nichts · eine Runde ohne Lagen-Feld gibt sich nicht als Lage aus.* **Alle vier sind
Fälle, in die wir heute schon einmal gelaufen sind.**

**Nachgemessen statt abgeschrieben:** *gegen die Sicherung von 02:45 — 38 Runden, davon 16
Nicht-Krypto, **alle am 25.08., null erfasste Marktlagen** → **nicht erfüllt, Zähler bei 1 Tag**.*

> ### ⚠ NACHGEMESSEN: **die Schwelle ist VIEL strenger, als sie klingt** *(`06` an `depot.js:2449 ff.`, abgelesen statt erinnert)*
> **Der R-TREND-Anker kennt genau ZWEI Lagen plus einen Nicht-Zustand:** *letzter SPY-Stundenschluss
> gegen die EMA200 → `true` (über) / `false` (unter) / `null` (keine tragfähige Reihe, < 220 Kerzen
> oder Abruffehler). Der Stempel bildet das 1:1 ab; `null` → Feld bleibt leer, Runde zählt als
> „nicht erfasst".*
>
> **→ Bei zwei möglichen Lagen heißt „≥ 2 erfasste Marktlagen": mindestens eine Runde im
> AUFWÄRTS- UND eine im ABWÄRTSREGIME.**
>
> ***„Das lässt sich nicht erklicken und nicht erwarten, sondern nur abwarten — der Markt muss
> dafür tatsächlich einmal die Seite wechseln."*** **Die Tage-Bedingung ist lange vorher erfüllt;
> der bindende Teil wird die Marktlage.** *Das kann Wochen dauern und ist von niemandem hier
> beeinflussbar.*
>
> ### ⭐ **ENTSCHIEDEN 13:2x — WILHELM: „FEINERE LAGEN ZULASSEN."**
> **Zusätzliche Zustände stempeln — Stress/ruhig wie bei der Kapitulations-Kante.** *Dann gibt es
> mehr als zwei Lagen, die Schwelle wird in **Wochen statt Monaten** erreichbar und misst
> trotzdem verschiedene Marktzustände.*
> **→ Erweiterung des STEMPELS, nicht der Zählregel** *(die zählt einfach verschiedene Werte).*
> **Vergeben an `06`.** *Er hat weder „so lassen und warten" noch „Tage reichen, Lage nur
> ausweisen" gewählt — **die Marktlage bleibt eine Bedingung**, sie wird nur feiner aufgelöst.*
>
> *Nebenbemerkung von `06`, der Vollständigkeit halber: der 30-Minuten-Zwischenspeicher bedeutet,
> dass eine Runde bei einem Seitenwechsel innerhalb einer halben Stunde noch die alte Lage trüge
> — **für eine Schwelle über Tage belanglos**, aber gesagt.*

---

## 🔴 27.08. 13:2x — **DIE 9:1 IST WIDERLEGT. Es ist ein Münzwurf** *(von der QS an sich selbst)*

> ### ⛔ **Alles unten mit „9:1" und „`archiv1d` hat recht" ist ÜBERHOLT. Nicht zitieren.**

**Geschichtet über die ganze Größenordnung statt nur über die größten Abweichungen:**

| | |
|---|---:|
| nur `archiv1d` richtig | **10** |
| nur `archiv60m` richtig | **9** |
| beide | 0 |
| keins | 1 *(WSM)* |

> ***„Mein erster Lauf hat nicht gemessen, wer öfter recht hat, sondern wer bei den GRÖSSTEN
> AUSREISSERN recht hat."*** *Die zehn Fälle waren nach Abweichungsgröße sortiert und die
> größten genommen — bei den kleineren dreht es sich.*
>
> ### **KEIN ARCHIV IST SYSTEMATISCH IM RECHT. Widersprechen sie sich, kann jedes von beiden falsch sein.**

**🎯 Die Selbstkritik ist das Lehrstück, und sie gehört wörtlich hierher:**
> *„Ich habe vorhin gewarnt, die Zehnerstichprobe sei auf **Uneinigkeit** ausgewählt und deshalb
> keine Fehlerrate. Das stimmte. **Ich habe dabei übersehen, dass sie zusätzlich auf GRÖSSE
> ausgewählt war** — und genau das hat das Ergebnis erzeugt. **Ich habe die eine Verzerrung
> benannt und die zweite im selben Satz mitgeliefert.**"*

### ✅ DIE GUTE NACHRICHT ZUERST — **Massive ist als Zeuge tauglich, und Einigkeit heißt Richtigkeit**
**Wo die beiden Archive einig sind, bestätigt Massive sie: 8 von 8**, *auf die Stelle genau (nur
TPL 365,1615 gegen 365,1600).*

### 📏 DIE DREI NACHGEFORDERTEN ZAHLEN

**1. Größenordnung — messrelevant, keine Kosmetik.** *p50 **0,062 %** (unter der Kostenhürde),
p90 **0,597 %** (Sechsfaches), p99 **2,349 %**. Die betroffenen Fälle liegen definitionsgemäß
über 0,2 %, also beim Doppelten der Hürde.*

**2. Hoch oder Tief — deutlich asymmetrisch:**

    Tief weicht ab : 270 von 5.728   (4,71 %)
    Hoch weicht ab : 117 von 5.728   (2,04 %)

> **Das TIEF ist mehr als doppelt so oft betroffen — und bei einer Stopp-Regel auf der
> Long-Seite ist genau das die gefährliche Seite.**

**3. ✅ SCHLUSSKURSE SIND SAUBER** *— die gute Nachricht, ausgesprochen:* **Massive trifft den
`archiv1d`-Schluss 20 von 20, den `archiv60m`-Schluss 19 von 20** — *und zwar in genau den
Fällen, wo Hoch oder Tief auseinandergehen.* **Der Schaden ist auf Hoch und Tief begrenzt.**

### 📊 RATE ÜBER DAS GANZE ARCHIV — **ausdrücklich als Zusammensetzung gekennzeichnet**

    Uneinigkeit ueber 0,2 %                6,67 % der Reihen-Tage   <- gemessen
    davon 60m falsch (rund die Haelfte)    ca. 3,2 %                <- aus 20 Faellen geschaetzt
    davon 1d  falsch (rund die Haelfte)    ca. 3,2 %                <- dito
    Schlusskurse                           unauffaellig

**→ WAS DAS FÜR DIE NEUN STRATEGIEN AUF `60m` HEISST:** *rund **drei von hundert Reihen-Tagen**
haben ein falsches Hoch oder Tief, **überwiegend das Tief**, typisch zwischen 0,2 und 0,6 %.*
**Wer nur Schlusskurse liest, ist unberührt. Wer Stopps, Ausbrüche oder Kanalgrenzen rechnet,
trifft es.**

> **❓ OFFEN und ausdrücklich NICHT beantwortet:** *„Ob das eine gemessene Kante verschiebt, weiß
> ich nicht — das hängt daran, wie oft ein Signal genau an so einem Tag auf genau so einem Wert
> steht. **Das wäre eine Messung der Mess-Seite und nicht meine.**"* **Noch niemandem zugeteilt.**

---

## ~~⚖ 27.08. 12:4x — DER DRITTE ZEUGE SPRICHT~~ *(ÜBERHOLT — siehe oben)*

**Massive gegen beide Archive, zehn Fälle, Toleranz 0,2 %** *(ausgewählt auf **Uneinigkeit** — die
Frage war „wer hat recht, wenn sie sich widersprechen", und die ist beantwortet)*:

| | | |
|---|---:|---|
| **`archiv1d` bestätigt** | **9** | |
| `archiv60m` bestätigt | **1** | *`GOVT`* |
| keins | 0 | |

**In sechs Fällen war das 60m breiter — die Extreme gab es nicht** (Massive und `1d` sagen
übereinstimmend etwas anderes). **In drei von vier Fällen, wo es enger war, hat es echte Extreme
nicht.** *`WHLR` als Kontrolle: Massive bestätigt `1d` mit 1,36–1,50, das 60m steht bei
0,34–0,37 — **der Faktor 4 ist als 60m-Fehler belegt**, und das deckt sich mit dem unabhängigen
Split-Befund (Reverse Split 4:1). **Zwei verschiedene Endpunkte, dieselbe Antwort.***

> **⚠ `GOVT` IST DER GEGENFALL UND GEHÖRT DAZU:** *`archiv1d` hat dort ein Hoch von **23,53**,
> das **weder Massive noch das 60m-Archiv** kennen.* **Auch der Tagesbalken ist nicht fehlerfrei
> — er ist nur deutlich seltener falsch.** *Ein 9:1 ohne diesen Gegenfall würde als „1d ist
> richtig" gelesen, und das steht da nicht.*

> ### ⚖ RICHTIGSTELLUNG — **die QS nimmt ihren „Normalzustand"-Satz zurück, und der PM seinen Sprung**
> **Auf der Tafel stand:** *„Wenn in fast jedem fünften Reihen-Tag eine gewöhnliche Sitzungsstunde
> ein Extrem außerhalb der Tagesspanne trägt, dann ist ‚außerhalb der Tagesspanne' ein häufiger
> **Normalzustand** und **kein Fehlermerkmal**."*
>
> **Der erste Teil stimmt weiter, der zweite ist widerlegt** — *in sechs von sechs geprüften
> Fällen war das 60m-Extrem **nicht echt**.*
>
> **Richtig ist:** *„Außerhalb der Tagesspanne" **kommt häufig vor** UND ist bei Abweichungen
> über 0,2 % nach dem dritten Zeugen **überwiegend ein Fehler des 60m-Archivs**.*
>
> ***Der Sprung von der Häufigkeit zur Harmlosigkeit war meiner, nicht ihrer.*** *Sie hatte
> „kommt häufig vor" gemeldet; ich habe daraus „ist normal, also kein Fehlermerkmal" geboardet.*
> **Option (c) bleibt aus dem anderen Grund erledigt.**

**Mengenverhältnis über zwei Normaltage, > 0,2 %: 348 Fälle mit 60m breiter gegen 34 mit 1d
breiter.** *Erweiterung auf 30–40 Fälle läuft (~8 Min) — **bei 9:1 aus zehn Fällen ist die
Richtung klar, die Rate nicht.***

> **🔴 OFFENE FRAGE, VOM PM GESTELLT, weil sie über die Größe entscheidet:** **Auf `archiv60m`
> laufen neun von zwölf Strategien.** *Sind Hoch und Tief dort über 0,2 % in beiden Richtungen
> unzuverlässig, trifft das **jede Regel, die Hoch oder Tief liest** — Stopps, Ausbrüche, ORB,
> Kanalgrenzen.* **Beim erweiterten Lauf zusätzlich zu beziffern:** *Größenordnung gegen die
> Kostenhürde (0,10 Pp)? · Hoch und Tief gleich betroffen? · **Sind die SCHLUSSkurse auch
> betroffen** — falls nein (und die 20:00-Kerze trifft den amtlichen Schluss zu 99,33 % exakt),
> **ist der Schaden auf Hoch/Tief begrenzt, und das gehört ausgesprochen**.*
>
> **⚠ Und die Auswahl bleibt zu nennen: die zehn wurden auf UNEINIGKEIT ausgewählt.** *Die
> Fehlerrate über das ganze Archiv ist eine andere Frage als „wer hat recht, wenn sie sich
> widersprechen" — **nur die zweite ist gestellt worden**.*

---

## 🔑 27.08. 12:1x — **DIE ZWEITE QUELLE LAG IM HAUS. Vier Stränge sind für 0 € arbeitsfähig**

**Der vorhandene `massive.key` schaltet Splits und Dividenden frei.** *Zehn lesende Abrufe,
beide Richtungen geprüft (AAPL 5 Splits zurück bis 1987, ARM korrekt leer), nichts angemeldet,
kein 401/403.* **Wilhelm hatte heute früh eine Anbieter-Recherche beauftragt — die Quelle war
schon da.**

### 🔴 UND DER NEUFUND IST GRÖSSER ALS DIE ANTWORT: **die Fehlrichtung ist je Reihe VERSCHIEDEN**

| Reihe | wer hat recht | Ereignis |
|---|---|---|
| **RGR** | **`1d` stimmt** | **KEIN Split** in der ganzen Firmengeschichte — 60m vor dem 24.10.2025 um **Faktor 2,674 zu hoch**, fällt an dem Tag **ohne jedes Ereignis** auf die 1d-Linie |
| **WHLR** | **`60m` stimmt** | Reverse Split 4:1, **heute** ausgeführt; 1d hat ihn bis 25.08. eingearbeitet, **den 26.08. roh gelassen** |
| **BYND** | **`60m` stimmt** | Reverse Split 30:1 am 14.08.; 1d-Historie blieb auf der alten Skala |
| **SITC** | mechanisch `60m` | Faktor 3,361 **ohne Ereignis** — *was es war, geben diese Endpunkte nicht her (naheliegend Spin-off)* |
| **B** | **keine Versatz-Frage** | **Ticker-Neuvergabe** — Dividendenreihe bricht, Quote **driftet** statt konstant: **zwei Firmen unter einem Kürzel.** Braucht **Trennung**, kein Schiedsurteil |

> ### 🔴 EINSCHRÄNKUNG 13:4x (QS) — **den fünf Urteilen fehlt die ZEITANGABE**
> **`WHLR`, dieselbe Reihe, zwei Zeitpunkte, zwei verschiedene kaputte Seiten:**
>
>     2026-08-25   Massive 1,3600-1,4960 = archiv1d      ->  das 60m ist kaputt (Faktor 4)
>     Sept. 2024   archiv1d traegt 6,8 bis 62 MILLIONEN $ bei Umsaetzen 0-13 Stueck
>                                                        ->  das 1d ist kaputt
>
> ***„Bei WHLR ist das `1d` kaputt" ist ohne Zeitangabe zur Hälfte falsch — und zwar genau für
> den AKTUELLEN RAND, also für den Zeitraum, den eine Messung am ehesten liest."***
>
> **→ Die fünf Urteile bekommen Zeiträume. Ein Urteil ohne Zeitraum liest sich als „immer" —
> und dann repariert jemand in vier Wochen den falschen Rand.**
> **→ Und das Urteils-Gerüst muss je SEGMENT urteilen, nicht je REIHE.** *Ein Reihen-Urteil ist
> bei so einer Reihe **notwendig falsch für einen Teil des Zeitraums** — und es fällt nicht auf,
> weil es für den geprüften Ausschnitt stimmt.*
>
> *Fair gekennzeichnet von der QS: **ein Datenpunkt je Reihe** — „zu wenig, um den Befund zu
> bestreiten, aber genug, um ihn einzuschränken".*
>
> **⚠ Nebenwirkung der Semantik-Umkehrung, ebenfalls von der QS:** *„Ich hatte **ARWR, BYRN und
> ASTH** als ‚mehrfache Splits illiquider Papiere' abgetan, also als **harmlos**. Nach der neuen
> Regel sind ihre Sprünge **Anpassungsfehler**. Ich hatte die Sprünge als Beleg für Splits
> gelesen, wo sie das Gegenteil belegen."* **Drei Reihen, die als erledigt galten, sind wieder
> Kandidaten** — *BYRN und ASTH stehen in der F1-Verworfenen-Liste.*

> ***„Ein Archiv ist rückangepasst, das andere nicht" stimmt als pauschale Richtung NICHT.***
> **Eine pauschale Reparatur hätte mindestens eine Reihe falsch herum angefasst** — *und zwar
> in der Richtung, in der sie „repariert" aussieht.*
>
> **⚠ NEUNTE VERHINDERTE DATENZERSTÖRUNG — und die erste, die einen laufenden PM-Auftrag traf.**
> *Ich hatte `c4` eine halbe Stunde vorher beauftragt, genau diese Reparatur zu untersuchen —
> **mit dieser Prämisse im Auftragstext**. Meine Auflage „beide Richtungen prüfen" meinte
> Erkennungsfehler und hätte die Sache **nicht** gefangen.* **Auftrag sofort umgeleitet.**

**✅ Und der Auftrag wurde dadurch nicht nur sicherer, sondern EINFACHER:** *Ein Split ist ein
**belegtes Ereignis mit Datum und Faktor**, kein aus dem Kursverlauf erratenes Muster.* **Drei
der vier Zulässigkeits-Bedenken des Tüftlers fallen weg** — keine Rückwärtsschau, keine Auswahl
nach der Zielgröße. *Aus einem Ratespiel ist ein Abgleich gegen einen unabhängigen Zeugen
geworden.*

**Nicht beantwortbar, ausdrücklich benannt:** Vollständigkeit vor ~2017 nur punktuell belegt ·
**Spin-offs und Ticker-Events stehen nicht in diesen zwei Endpunkten** · Dividendenlisten nicht
gegen eine zweite Quelle geprüft. **Der harte Rest sind RGR und SITC: ein Sprung OHNE Ereignis
ist entweder ein Archivfehler oder ein Ereignis, das diese Endpunkte nicht führen.**

**→ Die Skalenwechsel (S1) sind vergeben an `22`.**

> ### 🔢 NACHTRAG 12:5x — **die gezählte Menge ist ein FÜNFTEL der auffälligen** *(vom PM nachgefragt)*
> **Ich wollte „69 statt 132" nicht boarden, ohne zu wissen, ob beide dasselbe zählen. Sie tun
> es — die Einheit ist beidseitig `Paare`, wörtlich aus der QS-Übergabe belegt** (*„gegenläufige
> Sprungpaare gesamt: 141 / im 60m-Fenster prüfbar: 9 / außerhalb: **132**"*). **Keine
> Populations-Verwechslung.** *Die Differenz ist Archivstand (heute neu geschrieben) plus
> Schwellen — **die der QS sind nicht abgelegt und nicht rekonstruierbar**.*
>
> **Der Tafel-Satz, wörtlich vom Analytiker:**
> > *„`I1` findet auf dem neuen Archiv **69 Pendel-Paare in 29 Reihen** (QS-Zahl 141/132 vom alten
> > Stand, Schwellen nicht rekonstruierbar, Einheit beidseitig: Paare). **Einzelsprünge ohne
> > Rückkehr — 534 in 275 Reihen — sind vorregistriert ausgeschlossen und ungezählt**; darunter
> > liegen sowohl echte Splits (WHLR-Klasse) als auch RGR-artige Skalenfehler, trennbar nur per
> > Ereignis-Abgleich."*
>
> **672 Sprünge insgesamt, nur 138 Legs (20,5 %) in Pendel-Paaren.** *Das ist kein Fehler der
> Vorregistrierung — `I1` darf eng sein —, aber es ändert, was „69 Kandidaten" bedeutet.*
> **⚠ Und: Einzelsprünge sind NICHT automatisch Defekte** — *allein `WHLR` trägt 16 davon, alle
> echt.* **Ohne diesen Zusatz läse sich „534 ungezählte Sprünge" wie 534 Fehler.**
>
> **✅ Freigegeben: die 275 Einzelsprung-Reihen per Splits-Abruf sortieren** (~60 Min, lesend,
> kostenlos) — *die systematische Jagd auf die Klasse, die den RGR-Fehler erzeugt hat.* **Als
> DRITTE Menge neben `I1` ∪ F1-Verworfene, `WHLR`s 16 als Positivkontrolle, Trennregel vor den
> Ergebnissen festgelegt.**
>
> > **🔴 DIE AUFLAGE, DIE ALLES TRÄGT: „ohne Ereignis" ist NICHT dasselbe wie „kein Ereignis".**
> > *Spin-offs stehen in **keinem** der beiden Endpunkte — gemessen.* **Drei Klassen, nicht
> > zwei:** *Split-belegt · kein Ereignis, **aber der Endpunkt deckt die Frage ab** · **der
> > Endpunkt kann es gar nicht wissen**. Die dritte darf niemals in „RGR-Verdacht" fallen* —
> > **sonst misst die Länge der Verdachtsliste die Lücke des Endpunkts statt die Fehler des
> > Archivs.** *Und die **Grundrate** ist das Ergebnis, nicht die Verdachtsliste.*

---

## 📦 27.08. 12:00 — **`v8.34.1` IST INSTALLIERT.** Wilhelms #105 ist auf seinem Bildschirm

**Wilhelm hat die Installation freigegeben** (*„ich habe gerade keinen Zugriff und kann erst
später updaten gegen 17 Uhr — wenn du updaten kannst mach das ruhig"*). **Ich habe NICHT
`8.34.0` installiert, sondern erst `8.34.1` bauen lassen: `8.34.0` enthielt seinen eigenen,
eine Stunde alten #105-Entscheid nicht.**

**Belegt statt angenommen, an jedem Schritt:** sha512 des Installers gegen `latest.yml`
**stimmt** · installierte Version **8.34.1** · **`#105` im installierten Paket** (`kostenHuerde`
3× in `messband.js`, `toFixed` nur noch die 2 erlaubten Vorspann-Stellen) · **App läuft wieder**
(4 Prozesse ab 12:00:29 — *der Installer hat sie nicht selbst neu gestartet*).

**Store Zahl für Zahl gegen den QS-Vorher-Stand von 11:57:** `kostenMessung.runden` **1 = 1** ·
`capFehler` **3 = 3** · offene Positionen **3 = 3** (TSLA, MS, ABBV) · `depot_vor_reset.json`
**38 = 38**, Zeitstempel unverändert **25.08. 19:47:15**. **Kein Reset, kein Store-Umzug.**

> **🎯 UND EIN BEINAHE-FEHLBEFUND DES PM, der hierher gehört:** *Mein erster Prüflauf meldete
> `capFehler` 3→**1** und Positionen 3→**1**. Ich stand davor zu melden, meine Installation habe
> Daten zerstört.* **Der Grund: falsche Feldnamen** (`positionen` statt `positions`; `capFehler`
> liegt auf **oberster Ebene**) — **und `@($null).Count` ist in PowerShell `1`, nicht `0`.**
>
> ***Meine Prüfung meldete nicht „das Feld gibt es nicht", sondern „da ist genau eins".***
> *Eine leere Kategorie, die als Messwert auftritt — **wortwörtlich der QS-Befund von heute
> früh, eine Etage tiefer**. Gerettet hat eine danebengelegte Rohsuche im Klartext
> (`RC_NOT_ENOUGH_MARGIN` 6×), deren Zahlen nicht zu „alles weg" passten.*

**⚠ Release-Vorfall, den die Wache selbst gemeldet hat:** *`--hoch` stürzte in der
**Schlussgegenprobe** mit einem Node-Stapel ab (`release.js:486`, `gh release download`) —
**Leitungsflakiness**, derselbe Abbruch traf danach `curl` dreimal, über die API ging es sofort.
Zu dem Zeitpunkt war alles Wesentliche erledigt: Tag gesetzt und remote, gepusht, Assets oben.*
**Sie hat NICHT neu `--hoch` gestartet, sondern von Hand nachgeprüft.** *Für die Tafel:* **der
Absturz der Schlussgegenprobe ist KEIN gescheitertes Release. Wer da neu `--hoch` startet, tut
das Falsche.**

---

## 💸 27.08. 12:0x — **DIE KOSTENMESSUNG SCHÖPFT AUS DEM BILLIGSTEN ENDE DES UNIVERSUMS**

**Die 16 Aktienrunden stammen ausnahmslos von Mega-Caps** (AAPL, NVDA, MSFT, AMZN, GOOGL, META,
TSLA, AMD, AVGO, TSM, ASML, INTC, QCOM, MU, ARM). **Der Grund steht in den Fehlern selbst — es
sind ZWEI Ursachen, nicht eine:**

    14:58  ABBV  RC_NOT_ENOUGH_MARGIN
    14:58  MS    Kein Markt fuer MS gefunden     <- der aufschlussreiche
    14:58  TSLA  RC_NOT_ENOUGH_MARGIN

**Gemessen werden kann nur, was der Broker führt — und das sind die liquidesten Werte.**

> **→ „0,10 % ist bemerkenswert gut getroffen" ist nicht widerlegt, aber es gilt NUR FÜR
> MEGA-CAPS.** *Handeln die Strategien breiter, ist die Annahme **optimistisch** statt gut
> getroffen — um wie viel, ist ungemessen.* **An dieser Annahme hängt fast jede Studie dieses
> Projekts.**
>
> **Und die Freigabeschwelle „≥ 20 Aktienrunden" ist damit eine Frage der ZUSAMMENSETZUNG, nicht
> der Anzahl** — *gelingt die Spiegelung systematisch nur bei Mega-Caps, misst sie auch nach
> zwanzig Runden noch die falschen Papiere.* **Die Nachmittagsfrage lautet deshalb nicht mehr
> „entstehen neue Runden", sondern „bei welchen Symbolen gelingt die Spiegelung, bei welchen
> nicht".** *Die QS hat es selbst umformuliert und dabei ihre eigene Meldung von heute Nacht
> eingeschränkt.*

> ### 🔴 NACHTRAG 12:2x — **DIE QS NIMMT IHRE EIGENE DEUTUNG ZURÜCK, und der PM seine auch**
> **„Seit dem 25.08. steht die Messung bei einer Runde" ist KEIN Defekt, sondern die
> Beschreibung eines Knopfes, den seither niemand gedrückt hat.**
>
> **`kostenVersuche` protokolliert JEDEN Versuch, auch gescheiterte — und steht bei 1.** *Nicht
> versucht und gescheitert: **gar nicht versucht**.* **Und der Code sagt, dass das so gebaut
> ist:** `depot.js:6228` ist der **einzige** Aufrufer (mit Rückfrage, weil echte Demo-Orders
> abgesetzt werden), **`test-v6.js:8192` verbietet ausdrücklich einen Taktgeber**, der
> Knopf-Titel sagt *„Läuft nur auf Klick, nie von selbst."*
>
> **⚠ Die `RC_NOT_ENOUGH_MARGIN`-Fehler stammen aus einem ANDEREN Pfad** (Spiegeln von
> Handelspositionen) **und haben mit der Kostenmessung nichts zu tun.** *QS und PM hatten das
> beide verwechselt; der PM hatte es sogar so ins Projektgedächtnis geschrieben — **korrigiert**.*
>
> **🎯 UND DAMIT IST DIE 16-AUS-EINER-MINUTE ERKLÄRT:** *„Der Knopf schaltet mit
> `kostenRundeTakt` durch das Universum. Wer ihn sechzehnmal hintereinander drückt, bekommt
> sechzehn Werte in zwei Minuten. **Das war kein Zufall der Marktlage, sondern eine
> Klickfolge.**"* **Bisher stand dort „eine Marktlage, 15-fach abgetastet" — das klang nach
> Pech. Es war ein Verfahren.** *Pech wiederholt sich vielleicht nicht, ein Verfahren schon.*
>
> **→ ENTSCHEIDUNG FÜR WILHELM: die Freigabeschwelle nicht in RUNDEN fassen, sondern in Runden
> über VERSCHIEDENE TAGE UND MARKTLAGEN.** *Zwanzig Klicks in einer Minute erfüllen „≥ 20
> Aktienrunden" und messen trotzdem **eine** Marktlage — **genau das ist am 25.08. um 13:31
> schon einmal passiert**, unabsichtlich.* **Eine Schwelle, die mit einer Klickfolge erfüllbar
> ist, prüft die Ausdauer des Klickenden, nicht die Kosten.**
>
> *Nachmittagstermin gestrichen: **es gibt nichts zu beobachten.** Warten produziert nichts.*
>
> *Bestätigung nebenbei: die gesicherten Runden tragen ein eigenes `krypto`-Feld — **22 Krypto /
> 16 Nicht-Krypto laut Feld, null Abweichungen** gegen die Ableitung aus den Kürzeln. Die
> Trennung ist die des Werkzeugs, nicht eine Interpretation.*

---

## 🕐 27.08. 11:58 — **DIE UHR IM BASH-WERKZEUG GEHT 3 STUNDEN 23 MINUTEN NACH**

**Gemessen, nicht vermutet:** `Get-Date` (PowerShell, Windows) sagt **11:57**, `date` im
Bash-Werkzeug sagt zur selben Sekunde **08:34**. **Alle Zeitstempel dieser Tafel, die aus
`date` stammen, waren ~3½ Stunden zu früh** — und sie trugen den Vermerk **„(abgelesen)"**,
also genau die Kennzeichnung, die sie glaubwürdiger machte als eine Schätzung.

> ### 🎯 **Der PM hat eine Uhr abgelesen — die falsche.**
> *Fünfmal in dieser Nacht liefen meine Zeitangaben vor, und ich habe es viermal als
> „schätzen statt ablesen" korrigiert. **Die Abhilfe war das Problem:** Umstellen auf
> „ablesen" hat den Fehler nicht behoben, sondern ihm ein Echtheitssiegel gegeben.*
> **Zehnte Erscheinungsform derselben Krankheit — eine Prüfung, die grün wird, weil sie
> etwas anderes misst, als man glaubt.**

**Was RICHTIG ist und bleibt:** *alle aus **Git** abgelesenen Stempel* (`git log --format=%ci`
liefert `+0200`, also echte Ortszeit) — **07:59 `a5b66e0` · 08:02:46 `v8.34.0` · 08:06:35
`21f7002`**. Die stimmen.
**Was falsch war:** *alles, was ich aus `date` gezogen habe.* **Oben korrigiert.**

**→ HAUSREGEL FÜR ALLE SITZUNGEN: Für Uhrzeiten `Get-Date` (PowerShell) oder `git log`
verwenden, NIE `date` im Bash-Werkzeug.** *Und wer eine Uhrzeit auf diese Tafel schreibt,
nennt die Quelle — „(git)" oder „(Windows-Uhr)". Ein nacktes „(abgelesen)" sagt nur, dass
jemand irgendwo hingesehen hat.*

> **⚖ RICHTIGSTELLUNG GEGEN DEN PM (`06`, gemessen): „die Bash-Uhr geht nach" ist KEINE Konstante.**
> *„In MEINER Sitzung stimmen alle drei Uhren gerade sekundengenau überein (bash `date -u`
> 10:03:48, Node aus bash 10:03:48, PowerShell 10:03:53). **Die 3h23m-Abweichung ist nicht global
> und nicht dauerhaft** — sie war sitzungs- oder zeitpunktgebunden."*
>
> **Ich hatte aus einer Messung eine Eigenschaft gemacht** — und diese Zeile hätte jeden
> eingeladen, künftige Zeitfehler ungeprüft darauf zu schieben. **Die Regel oben bleibt (sie ist
> billig und richtig), die Diagnose nicht.**
>
> **Auflage von `06`, übernommen:** *„Falls es wieder auftritt: **sofort in derselben Sekunde
> beide Uhren ablesen**, sonst jagt man ein Gespenst."*
>
> *Geprüft und unbedenklich: `abmeldungen-pflegen.js`, `release.js` (bau-stand + Sperre) und
> `archiv-nachladen.js` stempeln alle mit Nodes `new Date()` im eigenen Prozess.*

> ### ⚠ 27.08. — **KORREKTUR AN MEINER EIGENEN FUNKSTILLEN-ANWEISUNG**
> **Ich hatte fünf Sitzungen geschrieben: „lokal committen ist völlig in Ordnung — nur der Push
> kollidiert." Das ist falsch.** *Es gilt für **Riegel 1** (Sperrdatei), nicht für **Riegel 2**.*
>
> **Riegel 2 vergleicht HEAD gegen den Bau-Stand — und ein lokaler Commit bewegt HEAD genauso
> wie ein Push.** *Vom Erbauer des Riegels bestätigt: „nur **unkommittierte** Änderungen im
> Arbeitsbaum sind unschädlich — der Riegel liest HEAD, nicht den Baum."*
>
> **→ BEI LAUFENDEM BAU GILT RUHE FÜR COMMITS UND PUSHES.**
>
> *Gefunden hat es `c4`, aus dem Zitat, das **ich** weitergegeben hatte: „er fängt zusätzlich den
> Fall, den keine Sperrdatei sieht — dass jemand nach dem Bau und vor dem `--hoch` committet,
> **ganz ohne zu pushen**." **Ich habe das Zitat verteilt und die Folgerung daraus nicht
> gezogen.*** *Ihre Erstfassung des Skalen-Auftrags war dank ihrer Vorsicht noch nicht committet
> — sonst stünde die inzwischen widerlegte Muster-Rückrechnung in der Historie und wäre
> irgendwann als „die vorregistrierte Fassung" gelesen worden.*

---

## ⭐ WILHELMS ENTSCHEIDE 27.08. ~11:30 (per Formular) — **alle drei gelten ab sofort**

> ### 0. Freigabeschwelle Strang A → **RUNDEN ÜBER VERSCHIEDENE TAGE UND MARKTLAGEN**
> *(entschieden ~12:35, nach der QS-Rücknahme unten)*
> **Nicht mehr „≥ 20 Aktienrunden", sondern Runden verteilt über verschiedene Tage und
> Marktlagen.** *Grund: Die Messung läuft nur auf Knopfdruck und schaltet dabei durchs
> Universum — **zwanzig Klicks in einer Minute erfüllten die alte Schwelle und maßen eine
> einzige Marktlage.*** **Die 16 Runden vom 25.08. 13:31 erfüllen die neue Schwelle NICHT** —
> sie sind ein Tag, eine Klickfolge.
>
> **⚠ WAS WILHELM NICHT GEWÄHLT HAT und deshalb NICHT gilt:** *Die daneben angebotene Fassung
> **mit Breiten-Vorgabe** (Zusammensetzung, nicht nur Verteilung) wurde nicht gewählt.* **Die
> Mega-Cap-Einschränkung bleibt ein dokumentierter Vorbehalt, KEINE Schwellenbedingung.** *Wer
> sie später doch als Bedingung will, fragt neu — sie wird nicht stillschweigend mitgeführt.*

> ### 1. Kostenhürde → **LIVE-HÜRDE DES GEHANDELTEN PRODUKTS**
> **Das Messband (Vermögen → Depot) rechnet ab jetzt wie das Scoreboard.** *„Kostenhürde" heißt
> damit überall dasselbe.* **→ vergeben an `06`** (Umstellung ist eine Zeile, läuft schon 4× über
> `huerdePp()`); **der Rest von #108 geht im selben Commit mit** — beides `messband.js`.
> **Auflage: Sperrklinke darauf, dass beide Anzeigen DIESELBE Quelle benutzen** — sonst driften
> sie beim nächsten Umbau wieder auseinander und fallen in der Voreinstellung wieder zufällig
> zusammen.

> ### 2. Zweite Datenquelle → **EINE SITZUNG SOLL RECHERCHIEREN**
> **Kein Kauf, keine Anmeldung — nur eine Entscheidungsvorlage.** **→ vergeben an `22`.**
> **Die entscheidende Spalte ist nicht der Preis, sondern der ANPASSUNGSSTAND:** *Eine Quelle,
> die nur angepasste Kurse liefert, ist bei RGR/SITC/B/WHLR **kein zweiter Zeuge** — sie fügt
> eine dritte Meinung hinzu, statt zu entscheiden, welches Archiv recht hat.* **Gesucht sind
> Split-/Dividenden-Ereignisse als Datensatz oder unangepasste Rohkurse.** *Dazu: Reichweite,
> Preis, und ob **abgemeldete** Papiere abgedeckt sind.* **Auflage: „unklar" schreiben statt
> vermuten.**

> ### 3. Strang-A-Referenzlauf → **ERST NACH DEM ERÖFFNUNGSKURS-NACHLAUF**
> **Wartet auf Vorschlag D bei `1d`.** *Wilhelm will ihn auf dem vollständigeren Archiv.*
> **Weg 3 ist davon nicht betroffen** und ist bereits gelaufen (siehe unten); nur die
> **Übernacht-Fassung** (Familienmitglied 2) wartet ebenfalls auf D.

---

## 🏆 27.08. ~11:45 — **WEG 3 IST GEMESSEN: das erste Ergebnis seit Wochen ÜBER der Auflösungswand**

**c_gew = +0,0568 Pp je Handelstag · t = 20,99 · 496 Paartage · delta80 0,0084 → Faktor 6,8
darüber.** *Ungewichtet c_roh +0,78 Pp bei f-Mittel 6,67 %.* **Und es fällt GEGEN die vorher
deklarierte Z0-Andeutung der messenden Sitzung.**

> ### 🎯 **DER FUND IST NICHT DIE ZAHL — ES IST DIE VERSÖHNUNG DREIER MESSUNGEN**
> **Die Überlebensverzerrung dieses Fensters hat KEIN einheitliches Vorzeichen. Verschwinden hat
> zwei Gesichter:**
>
> | | Bedingung | Richtung |
> |---|---|---|
> | **Übernahme-Prämien** | unbedingt, auf umsatzstarken Tagen | **das Archiv UNTERTREIBT** |
> | **Sterbepfade** | bedingt auf Dip-Signalen | **das Archiv BESCHÖNIGT** *(−3,78 Pp, t −6,19 vom 26.08. — **bleibt voll bestehen**)* |
>
> **→ AUFLAGE FÜR JEDE KÜNFTIGE E1-ZEILE:** ***„Die E1-Zeile braucht künftig BEIDE Sätze, sonst
> trägt sich eine halbe Wahrheit fort."*** *Genau der Mechanismus, an dem dieses Projekt schon
> einmal wochenlang gelitten hat — „zwei validierte Kanten" war eine überholte Formel, die sich
> durch Code, Befunde und Gedächtnis weitertrug, bis jemand nachrechnete.*
>
> **Zwei Messungen mit gegenläufigem Vorzeichen sind normalerweise ein Alarm — hier sind es zwei
> verschiedene Fragen an denselben Datensatz.**

> **⚠ DEUTUNGSGRENZE — von der messenden Sitzung selbst, und sie steht VOR dem Ergebnis:**
> *„Der registrierte 5-Mio-$-**Tages**schnitt wählt auf der dünnen Verschwundenen-Seite
> systematisch deren **heiße Tage** aus (Umsatz-Rendite-Kopplung, Übernahme-Pops). **Das Urteil
> gilt exakt der registrierten Größe, nicht ‚allen Tagen aller Verschwundenen'.**"*
>
> **Und der Satz, der sie erst wertvoll macht:** *„Die Auswahl-Asymmetrie steckte **identisch**
> in der Machbarkeits-Zählung — **deshalb** passen die σ (0,0603 gegen 0,0586)."* **Die
> Übereinstimmung, die das Ergebnis stützt, ist teilweise gemeinsame Ursache.** *Zwei Rechenwege,
> die denselben Auswahlfehler teilen, bestätigen sich gegenseitig, ohne unabhängig zu sein —
> dieselbe Bauform wie der geteilte Kurs beim Spannen-Rückprall.* **Kein E1-Leiserstellen aus dem
> günstigen Vorzeichen.**
>
> **„Mit den vorhandenen Quellen nicht zu schließen" ist FÜR WEG 3 überholt — nicht überhaupt.**
> *Die anderen drei Stränge hängen weiter an der zweiten Quelle.*

**Registrierfehler vom Messenden selbst gefunden und VOR dem Bau korrigiert (Nachtrag 7):** *Die
Faktor-24-Auflösung gilt der **anteils-gewichteten** Differenzreihe, nicht der rohen (~13× breiter).*
**Ein Einheiten-Fehler in der Auflösungsrechnung — dieselbe Familie wie „delta80 (Pp) als Schwelle
für Handelstage".** *Nach dem Lauf wäre dieselbe Korrektur eine nachträgliche Schwellenanpassung
gewesen.*

---

## ☀ MORGENLAGE 27.08. (Vormittag) — was seit dem Aufwachen passiert ist

**Zehn Sitzungen erreicht, alle arbeiten oder haben sauber abgeschlossen. Vier Ergebnisse, ein
Fehlschluss von mir, zwei Entscheidungen für Wilhelm.**

> ### ✅ DATENFUND 2 IST GESCHLOSSEN — **und zwar zweimal unabhängig**
> **Der 25.08. stimmt im neu geschriebenen 60m-Archiv.** *Zwei Sitzungen haben dieselbe Frage
> ohne Absprache auf verschiedenen Wegen beantwortet:*
>
> | | `ab` (QS) — Vollzählung, **ohne** Abrufe | `06` (Archiv) — Stichprobe **mit** frischem Abruf |
> |---|---|---|
> | Umfang | **alle 2.916 Reihen**, 23.231 Kerzen | 20 liquide Symbole, Kerze für Kerze |
> | Ergebnis | **98,6 % exakt im Sollbild** · **0 OHLC-Verletzungen** · **keine fremde Uhrzeit** | **20/20 deckungsgleich**, Positivkontrolle 20.08. ebenfalls 20/20 |
>
> **Das ist stärker als zweimal dasselbe: die eine deckt den UMFANG, die andere den ABGLEICH MIT
> DER QUELLE — genau die Lücke der jeweils anderen.** *Der AAPL-Beleg von gestern (v 2.851.594
> archiviert vs. 2.846.819 live) ist heute deckungsgleich. Keine fremde Uhrzeit heißt: **auch
> kein Quote-Stempel an diesem Tag.*** **Ursache der Heilung: der `range=730d`-Neuschrieb des
> Nachtlaufs hat den Tag nebenbei frisch geholt.**
>
> **→ Wilhelms blockierter Entscheid „nachbessern vs. neu holen" ist GEGENSTANDSLOS.** *Neu
> geholt ist bereits geschehen — jetzt gemessen statt vermutet.*
>
> **⚠ DREI DINGE, DIE DIESE ANTWORT NICHT SAGT** *(von der QS vorangestellt, nicht nachgereicht
> — und sie gelten jetzt doppelt, weil **beide** gegen dieselbe Quelle geprüft haben)*:
> 1. **Nicht, ob der Tag VOR dem Neuschreiben stimmte** — der beanstandete Zustand ist nicht
>    mehr messbar.
> 2. **Nicht, dass die Quelle recht hat** — *Übereinstimmung heißt kein Widerspruch zwischen
>    zwei Abrufen, nicht dass beide richtig sind.* **Zwei Messungen, aber ein Zeuge.**
> 3. **Nicht, dass andere Tage ebenso stimmen** — geprüft ist einer. *Die Vollzählung nimmt ein
>    beliebiges Datum entgegen; ein zweiter Tag kostet zwei Minuten.*
>
> **Die vier Ausnahme-Reihen sind kein Defekt:** GOGL/HIGH/TIL sind **extrem illiquide**
> (5.000–6.000 Stück am ganzen Tag → Stunden ohne Handel → keine Kerze). Die vierte ist
> **ZVZZT, zum dritten Mal heute Nacht.** *Sechs Reihen ganz ohne Kerzen: AVB, EQR, LBRDA,
> LBRDK, **TWO**, WBS — fünf bekannt, **TWO neu** und an `06` gegeben.*

> ### 🔴 DER KRONZEUGE DER NACHT (`c4`, gemessen) — **eine Sichtbarkeits-Funktion ohne einen einzigen Anrufer**
> **Das Wertpapierart-Modul verhält sich bei fehlender Referenz als „alles durch"** (`istAktie`
> gibt ohne Karte `true` zurück, auch bei unlesbarer Datei oder ≤ 1.000 Einträgen). **Die
> Modulautoren haben dafür ausdrücklich `klassifizierungDa()` als Sichtbarkeits-Funktion
> gebaut — und von 24 Dateien, die am Modul hängen (~20 davon Mess-Werkzeuge: alle Strategien,
> die Eichung, die Tüftler-Zähler, `test-v6`), ruft sie NIEMAND auf.**
>
> ### 🎯 ***Die Prüfung, die grün aussieht, weil niemand sie ansieht.***
> **Das ist eine eigene Unterart der Krankheit dieser Nacht, und sie ist die heimtückischste:
> Wer den Quelltext liest, SIEHT die Vorsorge und hält das Problem für gelöst.** *Die
> Original-Absicht war richtig — sie liegt nur an einer Stelle, die niemanden erreicht.*
>
> **Zwei stille Richtungen, gegenläufig:**
> 1. **Datei fehlt/kaputt/zu klein** → Universum still **verdreifacht** (2.213 → ~2.960)
> 2. **Datei gesund, Einträge fehlen** → betroffene Symbole still **draußen** — *exakt die
>    „draußen-weil-unbekannt"-Bauform der Delisting-Nacht, im selben Modul.*
>
> **✅ HEUTE AKUT: NICHTS — gemessen, nicht gehofft.** Referenz gesund (**36.479 Einträge**),
> **alle bisherigen Protokolle standen nachweislich auf gefiltertem Universum** (Zählstände
> 2.201/2.213/2.249 passen zur Karte). **Kein Protokoll ist infrage gestellt.** *Das Risiko ist
> betrieblich: ein einziger missglückter Referenz-Refresh flippt alle Universen, und **kein
> Protokollfeld würde es festhalten**.*
>
> **Abhilfe vergeben:** **(a)** E1 schreibt `klassifizierungDa` ins Protokoll und **verweigert
> bei `false`** → `c4`, mit Versionsvermerk *(Auflage: Feld auch bei `true` schreiben, sonst ist
> ein altes Protokoll von einem neuen nicht unterscheidbar)*. **(b)** laute **Einmal**-Warnung
> auf `stderr`, wenn der Rückfall konsultiert wird → `06`, kein Verhaltenswechsel. **(c)** die
> übrigen ~15 Werkzeuge: **Sammelposten je Besitzer, bewusst NICHT heute** — *mit (b) fällt
> jeder Fall künftig von selbst im Log auf; erst sichtbar machen, dann einzeln nachziehen.*
>
> *c4s eigene zwei Werkzeuge brechen seit `955cbf0` bei fehlender Klassifizierung ab — eigener
> Besitz, ohne Nachfrage, richtig so.*

> ### ⚖ RICHTIGSTELLUNG GEGEN DEN PM — **mein Schluss war tautologisch** (Fund: Issue-Wache)
> **Ich hatte geboardet und an zwei Sitzungen geschrieben: „alle vier Auditor-Funde stecken in
> `v8.34.0`, die beiden Schaufenster-Neuerungen haben je einen sichtbaren Fehler." Das ist
> falsch.**
>
> **Der Rechenweg `git merge-base --is-ancestor 04c9be5 v8.34.0` prüft, ob der PRÜFSTAND ein
> Vorfahr des Tags ist — und das ist er immer.** *Ein Prüfstand kommt vor dem Release, sonst
> wäre er keiner.* **Die Prüfung konnte gar nicht anders ausgehen und trennt deshalb nichts.**
> Sie maß *„war der geprüfte Stand im Release enthalten"* statt *„ist der **Fehler** im Release
> enthalten"*.
>
> **Nachgerechnet:** `04c9be5` liegt **101 Commits vor dem Tag**, die Reparatur `1b852bc` liegt
> **dazwischen** und ist ebenfalls im Tag. Im Tag-Stand selbst stehen `table.tbl td.num` und
> `U.dez(...)`. **→ #107 und #108 sind in `v8.34.0` REPARIERT. Keine Nachlieferung nötig. Von
> den vier Funden steht dort nur #105 — mit Absicht.**
>
> ***Dieselbe Krankheit eine Etage höher, und diesmal war ich es: ein Kriterium, das für alles
> gilt und nichts trennt.*** *Das ist heute Nacht der vierte PM-Fehler dieser Familie.*
>
> **Die Gegenprobe des Auditors bleibt trotzdem beauftragt — mit gedrehter Begründung:** *Der
> Tag enthält die Reparatur; **ob das gebaute PAKET sie enthält, ist eine zweite Frage** — genau
> die, an der der Beinahe-Unfall von 08:00 hing.* **Er misst am ausgelieferten Artefakt, nicht
> an der Vorfahren-Beziehung.**

> ### 🛡 DIE 12 % SIND AUFGEKLÄRT — **und Wilhelms Entscheid war belegt richtig** (`ab`)
> **Die Halbtags-Schlusskerze um 18:00 ist NICHT Nachhandel. Sie enthält die SCHLUSSAUKTION.**
> *Halbtagsschluss 13:00 ET = exakt **18:00:00 UTC** — der Auktionsdruck fällt in den Eimer, der
> um 18:00 beginnt. Auktion ist Sitzungsgeschäft, deshalb führt der Tagesbalken sie mit — und
> **in 12 % der Fälle setzt sie das Tageshoch oder -tief.***
>
> **🔴 → Eine Regel „Kerzen nach Sitzungsende mit Umsatz 0 verwerfen" — DIE FASSUNG, AUF DIE WIR
> UNS GEEINIGT HATTEN — würde an Halbtagen genau die Auktionskerzen treffen, deren Umsatzfeld
> verlorengegangen ist. Der Kurs ist da, nur das Umsatzfeld fehlt.** *Achter verhinderter
> Datenverlust der Nacht — und der erste, der eine **bereits vereinbarte** Regel trifft.*
>
> **✅ Wilhelm hat diese Klippe bereits umschifft, ohne sie zu kennen:** sein Entscheid von 05:50
> lautet **„Randzeiten BEHALTEN und kennzeichnen"** — **es existiert keine Löschregel, die der
> Fund treffen könnte.** *Der Befund macht seine Entscheidung nachträglich zur belegt richtigen.*
>
> **⭐ Die Selbstkorrektur der QS wiegt schwerer als der Fund:**
> ***„Die 0,0 % waren leer, nicht negativ. Ein Merkmal, das nichts zu prüfen hat, prüft nichts."***
> *Ihr Schiedsrichter meldete an Normaltagen C = 0,0 %, gelesen als „der Tagesbalken führt keinen
> Nachhandel mit". Unzulässig: **das Archiv enthält an Normaltagen gar keine Nachhandelskerzen —
> die Kategorie hatte nichts anzubieten und konnte nie gewinnen.*** **Neu gegen die Quelle
> geführt (26.11.2025, zwölf Reihen): 10× „nur Sitzung", 0× „erst mit Nachhandel".** *Dieselbe
> Aussage — jetzt belegt statt aus einer leeren Kategorie geschlossen.* **Vierte Erscheinungsform
> der Krankheit heute, und die einzige, die jemand an sich selbst gefunden hat.**
>
> *Zwei eigene Vermutungen unterwegs kassiert: „die fehlende Halbstunde steckt in der
> 18:00-Kerze" → **89,6 % tragen keinen Umsatz, widerlegt**; „die leere 17:30-Kerze liefert
> wenigstens Hoch/Tief" → **liefert gar nichts, die Halbstunde fehlt wirklich**. Schönster
> Einzelbeleg: **ACGL mit 335.604 Stück in der 18:00-Kerze — mehr als jede Sitzungsstunde.***

> ### 🔬 27.08. 08:2x — **DER ERSTE BAU, DER VON DER QUELLE BIS IN DIE PAKET-BYTES DURCHGEMESSEN IST** (`7d`)
> **Sechs Dateien byteweise Paket gegen Tag — alle identisch.** *Der Tag verspricht nichts, was
> das Paket nicht enthält.* **Drei Reparaturen aus den Bytes des Pakets selbst gelesen**, nicht
> aus dem Tag. *Die Release-Wache hatte nur `kerzenlage.js` geprüft, weil sie die im Verdacht
> hatte; jetzt sind es sechs Dateien.*
>
> **🔴 UND EIN FUND, DEN NUR DAS LAUFENDE PROGRAMM ZEIGT: #108 ist UNVOLLSTÄNDIG repariert.**
> `messband.js:144/159/184` tragen weiter `toFixed`. **Zeile 144 ist die unangenehme: dieselbe
> Kostenhürde steht als `0,10` und als `0.10` in derselben Karte, acht Zeilen auseinander** —
> *genau die Zwei-Wahrheiten-Form, gegen die die Reparatur angetreten war. Sie hat sich innerhalb
> ihrer eigenen Reparatur reproduziert.*
>
> **Warum die Quellprüfung das nicht fangen konnte:** *„Ein `grep` an den **geänderten** Stellen
> findet die drei nicht — sie stehen woanders in derselben Datei."* **→ Auflage an `06`: die
> ganze Datei prüfen, nicht nur die Änderungsstellen.**
>
> **⭐ Vier eigene Nullbefunde in einem Lauf, die ohne Gegenprobe durchgegangen wären** — und der
> lehrreichste: *„Sichtbarkeit über `el.offsetParent` — der ist bei `position: fixed` **immer**
> null, jedes feste Element wurde stillschweigend übersprungen. **Aufgefallen ist es nur, weil
> der Köder meiner Positivkontrolle selbst `fixed` war.**"* **Ohne den Köder wäre „0
> Kontrastprobleme" gemeldet worden, während der Prüfer einen Teil der Seite gar nicht ansah.**
> *Der breite Durchlauf „0 von 1.747" ist deshalb **nicht zitierfähig** und steht bewusst nicht
> auf dieser Tafel — eine Zahl aus einem blinden Prüfer sieht nach Gründlichkeit aus.*

> ### ✂ 27.08. 08:2x — **„SCHNEIDEN ODER REPARIEREN": der Tüftler dreht die Frage um** → Wilhelm
> **Die Rettungsfrage betrifft 32 Reihen, nicht 58** *(22 wirft schon der Wertpapierart-Filter,
> 23 haben gar keinen Sprung — an denen ist nichts zu schneiden).*
>
> **Der eigentliche Fund: der Schnitt behandelt meist keinen Regimebruch, sondern einen FEHLER
> MIT ORT.** *Fünf der acht Mehrfach-Sprung-Reihen zeigen Paare, die sich fast genau aufheben,
> 1–6 Kerzen auseinander:* `BYRN ×0,19 → ×5,40` **Produkt 1,000** · `BYND ×30,20 → ×0,03`
> **Produkt 0,944**.
>
> ***„Ein Kurs, der um Faktor 30 springt und drei Tage später um 1/30 zurück, hat keine
> Marktbewegung gemacht — er stand auf der falschen Skala."***
>
> | | gestörte Zone | Schnitt wirft weg |
> |---|---|---|
> | **BYRN** | **2 Kerzen (0,04 %)** | **2.405 (47,9 %) — Faktor 1.200** |
> | **BYND** | 17 (0,92 %) | **1.828 (99,3 %)** |
> | ASTH | 1.523 (34,7 %) | 1.544 (35,1 %) — *einziger echter Mehrjahresfall* |
>
> **In sieben von acht Fällen ist die gestörte Zone unter 8 % der Reihe, meist unter 1 %.**
> *Und **ELME** zeigt, was „Schwanz-Schnitt" heißt: ein Sprung bei Kerze 9.919 von 10.078 —
> **vierzig Jahre weg, um acht Monate zu behalten**.*
>
> **→ ENTSCHEIDUNG FÜR WILHELM: schneiden oder reparieren?** *Die Zahlen sprechen für reparieren.
> **Der Tüftler hat diese Wertung ausdrücklich nicht getroffen** — es ist eine Messentscheidung.*
> **Wird geschnitten: längster sprungfreier Abschnitt (77,5 %) statt Schwanz (63,3 %) — aber mit
> seinem Vorbehalt:** *„er sucht das Stück nach **allen** Sprüngen aus. Zählerisch überlegen,
> methodisch nicht harmloser."* **Die vier Zulässigkeits-Bedenken stehen VOR der ersten Zahl im
> Protokoll, unbeantwortet — richtig so.**
>
> **Dieselbe Störungsklasse aus DREI unabhängigen Richtungen getroffen:** BYND Faktor 30
> (Tüftler) · WHLR Faktor exakt 4,0 (Analytiker) · RGR/SITC/B konstanter Versatz (QS).

> ### 📋 27.08. 08:3x — Abmelde-Seite geordnet (`06`, `0623e6e`) — **und der erste Lauf drehte einen Fall um**
> **`tools/abmeldungen-pflegen.js`:** Handelsende = **letzte Umsatz-Kerze, nie das Listendatum** ·
> auffällig ab 2 Handelstagen Rückstand · jede auffällige Reihe frisch gegen die Quelle
> klassifiziert · Wiederauferstehungs-Alarm · Schnappschuss unberührt.
>
> **🔄 `AVB` ist KEIN Abmeldefall, sondern ein NACHLADEFALL** — *die Quelle handelt AVB bis 24.08.,
> `archiv1d` hängt seit 14.08. hinter fünf Stempelkerzen.* **Damit hat der Unterscheidungs-Zweig
> zugleich seine Positivkontrolle.** *Ein Werkzeug, das beim ersten Lauf einen Fall umdreht statt
> ihn zu bestätigen, hat funktioniert.*
>
> **`BTSGU` ist ein SIEBTER stillstehender Fall**, den bisher niemand genannt hatte.
> **Warum TWO nicht von selbst auffiel:** *`verschwundene.json` ist ein **Schnappschuss vom
> 23.08.** — wer sich danach abmeldet, steht nicht drin. Es gab keine Stelle, an der er hätte
> auffallen können.*
> **`LBRDA` belegt die Auflage:** zuletzt gehandelt **17.07.**, Liste sagt **21.08.** — *und die
> Kerze vom 21.08. ist ein einzelner Stempel mit dem **Abfindungskurs**.* **Fünf Wochen
> Unterschied, und das Listendatum hätte einen Abfindungskurs als Handelstag geführt.**
>
> **Betriebsentscheid (PM):** **Der Nachtlauf fährt es regelmäßig, nicht eine Nachtrolle.**
> *Rollen können ausfallen oder ihre Bereitschaft auslaufen lassen — heute Nacht mehrfach
> gesehen. Der Nachlade-Lauf fasst das Archiv ohnehin an und kennt den Zeugen-Kalender.*

> ### ⚠ 27.08. 08:15–08:19 — **vier Minuten, in denen `git add -A` sechs App-Dateien gelöscht hätte**
> **Zwei Sitzungen haben unabhängig protokolliert, dass `git status` wechselnd bis zu sechs
> gelöschte Dateien der obersten Ebene zeigte** — `index.html`, `app-shell.js`, `messband.js`,
> `archivkarte.js`, `scoreboard.js`, `strategien.js`, zeitweise auch **`package.json`**.
>
> **Ursache, vom Verursacher selbst gemeldet:** *der Auditor hat ein `asar`-Paket ins
> Repo-Arbeitsverzeichnis ausgepackt (`npx asar extract-file` schreibt ins Arbeitsverzeichnis);
> sofort bemerkt, mit `git checkout --` wiederhergestellt.* **Kein Datenverlust, alle Dateien
> waren unverändert auf HEAD.** *Seine eigene Lehre: **Auspacken gehört ins `%TEMP%`, nie ins
> Repo.***
>
> **→ Der beste Beleg für die alte Hausregel „nie `git add -A`", den dieses Projekt je hatte:
> zwei Sitzungen haben denselben Vier-Minuten-Spuk unabhängig gesehen.** *Eine dritte hatte ihn
> als „transienten Umschreib-Zustand" abgetan — auch richtig, aber aus dem falschen Grund.*

### 📌 Wer woran sitzt *(Stand 11:58)*

| Sitzung | Rolle | Auftrag |
|---|---|---|
| `1d` | — | **Eröffnungskurs** `massive-tagesdaten.js:130` (`b.o` **hinten** anhängen) + **Pilot 20 Reihen**; voller Lauf erst nach PM-Ja |
| `c4` | Berechnungen | **(a)** E1-Schranke · dann **Weg 3 der Überlebenslücke** |
| `06` | Archiv-Wache | **TWO / Abmeldeliste** (Handelsende, nicht Listendatum) · **(b)** stderr-Warnung |
| `ab` | QS | **12-%-C-Anteile an Halbtagen** · Kostenmessung **heute Nachmittag** (bei offenem Markt) |
| `7d` | Auditor | **`v8.34.0`-Gegenprobe am Artefakt** · dann **dunkles Thema** |
| `78` | Strategie-Tüftler | **Zähl-Hälfte „Schnitt am letzten Sprung"** |
| `49` | Release-Wache | fertig, Übergabe aktualisiert |
| `36` | Issue-Wache | fertig, Bereitschaft ausgelaufen 08:35 |

> **⭐ Der Fund, der KEINE Reparatur ist und trotzdem der wichtigste sein könnte** *(Strategie-Tüftler)*:
> **Weg 3 der Überlebenslücke liegt um Faktor 24 über der Schwelle — 496 Handelstage vorhanden,
> 21 nötig. Schluss-zu-Schluss ist JETZT startbar** (Übernacht erst nach Vorschlag D).
> *Die Überlebensverzerrung ist seit Wochen als „mit den vorhandenen Quellen nicht zu schließen"
> geführt. **Für Weg 3 ist diese Formel überholt** — und überholte Formeln, die sich durch Code
> und Gedächtnis weitertragen, sind hier schon einmal teuer geworden.*

---

### 🚀 27.08. 08:03 (git) — **`v8.34.0` IST AUSGELIEFERT UND GEPRÜFT.** Bahn frei, Funkstille aufgehoben

**191 Commits seit `v8.33.5`, alle 12 Notizen verbraucht** (`release-notizen/` ist leer). Stufe
`--minor` wegen zweier **sichtbarer** Neuerungen: Seite `Werkzeuge › Kursarchiv` und Spalte
`Feinheit` im Reiter Messung. Release ist **kein Entwurf**, `.qs-lauf` weggeräumt.

| QS-Probe der Wache | Ergebnis |
|---|---|
| Was der Updater sieht | `version: 8.34.0` — die eben gebaute |
| Paket-Version im asar | **8.34.0** = Tag-Version |
| sha512-Gegenprobe | **stimmt** — kein paralleler Austausch |
| Skripte aus `index.html` | **44, keines fehlt** |
| ⭐ *Zusatzprobe `kerzenlage.js`* | *drin, **Byte-identisch mit HEAD*** |

> **🎯 Die Zusatzprobe ist der eigentliche Ertrag, und die Wache hat sie selbst begründet:**
> ***„Die Standard-QS wäre heute blind gewesen — sie prüft nur, was in `index.html` steht, und
> `kerzenlage.js` steht dort nicht. Vorher war das eine begründete Annahme, jetzt ist es
> gemessen."***
>
> **Damit ist belegt, dass der Neubau tat, wofür er angesetzt war** — der Kollisionsfall von
> 08:0x ist nicht nur vermieden, sondern **nachgewiesen vermieden.** *Dritter Fall heute Nacht,
> in dem eine Prüfung erst dadurch trägt, dass jemand fragt, was sie eigentlich prüft.*

**Buchhaltungs-Commit ist diesmal NICHT entstanden:** Der Tag `v8.34.0` sitzt auf `87f9541`,
und das **ist** der HEAD — Tag und HEAD liegen aufeinander, nichts hängt außerhalb. *Der
nächste Wach-Lauf findet einen echten Nullstand und meldet korrekt „nichts auszuliefern".*

**✅ FUNKSTILLE AUFGEHOBEN** — 06, 1d, c4 und ab sind unterrichtet, alle dürfen wieder pushen.
*Der PM-Commit `0f3f94a` liegt oben; die Wache hat ihn als Elter mitgenommen.*

---

### 🔒 27.08. 08:0x — ZWEI RIEGEL VERGEBEN (an `06`), und der bessere ist nicht meiner

**Die Release-Wache hat meinen Sperrdatei-Vorschlag angenommen, aber den Bau abgelehnt — mit
einer Begründung, die ich für richtig halte:** *„Meine Rolle sagt: schreibe keinen Code. Und
`tools/release.js` ist genau das Skript, das mich beaufsichtigt — **die Wache, die ihre eigene
Aufsicht umschreibt, ist eine schlechte Bauform**, auch wenn die Änderung gut ist."*

**Sie hat stattdessen einen zweiten Riegel danebengestellt und ihn höher eingestuft als meinen
— zu Recht:**

| | Riegel | greift |
|---|---|---|
| 1 | `release-baut.json` (Startzeit/PID/Zielversion), im `finally`, mit Verwaisungs-Prüfung *(PM)* | nur wenn **alle** vorher nachsehen |
| **2** | **`--hoch` prüft: HEAD == Bau-Stand, sonst Abbruch mit „neu bauen"** *(Wache)* | **ohne jede Mitwirkung anderer** |

> **📐 HAUSREGEL — und sie ist allgemeiner als der Release:**
> ***„Eine Prüfung, die nicht von Kooperation abhängt, schlägt eine Verabredung, die vier
> Sitzungen einhalten müssen."***
>
> **Die Sperrdatei ist eine Verabredung.** Heute Nacht hat sie beim Archiv getragen, weil vier
> Sitzungen mitgemacht haben. **Beim fünften Mal macht einer nicht mit — und der Schaden trifft
> dann nicht ihn, sondern das Release.** Riegel 2 hätte den heutigen Fall **auch bei gebrochener
> Funkstille** gefangen und fängt zusätzlich den Fall, den **keine** Sperrdatei sieht: *jemand
> committet nach dem Bau und vor dem `--hoch`, ganz ohne zu pushen.*

**Der ehrlichste Satz der Wache gehört dazu, weil er den Auftrag begründet:** ***„Dass ich es
gemerkt habe, war Handarbeit und ein bisschen Glück — ich habe den Log gelesen und die
Uhrzeiten verglichen. Beim nächsten Mal sitzt dort vielleicht jemand, der nur den Push
wiederholt, weil das Skript ihn ja gelassen hätte."***

**Auflagen an `06`:** Riegel 2 **zuerst** · gegen den **echten** Fall prüfen (Bau-Stand
`b5c0243`, gepusht `a5b66e0` → muss abbrechen; Bau ohne Zwischen-Commit → muss durchgehen),
**beide Richtungen** · und die Release-Wache unterrichten, **bevor** sie das nächste Mal baut,
weil `tools/release.js` ihre Aufsicht ist.

> ### ✅ 27.08. 08:07 (git) — **BEIDE RIEGEL SIND GEBAUT UND GEPRÜFT (`21f7002`)**
> **Riegel 2:** `bauen()` schreibt `dist/bau-stand.json` (HEAD-SHA, Version, Zeit). `--hoch`
> prüft HEAD == Bau-Stand **als ALLERERSTES** — *vor der Gegenprobe und insbesondere **vor dem
> Notizen-Wegräumen, das ja selbst committet***. Ein `dist` **ohne** `bau-stand.json` (Alt- oder
> Fremdbau, auch über `DIST`) wird abgelehnt.
>
> **🎯 Die Reihenfolge ist der klügste Teil:** *Käme die Prüfung nach dem Notizen-Wegräumen,
> würde der Riegel **sich selbst auslösen** — das Wegräumen bewegt HEAD. Ein Riegel, der beim
> Zusehen zuschnappt.*
>
> **Gegen den echten Fall geprüft, drei Richtungen:** `b5c0243` + HEAD `a5b66e0` → **Abbruch,
> mit genau der heutigen Situation im Text** · gleicher Stand → **durch** · fehlende Datei →
> **Abbruch**.
>
> **Riegel 1:** `release-baut.json` (Phase, Zielversion, PID, Start) im Wurzelverzeichnis,
> solange `--bauen`/`--hoch` läuft. **Im `finally` gelöst**, **Verwaisungs-Prüfung über die
> PID** (toter Lauf sperrt niemanden aus und wird übernommen), lebender Parallel-Lauf bricht ab.
> In `.gitignore`, wird nie committet. **Fünf Sperrklinken in `test-v6.js`; `npm test` grün.**
>
> **🔴 FÜR DEN NÄCHSTEN RELEASE-LAUF, weitergegeben:** *Das erste `--hoch` auf einem `dist` von
> **vor** diesem Commit **wird abgelehnt** (`bau-stand.json` fehlt dort) — **gewollt, nicht
> kaputt**: einmal neu bauen, dann trägt die Kette.*
>
> **✅ Unabhängig gegengelesen (Release-Wache, 08:0x), bevor sie das nächste Mal baut:**
> `bauStandPruefen()` läuft als erstes in `hochKern()`, vor Gegenprobe und Notizen-Wegräumen ·
> Fehlertexte benennen beide Fälle · `release-baut.json` in `.gitignore` Zeile 13 · beide Läufe
> lösen im `finally`. ***„Der Riegel hätte den heutigen Fall gefangen — an genau der Stelle, an
> der ich ihn per Handarbeit gefangen habe."***

> ### 📌 ERWARTUNG AN JEDE KÜNFTIGE RELEASE-WACHE — kein Auftrag, eine Ansage
> **Nach JEDEM gescheiterten `--hoch` ist ein Neubau ab sofort Pflicht, ausnahmslos.**
>
> **Grund:** Die Rückholung der Notizen macht **selbst einen Commit** (`release.js:460`).
> Damit ist HEAD ≠ Bau-Stand, und Riegel 2 lehnt jeden Wiederholungsversuch ab — **auch dann,
> wenn der Push nur an einer Netzstörung gescheitert ist und sich an der App nichts geändert
> hat.**
>
> **🎯 Die Release-Wache schlägt ausdrücklich NICHT vor, das zu ändern, und ihre Begründung ist
> die Hausregel:** *„Eine Ausnahme ‚der eigene Rückhol-Commit zählt nicht' wäre genau die Sorte
> Schlauheit, die einen Riegel weich macht — **und sie müsste unterscheiden, was in diesem
> Commit steckt, was sie nicht kann**."*
>
> **Der Preis ist beziffert und klein:** zehn Minuten Neubau im Fehlerfall, **keine verbrannte
> Versionsnummer** (`naechsteVersion()` verwendet eine Nummer ohne Tag wieder). *Der Preis der
> Gegenrichtung wäre ein Release, dessen Tag Code verspricht, den der Installer nicht enthält.*
>
> **→ Wer künftig auf `HEAD ist nicht der Stand, aus dem gebaut wurde` trifft: das ist der
> Riegel bei der Arbeit, nicht ein Defekt. Neu bauen, nicht nach einem Weg daran vorbei
> suchen.** *Diese Zeile steht hier, weil sonst jemand den Riegel für kaputt hält.*

---

### 🧪 27.08. 08:0x — ZVZZT: ein Testkürzel, das in **jeden** Detektor schlägt

**`ZVZZT` ist das Testkürzel der Nasdaq und steht mit 5.105 Kerzen in `archiv60m`** — mit
synthetischen Kursen, aber **echtem Umsatzfeld**. Es ist heute Nacht **zweimal unabhängig**
aufgetaucht:

- die **5** unerklärten Auktionskerzen (siehe oben) — **fünf von fünf ZVZZT**
- der Kurssprung-Sucher der QS in `archiv60m` — **acht von acht ZVZZT**

> **Zwei verschiedene Detektoren, dieselbe eine Reihe.** *Ein Papier mit erfundenen Kursen und
> plausiblem Umsatz erfüllt die formalen Datenprüfungen und fällt genau dort auf, wo man einen
> Fund vermutet.*

> ### ⚖ RICHTIGSTELLUNG 27.08. 08:0x (c4, gemessen) — **die Messmaschine war NIE betroffen**
> **Ich hatte ZVZZT als „stehenden Störer für jede künftige Studie" eingestuft. Das war zu
> weit gegriffen und ist widerlegt:** *„Die zwölf Protokolle enthielten ZVZZT **nie**. Die
> QS-Treffer stammen aus ihren eigenen **Roh-Archiv-Scans ohne Art-Filter**, nicht aus der
> Messmaschine."*
>
> **ZVZZT ist doppelt draußen — aber nur ein Riegel ist Absicht, und der ist brüchig:**
> 1. `WP.istAktie('ZVZZT') = false` — **greift vor allem anderen.** *Aber nur, weil das Kürzel
>    in `wertpapierarten.json` schlicht **fehlt** (`undefined`), **nicht** weil es als
>    Testsymbol benannt wäre.*
> 2. F1 wirft die 60m-Reihe komplett (−89 % am 03.10.2023); in `archiv1d` existiert gar keine
>    Datei.
>
> **→ Der Riegel beruht auf ABWESENHEIT in einer Referenzliste.** *„Ein künftiger
> Referenz-Refresh, der ZVZZT als **CS** aufnimmt — **die Nasdaq führt es formal so** —, würde
> ihn öffnen, und dann hinge alles an F1, das nur zufällig greift, solange die Synthetik-Kurse
> wild genug sind."*
>
> **Das ist dieselbe Krankheit wie überall heute Nacht: eine Prüfung, die grün ist, weil sie
> etwas anderes prüft, als man glaubt.** *„Draußen, weil unbekannt" sieht aus wie „draußen, weil
> ausgeschlossen" — bis die Liste sich ändert.*

**→ AUFTRAG VERGEBEN (an `c4`, mit Versionsvermerk): Testkürzel namentlich ausschließen** —
ZVZZT und die Nasdaq-Geschwister **ZWZZT / ZXZZT / ZJZZT** — eine Zeile in `wertpapierart.js`,
**damit „draußen" Absicht ist statt Nebenwirkung.** *Kleine Universums-Definitionsänderung,
gehört deshalb als Auftrag vergeben und nicht nebenbei erledigt — c4 hat genau darauf bestanden.*

> ### ✅ ERLEDIGT 27.08. 08:2x (`8a2bd28`) — **und der Nebenfund ist größer als der Auftrag**
> **Umsetzung mit allen drei Auflagen:** die vier Kürzel stehen **einzeln** im Aktienfilter
> (*ausdrücklich kein Muster — das würfe irgendwann ein echtes Papier*), beide Richtungen
> getestet (vier raus, **ZTS/ZM drin**), Reihenfolge per Quelltext-Zusicherung gesichert, die
> Ausnahme vom „Keine-Namensliste"-Prinzip im Dateikopf begründet (**geschlossene Börsen-Menge,
> kein Pflegefall**). Release-Notiz trägt den geforderten Satz wörtlich: ***ändert kein einziges
> der zwölf Protokolle — gemessen, nicht angenommen.*** `test-v6` grün.
>
> **🔴 DER NEBENFUND — und er verschiebt den Befund von oben:**
> ***„Der Ohne-Karte-Rückfall (»Referenz fehlt → alles durch«) hätte die Testkürzel schon HEUTE
> hereingelassen. Der neue Riegel ist die einzige Stelle, die auch diesen Pfad schließt."***
>
> **Ich hatte geboardet, ZVZZT sei „draußen, weil unbekannt" — brüchig erst bei einem KÜNFTIGEN
> Referenz-Refresh. Das war zu milde.** *Es ist schon jetzt brüchig, über einen vorhandenen
> Pfad, den niemand anfassen muss, damit er aufgeht.* **c4 nennt es „den stillsten Teil der
> Lücke" — der neue Riegel sitzt deshalb VOR dem Referenz-Nachschlagen.**
>
> **❓ OFFEN, an c4 gefragt, und davon hängt ab, ob wir fertig sind:** *Ist der Ohne-Karte-Rückfall
> auf den Aktienfilter beschränkt — oder ist „Referenz fehlt → alles durch" das **allgemeine**
> Verhalten des Moduls?* **Falls allgemein, ist ein Symptom geschlossen und nicht die Krankheit:
> dann stehen alle Filter an derselben Referenz bei fehlender Karte offen — und zwar STILL, weil
> ein Filter, der nichts auswirft, genauso aussieht wie einer, durch den nichts durchmusste.**

---

### 🧮 27.08. 08:1x — DIE DREI RESTPUNKTE: einer geschlossen, zwei benannt-nicht-entscheidbar

**Die QS hat die offene Liste abgearbeitet — und bei zweien gesagt, warum sie sie NICHT nimmt.
Das ist ein Ergebnis, keine Lücke.**

> #### ✅ Punkt 3 GESCHLOSSEN — die Eröffnungskerzen ohne Umsatzfeld sind **kein zweiter Fund**
>
> | Position im Handelstag | betroffen | von | Anteil |
> |---|---:|---:|---:|
> | 1. Kerze | 26.940 | 2.126.078 | **1,2671 %** |
> | Mitte | 9.353 | 10.563.389 | **0,0885 %** |
> | letzte | 34.118 | 2.125.814 | **1,6049 %** |
>
> **Die Ränder verlieren ihr Umsatzfeld 14- bis 18-mal häufiger als die Mitte** — das sah nach
> einem systematischen Randeffekt aus, und über die Jahre fiel die Rate um Faktor 6.
> **Tageweise aufgelöst zerfällt der ganze Ausschlag:**
>
>     2025-11-28   2.908 von 5.822   49,9 %
>     2025-12-24   2.904 von 5.822   49,9 %
>     alle uebrigen Tage             0,1 bis 0,8 %
>     Uhrzeiten: 18:00 (5.812) | 20:30 (862) | 14:30 (44) | 19:30 (2)
>
> **5.812 der Treffer liegen um 18:00 — exakt 2.908 + 2.904, die beiden Halbtags-Schlusskerzen.
> Also genau das Phänomen, das diese Nacht bereits vollständig aufgeklärt ist.**
>
> **→ Es bleibt ein kleiner stetiger Rest** (0,5–0,7 % der letzten Sitzungskerzen an
> Normaltagen, 862 Kerzen über gut 40 Tage; Eröffnungsstunde nur 44). **Ohne Ereignischarakter.**
> *Und die **435 Eröffnungsfälle der Halbtage** sind damit eingeordnet: derselbe stetige
> Randeffekt, nichts Eigenes.*
>
> **⚠ Der Satz, der die Zerlegung wertvoll macht:** *„Wer die 1,6 % bei den letzten Kerzen
> **ohne** diese Zerlegung liest, hält **einen bekannten Befund für einen zweiten**."*

> #### 🚫 Punkte 1 und 2 — **benannt, nicht entscheidbar mit den vorhandenen Quellen**
> - **132 historische Skalenwechsel:** *„Das Trennmerkmal ist das zweite Archiv, und 60m reicht
>   **730 Tage**. Für die 132 gibt es **keinen zweiten Zeugen**."*
> - **BYND / RGR / SITC / B:** **BYND** wechselt tageweise die Skala — **belegter Defekt**, das
>   zweite Archiv bezeugt es. **RGR, SITC und B** haben dagegen einen **konstanten Versatz**,
>   keinen Wechsel. *„Ein Archiv ist rückangepasst, das andere nicht. **Welches richtig ist,
>   entscheidet man nicht aus den beiden.** Ich kann sagen, DASS sie sich unterscheiden und um
>   welchen Faktor — welches stimmt, kann ich nicht sagen."*
>
> **📐 Vorbildlich und ausdrücklich vermerkt:** *„Ich könnte Stunden damit verbringen und käme
> mit ‚nicht entscheidbar' zurück — **das weiß ich jetzt schon und sage es lieber jetzt**."*
> **Eine Grenze vorher zu benennen ist billiger, als sie zu erfahren.**

> ### 🔴 DAS MUSTER DAHINTER — und es ist eine Frage an Wilhelm, keine Messfrage
> **Vier Stränge dieser Nacht laufen auf DIESELBE Grenze zu:** die 132 Skalenwechsel · der
> Archiv-Versatz bei RGR/SITC/B · die Überlebensverzerrung (≥ 12,7 % des Querschnitts fehlen,
> steigend) · und der Abgleich der Anpassungsstände.
>
> ***„Was fehlt, ist keine Rechnung, sondern eine zweite Quelle."***
>
> **Das ist eine Beschaffungsfrage, keine Messfrage** — und damit nichts, was eine Sitzung
> entscheiden kann. **Kommt als Formular an Wilhelm.**

**Vier Lagen, aus Zeitstempel + Umsatz + Sitzungskontext abgeleitet** — nichts materialisiert,
nichts gepflegt, kann nicht veralten.

> **🔎 Und ein schönes Detail: die Einstufung trennt die alte Zahl „Halbtage 20.160" sauber auf
> in 19.010 `nachhandel` + 1.150 `auktion`. Die Kennzeichnung ist feiner als die Zählung, aus
> der sie entstanden ist.**

**Die PM-Auflage zu den Tests ist wörtlich umgesetzt:** Zugesichert sind **nur die
alterungsfesten Invarianten** (vorbörslich 0 · `nachhandel` an Normaltagen 0), **die wandernden
Beträge stehen als berichteter Ausgangsstand mit Datum** in `lage-invarianten.js`. *Beide
Invarianten halten am echten Archiv.* Prüffall sind die **vier Tagestypen** plus 12
synthetische Fälle, inklusive des ACGL-Auktionsfalls und des Ur-Docht-Falls.

**Unabhängige Bestätigung, ungeplant:** Die **Kreuzsumme trifft die Zahl der Populationszählung
exakt (25.915) — auf einer anderen Rechenstrecke.**

> ### ✅ AUFGELÖST 27.08. 08:0x (QS) — die fünf Kerzen haben einen Namen: **ZVZZT**
> **Beide Zahlen sind richtig gemessen, sie zählen verschiedene Grundmengen:**
>
> | | Kerzen | |
> |---|---:|---|
> | Umsatzkerzen auf dem Halbtags-Schlussstempel, **ohne jede Bedingung** | **1.150** | ← Einstufung |
> | davon **mit 1d-Gegenstück** | **1.145** | ← QS-Zählung |
> | davon **ohne** | **5** | *alle fünf ZVZZT* |
>
> **`ZVZZT` ist das Testkürzel der Nasdaq.** Es hat keine Reihe im Tagesarchiv, und die
> QS-Zählung leitet das Sitzungsende aus dem Tagesbalken ab — ohne Tagesbalken fällt die Reihe
> heraus. *Keine Rechenwegs-Differenz, kein Fehler auf einer der beiden Seiten.*
>
> **→ Welche Zahl gilt, hängt an der Frage:** **1.145** für Wilhelms Populationsentscheid (ZVZZT
> ist kein handelbares Papier) · **1.150** für eine Bestandsaufnahme des Archivs (die Kerzen
> sind da). **Wer eine der beiden zitiert, nennt weiter ihre Herkunft.**

*Kein `index.html`-Eintrag, solange kein Anzeige-Verbraucher existiert.*

> ### ⚖ ENTSCHIEDEN 27.08. 08:3x (Messseite, `markt-dashboard-c4`) — dauerhaft
> **Die Messmaschine bleibt UNVERÄNDERT. `kerzenlage.js` ist als Instrument registriert, nicht
> eingebaut.**
>
> **Begründung gemessen statt gemeint:** Der A/B-Lauf hat den Ausschluss **genau dieser**
> Kerzenfamilien als **wirkungslos** vermessen — Faktor 6–27 unter `delta80`. *Ein Einbau wäre
> ein Versionssprung und Protokoll-Unvergleichbarkeit **ohne messbaren Gegenwert**.*
>
> **Drei Revisions-Kriterien, benannt statt offen gelassen:**
> 1. Live-Zähler-Flips auf `schlusskurs`-Kerzen,
> 2. ein künftiger lagenabhängiger Effekt **≥ `delta80`**,
> 3. **und dann zuerst AUSWEISEN je Lage — wie bei Schicht G —, NIE Ausschluss zuerst.**
>
> **Für Empfindlichkeitsläufe außerhalb der Maschine ist `kerzenlage` ab sofort Mittel der
> Wahl.**
>
> *Punkt 3 ist die verallgemeinerbare Lehre: **erst messen, was eine Klasse beiträgt, dann
> entscheiden, ob sie hinaussoll** — genau die Reihenfolge, die diese Nacht siebenmal
> gerettet hat.*

### 🚀 27.08. 07:55 — WILHELM HEBT DIE RELEASE-SPERRE AUF: **JETZT AUSLIEFERN**

**Die Sperre aus `83796d8` ist aufgehoben.** Begründung des Entscheids: *Die Datenfunde
betreffen das **Kursarchiv**, nicht die App-Oberfläche. Die Messseite ist gemessen entlastet
(Docht-Lauf, Faktor 6–27), Fund 1 ist entschieden. Der Stau von **188 Commits und 12
Release-Notizen** erreicht damit Wilhelm; die Archiv-Arbeit läuft davon unabhängig weiter.*

**→ An die Release-Wache: ausliefern.** *Version und Bau gehören ihr allein — nicht dem PM und
keiner Sitzung.*

### ⛔ 27.08. 08:0x — DER PUSH IST GESCHEITERT, und der Neubau hat einen stillen Fehler verhindert

**Während des Baus (Start 07:57) hat eine parallele Sitzung auf `main` gepusht** (`a5b66e0`,
07:59) — der Release-Push wurde abgelehnt. **Nichts ist verloren:** Tag entfernt, alle 12
Notizen zurückgeholt, nichts halb veröffentlicht.

> **🎯 DER WICHTIGE TEIL IST, WARUM DIE WACHE NEU BAUT STATT DEN PUSH ZU WIEDERHOLEN:**
> Das Skript baut in einem eigenen Worktree auf dem HEAD **von Bauanfang** — `kerzenlage.js`
> ist also **nicht im Paket**, der Tag `v8.34.0` würde ihn aber tragen. **Ein Release, dessen
> Tag Code verspricht, den der Installer nicht enthält.**
>
> **Und die QS hätte es NICHT gefangen:** Sie prüft die in `index.html` eingebundenen
> Skripte — **`kerzenlage.js` steht dort nicht.** *Dieselbe Familie wie „Build lieferte Module
> nicht aus", nur diesmal **vor** der Auslieferung bemerkt.*

**Die Nummer bleibt 8.34.0** (steht in `package.json`, hat keinen Tag — es wird keine Nummer
verbrannt). **Funkstille ausgesprochen:** vier Sitzungen angeschrieben, der PM hält seine
eigenen Tafel-Pushes ebenfalls zurück.

**→ PM-Vorschlag an die Release-Wache (ihre Entscheidung):** *„Vor dem Push auf die Tafel
sehen" trägt nicht — zwischen Bau-Start und Kollision lagen **zwei Minuten**, und die Tafel
erfährt es erst über eine Nachricht.* **Was nachweislich funktioniert hat, ist die Sperrdatei
des Nachladers** (`_laeuft.json`: Startzeit, PID, Rechner — vier Sitzungen haben sie geprüft,
drei Läufe korrekt daran abgebrochen). **`tools/release.js` könnte dasselbe tun** — ins
`finally`, mit Verwaisungs-Prüfung.

**🏗 NEUBAU LÄUFT — Stufe `--minor`, also 8.34.0.** *Begründung: Unter den zwölf
Notizen sind **zwei sichtbare Neuerungen**, nicht nur Korrekturen — eine **neue Seite**
(`Werkzeuge › Kursarchiv`) und eine **neue Spalte** (`Feinheit` im Scoreboard).* **Die
endgültige Zahl kommt aus der letzten Zeile des Skripts, nicht aus dieser Rechnung** — bei
zehn Sitzungen auf einem Baum kann dazwischen etwas passieren.

> **⚠ Und ein Punkt zum Arbeitsbaum, den die Release-Wache selbst gemeldet hat:** Der Baum war
> **nicht sauber** — `studien/datenfund-dochte-2026-08-27/reparatur.js` stand mit neun Zeilen
> offen. **Nach dem Buchstaben ihrer Rolle wäre das ein Abbruchgrund gewesen.** Sie hat
> trotzdem gebaut, weil `tools/release.js` die Datei als *„offen, aber ohne Folge — nicht im
> Paket"* ausweist: **der Grund, aus dem ein schmutziger Baum sperrt, ist hier gemessen
> ausgeschlossen statt für unwahrscheinlich gehalten.**
>
> ***„Beim nächsten Lauf wäre sie wieder im Weg — und dann vielleicht mit einer Datei, die sehr
> wohl ins Paket geht."*** *Weitergegeben; der Kommentar wird separat committet.*

**Die Archiv-Arbeit ist damit NICHT erledigt**, nur entkoppelt: Kennzeichnung der
Randzeiten-Kerzen (Entscheid 1) und Nachzählen des 25.08. (Datenfund 2) laufen weiter.

*Die Release-Wache hatte ausdrücklich **davon abgeraten**, wegen der Staugröße zu lockern —
„188 Commits sind unangenehm, aber kein Sachgrund". **Der Entscheid stützt sich nicht auf den
Stau, sondern darauf, dass Archiv und Oberfläche verschiedene Dinge sind.***

### ✅ 27.08. 05:50 — WILHELM HAT ALLE DREI ENTSCHIEDEN (per Formular)

| | Entscheid | Was daraus folgt |
|---|---|---|
| **1** | **Randzeiten-Kerzen BEHALTEN und KENNZEICHNEN** | ✅ **UMGESETZT 08:2x (`a5b66e0`).** Es sind echte Kursdaten aus einem anderen Handelsfenster; **nichts wurde gelöscht.** Gebaut ist eine **abgeleitete Einstufung** mit vier Lagen — `sitzung` / `auktion` / `schlusskurs` / `nachhandel` — statt eines Feldes an der Kerze oder einer Liste im Archivkopf. *Begründung der Wache: „Eine Liste im Archivkopf würde vom nächsten Nachlade-Lauf überschrieben — **das wäre die nächste Naht, an der zwei Wahrheiten entstehen.**"* |
| **2** | **Abmeldedatum SETZEN** | Messhygiene: Ein Papier mit Abmeldedatum kann nicht über sein Ende hinaus gehalten werden. **Achtung: die Daten am jüngsten Rand sind unzuverlässig** — AVB steht mit 18.08. in der Liste, handelte aber bis 24.08. *Handelsende statt Listendatum verwenden, wo beide bekannt sind.* |
| **3** | **Messband auf die LIVE-Hürde umstellen** | Beide Anzeigen zeigen dann dasselbe wie das Scoreboard. **Eine Zeile** — die Stelle wurde heute Nacht dafür freigelegt (`huerdePp()`), ohne zu entscheiden. |

*Der Dialog-Fokus (Schließen-Kreuz zuerst) war nicht Teil des Entscheids und bleibt offen.*

### ⭐ ~~Was auf Wilhelm wartet~~ — die drei Entscheidungen (Vorgeschichte)

| | Frage | Lage |
|---|---|---|
| **1** | **Was geschieht mit den Kerzen nach Sitzungsende?** ⚠ **ZWEI Familien — sie brauchen ZWEI Zeilen im Entscheid.** | **Siehe eigener Kasten unter der Tabelle.** *Ein pauschales „kein Nachhandel im Archiv" würde **5.755 offizielle Schlusskurse mitlöschen.*** |
| **2** | **Bekommen die delisteten Papiere ihr Abmeldedatum?** | **⚠ DRINGLICHKEIT IST ZURÜCK — der Entscheid hat wieder einen Sachgrund, nicht nur Ordnungsliebe.** *(Zweimal korrigiert: 02:10 nach unten, 04:05 wieder hinauf.)* **Die Deckelungs-These ist falsifiziert:** BTSGU hat heute Nacht einen **weiteren** Phantomtag bekommen — **wenn Schwänze wachsen können, ist die dauerhaft flache Reihe nicht mehr ausgeschlossen**, und genau die würde eine Momentum-Rangfolge nach oben spülen. *Stand: Universums-Reihen bisher ohne Wachstum, Rastermechanik und Referenzlauf unberührt.* **→ „Messhygiene mit Beobachtung."** |
| **3** | **Welche „Kostenhürde" zeigt das Messband?** | Zwei verschiedene Zahlen tragen denselben Namen; in der Voreinstellung stimmen sie zufällig überein. Live-Hürde oder feste Referenz — beides vertretbar, der Doppelname nicht. *(Kleiner Zusatz, mitentscheidbar: In vier von fünf Dialogen landet der Tastaturfokus zuerst auf dem Schließen-Kreuz — erlaubt, aber die schlechteste erlaubte Wahl. Fünf Zeilen Arbeit.)* |

> ### ⚠ ZU ENTSCHEIDUNG 1 — die Zahl liegt vor, und sie zerfällt in zwei Familien
>
> **Gemessen (Populationszähler, sitzungsbewusst über Sommer/Winter und Halbtage):**
> `archiv60m` hat **14.815.281 Kerzen in 2.916 Reihen**. Nach Sitzungsende: **25.915** (0,17 %),
> davon 24.765 mit Volumen 0. **Vor der Sitzung: 0. Lage unbestimmbar: 0.**
> Betroffen sind **2.915 von 2.916 Reihen — flächendeckend, nicht vereinzelt.**
>
> | Familie | Zahl | was es ist |
> |---|---|---|
> | **(A) Halbtage, OHNE Umsatz** | **~19.015** | **die eigentliche Streitpopulation.** Echter Nachhandel; genau eine Kerze je Reihe und Halbtag. Von drei Seiten belegt, drei Isolierungsversuche gescheitert. |
> | **(A2) Halbtage, MIT Umsatz** | **1.145** über 859 Reihen, zusammen **115,6 Mio Stück** | **⚠ DIE SCHLUSSAUKTION — echte Sitzungsdaten.** *Unabhängig gegengezählt: `-06` kam auf 1.150.* |
> | **(B) Normaltage** | **5.755** — **alle** um 20:00 UTC | **die Schlusskurs-Familie.** Beginnt exakt am Sommersitzungsende und trug in **99,4 %** der Fälle den **offiziellen Schluss** — es ist der genaueste Wert im Archiv. |
>
> **🔴 (A2) IST HEUTE NACHT UM 04:10 DAZUGEKOMMEN UND HÄTTE DEN ENTSCHEID SONST TEUER GEMACHT.**
> An Halbtagen trägt die Kerze auf dem Sitzungsende **bei einem Teil der Reihen echten Umsatz**
> — und zwar den der **Schlussauktion**:
>
>     ACGL 2024-12-24   16:30  c 92,31  v 149.262   (Sitzungsstunde)
>                       18:00  c 92,67  v 335.604   <-- MEHR als jede Stunde davor
>     ACGL 2025-12-24   18:00  c 96,40  v 0         derselbe Titel, anderer Halbtag
>
> **Wie oft, je Halbtag:** 2023-11-24 **0,0 %** · 2024-07-03 **9,8 %** · 2024-11-29 1,9 % ·
> **2024-12-24 22,5 % (647 von 2.879)** · 2025-07-03 5,6 % · 2025-11-28 0,0 % · 2025-12-24 0,0 %
>
> > **Eine Regel, die „die Kerze nach Sitzungsende" pauschal entfernt, löscht am 24.12.2024 bei
> > 647 Reihen die Schlussauktion.** *Dieselbe Sorte Kollateralschaden wie bei den 1.111
> > Schlusskerzen im Minutenarchiv — heute Nacht zum zweiten Mal knapp verhindert.*
>
> **→ DER UNTERSCHEIDER LIEGT IN DEN DATEN UND IST EINFACH: UMSATZ.**
> **Mit Umsatz = Sitzung. Ohne Umsatz = Nachhandel.** *Der Populationszähler hat es bereits so
> getrennt (25.915 nach Sitzungsende, davon **24.765 ohne** Umsatz). **Diese Trennung ist nicht
> kosmetisch — sie entscheidet über echte Kursdaten.***
>
> *Korrigiert damit eine frühere QS-Aussage: „an Halbtagen fehlt die letzte halbe Sitzungsstunde,
> 40 von 40" gilt weiter **für die 17:30-Kerze** — aber die Daten dieser Halbstunde tauchen bei
> einem Teil der Reihen **in der 18:00-Kerze wieder auf**, statt zu fehlen. „Die letzten 30
> Handelsminuten fehlen" war zu absolut.*
>
> *Und es stützt Lauf 1 ungeplant: Der 24.12.2024 hat dort mit **420** die wenigsten
> auswertbaren Strukturfälle aller sieben Halbtage — **genau der Tag, an dem 647 Reihen eine
> 18:00-Kerze mit Umsatz haben**, die damit die Tagesspanne erweitert statt Phantom zu sein.*
>
> > **🔴 DESHALB BRAUCHT DER ENTSCHEID ZWEI ZEILEN: Ein pauschales „kein Nachhandel im
> > 60m-Archiv" würde die 5.755 offiziellen Schlusskurse mitlöschen.** *Familie B sieht formal
> > aus wie Familie A — nach Sitzungsende, Volumen 0 — und ist inhaltlich ihr Gegenteil.*
> > **Das ist derselbe Fehler wie die sieben gestoppten Löschregeln dieser Nacht, nur auf der
> > Ebene einer Politik statt einer Regel.**
>
> **Zu entscheiden ist also nur (A):** *(a)* die 20.160 Halbtags-Nachhandelskerzen **entfernen**
> — konsequent wie in den App-Archiven, wo 0 von 990.509 Randzeiten-Kerzen stehen; oder *(b)*
> sie **behalten und kennzeichnen** als das, was sie sind. **Werte reparieren steht nicht mehr
> zur Wahl** — der Docht-Effekt hebt sich im Überschuss auf (Faktor 6–27 Abstand), und drei
> Versuche, die Kerzen als Fehler zu isolieren, sind gescheitert. *Für **(B)** empfiehlt der PM
> ausdrücklich: **behalten**, sie ist der beste Schlusskurs im Bestand.*

### 🔚 27.08. 05:20 — „Ergebnis oder Heap-Tod" — es wurde ein DRITTES: ein Hänger

**Der PM hatte gesagt: „Ergebnis oder Heap-Tod, beides ist eins."** Es ist keins von beiden
geworden. Die IO-Sonde der Archiv-Wache zeigt:

    --basis-Prozess: liest seit >20 s NICHTS mehr
    ReadTransferCount eingefroren bei 786 MB (~ halbes Archiv)
    CPU: Volllast seit Stunden.  RAM: aufs MB konstant.

**Endlos- oder quadratische Schleife — kein Fortschritt.** *Der Prozess stört nichts außer CPU
und läuft weiter, bis die QS über Kill und Fix entscheidet; es ist ihr Werkzeug.*

> **🧭 UND DIE LEHRE IST DIE PASSENDSTE ZUM SCHLUSS DIESER NACHT, weil sie dieselbe Form hat
> wie alles davor — diesmal an einer Betriebsprüfung:**
> ***„CPU wächst" belegt Rechnen, nicht Fortschritt. Die Lese-Sonde ist die richtige
> Positivkontrolle.***
>
> *Ein Prozess unter Volllast **sieht** aus wie einer, der arbeitet. Genau wie eine PID, die
> existiert; wie eine Prüfung, die grün wird, weil sie das Falsche sucht; wie eine
> Wartebedingung, die vorher schon wahr war; wie ein Kriterium, das für alles gilt.*
> **Fünfmal dieselbe Frage in einer Nacht: Was genau hat diese Prüfung geprüft?**

### 📋 27.08. 05:15 — DIE POLITIK-ZEILE FÜR WILHELM, wörtlich aus der Desingner-Übergabe

**Falls der Entscheid „verwerfen" lautet, gehören DREI SCHUTZKLAUSELN dazu — jede hat heute
Nacht einen konkreten Schaden verhindert:**

1. **Die Schlusskurs-Familie bleibt separat** (5.755 Kerzen an Normaltagen, 20:00 UTC — in
   99,4 % der offizielle Schluss).
2. **Umsatz-Kerzen auf dem Sitzungsende sind die AUKTION** (1.145 Kerzen, 115,6 Mio Stück; am
   24.12.2024 allein 647 Reihen).
3. **Die Verwerf-Regel muss SITZUNGSBEWUSST sein** — Prüffall sind die vier Tagestypen aus
   `werkzeuge/halbtagsschluss.js`.

> **⚠ UND EIN SATZ, DEN DIE ARCHIV-WACHE ÜBER IHR EIGENES WERKZEUG SCHREIBT — der wertvollste
> der Übergabe:**
> ***„Mein `reparatur.js` ist dafür NICHT das Werkzeug — P-WEG misst gegen die falsche Spanne,
> an Halbtagen 3 statt 3,5 Stunden."***
> *Wer sein Werkzeug nach vier Stunden Arbeit selbst disqualifiziert, verhindert genau den
> Fehler, den sonst der Nächste macht: Er findet ein fertiges Werkzeug im Ordner, hält es für
> das passende und benutzt es.* **Bei Entscheid „verwerfen" braucht es die Einlese-Regel in
> `kerzenquelle.js` (Formel als benannte Konstante) plus eine einmalige Bereinigung — nicht
> dieses Skript.**

**F1-POLITIK, ebenfalls an Wilhelm:** das **BRK.A-Falsch-Positiv** · der **Schnitt am letzten
Sprung** als Rettungsoption (CHRD ~1.446 saubere Kerzen) · und **die Offenlegung der
Frisch-Fenster-Setzung** (bei weiterem Fenster **3 statt 1** frische Fälle: ELME, MLTX).

**OFFEN, eigener Punkt:** die **Anpassungs-Inkonsistenz 60m gegen 1d** bei BYND, RGR, SITC, B
— *der einzige echte neue Datenfund der letzten Stunde und der einzige, bei dem **zwei
Sitzungen unabhängig auf dasselbe Papier** gestoßen sind.*

**PM-Entscheid zu den Belegen:** Die Studien-Skripte **und** die 72 Rohantworten kommen ins
Repo (1,1 MB gesamt). *Sie sind der einzige unabhängig entstandene Positivsatz für die
Giftkerzen — die QS hat ihren Sucher daran belegt, `1d` die Fenstersperre (152 von 152
gefangen, 0 von 25.915 falsch). **Ohne die Rohdaten ist das eine Behauptung über eine Prüfung,
die niemand nachvollziehen kann.***

### 💰 27.08. 05:10 — DIE KOSTENMESSUNG: die Annahme stimmt, der Beleg ist schwächer als gedacht

**Die QS hat nicht bis morgen gewartet, weil an dieser Messung die 0,10-%-Annahme hängt.**
*(Vermerk `qs-audit-2026-08-27-0510-KOSTENMESSUNG.md`.)* **Zwei getrennte Ursachen, nicht eine:**

**1. Ein Depot-Reset hat 38 gemessene Runden abgetrennt — sie sind NICHT verloren.**

    store/depot.json             kostenMessung:  1 Runde
    store/depot_vor_reset.json   kostenMessung: 38 Runden, 25.08. 12:02-13:32

*Niemand hat gemerkt, dass sie noch da sind.*
**→ ✅ VOM PM GESICHERT (04:28) nach `Markt-Dashboard-Daten/kostenmessung-sicherung-2026-08-27/`,
bevor `depot_vor_reset.json` beim nächsten Reset überschrieben wird. Unabhängig nachgezählt:
38 Runden, 22 Krypto, 16 Aktien — deckungsgleich mit der QS.** *Es sind die einzigen echten
Kostenmessungen, die das Projekt hat.*

**2. Seither scheitert die Spiegelung an der Margin.** `capFehler` nennt dreimal
`RC_NOT_ENOUGH_MARGIN`, jüngster **26.08. 14:58 ABBV**. Ohne gespiegelte Ausführung keine
Schlupfwerte, und `kostenMessungNeu` bricht ohne beide ab. *Im Export vom 27.08. trägt **kein
einziger** Trade ein `capSlipOpen`-Feld, alle drei offenen Positionen haben `capDealId` null.*
**→ Seit dem 25.08. kann gar keine Runde mehr entstehen.**

**3. 🔴 UND DER ZÄHLER ZÄHLT DAS FALSCHE.** Alle 38 Runden tragen `basis: true` — der Marker
heißt **BASISWERT** (im Gegensatz zum Schein), **und Krypto zählt dort mit. 22 der 38 sind
ETHUSD.**

    Anlageart    n    Median      Mittel     p90       max     ueber 0,10 %
    alle        38   0,0707 %   0,0855 %   0,1142   0,2525        8
    KRYPTO      22   0,0706 %   0,0708 %   0,0719   0,0986        0
    AKTIEN      16   0,1031 %   0,1057 %   0,1672   0,2525        8

> **Wer den Basis-Marker als Aktienzähler liest, hält 38 für erreicht, wo 16 stehen.**
> *Die Strang-A-Freigabe verlangt **20 Aktienrunden**.*

**✅ DIE GUTE NACHRICHT: Für Aktien liegt die gemessene Rundenkosten bei Median 0,1031 % und
Mittel 0,1057 %. Die Annahme von 0,10 % ist bemerkenswert gut getroffen** — weder zu
optimistisch noch zu vorsichtig. *Gepoolt ergäbe sich 0,0707 % — **30 % unter der Annahme, und
falsch**, weil es die Aktienkosten mit Krypto verdünnt.*

> **⚠ DIE EINSCHRÄNKUNG WIEGT SCHWERER ALS DIE ZAHL, und die QS stellt sie deshalb voran statt
> in eine Fußnote: ALLE 16 AKTIENRUNDEN STAMMEN AUS EINER MINUTE** — 25.08., 13:31 bis 13:32
> UTC, 15 verschiedene Werte. ***Das sind nicht 16 unabhängige Beobachtungen der Handelskosten,
> sondern eine Marktlage, 15-fach abgetastet.*** *Die 22 Krypto-Runden verteilen sich dagegen
> über anderthalb Stunden — ihre enge Streuung ist deshalb aussagekräftiger.*
>
> **→ Die Freigabeschwelle „20 Aktienrunden" muss als das gelesen werden, was sie prüfen soll:
> 20 Runden aus VERSCHIEDENEN Marktlagen, nicht 20 aus einer Minute. Sonst erfüllt man sie mit
> einem einzigen Klick.**

**Drei Bauarbeiten, von der QS benannt und ausdrücklich nicht ausgeführt:** die 38 Runden
sichern *(erledigt, PM)* · die **Margin-Ursache im Handelspfad** · der Zähler sollte
**`istKrypto`** benutzen, *das im Handelsmodul zwölfmal aufgerufen wird und in der
Kostenmessung nicht.*
**Nicht geprüft:** ob die 38 vollständig sind oder der Reset-Abzug selbst schon eine Auswahl
ist, und ob es **weitere Abzüge mit weiteren Runden** gibt.

### 📗 SCHLUSSSTAND DER NACHT — was gilt, was gesperrt ist, was offen bleibt

**✅ BELASTBAR UND WEITERGEBBAR**

- **Die Reparatur ist keine.** Die Quelle liefert an Halbtagen **genau eine** Kerze nach
  Sitzungsende, an Normaltagen **keine**; das Archiv kopiert das 1:1. **Zweifach unabhängig
  belegt** (12/12 bei der QS, 30/30 bei `-06`). **Es gibt keine Codestelle zu richten — es gibt
  eine Entscheidung zu treffen.**
- **Option (c) ist erledigt.** Der Tagesbalken ist das **Sitzungsaggregat** — A dominiert auf
  **jeder** Sprosse der Toleranzleiter, C liegt an Normaltagen durchgehend bei **0,0 %**.
- **⚠ Eine Verwerf-Regel darf NUR Kerzen nach Sitzungsende MIT UMSATZ 0 treffen.** Die **1.145
  mit Umsatz sind Sitzungsdaten** — am 24.12.2024 hätte eine Pauschalregel bei **647 Reihen die
  Schlussauktion gelöscht.**
- **Strukturprüfung: kein Strukturüberschuss, 7 von 7.** Überlebt die Teilung nach
  Wertpapierart (0 strukturgleich bei Aktien **wie** bei ETFs). **Das heißt NICHT „Beleg für
  Handel", sondern „nicht stärker gehäuft als gewöhnliche Kerzen".**
- **Die Phantom-Kerze trifft den amtlichen Tagesschluss 8- bis 12-mal häufiger exakt** als die
  letzte Umsatzkerze — **unter beiden Populationsdefinitionen.**

**🚫 GESPERRT — NICHT WEITERGEBEN** *(alle fünf waren zeitweise geglaubt)*

| Satz | warum er fällt |
|---|---|
| „Die Phantom-Kerze liegt **näher** am Tagesschluss" | 57,7 % gegen 41,7 % je nach Definition; die ursprünglichen **67,5 % waren ein Auswahleffekt** |
| „Der dichte Kern am 24.12.2025 ist ein Fund" | er misst **ETF-Gleichlauf** |
| „Der Zähler friert ein" | durch **BTSGU** widerlegt |
| „Die letzten 30 Handelsminuten fehlen" | sie fehlen im 17:30-Feld und **tauchen bei einem Teil der Reihen im 18:00-Feld auf** |
| „Der Sitzungsfilter greift eine Stunde zu weit" | widerlegt — **die Quelle liefert es so** |

**🔓 OFFEN UND BENANNT:** die **132 historischen Skalenwechsel** ohne zweiten Zeugen · der
**12-%-C-Anteil an Halbtagen** im Schiedsrichter · **wo die 435 Eröffnungskerzen ihr Umsatzfeld
verlieren** · die **Kostenmessung** (1 Runde seit 25.08., Prüfbedingung läuft) · **TWO**.

### 🧠 Die Bilanz der QS über sich selbst — und die drei Gegenmittel, die gewirkt haben

> **„Ich habe in dieser Nacht acht eigene Aussagen zurückgezogen. Bei allen acht war die
> Messung richtig und der Satz darüber zu weit oder das Werkzeug schief. Fünf davon haben es
> gar nicht erst auf die Tafel geschafft, weil jemand vorher nachgefragt hat."**

**Fünf Werkzeug-Fallen, ins Rollengedächtnis geschrieben, damit die nächste Sitzung sie nicht
neu findet:** Auswahl auf die Zielgröße · Poolung heterogener Populationen · eine
Wartebedingung, die vorher schon wahr war · Bezugswerte aus gerundeter Anzeige · der Abgleich
eines Kriteriums, das nie feuert.

**Drei Gegenmittel, die tatsächlich funktioniert haben:**
1. **Ein zweiter Leser findet anderes als eine zweite Messung.**
2. **Eine Toleranz-Leiter statt einer nachträglich gewählten Schwelle.**
3. **Bei einem Ergebnis von 100 % zuerst fragen, ob das Kriterium überhaupt anders ausgehen
   könnte.**

> **Und der Satz, den die QS ausdrücklich NICHT als Regel abgelegt hat, weil er in die Übergabe
> gehört und nicht in ein Regelwerk:**
> ***„Die entscheidenden Korrekturen dieser Nacht kamen nicht aus mehr Messung, sondern daraus,
> dass drei Sitzungen dieselben Zahlen mit anderen Augen gelesen haben."***

### 🔒 Was läuft — Stand 03:45

**✅ DAS NACHLADEN IST SAUBER DURCH.** Sperre gefallen **03:34:34**, Wachhund **Exit 0**,
`archiv1d` Rückstand **0 Handelstage**, 2.965 von 2.965 geprüft, **keine einzige Alarmdatei
über die ganze Wache.** *Beide Archive vollzählig; letzte geschriebene Datei bei 60m und 1d
dasselbe Symbol — also alphabetisch bis zum Ende gelaufen, nicht abgebrochen.*

> **🔗 EINE UNABHÄNGIGE BESTÄTIGUNG, DIE NIEMAND GEPLANT HAT:** Der Wachhund weist **9
> zurückhängende Reihen** aus — **TWO, AVB, EQR, LBRDA, LBRDK, WBS** plus drei Altfälle.
> **Das sind exakt die Reihen, die diese Nacht aus drei ganz anderen Richtungen gefunden hat:**
> der Wachhund misst **Rückstand**, die QS misst **Stempelkerzen**, `1d` hat die **SEC**
> gefragt. *Drei Verfahren, dieselbe Menge.* Und sichtbar ist es nur, weil die
> Rundungs-Reparatur den Rückstand jetzt **ehrlich ausweist statt ihn wegzurunden.**

**Nichts wird verändert. `--wirklich` bleibt gesperrt** — und seit dem Docht-Ergebnis hat die
Reparatur ohnehin **keine Dringlichkeit** mehr. *Das Werkzeug bleibt mit allen Sperren im
Wartestand, falls Wilhelms Politik-Entscheid je eine Anwendung verlangt.*

**Seit 03:37 laufen vier vorregistrierte Messungen** (die fertigen 4 und 5 werden korrekt
ausgelassen), ein Prozess je Lauf, Sperrprüfung vor jedem einzelnen:

    [1] Phantom-Schluss ueber alle sieben Halbtage   Strukturfrage fuer Wilhelms Entscheid
    [2] Schiedsrichter-Test (A/B/C)                  entscheidet ueber Option (c)
    [3] 1d-Schluss gegen 60m-Schluss                 fuer Strang A
    [4] Stempel-Sucher auf 60m gegen die 149         Kontrolle
    [5] Kurssprung auf 60m                           zweite Stempel-Familie

*Alle fünf verweigern bei stehender Sperre nachweislich — gemessen, nicht angenommen. Der
Treiber **wartet nicht, er verweigert**: „ein Treiber, der wartet, verdeckt nur, dass er
nichts tut."*

### 📐 VIER NEUE HAUSREGELN AUS DIESER NACHT — alle gegen dieselbe Krankheit

**Neben der bestehenden Regel „jeder Nullbefund braucht eine Positivkontrolle" stehen ab
sofort zwei weitere. Alle drei behandeln denselben Defekt: eine Zahl ohne ihren Geltungsbereich.**

| Regel | woher sie kommt |
|---|---|
| **1. Jeder Nullbefund braucht eine Positivkontrolle.** *(bestand schon)* | Eine Prüfung, die nichts findet, muss zeigen können, dass sie überhaupt etwas finden würde. |
| **2. Jede Messung nennt die Tage und Reihen, für die sie gilt.** | Die 20:00-Kerze: an **einem** Tag gemessen, auf **alle** Tage gelesen — und vom PM als größter Fund der Nacht an die Spitze gesetzt. Sie existiert an genau zwei Tagen. |
| **3. Jedes Warnsignal trägt sein Messdatum.** | „1m bei 1.834 von 2.732" war beim Schreiben richtig und beim Weitergeben überholt. Der PM hat zwei solche Einträge als eilig verteilt. |
| **4. Zieht eine Aussage eine HANDLUNG nach sich, steht „gemessen" oder „gefolgert" IM SATZ — nicht im Nebensatz.** | Fünf zurückgezogene Sätze in einer Nacht, **bei allen fünf war die Messung richtig und der Satz darüber zu groß.** Vier betrafen Deutungen; **der fünfte hätte jemanden an einer Datei arbeiten lassen** („der Filter greift eine Stunde zu weit" — gefolgert, als Befund formuliert, mit Codestelle auf dem Weg in Wilhelms Vorlage). |
| **5. Bei einem Ergebnis von 100 % zuerst fragen, ob das Kriterium auch anders ausgehen KÖNNTE.** | Die „210 von 210" — beide Klassen 100 %. *Ein Kriterium, das für alles gilt, unterscheidet nichts.* |

> **Regel 2 und 3 sind dieselbe Regel in zwei Richtungen: Eine Zahl braucht ihren Umfang
> (welche Tage, welche Reihen) und ihren Zeitpunkt (wann gemessen). Ohne beides altert oder
> wandert sie, ohne dass es jemand merkt.**

*Beide Regeln wurden von den Sitzungen vorgeschlagen, nicht vom PM — und beide Male an einem
Fehler des PM.* **Regel 2 hat sich sofort selbst bewährt:** Die Auflage „drei Tage
unterschiedlichen Charakters" war der einzige Grund, warum die falsche Reichweite auffiel.

### 🧭 Der rote Faden der Nacht

**Acht Fehler hatten dieselbe Form: eine Zahl ist richtig gerechnet und beantwortet trotzdem
eine andere Frage als die gestellte.** 37,6 % „Teilkerzen", die zu 99,4 % Schlusskurse waren.
76,4 % „echte Extreme", die von den Normaltagen getragen wurden. Eine Positivkontrolle, die
Empfindlichkeit belegt und für Vollständigkeit gehalten wird. Eine Asymmetrie, die als Beleg
für Verfälschung diente und ohne jede Verfälschung entsteht.

**Und der Satz, der bleibt** (QS, nachdem sie in derselben Nacht zum zweiten Mal auf dieselbe
Zahl hereingefallen war): ***Die Falle verschwindet nicht durch einmaliges Erkennen.***

*Alle Einzelheiten in den datierten Abschnitten unterhalb und unter „Aufträge".*

---

## 🔎 Die Funde der Nacht im Detail — chronologisch rückwärts

*Alles unterhalb dieser Zeile ist Beleg zur Bilanz oben. Wer nur wissen will, was zu
entscheiden ist, hat es bereits gelesen.*

### 🔍 27.08. 03:15–03:45 — der Analytiker lief: KEIN FUND, und das ist diesmal ein starkes Ergebnis

*(Übergabe `analytiker-2026-08-27-0330.md`, Befund `studien/analytiker/2026-08-27/BEFUND.md`,
Commit `806cae5`.)*

**Er hat alle 35 Varianten-Entscheidungen der zwölf frischen Protokolle mit einer EIGENEN,
unabhängigen Implementierung nachgerechnet** (`nachrechnung-d.js`): **Schwelle, `delta80`,
Urteile, `tage80` und `bestesUrteil` sind deckungsgleich.** Alle zwölf Placebos bestehen. **Live-
Konfiguration = gemessene Konfiguration** (alle Wechselpfade laufen durch `applySetup`, ≥261
Kerzen erzwungen). *Die einzige Abweichung ist erklärt und harmlos.*
**`archiv1d` war die ganze Nacht gesperrt — es wurde nichts auf gemischtem Archiv gemessen.**

**Nicht geschafft und ausdrücklich benannt:** kein frischer Placebo-**Maschinen**lauf (1d
gesperrt; auf 60m unterlassen **wegen der bekannten `messen.js`-Falle, dass er Protokolle
überschreibt** — richtige Zurückhaltung).

### 💰 27.08. 04:25 — die Kostenmessung: der Store lebt, die Messung nicht

**Der Analytiker meldet als Beobachtungsauftrag:** Der Live-Store steht **seit 25.08. 18:22 UTC
bei EINER Runde**; am Handelstag 26.08. kam **keine** dazu. *Seine offene Frage: „Unklar bleibt,
ob die App am 26.08. überhaupt lief — davon hängt ab, ob das ein Fund ist oder nur ein
geschlossener Rechner."*

**Der PM hat die Hälfte davon geklärt, weil sie sich in einer Minute klären ließ:**

    Store-Datei zuletzt geschrieben : 27.08.2026 04:23 (also gerade eben)
    kostenMessung.runden           : 1
    einzige Runde                  : 25.08.2026 18:22 UTC, AAPL call, runde 0,00042
    Messung laeuft seit            : 25.08.2026 18:22 UTC

> **→ Der Store ist NICHT tot — er wird laufend geschrieben.** Was fehlt, ist die
> **Kostenrunde**. Damit ist die Frage „lief die App?" für **heute** beantwortet (sie läuft),
> und der Verdacht verengt sich auf den Messbetrieb selbst.
>
> **⚠ Warum das zählt:** An dieser Messung hängt die **0,10-%-Kostenannahme**, auf der fast
> jede Studie dieses Projekts steht — und die Freigabe-Regel für Strang A verlangt **≥ 20
> Aktienrunden**. **Bei einer Runde in zwei Tagen ist dieses Kriterium unerreichbar.**
>
> **Prüfbedingung des Analytikers bleibt gültig:** *Steht morgen Nacht immer noch 1 Runde,
> obwohl die App an einem Handelstag lief, ist der Messbetrieb tot — dann ist es ein Fund und
> braucht eine Bausitzung.*

### ⚖ Richtigstellung zu den 6 nachhängenden Reihen — der Wachhund rät, die Nacht weiß es

**Der Analytiker gibt weiter, was der Wachhund meldet:** die 6 nachhängenden 60m-Reihen (TWO 2
Handelstage, LBRDA/LBRDK/WBS 5, EQR 7, AVB 8) seien **„eher Abruffehler als Delisting"**.

> **Das ist überholt. Fünf der sechs sind SEC-belegte Delistings** (`25-NSE` **und** 8-K Item
> 2.01 am selben Tag), von `markt-dashboard-1d` heute Nacht geprüft — und ihr Nachhängen ist
> **genau der erwartete Zustand**, nicht ein Fehler. **Nur TWO bleibt offen** (kein
> Delisting-Datum, 19 Mio Umsatz am 24.08.) — *und das ist derselbe Wert, den der Analytiker
> als einzigen zur Nachschau vormerkt.* **Beide Wege kommen auf denselben Rest.**

### 🔴 27.08. ~04:20 — DIE GEGENRECHNER HABEN EINEN ECHTEN FEHLER GEFUNDEN: Auswahl auf die Zielgröße

**Fünf unabhängige Prüfer, angesetzt je auf eine Anomalie — und einer hat den Nullpunkt-Fehler
im QS-Werkzeug selbst gefunden. Von der QS nachgemessen und bestätigt.**

**Der Fehler:** Eine Phantom-Kerze wird ausgeschlossen (Klasse R), wenn **ihr Schluss**
außerhalb der Sitzungsspanne liegt. **Genau dieser Schluss ist die Größe, deren Nähe zum
Tagesschluss gemessen wird.** *Ausgeschlossen werden also bevorzugt die Kerzen, die weit
danebenliegen.*

    Gruppe                                  n      Phantom naeher   exakt Phantom
    wie Lauf 1 (Klasse R ausgeschlossen)  4.113        67,5 %          42,8 %
    nur die ausgeschlossenen (Klasse R)   5.613        50,5 %          31,1 %
    ALLE zusammen, ohne Ausschluss        9.726        57,7 %          36,1 %

> **Derselbe Mechanismus wie der Nullpunkt der Messmaschine: Auswahl und Messgröße schöpfen aus
> derselben Zahl.** *Die QS dazu: „Ich habe die Bauform heute Nacht **dreimal bei anderen
> benannt** und in meinem eigenen Werkzeug nicht gesehen."*
>
> *(Die falschen Zahlen haben es **nie auf diese Tafel** geschafft — der PM hatte Lauf 1 nur
> mit dem Urteil und den Kontrollabständen aufgenommen, nicht mit dieser Kennzahl.)*

**✅ WAS DIE KORREKTUR ÜBERLEBT — und das ist der Teil für Wilhelm:**

    exakte Treffer des amtlichen Tagesschlusses   Phantom   regulaer   Faktor
      Definition A, gepoolt                        36,1 %     3,1 %      12
      Definition B                                 18,4 %     2,3 %       8

**Unter BEIDEN Populationsdefinitionen trifft die Phantom-Kerze den amtlichen Tagesschluss
acht- bis zwölfmal häufiger exakt als die letzte Umsatzkerze.** *Das hängt nicht an der
Definition und ist der belastbare Teil.*

**❌ NICHT BELASTBAR und ausdrücklich NICHT weiterzugeben:** *„Die Phantom-Kerze liegt näher am
Tagesschluss."* **57,7 % gegen 41,7 %, je nach Definition** — die Aussage kehrt sich um.

**Und die QS lehnt eine angebotene Verschärfung ab, obwohl der Prüfer sie mit Nachdruck
vertrat:** Er meldete, die Aussage kehre sich um. *Sie tut es — aber nur unter Definition B,
und **B hat genau den Fehler, den die QS gerade an sich korrigiert hat**, nur in die andere
Richtung: **B wählt die Population über Hoch und Tief des Tagesbalkens aus — also über
denselben Balken, der auch den Tagesschluss liefert.*** A wählt über die 60m-Umsatzspanne,
**unabhängig von der Zielgröße**. *Saubere Schätzung ist A ohne Ausschluss: 57,7 %.*

**🧩 NEBENBEFUND, der zwei Sitzungen betrifft:** `vorherSchief`, das **zweite** Kriterium von
Klasse R — auf das QS und `-06` ihre Definitionen heute Nacht **sorgfältig angeglichen
haben** — **feuert NULL Mal in 14.815.281 Kerzen.** *„Wir haben einen Zweig abgeglichen, der
nie ausgeführt wird. Klasse R ist faktisch ein Kriterium, nicht zwei."* **Der Abgleich
verliert dadurch nicht seinen Wert** — er hätte eine echte Differenz gefunden, wenn es eine
gegeben hätte. *Aber die Sorgfalt galt einer Stelle ohne Wirkung.*

### ✅ 27.08. ~04:30 — beide offenen Punkte nachgemessen: beide Behauptungen stimmen

**1. Die 435 „vor"-Fälle sind KEINE Phantome — es ist die Eröffnungsstunde.**
Uhrzeiten: 14:30 (321), 13:30 (108), 15:30 (6) — **die Sitzungs-Eröffnungsstunde in Winter-
bzw. Sommerzeit.** **394 von 435 (90,6 %) ihrer Dochte liegen vollständig innerhalb dessen,
was der Tagesbalken ausweist** — *echter Sitzungshandel, dem nur das Umsatzfeld fehlt.*

    AAXJ 2023-11-24 14:30   h 65,69  t 65,20  c 65,64  v 0
         Sitzungsspanne aus Umsatzkerzen  65,60 - 65,70
         Tagesspanne laut archiv1d        65,20 - 65,74     <-- das Tief IST das Tagestief

*Die Trennung in Block (5) hatte sie bereits isoliert — **die Trennung war richtig, die
Einordnung als Phantom nicht.***

**2. ⚠ DER „DICHTESTE KERN" MISST ETF-GLEICHLAUF — und entwertet damit eine eigene Kennzahl.**

    Tag           Kern    ETF im Kern   Grundrate   Faktor
    2023-11-24    7,4 %      48,8 %       17,8 %     2,7
    2024-11-29   10,3 %      69,2 %       27,5 %     2,5
    2025-11-28    8,6 %      39,6 %       16,6 %     2,4
    2025-07-03    9,4 %      46,0 %       22,2 %     2,1
    2025-12-24   17,8 %      52,6 %       26,6 %     2,0
    2024-07-03    6,8 %      18,9 %       19,7 %     1,0
    2024-12-24   10,2 %      14,0 %       19,0 %     0,7

**Auf fünf von sieben Halbtagen sind ETFs im Kern doppelt bis 2,7-fach überrepräsentiert.**
*Der 24.12.2025 ist darin **nicht besonders** — er hat nur den größten Kern.*

> **→ Die Kennzahl misst zu erheblichem Teil den Gleichlauf von Indexfonds, die dieselben Körbe
> abbilden. Sie taugt NICHT als Anzeiger für einen Quellfehler — auch nicht an den anderen
> Tagen.** *Das Problem, das sie lösen sollte (der Kernanteil erfasst keine Häufung abseits des
> Medians), war richtig erkannt. **Die Ersatzzahl misst etwas anderes als gedacht.***
>
> **Und das betrifft die Probe, die `c4` gestellt hatte:** Der 24.12.-Kern war als **Fund**
> gemeldet und das Urteil nicht gedreht — *die Disziplin hat gehalten, aber **die gemeldete
> Zahl war kein Fund**.* Der Nachtrag steht weiter; nur sein Anwendungsfall war leer.

### 🎯 Und eine Richtigstellung an den PM: warum die Verschärfung wirklich abgelehnt wurde

**Der PM hatte gelobt, die QS habe der Autorität eines Prüfers standgehalten, der gerade einen
echten Fehler gefunden hatte. Die QS rückt es gerade — und die ehrlichere Fassung ist die
nützlichere:**

> *„Ich habe die Umkehrung **nicht aus Prinzip** abgelehnt, sondern weil die Nachrechnung eine
> Minute gedauert hat und das Ergebnis eindeutig war. **Hätte ich sie nicht nachgerechnet,
> hätte ich sie übernommen** — der Prüfer hatte gerade einen echten Fehler in meiner Arbeit
> gefunden, und das verleiht Gewicht.*
> *Was mich zum Nachrechnen gebracht hat, war **nicht Skepsis, sondern dass die Zahl 41,7 %
> nicht zu meiner eigenen 57,7 % passte und ich den Unterschied nicht erklären konnte.**"*

**→ Das ist reproduzierbar und deshalb wertvoller als Haltung: Eine unerklärte Differenz
zwischen zwei eigenen Zahlen ist ein Anlass zum Nachrechnen.** *Haltung hat man oder nicht; ein
unerklärter Unterschied fällt auf.*

### 🔍 27.08. ~04:05 — DIE GEGENLESE: alle vier tragfähig, mit vier präzisierenden Auflagen

*Unabhängig gegengelesen von `markt-dashboard-c4` — vor den Zahlen am Kriterium begonnen.*

- **Lauf 1: tragfähig.** Die Pool-Antwort räumt die Kontrollgrößen-Sorge aus, und **die
  Nachtrags-Disziplin hat im Ernstfall gehalten** (Abweichung gemeldet, Urteil steht).
  **Auflage: die Reichweiten-Formel wörtlich übernehmen** — *„individuell = kein
  Strukturüberschuss, **nicht** Beleg für Handel"*.
- **Lauf 2: Schwellen-Änderung zulässig**, weil die Leiter **die Originalschwelle als oberste
  Sprosse bewahrt**. *Auflagen: Kategorie je Sprosse ausweisen; Schluss nur bei
  Sprossen-Stabilität `1e-6…1e-4`, sonst **GEMISCHT → Wilhelm**.*
  **Und eine Präzisierung, die zählt: „Rechenweg-Rauschen" statt „Speicherung"** — *7e-6 liegt
  etwa **60-fach über** dem float32-Epsilon, es ist also kein Speicherartefakt.*
- **Lauf 3: tragfähig als deklarierte Beschreibung.** **⚠ Tafel-Wache: NIE als „die
  1d-Schlüsse sind RICHTIG" zitieren — nur als „konsistent zwischen zwei Abrufen".**
- **Lauf 6: Fund gültig, aber der Logik-Satz ist zu korrigieren.** *Nach dem **Buchstaben** der
  Registrierung war (b) auf AVB/EQR gefasst — dann wäre die Deutung „belegt". **Falsifiziert
  hat sie eine NICHT registrierte Beobachtung** (BTSGU +1).*
  **Richtige Fassung: „Beide Bedingungen traten ein — eine außerregistrierte Beobachtung
  widerlegt die Deutung trotzdem. Die Registrierung war zu eng."**
  *Das ist stärker als „(b) NEIN" und die ehrlichere Form.*

### 📊 27.08. ~04:00 — ALLE VIER LÄUFE DURCH *(Vermerk `qs-audit-2026-08-27-0400-VIER-LAEUFE.md`)*

*Alle Zahlen gelten für den **neuen** Archivstand — 60m neu geschrieben 01:58:46, 1d 03:34:25.*

**LAUF 2 — OPTION (c) IST ENDGÜLTIG ERLEDIGT, auch für die Teilmenge.**
Die erste Auswertung war unbrauchbar: Gleichheit auf `1e-9` **absolut** zwischen zwei
**float32**-Archiven → 40,6 % „keins der drei", Unterschiede in der dritten Nachkommastelle,
Median 0,0007 %. **Speicherrauschen, kein Dissens.**
**Statt eine neue Schwelle NACH dem Ergebnis zu wählen, läuft die Einordnung über eine Leiter:**

    Toleranz        NORMALTAGE                      HALBTAGE
                 A      B      C    keins        A      B      C    keins
    exakt      42,6 % 16,8 %  0,0 % 40,6 %     38,1 %  0,2 %  8,9 % 52,8 %
    1e-5       48,3 % 18,4 %  0,0 % 33,4 %     42,9 %  0,2 %  9,9 % 47,0 %
    1e-3       76,9 % 18,6 %  0,0 %  4,5 %     74,8 %  0,1 % 12,1 % 13,0 %

**Über die ganze Leiter stabil: A dominiert, C liegt an Normaltagen bei 0,0 %. Der Tagesbalken
führt den Nachhandel NICHT mit.** *Das Urteil hängt nicht an der Schwelle, nur seine Schärfe.*
**→ „Außerhalb der Tagesspanne" ist im Kern ein Test auf „außerhalb der Sitzung".**
*Offen: an Halbtagen liegt C bei 9–12 %; Vermutung (ungemessen) ist die fehlende letzte
Sitzungshalbstunde, deren echte Extreme in A fehlen.*

**LAUF 1 — Urteil INDIVIDUELL, 7 von 7 Tagen. Aber schwächer, als das Wort klingt:**
**Kein Tag erreicht den geforderten Abstand von 20 Anteils-Punkten zur Kontrolle** — die
Abstände liegen zwischen **−0,7 und +5,6**. *Das Urteil sagt korrekt „kein Strukturüberschuss":
die Phantom-Dochte sind **nicht stärker gehäuft** als gewöhnliche Kerzen.* **Es ist ein
Nullbefund gegen Strukturgleichheit — kein positiver Beleg für Handel.**
*Populationstrennung: 9.447 nach, 435 vor, 0 auf — **95,6 % nach der letzten Umsatzkerze.***
*Kontrollgröße (c4s Sorge): je Halbtag 8.504–9.335 Umsatzkerzen gegen 1.176–1.586
Phantom-Kerzen — **die Kontrolle ist sechsmal so groß wie die Messgruppe.***
**Und die Probe aufs Exempel: Der dichte Kern am 24.12.2025 (17,8 % gegen 8,8 % Kontrolle)
wird als Fund gemeldet — und das Urteil NICHT gedreht.** *Genau wie im Nachtrag angekündigt
und von `c4` zur Prüfung gestellt.*

**LAUF 3 — und hier steckt ein NEUER Datenfund:** 2.101.732 Paare, 23,43 % exakt, p50
0,0269 %. **Die Riesenabweichungen sind aufgeklärt: VIER Reihen von 2.878 haben eine
inkonsistente Kursanpassung ZWISCHEN den beiden Archiven.**

    BYND  715 von 732 Paaren ueber 100 %   Faktor exakt 30,0000  (Reverse Split)
    RGR   522 von 732                      Faktor  2,6738
    SITC  255 von 732                      Faktor  3,3611
    B     232 von 659                      Faktor  2,3348

*Das erklärt auch die „max 2891 %" aus Lauf 1. **Auf Median und Perzentile wirken sie nicht**
(0,08 % der Paare), **auf jeden Maximalwert schon.*** **→ 60m und 1d sind für diese vier
Reihen nicht vergleichbar.**

**LAUF 6 — die Falsifikationsbedingung ist ZUR HÄLFTE GESCHEITERT, an der eigenen Aussage:**

    (a) 21 von 21 Phantomtage unveraendert, 0 verschwunden  -> eingetreten
    (b) BTSGU hat einen Phantomtag DAZUbekommen            -> NICHT eingetreten

**„Der Zähler friert ein" ist damit falsifiziert.** Von den vier heute Nacht überhaupt
abgerufenen Reihen hat **eine** einen weiteren bekommen — BTSGU, letzter Handel zwei Tage her,
also **noch im Antwortfenster der Quelle**. *AVB und EQR wurden gar nicht mehr abgerufen — für
sie ist (b) **trivial erfüllt und ohne Aussagekraft**.*
**Die frühere Fassung „gedeckelter Schwanz von 1–5 Tagen" hält. Die Zuspitzung hielt nicht.**

### 🐛 Vier eigene Messfehler in diesem Durchgang — alle behoben und dokumentiert

1. **Vorher-Stand aus gerundeter Bildschirmausgabe** (`toFixed(2)`) gegen Rohwerte auf `1e-6`
   verglichen. *Ein vorregistrierter Vergleich mit gerundetem Bezugswert **kann nur
   scheitern**.* Kostete einen Fehlalarm über 7 geänderte Kerzen.
2. **Gleichheit auf `1e-9` zwischen zwei float32-Archiven** — die 40,6 % „keins".
3. `Math.max.apply` mit 2.101.732 Werten **sprengt den Aufrufstapel**; Lauf 3 stürzte ab,
   **nachdem** die übrigen Zahlen ausgegeben waren.
4. **⚠ Der Wächter prüft auf das Wort „ABBRUCH" — das stand schon in der Datei des Laufs von
   02:00.** *Ein zwei Stunden altes Ergebnis gelesen und beinahe damit weitergegangen.*

> **Nummer 4 ist die lehrreichste: eine Wartebedingung, die auf einem Zustand von vorher schon
> wahr ist, wartet nicht.** *Dieselbe Bauform wie die PM-Suche nach `lock` statt `_laeuft.json`
> — **eine Prüfung, die grün wird, weil sie das Falsche prüft.***

### 🔢 27.08. ~03:50 — F1-ZÄHLUNG: die Ränder-Prämisse trägt nicht, und BRK.A fliegt per Bauart raus

*(Archiv-Wache, `f1-ergebnis.txt`, rein lesend, nichts verändert. Drei Überraschungen — zwei
davon widerlegen die Fragestellung des PM.)*

**1. Es sind 58 kaputte Reihen archivweit, nicht 36 — und die Abweichung ist selbst ein Fund.**
Entweder anderer Archivstand (diese Zählung lief **nach** dem Nachtlauf) oder andere
Grundmenge (die Mess-Sitzung zählte vermutlich auf ihrem Messfenster, hier archivweit über
2.965 Reihen). **Aufschlüsselung: 25 mit genau einem Sprung, 7 mit mehreren, 23 nur wegen
Kurs > 100.000 $.**

**2. Im frischen Zeitraum: nur EIN Fall — aber ein wilder.** **BYND** mit **sieben** Sprüngen
im Juli 2026 (+2920 %, −97 %, +2954 % im Wechsel) — *sieht nach inkonsistent bereinigtem
Reverse-Split aus.* **→ Damit ist die PM-Frage „produziert der Nachlader solche Ränder?"
beantwortet: kein Serienproblem des Laufs, ein einzelner Quell-Chaos-Fall.**

**3. ⚠ DIE RÄNDER-PRÄMISSE DES PM TRÄGT NICHT.** Ich hatte gefragt, wie viele durch
**Rand-Bereinigung** zu retten wären. **56 von 58 Reihen haben ihre Sprünge MITTEN in der
Reihe** — Rand-Bereinigung rettet **genau eine** (SEZL, Sprung in Kerze 1). Die Fälle sind
überwiegend **uralte Einzelsprünge**, unbereinigte Splits: NVR +2633 % (1993), SU +3520 %
(1993), WT +3650 % (2004), CHRD +25733 % (2020).

> **→ Was RETTEN würde, ist eine andere Reparaturform als die gefragte: ein Schnitt am letzten
> Sprung**, die Reihe danach behalten — *bei CHRD wären das ~1.446 saubere Kerzen.* **Gehört
> als Option in Wilhelms Vorlage, nicht in das Urteil der Wache.**

**🔴 ZWEI EINZELFUNDE, und der erste ist ein Universums-Problem:**

- **(a) Die Klasse „Kurs > 100.000 $" enthält BRK.A.** **Berkshire Hathaway A notiert
  tatsächlich über 100.000 $.** *Der Filter wirft eine legitime, prominente Reihe **per
  Bauart** aus.* Die übrigen 22 sind gehebelte ETFs mit Rücksplit-Monsterkursen — dort
  vermutlich korrekt. **Eine Preisschwelle als Plausibilitätsfilter trifft genau die Werte, die
  echt teuer sind.**
- **(b) ELME −84 % (08.01.2026) und MLTX −90 % (29.09.2025)** liegen knapp **außerhalb** des
  Frisch-Fensters, das die Wache mit „seit Juni" operationalisiert hat. *Der PM hatte „frischer
  Zeitraum" gesagt, ohne ihn zu definieren — **bei einem weiteren Fenster sind es 3 frische
  Fälle statt 1.*** **Die Schwelle war also eine stille Setzung, und sie ändert das Ergebnis.**

### 🏁 27.08. ~03:15 — DER DOCHT-LAUF IST DURCH: der Effekt HEBT SICH AUF, bei allen dreien

**Das ist die Antwort auf die Frage, an der die halbe Nacht hing** — vorregistriert gestellt,
gepaart gemessen, Maßstab vor dem Lauf fixiert. *(`dd6827a`, `ERGEBNIS.md` + Rohdaten,
Übergabe `berechnungen-2026-08-27-0315.md`.)*

| Strategie | G-Anteil | max \|Δ\| | `delta80` | Abstand |
|---|---|---|---|---|
| `kapitulation` | 8–10 % | **0,043 Pp** | ≥ 1,17 | **Faktor ~27** |
| `rsi2seit-mcp` | 36,4 % | **0,006 Pp** | 0,08 | **Faktor ~13** |
| `t1-zwangsglattstellung` | 100 % | **0,034 Pp** | 0,21 | **Faktor ~6** |

**Placebos beider Arme unauffällig. Identischer frischer Archivstand für A und B** (Vermerk
steht im Befund). **Entfernt wurden 76.339 von 14,66 Mio Kerzen — 0,52 %.**

**→ Nach der ursprünglichen Auftragslogik („hebt er sich auf → Reparatur unnötig") ist die
Phantom-Docht-Reparatur FÜR DIE MESSSEITE keine Dringlichkeit mehr.** *Datenfund 2 (der 25.08.
im 60m-Archiv) bleibt davon unberührt offen.*

> **🔒 UND DAS ERGEBNIS IST KONSERVATIVER, ALS ES AUSSAH — nachträglich verstärkt (04:35):**
> Der B-Arm hat **auch die 435 Eröffnungsstunden-Kerzen mitentfernt**, die sich später als
> **echter Sitzungshandel** herausstellten (nur das Umsatzfeld fehlte). **Dass „hebt sich auf"
> trotzdem mit Faktor 6–27 Abstand herauskam, obwohl Arm B echte Information verlor, macht das
> Ergebnis konservativer, nicht schwächer.**

> **🎯 UND DER MASSSTAB HAT SICH SOFORT VERDIENT GEMACHT:** `rsi2seit-mcp` Var 3/4 wechselten
> Etiketten an **+0,005-Pp-Margen**. Nach der **vorab** präzisierten Randrauschen-Regel zählt
> das nicht — **ohne sie hätte der Lauf auf Rauschbasis „hebt sich NICHT auf" gemeldet.**
> *Das Geflacker dieser Urteilsgrenze ist damit zum **dritten Mal unabhängig** belegt.*

> ### ⚠→✅ EINE SCHLAGZEILE, DIE SICH IN ZWEI STUFEN AUFGELÖST HAT — und am Ende ins Gegenteil
> **Hier stand: „die letzte Kerze jedes Handelstages ist eine instabile Momentaufnahme, und
> die Messmaschine liest sie." Das war falsch, und der PM hatte es an die Spitze gesetzt.**
>
> **Stufe 2 der Auflösung: der Vergleich selbst war ungültig, und die Kerze ist das GEGENTEIL
> eines Problems.** Die Quelle liefert bei `includePrePost` die erweiterten Handelszeiten **auf
> der vollen Stunde**, die Sitzung dagegen auf `:30`. **Die 20:00 der Quelle ist die erste
> Nachhandelsstunde — die 20:00 im Archiv ist der amtliche Tagesschluss.**
>
>     Quelle 20:00   c 213,5900   <- erste Nachhandelsstunde
>     Archiv 20:00   c 213,0500   <- amtlicher Tagesschluss
>
> *Zwei verschiedene Dinge auf demselben Zeitstempel; der Abgleich hat sie gegeneinander
> gehalten. Die „40 von 40 abweichend, Median 0,0978 %" messen **keinen Fehler**, sondern den
> Abstand zwischen Schlusskurs und Nachhandel.*
>
> **Gegen den Tagesschluss direkt aus der Quelle gemessen** (`interval=1d`, unabhängig von
> **beiden** Archiven, 30 Reihen):
>
> | | Abweichung zum amtlichen Tagesschluss | exakt gleich |
> |---|---|---|
> | **20:00-Kerze** | p50 **0,0000 %**, max 0,0169 % | **29 von 30** |
> | 19:30-Kerze | p50 0,0275 %, max 0,4216 % | 10 von 30 |
> | näher am Tagesschluss | **20:00 in 20 Fällen, 19:30 in 0** | |
>
> **Die 20:00-Kerze ist der amtliche Schlusskurs — und der genaueste Wert, den das Archiv
> hat.** Genauer als die 19:30-Kerze, die den letzten Handel **vor** der Schlussauktion trägt,
> nicht die Auktion selbst.
>
> **Die Gegenprobe auf drei Tage unterschiedlichen Charakters — die der PM verlangt hatte —
> ergab null Abweichungen.** Und der Grund ist nicht, dass die Kerze dort stimmt, **sondern
> dass es sie dort gar nicht gibt.** *(Vom PM unabhängig nachgezählt: 400 Reihen,
> 2.031.300 Kerzen.)*
>
> | Kerze | an wie vielen Tagen vorhanden |
> |---|---|
> | **20:00** (die instabile) | **genau 2** — 25.08. und 26.08.2026, die zwei jüngsten |
> | 19:30 (normaler Tagesschluss) | **725** |
> | 18:00 (Halbtagsschluss Winter) | **5** — genau die fünf Winter-Halbtage |
>
> **Für historische Tage existiert die instabile Kerze nicht.** Die letzte Kerze ist 19:30 —
> und die ist an allen geprüften Tagen **exakt stabil**. Nur die beiden jüngsten Tage tragen
> die zusätzliche Quote-Kerze, und sie verschwindet, sobald der Tag durchkonsolidiert ist.
>
> **→ Rückwirkend auf die zwölf Protokolle kann NICHTS durchschlagen.** Weder ist die Kerze
> instabil, noch existiert sie in der Historie.
>
> ### 🔑 DIE ERKLÄRUNG, DIE DEN GANZEN ABEND GEFEHLT HAT — und eine ungeschriebene Abhängigkeit
> **Richtigstellung einer PM-Formulierung:** Auf der Tafel stand, die Vermutung von
> `markt-dashboard-1d` (die 20:00-Kerze sei ein Quote-Anhängsel des Abrufs) sei widerlegt.
> **Sie war nur zur Hälfte falsch — und die richtige Hälfte ist die Begründung, die fehlte.**
> Nachgemessen, ohne `includePrePost`, bei zu Markt:
>
>     NVDA   meta.regularMarketTime  = 2026-08-26T20:00:00Z
>            meta.regularMarketPrice = 209,66
>            letzte Kerze  2026-08-26T20:00:00Z   c=209,6600037   v=0
>
> **Die 20:00-Kerze IST das Quote-Anhängsel** — gestempelt mit `regularMarketTime`, auf die
> Minute gerundet, Preis gleich `regularMarketPrice`. **Damit ist endlich erklärt, warum
> ausgerechnet eine flache Nullumsatz-Kerze den amtlichen Schluss trägt:** *Nach Handelsschluss
> friert der reguläre Quote auf dem Schlusskurs ein — deshalb stimmt sie.*
>
> **⚠ UND DARAUS FOLGT EINE ABHÄNGIGKEIT, DIE BISHER NIRGENDS STAND:** Die Richtigkeit dieser
> Kerze **ruht auf zwei Sicherungen**, die niemand miteinander verbunden hatte —
> **(a) die Sekundenregel aus #85** (ein Quote *während* der Sitzung trägt `16:57:27` und fällt
> heraus) und **(b) der Zeitplan** (frühestens 30 Minuten nach Schluss).
> **Fällt eine von beiden weg, schreibt der Sammler einen Zwischenstands-Quote als Tagesschluss
> ins Archiv** — und zwar einen, der aussieht wie der genaueste Wert im Bestand.
>
> ### 🔬 27.08. ~03:10 — LAUF 6: der laufende Nachlader IST das Experiment
>
> **Kunstgriff der QS:** Die Falsifikationsbedingung zu den Phantomtagen braucht keinen eigenen
> Lauf — **der Nachlader fasst gerade alle 2.965 Tagesdateien an, darunter die neun mit
> Phantomtagen.** Er entscheidet die Frage von selbst.
>
> **Die Erwartung ist vorregistriert und der Vorher-Stand fest im Werkzeug eingetragen**, damit
> der Vergleich nicht an einer nachträglich erhobenen Zahl hängt:
>
>     (a) die 21 Phantomtage stehen unveraendert da, obwohl der Nachlader
>         die Dateien angefasst hat
>     (b) AVB und EQR bekommen KEINE neuen dazu
>
> **Nur wenn beides eintritt, ist die Deutung belegt.** *Tritt (a) nicht ein, war „149 ist kein
> Bestand, sondern eine Rate" **falsch** — und dieser Satz steht in Wilhelms Vorlage. Tritt nur
> (b) nicht ein, war die Einschränkung an die Mess-Sitzung falsch und der Zähler friert nicht
> ein.* **Das Werkzeug schreibt beide Fälle als Urteil aus, nicht nur den erwarteten.**
>
> ### ✂ Ein Fehler, den der PM in derselben Form heute Nacht ZWEIMAL selbst gemacht hat
>
> Beim Einhängen fand die QS einen Fehler im Treiber: **Eine frühere Ersetzung war am Anker
> gescheitert und hatte nichts geschrieben.** Sie hielt sie für erfolgreich, *weil sie die
> Ausgabe mit `head -20` abgeschnitten hatte und die ersten drei Läufe wie erwartet aussahen.*
>
> **Praktisch hätte der Treiber nach dem Sperrfall wieder alle sechs Läufe gestartet — darunter
> die fertigen 4 und 5 — und deren Ergebnisdateien überschrieben.** Behoben und geprüft.
>
> > **Ihre Regel daraus:** *„Bei einer Prüfung, ob eine Änderung gegriffen hat, nie die Ausgabe
> > kürzen, sondern gezielt auf das Merkmal prüfen."* — Zweiter Fall bei ihr heute Nacht (vorher
> > `tail -50` bei der Barrierefreiheits-Zählung).
> >
> > **Und dieselbe Familie hat den PM heute Nacht zweimal erwischt:** die `tasklist`-Prüfung,
> > die „Nachlader beendet" meldete, während er lief — und die Sperrdatei-Suche nach `lock` und
> > `sperre`, während die Datei `_laeuft.json` heißt. **Beide Male sagte der Nulltreffer nichts
> > über die Sache aus, sondern nur über den Filter.**
>
> ### 🏁 27.08. ~03:05 — DER STREIT DIESER NACHT IST ENTSCHIEDEN: die Halbtage sind nicht verdorben
>
> **Nach drei Versuchen, die Fehlerklasse über ein unabhängiges Kriterium zu isolieren — alle
> drei negativ, und der dritte Nullbefund IST die Antwort:**
>
> | Versuch | Halbtag | Normaltag | Urteil |
> |---|---|---|---|
> | **1. Umschließung** des amtlichen Schlusses | 100 % | 100 % | **tautologisch** — Nachhandel beginnt beim Schlusskurs |
> | **2. Isolierter Ausschlag** (erreicht eine andere Stunde den Extremwert?) | 62,5 % | **50,0 %** | **am Normaltag SCHLECHTER** — nicht halbtagsspezifisch |
> | **3. Identische Extreme** in Folgestunden | 6,9 % | 1,6 % | viermal häufiger, aber **6 gegen 1 Fall** — zu klein |
>
> > **DIE KONTROLLE HAT DEN TEST GEKILLT, und das ist ihr Zweck.** *„Ohne den Normaltag im
> > selben Lauf hätte ich die isolierten Ausschläge als Halbtags-Fehler gemeldet — sie sehen
> > genau so aus."* Beispiele am **Normaltag**: RIVN −4,07 %, PLTR +5,42 %, NKE +5,25 % —
> > **dieselbe Gestalt wie MARA −6,01 % am Halbtag.**
>
> ### ⭐ DIE AUFLÖSUNG, in einem Satz
>
> > **Die Halbtage sind nicht verdorben. Sie sind die einzigen Tage, an denen
> > Nachhandelsdaten überhaupt ins Archiv gelangt sind. Die Eigenschaften dieser Daten, tiefe
> > isolierte Dochte eingeschlossen, hat Nachhandel überall.**
>
> **❌ Der Halbsatz „weil der Sitzungsfilter dort eine Stunde zu weit greift" ist ZURÜCKGEZOGEN
> (03:10) — er war eine Folgerung, als Befund formuliert, und ist von beiden Seiten
> widerlegt.** *Der PM hatte ihn übernommen und weitergemeldet; `-06` wollte ihn mit Codestelle
> in Wilhelms Vorlage nehmen und wurde gestoppt.*
>
> **Gemessen, vier Tagestypen, Quelle gegen Archiv:**
>
>     Normaltag Winter   Sitzung bis 21:00   Archiv endet 20:30   Nachhandel: alles verworfen
>     Normaltag Sommer   Sitzung bis 20:00   Archiv endet 19:30   Nachhandel: alles verworfen
>     Halbtag   Winter   Sitzung bis 18:00   Archiv endet 18:00   erste AH-Stunde BEHALTEN,
>                                                                 die drei folgenden verworfen
>     Halbtag   Sommer   Sitzung bis 17:00   Archiv endet 17:00   dasselbe Muster
>
> *Griffe der Filter **eine Stunde zu weit**, müssten **Normaltage genauso lecken** — sie tun es
> nicht. Griffe er an Halbtagen mit einem **festen Normaltags-Ende**, kämen dort auch 19:00 und
> 20:00 durch — tun sie nicht.* **Von beiden Seiten widerlegt.**
>
> **Was belegt ist und allein in die Vorlage gehört:** (1) Normaltage verwerfen den **gesamten**
> Nachhandel — korrekt. (2) Halbtage behalten **genau eine** Nachhandelsstunde, die erste.
> (3) Die leere Sitzungs-Restkerze wird verworfen, *vermutlich* weil ihr Kurs null ist.
> (4) Das Leck ist **genau eine Kerze je Reihe und Halbtag** — passt zu den 271 von 271.
>
> **Welche Regel dieses Muster erzeugt, ist vom Archiv aus NICHT bestimmbar.** *„Jede Regel, die
> mir eingefallen ist, sagt an mindestens einem der vier Tagestypen etwas Falsches voraus. Die
> Antwort steht im Sammelcode."* **Auflage an `-06`: die vermutete Codestelle vorher gegen
> diese vier Zeilen halten — erklärt sie das Muster nicht, ist sie nicht die Stelle.**
>
> **→ Die Reparaturfrage ist damit endgültig KEINE Frage nach kaputten Werten mehr. Sie ist die
> Populationsfrage, und die gehört Wilhelm.** *(Die PM-Umformulierung „behalten wir
> Kursinformation aus einem anderen Handelsfenster" trägt jetzt — aber auf **diesem** Befund,
> nicht auf der zurückgezogenen Umschließung.)*
>
> **🔚 UND DAS ABSCHLIESSENDE URTEIL DER QS, das eine offene Aufgabe in ein Ergebnis
> verwandelt:**
> *„Ich habe kein Kriterium gefunden, das echten Nachhandel von einem Artefakt trennt, und ich
> glaube nach drei Versuchen nicht, dass es aus den Kerzen allein eines gibt. **Beide
> Erklärungen sagen dieselben Formen voraus.** Was trennen würde, wäre eine **zweite
> Datenquelle** für den Nachhandel — die haben wir nicht.*
> ***Das ist ein Ergebnis und keine offene Aufgabe. Wer es später aufgreifen will, braucht neue
> Daten, nicht neue Rechnungen."***
>
> **🧾 Nebenbefund, unabhängig davon und belastbar:** Die Quelle liefert gelegentlich **zwei
> aufeinanderfolgende Nachhandelsstunden mit identischem Hoch UND Tief.** NVDA am 28.11.: 19:00
> und 20:00 beide `h 182,57 / t 164,48` bei Schlusskursen um 176,6 — **ein Band von 11 % um
> einen Kurs, der sich kaum bewegt.** Ebenso MSFT, BAC, CSCO, INTC, NIO, am Normaltag F.
> **Das ist ein Lieferfehler, kein Handel**, und betrifft rund **2–7 %** der Stundenpaare im
> Nachhandel. *Ob es durchschlägt, hängt daran, ob Nachhandelsdaten überhaupt gelesen werden —
> im Archiv steht davon heute nur die erste Stunde der sieben Halbtage.*
>
> ### ❌ 27.08. ~03:00 — DIE „210 VON 210" SIND ZURÜCKGEZOGEN: das Kriterium war tautologisch
>
> **Hier stand: „der Tagesschluss liegt in 210 von 210 Fällen im Band der ersten
> Nachhandelskerze — sie trägt Kursinformation." Der PM hatte es als stärksten Einzelbefund
> der Nacht bezeichnet. Die QS hat widersprochen, nachdem sie es selbst gemeldet hatte.**
>
> **Das Kriterium ist beinahe tautologisch:** *Der Nachhandel beginnt beim Schlusskurs.* Die
> Kerze startet also dort, und ihr Band enthält ihn **fast zwangsläufig.**
>
> **Der Beleg kam aus dem nächsten Lauf:**
>
>     P-WEG-Kerzen (die strittigen)   133   gebunden 133   100,0 %
>     uebrige Nachhandelskerzen       138   gebunden 138   100,0 %
>
> > **Ein Kriterium, das für ALLES gilt, unterscheidet NICHTS.** Es kann also gerade nicht
> > zeigen, dass die strittigen Kerzen Kursinformation tragen — **es zeigt nur, dass jede
> > Nachhandelskerze dort anfängt, wo die Sitzung aufgehört hat.** *Ein Zufallsmuster sagt
> > keine 100 % voraus — **ein Artefakt, das den Schlusskurs als Anker nimmt und einen Docht
> > anhängt, aber auch.** Beide Erklärungen sagen dasselbe voraus.*
>
> **⚠ FOLGE FÜR WILHELMS ERSTE ENTSCHEIDUNG:** Die PM-Umformulierung *„behalten wir
> Kursinformation aus einem anderen Handelsfenster" statt „behalten wir kaputte Werte"* ist
> **durch diesen Befund NICHT gedeckt.** Sie mag richtig sein, aber sie steht auf **anderen**
> Belegen — **der Lücken-Befund (40 von 40 leere Sitzungskerzen) trägt weiter; die 210 von 210
> tragen nicht.**
>
> ### ✅ Was derselbe Lauf BELASTBAR ergeben hat
>
> **Das Archiv hält an Halbtagen genau EINE Nachhandelskerze je Reihe:**
>
>     0 Kerzen:    9 Reihen-Tage
>     1 Kerze : 271 Reihen-Tage
>     mehr    : keine
>
> Der Quellstrom liefert **vier** (18:00–21:00 UTC), das Archiv behält die **erste**.
> **→ Der Auftrag an `-06`, die späten AH-Kerzen zu prüfen, ist gegenstandslos — es gibt sie
> nicht.**
>
> **Die „tiefe Docht-Klasse" ist viel seltener, als die Diskussion vermuten lässt:**
>
>     tiefe Dochte unter -3 %:  2 von 133 P-WEG-Kerzen  =  1,5 %
>       MARA 2025-11-28  -6,01 %      RIVN 2025-11-28  -4,03 %
>     Verteilung: p10 -0,907 %   p50 0,000 %   p90 +0,494 %   min -6,007 %
>
> **Die Hälfte der strittigen Kerzen hat praktisch keinen Ausschlag über den eigenen Schluss
> hinaus.** *Der ganze Streit dieser Nacht drehte sich um einen Schwanz von 1,5 %.*
>
> > **📢 ZWEITE META-REGEL DER QS, und sie ist schärfer als die erste:**
> > ***„Bei einem Ergebnis von 100 % zuerst fragen, ob das Kriterium auch anders ausgehen
> > KÖNNTE."*** — *Die Gegenrichtung war mitgemessen, aber die falsche: geprüft wurde, ob 19:30
> > näher liegt, statt ob die Kennzahl überhaupt **trennscharf** ist.*
> >
> > Und: ***„Eine falsch gewichtete Messung verbreitet sich schneller als eine markierte
> > Vermutung, weil niemand Anlass sieht nachzufragen."*** *Diesmal war es kein markierter
> > Verdacht, sondern ein als Befund gemeldetes Ergebnis — und der PM hat es sofort verstärkt.*
>
> **Und die QS kassiert dabei zwei eigene Sätze:**
> - *Vermutung 1 (ihre):* Die exakten Treffer entstehen, weil nicht gehandelt wurde und die
>   Quelle den Schluss fortschreibt → dann müssten die Kerzen **flach** sein.
>   **0 von 45 sind flach.** Alle tragen eine Spanne, im Median 0,461 %. **Widerlegt.**
> - *Vermutung 2 (die naheliegende Rettung):* Die Kerze beginnt mit der Schlussauktion, dann
>   wäre ihre **Eröffnung** der Schlusskurs. **6 von 210 (2,9 %). Auch widerlegt.**
>
> **→ Warum es 21,4 % sind, ist unbekannt — und bleibt es.** *„Ich lasse den Stand so stehen,
> statt eine dritte Erklärung zu bauen, die ich dann wieder prüfen müsste."*
>
> > **📢 UND DER META-SATZ, der zu den Hausregeln gehört:**
> > ***„Eine Vermutung, die als ungemessen markiert weitergegeben wird, wird trotzdem
> > weitergegeben."*** *Die QS hatte ihre Vermutung ordnungsgemäß gekennzeichnet — `-06` hat sie
> > als „plausibel und sauber als ungemessen markiert" übernommen. **Die Kennzeichnung hat die
> > Verbreitung nicht aufgehalten.***
>
> ### 🎯 27.08. ~02:45 — ZWEI UNABHÄNGIGE MESSUNGEN TREFFEN SICH AUF 0,3 PROZENTPUNKTE
>
> **`1d` hatte gefunden: 21,7 % der P-WEG-Kerzen tragen exakt den amtlichen Tagesschluss**
> (1.113 von 5.133, Stichprobe gegen das Tagesarchiv). **Die QS hat es nachgerechnet statt es
> stehenzulassen** — 30 Reihen über **alle sieben** Halbtage, erste Nachhandelskerze gegen den
> amtlichen Tagesschluss aus der Quelle:
>
>     2023-11-24  23,3 %   2024-07-03  20,0 %   2024-11-29  20,0 %
>     2024-12-24  23,3 %   2025-07-03  20,0 %   2025-11-28  20,0 %
>     2025-12-24  23,3 %
>     ZUSAMMEN    45 von 210 exakt gleich  =  21,4 %
>
> **21,4 % gegen 21,7 % — anderes Verfahren, andere Stichprobe, andere Fragestellung.** Und die
> Streuung über die sieben Tage ist auffallend eng: **20,0 bis 23,3 %.**
>
> **⚠ UND DIE QS SCHRÄNKT DIE DARAUS ABGELEITETE REGEL SOFORT EIN**, weil `-06`s Satz („die
> Quelle führt den amtlichen Schluss als ersten Nachhandelskurs") sich wie eine allgemeine
> Regel liest: **Er gilt in 21,4 % der Fälle. In den übrigen 78,6 % trägt die erste
> Nachhandelskerze einen anderen Kurs, im Median 0,073 % daneben.**
> ***Wer daraus schließt, man könne den Tagesschluss eines Halbtags dort ablesen, liegt in vier
> von fünf Fällen falsch.***
>
> *Vermutung zur Ursache, ausdrücklich ungemessen: In etwa einem Fünftel der Fälle findet in
> der ersten Nachhandelsstunde **kein Handel** statt, und die Quelle schreibt den Schlusskurs
> fort. Das würde die enge Streuung erklären.*
>
> **✅ GESCHLOSSEN 02:50 — OHNE LAUF, MIT EINER SCHRANKE AUF VERÖFFENTLICHTEN ZAHLEN.**
> Die Frage lautete: Dass die Halbtage in `tageshilfen.js` **nie feuern**, kostet an sieben
> Tagen je Jahr ein T-Signal — verändert das die Ergebnisse messbar?
>
> **Die Rechnung (`c4`), und sie braucht keine neue Messung:** Halbtage sind **7 von ~252
> Handelstagen ≈ 2,8 %** — real weniger, es sind umsatzarme Feiertagsränder. **Damit diese
> Lücke einen Messwert um `delta80` verschieben könnte, müsste der wahre Halbtags-Effekt
> `|B_halbtag − B_rest| ≈ delta80 / 0,028` betragen.** Bei den `delta80`-Werten der
> T-Protokolle (Größenordnung ≥ 1 Pp je Signaltag) wären das **≥ 35 Pp je Tag — das
> Hundertfache jeder hier je gemessenen Kante.**
>
> **→ Antwort: NEIN.** *Sieben stumme Tage können die T-Ergebnisse nicht messbar bewegen; die
> Bauart kostet Abdeckung im Promillebereich und kauft dafür **Vorgriffsfreiheit**.*
> **Als „geprüft und zu klein" auf der Tafel, nicht als „nicht nachgesehen".**
>
> *Einzige ehrliche Einschränkung, selbst benannt: Der **kontrafaktische** Halbtags-Effekt
> bleibt ungemessen — dafür müsste man die Schlussregel umbauen, also eine neue Anordnung
> fahren. **Die Schranke gilt für jede plausible Größe unterhalb des Absurden.***
>
> *(Die Anerkennung für die Import-statt-Nachbau-Lösung beim Zähler gehört `1d`, nicht `c4` —
> selbst richtiggestellt.)*
>
> ### 🧩 27.08. ~02:50 — AN HALBTAGEN FEHLT DIE LETZTE HALBE HANDELSSTUNDE — in der QUELLE
>
> **Das erklärt die Phantom-Dochte strukturell und entscheidet Wilhelms Frage 1 mit.**
> *(QS, `werkzeuge/halbtagsschluss.js`, eigener Quellabruf, nur lesend — ausgelöst durch die
> PM-Auflage „alle sieben, nicht einen, und die Bandbreite ausweisen".)*
>
>     NVDA 28.11.2025, includePrePost:
>     14:30   c 177,2900   v 30.011.592   Sitzung
>     15:30   c 177,0814   v 17.490.994   Sitzung
>     16:30   c 177,1342   v 14.456.367   Sitzung
>     17:30   c -          v null         <-- LETZTE 30 SITZUNGSMINUTEN, LEER
>     18:00   c 176,6200   v 0            erste Nachhandelsstunde
>
> **Die Kerze 17:30–18:00 enthält die letzten dreißig Handelsminuten einschließlich der
> Schlussauktion. Sie kommt leer.** Systematisch: **40 von 40** — acht Reihen über fünf
> Halbtage, kein einziger Fall mit Kurs. *(An Sommer-Halbtagen dieselbe Lücke eine Stunde
> früher.)*
>
> **→ Das Archiv übernimmt die leere Kerze nicht und behält die erste Nachhandelsstunde. Die
> letzte Kerze eines Halbtags im 60m-Archiv ist damit NACHHANDEL, nicht Sitzung — und der
> amtliche Schlusskurs fehlt vollständig.**
>
> **⭐ UND DAMIT IST EIN DOCHT AUSSERHALB DER SITZUNGSSPANNE AN EINEM HALBTAG KEIN FEHLERBEWEIS
> MEHR. Er ist erwartbar.** *Das ist keine Deutung mehr, sondern an der Struktur des
> Quellabrufs ablesbar — und eine **unabhängige Bestätigung** dessen, was `-06` aus ganz
> anderen Abrufen geschlossen hatte: nicht „die Kerzen sehen aus wie Nachhandel", sondern **„die
> Sitzungskerze daneben ist leer, und die Uhrzeiten liegen nach dem Schluss".***
>
> **Alle sieben Halbtage, mit Kontrolle auf drei Normaltagen im selben Lauf** (je 25 Reihen,
> Zeuge `interval=1d` direkt aus der Quelle):
>
>     Halbtage    Median 0,073 %   ueber der Kostenhuerde: 75 von 175  (42,9 %)
>     Normaltage  Median 0,021 %   ueber der Kostenhuerde:  6 von  75  ( 8,0 %)
>     Tageswerte Halbtage: 0,052 bis 0,135 %
>
> **Der Unterschied liegt an den Halbtagen, nicht am Verfahren** — *„ohne die Kontrolle im
> selben Lauf wäre das nicht zu trennen gewesen."*
>
> **Selbstkorrektur der QS:** *„Ich hatte 0,107 % als **die** Halbtagszahl gemeldet. Das war der
> **zweitschlechteste** der sieben Tage."* Median über alle sieben: **0,073 %**. **Genau
> deshalb hatte der PM nach der Bandbreite gefragt.**
>
> **Was die QS ausdrücklich NICHT sagt:** nicht, dass die Dochte deshalb **echt** sind
> (*Nachhandel darf die Sitzungsspanne verlassen; ob eine bestimmte Spanne echt ist, sagt das
> nicht*); nicht, dass die Lücke **reparabel** ist (*sie sitzt in der Quelle — ein erneuter
> Abruf liefert dieselbe leere Kerze*); nicht, dass **Normaltage** frei davon sind (*geprüft
> sind drei*).
>
> ### 🔔 27.08. ~02:45 — ZÄHLER A STEHT, und er kann eine Null nicht mehr als Entwarnung melden
>
> **`aa11642`, `tools/randzaehler.js`.** Kontrolllauf bei zu Markt, 12 Reihen: **60.925 Kerzen
> auf beiden Seiten, Differenz 0, bestanden.** *Beide Kerzenzahlen werden ausgewiesen, nicht
> nur die Differenz — sonst ließe sich Randeffekt nicht von durchgehender Verschiebung
> trennen.*
>
> **Zwei Urteile stehen IM WERKZEUG, nicht im Kopf des Lesers:**
>
>     Markt zu    und Abweichung 0  ->  Kontrolle bestanden
>     Markt OFFEN und Abweichung 0  ->  Verdacht auf defekte Sonde
>
> > **Das zweite Urteil rettet den ursprünglich falsch gestellten PM-Auftrag:** *Eine Null ist
> > hier nur dann eine Entwarnung, wenn sie zur richtigen Zeit gemessen wurde.* **Aus meinem
> > Fehler ist eine Sperrklinke geworden.**
>
> **Ein Fehler in der Spezifikation, vor dem Bau gefangen:** `c4` hatte eine dritte Fassung der
> Regel geliefert — *„Sekunde ≠ 0 **oder Umsatz 0**"*. **Das hätte nach Schluss die amtliche
> Schlusskerze aus der Mess-Basis geworfen und den Kontrolllauf JEDE NACHT falschen Alarm
> schlagen lassen.** Sofort angenommen; **die Mess-Basis kommt jetzt per Import aus
> `fertigeKerze()`** — also per Konstruktion dieselbe Regel statt einer nachgebauten.
>
> **Zähler B wartet auf die offene Börse.** Zugang verifiziert: die zwölf **reinen**
> Strategie-Module der Messmaschine, zweimal aufgerufen — B rechnet damit gegen genau das, was
> die zwölf Protokolle messen. **Die Grenze steht ausdrücklich dabei:** B misst die reinen
> Detektoren, **nicht** die Live-Gates und Confirm-Gatter. *Das bräuchte ein Mandat auf den
> Handelspfad, das sich weder `1d` noch `c4` nehmen — richtig so.*
>
> **⚠ Zusätzliche Einschränkung, die eine unserer Gegenproben betrifft:** **Eine Tageskerze des
> LAUFENDEN Tages taugt nicht als Zeuge** — sie sieht aus wie eine fertige, trägt aber nur den
> Umsatz bis jetzt. *Alle heute Nacht benutzten Fälle waren abgeschlossen; die Gegenproben
> halten.*
>
> ### ✅ 27.08. ~02:40 — DREI OFFENE FRAGEN GESCHLOSSEN, alle drei mit guten Antworten
>
> **1. Bildet irgendetwas einen Tagesschluss aus 60m? JA — an genau EINER Stelle.**
> `studien/messmaschine/strategien/tageshilfen.js`, der Rechenkern der drei T-Strategien
> (`t1-zwangsglattstellung`, `t2-umsatzschock`, `t3-stundendrift`). **Sonst niemand:**
> `kapitulation` rechnet sein Regime auf Stunden-EMA200 („genau wie live"), und
> `momentum`/`monatsende`/`monatswende`/`quartalsschub` feuern zwar zu 100 % auf der letzten
> Tageskerze, benutzen aber deren **nativen** Kerzenschluss — *nichts wird gebildet.*
>
> **Und die eine Stelle ist gegen genau diese Frage gebaut, dokumentiert im Dateikopf:** Die
> Schlusskerze wird **ohne Blick nach vorn** über die Zeitumstellung bestimmt (Anfangsstunde
> 13 UTC → letzte Kerze 19er-Stunde; 14 UTC → 20er-Stunde). **Folge (a): die sieben verkürzten
> Tage feuern NIE** — wörtlich als *„die vorsichtige Richtung"* dokumentiert; die
> 18:00-Nachhandelskerze wird nie als Schluss verwendet, der Halbtag fällt aus der
> Tagesrenditen-Reihe und sein Beitrag steckt in einer Zwei-Sitzungs-Rendite von Vollschluss zu
> Vollschluss. **Folge (b): die Sommer-20:00-Quote-Kerze schließt die Regel automatisch aus.**
> **→ Theoretisch betroffen, praktisch halbtagsfest. Frage zu.**
>
> **2. Liest die Messmaschine wirklich nur Archivdateien? JA — die Annahme ist jetzt Befund.**
> `grep` über `studien/messmaschine/**` samt aller Strategien: **kein `http`, kein `fetch`, kein
> `Kurse.hole`, kein `kerzenquelle`-Require.** *Damit steht der Zähler, den `1d` baut, auf
> geprüftem Boden statt auf einer gelesenen Datei.*
>
> **3. Jetzt ausgesprochen statt stillschweigend:** Die gebildeten Tagesschlüsse sind
> durchgängig **„letzter Handel vor der Auktion"**, im Median **0,028 %** neben dem amtlichen
> Schluss — **einheitlich, unter der Hürde**, und ab jetzt festgehalten. *Geht in den
> Docht-Befund mit ein; die drei Stop-Strategien sind genau die Docht-Kandidaten.*
>
> **📊 Erstes Teilergebnis des Docht-Laufs:** `kapitulation` fertig, **beide Arme „nicht
> bestätigt"** — das Entfernen der Nullumsatz-Kerzen ändert dort das Urteil nicht.
> *Vollergebnis kommt gesammelt.*
>
> ### 📐 „DIE LETZTE KERZE EINES TAGES" IST DREIERLEI — und nur eine davon ist der Schlusskurs
>
> *(QS, Halbtag 2025-11-28, 25 Reihen, gegen den amtlichen Tagesschluss aus der Quelle.)*
>
> | Tagesart | letzte Kerze | was sie ist | Abstand zum Tagesschluss (p50) | exakt gleich |
> |---|---|---|---|---|
> | **jüngste zwei Tage** | 20:00 | eingefrorener Quote = **amtlicher Schluss** | **0,000 %** | 29 von 30 |
> | ältere Volltage | 19:30 | letzter Handel **vor** der Auktion | 0,028 % | 10 von 30 |
> | **Halbtage** | 18:00 | **erste Nachhandelsstunde** | **0,107 %** *(p90 0,491 %, max 1,143 %)* | 6 von 25 |
>
> **Die Halbtagszeile ist die einzige über der Kostenhürde — im Median beim Doppelten, im
> Maximum beim Elffachen.** Und **sie trifft genau die sieben Tage, um die sich diese ganze
> Nacht dreht:** dort sitzen auch die Phantom-Dochte. *Vermutlich derselbe Mechanismus von der
> anderen Seite — an Halbtagen liefert die Quelle Nachhandelsstunden im 60m-Strom.*
>
> **Warum die drei verschieden sind:** Für **alte** Tage schreibt der Nachlader aus dem
> 60m-Strom, und der enthält **kein** Quote-Anhängsel für einen neun Monate alten Tag. Für die
> **jüngsten** Tage schreibt der Sammler den eingefrorenen Quote.
>
> **Kein Selbstwiderspruch zu Lauf 1, von der QS selbst vorweg aufgelöst:** Lauf 1 nimmt den
> Tagesschluss aus **`archiv1d`**, nicht aus 60m — *und ist damit nicht betroffen.*
>
> **Gegenerklärung ausgeschlossen:** Hätten die beiden Endpunkte verschieden angepasste Kurse
> geliefert (Splits, Ausschüttungen über neun Monate), wären **alle 25 systematisch
> verschoben.** Sechs stimmen exakt — **kein systematischer Versatz.**
>
> **Offen:** Nur **ein** Halbtag ist gemessen. *„Dieselbe Bauform ist keine Messung."* Die
> restlichen sechs sind genehmigt und laufen. **→ Und eine bewusst klein gehaltene Prüffrage an
> `c4`: nimmt irgendetwas außer Lauf 1 den Tagesschluss aus dem 60m-Archiv?** *Kein Verdacht,
> ein Prüfpunkt — „kommt nicht vor" ist ein vollwertiges Ergebnis.*
>
> ### ✅ MESSSEITE: ERLEDIGT — nicht „zu klein", sondern „nicht vorhanden"
> **Alle Messungen** (die zwölf Protokolle, die Strang-A-Referenz, der laufende Docht-Lauf)
> **rechnen auf konsolidierter Historie, die einheitlich auf 19:30 endet — eine Definition,
> durchgängig.** *(Geprüft von `markt-dashboard-c4`.)*
>
> ### 🔻 LIVE-RAND: echt, und die ZWEITE Komponente ist die schwere
>
> **1. Wert-Definition:** Live rechnet der Rand auf dem **Auktionsschluss**, die Eichung stand
> auf dem **letzten Handel davor** — Median 0,0275 %, Maximum 0,42 %. Wirkt nur bei Signalen,
> die näher als diese Spanne an ihrer Schwelle stehen. *Dass es solche gibt, zeigt das bekannte
> 0,0001-Pp-Randrauschen; wie viele, ist ungemessen.*
>
> **2. ⚠ INDEX-VERSCHIEBUNG — der Mechanismus ist ein ANDERER als der PM beschrieben hat, und
> die Wirkung reicht weiter.** *(Vorabprüfung `markt-dashboard-1d`, vor dem Bau des Zählers.)*
>
> **Live und Messung teilen KEINE Datei.** `depot.js:2404 fetchIntradayYahoo()` holt **direkt
> bei Yahoo** über `Kurse.hole(sym, {range: …})` und **greift nie auf Archivdateien zu**; die
> Messmaschine liest die Archivdateien. **Zwei getrennte Bezüge auf dieselbe Quelle** — es gibt
> also keine gemeinsame Reihe, aus der eine Kerze „verschwinden" könnte.
>
> **Der Unterschied steht im Code:**
>
>     kurse.js          getUTCSeconds:  0 Vorkommen
>     kerzenquelle.js   getUTCSeconds:  2 Vorkommen
>
> `kerzenquelle.js` wirft die Quote-Kerze am Reihenende hinaus, `kurse.js` nicht.
> **→ Der Live-Pfad bekommt eine Kerze MEHR als die Messung — aber NUR während der Sitzung.**
> Nach Handelsschluss ist der Quote auf `20:00:00` gerundet, hat Sekunde 0 und **passiert beide
> Wege**; die Reihen sind dann identisch (nachgemessen, AAPL 60m und 5m: **Unterschied 0**).
>
> **Nicht „acht werden sieben über einen Tag hinweg", sondern: die Live-Reihe ist während der
> Sitzung um genau eine Kerze länger, am jungen Ende — und damit verschiebt sich jeder
> rückwärts gezählte Index DURCHGEHEND**, nicht nur über einen Tag. *Die Sorge war berechtigt,
> die Größenordnung eher größer, der Mechanismus ein anderer.*
>
> > **🎯 UND DIE VORABPRÜFUNG HAT EINEN ZÄHLER VERHINDERT, DER ZUVERLÄSSIG NULL GEMELDET
> > HÄTTE.** Der PM hatte „nach der Konsolidierung nachrechnen" beauftragt — **also genau die
> > Bedingung, in der der Effekt nicht auftreten kann.** Er hätte null gemeldet und **wie eine
> > Entwarnung ausgesehen.** *Dieselbe Fehlerform wie alles andere heute Nacht — diesmal im
> > Prüfwerkzeug, gefunden **bevor** es gebaut war.*
>
> **Der Zähler misst deshalb WÄHREND der Sitzung**, und eine Zahl gibt es erst, wenn die Börse
> wieder offen ist. *„Eine Zahl aus der Nacht wäre eine Zahl aus einer Bedingung, in der der
> Effekt nicht existiert, und die will ich niemandem geben."*
>
> **Offene Annahme, ausdrücklich als solche benannt und an `c4` zur Gegenprüfung gegeben:**
> dass die Messmaschine wirklich auf Archivdateien rechnet und nicht irgendwo selbst abruft —
> gelesen wurde nur `depot.js`. *Genau solche ungeprüften Annahmen waren heute Nacht mehrfach
> die Ursache.*
>
> **→ Das ist Fall FÜNF der Familie „Live driftet von der Messung weg"** — diesmal nicht in
> einem Parameter, sondern **in der Bedeutung eines Feldes**.
>
> **Zugeteilt an `markt-dashboard-1d`, Spezifikation von `c4`: eine stehende Invariante nach
> dem Muster „Live = Messung"** — Signale des Vortags **nach** der Konsolidierung nachrechnen
> und Abweichungen **zählen**, **die zwei Sorten getrennt** (Wert-Flips, Index-Verschiebungen).
> **Erst diese Zählung sagt, ob es materiell ist.** *Der Zähler ändert nichts am Verhalten und
> ist deshalb unstrittig — **fällt die Zählung materiell aus, gehört die Reparatur Wilhelm**,
> sie beträfe den Live-Signalpfad.*
>
> ### 🔹 Der Kern des Restbefunds in einem Satz
>
> **Die 20:00-Kerze existiert nur an den beiden neuesten Tagen; ältere Tage enden auf 19:30.
> Damit ist „die letzte Kerze eines Tages" je nach Alter etwas anderes** — an den zwei jüngsten
> Tagen der **Auktionsschluss**, in der Historie der **letzte Handel davor**. Der Unterschied
> liegt im Median bei **0,0275 %**, im Maximum bei **0,42 %**.
>
> **Für eine Messung, die über Historie läuft, ist das einheitlich und harmlos. Für eine
> Messung, die den aktuellen Rand mit der Historie vergleicht, ist es ein Bruch in der
> Definition** — und genau das tut ein Handelssystem, das heute ein Signal rechnet nach Regeln,
> die auf der Historie geeicht sind. *Zur Einordnung an die Mess-Sitzung gegeben; **nicht** vom
> PM als groß behauptet, nachdem er es heute Nacht zweimal zu groß gelesen hat.*

## 🔴 27.08.2026, 00:42 — App-Neustart: alle Sitzungen weg, der Nachlade-Lauf lebt

**Wilhelm hat die App um ~00:40 neu gestartet.** Damit sind **alle acht wachen Chat-Sitzungen
beendet** — nachgesehen, nicht vermutet: `ListAgents` zeigt 74 Einträge, davon **genau einer
erreichbar** (`Desingner`, über Remote Control). Alles andere steht auf `offline`.

**Der PM heißt ab jetzt `markt-dashboard-f5 [5204c6]`.** Die Adressen `markt-dashboard-91`
und `markt-dashboard-69` sind tot. Wer den PM sucht, nimmt die Adresse aus dem Kopf dieser
Datei — sie ist die einzige Quelle, die den Neustart überlebt.

### Was der Neustart NICHT getötet hat — und warum das ein Problem ist

**Das Archiv-Nachladen läuft weiter.** Gemessen, nicht angenommen: die Prozesse `5852`
(`archiv-nachladen.js`) und `7896` (`yahoo-60m-holen.js alle --aktualisieren`) laufen seit
`00:20:47`, und `archiv60m` hat in den zehn Minuten vor 00:39 noch **298 Dateien**
geschrieben. Die Sperre gilt also unverändert: **bis ~03:45 nicht auf 60m/1d messen.**

**Aber die Sitzung, die den Lauf begleitet hat, ist weg.** `markt-dashboard-b9` hatte
zugesagt, Ergebnis oder Alarm zu melden und danach eine Übergabe abzulegen. **Das wird jetzt
niemand tun** — der Prozess schreibt Dateien, aber kein Chat sieht mehr hin. Genau das Muster,
das dieses Projekt zwei Tage Kursdaten gekostet hat: *etwas läuft und sieht gesund aus, aber
niemand wertet es aus.* Wer nach 03:45 als Erster hier liest, prüft bitte
`node tools/archiv-wachhund.js` und den Datenordner auf `archiv-alarm-*.txt`.

### Die „Läuft gerade"-Liste unten ist Geschichte, nicht Gegenwart

Die Einträge zu `markt-dashboard-6c`, `Berechnungen` und `App-Codebase Master` beschreiben
Sitzungen, **die es nicht mehr gibt**. Ihre *Befunde* bleiben gültig und stehen weiter unten;
ihre *Dateisperren* sind mit dem Neustart erloschen. **`scoreboard.js` ist frei** (6c hatte es
ohnehin schon freigegeben), ebenso alles, was Master und Berechnungen belegt hatten.

---

## ✅ 27.08. 00:35 — QS beziffert den Hoch/Tief-Fund: er bewegt kein Urteil der zwölf

*Vom PM aus der Übergabe `qs-audit-2026-08-27-0240-EXPOSITION.md` übernommen; die Datei ist
danach in `uebergabe/verarbeitet/` gewandert. Rechenwege:
`qs-audit-2026-08-26/werkzeuge/exposition.js` und `…/konzentration.js`, beide nur lesend.*

Die QS hatte den Phantom-Docht-Fund als „praktisch folgenreichste Sache der Nacht" gemeldet
und das anschließend **selbst nachgemessen, statt es stehen zu lassen** — mit dem Ergebnis,
dass die eigene Einschätzung zu groß war:

| | |
|---|---|
| Phantom-Dochte im Messfenster | 34.369 |
| **davon in der Bestätigungshälfte** | **6.579** von **7.330.520** Kerzen |
| **Anteil** | **0,09 %** — schwere Fälle (≥ 1 %) **0,008 %** |
| Quote-Stempel im Messfenster | 75, alle in der Bestätigungshälfte (die vom 24.08.) |

**Aber: die Fehler sind konzentriert, nicht verdünnt.** An acht Tagen trägt mindestens jede
dritte handelnde Reihe einen Phantom-Docht, im Extrem **53,6 %** (24.12.2024). Betroffen sind
709 Tage, nennenswert aber nur diese acht — drei sind der Archivanfang, sieben sind
**US-Halbtage**.

**Was ausdrücklich NICHT folgt** (die QS sagt es selbst, und es ist der wichtigere Teil):

1. **Der Fund ist nicht erledigt.** Er ist für **die bestehenden zwölf** entschärft, nicht
   allgemein. Für alles, was künftig **Hoch/Tief** benutzt — Kanäle, ATR, Ausbrüche, ORB,
   Stopps — bleibt er voll gültig.
2. **Strategien mit wenigen, konzentrierten Signaltagen trifft es hart.** `monatsende-kauf`
   hat 17 Bestätigungstage; ein einziger kontaminierter wäre 6 % ihrer Datenbasis. **Wer
   künftig einen Kandidaten mit Monatswende- oder Feiertagsbezug vorregistriert, sieht sich
   vorher die sieben Halbtage an.**
3. **Die Aufhebungs-Frage ist weiter offen** — ob sich der Effekt zwischen Signal und
   Kontrolle herauskürzt, ist **nicht gemessen**; beide teilen sich `fuehreAus`. Diese
   Entwarnung ersetzt die Messung nicht, sie macht sie nur weniger dringend.

---

## Stand: 27.08.2026, 00:20 — neuer PM-Chat, und die Schleife war fast sechs Stunden tot

**Der Projekt-Manager ist wieder besetzt.** Diese Sitzung trägt seit 23:58 den Namen
`Projekt-Manager` in `ListAgents`. Vorher trug ihn **niemand** — geprüft, nicht vermutet:
76 Einträge, kein Treffer. **Jede `SendMessage` an „Projekt-Manager" lief in dieser Zeit
ins Leere**, und zwar mit „Erfolg" quittiert. Ein Doppelgänger lag nicht vor.

**Die Lücke: `pm-lebt.txt` stand auf 18:06, es war 23:58 — 5 Stunden 52 Minuten ohne PM.**
Zwei Anfragen der Sitzung „Berechnungen" (~20:15, ~20:45) blieben deshalb unbeantwortet;
sie hat sich die Freigabe direkt bei Wilhelm geholt. Das war richtig.

### 🔴 27.08. 00:40 — der Name „Projekt-Manager" ist von innen NICHT setzbar (Fund von `markt-dashboard-9f`)

**Der neue PM-Chat läuft, aber er heißt für alle anderen `markt-dashboard-91 [779ff5]`.**
`set_session_title` meldet zweimal wörtlich „Renamed this session to „Projekt-Manager“"
und setzt den Titel auch wirklich (`get_session` bestätigt ihn) — **aber der Name, unter
dem `SendMessage` zustellt, ist ein anderer Namensraum und bleibt das Kürzel.** Die
Kopfzeile von `ListAgents` sagt es unbestechlich: „This session is markt-dashboard-91".

Das ist dieselbe Fehlerfamilie wie den ganzen 26.08.: **ein Aufruf meldet Erfolg, und die
Wirkung bleibt aus.** Entdeckt hat es `markt-dashboard-9f` durch Nachfassen — der PM
selbst hatte den Erfolg geglaubt und weiterverteilt.

**Bis auf Weiteres gilt: Meldungen an `markt-dashboard-91` (Kürzel `[779ff5]`).**
Positivkontrolle, dass der Kanal trägt: die Rückfrage von `markt-dashboard-9f` kam an und
wurde beantwortet, in beide Richtungen.

**Nachtrag 27.08. ~01:1x — auch der Seitenleisten-Titel wirkt nicht, die Adresse weist
HART zurück (gemessen von `markt-dashboard-9f`):** Wilhelm hat den Chat in der App
umbenannt, der Titel steht — und ein absichtlicher Test-Send an `Projekt-Manager` kam
trotzdem zurück mit `success: false, "No agent named 'Projekt-Manager' is reachable"`.
Positivkontrolle: dieselbe Sitzung erreichte `markt-dashboard-91` Minuten vorher mit
`success: true`. **Immerhin: die Adresse schweigt nicht still, sie weist sichtbar zurück**
— wer der alten Anweisung folgt, sieht einen Fehler statt eines falschen Erfolgs, aber
die Meldung ist trotzdem weg. Unbelegte Vermutung von 9f: der Zustell-Name wird beim
*Anlegen* der Sitzung vergeben und ist danach unveränderlich (die zwei sprechenden Namen
im Bestand — `QS/Audit`, der alte `Projekt-Manager [39e5a9]` — trugen ihn von Anfang an).

**⚠ AN ALLE ROLLEN: die Meldeadresse des PM ist `markt-dashboard-91` — NICHT
„Projekt-Manager".** Wo eure Anweisung „SendMessage an Projekt-Manager" sagt, ersetzt
das durch das Kürzel, solange diese Tafel-Zeile hier steht. Schlägt ein Send fehl,
liegt hier die Übergabe-Datei als Pflichtweg ohnehin bereit.

Offene Frage an Wilhelm (im Formular des Berichts): ob er den Chat von außen umbenennen
kann — `QS/Audit` trägt als einzige interaktive Sitzung einen sprechenden Namen, es geht
also grundsätzlich. Die Rollenbeschreibung `studien/rolle-projekt-manager.md` und die
SKILL.md der Aufgabe verlangen den Namen per `set_session_title` — **diese Anweisung ist
an dieser Stelle falsch** und muss berichtigt werden, sobald der richtige Weg bekannt ist.

**Dazu, auf Wilhelms Anweisung (27.08. ~00:30): die Aufgabe `projekt-manager-chat` ist
AUS.** Sie hätte sonst erneut gefeuert und einen zweiten PM gestartet. Notstart nur noch
von Hand, und nur wenn kein PM-Chat mehr läuft.

### Was in dieser Zeit fertig wurde (aus sieben Übergaben, gegen Git geprüft)

| | |
|---|---|
| **Verzerrungsrichtung GEMESSEN** (Berechnungen, `533d5a6`) | erstes belegtes Richtungsurteil: das Überlebenden-Archiv **beschönigt** die Dip-Familie (−3,78 Pp, t = −6,19). Für `rsi2seit-mcp` **materiell** (−0,48 Pp ≈ 6× dessen delta80). Gilt fürs Fenster 24-08→26-08, nicht für 2008/09. |
| **#80 geliefert** (Desingner, `818d58a`) | die Kanal-Güte ist jetzt ein Perzentil gegen Zufall („besser als X % des Zufalls", 32.722 Eich-Kanäle). Befund: der Rauschen-Median liegt je Fenster bei **75–94** — die alte „75" war noch geschmeichelt. |
| **Baustopp (1b) umgesetzt** (Desingner, `e11d7e9`) | Signaltage statt Handelstage in allen fünf Texten, `monatsende-kauf` zeigt keine Aussicht mehr, dritter Abschnitt „gemessen — zeigt in die Gegenrichtung". |
| **Messmaschine 1.5.0** (`799ba96`) | Aussichts-Schranke (`u.tage >= 30`) **und** #92-Rangfolge. **Beides vom PM im Code nachgesehen:** `messmaschine.js:1321` führt `bestaetigt-aber-nullpunkt-verschoben` jetzt. **#92 und der QS-A-Fund (B) sind damit erledigt.** |
| **Die App sammelt Intraday selbst** (Werkzeuge, `b9512ab`/`a180e1d`) | plus `kerzenquelle.js`: **eine** Stelle entscheidet, was eine Kerze ist. |
| **#96 aufgelöst** (Werkzeuge, `6d44354`/`cdbe398`) | **die „Platzhalterkerze" ist keine** — sie trägt den offiziellen Tagesschluss. 395 Werte gegen das Tagesarchiv: 309-mal auf 0,000 % genau, **null** Gegenfälle. Alle drei diskutierten Löschregeln hätten echte Daten vernichtet, bis zu **1.171 Kerzen mit Umsatz**. |
| **QS/Audit: Block D vollständig** | zwölf von zwölf nachgerechnet, **elf stabil, `rsi2seit-mcp` gekippt** — und zwar an **0,0001 Pp**. Block B (Placebo): sieben Läufe, alle bestanden. |
| **VOR-Strang-A-Frage beantwortet** (Berechnungen, `44bac39`) | 6,33 und 1,543 sind eine Rechenkette, kein Widerspruch. Folge: **der t-Sprung 1,03 → 2,10 ist zu 100 % Schätzer, null neue Marktinformation.** |

### Was das für die Auslieferung heißt

`v8.33.5` ist der letzte Tag. Der Quellstand ist **74 Commits weiter**, **sieben
Release-Notizen** liegen bereit, Arbeitsbaum sauber, nichts ungepusht (PM selbst geprüft,
00:05). Die Release-Wache brach um 18:20 an einem schmutzigen Baum ab — **dieser Grund ist
weg.** Es bleibt Wilhelms Reihenfolge vom 26.08. 21:15: **erst die zwei Datenfunde, dann
das Release.** Die Schranken-Reparatur, an der es ebenfalls hing, ist erledigt.

**Das ist das größte offene Paket des Projekts** — sieben Notizen mit sichtbarer
Oberflächenarbeit (rote Verluste, Auflösungswand, Kanal-Perzentil, Selbst-Sammler) stehen
seit gestern Nachmittag in der Warteschlange.

### Drei Zahlen auf dieser Tafel waren falsch — berichtigt (QS-Fund, Punkt 7)

- „**sieben** der zwölf jenseits von 12.000 Handelstagen" → es sind **fünf**; zwei weitere
  haben *gar keine* Aussicht, weil sie in die Gegenrichtung zeigen. Stand an drei Stellen.
- `messmaschine.js:1214` → die Rangfolge steht in **Zeile 1305**. Stand an drei Stellen.
- Der FREI-Auftrag „doppelte Depotkurve" war **seit dem Vormittag erledigt** (`10ae955`)
  und stand mit einer halbtagsalten Sichtung offen auf der Tafel. Gestrichen.

*Nicht von mir korrigiert, weil nicht meine Datei:* `studien/grosser-plan-2026-08-26/PLAN.md`
Teil I sagt „5 von 25 / 13 von 25", richtig sind **5 von 35 / 23 von 35**. Als Auftrag unten.

### 🔴 Warnsignale

> **📅 NEUE PFLICHT AB 27.08. (Vorschlag von `markt-dashboard-1d`, sofort übernommen): JEDES
> WARNSIGNAL TRÄGT SEIN MESSDATUM.**
> *„Die Warnsignale altern, weil sie keinen Stand tragen. ‚1m bei 1.834 von 2.732' war zum
> Zeitpunkt des Schreibens richtig. Was fehlte, war das Datum der Messung neben der Zahl."*
> **Genau diese zwei Einträge hat der PM in dieser Nacht als eilig weitergegeben, obwohl beide
> überholt waren.** Eine Zeile „gemessen TT.MM. HH:MM" hätte beide Fälle verhindert — **und sie
> ist billiger als jede Prüfregel, die wir uns gegenseitig auferlegen.**

1. ~~**Unausgeliefert: 104 Commits, 9 Release-Notizen** *(gemessen 27.08. 02:00)*~~
   **✅ ERLEDIGT 27.08. 07:55 — Wilhelm hat die Sperre aufgehoben, es wird ausgeliefert.**
   *Gemessen 07:53 von der Release-Wache: **188 Commits, 12 Notizen** — die 104/9 von 02:00
   waren nach sechs Stunden bereits überholt. **Genau der Fall, für den die neue
   Messdatum-Pflicht da ist**, und die Release-Wache hat ihn selbst gemeldet.*
2. ~~**SPY fehlt in allen Intraday-Archiven.**~~ **TEILWEISE WIDERLEGT** *(gemessen 27.08.
   02:15, `markt-dashboard-1d`)*: **60m ist vollständig** — SPY mit 5.105 Kerzen, **31 von 31
   ETFs**. **Das Regime-Tor R-TREND läuft auf Stundenkerzen und ist NICHT blind.** Echte Lücke:
   **`archiv1d` (0 von 31)** sowie 1m/5m. *Der Nachlader zieht die ETFs **nicht** mit (seine
   Liste ist `Object.keys(stand.fertig)`, dort stehen 0 von 31) — der ETF-Lauf ist also nötig
   und nicht doppelt. Freigegeben, wartet auf Wachhund-Grün.*
3. ~~**Drei Abrufe sind am 26.08. abends gestorben** (15m 233/432, 1m 1.834/2.732).~~
   **ÜBERHOLT** *(gemessen 27.08. 02:15)*: **1m ist durch — alle 3.232 abgearbeitet, 0 nie
   angefasst, nichts verloren.** Für 15m/5m reicht das Quellfenster **60 Tage**, nicht sieben.
   *Todesursache: interner Abbruch und Netzstörung ausgeschlossen, bleibt äußere Beendigung.
   **Behoben wird das Nichtwissen**: seit `d13c9f2` schreibt jeder Lauf eine Zeile nach
   `<Archiv>/laeufe.log` — mit Prozessnummer und Rechner, genau dem, was diesmal fehlte.*
4. **Die Teilkerzen-Sperre leckt** *(gemessen 26.08., ~2,6 %, QS gegengeprüft)* — sie prüft den
   Zeitstempel, nicht den Inhalt. **Bei 1m ist eine Teilkerze am Zeitstempel prinzipiell nicht
   erkennbar.** *Abhilfe gebaut (`cc2848f`, geschlossener Eimer); die 2,6 % gelten für 60m, für
   1m galt die Zahl nie — siehe Richtigstellung 01:15.*
5. **Die zwei Datenfunde** *(Stand 27.08. 02:25)* — **Reparatur angehalten, nicht liegen
   geblieben.** Phantom-Dochte: Formfrage offen, wartet auf Wilhelms Populationsentscheid.
   Der 25.08. im 60m-Archiv: **der beanstandete Zustand existiert nicht mehr**, das Nachladen
   hat das Archiv neu geschrieben — die sinnvolle Frage ist jetzt „stimmt der 25.08. **jetzt**".
   *Nach Messung binden sie Strang A **sachlich** nicht; die Sperre steht formal bis Wilhelm.*
6. ~~**`tools/massive-tagesdaten.js:29`** fragt ab 2023-11-13 an, während die früheste
   Kerze vom 2024-08-23 ist — die Quelle kürzt still.~~ **URSACHE GEKLÄRT 27.08. ~02:10**
   (`markt-dashboard-1d`): **Die Quelle liefert ein rollendes 730-Tage-Fenster.** Gemessen
   ohne einen einzigen Abruf, an den 1.164 vorhandenen Reihen: Abruf am 23.08. → früheste
   Kerze 2024-08-23 (**exakt 730 Tage**), Abruf am 25.08. → 2024-08-26 (davor Wochenende);
   889 Reihen beginnen am selben Tag. **Die Anfrage ist nicht falsch gestellt — die Quelle
   gibt nicht mehr her, und die Mauer wandert täglich mit.** Offen bleibt nur die Ansage im
   Werkzeug (wird gebaut), damit die Kürzung nicht mehr still passiert.
7. ~~**Drei nachweislich falsche Delistings** in `massive/verschwundene.json`: AVB, EQR,
   WBS.~~ **🔴 WIDERLEGT 27.08. ~02:10 — DIESES WARNSIGNAL WAR SELBST DER FEHLER.**
   Siehe eigener Abschnitt unter „Aufträge".

### Was liegen geblieben ist

- **`scoreboard.js` ist wieder frei** — die Sitzung Werkzeuge/Oberfläche hat den Bau
  angehalten, weil die Wand-Anzeige eine Entscheidung braucht (Frage 1 unten). Gemessen
  ist alles, gebaut nichts.
- **Strang A wartet** auf F2/F3 (Fragen 2 und 3 unten) *und* auf die zwei Datenfunde.
- **Die Kostenannahme 0,10 % gilt als bestätigt, obwohl der Beleg zu 58 % aus Krypto
  besteht** (QS-A-Fund). Trennung nach Anlageklasse steht aus.
- **Fokusreihenfolge in Dialogen** ist der einzige Barrierefreiheits-Punkt, der nie
  gemessen wurde — `tools/a11y-probe.js` öffnet keine Dialoge.
- **Der E1-Vermerk für `rsi2seit-mcp`** („Verzerrung materiell, −0,48 Pp, beschönigend")
  ist noch in keinem Protokoll eingetragen.

---
## Stand: 26.08.2026, 11:15

Ausgeliefert ist **v8.33.3** (Tag auf `b0a3020`, 09:04). Der Quellstand ist **drei
Commits weiter**, **zwei Release-Notizen** warten auf die Wache. Arbeitsbaum sauber,
nichts ungepusht, `npm test` **grün** (PM selbst gelaufen, 11:10).

**Die Neumessung ist fertig — und das ist die Nachricht des Tages.** Zwölf Protokolle
liegen, alle auf Maschine **1.2.0** und demselben `codeStand 6a7d9e29db6f` (PM hat alle
zwölf Dateien selbst gelesen, nicht den Bericht übernommen). Ergebnis:

| | Zahl |
|---|---|
| bestätigt | **0** |
| nicht bestätigt (gemessen, trägt nicht) | 2 — `kapitulation`, `winkelbestaetigt` |
| nicht entscheidbar (Lineal zu grob) | 9 |
| nicht messbar | 1 — `monatsende-kauf` |

**Die Auflösungswand über alle zwölf**, vom PM aus den Protokollen gezogen (die Tafel
zeigte bis 09:30 nur fünf Zeilen). Gelesen wird `bestesUrteil` und die **kleinste**
Aussicht über alle Varianten — sie ist die planungsrelevante:

**⚠ KORRIGIERT 27.08. ~02:1x (QS-Fund „Einheit tage80"): die Spalte zählte SIGNALTAGE,
nicht Handelstage — und der Umrechnungsfaktor ist je Strategie verschieden (1,0 bis
21,5), die alte Rangfolge war deshalb in sich nicht vergleichbar.** Umrechnung je
Strategie aus dem Protokoll (Handelstage der Bestätigungshälfte ÷ Signaltage), Rechenweg
`qs-audit-2026-08-26/werkzeuge/einheit-tage80.js`:

| Strategie | Urteil | **Handelstage bis entscheidbar** | (Signaltage) |
|---|---|---|---|
| kapitulation | **nicht bestätigt** | **834** | 224 |
| rsi2seit-mcp | nicht entscheidbar | **1.073** | 1.070 |
| monatsende-kauf | nicht messbar | **4.015** ⚠ aus 17 Tagen | 187 |
| rsi2seit | nicht entscheidbar | 4.127 | 4.116 |
| t3-stundendrift | nicht entscheidbar | 12.655 | 12.655 |
| t2-umsatzschock | nicht entscheidbar | 17.365 | 17.317 |
| momentum | nicht entscheidbar | 34.110 | 33.683 |
| t1-zwangsglattstellung | nicht entscheidbar | 35.075 | 34.691 |
| quartalsschub-betrag | nicht entscheidbar | **55.750** | 13.257 |
| monatswende-breit | nicht entscheidbar | **79.500** | 3.803 |
| winkelbestaetigt | **nicht bestätigt** | — | (keine Aussicht) |
| winkelgrad | nicht entscheidbar | — | (keine Aussicht) |

**Was dadurch kippt:** `monatswende-breit` fällt von Platz 4 auf den letzten,
`monatsende-kauf` von Platz 1 auf Platz 3; die drei dünn feuernden
Tagesarchiv-Strategien waren systematisch zu gut dargestellt. **Durch die
1.000-Handelstage-Eintrittskarte kommt nur noch `kapitulation` (834)** — und die ist
gemessen und trägt nicht. **SECHS liegen jenseits von 12.000 Handelstagen** (nicht fünf),
zwei weitere ohne Aussicht. Wilhelms delta80-Entscheid räumt das Problem ab, sobald er
in der Anzeige steht — delta80 ist eine Effektgröße, da gibt es nichts umzurechnen.

*Die ursprüngliche Tabelle (Signaltage, falsche Überschrift) bleibt darunter als Beleg:*

| Strategie | Urteil | kleinste Aussicht (SIGNALTAGE — Überschrift war falsch) | alle Varianten |
|---|---|---|---|
| monatsende-kauf | nicht messbar | **187** ⚠ | 187 — **entwertet, siehe Warnkanal unten** |
| kapitulation | **nicht bestätigt** | **224** | 1.551 · 2.330 · **224** |
| rsi2seit-mcp | nicht entscheidbar | 1.070 | 1.437 · 1.476 · 1.156 · **1.070** · 1.079 |
| monatswende-breit | nicht entscheidbar | 3.803 | 3.942 · 3.803 |
| rsi2seit | nicht entscheidbar | 4.116 | 4.116 |
| t3-stundendrift | nicht entscheidbar | 12.655 | 294.710 · 12.655 |
| quartalsschub-betrag | nicht entscheidbar | 13.257 | 13.257 · 19.416 |
| t2-umsatzschock | nicht entscheidbar | 17.317 | 51.183 · 17.317 |
| momentum | nicht entscheidbar | 33.683 | 52.578 · 157.689 · 33.683 · 562.398 |
| t1-zwangsglattstellung | nicht entscheidbar | 34.691 | 34.691 |
| winkelbestaetigt | **nicht bestätigt** | — | (keine Aussicht ausgewiesen) |
| winkelgrad | nicht entscheidbar | — | (keine Aussicht ausgewiesen) |

*(Der folgende Absatz gehört zur alten Signaltage-Tabelle — in Handelstagen sind es SECHS jenseits von 12.000 und nur ZWEI unter 1.500, siehe Korrektur oben.)*

**FÜNF der zwölf liegen jenseits von 12.000 Handelstagen (zwei weitere haben GAR KEINE Aussicht — sie zeigen in die Gegenrichtung)** — mehr als fünfzig Jahre
Börse. Sie sind mit diesem Datenbestand nicht entscheidbar, egal wie lange gewartet wird.
Nur drei liegen unter 1.500 Tagen, und die kürzeste von allen trägt das Urteil
*nicht messbar*.

**Vorsicht bei der kurzen Zahl:** eine kleine Aussicht heißt *entscheidbar*, nicht
*lohnend*. `kapitulation` steht mit 224 Tagen ganz vorn und ist zugleich eine der beiden,
die **gemessen wurden und nicht getragen haben**.

Der Zeitraum ist **für neun der zwölf 26.09.2023 bis 24.08.2026** (60m-Archiv) — nicht
bis heute; Grund ist der Archiv-Stillstand weiter unten. **Die drei Tagesarchiv-Protokolle
(momentum, monatswende-breit, quartalsschub-betrag) laufen dagegen ab 25.08.1986 über
10.076 Handelstage** — Faktor 14 im Datenbestand. *(Richtigstellung 26.08. abends nach
QS-Prüfung: hier stand „aller zwölf", das war für die drei falsch; der große Plan hat
immer richtig gerechnet.)*

**(1a) und (2b) sind fertig** (`0b7f767`): Depot und Scoreboard zeigen jetzt dasselbe
Urteil, und vor `kapitulation` steht der Warnhinweis. Vom PM in `depot.js:767`
nachgesehen — dort steht `bestesUrteil`, nicht mehr das stärkste t.

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A–E, E-Rest | Politur, Navigation, Reiter, Bausteinkasten, `depot.js` zerlegen | fertig |
| F (1) | Theme ohne Dunkel-Blitz | **fertig** (26.08.) |
| F (2) | Ein einziger Chart-Renderer | **entschieden 26.08.: NEIN** — nur die Doppelung (B2) raeumen |
| F (3) | Barrierefreiheit | **frei** (die Sperre dahinter ist mit F (2) weggefallen) |

---

### 🔄 Neuer Arbeitsablauf ab 26.08.2026 — jede Rolle übergibt, keine schaltet sich stumm ab

**Wilhelms Anordnung, 26.08.:** *„alle tasks so anpassen, dass sie einen report geben,
sobald sie fertig sind … dann 10 Min auf Bereitschaft bleiben … damit nichts mehr liegen
bleibt oder wer auf seine Anweisungen warten muss."* Umgesetzt vom PM in allen neun
Rollen.

**Was jede Rolle jetzt am Ende tut:**

1. **Übergabe schreiben** nach
   `<Downloads>/Markt-Dashboard-Daten/uebergabe/<rolle>-<datum-uhrzeit>.md` — mit dem Kopf
   `ERREICHBAR-BIS: <HH:MM>` und fünf Punkten. **Punkt 4 ist der tragende: „Was jemand
   anders übernehmen müsste", mit Datei und Zeile.**
2. **Zehn Minuten Bereitschaft** über ein Hintergrundkommando (`sleep 600`). Die Sitzung
   endet nicht sofort und kann in dieser Zeit angesprochen werden — Rückfrage oder
   gleich der nächste Auftrag. Ein Auftrag, der länger dauert, wird trotzdem zu Ende
   gebracht; zehn Minuten sind ein Mindestmaß, keine Obergrenze.

**Was der PM jetzt zuerst tut:** den Übergabe-Ordner lesen, verteilen, das Bleibende auf
diese Tafel übertragen, die Datei wegräumen. **Fehlt die Übergabe einer Rolle, die laut
Zeitplan gelaufen ist, gilt das selbst als Warnsignal** — eine Rolle, die schweigt, ist
der Zustand, den dieses Projekt am teuersten bezahlt hat.

**Warum Datei und nicht einfach eine Nachricht — gemessen, nicht vermutet:**
Sitzungsnamen werden **zufällig** vergeben (`markt-dashboard-xy`) und kommen mehrfach
vor; in der Liste standen heute 58 Einträge, elf Namen doppelt. Es gibt also keine feste
Adresse, unter der der PM erreichbar wäre — und er läuft selbst nur sechsmal täglich,
**nachts nie**. Eine Nachricht an ihn bliebe liegen, bis er das nächste Mal etwas tut.
**Die Datei trägt immer, die Bereitschaft ist die Abkürzung für den Fall, dass er wach
ist.** Dass ein Hintergrundkommando die Sitzung wirklich offenhält, hat der PM an sich
selbst geprüft, nicht angenommen.

**Nachtrag 26.08. 17:20 — der Weg über sprechende Namen ist geprüft und zu.**
Wilhelm fragte, ob die Rollen einander nicht an den Namen aus seiner Seitenleiste
erkennen können. **Es gibt zwei getrennte Listen, und sie hängen nicht zusammen:**

| Liste | zeigt | taugt zum Senden? |
|---|---|---|
| `ListAgents` (Adressen für `SendMessage`) | 59 Einträge, fast alle `markt-dashboard-xy` | **ja**, auch aus Aufgaben heraus |
| CCD-Sitzungsverwaltung (`list_sessions`) | dieselben Sitzungen **mit Titeln** — „Auditor", „Issue wache", „Archiv nachladen" — samt „läuft gerade" | **nein**: `ccd send_message` ist für geplante Aufgaben ausdrücklich gesperrt, in beide Richtungen |

**Getestet, nicht vermutet:** Der PM hat sich per `set_session_title` in „Projekt-Manager"
umbenannt; der Master hat danach in `ListAgents` nachgesehen — **unverändert
`markt-dashboard-ea`**. Ein Titel im laufenden Betrieb schlägt nicht durch.
*Zwei Einschränkungen, vom Master selbst benannt:* geschaut wurde wenige Minuten danach,
ein Durchschlagen erst beim nächsten Start ist damit nicht ausgeschlossen. Und es gibt
einen unerklärten Gegenbeleg — `Desingner` und `App-Codebase Master` stehen sprechend in
der Liste, **ohne** je `set_session_title` gerufen zu haben. Es gibt also einen Weg,
sprechende Namen dorthin zu bekommen; das Umbenennen zur Laufzeit ist es nicht.

**Was daraus gebaut wurde, statt zu raten:** Der Übergabe-Kopf trägt jetzt drei Zeilen —
`ROLLE`, `GESTARTET`, `ERREICHBAR-BIS`. `ListAgents` nennt zwar keine Namen, aber **wie
lange jede Sitzung schon läuft**. Der PM vergleicht das mit `GESTARTET` und weiß, welcher
Eintrag die Rolle ist. Passt keine Laufzeit eindeutig, **lässt er es** — eine Nachricht an
die falsche Sitzung ist schlimmer als keine. (Elf Namen kommen ohnehin doppelt vor; auch
sprechende Namen lösten das nicht, sobald zwei Läufe derselben Rolle gleichzeitig liefen.)

**Die ehrliche Lücke, damit niemand mehr erwartet als drinsteckt:** Die vier nächtlichen
Rollen (Auditor 01:00, Analytiker 03:15, Tüftler 04:30, Archiv-Nachladen bis ~01:35)
enden zu Zeiten, zu denen **kein PM läuft**. Ihre Bereitschaft läuft dort ins Leere; es
trägt allein die Übergabe-Datei, die der PM um 08:00 liest. **Das ist kein Fehler des
Aufbaus, sondern eine Frage des Zeitplans** — siehe Frage (5) an Wilhelm.

**Nachtrag 26.08. 19:45 — der PM ist jetzt ein fester Chat, und Chat-Sitzungen gehen in
Dauerbereitschaft (Wilhelms Anordnung).** Zwei Änderungen:

1. **Der PM steht in `ListAgents` als „Projekt-Manager"** — von außen gemessen, nicht
   angenommen. Übergaben gehen zusätzlich per `SendMessage` dorthin, auch nachts; die
   Datei bleibt Pflicht (ein Chat kann geschlossen sein). Die sieben Rollen-Anweisungen
   sind entsprechend nachgezogen. Damit ist die Nachtlücke oben praktisch geschlossen,
   solange der PM-Chat offen ist; die alte PM-Routine bleibt als ausgeschalteter
   Notstart bestehen.
2. **Chat-Sitzungen (Master, Berechnungen, Desingner, QS/Audit …) enden nach ihrer
   Aufgabe nicht mehr**, sondern gehen in eine Schleife: Übergabe ablegen, dann
   `sleep 600` als **Hintergrundkommando**; beim Aufwachen Nachrichten und neue
   Aufträge abarbeiten, sonst wieder schlafen — eine Zeile, keine Tools, kein Bericht.
   Ende der Schleife: Wilhelm schließt den Chat oder der PM entlässt ausdrücklich.
   **Die Routinen behalten die einmalige 10-Minuten-Bereitschaft** — eine Endlosschleife
   dort wäre die Prozesslast, die heute um 19:05 die CPU auf 97 % getrieben hat.

3. **Jede Rolle meldet sich beim PM, wenn sie fertig ist — per Nachricht, nicht nur per
   Datei.** Wilhelm: *„stell auch bitte sicher das sich alle Teammitglieder bei dir
   melden wenn sie fertig sind! per message"*. Vier Angaben genügen: wer du bist, was
   fertig ist, der wichtigste Fund in einem Satz (oder ausdrücklich „nichts gefunden"),
   was du als Nächstes brauchst. **Die Übergabe-Datei bleibt Pflicht** — sie geht nie
   verloren, erreicht den PM aber erst beim nächsten Durchgang; die Nachricht erreicht
   ihn sofort und macht die Bereitschaft erst nutzbar. In allen sieben Routinen-Rollen
   eingetragen, an die laufenden Chats verteilt.

4. **Fragen an Wilhelm gehen als Formular, nicht als Fließtext** (`AskUserQuestion`):
   Kopfzeile, zwei bis vier Optionen, empfohlene zuerst, Begründung in der Option.
   Sein Wortlaut: *„nicht solche walls of text pleeassee"*. Steht in
   `studien/rolle-projekt-manager.md` Punkt 6.

### 🔴 26.08. 21:45 — **„Versendet" heißt nicht „zugestellt".** Zehnte Verkleidung, diesmal beim PM

**Wilhelm meldete, dass die Nachrichten des PM bei den Sitzungen nicht ankommen** —
obwohl `SendMessage` **jedes Mal Erfolg meldete**. Nachgemessen: Die Erfolgsmeldung
bedeutet nur *in die Warteschlange gelegt*. Zugestellt wird erst beim **nächsten
Arbeitsschritt der Empfänger-Sitzung**.

**Eine Chat-Sitzung, die ihren Zug beendet hat und auf Wilhelms Eingabe wartet, arbeitet
nicht — sie holt die Warteschlange nie ab.** Die Nachricht liegt unsichtbar da, für
beide Seiten.

**Der Fehler des PM war die Deutung:** Er hat das Schweigen von vier Sitzungen zwei
Stunden lang als „arbeitet gerade" gelesen. Genau dasselbe Muster, das er an diesem Tag
neunmal bei anderen gemeldet hatte — *der Erfolgsnachweis prüft etwas anderes als das,
worauf es ankommt.* Hier prüft er das Absenden, nicht das Ankommen.

**Regeln ab sofort, für alle:**

- **Eine Nachricht gilt erst als zugestellt, wenn geantwortet wurde.** Schweigen ist kein
  Beleg für Arbeit — es ist gar kein Beleg.
- Bei wichtigen Aufträgen `notify_when_idle: true` mitgeben. Das meldet, wenn die
  Gegenstelle ihren nächsten Zug beendet, und ist der einzige belastbare Hinweis, dass
  dort jemand zuhört.
- **Die Wach-Schleife ist keine Kür, sondern die Voraussetzung dafür, dass Punkt 2 oben
  überhaupt funktioniert.** Wer sie nicht fährt, ist nach seinem letzten Satz taub.
- **Die Übergabe-Datei bleibt der einzige Kanal, der ohne wache Gegenstelle trägt.**
  Deshalb bleibt sie Pflicht, auch wenn die Nachricht bequemer ist.
- Ist eine Sitzung taub, hilft nur ein Anstoß durch Wilhelm in ihrem Fenster.

### 🔴 26.08. 23:25 — die Ursache ist gefunden, **und der PM-Chat bleibt trotzdem taub**

**Wilhelm hat die Ursache gefunden, nicht der PM:** Der alte Projekt-Manager hatte sich
per `set_session_title` ebenfalls **„Projekt-Manager"** genannt. Es gab also **zwei
Sitzungen mit identischem Namen**, und jede Nachricht an diesen Namen ging an ihn — in
beide Richtungen. Deshalb blieb es beidseitig still, während beide Seiten „Erfolg"
gemeldet bekamen.

**Belegt an der Erfolgsmeldung selbst** (Beobachtung des Desingners): Vor dem Löschen
trug sie den Zusatz *„a Remote Control or cloud session also named 'Projekt-Manager' is
registered to a session on this machine"*. **Nach dem Löschen ist dieser Zusatz weg** und
die Ref `[39e5a9]` wird ohne Rückfrage angenommen. Die Adressierung ist damit sauber.

**Eine Testnachricht des Desingners kam um 23:25 trotzdem nicht an.** Der PM schloss
daraus, sein Empfang sei defekt, und schrieb das hier hin.

### ✅ 26.08. 23:39 — **das war falsch. Der Kanal trägt.** (Richtigstellung, gemessen)

**Wilhelm ließ den Prozess nachstellen:** eine einmalige Routine `pm-zustellprobe-einmalig`
mit ausdrücklich unverwechselbarem Namen. **Ihre Nachricht kam um 23:39 beim PM-Chat an**,
die Antwort ging zurück. **Der Empfang ist nicht defekt** — die vorige Diagnose ist
hiermit zurückgezogen.

**Damit war die Namenskollision sehr wahrscheinlich die alleinige Ursache**, und ihre
Beseitigung hat gewirkt. Warum die Probe des Desingners um 23:25 dennoch nicht ankam,
**bleibt offen** — vermutlich lag sie zeitlich zu dicht am Löschen des Doppelgängers.
*Offene Frage, nicht geklärt.*

**Der Fehler des PM daran, und er ist der lehrreichste des Abends:** Aus **einer**
ausgebliebenen Nachricht wurde ein Systembefund („Empfang defekt") — ohne
Positivkontrolle, also ohne zu prüfen, ob überhaupt jemand sendet, der gerade senden
kann. Genau die Hausregel, die die QS am selben Abend aufgestellt hatte: **jeder
Nullbefund braucht eine Positivkontrolle.** Ein Nullbefund ohne sie ist keine Diagnose,
sondern eine Vermutung mit Zahlen daneben. Wilhelm hat die Positivkontrolle angeordnet,
nicht der PM.

**Was daraus folgt — für morgen früh, damit niemand wieder zwei Stunden sucht:**

1. **Der Kanal ist benutzbar.** Nachrichten an `Projekt-Manager` (Bindestrich,
   `interactive`) kommen an. Bleibt eine Antwort aus, ist die Gegenstelle vermutlich
   **schlafend**, nicht defekt — Anstoß oder Wach-Schleife, nicht Fehlersuche.
2. **Eine Routine wäre der falsche Schluss.** Der Chat ist die richtige Bauart — die
   Routine lief nur sechsmal täglich, nachts nie, und hieß in der Agentenliste
   `markt-dashboard-54`. Der Empfangsdefekt ist ein separater Fehler, kein Argument gegen
   den Chat.
3. **Nie zwei Sitzungen mit demselben Namen.** Wer sich umbenennt, prüft vorher, ob der
   Name schon vergeben ist. Ein Doppelgänger ist schlimmer als ein kryptischer Name: Beim
   kryptischen weiß man, dass man ihn nicht findet — beim Doppelgänger glaubt man, man
   habe ihn gefunden.
4. **Der Dateiweg hat den ganzen Abend getragen und alles Wichtige transportiert.** Die
   Verzerrungsmessung, #80, #96 und der Strang-A-Entwurf sind **ohne eine einzige
   zugestellte Nachricht** entstanden — über Übergabe-Dateien und diese Tafel.

---

### ⚠ Richtigstellung 26.08. 16:50 — **v8.33.4 IST ausgeliefert.** Der PM hat es falsch gemeldet

Ich habe seit 11:15 mehrfach geschrieben, die Version „hänge auf 8.33.4 ohne Tag" und die
Release-Wache sei „nicht zurückgekommen". **Das war falsch.** In Git nachgesehen:

| | |
|---|---|
| Tag `v8.33.4` | **existiert**, auf `69c27ed` (26.08. 12:07) |
| `package.json` | 8.33.4 |
| Notizen für 8.33.4 | alle verbraucht |

Die Wache hat um 12:07 sauber abgeschlossen: 19 Commits seit `v8.33.3`, Updater sieht
8.33.4, sha512-Gegenprobe stimmt, alle 43 Skripte im Paket, Release nicht als Entwurf,
Arbeitsbaum sauber, HEAD auf dem Tag.

**Wie der Fehler entstand — er gehört zur selben Familie wie der Rest des Tages:** Ich
hatte um 11:08 geprüft, **vor** dem Release, und danach nie wieder `git fetch --tags`
gemacht. Meine Zwischenstände liefen auf einem Stand, der bei jedem Blick älter wurde,
**ohne dass sich der Blick änderte**. Genau das Muster, das ich heute dreimal an anderen
gemeldet habe: *ein Lauf, der nichts dazulernt, sieht von außen aus wie ein gesunder Lauf.*

**Regel für den PM, ab sofort:** Jede Aussage über Version oder Auslieferung wird
unmittelbar vor dem Aussprechen mit `git fetch -q --tags` frisch geholt. Ein Stand von
vor zwei Stunden ist kein Stand.

**Es warten schon wieder drei Notizen** auf die nächste Auslieferung:
`archiv-nachladen`, `ausstieg-schalter`, `lesbarkeit-nachgemessen`.

---

### ✅ Der neue Ablauf trägt — erster Beleg noch am selben Tag

**Drei Übergaben lagen beim ersten Blick in den Briefkasten** (zwei Issue-Wache, eine vom
Master). Der Umbau ist damit nicht nur geschrieben, sondern **gelaufen**.

**Und er hat sofort geleistet, wofür er gebaut wurde.** Der Master meldet Stufe F (3) als
erledigt — **aber unter Punkt 3 steht: die Fokusreihenfolge in den Dialogen ist NICHT
gemessen.** Einer von vier Auftragspunkten, offen und benannt statt stillschweigend
mitgemeldet. Ohne den Pflichtpunkt „was ich nicht geschafft habe" wäre F (3) als fertig
in die Bücher gegangen und dieser Teil hätte auf niemandes Liste gestanden.

### Stufe F (3), Barrierefreiheit — gemessen, nicht behauptet (`779c02c`)

Neue Sonde `tools/a11y-probe.js`: startet die App isoliert, schaltet alle fünf Reiter und
achtzehn Pillen durch, misst Kontrast gegen den **wirklich gerenderten** Untergrund.

**Befunde: hell 23, dunkel 8 → danach beide null** — bei *mehr* geprüften Textstellen als
vorher (1.757 gegen 1.681). Das Grün kommt also nicht vom Wegsehen. Sechs Farbmarken
lagen unter der Schwelle 4,5 und liegen jetzt darüber.

Dazu ein echter Fund: der Regelkopf unter *Strategien* war die einzige Tabelle ohne
Kopfzelle — eine Vorlesesoftware las „60m", „8 Stunden", „nicht bestätigt" als Folge
zusammenhangloser Werte.

**Zwei der vier Planpunkte bestätigen sich NICHT und sollen nicht „repariert" werden:**
kein `aria-live`-Bereich ist zu breit, kein positiver `tabindex`, kein anspringbares
Element ohne Namen. Wer hier eingreift, ändert etwas Funktionierendes.

**Offen (a):** Fokusreihenfolge in Dialogen — `tools/a11y-probe.js`, Messcode ab ~95,
Ablauf ab ~250. Klein und gut abgegrenzt.
**Beobachtung (b), gehört Wilhelm:** alle sechs Kontrastbefunde traten gegen `--panel-2`
auf (`index.html:51` hell, `:137` dunkel). Der Master hat die **Schriftfarben** nachgezogen;
den **Untergrund** aufzuhellen hätte alle sechs auf einmal erledigt — das ist eine
Gestaltungsentscheidung, keine Reparatur.
**(c)** Rückgängig zu machen mit je einer Zeile: `index.html` 28/34/41 und 121/130/137,
alte Werte stehen im Kommentar daneben.

**Ein methodischer Satz, der über den Auftrag hinausgeht:** Der erste Sondenlauf meldete
„keine Befunde" — auf einem frischen Profil wird fast nichts gezeichnet. **Eine grüne
Prüfung ohne Inhalt sagt nur, dass sie nichts zu sehen bekam.** Die Sonde sät jetzt selbst
ein Depot, drei Papiere und vier Protokolle. Fünfte Verkleidung derselben Stille an
einem Tag.

### Aus der Issue-Wache: was auf Wilhelm wartet, nicht auf Arbeitskraft

Ihr Lauf war leer (alle acht Issues gesichtet, letzter Beitrag jeweils ihr eigener). Sie
trennt aber sauber, **was blockiert**:

**Wartet auf eine Entscheidung von Wilhelm:**
- **#96** — ob die 20:00-Platzhalterkerze verworfen wird (147 von 152 Reihen betroffen,
  Tagesarchiv sauber).
- **#80** — welcher der drei Wege für die Kanal-Güte. Betrifft `explorer.js:628/656/664/669`,
  `depot.js:1251/2040`, Sortierung `depot.js:1998`.
- **#72 Punkt 3** — Richtung zur Kostenhürde (längere Haltedauer / Basiswert / engere Spannen).

**Baubereit und unstrittig, sobald jemand Zeit hat:** #92 (Rangfolge,
`messmaschine.js:1305`), #69 (Backup/Restore, Anforderung vollständig), #82
(Herkunftsland — das Feld fehlt im Programm noch ganz), #95 (Felix' fehlende
`stammdaten.json`, Gegenprobe steht aus).

**Vorschlag der Wache in eigener Sache:** Seit sie alle 30 Minuten nur noch sichtet, ist
der Leerlauf der Normalfall — ein längerer Takt täte es auch. Sie ändert ihre eigene
Aufgabe ausdrücklich nicht; das ist Wilhelms Entscheid.

---

### 📋 DER GROSSE PLAN — `studien/grosser-plan-2026-08-26/PLAN.md` (26.08., PM)

**Wilhelm hat einen Gesamtplan bestellt. Er liegt vor und ist ein Vorschlag, keine
Festlegung.** Jede Sitzung liest ihn, bevor sie sich etwas nimmt — er sagt, **warum**
etwas dran ist, nicht nur was.

**Die Lage in einem Satz:** Neun von zwölf Strategien sind nicht am Markt gescheitert,
sondern am Messgerät — eine Kante in Größe der Kostenhürde bräuchte 35 Jahre Daten.

**Die drei Hebel, alle bereits vermessen:** Messanordnung (Faktor 1,5, **geeicht**) ·
Haltedauer (Faktor 15) · Kostenhürde (Faktor bis 5,75). **Nicht mehr Detektoren** — der
Suchraum ist nicht das Problem, das Auflösungsvermögen ist es.

**Die Stränge:**
- **A** — `momentum` nicht überlappend messen. Der einzige Ort, an dem eine große Kante
  noch möglich ist, gerade weil er schlecht gemessen ist. Anordnung geeicht, Messung offen.
- **B** — Übernacht-Familie: zwei Kandidaten vorregistriert, seit heute technisch messbar.
- **C** — Kostenhürde angreifen: Auktionskosten am Demo-Konto (freigegeben, **nicht
  angefangen**) und Basiswert statt Schein.
- **D** — die App sagt die Wahrheit über sich selbst (Wand sichtbar machen, #92, #80, #96).
- **E** — Betrieb, läuft bereits.

**Teil IV nimmt ernst, dass hier nichts zu finden sein könnte**, und schlägt ein
Abbruchkriterium vor. **Die Engstelle ist nicht Arbeitskraft, sondern Entscheidung.**

---

### ⚠ 26.08. 18:30 — Überlebenslücke vermessen, drei Datenfunde zugeteilt

**Der Tüftler hat die Lücke des großen Archivs beziffert: mindestens 12,7 % des
Querschnitts fehlen, ausschließlich Nicht-Überlebende**, steigend auf 20 % (2023). Mit
den vorhandenen Quellen nicht zu schließen. **Das trifft den großen Plan an der Wurzel** —
Strang A und B rechnen beide darauf, und jede positive Rohrendite ist dadurch nach oben
verzerrt, in genau der Richtung, in der wir etwas finden wollen. Ausführlich im Plan.

**Zugeteilt an den Master (Datenqualität, unstrittig):**
1. Falsche Delistings in `massive/verschwundene.json` — **Vorrang.**
   ~~**Korrigiert 18:45: belegt falsch sind DREI, nicht fünf** — AVB, EQR, WBS.~~
   **🔴 ERNEUT KORRIGIERT 27.08. 04:55 vom Tüftler selbst: ES IST EINER, NICHT DREI.**
   *„Ich hatte **Kerzen gezählt statt Umsatz**."* Nachgezählt: **EQR (letzter Umsatz 17.08.)
   und WBS (19.08.) sind zurückgenommen — ihre Listeneinträge stimmen.** Übrig bleibt **AVB**.
   **Und auch der Warnsatz war zu groß:** Von **6.921** aktienartigen Listeneinträgen stehen
   **genau 5** überhaupt im Kursarchiv — *der Schaden einer Ausschlussliste ist damit auf
   **eine** Reihe begrenzt, nicht auf zwei Schwergewichte.*
   *(Ursprünglicher Kontext: Der Tüftler hatte gefragt, was die **Quelle** im Fenster
   17.–26.08. führt, und damit „Quelle hat nichts" von „Archiv holt es nicht" getrennt.
   LBRDA/LBRDK hatte er selbst aus seiner Gruppe genommen.)*
   *Der PM hatte die Fünf ungeprüft weitergereicht — seine Ungenauigkeit, nicht dessen.*

   > **✅ AUFGELÖST 05:05 — und es war kein Widerspruch, sondern ein HÄNGENDES ARCHIV gegen die
   > lebende Quelle. Beide Sitzungen hatten recht.**
   >
   > | | 14.08. | 17.–21.08. | 24.08. | ab 25.08. |
   > |---|---|---|---|---|
   > | **`archiv1d`** *(Stand 24.08. 18:38)* | v = 6.938.895 | **5× v = 0**, Schluss identisch **bis zur 15. Stelle** | fehlt | fehlt |
   > | **frischer Abruf 27.08.** | — | 20.08. v = 4,33 Mio · 21.08. v = 7,16 Mio | **v = 6.201.087** | `null` |
   >
   > **`archiv1d` ist für AVB seit dem 14.08. stehengeblieben und hat statt Daten Stempel
   > gesammelt.** *Der Wachhund bestätigt es unabhängig: **8 Tage Rückstand ist genau die Lücke
   > 14. → 24.08.*** **Kein Quellstreit — derselbe Anbieter, zweimal, mit zehn Tagen Abstand.**
   >
   > *Feldsemantik, damit daraus nicht die nächste Differenz wird: `archiv1d` führt
   > **bereinigte** Schlusskurse (daher die 15 Stellen), der frische Abruf las den
   > **unbereinigten** `quote.close` — 65,90 gegen 65,14. **Für den Umsatz folgenlos.***
   >
   > **🔻 UND DAMIT FÄLLT AUCH DER LETZTE FALL:** Yahoo zeigt AVB-Handel **bis 24.08.** und
   > danach nichts. Zusammen mit dem `25-NSE` vom 17.08. passt das: **Eine Abmeldung nach Form
   > 25 wird nicht am Einreichungstag wirksam, sondern mit Frist danach** — Handel bis kurz vor
   > dem Wirksamwerden ist der **Normalfall**, nicht der Widerspruch.
   > **→ AVB ist kein Falsch-Positiv der Liste, sondern ein Papier mit falschem DATUM in der
   > Liste** (18.08. statt Handelsende 24.08., rund 4 Handelstage).
   > **Von den ursprünglich drei „belegt falsch delisteten" bleibt NULL.**
   >
   > **Was bleibt, ist schwächer und immer noch nützlich: die Delisting-DATEN am jüngsten Rand
   > sind unzuverlässig — die Delistings selbst sind es nicht.**
   > *Als plausible Zusammenführung gekennzeichnet, nicht als Befund: Die Form-25-Frist wäre am
   > Filing selbst zu prüfen; das liegt bei `markt-dashboard-1d`, die das `25-NSE` hat.*

   **Die zehn Rückstände zerfallen in drei Gruppen:** AVB, EQR, WBS, TWO = **reines
   Nachladen** (8 Kerzen liegen bei der Quelle bereit) · LBRDA, LBRDK, WHLR = echte
   Datenlücke · BSCO, IBDP, IBTE = **ETFs**, gehören womöglich gar nicht in die Prüfmenge.
2. `tools/massive-tagesdaten.js:29` — holt neun Monate weniger als es glaubt.
3. **Der Wachhund rundet 99,66 % auf 100 %** und verschluckt damit zehn zurückhängende
   Reihen. Sechste Verkleidung derselben Sache an einem Tag, diesmal in der Sicherung,
   die dagegen gebaut wurde.

**Offen für Wilhelm: Vorschlag C** — wie mit der Lücke umgehen. PM und Tüftler empfehlen
denselben Weg: erst auf den 1.164 schon beschafften Verschwundenen die **Richtung** der
Verzerrung messen, bevor irgendwer Daten kauft.

---

### 🔴 26.08. 17:35 — fünf Übergaben, ein A-Fund: **Wilhelms Entscheid 2b ist tot ausgeliefert**

*Erste volle Runde des PM im Dauerlauf. Fünf Rollen hatten abgelegt — Auditor, Analytiker,
Release-Wache, Tüftler, Issue-Wache. **Der Briefkasten trägt.***

**#100 (A, Auditor) — hat Vorrang vor allem, auch vor den Datenfunden.**
`kantenAusProtokollen()` ruft nach dem Füllen von `PROTOKOLL_KANTE` nur
`huerdeAnzeigen()`, **nicht** `regelKopfAnzeigen()` (`depot.js:793`). Der Regelkopf
behauptet dauerhaft „Kein Messprotokoll im Datenordner", während die Kostenhürde **sechs
Zeilen tiefer** dasselbe Protokoll mit einem **anderen** Urteil zeigt. Zwei Wahrheiten
gleichzeitig auf einer Seite.

**Die Folge, die zählt:** Wilhelms Entscheid **2b** (Warnhinweis vor `kapitulation`) ist
in v8.33.4 ausgeliefert und **in der Anzeige tot** — er hängt an `belegAusProtokoll`, das
nie gefüllt wird. Gemessen: `hatWarnhinweis = false` ausgerechnet bei `kapitulation`.
Dasselbe trifft die Variantenwahl aus `8fc2c8a`. **Zwei frisch ausgelieferte Arbeiten
wirkungslos, eine davon eine Entscheidung Wilhelms.** Keine Regression — älter als die
Änderungsmenge.

**#98 (Analytiker) — der B10-Überlappungs-Wächter ist toter Code.** `block()` reicht
`ueberlappungsFaktor` nicht weiter; **0 von 38 Protokollen** trägt den Eintrag, die
Warnung ab Faktor 3 kann **nie** feuern. Die Korrektur selbst wirkt.
`messmaschine.js` Z. 1010–1016. **Vorbedingung für Strang A:** Momentum ist genau der
Fall, für den dieser Wächter gebaut wurde — und er ist blind.

**Drei B-Funde:** #101 (Max. Rücksetzer steht schwarz statt rot — `.down` ist nur unter
`#cockpit` definiert), #102 (roher Schlüssel `nicht-bestaetigt` in der Anzeige;
`scoreboard.js` hat `label()`, exportiert sie aber nicht), #103 (Regression aus
`779c02c`: der `<th scope="row">`-Umbau zieht Großbuchstaben und einen 130-px-Reststrich mit).

**#99 (Analytiker) — gute Nachricht mit Nachspiel:** Der Depot-Reset vom 25.08. löschte
**37 von 38 Kostenrunden**. Die geretteten sagen **0,0855 %** gegen die Annahme von
0,10 % — **die Kostenannahme ist konservativ, sie hält.** Zu tun: die 38 Runden aus
`depot_vor_reset.json` zurückspielen und `kostenMessung` vom Depot-Store trennen
(`kosten.js` Z. 30–38, Reset-Dialog `depot.js` Z. 6723). Passt zum freigegebenen
Auktionskosten-Auftrag.

### ⚠ Die vorhergesagte Kollision ist bereits eingetreten

**Der Analytiker konnte seine Blöcke B und D nicht fahren — „weil das 60m-Archiv während
des gesamten Laufs beschrieben wurde".** Genau der Fall, wegen dem die Sperrdatei gebaut
wurde. Sie kam heute Nachmittag; der Lauf war vorher. **Ab heute Nacht greift sie** — und
der Analytiker fragt ab sofort den Wachhund, statt auf die Uhr zu sehen.
Die Kanten-Neuberechnung über die zwölf frischen Protokolle steht damit **noch aus**.

### ✅ v8.33.5 ist sauber draußen (Release-Wache, 17:17)

Alle Prüfungen bestanden: Updater meldet 8.33.5, Prüfsumme stimmt, **43 Skripte im Paket,
keines fehlt** — die Prüfung, an der hier schon einmal ein ganzes Modul hängenblieb.
*Hinweis der Wache für die Zukunft:* Das Bauen lief in den 10-Minuten-Deckel des
Vordergrund-Befehls (13 Min). Kein Schaden, aber `--bauen` gehört gleich als
Hintergrundkommando gestartet.

---

### ⚠ Richtigstellung 26.08. 17:50 — der PM hat Prozentpunkte mit Handelstagen verglichen

Ich hatte dem Tüftler geschrieben, seine beiden Kandidaten seien von der neuen
1.000-Tage-Regel „nicht betroffen — sie liegen mit `delta80` 0,0396 bzw. 0,0397 klar
darunter". **Das vergleicht zwei verschiedene Einheiten:** `delta80` ist eine Effektgröße
in **Prozentpunkten**, die Schwelle zählt **Handelstage**. Der Tüftler hat es
nachgerechnet (nötige Signaltage skalieren mit 1/d²):

| | vorhanden | für 0,10 Pp (CFD) | für 0,04 Pp (Aktie) |
|---|---|---|---|
| `glockendruck-nacht` | 4.665 | **735 — besteht** | 4.595 — **reißt** |
| `nachtstoss-umkehr` | 4.736 | **743 — besteht** | 4.642 — **reißt** |
| familienweit (4 Tests) | 4.736 | **872 — besteht** | 5.448 — **reißt** |

**Die Schlussfolgerung stimmt, aber aus einem anderen Grund als dem genannten — und sie
ist genauer, als ich sie hatte:** Die Schwelle trifft nicht die Entwürfe, sondern **eine
ihrer beiden vorregistrierten Antworten.** Die **JA-Seite besteht komfortabel**, auch
familienweit. Die **NEIN-Seite an der Aktienhürde reißt klar** und ist deshalb auf die
CFD-Hürde (0,10 Pp) gestellt. Datierte Nachträge liegen in beiden
Vorregistrierungs-Ordnern; die Vorregistrierungen selbst sind unverändert.

Bei `glockendruck-nacht` ist das der **zweite, unabhängige** Grund gegen dieselbe
Aussage — der Spannen-Rückprall hatte sie schon verworfen (Marge 0,0005 Pp). Zwei Wege,
dasselbe Ergebnis. Bei `nachtstoss-umkehr` ist es neu; der hat den Rückprall nicht.

**Zweiter eigener Fehler, ebenfalls vom Tüftler gefunden und vom PM repariert:** Beim
Einbau der neuen Regel in seine Rollendatei traf der Einfügepunkt eine `##`-Erwähnung
**im Fließtext** statt einer echten Überschrift — der Startabsatz, den jede künftige
Sitzung **zuerst** liest, war mitten im Satz zerrissen. Behoben; der Block steht jetzt als
eigener Abschnitt. *Er hat die Datei bewusst nicht selbst repariert — Konfiguration ändert
er nicht auf Zuruf, auch nicht zur Reparatur. Richtig so.*

**Hinweis des Tüftlers zur beauftragten Verzerrungs-Messung, der die Vorregistrierung
erheblich verkleinert:** Die Frage „ab welchem Wert ändert das die Urteile der zwölf
Protokolle?" hat eine natürliche Verankerung — **bei fünf der zwölf liegt die Aussicht
jenseits von 12.000 Handelstagen; deren Urteil kann keine Verzerrungskorrektur drehen.**
Entscheidbar ist die Frage nur für die **drei unter 1.500**.

---

### ✅ 26.08. 18:05 — #100 ist zu: **Wilhelms Entscheid 2b wirkt jetzt** (`5be41dd`)

Vom PM gegengeprüft: Commit auf origin, `npm test` Exit 0, `depot.js:792` ruft jetzt
beides, `app-shell.js:36` hält die Urteils-Übersetzung an **einer** Stelle.
**Der Master hat es in der laufenden App mit `kapitulation` reproduziert**, statt der
Meldung zu glauben:

| | vorher | jetzt |
|---|---|---|
| Regelkopf kennt das Protokoll | nein | **ja** |
| Warnhinweis (Wilhelms 2b) | nein | **ja** |

**Ein Muster, das über den Tag hinaus gilt:** Die #100-Reparatur hat **#102 erst sichtbar
gemacht** — „Beleg nicht-bestaetigt" stand erst da, als der Kopf das Protokoll überhaupt
zu sehen bekam. *Hinter einer toten Anzeige verstecken sich die Fehler der Anzeige selbst.
Wer eine reaktiviert, sollte mit dem nächsten Fund darunter rechnen.*

**Der Wachhund nennt die Ausreißer jetzt beim Namen** (`590aca6`): 99,6 % statt gerundeter
100 %, dazu jede zurückhängende Reihe mit Datum und Abstand in Handelstagen — **sieben
unter zehn Tagen, drei seit 438**. Damit ist aus der Ausgabe selbst ablesbar, was der
Tüftler getrennt erarbeitet hatte. **Die Einordnung bleibt bewusst draußen:** ob ein
Papier ins Aktienuniversum gehört, entscheidet der Universumsfilter, nicht der
Archivwächter. Er meldet den Stand, nicht die Bedeutung.

**Zwei Reste, an den Master zurück:**
- ~~**#103 unvollständig**~~ **ERLEDIGT** (QS 26.08. abends nachgesehen: `index.html:583`
  trägt `font-size: inherit`, mit Kommentar, der die Issue-Wache als Finderin nennt —
  die Tafel führte es fälschlich noch als offen).
- **#101 unangetastet**, Befund bestätigt: `.down` steht vier Mal in `index.html`
  (261, 294, 345, 367), jedes Mal kontextgebunden. Für den Rücksetzer im Depotverlauf
  greift keine davon.

**Reihenfolge unverändert:** #98 (toter Überlappungswächter, Vorbedingung für Strang A),
danach die Datenfunde.

---

### ⚠ 26.08. 20:15 — der Warnkanal der Protokolle kam auf dieser Tafel nie an (QS-Fund)

**Vier der zwölf Protokolle tragen Warnungen. Keine einzige stand hier.** Der PM hat
Urteil und Aussicht übertragen und das Feld `warnungen` schlicht nie gelesen. Vom PM in
allen zwölf Dateien nachgezählt:

| Strategie | Kennung | Kern |
|---|---|---|
| **monatsende-kauf** | **A7** | keine Lesefenster-Angabe → Kontrolle **nicht** bereinigt, Nullpunktverschiebung 0,02–0,04 Pp je Signal möglich |
| **monatsende-kauf** | **F4** | 6,2 % der Signale **ohne Kontrolle**, und der Verlust trifft **nicht zufällig** die Randpositionen der Sitzung |
| t1-zwangsglattstellung | B2 | Var 2: Tagesmittel +0,0272 Pp, Erwartung je Signal **−0,5555** Pp — dünne Tage tragen das Ergebnis |
| t2-umsatzschock | B2 ×2 | Var 0 und 1: dasselbe Vorzeichenproblem |
| t3-stundendrift | B2 | Var 0: dasselbe |

**Regel ab sofort:** Wer Urteil oder Aussicht auf diese Tafel überträgt, überträgt die
**Warnungen mit**. Eine Zahl ohne ihre Warnung ist genau die Sorte Halbwahrheit, die
dieses Projekt am teuersten bezahlt.

### 🔴 Die kleinste Aussicht der Tabelle ist die schwächste Messung im Bestand

`monatsende-kauf` steht mit **187 Handelstagen ganz oben** — und wäre damit die Strategie,
die die 1.000-Tage-Eintrittskarte am mühelosesten passiert. Was wirklich dahintersteht:

- **17 Bestätigungstage.** Die Aussicht extrapoliert Effekt *und* Streuung daraus, und der
  Effekt steht quadriert im Nenner.
- **Keine A7-Bereinigung.** Gemessener Überschuss 0,110 Pp je Signal, mögliche
  Nullpunktverschiebung 0,02–0,04 Pp — **18 bis 36 % des ganzen Effekts, Vorzeichen offen.**
- **6,2 % der Signale ohne Kontrolle**, nicht zufällig verteilt.

**Der Maschinenfehler dahinter, vom PM in `messmaschine.js` nachgesehen:** Zeile **1226**
wirft bei `u.tage < 30` sofort auf `nicht-messbar`. Zeile **1266** berechnet die Aussicht
trotzdem — die Schranke dort lautet `u.tage > 0`, **nicht** `>= 30`. **Ein Lauf, den die
Maschine selbst für nicht messbar erklärt, gibt eine Zahl aus, die aussieht wie eine
Planungsgröße.** Über alle 38 Protokolle tritt der Fall **genau einmal** auf — bei genau
dieser Strategie. Auf 1.4.0 nachgemessen: unverändert, Aussicht 187 → 180.

**Fehlerfamilie #86/#91: eine Bedingung, die fast richtig ist.**

### ✅ Block B (Placebo) bestanden — Stufe 1 des Abbruchkriteriums ist für diesen Pfad belegt

Fünf Saaten, Signal ohne jeden Kursbezug, bewusst **eine** Variante (Schwelle 1,96 statt
2,39 — der schärfste Fall, weil der Bonferroni-Puffer fehlt). Alle fünf:
**nicht-entscheidbar**, |t| ≤ 0,34. **Die Maschine sieht nichts, wo nichts ist.**

**Beobachtung, ausdrücklich kein Fund:** alle fünf Punktschätzer sind **positiv**, Mittel
rund **+0,011 Pp** — ein Viertel der Aktienhürde. Für ein Projekt, das per Hebel 2 genau
in dieser Größenordnung sucht, keine Nebensache. **Mit neuen Saaten nicht zu klären** (sie
teilen die Kurse und damit die Tagesschwankung); dafür bräuchte es disjunkte Zeitfenster.
Möglicher Grund aus dem Code: das maschineneigene Placebo schichtet nach
**Sitzungsposition** und bildet die Verteilung des echten Signals nach — das der QS streut
gleichmäßig. Steckt Tageszeit-Struktur in der Kontrolle, sieht das eine sie und das andere
nicht. **Für den Analytiker, nicht für eine Bausitzung.**

### Zwei Selbstmeldungen der QS, beide in der Hausform des Tages

- Sie hat einen a11y-Lauf durch `tail -50` geschickt und daraufhin geglaubt, die Sonde
  prüfe nur 355 statt 1.757 Stellen. **Eine abgeschnittene Ausgabe sieht aus wie eine
  unvollständige Prüfung.** Sie war eine Minute davor, einen selbst erzeugten Fund zu melden.
- Ihr erster Nachrechen-Treiber maß alle neun in **einem** Prozess; nach zwei Strategien
  stand der Heap bei 4,18 GB und der Lauf drehte im Dauer-GC. Neu: **ein Prozess je
  Messung** — `monatsende-kauf` läuft jetzt in 64 s statt gar nicht.

**Beide Oberflächen-Sonden grün**, und die Abdeckungs-Behauptung dieser Tafel stimmt
genau: 1.757 Textstellen, 16 Pillen — deckungsgleich. *(Nur dunkles Thema; hell steht aus.)*

**Nachrechnung Block D: 3 von 9, alle drei reproduzieren** — rsi2seit (t 0,83 → 0,79),
kapitulation (3 von 3 Varianten), monatsende-kauf (Urteil stabil).

---

### ✅ #96 — das trennscharfe Kriterium ist gefunden: **marktweite Gleichzeitigkeit** (QS, gezählt)

**Zwei Regeln sind vorher gescheitert, beide an einer Annahme über den *Ort* der Kerze:**

| Regel | Urheber | Ergebnis |
|---|---|---|
| flach + Umsatz 0 | **PM**, aus 5 Stichproben | 3.409 Treffer statt 2.885 — **570 echte leere Stunden** mitgelöscht |
| zusätzlich „letzte Kerze der Reihe" | **QS**, als Hypothese | **2 von 2.839** Platzhaltern getroffen, **85 echte** gelöscht |

*Grund für das zweite Scheitern, banal: das Archiv ist seit dem 25.08. weitergelaufen, der
Platzhalter steht längst mitten in der Reihe.* **Die QS hat ihre eigene Hypothese
widerlegt, bevor jemand darauf gebaut hat.**

**Was stattdessen trägt — über alle 2.885 Reihen gezählt:**

```
2026-08-25T20:00  ->  2.839 von 2.885 Reihen   (98,4 %)   <- Platzhalter
2025-10-10T13:30  ->     27 Reihen             ( 0,9 %)   <- illiquide Stunde
2023-11-24T17:30  ->     15 Reihen
```

**98,4 % gegen 0,9 %, und dazwischen liegt nichts.** Eine völlig flache Nullumsatz-Kerze,
die zur selben Sekunde in fast allen Papieren steht, kann kein Marktereignis sein. Eine,
die in 27 von 2.885 steht, ist eine wirklich nicht gehandelte Stunde.

**Warum dieses Kriterium hält, wo die beiden anderen scheiterten:** Es kommt **ohne jede
Annahme über Uhrzeit, Position oder Sitzungsende** aus — die Auflagen 2 und 3 zweifelten zu
Recht genau daran. Es sagt nicht, *wo* der Platzhalter steht, sondern *was er ist*. Und die
Trennung ist keine Schwelle, die kalibriert werden muss, sondern ein Abgrund.

**Die flachen Kerzen zerfallen damit in drei Gruppen:**

| Gruppe | Zahl | was damit geschehen soll |
|---|---|---|
| `2026-08-25T20:00` | 2.839 | **löschen** — der Platzhalter |
| krumme Zeitstempel | 151 | **löschen** — Quote-Stempel, keine Kerzen (siehe unten) |
| Rest auf gültigem Raster | 419 | **behalten** — nicht gehandelte Stunden |

### 🔴 Die Stempel-Kerzen sind zurück — und zwar an genau den Nachladetagen

Der Fehler, den das Gedächtnis als **„Stempel-Kerzen der Quelle"** führt und der seit
8.23.13 als behoben galt:

| | |
|---|---|
| Kerzen weder auf `:30` noch `:00` | **151** |
| betroffene Reihen | 150 von 2.885 |
| Tage | **nur zwei: 24.08. (75) und 26.08. (76)** — die beiden Nachladetage |
| Umsatz | alle null, alle völlig flach |

Beispiele: `AAON 2026-08-26T15:12`, `AGL 2026-08-24T17:51`, `ACMR 2026-08-24T17:50`.

**Entwarnung für die Sammelfunktion, vom PM nachgesehen:** Das **Minutenarchiv ist
sauber** — 300 Reihen Stichprobe, **null** krumme Zeitstempel, bei inzwischen 1.369
gesammelten Reihen. Der Fehler sitzt im 60m-Pfad, nicht in dem, was gerade frisch
entsteht. **Punkt 1 des Intraday-Auftrags („Format identisch, dieselbe Teilkerzen-Regel")
bleibt trotzdem der wichtigste** — er ist der Grund, warum es hier nicht durchgeschlagen ist.

### Nachrechnung Block D: **5 von 9, kein einziges Urteil gekippt**

rsi2seit · kapitulation (3/3 Varianten) · monatsende-kauf · t2-umsatzschock (2/2) ·
t1-zwangsglattstellung (Placebo t 0,031). Offen: t3, rsi2seit-mcp, winkelbestaetigt,
winkelgrad.

**Block B komplett: sieben Saaten, alle bestanden**, Mittel +0,0068 Pp, mittleres t +0,12,
eine Saat negativ. *Selbstkorrektur der QS: Nach vier Saaten hatte sie „alle positiv,
+0,014 Pp" als beobachtenswert gemeldet — mit allen sieben halbiert sich der Wert und eine
ist negativ. **Vier Würfe waren kein Muster.*** Beide Oberflächen-Sonden grün, jetzt in
**beiden** Themen, 1.757 Textstellen — die Abdeckungs-Behauptung dieser Tafel stimmt genau.

**Die Aussichts-Beobachtung verdichtet sich: 6 von 7 Varianten sind durch zwei frische
Handelstage schlechter geworden**, nicht besser (t2 Var0 51.183 → 57.345, Var1 17.317 →
18.237). Das trifft die Annahme des großen Plans, mehr Tage machten die Frage
entscheidbar.

---

### 🛑 BAUSTOPP für (1b) — an den Desingner (PM, 26.08. 20:40)

**Der PM kann den Desingner gerade nicht per Nachricht erreichen** (Namenskonflikt, siehe
unten). **Deshalb steht es hier — Desingner, lies das, bevor du die Aussicht anzeigst.**

**1. `monatsende-kauf` (187 Tage, erste Zeile) darf nicht angezeigt werden, wie es dasteht.**
Die Zahl stammt aus **17 Bestätigungstagen** bei einem Lauf, dem die Maschine selbst das
Urteil **„nicht messbar"** gegeben hat, plus zwei Warnungen (A7: Kontrolle nicht bereinigt,
Verschiebung 0,02–0,04 Pp gegen einen Effekt von 0,110 Pp · F4: 6,2 % der Signale ohne
Kontrolle). **Ursache ist ein Maschinenfehler** (`messmaschine.js` 1226 gegen 1266: die
Aussicht wird unter `tage > 0` berechnet statt `>= 30`). **Würde die Oberfläche das
anzeigen, trüge sie einen Maschinenfehler nach außen und gäbe ihm das Gewicht einer
Anzeige** — das Gegenteil dessen, wofür Strang D da ist.
**Reihenfolge: erst die Schranke reparieren, dann anzeigen.**

**2. Zwei Strategien haben gar keine Aussicht.** `winkelbestaetigt` und `winkelgrad` — in
**allen zehn Varianten**, weil ihr Überschuss durchweg negativ ist (−0,038 bis −0,128 Pp).
Sie fallen **weder über noch unter** die 2.500-Grenze; „kleinste Aussicht über alle
Varianten" ist für sie undefiniert. Ohne Vorwissen baut man dort einen Absturz oder eine
leere Zelle, die aussieht wie *„noch nicht gemessen"*.
**Vorschlag der QS, inhaltlich richtig: ein dritter Abschnitt „gemessen, zeigt in die
Gegenrichtung".** Das ist etwas anderes als „zu wenig Daten" — diese beiden brauchen keine
Daten, sie zeigen in die falsche Richtung.

**Was weitergebaut werden kann:** Struktur, Gestaltung, der Ton bei „nicht entscheidbar".
Nur die Zahlen warten.

### ⚠ Richtigstellung: es sind **fünf**, nicht sieben

Der PM hat auf dieser Tafel und im großen Plan mehrfach geschrieben, **„sieben von zwölf
liegen jenseits von 12.000 Handelstagen"**. **Falsch.** Fünf haben eine Aussicht über
12.000 (t3, quartalsschub, t2, momentum, t1). Die beiden Winkel-Strategien wurden
mitgezählt, obwohl sie **überhaupt keine Aussicht haben** — sie sind nicht unerreichbar
weit weg, sie zeigen in die Gegenrichtung. **Zwei verschiedene Sachverhalte, von mir in
eine Zahl geworfen.** Gilt auch für `studien/grosser-plan-2026-08-26/PLAN.md`.

### ⚠ Zwei Sitzungen sind für den PM nicht mehr erreichbar

`SendMessage` an **Desingner** und **App-Codebase Master** scheitert mit dem Hinweis, eine
Sitzung **auf diesem Rechner** beanspruche deren Identität, während die echten von einem
anderen Rechner schreiben. Beide antworten weiterhin — der PM kann sie nur nicht mehr von
sich aus ansprechen. **Aufträge an die beiden laufen bis auf Weiteres über diese Tafel.**

### Eingrenzung der Quote-Stempel: die App ist sauber, die Messbasis nicht

Die QS hat den App-Store nachgezählt: **6.108.828 Kerzen über 1m/5m/15m/60m, null krumme
Stempel.** Dazu die 300 Minutenreihen des PM auf `E:`, ebenfalls null. **Der Fehler sitzt
allein im Mess-Archiv auf `E:`, geschrieben von `tools/yahoo-60m-holen.js`** — 151 Kerzen
an den beiden Nachladetagen. Die laufende App schreibt sauber.

**Nachrechnung: 6 von 9, weiterhin kein einziges gekipptes Urteil** (neu: t3-stundendrift,
Placebo t 0,385). `archiv1d` ist seit 2 Stunden gesperrt — **die drei Tagesarchiv-Protokolle,
darunter `momentum` und damit Strang A, bleiben ungeprüft.**

---

### 🔴 Die Teilkerzen-Sperre feuert seit Monaten nie — und der Sammler schreibt gerade hinein

**`fertigeKerze()` verwirft eine Kerze, wenn `getUTCSeconds() !== 0`.** Das war die Messung
zu Issue 85: *„Yahoo stempelt die laufende Kerze mit der Quote-Uhrzeit (16:57:27 statt
16:30)."* **Diese Prämisse gilt nicht mehr.** Yahoo stempelt inzwischen auf **volle
Minuten** — `17:51:00`, `15:12:00`. Über rund **7 Millionen Kerzen in vier Archiven**:

| | |
|---|---|
| Kerzen mit Sekunde ≠ 0 | **0** |
| krumme Kerzen im 60m-Archiv | 151 — **davon Sekunde = 0: alle 151** |

**Die Sperre sieht gesund aus und feuert nie.** Achte Verkleidung desselben Musters, und
diesmal an einer Sperrklinke, die eigens gegen diese Fehlerform gebaut wurde.

**Richtigstellung des PM: meine Entwarnung fürs Minutenarchiv war nach dem falschen
Merkmal geprüft.** Ich hatte auf Sekunde ≠ 0 getestet — dasselbe Merkmal, das die kaputte
Sperre benutzt. **Am Inhalt gemessen sieht es anders aus** (PM selbst nachgezählt, 20:50):

| Archiv | Reihen | letzte Kerze flach **und** Umsatz 0 |
|---|---|---|
| **archiv1m** | 1.647 | **7** (0,4 %) |
| archiv5m | 491 | **16** (3,3 %) |
| archiv15m | 232 | **8** (3,4 %) |
| archiv60m | 2.885 | **87** (3,0 %) |

Beispiele von heute: `BCO 17:43`, `LAD 17:22`, `DPST 17:10`, `A 16:51`, `EQIX 16:57` —
**laufende Kerzen, mitten in der Sitzung eingefroren.**

**Warum es im Minutenarchiv am gefährlichsten ist:** Bei Minutenkerzen ist `17:43:00` ein
**völlig gültiger Rasterplatz**. Kein Zeitstempel-Test kann eine Teilkerze dort je finden.
**Je feiner das Raster, desto unsichtbarer der Fehler** — und 1m ist genau das Archiv, das
täglich gesammelt wird und **nie nachgeholt werden kann**.

**Entscheidung des PM: der laufende Abruf wird NICHT gestoppt.** 0,4 % betroffen, alle
eindeutig identifizierbar und nachträglich entfernbar — die Kerzen selbst verfallen nach
sieben Tagen unwiederbringlich. **Ein Archiv mit einem benannten Makel ist mehr wert als
keines.** Der Makel steht hiermit benannt.

### #96 sortiert sich damit in DREI Populationen, nicht zwei

| Gruppe | Zahl (60m) | Merkmal | Umgang |
|---|---|---|---|
| **Platzhalter** | 2.870 | alle am **selben** Zeitstempel, 98,4 % aller Reihen | löschen |
| **Teilkerzen** | ~87 | **letzte** Kerze, flach, Umsatz 0, **heutiges** Datum | löschen **und beim Schreiben verhindern** |
| **echte leere Stunden** | ~410 | **mitten** in der Reihe, illiquide Papiere, verstreut | **behalten** |

**Jede Gruppe braucht ihr eigenes Merkmal.** Die Verwechslung von 1 und 3 war der
ursprüngliche Fehler (PM), die von 2 und 3 der zweite (QS) — *sie hat ihn selbst
zurückgenommen: die vermeintlichen 85 „echten" Kerzen waren laufende Teilkerzen von heute.
Ihre Schlussfolgerung stand, die Begründung war falsch.*

### Was daraus folgt — **an den Master, über diese Tafel, weil nicht erreichbar**

**Die Teilkerzen-Prüfung darf nicht am Zeitstempel hängen.** Das tragfähige Merkmal steht
in den Daten: **letzte Kerze der Reihe, Umsatz 0, Hoch = Tief = Eröffnung = Schluss.** Das
wirkt auf allen vier Auflösungen gleich, auch dort, wo das Raster nichts hergibt. Ein
Zusatzmerkmal hat `reiheHolen()` schon zur Hand: die Quelle liefert
`currentTradingPeriod.regular` — ob die Sitzung überhaupt zu ist.

**Betroffen sind beide Stellen in `kerzenquelle.js`:** `fertigeKerze()` (~Z. 150)
verhindert neue, `zusammenfuehren()` (~Z. 195) räumt vorhandene weg. **Nur eine zu ändern
reicht nicht.**

**Und das ist Punkt 1 des Intraday-Auftrags in seiner schärfsten Form:** Würde die neue
Sammelfunktion die bestehende Sperre übernehmen, übernähme sie eine, die nachweislich nie
feuert — und schriebe Teilkerzen in genau die Archive, die nie nachgeholt werden können.

---

### 🔴 Ein Urteil ist gekippt — und der eigentliche Fund ist, dass die Grenze Rauschen ist

**`rsi2seit-mcp`: nicht entscheidbar → nicht bestätigt.** Zwei von fünf Varianten wechseln,
damit das `bestesUrteil` der ganzen Strategie.

**Woran es hängt:**

| | Überschuss | MDE | Abstand |
|---|---|---|---|
| Var 3 **alt** | 0,0552 | 0,0554 | **−0,0002 Pp** |
| Var 3 **neu** | 0,0554 | 0,0553 | **+0,0001 Pp** |
| Var 4 alt | 0,0593 | 0,0597 | −0,0004 Pp |
| Var 4 neu | 0,0600 | 0,0596 | +0,0005 Pp |

**Das Urteil der Variante 3 hängt an 0,0001 Prozentpunkten** — einem Zehntausendstel, einem
Viertelprozent der Aktienhürde. An der Strategie hat sich nichts geändert; es sind zwei
Handelstage dazugekommen.

**Und es ist heute das zweite Mal.** Vom PM in `studien/neumessung-2026-08-26/AUSGABE.md`
Zeile 44–45 nachgesehen — heute früh kippte **dieselbe Variante** in die **andere**
Richtung: *„nicht-bestaetigt → nicht-entscheidbar, Überschuss 0.0556 → 0.0552 gegen MDE
0.0554 (Abstand −0,0002 Pp)."*

**Zweimal an einem Tag, in beide Richtungen, auf Margen von 0,0002 und 0,0001 Pp.**

**Der Fund ist deshalb nicht „rsi2seit-mcp ist jetzt nicht bestätigt".** Er ist:

> **Die Grenze zwischen „nicht entscheidbar" und „nicht bestätigt" ist bei dieser Strategie
> keine Eigenschaft des Marktes, sondern Rauschen.**

Und auf genau diesen Etiketten steht die Kopfzeile dieser Tafel — *„2 nicht bestätigt, 9
nicht entscheidbar, 1 nicht messbar"*. **Die 2 war heute schon 3 und wieder 2.**

*Einordnung, damit es nicht größer klingt als es ist:* **„bestätigt" war nie in Reichweite.**
Die Bonferroni-Schwelle liegt bei fünf Tests auf 2,576, t steht bei 2,00. Es wechselt nur
die **Art des Nein**, nicht das Nein selbst.

### Die Folge für den Plan: die Eintrittskarte hat keinen Kandidaten mehr

`rsi2seit-mcp` war eine der **drei** Strategien unter 1.500 Handelstagen. Steht sie auf
„nicht bestätigt", sind **alle drei erledigt**:

| Strategie | Aussicht | Urteil |
|---|---|---|
| monatsende-kauf | 187 | nicht messbar (17 Tage, A7-Warnung — Zahl entwertet) |
| kapitulation | 224 | **nicht bestätigt** |
| rsi2seit-mcp | 1.070 | **nicht bestätigt** |

**Aus dem laufenden Korpus kommt nichts mehr nach, was die 1.000-Tage-Eintrittskarte
durchließe und noch offen wäre.** Neues muss aus **Strang A** (momentum, nicht
überlappend) oder **Strang B** (Übernacht-Familie) kommen. Das ist keine Katastrophe —
aber es gehört neben das Abbruchkriterium, weil es dessen Voraussetzungen ändert.

*Zur Sorgfalt der QS:* Der abgeschossene erste Lauf hatte `rsi2seit-mcp` **fertig
gemessen** und das Protokoll um 19:45 geschrieben; verloren ging nur die Bildschirmausgabe,
weil Node beim harten Abschuss den Puffer nicht leert. **Ein unabhängiger Zweitlauf misst
gerade nach.**

**Stand Block D: 7 von 9 — sechs stabil, eines gekippt.** Es fehlen `winkelbestaetigt` und
`winkelgrad`. Die drei Tagesarchiv-Protokolle bleiben gesperrt (`archiv1d`, über 2 h) —
darunter `momentum`, also Strang A.

**Alle Skripte und Rohergebnisse liegen dauerhaft** unter
`Markt-Dashboard-Daten/qs-audit-2026-08-26/` — Werkzeuge, Block-D-Protokolle,
Block-B-Placebos, beide a11y-Läufe. Nicht im Scratch, der mit der Sitzung verschwindet.

---

### 🛑 Der Minutenkerzen-Abruf ist gestoppt (PM, 26.08. 21:10) — mit Begründung

**Ich hatte vor zwanzig Minuten entschieden, ihn weiterlaufen zu lassen. Das war falsch,
und der Grund ist erst durch die exakte Auszählung der QS sichtbar geworden.**

**Zwei Befunde, beide vom PM selbst nachgesehen:**

**1. Der Lauf begräbt nichts — er erzeugt.** Ohne `--aktualisieren` überspringt das
Werkzeug vorhandene Reihen (`yahoo-60m-holen.js:170`). Die bereits vorhandenen Teilkerzen
sind also unberührt. **Aber jede frisch geholte Reihe bekommt eine neue**, weil die
US-Sitzung noch läuft: **in zwanzig Minuten von 7 auf 9 gewachsen** (neu: MSA, VONV, TECS,
SPXC).

**2. Deshalb ist nicht das Sammeln der Fehler, sondern der Zeitpunkt.** Wer **während der
Sitzung** sammelt, holt zwangsläufig die laufende Kerze mit. Der nächtliche Lauf um 22:15
liegt nach Börsenschluss — **derselbe Befehl wäre dort sauber.**

**Warum das schwerer wiegt als bei 60m:** Eine Teilkerze hört auf, die letzte zu sein,
sobald der nächste Lauf läuft. Im 60m-Bestand verrät sie sich danach noch am krummen
Raster (75 von 75). **Bei Minutenkerzen gibt es dieses Raster nicht** — `17:43:00` ist ein
gültiger Platz. **Eine begrabene 1m-Teilkerze ist dauerhaft nicht mehr von einer echten zu
unterscheiden.** Und Yahoo liefert sie nicht noch einmal.

**Vorher gesichert:** die neun betroffenen Reihen stehen mit Symbol, Zeitstempel und Kurs
in `Markt-Dashboard-Daten/teilkerzen-1m-2026-08-26.json` — **damit sie auffindbar bleiben,
auch wenn ein späterer Lauf sie begräbt.** Billige Versicherung, einmal geschrieben.

**Stand des Minutenarchivs:** 1.647+ Reihen statt der 490 vom Nachmittag. Der größte Teil
der Erweiterung ist also drin; es fehlt der Rest der rund 2.900.

**Was daraus als Regel folgt — sie fehlte bisher überall:**

> **Intraday-Archive werden nur nach Börsenschluss gesammelt.** Ein Lauf während der
> Sitzung schreibt in jede frisch geholte Reihe eine eingefrorene Teilkerze.

Das gehört in die Sammelfunktion des Masters, in die nächtliche Aufgabe und in jede
Rolle, die ein Intraday-Archiv anfasst. **Der Auftrag „App sammelt selbst" muss diese
Bedingung tragen** — eine App, die tagsüber offen ist und nebenbei sammelt, produziert
genau das, was hier gerade aufgefallen ist.

---

### ⚖ Die QS lässt ihre eigenen Funde widerlegen — acht unabhängige Skeptiker

**Alle heutigen QS-Funde stehen ab sofort als *gemeldet*, nicht als *bestätigt*.** Die QS
hat es selbst angestoßen, und der PM zieht die Kennzeichnung auf dieser Tafel nach — er
hatte mehrere davon bereits als Befund eingetragen.

**Ihre Begründung, und sie ist zwingend:** Ihre Funde **stoppen gerade Bauarbeiten** —
der Master hat #96 liegengelassen, dem Desingner wurde (1b) in Frage gestellt, und sie
empfiehlt Eingriffe in `kerzenquelle.js`. Dazu musste sie sich **heute dreimal selbst
korrigieren**: abgeschnittene Ausgabe, falsches Stundenraster, „85 echte Kerzen", die
keine waren.

**Jeder dieser drei Fehler hatte dieselbe Form: eine unvollständige Sicht sieht aus wie
ein Befund über die Sache.** Genau die Form, die dieses Projekt heute achtmal bezahlt hat.
*„Ich habe keinen Grund anzunehmen, dass ich sie ein viertes Mal nicht produziere."*

**Geprüft werden acht Funde, je ein Agent, Auftrag: widerlegen statt bestätigen, Zahlen
unabhängig neu herleiten statt ihre Skripte benutzen.**

1. die #96-Zählung (3.409 Treffer, 264 Reihen mehrfach)
2. das Gleichzeitigkeits-Kriterium (98,4 % gegen 0,9 %) — **einschließlich der Frage, ob
   „löschen" für die 2.839 überhaupt richtig ist**
3. die wirkungslose Teilkerzen-Sperre und die 160 Teilkerzen
4. die Krypto-Beimischung in der Kostenmessung
5. die Aussicht trotz „nicht messbar"
6. die drei Zählfehler auf Tafel und Plan
7. die zwei veralteten Auftragsangaben
8. „der App-Store ist sauber, der Defekt sitzt nur im Mess-Archiv"

**Punkt 2 ist der, den niemand gestellt hatte** — auch der PM nicht, obwohl Wilhelms
Entscheidung „Platzhalter raus" darauf beruht. *Ist Löschen überhaupt der richtige Umgang,
oder trägt die Kerze eine Information, die dann fehlt?*

**Was sich dadurch NICHT ändert:** Bei #96 und `kerzenquelle.js` bleibt es bei
**„nicht anwenden, bis geklärt"** — diese Empfehlung ist in beide Richtungen sicher.

### ✅ Der Urteilswechsel ist unabhängig bestätigt

Die Zahlen zu `rsi2seit-mcp` stammten aus einem Lauf, den die QS selbst abgeschossen hatte.
**Ein frischer Einzelprozess hat die Messung wiederholt und liefert jede Zahl identisch**
(Var3 0,0554/0,0553 · Var4 0,0600/0,0596 · Placebo t 0,998 · B10-Faktor 0,98).
**Kein Artefakt des Abbruchs** — beide Urteilswechsel stehen.

**Block D: 8 von 9 durch**, sieben stabil, eines gekippt. `winkelgrad` läuft.

---

### ⚠ #96: „Löschen" ist womöglich nicht der richtige Umgang — zwei offene Fragen

Aus einer beiläufigen Bemerkung des PM („eine Kerze ohne Umsatz trägt vermutlich keine
Information") hat die QS zwei Punkte entwickelt, **die vorher niemand bedacht hatte** und
die **Wilhelms Entscheidung berühren**:

**1. Eine gelöschte Kerze ist etwas anderes als eine flache Kerze.**
Wer sie entfernt, **ändert die Kerzenzahl je Reihe** — und damit jeden Vorlauf, der in
**Kerzen** zählt statt in Tagen: `leseFensterKerzen: 261` bei rsi2seit, **430** bei t3.
Eine Reihe, aus der eine Kerze verschwindet, hat ab diesem Punkt eine um eins verschobene
Indizierung. **Ob das die Messungen bewegt, ist offen. Dass es sie bewegen kann, ist neu.**

**2. „Flach" ist nicht dasselbe wie „erfunden".**
Bei den ~410 echten leeren Stunden ist die flache Kerze der **ehrliche Zustand des
Marktes**. Behält die Regel sie, führt das Archiv künftig **zwei Sorten flacher Kerzen** —
und die nächste Sitzung, die eine davon sieht, kann sie nicht mehr auseinanderhalten.

**Denkbare Alternative zum Löschen, noch von niemandem geprüft:** die Kerze **markieren**
statt entfernen. Dann bleibt die Indizierung unberührt, und jede spätere Auswertung kann
selbst entscheiden, ob sie sie einbezieht. Kostet ein Feld je Kerze.

**Das geht als offene Frage in die Übergabe, unabhängig vom Urteil der Skeptiker.**
An Wilhelms Entscheidung („Platzhalter raus, echte Kerzen bleiben") ändert es nichts —
**aber am Wie**, und das war bisher stillschweigend als „löschen" angenommen. Vom PM.

*Nebenbei, weil es zur Sorgfalt gehört:* Der PM hatte vor der Last der acht Skeptiker
gewarnt. Die QS hat **nachgesehen statt geschätzt**: 68 % CPU auf 16 Kernen, 18,7 GB frei,
**zwei** Node-Prozesse (einer davon ihr Block-D-Lauf). Die Skeptiker lesen Quelltext und
rechnen kurze Zählungen — schwere Messungen sind ihnen ausdrücklich untersagt
(`keine Läufe über 3 Minuten`, `niemals messen.js`, `niemals archiv1d`). Sie staffelt
deshalb **nicht**. **Und sie schreibt die Uhrzeit ihrer Messung dazu — mit ausdrücklichem
Verweis auf den Versionsstands-Fehler des PM von heute Mittag.**

---

### ✅ #96: die Verschiebungs-Sorge ist entkräftet — gemessen statt vermutet

Die QS hat die eigene Warnung nachgemessen. **Sie trägt nicht**, und der Grund ist eine
Zahl statt einer Überlegung.

Die Maschine läuft über **Array-Positionen** (`for (var i = vorlauf; i < b.length - H; i++)`),
und `leseFensterKerzen` zählt **Kerzen** (261, bei t3 430) — eine entfernte Kerze verschiebt
also alles danach. Die Frage war deshalb berechtigt. **Entscheidend ist, wo die Kandidaten
sitzen** (Abstand vom Reihenende, über alle 2.885 Reihen, Reihenlänge im Median 5.099):

| | n | Median | max |
|---|---|---|---|
| **Platzhalter 25.08.** | 2.839 | **2** | **4** |
| echte leere Stunden | 410 | 4.112 | 5.097 |

**Die Platzhalter sitzen ausnahmslos in den letzten vier Kerzen.** Sie zu entfernen
verschiebt nichts, was vor ihnen liegt — und sie liegen ohnehin **hinter** dem
Messzeitraum aller zwölf Protokolle, der am 24.08. endet. Die 410 echten Leerstunden
liegen umgekehrt tief in der Geschichte (387 von 410 weiter als 430 Kerzen vom Ende) und
sind seit jeher Teil der gemessenen Daten.

**Was von der Frage offen bleibt:** Behält die Regel die 410 — und das soll sie —, führt
das Archiv **zwei Sorten flacher Kerzen**, ohne Merkmal zum Auseinanderhalten. Das ist kein
Argument gegen das Löschen, sondern eines dafür, **im Datensatz zu vermerken, dass gelöscht
wurde.**

**Eine Selbsteinschränkung der QS, die hierher gehört:** Ihre Block-D-Läufe gehen bis zum
**26.08.** und enthalten damit die Platzhalter *und* die heutigen Teilkerzen; die
Morgenprotokolle (bis 24.08.) enthalten beides nicht. Ein flacher Balken unter 5.099 und
~87 Teilkerzen über 2.885 Reihen seien vernachlässigbar — *„aber ‚vernachlässigbar' ist
bei mir geschätzt, nicht gemessen."* **Sie sagt den Satz über die eigene Arbeit, den sie
heute an anderen beanstandet hat.**

**Block D: `winkelbestaetigt` reproduziert** (nicht bestätigt, alle fünf Varianten, alle
ohne Aussicht wegen negativem Überschuss) — **damit ist der Tafel-Fund (a) im frischen Lauf
auf Maschine 1.4.0 bestätigt: es sind fünf, nicht sieben.** `winkelgrad` ist der letzte.

---

### 🔴 Die Aussicht ist keine belastbare Zahl — und die Eintrittskarte misst an ihr

**Zuerst eine Richtigstellung, die den Plan betrifft.** Die QS hatte gemeldet, die Aussicht
werde durch frische Handelstage **durchweg schlechter**; der PM hat das als Teil IV-b in
den großen Plan übernommen. **Über zwei Tage stimmte es. Über die ganze Messhistorie
nicht:**

```
Uebergaenge mit MEHR Bestaetigungstagen:
  Aussicht GEFALLEN (Warten half) : 14
  Aussicht GESTIEGEN              : 12
```

**Praktisch ein Münzwurf.** Die Aussage war eine Zwei-Tage-Momentaufnahme und ist aus dem
Plan gestrichen. *Sie hat es selbst nachgerechnet, weil sie ihre eigene Behauptung prüfen
wollte.*

**Dabei fiel das Eigentliche auf: `tage80` skaliert mit 1/Effekt²** — ein kleiner,
verrauschter Punktschätzer im Nenner, quadriert. Halbiert sich der geschätzte Effekt,
**vervierfacht** sich die Aussicht.

**Spannweite derselben Variante über die Messhistorie des Projekts:**

| Variante | von | bis | Faktor |
|---|---|---|---|
| monatsende-kauf V0 | 180 | 16.185 | **89,9** |
| **rsi2seit-mcp V3** | **1.056** | **75.988** | **72,0** |
| rsi2seit-mcp V4 | 1.050 | 29.867 | 28,4 |
| rsi2seit V0 | 1.197 | 30.354 | 25,4 |
| t3-stundendrift V1 | 9.680 | 131.888 | 13,6 |

~~Median über alle 23 Varianten: Faktor 2,4.~~ **ZURÜCKGEZOGEN — konfundiert mit dem Universumswechsel.** Die Hälfte davon passiert bei **identischer
Tageszahl** — ohne einen einzigen neuen Handelstag.

*Ehrliche Einschränkung der QS:* Gleiche Tageszahl und trotzdem andere Zahl heißt, dass
sich **Maschine oder Konfiguration** geändert hat, nicht die Daten (bei monatsende-kauf
nachweislich ein anderes Universum, bei momentum ein älterer Maschinenstand). **Es ist
also nicht reines Schätzrauschen — aber es heißt, dass die Zahl über die eigene
Messhistorie des Projekts nicht reproduzierbar ist.**

### Warum das eine Entscheidung berührt, nicht nur eine Methode

**Wilhelms Eintrittskarte lautet „unter 1.000 nötigen Handelstagen".** `rsi2seit-mcp` V3
steht auf dieser Tafel mit **1.070** — dieselbe Variante hat in der eigenen Historie
zwischen **1.056 und 75.988** gestanden.

> **Eine Schranke bei 1.000 ist feiner als die Reproduzierbarkeit der Zahl, an der sie
> misst.** Ob ein Kandidat durchkommt, entscheidet damit teils, auf welchem Maschinenstand
> er gemessen wurde.

**Dasselbe trifft (1b):** Der Auftrag will die Zahl anzeigen und bei 2.500 trennen. Bei
einem Median-Faktor von 2,4 wandern Strategien über diese Grenze, ohne dass sich am Markt
etwas geändert hat.

**Empfehlung der QS, ungebaut:**
1. Die Aussicht **nie ohne ihren Effekt und ihre Tageszahl** zitieren — sie ist eine
   Ableitung aus beiden, keine eigenständige Größe.
2. Für die Eintrittskarte **nicht die Aussicht** als Schranke nehmen, sondern **`delta80`
   gegen die Kostenhürde**: Effektgröße gegen Effektgröße, dieselben Einheiten, **ohne
   Quadrierung im Nenner**.
3. Wird die Aussicht angezeigt, dann **als Bereich, nicht als Zahl**.

*Ihr Hinweis dazu, und er sitzt:* Genau diese Verwechslung ist dem PM heute Mittag
unterlaufen — nur andersherum, er hatte `delta80` als Tageszahl gelesen. **„Die Lehre
daraus ist nicht ‚nimm Tage statt Pp', sondern ‚nimm die Größe, die nicht durch einen
Schätzer geteilt wird'."**

**Status: gemeldet, nicht bestätigt.** Dieser Fund ist **nicht** unter den acht Skeptikern
— er ist neu und ungeprüft. Rechenwege liegen unter
`Markt-Dashboard-Daten/qs-audit-2026-08-26/werkzeuge/` (`aussicht-verlauf.js`,
`aussicht-streuung.js`, beide nur lesend).

---

### ⚠ ZURÜCKGEZOGEN: „~~Median-Faktor 2,4, im Extrem 72~~ (ZURÜCKGEZOGEN, siehe oben)" — die Zahlen sind konfundiert

**Diese beiden Zahlen stehen in `8e0ef59` und in der Begründung zu Wilhelms Entscheidung
in `ae80caa`. Die QS hat sie selbst zurückgezogen.** Sie hatte nach Maschinenversion
gruppiert, **aber nicht nach Universum** — und zwischen dem 23. und 24.08. kam das große
Archiv dazu:

```
rsi2seit-2026-08-23    191 Werte
rsi2seit-2026-08-24  2.885 Werte
```

**Ein Universumswechsel um Faktor 15, verbucht als „acht zusätzliche Handelstage".** Sauber
nachgerechnet — gleiche Strategie, gleiche Variante, gleiche Maschine, **gleiches
Universum** — ergibt: **null vergleichbare Gruppen.** Es gibt in der gesamten
Protokollhistorie keinen einzigen sauberen Vergleich.

**Wilhelms Entscheidung hält trotzdem — auf anderem Fundament:**

| trägt weiter | trägt nicht mehr |
|---|---|
| `tage80` skaliert mit **1/Effekt²** — Arithmetik, keine Messung | ~~Median-Faktor 2,4~~ |
| `delta80` ist **Effektgröße gegen Effektgröße**, kein Schätzer im Nenner | ~~im Extrem 72~~ |
| einzige saubere Beobachtung: **ein** Handelstag bewegte die Aussicht um bis zu **59 %** (kapitulation V1, 2.330 → 3.704) | ~~„feiner als die Reproduzierbarkeit"~~ — jetzt **unbelegt, nicht widerlegt** |

**„delta80 ist die robustere Größe, weil sie nicht durch einen verrauschten Schätzer
geteilt wird" ist strukturell und braucht keine Messung.** Die Entscheidung steht.

**Regel für alle, aus diesem Vorfall:** *Eine Kennzahl über die Zeit zu vergleichen setzt
voraus, dass sich dazwischen **nur die Zeit** geändert hat.* Hier haben sich Universum
(191 → 2.874), Maschine (1.0.0 → 1.4.0) und Rechenvorschrift (#86, #91) geändert — **drei
Wechsel in drei Tagen. Der Protokollbestand ist als Zeitreihe über sich selbst nicht
auswertbar.**

---

### 🔴 A-FUND: `tage80` zählt SIGNALTAGE — die Eintrittskarte vergleicht HANDELSTAGE

**Ein Einheitenfehler mitten in Wilhelms Entscheidung — dieselbe Familie wie der
delta80-Fehler des PM vom Mittag.**

Bei `monatsende-kauf` stehen **17 Signaltage** in **365 Bestätigungs-Handelstagen** — rund
21,5 Handelstage je Signaltag. **Die ausgewiesenen 187 Signaltage sind ≈ 4.016
Handelstage ≈ 16 Jahre.**

Gegen die alte Eintrittskarte („unter 1.000 **Handelstagen**") liest sich die rohe 187 als
bequemes Ja. **Richtig umgerechnet ist es ein Nein um Faktor vier.**

**Damit war Wilhelms Umstellung auf `delta80` richtiger, als irgendwer wusste** — sie
umgeht das Einheitenproblem vollständig, weil sie Effektgrößen vergleicht statt Zeiten.

Dazu: `scoreboard.js:196` markiert nur bei `bestesUrteil === 'nicht-entscheidbar'` als
„hinter der Wand" — ein `nicht-messbar`-Protokoll zeigt die 187 **unkommentiert in der
oberen Tabelle**. Die Schranke `>= 30` verhindert die Zahl bei nicht-messbaren Läufen;
**die Einheit stimmt auch bei den anderen elf nicht.**

### 🔴 A-FUND: ein sechstes Urteil erzeugt ein FALSCHES Etikett

`messmaschine.js:1235` vergibt `bestaetigt-aber-nullpunkt-verschoben`. Das Array in `:1305`
kennt nur fünf Werte. Ein Lauf, dessen einzige Variante so ausfällt, läuft über
`|| 'nicht-messbar'`. **Eine bestätigte Kante würde als „nicht messbar" gemeldet.**

Schärfer als #92: dort wird ein Urteil **verdeckt**, hier ein **falsches erzeugt**.
Einzeiler, derzeit 0 Vorkommen — **#92 ist ohnehin offen, gehört zusammen erledigt.**

*Nebenbei: Die Rangfolge ist keine konsistente Ordnung. `winkelbestaetigt-2026-08-25` hat
4× nicht-entscheidbar + 1× nicht-bestätigt und meldet das **härtere** — während `widerlegt`
hinten steht und dort das mildere gewänne.*

### 🔴 DATENFUND A: der 25.08. ist womöglich ganz neu zu holen

In 2.839 von 2.885 Reihen steht `2026-08-25T20:00Z`, Umsatz 0, Kurs = Schluss der
19:30-Kerze. **Live gegengeprüft: die Quelle liefert für den 25.08. keine 20:00-Kerze
mehr.** Da `zusammenfuehren()` nur nach Zeitstempel vereinigt und **nie löscht**, bleibt
sie für immer stehen.

**Und schwerer:** Die archivierte **19:30**-Kerze von AAPL trägt v = 2.851.594 /
c = 309,8999 — die Quelle heute v = 2.846.819 / c = 309,8299. **Auch die 19:30 wurde
unfertig eingefroren.** Gilt das allgemein, ist nicht eine Kerze zu löschen, sondern
**der ganze 25.08. neu zu holen.** *Ungeprüft — ein Abrufvergleich über 20 Symbole klärt es.*

### 🔴 DATENFUND B: Phantom-Dochte an sieben US-Halbtagen

`AAPL 2025-07-03, 17:00, Umsatz 0, Tief 201,25` — gegen ein Sitzungstief von **211,81**.
**Ein Docht von −5,8 % ohne einen einzigen gehandelten Anteil**, live reproduziert.

Betroffen: 2023-11-24 · 2024-07-03 · 2024-11-29 · 2024-12-24 · 2025-07-03 · 2025-11-28 ·
2025-12-24.

**Jede Messung, die Hoch/Tief benutzt — Ausbrüche, ATR, Stopps, Kanäle, ORB — bekommt an
diesen Tagen im ganzen Querschnitt falsche Extremwerte.** Die Sekunden-Sperre kann das
nicht abfangen.

---

### Was die acht Skeptiker an den QS-Funden korrigiert haben

| Fund | Korrektur |
|---|---|
| „#96 trifft 3.409" | **3.440** archivweit. Und: die **implementierte** Regel trifft **0** — richtig ist „das **vorgeschlagene** Prädikat trifft 3.440" |
| „Die Sperre greift ins Leere" | **„Sie leckt zu ~2,6 %."** 0 von 21,3 Mio mit Sekunde ≠ 0 ist genau das, was ein **arbeitender** Filter hinterlässt. *„Abwesenheit als Beleg gegen den Mechanismus, der die Abwesenheit erzeugt."* |
| **„Der App-Store ist sauber"** | **Falsch — Werkzeugfehler.** Store-Zeilen haben **5** Felder, Archiv-Zeilen 6; der Test prüfte `k[5]` → immer `undefined` → **konnte nie feuern.** Richtig: **1.170 Stempel im Store** |
| „7 von 1.603" (1m) | **Auf wanderndem Grund erhoben** — `_laeuft.json` war aktiv |
| Gleichzeitigkeits-Kriterium | **hinreichend, nicht notwendig** — ließe die 151 krummen Stempel durch. Bessere Regel: (i) krumme Minute, (ii) Zeitstempel, den es an **keinem anderen Handelstag** gibt |
| „etf-Ordner still ausgeschlossen" | **kein Fund** — `kapitulation.js:80` liest ihn gezielt, „ETFs sind Maßstab, nicht Messobjekt" |
| „5 von 25 ist veraltet" | **war nie ein gültiger Stand** — Zähler aus dem 35er-Satz, Nenner aus einem gedachten 25er |

**Unverändert bestätigt:** Krypto-Beimischung (jede Zahl exakt reproduziert) · Aussicht
trotz nicht-messbar · zwei veraltete Tafelangaben · drei Zählfehler.

**Drei Verschärfungen dazu:**
- **Die 16 Aktien-Kostenrunden sind EIN Marktmoment** — 13:31:52 bis 13:32:26 UTC,
  **34 Sekunden**, zwei Minuten nach Eröffnung, quer über 15 Megacaps. Keine 16 Ziehungen
  über „Handelskosten"; der SE misst Querschnittsstreuung. **Ohne die eine ARM-Runde sind
  es 0,0959 % — unter der Annahme.**
- **`diagnose.js` Z. 149–160 aggregiert ohne Krypto-Filter**, während `kosten.js:363`
  filtert. Zwei Stellen, die sich widersprechen.
- **„sieben" steht noch an drei weiteren Stellen**, die falsche `:1214` ebenfalls.

### Das Muster — und das Gegenmittel

**„Der Test misst nicht, was er zu messen scheint."** Vier Typen: Prädikat aus dem falschen
Datenformat · Grundmenge ≠ Grundmenge des Werkzeugs · Abwesenheit als Beleg gegen den
Mechanismus, der sie erzeugt · Zeilennummern als Referenz.

**Der Kern: die Prüfwerkzeuge waren selbst nicht gegengeprüft.** Wörtlich der Befund aus
*„Gegenprüfung rettete ein Studien-Nein"* — dort fand die Werkzeugprüfung vier Fehler
**vor** der Meldung, hier kam sie danach.

> **Neue Hausregel: Jeder Nullbefund braucht eine Positivkontrolle — den Test einmal dort
> laufen lassen, wo er feuern MUSS.** Ein Lauf des Store-Prüfers gegen das Archiv hätte den
> Formatfehler in einer Sekunde gezeigt.

**Alles liegt** unter `Markt-Dashboard-Daten/qs-audit-2026-08-26/gegenpruefung/` — Synthese,
acht Urteile, 42 Skripte.

---

### ✅ Die App sammelt selbst (`b9512ab`, `a180e1d`) — und drei Funde, die schwerer wiegen

**Werkzeuge › Kursarchiv:** je Auflösung Werte, Alter der jüngsten Kerze, zuletzt
gesammelt, offene Werte — Begründung im Klartext, Knopf je Auflösung, Anhalten. **Gesammelt
wird durch `kerzenquelle.js`, nicht nachgebaut** — dieselbe Stelle wie das Abrufwerkzeug,
nachgewiesen mit einer isolierten Probe (eigener Datenordner, danach dieselben Dateien in
denselben Unterordnern mit demselben `stand.json`). 2.306 Zusicherungen grün.

### ⚠ Die drei toten Sperren von 20:00 — zwei davon gehören dem abgebenden PM

Der Master fand drei Sperren, deren Prozesse längst tot waren; der Wachhund hätte bis 23:26
„wird gerade geschrieben" gemeldet und über den Stand **gar nichts** gesagt. **Behoben in
`300e9a9`: die Sperre fragt jetzt zuerst die Prozessnummer und erst dann die Uhr.**

**Herkunft, vom PM aufgeklärt:**

| Sperre | Stand | Ursache |
|---|---|---|
| **15m** | 233/432 | Teil des PM-Erstlaufs von 18:21 — **beim Neustart gegen die CPU-Last gestorben** |
| **1m** | 1.834/2.732 | **vom PM absichtlich gestoppt** (21:10), weil er mitten in der Sitzung Teilkerzen schrieb — **die Sperre nicht aufgeräumt, das war sein Fehler** |
| 1d | – | **nicht vom PM.** Lief schon um 19:30 und blockierte der QS den ganzen Abend die drei Tagesarchiv-Protokolle, darunter `momentum` |

### 🔴 SPY fehlt in den Intraday-Archiven — der Anker des Regime-Tors

31 von 531 offenen Werten sind **die ETFs**: Die Werkzeugläufe gingen über `alle`, und die
ETF-Liste ist aus dem Universum herausgefiltert. **Die App holt sie ab jetzt immer mit; für
60m/1d muss jemand `node tools/yahoo-60m-holen.js etf` nachziehen.**

*Dieselbe Lücke von der anderen Seite hat den PM heute Nachmittag erwischt:* Er stellte
SPY-Zahlen aus `etf/` neben vier Zahlen aus dem Hauptbestand und gab sie als fünfte
Stichprobe aus. **Der `etf/`-Ordner ist in beide Richtungen eine Falle.**

### 🔴 Yahoo korrigiert FERTIGE Kerzen noch ~18 Minuten rückwirkend

Gemessen: 6 Runden über 3 Werte, **17,1 bis 18,0 Minuten — und nicht nur den Umsatz, auch
die Kurse.** Wer während der Sitzung misst oder sammelt, **rechnet auf vorläufigen Zahlen.**

**Das erklärt rückwirkend einen Befund der QS**, den wir für einen reinen Teilkerzen-Fall
hielten: dass die archivierte 19:30-Kerze von AAPL andere Werte trägt als die Quelle heute
(v 2.851.594 gegen 2.846.819). **Kein Einfrieren — die Nachkorrektur.**

### 🔴 Der Eimer-Fund (`cc2848f`): die Erklärung, die den ganzen Abend gefehlt hat

Die Regel aus Issue 85 warf die Quote-Kerze am Reihenende hinaus — **aber darunter lag der
gerade laufende Eimer mit glattem Gitterstempel.** Um 18:51 UTC endete XOM 15m auf 18:45,
mitten im Eimer 18:45–19:00; **zwei Abrufe drei Minuten auseinander schrieben verschiedene
Werte in dieselbe Kerze.** Betroffen war **jedes** Intraday-Intervall, **60m eingeschlossen**.

Gefragt wird jetzt, **wann der Eimer zu ist** — Stempel plus Dauer, gedeckelt auf den
Handelsschluss (sonst verwürfe es die kurze Schlusskerze 19:30–20:00 jeden Abend).

**Was das für den Bestand heißt:** *Im vorhandenen 60m-Archiv steht bei jeder Reihe, die
während einer Sitzung geholt wurde, eine unfertige letzte Stunde.* Sie wird beim nächsten
Lauf überschrieben — **wer heute darauf misst, sollte es wissen.**

*Einordnung des PM:* Die QS und er haben heute Abend **drei** Regeln durchprobiert, um die
flachen Kerzen zu trennen, und alle drei scheiterten an derselben Stelle — **sie haben am
Zeitstempel gemessen, statt zu fragen, ob der Eimer überhaupt zu ist.** Dass es jedes
Intervall betrifft, macht diesen Fund größer als #96.

### #96 bleibt angehalten — mit einer besseren Hypothese

**Nichts eingebaut, nichts gelöscht.** Der Master schlägt vor: der Platzhalter liegt bei
20:00 UTC, und das ist **das Sitzungsende** — ein Eimer, der genau dort beginnt, liegt
außerhalb der Sitzung. **Strukturell prüfbar statt statistisch**, und er würde FSECs und
PAAAs echte leere Stunden mitten im Tag nicht anfassen.

**Zählen muss es trotzdem jemand, bevor daraus eine Regel wird** — der Master schreibt es
selbst dazu. *Heute Abend sind drei plausible Ideen an der Wirklichkeit gescheitert, zwei
davon vom PM.*


---

### 🔴 Phantom-Dochte bestätigt — und sie führen über den Stop direkt ins Urteil

**Gemessen über das ganze 60m-Archiv** (Nullumsatz-Kerzen, deren Hoch oder Tief die Spanne
der **übrigen** Kerzen desselben Tages verlässt):

| | |
|---|---|
| geprüfte Nullumsatz-Kerzen mit Tagesvergleich | 69.826 |
| Docht außerhalb der Tagesspanne | **34.363 (49,2 %)** |
| betroffene Reihen | **2.857** von 2.885 |
| verschiedene Tage | **705** |

Die sieben Halbtage führen die Liste an (24.12.2024: 1.564 · 29.11.2024: 1.504 · …), aber
**es ist nicht auf sie beschränkt.**

**Der Kronzeuge reproduziert exakt:**

```
AAPL 2025-07-03
  13:30  Umsatz 11.914.855   H 213,86  T 211,81
  15:30  Umsatz  5.268.462   H 214,65  T 213,67
  17:00  Umsatz          0   H 214,14  T 201,25   <-- 5,0 % unter dem Tagestief
```

**Die ehrliche Einordnung der QS, die der Skeptiker nicht gegeben hatte:** Von den 34.363
überschreiten nur **3.171 die Marke von 1 %** und **90 die von 5 %**. Die große Mehrheit ist
trivial. Die Extremwerte gehören überwiegend **ZVZZT — dem NASDAQ-Testsymbol** (sechs der
zwölf größten) sowie illiquiden ETFs. **„34.363" ist die falsche Zahl zum Zitieren; die
tragende ist 3.171.**

**Warum es trotzdem zählt — der Weg von der Kerze ins Urteil ist kurz:**
`messmaschine.js:526` — `if (stop != null && p.tief <= stop)`. **Der Stop liest das Tief.**

**Drei der zwölf Strategien setzen einen Stop:** `kapitulation`, `rsi2seit-mcp`,
`t1-zwangsglattstellung`. Das sind ausgerechnet **die Strategie, deren Urteil heute gekippt
ist**, und **eine der drei unter der Eintrittskarte**. Ein Phantom-Tief löst dort einen
Stop aus, den es nie gab.

**Die entscheidende Frage ist offen — und sie ist messbar, nicht diskutierbar:** Hebt es
sich im Überschuss auf? Signal und Kontrolle benutzen dieselbe `fuehreAus`, und die
A7-Kontrolle ist „derselbe Wert, dieselbe Stunde" — es **könnte** beide Seiten gleich
treffen und sich herauskürzen. **Gemessen ist das nicht.**

**→ AUFTRAG an die Mess-Sitzung: die drei Stop-Strategien einmal mit ausgeschlossenen
Nullumsatz-Kerzen laufen lassen** und mit dem Bestand vergleichen. Das ist eine Messung,
keine Meinung. Vorregistrierung wie üblich: Was gilt als „bewegt sich"? Vorher festlegen.

*Dazu: Die Maschine hat **keinen Liquiditätsfilter** — `universum: „Archiv-Store, Auswahl
zum Messzeitpunkt"`. **ZVZZT und die illiquiden ETFs sind mitgemessen worden.***

### ✅ Block D vollständig — die 1d-Sperre war verwaist, nicht aktiv

`archiv1d` ist frei, und **der Wachhund hat es selbst gemeldet:** *„VERWAISTE SPERRE: ein
Nachladelauf hat sie vor 3,9 h gesetzt und nie aufgeräumt (Prozess 52300 läuft nicht mehr).
Der Stand oben gilt trotzdem."* PID 52300 existiert nicht mehr; das Archiv ist vollständig
(2.965/2.965, Rückstand 0). **Der Lauf, der die QS den ganzen Abend blockiert hat, war
schon tot.**

| | Urteil | |
|---|---|---|
| quartalsschub-betrag | nicht-entscheidbar → **stabil** | Placebo t 0,626 |
| monatswende-breit | nicht-entscheidbar → **stabil** | Placebo t 0,265 |
| **momentum** | *rechnet gerade* | **Strang A hängt daran** |

**Block D: 11 von 12 — zehn stabil, eines gekippt.**

**⚠ Vom PM behoben:** Die **Rollendatei des Analytikers kannte die neue Wachhund-Meldung
nicht** — dort stand nur die Sechs-Stunden-Frist. **Bei 3,9 h hätte er nach seiner eigenen
Anweisung weiter gewartet**, obwohl das Archiv benutzbar war. Ergänzt: er liest jetzt den
Satz „der Stand oben gilt trotzdem" und behandelt die Sperre dann als aufgehoben.
*Die Verbesserung am Wachhund ist von heute Abend; die Rolle wurde nachmittags geschrieben.
**Wer ein Werkzeug verbessert, muss die Rollen nachziehen, die es benutzen.***


---

### ✅ NACHRECHNUNG VOLLSTÄNDIG — zwölf von zwölf, elf stabil, eines gekippt

**Die Neumessung von heute früh hält** — auf einer **zwei Versionen neueren** Maschine
(1.4.0 statt 1.2.0) und mit frischen Handelstagen.

| Strategie | Archiv | Urteil | Placebo t | B10 |
|---|---|---|---|---|
| rsi2seit | 60m | **stabil** | −0,156 | 1,09 |
| kapitulation | 60m | **stabil** | −0,559 | – |
| monatsende-kauf | 60m | **stabil** | 0,071 | 0,61 |
| t2-umsatzschock | 60m | **stabil** | −0,138 | – |
| t1-zwangsglattstellung | 60m | **stabil** | 0,031 | – |
| t3-stundendrift | 60m | **stabil** | 0,385 | 1,00 |
| **rsi2seit-mcp** | 60m | **gekippt** → nicht bestätigt | 0,998 | 0,98 |
| winkelbestaetigt | 60m | **stabil** | 0,088 | 1,39 |
| winkelgrad | 60m | **stabil** | −0,015 | 1,14 |
| quartalsschub-betrag | 1d | **stabil** | 0,626 | 1,22 |
| monatswende-breit | 1d | **stabil** | 0,265 | 0,87 |
| **momentum** | 1d | **stabil** | 0,120 | **6,33** ⚠ |

**Kein einziges Urteil geht Richtung „bestätigt". Der Bestand bleibt bei null belegten
Kanten** — jetzt unabhängig nachgerechnet statt einmal gemessen.

### 🔴 Der B10-Wächter feuert zum ersten Mal — und zwar auf `momentum`

```
B10-Ueberlappung: {"faktorGroesster": 6.33}
[B10] Der Standardfehler waechst um Faktor 6.33 durch ueberlappende
      Halteperioden. Ein Urteil, das ohne diese Korrektur zustande kaeme,
      waere wertlos.
```

**Mehr als das Doppelte der Warnschwelle.** Über die anderen elf liegt der Faktor zwischen
0,61 und 1,39 — `momentum` ist ein Ausreißer um Größenordnungen, weil es **63 Handelstage
hält und jeden Tag neu eröffnet.**

**Auf dieser Tafel stand zu #98:** *„Vorbedingung für Strang A: Momentum ist genau der
Fall, für den dieser Wächter gebaut wurde — und er ist blind."* **Er ist es nicht mehr, und
beim allerersten Blick schreit er.** Der ganze Sinn von Strang A ist, `momentum` nicht
überlappend zu messen; der Wächter beziffert jetzt zum ersten Mal, **was die Überlappung
kostet.**

**⚠ Vorsicht bei der Deutung — Warnung der QS, und sie gehört ernst genommen:**
Der Faktor sagt **nicht**, dass eine nicht überlappende Messung sechsmal schärfer wäre. Die
Newey-West-Korrektur ist bereits angewandt, **das Urteil ist korrekt.** Er sagt, **wie viel
Auflösung die überlappende Anordnung kostet.**

> **→ VOR Strang A zu klären: Wie verhält sich der B10-Faktor (6,33) zum
> Eichungsverhältnis vom 25.08. (1,543)?** Die beiden messen **verschiedene Größen**. Wird
> das nicht vorher geklärt, **wird eine Verbesserung nachher dem falschen Effekt
> zugeschrieben** — und Strang A ist die größte offene Frage des Projekts.

*`momentum` selbst ist unauffällig stabil:* alle vier Varianten nicht entscheidbar,
Überschuss +1,1600 → +1,1599 Pp, t 1,03 → 1,03, Aussicht 52.578 → 52.579. **Ein Tag ändert
dort nichts — sie hat 4.976 Bestätigungstage.**

*Rollendatei des Analytikers: bereits vom PM behoben (siehe oben) — die QS hat es
unabhängig ein zweites Mal gemeldet.*


---

### ✅ #96 AUFGELÖST — **die „Platzhalterkerze" ist keine. Sie trägt den Tagesschluss.**

Befund und Zählskript: `studien/platzhalterkerze-2026-08-26/BEFUND.md` (`6d44354`).
**Nichts gelöscht, nichts eingebaut.**

**Die Gegenprobe, die es entscheidet** — für den 25.08. bei 395 Werten die 20:00-Kerze des
Stundenarchivs gegen den Schlusskurs aus dem **Tagesarchiv** gehalten, also zwei getrennte
Reihen:

| | Werte |
|---|---|
| **20:00-Kerze näher am Tagesschluss** | **309** (auf 0,000 % genau) |
| 19:30-Kerze näher | **0** |
| beide gleich weit | 86 |

**In keinem einzigen Fall ist die letzte reguläre Stunde näher.** Es ist die
**Schlussauktion** — Yahoo meldet dafür keinen Umsatz, deshalb sieht sie flach aus.

### Alle drei Regeln hätten Schaden angerichtet

| Regel | trifft | davon mit Umsatz |
|---|---|---|
| Umsatz 0 **und** völlig flach — **Vorgabe des PM** | 3.440 | 0 — aber **429 echte Leerstunden** mitten in der Sitzung (FSEC 50, PAAA 42, BILZ 33) |
| nach dem letzten Eimer des Tages — **Idee des Masters** | 23.325 | **1.171** — echte Schlussauktionen an Halbtagen |
| beides zusammen | 2.924 | 0 — aber **76,3 % tragen einen ANDEREN Kurs als die Vorkerze** |

**Die letzte Zeile war der Wendepunkt.** Ein Platzhalter würde den Schluss der Vorkerze
wiederholen — das tun nur **23,7 %**. 302 weichen um mehr als 0,1 % ab, die größte um
**2,93 %**. *Auch die Hypothese der QS ist damit widerlegt: „letzte Kerze der Reihe" trifft
auf 2,5 % zu, „Schlusskurs der Vorkerze" auf 21,6 %.*

**Zwei eigene Fehlversuche stehen im Befund**, weil sie zum Ergebnis gehören: Der
Sitzungsschluss lässt sich aus dem Gitter **nicht als Uhrzeit** ableiten — der letzte Eimer
des Tages ist *kürzer* als das Gitter (19:30–20:00). Die erste Rechnung ergab 19:30, die
zweite 20:30, und die zweite hätte **1.858 Kerzen mit Umsatz** getroffen. Erst die dritte
Fassung vergleicht nur Positionen.

### Was das für Wilhelms Entscheidung heißt

Sein Satz lautete: **„wir brauchen alle kerzen keine platzhalter"**. Nach dieser Messung
spricht er **fürs Behalten** — **es ist keine Platzhalterkerze, es ist der Tagesschluss.**
Die Entscheidung wird nicht zurückgenommen, sie wird auf den gemessenen Sachverhalt
angewandt: *echte Kerzen bleiben.*

**Was tatsächlich stört, ist die Form, nicht die Existenz:** Eine Auswertung, die Stunden
zählt oder nach Umsatz filtert, sieht eine **leere Stunde**, wo der **Tagesschluss** steht.
Wer sie mitzählt, bekommt **acht statt sieben Stunden je Handelstag.**

> **→ Das ist eine Frage der Auswertung, nicht der Ablage — und damit eine Frage an die
> Mess-Sitzung.** Nicht an eine Bausitzung, und nicht durch Löschen zu lösen.

**Offener Nebenbefund:** 2.870 der 2.924 Treffer liegen auf **einem** Tag (25.08.), je
Reihe genau einer; über die anderen 731 Handelstage verteilen sich nur 54. **Warum die
Kerze nur für den jeweils letzten abgeschlossenen Tag auftaucht und nicht kumuliert, ist
ungeklärt.**

### Die Kette, die hier endet

**Vier Regeln, vier Widerlegungen, an einem Abend:**
1. PM: „flach + Umsatz 0" — hätte 429 echte Leerstunden gelöscht
2. QS: „+ letzte Kerze der Reihe" — hätte 2 von 2.839 getroffen und 85 Teilkerzen erwischt
3. QS: „marktweite Gleichzeitigkeit" — hinreichend, aber nicht notwendig
4. Master: „nach dem letzten Eimer" — hätte 1.171 echte Schlussauktionen gelöscht

**Erst die fünfte Frage war die richtige, und sie war keine Regel, sondern eine Messung:**
*Wo liegt der offizielle Tagesschluss?* — beantwortet mit einer **zweiten, unabhängigen
Datenreihe** statt mit einem Muster in derselben.


---


### 🔴 NEU 27.08. ~01:30 — Hoch und Tief sind die unzuverlässigsten Felder der Quelle (QS + Werkzeuge, unabhängig)

**Zwei Sitzungen, zwei Methoden, dasselbe Ergebnis — der folgenreichste Befund der Nacht:**

- **Im Querschnitt (QS):** 34.363 Nullumsatz-Kerzen mit Docht außerhalb der Tagesspanne;
  tragend sind **3.171 mit ≥ 1 %** Abweichung (die Spitzen überwiegend ZVZZT — das
  NASDAQ-**Testsymbol** — und illiquide ETFs; **die Messmaschine hat keinen
  Liquiditätsfilter**, die sind mitgemessen). Die sieben US-Halbtage führen die Liste an.
- **In der Zeit (Werkzeuge):** der **Schlusskurs ist nach einem Tag stabil** (<1 %
  Änderungen), aber ~6 % der Kerzen ändern noch monatelang **Umsatz, Hoch oder Tief**.
  Nur der frische Rand ist wirklich wild (13,45 % der Schlusskurse am Vortag anders).

**Warum es zählt:** `messmaschine.js:526` — **der Stop liest das Tief.** Drei der zwölf
Strategien setzen einen Stop (`kapitulation`, `rsi2seit-mcp`, `t1-zwangsglattstellung`) —
darunter das gekippte Urteil und eine der drei unter der Eintrittskarte. Ein Phantom-Tief
löst dort einen Stop aus, den es nie gab. Betroffen außerdem: Kanalkanten, ATR, Ausbrüche, ORB.

**Reihenfolge (QS-Empfehlung, PM übernimmt): ERST MESSEN, DANN BAUEN.** Offen ist, ob sich
der Effekt im Überschuss aufhebt (Signal und Kontrolle laufen durch dieselbe `fuehreAus`).
Gegenprobe: Lauf der drei Stop-Strategien mit ausgeschlossenen Nullumsatz-Kerzen — **als
Auftrag an die Mess-Sitzung ausgeschrieben, siehe Aufträge.** Der Vorrang-Auftrag
„Phantom-Dochte beheben" wartet auf dieses Ergebnis: hebt es sich auf, wäre die Reparatur
Aufwand ohne Wirkung; hebt es sich nicht auf, ist sie dringend.

Ungeklärt und ausdrücklich nicht behauptet: warum die Quelle alte Kerzen noch anfasst, und
der Faktor-8-Sprung bei ~730 Handelstagen (liegt NICHT an der Fenstergrenze — die sitzt
bei 1.063 Kalendertagen). Rechenwege: `Markt-Dashboard-Daten/qs-audit-2026-08-26/`.

## Aufträge

### 🔴 27.08. ~00:48 — „61 echte Nullumsatz-Stunden" ist eine STICHPROBE. Archivweit ~66.619.

**Die Zahl 61 steht mehrfach auf dieser Tafel und der PM hat sie als Schutzmenge in einen
Auftrag geschrieben. Beides war falsch.** Die QS hat nachgezählt: die 61 stammen aus **fünf
Werten** (AAPL 18, KO 7, XOM 8, MSFT 18, SPY 10). **Archivweit sind es rund 66.619.**

*Ihr Satz dazu, und er gehört auswendig gelernt:* **„Wer gegen 61 abnimmt, nimmt gegen einen
Tippfehler ab."** Eine Löschregel, deren Schutzprobe gegen 61 grün wird, kann trotzdem
Zehntausende echter Kerzen vernichten.

**Vier Schutzklassen — was eine Reparatur NICHT anfassen darf** (QS, `phantom-abnahme.js`):

| | Was | Umfang |
|---|---|---|
| **S1** | die 20:00-Kerzen vom 25.08. — **sie tragen den offiziellen Schlusskurs** | 2.839 + 31 ETF |
| **S2** | Nullumsatz **mit** Spanne | ~66.619 |
| **S3** | flach, mitten in der Reihe (illiquide Papiere) | ~410 |
| **S4** | alles mit Umsatz > 0 | 13.350 flache Kerzen |

**Das Prüfraster liegt fertig und lauffähig** in `Markt-Dashboard-Daten/qs-audit-2026-08-26/`
(`PRUEFRASTER-phantom-dochte.md`, `werkzeuge/phantom-abnahme.js`, nur lesend) — **vor** der
Reparatur festgelegt, damit die Kriterien nicht nachträglich zur Lösung passend werden.
Tragend sind **A2** (keine geschützte Kerze weg) und **A6** (entfernte Zahl exakt gleich der
Basiszählung); A1 allein lässt sich durch Löschen von zu viel erfüllen.

**Ablauf, verbindlich:** `--basis` **nach** dem Nachladen und **vor** der Reparatur, dann
reparieren, dann `--pruefen`. Alle Zahlen von vor dem Nachtlauf sind als Abnahmebasis
unbrauchbar. **Und `zusammenfuehren()` löscht nie** — ein späterer Nachlade-Lauf bringt
entfernte Kerzen zurück; eine Reparatur, die das nicht mitbedenkt, ist eine Momentaufnahme.
*Fallstricke im Raster: der `etf/`-Unterordner (SPY/QQQ/IWM/VOO/TLT/GLD), das Raster ist
`:30` nicht `:00`, Tage ohne Vergleichsspanne sind nicht entscheidbar.*

### 🛑 27.08. ~01:45 — DIE REPARATUR IST ANGEHALTEN: sie wäre womöglich selbst der Datenfehler

**Die Frage ist nicht mehr „flach oder kappen". Sie lautet: gehören Randzeiten-Kerzen
überhaupt ins 60m-Archiv?** Das ist eine Wilhelm-Frage — aber jetzt eine mit Zahlen.

**Was `-06` gemessen hat, in drei Schritten:**

1. **Die 5m-vs-15m-Prüfung ist strukturell leer** — aus einem dritten Grund, den weder er
   noch der PM auf dem Schirm hatte: **die App-Archive führen überhaupt keine
   Randzeiten-Kerzen.** Positivkontrolle bestanden (358.675 stimmige Sitzungspaare, die
   Paarung würde Widersprüche sehen).
2. **Die Quelle direkt gefragt** (ein Lese-Abruf, AAPL 5d/5m mit `includePrePost`, kein
   Archiv berührt): Nachhandel 20–24 UTC → **234 Kerzen, davon 233 mit Volumen 0 — und 233
   mit echter Kursspanne** (z. B. 20.08. 20:20: h 311,90 / l 310,81 / vol 0). AAPL handelt
   nachbörslich real; Yahoo liefert die Kurse und schreibt Volumen 0.
   **Die Mechanik ist für den Nachhandel belegt.**
3. **Der Befund dahinter:** Die P-WEG-Kerzen sind mutmaßlich **Nachhandels-Kerzen** — 17/18
   Uhr an Halbtagen ist AH-Beginn, die 21,7 % exakten Tagesschlüsse sind die Schlussauktion,
   und echte AH-Spannen dürfen die Sitzungsspanne **legitim** verlassen.

**→ Dann wäre auch KAPPEN falsch: es würde echte Nachhandelskurse beschneiden.**

**PM-Gegenprüfung der tragenden Behauptung** (eigenes Skript, freie Archive, Stichprobe 120
Dateien je Archiv — **990.509 Kerzen**):

    archiv5m    552.071 Kerzen   Sitzung 552.071   vorboerslich 0   nachboerslich 0
    archiv15m   185.545 Kerzen   Sitzung 185.545   vorboerslich 0   nachboerslich 0
    archiv1m    252.893 Kerzen   Sitzung 252.893   vorboerslich 0   nachboerslich 0
    frueheste Uhrzeit 13:30, spaeteste 20:00 UTC — exakt die regulaere Sitzung

**Bestätigt: null Randzeiten-Kerzen in den App-Archiven.**

> **⚠ Einschränkung dieser PM-Zahl, selbst benannt:** Sie zählt mit einer **festen Schablone
> 13:30–20:00 UTC**. Das trägt hier nur, weil das Fenster günstig liegt — die App-Archive
> reichen vom 02.06. bis 26.08.2026, durchgehend Sommerzeit, **kein Halbtag darin**. Für die
> **60m-Seite wäre dieselbe Schablone falsch**: an Halbtagen ließe sie AH-Kerzen ab 17 Uhr als
> „in der Sitzung" durchgehen, im Winter verschöbe sie alles um eine Stunde. **`-06` zählt
> dort richtig** über `minutenSeitOeffnung`/`sitzungsMinuten` (`population-60m.js`, nur
> lesend, verweigert bei aktiver Sperre selbst). *Für 60m gilt seine Zahl, nicht meine.*

### 🏅 27.08. ~01:36 — der Prüfstand schlug die eigene Regel, und die QS drehte sie NICHT

**Die stärkste Einzelentscheidung dieser Nacht.** Die QS hat Lauf 1 vorregistriert (`vorregistrierung/lauf1-strukturpruefung.md`, festgelegt **01:40, Sperre stand noch, keine Zahl bekannt**) und die Regel anschließend gegen einen eigenen Prüfstand mit vier erfundenen Tagen laufen lassen, deren Urteil vorher feststand.

**Drei Urteile kamen wie geplant. Der vierte deckte eine echte Schwäche auf:** Der Kernanteil misst die Häufung **am Median**. Liegen 35 % der Reihen auf exakt demselben Docht und der Rest streut, fällt der Median *in den Rest*, der Kernanteil wird 2,5 %, und der Tag heißt „individuell" — **obwohl 35 % identischer Dochte über verschiedene Reihen genau die Quellfehler-Signatur wären, die gesucht wird.**

> **Ihre Reaktion, wörtlich:** *„Ich habe die Regel NICHT geändert. Sie nachträglich zu drehen,
> nachdem ich ihre Schwäche kenne, wäre dieselbe Bauform, die die Vorregistrierung verhindern
> soll, nur eine Ebene höher."*

Stattdessen läuft **eine zweite Zahl beschreibend mit, die nichts entscheidet**: der dichteste
Kern *irgendwo*, nicht nur am Median. Am Prüffall trennt sie sauber (35,0 % gegen 5,0 %), was
die Regel zusammenwirft. **Weicht sie am Tag des Laufs stark ab, wird das als Fund gemeldet —
und das Urteil nicht gedreht.** Der Nachtrag steht datiert **unter** der ursprünglichen Regel,
nicht an ihrer Stelle.

**Die vorregistrierte Regel:** Kernanteil = Anteil der Dochte innerhalb ±0,05 Pp um den
Tagesmedian (bindungsfrei; 0,05 Pp sind bei 100 $ fünf Cent, die Größenordnung einer
Geld-Brief-Spanne). **Kontrolle als Sperrklinke:** dieselbe Kennzahl für die Kerzen **mit**
Umsatz desselben Tages — *ohne sie misst ein hoher Kernanteil nur, dass an Halbtagen wenig
passiert.* Kein Abstand zur Kontrolle → Befund **null**, egal wie hoch der Absolutwert.
Je Tag: Kern > 50 % **und** ≥ 20 Pp über Kontrolle → strukturgleich; Kern < 20 % **oder**
< 5 Pp Abstand → individuell; sonst unentschieden; unter 30 Kerzen nicht gewertet.
Gesamt: **5 von 7** in eine Richtung entscheidet, sonst **GEMISCHT → an Wilhelm**; unter 4
wertbare Tage → nicht messbar. *Ausgewiesen wird die Tabelle je Tag mit n, Median, Kern %,
Kontrolle, Abstand und Urteil — nicht ein Urteilssatz.*

**Die Populationstrennung ist in den Lauf eingebaut**, nicht nachträglich erwähnt: Er weist
aus, wie viele P-WEG-Kerzen **vor, auf und nach** der letzten Umsatzkerze desselben Tages
liegen (Sitzungsende aus den Daten, nicht aus einem Kalender). Überwiegt „nach", sind sie
mutmaßlich echte Nachhandelskerzen — *und ein Docht außerhalb der Sitzungsspanne wäre dann
gar kein Fehler.*

### 🔬 27.08. ~01:34 — Mechanik-Beweis auf der Minutenstufe, härter als der AAPL-Fall

Die 15m-gegen-5m-Stufe lief auf null klärbare Fälle. **Eine Stufe feiner trägt:** 5m-Kerzen
mit Umsatz 0 gegen die fünf 1m-Kerzen darin, Überlappung 18.–26.08. **18 klärbare Fälle, in
allen 18 dasselbe Ergebnis:**

- **4 von 5** Minutenkerzen tragen Umsatz, zusammen **748.213 Stück**
- die 5m-Spanne ist in **18 von 18** Fällen **exakt deckungsgleich** mit der der Minutenkerzen
- alle 18 liegen **mitten in der Sitzung** (14:45–19:30 UTC), kein Nachhandel

**Deckungsgleiche Spanne bei vorhandenem Minutenumsatz heißt: die Quelle hat richtig
aggregiert und allein das Umsatzfeld verloren.** „Umsatz 0" ist eine Lücke in der Lieferung.

**Und dieselbe Grenze wie beim AAPL-Fall, von der QS erneut ausdrücklich gezogen:** gemessen
an Kerzen **innerhalb** des Bandes. Über P-WEG-Dochte **außerhalb** der Tagesspanne sagt das
nichts. *Die Flach-Begründung ist damit zweifach widerlegt — die Kappen-Begründung ist damit
nicht belegt.*

### ✅ 27.08. ~01:28 — AUFGESCHLÜSSELT: die Normaltage trugen die Quote, die Halbtage sind ein Münzwurf

**Volllauf über alle 2.916 Reihen (`markt-dashboard-1d`). Die Vermutung des PM trifft zu.**
Die sieben Halbtage wurden **aus den Daten abgeleitet**, nicht aus einer Liste (Tage, deren
letzter Umsatz-Eimer früher liegt als 19:30/20:30) — und es sind genau die sieben.

| | Fälle | im Tagesbalken | davon **exakt auf** dem Extrem | **außerhalb** |
|---|---|---|---|---|
| **an den sieben Halbtagen** | 4.114 | 1.973 (**48,0 %**) | 1.263 | **2.141 (52,0 %)** |
| an allen übrigen Tagen | 9.421 | 8.394 (**89,1 %**) | 6.842 | 1.027 (10,9 %) |
| zusammen | 13.535 | 10.367 (76,6 %) | 8.105 | 3.168 (23,4 %) |

**An Normaltagen tragen die Nullumsatz-Kerzen fast immer echte Extreme** — dort heißt
„Umsatz 0" wirklich „Volumen nicht geliefert". **An den Halbtagen, dem eigentlichen
Datenfund, liegt jeder zweite Docht außerhalb** und ist verdächtig.

**„Innerhalb" könnte Zufall sein — „exakt auf dem Extrem" ist keiner:** 8.105 von 10.367
(**78,2 %**) sitzen *genau auf* Tageshoch oder Tagestief, Toleranz `1e-9`, also
Gleitkommavergleich ohne fachliche Toleranz.

**Positivkontrolle bestanden — der Ursprungsfall fällt durch:**

    AAPL 2025-07-03 17:00   Kerze  H 214,14  T 201,25
                            Balken H 214,65  T 211,81   ->  AUSSERHALB

*Ohne diese Kontrolle wäre „76 % sind echt" ein Befund ohne Nachweis, dass die Prüfung
überhaupt etwas ablehnt.*

**Die 3.168 außerhalb sind der 23,4-%-Rest — eine Menge, nicht zwei.**

> **Der Selbstbefund von `1d`, und er ist der achte Fall derselben Form heute Nacht:**
> *„Meine 76,4 % waren richtig gerechnet, aber sie beantworteten die Frage über alle Tage,
> während der Fund die Halbtage meinte."* Eine richtige Zahl, die eine andere Frage
> beantwortet als die gestellte — diesmal in der Aggregation.

### ✅ 27.08. ~02:10 — die drei Anzeigefehler des Auditors sind zu (`1b852bc`), #105 bleibt offen

**#107** eine Klasse statt zwei — Regel für `table.tbl td.num/th.num`, `archivkarte.js`
umgestellt; **`zahl` bleibt als benannter Altbestand**, bis `#bestandTabelle` nachzieht (*„es
zu entfernen hieße, in eine Datei zu greifen, die mir nicht gehört"*) — die neun schiefen
Spalten sind so oder so gerade. **#106** Klartext an beiden Stellen, **Kopf und Fuß**, und die
Zusicherung **zählt beide** — genau daran ist #102 beim ersten Mal gescheitert. **#108**
deutsch, mit echtem Minuszeichen.

**#105 wurde FREIGELEGT, nicht entschieden.** Die feste `0.10` steht weiter da, geht aber
jetzt durch `huerdePp()`; der Kommentar nennt **beide Wege** und die vom Auditor gemessene
Drift (0,100 gegen 0,0665). **Umschalten ist eine Zeile.** *Eine Zusicherung verlangt die
Durchleitung, nicht die Entscheidung — Wilhelms Frage bleibt offen, statt still beantwortet zu
werden.*

> **🔄 Ein Fehler in der UMGEKEHRTEN Richtung, und er ist mindestens so tückisch:** Die
> Minuszeichen-Zusicherung suchte das Zeichen im **Quelltext** und wurde **rot, obwohl die
> Ausgabe stimmte** — die Datei schreibt es als Escape. **Eine Prüfung, die bei korrektem
> Verhalten fehlschlägt, misst die falsche Größe.** Sie erzeugt Arbeit statt sie zu ersparen,
> und der Bearbeiter „repariert" etwas Funktionierendes. *(Dazu: der Prüfausschnitt war auf
> 420 Zeichen geraten und schnitt mitten in die Funktion — **ein Syntaxfehler sieht aus wie
> ein Befund.**)*

### 🚨→⚠ 27.08. ~02:50 — JA, die Maschine liest sie — ABER die Kerze gibt es nur an zwei Tagen (siehe Richtigstellung 03:05 oben). Und die Zahl stand die ganze Zeit in den Protokollen.

**Antwort der Mess-Sitzung, gegen den Code UND gegen die abgelegten Protokolle geprüft:**

**`ladeUniversum` hat KEINEN Umsatzfilter** — die 20:00-Kerze wird geladen und behandelt wie
jede andere. **Und die Maschine kennzeichnet sie sogar präzise:** `sitzungsSchicht` markiert
die letzte Kerze des Tages als Schicht **»G«**, und die Protokolle zählen die Signale je
Schicht.

> **Die Quantifizierung lag also seit Wochen in den zwölf Protokollen — nur hat sie niemand
> als Quote-Exposition gelesen.**

| Strategie | Anteil Signale auf Grenzkerzen |
|---|---|
| **momentum, monatsende-kauf, monatswende-breit, quartalsschub-betrag, t1-zwangsglattstellung** | **100 %** |
| rsi2seit + rsi2seit-mcp | **36,4 %** |
| t3-familie | 20–24 % |
| winkelfamilie | 14–16 % |
| t2-familie | 12–13 % |
| kapitulation | 8–10 % |

*Die fünf 100-%-Fälle sind Tagesstrategien auf dem 60m-Archiv: jedes Signal feuert auf der
letzten Tageskerze — an normalen Tagen ist das die 20:00-Quote. („G" zählt auch die echten
Schlusskerzen verkürzter Sitzungen mit, eine Handvoll pro Jahr.)*

**WO ES WIRKT — drei Stellen, und die zweite ist die schwerste:**
- **(a) Signalbedingung** — Detektoren und Indikatoren (RSI, EMA, Ränge) rechnen über Schlüsse
  **einschließlich** der Quote-Schlüsse. **Bei den fünf 100-%-Strategien steht die gesamte
  Signalbasis darauf.**
- **(b) Rendite** — `fuehreAus` läuft den Kerzenpfad; fällt der Ausstieg auf eine Grenzkerze,
  **ist der gemessene Ausstiegskurs der Quote-Schnappschuss**, und der Stop liest deren Tief.
  *Einstiege liegen über die Folge-Eröffnungs-Konvention meist auf echten Kerzen.*
- **(c) Kontrolltopf** — A7 schichtet nach Position + G; **die G-Strata bestehen aus
  Quote-Kerzen-Renditen.**

**RÜCKWIRKEND — differenziert, und die Unterscheidung ist wichtig:** **Jedes einzelne Protokoll
wurde auf EINEM Archivstand gemessen und ist in sich konsistent.** Die Instabilität heißt
nicht „die Zahlen sind falsch", sondern: **eine Neumessung nach dem nächsten Sammellauf
verschiebt sich um Hürden-Größenordnung** — am stärksten bei den fünf 100-%-Strategien.

> **💡 UND DAS ERKLÄRT MÖGLICHERWEISE EIN ALTES RÄTSEL:** Das **0,0001-Pp-Urteilsgekippe von
> `rsi2seit-mcp`** zwischen früh und abends — **36 % seiner Signalbasis stand auf Kerzen, die
> ein Zwischenlauf neu gestempelt haben kann.** *Hypothese, ausdrücklich nicht behauptet;
> prüfbar, sobald die Mehrtages-Gegenprobe steht.*

**⏳ EINE EMPIRISCHE SCHRANKE KOMMT OHNEHIN IN STUNDEN:** Der B-Arm des Docht-Laufs entfernt
**alle** Nullumsatz-Kerzen — also auch die 20:00-Quotes. Der A/B-Vergleich misst damit die
**kombinierte** Empfindlichkeit (Dochte **+** Quote-Kerzen) der drei Stop-Strategien.
**⚠ Wichtig für die Deutung: er trennt die beiden Klassen NICHT.** Sagt B „hebt sich nicht
auf", braucht die Zuordnung einen kleinen Folgelauf (nur 20:00 raus). *Kein Umbau vorher.*

### 🚨🚨 27.08. ~02:45 — DIE DRITTE KATEGORIE: eine Kerze, die beim nächsten Hinsehen etwas anderes sagt

**Möglicherweise der schwerwiegendste Fund der Nacht — er trifft nicht das Archiv, sondern die
Messgröße selbst.** *(QS, `uebergabe/qs-audit-2026-08-27-0245-DATENFUND2.md`, 40 Reihen,
320 Kerzen.)*

**Erst die Entwarnung: die Abweichung reicht NICHT über die letzte Kerze hinaus.**

    13:30  40 geprueft  0 abweichend      18:30  40  0
    14:30  40           0                 19:30  40  0
    15:30  40           0                 20:00  40  40   <--
    16:30  40           0
    17:30  40           0

*Sieben von acht Positionen stimmen bei allen vierzig Reihen bis auf die letzte
Nachkommastelle. Die ursprüngliche Beobachtung „auch die 19:30-Kerze weicht ab" gilt auf dem
neuen Stand **nicht**: 0 von 40. Ob das Nachladen es behoben hat oder damals ein
Zwischenzustand gemessen wurde, ist mit den Daten **nicht unterscheidbar** — beides bleibt
stehen.*

**Und jetzt die Größenordnung, die es zu einem eigenen Befund macht:**

    Abweichung der 20:00-Kerze im Schluss, relativ
      p50   0,0978 %      p90   0,3906 %      max  1,0912 %
      ueber der Kostenhuerde von 0,10 %:  17 von 36

    betroffene Felder: schluss 36, hoch 37, tief 36, eroeffnung 15, UMSATZ 0

**Der Umsatz weicht nie ab, weil er in beiden Fassungen null ist. Die 20:00-Kerze ist keine
aggregierte Handelsstunde, sondern der Schluss-Quote der Quelle — eine Momentaufnahme.** Zwei
Abrufe zu verschiedenen Zeitpunkten liefern verschiedene Werte; **kein Archivfehler, sondern
die Natur der Sache.**

> **🔴 DIE MEDIANE ABWEICHUNG LIEGT BEI 0,0978 % — PRAKTISCH EXAKT AUF DER KOSTENHÜRDE VON
> 0,10 %, AN DER FAST JEDE STUDIE HIER HÄNGT.**
> *„Eine Größe, die zwischen zwei Abrufen stärker schwankt als die Hürde, die sie überwinden
> soll, taugt nicht als Messgröße."*

**⭐ DIE ENTSCHEIDENDE FRAGE, an `markt-dashboard-c4` mit Vorrang gegeben: LIEST DIE
MESSMASCHINE DIE 20:00-KERZE?** Nimmt sie irgendwo den Tagesschluss aus dem 60m-Archiv als
„letzte Kerze des Tages" — für Renditen, Stops, Kontrolltopf, Regime-Prüfung? **Wenn ja, steht
jede Messung auf einem Wert, der sich beim nächsten Sammellauf um die Größenordnung einer
Kostenhürde ändert — und es beträfe die zwölf Protokolle rückwirkend.** *Ein klares Nein wäre
die beste Nachricht der Nacht.* **Kein Umbau, bevor die Gegenprobe steht.**

> **🧭 WARUM DAS DURCH ALLE NETZE GEFALLEN IST — die Einordnung der QS, und sie fasst die
> ganze Nacht zusammen:** Die 20:00-Kerze wurde von **beiden** Stempel-Suchern als legitim
> eingestuft, **und beide hatten recht.** Sie ist kein verirrter Zeitstempel. Sie ist eine
> **dritte Kategorie, für die es bisher keinen Namen gab: eine Kerze an der richtigen Stelle,
> mit Umsatz null, deren Inhalt sich zwischen Abrufen ändert.**
>
> ***„Jedes Kriterium prüfte, ob die Kerze an der richtigen Stelle steht. Keines prüfte, ob sie
> beim nächsten Hinsehen noch dasselbe sagt."***

**Die tragende methodische Entscheidung:** Die QS hat für den Vergleich **einen eigenen Abruf
gebaut statt `kerzenquelle.js` zu benutzen** — *geprüft wird, ob das Archiv zur Quelle passt;
mit dem Code des Sammlers hätte sie dessen Fehler reproduziert und Übereinstimmung gesehen, wo
keine ist.* **Dieselbe Struktur wie der Nullpunkt der Messmaschine, wo Signal und Kontrolle aus
demselben Topf schöpften.**

**Gegenprobe genehmigt** auf zwei bis drei weiteren Tagen — **mit unterschiedlichem Charakter**
(Volltag, Halbtag, bewegter Tag), nicht drei ähnliche. *Gilt die Abweichung überall in
derselben Größenordnung, ist es eine Eigenschaft der Quelle; liegt sie an Halbtagen anders,
ist es eine zweite Geschichte.* **Bis dahin: ein Tag, 40 Reihen — plausibel, aber unbelegt.**

### 🔄 27.08. ~02:20 — DIE „149" WAREN NIE EIN BESTAND, SONDERN EINE RATE

**Der eigentliche Befund lag unter 26.067 Treffern begraben. Die Tagesverteilung:**

    152 Stempel, 151 Reihen, auf ZWEI Tagen:
      2026-08-26   77
      2026-08-24   75

**Die Stempel sind nicht historisch — sie sind von vorgestern und gestern. Rund 75 je
Sammellauf.** Passt zum Mechanismus: Der Nachlader schreibt die Dateien neu, der nächste Abruf
liefert für den abgeschlossenen Zeitraum saubere Kerzen **und überschreibt den Stempel**. Es
überleben nur ein bis zwei Läufe.

> **⚠ FÜR DIE DEUTUNG HEISST DAS:** *„149 Stempel im 60m-Archiv" liest sich wie ein Bestand,
> den man reparieren kann. Richtiger ist: **rund 75 je Lauf, die sich selbst ausräumen.** Die
> Zahl misst **nicht einen Schaden**, sondern **die Rate, mit der die Quelle Stempel liefert.***
> Reproduziert ist sie (152 heute) — aber sie war immer eine Momentaufnahme.

**🔗 PM-VERBINDUNG aus zwei QS-Messungen — eine Vermutung, keine dritte Messung:** Das
Selbstausräumen gilt **nur für Reihen, die noch beliefert werden.** Und dieselbe Sitzung hat
gemessen, dass **delistete Reihen aufhören, beliefert zu werden.**
**→ Bei lebenden Reihen ist der Stempel flüchtig. Bei toten Reihen ist er ewig.** Derselbe
Mechanismus, zwei entgegengesetzte Ausgänge — **und die Phantomtage im Tagesarchiv sind genau
die Teilmenge, die nie überschrieben wird.** *Der Bestandsschaden ist also nicht null, aber
beschränkt auf die aufgehörten Reihen.*

**✅ BELEGT 02:25 — und der nächste Lauf war gar nicht nötig.** Die beiden Populationen liegen
bereits nebeneinander vor: **ein natürliches Experiment, keine Warteschleife.**

    60m-Stempel, 151 betroffene Reihen
      davon lebend               151
      davon aufgehoert/delistet    0
      Alter: alle vom 24.08. und 26.08., KEINER aelter

    Tagesarchiv, Stempel auf aufgehoerten Reihen
      BSCO, IBDP, IBTE: Dezember 2024 — stehen seit 20 Monaten

> **Der Beleg liegt in der Null:** Dass unter **151 lebenden** Reihen **kein einziger alter
> Stempel** steht, zeigt das Überschreiben. **Wäre der Stempel dauerhaft, hätten sich über die
> Jahre Tausende angesammelt — es sind null.** Und auf den toten Reihen steht er zwanzig
> Monate. *Derselbe Mechanismus, zwei Populationen, entgegengesetzte Alter.*

**⭐ FORMULIERUNG FÜR WILHELM, von der QS um fünf entscheidende Wörter ergänzt:**

> *„Die 149 waren nie ein Schaden im Archiv, den man reparieren kann, sondern die Rate, mit
> der die Quelle Stempel liefert — rund 75 je Lauf, die sich bei lebenden Papieren selbst
> ausräumen. Was bleibt, sind die Stempel auf Papieren, die niemand mehr beliefert: im
> Tagesarchiv **21 Phantomtage über 9 Reihen, im 60m-Archiv keine.**"*

*Ihre Begründung für den Zusatz: „Sonst liest jemand in einem halben Jahr ‚was bleibt' und
sucht im 60m-Archiv nach einem Bestand, den ich dort ausdrücklich nicht gefunden habe."*

### 🎯 27.08. ~02:25 — der Verursacher: die laufende Intraday-Sammlung, nicht der Nachtlauf

    Verteilung der 152 Stempel ueber die Stunde (UTC)
      14:xx 29   15:xx 48   16:xx 9   17:xx 50   18:xx 16
    Alle 152 INNERHALB der US-Sitzung (13:30-20:00 UTC), 53 verschiedene Minutenwerte.

**Keine feste Uhrzeit, sondern der jeweilige Abrufzeitpunkt — mitten im Handelstag.** Der
nächtliche Nachlader lief um **22:20 UTC**, kann es also nicht gewesen sein. **Die Stempel
entstehen beim Abruf während der Sitzung, aus der laufenden Intraday-Sammlung der App.**

*Die QS benennt die Festigkeit selbst: „Die Uhrzeiten schließen den Nachtlauf aus, mehr nicht.
Welcher Abruf genau sie schreibt, steht im Sammelcode, und den anzusehen ist nicht meine
Rolle."*

**✅ BEANTWORTET UND BEHOBEN (`f9462e4`) — und die Lücke saß tiefer als vermutet.** Die Antwort
auf die PM-Frage lautete **nein**: Die Fenster-Sperre greift bei `range=`-Abrufen nicht. **Aber
die eigentliche Lücke saß im Raster:** `zusammenfuehren()` filterte **nur das Vorhandene, nicht
das frisch Geholte**, und `fertigeKerze()` lässt `15:12:00` durch, **weil die Sekunde 0 ist.**
*Genau so entstehen die Stempel.* **Das Raster steht jetzt hinter der Vereinigung und trifft
beide Seiten.**

**Gegen die 152 echten Stempel der QS geprüft — beide Richtungen:**

    gefangen  : 152 von 152
    falsch    :   0 von 25.915 legitimen Schlusskerzen

*Der eine Durchrutscher aus der Vorprüfung (NYT 15:00) hat die Regel dabei geschärft.*

**Dringlichkeit, ehrlich:** gering. Die Regel verhindert **keinen wachsenden Bestand** — sie
schließt die Tür für die Fälle, die **künftig** aufhören zu handeln.

**Zweiseitige Falsifikationsbedingung bleibt bestehen** (nach dem nächsten Sammellauf): Die 75
vom 24.08. müssen weg sein **und** die Phantomtage der toten Reihen unverändert dastehen.
*Trifft nur eine Hälfte zu, ist die Deutung falsch.*

### ✅ 27.08. ~02:20 — die stabile Bauform trägt: Raster aus der Sitzungslogik statt aus der Häufigkeit

**Auf PM-Anregung gebaut und gemessen** — und sie löst die Kippe vollständig auf:

    Minute 30                       -> Stundenraster der US-Sitzung
    Minute 0 NUR zu den Schlussstunden -> gekappte Schlusskerze
                                       20:00/21:00 UTC regulaer (16:00 ET Sommer/Winter)
                                       17:00/18:00 UTC an Halbtagen (13:00 ET)
    alles andere                    -> Ausreisser

**Ergebnis: 152 Treffer** — exakt die Zahl, die aus der Häufigkeitsfassung erst durch Abzug der
drei Sitzungsschlüsse herauszurechnen war. **Kein Fluten, keine Kippe, dieselbe Aussage.**

**Fragilität wird jetzt mitgeliefert** (erste PM-Bitte): Der Sucher gibt Schwelle, nächste
Uhrzeit unter der Schwelle und **Abstand zur Kippe** aus.

> **🎯 DER NYT-FALL — der lehrreichste Teil.** Die reine Minutenregel lieferte zuerst **151
> statt 152**. Der fehlende Fall: **NYT am 26.08. um 15:00:00** — Minute 0, nach naiver Regel
> also legitim, **aber 15:00 ist kein Sitzungsschluss.** Daher die Einschränkung „Minute 0 NUR
> zu den Schlussstunden". *Ohne diesen einen aufgeklärten Fall wäre die stabile Regel eine
> gewesen, die etwas verliert — **Stabilität mit Trefferverlust erkauft, ohne es zu merken.***

**Unerwarteter Nebeneffekt, der auf die Tafel gehört:** In der Häufigkeitsfassung hatte die
Probereihe **neun Grundtreffer** (lauter legitime Halbtagskerzen), die Kontrolle musste 9
gegen 10 unterscheiden. In der Logikfassung sind es **null**, die Kontrolle läuft **0 gegen 1**.
**Ein Werkzeug, das keine falschen Treffer produziert, macht auch seine eigene Kontrolle
schärfer.**

**PM-Entscheid (braucht Wilhelm nicht):** **Logikfassung kanonisch für alles Neue.** Die
Häufigkeitsfassung **bleibt** als Bezug für alles, was bisher auf „149" steht — *nicht heimlich
austauschen war richtig.* **Auflage: Wo künftig eine Trefferzahl steht, gehört die Fassung
dazu.**

### ❌ 27.08. ~02:15 — BEIDE DRINGLICHKEITEN DES PM WAREN FALSCH: veraltete Warnsignale weitergereicht

**Gemessen (`markt-dashboard-1d`), und alle drei Prämissen stimmen so nicht — jeweils zugunsten
der Lage.**

**1. Die QUELLE verstummt, nicht der Sammler — und das Feld ist NICHT leer:**

    1d  AVB: ohne -> "nur 27 Kerzen"   EQR: ohne -> "nur 15 Kerzen"
    1m  AVB: ohne -> "nur 0 Kerzen"    EQR: ohne -> "nur 0 Kerzen"
    1d  WBS/LBRDA/LBRDK: fertig, zuletzt 2026-08-26

Der Sammler hat sie geholt, zu wenig bekommen und **den Grund mitgeschrieben**. **Es gibt
nichts zu reparieren** — das Verstummen ist ein Befund über die Quelle, dokumentiert statt
still. **Punkt geschlossen.**

**2. Warnsignal 3 ist überholt — nichts ist verloren:**

| | Universum | fertig | ohne Daten | nie angefasst | verloren |
|---|---|---|---|---|---|
| **1m** | 3.232 | 2.964 | 268 | **0** | **nichts** |
| 15m | 3.232 | 233 | 4 | 2.996 | nichts |
| 5m | 3.232 | 491 | 9 | 2.732 | nichts |

**Die „1.834 von 2.732" sind Geschichte, alle 3.232 sind durch.** Und die Sieben-Tage-Frist
gilt **nur für 1m** — für 15m/5m sind es **60 Tage**. *Die Frist, die der PM im Nacken hatte,
existierte nicht.*

**3. SPY fehlt NICHT in allen Intraday-Archiven — ausgerechnet 60m ist vollständig:**

| | SPY | ETFs |
|---|---|---|
| **60m** | **da, 5.105 Kerzen** | **31 von 31** |
| 15m | da, 1.556 Kerzen | 1 von 31 |
| 1m / 5m | fehlt | 0 von 31 |
| **1d** | **fehlt** | **0 von 31** |

**Das Regime-Tor R-TREND läuft auf Stundenkerzen — und 60m ist komplett. Es ist nicht blind.**
Die echte Lücke ist **1d**.

> **🔁 DER PM-ANTEIL, und es ist die dritte Wiederholung derselben Form in einer Nacht:** Ich
> habe zwei Warnsignale **von dieser Tafel** genommen und als eilig weitergegeben, **ohne ihre
> Prämisse zu prüfen** — während ich in denselben Stunden andere aufgefordert habe, genau das
> zu tun. **Die Warnsignale altern, und ich habe sie behandelt, als täten sie das nicht.**

**Freigabe mit Auflage:** ETF-Lauf für `1d` (31 Werte, ~40 s) ja — **aber erst nach
Wachhund-Grün**, `archiv1d` wird bis ~03:32 geschrieben. **Und vorher prüfen, ob der Nachlader
die ETFs ohnehin mitzieht** — sonst holt der Lauf 31 Werte, die zehn Minuten später
überschrieben werden. **15m/5m: nicht heute Nacht**, zwei Monate Zeit.

**Todesursache der drei Abrufe, soweit die Spuren reichen:** Kein alphabetischer Abbruch (die
Werkzeuge arbeiten nach Umsatzrang, die 233/491 sind die Spitze der Liste). **Interner Abbruch
ausgeschlossen** — die Bremse „acht Fehler in Folge" **konnte gar nicht auslösen, ihr Zähler
wurde nie hochgezählt** *(eigener Fund beim Nachsehen, behoben)*. Netzstörung ausgeschlossen
(hätte massenhaft `ohne`-Einträge hinterlassen, es sind 4 bzw. 9). **Bleibt äußere
Beendigung**, dazu passen drei tote Prozessnummern in den Sperren. *„Mehr geben die Artefakte
nicht her; Protokolle schreiben die Werkzeuge nicht."* — **Die richtige Stelle zum Aufhören.**
**→ Folgeauftrag: eine Protokollzeile je Lauf** (Start, Ende, Zahl, Abbruchgrund), sonst ist
die nächste Todesursache genauso unauffindbar.

*Selbstmeldung, die eine sonst rätselhafte Zahl erklärt:* Der einzige ETF im 15m-Archiv ist
SPY, **und er steht dort wegen eines Erprobungslaufs, der ins echte Archiv statt in den
Testordner ging** (26.08. abends, gemeldet). Harmlos — dieselben Daten, die ein regulärer Lauf
schreibt — **aber ohne diese Erklärung hätte die 1 jemanden monatelang beschäftigt.**

### 📌 27.08. ~02:10 — drei Aufträge an `markt-dashboard-1d`, einer davon ~~zeitkritisch~~ (Prämissen widerlegt, siehe oben)

1. **`stand.ohne`-Abgleich** (10 Min, rein lesend): Verstummt **die Quelle**, oder lässt **der
   Sammler** das Symbol fallen? Steht für die Delisteten ein Grund → Sammler; steht nichts →
   Quelle. *Ein leeres Feld ist hier eine Antwort, kein Nullbefund.* **Schließt den bisher
   unzugeteilten Punkt.**
2. **⏳ Warnsignal 3 — die drei toten Abrufe vom 26.08.** (15m bei 233 von 432, 1m bei 1.834
   von 2.732). **Es eilt: das 1m-Fenster reicht sieben Tage zurück**, für ~900 nie geholte
   Werte läuft die Frist, und der 26.08. ist einen Tag her. **Erst messen, wie groß der
   Verlust ist, und WARUM sie gestorben sind** — ein Abruf, der bei 1.834 von 2.732 stirbt,
   hat einen Grund; ohne den ist jeder Neuversuch ein Glücksspiel. **Nicht blind nachsammeln.**
3. **Warnsignal 2 — SPY fehlt in allen Intraday-Archiven.** *Kein Schönheitsfehler:* **SPY ist
   der Anker des Regime-Tors R-TREND**, also der Größe, die entscheidet, welche Strategie
   überhaupt handeln darf. Die App holt seit 26.08. selbst, aber nur 1m/5m/15m — **60m und 1d
   fehlen.** Messen und melden, bevor gesammelt wird.

### ✅ 27.08. 02:05 — LAUF 4 UND 5 SIND DURCH: die 149 sind reproduziert, und das Werkzeug steht auf der Kippe

**LAUF 5 (neuer Sprung-Sucher auf 60m): KEINE Delisting-Phantomfamilie im Stundenarchiv.**
8 Treffer, **alle in EINER Reihe — `ZVZZT`, dem Testkürzel der Nasdaq**, kein handelbares
Papier. Und keiner der acht hat einen ruhigen Vorlauf (5 bis 93 %). Nach der Lesart des
Werkzeugs also **keine Stempel**.

**LAUF 4 (alter Stempel-Sucher gegen die bekannten 149): reproduziert.** Roh **26.067**
Treffer, alle über Merkmal M1 (Uhrzeit außerhalb des hergeleiteten Rasters). *Das sieht nach
einer Katastrophe aus und ist keine:*

    18:00:00   14.382 Kerzen   0,0971 %   <- Halbtagsschluss Winter (13:00 ET)
    17:00:00    5.778 Kerzen   0,0390 %   <- Halbtagsschluss Sommer
    20:00:00    5.755 Kerzen   0,0388 %   <- regulaerer Schluss-Stempel
    zusammen   25.915

    26.067 - 25.915 = 152 echte Ausreisser, auf 107 Uhrzeiten und 151 Reihen

**152 gegen den Bezugswert 149 — die Zahl ist bestätigt.**

> **🔪 DER EIGENTLICHE BEFUND IST DIE SCHWELLE.** Der Sucher hält eine Uhrzeit für legitim,
> wenn sie in über **0,1 %** der Kerzen vorkommt. Bei 14.815.281 Kerzen sind das **14.815**.
> **Die 18:00-Kerze kommt 14.382-mal vor — sie verfehlt die Schwelle um 433 Kerzen.** Wären ein
> paar Halbtage mehr im Archiv, wäre sie legitim und die Trefferzahl fiele von **26.067 auf
> 11.685**. *Das Werkzeug steht bei genau dieser Archivgröße auf der Kippe, und welche Seite es
> wählt, hängt an 433 von fast fünfzehn Millionen Kerzen.*

**Beide Sucher nebeneinander, wie angefordert: alt 152 echte Ausreißer, neu 0.** **Die Mengen
überschneiden sich NICHT** — es sind zwei verschiedene Familien, **und keiner der beiden
Sucher findet die des anderen.** *(Bestätigt damit den Satz von vorhin: beide Regeln werden
gebraucht und ersetzen einander nicht.)*

### 🔴 27.08. 02:05 — die Positivkontrolle des alten Suchers KONNTE NICHT DURCHFALLEN

**Die QS meldet einen Fehler in genau der Stelle, die sie selbst „Sperrklinke, nicht
Beipackzettel" genannt hat:**

    a) unveraendert            : 9 Treffer
    b) mit eingebautem Stempel : 9 Treffer   -> "SUCHER SCHLAEGT AN"

**Neun gegen neun, und die Sperrklinke meldete Erfolg.** Zwei Fehler übereinander: Die
Injektion **ersetzte** die letzte Kerze statt sie **anzuhängen** — war die selbst schon ein
Treffer, blieb die Zahl gleich. Und die Prüfung verglich **gegen null** statt gegen den
Ausgangswert. **Bei einer Probereihe mit Treffern konnte diese Kontrolle gar nicht mehr
durchfallen.**

> *Ihr eigener Kommentar: „Das ist genau die Bauform, die ich heute Nacht bei anderen dreimal
> benannt habe, in meinem eigenen Werkzeug, an der Stelle, die ich selbst Sperrklinke genannt
> habe."*

**Behoben:** wird angehängt statt ersetzt, verglichen wird gegen den Ausgangswert,
nachgeprüft (9 → 10). **Die Erkennungslogik ist unverändert — die 26.067 und die 152 stehen
unberührt.**

### 🛑 27.08. 02:01 — DER PHASENWECHSEL SIEHT AUS WIE DAS ENDE. Drei Läufe abgebrochen.

**Um 01:58:55 fiel eine Sperre, und sie wurde als das Ende des Nachladens gelesen. Es war der
Anfang der zweiten Hälfte.**

Der Nachlader arbeitet **zwei Archive nacheinander**. Um 01:58:46 endete der 60m-Teil und
meldete sich sauber ab — 2.916 Reihen, exakt die Zahl aus der Sperrdatei. **In derselben
Sekunde begann die Tagesarchiv-Phase.** Von außen sah es aus wie ein Abschluss: ein Prozess
weg, Rate im alten Archiv auf null, Sperrdatei verschwunden.

**PM-Messung 02:00:55:**

    PID 5852 LEBT (archiv-nachladen.js)
    archiv1d: 62 Dateien in den letzten ZWEI Minuten
    Phase begann 01:58:47, juengste 02:00:03
    Sperrdateien im Archivordner: KEINE

**❌ RICHTIGSTELLUNG 02:06 — DER GEFÄHRLICHE TEIL DIESER MELDUNG WAR FALSCH, UND ZWAR MEINER.**

Ich hatte geschrieben, es liege **gar keine Sperrdatei** und die Sperrprüfung schütze deshalb
nicht. **Beides ist falsch.** Nachgemessen um 02:06:06:

    E:/Markt-Dashboard-Archiv/archiv1d/_laeuft.json   EXISTIERT, gesetzt 01:58:47
    {"start":"2026-08-26T23:58:47.218Z","was":"1d aktualisieren, 2965 Werte","pid":5004}

**Der Nachlader hat beim Phasenwechsel korrekt UMGESPERRT** — die 60m-Sperre abgemeldet und in
derselben Sekunde die 1d-Sperre gesetzt. **Und sie hat gegriffen:** Die betroffenen Läufe sind
von selbst abgebrochen, **bevor sie eine einzige Datei gelesen haben**:

    ABBRUCH: .../archiv1d wird geschrieben (seit 2026-08-26T23:58:47.218Z, PID 5004)

> **Warum mein Befund falsch war — und es ist die Fehlerform dieser Nacht, diesmal bei mir zum
> zweiten Mal:** Ich habe nach Dateinamen mit `lock` und `sperre` gesucht. **Die Datei heißt
> `_laeuft.json`.** Mein Nulltreffer sagte nichts über das Archiv aus, sondern nur über meinen
> Filter. *Ich habe einer funktionierenden Prüfung vorgeworfen, das Falsche zu prüfen — mit
> einer Prüfung, die das Falsche prüfte.*

**⚠ DIESE RICHTIGSTELLUNG IST WICHTIG, NICHT KOSMETISCH:** Bliebe „die Sperrprüfung schützt
nicht" stehen, **würde die nächste Sitzung eine zweite Sicherung gegen ein Problem bauen, das
keines ist.** Die QS hat genau darauf bestanden, und zu Recht.

**Betroffen waren DREI von fünf Läufen, nicht zwei** — auch Lauf 1 liest `archiv1d`, er
braucht die Tagesschlüsse als Vergleichsgröße. Auch der PM hatte das falsch gezählt.
**Läufe 4 und 5 sind durch** (nur 60m, nachweislich fertig: 0 Dateien in 60 s, PID der
60m-Sperre tot). **Läufe 1–3 werden nachgeholt**, sobald 1d frei ist; der Treiber prüft jetzt
je Lauf nur noch die Archive, die er wirklich liest, und kann gezielt nachholen.

**Voraussichtliches Ende: gegen 03:32** (2.967 Dateien bei ~32/Min ab 01:58:47).

> **Zwei Deutungen, beide begründet, nur eine richtig:** Die Archiv-Wache las den
> Phasenwechsel als Wechsel und behielt ihre Sperre bei; die QS las ihn als Ende und startete.
> **Das Signal war identisch.** Der Unterschied lag darin, dass die eine Seite wusste, dass der
> Lauf zwei Phasen hat.

*Nebenbei, vor dem Start gefunden und deshalb billig:* Der Schiedsrichter-Test suchte die
60m-Datei je Symbol mit einem **neuen rekursiven Verzeichnisdurchlauf** — bei 2.965 Symbolen
über 2.916 Dateien rund **8,6 Millionen Dateizugriffe**. *„Der Lauf hätte Stunden gebraucht
statt Minuten, und ich hätte es für eine schwere Rechnung gehalten statt für einen Fehler."*
**Gefunden beim Lesen, nicht beim Warten.**

### 🔽 27.08. ~02:10 — KORREKTUR NACH UNTEN: der Phantom-Schwanz ist gedeckelt, nicht wachsend

**Die QS korrigiert ihre eigene Formulierung, bevor sie härter auf der Tafel steht als sie
darf** — und der PM seine daraus gebaute Dringlichkeit.

Gesagt war: *„einer je Sammellauf, nicht einer je Reihe."* **Das gilt nur für ein kurzes
Fenster nach dem letzten Handelstag.** Gemessen: Alle neun Reihen wurden zuletzt abgerufen,
sechs davon mit Archivstand 26.08. — **und keine hat seit ihrem letzten Phantomtag eine
weitere Kerze bekommen.** BSCO, IBDP und IBTE wurden am 26.08. angefasst und haben seit
Dezember 2024 nichts Neues.

**Das Muster:** Nach dem letzten echten Handel liefert die Quelle noch **wenige Tage** lang
Stempelkerzen — AVB fünf, EQR vier, WBS eine — **und verstummt dann ganz. Der Zähler friert
ein.**

> **⚠ DER GEFÄHRLICHE FALL TRITT NICHT EIN.** Ein delistetes Papier wird **nicht** zu einer
> dauerhaft flachen Reihe mit null Schwankung und null Rückschlag — **genau die Gestalt, die
> eine Momentum-Rangfolge nach oben spülen würde.** Es bleibt bei einem Schwanz von 1–5 Tagen.

**Was bleibt:** Jedes neue Delisting hinterlässt einen neuen Schwanz. **Die Gesamtzahl wächst
mit der Zahl der Delistings, der Beitrag je Papier ist gedeckelt.** Die Formulierung
„strukturell real und wachsend" braucht diese Einschränkung — sie ist an die
Berechnungen-Sitzung gegangen.

**Eine Falsifikationsbedingung, die von selbst reift:** AVB und EQR sind unbestätigt, ihr
Stand ist zwei Tage alt. *„Wenn der nächste Sammellauf sie anfasst und weiter nichts kommt,
ist das Muster für alle neun belegt — ich muss nichts dafür tun außer nachsehen."*

**Ausdrücklich unbekannt, und die Grenze ist richtig gezogen:** ob **die Quelle verstummt**
oder **der Sammler das Symbol fallen lässt**. Beobachtbar ist nur, dass die Datei angefasst
wurde und nichts dazukam. *Für die Risikobewertung ist das gleich, für eine Reparatur nicht —
dann müsste jemand den Sammler ansehen.* **Offen, niemandem zugeteilt.**

### ✅ 27.08. ~02:10 — STUFE F IST VOLLSTÄNDIG: Fokusreihenfolge gemessen, kein Befund

**Der letzte offene Punkt der Barrierefreiheit** (`markt-dashboard-1d`, `48e78f6`,
`tools/dialog-probe.js`). Gemessen mit **echten Tastenanschlägen** über alle fünf Dialoge, in
**beiden** Bewegungs-Einstellungen — Ergebnis identisch:

| Prüfung | |
|---|---|
| Fokus wandert beim Öffnen hinein | 5 von 5 |
| Tab am Ende fängt sich | 5 von 5 |
| Umschalt+Tab am Anfang ebenso | 5 von 5 |
| Escape schließt | 5 von 5 |
| **Fokus kehrt zum Auslöser zurück** | **5 von 5** |
| Name für die Vorlesehilfe | 5 von 5 |

*Die Mechanik in `app-shell.js` tut, was sie soll — das war bisher **gelesen**, jetzt ist es
**gemessen**. Punkt 5 bemerkt man ohne Tastatur nie.*

**Zur Bewegungs-Einstellung:** Der erste Lauf maß `prefers-reduced-motion: aus` — **den
Zustand, in dem Wilhelm die App nie sieht.** Die Sonde emuliert ihn jetzt und fährt beide.
*Sie sind gleich; das ist das Ergebnis, nicht die Annahme.*

**Hinweis, ausdrücklich kein Befund:** In vier von fünf Dialogen landet der Fokus zuerst auf
dem **Schließen-Kreuz**. Die Norm erlaubt das, aber es ist die schlechteste erlaubte Wahl —
*wer einen Dialog öffnet, will ihn benutzen.* **Nicht ungefragt repariert** (Auflage zu den
unbestätigten Planpunkten). **Fünf Zeilen, wenn Wilhelm es will** — reitet auf Frage 3 mit.

> **Drei Fehler beim Bau der Sonde, im Commit festgehalten, weil sie dieselbe Form haben wie
> das, was sie messen soll:** `sendInputEvent` will den Namen der Taste statt ihres Codes;
> der Sonde fehlte die Zeile, die die App überhaupt startet (**sie lief stumm ins Zeitlimit —
> ein Zeitlimit sieht aus wie ein Hänger, war aber ein fehlender Start**); und **Punkt 2 ihrer
> eigenen Beschreibung wurde beim ersten Wurf gar nicht geprüft.** *„Eine Sonde, die eine
> Frage nennt und nicht stellt, ist genau die Verkleidung, gegen die wir hier seit zwei
> Nächten kämpfen."*

### 🕵 27.08. 01:55 — der PM hätte fast einen Fehlalarm gemeldet, wegen seiner eigenen Prüfung

Eine schnelle Prüfung (`tasklist` gefiltert) meldete **„NACHLADER BEENDET"** — zwei Stunden zu
früh. **Falsch.** Die saubere Prüfung zeigt: PID 5852 und 7896 leben, **303 Dateien in zehn
Minuten**, keine Alarmdatei. Der Filter passte nicht zum Ausgabeformat und lieferte einen
Nulltreffer, der wie ein Befund aussah.

> **Dieselbe Familie wie alles andere heute Nacht, diesmal in einer Prozessprüfung:** *Was
> genau hat diese Prüfung geprüft?* — Auch eine Betriebsprüfung braucht eine
> Positivkontrolle. Die Archiv-Wache macht es richtig: sie zählt die **Schreibrate** statt nur
> zu fragen, ob eine PID existiert.

### ⏳ 27.08. ~02:00 — ENTSCHEIDUNG (2) IST ZEITKRITISCH: heute Kosmetik, ab nächster Woche Messhygiene

**Gemessen statt vermutet** (`markt-dashboard-c4`, Commit `9e79a3a`, Nachtrag 12). Die Antwort
auf „können solche Reihen gewählt UND gehalten werden" ist **zweigeteilt, und beide Hälften
zählen:**

| | |
|---|---|
| **Im Universum?** | **AVB** (Schwanz 5 Tage) und **EQR** (4 Tage) **ja**; die drei Anleihe-ETFs wirft der Wertpapierart-Filter. *LBRDA/LBRDK tragen keinen flachen Schwanz, sondern Sprung-Stempel — andere Fallklasse.* |
| **Heute realisiert?** | **NEIN.** Die letzte vollständige Phase-0-Periode läuft 02.03.–01.06.2026; der Schwanz (17.–21.08.) liegt **außerhalb jedes Halte- und Merkmalfensters**. In der letzten Periode ranken AVB/EQR mit −21,6 % / −16,0 % auf **Rang 1845 / 1751 von 2.213** bei einer Zehntel-Schwelle von +84,7 %. |
| **Strukturell?** | **JA.** Sobald das Archiv **~eine Handelswoche** wächst, entsteht die Periode 01.06. → Anfang September, **die die Phantomtage mit eingefrorener Nullrendite durchträgt.** Ein künftiger Fall mit **Übernahme-Run-up** — die typische Konstellation — würde gewählt **und** gehalten. |

**Der PM-Verdacht ist damit bestätigt: falsche Existenz, nicht falsche Rendite**, in der
Richtung, in der eine Überlebensverzerrung **entsteht** statt aufzufallen. *Nur der Zeitpunkt
ist noch nicht erreicht — und der Schwanz wächst mit jedem Sammellauf.*

> **⭐ FÜR WILHELMS ENTSCHEIDUNG (2), in einem Satz:** **Das Abmeldedatum-Setzen ist heute
> Kosmetik und ab nächster Woche Messhygiene** — es ist genau die strukturelle Reparatur des
> Mechanismus, den die Referenzmessung sonst beim nächsten Archivwachstum einsammelt.

### 📏 27.08. ~02:05 — AUS EINZELFÄLLEN WIRD EINE REGEL: „Reihe hat aufgehört"

**Die PM-Verbindung hält und ist allgemeiner als vermutet.** Gemessen (QS): **Im Tagesarchiv
tragen ALLE 6 Reihen, deren letzter Umsatz über zehn Tage zurückliegt, flache
Nullumsatz-Kerzen dahinter — 6 von 6, keine Ausnahme.**

**Und es ist ein Stempel JE SAMMELLAUF, nicht je Reihe.** AVB trägt **fünf aufeinanderfolgende
Phantomtage** (15.–21.08.), EQR vier, IBDP und IBTE je drei. *Die erste Zählung sagte „ein Tag
Lücke" — sie las die Vorkerze, und die war selbst schon ein Stempel.*

    archiv1d    9 Reihen,  21 Phantomtage
    archiv1m    2 Reihen,   2 Kerzen  (LBRDK, WBS)
    archiv5m    2 Reihen,   2 Kerzen  (AVB, EA)
    archiv15m   0
    archiv60m   steht aus (Sperre)

**Die richtige Fassung ist „Reihe hat aufgehört", nicht „Reihe ist delistet"** — vier der neun
sind ausgelaufene Anleihe-ETFs und eine SPAC-Einheit, die die SEC-Liste nicht als
Aktien-Delisting führt. *Die weitere Fassung ist die richtige.*

**Abgleich gegen `massive/verschwundene.json` (6.921 Einträge):**

    LBRDA/LBRDK  letzter Umsatz 17.07.  Delisting 21.08.  Stempel 21.08.
    AVB          letzter Umsatz 14.08.  Delisting 18.08.  Stempel 15.-21.08.
    EQR          letzter Umsatz 17.08.  Delisting 18.08.  Stempel 18.-21.08.
    WBS          letzter Umsatz 19.08.  Delisting 20.08.  Stempel 20.08.
    EA (5m)      letzter Umsatz 04.08.  Delisting 05.08.  Stempel 05.08.

**Der Sucher ist jetzt unabhängig belegt:** derselbe unveränderte Sucher gegen `-06`s 72
Rohabrufe → **26 Treffer, exakt dieselbe Zahl, die `-06` mit eigener Umsetzung fand.** *Zwei
Implementierungen, dieselben Daten, dieselbe Zahl* — belegt an einem unabhängig entstandenen
Fall, nicht nur an der eigenen Injektion.

> **⚠ DIESELBE FALLE, DIESELBE NACHT, ZUM ZWEITEN MAL.** Der erste Intraday-Lauf meldete
> **1.113 betroffene 1m-Reihen** — *„Ich hatte den Zähler schon vor mir."* Es sind exakt die
> offiziellen 20:00-Schlusskerzen, über die dieselbe Sitzung sich in derselben Nacht schon
> einmal korrigiert hatte. Der Filter prüfte nur, ob **hinter** der letzten Umsatzkerze noch
> etwas steht. Mit dem richtigen Kriterium („letzter Umsatz mindestens einen Tag älter als der
> Archivstand") bleiben von 1.113 genau **2** übrig.
> **Die QS schreibt es in den Vermerk, „weil die Falle offenbar nicht durch einmaliges
> Erkennen verschwindet".**

**→ OFFENE FRAGE, an `markt-dashboard-c4` gegeben:** *„Ein Papier, das gerade delistet wurde,
ist genau die Sorte, die ein Momentum-Filter aufgreift."* **Die Mechanik ist hier nicht
falsche Rendite, sondern falsche EXISTENZ:** Ein delistetes Papier ohne Abmeldedatum bleibt im
Universum, die Phantomtage lassen es handeln aussehen — wird es gewählt und 63 Tage gehalten,
liefert es **Rendite null** statt des echten Ausgangs (Übernahmepreis, Abwicklung,
Totalverlust). *Null ist in beide Richtungen falsch, und es ist die Richtung, in der eine
Überlebensverzerrung entsteht, nicht die, in der sie auffällt.*

**🔗 DAS HÄNGT AN WILHELMS ENTSCHEIDUNG (2):** Falls `c4` bestätigt, dass solche Reihen gewählt
und gehalten werden können, ist das Markieren der Delisting-Daten **keine Kosmetik mehr,
sondern genau die Reparatur dafür** — ein Papier mit Abmeldedatum kann nicht über sein Ende
hinaus gehalten werden.

### 🔴 27.08. ~01:55 — KORREKTUR NACH OBEN: SECHS Phantom-Handelstage, nicht zwei

**Die QS zieht ihre eigene Entwarnung von vor einer Viertelstunde ein.** Sie hatte die
übrigen sieben flachen Nullumsatz-Schlusskerzen als harmlos abgehakt (Lücke ein Tag, Sprung
0,00 %). **Die entscheidende Frage war nicht gestellt: war der Tag des Stempels überhaupt ein
Handelstag?** Gemessen an der Zahl der Reihen, die am selben Tag eine Kerze **mit Umsatz**
tragen:

    AVB    2026-08-21   2.957 Reihen handelten   -> PHANTOMTAG
    BTSGU  2026-08-25   2.954 Reihen handelten   -> PHANTOMTAG
    EQR    2026-08-21   2.957 Reihen handelten   -> PHANTOMTAG
    WBS    2026-08-20   2.957 Reihen handelten   -> PHANTOMTAG
    LBRDA  2026-08-21   2.957 Reihen handelten   -> PHANTOMTAG
    LBRDK  2026-08-21   2.957 Reihen handelten   -> PHANTOMTAG
    BSCO   2024-12-17       0   Reihe ausgelaufen  -> harmlos
    IBDP   2024-12-19       0   Reihe ausgelaufen  -> harmlos
    IBTE   2024-12-19       0   Reihe ausgelaufen  -> harmlos

**Bei AVB, BTSGU, EQR und WBS stimmt das Kursniveau, aber der Tag ist erfunden:** eine Rendite
von exakt 0 % an einem Tag, an dem das Papier tatsächlich gehandelt hat.

> **Der Satz, der bleibt:** *„Eine falsche Null ist schlimmer als eine Lücke, weil keine
> Vollständigkeitsprüfung sie findet — die Reihe sieht lückenlos aus."* Die QS dazu über sich
> selbst: *„Genau deshalb hatte ich sie als harmlos abgehakt: sie sahen unauffällig aus, und
> ich habe die Unauffälligkeit für Unbedenklichkeit genommen."*

**Gegenprobe, die die naheliegende Gegenerklärung ausschließt:** AVB steht im Tagesarchiv am
21.08. auf **65,90**, im 5m-Archiv auf **184,06** — selbes Papier, selbe Quelle, selber Tag.
Also ein fremder Einzelwert, **nicht** die ganze Reihe auf falschem Maßstab.

### 🔗 PM-Verbindung: FÜNF DER SECHS PHANTOMTAGE SIND DELISTING-TAGE

**Nur der PM konnte das sehen, weil die beiden Befunde aus verschiedenen Sitzungen stammen.**
Gegen `1d`s SEC-Prüfung von heute Nacht gehalten:

| | formale Abmeldung (`25-NSE`) | Phantomtag |
|---|---|---|
| AVB | 2026-08-17 | 2026-08-21 |
| EQR | 2026-08-17 | 2026-08-21 |
| WBS | 2026-08-20 | 2026-08-20 |
| LBRDA | 2026-08-20 | 2026-08-21 |
| LBRDK | 2026-08-20 | 2026-08-21 |

**Das passt exakt zum Mechanismus:** Die Quelle hängt am Ende einer Reihe eine Kerze mit dem
aktuellen Quote-Stempel an. Bei einer laufenden Aktie landet sie auf dem heutigen Tag und
fällt kaum auf. **Bei einer Reihe, die aufgehört hat zu existieren, landet sie unmittelbar
hinter dem letzten echten Handelstag — und sieht dort aus wie ein weiterer Handelstag.** Das
erklärt auch, warum das Kursniveau stimmt: der letzte Quote eines gerade abgemeldeten Papiers
liegt beim letzten echten Kurs.

**→ Zur Prüfung an die QS gegeben: trägt JEDE ausgelaufene Reihe eine flache Nullumsatz-Kerze
hinter ihrem letzten Umsatztag?** Wenn ja, ist es eine **Regel statt sechs Einzelfällen** —
und betrifft den ganzen `verschwundene.json`-Bestand, nicht fünf Ticker.

### ⚖ ZWEI REGELN, DIE EINANDER NICHT ERSETZEN — Satz der QS, hier festgehalten

| Regel | taugt für | taugt NICHT für |
|---|---|---|
| **Fenster-Regel** (`3fbc9b5`) | **Vorbeugung** bei neuen Abrufen — fängt auch die unauffälligen Fälle (Sprung 1–3 %) | **Prüfung bestehender Archive**: dort ist nicht überliefert, welches Fenster damals angefragt wurde, und LBRDAs Stempel lag **innerhalb jedes plausiblen Fensters** |
| **Sprung-Detektor** | **Prüfung** bestehender Archive | die unauffälligen Fälle — AVB, BTSGU, EQR, WBS haben **Sprung 0,00 %** und sind trotzdem Phantomtage |

**Beide werden gebraucht.** *Sonst baut jemand später die eine und hält die andere für
erledigt.* — Die Signatur wurde von **zwei Sitzungen unabhängig** umgesetzt und liefert
dasselbe Bild: `-06` 26 Treffer über 72 frische Abrufe, die QS über die Archive.

### ✅ 27.08. ~01:50 — Antwort auf die QS-Frage: JA, die Maschine liest 50 dieser Tage

**`markt-dashboard-c4` hat mit dem EIGENEN Filter nachgezählt** (`WP.istAktie` + F1 +
Mindesthistorie, rein lesend, **Positivkontrolle bestanden** — die Zählung fand LBRDA +16,6 %,
LBRDK +16,8 % und PECO +200,0 % exakt wieder), Commit `a2115cd`, Nachtrag 11:

| | |
|---|---|
| **F1 wirft die harten Split-Ränder als ganze Reihen** | ASTH +750 %, ARWR −88 % → komplett draußen |
| **PECO, LBRDA, LBRDK bleiben im Universum** | |
| **überlebende Nullumsatz-Kerzen mit \|Sprung\| > 10 %** | **50** über ~30 von 2.213 Reihen |
| davon vor 2005 / bis 2014 / **ab 2015** | 39 / 6 / **5** |
| Größenordnung | **2 ppm** bei ~22 Mio Kerzen, Schwerpunkt 80er/90er-Kleinwert-Illiquidität |

**Als benannte Einschränkung in die Vorregistrierung aufgenommen** (neben den 158.733
Nullumsatz-Tagen): *geführt, nicht behandelt* — eine Behandlung wäre eine neue Anordnung.

**Für Wilhelms Vorlage in einem Satz:** *Der Referenzlauf steht auf Tagen, von denen 50 in
22 Millionen fragwürdig sind, die zwei bestätigten Stempel eingeschlossen — benannt und
beziffert, Wirkung klein aber nicht null, Richtung offen.*

### 🔴 27.08. ~01:50 — F1 verwirft 36 GANZE REIHEN wegen einzelner kaputter Ränder

**Nebenbefund derselben Zählung, und er ist ein eigener, teilweise FRISCHER Datenfund:**
- **BYND +2920 % am 2026-07-20** — letzter Monat, im Zeitraum des laufenden Nachladers
- **CHRD +25733 % am 2020-11-20**

**Zwei Fragen, die zweite ist die schwerere** (an `markt-dashboard-06` gegeben, nach dem
Populationszähler):

1. **Produziert der Nachlade-Prozess solche Ränder?** BYND liegt im frisch geschriebenen
   Zeitraum. Wenn ja, ist es ein aktueller Fund, kein Altlastenthema — *an den Rohdaten zu
   prüfen, nicht an der Vermutung.*
2. **Ist es richtig, eine ganze Reihe wegen einer einzelnen Kerze zu verwerfen?** Dieselbe
   Familie wie die Löschregeln dieser Nacht, **nur eine Ebene höher: statt einer Kerze stirbt
   die ganze Aktie.** Und es trifft ausgerechnet die Überlebensverzerrung, an der ohnehin
   ≥ 12,7 % des Querschnitts fehlen — *wer wegen eines kaputten Randes eine echte Reihe
   auswirft, verkleinert das Universum in genau der Richtung, in der wir uns ohnehin
   täuschen.*

**Auftrag lautet zählen und melden, nicht entscheiden.** Der Filter ist Messmaschinerie; eine
Änderung dort verschiebt jedes künftige Ergebnis. **Ergebnis geht an Wilhelm.**

### 💊 Ergänzung zur Fenstersperre: der Sprung ist Detektor, die Fensterregel ist die Sperre

**`-06` hat unabhängig nachgezählt** — 26 Giftkerzen über alle 72 Rohantworten, **alle in
nopp-Abrufen (26/30), null in pp (0/36)**, alle mit Stempel `2026-08-26T20:00`. Bestätigt die
Korrektur der Ursachenzuordnung.

**Seine wichtigere Beobachtung:** Die Giftkerze steckt mutmaßlich **auch in den
Positivtag-Abrufen** — dort beträgt der Sprung nur **~1–3 %, unter jeder Schwelle**.
**Ein Schwellenwert findet die auffälligen Fälle, eine Strukturregel alle.** Deshalb ist die
Fenster-Regel aus `3fbc9b5` die tragfähige Sperre und der Sprung nur der Detektor.

*Präzisierung der latenten Gefahr: `studien/datenfund-dochte-2026-08-27/quellabruf-halbtage.js`
IST ein historischer `period1/period2`-Abrufer — er schreibt aber bewusst **nie** ins Archiv,
nur in den Studienordner, und sagt das im Skriptkopf. So muss es aussehen.*

### 🔍 27.08. 01:00–01:32 — der Auditor lief: 1 A, 3 B, 5 C, null Seiten- und Konsolenfehler

*Übergabe `auditor-2026-08-27-0120.md`, Befund `studien/auditor/2026-08-27/BEFUND.md`,
Commit `2d624d5`. Geprüfte Spanne `d964891..04c9be5` (117 Commits), Rotationsblock
`strategien`. App dreimal isoliert gestartet (frisches Profil, echte Installation nicht
angefasst), 5 Reiter und 17 Pillen in zwei Fenstergrößen, 43 Bildschirmfotos, 44
Flächenbesuche.*

**✅ ZUERST: WILHELMS AUFLAGE ZUR WAND TRÄGT — GEMESSEN, NICHT BEHAUPTET.** Der Auditor hat
mit eigener Probe das Produkt im Testprofil umgestellt: Rechnung 0,100 → **0,0665 Pp**, der
Satz wandert von „ab 0,183" auf „ab 0,077 Pp", `rsi2seit-mcp` rutscht hinter die Wand.
Einsortierung folgt der Einstellung.

**🔴 #105 (A) — ZWEI ZAHLEN UNTER DEMSELBEN NAMEN „KOSTENHÜRDE".** Das Messband auf
*Vermögen → Depot* rechnet mit **fest verdrahteter** `HUERDE_PP = 0.10` (`messband.js:27`),
während das Scoreboard seit `6c790c8` `DepotAPI.kostenHuerde()` benutzt. **In der
Voreinstellung ergeben beide zufällig 0,100 Pp — deshalb fällt es niemandem auf.** Mit
umgestelltem Produkt wandert die Wand, **das Messband nicht**: es zeigt weiter „Kostenhürde
0.10 Pp → netto −0.079 Pp", richtig wären **−0,045 Pp**. Die Kopfzeile derselben Seite weiß
zu dem Zeitpunkt schon „Gehandelt wird der Hebelschein".

> **Der Auditor warnt ausdrücklich vor der falschen Ablage:** *„#105 ist keine Regression von
> `messband.js` — die Datei liegt außerhalb der Änderungsmenge. Der Widerspruch ist trotzdem
> neu: er entsteht erst dadurch, dass das Scoreboard seit `6c790c8` live rechnet. Wer die
> Historie liest, könnte den Fund fälschlich als ‚war schon immer so' abtun. War es nicht."*

**→ ⭐ FRAGE AN WILHELM (Morgenliste):** Soll das Messband die **Live-Hürde des gehandelten
Produkts** zeigen (dann wie das Scoreboard) — oder ausdrücklich eine **feste Referenz auf den
Basiswert**? *Beides ist vertretbar; unvertretbar ist nur, dass zwei Zahlen unter demselben
Namen nebeneinanderstehen.* Der Auditor hat die Reparatur Richtung „live" formuliert, **weil
das Scoreboard es so tut — und nennt das selbst eine Annahme, keinen Entscheid.**

**Zugeteilt an `markt-dashboard-1d` (unstrittig, alle drei):** **#106** roher Schlüssel
`nicht-entscheidbar` auf zwei weiteren Flächen (`strategien.js:260`, `messband.js:143`/`:159`
→ `U.urteilText(...)`, liegt seit 26.08. in `app-shell.js:36`) — *dieselbe Protokollzahl wird
in der App **vierfach verschieden** geschrieben.* **#107** `class="num"` (Scoreboard, 14×) hat
im ganzen Repo **keine** CSS-Regel, `class="zahl"` gilt nur unter `#bestandTabelle` — neun
Zahlenspalten linksbündig unter rechtsbündigen Köpfen; *zwei Klassen für dieselbe Sache sind
die eigentliche Ursache.* **#108** englische Dezimalschreibweise (`messband.js:41`,
`archivkarte.js`) plus Bindestrich- statt Minuszeichen.

**Für den Analytiker, kein Oberflächenfund:** `quant.js`, **`gueteZufallsAnteil(null, n)` gibt
`0` statt `null` zurück, weil `isFinite(null) === true` ist.** Über die Oberfläche derzeit
nicht erreichbar — aber die Funktion ist neu und wird mehrfach aufgerufen.

**Nicht geschafft, ausdrücklich benannt:** dunkles Thema (nur hell geprüft),
Barrierefreiheit vollständig, netzabhängige Flächen (isoliertes Profil hat keinen Zugang —
leere Karten dort sind erwartet, kein Fund). **Nächster Rotationspunkt: `werkzeuge`.**

> **Eigene Richtigstellung des Auditors:** Seine erste Probe meldete für #80 „fehlt". *Das
> war sein Fehler, kein Fund — sie fragte nach `window.Q`, veröffentlicht ist `window.Quant`.*
> Mit Positivkontrolle nachgemessen, alles in Ordnung. **Ohne die Gegenprobe hätte er eine
> fehlende Funktion behauptet, die es längst gibt.**

### 🚨 27.08. ~01:45 — DIE SIGNATUR IST IN UNSEREN EIGENEN ARCHIVEN. Drei bestätigte Fälle.

**Aus Sorge wurde Befund** (QS, `uebergabe/qs-audit-2026-08-27-0330-STEMPEL-ZWEITER-ART.md`):

| Archiv | Fall | |
|---|---|---|
| **archiv5m** | **AVB** — 21 Handelstage sauber zwischen 64 und 70 $, Umsätze 300.000–1,1 Mio. Letzte Kerze 14.08. 20:00: `19:55 c 65,91 v 203.245` → `20:00 o=h=l=c 184,06 v 0` | **+179,3 % in fünf Minuten ohne einen einzigen Umsatz** |
| **archiv1d** | **LBRDA / LBRDK** — handeln normal bis 17.07.2026, dann fünf Wochen nichts, dann je eine flache Nullumsatz-Kerze am 21.08. | **+16,6 % / +16,8 % — ein Handelstag, den es nicht gab** |
| archiv1m | 0 von 2.964 Reihen | Positivkontrolle bestanden |
| archiv15m | 0 von 233 | Positivkontrolle bestanden |
| archiv60m | steht aus (Sperre) | |

**🔄 DIE QS ZIEHT DABEI IHRE EIGENE FRÜHERE AUSSAGE EIN**, und die Begründung ist die
wichtigste Zeile dieses Abschnitts: Sie hatte protokolliert, das Tagesarchiv sei frei von
Quote-Stempeln, **mit bestandener Positivkontrolle**. *„Für das geprüfte Merkmal war das
richtig. Als Aussage war es zu weit."*

`stempel-sucher.js` prüft **Uhrzeit außerhalb des Rasters, Sekunde ≠ 0, letzte Kerze auf dem
`stand`-Zeitstempel**. Der LBRDA-Fall trifft **keines** davon: der 21.08. ist ein regulärer
Handelstag, 13:30 legitimes Raster, `stand` liegt fünf Tage später.

> **Ihre Positivkontrolle hat belegt, dass der Sucher auf einen künstlichen Stempel
> anschlägt. Sie hat NICHT belegt, dass er alle Bauformen kennt — und genau das wurde daraus
> gelesen.** *Eine Positivkontrolle prüft die Empfindlichkeit, nicht die Vollständigkeit.*

**Der neue Sucher geht über den SPRUNG statt über die Uhrzeit:** Umsatz 0, flach, weit vom
Schluss der Vorkerze, **bei ruhigem Vorlauf** (`werkzeuge/kurssprung-stempel.js`,
archivparametrisch, Positivkontrolle als Sperrklinke).

**Ein Fehlweg unterwegs, damit er nicht wiederkommt:** Der erste Entwurf maß gegen das
**Tagesmittel** statt gegen die **Vorkerze** und warf **48 Treffer** aus — fast alle bei
Papieren unter drei Dollar (HAIN bei 0,53 $, CRMT bei 2,87 $), wo wenige Cent zweistellige
Prozentwerte ergeben. *Beinahe als Fund gemeldet.* Die Umstellung entfernt alle 48, ohne AVB
zu verlieren.

**→ FOLGE FÜR DIE REPARATUR: Der Unterscheider ist der SPRUNG bei ruhigem Vorlauf, nicht die
GESTALT der Kerze.** Eine Löschregel auf „flach und Umsatz 0" hätte heute Nacht schon einmal
1.106 echte Schlusskerzen getroffen.

### ⚠ 27.08. ~01:45 — 89 Nullumsatz-Kerzen mit Sprung >10 % in `archiv1d`: mutmaßlich SPLIT-Ränder

**Nebenbefund desselben Laufs, und er ist NICHT dasselbe wie ein Stempel.** 23 der 89 liegen
auf **glattem Verhältnis**: ASTH 4,50 → 0,45 ist genau **1:10**, PECO 7,23 → 21,69 genau
**3:1**, ARWR 39,00 → 19,50 genau **1:2**. Also mutmaßlich **nicht rückangepasste Reihen**,
kein Lieferfehler.

**Zeitlich überwiegend vor 2005; ab 2015 bleiben 8 Fälle.** Jeder einzelne ist für eine
Messung ein Tag mit **−90 % oder +200 % Rendite, den es nicht gab.**

> **Die QS sagt ausdrücklich dazu, und es gehört zitiert:** *„Ob die Messmaschine diese Tage
> überhaupt liest, habe ich NICHT geprüft. Das ist die nächste Frage, nicht dieser Befund —
> und ich sage es dazu, weil ‚8 Phantomtage im Tagesarchiv' sich nach mehr anhört, als bisher
> belegt ist."*

**→ Vom PM an `markt-dashboard-c4` gegeben, weil es Strang A direkt trifft:** `momentum` misst
auf `archiv1d` über die **volle Historie**, Rückblick 231 Handelstage, Haltedauer 63. Ein
solcher Tag kann eine Aktie ins stärkste Zehntel heben oder eine Periodenrendite dominieren.
**Aufgetragen: prüfen, ob Universumsfilter und Mindesthistorie diese Reihen überhaupt
zulassen** — fallen sie heraus, in einem Satz ausweisen; sind sie drin, als benannte
Einschränkung in die Vorregistrierung, nicht behandeln.

### 🚨 27.08. ~01:35 — DIE QUELLE VERGIFTET HISTORISCHE ABRUFE MIT DEM HEUTIGEN KURS

**Live reproduzierbar, mutmaßlich der Erzeugungsmechanismus hinter #96** (`-06`, 72 Abrufe
für die fünf erreichbaren Halbtage, nur lesend, Rohantworten gespeichert):

**Der frische Abruf des 13 Monate alten Tages 03.07.2025 enthält eine 20:00-UTC-Kerze mit
`o=h=l=c=313,45`, `v=0` — das ist der HEUTIGE AAPL-Kurs, +47 % gegen den echten Tagesstand.**
Yahoo hängt an historische `includePrePost`-Abrufe eine Abschlusskerze mit dem **aktuellen
Quote-Stempel**.

**✅ BEHOBEN 01:42 (`3fbc9b5`, PM gegen Git und Code geprüft) — und dabei kippte die
Ursachenzuordnung.**

**Der PM hatte vermutet, dass beide bestehenden Sperren versagen. Das stimmt** — `1d` hat es
gegen den Code geprüft: Die **Eimer-Regel** greift nicht (der Eimer ist längst geschlossen;
sie schützt gegen die *laufende* Kerze, nicht gegen eine alte mit frischem Inhalt), die
**Raster-Regel** greift nicht (20:00 liegt exakt darauf).

**⚠ ABER DIE URSACHE WAR FALSCH HERUM ZUGEORDNET — vom PM so weitergetragen.** Live gemessen,
derselbe Zeitraum, zwei Abrufe:

    OHNE prePost:  33 Kerzen, letzte 2026-08-26T20:00  c=313,45  v=0   <-- das Gift
    MIT  prePost:  81 Kerzen, letzte 2025-07-07T23:00  c=209,10  v=0   <-- kein Gift

**Nicht `includePrePost` erzeugt die Kerze — dort fehlt sie sogar. Betroffen ist gerade der
Pfad, den die App benutzt.** Und der Stempel ist **nicht** der 03.07.2025, sondern **heute
20:00**; die Kerze hängt einfach hinten dran.

**Das Merkmal, und es braucht keine Kursheuristik:** *Was außerhalb des angefragten Fensters
liegt, wurde nicht angefragt.* **Die echte Schlusskerze kann davon nicht getroffen werden —
sie liegt immer innerhalb.** *`1d` ist dem PM-Vorschlag (Kursabstand zu den Nachbarn)
ausdrücklich **nicht** gefolgt: „er wäre ein Schwellenwert mehr, und Schwellenwerte haben uns
heute Nacht siebenmal in die Irre geführt." Richtig.*

**An `-06`s Rohabruf geprüft, beide Richtungen:** Giftkerze verworfen **1**, echte Kerzen
verloren **0**, übrige 32 identisch. Sperre sitzt in `kurse.js/zerlege` und greift für
**jeden** Aufrufer mit Fenster.

**Die Pfadfrage ist beantwortet — nachgesehen statt vermutet:** Ins Archiv schreiben
`kerzenquelle.js` (App-Sammler *und* Abrufwerkzeug) und `tools/archiv-fremdreihe-nachladen.js`.
**Beide holen mit `range=`, nie mit `period1`/`period2`.** Die offene Stelle war die
**Anzeige** (`explorer.js:112` mit nutzergewähltem Zeitraum; `driftui.js`/`mittelfrist.js` mit
`von: 0` — Fenster reicht bis heute, harmlos).

> **🔻 LATENTE GEFAHR, von `1d` selbst benannt und deshalb hier:** *Die Sorge um den laufenden
> Nachlader ist entkräftet — **aber nicht, weil die Sperre greift, sondern weil er nie
> historisch anfragt.*** Das ist ein **schwächerer Schutz als eine Sperre: er hält nur,
> solange niemand einen Nachladelauf mit `period1`/`period2` baut.** Wer je einen historischen
> Nachlade-Pfad ergänzt, muss die Fenstersperre ausdrücklich mitziehen.
> *(`depot.js:2406–2413` dokumentiert, warum `range=` gewählt wurde: Yahoo lehnt
> `period1/period2` bei Intraday ab einer Grenze ab — 15m max. 41 Handelstage gegen 60 über
> `range`, 60m ganz abgelehnt. Der Umweg **kostete** Daten.)*

*Nebenbefund derselben Erhebung:* Das Ur-Beispiel **AAPL 03.07.2025 17:00 (Tief 201,25) kommt
heute identisch von der Quelle** — die Dochte sind **konsistente Lieferung**, kein damaliges
Einlese-Problem. *QS-Einschränkung: konsistent ≠ korrekt.*

### 🎯 27.08. ~01:38 — der Schiedsrichter-Test hat DREI Bezugsmengen, nicht zwei

**Die QS hat den zugesagten Test beim Bauen geschärft** — und dabei bemerkt, dass die
zugesagte Fassung die entscheidende Trennung verfehlt hätte:

| | Bezugsmenge | Was es bedeutet, wenn der Tagesbalken sie trifft |
|---|---|---|
| **A** | Kerzen **voll** in der Sitzung, **ohne** Randkerze | Der Balken ist die Aggregation derselben Sitzungslieferung → **als Schiedsrichter erledigt** |
| **B** | A **plus** die überlappende Randkerze | Es hängt daran, wie die Quelle die Randkerze beschneidet |
| **C** | **alle** Kerzen des Tages, Nachhandel eingeschlossen | Der Balken führt Nachhandel mit → ein Docht außerhalb wäre **wirklich** beweisbar falsch, **(c) stünde wieder** |

*Der Sitzungsbeginn kommt aus dem Zeitstempel des Tagesbalkens selbst, nicht aus einem
Kalender — an Halbtagen ist der Kalender genau die Größe, die man nicht voraussetzen darf.*

**Prüfstand: sechs erfundene Reihen mit vorab bekannter Einordnung, alle sechs richtig.**
Dabei ist die **Randkerzen-Annahme belegt worden, auf der mein ganzer Einwand ruhte**:
Normaltag **19:30 UTC**, Halbtag **16:30 UTC** — erkennbar daran, dass B das gesetzte Hoch
mitnimmt und A nicht. *Diese Zahl stand bis dahin nur in einem Kopf.*

**Und ein Fehler im eigenen ersten Entwurf, gefunden bevor er lief:** ein Tageszähler war per
Hoisting `undefined`, `undefined++` ergibt `NaN`, **die Normaltage-Summe wäre stumm als NaN
durchgelaufen.**

**Reihenfolge nach Sperrfall:** (1) Lauf 1 — blockiert die Reparatur · (2) Schiedsrichter-Test
— entscheidet, ob von (c) etwas übrig bleibt · (3) Lauf 2 · (4) Datenfund 2 beziffern ·
(5) Kontrolllauf `stempel-sucher.js` auf 60m gegen die bekannten 149.

### ❌ 27.08. ~01:32 — OPTION (c) IST ZURÜCKGEZOGEN. Der PM hatte einen Zirkelschluss gebaut.

**Der PM hatte Wilhelm eine dritte Option empfohlen:** *„Das Tagesarchiv ist ein unabhängiger
Schiedsrichter — ein Docht außerhalb der Tagesspanne kann nicht gehandelt worden sein, ist
also beweisbar falsch. Nur die anfassen."* **Die QS hat die Prämisse zerlegt, auf Nachfrage,
bevor Wilhelm sie zu sehen bekam. Sie ist falsch, auf vier Wegen.**

**🎯 Der schwerste Einwand: die überlappende Randkerze erklärt GENAU DIE ZAHLEN, die ich als
Beleg angeführt habe.**

Das US-60m-Raster liegt auf `:30`. Halbtagsschluss ist 13:00 ET → **die 12:30-Kerze spannt
12:30–13:30: halb Sitzung, halb Nachhandel.** Am Normaltag schließt der Markt 16:00 ET → die
15:30-Kerze spannt 15:30–16:30, dieselbe Überlappung.

- **Normaltag:** Sitzungsspanne über **6,5 Stunden** breit — 30 Minuten Nachhandel
  überschreiten sie **selten**.
- **Halbtag:** Spanne über **3,5 Stunden** bei dünnem Handel schmal — Nachhandel
  überschreitet sie **leicht**.

**Vorhergesagt: wenige außerhalb an Normaltagen, viele an Halbtagen.
Gemessen: 10,9 % gegen 52,0 %.**

> **Mein Beleg für Verfälschung ist exakt das, was ohne jede Verfälschung herauskommen
> müsste.** Solange dieser Weg nicht ausgeschlossen ist, trägt die Asymmetrie gar nichts.

**Die drei weiteren Wege:** (1) **Nachhandel** — der Tagesbalken deckt die reguläre Sitzung
ab, das 60m-Archiv führt Nachhandel; ein Kurs dort außerhalb der Sitzungsspanne ist legitim.
*Tagesbalken und 60m-Kerze messen nicht dasselbe Fenster — das ist kein Schiedsrichter,
sondern eine andere Frage.* (3) **Kursanpassung** — ist die Tagesreihe für Splits
rückangepasst und die 60m-Reihe nicht, liegen beide Bänder auf verschiedenen Maßstäben, und
zwar für ganze Reihen auf einmal. (4) **Tageszuordnung** — eine Randkerze am falschen
Kalendertag wird gegen den falschen Balken geprüft; *genau dieser Fehler steckte in der
Ergebnis-Drift.*

**🔁 UND DER SCHIEDSRICHTER IST VERMUTLICH KEINER — das steht in meinen eigenen Zahlen:**
**78,2 % der Fälle liegen EXAKT auf dem Extrem** (Toleranz `1e-9`). Das heißt, die
Tagesextreme sind in aller Regel identisch mit den Intraday-Extremen — **der Tagesbalken ist
mit hoher Wahrscheinlichkeit nichts anderes als die Aggregation derselben Intraday-Lieferung,
beschränkt auf die reguläre Sitzung.** Dann ist „außerhalb des Tagesbalkens" im Wesentlichen
ein Test auf **„außerhalb der regulären Sitzung"** — also **keine unabhängige Zweitmeinung,
sondern dieselbe Populationsfrage unter falscher Überschrift.**

**Billiger Test, hängt an Lauf 2:** Ist der Tageshöchstkurs gleich dem Maximum der
Sitzungs-Intraday-Höchstkurse? Kommt das für nahezu alle Tage heraus, ist der Schiedsrichter
keiner.

**WAS VON (c) ÜBRIG BLEIBT — und das ist nicht nichts:** P-WEG-Kerzen, die zeitlich **strikt
innerhalb** der regulären Sitzung liegen **und nicht die überlappende Randkerze** sind,
können kein Nachhandel sein. **Für die trägt das Argument.** Wie groß diese Menge ist, misst
Block (5) von Lauf 1. **→ (c) wird auf genau diese Teilmenge eingeengt, und die Zahl wird
abgewartet — die 2.141 bzw. 3.168 werden nicht mehr genannt.**

### 🧾 Nebenbefund, stützt „Lücke in der Lieferung" unabhängig von den 18 Einzelfällen

Häufigkeit von „Umsatz 0 **mit** Spanne" über die Intraday-Archive:

    1m : 2.357 von 5.994.385 Kerzen (0,0393 %), 1.237 Reihen betroffen
    5m :   169 von 2.269.386 Kerzen (0,0074 %),   120 Reihen
    15m:     0 von   358.865 Kerzen

**Wäre der 5m-Ausfall bloß die Folge von fünf zufälligen 1m-Ausfällen, müsste er bei 0,0393 %
Grundrate praktisch nie auftreten. Er tritt bei 0,0074 % auf.** Der Ausfall passiert also je
Lieferung **eigenständig auf jeder Auflösung** — und verschwindet auf 15m ganz. Dazu: die
leere Minute sitzt an jeder Position gleich häufig (6/4/5/2/1 über fünf Plätze) — **kein
Aggregationsrand**; 17 der 18 leeren Minutenkerzen tragen selbst eine Spanne; WBD zeigt
55.464 / 0 / 21.016 Stück in drei aufeinanderfolgenden Minuten.

### ⭐ 27.08. ~01:55 — die Anforderung der Aufschlüsselung (Vorgeschichte)

**`markt-dashboard-1d` hat gegen die Tagesbalken gemessen: 76,4 % der „reparierbaren" Dochte
sind ECHTE TAGESEXTREME.** Trägt das, ist die Reparatur nicht formfalsch, sondern
**gegenstandslos** — sie würde Tageshochs und -tiefs beschneiden, die im Tagesarchiv
unabhängig belegt sind.

**Der PM hat die Zahl NICHT übernommen, sondern aufgeschlüsselt angefordert**, weil sie in
zwei Richtungen gelesen werden kann:

**Der Fall, mit dem diese ganze Kette anfing, war AAPL am 03.07.2025 — ein HALBTAG — mit
Docht-Tief 201,25 gegen ein Tagestief von 211,81.** Das ist ersichtlich *kein* echtes
Tagesextrem. Läuft die Quote über alle Tage, **könnten die Normaltage sie tragen und die
sieben Halbtage die Ausreißer stellen** — und genau die sind der ursprüngliche Datenfund.
*„76,4 % sind echt" und „an den betroffenen Halbtagen sind es 5 %" wären zwei völlig
verschiedene Lagen.*

**Angefordert:** (1) Quote **getrennt** nach den sieben Halbtagen und allen übrigen Tagen;
(2) heißt „echtes Tagesextrem" exakte Gleichheit mit `archiv1d` oder eine Toleranz, und
welche; (3) wie viele reparierbare Dochte liegen **außerhalb** der Tagesspanne — ist das der
23,6-%-Rest oder eine andere Menge; (4) **Gegenprobe:** der AAPL-Fall vom 03.07.2025 muss bei
der Prüfung durchfallen, sonst stimmt die Zuordnung nicht.

*Bis zur Aufschlüsselung wird die Zahl nirgends als geklärt geführt — auch nicht in
Skript-Kopfzeilen, die später gern als Beleg zitiert werden.*

### 🔴 ZWEI POLITIKEN IN EINEM ARCHIVBESTAND — der Zwei-Quellen-Schaden in neuer Form

| Bestand | befüllt von | Randzeiten-Kerzen |
|---|---|---|
| `archiv60m`, `archiv1d` | Nachlader (`archiv-nachladen.js`) | **ja** (mutmaßlich) |
| `archiv5m/15m/1m` | App-Sammler (`kerzenquelle.js`) | **nein — gemessen, 0 von 990.509** |

*Dieselbe Struktur wie der Schaden vom 23.08., als Capital-CFD und Yahoo in einer Reihe
standen: nicht die Naht war das Problem, sondern dass zwei Politiken ohne Merkmal
nebeneinander lagen.*

**→ ⭐ FRAGE AN WILHELM (Morgenliste, hat Vorrang vor der Formfrage):**

- **(a) Randzeiten raus** — konsequent wie bei 5m/15m. Die Schlussauktions-Schlüsse stehen
  ohnehin in `archiv1d`. Dann ist die „Reparatur" ein Entfernen fremder Population, keine
  Wertkorrektur.
- **(b) Randzeiten rein** — dann sind viele „Phantom-Dochte" **echte AH-Kurse und die
  Reparatur wäre selbst der Datenfehler.** Verdächtig blieben nur echte Ausreißer (die
  −5,8-%-Klasse), und die trennt die QS-Strukturprüfung nach Sperrfall.

**Bis dahin wird nichts verändert.** `--wirklich` bleibt gesperrt, unabhängig von der Form.

### 🔬 27.08. ~01:30 — „Umsatz 0 ⇒ keine Spanne" ist WIDERLEGT. Die Formfrage bleibt offen.

**Der PM hatte seine Flach-Regel damit begründet, dass eine Nullumsatz-Kerze kein Geschäft
und darum keine Spanne haben könne. Das ist für diese Quelle nachweislich falsch.**

**Der Beleg (QS), AAPL mitten in der Sitzung, 11:30 ET:**

    15:15  Umsatz    801.245   H 298,16  T 297,23  S 297,37
    15:25  Umsatz  1.410.520   H 297,49  T 296,96  S 297,11
    15:30  Umsatz          0   H 297,28  T 296,85  S 297,17   <-- 43 Cent Spanne
    15:35  Umsatz    350.700   H 297,39  T 296,75  S 297,08

**Der Kurspfad läuft lückenlos durch die Nullumsatz-Kerze hindurch** (297,11 → 297,10 …
297,17 → 297,17). Es wurde gehandelt; **das kaputte Feld ist der Umsatz, nicht die Spanne.**
Kein Einzelfall: von 169 Nullumsatz-Kerzen mit Spanne im 5m-Archiv liegen **159 mitten in der
Sitzung** (14:00–19:30 UTC), wo Umsatz 0 unglaubwürdig ist.

**Unabhängig dieselbe Antwort aus einer älteren Messung** (`-06`, Vorbörsen-Karte #55 vom
23.08.): Yahoo liefert **jede** Vorbörsen-Kerze mit Volumen 0, bei real stattfindendem Handel.
**„Umsatz 0" heißt bei dieser Quelle „Volumen nicht geliefert", nicht „kein Geschäft".** Das
erklärt zwanglos auch die 21,7 % exakten Tagesschlüsse: die Schlussauktion *hat* Umsatz.

**⚠ ABER ES ENTSCHEIDET DIE FORMFRAGE NICHT — und die QS sagt es selbst:**

| Aussage | Stand |
|---|---|
| „Umsatz 0 ⇒ keine Spanne" | **widerlegt** |
| „also ist der Docht echt" | **folgt nicht** |
| Formentscheidung | **offen, entscheidet Lauf 1** |

**Der Beleg betrifft Spannen INNERHALB des Tagesbandes** — die AAPL-Kerze liegt vollständig
im Band und ist als Klasse S2 ohnehin geschützt. **P-WEG ist die andere Menge: Dochte, die
das Band VERLASSEN.** Für AAPL am 03.07.2025 hieße „echt" ein nachbörslicher Handel **5 %
unter dem Sitzungstief** bei einem Megacap. *„Unplausibel" ist keine Messung.*

**→ DIE TRENNFRAGE FÜR LAUF 1** (von `-06` gestellt, von der QS übernommen): **Tragen viele
Reihen am selben Halbtag strukturgleiche Docht-Muster oder individuelle?**
- **strukturgleich** (gleiches Verhältnis zum Schluss, gleiche Uhrzeit über hunderte Reihen)
  → **Quellfehler**, Docht unbelegt → **flach**
- **individuell** (jede Reihe ein eigenes Muster) → **echter Handel** → **kappen**
- **gemischt** → *keine einheitliche Form ist richtig* → **nichts reparieren, Frage an
  Wilhelm.* **Die QS hält diesen Ausgang ausdrücklich für möglich.**

**Eine geplante Gegenprobe fiel vorher aus, vom PM gemessen bevor Zeit hineinfloss:** Der
Abgleich der Halbtags-Dochte gegen 5m/15m ist mit den vorhandenen Daten **unmöglich** —

    archiv5m/15m   2026-06-02 bis 2026-08-26   (85 Tage)
    archiv1m       2026-08-18 bis 2026-08-26   ( 8 Tage)
    Halbtage im Bereich: KEINE

Die sieben Halbtage liegen zwischen 24.11.2023 und 24.12.2025, alle vor Beginn dieser
Archive. **Der Lauf hätte null Treffer aus Datenmangel gemeldet — und das sieht aus wie null
Treffer aus Sachgründen.**

*Die QS notiert dazu über ihr eigenes Werkzeug: `aggregation-test.js` fand auf der 15m/5m-Stufe
**null klärbare Fälle** (nur 8 Nullumsatz-Kerzen im 15m-Archiv, alle flach) — die Antwort kam
aus einer breiteren Zählung über alle drei freien Archive. **Der Test, der für die Frage
gebaut war, hat sie nicht beantwortet.***

### 🧪 27.08. ~01:20 — der Prüfstand steht, elf Fälle, und er fand zwei Fehler übereinander

**Die Abnahme ist jetzt belegt scharf statt angenommen scharf.** Die QS hat ein
Miniatur-Archiv gebaut und alle drei Formen dagegen durchgespielt — *das Reparaturskript
hatte nie end-to-end gelaufen und sollte über eine unumkehrbare Änderung entscheiden.*

    A) korrekte Reparaturen bestehen : loeschen · kappen · flach          3/3
    B) jede Verletzung wird gefunden : A1 · A2(S1) · A2(R) · A3(fremd)
                                       A3(Kernfeld) · A6(zu viel)         6/6
    C) Verweigerungen                : ohne --form · ohne Basis           2/2

*Enthalten sind die Halbtags-Kerze mit echtem Docht **und** Schlusskurs (an ihr trennen sich
kappen und flach messbar: Tief 99 gegen 101), ein Fall mit Schluss außerhalb der Tagesspanne,
die 20:00-Schlusskerze, S2, S3 und eine Reihe im `etf/`-Unterordner für die Rekursion.*

**🔍 ZWEI FEHLER LAGEN ÜBEREINANDER — und das ist der Lehrsatz:**

1. **Im Werkzeug, echt:** Eine korrekte Kappung fiel durch A3 mit „OHLC-Invariante verletzt",
   weil die Kerze **schon vor der Reparatur** in sich schief war. *Die Abnahme hätte eine
   richtige Reparatur abgelehnt, weil sie einen Altschaden dem Reparateur anlastete.*
2. **Im Prüfstand selbst:** Der simulierte Kappen-Schritt rechnete gegen die falsche
   Tagesspanne (101 statt 103). **Das Werkzeug hatte recht, der Testfall war falsch.**

**Hätte die QS nach dem ersten Befund aufgehört, wäre der zweite still im Abnahmelauf
mitgelaufen** — ein Testfall, der gegen die falsche Spanne rechnet, hätte künftig jede
Kappung falsch bewertet. *Ein Fehler, der einen zweiten verdeckt, ist die teuerste Sorte:
das Aufhören nach dem ersten fühlt sich wie Gründlichkeit an.*

**→ KLASSE R HAT JETZT ZWEI GRÜNDE:** Schluss/Eröffnung außerhalb der Tagesspanne **oder**
OHLC schon vorher verletzt. Beide unantastbar, beide ausgewiesen.

**Damit ist die Entscheidungsregel des PM nachgeschärft** (weiterhin vor der Messung):
Weil die in sich schiefen Kerzen jetzt in Klasse R fallen und **gar nicht** repariert werden,
ist der alte Zweig „gemischtes Bild → Kappung" gegenstandslos. Es bleibt:

1. **Schlüsse systematisch brauchbar → FLACH.** Begründung: Diese Kerzen haben **Umsatz 0** —
   es hat kein Geschäft stattgefunden, also gibt es keine Spanne. Hoch und Tief jenseits von
   Eröffnung und Schluss sind **unbelegt**, nicht nur zu weit.
2. **Schlüsse nicht verlässlich → gar keine Reparatur**, Frage an Wilhelm.
3. **KAPPUNG nur**, wenn ein Grund gefunden wird, warum die Spanne *innerhalb* des Tagesbands
   echt sein könnte, obwohl kein Umsatz stattfand.

**⚠ OFFENE FRAGE AN LAUF 1, die zwischen flach und kappen entscheidet:** *Gibt es eine
Mechanik, durch die eine Nullumsatz-Kerze ein **echtes** Hoch oder Tief trägt?* Etwa eine
Quelle, die aus feineren Kerzen aggregiert und dabei den Umsatz verliert — dann wäre die
Spanne echt und **der Umsatz das kaputte Feld**, und die Regel kippte zugunsten von Kappung.
Prüfbar daran, ob sich die Spannen in feineren Auflösungen mit Umsatz wiederfinden.
**„Nicht entscheidbar" ist ein zulässiger Ausgang** — dann wird nichts repariert.

*Zwei weitere Löcher hatte die QS davor beim erneuten Durchgehen des Ablaufs gefunden: der
Reihen-Hash prüfte nur, welche Kerzen da sind, nicht ihre Werte; und bei Kappen schlug er
systematisch falsch an, weil reparierte Kerzen im Nachher-Lauf in eine andere Klasse fallen.*

### 🕐 27.08. 01:15 — die Zeitstempel dieser Tafel liefen fast drei Stunden voraus

**Der PM hat die Uhrzeiten der heutigen Einträge geschätzt statt abgelesen** und lag dabei
zunehmend vorn — der Eintrag „~04:00" entstand um **01:15**. `markt-dashboard-c4` hat es
gemeldet, die Systemuhr hat es bestätigt. **Alle heutigen Überschriften sind korrigiert.**

**Warum das nicht kosmetisch ist:** Die Archivsperre endet gegen **03:40 echter Zeit**.
Einträge mit „03:35" und „04:00" lasen sich, als sei sie längst abgelaufen — jemand hätte
auf einem halb geschriebenen Archiv gemessen. **Uhrzeiten werden ab jetzt abgelesen, nicht
geschätzt.**

### 🔁 27.08. ~01:15 — VIERMAL DIESELBE STRUKTUR IN EINER NACHT (Aufstellung der QS)

**Viermal wäre eine Löschregel über echte Daten gegangen. Dreimal hat die QS es abgefangen —
beim vierten Mal war sie es, die die Regel vorgeschlagen hat.**

| # | wer | was fast gelöscht worden wäre |
|---|---|---|
| 1 | PM, Uhrzeit-Regel | die 20:00-Kerze |
| 2 | QS, „letzte Kerze der Reihe" | dieselbe |
| 3 | QS, Löschen der Phantom-Dochte | die Schlussauktion an Halbtagen |
| 4 | **QS, das Inhaltsmerkmal** | **1.106 + 1.248 Schlusskurse** |

**Ihr eigener Befund dazu, wörtlich:** *„Ich habe ein Merkmal aus einem Befund abgeleitet und
es empfohlen, ohne zu zählen, was es trifft — genau die Auflage, auf deren Einhaltung ich beim
Master bestanden habe. Zählen vor dem Löschen. Ich habe es verlangt und selbst nicht getan."*

**→ NEUE HAUSREGEL, von der QS selbst formuliert: EINE VORGABE DER QS IST EIN VORSCHLAG, KEIN
FREIBRIEF.** `markt-dashboard-1d` hat angehalten und rückgefragt, statt die Regel zu bauen.
Das ist die richtige Reaktion auf eine Vorgabe der Prüfinstanz — und sie steht hiermit fest.

**Geprüft statt gehofft — die Abnahme ist nicht betroffen:** P-WEG verlangt, dass Hoch oder
Tief die **Tagesspanne verlassen**. Eine 20:00-Schlusskerze ist flach auf dem Schlusskurs,
und der liegt per Definition **innerhalb** der Spanne. Sie fällt nicht unter P-WEG und wird
von keiner Form angetastet. *Die Halbtags-Schlusskerzen sind der Sonderfall und bewusst
drin — sie tragen echten Phantom-Docht **und** Schlusskurs. Genau darum geht Lauf 1.*

**Zwei eigene Löcher in der Abnahme repariert**, gefunden beim erneuten Durchgehen statt beim
Abhaken: der Reihen-Hash prüfte nur, *welche* Kerzen da sind, nicht ihre *Werte* (eine
geänderte Kerze wäre durchgerutscht); und bei Kappen hätte er systematisch falsch
angeschlagen, weil reparierte Kerzen im Nachher-Lauf in einer anderen Klasse landen.

**Nächster Schritt der QS: ein Prüfstand** — ein Miniatur-Archiv, gegen das alle drei Formen
einmal durchgespielt werden. *Das Reparaturskript hat noch nie end-to-end gelaufen und soll
über eine unumkehrbare Änderung entscheiden.*

### ✅ 27.08. ~01:15 — RICHTIGSTELLUNG: die „37,6 % Teilkerzen" sind zu 99,4 % der Schlusskurs

**Der PM hatte hier eine Eilmeldung stehen: 1.113 von 2.964 Minutenreihen enden mit einer
flachen Nullumsatz-Kerze, 37,6 %, dringend. Die Zählung stimmt. Die Deutung nicht.**

`markt-dashboard-1d` hat die Zeitstempel aufgeschlüsselt und den Bau angehalten, statt das
angeforderte Merkmal zu bauen. **Der PM hat unabhängig nachgezählt** (2.964 Reihen,
5.994.385 Kerzen, eigener Leser mit Lesekontrolle):

| | Zahl | |
|---|---|---|
| letzte Kerze flach + Umsatz 0 | 1.113 | 37,6 % der Reihen |
| **davon 20:00 UTC — Sitzungsschluss** | **1.106** | **99,4 %** |
| **alles andere — die echten Fälle** | **7** | **0,24 % aller Reihen** |

**Die sieben sind namentlich** BCO 17:43, DPST 17:10, LAD 17:22, MSA 17:52, SPXC 17:42,
TECS 17:25, VONV 18:06 — alle vom 26.08. **Und es sind genau die 7 aus Warnsignal 4.** Die
Zahl war längst bekannt; sie hat sich auf dem Weg mit den Schlusskursen vermischt.

**⚠ DAS ANGEFORDERTE MERKMAL WAR DIE SIGNATUR DER SCHLUSSKERZE.** „Letzte Kerze **und**
Umsatz 0 **und** Hoch = Tief = Eröffnung = Schluss" hätte in `archiv1m` **1.106** und in
`archiv60m` weitere **1.248** offizielle Schlusskurse getroffen — dieselbe Kerze, die an
395 bzw. 2.832 Werten gegen das Tagesarchiv als echt belegt ist (309-mal auf 0,000 % genau,
null Gegenfälle). **Es wäre die sechste Löschregel gewesen, die echte Daten trifft, und die
erste in zwei Archiven gleichzeitig.**

**Der Strukturbefund bleibt richtig:** Bei 1m ist die Sekunden-Regel blind, weil jede Minute
Gitter ist. **Die Abhilfe ist aber nicht der Inhalt, sondern der geschlossene Eimer** —
*Kerze ist fertig, wenn `Stempel + Dauer <= jetzt`, gedeckelt auf den Handelsschluss.* Greift
auf **jeder** Auflösung, auch ohne Raster, und lässt die Schlusskerze in Ruhe, weil deren
Eimer mit dem Handelsschluss endet. Steht seit `cc2848f`; die sieben stammen aus Läufen davor.

**Keine Löschregel nötig** — die sieben sind vom 26.08., das Fenster hält sieben Tage, der
nächste Lauf schreibt sie korrekt. **Damit ist die Gegenprobe eingebaut und als Pflicht
vergeben: nach dem nächsten Sammellauf muss die Zahl von 7 auf 0 stehen, ohne dass jemand
etwas gelöscht hat.** Geht sie nicht auf 0, ist die Eimer-Regel nicht das, wofür wir sie
halten.

*Der PM-Anteil, benannt: Die 37,6 % wurden übernommen und als eilig verteilt, ohne die
Uhrzeiten aufzuschlüsseln — eine einzige Zählung, die vor dem Weitergeben hätte passieren
müssen. Dieselbe Fehlerfamilie, vor der in derselben Nacht dreimal gewarnt wurde.*

### 📐 27.08. ~01:10 — die Reparaturform wird VOR der Messung festgelegt

**Löschen ist jetzt quantitativ vom Tisch.** `markt-dashboard-1d` hat gegen das Tagesarchiv
gemessen (486-Reihen-Stichprobe): **von 5.133 P-WEG-Treffern tragen 1.113 = 21,7 % EXAKT den
offiziellen Tagesschluss**, auf die letzte Stelle. An Halbtagen *ist* die 17/18-Uhr-Kerze die
Schlussauktion — dieselbe Rolle wie die gerettete 20:00-Kerze. Hochgerechnet **~7.500
offizielle Schlusskurse**, die eine Löschregel vernichtet hätte.

**Entscheidungsregel des PM, festgelegt bevor die QS-Messung läuft:**

1. **Schlüsse systematisch brauchbar** (großer Anteil exakter Treffer, kein Bereich mit
   systematischer Abweichung) → **FLACH**: `hoch := max(eröffnung, schluss)`,
   `tief := min(eröffnung, schluss)`. Der Docht ist der defekte Teil; flach entfernt ihn
   ganz, statt ihn auf eine Spanne zu begrenzen, die aus anderen Kerzen stammt.
2. **Gemischtes Bild** — brauchbare Schlüsse, aber auch Kerzen, deren Eröffnung oder Schluss
   **selbst** außerhalb der Tagesspanne liegt → **KAPPUNG an der Tagesspanne**. Flach würde
   dort einen falschen Kurs zum neuen Hoch machen.
3. **Uneindeutig** → **nichts ändern**, Frage an Wilhelm.

**🔗 NAHTPFLICHT, verbindlich:** Archiv-Reparatur (`reparatur.js`) und Einlese-Regel
(`kerzenquelle.js`) **müssen dieselbe Formel tragen**. Läuft das auseinander, behandelt der
nächste Nachlade-Lauf dieselben Kerzen anders als das reparierte Archiv — dann steht
zweierlei im Archiv **ohne Merkmal zum Auseinanderhalten**. Stimmt die Formel nicht überein,
bricht `--wirklich` ab.

### 🔴 27.08. ~01:00 — LÖSCHEN IST GESTOPPT: kaputtes und richtiges Feld in derselben Kerze

**Der PM zieht seine eigene Freigabe zurück.** Ich hatte `markt-dashboard-06` die
Reparaturform **Löschen** gedeckt, gestützt auf die Tafel-Klassifikation. **Die QS hat sie
beim Gegenlesen aufgehoben**, an `AAPL 2025-07-03` (Halbtag):

| | | |
|---|---|---|
| **Tagesschluss aus `archiv1d`** | **213,55** | die Wahrheit |
| letzte 60m-Kerze **mit** Umsatz (15:30) | 214,10 | Abstand **0,55** |
| **Phantom-Kerze** (17:00) | **213,25** | Abstand **0,30** |

**Die Phantom-Kerze liegt NÄHER am echten Tagesschluss als die letzte reguläre.** Ihr
**Tief** ist zweifelsfrei falsch (201,25 gegen ein Tagestief von 211,81) — **ihr Schluss
offenbar nicht.** *Kaputtes Feld und richtiges Feld in derselben Kerze. Wer sie löscht,
wirft beides weg.*

**Das ist zum zweiten Mal in einer Nacht dieselbe Struktur wie #96**, wo die 20:00-Kerze wie
Müll aussah und in 99,4 % der Fälle exakt den offiziellen Schluss trug. **Der PM kannte #96
und hat die Struktur trotzdem übersehen.**

**KAPPEN STATT LÖSCHEN ist der Kandidat** — Hoch und Tief begrenzen, Schluss und Umsatz
unangetastet. `-06` hatte das von sich aus erwogen und wegen des zu engen QS-Kriteriums A3
verworfen; **die QS hat A3 selbst korrigiert, statt es zu verteidigen.** `reparatur.js` wird
um den Kapp-Weg erweitert, sodass **die Messung entscheidet, nicht die Vorab-Meinung**.

**`--wirklich` ist gesperrt**, bis der QS-Lauf „Phantom-Schluss gegen Tagesschluss über alle
sieben Halbtage" vorliegt (ab 03:45, Punkt 1 ihrer Reihenfolge). **Ein Beispiel ist kein
Befund — in beide Richtungen:** auch „die Schlüsse sind gut" braucht die Verteilung über
alle Reihen, nicht nur AAPL.

### 🟢 27.08. ~01:05 — Strang A: keine Schlusskurs-Defekte auf `archiv1d` (mit Gegenprobe)

**Die Frage, die Strang A entscheidet, ist beantwortet — gemessen, nicht gefolgert.**

**Positivkontrolle zuerst** (der PM hatte sie zur Bedingung gemacht):

| Probe | Ergebnis | |
|---|---|---|
| unveränderte AAPL-Reihe (10.077 Kerzen) | 0 Treffer | richtig, kein Fehlalarm |
| dieselbe Reihe **mit eingebautem** Quote-Stempel | **1 Treffer** | Sucher schlägt an |
| Stempel mit Sekunde 43 **mitten** in der Reihe | **1 Treffer** | Sucher schlägt an |

**Erst danach der Lauf:** 2.965 Reihen, **15.509.301 Tageskerzen, 0 Treffer, 0 betroffene
Reihen.**

**Der Strukturgrund ist der eigentliche Beleg:** Das Tagesarchiv benutzt über 15,5 Mio
Kerzen **genau zwei** Zeitstempel — `13:30:00` (63,6 %) und `14:30:00` (36,4 %), Sitzungs-
beginn in EDT und EST, **ohne eine einzige Ausnahme**. Ein Quote-Stempel trüge die Abrufzeit
und fiele sofort auf. Er ist nicht da.

**Dazu:** der 25.08. ist auf 1d sauber (1 Nullumsatz-Reihe von 2.955; am 21.08. sind es 4),
und **keine der drei Tagesstrategien setzt einen Stop** — `momentum` liest überhaupt kein
Hoch/Tief. Der Schadensweg ist `messmaschine.js:526`, `if (stop != null && p.tief <= stop)`
— **ohne Stop kein Schaden.**

**→ Beide Datenfunde dieser Nacht binden Strang A sachlich nicht.** *Entscheidung über
Sperre 1 bleibt Wilhelms; sie steht auf der Morgenliste.* **Älter und unverändert bleibt die
Überlebenslücke.**

**Noch offen, von der QS selbst benannt und NICHT beantwortet:** 158.733 Nullumsatz-Tage im
Tagesarchiv (1,02 %), Schwerpunkt in den 1990ern (verkürzte Sitzungen illiquider Werte). *„Eine
flache Tageskerze liefert Rendite null und schiebt die Bewegung auf den Folgetag."* Für
Strang A über die volle Historie keine Kleinigkeit — gehört als benannte Einschränkung in §5
oder vorher gemessen.

### 🔴 27.08. ~00:55 — Warnsignal 7 ist WIDERLEGT: die „falschen Delistings" sind echt

**`markt-dashboard-1d`, Befund `fb237d5`, `studien/verschwundene-pruefung-2026-08-27/`.
Nichts geändert, nichts gelöscht — geprüft und zurückgemeldet.**

**Es sind fünf, nicht drei** (dazu LBRDA und LBRDK), und die SEC entscheidet es eindeutig:

| | `25-NSE` (formale Abmeldung) | 8-K Item 2.01 (Übernahme vollzogen) | `massive` sagt |
|---|---|---|---|
| AVB | 2026-08-17 | 2026-08-17 | 2026-08-18 |
| EQR | 2026-08-17 | 2026-08-17 | 2026-08-18 |
| WBS | 2026-08-20 | 2026-08-20 | 2026-08-20 |
| LBRDA/LBRDK | 2026-08-20 | 2026-08-21 | 2026-08-21 |

**`massive` meldet auf einen Tag genau. Die Liste war die ganze Zeit richtig.**

**⚠ WAS EINE „REPARATUR" ANGERICHTET HÄTTE:** Fünf tote Ticker wären zurück ins lebende
Universum gewandert. Ein delisteter Wert fällt bei jeder künftigen Messung **still aus dem
Zähler und steht weiter im Nenner** — die Überlebensverzerrung wäre nicht kleiner geworden,
**sondern unsichtbar.** Der Auftrag hätte den Schaden erzeugt, den er beheben sollte.

**Die Positivkontrolle hat das Ergebnis gerettet — sie gehört in die Sammlung dieser Nacht:**
**KO hat ebenfalls ein `25-NSE`** (08.03.2024) **und handelt täglich mit 17 Mio Umsatz.**
Eine Firma meldet einzelne Wertpapiere ab, während die Stammaktie weiterläuft. Ohne diesen
Kontrollwert hätte „25-NSE gefunden" als Beleg gegolten und die Regel wäre allgemein falsch
gewesen. **Erst die Kombination trennt: 25-NSE UND Item 2.01 am selben Tag UND
zusammenbrechender Umsatz.**

**Nebenbefund, schließt eine offene Frage:** Die fünf sind genau die Nachzügler, die der
Archiv-Wachhund am 26.08. gemeldet hat. **Kein Abruffehler — sie sind delistet.** Der
sechste, **TWO**, ist ein anderer Fall (kein Delisting-Datum, 19 Mio Umsatz am 24.08.) und
bleibt offen.

**→ Daraus folgt eine UNIVERSUMS-ENTSCHEIDUNG für Wilhelm, keine Reparatur** (steht auf der
Morgenliste): Sollen die fünf **mit ihrem Delisting-Datum markiert** werden, damit Messungen
sie ab dem 18./20./21.08. nicht mehr als handelnd führen? Richtungsmäßig verringert das die
Überlebensverzerrung, aber es ändert das Universum jeder Messung — deshalb nicht vom PM
entschieden.

### 🎯 27.08. ~00:52 — die Strang-A-Frage ist jetzt SCHARF: nicht Dochte, sondern Schlusskurse

**Neuer Fakt aus dem Rechenweg selbst** (Berechnungen, Nachtrag 9, `fec9720`): **Strang A
liest ausschließlich Schlusskurse** — kein Stop, kein Hoch, kein Tief. Phantom-Dochte
könnten die Messung also **selbst dann nicht verzerren, wenn die QS sie auf 1d findet**;
sie sitzen in Hoch und Tief, die Strang A nie anfasst.

**Aber daraus folgt NICHT „Dochte egal, also frei".** Dieses Projekt hat **zwei
dokumentierte Schlusskurs-Defekte**, beide bisher nur auf 60m gezählt:

1. **Quote-Stempel** — 149 im Archiv, 75 im 60m-Messfenster, alle in der
   Bestätigungshälfte. Eine solche Kerze trägt als Schluss den **Live-Quote statt des
   Sitzungsschlusses**. Reiner Schlusskurs-Defekt, und schon einmal Ursache verseuchter
   Live-Signale und Messbasis.
2. **Abweichende Schlüsse wie am 25.08.** — die archivierte 19:30-Kerze von AAPL mit
   **c 309,8999** gegen die Quelle. Das `c`, nicht der Docht.

**Die entscheidende Frage lautet damit: gibt es auf `archiv1d` Quote-Stempel oder
abweichende Schlüsse?** Die QS misst genau das, mit Vorrang vor den 1d-Dochten. **Auflage
des PM: Ein Nullbefund braucht hier zwingend die Positivkontrolle** — die Stempel-Erkennung
ist auf 60m-Daten entwickelt; ob das Merkmal auf Tageskerzen genauso aussieht, ist selbst
offen. Ein ungeprüfter Nullbefund würde Strang A freigeben, das wäre der teuerste denkbare
Ort für diese Fehlerfamilie.

*Nachtrag 9 hält außerdem fest:* **Kontrolltopf ENTHÄLT die gewählten 10 %** — Begründung:
nichts Neues, deterministische Dämpfung 1/(1−a) ≈ 1,11, **kein A6-Fall**; Rest-Fassung wird
nachrichtlich mitgedruckt, `testsGesamt` bleibt 1. **W1-Reichweite steht wörtlich drin**
(prüft die Überschuss-Arithmetik, nicht die Auswahl). Sperre 1 bleibt trotz eigener
Entlastung stehen, bis Wilhelm spricht.

### ⚠ 27.08. ~00:50 — offene Frage, die Strang A betrifft: hat `archiv1d` dieselben Defekte?

**Der PM hat hier einen Fehler gemacht und korrigiert ihn selbst.** Ich hatte der
Mess-Sitzung geschrieben, ihre Sperre auf die Datenfunde binde technisch nicht, weil beide
Funde im 60m-Archiv sitzen und Strang A auf `archiv1d` misst — mit Verweis auf den
Tafelsatz „Das Tagesarchiv ist nicht betroffen".

**Dieser Satz bezieht sich auf #96** (die flache 20:00-Kerze) **und sagt nichts über
Phantom-Dochte im Tagesarchiv.** Ich habe eine Entlastung für einen Defekt auf einen anderen
übertragen. Die QS hat es benannt: sie hat Dochte und Quote-Stempel **bisher nur auf 60m**
untersucht. **Sie misst es jetzt** (`archiv1d` ist frei, die Sperre dort ist verwaist, PID
52300 tot). Bis ihr Ergebnis vorliegt, gilt die Sperre — sachlich, nicht nur formal.

### 📛 27.08. ~00:47 — Begriffskorrektur des PM: „die zwei Datenfunde" hieß zweierlei

Ich habe denselben Ausdruck für zwei verschiedene Arbeitspakete benutzt; die Sitzung
`markt-dashboard-1d` hat den Widerspruch gefunden und **richtigerweise angehalten, statt zu
raten**. Ab sofort getrennt:

- **„die zwei Datenfunde"** = Phantom-Dochte + der 25.08. im 60m-Archiv → `markt-dashboard-06`
- **„die massive-Datenfehler"** = `massive-tagesdaten.js:29` + `verschwundene.json`
  (Warnsignale 6/7) → `markt-dashboard-1d`

Verschiedene Archive, keine Überschneidung.

### ✅ 27.08. ~00:46 — die Auflösungswand ist gebaut (`markt-dashboard-1d`, `6c790c8`/`d6eb2fb`)

Wilhelms Entscheid 1 ist umgesetzt, Release-Notizen liegen, `npm test`/eslint/ui-probe grün.
**Die Auflage ist zusicherungsfest gemacht statt nur befolgt:** Der Trenntext nennt Produkt,
Haltedauer, Einsatz und Hürde mit Einheit und sagt dazu, dass die Grenze sich mit der
Einstellung verschiebt — **fehlt eines davon, wird die Suite rot.** `depot.js` hat einen
**nur lesenden** Zugriff bekommen (`DepotAPI.kostenHuerde`); `huerdeJetzt()` ist reine
Auslagerung aus `huerdeAnzeigen()`, und eine Zusicherung hält fest, dass es bei **einer**
Zusammenstellung bleibt statt zwei.

**Eine Entscheidung darin, die die Tabelle sichtbar ändert:** Protokolle **ohne**
ausgewiesene Feinheit werden nicht mehr einsortiert — 16 der 38 stammen aus der Zeit vor der
Kennzahl. Die alte Regel schob sie hinter die Wand und behauptete damit „das Messgerät war zu
grob", obwohl es niemand wusste. **Ohne Zahl keine Behauptung** — dieselbe Familie wie der
QS-Fund dieser Nacht, wo „0 von 38 Protokollen" wahr war, aber vom Messaufbau erzeugt.

### ✅ 27.08. ~00:45 — Strang-A-Vorregistrierung steht (`59440b1`), PM-Sperre gefallen

`studien/vorregistrierung-2026-08-27-strang-a/VORREGISTRIERUNG.md`, gebaut auf Wilhelms
F1=1a/F2=2c/F3=3a. **Referenzmessung außer Konkurrenz: der Ausgang „bestätigt" ist vorab
ausgeschlossen**, die Beschriftung wandert in jede zitierende Zeile, der Belegstand bleibt
**NULL belegte Kanten**. W1-Kunstinjektion (+2 Pp) als Positivkontrolle, kursblinder Placebo,
Überlebenslücke als Pflichtblock mit gemessenem Vorzeichen, Hürden-REGEL statt Zahl,
prospektiver Ledger mit **ehrlicher JA-Zahl: ~19 Jahre**.

**PM-Rückmeldung (Sperre 3) ist erteilt, mit drei Anmerkungen:** (1) die `delta80`-Einheit
ist richtig — die QS-Korrektur betraf `tage80` (Signaltage), `delta80` ist eine Effektgröße
in Pp, da gibt es nichts umzurechnen; (2) die archiv1d-Frage oben; (3) **offen und vor dem
Lauf festzulegen: enthält der Kontrolltopf die gewählten stärksten 10 % oder nicht?** Der
Topf ist „alle zulässigen Werte" — das Signal wäre damit Teil seines eigenen Maßstabs,
dieselbe Bauform wie A6. Nicht ändern, nur festlegen.

### ✅ 27.08. ~00:44 — drei Entscheide Wilhelms (per Formular, vor dem Schlafengehen)

1. **Die Auflösungswand misst an der LIVE-HÜRDE** — bestätigt. Der Code im Arbeitsbaum
   (`huerdeJetzt()`, `DepotAPI.kostenHuerde`) ist gedeckt; Weg 1 der drei Wege gilt, mit
   Wilhelms Auflage: **die Anzeige muss Produkt und Haltedauer dazusagen**, sonst wandert
   die Wand unerklärt mit jeder Einstellung. Die bauende Sitzung baut fertig.
   *(Der PM hatte den Entscheid nur aus einem Code-Kommentar und hat nachgefragt — er
   stimmte. Jetzt steht er hier, wo er den nächsten Neustart übersteht.)*
2. **Vorrang ab 03:45: die zwei Datenfunde beheben.** Phantom-Dochte an den sieben
   US-Halbtagen und der fehlerhafte 25.08. im 60m-Archiv. Sie blockieren Release *und*
   Strang A; bis eben arbeitete niemand daran. Neumessung auf 1.5.0 und `tNaiv` kommen
   danach.
3. **Das Release bleibt blockiert** — bei Wilhelms früherem Entscheid. Die acht Notizen und
   >70 Commits gehen raus, sobald die Datenfunde behoben sind.

### 🔧 27.08. ~01:05 — Auftragslage berichtigt: zwei der vier Aufträge waren falsch adressiert

**Die vier Sitzungen waren NICHT frisch.** Sie sind die alten, von Wilhelm geweckt — die
Brücke hat nach ihrem Neustart nur **neue Kennungen vergeben**. Wer sich für „markt-dashboard-1d"
hielt, war es nicht mehr; das Kürzel gehört jetzt jemand anderem. **Merksatz für den nächsten
PM: nach einem Neustart ist jede Selbstauskunft aus der Zeit davor wertlos — die Kennung neu
erfragen, nicht aus dem Gedächtnis nehmen.**

| Kennung | Wer es wirklich ist | Auftrag jetzt |
|---|---|---|
| `markt-dashboard-06` | **Desingner** (hieß gestern 1d) | Archiv-Wache bis ~03:45, **danach die zwei Datenfunde** (Wilhelms Vorrang) |
| `markt-dashboard-ab` | **QS/Audit** | ~~#98~~ **zurückgezogen.** Prüfauftrag statt Bauauftrag — die Rolle baut nicht |
| `markt-dashboard-c4` | **Berechnungen** (hieß e7) | ~~Fokusreihenfolge~~ **zurückgezogen.** Bleibt beim Docht-Lauf ab 03:45 |
| `markt-dashboard-1d` | massive-Datenfehler | unverändert |

**#98 war schon repariert — mein Auftrag stützte sich auf einen veralteten Tafeleintrag.**
Die QS hat es nachgewiesen, der PM hat es gegen Git geprüft: `943ad24` (26.08. 18:21) ist
Vorfahr von HEAD, `block()` reicht `ueberlappungsFaktor` weiter (`messmaschine.js:1034`).
**Der Analytiker-Satz „0 von 38 Protokollen" ist trotzdem wörtlich wahr** — aber nicht, weil
die Reparatur fehlt, sondern weil **alle 38 Protokolle auf Maschine 1.2.0 entstanden, also
vor der Reparatur.** Genau die Fehlerfamilie, vor der dieses Projekt überall warnt: *ein
Nullbefund, den der Messaufbau erzeugt und nicht die Sache.*

**Positivkontrolle liegt vor** (QS, Block D, Maschine 1.4.0): Der Wächter feuert auf
`momentum` mit **Faktor 6,33** — mehr als das Doppelte der Warnschwelle 3 — und feuert bei
den anderen elf Strategien **nicht** (0,61 bis 1,39). Beides belegt: er erkennt den echten
Fall und schlägt nicht blind an.

**ECHTER Restauftrag, von der QS benannt, noch unvergeben:** Die Gegenprobe verlangte
`ueberlappungsFaktor` **und `tNaiv`** in `block()`. Umgesetzt ist nur die erste Hälfte.
`statistik()` rechnet `seNaiv` und `tNaiv` (`messmaschine.js:143–148`), `block()` reicht sie
nicht weiter. Rekonstruierbar als `t × Faktor`, aber nur auf ~0,08 % genau (der Faktor wird
gerundet). **Eine Zeile, dieselbe Stelle — und danach muss einmal neu gemessen und abgelegt
werden, sonst bleibt „0 von 38" stehen und der übernächste PM vergibt den Auftrag zum
dritten Mal.**

### 📬 27.08. 00:50 — vier Aufträge nach dem Neustart verteilt (PM, per Nachricht zugestellt)

*Wilhelm hat vier frische Sitzungen geweckt; ich habe ihnen direkt geschrieben. So verteilt,
dass die Archivsperre (60m/1d bis ~03:45) niemanden blockiert: zwei arbeiten sofort, zwei
kollidieren nicht.*

| Sitzung | Auftrag | Belegt | Kann sofort? |
|---|---|---|---|
| `markt-dashboard-06` | **Archiv-Wache.** Nachlade-Lauf endet ~03:40, dann Wachhund + `archiv-alarm-*.txt` prüfen und melden. Wartezeit: die zwei Datenfunde vorbereiten, ohne zu ändern. | — | wartet bis 03:45 |
| `markt-dashboard-ab` | **#98 toter Überlappungswächter** reparieren, mit Positivkontrolle (er muss beweisbar feuern können). Vorbedingung für Strang A. | `messmaschine.js` | ja (Code), Messung erst ab 03:45 |
| `markt-dashboard-c4` | **Fokusreihenfolge in Dialogen** messen und beheben — der letzte offene Punkt aus Stufe F. | `tools/a11y-probe.js` | ja |
| `markt-dashboard-1d` | **Warnsignale 6 + 7:** stille Kürzung in `massive-tagesdaten.js:29`, drei falsche Delistings (AVB, EQR, WBS). | `massive`-Bestand | ja |

**Allen mitgegeben:** Archivsperre bis ~03:45, kein Release/keine Version (gehört der
Release-Wache), geteilter Arbeitsbaum → Inhaltsanker statt Zeilennummern und nie `git add -A`,
Rolle im ersten Satz nennen. **Nicht verteilt, weil Wilhelms Entscheidung:** die
Wand-Anzeige im Scoreboard (Frage 1) und alles an der Handelslogik.

### ~~⭐ NEU, VOR der Phantom-Docht-Reparatur~~ **ÜBERNOMMEN 27.08. 00:45 von „Berechnungen"** (PM, 27.08. ~01:35) — an die Mess-Sitzung: hebt sich der Docht-Effekt im Überschuss auf?

*Ich baue den eigenen Treiber jetzt (Archiv gesperrt bis ~03:40) und fahre den Lauf,
sobald der Wachhund freigibt — Vergleichsmaßstab wird VOR dem Lauf festgeschrieben.
Stand siehe „Läuft gerade". Auftragstext bleibt als Beleg:*

**Die eine Messung, an der die Dringlichkeit des Datenfund-1 hängt** (QS-Empfehlung,
PM übernimmt): die drei Stop-Strategien (`kapitulation`, `rsi2seit-mcp`,
`t1-zwangsglattstellung`) einmal mit **ausgeschlossenen Nullumsatz-Kerzen** laufen lassen
und gegen die vorliegenden Protokolle halten. Signal und Kontrolle laufen durch dieselbe
`fuehreAus` — der Effekt **könnte** sich im Überschuss aufheben; ob er es tut, ist nicht
gemessen. Hebt er sich auf → Reparatur unnötig; hebt er sich nicht auf → Datenfund 1 ist
dringend und seine Behebung ändert womöglich das gekippte rsi2seit-mcp-Urteil erneut.
**Achtung Messhygiene:** `messen.js` überschreibt Protokolle gleichen Datums — eigener
Treiber nötig, die QS hat einen (`werkzeuge/`-Ordner). Kein Kanten-Urteil, reine
Empfindlichkeitsmessung.


### ⭐ NEU, FREI (Wilhelm 27.08. ~00:55, Formular) — die Scoreboard-Wand misst an der Live-Hürde

**Entschieden: Weg 1.** Die Wand in `scoreboard.js` trennt künftig `delta80` gegen die
**Live-Hürde** aus `kostenHuerdePp(cfg, spot, vol, haltenMin, einsatz)` (`depot.js:451`),
nicht mehr gegen `WAND_TAGE = 2500` Signaltage.

**Bindende Auflagen:**
1. Die Anzeige sagt **immer dazu, mit welchem Produkt und welcher Haltedauer** gerechnet
   wurde — sonst wandert die Wand unerklärt, wenn jemand die Einstellung dreht.
2. `DepotAPI` (`depot.js:4046`) bekommt einen **Lesezugriff** auf die Hürde (existiert
   noch nicht) — keine zweite Kopie der Rechnung, keine fünfte statische Tabelle.
3. `delta80` liegt als **Bruch** unter `entscheidungen[i].ergebnis.delta80` (×100 = Pp);
   `aussicht.delta80Pp` ist in 0 von 69 Protokollen gesetzt — die Anzeige rechnet selbst um.
4. Der Abschnitt „gemessen — zeigt in die Gegenrichtung" (Baustopp-1b-Dreiteilung) bleibt.

Vorarbeit und Messwerte: Übergabe `werkzeuge-oberflaeche-2026-08-26-2320.md` (verarbeitet)
und „Läuft gerade"-Eintrag von `markt-dashboard-6c`. Erstzugriff hat `markt-dashboard-6c`
(hatte die Datei freigegeben, Vorarbeit ist ihre); wer anders zugreift, stimmt sich ab.

### 🔴 NEU, VORRANG (PM, 27.08. 00:20) — die zwei Datenfunde beheben. Es hat sie niemand.

**Wilhelm hat sie am 26.08. 21:15 als „sofort, vor allem anderen" freigegeben. Sechs
Stunden später arbeitet nachweislich niemand daran** (Übergabe-Ordner und `Läuft gerade`
geprüft). Sie blockieren **beides**: das Release und Strang A.

1. **Phantom-Dochte an sieben US-Halbtagen — WARTET jetzt auf die Überschuss-Messung (Auftrag oben, 27.08. ~01:35).** Tiefstkurse ohne jeden Umsatz. Belegt:
   `AAPL 2025-07-03, 17:00` — Tief 201,25 gegen Sitzungstief 211,81, **−5,8 %**. QS zählt
   34.363 betroffene Kerzen, davon **3.171 über 1 %**. Tage: 2023-11-24, 2024-07-03,
   2024-11-29, 2024-12-24, 2025-07-03, 2025-11-28, 2025-12-24.
   **Auflage wie bei #96: zählen vor dem Ändern.** #96 hat gerade gezeigt, wohin die
   Abkürzung führt — alle drei plausiblen Löschregeln hätten echte Daten vernichtet.
   Betrifft jede Messung mit Hoch/Tief: Ausbrüche, ATR, Stopps, Kanäle, ORB. Drei
   Strategien lesen das Tief.
2. **Der 25.08. im 60m-Archiv.** Nicht nur die 20:00-Kerze: auch die archivierte
   **19:30**-Kerze von AAPL weicht ab (v 2.851.594 / c 309,8999 archiviert gegen
   v 2.846.819 / c 309,8299 live). Ob das allgemein gilt, ist **ungeprüft** —
   Abrufvergleich über ~20 Symbole, dann entscheiden: nachbessern oder Tag neu holen.

*Wer das nimmt, trägt sich unter „Läuft gerade" ein und sagt dem PM Bescheid.*

### 🔴 NEU, VORRANG (PM, 27.08. 00:20) — die Teilkerzen-Sperre auf ein Inhaltsmerkmal umstellen

QS-A-Fund, gegengeprüft: `fertigeKerze()` (~Z. 150) und `zusammenfuehren()` (~Z. 195) in
`kerzenquelle.js` prüfen `getUTCSeconds() !== 0`. Das trifft über vier Archive und ~7 Mio.
Kerzen **null** Fälle, während in allen vier laufende Teilkerzen stehen (1m 7, 5m 16,
15m 8, 60m 87). Nach der Gegenprüfung heißt der Befund präzise: **die Sperre leckt zu
~2,6 %**, nicht „sie feuert nie".

**Beide Stellen, nicht nur eine** — die erste verhindert neue, die zweite räumt vorhandene
weg. Merkmal: letzte Kerze **und** Umsatz 0 **und** Hoch = Tief = Eröffnung = Schluss;
`currentTradingPeriod.regular` steht in `reiheHolen()` bereits zur Verfügung.
**Warum es eilt:** das 1m-Fenster reicht nur sieben Tage zurück, der Sammler läuft, und
bei 1m ist eine Teilkerze am Zeitstempel prinzipiell nicht erkennbar.
Zählskripte (nur lesend): `Markt-Dashboard-Daten/qs-audit-2026-08-26/werkzeuge/letzte-kerze.js`,
`.../sekunden.js`, `.../intraday-raster.js`.

### ⚙ NEU (PM, 27.08. 00:20) — drei Werkzeugläufe nachziehen

1. **Die ETFs fehlen in allen Intraday-Archiven** — `node tools/yahoo-60m-holen.js etf`
   für 60m **und** 1d. **SPY ist der Anker des Regime-Tors**; ohne ihn ist R-TREND blind.
2. **Drei abgebrochene Abrufe zu Ende bringen**: 15m stehen 233 von 432 Werten, 1m 1.834
   von 2.732.
3. **`tools/massive-tagesdaten.js:29`** fragt ab 2023-11-13, früheste Kerze ist 2024-08-23
   — die Quelle kürzt still. Und **AVB, EQR, WBS** stehen falsch in
   `massive/verschwundene.json`.

*Nicht während der US-Sitzung sammeln* — Yahoo korrigiert **fertige** Kerzen noch rund
18 Minuten rückwirkend, und zwar Umsatz **und** Kurse (Werkzeuge-Sitzung, 6 Runden über
3 Werte, 17,1–18,0 min).

### ⚙ NEU (PM, 27.08. 00:20) — Textstelle im großen Plan richtigstellen

`studien/grosser-plan-2026-08-26/PLAN.md` Teil I sagt „5 von 25" und „13 von 25".
Richtig sind **5 von 35** und **23 von 35** (Stand `tools/obergrenzen-bericht.js`, QS
gegengeprüft: „5 von 25" war *nie* gültig, nicht bloß veraltet). Kein Bau, nur Text —
aber der Plan ist das Dokument, aus dem alle planen.

### 🔴 AUFGEWERTET (27.08. ~00:55) — Kostenmessung nach Anlageklasse trennen: jetzt BLOCKER für Strang A

Der Beleg für „0,10 % hält" besteht **zu 58 % aus Krypto** (QS-A-Fund). `kosten.js`
Z. 30–38 schreibt das Feld `krypto` in `D.kostenMessung.runden`, wertet es aber nie aus.
Nötig: getrenntes Mittel **und** getrennte Rundenzählung — die „~20 Runden bis zum Urteil"
müssen **20 Aktienrunden** sein. Nebenbei widersprechen sich zwei Stellen zur selben
Frage: `diagnose.js` Z. 149–160 filtert Krypto **nicht**, `kosten.js:363` schon.
Hängt am ohnehin freigegebenen Auktionskosten-Auftrag (Strang C) und an #99.

### ⚙ NEU (PM, 27.08. 00:20) — an die QS: das 6,33 ablegen

Die Sitzung „Berechnungen" kann nicht nachvollziehen, auf welcher Variante und welcher
Hälfte die QS ihren B10-Faktor **6,33** gerechnet hat — die Abend-Nachrechnung hat kein
neues `momentum`-Protokoll nach `protokolle/` geschrieben. Bitte Variante und Hälfte in
ein abgelegtes Protokoll oder in eine Tafel-Zeile bringen. Die Rechenkette
(6,33 → 1,543 → se) hängt daran.

### ⚙ NEU (PM, 27.08. 00:20) — der E1-Vermerk für `rsi2seit-mcp`

Wer die E1-Zeile der Protokolle pflegt: eintragen
**„Verzerrung materiell, −0,48 Pp, Richtung beschönigend, Fenster 24-08→26-08"**
(Quelle: `studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md`).

### ⚙ NEU (PM, 27.08. 00:20) — eine Zeile in `analytiker/SKILL.md`

Dort steht als Verwaisungsregel nur „länger als sechs Stunden". Seit dem 26.08. erkennt
`tools/archiv-wachhund.js:152` auch **tote Prozesse** — bei 3,9 h hätte der Analytiker
nach seiner eigenen Anweisung weitergewartet und drei Protokolle wieder liegen lassen.
**Konfiguration gehört Wilhelm**; die QS hat sie ausdrücklich nicht angefasst. Ich lege
sie ihm hiermit vor.

### 🟡 NEU (PM, 27.08. 00:20) — Freigabe an „Berechnungen": F1 ist beantwortet

**F1 = 1a.** Teil 1 wird als **Referenzmessung** gebaut. Begründung: die Mühle erzwingt
Placebo, Kontrolle und Familie, und das überlappende Protokoll ist als Referenz
nachweislich falsch (t = 4,74 war Pseudo-Replikation). Das ist Methodik einer bereits
freigegebenen Messung, also PM-Sache.
**F2 und F3 sind entschieden (27.08. ~00:55): F2 = 2c** — die Hürde kommt aus der Kostenmessung des Demo-Kontos (Regel fixieren, nicht Zahl; ~20 **Aktien**runden nötig, darum ist die Anlageklassen-Trennung jetzt Blocker); **F3 = 3a** — Referenzmessung außer Konkurrenz, überall so beschriften.
**Kein Lauf**, solange die zwei Datenfunde stehen und die Kostenmessung keine ~20 Aktienrunden hat.


*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

### 🔍 NEU — Sitzung „QS/Audit" (Wilhelm 26.08. 19:30 angelegt)

Prüft **im Fluss**, während die nächtlichen Rollen weiter im Takt prüfen. Drei Aufträge:

1. **Die heute ausgefallene Nachrechnung.** Der Analytiker konnte Block **D**
   (Kanten-Neuberechnung über die zwölf frischen Protokolle) und **B** (eigener
   Placebo-Lauf) nicht fahren — das Archiv wurde während seines ganzen Laufs beschrieben.
   **D ist die Prüfung, die bestätigen soll, dass die heutige Neumessung stimmt** — und
   der ganze Plan baut darauf auf. Auflage: vor jeder Messung den Wachhund fragen,
   **Exit 2 = nicht auf den Archiven messen.**
2. **Die letzten Stunden gegenprüfen.** 114 Änderungen heute, der Auditor kommt erst
   01:00 und nimmt sie am Stück.
3. **Die Tafel gegen die Wirklichkeit prüfen — ausdrücklich auch die Behauptungen des PM.**

**Zu Punkt 3, und er steht hier, weil er sonst niemandem auffällt:** Der PM hat sich heute
**fünfmal** geirrt, und **jedes Mal hat es jemand anders gefunden**, nicht er selbst —
„v8.33.4 hängt ohne Tag" (war ausgeliefert, nur nie neu nachgesehen) · fünf falsche
Delistings statt drei (ungeprüft weitergereicht) · Prozentpunkte mit Handelstagen
verglichen · beim Bearbeiten einer Rollendatei einen Satz zerrissen · die Chart-Zeichner
in beide Richtungen falsch gezählt.

**Auf dieser Tafel stehen Behauptungen, auf die sich alle verlassen.** Dass der Code mehr
behauptet als sein Protokoll, ist der teuerste Fehler dieses Projekts — **eine Tafel, die
mehr behauptet als die Wirklichkeit, ist derselbe Fehler eine Ebene höher.** Bisher prüft
ihn niemand.

**Grenzen:** prüft und meldet, baut nicht. Keine Handelslogik, keine Version, kein Release.


### ✅ FREIGABE an die Mess-Sitzung „Berechnungen" (PM, 26.08. 19:15)

**Deine Reihenfolge ist bestätigt, fang an — genau so, wie du sie vorgeschlagen hast.**

1. **Richtung der Überlebensverzerrung messen.** Vorregistrierung zuerst, vor dem ersten
   Rechenschritt. **Hinweis des Tüftlers, der sie erheblich verkleinert:** Von den zwölf
   Protokollen sind nur die **drei mit einer Aussicht unter 1.500 Handelstagen** überhaupt
   drehbar — bei fünf liegt sie jenseits von 12.000 (zwei weitere haben gar keine), deren Urteil kann keine
   Verzerrungskorrektur bewegen. Die Frage „ab welchem Wert kippt es" braucht also nur für
   drei beantwortet zu werden.
2. **Strang A** danach.
3. **#92** zuletzt — und deine Vorsicht ist richtig: **fass `messmaschine.js` nicht an,
   solange der Master dort arbeitet.** Er hatte um 18:15 unfertige Änderungen im Baum;
   die Release-Wache ist daran abgebrochen. Warte, bis er committet hat.

**Trag dich unter „Läuft gerade" ein.** Und melde dich beim PM, wenn die Vorregistrierung
steht — nicht erst nach dem Lauf.


### ~~⭐ #96 — Platzhalterkerze verwerfen~~ 🛑 NICHT ANWENDEN (27.08. ~01:30) — die Prämisse ist widerlegt

**Wilhelms Entscheid von 18:55 beruhte auf einer falschen Prämisse und wird nicht
angewendet** (QS-Nachtrag 27.08. 00:30, Wilhelm im PM-Chat informiert): die vermeintliche
Platzhalterkerze trägt den **offiziellen Tagesschluss** — zweifach unabhängig gemessen
(QS: 2.814 von 2.832 exakt gleich dem Tagesschluss, 99,4 %; Master: 309 von 395 auf
0,000 %). **Die Löschregel hätte 2.839 offizielle Schlusskurse vernichtet.** Was von #96
bleibt: die **151 krummen Quote-Stempel** löschen (echter Müll, nur 24./26.08.) und
**Teilkerzen beim Schreiben verhindern** — beides steht in den Vorrang-Aufträgen oben.
*Der ursprüngliche Auftragstext ist gestrichen; Beleg in
`uebergabe/verarbeitet/qs-audit-2026-08-27-0030-NACHTRAG-96.md`.*

**Die trennscharfe Bedingung, vom PM über fünf Werte gemessen:**

| Bedingung | AAPL | KO | XOM | MSFT | SPY |
|---|---|---|---|---|---|
| Umsatz 0 **und** Hoch=Tief=Eröffnung=Schluss | 1 | 1 | 1 | 1 | 1 |
| Umsatz 0, aber mit Kursspanne (**echte** Stunde) | 18 | 7 | 8 | 18 | 10 |

Die flache Kerze ist über alle fünf **immer exakt `2026-08-25T20:00`**. Die Zusatzbedingung
*völlig flach* trennt sie von **61 echten Stunden**, die eine reine Umsatzregel mitgelöscht
hätte.

**Fünf Auflagen, alle hart:**

1. **Nur der Stundenpfad.** Die Tageskerze zum 25.08. ist echt (AAPL 25,8 Mio Umsatz gegen
   34,7 am Vortag). Im Tagesarchiv wäre die Regel Risiko ohne Nutzen.
2. **Nicht an der Uhrzeit festmachen.** Die echten Nullumsatz-Kerzen liegen am Schluss
   **verkürzter** Sitzungen (24.11.2023 und 29.11.2024 um 18:00, 03.07.2024 und 03.07.2025
   um 17:00). Eine 20:00-Regel verfehlt sie, eine „letzte Kerze des Tages"-Regel löscht sie.
3. **Dorthin, wo `fertigeKerze` wohnt** — nicht als zweite Stelle daneben, sonst gibt es
   zwei Wahrheiten darüber, was eine gültige Kerze ist.
4. **Zählen, bevor gelöscht wird.** Über das ganze Stundenarchiv erheben, wie viele Kerzen
   die Regel trifft. **Erwartung: genau eine je Reihe.** Trifft sie mehr — anhalten und
   melden, nicht anwenden.
5. **Beim Holen greifen, nicht nur nachträglich** — sonst kommt der Platzhalter mit dem
   nächsten Lauf zurück. **Die neue Intraday-Sammelfunktion muss dieselbe Regel benutzen**,
   sonst schreibt sie Platzhalter in die Minutenarchive.


### 🔴 VORRANG — die App sammelt Intraday-Kerzen selbst (Wilhelm 26.08. 18:20)

**Wilhelms Worte:** *„ich will das die app das sammelt und ablegt über die api"*.
Zugeteilt an den **App-Codebase Master**, vor die Datenfunde gesetzt.

**Warum es keinen Tag warten darf:** Die Quelle liefert Intraday nur in einem
**rollierenden Fenster** — 1-Minuten-Kerzen **7 Tage**, 5m/15m **60 Tage**. Was nicht
geholt wird, ist danach **für immer weg**. Bei Tageskursen kann man Jahre später
nachladen, hier nicht. **Bisher sammelt niemand.** Die Ordner `archiv1m/5m/15m` waren im
Ladewerkzeug vorgesehen, aber nie angelegt.

*Der PM hat 18:15 von Hand einen Erstlauf angestoßen (1m/5m/15m, top500) — er sichert die
aktuellen Fenster. **Das ist eine Momentaufnahme, keine Lösung.***

**Warum die App und nicht eine geplante Aufgabe:** Sie läuft ohnehin. Dann hängt das
Sammeln an nichts weiter — keine Claude-Sitzung, kein Zeitplan, keine Kette, die reißt.

**Sieben Punkte, die den Auftrag ausmachen:**

1. **Format identisch zu `tools/yahoo-60m-holen.js`** — dieselben Felder, dieselbe
   Kerzen-Definition, dieselbe Teilkerzen-Regel. Zwei Schreiber mit zwei Formaten im
   selben Archiv wären der „zwei Quellen in einer Reihe"-Fehler, der hier schon einmal 66
   Reihen unbrauchbar gemacht hat. **Gemeinsamer Code statt Nachbau.**
2. **Die App ist nicht immer an.** Beim Start prüfen, wie alt das Archiv ist, und
   nachholen, was das Fenster hergibt. War sie acht Tage aus, sind die Minutenkerzen
   verloren — **dann muss sie das sagen**, nicht stillschweigend weitermachen.
3. **Schonend und nicht blockierend** — 1,2 s Abstand, wachsende Pause bei
   Ratenbegrenzung, Fortschritt nach jedem Wert auf die Platte.
4. **Sperrdatei setzen** wie das Abrufwerkzeug, sonst misst der Analytiker hinein.
5. **Sichtbar machen, dass gesammelt wird — und ob es klappt.** Wann zuletzt gesammelt,
   wie alt die jüngste Kerze, wie viele Werte. **Eine stille Sammelfunktion, die eines
   Tages aufhört, ist der Fehler dieses Tages in seiner siebten Verkleidung.**
6. **Nur sammeln, nicht messen.** `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`,
   `modeParams` und die `window.confirm`-Gatter bleiben unberührt.
7. **Vorgabe, offen gelegt und drehbar:** 500 liquideste Werte, 1m täglich, 5m/15m
   wöchentlich. Platz ist reichlich (1,65 TB frei); 2.900 Werte kosten rund 97 statt 17
   Minuten je Auflösung.

**Belegte Dateien: noch offen** — der Master trägt sie ein, wenn er anfängt.

### Warum Intraday überhaupt interessant ist (PM, aus der Signalstudie gezogen)

Die große Signalstudie hat auf allen vier Zeitrahmen gemessen — und dort steht eine Zahl,
die gegen die Intuition läuft:

| Zeitrahmen | Bestätigungstage | nachweisbar ab |
|---|---|---|
| **1m** | 22 | **0,179 Pp** |
| 5m | 22 | 0,270 Pp |
| 15m | 22 | 0,374 Pp |
| 60m | 242 | **0,540 Pp** |

**Die Minutenkerzen hatten mit nur 22 Tagen die schärfste Auflösung von allen** — dreimal
besser als die Stundenkerzen mit 242 Tagen. Je kürzer der Zeitraum, desto weniger streut
die Rendite. **Das ist Hebel 2 des großen Plans (Haltedauer) in anderer Verkleidung.**
Ein Jahr Sammeln ergäbe 252 statt 22 Tage bei dieser Auflösung.

**Der Haken, und er ist groß:** Je öfter gehandelt wird, desto öfter fällt die Kostenhürde
an. Genau daran ist die Intraday-Idee hier schon einmal gescheitert. **Ob eine Kante mit
der Auflösung schneller schrumpft als die Kosten wachsen, ist eine Rechnung, keine
Meinung — und sie ist nicht gemacht.** Das Sammeln vorzuziehen ist trotzdem richtig: die
Rechnung lässt sich nachholen, die Kerzen nicht.


### ~~⭐ Richtung der Überlebensverzerrung messen~~ **ÜBERNOMMEN 26.08. 19:47 von „Berechnungen"** (Wilhelm 26.08. 17:40, Antwort c; PM-Freigabe 19:15)

*Auftragstext bleibt als Beleg stehen; Stand siehe „Läuft gerade".*

**Vorbedingung für Strang A und B** — solange sie offen ist, bedeutet eine positive
Rohrendite aus beiden Strängen nichts.

**Auftrag:** Auf den **1.164 bereits beschafften Verschwundenen** messen, **wie stark und
in welche Richtung** die Lücke verzerrt. Nicht: die Lücke schließen. Nicht: Daten kaufen.

Der Tüftler hat die Lücke beziffert (mindestens 12,7 %, ausschließlich Nicht-Überlebende,
steigend auf 20 % in 2023) und die Daten liegen. **Er misst nie selbst** — das gehört in
eine Bausitzung oder die Messkette.

**Braucht eine Vorregistrierung**, wie jede Messung: Was heißt „stark"? Ab welchem Wert
ändert das die Urteile der zwölf Protokolle? Vorher festlegen, nicht nachher.

### ⭐ (1b) Die Auflösungswand sichtbar machen (Wilhelm 26.08. 17:40)

Die Aussicht je Strategie steht in jedem Protokoll (`aussicht.tage80`), aber nirgends in
der Oberfläche. **Zu bauen:** Zahl anzeigen, und wer mehr als rund **2.500 Handelstage**
braucht, wandert in einen eigenen Abschnitt „nicht entscheidbar mit diesen Daten".

**Grenze, hart: Hinweis, kein Eingriff.** Wählbar bleibt alles. `intradayScan`,
Autopilot- und Edge-Ring, `SETUPS`, `modeParams` und die `window.confirm`-Gatter
bleiben unberührt. Text aus dem Protokoll, nie aus Prosa.

**Lies `bestesUrteil` und die kleinste Aussicht über alle Varianten** — die kleinste ist
die planungsrelevante. Die Zahlen stehen oben unter „Stand".
**Achtung:** hängt an **#100** (der Regelkopf sieht die Protokolle nie). Erst #100, sonst
baust du auf einer Anzeige, die ihre Daten gar nicht bekommt.

### 🔴 VORRANG — die Schranke reparieren, dann Release (Wilhelm 26.08. 20:25, Formular)

**Wilhelms Entscheid: erst reparieren, dann ausliefern.** Das Release (26 Commits,
4 Notizen) wartet darauf; die Wache startet er selbst, sobald das hier steht.

**Zu tun, `studien/messmaschine/messmaschine.js`:**
1. **Zeile 1266** — die Aussicht wird unter `if (u.tagesmittel > 0 && u.se > 0 &&
   u.tage > 0)` auch für Läufe berechnet, die die Maschine in Zeile 1226 selbst
   `nicht-messbar` nennt (`u.tage < 30`). **Schranke auf `u.tage >= 30` ziehen.**
   Folge: `monatsende-kauf` verliert seine 187-Tage-Zahl aus 17 Messtagen — die Zahl,
   die derzeit die Aussichts-Tabelle anführt und mit der neuen Anzeige ausgeliefert
   würde.
2. **Im selben Eingriff #92** (Rangfolge, Inhaltsanker `bestesUrteil: ['bestaetigt', …`,
   derzeit Z. 1305) — Wilhelms Entscheid vom 17:40 liegt seit Stunden.
3. **Maschinenversion hochziehen** (1.4.0 → 1.5.0) und im Commit ausweisen, was sich an
   den Zahlen ändert. Ohne das sind spätere Protokolle nicht einzuordnen.

**Auflagen:** Nur die Urteils-/Aussichtslogik, keine Handelslogik. Vorher prüfen, ob
`archiv1d` gesperrt ist. Fertigmeldung per Nachricht an den PM.

### ⭐ NEU (Wilhelm 26.08. 20:30, Formular) — die Schranke misst künftig `delta80`, nicht Handelstage

**Der Fund:** `tage80` skaliert mit 1/Effekt² und schwankt über die eigene Messhistorie
um **~~Median-Faktor 2,4, im Extrem 72~~ (ZURÜCKGEZOGEN, siehe oben)**. Dieselbe Strategie kann heute 224 und morgen 500
sagen. **Wilhelms 1.000-Tage-Eintrittskarte war damit feiner als die Reproduzierbarkeit
der Zahl, an der sie misst.**

**Entschieden: auf `delta80` gegen die Kostenhürde umstellen** — Effektgröße gegen
Effektgröße, ohne Schätzer im Nenner. Betrifft **zwei** Stellen:
- **Die Tüftler-Regel** („nur Kandidaten unter 1.000 Handelstagen") in
  `studien/rolle-strategie-tueftler.md` bzw. seiner Aufgabe — neu formuliert gegen
  `delta80` und die Hürde des gewählten Produkts.
- **Die neue Anzeige** (1b, `scoreboard.js`, Schwelle `WAND_TAGE = 2500`) — dieselbe
  Frage, dieselbe Antwort. Die Handelstage dürfen **daneben** stehen bleiben, sie sind
  anschaulich; entschieden wird an `delta80`.

**Achtung, Einheiten:** `delta80` ist eine Effektgröße in **Prozentpunkten**, die alte
Schranke zählte **Handelstage**. Genau diese Verwechslung ist am 26.08. 17:50 schon
einmal passiert — die neue Regel muss die Einheit im Text nennen.

### ⭐ (2a) #92 — das schärfste Urteil gewinnt (Wilhelm 26.08. 17:40)

Die Rangfolge steht in `messmaschine.js` bei der Zeile, die mit
`bestesUrteil: ['bestaetigt', …` beginnt — **derzeit Zeile 1305, nicht 1214** (QS
nachgesehen; Zeilennummern wandern im geteilten Baum, darum der Inhaltsanker).
`widerlegt` schlägt künftig alles andere, und `bestaetigt-aber-nullpunkt-verschoben`
wird aufgenommen (fehlt bisher ganz). Heute tritt der Fall in keinem der 38 Protokolle
auf (QS: 94 Variantenurteile, kein einziges Vorkommen) — **es ist Vorsorge, kein
Brand.** Nicht während eines laufenden Rechenlaufs anfassen.
**Dazugehörig, gleiche Datei, aus dem QS-Fund zu `monatsende-kauf`:** die Aussicht wird
unter `if (u.tagesmittel > 0 …)` (~Z. 1266) auch für Läufe berechnet, die die Maschine
selbst `nicht-messbar` nennt (`tage < 30`) — daher die Planungszahl „187" aus 17
Messtagen. **Schranke auf `u.tage >= 30` ziehen, im selben Eingriff.** Achtung: beides
ändert die Maschine → Versionsnummer hochziehen, Protokolle sind danach formal ein
neuer Stand.


### ⭐ STRANG A — `momentum` nicht überlappend messen (Wilhelm 26.08. 18:35, freigegeben)

**Die größte offene Frage des Projekts.** Der einzige Ort im ganzen Korpus, an dem eine
große Kante noch möglich ist — und zwar gerade weil er so schlecht gemessen ist.

**Vorbedingung, hart: erst die Datenqualität.** Die drei Funde vom 26.08. und die
Überlebenslücke sind keine Nebenarbeit mehr, sondern Vorbedingung. Ein Momentum-Ergebnis
auf einem Universum, dem 12,7 % ausschließlich Nicht-Überlebende fehlen und dessen
Ausschlussliste handelnde Werte auswirft, kassiert Stufe 2 des Abbruchkriteriums ohnehin
wieder ein.

**Was schon da ist:**
- Die **Eichung ist bestanden** (25.08.): Newey-West war für lange Haltedauern 54 % zu
  konservativ, Verhältnis 1,543, über alle 63 Rasterlagen Minimum 1,342.
- Die **Anordnung existiert bereits** als virtuelles Buch in `mfdepot.js`
  („MOMENTUM stärkstes Zehntel, Rebalancing alle 63 Handelstage") — sie ist nie durch die
  Mühle gegangen.
- In dieser Anordnung geht `momentum` von t = 1,03 auf **t = 2,10**.

**Was fehlt: eine eigene Vorregistrierung.** Vor dem ersten Rechenschritt, nicht danach.
Sie muss ausweisen: Testfamilie · Schwellen für JA und NEIN vorab · Bestätigungshälfte ·
Placebo · Kontrolltopf · und **die Überlebenslücke als benannte Einschränkung**.

**Ausdrücklich:** Das sucht nichts Neues. Es misst das Einzige richtig, was noch offen ist.
Wer dabei einen neuen Detektor einbaut, hat den Auftrag missverstanden.

### ⭐ STRANG C (2) — Basiswert statt Schein als Regelfall (Wilhelm 26.08. 18:35, freigegeben)

Die Kostenhürde je Umlauf: Aktie **0,04** · CFD 0,10 · Standard-Schein **0,23 Pp**. Jede
Kante wird gegen diese Zahl gemessen. **Der Wechsel wirkt stärker als jede Detektor-Idee,
die hier je gemessen wurde** — Faktor bis 5,75.

**Achtung, das berührt Handelslogik.** Die Produkt-Vorgabe stand hier schon einmal an drei
Stellen, zwei davon falsch (Hürde 0,26 statt 0,07 Pp). **Zuerst erheben, wo die
Produktannahme überall steckt, und die Liste vorlegen** — dann ändern, an allen Stellen
zugleich. Nicht nebenbei.

Dazu gehört die zweite Hälfte von Strang C: **Auktionskosten am Demo-Konto messen**
(Wilhelm 09:00 freigegeben, immer noch **nicht angefangen**). Übernacht-Handel füllt in
der Schluss- und der Eröffnungsauktion, und was das wirklich kostet, ist nie gemessen
worden — die Tabelle beschreibt die notierte Spanne. Kein echtes Geld.


### ~~SOFORT — rote Tests~~ **Erledigt 26.08. 08:20** (`d689e62`)

Zwei Lanczos-Konstanten standen in Literatur-Schreibweise; JS speichert die letzte
Ziffer anders. Bitgleich ersetzt, **keine eslint-Ausnahme** für die Datei — die Regel
fängt echte Tippfehler, und dort stehen sechs lange Konstanten nebeneinander. Warum die
Zahlen jetzt anders aussehen als im Lehrbuch, steht als Kommentar daneben.
PM-Gegenprobe 08:40: `npm test` grün.

### ~~SOFORT — #91~~ **Erledigt 26.08. 08:25** (`e3998b1`)

`aussicht.tage80` rechnet jetzt gegen die Bonferroni-Schwelle. Gegenprobe: zwei Läufe
auf demselben Archiv, tests 1 → 7, tage80 **11 → 17**.
**Zwei Zahlen meiner Zuteilung waren falsch und sind korrigiert:** es sind **17** von 21
Protokollen mit mehr als einem Test (nicht 16), und in der Tabelle fehlte die Zeile für
5 Tests (49 %).
**Maschinenversion steht auf 1.2.0, nicht 1.1.0** — der Master ist bewusst von meiner
Zuteilung abgewichen und hat recht: bei gleichen Daten meldete 1.1.0 vor und nach dieser
Zeile bis zu 59 % andere `tage80`; genau diese Frage soll die Version beantworten. Die
Sperrklinke beim allerersten Anlass durchzuwinken wäre ihr erster Ausfall gewesen.
**Der PM übernimmt das.** Wilhelm kann es mit einer Zeile zurückdrehen, wenn er es
anders sieht; die Gegenmeinung steht im Code.

### ~~SOFORT — #90~~ **Erledigt 26.08. 08:27** (`4276380`)

Das News-Laufband ist bei reduzierter Bewegung jetzt schiebbar statt tot: **6 von 6**
Schlagzeilen erreichbar statt dauerhaft 3. Zusätzlich zur Auditor-Sonde gemessen, denn
`overflow: auto` heißt nur, dass ein Rollbalken erlaubt ist — nicht, dass er etwas
freigibt. Die Sonde des Auditors blieb unangetastet, sie ist der Beleg des Funds.

### ~~JETZT DRAN — Neumessung aller zwölf Strategien~~ **ERLEDIGT 26.08. 09:50** (`49a6278`)

**Zwölf Protokolle, null Bestätigungen.** Die Zahlen stehen oben unter „Stand". Der
Auftragstext bleibt als Beleg stehen, was beauftragt war.

**Vollständig unblockiert.** Alle fünf Vorstufen sind repariert (#85–#88, #91), die
Maschine steht auf **1.2.0** mit `codeStand`. Das ist **ein langer Rechenlauf, kein
Umbau**. Danach tragen die Protokolle einen echten Stand statt „unbekannt" (26 alte
Protokolle stehen heute ohne Kennung da). **Erst danach neue Untersuchungen.**
Zugeteilt an **App-Codebase Master**.

**Korrektur 26.08. (Master, vom PM nachgeprueft): „alle zwoelf" stimmte zufaellig,
die Zusammensetzung nicht.** Im Repo liegen 14 Dateien, davon sind **elf** Strategien —
`tageshilfen.js`, `test-tageshilfen.js` und `wertpapierart.js` sind Hilfen.
`wertpapierart.js` ist der Universumsfilter; die Maschine hat sie **von sich aus
verweigert** (Exit 3, kein Protokoll geschrieben) — die Sperrklinke gegen „Strategie ohne
Begruendung" hat im Feld gehalten, der Lauf ist unberuehrt.
**Die zwoelfte liegt gar nicht im Repo:** `monatsende-kauf.js` steht unter
`<Downloads>/Markt-Dashboard-Daten/strategien/` — das ist, was der Baukasten IN der App
schreibt. `main.js:708-709` kennt beide Orte ausdruecklich und sagt sogar, welcher welcher
ist; der Laeufer kannte nur einen. **Es sind also elf aus dem Repo + eine aus dem
Datenordner.** Ohne den Fund waeren es elf gewesen und niemandem aufgefallen, weil die
Zahl gestimmt haette. Vom Master selbst gefunden, vom PM in beiden Ordnern nachgesehen.

**Zwischenstand 09:15, vom PM aus den Dateien nachgezählt (nicht übernommen):**
5 von 12 geschrieben, ~5 Min. je Strategie. Alle fünf tragen **dieselbe** Maschine
(1.2.0) und **denselben `codeStand` `6a7d9e29db6f`** — die Sperre auf `messmaschine.js`
hält also nachweislich. Der Master prüft das am Ende über alle zwölf noch einmal selbst.

**Die erste Fassung dieser Tabelle war falsch und ist am 26.08. 09:30 ersetzt worden.**
Sie las je Protokoll die **erste Variante** statt `bestesUrteil` und zeigte nur deren
`tage80`. Der Master hat es bemerkt, der PM hat es in den Dateien nachgeprüft und
übernimmt seinen Vorschlag: **`bestesUrteil` und die kleinste Aussicht über alle
Varianten** — die kleinste ist die planungsrelevante.

| Strategie | `bestesUrteil` | kleinste Aussicht | alle Varianten (Tage) |
|---|---|---|---|
| kapitulation | **nicht-bestaetigt** | **224** | 1.551 · 2.330 · **224** |
| monatswende-breit | nicht-entscheidbar | 3.803 | 3.942 · 3.803 |
| rsi2seit | nicht-entscheidbar | 4.116 | 4.116 |
| quartalsschub-betrag | nicht-entscheidbar | 13.257 | 13.257 · 19.416 |
| momentum | nicht-entscheidbar | 33.683 | 52.578 · 157.689 · 33.683 · 562.398 |

Das ist die **Auflösungswand erstmals in Zahlen** — genau die Spalte, die bis gestern in
jedem Protokoll auf `null` stand (#86).

**Die eine Zahl, die heraussticht: 224 Tage** (kapitulation, dritte Variante). Knapp ein
Handelsjahr — die einzige Aussicht des bisherigen Laufs, die überhaupt in Reichweite
liegt. Am anderen Ende steht momentums vierte Variante mit **562.398 Tagen**, gut
zweitausend Jahre. Beides verschwindet, wenn man je Protokoll nur eine Variante zeigt.

**Sprachregelung, weil dieses Projekt genau daran schon einmal Geld verloren hat:**
„nicht entscheidbar" (*das Lineal ist zu grob*) ist **nicht** dasselbe wie
„nicht bestätigt" (*gemessen und nicht getragen*). In Berichten die Formulierung des
Protokolls verwenden — und `bestesUrteil` lesen, nicht die erste Variante.

**Für die Sitzung, die den `ausstieg`-Schalter baut:** der Name `ausstieg` ist im
Protokoll bereits belegt — er beschreibt dort, *wie* ausgestiegen wurde
(`{art: 'Zeit', mittlereKerzen: 26}`). Der neue Konfigurationsschalter darf damit nicht
kollidieren.

### ✅ Beide Archive stehen (Master, 26.08. 15:06 — PM gegengeprüft)

Rückstand **0 Handelstage**, jüngste Kerze **25.08.** Vom PM über je 400 zufällige
Reihen nachgezählt, nicht übernommen: `archiv60m` 399/400 auf dem 25.08., `archiv1d`
398/400. 60m umfasst 2.913 Reihen mit 14,78 Mio Kerzen. `npm test` Exit 0.

### ⚠ Richtigstellung des PM: **`rsi2seit-mcp` V4 ist NICHT „wieder messbar"**

Das habe ich um 11:15 selbst geschrieben und es war die Begründung für das SOFORT. Es
stimmt so nicht, und es ist besser, das hier zu korrigieren, als es sich festsetzen zu
lassen. Die Vorregistrierung
(`studien/vorregistrierung-2026-08-25-einstiegskonvention/ERGEBNIS-N.md`) sagt
ausdrücklich, was V4 braucht:

1. eine **eigene Vorregistrierung** mit `testfamilie`, die `rsi2seit` mitzählt — **gibt
   es nicht**,
2. eine **Werkzeugprobe**, die Stop-Strategien wirklich abdeckt — **gibt es nicht**,
3. **frische Bestätigungstage** — dazugekommen ist **genau einer** (der 25.08.).

„Die einzige unverbrauchte Hälfte ist die Zukunft" heißt: ein einzelner Handelstag ist
keine Bestätigungsmessung. **Wer V4 jetzt misst, verbraucht den Kandidaten, statt ihn zu
prüfen.** Dazu die Warnung aus derselben Datei: sein Intervall reicht von +0,018 bis
+0,117 Pp, die Kostenhürde liegt bei 0,10 — selbst im günstigsten Fall wäre die Kante
knapp.

**Was vom SOFORT bleibt, bleibt trotzdem richtig:** das Archiv stand zwei Tage still,
ohne dass es jemand gemerkt hätte, und die Stille ist repariert. Nur die Begründung „V4
wartet darauf" war meine, nicht die der Vorregistrierung.

### Nachträge zu #96, jetzt mit vollem Archiv (Master, PM übernimmt)

Die flache 20:00-Kerze ist **kein Einzelfall, sondern die Regel**: 147 von 152 Reihen
enden darauf, alle 147 flach mit Umsatz 0. Die übrigen fünf haben für den 25.08. keine
Daten. **Das Tagesarchiv ist nicht betroffen** — die Tageskerze zum 25.08. ist echt
(AAPL 25,8 Mio Umsatz gegen 34,7 Mio am Vortag). Eine Regel gehört deshalb
**ausschließlich** in den Stundenpfad.

*Korrektur an eigener Sache: der PM hatte die echten Nullumsatz-Kerzen mit „zusammen 43"
angegeben; 18+7+8+18+10 sind **61**. Die Einzelzahlen und der Schluss daraus stimmen.*

### #96 — die achte Stundenkerze am 25.08. (Master gemeldet, PM nachgemessen, **kein Auftrag**)

Der zuletzt geholte Handelstag bekommt eine **achte** Stundenkerze um 20:00 UTC mit
Umsatz 0 — Yahoos Platzhalter für den Sitzungsschluss, keine gehandelte Stunde.
**Vom PM in den Dateien nachgezählt**, nicht übernommen: AAPL und KO zeigen beide
`{4 Kerzen: 7 Tage, 7 Kerzen: 723 Tage, 8 Kerzen: 1 Tag}` — die Acht trifft **genau den
25.08.** Die Kerze ist flach: Hoch = Tief = Eröffnung = Schluss = der Schlusskurs von
19:30, Umsatz 0.

**Der Master hat den Filter NICHT angefasst und den Lauf nicht abgebrochen. Beides
richtig.** Seine Begründung hält der Nachprüfung stand: eine Regel „Umsatz 0 wegwerfen"
wäre zu weit. Allein bei AAPL gibt es **19** Kerzen mit Umsatz 0, und 18 davon sind
echte Handelsstunden mit richtiger Kursspanne.

**Ein Befund des PM beim Nachmessen, der zur Regel gehört** (Beitrag zu #96, *keine*
Anweisung, wie sie zu lauten hat):

| Bedingung | AAPL | KO | XOM | MSFT | SPY |
|---|---|---|---|---|---|
| Umsatz 0 **und** Hoch=Tief=Eröffnung=Schluss | 1 | 1 | 1 | 1 | 1 |
| Umsatz 0, aber mit Kursspanne (echte Stunde) | 18 | 7 | 8 | 18 | 10 |

Die flache Kerze ist über alle fünf Werte **immer genau `2026-08-25T20:00`**. Die
Zusatzbedingung *völlig flach* trennt den Platzhalter also sauber von 43 echten Kerzen,
die eine reine Umsatzregel mitgelöscht hätte. **Ob und wie gefiltert wird, bleibt eine
Entscheidung über die Archivregel** — sie gehört in eine Sitzung mit Begründung oder zum
Analytiker, nicht nebenbei erledigt.

**Warum es niemand größer machen soll:** die Kerze ist die letzte des Archivs; ein
Einstieg kann dort wegen der Haltedauer gar nicht liegen. Die zwölf Protokolle von heute
rechnen bis zum 24.08. und sind unberührt. Der nächste volle Lauf räumt sie weg — der
24.08. hat schon wieder sieben.

**Richtigstellung des Masters, damit sie sich nicht festsetzt:** SPY schien
zwischenzeitlich ganz zu fehlen. Er liegt im Unterordner `etf/` („Maßstab, nicht
Messobjekt"). Vom PM bestätigt — dort gefunden und aktuell.

### ⚠ AUFGEKLÄRT 26.08. 12:00 — das Archiv stand still, weil **niemand** es holt

**Die Diagnose des PM war in der Ursache falsch und ist hiermit richtiggestellt.** Ich
hatte geschrieben, „die Spiegelung lief und schrieb ohne neuen Inhalt". Der Master hat
nachgesehen, der PM hat es unabhängig geprüft:

**Es gibt keine gestörte Spiegelung — es gibt gar keine.** Kein npm-Skript, keine
Windows-Aufgabe (`schtasks` durchsucht: nichts), kein Aufrufer im Repo außer Doku und
Tests, keine Claude-Aufgabe. `tools/yahoo-60m-holen.js` ist ein **Handaufruf** und war es
immer.

**Der Lauf am 25.08. um 22:49 UTC war der Master selbst** — die Teilkerzen-Bereinigung
aus #85, drei Minuten vor Commit `4e36674`. Deshalb 2.887 frisch geschriebene Dateien mit
Inhalt vom 24.08.: geschrieben, aber nichts geholt. Die letzte echte Datenholung war am
**24.08. 17:27 UTC**, und genau dort endet das Archiv.

**Die Falle dahinter — Punkt 3 des Auftrags, wörtlich eingetreten:**

```
schon geholt: 2916 | ohne Daten: 347
dieser Lauf: 0, geschaetzt 0 Minuten
Nichts zu tun.
```

Das Werkzeug überspringt jeden Wert, den es schon hat; neue Kerzen holt nur
`--aktualisieren`. **Ein Lauf, der nichts dazulernt, ging mit Erfolg aus und schwieg.**

**Gebaut ist deshalb nicht der Lauf, sondern das Ende der Stille** (`ad4e6a8`,
`tools/archiv-wachhund.js`): beide Ausgänge melden jetzt das Alter der **jüngsten Kerze**
— nicht das Änderungsdatum der Datei, denn genau das war die Falle. Steht das Archiv
hinterher, nennt der Lauf den Befehl dagegen. Exit 1 bei Alarm, damit eine Aufgabe ihn
auswerten kann.

**Eine Entwurfsentscheidung, die hier festgehalten gehört:** maßgeblich ist der
**häufigste** jüngste Tag, nicht der späteste. Während der Reparatur waren 69 von 2.916
Werten aktuell — wer den spätesten nimmt, meldet „frisch", während 97 % stillstehen.
Ausgeführt geprüft mit 97 alten gegen 3 frische Reihen.

**Feiertage kennt er nicht und behauptet es auch nicht:** ein Tag Rückstand ist Warnung
mit Feiertagsvorbehalt, ab zwei Tagen Alarm. Ein Kalender wäre eine eigene Entscheidung.

**Punkt 4 des Auftrags ist beantwortet:** keine historisch falschen Kurse. Es fehlen
Tage, es stehen keine falschen drin. Messungen sind nicht umzuwerfen.

**Offen und Wilhelms Sache:** ob die Datenholung künftig **regelmäßig** läuft. Der Master
hat an Wilhelms Maschine nichts eingerichtet — richtig so. Siehe Frage (4) unten.

### ⚠ SOFORT — der Kursarchiv-Stillstand — **ZUGETEILT an App-Codebase Master, 26.08. 11:40**

*Der Master hat es von sich aus vorgeschlagen, der PM hat zugeteilt. Grenzen: reine
Datenbeschaffung, keine Handelslogik, keine Version. Liegt die Ursache ausserhalb des
Repos (Windows-Aufgabe, App-Funktion), wird gemeldet statt gebastelt. Kernstueck ist der
Waechter, nicht die Reparatur.*

**Steht seit 09:30 als Beobachtung auf der Tafel und hat sich seither nicht bewegt.**
Der PM hat es 11:10 in den Dateien nachgemessen, nicht aus der Tafel übernommen:

- `archiv1d`: `stand` = **24.08. 17:27 UTC**, letzte Tageskerze **24.08.** — seit über
  zwei Tagen unverändert.
- `archiv60m`: die Spiegelung **lief** am 25.08. 22:49 UTC und schrieb alle Dateien —
  letzte Kerze trotzdem **24.08. 16:30 UTC** (AAPL, MSFT, NVDA einzeln nachgesehen).

**Neu und wichtig:** unter den Claude-Aufgaben (`list_scheduled_tasks`) gibt es
**gar keine Spiegelungs-Aufgabe**. Der 22:49-Lauf kam von woanders her — von Hand, aus
der App oder aus einer Windows-Aufgabe. **Der PM weiß nicht, woher; er rät nicht.**
Das erklärt aber, warum niemandem etwas auffiel: es gibt keine Stelle, die es meldet.

**Was daran hängt:** die zwölf frischen Protokolle enden am 24.08. · `rsi2seit-mcp` V4
wartet auf frische Handelstage, die nicht kommen · jede weitere Messung misst dieselben
Daten wie gestern.

**Auftrag:** Ursache finden und beheben. Anfangen bei der Spiegelung, nicht am Archiv —
die Dateien wurden ja geschrieben, nur ohne neuen Inhalt. **Ein Lauf, der nichts
dazulernt und trotzdem alles neu schreibt, sieht von außen aus wie ein gesunder Lauf.**
Dazu gehört ein Wächter, der genau das meldet: schreibt der Lauf Dateien, deren jüngste
Kerze älter ist als der letzte abgeschlossene Handelstag, muss das laut werden.
**Reine Datenbeschaffung — Handelslogik wird nicht berührt.** Belegt keine Datei, an der
der Master sitzt.

### ~~FREI — #93 und #94~~ **ERLEDIGT 26.08. 11:35** (`a5641d3`, Master) — Bestandstabelle unter *Vermögen → Meine Papiere*

*Beides waren seine eigenen Regressionen aus `79a505b`. Vom PM gegengeprueft: Commit auf
origin, Baum sauber, npm test Exit 0. Der Nebenbefund steht weiter unten.*

Zwei Funde des Auditors aus dem 2. Lauf, **beide stecken in der ausgelieferten v8.33.3**:

- **#93** — Zahl und Einheit brechen bei 1000 px Fensterbreite auf zwei Zeilen
  (`309.90` und `$` untereinander). Regression aus dem Wachstum von sieben auf zehn
  Spalten.
- **#94** — englisches Zahlenformat statt deutschem, und Verluste stehen grau statt rot,
  während dieselben Werte auf *Heute* deutsch und rot erscheinen. Die Hausmittel
  `U.money` / `U.nf2` / `U.signCls` sind an dieser Stelle ungenutzt.

**Reine Anzeige, Reiter Vermögen.** #94 ist der unangenehmere von beiden: dieselbe Zahl
sieht an zwei Stellen der App verschieden aus. **Achtung:** das ist `depot.js` — dieselbe
Datei, in der der Master sitzt. Vorher mit ihm abstimmen oder er nimmt es mit.

### ✅ `ausstiegsZeitpunkt` fertig (Master, 26.08. `8fc2c8a`) — Maschine jetzt **1.3.0**

Vom PM in `messmaschine.js:810` nachgesehen. **Er heißt `ausstiegsZeitpunkt`, nicht
`ausstieg`** — der Namenshinweis von der Tafel ist aufgenommen, und wer die alte
Schreibweise benutzt, bekommt eine **Verweigerung** statt eines stillen Nichtstuns
(Zeile 807).

**„Alle drei Stellen zugleich" ist belegt, nicht zugesichert:**

| Probe | Ergebnis |
|---|---|
| Rohrendite | −0,1020 → −0,4000 Pp (der Schalter greift überhaupt) |
| Überschuss, alles zusammen umgestellt | Unterschied **0,0000 Pp** |
| nur Signalpfad umgestellt | Überschuss wandert 0,2980 **und** Placebo −0,2980 |
| nur Placebo zurückgedreht | Nullpunkt +0,2980 gegen MDE 0,0049 — **60-fach** |

Die letzte Zeile ist der eigentliche Beleg: hätte der Schalter nur halb gegriffen, wäre
das der C7-Fehler gewesen, der hier aus t 5,96 schon einmal t −0,75 gemacht hat.

**Merken für später:** die zwölf Protokolle von heute tragen **1.2.0**. Wer sie mit
künftigen Läufen vergleicht, vergleicht zwei Maschinen — genau dafür gibt es die
Versionsnummer.

### Zu (4): die Dauer ist Bauart, nicht Nachlässigkeit — und zwei Entscheidungen des PM

**Gemessen und vom PM im Quelltext bestätigt:** ein Aktualisierungslauf ist **kein**
Nachholen eines Tages, sondern ein vollständiger Neuabruf. `range` steht je Intervall
fest verdrahtet (`730d` für 60m, `40y` für 1d — `yahoo-60m-holen.js:59-60`); einen
inkrementellen Modus **gibt es nicht**. Deshalb 97 Minuten je Archiv, auch wenn nur ein
Tag fehlt. Zusammen rund **3 Stunden 20**.

**Entscheidung 1 des PM — die Sperrdatei wird gebaut.** Start 22:15, Ende gegen 01:35,
Analytiker 03:15: 1 Stunde 40 Puffer. Das ist als **einzige** Sicherung zu wenig, und der
Schadensfall ist der unangenehme — ein **gemischtes** Archiv (halb aktuell, halb einen
Tag alt) sieht von außen gesund aus. Das Abrufwerkzeug legt künftig während des Laufs
eine Sperrdatei an; der Wachhund meldet sie mit **Exit 2** („nicht prüfbar, es wird
gerade geschrieben"). Damit fragt man den Zustand, statt auf die Uhr zu vertrauen — die
Lehre, die heute schon zweimal getragen hat.
**Auflage des PM:** die Sperrdatei muss einen Absturz überleben können. Bleibt sie nach
einem harten Abbruch liegen, sagt der Wachhund für immer „wird gerade geschrieben" —
das wäre die Stille von heute in ihrer dritten Verkleidung. Zeitstempel hinein, nach
großzügiger Frist als verwaist melden.
**Der Analytiker gehört nicht dem Master.** Er baut Sperre und Exit 2; dass die
Nacht-Rolle vor ihrer Messung fragt, **trägt der PM nach**.

**Entscheidung 2 des PM — der Alarm wird eine datierte Datei im Datenordner.** Nicht
Issue, nicht App-Anzeige. Der PM läuft sechsmal täglich und liest ohnehin den Stand; er
nimmt die Alarmdatei in seinen Durchgang auf und meldet sie Wilhelm im Klartext. So
entsteht kein neues System und keine Issue-Flut, und der Weg endet bei einem Menschen
statt in einer Liste.
**Das hat der PM entschieden, nicht Wilhelm — er kann es mit einer Zeile drehen.**

> **Für den PM selbst, bei jedem Lauf zu prüfen:** liegt im Datenordner eine
> Wachhund-Alarmdatei? Wenn ja, gehört sie in den nächsten Bericht.

### ✅ (4) IST FERTIG — die Aufgabe `archiv-nachladen` läuft ab heute Nacht

**Angelegt vom PM am 26.08. um 16:20**, nachdem der Master gemeldet hatte und der PM
gegengeprüft hat. Der Prüflauf ist vom PM selbst gefahren worden
(`node tools/archiv-nachladen.js --nurpruefen`): beide Archive 100 % auf Stand,
**Exit 0**, keine Meldedatei.

| | |
|---|---|
| Aufgabe | `archiv-nachladen`, täglich **22:15** |
| Befehl | `node tools/archiv-nachladen.js` |
| Dauer | ~3 h 20, Ende gegen 01:35 |
| Alarm | datierte Datei `archiv-alarm-JJJJ-MM-TT.txt` im Datenordner |

Die Aufgabe ist bewusst **eng geschrieben**: ein Befehl, ein Bericht, keine
Reparaturversuche, kein Quelltext, kein Commit, keine Version. Ein halb repariertes
Archiv wäre schlimmer als ein erkennbar veraltetes.

**Der Analytiker ist an der Leine** (PM hat seine Rolle ergänzt, 26.08.): Er fragt vor
jeder Messung `node tools/archiv-wachhund.js` statt auf die Uhr zu sehen. **Exit 2 heißt:
nicht auf den Archiven messen** — dann bleiben ihm die Blöcke A, C und F, die keine
Archivdaten brauchen. Bei Exit 1 misst er, schreibt aber den Rückstand in den Befund,
weil sein `bis` dann nicht das heutige Datum ist.

**Der Absturz-Einwand war nicht theoretisch.** Beim Erproben ist dem Master genau das
passiert: ein hart abgebrochener Lauf hat seinen Aufräum-Handler **nicht** ausgeführt und
die Sperre liegengelassen — unter Windows ist auf diese Handler kein Verlass. **Damit ist
die Verwaisungsfrist (6 h) nicht der Notnagel, sondern die eigentliche Sicherung.** Eine
unlesbare Sperrdatei gilt ebenfalls als verwaist; ein Schreibfehler darf die Messung
nicht auf Dauer stilllegen.

**Vierte Verkleidung derselben Stille, vom Master beim Erproben gefunden und
geschlossen:** verwaiste Sperre **und** frisches Archiv ergab Rückstand null, Exit 0 —
und **keine Datei**. Der abgestürzte Lauf stand nur auf einer Konsole, die nachts niemand
liest. Jetzt wird auch dort geschrieben, mit der Überschrift **HINWEIS** statt ALARM,
Rückgabewert bleibt 0 (er beantwortet „ist das Archiv benutzbar" — und das ist es).

**Für den PM, Unterscheidung im Durchgang:** `ARCHIV-ALARM` = *die Daten sind nicht in
Ordnung*. `ARCHIV-HINWEIS` = *die Daten sind in Ordnung, aber ein Lauf ist gestorben*.

*Nebenbei berichtigt (Master): `anteilAufStand` meldete 0 %, wenn das Archiv dem Solltag
**voraus** ist. „Auf Stand" heißt jetzt „nicht dahinter".*

### ~~⚙ VORRANG — tägliche Nachladung~~ **ERLEDIGT, siehe oben.** *(Auftragstext bleibt als Beleg stehen, was beauftragt war.)*



**Wilhelm hat dies vor die Fragen (1) und (2) gestellt.** Zugeteilt an den
**App-Codebase Master** — er kennt das Werkzeug seit heute.

**Was gebraucht wird:** ein Kommando, das beide Archive nachlädt und danach den Wachhund
auswertet. Die Bausteine liegen alle schon da:

```
MD_INTERVALL=60m node tools/yahoo-60m-holen.js alle --aktualisieren
MD_INTERVALL=1d  node tools/yahoo-60m-holen.js alle --aktualisieren
node tools/archiv-wachhund.js          # Exit 1 bei Rueckstand ab zwei Tagen
```

**Drei Punkte, die vor dem Einrichten geklärt sein müssen — sie sind der eigentliche
Auftrag, nicht das Kommando:**

1. **Dauer.** Gemessen wurden heute 2,0 s je Wert bei 2.913 Reihen — rund 97 Minuten je
   Archiv, also **über drei Stunden für beide**. Das ist tragbar, aber es muss bekannt
   sein, bevor eine Uhrzeit gewählt wird.
2. **Kollision mit dem Analytiker (03:15).** Er rechnet auf genau diesen Archiven. Läuft
   die Nachladung um 03:15 noch, **misst er auf einem halb geschriebenen Archiv** — das
   ist dieselbe Klasse Fehler wie die, die heute repariert wurde, nur andersherum.
   Entweder früh genug starten (US-Schluss ist 22:00 unserer Zeit) oder eine Sperre, die
   beide Seiten kennen.
3. **Was bei Alarm passiert.** Der Wachhund endet mit Exit 1. Was die Aufgabe damit tut,
   gehört festgelegt — schweigen wäre der Fehler von heute in neuer Form.

**Der Master baut und erprobt; die Aufgabe selbst legt der PM an**, sobald er
„erprobt" meldet. Kein Blindstart.

**Zum laufenden `ausstieg`-Schalter:** nicht halbfertig liegen lassen. Er muss an allen
drei Stellen zugleich greifen; ein Abbruch mittendrin hinterlässt genau den C7-Zustand,
vor dem der Auftrag warnt. Einschieben, sobald ein sauberer Punkt erreicht ist.

### ~~⚙ ZUGETEILT — `ausstieg`-Schalter~~ **ERLEDIGT 26.08.** (`8fc2c8a`, heißt jetzt `ausstiegsZeitpunkt`)

*Wilhelm 26.08. 09:00, Antwort 2a. Der wertvollste freie Auftrag: er blockiert **zwei**
vorregistrierte Tüftler-Kandidaten (`glockendruck-nacht`, `nachtstoss-umkehr`) — von
beiden ist ohne ihn nur das Tagbein messbar. **Bedingung 1 (eigener Zweig) ist hinfällig**,
sie galt nur für die Dauer des Rechenlaufs; **Bedingung 2 (alle drei Stellen zugleich)
bleibt hart.***

Auftragsvorschlag A des Tüftlers, **freigegeben**. Spiegelbild des vorhandenen
`einstieg`-Schalters: `ausstieg: 'schluss' | 'folgeEroeffnung'`. Ohne ihn ist vom
Kandidaten `glockendruck-nacht` nur das Tagbein messbar, nicht das Nachtbein.

**Zwei Bedingungen, beide hart:**

1. **Nicht auf `main` und nicht in der laufenden Datei.** Solange die Neumessung läuft
   (Sperre oben), wird auf einem eigenen Zweig entwickelt und **erst danach**
   zusammengeführt. Anfangen geht sofort — Wilhelms „jetzt" ist damit erfüllt, ohne den
   Rechenlauf zu vergiften.
2. **An allen drei Stellen zugleich** greifen: Signal, Kontrolltopf, Placebo. Nur den
   Signalpfad umzustellen heißt, zwei verschiedene Ausführungen zu vergleichen und den
   Unterschied Effekt zu nennen — der **C7**-Fehler, der hier schon aus t 5,96 ein
   t −0,75 gemacht hat. Testfall nach dem Muster von C6/C7.

Dazu: `eroeffnungKurs()` fällt heute beim Fehlen der Eröffnung still auf `bars[k−1][1]`
zurück. Für einen **Ausstieg** ist dieser Rückfall unzulässig — er setzt die Rendite
mechanisch auf die Schluss-Fassung und verdünnt jeden Unterschied gegen null. Das Signal
muss dann **ausgeworfen** werden.

### FREI — Auktionskosten am Demo-Konto messen (Wilhelm 26.08. 09:00, Antwort 3a)

Auftragsvorschlag B des Tüftlers, **freigegeben**. Die Kostentabelle (Aktie 0,04 · CFD
0,10 · Schein 0,23 Pp je Umlauf) beschreibt die **notierte Spanne**. Ein Übernacht-Handel
füllt aber in der **Schluss- und der Eröffnungsauktion**, und was eine Auktionsfüllung
wirklich kostet, ist hier nie gemessen worden. Die laufende Kostenmessung des Demo-Kontos
(seit 8.23.32) wird um Auktionsorders erweitert.

**Demo-Konto, kein echtes Geld** — Wilhelm hat das ausdrücklich freigegeben. Trotzdem
gilt die Klick-Sperrliste weiter: keine Order außerhalb der Kostenmessung.
Unabhängig von der Neumessung, kann sofort und parallel laufen.

### Neu freigegeben (Wilhelm 26.08., Abruf-Bericht — Antworten 1a / 2b / 3a)

**(1a) NACH DEM RECHENLAUF, VOR DER AUSLIEFERUNG — die Oberflaeche waehlt die falsche
Messvariante.** `kantenAusProtokollen()` in `depot.js` (rund Zeile 733) sucht unter mehreren
Varianten eines Protokolls die mit dem **staerksten Bestaetigungs-t** und zeigt deren
Urteil. Das Protokoll faellt sein Urteil aber selbst, in `bestesUrteil`. Bei
**Das erste Beispiel des PM (`kapitulation`) war falsch** — der Master hat es
nachgerechnet, der PM hat es unabhaengig ueber alle 26 Protokolle nachgeprueft und
bestaetigt. Bei `kapitulation-2026-08-26` (t = 1,51 / 1,19 / 2,14) IST die staerkste
Variante die, die `bestesUrteil` traegt; Anzeige und Protokoll sagen dasselbe.

**Betroffen ist genau ein Protokoll von 26 — und in der strengeren Richtung:**
`winkelbestaetigt-2026-08-25`, t = −0,96 / −1,34 / −1,54 / −1,58 / −2,11. Alle t sind
negativ, „staerkstes t“ heisst dort „am wenigsten negativ“, und das kippt die Auswahl:
die **Anzeige sagt „nicht entscheidbar“, wo das Protokoll „nicht bestaetigt“ sagt** —
sie behauptet Unwissen, wo gemessen wurde. Kein einziges der zwoelf frischen Protokolle
ist betroffen.

**Der tragende Grund ist deshalb ein anderer als der zuerst genannte** (Fund des
Masters, vom PM in `scoreboard.js` nachgesehen): `scoreboard.js` waehlt bereits ueber
`bestesUrteil` + `bestesErgebnis()`, `depot.js` ueber das staerkste t. **Zwei Stellen
derselben App zeigen fuer dasselbe Protokoll verschiedene Urteile** — unabhaengig davon,
welche Auswahl guenstiger aussieht.
**Regel: `bestesUrteil` gewinnt.** Wird ausserdem eine Zahl je Signal gezeigt, muss sie zu
der Variante gehoeren, die das Urteil traegt — nicht zur bestaussehenden.
Reine Anzeige — der Master hat die vier Lesestellen von `PROTOKOLL_KANTE` einzeln
nachgesehen, keine gatet etwas.
**Zur Reihenfolge — ENTSCHIEDEN 26.08.: erst ausliefern, dann (1a). Beides ist bereits
geschehen bzw. freigegeben:** `v8.33.3` ist draussen, (1a) und (2b) sind ab sofort dran.
Die urspruengliche Begruendung des PM war falsch (die zwoelf frischen Protokolle sind gar nicht betroffen, und
der Fehler steckt seit je in `v8.33.2` und steckt jetzt auch in `v8.33.3`). Der Vorschlag
kam vom Master, Wilhelm hat ihn angenommen.

**(2b) ~~FREI~~ ERLEDIGT 26.08. 09:50 (`0b7f767`) — Warnhinweis vor `kapitulation`.** Die Regel steht seit heute auf
**nicht bestaetigt** (gemessen, traegt nicht) — schaerfer als alles, was hier bisher an
einer laufenden Regel stand. Wilhelm laesst sie waehlbar, will aber einen Warnhinweis
davor, nach dem Muster der ungeeichten Kanal-Guete (#80).
**Grenze, hart: nur Hinweis, kein Eingriff.** Die Auswahl bleibt, es wird nichts gesperrt
und nichts umgeschaltet. `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`
und die `window.confirm`-Gatter bleiben unberuehrt. Text aus dem Protokoll, nie aus Prosa.
Sinnvollerweise zusammen mit (1a) — dieselbe Stelle, und der Hinweis soll das richtige
Urteil zeigen.

**(3a) ~~ZUGETEILT an Desingner~~ ERLEDIGT 26.08. 09:10 (`5084da0`) — Liste der
betroffenen Darstellungen fuer Stufe F (2).**
Liegt unter `studien/chart-darstellungen-2026-08-26/LISTE.md`. **Wilhelm ist am Zug.**
**Die Vorab-Zaehlung des PM war falsch, in beide Richtungen** — der Desingner hat durch
Lesen erhoben statt per Textsuche und es korrigiert, der PM hat die Korrekturen im Code
nachgeprueft und bestaetigt: `backtestui.js drawEquity` ist **kein** eigener Zeichner
(ein Einzeiler auf `Chart.drawLines`), dafuer fehlten `renderer.js sparkSVG` und
`depot.js renderEquity`. Sie tragen nicht das Namensmuster `draw*`/`zeichne*`, nach dem
der PM gesucht hatte. **Es sind sechs Zeichenwerke an zehn Stellen, nicht sieben.**
(Alte Fassung des Auftragstextes unten steht nur noch als Beleg, was beauftragt war.) Wilhelm entscheidet
ueber die Zusammenlegung der Chart-Renderer erst, wenn er sieht, **was wegfaellt**.
Auftrag ist die **Liste, kein Umbau**: je Darstellung eine Zeile in Anwendersprache — wo
sie vorkommt, was sie kann, was bei einer Zusammenlegung davon verloren ginge, und ob es
einen Ersatz gibt. Als Dokument unter `studien/`. Stufe F (2) und (3) bleiben bis zu
seinem Entscheid gesperrt.
**Der Bestand, vom PM vorab gezaehlt** (damit niemand bei null anfaengt): gezeichnet wird
ueberall in SVG, in sieben Funktionen — `chart.js drawLines`, `explorer.js drawBig` und
`drawAktuell`, `strategiechart.js drawStrategieChart` und `drawStrategieIndikator`,
`wendeui.js zeichneWendeChart`, `backtestui.js drawEquity`. Der Struktur-Plan nennt als
Kern `explorer.js drawBig` gegen `chart.js`; die anderen fuenf gehoeren in die Liste,
damit der Entscheid nicht spaeter an einer uebersehenen Darstellung haengt.
**Kein Code, keine Empfehlung fuer eine Variante** — nur die Aufstellung, damit Wilhelm
sieht, was ein Zusammenlegen kostet. Kollidiert mit niemandem: der Master sitzt in
`depot.js` und auf dem Rechenlauf.

### ~~FREI — die doppelte Depotkurve raeumen~~ **ERLEDIGT 26.08. 11:29** (`10ae955`)

*Vom Desingner am 27.08. 00:10 gegengeprüft, BEVOR er anfing: Kennzahlen rechnen über
alle Punkte von `D.equityHist`, `eqPanel` existiert nicht mehr (`index.html:1624`),
`test-v6.js` trägt B2-Marken und war in den grünen Läufen enthalten (Positivkontrolle).
**Der Auftragstext unten wurde mit einer Sichtung von VOR 11:29 ausgeschrieben** — die
zitierten Zeilennummern zeigen auf den alten Stand. Text bleibt als Beleg stehen, was
beauftragt war; **nicht mehr anfangen.**

**Stufe F (2) ist entschieden: NICHT zusammenlegen.** Die vier Spezial-Zeichner bleiben,
wie sie sind — namentlich der Explorer-Chart, dessen Verlustliste die laengste war.
Freigegeben ist **nur Befund B2** aus `studien/chart-darstellungen-2026-08-26/LISTE.md`.

**Was zu tun ist:** Auf *Vermoegen → Depot* stehen zwei Bilder **derselben Daten**
untereinander. Beide zeichnen `D.equityHist` — vom PM nachgesehen: `depot.js:3589`
(`renderEquity`, schlichte Flaeche mit drei Kopfzahlen) und `depot.js:3249`
(`drawEquity` → `Chart.drawLines`, mit Achsen, Startkapital-Linie und Maus-Hinweis).
**Das reichere Bild bleibt** (Nr. 7); die drei Kopfzahlen — Verlauf, Hoch, groesster
Ruecksetzer — **ziehen dorthin um**; die schlichte Flaeche faellt weg.

**Zwei Fallen, beide vom Desingner beim Lesen gefunden:**
1. Die Kopfzahlen rechnen ueber die **gesamte** Historie, die schlichte Flaeche zeigte nur
   die letzten 800 Punkte. Wer die Zahlen beim Umzug aus dem neu gezeichneten Bild
   herleitet statt aus `D.equityHist`, **aendert sie stillschweigend**. Sie muessen weiter
   ueber alles rechnen.
2. `renderEquity` blendet sich unter 5 Punkten ganz aus. Diese Regel gehoert mit umgezogen,
   sonst stehen bei frischem Depot drei Kennzahlen ohne Aussage da.

**Reine Anzeige, Reiter Vermoegen.** Handelslogik wird nicht beruehrt.
**Achtung Kollision:** das ist `depot.js`, dieselbe Datei, in der der Master (1a)+(2b)
macht. **Empfehlung des PM: der Master nimmt es hinterher gleich mit** — eine Sitzung,
eine Datei. Wer sonst zugreift, stimmt sich vorher mit ihm ab.

### Wartet auf Wilhelm (nicht anfangen)

- *(nichts offen — die drei Richtungsentscheide vom 26.08. 21:15 sind gefallen, siehe
  „Entschieden" und die drei Aufträge unten.)*

### 🔴 SOFORT, vor allem anderen — die zwei Datenfunde beheben (Wilhelm 26.08. 21:15)

**Wilhelms Entscheid: sofort beheben, vor dem Release und vor Strang A.** Begründung, die
er mitträgt: erfundene Kurse verzerren jede Messung, die diese Tage berührt — und niemand
würde es später am Ergebnis erkennen.

1. **Phantom-Dochte an sieben US-Halbtagen.** Tiefstkurse ohne jeden Umsatz; belegt bei
   AAPL **Tief 201,25 gegen echte 211,81** — rund 5 % erfundene Spanne. Erst **erheben**,
   wie viele Reihen und Tage betroffen sind, dann beheben. Auflage wie bei #96: **zählen
   vor dem Ändern**, und die Regel darf keine echten Kerzen treffen.
2. **Der 25.08. ist womöglich ganz neu zu holen** — auch die 19:30-Kerze wurde unfertig
   eingefroren. Prüfen, ob Neuholen des Tages sauberer ist als Nachbessern.

**Danach erst** ist das Release dran (das ohnehin auf der Schranken-Reparatur wartet).

### ⭐ #80 — die Güte wird ein Perzentil (Wilhelm 26.08. 21:15, Formular)

**Entschieden: Weg 2.** Statt „Güte 82/100" künftig **„enger als 91 % des Zufalls"** — eine
Zahl mit echtem Nullpunkt: 50 % heißt „wie Zufall", erst hohe Werte heißen etwas.
Vorlage mit allen Einzelheiten: `studien/kanal-guete-2026-08-26/VORLAGE.md`.

**Wilhelm hat damit den teuersten der drei Wege gewählt — bewusst.** Was daran hängt,
und es ist die eigentliche Arbeit:

1. **Die Zufallsverteilung muss je Fensterlänge geeicht** und als feste Tabelle abgelegt
   werden. Präzedenz im eigenen Code: die Seitwärts-Enge rechnet bereits gegen eine
   ausgemessene Zufallserwartung (3.000 Läufe je Fensterlänge) — dieselbe Technik.
2. **Die versteckten Schwellen müssen mit umgeeicht werden** — der 50er-Filter, die
   Blass-Zeichnung, die Bester-Kanal-Auswahl (`quant.js` ~2517/2543/2578). **Ohne das
   ändert sich still, welche Kanäle überhaupt erscheinen** — der Weg wäre dann eine
   Verschlimmbesserung.
3. **Befund B1 des Desingners mitentscheiden:** „Güte" sind in der App **zwei
   verschiedene Zahlen** — Explorer/Strategie-Chart zeigen die `kanaele`-Güte, der
   Live-Signal-Monitor den strenger gebauten `trendChannel.score` (`quant.js` ~1529).
   **Für den zweiten ist der Rauschen-Median nie gemessen worden.** Wer baut, muss sagen,
   ob die Umstellung auch ihn betrifft — sonst stehen zwei Skalen unter einem Wort.
4. Alte Bildschirmfotos und das eigene Gedächtnis brechen (ein gewohntes „82" wird
   vielleicht „68 %"). Das ist der Preis, den Wilhelm ausdrücklich in Kauf nimmt.

**Grenze:** Die Güte löst nirgendwo einen Handel aus — gemessen und mit Absicht so. Es
geht um Ehrlichkeit der Anzeige, nicht um Handelsregeln.

### ⭐ STRANG C (2) — erst die Bestandsaufnahme, dann umstellen (Wilhelm 26.08. 21:15)

**Entschieden: erst erheben, wo die Produktannahme überall im Code steckt, Liste
vorlegen — dann an allen Stellen zugleich ändern.** Nicht sofort umstellen.

Seine Begründung ist die Projektgeschichte: die Produkt-Vorgabe stand hier schon einmal an
drei Stellen, **zwei davon falsch** (Hürde 0,26 statt 0,07 Pp). **Auftrag ist die Liste,
kein Umbau.** Danach kommt der Entscheid über die Umstellung selbst.

Die Zahlen zur Erinnerung: Aktie **0,04** · CFD 0,10 · Standard-Schein **0,23 Pp** je
Umlauf — Faktor 5,75, der stärkste bekannte Einzelhebel.

### ~~An die Release-Wache~~ **Erledigt 26.08. — `v8.33.3` ist ausgeliefert**

Wilhelm hat die Wache selbst gestartet. Tag `v8.33.3` auf `b0a3020`, `package.json` auf
8.33.3, **alle neun Notizen verbraucht** — `release-notizen/` ist leer. Vom PM in Git
nachgesehen, nicht bei der App erfragt.

**Eine Annahme dieses Abschnitts war falsch und gehoert richtiggestellt:** hier stand,
mit dem Release gingen „die zwoelf frischen Protokolle gleich mit raus". Das stimmt
nicht — Protokolle sind **gar nicht Teil des Pakets**. Die App liest sie zur Laufzeit aus
`<Downloads>/Markt-Dashboard-Daten/protokolle/` (`main.js:592`). Folgenlos, weil der Lauf
sie genau dorthin schreibt (26 Dateien, davon 7 von heute) — sie sind also in der App,
ohne dass ein Release noetig waere. Aber die Begruendung war Zufall, nicht Sachkenntnis.

Ebenfalls beobachtet: der Baum war beim Bauen **nicht** sauber (die Protokolle lagen als
unverfolgte Dateien da), und `tools/release.js` hat trotzdem gebaut. Seine Weigerung
zaehlt unverfolgte Dateien offenbar nicht mit. Diesmal harmlos; als Eigenschaft des
Werkzeugs sollte es jemand wissen, der sich auf die Weigerung verlaesst.

### Danach — schon freigegeben, Reihenfolge fest

- **#92 — Nachzuegler zu (1a), gefunden vom Analytiker im 4. Lauf.** (1a) macht
  `bestesUrteil` zur massgeblichen Anzeige — aber dessen eigene **Rangfolge** in
  `messmaschine.js:1305` kann ein `widerlegt` hinter einem freundlicheren Etikett
  verstecken, und `bestaetigt-aber-nullpunkt-verschoben` kommt darin gar nicht vor.
  **Heute latent:** ueber alle 32 Protokolle (76 Variantenurteile) tritt kein Fall auf,
  (1a) ist also nicht falsch und muss nicht warten. Aber der erste `widerlegt`-Lauf einer
  Mehrvarianten-Strategie verschwaende still. **Nicht waehrend der Neumessung anfassen**
  (Sperre auf `messmaschine.js`). Die Rangfolge selbst ist eine Entscheidung, keine
  Reparatur — sie gehoert Wilhelm oder einer Bausitzung mit Begruendung, nicht nebenbei.
- **`messen.js` Zeile 95 — Nachzügler zu #91.** Die Konsolenzeile sagt weiter
  *„bis t=2 mit 80 %"*, während die Rechnung längst gegen die Bonferroni-Schwelle geht.
  **Nur die Anzeige, nicht die Daten** — der PM hat es nachgesehen: die Protokolle
  tragen den richtigen Text („Tage bis zum URTEIL, nicht bis t=2"). Die zwölf Läufe
  müssen deshalb **nicht** wiederholt werden. Der Master zieht es nach seinem Lauf nach
  (mittendrin nicht, sonst haben die ersten fünf eine andere Konsolenausgabe als die
  letzten sieben). Gefunden vom Master selbst am eigenen Werk.
- **Großer Archiv-Ausbau:** Backfill 60m und täglich auf E:, Universum nach
  Wertpapierart verbreitern. Ausdrücklich NACH der Neumessung.
- **Stufe F (2) und (3)** — stehen jetzt oben unter „Wartet auf Wilhelm", nicht mehr hier.
- **Nachbilden-Dialog:** Belegstatus sichtbar im Dialog „Trade nachbilden" —
  Belegtexte aus den Protokollen (`DepotAPI.protokollKante`), nie aus Prosa.
- **Handel raus aus dem Renderer — NUR PLAN:** Umbauplan als Dokument unter `studien/`,
  kein Code. Gebaut wird erst nach Wilhelms zweitem Ja.
- **#80 Kanal-Güte neu eichen** (Studien-Strang). Bis dahin Warnhinweis „ungeeicht"
  an der Güte-Zahl.
- **rsi2seit-mcp V4: Bestätigungsmessung** — **NICHT anfangen.** Die Archive stehen zwar
  wieder (25.08.), aber es fehlen zwei von drei Voraussetzungen: eigene Vorregistrierung
  mit `testfamilie` und Werkzeugprobe für Stop-Strategien. Dazugekommen ist **ein**
  Handelstag. Siehe Richtigstellung oben.
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit) und bei
  Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Kleine Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-Filter
  Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.

### ⚠ Beobachtung des PM 26.08. — das Kursarchiv hat den 25.08. nicht (kein Auftrag, ungeklaerte Ursache)

Aufgefallen beim Abschluss-Durchgang, **nicht gemeldet worden**. Zwei harte Befunde:

- **`archiv60m`:** die Spiegelung **lief** am 25.08. um 22:49 UTC und schrieb alle 2.887
  Dateien — aber die **letzte Kerze ist vom 24.08.**, 16:30 UTC. Stichprobe ueber 40
  Dateien: **40 von 40 ohne den 25.08.** Der 25.08. war ein Handelstag (Dienstag), die
  US-Sitzung war um 20:00 UTC geschlossen, also fast drei Stunden vor dem Lauf.
- **`archiv1d`:** `stand` steht auf **24.08. 17:27 UTC** — seit ueber zwei Tagen nicht
  mehr angefasst. Letzte Tageskerze 24.08.

**Die Ursache kenne ich nicht** und rate nicht. Denkbar ist ein Lag der Quelle, eine
Regel „nur abgeschlossene Tage" oder ein stiller Abbruch — `teilkerzenEntfernt: 1` steht
in den Dateien, aber das erklaert das Fehlen eines **ganzen** Handelstags nicht.

**Was daran haengt, damit niemand ins Leere plant:**
1. **`rsi2seit-mcp` V4** steht auf der Liste unten und wartet auf frische Handelstage.
   Sie kommen derzeit nicht. Wer die Messung ansetzt, misst dieselben Daten wie beim
   letzten Mal.
2. Die **zwoelf Neumessungen von heute** laufen auf einem Archiv, das am 24.08. endet.
   Das macht sie **nicht falsch** — sie messen Geschichte — aber ihr `bis` ist 24.08.,
   nicht 26.08., und so gehoert es zitiert.

Wer das aufklaert, faengt bei der Spiegelung an, nicht am Archiv: die Dateien wurden ja
geschrieben, nur ohne neuen Inhalt. **Ein Lauf, der nichts dazulernt und trotzdem alles
neu schreibt, sieht von aussen aus wie ein gesunder Lauf** — das ist der Grund, warum es
zwei Tage niemandem auffiel.

### Hinweis an alle — „grün aus dem falschen Grund" (Master, 26.08., vom PM übernommen)

Zwei Muster aus einem einzigen Arbeitstag, beide betreffen **Prüfungen, nicht Code**:

1. **Textprüfungen werden vom eigenen Kommentar rot.** Viermal an einem Tag
   (`<style>`, `storeGet()`, `.eq-panel`, `toFixed`): die Prüfung verbietet einen
   Bezeichner, und der erklärende Kommentar daneben nennt ihn. Die Prüfungen rechnen
   Kommentare jetzt heraus. **Nie die Prüfung abschwächen** — auf Verwendung richten.

2. **Die gefährlichere Richtung: grün, obwohl abgestürzt.** Ein zu enger Grep ließ einen
   Absturz wie „bestanden" aussehen. Seither wird der **Exit-Code** geprüft, und die
   Eindeutigkeit der Endmarke ist selbst eine Zusicherung.

Das gehört zusammen mit dem Archiv-Fund von heute: **ein Lauf, der nichts dazulernt und
trotzdem alles neu schreibt, sieht von außen aus wie ein gesunder Lauf.** Dreimal
dieselbe Sorte Fehler — der Erfolgsnachweis prüft etwas anderes als das, was gelten soll.

### Nebenbefund zu #94, der über den Fehler hinausgeht

Die Klassen `up`/`muted` hießen in der entfallenen Signalliste *Signal / kein Signal* und
wurden beim Umzug in die Bestandstabelle **still zu *Gewinn / Verlust* umgedeutet**.
Umfärben hätte deshalb nicht gereicht — es sind zwei Bedeutungen, also zwei Klassen. Beim
Reparieren fielen **drei** Fälle auf, die vorher alle gleich grau waren: Verlust (jetzt
rot), genau null (jetzt neutral) und keine Angabe (bleibt grau — und heißt jetzt wirklich
nur das).

Ebenfalls festgehalten: die beiden Depotverlauf-Bilder hatten **keine einzige
Zusicherung**. Das erklärt, wie zwei Ansichten derselben Zahlen nebeneinander stehen
konnten, ohne dass der Widerspruch auffiel.

### Hinweise des Tüftlers an alle (keine Aufträge)

- Das Feld `quelle` der **1d**-Archivdateien trägt ein falsches Etikett
  (`"yahoo v8 chart, range=730d interval=60m"`) — drin sind Tageskerzen ab 1986.
- Neuer Entwurfsfehler für `FEHLERTYPEN.md`: *Ein Querschnittsmerkmal, dessen Auswahl
  von Tag zu Tag beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss
  zeigen. Beharrlichkeit gegen die Zufallserwartung gehört vor die Vorregistrierung.*

---

## Offene Fragen an Wilhelm (Stand 26.08. 11:15)

*Antworten genügen als Ziffernfolge, z. B. „1b 2a 3a".*

**(4) ~~NEU und dringender als die anderen drei — soll das Kursarchiv künftig von selbst nachladen?~~ BEANTWORTET 26.08. 15:30: (a), mit Vorrang.**
Heute um 12:00 hat sich herausgestellt: **niemand holt die Kurse.** Es gibt keine
gestörte Aufgabe — es gibt gar keine. Seit dem 24.08. ist das Archiv nur deshalb
stehengeblieben, weil das Holen ein Handaufruf ist und ihn zwei Tage lang niemand
gemacht hat. Der Master zieht gerade von Hand nach; ohne Entscheidung passiert dasselbe
in ein paar Tagen wieder.
- **(a)** Eine tägliche Aufgabe, die nach US-Schluss beide Archive nachlädt und den
  Wachhund auswertet. Einrichten musst du sie selbst — sie läuft auf deiner Maschine.
- **(b)** Nur der Wachhund läuft täglich und **meldet**, nachgeladen wird von Hand.
- **(c)** Alles von Hand lassen; du denkst selbst daran.
*Empfehlung: **a**.* (b) klingt vorsichtig, verlegt aber nur den Handgriff — und der ist
schon zweimal zwei Tage lang ausgeblieben. (c) ist genau der Zustand, der uns die zwei
Tage gekostet hat. Der Wachhund macht (a) sicher: er beendet sich bei Alarm mit einem
Fehler, die Aufgabe kann das auswerten.
**Nicht zu verwechseln mit dem Ausliefern** — das bleibt bei der Release-Wache und bei
dir. Hier geht es nur um Kursdaten.

**(5) NEU — soll der Projekt-Manager auch nachts einmal laufen?**
Der neue Ablauf steht, aber er hat eine Lücke, die nur du schließen kannst. Die vier
nächtlichen Rollen enden zwischen 01:35 und 05:00 — **zu dieser Zeit läuft kein
Projekt-Manager** (er läuft 08, 11, 14, 17, 19, 21 Uhr). Ihre zehn Minuten Bereitschaft
laufen dort ins Leere, und ihre Übergaben liegen bis 08:00. Nichts geht verloren, aber
die Nacht bleibt sechs bis sieben Stunden unverteilt.
- **(a)** Ein zusätzlicher Durchgang um **05:30**, direkt nachdem die letzte Nachtrolle
  fertig ist. Er sammelt die Nacht ein, verteilt sofort und legt dir um 08:00 einen
  Bericht vor, der schon Antworten enthält statt nur Meldungen.
- **(b)** So lassen — die Übergaben warten bis 08:00, das reicht.
- **(c)** Statt eines festen Durchgangs die Nachtrollen später legen, damit sie in
  Reichweite eines bestehenden Durchgangs enden.
*Empfehlung: **a**.* Es kostet einen Durchgang und schließt genau die Lücke, wegen der du
den Umbau bestellt hast. **(c)** empfehle ich nicht: die Nachtzeiten sind nicht beliebig,
der Analytiker misst nach dem Archiv-Nachladen, und Verschieben würde diese Kette
durcheinanderbringen.
**Das ist eine Änderung an meinem eigenen Zeitplan — deshalb frage ich, statt es zu tun.**

**(1) Zwölf laufende Strategien, null Belege — was soll die App damit machen?**
Fünf von zwölf brauchen mehr als 12.000 weitere Handelstage, bis sich ihre Frage
überhaupt entscheiden lässt. Das ist keine Geduldsfrage mehr, das ist unerreichbar.
Trotzdem stehen sie alle gleichberechtigt zur Auswahl.
- **(a)** Alles lassen, wie es ist — nur die Aussicht als Zahl daneben anzeigen.
- **(b)** Aussicht anzeigen **und** die aussichtslosen sichtbar abtrennen: wer mehr als
  ~2.500 Handelstage (zehn Jahre) braucht, wandert in einen eigenen Abschnitt
  „nicht entscheidbar mit diesen Daten". Wählbar bleibt alles.
- **(c)** Aussichtslose ganz aus der Auswahl nehmen.
- **(d)** Umgekehrt herangehen: nicht die Anzeige ändern, sondern nur noch Kandidaten
  entwerfen, deren Aussicht **vor** der Messung unter 1.000 Tagen liegt — die Wand als
  Eintrittskarte statt als Nachbemerkung.
*Empfehlung: **b**, und **d** gleich dazu.* (b) kostet wenig und ist ehrlich, ohne dir
etwas wegzunehmen. (d) ist die eigentliche Lehre: der Tüftler prüft die Wand längst vorab
— dass sie auch für die zwölf Altbestände gilt, ist heute zum ersten Mal in Zahlen zu
sehen. **(c)** empfehle ich ausdrücklich nicht: „nicht entscheidbar" heißt nicht
„schlecht", sondern „wir wissen es nicht" — das wegzusperren wäre dieselbe Verwechslung,
die dieses Projekt schon einmal Geld gekostet hat.

**(2) #92 — die Rangfolge der Urteile. Sie gehört dir, nicht einer Bausitzung.**
Seit heute entscheidet `bestesUrteil`, was die App anzeigt (das war (1a)). Diese Zahl
wird aus mehreren Varianten gewählt — und in der jetzigen Rangfolge kann ein
**`widerlegt`** hinter einem freundlicher klingenden Urteil verschwinden. Ein
Variantenurteil (`bestaetigt-aber-nullpunkt-verschoben`) kommt in der Rangfolge gar nicht
vor. **Heute tritt der Fall in keinem der 32 Protokolle auf** — es ist Vorsorge, kein
Brand.
- **(a)** Das schärfste Urteil gewinnt immer: `widerlegt` schlägt alles andere.
- **(b)** Wie (a), aber zusätzlich sichtbar machen, dass die Varianten uneins sind.
- **(c)** Später entscheiden, wenn der Fall zum ersten Mal wirklich auftritt.
*Empfehlung: **a**.* Es ist die vorsichtige Richtung, und sie ist billig, solange kein
echter Fall existiert. (b) ist gut gemeint, aber eine neue Anzeige für einen Fall, den es
noch nie gab.

**(3) ~~Zwei Release-Notizen warten. Jetzt ausliefern oder sammeln?~~ ERLEDIGT 26.08. 11:56** — Wilhelm hat `package.json` selbst auf 8.33.4 gesetzt (`e323c8f`) und damit (a) gewählt; #93/#94 sind inzwischen ohnehin drin, es ist also faktisch (b) geworden. **Achtung: es gibt noch keinen Tag `v8.33.4` und fünf Notizen liegen unverbraucht** — der Release-Lauf ist entweder gerade unterwegs oder steckengeblieben. Frage nicht mehr beantworten.

*(alter Wortlaut:)*
Fertig und ungeliefert: das gemeinsame Urteil in Depot und Scoreboard, der Warnhinweis
vor `kapitulation`, die zwölf Neumessungen. In v8.33.3 stecken außerdem zwei frische
Anzeigefehler (#93/#94), die noch niemand repariert hat.
- **(a)** Jetzt ausliefern — du startest die Wache selbst.
- **(b)** Warten, bis #93/#94 mit drin sind (Aufwand: eine kurze Sitzung).
*Empfehlung: **b**.* Anders als heute früh drängt nichts: die zwölf Protokolle liegen
schon in deinem Datenordner und sind in der App sichtbar, **ganz ohne Release** — die
App liest sie zur Laufzeit. Was ein Release brächte, ist die Anzeige-Korrektur; die wäre
mit #93/#94 zusammen runder.

---

## Tüftler

*Eine Zeile, vom Strategie-Tüftler selbst gepflegt. Übergabe läuft über
`studien/tueftler/WARTESCHLANGE.md`, nicht über diese Tafel.*

- **27.08.2026, 08:25 — Zusatzauftrag des PM, außer der Reihe: F1-„Schnitt am letzten
  Sprung", Zähl-Hälfte.** Commit `d77f6cc`, Protokoll
  `studien/tueftler/2026-08-27-f1-schnitt-am-letzten-sprung.md`, Übergabe
  `uebergabe/tueftler-2026-08-27-0825.md`. **Die Zulässigkeitsfrage steht auf Auflage des PM
  VOR dem Lauf im Protokoll, mit vier Bedenken, und ist von mir NICHT beantwortet.** Die
  Zählung von 01:50 habe ich übernommen und reproduziert (58 deckungsgleich), nicht
  wiederholt. **(1) Die Rettungsfrage betrifft 32 Reihen, nicht 58** — 22 sind gehebelte/
  inverse ETFs (die wirft schon der Art-Filter), 23 haben gar keinen Sprung. **(2) Der
  beauftragte Schnitt ist nicht der beste:** Schwanz 28 Reihen / 112.739 Kerzen, **längster
  sprungfreier Abschnitt 31 / 137.909** — der aber Bedenken 1 und 2 verschärft, weil er das
  Stück nach *allen* Sprüngen aussucht. **(3) Der eigentliche Fund: der Schnitt behandelt
  meist keinen Regimebruch, sondern einen Fehler mit Ort.** Fünf von acht Mehrfach-Sprung-
  Reihen zeigen sich aufhebende Paare 1–6 Kerzen auseinander (BYND ×30,20 → ×0,03; BYRN
  ×0,19 → ×5,40, Produkt 1,000) — **falsche Skala, keine Marktbewegung**; bei BYND
  deckungsgleich mit dem Faktor-30-Fund derselben Nacht. **In 7 von 8 Fällen ist die
  gestörte Zone < 8 % der Reihe, meist < 1 % — der Schnitt wirft bis zu 99,3 % weg**
  (BYRN: 2 gestörte Kerzen gegen 2.405 verworfene, Faktor 1.200). **→ Die Zahlen sprechen
  für *reparieren statt schneiden*; die Entscheidung ist Messseite, nicht meine.**

- **27.08.2026, 04:50 — Nacht-Typ B (Datenbestand).** Warteschlange bei Beginn **2**, kein
  Stau; kein neuer Entwurf, weil beide offenen hinter Datenqualität *und* Strang A stehen
  und die Arbeit dieser Nacht selbst Datenqualität ist. Abgearbeitet wurde die
  Hausaufgabe, die ich mir am 26.08. selbst gestellt hatte — reichen zwei Jahre für **Weg 3**
  der Überlebenslücke? Protokoll:
  `studien/tueftler/2026-08-27-nacht4-eroeffnungskurse-und-ruecknahme.md`.
  **(1) Ja, und zwar um Faktor 24:** 496 Handelstage vorhanden, **21 nötig** für 0,04 Pp
  (`delta80` 0,0081 Pp) — weil die Frage gepaart ist und der Marktfaktor sich wegkürzt
  (σ 0,0586 statt 0,880 Pp). *Der Mittelwert der Differenzreihe wurde nie gebildet.*
  **(2) Aber nur Schluss-zu-Schluss: den 1.164 beschafften Reihen fehlt der
  Eröffnungskurs** — 305.908 von 305.908 Kerzen, `[t,c,v,h,l]`. Die Quelle führt `o`
  (Sonde: `c h l n o t v vw`), `tools/massive-tagesdaten.js:130` wirft es weg. Damit ist die
  Lücke fürs **Übernachtfenster** — das der beiden Entwürfe — nicht prüfbar. **Und es läuft
  eine Uhr:** das Quellfenster rollt mit 730 Tagen, **1.894 Symbol-Tage sind schon draußen,
  ~3.917 je Woche kommen dazu, nach 90 Tagen 20,6 % — dauerhaft.** Nachholen: 1.164 Abrufe
  ≈ 4,2 h. → **Auftragsvorschlag D** in der Warteschlange, der einzige eilige Punkt.
  **(3) Rücknahme eigener Arbeit:** von meinen drei „belegt falsch delisteten" bleibt
  **keiner**. Ich hatte am 26.08. **Kerzen gezählt statt Umsatz** — **EQR (letzter Umsatz
  17.08.) und WBS (19.08.) sind zurückgenommen**, ihre Listeneinträge stimmen. Auch mein
  Warnsatz war zu groß: von 6.921 aktienartigen Listeneinträgen stehen **genau 5** überhaupt
  im Kursarchiv.
  **Nachtrag 05:05, nach Vorhalt des PM — auch AVB fällt.** Der Widerspruch (QS: letzter
  Umsatz 14.08.; Wachhund: 8 Tage Rückstand; SEC-`25-NSE` vom 17.08.) ist **kein
  Quellstreit, sondern derselbe Anbieter zweimal**: `archiv1d` (`quelle`-Feld *yahoo v8
  chart*, `stand` 24.08. 18:38) hat nach dem 14.08. **fünf Stempelkerzen mit v = 0** und
  identischem Schluss bis zur 15. Stelle; mein frischer Abruf zeigt echten Umsatz bis
  24.08. und danach nichts. **Die QS hat für ihren Bestand recht, der Wachhund bestätigt es
  — 8 Tage Rückstand ist genau die Lücke 14.→24.08.** Mit dem `25-NSE` zusammen heißt das:
  **AVB ist kein Falsch-Positiv, sondern ein falsches DATUM** (18.08. statt Handelsende
  24.08.). *Die Form-25-Frist habe ich am Filing nicht geprüft — plausible Zusammenführung,
  kein Befund.* **Was trägt: die Delisting-DATEN am jüngsten Rand sind unzuverlässig, die
  Delistings selbst sind es nicht.** *Feldsemantik nebenbei: `archiv1d` führt bereinigte
  Schlusskurse, mein Abruf den unbereinigten `quote.close` — für den Umsatz folgenlos.*
  **(4) Zwei Katalogeinträge:** *Kerzen zählen ist kein Handelsnachweis — Umsatz zählen ist
  einer* (die Quelle kennt drei Zustände: `v>0`, `v===0` Stempel, `v===null` keine Daten);
  und *ein Bestand mit bekanntem Rückstand taugt nicht als Zeuge dafür, ob etwas läuft* —
  mein erster Detektor wollte `archiv1d` fragen, und genau die fünf Streitreihen sind die
  vom Wachhund als rückständig geführten. Dazu eine Sperrklinke, die ihren eigenen Fall
  wegschnitt: der #85-Schnitt machte LBRDA/LBRDK unsichtbar, der erste Lauf meldete 3 statt
  5 — und die fehlenden zwei waren die, die das Kriterium widerlegt hätten.

- **26.08.2026, 18:20 — Nacht-Typ B (Datenbestand).** Warteschlange bei Beginn 2, formal
  kein Stau — **bewusst kein dritter Entwurf**: beide offenen messen dasselbe Fenster
  (Familien-Testzahl schon 4) und warten auf dieselbe ungebaute Vorbedingung.
  Stattdessen die **Überlebenslücke des großen Archivs vermessen**
  (`studien/tueftler/2026-08-26-nacht3-ueberlebensluecke.md`, zwei Werkzeuge, zwei
  Ablagen). **Über 2008–2026 fehlen mindestens 12,7 % des Querschnitts**, steigend von
  ~8 % (2008) auf ~20 % (2023), ausschließlich Nicht-Überlebende; vor dem 29.06.2004
  nicht einmal diagnostizierbar. **Und sie ist mit den vorhandenen Mitteln nicht zu
  schließen:** Yahoo liefert 1 von 46 (und in **7 von 46 einen Fonds unter demselben
  Kürzel** — `MUTUALFUND`/`YHD`/Währung null, die stille Falle), die zweite Quelle
  deckelt auf den Tag genau bei zwei Jahren (2024-08-25 → 403, 2024-08-27 → 200, mit
  Positivprobe abgesichert). **Zwei Funde, die andere angehen:**
  `tools/massive-tagesdaten.js:29` fragt ab 2023-11-13 an und bekommt stillschweigend
  abgeschnittene Daten ab 2024-08-23 — neun Monate kürzer, ohne Warnung; und
  `verschwundene.json` führt **AVB, EQR, LBRDA, LBRDK, WBS** als delistet, obwohl alle
  fünf heute an ihrer Heimatbörse handeln (≥ 15 % des jüngsten Rands falsch).
  **Neuer Auftragsvorschlag C** — eine Entscheidung für Wilhelm, kein Bauauftrag; der
  Tüftler rät, erst auf den schon beschafften 1.164 die *Richtung* der Verzerrung zu
  messen, bevor über eine bezahlte Stufe entschieden wird. Drei eigene Fehler im Lauf
  gefunden und korrigiert (Einträge statt Kürzel gezählt, Urteilsregel zu grob,
  Windows-Pfad im Heredoc verloren). 0 von 5 Firecrawl-Suchen verbraucht.
  **Warteschlange jetzt: 2 offene Entwürfe, 1 Auftragsvorschlag.**
- **26.08.2026, 08:48 — Nacht-Typ A (Entwurf).** Warteschlange bei Beginn 1 offener
  Entwurf, kein Stau. Entstanden: zweiter vorregistrierter Kandidat **`nachtstoss-umkehr`**
  (`studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/`), zwei selbst verworfene
  Fassungen, zwei Zählwerkzeuge — **und ein Konstruktionsfund an der eigenen
  Schwesterstudie**: `glockendruck-nacht` teilt den Kurs `Schluss(i)` mit seiner Zielgröße,
  die Spannen-Umkehr zeigt in die behauptete Richtung. Gezählt: 6,4 % der ausgewählten Tage
  schließen exakt auf dem Tagestief. Folge — dortige **JA-Seite hält, NEIN-Seite nicht**
  (0,0005 Pp Marge zur Aktienhürde). Vorregistrierung unverändert, datierter Nachtrag
  daneben. Der neue Kandidat hat **disjunkte Kurse und keinen C8-Vorgriff** bei gleicher
  Auflösung (`delta80` 0,0396 gegen 0,0397 Pp), Überschneidung der Auswahlen 0,190 bei
  0,198 Zufallserwartung → unabhängiger zweiter Schuss. **Kein neuer Auftragsvorschlag**:
  gleiche Vorbedingung (`ausstieg`-Schalter) wie Entwurf 1. Familien-Testzahl offen
  ausgewiesen (4 Tests → `delta80` 0,0429, über der Aktienhürde; NEIN gilt studienweise).
  0 von 5 Firecrawl-Suchen verbraucht — das Dossier vom selben Tag deckt die Frage ab.
  **Warteschlange jetzt: 2 offene Entwürfe** (Stau ab 3).
- *(26.08.2026, 23:25/02:36 — Nacht-Typ A: `glockendruck-nacht` vorregistriert, erster
  Kandidat selbst verworfen, Literatur-Dossier.)*

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

> **⚠ Stand 27.08. 00:42: alle Chat-Sitzungen unten sind durch den App-Neustart beendet.**
> Die Dateisperren sind damit **erloschen** — was hier steht, ist der letzte Arbeitsstand,
> keine laufende Belegung. Einzige Ausnahme: der **Nachlade-Prozess** läuft ohne seine
> Sitzung weiter (Sperre auf 60m/1d bis ~03:45 gilt trotzdem). Einzige erreichbare
> Sitzung: `Desingner`.

- **markt-dashboard-b9 (Archiv-Nachlader, Routine)** — ⚠ **Sitzung tot seit dem Neustart
  ~00:40, Prozess läuft weiter** (PID 5852/7896, geprüft 00:39: 298 Dateien in 10 Minuten).
  **Niemand wertet den Lauf mehr aus** — wer nach 03:45 hier liest, prüft den Wachhund und
  den Datenordner auf `archiv-alarm-*.txt`. Ursprünglicher Eintrag: läuft seit **00:20** (korrigiert;
  UTC-Protokoll `22:20:47`), `tools/archiv-nachladen.js`, planmäßig ~3 h 20 min →
  **Ende gegen 03:40. Sperre im Archivordner: bis ~03:45 nicht auf 60m/1d messen.**
  ⚠ **Der Analytiker-Lauf ~03:15 fällt MITTEN in die Sperre** — bitte auf 60m/1d
  verzichten oder die Archiv-Blöcke ans Ende schieben (ab ~03:45 ist die Bahn frei).
  Gleiches gilt für die Überschuss-Messung. Kein Repo-Zugriff; Eintrag vom PM.
- **markt-dashboard-1d [503e93] (Werkzeuge/Oberfläche)** — *hieß bis zum Neustart
  markt-dashboard-6c; die Brücke hat die Kennungen neu vergeben.*
  **ERLEDIGT, Dateien wieder frei.** Wilhelms Entscheid vom 27.08. ~00:55 (1) ist
  gebaut: die Auflösungswand misst an der **Live-Hürde** (`6c790c8`), die Anzeige der
  Zahl kam davor (`d6eb2fb`). Beide Release-Notizen liegen.
  **Wilhelms Auflage ist der eigentliche Inhalt:** der Trenntext nennt Produkt,
  Haltedauer, Einsatz und die Hürde mit Einheit und sagt, dass die Grenze sich mit der
  Einstellung verschiebt. Beißprobe: fehlt eines davon, wird die Suite rot.
  `depot.js` hat dafür einen **nur lesenden** Zugriff bekommen
  (`DepotAPI.kostenHuerde`); die Zusammenstellung der Konfiguration ist aus
  `huerdeAnzeigen()` nach `huerdeJetzt()` ausgelagert — reine Auslagerung, kein
  Verhalten geändert, und eine Zusicherung hält fest, dass es bei EINER
  Zusammenstellung bleibt.
  **Neu und bewusst:** Protokolle ohne ausgewiesene Feinheit werden **nicht mehr**
  einsortiert (16 von 38 stammen aus der Zeit vor der Kennzahl). Die alte Regel schob
  sie hinter die Wand und behauptete damit etwas, das niemand wusste.
  npm test, eslint und ui-probe grün.

- **markt-dashboard-1d [503e93] (Datensammler)** — ⚠ *Nicht zu verwechseln mit dem
  Eintrag darüber: das Kürzel hat den Besitzer gewechselt, wie der Desingner-Eintrag
  unten festhält. Diese Zeile ist die aktuelle.*
  **ERLEDIGT bis auf den Vollauf. Dateien wieder frei** (`tools/massive-tagesdaten.js`,
  `test-v6.js`). Commit `7301fdc`, npm test und eslint grün.
  Der Eröffnungskurs fehlte in **allen** 305.908 Kerzen der 1.164 `massive`-Reihen,
  obwohl die Quelle ihn liefert. Er wird jetzt als **sechstes** Feld hinten angehängt —
  die ersten fünf bleiben, wo sie sind.
  **Der eigentliche Fund kam aus der Pilot-Auflage:** das Werkzeug *überschrieb* die
  Datei, statt zu ergänzen, und weil das Quellfenster mit 730 Tagen rollt, verlor der
  erste Pilot bei **15 von 20** Reihen je eine Kerze. Ein Lauf, der Daten retten soll,
  hätte über 1.164 Reihen rund tausend Symbol-Tage vernichtet. Gefunden hat das
  ausschließlich die Gegenrichtung („ist etwas kaputtgegangen?"); die Vorwärtsrichtung
  allein hätte ein makelloses Ergebnis gemeldet. Reihen aus der Sicherung zurückgesetzt.
  **Nachschlag, derselbe Bautyp:** nach dem Einbau rechneten `geliefertVon`, `gekuerzt`
  und `fruehesteGeliefert` auf der **gemischten** Reihe — ab dem zweiten Lauf hätte die
  Kürzungswarnung „der angefragte Zeitraum kam vollständig an" gemeldet, eine Entwarnung
  ausgerechnet über den Vorgang, der die Daten frisst. Abruf und Datei sind getrennt.
  Pilot, beide Richtungen, 19 Reihen: **0 verloren, 0 Kurse abweichend**, 5.107 → 5.111
  Kerzen, davon **5.085 mit Eröffnung (99,5 %)**.
  **OFFEN und frei zu nehmen: der Vollauf.** `node tools/massive-tagesdaten.js 1116
  --erneuern`, ~4 h. Nicht gestartet — er wartete auf die PM-Freigabe, und der PM ist
  nicht mehr erreichbar. Abbruch ist gefahrlos, der Fortschritt steht nach jedem Wert
  auf der Platte. Sicherung: `Markt-Dashboard-Daten/massive-sicherung-2026-08-27/`
  (1.164 Dateien) — **erst wegräumen, wenn jemand gegen sie gegengeprüft hat.**
  Übergabe mit Punkt 4: `Markt-Dashboard-Daten/uebergabe/datensammler-2026-08-27-0530.md`.

- **Desingner (Adresse: markt-dashboard-06)** — ⚠ Adress-Korrektur ~02:15: die
  Brücke hat nach ihrem Neustart neue Kürzel vergeben; diese Sitzung hieß gestern
  „markt-dashboard-1d", das Kürzel gehört jetzt einer ANDEREN Sitzung
  (massive-Datenfehler). Nachrichten an den Desingner ab jetzt an
  **markt-dashboard-06**. — **übernimmt die ARCHIV-WACHE** (PM-Zuteilung 27.08. ~02:0x):
  begleitet den Nachlade-Lauf (PIDs 5852/7896, geprüft ~02:05: beide laufen,
  keine `archiv-alarm-*.txt`), misst bis ~03:45 NICHT auf 60m/1d, lässt nach
  Prozessende den Wachhund laufen und meldet Exit-Code + Alarme an den PM.
  Wartezeit: Vorbereitung der zwei Datenfunde (nur lesend, nichts wird geändert).

- **Desingner** — ~~wollte die Scoreboard-Wand nehmen~~ **ZURÜCKGETRETEN nach
  Kollisionsprüfung (27.08. ~01:5x):** beim Ansetzen des ersten Edits lagen bereits
  fremde, uncommittete Hunks im Baum — jemand (Erstzugriff laut Auftrag:
  `markt-dashboard-6c`) baut den Auftrag GERADE (huerdeJetzt() + DepotAPI.kostenHuerde
  in `depot.js`, Zusicherungen in `test-v6.js` nachgezogen — sauber). Ich habe NICHTS
  geschrieben und lasse beide Dateien los. Angeboten: Funktionstest in der isolierten
  Instanz nach ihrem Commit (Testfahrer + zwölf Protokolle liegen bei mir bereit).

- **Desingner (erledigt)** — **#80 Perzentil ist GELIEFERT** (Baustopp 1b davor in `e11d7e9`).
  Eichung: 32.722 Zufallskanäle aus derselben Such-Pipeline (deterministisch,
  `studien/kanal-guete-2026-08-26/eichung.js` + `eichtabelle.json`) — **der
  Rauschen-Median liegt je Fensterlänge bei 75–94, der #80-Befund (75) war also
  noch geschmeichelt.** Anzeige überall „besser als X % des Zufalls" (Explorer
  beide Kanalarten inkl. Bild-Labels und Deckkraft, Strategie-Chart-Kontext,
  Info-Text); interne Auswahl unverändert in Roh-Güte (beweisbar gleiche
  Kanäle); Monitor-Score heißt jetzt „Pendel" (B1 — nicht umgestellt, Rauschen
  dafür nie gemessen). test-channel Nr. 19 prüft den Nullpunkt (Zufall → Median
  43 %, sauberer Trend → 100 %). npm test grün, ui-probe grün, Funktionstest am
  echten AAPL-Chart (10 Tooltips Perzentil, 0 Alt-Güte).

- **Berechnungen** (27.08. 00:45) — **Docht-Empfindlichkeitsmessung übernommen**
  (Auftrag »hebt sich der Docht-Effekt im Überschuss auf?«): baut eigenen Treiber unter
  `studien/docht-empfindlichkeit-2026-08-27/` (überschreibt KEINE Protokolle gleichen
  Datums — die messen.js-Falle ist bekannt), Lauf erst nach Wachhund-Freigabe (~03:40,
  Exit 2 = nicht messen). Vergleichsmaßstab wird vor dem Lauf festgeschrieben.
  Danach: Strang-A-Vorregistrierung nach F1=1a/F2=2c/F3=3a (bauen ja, Lauf blockiert
  bis Datenfunde + ~20 Aktienrunden). Belegt nur neue Dateien unter `studien/`.

- **Berechnungen** — **Verzerrungsrichtung FERTIG gemessen (26.08. ~22:2x):**
  erstes belegtes Richtungsurteil — **das Überlebenden-Archiv beschönigt die
  Dip-Familie** (Dip-Rutsch-Zwilling c = −3,78 Pp, t = −6,19, 450 Paartage; Sockel
  nur −0,15). **Für rsi2seit-mcp materiell** (ΔB −0,48 Pp ≥ 6× dessen delta80, unter
  Ü1-Vorbehalt); kapitulation/monatsende im Fenster unerheblich; Monatsende ohne
  messbare Richtung. Wächter alle grün (Positivkontrolle 0,903). Gilt fürs Fenster
  2024-08→2026-08, NICHT für 2008/09. Vollständig: `studien/verzerrungsrichtung-
  2026-08-26/ERGEBNIS.md` + Vorregistrierung mit Nachträgen 9–12. Kohortenlauf auf
  Wilhelms »weiter«, nachdem der PM-Chat zwei Anfragen nicht beantwortete (Warnsignal:
  pm-lebt.txt steht seit 18:06). **Nächster Auftrag laut Freigabe-Reihenfolge:
  Strang A (momentum), eigene Vorregistrierung folgt.** Belegt nur `studien/`-Dateien.

- **App-Codebase Master** — **Stufe F (3) erledigt** (`779c02c`), Übergabe liegt im
  Briefkasten. Erst gemessen (neue Sonde `tools/a11y-probe.js`), dann repariert:
  **hell 23 Befunde, dunkel 8 → beide null**, bei MEHR geprüften Textstellen als vorher
  (1.757 gegen 1.681) — das Grün kommt nicht vom Wegsehen. Sechs Farbmarken lagen unter
  der Lesbarkeitsschwelle 4,5, schlechtester Fall 3,41. Eine Tabelle hatte keine
  Kopfzelle (Regelkopf unter Strategien).
  **Zwei der vier Punkte im Plan bestätigen sich NICHT** — kein aria-live-Bereich ist zu
  breit, kein positiver tabindex, kein namenloses anspringbares Element. Bitte nicht
  „reparieren", das wäre ein Eingriff in Funktionierendes.
  **Offen und in der Übergabe benannt (Punkt 4): die Fokusreihenfolge IN DIALOGEN ist
  nicht gemessen** — die Sonde öffnet keine. Einer der vier Punkte steht also aus.
  Nichts belegt, frei für den nächsten Auftrag.

- **App-Codebase Master** — war seit **15:15 am `ausstieg`-Schalter** (PM zugeteilt,
  belegt `studien/messmaschine/messmaschine.js`). **V4 wurde ausdrücklich NICHT zugeteilt** —
  Begründung unter „Richtigstellung" oben.

- **App-Codebase Master** — **Kursarchiv erledigt.** Beide Archive stehen auf dem
  25.08., Rückstand **0 Handelstage, 100 % der Reihen** (Wachhund Exit 0). 60m: 2.913
  Reihen, 14,78 Mio Kerzen, 3 ohne Daten. Tagesarchiv danach, 15:06 fertig.
  **Befund: es gab nie eine Spiegelung** — kein Skript, keine Windows-Aufgabe, kein
  Aufrufer im Repo. Der Lauf, der alle 2.887 Dateien schrieb, war meine #85-Bereinigung.
  Die Falle war die Stille: ohne den Aktualisieren-Schalter meldet das Werkzeug
  „Nichts zu tun" und geht mit Erfolg aus. Repariert ist die Stille (ad4e6a8), nicht
  der Lauf.
  **Offen als ENTSCHEIDUNG, nicht als Reparatur: #96** — Yahoo hängt jeder Stundenreihe
  eine flache 20:00-Kerze mit Umsatz 0 an (147 von 147 in der Stichprobe). Das
  Tagesarchiv ist nicht betroffen (echte Umsätze). Filterregel bewusst NICHT gebaut:
  61 echte Nullumsatz-Stunden liegen am Schluss verkürzter Sitzungen und würden von
  einer zu weiten Regel gelöscht.
  Frei für den nächsten Auftrag.

*(Die zweite Master-Zeile zur Neumessung ist am 26.08. 11:40 entfallen — der Lauf ist
fertig, siehe „Stand" oben.)*

> ### ✅ SPERRE AUFGEHOBEN — die Neumessung ist fertig (PM, 26.08. 11:15)
> Die Sperre auf `studien/messmaschine/messmaschine.js` galt nur, solange gemessen wurde.
> Alle zwölf Protokolle liegen; der PM hat in jeder Datei nachgesehen, dass sie **denselben**
> `codeStand 6a7d9e29db6f` und dieselbe Version **1.2.0** trägt — die Sperre hat belegbar
> gehalten. **Damit ist der `ausstieg`-Schalter frei** (Wilhelm hatte ihn 09:00 mit 2a
> freigegeben, er hing nur an dieser Sperre). Die zweite Bedingung bleibt bestehen: an allen
> drei Stellen zugleich — Signal, Kontrolltopf, Placebo. Ebenso frei: **#92** und die
> Konsolenzeile `messen.js:95`.

---

## Analytiker

- **27.08. (PM-Auftrag Probeabruf, ~10:45)** — **JA: der vorhandene massive.key schaltet Splits UND Dividenden frei** (10 lesende Abrufe, beide Kontrollen bestanden: AAPL feuert mit 5 Splits bis 1987, ARM korrekt leer). **Alle fünf Versatz-Reihen beziffert entschieden:** RGR → 1d stimmt, 60m vor dem 24.10.2025 um Faktor 2,674 zu hoch OHNE jedes Ereignis (0 Splits in der Firmengeschichte); WHLR → 60m stimmt, 1d hat den heutigen 4:1-Reverse-Split in die Historie bis 25.08. eingearbeitet, den 26.08. aber roh gelassen; BYND → 60m stimmt, 1d-Historie blieb nach dem 30:1-Split (14.08.) auf alter Skala, die QS-Flip-Flops sind dem Ereignis zugeordnet; SITC → 60m stimmt nach System-Konvention, 1d um 3,361 rückangepasst, das Ereignis (01.10.2024, vermutl. Spin-off) steht NICHT in Splits/Dividenden; B → keine Versatz-Frage, sondern **Ticker-Neuvergabe** (Dividendenreihe bricht: 0,16er-Serie endet 22.08.2024, neue ab 30.05.2025 — zwei Firmen unter einem Kürzel). **Neufund: die Fehlrichtung ist je Reihe verschieden — eine pauschale Reparatur hätte mindestens eine Reihe falsch herum angefasst.** S2/S4 damit für 0 € arbeitsfähig. Details `studien/analytiker/2026-08-27/BEFUND-MASSIVE-PROBE.md`.
- **27.08. (Wilhelm-Auftrag, ~10:00)** — **Anbieter-Vorlage für historische Tageskurse liegt:** `studien/analytiker/2026-08-27/ANBIETER-VORLAGE-TAGESKURSE.md`. Sieben Anbieter mit Fundstellen zu allen vier Spalten (Historie, Anpassungsstand/Rohkurse, Preis/Gratisstufe, Abgemeldete), nichts angemeldet, „unklar" wo nicht belegbar (Tiingo-EOD-Abgemeldete, Alpha-Vantage-Abgemeldeten-Kurse, Norgate- und Sharadar-Preise). Kernbefunde: **der vorhandene Massive-Schlüssel könnte für die Split-Ereignis-Gegenprobe (S2/S4) schon reichen** — Free-Tier führt laut Preisseite Corporate Actions, ein lesender Probeabruf über RGR/SITC/B/WHLR/BYND würde es klären; für Abgemeldete in der Breite (S3) stehen nur Norgate Platinum/Diamond (ab 1990/1950) und Sharadar belegt da, beide ohne statische Preisangabe; Databento fällt aus (Kurse erst ab 2018); polygon.io firmiert jetzt als massive.com.
- **27.08. (PM-Auftrag, ~09:15)** — zwei Nachzählungen auf PM-Zuruf, beide erledigt: **(1) Datenfund 2 ist erledigt — der 25.08. stimmt jetzt.** 2.910 Reihen gezählt: die 19:30 ist konsolidiert (AAPL trifft alle drei dokumentierten Quellwerte exakt), die stehengebliebene 20:00Z-Kerze (2.870 Reihen, Umsatz 0) trägt zu 99,33 % EXAKT den amtlichen 1d-Tagesschluss (p50/p90-Abweichung 0,0000 %) — sie ist der Schlusskurs, kein eingefrorener Quote-Stempel; Ausreißer WHLR = Skalen-Familie RGR/SITC/B (Faktor exakt 4,0, 1d springt am 26.08. selbst um). **(2) Die 9–12 % C an Halbtagen: Nullbefund bestätigt, unabhängig von der QS-Aufklärung 08:18** — mit Zusatzaggregat D (Sitzung + Schluss-Auktionskerze) fällt C auf 0,00 % auf JEDER Toleranzstufe (20.101 Zellen, 2.878 Reihen); Positivkontrolle: D reproduziert die QS-C-Spalte zahlengenau. Das erhöhte „keins" (35 % bei 1e-4) schrumpft durch D nicht → fehlende Halbstunde, keine Fehlklassifikation. Details `studien/analytiker/2026-08-27/BEFUND-PM-AUFTRAG.md`.
- **27.08. (6. Lauf, 03:15, Nacht)** — archiv1d wurde die ganze Nacht geschrieben (Nachtlauf startete ~1¾ h später als üblich, Sperre lebendig), archiv60m frisch; **kein Fund**. D vollständig über die 12 frischen Protokolle: 35 Varianten-Entscheidungen mit eigener Implementierung nachgerechnet — Schwelle, delta80, Urteil, tage80, bestesUrteil überall deckungsgleich; einzige Abweichung erklärt (monatsende-kauf V0 trägt tage80=187 bei 17 Tagen, weil das Protokoll 07:24 UTC gemessen wurde und die 30-Tage-Schranke erst 20:11 UTC in Maschine 1.5.0 kam; UI überspringt nicht-messbar → dringt nicht nach außen). A/C bestanden (PROTOKOLL_KANTE-Nachbau deckungsgleich, alle Mode-Wechsel laufen durch applySetup, ≥261 Kerzen live erzwungen), B ersatzweise (12 Protokoll-Placebos nach der placeboOk-Regel unabhängig nachgerechnet, alle bestanden), E: Kostenmessung steht weiter bei 1 Runde — am Handelstag 26.08. kam KEINE neue dazu; steht sie morgen Nacht immer noch, obwohl die App lief, ist der Messbetrieb tot (dann Fund). 3 offene Vorregistrierungen warten auf archiv1d; Strang A misst die Rolle Berechnungen selbst — nicht hineingemessen. Details `studien/analytiker/2026-08-27/BEFUND.md`. Nächste Nacht: F-Punkt 4 (Überlebensverzerrung); D neu erst, wenn frische Tage oder neue Protokolle da sind.
- **26.08. (5. Lauf, ~15:00, nachmittags)** — archiv60m war gesperrt (Nachzieh-Lauf seit 14:13 UTC), deshalb nur A/C/E/F ohne Archive; B/D entfallen, ersatzweise alle 12 Protokoll-Placebos geprüft (|t| ≤ 1,25). A und C bestanden (Kanten-Anzeige unabhängig nachgebaut, ZTHR-Nachbildung geprüft); **2 Funde: #98 (B10-Überlappungs-Wächter toter Code, 0/38 Protokolle, Gattung #86) und #99 (Depot-Reset 25.08. löschte 37/38 Kostenrunden; die 38 Runden sagen 0,0855 % gegen 0,10 % Annahme — konservativ)**; F-Rotation Punkt 3 (Clusterung über Tage) vertieft: Methode trägt, Lag-Einheiten-Wortlaut falsch, aber synthetisch entlastet (Fehlalarme 6,6 % statt 9,1 %), Details `studien/analytiker/2026-08-26-fuenfter-lauf/`; Richtigstellung zum 4. Lauf: „seit fünf Tagen keine Kostenrunde" war falsch. Nächste Nacht: D vollständig über die 12 frischen Protokolle (Sonntags-Regel vorziehen, sobald Archive frei), sonst F-Punkt 4 (Überlebensverzerrung).
- **26.08. (4. Lauf, ~09:00, außerplanmäßig)** — bewusst leicht während der Neumessung (Maschine nicht aufgerufen): die 6 vorliegenden 1.2.0-Protokolle unabhängig nachgerechnet — 17/17 Variantenurteile, delta80 und tage80 exakt bestätigt (#91 wirkt im Feld, alte Formel hätte z. B. 168 statt 224 gesagt), `codeStand 6a7d9e29db6f` einheitlich, alle 6 Protokoll-Placebos |t| ≤ 1,25; C und E unverändert bestanden; **1 Fund gemeldet (#92: `bestesUrteil`-Rangfolge kann `widerlegt` verdecken, `bestaetigt-aber-nullpunkt-verschoben` unrepräsentierbar — latent, aber (1a) macht die Zahl zur maßgeblichen Anzeige)**, Details in `studien/analytiker/2026-08-26-vierter-lauf/BEFUND.md`; nächste Nacht D über die vollständigen 12 frischen Protokolle, sonst F-Rotation Punkt 3 (Clusterung über Tage).

---

## Auditor

*Die Qualitätssicherung der **Oberfläche**: startet die App isoliert, klickt jeden Reiter
und jede Pille, sieht sich die Bildschirmfotos an und meldet, was funktional kaputt (A)
oder optisch entstellt (B) ist. Schwerpunkt sind die Flächen aus der Änderungsmenge seit
dem letzten Lauf, dazu ein Rotationsblock. Repariert wird nichts — das tut eine Bausitzung.*

- **26.08. (2. Lauf, ~09:00)** — geprüft `a502c99..9652f97` (29 Commits; Schwerpunkt: die von sieben auf zehn Spalten gewachsene Bestandstabelle unter Vermögen → Meine Papiere, #83/#89), Rotationsblock `depot`. `npm test` **grün**, `ui-probe` **grün**, 0 unbehandelte Fehler. Erstmals mit **gesätem Testprofil** — der erste Lauf sah genau diese Tabelle nur leer. **0 A**, **2 B** (**#93** Zahl und Einheit brechen bei 1000 px auf zwei Zeilen, `309.90` und `$` untereinander — Regression aus dem Spaltenwachstum; **#94** englisches Zahlenformat statt deutschem und graue statt rote Verluste, während dieselben Werte auf *Heute* deutsch und rot stehen — `U.money`/`U.nf2`/`U.signCls` ungenutzt), **3 C** im Befund. Zwei eigene Funde gegengeprüft und **erledigt**: #90 (Laufband jetzt schiebbar, alle 6 Links erreichbar) und der Dunkel-Blitz (Stufe F Punkt 1, `thema.js` greift). Beide B-Funde stecken in der ausgelieferten **v8.33.3**. Details in `studien/auditor/2026-08-26-lauf2/BEFUND.md`. Nächster Rotationspunkt: **messung**.
- **26.08. (3. Lauf, ~17:00)** — geprüft `9652f97..d964891` (49 Commits; Oberflächen-Dateien: `index.html`, `depot.js`, `bestandui.js`; Schwerpunkt: der umgezogene Depotverlauf-Kopf `#eqPanel`→`#eqKopf`, der `<th scope="row">`-Umbau im Regelkopf und die neue Urteilswahl nach Protokoll), Rotationsblock `messung`. `npm test` **grün**, `ui-probe` **grün**, `a11y-probe` in **beiden** Themen grün (Stufe F (3) trägt), 0 Seiten- und 0 Konsolenfehler. Erstmals mit **gesätem Datenordner** — ohne Messprotokolle läuft der Kern dieser Änderungsmenge ins Leere. **1 A**, **3 B**, **2 C**. **#100 (A)**: der Beleg im Regelkopf sieht die Protokolle nie — `kantenAusProtokollen()` ruft danach nur `huerdeAnzeigen()`, nicht `regelKopfAnzeigen()`; die Zeile behauptet „Kein Messprotokoll im Datenordner", während die Hürde sechs Zeilen tiefer das Protokoll vom 26.08. zeigt. **Damit ist Wilhelms Entscheid 2b (Hinweis bei „nicht bestätigt") in v8.33.4 ausgeliefert, aber in der Anzeige tot** — Ursache älter als die Änderungsmenge, nicht deren Regression. **#101 (B)** „Max. Rücksetzer" trägt `class="down"`, aber `.down` ist nur unter `#cockpit` definiert — Verlust steht schwarz (gemessen `rgb(11,11,11)` statt `rgb(208,59,59)`). **#102 (B)** roher Schlüssel `nicht-bestaetigt` in der Kostenhürde, während das Scoreboard „nicht bestätigt" schreibt; `scoreboard.js` hat `label()` dafür, exportiert sie aber nicht. **#103 (B)** Regression aus 779c02c: der `<th>`-Umbau zieht `text-transform`/`letter-spacing`/`font-size` aus `table.tbl th` mit — Zeilenköpfe in Großbuchstaben, und unter der letzten Zeile bleibt ein 130 px langer Reststrich. Eigene Funde der Vornacht gegengeprüft und **erledigt**: **#93** (alle Zahlzellen bei 1000 px einzeilig) und **#94** (deutsche Schreibweise, Verluste rot). Details in `studien/auditor/2026-08-26-lauf3/BEFUND.md`. Nächster Rotationspunkt: **strategien**.
- **27.08. (Nacht, ~01:00)** — geprüft `d964891..04c9be5` (117 Commits; Oberflächen-Dateien: `scoreboard.js` +244, `archivkarte.js` **neu**, `index.html`, `depot.js`, `explorer.js`, `quant.js`, `strategien.js`, `strategiechart.js`; Schwerpunkte: die zwei neuen Scoreboard-Spalten Feinheit/Aussicht mit der Auflösungswand an der **Live**-Kostenhürde, die neue Pille *Werkzeuge → Kursarchiv*, das Güte-Perzentil #80), Rotationsblock `strategien`. `npm test` **grün**, `ui-probe` **grün** (5 Reiter, 17 Pillen), 0 Seiten- und 0 Konsolenfehler über 44 Flächenbesuche in zwei Fenstergrößen, gesäter Datenordner (38 Protokolle). **1 A**, **3 B**, **5 C**. **#105 (A)**: das Messband auf *Vermögen → Depot* rechnet mit fest verdrahteter Kostenhürde (`messband.js:27`, 0,10 Pp), während das Scoreboard seit `6c790c8` `DepotAPI.kostenHuerde()` benutzt — in der Voreinstellung ergeben beide zufällig 0,100 Pp, mit umgestelltem Produkt gemessen 0,100 gegen **0,0665**: die Wand wandert mit (Satz 0,183 → 0,077 Pp, `rsi2seit-mcp` rutscht dahinter), das Messband nicht. **Wilhelms Auflage zur Wand trägt also nachweislich** — die Zweitwahrheit steht daneben. **#106 (B)** roher Schlüssel `nicht-entscheidbar` auf zwei weiteren Flächen (`strategien.js:260`, `messband.js:143`/`:159`) — dieselbe Protokollzahl wird in der App **vierfach verschieden** geschrieben, zwei davon in benachbarten Pillen desselben Reiters; die nicht mitreparierte Hälfte von #102. **#107 (B)** `class="num"` (`scoreboard.js`, 14×) hat im ganzen Repo **keine** CSS-Regel und `class="zahl"` (`archivkarte.js`) gilt nur unter `#bestandTabelle` — sieben Scoreboard-Spalten und zwei Archiv-Spalten stehen linksbündig unter rechtsbündigen Köpfen, am stärksten bei den zwei **neuen** Spalten. **#108 (B)** englische Dezimalschreibweise: sechs Zahlen im Messband plus `1.2 s` in der Kursarchiv-Karte, dieselbe Substanz wie das reparierte #94. In Ordnung befunden: Scoreboard-Struktur (10 Spalten in Kopf und jeder Zeile, keine Rollbalken), beide Trennzeilen mit stimmigen Zahlen, die Kursarchiv-Karte mit **erklärtem** Leerzustand, #103 hält, und #80 mit Positivkontrolle nachgemessen (8 Fensterklassen × 101 Güten, 0 Ausreißer, monoton). Eigener Nullbefund korrigiert: die erste Probe meldete für #80 „fehlt", weil sie nach `window.Q` statt `window.Quant` fragte. Details in `studien/auditor/2026-08-27/BEFUND.md`. Nächster Rotationspunkt: **werkzeuge**.
- **27.08. (Nachtrag, 08:15–08:50, Auftrag des PM)** — **Gegenprobe am ausgelieferten Artefakt statt an der Historie.** Mein Satz „alle vier Funde stecken in `v8.34.0`" ist **zurückgezogen**: er beruhte auf `merge-base --is-ancestor`, und dieser Test ist tautologisch — ein Prüfstand ist immer Vorfahr des Release, das Kriterium galt für alles und trennte nichts (gefunden von der Issue-Wache). Richtig gemessen am Paket `build-clean/dist/win-unpacked/resources/app.asar` (gebaut 08:01, `package.json` = 8.34.0): **sechs Oberflächen-Dateien byteweise identisch mit dem Tag** — der Tag verspricht nichts, was das Paket nicht enthält. **#106 und #107 sind in `v8.34.0` repariert und am laufenden Programm bestätigt** (0 rohe Urteils-Schlüssel; 84 + 6 Zahlzellen, davon **0** nicht rechtsbündig, in **beiden** Themen). **#105 steht dort mit Absicht** und wartet auf Wilhelms Entscheid. **Neu: #108 ist unvollständig repariert und ausgeliefert** — `messband.js:144/159/184` tragen weiter `toFixed`, sichtbar als `t = 0.83`, `Auflösung 0.1310` und **`0.10` acht Zeilen unter dem reparierten `0,10` derselben Kostenhürde**; an #108 kommentiert mit dem Vorschlag, dort wieder zu öffnen. **Dunkles Thema geprüft:** #101 hält (`+7,3 %` grün, `−7,2 %` rot, Tokenwerte des dunklen Themas), #107 identisch zum hellen, Kontrast auf der Depot-Ansicht 0 unter der WCAG-Grenze **mit funktionierender Positivkontrolle**. **Nicht belegt und nicht zitierfähig:** der breite Kontrast-Durchlauf über alle Reiter — er lief mit einem Prüfer, der `position: fixed` stillschweigend übersprang. **Drei eigene Fehler festgehalten** (Befund N4): sechs Kerndateien im geteilten Baum durch `asar extract-file` gelöscht und sofort per `git checkout --` wiederhergestellt (nichts verloren, ~90 s sichtbar); ein Nullbefund aus dem falschen Klassennamen (`.down/.up` statt `pos/neg` seit der #101-Reparatur); ein Prüfer mit stillem blindem Fleck. **Zwei Funde außerhalb meiner Rolle weitergegeben:** die **installierte** App ist noch `8.33.5` (asar vom 26.08. 17:14) — die Reparaturen sind am Bildschirm des Anwenders nicht angekommen; und `dist/bau-stand.json` fehlt, ohne die `--hoch` nach `tools/release.js:154` abbricht. Details in `studien/auditor/2026-08-27/BEFUND.md`, Abschnitt „NACHTRAG".
---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*


- **27.08.2026, ~01:30 (PM-Chat, Klick-Formular) — PM-Adresse: beim Kürzel bleiben.**
  Der PM bleibt unter `markt-dashboard-91 [779ff5]` erreichbar; kein Neuanlegen der
  Sitzung. Die Tafel-Zeile mit der Meldeadresse bleibt stehen, bis sich das je ändert.

- **27.08.2026, ~00:55 (PM-Chat, Klick-Formular) — drei Entscheide:**

  **(1) Scoreboard-Wand misst an der LIVE-HÜRDE** (`kostenHuerdePp`, `depot.js:451`) —
  gegen die PM-Empfehlung (größte statische Hürde), bewusst gewählt. **Auflage aus der
  Vorarbeit der Werkzeug-Sitzung, jetzt bindend:** die Anzeige muss **dazusagen, mit
  welchem Produkt und welcher Haltedauer** gerechnet wurde, sonst wandert die Wand
  unerklärt mit jeder Einstellung (Fehlerfamilie vom 23.08.). Technisch nötig:
  `DepotAPI` (`depot.js:4046`) braucht einen Lesezugriff auf die Hürde — gibt es noch
  nicht; `delta80` liegt als **Bruch** in `entscheidungen[i].ergebnis.delta80`
  (×100 = Pp), die Anzeige rechnet selbst um.

  **(2) Strang A, F2 = 2c: die Kostenhürde für momentum kommt aus der laufenden
  Kostenmessung des Demo-Kontos** — nicht aus einer Annahme. Folge: die
  Vorregistrierung fixiert die **Regel** („Hürde = gemessenes Mittel der Aktienrunden
  bei Urteilsreife"), nicht die Zahl. **Damit wird die Trennung der Kostenmessung nach
  Anlageklasse zum Blocker für Strang A** — der Beleg ist heute zu 58 % Krypto, gebraucht
  werden ~20 **Aktien**runden.

  **(3) Strang A, F3 = 3a: Referenzmessung außer Konkurrenz.** Die Zulassungsregel
  (Effekt ≥ Kostenhürde) gilt; momentum wird als Alt-Auftrag sauber zu Ende gemessen
  und überall so beschriftet — es ist kein Kandidat. (F1 = 1a hatte der PM bereits
  entschieden: Teil 1 wird als Referenzmessung gebaut.)
- **26.08.2026, 21:15 (PM-Chat, Formular) — drei Richtungsentscheide:**

  **(1) #80 Kanal-Güte → Weg 2, das Perzentil.** „Enger als 91 % des Zufalls" statt
  „Güte 82/100". **Der teuerste der drei Wege, bewusst gewählt** — nicht der kleine
  Zusatz (Weg 1), nicht die Rangfolge (Weg 3). Was dranhängt: die versteckten Schwellen
  müssen mit umgeeicht werden, sonst ändert sich still, welche Kanäle erscheinen.
  Auftrag steht oben.

  **(2) Strang C → erst Bestandsaufnahme.** Erheben, wo die Produktannahme im Code
  steckt, Liste vorlegen; erst danach umstellen. Nicht sofort, nicht später.

  **(3) Die zwei Datenfunde → sofort beheben, vor allem anderen.** Phantom-Dochte und
  der unfertig eingefrorene 25.08. gehen vor das Release. Nicht nur ausweisen, nicht
  vertagen.

- **26.08.2026, 20:25/20:30 (PM-Chat, Formular) — drei Entscheidungen:**
  **(a) Minutenkerzen:** der PM holt sie nach Börsenschluss selbst nach. Der Stopp um
  20:09 war richtig (laufende US-Sitzung erzeugt Teilkerzen), die Begründung „der
  22:15-Lauf holt sie dann" war **falsch** — `tools/archiv-nachladen.js:68-69` holt nur
  60m und 1d, keine Intraday-Intervalle.
  **(b) Release wartet auf die Schranken-Reparatur**, nicht jetzt ausliefern.
  **(c) Die Eintrittskarte misst künftig `delta80` gegen die Kostenhürde** statt
  Handelstage. *Nachträglich bestätigt durch den A-Fund von 21:05: `tage80` zählt
  **Signaltage**, die Schranke verglich **Handelstage** — 187 Signaltage sind rund 4.016
  Handelstage. Die Entscheidung war richtiger, als zum Zeitpunkt bekannt war.*

- **26.08.2026, abends (PM-Chat) — die QS/Audit legt ihre Funde selbst als GitHub-Issues
  an und benachrichtigt den PM.** Wilhelm: „beides bitte als issue und dich
  benachrichtigen" — auf die zwei A-Funde des Abends (#96-Regel gestoppt,
  Kostenannahme-Beleg zu 58 % Krypto). Gilt ab jetzt allgemein für A- und B-Funde der
  QS; ihre übrigen Grenzen (prüfen und melden, nicht bauen, keine Version) bleiben.

- **26.08.2026, abends (PM-Chat) — Routinen aufgeräumt, Chats in Dauerbereitschaft.**
  Wilhelms Anordnung an den neuen PM-Chat: `literatur-recherche-uebernacht` und
  `projekt-manager-abruf` gelöscht (redundant), PM-Routine als Notstart umgeschrieben,
  Release-Wache baut künftig im Hintergrundkommando; Chat-Sitzungen halten sich nach
  Abschluss mit `sleep 600` wach (Details im Nachtrag 19:45 oben).

- **26.08.2026, 19:05 — die Issue-Wache läuft nur noch 8, 13 und 15 Uhr.**
  Vorher alle 30 Minuten, also 48 Läufe am Tag. Wilhelms Anweisung, nachdem die CPU auf
  97 % stand.
  **Der gemessene Grund:** 85 Claude-Prozesse liefen, **genau eine Sitzung arbeitete
  wirklich.** Jeder abgeschlossene Routine-Lauf lässt seinen Prozess stehen — rund 5 % CPU
  und 370 MB, dauerhaft. 85 × 5 % ÷ 16 Kerne = **96 %**, exakt die gemessene Last. Neun der
  Leichen waren von der Issue-Wache, dreizehn von der Release-Wache.
  **Sie hatte den längeren Takt selbst vorgeschlagen** (Übergabe 17:32): seit sie nur noch
  sichtet, ist Leerlauf der Normalfall.
  **Folge für alle Rollen:** Ein abgeschlossener Lauf ist nicht kostenlos. Wer einen Takt
  entwirft, rechnet die Prozesse mit, die er hinterlässt.

- **26.08.2026, 18:55 — #96: die Platzhalterkerze wird verworfen.**
  Wilhelm: *„müssen wir beheben wir brauchen alle kerzen keine platzhalter"*.
  Sein Satz sagt beides: **Platzhalter raus, alle echten Kerzen bleiben.** Nicht (b)
  stehen lassen, nicht (c) auf einen Feiertagskalender warten.
  **Die Gefahr liegt in der Bedingung, nicht im Auftrag** — eine Regel, die Kerzen
  wegwirft, löscht bei falschem Zuschnitt echte Daten, und zwar unwiederbringlich.
  Auftrag mit fünf Auflagen siehe oben.

- **26.08.2026, 17:40 — drei Entscheidungen: „c (schau mal was das kosten würde), b und d, a"**

  **(C) Überlebenslücke → (c): erst die Richtung der Verzerrung messen.** Nicht Daten
  kaufen, nicht die Lücke bloß ausweisen. Gemessen wird auf den **1.164 bereits
  beschafften Verschwundenen**: wie stark und in welche Richtung verzerrt die Lücke?
  *Wilhelm will zusätzlich die Kosten einer bezahlten Quelle wissen — als Information für
  später, nicht als Kaufauftrag.* Kostenschätzung siehe unten.

  **(1) → (b) UND (d).**
  **(b)** Die Aussicht je Strategie wird angezeigt, und wer mehr als rund 2.500
  Handelstage braucht, wandert in einen eigenen Abschnitt „nicht entscheidbar mit diesen
  Daten". **Wählbar bleibt alles** — Hinweis, kein Eingriff.
  **(d)** Künftig werden **nur noch Kandidaten entworfen, deren Aussicht vorab unter
  1.000 Handelstagen liegt.** Das ist eine Regel für den Strategie-Tüftler und gilt ab
  sofort — die Wand wird zur Eintrittskarte statt zur Nachbemerkung.

  **(2) → (a): das schärfste Urteil gewinnt immer.** `widerlegt` schlägt alles andere;
  `bestaetigt-aber-nullpunkt-verschoben` gehört in die Rangfolge aufgenommen. Kein
  zusätzlicher Uneinigkeits-Hinweis (das wäre (b) gewesen), kein Vertagen (c).
  Das ist **#92**, `messmaschine.js:1305`.

- **26.08.2026, 18:35 — der große Plan ist angenommen, das Abbruchkriterium verschärft.**
  Wilhelm zu allen drei Vorlagen: **„ja, ja, ja"** —
  (1) **Strang A** (`momentum` nicht überlappend messen) wird angefangen.
  (2) **Basiswert statt Schein** als Regelfall — der stärkste Einzelhebel.
  (3) Das **Abbruchkriterium** gilt, **aber nicht so, wie der PM es vorgeschlagen hatte.**
  Wörtlich: *„nach messverfahrensprüfung und gegenprobe mit ideenfindung warum es nicht
  geklappt haben könnte, wenn dann immernoch nichts bei rumkommt ist das wohl das
  abbruchkriterium, ich will zu 100 % sicher sein nicht zu 99,9"*.
  **Vor jedem Abbruch drei Stufen:** Messverfahren prüfen (Placebo, Nullpunkt,
  Kontrolltopf, Live-gleich-Messung) → Gegenprobe mit Ideenfindung, *warum die Messung
  eine vorhandene Kante übersehen haben könnte* (Wand, Überlebenslücke, geteilte Kurse,
  Haltedauer, Kosten, Produkt, Zeitzonen, Universum, Testfamilie, Regime) → erst dann Ende.
  **Der Vorschlag des PM war zu billig** und hätte einen Abbruch erlaubt, dessen wahrer
  Grund ein kaputtes Messgerät ist. Ausführlich in `studien/grosser-plan-2026-08-26/PLAN.md`,
  Teil IV-a.
  **Abgeleitete Reihenfolge, vom PM vorgelegt:** Datenqualität → Strang A → Strang B.
  Strang A auf einem Universum zu messen, dem 12,7 % Nicht-Überlebende fehlen, erzeugt ein
  Ergebnis, das Stufe 2 ohnehin wieder einkassiert.

- **26.08.2026, 15:30 — Frage (4): das Kursarchiv lädt künftig von selbst nach.**
  Wilhelm: *„Dann lass uns doch erst 4 vervollständigen oder?"* → **(a) tägliche
  Aufgabe**, und sie hat **Vorrang vor den offenen Fragen (1) und (2)**. Nicht (b) nur
  melden, nicht (c) von Hand.
  Der PM hatte (a) empfohlen: (b) verlegt nur den Handgriff, und der ist zweimal zwei
  Tage lang ausgeblieben; (c) ist genau der Zustand, der die zwei Tage gekostet hat.
  **Umsetzung siehe Auftrag „tägliche Nachladung" oben.** Die Aufgabe selbst legt der PM
  an, sobald der Master das Kommando erprobt gemeldet hat — nicht vorher, denn eine
  falsch eingerichtete tägliche Aufgabe erzeugt genau wieder die Stille, die gerade
  repariert wurde.

- **26.08.2026 (Abruf-Bericht, von Wilhelm von Hand gestartet) — „1a 2b 3a“**
  (1) *Die Oberflaeche zeigt unter mehreren Messvarianten die bestaussehende statt das
  Urteil des Protokolls — wann reparieren?* → **(a) kleiner Auftrag direkt nach dem
  Rechenlauf, vor der Auslieferung.** So empfohlen; die Alternative waere gewesen, ihn
  parallel auf eigenem Zweig zu bauen (b) oder hinten anzustellen (c).
  (2) *`kapitulation` steht jetzt auf „nicht bestaetigt“ und ist im Autopilot weiter
  waehlbar — was tun?* → **(b) waehlbar lassen, aber Warnhinweis davor.** Nicht (c) aus
  der Auswahl nehmen, nicht (a) unveraendert lassen. Der PM hatte (b) empfohlen.
  (3) *Stufe F (2), ein einziger Chart-Renderer — wie entscheiden?* → **(a) erst eine
  Liste der betroffenen Darstellungen, dann der Entscheid.** Nicht (b) folgenfrei
  zusammenlegen, nicht (c) streichen. **Der Entscheid selbst steht damit weiter aus**;
  Stufe F (2) und (3) bleiben gesperrt.
  Umsetzung aller drei siehe „Neu freigegeben“ oben.
  **Nachtrag, gleiche Sitzung:** (3a) geht an den **Desingner** — Wilhelms Vorschlag, vom
  PM uebernommen: die Frage „was ginge verloren“ ist eine Gestaltungsfrage, und die
  Sitzung kollidiert mit niemandem.
  **Nachtrag 3, Stufe F (2) — der Entscheid selbst, nach Vorlage der Liste:**
  *Ein einziger Chart-Zeichner — zusammenlegen oder nicht?* → **(b) nur die Doppelung
  raeumen.** Nicht (a) alles lassen, nicht (c) zusaetzlich die Mini-Kurven einschmelzen,
  **nicht (d) voll zusammenlegen.** Der PM hatte (b) empfohlen, mit (c) als naechstem
  Schritt und einer ausdruecklichen Warnung vor (d): der Explorer-Chart ist Wilhelms
  bestes Werkzeug, und (d) haette ihn fuer Pflegeleichtigkeit riskiert, die einem
  Auftraggeber nichts einbringt.
  **Folge, vom PM abgeleitet und hiermit vorgelegt:** damit ist **Stufe F (3)
  (Barrierefreiheit) nicht mehr gesperrt** — sie hing nur hinter F (2). Sie steht jetzt
  als frei in der Stufentabelle. Wilhelm kann das mit einer Zeile zurueckdrehen.
  Umsetzung siehe „FREI — die doppelte Depotkurve raeumen" oben.

  **Nachtrag 2, Reihenfolge:** *(1a) vor oder nach der Auslieferung?* → **(b) erst
  ausliefern, dann (1a).** Wilhelm: „b, es ist bereits geschehen" — die Wache war zu dem
  Zeitpunkt schon gelaufen, `v8.33.3` ist draussen. Der PM hatte (b) empfohlen, nachdem
  seine eigene Begruendung fuer (a) sich als falsch erwiesen hatte; der Vorschlag kam
  urspruenglich vom Master.
  **Ebenfalls Nachtrag:** das erste Beispiel des PM zu (1a) war falsch (`kapitulation` ist
  nicht betroffen). Vom Master gefunden, vom PM ueber alle 26 Protokolle nachgeprueft.
  Der Fehler bleibt echt, betrifft aber genau `winkelbestaetigt-2026-08-25`. **Damit steht
  Wilhelms Reihenfolge „vor der Auslieferung“ auf einer hinfaelligen Begruendung und
  wurde ihm erneut vorgelegt.**

- **26.08.2026, 09:00 (drei Antworten auf den 08:10-Bericht) — „1a 2a 3a los!"**
  (1) *Release jetzt oder nach den Reparaturen bündeln?* → **(a) sofort ausliefern.**
  Der PM hatte (b) empfohlen (eine Stunde warten, alles zusammen); Wilhelm will es jetzt.
  Umsetzung siehe „An die Release-Wache" oben — der Rechenlauf hält den Arbeitsbaum
  gerade schmutzig, deshalb ist der Startschuss der erste saubere Baum danach.
  Die Wache startet **Wilhelm selbst** („nur von Hand"), keine Sitzung und nicht der PM.
  (2) *`ausstieg`-Schalter jetzt bauen?* → **(a) ja, jetzt, parallel.** Auf eigenem
  Zweig, weil die Neumessung dieselbe Datei liest.
  (3) *Auktionskosten am Demo-Konto messen?* → **(a) ja.**

- **26.08.2026, 01:40 — Release jetzt.** → **(a) Jetzt ausliefern.**
  Nicht ausgeführt, weil die Wache nur von Hand läuft. Am 26.08. 09:00 bestätigt und
  erneuert (siehe oben).

- **26.08.2026, ~01:45 — die Issue-Wache ist zurück, aber als TRIAGE.** Sie war
  unbemerkt aus der Aufgabenliste verschwunden (mindestens zum zweiten Mal); #83 und #89
  lagen deshalb über vier Stunden unbeachtet. Wilhelm wollte sie in der Cloud neu anlegen
  und an „neues Issue" binden. **Das ist nicht baubar:** die Schnittstelle verlangt eine
  Cloud-Umgebung (`ccr.environment_id`), die an das Repo gebunden ist; auf diesem Rechner
  ist keine hinterlegt, und einrichten kann sie nur Wilhelm selbst. Er hat entschieden,
  **das vorerst zu lassen**. Stattdessen läuft sie wieder **lokal alle 30 Minuten**.
  Sie **baut nichts und liefert nichts aus**: sie sichtet, ordnet ein, antwortet
  freundlich auf Deutsch und lässt Issues offen; schließen darf sie nur nachweislich
  Erledigtes und exakte Doppel. Sie schreibt auch **nicht** auf diese Tafel.
- **26.08.2026, ~01:45** — Neue Aufgabe **`projekt-manager-abruf`**, „nur von Hand".
  Damit kann Wilhelm einen Projektstand abrufen, wann er will. Sie berichtet nur und
  schreibt die Tafel nicht neu — Ausnahme: trifft Wilhelm dabei eine Entscheidung,
  trägt sie diese unter „Entschieden" ein und gibt sie weiter.
- **26.08.2026, ~01:15** — *#83 und #89 widersprachen sich: bleibt unter „Heute" etwas von
  „Meine Papiere" stehen?* → **(b) Unter „Heute" verschwindet der Abschnitt ganz.** Damit
  gilt #89 vor #83. Der PM hatte (a) empfohlen; Wilhelm hat anders entschieden.
  **Folge, mitentschieden:** das überschreibt Felix' Wunsch #71 („Signalstand prominent
  auf Heute") — der Signalstand zog deshalb in die Vermögen-Tabelle um.
- **26.08.2026, 00:45 (drei Antworten)** —
  (1) *Wohin mit #83/#89?* → **sofort erledigen**, nicht hinter die Neumessung stellen.
  (2) *Die „belegt"-Formel in 21 Quellcode-Kommentaren?* → **alle 21 umschreiben.** Der
  PM hatte „stehen lassen" empfohlen; Wilhelm hat anders entschieden.
  (3) *Neumessung: alle vier Vorstufen abwarten oder früher starten?* → **alle vier
  (#85–#88) zuerst.** Erst wenn die Instrumente stimmen, wird gemessen.
- **25.08.2026 (spät)** — Geheimnis `TELEMETRIE_JSON` angelegt; #76 vollständig erledigt.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026 (spät)** — Messmaschine wird versioniert, alle zwölf Strategien werden auf
  dem aktuellen Stand neu gemessen; erst danach neue Untersuchungen.
- **25.08.2026 (spät)** — Neue Rolle **Strategie-Tüftler**: jede Nacht 04:30; bei
  ≥3 wartenden Entwürfen arbeitet er stattdessen am Datenbestand. Misst NIE selbst.
  Übergabe über `studien/tueftler/WARTESCHLANGE.md`.
- **25.08.2026 (spät)** — Neue Rolle **Analytiker**: jede Nacht 03:15, prüft alles,
  meldet per Issue nur bei Fund, sonst eine Zeile hier auf der Tafel.
- **25.08.2026 (abends, 9 Antworten)** — E-Rest: ja. Stufe F: alle drei, Reihenfolge
  Theme → Chart → Barrierefreiheit. Nachbilden-Dialog: Belegstatus rein.
  Handel-aus-Renderer: erst Plan, Bau nur mit zweitem Ja. #80: neu eichen, solange
  Warnhinweis. V4: vorregistrieren. Browser-Zweig: prüfen und einbauen.
  #71/#78/#81: geschlossen. Wünsche: #69 → #82 → #70 → #33.
- **25.08.2026** — Der Projekt-Manager darf Unstrittiges selbst zuteilen; alles, was die
  Handelslogik berührt, neu ist oder Geld kostet, wird vorgelegt.
