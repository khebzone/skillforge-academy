import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarClock,
  Clock,
  GraduationCap,
  Play,
  PlayCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCourses, useMyEnrollments, useUserProgress } from "@/api/hooks";
import { useAuth } from "@/auth/AuthContext";
import { CourseCover } from "@/components/CourseVisuals";
import { Input, Select } from "@/components/ui/Form";
import { Card, EmptyState, Spinner, StatCard } from "@/components/ui/Misc";
import { statusOf } from "@/lib/analytics";
import { allLessons, cn, courseProgress, formatDate, formatDuration } from "@/lib/utils";
import type { Course, Enrollment, LessonProgress } from "@/api/types";

type Status = ReturnType<typeof statusOf>;
type Progress = ReturnType<typeof courseProgress>;
type Sort = "recent" | "progress" | "title";
const TABS = ["All", "In progress", "Completed", "Not started"] as const;

/** Most recent lesson-completion timestamp for a course, falling back to enrollment date. */
function lastActivity(course: Course, enrollment: Enrollment, progress: LessonProgress[]) {
  const times = progress
    .filter((p) => p.courseId === course.id && p.completedAt)
    .map((p) => new Date(p.completedAt!).getTime());
  return times.length ? Math.max(...times) : new Date(enrollment.enrolledAt).getTime();
}

function dueStatus(dueDate: string | undefined, pct: number) {
  if (!dueDate || pct === 100) return null;
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Overdue", tone: "red" as const };
  if (days <= 7) return { label: days === 0 ? "Due today" : `Due in ${days}d`, tone: "amber" as const };
  return { label: `Due ${formatDate(dueDate)}`, tone: "gray" as const };
}

export default function MyLearning() {
  const { user } = useAuth();
  const { data: enrollments, isLoading: l1 } = useMyEnrollments();
  const { data: courses, isLoading: l2 } = useCourses();
  const { data: progress = [], isLoading: l3 } = useUserProgress(user?.id);

  const [tab, setTab] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const mine = useMemo(() => {
    if (!enrollments || !courses) return [];
    return enrollments
      .map((e) => ({ e, course: courses.find((c) => c.id === e.courseId && c.status === "published") }))
      .filter((x): x is { e: Enrollment; course: Course } => !!x.course)
      .map((x) => {
        const p = courseProgress(x.course, progress);
        return { ...x, p, status: statusOf(p.pct), lastActivity: lastActivity(x.course, x.e, progress) };
      });
  }, [enrollments, courses, progress]);

  if (l1 || l2 || l3) return <div className="grid place-items-center py-32"><Spinner /></div>;

  const completed = mine.filter((x) => x.status === "Completed").length;
  const inProgress = mine.filter((x) => x.status === "In progress").length;
  const minutesLearned = mine.reduce((sum, { course }) => {
    const doneIds = new Set(progress.filter((p) => p.courseId === course.id && p.completedAt).map((p) => p.lessonId));
    return sum + allLessons(course).filter((l) => doneIds.has(l.id)).reduce((n, l) => n + l.durationMin, 0);
  }, 0);
  const first = user?.name.split(" ")[0];

  const active = mine.filter((x) => x.status === "In progress").sort((a, b) => b.lastActivity - a.lastActivity);

  const counts: Record<"All" | Status, number> = {
    All: mine.length,
    "In progress": inProgress,
    Completed: completed,
    "Not started": mine.length - inProgress - completed,
  };

  const filtered = mine
    .filter((x) => tab === "All" || x.status === tab)
    .filter((x) => !query || `${x.course.title} ${x.course.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "title" ? a.course.title.localeCompare(b.course.title) : sort === "progress" ? b.p.pct - a.p.pct : b.lastActivity - a.lastActivity,
    );

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">Welcome back, {first}</h1>
      <p className="mt-1 text-ink-500">Pick up where you left off, or start something new.</p>

      {mine.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            icon={<GraduationCap />}
            title="No courses assigned yet"
            body="Your organization hasn't enrolled you in a course yet. Once they do, it will show up here."
          />
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Enrolled courses" value={mine.length} icon={<BookOpenCheck />} />
            <StatCard label="In progress" value={inProgress} icon={<PlayCircle />} tone="sky" />
            <StatCard label="Completed" value={completed} icon={<Award />} tone="green" />
            <StatCard label="Hours learned" value={minutesLearned ? formatDuration(minutesLearned) : "0m"} icon={<Clock />} tone="amber" />
          </div>

          {active.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold text-ink-900">Continue learning</h2>
              <div className="-mx-1 flex snap-x gap-5 overflow-x-auto px-1 pb-3">
                {active.map((x) => (
                  <div key={x.e.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                    <LearnerCourseCard e={x.e} course={x.course} p={x.p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {TABS.filter((t) => t === "All" || t === tab || counts[t] > 0).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
                      tab === t ? "bg-ink-900 text-white ring-ink-900" : "bg-white text-ink-600 ring-ink-200 hover:ring-ink-300",
                    )}
                  >
                    {t} <span className={cn("ml-0.5 tabular-nums", tab === t ? "text-white/70" : "text-ink-400")}>{counts[t]}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search my courses"
                    className="h-10 w-full pl-9 sm:w-52"
                    aria-label="Search my courses"
                  />
                </div>
                <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 w-[9.5rem]" aria-label="Sort courses">
                  <option value="recent">Recently active</option>
                  <option value="progress">Progress</option>
                  <option value="title">Title A–Z</option>
                </Select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Search />}
                  title="No courses match"
                  body={query ? `Nothing found for "${query}".` : `You don't have any ${tab.toLowerCase()} courses.`}
                />
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((x) => (
                  <LearnerCourseCard key={x.e.id} e={x.e} course={x.course} p={x.p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function LearnerCourseCard({ e, course, p }: { e: Enrollment; course: Course; p: Progress }) {
  const due = dueStatus(e.dueDate, p.pct);
  const cta = p.pct === 100 ? { label: "Review", Icon: RotateCcw } : p.pct === 0 ? { label: "Start", Icon: ArrowRight } : { label: "Continue", Icon: ArrowRight };

  return (
    <Link
      to={`/learn/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70 transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="relative aspect-video overflow-hidden">
        <CourseCover course={course} fill />
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition-colors group-hover:bg-ink-950/35">
          <span className="grid size-11 scale-90 place-items-center rounded-full bg-white/95 opacity-0 shadow-pop transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
            <Play className="size-4 translate-x-0.5 fill-ink-900 text-ink-900" />
          </span>
        </div>
        {p.pct === 100 && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Award className="size-3" /> Completed
          </span>
        )}
      </div>
      <div className="h-[3px] w-full bg-ink-100">
        <div className={cn("h-full transition-all duration-500", p.pct === 100 ? "bg-emerald-500" : "bg-brand-600")} style={{ width: `${p.pct}%` }} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{course.category}</span>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">{course.title}</h3>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className={cn("font-semibold tabular-nums", p.pct === 100 ? "text-emerald-700" : "text-ink-700")}>
              {p.pct === 100 ? "Completed" : `${p.pct}% complete`}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
              {cta.label} <cta.Icon className="size-3.5" />
            </span>
          </div>
          {due && (
            <p className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-medium", due.tone === "red" ? "text-red-600" : due.tone === "amber" ? "text-amber-600" : "text-ink-500")}>
              {due.tone === "gray" ? <CalendarClock className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {due.label}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
