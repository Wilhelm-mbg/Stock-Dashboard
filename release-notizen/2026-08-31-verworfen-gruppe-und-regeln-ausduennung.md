# Vierte Belegstand-Gruppe + Regeln-Reiter ausgedünnt

**Art:** Fehlerbehebung (QS-Fund) + Oberflächen-Umbau · **Rolle:** Oberfläche ·
umgesetzt am 31.08.2026 auf Wilhelms Auftrag. Commits `ff91109` und `99dc3e1`.

## 1. „Gemessen und verworfen" in der Auslöser-Auswahl (QS-Fund 27.08., alle drei Funde)

Die Auslöser-Auswahl kannte nur drei Zustände und nur eine Quelle (die
Messmaschinen-Protokolle). Folgen: ein künftig widerlegtes Protokoll wäre still
unter „Gemessen, aber nicht belegt" gelandet, und vier von anderen Studien
verworfene Auslöser (donchian, squeeze, ruecksetzer, kanaltrend) standen unter
„Nicht gemessen" — der einladendsten Beschriftung.

- `triggerBelegstand` (depot.js) kennt jetzt `widerlegt` als eigenen Zustand;
  vierte Gruppe **„Gemessen und verworfen"** in `#idTrigger`, jede verworfene
  Option trägt Befund + Quelle als Title-Text.
- **Neu: `studienurteile.js`** — Register, in dem Studien außerhalb der
  Messmaschine ihre VERWERFUNG mit Quellenpflicht eintragen. Es kann nur
  verwerfen, nie belegen (D2); liegt ein Protokoll vor, gewinnt das Protokoll.
- `#btMode`-Voreinstellung „daily" trägt ihr Urteil jetzt im Optionstext
  („widerlegt, t = −11,6"), wie `#stcMode` es vormacht.
- Laufzeit-Gegenprobe in isolierter Instanz: Gruppe erscheint, die vier
  Verworfenen sortieren korrekt ein, kreuzung/range bleiben „Nicht gemessen".

## 2. Regeln-Reiter ausgedünnt und geordnet (Wilhelm: „viel zu viel")

- Drei Absatz-Wände (Momentum-Intro + „Was du dabei wissen musst", Drift-Intro
  + Messblock, Autopilot-Intro) stehen wortgleich im Info-Register; sichtbar
  bleibt je ein Satz mit den entscheidungsrelevanten Zahlen. Messaussagen
  verschoben, nie gekürzt — Tests prüfen beide Richtungen.
- Pille „Schalter & Einstellungen" → **„Intraday"** (data-sub bleibt
  `strategien`); alle Verweistexte nachgezogen.
- Regelbuch: die drei Karten in „Bilanz dieser Regel" sind h4-Unterabschnitte.

## Testlage

eslint sauber, UI-Probe grün (5 Reiter, 17 Pillen). test-v6: die 3
Abmeldelisten-Fehlschläge stammen aus fremder, uncommitteter Arbeit im Baum,
die 2 Wachhund-Fehlschläge bestehen auch auf sauberem HEAD (per Wegwerf-
Worktree gegengeprüft) — keiner ist neu.
