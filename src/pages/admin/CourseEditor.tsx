import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ExternalLink, FileUp, Link2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useCourse, useEnrollments } from "@/api/hooks";
import { CourseCover, LessonTypeIcon } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Badge, Card, EmptyState, ProgressBar, Spinner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/config";
import { cn, courseStats, formatDuration, LESSON_LABEL, uid } from "@/lib/utils";
import { lessonHasContent, validateForPublish } from "./courseValidation";
import type { Course, Lesson, LessonType, Section } from "@/api/types";

type Tab = "details" | "curriculum";

const move = <T,>(arr: T[], from: number, to: number) => {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  copy.splice(to, 0, copy.splice(from, 1)[0]!);
  return copy;
};

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

/* ------------------------------------------------------------------ */

function DetailsTab({ draft, patch, onDelete }: { draft: Course; patch: (p: Partial<Course>) => void; onDelete: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-5 p-6">
        <Field label="Course title"><Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Leadership Essentials for First-Time Managers" /></Field>
        <Field label="Subtitle" hint="One sentence shown on course cards."><Input value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} maxLength={140} /></Field>
        <Field label="Description"><Textarea rows={6} value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What is this course about and who is it for?" /></Field>
        <Field label="What learners will achieve" hint="One outcome per line."><Textarea rows={5} value={draft.outcomes.join("\n")} onChange={(e) => patch({ outcomes: e.target.value.split("\n") })} onBlur={() => patch({ outcomes: draft.outcomes.map((o) => o.trim()).filter(Boolean) })} /></Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Category"><Select value={draft.category} onChange={(e) => patch({ category: e.target.value })}>{COURSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Level"><Select value={draft.level} onChange={(e) => patch({ level: e.target.value })}>{COURSE_LEVELS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Language"><Input value={draft.language} onChange={(e) => patch({ language: e.target.value })} /></Field>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CourseCover course={draft} />
          <div className="p-5">
            <Field label="Cover colour">
              <input type="range" min={0} max={359} value={draft.hue} onChange={(e) => patch({ hue: Number(e.target.value) })} className="h-2 w-full cursor-pointer appearance-none rounded-full" style={{ background: "linear-gradient(90deg,hsl(0 70% 50%),hsl(60 70% 50%),hsl(120 70% 45%),hsl(180 70% 45%),hsl(240 70% 55%),hsl(300 70% 50%),hsl(360 70% 50%))" }} />
            </Field>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
          <p className="mt-1 text-xs text-ink-500">Deleting removes the course and all learner progress for it.</p>
          <Button variant="secondary" size="sm" className="mt-4 !text-red-600" onClick={onDelete}><Trash2 className="size-4" /> Delete course</Button>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CurriculumTab({ draft, patch }: { draft: Course; patch: (p: Partial<Course>) => void }) {
  const [editing, setEditing] = useState<{ sectionId: string; lesson: Lesson | null } | null>(null);
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);

  const setSections = (fn: (s: Section[]) => Section[]) => patch({ sections: fn(draft.sections) });
  const updateSection = (id: string, p: Partial<Section>) => setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const addSection = () => setSections((ss) => [...ss, { id: uid("s"), title: `Module ${ss.length + 1}`, lessons: [] }]);

  const saveLesson = (sectionId: string, lesson: Lesson) =>
    updateSection(sectionId, {
      lessons: draft.sections.find((s) => s.id === sectionId)!.lessons.some((l) => l.id === lesson.id)
        ? draft.sections.find((s) => s.id === sectionId)!.lessons.map((l) => (l.id === lesson.id ? lesson : l))
        : [...draft.sections.find((s) => s.id === sectionId)!.lessons, lesson],
    });

  return (
    <div className="space-y-5">
      {draft.sections.length === 0 && (
        <Card>
          <EmptyState icon={<Plus />} title="Start building your curriculum" body="Organise the course into modules, then add video, PDF and presentation lessons to each." action={<Button onClick={addSection}><Plus className="size-4" /> Add first module</Button>} />
        </Card>
      )}

      {draft.sections.map((sec, si) => (
        <Card key={sec.id} className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-ink-600 ring-1 ring-ink-200">{si + 1}</span>
            <input
              value={sec.title}
              onChange={(e) => updateSection(sec.id, { title: e.target.value })}
              aria-label="Module title"
              className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-[15px] font-semibold text-ink-900 hover:bg-white focus:bg-white focus:outline-2 focus:outline-brand-600"
            />
            <span className="hidden text-xs text-ink-500 sm:block">{sec.lessons.length} lessons</span>
            <IconBtn label="Move module up" disabled={si === 0} onClick={() => setSections((ss) => move(ss, si, si - 1))}><ArrowUp className="size-4" /></IconBtn>
            <IconBtn label="Move module down" disabled={si === draft.sections.length - 1} onClick={() => setSections((ss) => move(ss, si, si + 1))}><ArrowDown className="size-4" /></IconBtn>
            <IconBtn label="Delete module" danger onClick={() => (sec.lessons.length ? setDeleteSection(sec) : setSections((ss) => ss.filter((x) => x.id !== sec.id)))}><Trash2 className="size-4" /></IconBtn>
          </div>

          {sec.lessons.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-ink-500">No lessons in this module yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {sec.lessons.map((l, li) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", l.type === "video" ? "bg-brand-50 text-brand-600" : l.type === "pdf" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>
                    <LessonTypeIcon type={l.type} className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{l.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                      {LESSON_LABEL[l.type]} · {formatDuration(l.durationMin)}
                      {lessonHasContent(l) ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="size-3.5" />{l.fileName ?? (l.url ? "Linked" : "Uploaded")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600"><AlertCircle className="size-3.5" />No file yet</span>
                      )}
                    </p>
                  </div>
                  <IconBtn label="Move lesson up" disabled={li === 0} onClick={() => updateSection(sec.id, { lessons: move(sec.lessons, li, li - 1) })}><ArrowUp className="size-4" /></IconBtn>
                  <IconBtn label="Move lesson down" disabled={li === sec.lessons.length - 1} onClick={() => updateSection(sec.id, { lessons: move(sec.lessons, li, li + 1) })}><ArrowDown className="size-4" /></IconBtn>
                  <IconBtn label="Edit lesson" onClick={() => setEditing({ sectionId: sec.id, lesson: l })}><Pencil className="size-4" /></IconBtn>
                  <IconBtn label="Delete lesson" danger onClick={() => updateSection(sec.id, { lessons: sec.lessons.filter((x) => x.id !== l.id) })}><Trash2 className="size-4" /></IconBtn>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-ink-100 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing({ sectionId: sec.id, lesson: null })}><Plus className="size-4" /> Add lesson</Button>
          </div>
        </Card>
      ))}

      {draft.sections.length > 0 && <Button variant="secondary" onClick={addSection}><Plus className="size-4" /> Add module</Button>}

      {editing && (
        <LessonModal
          key={editing.lesson?.id ?? "new"}
          lesson={editing.lesson}
          onClose={() => setEditing(null)}
          onSave={(l) => {
            saveLesson(editing.sectionId, l);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteSection}
        onClose={() => setDeleteSection(null)}
        title="Delete this module?"
        body={`"${deleteSection?.title}" and its ${deleteSection?.lessons.length} lessons will be removed from the course.`}
        onConfirm={() => {
          setSections((ss) => ss.filter((x) => x.id !== deleteSection!.id));
          setDeleteSection(null);
        }}
      />
    </div>
  );
}

function IconBtn({ label, children, danger, ...p }: { label: string; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} {...p} className={cn("rounded-md p-1.5 text-ink-400 transition-colors disabled:pointer-events-none disabled:opacity-30", danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-ink-100 hover:text-ink-700")}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

const ACCEPT: Record<LessonType, string> = { video: "video/*", pdf: "application/pdf,.pdf", ppt: ".ppt,.pptx,.pps,.ppsx" };

function probeVideoMinutes(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const url = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.round(v.duration / 60)));
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

function LessonModal({ lesson, onSave, onClose }: { lesson: Lesson | null; onSave: (l: Lesson) => void; onClose: () => void }) {
  const toast = useToast();
  const [l, setL] = useState<Lesson>(lesson ?? { id: uid("l"), title: "", type: "video", durationMin: 0 });
  const [source, setSource] = useState<"upload" | "link">(lesson?.url ? "link" : "upload");
  const [upload, setUpload] = useState<{ target: "main" | "preview"; name: string; pct: number } | null>(null);
  const [showError, setShowError] = useState(false);
  const set = (p: Partial<Lesson>) => setL((x) => ({ ...x, ...p }));

  const changeType = (type: LessonType) => {
    if (type === l.type) return;
    setL((x) => ({ ...x, type, url: undefined, fileKey: undefined, fileName: undefined, previewUrl: undefined, previewFileKey: undefined }));
    setSource("upload");
  };

  const doUpload = async (file: File, target: "main" | "preview") => {
    setUpload({ target, name: file.name, pct: 0 });
    try {
      const key = await api.files.upload(file, (pct) => setUpload((u) => u && { ...u, pct }));
      if (target === "main") {
        const minutes = l.type === "video" ? await probeVideoMinutes(file) : 0;
        setL((x) => ({ ...x, fileKey: key, fileName: file.name, url: undefined, durationMin: minutes || x.durationMin, title: x.title || file.name.replace(/\.[^.]+$/, "") }));
      } else {
        setL((x) => ({ ...x, previewFileKey: key, previewUrl: undefined }));
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUpload(null);
    }
  };

  const valid = l.title.trim() && lessonHasContent(l);
  const submit = () => {
    if (!valid) return setShowError(true);
    onSave({ ...l, title: l.title.trim() });
  };

  const hasMain = !!(l.fileKey || l.url);
  const hasPreview = !!(l.previewFileKey || l.previewUrl);

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={lesson ? "Edit lesson" : "Add lesson"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!!upload}>{lesson ? "Update lesson" : "Add lesson"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-700">Lesson type</span>
          <div className="grid grid-cols-3 gap-2">
            {(["video", "pdf", "ppt"] as const).map((t) => (
              <button key={t} type="button" onClick={() => changeType(t)} className={cn("flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ring-1 ring-inset transition-colors", l.type === t ? "bg-brand-50 text-brand-700 ring-brand-500" : "text-ink-600 ring-ink-200 hover:bg-ink-50")}>
                <LessonTypeIcon type={t} /> {LESSON_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <Field label="Lesson title" error={showError && !l.title.trim() ? "Enter a title" : undefined}>
          <Input value={l.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Running great one-to-ones" autoFocus />
        </Field>

        {l.type === "ppt" ? (
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-700">PDF version for viewing in the browser <span className="font-normal text-ink-400">(recommended)</span></span>
              <FileSlot accept={ACCEPT.pdf} uploading={upload?.target === "preview" ? upload : null} fileName={hasPreview ? (l.previewFileKey ? "PDF uploaded" : "PDF linked") : undefined} hint="Export your slides as PDF (File → Save As → PDF) so learners can view them without PowerPoint." onFile={(f) => doUpload(f, "preview")} onClear={() => set({ previewFileKey: undefined, previewUrl: undefined })} />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-700">Original presentation file <span className="font-normal text-ink-400">(optional)</span></span>
              <FileSlot accept={ACCEPT.ppt} uploading={upload?.target === "main" ? upload : null} fileName={hasMain ? l.fileName ?? "Linked file" : undefined} hint=".ppt or .pptx" onFile={(f) => doUpload(f, "main")} onClear={() => set({ fileKey: undefined, fileName: undefined, url: undefined })} />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-700">{l.type === "video" ? "Video file" : "PDF file"}</span>
              <div className="inline-flex rounded-lg bg-ink-100 p-0.5 text-xs font-medium">
                {([["upload", "Upload", FileUp], ["link", "Paste link", Link2]] as const).map(([k, label, Icon]) => (
                  <button key={k} type="button" onClick={() => setSource(k)} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1", source === k ? "bg-white text-ink-900 shadow-sm" : "text-ink-500")}><Icon className="size-3.5" />{label}</button>
                ))}
              </div>
            </div>
            {source === "upload" ? (
              <FileSlot accept={ACCEPT[l.type]} uploading={upload?.target === "main" ? upload : null} fileName={l.fileKey ? l.fileName : undefined} hint={l.type === "video" ? "MP4 recommended. Duration is detected automatically." : "PDF document"} onFile={(f) => doUpload(f, "main")} onClear={() => set({ fileKey: undefined, fileName: undefined })} />
            ) : (
              <Input value={l.url ?? ""} onChange={(e) => set({ url: e.target.value || undefined, fileKey: undefined, fileName: undefined })} placeholder={l.type === "video" ? "https://…/lesson.mp4" : "https://…/handout.pdf"} />
            )}
          </div>
        )}

        <Field label="Duration (minutes)" hint={l.type === "video" ? undefined : "Estimated time to read or review."} className="max-w-48">
          <Input type="number" min={0} value={l.durationMin || ""} onChange={(e) => set({ durationMin: Number(e.target.value) || 0 })} />
        </Field>

        {showError && !lessonHasContent(l) && <p role="alert" className="text-sm text-red-600">Add a file or link before saving this lesson.</p>}
      </div>
    </Modal>
  );
}

function FileSlot({ accept, uploading, fileName, hint, onFile, onClear }: { accept: string; uploading: { name: string; pct: number } | null; fileName?: string; hint?: string; onFile: (f: File) => void; onClear: () => void }) {
  if (uploading)
    return (
      <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
        <div className="mb-2 flex justify-between text-sm"><span className="truncate font-medium text-ink-800">{uploading.name}</span><span className="tabular-nums text-ink-500">{uploading.pct}%</span></div>
        <ProgressBar value={uploading.pct} />
      </div>
    );
  if (fileName)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">{fileName}</span>
        <button type="button" onClick={onClear} className="text-sm font-medium text-emerald-800 hover:underline">Remove</button>
      </div>
    );
  return <Dropzone accept={accept} onFile={onFile} hint={hint} className="py-7" />;
}
