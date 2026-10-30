import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Download, FileSpreadsheet, Info, KeyRound, Trash2, UserCheck, UserPlus } from "lucide-react";
import { useCourses, useEnrollments, useImportBulk, useLearners, useOrgs } from "@/api/hooks";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Badge, Card, PageHeader, Spinner } from "@/components/ui/Misc";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { learnerTemplateCsv, parseLearnerList, toCsv } from "@/lib/csv";
import { cn, downloadFile, isEmail } from "@/lib/utils";
import type { ImportResult, LearnerRow } from "@/api/types";

const STEPS = ["Organization & courses", "Learner list", "Review", "Done"];

export default function EnrollWizard() {
  const [params] = useSearchParams();
  const toast = useToast();
  const { data: orgs } = useOrgs();
  const { data: courses } = useCourses();
  const { data: learners } = useLearners();
  const { data: enrollments } = useEnrollments();
  const importBulk = useImportBulk();

  const [step, setStep] = useState(0);
  const [orgId, setOrgId] = useState(params.get("org") ?? "");
  const [courseIds, setCourseIds] = useState<string[]>(params.get("course") ? [params.get("course")!] : []);
  const [dueDate, setDueDate] = useState("");
  const [rows, setRows] = useState<LearnerRow[]>([]);
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const published = useMemo(() => courses?.filter((c) => c.status === "published") ?? [], [courses]);
  const org = orgs?.find((o) => o.id === orgId);

  /** Classify each uploaded row against current data so the admin sees exactly what will happen. */
  const review = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((r, i) => {
      const email = r.email.trim().toLowerCase();
      let issue: string | undefined;
      if (!r.name.trim()) issue = "Missing name";
      else if (!isEmail(email)) issue = "Invalid email";
      else if (seen.has(email)) issue = "Duplicate in file";
      seen.add(email);
      const user = learners?.find((l) => l.email.toLowerCase() === email);
      const already = user ? courseIds.filter((cid) => enrollments?.some((e) => e.userId === user.id && e.courseId === cid)).length : 0;
      return { i, ...r, email, issue, existing: !!user, already };
    });
  }, [rows, learners, enrollments, courseIds]);

  const valid = review.filter((r) => !r.issue);
  const newAccounts = valid.filter((r) => !r.existing).length;
  const newEnrollments = valid.reduce((n, r) => n + (courseIds.length - r.already), 0);

  const loadText = (text: string, name = "") => {
    const parsed = parseLearnerList(text);
    if (!parsed.length) return toast.error("No learners found in that file.");
    setRows(parsed);
    setFileName(name);
  };

  const submit = async () => {
    try {
      const res = await importBulk.mutateAsync({ orgId, courseIds, rows: valid.map(({ name, email }) => ({ name, email })), dueDate: dueDate ? new Date(dueDate).toISOString() : undefined });
      setResult(res);
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    }
  };

  const reset = () => {
    setStep(0);
    setRows([]);
    setPaste("");
    setFileName("");
    setResult(null);
    setCourseIds([]);
  };

  if (!orgs || !courses || !learners || !enrollments) return <div className="grid place-items-center py-32"><Spinner /></div>;

  return (
    <>
      <Link to="/admin/enrollments" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-4" /> Enrollments</Link>
      <div className="mt-3"><PageHeader title="Enroll learners" description="Create accounts and assign courses from an employee or student list." /></div>

      <ol className="mb-8 flex items-center gap-2 overflow-x-auto" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn("flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium", i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-50 text-brand-700" : "bg-white text-ink-500 ring-1 ring-ink-200")}>
              <span className={cn("grid size-6 place-items-center rounded-full text-xs font-semibold", i === step ? "bg-white/20" : i < step ? "bg-brand-600 text-white" : "bg-ink-100")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
              <span className="whitespace-nowrap">{s}</span>
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-ink-300" />}
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      {step === 0 && (
        <div className="max-w-3xl space-y-6">
          <Card className="space-y-5 p-6">
            <Field label="Organization" hint={!orgs.length ? undefined : "The company or university these learners belong to."}>
              <Select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                <option value="">Select an organization…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            {!orgs.length && <p className="text-sm text-ink-500">No organizations yet. <Link to="/admin/organizations" className="font-semibold text-brand-700 hover:underline">Add one first</Link>.</p>}
            <Field label="Due date (optional)" className="max-w-56"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-ink-900">Courses to assign</h2>
            <p className="mt-1 text-sm text-ink-500">Only published courses can be assigned.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {published.map((c) => {
                const on = courseIds.includes(c.id);
                return (
                  <label key={c.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-colors", on ? "bg-brand-50 ring-brand-500" : "bg-white ring-ink-200 hover:bg-ink-50")}>
                    <input type="checkbox" checked={on} onChange={() => setCourseIds((ids) => (on ? ids.filter((x) => x !== c.id) : [...ids, c.id]))} className="mt-0.5 size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-600" />
                    <span className="min-w-0"><span className="block text-sm font-medium text-ink-900">{c.title}</span><span className="text-xs text-ink-500">{c.category}</span></span>
                  </label>
                );
              })}
              {!published.length && <p className="text-sm text-ink-500">No published courses yet.</p>}
            </div>
          </Card>

          <div className="flex justify-end"><Button size="lg" disabled={!orgId || !courseIds.length} onClick={() => setStep(1)}>Continue <ArrowRight className="size-4" /></Button></div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="max-w-3xl space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Upload the learner list</h2>
                <p className="mt-1 text-sm text-ink-500">A CSV with <strong>Name</strong> and <strong>Email</strong> columns. Export from Excel via <em>Save As → CSV</em>.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => downloadFile("learner-template.csv", learnerTemplateCsv)}><Download className="size-4" /> Template</Button>
            </div>

            {rows.length > 0 && fileName ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                <FileSpreadsheet className="size-5 text-emerald-600" />
                <span className="flex-1 text-sm"><strong className="text-emerald-900">{fileName}</strong> <span className="text-emerald-800">· {rows.length} rows found</span></span>
                <button onClick={() => { setRows([]); setFileName(""); }} className="text-sm font-medium text-emerald-800 hover:underline">Remove</button>
              </div>
            ) : (
              <Dropzone className="mt-5" accept=".csv,.txt,text/csv" icon={<FileSpreadsheet />} title="Drop your CSV here, or click to browse" hint="Columns can be in any order; a header row is detected automatically." onFile={async (f) => loadText(await f.text(), f.name)} />
            )}

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-400"><span className="h-px flex-1 bg-ink-200" />or paste<span className="h-px flex-1 bg-ink-200" /></div>
            <Textarea rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Priya Nair, priya@company.com\nArjun Kapoor, arjun@company.com"} className="font-mono text-[13px]" aria-label="Paste learners" />
            <Button variant="secondary" size="sm" className="mt-3" disabled={!paste.trim()} onClick={() => { loadText(paste, "Pasted list"); setPaste(""); }}>Use pasted list</Button>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="size-4" /> Back</Button>
            <Button size="lg" disabled={!rows.length} onClick={() => setStep(2)}>Review {rows.length || ""} learners <ArrowRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              ["Ready to enroll", valid.length, "text-ink-900"],
              ["New accounts", newAccounts, "text-brand-700"],
              ["Existing accounts", valid.length - newAccounts, "text-sky-700"],
              ["Need attention", review.length - valid.length, review.length - valid.length ? "text-red-600" : "text-ink-900"],
            ].map(([l, v, c]) => (
              <Card key={l as string} className="p-4"><p className="text-xs font-medium text-ink-500">{l}</p><p className={cn("mt-1 text-2xl font-semibold tabular-nums", c as string)}>{v}</p></Card>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-200">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Enrolling into <strong>{org?.name}</strong> · {courseIds.length} course{courseIds.length > 1 ? "s" : ""} · <strong>{newEnrollments}</strong> new enrollment{newEnrollments === 1 ? "" : "s"}. Rows with problems are skipped; people already enrolled are left untouched.</p>
          </div>

          <Table>
            <THead><tr><Th className="w-12">#</Th><Th>Name</Th><Th>Email</Th><Th>Result</Th><Th className="w-12" /></tr></THead>
            <TBody>
              {review.slice(0, 200).map((r) => (
                <Tr key={r.i} className={r.issue ? "bg-red-50/40" : undefined}>
                  <Td className="text-ink-400">{r.i + 1}</Td>
                  <Td className="font-medium text-ink-900">{r.name || "—"}</Td>
                  <Td>{r.email || "—"}</Td>
                  <Td>
                    {r.issue ? <Badge tone="red"><AlertTriangle className="size-3" />{r.issue}</Badge>
                      : r.existing ? <Badge tone="sky"><UserCheck className="size-3" />Existing{r.already ? ` · ${r.already} already enrolled` : ""}</Badge>
                      : <Badge tone="green"><UserPlus className="size-3" />New account</Badge>}
                  </Td>
                  <Td><button aria-label="Remove row" onClick={() => setRows((rs) => rs.filter((_, k) => k !== r.i))} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {review.length > 200 && <p className="text-sm text-ink-500">Showing the first 200 of {review.length} rows.</p>}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
            <Button size="lg" disabled={!valid.length} loading={importBulk.isPending} onClick={submit}>Enroll {valid.length} learners</Button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 3 && result && (
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-5 p-6">
            <div className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-6" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-ink-900">Enrollment complete</h2>
              <p className="mt-0.5 text-sm text-ink-500">{result.enrollmentsAdded} enrollments added · {result.created} new accounts · {result.existing} existing · {result.skipped} skipped</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>Enroll more</Button>
              <LinkButton to={orgId ? `/admin/organizations/${orgId}` : "/admin/enrollments"}>View organization</LinkButton>
            </div>
          </Card>

          {result.created > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <KeyRound className="size-5 shrink-0 text-amber-600" />
              <p className="min-w-0 flex-1 text-sm text-amber-900"><strong>Save these login credentials now.</strong> Temporary passwords are only shown here. (Automatic invitation emails will be sent once the backend is connected.)</p>
              <Button size="sm" onClick={() => downloadFile(`${(org?.name ?? "learners").replace(/\W+/g, "-")}-credentials.csv`, toCsv(result.rows.filter((r) => r.tempPassword).map((r) => ({ Name: r.name, Email: r.email, "Temporary password": r.tempPassword!, "Sign-in URL": `${location.origin}/login` }))))}><Download className="size-4" /> Download credentials</Button>
            </div>
          )}

          <Table>
            <THead><tr><Th>Name</Th><Th>Email</Th><Th>Account</Th><Th>Enrolled</Th><Th>Temporary password</Th></tr></THead>
            <TBody>
              {result.rows.map((r, i) => (
                <Tr key={i}>
                  <Td className="font-medium text-ink-900">{r.name}</Td>
                  <Td>{r.email}</Td>
                  <Td>{r.outcome === "created" ? <Badge tone="green">Created</Badge> : r.outcome === "existing" ? <Badge tone="sky">Existing</Badge> : <Badge tone="red">{r.note ?? "Skipped"}</Badge>}</Td>
                  <Td className="tabular-nums">{r.outcome === "skipped" ? "—" : `${r.enrolledCourses} new${r.alreadyEnrolled ? ` · ${r.alreadyEnrolled} already` : ""}`}</Td>
                  <Td>{r.tempPassword ? <code className="rounded bg-ink-100 px-2 py-0.5 font-mono text-[13px]">{r.tempPassword}</code> : <span className="text-ink-400">—</span>}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </>
  );
}
