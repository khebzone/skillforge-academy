import type { Course, Enrollment, LessonProgress, Organization, CourseRequest, Lesson, Section, User } from "./types";

export interface DbUser extends User {
  password: string;
}

export interface Db {
  users: DbUser[];
  orgs: Organization[];
  courses: Course[];
  enrollments: Enrollment[];
  progress: LessonProgress[];
  requests: CourseRequest[];
}

const VIDEO_BASE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
const VIDEOS = ["BigBuckBunny.mp4", "ElephantsDream.mp4", "ForBiggerBlazes.mp4", "ForBiggerEscapes.mp4", "Sintel.mp4"];
const SLIDES = "/samples/sample-slides.pdf";
const HANDBOOK = "/samples/sample-handbook.pdf";

let vi = 0;
const video = (id: string, title: string, durationMin: number): Lesson => ({
  id,
  title,
  type: "video",
  durationMin,
  url: VIDEO_BASE + VIDEOS[vi++ % VIDEOS.length],
});
const pdf = (id: string, title: string, durationMin = 10): Lesson => ({
  id,
  title,
  type: "pdf",
  durationMin,
  url: HANDBOOK,
  fileName: `${title.replace(/\W+/g, "-")}.pdf`,
});
const ppt = (id: string, title: string, durationMin = 12): Lesson => ({
  id,
  title,
  type: "ppt",
  durationMin,
  previewUrl: SLIDES,
  fileName: `${title.replace(/\W+/g, "-")}.pptx`,
});
const section = (id: string, title: string, lessons: Lesson[]): Section => ({ id, title, lessons });

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function makeCourses(): Course[] {
  const base = { language: "English", createdAt: daysAgo(60), updatedAt: daysAgo(5) };
  return [
    {
      ...base,
      id: "c-leadership",
      title: "Leadership Essentials for First-Time Managers",
      subtitle: "Move from individual contributor to confident team leader in six practical modules.",
      description:
        "Stepping into management changes everything. This course gives new managers a clear playbook for running one-to-ones, delegating, giving feedback, and building a high-trust team — with templates your people can use the same day.",
      category: "Leadership & Management",
      level: "Beginner",
      outcomes: [
        "Run effective one-to-one and team meetings",
        "Delegate work without losing accountability",
        "Give clear, kind and actionable feedback",
        "Set goals and track team performance",
      ],
      status: "published",
      hue: 248,
      sections: [
        section("s-lead-1", "Becoming a manager", [
          video("l-lead-1", "The shift from doer to leader", 9),
          video("l-lead-2", "Your first 90 days", 12),
          pdf("l-lead-3", "New manager checklist", 6),
        ]),
        section("s-lead-2", "Leading people", [
          video("l-lead-4", "Running great one-to-ones", 14),
          ppt("l-lead-5", "Feedback frameworks (slides)", 10),
          video("l-lead-6", "Delegation that works", 11),
        ]),
        section("s-lead-3", "Building the team", [
          video("l-lead-7", "Goals, OKRs and accountability", 13),
          pdf("l-lead-8", "Team health assessment", 8),
          ppt("l-lead-9", "Course wrap-up and action plan", 7),
        ]),
      ],
    },
    {
      ...base,
      id: "c-data",
      title: "Data Analytics Fundamentals",
      subtitle: "Turn raw data into decisions using spreadsheets, SQL basics and dashboards.",
      description:
        "A hands-on introduction to analytics for non-specialists. Learners clean data, ask the right questions, build summaries and tell a compelling story with charts — no prior experience required.",
      category: "Technology & Data",
      level: "Beginner",
      outcomes: [
        "Clean and structure messy datasets",
        "Summarise data with pivots and basic SQL",
        "Design clear dashboards and charts",
        "Present insights to non-technical stakeholders",
      ],
      status: "published",
      hue: 188,
      sections: [
        section("s-data-1", "Thinking with data", [
          video("l-data-1", "What is analytics?", 8),
          ppt("l-data-2", "The analytics workflow (slides)", 9),
        ]),
        section("s-data-2", "Working with data", [
          video("l-data-3", "Cleaning data in spreadsheets", 16),
          video("l-data-4", "Pivot tables in practice", 14),
          pdf("l-data-5", "SQL cheat sheet", 12),
        ]),
        section("s-data-3", "Telling the story", [
          video("l-data-6", "Choosing the right chart", 11),
          video("l-data-7", "Building a dashboard", 18),
        ]),
      ],
    },
    {
      ...base,
      id: "c-comm",
      title: "Effective Business Communication",
      subtitle: "Write, speak and present with clarity — in meetings, emails and difficult conversations.",
      description:
        "Great communication is the most transferable workplace skill. Learn structured approaches for emails, presentations and conflict conversations, with scripts and examples you can reuse.",
      category: "Communication",
      level: "Beginner",
      outcomes: [
        "Write concise, persuasive emails and updates",
        "Structure presentations that land",
        "Handle difficult conversations calmly",
      ],
      status: "published",
      hue: 330,
      sections: [
        section("s-comm-1", "Written communication", [
          video("l-comm-1", "Writing emails people act on", 10),
          pdf("l-comm-2", "Email templates pack", 7),
        ]),
        section("s-comm-2", "Speaking & presenting", [
          video("l-comm-3", "Structuring a presentation", 13),
          ppt("l-comm-4", "Slide design principles", 9),
          video("l-comm-5", "Handling Q&A with confidence", 8),
        ]),
        section("s-comm-3", "Difficult conversations", [
          video("l-comm-6", "A framework for tough talks", 12),
        ]),
      ],
    },
    {
      ...base,
      id: "c-safety",
      title: "Workplace Safety & Compliance",
      subtitle: "Mandatory annual training covering hazard awareness, reporting and your responsibilities.",
      description:
        "Meets common annual compliance requirements. Covers hazard identification, incident reporting, ergonomics, emergency procedures and data-protection basics, finishing with a signed completion certificate.",
      category: "Compliance & Safety",
      level: "Beginner",
      outcomes: [
        "Identify and report workplace hazards",
        "Follow emergency and evacuation procedures",
        "Understand data-protection responsibilities",
      ],
      status: "published",
      hue: 28,
      sections: [
        section("s-safe-1", "Safety basics", [
          video("l-safe-1", "Your safety responsibilities", 7),
          ppt("l-safe-2", "Hazard identification (slides)", 10),
          pdf("l-safe-3", "Incident reporting guide", 5),
        ]),
        section("s-safe-2", "Emergencies & data", [
          video("l-safe-4", "Emergency procedures", 9),
          video("l-safe-5", "Data protection essentials", 11),
        ]),
      ],
    },
    {
      ...base,
      id: "c-python",
      title: "Python Programming for Beginners",
      subtitle: "Learn to code from scratch — variables, logic, functions and a real mini-project.",
      description:
        "Designed for students with zero coding experience. Short videos, annotated slide decks and practice sheets guide learners from their first print statement to automating a real task.",
      category: "Technology & Data",
      level: "Beginner",
      outcomes: [
        "Write and run Python programs",
        "Use loops, conditions and functions",
        "Read and write files",
        "Complete a small automation project",
      ],
      status: "published",
      hue: 160,
      sections: [
        section("s-py-1", "Getting started", [
          video("l-py-1", "Setting up Python", 8),
          video("l-py-2", "Variables and data types", 14),
          pdf("l-py-3", "Practice sheet 1", 10),
        ]),
        section("s-py-2", "Control flow & functions", [
          video("l-py-4", "Conditions and loops", 16),
          ppt("l-py-5", "Functions explained (slides)", 12),
          video("l-py-6", "Working with files", 13),
        ]),
        section("s-py-3", "Mini project", [
          video("l-py-7", "Project: automate a report", 22),
          pdf("l-py-8", "Next steps and resources", 5),
        ]),
      ],
    },
    {
      ...base,
      id: "c-sales",
      title: "Consultative Selling Mastery",
      subtitle: "Discovery, objection handling and closing for modern B2B sales teams.",
      description:
        "A practical programme for sales teams who want to lead with questions, understand customer problems and build lasting accounts.",
      category: "Sales & Marketing",
      level: "Intermediate",
      outcomes: ["Run structured discovery calls", "Handle objections", "Close with confidence"],
      status: "draft",
      hue: 12,
      sections: [
        section("s-sales-1", "Discovery", [
          video("l-sales-1", "The consultative mindset", 10),
          ppt("l-sales-2", "Discovery question bank", 8),
        ]),
      ],
    },
  ];
}

const ORGS: Organization[] = [
  { id: "o-acme", name: "Acme Industries", type: "corporate", contactName: "Rahul Menon", contactEmail: "rahul.menon@acme.example", createdAt: daysAgo(45) },
  { id: "o-north", name: "Northfield University", type: "university", contactName: "Dr. Ananya Rao", contactEmail: "a.rao@northfield.example", createdAt: daysAgo(38) },
  { id: "o-bright", name: "Brightpath Bank", type: "corporate", contactName: "Sana Qureshi", contactEmail: "sana.q@brightpath.example", createdAt: daysAgo(12) },
];

const PEOPLE: Record<string, string[]> = {
  "o-acme": ["Priya Nair", "Arjun Kapoor", "Meera Iyer", "Karthik Subramanian", "Neha Verma", "Vikram Shah", "Divya Menon", "Rohan Das"],
  "o-north": ["Aisha Khan", "Siddharth Rao", "Ishita Bose", "Farhan Ali", "Lakshmi Pillai", "Tarun Gupta"],
  "o-bright": ["Sneha Reddy", "Manoj Kumar", "Anita Joseph", "Faisal Ahmed"],
};

const slug = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, ".");
const domain: Record<string, string> = { "o-acme": "acme.example", "o-north": "northfield.example", "o-bright": "brightpath.example" };
const courseMap: Record<string, string[]> = {
  "o-acme": ["c-leadership", "c-comm"],
  "o-north": ["c-data", "c-python"],
  "o-bright": ["c-safety", "c-comm"],
};

export function buildSeed(): Db {
  vi = 0;
  const courses = makeCourses();
  const users: DbUser[] = [
    { id: "u-admin", name: "Kathiravan R", email: "admin@skillforge.example", role: "admin", password: "admin123", createdAt: daysAgo(90) },
  ];
  const enrollments: Enrollment[] = [];
  const progress: LessonProgress[] = [];

  let n = 0;
  for (const org of ORGS) {
    PEOPLE[org.id]!.forEach((name, i) => {
      const id = `u-${slug(name)}`;
      users.push({
        id,
        name,
        email: `${slug(name)}@${domain[org.id]}`,
        role: "learner",
        orgId: org.id,
        password: "learner123",
        createdAt: daysAgo(30 - (n % 20)),
      });
      for (const [ci, cid] of courseMap[org.id]!.entries()) {
        enrollments.push({
          id: `e-${id}-${cid}`,
          userId: id,
          courseId: cid,
          orgId: org.id,
          enrolledAt: daysAgo(28 - (n % 14)),
          dueDate: new Date(Date.now() + (20 + ci * 10) * 86_400_000).toISOString(),
        });
        // Deterministic spread of progress: some none, some partial, some complete.
        const course = courses.find((c) => c.id === cid)!;
        const lessons = course.sections.flatMap((s) => s.lessons);
        const bucket = (i + ci + n) % 4; // 0 none, 1 ~30%, 2 ~70%, 3 complete
        const count = [0, Math.ceil(lessons.length * 0.3), Math.ceil(lessons.length * 0.7), lessons.length][bucket]!;
        lessons.slice(0, count).forEach((l, k) =>
          progress.push({ userId: id, courseId: cid, lessonId: l.id, completedAt: daysAgo(Math.max(1, 20 - k * 2)) }),
        );
      }
      n++;
    });
  }

  // Demo learner: Priya Nair — in-progress + completed course.
  const demo = users.find((u) => u.id === "u-priya.nair")!;
  demo.email = "priya.nair@acme.example";
  const leadership = courses[0]!.sections.flatMap((s) => s.lessons);
  progress.splice(0, progress.length, ...progress.filter((p) => !(p.userId === demo.id)));
  leadership.slice(0, 4).forEach((l, k) => progress.push({ userId: demo.id, courseId: "c-leadership", lessonId: l.id, completedAt: daysAgo(10 - k) }));
  const comm = courses[2]!.sections.flatMap((s) => s.lessons);
  comm.forEach((l, k) => progress.push({ userId: demo.id, courseId: "c-comm", lessonId: l.id, completedAt: daysAgo(14 - k) }));

  const requests: CourseRequest[] = [
    {
      id: "r1",
      courseId: "c-leadership",
      orgName: "Helios Logistics",
      contactName: "Imran Sheikh",
      contactEmail: "imran@helios.example",
      learnerCount: 45,
      message: "We would like to roll this out to all newly promoted team leads next quarter.",
      status: "new",
      createdAt: daysAgo(1),
    },
    {
      id: "r2",
      courseId: "c-data",
      orgName: "St. Mary's College",
      contactName: "Prof. Joseph Mathew",
      contactEmail: "j.mathew@stmarys.example",
      learnerCount: 120,
      message: "Final-year commerce students. Can we start in January?",
      status: "new",
      createdAt: daysAgo(3),
    },
  ];

  return { users, orgs: ORGS.map((o) => ({ ...o })), courses, enrollments, progress, requests };
}
