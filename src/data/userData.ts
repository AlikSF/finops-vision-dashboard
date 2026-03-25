import { differenceInDays } from "date-fns";
import Papa from "papaparse";

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  profileName: string;
  licenseName: string;
  department: string;
  isActive: boolean;
  lastLoginDate: string | null;
  federationId: string;
}

const COST_PER_LICENSE = 150;

export function getDaysSinceLogin(lastLoginDate: string | null): number | null {
  if (!lastLoginDate) return null;
  return differenceInDays(new Date(), new Date(lastLoginDate));
}

export function getLoginStatus(daysSince: number | null): "ghost" | "at-risk" | "active" {
  if (daysSince === null || daysSince > 90) return "ghost";
  if (daysSince > 30) return "at-risk";
  return "active";
}

export interface DashboardKPIs {
  totalLicenses: number;
  ghostUsers: number;
  atRiskUsers: number;
  wastedSpend: number;
}

export function computeKPIs(filteredUsers: UserRecord[]): DashboardKPIs {
  let ghostUsers = 0;
  let atRiskUsers = 0;

  filteredUsers.forEach((u) => {
    const days = getDaysSinceLogin(u.lastLoginDate);
    const status = getLoginStatus(days);
    if (status === "ghost") ghostUsers++;
    else if (status === "at-risk") atRiskUsers++;
  });

  return {
    totalLicenses: filteredUsers.length,
    ghostUsers,
    atRiskUsers,
    wastedSpend: ghostUsers * COST_PER_LICENSE,
  };
}

export function getUniqueDepartments(data: UserRecord[]): string[] {
  return [...new Set(data.map((u) => u.department).filter(Boolean))];
}

export function getUniqueLicenses(data: UserRecord[]): string[] {
  return [...new Set(data.map((u) => u.licenseName).filter(Boolean))];
}

// Flexible column mapping
function findHeader(headers: string[], ...candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.trim().toLowerCase().replace(/[_\s]+/g, ""));
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase().replace(/[_\s]+/g, ""));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

export function parseCSV(csvText: string): UserRecord[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields || [];

  const colId = findHeader(headers, "Id", "UserId", "User Id");
  const colFirstName = findHeader(headers, "FirstName", "First Name", "firstname");
  const colLastName = findHeader(headers, "LastName", "Last Name", "lastname");
  const colName = findHeader(headers, "Name", "Full Name", "FullName");
  const colEmail = findHeader(headers, "Email", "EmailAddress", "Email Address");
  const colUsername = findHeader(headers, "Username", "User Name");
  const colProfile = findHeader(headers, "Profile.Name", "Profile Name", "ProfileName", "Profile");
  const colLicense = findHeader(headers, "Profile.UserLicense.Name", "License Name", "LicenseName", "License", "License Type");
  const colDepartment = findHeader(headers, "UserRole.Name", "Department", "Dept");
  const colActive = findHeader(headers, "IsActive", "Is Active", "Active");
  const colLastLogin = findHeader(headers, "LastLoginDate", "Last Login Date", "Last Login", "LastLogin");
  const colFedId = findHeader(headers, "FederationIdentifier", "Federation Id", "FederationId", "Federation ID");

  return result.data.map((row, i) => {
    const firstName = (colFirstName ? row[colFirstName] : "") || "";
    const lastName = (colLastName ? row[colLastName] : "") || "";
    const name = (colName ? row[colName] : "") || `${firstName} ${lastName}`.trim();
    const activeVal = colActive ? row[colActive]?.toLowerCase() : "true";

    return {
      id: (colId ? row[colId] : "") || String(i),
      firstName,
      lastName,
      name,
      email: (colEmail ? row[colEmail] : "") || "",
      username: (colUsername ? row[colUsername] : "") || "",
      profileName: (colProfile ? row[colProfile] : "") || "",
      licenseName: (colLicense ? row[colLicense] : "") || "Salesforce",
      department: (colDepartment ? row[colDepartment] : "") || "",
      isActive: activeVal === "true" || activeVal === "yes" || activeVal === "1",
      lastLoginDate: (colLastLogin ? row[colLastLogin] : "") || null,
      federationId: (colFedId ? row[colFedId] : "") || "",
    };
  });
}

export function generateSampleCSV(): string {
  const headers = [
    "Id", "First Name", "Last Name", "Name", "Email", "Username",
    "Profile Name", "License Name", "Department", "Is Active",
    "Last Login Date", "Federation Id",
  ];
  const sampleRow = [
    "001ABC", "Jane", "Doe", "Jane Doe", "jane.doe@company.com", "jane.doe@company.com.sfdx",
    "System Administrator", "Salesforce", "Technology", "true",
    "2025-12-15T10:30:00.000+0000", "jane.doe@company.com",
  ];
  return [headers.join(","), sampleRow.join(",")].join("\n");
}
