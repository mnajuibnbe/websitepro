import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
let initialized = false;

export function initSentry() {
  if (!dsn || initialized) return;
  initialized = true;
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
