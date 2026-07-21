import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading = false, disabled, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`relative rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-neutral-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 ${className}`}
      {...rest}
    >
      <span className={loading ? "opacity-0" : "opacity-100"}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  );
}
