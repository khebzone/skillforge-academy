import { useMemo, useState } from "react";
import { ClipboardList, Download, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/api";
import { qk, useAllProgress, useApiMutation, useCourses, useEnrollments, useLearners, useOrgs } from "@/api/hooks";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Avatar, Badge, Card, EmptyState, PageHeader, ProgressBar, Spinner } from "@/components/ui/Misc";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { buildProgressIndex, statusOf } from "@/lib/analytics";
import { toCsv } from "@/lib/csv";
import { downloadFile, formatDate } from "@/lib/utils";
import type { Enrollment } from "@/api/types";

export default function Enrollments() {
  const toast = useToast();
  const { data: enrollments, isLoading } = useEnrollments();
  const { data: courses } = useCourses();
  const { data: orgs } = useOrgs();
  const { data: learners } = useLearners();
  const { data: progress } = useAllProgress();
  const [q, setQ] = useState("");
  const [orgId, setOrgId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState<Enrollment | null>(null);
  const remove = useApiMutation((id: string) => api.enrollments.remove(id), [qk.enrollments, qk.allProgress]);

  const rows = useMemo(() => {
    if (!enrollments || !courses || !learners || !progress) return [];
    const of = buildProgressIndex(courses, progress);
    return enrollments
      .map((e) => ({
        e,
        user: learners.find((l) => l.id === e.userId),
        course: courses.find((c) => c.id === e.courseId),
        org: orgs?.find((o) => o.id === e.orgId),
        p: of(e),
      }))
      .filter(
        (r) =>
          r.user && r.course &&
          (!orgId || r.e.orgId === orgId) &&
          (!courseId || r.e.courseId === courseId) &&
          (!status || statusOf(r.p.pct) === status) &&
          (!q || `${r.user.name} ${r.user.email}`.toLowerCase().includes(q.toLowerCase())),
      )
      .sort((a, b) => b.e.enrolledAt.localeCompare(a.e.enrolledAt));
  }, [enrollments, courses, learners, progress, orgs, q, orgId, courseId, status]);

  const exportCsv = () => {
    downloadFile(
      "enrollments.csv",
      toCsv(rows.map((r) => ({ Name: r.user!.name, Email: r.user!.email, Organization: r.org?.name ?? "", Course: r.course!.title, "Progress %": r.p.pct, Status: statusOf(r.p.pct), Enrolled: formatDate(r.e.enrolledAt), Due: formatDate(r.e.dueDate) }))),
    );
  };

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Who is enrolled in what — and how far along they are."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}><Download className="size-4" /> Export CSV</Button>
            <LinkButton to="/admin/enrollments/new"><Plus className="size-4" /> Enroll learners</LinkButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search learner" className="pl-9" aria-label="Search learner" />
        </div>
        <Select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-48" aria-label="Organization"><option value="">All organizations</option>{orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-56" aria-label="Course"><option value="">All courses</option>{courses?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" aria-label="Status"><option value="">Any status</option><option>Not started</option><option>In progress</option><option>Completed</option></Select>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={<ClipboardList />} title="No enrollments found" body={enrollments?.length ? "Try adjusting your filters." : "Upload an organization's learner list to enroll them in a course."} action={!enrollments?.length ? <LinkButton to="/admin/enrollments/new">Enroll learners</LinkButton> : undefined} /></Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-500">{rows.length} enrollment{rows.length === 1 ? "" : "s"}</p>
          <Table>
            <THead><tr><Th>Learner</Th><Th>Course</Th><Th>Progress</Th><Th>Enrolled</Th><Th>Due</Th><Th className="w-12" /></tr></THead>
            <TBody>
              {rows.map(({ e, user, course, org, p }) => (
                <Tr key={e.id}>
                  <Td><div className="flex items-center gap-3"><Avatar name={user!.name} /><div className="min-w-0"><p className="truncate font-medium text-ink-900">{user!.name}</p><p className="truncate text-xs text-ink-500">{org?.name}</p></div></div></Td>
                  <Td className="max-w-64"><span className="line-clamp-2">{course!.title}</span></Td>
                  <Td className="w-52">
                    <div className="flex items-center gap-3"><ProgressBar value={p.pct} /><span className="w-9 text-right text-xs font-semibold tabular-nums">{p.pct}%</span></div>
                    <Badge tone={p.pct === 100 ? "green" : p.pct > 0 ? "sky" : "gray"} className="mt-1.5">{statusOf(p.pct)}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-500">{formatDate(e.enrolledAt)}</Td>
                  <Td className="whitespace-nowrap text-ink-500">{formatDate(e.dueDate)}</Td>
                  <Td><button aria-label="Remove enrollment" title="Remove enrollment" onClick={() => setDeleting(e)} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove enrollment?"
        body="The learner will lose access to this course and their progress in it will be deleted."
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          setDeleting(null);
          toast.success("Enrollment removed");
        }}
      />
    </>
  );
}
