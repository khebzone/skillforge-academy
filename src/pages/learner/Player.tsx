import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Download,
  FileWarning,
  List,
  Lock,
  Maximize2,
  Minimize2,
  PlayCircle,
  Search,
} from "lucide-react";
import { api } from "@/api";
import { qk, useCourse, useMyEnrollments, useUserProgress } from "@/api/hooks";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/Brand";
import { LessonTypeIcon } from "@/components/CourseVisuals";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge, EmptyState, ProgressBar, Spinner } from "@/components/ui/Misc";
import { allLessons, cn, courseProgress, formatDuration, LESSON_LABEL } from "@/lib/utils";
import type { Course, Lesson, LessonProgress } from "@/api/types";

const THEATER_KEY = "skillforge.theaterMode";
const AUTOPLAY_SECONDS = 5;

/** Resolve a lesson file (external URL or an uploaded file key) to a playable URL. */
function useResolvedUrl(url?: string, key?: string) {
  const q = useQuery({
    queryKey: ["file-url", url ?? "", key ?? ""],
    queryFn: () => (key ? api.files.urlFor(key) : Promise.resolve(url ?? "")),
    enabled: !!(url || key),
    staleTime: Infinity,
  });
  return { url: q.data || undefined, loading: q.isLoading, failed: q.isError };
}

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
        <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link to="/learn" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">My learning</span>
          </Link>
          <div className="hidden sm:block"><Logo to="/learn" /></div>
          <div className="mx-1 hidden h-6 w-px bg-ink-200 sm:block" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{course.title}</h1>

          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Course content"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100",
              !theater && "lg:hidden",
            )}
          >
            <List className="size-4" /> <span className="hidden sm:inline">Contents</span>
          </button>
          <button
            onClick={toggleTheater}
            title={theater ? "Exit theater mode" : "Theater mode"}
            aria-pressed={theater}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 lg:inline-flex"
          >
            {theater ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          <div className="hidden w-48 items-center gap-3 md:flex">
            <ProgressBar value={stats.pct} />
            <span className="text-xs font-semibold tabular-nums text-ink-700">{stats.pct}%</span>
          </div>
          {stats.pct === 100 && (
            <LinkButton to={`/learn/${course.id}/certificate`} size="sm"><Award className="size-4" /> Certificate</LinkButton>
          )}
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

function Sidebar({ course, currentId, doneIds }: { course: Course; currentId: string; doneIds: Set<string> }) {
  return (
    <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6.5rem)] lg:self-start lg:overflow-y-auto">
      <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70">
        <CurriculumPanel course={course} currentId={currentId} doneIds={doneIds} />
      </div>
    </aside>
  );
}

/** The actual module/lesson list — shared by the desktop sidebar and the mobile/theater drawer. */
function CurriculumPanel({
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

function LessonViewer({
  lesson,
  startAt,
  theater,
  onPosition,
  onFinished,
  onAutoNext,
  nextTitle,
}: {
  lesson: Lesson;
  startAt: number;
  theater: boolean;
  onPosition: (s: number) => void;
  onFinished: () => void;
  onAutoNext?: () => void;
  nextTitle?: string;
}) {
  if (lesson.type === "video") {
    return <VideoViewer lesson={lesson} startAt={startAt} onPosition={onPosition} onFinished={onFinished} onAutoNext={onAutoNext} nextTitle={nextTitle} />;
  }
  return <DocumentViewer lesson={lesson} theater={theater} />;
}

function VideoViewer({
  lesson,
  startAt,
  onPosition,
  onFinished,
  onAutoNext,
  nextTitle,
}: {
  lesson: Lesson;
  startAt: number;
  onPosition: (s: number) => void;
  onFinished: () => void;
  onAutoNext?: () => void;
  nextTitle?: string;
}) {
  const { url, loading, failed } = useResolvedUrl(lesson.url, lesson.fileKey);
  const ref = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const finished = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const cancelCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(null);
  };
  const startCountdown = () => {
    if (!onAutoNext) return;
    setCountdown(AUTOPLAY_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAutoNext();
          return null;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="overflow-hidden rounded-xl bg-black shadow-card ring-1 ring-ink-900/10">
      <div className="relative aspect-video">
        {loading && <div className="absolute inset-0 grid place-items-center"><Spinner className="text-white/60" /></div>}
        {(failed || (!loading && !url)) && (
          <div className="absolute inset-0 grid place-items-center text-center text-white/80">
            <div><FileWarning className="mx-auto mb-2 size-8" /><p className="text-sm">This video could not be loaded.</p></div>
          </div>
        )}
        {url && (
          <video
            ref={ref}
            src={url}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 size-full"
            onLoadedMetadata={() => {
              if (ref.current && startAt > 5 && startAt < ref.current.duration - 5) ref.current.currentTime = startAt;
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.currentTime - lastSaved.current >= 10) {
                lastSaved.current = v.currentTime;
                onPosition(Math.floor(v.currentTime));
              }
              if (!finished.current && v.duration > 0 && v.currentTime / v.duration >= 0.9) {
                finished.current = true;
                onFinished();
              }
            }}
            onEnded={() => {
              finished.current = true;
              onFinished();
              startCountdown();
            }}
          />
        )}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950/90 px-6 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">Up next</p>
            <p className="max-w-sm text-base font-semibold leading-snug sm:text-lg">{nextTitle}</p>
            <div className="flex items-center gap-3">
              <button onClick={cancelCountdown} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-200 ring-1 ring-inset ring-white/25 hover:bg-white/10">
                Cancel
              </button>
              <button
                onClick={() => {
                  cancelCountdown();
                  onAutoNext?.();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-ink-100"
              >
                <PlayCircle className="size-4" /> Play now ({countdown})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentViewer({ lesson, theater }: { lesson: Lesson; theater: boolean }) {
  // PDFs show directly; presentations show their PDF rendition when available.
  const isPpt = lesson.type === "ppt";
  const view = useResolvedUrl(isPpt ? lesson.previewUrl : lesson.url, isPpt ? lesson.previewFileKey : lesson.fileKey);
  const original = useResolvedUrl(isPpt ? lesson.url : undefined, isPpt ? lesson.fileKey : undefined);

  if (view.loading) return <div className="grid aspect-video place-items-center rounded-xl bg-white ring-1 ring-ink-200"><Spinner /></div>;

  if (!view.url) {
    return (
      <div className="rounded-xl bg-white shadow-card ring-1 ring-ink-200/70">
        <EmptyState
          icon={<FileWarning />}
          title="Preview not available"
          body={original.url ? "This presentation can't be previewed in the browser. Download it to view the slides." : "This file isn't available yet. Please check back soon."}
          action={original.url ? <a href={original.url} download={lesson.fileName} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Download className="size-4" /> Download</a> : undefined}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70">
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
        <span className="truncate text-sm font-medium text-ink-700">{lesson.fileName ?? lesson.title}</span>
        <a href={view.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
          <Maximize2 className="size-3.5" /> Full screen
        </a>
      </div>
      <iframe title={lesson.title} src={`${view.url}#view=FitH`} className={cn("block w-full bg-ink-100", isPpt ? "aspect-video" : theater ? "h-[82vh]" : "h-[72vh]")} />
    </div>
  );
}
