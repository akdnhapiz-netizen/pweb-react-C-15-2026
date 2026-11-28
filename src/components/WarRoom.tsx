import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import type { Application, ApplicationStatus } from "../types";
import { STATUS_LABELS } from "../utils/stateMachine";
import { calculateSkillMatch, getMatchLevel } from "../utils/skillMatch";
import { formatDateTime, formatRupiah, isRawanGhosting } from "../utils/applicationUtils";

type StatusFilter = ApplicationStatus | "ALL";
type SortOption = "newest" | "interview-soonest" | "offer-highest";

const ALL_STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  onOpenDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onSimulate: (id: string) => void;
}

export function WarRoom({
  applications,
  kaptenSkills,
  onOpenDetail,
  onDelete,
  onSimulate,
}: WarRoomProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // derived state: filter gabungan + sorting, tidak disimpan di useState
  const visibleApps = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      const matchSearch =
        q === "" ||
        app.company.toLowerCase().includes(q) ||
        app.role.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || app.status === statusFilter;
      const matchGhosting = !onlyGhosting || isRawanGhosting(app);
      return matchSearch && matchStatus && matchGhosting;
    });

    // filtered adalah array baru, jadi .sort() tidak memutasi state applications
    return filtered.sort((a, b) => {
      if (sortBy === "interview-soonest") {
        // yang tidak punya jadwal ditaruh paling bawah
        const ta = a.interviewDateTime ? new Date(a.interviewDateTime).getTime() : Infinity;
        const tb = b.interviewDateTime ? new Date(b.interviewDateTime).getTime() : Infinity;
        return ta - tb;
      }
      if (sortBy === "offer-highest") {
        return (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0);
      }
      return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
    });
  }, [applications, search, statusFilter, onlyGhosting, sortBy]);

  return (
    <section className="card-section" aria-label="War Room Lamaran">
      <div className="warroom-toolbar">
        <input
          className="form-input"
          type="search"
          placeholder="Cari perusahaan atau posisi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">Semua Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="newest">Terbaru</option>
          <option value="interview-soonest">Jadwal Interview Terdekat</option>
          <option value="offer-highest">Offer Tertinggi</option>
        </select>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>
      </div>

      {applications.length === 0 ? (
        <div className="state-box">
          <p>Belum ada lamaran. Simpan dari Eksplorasi Lowongan atau klik "+ Catat Lamaran".</p>
        </div>
      ) : visibleApps.length === 0 ? (
        <div className="state-box">
          <p>Tidak ada lamaran yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="pipeline-list">
          {visibleApps.map((app) => {
            const doneCount = app.checklist.filter((c) => c.done).length;
            const match = calculateSkillMatch(app.requiredSkills, kaptenSkills);
            const ghosting = isRawanGhosting(app);
            const canSimulate = app.status === "APPLIED" || app.status === "SCREENING";

            return (
              <article key={app.id} className="pipeline-card">
                <div>
                  <div className="detail-title-row" style={{ justifyContent: "space-between" }}>
                    <strong>{app.company}</strong>
                    <span className={`status-pill status-${app.status.toLowerCase()}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </div>
                  <p className="detail-meta">{app.role}</p>

                  <div className="warroom-badges">
                    <span className={`match-badge match-${getMatchLevel(match.percentage)}`}>
                      {match.percentage}% Match
                    </span>
                    {ghosting && <span className="ghosting-badge"><Clock size={12} aria-hidden="true" /> Rawan Ghosting</span>}
                  </div>

                  <p className="detail-meta">
                    Mode: {app.workMode} • CV: {app.cvVersion ?? "-"} • Checklist: {doneCount}/
                    {app.checklist.length}
                  </p>
                  {app.interviewDateTime && (
                    <p className="detail-meta">Interview: {formatDateTime(app.interviewDateTime)}</p>
                  )}
                  {typeof app.salaryOffer === "number" && app.salaryOffer > 0 && (
                    <p className="detail-meta">Offer: {formatRupiah(app.salaryOffer)}</p>
                  )}
                </div>

                <div className="warroom-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onOpenDetail(app.id)}>
                    Detail
                  </button>
                  {canSimulate && (
                    <button type="button" className="btn btn-secondary" onClick={() => onSimulate(app.id)}>
                      Simulasi +15 Hari
                    </button>
                  )}
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(app.id)}>
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
