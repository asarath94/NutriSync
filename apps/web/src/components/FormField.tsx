import type { InputHTMLAttributes, Ref } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

// React 19: function components accept `ref` as a plain prop, no forwardRef needed.
export function FormField({ label, error, id, ref, className = "", ...rest }: FormFieldProps) {
  const fieldId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <input
        id={fieldId}
        ref={ref}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors duration-150 focus:ring-2 focus:ring-neutral-900/15 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-white/15 ${
          error ? "border-red-500" : "border-neutral-300 dark:border-neutral-700"
        } ${className}`}
        {...rest}
      />
      <p
        className={`overflow-hidden text-xs text-red-600 transition-all duration-150 dark:text-red-400 ${
          error ? "h-4 opacity-100" : "h-0 opacity-0"
        }`}
      >
        {error ?? " "}
      </p>
    </div>
  );
}

// Native constraint-validation rules (required/type/minLength/pattern) define
// the checks; this just renders a nicer message than the browser's own bubble.
export function getFieldError(input: HTMLInputElement, label: string): string | null {
  const v = input.validity;
  if (v.valueMissing) return `${label} is required.`;
  if (v.typeMismatch) return `Enter a valid ${label.toLowerCase()}.`;
  if (v.tooShort) return `${label} must be at least ${input.minLength} characters.`;
  if (v.patternMismatch) return `${label} doesn't look right.`;
  return null;
}
