/**
 * License deny-gate (pure functions, fully testable on fixtures).
 *
 * Input is the JSON shape from `pnpm licenses list --prod --json`: an object
 * keyed by license name, each value a list of packages carrying that license.
 */

export interface LicensePackage {
  name: string;
  versions?: string[];
}

export type PnpmLicensesJson = Record<string, LicensePackage[]>;

export interface Exemption {
  package: string;
  license: string;
  reason: string;
  /** ISO date (YYYY-MM-DD). An exemption past this date no longer applies. */
  expires: string;
}

export interface Violation {
  package: string;
  license: string;
  detail: string;
}

export interface GateResult {
  ok: boolean;
  violations: Violation[];
  exemptedNotes: string[];
}

// Copyleft families we refuse to ship (aligned with pi-hero's deny list).
// No trailing word boundary: copyleft tokens are routinely glued to a version
// ("GPLv3", "AGPLv3", "LGPL-2.1"), and informal full names ("GNU General Public
// License") carry no SPDX token at all — both forms must still match.
const DENY_PATTERN = /\b(a?gpl|lgpl|sspl)|gnu\s+(lesser\s+|affero\s+)?general\s+public/i;

function isUnknown(license: string): boolean {
  const l = license.trim().toUpperCase();
  if (l === "" || l === "UNLICENSED" || l === "UNKNOWN" || l === "UNKNOWN LICENSE") {
    return true;
  }
  // npm's proprietary / custom-license markers — treat as unknown (deny unless
  // exempt) so a hidden license can never pass as if it were permissive.
  return l.startsWith("SEE LICENSE IN") || l.startsWith("LICENSEREF");
}

/** A single SPDX token (no AND/OR) is allowed iff it is neither unknown nor denied. */
function tokenAllowed(token: string): boolean {
  const t = token.replace(/[()]/g, "").trim();
  return t.length > 0 && !isUnknown(t) && !DENY_PATTERN.test(t);
}

/**
 * SPDX expression semantics:
 *  - OR: allowed if ANY operand is allowed (the dependency may be used under
 *    the permissive choice) — "MIT OR GPL-2.0" passes.
 *  - AND: allowed only if EVERY conjunct is allowed (all obligations bind) —
 *    "(MIT OR Apache-2.0) AND GPL-3.0" fails on the mandatory GPL conjunct.
 * Parens are flattened crudely; adequate for the simple expressions npm emits.
 * A full SPDX grammar (spdx-expression-parse) is deferred — see conventions.
 */
function licenseAllowed(license: string): boolean {
  if (isUnknown(license)) return false;
  return license.split(/\s+AND\s+/i).every((conjunct) => {
    const operands = conjunct
      .split(/\s+OR\s+/i)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    // some() is false for an empty (malformed) conjunct -> expression denied.
    return operands.some(tokenAllowed);
  });
}

export function evaluateLicenses(
  licenses: PnpmLicensesJson,
  exemptions: Exemption[],
  now: Date,
): GateResult {
  const violations: Violation[] = [];
  const exemptedNotes: string[] = [];
  // Floor `now` to its UTC date so a date-only `expires` (parsed at 00:00 UTC)
  // stays valid through the whole of its stated day, not just until midnight.
  const nowDate = new Date(now.toISOString().slice(0, 10));

  for (const [licenseName, packages] of Object.entries(licenses)) {
    if (licenseAllowed(licenseName)) continue;
    for (const pkg of packages) {
      const exemption = exemptions.find((e) => e.package === pkg.name && e.license === licenseName);
      if (exemption && new Date(exemption.expires) >= nowDate) {
        exemptedNotes.push(
          `${pkg.name} (${licenseName}) exempted until ${exemption.expires}: ${exemption.reason}`,
        );
        continue;
      }
      violations.push({
        package: pkg.name,
        license: licenseName,
        detail: isUnknown(licenseName)
          ? "unknown / unlicensed"
          : "denied copyleft family (GPL/AGPL/LGPL/SSPL)",
      });
    }
  }

  return { ok: violations.length === 0, violations, exemptedNotes };
}
