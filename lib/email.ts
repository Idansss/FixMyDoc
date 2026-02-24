import { Resend } from 'resend';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export type EmailTemplate = 'welcome' | 'usage_limit' | 'upgrade_success' | 'analysis_done' | 'payment_failed' | 'trial_will_end';

export interface WelcomeData {
  userName?: string;
}

export interface UsageLimitData {
  upgradeUrl: string;
}

export interface UpgradeSuccessData {
  plan: string;
}

export interface AnalysisDoneData {
  documentName: string;
  viewUrl: string;
}

export interface PaymentFailedData {
  billingUrl?: string;
}

export interface TrialWillEndData {
  plan: string;
  billingUrl?: string;
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  data: WelcomeData | UsageLimitData | UpgradeSuccessData | AnalysisDoneData | PaymentFailedData | TrialWillEndData
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not set; skipping email');
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'FixMyDoc <onboarding@resend.dev>';
  const subject = getSubject(template, data as never);
  const html = getHtml(template, data as never);

  await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });
}

function getSubject(template: EmailTemplate, data: never): string {
  switch (template) {
    case 'welcome':
      return 'Welcome to FixMyDoc';
    case 'usage_limit':
      return "You've reached your daily limit – upgrade to continue";
    case 'upgrade_success':
      return 'Your FixMyDoc subscription is active';
    case 'analysis_done':
      return 'Your document analysis is ready';
    case 'payment_failed':
      return 'FixMyDoc: Payment failed – please update your billing';
    case 'trial_will_end':
      return 'Your FixMyDoc trial ends soon';
    default:
      return 'FixMyDoc';
  }
}

function getHtml(template: EmailTemplate, data: never): string {
  switch (template) {
    case 'welcome':
      return welcomeHtml(data as WelcomeData);
    case 'usage_limit':
      return usageLimitHtml(data as UsageLimitData);
    case 'upgrade_success':
      return upgradeSuccessHtml(data as UpgradeSuccessData);
    case 'analysis_done':
      return analysisDoneHtml(data as AnalysisDoneData);
    case 'payment_failed':
      return paymentFailedHtml(data as PaymentFailedData);
    case 'trial_will_end':
      return trialWillEndHtml(data as TrialWillEndData);
    default:
      return '<p>FixMyDoc</p>';
  }
}

function welcomeHtml(data: WelcomeData): string {
  const name = data.userName ? ` ${data.userName}` : '';
  return `
    <h1>Welcome to FixMyDoc${name}</h1>
    <p>FixMyDoc helps you improve your documents with AI. Upload a CV, legal doc, academic paper, or business document and get a quality score, issues list, and improved text.</p>
    <p>Get started in your dashboard.</p>
    <p>— The FixMyDoc team</p>
  `.trim();
}

function usageLimitHtml(data: UsageLimitData): string {
  const url = data.upgradeUrl || '#';
  return `
    <h1>Daily limit reached</h1>
    <p>You've used your free analysis for today. Upgrade to Pro or Business to analyze more documents.</p>
    <p><a href="${url}">Upgrade now</a></p>
    <p>— The FixMyDoc team</p>
  `.trim();
}

function upgradeSuccessHtml(data: UpgradeSuccessData): string {
  const plan = data.plan || 'Pro';
  return `
    <h1>You're all set</h1>
    <p>Your FixMyDoc ${plan} subscription is now active. You can analyze more documents and export as PDF or DOCX.</p>
    <p>— The FixMyDoc team</p>
  `.trim();
}

function analysisDoneHtml(data: AnalysisDoneData): string {
  const name = data.documentName || 'Your document';
  const url = data.viewUrl || '#';
  return `
    <h1>Analysis complete</h1>
    <p>We've finished analyzing "${name}". View your score, issues, and improved text in your dashboard.</p>
    <p><a href="${url}">View results</a></p>
    <p>— The FixMyDoc team</p>
  `.trim();
}

function paymentFailedHtml(data: PaymentFailedData): string {
  const url = data.billingUrl || '#';
  return `
    <h1>Payment failed</h1>
    <p>We couldn't charge your payment method for your FixMyDoc subscription. Please update your billing information so your access continues without interruption.</p>
    <p><a href="${url}">Update billing</a></p>
    <p>— The FixMyDoc team</p>
  `.trim();
}

function trialWillEndHtml(data: TrialWillEndData): string {
  const plan = data.plan || 'Pro';
  const url = data.billingUrl || '#';
  return `
    <h1>Trial ending soon</h1>
    <p>Your FixMyDoc ${plan} trial will end shortly. Add a payment method to keep your benefits.</p>
    <p><a href="${url}">Manage subscription</a></p>
    <p>— The FixMyDoc team</p>
  `.trim();
}
