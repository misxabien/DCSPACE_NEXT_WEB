"use client";

import { useEffect, useMemo, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const CHIPS = ["Weekly", "Monthly", "Quarterly"];

const FALLBACK_RECOMMENDATIONS = [
  {
    title: "Collect Attendance Data",
    body: "Start RFID tapping to generate event analytics and smart recommendations.",
  },
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function getPercentRows(rows) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  return rows.slice(0, 6).map((row) => [
    row.label,
    `${Math.max(8, Math.round((Number(row.value || 0) / maxValue) * 100))}%`,
    String(row.value || 0),
  ]);
}

function getBarHeights(rows) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
  return rows.slice(0, 9).map((row) =>
    Math.max(18, Math.round((Number(row.value || 0) / maxValue) * 100)),
  );
}

export function DashboardView() {
  const showStatus = useShowStatus();
  const [range, setRange] = useState("Weekly");
  const [pinned, setPinned] = useState(() => new Set());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard", {
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load dashboard analytics");
        }

        setDashboardData(data);
      } catch (error) {
        showStatus(error instanceof Error ? error.message : "Unable to load dashboard analytics");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [showStatus]);

  const stats = useMemo(
    () => [
      {
        action: "Total Events opened",
        label: "Total Events",
        trend: loading ? "..." : "Live",
        value: formatNumber(dashboardData?.totalEvents),
        hint: "From MongoDB events",
      },
      {
        action: "Attendees opened",
        label: "Attendees",
        trend: loading ? "..." : "Live",
        value: formatNumber(dashboardData?.totalAttendees),
        hint: "From RFID attendance logs",
      },
      {
        action: "Certificates opened",
        label: "Certificates",
        trend: loading ? "..." : "Live",
        value: formatNumber(dashboardData?.totalCertificates),
        hint: "Issued certificate records",
      },
      {
        action: "Organizations opened",
        label: "Organizations",
        trend: loading ? "..." : "Live",
        value: formatNumber(dashboardData?.totalOrganizations),
        hint: "Distinct event organizations",
      },
    ],
    [dashboardData, loading],
  );

  const attendanceTrends = dashboardData?.aiAnalytics?.attendanceTrends ?? [];
  const peakEventTimes = dashboardData?.aiAnalytics?.peakEventTimes ?? [];
  const eventInsights = useMemo(() => getPercentRows(attendanceTrends), [attendanceTrends]);
  const peakTimes = useMemo(() => getPercentRows(peakEventTimes), [peakEventTimes]);
  const barHeights = useMemo(() => getBarHeights(peakEventTimes), [peakEventTimes]);
  const recommendations = dashboardData?.aiAnalytics?.recommendations?.length
    ? dashboardData.aiAnalytics.recommendations
    : FALLBACK_RECOMMENDATIONS;

  function togglePin(i) {
    setPinned((prev) => {
      const next = new Set(prev);
      const wasPinned = next.has(i);
      if (wasPinned) next.delete(i);
      else next.add(i);
      showStatus(wasPinned ? "Recommendation unpinned" : "Recommendation pinned");
      return next;
    });
  }

  return (
    <section className="view" id="analyticsView">
      <div className="header-row">
        <h1 id="pageTitle">Analytics</h1>
        <div className="chip-row" id="chipRow">
          {CHIPS.map((label) => (
            <button
              key={label}
              type="button"
              className={`chip${range === label ? " active" : ""}`}
              data-range={label}
              onClick={() => {
                setRange(label);
                showStatus(`Range: ${label}`);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid">
        {stats.map((s) => (
          <article
            key={s.label}
            className="card stat"
            data-action={s.action}
            onClick={() => showStatus(s.action)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                showStatus(s.action);
              }
            }}
          >
            <div className="stat-top">
              <span>{s.label}</span>
              <span className="trend up">{s.trend}</span>
            </div>
            <p className="value">{s.value}</p>
            <small className="muted">{s.hint}</small>
          </article>
        ))}

        <article className="card two-col">
          <div className="panel-title">
            <h2>Key Events Insights</h2>
          </div>
          {eventInsights.length ? (
            eventInsights.map(([name, w, n]) => (
              <div key={name} className="metric-row">
                <span>{name}</span>
                <div className="progress">
                  <div className="bar" style={{ width: w }} />
                </div>
                <span>{n}</span>
              </div>
            ))
          ) : (
            <p className="muted">No attendance data yet.</p>
          )}
        </article>

        <article className="card two-col">
          <div className="panel-title">
            <h2>Peak Event Times</h2>
          </div>
          {peakTimes.length ? (
            peakTimes.map(([name, w, n]) => (
              <div key={name} className="metric-row">
                <span>{name}</span>
                <div className="progress">
                  <div className="bar" style={{ width: w }} />
                </div>
                <span>{n}</span>
              </div>
            ))
          ) : (
            <p className="muted">No tap time data yet.</p>
          )}
        </article>

        <article className="card chart-panel">
          <div className="panel-title">
            <h2>Attendance by Time</h2>
          </div>
          <div className="mini-chart">
            {(barHeights.length ? barHeights : [18, 18, 18]).map((h, i) => (
              <div key={i} className="mini-bar" style={{ height: `${h}%` }} />
            ))}
            <div className="x-labels">
              {(peakEventTimes.length ? peakEventTimes.slice(0, 9).map((row) => row.label) : ["No", "Data", "Yet"]).map(
                (label) => (
                  <span key={label}>{label}</span>
                ),
              )}
            </div>
          </div>
        </article>

        <article className="card ai-panel">
          <div className="panel-title">
            <h2>Smart Recommendations</h2>
          </div>
          <div className="ai-list">
            {recommendations.map((p, i) => (
              <div key={p.title} className="ai-item">
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
                <button
                  className={`pin${pinned.has(i) ? " active" : ""}`}
                  type="button"
                  aria-label="Pin recommendation"
                  aria-pressed={pinned.has(i)}
                  onClick={() => togglePin(i)}
                >
                  Pin
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
