import { useEffect, useRef, useState, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Misc";

/**
 * Lightweight table primitives so every list in the product looks identical.
 * On narrow screens the table scrolls horizontally; edge fades show up only
 * when there's actually more to scroll to, so mobile users know to swipe.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">
        <div ref={scrollRef} className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
        </div>
        {!atStart && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />}
        {!atEnd && <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />}
      </div>
    </Card>
  );
}

export const THead = ({ children }: { children: ReactNode }) => (
  <thead className="border-b border-ink-200 bg-ink-50/70 text-xs font-medium uppercase tracking-wide text-ink-500">{children}</thead>
);

export const Th = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("px-4 py-3 font-medium first:pl-5 last:pr-5", className)} {...p} />
);

export const TBody = ({ children }: { children: ReactNode }) => <tbody className="divide-y divide-ink-100">{children}</tbody>;

export const Td = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3.5 align-middle text-ink-700 first:pl-5 last:pr-5", className)} {...p} />
);

export const Tr = ({ className, children }: { className?: string; children: ReactNode }) => (
  <tr className={cn("transition-colors hover:bg-ink-50/60", className)}>{children}</tr>
);
