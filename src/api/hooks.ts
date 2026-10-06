import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./index";
import type { ImportInput } from "./types";

export const qk = {
  courses: ["courses"] as const,
  course: (id: string) => ["courses", id] as const,
  orgs: ["orgs"] as const,
  learners: ["learners"] as const,
  enrollments: ["enrollments"] as const,
  progress: (userId: string) => ["progress", userId] as const,
  allProgress: ["progress", "all"] as const,
  requests: ["requests"] as const,
};

export const useCourses = (publishedOnly = false) =>
  useQuery({ queryKey: [...qk.courses, { publishedOnly }], queryFn: () => api.courses.list({ publishedOnly }) });
export const useCourse = (id?: string) =>
  useQuery({ queryKey: qk.course(id ?? ""), queryFn: () => api.courses.get(id!), enabled: !!id });
export const useOrgs = () => useQuery({ queryKey: qk.orgs, queryFn: () => api.orgs.list() });
export const useLearners = () => useQuery({ queryKey: qk.learners, queryFn: () => api.learners.list() });
export const useEnrollments = () => useQuery({ queryKey: qk.enrollments, queryFn: () => api.enrollments.list() });
export const useMyEnrollments = () =>
  useQuery({ queryKey: [...qk.enrollments, "mine"], queryFn: () => api.enrollments.mine() });
export const useUserProgress = (userId?: string) =>
  useQuery({ queryKey: qk.progress(userId ?? ""), queryFn: () => api.progress.listForUser(userId!), enabled: !!userId });
export const useAllProgress = () => useQuery({ queryKey: qk.allProgress, queryFn: () => api.progress.listAll() });
export const useRequests = () => useQuery({ queryKey: qk.requests, queryFn: () => api.requests.list() });

/** Run a mutation and invalidate the given query roots afterwards. */
export function useApiMutation<TIn, TOut>(fn: (v: TIn) => Promise<TOut>, invalidate: readonly (readonly unknown[])[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(invalidate.map((key) => qc.invalidateQueries({ queryKey: key }))),
  });
}

export const useImportBulk = () =>
  useApiMutation((input: ImportInput) => api.enrollments.importBulk(input), [qk.enrollments, qk.learners]);
