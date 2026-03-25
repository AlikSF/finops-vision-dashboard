import { describe, it, expect } from "vitest";
import { parseCSV, getDaysSinceLogin, getLoginStatus, computeKPIs } from "@/data/userData";
import fs from "fs";
import path from "path";

const sampleCSV = fs.readFileSync(path.resolve(__dirname, "../../public/test-data.csv"), "utf-8");

describe("parseCSV", () => {
  it("parses the INSEAD Salesforce CSV correctly", () => {
    const users = parseCSV(sampleCSV);
    expect(users.length).toBe(10);
    expect(users[0].name).toBe("Charith MAHAWATTA");
    expect(users[0].email).toBe("charith.mahawatta@insead.edu");
    expect(users[0].profileName).toBe("System Administrator");
    expect(users[0].licenseName).toBe("Salesforce");
    expect(users[0].department).toBe("Technology");
    expect(users[0].isActive).toBe(true);
    expect(users[0].lastLoginDate).toBe("2026-03-25T03:49:40.000+0000");
  });

  it("computes KPIs from parsed data", () => {
    const users = parseCSV(sampleCSV);
    const kpis = computeKPIs(users);
    expect(kpis.totalLicenses).toBe(10);
  });
});
