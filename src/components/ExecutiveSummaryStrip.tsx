import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { EnrichedUser, PSLPool } from "@/data/dataModels";

const COMMUNITY_LICENSES = ["Customer Community Login", "Customer Community Plus Login"];

interface Props {
  users: EnrichedUser[];
  pslPool: PSLPool[];
}

export function ExecutiveSummaryStrip({ users, pslPool }: Props) {
  const stats = useMemo(() => {
    const sfUsers = users.filter(
      u => !COMMUNITY_LICENSES.includes(u.licenseName) &&
        u.derivedCategory !== "Automated/System" &&
        u.derivedCategory !== "Integration/Technical"
    );
    const epUsers = users.filter(u => COMMUNITY_LICENSES.includes(u.licenseName));

    const sfActive30 = sfUsers.filter(u => u.usageStatus === "Active").length;
    const sfGhost = sfUsers.filter(u => u.usageStatus === "Ghost").length;
    const sfAtRisk = sfUsers.filter(u => u.usageStatus === "At Risk").length;
    const sfBecomingGhost = sfUsers.filter(u => {
      if (!u.daysSinceLogin) return false;
      return u.daysSinceLogin >= 61 && u.daysSinceLogin <= 89;
    }).length;

    const epActive30 = epUsers.filter(u => u.usageStatus === "Active").length;
    const epGhost = epUsers.filter(u => u.usageStatus === "Ghost").length;

    const sfUsageRate = sfUsers.length > 0 ? Math.round((sfActive30 / sfUsers.length) * 100) : 0;
    const epUsageRate = epUsers.length > 0 ? Math.round((epActive30 / epUsers.length) * 100) : 0;

    const reassignCandidates = sfUsers.filter(
      u => u.usageStatus === "Ghost" || u.usageStatus === "Never Used"
    ).length;

    // CRM Analytics
    const crmPsl = pslPool.find(p => p.masterLabel?.toLowerCase().includes("crm analytics plus"));
    const crmAssigned = users.filter(u => (u.addOnLicenses || []).some(a => a.toLowerCase().includes("crm analytics plus"))).length;
    const crmActive = users.filter(u =>
      (u.addOnLicenses || []).some(a => a.toLowerCase().includes("crm analytics plus")) &&
      u.usageStatus === "Active"
    ).length;

    return [
      { label: "SF Usage Rate", value: `${sfUsageRate}%`, color: sfUsageRate >= 70 ? "text-green-600" : sfUsageRate >= 50 ? "text-yellow-600" : "text-destructive" },
      { label: "ePortal Usage Rate", value: `${epUsageRate}%`, color: epUsageRate >= 70 ? "text-green-600" : epUsageRate >= 50 ? "text-yellow-600" : "text-destructive" },
      { label: "SF Ghost Users", value: sfGhost, color: sfGhost > 0 ? "text-destructive" : "text-foreground" },
      { label: "SF At Risk", value: sfAtRisk, color: sfAtRisk > 0 ? "text-yellow-600" : "text-foreground" },
      { label: "Becoming Ghost", value: sfBecomingGhost, color: sfBecomingGhost > 0 ? "text-orange-500" : "text-foreground" },
      { label: "ePortal Ghost", value: epGhost, color: epGhost > 0 ? "text-destructive" : "text-foreground" },
      { label: "CRM Analytics+", value: crmPsl ? `${crmActive}/${crmAssigned}` : "—", color: "text-foreground" },
      { label: "Reassign Candidates", value: reassignCandidates, color: reassignCandidates > 0 ? "text-destructive" : "text-foreground" },
    ];
  }, [users, pslPool]);

  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
      {stats.map(s => (
        <Card key={s.label} className="shadow-sm border-border/60">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
