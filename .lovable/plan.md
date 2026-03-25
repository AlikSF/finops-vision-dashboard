

# Refactor Dashboard into 3 Top-Level Tabs

## Summary

Replace the current 6 sub-tabs with 3 top-level workspaces: **Salesforce Usage**, **Community / ePortal Usage**, and **License Usage**. Each tab pre-filters data independently. Sidebar filters scope to the active tab.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Top-level Tabs (in Index.tsx)                  │
│  [Salesforce Usage] [Community/ePortal] [License]│
└─────────────────────────────────────────────────┘
         │                  │              │
         ▼                  ▼              ▼
   SalesforceUsageTab  CommunityTab   LicenseUsageTab
   (pre-filtered to    (pre-filtered  (org-level pool
    licenseName =       to community   data + add-on
    "Salesforce")       licenses)      adoption detail)
```

## Changes

### 1. New file: `src/components/tabs/SalesforceUsageTab.tsx`

- **Props**: `users` (already filtered to Salesforce license), `allSfUsers` (unfiltered SF users for totals), `loginHistory`, `hasLoginHistory`, `licensePool`, `pslPool`
- **Toggle**: "Include System & Integration" checkbox (default off) — filters out Automated/System and Integration/Technical from charts
- **KPIs** (9 cards, 3x3 grid):
  - Total SF Users in Scope | SF License Pool (from licensePool where name="Salesforce") | SF Licenses Used
  - SF Licenses Available | Active (30d) | At Risk (31-90d)
  - Ghost (>90d) | Never Used | Reassignment Candidates (Ghost + Never Used, excluding system/integration)
- **Sub-tabs** within this tab: Overview | By Profile | By Role | By Team/Function | Activity | User Detail
  - Reuse existing `ProfileAnalysisTab`, `RoleAnalysisTab`, `ActivityAnalysisTab`, `UserDetailTab` components by passing pre-filtered users
  - Overview: status pie, team/function bar chart, most active users
  - All charts exclude system/integration unless toggle is on

### 2. New file: `src/components/tabs/CommunityUsageTab.tsx`

- **Props**: `users` (filtered to community licenses), `loginHistory`, `hasLoginHistory`
- **Pre-filter logic**: licenseName matches "Customer Community Login" or "Customer Community Plus Login"
- **KPIs** (8 cards):
  - Total ePortal Users | B2B Users | B2C Users | External/Community Other
  - Active (30d) | At Risk | Ghost | Never Used
  - Community Adoption Rate = Active / Total
- **Charts/tables**:
  - B2B vs B2C vs Other pie chart
  - Status distribution pie
  - Usage by profile (horizontal bar)
  - Usage by role if available
  - Login trend (if login history exists)
  - User detail table (reuse `UserDetailTab`)

### 3. New file: `src/components/tabs/LicenseUsageTab.tsx`

- **Props**: `users` (all enriched users), `licensePool`, `pslPool`, `pslAssignments`
- **Section A: Primary License Pool** — table from `licensePool`: Type, Total, Used, Available, Utilization %
- **Section B: Add-on / PSL Pool** — table from `pslPool`: Name, Total, Used, Available, Utilization %
- **Section C: Add-on Adoption Detail** — dropdown to select an add-on license (default: first available, highlight CRM Analytics)
  - For selected add-on: find all users with that add-on in `addOnLicenses`
  - Show: Total licenses, Assigned, Active assigned, Inactive assigned, Never used assigned, Reassignment candidates
  - Breakdown tables: by profile, by role, by team/function

### 4. Update `src/pages/Index.tsx`

- Replace current 6-tab structure with 3 top-level tabs
- Pre-compute `sfUsers` = `enrichedUsers.filter(u => u.licenseName === "Salesforce")`
- Pre-compute `communityUsers` = `enrichedUsers.filter(u => ["Customer Community Login", "Customer Community Plus Login"].includes(u.licenseName))`
- Apply sidebar filters scoped per tab (filters only apply within the active tab's pre-filtered set)
- Keep toolbar with CategoryRuleEditor and Save Snapshot

### 5. Update `src/components/AppSidebar.tsx`

- Receive `activeTab` prop to scope filter options to the active tab's user set
- For Salesforce tab: show Category (limited to SF categories), Status, Profile, Role, Department, Add-on filters
- For Community tab: show Category (B2C/B2B/Other), Status, Profile filters
- For License tab: hide user-level filters (this tab is org-level)

### 6. Update `src/components/DashboardLayout.tsx`

- Pass `activeTab` prop through to sidebar

### 7. Files to remove or deprecate

- `src/components/tabs/OverviewTab.tsx` — logic absorbed into SalesforceUsageTab
- `src/components/tabs/LicenseAnalysisTab.tsx` — replaced by LicenseUsageTab
- Keep `ProfileAnalysisTab`, `RoleAnalysisTab`, `ActivityAnalysisTab`, `UserDetailTab` as reusable sub-components

## Files Modified

1. `src/components/tabs/SalesforceUsageTab.tsx` — new
2. `src/components/tabs/CommunityUsageTab.tsx` — new  
3. `src/components/tabs/LicenseUsageTab.tsx` — new (replaces LicenseAnalysisTab)
4. `src/pages/Index.tsx` — rewrite tab structure, pre-filter logic
5. `src/components/AppSidebar.tsx` — add activeTab-aware filter scoping
6. `src/components/DashboardLayout.tsx` — pass activeTab prop
7. `src/components/tabs/OverviewTab.tsx` — remove (absorbed)
8. `src/components/tabs/LicenseAnalysisTab.tsx` — remove (replaced)

