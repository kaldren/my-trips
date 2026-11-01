import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="inline-flex size-10 -rotate-6 items-center justify-center rounded-xl border-2 border-foreground bg-primary shadow-pop-sm"
      >
        {/* Ink pin with a White fill in both themes: it sits on Green. */}
        <MapPin className="size-5 fill-background stroke-[2.5] text-primary-foreground dark:fill-foreground" />
      </span>
      <span className="text-xl font-black tracking-tight whitespace-nowrap">My Trips</span>
    </span>
  )
}
