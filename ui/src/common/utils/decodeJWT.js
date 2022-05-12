import { decodeJwt } from "jose";

export default (access_token) => {
  return {
    access_token,
    ...decodeJwt(access_token),
  };
};
