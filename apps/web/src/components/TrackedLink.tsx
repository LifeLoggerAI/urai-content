'use client';

import { type AnchorHTMLAttributes } from 'react';
import { trackPublicEvent } from './AnalyticsTracker';

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName?: string;
  eventLabel?: string;
};

export function TrackedLink({ eventName = 'cta_clicked', eventLabel, href, onClick, children, ...props }: TrackedLinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        trackPublicEvent(eventName, {
          label: eventLabel ?? String(children ?? ''),
          href: typeof href === 'string' ? href : null
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
