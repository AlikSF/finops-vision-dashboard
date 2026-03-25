

# Add "Insights" Sub-Tab to Salesforce Usage

## Summary

Add a new **Insights** sub-tab under Salesforce Usage that provides actionable user lists (At Risk, Ghost, Admins) and a "Last Login by Month" bar chart showing how many users last logged in per month over the past 6 months.

## New File: `src/components/tabs/SalesforceInsightsTab.tsx`

**Props**: `users: EnrichedUser[]` (the displayUsers from SalesforceUsageTab, already filtered by system toggle)

### Content

1. **Last Login by Month bar chart** — Group users by the month of their `lastLoginDate` for the last 6 months. Each bar = count of users whose last login falls in that month. Uses recharts `BarChart`. Users with no login excluded from chart.

2. **At Risk Users table** — Filter `usageStatus === "At Risk"`, show Name, Profile, Role, Team/Function, Last Login Date, Days Since Login. Sorted by days since login descending.

3. **Ghost Users table** — Same columns, filter `usageStatus === "Ghost"`.

4. **Admin Users table** — Filter `derivedCategory === "Internal Admin"`, show Name, Profile, Role, Usage Status, Last Login Date, Logins (30d).

Each section in its own `Card`. Tables use the existing `Table` components with scroll overflow.

## Update: `src/components/tabs/SalesforceUsageTab.tsx`

- Import `SalesforceInsightsTab`
- Add `<TabsTrigger value="insights">Insights</TabsTrigger>` after "Overview"
- Add `<TabsContent value="insights"><SalesforceInsightsTab users={displayUsers} /></TabsContent>`

## Technical Details

- Bar chart X-axis: month labels (e.g., "Oct 2025", "Nov 2025"); Y-axis: user count
- Use `date-fns` `format` and `subMonths` to compute the 6-month range
- Users whose `lastLoginDate` is older than 6 months grouped into an implicit "older" bucket or excluded

