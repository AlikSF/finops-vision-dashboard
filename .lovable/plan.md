

# Fix: Show All 282 Users in Salesforce Tab

## Root Cause Analysis

The pipeline filters users at multiple stages. The most likely causes of only 16 users showing:

1. **`findCol` is case-sensitive** — if CSV headers don't exactly match (e.g. `"profile.userlicense.name"` vs `"Profile.UserLicense.Name"`), the license column won't be found, OR it matches but most users have community license values
2. **Community license filter** in `Index.tsx` splits users — if most of the 282 users have `licenseName` = "Customer Community Login" or "Customer Community Plus Login", they go to the Community tab instead
3. **System/Integration exclusion** — the default toggle in `SalesforceUsageTab` excludes Automated/System and Integration/Technical users

## Plan

### 1. Make `findCol` case-insensitive (`src/data/csvParsers.ts`)

Change `findCol` to do case-insensitive, whitespace-normalized key matching (like `findHeader` in `userData.ts` already does). This ensures license, profile, and role columns are found regardless of header casing.

### 2. Add debug logging to data pipeline (`src/hooks/useDataStore.ts`)

After computing `enrichedUsers`, log:
- Total parsed users count
- Breakdown by `licenseName` (how many per license type)
- Breakdown by `derivedCategory`

This will appear in the browser console so the user (and we) can see exactly where users are going.

### 3. Add license breakdown indicator (`src/components/tabs/SalesforceUsageTab.tsx`)

Add a small info line below the KPI cards showing: "Total parsed: X | SF licenses: Y | Community licenses: Z | Other: W" so it's transparent where users end up.

### 4. Pass total enriched count to SalesforceUsageTab (`src/pages/Index.tsx`)

Pass `totalEnrichedCount={enrichedUsers.length}` so the tab can display total vs filtered.

## Technical Details

**`findCol` fix** — normalize both row keys and candidate names to lowercase with stripped spaces/underscores before comparing, matching the approach already used in `userData.ts`:
```ts
function findCol(row: Record<string, string>, ...candidates: string[]): string {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[_\s]+/g, "");
  const rowKeys = Object.keys(row);
  for (const c of candidates) {
    const nc = normalize(c);
    const match = rowKeys.find(k => normalize(k) === nc);
    if (match !== undefined) return row[match] || "";
  }
  return "";
}
```

**Debug logging** — `console.log` after `joinData` showing license distribution, so user can check browser console to see exactly which licenses exist in their CSV.

## Files Modified

1. `src/data/csvParsers.ts` — case-insensitive `findCol`
2. `src/hooks/useDataStore.ts` — debug logging after enrichment
3. `src/components/tabs/SalesforceUsageTab.tsx` — show total parsed vs displayed breakdown
4. `src/pages/Index.tsx` — pass total count prop

