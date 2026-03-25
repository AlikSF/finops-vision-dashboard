import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryRuleEditor } from "@/components/CategoryRuleEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { LicenseAnalysisTab } from "@/components/tabs/LicenseAnalysisTab";
import { ProfileAnalysisTab } from "@/components/tabs/ProfileAnalysisTab";
import { RoleAnalysisTab } from "@/components/tabs/RoleAnalysisTab";
import { ActivityAnalysisTab } from "@/components/tabs/ActivityAnalysisTab";
import { UserDetailTab } from "@/components/tabs/UserDetailTab";

const Index = () => {
  const store = useDataStore();
  const {
    enrichedUsers, userLicensePool, pslPool, loginHistory,
    categoryRules, updateCategoryRules, uploadFile, clearAllData,
    uploadedFiles, isProcessing, saveSnapshot,
  } = store;

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("Internal Business User");
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLicense, setSelectedLicense] = useState("all");
  const [selectedAddOn, setSelectedAddOn] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Derive filter options from data
  const categories = useMemo(() => {
    const set = new Set(enrichedUsers.map(u => u.derivedCategory));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  const profiles = useMemo(() => {
    const set = new Set(enrichedUsers.map(u => u.profileName).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  const roles = useMemo(() => {
    const set = new Set(enrichedUsers.map(u => u.roleName).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  const licenses = useMemo(() => {
    const set = new Set(enrichedUsers.map(u => u.licenseName).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  const addOnLicenses = useMemo(() => {
    const set = new Set(enrichedUsers.flatMap(u => u.addOnLicenses));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  const departments = useMemo(() => {
    const set = new Set(enrichedUsers.map(u => u.department).filter(Boolean));
    return Array.from(set).sort();
  }, [enrichedUsers]);

  // Apply filters
  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter(u => {
      if (selectedCategory !== "all" && u.derivedCategory !== selectedCategory) return false;
      if (selectedProfile !== "all" && u.profileName !== selectedProfile) return false;
      if (selectedRole !== "all" && u.roleName !== selectedRole) return false;
      if (selectedLicense !== "all" && u.licenseName !== selectedLicense) return false;
      if (selectedAddOn !== "all" && !u.addOnLicenses.includes(selectedAddOn)) return false;
      if (selectedStatus !== "all" && u.usageStatus !== selectedStatus) return false;
      if (selectedDepartment !== "all" && u.department !== selectedDepartment) return false;
      return true;
    });
  }, [enrichedUsers, selectedCategory, selectedProfile, selectedRole, selectedLicense, selectedAddOn, selectedStatus, selectedDepartment]);

  const hasLoginHistory = !!uploadedFiles.login_history;
  const hasData = enrichedUsers.length > 0;

  return (
    <DashboardLayout
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
      onCategoryChange={setSelectedCategory}
      onProfileChange={setSelectedProfile}
      onRoleChange={setSelectedRole}
      onLicenseChange={setSelectedLicense}
      onAddOnChange={setSelectedAddOn}
      onStatusChange={setSelectedStatus}
      onDepartmentChange={setSelectedDepartment}
      onFileUpload={uploadFile}
      isProcessing={isProcessing}
      uploadedFiles={uploadedFiles}
      onClearData={clearAllData}
    >
      {!hasData ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold text-foreground">No Data Loaded</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Upload your Salesforce CSV files using the sidebar. Start with <strong>Users Master</strong> (required),
              then optionally add Login History, License Pools, and Permission Set data.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{filteredUsers.length}</strong> of {enrichedUsers.length} users
            </p>
            <div className="flex gap-2">
              <CategoryRuleEditor rules={categoryRules} onSave={updateCategoryRules} />
              <Button variant="outline" size="sm" onClick={saveSnapshot} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save Snapshot
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="license">License Analysis</TabsTrigger>
              <TabsTrigger value="profile">Profile Analysis</TabsTrigger>
              <TabsTrigger value="role">Role Analysis</TabsTrigger>
              <TabsTrigger value="activity">Activity Analysis</TabsTrigger>
              <TabsTrigger value="detail">User Detail</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab users={filteredUsers} licensePool={userLicensePool} />
            </TabsContent>
            <TabsContent value="license">
              <LicenseAnalysisTab users={filteredUsers} licensePool={userLicensePool} pslPool={pslPool} />
            </TabsContent>
            <TabsContent value="profile">
              <ProfileAnalysisTab users={filteredUsers} />
            </TabsContent>
            <TabsContent value="role">
              <RoleAnalysisTab users={filteredUsers} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityAnalysisTab users={filteredUsers} loginHistory={loginHistory} hasLoginHistory={hasLoginHistory} />
            </TabsContent>
            <TabsContent value="detail">
              <UserDetailTab users={filteredUsers} hasLoginHistory={hasLoginHistory} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
