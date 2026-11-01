import { cn } from "@/lib/utils"

// Rounded tile that holds an icon. Colored fills always carry the Ink outline
// so they stay visible on Cream (DESIGN.md "Accessibility").
function IconBadge({
  className,
  tone = "primary",
  ...props
}: React.ComponentProps<"span"> & { tone?: "primary" | "secondary" | "accent" | "plain" }) {
  return (
    <span
      data-slot="icon-badge"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground text-foreground [&_svg]:size-6 [&_svg]:stroke-[2.5]",
        tone === "primary" && "bg-primary",
        tone === "secondary" && "bg-secondary",
        tone === "accent" && "bg-accent",
        tone === "plain" && "bg-background",
        className
      )}
      {...props}
    />
  )
}

export { IconBadge }
