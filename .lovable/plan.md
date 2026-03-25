

# License Optimization Dashboard — Implementation Plan

## Data Summary

The CSV contains 10 Salesforce users, all in the "Technology" department, all active, all with recent logins. The dashboard will be built to handle this data but designed to scale when more users are added.

## Architecture

### Files to Create/Modify

1. **`src/data/userData.ts`** — Parsed CSV data as a typed array, plus helper functions for computing KPIs (ghost users >90 days, at-risk >30 days, wasted spend at $150/user/month)

2. **`src/components/AppSidebar.tsx`** — INSEAD-style sidebar (dark green `#004225` background, white text) with navigation links: Dashboard, Users Table, Reports. Includes department and license type filter controls.

3. **`src/components/DashboardLayout.tsx`** — Layout wrapper using SidebarProvider with header containing SidebarTrigger

4. **`src/pages/Index.tsx`** — Main dashboard page containing:
   - **KPI Tiles** (4 cards): Total Licenses, Ghost Users, At-Risk Users, Estimated Wasted Spend — all reactive to filters
   - **Data Table** — Searchable, sortable table with color-coded Last Login column (red >90d, orange >30d, green recent) and Profile Name column
   - **Charts Section** — Pie chart for license distribution by Profile Name, Bar chart for inactive users by department (using Recharts via shadcn chart components)

5. **`src/index.css`** — Add INSEAD brand colors as CSS variables (dark green `#004225`, white, light gray accents)

### Design System (INSEAD Style)

- Primary: dark green `hsl(153, 100%, 13%)` (#004225)
- Background: white / light gray
- Cards: white with subtle shadow, green accent borders
- Typography: clean, professional, Inter/system font
- Sidebar: dark green background, white icons/text

### Filters & Interactivity

- Department filter dropdown in sidebar (currently all "Technology", but supports future departments)
- Search input above the table for filtering by name/email
- All KPI tiles and charts update reactively based on active filters
- Table columns: Name, Email, Profile Name, Department, Last Login (color-coded), Status badge

### Technical Details

- CSV data embedded as TypeScript constant (10 rows, no need for async loading)
- Date calculations use `differenceInDays` from `date-fns`
- Charts use existing Recharts/shadcn chart components
- Table uses shadcn Table components with client-side search/filter
- State managed with React `useState` for filters; `useMemo` for derived KPIs

