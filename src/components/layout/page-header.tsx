import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="grid gap-2">
        {eyebrow && (
          <p className="text-sm font-extrabold tracking-widest uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-black sm:text-5xl">{title}</h1>
        {description && (
          <p className="max-w-prose text-lg leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  )
}
