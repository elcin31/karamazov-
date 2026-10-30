/** Offline integrity checks for the actual museum corpus, rather than UI markup snapshots. */
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => readFile(path.join(root, name), "utf8");
const json = async (name) => JSON.parse(await read(name));

const textCheck = spawnSync("python3", ["scripts/verify-text.py"], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(textCheck.status, 0, textCheck.stdout + textCheck.stderr);
process.stdout.write(textCheck.stdout);

// Transpile the content module using the project's TypeScript dependency so the
// checks also work on Node 20/22, without depending on native TS stripping.
const compiled = ts.transpileModule(await read("src/data/museum.ts"), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { characters, themes, events, relationships, history, editorialSources } =
  await import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
  );
const [chapters, quotes, images] = await Promise.all([
  json("src/data/chapters.json"),
  json("src/data/quotes.json"),
  json("src/data/images.json"),
]);
const chapterById = new Map(chapters.map((c) => [c.id, c]));
const characterById = new Map(characters.map((c) => [c.id, c]));
assert.equal(
  characters.length,
  12,
  "All twelve requested characters must have profiles.",
);
assert.equal(
  characterById.size,
  characters.length,
  "Character IDs must be unique.",
);
assert.equal(themes.length, 8, "All eight philosophical themes must exist.");
assert.equal(
  new Set(themes.map((t) => t.id)).size,
  8,
  "Theme IDs must be unique.",
);
assert.equal(
  new Set(quotes.map((q) => q.id)).size,
  quotes.length,
  "Quote IDs must be unique.",
);
assert.equal(
  new Set(events.map((e) => e.id)).size,
  events.length,
  "Event IDs must be unique.",
);
const chapterRef = (id, owner) =>
  assert(chapterById.has(id), `${owner}: unknown chapter ${id}`);
const requiredText = (record, fields) =>
  fields.forEach((field) =>
    assert(
      typeof record[field] === "string" && record[field].trim(),
      `${record.id ?? record.title}: empty ${field}`,
    ),
  );

for (const c of characters) {
  requiredText(c, [
    "name",
    "shortName",
    "intro",
    "biography",
    "psychology",
    "worldview",
    "role",
    "image",
  ]);
  assert(
    c.conflicts.length &&
      c.analysis.length &&
      c.chapters.length &&
      c.connections.length,
    c.id,
  );
  chapterRef(c.revealAt, c.id);
  for (const chapterId of c.chapters) {
    chapterRef(chapterId, c.id);
    assert(
      chapterById.get(c.revealAt).order >= chapterById.get(chapterId).order,
      `${c.id}: spoiler boundary precedes a referenced chapter`,
    );
  }
  for (const relation of c.connections)
    assert(
      characterById.has(relation.id),
      `${c.id}: unknown relation ${relation.id}`,
    );
  assert(
    quotes.some((q) => q.characterId === c.id),
    `${c.id}: no verified character quote`,
  );
  assert(
    (await stat(path.join(root, "public", c.image))).isFile(),
    `${c.id}: missing portrait asset`,
  );
}
for (const t of themes) {
  requiredText(t, ["title", "subtitle", "intro", "context"]);
  assert(
    t.arguments.length >= 2 && t.interpretations.length >= 2,
    `${t.id}: incomplete analysis`,
  );
  chapterRef(t.revealAt, t.id);
  t.chapters.forEach((id) => chapterRef(id, t.id));
  assert(
    t.chapters.every(
      (id) => chapterById.get(id).order <= chapterById.get(t.revealAt).order,
    ),
    `${t.id}: spoiler boundary precedes a referenced chapter`,
  );
}
let previousOrder = -1;
for (const event of events) {
  requiredText(event, ["title", "text", "period"]);
  chapterRef(event.chapterId, event.id);
  const order = chapterById.get(event.chapterId).order;
  assert(
    order >= previousOrder,
    `${event.id}: narrative timeline is out of order`,
  );
  previousOrder = order;
}
for (const relation of relationships) {
  assert(
    characterById.has(relation.source) && characterById.has(relation.target),
    "Unknown map endpoint",
  );
  assert.notEqual(relation.source, relation.target, "Self-relation");
  assert(
    ["family", "conflict", "spiritual"].includes(relation.type),
    "Unknown relationship filter",
  );
  chapterRef(relation.chapterId, relation.label);
}
for (const q of quotes) {
  chapterRef(q.chapterId, q.id);
  assert(
    themes.some(
      (t) =>
        t.title === q.theme ||
        (t.id === "god" && q.theme === "Существование Бога"),
    ),
    `${q.id}: unknown quote theme`,
  );
  assert(q.context && q.speaker, `${q.id}: missing attribution or context`);
  assert(
    q.characterId === null || characterById.has(q.characterId),
    `${q.id}: unknown quote speaker ID`,
  );
}
for (const image of images) {
  requiredText(image, [
    "title",
    "src",
    "author",
    "date",
    "license",
    "licenseUrl",
    "description",
    "section",
  ]);
  assert(
    image.width > 0 && image.height > 0,
    `${image.id}: missing intrinsic dimensions`,
  );
  assert(
    ["archive", "generated"].includes(image.kind),
    `${image.id}: missing image provenance kind`,
  );
  if (image.kind === "archive")
    assert(URL.canParse(image.sourceUrl), `${image.id}: invalid source URL`);
  assert(URL.canParse(image.licenseUrl), `${image.id}: invalid license URL`);
  const file = path.join(root, "public", image.src);
  const bytes = await readFile(file);
  assert(bytes.length > 1000, `${image.id}: empty image`);
  assert.equal(
    bytes.toString("ascii", 0, 4),
    "RIFF",
    `${image.id}: invalid WebP`,
  );
  assert.equal(
    bytes.toString("ascii", 8, 12),
    "WEBP",
    `${image.id}: invalid WebP`,
  );
}
assert(
  history.length >= 6 && editorialSources.length >= 2,
  "Historical/source materials missing",
);
for (const source of editorialSources)
  assert(URL.canParse(source.url), `Invalid editorial source: ${source.title}`);
// Homepage uses the same verified quote record as the atlas.
assert(quotes.some(q => q.id === "battle" && q.chapterId === "3-3"), "Missing homepage quote record");
console.log(
  `PASS: ${characters.length} complete character profiles with verified quotations; ${themes.length} themes; ${events.length} ordered events; ${relationships.length} valid map relations; ${images.length} licensed and present images.`,
);
