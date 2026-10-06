import { Navigate, useParams, Link } from "react-router";
import { ArrowLeft, Download, GraduationCap } from "lucide-react";
import { useCourse, useOrgs, useUserProgress } from "@/api/hooks";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Misc";
import { BRAND } from "@/config";
import { courseProgress, formatDate } from "@/lib/utils";

function certId(userId: string, courseId: string) {
  let h = 0;
  for (const c of userId + courseId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `SF-${h.toString(36).toUpperCase().padStart(7, "0")}`;
}

export default function Certificate() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: progress = [], isLoading: lp } = useUserProgress(user?.id);
  const { data: orgs } = useOrgs();

  if (isLoading || lp) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!course || !user) return <Navigate to="/learn" replace />;
  const stats = courseProgress(course, progress);
  if (stats.pct < 100) return <Navigate to={`/learn/${course.id}`} replace />;

  const completedAt = progress.filter((p) => p.courseId === course.id && p.completedAt).map((p) => p.completedAt!).sort().at(-1);
  const org = orgs?.find((o) => o.id === user.orgId);

  return (
    <div className="min-h-screen bg-ink-100 px-4 py-8 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-4xl items-center justify-between">
        <Link to={`/learn/${course.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"><ArrowLeft className="size-4" /> Back to course</Link>
        <Button onClick={() => window.print()}><Download className="size-4" /> Download / Print</Button>
      </div>

      <div className="mx-auto aspect-[1.414/1] max-w-4xl bg-white p-3 shadow-pop print:max-w-none print:shadow-none">
        <div className="relative flex h-full flex-col items-center justify-between border-[6px] border-brand-700 p-3 sm:p-5">
          <div className="flex h-full w-full flex-col items-center justify-between border border-brand-300 px-6 py-8 text-center sm:px-14">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white"><GraduationCap className="size-5" /></span>
              <span className="text-left leading-none"><span className="block text-lg font-semibold text-ink-900">{BRAND.name}</span><span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-500">{BRAND.tagline}</span></span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">Certificate of completion</p>
              <p className="mt-6 text-sm text-ink-500">This is to certify that</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold text-ink-900 sm:text-5xl">{user.name}</h1>
              {org && <p className="mt-2 text-sm text-ink-500">{org.name}</p>}
              <p className="mt-6 text-sm text-ink-500">has successfully completed the course</p>
              <h2 className="mx-auto mt-3 max-w-xl text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{course.title}</h2>
            </div>

            <div className="grid w-full grid-cols-3 items-end gap-4 text-xs text-ink-500">
              <div className="text-left"><p className="font-semibold text-ink-800">{formatDate(completedAt, { day: "numeric", month: "long", year: "numeric" })}</p><p className="mt-1 border-t border-ink-300 pt-1">Date of completion</p></div>
              <div className="text-center"><p className="font-mono text-ink-700">{certId(user.id, course.id)}</p><p className="mt-1">Certificate ID</p></div>
              <div className="text-right"><p className="font-serif text-lg italic text-ink-800">{BRAND.name}</p><p className="mt-1 border-t border-ink-300 pt-1">Lead Instructor</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
