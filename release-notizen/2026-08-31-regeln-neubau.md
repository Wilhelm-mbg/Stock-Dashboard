# Regeln-Reiter strukturell neu gebaut (Wilhelms Zielbild, 4 Stufen)

**Art:** Oberflächen-Umbau + Journal-Schreiblogik · **Rolle:** Oberfläche ·
31.08.2026, vier Stufen-Commits nach Wilhelms Formular-Entscheid („sieht immer
noch scheiße aus") — Struktur statt Klapp-Register.

## Was sich ändert

1. **Antwort-Seite vorne** (Pille „Strategien"): Was handelt gerade (je Strategie
   ein Satz + Beleg-Etikett aus Protokoll/Studienregister), was wurde zuletzt
   GETAN (jüngste Order über alle Bücher — Prüfläufe zählen nicht), Autopilot-/
   Marktlage-/Risiko-Zeile. Keine Bedienelemente; neues `DepotAPI.antwort()`,
   nur Lesekopien.
2. **Strategien nach Belegstand, jede genau einmal:** Gruppen „Belegt oder aktiv
   gehandelt" / „In Messung" / „Gemessen und verworfen". Urteile aus der Kette
   Protokoll → studienurteile.js, Population aus SETUPS (`DepotAPI.einstiege()`).
   Stunden-Strategie nur noch im Archivblock (in die Verworfen-Gruppe umgezogen),
   Karten-messKeys und aktiver Auslöser nie doppelt.
3. **Drei Unterreiter statt sechs:** Strategien · Risiko & Einstellungen
   (Intraday + Mittelfrist-Steuerung + Autopilot) · Werkzeug (Regelbuch + Chart +
   Berichte/Backtest). Alle Kennungen unverändert, kein Feature entfernt;
   Abweichung vom Vorschlag: Regelbuch liegt im Werkzeug (nachsehen/nachrechnen).
4. **Journal nur noch Handlungen:** der 30-Minuten-Drift-Takt schreibt keine
   „0 eröffnet, 0 geschlossen, 42 verworfen"-Zeilen mehr; Prüf-Stempel
   (`D.pruefStand`) + EINE Statuszeile „Zuletzt geprüft … / keine Änderung
   seit …". Historie unangetastet, keine Handelslogik geändert.

## Testlage

eslint, test-v6, test-channel grün; UI-Probe grün (5 Reiter, 14 Pillen).
Neun Zusicherungen mit datiertem Kommentar auf ihre Eigenschaft umgebaut
(Panel = class sub; Anker des umgezogenen Archivs/Charts; Pillen-Namen).
Abnahme in isolierter Instanz: jede Pille zeigt genau ihr Bündel, Antwort-Seite
beim Öffnen, keine Konsolenfehler, keine doppelten Strategie-Schalter.
