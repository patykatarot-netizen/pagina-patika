/**
 * Cancellation policy for Patyka Tarot.
 *
 * Displayed on the cancellation policy page (app/terms/page.tsx).
 * Shown in the booking form as a required acknowledgment checkbox.
 */
export const CANCELLATION_POLICY = `Las sesiones son personales e intransferibles.
Si necesitás cancelar o reprogramar, contactanos con al menos 24 horas de anticipación al WhatsApp.
Los pagos confirmados no tienen reembolso automático, cada caso se evalúa con Patyka.`;

/**
 * HTML version of the cancellation policy for the terms page.
 * Wrapped in proper semantic markup with Rioplatense Spanish tone
 * (matching Patyka's voice).
 */
export const CANCELLATION_POLICY_HTML = `
<p>Las sesiones son <strong>personales e intransferibles</strong>.</p>
<p>Si necesitás cancelar o reprogramar, contactanos con al menos <strong>24 horas de anticipación</strong> al WhatsApp.</p>
<p>Los pagos confirmados <strong>no tienen reembolso automático</strong>; cada caso se evalúa con Patyka.</p>
`.trim();
