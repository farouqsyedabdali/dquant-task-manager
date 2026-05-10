import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { FaCalendar } from 'react-icons/fa';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @param {string} val */
function parseValueToLocalDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (!trimmed.includes('T')) {
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 0, 0, 0, 0);
  }

  const [datePart, timePart = '00:00'] = trimmed.split('T');
  const dm = datePart.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]) - 1;
  const d = Number(dm[3]);
  const tm = timePart.match(/^(\d{1,2}):(\d{2})/);
  const hh = tm ? Number(tm[1]) : 0;
  const mm = tm ? Number(tm[2]) : 0;
  return new Date(y, mo, d, hh, mm, 0, 0);
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function toDateOnlyString(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDatetimeLocalString(d) {
  return `${toDateOnlyString(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** @param {string|Date|null|undefined} raw */
function toMinDate(raw) {
  if (raw == null || raw === '') return null;
  const d = raw instanceof Date ? raw : parseValueToLocalDate(String(raw).slice(0, 16).replace('Z', ''));
  if (!d || isNaN(d.getTime())) {
    const tryDate = new Date(raw);
    return isNaN(tryDate.getTime()) ? null : tryDate;
  }
  return d;
}

/**
 * Custom date / datetime field — no native calendar popup.
 *
 * @param {Object} props
 * @param {string} props.name - Passed through on synthetic change event
 * @param {string} props.value - YYYY-MM-DD or YYYY-MM-DDTHH:mm (local)
 * @param {Function} props.onChange - (e) => e.target = { name, value }
 * @param {boolean} [props.showTime]
 * @param {boolean} [props.timeOptional]
 * @param {string} [props.min] [props.max]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.error]
 */
const DatePicker = ({
  name = 'dueDate',
  value = '',
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  showTime = true,
  timeOptional = false,
  min = null,
  max = null,
  className = '',
  error = false
}) => {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const minD = toMinDate(min);
  const maxD = toMinDate(max);

  const [includeTime, setIncludeTime] = useState(() =>
    timeOptional ? !!(value && String(value).includes('T')) : showTime
  );

  useEffect(() => {
    if (timeOptional) {
      setIncludeTime(!!(value && String(value).includes('T')));
    }
  }, [value, timeOptional]);

  const selected = parseValueToLocalDate(value);
  const [cursor, setCursor] = useState(() => selected || new Date());

  useEffect(() => {
    if (selected && !isNaN(selected.getTime())) {
      setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value, open]);

  const emit = useCallback(
    (d, options = {}) => {
      if (!d || isNaN(d.getTime())) return;
      let asDateOnly =
        (timeOptional && !includeTime) || (!showTime && !timeOptional);
      if (options.forceDateOnly) asDateOnly = true;
      if (options.forceDatetime) asDateOnly = false;
      const out = asDateOnly ? toDateOnlyString(d) : toDatetimeLocalString(d);
      onChange?.({ target: { name, value: out } });
    },
    [name, onChange, showTime, timeOptional, includeTime]
  );

  const formatDisplay = () => {
    if (!value) return '';
    const d = parseValueToLocalDate(value);
    if (!d || isNaN(d.getTime())) return value;
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    if (timeOptional && !includeTime && !String(value).includes('T')) {
      return dateStr;
    }
    if (!showTime && !timeOptional) {
      return dateStr;
    }
    if (timeOptional && !includeTime) {
      return dateStr;
    }
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} · ${timeStr}`;
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const isDisabledDay = (day) => {
    if (day == null) return true;
    const cell = new Date(year, month, day);
    const sod = startOfLocalDay(cell);
    if (minD) {
      const minStart = startOfLocalDay(minD);
      if (sod < minStart) return true;
    }
    if (maxD) {
      const maxStart = startOfLocalDay(maxD);
      if (sod > maxStart) return true;
    }
    return false;
  };

  const pickDay = (day) => {
    if (day == null || isDisabledDay(day)) return;
    let next = new Date(year, month, day, 0, 0, 0, 0);
    if (selected && !isNaN(selected.getTime())) {
      next = new Date(year, month, day, selected.getHours(), selected.getMinutes(), 0, 0);
    }
    if (minD) {
      const minStart = startOfLocalDay(minD);
      if (startOfLocalDay(next).getTime() === minStart.getTime() && next < minD) {
        next = new Date(minD);
      }
    }
    if (maxD && next > maxD) next = new Date(maxD);
    emit(next);
  };

  const applyTime = (hours, minutes) => {
    let base;
    if (selected && !isNaN(selected.getTime())) {
      base = new Date(selected);
    } else {
      const now = new Date();
      const useToday =
        now.getFullYear() === year && now.getMonth() === month && now.getDate() <= daysInMonth;
      const dayNum = useToday ? now.getDate() : 1;
      base = new Date(year, month, dayNum, hours, minutes, 0, 0);
    }
    let next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
    if (minD && next < minD) next = new Date(minD);
    if (maxD && next > maxD) next = new Date(maxD);
    emit(next);
  };

  const goPrevMonth = () => setCursor(new Date(year, month - 1, 1));
  const goNextMonth = () => setCursor(new Date(year, month + 1, 1));

  const today = new Date();
  const showTimeRow = showTime || (timeOptional && includeTime);

  const hourVal = selected && !isNaN(selected.getTime()) ? selected.getHours() : 0;
  const minVal = selected && !isNaN(selected.getTime()) ? selected.getMinutes() : 0;

  const modalTitle =
    showTime || (timeOptional && includeTime) ? 'Select date & time' : 'Select date';

  const panel = open && !disabled && (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default border-0 p-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        aria-label="Close calendar"
        onClick={() => setOpen(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl border p-4 max-h-[min(90vh,520px)] overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 id={titleId} className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

      <div className="flex items-center justify-between mb-2 gap-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-primary)' }}
          aria-label="Previous month"
        >
          <IconChevronLeft />
        </button>
        <span className="text-sm font-semibold flex-1 text-center" style={{ color: 'var(--color-text-primary)' }}>
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-primary)' }}
          aria-label="Next month"
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          const disabled = isDisabledDay(day);
          const isSel =
            day != null &&
            selected &&
            selected.getFullYear() === year &&
            selected.getMonth() === month &&
            selected.getDate() === day;
          const isTodayCell =
            day != null &&
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || day == null}
              onClick={() => pickDay(day)}
              className="h-8 rounded-lg text-xs font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              style={
                isSel
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff'
                    }
                  : isTodayCell && !isSel
                    ? {
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-primary)'
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: disabled || day == null ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'
                      }
              }
            >
              {day == null ? '' : day}
            </button>
          );
        })}
      </div>

      {timeOptional && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="checkbox checkbox-sm rounded border-2"
            style={{ borderColor: 'var(--color-border-default)' }}
            checked={includeTime}
            onChange={(e) => {
              const checked = e.target.checked;
              setIncludeTime(checked);
              if (!checked && selected && !isNaN(selected.getTime())) {
                emit(
                  new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 0, 0, 0, 0),
                  { forceDateOnly: true }
                );
              } else if (checked) {
                const now = new Date();
                let d;
                if (selected && !isNaN(selected.getTime())) {
                  d = new Date(
                    selected.getFullYear(),
                    selected.getMonth(),
                    selected.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    0,
                    0
                  );
                } else {
                  d = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    0,
                    0
                  );
                }
                if (minD && d < minD) emit(new Date(minD), { forceDatetime: true });
                else emit(d, { forceDatetime: true });
              }
            }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Set time
          </span>
        </label>
      )}

      {showTimeRow && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
            Time
          </span>
          <select
            className="select select-sm flex-1 min-w-0 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            value={hourVal}
            onChange={(e) => applyTime(Number(e.target.value), minVal)}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {pad2(h)}
              </option>
            ))}
          </select>
          <select
            className="select select-sm flex-1 min-w-0 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            value={minVal}
            onChange={(e) => applyTime(hourVal, Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, m) => (
              <option key={m} value={m}>
                :{pad2(m)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-between gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => {
            if (onChange) onChange({ target: { name, value: '' } });
            setOpen(false);
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn-sm"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            border: 'none'
          }}
          onClick={() => setOpen(false)}
        >
          Done
        </button>
      </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between gap-2 text-left min-h-[2.5rem] transition-colors duration-200 ${error ? 'input-error' : ''}`}
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          borderColor: error ? '#ef4444' : 'var(--color-border-default)',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="truncate">{formatDisplay() || placeholder}</span>
        <FaCalendar className="w-4 h-4 shrink-0 opacity-60" style={{ color: 'var(--color-text-tertiary)' }} />
      </button>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  );
};

export default DatePicker;
