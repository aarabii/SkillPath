"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border bg-transparent font-sans tracking-wide text-sm whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-white/20 text-white hover:bg-white hover:text-black",
        outline: "border-white/20 bg-transparent text-white hover:bg-white/5",
        secondary:
          "border-transparent underline underline-offset-4 decoration-zinc-600 hover:decoration-white text-white",
        ghost: "border-transparent hover:bg-white/5 text-white",
        destructive: "border-red-500/20 text-red-500 hover:bg-red-500/10",
        link: "border-transparent text-white underline underline-offset-4 decoration-zinc-600 hover:decoration-white",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 px-3 text-xs",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-12 gap-2 px-6",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
