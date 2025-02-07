import http from "http";
import https from "https";

import axios, { type AxiosRequestConfig } from "axios";
import { setupCache } from "axios-cache-interceptor";
import type { AxiosCacheInstance } from "axios-cache-interceptor";

const getApiClient = (options: AxiosRequestConfig): AxiosCacheInstance =>
  setupCache(
    axios.create({
      timeout: 5000,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      ...options,
    }),
    {
      ttl: 1000 * 60 * 10, // 10 Minutes
    }
  );

export default getApiClient;
