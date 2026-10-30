import { clsx, type ClassValue } from "clsx";
import type { Course, Lesson, LessonProgress } from "@/api/types";

export const cn = (...v: ClassValue[]) => clsx(v);

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export function formatDuration(min: number) {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function formatDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export const allLessons = (c: Course): Lesson[] => c.sections.flatMap((s) => s.lessons);

export function courseStats(c: Course) {
  const lessons = allLessons(c);
  return {
    lessonCount: lessons.length,
    sectionCount: c.sections.length,
    minutes: lessons.reduce((n, l) => n + (l.durationMin || 0), 0),
    videos: lessons.filter((l) => l.type === "video").length,
    pdfs: lessons.filter((l) => l.type === "pdf").length,
    ppts: lessons.filter((l) => l.type === "ppt").length,
  };
}

export function courseProgress(c: Course, progress: LessonProgress[]) {
  const ids = new Set(allLessons(c).map((l) => l.id));
  const done = progress.filter((p) => p.courseId === c.id && p.completedAt && ids.has(p.lessonId)).length;
  const total = ids.size;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const LESSON_LABEL = { video: "Video", pdf: "PDF document", ppt: "Presentation" } as const;

/** Move an array item from one index to another, returning a new array. Out-of-range `to` is a no-op. */
export function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  copy.splice(to, 0, copy.splice(from, 1)[0]!);
  return copy;
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function downloadFile(filename: string, content: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
