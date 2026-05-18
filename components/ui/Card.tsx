import { cn } from "@/lib/utils";

type CardPadding = "default" | "sm" | "lg" | "none";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  default: "py-5",
  sm: "py-4",
  lg: "py-6",
  none: "",
};

// Brutalist: pas de fond, pas de ring. Une "card" est simplement une section
// délimitée par un border-top. Le dernier enfant d'un container n'a pas de
// border-bottom (utiliser last:border-b-0 ou un parent qui contrôle).
export function Card({
  padding = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "border-t border-border text-foreground",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("label-mono", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props} />;
}
