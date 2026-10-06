import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { RequireRole } from "@/auth/guards";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LearnerLayout } from "@/layouts/LearnerLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Spinner } from "@/components/ui/Misc";

const Home = lazy(() => import("@/pages/public/Home"));
const Catalog = lazy(() => import("@/pages/public/Catalog"));
const CourseDetail = lazy(() => import("@/pages/public/CourseDetail"));
const Login = lazy(() => import("@/pages/public/Login"));

const MyLearning = lazy(() => import("@/pages/learner/MyLearning"));
const Player = lazy(() => import("@/pages/learner/Player"));
const Certificate = lazy(() => import("@/pages/learner/Certificate"));

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Courses = lazy(() => import("@/pages/admin/Courses"));
const CourseEditor = lazy(() => import("@/pages/admin/CourseEditor"));
const Organizations = lazy(() => import("@/pages/admin/Organizations"));
const OrganizationDetail = lazy(() => import("@/pages/admin/OrganizationDetail"));
const Enrollments = lazy(() => import("@/pages/admin/Enrollments"));
const EnrollWizard = lazy(() => import("@/pages/admin/EnrollWizard"));
const Learners = lazy(() => import("@/pages/admin/Learners"));
const Requests = lazy(() => import("@/pages/admin/Requests"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner /></div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="catalog/:courseId" element={<CourseDetail />} />
          </Route>
          <Route path="login" element={<Login />} />

          <Route path="admin" element={<RequireRole role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CourseEditor />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="organizations/:orgId" element={<OrganizationDetail />} />
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="enrollments/new" element={<EnrollWizard />} />
              <Route path="learners" element={<Learners />} />
              <Route path="requests" element={<Requests />} />
            </Route>
          </Route>

          <Route path="learn" element={<RequireRole role="learner" />}>
            <Route element={<LearnerLayout />}>
              <Route index element={<MyLearning />} />
            </Route>
            <Route path=":courseId/certificate" element={<Certificate />} />
            <Route path=":courseId/:lessonId?" element={<Player />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
