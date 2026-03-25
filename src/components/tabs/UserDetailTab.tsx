import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { EnrichedUser } from "@/data/dataModels";

interface UserDetailTabProps {
  users: EnrichedUser[];
  hasLoginHistory: boolean;
}

const PAGE_SIZE = 50;

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "At Risk": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Ghost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Never Used": "bg-muted text-muted-foreground",
};

export function UserDetailTab({ users, hasLoginHistory }: UserDetailTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.username.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.profileName.toLowerCase().includes(s) ||
      u.roleName.toLowerCase().includes(s) ||
      u.derivedCategory.toLowerCase().includes(s) ||
      u.derivedTeamFunction.toLowerCase().includes(s)
    );
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">User Details ({filtered.length} users)</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Username</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Profile</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">License</TableHead>
                <TableHead className="text-xs">Add-ons</TableHead>
                <TableHead className="text-xs">Dept</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs">Last Login</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Team</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                {hasLoginHistory && (
                  <>
                    <TableHead className="text-xs text-right">7d</TableHead>
                    <TableHead className="text-xs text-right">30d</TableHead>
                    <TableHead className="text-xs text-right">90d</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((u, i) => (
                <TableRow key={u.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                  <TableCell className="text-xs font-medium max-w-[120px] truncate">{u.name}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{u.username}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{u.email}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{u.profileName}</TableCell>
                  <TableCell className="text-xs max-w-[100px] truncate">{u.roleName || "—"}</TableCell>
                  <TableCell className="text-xs">{u.userType}</TableCell>
                  <TableCell className="text-xs">{u.licenseName}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{u.addOnLicenses.length > 0 ? u.addOnLicenses.join(", ") : "—"}</TableCell>
                  <TableCell className="text-xs">{u.department || "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(u.createdDate)}</TableCell>
                  <TableCell className="text-xs">{formatDate(u.lastLoginDate)}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.derivedCategory}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.derivedTeamFunction}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[u.usageStatus] || ""}`}>{u.usageStatus}</Badge>
                  </TableCell>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
