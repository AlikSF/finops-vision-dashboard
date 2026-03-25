import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
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

export function DashboardLayout({
  children, profiles, roles, licenses, selectedProfile, selectedRole, selectedLicense,
  onProfileChange, onRoleChange, onLicenseChange, onFileUpload, isProcessing,
  uploadTimestamp, onClearData,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar
          profiles={profiles}
          roles={roles}
          licenses={licenses}
          selectedProfile={selectedProfile}
          selectedRole={selectedRole}
          selectedLicense={selectedLicense}
          onProfileChange={onProfileChange}
          onRoleChange={onRoleChange}
          onLicenseChange={onLicenseChange}
          onFileUpload={onFileUpload}
          isProcessing={isProcessing}
          uploadTimestamp={uploadTimestamp}
          onClearData={onClearData}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground flex-1">License Optimization Dashboard</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
