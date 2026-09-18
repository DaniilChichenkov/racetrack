import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const envPath = path.resolve("backend/.env");
const examplePath = path.resolve("backend/.env.example");

function parseEnv(content) {
  const result = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    result[key] = value;
  }

  return result;
}

if (!fs.existsSync(examplePath)) {
  console.error("❌ backend/.env.example does not exist.");
  process.exit(1);
}

const requiredEnv = parseEnv(fs.readFileSync(examplePath, "utf8"));

let currentEnv = {};

if (fs.existsSync(envPath)) {
  currentEnv = parseEnv(fs.readFileSync(envPath, "utf8"));
}

const missingKeys = Object.keys(requiredEnv).filter(
  (key) => !currentEnv[key]?.trim(),
);

if (missingKeys.length === 0) {
  console.log("✅ Backend environment variables are configured.");
  process.exit(0);
}

console.log("\n⚠️ Missing backend environment variables:\n");

for (const key of missingKeys) {
  console.log(`  - ${key}`);
}

console.log();

const rl = readline.createInterface({ input, output });

try {
  for (const key of missingKeys) {
    let value = "";

    while (!value.trim()) {
      value = await rl.question(`${key}: `);

      if (!value.trim()) {
        console.log("Value cannot be empty.");
      }
    }

    currentEnv[key] = value.trim();
  }
} finally {
  rl.close();
}

const envContent =
  Object.entries(currentEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n";

fs.writeFileSync(envPath, envContent);

console.log("\n✅ backend/.env has been updated.\n");
