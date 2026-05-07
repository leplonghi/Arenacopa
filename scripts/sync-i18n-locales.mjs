import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localesDir = path.join(root, "public", "locales");
const referenceLocale = "pt-BR";
const supportedLocales = ["pt-BR", "en", "es"];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mergeMissing(reference, target) {
  if (Array.isArray(reference)) {
    return {
      changed: !Array.isArray(target),
      value: Array.isArray(target) ? target : reference,
    };
  }

  if (reference === null || typeof reference !== "object") {
    return {
      changed: target === undefined,
      value: target === undefined ? reference : target,
    };
  }

  const next = target && typeof target === "object" && !Array.isArray(target) ? { ...target } : {};
  let changed = !target || typeof target !== "object" || Array.isArray(target);

  for (const [key, value] of Object.entries(reference)) {
    const merged = mergeMissing(value, next[key]);
    next[key] = merged.value;
    changed ||= merged.changed;
  }

  return { changed, value: next };
}

const referenceDir = path.join(localesDir, referenceLocale);
const namespaces = fs
  .readdirSync(referenceDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) => path.basename(fileName, ".json"))
  .sort();

const summary = [];

for (const locale of supportedLocales) {
  const localeDir = path.join(localesDir, locale);
  fs.mkdirSync(localeDir, { recursive: true });

  for (const namespace of namespaces) {
    const referenceFile = path.join(referenceDir, `${namespace}.json`);
    const localeFile = path.join(localeDir, `${namespace}.json`);
    const existed = fs.existsSync(localeFile);
    const merged = mergeMissing(loadJson(referenceFile), loadJson(localeFile));

    if (!existed || merged.changed) {
      fs.writeFileSync(localeFile, `${JSON.stringify(merged.value, null, 2)}\n`);
      summary.push(`${locale}/${namespace}.json`);
    }
  }
}

if (summary.length === 0) {
  console.log("Locales already synchronized.");
} else {
  console.log(`Synchronized ${summary.length} locale file(s):`);
  summary.forEach((item) => console.log(`  - ${item}`));
}
