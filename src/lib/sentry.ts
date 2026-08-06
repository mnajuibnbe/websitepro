import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.user;
      delete event.request?.headers;
      delete event.request?.cookies;
      delete event.server_name;
      return event;
    },
  });
}

export { Sentry };
