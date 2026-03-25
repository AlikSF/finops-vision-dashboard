import { LayoutDashboard, Users, Filter } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CsvUploadZone } from "@/components/CsvUploadZone";

interface AppSidebarProps {
  profiles: string[];
  roles: string[];
  licenses: string[];
  selectedProfile: string;
  selectedRole: string;
  selectedLicense: string;
  onProfileChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  uploadTimestamp: string | null;
  onClearData: () => void;
}

export function AppSidebar({
  profiles, roles, licenses, selectedProfile, selectedRole, selectedLicense,
  onProfileChange, onRoleChange, onLicenseChange, onFileUpload, isProcessing,
  uploadTimestamp, onClearData,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r-0">
      <SidebarContent className="bg-primary text-primary-foreground">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest">
            INSEAD FinOps
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-primary-foreground hover:bg-primary-foreground/10">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-primary-foreground/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest">
            Upload Data
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <CsvUploadZone
              onFileUpload={onFileUpload}
              isProcessing={isProcessing}
              uploadTimestamp={uploadTimestamp}
              onClear={onClearData}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-primary-foreground/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            Filters
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-3">
            <div>
              <label className="text-xs text-primary-foreground/70 mb-1 block">Profile</label>
              <Select value={selectedProfile} onValueChange={onProfileChange}>
                <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs h-8">
                  <SelectValue placeholder="All Profiles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-primary-foreground/70 mb-1 block">Role</label>
              <Select value={selectedRole} onValueChange={onRoleChange}>
                <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs h-8">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-primary-foreground/70 mb-1 block">License Type</label>
              <Select value={selectedLicense} onValueChange={onLicenseChange}>
                <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs h-8">
                  <SelectValue placeholder="All Licenses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Licenses</SelectItem>
                  {licenses.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-primary text-primary-foreground/50 text-xs p-4">
        License Optimization v2.0
      </SidebarFooter>
    </Sidebar>
  );
}
