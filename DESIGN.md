---
version: alpha
name: maxiii-design-system
description: "A monochrome, Apple Fitness-style dark interface for Indian lifters and home cooks. Near-black canvas (#0A0A0A), graphite cards (#161616), white and grey type, and one accent: saffron (#FF8A1F) for the primary action and calories. Macros are told apart by shade, label and position, not by colour. Numbers are large and bold, the layout is quiet, and every screen has one clear action. Built around Indian portions (katori, ladle, phulka) and the cooked-yield engine."

colors:
  # Surfaces
  background: "#0A0A0A"          # Root canvas (never pure black)
  surface: "#161616"             # Cards, tab bar
  surface-raised: "#222222"      # Inputs, chips, secondary buttons, ring tracks
  surface-pressed: "#2C2C2C"     # Pressed and selected states
  border: "#2E2E2E"              # Dividers and input outlines only (cards have no border)

  # The only accent
  primary: "#FF8A1F"             # Saffron: main button, active tab, calories
  primary-pressed: "#E67A12"
  primary-muted: "rgba(255, 138, 31, 0.16)"
  on-primary: "#0A0A0A"          # Dark text on saffron, never white

  # Text
  text: "#F2F2F2"
  text-muted: "#9A9A9A"
  text-faint: "#858585"          # Units and captions (passes 4.5:1 on surface)

  # Status (the only other colour)
  danger: "#FF6B6B"              # Over target and errors only

  # Data shades (fixed; used only for rings, bars and macro marks)
  calories: "#FF8A1F"
  protein: "#FFFFFF"             # Brightest: lifter's priority metric
  carbs: "#BDBDBD"
  fats: "#959595"
  fibre: "#707070"
  ring-track: "#222222"

typography:
  large-title:
    fontSize: 34px
    fontWeight: 700
    letterSpacing: -0.4px
    lineHeight: 1.15
  title:
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
  number-hero:
    fontSize: 44px
    fontWeight: 700
    letterSpacing: -0.8px
    fontVariant: tabular-nums

rounded:
  sm: 8px
  md: 14px
  lg: 20px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px

components:
  bottom-tab-bar:
    background: "{colors.surface}"
    height: 64px
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.text-muted}"
  card:
    background: "{colors.surface}"
    borderRadius: "{rounded.lg}"
    padding: "{spacing.md}"
    border: none
    shadow: none
  button-primary:
    background: "{colors.primary}"
    textColor: "{colors.on-primary}"
    fontWeight: 600
    borderRadius: "{rounded.md}"
    minHeight: 50px
    width: 100%
  button-secondary:
    background: "{colors.surface-raised}"
    textColor: "{colors.text}"
    borderRadius: "{rounded.md}"
    minHeight: 44px
  text-input:
    background: "{colors.surface-raised}"
    border: "1px solid {colors.border}"
    focusBorder: "{colors.primary}"
    borderRadius: "{rounded.md}"
    minHeight: 44px
  filter-pill:
    background: "{colors.surface-raised}"
    activeBackground: "{colors.primary-muted}"
    activeTextColor: "{colors.primary}"
    borderRadius: "{rounded.pill}"
    minHeight: 36px
  source-badge:
    background: "{colors.surface-raised}"
    textColor: "{colors.text-muted}"
    borderRadius: "{rounded.pill}"
    fontSize: 11px
---

# MAXIII: Design Specification (DESIGN.md)

This is the design contract for MAXIII. Any developer or AI agent building or changing a screen follows it. Tokens live in `src/constants/theme.ts`; never type a hex code inside a screen.

---

## 1. Principles

1. **Monochrome with one accent.** Apple Fitness feel: near-black canvas, graphite cards, white and grey type, lots of empty space, one clear action per screen.
2. **Saffron is rare.** It marks the one thing to tap and the calorie budget. If everything is saffron, nothing is.
3. **Numbers lead.** Calories left and protein left are readable in under one second.
4. **Fast logging.** Gym-goers log 4 to 6 times a day. Logging a repeat meal takes two taps or fewer.
5. **Indian first.** Katori, ladle, phulka, cooked yield and regional-language search are core, not extras.
6. **Honest.** No fake precision, no medical claims.

---

## 2. Colour Rules

| Role | Token | Hex |
|---|---|---|
| Background | `background` | `#0A0A0A` |
| Card | `surface` | `#161616` |
| Input / chip / ring track | `surface-raised` | `#222222` |
| Divider | `border` | `#2E2E2E` |
| Main button, active tab, calories | `primary` | `#FF8A1F` |
| Main text | `text` | `#F2F2F2` |
| Secondary text | `text-muted` | `#9A9A9A` |
| Units, captions | `text-faint` | `#858585` |
| Over target, error | `danger` | `#FF6B6B` |

**Only two colours exist in the app:** saffron and danger red. Everything else is a grey.

**Data shades (fixed and non-negotiable):**

| Metric | Hex | Note |
|---|---|---|
| Calories | `#FF8A1F` | The one saffron data mark |
| Protein | `#FFFFFF` | Brightest, because it matters most |
| Carbs | `#BDBDBD` | |
| Fats | `#959595` | |
| Fibre | `#707070` | |

Rules:
- Data shades appear only on rings, bars and small macro marks. Never on buttons or backgrounds.
- Pure white is reserved for protein. Body text uses `#F2F2F2`. Never use pure `#000000` anywhere.
- Text on saffron is always `#0A0A0A`.
- "Target reached" is shown with a filled ring and a check icon, not a new colour.
- Macro order is always **Protein, Carbs, Fats, Fibre**.

### Telling macros apart without colour
Shade alone is not enough, so every macro mark follows these rules:
- **Always labelled.** Each ring, bar or number sits next to its name or letter (`Protein` or `P`, `Carbs` or `C`, `Fats` or `F`, `Fibre` or `Fi`).
- **Position is fixed.** Same order, same place, on every screen, so users learn it by position.
- **Show grams as numbers**, not only as graphics.
- **No stacked multi-macro charts.** In charts, draw one bar per macro with a label, or show one macro at a time. If a stacked bar is unavoidable, add 2 px gaps between segments and a letter legend.
- **Check at small size.** Rings under 48 px keep a letter inside or beside them.

---

## 3. Typography

- **Font:** system font (SF Pro on iOS, Roboto on Android). No custom fonts in v1.
- Large bold titles, small muted captions. Weights stay between 400 and 700.
- **Numbers:** bold, tabular figures (`fontVariant: ['tabular-nums']`) so values don't jump when they change.
- Units (`g`, `kcal`) use `text-faint` and a smaller size.
- **Rounding:** display numbers round to 1 decimal place. Database values keep full precision.
- **Regional scripts** (தமிழ், हिंदी, తెలుగు): add +2px line height so diacritics don't clip.

---

## 4. Layout and Components

- Cards are `surface` on `background`, 20px corners, **no border and no shadow**.
- Borders appear only on inputs and dividers.
- Screen padding is 16px. Spacing between cards is 16px.
- One full-width primary button per screen at most.
- Dark mode only in v1. A light theme can be added later by swapping the tokens.
- Tabs (default set, change if the product changes): **Today, Coach, Gear, Profile**.

### Today (home)
1. Greeting and date, large title.
2. **Calorie card:** big saffron ring with calories left in the centre (`number-hero`).
3. **Protein line** directly under the ring: `25 g to go` in white, with a `P` mark. Protein is the lifter's priority metric.
4. **Macro grid (2 x 2):** Protein, Carbs, Fats, Fibre. Each tile has its name, a small ring in its shade, grams eaten and grams target.
5. **Meals list:** Breakfast, Lunch, Snacks, Dinner, with a `+` row for each.
6. Quick actions: `Search & Log`, `Copy Yesterday`, `Quick Entry`.

### Food row
Name, portion (`1 katori`), kcal on the right, `P / C / F` values underneath in `text-muted`, and a small source badge. All macros are visible without opening the row.

### Add Food
Portion stepper with Indian units, a **Raw / Cooked** toggle, a live macro grid, and one `Add to Diary` button at the bottom (thumb zone).

### Source badges
Neutral pill (`surface-raised`, `text-muted`) with one of: `Cooked Yield`, `USDA`, `Label`. The `Cooked Yield` badge uses `primary-muted` background and `primary` text because it is MAXIII's signature feature.

---

## 5. Household Measures (Indian Portions)

Grams are always available as the precise option. Household units map to stored gram weights:

| Unit | Weight |
|---|---|
| Standard katori (cooked dal or curry) | 150 g |
| Small katori | 100 g |
| Big bowl / serving katori | 220 g |
| Medium phulka (no ghee) | 30 g (about 25 g atta dough) |
| Large tawa roti | 45 g |
| Curry ladle (karandi) | 75 to 80 g |
| Protein powder scoop | 30 to 33 g |

---

## 6. Yield Engine Contract

```
Raw weighed ingredients + (oil added - oil left in pan)
        -> cooking ->
Cooked pot weight
```

Always show:
- **Yield ratio**, e.g. `3.5x` for dal (absorbs water) or `0.75x` for roasted meat (loses water).
- **Energy density** in `kcal / g`, e.g. `1.21 kcal/g`.
- **Atwater check** with a 5% tolerance. Flag inputs that don't add up, using `danger` red.
- A **Save to Food Database** button, so the recipe can be logged later with no recalculation.

Result panel: `surface` card, saffron for the key result, greys for everything else.

---

## 7. Motion and Feel

- Rings animate in with a short ease-out (about 600 ms) on first load and when a value changes.
- Light haptic on `Add to Diary` and when a ring reaches 100%.
- Screen transitions use the platform default. No decorative animation.

---

## 8. Do and Don't

### Do
- Give protein prime placement with remaining grams.
- Label every macro mark with its name or letter.
- Show the data source on every food item.
- Keep all touch targets at 44 px or larger.
- Show the calorie floor (1,600 kcal minimum for males, 1,200 kcal for females) and this disclaimer: *"Accuracy depends on weighing ingredients. Not medical advice."*
- Keep logging actions in the bottom 60% of the screen.

### Don't
- Don't claim fake precision, such as "97% accurate".
- Don't add colours. The app has saffron, danger red and greys only.
- Don't use saffron for decoration or on more than one primary element per area.
- Don't rely on shade alone to identify a macro.
- Don't hide macros in deep menus.
- Don't use stock food photos, gradients or wellness slogans.
- Don't bundle ICMR-NIN IFCT 2017 data until a commercial licence is secured.

---

## 9. Responsive Behaviour

| Viewport | Width | Layout |
|---|---|---|
| Compact | up to 380 px | Macro grid stays 2 x 2 with smaller rings; tab labels are compact |
| Standard | 390 to 430 px | Default layout |
| Tablet / foldable | 600 px and up | Content centred, `max-width: 720px` |

Tab bar is 64 px high plus the safe-area inset for the iOS home indicator and Android gesture bar.

---

## 10. Agent Checklist

Before finishing any screen, verify:

1. [ ] Colours come from `src/constants/theme.ts`, with no raw hex values in components.
2. [ ] Only saffron, danger red and greys are used.
3. [ ] Macro order is Protein, Carbs, Fats, Fibre, and each mark has a label.
4. [ ] Saffron is used only for the primary action, the active tab and calories.
5. [ ] Every touch target is at least 44 px.
6. [ ] Numbers use tabular figures and round to 1 decimal place.
7. [ ] Regional-language text isn't clipped.
8. [ ] The disclaimer and calorie floor are intact.
9. [ ] `npx tsc --noEmit` and `npm test` pass.