import { usePlausible } from "next-plausible";
import { PlausibleGoalType } from "shared";

import { _get, _post, _put } from "@/common/httpClient";
import { getOrganisationLabel } from "@/common/internal/Organisation";

import useAuth from "./useAuth";

// track des actions via plausible avec l'organisation en propriétés
export function usePlausibleTracking() {
  const { auth } = useAuth();
  const plausible = usePlausible();

  return {
    trackPlausibleEvent(goal: PlausibleGoalType, props?: Record<string, string | number | boolean>) {
      plausible(goal, {
        props: {
          organisationType: auth?.organisation?.type,
          organisationNom: auth?.organisation ? getOrganisationLabel(auth.organisation) : undefined,
          ...props,
        },
      });
    },
  };
}
