import { useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RouterProvider, useRouter } from "./router/Router";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { HomeScreen } from "./screens/HomeScreen";

function Splash({ waking }: { waking: boolean }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-white dark:bg-neutral-950">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      {waking && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Waking up the server, this can take a minute…
        </p>
      )}
    </main>
  );
}

function AppShell() {
  const { status, bootStatus } = useAuth();
  const { path } = useRouter();

  if (status === "loading") {
    return <Splash waking={bootStatus === "retrying"} />;
  }

  if (status === "out") {
    if (path === "/register") return <RegisterScreen />;
    return <LoginScreen />;
  }

  if (path === "/login" || path === "/register") {
    // Logged in but sitting on an auth route (e.g. typed URL) - Router's
    // navigate() will fire from useEffect below and flip `path`; render
    // nothing "authed" in the meantime.
    return <Splash waking={false} />;
  }

  return <HomeScreen />;
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <RedirectGuard />
      </AuthProvider>
    </RouterProvider>
  );
}

function RedirectGuard() {
  const { status } = useAuth();
  const { path, navigate } = useRouter();

  useEffect(() => {
    if (status === "out" && path !== "/login" && path !== "/register") {
      navigate("/login");
    }
    if (status === "in" && (path === "/login" || path === "/register")) {
      navigate("/");
    }
  }, [status, path, navigate]);

  return <AppShell />;
}

export default App;
