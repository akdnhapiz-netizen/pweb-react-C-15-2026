import type { ApplicationStatus, WorkMode } from "../types";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ["APPLIED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  GHOSTED: ["SCREENING"],
  OFFER: [],
  REJECTED: [],
};

export interface TransitionPayload {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  workMode?: WorkMode;
}

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Mengembalikan daftar status tujuan yang valid dari status saat ini.
 */
export function getAvailableTransitions(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
  return STATUS_TRANSITIONS[currentStatus];
}

/**
 * Mengecek apakah perpindahan dari currentStatus ke nextStatus diperbolehkan.
 */
export function canTransition(
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

/**
 * Memvalidasi apakah jalur transisi sah DAN data prasyarat status tujuan sudah lengkap.
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
  payload: TransitionPayload
): TransitionValidationResult {
  if (!canTransition(currentStatus, nextStatus)) {
    return {
      valid: false,
      error: `Status tidak dapat berpindah dari ${STATUS_LABELS[currentStatus]} ke ${STATUS_LABELS[nextStatus]}.`,
    };
  }

  if (nextStatus === "APPLIED") {
    if (!payload.cvVersion || payload.cvVersion.trim() === "") {
      return {
        valid: false,
        error: "Versi CV (cvVersion) wajib diisi saat pindah ke status Applied.",
      };
    }
    if (!payload.appliedDate || payload.appliedDate.trim() === "") {
      return {
        valid: false,
        error: "Tanggal melamar (appliedDate) wajib diisi saat pindah ke status Applied.",
      };
    }
  }

  if (nextStatus === "INTERVIEW") {
    if (!payload.interviewDateTime || payload.interviewDateTime.trim() === "") {
      return {
        valid: false,
        error: "Jadwal interview (interviewDateTime) wajib diisi saat pindah ke status Interview.",
      };
    }
  }

  if (nextStatus === "OFFER") {
    if (typeof payload.salaryOffer !== "number" || payload.salaryOffer <= 0) {
      return {
        valid: false,
        error: "Nominal gaji/uang saku (salaryOffer) harus lebih dari 0 saat pindah ke status Offer.",
      };
    }
    if (!payload.workMode) {
      return {
        valid: false,
        error: "Mode kerja (Remote/Hybrid/Onsite) wajib dipilih saat pindah ke status Offer.",
      };
    }
  }

  return { valid: true };
}