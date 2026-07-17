import { useState } from "react";
import { HealthCheckSchema } from "@nutrisync/shared";

// Proves packages/shared is wired up end-to-end: parsing a sample payload
// with the same Zod schema the api's /health route uses.
const sharedPackageWorks = HealthCheckSchema.safeParse({
  status: "ok",
  uptime: 0,
  timestamp: new Date().toISOString(),
}).success;

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white px-4 text-center dark:bg-neutral-950">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        NutriSync
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        apps/web skeleton — React 19 + Vite + Tailwind
      </p>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Count is {count}
      </button>

      <p className="text-sm text-neutral-400 dark:text-neutral-500">
        @nutrisync/shared:{" "}
        {sharedPackageWorks ? "wired up ✅" : "not working ❌"}
      </p>
    </main>
  );
}

export default App;
