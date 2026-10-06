import { Link } from "react-router";
import { GraduationCap } from "lucide-react";
import { BRAND } from "@/config";
import { cn } from "@/lib/utils";

export function Logo({ to = "/", dark = false, className }: { to?: string; dark?: boolean; className?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <GraduationCap className="size-5" />
      </span>
      <span className="leading-none">
        <span className={cn("block text-[15px] font-semibold tracking-tight", dark ? "text-white" : "text-ink-900")}>{BRAND.name}</span>
        <span className={cn("mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em]", dark ? "text-ink-400" : "text-ink-500")}>{BRAND.tagline}</span>
      </span>
    </Link>
  );
}
