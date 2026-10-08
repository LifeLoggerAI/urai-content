'use client';

import { useState } from 'react';

export function BrowserSessionLogout() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Sign out failed');
      window.location.assign('/dashboard');
    } catch {
      setError('Could not sign out. Please try again.');
      setPending(false);
    }
  }
  return <div>
    <button type="button" className="button" style={{ minHeight: 48, minWidth: 48 }} disabled={pending} onClick={signOut}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}

