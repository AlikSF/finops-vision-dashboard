import { LayoutDashboard, Filter } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MultiFileUpload } from "@/components/MultiFileUpload";
import type { FileType } from "@/data/dataModels";

interface AppSidebarProps {
  activeTab: string;
  categories: string[];
  profiles: string[];
  roles: string[];
  licenses: string[];
  addOnLicenses: string[];
  departments: string[];
  selectedCategory: string;
  selectedProfile: string;
  selectedRole: string;
  selectedLicense: string;
  selectedAddOn: string;
  selectedStatus: string;
  selectedDepartment: string;
  onCategoryChange: (v: string) => void;
  onProfileChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onLicenseChange: (v: string) => void;
  onAddOnChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onDepartmentChange: (v: string) => void;
  onFileUpload: (file: File, fileType?: FileType) => void;
  isProcessing: boolean;
  uploadedFiles: Record<FileType, { name: string; count: number; timestamp: string } | null>;
  onClearData: () => void;
}

const USAGE_STATUSES = ["Active", "At Risk", "Ghost", "Never Used"];

function FilterSelect({ label, value, onChange, options, allLabel }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; allLabel: string;
}) {
  return (
    <div>
      <label className="text-xs text-primary-foreground/70 mb-1 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs h-8">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AppSidebar({
  activeTab, categories, profiles, roles, licenses, addOnLicenses, departments,
  selectedCategory, selectedProfile, selectedRole, selectedLicense,
  selectedAddOn, selectedStatus, selectedDepartment,
  onCategoryChange, onProfileChange, onRoleChange, onLicenseChange,
  onAddOnChange, onStatusChange, onDepartmentChange,
  onFileUpload, isProcessing, uploadedFiles, onClearData,
}: AppSidebarProps) {
  const showFilters = activeTab !== "license";

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-primary-foreground/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest">
            Upload Data
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <MultiFileUpload
              uploadedFiles={uploadedFiles}
              onUpload={onFileUpload}
              onClearAll={onClearData}
              isProcessing={isProcessing}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {showFilters && (
          <>
            <Separator className="bg-primary-foreground/20" />

            <SidebarGroup>
              <SidebarGroupLabel className="text-primary-foreground/60 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="h-3 w-3" />
                Filters
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2 space-y-3 pb-4">
                <FilterSelect label="User Category" value={selectedCategory} onChange={onCategoryChange} options={categories} allLabel="All Categories" />
                <FilterSelect label="Usage Status" value={selectedStatus} onChange={onStatusChange} options={USAGE_STATUSES} allLabel="All Statuses" />
                <FilterSelect label="Profile" value={selectedProfile} onChange={onProfileChange} options={profiles} allLabel="All Profiles" />
                <FilterSelect label="Role" value={selectedRole} onChange={onRoleChange} options={roles} allLabel="All Roles" />
                {activeTab === "salesforce" && (
                  <>
                    {addOnLicenses.length > 0 && (
                      <FilterSelect label="Add-on License" value={selectedAddOn} onChange={onAddOnChange} options={addOnLicenses} allLabel="All Add-ons" />
                    )}
                    {departments.length > 0 && (
                      <FilterSelect label="Department" value={selectedDepartment} onChange={onDepartmentChange} options={departments} allLabel="All Departments" />
                    )}
                  </>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-primary text-primary-foreground/50 text-xs p-4">
        License Optimization v3.0
      </SidebarFooter>
    </Sidebar>
  );
}
