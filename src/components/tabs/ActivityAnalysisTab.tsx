import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import type { EnrichedUser, LoginRecord } from "@/data/dataModels";

const COLORS = [
  "hsl(153, 100%, 13%)", "hsl(210, 80%, 50%)", "hsl(35, 90%, 55%)", "hsl(0, 70%, 55%)",
  "hsl(270, 60%, 55%)", "hsl(180, 60%, 40%)", "hsl(330, 70%, 55%)", "hsl(50, 80%, 50%)",
];

interface ActivityAnalysisTabProps {
  users: EnrichedUser[];
  loginHistory: LoginRecord[];
  hasLoginHistory: boolean;
  includeSystem?: boolean;
}

export function ActivityAnalysisTab({ users, loginHistory, hasLoginHistory, includeSystem = false }: ActivityAnalysisTabProps) {
  // Filter for human users in charts by default
  const humanUsers = useMemo(() => {
    if (includeSystem) return users;
    return users.filter(u => u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical");
  }, [users, includeSystem]);

  if (!hasLoginHistory) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Upload Login History CSV to see activity analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const activityBuckets = [
    { label: "7 days", key: "logins7d" as const },
    { label: "30 days", key: "logins30d" as const },
    { label: "90 days", key: "logins90d" as const },
  ];

  const bucketData = activityBuckets.map(b => {
    const withActivity = users.filter(u => u[b.key] > 0).length;
    const withoutActivity = users.length - withActivity;
    return { period: b.label, "With Logins": withActivity, "No Logins": withoutActivity };
  });

  // Login type distribution
  const loginTypeCounts = new Map<string, number>();
  loginHistory.forEach(l => {
    if (l.status === "Success") {
      const t = l.loginType || "Unknown";
      loginTypeCounts.set(t, (loginTypeCounts.get(t) || 0) + 1);
    }
  });
  const loginTypeData = Array.from(loginTypeCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Application distribution
  const appCounts = new Map<string, number>();
  loginHistory.forEach(l => {
    if (l.status === "Success") {
      const a = l.application || "Unknown";
      appCounts.set(a, (appCounts.get(a) || 0) + 1);
    }
  });
  const appData = Array.from(appCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top active human users
  const topUsers = [...humanUsers].sort((a, b) => b.logins90d - a.logins90d).slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Login Activity Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="With Logins" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="No Logins" fill="hsl(215, 16%, 47%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Login Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={loginTypeData} dataKey="value" cx="50%" cy="50%" outerRadius={90} strokeWidth={1}>
                      {loginTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-1 overflow-auto max-h-[250px]">
                {loginTypeData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground truncate flex-1">{d.name}</span>
                    <span className="text-muted-foreground font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appData} layout="vertical" margin={{ left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(210, 80%, 50%)" name="Logins" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Most Active Users (90 days) — Excludes System/Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={topUsers.map(u => ({ name: u.name || u.username, "7d": u.logins7d, "30d": u.logins30d, "90d": u.logins90d }))} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="7d" fill="hsl(153, 100%, 13%)" name="Last 7 days" />
              <Bar dataKey="30d" fill="hsl(210, 80%, 50%)" name="Last 30 days" />
              <Bar dataKey="90d" fill="hsl(35, 90%, 55%)" name="Last 90 days" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
