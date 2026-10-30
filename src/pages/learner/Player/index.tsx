import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Award, Check, CheckCircle2, List, Lock, Maximize2, Minimize2 } from "lucide-react";
import { api } from "@/api";
import { qk, useCourse, useMyEnrollments, useUserProgress } from "@/api/hooks";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/Brand";
import { LessonTypeIcon } from "@/components/CourseVisuals";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge, EmptyState, ProgressBar, Spinner } from "@/components/ui/Misc";
import { allLessons, cn, courseProgress, formatDuration, LESSON_LABEL } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { CurriculumPanel } from "./CurriculumPanel";
import { LessonViewer } from "./LessonViewer";
import type { Lesson, LessonProgress } from "@/api/types";

const THEATER_KEY = "skillforge.theaterMode";

export default function Player() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: course, isLoading: lc } = useCourse(courseId);
  const { data: enrollments, isLoading: le } = useMyEnrollments();
  const { data: progress = [], isLoading: lp } = useUserProgress(user?.id);

  const lessons = useMemo(() => (course ? allLessons(course) : []), [course]);
  const doneIds = useMemo(() => new Set(progress.filter((p) => p.courseId === courseId && p.completedAt).map((p) => p.lessonId)), [progress, courseId]);

  // Theater mode (desktop) widens the video and hides the inline sidebar; a drawer takes over curriculum access.
  const [theater, setTheater] = useState(() => {
    try {
      return localStorage.getItem(THEATER_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleTheater = () =>
    setTheater((t) => {
      const next = !t;
      try {
        localStorage.setItem(THEATER_KEY, next ? "1" : "0");
      } catch {
        /* private browsing / storage blocked — theater mode just won't persist */
      }
      return next;
    });

  if (lc || le || lp) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  const enrolled = enrollments?.some((e) => e.courseId === courseId);
  if (!course || course.status !== "published" || !enrolled) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <EmptyState
          icon={<Lock />}
          title="You don't have access to this course"
          body="This course isn't assigned to your account. Contact your organization's administrator if you think this is a mistake."
          action={<LinkButton to="/learn">Back to my learning</LinkButton>}
        />
      </div>
    );
  }

  if (!lessons.length) return <Navigate to="/learn" replace />;
  const current = lessons.find((l) => l.id === lessonId) ?? lessons.find((l) => !doneIds.has(l.id)) ?? lessons[0]!;
  if (!lessonId || current.id !== lessonId) return <Navigate to={`/learn/${course.id}/${current.id}`} replace />;

  const idx = lessons.findIndex((l) => l.id === current.id);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  const stats = courseProgress(course, progress);
  const isDone = doneIds.has(current.id);

  const save = async (p: Partial<LessonProgress>) => {
    await api.progress.set({ userId: user!.id, courseId: course.id, lessonId: current.id, ...p });
    await qc.invalidateQueries({ queryKey: qk.progress(user!.id) });
  };
  const setComplete = (done: boolean) => save({ completedAt: done ? new Date().toISOString() : undefined });
  const go = (l?: Lesson) => l && navigate(`/learn/${course.id}/${l.id}`);

  const markAndNext = async () => {
    if (!isDone) await setComplete(true);
    if (next) go(next);
  };

  const savedPosition = progress.find((p) => p.lessonId === current.id)?.position ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white">
        <div className={cn("mx-auto flex h-14 w-full items-center gap-2 px-4 sm:gap-3 sm:px-6", theater ? "max-w-[1800px]" : "max-w-[1500px]")}>
          <Link to="/learn" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">My learning</span>
          </Link>
          <div className="hidden sm:block"><Logo to="/learn" /></div>
          <div className="mx-1 hidden h-6 w-px bg-ink-200 sm:block" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{course.title}</h1>

          <div className="mx-1 hidden h-6 w-px bg-ink-200 sm:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Course content"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-sm font-medium text-ink-600 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-100 hover:text-ink-900",
                !theater && "lg:hidden",
              )}
            >
              <List className="size-4" /> <span className="hidden sm:inline">Contents</span>
            </button>
            <button
              onClick={toggleTheater}
              title={theater ? "Exit theater mode" : "Theater mode"}
              aria-label={theater ? "Exit theater mode" : "Theater mode"}
              aria-pressed={theater}
              className="hidden items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-sm font-medium text-ink-600 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-100 hover:text-ink-900 lg:inline-flex"
            >
              {theater ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            {stats.pct === 100 ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-[7px] text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 md:inline-flex">
                <CheckCircle2 className="size-3.5" /> Completed
              </span>
            ) : (
              <div className="hidden w-44 items-center gap-2.5 rounded-full bg-ink-50 py-1.5 pl-3 pr-2.5 ring-1 ring-inset ring-ink-200 md:flex">
                <ProgressBar value={stats.pct} />
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-700">{stats.pct}%</span>
              </div>
            )}
            {stats.pct === 100 && (
              <LinkButton to={`/learn/${course.id}/certificate`} size="sm"><Award className="size-4" /> Certificate</LinkButton>
            )}
          </div>
        </div>
        <div className="h-[2px] w-full bg-ink-100 md:hidden">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
      </header>

      <div className={cn("mx-auto grid w-full flex-1 gap-6 p-4 sm:p-6", theater ? "max-w-[1800px]" : "max-w-[1500px] lg:grid-cols-[1fr_360px]")}>
        <main className="min-w-0">
          <LessonViewer
            key={current.id}
            lesson={current}
            startAt={savedPosition}
            theater={theater}
            onPosition={(s) => save({ position: s })}
            onFinished={() => !isDone && setComplete(true)}
            onAutoNext={next ? () => go(next) : undefined}
            nextTitle={next?.title}
          />

          <div className="mt-5 rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-200/70 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-ink-500">
                  <Badge tone="gray"><LessonTypeIcon type={current.type} className="size-3" />{LESSON_LABEL[current.type]}</Badge>
                  <span>Lesson {idx + 1} of {lessons.length} · {formatDuration(current.durationMin)}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink-900">{current.title}</h2>
              </div>
              <Button variant={isDone ? "secondary" : "primary"} onClick={() => setComplete(!isDone)}>
                {isDone ? <><CheckCircle2 className="size-4 text-emerald-600" /> Completed</> : <><Check className="size-4" /> Mark as complete</>}
              </Button>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
              <Button variant="ghost" disabled={!prev} onClick={() => go(prev)}><ArrowLeft className="size-4" /> Previous</Button>
              {next ? (
                <Button variant={isDone ? "primary" : "secondary"} onClick={markAndNext}>{isDone ? "Next lesson" : "Complete & continue"} <ArrowRight className="size-4" /></Button>
              ) : stats.pct === 100 ? (
                <LinkButton to={`/learn/${course.id}/certificate`}><Award className="size-4" /> Get certificate</LinkButton>
              ) : (
                <Button onClick={() => setComplete(true)} disabled={isDone}><Check className="size-4" /> Finish course</Button>
              )}
            </div>
          </div>

          {stats.pct === 100 && (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <div className="grid size-11 place-items-center rounded-full bg-emerald-600 text-white"><Award className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-900">Course complete — congratulations!</p>
                <p className="text-sm text-emerald-800">You've finished all {stats.total} lessons. Your certificate is ready.</p>
              </div>
              <LinkButton to={`/learn/${course.id}/certificate`}>View certificate</LinkButton>
            </div>
          )}
        </main>

        {!theater && <Sidebar course={course} currentId={current.id} doneIds={doneIds} />}
      </div>

      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Course content" size="lg">
        <div className="-mx-6 -my-5">
          <CurriculumPanel course={course} currentId={current.id} doneIds={doneIds} onNavigate={() => setDrawerOpen(false)} showTitle={false} />
        </div>
      </Modal>
    </div>
  );
}
