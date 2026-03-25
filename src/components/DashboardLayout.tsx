import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { FileType } from "@/data/dataModels";

interface DashboardLayoutProps {
  children: ReactNode;
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

export function DashboardLayout({
  children, activeTab, categories, profiles, roles, licenses, addOnLicenses, departments,
  selectedCategory, selectedProfile, selectedRole, selectedLicense,
  selectedAddOn, selectedStatus, selectedDepartment,
  onCategoryChange, onProfileChange, onRoleChange, onLicenseChange,
  onAddOnChange, onStatusChange, onDepartmentChange,
  onFileUpload, isProcessing, uploadedFiles, onClearData,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar
          activeTab={activeTab}
          categories={categories}
          profiles={profiles}
          roles={roles}
          licenses={licenses}
          addOnLicenses={addOnLicenses}
          departments={departments}
          selectedCategory={selectedCategory}
          selectedProfile={selectedProfile}
          selectedRole={selectedRole}
          selectedLicense={selectedLicense}
          selectedAddOn={selectedAddOn}
          selectedStatus={selectedStatus}
          selectedDepartment={selectedDepartment}
          onCategoryChange={onCategoryChange}
          onProfileChange={onProfileChange}
          onRoleChange={onRoleChange}
          onLicenseChange={onLicenseChange}
          onAddOnChange={onAddOnChange}
          onStatusChange={onStatusChange}
          onDepartmentChange={onDepartmentChange}
          onFileUpload={onFileUpload}
          isProcessing={isProcessing}
          uploadedFiles={uploadedFiles}
          onClearData={onClearData}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground flex-1">Salesforce License Optimization Dashboard</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
