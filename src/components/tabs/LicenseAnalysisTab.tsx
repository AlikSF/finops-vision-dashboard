import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedUser, UserLicensePool, PSLPool } from "@/data/dataModels";

interface LicenseAnalysisTabProps {
  users: EnrichedUser[];
  licensePool: UserLicensePool[];
  pslPool: PSLPool[];
}

export function LicenseAnalysisTab({ users, licensePool, pslPool }: LicenseAnalysisTabProps) {
  // Primary license utilization
  const primaryData = licensePool
    .filter(l => l.totalLicenses > 0 || l.usedLicenses > 0)
    .map(l => ({
      name: l.name,
      total: l.totalLicenses,
      used: l.usedLicenses,
      available: Math.max(0, l.totalLicenses - l.usedLicenses),
      utilization: l.totalLicenses > 0 ? Math.round((l.usedLicenses / l.totalLicenses) * 100) : 0,
    }))
    .sort((a, b) => b.used - a.used);

  // Waste by license type — only internal human users
  const wasteMap = new Map<string, { ghost: number; neverUsed: number }>();
  users.forEach(u => {
    if (
      u.derivedCategory === "Automated/System" ||
      u.derivedCategory === "Integration/Technical" ||
      u.derivedCategory === "ePortal B2C" ||
      u.derivedCategory === "ePortal B2B" ||
      u.derivedCategory === "External/Community Other"
    ) return;
    if (u.usageStatus !== "Ghost" && u.usageStatus !== "Never Used") return;
    const existing = wasteMap.get(u.licenseName) || { ghost: 0, neverUsed: 0 };
    if (u.usageStatus === "Ghost") existing.ghost++;
    else existing.neverUsed++;
    wasteMap.set(u.licenseName, existing);
  });
  const wasteData = Array.from(wasteMap.entries())
    .map(([name, v]) => ({ name, ...v, total: v.ghost + v.neverUsed }))
    .sort((a, b) => b.total - a.total);

  // Add-on license (PSL) utilization
  const pslData = pslPool
    .filter(p => p.totalLicenses > 0 || p.usedLicenses > 0)
    .map(p => ({
      name: p.masterLabel,
      total: p.totalLicenses,
      used: p.usedLicenses,
      available: Math.max(0, p.totalLicenses - p.usedLicenses),
    }))
    .sort((a, b) => b.used - a.used)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      {primaryData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Primary License Pool Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primaryData.map((l, i) => (
                    <TableRow key={l.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium text-xs">{l.name}</TableCell>
                      <TableCell className="text-right text-xs">{l.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{l.used.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{l.available.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={l.utilization > 80 ? "text-destructive font-semibold" : ""}>{l.utilization}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {wasteData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Estimated Waste by License Type (Internal Users Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, wasteData.length * 35)}>
              <BarChart data={wasteData} layout="vertical" margin={{ left: 160 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="ghost" stackId="a" fill="hsl(0, 84%, 60%)" name="Ghost" />
                <Bar dataKey="neverUsed" stackId="a" fill="hsl(215, 16%, 47%)" name="Never Used" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {pslData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Add-on License (PSL) Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-on License</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pslData.map((p, i) => (
                    <TableRow key={p.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium text-xs">{p.name}</TableCell>
                      <TableCell className="text-right text-xs">{p.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{p.used.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{p.available.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
