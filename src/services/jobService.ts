import type { JobListing, JobSource, RemotiveResponse, WorkMode } from "../types";

export const REMOTIVE_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
export const FALLBACK_URL = "/magang-fallback.json";

function isRemotiveResponse(data: unknown): data is RemotiveResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "jobs" in data &&
    Array.isArray((data as { jobs: unknown }).jobs)
  );
}

/** Ambil hanya field yang kita pakai, dan pastikan tipenya aman. */
function normalizeJob(raw: JobListing): JobListing {
  return {
    id: raw.id,
    title: raw.title ?? "",
    company_name: raw.company_name ?? "",
    category: raw.category ?? "Lainnya",
    candidate_required_location: raw.candidate_required_location ?? "",
    salary: raw.salary ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<JobListing[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Gagal memuat data (HTTP ${res.status})`);
  }
  const data: unknown = await res.json();
  // Fallback lokal boleh berupa { jobs: [...] } (format Remotive) atau array langsung
  const jobs: JobListing[] = isRemotiveResponse(data)
    ? data.jobs
    : Array.isArray(data)
      ? (data as JobListing[])
      : [];
  return jobs.map(normalizeJob);
}

export function fetchRemotiveJobs(signal?: AbortSignal): Promise<JobListing[]> {
  return fetchJson(REMOTIVE_URL, signal);
}

export function fetchFallbackJobs(signal?: AbortSignal): Promise<JobListing[]> {
  return fetchJson(FALLBACK_URL, signal);
}

export function fetchJobs(source: JobSource, signal?: AbortSignal): Promise<JobListing[]> {
  return source === "remote" ? fetchRemotiveJobs(signal) : fetchFallbackJobs(signal);
}

/** Tebak mode kerja dari teks lokasi, contoh "Surabaya (Hybrid)". Remotive = Remote. */
export function inferWorkMode(job: JobListing): WorkMode {
  const loc = job.candidate_required_location.toLowerCase();
  if (loc.includes("hybrid")) return "Hybrid";
  if (loc.includes("onsite") || loc.includes("on-site")) return "Onsite";
  return "Remote";
}
