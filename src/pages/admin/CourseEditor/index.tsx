import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, ExternalLink, Save, X } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useCourse, useEnrollments } from "@/api/hooks";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge, EmptyState, Spinner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { cn, courseStats, formatDuration } from "@/lib/utils";
import { validateForPublish } from "../courseValidation";
import { DetailsTab } from "./DetailsTab";
import { CurriculumTab } from "./CurriculumTab";
import type { Course } from "@/api/types";

type Tab = "details" | "curriculum";

export default function CourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: saved, isLoading } = useCourse(courseId);
  const { data: enrollments } = useEnrollments();
  const [draft, setDraft] = useState<Course | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [showProblems, setShowProblems] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (saved && !draft) setDraft(saved);
  }, [saved, draft]);

  const save = useApiMutation((c: Course) => api.courses.save(c), [qk.courses]);
  const setStatus = useApiMutation(({ id, status }: { id: string; status: Course["status"] }) => api.courses.setStatus(id, status), [qk.courses]);
  const remove = useApiMutation((id: string) => api.courses.remove(id), [qk.courses, qk.enrollments]);

  const dirty = useMemo(() => !!(draft && saved && JSON.stringify({ ...draft, updatedAt: 0 }) !== JSON.stringify({ ...saved, updatedAt: 0 })), [draft, saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (isLoading || (saved && !draft)) return <div className="grid place-items-center py-32"><Spinner /></div>;
  if (!saved || !draft) return <EmptyState icon={<AlertCircle />} title="Course not found" action={<Link to="/admin/courses" className="text-sm font-semibold text-brand-700">Back to courses</Link>} />;

  const patch = (p: Partial<Course>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const problems = validateForPublish(draft);
  const enrolled = enrollments?.filter((e) => e.courseId === draft.id).length ?? 0;
  const s = courseStats(draft);

  const doSave = async () => {
    await save.mutateAsync(draft);
    toast.success("Changes saved");
  };

  const togglePublish = async () => {
    if (draft.status === "draft") {
      if (problems.length) {
        setShowProblems(true);
        setTab(problems.some((p) => /lesson|module/i.test(p)) ? "curriculum" : "details");
        return;
      }
      if (dirty) await save.mutateAsync(draft);
      await setStatus.mutateAsync({ id: draft.id, status: "published" });
      setDraft((d) => d && { ...d, status: "published" });
      toast.success("Course published — it's now visible in the catalog");
    } else {
      await setStatus.mutateAsync({ id: draft.id, status: "draft" });
      setDraft((d) => d && { ...d, status: "draft" });
      toast.success("Course moved back to draft");
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link to="/admin/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-4" /> Courses</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-ink-900">{draft.title || "Untitled course"}</h1>
              <Badge tone={draft.status === "published" ? "green" : "amber"}>{draft.status === "published" ? "Published" : "Draft"}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-500">{s.lessonCount} lessons · {formatDuration(s.minutes)} · {enrolled} enrolled</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="mr-1 text-sm text-amber-600">Unsaved changes</span>}
            {draft.status === "published" && (
              <Link to={`/catalog/${draft.id}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink-600 hover:bg-ink-100"><ExternalLink className="size-4" /> View in catalog</Link>
            )}
            <Button variant="secondary" onClick={doSave} disabled={!dirty} loading={save.isPending}><Save className="size-4" /> Save</Button>
            <Button variant={draft.status === "published" ? "secondary" : "primary"} onClick={togglePublish} loading={setStatus.isPending}>
              {draft.status === "published" ? "Unpublish" : "Publish course"}
            </Button>
          </div>
        </div>
      </div>

      {showProblems && problems.length > 0 && (
        <div role="alert" className="mb-6 flex gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Complete these before publishing</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-amber-800">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <button onClick={() => setShowProblems(false)} aria-label="Dismiss" className="self-start text-amber-700 hover:text-amber-900"><X className="size-4" /></button>
        </div>
      )}

      <div className="mb-6 flex gap-1 border-b border-ink-200">
        {([["details", "Course details"], ["curriculum", "Curriculum"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors", tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800")}
          >
            {label}
            {k === "curriculum" && <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">{s.lessonCount}</span>}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <DetailsTab draft={draft} patch={patch} onDelete={() => setConfirmDelete(true)} />
      ) : (
        <CurriculumTab draft={draft} patch={patch} />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this course?"
        body="The course, its curriculum, all enrollments and learner progress will be permanently removed."
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(draft.id);
          toast.success("Course deleted");
          navigate("/admin/courses");
        }}
      />
    </>
  );
}
