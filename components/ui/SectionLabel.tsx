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
        "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {withDot && (
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      )}
      <span>{children}</span>
    </div>
  );
}
