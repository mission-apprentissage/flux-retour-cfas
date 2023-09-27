import { usePlausible } from "next-plausible";

import { _get, _post, _put } from "@/common/httpClient";
import { getOrganisationLabel } from "@/common/internal/Organisation";

import useAuth from "./useAuth";

// track des actions via plausible avec l'organisation en propriétés
export function usePlausibleTracking() {
  const { auth } = useAuth();
  const plausible = usePlausible();

  return {
    trackPlausibleEvent(goal: string, props?: Record<string, string | number | boolean>) {
      plausible(goal, {
        props: {
          type: auth.organisation.type,
          nom: getOrganisationLabel(auth.organisation),
          ...props,
        },
      });
    },
  };
}
