import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-3 py-1 font-sans text-[10px] tracking-widest uppercase whitespace-nowrap transition-all focus-visible:outline-none [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-white/20 bg-transparent text-white [a]:hover:bg-white/5",
        secondary:
          "border-zinc-800 bg-transparent text-zinc-400 [a]:hover:bg-white/5",
        destructive: "border-red-500/20 text-red-500 [a]:hover:bg-red-500/10",
        outline: "border-zinc-800 text-zinc-300 [a]:hover:border-white/20",
        ghost: "hover:bg-white/5 text-zinc-300",
        link: "text-white underline underline-offset-4 decoration-zinc-600 hover:decoration-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
