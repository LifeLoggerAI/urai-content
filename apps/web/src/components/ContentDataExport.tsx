'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type Auth, type User } from 'firebase/auth';
import { getBrowserAuth } from '@/lib/firebaseClient';
import { ContentDataExportController, ContentExportAccountObserver, restoreContentExportFocus } from '@/lib/contentDataExport';

export function ContentDataExport({ expectedUid, projectMatches }: { expectedUid: string; projectMatches: boolean }) {
  const controller = useMemo(() => new ContentDataExportController(), []);
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [account, setAccount] = useState<User | null>(null);
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [ended, setEnded] = useState(false);
  const generation = useRef(0);
  const section = useRef<HTMLElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreContentExportFocus(section.current, lastFocus.current);
  }, [state.phase, account, available, ended, pending]);
  const sessionEnded = useRef(false);
  const observer = useRef<ContentExportAccountObserver<User> | null>(null);
  useEffect(() => { if (state.phase === 'signed-out') observer.current?.clearLocal(); }, [state.phase]);
  useEffect(() => {
    controller.start(); generation.current++; sessionEnded.current = false;
    setAuth(null); setAccount(null); setAvailable(false); setPending(false); setEnded(false);
    const endSession = () => { sessionEnded.current = true; generation.current++; observer.current?.endSession(); controller.setActor(null); setAccount(null); setPending(false); setEnded(true); };
    const hide = () => { generation.current++; controller.cancel(); setPending(false); };
    window.addEventListener('urai-content-session-ending', endSession);
    window.addEventListener('pagehide', hide);
    let stop = () => {};
    let instance: Auth | null = null;
    if (projectMatches) { try { instance = getBrowserAuth(); } catch { /* Protected binding must remain truthful. */ } }
    if (instance) {
      const currentAuth = instance; setAuth(currentAuth); setAvailable(true);
      const accountObserver = new ContentExportAccountObserver<User>(controller, expectedUid, () => currentAuth.currentUser,
        (user) => { generation.current++; setPending(false); setMessage(''); if (!sessionEnded.current) setAccount(user); });
      observer.current = accountObserver;
      stop = onIdTokenChanged(currentAuth, user => accountObserver.observe(user));
    }
    return () => { generation.current++; stop(); observer.current = null; controller.dispose(); window.removeEventListener('urai-content-session-ending', endSession); window.removeEventListener('pagehide', hide); };
  }, [controller, expectedUid, projectMatches]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth || pending || sessionEnded.current) return;
    const values = new FormData(event.currentTarget); const email = String(values.get('email') ?? ''); let password = String(values.get('password') ?? '');
    values.delete('password'); event.currentTarget.reset(); setMessage(''); setPending(true);
    const started = generation.current, result = signInWithEmailAndPassword(auth, email, password); password = '';
    try { await result; } catch { if (started === generation.current) setMessage('Sign-in could not be completed. Check your existing account and try again.'); }
    finally { if (started === generation.current) setPending(false); }
  }
  async function clearActor() {
    if (!auth) return; generation.current++; controller.setActor(null); setAccount(null); setMessage('');
    const started = generation.current;
    try { await signOut(auth); } catch { if (started === generation.current) setMessage('Sign-out could not be confirmed. Reload before continuing.'); }
  }
  const matching = account?.uid === expectedUid && !ended;
  return <section ref={section} className="form-panel" aria-labelledby="content-export-title"
    onFocusCapture={event => { if (event.target instanceof HTMLElement) lastFocus.current = event.target; }}
    onBlurCapture={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) lastFocus.current = null; }}>
    <h2 id="content-export-title">Download your Content records</h2>
    <p id="content-export-scope">This is a partial Content export of your content, revision history, submissions, marketplace entries, access grants and activity records. It preserves recorded source text and labels.</p>
    <details><summary style={{ minHeight: 48, paddingBlock: 12 }}>What this file excludes</summary>
      <p>Moderation queues, publishing releases, narrator prompts, story templates, ritual templates and export templates are not included. Unknown stored fields, reviewer identities, internal moderation notes and migration annotations are also excluded. This is not an export of your entire UrAi account.</p>
    </details>
    <p>Keep the downloaded file private. Cancelling prevents a pending download; a file already saved on your device cannot be recalled.</p>
    {ended ? <p role="status">Sign-out was started. <a href="/dashboard" data-export-recovery-focus>Return to your account</a> to continue.</p>
      : !available ? <p role="status">Secure Content sign-in is unavailable here. <a href="/contact">Contact privacy support</a> for help with your export.</p>
      : !account ? <form className="lead-form" onSubmit={login}>
        <p className="full-span">Confirm your existing Content sign-in to download records for this account.</p>
        <label>Email<input data-export-recovery-focus name="email" type="email" autoComplete="username" required disabled={pending} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required disabled={pending} /></label>
        <button className="button" data-export-recovery-focus type="submit" aria-disabled={pending} style={{ minHeight: 48 }}>{pending ? 'Signing in…' : 'Confirm sign-in'}</button>
      </form> : !matching ? <>
        <p role="alert">The browser sign-in differs from this account. Sign out below and confirm the same account, or return to your account page.</p>
        <button type="button" className="button secondary" data-export-recovery-focus onClick={() => { void clearActor(); }} style={{ minHeight: 48 }}>Clear browser sign-in</button>
      </> : <>
        <label className="checkbox" style={{ minHeight: 48 }}><input data-export-recovery-focus type="checkbox" checked={state.confirmed} onChange={event => controller.setConfirmed(event.target.checked)} aria-describedby="content-export-scope" style={{ minWidth: 24, minHeight: 24 }} /><span>I understand the file covers only the Content records listed above.</span></label>
        <div className="actions">
          <button type="button" className="button" aria-disabled={!state.confirmed || state.busy} onClick={() => { void controller.download(); }} style={{ minHeight: 48 }}>Download Content records</button>
          {state.busy ? <button type="button" className="button secondary" onClick={() => controller.cancel()} style={{ minHeight: 48 }}>Cancel export</button> : null}
        </div>
      </>}
    <p role="status" aria-live="polite">{state.message}</p>
    {message ? <p role="alert">{message}</p> : null}
    <a data-export-recovery-focus href="/contact">Contact privacy support</a>
  </section>;
}
