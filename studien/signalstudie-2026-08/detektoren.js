/* Geprüfte Detektortabelle der Signalstudie - Ergebnis von Phase 1 (Audit, 33 Agenten).
 * Jeder Eintrag: reine Funktion signal(bars, i, params) -> {dir:+1|-1} | null,
 * Präfix-Probe bestanden (0 Abweichungen), Live-Parameter oder dokumentierte Reparatur.
 * Die Module liegen in detektoren/; _tabelle.js ist die Synthese des Audits. */
'use strict';
module.exports = require('./detektoren/_tabelle.js');
