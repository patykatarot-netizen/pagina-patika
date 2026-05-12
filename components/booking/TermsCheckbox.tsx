'use client';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional error message from parent (e.g., "Debés aceptar los términos") */
  error?: string | null;
}

/**
 * Terms and conditions acceptance checkbox.
 *
 * Renders a labeled checkbox with a link to the `/terms` page
 * (cancellation policy). The checkbox must be checked before the
 * booking form can be submitted.
 *
 * # Accessibility
 *   - Uses a native `<input type="checkbox">` for keyboard and
 *     screen reader support.
 *   - The label wraps both the checkbox AND the text so clicking
 *     anywhere on the label toggles the checkbox.
 *   - `aria-describedby` links the checkbox to the error message.
 */
export default function TermsCheckbox({ checked, onChange, error }: Props) {
  const checkboxId = 'terms-checkbox';

  return (
    <div>
      <label
        htmlFor={checkboxId}
        className="flex items-start gap-3 cursor-pointer group"
      >
        {/* Custom‑styled checkbox */}
        <span className="relative flex-shrink-0 mt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
            aria-describedby={error ? 'terms-error' : undefined}
          />
          <span
            className={`
              block w-5 h-5 rounded border transition-all duration-200
              ${
                checked
                  ? 'bg-accent-gold border-accent-gold'
                  : 'border-border-glass bg-bg-glass group-hover:border-accent-gold/40'
              }
            `}
          >
            {/* Checkmark icon */}
            {checked && (
              <svg
                className="w-3.5 h-3.5 mx-auto mt-0.5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>
        </span>

        {/* Label text */}
        <span className="text-sm text-text-secondary leading-relaxed">
          Acepto los{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-gold underline hover:no-underline transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            términos y condiciones
          </a>{' '}
          de las sesiones.
        </span>
      </label>

      {error && (
        <p id="terms-error" className="mt-2 text-red-400 text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
