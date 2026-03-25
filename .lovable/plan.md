

# Add Sortable Status Column to "All Salesforce Users" Table

## What Changes

Add a **clickable Status column header** in the "All Salesforce Users" table that toggles sorting between:
- Default (sorted by Logins 30d descending, current behavior)
- Status A-Z (Active → At Risk → Ghost → Never Used)
- Status Z-A (Never Used → Ghost → At Risk → Active)

Clicking the "Status" header cycles through: default → A-Z → Z-A → default.

A small arrow indicator (▲/▼) appears next to "Status" when active.

## Technical Details

**File**: `src/components/tabs/SalesforceUsageTab.tsx`

1. Add state: `const [statusSort, setStatusSort] = useState<"none" | "asc" | "desc">("none")`
2. Define a status order map: `{ "Active": 0, "At Risk": 1, "Ghost": 2, "Never Used": 3 }`
3. Update `allSorted` useMemo to apply status sorting when `statusSort !== "none"`, falling back to logins30d sort otherwise
4. Make the "Status" `<TableHead>` clickable with `onClick` that cycles none → asc → desc → none
5. Show sort direction indicator (▲/▼) next to "Status" text when sorting is active

