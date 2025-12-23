import axios from "axios";
import { ObjectId } from "bson";
import jwt from "jsonwebtoken";

import { generateKey } from "@/common/utils/cryptoUtils";
import config from "@/config";

import { proconnectSessionsDb } from "../model/collections";

export function loginProConnect() {
  const response_type = "code";
  const client_id = config.auth.proconnect.clientId;
  const redirect_uri = `${config.publicUrl}/api/v1/auth/proconnect/callback`;
  //const redirect_uri = `http://localhost:5001/api/v1/auth/proconnect/callback`;
  const scope = "openid email given_name usual_name siret";
  const state = generateKey();
  const nonce = generateKey();

  const tx = {
    state,
    nonce,
    iat: Date.now(),
  };

  return {
    url: `${config.auth.proconnect.issuer}/api/v2/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&nonce=${nonce}`,
    tx,
  };
}

export async function getTokenProConnect(code: string) {
  const token = await axios.post(
    `${config.auth.proconnect.issuer}/api/v2/token`,
    {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: `${config.publicUrl}/api/v1/auth/proconnect/callback`,
      // redirect_uri: `http://localhost:5001/api/v1/auth/proconnect/callback`,
      client_id: config.auth.proconnect.clientId,
      client_secret: config.auth.proconnect.clientSecret,
      scope: "openid email given_name usual_name siret",
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { id_token, access_token, refresh_token, expires_in } = token.data;
  const userInfo = await axios.get(`${config.auth.proconnect.issuer}/api/v2/userinfo`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const jwtData: Record<string, string> = jwt.decode(userInfo.data) as Record<string, string>;
  const email = jwtData?.email;
  return {
    email,
    access_token,
    expires_in,
    id_token,
    refresh_token,
  };
}

export async function logoutProConnect(email: any) {
  const pcSession = await proconnectSessionsDb().findOne({ email });
  if (!pcSession) {
    throw new Error("No ProConnect session found for logout");
  }
  const state = generateKey();
  const { id_token } = pcSession;

  return {
    url: `${config.auth.proconnect.issuer}/api/v2/session/end?id_token_hint=${id_token}&state=${state}&post_logout_redirect_uri=${encodeURIComponent(`http://localhost:5001/api/v1/auth/proconnect/logout/callback`)}`,
    state,
    email,
  };
}

export async function refreshProConnectToken(email: string, refresh_token: string) {
  await proconnectSessionsDb().deleteOne({ email });
  const refreshed = await axios.post(`${config.auth.proconnect.issuer}/api/v2/token`, {
    grant_type: "refresh_token",
    refresh_token: refresh_token,
    client_id: config.auth.proconnect.clientId,
    client_secret: config.auth.proconnect.clientSecret,
    scope: "openid email given_name usual_name siret",
  });
  const { access_token, refresh_token: new_refresh_token, expires_in, id_token } = refreshed.data;

  const expires_at = new Date();
  expires_at.setSeconds(expires_at.getSeconds() + expires_in);

  await proconnectSessionsDb().insertOne({
    _id: new ObjectId(),
    email,
    access_token,
    refresh_token: new_refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000),
    id_token,
  });
}
