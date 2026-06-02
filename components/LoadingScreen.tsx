'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadingContext =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password-save'
  | 'create-account-submit'
  | 'home'
  | 'dashboard'
  | 'attendance-overview'
  | 'certificates'
  | 'events-joined'
  | 'events-organized'
  | 'saved-events'
  | 'attendance-list'
  | 'attendance-details'
  | 'profile'
  | 'feedback'
  | 'logout'
  | 'create-event'
  | 'event-details'
  | 'general';

type LoadingScreenProps = {
  context?: LoadingContext;
};

const loadingMessages: Record<LoadingContext, string[]> = {
  splash: ['Initializing DC Space...'],
  login: ['Signing you in...'],
  register: ['Loading sign-up form...'],
  'forgot-password': ['Loading reset password form...'],
  'reset-password-save': ['Saving your new password...'],
  'create-account-submit': ['Creating your account...'],
  home: ['Loading events...'],
  dashboard: ['Loading your dashboard...'],
  'attendance-overview': ['Loading attendance records...'],
  certificates: ['Loading your certificates...'],
  'events-joined': ['Loading joined events...'],
  'events-organized': ['Loading organized events...'],
  'saved-events': ['Loading saved events...'],
  'attendance-list': ['Loading attendance history...'],
  'attendance-details': ['Loading event attendance...'],
  profile: ['Loading your profile...'],
  feedback: ['Loading feedback form...'],
  logout: ['Logging out...'],
  'create-event': ['Preparing event form...'],
  'event-details': ['Loading event details...'],
  general: ['Processing your request...'],
};

export function LoadingScreen({ context = 'splash' }: LoadingScreenProps) {
  const messages = useMemo(() => loadingMessages[context] || loadingMessages.splash, [context]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % messages.length);
    }, 1300);

    return () => window.clearInterval(timer);
  }, [messages.length]);

  return (
    <section className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-screen__content">
        <div className="loading-squares" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <p>{messages[messageIndex]}</p>
      </div>
    </section>
  );
}