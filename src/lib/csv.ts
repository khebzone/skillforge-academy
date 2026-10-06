import Papa from "papaparse";
import type { LearnerRow } from "@/api/types";

const NAME_KEYS = ["name", "full name", "fullname", "employee name", "student name", "learner name", "employee", "student"];
const EMAIL_KEYS = ["email", "e-mail", "email address", "mail", "work email", "official email", "email id"];

/**
 * Parse a pasted or uploaded learner list.
 * Accepts CSV with a header row (name/email in any order) or headerless "name, email" lines.
 */
export function parseLearnerList(text: string): LearnerRow[] {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: "greedy" });
  const data = parsed.data.map((r) => r.map((c) => (c ?? "").trim()));
  if (!data.length) return [];

  const header = data[0]!.map((h) => h.toLowerCase());
  let nameIdx = header.findIndex((h) => NAME_KEYS.includes(h));
  let emailIdx = header.findIndex((h) => EMAIL_KEYS.includes(h));
  let body = data;

  if (nameIdx !== -1 || emailIdx !== -1) {
    body = data.slice(1);
    if (emailIdx === -1) emailIdx = header.findIndex((_, i) => i !== nameIdx);
    if (nameIdx === -1) nameIdx = header.findIndex((_, i) => i !== emailIdx);
  } else {
    // No recognised header: find the column that looks like an email.
    emailIdx = data[0]!.findIndex((c) => c.includes("@"));
    if (emailIdx === -1) emailIdx = 1;
    nameIdx = emailIdx === 0 ? 1 : 0;
  }

  return body
    .map((r) => ({ name: r[nameIdx] ?? "", email: (r[emailIdx] ?? "").toLowerCase() }))
    .filter((r) => r.name || r.email);
}

export const learnerTemplateCsv = "Name,Email\nPriya Nair,priya.nair@company.com\nArjun Kapoor,arjun.kapoor@company.com\n";

export const toCsv = (rows: Record<string, string | number>[]) => Papa.unparse(rows);
