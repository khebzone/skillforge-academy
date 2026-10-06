import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/api";
import { qk, useApiMutation, useCourses, useEnrollments } from "@/api/hooks";
import { CourseCover } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "@/components/ui/Misc";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { courseStats, formatDate, formatDuration } from "@/lib/utils";
import { validateForPublish } from "./courseValidation";
import type { Course } from "@/api/types";

export default function Courses() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: courses, isLoading } = useCourses();
  const { data: enrollments } = useEnrollments();
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const create = useApiMutation(() => api.courses.create(), [qk.courses]);
  const remove = useApiMutation((id: string) => api.courses.remove(id), [qk.courses, qk.enrollments]);
  const setStatus = useApiMutation(({ id, status }: { id: string; status: Course["status"] }) => api.courses.setStatus(id, status), [qk.courses]);

  const newCourse = async () => {
    const c = await create.mutateAsync(undefined);
    navigate(`/admin/courses/${c.id}`);
  };

  const toggle = async (c: Course) => {
    if (c.status === "draft") {
      const problems = validateForPublish(c);
      if (problems.length) {
        toast.error(`Can't publish yet: ${problems[0]}`);
        navigate(`/admin/courses/${c.id}`);
        return;
      }
    }
    await setStatus.mutateAsync({ id: c.id, status: c.status === "published" ? "draft" : "published" });
    toast.success(c.status === "published" ? "Course unpublished" : "Course published");
  };

  return (
    <>
      <PageHeader
        title="Courses"
        description="Create and publish the courses in your catalog."
        actions={<Button onClick={newCourse} loading={create.isPending}><Plus className="size-4" /> New course</Button>}
      />

      {isLoading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : !courses?.length ? (
        <Card><EmptyState icon={<BookOpen />} title="No courses yet" body="Create your first course to start building your catalog." action={<Button onClick={newCourse}><Plus className="size-4" /> New course</Button>} /></Card>
      ) : (
        <Table>
          <THead>
            <tr><Th>Course</Th><Th>Status</Th><Th>Content</Th><Th>Enrolled</Th><Th>Updated</Th><Th className="w-12" /></tr>
          </THead>
          <TBody>
            {courses.map((c) => {
              const s = courseStats(c);
              const enrolled = enrollments?.filter((e) => e.courseId === c.id).length ?? 0;
              return (
                <Tr key={c.id}>
                  <Td>
                    <Link to={`/admin/courses/${c.id}`} className="flex items-center gap-4">
                      <CourseCover course={c} className="hidden w-28 shrink-0 rounded-lg sm:block" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink-900 hover:text-brand-700">{c.title}</span>
                        <span className="text-xs text-ink-500">{c.category} · {c.level}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td><Badge tone={c.status === "published" ? "green" : "amber"}>{c.status === "published" ? "Published" : "Draft"}</Badge></Td>
                  <Td className="whitespace-nowrap text-ink-500">{s.lessonCount} lessons · {formatDuration(s.minutes)}</Td>
                  <Td className="tabular-nums">{enrolled}</Td>
                  <Td className="whitespace-nowrap text-ink-500">{formatDate(c.updatedAt)}</Td>
                  <Td className="relative">
                    <button onClick={() => setMenu(menu === c.id ? null : c.id)} aria-label="Row actions" className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><MoreHorizontal className="size-4" /></button>
                    {menu === c.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                        <div className="absolute right-4 top-11 z-20 w-44 overflow-hidden rounded-lg bg-white py-1 shadow-pop ring-1 ring-ink-200">
                          <Link to={`/admin/courses/${c.id}`} className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"><Pencil className="size-4" /> Edit</Link>
                          <button onClick={() => { setMenu(null); toggle(c); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                            {c.status === "published" ? <><EyeOff className="size-4" /> Unpublish</> : <><Eye className="size-4" /> Publish</>}
                          </button>
                          <button onClick={() => { setMenu(null); setToDelete(c); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="size-4" /> Delete</button>
                        </div>
                      </>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete this course?"
        body={`"${toDelete?.title}" and all enrollments and progress for it will be permanently removed.`}
        loading={remove.isPending}
        onConfirm={async () => {
          await remove.mutateAsync(toDelete!.id);
          setToDelete(null);
          toast.success("Course deleted");
        }}
      />
    </>
  );
}
