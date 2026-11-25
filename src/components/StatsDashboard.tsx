import type { Application } from "../types";

interface StatsDashboardProps {
  applications: Application[];
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function isApplicationRawanGhosting(app: Application): boolean {
  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }
  const updatedTime = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(updatedTime)) {
    return false;
  }
  return Date.now() - updatedTime > FOURTEEN_DAYS_MS;
}

export function StatsDashboard({ applications }: StatsDashboardProps) {
  const totalApplications = applications.length;

  const activePipelineCount = applications.filter((app) =>
    ["WISHLIST", "APPLIED", "SCREENING", "INTERVIEW"].includes(app.status)
  ).length;

  const respondedCount = applications.filter((app) =>
    ["SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(app.status)
  ).length;

  const responseRate =
    totalApplications > 0
      ? Math.round((respondedCount / totalApplications) * 100)
      : 0;

  const interviewReachedCount = applications.filter(
    (app) =>
      app.status === "INTERVIEW" ||
      app.status === "OFFER" ||
      app.activityLogs.some((log) =>
        log.message.toLowerCase().includes("interview")
      )
  ).length;

  const interviewRate =
    totalApplications > 0
      ? Math.round((interviewReachedCount / totalApplications) * 100)
      : 0;

  const rawanGhostingCount = applications.filter(isApplicationRawanGhosting).length;

  const totalOfferCount = applications.filter(
    (app) => app.status === "OFFER"
  ).length;

  return (
    <section className="stats-grid" aria-label="Ringkasan Statistik Lamaran">
      <article className="stat-card">
        <span className="stat-label">TOTAL LAMARAN</span>
        <strong className="stat-value">{totalApplications}</strong>
        <span className="stat-sub">{activePipelineCount} aktif di pipeline</span>
      </article>

      <article className="stat-card">
        <span className="stat-label">RESPONSE RATE</span>
        <strong className="stat-value">{responseRate}%</strong>
        <span className="stat-sub">
          {respondedCount} dari {totalApplications} diproses
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-label">INTERVIEW RATE</span>
        <strong className="stat-value">{interviewRate}%</strong>
        <span className="stat-sub">{interviewReachedCount} masuk wawancara</span>
      </article>

      <article className="stat-card">
        <span className="stat-label">RAWAN GHOSTING</span>
        <strong className="stat-value text-danger">{rawanGhostingCount}</strong>
        <span className="stat-sub">&gt;14 hari tanpa kabar</span>
      </article>

      <article className="stat-card">
        <span className="stat-label">OFFER DITERIMA</span>
        <strong className="stat-value text-success">{totalOfferCount}</strong>
        <span className="stat-sub">
          {totalOfferCount >= 2 ? "Siap dibandingkan" : "Minimal 2 untuk bandingkan"}
        </span>
      </article>
    </section>
  );
}