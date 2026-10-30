import { Trash2 } from "lucide-react";
import { CourseCover } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Card } from "@/components/ui/Misc";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/config";
import type { Course } from "@/api/types";

export function DetailsTab({ draft, patch, onDelete }: { draft: Course; patch: (p: Partial<Course>) => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-5 p-6">
        <Field label="Course title"><Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Leadership Essentials for First-Time Managers" /></Field>
        <Field label="Subtitle" hint="One sentence shown on course cards."><Input value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} maxLength={140} /></Field>
        <Field label="Description"><Textarea rows={6} value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What is this course about and who is it for?" /></Field>
        <Field label="What learners will achieve" hint="One outcome per line."><Textarea rows={5} value={draft.outcomes.join("\n")} onChange={(e) => patch({ outcomes: e.target.value.split("\n") })} onBlur={() => patch({ outcomes: draft.outcomes.map((o) => o.trim()).filter(Boolean) })} /></Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
