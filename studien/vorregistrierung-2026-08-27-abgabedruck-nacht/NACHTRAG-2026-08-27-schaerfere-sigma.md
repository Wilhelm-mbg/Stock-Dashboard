# Nachtrag zur Vorregistrierung `abgabedruck-nacht`

**Datum: 27.08.2026, ~22:1x. Vor jeder Messung.
Die Vorregistrierung selbst bleibt unverändert — diese Zahl wird NICHT ersetzt, sondern
als überholt kenntlich gemacht.**

*Auf ausdrückliche Auflage des PM: „Eine Vorregistrierung, deren Zahlen sich stillschweigend
verbessern, ist keine mehr. ‚Auf der Kante' war eine öffentliche Aussage — sie muss als
überholt lesbar bleiben, nicht verschwinden."*

---

## Die Zahl, die überholt ist

In Abschnitt 4 der Vorregistrierung steht:

> | nötige Tage für 0,04 Pp | **4.651** — vorhanden 4.678, **Faktor 1,006** |
>
> *„Die NEIN-Seite an der Aktienhürde steht studienweise exakt auf der Kante (Faktor 1,006)
> und reißt familienweit klar."*

**Diese Zahl beruht auf der 400er-Stichprobe (σ = 0,8848) und studienweiser Korrektur
(2 Tests).** Beides war zum Zeitpunkt der Registrierung das, was vorlag.

## Was sich geändert hat, und warum

**Zwei Dinge, beide vom selben Abend:**

1. **Schärfere Streuung aus der 1.200er-Stichprobe:** σ_Niveau = **0,8428** statt 0,8848.
   *(Vorhergesagt und vorab committet: „< 5 % Änderung". Gemessen: −4,7 %. Die Vorhersage
   liegt in `studien/tueftler/daten/vorhersage-stichprobenskalierung-2026-08-27.md`.)*
2. **Familienweite statt studienweiser Korrektur.** Drei Entwürfe × zwei Zweige = 6 Tests,
   `z_krit` = 2,6383 statt 2,2414.

    noetige Tage fuer 0,04 Pp, NIVEAU, Familie 6:
      glockendruck-nacht   5.324
      nachtstoss-umkehr    5.366
      abgabedruck-nacht    5.376      <- gegen 4.678 vorhandene

> ### **Es steht nicht mehr auf der Kante. Es reißt — und zwar alle drei.**
> *Die alte Zahl (4.651, Faktor 1,006) war nicht falsch gerechnet; sie stand auf einer
> gröberen Streuung und einer engeren Testfamilie. **Sie bleibt oben stehen, damit
> nachvollziehbar ist, worauf das „auf der Kante" beruhte.***

## Was daraus folgt — und was ausdrücklich nicht

**Folgt:** Die in der Vorregistrierung getroffene Entscheidung, **die NEIN-Seite auf die
CFD-Hürde (0,10 Pp) zu stellen**, war richtig und ist es weiterhin. Sie war damals mit
„Faktor 1,006, auf der Kante" begründet; sie ist jetzt **stärker** begründet, nicht schwächer.

**Folgt nicht:** irgendeine Änderung an Signalregel, Gattern, Testzahl der Studie,
Entscheidungstabelle oder Schwellen. **Die JA-Seite ist unberührt** — sie braucht bei
Familie 6 **860** Tage gegen 4.678 vorhandene (Faktor 5,4).

## Und der Weg, der dadurch überhaupt erst nötig wurde

Weil das NEIN an der Aktienhürde auf dem Niveau nicht erreichbar ist, ist der **gepaarte
Endpunkt** (Auswahl gegen den Rest desselben Tages) der **einzige** Weg zu einer
NEIN-Aussage an der Aktienhürde:

    NEIN gepaart, 0,04 Pp, Familie 12 (die strengere Wahl):
      abgabedruck-nacht    369 Tage   gegen 4.678 vorhandene   -> Faktor 12,7

**Angemeldet in `studien/vorregistrierung-2026-08-27-querschnitt-uebernacht/ANMELDUNG.md`,
mit der Auflage des PM, dass dieser Endpunkt ein NEIN tragen, aber NIEMALS ein JA erzeugen
darf.** *Ein gepaartes NEIN ist zudem die engere Aussage — „die Auswahl schlägt den Rest
nicht um ≥ 0,04 Pp", nicht „es gibt keine handelbare Kante".*
