import { useState } from "react";
import { CheckCircle2, FileUp, Link2 } from "lucide-react";
import { api } from "@/api";
import { LessonTypeIcon } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, Input } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { cn, LESSON_LABEL, uid } from "@/lib/utils";
import { lessonHasContent } from "../courseValidation";
import type { Lesson, LessonType } from "@/api/types";

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

export function LessonModal({ lesson, onSave, onClose }: { lesson: Lesson | null; onSave: (l: Lesson) => void; onClose: () => void }) {
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
