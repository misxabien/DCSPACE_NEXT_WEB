'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { startTransition, useEffect, useState } from 'react';
import {
  getCertificateStatus,
  getCurrentAttendanceUser,
  getEventStatus,
  getRegisteredEventId,
  type AttendanceRecord,
  type RegisteredEvent,
  type UploadedRequirementFile,
} from '@/lib/attendance';
import { type FrontendEvent, SELECTED_BROWSE_EVENT_KEY } from '@/lib/dc-events';
import {
  deleteOrganizedEventFromBackend,
  HOME_SAVED_EVENTS_KEY,
  loadAttendanceRecords,
  loadBookmarkedEventIds,
  loadEventById,
  loadRegisteredEvents,
  registerEventForCurrentUser,
  toggleEventBookmark,
  userCanOrganize,
} from '@/lib/user-data';
const createEventIconBase = '/svg icons organized events page/svg icons create event form page';
const detailIcons = {
  date: `${createEventIconBase}/event-date-icon.svg`,
  time: `${createEventIconBase}/clock-fill-icon.svg`,
  venue: `${createEventIconBase}/location-icon.svg`,
  organizer: `${createEventIconBase}/host-icon.svg`,
  course: `${createEventIconBase}/course-icon.svg`,
  department: `${createEventIconBase}/department-icon.svg`,
  attendance: `${createEventIconBase}/clock-fill-icon.svg`,
  grace: `${createEventIconBase}/grace-period-icon.svg`,
  files: `${createEventIconBase}/required-file-icon.svg`,
};

const emptyEventDetails: FrontendEvent = {
  id: '',
  name: '',
  month: '',
  day: '',
  year: '',
  dateTime: '',
  venue: '',
  organizer: '',
  overview: '',
  requirements: [],
};

type EventDetailsSource = 'events' | 'dashboard' | 'organized';
type RegistrationDecision = 'accepted' | 'rejected';

type EventDetailsPageContentProps = {
  source?: EventDetailsSource;
  eventDate?: {
    month?: string;
    day?: string;
    year?: string;
  };
};

function getRegisteredEventStatusLabel(eventDate?: EventDetailsPageContentProps['eventDate']) {
  if (!eventDate?.month || !eventDate.day || !eventDate.year) {
    return 'Upcoming Event';
  }

  const parsedDate = new Date(`${eventDate.month} ${eventDate.day}, ${eventDate.year}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Upcoming Event';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate.getTime() === today.getTime()) {
    return "Today's Event";
  }

  return parsedDate > today ? 'Upcoming Event' : 'Passed Event';
}

function readRequirementFile(file: File): Promise<UploadedRequirementFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read uploaded file.'));
        return;
      }

      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result,
      });
    });
    reader.addEventListener('error', () => reject(reader.error || new Error('Unable to read uploaded file.')));
    reader.readAsDataURL(file);
  });
}

function writeSavedHomeEvents(eventIds: string[]) {
  window.localStorage.setItem(HOME_SAVED_EVENTS_KEY, JSON.stringify(eventIds));
  window.dispatchEvent(new CustomEvent('dcspace-events-updated'));
}

function formatDatePart(dateTime: string) {
  return dateTime.split(',').slice(0, -1).join(',').trim() || dateTime || 'Day, Date';
}

function formatTimePart(dateTime: string) {
  return dateTime.split(',').at(-1)?.trim() || 'Time';
}

function formatDeadline(deadline?: string) {
  if (!deadline) return 'TBA';

  const parsedDate = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return deadline;

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
}

function getSurveyFormLink(event: FrontendEvent | RegisteredEvent) {
  return (event as FrontendEvent & RegisteredEvent).surveyFormLink?.trim() || '';
}

function getAdminChangeRequest(event: FrontendEvent) {
  const eventWithRequest = event as FrontendEvent & {
    adminComments?: Array<{ message?: string }>;
    adminChangeRequest?: string;
    changesRequested?: string;
    requestedChanges?: string;
  };
  const latestComment = [...(eventWithRequest.adminComments || [])]
    .reverse()
    .find((comment) => comment.message?.trim())
    ?.message?.trim();

  return (
    latestComment ||
    eventWithRequest.adminChangeRequest?.trim() ||
    eventWithRequest.changesRequested?.trim() ||
    eventWithRequest.requestedChanges?.trim() ||
    'List of the changes requested by the admin will be shown here.'
  );
}

function isEventRegistered(eventId: string, registrations: RegisteredEvent[]) {
  return registrations.some((event) => getRegisteredEventId(event) === eventId || event.id === eventId);
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof detailIcons;
  label: string;
  value: string;
}) {
  return (
    <p className="browse-detail-row">
      <Image src={detailIcons[icon]} width={16} height={16} alt="" />
      <span>{label}</span>
      {value && <small>{value}</small>}
    </p>
  );
}

function registeredEventMatchesDate(event: RegisteredEvent, eventDate?: EventDetailsPageContentProps['eventDate']) {
  if (!eventDate?.month || !eventDate.day || !eventDate.year) {
    return false;
  }

  return event.month === eventDate.month && event.day === eventDate.day && event.year === eventDate.year;
}

function toEventDetails(event: RegisteredEvent, fallback: FrontendEvent): FrontendEvent {
  return {
    ...fallback,
    ...event,
    id: getRegisteredEventId(event),
    name: event.name || fallback.name,
    month: event.month || fallback.month,
    day: event.day || fallback.day,
    year: event.year || fallback.year,
    dateTime: event.dateTime || fallback.dateTime,
    venue: event.venue || fallback.venue,
    organizer: event.organizer || fallback.organizer,
    overview: fallback.overview,
    requirements: event.requirements || fallback.requirements,
  };
}

function getSubmittedRegistrationRows(eventDetails: FrontendEvent, registrations: RegisteredEvent[]) {
  return registrations
    .filter((registration) => registration.id === eventDetails.id || getRegisteredEventId(registration) === eventDetails.id)
    .map((registration, index) => {
      const registrationWithProfile = registration as RegisteredEvent & {
        participantName?: string;
        studentName?: string;
        course?: string;
        organization?: string;
      };
      const submittedFile = registration.requirementFiles?.[0] || registration.requirementFile;

      return {
        id: `${getRegisteredEventId(registration)}-${index}`,
        participantName: registrationWithProfile.participantName || registrationWithProfile.studentName || 'Participant Name',
        course: registrationWithProfile.course || 'Course',
        organization: registrationWithProfile.organization || registration.organizer || 'Organization',
        fileName: submittedFile?.requirementName || submittedFile?.name || registration.requirements?.[0] || 'File Name Submitted',
        file: submittedFile,
      };
    });
}

export function EventDetailsPageContent({ source = 'events', eventDate }: EventDetailsPageContentProps) {
  const router = useRouter();
  const isDashboardSource = source === 'dashboard';
  const isOrganizedSource = source === 'organized';
  const registeredEventStatus = getRegisteredEventStatusLabel(eventDate);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showRequirementSuccess, setShowRequirementSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRequirementFiles, setSelectedRequirementFiles] = useState<Record<string, File>>({});
  const [showRequirementWarning, setShowRequirementWarning] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [organizedEventSection, setOrganizedEventSection] = useState('all');
  const [organizedEventFilter, setOrganizedEventFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<FrontendEvent>(emptyEventDetails);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [canCurrentUserOrganize, setCanCurrentUserOrganize] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [registrationDecisions, setRegistrationDecisions] = useState<Record<string, RegistrationDecision>>({});
  const eventRequirements = selectedEvent.requirements || [];

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      setIsLoadingEvent(true);
      const selectedId = window.localStorage.getItem(SELECTED_BROWSE_EVENT_KEY);
      const browseEvent = selectedId ? (await loadEventById(selectedId)) : null;
      const studentEmail = window.localStorage.getItem('dcspaceStudentEmail')?.trim().toLowerCase() || '';
      const currentRegisteredEvents = await loadRegisteredEvents();
      const attendance = await loadAttendanceRecords();
      const bookmarks = await loadBookmarkedEventIds();

      if (cancelled) return;

      setCurrentUserEmail(studentEmail);
      setCanCurrentUserOrganize(userCanOrganize());
      setRegisteredEvents(currentRegisteredEvents);
      setAttendanceRecords(attendance);
      setOrganizedEventSection(window.sessionStorage.getItem('dcspaceOrganizedEventSection') || 'all');
      setOrganizedEventFilter(window.sessionStorage.getItem('dcspaceOrganizedEventFilter') || 'All');

      if (!browseEvent) {
        setSelectedEvent(emptyEventDetails);
        setIsLoadingEvent(false);
        return;
      }

      if (!isDashboardSource) {
        setSelectedEvent(browseEvent);
        setSavedEventIds(bookmarks);
        setIsJoined(isEventRegistered(browseEvent.id, currentRegisteredEvents));
        setIsLoadingEvent(false);
        return;
      }

      const registeredEvent =
        currentRegisteredEvents.find((event) => event.id && event.id === browseEvent.id) ||
        currentRegisteredEvents.find((event) => registeredEventMatchesDate(event, eventDate));

      const resolvedEvent = registeredEvent ? toEventDetails(registeredEvent, browseEvent) : browseEvent;
      setSelectedEvent(resolvedEvent);
      setSavedEventIds(bookmarks);
      setIsJoined(isEventRegistered(resolvedEvent.id, currentRegisteredEvents));
      setIsLoadingEvent(false);
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [eventDate, isDashboardSource, source]);

  const toggleSavedEvent = () => {
    void toggleEventBookmark(selectedEvent.id, savedEventIds).then((nextIds) => {
      setSavedEventIds(nextIds);
      writeSavedHomeEvents(nextIds);
    });
  };

  const handleShareEvent = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: selectedEvent.name,
        text: selectedEvent.overview,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard?.writeText(shareUrl);
  };

  const handleAttendEvent = () => {
    if (eventRequirements.length) {
      handleOpenRequirements();
      return;
    }

    void registerEventForCurrentUser(selectedEvent, [])
      .then(() => setIsJoined(true))
      .catch((error) => {
        window.alert(error instanceof Error ? error.message : 'Failed to register for this event.');
      });
  };

  const handleDeleteEvent = () => {
    void deleteOrganizedEventFromBackend(selectedEvent.id)
      .then(() => {
        setShowDeleteConfirm(false);
        window.sessionStorage.setItem('dcspaceDashboardView', 'organized');
        router.push('/dashboard');
      })
      .catch((error) => {
        window.alert(error instanceof Error ? error.message : 'Failed to delete event.');
      });
  };

  const handleConfirm = async () => {
    /*
    Temporarily disabled so the submit flow can continue to the success popup
    even before required event files are uploaded.
    const missingRequirements = eventRequirements.some((requirement) => !selectedRequirementFiles[requirement]);

    if (missingRequirements) {
      setShowRequirementWarning(true);
      return;
    }
    */

    const requirementFiles = await Promise.all(
      eventRequirements
        .filter((requirementName) => selectedRequirementFiles[requirementName])
        .map(async (requirementName) => ({
          ...(await readRequirementFile(selectedRequirementFiles[requirementName])),
          requirementName,
        })),
    );

    try {
      await registerEventForCurrentUser(selectedEvent, requirementFiles);
      setIsJoined(true);
      const [registered, attendance] = await Promise.all([
        loadRegisteredEvents(),
        loadAttendanceRecords(),
      ]);
      setRegisteredEvents(registered);
      setAttendanceRecords(attendance);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to register for this event.');
      return;
    }

    if (!isDashboardSource && !isOrganizedSource) {
      setShowRequirementSuccess(true);
      window.setTimeout(() => {
        void loadRegisteredEvents().then(setRegisteredEvents);
        setShowRequirements(false);
        setShowRequirementSuccess(false);
        startTransition(() => {
          router.replace('/events/details');
        });
      }, 2200);
      return;
    }

    setIsRedirecting(true);
    window.setTimeout(() => {
      startTransition(() => {
        router.push('/dashboard');
      });
    }, 180);
  };

  const handleOpenRequirements = () => {
    setShowRequirementWarning(false);
    setShowRequirements(true);
  };

  const handleCloseRequirements = () => {
    setShowRequirementWarning(false);
    setShowRequirements(false);
  };

  const handleRequirementFileChange = (requirement: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedRequirementFiles((files) => ({
      ...files,
      [requirement]: file,
    }));
    setShowRequirementWarning(false);
  };

  const eventDetails = selectedEvent;
  const isBrowseSource = !isDashboardSource && !isOrganizedSource;
  const isSaved = savedEventIds.includes(eventDetails.id);
  const eventCreatedBy = eventDetails.createdBy || '';
  const isCreatedByCurrentUser =
    canCurrentUserOrganize && Boolean(eventCreatedBy) && eventCreatedBy.trim().toLowerCase() === currentUserEmail;
  const currentAttendanceUser = getCurrentAttendanceUser();
  const organizerCourse = eventDetails.organizerCourse || (isCreatedByCurrentUser ? currentAttendanceUser.course : '') || 'Course';
  const matchingRegisteredEvent = registeredEvents.find(
    (event) => getRegisteredEventId(event) === eventDetails.id || event.id === eventDetails.id,
  );
  const matchingAttendanceRecord = matchingRegisteredEvent ? attendanceRecords[getRegisteredEventId(matchingRegisteredEvent)] : undefined;
  const isPassedBrowseEvent = getEventStatus(eventDetails) === 'Passed';
  const isPassedJoinedBrowseEvent = isPassedBrowseEvent && Boolean(matchingRegisteredEvent);
  const receivedCertificate = getCertificateStatus(matchingAttendanceRecord, matchingRegisteredEvent || eventDetails) === 'Download';
  const surveyFormLink = getSurveyFormLink(matchingRegisteredEvent || eventDetails);
  const hasRequestedChanges = eventDetails.status?.toLowerCase().replace(/[\s-]+/g, '_') === 'changes_requested';
  const isRejectedOrganizedEvent =
    isOrganizedSource &&
    eventDetails.status?.toLowerCase().includes('reject') &&
    organizedEventSection === 'submissions' &&
    organizedEventFilter === 'Rejected';
  const isPendingOrganizedEvent =
    isOrganizedSource &&
    (!eventDetails.status ||
      ['pending', 'created', 'submitted'].some((status) => eventDetails.status?.toLowerCase().includes(status))) &&
    organizedEventSection === 'submissions' &&
    organizedEventFilter === 'Pending';
  const isAcceptedOrganizedSubmission =
    isOrganizedSource &&
    organizedEventSection === 'submissions' &&
    organizedEventFilter === 'Accepted';
  const isDraftOrganizedEvent =
    eventDetails.status?.toLowerCase() === 'draft' &&
    organizedEventSection === 'submissions' &&
    organizedEventFilter === 'Drafts';
  const adminChangeRequest = getAdminChangeRequest(eventDetails);
  const eventAnnouncements = eventDetails.announcements?.trim() || 'No Announcements yet';
  const showLongChangeRequest = adminChangeRequest.length > 90;
  // Temporarily disabled with the pending admin approval message in the CTA.
  // const isPendingAdminApproval = eventDetails.status?.toLowerCase() === 'pending';
  const isPendingFileApproval = isJoined && eventRequirements.length > 0;
  const submittedRegistrationRows = getSubmittedRegistrationRows(eventDetails, registeredEvents);

  const handleRegistrationDecision = (registrationId: string, decision: RegistrationDecision) => {
    setRegistrationDecisions((current) => ({
      ...current,
      [registrationId]: decision,
    }));
  };

  if (isLoadingEvent) {
    return (
      <section className="event-details-page">
        <p className="event-details-loading">Loading event details…</p>
      </section>
    );
  }

  if (!eventDetails.id) {
    return (
      <section className="event-details-page">
        <p className="event-details-loading">Event not found. Go back to Browse Events and select an event.</p>
        <Link href="/events" className="btn primary">
          Browse Events
        </Link>
      </section>
    );
  }

  if (isOrganizedSource && hasRequestedChanges) {
    return (
      <section className="event-details-page event-details-page--change-request">
        <div className="change-request-layout">
          <div className="change-request-main">
            <div className="change-request-banner">
              {eventDetails.bannerDataUrl ? <img src={eventDetails.bannerDataUrl} alt="" /> : <img src="/assets/Calendar.svg" alt="" />}
            </div>
            <h2>{eventDetails.name}</h2>

            <section>
              <h3>Date &amp; Time</h3>
              <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
              <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
            </section>

            <section>
              <h3>Location</h3>
              <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
            </section>

            <section>
              <h3>Hosted By</h3>
              <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
            </section>
          </div>

          <aside className="change-request-panel">
            <p className="change-request-note">The admin requested changes before approving your event.</p>
            <label className="change-request-field">
              <span>
                <Image src="/assets/info-circle.svg" width={22} height={22} alt="" />
                Changes Requested
              </span>
              {showLongChangeRequest ? (
                <textarea value={adminChangeRequest} readOnly />
              ) : (
                <input type="text" value={adminChangeRequest} readOnly />
              )}
            </label>
            <Link className="change-request-button" href="/events-organized/create">
              Make Changes
            </Link>
          </aside>
        </div>
      </section>
    );
  }

  if (isOrganizedSource && isDraftOrganizedEvent) {
    return (
      <section className="event-details-page event-details-page--draft">
        <div className="draft-event-layout">
          <div className="draft-event-main">
            <div className="draft-event-banner">
              {eventDetails.bannerDataUrl ? <img src={eventDetails.bannerDataUrl} alt="" /> : <img src="/assets/Calendar.svg" alt="" />}
            </div>
            <h2>{eventDetails.name}</h2>

            <section>
              <h3>Date &amp; Time</h3>
              <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
              <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
            </section>

            <section>
              <h3>Location</h3>
              <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
            </section>

            <section>
              <h3>Hosted By</h3>
              <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
            </section>
          </div>

          <aside className="draft-event-panel">
            <p>This event is in the drafts folder.</p>
            <Link className="draft-event-button" href="/events-organized/create">
              Continue Editing
            </Link>
          </aside>
        </div>
      </section>
    );
  }

  if (isAcceptedOrganizedSubmission) {
    return (
      <section className="event-details-page event-details-page--browse event-details-page--accepted-submission">
        <div className="browse-event-detail">
          <div className="browse-event-detail__banner">
            {eventDetails.bannerDataUrl ? <img src={eventDetails.bannerDataUrl} alt="" /> : <img src="/assets/Calendar.svg" alt="" />}
          </div>

          <header className="browse-event-detail__header">
            <div>
              <h2>{eventDetails.name}</h2>
            </div>
            <div className="browse-event-detail__actions" aria-label="Event actions">
              <button
                className={`browse-event-detail__icon-btn${isSaved ? ' is-saved' : ''}`}
                type="button"
                aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
                onClick={toggleSavedEvent}
              >
                <span className="browse-event-detail__bookmark-outline" aria-hidden="true" />
                <span className="browse-event-detail__bookmark-fill" aria-hidden="true" />
              </button>
              <button className="browse-event-detail__icon-btn" type="button" aria-label="Share event" onClick={() => void handleShareEvent()}>
                <Image src="/assets/share-icon.svg" width={30} height={30} alt="" />
              </button>
            </div>
          </header>

          <div className="browse-event-detail__body">
            <div className="browse-event-detail__info">
              <section>
                <h3>Date &amp; Time</h3>
                <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
                <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
              </section>

              <section>
                <h3>Location</h3>
                <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
              </section>

              <section>
                <h3>Hosted By</h3>
                <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
                <DetailRow icon="course" label={organizerCourse} value="" />
                <DetailRow icon="department" label={eventDetails.department || eventDetails.school || 'School/Department'} value="" />
              </section>

              <section>
                <h3>Event Requirements</h3>
                <DetailRow icon="attendance" label="Attendance Time Requirement:" value={eventDetails.minAttendance || 'TBA'} />
                <DetailRow icon="grace" label="Grace Period:" value={eventDetails.duration || 'TBA'} />
                <DetailRow
                  icon="files"
                  label="Required File(s):"
                  value={eventRequirements.length ? eventRequirements.join(', ') : 'None'}
                />
              </section>
            </div>

            <aside className="browse-event-detail__cta">
              <button className="attend-event-button" type="button">
                Attend Event
              </button>
              <p>Registration Deadline: {formatDeadline(eventDetails.registrationDeadline)}</p>
              <section className="event-cta-announcements">
                <h3>Announcements:</h3>
                <p>{eventAnnouncements}</p>
              </section>
            </aside>

            <section className="browse-event-detail__description">
              <h3>Event Description</h3>
              <p className="event-detail-type">
                <strong>Event Type:</strong> <span>{eventDetails.eventType || 'Event Type'}</span>
              </p>
              <p>{eventDetails.overview || 'Event description will appear here.'}</p>
            </section>
          </div>

          <Link className="accepted-submission-make-changes" href="/events-organized/create">
            Make Changes
          </Link>
        </div>
      </section>
    );
  }

  if (isPendingOrganizedEvent || (isOrganizedSource && organizedEventSection === 'submissions' && !isRejectedOrganizedEvent)) {
    return (
      <section className="event-details-page event-details-page--browse event-details-page--pending-detail">
        <div className="browse-event-detail">
          <div className="browse-event-detail__banner">
            {eventDetails.bannerDataUrl ? <img src={eventDetails.bannerDataUrl} alt="" /> : <img src="/assets/Calendar.svg" alt="" />}
          </div>

          <header className="browse-event-detail__header">
            <div>
              <h2>{eventDetails.name}</h2>
            </div>
          </header>

          <div className="browse-event-detail__body">
            <div className="browse-event-detail__info">
              <section>
                <h3>Date &amp; Time</h3>
                <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
                <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
              </section>

              <section>
                <h3>Location</h3>
                <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
              </section>

              <section>
                <h3>Hosted By</h3>
                <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
                <DetailRow icon="course" label={organizerCourse} value="" />
                <DetailRow icon="department" label={eventDetails.department || eventDetails.school || 'School/Department'} value="" />
              </section>

              <section>
                <h3>Event Requirements</h3>
                <DetailRow icon="attendance" label="Attendance Time Requirement:" value={eventDetails.minAttendance || 'TBA'} />
                <DetailRow icon="grace" label="Grace Period:" value={eventDetails.duration || 'TBA'} />
                <DetailRow
                  icon="files"
                  label="Required File(s):"
                  value={eventRequirements.length ? eventRequirements.join(', ') : 'None'}
                />
              </section>
            </div>

            <aside className="browse-event-detail__cta pending-event-approval-message">
            <p>
              This event is still pending from being approved by the admin.{' '}
              <Link href="/submit-feedback">Submit Feedback.</Link>
            </p>
            </aside>

            <section className="browse-event-detail__description">
              <h3>Event Description</h3>
              <p className="event-detail-type">
                <strong>Event Type:</strong> <span>{eventDetails.eventType || 'Event Type'}</span>
              </p>
              <p>{eventDetails.overview || 'Event description will appear here.'}</p>
            </section>
          </div>
        </div>
      </section>
    );
  }

  if (isBrowseSource) {
    return (
      <section className="event-details-page event-details-page--browse">
        <div className="browse-event-detail">
          <button className="browse-event-detail__back" type="button" aria-label="Go to previous page" onClick={() => router.back()}>
            <Image src="/assets/page-previous.svg" width={26} height={26} alt="" />
          </button>

          <div className="browse-event-detail__banner">
            {eventDetails.bannerDataUrl ? (
              <img src={eventDetails.bannerDataUrl} alt="" />
            ) : (
              <img src="/assets/Calendar.svg" alt="" />
            )}
          </div>

          <header className="browse-event-detail__header">
            <div>
              <h2>{eventDetails.name}</h2>
              {isCreatedByCurrentUser && <p className="browse-event-detail__owner-note">You created this event.</p>}
              {isPassedJoinedBrowseEvent && <p className="browse-event-detail__status-note">This event has passed.</p>}
            </div>
            <div className="browse-event-detail__actions" aria-label="Event actions">
              <button
                className={`browse-event-detail__icon-btn${isSaved ? ' is-saved' : ''}`}
                type="button"
                aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
                onClick={toggleSavedEvent}
              >
                <span className="browse-event-detail__bookmark-outline" aria-hidden="true" />
                <span className="browse-event-detail__bookmark-fill" aria-hidden="true" />
              </button>
              <button className="browse-event-detail__icon-btn" type="button" aria-label="Share event" onClick={() => void handleShareEvent()}>
                <Image src="/assets/share-icon.svg" width={30} height={30} alt="" />
              </button>
            </div>
          </header>

          <div className="browse-event-detail__body">
            <div className="browse-event-detail__info">
              <section>
                <h3>Date &amp; Time</h3>
                <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
                <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
              </section>

              <section>
                <h3>Location</h3>
                <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
              </section>

              <section>
                <h3>Hosted By</h3>
                <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
                <DetailRow icon="course" label={organizerCourse} value="" />
                <DetailRow icon="department" label={eventDetails.department || eventDetails.school || 'School/Department'} value="" />
              </section>

              <section>
                <h3>Event Requirements</h3>
                <DetailRow icon="attendance" label="Attendance Time Requirement:" value={eventDetails.minAttendance || 'TBA'} />
                <DetailRow icon="grace" label="Grace Period:" value={eventDetails.duration || 'TBA'} />
                <DetailRow
                  icon="files"
                  label="Required File(s):"
                  value={eventRequirements.length ? eventRequirements.join(', ') : 'None'}
                />
              </section>
            </div>

            <aside className="browse-event-detail__cta">
              {/*
              Temporarily disabled. Restore this branch when pending admin approval messaging is needed again.
              {isPendingAdminApproval ? (
                <p className="event-pending-admin-message">
                  This event is still pending from being approved by the admin.{' '}
                  <Link href="/submit-feedback">Submit Feedback.</Link>
                </p>
              ) : */}
              {isPassedJoinedBrowseEvent ? (
                <>
                  <button
                    className={`event-certificate-status${receivedCertificate ? ' is-received' : ' is-missing'}`}
                    type="button"
                  >
                    {receivedCertificate
                      ? 'You received a certificate for this event'
                      : "You didn't receive a certificate for this event"}
                  </button>
                  <label className="event-survey-link">
                    <span>
                      <Image src="/assets/info-circle.svg" width={22} height={22} alt="" />
                      Survey Form Link
                    </span>
                    <input type="text" value={surveyFormLink || 'Survey Form Link'} readOnly />
                  </label>
                </>
              ) : isPendingFileApproval ? (
                <button className="attend-event-button attend-event-button--pending" type="button">
                  Pending File Submission Approval
                </button>
              ) : isJoined ? (
                <button className="attend-event-button attend-event-button--joined" type="button">
                  You already joined this event
                </button>
              ) : (
                <button className="attend-event-button" type="button" onClick={handleAttendEvent}>
                  Attend Event
                </button>
              )}
              <p>Registration Deadline: {formatDeadline(eventDetails.registrationDeadline)}</p>
              <section className="event-cta-announcements">
                <h3>Announcements:</h3>
                <p>{eventAnnouncements}</p>
              </section>
            </aside>

            <section className="browse-event-detail__description">
              <h3>Event Description</h3>
              <p className="event-detail-type">
                <strong>Event Type:</strong> <span>{eventDetails.eventType || 'Event Type'}</span>
              </p>
              <p>{eventDetails.overview || 'Event description will appear here.'}</p>
            </section>
          </div>
        </div>
        {showRequirements && (
          <RequirementsModal
            eventRequirements={eventRequirements}
            selectedRequirementFiles={selectedRequirementFiles}
            showRequirementSuccess={showRequirementSuccess}
            showRequirementWarning={showRequirementWarning}
            onClose={handleCloseRequirements}
            onConfirm={() => void handleConfirm()}
            onFileChange={handleRequirementFileChange}
          />
        )}
      </section>
    );
  }

  if (isOrganizedSource && organizedEventSection === 'all') {
    return (
      <section className={`event-details-page event-details-page--organized${isRedirecting ? ' is-exiting' : ''}${showDeleteConfirm ? ' is-delete-confirming' : ''}`}>
        <section className="organized-event-details-section">
          <h2>Event Details</h2>
          <article className="organized-event-details-card">
            <h3>{eventDetails.name}</h3>
            <div className="organized-event-details-grid">
              <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
              <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
              <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
              <DetailRow icon="attendance" label="Attendance Time Requirement" value={eventDetails.minAttendance || 'TBA'} />
              <DetailRow icon="grace" label="Allowed Grace Period" value={eventDetails.duration || 'TBA'} />
            </div>
          </article>
        </section>

        <section className="submitted-registrations-section">
          <h2>Submitted Registrations</h2>
          <div className="submitted-registrations-table-wrap">
            <table className="submitted-registrations-table">
              <thead>
                <tr>
                  <th>Participant Name</th>
                  <th>Course</th>
                  <th>Organization</th>
                  <th>File Name Submitted</th>
                  <th>File</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submittedRegistrationRows.length ? (
                  submittedRegistrationRows.map((registration) => {
                    const decision = registrationDecisions[registration.id];

                    return (
                      <tr key={registration.id}>
                        <td>{registration.participantName}</td>
                        <td>{registration.course}</td>
                        <td>{registration.organization}</td>
                        <td>{registration.fileName}</td>
                        <td>
                          {registration.file ? (
                            <a
                              className="registration-view-button"
                              href={registration.file.dataUrl}
                              target={registration.file.type === 'application/pdf' ? '_blank' : undefined}
                              rel={registration.file.type === 'application/pdf' ? 'noreferrer' : undefined}
                              download={registration.file.type === 'application/pdf' ? undefined : registration.file.name}
                            >
                              View
                            </a>
                          ) : (
                            <button className="registration-view-button" type="button">
                              View
                            </button>
                          )}
                        </td>
                        <td>
                          <select
                            className={`registration-action-select${decision ? ` is-${decision}` : ''}`}
                            value={decision || ''}
                            aria-label={`Choose registration action for ${registration.participantName}`}
                            onChange={(event) => {
                              if (event.target.value === 'accepted' || event.target.value === 'rejected') {
                                handleRegistrationDecision(registration.id, event.target.value);
                              }
                            }}
                          >
                            <option value="">Accept</option>
                            <option value="accepted">{decision === 'accepted' ? 'Accepted' : 'Accept'}</option>
                            <option value="rejected">{decision === 'rejected' ? 'Rejected' : 'Reject'}</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="submitted-registrations-empty">
                      No submitted registrations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <section className="delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
              <h2 id="delete-confirm-title">
                Are you sure you want to delete &quot;{eventDetails.name}&quot;?
              </h2>
              <div className="delete-confirm-actions">
                <button className="delete-confirm-no" type="button" onClick={() => setShowDeleteConfirm(false)}>
                  No
                </button>
                <button className="delete-confirm-yes" type="button" onClick={handleDeleteEvent}>
                  Yes
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    );
  }

  if (isRejectedOrganizedEvent) {
    return (
      <section className={`event-details-page event-details-page--rejected${isRedirecting ? ' is-exiting' : ''}${showDeleteConfirm ? ' is-delete-confirming' : ''}`}>
        <div className="rejected-event-layout">
          <div className="rejected-event-main">
            <h2>{eventDetails.name}</h2>
            <p className="rejected-event-note">This event was rejected by the admin.</p>

            <section>
              <h3>Date &amp; Time</h3>
              <DetailRow icon="date" label={formatDatePart(eventDetails.dateTime)} value="" />
              <DetailRow icon="time" label={formatTimePart(eventDetails.dateTime)} value="" />
            </section>

            <section className="rejected-event-location">
              <div>
                <h3>Location</h3>
                <DetailRow icon="venue" label={eventDetails.venue || 'Event Venue'} value="" />
              </div>
              <div className="rejected-event-announcements">
                <h3>Announcements:</h3>
                <p>{eventAnnouncements}</p>
              </div>
            </section>

            <section>
              <h3>Hosted By</h3>
              <DetailRow icon="organizer" label={eventDetails.organizer || 'Organization Name'} value="" />
              <DetailRow icon="course" label={organizerCourse} value="" />
              <DetailRow icon="department" label={eventDetails.department || eventDetails.school || 'School/Department'} value="" />
            </section>
          </div>

          <aside className="rejected-event-side">
            <button className="rejected-delete-button" type="button" onClick={() => setShowDeleteConfirm(true)}>
              Delete Event
            </button>
            <p>Registration Deadline: {formatDeadline(eventDetails.registrationDeadline)}</p>
          </aside>
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <section className="delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
              <h2 id="delete-confirm-title">
                Are you sure you want to delete &quot;{eventDetails.name}&quot;?
              </h2>
              <div className="delete-confirm-actions">
                <button className="delete-confirm-no" type="button" onClick={() => setShowDeleteConfirm(false)}>
                  No
                </button>
                <button className="delete-confirm-yes" type="button" onClick={handleDeleteEvent}>
                  Yes
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`event-details-page${isRedirecting ? ' is-exiting' : ''}${showDeleteConfirm ? ' is-delete-confirming' : ''}`}>
      {isDashboardSource ? (
        <section className="registered-details-tabs" aria-label="Dashboard sections">
          <Link className="registered-details-back" href="/dashboard">
            Events Registered
          </Link>
        </section>
      ) : isOrganizedSource ? (
        <section className="organized-details-header" aria-label="Organized event details">
          <Link className="organized-details-back" href="/dashboard">
            Events Organized
          </Link>
          <button className="delete-event-button" type="button" onClick={() => setShowDeleteConfirm(true)}>
            Delete event
          </button>
        </section>
      ) : (
        <section className="details-header">
          <h1>Browse Events</h1>
          <label className="details-search">
            <svg className="details-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 18C11.775 17.9996 13.4988 17.4054 14.897 16.312L19.293 20.708L20.707 19.294L16.311 14.898C17.405 13.4997 17.9996 11.7754 18 10C18 5.589 14.411 2 10 2C5.589 2 2 5.589 2 10C2 14.411 5.589 18 10 18ZM10 4C13.309 4 16 6.691 16 10C16 13.309 13.309 16 10 16C6.691 16 4 13.309 4 10C4 6.691 6.691 4 10 4Z" fill="currentColor" />
            </svg>
            <input type="search" aria-label="Search events" />
          </label>
        </section>
      )}

      {isDashboardSource && <h2 className="registered-detail-status">{registeredEventStatus}</h2>}

      <section className="event-hero">
        <div className="event-hero-image">
          <svg viewBox="0 0 7 7" fill="none" aria-hidden="true">
            <path d="M1.38831 4.72105L2.63783 3.05502L3.60967 4.30454L4.30385 3.47153L5.2757 4.72105H1.38831ZM5.55337 1.66667H3.332L2.77666 1.11133H1.11064C0.963353 1.11133 0.8221 1.16984 0.717954 1.27398C0.613807 1.37813 0.555298 1.51938 0.555298 1.66667V4.99872C0.555298 5.146 0.613807 5.28726 0.717954 5.3914C0.8221 5.49555 0.963353 5.55406 1.11064 5.55406H5.55337C5.70066 5.55406 5.84191 5.49555 5.94605 5.3914C6.0502 5.28726 6.10871 5.146 6.10871 4.99872V2.22201C6.10871 2.07473 6.0502 1.93347 5.94605 1.82933C5.84191 1.72518 5.70066 1.66667 5.55337 1.66667Z" fill="currentColor" />
          </svg>
        </div>

        <div className="event-summary">
          <h2>{eventDetails.name}</h2>
          <p>
            <CalendarIcon />
            {eventDetails.dateTime}
          </p>
          <p>
            <VenueIcon />
            {eventDetails.venue}
          </p>
          <p>
            <OrganizerIcon />
            {eventDetails.organizer}
          </p>
        </div>
      </section>

      <section className="event-info">
        <h3>Overview</h3>
        <p>{eventDetails.overview}</p>

        <h3>Requirements</h3>
        <ul>
          {eventDetails.requirements.map((requirement, index) => {
            const submittedFile =
              eventDetails.requirementFiles?.find((file) => file.requirementName === requirement) ||
              eventDetails.requirementFiles?.[index] ||
              eventDetails.requirementFile;

            return (
              <li key={requirement}>
                {isDashboardSource && submittedFile ? (
                  <SubmittedRequirementLink requirement={requirement} file={submittedFile} />
                ) : (
                  requirement
                )}
              </li>
            );
          })}

          <li>
            Minimum Attendance Time Required: {eventDetails.minAttendance || 'TBA'}
          </li>
        </ul>
      </section>

      {!isDashboardSource && (
        <div className="event-actions">
          <button className="go-back-button" type="button" onClick={() => router.back()}>
            Go Back
          </button>
          <button className="register-button" type="button" onClick={handleOpenRequirements}>
            Register!
          </button>
        </div>
      )}

      {showRequirements && (
        <RequirementsModal
          eventRequirements={eventRequirements}
          selectedRequirementFiles={selectedRequirementFiles}
          showRequirementSuccess={showRequirementSuccess}
          showRequirementWarning={showRequirementWarning}
          onClose={handleCloseRequirements}
          onConfirm={() => void handleConfirm()}
          onFileChange={handleRequirementFileChange}
        />
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <section className="delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h2 id="delete-confirm-title">
              Are you sure you want to delete &quot;{eventDetails.name}&quot;?
            </h2>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-no" type="button" onClick={() => setShowDeleteConfirm(false)}>
                No
              </button>
              <button className="delete-confirm-yes" type="button" onClick={handleDeleteEvent}>
                Yes
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function SubmittedRequirementLink({
  requirement,
  file,
}: {
  requirement: string;
  file: UploadedRequirementFile;
}) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <span className="submitted-requirement">
      <a
        className="submitted-requirement__link"
        href={file.dataUrl}
        target={isPdf ? '_blank' : undefined}
        rel={isPdf ? 'noreferrer' : undefined}
        download={isPdf ? undefined : file.name}
      >
        {requirement}
      </a>
      <span className="submitted-requirement__tooltip" role="tooltip">
        {file.name}
      </span>
    </span>
  );
}

function RequirementsModal({
  eventRequirements,
  selectedRequirementFiles,
  showRequirementSuccess,
  showRequirementWarning,
  onClose,
  onConfirm,
  onFileChange,
}: {
  eventRequirements: string[];
  selectedRequirementFiles: Record<string, File>;
  showRequirementSuccess: boolean;
  showRequirementWarning: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onFileChange: (requirement: string, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`requirements-overlay${showRequirementSuccess ? ' is-success' : ''}`}>
      <section className="requirements-modal" role="dialog" aria-modal="true" aria-label="Event requirements">
        {showRequirementSuccess ? (
          <div className="requirements-success">
            <span className="confetti confetti--one" aria-hidden="true" />
            <span className="confetti confetti--two" aria-hidden="true" />
            <span className="confetti confetti--three" aria-hidden="true" />
            <span className="confetti confetti--four" aria-hidden="true" />
            <span className="confetti confetti--five" aria-hidden="true" />
            <p>Thank you! Your required files have been submitted successfully and are now awaiting review.</p>
          </div>
        ) : (
          <>
            <button className="close-button" type="button" aria-label="Close requirements" onClick={onClose}>
              x
            </button>
            <div className="requirements-header">
              <h2>This event contains registration requirements.</h2>
              <h3>Files Requirement(s)</h3>
            </div>

            {eventRequirements.length > 0 ? (
              <div className="requirements-list">
                {eventRequirements.map((requirement) => {
                  const selectedFile = selectedRequirementFiles[requirement];

                  return (
                    <label className="file-requirement-row" key={requirement}>
                      <span>{requirement}*</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,image/pdf,image/png,image/jpeg"
                        onChange={(event) => onFileChange(requirement, event)}
                        aria-label={`Upload ${requirement}`}
                        required
                      />
                      <small>{selectedFile?.name || 'Valid file formats: PDF, PNG, JPG, JPEG'}</small>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="requirements-empty">No required files for this event.</p>
            )}

            <button className="confirm-button" type="button" onClick={onConfirm}>
              Submit
            </button>

            {showRequirementWarning && (
              <p className="requirements-warning" role="alert">
                Please submit the file first
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 20V6C21 4.897 20.103 4 19 4H17V2H15V4H9V2H7V4H5C3.897 4 3 4.897 3 6V20C3 21.103 3.897 22 5 22H19C20.103 22 21 21.103 21 20ZM9 18H7V16H9V18ZM9 14H7V12H9V14ZM13 18H11V16H13V18ZM13 14H11V12H13V14ZM17 18H15V16H17ZM17 14H15V12H17ZM19 9H5V7H19V9Z" fill="currentColor" />
    </svg>
  );
}

function VenueIcon() {
  return (
    <svg viewBox="0 0 18 23" fill="none" aria-hidden="true">
      <path d="M9.26539 21.8715C10.4965 21.1209 11.6027 20.2113 12.5665 19.1968C14.6599 16.9975 16.0725 14.3097 16.6383 11.6724C17.2001 9.06878 16.9348 6.51759 15.692 4.54851C15.3389 3.98324 14.896 3.46664 14.3692 3.00245C12.8591 1.68287 11.1306 1.05396 9.39026 1.03712C7.56216 1.02402 5.70871 1.68287 4.06986 2.93507C3.3714 3.47039 2.79585 4.08619 2.34907 4.76563C1.19797 6.50261 0.848744 8.65886 1.22919 10.9143C1.61354 13.2035 2.74708 15.5974 4.55371 17.7668C5.81016 19.2791 7.39047 20.683 9.27125 21.8678L9.26539 21.8715ZM9.00006 3.96078C10.3755 3.96078 11.6242 4.4961 12.5236 5.36272C13.4269 6.22934 13.9849 7.42164 13.9849 8.74309C13.9849 10.0627 13.4269 11.2606 12.5236 12.1235C11.6203 12.9901 10.3775 13.5254 9.00006 13.5254C7.6246 13.5254 6.37595 12.9901 5.47654 12.1235C4.57322 11.2568 4.01523 10.0645 4.01523 8.74309C4.01523 7.42351 4.57322 6.22559 5.47654 5.36272C6.37985 4.4961 7.62264 3.96078 9.00006 3.96078Z" fill="currentColor" />
    </svg>
  );
}

function OrganizerIcon() {
  return (
    <svg viewBox="0 0 18 19" fill="none" aria-hidden="true">
      <path d="M4.5 4.5C4.5 6.981 6.519 9 9 9C11.481 9 13.5 6.981 13.5 4.5C13.5 2.019 11.481 0 9 0C6.519 0 4.5 2.019 4.5 4.5ZM17 19H18V18C18 14.141 14.859 11 11 11H7C3.14 11 0 14.141 0 18V19H17Z" fill="currentColor" />
    </svg>
  );
}
