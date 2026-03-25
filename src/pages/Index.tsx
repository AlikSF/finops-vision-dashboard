import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, Users, Ghost, AlertTriangle, DollarSign, Upload, FileDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  computeKPIs, getDaysSinceLogin, getLoginStatus,
  getUniqueDepartments, getUniqueLicenses, generateSampleCSV,
} from "@/data/userData";
import { useUploadedData } from "@/hooks/useUploadedData";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
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

const Index = () => {
  const { users, uploadTimestamp, isProcessing, handleFileUpload, clearData } = useUploadedData();
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLicense, setSelectedLicense] = useState("all");

  const departments = useMemo(() => getUniqueDepartments(users), [users]);
  const licenses = useMemo(() => getUniqueLicenses(users), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchDept = selectedDepartment === "all" || u.department === selectedDepartment;
      const matchLicense = selectedLicense === "all" || u.licenseName === selectedLicense;
      const matchSearch =
        search === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchLicense && matchSearch;
    });
  }, [users, search, selectedDepartment, selectedLicense]);

  const kpis = useMemo(() => computeKPIs(filteredUsers), [filteredUsers]);

  const licenseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      counts[u.profileName || "Unknown"] = (counts[u.profileName || "Unknown"] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredUsers]);

  const inactiveByDept = useMemo(() => {
    const deptCounts: Record<string, { ghost: number; atRisk: number }> = {};
    filteredUsers.forEach((u) => {
      const dept = u.department || "Unknown";
      if (!deptCounts[dept]) deptCounts[dept] = { ghost: 0, atRisk: 0 };
      const status = getLoginStatus(getDaysSinceLogin(u.lastLoginDate));
      if (status === "ghost") deptCounts[dept].ghost++;
      else if (status === "at-risk") deptCounts[dept].atRisk++;
    });
    return Object.entries(deptCounts).map(([department, counts]) => ({ department, ...counts }));
  }, [filteredUsers]);

  const kpiCards = [
    { title: "Total Licenses", value: kpis.totalLicenses, icon: Users, color: "text-primary" },
    { title: "Ghost Users", value: kpis.ghostUsers, subtitle: ">90 days inactive", icon: Ghost, color: "text-destructive" },
    { title: "At-Risk Users", value: kpis.atRiskUsers, subtitle: ">30 days inactive", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
    { title: "Est. Wasted Spend", value: `$${kpis.wastedSpend.toLocaleString()}`, subtitle: "/month", icon: DollarSign, color: "text-destructive" },
  ];

  return (
    <DashboardLayout
      departments={departments}
      licenses={licenses}
      selectedDepartment={selectedDepartment}
      selectedLicense={selectedLicense}
      onDepartmentChange={setSelectedDepartment}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">License Distribution</CardTitle>
              </CardHeader>
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
              <CardHeader>
                <CardTitle className="text-base">Inactive Users by Department</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inactiveByDept}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="department" className="text-xs" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ghost" name="Ghost (>90d)" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atRisk" name="At Risk (>30d)" fill="hsl(35, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                          <TableCell>{u.department}</TableCell>
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
