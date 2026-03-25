import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  departments: string[];
  licenses: string[];
  selectedDepartment: string;
  selectedLicense: string;
  onDepartmentChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
}

export function DashboardLayout({
  children,
  departments,
  licenses,
  selectedDepartment,
  selectedLicense,
  onDepartmentChange,
  onLicenseChange,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar
          departments={departments}
          licenses={licenses}
          selectedDepartment={selectedDepartment}
          selectedLicense={selectedLicense}
          onDepartmentChange={onDepartmentChange}
          onLicenseChange={onLicenseChange}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">License Optimization Dashboard</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
