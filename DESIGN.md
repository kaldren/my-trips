# Design Palette

Every new UI feature must follow this palette. Do not add colors outside it without asking.

## Palette

| Token       | Hex       | Role                                                                                     |
| ----------- | --------- | ---------------------------------------------------------------------------------------- |
| Green       | `#58CC02` | Brand color. Primary actions, active/selected state, key map markers and routes.         |
| Light green | `#89E219` | Supporting accent. Hover and pressed states, highlights, chips, selected-row backgrounds. |
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

### Rules

- **No raw colors in components.** Do not use hex values, `rgb()`, or Tailwind's default palette (`bg-green-500`, `text-gray-700`) in feature or shared UI. If you need a role that has no token, add the token to `globals.css` and list it here.
- **Only one text color.** All text is `#4B4B4B` on light surfaces and `#FFFFFF` on Ink surfaces. Show hierarchy with size and weight, not a lighter gray.
- **Green is never text.** Do not set text, icons that carry meaning, or thin lines in either green on white. They are too faint to read (see below).
- **Never put white text on green.** Text on `#58CC02` or `#89E219` is always `#4B4B4B`.
- **Use opacity tints only for decoration.** You may use Ink at reduced opacity for borders, dividers, and subtle backgrounds. Do not use it for text.
- **The two greens are not a pair.** `#58CC02` and `#89E219` have almost the same contrast (1.29:1), so they must not be the only thing that tells two states or series apart. Add a label, an icon, a pattern, or Ink.
- **Destructive and error states** keep the existing shadcn `--destructive` red. It is the only color allowed outside the palette, and only for errors and destructive actions.
- **Light mode only** until a dark palette is defined here.

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
- **Focus rings are Ink** (`--ring: #4B4B4B`), never green.

## Checklist for new UI

- [ ] Uses only semantic tokens; no hex values or default Tailwind colors
- [ ] All text is `#4B4B4B` (or `#FFFFFF` on Ink)
- [ ] No white text on green; no green text on white
- [ ] Text on `#58CC02` is large or bold-large; smaller labels use `#89E219`
- [ ] Green shapes and markers on white or the map have an Ink outline or white halo
- [ ] Focus states are visible and use the Ink ring
- [ ] States are not told apart by the two greens alone
