

# Dashboard Readability & Polish — Plan

## Problems Identified from Screenshot

1. **Pie chart labels overlap badly** — With 20+ profiles, the inline labels stack on top of each other and are unreadable
2. **Bar chart X-axis labels overlap** — Profile names are long ("Programme Manager (CSP)") and crowd together
3. **KPI tiles cramped** — 6 tiles across on one row makes text small and hard to scan
4. **Charts too short** — 280px height is insufficient for the data density
5. **No visual breathing room** — Everything is packed tightly

## Changes

### 1. Fix Pie Chart (`Index.tsx` — Overview tab)
- Remove inline labels entirely — they don't work with 20+ slices
- Add a scrollable legend list beside the pie instead (two-column layout: pie left, legend right)
- Show top 8 profiles in the pie, group the rest as "Other"
- Use Recharts `Tooltip` for detail on hover

### 2. Fix Bar Charts (`Index.tsx` — all tabs)
- Increase chart height from 280px to 380px
- For Overview "Activity by Profile" bar chart: switch to **horizontal layout** (`layout="vertical"`) so long profile names display properly on the Y-axis
- Add `tick={{ fontSize: 11 }}` to axes for readability
- Limit to top 10 profiles by user count, group rest as "Other"

### 3. Improve KPI Tiles Layout
- Change grid from `xl:grid-cols-6` to `lg:grid-cols-3 xl:grid-cols-3` — show 3 per row (2 rows of 3)
- Increase font size of values from `text-2xl` to `text-3xl`
- Add more padding inside cards

### 4. Table Readability
- Truncate long emails with `max-w-[200px] truncate`
- Add alternating row backgrounds via `even:bg-muted/30`
- Make table text slightly larger

### 5. General Spacing
- Increase gap between sections from `mb-6` to `mb-8`
- Add subtle card shadows for depth
- Increase chart container heights consistently to 380px

## Files Modified
1. `src/pages/Index.tsx` — All visual changes above

