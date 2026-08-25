# Wenn etwas ausfällt, sagt die App es jetzt

An achtzehn Stellen konnte im Programm etwas ausfallen, ohne dass irgendwo eine Meldung
erschien — kein Fehler, keine Warnung, nur ausbleibende Daten oder eine Anzeige, die
leer blieb. Solche Fälle fallen erst auf, wenn jemand vermisst, was fehlt. Alle achtzehn
melden sich jetzt.

Zwei davon betrafen mehr als nur die Anzeige:

**Das Kursarchiv konnte Daten verlieren.** War die Platte voll oder der Datenordner
gesperrt, galt der Stand trotzdem als gesichert — beim Beenden war alles seit dem
letzten geglückten Speichern weg. Bei Minutenkursen ist das endgültig, weil sie sich
nicht nachladen lassen. Jetzt bleibt die Änderung vorgemerkt und wird beim nächsten Mal
erneut geschrieben.

**Eine Spiegelung auf dem Demo-Konto konnte halb glücken.** Ging die Order durch, kam
aber keine Bestätigung zurück, galt sie als voller Erfolg — die Position blieb beim
Broker offen, während die Simulation sie längst geschlossen hatte. Solche Fälle stehen
jetzt in der Begründung des Trades und in der Diagnose.

Dazu Kleineres, das denselben Kern hat: Der Aktien-Explorer sagt jetzt, wenn ein
Detektor abgebrochen ist, statt „keine Signale" zu zeigen. Die Marktkarte weist aus,
wenn ihr Filter mangels Daten gar nicht lief. Der Weg „Strategie ablegen und messen"
bleibt erreichbar, auch wenn ein Teil davon nicht lädt. Und die Ergebnis-Drift zählt
die Werte, für die nur die Vergangenheit bekannt ist.

An dem, was die App rechnet oder handelt, ändert sich nichts.
