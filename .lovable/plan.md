

# Multi-File Salesforce License Optimization Dashboard — Plan

## Summary

Complete rebuild of the data layer and dashboard to support 5 CSV files with relational joins, derived user categories, editable classification rules, 6 dashboard tabs, expanded KPIs, and snapshot comparison.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────┐
│  Upload Zone (multi-file, per-file type detection)  │
│  users_master / login_history / license pools / PSL │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│  Data Engine (useDataStore hook)                    │
│  - Parse each CSV independently                    │
│  - Join users ↔ login_history by UserId            │
│  - Join users ↔ PSL assignments by AssigneeId      │
│  - Join PSL assignments ↔ PSL pool by LicenseId    │
│  - Match user license → user_license_pool.Name     │
│  - Derive User Category from rules                 │
│  - Save snapshots with timestamps to IndexedDB     │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│  Dashboard (filters → KPIs → tabs → detail table)  │
│  Default: Internal Business Users only              │
└─────────────────────────────────────────────────────┘
```

---

## New Files

### 1. `src/data/dataModels.ts` — Interfaces & Types

- `RawUser` — parsed from users_master.csv (id, username, name, email, profileName, userType, roleName, department, licenseName, isActive, lastLoginDate, createdDate, title, etc.)
- `LoginRecord` — parsed from login_history (userId, loginTime, status, sourceIp, loginType, application)
- `UserLicensePool` — from user_license_pool (name, totalLicenses, usedLicenses)
- `PSLPool` — from permission_set_license_pool (id, masterLabel, totalLicenses, usedLicenses)
- `PSLAssignment` — from permission_set_license_assignments (assigneeId, permissionSetLicenseId)
- `EnrichedUser` — the joined record: RawUser + loginCounts (7d/30d/90d) + addOnLicenses (string[]) + derivedCategory + usageStatus
- `CategoryRule` — { id, category, field, operator, value } for editable rules
- `DataSnapshot` — { id, timestamp, files: record of which files uploaded, enrichedUsers }

### 2. `src/data/categoryRules.ts` — User Category Derivation

Default rules (evaluated in priority order):
1. **Automated/System**: name === "Automated Process" OR username matches `/autoproc|noreply|service|sync|bot/i`
2. **Integration**: profileName matches `/integration/i` OR username/email matches `/integration|api|mulesoft|talend|etl/i`
3. **Admin**: profileName matches `/administrator|admin/i` (but NOT already Integration)
4. **External/Community**: profileName matches `/b2c|b2b|customer|portal|community/i` OR userType matches `/customer|partner|community|portal/i`
5. **Internal Business User**: profileName matches business profiles OR fallback when not matching above categories
6. **Other**: fallback

Export `deriveCategory(user, rules)` function. Rules stored in IndexedDB so user edits persist.

### 3. `src/data/dataJoiner.ts` — Join & Enrich Logic

- `joinData(users, loginHistory?, pslAssignments?, pslPool?, userLicensePool?)` → `EnrichedUser[]`
- For each user: count logins in 7d/30d/90d from login_history
- For each user: collect add-on license names via PSL assignments → PSL pool lookup
- Compute usage status: Active (login ≤30d), At Risk (31-90d), Ghost (>90d), Never Used (no lastLoginDate)
- Match primary license name to user_license_pool for pool utilization stats

### 4. `src/hooks/useDataStore.ts` — Replace `useUploadedData`

- State: `{ users, loginHistory, pslAssignments, pslPool, userLicensePool, enrichedUsers, snapshots, categoryRules }`
- `uploadFile(file, fileType)` — parse based on type, store in IndexedDB under keyed slots
- `recomputeEnrichedUsers()` — runs joins + category derivation whenever any source changes
- `saveSnapshot()` / `loadSnapshot(id)` / `compareSnapshots(id1, id2)`
- `updateCategoryRules(rules)` — save to IndexedDB, recompute categories
- Graceful: if login_history or PSL files not uploaded, enrichedUsers still works with available data

### 5. `src/components/MultiFileUpload.tsx` — New Upload UI

- Replace single CSV drop zone with a multi-file upload panel
- Show 5 file slots: users_master (required), login_history (optional), user_license_pool (optional), psl_pool (optional), psl_assignments (optional)
- Each slot: drag-drop or click, shows filename + record count + timestamp when uploaded
- Auto-detect file type from headers (fallback: let user pick)
- "Clear All" button

### 6. `src/components/CategoryRuleEditor.tsx` — Editable Rules UI

- Dialog/drawer showing current category rules as a table
- Each rule: Category, Field (profileName/username/email/name/userType), Operator (contains/equals/regex), Value
- Add/edit/delete/reorder rules
- "Reset to Defaults" button
- Changes trigger re-derivation of all user categories

### 7. `src/components/tabs/` — Tab Components (split Index.tsx)

Split the massive Index.tsx into focused tab components:
- `OverviewTab.tsx` — KPI cards + pie chart + activity bar chart
- `LicenseAnalysisTab.tsx` — Primary license pool utilization, add-on license utilization, waste by license type
- `ProfileAnalysisTab.tsx` — existing profile charts + summary table
- `RoleAnalysisTab.tsx` — existing role charts + summary table
- `ActivityAnalysisTab.tsx` — Login frequency heatmap, 7d/30d/90d activity breakdown, login type distribution (from login_history)
- `UserDetailTab.tsx` — Full paginated table with all fields

---

## Dashboard Changes (`src/pages/Index.tsx`)

### Filters (sidebar)
Add to existing sidebar:
- **User Category** — multi-select: Automated/System, Integration, Admin, External/Community, Internal Business User, Other
- **Usage Status** — multi-select: Active, At Risk, Ghost, Never Used
- **Department** — dropdown
- **Add-on License Type** — dropdown (from PSL pool names)
- Keep existing: Profile, Role, Primary License Type

Default filter: User Category = "Internal Business User"

### KPI Cards (3 rows of 3 = 9 cards)
Row 1: Total Active Users | Active in Last 30 Days | At Risk Users
Row 2: Ghost Users | Never Used Users | Utilization Rate
Row 3: Total Primary Licenses (from pool) | Used Primary Licenses (from pool) | Est. Waste by License Type

### Tabs
Overview | License Analysis | Profile Analysis | Role Analysis | Activity Analysis | User Detail

### Waste Calculation
- Exclude Automated/System and Integration categories by default
- Separate External/Community from Internal Business Users
- Show waste breakdown per license type using pool data

### User Detail Tab
Columns: Name, Username, Email, Profile, Role, UserType, Primary License, Add-on Licenses, Department, CreatedDate, LastLoginDate, Category, Usage Status, Logins (7d/30d/90d)

---

## Snapshot Comparison

- Each upload set saved as a dated snapshot in IndexedDB
- Dropdown to select previous snapshot
- When comparing: show delta badges on KPIs (e.g., "+5 ghost users since last snapshot")
- Simple before/after view, not a full diff

---

## Files Modified
1. `src/data/dataModels.ts` — new
2. `src/data/categoryRules.ts` — new
3. `src/data/dataJoiner.ts` — new
4. `src/hooks/useDataStore.ts` — new (replaces useUploadedData)
5. `src/components/MultiFileUpload.tsx` — new
6. `src/components/CategoryRuleEditor.tsx` — new
7. `src/components/tabs/OverviewTab.tsx` — new
8. `src/components/tabs/LicenseAnalysisTab.tsx` — new
9. `src/components/tabs/ProfileAnalysisTab.tsx` — new
10. `src/components/tabs/RoleAnalysisTab.tsx` — new
11. `src/components/tabs/ActivityAnalysisTab.tsx` — new
12. `src/components/tabs/UserDetailTab.tsx` — new
13. `src/pages/Index.tsx` — rewrite to use new store + tabs
14. `src/components/AppSidebar.tsx` — add new filter dropdowns
15. `src/components/DashboardLayout.tsx` — pass new filter props
16. `src/data/userData.ts` — keep parseCSV helpers, add new parsers for other file types

## Files Removed
- `src/hooks/useUploadedData.ts` — replaced by useDataStore

