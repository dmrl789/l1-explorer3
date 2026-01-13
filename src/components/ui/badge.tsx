import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500/20 text-emerald-300 [a&]:hover:bg-emerald-500/30",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 [a&]:hover:bg-slate-700",
        destructive:
          "border-transparent bg-red-500/20 text-red-300 [a&]:hover:bg-red-500/30",
        outline:
          "border-slate-700 text-slate-300 [a&]:hover:bg-slate-800 [a&]:hover:text-slate-100",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-300",
        warning:
          "border-transparent bg-amber-500/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
