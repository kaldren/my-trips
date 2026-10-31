import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Tactile buttons: 2px Ink outline, solid Ink "pop" shadow, lift on hover,
// press down on click. See DESIGN.md "Buttons".
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border-2 border-transparent bg-clip-padding font-extrabold whitespace-nowrap transition-[translate,box-shadow,background-color] duration-150 ease-out outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-accent text-accent-foreground shadow-pop hover:-translate-y-0.5 hover:shadow-pop-lg active:translate-y-0.5 active:shadow-pop-sm motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
        outline:
          "border-foreground bg-background text-foreground shadow-pop hover:-translate-y-0.5 hover:bg-accent hover:shadow-pop-lg active:translate-y-0.5 active:shadow-pop-sm aria-expanded:bg-accent motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
        secondary:
          "bg-muted text-foreground hover:bg-foreground/10 aria-expanded:bg-foreground/10",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-destructive bg-background text-destructive shadow-[0_4px_0_0_var(--destructive)] hover:bg-destructive/10 active:translate-y-0.5 active:shadow-[0_2px_0_0_var(--destructive)]",
        link: "rounded-md px-0 text-foreground underline decoration-2 underline-offset-4 hover:decoration-[3px]",
      },
      size: {
        default:
          "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 gap-1 rounded-xl px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-10 gap-1.5 rounded-xl px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 gap-2.5 px-7 text-lg has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6 [&_svg:not([class*='size-'])]:size-6",
        icon: "size-12",
        "icon-xs": "size-8 rounded-xl [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
