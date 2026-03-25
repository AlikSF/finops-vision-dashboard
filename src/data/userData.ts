import { differenceInDays } from "date-fns";

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

export const users: UserRecord[] = [
  { id: "0050o00000XfoX6AAJ", firstName: "Charith", lastName: "MAHAWATTA", name: "Charith MAHAWATTA", email: "charith.mahawatta@insead.edu", username: "charith.mahawatta@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-25T03:49:40.000+0000", federationId: "charith.mahawatta@insead.edu" },
  { id: "0053X00000AyewQQAR", firstName: "Hamza", lastName: "Belallam", name: "Hamza Belallam", email: "hamza.belallam@insead.edu", username: "hamza.belallam@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-24T14:46:49.000+0000", federationId: "hamza.belallam@insead.edu" },
  { id: "0053X00000CSVHdQAP", firstName: "IT Data", lastName: "Upload", name: "IT Data Upload", email: "valeed.abdul@insead.edu", username: "integration.salesforce@insead.edu", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-19T06:33:22.000+0000", federationId: "" },
  { id: "0053X00000CgVNfQAN", firstName: "Valeed", lastName: "Mohammed Abdul", name: "Valeed Mohammed Abdul", email: "valeed.abdul@insead.edu", username: "valeed.abdul@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-18T23:01:48.000+0000", federationId: "valeed.abdul@insead.edu" },
  { id: "0053X00000DZMG0QAP", firstName: "Varadharaja", lastName: "Perumal", name: "Varadharaja Perumal", email: "varadharaja.perumal@insead.edu", username: "varadharaja.perumal@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-24T04:51:25.000+0000", federationId: "varadharaja.perumal@insead.edu" },
  { id: "0053X00000EWaIlQAL", firstName: "Blackthorn", lastName: "Service Account", name: "Blackthorn Service Account", email: "svc_bt@insead.edu", username: "blackthorn@insead.edu", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-23T22:45:36.000+0000", federationId: "" },
  { id: "0053X00000EWcB3QAL", firstName: "Nandhini", lastName: "Subramaniyan", name: "Nandhini Subramaniyan", email: "nandhini.subramaniyan@insead.edu", username: "nandhini.subramaniyan@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-25T03:59:54.000+0000", federationId: "nandhini.subramaniyan@insead.edu" },
  { id: "0053X00000F0iFpQAJ", firstName: "Mahantesh", lastName: "Halakeri", name: "Mahantesh Halakeri", email: "mahantesh.halakeri@insead.edu", username: "mahantesh.halakeri@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-25T04:36:15.000+0000", federationId: "mahantesh.halakeri@insead.edu" },
  { id: "0053X00000G6hrFQAR", firstName: "Aalambek", lastName: "Ulukbek", name: "Aalambek Ulukbek", email: "aalambek.ulukbek@insead.edu", username: "aalambek.ulukbek@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-25T08:02:04.000+0000", federationId: "aalambek.ulukbek@insead.edu" },
  { id: "0053X00000Gv91HQAR", firstName: "Salah Eddine", lastName: "Jari", name: "Salah Eddine Jari", email: "salaheddine.jari@insead.edu", username: "salaheddine.jari@insead.edu.sfdx", profileName: "System Administrator", licenseName: "Salesforce", department: "Technology", isActive: true, lastLoginDate: "2026-03-25T09:17:03.000+0000", federationId: "salaheddine.jari@insead.edu" },
];

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
  return [...new Set(data.map((u) => u.department))];
}

export function getUniqueLicenses(data: UserRecord[]): string[] {
  return [...new Set(data.map((u) => u.licenseName))];
}
