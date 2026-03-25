import { useState, useEffect, useCallback } from "react";
import { parseCSV, type UserRecord } from "@/data/userData";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "license-optimizer-data";
const TIMESTAMP_KEY = "license-optimizer-timestamp";

interface StoredData {
  users: UserRecord[];
  timestamp: string;
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ts = localStorage.getItem(TIMESTAMP_KEY);
    if (raw && ts) {
      return { users: JSON.parse(raw), timestamp: ts };
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(users: UserRecord[], timestamp: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(TIMESTAMP_KEY, timestamp);
}

export function useUploadedData() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [uploadTimestamp, setUploadTimestamp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setUsers(stored.users);
      setUploadTimestamp(stored.timestamp);
    }
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        const ts = new Date().toISOString();
        setUsers(parsed);
        setUploadTimestamp(ts);
        saveToStorage(parsed, ts);
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

  const clearData = useCallback(() => {
    setUsers([]);
    setUploadTimestamp(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  }, []);

  return { users, uploadTimestamp, isProcessing, handleFileUpload, clearData };
}
