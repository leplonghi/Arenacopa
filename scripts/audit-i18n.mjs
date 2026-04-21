import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const localesDir = path.join(root, "public", "locales");
const supportedLocales = ["pt-BR", "en", "es"];
const namespaces = ["common", "auth", "copa", "bolao", "guia", "ranking", "profile", "errors", "sedes", "home", "premium", "championships"];

function walk(dir, predicate) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(target, predicate));
      continue;
    }
    if (predicate(target)) {
      results.push(target);
    }
  }
  return results;
}

function flattenKeys(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(child, next);
  });
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getMissingLocaleKeys() {
  const reference = new Map();

  for (const namespace of namespaces) {
    const ptFile = path.join(localesDir, "pt-BR", `${namespace}.json`);
    if (!fs.existsSync(ptFile)) continue;
    reference.set(namespace, new Set(flattenKeys(loadJson(ptFile))));
  }

  const missing = {};
  for (const locale of supportedLocales) {
    missing[locale] = [];
    for (const [namespace, referenceKeys] of reference.entries()) {
      const localeFile = path.join(localesDir, locale, `${namespace}.json`);
      if (!fs.existsSync(localeFile)) {
        missing[locale].push(`${namespace}: missing file`);
        continue;
      }

      const localeKeys = new Set(flattenKeys(loadJson(localeFile)));
      for (const key of referenceKeys) {
        if (!localeKeys.has(key)) {
          missing[locale].push(`${namespace}.${key}`);
        }
      }
    }
  }

  return missing;
}

function getHardcodedTextSuspects() {
  const files = walk(srcDir, (filePath) => [".ts", ".tsx"].includes(path.extname(filePath)));
  const suspects = [];

  const jsxTextRegex = />\s*([A-Za-zÀ-ÿ][^<{}`]{2,})\s*</g;
  const literalRegex = /(["'`])([^"'`\n]*(?:[A-Za-zÀ-ÿ]{3,}[^"'`\n]*))\1/g;
  const ignored = [
    "http",
    "className",
    "aria-",
    "translate",
    "linear-gradient",
    "rgba(",
    "hsla(",
    "displayName",
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (trimmed.includes("t(") || trimmed.includes("useTranslation")) return;

      for (const regex of [jsxTextRegex, literalRegex]) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const text = (match[1] ?? match[2] ?? "").trim();
          if (!text) continue;
          if (ignored.some((fragment) => text.includes(fragment))) continue;
          if (!/[A-Za-zÀ-ÿ]/.test(text)) continue;

          suspects.push({
            file: path.relative(root, file),
            line: index + 1,
            text,
          });
        }
      }
    });
  }

  return suspects;
}

const missingLocaleKeys = getMissingLocaleKeys();
const hardcodedTextSuspects = getHardcodedTextSuspects();

console.log("=== Missing locale keys ===");
for (const locale of supportedLocales) {
  const missing = missingLocaleKeys[locale];
  if (!missing.length) {
    console.log(`${locale}: OK`);
    continue;
  }
  console.log(`${locale}: ${missing.length} missing`);
  missing.slice(0, 50).forEach((item) => console.log(`  - ${item}`));
}

console.log("");
console.log("=== Hardcoded text suspects ===");
if (!hardcodedTextSuspects.length) {
  console.log("No relevant hardcoded text found.");
} else {
  hardcodedTextSuspects.slice(0, 200).forEach((item) => {
    console.log(`${item.file}:${item.line} -> ${item.text}`);
  });
  console.log(`Total suspects: ${hardcodedTextSuspects.length}`);
}
