import { useRef, useState, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  onFile,
  title = "Drag a file here, or click to browse",
  hint,
  icon,
  className,
}: {
  accept?: string;
  onFile: (file: File) => void;
  title?: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-2 focus-visible:outline-brand-600",
        over ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-ink-50/50 hover:border-brand-400 hover:bg-brand-50/50",
        className,
      )}
    >
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-white text-brand-600 shadow-card ring-1 ring-ink-200 [&>svg]:size-5">
        {icon ?? <UploadCloud />}
      </div>
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
