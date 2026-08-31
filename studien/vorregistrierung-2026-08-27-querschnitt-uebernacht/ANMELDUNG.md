# Anmeldung: gepaarter Endpunkt für die drei Übernacht-Entwürfe

**27.08.2026, ~21:4x, Strategie-Tüftler. VOR jeder Messung.**
**Entschieden vom PM (`markt-dashboard-f5`) am selben Abend; die vier Auflagen unten sind
seine, nicht meine.**

Gilt für `glockendruck-nacht`, `nachtstoss-umkehr`, `abgabedruck-nacht`.
**Die drei Vorregistrierungen selbst bleiben unverändert.**

Zahlen: `studien/tueftler/2026-08-27-querschnittskontrolle-uebernacht.md` (400er) und
`studien/tueftler/daten/vorhersage-stichprobenskalierung-2026-08-27.md` (1.200er, mit vorab
committeter Vorhersage). Alle Zahlen unten sind aus der **1.200er**-Stichprobe.

Diese Anmeldung erfüllt, was `studien/vorregistrierung-2026-08-25-querschnitt/ERGEBNIS.md`
wörtlich verlangt hat: *„Wer die Frage ‚bringt die Querschnitts-Kontrolle auf Tagesdaten
genug?' beantwortet haben will, muss sie **vorher anmelden**."* **Ihr eigenes Urteil (Median
1,410 über 24 Varianten, JA-Bedingung nicht erfüllt) wird nicht umgedeutet** — es gilt für
ihren Korpus, in dem Übernacht-Quintile auf Tagesdaten nicht vorkommen.

---

## 1. Was gemessen wird

**Zusätzlich** zum registrierten Niveau-Endpunkt (A7-Kontrolle) wird der Überschuss
**gepaart gegen den Rest des zugelassenen Querschnitts desselben Tages** berichtet.

**Gegen den REST, nicht gegen den ganzen Querschnitt** — der enthält die Auswahl, und die
Differenz wäre um den Auswahlanteil gestaucht.

---

## 2. 🔒 Die Vorrangregel — Auflage des PM, und sie steht VOR der Auswertung

> ## **Der gepaarte Endpunkt darf ein NEIN tragen. Er darf NIEMALS ein JA erzeugen.**

**Begründung, und sie ist nicht Vorsicht sondern Bedeutung:** *Wer long geht, verdient
Markt + Kante, **nicht die Differenz**.* Ein gepaartes JA ist eine **Existenzaussage**, kein
Handelsurteil — es kann weitere Arbeit rechtfertigen, es kann keinen Kandidaten freigeben.
**Über JA entscheidet ausschließlich das Niveau.**

**Und die Asymmetrie schließt nebenbei das Loch, das zwei Endpunkte sonst aufreißen:** Steht
nicht vorher fest, welcher Endpunkt bei Widerspruch regiert, sucht sich der Auswertende
hinterher den passenden aus. ***Zwei Endpunkte ohne vorab festgelegte Vorrangregel sind kein
schärferes Werkzeug, sondern zwei Lose.***

| Fall | Urteil |
|---|---|
| Niveau JA, gepaart JA | **JA** |
| Niveau JA, gepaart NEIN | **JA**, mit ausgewiesenem Widerspruch |
| Niveau NEIN, gepaart beliebig | **NEIN** |
| Niveau unentscheidbar, gepaart NEIN | **NEIN, in der engeren Fassung** (siehe 4) |
| Niveau unentscheidbar, gepaart JA | **nicht entscheidbar.** Kein JA. |

---

## 3. Testzahl — die Rechnung, die der PM verlangt hat

**Seine Frage:** *„Wenn der gepaarte Endpunkt kein JA erzeugen kann, ist er für die
JA-Multiplizität möglicherweise gar kein zusätzlicher Test."*

**Antwort: richtig.** Die Bonferroni-Korrektur der JA-Seite kontrolliert die Wahrscheinlichkeit,
**irgendwo** fälschlich einen Effekt zu behaupten. Ein Endpunkt, der bauartbedingt keinen
Effekt behaupten **kann**, trägt zu dieser Familie **null** bei.

> **JA-Familie bleibt bei 6** (3 Entwürfe × 2 Zweige, nur Niveau), `z_krit` = **2,6383**.

| JA-Seite, nur Niveau, Familie 6 | σ | nötige Tage für 0,10 Pp |
|---|---|---|
| `glockendruck-nacht` | 0,8387 | **852** |
| `nachtstoss-umkehr` | 0,8420 | **859** |
| `abgabedruck-nacht` | 0,8428 | **860** |

**Vorhanden 4.678 → Faktor 5,4–5,5.** Unverändert gegenüber der Lage ohne diese Anmeldung.

### Für die NEIN-Seite gilt das NICHT, und ich wähle die strengere Fassung

Ein NEIN ist eine Gleichwertigkeitsaussage („obere Grenze unter der Hürde"). Darf es auf
**einem von zwei** Endpunkten erklärt werden, sind das zwei Gelegenheiten → **Familie 12**,
`z_krit` = **2,8653**.

| NEIN gepaart, Aktienhürde 0,04 Pp | σ gepaart | Familie 6 | **Familie 12** |
|---|---|---|---|
| `glockendruck-nacht` | 0,2251 | 383 | **435** |
| `nachtstoss-umkehr` | 0,2708 | 555 | **630** |
| `abgabedruck-nacht` | 0,2074 | 326 | **369** |

> **→ Es besteht in beiden Fassungen mit Faktor 7–14. Die Wahl der Familienzahl ändert das
> Ergebnis nicht.** **Deshalb wird die strengere genommen: Familie 12 für die NEIN-Seite.**
> *Sie kostet nichts und nimmt ein Argument weg.*

### Und der Grund, warum das überhaupt gebraucht wird

| NEIN auf dem **NIVEAU**, Aktienhürde 0,04 Pp, Familie 6 | nötige Tage |
|---|---|
| `glockendruck-nacht` | **5.324** |
| `nachtstoss-umkehr` | **5.366** |
| `abgabedruck-nacht` | **5.376** |

**Vorhanden 4.678 — alle drei reißen.** *In meinen Vorregistrierungen steht für
`abgabedruck-nacht` „4.651, Faktor 1,006, auf der Kante". Mit der schärferen 1.200er-σ und
familienweiter Korrektur ist es keine Kante mehr, sondern ein klares Reißen.* **Die
Entscheidung, die NEIN-Seite auf die CFD-Hürde (0,10 Pp) zu stellen, war damit richtig und
ist es weiterhin.** Der gepaarte Endpunkt ist der einzige Weg zu einer NEIN-Aussage an der
**Aktien**hürde.

---

## 4. Was ein gepaartes NEIN bedeutet — und was nicht

**Es ist eine engere Aussage als das Niveau-NEIN, und sie muss so berichtet werden:**

> *„Die Auswahl schlägt den Rest des Querschnitts nicht um ≥ 0,04 Pp."*
> **Nicht:** *„Es gibt keine handelbare Kante."*

---

## 5. 📌 Auflagen zum Placebo — vom PM verschärft

### 5.1 Der Placebo-Wert steht in DERSELBEN Tabelle, in Sichtweite des Kandidatenwerts

**Nicht in einer Fußnote, nicht im Fließtext darunter.**

**Der Grund ist belegt:** „zwei validierte Kanten" hat sich in diesem Projekt wochenlang
durch Code, Befunde **und** Gedächtnis weitergetragen, nachdem die Grundlage weg war.
***Eine nackte Zahl reist. Ihre Einschränkung reist nicht mit, wenn sie nicht danebensteht.***

**Die Zahl, um die es geht:**

| Bauform | σ gepaart | **k** |
|---|---|---|
| **`P` — Placebo, Kunstrang ohne jeden Kurs- und Umsatzbezug, null Information** | 0,1883 | **4,425** |
| `abgabedruck-nacht` | 0,2074 | 4,063 |
| `glockendruck-nacht` | 0,2251 | 3,725 |
| `nachtstoss-umkehr` | 0,2708 | 3,109 |

**Der Placebo hat den höchsten Wert von allen.**

### 5.2 Der Faktor bekommt einen Namen, der nicht nach Güte klingt

> ## Er heißt ab hier **Marktzug-Kürzung `k`** — nicht „Schärfe", nicht „Güte", nicht „Auflösungsgewinn".

**`k` misst, wieviel des gemeinsamen Marktzugs sich in der Paarung wegkürzt. Es misst nicht,
ob ein Signal etwas weiß.** *Ein `k` von 4 auf einem Signal ohne Kante ist viermal so scharfes
Nichts.* **Heißt es „Schärfe", kommt das Placebo-Problem durch den Namen zurück — bei jedem,
der die Studie später nur überfliegt.**

### 5.3 Der Placebo läuft in BEIDEN Fassungen mit

Niveau und gepaart, mit ausgewiesenem `k`.

---

## 6. Was ich ausdrücklich NICHT gemessen habe

**Ob überhaupt ein Überschuss da ist — in keiner der beiden Fassungen.** Mein Werkzeug
berechnet grundsätzlich keinen Ertragsmittelwert, druckt keinen und legt keinen ab. **Die
Zahlen oben sagen, wie scharf man hinsehen könnte, und kein Wort darüber, ob es etwas zu
sehen gibt.**

**Ob der Überschuss die Paarung überlebt.** Siehe 7.

---

## 7. ⚠ Der Vorbehalt zur Sättigung — und eine zurückgenommene Begründung

### 7.1 Was hält: der Auflösungsgewinn sättigt

Vorhergesagt (vorab committet) war ein Rückgang von σ_gepaart um ~40 % bei dreifacher
Stichprobe; **gemessen sind −22,6 %.**

> **Vom 1.200er aufs volle Universum sind nur noch rund −12 % zu erwarten.
> Wer `k` aufs volle Universum hochrechnet, überschätzt es.** Das ist eine harte Schranke
> gegen genau die Extrapolation, die sonst jemand gemacht hätte.

### 7.2 🔻 Was NICHT hält: meine Begründung dafür war falsch, und der PM hat sie widerlegt

**Ich hatte geschrieben:** *„In der Differenz bleibt eine gemeinsame Komponente stehen — die
Auswahl trägt eine Stilrichtung, die die Paarung überlebt."* Begründet mit: Modell sagt
0,640, gemessen 0,774.

**Der PM hat meine eigene Placebo-Zeile danebengelegt, und sie widerlegt den Schluss:**

    Abweichung vom Modell (gemessen / Modell), 400er -> 1.200er
      P  - NULL Information         1,211
      abgabedruck-nacht             1,213   <- praktisch identisch
      glockendruck-nacht            1,335
      nachtstoss-umkehr             1,406

**Der Placebo hat keine Auswahl, keine Stilrichtung und keinen Kursbezug — und verfehlt mein
Modell um denselben Betrag wie `abgabedruck-nacht`.** Also kann die Abweichung nicht von einer
Stilrichtung kommen.

> ***Belegt ist damit nicht „die Auswahl trägt Stil", sondern „mein Nullmodell war nie das
> richtige".*** Zufällige Aktienkörbe sind keine unabhängigen Ziehungen; ihre Reste sind über
> Branche, Größe und Schwankungsfreude korreliert, und deshalb mittelt **nichts** mit 1/√n
> weg — auch reines Rauschen nicht.

**Die Stilprämien-Sorge selbst bleibt trotzdem berechtigt** und gehört in jeden Bericht, der
diesen Endpunkt benutzt: bleibt in der Differenz ein gemeinsamer Faktor stehen, misst die
Paarung auch „Stil gegen Stil". **Sie ist ein Vorbehalt, kein Befund** — und sie stützt die
Einseitigkeit aus Abschnitt 2 zusätzlich: *kann ein gepaarter Überschuss teils Stilprämie
sein, taugt er erst recht nicht für ein JA.*

### 7.3 Das Maß, das trägt — und es braucht `k` gar nicht

Weil sich `σ_Niveau` im Verhältnis fast wegkürzt, ist das Maß schlicht:

> ## **Wieviel mehr gepaarte Streuung trägt diese Auswahl als eine Auswahl ohne jede Information?**
>
>     Stilanteil = sigma_gepaart(Kandidat) / sigma_gepaart(Placebo)

*(Über `k` gerechnet ergäbe sich fast dasselbe — der Unterschied beträgt 0,6–1,1 %, weil
`σ_Niveau` zwischen den Bauformen um bis zu 1,1 % schwankt. **Die direkte Fassung ist
vorzuziehen: sie ist einfacher und kann nicht als Güte gelesen werden.**)*

| Bauform | σ gepaart (1.200er) | **Stilanteil** |
|---|---|---|
| `abgabedruck-nacht` | 0,2074 | **1,101** |
| `glockendruck-nacht` | 0,2251 | **1,195** |
| `nachtstoss-umkehr` | 0,2708 | **1,438** |

### 7.4 Die Unsicherheit des Maßes — gemessen, und sie ist klein

**Auflage des PM: die Rangfolge darf nicht zitiert werden, bevor ihre Streuung vorliegt.**
Fünf Placebo-Ziehungen, gleiche Bauart, **nur andere Startzahl**, derselbe 1.200er-Lauf:

| Ziehung | σ gepaart |
|---|---|
| P | 0,1892 |
| P2 | 0,1904 |
| P3 | 0,1906 |
| P4 | 0,1867 |
| P5 | 0,1881 |

**Mittel 0,18900 · sd 0,00163 · Band 0,1867–0,1906 = 2,1 % · Variationskoeffizient 0,86 %.**

> ### 🔻 Damit nehme ich meine eigene Vorsichtsaussage zurück
> Ich hatte „rund 7 % Streuung, also ist `abgabedruck` von *gar kein Stil* nicht
> unterscheidbar" geschrieben. **Die 7 % stammten aus einem 60-Symbol-Vorlauf
> (σ_gepaart 0,52–0,56), die Verhältnisse aus dem 1.200er-Lauf (σ_gepaart 0,19–0,21) —
> zwei verschiedene Läufe, Faktor 2,7 auseinander.** *Der PM hat den Bruch gesehen und
> vorhergesagt, dass die Streuung im großen Lauf kleiner ist. Sie ist es: **2,1 % statt 7 %.***
>
> ***Eine falsche Vorsicht tötet einen echten Kandidaten genauso zuverlässig, wie eine
> falsche Zuversicht einen falschen freigibt.***

**Alle drei Kandidaten liegen klar außerhalb des Placebo-Bandes:**

| Bauform | σ gepaart | über dem **höchsten** Placebo | Stilanteil |
|---|---|---|---|
| *Placebo-Band (5 Ziehungen)* | *0,1867 – 0,1906* | — | *1,000* |
| `abgabedruck-nacht` | 0,2074 | **+8,8 %** | **1,097** |
| `glockendruck-nacht` | 0,2251 | **+18,1 %** | **1,191** |
| `nachtstoss-umkehr` | 0,2708 | **+42,1 %** | **1,433** |

**Der kleinste Abstand (8,8 %) ist das Vierfache des gesamten Placebo-Bandes (2,1 %).**
→ **Die Rangfolge ist eine Ordnung, nicht bloß eine Beobachtung.** Alle drei Auswahlen
tragen messbar mehr gepaarte Streuung als eine Auswahl ohne jede Information.

**Was diese Unsicherheitsrechnung NICHT abdeckt — und das bleibt eine echte Lücke:**
Die fünf Ziehungen unterscheiden sich **nur in der Symbolwahl**, sie rechnen auf **denselben
Tagen**. Das Band misst also allein den Symbol-Ziehungsanteil. *Der Tagesanteil
(rel. Standardfehler einer Streuung bei N = 4.995 Bestätigungstagen ≈ **1,0 %**) steckt in
Kandidat und Placebo gleichermaßen und kürzt sich im Verhältnis weitgehend weg — aber die
Kandidatenseite lässt sich nicht neu ziehen, weil sie deterministisch ist.* **Eine
Restunsicherheit der Kandidaten-σ bleibt daher unbeziffert.** Bei 8,8 % Abstand ändert das
am Schluss nichts; bei einem künftigen Kandidaten mit 2–3 % Abstand wäre es entscheidend.
