import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryRuleEditor } from "@/components/CategoryRuleEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { SalesforceUsageTab } from "@/components/tabs/SalesforceUsageTab";
import { CommunityUsageTab } from "@/components/tabs/CommunityUsageTab";
import { LicenseUsageTab } from "@/components/tabs/LicenseUsageTab";

const COMMUNITY_LICENSES = ["Customer Community Login", "Customer Community Plus Login"];

const Index = () => {
  const store = useDataStore();
  const {
    enrichedUsers, users, userLicensePool, pslPool, loginHistory,
    categoryRules, updateCategoryRules, uploadFile, clearAllData,
    uploadedFiles, isProcessing, saveSnapshot,
  } = store;

  const [activeTab, setActiveTab] = useState("salesforce");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLicense, setSelectedLicense] = useState("all");
  const [selectedAddOn, setSelectedAddOn] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Pre-filter by tab
  const sfUsers = useMemo(
    () => (enrichedUsers || []).filter(u => u.licenseName === "Salesforce" && !COMMUNITY_LICENSES.includes(u.licenseName)),
    [enrichedUsers]
  );
  const communityUsers = useMemo(
    () => (enrichedUsers || []).filter(u => COMMUNITY_LICENSES.includes(u.licenseName)),
    [enrichedUsers]
  );

  // Current tab's base users
  const tabBaseUsers = activeTab === "salesforce" ? sfUsers : activeTab === "community" ? communityUsers : enrichedUsers || [];

  // Derive filter options from tab-scoped users
  const categories = useMemo(() => Array.from(new Set(tabBaseUsers.map(u => u.derivedCategory))).sort(), [tabBaseUsers]);
  const profiles = useMemo(() => Array.from(new Set(tabBaseUsers.map(u => u.profileName).filter(Boolean))).sort(), [tabBaseUsers]);
  const roles = useMemo(() => Array.from(new Set(tabBaseUsers.map(u => u.roleName).filter(Boolean))).sort(), [tabBaseUsers]);
  const licenses = useMemo(() => Array.from(new Set(tabBaseUsers.map(u => u.licenseName).filter(Boolean))).sort(), [tabBaseUsers]);
  const addOnLicenses = useMemo(() => Array.from(new Set(tabBaseUsers.flatMap(u => u.addOnLicenses || []))).sort(), [tabBaseUsers]);
  const departments = useMemo(() => Array.from(new Set(tabBaseUsers.map(u => u.department).filter(Boolean))).sort(), [tabBaseUsers]);

  // Apply sidebar filters
  const filteredUsers = useMemo(() => {
    return tabBaseUsers.filter(u => {
      if (selectedCategory !== "all" && u.derivedCategory !== selectedCategory) return false;
      if (selectedProfile !== "all" && u.profileName !== selectedProfile) return false;
      if (selectedRole !== "all" && u.roleName !== selectedRole) return false;
      if (selectedLicense !== "all" && u.licenseName !== selectedLicense) return false;
      if (selectedAddOn !== "all" && !(u.addOnLicenses || []).includes(selectedAddOn)) return false;
      if (selectedStatus !== "all" && u.usageStatus !== selectedStatus) return false;
      if (selectedDepartment !== "all" && u.department !== selectedDepartment) return false;
      return true;
    });
  }, [tabBaseUsers, selectedCategory, selectedProfile, selectedRole, selectedLicense, selectedAddOn, selectedStatus, selectedDepartment]);

  const hasLoginHistory = !!uploadedFiles.login_history;
  const hasData = (enrichedUsers || []).length > 0;

  // Reset filters when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCategory("all");
    setSelectedProfile("all");
    setSelectedRole("all");
    setSelectedLicense("all");
    setSelectedAddOn("all");
    setSelectedStatus("all");
    setSelectedDepartment("all");
  };

  return (
    <DashboardLayout
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
              Showing <strong>{filteredUsers.length}</strong> of {tabBaseUsers.length} users
              {activeTab === "license" && ` (${(enrichedUsers || []).length} total)`}
            </p>
            <div className="flex gap-2">
              <CategoryRuleEditor rules={categoryRules} onSave={updateCategoryRules} rawUsers={users} />
              <Button variant="outline" size="sm" onClick={saveSnapshot} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save Snapshot
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="salesforce">Salesforce Usage</TabsTrigger>
              <TabsTrigger value="community">Community / ePortal</TabsTrigger>
              <TabsTrigger value="license">License Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="salesforce">
              <SalesforceUsageTab
                users={filteredUsers}
                allSfUsers={sfUsers}
                licensePool={userLicensePool || []}
                pslPool={pslPool || []}
                loginHistory={loginHistory || []}
                hasLoginHistory={hasLoginHistory}
              />
            </TabsContent>

            <TabsContent value="community">
              <CommunityUsageTab
                users={filteredUsers}
                loginHistory={loginHistory || []}
                hasLoginHistory={hasLoginHistory}
              />
            </TabsContent>

            <TabsContent value="license">
              <LicenseUsageTab
                users={enrichedUsers || []}
                licensePool={userLicensePool || []}
                pslPool={pslPool || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
