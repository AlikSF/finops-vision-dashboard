import type { CategoryRule, UserCategory, RawUser } from "./dataModels";

let ruleIdCounter = 0;
function ruleId(): string {
  return `rule-${++ruleIdCounter}`;
}

export const DEFAULT_RULES: CategoryRule[] = [
  // Automated/System
  { id: ruleId(), priority: 1, category: "Automated/System", field: "name", operator: "equals", value: "Automated Process" },
  { id: ruleId(), priority: 2, category: "Automated/System", field: "username", operator: "regex", value: "autoproc|noreply|service|sync|bot" },
  { id: ruleId(), priority: 3, category: "Automated/System", field: "userType", operator: "contains", value: "AutomatedProcess" },
  // Integration
  { id: ruleId(), priority: 10, category: "Integration", field: "profileName", operator: "contains", value: "Integration" },
  { id: ruleId(), priority: 11, category: "Integration", field: "username", operator: "regex", value: "integration|api|mulesoft|talend|etl" },
  { id: ruleId(), priority: 12, category: "Integration", field: "email", operator: "regex", value: "integration|api|mulesoft|talend|etl" },
  { id: ruleId(), priority: 13, category: "Integration", field: "userType", operator: "contains", value: "CloudIntegration" },
  // Admin
  { id: ruleId(), priority: 20, category: "Admin", field: "profileName", operator: "regex", value: "Administrator|Admin" },
  // External / Community
  { id: ruleId(), priority: 30, category: "External/Community", field: "profileName", operator: "regex", value: "B2C|B2B|Customer|Portal|Community" },
  { id: ruleId(), priority: 31, category: "External/Community", field: "userType", operator: "regex", value: "Customer|Partner|Community|Portal|CspLitePortal|PowerCustomer|CSPLite|CsnOnly|PowerPartner" },
  // Internal Business User — broad match for known INSEAD-style profiles
  { id: ruleId(), priority: 40, category: "Internal Business User", field: "profileName", operator: "regex", value: "DP|EDP|Corporate Sales|Programme|Management|Advancement|Admission|CRM|Marketing|Finance|Sales|Standard|Analytics" },
  { id: ruleId(), priority: 41, category: "Internal Business User", field: "userType", operator: "equals", value: "Standard" },
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
