'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRegisteredEventId, type RegisteredEvent } from '@/lib/attendance';
import {
  fetchRegistrations,
  readAuthSession,
  submitFeedback,
} from '@/lib/user-api';
import { mapRegistrationToRegistered } from '@/lib/user-mappers';
import { hasBackendSession } from '@/lib/user-data';

type FeedbackType = 'event' | 'general' | 'issue';

const thankYouMessages: Record<FeedbackType, string> = {
  event: 'Thank you for sharing your event feedback.',
  general: 'Thank you for sharing your thoughts.',
  issue: 'Thank you for reporting the issue.',
};

export function SubmitFeedbackContent() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('event');
  const [joinedEvents, setJoinedEvents] = useState<RegisteredEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rating, setRating] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadJoinedEvents() {
      setLoadingEvents(true);

      const session = readAuthSession();

      if (session?.token && hasBackendSession()) {
        try {
          const { registrations } = await fetchRegistrations(session.token);
          const mapped = registrations.map(mapRegistrationToRegistered);

          if (!cancelled) {
            setJoinedEvents(mapped);
            setSelectedEventId((current) => current || (mapped[0] ? getRegisteredEventId(mapped[0]) : ''));
          }
        } catch {
          if (!cancelled) {
            setJoinedEvents([]);
            setSelectedEventId('');
          }
        } finally {
          if (!cancelled) {
            setLoadingEvents(false);
          }
        }

        return;
      }

      if (!cancelled) {
        setJoinedEvents([]);
        setSelectedEventId('');
        setLoadingEvents(false);
      }
    }

    void loadJoinedEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const session = readAuthSession();

    if (!session?.token) {
      setSubmitError('Please sign in to submit feedback.');
      return;
    }

    const form = event.currentTarget;
    const comment = new FormData(form).get('feedback_comment');

    if (typeof comment !== 'string' || !comment.trim()) {
      setSubmitError('Please enter your comment.');
      return;
    }

    if (feedbackType === 'event' && !selectedEventId) {
      setSubmitError('Please select an event.');
      return;
    }

    if ((feedbackType === 'event' || feedbackType === 'general') && rating < 1) {
      setSubmitError('Please select a rating.');
      return;
    }

    setSubmitting(true);

    try {
      await submitFeedback(session.token, {
        feedbackType,
        eventId: feedbackType === 'event' ? selectedEventId : undefined,
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim(),
      });

      setShowSuccess(true);
      window.setTimeout(() => router.push('/my-profile'), 2200);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const showRating =
    feedbackType === 'event' || feedbackType === 'general';

  return (
    <main className="submit-feedback-page">
      <section className="submit-feedback-panel" aria-labelledby="submit-feedback-title">
        <h2 id="submit-feedback-title">We&apos;d love to hear from you</h2>
        <p>How was your experience? Let us know your thoughts</p>

        <form className="submit-feedback-form" onSubmit={handleSubmit}>
          <label className="submit-feedback-type">
            <span>Feedback Type:</span>
            <select
              name="feedback_type"
              value={feedbackType}
              onChange={(event) => {
                const nextType = event.target.value as FeedbackType;
                setFeedbackType(nextType);
                setRating(0);
                if (nextType === 'event') {
                  setSelectedEventId(joinedEvents[0] ? getRegisteredEventId(joinedEvents[0]) : '');
                } else {
                  setSelectedEventId('');
                }
              }}
            >
              <option value="event">Event</option>
              <option value="general">General</option>
              <option value="issue">Issue</option>
            </select>
          </label>

          {feedbackType === 'event' && (
            <label className="submit-feedback-event">
              <span>Event Name:</span>
              <select
                name="event_name"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={loadingEvents || !joinedEvents.length}
              >
                {loadingEvents ? (
                  <option value="">Loading events…</option>
                ) : joinedEvents.length ? (
                  joinedEvents.map((registeredEvent) => {
                    const eventLabel =
                      registeredEvent.name ||
                      (registeredEvent as RegisteredEvent & { eventName?: string }).eventName ||
                      'Event Name';

                    return (
                      <option
                        value={getRegisteredEventId(registeredEvent)}
                        key={getRegisteredEventId(registeredEvent)}
                      >
                        {eventLabel}
                      </option>
                    );
                  })
                ) : (
                  <option value="">No joined events yet</option>
                )}
              </select>
            </label>
          )}

          {showRating && (
            <div className="submit-feedback-rating" role="group" aria-label="Rating">
              <span>
                {feedbackType === 'event' ? 'Rating:' : 'System ease of use:'}
              </span>
              <div>
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;

                  return (
                    <button
                      className={starValue <= rating ? 'is-selected' : ''}
                      type="button"
                      aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
                      onClick={() => setRating(starValue)}
                      key={starValue}
                    >
                      {'\u2605'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="submit-feedback-comment">
            <span>Detailed Comment:</span>
            <textarea name="feedback_comment" required disabled={submitting} />
          </label>

          {submitError ? <p className="admin-error">{submitError}</p> : null}

          <button className="submit-feedback-button" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </form>
      </section>

      {showSuccess && (
        <div className="feedback-success-overlay" role="presentation">
          <section
            className="feedback-success-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Feedback submitted"
          >
            <span className="feedback-confetti feedback-confetti--one" aria-hidden="true" />
            <span className="feedback-confetti feedback-confetti--two" aria-hidden="true" />
            <span className="feedback-confetti feedback-confetti--three" aria-hidden="true" />
            <span className="feedback-confetti feedback-confetti--four" aria-hidden="true" />
            <span className="feedback-confetti feedback-confetti--five" aria-hidden="true" />
            <h3>{thankYouMessages[feedbackType]}</h3>
            <p>Your response has been received successfully.</p>
          </section>
        </div>
      )}
    </main>
  );
}
