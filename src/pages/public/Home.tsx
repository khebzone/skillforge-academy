import { Link } from "react-router";
import { ArrowRight, Award, BarChart3, CheckCircle2, FileSpreadsheet, FileText, Layers, MonitorPlay, Presentation, ShieldCheck, Upload, Users } from "lucide-react";
import { useCourses } from "@/api/hooks";
import { CourseCard } from "@/components/CourseVisuals";
import { LinkButton } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Misc";
import { COURSE_CATEGORIES } from "@/config";
import { allLessons } from "@/lib/utils";

export default function Home() {
  const { data: courses, isLoading } = useCourses(true);
  const lessonCount = courses?.reduce((n, c) => n + allLessons(c).length, 0) ?? 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 80% at 85% 10%, rgb(99 102 241 / 0.45), transparent 60%), radial-gradient(40% 60% at 0% 100%, rgb(14 165 233 / 0.22), transparent 60%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-200 ring-1 ring-white/15">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Built for corporates and universities
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Expert-led courses, delivered to your whole organization.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              Choose from a curated catalog, send us your employee or student list, and your people can start learning within a day — with video, slides and documents in one place.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton to="/catalog" size="lg">
                Browse the catalog <ArrowRight className="size-4" />
              </LinkButton>
              <Link to="/login" className="inline-flex h-12 items-center rounded-lg px-6 text-[15px] font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/10">
                Learner sign in
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                [courses?.length ?? "–", "Courses"],
                [lessonCount || "–", "Lessons"],
                ["3", "Content formats"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-xs uppercase tracking-wider text-ink-400">{l}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product preview */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="absolute -inset-4 rounded-3xl bg-brand-500/20 blur-2xl" />
            <div className="relative rounded-2xl bg-white p-5 text-ink-800 shadow-pop ring-1 ring-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-ink-500">Continue learning</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900">Leadership Essentials</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">44%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-ink-100"><div className="h-full w-[44%] rounded-full bg-brand-600" /></div>
              <div className="mt-5 aspect-video rounded-xl bg-gradient-to-br from-ink-900 to-brand-800 p-4">
                <div className="flex h-full items-center justify-center"><div className="grid size-14 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur"><MonitorPlay className="size-6 text-white" /></div></div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[["Running great one-to-ones", true, MonitorPlay], ["Feedback frameworks", true, Presentation], ["Delegation that works", false, MonitorPlay], ["Team health assessment", false, FileText]].map(([t, done, Icon]) => {
                  const I = Icon as typeof MonitorPlay;
                  return (
                    <li key={t as string} className="flex items-center gap-3 rounded-lg bg-ink-50 px-3 py-2.5">
                      <CheckCircle2 className={`size-4 ${done ? "text-emerald-500" : "text-ink-300"}`} />
                      <span className="flex-1 text-ink-700">{t as string}</span>
                      <I className="size-4 text-ink-400" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">From request to first lesson in three steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Layers, title: "1. Pick your courses", body: "Browse the catalog and tell us which programmes you want for your teams or cohorts." },
              { icon: Upload, title: "2. Share your list", body: "Send a spreadsheet of employees or students. We enroll everyone and create their accounts." },
              { icon: Award, title: "3. Learners complete", body: "Each learner sees only their assigned courses, learns at their pace and earns a certificate." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-ink-50 p-7 ring-1 ring-ink-200/70">
                <div className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white"><Icon className="size-5" /></div>
                <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-600">Catalog</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">Courses ready to deploy</h2>
            </div>
            <Link to="/catalog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
              View all courses <ArrowRight className="size-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid place-items-center py-20"><Spinner /></div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses?.slice(0, 6).map((c) => <CourseCard key={c.id} course={c} to={`/catalog/${c.id}`} />)}
            </div>
          )}
          <div className="mt-10 flex flex-wrap gap-2">
            {COURSE_CATEGORIES.map((c) => (
              <Link key={c} to={`/catalog?category=${encodeURIComponent(c)}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-600 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-600">Why organizations choose us</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">One platform, one expert instructor, zero overhead</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
              Every course is created and maintained in-house, so quality is consistent and updates are immediate. Your administrators don't need to manage a thing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: MonitorPlay, t: "Video, slides & PDFs", b: "Mixed-format lessons in a distraction-free player." },
              { icon: FileSpreadsheet, t: "Bulk enrollment", b: "Hand over a spreadsheet; we handle the rest." },
              { icon: BarChart3, t: "Progress tracking", b: "Know who has started, who is stuck and who has finished." },
              { icon: ShieldCheck, t: "Private by design", b: "Learners only see the courses assigned to them." },
              { icon: Users, t: "Cohort-ready", b: "Suited to employee onboarding and semester programmes." },
              { icon: Award, t: "Certificates", b: "Automatic certificate on completion for every learner." },
            ].map(({ icon: Icon, t, b }) => (
              <div key={t} className="rounded-xl p-4 ring-1 ring-ink-200/80">
                <Icon className="size-5 text-brand-600" />
                <p className="mt-3 text-sm font-semibold text-ink-900">{t}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to train your team or cohort?</h2>
            <p className="mt-2 text-brand-100">Pick a course and send us a request — we'll take it from there.</p>
          </div>
          <Link to="/catalog" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-brand-700 hover:bg-brand-50">
            Explore courses <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
