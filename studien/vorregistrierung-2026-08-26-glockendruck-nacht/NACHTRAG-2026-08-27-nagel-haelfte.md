# Nachtrag zur Vorregistrierung `glockendruck-nacht`

**Datum: 27.08.2026, abends (Windows-Uhr ~18:5x). Vor jeder Messung.
Die Vorregistrierung selbst bleibt unverändert.**

Verfasst vom Strategie-Tüftler, der diesen Entwurf am 26.08. eingetragen und am selben Tag
den Spannen-Rückprall-Nachtrag geschrieben hat. Anlass: Literatur-Recherche vom 27.08.,
`studien/tueftler/recherche-2026-08-27/DOSSIER.md`.

---

## Der Spannen-Rückprall hat jetzt eine fremde Zahl — und sie ist größer als meine

Mein Nachtrag vom 26.08. hat den Mechanismus benannt (`S` teilt `Schluss(i)` mit der
Zielgröße, mit entgegengesetztem Vorzeichen) und ihn an unseren Daten beziffert: **6,4 %**
der ausgewählten Tage schließen exakt auf dem Tagestief, **23,1 %** haben `S` < 0,05, halbe
notierte Spanne rund 0,02 Pp. Daraus: JA-Seite hält, NEIN-Seite auf die CFD-Hürde stellen.

**Nagel (2012, NBER WP 17653 / RFS 25(7)) misst dasselbe an einer fremden Stichprobe
(Jan 1998 – Dez 2010, CRSP täglich, Wertpapierart 10/11 — genau unser CS-Filter):**

> Rechnet man dieselbe Umkehrstrategie aus **Mittelkursen von Geld und Brief** statt aus
> Transaktionspreisen, sind die Mittelwerte **nur etwa halb so groß**.

**Die Hälfte der gemessenen Umkehrrendite ist Spannen-Rückprall.**

---

## 📐 Und der Zusatzbefund macht es für DIESEN Entwurf schlimmer, nicht besser

Nagel berichtet daneben: bei der **Branchen**-Umkehrstrategie gibt es praktisch **keinen**
Unterschied zwischen Transaktionspreis und Mittelkurs. Seine Begründung: am Tagesende
schließen manche Werte auf dem Geld-, manche auf dem Briefkurs — **mittelt man über einen
breiten Korb, hebt sich der Rückprall weitgehend auf.**

> ### Daraus die Regel, die schärfer ist als „geteilter Kurs ja/nein":
> **Der Rückprall hebt sich im breiten Korb auf. Er bleibt genau dort stehen, wo die
> AUSWAHL selbst danach fragt, wo im Tagesband der Schluss liegt.**

| Auswahlgröße | fragt nach der Bandlage? | Rückprall |
|---|---|---|
| `nachtstoss-umkehr`: `z1` aus Eröffnung(i)/Schluss(i−1) | nein | hebt sich weitgehend auf |
| **`glockendruck-nacht`: `S = (Schluss−Tief)/(Hoch−Tief)`, unterstes Quintil** | **ja — das IST seine Definition** | **hebt sich nicht auf** |

**Folge: Nagels „Hälfte" ist für diesen Entwurf eine UNTERE Schranke, keine obere.** Seine
Zahl gilt für eine Sortierung nach der *Rendite*; `S` sortiert direkt nach der Lage des
Schlusses im Band und lädt den Korb damit absichtlich einseitig mit Geldkurs-Schlüssen.

---

## Was das ändert

**Nicht geändert:** Signalregel, Gatter, Testzahl (2), Schwellen, Entscheidungstabelle,
Machbarkeits-Zahlen (4.665 Bestätigungstage, `delta80` 0,0397 Pp bei 2 Tests).

**Nicht geändert, aber jetzt doppelt begründet:** die JA-Seite (≥ 0,10 Pp). Sie liegt weit
über allem, was ein Rückprall erzeugen kann, und bleibt bestehen.

**Bestätigt und verstärkt:** die Entscheidung aus dem Nachtrag vom 26.08., **die NEIN-Seite
auf die CFD-Hürde (0,10 Pp) zu stellen statt auf die Aktienhürde (0,04 Pp)**. Zwischen
`delta80` (0,0397) und der Aktienhürde (0,04) liegen 0,0005 Pp; das beherrscht der
Rückprall mehrfach. Das war am 26.08. aus unseren eigenen Zählungen abgeleitet — **es
steht jetzt zusätzlich auf einer unabhängigen fremden Messung, und die fällt größer aus.**

**Neu als Auflage für den Bericht:** Ein **JA** dieses Entwurfs muss den Satz tragen, dass
die Auswahl nach der Bandlage sortiert und ein Teil des Überschusses deshalb Rückprall sein
kann, **auch bei 0,10 Pp**. Die saubere Gegenprobe wäre ein Vergleich gegen Mittelkurse —
**die haben wir nicht** (`archiv1d` führt keine Geld-/Briefkurse). Deshalb: *nicht prüfbar,
als benannte Einschränkung berichten*, nicht als erledigt behandeln.

> **Die billigste verfügbare Gegenprobe** wäre, denselben Entwurf **zusätzlich** mit
> `S` aus dem VORTAG zu fahren (`S(i−1)`, Zielgröße unverändert). Dann ist der geteilte
> Kurs weg, der Mechanismus aber weitgehend erhalten. **Das ist ein Vorschlag an die
> Mess-Kette, keine Änderung dieser Vorregistrierung** — und er erhöht die Testzahl, was
> gegengerechnet werden muss.
