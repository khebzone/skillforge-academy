import { useState, type ButtonHTMLAttributes } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { LessonTypeIcon } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Card, EmptyState } from "@/components/ui/Misc";
import { cn, formatDuration, LESSON_LABEL, move, uid } from "@/lib/utils";
import { lessonHasContent } from "../courseValidation";
import { LessonModal } from "./LessonModal";
import type { Course, Lesson, Section } from "@/api/types";

export function CurriculumTab({ draft, patch }: { draft: Course; patch: (p: Partial<Course>) => void }) {
  const [editing, setEditing] = useState<{ sectionId: string; lesson: Lesson | null } | null>(null);
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);
  const [lessonMenu, setLessonMenu] = useState<string | null>(null);

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
                  <div className="hidden items-center sm:flex">
                    <IconBtn label="Move lesson up" disabled={li === 0} onClick={() => updateSection(sec.id, { lessons: move(sec.lessons, li, li - 1) })}><ArrowUp className="size-4" /></IconBtn>
                    <IconBtn label="Move lesson down" disabled={li === sec.lessons.length - 1} onClick={() => updateSection(sec.id, { lessons: move(sec.lessons, li, li + 1) })}><ArrowDown className="size-4" /></IconBtn>
                    <IconBtn label="Edit lesson" onClick={() => setEditing({ sectionId: sec.id, lesson: l })}><Pencil className="size-4" /></IconBtn>
                    <IconBtn label="Delete lesson" danger onClick={() => updateSection(sec.id, { lessons: sec.lessons.filter((x) => x.id !== l.id) })}><Trash2 className="size-4" /></IconBtn>
                  </div>
                  <div className="relative sm:hidden">
                    <IconBtn label="Lesson actions" onClick={() => setLessonMenu(lessonMenu === l.id ? null : l.id)}><MoreVertical className="size-4" /></IconBtn>
                    {lessonMenu === l.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setLessonMenu(null)} />
                        <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg bg-white py-1 shadow-pop ring-1 ring-ink-200">
                          <button
                            disabled={li === 0}
                            onClick={() => { setLessonMenu(null); updateSection(sec.id, { lessons: move(sec.lessons, li, li - 1) }); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
                          >
                            <ArrowUp className="size-4" /> Move up
                          </button>
                          <button
                            disabled={li === sec.lessons.length - 1}
                            onClick={() => { setLessonMenu(null); updateSection(sec.id, { lessons: move(sec.lessons, li, li + 1) }); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
                          >
                            <ArrowDown className="size-4" /> Move down
                          </button>
                          <button
                            onClick={() => { setLessonMenu(null); setEditing({ sectionId: sec.id, lesson: l }); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <Pencil className="size-4" /> Edit lesson
                          </button>
                          <button
                            onClick={() => { setLessonMenu(null); updateSection(sec.id, { lessons: sec.lessons.filter((x) => x.id !== l.id) }); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" /> Delete lesson
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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

function IconBtn({ label, children, danger, ...p }: { label: string; danger?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} {...p} className={cn("rounded-md p-1.5 text-ink-400 transition-colors disabled:pointer-events-none disabled:opacity-30", danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-ink-100 hover:text-ink-700")}>
      {children}
    </button>
  );
}
