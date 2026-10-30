"use client";

import { Notice } from "@codegouvfr/react-dsfr/Notice";

import { useAuth } from "../_context/UserContext";

export const LectureSeuleNotice = () => {
  const { user } = useAuth();

  if (!user?.impersonating || !user.readOnly) return null;

  return (
    <Notice
      title="Imposture en lecture seule"
      description="Vous consultez cet espace sous l'identité de l'organisation : les modifications et les exports sont désactivés."
    />
  );
};
