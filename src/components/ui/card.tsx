import * as React from "react"
import { cn } from "@/lib/utils"

// Sticker card: 2px Ink outline and solid pop shadow. Use `interactive`
// for cards that are links so they lift on hover like buttons.
function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-4 rounded-3xl border-2 border-foreground bg-card p-6 text-card-foreground shadow-pop",
        interactive &&
          "transition-[translate,box-shadow,background-color] duration-150 ease-out hover:-translate-y-1 hover:shadow-pop-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-xl leading-tight font-extrabold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-base leading-relaxed", className)}
      {...props}
    />
  )
}

export { Card, CardTitle, CardDescription }
