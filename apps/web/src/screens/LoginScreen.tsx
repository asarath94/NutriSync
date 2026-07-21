import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router/Router";
import { login, ApiError } from "../lib/api-client";
import { FormField, getFieldError } from "../components/FormField";
import { Button } from "../components/Button";

export function LoginScreen() {
  const { setUser } = useAuth();
  const { navigate } = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  function validate(): boolean {
    const email = emailRef.current!;
    const password = passwordRef.current!;
    const next: typeof errors = {
      email: email.checkValidity() ? undefined : (getFieldError(email, "Email") ?? undefined),
      password: password.checkValidity() ? undefined : (getFieldError(password, "Password") ?? undefined),
    };
    setErrors(next);
    return !next.email && !next.password;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { user } = await login(
        { email: emailRef.current!.value, password: passwordRef.current!.value },
        (status) => setRetrying(status === "retrying"),
      );
      setUser(user);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
      setRetrying(false);
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">Log in to NutriSync</p>

        <div className="flex flex-col gap-4">
          <FormField
            ref={emailRef}
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
          />
          <FormField
            ref={passwordRef}
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password}
          />
        </div>

        <div
          className={`overflow-hidden text-sm text-red-600 transition-all duration-150 dark:text-red-400 ${
            formError ? "mt-2 h-5 opacity-100" : "h-0 opacity-0"
          }`}
        >
          {formError}
        </div>
        <div
          className={`overflow-hidden text-sm text-neutral-500 transition-all duration-150 dark:text-neutral-400 ${
            retrying ? "mt-2 h-5 opacity-100" : "h-0 opacity-0"
          }`}
        >
          Having trouble reaching the server, retrying…
        </div>

        <Button type="submit" loading={submitting} className="mt-6 w-full">
          Log in
        </Button>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
          >
            Register
          </button>
        </p>
      </form>
    </main>
  );
}
