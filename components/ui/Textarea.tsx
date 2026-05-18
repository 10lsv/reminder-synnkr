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
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={textareaId} className="label-mono">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-[120px] w-full resize-y border border-input bg-transparent px-3 py-2.5 text-base text-foreground",
          "transition-colors outline-none",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          error && "border-destructive",
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
