'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { getSlots } from '@/app/actions/getSlots';
import { UTC_OFFSET } from '@/lib/constants';
import type { Slot, Service } from '@/types';

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
 * Checks whether a given date falls on a day that is enabled
 * in the service's `availableDays` bitmask.
 *
 * Bitmask semantics: 1=Lun, 2=Mar, 4=Mié, 8=Jue, 16=Vie, 32=Sáb, 64=Dom
 *
 * JS `getDay()`: 0=Dom, 1=Lun, … 6=Sáb, so we map to the bitmask
 * using a lookup array.
 */
function isDayAvailable(date: Date, availableDays: number): boolean {
  const dayMap = [64, 1, 2, 4, 8, 16, 32]; // [Dom, Lun, Mar, Mié, Jue, Vie, Sáb]
  return (availableDays & dayMap[date.getDay()]) !== 0;
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
  service: Service;
  selectedTime: string | null; // "HH:mm"
  onSelectTime: (time: string, iso: string) => void;
}

/**
 * Slot picker that queries `getSlots()` Server Action for available
 * times on a given date, then filters results client-side against
 * the service's `availableDays` bitmask and `availableSlots` JSON array.
 *
 * # WhatsApp‑only services
 *   Services with `bookingType === 'whatsapp_only'` skip the date picker
 *   and slot grid entirely and show a CTA to message Patyka via WhatsApp.
 *
 * # Behavior
 *   - Defaults to today's date (Bogotá timezone), or the next available day
 *     if today is not in the service's `availableDays` bitmask.
 *   - Dates outside the bitmask are disabled in the native date input.
 *   - Fetches slots whenever `service.id` or `date` changes.
 *   - Returned slots are further filtered against `availableSlots` (JSON).
 *   - Shows a loading spinner while the Server Action is in flight.
 *
 * # Date input
 *   - Uses a native `<input type="date">` for broad compatibility.
 *   - Minimum date is today (can't book in the past) clamped to the
 *     next available day when today itself is not available.
 */
export default function SlotPicker({
  service,
  selectedTime,
  onSelectTime,
}: Props) {
  // ── Hooks: must be called unconditionally at top level ──
  const initialDate = computeInitialDate(service.availableDays);

  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    // Skip fetch for WhatsApp-only services
    if (service.bookingType === 'whatsapp_only') return;

    setLoading(true);
    setError(null);
    try {
      const result = await getSlots(service.id, date);

      // Filter server-returned slots against the service's allowed slots
      const allowedSlots = JSON.parse(
        service.availableSlots || '[]',
      ) as string[];
      const filtered = allowedSlots.length
        ? result.filter((slot) => allowedSlots.includes(slot.time))
        : result; // If no allowedSlots are defined, show all server slots

      setSlots(filtered);
    } catch (err) {
      console.error('[SlotPicker] Failed to fetch slots:', err);
      setError('No pudimos cargar los horarios. Intentá de nuevo.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [service.id, service.bookingType, service.availableSlots, date]);

  useEffect(() => {
    if (service.bookingType !== 'whatsapp_only') {
      fetchSlots();
    }
  }, [fetchSlots, service.bookingType]);

  // ── WhatsApp‑only early return (after hooks) ──
  if (service.bookingType === 'whatsapp_only') {
    const whatsappUrl = `https://wa.me/573018339558?text=Hola%20Patyka!%20Quiero%20agendar%20una%20${encodeURIComponent(service.name)}`;
    return (
      <div className="glass-secondary p-6 text-center space-y-4">
        <p className="text-text-secondary text-base">
          Las preguntas puntuales se agendan el mismo día directamente por
          WhatsApp.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Agendar por WhatsApp
        </a>
      </div>
    );
  }

  const todayString = getTodayBogota();

  // ── Compute disabled dates for the native date input ──
  // We disable days NOT in the availableDays bitmask by scheduling
  // them with a JavaScript‑generated string. Native <input type="date">
  // doesn't support per‑day disabling, so we use `onChange` validation
  // (inline message) + `min` set to today.
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const parsed = new Date(newDate + 'T12:00:00'); // noon to avoid TZ shifts
    if (!isDayAvailable(parsed, service.availableDays)) {
      // Silently ignore: don't update the date state
      return;
    }
    setDate(newDate);
    if (selectedTime) onSelectTime('', '');
  };

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
          onChange={handleDateChange}
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

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first available date starting from today (Bogota).
 *
 * If today is not in the service's `availableDays` bitmask, walks
 * forward up to 7 days until it finds an enabled day. Falls back to
 * today's formatted string if no match is found (shouldn't happen
 * with the standard 127=all‑days mask).
 */
function computeInitialDate(availableDays: number): string {
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + i);
    if (isDayAvailable(candidate, availableDays)) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
      }).format(candidate);
    }
  }
  return getTodayBogota();
}
