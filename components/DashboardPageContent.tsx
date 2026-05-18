'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  type AttendanceRecord,
  type RegisteredEvent,
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  isAttendanceComplete,
  readRegisteredEvents,
  readUserAttendanceRecords,
} from '@/lib/attendance';
import { canOrganizeEvents, readBrowseEvents, readOrganizedEvents, type FrontendEvent } from '@/lib/dc-events';
import { readNotifications, type DcNotification } from '@/lib/notifications';

const HOME_SAVED_EVENTS_KEY = 'dcspaceHomeSavedEvents';
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type AnalyticsMode = 'hours' | 'month';
type BreakdownMode = 'day' | 'week' | 'month';
type BreakdownKey = 'complete' | 'incomplete' | 'late' | 'early';

const breakdownItems: Array<{ key: BreakdownKey; label: string; color: string }> = [
  { key: 'complete', label: 'Completed Attendance', color: '#6B7DF2' },
  { key: 'incomplete', label: 'Incomplete Attendance', color: '#2CA6DE' },
  { key: 'late', label: 'Late Attendance', color: '#F5D29D' },
  { key: 'early', label: 'Early Time-Out', color: '#156884' },
];

function readSavedEventIds() {
  try {
    return JSON.parse(window.localStorage.getItem(HOME_SAVED_EVENTS_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function getEventDate(event: RegisteredEvent) {
  if (!event.month || !event.day || !event.year) {
    return null;
  }

  const eventDate = new Date(`${event.month} ${event.day}, ${event.year}`);

  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }

  eventDate.setHours(0, 0, 0, 0);
  return eventDate;
}

function getDaysUntil(event: RegisteredEvent) {
  const eventDate = getEventDate(event);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!eventDate) {
    return null;
  }

  return Math.ceil((eventDate.getTime() - today.getTime()) / 86_400_000);
}

function getEventTime(event: RegisteredEvent) {
  const parts = event.dateTime?.split(',') || [];

  return parts.at(-1)?.trim() || 'Event Time';
}

function getDateDisplay(event?: RegisteredEvent) {
  if (!event) {
    return 'Event Date';
  }

  return [event.month, event.day, event.year].filter(Boolean).join(' ');
}

function getTodayDisplay() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function getCountdownDisplay(event?: RegisteredEvent) {
  if (!event) {
    return 'Date Countdown';
  }

  const daysUntil = getDaysUntil(event);

  if (daysUntil === null) {
    return 'Date Countdown';
  }

  if (daysUntil <= 0) {
    return 'Today';
  }

  return `${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

function getTapMinutes(time?: string) {
  if (!time) {
    return null;
  }

  const parsedTime = new Date(`January 1, 2026 ${time}`);

  if (Number.isNaN(parsedTime.getTime())) {
    return null;
  }

  return parsedTime.getHours() * 60 + parsedTime.getMinutes();
}

function getRecordMinutes(record?: AttendanceRecord) {
  const pairs = record?.taps?.length
    ? record.taps
    : record?.tapIn || record?.tapOut
      ? [{ tapIn: record.tapIn, tapOut: record.tapOut }]
      : [];

  return pairs.reduce((total, pair) => {
    const tapInMinutes = getTapMinutes(pair.tapIn);
    const tapOutMinutes = getTapMinutes(pair.tapOut);

    if (tapInMinutes === null || tapOutMinutes === null) {
      return total;
    }

    return total + Math.max(0, tapOutMinutes - tapInMinutes);
  }, 0);
}

function getMonthIndex(event: RegisteredEvent) {
  const eventDate = getEventDate(event);

  return eventDate ? eventDate.getMonth() : -1;
}

export function DashboardPageContent() {
  const [firstName, setFirstName] = useState('User');
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<FrontendEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [savedEvents, setSavedEvents] = useState<RegisteredEvent[]>([]);
  const [notifications, setNotifications] = useState<DcNotification[]>([]);
  const [isOfficer, setIsOfficer] = useState(false);
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>('hours');
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('day');
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownKey | null>(null);
  const [selectedCourseEventId, setSelectedCourseEventId] = useState('');

  useEffect(() => {
    const refreshDashboard = () => {
      const user = getCurrentAttendanceUser();

      setFirstName(user.firstName || 'User');
      setRegisteredEvents(readRegisteredEvents());
      setOrganizedEvents(readOrganizedEvents());
      setAttendanceRecords(readUserAttendanceRecords(user));
      setIsOfficer(canOrganizeEvents());
      const nextSavedEventIds = readSavedEventIds();
      const browseEvents = readBrowseEvents();

      setSavedEventIds(nextSavedEventIds);
      setSavedEvents(
        nextSavedEventIds
          .map((eventId) => browseEvents.find((event) => event.id === eventId))
          .filter(Boolean) as RegisteredEvent[],
      );
      setNotifications(readNotifications());
    };

    refreshDashboard();
    window.addEventListener('pageshow', refreshDashboard);
    window.addEventListener('storage', refreshDashboard);
    window.addEventListener('dcspace-events-updated', refreshDashboard);
    window.addEventListener('dcspace-registered-events-updated', refreshDashboard);
    window.addEventListener('dcspace-attendance-updated', refreshDashboard);
    window.addEventListener('dcspace-notifications-updated', refreshDashboard);

    return () => {
      window.removeEventListener('pageshow', refreshDashboard);
      window.removeEventListener('storage', refreshDashboard);
      window.removeEventListener('dcspace-events-updated', refreshDashboard);
      window.removeEventListener('dcspace-registered-events-updated', refreshDashboard);
      window.removeEventListener('dcspace-attendance-updated', refreshDashboard);
      window.removeEventListener('dcspace-notifications-updated', refreshDashboard);
    };
  }, []);

  const latestUpcomingEvent = useMemo(
    () =>
      registeredEvents
        .filter((event) => {
          const daysUntil = getDaysUntil(event);
          return daysUntil !== null && daysUntil >= 0;
        })
        .sort((firstEvent, secondEvent) => (getDaysUntil(firstEvent) ?? 9999) - (getDaysUntil(secondEvent) ?? 9999))[0],
    [registeredEvents],
  );

  const certificatesEarned = useMemo(
    () =>
      registeredEvents.filter((event) => {
        const eventId = getRegisteredEventId(event);
        return getCertificateStatus(attendanceRecords[eventId], event) === 'Download';
      }).length,
    [attendanceRecords, registeredEvents],
  );

  const upcomingSoonCount = useMemo(
    () =>
      registeredEvents.filter((event) => {
        const daysUntil = getDaysUntil(event);
        return daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;
      }).length,
    [registeredEvents],
  );

  const monthlyHours = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);

    registeredEvents.forEach((event) => {
      const monthIndex = getMonthIndex(event);
      const record = attendanceRecords[getRegisteredEventId(event)];

      if (monthIndex >= 0) {
        values[monthIndex] += getRecordMinutes(record) / 60;
      }
    });

    return values;
  }, [attendanceRecords, registeredEvents]);

  const monthlyActivity = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);

    registeredEvents.forEach((event) => {
      const monthIndex = getMonthIndex(event);

      if (monthIndex >= 0) {
        values[monthIndex] += 1;
      }
    });

    return values;
  }, [registeredEvents]);

  const chartValues = analyticsMode === 'hours' ? monthlyHours : monthlyActivity;
  const chartMax = Math.max(...chartValues, 1);
  const recentActivity = useMemo(() => {
    const joinedActivities = registeredEvents.slice(-2).map((event) => `Joined "${event.name || 'Event Name'}"`);
    const savedActivities = savedEvents.slice(-2).map((event) => `Bookmarked "${event.name || 'Event Name'}"`);
    const attendanceActivities = registeredEvents
      .filter((event) => isAttendanceComplete(attendanceRecords[getRegisteredEventId(event)]))
      .slice(-2)
      .map((event) => `Completed attendance requirement in "${event.name || 'Event Name'}"`);
    const certificateActivities = registeredEvents
      .filter((event) => getCertificateStatus(attendanceRecords[getRegisteredEventId(event)], event) === 'Download')
      .slice(-2)
      .map((event) => `Received certificate for "${event.name || 'Event Name'}"`);

    return [...joinedActivities, ...savedActivities, ...attendanceActivities, ...certificateActivities].slice(-4);
  }, [attendanceRecords, registeredEvents, savedEvents]);

  const notificationPreview = useMemo(() => {
    const upcomingEventAlerts = registeredEvents
      .filter((event) => {
        const daysUntil = getDaysUntil(event);
        return daysUntil !== null && daysUntil >= 1 && daysUntil <= 3;
      })
      .map((event) => `${event.name || 'Event Name'} starts ${getCountdownDisplay(event).toLowerCase()} away`);

    const certificateAlerts = registeredEvents
      .filter((event) => getCertificateStatus(attendanceRecords[getRegisteredEventId(event)], event) === 'Download')
      .map((event) => `Certificate ready for ${event.name || 'Event Name'}`);
    const attendanceAlerts = registeredEvents
      .filter((event) => isAttendanceComplete(attendanceRecords[getRegisteredEventId(event)]))
      .map((event) => `Attendance requirement completed for ${event.name || 'Event Name'}`);

    return [
      ...notifications.map((notification) => `${notification.title} ${notification.eventName}`),
      ...upcomingEventAlerts,
      ...certificateAlerts,
      ...attendanceAlerts,
    ].slice(0, 4);
  }, [attendanceRecords, notifications, registeredEvents]);

  const totalHours = monthlyHours.reduce((total, value) => total + value, 0);
  const activeMonthIndex = monthlyActivity.indexOf(Math.max(...monthlyActivity));
  const upcomingOrganizedEvent = useMemo(
    () =>
      organizedEvents
        .filter((event) => {
          const daysUntil = getDaysUntil(event);
          return daysUntil !== null && daysUntil >= 1 && daysUntil <= 3;
        })
        .sort((firstEvent, secondEvent) => (getDaysUntil(firstEvent) ?? 9999) - (getDaysUntil(secondEvent) ?? 9999))[0],
    [organizedEvents],
  );
  const ongoingOrganizedEvent = useMemo(
    () => organizedEvents.find((event) => getDaysUntil(event) === 0),
    [organizedEvents],
  );
  const ongoingRegisteredParticipants = ongoingOrganizedEvent
    ? registeredEvents.filter((event) => event.id === ongoingOrganizedEvent.id)
    : [];
  const ongoingRecords = ongoingRegisteredParticipants
    .map((event) => attendanceRecords[getRegisteredEventId(event)])
    .filter(Boolean);
  const currentAttendees = ongoingRecords.filter((record) => record.tapIn || record.taps?.some((tap) => tap.tapIn)).length;
  const participantsInside = ongoingRecords.filter((record) => {
    const taps = record.taps?.length ? record.taps : [{ tapIn: record.tapIn, tapOut: record.tapOut }];
    const lastTap = taps.at(-1);

    return Boolean(lastTap?.tapIn && !lastTap.tapOut);
  }).length;
  const attendanceCompleted = ongoingRegisteredParticipants.filter((event) =>
    isAttendanceComplete(attendanceRecords[getRegisteredEventId(event)]),
  ).length;
  const attendanceProgress = ongoingRegisteredParticipants.length
    ? Math.round((attendanceCompleted / ongoingRegisteredParticipants.length) * 100)
    : 0;
  const pendingEvents = organizedEvents.filter((event) => !event.status || ['created', 'pending'].includes(event.status.toLowerCase()));
  const approvedEvents = organizedEvents.filter((event) => event.status?.toLowerCase() === 'approved');
  const rejectedEvents = organizedEvents.filter((event) => event.status?.toLowerCase() === 'rejected');
  const organizedPassedEvents = organizedEvents.filter((event) => {
    const daysUntil = getDaysUntil(event);
    return daysUntil !== null && daysUntil < 0;
  });
  const selectedCourseEvent = organizedPassedEvents.find((event) => event.id === selectedCourseEventId) || organizedPassedEvents[0];
  const courseRows = useMemo(() => {
    const rows = new Map<string, number>();
    const relevantEvents = selectedCourseEvent
      ? registeredEvents.filter((event) => event.id === selectedCourseEvent.id)
      : registeredEvents.filter((event) => organizedEvents.some((organizedEvent) => organizedEvent.id === event.id));

    relevantEvents.forEach((event) => {
      const course = event.organizer?.split('-')[0]?.trim() || getCurrentAttendanceUser().course || 'Course';
      rows.set(course, (rows.get(course) || 0) + 1);
    });

    return Array.from(rows.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 3);
  }, [organizedEvents, registeredEvents, selectedCourseEvent]);
  const topEvents = organizedPassedEvents
    .map((event) => ({
      name: event.name || 'Event Name',
      count: registeredEvents.filter((registeredEvent) => registeredEvent.id === event.id).length,
    }))
    .sort((first, second) => first.count - second.count)
    .slice(0, 5);
  const breakdownCounts = {
    complete: organizedEvents.reduce((count, event) => {
      const eventRegistrations = registeredEvents.filter((registeredEvent) => registeredEvent.id === event.id);
      return count + eventRegistrations.filter((registeredEvent) => isAttendanceComplete(attendanceRecords[getRegisteredEventId(registeredEvent)])).length;
    }, 0),
    incomplete: organizedEvents.reduce((count, event) => {
      const eventRegistrations = registeredEvents.filter((registeredEvent) => registeredEvent.id === event.id);
      return count + eventRegistrations.filter((registeredEvent) => !isAttendanceComplete(attendanceRecords[getRegisteredEventId(registeredEvent)])).length;
    }, 0),
    late: 0,
    early: 0,
  };
  const breakdownTotal = Math.max(
    breakdownCounts.complete + breakdownCounts.incomplete + breakdownCounts.late + breakdownCounts.early,
    0,
  );
  const pieSegments = breakdownItems.map((item) => ({
    ...item,
    value: breakdownCounts[item.key],
    percent: breakdownTotal ? Math.round((breakdownCounts[item.key] / breakdownTotal) * 100) : 0,
  }));
  const totalBreakdownPercent = breakdownTotal ? pieSegments.reduce((total, segment) => total + segment.percent, 0) : 0;
  let pieStart = 0;
  const pieGradient = breakdownTotal
    ? pieSegments
        .map((segment) => {
          const end = pieStart + segment.percent;
          const value = `${segment.color} ${pieStart}% ${end}%`;
          pieStart = end;
          return value;
        })
        .join(', ')
    : '#1C1D21 0% 100%';

  if (isOfficer) {
    return (
      <section className="dashboard-page dashboard-page--officer">
        <div className="dashboard-shell dashboard-shell--officer">
          <h2>
            Hello, <span>{firstName}!</span>
          </h2>

          <p className="dashboard-latest-label">Upcoming Organized Event:</p>
          <section className={`dashboard-upcoming-banner${upcomingOrganizedEvent ? '' : ' is-empty'}`} aria-label="Upcoming organized event">
            {upcomingOrganizedEvent ? (
              <>
                <span>{upcomingOrganizedEvent.name || 'Event Name'}</span>
                <span>{getDateDisplay(upcomingOrganizedEvent)}</span>
                <span>{getEventTime(upcomingOrganizedEvent)}</span>
                <span>{registeredEvents.filter((event) => event.id === upcomingOrganizedEvent.id).length} Registered</span>
                <span>{getCountdownDisplay(upcomingOrganizedEvent)}</span>
              </>
            ) : (
              <span>No Upcoming Organized Event</span>
            )}
          </section>

          <section className="dashboard-summary" aria-label="Officer dashboard summary">
            <article className="dashboard-summary-card dashboard-summary-card--joined">
              <h3>Events Joined</h3>
              <p>{registeredEvents.length}</p>
            </article>
            <article className="dashboard-summary-card dashboard-summary-card--saved">
              <h3>Saved Events</h3>
              <p>{savedEventIds.length}</p>
            </article>
            <article className="dashboard-summary-card dashboard-summary-card--certificates">
              <h3>Certificates Earned</h3>
              <p>{certificatesEarned}</p>
            </article>
            <article className="dashboard-summary-card dashboard-summary-card--upcoming">
              <h3>Events Organized</h3>
              <p>{organizedEvents.length}</p>
            </article>
          </section>

          <section className="officer-top-grid">
            <article className="dashboard-panel officer-status">
              <header>
                <div>
                  <h3>Ongoing Event Status</h3>
                  {ongoingOrganizedEvent && <p className="officer-status__event">{ongoingOrganizedEvent.name}</p>}
                  {ongoingOrganizedEvent && <p className="officer-status__venue">{ongoingOrganizedEvent.venue}</p>}
                </div>
                <p>{`As of ${ongoingOrganizedEvent ? getDateDisplay(ongoingOrganizedEvent) : getTodayDisplay()}`}</p>
              </header>
              {ongoingOrganizedEvent ? (
                <div className="officer-status__list">
                  <div>
                    <span />
                    <strong>Current Attendees</strong>
                    <p>{currentAttendees} attendees checked in</p>
                  </div>
                  <div>
                    <span />
                    <strong>Participants Currently Inside</strong>
                    <p>{participantsInside} students currently inside the venue</p>
                  </div>
                  <div>
                    <span />
                    <strong>Attendance Progress</strong>
                    <p>{attendanceCompleted} / {ongoingRegisteredParticipants.length} expected attendees</p>
                  </div>
                  <div>
                    <span />
                    <strong>Attendance Completion Rate</strong>
                    <p>{attendanceProgress}% attendance completion</p>
                  </div>
                </div>
              ) : (
                <p className="officer-empty">No Ongoing Event</p>
              )}
            </article>

            <article className="dashboard-panel officer-approvals">
              <h3>Pending Event Approvals</h3>
              {[
                ['Pending', pendingEvents],
                ['Approved', approvedEvents],
                ['Rejected', rejectedEvents],
              ].map(([label, events]) => (
                <section key={label as string}>
                  <h4>{label as string}</h4>
                  {(events as FrontendEvent[]).length ? (
                    (events as FrontendEvent[]).slice(0, 3).map((event) => (
                      <p key={event.id}>
                        <span />
                        {event.name || 'Event Name'}
                      </p>
                    ))
                  ) : (
                    <small>{`No events ${(label as string).toLowerCase()} yet.`}</small>
                  )}
                </section>
              ))}
            </article>

            <article className="dashboard-panel officer-actions">
              <h3>Quick Actions</h3>
              <a href="/events-organized">
                <Image src="/svg icons for user-dashboard/plus-square-fill.svg" width={18} height={18} alt="" />
                Create Event
              </a>
              <a href="/attendance">
                <Image src="/svg icons for user-dashboard/view-attendance-icon.svg" width={18} height={18} alt="" />
                View Attendance
              </a>
              <button type="button">
                <Image src="/svg icons for user-dashboard/close-registration.svg" width={18} height={18} alt="" />
                Close Registration
              </button>
              <button type="button">
                <Image src="/svg icons for user-dashboard/submit-feedback-icon.svg" width={18} height={18} alt="" />
                Submit Feedback
              </button>
            </article>
          </section>

          <h2 className="officer-section-title">Attendance Analytics</h2>
          <section className="officer-analytics-grid">
            <article className="dashboard-panel officer-breakdown">
              <header>
                <h3>Attendance Breakdown</h3>
                <div className="officer-breakdown__filters">
                  {(['day', 'week', 'month'] as BreakdownMode[]).map((mode) => (
                    <button
                      className={breakdownMode === mode ? 'is-active' : ''}
                      type="button"
                      onClick={() => setBreakdownMode(mode)}
                      key={mode}
                    >
                      {mode}
                    </button>
                  ))}
                  <span style={{ transform: `translateX(${(['day', 'week', 'month'] as BreakdownMode[]).indexOf(breakdownMode) * 100}%)` }} />
                </div>
              </header>
              <div className="officer-breakdown__body">
                <button
                  className={`officer-pie${selectedBreakdown ? ` is-${selectedBreakdown}` : ''}`}
                  type="button"
                  style={{ background: `conic-gradient(${pieGradient})` }}
                  onClick={() => setSelectedBreakdown((current) => (current ? null : 'complete'))}
                >
                  <span>{`${totalBreakdownPercent}%`}</span>
                </button>
                <div className="officer-breakdown__legend">
                  {pieSegments.map((segment) => (
                    <button type="button" onClick={() => setSelectedBreakdown(segment.key)} key={segment.key}>
                      <span style={{ background: segment.color }} />
                      {segment.label}
                      <strong>{segment.percent}%</strong>
                    </button>
                  ))}
                </div>
              </div>
              {!breakdownTotal && <p className="officer-empty officer-empty--breakdown">No records yet</p>}
            </article>

            <article className="dashboard-panel officer-courses">
              <header>
                <h3>Top Participating Courses</h3>
                <select value={selectedCourseEvent?.id || ''} onChange={(event) => setSelectedCourseEventId(event.target.value)}>
                  <option value="">Pick Event Name</option>
                  {organizedPassedEvents.map((event) => (
                    <option value={event.id} key={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </header>
              {(courseRows.length ? courseRows : [{ course: 'No records yet', count: 0 }]).map((row) => (
                <p key={row.course}>
                  <span />
                  {row.course}
                  <strong>{row.count} Attendees</strong>
                </p>
              ))}
            </article>
          </section>

          <article className="dashboard-panel officer-top-events">
            <h3>Top Events</h3>
            {(topEvents.length ? topEvents : [{ name: 'No records yet', count: 0 }]).map((event) => (
              <p key={event.name}>
                <span />
                {event.name}
                <strong>{event.count} Attendees</strong>
              </p>
            ))}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <h2>
          Hello, <span>{firstName}!</span>
        </h2>

        <p className="dashboard-latest-label">Latest Upcoming Event:</p>
        <section className={`dashboard-upcoming-banner${latestUpcomingEvent ? '' : ' is-empty'}`} aria-label="Latest upcoming event">
          {latestUpcomingEvent ? (
            <>
              <span>{latestUpcomingEvent.name || 'Event Name'}</span>
              <span>{getDateDisplay(latestUpcomingEvent)}</span>
              <span>{getEventTime(latestUpcomingEvent)}</span>
              <span>{getCountdownDisplay(latestUpcomingEvent)}</span>
            </>
          ) : (
            <span>No Latest Upcoming Event</span>
          )}
        </section>

        <section className="dashboard-summary" aria-label="Dashboard summary">
          <article className="dashboard-summary-card dashboard-summary-card--joined">
            <h3>Events Joined</h3>
            <p>{registeredEvents.length}</p>
          </article>
          <article className="dashboard-summary-card dashboard-summary-card--saved">
            <h3>Saved Events</h3>
            <p>{savedEventIds.length}</p>
          </article>
          <article className="dashboard-summary-card dashboard-summary-card--certificates">
            <h3>Certificates Earned</h3>
            <p>{certificatesEarned}</p>
          </article>
          <article className="dashboard-summary-card dashboard-summary-card--upcoming">
            <h3>Upcoming Events</h3>
            <p>{upcomingSoonCount}</p>
          </article>
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-panel dashboard-analytics">
            <header className="dashboard-panel__header">
              <h3>Attendance Analytics</h3>
              <div className="dashboard-analytics__filters" aria-label="Attendance analytics filters">
                <button
                  className={analyticsMode === 'hours' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setAnalyticsMode('hours')}
                >
                  <span className="dashboard-filter-dot dashboard-filter-dot--hours" />
                  Total Hours Attended
                </button>
                <button
                  className={analyticsMode === 'month' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setAnalyticsMode('month')}
                >
                  <span className="dashboard-filter-dot dashboard-filter-dot--month" />
                  Most Active Month
                </button>
              </div>
            </header>

            <div className={`dashboard-chart dashboard-chart--${analyticsMode}`} aria-label="Attendance chart">
              {chartValues.map((value, index) => (
                <div className="dashboard-chart__bar-wrap" key={monthLabels[index]}>
                  <span
                    className={`dashboard-chart__bar${value > 0 && value === chartMax ? ' is-peak' : ''}`}
                    style={{ height: `${Math.max(8, (value / chartMax) * 100)}%` }}
                    title={`${monthLabels[index]}: ${analyticsMode === 'hours' ? `${value.toFixed(1)} hrs` : `${value} events`}`}
                  />
                  <small>{monthLabels[index]}</small>
                </div>
              ))}
            </div>
            <p className="dashboard-chart__summary">
              {analyticsMode === 'hours'
                ? `${totalHours.toFixed(1)} total hours attended`
                : `${monthLabels[Math.max(0, activeMonthIndex)]} is your most active month`}
            </p>
          </article>

          <article className="dashboard-panel dashboard-feed">
            <h3>Recent Activity</h3>
            <ul>
              {(recentActivity.length ? recentActivity : ['No recent activity yet']).map((activity, index) => (
                <li key={`${activity}-${index}`}>
                  <span />
                  {activity}
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-panel dashboard-feed dashboard-feed--notifications">
            <h3>Notification Preview</h3>
            <ul>
              {(notificationPreview.length ? notificationPreview : ['No notifications yet']).map((notification, index) => (
                <li key={`${notification}-${index}`}>
                  <span />
                  {notification}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </section>
  );
}
