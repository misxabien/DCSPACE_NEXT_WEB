'use client';

import { useEffect, useMemo, useState } from 'react';

type LoadingContext =
  | 'splash'
  | 'login'
  | 'register'
  | 'forgot-password'
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
  | 'create-event'
  | 'event-details'
  | 'general';

type LoadingScreenProps = {
  context?: LoadingContext;
};

const loadingMessages: Record<LoadingContext, string[]> = {
  splash: [
    'Initializing DC Space...',
    'Loading DC Space...',
    'Preparing your experience...',
    'Getting everything ready...',
  ],
  login: [
    'Signing you in...',
    'Verifying your credentials...',
    'Preparing your dashboard...',
    'Logging you in...',
  ],
  register: [
    'Creating your account...',
    'Setting up your profile...',
    'Preparing your account...',
    'Registering your information...',
  ],
  'forgot-password': [
    'Verifying your account...',
    'Updating your password...',
    'Securing your account...',
    'Processing password reset...',
  ],
  home: [
    'Loading events...',
    'Finding available events...',
    'Preparing event listings...',
    'Fetching latest events...',
  ],
  dashboard: [
    'Loading your dashboard...',
    'Preparing your activity summary...',
    'Fetching your records...',
    'Syncing your data...',
  ],
  'attendance-overview': ['Loading attendance records...'],
  certificates: [
    'Loading certificates...',
    'Fetching certificate records...',
    'Preparing your certificates...',
    'Retrieving certificate data...',
  ],
  'events-joined': ['Loading joined events...'],
  'events-organized': [
    'Loading organized events...',
    'Fetching event management data...',
    'Preparing your events...',
    'Syncing organization records...',
  ],
  'saved-events': [
    'Loading saved events...',
    'Fetching bookmarked events...',
    'Preparing your saved events...',
  ],
  'attendance-list': [
    'Loading attendance history...',
    'Fetching attendance records...',
    'Preparing attendance details...',
  ],
  'attendance-details': [
    'Loading event attendance...',
    'Fetching tap records...',
    'Syncing RFID attendance...',
    'Preparing attendance logs...',
  ],
  profile: [
    'Loading your profile...',
    'Fetching account information...',
    'Preparing profile details...',
  ],
  feedback: [
    'Submitting feedback...',
    'Sending your feedback...',
    'Processing your response...',
  ],
  'create-event': [
    'Preparing event form...',
    'Loading event details...',
    'Configuring attendance settings...',
    'Preparing attendance rules...',
    'Uploading files...',
    'Preparing event documents...',
    'Processing uploads...',
    'Reviewing event details...',
    'Preparing event submission...',
    'Submitting event request...',
    'Sending event for approval...',
    'Processing approval request...',
  ],
  'event-details': [
    'Loading event details...',
    'Preparing event details...',
    'Fetching latest event information...',
  ],
  general: [
    'Saving draft...',
    'Submitting request...',
    'Removing item...',
    'Exporting records...',
    'Generating certificates...',
  ],
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
