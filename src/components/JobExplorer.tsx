import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Application, JobListing, JobSortOption, JobSource } from "../types";
import { fetchJobs } from "../services/jobService";
import { useDebounce } from "../hooks/useDebounce";
import { calculateSkillMatch } from "../utils/skillMatch";
import { SkillProfile } from "./SkillProfile";
import { JobCard } from "./JobCard";

interface JobExplorerProps {
  kaptenSkills: string[];
  onChangeSkills: Dispatch<SetStateAction<string[]>>;
  applications: Application[];
  onSaveToWishlist: (job: JobListing) => void;
}

type FetchStatus = "loading" | "error" | "success";

/** Kunci anti-duplikat: company + role, case-insensitive */
function makeApplicationKey(company: string, role: string): string {
  return `${company.trim().toLowerCase()}|${role.trim().toLowerCase()}`;
}

export function JobExplorer({
  kaptenSkills,
  onChangeSkills,
  applications,
  onSaveToWishlist,
}: JobExplorerProps) {
  // ---- state fetch ----
  const [source, setSource] = useState<JobSource>("remote");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ---- state filter ----
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<JobSortOption>("match-desc");
  const debouncedKeyword = useDebounce(keyword, 400);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch lowongan: jalan ulang tiap source berubah atau tombol Coba Lagi diklik
  useEffect(() => {
    const controller = new AbortController();

    fetchJobs(source, controller.signal)
      .then((data) => {
        setJobs(data);
        setStatus("success");
      })
      .catch((err: unknown) => {
        // request dibatalkan (unmount / ganti sumber) -> abaikan
        if (err instanceof DOMException && err.name === "AbortError") return;
        setErrorMessage(
          err instanceof Error
            ? `${err.message}. Periksa koneksi internet kamu.`
            : "Terjadi kesalahan saat memuat lowongan."
        );
        setStatus("error");
      });

    // cleanup: batalkan request lama
    return () => controller.abort();
  }, [source, reloadKey]);

  // Bonus: tekan "/" untuk fokus ke search bar (useRef)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startLoading = () => {
    setStatus("loading");
    setErrorMessage(null);
  };

  const handleRetry = () => {
    startLoading();
    setReloadKey((k) => k + 1);
  };

  const handleChangeSource = (next: JobSource) => {
    if (next === source) {
      handleRetry();
      return;
    }
    startLoading();
    setCategory("ALL");
    setSource(next);
  };

  // ---- derived state (dihitung tiap render, tidak disimpan di useState) ----
  const appliedKeys = useMemo(
    () => new Set(applications.map((a) => makeApplicationKey(a.company, a.role))),
    [applications]
  );

  const categories = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.category))).sort(),
    [jobs]
  );

  const visibleJobs = useMemo(() => {
    const q = debouncedKeyword.trim().toLowerCase();

    const withMatch = jobs.map((job) => ({
      job,
      match: calculateSkillMatch(job.tags, kaptenSkills),
    }));

    const filtered = withMatch.filter(({ job }) => {
      const matchCategory = category === "ALL" || job.category === category;
      const matchKeyword =
        q === "" ||
        job.title.toLowerCase().includes(q) ||
        job.company_name.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategory && matchKeyword;
    });

    // filtered adalah array baru hasil .filter(), jadi aman di-sort
    return filtered.sort((a, b) => {
      if (sortBy === "match-desc") return b.match.percentage - a.match.percentage;
      if (sortBy === "match-asc") return a.match.percentage - b.match.percentage;
      return a.job.title.localeCompare(b.job.title);
    });
  }, [jobs, kaptenSkills, debouncedKeyword, category, sortBy]);

  const isWaitingDebounce = keyword !== debouncedKeyword;

  return (
    <div className="explore-layout">
      <aside className="explore-sidebar">
        <SkillProfile skills={kaptenSkills} onChangeSkills={onChangeSkills} />

        <div className="card-section">
          <h3 className="section-title">Sumber Data Lowongan</h3>
          <label className="radio-row">
            <input
              type="radio"
              name="job-source"
              checked={source === "remote"}
              onChange={() => handleChangeSource("remote")}
            />
            Remotive API (Live)
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="job-source"
              checked={source === "local"}
              onChange={() => handleChangeSource("local")}
            />
            Dataset Magang ID (Lokal)
          </label>
        </div>
      </aside>

      <section className="explore-main card-section">
        <div className="explore-toolbar">
          <input
            ref={searchInputRef}
            className="form-input"
            type="search"
            placeholder='Cari posisi, perusahaan, atau skill... (tekan "/")'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as JobSortOption)}
          >
            <option value="match-desc">Match Tertinggi</option>
            <option value="match-asc">Match Terendah</option>
            <option value="title-asc">Judul A–Z</option>
          </select>
        </div>
        {isWaitingDebounce && <p className="detail-meta">Mencari...</p>}

        {status === "loading" && (
          <div className="state-box">
            <span className="spinner" aria-hidden="true" />
            <p>Memuat lowongan...</p>
          </div>
        )}

        {status === "error" && (
          <div className="state-box state-error">
            <p>
              <strong>Gagal memuat lowongan.</strong>
            </p>
            <p>{errorMessage}</p>
            <div className="state-actions">
              <button type="button" className="btn btn-primary" onClick={handleRetry}>
                Coba Lagi
              </button>
              {source === "remote" && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleChangeSource("local")}
                >
                  Pakai Fallback Lokal
                </button>
              )}
            </div>
          </div>
        )}

        {status === "success" && visibleJobs.length === 0 && (
          <div className="state-box">
            <p>
              {jobs.length === 0
                ? "Belum ada lowongan dari sumber ini."
                : "Tidak ada lowongan yang cocok dengan pencarian/filter."}
            </p>
          </div>
        )}

        {status === "success" && visibleJobs.length > 0 && (
          <div className="job-grid">
            {visibleJobs.map(({ job, match }) => (
              <JobCard
                key={job.id}
                job={job}
                match={match}
                alreadyApplied={appliedKeys.has(
                  makeApplicationKey(job.company_name, job.title)
                )}
                onSave={onSaveToWishlist}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
