import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Brutalist: angles vifs, borders 1px, mono uppercase pour les labels, pas
// d'ombre, pas de hover lift (juste color/bg flip).
export const button = cva(
  [
    "inline-flex items-center justify-center gap-2 cursor-pointer touch-manipulation",
    "border border-foreground text-[11px] font-mono font-medium tracking-[0.12em] uppercase whitespace-nowrap",
    "transition-colors duration-100 ease-out outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:opacity-80",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-background hover:bg-background hover:text-foreground",
        secondary:
          "bg-background text-foreground hover:bg-foreground hover:text-background",
        outline:
          "bg-transparent text-foreground hover:bg-foreground hover:text-background",
        ghost:
          "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
        success:
          "border-success bg-success text-background hover:bg-background hover:text-success",
        danger:
          "border-destructive bg-background text-destructive hover:bg-destructive hover:text-background",
        link:
          "border-transparent text-foreground underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-11 px-5 text-[12px]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  type?: "button" | "submit" | "reset";
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(button({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
