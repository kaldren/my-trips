# Design System

Every new UI feature must follow this palette, type, and component style. Do not add colors outside the palette without asking.

The look is **tactile and playful**: rounded type, chunky 2px Ink outlines, solid "pop" shadows that make buttons and cards feel like stickers you can press, and sunny Lemon surfaces with big type over a warm Cream page.

## Palette

| Role       | Name        | Hex       | Used for                                                        |
| ---------- | ----------- | --------- | --------------------------------------------------------------- |
| Primary    | Lemon       | `#FFD23F` | Main buttons, logo tile, CTA banner, active nav item, hero panels |
| Secondary  | Mint-lime   | `#7CCF8A` | Badges, chips, avatars, secondary icon tiles                    |
| Accent     | Tangerine   | `#FF8A3D` | Map pins, route line, flag, highlights, "new" markers           |
| Land       | Lemon sand  | `#FFF3C4` | Map land, soft section fills                                    |
| Water      | Sky mint    | `#C4ECF2` | Lakes and sea on the map, info callouts                         |
| Background | Cream       | `#FFFDF5` | Page, cards, popovers                                           |
| Ink        | Olive-black | `#1F2414` | All text and icons, outlines, chunky borders, pop shadows       |

## How to apply it

Components use semantic tokens (`bg-primary`, `text-foreground`, `border-border`, `bg-land`, and so on), never raw hex values. These are the tokens defined in `src/app/globals.css`:

| Variable                                 | Value                    |
| ---------------------------------------- | ------------------------ |
| `--background`, `--card`, `--popover`    | Cream `#FFFDF5`          |
| `--foreground` and every `*-foreground`  | Ink `#1F2414`            |
| `--primary`                              | Lemon `#FFD23F`          |
| `--secondary`                            | Mint-lime `#7CCF8A`      |
| `--accent`                               | Tangerine `#FF8A3D`      |
| `--land` (`bg-land`, `fill-land`)        | Lemon sand `#FFF3C4`     |
| `--water` (`bg-water`, `fill-water`)     | Sky mint `#C4ECF2`       |
| `--muted`                                | Ink at 5% opacity        |
| `--border`, `--input`                    | Ink at 20% opacity       |
| `--ring`                                 | Ink                      |
| `--chart-1` … `--chart-5`                | Lemon / Mint-lime / Tangerine / Sky mint / Ink |
| `--radius`                               | `0.75rem` (12px)         |

Additional tokens and utilities defined in `globals.css`:

| Token / utility                     | Value                          | Use                                                        |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `shadow-pop-sm` / `shadow-pop` / `shadow-pop-lg` | `0 2px` / `0 4px` / `0 6px` solid Ink, no blur | Tactile edge under buttons, cards, active nav, brand mark |
| `bg-dots`                           | Ink dot grid at 12% opacity, 24px | Decorative "map paper" texture for heroes, empty states, illustration frames |
| `font-sans`, `font-heading`         | Nunito (`--font-nunito`)       | All text                                                   |

The map recolors the OpenFreeMap Positron basemap at load (`tintBasemap` in `src/lib/maps/style.ts`): land uses `--land` and water uses `--water`. Markers and the route use `--accent`.

### Rules

- **No raw colors in components.** Do not use hex values, `rgb()`, or Tailwind's default palette (`bg-yellow-300`, `text-gray-700`) in feature or shared UI. If you need a role that has no token, add the token to `globals.css` and list it here.
- **Only one text color.** All text is Ink. Show hierarchy with size and weight, not a lighter gray or a palette color.
- **Palette colors are fills, never text.** Do not set text, icons that carry meaning, or thin lines in Lemon, Mint-lime, Tangerine, Lemon sand, or Sky mint on Cream. They are too faint to read (see below).
- **Text on any palette fill is Ink.** Ink passes AA on every fill at every size, so there is no white text anywhere.
- **Colored shapes need an Ink outline.** No fill reaches 3:1 against Cream, so buttons, tiles, chips, pins, and panels carry a 2px Ink border (or a Cream halo on the map).
- **Colors are not the only signal.** The fills are close in lightness (Lemon vs Mint-lime 1.30:1, Mint-lime vs Tangerine 1.25:1), so they must not be the only thing that tells two states or series apart. Add a label, an icon, a pattern, or Ink.
- **Use opacity tints only for decoration.** You may use Ink at reduced opacity for borders, dividers, and subtle backgrounds. Do not use it for text.
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
| `default`     | Lemon fill, Ink outline, pop shadow                         | The main action on a screen          |
| `outline`     | Cream fill, Ink outline, pop shadow, Lemon on hover         | Secondary actions; actions on Lemon surfaces |
| `secondary`   | Ink 5% fill, no outline                                     | Low-emphasis actions                 |
| `ghost`       | Transparent, Ink 5% on hover                                | Back links, tertiary actions         |
| `destructive` | Cream fill, red outline, text, and shadow                   | Destructive actions only             |
| `link`        | Ink text with a 2px underline                               | Inline text links                    |

Ink labels on Lemon reach 11:1, so primary buttons can use any size in the scale.

## Patterns

Shared building blocks live in `src/components/`. Reuse them instead of restyling them:

- `layout/logo.tsx`: brand mark (a tilted Lemon tile with a map pin) and wordmark.
- `layout/page-header.tsx`: eyebrow, page title, description, and optional actions.
- `layout/main-nav.tsx`: header pills on desktop and a bottom tab bar on mobile. The active item has a Lemon fill plus an Ink outline and shadow, and `aria-current="page"`.
- `ui/card.tsx`: sticker card. Pass `interactive` when the whole card is a link.
- `ui/icon-badge.tsx`: outlined icon tile in `primary` (Lemon), `secondary` (Mint-lime), `accent` (Tangerine), or `plain` (Cream) tone.
- `ui/empty-state.tsx`: dashed outline, dot-grid background, a tilted icon tile, a title, and an optional action. Every empty list uses it.
- `ui/skeleton.tsx`: loading placeholders (Ink at 10%). Loading screens mirror the layout they replace and include an `sr-only` status message.
- `illustrations/route-illustration.tsx`: decorative SVG of a route between Tangerine pins over Lemon sand land and a Sky mint lake, drawn with token classes (`fill-accent`, `fill-land`, `fill-water`, `stroke-foreground`).

Page layout: content sits in `max-w-6xl` with `px-6`. Leave generous vertical rhythm (`gap-10` to `gap-12` between page sections).

## Accessibility (WCAG 2.2 AA)

| Foreground on background       | Contrast | Normal text (4.5:1) | Large text and UI parts (3:1) |
| ------------------------------ | -------- | ------------------- | ----------------------------- |
| Ink on Cream `#FFFDF5`         | 15.61:1  | Pass                | Pass                          |
| Ink on Lemon sand `#FFF3C4`    | 14.29:1  | Pass                | Pass                          |
| Ink on Sky mint `#C4ECF2`      | 12.59:1  | Pass                | Pass                          |
| Ink on Lemon `#FFD23F`         | 11.01:1  | Pass                | Pass                          |
| Ink on Mint-lime `#7CCF8A`     | 8.44:1   | Pass                | Pass                          |
| Ink on Tangerine `#FF8A3D`     | 6.78:1   | Pass                | Pass                          |
| Tangerine on Cream             | 2.30:1   | Fail                | **Fail**                      |
| Mint-lime on Cream             | 1.85:1   | Fail                | Fail                          |
| Lemon on Cream                 | 1.42:1   | Fail                | Fail                          |
| Sky mint / Lemon sand on Cream | 1.24 / 1.09:1 | Fail           | Fail                          |

What this means in practice:

- **Ink text works on every fill**, at any size in the type scale.
- **Colored shapes on Cream must have an outline.** Every fill sits below 3:1 against Cream, so controls, tiles, chips, and panels get a 2px Ink border. Map markers and the route get an Ink border or a Cream halo.
- **Lemon sand and Sky mint are surfaces, not boundaries.** They are almost invisible against Cream, so a section or callout that needs an edge gets an Ink border.
- **Focus rings are Ink** (`--ring`), never a palette color. Controls use a 3px Ink outline with an offset (`focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring`).

## Checklist for new UI

- [ ] Uses only semantic tokens; no hex values or default Tailwind colors
- [ ] All text is Ink
- [ ] No palette color used for text, meaningful icons, or thin lines
- [ ] Colored shapes and map markers have an Ink outline or Cream halo
- [ ] Focus states are visible and use the Ink ring
- [ ] States are not told apart by fill color alone
- [ ] Text is Nunito and follows the type scale; hierarchy comes from size and weight
- [ ] Buttons use the `Button` sizes (48px default) and variants; no custom button styles
- [ ] Elevated and interactive elements use the 2px Ink outline and `shadow-pop`; motion respects reduced-motion
