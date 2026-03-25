import { useCallback, useRef, useState } from "react";
import { Upload, FileDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSampleCSV } from "@/data/userData";
import { format } from "date-fns";

interface CsvUploadZoneProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  uploadTimestamp: string | null;
  onClear: () => void;
}

export function CsvUploadZone({ onFileUpload, isProcessing, uploadTimestamp, onClear }: CsvUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const downloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "license-optimizer-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary-foreground bg-primary-foreground/20"
            : "border-primary-foreground/30 hover:border-primary-foreground/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
            <span className="text-xs text-primary-foreground/80">Processing...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1">
            <Upload className="h-4 w-4 text-primary-foreground/60" />
            <span className="text-xs text-primary-foreground/80">
              Drop CSV or click to upload
            </span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
        className="flex items-center gap-1.5 text-xs text-primary-foreground/60 hover:text-primary-foreground/90 transition-colors w-full"
      >
        <FileDown className="h-3 w-3" />
        Download Sample Template
      </button>

      {uploadTimestamp && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-primary-foreground/50 leading-tight">
            Data from: {format(new Date(uploadTimestamp), "MMM d, yyyy h:mm a")}
          </p>
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-primary-foreground/40 hover:text-primary-foreground/70">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
