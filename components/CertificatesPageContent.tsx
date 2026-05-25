'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { DateRangeCalendarPicker } from '@/components/DateRangeCalendarPicker';
import {
  ATTENDANCE_UPDATED_EVENT,
  type AttendanceRecord,
  type RegisteredEvent,
  formatEventDate,
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
} from '@/lib/attendance';

const filters = ['All', 'Yesterday', 'This Week', 'Pick a date'];

type CertificateCard = {
  id: string;
  certificateName: string;
  eventName: string;
  issuedDate: string;
  issuedDateValue: string;
  imageSrc: string;
  isPlaceholder?: boolean;
};

const certificateTemplateSrc = '/certificates/default-template.png';
const placeholderCertificates: CertificateCard[] = [
  {
    id: 'template-certificate-1',
    certificateName: 'Certificate Name',
    eventName: 'Event Name',
    issuedDate: 'Date Issued',
    issuedDateValue: getDateInputValue(new Date()),
    imageSrc: certificateTemplateSrc,
    isPlaceholder: true,
  },
  {
    id: 'template-certificate-2',
    certificateName: 'Certificate Name',
    eventName: 'Event Name',
    issuedDate: 'Date Issued',
    issuedDateValue: getDateInputValue(new Date()),
    imageSrc: certificateTemplateSrc,
    isPlaceholder: true,
  },
  {
    id: 'template-certificate-3',
    certificateName: 'Certificate Name',
    eventName: 'Event Name',
    issuedDate: 'Date Issued',
    issuedDateValue: getDateInputValue(new Date()),
    imageSrc: certificateTemplateSrc,
    isPlaceholder: true,
  },
];

function CertificateIcon() {
  return (
    <svg width="42" height="45" viewBox="0 0 42 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0016 0.00323139C21.9885 -0.0297276 22.7662 0.244931 23.553 0.647763C24.549 1.1568 25.6723 2.16388 27.0594 2.80108C29.0105 3.6983 32.6215 2.46051 34.468 4.67242C35.5458 5.96148 35.5958 6.97223 35.6777 7.97198C35.7641 9.04864 36.0006 10.0411 37.3695 11.4986C39.6389 13.9156 40.1119 15.5233 38.9431 17.1968C38.1472 18.3394 36.469 18.973 36.0825 19.6981C35.2547 21.2361 36.1689 22.397 35.041 24.1915C34.2542 25.4366 33.0445 26.2569 31.4299 26.6744C30.0701 27.0259 28.7057 26.5169 27.6142 26.8868C25.6996 27.535 24.2897 29.0401 22.7662 29.421C22.1795 29.5674 21.5928 29.6407 21.0061 29.637C20.4194 29.6407 19.8328 29.5674 19.2461 29.421C17.7225 29.0401 16.3127 27.535 14.398 26.8868C13.3065 26.5169 11.9421 27.0296 10.5823 26.6744C8.96779 26.2569 7.75805 25.4366 6.97126 24.1915C5.83883 22.397 6.75296 21.2361 5.92979 19.6981C5.54321 18.973 3.86503 18.3394 3.06915 17.1968C1.89124 15.5233 2.36422 13.9156 4.63363 11.5023C6.00255 10.0447 6.23904 9.0523 6.32546 7.97564C6.40732 6.97589 6.45734 5.96515 7.5352 4.67608C9.3862 2.46417 12.9972 3.70196 14.9438 2.80475C16.3309 2.16754 17.4542 1.16046 18.4502 0.651425C19.2324 0.244931 20.0147 -0.0333897 21.0016 0.00323139ZM21.0016 9.51007L23.0299 13.5018L28.3737 13.8204L24.2852 16.6072L25.5586 20.7967L21.0016 18.5262L16.4446 20.7967L17.718 16.6072L13.6294 13.8204L18.9732 13.5018L21.0016 9.51007ZM40.4576 41.407L35.2047 40.649L32.5988 44.4063C30.7068 46.2923 29.5062 43.1905 28.9786 42.1102L23.9077 34.4088C25.0765 34.0828 26.4864 33.1417 27.9326 32.0833C30.8205 32.1309 33.5129 31.7281 35.4912 29.6993L41.3171 38.763L41.8219 39.6346C42.2221 40.7662 42.0129 41.5132 40.4576 41.407ZM1.54105 41.407L6.79844 40.649L9.40439 44.4063C11.2963 46.2923 12.497 43.1905 13.0245 42.1102L18.0955 34.4088C16.9266 34.0828 15.5168 33.1417 14.0706 32.0833C11.1826 32.1309 8.49026 31.7281 6.51192 29.6993L0.681493 38.763L0.176674 39.6346C-0.223543 40.7662 -0.0143384 41.5132 1.54105 41.407ZM20.947 5.89557C27.2231 5.89557 32.3122 9.99347 32.3122 15.0472C32.3122 20.1009 27.2231 24.1988 20.947 24.1988C14.6709 24.1988 9.58176 20.1009 9.58176 15.0472C9.58631 9.99347 14.6709 5.89557 20.947 5.89557Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCertificateDate(record: AttendanceRecord | undefined, event: RegisteredEvent) {
  const parsedDate = record?.updatedAt ? new Date(record.updatedAt) : new Date(formatEventDate(event));
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return getDateInputValue(firstDate) === getDateInputValue(secondDate);
}

function isThisWeek(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

function buildCertificateCards(events: RegisteredEvent[], records: Record<string, AttendanceRecord>) {
  return events.reduce<CertificateCard[]>((cards, event) => {
    const eventId = getRegisteredEventId(event);
    const record = records[eventId];

    if (getCertificateStatus(record, event) !== 'Download') {
      return cards;
    }

    const issuedDate = getCertificateDate(record, event);

    cards.push({
      id: eventId,
      certificateName: `${event.name || 'Event Name'} Certificate`,
      eventName: event.name || 'Event Name',
      issuedDate: issuedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
      }),
      issuedDateValue: getDateInputValue(issuedDate),
      imageSrc: certificateTemplateSrc,
    });

    return cards;
  }, []);
}

export function CertificatesPageContent() {
  const [certificates, setCertificates] = useState<CertificateCard[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateCard | null>(null);

  useEffect(() => {
    const refreshCertificates = () => {
      const user = getCurrentAttendanceUser();
      setCertificates(buildCertificateCards(readRegisteredEvents(), readUserAttendanceRecords(user)));
    };

    refreshCertificates();
    window.addEventListener('pageshow', refreshCertificates);
    window.addEventListener('storage', refreshCertificates);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refreshCertificates);
    window.addEventListener('dcspace-registered-events-updated', refreshCertificates);

    return () => {
      window.removeEventListener('pageshow', refreshCertificates);
      window.removeEventListener('storage', refreshCertificates);
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refreshCertificates);
      window.removeEventListener('dcspace-registered-events-updated', refreshCertificates);
    };
  }, []);

  const visibleCertificates = certificates.length ? certificates : placeholderCertificates;
  const filteredCertificates = useMemo(() => {
    if (!certificates.length) {
      return visibleCertificates;
    }

    return visibleCertificates.filter((certificate) => {
      const issuedDate = new Date(`${certificate.issuedDateValue}T00:00:00`);

      if (activeFilter === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return isSameDate(issuedDate, yesterday);
      }

      if (activeFilter === 'This Week') {
        return isThisWeek(issuedDate);
      }

      if (activeFilter === 'Pick a date') {
        const startDate = dateRange.start <= (dateRange.end || dateRange.start) ? dateRange.start : dateRange.end;
        const endDate = dateRange.start <= (dateRange.end || dateRange.start) ? (dateRange.end || dateRange.start) : dateRange.start;
        const startsAfterStartDate = startDate ? certificate.issuedDateValue >= startDate : true;
        const endsBeforeEndDate = endDate ? certificate.issuedDateValue <= endDate : true;
        return startsAfterStartDate && endsBeforeEndDate;
      }

      return true;
    });
  }, [activeFilter, certificates.length, dateRange, visibleCertificates]);
  const certificateDateKeys = useMemo(
    () => visibleCertificates.map((certificate) => certificate.issuedDateValue),
    [visibleCertificates],
  );

  const handleFilterClick = (filter: string) => {
    if (filter === 'Pick a date') {
      setActiveFilter(filter);
      setShowDatePicker((current) => !current);
      return;
    }

    setActiveFilter(filter);
    setShowDatePicker(false);
  };

  const clearPickedDate = () => {
    setDateRange({ start: '', end: '' });
    setActiveFilter('All');
    setShowDatePicker(false);
  };

  return (
    <main className="certificates-content" aria-label="Earned certificates">
      <section className="certificates-page__heading">
        <h2><span>Earned</span> Certificates</h2>
        <div className="certificates-page__filters" aria-label="Certificate filters">
          {filters.map((filter) => (
            <span className="certificates-page__filter-wrap" key={filter}>
              <button
                className={`certificates-page__filter${activeFilter === filter ? ' is-active' : ''}${
                  filter === 'Pick a date' && showDatePicker ? ' is-open' : ''
                }`}
                type="button"
                onClick={() => handleFilterClick(filter)}
              >
                <span>{filter}</span>
                {filter === 'Pick a date' && <Image src="/assets/dropdown-fill.svg" width={8} height={8} alt="" />}
              </button>
              {filter === 'Pick a date' && showDatePicker && (
                <section className="certificates-date-picker" aria-label="Choose certificate date">
                  <DateRangeCalendarPicker
                    value={dateRange}
                    highlightedDates={certificateDateKeys}
                    onChange={(nextDateRange) => {
                      setDateRange(nextDateRange);
                      setActiveFilter(filter);
                    }}
                    onClear={clearPickedDate}
                    onDone={() => setShowDatePicker(false)}
                  />
                </section>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="cert-grid" aria-label="Certificate cards">
        {filteredCertificates.map((certificate) => (
          <button
            className="cert-card"
            type="button"
            key={certificate.id}
            onClick={() => setSelectedCertificate(certificate)}
          >
              <div className="cert-card__preview">
                <img src={certificate.imageSrc} alt="" />
              </div>
              <div className="cert-card__footer">
                <CertificateIcon />
                <div>
                  <p className="cert-card__title">{certificate.certificateName}</p>
                  <p className="cert-card__event">{certificate.eventName}</p>
                  <p className="cert-card__date">Date Issued: {certificate.issuedDate}</p>
                </div>
              </div>
          </button>
        ))}
      </section>

      {selectedCertificate && (
        <div className="certificate-preview-overlay" role="dialog" aria-modal="true" aria-label="Certificate preview" onClick={() => setSelectedCertificate(null)}>
          <button className="certificate-preview-modal" type="button" onClick={(event) => event.stopPropagation()}>
            <img src={selectedCertificate.imageSrc} alt={selectedCertificate.certificateName} />
          </button>
        </div>
      )}
    </main>
  );
}
