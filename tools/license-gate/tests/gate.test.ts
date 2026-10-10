import { expect, test } from "vite-plus/test";
import { type Exemption, evaluateLicenses } from "../src/gate.ts";

const NOW = new Date("2026-06-10");

test("AGPL dependency fails; removing it passes (AE3)", () => {
  const fail = evaluateLicenses({ "AGPL-3.0": [{ name: "bad-pkg" }] }, [], NOW);
  expect(fail.ok).toBe(false);
  expect(fail.violations[0]?.package).toBe("bad-pkg");

  const pass = evaluateLicenses({ MIT: [{ name: "good-pkg" }] }, [], NOW);
  expect(pass.ok).toBe(true);
});

test("transitive violation reports the package; a fresh exemption clears it (AE9)", () => {
  const licenses = { "GPL-3.0": [{ name: "deep-transitive-dep" }] };

  const blocked = evaluateLicenses(licenses, [], NOW);
  expect(blocked.ok).toBe(false);
  expect(blocked.violations[0]?.package).toBe("deep-transitive-dep");

  const exemption: Exemption = {
    package: "deep-transitive-dep",
    license: "GPL-3.0",
    reason: "build-only, not shipped",
    expires: "2099-01-01",
  };
  const exempted = evaluateLicenses(licenses, [exemption], NOW);
  expect(exempted.ok).toBe(true);
  expect(exempted.exemptedNotes[0]).toContain("deep-transitive-dep");
});

test("SPDX OR passes when any operand is allowed", () => {
  expect(evaluateLicenses({ "MIT OR GPL-2.0": [{ name: "x" }] }, [], NOW).ok).toBe(true);
  expect(evaluateLicenses({ "AGPL-3.0 OR GPL-3.0": [{ name: "y" }] }, [], NOW).ok).toBe(false);
});

test("unknown / unlicensed / custom markers fail", () => {
  expect(evaluateLicenses({ UNLICENSED: [{ name: "z" }] }, [], NOW).ok).toBe(false);
  expect(evaluateLicenses({ "": [{ name: "w" }] }, [], NOW).ok).toBe(false);
  // npm proprietary/custom markers must not pass as permissive.
  expect(evaluateLicenses({ "SEE LICENSE IN license.txt": [{ name: "p" }] }, [], NOW).ok).toBe(
    false,
  );
  expect(evaluateLicenses({ "LicenseRef-Custom": [{ name: "q" }] }, [], NOW).ok).toBe(false);
});

test("SPDX AND requires every conjunct allowed", () => {
  // A mandatory copyleft conjunct must fail even when an OR-group is permissive.
  expect(evaluateLicenses({ "(MIT OR Apache-2.0) AND GPL-3.0": [{ name: "x" }] }, [], NOW).ok).toBe(
    false,
  );
  expect(evaluateLicenses({ "MIT AND Apache-2.0": [{ name: "y" }] }, [], NOW).ok).toBe(true);
});

test("informal / glued copyleft strings are still denied", () => {
  for (const license of [
    "GPLv3",
    "AGPLv3",
    "LGPL-2.1",
    "SSPL-1.0",
    "GNU General Public License v3.0",
  ]) {
    expect(evaluateLicenses({ [license]: [{ name: "c" }] }, [], NOW).ok).toBe(false);
  }
});

test("exemption stays valid through its expiry day (date-boundary)", () => {
  const exemption: Exemption = {
    package: "bad-pkg",
    license: "AGPL-3.0",
    reason: "expires today, still valid today",
    expires: "2026-06-10",
  };
  // NOW is mid-day 2026-06-10; the exemption must not lapse until the day ends.
  const result = evaluateLicenses(
    { "AGPL-3.0": [{ name: "bad-pkg" }] },
    [exemption],
    new Date("2026-06-10T19:00:00Z"),
  );
  expect(result.ok).toBe(true);
});

test("expired exemption no longer applies", () => {
  const exemption: Exemption = {
    package: "bad-pkg",
    license: "AGPL-3.0",
    reason: "temporary",
    expires: "2026-01-01",
  };
  const result = evaluateLicenses({ "AGPL-3.0": [{ name: "bad-pkg" }] }, [exemption], NOW);
  expect(result.ok).toBe(false);
});
