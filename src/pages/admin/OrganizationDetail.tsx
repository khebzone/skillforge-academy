import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Award, ClipboardList, Users } from "lucide-react";
import { useAllProgress, useCourses, useEnrollments, useLearners, useOrgs } from "@/api/hooks";
import { LinkButton } from "@/components/ui/Button";
import { Avatar, Badge, Card, EmptyState, ProgressBar, Spinner, StatCard } from "@/components/ui/Misc";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { buildProgressIndex } from "@/lib/analytics";
import { formatDate } from "@/lib/utils";
import { OrgIcon, orgTypeLabel } from "./Organizations";

export default function OrganizationDetail() {
  const { orgId } = useParams();
  const { data: orgs } = useOrgs();
  const { data: courses } = useCourses();
  const { data: learners } = useLearners();
  const { data: enrollments } = useEnrollments();
  const { data: progress } = useAllProgress();
  const org = orgs?.find((o) => o.id === orgId);

  const data = useMemo(() => {
    if (!org || !courses || !learners || !enrollments || !progress) return null;
    const of = buildProgressIndex(courses, progress);
    const mine = enrollments.filter((e) => e.orgId === org.id).map((e) => ({ e, p: of(e) }));
    const members = learners.filter((l) => l.orgId === org.id).map((l) => {
      const rows = mine.filter((r) => r.e.userId === l.id);
      return { user: l, rows, avg: rows.length ? Math.round(rows.reduce((n, r) => n + r.p.pct, 0) / rows.length) : 0 };
    });
    const byCourse = courses.map((c) => ({ course: c, rows: mine.filter((r) => r.e.courseId === c.id) })).filter((x) => x.rows.length);
    return { mine, members, byCourse, completed: mine.filter((r) => r.p.pct === 100).length };
  }, [org, courses, learners, enrollments, progress]);

  if (!orgs || !data) return <div className="grid place-items-center py-32"><Spinner /></div>;
  if (!org) return <EmptyState icon={<Users />} title="Organization not found" action={<Link to="/admin/organizations" className="text-sm font-semibold text-brand-700">Back</Link>} />;

  return (
    <>
      <Link to="/admin/organizations" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-4" /> Organizations</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-600 text-white"><OrgIcon type={org.type} className="size-7" /></span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{org.name}</h1>
            <p className="mt-0.5 text-sm text-ink-500">{orgTypeLabel(org.type)} · {org.contactName || "No contact"} {org.contactEmail && <>· <a href={`mailto:${org.contactEmail}`} className="text-brand-700 hover:underline">{org.contactEmail}</a></>}{org.contactPhone && <> · <a href={`tel:${org.contactPhone}`} className="text-brand-700 hover:underline">{org.contactPhone}</a></>}</p>
          </div>
        </div>
        <LinkButton to={`/admin/enrollments/new?org=${org.id}`}><ClipboardList className="size-4" /> Enroll learners</LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Learners" value={data.members.length} icon={<Users />} />
        <StatCard label="Enrollments" value={data.mine.length} icon={<ClipboardList />} tone="sky" />
        <StatCard label="Completed" value={data.completed} hint={data.mine.length ? `${Math.round((data.completed / data.mine.length) * 100)}% completion` : undefined} icon={<Award />} tone="green" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-900">Courses assigned</h2>
      {data.byCourse.length === 0 ? (
        <Card><EmptyState icon={<ClipboardList />} title="No enrollments yet" body="Upload this organization's learner list to enroll them in courses." action={<LinkButton to={`/admin/enrollments/new?org=${org.id}`}>Enroll learners</LinkButton>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.byCourse.map(({ course, rows }) => {
            const avg = Math.round(rows.reduce((n, r) => n + r.p.pct, 0) / rows.length);
            return (
              <Card key={course.id} className="p-5">
                <Link to={`/admin/courses/${course.id}`} className="font-medium text-ink-900 hover:text-brand-700">{course.title}</Link>
                <p className="mt-1 text-xs text-ink-500">{rows.length} learners · {rows.filter((r) => r.p.pct === 100).length} completed</p>
                <div className="mt-4 flex items-center gap-3"><ProgressBar value={avg} /><span className="text-xs font-semibold tabular-nums text-ink-700">{avg}%</span></div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink-900">Learners</h2>
      {data.members.length === 0 ? (
        <Card><p className="px-5 py-10 text-center text-sm text-ink-500">No learners yet.</p></Card>
      ) : (
        <Table>
          <THead><tr><Th>Learner</Th><Th>Courses</Th><Th>Avg. progress</Th><Th>Joined</Th></tr></THead>
          <TBody>
            {data.members.map(({ user, rows, avg }) => (
              <Tr key={user.id}>
                <Td><div className="flex items-center gap-3"><Avatar name={user.name} /><div><p className="font-medium text-ink-900">{user.name}</p><p className="text-xs text-ink-500">{user.email}</p></div></div></Td>
                <Td><Badge>{rows.length} enrolled</Badge></Td>
                <Td className="w-56"><div className="flex items-center gap-3"><ProgressBar value={avg} /><span className="w-9 text-right text-xs font-semibold tabular-nums">{avg}%</span></div></Td>
                <Td className="text-ink-500">{formatDate(user.createdAt)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
