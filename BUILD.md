# Florentinas Pokémon-Schule — wie man das Spiel ändert

Kopfrechnen bis 100 für die 3. Klasse. **40 Rätsel in 9 Kapiteln.** Gelöste Rätsel
lassen Pokémon sich entwickeln, und in der Arena kämpft das Team gegen sechs Gegner.

Das Wichtigste am Spiel sind für das Kind die **Entwicklungen**. Jede Erweiterung
sollte davon möglichst viele bringen — nicht nur mehr Rechnungen.

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
4. **Kapitel und Rätsel** (`KAPITEL`, `AUFGABEN`) — 40 Rätsel in 9 Kapiteln. `fuer`
   sagt, welches Pokémon trainiert wird, `falle` ist die Lese-Falle (siehe unten).
5. **Arena** (`ARENA_AB_RAETSEL`, `GEGNER`, Komponente `Arena`).
6. **Ansichten** (Komponente `PokemonSchule`).

## Die drei Regeln, an denen der Fortschritt hängt

Das ist der Kern. Sie sind bewusst getrennt — nicht zusammenlegen:

1. **Ein Pokémon kommt erst ins Team, wenn eines seiner Rätsel gelöst ist.**
   `imTeam(stand)` prüft das. Dadurch wächst die Truppe mit dem Fortschritt: nach
   6 Rätseln kämpfen 5 von 16, nach allen 40 sind alle dabei. Das ist der
   wichtigste Schwierigkeitsregler.
2. **Die Entwicklung hängt allein an der ANZAHL gelöster Rätsel**, nicht an den EP
   (`stufeVon(pokemon, stand)` nutzt `stand.anzahl`). Wer viele Hilfen braucht,
   entwickelt sein Team genauso weit. Hilfe holen darf nie den Sieg kosten.
3. **Die EP geben nur einen kleinen Stärkebonus** (`+ep/6` Schaden, `+ep/4` KP).
   Selbstständig lösen lohnt sich, ist aber keine Voraussetzung.

Deshalb wird überall `standVon(id)` übergeben — `{ anzahl, ep }` gebündelt, damit
die beiden nicht vertauscht werden können.

### Der Stufen-Versatz — bitte nicht „aufräumen"

`stufenIndex()` rechnet `anzahl − versatz`. Die neun Pokémon der ersten fünf
Kapitel haben **keinen** Versatz: sie erscheinen schon beim ersten gelösten Rätsel
in ihrer zweiten Stufe. Das ist historisch so und **muss so bleiben** — sonst würde
ein bestehendes Team beim Update zurückentwickelt, und verlorener Fortschritt ist
das Schlimmste, was passieren kann.

Neue Pokémon bekommen `zeigtGrundform: true` und starten sichtbar in Stufe 1. Sie
zeigen dadurch eine Entwicklung mehr. **Neu hinzugefügte Pokémon immer so anlegen.**

## Die zwei Sperren

- **Arena** öffnet ab `ARENA_AB_RAETSEL` (6) gelösten Rätseln, also in Marmoria.
- **Der Boss** (letzter Gegner, derzeit Dragoran) tritt erst an, wenn ALLE Rätsel
  gelöst sind (`bossOffen`, das ist `fertig || abzeichen` — einmal verdient bleibt
  er offen).

Beide Sperren sind **sichtbar und benannt**: der Arena-Knopf zeigt, wie viele
Rätsel noch fehlen; die Gegnerliste zeigt Onix mit Schloss; nach dem vierten Sieg
erklärt ein eigener Bildschirm, was noch fehlt. Nie stillschweigend sperren —
im Vorgängerspiel war eine unsichtbare Schwelle der schlimmste Fehler.

## Rechenarten

Die 40 Rätsel: 29× malnehmen, 25× minus, 16× teilen, 14× plus — meist kombiniert
über zwei bis drei Schritte. Malnehmen und Teilen bleiben im **kleinen 1×1**
(Faktoren bis 9, Divisionen gehen glatt auf).

Die Kampfaufgaben (`kampfRechnung`) mischen 40 % mal, 25 % minus, 20 % teilen,
15 % plus. Alle Ergebnisse bleiben zwischen 2 und 100.

## Abwechslung der Rechenwege — bitte messen

Julias wichtigster Punkt: das Kind soll **kein Muster erkennen**. Sobald ein
Rechenweg dominiert, hört sie auf zu lesen und rechnet blind nach Schema.

Nach jeder Erweiterung nachzählen, welche Abfolgen von Rechenschritten vorkommen
(aus den `loesung`-Texten). Stand Version 4.0: **17 verschiedene Rechenwege** bei
40 Rätseln, häufigstes Muster `×−` mit 7 (18 %), und **kein Muster folgt direkt
auf sich selbst**. Kapitel 9 hat zehn Rätsel mit zehn verschiedenen Wegen und
gar kein `×−`.

Zwei Richtwerte:

- Kein Muster über etwa 25 %. In Version 3.0 lag `×−` bei 37 % — zu schief,
  deshalb wurden fünf Rätsel auf `×+`, `+−`, `−×`, `+×` und `−:` umgebaut.
- Zwei gleiche Wege nie direkt hintereinander.

Vorhandene Wege: `×`, `−`, `:`, `×−`, `×+`, `×:`, `+−`, `−×`, `+×`, `−:`, `:−`,
`:+`, `:×`, `××−`, `×−+`. Beim Ergänzen bevorzugt die seltenen nehmen.

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

## Nachschauen darf nicht zählen

Bis Version 4.0 gab es ein Loch: die Entwicklung hängt an der ANZAHL gelöster
Rätsel, und ein Rätsel galt als gelöst, sobald die richtige Zahl eingegeben war —
auch wenn sie vorher aus dem angezeigten Lösungsweg abgeschrieben wurde. Das Kind
hat das gefunden und ausgenutzt.

Seit 4.1:

- `anzahlVon()` zählt ein Rätsel nur, wenn `ergebnisse[id].loesung` **nicht** gesetzt
  ist. Nachgeschaut heißt: 0 EP **und** kein Fortschritt für die Entwicklung.
- Das Rätsel bleibt trotzdem in `geloest`, damit die Reise weitergeht — sie wird
  nicht blockiert.
- Auf der Reise-Karte steht bei solchen Rätseln **📖 nachgeschaut** statt der EP.
  Antippen öffnet es erneut, mit verborgenem Lösungsweg. Selbst gelöst zählt es.
- Der Knopf sagt die Folge **vorher**: „Dann zählt dieses Rätsel nicht für die
  Entwicklung." Keine unsichtbaren Strafen.
- Ein neues Ergebnis überschreibt ein altes nur, wenn es **nicht schlechter** ist
  (Rang: selbst gelöst > nachgeschaut, bei gleichem Rang mehr EP). Sonst würde ein
  späterer Blick auf den Lösungsweg ein sauber gelöstes Rätsel entwerten.
- **Altfälle werden begnadigt.** Beim Laden eines Spielstands mit
  `regelStand < REGEL_STAND` bekommen alle vorhandenen nachgeschauten Ergebnisse
  `gnade: true` und zählen weiter. Schon erreichte Entwicklungen werden niemals
  rückwirkend weggenommen — das wäre der schlimmere Fehler.

Wer künftig an den Belohnungsregeln dreht: **jede Abkürzung, die ein Kind finden
kann, wird es finden.** Neue Regeln daran messen, ob Abschreiben, Raten oder
Wiederholen mehr bringt als Nachdenken.

## Raten soll sich nicht lohnen

Im Kampf hat sie anfangs so lange geraten, bis eine Zahl passte — die
Antwortmöglichkeiten sind klein, das ging schnell. Seit Version 4.0 gilt:

- **Zwei Versuche pro Zug.** Erster Treffer volle Ladung (`LADUNG[0]`), zweiter
  nur 0,6.
- **Beim zweiten Fehler ist der Zug verloren** (Phase `verpasst`): kein eigener
  Angriff, der Gegner schlägt zu, und die richtige Lösung wird gezeigt.

Wichtig: in den **Rätseln** bleiben die Versuche unbegrenzt. Dort geht es ums
Lernen, mit Hilfen und Fallen-Diagnose — dort wäre eine Sperre falsch. Nur im
Kampf, wo Tempo zählt, kostet Raten etwas.

## Balance der Arena

Sechs Gegner: 80 / 115 / 200 / 290 / 400 / 560 KP bei 5 / 8 / 12 / 15 / 18 / 23
Schaden, nach jedem Sieg heilt das Team 20 KP. Die Simulation modelliert die zwei
Versuche pro Zug mit — der verlorene Zug gleicht das gewachsene Team genau aus. Typ-Vorteil verdoppelt den Schaden,
Abwehr halbiert ihn.

Simuliert mit `scratchpad/sim3.mjs` (400 Durchläufe je Fall). **Dieses Skript liest
TEAM, GEGNER und die Rätsel-Zuordnung direkt aus `src/game.jsx`** — es kann also
nicht von der Wirklichkeit abweichen. Nach jeder Änderung an Kampfwerten,
Pokémon-Werten oder der Rätsel-Zuordnung neu laufen lassen.

| Fortschritt | klug gespielt | unaufmerksam |
|---|---|---|
| 6 Rätsel (Marmoria) | 0 %, Wand bei Arbok | 0 % |
| 15 Rätsel (5 Gegner) | 100 %, 46 Züge | 25 % |
| alle 40, ohne Hilfe | 100 %, 47 Züge | 96 % |
| alle 40, viel Hilfe | 100 %, 56 Züge | 64 % |

Drei Bedingungen müssen erhalten bleiben, wenn man an den Zahlen dreht:

- **In Marmoria darf sie nicht durchkommen** — der Ansporn ist, alle Rätsel zu lösen.
- **Mit allen Rätseln muss sie gewinnen, egal wie viele Hilfen sie gebraucht hat.**
- **Mehr Fortschritt darf das Finale nicht KÜRZER machen.** Das ist zweimal
  passiert: ein Mega-Team räumte die alte Arena in 27 Zügen ab, weniger als mit
  halbem Fortschritt. Deshalb wächst die Arena mit (neuer Gegner am Ende).

Verlieren kostet keinen Fortschritt: es geht beim gleichen Gegner mit geheiltem
Team weiter.
