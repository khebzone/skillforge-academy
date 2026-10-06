export type Role = "admin" | "learner";
export type CourseStatus = "draft" | "published";
export type LessonType = "video" | "pdf" | "ppt";
export type OrgType = "corporate" | "university";
export type RequestStatus = "new" | "handled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  /** External / already-hosted URL (video, pdf or ppt). */
  url?: string;
  /** Key of a file uploaded through `api.files` (mock: IndexedDB). */
  fileKey?: string;
  fileName?: string;
  /** PDF rendition of a PPT so it can be previewed in the browser. */
  previewUrl?: string;
  previewFileKey?: string;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  language: string;
  outcomes: string[];
  status: CourseStatus;
  /** Hue (0-360) used to generate the cover artwork. */
  hue: number;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  orgId: string;
  enrolledAt: string;
  dueDate?: string;
}

export interface LessonProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt?: string;
  /** Resume position in seconds (videos). */
  position?: number;
}

export interface CourseRequest {
  id: string;
  courseId: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  learnerCount: number;
  message: string;
  status: RequestStatus;
  createdAt: string;
}

/* ---------- Inputs ---------- */

export interface LearnerRow {
  name: string;
  email: string;
}

export interface ImportInput {
  orgId: string;
  courseIds: string[];
  rows: LearnerRow[];
  dueDate?: string;
}

export interface ImportResultRow {
  name: string;
  email: string;
  outcome: "created" | "existing" | "skipped";
  enrolledCourses: number;
  alreadyEnrolled: number;
  tempPassword?: string;
  note?: string;
}

export interface ImportResult {
  rows: ImportResultRow[];
  created: number;
  existing: number;
  skipped: number;
  enrollmentsAdded: number;
}

export interface CourseRequestInput {
  courseId: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  learnerCount: number;
  message: string;
}

/* ---------- API contract ----------
 * The UI only talks to this interface. Today it is backed by a
 * browser-local mock (src/api/mock.ts). Later, write an `http.ts`
 * implementing the same interface against FastAPI / Spring Boot.
 */
export interface Api {
  auth: {
    login(email: string, password: string): Promise<User>;
    logout(): Promise<void>;
    me(): Promise<User | null>;
    changePassword(current: string, next: string): Promise<void>;
  };
  courses: {
    list(opts?: { publishedOnly?: boolean }): Promise<Course[]>;
    get(id: string): Promise<Course | null>;
    save(course: Course): Promise<Course>;
    create(): Promise<Course>;
    remove(id: string): Promise<void>;
    setStatus(id: string, status: CourseStatus): Promise<Course>;
  };
  orgs: {
    list(): Promise<Organization[]>;
    get(id: string): Promise<Organization | null>;
    save(org: Partial<Organization> & Pick<Organization, "name" | "type">): Promise<Organization>;
    remove(id: string): Promise<void>;
  };
  learners: {
    list(opts?: { orgId?: string }): Promise<User[]>;
    remove(id: string): Promise<void>;
    resetPassword(id: string): Promise<string>;
  };
  enrollments: {
    list(): Promise<Enrollment[]>;
    /** Enrollments of the signed-in learner. */
    mine(): Promise<Enrollment[]>;
    importBulk(input: ImportInput): Promise<ImportResult>;
    remove(id: string): Promise<void>;
  };
  progress: {
    listForUser(userId: string): Promise<LessonProgress[]>;
    listAll(): Promise<LessonProgress[]>;
    set(p: LessonProgress): Promise<void>;
  };
  requests: {
    list(): Promise<CourseRequest[]>;
    create(input: CourseRequestInput): Promise<void>;
    setStatus(id: string, status: RequestStatus): Promise<void>;
  };
  files: {
    /** Upload a file; returns a key stored on the lesson. */
    upload(file: File, onProgress?: (pct: number) => void): Promise<string>;
    /** Resolve a key to a URL playable/viewable in the browser. */
    urlFor(key: string): Promise<string>;
  };
}
