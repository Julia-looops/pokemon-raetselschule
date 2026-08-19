# Florentinas Pokémon-Schule — wie man das Spiel ändert

Kopfrechnen bis 100 für die 3. Klasse. Gelöste Rätsel geben Erfahrungspunkte,
Pokémon entwickeln sich, und in der Arena kämpft das Team gegen fünf Gegner.

Die ausgelieferte `index.html` ist **erzeugt**, nicht handgeschrieben: React,
Tailwind und der vorkompilierte Spielcode stecken darin, damit die Seite ohne
fremde Server und offline läuft.

> **Niemals `index.html` direkt bearbeiten.** Alles geht in `src/game.jsx`.

## Einmalig einrichten

```bash
npm install
```

## Ändern, bauen, ansehen

```bash
npm run build
npm start
```

`npm start` bedient `http://localhost:8000`. Wichtig: **das Fenster muss sichtbar
sein**, sonst pausiert der Browser Animationen und Service Worker.

## Veröffentlichen

```bash
git add -A && git commit -m "Beschreibung" && git push
```

GitHub Pages baut danach automatisch, rund eine Minute. Live:
https://julia-looops.github.io/pokemon-raetselschule/

## Wo was steckt

| Datei | Inhalt |
|---|---|
| `src/game.jsx` | Der Spielcode. Hier wird gearbeitet. |
| `src/vorlage.html` | HTML-Gerüst mit den Markierungen `<!--BIBLIOTHEKEN-->` und `<!--SPIEL-->`. |
| `tools/build.mjs` | Bibliotheken holen, JSX kompilieren, einsetzen. |
| `index.html` | **Erzeugt.** Nicht bearbeiten. |
| `sw.js` | Service Worker für den Offline-Betrieb. |

## Aufbau des Spielcodes

Die Reihenfolge in `src/game.jsx`:

1. **Typen** (`TYPEN`, `STARK_GEGEN`, `typFaktor`) — wer ist gegen wen stark.
2. **Team** (`TEAM`) — neun Pokémon, je mit `stufen` von schwach nach stark.
   `ab` ist die EP-Schwelle für die Entwicklung, `basis` der Schaden, `hp` die
   Lebenspunkte. Pikachu und Lapras entwickeln sich nicht.
3. **EP-Regeln** — `EP_BASIS` 6 pro Rätsel, `EP_BONUS` 2 je nicht gebrauchter
   Hilfe, also höchstens 12. Entwicklung bei `EP_STUFE_2` (7) und `EP_STUFE_3` (15).
4. **Kapitel und Rätsel** (`KAPITEL`, `AUFGABEN`) — 15 Rätsel. `fuer` sagt, welches
   Pokémon die EP bekommt.
5. **Arena** (`GEGNER`, Komponente `Arena`).
6. **Ansichten** (Komponente `PokemonSchule`): start, karte, team, aufgabe,
   belohnung, arena, urkunde.

## Ein neues Rätsel hinzufügen

Einen Eintrag in `AUFGABEN` ergänzen: fortlaufende `id`, `kap` für das Kapitel,
`fuer` für das Pokémon, dazu `story`, `frage`, `antwort`, `einheit`, die drei
Hilfen `blitzlicht`/`adlerauge`/`denkhilfe` und `loesung`. Karte, Zähler und
Urkunde rechnen automatisch mit.

Wer wie viele Rätsel bekommt, bestimmt, wie weit es sich entwickeln kann:
zwei Rätsel (bis 24 EP) reichen für die dritte Stufe, eines (bis 12 EP) für die
zweite.

## Wichtige Fallen — hier ist schon etwas schiefgegangen

- **Spielstand**: `localStorage`, Schlüssel `florentina-pokemon`, Format
  `{ geloest, ergebnisse, mut, abzeichen }`. **Nicht umbenennen** — sonst ist der
  Fortschritt weg. Ältere Spielstände ohne `abzeichen` funktionieren weiter.
- **Keine unsichtbaren Schwellen.** Die Arena ist immer erreichbar. Erarbeitete
  EP machen das Team *stärker*, sie entscheiden nicht über den Zugang. Inhalt, der
  sich versteckt, ist der schlimmste Fall — genau das ist im Vorgängerspiel passiert.
- **Versionsnummer** steht unten am Startbildschirm (`VERSION`). Bei jeder
  Veröffentlichung hochzählen. Wenn am iPad etwas fehlt, zeigt die Nummer sofort,
  ob das Gerät die neue Fassung hat.
- **`String.replace` mit Dollarzeichen**: im Bauvorgang muss die Ersetzung als
  *Funktion* übergeben werden, sonst deutet JavaScript Folgen wie `$&` im
  minifizierten Bibliothekscode als Sonderbefehle und beschädigt sie. `tools/build.mjs`
  prüft deshalb nach dem Einsetzen, dass jede Bibliothek unverändert in der Seite steht.
- **Ton-Methoden immer am Objekt aufrufen** (`Ton.treffer()`), nie vom Objekt
  gelöst — sonst ist `this` undefiniert und der Fehler bricht mitten im Spielzug ab.

## Balance der Arena

Gegner: 80 / 115 / 155 / 205 / 280 KP bei 5 / 7 / 9 / 11 / 14 Schaden, nach jedem
Sieg heilt das Team 25 KP. Simuliert ergibt das bei voll entwickeltem Team etwa
32–45 Rechenzüge (10–15 Minuten); ohne gelöste Rätsel ist die Arena im ersten
Anlauf nicht zu gewinnen. Verlieren kostet keinen Fortschritt: es geht beim
gleichen Gegner mit geheiltem Team weiter.

Ein Typ-Vorteil verdoppelt den Schaden, eine Abwehr halbiert ihn — das ist der
Hebel, mit dem sich die Länge etwa auf ein Drittel drücken lässt.
