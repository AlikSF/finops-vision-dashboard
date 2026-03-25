

# Scaling the Dashboard for 31K Records (All License Types)

## Can It Handle It?

**Yes — with targeted optimizations.** The CSV parsing (PapaParse) and KPI calculations will work fine with 31K records. However, two bottlenecks need fixing:

1. **localStorage has a ~5MB limit** — 31K records as JSON will be ~15-20MB and will fail silently
2. **The table renders ALL rows at once** — 31K DOM rows will freeze the browser

## What Changes

### 1. Replace localStorage with IndexedDB
Switch from `localStorage` to **IndexedDB** (via the `idb-keyval` library — tiny, promise-based). IndexedDB can store hundreds of MB with no issues.

**File**: `src/hooks/useUploadedData.ts`
- Replace `localStorage.getItem/setItem` with `idb-keyval` `get/set/del`
- Same API surface, just async storage

### 2. Add Table Pagination
Instead of rendering all 31K rows, paginate the table to show 50 rows per page with Previous/Next controls.

**File**: `src/pages/Index.tsx`
- Add `currentPage` state
- Slice `filteredUsers` for display: `filteredUsers.slice(page * 50, (page + 1) * 50)`
- Add pagination controls below the table using shadcn Pagination component
- Reset page to 0 when filters change

### 3. License Type as a First-Class Dimension
Community Portal licenses will naturally appear in the existing **License Name** filter and charts. The dashboard already groups by `licenseName` — so Community Portal, Salesforce, Platform, etc. will all show up automatically as distinct categories in:
- The License Type filter dropdown
- The Pie Chart (license distribution)
- KPI calculations

No schema changes needed — your CSV already has the `License Name` column mapped.

### 4. Add Record Count Indicator
Show "Showing X of Y records" above the table so users know the dataset size and filter impact.

## Files Modified
1. `src/hooks/useUploadedData.ts` — IndexedDB storage
2. `src/pages/Index.tsx` — table pagination + record count
3. `package.json` — add `idb-keyval` dependency

## What Stays the Same
- All charts, KPIs, and filters work identically — they use `useMemo` over the full dataset
- CSV parsing handles any license type automatically
- Profile, Role, and License Age analysis all scale fine (aggregate computations)

