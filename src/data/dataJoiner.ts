import { differenceInDays } from "date-fns";
import type {
  RawUser, LoginRecord, PSLAssignment, PSLPool,
  EnrichedUser, UsageStatus, CategoryRule, ProfileTeamMapping,
} from "./dataModels";
import { deriveCategory, deriveTeamFunction } from "./categoryRules";

const NOW = () => new Date();

function computeUsageStatus(lastLoginDate: string | null): UsageStatus {
  if (!lastLoginDate) return "Never Used";
  const days = differenceInDays(NOW(), new Date(lastLoginDate));
  if (days <= 30) return "Active";
  if (days <= 90) return "At Risk";
  return "Ghost";
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(NOW(), new Date(dateStr));
}

export function joinData(
  users: RawUser[],
  loginHistory: LoginRecord[],
  pslAssignments: PSLAssignment[],
  pslPool: PSLPool[],
  rules: CategoryRule[],
  teamMappings: ProfileTeamMapping[],
): EnrichedUser[] {
  const now = NOW();
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

  // Build login count maps
  const loginCounts7 = new Map<string, number>();
  const loginCounts30 = new Map<string, number>();
  const loginCounts90 = new Map<string, number>();

  for (const log of loginHistory) {
    if (log.status !== "Success") continue;
    const t = new Date(log.loginTime);
    if (t >= d90) {
      loginCounts90.set(log.userId, (loginCounts90.get(log.userId) || 0) + 1);
      if (t >= d30) {
        loginCounts30.set(log.userId, (loginCounts30.get(log.userId) || 0) + 1);
        if (t >= d7) {
          loginCounts7.set(log.userId, (loginCounts7.get(log.userId) || 0) + 1);
        }
      }
    }
  }

  // Build add-on license map
  const pslPoolMap = new Map<string, string>();
  for (const p of pslPool) {
    pslPoolMap.set(p.id, p.masterLabel);
  }
  const userAddOns = new Map<string, string[]>();
  for (const a of pslAssignments) {
    const label = pslPoolMap.get(a.permissionSetLicenseId);
    if (label) {
      const existing = userAddOns.get(a.assigneeId) || [];
      existing.push(label);
      userAddOns.set(a.assigneeId, existing);
    }
  }

  return users.map((u) => {
    const category = deriveCategory(u, rules);
    return {
      ...u,
      derivedCategory: category,
      derivedTeamFunction: deriveTeamFunction(u.profileName, category, teamMappings),
      usageStatus: computeUsageStatus(u.lastLoginDate),
      logins7d: loginCounts7.get(u.id) || 0,
      logins30d: loginCounts30.get(u.id) || 0,
      logins90d: loginCounts90.get(u.id) || 0,
      addOnLicenses: userAddOns.get(u.id) || [],
      daysSinceLogin: daysSince(u.lastLoginDate),
    };
  });
}
