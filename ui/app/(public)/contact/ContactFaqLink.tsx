"use client";

import { CRISP_FAQ } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { PAGES } from "@/app/_utils/routes.utils";

export function ContactFaqLink() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <DsfrLink href={CRISP_FAQ} onClick={() => trackPlausibleEvent("clic_sifa_faq", PAGES.static.contact.getPath())}>
      Avez-vous consulté notre FAQ ?
    </DsfrLink>
  );
}
