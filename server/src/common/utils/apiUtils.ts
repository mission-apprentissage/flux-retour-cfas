import { RateLimiterMemory, RateLimiterQueue } from "rate-limiter-flexible";

import { timeout } from "./asyncUtils";

interface ApiRateLimiterOptions<TClient> {
  nbRequests?: number;
  durationInSeconds?: number;
  maxQueueSize?: number;
  timeout?: number;
  client?: TClient;
}

export const apiRateLimiter = <TClient = undefined>(name: string, options: ApiRateLimiterOptions<TClient> = {}) => {
  let rateLimiter = new RateLimiterMemory({
    keyPrefix: name,
    points: options.nbRequests || 1,
    duration: options.durationInSeconds || 1,
  });

  let queue = new RateLimiterQueue(rateLimiter, {
    maxQueueSize: options.maxQueueSize || 25,
  });

  return async <TResult>(callback: (client: TClient) => Promise<TResult> | TResult) => {
    await timeout(queue.removeTokens(1), options.timeout || 10000);
    return callback(options.client as TClient);
  };
};

export class ApiError extends Error {
  apiName: string;
  message: string;
  reason: string | number | undefined;

  constructor(apiName: string, message: string, reason?: string | number) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.apiName = apiName;
    this.message = `[${apiName}] ${message}`;
    this.reason = reason;
  }
}
