import { useState } from "react";
import { MapPin, Heart, Check, Wallet } from "lucide-react";
import type { JobListing } from "../types";
import type { SkillMatchResult } from "../utils/skillMatch";
import { getMatchLevel } from "../utils/skillMatch";

interface JobCardProps {
  job: JobListing;
  match: SkillMatchResult;
  alreadyApplied: boolean;
  onSave: (job: JobListing) => void;
}

const MAX_VISIBLE_TAGS = 6;
const MAX_VISIBLE_MISSING = 3;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function JobCard({ job, match, alreadyApplied, onSave }: JobCardProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const level = getMatchLevel(match.percentage);
  const matchedLower = new Set(match.matchedSkills.map((s) => s.toLowerCase()));

  // skill yang cocok ditampilkan lebih dulu (array baru, tidak memutasi job.tags)
  const sortedTags = [...job.tags].sort(
    (a, b) =>
      Number(matchedLower.has(b.toLowerCase())) - Number(matchedLower.has(a.toLowerCase()))
  );
  const visibleTags = showAllTags ? sortedTags : sortedTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = sortedTags.length - visibleTags.length;

  const shownMissing = match.missingSkills.slice(0, MAX_VISIBLE_MISSING);
  const extraMissing = match.missingSkills.length - shownMissing.length;

  return (
    <article className={`job-card job-card-${level}`}>
      <div className="job-card-header">
        <span className="job-avatar" aria-hidden="true">
          {getInitials(job.company_name)}
        </span>
        <div className="job-company">
          <strong title={job.company_name}>{job.company_name}</strong>
          <span className="detail-meta" title={job.candidate_required_location}>
            <MapPin size={12} aria-hidden="true" /> {job.candidate_required_location || "-"}
          </span>
        </div>
        <span
          className={`match-ring match-${level}`}
          style={{ "--pct": match.percentage } as React.CSSProperties}
          aria-label={`Kecocokan skill ${match.percentage} persen`}
        >
          <span>{match.percentage}%</span>
        </span>
      </div>

      <div>
        <h4 className="job-title">{job.title}</h4>
        <span className="job-category">{job.category}</span>
      </div>

      <div className="job-tags">
        {job.tags.length === 0 && <span className="detail-meta">Tidak ada tag skill</span>}
        {visibleTags.map((tag) => {
          const isMatch = matchedLower.has(tag.toLowerCase());
          return (
            <span key={tag} className={`job-tag ${isMatch ? "job-tag-match" : "job-tag-missing"}`}>
              {isMatch && <Check size={12} aria-hidden="true" />}
              {tag}
            </span>
          );
        })}
        {(hiddenCount > 0 || showAllTags) && sortedTags.length > MAX_VISIBLE_TAGS && (
          <button
            type="button"
            className="job-tag job-tag-more"
            onClick={() => setShowAllTags((v) => !v)}
            aria-expanded={showAllTags}
          >
            {showAllTags ? "Ringkas" : `+${hiddenCount} lainnya`}
          </button>
        )}
      </div>

      <p className="job-skill-summary">
        <strong>
          Cocok {match.matchedCount}/{match.totalRequired}
        </strong>
        {match.missingSkills.length > 0 && (
          <>
            {" · Kurang: "}
            <span className="text-danger">
              {shownMissing.join(", ")}
              {extraMissing > 0 && ` +${extraMissing}`}
            </span>
          </>
        )}
      </p>

      <div className="job-card-footer">
        <span className="job-salary">
          <Wallet size={14} aria-hidden="true" />
          {job.salary || "Gaji tidak dicantumkan"}
        </span>
        <button
          type="button"
          className={`btn ${alreadyApplied ? "btn-secondary" : "btn-primary"}`}
          disabled={alreadyApplied}
          onClick={() => onSave(job)}
        >
          {alreadyApplied ? (
            <>
              <Check size={16} aria-hidden="true" /> Sudah Dilamar
            </>
          ) : (
            <>
              <Heart size={16} aria-hidden="true" /> Simpan ke Wishlist
            </>
          )}
        </button>
      </div>
    </article>
  );
}
