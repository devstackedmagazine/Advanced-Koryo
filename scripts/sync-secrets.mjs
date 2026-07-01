import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const envFlagIdx = args.indexOf("--env");
const envFlag = envFlagIdx !== -1 ? args[envFlagIdx + 1] : null;

function parseDotenv(text) {
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function stripJsonComments(str) {
  return str.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, comment) =>
    comment ? "" : m,
  );
}

function readWranglerVars() {
  const wranglerPath = join(root, "wrangler.jsonc");
  if (!existsSync(wranglerPath)) return new Set();
  const raw = readFileSync(wranglerPath, "utf8");
  const config = JSON.parse(stripJsonComments(raw));
  return new Set(Object.keys(config.vars ?? {}));
}

function readRequiredSecrets() {
  const wranglerPath = join(root, "wrangler.jsonc");
  if (!existsSync(wranglerPath)) return [];
  const raw = readFileSync(wranglerPath, "utf8");
  const config = JSON.parse(stripJsonComments(raw));
  return config.secrets?.required ?? [];
}

const envPath = join(root, ".env");
if (!existsSync(envPath)) {
  console.error("No .env file found at project root. Create one first.");
  process.exit(1);
}

const envVars = parseDotenv(readFileSync(envPath, "utf8"));
const varsKeys = readWranglerVars();
const required = readRequiredSecrets();

const toSync = Object.entries(envVars).filter(
  ([key]) => !key.startsWith("VITE_") && !varsKeys.has(key),
);

if (toSync.length === 0) {
  console.log("No secrets to sync (everything is either VITE_-prefixed or already in vars).");
  process.exit(0);
}

console.log(
  dryRun
    ? "Dry run — would push these secrets:"
    : `Pushing ${toSync.length} secret(s) to Cloudflare${envFlag ? ` [env: ${envFlag}]` : ""}...\n`,
);

const wranglerArgs = ["wrangler", "secret", "put"];
if (envFlag) wranglerArgs.push("--env", envFlag);

let failed = 0;
for (const [key, value] of toSync) {
  if (dryRun) {
    console.log(`  ${key}`);
    continue;
  }
  const result = spawnSync("npx", [...wranglerArgs, key], {
    input: value,
    cwd: root,
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.status !== 0) {
    console.error(`✗ ${key} failed (exit ${result.status})`);
    failed++;
  } else {
    console.log(`✓ ${key}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} secret(s) failed to sync.`);
  process.exit(1);
}

const missing = required.filter((k) => !(k in envVars) && !varsKeys.has(k));
if (missing.length > 0) {
  console.warn(`\n⚠  Required secrets missing from .env: ${missing.join(", ")}`);
}

console.log(`\nDone. ${toSync.length} secret(s) synced.`);
