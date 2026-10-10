'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';
import { getBrowserAuth } from '@/lib/firebaseClient';
import { CreatorWorkflowController } from '@/lib/creatorWorkflow';

export function CreatorWorkflow({ projectMatches, mode }: { projectMatches: boolean; mode: 'submit' | 'history' }) {
  const controller = useMemo(() => new CreatorWorkflowController(), []);
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [account, setAccount] = useState<User | null>(null);
  const [available, setAvailable] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [draftKey, setDraftKey] = useState(0);
  const generation = useRef(0);
  useEffect(() => { if (!state.authorized) setConfirm(false); }, [state.authorized]);
  useEffect(() => {
    controller.start();
    const invalidateContinuation = () => { generation.current++; };
    invalidateContinuation(); setAvailable(false); setAuth(null); setAccount(null); setConfirm(false); setSigningIn(false); setDraftKey((key) => key + 1);
    let stop = () => {};
    if (projectMatches) {
      let instance: Auth | null = null;
      try { instance = getBrowserAuth(); } catch { /* Unavailable configuration stays denied. */ }
      if (instance) {
        const currentAuth = instance;
        setAuth(currentAuth); setAvailable(true);
        stop = onIdTokenChanged(currentAuth, (user) => {
          generation.current++;
          setAccount(user); setConfirm(false); setSigningIn(false); setLoginMessage(''); setDraftKey((key) => key + 1);
          controller.setActor(user ? {
            uid: user.uid,
            isCurrent: () => currentAuth.currentUser === user,
            getToken: async () => {
              const token = await user.getIdToken();
              if (currentAuth.currentUser !== user) throw new Error('Account changed.');
              return token;
            }
          } : null);
          if (user) void controller.refresh();
        });
      }
    }
    return () => { invalidateContinuation(); stop(); controller.dispose(); };
  }, [controller, projectMatches]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signingIn) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get('email') ?? '');
    let password = String(values.get('password') ?? '');
    values.delete('password'); form.reset(); setLoginMessage('');
    if (!auth) { password = ''; return; }
    const pending = signInWithEmailAndPassword(auth, email, password);
    password = ''; setSigningIn(true);
    const started = generation.current;
    try { await pending; } catch { if (generation.current === started) setLoginMessage('Sign-in could not be completed. Check your account and try again.'); }
    finally { if (generation.current === started) setSigningIn(false); }
  }
  async function logout() {
    const started = ++generation.current;
    controller.setActor(null); setAccount(null); setConfirm(false); setDraftKey((key) => key + 1);
    try { if (auth) await signOut(auth); } catch { if (generation.current === started) setLoginMessage('Sign-out could not be confirmed. Reload this page before continuing.'); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const started = generation.current;
    const saved = await controller.submit({ title: String(values.get('title') ?? '').trim(), body: String(values.get('body') ?? '').trim(), contentType: 'story', tags: [], locale: 'en-US' });
    if (saved && generation.current === started) { setDraftKey((key) => key + 1); setConfirm(false); }
  }
  return <section className="form-panel" aria-label="Private creator workflow">
    <nav aria-label="Creator workflow"><Link href="/creator/submit">Submit for review</Link>{' · '}<Link href="/creator/submissions">Your submissions</Link></nav>
    <p>Submissions remain private review records. They are not publication or licensing approval.</p>
    {!available ? <p role="status">Creator sign-in is unavailable here.</p> : !account ? <form className="lead-form" onSubmit={login}>
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="button" type="submit" disabled={signingIn}>Sign in</button>
    </form> : <>
      <button className="button secondary" onClick={() => { void logout(); }}>Sign out</button>
      <button className="button secondary" disabled={state.busy} onClick={() => { void controller.refresh(); }}>Reload your history</button>
      {state.authorized && mode === 'submit' ? <form key={draftKey} className="lead-form" onSubmit={submit}>
        <label>Title<input name="title" required maxLength={160} disabled={state.busy} /></label>
        <label className="full-span">Content<textarea name="body" required maxLength={20000} rows={8} disabled={state.busy} /></label>
        <label className="checkbox full-span"><input type="checkbox" checked={confirm} onChange={(event) => { generation.current++; setConfirm(event.target.checked); controller.setConsent(event.target.checked); }} /><span>I am permitted to submit this content for private review.</span></label>
        <button className="button" type="submit" disabled={!confirm || state.busy}>Submit for review</button>
      </form> : null}
      {state.authorized && state.submissions.length === 0 ? <p>No saved submissions yet.</p> : null}
      {state.authorized && state.submissions.length > 0 ? <ul aria-label="Your saved submissions">{state.submissions.map((item) => <li key={item.id}><strong>{item.title}</strong>{' — '}{item.status}</li>)}</ul> : null}
    </>}
    <p role="status">{state.phase === 'loading' ? 'Checking your current access and history…' : state.phase === 'saving' ? 'Saving your submission…' : state.message}</p>
    {loginMessage ? <p role="alert">{loginMessage}</p> : null}
  </section>;
}
