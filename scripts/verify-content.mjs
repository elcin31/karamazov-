/** Offline integrity and editorial coverage checks for Karamazov 2.0. */
import assert from "node:assert/strict";
import {
  readFileSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const counts = {};
const wordCount = (value) =>
  String(value).trim().split(/\s+/u).filter(Boolean).length;
const textCheck = spawnSync("python3", ["scripts/verify-text.py"], {
  cwd: root,
  encoding: "utf8",
});
check(
  textCheck.status === 0,
  `Primary text/quote check failed: ${textCheck.stdout}${textCheck.stderr}`,
);
process.stdout.write(textCheck.stdout);

// CommonJS evaluation handles local JSON imports and works on Node 20/22/24.
// Only the repository's own content modules are evaluated; no framework code.
const moduleCache = new Map();
function loadContent(name) {
  let filename = path.isAbsolute(name) ? name : path.join(root, name);
  if (!path.extname(filename)) filename += ".ts";
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  if (filename.endsWith(".json"))
    return JSON.parse(readFileSync(filename, "utf8"));
  const module = { exports: {} };
  moduleCache.set(filename, module);
  const result = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const syntaxErrors =
    result.diagnostics?.filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    ) || [];
  assert.equal(
    syntaxErrors.length,
    0,
    `${path.relative(root, filename)}: invalid TypeScript content`,
  );
  const localRequire = (id) => {
    assert(id.startsWith("."), `Unexpected external content dependency: ${id}`);
    return loadContent(path.resolve(path.dirname(filename), id));
  };
  new Function("module", "exports", "require", result.outputText)(
    module,
    module.exports,
    localRequire,
  );
  return module.exports;
}
const { characters, themes, events, relationships, history, editorialSources } =
  loadContent("src/data/museum.ts");
const { characterEssays } = loadContent("src/data/character-essays.ts");
const { studies } = loadContent("src/data/studies.ts");
const { bookGuides, chapterGuides } = loadContent("src/data/book-guides.ts");
const { literaryRoutes } = loadContent("src/data/routes.ts");
const { authorSections, authorChronology, authorSources, authorQuotes } =
  loadContent("src/data/author.ts");
const { courtEvidence, courtContradictions, courtWitnesses } =
  loadContent("src/data/court.ts");
const { eventDetails } = loadContent("src/data/event-atlas.ts");
const chapters = json("src/data/chapters.json");
const quotes = json("src/data/quotes.json");
const images = json("src/data/images.json");
const chapterById = new Map(chapters.map((c) => [c.id, c]));
const characterById = new Map(characters.map((c) => [c.id, c]));
const studyById = new Map(studies.map((s) => [s.id, s]));
const eventById = new Map(events.map((e) => [e.id, e]));
const imageById = new Map(images.map((a) => [a.id, a]));
const quoteById = new Map(quotes.map((q) => [q.id, q]));
const requiredText = (record, fields, owner = record.id ?? record.title) =>
  fields.forEach((field) =>
    check(
      typeof record[field] === "string" && record[field].trim(),
      `${owner}: empty ${field}`,
    ),
  );
const unique = (items, label, key = "id") =>
  check(
    new Set(items.map((x) => x[key])).size === items.length,
    `${label}: duplicate ${key}`,
  );
const chapterRef = (id, owner) =>
  check(chapterById.has(id), `${owner}: unknown chapter ${id}`);
const characterRef = (id, owner) =>
  check(characterById.has(id), `${owner}: unknown character ${id}`);
const studyRef = (id, owner) =>
  check(studyById.has(id), `${owner}: unknown study ${id}`);
const eventRef = (id, owner) =>
  check(eventById.has(id), `${owner}: unknown event ${id}`);
const imageRef = (id, owner) =>
  check(imageById.has(id), `${owner}: unknown image ${id}`);
const refs = (record, key, fn, owner = record.id ?? record.title) => {
  check(Array.isArray(record[key]), `${owner}: missing ${key} array`);
  for (const id of record[key] || []) fn(id, owner);
};
const url = (value, owner) =>
  check(
    typeof value === "string" && URL.canParse(value) && /^https?:/.test(value),
    `${owner}: invalid source URL ${value}`,
  );
const sources = (items, owner) => {
  check(Array.isArray(items) && items.length > 0, `${owner}: missing sources`);
  for (const s of items || []) {
    requiredText(s, ["title"], owner);
    url(s.url, owner);
  }
};
const boundary = (chapterIds, revealAt, owner) => {
  chapterRef(revealAt, owner);
  if (!chapterById.has(revealAt)) return;
  for (const id of chapterIds)
    if (chapterById.has(id))
      check(
        chapterById.get(id).order <= chapterById.get(revealAt).order,
        `${owner}: spoiler boundary ${revealAt} precedes ${id}`,
      );
};
const repeated = [];
const paragraphOwners = new Map();
function paragraphs(items, owner) {
  for (const p of items || []) {
    check(typeof p === "string" && p.trim(), `${owner}: empty paragraph`);
    const norm = String(p).replace(/\s+/gu, " ").trim();
    if (wordCount(norm) >= 25) {
      if (paragraphOwners.has(norm))
        repeated.push({
          owner,
          previous: paragraphOwners.get(norm),
          text: norm.slice(0, 140),
        });
      else paragraphOwners.set(norm, owner);
    }
  }
}

check(characters.length === 30, "Encyclopedia must contain 30 characters.");
unique(characters, "characters");
const profileWords = {};
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
  check(
    c.conflicts?.length &&
      c.analysis?.length &&
      c.chapters?.length &&
      c.connections?.length,
    `${c.id}: incomplete profile`,
  );
  refs(c, "chapters", chapterRef);
  boundary(c.chapters, c.revealAt, c.id);
  for (const r of c.connections || []) characterRef(r.id, c.id);
  const matches = quotes.filter(
    (q) =>
      q.characterId === c.id ||
      (c.quoteMode === "narrated" &&
        q.characterId === null &&
        q.subjectIds?.includes(c.id)),
  );
  check(
    matches.length > 0,
    `${c.id}: no checked direct or explicitly narrated quotation`,
  );
  if (c.quoteMode === "narrated")
    check(
      matches.every((q) => q.characterId === null),
      `${c.id}: narrated quotation assigned as direct speech`,
    );
  const filename = path.join(root, "public", c.image);
  check(
    existsSync(filename) && statSync(filename).isFile(),
    `${c.id}: missing profile image`,
  );
  for (const s of c.sections || []) {
    requiredText(s, ["title"], c.id);
    paragraphs(s.paragraphs, `${c.id}/${s.title}`);
    refs(s, "chapterIds", chapterRef, c.id);
    check(
      ["text-fact", "interpretation"].includes(s.kind),
      `${c.id}: unlabelled editorial section`,
    );
  }
  profileWords[c.id] = wordCount(
    [
      c.intro,
      c.biography,
      c.psychology,
      c.worldview,
      c.role,
      ...c.conflicts,
      ...c.analysis,
      ...(c.sections || []).flatMap((s) => s.paragraphs),
    ].join(" "),
  );
}
for (const id of [
  "grushenka",
  "katerina",
  "ilyusha",
  "snegiryov",
  "rakitin",
  "liza",
])
  check(
    profileWords[id] >= 500,
    `${id}: secondary dossier shorter than 500 words (${profileWords[id]})`,
  );

unique(themes, "legacy themes");
for (const t of themes) {
  refs(t, "chapters", chapterRef);
  boundary(t.chapters, t.revealAt, `legacy theme ${t.id}`);
}
check(studies.length >= 15, "At least 15 philosophical studies are required.");
unique(studies, "studies");
const studyWords = {};
for (const s of studies) {
  requiredText(s, ["title", "subtitle", "dek", "revealAt"]);
  refs(s, "chapterIds", chapterRef);
  refs(s, "characterIds", characterRef);
  sources(s.sources, s.id);
  check(s.sections?.length >= 4, `${s.id}: insufficient analytical sections`);
  const allRefs = [...s.chapterIds];
  for (const section of s.sections || []) {
    requiredText(section, ["id", "title"], s.id);
    check(
      ["analysis", "text-fact", "research"].includes(section.kind),
      `${s.id}: unlabelled section kind`,
    );
    refs(section, "chapterIds", chapterRef, s.id);
    allRefs.push(...section.chapterIds);
    paragraphs(section.paragraphs, `${s.id}/${section.id}`);
  }
  unique(s.sections, `study ${s.id} sections`);
  boundary(allRefs, s.revealAt, s.id);
  studyWords[s.id] = wordCount(
    s.sections.flatMap((x) => x.paragraphs).join(" "),
  );
  check(
    studyWords[s.id] >= 500,
    `${s.id}: study shorter than 500 words (${studyWords[s.id]})`,
  );
}
const essayWords = {};
const essayBoundaries = {};
check(
  Object.keys(characterEssays).length === 6,
  "All six central dossiers must exist.",
);
for (const [id, e] of Object.entries(characterEssays)) {
  characterRef(id, "central essay");
  requiredText(e, ["dek"], id);
  sources(e.sources, id);
  const sourceIds = new Set(e.sources.map((s) => s.id));
  check(sourceIds.size === e.sources.length, `${id}: duplicate source IDs`);
  check(e.sections?.length >= 6, `${id}: too few close-reading sections`);
  unique(e.sections, `essay ${id} sections`);
  const allRefs = [];
  for (const section of e.sections || []) {
    requiredText(section, ["id", "title"], id);
    check(
      ["text-fact", "interpretation", "research"].includes(section.kind),
      `${id}: unlabelled essay section`,
    );
    refs(section, "chapterIds", chapterRef, id);
    allRefs.push(...section.chapterIds);
    for (const sid of section.sourceIds)
      check(sourceIds.has(sid), `${id}: undefined source ${sid}`);
    paragraphs(section.paragraphs, `essay ${id}/${section.id}`);
  }
  essayWords[id] = wordCount(e.sections.flatMap((x) => x.paragraphs).join(" "));
  check(
    essayWords[id] >= 1200,
    `${id}: central dossier shorter than 1200 words (${essayWords[id]})`,
  );
  essayBoundaries[id] = allRefs
    .filter((x) => chapterById.has(x))
    .sort((a, b) => chapterById.get(b).order - chapterById.get(a).order)[0];
}
check(
  bookGuides.length === 13,
  "All twelve books and the epilogue must have guides.",
);
unique(bookGuides, "book guides", "book");
const bookWords = {};
for (const b of bookGuides) {
  requiredText(b, ["title", "dek"], `book ${b.book}`);
  const expected = chapters.filter((c) => c.book === b.book).map((c) => c.id);
  check(
    JSON.stringify(b.chapterIds) === JSON.stringify(expected),
    `book ${b.book}: incomplete or reordered chapters`,
  );
  refs(b, "chapterIds", chapterRef);
  refs(b, "characterIds", characterRef);
  refs(b, "studyIds", studyRef);
  boundary(b.chapterIds, b.revealAt, `book ${b.book}`);
  sources(b.sources, `book ${b.book}`);
  paragraphs(b.intro, `book ${b.book}/intro`);
  paragraphs(b.summary, `book ${b.book}/summary`);
  for (const s of b.analysis || [])
    paragraphs(s.paragraphs, `book ${b.book}/${s.title}`);
  bookWords[b.book] = wordCount(
    [
      ...b.intro,
      ...b.summary,
      ...b.analysis.flatMap((s) => s.paragraphs),
      ...b.conflicts,
      ...b.symbols,
    ].join(" "),
  );
  check(
    bookWords[b.book] >= 450,
    `book ${b.book}: guide shorter than 450 words (${bookWords[b.book]})`,
  );
}
const expectedGuideIds = chapters.filter((c) => c.book > 0).map((c) => c.id);
check(chapterGuides.length === 96, "All 96 chapters require commentary pages.");
unique(chapterGuides, "chapter guides");
check(
  JSON.stringify(chapterGuides.map((c) => c.id).sort()) ===
    JSON.stringify([...expectedGuideIds].sort()),
  "Chapter guide IDs do not match the complete novel.",
);
const chapterGuideWords = {};
for (const c of chapterGuides) {
  chapterRef(c.id, "chapter guide");
  requiredText(c, ["summary"], c.id);
  check(
    c.analysis?.length && c.questions?.length,
    `${c.id}: chapter guide lacks analysis or reading question`,
  );
  refs(c, "characterIds", characterRef);
  refs(c, "studyIds", studyRef);
  refs(c, "relatedChapterIds", chapterRef);
  paragraphs([c.summary, ...c.analysis], `chapter ${c.id}`);
  chapterGuideWords[c.id] = wordCount(
    [c.summary, ...c.analysis, ...c.questions].join(" "),
  );
  check(
    chapterGuideWords[c.id] >= 80,
    `${c.id}: chapter guide shorter than 80 words (${chapterGuideWords[c.id]})`,
  );
}
let previousOrder = -1;
unique(events, "events");
for (const e of events) {
  requiredText(e, ["title", "text", "period"]);
  chapterRef(e.chapterId, e.id);
  const order = chapterById.get(e.chapterId)?.order ?? -1;
  check(order >= previousOrder, `${e.id}: timeline out of narrative order`);
  previousOrder = order;
  const detail = eventDetails[e.id];
  check(
    Boolean(detail),
    `${e.id}: event lacks participants/consequences/image/links`,
  );
  if (detail) {
    refs(detail, "characterIds", characterRef, e.id);
    imageRef(detail.imageId, e.id);
    requiredText(detail, ["consequences"], e.id);
    refs(detail, "relatedIds", eventRef, e.id);
  }
}
check(
  Object.keys(eventDetails).length === events.length,
  "Event detail count differs from timeline count.",
);
for (const r of relationships) {
  characterRef(r.source, r.label);
  characterRef(r.target, r.label);
  check(r.source !== r.target, `${r.label}: self relation`);
  chapterRef(r.chapterId, r.label);
  check(
    [
      "family",
      "conflict",
      "spiritual",
      "love",
      "philosophical",
      "event",
    ].includes(r.type),
    `${r.label}: unknown relationship filter`,
  );
}
unique(quotes, "quotes");
for (const q of quotes) {
  chapterRef(q.chapterId, q.id);
  requiredText(q, ["text", "speaker", "theme", "context"]);
  check(
    q.characterId === null || characterById.has(q.characterId),
    `${q.id}: unknown quote speaker`,
  );
  for (const id of q.subjectIds || []) characterRef(id, q.id);
  check(
    q.theme.length >= 4 && q.theme.length <= 100,
    `${q.id}: invalid thematic facet`,
  );
}
unique(images, "images");
unique(images, "image paths", "src");
const imageSources = new Map();
for (const a of images) {
  requiredText(a, [
    "title",
    "src",
    "author",
    "date",
    "license",
    "licenseUrl",
    "description",
    "section",
  ]);
  check(a.width > 0 && a.height > 0, `${a.id}: missing image dimensions`);
  check(
    ["archive", "generated"].includes(a.kind),
    `${a.id}: missing provenance kind`,
  );
  check(
    ["historical", "contemporary", "generated"].includes(a.era),
    `${a.id}: missing historical/contemporary distinction`,
  );
  if (a.kind === "archive") url(a.sourceUrl, a.id);
  url(a.licenseUrl, a.id);
  for (const c of a.characterIds || []) characterRef(c, a.id);
  for (const c of a.chapterIds || []) chapterRef(c, a.id);
  const filename = path.join(root, "public", a.src);
  if (!existsSync(filename)) {
    errors.push(`${a.id}: image file missing`);
    continue;
  }
  const bytes = readFileSync(filename);
  check(bytes.length > 1000, `${a.id}: empty image`);
  check(
    bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP",
    `${a.id}: invalid WebP`,
  );
  if (a.kind === "archive") {
    if (imageSources.has(a.sourceUrl))
      errors.push(
        `${a.id}: duplicate source artwork also ${imageSources.get(a.sourceUrl)}`,
      );
    else imageSources.set(a.sourceUrl, a.id);
  }
}
check(
  images.length >= 60,
  "Visual collection contains fewer than 60 distinct catalogued works.",
);
check(literaryRoutes.length === 6, "All six literary routes must exist.");
unique(literaryRoutes, "literary routes");
for (const r of literaryRoutes) {
  requiredText(r, ["title", "dek"]);
  refs(r, "characterIds", characterRef);
  check(r.steps?.length >= 4, `${r.id}: route too short`);
  for (const s of r.steps || []) {
    requiredText(s, ["title", "comment"], r.id);
    chapterRef(s.chapterId, r.id);
    refs(s, "studyIds", studyRef, r.id);
    refs(s, "eventIds", eventRef, r.id);
    refs(s, "imageIds", imageRef, r.id);
    for (const qid of s.quoteIds || [])
      check(quoteById.has(qid), `${r.id}: unknown quote ${qid}`);
  }
}
check(
  authorSections.length >= 8 && authorChronology.length >= 10,
  "Writer/context section incomplete.",
);
sources(authorSources, "author");
unique(authorSections, "author sections");
for (const s of authorSections) {
  requiredText(s, ["id", "title"]);
  paragraphs(s.paragraphs, `author/${s.id}`);
  refs(s, "chapterIds", chapterRef);
}
for (const q of authorQuotes || []) {
  requiredText(q, ["id", "text", "author", "date", "context"]);
  url(q.sourceUrl, q.id);
}
check(
  courtEvidence.length >= 10 &&
    courtWitnesses.length >= 4 &&
    courtContradictions.length >= 3,
  "Interactive court dossier lacks evidence/witnesses/contradictions.",
);
unique(courtEvidence, "court evidence");
unique(courtWitnesses, "court witnesses");
unique(courtContradictions, "court contradictions");
for (const e of courtEvidence) {
  requiredText(e, [
    "title",
    "category",
    "summary",
    "prosecution",
    "defense",
    "limit",
  ]);
  refs(e, "chapterIds", chapterRef, e.id);
  refs(e, "witnessIds", characterRef, e.id);
  check(
    typeof e.knownToCourt === "boolean",
    `${e.id}: court/reader knowledge not distinguished`,
  );
}
for (const w of courtWitnesses) {
  characterRef(w.id, "court witness");
  requiredText(w, ["title", "position", "text"]);
  chapterRef(w.chapterId, w.id);
}
for (const c of courtContradictions) {
  requiredText(c, ["title", "text"]);
  check(
    c.evidenceIds.length >= 2,
    `${c.id}: contradiction needs at least two evidence records`,
  );
  for (const id of c.evidenceIds)
    check(
      courtEvidence.some((e) => e.id === id),
      `${c.id}: undefined evidence ${id}`,
    );
}
check(
  history.length >= 6 && editorialSources.length >= 2,
  "Preserved historical/source materials missing",
);
for (const s of editorialSources) url(s.url, s.title);
for (const r of repeated)
  errors.push(
    `Repeated substantial paragraph: ${r.previous} and ${r.owner}: ${r.text}…`,
  );
Object.assign(counts, {
  chapters: chapters.length,
  novelChapters: 96,
  characters: characters.length,
  legacyThemes: themes.length,
  studies: studies.length,
  centralEssays: Object.keys(characterEssays).length,
  bookGuides: bookGuides.length,
  chapterGuides: chapterGuides.length,
  quotes: quotes.length,
  events: events.length,
  relationships: relationships.length,
  images: images.length,
  archiveImages: images.filter((a) => a.kind === "archive").length,
  generatedImages: images.filter((a) => a.kind === "generated").length,
  routes: literaryRoutes.length,
  courtEvidence: courtEvidence.length,
  authorSections: authorSections.length,
  exactRepeatedParagraphs: repeated.length,
});
const report = {
  verifiedAt: new Date().toISOString(),
  status: errors.length ? "FAIL" : "PASS",
  counts,
  essayWords,
  studyWords,
  bookWords,
  chapterGuideWords,
  profileWords,
  essayBoundaries,
  errors,
};
mkdirSync(path.join(root, ".next"), { recursive: true });
writeFileSync(
  path.join(root, ".next/content-validation-v2.json"),
  JSON.stringify(report, null, 2) + "\n",
);
if (process.argv.includes("--write-report")) {
  const rows = Object.entries(counts)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join("\n");
  const md = `# Контентный аудит Karamazov 2.0\n\nСтатус автоматической проверки: **${report.status}**. Проверяется фактическое содержимое файлов, а не обещанные объёмы.\n\n| Материал | Количество |\n|---|---:|\n${rows}\n\n## Глубина материалов\n\nШесть центральных досье: ${Object.entries(
    essayWords,
  )
    .map(([id, n]) => `${id} — ${n} слов`)
    .join(
      "; ",
    )}. Философские статьи: ${Math.min(...Object.values(studyWords))}–${Math.max(...Object.values(studyWords))} слов основного текста. Путеводители книг: ${Math.min(...Object.values(bookWords))}–${Math.max(...Object.values(bookWords))} слов.\n\n## Что проверяется\n\nПолнота 12 книг и эпилога; точное совпадение цитат с конкретными главами; отсутствие потери или перестановки глав; все типизированные ссылки на персонажей, главы, исследования, события и изображения; явная атрибуция речей и рассказа о героях; библиографические URL; наличие файлов изображений, формата WebP, размеров, источника и лицензии; границы спойлеров; отсутствие точных повторов абзацев от 25 слов в редакционных материалах.\n\n## Выборочная проверка внешних источников\n\n1 ноября 2026 года повторно открыты первичные страницы Викитеки, академический комментарий РВБ, запись РГБ о томе 6 Бахтина (01001854137), хронология музея Достоевского, страница мемориальной квартиры и биографическая справка Президентской библиотеки: HTTP 200 и соответствующие заявленным источникам заголовки. Короткий фрагмент письма Н. А. Любимову от 10 мая 1879 года о кульминационном значении пятой книги проверен на буквальное совпадение с опубликованным письмом РВБ. Это выборочная проверка источников, а не независимая академическая рецензия всех интерпретаций.\n\n## Пределы проверки\n\nПроверка точности цитат относится к сохранённой электронной транскрипции, а не к посимвольной сверке с печатными сканами. Наличие корректного URL не заменяет научной экспертизы утверждения. Редакционные трактовки явно отделены от фактов текста и не объявлены единственной позицией автора. При изображениях проверяются сведения о происхождении и лицензии; художественные реконструкции не выдаются за исторические документы. Короткие совпадающие формулировки, названия, перекрёстные ссылки и цитаты не считаются повтором редакционного абзаца.\n\n${errors.length ? "## Незавершённые проверки\n\n" + errors.map((e) => "- " + e).join("\n") : "Все перечисленные автоматические проверки пройдены."}\n`;
  writeFileSync(path.join(root, "docs/content-audit-v2.md"), md);
}
console.log(`${report.status}: ${JSON.stringify(counts)}`);
if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "PASS: all coverage, references, image provenance and editorial duplicate checks.",
  );
