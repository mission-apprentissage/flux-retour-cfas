"use client";

import { usePlausible } from "next-plausible";
import { IOrganisationCreate, PlausibleGoalType, getOrganisationLabel } from "shared";

import { useAuth } from "../_context/UserContext";

export function usePlausibleAppTracking() {
  const { user } = useAuth();
  const plausible = usePlausible();

  return {
    trackPlausibleEvent(
      goal: PlausibleGoalType,
      currentPath?: string,
      props?: Record<string, string | number | boolean>
    ) {
      const eventProps: Record<string, string | number | boolean | undefined> = {
        userId: user?._id,
        organisationType: user?.organisation?.type,
        organisationNom: user?.organisation
          ? getOrganisationLabel(user.organisation as IOrganisationCreate)
          : undefined,
        ...(currentPath ? { currentPath: currentPath } : {}),
        ...props,
      };

      plausible(goal, { props: eventProps });
    },
  };
}
