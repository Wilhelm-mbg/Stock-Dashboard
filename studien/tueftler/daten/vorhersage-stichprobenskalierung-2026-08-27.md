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
