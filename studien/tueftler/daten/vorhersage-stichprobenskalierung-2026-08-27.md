# Vorhersage VOR dem Lauf — Stichprobengröße und Streuung

**27.08.2026 ~21:0x, Strategie-Tüftler. Geschrieben BEVOR der 1.200er-Lauf startet.**

**Frage:** Meine `delta80`-Zahlen in drei Vorregistrierungen stehen auf einer
**400er-Stichprobe**. Gemessen wird auf dem vollen Universum (~2.249 CS/ADRC). Sind die
Zahlen dadurch systematisch falsch?

**Modell** (aus den 400er-Zahlen zurückgerechnet, σ_Niveau 0,8848 / σ_gepaart 0,2681 bei
Korb 24 und Rest ~106):

    sigma_Korb^2   = sigma_Markt^2 + sigma_idio^2 / n_Korb
    sigma_gepaart^2 = sigma_idio^2 * (1/n_Korb + 1/n_Rest)

    -> sigma_idio ~ 1,39 Pp ; sigma_Markt ~ 0,846 Pp

**Der Marktfaktor macht also fast die ganze Niveaustreuung aus.** Daraus folgt eine
Vorhersage, die in zwei Richtungen ausschlägt:

| | 400er (gemessen) | 1.200er (vorhergesagt) |
|---|---|---|
| σ **Niveau** | 0,8848 | **~0,86 — fast unverändert (< 5 %)** |
| σ **gepaart** | 0,2681 | **~0,16 — deutlich besser (Faktor ~1,7)** |

**Wenn das stimmt:** meine Niveau-`delta80` in den drei Vorregistrierungen sind **richtig**
und brauchen keinen Nachtrag. Die gepaarte Fassung dagegen ist auf dem vollen Universum
**nochmals deutlich schärfer**, als ich sie gemeldet habe — und die Placebo-Warnung skaliert
mit, bleibt also gleich gültig.

**Wenn σ_gepaart NICHT fällt**, ist mein Modell davon, wo das Rauschen sitzt, falsch — und
dann ist auch die f-Rechnung von vorhin mit Vorsicht zu lesen. **Das ist die Positivkontrolle
dieses Laufs: er kann in beide Richtungen ausgehen.**

---

# ERGEBNIS (~21:2x) — eine Hälfte getroffen, die andere um den Faktor zwei verfehlt

1.200 Symbole, 4.635.502 Symbol-Tage (gegen 1.602.997 bei 400).

| | 400er | **1.200er** | Änderung | **vorhergesagt** | |
|---|---|---|---|---|---|
| σ **Niveau** (K2) | 0,8848 | **0,8428** | **−4,7 %** | „< 5 %" | ✅ **getroffen** |
| σ **gepaart** (K2) | 0,2681 | **0,2074** | **−22,6 %** | „~ −40 %" | ❌ **zu optimistisch** |

## Die getroffene Hälfte: die drei Vorregistrierungen brauchen keinen Nachtrag

**Der Marktfaktor beherrscht die Niveaustreuung so vollständig, dass die dreifache
Stichprobe sie nur um 4,7 % senkt.** Meine `delta80`-Zahlen (0,0395 / 0,0396 / 0,0399)
sind damit **richtig und um rund 5 % konservativ** — die 400er-Stichprobe war für die
Niveau-Fassung eine zulässige Näherung. *Das war die eigentliche Sorge, und sie ist
ausgeräumt.*

## 🔴 Die verfehlte Hälfte ist der Fund: in der gepaarten Differenz steckt ein REST, der nicht wegmittelt

Mein Modell war σ_gepaart² = σ_idio² · (1/n_Korb + 1/n_Rest) — reines Wegmitteln von
Eigenrauschen. Danach hätte die Verbreiterung des Korbs von 24 auf 59 einen Faktor
1/√2,46 = 0,64 bringen müssen (−36 %). **Gemessen sind 0,774 (−22,6 %) — das entspricht
einer wirksamen Verbreiterung von nur 1,67 statt 2,46.**

> ***In der Differenz „Auswahl minus Rest" bleibt eine gemeinsame Komponente stehen, die
> sich durch Verbreitern NICHT wegmitteln lässt.*** Die Auswahl hat also eine systematische
> Neigung gegenüber dem Rest — eine Stilrichtung (Beta, Größe, Schwankungsfreude), die die
> Paarung überlebt.

**Zwei Folgen, beide unbequem:**

1. **Der Auflösungsgewinn sättigt.** Von 1.200 auf das volle Universum (~1,9-fach) ist
   nach diesem Muster nur noch rund −12 % zu erwarten, nicht die modellierten −27 %.
   **Wer meine `f`-Zahlen auf das volle Universum hochrechnet, überschätzt sie.**
2. **Der gepaarte Überschuss könnte selbst eine Stilprämie sein.** Bleibt in der Differenz
   ein gemeinsamer Faktor stehen, misst die Paarung nicht nur „Signal gegen Rest", sondern
   auch „Stil gegen Stil". **Das gehört in die Anmeldung der gepaarten Fassung, und es war
   mir vorhin nicht klar.**

## ⭐ Und der Placebo liefert dabei ein Werkzeug, das ich nicht gesucht hatte

| Bauform | σ gepaart 400 → 1200 | Änderung | `f` (1200) |
|---|---|---|---|
| **P — Placebo, null Information** | 0,2490 → **0,1883** | **−24,4 %** | **4,425** |
| `abgabedruck-nacht` | 0,2681 → 0,2074 | −22,6 % | 4,063 |
| `glockendruck-nacht` | 0,2785 → 0,2251 | −19,2 % | 3,725 |
| `nachtstoss-umkehr` | 0,3180 → 0,2708 | −14,8 % | 3,109 |

**Der Placebo mittelt am besten weg — weil er keine Stilrichtung hat.** Er ist reines
Eigenrauschen und kommt dem Modell am nächsten. Die echten Kandidaten bleiben genau in dem
Maß hinter ihm zurück, in dem ihre Auswahl systematisch vom Rest abweicht.

> ### Daraus ein Maß, das vorher keines war:
> ***Der Abstand zwischen dem `f` des Placebos und dem `f` eines Kandidaten misst, wieviel
> systematische (nicht wegmittelbare) Neigung die Auswahl trägt.***
>
>     f_Placebo / f_Kandidat  (1.200er)
>       abgabedruck-nacht   1,089   <- traegt am wenigsten Stil
>       glockendruck-nacht  1,188
>       nachtstoss-umkehr   1,423   <- traegt am meisten
>
> **Das ist keine Güte-Aussage** — ein Signal *darf* eine Stilrichtung haben. Es sagt nur,
> **wieviel von einem gepaarten Überschuss durch eine Stilkontrolle wieder verschwinden
> könnte**, und bei welchem der drei Entwürfe man am ehesten hinsehen muss.

**Nach wie vor nicht gemessen und ausdrücklich nicht behauptet:** ob überhaupt ein
Überschuss da ist. Das Werkzeug kennt nur Streuungen.
