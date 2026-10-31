import { cn } from "@/lib/utils"

import { IconBadge } from "./icon-badge"

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-foreground/30 bg-dots px-6 py-14 text-center",
        className
      )}
    >
      <IconBadge className="size-16 rotate-3 shadow-pop [&_svg]:size-8">
        {icon}
      </IconBadge>
      <div className="grid max-w-sm gap-2">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {description && (
          <p className="text-base leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
