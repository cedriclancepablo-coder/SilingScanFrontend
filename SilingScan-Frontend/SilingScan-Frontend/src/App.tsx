import { Refine, GitHubBanner } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./providers/data";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { Layout } from "./components/refine-ui/layout/layout";
import { SilingScanLogo } from "./components/refine-ui/logo/siling-scan-logo";
import "./App.css";
import Dashboard from "./pages/dashboard";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import HistoryPage from "./pages/history";
import ResultPage from "./pages/result";
import GuidancePage from "./pages/guidance";
import CropsPage from "./pages/crops";
import ResearchPage from "./pages/research";
import AdvisoriesPage from "./pages/advisories";
import AdminPage from "./pages/admin";
import {
  BookOpenCheck,
  ChartNoAxesCombined,
  ClipboardList,
  House,
  Leaf,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import {
  canAccessPath,
  getCurrentUser,
  getDefaultRouteForRole,
  type UserRole,
} from "./lib/auth";

function AccessGate({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  if (!canAccessPath(currentUser.role, window.location.pathname)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  useLocation();
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const resources =
    role === "farmer"
      ? [
          {
            name: "home",
            list: "/",
            meta: { label: "Plant scanner", icon: <House /> },
          },
          {
            name: "crops",
            list: "/crops",
            meta: { label: "My crops", icon: <Sprout /> },
          },
          {
            name: "history",
            list: "/history",
            meta: { label: "My scans", icon: <ClipboardList /> },
          },
          {
            name: "advisories",
            list: "/advisories",
            meta: { label: "Field guidance", icon: <BookOpenCheck /> },
          },
          {
            name: "guidance",
            list: "/guidance",
            meta: { label: "Care plan", icon: <Leaf /> },
          },
        ]
      : role === "researcher"
      ? [
          {
            name: "research",
            list: "/research",
            meta: { label: "Research overview", icon: <ChartNoAxesCombined /> },
          },
          {
            name: "scan",
            list: "/",
            meta: { label: "Scan a plant", icon: <House /> },
          },
          {
            name: "history",
            list: "/history",
            meta: { label: "Scan archive", icon: <ClipboardList /> },
          },
          {
            name: "advisories",
            list: "/advisories",
            meta: { label: "Field guidance", icon: <BookOpenCheck /> },
          },
          {
            name: "guidance",
            list: "/guidance",
            meta: { label: "Care plan", icon: <Leaf /> },
          },
        ]
      : role === "agriculturist"
      ? [
          {
            name: "advisories",
            list: "/advisories",
            meta: { label: "Advisory library", icon: <BookOpenCheck /> },
          },
          {
            name: "history",
            list: "/history",
            meta: { label: "Crop health records", icon: <Leaf /> },
          },
        ]
      : role === "admin"
      ? [
          {
            name: "admin",
            list: "/admin",
            meta: { label: "People & access", icon: <ShieldCheck /> },
          },
          {
            name: "history",
            list: "/history",
            meta: { label: "Scan archive", icon: <ClipboardList /> },
          },
          {
            name: "advisories",
            list: "/advisories",
            meta: { label: "Field guidance", icon: <BookOpenCheck /> },
          },
        ]
      : [
          {
            name: "dashboard",
            list: "/",
            meta: { label: "Home", icon: <House /> },
          },
        ];

  return (
    <>
      <GitHubBanner />
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "n4qwgz-CqegmR-jhFJc1",
                title: {
                  icon: <SilingScanLogo />,
                  text: "Siling Scan",
                },
              }}
              resources={resources}
            >
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route
                  element={
                    <AccessGate
                      allowedRoles={[
                        "farmer",
                        "researcher",
                        "agriculturist",
                        "admin",
                      ]}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </AccessGate>
                  }
                >
                  <Route
                    path="/"
                    element={
                      <AccessGate allowedRoles={["farmer", "researcher"]}>
                        <Dashboard />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/crops"
                    element={
                      <AccessGate allowedRoles={["farmer"]}>
                        <CropsPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/research"
                    element={
                      <AccessGate allowedRoles={["researcher"]}>
                        <ResearchPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/advisories"
                    element={
                      <AccessGate
                        allowedRoles={[
                          "farmer",
                          "researcher",
                          "agriculturist",
                          "admin",
                        ]}
                      >
                        <AdvisoriesPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AccessGate allowedRoles={["admin"]}>
                        <AdminPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <AccessGate
                        allowedRoles={[
                          "farmer",
                          "researcher",
                          "agriculturist",
                          "admin",
                        ]}
                      >
                        <HistoryPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/result"
                    element={
                      <AccessGate allowedRoles={["farmer", "researcher"]}>
                        <ResultPage />
                      </AccessGate>
                    }
                  />
                  <Route
                    path="/guidance"
                    element={
                      <AccessGate allowedRoles={["farmer", "researcher"]}>
                        <GuidancePage />
                      </AccessGate>
                    }
                  />
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler
                handler={({ autoGeneratedTitle }) =>
                  autoGeneratedTitle.replace("Refine", "SilingScan")
                }
              />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
