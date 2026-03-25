import { LayoutDashboard, Users, Filter } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  departments: string[];
  licenses: string[];
  selectedDepartment: string;
  selectedLicense: string;
  onDepartmentChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
}

export function AppSidebar({
  departments,
  licenses,
  selectedDepartment,
  selectedLicense,
  onDepartmentChange,
  onLicenseChange,
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
          <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            Filters
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-3">
            <div>
              <label className="text-xs text-primary-foreground/70 mb-1 block">Department</label>
              <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs h-8">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
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
        License Optimization v1.0
      </SidebarFooter>
    </Sidebar>
  );
}
