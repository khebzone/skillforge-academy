import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileWarning, Maximize2, PlayCircle } from "lucide-react";
import { api } from "@/api";
import { EmptyState, Spinner } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/api/types";

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

export function LessonViewer({
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
