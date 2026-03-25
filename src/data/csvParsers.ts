import Papa from "papaparse";
import type { RawUser, LoginRecord, UserLicensePool, PSLPool, PSLAssignment, FileType } from "./dataModels";

function parseGeneric(csvText: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

function findCol(row: Record<string, string>, ...candidates: string[]): string {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[_\s.]+/g, "");
  const rowKeys = Object.keys(row);
  for (const c of candidates) {
    const nc = normalize(c);
    const match = rowKeys.find(k => normalize(k) === nc);
    if (match !== undefined) return row[match] || "";
  }
  return "";
}

function hasCol(headers: string[], ...candidates: string[]): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[_\s.]+/g, "");
  const normalizedHeaders = headers.map(normalize);
  return candidates.some(c => normalizedHeaders.includes(normalize(c)));
}

export function detectFileType(csvText: string): FileType | null {
  const firstLine = csvText.split("\n")[0] || "";
  const headers = firstLine.split(",").map(h => h.trim().replace(/"/g, ""));

  if (hasCol(headers, "Username", "ProfileId", "UserType", "Profile.Name")) return "users_master";
  if (hasCol(headers, "UserId", "LoginTime", "SourceIp")) return "login_history";
  if (hasCol(headers, "AssigneeId", "PermissionSetLicenseId")) return "psl_assignments";
  if (hasCol(headers, "MasterLabel", "DeveloperName")) return "psl_pool";
  if (hasCol(headers, "TotalLicenses", "UsedLicenses") && !hasCol(headers, "MasterLabel", "DeveloperName", "AssigneeId")) return "user_license_pool";
  return null;
}

export function parseUsersMaster(csvText: string): RawUser[] {
  const rows = parseGeneric(csvText);
  return rows.map((r, i) => ({
    id: findCol(r, "Id") || String(i),
    username: findCol(r, "Username"),
    firstName: findCol(r, "FirstName"),
    lastName: findCol(r, "LastName"),
    name: findCol(r, "Name") || `${findCol(r, "FirstName")} ${findCol(r, "LastName")}`.trim(),
    email: findCol(r, "Email"),
    isActive: (findCol(r, "IsActive") || "true").toLowerCase() === "true",
    userType: findCol(r, "UserType"),
    profileId: findCol(r, "ProfileId"),
    profileName: findCol(r, "Profile.Name", "Profile Name", "ProfileName", "Profile"),
    userRoleId: findCol(r, "UserRoleId"),
    roleName: findCol(r, "UserRole.Name", "Role Name", "RoleName", "UserRole"),
    federationId: findCol(r, "FederationIdentifier"),
    lastLoginDate: findCol(r, "LastLoginDate") || null,
    createdDate: findCol(r, "CreatedDate") || null,
    title: findCol(r, "Title"),
    department: findCol(r, "Department"),
    contactId: findCol(r, "ContactId"),
    licenseName: findCol(r, "Profile.UserLicense.Name", "License Name", "LicenseName") || "Salesforce",
  }));
}

export function parseLoginHistory(csvText: string): LoginRecord[] {
  const rows = parseGeneric(csvText);
  return rows.map((r, i) => ({
    id: findCol(r, "Id") || String(i),
    userId: findCol(r, "UserId"),
    loginTime: findCol(r, "LoginTime"),
    status: findCol(r, "Status"),
    sourceIp: findCol(r, "SourceIp"),
    loginType: findCol(r, "LoginType"),
    application: findCol(r, "Application"),
  }));
}

export function parseUserLicensePool(csvText: string): UserLicensePool[] {
  const rows = parseGeneric(csvText);
  return rows.map((r, i) => ({
    id: findCol(r, "Id") || String(i),
    name: findCol(r, "Name"),
    totalLicenses: parseInt(findCol(r, "TotalLicenses") || "0", 10),
    usedLicenses: parseInt(findCol(r, "UsedLicenses") || "0", 10),
  }));
}

export function parsePSLPool(csvText: string): PSLPool[] {
  const rows = parseGeneric(csvText);
  return rows.map((r, i) => ({
    id: findCol(r, "Id") || String(i),
    masterLabel: findCol(r, "MasterLabel"),
    developerName: findCol(r, "DeveloperName"),
    totalLicenses: parseInt(findCol(r, "TotalLicenses") || "0", 10),
    usedLicenses: parseInt(findCol(r, "UsedLicenses") || "0", 10),
  }));
}

export function parsePSLAssignments(csvText: string): PSLAssignment[] {
  const rows = parseGeneric(csvText);
  return rows.map((r, i) => ({
    id: findCol(r, "Id") || String(i),
    assigneeId: findCol(r, "AssigneeId"),
    permissionSetLicenseId: findCol(r, "PermissionSetLicenseId"),
  }));
}
