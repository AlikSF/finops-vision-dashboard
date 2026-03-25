import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { EnrichedUser, UserLicensePool } from "@/data/dataModels";

const COLORS = [
  "hsl(153, 100%, 13%)", "hsl(210, 80%, 50%)", "hsl(35, 90%, 55%)", "hsl(0, 70%, 55%)",
  "hsl(270, 60%, 55%)", "hsl(180, 60%, 40%)", "hsl(330, 70%, 55%)", "hsl(50, 80%, 50%)",
  "hsl(120, 50%, 45%)", "hsl(200, 70%, 60%)",
];

interface OverviewTabProps {
  users: EnrichedUser[];
  allUsers: EnrichedUser[];
  licensePool: UserLicensePool[];
}

export function OverviewTab({ users, allUsers, licensePool }: OverviewTabProps) {
  // KPIs — exclude Automated/System & Integration/Technical from human usage metrics
  const humanUsers = users.filter(u =>
    u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical"
  );

  const totalActive = humanUsers.filter(u => u.isActive).length;
  const active30 = humanUsers.filter(u => u.usageStatus === "Active").length;
  const atRisk = humanUsers.filter(u => u.usageStatus === "At Risk").length;
  const ghost = humanUsers.filter(u => u.usageStatus === "Ghost").length;
  const neverUsed = humanUsers.filter(u => u.usageStatus === "Never Used").length;

  // License pool stats
  const totalPrimaryLicenses = licensePool.reduce((s, l) => s + l.totalLicenses, 0);
  const usedPrimaryLicenses = licensePool.reduce((s, l) => s + l.usedLicenses, 0);

  // Waste (exclude Automated/System, Integration/Technical, and external categories)
  const wasteUsers = allUsers.filter(u =>
    u.derivedCategory !== "Automated/System" &&
    u.derivedCategory !== "Integration/Technical" &&
    u.derivedCategory !== "ePortal B2C" &&
    u.derivedCategory !== "ePortal B2B" &&
    u.derivedCategory !== "External/Community Other" &&
    (u.usageStatus === "Ghost" || u.usageStatus === "Never Used")
  );

  const kpis = [
    { label: "Total Active Users", value: totalActive, color: "text-foreground" },
    { label: "Active (30 days)", value: active30, color: "text-green-600" },
    { label: "At Risk (31-90 days)", value: atRisk, color: "text-yellow-600" },
    { label: "Ghost (>90 days)", value: ghost, color: "text-red-600" },
    { label: "Never Used", value: neverUsed, color: "text-muted-foreground" },
    { label: "Utilization Rate", value: `${humanUsers.length > 0 ? Math.round((active30 / humanUsers.length) * 100) : 0}%`, color: "text-foreground" },
    { label: "Total Primary Licenses", value: totalPrimaryLicenses, color: "text-foreground" },
    { label: "Used Primary Licenses", value: usedPrimaryLicenses, color: "text-foreground" },
    { label: "Est. Wasted (Internal)", value: wasteUsers.length, color: "text-destructive" },
  ];

  // Category pie
  const categoryData = Object.entries(
    users.reduce((acc, u) => { acc[u.derivedCategory] = (acc[u.derivedCategory] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Status pie — human users only
  const statusData = Object.entries(
    humanUsers.reduce((acc, u) => { acc[u.usageStatus] = (acc[u.usageStatus] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Team/Function bar
  const teamCounts = Object.entries(
    humanUsers.reduce((acc, u) => { const t = u.derivedTeamFunction || "Other"; acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Users by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={100} strokeWidth={1}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Users"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-1.5 overflow-auto max-h-[280px]">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground truncate flex-1">{d.name}</span>
                    <span className="text-muted-foreground font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Usage Status (Human Users)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={100} strokeWidth={1}>
                      {statusData.map((d, i) => (
                        <Cell key={i} fill={
                          d.name === "Active" ? "hsl(142, 71%, 45%)" :
                          d.name === "At Risk" ? "hsl(38, 92%, 50%)" :
                          d.name === "Ghost" ? "hsl(0, 84%, 60%)" :
                          "hsl(215, 16%, 47%)"
                        } />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Users"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-2">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{
                      backgroundColor: d.name === "Active" ? "hsl(142, 71%, 45%)" :
                        d.name === "At Risk" ? "hsl(38, 92%, 50%)" :
                        d.name === "Ghost" ? "hsl(0, 84%, 60%)" :
                        "hsl(215, 16%, 47%)"
                    }} />
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted-foreground font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team / Function bar */}
      {teamCounts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Users by Team / Function (Human Users)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={teamCounts} layout="vertical" margin={{ left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(153, 100%, 13%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
