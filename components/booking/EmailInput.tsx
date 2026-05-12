'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Inline email validation using Zod.
 *
 * Validates on every keystroke so the user gets immediate feedback.
 * Empty values are allowed (validated at submit time) — we only
 * show an error once the user has typed something invalid.
 */
const emailSchema = z.string().email('Ingresá un email válido (ej: nombre@email.com)');

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Server‑side error from createBooking (e.g., network failure) */
  serverError?: string | null;
}

/**
 * Email input field with inline Zod validation and Liquid Glass styling.
 *
 * # Behavior
 *   - Validates on change (instant feedback on typing).
 *   - Empty field shows no error (validated at form submission).
 *   - Error state shows a red border and inline message.
 *   - Server‑side errors (from the Server Action) are displayed
 *     alongside client‑side validation errors.
 */
export default function EmailInput({ value, onChange, serverError }: Props) {
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      if (!touched) setTouched(true);
    },
    [onChange, touched]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  // Validate only if the field has been touched (user typed something
  // and then left the field, or we have a non‑empty value)
  const validationResult = touched && value.length > 0
    ? emailSchema.safeParse(value)
    : null;

  const hasError = validationResult?.success === false;
  const errorMessage = hasError
    ? validationResult!.error!.errors[0]?.message
    : serverError || null;

  return (
    <div>
      <label
        htmlFor="booking-email"
        className="block text-sm font-medium text-text-secondary mb-2"
      >
        Tu email
      </label>
      <input
        id="booking-email"
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="nombre@email.com"
        autoComplete="email"
        className={`
          liquid-glass w-full px-4 py-3 text-text-primary text-sm
          placeholder:text-text-secondary/40
          focus:outline-none focus:ring-2
          transition-colors duration-200
          ${hasError ? 'ring-2 ring-red-400/50' : 'focus:ring-accent-gold/40'}
        `}
        aria-invalid={hasError || !!serverError}
        aria-describedby={errorMessage ? 'email-error' : undefined}
      />
      {errorMessage && (
        <p id="email-error" className="mt-1.5 text-red-400 text-xs" role="alert">
          {errorMessage}
        </p>
      )}
      {!hasError && !serverError && (
        <p className="mt-1.5 text-text-secondary/50 text-xs">
          Te enviaremos la confirmación de tu reserva a este email.
        </p>
      )}
    </div>
  );
}
