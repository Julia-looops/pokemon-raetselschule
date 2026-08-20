const { useState, useEffect, useRef } = React;

/* ============================================================
   FLORENTINAS POKEMON-SCHULE
   Kopfrechnen bis 100 · 3. Klasse VS
   Raetsel entwickeln das Team, das Team kaempft in der Arena.
   ============================================================ */

const VERSION = "3.0";

/* Deutscher Genitiv: Namen auf s, ss, ß, x, z bekommen nur einen Apostroph
   ("Max' Pokémon-Schule"), alle anderen ein s ("Florentinas Pokémon-Schule"). */
function genitiv(name) {
  if (!name) return "";
  return /[sxzß]$/i.test(name) ? name + "\u2019" : name + "s";
}
const SPEICHER_KEY = "florentina-pokemon";

/* ------------------------------------------------------------
   TYPEN
   Absichtlich klein gehalten: nur was in diesem Spiel vorkommt.
   ------------------------------------------------------------ */
const TYPEN = {
  elektro: { name: "Elektro", emoji: "⚡", farbe: "bg-yellow-400 text-stone-900" },
  pflanze: { name: "Pflanze", emoji: "🍃", farbe: "bg-green-500 text-white" },
  wasser: { name: "Wasser", emoji: "💧", farbe: "bg-sky-500 text-white" },
  feuer: { name: "Feuer", emoji: "🔥", farbe: "bg-orange-500 text-white" },
  kaefer: { name: "Käfer", emoji: "🐛", farbe: "bg-lime-600 text-white" },
  flug: { name: "Flug", emoji: "🪶", farbe: "bg-indigo-400 text-white" },
  kampf: { name: "Kampf", emoji: "👊", farbe: "bg-red-600 text-white" },
  eis: { name: "Eis", emoji: "❄️", farbe: "bg-cyan-300 text-stone-900" },
  normal: { name: "Normal", emoji: "⭐", farbe: "bg-stone-400 text-stone-900" },
  gestein: { name: "Gestein", emoji: "🪨", farbe: "bg-amber-700 text-white" },
  gift: { name: "Gift", emoji: "☠️", farbe: "bg-purple-600 text-white" },
  psycho: { name: "Psycho", emoji: "🔮", farbe: "bg-pink-500 text-white" },
  boden: { name: "Boden", emoji: "🏜️", farbe: "bg-yellow-700 text-white" },
};

/* Wer ist gegen wen stark. Nur die Paare, die hier auftreten koennen. */
const STARK_GEGEN = {
  wasser: ["feuer", "gestein", "boden"],
  feuer: ["pflanze", "kaefer", "eis"],
  pflanze: ["wasser", "gestein", "boden"],
  elektro: ["wasser", "flug"],
  kaefer: ["pflanze", "psycho"],
  flug: ["kaefer", "kampf", "pflanze"],
  kampf: ["normal", "gestein"],
  eis: ["flug", "pflanze", "gestein", "boden"],
  gestein: ["feuer", "flug", "kaefer"],
  gift: ["pflanze"],
  psycho: ["kampf", "gift"],
  boden: ["feuer", "elektro", "gestein"],
  normal: [],
};

/* Faktor auf den Schaden: 2 sehr effektiv, 0.5 wenn der Gegner abwehrt. */
function typFaktor(angreiferTyp, verteidigerTyp) {
  if ((STARK_GEGEN[angreiferTyp] || []).includes(verteidigerTyp)) return 2;
  if ((STARK_GEGEN[verteidigerTyp] || []).includes(angreiferTyp)) return 0.5;
  return 1;
}

/* ------------------------------------------------------------
   DAS TEAM
   `stufen` von schwach nach stark. `ab` ist die EP-Schwelle.
   Pikachu und Lapras entwickeln sich nicht — sie werden durch
   EP staerker, ohne die Form zu wechseln.
   ------------------------------------------------------------ */
const TEAM = [
  {
    id: "pikachu", typ: "elektro", attacke: "Donnerschock",
    stufen: [{ name: "Pikachu", emoji: "⚡", basis: 10, hp: 36 }],
    text: "Dein Partner von der ersten Minute an.",
  },
  {
    id: "bisasam", typ: "pflanze", attacke: "Rankenhieb",
    stufen: [
      { name: "Bisasam", emoji: "🌱", basis: 7, hp: 34 },
      { name: "Bisaknosp", emoji: "🌿", basis: 11, hp: 42 },
      { name: "Bisaflor", emoji: "🌺", basis: 15, hp: 52 },
      { name: "Mega-Bisaflor", emoji: "🌺✨", basis: 20, hp: 62 },
    ],
    text: "Die Knospe auf dem Rücken wächst mit jedem Rätsel.",
  },
  {
    id: "schiggy", typ: "wasser", attacke: "Aquaknarre",
    stufen: [
      { name: "Schiggy", emoji: "💧", basis: 7, hp: 34 },
      { name: "Schillok", emoji: "🌊", basis: 11, hp: 42 },
      { name: "Turtok", emoji: "🐢", basis: 15, hp: 54 },
      { name: "Mega-Turtok", emoji: "🐢✨", basis: 20, hp: 64 },
    ],
    text: "Wasser löscht Feuer und zerbricht Gestein.",
  },
  {
    id: "glumanda", typ: "feuer", attacke: "Glut",
    stufen: [
      { name: "Glumanda", emoji: "🔥", basis: 7, hp: 33 },
      { name: "Glutexo", emoji: "🐲", basis: 11, hp: 41 },
      { name: "Glurak", emoji: "🐉", basis: 16, hp: 52 },
      { name: "Mega-Glurak", emoji: "🐉✨", basis: 21, hp: 62 },
    ],
    text: "Aus dem kleinen Schwanzflämmchen wird ein Drache.",
  },
  {
    id: "taubsi", typ: "flug", attacke: "Flügelschlag",
    stufen: [
      { name: "Taubsi", emoji: "🐣", basis: 7, hp: 32 },
      { name: "Tauboga", emoji: "🐦", basis: 11, hp: 40 },
      { name: "Tauboss", emoji: "🦅", basis: 15, hp: 48 },
    ],
    text: "Sieht von oben, was am Boden verborgen ist.",
  },
  {
    id: "raupy", typ: "kaefer", attacke: "Silberhauch",
    stufen: [
      { name: "Raupy", emoji: "🐛", basis: 6, hp: 30 },
      { name: "Safcon", emoji: "🟩", basis: 9, hp: 40 },
      { name: "Smettbo", emoji: "🦋", basis: 15, hp: 46 },
    ],
    text: "Erst Raupe, dann Kokon, dann der schönste Schmetterling.",
  },
  {
    id: "vulpix", typ: "feuer", attacke: "Flammenwurf",
    stufen: [
      { name: "Vulpix", emoji: "🦊", basis: 8, hp: 34 },
      { name: "Vulnona", emoji: "🦊✨", basis: 13, hp: 46 },
    ],
    text: "Neun Schwänze, und jeder einzelne ist verzaubert.",
  },
  {
    id: "menki", typ: "kampf", attacke: "Karateschlag",
    stufen: [
      { name: "Menki", emoji: "🐒", basis: 8, hp: 34 },
      { name: "Rasaff", emoji: "🦍", basis: 13, hp: 46 },
    ],
    text: "Wird richtig wütend — und dadurch richtig stark.",
  },
  {
    id: "abra", zeigtGrundform: true, typ: "psycho", attacke: "Konfusion",
    stufen: [
      { name: "Abra", emoji: "🥠", basis: 6, hp: 28 },
      { name: "Kadabra", emoji: "🥄", basis: 11, hp: 40 },
      { name: "Simsala", emoji: "🔮", basis: 16, hp: 48 },
    ],
    text: "Schläft fast immer — und liest trotzdem jeden Gedanken. Stark gegen Kampf und Gift.",
  },
  {
    id: "sandan", zeigtGrundform: true, typ: "boden", attacke: "Schaufler",
    stufen: [
      { name: "Sandan", emoji: "🦔", basis: 8, hp: 36 },
      { name: "Sandamer", emoji: "🪨", basis: 13, hp: 50 },
    ],
    text: "Gräbt sich durch jeden Boden. Der beste Gegner für Gestein — also für Onix.",
  },
  {
    id: "enton", zeigtGrundform: true, typ: "wasser", attacke: "Aquawelle",
    stufen: [
      { name: "Enton", emoji: "🦆", basis: 8, hp: 36 },
      { name: "Entoron", emoji: "🦢", basis: 14, hp: 48 },
    ],
    text: "Hat immer Kopfweh und weiß nie, warum. Trotzdem eine Wucht im Wasser.",
  },
  {
    id: "lapras", typ: "eis", attacke: "Eisstrahl",
    stufen: [{ name: "Lapras", emoji: "🐋", basis: 12, hp: 50 }],
    text: "Selten und sanft. Trägt dich über jedes Meer.",
  },
];

const TEAM_NACH_ID = {};
TEAM.forEach((p) => { TEAM_NACH_ID[p.id] = p; });

/* Der "Stand" eines Pokemon: wie viele seiner Raetsel geloest sind, und
   wie viele EP dabei zusammengekommen sind.

   Wichtig und bewusst getrennt:
   - Die ENTWICKLUNG haengt allein an der Anzahl geloester Raetsel. Wer Hilfen
     braucht, entwickelt sein Team also genauso weit — Hilfe holen darf nicht
     den Sieg kosten.
   - Die EP geben nur einen kleinen Stärkebonus. Selbstständig loesen lohnt
     sich, ist aber nie Voraussetzung. */
/* Wie viele geloeste Raetsel entsprechen welcher Stufe?

   Die neun Pokemon der ersten Kapitel erscheinen historisch schon beim ERSTEN
   geloesten Raetsel in ihrer zweiten Stufe. Das darf sich nicht aendern — sonst
   wuerde ein bestehendes Team zurueckentwickelt, und das fuehlt sich wie
   verlorener Fortschritt an.

   Pokemon mit `zeigtGrundform` starten dagegen sichtbar in Stufe 1 und
   entwickeln sich erst mit dem zweiten Raetsel. Das gibt mehr
   Entwicklungsmomente — und die sind hier das Beste am Spiel. */
function stufenIndex(pokemon, stand) {
  const versatz = pokemon.zeigtGrundform ? 1 : 0;
  const i = stand.anzahl - versatz;
  return Math.max(0, Math.min(pokemon.stufen.length - 1, i));
}

function stufeVon(pokemon, stand) {
  return pokemon.stufen[stufenIndex(pokemon, stand)];
}

/* Die naechste Entwicklung, oder null wenn voll entwickelt. */
function naechsteStufe(pokemon, stand) {
  const i = stufenIndex(pokemon, stand);
  return i + 1 < pokemon.stufen.length ? pokemon.stufen[i + 1] : null;
}

function staerkeVon(pokemon, stand) {
  return stufeVon(pokemon, stand).basis + Math.floor(stand.ep / 6);
}
function maxHpVon(pokemon, stand) {
  return stufeVon(pokemon, stand).hp + Math.floor(stand.ep / 4);
}

/* Ein Pokemon kaempft erst mit, wenn es mindestens ein Raetsel trainiert hat. */
function imTeam(stand) {
  return stand.anzahl > 0;
}

/* ------------------------------------------------------------
   EP-REGELN
   Wie im ersten Spiel: selbst loesen gibt immer EP, Hilfe kostet
   nie etwas, wer ohne Hilfe auskommt bekommt Bonus.
   ------------------------------------------------------------ */
const EP_BASIS = 6;
const EP_BONUS = 2;
const EP_MAX_PRO_RAETSEL = EP_BASIS + 3 * EP_BONUS; // 12

function epFuer(hilfen, loesungAufgedeckt) {
  if (loesungAufgedeckt) return 0;
  const benutzt = ["blitzlicht", "adlerauge", "denkhilfe"].filter((k) => hilfen[k]).length;
  return EP_BASIS + (3 - benutzt) * EP_BONUS;
}

/* Lob nach dem Loesen — nur fuer die Fallen, bei denen das genaue LESEN
   den Unterschied macht. Bei "mittendrin" und "rechenart" waere es Wandtapete:
   das trifft fast jedes Raetsel, und die normale Rueckmeldung lobt schon. */
const LOB_FUER_FALLE = {
  zusatzzahl:
    "In dieser Aufgabe stand eine Zahl, die gar nicht gefragt war — und du hast sie liegen gelassen. Genau hingeschaut!",
  verlesen:
    "Hier hätte ein einziges zu schnell gelesenes Wort das Ergebnis verdorben. Du hast genau gelesen.",
};

const HILFEN = [
  { id: "blitzlicht", emoji: "💡", name: "Blitzlicht", was: "Zahlen leuchten auf" },
  { id: "adlerauge", emoji: "🔍", name: "Adlerauge", was: "Was ist gesucht?" },
  { id: "denkhilfe", emoji: "🧩", name: "Denkhilfe", was: "In Schritte zerlegen" },
];

/* ------------------------------------------------------------
   KAPITEL UND RAETSEL
   Zahlenraum bis 100, plus und minus, ein bis drei Schritte.
   `fuer` sagt, welches Pokemon die EP bekommt.
   ------------------------------------------------------------ */
const KAPITEL = [
  { id: 1, titel: "Der erste Tag in Alabastia", emoji: "🏠" },
  { id: 2, titel: "Der Wald von Vertania", emoji: "🌳" },
  { id: 3, titel: "Auf dem Weg nach Marmoria", emoji: "🪨" },
  { id: 4, titel: "Die Küste von Azuria", emoji: "🌊" },
  { id: 5, titel: "Kurz vor der Arena", emoji: "🏟️" },
  { id: 6, titel: "Die Höhle von Fuchsania", emoji: "🔮" },
  { id: 7, titel: "Der Sandsturm von Orania", emoji: "🏜️" },
  { id: 8, titel: "Die Liga von Vertania", emoji: "🏆" },
];

const AUFGABEN = [
  {
    id: 1, kap: 1, fuer: "pikachu",
    story: "Professor Eich hat 6 Regale. In jedem Regal stehen 7 Pokébälle. Auf dem Tisch daneben liegen außerdem 5 Pokébälle.",
    frage: "Wie viele Pokébälle stehen in den Regalen?",
    antwort: 42, einheit: "Pokébälle",
    blitzlicht: "Wichtig sind 6 Regale und 7 Bälle pro Regal. Die 5 auf dem Tisch stehen auch im Text.",
    adlerauge: "Gefragt sind nur die Bälle in den REGALEN — nicht alle Bälle im Zimmer.",
    denkhilfe: "6 Regale mit je 7 Bällen: 6 × 7 = ?",
    loesung: "6 × 7 = 42. In den Regalen stehen 42 Pokébälle. Die 5 auf dem Tisch zählen nicht mit.",
    falle: { wert: 47, hinweis: "Du hast die 5 Bälle vom Tisch mitgezählt. Die Frage will nur die Regale — lies sie nochmal ganz.", art: "zusatzzahl" },
  },
  {
    id: 2, kap: 1, fuer: "glumanda",
    story: "Glumanda hat 52 Beeren gesammelt. Weil es so hungrig ist, frisst es 19 davon gleich auf.",
    frage: "Wie viele Beeren hat Glumanda noch?",
    antwort: 33, einheit: "Beeren",
    blitzlicht: "Im Text stecken zwei Zahlen: 52 und 19.",
    adlerauge: "Gefragt ist, was NOCH DA ist, nachdem etwas weggefressen wurde.",
    denkhilfe: "Aufgefressen heißt weniger — also minus: 52 − 19 = ?",
    loesung: "52 − 19 = 33. Glumanda hat noch 33 Beeren.",
  },
  {
    id: 3, kap: 1, fuer: "taubsi",
    story: "Auf Route 1 sitzen 8 Gruppen Taubsi im Gras. In jeder Gruppe sind 9 Vögel. Als Pikachu funkt, fliegen 24 Taubsi erschrocken weg.",
    frage: "Wie viele Taubsi sitzen danach noch im Gras?",
    antwort: 48, einheit: "Taubsi",
    blitzlicht: "Wichtig sind 8 Gruppen, 9 Vögel pro Gruppe und 24, die wegfliegen.",
    adlerauge: "Gefragt ist die Zahl DANACH — also nachdem die 24 weggeflogen sind.",
    denkhilfe: "Zwei Schritte: erst 8 × 9 = ?, dann davon 24 weg.",
    loesung: "8 × 9 = 72, und 72 − 24 = 48. Es sitzen noch 48 Taubsi im Gras.",
    falle: { wert: 72, hinweis: "72 ist die Zahl VORHER. Der Satz geht noch weiter: 24 fliegen weg.", art: "mittendrin" },
  },
  {
    id: 4, kap: 2, fuer: "raupy",
    story: "Im Wald von Vertania hängen 48 Raupy an den Blättern. Sie verteilen sich gleichmäßig auf 6 Bäume.",
    frage: "Wie viele Raupy hängen an einem Baum?",
    antwort: 8, einheit: "Raupy",
    blitzlicht: "Im Text stecken zwei Zahlen: 48 und 6.",
    adlerauge: "Gefragt ist die Anzahl an EINEM Baum, nicht an allen zusammen.",
    denkhilfe: "Gleichmäßig verteilen heißt teilen: 48 : 6 = ?",
    loesung: "48 : 6 = 8. An jedem Baum hängen 8 Raupy.",
    falle: { wert: 42, hinweis: "Du hast 48 − 6 gerechnet. Gleichmäßig aufteilen heißt aber teilen, nicht abziehen.", art: "rechenart" },
  },
  {
    id: 5, kap: 2, fuer: "bisasam",
    story: "Bisasam pflanzt 7 Reihen mit je 8 Samen. In der Nacht fressen Rattfratz 15 Samen auf.",
    frage: "Wie viele Samen wachsen am Morgen noch?",
    antwort: 41, einheit: "Samen",
    blitzlicht: "Wichtig sind 7 Reihen, 8 Samen pro Reihe und 15 gefressene.",
    adlerauge: "Gefragt ist, wie viele AM MORGEN noch wachsen — die gefressenen sind weg.",
    denkhilfe: "Zwei Schritte: erst 7 × 8 = ?, dann davon 15 weg.",
    loesung: "7 × 8 = 56, und 56 − 15 = 41. Am Morgen wachsen noch 41 Samen.",
    falle: { wert: 56, hinweis: "56 sind alle gepflanzten Samen. Die Nacht kommt aber noch — 15 werden gefressen.", art: "mittendrin" },
  },
  {
    id: 6, kap: 2, fuer: "taubsi",
    story: "Tauboga findet 36 Beeren und teilt sie gerecht auf 4 Nester auf. In ein einzelnes Nest legt es später noch 7 Beeren dazu.",
    frage: "Wie viele Beeren liegen in diesem einen Nest?",
    antwort: 16, einheit: "Beeren",
    blitzlicht: "Wichtig sind 36 Beeren, 4 Nester und 7 Beeren extra.",
    adlerauge: "Gefragt ist EIN Nest — und zwar das, in das noch 7 dazugelegt wurden.",
    denkhilfe: "Zwei Schritte: erst 36 : 4 = ?, dann das Ergebnis + 7.",
    loesung: "36 : 4 = 9, und 9 + 7 = 16. In diesem Nest liegen 16 Beeren.",
    falle: { wert: 9, hinweis: "9 liegt in jedem Nest. In DIESES Nest kommen aber noch 7 dazu — lies den letzten Satz nochmal.", art: "mittendrin" },
  },
  {
    id: 7, kap: 3, fuer: "menki",
    story: "Menki stapelt 9 Türme aus je 8 Nüssen. Beim Wütendwerden tritt es 27 Nüsse in den Fluss. Am Ufer liegen noch 6 einzelne Nüsse, die nie zu einem Turm gehört haben.",
    frage: "Wie viele Nüsse stecken noch in den Türmen?",
    antwort: 45, einheit: "Nüsse",
    blitzlicht: "Wichtig sind 9 Türme, 8 Nüsse pro Turm und 27 getretene. Die 6 am Ufer stehen auch im Text.",
    adlerauge: "Gefragt sind nur die Nüsse in den TÜRMEN. Die 6 einzelnen am Ufer gehören nicht dazu.",
    denkhilfe: "Zwei Schritte: erst 9 × 8 = ?, dann davon 27 weg. Die 6 brauchst du nicht.",
    loesung: "9 × 8 = 72, und 72 − 27 = 45. In den Türmen stecken noch 45 Nüsse.",
    falle: { wert: 51, hinweis: "Du hast die 6 einzelnen Nüsse dazugezählt. Die haben nie zu einem Turm gehört.", art: "zusatzzahl" },
  },
  {
    id: 8, kap: 3, fuer: "schiggy",
    story: "Schiggy füllt 63 Liter Wasser gleichmäßig in 7 Fässer. Aus einem Fass laufen später 4 Liter aus.",
    frage: "Wie viele Liter sind noch in diesem einen Fass?",
    antwort: 5, einheit: "Liter",
    blitzlicht: "Wichtig sind 63 Liter, 7 Fässer und 4 Liter, die auslaufen.",
    adlerauge: "Gefragt ist EIN Fass — das, aus dem 4 Liter ausgelaufen sind.",
    denkhilfe: "Zwei Schritte: erst 63 : 7 = ?, dann davon 4 weg.",
    loesung: "63 : 7 = 9, und 9 − 4 = 5. In diesem Fass sind noch 5 Liter.",
    falle: { wert: 59, hinweis: "Du hast 4 vom ganzen Wasser abgezogen. Erst aufteilen, dann von dem EINEN Fass abziehen.", art: "rechenart" },
  },
  {
    id: 9, kap: 3, fuer: "raupy",
    story: "In Marmoria liegen 7 Haufen mit je 9 Steinen. Rocko räumt 3 ganze Haufen weg.",
    frage: "Wie viele Steine liegen danach noch da?",
    antwort: 36, einheit: "Steine",
    blitzlicht: "Wichtig sind 7 Haufen, 9 Steine pro Haufen und 3 weggeräumte Haufen.",
    adlerauge: "Achtung: weggeräumt werden 3 HAUFEN, nicht 3 Steine.",
    denkhilfe: "Drei Schritte: 7 × 9 = ? Dann 3 × 9 = ? Dann das eine minus das andere. Kürzer: es bleiben 4 Haufen übrig.",
    loesung: "7 × 9 = 63 Steine. Weggeräumt: 3 × 9 = 27. Also 63 − 27 = 36 Steine. (Oder gleich: 4 Haufen × 9 = 36.)",
    falle: { wert: 60, hinweis: "Du hast nur 3 Steine abgezogen. Weggeräumt wurden 3 ganze HAUFEN — jeder mit 9 Steinen.", art: "verlesen" },
  },
  {
    id: 10, kap: 4, fuer: "lapras",
    story: "Lapras nimmt 8 Körbe mit je 9 Muscheln an Bord. Auf der Fahrt fallen 5 Muscheln ins Wasser zurück. Am Strand bleiben 20 Muscheln liegen.",
    frage: "Wie viele Muscheln hat Lapras am Ende an Bord?",
    antwort: 67, einheit: "Muscheln",
    blitzlicht: "Wichtig sind 8 Körbe, 9 Muscheln pro Korb und 5, die ins Wasser fallen. Die 20 am Strand stehen auch im Text.",
    adlerauge: "Gefragt ist, was AN BORD ist. Was am Strand liegen bleibt, ist nicht an Bord.",
    denkhilfe: "Zwei Schritte: erst 8 × 9 = ?, dann davon 5 weg. Die 20 brauchst du nicht.",
    loesung: "8 × 9 = 72, und 72 − 5 = 67. Lapras hat 67 Muscheln an Bord.",
    falle: { wert: 87, hinweis: "Du hast die 20 vom Strand dazugezählt. Die sind gerade nicht an Bord.", art: "zusatzzahl" },
  },
  {
    id: 11, kap: 4, fuer: "schiggy",
    story: "Am Hafen von Azuria liegen 40 Boote in 5 gleich großen Reihen. Am Morgen fahren 3 ganze Reihen hinaus.",
    frage: "Wie viele Boote fahren hinaus?",
    antwort: 24, einheit: "Boote",
    blitzlicht: "Wichtig sind 40 Boote, 5 Reihen und 3 Reihen, die hinausfahren.",
    adlerauge: "Gefragt ist, wie viele Boote HINAUSFAHREN — nicht wie viele im Hafen bleiben.",
    denkhilfe: "Zwei Schritte: erst 40 : 5 = ? (eine Reihe), dann × 3 (drei Reihen).",
    loesung: "40 : 5 = 8 Boote pro Reihe, und 8 × 3 = 24. Es fahren 24 Boote hinaus.",
    falle: { wert: 8, hinweis: "8 ist EINE Reihe. Hinaus fahren aber 3 Reihen.", art: "mittendrin" },
  },
  {
    id: 12, kap: 4, fuer: "vulpix",
    story: "Vulpix wärmt 9 Steinkreise mit je 7 Steinen für die Nacht auf. Bis zum Morgen sind 18 Steine wieder kalt geworden.",
    frage: "Wie viele Steine sind morgens noch warm?",
    antwort: 45, einheit: "Steine",
    blitzlicht: "Wichtig sind 9 Kreise, 7 Steine pro Kreis und 18 kalte.",
    adlerauge: "Gefragt sind die Steine, die MORGENS noch warm sind.",
    denkhilfe: "Zwei Schritte: erst 9 × 7 = ?, dann davon 18 weg.",
    loesung: "9 × 7 = 63, und 63 − 18 = 45. Morgens sind noch 45 Steine warm.",
    falle: { wert: 63, hinweis: "63 sind alle Steine am Abend. Über Nacht werden 18 davon kalt.", art: "mittendrin" },
  },
  {
    id: 13, kap: 5, fuer: "bisasam",
    story: "Vor der Arena stehen 9 Gruppen mit je 8 Trainerinnen und Trainern. 25 geben auf und gehen heim. Danach stellen sich 12 neue an.",
    frage: "Wie viele stehen am Ende in der Schlange?",
    antwort: 59, einheit: "Personen",
    blitzlicht: "Wichtig sind 9 Gruppen, 8 Personen pro Gruppe, 25 die gehen und 12 die kommen.",
    adlerauge: "Gefragt ist die Zahl AM ENDE — erst gehen welche, dann kommen welche.",
    denkhilfe: "Drei Schritte: 9 × 8 = ?, dann davon 25 weg, dann + 12.",
    loesung: "9 × 8 = 72, dann 72 − 25 = 47, und 47 + 12 = 59. Am Ende stehen 59 Personen in der Schlange.",
    falle: { wert: 47, hinweis: "Bei 47 hast du in der Mitte aufgehört. Der letzte Satz sagt: 12 stellen sich noch an.", art: "mittendrin" },
  },
  {
    id: 14, kap: 5, fuer: "glumanda",
    story: "Glumandas Training hat 9 Runden mit je 6 Sprüngen. Der Trainer verteilt alle Sprünge danach gleichmäßig auf 6 Tage.",
    frage: "Wie viele Sprünge macht Glumanda an einem Tag?",
    antwort: 9, einheit: "Sprünge",
    blitzlicht: "Wichtig sind 9 Runden, 6 Sprünge pro Runde und 6 Tage.",
    adlerauge: "Gefragt sind die Sprünge an EINEM Tag, nicht alle zusammen.",
    denkhilfe: "Zwei Schritte: erst 9 × 6 = ? (alle Sprünge), dann : 6 (auf sechs Tage).",
    loesung: "9 × 6 = 54 Sprünge, und 54 : 6 = 9. An einem Tag macht Glumanda 9 Sprünge.",
    falle: { wert: 54, hinweis: "54 sind alle Sprünge zusammen. Sie werden noch auf 6 Tage verteilt.", art: "mittendrin" },
  },
  {
    id: 15, kap: 5, fuer: "pikachu",
    story: "Pikachu lädt sich in 7 Runden mit je 9 Volt auf. Bei einem Sprung verliert es 16 Volt. Danach findet es eine Beere, die noch 15 Volt bringt.",
    frage: "Mit wie viel Volt geht Pikachu in die Arena?",
    antwort: 62, einheit: "Volt",
    blitzlicht: "Wichtig sind 7 Runden, 9 Volt pro Runde, 16 verlorene und 15 aus der Beere.",
    adlerauge: "Gefragt ist die Ladung AM ENDE — nach dem Verlust UND nach der Beere.",
    denkhilfe: "Drei Schritte: 7 × 9 = ?, dann davon 16 weg, dann + 15.",
    loesung: "7 × 9 = 63, dann 63 − 16 = 47, und 47 + 15 = 62. Pikachu geht mit 62 Volt in die Arena.",
    falle: { wert: 47, hinweis: "Bei 47 fehlt die Beere. Der letzte Satz bringt noch 15 Volt dazu.", art: "mittendrin" },
  },
  {
    id: 16, kap: 6, fuer: "abra",
    story: "In der Höhle von Fuchsania schweben 8 Kristalle. In jedem Kristall glimmen 9 Funken. Als Abra sich konzentriert, verlöschen 23 Funken.",
    frage: "Wie viele Funken glimmen danach noch?",
    antwort: 49, einheit: "Funken",
    blitzlicht: "Wichtig sind 8 Kristalle, 9 Funken pro Kristall und 23 verloschene.",
    adlerauge: "Gefragt ist die Zahl DANACH — nach dem Verlöschen.",
    denkhilfe: "Zwei Schritte: erst 8 × 9 = ?, dann davon 23 weg.",
    loesung: "8 × 9 = 72, und 72 − 23 = 49. Es glimmen noch 49 Funken.",
    falle: { wert: 72, hinweis: "72 ist die Zahl davor. Der Satz geht weiter: 23 Funken verlöschen.", art: "mittendrin" },
  },
  {
    id: 17, kap: 6, fuer: "abra",
    story: "In der Höhle liegen 54 Leuchtsteine, gleichmäßig verteilt auf 6 Nischen. Abra bringt 4 dieser Nischen zum Leuchten.",
    frage: "Wie viele Steine leuchten jetzt?",
    antwort: 36, einheit: "Steine",
    blitzlicht: "Wichtig sind 54 Steine, 6 Nischen und 4 leuchtende Nischen.",
    adlerauge: "Gefragt sind die Steine in VIER Nischen, nicht in einer.",
    denkhilfe: "Zwei Schritte: erst 54 : 6 = ? (eine Nische), dann × 4.",
    loesung: "54 : 6 = 9 Steine pro Nische, und 9 × 4 = 36. Es leuchten 36 Steine.",
    falle: { wert: 9, hinweis: "9 ist EINE Nische. Abra bringt aber 4 Nischen zum Leuchten.", art: "mittendrin" },
  },
  {
    id: 18, kap: 6, fuer: "bisasam",
    story: "Bisaflor streckt 7 Ranken in die Höhle, an jeder Ranke sitzen 8 Knospen. In der Dunkelheit verwelken 19 Knospen.",
    frage: "Wie viele Knospen sind noch frisch?",
    antwort: 37, einheit: "Knospen",
    blitzlicht: "Wichtig sind 7 Ranken, 8 Knospen pro Ranke und 19 verwelkte.",
    adlerauge: "Gefragt sind nur die Knospen, die noch FRISCH sind.",
    denkhilfe: "Zwei Schritte: erst 7 × 8 = ?, dann davon 19 weg.",
    loesung: "7 × 8 = 56, und 56 − 19 = 37. Es sind noch 37 Knospen frisch.",
    falle: { wert: 56, hinweis: "56 sind alle Knospen. 19 davon sind verwelkt.", art: "mittendrin" },
  },
  {
    id: 19, kap: 6, fuer: "abra",
    story: "Tief in der Höhle stehen 6 Reihen mit je 7 Kristallen. Ein Beben zerbricht 15 davon. Danach wachsen 8 neue Kristalle nach.",
    frage: "Wie viele Kristalle stehen am Ende?",
    antwort: 35, einheit: "Kristalle",
    blitzlicht: "Wichtig sind 6 Reihen, 7 Kristalle pro Reihe, 15 zerbrochene und 8 neue.",
    adlerauge: "Gefragt ist die Zahl AM ENDE — erst zerbrechen welche, dann wachsen welche nach.",
    denkhilfe: "Drei Schritte: 6 × 7 = ?, dann davon 15 weg, dann + 8.",
    loesung: "6 × 7 = 42, dann 42 − 15 = 27, und 27 + 8 = 35. Am Ende stehen 35 Kristalle.",
    falle: { wert: 27, hinweis: "Bei 27 hast du in der Mitte aufgehört. Danach wachsen noch 8 nach.", art: "mittendrin" },
  },
  {
    id: 20, kap: 6, fuer: "schiggy",
    story: "Schiggy füllt 72 Liter Wasser gleichmäßig in 8 Becken. Aus einem Becken laufen 5 Liter aus.",
    frage: "Wie viele Liter sind noch in diesem einen Becken?",
    antwort: 4, einheit: "Liter",
    blitzlicht: "Wichtig sind 72 Liter, 8 Becken und 5 ausgelaufene Liter.",
    adlerauge: "Gefragt ist EIN Becken — das, aus dem etwas ausgelaufen ist.",
    denkhilfe: "Zwei Schritte: erst 72 : 8 = ?, dann davon 5 weg.",
    loesung: "72 : 8 = 9, und 9 − 5 = 4. In diesem Becken sind noch 4 Liter.",
    falle: { wert: 67, hinweis: "Du hast 5 vom ganzen Wasser abgezogen. Erst aufteilen, dann von dem EINEN Becken abziehen.", art: "rechenart" },
  },
  {
    id: 21, kap: 7, fuer: "sandan",
    story: "Im Sandsturm von Orania liegen 9 Sandhügel. Auf jedem Hügel liegen 8 Muscheln. Der Wind verweht 26 Muscheln.",
    frage: "Wie viele Muscheln liegen danach noch auf den Hügeln?",
    antwort: 46, einheit: "Muscheln",
    blitzlicht: "Wichtig sind 9 Hügel, 8 Muscheln pro Hügel und 26 verwehte.",
    adlerauge: "Gefragt ist die Zahl DANACH — nachdem der Wind welche verweht hat.",
    denkhilfe: "Zwei Schritte: erst 9 × 8 = ?, dann davon 26 weg.",
    loesung: "9 × 8 = 72, und 72 − 26 = 46. Es liegen noch 46 Muscheln auf den Hügeln.",
    falle: { wert: 72, hinweis: "72 ist die Zahl vor dem Sturm. Die 26 verwehten fehlen noch.", art: "mittendrin" },
  },
  {
    id: 22, kap: 7, fuer: "sandan",
    story: "In der Wüste stehen 48 Kakteen, gleichmäßig verteilt auf 6 Felder. Sandan pflanzt auf ein einzelnes Feld noch 7 Kakteen dazu.",
    frage: "Wie viele Kakteen stehen auf diesem einen Feld?",
    antwort: 15, einheit: "Kakteen",
    blitzlicht: "Wichtig sind 48 Kakteen, 6 Felder und 7 neue.",
    adlerauge: "Gefragt ist EIN Feld — und zwar das, auf das noch 7 dazukommen.",
    denkhilfe: "Zwei Schritte: erst 48 : 6 = ?, dann das Ergebnis + 7.",
    loesung: "48 : 6 = 8, und 8 + 7 = 15. Auf diesem Feld stehen 15 Kakteen.",
    falle: { wert: 8, hinweis: "8 stehen auf jedem Feld. Auf DIESES Feld kommen aber noch 7 dazu.", art: "mittendrin" },
  },
  {
    id: 23, kap: 7, fuer: "sandan",
    story: "Unter der Wüste liegen 8 Höhlen mit je 9 Kristallen. Beim Sandsturm stürzen 3 ganze Höhlen ein.",
    frage: "Wie viele Kristalle sind danach noch übrig?",
    antwort: 45, einheit: "Kristalle",
    blitzlicht: "Wichtig sind 8 Höhlen, 9 Kristalle pro Höhle und 3 eingestürzte Höhlen.",
    adlerauge: "Achtung: eingestürzt sind 3 HÖHLEN, nicht 3 Kristalle.",
    denkhilfe: "Drei Schritte: 8 × 9 = ? Dann 3 × 9 = ? Dann das eine minus das andere. Kürzer: es bleiben 5 Höhlen.",
    loesung: "8 × 9 = 72 Kristalle. Eingestürzt: 3 × 9 = 27. Also 72 − 27 = 45. (Oder gleich: 5 Höhlen × 9 = 45.)",
    falle: { wert: 69, hinweis: "Du hast nur 3 Kristalle abgezogen. Eingestürzt sind 3 ganze HÖHLEN — jede mit 9 Kristallen.", art: "verlesen" },
  },
  {
    id: 24, kap: 7, fuer: "glumanda",
    story: "Glutexo trainiert 6 Runden mit je 9 Feuersprüngen. 17 Sprünge misslingen und zählen nicht.",
    frage: "Wie viele Sprünge sind gelungen?",
    antwort: 37, einheit: "Sprünge",
    blitzlicht: "Wichtig sind 6 Runden, 9 Sprünge pro Runde und 17 misslungene.",
    adlerauge: "Gefragt sind die GELUNGENEN Sprünge.",
    denkhilfe: "Zwei Schritte: erst 6 × 9 = ?, dann davon 17 weg.",
    loesung: "6 × 9 = 54, und 54 − 17 = 37. Es sind 37 Sprünge gelungen.",
    falle: { wert: 54, hinweis: "54 sind alle Sprünge. 17 davon sind misslungen und zählen nicht.", art: "mittendrin" },
  },
  {
    id: 25, kap: 7, fuer: "menki",
    story: "An 7 Bäumen hängen je 9 Bananen. Rasaff frisst 22 davon auf. Am Boden liegen außerdem 11 alte Bananen, die niemand mehr will.",
    frage: "Wie viele Bananen hängen noch an den Bäumen?",
    antwort: 41, einheit: "Bananen",
    blitzlicht: "Wichtig sind 7 Bäume, 9 Bananen pro Baum und 22 gefressene. Die 11 am Boden stehen auch im Text.",
    adlerauge: "Gefragt sind nur die Bananen, die noch an den BÄUMEN hängen.",
    denkhilfe: "Zwei Schritte: erst 7 × 9 = ?, dann davon 22 weg. Die 11 brauchst du nicht.",
    loesung: "7 × 9 = 63, und 63 − 22 = 41. An den Bäumen hängen noch 41 Bananen.",
    falle: { wert: 52, hinweis: "Du hast die 11 alten Bananen vom Boden dazugezählt. Die hängen nicht an den Bäumen.", art: "zusatzzahl" },
  },
  {
    id: 26, kap: 8, fuer: "enton",
    story: "Bei der Liga treten 8 Trainerinnen an, jede mit 7 Pokébällen. Im ersten Kampf werden 24 Bälle verbraucht.",
    frage: "Wie viele Pokébälle sind noch übrig?",
    antwort: 32, einheit: "Pokébälle",
    blitzlicht: "Wichtig sind 8 Trainerinnen, 7 Bälle pro Trainerin und 24 verbrauchte.",
    adlerauge: "Gefragt ist, wie viele ÜBRIG sind.",
    denkhilfe: "Zwei Schritte: erst 8 × 7 = ?, dann davon 24 weg.",
    loesung: "8 × 7 = 56, und 56 − 24 = 32. Es sind noch 32 Pokébälle übrig.",
    falle: { wert: 56, hinweis: "56 sind alle Bälle am Anfang. 24 wurden schon verbraucht.", art: "mittendrin" },
  },
  {
    id: 27, kap: 8, fuer: "enton",
    story: "In der Liga-Halle liegen 63 Siegerbänder, gleichmäßig verteilt auf 7 Kisten. Enton holt 5 dieser Kisten.",
    frage: "Wie viele Bänder hat Enton geholt?",
    antwort: 45, einheit: "Bänder",
    blitzlicht: "Wichtig sind 63 Bänder, 7 Kisten und 5 geholte Kisten.",
    adlerauge: "Gefragt sind die Bänder aus FÜNF Kisten, nicht aus einer.",
    denkhilfe: "Zwei Schritte: erst 63 : 7 = ? (eine Kiste), dann × 5.",
    loesung: "63 : 7 = 9 Bänder pro Kiste, und 9 × 5 = 45. Enton hat 45 Bänder geholt.",
    falle: { wert: 9, hinweis: "9 ist EINE Kiste. Enton holt aber 5 Kisten.", art: "mittendrin" },
  },
  {
    id: 28, kap: 8, fuer: "enton",
    story: "Im Liga-Saal hängen 9 Ringe mit je 6 Glücksteinen. Beim Jubel fallen 21 Steine heraus. Danach werden 13 neue eingesetzt.",
    frage: "Wie viele Steine hängen am Ende in den Ringen?",
    antwort: 46, einheit: "Steine",
    blitzlicht: "Wichtig sind 9 Ringe, 6 Steine pro Ring, 21 herausgefallene und 13 neue.",
    adlerauge: "Gefragt ist die Zahl AM ENDE — erst fallen welche heraus, dann kommen welche dazu.",
    denkhilfe: "Drei Schritte: 9 × 6 = ?, dann davon 21 weg, dann + 13.",
    loesung: "9 × 6 = 54, dann 54 − 21 = 33, und 33 + 13 = 46. Am Ende hängen 46 Steine in den Ringen.",
    falle: { wert: 33, hinweis: "Bei 33 hast du in der Mitte aufgehört. Danach werden noch 13 eingesetzt.", art: "mittendrin" },
  },
  {
    id: 29, kap: 8, fuer: "lapras",
    story: "Lapras verteilt 56 Muscheln gleichmäßig auf 8 Netze. Aus einem Netz fallen 3 Muscheln ins Meer. Am Strand liegen noch 15 weitere Muscheln.",
    frage: "Wie viele Muscheln sind noch in diesem einen Netz?",
    antwort: 4, einheit: "Muscheln",
    blitzlicht: "Wichtig sind 56 Muscheln, 8 Netze und 3, die ins Meer fallen. Die 15 am Strand stehen auch im Text.",
    adlerauge: "Gefragt ist EIN Netz. Was am Strand liegt, ist in keinem Netz.",
    denkhilfe: "Zwei Schritte: erst 56 : 8 = ?, dann davon 3 weg. Die 15 brauchst du nicht.",
    loesung: "56 : 8 = 7, und 7 − 3 = 4. In diesem Netz sind noch 4 Muscheln.",
    falle: { wert: 19, hinweis: "Du hast die 15 Muscheln vom Strand dazugezählt. Die liegen in keinem Netz.", art: "zusatzzahl" },
  },
  {
    id: 30, kap: 8, fuer: "pikachu",
    story: "Vor dem letzten Kampf lädt Pikachu 9 Runden mit je 7 Volt. Beim Aufwärmen verliert es 18 Volt. Dann findet es eine Beere, die 12 Volt bringt.",
    frage: "Mit wie viel Volt geht Pikachu in den letzten Kampf?",
    antwort: 57, einheit: "Volt",
    blitzlicht: "Wichtig sind 9 Runden, 7 Volt pro Runde, 18 verlorene und 12 aus der Beere.",
    adlerauge: "Gefragt ist die Ladung AM ENDE — nach dem Verlust UND nach der Beere.",
    denkhilfe: "Drei Schritte: 9 × 7 = ?, dann davon 18 weg, dann + 12.",
    loesung: "9 × 7 = 63, dann 63 − 18 = 45, und 45 + 12 = 57. Pikachu geht mit 57 Volt in den Kampf.",
    falle: { wert: 45, hinweis: "Bei 45 fehlt die Beere. Der letzte Satz bringt noch 12 Volt.", art: "mittendrin" },
  },
];

/* ------------------------------------------------------------
   DIE ARENA
   Fuenf Gegner, der letzte ist der Boss. `schaden` ist der
   Grundschaden pro Zug, `hp` die Lebenspunkte.
   ------------------------------------------------------------ */
/* Die Arena oeffnet erst in Marmoria (Kapitel 3), also nach den ersten
   sechs Raetseln. Der Boss (Dragoran) zeigt sich erst, wenn ALLE Raetsel geloest
   sind —
   damit bis zum Schluss etwas Besonderes wartet.
   Wichtig: die Sperren sind sichtbar und benannt, nie stillschweigend. */
const ARENA_AB_RAETSEL = 6;

const GEGNER = [
  { name: "Rattfratz", emoji: "🐭", typ: "normal", hp: 80, schaden: 5,
    spruch: "Ein frecher Anfang. Rattfratz beißt nach deinen Schnürsenkeln." },
  { name: "Zubat", emoji: "🦇", typ: "flug", hp: 115, schaden: 8,
    spruch: "Aus dem Dunkeln flattert Zubat heran. Es ist schnell." },
  { name: "Machollo", emoji: "💪", typ: "kampf", hp: 200, schaden: 12,
    spruch: "Machollo spannt alle Muskeln. Das wird ruppig." },
  { name: "Arbok", emoji: "🐍", typ: "gift", hp: 290, schaden: 15,
    spruch: "Arbok richtet sich auf und zischt. Team Rocket lässt grüßen." },
  { name: "Onix", emoji: "🪨", typ: "gestein", hp: 400, schaden: 18,
    spruch: "Der Boden bebt. ONIX türmt sich vor dir auf." },
  { name: "Dragoran", emoji: "🐲", typ: "flug", hp: 560, schaden: 23, boss: true,
    spruch: "Und dann wird es still. Der Champion der Liga schickt DRAGORAN — den letzten Gegner." },
];

/* Rechenaufgabe fuer einen Kampfzug.
   Mischung mit Schwerpunkt auf Mal und Minus. Malnehmen und Teilen bleiben
   im kleinen 1x1 (Faktoren 2 bis 9), alles andere im Zahlenraum bis 100. */
const wuerfel = (von, bis) => von + Math.floor(Math.random() * (bis - von + 1));

function kampfRechnung() {
  const w = Math.random();

  if (w < 0.4) {
    /* Malnehmen im kleinen 1x1 */
    const a = wuerfel(2, 9);
    const b = wuerfel(2, 9);
    return { text: a + " × " + b, loesung: a * b };
  }

  if (w < 0.65) {
    /* Minus, Ergebnis bleibt zwischen 10 und 100 */
    const gross = wuerfel(45, 95);
    const klein = wuerfel(8, Math.min(47, gross - 10));
    return { text: gross + " − " + klein, loesung: gross - klein };
  }

  if (w < 0.85) {
    /* Teilen — rueckwaerts gebaut, damit es immer glatt aufgeht */
    const teiler = wuerfel(2, 9);
    const ergebnis = wuerfel(2, 9);
    return { text: teiler * ergebnis + " : " + teiler, loesung: ergebnis };
  }

  /* Plus, Summe bleibt unter 100 */
  const a = wuerfel(12, 70);
  const b = wuerfel(8, 100 - a);
  return { text: a + " + " + b, loesung: a + b };
}

/* ============================================================
   TON
   Kleine Klaenge aus dem Web-Audio-Baukasten, keine Dateien.
   ============================================================ */
const NOTE = {
  E4: 329.63, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, B5: 987.77,
  E6: 1318.5, C3: 130.81, E3: 164.81,
};

const Ton = {
  ctx: null,
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  klang(freq, start, dauer, lautst = 0.16, form = "triangle") {
    const ctx = this.start();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = form;
    o.frequency.value = freq;
    const t = ctx.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lautst, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dauer + 0.05);
  },
  richtig() {
    [NOTE.E5, NOTE.G5, NOTE.B5].forEach((f, i) => this.klang(f, i * 0.09, 0.4, 0.15));
  },
  nochmal() {
    this.klang(NOTE.A4, 0, 0.16, 0.1);
    this.klang(NOTE.G4, 0.12, 0.22, 0.1);
  },
  hilfe() {
    [NOTE.B5, NOTE.E6, NOTE.A5, NOTE.E6].forEach((f, i) => this.klang(f, i * 0.06, 0.25, 0.09, "sine"));
  },
  /* Entwicklung: aufsteigende Fanfare */
  entwicklung() {
    [[NOTE.E4, 0], [NOTE.A4, 0.1], [NOTE.C5, 0.2], [NOTE.E5, 0.32], [NOTE.A5, 0.46]]
      .forEach(([f, t]) => this.klang(f, t, 0.6, 0.16));
  },
  treffer() {
    this.klang(NOTE.E6, 0, 0.07, 0.1, "square");
    this.klang(NOTE.B5, 0.07, 0.12, 0.09, "square");
  },
  /* sehr effektiv: kraeftiger Doppelschlag */
  superTreffer() {
    [NOTE.B5, NOTE.E6].forEach((f, i) => this.klang(f, i * 0.05, 0.3, 0.16, "square"));
    this.klang(NOTE.E5, 0.12, 0.35, 0.12);
  },
  einstecken() {
    this.klang(NOTE.E3, 0, 0.22, 0.13, "sawtooth");
    this.klang(NOTE.C3, 0.1, 0.28, 0.1, "sawtooth");
  },
  sieg() {
    [[NOTE.C5, 0], [NOTE.E5, 0.12], [NOTE.G5, 0.24], [NOTE.C5 * 2, 0.38], [NOTE.G5, 0.55]]
      .forEach(([f, t]) => this.klang(f, t, 0.7, 0.17));
  },
};

/* ============================================================
   KLEINE BAUSTEINE
   ============================================================ */

function TypBadge({ typ, klein }) {
  const t = TYPEN[typ];
  if (!t) return null;
  return (
    <span className={`inline-block rounded-full ${t.farbe} ${klein ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} font-black uppercase tracking-wide`}>
      {t.emoji} {t.name}
    </span>
  );
}

function HpBalken({ hp, max, freund }) {
  const anteil = Math.max(0, Math.min(1, hp / max));
  const farbe = anteil > 0.5 ? "bg-green-500" : anteil > 0.22 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-slate-600 bg-slate-900">
        <div className={`h-full ${farbe} transition-all duration-500`} style={{ width: anteil * 100 + "%" }} />
      </div>
      <p className={`mt-1 text-xs font-bold ${freund ? "text-sky-200" : "text-rose-200"}`}>
        {Math.max(0, hp)} / {max} KP
      </p>
    </div>
  );
}

/* Zahlen im Text hervorheben, wenn Blitzlicht aktiv ist */
/* Achtung: dieser Text steht auf der hellen, cremefarbenen Karte.
   Also DUNKLE Schrift — helle Toene wie text-slate-100 waeren unlesbar. */
function StoryText({ text, leuchtet }) {
  if (!leuchtet) return <p className="text-lg leading-relaxed text-stone-800">{text}</p>;
  const teile = text.split(/(\d+)/);
  return (
    <p className="text-lg leading-relaxed text-stone-800">
      {teile.map((t, i) =>
        /^\d+$/.test(t) ? (
          <span key={i} className="rounded bg-yellow-300 px-1 font-black text-slate-900">{t}</span>
        ) : (
          <span key={i}>{t}</span>
        )
      )}
    </p>
  );
}

function HilfeKnopf({ hilfe, aktiv, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={aktiv}
      className={`flex-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
        aktiv
          ? "border-yellow-400 bg-yellow-400/15 text-yellow-200"
          : "border-slate-600 bg-slate-800/60 text-slate-300 active:translate-y-0.5"
      }`}
    >
      <div className="text-2xl">{hilfe.emoji}</div>
      <div className="text-sm font-black">{hilfe.name}</div>
      <div className="text-[11px] opacity-80">{hilfe.was}</div>
    </button>
  );
}

function TonSchalter({ tonAn, setTonAn }) {
  return (
    <button
      onClick={() => { setTonAn(!tonAn); if (!tonAn) Ton.treffer(); }}
      className="rounded-lg px-2 py-1 text-lg"
      title={tonAn ? "Ton aus" : "Ton an"}
    >
      {tonAn ? "🔊" : "🔇"}
    </button>
  );
}

/* Ein Pokemon als Karte, wie im Team-Ueberblick */
function PokemonKarte({ pokemon, stand, klein }) {
  const stufe = stufeVon(pokemon, stand);
  const naechste = naechsteStufe(pokemon, stand);
  const entwickelt = pokemon.stufen.indexOf(stufe) > 0;
  const dabei = imTeam(stand);
  return (
    <div className={`rounded-2xl border-2 p-3 text-center ${
      !dabei ? "border-dashed border-slate-700 bg-slate-900/50"
      : entwickelt ? "border-yellow-400 bg-slate-800"
      : "border-slate-600 bg-slate-800/60"
    }`}>
      <div className={`${klein ? "text-3xl" : "text-5xl"} ${dabei ? "" : "opacity-30"}`}>
        {dabei ? stufe.emoji : "❔"}
      </div>
      <p className={`mt-1 font-black ${dabei ? "text-slate-100" : "text-slate-500"}`}>
        {dabei ? stufe.name : pokemon.stufen[0].name}
      </p>
      {dabei ? (
        <>
          <div className="mt-1"><TypBadge typ={pokemon.typ} klein /></div>
          <p className="mt-2 text-xs font-bold text-sky-200">
            ⭐ {stand.ep} EP · 💥 {staerkeVon(pokemon, stand)} · ❤️ {maxHpVon(pokemon, stand)}
          </p>
          {naechste ? (
            <p className="mt-1 text-[11px] text-slate-400">
              entwickelt sich zu {naechste.name}, wenn du sein nächstes Rätsel löst
            </p>
          ) : pokemon.stufen.length > 1 ? (
            <p className="mt-1 text-[11px] font-bold text-yellow-300">voll entwickelt ✦</p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">entwickelt sich nicht</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-[11px] text-yellow-300/80">
          noch nicht dabei — löse sein Rätsel, dann kämpft es mit
        </p>
      )}
    </div>
  );
}

/* ============================================================
   DIE ARENA
   Rechnen treibt den Angriff, Typ-Vorteile verdoppeln ihn.
   Immer erreichbar — was sie erarbeitet, macht das Team staerker,
   es entscheidet nicht, ob sie hinein darf.
   ============================================================ */
const LADUNG = [1, 0.75, 0.5];          // je nach Versuchen
const HEILUNG_NACH_SIEG = 20;

function Arena({ standVon, tonAn, setTonAn, onGewonnen, onZurueck, abzeichen, bossOffen, geloestAnzahl }) {
  /* Nur trainierte Pokemon kaempfen mit. Wer noch kein Raetsel geloest hat,
     ist noch nicht im Team — dadurch waechst die Truppe mit dem Fortschritt. */
  const DABEI = TEAM.filter((pp) => imTeam(standVon(pp.id)));
  const startHp = () => {
    const h = {};
    DABEI.forEach((p) => { h[p.id] = maxHpVon(p, standVon(p.id)); });
    return h;
  };

  const [phase, setPhase] = useState("intro");
  const [gegnerIdx, setGegnerIdx] = useState(0);
  const [gegnerHp, setGegnerHp] = useState(GEGNER[0].hp);
  const [teamHp, setTeamHp] = useState(startHp);
  const [aktivId, setAktivId] = useState(DABEI.length ? DABEI[0].id : "pikachu");
  const [rechnung, setRechnung] = useState(kampfRechnung);
  const [eingabe, setEingabe] = useState("");
  const [versuche, setVersuche] = useState(0);
  const [meldung, setMeldung] = useState(null);
  const [letzterZug, setLetzterZug] = useState(null);
  const [ohnmaechtig, setOhnmaechtig] = useState(null);   // Name des ohnmaechtigen Pokemon

  const gegner = GEGNER[gegnerIdx];
  const aktiv = TEAM_NACH_ID[aktivId];
  const aktivStand = standVon(aktivId);
  const aktivStufe = stufeVon(aktiv, aktivStand);
  const aktivMax = maxHpVon(aktiv, aktivStand);
  const lebende = DABEI.filter((p) => teamHp[p.id] > 0);

  function neueRunde() {
    setRechnung(kampfRechnung());
    setVersuche(0);
    setEingabe("");
    setMeldung(null);
    setLetzterZug(null);
    setPhase("rechnen");
  }

  function kampfStarten() {
    setGegnerIdx(0);
    setGegnerHp(GEGNER[0].hp);
    setTeamHp(startHp());
    setAktivId(DABEI.length ? DABEI[0].id : "pikachu");
    neueRunde();
  }

  /* Nach einem verlorenen Kampf: derselbe Gegner nochmal, Team geheilt.
     Bewusst mild — ein Kind soll nicht 10 Minuten Fortschritt verlieren. */
  function nochmalGegenDiesen() {
    setGegnerHp(gegner.hp);
    setTeamHp(startHp());
    setAktivId(lebende.length ? lebende[0].id : "pikachu");
    neueRunde();
  }

  function pruefeRechnung() {
    const n = parseInt(eingabe, 10);
    if (Number.isNaN(n)) return;
    if (n !== rechnung.loesung) {
      setVersuche((v) => v + 1);
      setEingabe("");
      setMeldung("Nicht ganz. Rechne nochmal — dein Angriff wird nur etwas schwächer.");
      if (tonAn) Ton.nochmal();
      return;
    }
    /* Treffer: Schaden berechnen */
    const ladung = LADUNG[Math.min(versuche, LADUNG.length - 1)];
    const faktor = typFaktor(aktiv.typ, gegner.typ);
    const schaden = Math.max(1, Math.round(staerkeVon(aktiv, aktivStand) * faktor * ladung));
    const restHp = gegnerHp - schaden;
    setGegnerHp(restHp);
    setEingabe("");
    if (tonAn) {
      if (faktor > 1) Ton.superTreffer();
      else Ton.treffer();
    }

    setLetzterZug({
      art: "angriff",
      schaden,
      faktor,
      attacke: aktiv.attacke,
      wer: aktivStufe.name,
    });

    if (restHp <= 0) {
      if (tonAn) Ton.richtig();
      const warDerLetzte = gegnerIdx + 1 >= GEGNER.length;
      const naechsterWaereBoss = gegnerIdx + 1 === GEGNER.length - 1;
      if (warDerLetzte) {
        if (tonAn) Ton.sieg();
        onGewonnen();
        setPhase("gewonnen");
      } else if (naechsterWaereBoss && !bossOffen) {
        /* Der Boss zeigt sich erst, wenn alle Raetsel geloest sind. Sichtbar erklaert,
           damit klar ist, WAS noch fehlt und warum. */
        setPhase("bossGesperrt");
      } else {
        setPhase("gegnerBesiegt");
      }
      return;
    }
    setPhase("angriffGezeigt");
  }

  /* Der Gegner schlaegt zurueck */
  function gegnerZug() {
    const faktor = typFaktor(gegner.typ, aktiv.typ);
    const schaden = Math.max(1, Math.round(gegner.schaden * faktor));
    const rest = teamHp[aktivId] - schaden;
    setTeamHp({ ...teamHp, [aktivId]: rest });
    if (tonAn) Ton.einstecken();
    setLetzterZug({ art: "gegner", schaden, faktor, wer: gegner.name, ziel: aktivStufe.name });

    if (rest <= 0) {
      const uebrig = DABEI.filter((p) => p.id !== aktivId && teamHp[p.id] > 0);
      setOhnmaechtig(aktivStufe.name);
      setPhase(uebrig.length ? "ohnmacht" : "verloren");
      return;
    }
    setPhase("gegnerGezeigt");
  }

  function naechsterGegner() {
    const i = gegnerIdx + 1;
    setGegnerIdx(i);
    setGegnerHp(GEGNER[i].hp);
    /* Nach jedem Sieg erholt sich das ganze Team ein Stück */
    const geheilt = {};
    DABEI.forEach((p) => {
      const max = maxHpVon(p, standVon(p.id));
      geheilt[p.id] = teamHp[p.id] <= 0 ? 0 : Math.min(max, teamHp[p.id] + HEILUNG_NACH_SIEG);
    });
    setTeamHp(geheilt);
    neueRunde();
  }

  const rahmen = "min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4";

  /* ---------------------------------------------------- Team-Leiste */
  function TeamLeiste({ waehlbar, nachWahl }) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {DABEI.map((p) => {
          const hp = teamHp[p.id];
          const max = maxHpVon(p, standVon(p.id));
          const stufe = stufeVon(p, standVon(p.id));
          const ohnmacht = hp <= 0;
          const ist = p.id === aktivId;
          const vorteil = typFaktor(p.typ, gegner.typ);
          return (
            <button
              key={p.id}
              disabled={!waehlbar || ohnmacht || ist}
              onClick={() => { setAktivId(p.id); setMeldung(null); if (nachWahl) nachWahl(p.id); }}
              className={`relative w-[calc(33.333%-0.34rem)] rounded-xl border-2 p-2 text-center transition ${
                ist ? "border-yellow-400 bg-yellow-400/15"
                : ohnmacht ? "border-slate-700 bg-slate-900 opacity-40"
                : "border-slate-600 bg-slate-800/70 active:translate-y-0.5"
              }`}
            >
              <div className="text-2xl">{ohnmacht ? "💤" : stufe.emoji}</div>
              <div className="truncate text-[11px] font-bold text-slate-200">{stufe.name}</div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                <div
                  className={`h-full ${hp / max > 0.5 ? "bg-green-500" : hp / max > 0.22 ? "bg-yellow-400" : "bg-red-500"}`}
                  style={{ width: Math.max(0, (hp / max) * 100) + "%" }}
                />
              </div>
              {!ohnmacht && vorteil > 1 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-green-500 px-1 text-[10px] font-black text-white">
                  ×2
                </span>
              )}
              {!ohnmacht && vorteil < 1 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-slate-600 px-1 text-[10px] font-black text-white">
                  ½
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------------------------------------------------- INTRO */
  if (phase === "intro") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <button onClick={onZurueck} className="text-sm text-sky-300">← Zurück</button>
          <div className="mt-3 rounded-2xl border-2 border-yellow-500/50 bg-slate-800/70 p-5 text-center">
            <div className="text-5xl">🏟️</div>
            <h2 className="mt-2 text-3xl font-black text-yellow-300">Die Arena</h2>
            <p className="mt-3 text-slate-200">
              Sechs Gegner warten. Der letzte ist{" "}
              <b className="text-yellow-300">Dragoran</b>, der Champion der Liga.
            </p>
            <div className="mt-4 space-y-2 rounded-2xl border border-slate-600 bg-slate-900/70 p-4 text-left text-sm text-slate-200">
              <p><b className="text-yellow-300">Rechnen greift an:</b> Löse die Aufgabe, dein Pokémon schlägt zu. Beim ersten Versuch wird der Angriff am stärksten.</p>
              <p><b className="text-yellow-300">Typ-Vorteil zählt doppelt:</b> Wasser gegen Feuer, Pflanze gegen Gestein, Elektro gegen Flug. Ein <span className="rounded-full bg-green-500 px-1 text-[10px] font-black text-white">×2</span> am Pokémon heißt: das ist jetzt die richtige Wahl.</p>
              <p><b className="text-yellow-300">Wechseln kostet nichts:</b> Du darfst jederzeit ein anderes Pokémon nach vorne schicken.</p>
              <p><b className="text-yellow-300">Dein Team wird durch Rätsel stärker.</b> Entwickelte Pokémon schlagen härter und halten mehr aus.</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {GEGNER.map((g, i) => {
                const zu = g.boss && !bossOffen;
                return (
                  <div
                    key={g.name}
                    className={`rounded-xl border p-2 text-center ${
                      zu ? "border-dashed border-slate-600 bg-slate-900/40" : "border-slate-600 bg-slate-900/60"
                    }`}
                  >
                    <div className="text-2xl">{zu ? "🔒" : g.emoji}</div>
                    <p className="text-[11px] font-bold text-slate-200">{i + 1}. {g.name}</p>
                    {zu ? (
                      <p className="text-[10px] text-yellow-300">erst mit allen Rätseln</p>
                    ) : (
                      <>
                        <TypBadge typ={g.typ} klein />
                        <p className="mt-1 text-[10px] text-slate-400">{g.hp} KP</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {!bossOffen && (
              <p className="mt-3 rounded-xl border border-yellow-500/40 bg-yellow-400/10 p-3 text-sm font-bold text-yellow-200">
                🔒 Dragoran wartet noch. Der Champion tritt erst an, wenn alle{" "}
                {AUFGABEN.length} Rätsel gelöst sind — du hast {geloestAnzahl}. Die anderen
                fünf kannst du jederzeit herausfordern.
              </p>
            )}
            <button
              onClick={kampfStarten}
              className="mt-5 w-full rounded-2xl bg-red-600 px-6 py-4 text-xl font-black text-white shadow-xl active:translate-y-0.5"
            >
              {abzeichen ? "Nochmal in die Arena 🏟️" : "Kampf beginnen! 🔥"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------- GEWONNEN */
  if (phase === "gewonnen") {
    return (
      <div className={rahmen}>
        <div className="mx-auto mt-4 max-w-lg rounded-2xl border-8 border-double border-yellow-500 bg-amber-50 p-8 text-center shadow-2xl">
          <div className="text-6xl">🏅</div>
          <h2 className="mt-3 text-3xl font-black text-stone-900">Arena geschafft!</h2>
          <p className="mt-4 text-lg text-stone-700">
            Alle sechs Gegner besiegt — auch Dragoran, den Champion. Du hast dir das
            <b> Arena-Abzeichen</b> verdient.
          </p>
          <p className="mt-4 text-3xl">⚡ 🏅 🔥</p>
          <p className="mt-2 italic text-stone-600">Das Abzeichen liegt jetzt in deinem Team-Überblick.</p>
          <button onClick={onZurueck} className="mt-6 w-full rounded-xl bg-red-600 py-3 font-bold text-white">
            Zurück
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------- ONIX NOCH GESPERRT */
  if (phase === "bossGesperrt") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="mt-4 rounded-2xl border-2 border-yellow-500/50 bg-slate-800/70 p-6 text-center">
            <div className="text-5xl">🔒</div>
            <h2 className="mt-2 text-2xl font-black text-yellow-300">
              Fünf geschafft — und dann wird es still
            </h2>
            <p className="mt-3 text-slate-200">
              Du hast Rattfratz, Zubat, Machollo, Arbok und sogar Onix besiegt. Stark!
              Aber die Halle bleibt leer:{" "}
              <b className="text-yellow-300">Dragoran</b>, der Champion, tritt erst an,
              wenn du alle {AUFGABEN.length} Rätsel gelöst hast.
            </p>
            <p className="mt-3 text-lg font-black text-sky-200">
              {geloestAnzahl} von {AUFGABEN.length} Rätseln gelöst —{" "}
              {AUFGABEN.length - geloestAnzahl === 1
                ? "es fehlt nur noch eines!"
                : `es fehlen noch ${AUFGABEN.length - geloestAnzahl}.`}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Jedes gelöste Rätsel macht dein Team stärker. Und Dragoran hat 560 KP —
              den schaffst du nur mit einem vollständigen, trainierten Team.
            </p>
            <button
              onClick={onZurueck}
              className="mt-5 w-full rounded-2xl bg-yellow-500 px-6 py-4 text-xl font-black text-slate-900"
            >
              Zurück zu den Rätseln ⚡
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------- VERLOREN */
  if (phase === "verloren") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="mt-4 rounded-2xl border-2 border-slate-600 bg-slate-800/70 p-6 text-center">
            <div className="text-5xl">💤</div>
            <h2 className="mt-2 text-2xl font-black text-yellow-300">Dein Team braucht eine Pause</h2>
            <p className="mt-3 text-slate-200">
              Alle Pokémon sind erschöpft. Kein Problem — du startest wieder bei
              <b> {gegner.name}</b>, mit vollständig geheiltem Team. Der Fortschritt aus der
              Arena bleibt.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Tipp: Achte auf das <span className="rounded-full bg-green-500 px-1 text-[10px] font-black text-white">×2</span> —
              mit dem richtigen Typ geht es viel schneller.
            </p>
            <button onClick={nochmalGegenDiesen} className="mt-5 w-full rounded-2xl bg-red-600 px-6 py-4 text-xl font-black text-white">
              Nochmal gegen {gegner.name}
            </button>
            <button onClick={onZurueck} className="mt-2 w-full rounded-xl border border-slate-600 py-2 text-sm text-slate-300">
              Zurück zu den Rätseln
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------- LAUFENDER KAMPF */
  return (
    <div className={rahmen}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-sm">
          <button onClick={onZurueck} className="text-sky-300">← Zurück</button>
          <span className="flex items-center gap-2 font-bold text-slate-300">
            Gegner {gegnerIdx + 1} von {GEGNER.length}
            <TonSchalter tonAn={tonAn} setTonAn={setTonAn} />
          </span>
        </div>

        {/* Gegner */}
        <div className={`mt-3 rounded-2xl border-2 p-4 ${gegner.boss ? "border-red-500 bg-red-950/40" : "border-slate-600 bg-slate-800/70"}`}>
          <div className="flex items-center gap-3">
            <div className="text-5xl">{gegner.emoji}</div>
            <div className="flex-1">
              <p className="text-lg font-black text-slate-100">
                {gegner.name} {gegner.boss && <span className="text-red-400">· BOSS</span>}
              </p>
              <TypBadge typ={gegner.typ} klein />
              <div className="mt-2"><HpBalken hp={gegnerHp} max={gegner.hp} /></div>
            </div>
          </div>
        </div>

        {/* Dein aktives Pokemon */}
        <div className="mt-3 rounded-2xl border-2 border-sky-500/60 bg-slate-800/70 p-4">
          <div className="flex items-center gap-3">
            <div className="text-5xl">{aktivStufe.emoji}</div>
            <div className="flex-1">
              <p className="text-lg font-black text-slate-100">{aktivStufe.name}</p>
              <TypBadge typ={aktiv.typ} klein />
              <div className="mt-2"><HpBalken hp={teamHp[aktivId]} max={aktivMax} freund /></div>
            </div>
            <div className="text-right text-xs font-bold text-sky-200">
              💥 {staerkeVon(aktiv, aktivStand)}
              <br />
              {typFaktor(aktiv.typ, gegner.typ) > 1 && <span className="text-green-400">×2 stark!</span>}
              {typFaktor(aktiv.typ, gegner.typ) < 1 && <span className="text-slate-400">½ schwach</span>}
            </div>
          </div>
        </div>

        {/* ---------- Rechnen ---------- */}
        {phase === "rechnen" && (
          <div className="mt-3 rounded-2xl border-2 border-yellow-500/50 bg-slate-800/70 p-5">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-300">
              {aktiv.attacke} aufladen
            </p>
            <p className="mt-2 text-center text-5xl font-black text-yellow-300">{rechnung.text}</p>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={eingabe}
                onChange={(e) => setEingabe(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") pruefeRechnung(); }}
                placeholder="?"
                className="w-full rounded-xl border-2 border-slate-600 bg-slate-900 px-4 py-4 text-center text-2xl font-black text-yellow-200 outline-none focus:border-yellow-400"
              />
              <button
                onClick={pruefeRechnung}
                className="rounded-xl bg-yellow-500 px-5 py-4 text-lg font-black text-slate-900 active:translate-y-0.5"
              >
                Angriff!
              </button>
            </div>
            {meldung && <p className="mt-3 text-center text-sm font-bold text-amber-200">{meldung}</p>}
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
              Pokémon wechseln — kostet nichts
            </p>
            <TeamLeiste waehlbar />
          </div>
        )}

        {/* ---------- Dein Angriff ---------- */}
        {phase === "angriffGezeigt" && letzterZug && (
          <div className="mt-3 rounded-2xl border-2 border-green-500/50 bg-slate-800/70 p-5 text-center">
            <div className="text-4xl">💥</div>
            <p className="mt-2 text-lg font-black text-slate-100">
              {letzterZug.wer} setzt {letzterZug.attacke} ein!
            </p>
            <p className="mt-1 text-3xl font-black text-green-400">−{letzterZug.schaden} KP</p>
            {letzterZug.faktor > 1 && <p className="mt-1 font-black text-green-300">Sehr effektiv! ×2</p>}
            {letzterZug.faktor < 1 && <p className="mt-1 text-slate-400">Nicht sehr effektiv …</p>}
            <button onClick={gegnerZug} className="mt-5 w-full rounded-2xl bg-slate-700 px-6 py-4 text-lg font-black text-white">
              {gegner.name} greift an →
            </button>
          </div>
        )}

        {/* ---------- Gegner-Angriff ---------- */}
        {phase === "gegnerGezeigt" && letzterZug && (
          <div className="mt-3 rounded-2xl border-2 border-rose-500/50 bg-slate-800/70 p-5 text-center">
            <div className="text-4xl">🛡️</div>
            <p className="mt-2 text-lg font-black text-slate-100">
              {letzterZug.wer} trifft {letzterZug.ziel}!
            </p>
            <p className="mt-1 text-3xl font-black text-rose-400">−{letzterZug.schaden} KP</p>
            {letzterZug.faktor < 1 && <p className="mt-1 text-green-300">Zum Glück nicht sehr effektiv.</p>}
            {letzterZug.faktor > 1 && <p className="mt-1 text-rose-300">Das hat gesessen …</p>}
            <button onClick={neueRunde} className="mt-5 w-full rounded-2xl bg-yellow-500 px-6 py-4 text-lg font-black text-slate-900">
              Weiter angreifen ⚡
            </button>
          </div>
        )}

        {/* ---------- Pokemon ohnmächtig ---------- */}
        {phase === "ohnmacht" && (
          <div className="mt-3 rounded-2xl border-2 border-slate-600 bg-slate-800/70 p-5 text-center">
            <div className="text-4xl">💤</div>
            <p className="mt-2 text-lg font-black text-slate-100">
              {ohnmaechtig || aktivStufe.name} kann nicht mehr weiterkämpfen.
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Tippe das Pokémon an, das jetzt nach vorne geht — dann geht es sofort weiter.
            </p>
            <TeamLeiste waehlbar nachWahl={() => { setOhnmaechtig(null); neueRunde(); }} />
          </div>
        )}

        {/* ---------- Gegner besiegt ---------- */}
        {phase === "gegnerBesiegt" && (
          <div className="mt-3 rounded-2xl border-2 border-yellow-400 bg-slate-800/70 p-5 text-center">
            <div className="text-5xl">🎉</div>
            <p className="mt-2 text-xl font-black text-yellow-300">{gegner.name} ist besiegt!</p>
            <p className="mt-2 text-slate-200">
              Dein Team erholt sich um {HEILUNG_NACH_SIEG} KP. Als nächstes:{" "}
              <b className="text-slate-100">{GEGNER[gegnerIdx + 1].name}</b>{" "}
              {GEGNER[gegnerIdx + 1].emoji}
            </p>
            <div className="mt-2"><TypBadge typ={GEGNER[gegnerIdx + 1].typ} /></div>
            <p className="mt-3 text-sm text-slate-300">{GEGNER[gegnerIdx + 1].spruch}</p>
            <button onClick={naechsterGegner} className="mt-5 w-full rounded-2xl bg-red-600 px-6 py-4 text-xl font-black text-white">
              Weiter zum nächsten Gegner →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DAS SPIEL
   ============================================================ */
function PokemonSchule() {
  const [view, setView] = useState("start");
  const [idx, setIdx] = useState(0);
  const [geloest, setGeloest] = useState([]);
  const [ergebnisse, setErgebnisse] = useState({});
  const [mut, setMut] = useState(0);
  const [abzeichen, setAbzeichen] = useState(false);
  const [runde, setRunde] = useState(null);
  const [eingabe, setEingabe] = useState("");
  const [hilfen, setHilfen] = useState({ blitzlicht: false, adlerauge: false, denkhilfe: false });
  const [versuche, setVersuche] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [zeigLoesung, setZeigLoesung] = useState(false);
  const [tonAn, setTonAn] = useState(true);
  const [geladen, setGeladen] = useState(false);
  const [name, setName] = useState("");
  const [nameEingabe, setNameEingabe] = useState("");

  const a = AUFGABEN[idx];
  const fertig = geloest.length === AUFGABEN.length;

  /* EP eines Pokemon: Summe aus allen geloesten Raetseln, die ihm gehoeren */
  function epVon(pokemonId) {
    return AUFGABEN.filter((x) => x.fuer === pokemonId).reduce(
      (s, x) => s + (ergebnisse[x.id] ? ergebnisse[x.id].ep : 0),
      0
    );
  }
  /* Wie viele Raetsel dieses Pokemon sind geloest? Davon haengt die Entwicklung ab. */
  function anzahlVon(pokemonId) {
    return AUFGABEN.filter((x) => x.fuer === pokemonId && geloest.includes(x.id)).length;
  }
  /* Beides gebuendelt — so wird an den Anzeigestellen nichts vertauscht. */
  function standVon(pokemonId) {
    return { anzahl: anzahlVon(pokemonId), ep: epVon(pokemonId) };
  }

  const epGesamt = Object.values(ergebnisse).reduce((s, e) => s + e.ep, 0);
  const entwickelt = TEAM.filter((p) => p.stufen.indexOf(stufeVon(p, standVon(p.id))) > 0).length;
  const imTeamAnzahl = TEAM.filter((p) => imTeam(standVon(p.id))).length;

  /* ---------------- Speichern und Laden ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.speicher.get(SPEICHER_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          setGeloest(d.geloest || []);
          setErgebnisse(d.ergebnisse || {});
          setMut(d.mut || 0);
          setAbzeichen(d.abzeichen || false);
          /* Spielstaende von vor der Namenseingabe gehoeren Florentina — sie soll
             nicht ploetzlich nach ihrem Namen gefragt werden. */
          setName(d.name || ((d.geloest && d.geloest.length) ? "Florentina" : ""));
        }
      } catch (e) {
        /* erster Start */
      }
      setGeladen(true);
    })();
  }, []);

  useEffect(() => {
    if (!geladen) return;
    (async () => {
      try {
        await window.speicher.set(
          SPEICHER_KEY,
          JSON.stringify({ geloest, ergebnisse, mut, abzeichen, name })
        );
      } catch (e) {
        /* kein Speicher — Spiel laeuft trotzdem */
      }
    })();
  }, [geloest, ergebnisse, mut, abzeichen, name, geladen]);

  /* Auch der Tab-Titel und das Symbol am Home-Bildschirm sollen den Namen tragen. */
  useEffect(() => {
    document.title = name ? genitiv(name) + " Pokémon-Schule" : "Pokémon-Schule";
  }, [name]);

  async function allesZuruecksetzen() {
    setGeloest([]); setErgebnisse({}); setMut(0); setAbzeichen(false);
    setName(""); setNameEingabe("");
    setRunde(null); setIdx(0); setEingabe("");
    setHilfen({ blitzlicht: false, adlerauge: false, denkhilfe: false });
    setVersuche(0); setFeedback(null); setZeigLoesung(false);
    setView("start");
    try {
      await window.speicher.set(SPEICHER_KEY, JSON.stringify({ geloest: [], ergebnisse: {}, mut: 0, abzeichen: false, name: "" }));
    } catch (e) { /* egal */ }
  }

  /* ---------------- Raetsel-Ablauf ---------------- */
  function neueAufgabe(i) {
    setIdx(i);
    setEingabe("");
    setHilfen({ blitzlicht: false, adlerauge: false, denkhilfe: false });
    setVersuche(0);
    setFeedback(null);
    setZeigLoesung(false);
    setRunde(null);
    setView("aufgabe");
  }

  function hilfeHolen(art) {
    if (hilfen[art]) return;
    setHilfen({ ...hilfen, [art]: true });
    setMut((m) => m + 1);
    if (tonAn) Ton.hilfe();
  }

  function pruefen() {
    const n = parseInt(eingabe, 10);
    if (Number.isNaN(n)) return;
    if (n !== a.antwort) {
      setVersuche((v) => v + 1);
      /* Trifft sie genau den Fallen-Wert, hat sie sich nicht verrechnet, sondern
         die Frage nicht fertig gelesen. Dann bekommt sie genau DAZU den Hinweis. */
      setFeedback(a.falle && n === a.falle.wert ? "falle" : "nochmal");
      if (tonAn) Ton.nochmal();
      return;
    }
    const ep = epFuer(hilfen, zeigLoesung);
    const pokemon = TEAM_NACH_ID[a.fuer];
    const standVorher = standVon(a.fuer);
    const schonGeloest = geloest.includes(a.id);
    const standNachher = {
      anzahl: standVorher.anzahl + (schonGeloest ? 0 : 1),
      ep: standVorher.ep + ep,
    };
    const stufeVorher = stufeVon(pokemon, standVorher);
    const stufeNachher = stufeVon(pokemon, standNachher);
    const hatEntwickelt = stufeVorher.name !== stufeNachher.name;

    setErgebnisse({
      ...ergebnisse,
      [a.id]: { ep, ...hilfen, loesung: zeigLoesung },
    });
    if (!geloest.includes(a.id)) setGeloest([...geloest, a.id]);

    setRunde({ ep, pokemon, stufeVorher, stufeNachher, hatEntwickelt,
               ersterVersuch: versuche === 0,
               falleArt: a.falle ? a.falle.art : null });
    setFeedback(null);
    if (tonAn) { Ton.richtig(); if (hatEntwickelt) setTimeout(() => Ton.entwicklung(), 450); }
    setView("belohnung");
  }

  const rahmen = "min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4";

  /* Arena-Knopf. Die Sperre ist SICHTBAR und benannt: sie soll wissen, dass
     dort etwas wartet, und genau was noch fehlt. Nie stillschweigend verstecken. */
  const arenaOffen = geloest.length >= ARENA_AB_RAETSEL;
  const nochBisArena = ARENA_AB_RAETSEL - geloest.length;

  function ArenaKnopf({ klein }) {
    if (!arenaOffen) {
      return (
        <div className={`w-full rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 text-center ${klein ? "py-3" : "px-4 py-4"}`}>
          <p className="text-base font-black text-slate-300">🔒 Die Kampf-Arena ist zu</p>
          <p className="mt-1 text-sm text-yellow-200">
            Sie öffnet in Marmoria — noch {nochBisArena}{" "}
            {nochBisArena === 1 ? "Rätsel" : "Rätsel"}, dann darfst du hinein.
          </p>
        </div>
      );
    }
    return (
      <button
        onClick={() => setView("arena")}
        className={`w-full rounded-2xl border-2 border-yellow-400 bg-red-600 font-black text-white shadow-xl active:translate-y-0.5 ${
          klein ? "py-3 text-base" : "px-6 py-4 text-xl"
        }`}
      >
        🏟️ {abzeichen ? "Nochmal in die Arena" : fertig ? "In die Arena — Dragoran wartet!" : "In die Arena!"}
      </button>
    );
  }

  /* ============================ NAME ============================ */
  /* Erscheint nur beim allerersten Start. Danach steckt der Name im Spielstand
     dieses Geraets — andere Kinder auf anderen Geraeten sind davon unberuehrt. */
  if (geladen && !name) {
    const sauber = nameEingabe.trim();
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-md">
          <div className="pt-10 text-center">
            <div className="text-6xl">⚡</div>
            <h1 className="mt-3 text-3xl font-black text-yellow-300">Pokémon-Schule</h1>
            <p className="mt-2 text-slate-300">Bevor es losgeht:</p>
          </div>
          <div className="mt-6 rounded-2xl bg-amber-50 p-6 text-stone-800 shadow-xl">
            <p className="text-xl font-black">Wie heißt du?</p>
            <p className="mt-2 text-sm text-stone-600">
              Dein Name steht dann in der Urkunde und im Brief von Professor Eich.
            </p>
            <input
              type="text"
              value={nameEingabe}
              maxLength={14}
              autoFocus
              onChange={(e) => setNameEingabe(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && sauber) setName(sauber); }}
              placeholder="Dein Name"
              className="mt-4 w-full rounded-xl border-2 border-stone-400 bg-white px-4 py-4 text-center text-2xl font-black text-stone-800 outline-none focus:border-red-600"
            />
            {sauber && (
              <p className="mt-3 text-center text-sm text-stone-600">
                Wird dann <b>{genitiv(sauber)} Pokémon-Schule</b> heißen.
              </p>
            )}
            <button
              onClick={() => { if (sauber) setName(sauber); }}
              disabled={!sauber}
              className={`mt-4 w-full rounded-2xl px-6 py-4 text-xl font-black shadow-xl ${
                sauber ? "bg-red-600 text-white active:translate-y-0.5" : "bg-stone-300 text-stone-500"
              }`}
            >
              Los geht&apos;s! ⚡
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">
            Der Name bleibt nur auf diesem Gerät. Version {VERSION}
          </p>
        </div>
      </div>
    );
  }

  /* ============================ START ============================ */
  if (view === "start") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="pt-6 text-center">
            <div className="text-6xl">⚡</div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-yellow-300">
              Pokémon-Liga · Alabastia
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-yellow-300">
              {genitiv(name)}<br />Pokémon-Schule
            </h1>
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 p-6 text-stone-800 shadow-xl">
            <p className="text-lg">Hallo {name},</p>
            <p className="mt-3 text-lg leading-relaxed">
              du bekommst heute dein erstes Team. Neun Pokémon warten auf dich —
              <b> Pikachu</b> ist von Anfang an dabei.
            </p>
            <p className="mt-3 text-lg leading-relaxed">
              Jedes Rätsel, das du löst, gibt einem deiner Pokémon
              <b> Erfahrungspunkte</b>. Genug davon, und es <b>entwickelt sich</b> —
              aus Glumanda wird irgendwann Glurak.
            </p>
            <p className="mt-3 text-lg leading-relaxed">
              In der <b>Arena</b> warten fünf Gegner. Dort zählt beides: richtig rechnen
              und das richtige Pokémon wählen.
            </p>
            <p className="mt-4 italic text-stone-600">Professor Eich 🥼</p>
          </div>

          <div className="mt-5 rounded-2xl border-2 border-slate-600 bg-slate-800/70 p-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-300">
              Deine drei Hilfen — Hilfe holen ist klug, nicht schwach
            </p>
            <div className="mt-3 flex gap-2">
              {HILFEN.map((h) => (
                <div key={h.id} className="flex-1 rounded-xl border border-slate-600 bg-slate-900/60 p-2 text-center">
                  <div className="text-2xl">{h.emoji}</div>
                  <div className="text-sm font-black text-slate-100">{h.name}</div>
                  <div className="text-[11px] text-slate-400">{h.was}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Jede Hilfe gibt +1 Mut-Punkt. Ohne Hilfe gibt es mehr Erfahrungspunkte.
            </p>
          </div>

          <button
            onClick={() => setView("karte")}
            className="mt-5 w-full rounded-2xl bg-yellow-500 px-6 py-4 text-xl font-black text-slate-900 shadow-xl active:translate-y-0.5"
          >
            {geloest.length ? "Weiterspielen ⚡" : "Los geht's! ⚡"}
          </button>
          <div className="mt-2"><ArenaKnopf klein /></div>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Version {VERSION}
          </p>
        </div>
      </div>
    );
  }

  /* ============================ KARTE ============================ */
  if (view === "karte") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-yellow-300">Deine Reise</h2>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
              ✅ {geloest.length}/{AUFGABEN.length} · ⭐ {epGesamt} EP · 💪 {mut}
              <TonSchalter tonAn={tonAn} setTonAn={setTonAn} />
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Ein gelöstes Rätsel nochmal antippen geht immer — für mehr Erfahrungspunkte.
          </p>

          {KAPITEL.map((k) => {
            const auf = AUFGABEN.filter((x) => x.kap === k.id);
            const offenIdx = AUFGABEN.findIndex((x) => !geloest.includes(x.id));
            return (
              <div key={k.id} className="mt-4 rounded-2xl border-2 border-slate-600 bg-slate-800/60 p-4">
                <p className="text-lg font-bold text-slate-100">{k.emoji} {k.titel}</p>
                <div className="mt-3 flex gap-2">
                  {auf.map((x) => {
                    const ok = geloest.includes(x.id);
                    const i = AUFGABEN.indexOf(x);
                    const gesperrt = i > offenIdx && offenIdx !== -1;
                    const p = TEAM_NACH_ID[x.fuer];
                    const stufe = stufeVon(p, standVon(x.fuer));
                    return (
                      <button
                        key={x.id}
                        disabled={gesperrt}
                        onClick={() => neueAufgabe(i)}
                        className={`flex h-20 flex-1 flex-col items-center justify-center rounded-xl font-black transition ${
                          ok ? "bg-yellow-400 text-slate-900 active:translate-y-0.5"
                          : gesperrt ? "bg-slate-800 text-slate-600"
                          : "bg-red-600 text-white active:translate-y-0.5"
                        }`}
                      >
                        <span className="text-2xl">{gesperrt ? "🔒" : stufe.emoji}</span>
                        <span className="text-[11px]">
                          {ok ? (ergebnisse[x.id] ? ergebnisse[x.id].ep : 0) + " EP" : gesperrt ? "" : "Rätsel"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mt-5"><ArenaKnopf /></div>
          <p className="mt-2 text-center text-xs text-slate-400">
            {entwickelt} von {TEAM.length} Pokémon entwickelt.
            {arenaOffen && !fertig && " Dragoran tritt erst an, wenn alle Rätsel gelöst sind."}
          </p>

          <div className="mt-4 flex gap-2">
            <button onClick={() => setView("team")} className="flex-1 rounded-xl bg-sky-700 py-3 font-bold text-white">
              🧢 Mein Team
            </button>
            {fertig && (
              <button onClick={() => setView("urkunde")} className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-slate-900">
                📜 Urkunde
              </button>
            )}
          </div>
          <button onClick={() => setView("start")} className="mt-2 w-full rounded-xl border border-slate-700 py-2 text-xs text-slate-400">
            Zum Anfang
          </button>
        </div>
      </div>
    );
  }

  /* ============================ TEAM ============================ */
  if (view === "team") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-black text-yellow-300">🧢 Mein Team</h2>
          <p className="mt-1 text-sm text-slate-400">
            {imTeamAnzahl} von {TEAM.length} im Team · {entwickelt} entwickelt · ⭐ {epGesamt} EP
          </p>

          {abzeichen && (
            <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-amber-50 p-4 text-center">
              <div className="text-4xl">🏅</div>
              <p className="mt-1 font-black text-stone-900">Arena-Abzeichen</p>
              <p className="text-xs text-stone-600">Alle sechs Gegner besiegt, auch Dragoran</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEAM.map((p) => <PokemonKarte key={p.id} pokemon={p} stand={standVon(p.id)} />)}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Typ-Merkhilfe</p>
            <p className="mt-2 text-sm text-slate-300">
              💧 Wasser schlägt 🔥 Feuer und 🪨 Gestein · 🔥 Feuer schlägt 🍃 Pflanze und 🐛 Käfer ·
              🍃 Pflanze schlägt 💧 Wasser und 🪨 Gestein · ⚡ Elektro schlägt 💧 Wasser und 🪶 Flug ·
              👊 Kampf schlägt ⭐ Normal und 🪨 Gestein · ❄️ Eis schlägt 🪶 Flug und 🍃 Pflanze
            </p>
          </div>

          <button onClick={() => setView("karte")} className="mt-5 w-full rounded-xl bg-yellow-500 py-3 font-bold text-slate-900">
            Zurück zur Reise
          </button>
          <button
            onClick={() => { setNameEingabe(name); setName(""); }}
            className="mt-2 w-full rounded-xl border border-slate-600 py-2 text-xs text-slate-300"
          >
            Namen ändern (aktuell: {name})
          </button>
          <button onClick={allesZuruecksetzen} className="mt-2 w-full rounded-xl border border-red-500/40 py-2 text-xs text-red-300">
            Alles von vorne beginnen (für Erwachsene) — löscht Team, Fortschritt und Namen
          </button>
        </div>
      </div>
    );
  }

  /* ============================ ARENA ============================ */
  if (view === "arena") {
    return (
      <Arena
        standVon={standVon}
        tonAn={tonAn}
        setTonAn={setTonAn}
        abzeichen={abzeichen}
        bossOffen={fertig || abzeichen}
        geloestAnzahl={geloest.length}
        onGewonnen={() => setAbzeichen(true)}
        onZurueck={() => setView("karte")}
      />
    );
  }

  /* ============================ BELOHNUNG ============================ */
  if (view === "belohnung" && runde) {
    const naechsteOffen = AUFGABEN.findIndex((x) => !geloest.includes(x.id));
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-slate-800/70 p-6 text-center">
            <div className="text-5xl">{runde.hatEntwickelt ? "✨" : "🎉"}</div>
            <p className="mt-2 text-xl font-black text-yellow-300">
              {runde.hatEntwickelt ? "Was passiert denn da?" : "Richtig gerechnet!"}
            </p>
            <p className="mt-2 text-slate-200">{a.loesung}</p>

            {runde.hatEntwickelt ? (
              <div className="mt-5 rounded-2xl border-2 border-yellow-400 bg-slate-900/70 p-5">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center opacity-50">
                    <div className="text-4xl">{runde.stufeVorher.emoji}</div>
                    <div className="text-xs text-slate-400">{runde.stufeVorher.name}</div>
                  </div>
                  <div className="text-2xl text-yellow-300">→</div>
                  <div className="text-center">
                    <div className="text-6xl">{runde.stufeNachher.emoji}</div>
                    <div className="font-black text-yellow-300">{runde.stufeNachher.name}</div>
                  </div>
                </div>
                <p className="mt-3 font-bold text-slate-100">
                  {runde.stufeVorher.name} hat sich zu {runde.stufeNachher.name} entwickelt!
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  💥 Stärke {runde.stufeVorher.basis} → {runde.stufeNachher.basis} ·
                  ❤️ {runde.stufeVorher.hp} → {runde.stufeNachher.hp}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-600 bg-slate-900/70 p-4">
                <div className="text-4xl">{stufeVon(runde.pokemon, standVon(a.fuer)).emoji}</div>
                <p className="mt-1 font-bold text-slate-100">
                  {stufeVon(runde.pokemon, standVon(a.fuer)).name} bekommt {runde.ep} EP
                </p>
                {naechsteStufe(runde.pokemon, standVon(a.fuer)) && (
                  <p className="mt-1 text-sm text-slate-400">
                    Es entwickelt sich zu {naechsteStufe(runde.pokemon, standVon(a.fuer)).name},
                    sobald du sein nächstes Rätsel löst.
                  </p>
                )}
              </div>
            )}

            <p className="mt-4 text-lg font-black text-sky-200">
              ⭐ +{runde.ep} Erfahrungspunkte
              {runde.ep === EP_MAX_PRO_RAETSEL && " — Höchstwert, ganz allein gelöst!"}
            </p>
            {runde.ersterVersuch && LOB_FUER_FALLE[runde.falleArt] && (
              <p className="mt-2 rounded-xl border border-orange-400/50 bg-orange-400/10 p-3 text-sm font-bold text-orange-200">
                📖 {LOB_FUER_FALLE[runde.falleArt]}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              {naechsteOffen !== -1 ? (
                <button onClick={() => neueAufgabe(naechsteOffen)} className="w-full rounded-2xl bg-yellow-500 px-6 py-4 text-xl font-black text-slate-900">
                  Nächstes Rätsel ⚡
                </button>
              ) : (
                <button onClick={() => setView("urkunde")} className="w-full rounded-2xl bg-amber-500 px-6 py-4 text-xl font-black text-slate-900">
                  Alle Rätsel gelöst! Urkunde ansehen 📜
                </button>
              )}
              <ArenaKnopf klein />
              <button onClick={() => setView("karte")} className="w-full rounded-xl border border-slate-600 py-2 text-sm text-slate-300">
                Zur Reise-Übersicht
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================ URKUNDE ============================ */
  if (view === "urkunde") {
    return (
      <div className={rahmen}>
        <div className="mx-auto mt-4 max-w-lg rounded-2xl border-8 border-double border-yellow-500 bg-amber-50 p-8 text-center shadow-2xl">
          <div className="text-5xl">🏆</div>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-red-800">Pokémon-Liga</p>
          <h2 className="mt-3 text-3xl font-black text-stone-900">Urkunde</h2>
          <p className="mt-4 text-4xl font-black text-red-800">{name}</p>
          <p className="mt-4 text-lg text-stone-700">
            hat alle {AUFGABEN.length} Rätsel gelöst, dabei {epGesamt} Erfahrungspunkte
            gesammelt und {entwickelt} Pokémon entwickelt.{" "}
            {mut > 0
              ? `Dabei wurde ${mut} Mal eine Hilfe geholt — das war klug. `
              : "Und das ganz ohne eine einzige Hilfe. "}
            Genau gelesen, in Schritten gedacht und nicht aufgegeben.
          </p>
          {abzeichen && (
            <p className="mt-4 text-lg font-bold text-red-800">
              🏅 Und in der Arena wurden alle sechs Gegner besiegt, auch Dragoran.
            </p>
          )}
          <p className="mt-4 text-3xl">⚡ 🏅 🔥</p>
          <p className="mt-2 italic text-stone-600">Professor Eich &nbsp;·&nbsp; Pikachu</p>
          {!abzeichen && (
            <button onClick={() => setView("arena")} className="mt-6 w-full rounded-xl border-2 border-yellow-600 bg-red-600 py-3 text-lg font-black text-white">
              🏟️ Die Arena wartet noch!
            </button>
          )}
          <button onClick={() => setView("team")} className="mt-3 w-full rounded-xl bg-red-700 py-3 font-bold text-yellow-100">
            Mein Team ansehen
          </button>
        </div>
      </div>
    );
  }

  /* ============================ AUFGABE ============================ */
  const kap = KAPITEL.find((k) => k.id === a.kap);
  const pokemonDerAufgabe = TEAM_NACH_ID[a.fuer];
  const standDerAufgabe = standVon(a.fuer);
  const stufeDerAufgabe = stufeVon(pokemonDerAufgabe, standDerAufgabe);

  return (
    <div className={rahmen}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setView("karte")} className="text-sky-300">← Reise</button>
          <span className="flex items-center gap-2 font-bold text-slate-300">
            ✅ {geloest.length}/{AUFGABEN.length} · ⭐ {epGesamt} · 💪 {mut}
            <TonSchalter tonAn={tonAn} setTonAn={setTonAn} />
          </span>
        </div>

        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          {kap.emoji} {kap.titel} · Rätsel {a.id}
        </p>

        <div className="mt-2 rounded-2xl bg-amber-50 p-5 text-stone-800 shadow-xl">
          <StoryText text={a.story} leuchtet={hilfen.blitzlicht} />
          <p className="mt-4 text-xl font-black text-stone-900">{a.frage}</p>
          {hilfen.adlerauge && (
            <p className="mt-3 rounded-xl bg-sky-100 p-3 text-sm font-bold text-sky-900">
              🔍 {a.adlerauge}
            </p>
          )}
          {hilfen.denkhilfe && (
            <p className="mt-2 rounded-xl bg-purple-100 p-3 text-sm font-bold text-purple-900">
              🧩 {a.denkhilfe}
            </p>
          )}
          {hilfen.blitzlicht && (
            <p className="mt-2 rounded-xl bg-yellow-100 p-3 text-sm font-bold text-yellow-900">
              💡 {a.blitzlicht}
            </p>
          )}
          {zeigLoesung && (
            <p className="mt-2 rounded-xl bg-stone-200 p-3 text-sm font-bold text-stone-800">
              📖 {a.loesung}
            </p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") pruefen(); }}
            placeholder={a.einheit}
            className="w-full rounded-xl border-2 border-slate-600 bg-slate-900 px-4 py-4 text-center text-2xl font-black text-yellow-200 outline-none focus:border-yellow-400"
          />
          <button onClick={pruefen} className="rounded-xl bg-yellow-500 px-6 py-4 text-lg font-black text-slate-900 active:translate-y-0.5">
            Prüfen
          </button>
        </div>

        {feedback === "falle" && a.falle && (
          <div className="mt-3 rounded-xl border-2 border-orange-400 bg-orange-400/15 p-4 text-center">
            <p className="text-2xl">📖</p>
            <p className="mt-1 text-sm font-black uppercase tracking-widest text-orange-200">
              Gerechnet hast du richtig!
            </p>
            <p className="mt-2 text-base font-bold text-orange-100">{a.falle.hinweis}</p>
          </div>
        )}
        {feedback === "nochmal" && (
          <p className="mt-3 rounded-xl bg-slate-800 p-3 text-center text-sm font-bold text-amber-200">
            Noch nicht ganz. Lies die Frage nochmal — und hol dir eine Hilfe, das ist erlaubt.
            {versuche >= 2 && " Tipp: die Denkhilfe zerlegt das Rätsel in kleine Schritte."}
          </p>
        )}

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Hilfen · jede gibt +1 Mut-Punkt
        </p>
        <div className="mt-2 flex gap-2">
          {HILFEN.map((h) => (
            <HilfeKnopf key={h.id} hilfe={h} aktiv={hilfen[h.id]} onClick={() => hilfeHolen(h.id)} />
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{stufeDerAufgabe.emoji}</div>
            <div className="flex-1 text-sm">
              <p className="font-bold text-slate-100">
                Dieses Rätsel trainiert {stufeDerAufgabe.name}
              </p>
              <p className="text-xs text-slate-400">
                ⭐ {standDerAufgabe.ep} EP
                {naechsteStufe(pokemonDerAufgabe, standDerAufgabe)
                  ? ` · löse dieses Rätsel, dann wird es ${naechsteStufe(pokemonDerAufgabe, standDerAufgabe).name}`
                  : " · voll entwickelt ✦"}
              </p>
            </div>
            <TypBadge typ={pokemonDerAufgabe.typ} klein />
          </div>
        </div>

        {!zeigLoesung && (
          <button
            onClick={() => setZeigLoesung(true)}
            className="mt-3 w-full rounded-xl border border-slate-600 py-2 text-sm text-slate-400"
          >
            Ich will den ganzen Weg sehen (das ist erlaubt)
          </button>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PokemonSchule />);
