# Was in diesem Ordner liegt

- `VORREGISTRIERUNG.md` — vor der Messung geschrieben, mit Nachtrag 1.
- `ERGEBNIS.md` — die Antwort.
- `messe-news-sentiment.js` — der Lauf. `node messe-news-sentiment.js`
- `machbarkeit.js`, `machbarkeit2.js`, `machbarkeit3.js` — die Vorprüfung.
- `store-kopie/` — eingefrorene Kopie der 17 `newsarchiv_*.json` aus dem
  Electron-Store, Stand 31.08.2026. **Mitcommittet**, weil der Store weiterläuft
  und diesen Stand sonst niemand mehr herstellen kann.
- `archiv-kopie/` — 17 Kursreihen aus `archiv1d`, **nicht committet** (11 MB,
  jederzeit reproduzierbar). Neu anlegen:

      mkdir -p archiv-kopie
      for S in AAPL AMD AMZN ARM ASML AVGO GOOG GOOGL INTC META MSFT MU NVDA QCOM TSLA TSM XOM; do
        cp "E:/Markt-Dashboard-Archiv/archiv1d/bars_1d_$S.json" "archiv-kopie/bars_1d_$S.json"
      done

Der Store und das Kursarchiv wurden ausschliesslich GELESEN.
