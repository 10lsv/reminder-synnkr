import { cn } from "@/lib/utils";

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  withDot?: boolean;
}

export function SectionLabel({
  withDot = false,
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs uppercase tracking-label text-fg-tertiary",
        className,
      )}
      {...props}
    >
      {withDot && (
        <span aria-hidden className="text-accent leading-none">
          ●
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}
