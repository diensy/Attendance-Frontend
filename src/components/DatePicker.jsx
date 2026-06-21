import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseISO(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function normaliseLimit(val) {
  if (!val) return null;
  if (val === 'today') { const d = new Date(); d.setHours(0,0,0,0); return d; }
  return parseISO(val);
}

/**
 * DatePicker — pure React, no external library.
 *
 * Props:
 *   value       string "YYYY-MM-DD"
 *   onChange    (iso: string) => void
 *   placeholder string
 *   minDate     "today" | "YYYY-MM-DD" | undefined
 *   maxDate     "today" | "YYYY-MM-DD" | undefined
 *   id          string
 *   required    bool
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  id,
  required,
}) {
  const selected = parseISO(value);
  const minD = normaliseLimit(minDate);
  const maxD = normaliseLimit(maxDate);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const ref = selected || new Date();
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });
  const [pos, setPos] = useState({ top: 0, left: 0, width: 288 });

  const triggerRef = useRef(null);
  const calRef     = useRef(null);

  /* ── position calendar below trigger ── */
  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      top:   r.bottom + window.scrollY + 4,
      left:  r.left   + window.scrollX,
      width: Math.max(r.width, 280),
    });
  };

  const toggleOpen = () => {
    if (!open) calcPos();
    setOpen(p => !p);
  };

  /* ── close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (calRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* ── calendar logic ── */
  const { year, month } = view;

  const prevMonth = () =>
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });

  const nextMonth = () =>
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const firstWeekDay  = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const isDisabled = (day) => {
    const d = new Date(year, month, day); d.setHours(0,0,0,0);
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  };

  const isSelected = (day) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth()    === month &&
    selected.getDate()     === day;

  const isToday = (day) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  const selectDay = (day) => {
    if (isDisabled(day)) return;
    onChange?.(toISO(year, month, day));
    setOpen(false);
  };

  const selectToday = () => {
    const t = new Date();
    if (!isDisabled(t.getDate()) || (t.getFullYear() === year && t.getMonth() === month)) {
      setView({ year: t.getFullYear(), month: t.getMonth() });
      selectDay(t.getDate());
    }
  };

  const clearDate = () => {
    onChange?.('');
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  /* ── render ── */
  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between gap-2 bg-background border rounded-md py-2 px-3 text-xs text-left transition-all cursor-pointer
          ${open ? 'border-primary ring-1 ring-primary/30' : 'border-input hover:border-primary/50'}`}
      >
        <span className={displayValue ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>

      {/* Hidden validation input */}
      <input
        type="hidden"
        value={value || ''}
        required={required}
        onChange={() => {}}
      />

      {/* Calendar popup — rendered at body via portal */}
      {open && createPortal(
        <div
          ref={calRef}
          style={{
            position: 'absolute',
            top:  pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 999999,
          }}
          className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="font-outfit font-bold text-sm text-foreground select-none">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 px-2 pb-2 gap-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    disabled={isDisabled(day)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all select-none
                      ${isSelected(day)
                        ? 'bg-primary text-primary-foreground font-bold shadow-sm scale-105'
                        : isToday(day)
                          ? 'border-2 border-primary text-primary font-bold'
                          : isDisabled(day)
                            ? 'text-muted-foreground/30 cursor-not-allowed'
                            : 'text-foreground hover:bg-secondary hover:scale-105 cursor-pointer'
                      }`}
                  >
                    {day}
                  </button>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex justify-between items-center bg-muted/20">
            <button
              type="button"
              onClick={clearDate}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={selectToday}
              className="text-xs text-primary font-bold hover:underline transition-colors"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
