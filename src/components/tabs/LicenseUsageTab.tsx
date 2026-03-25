import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { EnrichedUser, UserLicensePool, PSLPool } from "@/data/dataModels";

interface Props {
  users: EnrichedUser[];
  licensePool: UserLicensePool[];
  pslPool: PSLPool[];
}

export function LicenseUsageTab({ users, licensePool, pslPool }: Props) {
  const safeUsers = users || [];
  const safePool = licensePool || [];
  const safePsl = pslPool || [];

  // Primary license table
  const primaryData = safePool
    .filter(l => l.totalLicenses > 0 || l.usedLicenses > 0)
    .map(l => ({
      name: l.name,
      total: l.totalLicenses,
      used: l.usedLicenses,
      available: Math.max(0, l.totalLicenses - l.usedLicenses),
      utilization: l.totalLicenses > 0 ? Math.round((l.usedLicenses / l.totalLicenses) * 100) : 0,
    }))
    .sort((a, b) => b.used - a.used);

  // PSL table
  const pslData = safePsl
    .filter(p => p.totalLicenses > 0 || p.usedLicenses > 0)
    .map(p => ({
      name: p.masterLabel,
      devName: p.developerName,
      total: p.totalLicenses,
      used: p.usedLicenses,
      available: Math.max(0, p.totalLicenses - p.usedLicenses),
      utilization: p.totalLicenses > 0 ? Math.round((p.usedLicenses / p.totalLicenses) * 100) : 0,
    }))
    .sort((a, b) => b.used - a.used);

  // Add-on adoption detail
  const allAddOns = useMemo(() => {
    const set = new Set(safeUsers.flatMap(u => u.addOnLicenses || []));
    return Array.from(set).sort();
  }, [safeUsers]);

  const defaultAddOn = allAddOns.find(a => a.toLowerCase().includes("crm analytics")) || allAddOns[0] || "";
  const [selectedAddOn, setSelectedAddOn] = useState(defaultAddOn);

  const addOnUsers = useMemo(() => {
    if (!selectedAddOn) return [];
    return safeUsers.filter(u => (u.addOnLicenses || []).includes(selectedAddOn));
  }, [safeUsers, selectedAddOn]);

  const addOnPool = safePsl.find(
    p => p.masterLabel === selectedAddOn || p.developerName === selectedAddOn
  );

  const addOnActive = addOnUsers.filter(u => u.usageStatus === "Active").length;
  const addOnAtRisk = addOnUsers.filter(u => u.usageStatus === "At Risk").length;
  const addOnGhost = addOnUsers.filter(u => u.usageStatus === "Ghost").length;
  const addOnNever = addOnUsers.filter(u => u.usageStatus === "Never Used").length;
  const addOnReassign = addOnGhost + addOnNever;

  // Breakdowns
  const breakdown = (key: "profileName" | "roleName" | "derivedTeamFunction") => {
    const map = new Map<string, { total: number; active: number; inactive: number }>();
    addOnUsers.forEach(u => {
      const k = u[key] || "Unknown";
      const existing = map.get(k) || { total: 0, active: 0, inactive: 0 };
      existing.total++;
      if (u.usageStatus === "Active") existing.active++;
      else existing.inactive++;
      map.set(k, existing);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total);
  };

  const byProfile = useMemo(() => breakdown("profileName"), [addOnUsers]);
  const byRole = useMemo(() => breakdown("roleName"), [addOnUsers]);
  const byTeam = useMemo(() => breakdown("derivedTeamFunction"), [addOnUsers]);

  return (
    <div className="space-y-6">
      {/* Section A: Primary License Pool */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Primary License Pool</CardTitle>
        </CardHeader>
        <CardContent>
          {primaryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Upload User License Pool CSV to see data.</p>
          ) : (
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right w-[120px]">Utilization</TableHead>
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
                        <div className="flex items-center gap-2 justify-end">
                          <Progress value={l.utilization} className="w-16 h-2" />
                          <span className={l.utilization > 80 ? "text-destructive font-semibold" : ""}>{l.utilization}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: PSL Pool */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Add-on / Permission Set License Pool</CardTitle>
        </CardHeader>
        <CardContent>
          {pslData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Upload PSL Pool CSV to see data.</p>
          ) : (
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-on License</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used / Assigned</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right w-[120px]">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pslData.map((p, i) => (
                    <TableRow key={p.name + i} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium text-xs">{p.name}</TableCell>
                      <TableCell className="text-right text-xs">{p.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{p.used.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{p.available.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">
                        <div className="flex items-center gap-2 justify-end">
                          <Progress value={p.utilization} className="w-16 h-2" />
                          <span className={p.utilization > 80 ? "text-destructive font-semibold" : ""}>{p.utilization}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Add-on Adoption Detail */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Add-on Adoption Detail</CardTitle>
            {allAddOns.length > 0 && (
              <Select value={selectedAddOn} onValueChange={setSelectedAddOn}>
                <SelectTrigger className="w-[280px] text-xs h-8">
                  <SelectValue placeholder="Select add-on license" />
                </SelectTrigger>
                <SelectContent>
                  {allAddOns.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAddOn || allAddOns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-on license data available. Upload PSL Assignments CSV.</p>
          ) : (
            <div className="space-y-4">
              {/* Add-on KPIs */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Total Licenses", value: addOnPool?.totalLicenses ?? "–" },
                  { label: "Assigned", value: addOnUsers.length },
                  { label: "Active Assigned", value: addOnActive, color: "text-green-600" },
                  { label: "At Risk Assigned", value: addOnAtRisk, color: "text-yellow-600" },
                  { label: "Ghost Assigned", value: addOnGhost, color: "text-destructive" },
                  { label: "Never Used", value: addOnNever, color: "text-muted-foreground" },
                  { label: "Reassignment Candidates", value: addOnReassign, color: "text-destructive" },
                ].map(k => (
                  <Card key={k.label} className="shadow-sm">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className={`text-lg font-bold ${k.color || "text-foreground"}`}>
                        {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Breakdown tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {([
                  { title: "By Profile", data: byProfile },
                  { title: "By Role", data: byRole },
                  { title: "By Team/Function", data: byTeam },
                ] as const).map(section => (
                  <Card key={section.title} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-auto max-h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-right text-xs">Total</TableHead>
                              <TableHead className="text-right text-xs">Active</TableHead>
                              <TableHead className="text-right text-xs">Inactive</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.data.map(r => (
                              <TableRow key={r.name}>
                                <TableCell className="text-xs">{r.name}</TableCell>
                                <TableCell className="text-xs text-right">{r.total}</TableCell>
                                <TableCell className="text-xs text-right">{r.active}</TableCell>
                                <TableCell className="text-xs text-right">{r.inactive}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
