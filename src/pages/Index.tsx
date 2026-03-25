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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  computeKPIs, getDaysSinceLogin, getLoginStatus, getLicenseAgeDays, formatLicenseAge,
  getUniqueProfiles, getUniqueRoles, getUniqueLicenses, generateSampleCSV,
} from "@/data/userData";
import { useUploadedData } from "@/hooks/useUploadedData";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
  "hsl(153, 60%, 40%)",
  "hsl(200, 70%, 50%)",
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
      <Card className="max-w-md w-full text-center">
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

  const inactiveByProfile = useMemo(() => {
    const map: Record<string, { ghost: number; atRisk: number; active: number }> = {};
    filteredUsers.forEach((u) => {
      const profile = u.profileName || "Unknown";
      if (!map[profile]) map[profile] = { ghost: 0, atRisk: 0, active: 0 };
      const status = getLoginStatus(getDaysSinceLogin(u.lastLoginDate));
      map[profile][status === "at-risk" ? "atRisk" : status]++;
    });
    return Object.entries(map).map(([profile, counts]) => ({ profile, ...counts }));
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
    return Object.entries(map).map(([role, counts]) => ({ role, ...counts }));
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
    return Object.entries(map).map(([profile, c]) => ({
      profile,
      total: c.total,
      activePercent: c.total > 0 ? Math.round((c.active / c.total) * 100) : 0,
      ghostCount: c.ghost,
      estimatedWaste: c.ghost * 150,
    }));
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
    { title: "Total Licenses", value: kpis.totalLicenses, icon: Users, color: "text-primary" },
    { title: "Active Users", value: kpis.activeUsers, subtitle: "Logged in <30 days", icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
    { title: "Ghost Users", value: kpis.ghostUsers, subtitle: ">90 days inactive", icon: Ghost, color: "text-destructive" },
    { title: "At-Risk Users", value: kpis.atRiskUsers, subtitle: ">30 days inactive", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
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
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabbed Charts */}
          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profiles">Profile Analysis</TabsTrigger>
              <TabsTrigger value="roles">Role Analysis</TabsTrigger>
              <TabsTrigger value="age">License Age</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">License Distribution by Profile</CardTitle></CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={licenseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                          {licenseDistribution.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Activity by Profile</CardTitle></CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inactiveByProfile}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="profile" className="text-xs" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="active" name="Active" fill="hsl(153, 60%, 40%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="atRisk" name="At Risk (>30d)" fill="hsl(35, 92%, 50%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ghost" name="Ghost (>90d)" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profiles">
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Users per Profile</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inactiveByProfile} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="profile" width={150} className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="active" name="Active" stackId="a" fill="hsl(153, 60%, 40%)" />
                        <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="hsl(35, 92%, 50%)" />
                        <Bar dataKey="ghost" name="Ghost" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Profile Summary</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profile</TableHead>
                          <TableHead>Total Users</TableHead>
                          <TableHead>Active %</TableHead>
                          <TableHead>Ghost Users</TableHead>
                          <TableHead>Est. Waste/mo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileSummary.map((p) => (
                          <TableRow key={p.profile}>
                            <TableCell className="font-medium">{p.profile}</TableCell>
                            <TableCell>{p.total}</TableCell>
                            <TableCell>
                              <Badge variant={p.activePercent >= 70 ? "default" : "destructive"} className="text-xs">
                                {p.activePercent}%
                              </Badge>
                            </TableCell>
                            <TableCell>{p.ghostCount}</TableCell>
                            <TableCell className="text-destructive font-medium">${p.estimatedWaste.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="role" className="text-xs" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="active" name="Active" stackId="a" fill="hsl(153, 60%, 40%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="atRisk" name="At Risk" stackId="a" fill="hsl(35, 92%, 50%)" />
                        <Bar dataKey="ghost" name="Ghost" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Role Summary</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Ghost</TableHead>
                          <TableHead>Utilization</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleAnalysis.map((r) => (
                          <TableRow key={r.role}>
                            <TableCell className="font-medium">{r.role}</TableCell>
                            <TableCell>{r.total}</TableCell>
                            <TableCell className="text-emerald-600 dark:text-emerald-400">{r.active}</TableCell>
                            <TableCell className="text-destructive">{r.ghost}</TableCell>
                            <TableCell>
                              <Badge variant={r.total > 0 && (r.active / r.total) >= 0.7 ? "default" : "destructive"} className="text-xs">
                                {r.total > 0 ? Math.round((r.active / r.total) * 100) : 0}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="age">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">License Age Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={licenseAgeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="range" className="text-xs" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Licenses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Oldest Ghost Licenses</CardTitle></CardHeader>
                  <CardContent>
                    {oldestGhosts.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">No ghost users with creation dates found.</p>
                    ) : (
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
                          {oldestGhosts.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.name}</TableCell>
                              <TableCell>{u.profileName}</TableCell>
                              <TableCell className="text-destructive font-medium">{formatLicenseAge(u.createdDate)}</TableCell>
                              <TableCell><LoginDateCell date={u.lastLoginDate} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Data Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">User Licenses</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const days = getDaysSinceLogin(u.lastLoginDate);
                      const status = getLoginStatus(days);
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{u.profileName}</TableCell>
                          <TableCell>{u.roleName || <span className="text-muted-foreground italic">—</span>}</TableCell>
                          <TableCell>{formatLicenseAge(u.createdDate)}</TableCell>
                          <TableCell><LoginDateCell date={u.lastLoginDate} /></TableCell>
                          <TableCell><StatusBadge status={status} /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default Index;
