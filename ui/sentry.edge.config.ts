import { init } from "@sentry/nextjs";

import { buildUiSentryOptions } from "./common/sentryOptions";

init(buildUiSentryOptions("next-edge"));
