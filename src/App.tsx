import { useEffect, useRef, useState } from "react";
import { Compass, ListChecks, Plus, Scale } from "lucide-react";
import type { Application, JobListing } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { StatsDashboard } from "./components/StatsDashboard";
import { ApplicationDetailModal } from "./components/ApplicationDetailModal";
import { OfferComparator } from "./components/OfferComparator";
import { ThemeToggle } from "./components/ThemeToggle";
import { JobExplorer } from "./components/JobExplorer";
import { ApplicationForm } from "./components/ApplicationForm";
import { WarRoom } from "./components/WarRoom";
import { ConflictBanner } from "./components/ConflictBanner";
import { UndoToast } from "./components/UndoToast";
import { BackupControls } from "./components/BackupControls";
import { inferWorkMode } from "./services/jobService";
import { isDuplicateApplication, shiftLastUpdated } from "./utils/applicationUtils";

const UNDO_DURATION_MS = 5000;

interface PendingDelete {
  app: Application;
  index: number; // posisi semula, supaya Undo mengembalikan ke tempat yang sama
}

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
  const [showForm, setShowForm] = useState(false);

  // Fitur 6: Undo Delete
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // bersihkan timer kalau App unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

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
    if (isDuplicateApplication(applications, job.company_name, job.title)) return;

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

  // Fitur 2: tambah lamaran dari form manual
  const handleAddApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  // Fitur 3: Simulasi +15 Hari (mundurkan lastUpdatedAt)
  const handleSimulate = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? shiftLastUpdated(app, 15) : app))
    );
  };

  // Fitur 6: hapus + simpan salinan untuk Undo selama 5 detik
  const handleDelete = (id: string) => {
    const index = applications.findIndex((app) => app.id === id);
    if (index === -1) return;
    const deletedApp = applications[index];

    setApplications((prev) => prev.filter((app) => app.id !== id));
    if (selectedAppId === id) setSelectedAppId(null);

    // hapus 2x berturut-turut: timer lama dibersihkan dulu
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setPendingDelete({ app: deletedApp, index });
    undoTimerRef.current = setTimeout(() => {
      setPendingDelete(null); // lewat 5 detik -> terhapus permanen
      undoTimerRef.current = null;
    }, UNDO_DURATION_MS);
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    const { app, index } = pendingDelete;

    // kembalikan utuh (checklist & activityLogs ikut) di posisi semula, secara immutable
    setApplications((prev) => {
      if (prev.some((a) => a.id === app.id)) return prev;
      return [...prev.slice(0, index), app, ...prev.slice(index)];
    });

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setPendingDelete(null);
  };

  const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof Compass; count?: number }[] = [
    { id: "explore", label: "Eksplorasi Lowongan", icon: Compass },
    { id: "pipeline", label: "Pipeline Lamaran", icon: ListChecks, count: applications.length },
    { id: "comparator", label: "Bandingkan Offer", icon: Scale, count: offerCount },
  ];

  const PAGE_INFO: Record<ActiveTab, { title: string; subtitle: string }> = {
    explore: {
      title: "Eksplorasi Lowongan",
      subtitle: "Temukan lowongan magang dan lihat seberapa cocok skill Kapten.",
    },
    pipeline: {
      title: "War Room Lamaran",
      subtitle: "Pantau status, jadwal interview, dan lamaran yang rawan ghosting.",
    },
    comparator: {
      title: "Bandingkan Offer",
      subtitle: "Pilih dua offer dan lihat skor berbobotnya secara objektif.",
    },
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-group">
          <span className="brand-logo">AM</span>
          <span>Aku Mw Magang</span>
        </div>

        <button type="button" className="btn btn-primary sidebar-cta" onClick={() => setShowForm(true)}>
          <Plus size={18} aria-hidden="true" />
          Catat Lamaran
        </button>

        <nav className="nav-tabs" aria-label="Navigasi Utama">
          <span className="nav-heading">Menu</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              className={`nav-tab ${activeTab === id ? "nav-tab-active" : ""}`}
              aria-current={activeTab === id ? "page" : undefined}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="nav-label">{label}</span>
              {count !== undefined && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
        </div>
      </aside>

      <main className="main-container">
        <header className="page-header">
          <div>
            <h1 className="page-title">{PAGE_INFO[activeTab].title}</h1>
            <p className="page-subtitle">{PAGE_INFO[activeTab].subtitle}</p>
          </div>
          {activeTab === "pipeline" && (
            <BackupControls
              applications={applications}
              kaptenSkills={kaptenSkills}
              onImportApplications={setApplications}
              onImportSkills={setKaptenSkills}
            />
          )}
        </header>

        {/* Fitur 3: Banner Bentrok, dari SELURUH data (bukan yang ter-filter) */}
        <ConflictBanner applications={applications} />

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
          <WarRoom
            applications={applications}
            kaptenSkills={kaptenSkills}
            onOpenDetail={setSelectedAppId}
            onDelete={handleDelete}
            onSimulate={handleSimulate}
          />
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

      {/* Fitur 2: Form Tambah Lamaran Manual */}
      {showForm && (
        <ApplicationForm
          applications={applications}
          onAdd={handleAddApplication}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Fitur 6: Toast Undo (key = id supaya hitung mundur reset tiap delete) */}
      {pendingDelete && (
        <UndoToast
          key={pendingDelete.app.id}
          company={pendingDelete.app.company}
          durationMs={UNDO_DURATION_MS}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}

export default App;