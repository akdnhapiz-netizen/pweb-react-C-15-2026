export type WorkMode = "Remote" | "Hybrid" | "Onsite";

export type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string; 
  salaryOffer?: number;
  lastUpdatedAt: string; 
  checklist: ChecklistItem[];
  activityLogs: ActivityLog[];
}

/** 1 item lowongan dari Remotive API / magang-fallback.json */
export interface JobListing {
  id: number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}

/** Bentuk response Remotive: { "job-count": n, "jobs": [...] } */
export interface RemotiveResponse {
  "job-count"?: number;
  jobs: JobListing[];
}

export type JobSource = "remote" | "local";

export type JobSortOption = "match-desc" | "match-asc" | "title-asc";
