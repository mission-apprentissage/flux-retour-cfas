"use client";

import { getOrganisationLabel, IOrganisationCreate } from "shared";

import { ServiceDiscontinuedPage } from "../../_components/ServiceDiscontinuedPage";
import { useAuth } from "../../_context/UserContext";

export default function DecommissionnementPage() {
  const { user } = useAuth();

  const userName = user ? `${user.prenom} ${user.nom}` : "";
  const organisationLabel = user?.organisation ? getOrganisationLabel(user.organisation as IOrganisationCreate) : "";

  return <ServiceDiscontinuedPage userName={userName} organisationLabel={organisationLabel} />;
}
