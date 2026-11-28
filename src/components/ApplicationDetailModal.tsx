import { useState } from "react";
import { X } from "lucide-react";
import type {
  Application,
  ApplicationStatus,
  ChecklistItem,
  ActivityLog,
  WorkMode,
} from "../types";
import {
  getAvailableTransitions,
  validateStatusTransition,
  STATUS_LABELS,
} from "../utils/stateMachine";
import { InterviewPrepTimer } from "./InterviewPrepTimer";

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onUpdateApplication: (updatedApp: Application) => void;
}

function formatLogDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ApplicationDetailModal({
  application,
  onClose,
  onUpdateApplication,
}: ApplicationDetailModalProps) {
  const availableTargets = getAvailableTransitions(application.status);

  // State untuk form transisi status
  const [selectedTarget, setSelectedTarget] = useState<ApplicationStatus | "">(
    availableTargets[0] ?? ""
  );
  const [cvVersion, setCvVersion] = useState<string>(application.cvVersion ?? "");
  const [appliedDate, setAppliedDate] = useState<string>(
    application.appliedDate ?? new Date().toISOString().slice(0, 10)
  );
  const [interviewDateTime, setInterviewDateTime] = useState<string>(
    application.interviewDateTime ?? ""
  );
  const [salaryOffer, setSalaryOffer] = useState<string>(
    application.salaryOffer ? String(application.salaryOffer) : ""
  );
  const [workMode, setWorkMode] = useState<WorkMode>(application.workMode);
  const [transitionError, setTransitionError] = useState<string>("");

  const [newChecklistText, setNewChecklistText] = useState<string>("");

  const [manualNote, setManualNote] = useState<string>("");

  const completedCount = application.checklist.filter((item) => item.done).length;
  const totalChecklist = application.checklist.length;
  const progressPercent =
    totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  const handleConfirmTransition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTarget) return;

    const parsedSalary = salaryOffer.trim() === "" ? undefined : Number(salaryOffer);

    const validation = validateStatusTransition(
      application.status,
      selectedTarget,
      {
        cvVersion,
        appliedDate,
        interviewDateTime,
        salaryOffer: parsedSalary,
        workMode,
      }
    );

    if (!validation.valid) {
      setTransitionError(validation.error ?? "Transisi status tidak valid.");
      return;
    }

    setTransitionError("");
    const nowIso = new Date().toISOString();

    let detailMessage = `Status berpindah dari ${STATUS_LABELS[application.status]} ke ${STATUS_LABELS[selectedTarget]}`;
    if (selectedTarget === "APPLIED") {
      detailMessage += ` (CV: ${cvVersion.trim()}, Tanggal: ${appliedDate})`;
    } else if (selectedTarget === "INTERVIEW") {
      detailMessage += ` (Jadwal: ${formatLogDate(interviewDateTime)})`;
    } else if (selectedTarget === "OFFER" && parsedSalary) {
      detailMessage += ` (Offer: ${formatRupiah(parsedSalary)}, ${workMode})`;
    }

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: nowIso,
      message: detailMessage,
    };

    const updatedApp: Application = {
      ...application,
      status: selectedTarget,
      cvVersion: selectedTarget === "APPLIED" ? cvVersion.trim() : application.cvVersion,
      appliedDate: selectedTarget === "APPLIED" ? appliedDate : application.appliedDate,
      interviewDateTime:
        selectedTarget === "INTERVIEW"
          ? interviewDateTime
          : application.interviewDateTime,
      salaryOffer: selectedTarget === "OFFER" ? parsedSalary : application.salaryOffer,
      workMode: selectedTarget === "OFFER" ? workMode : application.workMode,
      lastUpdatedAt: nowIso,
      activityLogs: [newLog, ...application.activityLogs],
    };

    onUpdateApplication(updatedApp);

    const nextAvailable = getAvailableTransitions(selectedTarget);
    setSelectedTarget(nextAvailable[0] ?? "");
  };

  const handleAddChecklist = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
    };

    const updatedApp: Application = {
      ...application,
      checklist: [...application.checklist, newItem],
    };

    onUpdateApplication(updatedApp);
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    const updatedChecklist = application.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    onUpdateApplication({
      ...application,
      checklist: updatedChecklist,
    });
  };

  const handleDeleteChecklist = (itemId: string) => {
    const updatedChecklist = application.checklist.filter(
      (item) => item.id !== itemId
    );

    onUpdateApplication({
      ...application,
      checklist: updatedChecklist,
    });
  };

  const handleAddManualLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = manualNote.trim();
    if (!trimmed) return;

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: `Catatan Kapten: ${trimmed}`,
    };

    onUpdateApplication({
      ...application,
      activityLogs: [newLog, ...application.activityLogs],
    });
    setManualNote("");
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="modal-container detail-modal">
        {/* Header Modal */}
        <header className="detail-header">
          <div>
            <div className="detail-title-row">
              <h2 id="detail-modal-title">
                {application.role} — {application.company}
              </h2>
              <span className={`status-pill status-${application.status.toLowerCase()}`}>
                {STATUS_LABELS[application.status]}
              </span>
            </div>
            <p className="detail-meta">
              Mode: <strong>{application.workMode}</strong>
              {application.cvVersion && <> • CV: <strong>{application.cvVersion}</strong></>}
              {application.interviewDateTime && (
                <> • Jadwal Interview: <strong>{formatLogDate(application.interviewDateTime)}</strong></>
              )}
              {typeof application.salaryOffer === "number" && application.salaryOffer > 0 && (
                <> • Offer: <strong>{formatRupiah(application.salaryOffer)}</strong></>
              )}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Tutup detail lamaran"
          >
            <X size={16} aria-hidden="true" /> Tutup
          </button>
        </header>

        {/* Grid 2 Kolom sesuai Wireframe Halaman 7 */}
        <div className="detail-grid">
          {/* KOLOM KIRI: State Machine + Checklist */}
          <div className="detail-col">
            {/* Bagian A: State Machine */}
            <section className="card-section">
              <h3 className="section-title">TAHAP SELEKSI (STATE MACHINE)</h3>

              {availableTargets.length === 0 ? (
                <div className="info-banner">
                  Status <strong>{STATUS_LABELS[application.status]}</strong> bersifat{" "}
                  <strong>final</strong> dan tidak dapat diubah lagi.
                </div>
              ) : (
                <form onSubmit={handleConfirmTransition} className="transition-form" noValidate>
                  <label className="form-label">Pindahkan status ke:</label>
                  <div className="target-pill-group">
                    {availableTargets.map((target) => (
                      <button
                        key={target}
                        type="button"
                        className={`target-btn ${
                          selectedTarget === target ? "target-btn-active" : ""
                        }`}
                        onClick={() => {
                          setSelectedTarget(target);
                          setTransitionError("");
                        }}
                      >
                        {STATUS_LABELS[target]}
                      </button>
                    ))}
                  </div>

                  {/* Input Kondisional: APPLIED */}
                  {selectedTarget === "APPLIED" && (
                    <div className="conditional-fields">
                      <div className="form-group">
                        <label htmlFor="cvVersionInput" className="form-label">
                          Versi CV *
                        </label>
                        <input
                          id="cvVersionInput"
                          type="text"
                          className="form-input"
                          placeholder="Contoh: Kapten-CV-v2.pdf"
                          value={cvVersion}
                          onChange={(e) => setCvVersion(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="appliedDateInput" className="form-label">
                          Tanggal Melamar *
                        </label>
                        <input
                          id="appliedDateInput"
                          type="date"
                          className="form-input"
                          value={appliedDate}
                          onChange={(e) => setAppliedDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Kondisional: INTERVIEW */}
                  {selectedTarget === "INTERVIEW" && (
                    <div className="conditional-fields">
                      <div className="form-group">
                        <label htmlFor="interviewDateInput" className="form-label">
                          Jadwal Interview *
                        </label>
                        <input
                          id="interviewDateInput"
                          type="datetime-local"
                          className="form-input"
                          value={interviewDateTime}
                          onChange={(e) => setInterviewDateTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Kondisional: OFFER */}
                  {selectedTarget === "OFFER" && (
                    <div className="conditional-fields">
                      <div className="form-group">
                        <label htmlFor="salaryOfferInput" className="form-label">
                          Nominal Uang Saku / Gaji (Rp) *
                        </label>
                        <input
                          id="salaryOfferInput"
                          type="number"
                          min={1}
                          className="form-input"
                          placeholder="Contoh: 5500000"
                          value={salaryOffer}
                          onChange={(e) => setSalaryOffer(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="workModeOfferSelect" className="form-label">
                          Mode Kerja *
                        </label>
                        <select
                          id="workModeOfferSelect"
                          className="form-input"
                          value={workMode}
                          onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {transitionError && (
                    <p className="error-text" role="alert">
                      {transitionError}
                    </p>
                  )}

                  <button type="submit" className="btn btn-primary">
                    Konfirmasi Perubahan Status
                  </button>
                </form>
              )}
            </section>

            {/* Bagian B: Nested Checklist */}
            <section className="card-section">
              <div className="section-header-row">
                <h3 className="section-title">DAFTAR PERSIAPAN</h3>
                <span className="progress-label">
                  {completedCount} / {totalChecklist} selesai
                </span>
              </div>

              <div className="progress-bar-track" aria-hidden="true">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <ul className="checklist-list">
                {application.checklist.length === 0 ? (
                  <li className="empty-inline">
                    Belum ada daftar persiapan. Tambahkan tugas di bawah.
                  </li>
                ) : (
                  application.checklist.map((item) => (
                    <li key={item.id} className="checklist-item">
                      <label className="checklist-label">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleChecklist(item.id)}
                        />
                        <span className={item.done ? "checklist-done" : ""}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleDeleteChecklist(item.id)}
                        aria-label={`Hapus item ${item.text}`}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <form onSubmit={handleAddChecklist} className="inline-add-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tambah tugas persiapan baru..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Tambah
                </button>
              </form>
            </section>
          </div>

          {/* KOLOM KANAN: Interview Prep Timer + Activity Log */}
          <div className="detail-col">
            <InterviewPrepTimer />

            <section className="card-section">
              <h3 className="section-title">RIWAYAT AKTIVITAS</h3>

              <form onSubmit={handleAddManualLog} className="inline-add-form" style={{ marginBottom: "0.75rem" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tambah catatan manual Kapten..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary">
                  Catat
                </button>
              </form>

              <ul className="activity-log-list">
                {application.activityLogs.length === 0 ? (
                  <li className="empty-inline">Belum ada riwayat aktivitas.</li>
                ) : (
                  application.activityLogs.map((log) => (
                    <li key={log.id} className="activity-log-item">
                      <span className="log-timestamp">
                        {formatLogDate(log.timestamp)}
                      </span>
                      <p className="log-message">{log.message}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}