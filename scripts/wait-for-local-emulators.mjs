import net from "node:net";

const targets = [
  { name: "auth", host: "127.0.0.1", port: 9099 },
  { name: "firestore", host: "127.0.0.1", port: 8280 },
  { name: "functions", host: "127.0.0.1", port: 5001 },
  { name: "storage", host: "127.0.0.1", port: 9199 },
];

const timeoutMs = Number(process.env.EMULATOR_WAIT_TIMEOUT_MS || 90_000);
const startedAt = Date.now();

function canConnect({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(1_000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForTarget(target) {
  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect(target)) {
      console.log(`[emulators] ${target.name} ready on ${target.host}:${target.port}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Timed out waiting for ${target.name} emulator on ${target.host}:${target.port}`);
}

await Promise.all(targets.map(waitForTarget));
