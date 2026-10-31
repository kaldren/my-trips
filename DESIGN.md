# Design System

Every new UI feature must follow this palette, type, and component style. Do not add colors outside the palette without asking.

The look is **tactile and playful**: rounded type, chunky 2px Ink outlines, solid "pop" shadows that make buttons and cards feel like stickers you can press, and bold green surfaces with big type.

## Palette

| Token       | Hex       | Role                                                                                     |
| ----------- | --------- | ---------------------------------------------------------------------------------------- |
| Green       | `#58CC02` | Brand color. Brand mark, large surfaces with large text (hero bands, panels), icon tiles, key map markers and routes. |
| Light green | `#89E219` | Supporting accent. Default (primary) button fill, active nav item, hover states, chips, avatars, selected-row backgrounds. |
| Ink         | `#4B4B4B` | All text and icons. Dark surfaces.                                                       |
| White       | `#FFFFFF` | Page background, cards, popovers, and text on Ink surfaces.                               |

## How to apply it

Components use semantic tokens (`bg-primary`, `text-foreground`, `border-border`, and so on), never raw hex values. These are the tokens to define in `src/app/globals.css`:

| shadcn variable                          | Value                   |
| ---------------------------------------- | ----------------------- |
| `--background`, `--card`, `--popover`    | `#FFFFFF`               |
| `--foreground` and every `*-foreground`  | `#4B4B4B`               |
| `--primary`                              | `#58CC02`               |
| `--primary-foreground`                   | `#4B4B4B`               |
| `--accent`, `--secondary`                | `#89E219`               |
| `--muted`                                | `#4B4B4B` at 5% opacity  |
| `--border`, `--input`                    | `#4B4B4B` at 20% opacity |
| `--ring`                                 | `#4B4B4B`               |
| `--chart-1` / `--chart-2` / `--chart-3`  | `#58CC02` / `#89E219` / `#4B4B4B` |
| `--radius`                               | `0.75rem` (12px)        |

Additional tokens and utilities defined in `globals.css`:

| Token / utility                     | Value                          | Use                                                        |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `shadow-pop-sm` / `shadow-pop` / `shadow-pop-lg` | `0 2px` / `0 4px` / `0 6px` solid Ink, no blur | Tactile edge under buttons, cards, active nav, brand mark |
| `bg-dots`                           | Ink dot grid at 12% opacity, 24px | Decorative "map paper" texture for heroes, empty states, illustration frames |
| `font-sans`, `font-heading`         | Nunito (`--font-nunito`)       | All text                                                   |

### Rules

- **No raw colors in components.** Do not use hex values, `rgb()`, or Tailwind's default palette (`bg-green-500`, `text-gray-700`) in feature or shared UI. If you need a role that has no token, add the token to `globals.css` and list it here.
- **Only one text color.** All text is `#4B4B4B` on light surfaces and `#FFFFFF` on Ink surfaces. Show hierarchy with size and weight, not a lighter gray.
- **Green is never text.** Do not set text, icons that carry meaning, or thin lines in either green on white. They are too faint to read (see below).
- **Never put white text on green.** Text on `#58CC02` or `#89E219` is always `#4B4B4B`.
- **Use opacity tints only for decoration.** You may use Ink at reduced opacity for borders, dividers, and subtle backgrounds. Do not use it for text.
- **The two greens are not a pair.** `#58CC02` and `#89E219` have almost the same contrast (1.29:1), so they must not be the only thing that tells two states or series apart. Add a label, an icon, a pattern, or Ink.
- **Destructive and error states** keep the existing shadcn `--destructive` red. It is the only color allowed outside the palette, and only for errors and destructive actions.
- **Light mode only** until a dark palette is defined here.

## Typography

**Font: [Nunito](https://fonts.google.com/specimen/Nunito)**, loaded with `next/font/google` in `src/app/layout.tsx` and exposed as `--font-nunito`. It is a rounded sans that matches the friendly, rounded shapes of the UI, stays very legible at body sizes, and has a variable weight axis up to Black (900), so one family covers both headings and body.

Show hierarchy with **size and weight only**. There is one text color.

| Role                 | Classes                                         | Size / weight     |
| -------------------- | ----------------------------------------------- | ----------------- |
| Display (hero)       | `text-5xl sm:text-6xl lg:text-7xl font-black`   | 48–72px / 900     |
| Page title (`h1`)    | `text-4xl sm:text-5xl font-black`               | 36–48px / 900     |
| Section title (`h2`) | `text-2xl font-extrabold`                       | 24px / 800        |
| Card title (`h3`)    | `text-xl font-extrabold`                        | 20px / 800        |
| Eyebrow              | `text-sm font-extrabold uppercase tracking-widest` | 14px / 800     |
| Lead                 | `text-lg` or `text-xl leading-relaxed`          | 18–20px / 400     |
| Body                 | `text-base leading-relaxed`                     | 16px / 400        |
| Label, small UI      | `text-sm font-bold`                             | 14px / 700        |
| Buttons              | `font-extrabold`, size from the button scale    | 14–18px / 800     |

Headings get `tracking-tight` and `text-balance` from the base layer. Never use body text smaller than 14px.

## Shape and elevation

- **Outlines:** interactive and elevated elements (buttons, cards, icon tiles, the brand mark, active nav) use a **2px Ink border** (`border-2 border-foreground`). Inputs and quiet dividers use `border-2 border-input` (Ink at 20%).
- **Pop shadows:** elevated elements sit on a solid Ink shadow (`shadow-pop`). There are no blurred shadows.
- **Motion:** on hover, interactive elements lift (`-translate-y-0.5`, shadow grows to `shadow-pop-lg`). On press they sink (`translate-y-0.5`, shadow shrinks to `shadow-pop-sm`). Transitions take 150ms ease-out and turn off under `prefers-reduced-motion`.
- **Radius:** controls `rounded-2xl` (18px; `rounded-xl` for small sizes), cards `rounded-3xl` (24px), hero panels `rounded-[2.5rem]`, chips and avatars `rounded-full`.
- **Playful tilt:** decorative frames and icon tiles may be rotated slightly (`-rotate-1` to `rotate-3`). Never tilt text-heavy content or form controls.

## Buttons

Buttons are big and chunky. Use `Button` from `@/components/ui/button`, or `buttonVariants()` on a `Link`.

| Size      | Height | Text         | Use                                    |
| --------- | ------ | ------------ | -------------------------------------- |
| `xs`      | 32px   | 12px         | Dense inline controls only             |
| `sm`      | 40px   | 14px         | Header and toolbar actions             |
| `default` | 48px   | 16px         | Most actions                           |
| `lg`      | 56px   | 18px         | Hero calls to action, sign-in, primary page actions |
| `icon*`   | 32 / 40 / 48 / 56px squares | — | Icon-only. Always give them an accessible name |

| Variant       | Look                                                        | Use                                  |
| ------------- | ----------------------------------------------------------- | ------------------------------------ |
| `default`     | Light green fill, Ink outline, pop shadow                   | The main action on a screen          |
| `outline`     | White fill, Ink outline, pop shadow, light green on hover   | Secondary actions; actions on green surfaces |
| `secondary`   | Ink 5% fill, no outline                                     | Low-emphasis actions                 |
| `ghost`       | Transparent, Ink 5% on hover                                | Back links, tertiary actions         |
| `destructive` | White fill, red outline, text, and shadow                   | Destructive actions only             |
| `link`        | Ink text with a 2px underline                               | Inline text links                    |

Why primary buttons are Light green rather than Green: button labels are 14–18px, which fails contrast on `#58CC02` (see below). Green is kept for surfaces whose text is at least 24px.

## Patterns

Shared building blocks live in `src/components/`. Reuse them instead of restyling them:

- `layout/logo.tsx`: brand mark (a tilted green tile with a map pin) and wordmark.
- `layout/page-header.tsx`: eyebrow, page title, description, and optional actions.
- `layout/main-nav.tsx`: header pills on desktop and a bottom tab bar on mobile. The active item has a light green fill plus an Ink outline and shadow, and `aria-current="page"`.
- `ui/card.tsx`: sticker card. Pass `interactive` when the whole card is a link.
- `ui/icon-badge.tsx`: outlined icon tile in `primary`, `accent`, or `plain` tone.
- `ui/empty-state.tsx`: dashed outline, dot-grid background, a tilted icon tile, a title, and an optional action. Every empty list uses it.
- `ui/skeleton.tsx`: loading placeholders (Ink at 10%). Loading screens mirror the layout they replace and include an `sr-only` status message.
- `illustrations/route-illustration.tsx`: decorative SVG of a route between pins, drawn with token classes (`fill-primary`, `stroke-foreground`).

Page layout: content sits in `max-w-6xl` with `px-6`. Leave generous vertical rhythm (`gap-10` to `gap-12` between page sections).

## Accessibility (WCAG 2.2 AA)

| Foreground on background | Contrast | Normal text (4.5:1) | Large text and UI parts (3:1) |
| ------------------------ | -------- | ------------------- | ----------------------------- |
| `#4B4B4B` on `#FFFFFF`   | 8.72:1   | Pass                | Pass                          |
| `#FFFFFF` on `#4B4B4B`   | 8.72:1   | Pass                | Pass                          |
| `#4B4B4B` on `#89E219`   | 5.38:1   | Pass                | Pass                          |
| `#4B4B4B` on `#58CC02`   | 4.18:1   | **Fail**            | Pass                          |
| `#58CC02` on `#FFFFFF`   | 2.09:1   | Fail                | **Fail**                      |
| `#FFFFFF` on `#58CC02`   | 2.09:1   | Fail                | Fail                          |
| `#89E219` on `#FFFFFF`   | 1.62:1   | Fail                | Fail                          |

What this means in practice:

- **Text on `#58CC02` must be large:** at least 24px, or at least 18.66px (14pt) bold. For standard-size labels such as 14–16px button text, use `#89E219` as the background instead.
- **Green shapes on white must have an outline.** Green controls, map markers, and route lines sit below 3:1 against white, so give them an Ink (`#4B4B4B`) outline or border, or a white halo when they sit on a map.
- **Focus rings are Ink** (`--ring: #4B4B4B`), never green. Controls use a 3px Ink outline with an offset (`focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring`).

## Checklist for new UI

- [ ] Uses only semantic tokens; no hex values or default Tailwind colors
- [ ] All text is `#4B4B4B` (or `#FFFFFF` on Ink)
- [ ] No white text on green; no green text on white
- [ ] Text on `#58CC02` is large or bold-large; smaller labels use `#89E219`
- [ ] Green shapes and markers on white or the map have an Ink outline or white halo
- [ ] Focus states are visible and use the Ink ring
- [ ] States are not told apart by the two greens alone
- [ ] Text is Nunito and follows the type scale; hierarchy comes from size and weight
- [ ] Buttons use the `Button` sizes (48px default) and variants; no custom button styles
- [ ] Elevated and interactive elements use the 2px Ink outline and `shadow-pop`; motion respects reduced-motion
