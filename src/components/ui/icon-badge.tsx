import { cn } from "@/lib/utils"

// Rounded tile that holds an icon. Green fills always carry the Ink outline
// so they stay visible on white (DESIGN.md "Accessibility").
function IconBadge({
  className,
  tone = "primary",
  ...props
}: React.ComponentProps<"span"> & { tone?: "primary" | "accent" | "plain" }) {
  return (
    <span
      data-slot="icon-badge"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground [&_svg]:size-6 [&_svg]:stroke-[2.5]",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "accent" && "bg-accent text-accent-foreground",
        tone === "plain" && "bg-background text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { IconBadge }
