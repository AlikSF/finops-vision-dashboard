import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, isAfter, parseISO, differenceInDays } from "date-fns";
import type { EnrichedUser } from "@/data/dataModels";

interface Props {
  users: EnrichedUser[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Active: "default",
  "At Risk": "secondary",
  Ghost: "destructive",
  "Never Used": "outline",
};

export function SalesforceInsightsTab({ users }: Props) {
  const now = new Date();

  // Last Login by Month (6 months)
  const loginByMonth = useMemo(() => {
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      const e = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
      months.push({ label: format(s, "MMM yyyy"), start: s, end: e });
    }
    return months.map(m => {
      const count = users.filter(u => {
        if (!u.lastLoginDate) return false;
        const d = parseISO(u.lastLoginDate);
        return isAfter(d, m.start) && !isAfter(d, m.end);
      }).length;
      return { month: m.label, users: count };
    });
  }, [users]);

  // At Risk users
  const atRiskUsers = useMemo(
    () =>
      users
        .filter(u => u.usageStatus === "At Risk")
        .map(u => ({
          ...u,
          daysSince: u.lastLoginDate ? differenceInDays(now, parseISO(u.lastLoginDate)) : null,
        }))
        .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [users],
  );

  // Ghost users
  const ghostUsers = useMemo(
    () =>
      users
        .filter(u => u.usageStatus === "Ghost")
        .map(u => ({
          ...u,
          daysSince: u.lastLoginDate ? differenceInDays(now, parseISO(u.lastLoginDate)) : null,
        }))
        .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [users],
  );

  // Never Used users
  const neverUsedUsers = useMemo(
    () => users.filter(u => u.usageStatus === "Never Used"),
    [users],
  );

  // Admin users
  const adminUsers = useMemo(
    () => users.filter(u => u.derivedCategory === "Internal Admin"),
    [users],
  );

  return (
    <div className="space-y-6">
      {/* Last Login by Month */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Last Login by Month (Past 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={loginByMonth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" fill="hsl(var(--primary))" name="Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Each bar shows how many users' most recent login falls within that month.
          </p>
        </CardContent>
      </Card>

      {/* At Risk Users */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            At Risk Users ({atRiskUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team / Function</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Days Since Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRiskUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs">{u.profileName}</TableCell>
                    <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                    <TableCell className="text-xs">{u.derivedTeamFunction || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {u.lastLoginDate ? format(parseISO(u.lastLoginDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right">{u.daysSince ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {atRiskUsers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4">No at-risk users</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ghost Users */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Ghost Users ({ghostUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team / Function</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Days Since Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ghostUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs">{u.profileName}</TableCell>
                    <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                    <TableCell className="text-xs">{u.derivedTeamFunction || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {u.lastLoginDate ? format(parseISO(u.lastLoginDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right">{u.daysSince ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {ghostUsers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4">No ghost users</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Admin Users ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Logins (30d)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs">{u.profileName}</TableCell>
                    <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={STATUS_VARIANT[u.usageStatus ?? ""] ?? "outline"} className="text-[10px]">
                        {u.usageStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.lastLoginDate ? format(parseISO(u.lastLoginDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right">{u.logins30d ?? 0}</TableCell>
                  </TableRow>
                ))}
                {adminUsers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4">No admin users</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
