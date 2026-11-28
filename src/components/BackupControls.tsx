import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { Application } from "../types";

interface BackupData {
  version: 1;
  exportedAt: string;
  applications: Application[];
  kaptenSkills: string[];
}

interface BackupControlsProps {
  applications: Application[];
  kaptenSkills: string[];
  onImportApplications: Dispatch<SetStateAction<Application[]>>;
  onImportSkills: Dispatch<SetStateAction<string[]>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Type guard: cek field wajib Application tanpa memakai `any` */
function isApplication(value: unknown): value is Application {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.company === "string" &&
    typeof value.role === "string" &&
    typeof value.status === "string" &&
    typeof value.workMode === "string" &&
    typeof value.lastUpdatedAt === "string" &&
    isStringArray(value.requiredSkills) &&
    Array.isArray(value.checklist) &&
    Array.isArray(value.activityLogs)
  );
}

function isBackupData(value: unknown): value is BackupData {
  return (
    isRecord(value) &&
    Array.isArray(value.applications) &&
    value.applications.every(isApplication) &&
    isStringArray(value.kaptenSkills)
  );
}

export function BackupControls({
  applications,
  kaptenSkills,
  onImportApplications,
  onImportSkills,
}: BackupControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      applications,
      kaptenSkills,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aku-mw-magang-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "ok", text: `Backup ${applications.length} lamaran berhasil diunduh.` });
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupData(parsed)) {
        setMessage({ type: "error", text: "File bukan backup Aku Mw Magang yang valid." });
        return;
      }
      onImportApplications(parsed.applications);
      onImportSkills(parsed.kaptenSkills);
      setMessage({ type: "ok", text: `Berhasil import ${parsed.applications.length} lamaran.` });
    } catch {
      setMessage({ type: "error", text: "Gagal membaca file. Pastikan formatnya JSON." });
    }
  };

  return (
    <div className="backup-controls">
      <button type="button" className="btn btn-secondary" onClick={handleExport}>
        <Download size={16} aria-hidden="true" /> Export JSON
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={16} aria-hidden="true" /> Import JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImport}
      />
      {message && (
        <span className={message.type === "ok" ? "text-success" : "text-danger"}>{message.text}</span>
      )}
    </div>
  );
}
