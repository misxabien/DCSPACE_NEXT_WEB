'use client';

import Image from 'next/image';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { canOrganizeEvents, readOrganizedEvents } from '@/lib/dc-events';
import {
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
} from '@/lib/attendance';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

type ProfileImageFit = {
  zoom: number;
  x: number;
  y: number;
};

function getDisplayValue(value?: string) {
  return value && value !== 'Not provided' ? value : 'Not available';
}

function getInitials(firstName?: string, lastName?: string, fallback?: string) {
  const firstInitial = firstName?.trim().charAt(0) || '';
  const lastInitial = lastName?.trim().charAt(0) || '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || fallback?.trim().slice(0, 2).toUpperCase() || 'DC';
}

function readImageFit(storageKey: string): ProfileImageFit {
  if (typeof window === 'undefined') return { zoom: 1, x: 0, y: 0 };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as Partial<ProfileImageFit>;

    return {
      zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1,
      x: typeof parsed.x === 'number' ? parsed.x : 0,
      y: typeof parsed.y === 'number' ? parsed.y : 0,
    };
  } catch {
    return { zoom: 1, x: 0, y: 0 };
  }
}

function profileImageStyle(fit: ProfileImageFit): CSSProperties {
  return {
    transform: `translate(${fit.x}%, ${fit.y}%) scale(${fit.zoom})`,
  };
}

function dispatchProfileUpdate() {
  window.dispatchEvent(new CustomEvent('dcspace-profile-updated'));
}

export function MyProfileContent() {
  const [user, setUser] = useState<ReturnType<typeof getCurrentAttendanceUser> | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<ReturnType<typeof readRegisteredEvents>>([]);
  const [organizedEvents, setOrganizedEvents] = useState<ReturnType<typeof readOrganizedEvents>>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, ReturnType<typeof readUserAttendanceRecords>[string]>>({});
  const [canViewOrganizedEvents, setCanViewOrganizedEvents] = useState(false);
  const [profilePhotoImage, setProfilePhotoImage] = useState('');
  const [profilePhotoFit, setProfilePhotoFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [profileCoverImage, setProfileCoverImage] = useState('');
  const [profileCoverFit, setProfileCoverFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [draftPhotoImage, setDraftPhotoImage] = useState('');
  const [draftPhotoFit, setDraftPhotoFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });
  const [draftCoverImage, setDraftCoverImage] = useState('');
  const [draftCoverFit, setDraftCoverFit] = useState<ProfileImageFit>({ zoom: 1, x: 0, y: 0 });

  useEffect(() => {
    const refreshProfile = () => {
      const currentUser = getCurrentAttendanceUser();
      const canOrganize = canOrganizeEvents();

      setUser(currentUser);
      setRegisteredEvents(readRegisteredEvents());
      setAttendanceRecords(readUserAttendanceRecords(currentUser));
      setCanViewOrganizedEvents(canOrganize);
      setOrganizedEvents(canOrganize ? readOrganizedEvents() : []);
      setProfilePhotoImage(window.localStorage.getItem('dcspaceProfilePhotoImage') || '');
      setProfilePhotoFit(readImageFit('dcspaceProfilePhotoFit'));
      setProfileCoverImage(window.localStorage.getItem('dcspaceProfileCoverImage') || '');
      setProfileCoverFit(readImageFit('dcspaceProfileCoverFit'));
    };

    refreshProfile();
    window.addEventListener('pageshow', refreshProfile);
    window.addEventListener('storage', refreshProfile);
    window.addEventListener('dcspace-events-updated', refreshProfile);
    window.addEventListener('dcspace-registered-events-updated', refreshProfile);
    window.addEventListener('dcspace-profile-updated', refreshProfile);

    return () => {
      window.removeEventListener('pageshow', refreshProfile);
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener('dcspace-events-updated', refreshProfile);
      window.removeEventListener('dcspace-registered-events-updated', refreshProfile);
      window.removeEventListener('dcspace-profile-updated', refreshProfile);
    };
  }, []);

  const attendedEvents = useMemo(() => {
    return registeredEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      return attendanceRecords[eventId];
    });
  }, [attendanceRecords, registeredEvents]);

  const certificateEvents = useMemo(() => {
    return attendedEvents.filter((event) => {
      const eventId = getRegisteredEventId(event);
      const record = attendanceRecords[eventId];
      return getCertificateStatus(record) === 'Download';
    });
  }, [attendanceRecords, attendedEvents]);

  const recentActivities = useMemo(() => {
    const activities = [
      ...attendedEvents.slice(-2).map((event) => `Joined ${event.eventName}`),
      ...certificateEvents.slice(-1).map((event) => `Received certificate for ${event.eventName}`),
    ];

    return activities.length ? activities.slice(-4).reverse() : ['No recent activity yet'];
  }, [attendedEvents, certificateEvents]);

  const fullName = `${getDisplayValue(user?.firstName)} ${getDisplayValue(user?.lastName)}`.replace(/Not available/g, '').trim() || 'User Name';
  const initials = getInitials(user?.firstName, user?.lastName, user?.studentEmail);
  const hasOrganizationAccess = Boolean(user?.organizationPart?.trim() && canViewOrganizedEvents);

  const saveProfilePhoto = () => {
    if (!draftPhotoImage) return;

    window.localStorage.setItem('dcspaceProfilePhotoImage', draftPhotoImage);
    window.localStorage.setItem('dcspaceProfilePhotoFit', JSON.stringify(draftPhotoFit));
    setProfilePhotoImage(draftPhotoImage);
    setProfilePhotoFit(draftPhotoFit);
    setDraftPhotoImage('');
    dispatchProfileUpdate();
  };

  const saveProfileCover = () => {
    if (!draftCoverImage) return;

    window.localStorage.setItem('dcspaceProfileCoverImage', draftCoverImage);
    window.localStorage.setItem('dcspaceProfileCoverFit', JSON.stringify(draftCoverFit));
    setProfileCoverImage(draftCoverImage);
    setProfileCoverFit(draftCoverFit);
    setDraftCoverImage('');
    dispatchProfileUpdate();
  };

  const handleImageUpload = (file: File | undefined, target: 'photo' | 'cover') => {
    if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      const defaultFit = { zoom: 1, x: 0, y: 0 };

      if (target === 'photo') {
        setDraftPhotoImage(reader.result);
        setDraftPhotoFit(defaultFit);
      } else {
        setDraftCoverImage(reader.result);
        setDraftCoverFit(defaultFit);
      }
    };
    reader.readAsDataURL(file);
  };

  const displayedPhotoImage = draftPhotoImage || profilePhotoImage;
  const displayedPhotoFit = draftPhotoImage ? draftPhotoFit : profilePhotoFit;
  const displayedCoverImage = draftCoverImage || profileCoverImage;
  const displayedCoverFit = draftCoverImage ? draftCoverFit : profileCoverFit;

  return (
    <main className="main--profile">
      <section className={`profile-cover${displayedCoverImage ? ' has-cover-image' : ''}`}>
        {displayedCoverImage && (
          <Image className="profile-cover__image" src={displayedCoverImage} alt="" fill unoptimized style={profileImageStyle(displayedCoverFit)} />
        )}
        {draftCoverImage ? (
          <button className="profile-upload profile-upload--cover" type="button" onClick={saveProfileCover}>
            Save
          </button>
        ) : (
          <label className="profile-upload profile-upload--cover">
            Upload Photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              onChange={(event) => handleImageUpload(event.target.files?.[0], 'cover')}
            />
          </label>
        )}

        {draftCoverImage && (
          <ImageAdjustControls className="profile-photo-adjust--cover" fit={draftCoverFit} onChange={setDraftCoverFit} target="cover photo" />
        )}
      </section>

      <div className="profile-layout">
        <section className="profile-card profile-card--identity" aria-label="Profile details">
          <div className="profile-card__top">
            <div className="profile-avatar" aria-hidden="true">
              {displayedPhotoImage ? (
                <Image src={displayedPhotoImage} alt="" width={92} height={92} unoptimized style={profileImageStyle(displayedPhotoFit)} />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {draftPhotoImage ? (
              <button className="profile-upload" type="button" onClick={saveProfilePhoto}>
                Save
              </button>
            ) : (
              <label className="profile-upload">
                Upload Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  onChange={(event) => handleImageUpload(event.target.files?.[0], 'photo')}
                />
              </label>
            )}
          </div>

          {draftPhotoImage && <ImageAdjustControls fit={draftPhotoFit} onChange={setDraftPhotoFit} target="profile photo" />}

          <div className="profile-info-box">
            <ProfileField label="Your Name" value={fullName} />
            <ProfileField label="School Email" value={getDisplayValue(user?.studentEmail)} />
            <ProfileField label="Student Number" value={getDisplayValue(user?.studentNumber)} />
          </div>

          <div className="profile-info-box">
            <ProfileField label={`About ${getDisplayValue(user?.firstName)}`} value="" />
            <ProfileField label="Course" value={getDisplayValue(user?.course)} />
            <ProfileField label="School/Department" value={getDisplayValue(user?.school)} />
            <ProfileField label="Organization" value={getDisplayValue(user?.organizationPart)} />
            <ProfileField label="Organization Role" value={getDisplayValue(user?.organizationRole)} />
          </div>
        </section>

        <section className="profile-side" aria-label="Account summary">
          <div className="profile-info-box profile-statistics">
            <h2>Account Statistics</h2>
            <ProfileStat label="Events Attended" value={attendedEvents.length} />
            <ProfileStat label="Certificates Earned" value={certificateEvents.length} />
            {hasOrganizationAccess && <ProfileStat label="Events Organized" value={organizedEvents.length} />}
          </div>

          <div className="profile-info-box profile-activity">
            <h2>Recent Activity</h2>
            <ul>
              {recentActivities.map((activity) => (
                <li key={activity}>
                  <span aria-hidden="true" />
                  {activity}
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-info-box profile-verification">
            <h2>Account Verification</h2>
            <ProfileBadge label="Verified SDCA Account" value="Verify Now" />
            {user?.organizationPart?.trim() && <ProfileBadge label="Organization Officer/Member Verified" value="Verified" />}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [originalValue, setOriginalValue] = useState(value);
  const [draftValue, setDraftValue] = useState(value);
  const [fieldState, setFieldState] = useState<'view' | 'editing' | 'review'>('view');

  useEffect(() => {
    if (fieldState !== 'view') return;

    setDisplayValue(value);
    setOriginalValue(value);
    setDraftValue(value);
  }, [fieldState, value]);

  const handleEdit = () => {
    setOriginalValue(displayValue);
    setDraftValue(displayValue);
    setFieldState('editing');
  };

  const handleSave = () => {
    const nextValue = draftValue.trim();

    if (!nextValue) return;

    setDisplayValue(nextValue);
    setFieldState('review');
  };

  const handleUndo = () => {
    setDisplayValue(originalValue);
    setDraftValue(originalValue);
    setFieldState('view');
  };

  return (
    <div className="profile-field">
      <div>
        <strong>{label}</strong>
        {value && fieldState === 'editing' ? (
          <input
            type="text"
            value={draftValue}
            aria-label={`Edit ${label}`}
            onChange={(event) => setDraftValue(event.target.value)}
          />
        ) : (
          value && <span>{displayValue}</span>
        )}
      </div>
      {value && fieldState === 'view' && (
        <button type="button" onClick={handleEdit}>
          Edit
        </button>
      )}
      {value && fieldState === 'editing' && (
        <button type="button" onClick={handleSave}>
          Save
        </button>
      )}
      {value && fieldState === 'review' && (
        <span className="profile-field__review-actions">
          <button className="profile-field__undo" type="button" onClick={handleUndo}>
            Undo Changes
          </button>
          <button type="button" disabled>
            In Review
          </button>
        </span>
      )}
    </div>
  );
}

function ImageAdjustControls({
  className = '',
  fit,
  onChange,
  target,
}: {
  className?: string;
  fit: ProfileImageFit;
  onChange: (fit: ProfileImageFit) => void;
  target: string;
}) {
  return (
    <div className={`profile-photo-adjust${className ? ` ${className}` : ''}`} aria-label={`Adjust ${target}`}>
      <input
        type="range"
        aria-label={`Zoom ${target}`}
        min="1"
        max="2"
        step="0.05"
        value={fit.zoom}
        onChange={(event) => onChange({ ...fit, zoom: Number(event.target.value) })}
      />
      <input
        type="range"
        aria-label={`Move ${target} horizontally`}
        min="-25"
        max="25"
        step="1"
        value={fit.x}
        onChange={(event) => onChange({ ...fit, x: Number(event.target.value) })}
      />
      <input
        type="range"
        aria-label={`Move ${target} vertically`}
        min="-25"
        max="25"
        step="1"
        value={fit.y}
        onChange={(event) => onChange({ ...fit, y: Number(event.target.value) })}
      />
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="profile-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
