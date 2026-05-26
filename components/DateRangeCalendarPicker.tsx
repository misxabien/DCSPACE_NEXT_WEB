'use client';

import { useState } from 'react';

type DateRange = {
  start: string;
  end: string;
};

type DateRangeCalendarPickerProps = {
  value: DateRange;
  onChange: (value: DateRange) => void;
  onClear?: () => void;
  onDone?: () => void;
  highlightedDates?: string[];
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCalendarDays(anchorDate: Date) {
  const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function getDateTime(dateKey: string) {
  return dateKey ? new Date(`${dateKey}T00:00:00`).getTime() : null;
}

export function DateRangeCalendarPicker({
  value,
  onChange,
  onClear,
  onDone,
  highlightedDates = [],
}: DateRangeCalendarPickerProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const anchorDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const calendarDays = getCalendarDays(anchorDate);
  const highlightedDateKeys = new Set(highlightedDates);
  const selectedStartTime = getDateTime(value.start);
  const selectedEndTime = getDateTime(value.end);
  const monthLabel = anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleDatePick = (dateKey: string) => {
    if (!value.start || value.end) {
      onChange({ start: dateKey, end: '' });
      return;
    }

    if (dateKey === value.start) {
      onDone?.();
      return;
    }

    const currentStartTime = getDateTime(value.start) ?? 0;
    const nextTime = getDateTime(dateKey) ?? 0;

    onChange(
      nextTime < currentStartTime
        ? { start: dateKey, end: value.start }
        : { start: value.start, end: dateKey },
    );
    onDone?.();
  };

  return (
    <div className="date-range-calendar">
      <header>
        <button type="button" aria-label="Previous month" onClick={() => setMonthOffset((current) => current - 1)}>
          &lt;
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="Next month" onClick={() => setMonthOffset((current) => current + 1)}>
          &gt;
        </button>
      </header>
      <div className="date-range-calendar__weekdays" aria-hidden="true">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="date-range-calendar__days">
        {calendarDays.map((date) => {
          const dateKey = formatDateKey(date);
          const time = date.getTime();
          const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
          const isHighlighted = highlightedDateKeys.has(dateKey);
          const isSelected =
            time === selectedStartTime ||
            (selectedEndTime !== null && time === selectedEndTime);
          const isInRange =
            selectedStartTime !== null &&
            selectedEndTime !== null &&
            time > selectedStartTime &&
            time < selectedEndTime;

          return (
            <button
              className={`${isCurrentMonth ? '' : 'is-muted'}${isHighlighted ? ' is-highlighted' : ''}${isSelected ? ' is-selected' : ''}${isInRange ? ' is-in-range' : ''}`}
              type="button"
              onClick={() => handleDatePick(dateKey)}
              key={dateKey}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      {onClear && (
        <button className="date-range-calendar__clear" type="button" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}
