# Vorregistrierung: Der Winkel am bestätigten Kanal (Felix, #33/#36 — zweiter Anlauf)

**Geschrieben am 25.08.2026, BEVOR gerechnet wurde.** Sie ersetzt die Registrierung
`VORREGISTRIERUNG-2026-08-25-winkelgrad.md` nicht — die bleibt samt ihrem Ergebnis
stehen. Dies ist ein eigener Test, weil der erste die Frage nicht gestellt hat, die er
zu stellen behauptete.

## Warum es einen zweiten Anlauf gibt

Der erste Detektor stützte sich auf diesen Satz — er stand wörtlich in der Registrierung
und im Code:

> „Liefert er einen Kanal, gilt der Trend als *bestätigt* — die Funktion verlangt dafür
> Berührungen an beiden Rändern und ein Varianzverhältnis, das einen Zufallspfad
> ausschließt."

**Der Satz ist falsch.** Nachgemessen am 25.08.2026:

| Behauptung | Gemessen |
|---|---|
| `kanalUeber` verwirft schwache Kanäle | Drei `return null`, alle technisch (< 16 Kerzen, fehlender Kurs, Nenner 0). In **20.000 Zufallspfaden kein einziges `null`.** |
| Berührungen an beiden Rändern als Filter | Kann strukturell nicht scheitern: die Ränder *sind* das 92.- und 8.-Perzentil genau der Abweichungen, an denen sie geprüft werden. Minimum über 8.000 Rauschläufe: **4 Berührungen bei Soll 2.** |
| Varianzverhältnis schließt Zufallspfad aus | Rauschen: **r² Median 0,44**, 90 % bei 0,84. Selbst r² ≥ 0,8 lässt 15,7 % des Rauschens durch. |
| „Güte" misst Qualität | Reines Rauschen: **Güte-Median 75**, nie unter 50, Maximum 99. 35 % des Rauschens heißt „trend: auf". |

Folge: Der Detektor feuerte auf rund **der Hälfte aller Kerzen** (5,5 Mio Signale bei
2.201 Werten). Gemessen wurde „über 40 Kerzen lässt sich eine Gerade legen, deren
normierte Steigung ≥ x ist" — nicht Felix' Satz. Das Ergebnis jenes Laufs bleibt gültig
**für die Frage, die er tatsächlich gestellt hat**, und sagt über Felix' Regel nichts.

## Die Regel, exakt

**Kanal.** Über die Kerzen `i-41` bis `i-9` (33 Kerzen) wird `Q.kanalUeber` gerechnet.

**Bestätigung — und diesmal bedeutet das Wort etwas.** Die **acht folgenden Kerzen**
(`i-8` bis `i`) gehen in die Rechnung **nicht** ein. Verlangt wird, dass jeder ihrer
Schlusskurse innerhalb des *fortgeschriebenen* Kanals liegt (`|Abweichung| ≤ Breite/2`).
Eine Bestätigung aus denselben Kerzen, aus denen der Kanal stammt, ist keine; diese hier
ist eine Aussage über Kerzen, die der Kanal nie gesehen hat.

**Vorab am Rauschen gemessen, vor dieser Registrierung** — der Schritt, der beim ersten
Mal fehlte:

| Toleranz | Rauschen hält den Kanal | davon mit Winkel ≥ 0,5 |
|---|---|---|
| **0 (gewählt)** | **11,5 %** | **3,6 %** |
| +0,25 Breite | 29,9 % | 9,7 % |
| +0,5 Breite | 48,5 % | 16,6 % |

Gewählt wird die Toleranz 0, weil die beiden anderen zu wenig aussortieren. Die Wahl
steht hier, damit sie nicht hinterher nach dem Ergebnis getroffen werden kann.

**Winkel.** `winkel = steigung × n / breite`, unverändert aus dem ersten Anlauf und der
Winkel-Studie zu #33 — damit die Zahlen vergleichbar bleiben.

**Einstieg.** Long bei `winkel ≥ SCHWELLE`. Nur long, wie im ersten Anlauf.

**Ausstieg.** Fest nach 8 Kerzen. Felix' zweite Regel (Ausstiegssignale nach Winkel
gestaffelt) wird weiterhin **nicht** geprüft und braucht eine eigene Registrierung.

## Parameter, festgelegt

| | |
|---|---|
| Zeitrahmen | 60 Minuten |
| Fenster für den Kanal | 33 Kerzen |
| Bewährungsstrecke | 8 Kerzen, ungesehen |
| Lesefenster (A7) | 42 Kerzen |
| Haltedauer | 8 Kerzen |
| Vorlauf | 261 Kerzen |
| Richtung | nur long |
| Universum | Unternehmensaktien (`WP.istAktie`) |
| Kosten | 5 Basispunkte je Seite |

**Die geprüften Stufen (das sind die Tests):** S0 ≥ 0,0 · S05 ≥ 0,5 · S10 ≥ 1,0 ·
S15 ≥ 1,5 · S20 ≥ 2,0. **Fünf Tests, Bonferroni-Schwelle t ≈ 2,58.**

Die Stufen sind ineinander geschachtelt (S20 ⊂ S15 ⊂ … ⊂ S0). Bonferroni ist damit
konservativer als nötig — das wird in Kauf genommen, nicht wegdiskutiert.

## Was als Bestätigung gilt — vor dem Rechnen festgelegt

**Bestätigt**, wenn **beides** zutrifft:

1. **Monotonie.** Der Netto-Überschuss steigt über die fünf Stufen. Nicht „irgendeine
   Stufe ist gut" — das wäre der beste von fünf und damit nichts wert.
2. **Eine Stufe trägt nach Kosten**, mit t über Tage geclustert ≥ 2,58.

**Widerlegt**, wenn der Überschuss über die Stufen fällt oder flach bleibt.

**Nicht entscheidbar**, wenn die MDE über dem liegt, was plausibel zu erwarten wäre.
**Die MDE wird VOR dem Urteil ausgewiesen.** Das ist in dieser Bibliothek der häufigste
Ausgang; ihn als „kein Effekt" zu lesen wäre der Fehler, gegen den die halbe Fehlerliste
geschrieben ist.

**Zusätzlich vorab festgelegt:** Liegt die Signalzahl wieder in der Größenordnung von
Millionen — also über etwa 15 % aller Kerzen —, ist die Bestätigung erneut wirkungslos
und das Ergebnis wird **nicht** als Antwort auf Felix' Frage ausgegeben. Erwartet werden
nach der Rauschmessung Signale in der Größenordnung weniger Prozent.

## Was diese Messung nicht kann

- **Sie prüft 60-Minuten-Kerzen.** Felix' ursprüngliches Bild (#33) war 1m/5m. Das
  1m-Archiv hat 63 Handelstage, die #33-Registrierung nennt 77 als Mindestmaß.
- **Sie prüft keinen Ausstieg.**
- **Ein „nicht entscheidbar" ist eine Aussage über die Daten, nicht über die Idee.**
- **Sie prüft nicht, ob Kanäle handelbar sind.** Das steht schon fest: Abschnittskanäle
  waren als Bedingung schädlich (−0,17 Pp, t = −4,1). Hier geht es nur um Felix' Winkel.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
