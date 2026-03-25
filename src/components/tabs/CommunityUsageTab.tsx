import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import type { EnrichedUser, LoginRecord } from "@/data/dataModels";

const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 71%, 45%)",
  "At Risk": "hsl(45, 93%, 47%)",
  Ghost: "hsl(0, 84%, 60%)",
  "Never Used": "hsl(215, 16%, 47%)",
};
const SEGMENT_COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(280, 67%, 55%)"];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "At Risk": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Ghost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Never Used": "bg-muted text-muted-foreground",
};

interface Props {
  users: EnrichedUser[];
  loginHistory: LoginRecord[];
  hasLoginHistory: boolean;
}

export function CommunityUsageTab({ users, loginHistory, hasLoginHistory }: Props) {
  const safeUsers = users || [];
  const [detailSearch, setDetailSearch] = useState("");
  const [detailPage, setDetailPage] = useState(0);
  const PAGE_SIZE = 50;

  const b2b = safeUsers.filter(u => u.derivedCategory === "ePortal B2B").length;
  const b2c = safeUsers.filter(u => u.derivedCategory === "ePortal B2C").length;
  const other = safeUsers.filter(u => u.derivedCategory === "External/Community Other").length;
  const active = safeUsers.filter(u => u.usageStatus === "Active").length;
  const atRisk = safeUsers.filter(u => u.usageStatus === "At Risk").length;
  const ghost = safeUsers.filter(u => u.usageStatus === "Ghost").length;
  const neverUsed = safeUsers.filter(u => u.usageStatus === "Never Used").length;
  const orgUsageRate = safeUsers.length > 0 ? Math.round((active / safeUsers.length) * 100) : 0;
  const adoptionRate = safeUsers.length > 0 ? Math.round(((active + atRisk) / safeUsers.length) * 100) : 0;

  const kpis = [
    { label: "Total ePortal Users", value: safeUsers.length },
    { label: "B2B Users", value: b2b },
    { label: "B2C Users", value: b2c },
    { label: "Org Usage Rate", value: `${orgUsageRate}%`, color: orgUsageRate >= 70 ? "text-green-600" : orgUsageRate >= 50 ? "text-yellow-600" : "text-destructive" },
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

  // By profile with percentages
  const profileBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; active: number; atRisk: number; ghost: number; neverUsed: number }>();
    safeUsers.forEach(u => {
      const p = u.profileName || "Unknown";
      const ex = map.get(p) || { total: 0, active: 0, atRisk: 0, ghost: 0, neverUsed: 0 };
      ex.total++;
      if (u.usageStatus === "Active") ex.active++;
      else if (u.usageStatus === "At Risk") ex.atRisk++;
      else if (u.usageStatus === "Ghost") ex.ghost++;
      else ex.neverUsed++;
      map.set(p, ex);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name, ...v,
        activeP: v.total > 0 ? Math.round((v.active / v.total) * 100) : 0,
        ghostP: v.total > 0 ? Math.round((v.ghost / v.total) * 100) : 0,
        neverP: v.total > 0 ? Math.round((v.neverUsed / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [safeUsers]);

  // By role with percentages
  const roleBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; active: number; atRisk: number; ghost: number; neverUsed: number }>();
    safeUsers.forEach(u => {
      const r = u.roleName || "No Role";
      const ex = map.get(r) || { total: 0, active: 0, atRisk: 0, ghost: 0, neverUsed: 0 };
      ex.total++;
      if (u.usageStatus === "Active") ex.active++;
      else if (u.usageStatus === "At Risk") ex.atRisk++;
      else if (u.usageStatus === "Ghost") ex.ghost++;
      else ex.neverUsed++;
      map.set(r, ex);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name, ...v,
        activeP: v.total > 0 ? Math.round((v.active / v.total) * 100) : 0,
        ghostP: v.total > 0 ? Math.round((v.ghost / v.total) * 100) : 0,
        neverP: v.total > 0 ? Math.round((v.neverUsed / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [safeUsers]);

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

  // Login coverage
  const loginCoverage30 = safeUsers.filter(u => u.logins30d > 0).length;
  const loginCoverage90 = safeUsers.filter(u => u.logins90d > 0).length;

  // User detail
  const detailFiltered = useMemo(() => {
    if (!detailSearch) return safeUsers;
    const q = detailSearch.toLowerCase();
    return safeUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.profileName?.toLowerCase().includes(q) || u.roleName?.toLowerCase().includes(q)
    );
  }, [safeUsers, detailSearch]);

  const detailPaged = detailFiltered.slice(detailPage * PAGE_SIZE, (detailPage + 1) * PAGE_SIZE);
  const detailTotalPages = Math.ceil(detailFiltered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-2">
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

          {/* Login coverage summary */}
          {hasLoginHistory && (
            <Card className="shadow-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Login Coverage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Users with logins in 30d</p>
                    <p className="text-2xl font-bold text-foreground">{loginCoverage30} <span className="text-sm text-muted-foreground">/ {safeUsers.length}</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Users with logins in 90d</p>
                    <p className="text-2xl font-bold text-foreground">{loginCoverage90} <span className="text-sm text-muted-foreground">/ {safeUsers.length}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile">
          <div className="space-y-6">
            {profileBreakdown.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Profiles — Usage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(250, Math.min(profileBreakdown.length, 10) * 35)}>
                    <BarChart data={profileBreakdown.slice(0, 10)} layout="vertical" margin={{ left: 180 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="active" stackId="a" fill="hsl(142, 71%, 45%)" name="Active" />
                      <Bar dataKey="atRisk" stackId="a" fill="hsl(38, 92%, 50%)" name="At Risk" />
                      <Bar dataKey="ghost" stackId="a" fill="hsl(0, 84%, 60%)" name="Ghost" />
                      <Bar dataKey="neverUsed" stackId="a" fill="hsl(215, 16%, 47%)" name="Never Used" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">All Profiles Summary ({profileBreakdown.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Active %</TableHead>
                        <TableHead className="text-right">Ghost</TableHead>
                        <TableHead className="text-right">Ghost %</TableHead>
                        <TableHead className="text-right">Never Used</TableHead>
                        <TableHead className="text-right">Never Used %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profileBreakdown.map((p, i) => (
                        <TableRow key={p.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                          <TableCell className="font-medium text-xs">{p.name}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{p.total}</TableCell>
                          <TableCell className="text-right text-xs">{p.active}</TableCell>
                          <TableCell className="text-right text-xs text-green-600">{p.activeP}%</TableCell>
                          <TableCell className="text-right text-xs">{p.ghost}</TableCell>
                          <TableCell className="text-right text-xs text-destructive">{p.ghostP}%</TableCell>
                          <TableCell className="text-right text-xs">{p.neverUsed}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{p.neverP}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="role">
          <div className="space-y-6">
            {roleBreakdown.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Roles — Usage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(250, Math.min(roleBreakdown.length, 15) * 35)}>
                    <BarChart data={roleBreakdown.slice(0, 15)} layout="vertical" margin={{ left: 180 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="active" stackId="a" fill="hsl(142, 71%, 45%)" name="Active" />
                      <Bar dataKey="atRisk" stackId="a" fill="hsl(38, 92%, 50%)" name="At Risk" />
                      <Bar dataKey="ghost" stackId="a" fill="hsl(0, 84%, 60%)" name="Ghost" />
                      <Bar dataKey="neverUsed" stackId="a" fill="hsl(215, 16%, 47%)" name="Never Used" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">All Roles Summary ({roleBreakdown.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Active %</TableHead>
                        <TableHead className="text-right">Ghost</TableHead>
                        <TableHead className="text-right">Ghost %</TableHead>
                        <TableHead className="text-right">Never Used</TableHead>
                        <TableHead className="text-right">Never Used %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleBreakdown.map((r, i) => (
                        <TableRow key={r.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                          <TableCell className="font-medium text-xs">{r.name}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{r.total}</TableCell>
                          <TableCell className="text-right text-xs">{r.active}</TableCell>
                          <TableCell className="text-right text-xs text-green-600">{r.activeP}%</TableCell>
                          <TableCell className="text-right text-xs">{r.ghost}</TableCell>
                          <TableCell className="text-right text-xs text-destructive">{r.ghostP}%</TableCell>
                          <TableCell className="text-right text-xs">{r.neverUsed}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{r.neverP}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {hasLoginHistory && (
          <TabsContent value="trend">
            <div className="space-y-6">
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

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Login Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-md">
                      <p className="text-xs text-muted-foreground">Active in 30 days</p>
                      <p className="text-2xl font-bold text-foreground">{loginCoverage30} <span className="text-sm text-muted-foreground">/ {safeUsers.length}</span></p>
                      <p className="text-xs text-muted-foreground">{safeUsers.length > 0 ? Math.round((loginCoverage30 / safeUsers.length) * 100) : 0}%</p>
                    </div>
                    <div className="text-center p-4 border rounded-md">
                      <p className="text-xs text-muted-foreground">Active in 90 days</p>
                      <p className="text-2xl font-bold text-foreground">{loginCoverage90} <span className="text-sm text-muted-foreground">/ {safeUsers.length}</span></p>
                      <p className="text-xs text-muted-foreground">{safeUsers.length > 0 ? Math.round((loginCoverage90 / safeUsers.length) * 100) : 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="detail">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-semibold">Community User Details ({detailFiltered.length})</CardTitle>
              <Input
                placeholder="Search by name, profile, role…"
                value={detailSearch}
                onChange={e => { setDetailSearch(e.target.value); setDetailPage(0); }}
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
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Days Since</TableHead>
                      {hasLoginHistory && (
                        <>
                          <TableHead className="text-right">7d</TableHead>
                          <TableHead className="text-right">30d</TableHead>
                          <TableHead className="text-right">90d</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailPaged.map((u, i) => (
                      <TableRow key={u.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                        <TableCell className="text-xs font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.profileName}</TableCell>
                        <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.derivedCategory}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[u.usageStatus] || ""}`}>{u.usageStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{u.lastLoginDate ? new Date(u.lastLoginDate).toLocaleDateString() : "Never"}</TableCell>
                        <TableCell className="text-xs text-right">{u.daysSinceLogin ?? "—"}</TableCell>
                        {hasLoginHistory && (
                          <>
                            <TableCell className="text-xs text-right">{u.logins7d}</TableCell>
                            <TableCell className="text-xs text-right">{u.logins30d}</TableCell>
                            <TableCell className="text-xs text-right">{u.logins90d}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {detailTotalPages > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">Page {detailPage + 1} of {detailTotalPages}</p>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 text-xs border rounded disabled:opacity-50" disabled={detailPage === 0} onClick={() => setDetailPage(p => p - 1)}>Prev</button>
                    <button className="px-2 py-1 text-xs border rounded disabled:opacity-50" disabled={detailPage >= detailTotalPages - 1} onClick={() => setDetailPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
