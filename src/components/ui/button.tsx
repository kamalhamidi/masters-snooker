import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariantsBase = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-emerald-accent text-[#031b13] hover:bg-emerald-bright shadow-sm shadow-emerald-accent/15",
        gold: "bg-gold text-black hover:bg-gold-soft shadow-lg shadow-gold/20",
        secondary:
          "bg-surface border border-border-strong text-foreground hover:bg-surface-hover",
        ghost: "text-muted hover:text-foreground hover:bg-surface-hover",
        danger: "bg-live/10 text-live border border-live/30 hover:bg-live/20",
        outline:
          "border border-emerald-accent/50 text-emerald-bright hover:bg-emerald-accent/10",
      },
      size: {
        sm: "h-11 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariantsBase>;

export function buttonVariants(
  props?: Parameters<typeof buttonVariantsBase>[0],
) {
  return cn(buttonVariantsBase(props));
}

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariantsBase };
