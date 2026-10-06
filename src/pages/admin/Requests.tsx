import { Check, ClipboardList, Inbox, Mail, Users } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useCourses, useRequests } from "@/api/hooks";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

export default function Requests() {
  const toast = useToast();
  const { data: requests, isLoading } = useRequests();
  const { data: courses } = useCourses();
  const setStatus = useApiMutation(({ id, status }: { id: string; status: "new" | "handled" }) => api.requests.setStatus(id, status), [qk.requests]);

  return (
    <>
      <PageHeader title="Course requests" description="Requests submitted by organizations from the public catalog." />
      {isLoading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : !requests?.length ? (
        <Card><EmptyState icon={<Inbox />} title="No requests yet" body="When an organization requests a course from the catalog, it will appear here." /></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const course = courses?.find((c) => c.id === r.courseId);
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink-900">{r.orgName}</h3>
                      <Badge tone={r.status === "new" ? "brand" : "gray"}>{r.status === "new" ? "New" : "Handled"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-600">wants <span className="font-medium text-ink-900">{course?.title ?? "a removed course"}</span></p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{r.learnerCount} learners</span>
                      <span>{r.contactName}</span>
                      <a href={`mailto:${r.contactEmail}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline"><Mail className="size-3.5" />{r.contactEmail}</a>
                      <span>{formatDate(r.createdAt)}</span>
                    </p>
                    {r.message && <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">{r.message}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <LinkButton to={`/admin/enrollments/new?course=${r.courseId}`} size="sm" variant="secondary"><ClipboardList className="size-4" /> Enroll learners</LinkButton>
                    <Button
                      size="sm"
                      variant={r.status === "new" ? "primary" : "ghost"}
                      onClick={async () => {
                        await setStatus.mutateAsync({ id: r.id, status: r.status === "new" ? "handled" : "new" });
                        toast.success(r.status === "new" ? "Marked as handled" : "Reopened");
                      }}
                    >
                      {r.status === "new" ? <><Check className="size-4" /> Mark handled</> : "Reopen"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
