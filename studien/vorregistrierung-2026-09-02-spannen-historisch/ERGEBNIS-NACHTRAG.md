# Nachtrag zum Ergebnis: Übernacht-Familie im Schlussfenster · Zusatz A gegen die Buch-Hürde

**Registrierung:** `VORREGISTRIERUNG.md`, Commit `4f22b14` (§6 Zusatz A, §8 Entscheidungsregel).
**Hauptergebnis:** `ERGEBNIS.md` (03.09.2026). **Rohdaten:** `E:/Markt-Dashboard-Archiv/spannen` (2016.jsonl, 2017.jsonl, 2018.jsonl, 2019.jsonl, 2020.jsonl, 2021.jsonl, 2022.jsonl, 2023.jsonl, 2024.jsonl, 2025.jsonl, 2026.jsonl) — nur gelesen.
`messen.js` und `auswerten.js` sind **unverändert**; dieses Skript (`nachtrag.js`) benutzt per `require`
deren `median`, `quantil`, `zelle` (Symbol-Median, Cluster-Bootstrap über Symbole, Saat 20260902)
und `lesen`. Die Zuordnungsregel der 31 Varianten ist in `auswerten.js` nicht exportiert; ihr Regelkern
(Vergleich je Klasse, belegt/unbekannt, Urteilstexte, Zähler) ist hier **wörtlich kopiert** (Funktion `urteil`),
mit zwei mechanischen Anpassungen: der Hürden-Parameter heißt `h` statt `hAb2021`, und die Funktion gibt
das Urteil zurück statt die Tabellenzeile zu schreiben. Nachgetragen am 2026-09-03 07:14 UTC.

## 0. Positivkontrolle — vor jeder Zahl

Dieses Skript muss für das Fenster `mitte`, ab 2021, exakt die vier Mediane aus `ERGEBNIS.md` §3/§5
liefern. Stimmt eine Stelle nicht, wird abgebrochen und nichts geschrieben.

| Klasse | Soll (`ERGEBNIS.md`) | Ist (`nachtrag.js`) | Band (Ist) | |
|---|---|---|---|---|
| 5-50 | 0,1569 | **0,1569** | [0,1431, 0,1674] | stimmt |
| 50-250 | 0,0854 | **0,0854** | [0,0771, 0,0940] | stimmt |
| 250-1000 | 0,0647 | **0,0647** | [0,0579, 0,0706] | stimmt |
| ab1000 | 0,0449 | **0,0449** | [0,0366, 0,0556] | stimmt |

**4 von 4 Stellen stimmen — bestanden.**

## 1. Die Kassa-Hürde im Schlussfenster (15:30–16:00 ET) je Klasse

Registrierung §8: *„die Übernacht-Familie handelt im Schlussfenster und bekommt dort ihre eigene Hürde."*
Zahl = **Symbol-Median** der notierten Spanne in Pp je Umlauf, Band = 95-%-Perzentilband aus 1.000
Cluster-Bootstrap-Ziehungen über Symbole — dieselbe Methode wie `ERGEBNIS.md` §2 für `mitte`.
**Maßgeblich ist ab 2021**; 2016–2020 steht nachrichtlich daneben. Die `mitte`-Hürde ab 2021 steht
zum Vergleich in der letzten Spalte.

| Klasse | **Schluss ab 2021** | 95-%-Band | Symbole | Zeitpunkte | Median-Kurs | am Cent-Boden | Schluss 2016–2020 (nachrichtlich) | Band 2016–2020 | `mitte` ab 2021 | Schluss/Mitte |
|---|---|---|---|---|---|---|---|---|---|---|
| **5-50** | **0,1025** | [0,0954, 0,1089] | 506 | 2993 | 35,09 $ | 39 % | 0,0666 | [0,0626, 0,0712] | 0,1569 | 0,65 × |
| **50-250** | **0,0540** | [0,0495, 0,0573] | 470 | 2986 | 73,97 $ | 36 % | 0,0311 | [0,0293, 0,0336] | 0,0854 | 0,63 × |
| **250-1000** | **0,0409** | [0,0364, 0,0455] | 314 | 2990 | 130,95 $ | 32 % | 0,0220 | [0,0205, 0,0231] | 0,0647 | 0,63 × |
| **ab1000** | **0,0329** | [0,0264, 0,0383] | 110 | 1495 | 177,61 $ | 34 % | 0,0176 | [0,0138, 0,0221] | 0,0449 | 0,73 × |

Das Schlussfenster ist in jeder Klasse günstiger als das Mittagsfenster. **Der Cent-Boden-Vorbehalt
aus `ERGEBNIS.md` §2.0 gilt hier unverändert** — in den liquiden Klassen ist die Zahl zu einem
großen Teil eine Aussage über den Aktienkurs, nicht über die Liquidität.

## 2. Die Übernacht-Familie gegen die Schluss-Hürde ihrer Klasse

Familie laut Auftrag: `*-nacht-*`, `nachtstoss-umkehr-*`, `abgabedruck-nacht-*`. Obergrenzen wörtlich
aus `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 (`varianten.js`). **Zuordnungsregel unverändert**
(Registrierung §8): belegte Klasse → Urteil in dieser Klasse; unbekannte Klasse → gegen **alle vier**
Hürden ausgewiesen, nicht geraten, nicht die günstigste genommen.

> **„Wieder offen" heißt: obere Grenze > Kassa-Hürde ihrer Klasse.** Das ist eine **Größenaussage,
> kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser geworden, sie ist nur nicht mehr
> durch die Kosten erledigt.

Verwendete Hürden (Fenster `schluss`, ab 2021): 5-50 = **0,1025** · 50-250 = **0,0540** · 250-1000 = **0,0409** · ab1000 = **0,0329**
Vorher (Fenster `mitte`, ab 2021): 5-50 = 0,1569 · 50-250 = 0,0854 · 250-1000 = 0,0647 · ab1000 = 0,0449

| Strategie | V | obere Grenze | Universum | offen gegen 5-50 | 50-250 | 250-1000 | ab1000 | Urteil |
|---|---|---|---|---|---|---|---|---|
| `glockendruck-nacht-h2` | 0 | 0,1140 | 50-250 | ja | ja | ja | ja | **wieder offen** (50-250) |
| ↳ vorher (mitte) / nachher (schluss) | | | | ~~nein~~ → **ja** | ja | ja | ja | unverändert |
| `glockendruck-nacht-h1l` | 0 (liquide) | 0,0910 | ab1000 | nein | ja | ja | ja | **wieder offen** (ab1000) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | ja | ja | ja | unverändert |
| `glockendruck-nacht-n` | 0 | 0,0680 | 50-250 | nein | ja | ja | ja | **wieder offen** (50-250) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | ~~nein~~ → **ja** | ja | ja | ~~endgültig zu (50-250)~~ → **wieder offen** (50-250) |
| `nachtstoss-umkehr-t` | 0 | 0,0599 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | ~~nein~~ → **ja** | ~~nein~~ → **ja** | ja | ~~hängt an der Klasse (1 von 4)~~ → hängt an der Klasse (3 von 4) |
| `nachtstoss-umkehr-n-regime` | 1 (ab 2021) | 0,0450 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | ~~nein~~ → **ja** | ja | ~~hängt an der Klasse (1 von 4)~~ → hängt an der Klasse (2 von 4) |
| `abgabedruck-nacht-n-regime` | 1 (ab 2021) | 0,0390 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | ~~nein~~ → **ja** | ~~endgültig zu, in jeder Klasse~~ → hängt an der Klasse (1 von 4) |
| `abgabedruck-nacht-n-regime` | 0 (bis 2020) | 0,0340 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | ~~nein~~ → **ja** | ~~endgültig zu, in jeder Klasse~~ → hängt an der Klasse (1 von 4) |
| `glockendruck-nacht-t` | 0 | 0,0320 | 50-250 | nein | nein | nein | nein | **endgültig zu** (50-250) |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | nein | unverändert |
| `abgabedruck-nacht-t` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | nein | unverändert |
| `abgabedruck-nacht-n` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | nein | unverändert |
| `nachtstoss-umkehr-n` | 0 | 0,0000 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | nein | unverändert |
| `nachtstoss-umkehr-n-regime` | 0 (bis 2020) | -0,0060 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| ↳ vorher (mitte) / nachher (schluss) | | | | nein | nein | nein | nein | unverändert |

### Zählung

| | offen | zu | unentschieden (Klasse unbekannt, hängt an der Klasse) | Summe |
|---|---|---|---|---|
| **Übernacht-Familie, vorher (mitte)** | 2 | 8 | 2 | 12 |
| **Übernacht-Familie, nachher (schluss)** | **3** | **5** | **4** | 12 |
| **Alle 31, vorher** (`ERGEBNIS.md` §5) | 2 | 14 | 15 | 31 |
| **Alle 31, nachher** (Übernacht gegen schluss, Rest unverändert gegen mitte) | **3** | **11** | **17** | 31 |

Davon in der Übernacht-Familie: belegte Klasse 4 (offen 3, zu 1); Klasse unbekannt 8 (in jeder Klasse offen 0, in jeder Klasse zu 4, hängt an der Klasse 4).

**Geänderte Urteile (5):**

- `glockendruck-nacht-n` 0: endgültig zu (50-250) → wieder offen (50-250)
- `nachtstoss-umkehr-t` 0: hängt an der Klasse (1 von 4) → hängt an der Klasse (3 von 4)
- `nachtstoss-umkehr-n-regime` 1 (ab 2021): hängt an der Klasse (1 von 4) → hängt an der Klasse (2 von 4)
- `abgabedruck-nacht-n-regime` 1 (ab 2021): endgültig zu, in jeder Klasse → hängt an der Klasse (1 von 4)
- `abgabedruck-nacht-n-regime` 0 (bis 2020): endgültig zu, in jeder Klasse → hängt an der Klasse (1 von 4)

Eine Variante, die sich von „endgültig zu" nach „hängt an der Klasse" bewegt, hat **kein** Urteil
bekommen — sie ist nur nicht mehr in jeder Klasse zu. Und „wieder offen" bleibt eine Größenaussage,
kein Ertragsbeleg. Die Zahl der belegten handelbaren Kanten bleibt **NULL**.

## 3. Zusatz A gegen die Hürde, die das Momentum-Buch unterstellt

Registrierung §6, Endpunkt: *„Median-Spanne des Korbs je Umschichtung, gegen die Hürde, die das
Momentum-Buch heute unterstellt."* `ERGEBNIS.md` §6 berichtet die Spanne, stellt sie aber keiner
Hürde gegenüber. **Das ist eine Gegenüberstellung, keine Empfehlung — am Buch wird nichts geändert.**

**Die Buch-Hürde steht im Code:** `mfdepot.js` `takt()` ruft `MH.fuehreAus(d.mfBuch, plan, now, 20)`
(Zeile 158); `mfhandel.js` `fuehreAus(buch, plan, nowMs, kostenBp)` dokumentiert „kostenBp je Seite"
und rechnet `k = kostenBp / 10000` auf jede Seite (Zeile 128). Der Journaltext in `takt()` sagt es
wörtlich: „Kosten 20 Bp je Seite". Bestätigt durch `uebergabe/oberflaeche-stufe3-2026-09-03.md`,
Abweichung 4.

| Größe | Wert |
|---|---|
| Buch-Hürde je Seite | **20 Bp** = 0,20 Pp |
| Buch-Hürde je Umlauf (Seite × 2, Bp → Pp mit Faktor 0,01) | **0,40 Pp** |
| Gemessen: Median über alle Korbmitglieder (15:55 ET, 41 Umschichtungen, 2137 Quotes) | **0,0439 Pp** je Umlauf |
| Gemessen: p75 | 0,0835 Pp je Umlauf |
| Buch-Hürde / gemessener Median | **Faktor 9,1** |
| Buch-Hürde / p75 | Faktor 4,8 |
| Umschichtungen mit Korbspanne (Median) **über** der Buch-Hürde | **0 von 41** |
| Umschichtungen mit Korbspanne (Median) **unter** der Buch-Hürde | **41 von 41** |

| Umschichtung | Korbmitglieder | Median-Spanne (Pp) | p75 | breitestes Mitglied | gegen Buch-Hürde 0,40 |
|---|---|---|---|---|---|
| 2016-02-22 | 39 | 0,0230 | 0,0301 | 0,1271 | unter (Faktor 17,4) |
| 2016-05-20 | 34 | 0,0212 | 0,0278 | 0,0550 | unter (Faktor 18,9) |
| 2016-08-19 | 32 | 0,0237 | 0,0366 | 0,1311 | unter (Faktor 16,9) |
| 2016-11-17 | 37 | 0,0308 | 0,0886 | 0,1402 | unter (Faktor 13,0) |
| 2017-02-21 | 36 | 0,0328 | 0,0690 | 0,1075 | unter (Faktor 12,2) |
| 2017-05-22 | 38 | 0,0233 | 0,0417 | 0,1177 | unter (Faktor 17,1) |
| 2017-08-21 | 35 | 0,0231 | 0,0366 | 0,0974 | unter (Faktor 17,3) |
| 2017-11-17 | 40 | 0,0268 | 0,0421 | 0,1364 | unter (Faktor 14,9) |
| 2018-02-21 | 47 | 0,0421 | 0,0675 | 0,2005 | unter (Faktor 9,5) |
| 2018-05-22 | 42 | 0,0209 | 0,0387 | 0,0759 | unter (Faktor 19,2) |
| 2018-08-21 | 40 | 0,0203 | 0,0312 | 0,1087 | unter (Faktor 19,7) |
| 2018-11-19 | 46 | 0,0323 | 0,0526 | 0,1308 | unter (Faktor 12,4) |
| 2019-02-22 | 41 | 0,0208 | 0,0353 | 0,1091 | unter (Faktor 19,2) |
| 2019-05-23 | 41 | 0,0408 | 0,0710 | 0,2065 | unter (Faktor 9,8) |
| 2019-08-22 | 43 | 0,0497 | 0,0661 | 0,1460 | unter (Faktor 8,1) |
| 2019-11-20 | 40 | 0,0444 | 0,0787 | 0,1722 | unter (Faktor 9,0) |
| 2020-02-24 | 43 | 0,0519 | 0,0956 | 0,1885 | unter (Faktor 7,7) |
| 2020-05-22 | 44 | 0,0579 | 0,0936 | 0,4191 | unter (Faktor 6,9) |
| 2020-08-21 | 42 | 0,0383 | 0,0593 | 0,1069 | unter (Faktor 10,4) |
| 2020-11-19 | 49 | 0,0672 | 0,1007 | 0,3615 | unter (Faktor 6,0) |
| 2021-02-23 | 57 | 0,1074 | 0,1631 | 0,7034 | unter (Faktor 3,7) |
| 2021-05-24 | 54 | 0,0462 | 0,0720 | 0,4820 | unter (Faktor 8,7) |
| 2021-08-23 | 51 | 0,0391 | 0,0537 | 0,2460 | unter (Faktor 10,2) |
| 2021-11-19 | 55 | 0,0467 | 0,0849 | 0,2434 | unter (Faktor 8,6) |
| 2022-02-22 | 61 | 0,0437 | 0,0867 | 0,2808 | unter (Faktor 9,2) |
| 2022-05-23 | 61 | 0,0328 | 0,0564 | 0,2561 | unter (Faktor 12,2) |
| 2022-08-23 | 52 | 0,0256 | 0,0356 | 0,1120 | unter (Faktor 15,6) |
| 2022-11-21 | 58 | 0,0335 | 0,0501 | 0,2216 | unter (Faktor 11,9) |
| 2023-02-23 | 56 | 0,0361 | 0,0750 | 0,1535 | unter (Faktor 11,1) |
| 2023-05-24 | 53 | 0,0439 | 0,0856 | 0,3950 | unter (Faktor 9,1) |
| 2023-08-24 | 52 | 0,0466 | 0,0940 | 0,2873 | unter (Faktor 8,6) |
| 2023-11-22 | 57 | 0,0439 | 0,0741 | 0,2473 | unter (Faktor 9,1) |
| 2024-02-26 | 62 | 0,0416 | 0,0738 | 0,5691 | unter (Faktor 9,6) |
| 2024-05-24 | 60 | 0,0469 | 0,0688 | 0,2619 | unter (Faktor 8,5) |
| 2024-08-26 | 61 | 0,0572 | 0,1194 | 0,9980 | unter (Faktor 7,0) |
| 2024-11-22 | 70 | 0,0729 | 0,1196 | 0,4475 | unter (Faktor 5,5) |
| 2025-02-27 | 76 | 0,0849 | 0,1266 | 0,4066 | unter (Faktor 4,7) |
| 2025-05-29 | 75 | 0,0734 | 0,1199 | 0,6626 | unter (Faktor 5,5) |
| 2025-08-28 | 77 | 0,0540 | 0,0862 | 0,9071 | unter (Faktor 7,4) |
| 2025-11-26 | 85 | 0,0822 | 0,1394 | 0,5013 | unter (Faktor 4,9) |
| 2026-03-02 | 95 | 0,0856 | 0,1642 | 0,5380 | unter (Faktor 4,7) |

**Was das sagt:** Die notierte Spanne der Korbmitglieder liegt in jeder der 41 Umschichtungen unter
der Hürde, die das Buch je Umlauf abzieht. **Was das nicht sagt:** die notierte Spanne ist die
**Untergrenze** einer Marktorder (Registrierung §9) — Schlupf, Marktimpact, Teilfüllung und der Abstand
zwischen 15:55 ET und dem tatsächlichen Ausführungszeitpunkt des Buchs sind nicht enthalten. Ob 20 Bp
je Seite deshalb „zu viel" sind, entscheidet die laufende Paper-Messung (`kosten.js`), nicht diese Zahl.
Am Buch wird nichts geändert.

## 4. Was dieser Nachtrag NICHT sagt — Registrierung §9 gilt weiter

- **Nicht die effektiven Kosten.** Schlupf, Marktimpact, Warteschlange, Teilfüllung und
  Preisverbesserung fehlen; die notierte Spanne ist die Untergrenze einer Marktorder.
- **Nicht die Tiefe.** `bs`/`as` sind nicht ausgewertet.
- **Nicht die Kosten des CFD-Gefäßes.**
- **Kein Ertragsbeleg für irgendeine Strategie.** Eine wieder offene Variante ist eine Größenaussage.
- **Für 2016–2024 sind es Überlebende** (Rahmen A, Universum vom 02.09.2024); Zusatz C bleibt offen.
- **Keine Übernacht-Hürde aus Zusatz B.** Der Übernachtsprung (0,486 Pp) ist keine Kostengröße;
  die Hürde der Übernacht-Familie ist die Spanne im Schlussfenster — und auch die deckt nur den
  Kauf am Schluss, nicht den Verkauf in der Folgeeröffnung (Eröffnungsfenster: `ERGEBNIS.md` §4).
- **Keine Empfehlung an das Momentum-Buch.**

