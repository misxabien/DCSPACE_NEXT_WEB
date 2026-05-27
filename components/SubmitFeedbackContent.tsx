'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { getRegisteredEventId, type RegisteredEvent } from '@/lib/attendance';
import { loadRegisteredEvents } from '@/lib/user-data';
=======
import { getRegisteredEventId, readRegisteredEvents, type RegisteredEvent } from '@/lib/attendance';
>>>>>>> origin/frontend-user

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

  useEffect(() => {
    const refreshJoinedEvents = () => {
<<<<<<< HEAD
      void loadRegisteredEvents().then((events) => {
        setJoinedEvents(events);
        setSelectedEventId((currentEventId) => currentEventId || (events[0] ? getRegisteredEventId(events[0]) : ''));
      });
    };

    void refreshJoinedEvents();
=======
      const events = readRegisteredEvents();

      setJoinedEvents(events);
      setSelectedEventId((currentEventId) => currentEventId || (events[0] ? getRegisteredEventId(events[0]) : ''));
    };

    refreshJoinedEvents();
>>>>>>> origin/frontend-user
    window.addEventListener('pageshow', refreshJoinedEvents);
    window.addEventListener('storage', refreshJoinedEvents);
    window.addEventListener('dcspace-registered-events-updated', refreshJoinedEvents);

    return () => {
      window.removeEventListener('pageshow', refreshJoinedEvents);
      window.removeEventListener('storage', refreshJoinedEvents);
      window.removeEventListener('dcspace-registered-events-updated', refreshJoinedEvents);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSuccess(true);
    window.setTimeout(() => router.push('/my-profile'), 2200);
  };

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
                if (nextType !== 'event') {
                  setRating(0);
                  setSelectedEventId('');
                } else {
                  setSelectedEventId(joinedEvents[0] ? getRegisteredEventId(joinedEvents[0]) : '');
                }
              }}
            >
              <option value="event">Event</option>
              <option value="general">General</option>
              <option value="issue">Issue</option>
            </select>
          </label>

          {feedbackType === 'event' && (
            <>
              <label className="submit-feedback-event">
                <span>Event Name:</span>
                <select
                  name="event_name"
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  disabled={!joinedEvents.length}
                >
                  {joinedEvents.length ? (
                    joinedEvents.map((event) => {
                      const eventLabel = event.name || (event as RegisteredEvent & { eventName?: string }).eventName || 'Event Name';

                      return (
                        <option value={getRegisteredEventId(event)} key={getRegisteredEventId(event)}>
                          {eventLabel}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No joined events yet</option>
                  )}
                </select>
              </label>

              <div className="submit-feedback-rating" role="group" aria-label="Rating">
                <span>Rating:</span>
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
            </>
          )}

          <label className="submit-feedback-comment">
            <span>Detailed Comment:</span>
            <textarea name="feedback_comment" required />
          </label>

          <button className="submit-feedback-button" type="submit">
            Send Feedback
          </button>
        </form>
      </section>

      {showSuccess && (
        <div className="feedback-success-overlay" role="presentation">
          <section className="feedback-success-modal" role="dialog" aria-modal="true" aria-label="Feedback submitted">
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
