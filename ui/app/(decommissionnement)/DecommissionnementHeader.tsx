"use client";

import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header";
import { getOrganisationLabel, IOrganisationCreate } from "shared";

import { DropdownMenu, DropdownMenuButton } from "@/app/_components/common/DropdownMenu";
import { _post } from "@/common/httpClient";

import { Impersonate } from "../_components/Impersonate";
import { useAuth } from "../_context/UserContext";

function LogoutMenu() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const logout = async () => {
    await _post("/api/v1/auth/logout");
    window.location.href = "/";
  };

  return (
    <DropdownMenu
      label={getOrganisationLabel(user.organisation as IOrganisationCreate)}
      buttonIconId="ri-account-circle-fill"
    >
      {() => (
        <DropdownMenuButton onClick={logout} icon="fr-icon-logout-box-r-line">
          Déconnexion
        </DropdownMenuButton>
      )}
    </DropdownMenu>
  );
}

export function DecommissionnementHeader() {
  return (
    <DsfrHeader
      brandTop={<>RÉPUBLIQUE FRANÇAISE</>}
      homeLinkProps={{
        href: "/decommissionnement",
        title: "Tableau de bord de l'apprentissage",
      }}
      id="fr-header-decommissionnement"
      serviceTitle={<>Tableau de bord de l&apos;apprentissage</>}
      quickAccessItems={[<Impersonate key="impersonate" />, <LogoutMenu key="logout-menu" />]}
      disableDisplay
    />
  );
}
