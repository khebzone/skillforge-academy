import { CurriculumPanel } from "./CurriculumPanel";
import type { Course } from "@/api/types";

/** Desktop-only sticky sidebar shell around the shared curriculum list. */
export function Sidebar({ course, currentId, doneIds }: { course: Course; currentId: string; doneIds: Set<string> }) {
  return (
    <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6.5rem)] lg:self-start lg:overflow-y-auto">
      <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70">
        <CurriculumPanel course={course} currentId={currentId} doneIds={doneIds} />
      </div>
    </aside>
  );
}
