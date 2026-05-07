import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const localesDir = path.join(root, "public", "locales");
const referenceLocale = "pt-BR";
const supportedLocales = ["pt-BR", "en", "es"];
const namespaces = fs
  .readdirSync(path.join(localesDir, referenceLocale))
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) => path.basename(fileName, ".json"))
  .sort();

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

function getLocaleKeySets(locale) {
  const result = new Map();

  for (const namespace of namespaces) {
    const localeFile = path.join(localesDir, locale, `${namespace}.json`);
    if (!fs.existsSync(localeFile)) {
      result.set(namespace, null);
      continue;
    }
    result.set(namespace, new Set(flattenKeys(loadJson(localeFile))));
  }

  return result;
}

function hasTranslationKey(localeKeySets, namespace, key) {
  const keys = localeKeySets.get(namespace);
  if (!keys) return false;

  return (
    keys.has(key) ||
    keys.has(`${key}_one`) ||
    keys.has(`${key}_other`) ||
    keys.has(`${key}_zero`)
  );
}

function getMissingLocaleKeys() {
  const reference = getLocaleKeySets(referenceLocale);
  const missing = {};

  for (const locale of supportedLocales) {
    missing[locale] = [];
    const localeKeySets = getLocaleKeySets(locale);

    for (const [namespace, referenceKeys] of reference.entries()) {
      const localeKeys = localeKeySets.get(namespace);
      if (!localeKeys) {
        missing[locale].push(`${namespace}: missing file`);
        continue;
      }

      for (const key of referenceKeys) {
        if (!localeKeys.has(key)) {
          missing[locale].push(`${namespace}.${key}`);
        }
      }
    }
  }

  return missing;
}

function getSourceFiles() {
  return walk(srcDir, (filePath) => {
    const normalized = filePath.split(path.sep).join("/");
    if (![".ts", ".tsx"].includes(path.extname(filePath))) return false;
    if (normalized.includes("/src/test/")) return false;
    if (normalized.includes("/test/") || normalized.includes("_disabled/")) return false;
    return true;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTranslationFunctions(content) {
  const functions = new Map();
  const destructuredRegex =
    /(?:const|let|var)\s*\{([^}]*\bt\s*(?::\s*[$A-Z_a-z][$\w]*)?[^}]*)\}\s*=\s*useTranslation\(\s*(?:(["'`])([\w-]+)\2)?\s*\)/g;
  let match;

  while ((match = destructuredRegex.exec(content)) !== null) {
    const destructured = match[1];
    const namespace = match[3] || "common";
    const aliasMatch = /\bt\s*(?::\s*([$A-Z_a-z][$\w]*))?/.exec(destructured);
    functions.set(aliasMatch?.[1] || "t", namespace);
  }

  if (content.includes("i18n.t(")) {
    functions.set("i18n.t", "common");
  }

  return functions;
}

function parseTranslationKey(rawKey, defaultNamespace) {
  if (rawKey.includes(":")) {
    const [namespace, key] = rawKey.split(/:(.*)/s);
    return { namespace, key };
  }

  return { namespace: defaultNamespace, key: rawKey };
}

function getMissingCodeKeys() {
  const localeKeySets = getLocaleKeySets(referenceLocale);
  const missing = [];

  for (const file of getSourceFiles()) {
    const content = fs.readFileSync(file, "utf8");
    if (!content.includes("useTranslation") && !content.includes("i18n.t(")) continue;

    const translationFunctions = getTranslationFunctions(content);
    if (!translationFunctions.size) continue;

    const lines = content.split(/\r?\n/);

    for (const [functionName, defaultNamespace] of translationFunctions.entries()) {
      const callRegex = new RegExp(`\\b${escapeRegExp(functionName)}\\(\\s*(["'\`])([^"'\`$]+)\\1`, "g");

      lines.forEach((line, index) => {
        let match;
        callRegex.lastIndex = 0;
        while ((match = callRegex.exec(line)) !== null) {
          const { namespace, key } = parseTranslationKey(match[2], defaultNamespace);
          if (!namespaces.includes(namespace)) {
            missing.push({
              file: path.relative(root, file),
              line: index + 1,
              key: `${namespace}:${key}`,
              reason: "unknown namespace",
            });
            continue;
          }

          if (!hasTranslationKey(localeKeySets, namespace, key)) {
            missing.push({
              file: path.relative(root, file),
              line: index + 1,
              key: `${namespace}:${key}`,
              reason: "missing in pt-BR",
            });
          }
        }
      });
    }
  }

  return missing;
}

function getHardcodedTextSuspects() {
  const files = getSourceFiles().filter((filePath) => {
    const normalized = filePath.split(path.sep).join("/");
    return !normalized.endsWith("/src/i18n/staticText.ts");
  });
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
    "Promise",
    "Array",
    "TFunction",
    "Date.now",
    "country.cities",
    "now - timestamp",
    "ArenaCopa",
    "ArenaCup",
    "arenacopa.app",
    "FIFA",
    "CartoDB",
    "QR Code",
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (
        trimmed.includes("t(") ||
        trimmed.includes("tStatic(") ||
        trimmed.includes("useTranslation") ||
        trimmed.includes("i18n-ignore")
      ) return;

      for (const regex of [jsxTextRegex, literalRegex]) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const text = (match[1] ?? match[2] ?? "").trim();
          if (!text) continue;
          if (ignored.some((fragment) => text.includes(fragment))) continue;
          if (/^R\$\s?\d/.test(text)) continue;
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
const missingCodeKeys = getMissingCodeKeys();
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
console.log("=== Missing code translation keys ===");
if (!missingCodeKeys.length) {
  console.log("No missing keys referenced by source files.");
} else {
  missingCodeKeys.slice(0, 200).forEach((item) => {
    console.log(`${item.file}:${item.line} -> ${item.key} (${item.reason})`);
  });
  console.log(`Total missing code keys: ${missingCodeKeys.length}`);
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

const hasMissingLocaleKeys = Object.values(missingLocaleKeys).some((items) => items.length > 0);
if (hasMissingLocaleKeys || missingCodeKeys.length > 0 || hardcodedTextSuspects.length > 0) {
  process.exitCode = 1;
}
