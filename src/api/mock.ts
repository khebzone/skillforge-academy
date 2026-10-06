import type { Api, Course, ImportResultRow, User } from "./types";
import { buildSeed, type Db, type DbUser } from "./seed";
import { isEmail, uid } from "@/lib/utils";

/**
 * Browser-local implementation of the Api contract.
 * Everything persists in localStorage (data) and IndexedDB (uploaded files),
 * so the whole product can be demoed without a server.
 */

const DB_KEY = "skillforge.db.v1";
const SESSION_KEY = "skillforge.session";
const delay = <T,>(v: T, ms = 140) => new Promise<T>((r) => setTimeout(() => r(v), ms));

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* fall through to seed */
  }
  const fresh = buildSeed();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

let db = load();
const persist = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const publicUser = ({ password: _p, ...u }: DbUser): User => u;

export function resetDemoData() {
  db = buildSeed();
  persist();
  localStorage.removeItem(SESSION_KEY);
}

const currentUserId = () => localStorage.getItem(SESSION_KEY);
const currentUser = () => db.users.find((u) => u.id === currentUserId());
const requireAdmin = () => {
  if (currentUser()?.role !== "admin") throw new Error("Admin access required");
};

const tempPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

/* ---------- IndexedDB file store ---------- */
const FILE_DB = "skillforge-files";
const openFiles = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(FILE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const urlCache = new Map<string, string>();

export const mockApi: Api = {
  auth: {
    async login(email, password) {
      const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.password !== password) {
        await delay(null, 300);
        throw new Error("Incorrect email or password.");
      }
      localStorage.setItem(SESSION_KEY, u.id);
      return delay(publicUser(u));
    },
    async logout() {
      localStorage.removeItem(SESSION_KEY);
    },
    async me() {
      const u = currentUser();
      return delay(u ? publicUser(u) : null, 60);
    },
    async changePassword(current, next) {
      const u = currentUser();
      if (!u || u.password !== current) throw new Error("Current password is incorrect.");
      if (next.length < 8) throw new Error("New password must be at least 8 characters.");
      u.password = next;
      persist();
    },
  },

  courses: {
    async list(opts) {
      const list = opts?.publishedOnly ? db.courses.filter((c) => c.status === "published") : db.courses;
      return delay([...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    },
    async get(id) {
      return delay(db.courses.find((c) => c.id === id) ?? null);
    },
    async create() {
      requireAdmin();
      const now = new Date().toISOString();
      const course: Course = {
        id: uid("c"),
        title: "Untitled course",
        subtitle: "",
        description: "",
        category: "Career Skills",
        level: "Beginner",
        language: "English",
        outcomes: [],
        status: "draft",
        hue: Math.floor(Math.random() * 360),
        sections: [],
        createdAt: now,
        updatedAt: now,
      };
      db.courses.push(course);
      persist();
      return delay(course);
    },
    async save(course) {
      requireAdmin();
      const i = db.courses.findIndex((c) => c.id === course.id);
      const next = { ...course, updatedAt: new Date().toISOString() };
      if (i === -1) db.courses.push(next);
      else db.courses[i] = next;
      persist();
      return delay(next, 80);
    },
    async remove(id) {
      requireAdmin();
      db.courses = db.courses.filter((c) => c.id !== id);
      db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
      db.progress = db.progress.filter((p) => p.courseId !== id);
      persist();
      await delay(null);
    },
    async setStatus(id, status) {
      requireAdmin();
      const c = db.courses.find((x) => x.id === id);
      if (!c) throw new Error("Course not found");
      c.status = status;
      c.updatedAt = new Date().toISOString();
      persist();
      return delay(c);
    },
  },

  orgs: {
    async list() {
      return delay([...db.orgs].sort((a, b) => a.name.localeCompare(b.name)));
    },
    async get(id) {
      return delay(db.orgs.find((o) => o.id === id) ?? null);
    },
    async save(input) {
      requireAdmin();
      const existing = input.id ? db.orgs.find((o) => o.id === input.id) : undefined;
      if (existing) {
        Object.assign(existing, input);
        persist();
        return delay(existing);
      }
      const org = {
        id: uid("o"),
        contactName: "",
        contactEmail: "",
        createdAt: new Date().toISOString(),
        ...input,
      } as (typeof db.orgs)[number];
      db.orgs.push(org);
      persist();
      return delay(org);
    },
    async remove(id) {
      requireAdmin();
      const memberIds = new Set(db.users.filter((u) => u.orgId === id).map((u) => u.id));
      db.users = db.users.filter((u) => !memberIds.has(u.id));
      db.enrollments = db.enrollments.filter((e) => e.orgId !== id);
      db.progress = db.progress.filter((p) => !memberIds.has(p.userId));
      db.orgs = db.orgs.filter((o) => o.id !== id);
      persist();
      await delay(null);
    },
  },

  learners: {
    async list(opts) {
      requireAdmin();
      const l = db.users.filter((u) => u.role === "learner" && (!opts?.orgId || u.orgId === opts.orgId));
      return delay(l.map(publicUser).sort((a, b) => a.name.localeCompare(b.name)));
    },
    async remove(id) {
      requireAdmin();
      db.users = db.users.filter((u) => u.id !== id);
      db.enrollments = db.enrollments.filter((e) => e.userId !== id);
      db.progress = db.progress.filter((p) => p.userId !== id);
      persist();
      await delay(null);
    },
    async resetPassword(id) {
      requireAdmin();
      const u = db.users.find((x) => x.id === id);
      if (!u) throw new Error("Learner not found");
      u.password = tempPassword();
      persist();
      return delay(u.password);
    },
  },

  enrollments: {
    async list() {
      requireAdmin();
      return delay([...db.enrollments]);
    },
    async mine() {
      const me = currentUser();
      return delay(me ? db.enrollments.filter((e) => e.userId === me.id) : [], 80);
    },
    async importBulk({ orgId, courseIds, rows, dueDate }) {
      requireAdmin();
      if (!db.orgs.some((o) => o.id === orgId)) throw new Error("Organization not found");
      const results: ImportResultRow[] = [];
      const seen = new Set<string>();
      let enrollmentsAdded = 0;

      for (const raw of rows) {
        const name = raw.name.trim();
        const email = raw.email.trim().toLowerCase();
        if (!name || !isEmail(email)) {
          results.push({ name, email, outcome: "skipped", enrolledCourses: 0, alreadyEnrolled: 0, note: "Invalid name or email" });
          continue;
        }
        if (seen.has(email)) {
          results.push({ name, email, outcome: "skipped", enrolledCourses: 0, alreadyEnrolled: 0, note: "Duplicate in file" });
          continue;
        }
        seen.add(email);

        let user = db.users.find((u) => u.email.toLowerCase() === email);
        let outcome: ImportResultRow["outcome"] = "existing";
        let pwd: string | undefined;
        if (user && user.role !== "learner") {
          results.push({ name, email, outcome: "skipped", enrolledCourses: 0, alreadyEnrolled: 0, note: "Email belongs to an admin account" });
          continue;
        }
        if (!user) {
          pwd = tempPassword();
          user = { id: uid("u"), name, email, role: "learner", orgId, password: pwd, createdAt: new Date().toISOString() };
          db.users.push(user);
          outcome = "created";
        }

        let added = 0;
        let already = 0;
        for (const courseId of courseIds) {
          if (db.enrollments.some((e) => e.userId === user!.id && e.courseId === courseId)) {
            already++;
            continue;
          }
          db.enrollments.push({
            id: uid("e"),
            userId: user.id,
            courseId,
            orgId,
            enrolledAt: new Date().toISOString(),
            dueDate: dueDate || undefined,
          });
          added++;
        }
        enrollmentsAdded += added;
        results.push({ name, email, outcome, enrolledCourses: added, alreadyEnrolled: already, tempPassword: pwd });
      }
      persist();
      return delay({
        rows: results,
        created: results.filter((r) => r.outcome === "created").length,
        existing: results.filter((r) => r.outcome === "existing").length,
        skipped: results.filter((r) => r.outcome === "skipped").length,
        enrollmentsAdded,
      }, 500);
    },
    async remove(id) {
      requireAdmin();
      const e = db.enrollments.find((x) => x.id === id);
      db.enrollments = db.enrollments.filter((x) => x.id !== id);
      if (e) db.progress = db.progress.filter((p) => !(p.userId === e.userId && p.courseId === e.courseId));
      persist();
      await delay(null);
    },
  },

  progress: {
    async listForUser(userId) {
      return delay(db.progress.filter((p) => p.userId === userId), 60);
    },
    async listAll() {
      requireAdmin();
      return delay([...db.progress]);
    },
    async set(p) {
      const i = db.progress.findIndex((x) => x.userId === p.userId && x.lessonId === p.lessonId);
      if (i === -1) db.progress.push(p);
      else db.progress[i] = { ...db.progress[i]!, ...p };
      persist();
    },
  },

  requests: {
    async list() {
      requireAdmin();
      return delay([...db.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    async create(input) {
      db.requests.push({ id: uid("r"), status: "new", createdAt: new Date().toISOString(), ...input });
      persist();
      await delay(null, 400);
    },
    async setStatus(id, status) {
      requireAdmin();
      const r = db.requests.find((x) => x.id === id);
      if (r) r.status = status;
      persist();
      await delay(null, 80);
    },
  },

  files: {
    async upload(file, onProgress) {
      const key = uid("f");
      const idb = await openFiles();
      // Simulated progress so the UI behaves like a real upload.
      for (const pct of [15, 40, 70, 90]) {
        onProgress?.(pct);
        await delay(null, 90);
      }
      await new Promise<void>((resolve, reject) => {
        const tx = idb.transaction("files", "readwrite");
        tx.objectStore("files").put(file, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      onProgress?.(100);
      return key;
    },
    async urlFor(key) {
      const cached = urlCache.get(key);
      if (cached) return cached;
      const idb = await openFiles();
      const blob = await new Promise<Blob | undefined>((resolve, reject) => {
        const req = idb.transaction("files").objectStore("files").get(key);
        req.onsuccess = () => resolve(req.result as Blob | undefined);
        req.onerror = () => reject(req.error);
      });
      if (!blob) throw new Error("File not found");
      const url = URL.createObjectURL(blob);
      urlCache.set(key, url);
      return url;
    },
  },
};
