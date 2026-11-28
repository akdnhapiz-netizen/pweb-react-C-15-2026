import type { Application } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const GHOSTING_THRESHOLD_MS = 14 * DAY_MS;
const CONFLICT_THRESHOLD_MS = 60 * 60 * 1000; // 60 menit

/* ------------------------------------------------------------------ */
/* 1. Anti-duplikat (company + role, huruf besar/kecil tidak berpengaruh) */
/* ------------------------------------------------------------------ */

export function makeApplicationKey(company: string, role: string): string {
  return `${company.trim().toLowerCase()}|${role.trim().toLowerCase()}`;
}

export function isDuplicateApplication(
  applications: Application[],
  company: string,
  role: string
): boolean {
  const key = makeApplicationKey(company, role);
  return applications.some((app) => makeApplicationKey(app.company, app.role) === key);
}

/* ------------------------------------------------------------------ */
/* 2. Rawan Ghosting: APPLIED/SCREENING tidak berubah > 14 hari         */
/* ------------------------------------------------------------------ */

export function isRawanGhosting(app: Application, now: number = Date.now()): boolean {
  if (app.status !== "APPLIED" && app.status !== "SCREENING") return false;
  const updated = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(updated)) return false;
  return now - updated > GHOSTING_THRESHOLD_MS;
}

/** Mundurkan lastUpdatedAt sebanyak `days` hari (untuk tombol "Simulasi +15 Hari"). */
export function shiftLastUpdated(app: Application, days: number): Application {
  const current = new Date(app.lastUpdatedAt).getTime();
  const base = Number.isNaN(current) ? Date.now() : current;
  return {
    ...app,
    lastUpdatedAt: new Date(base - days * DAY_MS).toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* 3. Bentrok jadwal: >= 2 lamaran INTERVIEW berselisih < 60 menit      */
/* ------------------------------------------------------------------ */

export interface InterviewConflict {
  first: Application;
  second: Application;
  diffMinutes: number;
}

export function findInterviewConflicts(applications: Application[]): InterviewConflict[] {
  // ambil hanya INTERVIEW yang jadwalnya valid, lalu urutkan berdasarkan waktu
  const interviews = applications
    .filter((app) => app.status === "INTERVIEW" && app.interviewDateTime)
    .map((app) => ({ app, time: new Date(app.interviewDateTime ?? "").getTime() }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((a, b) => a.time - b.time);

  const conflicts: InterviewConflict[] = [];
  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const diff = interviews[j].time - interviews[i].time;
      // sudah terurut, jadi kalau selisih >= 60 menit, sisanya pasti lebih jauh
      if (diff >= CONFLICT_THRESHOLD_MS) break;
      conflicts.push({
        first: interviews[i].app,
        second: interviews[j].app,
        diffMinutes: Math.round(diff / 60000),
      });
    }
  }
  return conflicts;
}

/* ------------------------------------------------------------------ */
/* 4. Helper format                                                     */
/* ------------------------------------------------------------------ */

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
