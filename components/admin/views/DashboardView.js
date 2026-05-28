"use client";

import { useEffect, useMemo, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const CHIPS = ["Weekly", "Monthly", "Quarterly"];

function formatCount(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString() : "0";
}

function normalizeRows(rows) {
  return Array.isArray(rows)
    ? rows
        .map((row) => ({
          label: typeof row?.label === "string" && row.label.trim() ? row.label : "Unknown",
          value: Number(row?.value ?? 0),
        }))
        .filter((row) => Number.isFinite(row.value))
    : [];
}

function normalizeChartDataset(chart) {
  const labels = Array.isArray(chart?.labels) ? chart.labels : [];
  const data = Array.isArray(chart?.datasets?.[0]?.data) ? chart.datasets[0].data : [];

  return labels
    .map((label, index) => ({
      label: typeof label === "string" && label.trim() ? label : "Unknown",
      value: Number(data[index] ?? 0),
    }))
    .filter((row) => Number.isFinite(row.value));
}

function normalizeRecommendations(rows) {
  return Array.isArray(rows)
    ? rows
        .map((row) => ({
          title: typeof row?.title === "string" ? row.title.trim() : "",
          body: typeof row?.body === "string" ? row.body.trim() : "",
        }))
        .filter((row) => row.title && row.body)
    : [];
}

function StatCard({ item, onOpen }) {
  return (
    <article
      className="card stat"
      data-action={item.action}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="stat-top">
        <span>{item.label}</span>
        <span className="trend up">Live</span>
      </div>
      <p className="value">{item.value}</p>
      <small className="muted">{item.hint}</small>
    </article>
  );
}

function MetricPanel({ title, rows, loading, emptyText }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 0);

  return (
    <article className="card two-col">
      <div className="panel-title">
        <h2>{title}</h2>
      </div>
      {rows.length > 0 ? (
        rows.map((row) => (
          <div key={row.label} className="metric-row">
            <span>{row.label}</span>
            <div className="progress">
              <div
                className="bar"
                style={{ width: `${maxValue ? (row.value / maxValue) * 100 : 0}%` }}
              />
            </div>
            <span>{formatCount(row.value)}</span>
          </div>
        ))
      ) : (
        <p className="muted">{loading ? "Loading live data..." : emptyText}</p>
      )}
    </article>
  );
}

export function DashboardView() {
  const showStatus = useShowStatus();
  const [range, setRange] = useState("Weekly");
  const [pinned, setPinned] = useState(() => new Set());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/dashboard", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load dashboard data");
        }

        setDashboard(await response.json());
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, []);

  const stats = useMemo(
    () => [
      {
        action: "Total Events opened",
        label: "Total Events",
        value: formatCount(dashboard?.totalEvents),
        hint: "From MongoDB events",
      },
      {
        action: "Attendees opened",
        label: "Attendees",
        value: formatCount(dashboard?.totalAttendees),
        hint: "From RFID attendance logs",
      },
      {
        action: "Certificates opened",
        label: "Certificates",
        value: formatCount(dashboard?.totalCertificates),
        hint: "Issued certificate records",
      },
      {
        action: "Organizations opened",
        label: "Organizations",
        value: formatCount(dashboard?.totalOrganizations),
        hint: "Distinct event organizations",
      },
    ],
    [dashboard],
  );

  const attendanceTrends = useMemo(() => {
    const aiRows = normalizeRows(dashboard?.aiAnalytics?.attendanceTrends);
    return aiRows.length ? aiRows : normalizeChartDataset(dashboard?.charts?.attendanceTrend);
  }, [dashboard]);

  const peakEventTimes = useMemo(() => {
    const aiRows = normalizeRows(dashboard?.aiAnalytics?.peakEventTimes);
    return aiRows.length ? aiRows : normalizeChartDataset(dashboard?.charts?.peakTimes);
  }, [dashboard]);

  const recommendations = useMemo(
    () => normalizeRecommendations(dashboard?.aiAnalytics?.recommendations),
    [dashboard],
  );

  const chartRows = useMemo(
    () => normalizeChartDataset(dashboard?.charts?.attendanceTrend),
    [dashboard],
  );

  const maxChart = Math.max(...chartRows.map((row) => row.value), 0);

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
        {stats.map((item) => (
          <StatCard key={item.label} item={item} onOpen={() => showStatus(item.action)} />
        ))}

        <MetricPanel
          title="Key Events Insights"
          rows={attendanceTrends}
          loading={loading}
          emptyText="No attendance data yet."
        />

        <MetricPanel
          title="Peak Event Times"
          rows={peakEventTimes}
          loading={loading}
          emptyText="No tap time data yet."
        />

        <article className="card chart-panel">
          <div className="panel-title">
            <h2>Attendance by Time</h2>
          </div>
          <div className="mini-chart">
            {chartRows.length > 0 ? (
              <>
                {chartRows.map((row) => (
                  <div
                    key={row.label}
                    className="mini-bar"
                    title={`${row.label}: ${formatCount(row.value)}`}
                    style={{ height: `${maxChart ? Math.max((row.value / maxChart) * 100, 8) : 8}%` }}
                  />
                ))}
                <div className="x-labels">
                  {chartRows.map((row) => (
                    <span key={row.label}>{row.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">{loading ? "Loading live data..." : "No chart data yet."}</p>
            )}
          </div>
        </article>

        <article className="card ai-panel">
          <div className="panel-title">
            <h2>Smart Recommendations</h2>
          </div>
          <div className="ai-list">
            {recommendations.length > 0 ? (
              recommendations.map((item, i) => (
                <div key={item.title} className="ai-item">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
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
              ))
            ) : (
              <div className="ai-item">
                <div>
                  <h3>{error ? "Dashboard data unavailable" : "No recommendations yet"}</h3>
                  <p>
                    {error ||
                      (loading
                        ? "Loading live dashboard data..."
                        : "Recommendations will appear after attendance records are available.")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
