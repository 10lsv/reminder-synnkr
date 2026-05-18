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
    <div className={cn("label-mono inline-flex items-center gap-2", className)} {...props}>
      {withDot && <span aria-hidden className="size-1 bg-foreground" />}
      <span>{children}</span>
    </div>
  );
}
