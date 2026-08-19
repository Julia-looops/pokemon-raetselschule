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
3. **EP-Regeln** — `EP_BASIS` 6 pro Rätsel, `EP_BONUS` 2 je nicht gebrauchter
   Hilfe, also höchstens 12.
4. **Kapitel und Rätsel** (`KAPITEL`, `AUFGABEN`) — 15 Rätsel. `fuer` sagt, welches
   Pokémon trainiert wird, `falle` ist die Lese-Falle (siehe unten).
5. **Arena** (`ARENA_AB_RAETSEL`, `GEGNER`, Komponente `Arena`).
6. **Ansichten** (Komponente `PokemonSchule`).

## Die drei Regeln, an denen der Fortschritt hängt

Das ist der Kern. Sie sind bewusst getrennt — nicht zusammenlegen:

1. **Ein Pokémon kommt erst ins Team, wenn eines seiner Rätsel gelöst ist.**
   `imTeam(stand)` prüft das. Dadurch wächst die Truppe mit dem Fortschritt: nach
   6 Rätseln kämpfen 5 von 9, nach allen 15 sind alle dabei. Das ist der
   wichtigste Schwierigkeitsregler.
2. **Die Entwicklung hängt allein an der ANZAHL gelöster Rätsel**, nicht an den EP
   (`stufeVon(pokemon, stand)` nutzt `stand.anzahl`). Wer viele Hilfen braucht,
   entwickelt sein Team genauso weit. Hilfe holen darf nie den Sieg kosten.
3. **Die EP geben nur einen kleinen Stärkebonus** (`+ep/6` Schaden, `+ep/4` KP).
   Selbstständig lösen lohnt sich, ist aber keine Voraussetzung.

Deshalb wird überall `standVon(id)` übergeben — `{ anzahl, ep }` gebündelt, damit
die beiden nicht vertauscht werden können.

## Die zwei Sperren

- **Arena** öffnet ab `ARENA_AB_RAETSEL` (6) gelösten Rätseln, also in Marmoria.
- **Onix** tritt erst an, wenn ALLE Rätsel gelöst sind (`onixOffen`).

Beide Sperren sind **sichtbar und benannt**: der Arena-Knopf zeigt, wie viele
Rätsel noch fehlen; die Gegnerliste zeigt Onix mit Schloss; nach dem vierten Sieg
erklärt ein eigener Bildschirm, was noch fehlt. Nie stillschweigend sperren —
im Vorgängerspiel war eine unsichtbare Schwelle der schlimmste Fehler.

## Rechenarten

Die 15 Rätsel: 12× malnehmen, 10× minus, 5× teilen, 3× plus — meist kombiniert
über zwei bis drei Schritte. Malnehmen und Teilen bleiben im **kleinen 1×1**
(Faktoren bis 9, Divisionen gehen glatt auf).

Die Kampfaufgaben (`kampfRechnung`) mischen 40 % mal, 25 % minus, 20 % teilen,
15 % plus. Alle Ergebnisse bleiben zwischen 2 und 100.

## Lese-Fallen

Das genaue Fertiglesen der Frage ist das eigentliche Übungsziel. Deshalb hat fast
jedes Rätsel ein Feld `falle: { wert, hinweis }`: `wert` ist das Ergebnis, das
herauskommt, wenn man die Frage NICHT fertig liest (eine Zahl mitzählt, die nicht
gefragt war, oder in der Mitte aufhört). Trifft ihre Antwort genau diesen Wert,
bekommt sie nicht das allgemeine „nochmal", sondern die konkrete Diagnose:
*„Gerechnet hast du richtig — aber die 5 vom Tisch waren nicht gefragt."*

Löst sie ein Fallen-Rätsel im ersten Versuch, wird das ausdrücklich gelobt.

Beim Ergänzen neuer Rätsel: `falle` mitdenken. Ein Rätsel ohne Falle ist eine
verpasste Übung.

## Wichtige Fallen — hier ist schon etwas schiefgegangen

- **Spielstand**: `localStorage`, Schlüssel `florentina-pokemon`, Format
  `{ geloest, ergebnisse, mut, abzeichen }`. **Nicht umbenennen** — sonst ist der
  Fortschritt weg. Ältere Spielstände ohne `abzeichen` funktionieren weiter.
- **Sperren ja, unsichtbare Sperren nie.** Seit Version 2.0 ist die Arena bis
  Marmoria zu und Onix bis zum letzten Rätsel gesperrt — das ist gewollt, weil ein
  Ansporn, der schon eingelöst ist, keiner ist. Aber jede Sperre muss auf dem
  Bildschirm stehen und sagen, was genau noch fehlt. Im Vorgängerspiel hat eine
  stille Schwelle das Finale unsichtbar gemacht; das darf nicht wieder passieren.
- **Versionsnummer** steht unten am Startbildschirm (`VERSION`). Bei jeder
  Veröffentlichung hochzählen. Wenn am iPad etwas fehlt, zeigt die Nummer sofort,
  ob das Gerät die neue Fassung hat.
- **`String.replace` mit Dollarzeichen**: im Bauvorgang muss die Ersetzung als
  *Funktion* übergeben werden, sonst deutet JavaScript Folgen wie `$&` im
  minifizierten Bibliothekscode als Sonderbefehle und beschädigt sie. `tools/build.mjs`
  prüft deshalb nach dem Einsetzen, dass jede Bibliothek unverändert in der Seite steht.
- **Helle und dunkle Karten nicht verwechseln.** Der dunkle Rahmen nutzt
  `text-slate-*`, die cremefarbenen Karten (`bg-amber-50`) brauchen `text-stone-*`.
  Ein `text-slate-100` auf der hellen Karte ist praktisch unlesbar — genau das ist
  beim Aufgabentext passiert. Nach Farbänderungen den Kontrast messen, nicht
  schätzen: im Browser über `getComputedStyle` Vordergrund und Hintergrund holen
  und den WCAG-Kontrast rechnen; alles unter 4,5 ist zu wenig.
- **Lob nur, wenn es stimmt.** Die Lese-Fallen haben ein Feld `art`
  (`zusatzzahl`, `mittendrin`, `rechenart`, `verlesen`). Gelobt wird über
  `LOB_FUER_FALLE` nur bei `zusatzzahl` und `verlesen`. Eine pauschale Lobmeldung
  erschien vorher bei fast jedem Rätsel und behauptete dabei meist etwas Falsches.
- **Ton-Methoden immer am Objekt aufrufen** (`Ton.treffer()`), nie vom Objekt
  gelöst — sonst ist `this` undefiniert und der Fehler bricht mitten im Spielzug ab.

## Balance der Arena

Gegner: 80 / 115 / 200 / 290 / 340 KP bei 5 / 8 / 12 / 15 / 17 Schaden, nach jedem
Sieg heilt das Team 20 KP. Typ-Vorteil verdoppelt den Schaden, Abwehr halbiert ihn.

Simuliert (400 Durchläufe je Fall, `scratchpad/wall-sim.mjs`):

| Fortschritt | klug gespielt | unaufmerksam |
|---|---|---|
| 6 Rätsel (Marmoria) | 0 %, Wand bei Arbok | 0 % |
| 9 Rätsel | 99 %, 35 Züge | 22 % |
| 12 Rätsel | 100 %, 32 Züge | 100 % |
| alle 15, ohne Hilfe | 100 %, 41 Züge | 85 % |
| alle 15, viel Hilfe | 100 %, 45 Züge | 46 % |

Zwei Bedingungen müssen erhalten bleiben, wenn man an den Zahlen dreht:

- **In Marmoria darf sie nicht durchkommen** — der Ansporn ist, alle Rätsel zu lösen.
- **Mit allen 15 Rätseln muss sie gewinnen, egal wie viele Hilfen sie gebraucht hat.**

Verlieren kostet keinen Fortschritt: es geht beim gleichen Gegner mit geheiltem
Team weiter.
