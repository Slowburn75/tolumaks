import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] ring-offset-background transition-all duration-300 ease-luxury focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-foreground/20 bg-transparent hover:border-foreground hover:bg-foreground hover:text-background",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary tracking-[0.12em]",
        link: "text-foreground underline-offset-4 hover:underline tracking-[0.08em] normal-case text-sm font-normal",
      },
      size: {
        default: "h-12 px-7",
        sm: "h-10 px-5 text-[10px]",
        lg: "h-14 px-10 text-[11px]",
        xl: "h-16 px-12 text-xs",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
