export interface RawUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  isActive: boolean;
  userType: string;
  profileId: string;
  profileName: string;
  userRoleId: string;
  roleName: string;
  federationId: string;
  lastLoginDate: string | null;
  createdDate: string | null;
  title: string;
  department: string;
  contactId: string;
  licenseName: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  loginTime: string;
  status: string;
  sourceIp: string;
  loginType: string;
  application: string;
}

export interface UserLicensePool {
  id: string;
  name: string;
  totalLicenses: number;
  usedLicenses: number;
}

export interface PSLPool {
  id: string;
  masterLabel: string;
  developerName: string;
  totalLicenses: number;
  usedLicenses: number;
}

export interface PSLAssignment {
  id: string;
  assigneeId: string;
  permissionSetLicenseId: string;
}

export type UsageStatus = "Active" | "At Risk" | "Ghost" | "Never Used";
export type UserCategory =
  | "Automated/System"
  | "Integration/Technical"
  | "Internal Admin"
  | "ePortal B2C"
  | "ePortal B2B"
  | "External/Community Other"
  | "Internal Business User"
  | "Other";

export type TeamFunction =
  | "DP"
  | "EDP"
  | "CSP / Sales"
  | "Programme / Student-facing"
  | "Marketing / Data"
  | "Finance / Operations"
  | "Management"
  | "Platform / Technical"
  | "ePortal B2C"
  | "ePortal B2B"
  | "Admin"
  | "System / Automated"
  | "External / Community"
  | "Other";

export interface EnrichedUser extends RawUser {
  derivedCategory: UserCategory;
  derivedTeamFunction: TeamFunction;
  usageStatus: UsageStatus;
  logins7d: number;
  logins30d: number;
  logins90d: number;
  addOnLicenses: string[];
  daysSinceLogin: number | null;
}

export interface CategoryRule {
  id: string;
  priority: number;
  category: UserCategory;
  field: "name" | "username" | "email" | "profileName" | "userType";
  operator: "contains" | "equals" | "regex";
  value: string;
}

export interface ProfileTeamMapping {
  profilePattern: string;
  teamFunction: TeamFunction;
}

export interface DataSnapshot {
  id: string;
  timestamp: string;
  fileTypes: string[];
  userCount: number;
}

export type FileType = "users_master" | "login_history" | "user_license_pool" | "psl_pool" | "psl_assignments";

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  users_master: "Users Master",
  login_history: "Login History (90 days)",
  user_license_pool: "User License Pool",
  psl_pool: "Permission Set License Pool",
  psl_assignments: "Permission Set License Assignments",
};

export const FILE_TYPE_REQUIRED: Record<FileType, boolean> = {
  users_master: true,
  login_history: false,
  user_license_pool: false,
  psl_pool: false,
  psl_assignments: false,
};
