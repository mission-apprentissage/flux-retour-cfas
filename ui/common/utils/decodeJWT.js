import { decodeJwt } from "jose";

export default function decode(token) {
  return {
    token,
    ...decodeJwt(token),
  };
}
