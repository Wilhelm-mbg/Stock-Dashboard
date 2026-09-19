---
tags: [bauplan]
---
# Mail-Überblick: Thunderbird lesen, Ticket-Board am Handy (19.09.2026)

**Eigenes Repo seit 19.09.2026:** `C:\Users\Wilhe\Downloads\Mail-Ueberblick`, auf GitHub privat als https://github.com/Wilhelm-mbg/Mail-Ueberblick (Wilhelms Entscheid, Chat vom 19.09.). Bis Commit `ce64aa9` lag alles hier unter `tools/mail-ueberblick.js`, `tools/mail-server.js`, `tools/mail-ueberblick-test.js`, `tools/mail-ueberblick-app/`; mit dem Folge-Commit ist es aus diesem Repo entfernt. Diese Seite ist der Knoten, der dorthin zeigt; die Wahrheit steht im anderen Repo (`README.md`, `CLAUDE.md`) und in der Übergabe `uebergabe/mail-ueberblick-2026-09-19.md`.

## Was es ist

Täglich um 08:00 liest die Routine **„Mail-Überblick"** (Claude-Desktop-App, Cron `0 8 * * *`) Wilhelms Post **lokal aus Thunderbird** — nie über Gmail — und schreibt eine kurze Zusammenfassung: handeln / lesen / Rest. Beide Konten (gms, muehlberg), alle Ordner außer Papierkorb, Spam, Gesendet, Entwürfe, [Gmail]-Systemordner. **Nur lesen:** nichts antwortet, verschiebt, markiert, löscht.

Am Handy zeigt eine Android-App (WebView um eine Seite, die ein kleiner Node-Server auf `wilhelm-pc` über Tailscale liefert) dasselbe als **Ticket-Board wie Jira**: jede Mail ein Ticket `MAIL-n`, Priorität aus der Einordnung der Routine (hoch/mittel/niedrig), Status offen / in Arbeit / erledigt, Notiz. Offene Tickets bleiben über Tage stehen.

## Bausteine (Fundstelle: das Repo Mail-Ueberblick)

| Baustein | Datei dort | Fundstelle / Beleg |
|---|---|---|
| Sammeln | `sammeln.js` | Übergabe Abschnitt 2–3: liest je Ordnerdatei nur das Dateiende (4 MB, verdoppelt bis die älteste Ablagezeit vor dem Fenster liegt), 1,9 s für 46 Mails aus 21 Ordnern |
| Server + Board | `server.js`, `app/seite.html` | Übergabe Abschnitt 6a/6b; `tickets.json` ist die einzige Schreibdatei |
| Android-App | `app/android/`, `app/bauen.js` | APK ohne Gradle: aapt2 → javac → d8 → jar → zipalign → apksigner; Toolchain unter `%LOCALAPPDATA%\Programs\mail-ueberblick-toolchain` |
| Selbsttest | `test.js` | 40 Prüfungen mit Mini-Postfach unter %TEMP% |
| Routine | `~\.claude\scheduled-tasks\mail-ueberblick\SKILL.md` | schreibt `einordnung-*.json` und `ueberblick-*.md` |
| Daten | `Markt-Dashboard-Daten\mail\` | `neu-*.txt`, `einordnung-*.json`, `ueberblick-*.md`, `tickets.json`; APK unter `..\apk\` |

## Entscheide Wilhelms (19.09.2026, Chat-Formulare; Gedächtnisprotokoll, Fundstelle ist die Übergabe)

1. **Alle Ordner**, nicht nur INBOX — die Thunderbird-Filter räumen Rechnungen und Sicherheitswarnungen sofort weg (mit INBOX allein 3 von 47 Mails).
2. **APK bauen** samt Toolchain-Installation im Benutzerordner; Daten **live vom PC über Tailscale**; Inhalt Bericht + alle Mails + Lauf-Protokoll.
3. **Ticket-Board wie Jira** statt Leseliste.
4. **Eigenes Repo und dieser Wiki-Knoten.**

## Fehlerformen, die dabei aufgefallen sind

- Thunderbird schreibt die mbox-Trennzeile unter Windows mit `\r\n`; ein `.+$`-Muster traf das `\r` nicht, das Stoppkriterium griff nie, das Skript las 660 MB statt 68. Gegenprobe im Selbsttest („4 von 8 MB").
- Eine Routine, die aus einer Sitzung ohne Projektordner angelegt wird, bindet sich an den Sitzungs-Hilfsordner der App — der verschwindet mit der Sitzung. Routine neu anlegen, nachdem die Sitzung im Repo steht.
- `Theme.DeviceDefault.DayNight.NoActionBar` gibt es im Android-Framework nicht (nur AppCompat); `Theme.DeviceDefault.DayNight` mit `windowNoTitle`.
- Zweiter Sammellauf am selben Tag verschiebt die Mail-Nummern (Fenster rückt weiter). Einordnung hängt deshalb an der Message-ID.

## Zweites Repo: Management-Tool (19.09.2026, Nachmittag)

Wilhelm hat den Mail-Überblick zum **Live-Management-Tool** erweitert: Ticket-Board mit Priorität, Bearbeiter, SLA-Ampel (1/3/7 Tage je Priorität, überschreibbar), Haushaltstickets mit Wiederholung, Kalender (Fristen, Paketankunft, Termine), Zustellungen (Status, Zustellversuche), Belege, Einkaufsliste, Einnahmen/Ausgaben – als **Electron-Desktop-App mit Installer** und am Handy. Eigenes Repo `C:\Users\Wilhe\Downloads\Management-Tool`, privat auf GitHub als Wilhelm-mbg/Management-Tool. Das Repo Mail-Ueberblick sammelt nur noch (`sammeln.js`) und trägt die Routine, die ab jetzt je Mail auch Bestellstatus, Ankunft und Beleg-Betrag als Felder liefert. Entscheide per Formular: Electron statt Edge-Fenster, SLA je Priorität, Bearbeiter ohne Login (Login = Stufe 3), Haushalt mit Wiederholungen, Einkauf, Ausgaben und Einnahmen. Fundstelle: Übergabe `mail-ueberblick-2026-09-19.md`, Abschnitt 6e.

## Was nicht hierher gehört

Das Repo `Stock-Dashboard` liefert die App aus, misst Handelsideen und trägt Sperrklinken; der Mail-Überblick hat damit nichts zu tun außer dem gemeinsamen Datenordner `Markt-Dashboard-Daten` und der Übergabe-Gewohnheit. Änderungen am Mail-Überblick gehören ins andere Repo, nicht hierher.
