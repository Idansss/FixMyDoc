/**
 * Product analytics funnel: upload → analyze → export → upgrade.
 * In production with Vercel Analytics, use va('event', name, { ... }).
 * Safe to call from client only.
 */

export type FunnelEvent =
  | 'upload_success'
  | 'analyze_complete'
  | 'export_start'
  | 'export_success'
  | 'upgrade_click'
  | 'cover_letter_generate'
  | 'cover_letter_export'
  | 'interview_prep_generate'
  | 'linkedin_optimize'
  | 'cover_letter_save';

export function track(event: FunnelEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  try {
    const payload = { event, ...props };
    const va = (window as unknown as { va?: (a: string, b: string, c?: Record<string, unknown>) => void }).va;
    if (typeof va === 'function') {
      va('event', event, props as Record<string, unknown> | undefined);
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', payload);
    }
  } catch (_) {}
}
