import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Award, BookOpen, Building2, ClipboardList, Inbox, Plus, Users } from "lucide-react";
import { useAllProgress, useCourses, useEnrollments, useLearners, useOrgs, useRequests } from "@/api/hooks";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card, PageHeader, ProgressBar, Spinner, StatCard } from "@/components/ui/Misc";
import { buildProgressIndex } from "@/lib/analytics";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { data: courses } = useCourses();
  const { data: orgs } = useOrgs();
  const { data: learners } = useLearners();
  const { data: enrollments } = useEnrollments();
  const { data: progress } = useAllProgress();
  const { data: requests } = useRequests();

  const stats = useMemo(() => {
    if (!courses || !enrollments || !progress) return null;
    const of = buildProgressIndex(courses, progress);
    const rows = enrollments.map((e) => ({ e, p: of(e) }));
    const completed = rows.filter((r) => r.p.pct === 100).length;
    const perCourse = courses
      .filter((c) => c.status === "published")
      .map((c) => {
        const r = rows.filter((x) => x.e.courseId === c.id);
        return {
          course: c,
          enrolled: r.length,
          completed: r.filter((x) => x.p.pct === 100).length,
          avg: r.length ? Math.round(r.reduce((n, x) => n + x.p.pct, 0) / r.length) : 0,
        };
      })
      .sort((a, b) => b.enrolled - a.enrolled);
    const perOrg = (orgs ?? []).map((o) => ({ org: o, count: enrollments.filter((e) => e.orgId === o.id).length })).sort((a, b) => b.count - a.count);
    return { total: rows.length, completed, rate: rows.length ? Math.round((completed / rows.length) * 100) : 0, perCourse, perOrg };
  }, [courses, enrollments, progress, orgs]);

  if (!stats || !learners || !requests) return <div className="grid place-items-center py-32"><Spinner /></div>;

  const pending = requests.filter((r) => r.status === "new");
  const published = courses!.filter((c) => c.status === "published").length;
  const maxOrg = Math.max(1, ...stats.perOrg.map((o) => o.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your catalog, customers and learner progress."
        actions={
          <>
            <LinkButton to="/admin/courses" variant="secondary"><Plus className="size-4" /> New course</LinkButton>
            <LinkButton to="/admin/enrollments/new"><ClipboardList className="size-4" /> Enroll learners</LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Published courses" value={published} hint={`${courses!.length - published} in draft`} icon={<BookOpen />} />
        <StatCard label="Organizations" value={orgs?.length ?? 0} icon={<Building2 />} tone="sky" />
        <StatCard label="Learners" value={learners.length} icon={<Users />} tone="amber" />
        <StatCard label="Enrollments" value={stats.total} hint={`${stats.completed} completed`} icon={<ClipboardList />} />
        <StatCard label="Completion rate" value={`${stats.rate}%`} icon={<Award />} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-ink-900">Course performance</h2>
            <Link to="/admin/courses" className="text-xs font-semibold text-brand-700 hover:underline">All courses</Link>
          </div>
          <ul className="divide-y divide-ink-100">
            {stats.perCourse.map(({ course, enrolled, completed, avg }) => (
              <li key={course.id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[1fr_90px_160px]">
                <div className="min-w-0">
                  <Link to={`/admin/courses/${course.id}`} className="block truncate text-sm font-medium text-ink-900 hover:text-brand-700">{course.title}</Link>
                  <p className="text-xs text-ink-500">{course.category}</p>
                </div>
                <div className="text-right text-sm sm:text-left">
                  <span className="font-semibold tabular-nums text-ink-900">{enrolled}</span>
                  <span className="text-ink-500"> enrolled</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="mb-1.5 flex justify-between text-xs"><span className="text-ink-500">Avg. progress</span><span className="font-semibold tabular-nums text-ink-700">{avg}%</span></div>
                  <ProgressBar value={avg} />
                  <p className="mt-1 text-[11px] text-ink-400">{completed} completed</p>
                </div>
              </li>
            ))}
            {stats.perCourse.length === 0 && <li className="px-5 py-10 text-center text-sm text-ink-500">No published courses yet.</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                Course requests {pending.length > 0 && <Badge tone="brand">{pending.length} new</Badge>}
              </h2>
              <Link to="/admin/requests" className="text-xs font-semibold text-brand-700 hover:underline">View all</Link>
            </div>
            {pending.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-8 text-sm text-ink-500"><Inbox className="size-4" /> No new requests.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {pending.slice(0, 3).map((r) => (
                  <li key={r.id} className="px-5 py-3.5">
                    <p className="text-sm font-medium text-ink-900">{r.orgName}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {courses!.find((c) => c.id === r.courseId)?.title} · {r.learnerCount} learners · {formatDate(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-sm font-semibold text-ink-900">Enrollments by organization</h2></div>
            <ul className="space-y-4 px-5 py-4">
              {stats.perOrg.map(({ org, count }) => (
                <li key={org.id}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <Link to={`/admin/organizations/${org.id}`} className="font-medium text-ink-800 hover:text-brand-700">{org.name}</Link>
                    <span className="tabular-nums text-ink-600">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / maxOrg) * 100}%` }} /></div>
                </li>
              ))}
              {stats.perOrg.length === 0 && <li className="py-4 text-center text-sm text-ink-500">No organizations yet.</li>}
            </ul>
            <div className="border-t border-ink-100 px-5 py-3">
              <Link to="/admin/organizations" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">Manage organizations <ArrowRight className="size-3.5" /></Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
