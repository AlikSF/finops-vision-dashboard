import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProfileAnalysisTab } from "./ProfileAnalysisTab";
import { RoleAnalysisTab } from "./RoleAnalysisTab";
import { ActivityAnalysisTab } from "./ActivityAnalysisTab";
import { UserDetailTab } from "./UserDetailTab";
import { SalesforceInsightsTab } from "./SalesforceInsightsTab";
import { format, parseISO, startOfMonth, subMonths, isAfter } from "date-fns";
import type { EnrichedUser, UserLicensePool, LoginRecord, PSLPool } from "@/data/dataModels";

const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 71%, 45%)",
  "At Risk": "hsl(45, 93%, 47%)",
  Ghost: "hsl(0, 84%, 60%)",
  "Never Used": "hsl(215, 16%, 47%)",
};

interface Props {
  users: EnrichedUser[];
  allSfUsers: EnrichedUser[];
  licensePool: UserLicensePool[];
  pslPool: PSLPool[];
  loginHistory: LoginRecord[];
  hasLoginHistory: boolean;
}

export function SalesforceUsageTab({ users, allSfUsers, licensePool, loginHistory, hasLoginHistory }: Props) {
  const [includeSystem, setIncludeSystem] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [statusSort, setStatusSort] = useState<"none" | "asc" | "desc">("none");

  const STATUS_ORDER: Record<string, number> = { "Active": 0, "At Risk": 1, "Ghost": 2, "Never Used": 3 };

  const safeUsers = users || [];
  const safeAll = allSfUsers || [];
  const safePool = licensePool || [];

  const displayUsers = useMemo(() => {
    if (includeSystem) return safeUsers;
    return safeUsers.filter(
      u => u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical"
    );
  }, [safeUsers, includeSystem]);

  // KPIs
  const sfPoolEntry = safePool.find(l => l.name === "Salesforce");
  const totalPool = sfPoolEntry?.totalLicenses ?? 0;
  const usedPool = sfPoolEntry?.usedLicenses ?? 0;
  const availablePool = Math.max(0, totalPool - usedPool);

  const active = displayUsers.filter(u => u.usageStatus === "Active").length;
  const atRisk = displayUsers.filter(u => u.usageStatus === "At Risk").length;
  const ghost = displayUsers.filter(u => u.usageStatus === "Ghost").length;
  const neverUsed = displayUsers.filter(u => u.usageStatus === "Never Used").length;

  const becomingGhostSoon = displayUsers.filter(u => {
    if (!u.daysSinceLogin) return false;
    return u.daysSinceLogin >= 61 && u.daysSinceLogin <= 89;
  }).length;

  const humanUsers = safeAll.filter(
    u => u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical"
  );
  const reassignCandidates = humanUsers.filter(
    u => u.usageStatus === "Ghost" || u.usageStatus === "Never Used"
  ).length;

  const orgUsageRate = displayUsers.length > 0 ? Math.round((active / displayUsers.length) * 100) : 0;

  const kpis = [
    { label: "Users in Scope", value: displayUsers.length },
    { label: "SF License Pool", value: totalPool },
    { label: "Licenses Used", value: usedPool },
    { label: "Licenses Available", value: availablePool },
    { label: "Org Usage Rate", value: `${orgUsageRate}%`, color: orgUsageRate >= 70 ? "text-green-600" : orgUsageRate >= 50 ? "text-yellow-600" : "text-destructive" },
    { label: "Active (30d)", value: active, color: "text-green-600" },
    { label: "At Risk (31-90d)", value: atRisk, color: "text-yellow-600" },
    { label: "Ghost (>90d)", value: ghost, color: "text-destructive" },
    { label: "Never Used", value: neverUsed, color: "text-muted-foreground" },
    { label: "Becoming Ghost", value: becomingGhostSoon, color: "text-orange-500" },
    { label: "Reassign Candidates", value: reassignCandidates, color: "text-destructive" },
  ];

  // Status distribution
  const statusData = [
    { name: "Active", value: active },
    { name: "At Risk", value: atRisk },
    { name: "Ghost", value: ghost },
    { name: "Never Used", value: neverUsed },
  ].filter(d => d.value > 0);

  // Team/function distribution
  const teamMap = new Map<string, number>();
  displayUsers.forEach(u => {
    const fn = u.derivedTeamFunction || "Other";
    teamMap.set(fn, (teamMap.get(fn) || 0) + 1);
  });
  const teamData = Array.from(teamMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Last login month trend
  const loginByMonth = useMemo(() => {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      const e = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
      months.push({ label: format(s, "MMM yyyy"), start: s, end: e });
    }
    return months.map(m => {
      const count = displayUsers.filter(u => {
        if (!u.lastLoginDate) return false;
        const d = parseISO(u.lastLoginDate);
        return isAfter(d, m.start) && !isAfter(d, m.end);
      }).length;
      return { month: m.label, users: count };
    });
  }, [displayUsers]);

  // All users sorted
  const allSorted = useMemo(() => {
    const q = userSearch.toLowerCase();
    const filtered = [...displayUsers]
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.profileName?.toLowerCase().includes(q) || u.roleName?.toLowerCase().includes(q));
    if (statusSort === "asc") {
      return filtered.sort((a, b) => (STATUS_ORDER[a.usageStatus] ?? 9) - (STATUS_ORDER[b.usageStatus] ?? 9));
    } else if (statusSort === "desc") {
      return filtered.sort((a, b) => (STATUS_ORDER[b.usageStatus] ?? 9) - (STATUS_ORDER[a.usageStatus] ?? 9));
    }
    return filtered.sort((a, b) => (b.logins30d ?? 0) - (a.logins30d ?? 0));
  }, [displayUsers, userSearch, statusSort]);

  // Team breakdown table data
  const teamBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; active: number; atRisk: number; ghost: number; neverUsed: number }>();
    displayUsers.forEach(u => {
      const fn = u.derivedTeamFunction || "Other";
      const ex = map.get(fn) || { total: 0, active: 0, atRisk: 0, ghost: 0, neverUsed: 0 };
      ex.total++;
      if (u.usageStatus === "Active") ex.active++;
      else if (u.usageStatus === "At Risk") ex.atRisk++;
      else if (u.usageStatus === "Ghost") ex.ghost++;
      else ex.neverUsed++;
      map.set(fn, ex);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name, ...v,
        activeP: v.total > 0 ? Math.round((v.active / v.total) * 100) : 0,
        ghostP: v.total > 0 ? Math.round((v.ghost / v.total) * 100) : 0,
        neverP: v.total > 0 ? Math.round((v.neverUsed / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [displayUsers]);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <Switch id="include-system" checked={includeSystem} onCheckedChange={setIncludeSystem} />
        <Label htmlFor="include-system" className="text-xs text-muted-foreground">
          Include Automated/System &amp; Integration users
        </Label>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-11 gap-2">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
              <p className={`text-lg font-bold ${k.color || "text-foreground"}`}>
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="profile">By Profile</TabsTrigger>
          <TabsTrigger value="role">By Role</TabsTrigger>
          <TabsTrigger value="team">By Team/Function</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="detail">User Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status pie */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Usage Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map(d => (
                        <Cell key={d.name} fill={STATUS_COLORS[d.name] || "hsl(215,16%,47%)"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Team/function bar */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Users by Team / Function</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={teamData} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Users" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Last login month trend */}
          <Card className="shadow-sm mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Last Login by Month (Past 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={loginByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--primary))" name="Users" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Full user list */}
          <Card className="shadow-sm mt-6">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-semibold">All Salesforce Users ({allSorted.length})</CardTitle>
              <Input
                placeholder="Search by name, profile or role…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="max-w-xs h-8 text-xs"
              />
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team/Function</TableHead>
                      <TableHead>Add-on Licenses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Logins (30d)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSorted.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="text-xs font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.profileName}</TableCell>
                        <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                        <TableCell className="text-xs">{u.derivedTeamFunction}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={(u.addOnLicenses || []).join(", ")}>
                          {(u.addOnLicenses || []).length > 0 ? (u.addOnLicenses || []).join(", ") : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{ borderColor: STATUS_COLORS[u.usageStatus], color: STATUS_COLORS[u.usageStatus] }}
                          >
                            {u.usageStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{u.lastLoginDate ? new Date(u.lastLoginDate).toLocaleDateString() : "Never"}</TableCell>
                        <TableCell className="text-xs text-right">{u.logins30d}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <SalesforceInsightsTab users={displayUsers} allHumanUsers={humanUsers} />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileAnalysisTab users={displayUsers} />
        </TabsContent>
        <TabsContent value="role">
          <RoleAnalysisTab users={displayUsers} />
        </TabsContent>
        <TabsContent value="team">
          {/* Team/function detailed breakdown with percentages */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Usage by Team / Function</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team / Function</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Active %</TableHead>
                        <TableHead className="text-right">At Risk</TableHead>
                        <TableHead className="text-right">Ghost</TableHead>
                        <TableHead className="text-right">Ghost %</TableHead>
                        <TableHead className="text-right">Never Used</TableHead>
                        <TableHead className="text-right">Never Used %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamBreakdown.map((t, i) => (
                        <TableRow key={t.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                          <TableCell className="text-xs font-medium">{t.name}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">{t.total}</TableCell>
                          <TableCell className="text-xs text-right">{t.active}</TableCell>
                          <TableCell className="text-xs text-right text-green-600">{t.activeP}%</TableCell>
                          <TableCell className="text-xs text-right">{t.atRisk}</TableCell>
                          <TableCell className="text-xs text-right">{t.ghost}</TableCell>
                          <TableCell className="text-xs text-right text-destructive">{t.ghostP}%</TableCell>
                          <TableCell className="text-xs text-right">{t.neverUsed}</TableCell>
                          <TableCell className="text-xs text-right text-muted-foreground">{t.neverP}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <ActivityAnalysisTab users={displayUsers} loginHistory={loginHistory} hasLoginHistory={hasLoginHistory} includeSystem={includeSystem} />
        </TabsContent>
        <TabsContent value="detail">
          <UserDetailTab users={displayUsers} hasLoginHistory={hasLoginHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
