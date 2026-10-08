'use client';
import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, type Auth } from 'firebase/auth';

let browserAuth: Auth | null = null;
export function getBrowserAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (browserAuth) return browserAuth;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) return null;
  const existing = getApps().find((app) => app.name === 'urai-content');
  if (existing && existing.options.projectId !== config.projectId) return null;
  const app = existing ?? initializeApp(config, 'urai-content');
  browserAuth = initializeAuth(app, { persistence: inMemoryPersistence });
  return browserAuth;
}
