import { useState } from 'react';

export default function LoginScreen({ onSignIn }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignIn();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        const messages = {
          'auth/invalid-api-key':        'Invalid Firebase API key — check src/firebase.js config.',
          'auth/unauthorized-domain':    'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized Domains.',
          'auth/operation-not-allowed':  'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
          'auth/configuration-not-found':'Firebase project not found — check your projectId in src/firebase.js.',
        };
        setError(messages[err.code] || `${err.code}: ${err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 36px 40px',
        boxShadow: 'var(--card-shadow)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: '52px',
          fontFamily: '"Noto Serif SC", serif',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '-1px',
          lineHeight: 1,
          marginBottom: '12px',
        }}>
          吴熙
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '8px',
          letterSpacing: '-0.3px',
        }}>
          WuXi
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--text2)',
          marginBottom: '40px',
          lineHeight: 1.5,
        }}>
          Learn Mandarin, one character at a time
        </p>

        {/* Google Sign-in button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '13px 20px',
            background: loading ? 'var(--surface2)' : 'var(--surface2)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'var(--transition)',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p style={{
            marginTop: '16px',
            fontSize: '13px',
            color: 'var(--danger)',
          }}>
            {error}
          </p>
        )}

        <p style={{
          marginTop: '28px',
          fontSize: '12px',
          color: 'var(--text3)',
          lineHeight: 1.6,
        }}>
          Your progress is saved to your Google account and synced across devices.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
