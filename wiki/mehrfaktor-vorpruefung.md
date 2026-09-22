---
tags: [strategie, studien]
---
# Mehrfaktor-Kombination: Vorprüfung und die Frage nach dem Test (PM, 22.09.2026 21:15)

Stand: alle 13 Feldzellen (Nr. 49–57) gebaut und vom PM unabhängig nachgerechnet (69.969 Werte je Zelle identisch), Nullpunkt
(vier Kontrollen) überall bestanden. Die Zahlen unten stammen aus den **v1-Zellen**; Nr. 60 (Fundamentaltafel v1.1) läuft, danach
werden die Zellen neu gebaut — die Größenordnungen ändern sich dadurch nicht (die Fehler betreffen wenige Prozent der Mitglieder).

## 1. Vorprüfung nach `VORREGISTRIERUNG-KOMBINATION.md` §6 (Vorschau v1)

| Feld | netto Pp | se | MDE₈₀ | t_HH | Umschlag | Literatur L-S | Erwartung einseitig (×¼) |
|---|---|---|---|---|---|---|---|
| momentum | 0,85 | 0,53 | 1,49 | 1,70 | 31 % | ≈ 1 | 0,25 |
| schwankung | −0,25 | 0,39 | 1,09 | −0,64 | 14 % | 0,5–0,7 | 0,13–0,17 |
| bewertung | −0,20 | 0,37 | 1,04 | −0,53 | 14 % | 0,3–0,4 | 0,07–0,10 |
| ertragskraft | 0,30 | 0,24 | 0,67 | 1,21 | 16 % | 0,3–0,5 | 0,07–0,13 |
| investition | 0,11 | 0,26 | 0,72 | 0,26 | 20 % | ≈ 0,3 | 0,07 |
| sue | 0,14 | 0,17 | 0,48 | 0,83 | 37 % | 0,5–1 | 0,13–0,25 |
| fue | −0,16 | 0,75 | 2,10 | −0,16 | 18 % | ≈ 0,5 | 0,13 |

- **§6.1 Erwartung** (vorab registriert, nicht nachgezogen): 0,3–0,6 Pp brutto je Monat; Kontrollrechnung aus Literatur ×¼ × √4–5: 0,24–0,35.
- **§6.2 Kosten:** mittlerer Dezil-Umschlag 21,5 % × 0,080 = **0,017 Pp** je Monat. **Tor V1 bestanden** (Kante/2 = 0,15–0,30 > 0,017).
- **§6.3 Auflösung:** Median der se 0,372 ⇒ **MDE₈₀-Schätzung 1,04 Pp** (Faktor 3,4 über dem Zufallsboden 0,31). **Tor V2 gefallen**, auch
  an der oberen Grenze (0,30 < 1,04) — um den Faktor 3,5–7.

Was das heißt: nach der eigenen Regel des Entwurfs (§6.3, §7) kann der Kombinationslauf nur **„belegt"** (wenn das Dezil ≥ 1 Pp netto
liefert — das wäre das Dreifache der Literatur) oder **„nicht entscheidbar unterhalb von ≈ 1 Pp"** ausgehen. Für 0,2 Pp bräuchte
ein Dezil-Test ≈ 92 × (2,8 × 0,37 / 0,2)² ≈ **2.500 Monate**. Das ist die Auflösungswand — nicht eine Schwäche der Felder.

## 2. Der Test, der auflösen könnte: Rang-Informationskoeffizient (IC)

Ein Dezil misst 76 von 760 Titeln. Ein **Spearman-IC** je Signaltag (Rangkorrelation zwischen Kombinationsrang und Halteperioden-
Rendite über **alle** Universumsmitglieder) nutzt die ganze Querschnittsinformation. Boden, **nur aus Kunstfeldern gemessen** (kein
echtes Feld angefasst, 22.09. 21:14, `pm-ic-boden.js`, Halterendite Eröffnung(a) → Eröffnung(a′) wie die Maschine):

| Kunstfeld | IC Mittel | sd je Monat | se | MDE₈₀ |
|---|---|---|---|---|
| Zufall | −0,003 | 0,033 | **0,0035** | **0,010** |
| Lücken (⅔ Abdeckung) | 0,003 | 0,049 | 0,0051 | 0,014 |
| Orakel (Positivkontrolle) | **1,0000** | 0,0000 | — | — |

Ein echtes Signal streut über die Zeit stärker als Zufall (Faktor 2–4, wie beim Dezil) ⇒ MDE₈₀ ≈ **0,02–0,04**. Literatur:
Einzelfaktoren IC ≈ 0,02–0,04, Mehrfaktor-Komposite ≈ 0,04–0,06. **Der IC-Test liegt an der Auflösungsgrenze, der Dezil-Test um
den Faktor 3–7 darunter.** Das Orakel mit IC exakt 1,0000 bestätigt zugleich, dass die Halterendite-Konvention der Maschine
(Eröffnung→Eröffnung) genau getroffen ist.

Was der IC **nicht** beantwortet: ob das Dezil **netto handelbar** ist. Ein Ja hieße „das Kombinationssignal trägt Information über
die Rangfolge der nächsten Monatsrenditen", ein Belegstand-Eintrag der Art „Information belegt, Handelbarkeit nicht entscheidbar"
(wie Trendwende marktneutral: echt, aber unbelegt). Das Dezil netto bliebe als Diagnose mit MDE — keine zweite Hypothese.

## 3. Optionen für die Registrierung (Formular)

- **A — IC als der eine Test:** Vorhersage: mittlerer Spearman-IC > 0 über 92 Signaltage, t_HH ≥ 3, IC ≥ MDE₈₀ aus dem Lauf; Dezil oben
  netto, Long-Short, Jahresscheiben als Diagnose. Braucht eine kleine Erweiterung der Maschine (IC je Signaltag mit HH-se, Kunstfeld-
  Prüfungen Zufall ≈ 0 / Orakel = 1 / Leck wirft) — Auftrag Nr. 61, ≈ 150k, ein Abend. Rückhaltefenster wie gehabt.
- **B — Dezil netto wie im Entwurf:** kein Umbau; Ergebnis mit hoher Wahrscheinlichkeit „nicht entscheidbar unterhalb von ≈ 1 Pp".
  Ehrlich, aber die Frage bleibt offen — und die Antwort war vor dem Lauf absehbar.
- **C — A jetzt, B als Diagnose, und die Handelbarkeitsfrage später mit mehr Monaten** (Rückhaltefenster wächst jeden Monat um einen
  Signaltag; in fünf Jahren 150 statt 92 — löst das Dezil trotzdem nicht auf, MDE dann ≈ 0,8 Pp).

**Empfehlung des PM: A.** Die Feldwahl und die Gewichte bleiben, wie vorab festgelegt; nur die Teststatistik wird vor der Registrierung
auf die auflösbare Größe gesetzt. Kein Blick auf ein Ergebnis ist dabei geschehen: die IC-Böden stammen aus Kunstfeldern, die
Vorprüfung aus den registrierten Einzelmessungen der Zellen.

## 3a. Vorprüfung mit den v1.1-Zellen und dem IC (22.09.2026 22:28, nach Nr. 60 und Nr. 61)

Alle 13 Zellen neu gebaut (Tafel v1.1, Maschine v1.1), PM-Nachrechnung identisch (13 × 69.969 Werte), Nullpunkt überall bestanden.
Vom IC sind hier **nur se und MDE₈₀** genannt — kein Mittelwert eines echten Feldes (Registrierung steht noch aus).

| Feld | se Dezil | MDE₈₀ Dezil | se IC | MDE₈₀ IC | Umschlag |
|---|---|---|---|---|---|
| momentum | 0,533 | 1,49 | 0,0201 | 0,056 | 31 % |
| schwankung | 0,389 | 1,09 | 0,0249 | 0,070 | 14 % |
| bewertung | 0,372 | 1,04 | 0,0177 | 0,050 | 14 % |
| ertragskraft | 0,240 | 0,67 | 0,0117 | 0,033 | 16 % |
| investition | 0,260 | 0,73 | 0,0135 | 0,038 | 20 % |
| sue | 0,170 | 0,48 | 0,0096 | 0,027 | 37 % |
| fue | 0,751 | 2,11 | 0,0209 | 0,059 | 18 % |

- **V1** (Kosten, Information): 21,4 % × 0,080 = 0,017 Pp — bestanden.
- **V2 (IC):** Median se(IC) 0,0177 = Faktor **5,0** über dem Kunstfeld-Boden ⇒ MDE₈₀(IC)-Schätzung **0,0495** gegen erwarteten IC 0,02–0,03
  — **gefallen** mit dem registrierten Schätzer (Kombination streut wie ein Einzelfeld). Unter Unabhängigkeit der sieben IC-Reihen läge
  die Schätzung bei 0,019, mit k_eff = 4 bei 0,025; die Wahrheit liegt dazwischen und zeigt sich erst im Lauf.
- **Was das für das Urteil heißt:** ein Ja braucht IC ≥ MDE₈₀ des Laufs und t ≥ 3; ein Nein lautet „nicht entscheidbar unterhalb von
  IC <MDE₈₀ des Laufs>" — mit etwas Glück bei 0,02–0,03, im schlechten Fall bei 0,05. Der Lauf ist damit ehrlich, aber nicht sicher
  auflösend. Datei: `studien/mehrfaktor-2026-09-22/pruefung/vorpruefung-kombination.json` (K-P5).

## 4. Was danach passiert

Tafel v1.1 (Nr. 60) → Zellen neu (Nachtrag 3, beide Zahlen) → ggf. Maschine um IC erweitern (Nr. 61, mit Kunstfeld-Prüfungen) →
Vorprüfung mit v1.1-Zahlen als `pruefung/vorpruefung-kombination.json` → Registrierung (Formular) → Kombinationslauf (Nr. 62) →
Rückhaltefenster.
