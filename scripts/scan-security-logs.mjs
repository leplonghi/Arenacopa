#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DEFAULT_EXCLUDES = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "android/app/build",
  "android/build",
  "android/.gradle",
]);

const LARGE_TEXT_FIXTURES = new Set([
  "all_files_dump.txt",
  "locales_dump.txt",
  "diff.txt",
]);

const GENERATED_LOG_PREFIXES = [
  "hs_err_pid",
  "replay_pid",
];

const GENERATED_TEXT_SUFFIXES = [
  "_read.txt",
  "_audit.txt",
];

const indicators = [
  {
    id: "vite-file-read-probe",
    pattern: /(vite:invoke|fetchModule|@fs|file:\/\/.*(\?raw|\?inline)|server\.fs|\.map\?|[?&]raw\b|\/\.env\b|etc\/passwd|windows\/win\.ini|win\.ini)/i,
  },
  {
    id: "i18next-locale-injection",
    pattern: /(\b(lng|ns)(=|%3d)[^\s"'<>]*(\.\.|%2e%2e|%2f|%5c|\/|\\|\?|%3f)|\/locales\/[^\s"'<>]*(\.\.|%2e%2e|%2f|%5c|\\))/i,
  },
  {
    id: "xml-entity-expansion",
    pattern: /(<!DOCTYPE[^>]+<!ENTITY|<!ENTITY|&#x?[0-9a-f]{2,};(?:.*&#x?[0-9a-f]{2,};){4,})/i,
  },
  {
    id: "protobuf-descriptor-injection",
    pattern: /(protobuf|proto3|nested"\s*:\s*\{|nested.*fields|child_process|process\.mainModule|Function\(|constructor\.constructor)/i,
  },
  {
    id: "common-secret-probing",
    pattern: /(\/\.git\/config|\/\.env(\.|$)|id_rsa|serviceAccount|firebase.*credential|private[_-]?key\.(json|pem|key)|secret[_-]?(key|token)|api[_-]?key=|apikey=)/i,
  },
];

function shouldSkipDirectory(fullPath, root) {
  const relative = path.relative(root, fullPath).replaceAll(path.sep, "/");
  return [...DEFAULT_EXCLUDES].some((entry) => relative === entry || relative.startsWith(`${entry}/`));
}

function* walk(dir, root) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(fullPath, root)) {
        yield* walk(fullPath, root);
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/\.(log|txt|jsonl)$/i.test(entry.name)) continue;
    if (LARGE_TEXT_FIXTURES.has(entry.name)) continue;
    if (GENERATED_LOG_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue;
    if (GENERATED_TEXT_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) continue;

    yield fullPath;
  }
}

function scanFile(filePath, root) {
  const stats = statSync(filePath);
  if (stats.size > 10 * 1024 * 1024) return [];

  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];

  lines.forEach((line, index) => {
    for (const indicator of indicators) {
      if (indicator.pattern.test(line)) {
        hits.push({
          file: path.relative(root, filePath),
          line: index + 1,
          detector: indicator.id,
          sample: line.trim().slice(0, 240),
        });
      }
    }
  });

  return hits;
}

const roots = process.argv.slice(2);
const scanRoots = roots.length ? roots : [process.cwd()];
const allHits = [];

for (const inputRoot of scanRoots) {
  const root = path.resolve(inputRoot);
  for (const filePath of walk(root, root)) {
    allHits.push(...scanFile(filePath, root));
  }
}

if (allHits.length === 0) {
  console.log("No suspicious CVE exploit indicators found in scanned log files.");
  process.exit(0);
}

for (const hit of allHits) {
  console.log(`${hit.detector}\t${hit.file}:${hit.line}\t${hit.sample}`);
}

console.error(`Found ${allHits.length} suspicious log indicator(s). Investigate before closing the CVE review.`);
process.exit(1);
