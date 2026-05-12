'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSlots } from '@/app/actions/getSlots';
import { UTC_OFFSET } from '@/lib/constants';
import type { Slot } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date in YYYY‑MM‑DD format using Bogotá timezone.
 *
 * Why not just `new Date().toISOString().slice(0, 10)`?
 * Because that gives UTC midnight, which could be the wrong day
 * in Bogotá if the user is browsing from a different timezone
 * near midnight UTC.
 */
function getTodayBogota(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(new Date());
}

/**
 * Converts a "HH:mm" time and "YYYY‑MM‑DD" date into a full ISO
 * 8601 string with Bogotá offset for the Server Action.
 *
 * @example toISO("2026-05-08", "09:00") → "2026-05-08T09:00:00-05:00"
 */
function toISO(date: string, time: string): string {
  return `${date}T${time}:00${UTC_OFFSET}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  serviceId: number;
  selectedTime: string | null; // "HH:mm"
  onSelectTime: (time: string, iso: string) => void;
}

/**
 * Slot picker that queries `getSlots()` Server Action for available
 * times on a given date.
 *
 * # Behavior
 *   - Defaults to today's date (Bogotá timezone).
 *   - Fetches slots whenever `serviceId` or `date` changes.
 *   - Available slots are interactive buttons with gold highlight.
 *   - Taken slots are rendered as disabled, greyed‑out pills.
 *   - Shows a loading spinner while the Server Action is in flight.
 *
 * # Date input
 *   - Uses a native `<input type="date">` for broad compatibility.
 *   - Minimum date is today (can't book in the past).
 */
export default function SlotPicker({
  serviceId,
  selectedTime,
  onSelectTime,
}: Props) {
  const [date, setDate] = useState(() => getTodayBogota());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSlots(serviceId, date);
      setSlots(result);
    } catch (err) {
      console.error('[SlotPicker] Failed to fetch slots:', err);
      setError('No pudimos cargar los horarios. Intentá de nuevo.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const todayString = getTodayBogota();

  return (
    <div>
      {/* ── Date picker ── */}
      <div className="mb-5">
        <label
          htmlFor="booking-date"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Fecha
        </label>
        <input
          id="booking-date"
          type="date"
          value={date}
          min={todayString}
          onChange={(e) => {
            setDate(e.target.value);
            // Clear previous selection when date changes
            if (selectedTime) onSelectTime('', '');
          }}
          className="liquid-glass px-4 py-2.5 text-text-primary text-sm w-full md:w-auto
                     focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
        />
      </div>

      {/* ── Slot grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary text-sm">
            Cargando horarios…
          </span>
        </div>
      ) : error ? (
        <div className="liquid-glass p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchSlots}
            className="mt-2 text-accent-gold text-sm underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      ) : slots.length === 0 ? (
        <p className="text-text-secondary text-center py-6 text-sm">
          No hay horarios disponibles para esta fecha.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isDisabled = !slot.available;

            return (
              <button
                key={slot.time}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectTime(slot.time, toISO(date, slot.time))}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium tabular-nums
                  transition-all duration-200
                  ${
                    isDisabled
                      ? 'bg-white/3 text-text-secondary/30 cursor-not-allowed line-through'
                      : isSelected
                        ? 'bg-accent-gold text-black shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                        : 'liquid-glass text-text-primary hover:bg-accent-gold/10 hover:text-accent-gold'
                  }
                `}
                aria-label={`Horario ${slot.time}${isDisabled ? ' — no disponible' : ''}`}
                aria-pressed={isSelected}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
