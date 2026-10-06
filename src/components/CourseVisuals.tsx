import { Link } from "react-router";
import { Briefcase, Clock, Code2, FileText, MessageSquare, MonitorPlay, Presentation, ShieldCheck, TrendingUp, Users, BookOpen } from "lucide-react";
import type { Course, LessonType } from "@/api/types";
import { cn, courseStats, formatDuration } from "@/lib/utils";
import { Badge } from "./ui/Misc";

const CATEGORY_ICON: Record<string, typeof Users> = {
  "Leadership & Management": Users,
  "Technology & Data": Code2,
  Communication: MessageSquare,
  "Compliance & Safety": ShieldCheck,
  "Sales & Marketing": TrendingUp,
  "Career Skills": Briefcase,
};

export function CourseCover({ course, className, fill = false }: { course: Pick<Course, "hue" | "category" | "title">; className?: string; fill?: boolean }) {
  const Icon = CATEGORY_ICON[course.category] ?? BookOpen;
  const h = course.hue;
  return (
    <div
      className={cn("relative overflow-hidden", fill ? "size-full" : "aspect-[16/9]", className)}
      style={{ background: `linear-gradient(135deg, hsl(${h} 70% 30%), hsl(${(h + 45) % 360} 75% 52%))` }}
      aria-hidden
    >
      <svg className="absolute inset-0 size-full opacity-[0.14]" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`g-${h}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="white" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="160" height="90" fill={`url(#g-${h})`} />
        <circle cx="130" cy="18" r="34" fill="none" stroke="white" strokeWidth="0.6" />
        <circle cx="130" cy="18" r="22" fill="none" stroke="white" strokeWidth="0.6" />
      </svg>
      <div className="absolute -bottom-3 -right-2 text-white/15">
        <Icon className="size-28" strokeWidth={1.2} />
      </div>
      <div className="absolute left-4 top-4 grid size-9 place-items-center rounded-lg bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
        <Icon className="size-[18px]" />
      </div>
    </div>
  );
}

export const LESSON_ICON: Record<LessonType, typeof MonitorPlay> = {
  video: MonitorPlay,
  pdf: FileText,
  ppt: Presentation,
};

export function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const Icon = LESSON_ICON[type];
  return <Icon className={cn("size-4", className)} />;
}

export function CourseMeta({ course, className }: { course: Course; className?: string }) {
  const s = courseStats(course);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500", className)}>
      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatDuration(s.minutes)}</span>
      <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" />{s.lessonCount} lessons</span>
    </div>
  );
}

export function CourseCard({ course, to }: { course: Course; to: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200/70 transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <CourseCover course={course} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-2">
          <Badge tone="brand">{course.category}</Badge>
          <span className="text-xs text-ink-500">{course.level}</span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{course.subtitle}</p>
        <CourseMeta course={course} className="mt-auto pt-4" />
      </div>
    </Link>
  );
}
