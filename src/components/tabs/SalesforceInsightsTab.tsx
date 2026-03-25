import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import type { EnrichedUser } from "@/data/dataModels";

interface Props {
  users: EnrichedUser[];
  allHumanUsers?: EnrichedUser[];
}

const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(142, 71%, 45%)",
  "At Risk": "hsl(45, 93%, 47%)",
  Ghost: "hsl(0, 84%, 60%)",
  "Never Used": "hsl(215, 16%, 47%)",
};

function InsightTable({ title, users: list, showAddOns = false }: { title: string; users: any[]; showAddOns?: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title} ({list.length})</CardTitle>
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
                {showAddOns && <TableHead>Add-on Licenses</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs">{u.profileName}</TableCell>
                  <TableCell className="text-xs">{u.roleName || "—"}</TableCell>
                  <TableCell className="text-xs">{u.derivedTeamFunction || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {u.lastLoginDate ? format(parseISO(u.lastLoginDate), "MMM d, yyyy") : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-right">{u.daysSince ?? "—"}</TableCell>
                  {showAddOns && (
                    <TableCell className="text-xs max-w-[180px] truncate">
                      {(u.addOnLicenses || []).join(", ") || "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showAddOns ? 7 : 6} className="text-center text-xs text-muted-foreground py-4">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesforceInsightsTab({ users, allHumanUsers }: Props) {
  const now = new Date();
  const addDays = (u: EnrichedUser) => ({
    ...u,
    daysSince: u.lastLoginDate ? differenceInDays(now, parseISO(u.lastLoginDate)) : null,
  });

  const atRiskUsers = useMemo(
    () => users.filter(u => u.usageStatus === "At Risk").map(addDays).sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [users],
  );

  const ghostUsers = useMemo(
    () => users.filter(u => u.usageStatus === "Ghost").map(addDays).sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [users],
  );

  const neverUsedUsers = useMemo(
    () => users.filter(u => u.usageStatus === "Never Used").map(addDays),
    [users],
  );

  const becomingGhostUsers = useMemo(
    () => users
      .filter(u => u.daysSinceLogin !== null && u.daysSinceLogin >= 61 && u.daysSinceLogin <= 89)
      .map(addDays)
      .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [users],
  );

  const humanBase = allHumanUsers || users.filter(u => u.derivedCategory !== "Automated/System" && u.derivedCategory !== "Integration/Technical");
  const reassignCandidates = useMemo(
    () => humanBase
      .filter(u => u.usageStatus === "Ghost" || u.usageStatus === "Never Used")
      .map(addDays)
      .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
    [humanBase],
  );

  const adminUsers = useMemo(
    () => users.filter(u => u.derivedCategory === "Internal Admin").map(addDays),
    [users],
  );

  const integrationUsers = useMemo(
    () => users.filter(u => u.derivedCategory === "Integration/Technical" || u.derivedCategory === "Automated/System").map(addDays),
    [users],
  );

  return (
    <div className="space-y-6">
      <InsightTable title="At Risk Users" users={atRiskUsers} showAddOns />
      <InsightTable title="Ghost Users" users={ghostUsers} showAddOns />
      <InsightTable title="Never Used Users" users={neverUsedUsers} showAddOns />
      <InsightTable title="Becoming Ghost Soon (61-89 days)" users={becomingGhostUsers} showAddOns />
      <InsightTable title="Reassignment Candidates" users={reassignCandidates} showAddOns />
      <InsightTable title="Admin Users" users={adminUsers} showAddOns />
      <InsightTable title="Integration / Technical Users" users={integrationUsers} />
    </div>
  );
}
