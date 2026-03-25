import type { CategoryRule, UserCategory, RawUser, TeamFunction, ProfileTeamMapping } from "./dataModels";

let ruleIdCounter = 0;
function ruleId(): string {
  return `rule-${++ruleIdCounter}`;
}

export const DEFAULT_RULES: CategoryRule[] = [
  // 1. Automated/System
  { id: ruleId(), priority: 1, category: "Automated/System", field: "name", operator: "equals", value: "Automated Process" },
  { id: ruleId(), priority: 2, category: "Automated/System", field: "userType", operator: "contains", value: "AutomatedProcess" },
  { id: ruleId(), priority: 3, category: "Automated/System", field: "username", operator: "regex", value: "autoproc|noreply|service|bot" },

  // 2. Integration/Technical
  { id: ruleId(), priority: 10, category: "Integration/Technical", field: "profileName", operator: "contains", value: "Integration" },
  { id: ruleId(), priority: 11, category: "Integration/Technical", field: "profileName", operator: "regex", value: "Analytics Cloud Integration User|Sales Insights Integration User|SalesforceIQ Integration User|Incoming SMS Profile|ZoomSpeakerPublish Profile|Dashboards Profile|ESW_INSEAD_Agentforce_Serv_.*|Einstein Agent User|Analytics Cloud Security User" },
  { id: ruleId(), priority: 12, category: "Integration/Technical", field: "username", operator: "regex", value: "integration|api|mulesoft|talend|etl|sync" },
  { id: ruleId(), priority: 13, category: "Integration/Technical", field: "email", operator: "regex", value: "integration|api|mulesoft|talend|etl|sync" },

  // 3. Internal Admin
  { id: ruleId(), priority: 20, category: "Internal Admin", field: "profileName", operator: "regex", value: "System Administrator|EDP Administrator|DP Administrator" },

  // 4. ePortal B2C
  { id: ruleId(), priority: 30, category: "ePortal B2C", field: "profileName", operator: "regex", value: "^B2C Insead EDP User$|^Customer Community Login User$" },

  // 5. ePortal B2B
  { id: ruleId(), priority: 35, category: "ePortal B2B", field: "profileName", operator: "regex", value: "^B2B Insead EDP User$|^B2B Insead EDP User Old$" },

  // 6. External/Community Other
  { id: ruleId(), priority: 40, category: "External/Community Other", field: "profileName", operator: "regex", value: "Customer Community Plus Login User for analytics|Customer|Portal|Community|Partner" },
  { id: ruleId(), priority: 41, category: "External/Community Other", field: "userType", operator: "regex", value: "CspLitePortal|PowerCustomerSuccess|Customer|Partner|Community" },

  // 7. Internal Business User
  { id: ruleId(), priority: 50, category: "Internal Business User", field: "profileName", operator: "regex", value: "Read Only|Corporate Sales|Programme Manager \\(CSP\\)|DP Recruitment|Programme Advisor|Marketing Team Member|Data Management Officer|CSP Director|DP CDM|DP MEO PM|PA Lead|Accommodation|Resource Planning|Finance|Admission|Online Onboarding|Advancement User|DP Leadership|Management|IEC|Digital INSEAD|Operation Manager|INSEAD Platform User|Standard Platform User" },
];

export const DEFAULT_TEAM_MAPPINGS: ProfileTeamMapping[] = [
  // DP
  { profilePattern: "DP Recruitment", teamFunction: "DP" },
  { profilePattern: "DP CDM", teamFunction: "DP" },
  { profilePattern: "DP MEO PM", teamFunction: "DP" },
  { profilePattern: "DP Leadership", teamFunction: "DP" },
  { profilePattern: "DP Administrator", teamFunction: "DP" },
  // EDP
  { profilePattern: "EDP Administrator", teamFunction: "EDP" },
  { profilePattern: "INSEAD_EDP Profile", teamFunction: "EDP" },
  // CSP / Sales
  { profilePattern: "Corporate Sales", teamFunction: "CSP / Sales" },
  { profilePattern: "CSP Director", teamFunction: "CSP / Sales" },
  { profilePattern: "Programme Manager (CSP)", teamFunction: "CSP / Sales" },
  // Programme / Student-facing
  { profilePattern: "Programme Advisor", teamFunction: "Programme / Student-facing" },
  { profilePattern: "PA Lead", teamFunction: "Programme / Student-facing" },
  { profilePattern: "Accommodation", teamFunction: "Programme / Student-facing" },
  { profilePattern: "Admission", teamFunction: "Programme / Student-facing" },
  { profilePattern: "Online Onboarding", teamFunction: "Programme / Student-facing" },
  { profilePattern: "Resource Planning", teamFunction: "Programme / Student-facing" },
  // Marketing / Data
  { profilePattern: "Marketing Team Member", teamFunction: "Marketing / Data" },
  { profilePattern: "Data Management Officer", teamFunction: "Marketing / Data" },
  { profilePattern: "Digital INSEAD", teamFunction: "Marketing / Data" },
  // Finance / Operations
  { profilePattern: "Finance", teamFunction: "Finance / Operations" },
  { profilePattern: "Operation Manager", teamFunction: "Finance / Operations" },
  // Management
  { profilePattern: "Management", teamFunction: "Management" },
  // Platform / Technical
  { profilePattern: "Integration", teamFunction: "Platform / Technical" },
  { profilePattern: "Analytics Cloud Integration User", teamFunction: "Platform / Technical" },
  { profilePattern: "Analytics Cloud Security User", teamFunction: "Platform / Technical" },
  { profilePattern: "Sales Insights Integration User", teamFunction: "Platform / Technical" },
  { profilePattern: "SalesforceIQ Integration User", teamFunction: "Platform / Technical" },
  { profilePattern: "Incoming SMS Profile", teamFunction: "Platform / Technical" },
  { profilePattern: "Dashboards Profile", teamFunction: "Platform / Technical" },
  { profilePattern: "ZoomSpeakerPublish Profile", teamFunction: "Platform / Technical" },
  { profilePattern: "Einstein Agent User", teamFunction: "Platform / Technical" },
  { profilePattern: "ESW_INSEAD_Agentforce_Serv_", teamFunction: "Platform / Technical" },
  // ePortal
  { profilePattern: "B2C Insead EDP User", teamFunction: "ePortal B2C" },
  { profilePattern: "Customer Community Login User", teamFunction: "ePortal B2C" },
  { profilePattern: "B2B Insead EDP User", teamFunction: "ePortal B2B" },
  // Admin
  { profilePattern: "System Administrator", teamFunction: "Admin" },
];

export function deriveCategory(user: RawUser, rules: CategoryRule[]): UserCategory {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sorted) {
    const fieldValue = user[rule.field] || "";
    let matched = false;
    switch (rule.operator) {
      case "equals":
        matched = fieldValue === rule.value;
        break;
      case "contains":
        matched = fieldValue.toLowerCase().includes(rule.value.toLowerCase());
        break;
      case "regex":
        try {
          matched = new RegExp(rule.value, "i").test(fieldValue);
        } catch {
          matched = false;
        }
        break;
    }
    if (matched) return rule.category;
  }
  return "Other";
}

export function deriveTeamFunction(
  profileName: string,
  derivedCategory: UserCategory,
  mappings: ProfileTeamMapping[],
): TeamFunction {
  // Check explicit profile mappings first
  for (const m of mappings) {
    if (profileName.toLowerCase().includes(m.profilePattern.toLowerCase())) {
      return m.teamFunction;
    }
  }
  // Fallback based on category
  if (derivedCategory === "Automated/System") return "System / Automated";
  if (derivedCategory === "Integration/Technical") return "Platform / Technical";
  if (derivedCategory === "Internal Admin") return "Admin";
  if (derivedCategory === "ePortal B2C") return "ePortal B2C";
  if (derivedCategory === "ePortal B2B") return "ePortal B2B";
  if (derivedCategory === "External/Community Other") return "External / Community";
  return "Other";
}
