"use client";

import { useShowStatus } from "@/contexts/ShowStatusContext";

export function SettingsView() {
  const showStatus = useShowStatus();

  return (
    <section className="view settings-view" id="settingsView">
      <div className="header-row">
        <h1>Account Settings</h1>
      </div>

      <section className="profile-card">
        <div className="settings-block">
          <h2>Password</h2>
          <div className="profile-grid">
            <label className="profile-field">
              <span>Current password</span>
              <input type="password" placeholder="Enter current password" />
            </label>
            <label className="profile-field">
              <span>New password</span>
              <input type="password" placeholder="Enter new password" />
            </label>
          </div>
          <div className="profile-actions">
            <button className="btn-primary" type="button" onClick={() => showStatus("Password updated")}>
              Update Password
            </button>
          </div>
        </div>

        <div className="settings-block">
          <h2>Preferences</h2>
          <label className="settings-toggle">
            <input type="checkbox" defaultChecked />
            <span>Email notifications</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" defaultChecked />
            <span>Show alert toasts in admin</span>
          </label>
          <div className="profile-actions">
            <button className="btn-soft" type="button" onClick={() => showStatus("Preferences reset")}>
              Reset
            </button>
            <button className="btn-primary" type="button" onClick={() => showStatus("Preferences saved")}>
              Save Preferences
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
