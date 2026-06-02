'use client';

import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { getCurrentAttendanceUser } from '@/lib/attendance';
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
  hasRegistrationDeadline: 'yes' | 'no' | '';
  registrationDeadline: string;
  surveyFormLink: string;
  announcements: string;
  minAttendance: string;
  gracePeriod: string;
  attendanceAccess: 'all' | 'specific';
  allowedCourses: string[];
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
  hasRegistrationDeadline: '',
  registrationDeadline: '',
  surveyFormLink: '',
  announcements: '',
  minAttendance: '',
  gracePeriod: '',
  attendanceAccess: 'all',
  allowedCourses: [],
  requiredFiles: [],
};

const progressSteps = ['Event Details', 'Attendance Setup', 'Requirements & Files', 'Review & Submit'];
const bannerRatio = 1170 / 504;
const bannerRatioTolerance = 0.05;
const courseOptions = [
  'BSN',
  'BSRT',
  'BSPT',
  'BS Bio',
  'BS Pharm',
  'BS MLS',
  'BSA',
  'BS Psych',
  'BEEd',
  'BSEd',
  'BSBA-FM',
  'BSBA-MM',
  'BSTM',
  'BMA',
  'BSIT',
];

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

function formatDateRangeLabel(startValue: string, endValue: string) {
  const startLabel = formatDateLabel(startValue);
  const endLabel = formatDateLabel(endValue);

  if (!endValue || endValue === 'Not provided' || startValue === endValue) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
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
  const warningRef = useRef<HTMLParagraphElement>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [reviewDetails, setReviewDetails] = useState<ReviewDetails>(emptyReviewDetails);
  const [requiredFileDrafts, setRequiredFileDrafts] = useState<string[]>(['']);
  const [requiredFilesChoice, setRequiredFilesChoice] = useState<'yes' | 'no'>('yes');
  const [registrationDeadlineChoice, setRegistrationDeadlineChoice] = useState<'yes' | 'no' | ''>('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [bannerWarning, setBannerWarning] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerDataUrl, setBannerDataUrl] = useState('');
  const [attendanceAccess, setAttendanceAccess] = useState<'all' | 'specific'>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const todayDate = getDateInputValue(new Date());
  const totalDuration = getDurationFromTimes(startTime, endTime);
  const requiredFiles = requiredFilesChoice === 'yes' ? requiredFileDrafts.map((file) => file.trim()).filter(Boolean) : [];
  const canAddRequiredFile = requiredFileDrafts.every((file) => file.trim());
  const currentUser = typeof window === 'undefined' ? null : getCurrentAttendanceUser();
  const hostOrganization = currentUser?.organizationPart || 'Organization Name';
  const hostCourse = currentUser?.course || 'Course';
  const hostDepartment = currentUser?.school || 'School/Department';

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

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const scrollToWarningAndAnimate = () => {
    if (warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      warningRef.current.classList.add('animate-pop');
      setTimeout(() => {
        warningRef.current?.classList.remove('animate-pop');
      }, 500);
    }
  };

  const validateStep = (stepIndex: number, shouldScroll: boolean = false): boolean => {
    const form = formRef.current;
    if (!form) return false;

    const errors: Record<string, string> = {};
    const formData = new FormData(form);

    if (stepIndex === 0) {
      const eventName = formData.get('event_name');
      if (!eventName || !eventName.toString().trim()) {
        errors.event_name = 'Please provide Event Title.';
      }

      const eventType = formData.get('event_type');
      if (!eventType || !eventType.toString().trim()) {
        errors.event_type = 'Please provide Event Type.';
      }

      const eventDescription = formData.get('event_description');
      if (!eventDescription || !eventDescription.toString().trim()) {
        errors.event_description = 'Please provide Event Description.';
      }

      const banner = formData.get('poster');
      if (!banner || (banner instanceof File && !banner.name)) {
        errors.poster = 'Please provide Event Banner.';
      }

      const eventDate = formData.get('event_date');
      if (!eventDate || !eventDate.toString().trim()) {
        errors.event_date = 'Please provide Start Date.';
      }

      const startTimeValue = formData.get('start_time');
      if (!startTimeValue || !startTimeValue.toString().trim()) {
        errors.start_time = 'Please provide Start Time.';
      }

      const endTimeValue = formData.get('end_time');
      if (!endTimeValue || !endTimeValue.toString().trim()) {
        errors.end_time = 'Please provide End Time.';
      }

      const venue = formData.get('venue');
      if (!venue || !venue.toString().trim()) {
        errors.venue = 'Please provide Venue.';
      }

      if (registrationDeadlineChoice === '') {
        errors.has_registration_deadline = 'Please select if there is a registration deadline.';
      }

      if (registrationDeadlineChoice === 'yes') {
        const deadline = formData.get('registration_deadline');
        if (!deadline || !deadline.toString().trim()) {
          errors.registration_deadline = 'Please provide Registration Deadline.';
        }
      }
    }

    if (stepIndex === 1) {
      const minAttendance = formData.get('min_attendance');
      if (!minAttendance || !minAttendance.toString().trim()) {
        errors.min_attendance = 'Please provide Minimum Attendance Time Required.';
      }

      const gracePeriod = formData.get('grace_period');
      if (!gracePeriod || !gracePeriod.toString().trim()) {
        errors.grace_period = 'Please provide Grace Period.';
      }

      if (attendanceAccess === 'specific' && selectedCourses.length === 0) {
        errors.selected_courses = 'Please provide at least one course.';
      }
    }

    if (stepIndex === 2) {
      const conceptPaper = formData.get('concept_paper');
      if (!conceptPaper || (conceptPaper instanceof File && !conceptPaper.name)) {
        errors.concept_paper = 'Please provide Approved Concept Paper.';
      }

      const roomReservation = formData.get('room_reservation');
      if (!roomReservation || (roomReservation instanceof File && !roomReservation.name)) {
        errors.room_reservation = 'Please provide Room Reservation Form.';
      }

      const certificateTemplate = formData.get('certificate_template');
      if (!certificateTemplate || (certificateTemplate instanceof File && !certificateTemplate.name)) {
        errors.certificate_template = 'Please provide E-Certificate Template.';
      }

      if (requiredFilesChoice === 'yes') {
        const emptyFileIndex = requiredFileDrafts.findIndex((file) => !file.trim());
        if (emptyFileIndex !== -1) {
          errors[`required_file_${emptyFileIndex}`] = 'Please provide file name required.';
        }
      }
    }

    setFieldErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));
    
    if (Object.keys(errors).length > 0 && shouldScroll) {
      scrollToWarningAndAnimate();
      return false;
    }
    
    return Object.keys(errors).length === 0;
  };

  const getFormValue = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === 'string' && value.trim() ? value.trim() : 'Not provided';
  };

  const getOptionalFormValue = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
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
      hasRegistrationDeadline: registrationDeadlineChoice,
      registrationDeadline: registrationDeadlineChoice === 'yes' ? getFormValue(formData, 'registration_deadline') : '',
      surveyFormLink: getOptionalFormValue(formData, 'survey_form_link'),
      announcements: getOptionalFormValue(formData, 'announcements'),
      minAttendance: getFormValue(formData, 'min_attendance'),
      gracePeriod: getFormValue(formData, 'grace_period'),
      attendanceAccess,
      allowedCourses: attendanceAccess === 'specific' ? selectedCourses : [],
      requiredFiles,
    };
  };

  const checkFormCompletion = (): boolean => {
    if (!formRef.current) return false;
    
    const formData = new FormData(formRef.current);
    
    const eventName = formData.get('event_name');
    const eventType = formData.get('event_type');
    const eventDescription = formData.get('event_description');
    const banner = formData.get('poster');
    const eventDate = formData.get('event_date');
    const startTimeValue = formData.get('start_time');
    const endTimeValue = formData.get('end_time');
    const venue = formData.get('venue');
    
    const hasEventDetailsComplete = !!(eventName && eventName.toString().trim() &&
      eventType && eventType.toString().trim() &&
      eventDescription && eventDescription.toString().trim() &&
      banner && (banner instanceof File && banner.name) &&
      eventDate && eventDate.toString().trim() &&
      startTimeValue && startTimeValue.toString().trim() &&
      endTimeValue && endTimeValue.toString().trim() &&
      venue && venue.toString().trim());
    
    const minAttendance = formData.get('min_attendance');
    const gracePeriod = formData.get('grace_period');
    const hasAttendanceComplete = !!(minAttendance && minAttendance.toString().trim() &&
      gracePeriod && gracePeriod.toString().trim() &&
      (attendanceAccess === 'all' || (attendanceAccess === 'specific' && selectedCourses.length > 0)));
    
    const conceptPaper = formData.get('concept_paper');
    const roomReservation = formData.get('room_reservation');
    const certificateTemplate = formData.get('certificate_template');
    
    let hasRequirementsComplete = !!(conceptPaper && (conceptPaper instanceof File && conceptPaper.name) &&
      roomReservation && (roomReservation instanceof File && roomReservation.name) &&
      certificateTemplate && (certificateTemplate instanceof File && certificateTemplate.name));
    
    if (requiredFilesChoice === 'yes') {
      const allFilesHaveNames = requiredFileDrafts.every((file) => file.trim() !== '');
      hasRequirementsComplete = hasRequirementsComplete && allFilesHaveNames;
    }
    
    return hasEventDetailsComplete && hasAttendanceComplete && hasRequirementsComplete;
  };

  const isFormComplete = checkFormCompletion();

  const goToStep = (nextStep: number) => {
    if (nextStep > progressIndex) {
      validateStep(progressIndex);
    }
    
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
    clearFieldError('poster');
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview('');
    }
    setBannerDataUrl('');

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

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          setBannerDataUrl(reader.result);
        }
      });
      reader.readAsDataURL(file);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      setBannerWarning('Could not read this banner image. Try a JPG, GIF, or PNG.');
      event.target.value = '';
    };
    image.src = imageUrl;
  };

  const addRequiredFile = () => {
    if (!canAddRequiredFile) {
      const emptyIndex = requiredFileDrafts.findIndex((file) => !file.trim());
      if (emptyIndex !== -1) {
        setFieldErrors((prev) => ({
          ...prev,
          [`required_file_${emptyIndex}`]: 'Please provide file name required.'
        }));
      }
      scrollToWarningAndAnimate();
      return;
    }

    setRequiredFileDrafts((files) => [...files, '']);
  };

  const updateRequiredFileDraft = (index: number, value: string) => {
    setRequiredFileDrafts((files) => files.map((file, fileIndex) => (fileIndex === index ? value : file)));
    clearFieldError(`required_file_${index}`);
  };

  const removeRequiredFileDraft = (index: number) => {
    setRequiredFileDrafts((files) => files.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleRequiredFilesChoice = (choice: 'yes' | 'no') => {
    setRequiredFilesChoice(choice);
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith('required_file_')) {
          delete next[key];
        }
      });
      return next;
    });

    if (choice === 'yes') {
      setRequiredFileDrafts((files) => (files.length ? files : ['']));
      return;
    }

    setRequiredFileDrafts(['']);
  };

  const handleRegistrationDeadlineChoice = (choice: 'yes' | 'no') => {
    setRegistrationDeadlineChoice(choice);
    clearFieldError('has_registration_deadline');
    if (choice === 'no') {
      setRegistrationDeadline('');
      clearFieldError('registration_deadline');
    }
  };

  const handleAttendanceAccessChange = (access: 'all' | 'specific') => {
    setAttendanceAccess(access);
    clearFieldError('selected_courses');

    if (access === 'all') {
      setSelectedCourses([]);
      setIsCourseDropdownOpen(false);
    }
  };

  const toggleSelectedCourse = (course: string) => {
    setSelectedCourses((courses) =>
      courses.includes(course) ? courses.filter((selectedCourse) => selectedCourse !== course) : [...courses, course],
    );
    clearFieldError('selected_courses');
  };

  const getOrganizedEventPayload = (status: 'Draft' | 'Pending') => {
    const details = getReviewDetails();

    return {
      eventName: details.eventName,
      eventDescription: details.eventDescription,
      eventDate: details.eventDate,
      eventEndDate: details.eventEndDate,
      requiredFiles: details.requiredFiles,
      venue: details.venue,
      courseOrganizer: hostOrganization,
      organizerCourse: hostCourse,
      school: hostDepartment,
      department: hostDepartment,
      startTime: details.startTime,
      endTime: details.endTime,
      eventType: details.eventType,
      duration: totalDuration,
      minAttendance: details.minAttendance,
      attendanceAccess: details.attendanceAccess,
      allowedCourses: details.allowedCourses,
      registrationDeadline: details.registrationDeadline,
      surveyFormLink: details.surveyFormLink,
      announcements: details.announcements,
      bannerDataUrl,
      status,
    };
  };

  const saveReviewEvent = (status: 'Draft' | 'Pending') => {
    if (!canCreate) return;
    
    if (!validateStep(0, true) || !validateStep(1, true) || !validateStep(2, true)) {
      setProgressIndex(0);
      scrollToWarningAndAnimate();
      return;
    }

    if (!formRef.current?.checkValidity()) {
      scrollToWarningAndAnimate();
      return;
    }

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
            <label className={`form-row form-row--span2${fieldErrors.event_name ? ' has-error' : ''}`}>
              <span className="form-row__label">Event Title*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  className="input-text" 
                  name="event_name" 
                  type="text" 
                  placeholder="Enter the name of your event" 
                  required 
                  onChange={() => clearFieldError('event_name')}
                />
                {fieldErrors.event_name && <span className="field-error-message">{fieldErrors.event_name}</span>}
              </div>
            </label>

            <label className={`form-row form-row--span2${fieldErrors.event_type ? ' has-error' : ''}`}>
              <span className="form-row__label">Event Type*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  className="input-text" 
                  name="event_type" 
                  type="text" 
                  placeholder="Enter what type your event is" 
                  required 
                  onChange={() => clearFieldError('event_type')}
                />
                {fieldErrors.event_type && <span className="field-error-message">{fieldErrors.event_type}</span>}
              </div>
            </label>

            <label className={`form-row form-row--span2 form-row--textarea${fieldErrors.event_description ? ' has-error' : ''}`}>
              <span className="form-row__label">Event Description*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <textarea
                  className="input-text input-textarea"
                  name="event_description"
                  placeholder="Describe what's special about your event & other important details."
                  required
                  onChange={() => clearFieldError('event_description')}
                />
                {fieldErrors.event_description && <span className="field-error-message">{fieldErrors.event_description}</span>}
              </div>
            </label>

            <label className={`upload-tile upload-tile--banner${fieldErrors.poster ? ' has-error' : ''}`}>
              <span className="upload-tile__text">Event Banner*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  type="file" 
                  name="poster" 
                  accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif" 
                  onChange={handleBannerChange} 
                  required 
                />
                {fieldErrors.poster && <span className="field-error-message" style={{ marginLeft: 0 }}>{fieldErrors.poster}</span>}
              </div>
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
              <span className="form-row__label">Session(s)*</span>
              <span className="session-fields">
                <span className="session-field">
                  <span className="form-row__label form-row__label--inline">Date(s)</span>
                  <span className="date-fields date-fields--range">
                    <div className={`date-field${fieldErrors.event_date ? ' has-error' : ''}`}>
                      <span>Start Date</span>
                      <input
                        className="input-inline"
                        type="date"
                        name="event_date"
                        min={todayDate}
                        value={startDate}
                        onChange={(event) => {
                          const nextStartDate = event.target.value;
                          setStartDate(nextStartDate);
                          clearFieldError('event_date');
                          if (endDate && nextStartDate && endDate < nextStartDate) {
                            setEndDate('');
                          }
                        }}
                      />
                      {fieldErrors.event_date && <span className="field-error-message" style={{ fontWeight: 500 }}>{fieldErrors.event_date}</span>}
                    </div>
                    <div className="date-field">
                      <span>End Date</span>
                      <input
                        className="input-inline"
                        type="date"
                        name="event_end_date"
                        min={startDate || todayDate}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </div>
                  </span>
                </span>
                <span className="session-field">
                  <span className="form-row__label form-row__label--inline">Time</span>
                  <span className="time-pair">
                    <label className={`date-field${fieldErrors.start_time ? ' has-error' : ''}`}>
                      <span>Start Time</span>
                      <input 
                        className="input-inline" 
                        type="time" 
                        name="start_time" 
                        value={startTime} 
                        onChange={(event) => {
                          setStartTime(event.target.value);
                          clearFieldError('start_time');
                        }} 
                        required 
                      />
                      {fieldErrors.start_time && <span className="field-error-message" style={{ fontWeight: 500 }}>{fieldErrors.start_time}</span>}
                    </label>
                    <label className={`date-field${fieldErrors.end_time ? ' has-error' : ''}`}>
                      <span>End Time</span>
                      <input 
                        className="input-inline" 
                        type="time" 
                        name="end_time" 
                        value={endTime} 
                        onChange={(event) => {
                          setEndTime(event.target.value);
                          clearFieldError('end_time');
                        }} 
                        required 
                      />
                      {fieldErrors.end_time && <span className="field-error-message" style={{ fontWeight: 500 }}>{fieldErrors.end_time}</span>}
                    </label>
                  </span>
                </span>
              </span>
            </span>

            <label className={`form-row form-row--span2${fieldErrors.venue ? ' has-error' : ''}`}>
              <span className="form-row__label">Where will your event take place?*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  className="input-inline" 
                  type="text" 
                  name="venue" 
                  placeholder="Enter the location of the venue" 
                  required 
                  onChange={() => clearFieldError('venue')}
                />
                {fieldErrors.venue && <span className="field-error-message">{fieldErrors.venue}</span>}
              </div>
            </label>

            <div className={`form-row form-row--span2 deadline-choice${fieldErrors.has_registration_deadline ? ' has-error' : ''}`}>
              <span className="form-row__label" id="registration-deadline-choice-label">
                Is there a deadline for the registration?*
              </span>
              <span className="deadline-choice__body" role="radiogroup" aria-labelledby="registration-deadline-choice-label">
                <label>
                  <input
                    type="radio"
                    name="has_registration_deadline"
                    value="yes"
                    checked={registrationDeadlineChoice === 'yes'}
                    required
                    onChange={() => handleRegistrationDeadlineChoice('yes')}
                  />
                  <span>Yes</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="has_registration_deadline"
                    value="no"
                    checked={registrationDeadlineChoice === 'no'}
                    required
                    onChange={() => handleRegistrationDeadlineChoice('no')}
                  />
                  <span>No</span>
                </label>
              </span>
              {fieldErrors.has_registration_deadline && <span className="field-error-message" style={{ gridColumn: 2, marginTop: 4 }}>{fieldErrors.has_registration_deadline}</span>}
            </div>

            {registrationDeadlineChoice === 'yes' && (
              <label className={`form-row form-row--span2${fieldErrors.registration_deadline ? ' has-error' : ''}`}>
                <span className="form-row__label">Registration deadline*</span>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <input
                    className="input-inline"
                    type="date"
                    name="registration_deadline"
                    min={todayDate}
                    value={registrationDeadline}
                    required
                    onChange={(event) => {
                      setRegistrationDeadline(event.target.value);
                      clearFieldError('registration_deadline');
                    }}
                  />
                  {fieldErrors.registration_deadline && <span className="field-error-message">{fieldErrors.registration_deadline}</span>}
                </div>
              </label>
            )}

            <h2 className="form-group-title form-group-title--span">Additional Information</h2>
            <label className="form-row form-row--span2">
              <span className="form-row__label">Survey Form Link</span>
              <input className="input-inline" type="url" name="survey_form_link" placeholder="Enter the survey form link" />
            </label>
            <label className="form-row form-row--span2 form-row--textarea">
              <span className="form-row__label">Announcements</span>
              <textarea
                className="input-text input-textarea input-textarea--announcements"
                name="announcements"
                placeholder="Enter any important updates or announcements."
              />
            </label>
          </div>
        </section>

        <section className={`wizard-page${progressIndex === 1 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 1}>
          <div className="form-flow">
            <h2 className="form-group-title form-group-title--span">Attendance Requirements</h2>
            <label className={`form-row form-row--span2${fieldErrors.min_attendance ? ' has-error' : ''}`}>
              <span className="form-row__label">Minimum Attendance Time Required*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  className="input-inline" 
                  type="text" 
                  name="min_attendance" 
                  placeholder="Enter the minimum attendance time required" 
                  onChange={() => clearFieldError('min_attendance')}
                />
                {fieldErrors.min_attendance && <span className="field-error-message">{fieldErrors.min_attendance}</span>}
              </div>
            </label>
            
            <label className={`form-row form-row--span2${fieldErrors.grace_period ? ' has-error' : ''}`}>
              <span className="form-row__label">Grace Period*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  className="input-inline" 
                  type="text" 
                  name="grace_period" 
                  placeholder="Enter the grace period" 
                  onChange={() => clearFieldError('grace_period')}
                />
                {fieldErrors.grace_period && <span className="field-error-message">{fieldErrors.grace_period}</span>}
              </div>
            </label>
            
            <div className={`form-row form-row--span2 attendance-access${fieldErrors.selected_courses ? ' has-error' : ''}`}>
              <span className="form-row__label">Who can attend this event?*</span>
              <div className="attendance-access__body">
                <div className="attendance-access__choices">
                  <label>
                    <input
                      type="radio"
                      name="attendance_access"
                      value="all"
                      checked={attendanceAccess === 'all'}
                      onChange={() => handleAttendanceAccessChange('all')}
                    />
                    <span>All Courses</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="attendance_access"
                      value="specific"
                      checked={attendanceAccess === 'specific'}
                      onChange={() => handleAttendanceAccessChange('specific')}
                    />
                    <span>Specific Courses Only</span>
                  </label>
                </div>

                {attendanceAccess === 'specific' && (
                  <div className="course-multiselect">
                    <input
                      className="course-multiselect__validator"
                      type="text"
                      name="selected_courses"
                      value={selectedCourses.join(', ')}
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <button
                      className={`course-multiselect__button${fieldErrors.selected_courses ? ' has-error' : ''}`}
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isCourseDropdownOpen}
                      onClick={() => setIsCourseDropdownOpen((isOpen) => !isOpen)}
                    >
                      <span>{selectedCourses.length ? selectedCourses.join(', ') : 'Please select the course'}</span>
                      <span aria-hidden="true">⌄</span>
                    </button>

                    {isCourseDropdownOpen && (
                      <div className="course-multiselect__menu" role="listbox" aria-label="Select courses">
                        {courseOptions.map((course) => (
                          <label className="course-multiselect__option" key={course}>
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course)}
                              onChange={() => toggleSelectedCourse(course)}
                            />
                            <span>{course}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {fieldErrors.selected_courses && <span className="field-error-message">{fieldErrors.selected_courses}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className={`wizard-page wizard-page--files${progressIndex === 2 ? ' is-active' : ''}`} aria-hidden={progressIndex !== 2}>
          <div className="upload-grid">
            <h2 className="form-group-title upload-grid__title">Event Documents</h2>
            <label className={`upload-tile${fieldErrors.concept_paper ? ' has-error' : ''}`}>
              <span className="upload-tile__text">Approved Concept Paper*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  type="file" 
                  name="concept_paper" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  required 
                  onChange={() => clearFieldError('concept_paper')}
                />
                {fieldErrors.concept_paper && <span className="field-error-message">{fieldErrors.concept_paper}</span>}
              </div>
            </label>
            <p className="upload-hint">Valid file formats: PDF, PNG, JPG, JPEG</p>
            <label className={`upload-tile${fieldErrors.room_reservation ? ' has-error' : ''}`}>
              <span className="upload-tile__text">Room Reservation Form*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  type="file" 
                  name="room_reservation" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  required 
                  onChange={() => clearFieldError('room_reservation')}
                />
                {fieldErrors.room_reservation && <span className="field-error-message">{fieldErrors.room_reservation}</span>}
              </div>
            </label>
            <p className="upload-hint">Valid file formats: PDF, PNG, JPG, JPEG</p>
            <label className={`upload-tile${fieldErrors.certificate_template ? ' has-error' : ''}`}>
              <span className="upload-tile__text">E-Certificate Template*</span>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <input 
                  type="file" 
                  name="certificate_template" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  required 
                  onChange={() => clearFieldError('certificate_template')}
                />
                {fieldErrors.certificate_template && <span className="field-error-message">{fieldErrors.certificate_template}</span>}
              </div>
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
                    const hasError = fieldErrors[`required_file_${index}`];

                    return (
                      <div className={`required-files__row${hasError ? ' has-error' : ''}`} key={inputId}>
                        <label className="form-row__label" htmlFor={inputId}>
                          File Name*
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <input
                            className={`required-files__input${hasError ? ' has-error' : ''}`}
                            id={inputId}
                            type="text"
                            value={fileName}
                            placeholder="Enter the required file name"
                            autoComplete="off"
                            required={index === 0}
                            onChange={(event) => updateRequiredFileDraft(index, event.target.value)}
                          />
                          {hasError && <span className="field-error-message">{hasError}</span>}
                        </div>
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
          <p 
            ref={warningRef}
            className={`review-page__warning${!isFormComplete ? ' review-page__warning--error' : ''}`} 
            role="status"
          >
            Complete all required details to create the event.
          </p>
          <article className="review-event-card">
            <div className="review-event-card__banner">
              {bannerPreview ? <img src={bannerPreview} alt="" /> : <span />}
            </div>
            <div className="review-event-card__content">
              <div>
                <h2>{reviewDetails.eventName === 'Not provided' ? 'Event Title' : reviewDetails.eventName}</h2>
                <section>
                  <h3>Date &amp; Time</h3>
                  <p>{formatDateRangeLabel(reviewDetails.eventDate, reviewDetails.eventEndDate)}</p>
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
                  <p>{hostOrganization}</p>
                  <p>{hostCourse}</p>
                  <p>{hostDepartment}</p>
                </section>
                <section>
                  <h3>Event Requirements</h3>
                  <p>Attendance Time Requirement: {reviewDetails.minAttendance}</p>
                  <p>Grace Period: {reviewDetails.gracePeriod}</p>
                  <p>
                    Eligible Courses:{' '}
                    {reviewDetails.attendanceAccess === 'specific' && reviewDetails.allowedCourses.length
                      ? reviewDetails.allowedCourses.join(', ')
                      : 'All Courses'}
                  </p>
                  <p>Required File(s): {reviewDetails.requiredFiles.length ? reviewDetails.requiredFiles.join(', ') : 'None'}</p>
                </section>
                {(reviewDetails.surveyFormLink || reviewDetails.announcements) && (
                  <section>
                    <h3>Additional Information</h3>
                    {reviewDetails.surveyFormLink && <p>Survey Form Link: {reviewDetails.surveyFormLink}</p>}
                    {reviewDetails.announcements && <p>Announcements: {reviewDetails.announcements}</p>}
                  </section>
                )}
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
                <strong>
                  {reviewDetails.hasRegistrationDeadline === 'yes'
                    ? formatDateLabel(reviewDetails.registrationDeadline)
                    : 'No deadline'}
                </strong>
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
              <button 
                type="button" 
                className="btn-review" 
                onClick={() => saveReviewEvent('Draft')}
                disabled={!isFormComplete}
              >
                Save for Later
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={!isFormComplete}
              >
                Create Event
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}