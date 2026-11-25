import { useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

interface SkillProfileProps {
  skills: string[];
  onChangeSkills: Dispatch<SetStateAction<string[]>>;
}

export function SkillProfile({ skills, onChangeSkills }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newSkill.trim();

    if (trimmed === "") {
      setError("Nama skill tidak boleh kosong.");
      return;
    }
    const isDuplicate = skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setError(`Skill "${trimmed}" sudah ada di profil.`);
      return;
    }

    // immutable: buat array baru, bukan push
    onChangeSkills((prev) => [...prev, trimmed]);
    setNewSkill("");
    setError(null);
  };

  const handleRemove = (skillToRemove: string) => {
    onChangeSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="card-section">
      <h3 className="section-title">Profil Skill Kapten</h3>
      <p className="detail-meta">
        Digunakan untuk menghitung persentase kecocokan tiap lowongan.
      </p>

      <form className="inline-add-form" onSubmit={handleAdd}>
        <input
          className="form-input"
          type="text"
          placeholder="Tambah skill..."
          value={newSkill}
          onChange={(e) => {
            setNewSkill(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="btn btn-primary">
          Tambah
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {skills.length === 0 ? (
        <p className="empty-inline">Belum ada skill. Tambahkan minimal 1 skill.</p>
      ) : (
        <div className="skill-chip-list">
          {skills.map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
              <button
                type="button"
                className="skill-chip-remove"
                aria-label={`Hapus skill ${skill}`}
                onClick={() => handleRemove(skill)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
