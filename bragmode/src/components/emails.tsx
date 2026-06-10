import React from 'react';

interface FounderClaimedEmailProps {
  countryName: string;
  flag: string;
  founderNumber: number;
  hotTake: string;
  founderUrl: string;
}

export const FounderClaimedEmail: React.FC<FounderClaimedEmailProps> = ({
  countryName,
  flag,
  founderNumber,
  hotTake,
  founderUrl,
}) => {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#050505',
      color: '#ffffff',
      padding: '40px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      borderRadius: '16px',
      border: '1px solid #1a1a1a',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          margin: '0',
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: '#fbbf24',
        }}>
          BRAGMODE
        </h1>
        <p style={{ color: '#a3a3a3', fontSize: '16px', marginTop: '5px' }}>
          World Cup Founder Status Claimed!
        </p>
      </div>

      <div style={{
        backgroundColor: '#0a0a0a',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #262626',
        textAlign: 'center',
        marginBottom: '30px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>{flag}</div>
        <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#ffffff' }}>
          {countryName} Founder #{founderNumber}
        </h2>
        <span style={{
          backgroundColor: '#22c55e',
          color: '#ffffff',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'inline-block',
        }}>
          Verified Owner
        </span>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', color: '#fbbf24', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Your Hot Take Prediction
        </h3>
        <blockquote style={{
          borderLeft: '4px solid #fbbf24',
          margin: '0',
          padding: '10px 15px',
          backgroundColor: '#0a0a0a',
          borderRadius: '0 8px 8px 0',
          fontStyle: 'italic',
          color: '#e5e5e5',
        }}>
          &ldquo;{hotTake}&rdquo;
        </blockquote>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href={founderUrl} style={{
          backgroundColor: '#fbbf24',
          color: '#000000',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '700',
          textDecoration: 'none',
          display: 'inline-block',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
        }}>
          View Public Founder Page
        </a>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '40px 0 20px 0' }} />

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#737373' }}>
        <p style={{ margin: '0' }}>You received this email because you claimed Founder Status on BragMode.</p>
        <p style={{ margin: '5px 0 0 0' }}>&copy; {new Date().getFullYear()} BragMode. All rights reserved.</p>
      </div>
    </div>
  );
};

interface PaymentConfirmationEmailProps {
  countryName: string;
  flag: string;
  founderNumber: number;
  amount: string;
  downloadUrl: string;
}

export const PaymentConfirmationEmail: React.FC<PaymentConfirmationEmailProps> = ({
  countryName,
  flag,
  founderNumber,
  amount,
  downloadUrl,
}) => {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#050505',
      color: '#ffffff',
      padding: '40px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      borderRadius: '16px',
      border: '1px solid #1a1a1a',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          margin: '0',
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: '#fbbf24',
        }}>
          BRAGMODE
        </h1>
        <p style={{ color: '#a3a3a3', fontSize: '16px', marginTop: '5px' }}>
          Payment Receipt & Card Download
        </p>
      </div>

      <div style={{
        backgroundColor: '#0a0a0a',
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid #262626',
        marginBottom: '30px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#ffffff', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
          Payment Details
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#a3a3a3' }}>Item</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#ffffff' }}>
                BragMode World Cup Founder Pass ({flag} {countryName} #{founderNumber})
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#a3a3a3' }}>Amount Paid</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: '#22c55e' }}>{amount}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#a3a3a3' }}>Status</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#22c55e' }}>PAID</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        backgroundColor: '#0a0a0a',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #262626',
        textAlign: 'center',
        marginBottom: '30px',
      }}>
        <p style={{ margin: '0 0 20px 0', color: '#e5e5e5', fontSize: '15px' }}>
          Your high-resolution World Cup Founder Card is ready for download. Show the world your predictions!
        </p>
        <a href={downloadUrl} style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '700',
          textDecoration: 'none',
          display: 'inline-block',
          boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
        }}>
          Download Founder Card
        </a>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '40px 0 20px 0' }} />

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#737373' }}>
        <p style={{ margin: '0' }}>Thank you for backing your nation early on BragMode!</p>
        <p style={{ margin: '5px 0 0 0' }}>&copy; {new Date().getFullYear()} BragMode. All rights reserved.</p>
      </div>
    </div>
  );
};
