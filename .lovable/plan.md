

# Dynamic CSV-Powered License Optimizer — Plan

## Overview
Transform the current hardcoded dashboard into a dynamic, CSV-upload-driven app with localStorage persistence, dark mode, and a sample template download.

## Changes

### 1. Add PapaParse dependency
Install `papaparse` for robust CSV parsing (with `@types/papaparse`).

### 2. New: `src/hooks/useUploadedData.ts` — Data state + localStorage
- Custom hook managing the uploaded user data via `useState`
- On mount, hydrate from `localStorage` (key: `license-optimizer-data`)
- On new upload, parse CSV with PapaParse, map columns to `UserRecord[]`, save to localStorage
- Store upload timestamp alongside data
- Expose: `users`, `uploadTimestamp`, `isProcessing`, `handleFileUpload`, `clearData`

### 3. New: `src/components/CsvUploadZone.tsx` — Upload widget
- Drag-and-drop zone + file picker button, placed in the sidebar
- Shows "Processing..." spinner during parse
- Displays "Data freshness" label: "Analysis based on file uploaded at: [timestamp]"
- "Download Sample Template" link that generates and downloads a CSV with expected columns

### 4. Update: `src/data/userData.ts`
- Keep interfaces and helper functions (`computeKPIs`, `getDaysSinceLogin`, `getLoginStatus`, etc.)
- Remove hardcoded `users` array (or keep as fallback/sample data)
- Add `parseCSV(csvText: string): UserRecord[]` function that maps CSV columns to the `UserRecord` interface
- Add `generateSampleCSV(): string` for template download

### 5. Update: `src/components/AppSidebar.tsx`
- Add the `CsvUploadZone` component below the filters section
- Show upload timestamp / data freshness label in the footer

### 6. Update: `src/pages/Index.tsx`
- Use data from `useUploadedData` hook instead of hardcoded import
- Show an empty/onboarding state when no data is uploaded yet (with prompt to upload CSV)
- All KPIs, charts, and table already reactive via `useMemo` — just swap data source

### 7. Update: `src/index.css` — Dark mode support
- Add `.dark` variant CSS variables (dark backgrounds, light text, muted greens)
- Keep INSEAD brand green as primary in both modes

### 8. New: `src/components/ThemeToggle.tsx`
- Light/dark mode toggle button in the header using `next-themes` (already installed)

### 9. Update: `src/components/DashboardLayout.tsx`
- Wrap app with `ThemeProvider` from `next-themes`
- Add `ThemeToggle` to header
- Pass upload handler props through to sidebar

### CSV Column Mapping
Expected columns (flexible matching by header name):
- `Name` / `FirstName` + `LastName`
- `Email` / `Username`
- `Profile Name` / `Profile`
- `License Name` / `License`  
- `Department`
- `Is Active`
- `Last Login Date`
- `Federation Id`

The parser will do case-insensitive header matching and warn about unmapped columns via a toast.

### Data Flow
```text
CSV File → PapaParse → Column Mapper → UserRecord[] 
  → localStorage (persist) 
  → React state (useUploadedData hook)
  → Index.tsx useMemo → KPIs, Charts, Table
```

### Empty State
When no data exists (first visit, cleared data), show a centered card with:
- Upload icon + "Upload your Salesforce export to get started"
- "Download Sample Template" button
- Brief instructions

