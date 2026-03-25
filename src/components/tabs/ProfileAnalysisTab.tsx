import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedUser } from "@/data/dataModels";

interface ProfileAnalysisTabProps {
  users: EnrichedUser[];
}

export function ProfileAnalysisTab({ users }: ProfileAnalysisTabProps) {
  const profileMap = new Map<string, { total: number; active: number; atRisk: number; ghost: number; neverUsed: number }>();
  users.forEach(u => {
    const p = u.profileName || "Unknown";
    const existing = profileMap.get(p) || { total: 0, active: 0, atRisk: 0, ghost: 0, neverUsed: 0 };
    existing.total++;
    existing[u.usageStatus === "Active" ? "active" : u.usageStatus === "At Risk" ? "atRisk" : u.usageStatus === "Ghost" ? "ghost" : "neverUsed"]++;
    profileMap.set(p, existing);
  });

  const profileData = Array.from(profileMap.entries())
    .map(([name, v]) => ({
      name, ...v,
      activeP: v.total > 0 ? Math.round((v.active / v.total) * 100) : 0,
      ghostP: v.total > 0 ? Math.round((v.ghost / v.total) * 100) : 0,
      neverP: v.total > 0 ? Math.round((v.neverUsed / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const top10 = profileData.slice(0, 10);

  return (
    <div className="space-y-6">
      {top10.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 10 Profiles — Usage Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top10} layout="vertical" margin={{ left: 180 }}>
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
          <CardTitle className="text-sm font-semibold">All Profiles Summary ({profileData.length})</CardTitle>
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
                  <TableHead className="text-right">At Risk</TableHead>
                  <TableHead className="text-right">Ghost</TableHead>
                  <TableHead className="text-right">Ghost %</TableHead>
                  <TableHead className="text-right">Never Used</TableHead>
                  <TableHead className="text-right">Never Used %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profileData.map((p, i) => (
                  <TableRow key={p.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium text-xs max-w-[250px] truncate">{p.name}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{p.total}</TableCell>
                    <TableCell className="text-right text-xs">{p.active}</TableCell>
                    <TableCell className="text-right text-xs text-green-600">{p.activeP}%</TableCell>
                    <TableCell className="text-right text-xs">{p.atRisk}</TableCell>
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
  );
}
