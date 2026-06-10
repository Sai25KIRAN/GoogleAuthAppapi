import React from 'react';
import { Resend } from 'resend';
import { FounderClaimedEmail, PaymentConfirmationEmail } from '../components/emails';

const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_key';

if (!resendApiKey) {
  console.warn('Warning: RESEND_API_KEY is missing.');
}

export const resend = new Resend(resendApiKey);

// Configurable sender - fallback to onboarding@resend.dev for test keys without verified domains
const EMAIL_FROM = process.env.EMAIL_FROM || 'BragMode <founders@bragmode.com>';

export async function sendFounderEmails({
  email,
  countryName,
  flag,
  founderNumber,
  hotTake,
  claimId,
}: {
  email: string;
  countryName: string;
  flag: string;
  founderNumber: number;
  hotTake: string;
  claimId: string;
}) {
  if (!resendApiKey) {
    console.error('Resend API key is missing. Skipping emails.');
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  // Format country slug to match URL format /founder/[country]/[number]
  const countrySlug = countryName.toLowerCase().trim().replace(/\s+/g, '-');
  const founderUrl = `${appUrl}/founder/${countrySlug}/${founderNumber}`;
  const downloadUrl = `${appUrl}/api/claims/${claimId}/download`;

  // Fallback to onboarding@resend.dev if using test sandbox resend keys
  const fromAddress = resendApiKey.startsWith('re_open') || resendApiKey.includes('test') 
    ? 'BragMode <onboarding@resend.dev>' 
    : EMAIL_FROM;

  console.log(`Sending emails from ${fromAddress} to ${email}...`);

  try {
    // 1. Send Founder Claimed Email
    const email1 = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `🏆 Founder Status Claimed: ${countryName} #${founderNumber}!`,
      react: FounderClaimedEmail({
        countryName,
        flag,
        founderNumber,
        hotTake,
        founderUrl,
      }) as React.ReactElement,
    });
    console.log('Founder Claimed Email sent:', email1);

    // 2. Send Payment Confirmation Email
    const email2 = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `🧾 BragMode Receipt: ${countryName} Founder #${founderNumber}`,
      react: PaymentConfirmationEmail({
        countryName,
        flag,
        founderNumber,
        amount: '$1.99 USD',
        downloadUrl,
      }) as React.ReactElement,
    });
    console.log('Payment Confirmation Email sent:', email2);
  } catch (error) {
    console.error('Error sending emails through Resend API:', error);
  }
}
