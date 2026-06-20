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
type Step = 1 | 2 | 3;

/** Labels for each step in the indicator */
const STEP_LABELS: Record<Step, string> = {
  1: 'Servicio',
  2: 'Horario',
  3: 'Datos y Pago',
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
      {([1, 2, 3] as Step[]).map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            {/* Dot / number */}
            <div
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-2xl font-bold
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
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            {/* Connector line (not after last step) */}
            {step < 3 && (
              <div
                className={`w-8 h-1 rounded transition-colors duration-300 ${
                  step < currentStep ? 'bg-accent-gold/50' : 'bg-white/8'
                }`}
              />
            )}
            {/* Label (desktop only) */}
            <span
              className={`hidden sm:inline text-base md:text-2xl transition-colors duration-300 ${
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
 *   3. **Datos y Pago** — Enter contact details, review, accept terms, and pay via Wompi
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
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
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

  const handleSubmit = useCallback(async () => {
    // Validate terms
    if (!acceptedTerms) {
      setTermsError('Debés aceptar los términos y condiciones para continuar.');
      return;
    }
    setTermsError(null);
    setError(null);

    if (!selectedService || !selectedISO || !email || !customerName) {
      setError('Faltan datos. Volvé a los pasos anteriores y completalos.');
      return;
    }

    setLoading(true);

    try {
      const result = await createBooking({
        serviceId: selectedService.id,
        scheduledAt: selectedISO,
        customerEmail: email,
        customerName: customerName,
        customerWhatsapp: customerWhatsapp || undefined,
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
  }, [selectedService, selectedISO, email, customerName, customerWhatsapp, acceptedTerms]);

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
      className="w-full max-w-7xl mx-auto p-8 md:p-12"
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
            className="font-heading text-2xl md:text-5xl font-bold text-text-primary mb-2 focus:outline-none"
          >
            Elegí tu servicio
          </h3>
          <p className="text-text-secondary text-base md:text-2xl mb-6">
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
            className="font-heading text-2xl md:text-5xl font-bold text-text-primary mb-2 focus:outline-none"
          >
            Elegí fecha y horario
          </h3>
          <p className="text-text-secondary text-base md:text-2xl mb-6">
            {selectedService.name} — {selectedService.durationMin} min
          </p>
          <SlotPicker
            service={selectedService}
            selectedTime={selectedTime}
            onSelectTime={handleSelectTime}
          />
          {error && (
            <p className="mt-3 text-red-400 text-sm md:text-xl" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="liquid-glass px-5 py-2.5 text-sm md:text-xl text-text-secondary
                         hover:text-text-primary transition-colors"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleNextFromSlots}
              disabled={!selectedTime}
              className="px-6 py-2.5 rounded-lg text-sm md:text-xl font-bold
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

      {/* ── Step 3: Data + Payment ── */}
      {step === 3 && selectedService && selectedTime && (
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-2xl md:text-5xl font-bold text-text-primary mb-2 focus:outline-none"
          >
            Datos y Pago
          </h3>
          <p className="text-text-secondary text-base md:text-2xl mb-6">
            Completá tus datos y revisá la reserva antes de pagar.
          </p>

          {/* ── Contact fields ── */}

          {/* Email */}
          <EmailInput
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError(null);
            }}
            serverError={error}
          />

          <div className="mt-4 space-y-4">
            {/* Nombre completo */}
            <div>
              <label htmlFor="customer-name" className="block text-base md:text-2xl font-medium text-text-secondary mb-2">
                Nombre completo
              </label>
              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tu nombre completo"
                className="glass-secondary w-full px-4 py-3 text-text-primary text-base md:text-2xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
                required
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="customer-whatsapp" className="block text-base md:text-2xl font-medium text-text-secondary mb-2">
                WhatsApp (opcional)
              </label>
              <input
                id="customer-whatsapp"
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="+57 300 000 0000"
                className="glass-secondary w-full px-4 py-3 text-text-primary text-base md:text-2xl focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
              />
            </div>
          </div>

          {/* ── Summary card ── */}
          <div className="liquid-glass p-4 mt-5 space-y-2 text-sm md:text-xl">
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
            <div className="flex justify-between border-t border-border-glass pt-2 mt-2">
              <span className="text-text-primary font-medium">Total</span>
              <span className="text-accent-gold font-bold tabular-nums">
                {buildAmountLabel(selectedService.priceCop)}
              </span>
            </div>
          </div>

          {/* ── Legal notes ── */}

          {/* Comprobante note */}
          <div className="glass-subtle p-4 rounded-lg mt-4 space-y-2">
            <p className="text-text-secondary text-sm md:text-xl">
              Una vez realizado el pago, enviá tu{' '}
              <a
                href="https://wa.me/573018339558?text=Hola%20Patyka!%20Env%C3%ADo%20mi%20comprobante%20de%20pago"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline font-bold transition-colors"
              >
                comprobante por WhatsApp
              </a>{' '}
              (+57 301 833 9558) con tu{' '}
              <strong className="text-text-primary">nombre completo</strong> para confirmar tu cita.
            </p>
          </div>

          {/* Western Union note */}
          <div className="glass-subtle p-4 rounded-lg mt-3">
            <p className="text-text-secondary text-sm md:text-xl">
              🌍 El{' '}
              <strong className="text-text-primary">único medio de pago para clientes del extranjero</strong>{' '}
              es <strong className="text-text-primary">Western Union</strong>.{' '}
              <a
                href="https://wa.me/573018339558?text=Hola%20Patyka!%20Necesito%20coordinar%20un%20pago%20por%20Western%20Union"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline font-bold transition-colors"
              >
                Contactá por WhatsApp
              </a>{' '}
              para coordinar.
            </p>
          </div>

          {/* ── Terms checkbox ── */}
          <div className="mt-4">
            <TermsCheckbox
              checked={acceptedTerms}
              onChange={(checked) => {
                setAcceptedTerms(checked);
                if (checked) setTermsError(null);
              }}
              error={termsError}
            />
          </div>

          {/* Global error */}
          {error && (
            <p className="mt-4 text-red-400 text-sm md:text-xl" role="alert">
              {error}
            </p>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="liquid-glass px-5 py-2.5 text-sm md:text-xl text-text-secondary
                         hover:text-text-primary transition-colors
                         disabled:opacity-40"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !email || !email.includes('@') || !customerName || !acceptedTerms}
              className="flex-1 px-6 py-3 rounded-lg text-sm md:text-xl font-bold
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
