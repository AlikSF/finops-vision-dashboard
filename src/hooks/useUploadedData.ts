import { useState, useEffect, useCallback } from "react";
import { get, set, del } from "idb-keyval";
import { parseCSV, type UserRecord } from "@/data/userData";
import { toast } from "@/hooks/use-toast";

const DB_KEY = "license-optimizer-data";
const TS_KEY = "license-optimizer-timestamp";

export function useUploadedData() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [uploadTimestamp, setUploadTimestamp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [stored, ts] = await Promise.all([get<UserRecord[]>(DB_KEY), get<string>(TS_KEY)]);
        if (stored && ts) {
          setUsers(stored);
          setUploadTimestamp(ts);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        const ts = new Date().toISOString();
        setUsers(parsed);
        setUploadTimestamp(ts);
        await Promise.all([set(DB_KEY, parsed), set(TS_KEY, ts)]);
        toast({
          title: "Data uploaded successfully",
          description: `${parsed.length} user records loaded.`,
        });
      } catch {
        toast({
          title: "Error parsing CSV",
          description: "Please check the file format and try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      toast({
        title: "File read error",
        description: "Could not read the file.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  }, []);

  const clearData = useCallback(async () => {
    setUsers([]);
    setUploadTimestamp(null);
    await Promise.all([del(DB_KEY), del(TS_KEY)]);
  }, []);

  return { users, uploadTimestamp, isProcessing, handleFileUpload, clearData };
}
