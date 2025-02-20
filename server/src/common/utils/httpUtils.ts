import { Response } from "express";

import { COOKIE_NAME } from "@/common/constants/cookieName";

export function responseWithCookie(res: Response, token: string) {
  return res.cookie(COOKIE_NAME, token, {
    maxAge: 6 * 24 * 60 * 60 * 1000, // 6 jours (unité en millisecondes)
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
}
