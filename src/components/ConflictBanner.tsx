import { TriangleAlert } from "lucide-react";
import type { Application } from "../types";
import { findInterviewConflicts, formatDateTime } from "../utils/applicationUtils";

interface ConflictBannerProps {
  /** WAJIB seluruh data applications, bukan data yang sudah ter-filter */
  applications: Application[];
}

export function ConflictBanner({ applications }: ConflictBannerProps) {
  // derived state: dihitung ulang setiap render dari seluruh data
  const conflicts = findInterviewConflicts(applications);

  if (conflicts.length === 0) return null;

  return (
    <div className="conflict-banner" role="alert">
      <TriangleAlert size={20} aria-hidden="true" />
      <div>
      <strong>Jadwal Interview Bentrok!</strong>
      <ul>
        {conflicts.map(({ first, second, diffMinutes }) => (
          <li key={`${first.id}-${second.id}`}>
            {first.company} ({formatDateTime(first.interviewDateTime ?? "")}) dan {second.company} (
            {formatDateTime(second.interviewDateTime ?? "")}) hanya berselisih {diffMinutes} menit.
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
