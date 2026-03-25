

# Enhanced License Optimization Dashboard — Plan

## What's Changing

You'll add **Role** and **CreatedDate** to your CSV export. The dashboard will use **Profile** as the department/team grouping (since that's how INSEAD organizes Salesforce access), and add new analytical views for Role-based and Profile-based usage insights.

## New CSV Columns Needed

Add these to your Salesforce export:
- **`UserRole.Name`** — Role in the hierarchy
- **`CreatedDate`** — When the license was provisioned

## Data Model Update (`src/data/userData.ts`)

Add to `UserRecord`:
- `roleName: string` — mapped from `UserRole.Name`
- `createdDate: string | null` — mapped from `CreatedDate`

Update `parseCSV` to map these new headers. Add helpers:
- `getUniqueRoles(data)` — extract distinct roles
- `getUniqueProfiles(data)` — extract distinct profiles
- `getLicenseAge(createdDate)` — days since provisioned
- Update `computeKPIs` to include `activeUsers` count and `utilizationRate` (active / total as %)

## Sidebar Enhancements (`AppSidebar.tsx`)

Add new filter dropdowns:
- **Profile filter** (replaces current "Department" conceptually — Profile = team at INSEAD)
- **Role filter** — filter by Salesforce role

Rename "Department" filter label to "Profile" to match INSEAD's structure.

## Dashboard Enhancements (`Index.tsx`)

### New KPI Tiles (expand from 4 to 6)
1. Total Licenses (existing)
2. Active Users — new, shows count of users logged in within 30 days
3. Ghost Users (existing)
4. At-Risk Users (existing)
5. Utilization Rate — new, percentage badge (active/total)
6. Est. Wasted Spend (existing)

### New Charts (use Tabs to organize)

**Tab 1 — Overview** (current charts):
- Pie: License Distribution by Profile
- Bar: Inactive Users by Profile (rename from "Department")

**Tab 2 — Profile Analysis** (new):
- Horizontal Bar: Users per Profile — shows total, active, ghost stacked
- Table: Profile summary (profile name, total users, active %, ghost count, estimated waste)

**Tab 3 — Role Analysis** (new):
- Bar: Users by Role with activity status breakdown
- Table: Role summary (role name, user count, last login range, utilization %)

**Tab 4 — License Age** (new):
- Bar: License age distribution (0-30d, 30-90d, 90-180d, 180d-1yr, 1yr+) — helps identify long-held unused licenses
- Scatter or list: "Oldest ghost licenses" — longest-provisioned users who never/rarely log in

### Table Enhancements
Add columns:
- **Role** column
- **License Age** column (shows "X months" since CreatedDate)
- Add Role filter to sidebar filters

## Technical Details

- Use shadcn `Tabs` component (already exists) to organize chart sections
- All new charts use Recharts (already installed)
- Profile filter added to sidebar alongside existing filters
- All KPIs and charts remain reactive to all filters
- `parseCSV` updated to map `UserRole.Name` and `CreatedDate` with flexible header matching
- Sample CSV template updated to include the new columns

## Files Modified
1. `src/data/userData.ts` — new fields, helpers, updated parser + template
2. `src/pages/Index.tsx` — new KPIs, tabbed chart sections, table columns
3. `src/components/AppSidebar.tsx` — add Profile and Role filter dropdowns
4. `src/components/DashboardLayout.tsx` — pass new filter props

