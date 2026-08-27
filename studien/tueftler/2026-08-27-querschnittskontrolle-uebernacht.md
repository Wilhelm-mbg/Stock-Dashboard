# Querschnitts-Kontrolle im Übernachtfenster — gezählt, mit einer Warnung, die genauso groß ist wie die Zahl

**27.08.2026, ~20:5x, Strategie-Tüftler.** Zählung, keine Messung. Werkzeug:
`studien/tueftler/werkzeug/zaehle-abgabedruck.js`, Rohausgabe
`studien/tueftler/daten/zaehlung-abgabedruck-2026-08-27.json`.

**Betrifft alle drei offenen Entwürfe.** Dies ist **kein** Nachtrag zu einer
Vorregistrierung, sondern eine **Vorlage zur Anmeldung** — genau in der Form, die die
Querschnitts-Studie vom 25.08. verlangt hat.

---

## Warum das überhaupt gefragt wird

Meine `delta80`-Zahlen für alle drei Entwürfe stehen auf der Streuung der **Niveaureihe**
(σ ≈ 0,88 Pp). Der A7-Kontrolltopf der Maschine ist Symbol × Sitzungsposition × Hälfte —
**der gemeinsame Marktzug des Ereignistages bleibt vollständig drin.** Wird der Überschuss
stattdessen gegen den **Rest desselben Tages** gestellt, kürzt sich der Marktfaktor weg.

Die Studie vom 25.08. (`studien/vorregistrierung-2026-08-25-querschnitt/ERGEBNIS.md`) hat
das gemessen: **Median `f` = 1,410 über 24 Varianten aus 9 Strategien → JA-Bedingung
(≥ 1,5) nicht erfüllt.** Sie hat aber auch aufgeschrieben, warum diese Zahl nicht das letzte
Wort ist:

> *„Der Gesamt-Median von 1,410 ist … eine Folge davon, dass **zwei Drittel der gemessenen
> Varianten aus 60m-Strategien stammen**. Wer diese Zahl zitiert, zitiert die Zusammensetzung
> des Korpus mit."* — auf `1d` allein lag der Median bei **2,209** (n = 8, Spanne 1,40–15,12).

Und sie hat die Auflage gleich dazugeschrieben:

> *„Daraus **keine** neue Regel abzuleiten ist Absicht. Eine Aufteilung nach Zeitrahmen war
> nicht angemeldet … Wer die Frage ‚bringt die Querschnitts-Kontrolle auf Tagesdaten
> genug?' beantwortet haben will, **muss sie vorher anmelden**."*

**Genau das ist der Zweck dieses Papiers.** Die drei Entwürfe sind Übernacht-Quintile auf
Tagesdaten — eine Bauform, die unter den 24 gemessenen Varianten **nicht vorkommt**.

---

## Die Zahlen (400er-Stichprobe, 4.678–4.737 Bestätigungstage)

`q_` = gegen den **Rest des zugelassenen Querschnitts desselben Tages** gepaart. Nicht gegen
den ganzen Querschnitt: der enthält die Auswahl, und die Differenz wäre um den
Überlappungsanteil gestaucht.

| Bauform | Breite | σ Niveau | σ gepaart | **`f`** | nötige Tage 0,10 | nötige Tage **0,04** |
|---|---|---|---|---|---|---|
| `glockendruck-nacht` | 33 | 0,8814 | 0,2785 | **3,164** | 738 → **74** | 4.615 → **461** |
| `nachtstoss-umkehr` | 33 | 0,8832 | 0,3180 | **2,778** | 741 → **96** | 4.634 → **601** |
| `abgabedruck-nacht` | 24 | 0,8848 | 0,2681 | **3,300** | 744 → **68** | 4.651 → **427** |
| *(K3, verworfene Bauform)* | 32 | 0,9089 | 0,3019 | 3,011 | 785 → 87 | 4.908 → 541 |
| **`P` — Placebo, Kunstrang ohne jede Information** | 32 | 0,8701 | 0,2490 | **3,495** | 720 → 59 | 4.463 → **368** |

**`f` liegt bei 2,78–3,30 — über der JA-Schwelle 1,5 der alten Studie und über ihrem
`1d`-Median 2,209.** Die Folge wäre erheblich: **die NEIN-Seite an der Aktienhürde (0,04 Pp)
fiele von „auf der Kante" (4.651 nötig gegen 4.678 vorhanden, Faktor 1,006) auf Faktor 8–11.**
Zum ersten Mal wäre ein *„unterhalb der Aktienhürde geschlossen"* für diese Familie eine
tragfähige Aussage.

---

## 🔴 UND JETZT DIE WARNUNG, DIE GENAUSO GROSS IST WIE DIE ZAHL

### Der Placebo hat den BESTEN Faktor von allen.

`P` ist ein Kunstrang: dasselbe Gatter, aber die Reihenfolge kommt aus einem Streuwert ohne
jeden Kurs- und Umsatzbezug. **Er trägt per Konstruktion null Information — und erreicht
`f` = 3,495, mehr als jeder echte Kandidat.**

> ***`f` misst, wie gut sich der Marktfaktor wegkürzt. Es misst NICHT, ob ein Signal etwas
> weiß.*** Ein perfekter Placebo bekommt ein perfektes `f` und einen Überschuss von null.

Das ist dieselbe Falle, die die Studie vom 25.08. schon benannt hat — *„die großen Faktoren
stehen genau dort, wo sie nichts wert sind: bei den Strategien, die fast das ganze Universum
kaufen und deren Überschuss dabei mit verschwindet"* — nur in ihrer schärfsten Form: **hier
ist es nicht eine breite Strategie, sondern gar keine.**

### Die zweite Warnung: es ist eine ANDERE Frage, nicht dieselbe Frage schärfer

| | Schätzgröße | Was ein JA bedeutet |
|---|---|---|
| **Niveau (A7)** | Auswahl gegen ihre eigene Vorgeschichte | die Auswahl schlägt ihre Norm — **die tragbare Größe für einen Handelsanspruch** |
| **gepaart** | Auswahl gegen den Rest desselben Tages | die Auswahl schlägt den Rest — **eine Querschnittsaussage, kein Ertrag** |

**Wer long geht, verdient Markt + Kante, nicht die Differenz.** Ein gepaarter Überschuss von
+0,10 Pp ist **kein** Versprechen von +0,10 Pp im Depot. Die gepaarte Fassung ist der
schärfere **Nachweis**, die Niveau-Fassung die ehrlichere **Ertragsaussage**. Sie ersetzen
einander nicht.

### Und was ich ausdrücklich NICHT gemessen habe

**Ob der Überschuss die Paarung überlebt.** Mein Werkzeug berechnet grundsätzlich keinen
Ertragsmittelwert — es kennt nur Streuungen. **Die Zahlen oben sagen, wie scharf man hinsehen
könnte, und kein Wort darüber, ob es etwas zu sehen gibt.** Ein `f` von 3,3 auf einem Signal
ohne Kante ist dreimal so scharfes Nichts.

---

## → Was ich vorschlage (Anmeldung, kein Auftrag, keine Änderung an den Vorregistrierungen)

**Die gepaarte Fassung als ZWEITEN, vorab angemeldeten Endpunkt aufnehmen — nicht als
Ersatz des ersten.** Konkret, und alles vor jeder Messung festzulegen:

1. **Beide Endpunkte werden berichtet**, Niveau (A7) und gepaart. Der **Handelsanspruch**
   hängt am Niveau; die **Existenzaussage** darf sich auf die gepaarte Fassung stützen.
2. **Die Testzahl steigt.** Zwei Endpunkte je Zweig sind bei drei Entwürfen mit je zwei
   Zweigen **12 Tests familienweit** statt 6 → `z_krit` = 2,8070. Selbst dann bleibt die
   gepaarte NEIN-Seite bei rund **500–700** nötigen Tagen gegen 4.678 vorhandene. **Der
   Gewinn überlebt die Strafe deutlich.** *(Zahl vom Messenden nachzurechnen, nicht von mir
   zu übernehmen.)*
3. **Der Placebo läuft in BEIDEN Fassungen mit, und sein `f` wird mitberichtet.** Ohne das
   liest jemand die 3,3 als Qualitätsmerkmal. **Mit ihm steht daneben, dass Nichtwissen 3,5
   erreicht.**
4. **Die Paarung geht gegen den REST**, nicht gegen den ganzen Querschnitt — sonst staucht
   die Überlappung die Differenz um den Auswahlanteil.

**Nicht vorgeschlagen wird**, die alte Querschnitts-Studie umzudeuten. Ihr Urteil („Median
1,410, JA-Bedingung nicht erfüllt") steht und bleibt richtig **für ihren Korpus**. Meine
Zahlen gelten einer Bauform, die dort nicht vorkam, und sind **Machbarkeit, kein Befund**.
