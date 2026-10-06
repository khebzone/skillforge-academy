import { useState } from "react";
import { Link, useParams } from "react-router";
import { Check, ChevronDown, Clock, Globe, Layers, Send } from "lucide-react";
import { useCourse } from "@/api/hooks";
import { api } from "@/api";
import { CourseCover, LessonTypeIcon } from "@/components/CourseVisuals";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { cn, courseStats, formatDuration, LESSON_LABEL } from "@/lib/utils";
import type { Course } from "@/api/types";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { data: course, isLoading } = useCourse(courseId);
  const [requesting, setRequesting] = useState(false);

  if (isLoading) return <div className="grid place-items-center py-32"><Spinner /></div>;
  if (!course || course.status !== "published")
    return (
      <EmptyState
        icon={<Layers />}
        title="Course not found"
        body="This course may have been unpublished."
        action={<Link to="/catalog" className="text-sm font-semibold text-brand-700 hover:underline">Back to catalog</Link>}
      />
    );

  const s = courseStats(course);

  return (
    <div className="bg-ink-50">
      <section className="bg-ink-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_360px]">
          <div>
            <nav className="text-sm text-ink-400"><Link to="/catalog" className="hover:text-white">Catalog</Link> / {course.category}</nav>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-300">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
              <Badge tone="brand" className="!bg-white/10 !text-brand-200 !ring-white/15">{course.level}</Badge>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{formatDuration(s.minutes)} total</span>
              <span className="inline-flex items-center gap-1.5"><Layers className="size-4" />{s.lessonCount} lessons in {s.sectionCount} modules</span>
              <span className="inline-flex items-center gap-1.5"><Globe className="size-4" />{course.language}</span>
            </div>
          </div>
          <div className="hidden lg:block" />
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-ink-900">What learners will achieve</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-[15px] text-ink-700"><Check className="mt-0.5 size-[18px] shrink-0 text-emerald-600" />{o}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold text-ink-900">About this course</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{course.description}</p>
          </Card>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Curriculum</h2>
            <Curriculum course={course} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:-mt-48 lg:self-start">
          <Card className="overflow-hidden shadow-pop">
            <CourseCover course={course} />
            <div className="p-6">
              <p className="text-sm text-ink-500">Interested in this course for your organization?</p>
              <Button size="lg" className="mt-4 w-full" onClick={() => setRequesting(true)}>
                <Send className="size-4" /> Request this course
              </Button>
              <p className="mt-3 text-center text-xs text-ink-500">Share your learner list and we'll enroll everyone.</p>
              <dl className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-sm">
                {[
                  ["Videos", s.videos],
                  ["Documents (PDF)", s.pdfs],
                  ["Presentations", s.ppts],
                  ["Certificate", "On completion"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-ink-500">{k}</dt><dd className="font-medium text-ink-800">{v}</dd></div>
                ))}
              </dl>
            </div>
          </Card>
        </aside>
      </div>

      <RequestModal course={course} open={requesting} onClose={() => setRequesting(false)} />
    </div>
  );
}

function Curriculum({ course }: { course: Course }) {
  const [open, setOpen] = useState<Set<string>>(new Set([course.sections[0]?.id ?? ""]));
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <Card className="divide-y divide-ink-100 overflow-hidden">
      {course.sections.map((sec, i) => {
        const isOpen = open.has(sec.id);
        const mins = sec.lessons.reduce((n, l) => n + l.durationMin, 0);
        return (
          <div key={sec.id}>
            <button onClick={() => toggle(sec.id)} className="flex w-full items-center gap-3 bg-ink-50/60 px-5 py-4 text-left hover:bg-ink-50" aria-expanded={isOpen}>
              <ChevronDown className={cn("size-4 text-ink-400 transition-transform", isOpen && "rotate-180")} />
              <span className="flex-1 text-[15px] font-semibold text-ink-900">Module {i + 1}: {sec.title}</span>
              <span className="text-xs text-ink-500">{sec.lessons.length} lessons · {formatDuration(mins)}</span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-ink-100">
                {sec.lessons.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3 pl-12 text-sm">
                    <LessonTypeIcon type={l.type} className="text-ink-400" />
                    <span className="flex-1 text-ink-700">{l.title}</span>
                    <span className="hidden text-xs text-ink-400 sm:block">{LESSON_LABEL[l.type]}</span>
                    <span className="w-12 text-right text-xs tabular-nums text-ink-500">{formatDuration(l.durationMin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function RequestModal({ course, open, onClose }: { course: Course; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ orgName: "", contactName: "", contactEmail: "", learnerCount: "", message: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.requests.create({ courseId: course.id, ...f, learnerCount: Number(f.learnerCount) || 0 });
      setDone(true);
    } catch {
      toast.error("Could not send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setF({ orgName: "", contactName: "", contactEmail: "", learnerCount: "", message: "" });
    }, 200);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? "Request sent" : "Request this course"}
      description={done ? undefined : course.title}
      footer={
        done ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" form="request-form" loading={busy}>Send request</Button>
          </>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="size-6" /></div>
          <p className="mt-4 text-sm text-ink-600">Thanks! We'll contact you at <strong>{f.contactEmail}</strong> to collect your learner list and confirm the start date.</p>
        </div>
      ) : (
        <form id="request-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization" className="sm:col-span-2"><Input required value={f.orgName} onChange={set("orgName")} placeholder="e.g. Acme Industries" /></Field>
          <Field label="Your name"><Input required value={f.contactName} onChange={set("contactName")} /></Field>
          <Field label="Work email"><Input required type="email" value={f.contactEmail} onChange={set("contactEmail")} /></Field>
          <Field label="Approx. number of learners" className="sm:col-span-2"><Input required type="number" min={1} value={f.learnerCount} onChange={set("learnerCount")} /></Field>
          <Field label="Message (optional)" className="sm:col-span-2"><Textarea value={f.message} onChange={set("message")} placeholder="Preferred start date, team, any special requirements…" /></Field>
        </form>
      )}
    </Modal>
  );
}
