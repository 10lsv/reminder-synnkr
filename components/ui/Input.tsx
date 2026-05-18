import { useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Brutalist: pas de border-radius, border bottom only (style "form"),
// label uppercase mono.
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
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="label-mono">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-10 w-full min-w-0 border-0 border-b border-input bg-transparent px-0 text-base text-foreground",
          "transition-colors outline-none",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-foreground focus-visible:border-b-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          error && "border-destructive border-b-2",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="font-mono text-[11px] uppercase tracking-wider text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
