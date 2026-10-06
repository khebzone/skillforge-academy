import type { Course, Enrollment, LessonProgress } from "@/api/types";
import { allLessons } from "./utils";

/** Index of completed-lesson counts per `userId:courseId`, restricted to lessons that still exist. */
export function buildProgressIndex(courses: Course[], progress: LessonProgress[]) {
  const lessonIds = new Map(courses.map((c) => [c.id, new Set(allLessons(c).map((l) => l.id))]));
  const done = new Map<string, number>();
  for (const p of progress) {
    if (!p.completedAt || !lessonIds.get(p.courseId)?.has(p.lessonId)) continue;
    const k = `${p.userId}:${p.courseId}`;
    done.set(k, (done.get(k) ?? 0) + 1);
  }
  const totals = new Map(courses.map((c) => [c.id, lessonIds.get(c.id)!.size]));
  return (e: Pick<Enrollment, "userId" | "courseId">) => {
    const total = totals.get(e.courseId) ?? 0;
    const d = done.get(`${e.userId}:${e.courseId}`) ?? 0;
    return { done: d, total, pct: total ? Math.round((d / total) * 100) : 0 };
  };
}

export type ProgressOf = ReturnType<typeof buildProgressIndex>;

export const statusOf = (pct: number) => (pct === 100 ? "Completed" : pct > 0 ? "In progress" : "Not started");
