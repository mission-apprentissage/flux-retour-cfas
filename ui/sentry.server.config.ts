import { httpIntegration, init } from "@sentry/nextjs";

import { buildUiSentryOptions } from "./common/sentryOptions";

const options = buildUiSentryOptions("next-server");

init({
  ...options,
  integrations: [httpIntegration({ tracing: true }), ...options.integrations],
});
