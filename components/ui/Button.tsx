import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const button = cva(
  [
    "inline-flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation",
    "rounded-lg border border-transparent text-sm font-medium whitespace-nowrap",
    "transition-all duration-200 ease-out outline-none select-none transform-gpu",
    "hover:-translate-y-px active:scale-[0.97] active:translate-y-0 active:duration-75",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-background text-foreground hover:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        success:
          "bg-success text-white hover:bg-success/90",
        danger:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-[0.8rem] rounded-md",
        lg: "h-10 px-4",
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
