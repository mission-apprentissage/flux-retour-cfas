import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

const getApiClient = (options) =>
  setupCache(axios.create(options), {
    ttl: 1000 * 60 * 10, // 10 Minutes
  });

export default getApiClient;
