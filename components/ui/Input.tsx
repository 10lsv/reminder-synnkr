import { useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex w-full flex-col">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 text-base font-medium text-fg"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "rounded-pill border bg-bg px-4 py-3 text-base text-fg outline-none",
          "placeholder:text-fg-tertiary",
          "transition-colors duration-150 ease-out",
          "focus:border-fg",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
