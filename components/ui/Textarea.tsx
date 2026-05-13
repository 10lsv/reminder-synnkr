import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex w-full flex-col">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-2 text-base font-medium text-fg"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-[120px] resize-y rounded-lg border bg-bg px-4 py-3 text-base text-fg outline-none",
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
