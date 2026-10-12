import { init } from "@sentry/nextjs";

import { buildUiSentryOptions } from "./common/sentryOptions";
import { publicConfig } from "./config.public";

init({
  ...buildUiSentryOptions("next-client"),
  tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl, /^\//],
});
