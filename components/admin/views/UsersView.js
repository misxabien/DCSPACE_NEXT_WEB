"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { USERS } from "@/lib/admin/usersData";
import { useShowStatus } from "@/contexts/ShowStatusContext";

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function UsersView() {
  const showStatus = useShowStatus();
  const [rows, setRows] = useState(USERS);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [org, setOrg] = useState("all");
  const [openMenuEmail, setOpenMenuEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const skipStatusToast = useRef(true);
  const headerCheckboxRef = useRef(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const okKw =
        !k ||
        r.name.toLowerCase().includes(k) ||
        r.email.toLowerCase().includes(k) ||
        (r.course ?? "").toLowerCase().includes(k);
      const okRole = role === "all" || r.role === role;
      const okSt = statusFilter === "all" || r.status === statusFilter;
      const okOrg = org === "all" || r.org === org;
      return okKw && okRole && okSt && okOrg;
    });
  }, [rows, keyword, role, statusFilter, org]);

  const filteredSet = useMemo(
    () => new Set(filtered.map((u) => u.email)),
    [filtered]
  );

  /** Selection limited to rows visible with the current filter (bulk actions). */
  const effectiveSelected = useMemo(
    () => selectedEmails.filter((e) => filteredSet.has(e)),
    [selectedEmails, filteredSet]
  );
  const effectiveSelectedSet = useMemo(
    () => new Set(effectiveSelected),
    [effectiveSelected]
  );

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((u) => selectedEmails.includes(u.email));
  const someFilteredSelected =
    filtered.some((u) => selectedEmails.includes(u.email)) &&
    !allFilteredSelected;

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) {
      el.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  useEffect(() => {
    if (skipStatusToast.current) {
      skipStatusToast.current = false;
      return;
    }
    showStatus(`${filtered.length} user(s) shown`);
  }, [filtered.length, keyword, role, statusFilter, org, showStatus]);

  useEffect(() => {
    function closeMenus() {
      setOpenMenuEmail(null);
    }
    function onDoc(e) {
      if (!e.target.closest(".action-cell")) closeMenus();
    }
    window.addEventListener("resize", closeMenus);
    window.addEventListener("scroll", closeMenus, true);
    document.addEventListener("click", onDoc);
    return () => {
      window.removeEventListener("resize", closeMenus);
      window.removeEventListener("scroll", closeMenus, true);
      document.removeEventListener("click", onDoc);
    };
  }, []);

  function onDotsClick(e, email) {
    e.stopPropagation();
    setOpenMenuEmail((prev) => (prev === email ? null : email));
  }

  function toggleSelect(email) {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  function selectAllVisible() {
    if (allFilteredSelected) {
      const visible = new Set(filtered.map((u) => u.email));
      setSelectedEmails((prev) => prev.filter((e) => !visible.has(e)));
    } else {
      setSelectedEmails((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.add(u.email));
        return [...next];
      });
    }
  }

  function exportSelected() {
    const selectedUsers = rows.filter((u) =>
      effectiveSelectedSet.has(u.email)
    );
    if (selectedUsers.length === 0) {
      showStatus("Select users to export");
      return;
    }
    const header = [
      "Name",
      "Email",
      "Role",
      "Organization",
      "RFID",
      "Status",
      "Course",
      "Last Active",
    ];
    const lines = [
      header.map(csvEscape).join(","),
      ...selectedUsers.map((u) =>
        [
          csvEscape(u.name),
          csvEscape(u.email),
          csvEscape(u.roleLabel),
          csvEscape(u.org),
          csvEscape(u.rfid === "registered" ? "Active" : "Inactive"),
          csvEscape(u.status),
          csvEscape(u.course ?? ""),
          csvEscape(u.lastActive),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${selectedUsers.length} user(s)`);
  }

  function deleteSelected() {
    const toDelete = new Set(effectiveSelected);
    const n = toDelete.size;
    if (n === 0) {
      showStatus("Select users to delete");
      return;
    }
    if (
      !window.confirm(
        `Delete ${n} selected user(s)? This cannot be undone.`
      )
    ) {
      return;
    }
    setRows((prev) => prev.filter((r) => !toDelete.has(r.email)));
    setSelectedEmails((prev) => prev.filter((e) => !toDelete.has(e)));
    showStatus(`Deleted ${n} user(s)`);
  }

  return (
    <section className="view" id="usersView">
      <div className="header-row">
        <h1>User Management</h1>
      </div>

      <section className="users-shell">
        <div className="users-toolbar">
          <div className="search-row">
            <label className="search-wrap">
              <span>🔎</span>
              <input
                id="userSearch"
                type="search"
                placeholder="Search by name or email..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </label>
            <button
              className="btn-primary"
              id="addUserBtn"
              type="button"
              onClick={() => showStatus("Add User clicked")}
            >
              + Add User
            </button>
          </div>

          <div className="filter-row">
            <select
              className="users-select"
              id="filterRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">Role: All Roles</option>
              <option value="student">Student</option>
              <option value="organizer">Student Organizer</option>
            </select>
            <select
              className="users-select"
              id="filterStatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="users-select"
              id="filterOrg"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
            >
              <option value="all">Organization: All</option>
              <option value="Dormcode">Dormcode</option>
              <option value="Dormkcode">Dormkcode</option>
              <option value="Dormxcode">Dormxcode</option>
            </select>
            <button
              className="btn-soft"
              id="applyFilterBtn"
              type="button"
              onClick={() =>
                showStatus(`${filtered.length} user(s) shown`)
              }
            >
              Filter
            </button>
          </div>

          {effectiveSelected.length > 0 ? (
            <div
              className="users-bulk-bar"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                paddingTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#53493d",
                }}
              >
                {effectiveSelected.length} selected
              </span>
              <button
                className="btn-soft"
                type="button"
                onClick={exportSelected}
              >
                Export selected
              </button>
              <button
                className="btn-soft"
                type="button"
                onClick={deleteSelected}
                style={{
                  borderColor: "#e8a4a4",
                  color: "#9f2f2f",
                  background: "#fff5f5",
                }}
              >
                Delete selected
              </button>
              <button
                className="btn-soft"
                type="button"
                onClick={() => setSelectedEmails([])}
              >
                Clear selection
              </button>
            </div>
          ) : null}
        </div>

        <div className="table-wrap users-table-wrap">
          <table className="users-table">
            <colgroup>
              <col className="users-col-check" />
              <col className="users-col-name" />
              <col className="users-col-role" />
              <col className="users-col-org" />
              <col className="users-col-rfid" />
              <col className="users-col-status" />
              <col className="users-col-course" />
              <col className="users-col-actions" />
              <col className="users-col-options" />
            </colgroup>
            <thead>
              <tr>
                <th className="users-col-check">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    aria-label="Select all visible users"
                    checked={allFilteredSelected}
                    onChange={selectAllVisible}
                  />
                </th>
                <th className="users-col-name">Name / Email</th>
                <th className="users-col-role">Role</th>
                <th className="users-col-org">Organization</th>
                <th className="users-col-rfid">RFID</th>
                <th className="users-col-status">Status</th>
                <th className="users-col-course">Course</th>
                <th className="users-col-actions">Actions</th>
                <th className="users-col-options">Options</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              {filtered.map((u) => (
                <tr
                  key={u.email}
                  data-name={u.name}
                  data-email={u.email}
                  data-role={u.role}
                  data-status={u.status}
                  data-org={u.org}
                >
                  <td className="users-col-check">
                    <input
                      type="checkbox"
                      aria-label={`Select user ${u.name}`}
                      checked={selectedEmails.includes(u.email)}
                      onChange={() => toggleSelect(u.email)}
                    />
                  </td>
                  <td className="users-col-name">
                    <div className="users-name-email">
                      <span className="users-name">{u.name}</span>
                      <span className="users-email">{u.email}</span>
                    </div>
                  </td>
                  <td className="users-col-role">{u.roleLabel}</td>
                  <td className="users-col-org">{u.org}</td>
                  <td className="users-col-rfid">
                    <span
                      className={`rfid-tag ${
                        u.rfid === "registered" ? "active" : "inactive"
                      }`}
                    >
                      {u.rfid === "registered" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="users-col-status">
                    <button
                      className={`switch${u.status === "active" ? " on" : ""}`}
                      type="button"
                      aria-label="Toggle status"
                      onClick={() => {
                        setRows((prev) =>
                          prev.map((r) => {
                            if (r.email !== u.email) return r;
                            const nextOn = r.status !== "active";
                            return {
                              ...r,
                              status: nextOn ? "active" : "inactive",
                            };
                          })
                        );
                        showStatus(
                          u.status === "active" ? "User disabled" : "User enabled"
                        );
                      }}
                    />
                  </td>
                  <td className="users-col-course">{u.course ?? "—"}</td>
                  <td className="users-col-actions">
                    <span className="last-active">{u.lastActive}</span>
                  </td>
                  <td className="users-col-options action-cell">
                    <button
                      className="dots-btn"
                      type="button"
                      aria-label="Open user actions"
                      onClick={(e) => onDotsClick(e, u.email)}
                    >
                      ⋯
                    </button>
                    <div
                      className={`actions-menu${
                        openMenuEmail === u.email ? " open" : ""
                      }`}
                    >
                      <button
                        className="menu-action"
                        type="button"
                        onClick={() => {
                          showStatus(`Reset Password: ${u.name}`);
                          setOpenMenuEmail(null);
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        className="menu-action"
                        type="button"
                        onClick={() => {
                          showStatus(`Assign to Event: ${u.name}`);
                          setOpenMenuEmail(null);
                        }}
                      >
                        Assign to Event
                      </button>
                      <button
                        className="menu-action delete"
                        type="button"
                        onClick={() => {
                          showStatus(`Delete User: ${u.name}`);
                          setOpenMenuEmail(null);
                        }}
                      >
                        Delete User
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="users-toolbar users-footer">
          <div className="users-footer-inner">
            <span>
              Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of{" "}
              {filtered.length} entries
            </span>
            <span>Previous &nbsp; 10 &nbsp; Next</span>
          </div>
        </div>
      </section>
    </section>
  );
}
