import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Misc";

/** Lightweight table primitives so every list in the product looks identical. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
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
