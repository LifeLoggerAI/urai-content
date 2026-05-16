'use client';

import { type FormEvent, useState } from 'react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type LeadFormProps = {
  kind: 'waitlist' | 'contact';
  title: string;
  description: string;
  defaultLeadType?: string;
};

export function LeadForm({ kind, title, description, defaultLeadType = 'user' }: LeadFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState<string>('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, ...payload })
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Unable to submit right now.');
      }

      form.reset();
      setStatus('success');
      setMessage(data.message ?? 'Received.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit right now.');
    }
  }

  return (
    <section className="form-panel" aria-labelledby={`${kind}-form-title`}>
      <div>
        <p className="eyebrow">Secure intake</p>
        <h2 id={`${kind}-form-title`}>{title}</h2>
        <p>{description}</p>
      </div>
      <form onSubmit={submit} className="lead-form">
        <label>
          Name
          <input name="name" autoComplete="name" placeholder="Your name" />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Interest type
          <select name="leadType" defaultValue={defaultLeadType} required>
            <option value="user">User / early access</option>
            <option value="demo">Demo access</option>
            <option value="investor">Investor</option>
            <option value="partner">Partner</option>
            <option value="research">Researcher</option>
            <option value="press">Press</option>
            <option value="contact">General contact</option>
          </select>
        </label>
        <label>
          Organization
          <input name="organization" autoComplete="organization" placeholder="Optional" />
        </label>
        <label className="full-span">
          Note
          <textarea name="message" rows={4} placeholder="Tell us what you are interested in." />
        </label>
        <label className="checkbox full-span">
          <input name="consentToUpdates" type="checkbox" value="true" required />
          <span>I agree to receive URAI updates and understand I can opt out later.</span>
        </label>
        <button className="button" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : kind === 'waitlist' ? 'Join the Waitlist' : 'Send Inquiry'}
        </button>
        {message ? <p className={`form-message ${status}`} role="status">{message}</p> : null}
      </form>
    </section>
  );
}
