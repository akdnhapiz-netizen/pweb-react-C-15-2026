import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { FormEvent } from "react";
import type { Application, WorkMode } from "../types";
import { isDuplicateApplication } from "../utils/applicationUtils";

type InitialStatus = "WISHLIST" | "APPLIED";

interface FormValues {
  company: string;
  role: string;
  workMode: WorkMode;
  status: InitialStatus;
  requiredSkills: string; // dipisah koma
  cvVersion: string;
  appliedDate: string;
}

type FieldName = "company" | "role" | "requiredSkills" | "cvVersion" | "appliedDate";
type FormErrors = Partial<Record<FieldName, string>>;

// urutan field di layar -> dipakai untuk mencari "input pertama yang error"
const FIELD_ORDER: FieldName[] = ["company", "role", "requiredSkills", "cvVersion", "appliedDate"];

const INITIAL_VALUES: FormValues = {
  company: "",
  role: "",
  workMode: "Remote",
  status: "WISHLIST",
  requiredSkills: "",
  cvVersion: "",
  appliedDate: new Date().toISOString().slice(0, 10),
};

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (app: Application) => void;
  onClose: () => void;
}

function parseSkills(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (s === "" || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function ApplicationForm({ applications, onAdd, onClose }: ApplicationFormProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  // satu ref untuk tiap input yang bisa error
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const refs: Record<FieldName, React.RefObject<HTMLInputElement | null>> = {
    company: companyRef,
    role: roleRef,
    requiredSkills: skillsRef,
    cvVersion: cvRef,
    appliedDate: dateRef,
  };

  // update satu field secara immutable + hapus error field tsb
  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as FieldName];
      return next;
    });
  };

  const validate = (): FormErrors => {
    const result: FormErrors = {};
    if (values.company.trim() === "") result.company = "Nama perusahaan wajib diisi.";
    if (values.role.trim() === "") result.role = "Posisi/role wajib diisi.";
    if (parseSkills(values.requiredSkills).length === 0)
      result.requiredSkills = "Isi minimal 1 skill (pisahkan dengan koma).";

    if (values.status === "APPLIED") {
      if (values.cvVersion.trim() === "") result.cvVersion = "Versi CV wajib diisi untuk status Applied.";
      if (values.appliedDate === "") result.appliedDate = "Tanggal melamar wajib diisi untuk status Applied.";
    }

    if (
      !result.company &&
      !result.role &&
      isDuplicateApplication(applications, values.company, values.role)
    ) {
      result.company = `Lamaran "${values.company.trim()}" — "${values.role.trim()}" sudah ada (duplikat).`;
    }
    return result;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    const firstError = FIELD_ORDER.find((field) => validationErrors[field]);
    if (firstError) {
      // auto-focus ke input pertama yang error lewat useRef
      refs[firstError].current?.focus();
      return;
    }

    const now = new Date().toISOString();
    const isApplied = values.status === "APPLIED";
    const newApp: Application = {
      id: crypto.randomUUID(),
      company: values.company.trim(),
      role: values.role.trim(),
      workMode: values.workMode,
      status: values.status,
      requiredSkills: parseSkills(values.requiredSkills),
      cvVersion: isApplied ? values.cvVersion.trim() : undefined,
      appliedDate: isApplied ? values.appliedDate : undefined,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: isApplied
            ? `Lamaran dicatat manual sebagai Applied (CV: ${values.cvVersion.trim()})`
            : "Lamaran dicatat manual ke Wishlist",
        },
      ],
    };

    onAdd(newApp);
    onClose();
  };

  const errorClass = (field: FieldName) => (errors[field] ? "form-input input-error" : "form-input");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="modal-container form-modal">
        <header className="detail-header">
          <h2 id="form-title" className="section-title">Catat Lamaran Manual</h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            <X size={16} aria-hidden="true" /> Tutup
          </button>
        </header>

        <form className="app-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="f-company" className="form-label">Perusahaan *</label>
            <input
              id="f-company"
              ref={companyRef}
              className={errorClass("company")}
              value={values.company}
              onChange={(e) => updateField("company", e.target.value)}
              placeholder="Contoh: Garuda FinTech"
            />
            {errors.company && <p className="error-text">{errors.company}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="f-role" className="form-label">Posisi / Role *</label>
            <input
              id="f-role"
              ref={roleRef}
              className={errorClass("role")}
              value={values.role}
              onChange={(e) => updateField("role", e.target.value)}
              placeholder="Contoh: Frontend Intern"
            />
            {errors.role && <p className="error-text">{errors.role}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="f-mode" className="form-label">Mode Kerja</label>
              <select
                id="f-mode"
                className="form-input"
                value={values.workMode}
                onChange={(e) => updateField("workMode", e.target.value as WorkMode)}
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="f-status" className="form-label">Status Awal</label>
              <select
                id="f-status"
                className="form-input"
                value={values.status}
                onChange={(e) => updateField("status", e.target.value as InitialStatus)}
              >
                <option value="WISHLIST">Wishlist</option>
                <option value="APPLIED">Applied</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="f-skills" className="form-label">Required Skills * (pisahkan dengan koma)</label>
            <input
              id="f-skills"
              ref={skillsRef}
              className={errorClass("requiredSkills")}
              value={values.requiredSkills}
              onChange={(e) => updateField("requiredSkills", e.target.value)}
              placeholder="React, TypeScript, CSS"
            />
            {errors.requiredSkills && <p className="error-text">{errors.requiredSkills}</p>}
          </div>

          {/* Input kondisional: hanya muncul jika status awal APPLIED */}
          {values.status === "APPLIED" && (
            <div className="conditional-fields">
              <div className="form-group">
                <label htmlFor="f-cv" className="form-label">Versi CV *</label>
                <input
                  id="f-cv"
                  ref={cvRef}
                  className={errorClass("cvVersion")}
                  value={values.cvVersion}
                  onChange={(e) => updateField("cvVersion", e.target.value)}
                  placeholder="Kapten-CV-v2.pdf"
                />
                {errors.cvVersion && <p className="error-text">{errors.cvVersion}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="f-date" className="form-label">Tanggal Melamar *</label>
                <input
                  id="f-date"
                  ref={dateRef}
                  type="date"
                  className={errorClass("appliedDate")}
                  value={values.appliedDate}
                  onChange={(e) => updateField("appliedDate", e.target.value)}
                />
                {errors.appliedDate && <p className="error-text">{errors.appliedDate}</p>}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan Lamaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
