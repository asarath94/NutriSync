import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router/Router";
import { register, ApiError } from "../lib/api-client";
import { FormField, getFieldError } from "../components/FormField";
import { Button } from "../components/Button";

const FAMILY_ID_PATTERN = "[0-9a-fA-F]{24}";

export function RegisterScreen() {
  const { setUser } = useAuth();
  const { navigate } = useRouter();

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const familyCodeRef = useRef<HTMLInputElement>(null);

  const [joinExisting, setJoinExisting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    familyCode?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  function validate(): boolean {
    const name = nameRef.current!;
    const email = emailRef.current!;
    const password = passwordRef.current!;
    const familyCode = familyCodeRef.current;

    const next: typeof errors = {
      name: name.checkValidity() ? undefined : (getFieldError(name, "Name") ?? undefined),
      email: email.checkValidity() ? undefined : (getFieldError(email, "Email") ?? undefined),
      password: password.checkValidity() ? undefined : (getFieldError(password, "Password") ?? undefined),
      familyCode:
        joinExisting && familyCode && !familyCode.checkValidity()
          ? (getFieldError(familyCode, "Family code") ?? undefined)
          : undefined,
    };
    setErrors(next);
    return !next.name && !next.email && !next.password && !next.familyCode;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { user } = await register(
        {
          name: nameRef.current!.value,
          email: emailRef.current!.value,
          password: passwordRef.current!.value,
          familyGroupId: joinExisting ? familyCodeRef.current!.value : undefined,
        },
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
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-4 py-10 dark:bg-neutral-950">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">Join NutriSync</p>

        <div className="flex flex-col gap-4">
          <FormField ref={nameRef} label="Name" name="name" autoComplete="name" required error={errors.name} />
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
            autoComplete="new-password"
            required
            minLength={8}
            error={errors.password}
          />
        </div>

        <fieldset className="mt-5 flex flex-col gap-3">
          <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Family</legend>
          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setJoinExisting(false)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                !joinExisting
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              Create new family
            </button>
            <button
              type="button"
              onClick={() => setJoinExisting(true)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                joinExisting
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              Join existing family
            </button>
          </div>

          <div
            className={`grid transition-all duration-200 ease-out ${
              joinExisting ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <FormField
                ref={familyCodeRef}
                label="Family code"
                name="familyCode"
                autoComplete="off"
                required={joinExisting}
                pattern={FAMILY_ID_PATTERN}
                placeholder="Paste the code a family member shared with you"
                error={errors.familyCode}
              />
            </div>
          </div>
        </fieldset>

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
          Create account
        </Button>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
          >
            Log in
          </button>
        </p>
      </form>
    </main>
  );
}
