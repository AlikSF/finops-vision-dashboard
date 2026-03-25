import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProfileAnalysisTab } from "./ProfileAnalysisTab";
import { RoleAnalysisTab } from "./RoleAnalysisTab";
import { ActivityAnalysisTab } from "./ActivityAnalysisTab";
import { UserDetailTab } from "./UserDetailTab";
import { SalesforceInsightsTab } from "./SalesforceInsightsTab";
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

  const humanUsers = safeAll.filter(
    u => u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical"
  );
  const reassignCandidates = humanUsers.filter(
    u => u.usageStatus === "Ghost" || u.usageStatus === "Never Used"
  ).length;

  const kpis = [
    { label: "Total Users in Scope", value: displayUsers.length },
    { label: "SF License Pool", value: totalPool },
    { label: "SF Licenses Used", value: usedPool },
    { label: "SF Licenses Available", value: availablePool },
    { label: "Active (30d)", value: active, color: "text-green-600" },
    { label: "At Risk (31-90d)", value: atRisk, color: "text-yellow-600" },
    { label: "Ghost (>90d)", value: ghost, color: "text-destructive" },
    { label: "Never Used", value: neverUsed, color: "text-muted-foreground" },
    { label: "Reassignment Candidates", value: reassignCandidates, color: "text-destructive" },
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

  // Most active users
  const allSorted = useMemo(() => {
    const q = userSearch.toLowerCase();
    return [...displayUsers]
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.profileName?.toLowerCase().includes(q) || u.roleName?.toLowerCase().includes(q))
      .sort((a, b) => (b.logins30d ?? 0) - (a.logins30d ?? 0));
  }, [displayUsers, userSearch]);

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
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-xl font-bold ${k.color || "text-foreground"}`}>
                {k.value.toLocaleString()}
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

          {/* Most active */}
          {topUsers.length > 0 && (
            <Card className="shadow-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Most Active Salesforce Users (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Team/Function</TableHead>
                        <TableHead className="text-right">Logins (30d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="text-xs font-medium">{u.name}</TableCell>
                          <TableCell className="text-xs">{u.profileName}</TableCell>
                          <TableCell className="text-xs">{u.derivedTeamFunction}</TableCell>
                          <TableCell className="text-xs text-right">{u.logins30d}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights">
          <SalesforceInsightsTab users={displayUsers} />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileAnalysisTab users={displayUsers} />
        </TabsContent>
        <TabsContent value="role">
          <RoleAnalysisTab users={displayUsers} />
        </TabsContent>
        <TabsContent value="team">
          {/* Team/function detailed breakdown */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Usage by Team / Function</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team / Function</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">At Risk</TableHead>
                      <TableHead className="text-right">Ghost</TableHead>
                      <TableHead className="text-right">Never Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamData.map(t => {
                      const teamUsers = displayUsers.filter(u => (u.derivedTeamFunction || "Other") === t.name);
                      return (
                        <TableRow key={t.name}>
                          <TableCell className="text-xs font-medium">{t.name}</TableCell>
                          <TableCell className="text-xs text-right">{teamUsers.length}</TableCell>
                          <TableCell className="text-xs text-right">{teamUsers.filter(u => u.usageStatus === "Active").length}</TableCell>
                          <TableCell className="text-xs text-right">{teamUsers.filter(u => u.usageStatus === "At Risk").length}</TableCell>
                          <TableCell className="text-xs text-right">{teamUsers.filter(u => u.usageStatus === "Ghost").length}</TableCell>
                          <TableCell className="text-xs text-right">{teamUsers.filter(u => u.usageStatus === "Never Used").length}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <ActivityAnalysisTab users={displayUsers} loginHistory={loginHistory} hasLoginHistory={hasLoginHistory} />
        </TabsContent>
        <TabsContent value="detail">
          <UserDetailTab users={displayUsers} hasLoginHistory={hasLoginHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
