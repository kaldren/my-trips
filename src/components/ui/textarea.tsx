import * as React from "react"
import { cn } from "cn"

// Matches Input: 2px Ink-20% outline, Ink focus ring with offset.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-base leading-relaxed font-semibold transition-colors outline-none placeholder:font-normal placeholder:text-muted-foreground hover:border-foreground/40 focus-visible:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
