import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Search, Users, Ghost, AlertTriangle, DollarSign, Upload, FileDown, Activity, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  computeKPIs, getDaysSinceLogin, getLoginStatus, getLicenseAgeDays, formatLicenseAge,
  getUniqueProfiles, getUniqueRoles, getUniqueLicenses, generateSampleCSV,
} from "@/data/userData";
import { useUploadedData } from "@/hooks/useUploadedData";

const PIE_COLORS = [
  "hsl(153, 60%, 35%)",
  "hsl(200, 70%, 50%)",
  "hsl(35, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(170, 55%, 45%)",
  "hsl(45, 85%, 55%)",
  "hsl(220, 65%, 55%)",
  "hsl(0, 0%, 60%)",
];

function StatusBadge({ status }: { status: "ghost" | "at-risk" | "active" }) {
  if (status === "ghost")
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20">Ghost</Badge>;
  if (status === "at-risk")
    return <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">At Risk</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">Active</Badge>;
}

function LoginDateCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground italic">Never</span>;
  const days = getDaysSinceLogin(date)!;
  const color = days > 90 ? "text-destructive font-medium" : days > 30 ? "text-orange-600 dark:text-orange-400 font-medium" : "text-emerald-600 dark:text-emerald-400";
  return (
    <span className={color}>
      {format(new Date(date), "MMM d, yyyy")}
      <span className="text-xs ml-1 opacity-70">({days}d ago)</span>
    </span>
  );
}

function EmptyState() {
  const downloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "license-optimizer-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Upload Your Salesforce Export</h2>
          <p className="text-sm text-muted-foreground">
            Use the upload zone in the sidebar to drop your CSV file. The dashboard will analyze your license usage instantly.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileDown className="h-4 w-4" />
            Download Sample Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** Group small slices into "Other" — keep top N */
function groupSmallSlices(data: { name: string; value: number }[], topN: number) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= topN) return sorted;
  const top = sorted.slice(0, topN);
  const otherValue = sorted.slice(topN).reduce((sum, d) => sum + d.value, 0);
  return [...top, { name: `Other (${sorted.length - topN})`, value: otherValue }];
}

/** Truncate long text */
function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

const ROWS_PER_PAGE = 50;

const Index = () => {
  const { users, uploadTimestamp, isProcessing, handleFileUpload, clearData } = useUploadedData();
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLicense, setSelectedLicense] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const profiles = useMemo(() => getUniqueProfiles(users), [users]);
  const roles = useMemo(() => getUniqueRoles(users), [users]);
  const licenses = useMemo(() => getUniqueLicenses(users), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchProfile = selectedProfile === "all" || u.profileName === selectedProfile;
      const matchRole = selectedRole === "all" || u.roleName === selectedRole;
      const matchLicense = selectedLicense === "all" || u.licenseName === selectedLicense;
      const matchSearch =
        search === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchProfile && matchRole && matchLicense && matchSearch;
    });
  }, [users, search, selectedProfile, selectedRole, selectedLicense]);

  useEffect(() => { setCurrentPage(0); }, [filteredUsers]);

  const totalPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  const kpis = useMemo(() => computeKPIs(filteredUsers), [filteredUsers]);

  // Overview charts
  const licenseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      counts[u.profileName || "Unknown"] = (counts[u.profileName || "Unknown"] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredUsers]);

  const pieData = useMemo(() => groupSmallSlices(licenseDistribution, 8), [licenseDistribution]);

  const inactiveByProfile = useMemo(() => {
    const map: Record<string, { ghost: number; atRisk: number; active: number }> = {};
    filteredUsers.forEach((u) => {
      const profile = u.profileName || "Unknown";
      if (!map[profile]) map[profile] = { ghost: 0, atRisk: 0, active: 0 };
      const status = getLoginStatus(getDaysSinceLogin(u.lastLoginDate));
      map[profile][status === "at-risk" ? "atRisk" : status]++;
    });
    return Object.entries(map)
      .map(([profile, counts]) => ({ profile, total: counts.active + counts.atRisk + counts.ghost, ...counts }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filteredUsers]);

  // Role analysis
  const roleAnalysis = useMemo(() => {
    const map: Record<string, { total: number; active: number; ghost: number; atRisk: number }> = {};
    filteredUsers.forEach((u) => {
      const role = u.roleName || "No Role";
      if (!map[role]) map[role] = { total: 0, active: 0, ghost: 0, atRisk: 0 };
      map[role].total++;
      const status = getLoginStatus(getDaysSinceLogin(u.lastLoginDate));
      if (status === "active") map[role].active++;
      else if (status === "ghost") map[role].ghost++;
      else map[role].atRisk++;
    });
    return Object.entries(map)
      .map(([role, counts]) => ({ role, ...counts }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filteredUsers]);

  // Profile summary table
  const profileSummary = useMemo(() => {
    const map: Record<string, { total: number; active: number; ghost: number }> = {};
    filteredUsers.forEach((u) => {
      const p = u.profileName || "Unknown";
      if (!map[p]) map[p] = { total: 0, active: 0, ghost: 0 };
      map[p].total++;
      const status = getLoginStatus(getDaysSinceLogin(u.lastLoginDate));
      if (status === "active") map[p].active++;
      else if (status === "ghost") map[p].ghost++;
    });
    return Object.entries(map)
      .map(([profile, c]) => ({
        profile,
        total: c.total,
        activePercent: c.total > 0 ? Math.round((c.active / c.total) * 100) : 0,
        ghostCount: c.ghost,
        estimatedWaste: c.ghost * 150,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredUsers]);

  // License age distribution
  const licenseAgeDistribution = useMemo(() => {
    const buckets = { "0-30d": 0, "30-90d": 0, "90-180d": 0, "180d-1yr": 0, "1yr+": 0, "Unknown": 0 };
    filteredUsers.forEach((u) => {
      const days = getLicenseAgeDays(u.createdDate);
      if (days === null) buckets["Unknown"]++;
      else if (days <= 30) buckets["0-30d"]++;
      else if (days <= 90) buckets["30-90d"]++;
      else if (days <= 180) buckets["90-180d"]++;
      else if (days <= 365) buckets["180d-1yr"]++;
      else buckets["1yr+"]++;
    });
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([range, count]) => ({ range, count }));
  }, [filteredUsers]);

  // Oldest ghost licenses
  const oldestGhosts = useMemo(() => {
    return filteredUsers
      .filter((u) => getLoginStatus(getDaysSinceLogin(u.lastLoginDate)) === "ghost" && u.createdDate)
      .sort((a, b) => new Date(a.createdDate!).getTime() - new Date(b.createdDate!).getTime())
      .slice(0, 10);
  }, [filteredUsers]);

  const kpiCards = [
    { title: "Total Licenses", value: kpis.totalLicenses.toLocaleString(), icon: Users, color: "text-primary" },
    { title: "Active Users", value: kpis.activeUsers.toLocaleString(), subtitle: "Logged in <30 days", icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
    { title: "Ghost Users", value: kpis.ghostUsers.toLocaleString(), subtitle: ">90 days inactive", icon: Ghost, color: "text-destructive" },
    { title: "At-Risk Users", value: kpis.atRiskUsers.toLocaleString(), subtitle: ">30 days inactive", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
    { title: "Utilization Rate", value: `${kpis.utilizationRate}%`, icon: TrendingUp, color: kpis.utilizationRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive" },
    { title: "Est. Wasted Spend", value: `$${kpis.wastedSpend.toLocaleString()}`, subtitle: "/month", icon: DollarSign, color: "text-destructive" },
  ];

  return (
    <DashboardLayout
      profiles={profiles}
      roles={roles}
      licenses={licenses}
      selectedProfile={selectedProfile}
      selectedRole={selectedRole}
      selectedLicense={selectedLicense}
      onProfileChange={setSelectedProfile}
      onRoleChange={setSelectedRole}
      onLicenseChange={setSelectedLicense}
      onFileUpload={handleFileUpload}
      isProcessing={isProcessing}
      uploadTimestamp={uploadTimestamp}
      onClearData={clearData}
    >
      {users.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* KPI Tiles — 3 per row for readability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className={`text-3xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</div>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabbed Charts */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profiles">Profile Analysis</TabsTrigger>
              <TabsTrigger value="roles">Role Analysis</TabsTrigger>
              <TabsTrigger value="age">License Age</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart with side legend */}
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">License Distribution by Profile</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="w-full md:w-1/2 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} paddingAngle={2} dataKey="value">
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => value.toLocaleString()} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <ScrollArea className="w-full md:w-1/2 h-[280px]">
                        <div className="space-y-2 pr-3">
                          {pieData.map((entry, i) => (
                            <div key={entry.name} className="flex items-center justify-between text-sm gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate text-foreground">{entry.name}</span>
                              </div>
                              <span className="font-medium text-muted-foreground tabular-nums shrink-0">{entry.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar chart — horizontal for long profile names */}
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Activity by Profile (Top 12)</CardTitle></CardHeader>
                  <CardContent className="h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inactiveByProfile} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="profile" width={140} tick={{ fontSize: 11 }} tickFormatter={(v) => truncate(v, 20)} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="active" name="Active" stackId="a" fill="hsl(153, 60%, 40%)" />
                        <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="hsl(35, 92%, 50%)" />
                        <Bar dataKey="ghost" name="Ghost" stackId="a" fill="hsl(0, 70%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profiles" className="mt-4">
              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Users per Profile (Top 12)</CardTitle></CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inactiveByProfile} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="profile" width={150} tick={{ fontSize: 11 }} tickFormatter={(v) => truncate(v, 22)} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="active" name="Active" stackId="a" fill="hsl(153, 60%, 40%)" />
                        <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="hsl(35, 92%, 50%)" />
                        <Bar dataKey="ghost" name="Ghost" stackId="a" fill="hsl(0, 70%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Profile Summary</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Profile</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Active %</TableHead>
                            <TableHead className="text-right">Ghost</TableHead>
                            <TableHead className="text-right">Est. Waste/mo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profileSummary.map((p, i) => (
                            <TableRow key={p.profile} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                              <TableCell className="font-medium max-w-[200px] truncate">{p.profile}</TableCell>
                              <TableCell className="text-right tabular-nums">{p.total.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={p.activePercent >= 70 ? "default" : "destructive"} className="text-xs">
                                  {p.activePercent}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{p.ghostCount.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-destructive font-medium tabular-nums">${p.estimatedWaste.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Users by Role (Top 12)</CardTitle></CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleAnalysis} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="role" width={150} tick={{ fontSize: 11 }} tickFormatter={(v) => truncate(v, 22)} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="active" name="Active" stackId="a" fill="hsl(153, 60%, 40%)" />
                        <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="hsl(35, 92%, 50%)" />
                        <Bar dataKey="ghost" name="Ghost" stackId="a" fill="hsl(0, 70%, 55%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Role Summary</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Active</TableHead>
                            <TableHead className="text-right">Ghost</TableHead>
                            <TableHead className="text-right">Utilization</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleAnalysis.map((r, i) => (
                            <TableRow key={r.role} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                              <TableCell className="font-medium max-w-[200px] truncate">{r.role}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.total.toLocaleString()}</TableCell>
                              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{r.active.toLocaleString()}</TableCell>
                              <TableCell className="text-right tabular-nums text-destructive">{r.ghost.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={r.total > 0 && (r.active / r.total) >= 0.7 ? "default" : "destructive"} className="text-xs">
                                  {r.total > 0 ? Math.round((r.active / r.total) * 100) : 0}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="age" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">License Age Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={licenseAgeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => value.toLocaleString()} />
                        <Bar dataKey="count" name="Licenses" fill="hsl(153, 60%, 35%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader><CardTitle className="text-base">Oldest Ghost Licenses</CardTitle></CardHeader>
                  <CardContent>
                    {oldestGhosts.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">No ghost users with creation dates found.</p>
                    ) : (
                      <ScrollArea className="max-h-[340px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Profile</TableHead>
                              <TableHead>License Age</TableHead>
                              <TableHead>Last Login</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {oldestGhosts.map((u, i) => (
                              <TableRow key={u.id} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell className="max-w-[120px] truncate">{u.profileName}</TableCell>
                                <TableCell className="text-destructive font-medium tabular-nums">{formatLicenseAge(u.createdDate)}</TableCell>
                                <TableCell><LoginDateCell date={u.lastLoginDate} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Data Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5">
              <div className="space-y-1">
                <CardTitle className="text-base">User Licenses</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{Math.min(currentPage * ROWS_PER_PAGE + 1, filteredUsers.length).toLocaleString()}–{Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredUsers.length).toLocaleString()}</span> of <span className="font-medium text-foreground">{filteredUsers.length.toLocaleString()}</span> records
                </p>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>License Age</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          No users found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u, i) => {
                        const days = getDaysSinceLogin(u.lastLoginDate);
                        const status = getLoginStatus(days);
                        return (
                          <TableRow key={u.id} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">{u.email}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{u.profileName}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{u.roleName || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="tabular-nums">{formatLicenseAge(u.createdDate)}</TableCell>
                            <TableCell><LoginDateCell date={u.lastLoginDate} /></TableCell>
                            <TableCell><StatusBadge status={status} /></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Page <span className="font-medium text-foreground">{currentPage + 1}</span> of <span className="font-medium text-foreground">{totalPages}</span></p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
