import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserDetailTab } from "./UserDetailTab";
import type { EnrichedUser, LoginRecord } from "@/data/dataModels";

const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 71%, 45%)",
  "At Risk": "hsl(45, 93%, 47%)",
  Ghost: "hsl(0, 84%, 60%)",
  "Never Used": "hsl(215, 16%, 47%)",
};

const SEGMENT_COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(280, 67%, 55%)"];

interface Props {
  users: EnrichedUser[];
  loginHistory: LoginRecord[];
  hasLoginHistory: boolean;
}

export function CommunityUsageTab({ users, loginHistory, hasLoginHistory }: Props) {
  const safeUsers = users || [];

  const b2b = safeUsers.filter(u => u.derivedCategory === "ePortal B2B").length;
  const b2c = safeUsers.filter(u => u.derivedCategory === "ePortal B2C").length;
  const other = safeUsers.filter(u => u.derivedCategory === "External/Community Other").length;
  const active = safeUsers.filter(u => u.usageStatus === "Active").length;
  const atRisk = safeUsers.filter(u => u.usageStatus === "At Risk").length;
  const ghost = safeUsers.filter(u => u.usageStatus === "Ghost").length;
  const neverUsed = safeUsers.filter(u => u.usageStatus === "Never Used").length;
  const adoptionRate = safeUsers.length > 0 ? Math.round((active / safeUsers.length) * 100) : 0;

  const kpis = [
    { label: "Total ePortal Users", value: safeUsers.length },
    { label: "B2B Users", value: b2b },
    { label: "B2C Users", value: b2c },
    { label: "External/Other", value: other },
    { label: "Active (30d)", value: active, color: "text-green-600" },
    { label: "At Risk", value: atRisk, color: "text-yellow-600" },
    { label: "Ghost", value: ghost, color: "text-destructive" },
    { label: "Never Used", value: neverUsed, color: "text-muted-foreground" },
    { label: "Adoption Rate", value: `${adoptionRate}%`, color: "text-primary" },
  ];

  const segmentData = [
    { name: "ePortal B2B", value: b2b },
    { name: "ePortal B2C", value: b2c },
    { name: "External/Other", value: other },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: "Active", value: active },
    { name: "At Risk", value: atRisk },
    { name: "Ghost", value: ghost },
    { name: "Never Used", value: neverUsed },
  ].filter(d => d.value > 0);

  // By profile
  const profileMap = new Map<string, number>();
  safeUsers.forEach(u => {
    const p = u.profileName || "Unknown";
    profileMap.set(p, (profileMap.get(p) || 0) + 1);
  });
  const profileData = Array.from(profileMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // By role
  const roleMap = new Map<string, number>();
  safeUsers.forEach(u => {
    const r = u.roleName || "No Role";
    roleMap.set(r, (roleMap.get(r) || 0) + 1);
  });
  const roleData = Array.from(roleMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // Login trend
  const userIds = useMemo(() => new Set(safeUsers.map(u => u.id)), [safeUsers]);
  const loginTrend = useMemo(() => {
    if (!hasLoginHistory) return [];
    const dayMap = new Map<string, number>();
    (loginHistory || []).forEach(l => {
      if (!userIds.has(l.userId)) return;
      const day = l.loginTime?.slice(0, 10);
      if (day) dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    return Array.from(dayMap.entries())
      .map(([date, logins]) => ({ date, logins }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [loginHistory, userIds, hasLoginHistory]);

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-xl font-bold ${k.color || "text-foreground"}`}>
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">By Profile</TabsTrigger>
          <TabsTrigger value="role">By Role</TabsTrigger>
          {hasLoginHistory && <TabsTrigger value="trend">Login Trend</TabsTrigger>}
          <TabsTrigger value="detail">User Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment pie */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">B2B vs B2C vs Other</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={segmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {segmentData.map((_, i) => (
                        <Cell key={i} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status pie */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
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
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Users by Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(250, profileData.length * 35)}>
                <BarChart data={profileData} layout="vertical" margin={{ left: 180 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Users" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(250, roleData.length * 35)}>
                <BarChart data={roleData} layout="vertical" margin={{ left: 180 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Users" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {hasLoginHistory && (
          <TabsContent value="trend">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Community Login Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={loginTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="logins" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="detail">
          <UserDetailTab users={safeUsers} hasLoginHistory={hasLoginHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
