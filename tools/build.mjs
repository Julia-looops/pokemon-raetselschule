/* ============================================================
   Baut aus src/game.jsx die fertige, eigenstaendige index.html.

   Aufruf:   npm run build

   Die Vorlage src/vorlage.html enthaelt zwei Markierungen:
     <!--BIBLIOTHEKEN-->   dort kommen React, ReactDOM und Tailwind hinein
     <!--SPIEL-->          dort kommt der kompilierte Spielcode hinein
   Markierungen statt Zeilennummern — damit kann der Bau nicht mehr
   danebengreifen, wenn sich die Vorlage aendert.
   ============================================================ */
import { transformSync } from "@babel/core";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(wurzel, "tools", ".cache");

const LIBS = [
  ["react.js", "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"],
  ["react-dom.js", "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"],
  ["tailwind.js", "https://cdn.tailwindcss.com/3.4.1"],
];

async function holeLibs() {
  mkdirSync(cache, { recursive: true });
  for (const [name, url] of LIBS) {
    const ziel = join(cache, name);
    if (existsSync(ziel)) {
      console.log("  aus Cache:", name);
      continue;
    }
    console.log("  lade:", name);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    writeFileSync(ziel, Buffer.from(await res.arrayBuffer()));
  }
}

function kompiliere() {
  const src = readFileSync(join(wurzel, "src", "game.jsx"), "utf8");
  const out = transformSync(src, {
    presets: [["@babel/preset-react", { runtime: "classic" }]],
    compact: false,
    comments: true,
    configFile: false,
    babelrc: false,
  });
  return out.code;
}

const skript = (code) => "<script>\n" + code.trimEnd() + "\n</script>";

console.log("Bibliotheken:");
await holeLibs();

console.log("Kompiliere src/game.jsx ...");
const spielCode = kompiliere();

console.log("Setze index.html zusammen ...");
let html = readFileSync(join(wurzel, "src", "vorlage.html"), "utf8");

for (const marke of ["<!--BIBLIOTHEKEN-->", "<!--SPIEL-->"]) {
  if (!html.includes(marke)) throw new Error(`Markierung ${marke} fehlt in src/vorlage.html`);
}

const libs = LIBS.map(([n]) => skript(readFileSync(join(cache, n), "utf8"))).join("\n");
/* ACHTUNG: die Ersetzung MUSS als Funktion uebergeben werden.
   Mit einem String wuerden Dollar-Folgen wie $& oder $' im minifizierten
   Bibliotheks-Code als Sonderbefehle gedeutet und der Code beschaedigt. */
html = html.replace("<!--BIBLIOTHEKEN-->", () => libs);
html = html.replace("<!--SPIEL-->", () => skript(spielCode));

/* Kontrolle: jede Bibliothek muss Zeichen fuer Zeichen in der Seite stehen. */
for (const [name] of LIBS) {
  const quelle = readFileSync(join(cache, name), "utf8").trimEnd();
  if (!html.includes(quelle)) {
    throw new Error(`${name} steht nicht unveraendert in der Seite — Abbruch.`);
  }
}

/* Sicherheitsnetz: im eingebetteten Code darf kein echtes </script> stehen,
   sonst bricht das HTML mitten im Skript ab. */
const verdacht = html.split("</script>").length - 1;
const erwartet = LIBS.length + 3; // Bibliotheken + Speicher-Shim + Spiel + Service-Worker
if (verdacht !== erwartet) {
  throw new Error(`Unerwartet viele </script>: ${verdacht} statt ${erwartet} — Abbruch.`);
}

writeFileSync(join(wurzel, "index.html"), html, "utf8");
console.log(`\nFertig: index.html, ${html.length} Bytes`);
