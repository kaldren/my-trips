import { cn } from "@/lib/utils"

const PIN = "M0 0C-11-14-16-22-16-31a16 16 0 1 1 32 0c0 9-5 17-16 31Z"

// Decorative trip route: Ink dashed path between green pins. Green shapes
// carry an Ink outline per DESIGN.md. Colors come from tokens via classes.
export function RouteIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 240"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* Land masses */}
      <path
        d="M24 150c10-34 52-46 78-30s30 52 4 66-92 2-82-36Z"
        className="fill-accent stroke-foreground"
        strokeWidth="3"
      />
      <path
        d="M196 40c30-14 82-6 96 22s-6 60-40 62-58-10-70-34 -16-38 14-50Z"
        className="fill-accent stroke-foreground"
        strokeWidth="3"
      />
      <path
        d="M214 176c18-8 48-4 54 12s-12 30-34 28-38-30-20-40Z"
        className="fill-background stroke-foreground"
        strokeWidth="3"
      />

      {/* Route */}
      <path
        d="M66 146C96 92 132 196 176 150S228 64 252 84"
        fill="none"
        className="stroke-foreground"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />

      {/* Pins */}
      {[
        { x: 66, y: 150, r: -8 },
        { x: 176, y: 154, r: 6 },
      ].map((p) => (
        <g key={p.x} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
          <path
            d={PIN}
            className="fill-primary stroke-foreground"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cy="-31" r="6" className="fill-background stroke-foreground" strokeWidth="3" />
        </g>
      ))}

      {/* Destination flag */}
      <g transform="translate(252 88)">
        <path d="M0 0V-46" className="stroke-foreground" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M0-46h30l-8 10 8 10H0Z"
          className="fill-primary stroke-foreground"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <ellipse cy="2" rx="12" ry="4" className="fill-foreground/20" />
      </g>
    </svg>
  )
}
