import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = ".firebase/emulator-data";
const FIREBASE_DIR = ".firebase";
const EXPORT_METADATA = join(DATA_DIR, "firebase-export-metadata.json");
const EMULATORS = "auth,firestore,functions,storage";

mkdirSync(FIREBASE_DIR, { recursive: true });

if (existsSync(DATA_DIR) && !existsSync(EXPORT_METADATA)) {
  rmSync(DATA_DIR, { recursive: true, force: true });
}

const mode = process.argv[2] || "start";
const command = process.argv.slice(3).join(" ");
const cliMode = mode === "exec" ? "exec" : "start";
const shouldExportOnExit = mode === "start:persistent";

const args =
  cliMode === "exec"
    ? ["emulators:exec", "--only", EMULATORS]
    : ["emulators:start", "--only", EMULATORS];

if (existsSync(EXPORT_METADATA)) {
  args.push(`--import=${DATA_DIR}`);
}

if (shouldExportOnExit) {
  args.push(`--export-on-exit=${DATA_DIR}`);
}

if (cliMode === "exec") {
  if (!command) {
    console.error("Usage: node scripts/run-local-emulators.mjs exec \"npm run test:local:smoke\"");
    process.exit(1);
  }
  args.push(process.platform === "win32" ? `"${command.replace(/"/g, '\\"')}"` : command);
}

const child = spawn("firebase", args, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
