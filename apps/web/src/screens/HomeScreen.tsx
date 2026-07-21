import { useEffect, useState } from "react";
import type { GoalsListResponse } from "@nutrisync/shared";
import { useAuth } from "../auth/AuthContext";
import { listGoals, ApiError } from "../lib/api-client";
import { Button } from "../components/Button";

export function HomeScreen() {
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState<GoalsListResponse["goals"] | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listGoals((status) => !cancelled && setRetrying(status === "retrying"))
      .then(({ goals }) => {
        if (!cancelled) setGoals(goals);
      })
      .catch((err) => {
        if (!cancelled) setGoalsError(err instanceof ApiError ? err.message : (err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setRetrying(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopyCode() {
    await navigator.clipboard.writeText(user!.familyGroupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-svh bg-white px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {user?.name}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
          </div>
          <Button onClick={handleLogout} loading={loggingOut} className="!bg-transparent !text-neutral-500 hover:!bg-neutral-100 dark:!text-neutral-400 dark:hover:!bg-neutral-900">
            Log out
          </Button>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Family code</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Share this with anyone joining your family group.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              {user?.familyGroupId}
            </code>
            <Button onClick={handleCopyCode} className="shrink-0">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Goals</h2>

          <div
            className={`overflow-hidden text-sm text-neutral-500 transition-all duration-150 dark:text-neutral-400 ${
              retrying ? "mt-2 h-5 opacity-100" : "h-0 opacity-0"
            }`}
          >
            Having trouble reaching the server, retrying…
          </div>

          {goalsError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{goalsError}</p>}

          {goals && goals.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No goals yet.</p>
          )}

          {goals && goals.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/60"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {goal.dailyCalories} kcal · {goal.proteinGrams}p / {goal.carbGrams}c / {goal.fatGrams}f
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      goal.isOwner
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                    }`}
                  >
                    {goal.isOwner ? "Yours" : "Family"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
