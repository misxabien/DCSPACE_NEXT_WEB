'use client';

import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { canOrganizeEvents, saveOrganizedEvent } from '@/lib/dc-events';

type ReviewDetails = {
  eventName: string;
  eventType: string;
  eventDescription: string;
  eventDate: string;
  eventEndDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  registrationDeadline: string;
  surveyFormLink: string;
  minAttendance: string;
  gracePeriod: string;
  requiredFiles: string[];
};

const emptyReviewDetails: ReviewDetails = {
  eventName: '',
  eventType: '',
  eventDescription: '',
  eventDate: '',
  eventEndDate: '',
  startTime: '',
  endTime: '',
  venue: '',
  registrationDeadline: '',
  surveyFormLink: '',
  minAttendance: '',
  gracePeriod: '',
  requiredFiles: [],
};

const progressSteps = ['Event Details', 'Attendance Setup', 'Requirements & Files', 'Review & Submit'];
const bannerRatio = 1170 / 504;
const bannerRatioTolerance = 0.05;

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDurationFromTimes(startTime: string, endTime: string) {
  if (!startTime || !endTime) return '';

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return '';

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal < startTotal) endTotal += 24 * 60;

  const totalMinutes = endTotal - startTotal;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = hours > 0 ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '';
  const minuteText = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : '';

  return [hourText, minuteText].filter(Boolean).join(' ') || '0 minutes';
}

function formatDateLabel(value: string) {
  if (!value || value === 'Not provided') return 'Day, Date';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatTimeLabel(value: string) {
  if (!value || value === 'Not provided') return 'Time';

  const [hourValue, minuteValue] = value.split(':');
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function OrganizeForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [reviewDetails, setReviewDetails] = useState<ReviewDetails>(emptyReviewDetails);
  const [requiredFileDrafts, setRequiredFileDrafts] = useState<string[]>(['']);
  const [requiredFilesChoice, setRequiredFilesChoice] = useState<'yes' | 'no'>('yes');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [bannerWarning, setBannerWarning] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const todayDate = getDateInputValue(new Date());
  const totalDuration = getDurationFromTimes(startTime, endTime);
  const requiredFiles = requiredFilesChoice === 'yes' ? requiredFileDrafts.map((file) => file.trim()).filter(Boolean) : [];
  const canAddRequiredFile = requiredFileDrafts.every((file) => file.trim());
  const isReviewStep = progressIndex === progressSteps.length - 1;
  const isFormComplete = isReviewStep ? Boolean(formRef.current?.checkValidity()) : false;

  useEffect(() => {
    setCanCreate(canOrganizeEvents());
  }, []);

  useEffect(() => {
    return () => {
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  const getFormValue = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === 'string' && value.trim() ? value.trim() : 'Not provided';
  };

  const getReviewDetails = () => {
    if (!formRef.current) return emptyReviewDetails;

    const formData = new FormData(formRef.current);

    return {
      eventName: getFormValue(formData, 'event_name'),
      eventType: getFormValue(formData, 'event_type'),
      eventDescription: getFormValue(formData, 'event_description'),
      eventDate: getFormValue(formData, 'event_date'),
      eventEndDate: getFormValue(formData, 'event_end_date'),
      startTime: getFormValue(formData, 'start_time'),
      endTime: getFormValue(formData, 'end_time'),
      venue: getFormValue(formData, 'venue'),
      registrationDeadline: getFormValue(formData, 'registration_deadline'),
      surveyFormLink: getFormValue(formData, 'survey_form_link'),
      minAttendance: getFormValue(formData, 'min_attendance'),
      gracePeriod: getFormValue(formData, 'grace_period'),
      requiredFiles,
    };
  };

  const goToStep = (nextStep: number) => {
    setReviewDetails(getReviewDetails());
    setProgressIndex(Math.min(Math.max(nextStep, 0), progressSteps.length - 1));
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return;
    if (event.target instanceof HTMLTextAreaElement) return;

    event.preventDefault();
    if (progressIndex < progressSteps.length - 1) {
      goToStep(progressIndex + 1);
    }
  };

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setBannerWarning('');
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview('');
    }

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setBannerWarning('Valid file formats: JPG, GIF, PNG.');
      event.target.value = '';
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const ratio = image.width / image.height;

      if (Math.abs(ratio - bannerRatio) > bannerRatioTolerance) {
        setBannerWarning('Event banner must be at least 1170 pixels wide by 504 pixels high.');
      }

      setBannerPreview(imageUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setBannerWarning('Could not read this banner image. Try a JPG, GIF, or PNG.');
      event.target.value = '';
    };
    image.src = imageUrl;
  };

  const addRequiredFile = () => {
    if (requiredFileDrafts.some((file) => !file.trim())) return;

    setRequiredFileDrafts((files) => [...files, '']);
  };

  const updateRequiredFileDraft = (index: number, value: string) => {
    setRequiredFileDrafts((files) => files.map((file, fileIndex) => (fileIndex === index ? value : file)));
  };

  const removeRequiredFileDraft = (index: number) => {
    setRequiredFileDrafts((files) => files.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleRequiredFilesChoice = (choice: 'yes' | 'no') => {
    setRequiredFilesChoice(choice);

    if (choice === 'yes') {
      setRequiredFileDrafts((files) => (files.length ? files : ['']));
      return;
    }

    setRequiredFileDrafts(['']);
  };

  const getOrganizedEventPayload = (status: 'Draft' | 'Pending') => {
    const details = getReviewDetails();

    return {
      eventName: details.eventName,
      eventDate: details.eventDate,
      eventEndDate: details.eventEndDate,
      requiredFiles: details.requiredFiles,
      venue: details.venue,
      courseOrganizer: 'Organization Name',
      school: 'School',
      department: 'School/Department',
      startTime: details.startTime,
      endTime: details.endTime,
      eventType: details.eventType,
      duration: totalDuration,
      minAttendance: details.minAttendance,
      registrationDeadline: details.registrationDeadline,
      status,
    };
  };

  const saveReviewEvent = (status: 'Draft' | 'Pending') => {
    if (!canCreate || !formRef.current?.checkValidity()) return;

    saveOrganizedEvent(getOrganizedEventPayload(status));
    router.push('/events-organized');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveReviewEvent('Pending');
  };

  if (canCreate === null) return null;

  if (!canCreate) {
    return (
      <EmptyState message="Only organization officers can organize and create events. Organization members can browse events, register, and track attendance." />
    );
  }

  return (
    <form
      ref={formRef}
      className={`organize-form-shell organize-form-shell--step-${progressIndex}`}
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      aria-label="Create new event"
      noValidate
    >
      <ol className="organize-progress" aria-label="Create event progress">
        {progressSteps.map((step, index) => (
          <li className={index <= progressIndex ? 'is-active' : ''} key={step}>
            <span className="organize-progress__line" aria-hidden="true" />
            <span className="organize-progress__dot" aria-hidden="true" />
            <span className="organize-progress__label">{step}</span>
          </li>
        ))}
      </ol>

      <div className="form-panel">
        <section className={`wizard-page${progressIndex === 0 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 0}>
          <h2 className="form-group-title">Basic Information</h2>
          <div className="form-flow">
            <label className="form-row form-row--span2">
              <span className="form-row__label">Event Title*</span>
              <input className="input-text" name="event_name" type="text" placeholder="Enter the name of your event" required />
            </label>

            <label className="form-row form-row--span2">
              <span className="form-row__label">Event Type*</span>
              <input className="input-text" name="event_type" type="text" placeholder="Enter what type your event is" required />
            </label>

            <label className="form-row form-row--span2 form-row--textarea">
              <span className="form-row__label">Event Description*</span>
              <textarea
                className="input-text input-textarea"
                name="event_description"
                placeholder="Describe what's special about your event & other important details."
                required
              />
            </label>

            <label className="upload-tile upload-tile--banner">
              <span className="upload-tile__text">Event Banner*</span>
              <input type="file" name="poster" accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif" onChange={handleBannerChange} required />
            </label>
            <p className="banner-hint">
              Event Banner must be at least 1170 pixels wide by 504 pixels high.
              <br />
              Valid file formats: JPG, GIF, PNG.
            </p>
            {bannerWarning && (
              <p className="banner-warning" role="alert">
                {bannerWarning}
              </p>
            )}

            <h2 className="form-group-title form-group-title--span">Schedule &amp; Venue</h2>
            <span className="form-row form-row--session">
              <span className="form-row__label">Session(s)</span>
              <span className="form-row__label form-row__label--inline">Start and End Date*</span>
              <span className="form-row__label form-row__label--inline">Start Time*</span>
              <span className="form-row__label form-row__label--inline">End Time*</span>
              <input
                className="input-inline"
                type="date"
                name="event_date"
                min={todayDate}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
              <input className="input-inline" type="date" name="event_end_date" min={startDate || todayDate} />
              <input className="input-inline" type="time" name="start_time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
              <input className="input-inline" type="time" name="end_time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
            </span>

            <label className="form-row form-row--span2">
              <span className="form-row__label">Where will your event take place?*</span>
              <input className="input-inline" type="text" name="venue" placeholder="Enter the location of the venue" required />
            </label>

            <label className="form-row form-row--span2">
              <span className="form-row__label">Registration deadline*</span>
              <input className="input-inline" type="date" name="registration_deadline" min={todayDate} required />
            </label>

            <h2 className="form-group-title form-group-title--span">Additional Information</h2>
            <label className="form-row form-row--span2">
              <span className="form-row__label">Survey Form Link*</span>
              <input className="input-inline" type="url" name="survey_form_link" placeholder="Enter the survey form link" required />
            </label>
          </div>
        </section>

        <section className={`wizard-page${progressIndex === 1 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 1}>
          <div className="form-flow">
            <h2 className="form-group-title form-group-title--span">Attendance Requirements</h2>
            <label className="form-row form-row--span2">
              <span className="form-row__label">Minimum Attendance Time Required*</span>
              <input className="input-inline" type="text" name="min_attendance" placeholder="Enter the minimum attendance time required" required />
            </label>
            <label className="form-row form-row--span2">
              <span className="form-row__label">Grace Period*</span>
              <input className="input-inline" type="text" name="grace_period" placeholder="Enter the grace period" required />
            </label>
          </div>
        </section>

        <section className={`wizard-page wizard-page--files${progressIndex === 2 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 2}>
          <div className="upload-grid">
            <h2 className="form-group-title upload-grid__title">Event Documents</h2>
            <label className="upload-tile">
              <span className="upload-tile__text">Approved Concept Paper*</span>
              <input type="file" name="concept_paper" accept=".pdf,.png,.jpg,.jpeg" required />
            </label>
            <p className="upload-hint">Valid file formats: PDF, PNG, JPG, JPEG</p>
            <label className="upload-tile">
              <span className="upload-tile__text">Room Reservation Form*</span>
              <input type="file" name="room_reservation" accept=".pdf,.png,.jpg,.jpeg" required />
            </label>
            <p className="upload-hint">Valid file formats: PDF, PNG, JPG, JPEG</p>
            <label className="upload-tile">
              <span className="upload-tile__text">E-Certificate Template*</span>
              <input type="file" name="certificate_template" accept=".pdf,.png,.jpg,.jpeg" required />
            </label>
            <p className="upload-hint">Valid file formats: PDF, PNG, JPG, JPEG</p>
          </div>

          <section className="required-files" aria-labelledby="required-files-title">
            <h2 id="required-files-title">File Requirements</h2>
            <fieldset className="required-files__choice">
              <legend className="required-files__legend">Required participant files</legend>
              <span className="required-files__question">Are participants required to submit any files before joining the event?</span>
              <label>
                <input
                  type="radio"
                  name="has_required_files"
                  value="yes"
                  checked={requiredFilesChoice === 'yes'}
                  onChange={() => handleRequiredFilesChoice('yes')}
                />
                <span>Yes</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="has_required_files"
                  value="no"
                  checked={requiredFilesChoice === 'no'}
                  onChange={() => handleRequiredFilesChoice('no')}
                />
                <span>No</span>
              </label>
            </fieldset>

            {requiredFilesChoice === 'yes' && (
              <>
                <div className="required-files__list">
                  {requiredFileDrafts.map((fileName, index) => {
                    const inputId = `required-file-name-${index}`;

                    return (
                      <div className="required-files__row" key={inputId}>
                        <label className="form-row__label" htmlFor={inputId}>
                          File Name*
                        </label>
                        <input
                          className="required-files__input"
                          id={inputId}
                          type="text"
                          value={fileName}
                          placeholder="Enter the required file name"
                          autoComplete="off"
                          required={index === 0}
                          onChange={(event) => updateRequiredFileDraft(index, event.target.value)}
                        />
                        <span className="required-files__controls">
                          {index > 0 && (
                            <button
                              className="required-files__remove"
                              type="button"
                              onClick={() => removeRequiredFileDraft(index)}
                              aria-label="Remove required file"
                            >
                              <span aria-hidden="true">-</span>
                            </button>
                          )}
                          {index === requiredFileDrafts.length - 1 && (
                            <button
                              className="required-files__add"
                              type="button"
                              onClick={addRequiredFile}
                              disabled={!canAddRequiredFile}
                              aria-label="Add required file"
                            >
                              <img src="/svg icons organized events page/svg icons create event form page/plus-file-icon.svg" alt="" aria-hidden="true" />
                            </button>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </section>

        <section className={`wizard-page${progressIndex === 3 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 3}>
          <h2 className="review-page__heading">
            Nearly there! Check <span>if everything&apos;s correct.</span>
          </h2>
          {!isFormComplete && (
            <p className="review-page__warning" role="status">
              Complete all required details to create the event.
            </p>
          )}
          <article className="review-event-card">
            <div className="review-event-card__banner">
              {bannerPreview ? <img src={bannerPreview} alt="" /> : <span />}
            </div>
            <div className="review-event-card__content">
              <div>
                <h2>{reviewDetails.eventName === 'Not provided' ? 'Event Title' : reviewDetails.eventName}</h2>
                <section>
                  <h3>Date &amp; Time</h3>
                  <p>{formatDateLabel(reviewDetails.eventDate)}</p>
                  <p>
                    {formatTimeLabel(reviewDetails.startTime)} - {formatTimeLabel(reviewDetails.endTime)}
                  </p>
                </section>
                <section>
                  <h3>Location</h3>
                  <p>{reviewDetails.venue === 'Not provided' ? 'Event Venue' : reviewDetails.venue}</p>
                </section>
                <section>
                  <h3>Hosted By</h3>
                  <p>Organization Name</p>
                  <p>Course</p>
                  <p>School/Department</p>
                </section>
                <section>
                  <h3>Event Requirements</h3>
                  <p>Attendance Time Requirement: {reviewDetails.minAttendance}</p>
                  <p>Grace Period: {reviewDetails.gracePeriod}</p>
                  <p>Required File(s): {reviewDetails.requiredFiles.length ? reviewDetails.requiredFiles.join(', ') : 'None'}</p>
                </section>
                <section>
                  <h3>Event Description</h3>
                  <p>{reviewDetails.eventDescription === 'Not provided' ? 'Event description will appear here.' : reviewDetails.eventDescription}</p>
                </section>
              </div>
              <aside>
                <button className="btn-submit" type="button">
                  Attend Event
                </button>
                <small>Registration Deadline:</small>
                <strong>{formatDateLabel(reviewDetails.registrationDeadline)}</strong>
              </aside>
            </div>
          </article>
        </section>

        <div className="form-actions" key={`organize-actions-${progressIndex}`}>
          {progressIndex > 0 && (
            <button type="button" className="btn-back" onClick={() => goToStep(progressIndex - 1)}>
              Go back to {progressSteps[progressIndex - 1]}
            </button>
          )}
          {progressIndex < progressSteps.length - 1 ? (
            <button type="button" className="btn-submit" onClick={() => goToStep(progressIndex + 1)}>
              Save &amp; Continue
            </button>
          ) : (
            <>
              <button type="button" className="btn-review" onClick={() => saveReviewEvent('Draft')} disabled={!isFormComplete}>
                Save for Later
              </button>
              <button type="submit" className="btn-submit" disabled={!isFormComplete}>
                Create Event
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
