import { useMemo, useState } from "react";
import { Copy, KeyRound, Search, Trash2, Users } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useEnrollments, useLearners, useOrgs } from "@/api/hooks";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Avatar, Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/ui/Misc";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { User } from "@/api/types";

export default function Learners() {
  const toast = useToast();
  const { data: learners, isLoading } = useLearners();
  const { data: orgs } = useOrgs();
  const { data: enrollments } = useEnrollments();
  const [q, setQ] = useState("");
  const [orgId, setOrgId] = useState("");
  const [deleting, setDeleting] = useState<User | null>(null);
  const [reset, setReset] = useState<{ user: User; password: string } | null>(null);

  const remove = useApiMutation((id: string) => api.learners.remove(id), [qk.learners, qk.enrollments]);
  const resetPw = useApiMutation((u: User) => api.learners.resetPassword(u.id).then((password) => ({ user: u, password })), []);

  const rows = useMemo(
    () =>
      (learners ?? []).filter(
        (l) => (!orgId || l.orgId === orgId) && (!q || `${l.name} ${l.email}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [learners, q, orgId],
  );

  return (
    <>
      <PageHeader title="Learners" description="Everyone who has been enrolled across your organizations." actions={<LinkButton to="/admin/enrollments/new">Enroll learners</LinkButton>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-9" aria-label="Search learners" />
        </div>
        <Select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-56" aria-label="Filter by organization">
          <option value="">All organizations</option>
          {orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={<Users />} title="No learners found" body={learners?.length ? "Try adjusting your filters." : "Upload a learner list to create accounts and enroll them."} /></Card>
      ) : (
        <Table>
          <THead><tr><Th>Learner</Th><Th>Organization</Th><Th>Courses</Th><Th>Joined</Th><Th className="w-24" /></tr></THead>
          <TBody>
            {rows.map((l) => (
              <Tr key={l.id}>
                <Td><div className="flex items-center gap-3"><Avatar name={l.name} /><div className="min-w-0"><p className="truncate font-medium text-ink-900">{l.name}</p><p className="truncate text-xs text-ink-500">{l.email}</p></div></div></Td>
                <Td>{orgs?.find((o) => o.id === l.orgId)?.name ?? "—"}</Td>
                <Td><Badge>{enrollments?.filter((e) => e.userId === l.id).length ?? 0} courses</Badge></Td>
                <Td className="whitespace-nowrap text-ink-500">{formatDate(l.createdAt)}</Td>
                <Td>
                  <div className="flex justify-end gap-0.5">
                    <button title="Reset password" aria-label="Reset password" onClick={async () => setReset(await resetPw.mutateAsync(l))} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><KeyRound className="size-4" /></button>
                    <button title="Remove learner" aria-label="Remove learner" onClick={() => setDeleting(l)} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove learner?"
        body={`${deleting?.name}'s account, enrollments and progress will be permanently deleted.`}
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          setDeleting(null);
          toast.success("Learner removed");
        }}
      />

      <Modal open={!!reset} onClose={() => setReset(null)} title="Password reset" description={reset?.user.name} footer={<Button onClick={() => setReset(null)}>Done</Button>}>
        <p className="text-sm text-ink-600">Share this temporary password with the learner securely. It won't be shown again.</p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 ring-1 ring-ink-200">
          <code className="font-mono text-base font-semibold text-ink-900">{reset?.password}</code>
          <button onClick={() => { navigator.clipboard?.writeText(reset!.password); toast.success("Copied"); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"><Copy className="size-4" /> Copy</button>
        </div>
      </Modal>
    </>
  );
}
