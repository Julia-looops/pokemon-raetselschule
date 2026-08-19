const { useState, useEffect, useRef } = React;

/* ============================================================
   FLORENTINAS POKEMON-SCHULE
   Kopfrechnen bis 100 · 3. Klasse VS
   Raetsel entwickeln das Team, das Team kaempft in der Arena.
   ============================================================ */

const VERSION = "1.1";
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
};

/* Wer ist gegen wen stark. Nur die Paare, die hier auftreten koennen. */
const STARK_GEGEN = {
  wasser: ["feuer", "gestein"],
  feuer: ["pflanze", "kaefer", "eis"],
  pflanze: ["wasser", "gestein"],
  elektro: ["wasser", "flug"],
  kaefer: ["pflanze"],
  flug: ["kaefer", "kampf", "pflanze"],
  kampf: ["normal", "gestein"],
  eis: ["flug", "pflanze", "gestein"],
  gestein: ["feuer", "flug", "kaefer"],
  gift: ["pflanze"],
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
const EP_STUFE_2 = 7;
const EP_STUFE_3 = 15;

const TEAM = [
  {
    id: "pikachu", typ: "elektro", attacke: "Donnerschock",
    stufen: [{ name: "Pikachu", emoji: "⚡", ab: 0, basis: 10, hp: 36 }],
    text: "Dein Partner von der ersten Minute an.",
  },
  {
    id: "bisasam", typ: "pflanze", attacke: "Rankenhieb",
    stufen: [
      { name: "Bisasam", emoji: "🌱", ab: 0, basis: 7, hp: 34 },
      { name: "Bisaknosp", emoji: "🌿", ab: EP_STUFE_2, basis: 11, hp: 42 },
      { name: "Bisaflor", emoji: "🌺", ab: EP_STUFE_3, basis: 15, hp: 52 },
    ],
    text: "Die Knospe auf dem Rücken wächst mit jedem Rätsel.",
  },
  {
    id: "schiggy", typ: "wasser", attacke: "Aquaknarre",
    stufen: [
      { name: "Schiggy", emoji: "💧", ab: 0, basis: 7, hp: 34 },
      { name: "Schillok", emoji: "🌊", ab: EP_STUFE_2, basis: 11, hp: 42 },
      { name: "Turtok", emoji: "🐢", ab: EP_STUFE_3, basis: 15, hp: 54 },
    ],
    text: "Wasser löscht Feuer und zerbricht Gestein.",
  },
  {
    id: "glumanda", typ: "feuer", attacke: "Glut",
    stufen: [
      { name: "Glumanda", emoji: "🔥", ab: 0, basis: 7, hp: 33 },
      { name: "Glutexo", emoji: "🐲", ab: EP_STUFE_2, basis: 11, hp: 41 },
      { name: "Glurak", emoji: "🐉", ab: EP_STUFE_3, basis: 16, hp: 52 },
    ],
    text: "Aus dem kleinen Schwanzflämmchen wird ein Drache.",
  },
  {
    id: "taubsi", typ: "flug", attacke: "Flügelschlag",
    stufen: [
      { name: "Taubsi", emoji: "🐣", ab: 0, basis: 7, hp: 32 },
      { name: "Tauboga", emoji: "🐦", ab: EP_STUFE_2, basis: 11, hp: 40 },
      { name: "Tauboss", emoji: "🦅", ab: EP_STUFE_3, basis: 15, hp: 48 },
    ],
    text: "Sieht von oben, was am Boden verborgen ist.",
  },
  {
    id: "raupy", typ: "kaefer", attacke: "Silberhauch",
    stufen: [
      { name: "Raupy", emoji: "🐛", ab: 0, basis: 6, hp: 30 },
      { name: "Safcon", emoji: "🟩", ab: EP_STUFE_2, basis: 9, hp: 40 },
      { name: "Smettbo", emoji: "🦋", ab: EP_STUFE_3, basis: 15, hp: 46 },
    ],
    text: "Erst Raupe, dann Kokon, dann der schönste Schmetterling.",
  },
  {
    id: "vulpix", typ: "feuer", attacke: "Flammenwurf",
    stufen: [
      { name: "Vulpix", emoji: "🦊", ab: 0, basis: 8, hp: 34 },
      { name: "Vulnona", emoji: "🦊✨", ab: EP_STUFE_2, basis: 13, hp: 46 },
    ],
    text: "Neun Schwänze, und jeder einzelne ist verzaubert.",
  },
  {
    id: "menki", typ: "kampf", attacke: "Karateschlag",
    stufen: [
      { name: "Menki", emoji: "🐒", ab: 0, basis: 8, hp: 34 },
      { name: "Rasaff", emoji: "🦍", ab: EP_STUFE_2, basis: 13, hp: 46 },
    ],
    text: "Wird richtig wütend — und dadurch richtig stark.",
  },
  {
    id: "lapras", typ: "eis", attacke: "Eisstrahl",
    stufen: [{ name: "Lapras", emoji: "🐋", ab: 0, basis: 12, hp: 50 }],
    text: "Selten und sanft. Trägt dich über jedes Meer.",
  },
];

const TEAM_NACH_ID = {};
TEAM.forEach((p) => { TEAM_NACH_ID[p.id] = p; });

/* Welche Stufe ist mit diesen EP erreicht? */
function stufeVon(pokemon, ep) {
  let s = pokemon.stufen[0];
  for (const stufe of pokemon.stufen) if (ep >= stufe.ab) s = stufe;
  return s;
}

/* Die naechste Entwicklung — fuer die Anzeige "noch N EP". */
function naechsteStufe(pokemon, ep) {
  return pokemon.stufen.find((s) => ep < s.ab) || null;
}

/* EP zaehlen immer mit: Basis aus der Stufe plus ein Bonus aus den EP. */
function staerkeVon(pokemon, ep) {
  return stufeVon(pokemon, ep).basis + Math.floor(ep / 6);
}
function maxHpVon(pokemon, ep) {
  return stufeVon(pokemon, ep).hp + Math.floor(ep / 4);
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
];

const AUFGABEN = [
  {
    id: 1, kap: 1, fuer: "pikachu",
    story: "Professor Eich zeigt dir sein Regal mit 26 Pokébällen. Am Nachmittag bringt sein Assistent noch 17 Bälle dazu.",
    frage: "Wie viele Pokébälle stehen jetzt im Regal?",
    antwort: 43, einheit: "Pokébälle",
    blitzlicht: "Im Text stecken zwei Zahlen: 26 und 17.",
    adlerauge: "Gesucht ist, wie viele es ZUSAMMEN sind, nachdem welche dazugekommen sind.",
    denkhilfe: "Es kommen Bälle dazu — also plus: 26 + 17 = ?",
    loesung: "26 + 17 = 43. Im Regal stehen 43 Pokébälle.",
  },
  {
    id: 2, kap: 1, fuer: "glumanda",
    story: "Glumanda hat 52 Beeren gesammelt. Weil es so hungrig ist, frisst es 19 davon gleich auf.",
    frage: "Wie viele Beeren hat Glumanda noch?",
    antwort: 33, einheit: "Beeren",
    blitzlicht: "Im Text stecken zwei Zahlen: 52 und 19.",
    adlerauge: "Gesucht ist, was NOCH DA ist, nachdem etwas weggefressen wurde.",
    denkhilfe: "Aufgefressen heißt weniger — also minus: 52 − 19 = ?",
    loesung: "52 − 19 = 33. Glumanda hat noch 33 Beeren.",
  },
  {
    id: 3, kap: 1, fuer: "taubsi",
    story: "Auf Route 1 sitzen 35 Taubsi im Gras. 12 fliegen erschrocken weg, dann landen 9 neue dazu.",
    frage: "Wie viele Taubsi sitzen jetzt im Gras?",
    antwort: 32, einheit: "Taubsi",
    blitzlicht: "Drei Zahlen sind wichtig: 35, 12 und 9.",
    adlerauge: "Gesucht ist die Zahl AM ENDE. Achtung: zuerst fliegen welche weg, dann kommen welche dazu.",
    denkhilfe: "Zwei Schritte: erst 35 − 12 = ?, dann das Ergebnis + 9 = ?",
    loesung: "35 − 12 = 23, und 23 + 9 = 32. Es sitzen 32 Taubsi im Gras.",
  },
  {
    id: 4, kap: 2, fuer: "raupy",
    story: "Im Wald von Vertania zählst du 28 Raupy auf den Blättern. Hinter dem nächsten Baum entdeckst du 16 weitere.",
    frage: "Wie viele Raupy hast du insgesamt gezählt?",
    antwort: 44, einheit: "Raupy",
    blitzlicht: "Im Text stecken zwei Zahlen: 28 und 16.",
    adlerauge: "Gesucht ist die Anzahl INSGESAMT, also alles zusammen.",
    denkhilfe: "Insgesamt heißt zusammenzählen: 28 + 16 = ?",
    loesung: "28 + 16 = 44. Du hast 44 Raupy gezählt.",
  },
  {
    id: 5, kap: 2, fuer: "bisasam",
    story: "Bisasam trägt 61 Samen in seiner Knospe. Auf der Lichtung pflanzt es 24 davon ein.",
    frage: "Wie viele Samen sind noch in der Knospe?",
    antwort: 37, einheit: "Samen",
    blitzlicht: "Im Text stecken zwei Zahlen: 61 und 24.",
    adlerauge: "Gesucht ist, wie viele ÜBRIG sind, nachdem etwas eingepflanzt wurde.",
    denkhilfe: "Eingepflanzt heißt weg aus der Knospe — also minus: 61 − 24 = ?",
    loesung: "61 − 24 = 37. In der Knospe sind noch 37 Samen.",
  },
  {
    id: 6, kap: 2, fuer: "taubsi",
    story: "Taubsi fliegt über den Wald und sieht 47 Bäume. 15 davon hat der Sturm umgeworfen, 8 stehen noch ganz frisch gepflanzt daneben.",
    frage: "Wie viele Bäume stehen aufrecht?",
    antwort: 40, einheit: "Bäume",
    blitzlicht: "Wichtig sind 47, 15 und 8.",
    adlerauge: "Gesucht sind die AUFRECHTEN Bäume. Die umgeworfenen zählen nicht mit, die frischen schon.",
    denkhilfe: "Zwei Schritte: 47 − 15 = ?, dann das Ergebnis + 8 = ?",
    loesung: "47 − 15 = 32, und 32 + 8 = 40. Es stehen 40 Bäume aufrecht.",
  },
  {
    id: 7, kap: 3, fuer: "menki",
    story: "Menki hat 74 Nüsse auf einen Haufen gelegt. Beim Wütendwerden tritt es 28 davon in den Fluss.",
    frage: "Wie viele Nüsse liegen noch auf dem Haufen?",
    antwort: 46, einheit: "Nüsse",
    blitzlicht: "Im Text stecken zwei Zahlen: 74 und 28.",
    adlerauge: "Gesucht ist, was noch auf dem Haufen LIEGT.",
    denkhilfe: "In den Fluss getreten heißt weg — also minus: 74 − 28 = ?",
    loesung: "74 − 28 = 46. Auf dem Haufen liegen noch 46 Nüsse.",
  },
  {
    id: 8, kap: 3, fuer: "schiggy",
    story: "Schiggy füllt seinen Panzer mit 38 Litern Wasser. An der Quelle nimmt es noch 27 Liter dazu.",
    frage: "Wie viele Liter hat Schiggy jetzt im Panzer?",
    antwort: 65, einheit: "Liter",
    blitzlicht: "Im Text stecken zwei Zahlen: 38 und 27.",
    adlerauge: "Gesucht ist die Menge, die es JETZT hat, nachdem es mehr dazugenommen hat.",
    denkhilfe: "Dazugenommen heißt plus: 38 + 27 = ?",
    loesung: "38 + 27 = 65. Schiggy hat 65 Liter im Panzer.",
  },
  {
    id: 9, kap: 3, fuer: "raupy",
    story: "In Marmoria liegen 90 Steine am Weg. Rocko räumt 35 weg, danach rollen 11 vom Berg herunter.",
    frage: "Wie viele Steine liegen am Ende am Weg?",
    antwort: 66, einheit: "Steine",
    blitzlicht: "Wichtig sind 90, 35 und 11.",
    adlerauge: "Gesucht ist die Anzahl AM ENDE. Erst werden welche weggeräumt, dann kommen welche dazu.",
    denkhilfe: "Zwei Schritte: 90 − 35 = ?, dann das Ergebnis + 11 = ?",
    loesung: "90 − 35 = 55, und 55 + 11 = 66. Am Weg liegen 66 Steine.",
  },
  {
    id: 10, kap: 4, fuer: "lapras",
    story: "Lapras trägt dich über das Meer. Ihr zählt 43 Muscheln am Strand, findet 29 weitere im Sand und legt 16 zurück ins Wasser.",
    frage: "Wie viele Muscheln habt ihr am Ende behalten?",
    antwort: 56, einheit: "Muscheln",
    blitzlicht: "Wichtig sind 43, 29 und 16.",
    adlerauge: "Gesucht ist, wie viele ihr BEHALTEN habt. Zurückgelegte zählen nicht mehr mit.",
    denkhilfe: "Drei Schritte: 43 + 29 = ?, dann davon 16 weg.",
    loesung: "43 + 29 = 72, und 72 − 16 = 56. Ihr habt 56 Muscheln behalten.",
  },
  {
    id: 11, kap: 4, fuer: "schiggy",
    story: "Am Hafen von Azuria liegen 55 Boote. Am Morgen fahren 23 hinaus, am Abend kommen 19 zurück.",
    frage: "Wie viele Boote liegen abends im Hafen?",
    antwort: 51, einheit: "Boote",
    blitzlicht: "Wichtig sind 55, 23 und 19.",
    adlerauge: "Gesucht ist die Anzahl ABENDS im Hafen. Ausgefahrene sind weg, zurückgekehrte wieder da.",
    denkhilfe: "Zwei Schritte: 55 − 23 = ?, dann das Ergebnis + 19 = ?",
    loesung: "55 − 23 = 32, und 32 + 19 = 51. Abends liegen 51 Boote im Hafen.",
  },
  {
    id: 12, kap: 4, fuer: "vulpix",
    story: "Vulpix wärmt 63 Steine für die Nacht auf. Bis zum Morgen sind 27 davon wieder kalt geworden.",
    frage: "Wie viele Steine sind morgens noch warm?",
    antwort: 36, einheit: "Steine",
    blitzlicht: "Im Text stecken zwei Zahlen: 63 und 27.",
    adlerauge: "Gesucht sind die Steine, die noch WARM sind.",
    denkhilfe: "Kalt geworden heißt nicht mehr warm — also minus: 63 − 27 = ?",
    loesung: "63 − 27 = 36. Morgens sind noch 36 Steine warm.",
  },
  {
    id: 13, kap: 5, fuer: "bisasam",
    story: "Vor der Arena stehen 84 Trainerinnen und Trainer in der Schlange. 39 geben auf und gehen heim, dann stellen sich 15 neue an.",
    frage: "Wie viele stehen jetzt in der Schlange?",
    antwort: 60, einheit: "Personen",
    blitzlicht: "Wichtig sind 84, 39 und 15.",
    adlerauge: "Gesucht ist die Anzahl JETZT. Erst gehen welche, dann kommen welche.",
    denkhilfe: "Zwei Schritte: 84 − 39 = ?, dann das Ergebnis + 15 = ?",
    loesung: "84 − 39 = 45, und 45 + 15 = 60. In der Schlange stehen 60 Personen.",
  },
  {
    id: 14, kap: 5, fuer: "glumanda",
    story: "Glumandas Flamme ist 48 Grad heiß. Beim Training werden es 26 Grad mehr, danach kühlt sie um 17 Grad ab.",
    frage: "Wie heiß ist die Flamme am Ende?",
    antwort: 57, einheit: "Grad",
    blitzlicht: "Wichtig sind 48, 26 und 17.",
    adlerauge: "Gesucht ist die Temperatur AM ENDE. Erst wird es heißer, dann kühler.",
    denkhilfe: "Drei Schritte: 48 + 26 = ?, dann davon 17 weg.",
    loesung: "48 + 26 = 74, und 74 − 17 = 57. Die Flamme ist 57 Grad heiß.",
  },
  {
    id: 15, kap: 5, fuer: "pikachu",
    story: "Pikachu sammelt Blitze für die Arena. Es hat 29 Volt, lädt 34 dazu und verliert bei einem Sprung 12.",
    frage: "Mit wie viel Volt geht Pikachu in die Arena?",
    antwort: 51, einheit: "Volt",
    blitzlicht: "Wichtig sind 29, 34 und 12.",
    adlerauge: "Gesucht ist die Ladung AM ENDE. Erst kommt dazu, dann geht etwas verloren.",
    denkhilfe: "Drei Schritte: 29 + 34 = ?, dann davon 12 weg.",
    loesung: "29 + 34 = 63, und 63 − 12 = 51. Pikachu geht mit 51 Volt in die Arena.",
  },
];

/* ------------------------------------------------------------
   DIE ARENA
   Fuenf Gegner, der letzte ist der Boss. `schaden` ist der
   Grundschaden pro Zug, `hp` die Lebenspunkte.
   ------------------------------------------------------------ */
const GEGNER = [
  { name: "Rattfratz", emoji: "🐭", typ: "normal", hp: 80, schaden: 5,
    spruch: "Ein frecher Anfang. Rattfratz beißt nach deinen Schnürsenkeln." },
  { name: "Zubat", emoji: "🦇", typ: "flug", hp: 115, schaden: 7,
    spruch: "Aus dem Dunkeln flattert Zubat heran. Es ist schnell." },
  { name: "Machollo", emoji: "💪", typ: "kampf", hp: 155, schaden: 9,
    spruch: "Machollo spannt alle Muskeln. Das wird ruppig." },
  { name: "Arbok", emoji: "🐍", typ: "gift", hp: 205, schaden: 11,
    spruch: "Arbok richtet sich auf und zischt. Team Rocket lässt grüßen." },
  { name: "Onix", emoji: "🪨", typ: "gestein", hp: 280, schaden: 14, boss: true,
    spruch: "Der Boden bebt. ONIX türmt sich vor dir auf — der letzte Gegner." },
];

/* Rechenaufgabe fuer einen Kampfzug: Zahlenraum bis 100, plus und minus. */
function kampfRechnung() {
  if (Math.random() < 0.5) {
    const a = 12 + Math.floor(Math.random() * 59);
    const b = 8 + Math.floor(Math.random() * (100 - a - 7));
    return { text: a + " + " + b, loesung: a + b };
  }
  const gross = 45 + Math.floor(Math.random() * 51);
  /* Der kleinere Wert wird so begrenzt, dass das Ergebnis nie unter 10 faellt —
     ohne diese Grenze konnte 45 − 47 herauskommen. */
  const maxKlein = Math.min(47, gross - 10);
  const klein = 8 + Math.floor(Math.random() * (maxKlein - 7));
  return { text: gross + " − " + klein, loesung: gross - klein };
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
function StoryText({ text, leuchtet }) {
  if (!leuchtet) return <p className="text-lg leading-relaxed text-slate-100">{text}</p>;
  const teile = text.split(/(\d+)/);
  return (
    <p className="text-lg leading-relaxed text-slate-100">
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
function PokemonKarte({ pokemon, ep, klein }) {
  const stufe = stufeVon(pokemon, ep);
  const naechste = naechsteStufe(pokemon, ep);
  const entwickelt = pokemon.stufen.indexOf(stufe) > 0;
  return (
    <div className={`rounded-2xl border-2 p-3 text-center ${
      entwickelt ? "border-yellow-400 bg-slate-800" : "border-slate-600 bg-slate-800/60"
    }`}>
      <div className={klein ? "text-3xl" : "text-5xl"}>{stufe.emoji}</div>
      <p className="mt-1 font-black text-slate-100">{stufe.name}</p>
      <div className="mt-1"><TypBadge typ={pokemon.typ} klein /></div>
      <p className="mt-2 text-xs font-bold text-sky-200">
        ⭐ {ep} EP · 💥 {staerkeVon(pokemon, ep)} · ❤️ {maxHpVon(pokemon, ep)}
      </p>
      {naechste ? (
        <p className="mt-1 text-[11px] text-slate-400">
          entwickelt sich bei {naechste.ab} EP zu {naechste.name}
        </p>
      ) : pokemon.stufen.length > 1 ? (
        <p className="mt-1 text-[11px] font-bold text-yellow-300">voll entwickelt ✦</p>
      ) : (
        <p className="mt-1 text-[11px] text-slate-400">entwickelt sich nicht</p>
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
const HEILUNG_NACH_SIEG = 25;

function Arena({ epVon, tonAn, setTonAn, onGewonnen, onZurueck, abzeichen }) {
  const startHp = () => {
    const h = {};
    TEAM.forEach((p) => { h[p.id] = maxHpVon(p, epVon(p.id)); });
    return h;
  };

  const [phase, setPhase] = useState("intro");
  const [gegnerIdx, setGegnerIdx] = useState(0);
  const [gegnerHp, setGegnerHp] = useState(GEGNER[0].hp);
  const [teamHp, setTeamHp] = useState(startHp);
  const [aktivId, setAktivId] = useState("pikachu");
  const [rechnung, setRechnung] = useState(kampfRechnung);
  const [eingabe, setEingabe] = useState("");
  const [versuche, setVersuche] = useState(0);
  const [meldung, setMeldung] = useState(null);
  const [letzterZug, setLetzterZug] = useState(null);
  const [ohnmaechtig, setOhnmaechtig] = useState(null);   // Name des ohnmaechtigen Pokemon

  const gegner = GEGNER[gegnerIdx];
  const aktiv = TEAM_NACH_ID[aktivId];
  const aktivEp = epVon(aktivId);
  const aktivStufe = stufeVon(aktiv, aktivEp);
  const aktivMax = maxHpVon(aktiv, aktivEp);
  const lebende = TEAM.filter((p) => teamHp[p.id] > 0);

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
    setAktivId("pikachu");
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
    const schaden = Math.max(1, Math.round(staerkeVon(aktiv, aktivEp) * faktor * ladung));
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
      setPhase(gegnerIdx + 1 >= GEGNER.length ? "gewonnen" : "gegnerBesiegt");
      if (gegnerIdx + 1 >= GEGNER.length) {
        if (tonAn) Ton.sieg();
        onGewonnen();
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
      const uebrig = TEAM.filter((p) => p.id !== aktivId && teamHp[p.id] > 0);
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
    TEAM.forEach((p) => {
      const max = maxHpVon(p, epVon(p.id));
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
        {TEAM.map((p) => {
          const hp = teamHp[p.id];
          const max = maxHpVon(p, epVon(p.id));
          const stufe = stufeVon(p, epVon(p.id));
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
              Fünf Gegner warten. Der letzte ist <b className="text-yellow-300">Onix</b> — und
              der ist groß.
            </p>
            <div className="mt-4 space-y-2 rounded-2xl border border-slate-600 bg-slate-900/70 p-4 text-left text-sm text-slate-200">
              <p><b className="text-yellow-300">Rechnen greift an:</b> Löse die Aufgabe, dein Pokémon schlägt zu. Beim ersten Versuch wird der Angriff am stärksten.</p>
              <p><b className="text-yellow-300">Typ-Vorteil zählt doppelt:</b> Wasser gegen Feuer, Pflanze gegen Gestein, Elektro gegen Flug. Ein <span className="rounded-full bg-green-500 px-1 text-[10px] font-black text-white">×2</span> am Pokémon heißt: das ist jetzt die richtige Wahl.</p>
              <p><b className="text-yellow-300">Wechseln kostet nichts:</b> Du darfst jederzeit ein anderes Pokémon nach vorne schicken.</p>
              <p><b className="text-yellow-300">Dein Team wird durch Rätsel stärker.</b> Entwickelte Pokémon schlagen härter und halten mehr aus.</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {GEGNER.map((g, i) => (
                <div key={g.name} className="rounded-xl border border-slate-600 bg-slate-900/60 p-2 text-center">
                  <div className="text-2xl">{g.emoji}</div>
                  <p className="text-[11px] font-bold text-slate-200">{i + 1}. {g.name}</p>
                  <TypBadge typ={g.typ} klein />
                </div>
              ))}
            </div>
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
            Alle fünf Gegner besiegt — auch Onix. Du hast dir das
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
              💥 {staerkeVon(aktiv, aktivEp)}
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

  const a = AUFGABEN[idx];
  const fertig = geloest.length === AUFGABEN.length;

  /* EP eines Pokemon: Summe aus allen geloesten Raetseln, die ihm gehoeren */
  function epVon(pokemonId) {
    return AUFGABEN.filter((x) => x.fuer === pokemonId).reduce(
      (s, x) => s + (ergebnisse[x.id] ? ergebnisse[x.id].ep : 0),
      0
    );
  }
  const epGesamt = Object.values(ergebnisse).reduce((s, e) => s + e.ep, 0);
  const entwickelt = TEAM.filter((p) => p.stufen.indexOf(stufeVon(p, epVon(p.id))) > 0).length;

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
          JSON.stringify({ geloest, ergebnisse, mut, abzeichen })
        );
      } catch (e) {
        /* kein Speicher — Spiel laeuft trotzdem */
      }
    })();
  }, [geloest, ergebnisse, mut, abzeichen, geladen]);

  async function allesZuruecksetzen() {
    setGeloest([]); setErgebnisse({}); setMut(0); setAbzeichen(false);
    setRunde(null); setIdx(0); setEingabe("");
    setHilfen({ blitzlicht: false, adlerauge: false, denkhilfe: false });
    setVersuche(0); setFeedback(null); setZeigLoesung(false);
    setView("start");
    try {
      await window.speicher.set(SPEICHER_KEY, JSON.stringify({ geloest: [], ergebnisse: {}, mut: 0, abzeichen: false }));
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
      setFeedback("nochmal");
      if (tonAn) Ton.nochmal();
      return;
    }
    const ep = epFuer(hilfen, zeigLoesung);
    const pokemon = TEAM_NACH_ID[a.fuer];
    const epVorher = epVon(a.fuer);
    const stufeVorher = stufeVon(pokemon, epVorher);
    const stufeNachher = stufeVon(pokemon, epVorher + ep);
    const hatEntwickelt = stufeVorher.name !== stufeNachher.name;

    setErgebnisse({
      ...ergebnisse,
      [a.id]: { ep, ...hilfen, loesung: zeigLoesung },
    });
    if (!geloest.includes(a.id)) setGeloest([...geloest, a.id]);

    setRunde({ ep, pokemon, stufeVorher, stufeNachher, hatEntwickelt });
    setFeedback(null);
    if (tonAn) { Ton.richtig(); if (hatEntwickelt) setTimeout(() => Ton.entwicklung(), 450); }
    setView("belohnung");
  }

  const rahmen = "min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4";

  /* Knopf, der immer in die Arena fuehrt — nie versteckt, nie gesperrt */
  function ArenaKnopf({ klein }) {
    return (
      <button
        onClick={() => setView("arena")}
        className={`w-full rounded-2xl border-2 border-yellow-400 bg-red-600 font-black text-white shadow-xl active:translate-y-0.5 ${
          klein ? "py-3 text-base" : "px-6 py-4 text-xl"
        }`}
      >
        🏟️ {abzeichen ? "Nochmal in die Arena" : "In die Arena!"}
      </button>
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
              Florentinas<br />Pokémon-Schule
            </h1>
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 p-6 text-stone-800 shadow-xl">
            <p className="text-lg">Liebe Florentina,</p>
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
                    const stufe = stufeVon(p, epVon(x.fuer));
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
            {entwickelt === 0
              ? "Noch kein Pokémon entwickelt — in der Arena wird es dadurch schwer, aber du darfst jederzeit hinein."
              : `${entwickelt} von ${TEAM.length} Pokémon entwickelt.`}
          </p>

          <div className="mt-4 flex gap-2">
            <button onClick={() => setView("team")} className="flex-1 rounded-xl bg-sky-600 py-3 font-bold text-white">
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
            {entwickelt} von {TEAM.length} entwickelt · ⭐ {epGesamt} EP gesammelt
          </p>

          {abzeichen && (
            <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-amber-50 p-4 text-center">
              <div className="text-4xl">🏅</div>
              <p className="mt-1 font-black text-stone-900">Arena-Abzeichen</p>
              <p className="text-xs text-stone-600">Alle fünf Gegner besiegt, auch Onix</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEAM.map((p) => <PokemonKarte key={p.id} pokemon={p} ep={epVon(p.id)} />)}
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
          <button onClick={allesZuruecksetzen} className="mt-2 w-full rounded-xl border border-red-500/40 py-2 text-xs text-red-300">
            Alles von vorne beginnen (für Erwachsene) — löscht Team und Fortschritt
          </button>
        </div>
      </div>
    );
  }

  /* ============================ ARENA ============================ */
  if (view === "arena") {
    return (
      <Arena
        epVon={epVon}
        tonAn={tonAn}
        setTonAn={setTonAn}
        abzeichen={abzeichen}
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
                <div className="text-4xl">{stufeVon(runde.pokemon, epVon(a.fuer)).emoji}</div>
                <p className="mt-1 font-bold text-slate-100">
                  {stufeVon(runde.pokemon, epVon(a.fuer)).name} bekommt {runde.ep} EP
                </p>
                {naechsteStufe(runde.pokemon, epVon(a.fuer)) && (
                  <p className="mt-1 text-sm text-slate-400">
                    Noch {naechsteStufe(runde.pokemon, epVon(a.fuer)).ab - epVon(a.fuer)} EP bis{" "}
                    {naechsteStufe(runde.pokemon, epVon(a.fuer)).name}
                  </p>
                )}
              </div>
            )}

            <p className="mt-4 text-lg font-black text-sky-200">
              ⭐ +{runde.ep} Erfahrungspunkte
              {runde.ep === EP_MAX_PRO_RAETSEL && " — Höchstwert, ganz allein gelöst!"}
            </p>

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
          <h2 className="mt-3 text-3xl font-black text-stone-900">Pokémon-Trainerin</h2>
          <p className="mt-4 text-4xl font-black text-red-800">Florentina</p>
          <p className="mt-4 text-lg text-stone-700">
            hat alle {AUFGABEN.length} Rätsel gelöst, dabei {epGesamt} Erfahrungspunkte
            gesammelt und {entwickelt} Pokémon entwickelt.{" "}
            {mut > 0
              ? `${mut} Mal hat sie sich getraut, eine Hilfe zu holen. `
              : "Und das ganz ohne eine einzige Hilfe. "}
            Sie hat genau gelesen, in Schritten gedacht und nicht aufgegeben.
          </p>
          {abzeichen && (
            <p className="mt-4 text-lg font-bold text-red-800">
              🏅 Und in der Arena hat sie alle fünf Gegner besiegt, auch Onix.
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
  const stufeDerAufgabe = stufeVon(pokemonDerAufgabe, epVon(a.fuer));

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

        <div className="mt-2 rounded-2xl bg-amber-50 p-5 shadow-xl">
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
                ⭐ {epVon(a.fuer)} EP
                {naechsteStufe(pokemonDerAufgabe, epVon(a.fuer))
                  ? ` · noch ${naechsteStufe(pokemonDerAufgabe, epVon(a.fuer)).ab - epVon(a.fuer)} EP bis ${naechsteStufe(pokemonDerAufgabe, epVon(a.fuer)).name}`
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
