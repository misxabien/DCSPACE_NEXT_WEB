"use client";

import { useShowStatus } from "@/contexts/ShowStatusContext";
import { signOut } from "next-auth/react";

export function ProfileView() {
  const showStatus = useShowStatus();

  return (
    <section className="view profile-view" id="profileView">
      <div className="header-row">
        <h1>My Profile</h1>
      </div>

      <section className="profile-card">
        <div className="profile-hero">
          <div className="profile-avatar" aria-hidden="true">
            AD
          </div>
          <div className="profile-identity">
            <h2>Admin User</h2>
            <p>admin@sdca.edu.ph</p>
            <span className="profile-role">System Administrator</span>
          </div>
        </div>

        <div className="profile-grid">
          <label className="profile-field">
            <span>First name</span>
            <input type="text" defaultValue="Admin" />
          </label>
          <label className="profile-field">
            <span>Last name</span>
            <input type="text" defaultValue="User" />
          </label>
          <label className="profile-field">
            <span>Contact number</span>
            <input type="text" defaultValue="+63 912 345 6789" />
          </label>
          <label className="profile-field">
            <span>Campus</span>
            <input type="text" defaultValue="Main Campus" />
          </label>
        </div>

        <div className="profile-actions">
          <button className="btn-soft" type="button" onClick={() => showStatus("Profile changes discarded")}>
            Cancel
          </button>
          <button className="btn-primary" type="button" onClick={() => showStatus("Profile updated")}>
            Save Changes
          </button>
        </div>

        <div className="settings-block" id="accountSettings">
          <h2>Account Settings</h2>
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

        <div className="profile-actions profile-actions--logout">
          <button
            className="btn-soft btn-soft-danger profile-logout-btn"
            type="button"
            onClick={() => {
              void signOut({ callbackUrl: "/admin/login" });
            }}
          >
            Log Out
          </button>
        </div>
      </section>
    </section>
  );
}
