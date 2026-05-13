import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "rounded-pill bg-cta-bg text-cta-fg font-medium hover:opacity-90",
        secondary:
          "text-fg-secondary hover:underline underline-offset-4 hover:text-fg",
        danger:
          "text-danger hover:underline underline-offset-4",
      },
      size: {
        default: "",
        sm: "",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "primary", size: "default", className: "px-6 py-[14px] text-base" },
      { variant: "primary", size: "sm", className: "px-4 py-[10px] text-sm" },
      { variant: "secondary", size: "default", className: "text-base py-2" },
      { variant: "secondary", size: "sm", className: "text-sm py-1" },
      { variant: "danger", size: "default", className: "text-base py-2" },
      { variant: "danger", size: "sm", className: "text-sm py-1" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

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
