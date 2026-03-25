

# Enhanced License & User Visibility for Salesforce Admin Decision-Making

## What This Solves

Right now, the License Usage tab shows pool-level numbers and breakdown summaries, but you cannot see **which specific users** hold a given license or add-on, their usage status, or identify who to deactivate. The Salesforce Usage tab also lacks per-user license detail (which add-ons each user has). This plan adds the drill-down views a senior admin needs.

## Changes

### 1. License Usage Tab -- Add Full User List to Add-on Adoption Detail

**File**: `src/components/tabs/LicenseUsageTab.tsx`

Currently Section C shows KPI cards and breakdown tables. Add below them:

- **Searchable user table** for the selected add-on license showing: Name, Profile, Role, Team/Function, Usage Status (color-coded badge), Last Login, Logins (30d), Days Since Login
- Sort by days since login descending (worst offenders first)
- Search input to filter by name/profile/role
- Status filter dropdown (All / Active / At Risk / Ghost / Never Used) so admins can quickly isolate ghost users holding that add-on
- Row count in header: "Users with CRM Analytics (47)"

### 2. License Usage Tab -- Make Primary License Pool Clickable

**File**: `src/components/tabs/LicenseUsageTab.tsx`

- Make each row in the Primary License Pool table clickable
- When clicked, show an expandable section (or inline panel) listing all users with that `licenseName`, with the same columns as above (Name, Profile, Role, Status, Last Login, Logins 30d)
- This lets admins click "Salesforce" and see 200 users, or click "Customer Community Login" and see 5000 portal users, with their status breakdown

### 3. Salesforce Usage Overview -- Add "Assigned Add-ons" Column

**File**: `src/components/tabs/SalesforceUsageTab.tsx`

- Add an "Add-on Licenses" column to the "All Salesforce Users" table showing a comma-separated list of add-ons each user holds (from `u.addOnLicenses`)
- This gives admins instant visibility into who has CRM Analytics, Sales Cloud Einstein, etc. alongside their usage status

### 4. Salesforce Insights -- Add "Never Used" Users Table

**File**: `src/components/tabs/SalesforceInsightsTab.tsx`

- Add a fourth table: "Never Used Users" (usageStatus === "Never Used") -- these are assigned a license but have literally never logged in
- Same columns as Ghost table: Name, Profile, Role, Team/Function, Created Date
- This is a critical deactivation list for admins

## Technical Details

- Primary license drill-down uses state `selectedPrimaryLicense: string | null` to toggle an inline user table below the pool table
- Add-on user table reuses `addOnUsers` array already computed, adds search + status filter via `useState`
- All tables use existing `Table`, `Badge`, `Input` components
- No new data/SOQL needed -- all fields exist in current CSVs

## Files Modified

1. `src/components/tabs/LicenseUsageTab.tsx` -- clickable primary pool rows + full user list in add-on detail
2. `src/components/tabs/SalesforceUsageTab.tsx` -- add "Add-on Licenses" column to overview table
3. `src/components/tabs/SalesforceInsightsTab.tsx` -- add "Never Used" users table

