import type { Course, Lesson } from "@/api/types";
import { allLessons } from "@/lib/utils";

export const lessonHasContent = (l: Lesson) =>
  l.type === "ppt" ? !!(l.previewUrl || l.previewFileKey || l.url || l.fileKey) : !!(l.url || l.fileKey);

/** Returns a list of human-readable problems that block publishing. */
export function validateForPublish(c: Course): string[] {
  const problems: string[] = [];
  if (!c.title.trim() || c.title === "Untitled course") problems.push("Add a course title");
  if (!c.subtitle.trim()) problems.push("Add a short subtitle");
  if (c.description.trim().length < 30) problems.push("Write a course description (at least 30 characters)");
  const lessons = allLessons(c);
  if (!lessons.length) problems.push("Add at least one lesson");
  const empty = lessons.filter((l) => !lessonHasContent(l));
  if (empty.length) problems.push(`${empty.length} lesson${empty.length > 1 ? "s have" : " has"} no file or link: ${empty.slice(0, 2).map((l) => `"${l.title}"`).join(", ")}${empty.length > 2 ? "…" : ""}`);
  if (c.sections.some((s) => !s.lessons.length)) problems.push("Remove or fill empty modules");
  return problems;
}
