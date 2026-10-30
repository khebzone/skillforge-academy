import { useState } from "react";
import { Link } from "react-router";
import { Building2, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useEnrollments, useLearners, useOrgs } from "@/api/hooks";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { OrgType, Organization } from "@/api/types";

export const orgTypeLabel = (t: OrgType) => (t === "corporate" ? "Corporate" : "University");

export function OrgIcon({ type, className }: { type: OrgType; className?: string }) {
  return type === "corporate" ? <Building2 className={className} /> : <Landmark className={className} />;
}

export default function Organizations() {
  const toast = useToast();
  const { data: orgs, isLoading } = useOrgs();
  const { data: learners } = useLearners();
  const { data: enrollments } = useEnrollments();
  const [editing, setEditing] = useState<Partial<Organization> | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  const save = useApiMutation((o: Partial<Organization> & Pick<Organization, "name" | "type">) => api.orgs.save(o), [qk.orgs]);
  const remove = useApiMutation((id: string) => api.orgs.remove(id), [qk.orgs, qk.learners, qk.enrollments]);

  return (
    <>
      <PageHeader
        title="Organizations"
        description="The corporates and universities you deliver courses to."
        actions={<Button onClick={() => setEditing({ type: "corporate" })}><Plus className="size-4" /> Add organization</Button>}
      />

      {isLoading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : !orgs?.length ? (
        <Card><EmptyState icon={<Building2 />} title="No organizations yet" body="Add a corporate or university customer to start enrolling their people." action={<Button onClick={() => setEditing({ type: "corporate" })}><Plus className="size-4" /> Add organization</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {orgs.map((o) => {
            const members = learners?.filter((l) => l.orgId === o.id).length ?? 0;
            const enr = enrollments?.filter((e) => e.orgId === o.id).length ?? 0;
            return (
              <Card key={o.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/admin/organizations/${o.id}`} className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><OrgIcon type={o.type} className="size-5" /></span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink-900 hover:text-brand-700">{o.name}</span>
                      <Badge tone={o.type === "corporate" ? "sky" : "brand"} className="mt-1">{orgTypeLabel(o.type)}</Badge>
                    </span>
                  </Link>
                  <div className="flex shrink-0 gap-0.5">
                    <button onClick={() => setEditing(o)} aria-label="Edit" className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><Pencil className="size-4" /></button>
                    <button onClick={() => setDeleting(o)} aria-label="Delete" className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-4">
                  <div><dt className="text-xs text-ink-500">Learners</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink-900">{members}</dd></div>
                  <div><dt className="text-xs text-ink-500">Enrollments</dt><dd className="mt-0.5 text-xl font-semibold tabular-nums text-ink-900">{enr}</dd></div>
                </dl>
                <p className="mt-4 truncate text-xs text-ink-500">{o.contactName ? `${o.contactName} · ` : ""}{o.contactEmail || "No contact"}{o.contactPhone ? ` · ${o.contactPhone}` : ""} · Since {formatDate(o.createdAt, { month: "short", year: "numeric" })}</p>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <OrgModal
          org={editing}
          loading={save.isPending}
          onClose={() => setEditing(null)}
          onSave={async (o) => {
            await save.mutateAsync(o);
            toast.success(o.id ? "Organization updated" : "Organization added");
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete organization?"
        body={`"${deleting?.name}", all of its learner accounts, enrollments and progress will be permanently removed.`}
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(deleting!.id);
          setDeleting(null);
          toast.success("Organization deleted");
        }}
      />
    </>
  );
}

function OrgModal({ org, onSave, onClose, loading }: { org: Partial<Organization>; onSave: (o: Partial<Organization> & Pick<Organization, "name" | "type">) => void; onClose: () => void; loading: boolean }) {
  const [f, setF] = useState({ name: org.name ?? "", type: (org.type ?? "corporate") as OrgType, contactName: org.contactName ?? "", contactEmail: org.contactEmail ?? "", contactPhone: org.contactPhone ?? "" });
  return (
    <Modal
      open
      onClose={onClose}
      title={org.id ? "Edit organization" : "Add organization"}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="org-form" loading={loading}>{org.id ? "Save changes" : "Add organization"}</Button></>}
    >
      <form id="org-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ ...org, ...f }); }}>
        <Field label="Organization name"><Input required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Type">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as OrgType })}>
            <option value="corporate">Corporate</option>
            <option value="university">University</option>
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact person"><Input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
          <Field label="Contact email"><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label="Mobile number" className="sm:col-span-2"><Input type="tel" value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} placeholder="+91 98765 43210" /></Field>
        </div>
      </form>
    </Modal>
  );
}

