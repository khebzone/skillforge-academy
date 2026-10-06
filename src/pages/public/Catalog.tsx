import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Search, SearchX } from "lucide-react";
import { useCourses } from "@/api/hooks";
import { CourseCard } from "@/components/CourseVisuals";
import { Input } from "@/components/ui/Form";
import { EmptyState, Spinner } from "@/components/ui/Misc";
import { COURSE_CATEGORIES } from "@/config";
import { cn } from "@/lib/utils";

export default function Catalog() {
  const { data: courses, isLoading } = useCourses(true);
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      (courses ?? []).filter(
        (c) =>
          (!category || c.category === category) &&
          (!q || `${c.title} ${c.subtitle} ${c.category}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [courses, q, category],
  );

  const chip = (active: boolean) =>
    cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors", active ? "bg-ink-900 text-white ring-ink-900" : "bg-white text-ink-600 ring-ink-200 hover:ring-ink-300");

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Course catalog</h1>
          <p className="mt-2 max-w-2xl text-ink-500">Every programme below is available for your employees or students. Open a course to see its full curriculum and request it for your organization.</p>
          <div className="relative mt-6 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => set("q", e.target.value)} placeholder="Search courses…" className="h-11 pl-9" aria-label="Search courses" />
          </div>
          <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
            <button className={chip(!category)} onClick={() => set("category", "")}>All</button>
            {COURSE_CATEGORIES.map((c) => (
              <button key={c} className={chip(category === c)} onClick={() => set("category", c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto min-h-[50vh] max-w-7xl px-5 py-10 sm:px-8">
        {isLoading ? (
          <div className="grid place-items-center py-24"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<SearchX />} title="No courses found" body="Try a different search term or clear the category filter." />
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-500">{filtered.length} {filtered.length === 1 ? "course" : "courses"}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => <CourseCard key={c.id} course={c} to={`/catalog/${c.id}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
