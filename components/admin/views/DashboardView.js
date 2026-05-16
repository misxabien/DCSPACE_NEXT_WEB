"use client";

import { useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const CHIPS = ["Weekly", "Monthly", "Quarterly"];

const STATS = [
  {
    action: "Total Events opened",
    label: "Total Events",
    trend: "+12%",
    value: "320",
    hint: "Compared to last period",
  },
  {
    action: "Attendees opened",
    label: "Attendees",
    trend: "+18%",
    value: "1,685",
    hint: "Unique users attended",
  },
  {
    action: "Certificates opened",
    label: "Certificates",
    trend: "+16%",
    value: "1,563",
    hint: "Issued automatically",
  },
  {
    action: "Organizations opened",
    label: "Organizations",
    trend: "+14%",
    value: "23",
    hint: "Active partner schools",
  },
];

const INSIGHTS = [
  ["BSIT - DX", "100%", "135"],
  ["BMMA - RC", "76%", "102"],
  ["BACOMM - ADC", "74%", "100"],
  ["BMLS - LD", "70%", "95"],
  ["BS/BEED - GEG", "63%", "85"],
  ["BSTM - JTTC", "51%", "69"],
];

const ENGAGED = [
  ["BSIT - DX", "100%", "160"],
  ["BMMA - RC", "75%", "121"],
  ["BACOMM - ADC", "74%", "119"],
  ["BMLS - LD", "70%", "113"],
  ["BS/BEED - GEG", "63%", "101"],
  ["BSTM - JTTC", "51%", "82"],
];

const BAR_HEIGHTS = [42, 50, 54, 61, 58, 64, 69, 66, 76];

const PINS = [
  {
    title: "Best Time to Schedule",
    body: "Friday 4:00 PM currently has the highest attendance.",
  },
  {
    title: "Suggested Venue",
    body: "Use DRA Hall for events with expected large audiences.",
  },
  {
    title: "Target Audience",
    body: "BSIT students are most likely to attend this month.",
  },
  {
    title: "Conflict Warning",
    body: "Two events overlap on April 25 from 2:00 to 4:00 PM.",
  },
];

export function DashboardView() {
  const showStatus = useShowStatus();
  const [range, setRange] = useState("Weekly");
  const [pinned, setPinned] = useState(() => new Set());

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
        {STATS.map((s) => (
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
          {INSIGHTS.map(([name, w, n]) => (
            <div key={name} className="metric-row">
              <span>{name}</span>
              <div className="progress">
                <div className="bar" style={{ width: w }} />
              </div>
              <span>{n}</span>
            </div>
          ))}
        </article>

        <article className="card two-col">
          <div className="panel-title">
            <h2>Top Engaged Course</h2>
          </div>
          {ENGAGED.map(([name, w, n]) => (
            <div key={name} className="metric-row">
              <span>{name}</span>
              <div className="progress">
                <div className="bar" style={{ width: w }} />
              </div>
              <span>{n}</span>
            </div>
          ))}
        </article>

        <article className="card chart-panel">
          <div className="panel-title">
            <h2>Most Used Facilities</h2>
          </div>
          <div className="mini-chart">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="mini-bar"
                style={{ height: `${h}%` }}
              />
            ))}
            <div className="x-labels">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map(
                (m) => (
                  <span key={m}>{m}</span>
                )
              )}
            </div>
          </div>
        </article>

        <article className="card ai-panel">
          <div className="panel-title">
            <h2>Smart Recommendations</h2>
          </div>
          <div className="ai-list">
            {PINS.map((p, i) => (
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
                  📌
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
