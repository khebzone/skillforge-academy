import { Link } from "react-router";
import { ArrowRight, Award, BookOpenCheck, CalendarClock, GraduationCap, PlayCircle, RotateCcw } from "lucide-react";
import { useCourses, useMyEnrollments, useUserProgress } from "@/api/hooks";
import { useAuth } from "@/auth/AuthContext";
import { CourseCover, CourseMeta } from "@/components/CourseVisuals";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card, EmptyState, ProgressBar, Spinner, StatCard } from "@/components/ui/Misc";
import { allLessons, courseProgress, formatDate } from "@/lib/utils";
import type { Course, Enrollment, LessonProgress } from "@/api/types";

function nextLesson(course: Course, progress: LessonProgress[]) {
  const done = new Set(progress.filter((p) => p.courseId === course.id && p.completedAt).map((p) => p.lessonId));
  const lessons = allLessons(course);
  return lessons.find((l) => !done.has(l.id)) ?? lessons[0];
}

export default function MyLearning() {
  const { user } = useAuth();
  const { data: enrollments, isLoading: l1 } = useMyEnrollments();
  const { data: courses, isLoading: l2 } = useCourses();
  const { data: progress = [], isLoading: l3 } = useUserProgress(user?.id);

  if (l1 || l2 || l3) return <div className="grid place-items-center py-32"><Spinner /></div>;

  const mine = (enrollments ?? [])
    .map((e) => ({ e, course: courses?.find((c) => c.id === e.courseId && c.status === "published") }))
    .filter((x): x is { e: Enrollment; course: Course } => !!x.course)
    .map((x) => ({ ...x, p: courseProgress(x.course, progress) }));

  const completed = mine.filter((x) => x.p.pct === 100).length;
  const inProgress = mine.filter((x) => x.p.pct > 0 && x.p.pct < 100).length;
  const resume = mine.filter((x) => x.p.pct < 100).sort((a, b) => b.p.pct - a.p.pct)[0];
  const first = user?.name.split(" ")[0];

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
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Enrolled courses" value={mine.length} icon={<BookOpenCheck />} />
            <StatCard label="In progress" value={inProgress} icon={<PlayCircle />} tone="sky" />
            <StatCard label="Completed" value={completed} icon={<Award />} tone="green" />
          </div>

          {resume && (
            <Card className="mt-8 overflow-hidden">
              <div className="grid md:grid-cols-[320px_1fr]">
                <div className="min-h-44"><CourseCover course={resume.course} fill /></div>
                <div className="flex flex-col justify-center p-7">
                  <Badge tone="brand" className="w-fit">Continue learning</Badge>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink-900">{resume.course.title}</h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Up next: <span className="font-medium text-ink-700">{nextLesson(resume.course, progress)?.title}</span>
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <ProgressBar value={resume.p.pct} className="max-w-xs" />
                    <span className="text-sm font-medium tabular-nums text-ink-700">{resume.p.pct}%</span>
                  </div>
                  <div className="mt-6">
                    <LinkButton to={`/learn/${resume.course.id}`}>
                      {resume.p.pct === 0 ? "Start course" : "Resume"} <ArrowRight className="size-4" />
                    </LinkButton>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <h2 className="mb-4 mt-12 text-lg font-semibold text-ink-900">My courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map(({ e, course, p }) => (
              <Link
                key={e.id}
                to={`/learn/${course.id}`}
                className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70 transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <CourseCover course={course} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-500">{course.category}</span>
                    {p.pct === 100 && <Badge tone="green"><Award className="size-3" /> Completed</Badge>}
                  </div>
                  <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">{course.title}</h3>
                  <CourseMeta course={course} className="mt-2" />
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-ink-500">{p.done} of {p.total} lessons</span>
                      <span className="font-semibold tabular-nums text-ink-700">{p.pct}%</span>
                    </div>
                    <ProgressBar value={p.pct} />
                    <div className="mt-4 flex items-center justify-between">
                      {e.dueDate && p.pct < 100 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500"><CalendarClock className="size-3.5" />Due {formatDate(e.dueDate)}</span>
                      ) : <span />}
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                        {p.pct === 100 ? <><RotateCcw className="size-4" /> Review</> : p.pct === 0 ? "Start" : "Continue"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
