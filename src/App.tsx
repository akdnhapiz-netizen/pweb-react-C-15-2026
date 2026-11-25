import { useState } from "react";
import type { Application, JobListing } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { STATUS_LABELS } from "./utils/stateMachine";
import {
  StatsDashboard,
  isApplicationRawanGhosting,
} from "./components/StatsDashboard";
import { ApplicationDetailModal } from "./components/ApplicationDetailModal";
import { OfferComparator } from "./components/OfferComparator";
import { ThemeToggle } from "./components/ThemeToggle";
import { JobExplorer } from "./components/JobExplorer";
import { inferWorkMode } from "./services/jobService";

const INITIAL_KAPTEN_SKILLS: string[] = [
  "React",
  "TypeScript",
  "CSS",
  "Git",
  "REST API",
];

const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    company: "Nusantara Cloud Tech",
    role: "Frontend Engineering Intern (React & TS)",
    workMode: "Hybrid",
    status: "WISHLIST",
    requiredSkills: ["React", "TypeScript", "CSS", "Git", "REST API"],
    lastUpdatedAt: new Date().toISOString(),
    checklist: [
      { id: "chk-1", text: "Sesuaikan CV dengan proyek React + TypeScript", done: true },
      { id: "chk-2", text: "Riset produk & stack Nusantara Cloud", done: false },
    ],
    activityLogs: [
      {
        id: "log-1",
        timestamp: new Date().toISOString(),
        message: "Disimpan ke Wishlist",
      },
    ],
  },
  {
    id: "app-2",
    company: "Garuda FinTech",
    role: "Full-Stack Web Developer Intern",
    workMode: "Remote",
    status: "INTERVIEW",
    requiredSkills: ["React", "TypeScript", "CSS", "Git", "PostgreSQL"],
    cvVersion: "Kapten-CV-v2.pdf",
    appliedDate: "2026-11-10",
    interviewDateTime: "2026-11-28T10:00",
    lastUpdatedAt: new Date().toISOString(),
    checklist: [
      { id: "chk-3", text: "Latihan soal teknis React Hooks & REST API", done: true },
      { id: "chk-4", text: "Siapkan pertanyaan balik untuk pewawancara", done: false },
    ],
    activityLogs: [
      {
        id: "log-2",
        timestamp: new Date().toISOString(),
        message: "Status berpindah dari Screening ke Interview",
      },
    ],
  },
  {
    id: "app-3",
    company: "Bintang Commerce",
    role: "Software Engineer Intern — Web Platform",
    workMode: "Remote",
    status: "OFFER",
    requiredSkills: ["React", "TypeScript", "CSS", "Git", "Testing"],
    cvVersion: "Kapten-CV-v2.pdf",
    appliedDate: "2026-11-05",
    salaryOffer: 6000000,
    lastUpdatedAt: new Date().toISOString(),
    checklist: [],
    activityLogs: [
      {
        id: "log-3",
        timestamp: new Date().toISOString(),
        message: "Status berpindah dari Interview ke Offer (Offer: Rp 6.000.000, Remote)",
      },
    ],
  },
  {
    id: "app-4",
    company: "Awan Merdeka Cloud",
    role: "Frontend React Intern",
    workMode: "Hybrid",
    status: "OFFER",
    requiredSkills: ["React", "TypeScript", "CSS", "Git", "REST API"],
    cvVersion: "Kapten-CV-v1.pdf",
    appliedDate: "2026-11-02",
    salaryOffer: 4500000,
    lastUpdatedAt: new Date().toISOString(),
    checklist: [],
    activityLogs: [
      {
        id: "log-4",
        timestamp: new Date().toISOString(),
        message: "Status berpindah dari Interview ke Offer (Offer: Rp 4.500.000, Hybrid)",
      },
    ],
  },
];

type ActiveTab = "explore" | "pipeline" | "comparator";

export function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "aku-mw-magang-applications",
    SEED_APPLICATIONS
  );
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "aku-mw-magang-skills",
    INITIAL_KAPTEN_SKILLS
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const offerCount = applications.filter((app) => app.status === "OFFER").length;
  const selectedApplication =
    applications.find((app) => app.id === selectedAppId) ?? null;

  const handleUpdateApplication = (updatedApp: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
  };

  // Fitur 1: simpan lowongan dari katalog ke daftar lamaran sebagai WISHLIST
  const handleSaveToWishlist = (job: JobListing) => {
    const key = `${job.company_name.trim().toLowerCase()}|${job.title.trim().toLowerCase()}`;
    const isDuplicate = applications.some(
      (app) => `${app.company.trim().toLowerCase()}|${app.role.trim().toLowerCase()}` === key
    );
    if (isDuplicate) return;

    const now = new Date().toISOString();
    const newApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job),
      status: "WISHLIST",
      requiredSkills: job.tags,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        { id: crypto.randomUUID(), timestamp: now, message: "Disimpan ke Wishlist dari Katalog Lowongan" },
      ],
    };
    setApplications((prev) => [newApp, ...prev]);
  };

  return (
    <div>
      <header className="topbar">
        <div className="brand-group">
          <span className="brand-logo">AM</span>
          <span>Aku Mw Magang</span>
        </div>

        <nav className="nav-tabs" aria-label="Navigasi Utama">
          <button
            type="button"
            className={`nav-tab ${activeTab === "explore" ? "nav-tab-active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            Eksplorasi Lowongan
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === "pipeline" ? "nav-tab-active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            Pipeline Lamaran ({applications.length})
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === "comparator" ? "nav-tab-active" : ""}`}
            onClick={() => setActiveTab("comparator")}
          >
            Bandingkan Offer ({offerCount})
          </button>
        </nav>

        <ThemeToggle />
      </header>

      <main className="main-container">
        {/* Fitur 7A: Dashboard Statistik (Derived State) */}
        <StatsDashboard applications={applications} />

        {activeTab === "explore" && (
          <JobExplorer
            kaptenSkills={kaptenSkills}
            onChangeSkills={setKaptenSkills}
            applications={applications}
            onSaveToWishlist={handleSaveToWishlist}
          />
        )}

        {activeTab === "pipeline" && (
          <section className="pipeline-list" aria-label="Daftar Lamaran">
            {applications.map((app) => {
              const doneCount = app.checklist.filter((c) => c.done).length;
              const isGhosting = isApplicationRawanGhosting(app);

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
                    <p className="detail-meta">
                      Mode: {app.workMode} • Checklist: {doneCount}/{app.checklist.length}
                      {isGhosting && (
                        <span className="text-danger"> • Rawan Ghosting</span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    Buka Detail &amp; Latihan Interview
                  </button>
                </article>
              );
            })}
          </section>
        )}

        {activeTab === "comparator" && (
          <OfferComparator
            applications={applications}
            kaptenSkills={kaptenSkills}
          />
        )}
      </main>

      {/* Fitur 4 & 5: Detail Lamaran Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedAppId(null)}
          onUpdateApplication={handleUpdateApplication}
        />
      )}
    </div>
  );
}

export default App;