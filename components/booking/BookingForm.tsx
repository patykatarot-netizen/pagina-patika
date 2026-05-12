'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Service } from '@/types';
import { createBooking } from '@/app/actions/createBooking';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';
import ServiceSelector from './ServiceSelector';
import SlotPicker from './SlotPicker';
import EmailInput from './EmailInput';
import TermsCheckbox from './TermsCheckbox';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Booking flow step identifiers */
type Step = 1 | 2 | 3 | 4;

/** Labels for each step in the indicator */
const STEP_LABELS: Record<Step, string> = {
  1: 'Servicio',
  2: 'Horario',
  3: 'Email',
  4: 'Confirmar',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the Wompi amount label for the confirmation step.
 *
 * @example buildAmountLabel(80000) → "$ 80.000 COP"
 */
function buildAmountLabel(priceCop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceCop);
}

// ---------------------------------------------------------------------------
// Step Indicator (inline component)
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3, 4] as Step[]).map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            {/* Dot / number */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-accent-gold text-black shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : isCompleted
                      ? 'bg-accent-gold/30 text-accent-gold'
                      : 'bg-white/5 text-text-secondary'
                }
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {/* Connector line (not after last step) */}
            {step < 4 && (
              <div
                className={`w-6 h-0.5 rounded transition-colors duration-300 ${
                  step < currentStep ? 'bg-accent-gold/50' : 'bg-white/8'
                }`}
              />
            )}
            {/* Label (desktop only) */}
            <span
              className={`hidden sm:inline text-xs transition-colors duration-300 ${
                isActive
                  ? 'text-accent-gold font-medium'
                  : isCompleted
                    ? 'text-accent-gold/60'
                    : 'text-text-secondary/40'
              }`}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookingForm
// ---------------------------------------------------------------------------

interface Props {
  services: Service[];
}

/**
 * Multi‑step booking form that orchestrates the full flow:
 *
 *   1. **Servicio** — Select a tarot reading service
 *   2. **Horario**  — Pick a date and available time slot
 *   3. **Email**    — Enter contact email (validated inline)
 *   4. **Confirmar** — Review, accept terms, and pay via Wompi
 *
 * # State management
 *
 * Form state lives here (lifted up from child components) so
 * the summary step can display all selections before submission.
 *
 * # Loading and errors
 *
 * Each transition is wrapped in a try/catch. Server Action errors
 * are displayed inline at the relevant step. Loading states show
 * spinners on the CTA buttons.
 */
export default function BookingForm({ services }: Props) {
  // ── Step ──
  const [step, setStep] = useState<Step>(1);

  // ── Form state ──
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // "HH:mm"
  const [selectedISO, setSelectedISO] = useState<string | null>(null); // Full ISO
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  // ── Callbacks ──

  const handleSelectService = useCallback((service: Service) => {
    setSelectedService(service);
    setError(null);
    // Auto‑advance to next step after brief delay for visual feedback
    setTimeout(() => setStep(2), 300);
  }, []);

  const handleSelectTime = useCallback((time: string, iso: string) => {
    setSelectedTime(time);
    setSelectedISO(iso);
    setError(null);
  }, []);

  const handleNextFromSlots = useCallback(() => {
    if (!selectedTime) {
      setError('Elegí un horario disponible para continuar.');
      return;
    }
    setError(null);
    setStep(3);
  }, [selectedTime]);

  const handleNextFromEmail = useCallback(() => {
    if (!email || !email.includes('@')) {
      setError('Ingresá un email válido para continuar.');
      return;
    }
    setError(null);
    setStep(4);
  }, [email]);

  const handleSubmit = useCallback(async () => {
    // Validate terms
    if (!acceptedTerms) {
      setTermsError('Debés aceptar los términos y condiciones para continuar.');
      return;
    }
    setTermsError(null);
    setError(null);

    if (!selectedService || !selectedISO || !email) {
      setError('Faltan datos. Volvé a los pasos anteriores y completalos.');
      return;
    }

    setLoading(true);

    try {
      const result = await createBooking({
        serviceId: selectedService.id,
        scheduledAt: selectedISO,
        customerEmail: email,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.redirectUrl) {
        // Redirect to Wompi Checkout
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error('[BookingForm] Submit error:', err);
      setError('Ocurrió un error inesperado. Intentá de nuevo.');
      setLoading(false);
    }
  }, [selectedService, selectedISO, email, acceptedTerms]);

  const handleBack = useCallback(() => {
    setError(null);
    setTermsError(null);
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  }, [step]);

  // ── Focus management: move focus to heading on step change ──
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // ── Render ──

  return (
    <LiquidGlassContainer
      as="section"
      className="w-full max-w-2xl mx-auto p-6 md:p-8"
    >
      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* ── Accessible error announcement region ── */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="aria-live-errors"
      >
        {error && <p>{error}</p>}
        {termsError && <p>{termsError}</p>}
      </div>

      {/* ── Step 1: Service Selection ── */}
      {step === 1 && (
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold text-text-primary mb-1 focus:outline-none"
          >
            Elegí tu servicio
          </h3>
          <p className="text-text-secondary text-sm mb-5">
            Seleccioná el tipo de lectura que querés agendar.
          </p>
          <ServiceSelector
            services={services}
            selectedId={selectedService?.id ?? null}
            onSelect={handleSelectService}
          />
        </div>
      )}

      {/* ── Step 2: Slot Picker ── */}
      {step === 2 && selectedService && (
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold text-text-primary mb-1 focus:outline-none"
          >
            Elegí fecha y horario
          </h3>
          <p className="text-text-secondary text-sm mb-5">
            {selectedService.name} — {selectedService.durationMin} min
          </p>
          <SlotPicker
            serviceId={selectedService.id}
            selectedTime={selectedTime}
            onSelectTime={handleSelectTime}
          />
          {error && (
            <p className="mt-3 text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="liquid-glass px-5 py-2.5 text-sm text-text-secondary
                         hover:text-text-primary transition-colors"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleNextFromSlots}
              disabled={!selectedTime}
              className="px-6 py-2.5 rounded-lg text-sm font-bold
                         bg-accent-gold text-black
                          hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                          disabled:opacity-40 disabled:cursor-not-allowed
                          transition-all duration-200"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Email ── */}
      {step === 3 && (
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold text-text-primary mb-1 focus:outline-none"
          >
            Tu email
          </h3>
          <p className="text-text-secondary text-sm mb-5">
            Te enviaremos la confirmación y el link de Google Meet a este email.
          </p>
          <EmailInput
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(null);
            }}
            serverError={error}
          />
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="liquid-glass px-5 py-2.5 text-sm text-text-secondary
                         hover:text-text-primary transition-colors"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleNextFromEmail}
              disabled={!email || !email.includes('@')}
              className="px-6 py-2.5 rounded-lg text-sm font-bold
                         bg-accent-gold text-black
                         hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirmation + Pay ── */}
      {step === 4 && selectedService && selectedTime && (
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold text-text-primary mb-1 focus:outline-none"
          >
            Confirmá tu reserva
          </h3>
          <p className="text-text-secondary text-sm mb-5">
            Revisá los datos antes de proceder al pago.
          </p>

          {/* Summary card */}
          <div className="liquid-glass p-4 mb-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Servicio</span>
              <span className="text-text-primary font-medium">
                {selectedService.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Horario</span>
              <span className="text-text-primary font-medium tabular-nums">
                {selectedTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Email</span>
              <span className="text-text-primary font-medium truncate max-w-[200px]">
                {email}
              </span>
            </div>
            <div className="flex justify-between border-t border-border-glass pt-2 mt-2">
              <span className="text-text-primary font-medium">Total</span>
              <span className="text-accent-gold font-bold tabular-nums">
                {buildAmountLabel(selectedService.priceCop)}
              </span>
            </div>
          </div>

          {/* Terms checkbox */}
          <TermsCheckbox
            checked={acceptedTerms}
            onChange={(checked) => {
              setAcceptedTerms(checked);
              if (checked) setTermsError(null);
            }}
            error={termsError}
          />

          {/* Global error */}
          {error && (
            <p className="mt-4 text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="liquid-glass px-5 py-2.5 text-sm text-text-secondary
                         hover:text-text-primary transition-colors
                         disabled:opacity-40"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !acceptedTerms}
              className="flex-1 px-6 py-3 rounded-lg text-sm font-bold
                         bg-accent-gold text-black
                          hover:shadow-[0_0_25px_rgba(139,92,246,0.35)]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Procesando…
                </>
              ) : (
                'Pagar con Wompi'
              )}
            </button>
          </div>
        </div>
      )}
    </LiquidGlassContainer>
  );
}
