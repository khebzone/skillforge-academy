import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ChevronDown, Circle, Search } from "lucide-react";
import { LessonTypeIcon } from "@/components/CourseVisuals";
import { allLessons, cn, formatDuration } from "@/lib/utils";
import type { Course } from "@/api/types";

/** The actual module/lesson list — shared by the desktop sidebar and the mobile/theater drawer. */
export function CurriculumPanel({
  course,
  currentId,
  doneIds,
  onNavigate,
  showTitle = true,
}: {
  course: Course;
  currentId: string;
  doneIds: Set<string>;
  onNavigate?: () => void;
  showTitle?: boolean;
}) {
  const currentSection = course.sections.find((s) => s.lessons.some((l) => l.id === currentId))?.id;
  const [open, setOpen] = useState<Set<string>>(new Set(currentSection ? [currentSection] : []));
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (currentSection) setOpen((o) => (o.has(currentSection) ? o : new Set(o).add(currentSection)));
  }, [currentSection]);
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const q = query.trim().toLowerCase();
  const flat = allLessons(course);
  const remaining = flat.filter((l) => !doneIds.has(l.id)).reduce((n, l) => n + l.durationMin, 0);

  return (
    <div>
      <div className="border-b border-ink-100 px-5 py-4">
        {showTitle && <h3 className="text-sm font-semibold text-ink-900">Course content</h3>}
        <p className={cn("text-xs text-ink-500", showTitle && "mt-0.5")}>
          {doneIds.size}/{flat.length} lessons done{remaining ? ` · ${formatDuration(remaining)} remaining` : " · All lessons completed 🎉"}
        </p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons"
            aria-label="Search lessons"
            className="h-9 w-full rounded-lg border-0 bg-ink-50 pl-8 pr-3 text-[13px] text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      </div>
      {course.sections.map((sec, i) => {
        const matches = q ? sec.lessons.filter((l) => l.title.toLowerCase().includes(q)) : sec.lessons;
        if (q && matches.length === 0) return null;
        const done = sec.lessons.filter((l) => doneIds.has(l.id)).length;
        const isOpen = q ? true : open.has(sec.id);
        return (
          <div key={sec.id} className="border-b border-ink-100 last:border-0">
            <button onClick={() => toggle(sec.id)} aria-expanded={isOpen} className="flex w-full items-center gap-2 bg-ink-50/70 px-5 py-3 text-left hover:bg-ink-50">
              <span className="flex-1">
                <span className="block text-[13px] font-semibold text-ink-900">Module {i + 1}: {sec.title}</span>
                <span className="text-xs text-ink-500">{done}/{sec.lessons.length} completed</span>
              </span>
              <ChevronDown className={cn("size-4 text-ink-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <ul>
                {matches.map((l) => {
                  const active = l.id === currentId;
                  const d = doneIds.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        to={`/learn/${course.id}/${l.id}`}
                        onClick={onNavigate}
                        aria-current={active ? "true" : undefined}
                        className={cn("flex items-start gap-3 px-5 py-3 text-sm transition-colors", active ? "bg-brand-50" : "hover:bg-ink-50")}
                      >
                        {d ? <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-emerald-500" /> : <Circle className={cn("mt-0.5 size-[18px] shrink-0", active ? "text-brand-500" : "text-ink-300")} />}
                        <span className="min-w-0 flex-1">
                          <span className={cn("block leading-snug", active ? "font-semibold text-brand-800" : "text-ink-700")}>{l.title}</span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                            <LessonTypeIcon type={l.type} className="size-3.5" />
                            {formatDuration(l.durationMin)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
