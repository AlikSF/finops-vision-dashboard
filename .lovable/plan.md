

# Show Full Salesforce User List in Overview Tab

## Summary
Replace the "Most Active Salesforce Users (30d)" table (currently limited to top 10) with a **full, scrollable, searchable table** of all Salesforce-licensed users showing Name, Profile, Role, Team/Function, Usage Status, Last Login, and Logins (30d). Sorted by logins descending by default.

## Changes

### Update `src/components/tabs/SalesforceUsageTab.tsx`

1. **Remove** the `.slice(0, 10)` limit on `topUsers` — use all `displayUsers` sorted by logins
2. **Add a search input** above the table to filter by name, profile, or role
3. **Rename** card title to "All Salesforce Users"
4. **Add columns**: Role (`u.roleName`), Usage Status (with color-coded badge), Last Login Date
5. **Increase** `max-h` from `400px` to `600px` for better visibility
6. **Add row count** in the card header (e.g., "All Salesforce Users (142)")

## Technical Details
- Search state via `useState<string>`, filter `displayUsers` by name/profile/role containing search term (case-insensitive)
- Status badge uses existing `STATUS_COLORS` mapping
- Table remains sorted by logins 30d descending, with all users visible via scroll

