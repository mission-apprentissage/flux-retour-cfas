import { usePlausible } from "next-plausible";
import { PlausibleGoalType, getOrganisationLabel } from "shared";

import useAuth from "./useAuth";

export function usePlausibleTracking() {
  const { auth } = useAuth();
  const plausible = usePlausible();

  return {
    trackPlausibleEvent(
      goal: PlausibleGoalType,
      currentPath?: string,
      props?: Record<string, string | number | boolean>
    ) {
      const eventProps: Record<string, string | number | boolean | undefined> = {
        userEmail: auth?.email,
        organisationType: auth?.organisation?.type,
        organisationNom: auth?.organisation ? getOrganisationLabel(auth.organisation) : undefined,
        ...(currentPath ? { currentPath: currentPath } : {}),
        ...props,
      };

      plausible(goal, { props: eventProps });
    },
  };
}
