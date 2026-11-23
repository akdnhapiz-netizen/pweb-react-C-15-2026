import { useState, useEffect } from "react";
import type { Application, WorkMode } from "../types";
import { calculateSkillMatch } from "../utils/skillMatch";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

const WORK_MODE_SCORES: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OfferComparator({
  applications,
  kaptenSkills,
}: OfferComparatorProps) {
  const offerApps = applications.filter((app) => app.status === "OFFER");

  const [offerAId, setOfferAId] = useState<string>("");
  const [offerBId, setOfferBId] = useState<string>("");

  useEffect(() => {
    if (offerApps.length < 2) {
      setOfferAId("");
      setOfferBId("");
      return;
    }

    const existsA = offerApps.some((app) => app.id === offerAId);
    const existsB = offerApps.some((app) => app.id === offerBId);

    const nextA = existsA ? offerAId : offerApps[0].id;
    let nextB = existsB ? offerBId : offerApps[1].id;

    if (nextA === nextB) {
      const alternative = offerApps.find((app) => app.id !== nextA);
      nextB = alternative ? alternative.id : offerApps[1].id;
    }

    setOfferAId(nextA);
    setOfferBId(nextB);
  }, [offerApps, offerAId, offerBId]);

  if (offerApps.length < 2) {
    return (
      <section className="empty-state-card" aria-label="Perbandingan Offer Kosong">
        <h3>Belum Cukup Offer untuk Dibandingkan</h3>
        <p>
          Saat ini Kapten memiliki <strong>{offerApps.length}</strong> lamaran
          berstatus <strong>OFFER</strong>. Pindahkan minimal{" "}
          <strong>2 lamaran</strong> ke status <strong>OFFER</strong> pada detail
          lamaran untuk membuka kalkulator perbandingan objektif.
        </p>
      </section>
    );
  }

  const offerA = offerApps.find((app) => app.id === offerAId) ?? offerApps[0];
  const offerB = offerApps.find((app) => app.id === offerBId) ?? offerApps[1];

  const salaryA = offerA.salaryOffer ?? 0;
  const salaryB = offerB.salaryOffer ?? 0;
  const maxSalary = Math.max(salaryA, salaryB);

  const normSalaryA = maxSalary > 0 ? (salaryA / maxSalary) * 100 : 0;
  const normSalaryB = maxSalary > 0 ? (salaryB / maxSalary) * 100 : 0;

  const modeScoreA = WORK_MODE_SCORES[offerA.workMode];
  const modeScoreB = WORK_MODE_SCORES[offerB.workMode];

  const matchA = calculateSkillMatch(offerA.requiredSkills, kaptenSkills);
  const matchB = calculateSkillMatch(offerB.requiredSkills, kaptenSkills);

  const weightedSalaryA = normSalaryA * 0.5;
  const weightedModeA = modeScoreA * 0.25;
  const weightedSkillA = matchA.percentage * 0.25;
  const totalScoreA = weightedSalaryA + weightedModeA + weightedSkillA;

  const weightedSalaryB = normSalaryB * 0.5;
  const weightedModeB = modeScoreB * 0.25;
  const weightedSkillB = matchB.percentage * 0.25;
  const totalScoreB = weightedSalaryB + weightedModeB + weightedSkillB;

  const isABest = totalScoreA >= totalScoreB;
  const isBBest = totalScoreB >= totalScoreA;

  const renderOfferCard = (
    offer: Application,
    salary: number,
    weightedSalary: number,
    modeScore: number,
    weightedMode: number,
    match: ReturnType<typeof calculateSkillMatch>,
    weightedSkill: number,
    totalScore: number,
    isRecommended: boolean
  ) => (
    <article
      className={`comparator-card ${
        isRecommended ? "comparator-card-winner" : ""
      }`}
    >
      <div className="comparator-card-header">
        <div>
          <h3>{offer.company}</h3>
          <p className="detail-meta">{offer.role}</p>
        </div>
        {isRecommended && (
          <span className="badge-recommended">Rekomendasi Terbaik</span>
        )}
      </div>

      <div className="comparator-rows">
        <div className="comparator-row">
          <span>Uang Saku / Bulan</span>
          <strong>{formatRupiah(salary)}</strong>
          <span className="score-fraction">{weightedSalary.toFixed(1)} / 50</span>
        </div>

        <div className="comparator-row">
          <span>Mode Kerja</span>
          <strong>
            {offer.workMode} ({modeScore})
          </strong>
          <span className="score-fraction">{weightedMode.toFixed(1)} / 25</span>
        </div>

        <div className="comparator-row">
          <span>Kecocokan Skill</span>
          <strong>
            {match.percentage}% ({match.matchedCount} dari {match.totalRequired} skill)
          </strong>
          <span className="score-fraction">{weightedSkill.toFixed(1)} / 25</span>
        </div>
      </div>

      <div className="comparator-total-box">
        <span>TOTAL SKOR BERBOBOT</span>
        <strong className="comparator-total-score">{totalScore.toFixed(1)}</strong>
      </div>
    </article>
  );

  return (
    <section className="comparator-section" aria-label="Bandingkan Offer Magang">
      <div className="comparator-toolbar">
        <div>
          <h2>Bandingkan Offer Magang</h2>
          <p className="detail-meta">
            Bobot penilaian: Uang Saku 50% • Mode Kerja 25% • Kecocokan Skill 25%
          </p>
        </div>

        <div className="comparator-selectors">
          <label className="selector-group">
            <span>Offer A:</span>
            <select
              className="form-input"
              value={offerA.id}
              onChange={(e) => setOfferAId(e.target.value)}
            >
              {offerApps.map((app) => (
                <option key={app.id} value={app.id} disabled={app.id === offerB.id}>
                  {app.company} — {app.role}
                </option>
              ))}
            </select>
          </label>

          <span className="vs-label">vs</span>

          <label className="selector-group">
            <span>Offer B:</span>
            <select
              className="form-input"
              value={offerB.id}
              onChange={(e) => setOfferBId(e.target.value)}
            >
              {offerApps.map((app) => (
                <option key={app.id} value={app.id} disabled={app.id === offerA.id}>
                  {app.company} — {app.role}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="comparator-grid">
        {renderOfferCard(
          offerA,
          salaryA,
          weightedSalaryA,
          modeScoreA,
          weightedModeA,
          matchA,
          weightedSkillA,
          totalScoreA,
          isABest
        )}
        {renderOfferCard(
          offerB,
          salaryB,
          weightedSalaryB,
          modeScoreB,
          weightedModeB,
          matchB,
          weightedSkillB,
          totalScoreB,
          isBBest
        )}
      </div>
    </section>
  );
}