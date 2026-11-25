import type { JobListing } from "../types";
import type { SkillMatchResult } from "../utils/skillMatch";
import { getMatchLevel } from "../utils/skillMatch";

interface JobCardProps {
  job: JobListing;
  match: SkillMatchResult;
  alreadyApplied: boolean;
  onSave: (job: JobListing) => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function JobCard({ job, match, alreadyApplied, onSave }: JobCardProps) {
  const level = getMatchLevel(match.percentage);
  const matchedLower = new Set(match.matchedSkills.map((s) => s.toLowerCase()));

  return (
    <article className="job-card">
      <div className="job-card-header">
        <span className="job-avatar">{getInitials(job.company_name)}</span>
        <div className="job-company">
          <strong>{job.company_name}</strong>
          <span className="detail-meta">{job.candidate_required_location || "-"}</span>
        </div>
        <span className={`match-badge match-${level}`}>
          {match.percentage}% Match
        </span>
      </div>

      <h4 className="job-title">{job.title}</h4>
      <span className="detail-meta">{job.category}</span>

      <div className="job-tags">
        {job.tags.length === 0 && <span className="detail-meta">Tidak ada tag skill</span>}
        {job.tags.map((tag) => (
          <span
            key={tag}
            className={`job-tag ${matchedLower.has(tag.toLowerCase()) ? "job-tag-match" : "job-tag-missing"}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="detail-meta">
        Cocok {match.matchedCount}/{match.totalRequired}
        {match.missingSkills.length > 0 && (
          <span className="text-danger"> • Missing: {match.missingSkills.join(", ")}</span>
        )}
      </p>

      <div className="job-card-footer">
        <span className="job-salary">{job.salary || "Gaji tidak dicantumkan"}</span>
        <button
          type="button"
          className={`btn ${alreadyApplied ? "btn-secondary" : "btn-primary"}`}
          disabled={alreadyApplied}
          onClick={() => onSave(job)}
        >
          {alreadyApplied ? "Sudah Dilamar" : "Simpan ke Wishlist"}
        </button>
      </div>
    </article>
  );
}
