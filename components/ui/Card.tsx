import { cn } from "@/lib/utils";

type CardPadding = "default" | "sm" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  default: "p-6",
  sm: "p-4",
  lg: "p-8",
};

export function Card({
  padding = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-bg",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
