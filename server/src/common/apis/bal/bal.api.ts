import axios from "axios";
import { IEmailStatusEnum } from "shared/models";

import config from "@/config";

import getApiClient from "../client";

const axiosClient = getApiClient({
  baseURL: config.bal.endpoint,
});

axiosClient.defaults.headers.common["Authorization"] = `Bearer ${config.bal.bearer_key}`;

export const verifyBouncerMails = async (
  emails: Array<string>
): Promise<Array<{ email: string; status: IEmailStatusEnum }>> => {
  const res = await axios.post("v1/bouncer/check", emails);
  if (res.status !== 200) {
    throw new Error("Error verifying emails");
  }
  return res.data as Array<{ email: string; status: IEmailStatusEnum }>;
};
