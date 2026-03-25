import { useState, useEffect, useCallback, useMemo } from "react";
import { get, set, del } from "idb-keyval";
import { toast } from "@/hooks/use-toast";
import type {
  RawUser, LoginRecord, UserLicensePool, PSLPool, PSLAssignment,
  EnrichedUser, CategoryRule, DataSnapshot, FileType,
} from "@/data/dataModels";
import { DEFAULT_RULES } from "@/data/categoryRules";
import { joinData } from "@/data/dataJoiner";
import {
  parseUsersMaster, parseLoginHistory, parseUserLicensePool,
  parsePSLPool, parsePSLAssignments, detectFileType,
} from "@/data/csvParsers";

const IDB_PREFIX = "sflo-";
const key = (k: string) => `${IDB_PREFIX}${k}`;

export function useDataStore() {
  const [users, setUsers] = useState<RawUser[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [userLicensePool, setUserLicensePool] = useState<UserLicensePool[]>([]);
  const [pslPool, setPslPool] = useState<PSLPool[]>([]);
  const [pslAssignments, setPslAssignments] = useState<PSLAssignment[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(DEFAULT_RULES);
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<FileType, { name: string; count: number; timestamp: string } | null>>({
    users_master: null,
    login_history: null,
    user_license_pool: null,
    psl_pool: null,
    psl_assignments: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load from IDB on mount
  useEffect(() => {
    (async () => {
      try {
        const [u, lh, ulp, pp, pa, rules, snaps, files] = await Promise.all([
          get<RawUser[]>(key("users")),
          get<LoginRecord[]>(key("login_history")),
          get<UserLicensePool[]>(key("user_license_pool")),
          get<PSLPool[]>(key("psl_pool")),
          get<PSLAssignment[]>(key("psl_assignments")),
          get<CategoryRule[]>(key("category_rules")),
          get<DataSnapshot[]>(key("snapshots")),
          get<typeof uploadedFiles>(key("uploaded_files")),
        ]);
        if (u) setUsers(u);
        if (lh) setLoginHistory(lh);
        if (ulp) setUserLicensePool(ulp);
        if (pp) setPslPool(pp);
        if (pa) setPslAssignments(pa);
        if (rules) setCategoryRules(rules);
        if (snaps) setSnapshots(snaps);
        if (files) setUploadedFiles(files);
      } catch {
        // ignore IDB errors
      }
    })();
  }, []);

  // Enriched users - recomputed whenever source data or rules change
  const enrichedUsers = useMemo(() => {
    if (users.length === 0) return [];
    return joinData(users, loginHistory, pslAssignments, pslPool, categoryRules);
  }, [users, loginHistory, pslAssignments, pslPool, categoryRules]);

  const uploadFile = useCallback(async (file: File, forcedType?: FileType) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const fileType = forcedType || detectFileType(text);
      if (!fileType) {
        toast({ title: "Unknown file type", description: "Could not detect CSV type from headers.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const ts = new Date().toISOString();
      let count = 0;

      switch (fileType) {
        case "users_master": {
          const parsed = parseUsersMaster(text);
          count = parsed.length;
          setUsers(parsed);
          await set(key("users"), parsed);
          break;
        }
        case "login_history": {
          const parsed = parseLoginHistory(text);
          count = parsed.length;
          setLoginHistory(parsed);
          await set(key("login_history"), parsed);
          break;
        }
        case "user_license_pool": {
          const parsed = parseUserLicensePool(text);
          count = parsed.length;
          setUserLicensePool(parsed);
          await set(key("user_license_pool"), parsed);
          break;
        }
        case "psl_pool": {
          const parsed = parsePSLPool(text);
          count = parsed.length;
          setPslPool(parsed);
          await set(key("psl_pool"), parsed);
          break;
        }
        case "psl_assignments": {
          const parsed = parsePSLAssignments(text);
          count = parsed.length;
          setPslAssignments(parsed);
          await set(key("psl_assignments"), parsed);
          break;
        }
      }

      const newFiles = {
        ...uploadedFiles,
        [fileType]: { name: file.name, count, timestamp: ts },
      };
      setUploadedFiles(newFiles);
      await set(key("uploaded_files"), newFiles);

      toast({ title: "File uploaded", description: `${file.name}: ${count} records loaded.` });
    } catch (err) {
      toast({ title: "Error parsing CSV", description: String(err), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFiles]);

  const updateCategoryRules = useCallback(async (rules: CategoryRule[]) => {
    setCategoryRules(rules);
    await set(key("category_rules"), rules);
  }, []);

  const saveSnapshot = useCallback(async () => {
    const snap: DataSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      fileTypes: Object.entries(uploadedFiles).filter(([, v]) => v).map(([k]) => k),
      userCount: enrichedUsers.length,
    };
    // Save enriched users under snapshot ID
    await set(key(`snap-${snap.id}`), enrichedUsers);
    const newSnaps = [...snapshots, snap];
    setSnapshots(newSnaps);
    await set(key("snapshots"), newSnaps);
    toast({ title: "Snapshot saved", description: `${enrichedUsers.length} users at ${new Date().toLocaleString()}` });
  }, [enrichedUsers, snapshots, uploadedFiles]);

  const loadSnapshotUsers = useCallback(async (snapId: string): Promise<EnrichedUser[]> => {
    return (await get<EnrichedUser[]>(key(`snap-${snapId}`))) || [];
  }, []);

  const clearAllData = useCallback(async () => {
    setUsers([]);
    setLoginHistory([]);
    setUserLicensePool([]);
    setPslPool([]);
    setPslAssignments([]);
    setCategoryRules(DEFAULT_RULES);
    setUploadedFiles({
      users_master: null, login_history: null,
      user_license_pool: null, psl_pool: null, psl_assignments: null,
    });
    await Promise.all([
      del(key("users")), del(key("login_history")),
      del(key("user_license_pool")), del(key("psl_pool")),
      del(key("psl_assignments")), del(key("category_rules")),
      del(key("uploaded_files")),
    ]);
  }, []);

  return {
    users, loginHistory, userLicensePool, pslPool, pslAssignments,
    enrichedUsers, categoryRules, snapshots, uploadedFiles, isProcessing,
    uploadFile, updateCategoryRules, saveSnapshot, loadSnapshotUsers,
    clearAllData,
  };
}
