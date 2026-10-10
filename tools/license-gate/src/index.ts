#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { type Exemption, evaluateLicenses, type PnpmLicensesJson } from "./gate.ts";

/** Read + parse JSON, failing with a readable message + exit 2 (not a raw stack). */
function readJson<T>(path: string, label: string): T {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    process.stderr.write(
      `license-gate: cannot read ${label} at ${path}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(2);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    process.stderr.write(
      `license-gate: ${label} at ${path} is not valid JSON: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(2);
  }
}

function main(): void {
  const [, , licensesPath, exemptionsPath] = process.argv;
  if (!licensesPath) {
    process.stderr.write("usage: license-gate <pnpm-licenses.json> [exceptions.json]\n");
    process.exit(2);
  }

  const licenses = readJson<PnpmLicensesJson>(licensesPath, "licenses report");
  const exemptions: Exemption[] = exemptionsPath
    ? readJson<Exemption[]>(exemptionsPath, "exceptions file")
    : [];

  const result = evaluateLicenses(licenses, exemptions, new Date());

  for (const note of result.exemptedNotes) {
    process.stdout.write(`exempted: ${note}\n`);
  }

  if (!result.ok) {
    process.stderr.write("License gate FAILED:\n");
    for (const v of result.violations) {
      process.stderr.write(
        `  x ${v.package} — ${v.license} (${v.detail}); trace the chain with: vp why ${v.package}\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write("License gate passed.\n");
}

main();
