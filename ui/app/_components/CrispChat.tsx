"use client";

import { Crisp } from "crisp-sdk-web";
import { useEffect } from "react";

const CRISP_WEBSITE_ID = "6d61b7c2-9d92-48dd-b4b9-5c8317f44099";

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure(CRISP_WEBSITE_ID);
  }, []);

  return null;
};
